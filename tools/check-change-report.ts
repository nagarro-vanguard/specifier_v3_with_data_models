// check-change-report.ts — checks a Change impact report before your yes, at step 5 of change-request-workflow, and prints the three
// blocks the gate needs.
//
//   node tools/check-change-report.ts --project <p> --change <nnn>
//
// What it checks:
//   - the opening blocks, and every section of the template, 1 to 16 and the Check record, in order
//   - section 1 holds at least one request, each numbered, called a change request, a new request or a late answer
//   - every word found in section 4 says how it was settled
//   - section 5 has its "Agreed words this change renames" part, which says None when the change renames none
//   - every ask in section 5 has its row in section 6, with at least one ID, and in section 7
//   - section 6 has its "Data model" column. Every thing that column names is in the things file, read through
//     lib/data-model.ts. An item is "{Thing}, {action, field or move}", or a thing alone when the ask adds to it.
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
//   - sections 5 and 7 to 10 use no word the Glossary retired, through lib/scan-retired-words.ts
//   - every linked item in section 12 has a judgement in section 13, and nothing else does. Each judgement is No change,
//     Update, New story or Split.
//   - section 14 has the size and its rule, as size-rules.ts gives them now
//   - section 15 is the recommendation recommend.ts gives now: the path for the kind, glossary-disposition first when
//     the change renames an agreed word, "Insert it" or "Copy the wording" only where a small update fits, and the
//     re-run offered when the change reaches most of the business requirements
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - grade-questions.ts finds nothing wrong with the report's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exports: check(project, change, opts), every check and what the gate shows; verdictOf(findings), the verdict the
// fixed rule gives.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the change, its report, the map or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, textOption, fail, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, projectDir, readText, type PathOptions } from './lib/run-paths.ts';
import { list, tableUnder, type Cell } from './lib/md-tables.ts';
import { load, opening, sections, questions, placeholders, rendering, simpleWriting, questionFindingsFor, report } from './lib/check-document.ts';
import { read, section, KINDS, RESULTS, JUDGEMENTS, CALLED, WOULD_CHANGE, WHO_CAN_FIX, type ChangeReport } from './lib/change-report.ts';
import { readThings } from './lib/data-model.ts';
import { retiredWords, currentTerms, scan } from './lib/scan-retired-words.ts';
import { plural } from './lib/text.ts';
import type { Check, CheckResult } from './lib/types.ts';
import { sizeOf, lines as sizeLines, type Size } from './size-rules.ts';
import { recommendation, lines as recommendationLines, type Recommendation } from './recommend.ts';

const USE = 'Use: node tools/check-change-report.ts --project <p> --change <nnn>';

// The sections that must use the Glossary's agreed words, by number.
const AGREED_WORD_SECTIONS = [[5, 'Restated, and split if several asks'], [7, 'Its kind'], [8, 'The journey'], [9, "What's reused, and what's new"], [10, 'What blocks']] as const;
// The results of the update test that change a rule, and so make the kind Update or optimize.
const CHANGING_RESULTS: readonly string[] = ['opposite', 'changed value', 'wording only'];
// The words before and after a change are the client's, kept as evidence. Your words and a finding's quote are kept
// exactly too.
const KEPT_COLUMNS = ['Before', 'After', 'Your words', 'Quote'];

type Finding = ChangeReport['findings'][number];

const oneLine = (c: Cell | undefined): string => list(c).map((x) => x.trim()).join(' ').trim();
const same = (a: string[], b: string[]): boolean => a.map((l) => l.trimEnd()).join('\n').trim() === b.map((l) => l.trimEnd()).join('\n').trim();
const isItalic = (line: string): boolean => /^\*[^*].*\*$/.test(line.trim());
// Text with its line endings and runs of spaces made one space, so a quote copied from a file is found in it.
const flat = (s: string): string => String(s).replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim();

// The lines a section holds, below the lines in italics that say what it holds.
function held(text: string, heading: string): string[] {
  const lines = section(text, heading) || [];
  let i = 0;
  while (i < lines.length && (!lines[i].trim() || isItalic(lines[i]))) i++;
  return lines.slice(i);
}

