// grade-questions.ts — places every question in the Question log in its group, sets the order they are asked in,
// and checks the log and the gaps that point to it.
//
//   node tools/grade-questions.ts --project <p> [--check-only]
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
// It can also be imported:
//   grade(project, opts)         { logRel, questions, open, counts, order, findings, moves, notes }: the Graded type
//   readGrid(file)               the grid: { "High|Medium": { order: 2, group: "Must answer" } }
//   gapsIn(projectDir, logRel)   every gap in the project's documents: { rel, line, label, question, mark }
//   gapsInFile(file, rel)        every gap in one document
//   TEMPLATE                     the path of the Question log template
//   GROUPS                       the three groups an open question can be in
//   Question, QuestionGroup, Graded, Gap
//                                the types of a graded question, a group, grade's result and a gap

import fs from 'node:fs';
import path from 'node:path';
import { KIT_ROOT, LayoutError, projectDir, readText, relOf, writeText, type PathOptions } from './lib/run-paths.ts';
import { list, normalize, tableUnder, cellText, type Cell } from './lib/md-tables.ts';
import { parseArgs, requireOption, textOption, hasOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { plural } from './lib/text.ts';
import { TBD_MARK, PROPOSED_MARK } from './lib/marks.ts';

export const TEMPLATE = path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'templates', 'question-log.md');
export const GROUPS = ['Must answer', 'Should answer', 'Can move ahead'] as const;
export type QuestionGroup = (typeof GROUPS)[number];
const SECTIONS = [...GROUPS, 'Answered'] as const;
type LogSection = (typeof SECTIONS)[number];
const LEVELS = ['High', 'Medium', 'Low'] as const;
type Level = (typeof LEVELS)[number];
const PARTS = ['Raised in', "Why I'm asking", 'For example', 'What it changes', 'Impact', 'Severity', 'Answers', 'Recommended', 'Answer in use for now', 'Who can answer', 'Answer by', 'Next best action'];
const ANSWERED_PARTS = ['Answer', 'Decided in'];
// The folders a gap is never looked for in.
const NO_GAPS_IN = ['version-log', 'glossary', 'sources', 'design'];
// The sections of a document a gap is never looked for in.
const NO_GAPS_UNDER = ['decision record', 'your decision', 'check record', 'placeholders'];
// The labels that mark a gap (conventions.md, "Unknowns"). Each one must name its question, such as "TBD, question 12".
// The BRD's two short marks, from lib/marks.ts, name theirs inside the mark, and come first so the TBD inside
// "[TBD, Q7]" isn't read a second time.
const GAP = new RegExp(`${TBD_MARK.source}|${PROPOSED_MARK.source}|TBD|Proposed \\(needs confirmation\\)|\\[Not specified in provided sources\\]|\\[Needs source excerpt\\]`, 'g');
const CITES_A_FILE = /\b[\w.-]+\.(md|docx?|pdf|xlsx?|csv|txt|eml|pptx?)\b|no file speaks to it/i;

// One cell of the grid: where a question with these ratings comes in the order, and its group.
export interface GridCell {
  order: number;
  group: string;
}

// The grid, by "{severity}|{impact}", such as "High|Medium".
export type Grid = Record<string, GridCell>;

// A question as the log holds it, before it is graded.
interface LoggedQuestion {
  // null when its heading doesn't read "Question {number}: {the question}"
  n: number | null;
  title: string;
  // The log section it sits in now.
  section: LogSection;
  lines: string[];
  malformed?: true;
  // Each part's text, by the part's name, such as parts['Raised in'].
  parts: Record<string, Cell>;
}

// A question, graded: its two ratings, its cell in the grid, and the group it belongs in.
export interface Question extends LoggedQuestion {
  answered: boolean;
  impact: Level | null;
  severity: Level | null;
  // null when a rating is missing, and undefined when the grid has no cell for the two ratings
  rank: GridCell | null | undefined;
  group: string;
}

export interface OrderedQuestion {
  n: number | null;
  group: string;
  title: string;
  severity: Level | null;
  impact: Level | null;
}

