#!/usr/bin/env node
'use strict';
// insert-answer.cjs — writes a late answer into every place the documents name its question, and nothing else.
//
//   node tools/insert-answer.cjs --project <p> --change <nnn> --question <n>
//
// It runs only after you chose "Insert it" at the change's gate, so the change's report is accepted and its progress
// exists.
//
// What it does:
//   1. reads the answer from the Question log: the question, under Answered, with its Answer and Decided in
//   2. finds every gap that names the question, as grade-questions.cjs finds them, in every document that exists,
//      drafted or accepted. Records are left alone: the Discovery brief, the Question log and the changes' reports.
//      grade-questions.cjs leaves the glossary folder out, so the data model files are added here, found through
//      lib/data-model.cjs. That is where the data model writes an answer the PRD left open, until it is confirmed.
//   3. works out each place's new words. The source is where the answer was decided, such as
//      "per change 002, Decision 1".
//      - "TBD, question 7", alone in a table cell: the answer, then the source. When the answer has one line per
//        label, such as "Working days from sending a claim to paying it: 10 working days", each cell takes the line
//        whose label is its row's first cell.
//      - "Proposed (needs confirmation), question 4": when the answer confirms the answer in use, the words before
//        it stay, and the label becomes the source
//      - in a data model file, "up to 2 times, Proposed (needs confirmation), question 7": when the answer confirms
//        the answer in use, the answer stays and its mark goes, so the cell reads "up to 2 times". A data model file
//        cites no source.
//   4. refuses, and writes nothing, when any place would need other words changed: a TBD outside a table cell with
//      a labelled answer, a cell whose row matches no label, a Proposed value the answer doesn't confirm, a data model
//      file's gap that isn't a Proposed answer, or any other label. The change then needs the path for its kind,
//      which runs data-model-author for a data model file.
//   5. writes every place, and records each one in the change's progress, under "Places written"
//   6. runs accept.cjs for each accepted document it changed, so each gets a new version. A drafted document keeps
//      the answer in its next draft.
//   7. checks that no gap outside the records still names the question, in the data model files too
//
// Exit codes: 0 written; 1 refused, or the change's decision isn't "Insert it", or the question isn't answered;
// 2 the change, its report, its progress, the Question log or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD>.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const cr = require('./lib/change-report.cjs');
const dm = require('./lib/data-model.cjs');
const gq = require('./grade-questions.cjs');

const text = (c) => md.list(c).map((x) => String(x).trim()).join(' ').trim();
const bare = (s) => s.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
const PROPOSED = ', Proposed (needs confirmation)';
const isDataModel = (rel) => Boolean(rp.identify(rel) && rp.identify(rel).document === 'data-model');

// The data model files that are written, each { file, rel }. A project with no things file has none.
function dataModelFiles(project, opts) {
  if (!fs.existsSync(rp.pathOf(project, 'data-model-things', {}, opts))) return [];
  return dm.load(project, { ...opts, allowMissing: true }).files.filter((f) => f.exists).map((f) => ({ file: f.file, rel: f.rel }));
}

// A data model cell's Proposed answer to question n, on one line: its words, from the start of its cell or its list
// item, with and without the mark. Null when the line has no words before the mark.
function proposedIn(line, n) {
  const m = line.match(new RegExp(`(\\||<br>)((?:(?!<br>)[^|])*?),\\s*Proposed \\(needs confirmation\\),\\s*question ${n}(?!\\d)`));
  if (!m) return null;
  const before = m[0].slice(m[1].length).replace(/^\s*(?:•\s*)?/, '');
  const after = before.replace(/,\s*Proposed \(needs confirmation\),\s*question \d+$/, '').trim();
  return after ? { before, after } : null;
}

// The documents that are records: they name a question, and the Question log holds its answer.
function isRecord(project, rel, opts) {
  const id = rp.identify(rel);
  return !id || ['discovery-brief', 'question-log', 'change-impact-report', 'check-findings', 'change-progress'].includes(id.document);
}

// Where an answer was decided, as a source: "per change 002, Decision 1" or "per expense-claims-brd.md, Decision 3".
function sourceOf(decidedIn) {
  const s = text(decidedIn);
  const n = s.match(/Decision (\d+)/);
  const change = s.match(/changes\/(\d{3})-/);
  const where = change ? `change ${change[1]}` : bare(s.split(',')[0]);
  return `per ${where}${n ? `, Decision ${n[1]}` : ''}`;
}