// What the fixed rule gives for the findings of section 11.
export function verdictOf(findings: Finding[]): 'FAIL' | 'PASS_WITH_FINDINGS' | 'PASS' {
  if (findings.some((f) => (WOULD_CHANGE.slice(0, 3) as readonly string[]).includes(f.wouldChange))) return 'FAIL';
  return findings.length ? 'PASS_WITH_FINDINGS' : 'PASS';
}

function requestsCheck(r: ChangeReport): Check {
  const findings: string[] = [];
  if (!r.requests.length) findings.push('Section 1 holds no request.');
  for (const q of r.requests) {
    if (!(CALLED as readonly string[]).includes(q.called)) findings.push(`Request ${q.n} is called "${q.called}": it is one of ${CALLED.join(', ')}.`);
    if (!q.words) findings.push(`Request ${q.n} has no words.`);
  }
  return { name: 'Requests', findings };
}

function wordsFoundCheck(text: string): Check {
  const found = (tableUnder(text, 'Check findings on documents from outside') || []).filter((x) => oneLine(x['Word found']) && !/^none$/i.test(oneLine(x['Word found'])));
  return { name: 'Words found', findings: found.filter((x) => !oneLine(x['Settled as'])).map((x) => `"${oneLine(x['Word found'])}" doesn't say how it was settled at glossary-disposition's gate.`) };
}