export interface Graded {
  // The Question log's path inside the project folder.
  logRel: string;
  questions: Question[];
  // The open questions, in the order they are asked in.
  open: Question[];
  // How many questions are in each group, and how many are answered. Empty when there is no log.
  counts: Partial<Record<LogSection, number>>;
  order: OrderedQuestion[];
  findings: string[];
  moves: string[];
  notes: string[];
}

export interface GradeOptions extends PathOptions {
  // Changes nothing: only reports each move it would make.
  checkOnly?: boolean;
}

// A gap in a document: its line, from 1, its label, and the question it names, or null. A short mark, such as
// "[TBD, Q7]", also gives the mark as written, and its label is the long one it stands for, TBD or Proposed.
export interface Gap {
  rel: string;
  line: number;
  label: string;
  question: number | null;
  mark?: string;
}

// The log split into its parts: the text before the question sections, each section's heading and opening line,
// each question's block, and the text from the Check record on.
interface Log {
  before: string[];
  heads: Record<LogSection, string[]>;
  questions: LoggedQuestion[];
  after: string[];
}

// A question's block of lines, before its parts are read.
type QuestionBlock = Omit<LoggedQuestion, 'parts'>;

// Where each question section starts, and where the Check record starts.
interface SectionStarts {
  sectionAt: Record<LogSection, number>;
  checkAt: number;
}

function partText(cell: Cell | undefined): string {
  return Array.isArray(cell) ? cell.join(' ') : String(cell || '').trim();
}

export function readGrid(file: string): Grid {
  const rows = tableUnder(file, 'The grid');
  if (!rows || rows.length !== 9) throw new LayoutError(`The grid in ${file} must have nine rows.`);
  const grid: Grid = {};
  for (const row of rows) grid[`${row.Severity}|${row.Impact}`] = { order: Number(row.Order), group: cellText(row.Group) };
  return grid;
}

