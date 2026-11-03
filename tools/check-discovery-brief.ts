// check-discovery-brief.ts — checks the Discovery brief before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-discovery-brief.ts --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the Discovery brief template, in order, with no section of its own
//   - section 1 lists every file list-sources.ts finds in sources/, once each, under its own folder, and nothing else:
//     - every copy and older version list-sources.ts marks is marked the same way, pointing to the same file
//     - "same as" is used only for files whose contents are identical
//     - every file not used gives its reason, and a file ruled out of scope names the decision that ruled it out, or,
//       until the gate settles it, reads "to be decided at the gate"
//     - the Summary's counts add up
//   - the order of authority ranks from 1, and covers every kind of document marked Used
//   - every topic sits under one of the nine areas, has a verdict that fits its quotes, and quotes only files marked
//     Used; every Silent topic names its question
//   - every Differ topic is a clash, and every clash is a Differ topic; every clash is settled: by a rank, where the
//     file of the higher kind wins, or by a decision that names its question. "What now holds" is in simple words.
//   - every assumption names its question, and every question named is in the Question log
//   - every risk says what it would cost
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - grade-questions.ts finds nothing wrong with this brief's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exports: check(project, opts), the brief's checks, for report().
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the brief, sources/ or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import type { PathOptions } from './lib/run-paths.ts';
import { tableUnder, normalize, list, cellText, type Cell, type Row } from './lib/md-tables.ts';
import { plural } from './lib/text.ts';
import {
  load, lines, opening, sections, placeholders, rendering, simpleWriting, questions, questionFindingsFor, report,
  type DocumentLine,
} from './lib/check-document.ts';
import { list as listSources, type SourceList } from './list-sources.ts';
import type { Check, CheckResult } from './lib/types.ts';

const AREAS = [
  'Users and context',
  'Problem and value',
  'Scope edges',
  'Rules and constraints',
  'Data and states',
  'Edge cases and failure modes',
  'Dependencies and integrations',
  'Success and acceptance',
  'Non-functional',
] as const;
const VERDICTS = ['Agree', 'One source', 'Differ', 'Silent'] as const;
const VERDICT = /^(Agree|One source|Differ|Silent)\b/;
const KINDS_OF_CLASH = ['Contradiction', 'Different value', 'Different scope'] as const;
const OUT_OF_SCOPE = /^No: out of scope\b(.*)$/;

const items = (c: Cell | undefined): string[] => list(c).map((x) => String(x).trim()).filter(Boolean);
const lower = (s: string): string => s.toLowerCase();

// One row of section 1.
interface SourceRow {
  n: number;
  rel: string;
  name: string;
  folder: string;
  kind: string;
  used: string;
}

// Section 1's rows, by number and by path, and what was wrong with reading them.
interface SourceTable {
  byNumber: Map<number, SourceRow>;
  byPath: Map<string, SourceRow>;
  findings: string[];
}

// A question a line names, and where: each must be in the Question log.
interface NamedQuestion {
  where: string;
  n: number;
}

interface CheckNamingQuestions {
  check: Check;
  named: NamedQuestion[];
}

interface Quote {
  quote: string;
  file: string;
}

// A link's target, decoded, from the project folder: [name](sources/a%20b/c.md) -> sources/a b/c.md
function target(cell: Cell | undefined): string | null {
  const m = cellText(cell).match(/\]\(([^)]+)\)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}

// Each quote in a cell: { quote, file }, from lines like: "Any employee can claim." — per claims-v2.docx, section 1.2
function quotes(cell: Cell | undefined): Quote[] {
  return items(cell)
    .map((q) => q.match(/^"(.*)"\s+—\s+per\s+([^,]+?)(?:,.*)?$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ quote: m[1], file: m[2].trim() }));
}

// The section a line sits in, by its level-2 heading.
function bodyOf(text: string, heading: string): DocumentLine[] {
  return lines(text).filter((l) => normalize(l.section) === lower(heading));
}

