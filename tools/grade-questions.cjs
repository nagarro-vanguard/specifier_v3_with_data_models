#!/usr/bin/env node
'use strict';
// grade-questions.cjs — places every question in the Question log in its group, sets the order they are asked in,
// and checks the log and the gaps that point to it.
//
//   node tools/grade-questions.cjs --project <p> [--check-only]
//
// What it does, in order:
//   1. reads the grid from templates/question-log.md, its only home
//   2. reads every question in the project's Question log, with its parts and its two ratings
//   3. places each open question in the group the grid gives it, in the grid's order and then by number, and each
//      answered question under Answered, in number order. It rewrites only those four sections of the log.
//      With --check-only it changes nothing, and reports each move it would make.
//   4. checks that every question has all its parts, two ratings each with a reason, answers that are the real
//      choices (none starts with "Yes" or "No") plus "I don't know yet", a reason for asking that cites a file or
//      says no file speaks to it, and a next best action
//   5. checks that every gap in the project's documents names a question that is in the log
//   6. checks that the log's copy of the grid matches the template
//   7. prints three blocks: For the person, One line, and For the file
//
// An open question is never a finding: a document can be accepted while questions are open.
// Exit codes: 0 no findings; 1 findings; 2 the project, the template or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.
//
// It can also be required: grade(project, opts) returns { questions, open, counts, order, findings, moves, notes }.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');

const TEMPLATE = path.join(rp.KIT_ROOT, '.claude', 'skills', '_shared', 'templates', 'question-log.md');
const GROUPS = ['Must answer', 'Should answer', 'Can move ahead'];
const SECTIONS = [...GROUPS, 'Answered'];
const PARTS = ['Raised in', "Why I'm asking", 'For example', 'What it changes', 'Impact', 'Severity', 'Answers', 'Recommended', 'Answer in use for now', 'Who can answer', 'Answer by', 'Next best action'];
const ANSWERED_PARTS = ['Answer', 'Decided in'];
// The labels that mark a gap (conventions.md, "Unknowns"). Each one must name its question, such as "TBD, question 12".
const GAP = /TBD|Proposed \(needs confirmation\)|\[Not specified in provided sources\]|\[Needs source excerpt\]/g;
const CITES_A_FILE = /\b[\w.-]+\.(md|docx?|pdf|xlsx?|csv|txt|eml|pptx?)\b|no file speaks to it/i;

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function text(cell) {
  return Array.isArray(cell) ? cell.join(' ') : String(cell || '').trim();
}

// The grid, from the template: { "High|Medium": { order: 2, group: "Must answer" } }.
function readGrid(file) {
  const rows = md.tableUnder(file, 'The grid');
  if (!rows || rows.length !== 9) throw new rp.LayoutError(`The grid in ${file} must have nine rows.`);
  const grid = {};
  for (const r of rows) grid[`${r.Severity}|${r.Impact}`] = { order: Number(r.Order), group: r.Group };
  return grid;
}

