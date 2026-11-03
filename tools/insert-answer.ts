// insert-answer.ts — writes a late answer into every place the documents name its question, and nothing else.
//
//   node tools/insert-answer.ts --project <p> --change <nnn> --question <n>
//
// It runs only after you chose "Insert it" at the change's gate, so the change's report is accepted and its progress
// exists.
//
// What it does:
//   1. reads the answer from the Question log: the question, under Answered, with its Answer and Decided in
//   2. finds every gap that names the question, as grade-questions.ts finds them, in every document that exists,
//      drafted or accepted. Records are left alone: the Discovery brief, the Question log and the changes' reports.
//      grade-questions.ts leaves the glossary folder out, so the data model files are added here, found through
//      lib/data-model.ts. That is where the data model writes an answer the PRD left open, until it is confirmed.
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
//      - in the BRD, which cites nothing: "[TBD, Q7]" becomes the answer alone, and "<sup>*Q4</sup>" goes, leaving
//        the words before it. A legend line with no mark left above it goes too (lib/marks.ts).
//   4. refuses, and writes nothing, when any place would need other words changed: a TBD outside a table cell with
//      a labelled answer, a cell whose row matches no label, a Proposed value the answer doesn't confirm, a data model
//      file's gap that isn't a Proposed answer, or any other label. The change then needs the path for its kind,
//      which runs data-model-author for a data model file.
//   5. writes every place, and records each one in the change's progress, under "Places written"
//   6. runs accept.ts for each accepted document it changed, so each gets a new version. A drafted document keeps
//      the answer in its next draft.
//   7. checks that no gap outside the records still names the question, in the data model files too
//
// Exports: places(project, n, opts), every place the answer would be written and every place refused;
// sourceOf(decidedIn), where an answer was decided, as a source; acceptAgain(project, rels, args), runs accept.ts for
// each accepted document; isRecord(rel), whether a document is a record.
//
// Exit codes: 0 written; 1 refused, or the change's decision isn't "Insert it", or the question isn't answered;
// 2 the change, its report, its progress, the Question log or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD>.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs, requireOption, textOption, fail, programName, runMain, type CliArgs, type ExitCode } from './lib/cli.ts';
import { LayoutError, identify, layout, pathOf, projectDir, readText, relOf, writeText, type PathOptions } from './lib/run-paths.ts';
import { list, type Cell } from './lib/md-tables.ts';
import { questions, replaceSection } from './lib/check-document.ts';
import { read } from './lib/change-report.ts';
import { load as loadDataModel, statusOf } from './lib/data-model.ts';
import { gapsIn, gapsInFile, type Question } from './grade-questions.ts';
import { plural } from './lib/text.ts';
import { withoutLonelyLegends } from './lib/marks.ts';

const USE = 'Use: node tools/insert-answer.ts --project <p> --change <nnn> --question <n>';
const PROPOSED = ', Proposed (needs confirmation)';
const PROPOSED_LABEL = 'Proposed (needs confirmation)';
// The documents that are records: they name a question, and the Question log holds its answer.
const RECORDS = ['discovery-brief', 'question-log', 'change-impact-report', 'check-findings', 'change-progress'] as const;
// The program accept.ts runs as, beside this one.
const ACCEPT = 'accept.ts';

// The answer to a question, read from the Question log.
export interface Answer {
  q: Question;
  // Whether the answer has one line per label, such as "Working days from sending a claim to paying it: 10 working days".
  labelled: boolean;
  byLabel: Map<string, string>;
  whole: string;
  inUse: string;
  impact: string | null;
  source: string;
}

// A place the answer is written: the line, what it is called, and its words before and after.
export interface Place {
  rel: string;
  line: number;
  where: string;
  before: string;
  after: string;
}

export interface Refused {
  rel: string;
  line: number;
  why: string;
}

export type InsertPlaces =
  | { error: string; places: Place[]; refused: Refused[] }
  | { answer: Answer; places: Place[]; refused: Refused[] };

interface Gap {
  rel: string;
  line: number;
  label: string;
  question: number | null;
  // A short mark as written, such as "[TBD, Q7]" in the BRD.
  mark?: string;
}

const oneLine = (cell: Cell | undefined): string => list(cell).map((x) => x.trim()).join(' ').trim();
const bare = (s: string): string => s.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
const isDataModel = (rel: string): boolean => identify(rel)?.document === 'data-model';
const cellsOf = (line: string): string[] | null => (line.trim().startsWith('|') ? line.split('|').slice(1, -1).map((c) => c.trim()) : null);

// The data model files that are written, each { file, rel }. A project with no things file has none.
function dataModelFiles(project: string, opts: PathOptions): { file: string; rel: string }[] {
  if (!fs.existsSync(pathOf(project, 'data-model-things', {}, opts))) return [];
  return loadDataModel(project, { ...opts, allowMissing: true }).files.filter((f) => f.exists).map((f) => ({ file: f.file, rel: f.rel }));
}