function renamesCheck(text: string): Check {
  const restated = section(text, 'Restated, and split if several asks') || [];
  const at = restated.findIndex((l) => /^### Agreed words this change renames/.test(l.trim()));
  const after = at < 0 ? [] : restated.slice(at + 1).filter((l) => l.trim() && !isItalic(l));
  const findings = at < 0 ? ['Section 5 has no "Agreed words this change renames" part.'] : !after.length ? ['"Agreed words this change renames" is empty: it says None when the change renames none.'] : [];
  return { name: 'Agreed words renamed', findings };
}

// The Data model column: each thing it names must be in the things file. An item is a thing, or starts with a thing
// and a comma, so a thing whose name holds a comma still reads.
function dataModelColumnFindings(project: string, r: ChangeReport, opts: PathOptions): string[] {
  const findings: string[] = [];
  if (r.lands.length && !r.dataModelColumn) findings.push('Section 6 has no "Data model" column: it says None for an ask that touches no thing.');
  const named = r.lands.flatMap((l) => l.dataModel.map((item) => ({ ask: l.ask, item })));
  if (!named.length) return findings;
  const thingsFile = pathOf(project, 'data-model-things', {}, opts);
  if (!fs.existsSync(thingsFile)) return [...findings, ...named.map((x) => `Ask ${x.ask}: "${x.item}", in the Data model column, names a thing, but the project has no things file yet.`)];
  const things = readThings(thingsFile).families.flatMap((f) => f.things.map((t) => oneLine(t.Thing))).filter(Boolean);
  for (const x of named) {
    if (!things.some((t) => x.item === t || x.item.startsWith(`${t}, `))) findings.push(`Ask ${x.ask}: "${x.item}", in the Data model column, names no thing in the things file.`);
  }
  return findings;
}

function asksCheck(project: string, r: ChangeReport, opts: PathOptions): Check {
  const findings: string[] = [];
  if (!r.asks.length) findings.push('Section 5 restates no ask.');
  for (const a of r.asks) {
    const land = r.lands.find((l) => l.ask === a.n);
    if (!land) findings.push(`Ask ${a.n} has no row in section 6.`);
    else if (!land.ids.length && !r.kinds.some((k) => k.ask === a.n && k.kind === 'Net new')) findings.push(`Ask ${a.n} lands on nothing in section 6: only a Net new ask may.`);
    if (!r.kinds.some((k) => k.ask === a.n)) findings.push(`Ask ${a.n} has no row in section 7.`);
  }
  return { name: 'Asks', findings: [...findings, ...dataModelColumnFindings(project, r, opts)] };
}

function kindCheck(r: ChangeReport): Check {
  return { name: 'Kind', findings: r.kinds.filter((k) => !(KINDS as readonly string[]).includes(k.kind)).map((k) => `Ask ${k.ask}'s kind, "${k.kind}", isn't one of the five: ${KINDS.join(', ')}.`) };
}

function updateTestCheck(r: ChangeReport): Check {
  const findings: string[] = [];
  for (const k of r.kinds) {
    for (const x of k.tests) if (!(RESULTS as readonly string[]).includes(x.result)) findings.push(`Ask ${k.ask}: ${x.id}'s result, "${x.result}", isn't one of: ${RESULTS.join(', ')}.`);
    const changes = k.tests.some((x) => CHANGING_RESULTS.includes(x.result));
    if (changes && k.kind !== 'Update or optimize') findings.push(`Ask ${k.ask}: the update test finds a rule changed, so its kind is Update or optimize, not ${k.kind}.`);
    if (!k.fit && k.kind !== 'Blocked') findings.push(`Ask ${k.ask}: the test that decided it doesn't give the Feature Fit verdict first.`);
  }
  return { name: 'The update test', findings };
}

function blockersCheck(r: ChangeReport, numbers: Set<number | null>): Check {
  const findings = r.blockers.map((b) => {
    const q = b.match(/question (\d+)/i)?.[1];
    if (!q) return `"${b}" names no question in the Question log.`;
    return numbers.has(Number(q)) ? null : `"${b}" names question ${q}, which isn't in the Question log.`;
  }).filter((f): f is string => Boolean(f));
  return { name: 'Blockers', findings };
}

function challengeCheck(r: ChangeReport): Check {
  const findings = !r.verdict ? ['Section 11 has no "**Verdict:**" line from adversarial-check.'] : r.verdict === 'FAIL' && !r.verdictTaken ? ['The challenge failed: change-request-disposition redoes what the files settle, then runs adversarial-check again.'] : [];
  return { name: 'The challenge', findings };
}

// What one finding of section 11 lacks: its quote, word for word in its file, what it would change, and who can fix it.
function findingFindings(f: Finding, dir: string, numbers: Set<number | null>): string[] {
  const out: string[] = [];
  const at = `Finding ${f.n}`;
  if (!f.quote) out.push(`${at} has no quote.`);
  if (!f.from) out.push(`${at} doesn't say which file its quote is from.`);
  else {
    const file = path.join(dir, f.from.replace(/^`|`$/g, ''));
    if (!fs.existsSync(file)) out.push(`${at}: its file, ${f.from}, isn't in the project.`);
    else if (f.quote && !flat(readText(file)).includes(flat(f.quote.replace(/^"|"$/g, '')))) out.push(`${at}: its quote isn't in ${f.from}, word for word.`);
  }
  if (!(WOULD_CHANGE as readonly string[]).includes(f.wouldChange)) out.push(`${at}: "${f.wouldChange}" isn't what a finding can change: ${WOULD_CHANGE.join(', ')}.`);
  if (!(WHO_CAN_FIX as readonly string[]).includes(f.whoCanFix)) out.push(`${at}: "${f.whoCanFix}" isn't who can fix it: ${WHO_CAN_FIX.join(' or ')}.`);
  if (f.whoCanFix === 'needs your answer') {
    const q = f.answer.match(/question (\d+)/i)?.[1];
    if (!q || !numbers.has(Number(q))) out.push(`${at} needs your answer, so its Answer names its question in the Question log.`);
  }
  return out;
}

function findingsCheck(project: string, r: ChangeReport, numbers: Set<number | null>, opts: PathOptions): Check {
  const dir = projectDir(project, opts);
  const findings = r.findings.flatMap((f) => findingFindings(f, dir, numbers));
  const rule = verdictOf(r.findings);
  if (r.verdict && r.verdict !== rule) findings.push(`The verdict is ${r.verdict}, but the fixed rule gives ${rule} for these findings.`);
  return { name: 'The findings', findings };
}

// Sections 5 and 7 to 10 use the Glossary's agreed words, when the project has a Glossary.
function agreedWordsCheck(project: string, text: string, opts: PathOptions): Check {
  const check: Check = { name: 'Agreed words', findings: [] };
  if (!fs.existsSync(path.join(projectDir(project, opts), 'glossary', 'object-terms.md'))) return check;
  const retired = retiredWords(project, opts);
  if (!retired.length) return check;
  const current = currentTerms(project, opts);
  for (const [n, heading] of AGREED_WORD_SECTIONS) {
    for (const h of scan((section(text, heading) || []).join('\n'), retired, current, 'change-impact-report')) {
      check.findings.push(`Section ${n}: "${h.word}" is a word the Glossary retired. Use ${h.useNow.join(' or ') || 'another plain word'}.`);
    }
  }
  return check;
}

function judgementsCheck(r: ChangeReport): Check {
  const judged = new Map(r.judged.map((j) => [j.id, j]));
  const linkedIds = new Set(r.linked.map((l) => l.id));
  const findings: string[] = [];
  if (!r.linked.length && r.lands.some((l) => l.ids.length)) findings.push('Section 12 lists no linked item: run find-linked.ts.');
  for (const l of r.linked) if (!judged.has(l.id)) findings.push(`${l.id} has no judgement in section 13.`);
  for (const j of r.judged) {
    if (!linkedIds.has(j.id)) findings.push(`${j.id} is judged in section 13, but isn't a linked item in section 12.`);
    if (!(JUDGEMENTS as readonly string[]).includes(j.judgement)) findings.push(`${j.id}'s judgement, "${j.judgement}", isn't one of: ${JUDGEMENTS.join(', ')}.`);
    if (!j.why) findings.push(`${j.id}'s judgement doesn't say why.`);
  }
  return { name: 'Judgements', findings };
}

function sizeCheck(r: ChangeReport, text: string, size: Size): Check {
  const findings = !r.size.size || !r.size.rule
    ? ['Section 14 has no size, or no rule that decided it: run size-rules.ts.']
    : same(held(text, 'The tentative size'), sizeLines(size)) ? [] : [`Section 14 isn't what size-rules.ts gives now, ${size.size}: run it again.`];
  return { name: 'Size', findings };
}

function recommendationCheck(r: ChangeReport, text: string, rec: Recommendation): Check {
  const findings: string[] = [];
  if (!same(held(text, 'The recommendation'), recommendationLines(rec))) findings.push(`Section 15 isn't what recommend.ts gives now for this report: run it again. It recommends: ${rec.recommended}.`);
  const firstStep = (tableUnder(text, 'The recommendation') || []).find((x) => !/park\.ts/.test(oneLine(x.Step)))?.Step;
  if (r.renames.length && oneLine(firstStep) !== 'glossary-disposition') findings.push('The change renames an agreed word, so glossary-disposition comes first.');
  return { name: 'Recommendation', findings };
}

// What the gate shows while the report is a draft.
function holdsOf(r: ChangeReport, rec: Recommendation): string[] {
  return [
    ...(r.kinds.length ? r.kinds.map((k) => `Ask ${k.ask}: ${k.kind}`) : ['No ask has a kind yet']),
    `${plural(r.linked.length, 'linked item')}, ${r.judged.filter((j) => j.judgement !== 'No change').length} judged to change`,
    `Size: ${r.size.size || 'not given yet'}`,
    `Recommended: ${rec.recommended}`,
  ];
}

export function check(project: string, change: string, opts: PathOptions = {}): CheckResult {
  const r = read(project, change, opts);
  const doc = load(project, 'change-impact-report', { change: r.change.folder }, opts);
  const t = doc.text;
  const checks: Check[] = [
    { name: 'Opening', findings: opening(t) },
    { name: 'Sections', findings: sections(t, 'change-impact-report') },
    requestsCheck(r),
    wordsFoundCheck(t),
    renamesCheck(t),
    asksCheck(project, r, opts),
    kindCheck(r),
    updateTestCheck(r),
  ];
  const graded = questions(project, opts);
  const numbers = new Set((graded.questions || []).map((q) => q.n));
  checks.push(blockersCheck(r, numbers), challengeCheck(r), findingsCheck(project, r, numbers, opts), agreedWordsCheck(project, t, opts), judgementsCheck(r));
  checks.push(sizeCheck(r, t, sizeOf(project, change, opts)));
  const rec = recommendation(project, change, opts);
  checks.push(recommendationCheck(r, t, rec));
  checks.push({ name: 'Placeholders', findings: placeholders(t) }, { name: 'Display', findings: rendering(t) });
  const writing = simpleWriting(t, { project, output: opts.output, skipColumns: KEPT_COLUMNS });
  checks.push({ name: 'Simple writing', findings: writing.findings }, { name: 'Question log', findings: questionFindingsFor(doc, graded) });

  const notices = r.verdictTaken ? ['The challenge failed twice in a row: its findings, in section 11, come first at your gate.'] : [];
  notices.push(...writing.notices);
  return { doc, checks, holds: holdsOf(r, rec), graded, notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const date = textOption(args, 'date') ?? today();
  const r = check(project, change, { output: args.output });
  const out = report({ program: programName(import.meta.filename), date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