// The log split into its parts: the text before the question sections, each section's heading and opening line,
// each question's block, and the text from the Check record on.
function readLog(textOfLog) {
  const lines = textOfLog.split('\n');
  const sectionAt = {};
  let checkAt = -1;
  lines.forEach((l, i) => {
    const h = l.match(/^## (.*)$/);
    if (!h) return;
    const name = md.normalize(h[1]);
    const s = SECTIONS.find((x) => x.toLowerCase() === name);
    if (s) sectionAt[s] = i;
    if (name === 'check record' && checkAt < 0) checkAt = i;
  });
  const problems = [];
  for (const s of SECTIONS) if (sectionAt[s] === undefined) problems.push(`The log has no "${s}" section.`);
  if (checkAt < 0) problems.push('The log has no "Check record" section.');
  if (problems.length) return { problems };
  const order = SECTIONS.map((s) => sectionAt[s]);
  if (order.some((n, i) => i > 0 && n < order[i - 1]) || checkAt < order[order.length - 1]) {
    return { problems: ['The log\'s sections are out of order: Must answer, Should answer, Can move ahead, Answered, then Check record.'] };
  }

  const questions = [];
  const heads = {};
  SECTIONS.forEach((s, k) => {
    const start = sectionAt[s];
    const end = k + 1 < SECTIONS.length ? sectionAt[SECTIONS[k + 1]] : checkAt;
    const body = lines.slice(start + 1, end);
    const firstQ = body.findIndex((l) => /^### /.test(l));
    const intro = trimEnd((firstQ < 0 ? body : body.slice(0, firstQ)).filter((l) => l.trim() !== 'None yet.'));
    while (intro.length && intro[0].trim() === '') intro.shift();
    // A heading with nothing under it but its questions is followed straight by them, after one blank line.
    heads[s] = intro.length ? [lines[start], '', ...intro] : [lines[start]];
    if (firstQ < 0) return;
    let cur = null;
    for (const l of body.slice(firstQ)) {
      const q = l.match(/^### Question (\d+): (.*)$/);
      if (q) {
        cur = { n: Number(q[1]), title: q[2].trim(), section: s, lines: [l] };
        questions.push(cur);
      } else if (/^### /.test(l)) {
        cur = { n: null, title: l.slice(4).trim(), section: s, lines: [l], malformed: true };
        questions.push(cur);
      } else if (cur) cur.lines.push(l);
    }
  });
  for (const q of questions) {
    q.lines = trimEnd(q.lines);
    const rows = md.tableUnder(`# Q\n\n## Block\n\n${q.lines.slice(1).join('\n')}\n`, 'Block') || [];
    q.parts = {};
    for (const r of rows) if (r.Part) q.parts[text(r.Part)] = r['What it says'];
  }
  return {
    before: lines.slice(0, sectionAt[SECTIONS[0]]),
    heads,
    questions,
    after: lines.slice(checkAt),
    problems: [],
  };
}

function trimEnd(arr) {
  const out = [...arr];
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  while (out.length && out[0].trim() === '') out.shift();
  return out;
}

function level(cell) {
  const m = text(cell).match(/^(High|Medium|Low)\.\s+\S/);
  return m ? m[1] : null;
}

function checkQuestion(q, grid) {
  const f = [];
  const name = q.n ? `Question ${q.n}` : `"${q.title}"`;
  if (q.malformed) f.push(`${name}: its heading must read "Question {number}: {the question}".`);
  const marks = (q.title.match(/\?/g) || []).length;
  if (!q.title.endsWith('?') || marks !== 1) f.push(`${name}: it must be one question, ending in a single question mark.`);
  const answered = text(q.parts.Answer) !== '';
  for (const p of [...PARTS, ...(answered || q.section === 'Answered' ? ANSWERED_PARTS : [])]) {
    if (!(p in q.parts) || text(q.parts[p]) === '') f.push(`${name}: it has no "${p}".`);
  }
  const imp = level(q.parts.Impact);
  const sev = level(q.parts.Severity);
  if ('Impact' in q.parts && !imp) f.push(`${name}: its impact must read High, Medium or Low, then the reason.`);
  if ('Severity' in q.parts && !sev) f.push(`${name}: its severity must read High, Medium or Low, then the reason.`);
  if ("Why I'm asking" in q.parts && text(q.parts["Why I'm asking"]) && !CITES_A_FILE.test(text(q.parts["Why I'm asking"]))) {
    f.push(`${name}: "Why I'm asking" must cite a file, or say that no file speaks to it.`);
  }
  const answers = md.list(q.parts.Answers);
  if ('Answers' in q.parts) {
    const unknown = answers.filter((a) => /^\*\*I don't know yet\*\*/.test(a));
    const real = answers.filter((a) => !/^\*\*I don't know yet\*\*/.test(a));
    if (unknown.length !== 1) f.push(`${name}: its answers must offer "I don't know yet", once.`);
    if (real.length < 2) f.push(`${name}: it must offer at least two real answers.`);
    for (const a of real) {
      const m = a.match(/^\*\*(.+?)\*\*\.?\s*(.*)$/);
      if (!m) { f.push(`${name}: the answer "${a.slice(0, 40)}" must start with its name in bold.`); continue; }
      if (/^(yes|no)\b/i.test(m[1])) f.push(`${name}: the answer "${m[1]}" starts with "Yes" or "No". Word the question so its answers are the real choices.`);
      if (!/Why you'd pick it:/.test(m[2]) || !/What happens next:/.test(m[2])) f.push(`${name}: the answer "${m[1]}" must say why you'd pick it and what happens next.`);
    }
  }
  q.answered = answered;
  q.impact = imp;
  q.severity = sev;
  q.rank = imp && sev ? grid[`${sev}|${imp}`] : null;
  q.group = answered ? 'Answered' : q.rank ? q.rank.group : q.section;
  return f;
}

// Every gap in the project's documents, outside the Question log, the Version log and the Glossary.
function gapsIn(projectDir, logRel) {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(projectDir, p).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (!['version-log', 'glossary', 'sources', 'design'].includes(rel)) walk(p);
      } else if (rel.endsWith('.md') && rel !== logRel) out.push(...gapsInFile(p, rel));
    }
  };
  walk(projectDir);
  return out;
}

function gapsInFile(file, rel) {
  const out = [];
  let fence = false;
  let skip = false;
  rp.readText(file).split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const h = line.match(/^##\s+(.*)$/);
    if (h) skip = ['decision record', 'your decision', 'check record', 'placeholders'].includes(md.normalize(h[1]));
    // Skipped: the italic line under a heading, which states a rule, and a tracker's work item ID, which stays TBD on purpose.
    if (skip || /^\s*\*[^*]/.test(line) || /Work item/i.test(line)) return;
    for (const m of line.matchAll(GAP)) {
      // The question is named in the same cell, after the label: up to the next "|" or line break in a cell.
      const rest = line.slice(m.index + m[0].length).split(/\||<br>/)[0];
      const named = rest.match(/question (\d+)/i);
      out.push({ rel, line: i + 1, label: m[0], question: named ? Number(named[1]) : null });
    }
  });
  return out;
}

function grade(project, opts = {}) {
  if (!fs.existsSync(TEMPLATE)) throw new rp.LayoutError(`The Question log template is missing: ${TEMPLATE}`);
  const grid = readGrid(TEMPLATE);
  const projectDir = rp.projectDir(project, opts);
  if (!fs.existsSync(projectDir)) throw new rp.LayoutError(`The project folder doesn't exist: ${projectDir}`);
  const logRel = rp.relOf('question-log', { product: project });
  const logPath = path.join(projectDir, logRel);
  const result = { logRel, questions: [], open: [], counts: {}, order: [], findings: [], moves: [], notes: [] };

  let log = null;
  if (fs.existsSync(logPath)) {
    log = readLog(rp.readText(logPath));
    result.findings.push(...log.problems);
  } else {
    result.notes.push('There is no Question log yet.');
  }

  if (log && !log.problems.length) {
    // The log's copy of the grid must match the template.
    const copy = md.tableUnder(logPath, 'The grid') || [];
    const mine = copy.map((r) => `${r.Order}|${r.Severity}|${r.Impact}|${r.Group}`).join('\n');
    const theirs = md.tableUnder(TEMPLATE, 'The grid').map((r) => `${r.Order}|${r.Severity}|${r.Impact}|${r.Group}`).join('\n');
    if (mine !== theirs) result.findings.push("The log's copy of the grid doesn't match the template's.");

    const seen = new Set();
    for (const q of log.questions) {
      if (q.n !== null) {
        if (seen.has(q.n)) result.findings.push(`Question ${q.n} appears twice.`);
        seen.add(q.n);
      }
      result.findings.push(...checkQuestion(q, grid));
      if (q.group !== q.section) result.moves.push(`Question ${q.n} moves from ${q.section} to ${q.group}.`);
    }
    result.questions = log.questions;

    // The order inside each section: open questions by the grid, then by number; answered ones by number.
    const sortKey = (q) => (q.group === 'Answered' ? [0, q.n] : [q.rank ? q.rank.order : 99, q.n]);
    for (const s of SECTIONS) {
      const now = log.questions.filter((q) => q.section === s).map((q) => q.n);
      const want = log.questions.filter((q) => q.group === s).sort((a, b) => cmp(sortKey(a), sortKey(b))).map((q) => q.n);
      if (now.join() !== want.join() && now.length && want.join() !== now.join()) result.moves.push(`${s} is put in order: ${want.map((n) => `question ${n}`).join(', ')}.`);
    }

    result.open = log.questions.filter((q) => q.group !== 'Answered').sort((a, b) => cmp(sortKey(a), sortKey(b)));
    for (const g of GROUPS) result.counts[g] = result.open.filter((q) => q.group === g).length;
    result.counts.Answered = log.questions.filter((q) => q.group === 'Answered').length;
    result.order = result.open.map((q) => ({ n: q.n, group: q.group, title: q.title, severity: q.severity, impact: q.impact }));

    if (!opts.checkOnly && result.moves.length) {
      const blocks = (s) => log.questions.filter((q) => q.group === s).sort((a, b) => cmp(sortKey(a), sortKey(b)));
      const out = [...log.before];
      for (const s of SECTIONS) {
        out.push(...log.heads[s], '');
        const qs = blocks(s);
        if (!qs.length) out.push('None yet.', '');
        for (const q of qs) out.push(...q.lines, '');
      }
      out.push(...log.after);
      rp.writeText(logPath, out.join('\n'));
    }
  }

  // Every gap must name a question that is in the log.
  const numbers = new Set(result.questions.map((q) => q.n));
  const answered = new Set(result.questions.filter((q) => q.group === 'Answered').map((q) => q.n));
  for (const g of gapsIn(projectDir, logRel)) {
    if (g.question === null) result.findings.push(`${g.rel}, line ${g.line}: "${g.label}" names no question. Write it as "${g.label}, question {number}".`);
    else if (!numbers.has(g.question)) result.findings.push(`${g.rel}, line ${g.line}: "${g.label}" names question ${g.question}, which isn't in the Question log.`);
    else if (answered.has(g.question)) result.notes.push(`${g.rel}, line ${g.line}: question ${g.question} is answered, and the document will show the answer once the change that brings it in is accepted.`);
  }
  return result;
}

function cmp(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function report(project, r, date) {
  const open = r.open.length;
  const counts = `${r.counts['Must answer'] || 0} must answer, ${r.counts['Should answer'] || 0} should answer, ${r.counts['Can move ahead'] || 0} can move ahead`;
  const person = [];
  person.push(r.questions.length || open ? `${plural(open, 'open question')}: ${counts}. ${r.counts.Answered || 0} answered.` : 'No questions yet.');
  if (open) {
    person.push('The order they are asked in:');
    // Each line shows the two ratings, so you see why a question is in its group without opening the log.
    for (const q of r.order) person.push(`- question ${q.n}, ${q.group.toLowerCase()} (${q.severity && q.impact ? `severity ${q.severity}, impact ${q.impact}` : "not rated"}): ${q.title}`);
  }
  for (const m of r.moves) person.push(`- moved: ${m}`);
  for (const n of r.notes) person.push(`- note: ${n}`);
  if (r.findings.length) {
    person.push(`${plural(r.findings.length, 'finding')}:`);
    for (const f of r.findings) person.push(`- ${f}`);
  }
  const line = `Question log: ${plural(open, 'open question')} (${counts}), ${plural(r.findings.length, 'finding')}.`;
  const file = [`grade-questions.cjs, ${date}: ${plural(open, 'open question')} (${counts}), ${r.counts.Answered || 0} answered, ${plural(r.findings.length, 'finding')}.`];
  for (const f of r.findings) file.push(`- ${f}`);
  return ['For the person:', ...person, '', 'One line:', line, '', 'For the file:', ...file, ''].join('\n');
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/grade-questions.cjs --project <p> [--check-only]', 2);
  const date = args.date && args.date !== true ? args.date : today();
  const r = grade(args.project, { output: args.output, checkOnly: Boolean(args['check-only']) });
  process.stdout.write(report(args.project, r, date));
  return r.findings.length ? 1 : 0;
}

module.exports = { grade, readGrid, gapsIn, gapsInFile, TEMPLATE };

if (require.main === module) rp.run(main);