// Every gap in the documents and the data model files, as grade-questions.ts finds them.
function allGaps(project: string, opts: PathOptions): Gap[] {
  const logRel = relOf('question-log', { product: project });
  return [...gapsIn(projectDir(project, opts), logRel), ...dataModelFiles(project, opts).flatMap((f) => gapsInFile(f.file, f.rel))];
}

// A data model cell's Proposed answer to question n, on one line: its words, from the start of its cell or its list
// item, with and without the mark. Null when the line has no words before the mark.
function proposedIn(line: string, n: string | number): { before: string; after: string } | null {
  const m = line.match(new RegExp(`(\\||<br>)((?:(?!<br>)[^|])*?),\\s*Proposed \\(needs confirmation\\),\\s*question ${n}(?!\\d)`));
  if (!m) return null;
  const before = m[0].slice(m[1].length).replace(/^\s*(?:•\s*)?/, '');
  const after = before.replace(/,\s*Proposed \(needs confirmation\),\s*question \d+$/, '').trim();
  return after ? { before, after } : null;
}

export function isRecord(rel: string): boolean {
  const id = identify(rel);
  return !id || (RECORDS as readonly string[]).includes(id.document);
}

// Where an answer was decided, as a source: "per change 002, Decision 1" or "per expense-claims-brd.md, Decision 3".
export function sourceOf(decidedIn: Cell | undefined): string {
  const s = oneLine(decidedIn);
  const n = s.match(/Decision (\d+)/);
  const change = s.match(/changes\/(\d{3})-/);
  const where = change ? `change ${change[1]}` : bare(s.split(',')[0]);
  return `per ${where}${n ? `, Decision ${n[1]}` : ''}`;
}

function answerOf(project: string, n: string | number, opts: PathOptions): Answer | { error: string } {
  const graded = questions(project, opts);
  const q = (graded.questions || []).find((x) => x.n === Number(n));
  if (!q) return { error: `Question ${n} isn't in the Question log.` };
  if (q.group !== 'Answered') return { error: `Question ${n} isn't answered yet: write its Answer and Decided in, under Answered in the Question log, first.` };
  const lines = list(q.parts.Answer).map((x) => x.trim()).filter(Boolean);
  const labelled = lines.length > 1 && lines.every((l) => /^[^:]+:\s+\S/.test(l));
  const byLabel = new Map(labelled ? lines.map((l) => {
    const m = l.match(/^([^:]+):\s+(.+)$/)!;
    return [bare(m[1]).toLowerCase(), m[2].trim()] as const;
  }) : []);
  const inUse = oneLine(q.parts['Answer in use for now']).replace(PROPOSED, '').trim();
  const impact = oneLine(q.parts.Impact).match(/^(High|Medium|Low)\b/)?.[1] || null;
  return { q, labelled, byLabel, whole: lines.join(' '), inUse, impact, source: sourceOf(q.parts['Decided in']) };
}

// A gap in a data model file: a confirmed answer keeps its words, and loses its mark. A data model file cites no source.
function dataModelPlace(g: Gap, line: string, a: Answer, n: string | number): Place | string {
  if (g.label !== PROPOSED_LABEL) return `a data model file holds only a Proposed answer, so "${g.label}" needs data-model-author`;
  if (a.whole.toLowerCase() !== a.inUse.toLowerCase()) return `the answer, "${a.whole}", doesn't confirm the answer in use, "${a.inUse}", so the data model's answer would change`;
  const p = proposedIn(line, n);
  if (!p) return 'the Proposed answer has no words before its mark';
  const cells = cellsOf(line);
  return { rel: g.rel, line: g.line, where: cells ? bare(cells[0]) : `line ${g.line}`, before: p.before, after: p.after };
}

// A gap in any other document: the place it would be written, or why it is refused.
// A short mark, such as "[TBD, Q7]" in the BRD, cites nothing: the answer takes its place with no source.
function documentPlace(g: Gap, line: string, a: Answer, n: string | number): Place | string {
  const gap = g.mark ?? `${g.label}, question ${n}`;
  const withSource = (value: string) => (g.mark ? value : `${value}, ${a.source}`);
  if (g.label === 'TBD') {
    const cells = cellsOf(line);
    if (cells && cells.includes(gap)) {
      const label = bare(cells[0]);
      const value = a.labelled ? a.byLabel.get(label.toLowerCase()) : a.whole;
      if (!value) return `its row, "${label}", matches no line of the answer`;
      return { rel: g.rel, line: g.line, where: label, before: gap, after: withSource(value) };
    }
    if (!a.labelled && line.includes(gap)) return { rel: g.rel, line: g.line, where: `line ${g.line}`, before: gap, after: withSource(a.whole) };
    return 'the gap isn\'t alone in a table cell, and the answer has a line for each label';
  }
  if (g.label === PROPOSED_LABEL) {
    if (a.whole.toLowerCase() !== a.inUse.toLowerCase()) return `the answer, "${a.whole}", doesn't confirm the answer in use, "${a.inUse}", so the words before the gap would change`;
    return { rel: g.rel, line: g.line, where: `line ${g.line}`, before: gap, after: g.mark ? '' : a.source };
  }
  return `"${g.label}" says something is missing from a source, which an answer doesn't fill`;
}