function sectionStarts(lines: readonly string[]): { problems: string[]; starts: SectionStarts | null } {
  const sectionAt: Partial<Record<LogSection, number>> = {};
  let checkAt = -1;
  lines.forEach((l, i) => {
    const h = l.match(/^## (.*)$/);
    if (!h) return;
    const name = normalize(h[1]);
    const s = SECTIONS.find((x) => x.toLowerCase() === name);
    if (s) sectionAt[s] = i;
    if (name === 'check record' && checkAt < 0) checkAt = i;
  });
  const problems: string[] = [];
  for (const s of SECTIONS) if (sectionAt[s] === undefined) problems.push(`The log has no "${s}" section.`);
  if (checkAt < 0) problems.push('The log has no "Check record" section.');
  if (problems.length) return { problems, starts: null };
  const found = sectionAt as Record<LogSection, number>;
  const order = SECTIONS.map((s) => found[s]);
  if (order.some((n, i) => i > 0 && n < order[i - 1]) || checkAt < order[order.length - 1]) {
    return { problems: ['The log\'s sections are out of order: Must answer, Should answer, Can move ahead, Answered, then Check record.'], starts: null };
  }
  return { problems: [], starts: { sectionAt: found, checkAt } };
}

// One section's heading and opening line, and the blocks of the questions under it.
function readSection(lines: readonly string[], s: LogSection, start: number, end: number): { head: string[]; blocks: QuestionBlock[] } {
  const body = lines.slice(start + 1, end);
  const firstQ = body.findIndex((l) => /^### /.test(l));
  const intro = trimEnd((firstQ < 0 ? body : body.slice(0, firstQ)).filter((l) => l.trim() !== 'None yet.'));
  while (intro.length && intro[0].trim() === '') intro.shift();
  // A heading with nothing under it but its questions is followed straight by them, after one blank line.
  const head = intro.length ? [lines[start], '', ...intro] : [lines[start]];
  const blocks: QuestionBlock[] = [];
  if (firstQ < 0) return { head, blocks };
  let cur: QuestionBlock | null = null;
  for (const l of body.slice(firstQ)) {
    const q = l.match(/^### Question (\d+): (.*)$/);
    if (q) {
      cur = { n: Number(q[1]), title: q[2].trim(), section: s, lines: [l] };
      blocks.push(cur);
    } else if (/^### /.test(l)) {
      cur = { n: null, title: l.slice(4).trim(), section: s, lines: [l], malformed: true };
      blocks.push(cur);
    } else if (cur) cur.lines.push(l);
  }
  return { head, blocks };
}

// A question's parts, from the table in its block.
function partsOf(lines: readonly string[]): Record<string, Cell> {
  const rows = tableUnder(`# Q\n\n## Block\n\n${lines.slice(1).join('\n')}\n`, 'Block') || [];
  const parts: Record<string, Cell> = {};
  for (const row of rows) if (row.Part) parts[partText(row.Part)] = row['What it says'];
  return parts;
}

function readLog(textOfLog: string): { problems: string[]; log: Log | null } {
  const lines = textOfLog.split('\n');
  const { problems, starts } = sectionStarts(lines);
  if (!starts) return { problems, log: null };
  const { sectionAt, checkAt } = starts;

  const blocks: QuestionBlock[] = [];
  const heads = {} as Record<LogSection, string[]>;
  SECTIONS.forEach((s, k) => {
    const end = k + 1 < SECTIONS.length ? sectionAt[SECTIONS[k + 1]] : checkAt;
    const read = readSection(lines, s, sectionAt[s], end);
    heads[s] = read.head;
    blocks.push(...read.blocks);
  });
  const questions = blocks.map((q) => {
    const trimmed = trimEnd(q.lines);
    return { ...q, lines: trimmed, parts: partsOf(trimmed) };
  });
  return {
    problems: [],
    log: { before: lines.slice(0, sectionAt[SECTIONS[0]]), heads, questions, after: lines.slice(checkAt) },
  };
}

function trimEnd(arr: readonly string[]): string[] {
  const out = [...arr];
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  while (out.length && out[0].trim() === '') out.shift();
  return out;
}

function level(cell: Cell | undefined): Level | null {
  const m = partText(cell).match(/^(High|Medium|Low)\.\s+\S/);
  return LEVELS.find((l) => l === m?.[1]) ?? null;
}

// The question with its two ratings, its cell in the grid, and the group it belongs in.
function rate(q: LoggedQuestion, grid: Grid): Question {
  const answered = partText(q.parts.Answer) !== '';
  const impact = level(q.parts.Impact);
  const severity = level(q.parts.Severity);
  const rank = impact && severity ? grid[`${severity}|${impact}`] : null;
  const group = answered ? 'Answered' : rank ? rank.group : q.section;
  return { ...q, answered, impact, severity, rank, group };
}

function checkQuestion(q: Question): string[] {
  const f: string[] = [];
  const name = q.n ? `Question ${q.n}` : `"${q.title}"`;
  if (q.malformed) f.push(`${name}: its heading must read "Question {number}: {the question}".`);
  const marks = (q.title.match(/\?/g) || []).length;
  if (!q.title.endsWith('?') || marks !== 1) f.push(`${name}: it must be one question, ending in a single question mark.`);
  for (const p of [...PARTS, ...(q.answered || q.section === 'Answered' ? ANSWERED_PARTS : [])]) {
    if (!(p in q.parts) || partText(q.parts[p]) === '') f.push(`${name}: it has no "${p}".`);
  }
  if ('Impact' in q.parts && !q.impact) f.push(`${name}: its impact must read High, Medium or Low, then the reason.`);
  if ('Severity' in q.parts && !q.severity) f.push(`${name}: its severity must read High, Medium or Low, then the reason.`);
  if ("Why I'm asking" in q.parts && partText(q.parts["Why I'm asking"]) && !CITES_A_FILE.test(partText(q.parts["Why I'm asking"]))) {
    f.push(`${name}: "Why I'm asking" must cite a file, or say that no file speaks to it.`);
  }
  if ('Answers' in q.parts) f.push(...checkAnswers(name, list(q.parts.Answers)));
  return f;
}

// The answers are the real choices, each with why you'd pick it and what happens next, plus "I don't know yet", once.
function checkAnswers(name: string, answers: readonly string[]): string[] {
  const f: string[] = [];
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
  return f;
}

// Every gap in the project's documents, outside the Question log, the Version log and the Glossary.
export function gapsIn(projectFolder: string, logRel: string): Gap[] {
  const out: Gap[] = [];
  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const rel = path.relative(projectFolder, p).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (!NO_GAPS_IN.includes(rel)) walk(p);
      } else if (rel.endsWith('.md') && rel !== logRel) out.push(...gapsInFile(p, rel));
    }
  };
  walk(projectFolder);
  return out;
}

