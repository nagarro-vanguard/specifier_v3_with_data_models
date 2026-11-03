#!/usr/bin/env node
'use strict';
// check-change-report.cjs — checks a Change impact report before your yes, at step 5 of change-request-workflow, and prints the three
// blocks the gate needs.
//
//   node tools/check-change-report.cjs --project <p> --change <nnn>
//
// What it checks:
//   - the opening blocks, and every section of the template, 1 to 16 and the Check record, in order
//   - section 1 holds at least one request, each numbered, called a change request, a new request or a late answer
//   - every word found in section 4 says how it was settled
//   - section 5 has its "Agreed words this change renames" part, which says None when the change renames none
//   - every ask in section 5 has its row in section 6, with at least one ID, and in section 7
//   - section 6 has its "Data model" column. Every thing that column names is in the things file, read through
//     lib/data-model.cjs. An item is "{Thing}, {action, field or move}", or a thing alone when the ask adds to it.
//   - each ask's kind is one of the five
//   - every rule the update test compared has one of its results: same, opposite, changed value, new, or wording only.
//     A rule found opposite or changed value makes the kind Update or optimize, and so does wording only.
//   - a blocker in section 10 names its question, and that question is in the Question log
//   - the challenge in section 11 has its verdict, and the verdict is PASS, PASS_WITH_FINDINGS, or "FAIL, taken to your
//     gate", which change-request-disposition writes after a second FAIL in a row. A plain FAIL is a finding.
//   - each finding in section 11 has a quote, found word for word in the file its From column names, what it would
//     change, and who can fix it. A finding that needs your answer names its question in the Question log.
//   - the verdict is the one the fixed rule gives: FAIL when a finding would change the type, what's new or what
//     blocks, PASS_WITH_FINDINGS for any other finding, PASS for none
//   - sections 5 and 7 to 10 use no word the Glossary retired, through lib/scan-retired-words.cjs
//   - every linked item in section 12 has a judgement in section 13, and nothing else does. Each judgement is No change,
//     Update, New story or Split.
//   - section 14 has the size and its rule, as size-rules.cjs gives them now
//   - section 15 is the recommendation recommend.cjs gives now: the path for the kind, glossary-disposition first when
//     the change renames an agreed word, "Insert it" or "Copy the wording" only where a small update fits, and the
//     re-run offered when the change reaches most of the business requirements
//   - no placeholder is left, and lib/md-lint.cjs finds nothing
//   - grade-questions.cjs finds nothing wrong with the report's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the change, its report, the map or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const cr = require('./lib/change-report.cjs');
const dm = require('./lib/data-model.cjs');
const sr = require('./size-rules.cjs');
const rc = require('./recommend.cjs');
const sw = require('./lib/scan-retired-words.cjs');

const text = (c) => md.list(c).map((x) => String(x).trim()).join(' ').trim();
const same = (a, b) => a.map((l) => l.trimEnd()).join('\n').trim() === b.map((l) => l.trimEnd()).join('\n').trim();
// The lines a section holds, below the lines in italics that say what it holds.
const held = (t, heading) => {
  const lines = cr.section(t, heading) || [];
  let i = 0;
  while (i < lines.length && (!lines[i].trim() || /^\*[^*].*\*$/.test(lines[i].trim()))) i++;
  return lines.slice(i);
};

// What the fixed rule gives for the findings of section 11.
function verdictOf(findings) {
  if (findings.some((f) => cr.WOULD_CHANGE.slice(0, 3).includes(f.wouldChange))) return 'FAIL';
  return findings.length ? 'PASS_WITH_FINDINGS' : 'PASS';
}

// Text with its line endings and runs of spaces made one space, so a quote copied from a file is found in it.
const flat = (s) => String(s).replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim();

function findingFindings(project, r, numbers, opts) {
  const out = [];
  const dir = rp.projectDir(project, opts);
  for (const f of r.findings) {
    const at = `Finding ${f.n}`;
    if (!f.quote) out.push(`${at} has no quote.`);
    if (!f.from) out.push(`${at} doesn't say which file its quote is from.`);
    else {
      const file = path.join(dir, f.from.replace(/^`|`$/g, ''));
      if (!fs.existsSync(file)) out.push(`${at}: its file, ${f.from}, isn't in the project.`);
      else if (f.quote && !flat(rp.readText(file)).includes(flat(f.quote.replace(/^"|"$/g, '')))) out.push(`${at}: its quote isn't in ${f.from}, word for word.`);
    }
    if (!cr.WOULD_CHANGE.includes(f.wouldChange)) out.push(`${at}: "${f.wouldChange}" isn't what a finding can change: ${cr.WOULD_CHANGE.join(', ')}.`);
    if (!cr.WHO_CAN_FIX.includes(f.whoCanFix)) out.push(`${at}: "${f.whoCanFix}" isn't who can fix it: ${cr.WHO_CAN_FIX.join(' or ')}.`);
    if (f.whoCanFix === 'needs your answer') {
      const q = (f.answer.match(/question (\d+)/i) || [])[1];
      if (!q || !numbers.has(Number(q))) out.push(`${at} needs your answer, so its Answer names its question in the Question log.`);
    }
  }
  const rule = verdictOf(r.findings);
  if (r.verdict && r.verdict !== rule) out.push(`The verdict is ${r.verdict}, but the fixed rule gives ${rule} for these findings.`);
  return out;
}