// Every place the question's gaps would be written, and every place refused, with why.
export function places(project: string, n: string | number, opts: PathOptions = {}): InsertPlaces {
  const a = answerOf(project, n, opts);
  if ('error' in a) return { error: a.error, places: [], refused: [] };
  const dir = projectDir(project, opts);
  const written: Place[] = [];
  const refused: Refused[] = [];
  for (const g of allGaps(project, opts)) {
    if (g.question !== Number(n) || isRecord(g.rel)) continue;
    const line = readText(path.join(dir, g.rel)).split('\n')[g.line - 1];
    const place = isDataModel(g.rel) ? dataModelPlace(g, line, a, n) : documentPlace(g, line, a, n);
    if (typeof place === 'string') refused.push({ rel: g.rel, line: g.line, why: place });
    else written.push(place);
  }
  // In the order of the flow, as the layout lists the documents, then by line.
  const order = Object.keys(layout());
  const rank = (rel: string) => order.indexOf(identify(rel)?.document ?? '');
  for (const each of [written, refused]) each.sort((x, y) => rank(x.rel) - rank(y.rel) || x.rel.localeCompare(y.rel) || x.line - y.line);
  return { answer: a, places: written, refused };
}

// Runs accept.ts for each accepted document in the list, so each gets a new version. A drafted one is left as it is.
// The status line is read in any case, because a data model file written before the kit's document shape says
// "Accepted on {date}".
export function acceptAgain(project: string, rels: string[], args: CliArgs): { lines: string[]; code: ExitCode } {
  const dir = projectDir(project, { output: args.output });
  const date = textOption(args, 'date');
  const lines: string[] = [];
  for (const rel of rels) {
    const status = statusOf(readText(path.join(dir, rel))).state;
    if (status !== 'accepted') { lines.push(`- ${rel}: ${status || 'drafted'}, so it keeps the new words in its next draft.`); continue; }
    const extra: string[] = [];
    if (args.output) extra.push('--output', args.output);
    if (date) extra.push('--date', date);
    const a = spawnSync(process.execPath, [path.join(import.meta.dirname, ACCEPT), '--project', project, '--document', rel, ...extra], { encoding: 'utf8' });
    if (a.status !== 0) return { lines: [...lines, `${a.stdout}${a.stderr}`.trim()], code: (a.status || 2) as ExitCode };
    lines.push(`- ${rel}: accepted again, as version ${a.stdout.match(/as version (\d+)/)?.[1]}.`);
  }
  return { lines, code: 0 };
}

// Writes each place's new words into its document. A legend line left with no <sup>*Q{n}</sup> above it goes too.
function writePlaces(dir: string, found: Place[]): string[] {
  const docs = [...new Set(found.map((x) => x.rel))];
  for (const rel of docs) {
    const file = path.join(dir, rel);
    const all = readText(file).split('\n');
    for (const x of found.filter((y) => y.rel === rel)) all[x.line - 1] = all[x.line - 1].replace(x.before, x.after);
    writeText(file, withoutLonelyLegends(all.join('\n')));
  }
  return docs;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const n = requireOption(args, 'question', USE);
  const opts = { output: args.output };
  const r = read(project, change, opts);
  if (r.choice !== 'Insert it') {
    process.stdout.write(`Change ${r.change.number}'s decision is ${r.choice ? `"${r.choice}"` : 'not made yet'}, not "Insert it": nothing is written.\n`);
    return 1;
  }
  const progress = pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(progress)) throw new LayoutError(`The change has no progress yet: ${progress}. It is written when the change's report is accepted.`);

  const p = places(project, n, opts);
  if ('error' in p) { process.stdout.write(`${p.error}\n`); return 1; }
  if (p.refused.length) {
    process.stdout.write(`Nothing is written: ${plural(p.refused.length, 'place')} would need other words changed, so the change needs the path for its kind, in section 15.\n`);
    for (const x of p.refused) process.stdout.write(`- ${x.rel}, line ${x.line}: ${x.why}\n`);
    return 1;
  }

  const docs = writePlaces(projectDir(project, opts), p.places);
  replaceSection(progress, 'Places written', ['| Document | Where | Before | After |', '|---|---|---|---|', ...p.places.map((x) => `| ${x.rel} | ${x.where} | ${x.before} | ${x.after} |`)]);

  const out = [`${programName(import.meta.filename)}: question ${n}'s answer written in ${plural(p.places.length, 'place')}, in ${plural(docs.length, 'document')}.`];
  const again = acceptAgain(project, docs, args);
  out.push(...again.lines);
  if (again.code) { process.stdout.write(`${out.join('\n')}\n`); return again.code; }
  const left = allGaps(project, opts).filter((g) => g.question === Number(n) && !isRecord(g.rel));
  out.push(left.length ? `${plural(left.length, 'gap')} still name question ${n}.` : `No gap outside the records still names question ${n}.`);
  process.stdout.write(`${out.join('\n')}\n`);
  return left.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