export function gapsInFile(file: string, rel: string): Gap[] {
  const out: Gap[] = [];
  let fence = false;
  let skip = false;
  readText(file).split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const h = line.match(/^##\s+(.*)$/);
    if (h) skip = NO_GAPS_UNDER.includes(normalize(h[1]));
    // Skipped: the italic line under a heading, which states a rule, and a tracker's work item ID, which stays TBD on purpose.
    if (skip || /^\s*\*[^*]/.test(line) || /Work item/i.test(line)) return;
    // A label in backticks is a form written out, such as `[TBD, Q{n}]`, never a gap.
    const plain = line.replace(/`[^`]*`/g, (c) => ' '.repeat(c.length));
    for (const m of plain.matchAll(GAP)) {
      const short = m[0].match(TBD_MARK) || m[0].match(PROPOSED_MARK);
      if (short) {
        out.push({ rel, line: i + 1, label: m[0].startsWith('[') ? 'TBD' : 'Proposed (needs confirmation)', question: Number(short[1]), mark: m[0] });
        continue;
      }
      // The question is named in the same cell, after the label: up to the next "|" or line break in a cell.
      const rest = line.slice(m.index + m[0].length).split(/\||<br>/)[0];
      const named = rest.match(/question (\d+)/i);
      out.push({ rel, line: i + 1, label: m[0], question: named ? Number(named[1]) : null });
    }
  });
  return out;
}

// Open questions by the grid, then by number; answered ones by number. A malformed question has no number, and sorts
// as 0.
function sortKey(q: Question): [number, number | null] {
  return q.group === 'Answered' ? [0, q.n] : [q.rank ? q.rank.order : 99, q.n];
}

function cmp(a: readonly (number | null)[], b: readonly (number | null)[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return (a[i] ?? 0) - (b[i] ?? 0);
  return 0;
}

const inOrder = (a: Question, b: Question): number => cmp(sortKey(a), sortKey(b));

// The log's copy of the grid must match the template.
function gridCopyMatches(logPath: string): boolean {
  const asText = (rows: readonly Record<string, Cell>[]): string => rows.map((r) => `${r.Order}|${r.Severity}|${r.Impact}|${r.Group}`).join('\n');
  return asText(tableUnder(logPath, 'The grid') || []) === asText(tableUnder(TEMPLATE, 'The grid') || []);
}

// Writes the four question sections again, each question in its group and in order.
function rewriteLog(logPath: string, log: Log, questions: readonly Question[]): void {
  const out = [...log.before];
  for (const s of SECTIONS) {
    out.push(...log.heads[s], '');
    const qs = questions.filter((q) => q.group === s).sort(inOrder);
    if (!qs.length) out.push('None yet.', '');
    for (const q of qs) out.push(...q.lines, '');
  }
  out.push(...log.after);
  writeText(logPath, out.join('\n'));
}

// Grades every question in the log, and puts the log in order unless checkOnly.
function gradeLog(log: Log, grid: Grid, logPath: string, result: Graded, checkOnly: boolean): void {
  if (!gridCopyMatches(logPath)) result.findings.push("The log's copy of the grid doesn't match the template's.");

  const seen = new Set<number>();
  const questions: Question[] = [];
  for (const logged of log.questions) {
    if (logged.n !== null) {
      if (seen.has(logged.n)) result.findings.push(`Question ${logged.n} appears twice.`);
      seen.add(logged.n);
    }
    const q = rate(logged, grid);
    questions.push(q);
    result.findings.push(...checkQuestion(q));
    if (q.group !== q.section) result.moves.push(`Question ${q.n} moves from ${q.section} to ${q.group}.`);
  }
  result.questions = questions;

  for (const s of SECTIONS) {
    const now = questions.filter((q) => q.section === s).map((q) => q.n);
    const want = questions.filter((q) => q.group === s).sort(inOrder).map((q) => q.n);
    if (now.length && now.join() !== want.join()) result.moves.push(`${s} is put in order: ${want.map((n) => `question ${n}`).join(', ')}.`);
  }

  result.open = questions.filter((q) => q.group !== 'Answered').sort(inOrder);
  for (const g of GROUPS) result.counts[g] = result.open.filter((q) => q.group === g).length;
  result.counts.Answered = questions.filter((q) => q.group === 'Answered').length;
  result.order = result.open.map((q) => ({ n: q.n, group: q.group, title: q.title, severity: q.severity, impact: q.impact }));

  if (!checkOnly && result.moves.length) rewriteLog(logPath, log, questions);
}

// Every gap must name a question that is in the log.
function checkGaps(projectFolder: string, logRel: string, result: Graded): void {
  const numbers = new Set(result.questions.map((q) => q.n));
  const answered = new Set(result.questions.filter((q) => q.group === 'Answered').map((q) => q.n));
  for (const g of gapsIn(projectFolder, logRel)) {
    if (g.question === null) result.findings.push(`${g.rel}, line ${g.line}: "${g.label}" names no question. Write it as "${g.label}, question {number}".`);
    else if (!numbers.has(g.question)) result.findings.push(`${g.rel}, line ${g.line}: "${g.label}" names question ${g.question}, which isn't in the Question log.`);
    else if (answered.has(g.question)) result.notes.push(`${g.rel}, line ${g.line}: question ${g.question} is answered, and the document will show the answer once the change that brings it in is accepted.`);
  }
}