function answerOf(project, n, opts) {
  const graded = cd.questions(project, opts);
  const q = (graded.questions || []).find((x) => x.n === Number(n));
  if (!q) return { error: `Question ${n} isn't in the Question log.` };
  if (q.group !== 'Answered') return { error: `Question ${n} isn't answered yet: write its Answer and Decided in, under Answered in the Question log, first.` };
  const lines = md.list(q.parts.Answer).map((x) => String(x).trim()).filter(Boolean);
  const labelled = lines.length > 1 && lines.every((l) => /^[^:]+:\s+\S/.test(l));
  const byLabel = new Map(labelled ? lines.map((l) => { const m = l.match(/^([^:]+):\s+(.+)$/); return [bare(m[1]).toLowerCase(), m[2].trim()]; }) : []);
  const inUse = text(q.parts['Answer in use for now']).replace(PROPOSED, '').trim();
  return { q, labelled, byLabel, whole: lines.join(' '), inUse, impact: (text(q.parts.Impact).match(/^(High|Medium|Low)\b/) || [])[1] || null, source: sourceOf(q.parts['Decided in']) };
}

// Every place the question's gaps would be written, and every place refused, with why.
function places(project, n, opts = {}) {
  const a = answerOf(project, n, opts);
  if (a.error) return { error: a.error, places: [], refused: [] };
  const projectDir = rp.projectDir(project, opts);
  const logRel = rp.relOf('question-log', { product: project });
  const out = { answer: a, places: [], refused: [] };
  const confirms = a.whole.toLowerCase() === a.inUse.toLowerCase();
  const gaps = [...gq.gapsIn(projectDir, logRel), ...dataModelFiles(project, opts).flatMap((f) => gq.gapsInFile(f.file, f.rel))];
  for (const g of gaps) {
    if (g.question !== Number(n) || isRecord(project, g.rel, opts)) continue;
    const line = rp.readText(path.join(projectDir, g.rel)).split('\n')[g.line - 1];
    const refuse = (why) => out.refused.push({ rel: g.rel, line: g.line, why });
    const gap = `${g.label}, question ${n}`;
    if (isDataModel(g.rel)) {
      // A data model file cites no source: a confirmed answer keeps its words, and loses its mark.
      if (g.label !== 'Proposed (needs confirmation)') { refuse(`a data model file holds only a Proposed answer, so "${g.label}" needs data-model-author`); continue; }
      if (!confirms) { refuse(`the answer, "${a.whole}", doesn't confirm the answer in use, "${a.inUse}", so the data model's answer would change`); continue; }
      const p = proposedIn(line, n);
      if (!p) { refuse('the Proposed answer has no words before its mark'); continue; }
      const cells = line.trim().startsWith('|') ? line.split('|').slice(1, -1).map((c) => c.trim()) : null;
      out.places.push({ rel: g.rel, line: g.line, where: cells ? bare(cells[0]) : `line ${g.line}`, before: p.before, after: p.after });
      continue;
    }
    if (g.label === 'TBD') {
      const cells = line.trim().startsWith('|') ? line.split('|').slice(1, -1).map((c) => c.trim()) : null;
      if (cells && cells.includes(gap)) {
        const label = bare(cells[0]);
        const value = a.labelled ? a.byLabel.get(label.toLowerCase()) : a.whole;
        if (!value) { refuse(`its row, "${label}", matches no line of the answer`); continue; }
        out.places.push({ rel: g.rel, line: g.line, where: label, before: gap, after: `${value}, ${a.source}` });
      } else if (!a.labelled && line.includes(gap)) {
        out.places.push({ rel: g.rel, line: g.line, where: `line ${g.line}`, before: gap, after: `${a.whole}, ${a.source}` });
      } else refuse('the gap isn\'t alone in a table cell, and the answer has a line for each label');
    } else if (g.label === 'Proposed (needs confirmation)') {
      if (!confirms) { refuse(`the answer, "${a.whole}", doesn't confirm the answer in use, "${a.inUse}", so the words before the gap would change`); continue; }
      out.places.push({ rel: g.rel, line: g.line, where: `line ${g.line}`, before: gap, after: a.source });
    } else refuse(`"${g.label}" says something is missing from a source, which an answer doesn't fill`);
  }
  // In the order of the flow, as the layout lists the documents, then by line.
  const order = Object.keys(rp.layout());
  const rank = (rel) => order.indexOf((rp.identify(rel) || {}).document);
  for (const list of [out.places, out.refused]) list.sort((a, b) => rank(a.rel) - rank(b.rel) || a.rel.localeCompare(b.rel) || a.line - b.line);
  return out;
}