// Sections 5 and 7 to 10 use the Glossary's agreed words, when the project has a Glossary.
function retiredFindings(project, t, opts) {
  if (!fs.existsSync(path.join(rp.projectDir(project, opts), 'glossary', 'object-terms.md'))) return [];
  const retired = sw.retiredWords(project, opts);
  if (!retired.length) return [];
  const current = sw.currentTerms(project, opts);
  const out = [];
  for (const [n, heading] of [[5, 'Restated, and split if several asks'], [7, 'Its kind'], [8, 'The journey'], [9, "What's reused, and what's new"], [10, 'What blocks']]) {
    for (const h of sw.scan((cr.section(t, heading) || []).join('\n'), retired, current, 'change-impact-report')) {
      out.push(`Section ${n}: "${h.word}" is a word the Glossary retired. Use ${h.useNow.join(' or ') || 'another plain word'}.`);
    }
  }
  return out;
}

function check(project, change, opts = {}) {
  const r = cr.read(project, change, opts);
  const doc = cd.load(project, 'change-impact-report', { change: r.change.folder }, opts);
  const t = doc.text;
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Opening', cd.opening(t));
  add('Sections', cd.sections(t, 'change-impact-report'));

  const reqFindings = [];
  if (!r.requests.length) reqFindings.push('Section 1 holds no request.');
  for (const q of r.requests) {
    if (!cr.CALLED.includes(q.called)) reqFindings.push(`Request ${q.n} is called "${q.called}": it is one of ${cr.CALLED.join(', ')}.`);
    if (!q.words) reqFindings.push(`Request ${q.n} has no words.`);
  }
  add('Requests', reqFindings);

  const found = (md.tableUnder(t, 'Check findings on documents from outside') || []).filter((x) => text(x['Word found']) && !/^none$/i.test(text(x['Word found'])));
  add('Words found', found.filter((x) => !text(x['Settled as'])).map((x) => `"${text(x['Word found'])}" doesn't say how it was settled at glossary-disposition's gate.`));

  const renames = cr.section(t, 'Restated, and split if several asks') || [];
  const at = renames.findIndex((l) => /^### Agreed words this change renames/.test(l.trim()));
  const after = at < 0 ? [] : renames.slice(at + 1).filter((l) => l.trim() && !/^\*[^*].*\*$/.test(l.trim()));
  add('Agreed words renamed', at < 0 ? ['Section 5 has no "Agreed words this change renames" part.'] : !after.length ? ['"Agreed words this change renames" is empty: it says None when the change renames none.'] : []);

  const askFindings = [];
  if (!r.asks.length) askFindings.push('Section 5 restates no ask.');
  for (const a of r.asks) {
    const land = r.lands.find((l) => l.ask === a.n);
    if (!land) askFindings.push(`Ask ${a.n} has no row in section 6.`);
    else if (!land.ids.length && !r.kinds.some((k) => k.ask === a.n && k.kind === 'Net new')) askFindings.push(`Ask ${a.n} lands on nothing in section 6: only a Net new ask may.`);
    if (!r.kinds.some((k) => k.ask === a.n)) askFindings.push(`Ask ${a.n} has no row in section 7.`);
  }
  // The Data model column: each thing it names must be in the things file. An item is a thing, or starts with a thing
  // and a comma, so a thing whose name holds a comma still reads.
  if (r.lands.length && !r.dataModelColumn) askFindings.push('Section 6 has no "Data model" column: it says None for an ask that touches no thing.');
  const named = r.lands.flatMap((l) => l.dataModel.map((item) => ({ ask: l.ask, item })));
  if (named.length) {
    const thingsFile = rp.pathOf(project, 'data-model-things', {}, opts);
    if (!fs.existsSync(thingsFile)) askFindings.push(...named.map((x) => `Ask ${x.ask}: "${x.item}", in the Data model column, names a thing, but the project has no things file yet.`));
    else {
      const things = dm.readThings(thingsFile).families.flatMap((f) => f.things.map((t) => text(t.Thing))).filter(Boolean);
      for (const x of named) {
        if (!things.some((t) => x.item === t || x.item.startsWith(`${t}, `))) askFindings.push(`Ask ${x.ask}: "${x.item}", in the Data model column, names no thing in the things file.`);
      }
    }
  }
  add('Asks', askFindings);

  add('Kind', r.kinds.filter((k) => !cr.KINDS.includes(k.kind)).map((k) => `Ask ${k.ask}'s kind, "${k.kind}", isn't one of the five: ${cr.KINDS.join(', ')}.`));

  const testFindings = [];
  for (const k of r.kinds) {
    for (const x of k.tests) if (!cr.RESULTS.includes(x.result)) testFindings.push(`Ask ${k.ask}: ${x.id}'s result, "${x.result}", isn't one of: ${cr.RESULTS.join(', ')}.`);
    const changes = k.tests.some((x) => ['opposite', 'changed value', 'wording only'].includes(x.result));
    if (changes && k.kind !== 'Update or optimize') testFindings.push(`Ask ${k.ask}: the update test finds a rule changed, so its kind is Update or optimize, not ${k.kind}.`);
    if (!k.fit && !['Blocked'].includes(k.kind)) testFindings.push(`Ask ${k.ask}: the test that decided it doesn't give the Feature Fit verdict first.`);
  }
  add('The update test', testFindings);

  const graded = cd.questions(project, opts);
  const numbers = new Set((graded.questions || []).map((q) => q.n));
  add('Blockers', r.blockers.map((b) => {
    const q = (b.match(/question (\d+)/i) || [])[1];
    if (!q) return `"${b}" names no question in the Question log.`;
    return numbers.has(Number(q)) ? null : `"${b}" names question ${q}, which isn't in the Question log.`;
  }).filter(Boolean));

  add('The challenge', !r.verdict ? ['Section 11 has no "**Verdict:**" line from adversarial-check.'] : r.verdict === 'FAIL' && !r.verdictTaken ? ['The challenge failed: change-request-disposition redoes what the files settle, then runs adversarial-check again.'] : []);
  add('The findings', findingFindings(project, r, numbers, opts));
  add('Agreed words', retiredFindings(project, t, opts));

  const judged = new Map(r.judged.map((j) => [j.id, j]));
  const linkedIds = new Set(r.linked.map((l) => l.id));
  const judgeFindings = [];
  if (!r.linked.length && r.lands.some((l) => l.ids.length)) judgeFindings.push('Section 12 lists no linked item: run find-linked.cjs.');
  for (const l of r.linked) if (!judged.has(l.id)) judgeFindings.push(`${l.id} has no judgement in section 13.`);
  for (const j of r.judged) {
    if (!linkedIds.has(j.id)) judgeFindings.push(`${j.id} is judged in section 13, but isn't a linked item in section 12.`);
    if (!cr.JUDGEMENTS.includes(j.judgement)) judgeFindings.push(`${j.id}'s judgement, "${j.judgement}", isn't one of: ${cr.JUDGEMENTS.join(', ')}.`);
    if (!j.why) judgeFindings.push(`${j.id}'s judgement doesn't say why.`);
  }
  add('Judgements', judgeFindings);

  const size = sr.sizeOf(project, change, opts);
  add('Size', !r.size.size || !r.size.rule ? ['Section 14 has no size, or no rule that decided it: run size-rules.cjs.'] : same(held(t, 'The tentative size'), sr.lines(size)) ? [] : [`Section 14 isn't what size-rules.cjs gives now, ${size.size}: run it again.`]);

  const rec = rc.recommendation(project, change, opts);
  const recFindings = [];
  if (!same(held(t, 'The recommendation'), rc.lines(rec))) recFindings.push(`Section 15 isn't what recommend.cjs gives now for this report: run it again. It recommends: ${rec.recommended}.`);
  const firstStep = ((md.tableUnder(t, 'The recommendation') || []).find((x) => !/park\.cjs/.test(text(x.Step))) || {}).Step;
  if (r.renames.length && text(firstStep || '') !== 'glossary-disposition') recFindings.push('The change renames an agreed word, so glossary-disposition comes first.');
  add('Recommendation', recFindings);

  add('Placeholders', cd.placeholders(t));
  add('Display', cd.rendering(t));
  // The words before and after a change are the client's, kept as evidence. Your words and a finding's quote are kept
  // exactly too.
  const writing = cd.simpleWriting(t, { project, output: opts.output, skipColumns: ['Before', 'After', 'Your words', 'Quote'] });
  add('Simple writing', writing.findings);
  add('Question log', cd.questionFindingsFor(doc, graded));

  const holds = [
    ...(r.kinds.length ? r.kinds.map((k) => `Ask ${k.ask}: ${k.kind}`) : ['No ask has a kind yet']),
    `${cd.plural(r.linked.length, 'linked item')}, ${r.judged.filter((j) => j.judgement !== 'No change').length} judged to change`,
    `Size: ${r.size.size || 'not given yet'}`,
    `Recommended: ${rec.recommended}`,
  ];
  const notices = r.verdictTaken ? ['The challenge failed twice in a row: its findings, in section 11, come first at your gate.'] : [];
  notices.push(...writing.notices);
  return { doc, checks, holds, graded, notices };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true) rp.fail('Use: node tools/check-change-report.cjs --project <p> --change <nnn>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, change, { output: args.output });
  const out = cd.report({ program: 'check-change-report.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check, verdictOf };

if (require.main === module) rp.run(main);