export function grade(project: string, opts: GradeOptions = {}): Graded {
  if (!fs.existsSync(TEMPLATE)) throw new LayoutError(`The Question log template is missing: ${TEMPLATE}`);
  const grid = readGrid(TEMPLATE);
  const projectFolder = projectDir(project, opts);
  if (!fs.existsSync(projectFolder)) throw new LayoutError(`The project folder doesn't exist: ${projectFolder}`);
  const logRel = relOf('question-log', { product: project });
  const logPath = path.join(projectFolder, logRel);
  const result: Graded = { logRel, questions: [], open: [], counts: {}, order: [], findings: [], moves: [], notes: [] };

  if (fs.existsSync(logPath)) {
    const { problems, log } = readLog(readText(logPath));
    result.findings.push(...problems);
    if (log) gradeLog(log, grid, logPath, result, Boolean(opts.checkOnly));
  } else {
    result.notes.push('There is no Question log yet.');
  }

  checkGaps(projectFolder, logRel, result);
  return result;
}

function report(r: Graded, date: string): string {
  const open = r.open.length;
  const counts = `${r.counts['Must answer'] || 0} must answer, ${r.counts['Should answer'] || 0} should answer, ${r.counts['Can move ahead'] || 0} can move ahead`;
  const person: string[] = [];
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
  const file = [`${programName(import.meta.filename)}, ${date}: ${plural(open, 'open question')} (${counts}), ${r.counts.Answered || 0} answered, ${plural(r.findings.length, 'finding')}.`];
  for (const f of r.findings) file.push(`- ${f}`);
  return ['For the person:', ...person, '', 'One line:', line, '', 'For the file:', ...file, ''].join('\n');
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/grade-questions.ts --project <p> [--check-only]');
  const date = textOption(args, 'date') || today();
  const graded = grade(project, { output: args.output, checkOnly: hasOption(args, 'check-only') });
  process.stdout.write(report(graded, date));
  return graded.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