// Runs accept.cjs for each accepted document in the list, so each gets a new version. A drafted one is left as it is.
// The status line is read in any case, because a data model file written before the kit's document shape says
// "Accepted on {date}".
function acceptAgain(project, rels, args) {
  const projectDir = rp.projectDir(project, { output: args.output });
  const lines = [];
  for (const rel of rels) {
    const status = dm.statusOf(rp.readText(path.join(projectDir, rel))).state;
    if (status !== 'accepted') { lines.push(`- ${rel}: ${status || 'drafted'}, so it keeps the new words in its next draft.`); continue; }
    const extra = [];
    if (args.output) extra.push('--output', args.output);
    if (args.date && args.date !== true) extra.push('--date', args.date);
    const a = spawnSync(process.execPath, [path.join(__dirname, 'accept.cjs'), '--project', project, '--document', rel, ...extra], { encoding: 'utf8' });
    if (a.status !== 0) return { lines: [...lines, `${a.stdout}${a.stderr}`.trim()], code: a.status || 2 };
    lines.push(`- ${rel}: accepted again, as version ${(a.stdout.match(/as version (\d+)/) || [])[1]}.`);
  }
  return { lines, code: 0 };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  const n = args.question;
  if (!args.project || args.project === true || !change || change === true || !n || n === true) rp.fail('Use: node tools/insert-answer.cjs --project <p> --change <nnn> --question <n>', 2);
  const opts = { output: args.output };
  const r = cr.read(args.project, change, opts);
  if (r.choice !== 'Insert it') {
    process.stdout.write(`Change ${r.change.number}'s decision is ${r.choice ? `"${r.choice}"` : 'not made yet'}, not "Insert it": nothing is written.\n`);
    return 1;
  }
  const progress = rp.pathOf(args.project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(progress)) throw new rp.LayoutError(`The change has no progress yet: ${progress}. It is written when the change's report is accepted.`);

  const p = places(args.project, n, opts);
  if (p.error) { process.stdout.write(`${p.error}\n`); return 1; }
  if (p.refused.length) {
    process.stdout.write(`Nothing is written: ${cd.plural(p.refused.length, 'place')} would need other words changed, so the change needs the path for its kind, in section 15.\n`);
    for (const x of p.refused) process.stdout.write(`- ${x.rel}, line ${x.line}: ${x.why}\n`);
    return 1;
  }

  const projectDir = rp.projectDir(args.project, opts);
  const docs = [...new Set(p.places.map((x) => x.rel))];
  for (const rel of docs) {
    const file = path.join(projectDir, rel);
    const all = rp.readText(file).split('\n');
    for (const x of p.places.filter((y) => y.rel === rel)) all[x.line - 1] = all[x.line - 1].replace(x.before, x.after);
    rp.writeText(file, all.join('\n'));
  }
  cd.replaceSection(progress, 'Places written', ['| Document | Where | Before | After |', '|---|---|---|---|', ...p.places.map((x) => `| ${x.rel} | ${x.where} | ${x.before} | ${x.after} |`)]);

  const out = [`insert-answer.cjs: question ${n}'s answer written in ${cd.plural(p.places.length, 'place')}, in ${cd.plural(docs.length, 'document')}.`];
  const again = acceptAgain(args.project, docs, args);
  out.push(...again.lines);
  if (again.code) { process.stdout.write(`${out.join('\n')}\n`); return again.code; }
  const gapsNow = [...gq.gapsIn(projectDir, rp.relOf('question-log', { product: args.project })), ...dataModelFiles(args.project, opts).flatMap((f) => gq.gapsInFile(f.file, f.rel))];
  const left = gapsNow.filter((g) => g.question === Number(n) && !isRecord(args.project, g.rel, opts));
  out.push(left.length ? `${cd.plural(left.length, 'gap')} still name question ${n}.` : `No gap outside the records still names question ${n}.`);
  process.stdout.write(`${out.join('\n')}\n`);
  return left.length ? 1 : 0;
}

module.exports = { places, sourceOf, acceptAgain, isRecord };

if (require.main === module) rp.run(main);