// Each decision in the Decision record, with the question it answers: Map(decision number -> question number or null).
function decisions(text: string): Map<number, number | null> {
  const out = new Map<number, number | null>();
  let current: number | null = null;
  for (const { line, section } of lines(text)) {
    if (normalize(section) !== 'decision record') continue;
    const h = line.match(/^###\s+Decision (\d+) — /);
    if (h) { current = Number(h[1]); out.set(current, null); }
    const q = line.match(/^- \*\*Question:\*\* (\d+)/);
    if (q && current !== null) out.set(current, Number(q[1]));
  }
  return out;
}

// Section 1's rows, each linking to a file in sources/, numbered from 1 and under its own folder.
function readSources(text: string): SourceTable {
  const rows = (tableUnder(text, 'Sources') || []).filter((r) => '#' in r && 'File' in r);
  const findings: string[] = [];
  const byNumber = new Map<number, SourceRow>();
  const byPath = new Map<string, SourceRow>();
  for (const r of rows) {
    const n = Number(cellText(r['#']));
    const p = target(r.File);
    if (!p || !p.startsWith('sources/')) { findings.push(`File ${n} doesn't link to a file in sources/.`); continue; }
    const rel = p.replace(/^sources\//, '');
    const row: SourceRow = { n, rel, name: rel.slice(rel.lastIndexOf('/') + 1), folder: r._heading, kind: cellText(r['Kind of document']), used: cellText(r.Used) };
    if (byNumber.has(n)) findings.push(`The number ${n} is used twice.`);
    if (byPath.has(rel)) findings.push(`${rel} is listed twice.`);
    byNumber.set(n, row);
    byPath.set(rel, row);
    const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/') + 1) : 'sources/';
    if (row.folder !== folder) findings.push(`File ${n}, ${rel}, is under "${row.folder}"; it belongs under "${folder}".`);
  }
  const numbers = [...byNumber.keys()].sort((a, b) => a - b);
  if (numbers.some((n, i) => n !== i + 1)) findings.push('The files are not numbered from 1 with no gaps.');
  return { byNumber, byPath, findings };
}

// A file proposed as out of scope by discovery-author, waiting for the gate to settle it.
function waitsForGate(row: SourceRow): boolean {
  const scope = row.used.match(OUT_OF_SCOPE);
  return Boolean(scope && /to be decided at the gate/.test(scope[1]));
}

// Section 1, against what list-sources.ts finds.
function sourcesCheck(table: SourceTable, listed: SourceList, decided: Map<number, number | null>, accepted: boolean): Check {
  const findings = [...table.findings];
  const { byNumber, byPath } = table;
  const found = new Map(listed.files.map((f) => [f.rel, f]));
  const pathOfN = (n: number) => listed.files.find((f) => f.n === n)?.rel;
  for (const f of listed.files) if (!byPath.has(f.rel)) findings.push(`${f.rel} is in sources/ but not in section 1.`);
  for (const [rel, row] of byPath) {
    const f = found.get(rel);
    if (!f) { findings.push(`File ${row.n}, ${rel}, isn't in sources/.`); continue; }
    const m = row.used.match(/^No: (same as|older version of) (\d+)\b/);
    const pointsTo = m && byNumber.get(Number(m[2]));
    if (f.mark) {
      const word = f.mark.kind === 'same' ? 'same as' : 'older version of';
      const want = pathOfN(f.mark.of);
      if (!m || m[1] !== word || !pointsTo || pointsTo.rel !== want) findings.push(`File ${row.n}, ${rel}: list-sources.ts marks it "${word}" ${want}; section 1 says "${row.used}".`);
    } else if (m && m[1] === 'same as') {
      findings.push(`File ${row.n}, ${rel}, is marked "same as", but its contents differ from every other file.`);
    } else if (m && m[1] === 'older version of' && !pointsTo) {
      findings.push(`File ${row.n}, ${rel}, is marked "older version of" a file number that isn't in section 1.`);
    }
    // Any other "older version of" is a judgement beyond what list-sources.ts can see, such as "draft" and "final":
    // allowed, and shown at the gate.
    if (!/^Yes$/.test(row.used) && !/^No: \S/.test(row.used)) findings.push(`File ${row.n}, ${rel}: "Used" is "${row.used}"; it should be Yes, or No with the reason.`);
    const scope = row.used.match(OUT_OF_SCOPE);
    if (scope) {
      // Proposed by discovery-author, and settled at the gate: the decision is named once it is made.
      const d = scope[1].match(/Decision (\d+)/);
      if (waitsForGate(row)) {
        if (accepted) findings.push(`File ${row.n}, ${rel}, still waits for its decision, but the brief is accepted.`);
      } else if (!d) findings.push(`File ${row.n}, ${rel}, is out of scope, but names no decision.`);
      else if (!decided.has(Number(d[1]))) findings.push(`File ${row.n}, ${rel}, names Decision ${d[1]}, which isn't in the Decision record.`);
    }
  }
  return { name: 'Sources', findings };
}

// A brief written before simple-writing-rules.md calls the Summary "At a glance".
function summaryCheck(text: string, byPath: Map<string, SourceRow>, used: SourceRow[]): Check {
  const glance: Record<string, Cell> = (tableUnder(text, 'Summary') || tableUnder(text, 'At a glance') || [])[0] || {};
  const rows = [...byPath.values()];
  const count = (re: RegExp) => rows.filter((r) => re.test(r.used)).length;
  const want = { Files: byPath.size, Used: used.length, 'Same as another file': count(/^No: same as /), 'Older version': count(/^No: older version of /), 'Out of scope': count(/^No: out of scope\b/) };
  const findings = Object.entries(want).filter(([k, v]) => Number(cellText(glance[k])) !== v).map(([k, v]) => `"${k}" says ${cellText(glance[k]) || 'nothing'}; the tables hold ${v}.`);
  return { name: 'Summary', findings };
}

// Section 2: the order of authority.
function orderCheck(ranks: Row[], rankOf: Map<string, number>, used: SourceRow[]): Check {
  const findings = ranks.length ? [] : ['There is no order of authority.'];
  ranks.forEach((r, i) => { if (Number(cellText(r.Rank)) !== i + 1) findings.push(`Row ${i + 1} has rank "${cellText(r.Rank)}"; it should be ${i + 1}.`); });
  for (const k of new Set(used.map((r) => r.kind))) if (!rankOf.has(lower(k))) findings.push(`"${k}" is a kind of document marked Used, but it has no rank.`);
  return { name: 'Order of authority', findings };
}

function verdictOf(row: Row): RegExpMatchArray | null {
  return cellText(row.Verdict).match(VERDICT);
}

// Section 3: topics and verdicts.
function topicsCheck(topics: Row[], usedNames: Set<string>): CheckNamingQuestions {
  const findings: string[] = [];
  const named: NamedQuestion[] = [];
  for (const r of topics) {
    const topic = cellText(r.Topic);
    const verdict = cellText(r.Verdict);
    const v = verdictOf(r);
    if (!(AREAS as readonly string[]).includes(r._heading)) findings.push(`"${topic}" is under "${r._heading}", which isn't one of the nine areas.`);
    if (!v) { findings.push(`"${topic}" has the verdict "${verdict}"; it should be Agree, One source, Differ or Silent.`); continue; }
    const qs = quotes(r['What the sources say']);
    const files = new Set(qs.map((q) => q.file));
    for (const f of files) if (!usedNames.has(f)) findings.push(`"${topic}" quotes ${f}, which isn't marked Used.`);
    if (v[1] === 'Silent') {
      if (qs.length) findings.push(`"${topic}" is Silent, but quotes a file.`);
      const q = verdict.match(/question (\d+)/i);
      if (!q) findings.push(`"${topic}" is Silent, but names no question.`);
      else named.push({ where: `"${topic}"`, n: Number(q[1]) });
    } else if (v[1] === 'One source' && files.size !== 1) findings.push(`"${topic}" is One source, but quotes ${plural(files.size, 'file')}.`);
    else if ((v[1] === 'Agree' || v[1] === 'Differ') && files.size < 2) findings.push(`"${topic}" is ${v[1]}, but quotes ${plural(files.size, 'file')}; it needs two or more.`);
  }
  return { check: { name: 'Topics', findings }, named };
}

// What section 4 needs from the earlier sections to check each clash.
interface ClashContext {
  text: string;
  differ: Set<string>;
  usedNames: Set<string>;
  kindOfFile: Map<string, string>;
  rankOf: Map<string, number>;
  decided: Map<number, number | null>;
}

// One clash's "Settled by": a rank, where the file of the higher kind wins, or a decision that names its question.
function settledFindings(r: Row, at: string, ctx: ClashContext, named: NamedQuestion[]): string[] {
  const findings: string[] = [];
  const by = cellText(r['Settled by']);
  const holds = cellText(r['What now holds']).replace(/^"|"$/g, '');
  const question = cellText(r.Question);
  const qs = quotes(r['What each file says']);
  const rank = by.match(/^Rank (\d+): (.+)$/);
  const dec = by.match(/^Decision (\d+)$/);
  if (!by || !holds) findings.push(`${at} has no winner: "Settled by" and "What now holds" must both be filled.`);
  else if (rank) {
    const kind = lower(rank[2]);
    if (ctx.rankOf.get(kind) !== Number(rank[1])) findings.push(`${at} is settled by "${by}", which isn't a rank in section 2.`);
    const kinds = qs.map((q) => ctx.rankOf.get(lower(ctx.kindOfFile.get(q.file) || ''))).filter((n): n is number => n !== undefined);
    if (kinds.length && Math.min(...kinds) !== Number(rank[1])) findings.push(`${at} is settled by rank ${rank[1]}, but a file of rank ${Math.min(...kinds)} is in the clash, and the higher kind wins.`);
    // "What now holds" says in simple words what the winning file says (simple-writing-rules.md, part 4), so it is
    // never compared with the file's own words.
    if (question !== '-') findings.push(`${at} is settled by a rank, so its question is "-", not "${question}".`);
  } else if (dec) {
    const n = Number(dec[1]);
    const q = question.match(/^question (\d+)$/i);
    if (!ctx.decided.has(n)) findings.push(`${at} is settled by Decision ${n}, which isn't in the Decision record.`);
    if (!q) findings.push(`${at} is settled by a decision, but names no question.`);
    else {
      named.push({ where: at, n: Number(q[1]) });
      if (ctx.decided.has(n) && ctx.decided.get(n) !== Number(q[1])) findings.push(`${at} names question ${q[1]}, but Decision ${n} answers question ${ctx.decided.get(n)}.`);
    }
  } else findings.push(`${at} is settled by "${by}"; it should be a rank, such as "Rank 1: Policy", or a decision, such as "Decision 2".`);
  return findings;
}

// Section 4: every Differ topic is a clash, and every clash is settled.
function clashesCheck(clashes: Row[], ctx: ClashContext): CheckNamingQuestions {
  const findings: string[] = [];
  const named: NamedQuestion[] = [];
  const clashTopics = new Set(clashes.map((r) => cellText(r.Topic)));
  for (const d of ctx.differ) if (!clashTopics.has(d)) findings.push(`"${d}" is marked Differ, but isn't a clash.`);
  for (const r of clashes) {
    const topic = cellText(r.Topic);
    const at = `Clash ${cellText(r['#'])}, "${topic}"`;
    if (!ctx.differ.has(topic)) findings.push(`${at} isn't a topic marked Differ in section 3.`);
    if (!(KINDS_OF_CLASH as readonly string[]).includes(cellText(r['Kind of clash']))) findings.push(`${at}: "${cellText(r['Kind of clash'])}" isn't a kind of clash: Contradiction, Different value or Different scope.`);
    for (const q of quotes(r['What each file says'])) if (!ctx.usedNames.has(q.file)) findings.push(`${at} quotes ${q.file}, which isn't marked Used.`);
    findings.push(...settledFindings(r, at, ctx, named));
  }
  if (!clashes.length && !bodyOf(ctx.text, 'Clashes, and how each is settled').some((l) => /^None\.?$/.test(l.line.trim()))) findings.push('There is no clash, so the section says None.');
  return { check: { name: 'Clashes', findings }, named };
}

// Section 5: every assumption names its question.
function assumedCheck(assumed: DocumentLine[]): CheckNamingQuestions {
  const findings: string[] = [];
  const named: NamedQuestion[] = [];
  for (const { line } of assumed) {
    const q = line.match(/Question (\d+)\.?\s*$/);
    const what = line.replace(/^- /, '').split(' — ')[0];
    if (!/ — why: /.test(line)) findings.push(`"${what}" doesn't say why we think so.`);
    if (!q) findings.push(`"${what}" names no question.`);
    else named.push({ where: `The assumption "${what}"`, n: Number(q[1]) });
  }
  return { check: { name: 'Assumed', findings }, named };
}

function risksCheck(risks: DocumentLine[]): Check {
  return { name: 'Risks', findings: risks.filter((l) => !/ — \S|\. The cost: \S/.test(l.line)).map((l) => `"${l.line.replace(/^- /, '')}" doesn't say what it would cost.`) };
}

export function check(project: string, opts: PathOptions = {}): CheckResult {
  const doc = load(project, 'discovery-brief', {}, opts);
  const text = doc.text;
  const listed = listSources(project, opts);
  const graded = questions(project, opts);
  const known = new Set((graded.questions || []).map((q) => q.n));
  const decided = decisions(text);

  const table = readSources(text);
  const sourceRows = [...table.byPath.values()];
  const used = sourceRows.filter((r) => r.used === 'Yes');
  const usedNames = new Set(used.map((r) => r.name));
  const ranks = tableUnder(text, 'Which kind of source wins') || [];
  const rankOf = new Map(ranks.map((r) => [lower(cellText(r['Kind of document'])), Number(cellText(r.Rank))]));
  const topics = tableUnder(text, 'Known: what the sources say, topic by topic') || [];
  const differ = new Set(topics.filter((r) => verdictOf(r)?.[1] === 'Differ').map((r) => cellText(r.Topic)));
  const clashes = tableUnder(text, 'Clashes, and how each is settled') || [];
  const assumed = bodyOf(text, 'Assumed').filter((l) => /^- \S/.test(l.line));
  const risks = bodyOf(text, 'Risks and edge cases').filter((l) => /^- \S/.test(l.line));

  const topicResult = topicsCheck(topics, usedNames);
  const kindOfFile = new Map(sourceRows.map((r) => [r.name, r.kind]));
  const clashResult = clashesCheck(clashes, { text, differ, usedNames, kindOfFile, rankOf, decided });
  const assumedResult = assumedCheck(assumed);
  const named = [...topicResult.named, ...clashResult.named, ...assumedResult.named];

  const questionFindings = questionFindingsFor(doc, graded);
  for (const { where, n } of named) if (!known.has(n)) questionFindings.push(`${where} names question ${n}, which isn't in the Question log.`);
  const writing = simpleWriting(text, { project, output: opts.output });
  const checks: Check[] = [
    { name: 'Opening', findings: opening(text) },
    { name: 'Sections', findings: sections(text, 'discovery-brief') },
    sourcesCheck(table, listed, decided, doc.status === 'accepted'),
    summaryCheck(text, table.byPath, used),
    orderCheck(ranks, rankOf, used),
    topicResult.check,
    clashResult.check,
    assumedResult.check,
    risksCheck(risks),
    { name: 'Placeholders', findings: placeholders(text) },
    { name: 'Display', findings: rendering(text) },
    { name: 'Simple writing', findings: writing.findings },
    { name: 'Question log', findings: questionFindings },
  ];

  // Counted only for files that are in sources/, as section 1's check counts them.
  const listedRels = new Set(listed.files.map((f) => f.rel));
  const proposedOut = sourceRows.filter((r) => listedRels.has(r.rel) && waitsForGate(r));
  const verdicts = VERDICTS.map((v) => `${topics.filter((r) => cellText(r.Verdict).startsWith(v)).length} ${v}`);
  const byRank = clashes.filter((r) => /^Rank /.test(cellText(r['Settled by']))).length;
  const holds = [
    `${plural(table.byPath.size, 'file')}, ${used.length} used`,
    plural(ranks.length, 'kind of document').replace(/kind of documents$/, 'kinds of document') + ' ranked',
    `${plural(topics.length, 'topic')}: ${verdicts.join(', ')}`,
    `${plural(clashes.length, 'clash').replace(/clashs$/, 'clashes')}: ${byRank} settled by rank, ${clashes.length - byRank} by a decision`,
    plural(assumed.length, 'assumption'),
    plural(risks.length, 'risk'),
  ];
  if (proposedOut.length) holds.push(`${plural(proposedOut.length, 'file')} proposed as out of scope, to be decided at the gate`);
  if (listed.toJudge.length) holds.push(`${plural(listed.toJudge.length, 'set')} of files that differ only by a date, judged by discovery-author`);
  return { doc, checks, holds, graded, notices: writing.notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-discovery-brief.ts --project <p>');
  const date = textOption(args, 'date') ?? today();
  const result = check(project, { output: args.output });
  const out = report({ program: programName(import.meta.filename), date, ...result });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
