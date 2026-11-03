// build-glossary-records.ts — builds the decision register and every section decisions file from the gate log, the
// only place a glossary decision is written.
//
//   node tools/build-glossary-records.ts --project <p>
//
// What it does:
//   1. reads every row of the gate log, in order: Gate 1's four tables, Gate 2, then each Change and Re-run part
//   2. while any row is still open, or a row's "Applies to" is neither a link to a section's folder nor All sections,
//      it writes nothing, and lists those rows
//   3. gives each resolved row a decision id, D-1 onward, in the log's order, so the same log always gives the same ids,
//      and writes the register's table under "The register" in glossary/decision-register.md. The rest of that page is
//      glossary-author's, and is left as it is.
//   4. writes glossary/deep-dives/{section}/{section}-decisions.md for every section, whole, from its template: one row
//      for every candidate in the section's draft, in the draft's order, with what the gates did to it
//
// Each row's Resolution is read in the form output-formats.md sets ("The gate log"): the word the glossary uses, then
// one line for each word it replaces, such as "basket: merged into Cart".
//
// Exports, so fill-also-written-as.ts and build-retired-words-tables.ts read the gate log the same way:
//   readGateLog(text)            every row, in order, with its part, its table and its cells
//   decisionIds(rows)            each resolved row's D-n
//   outcomesOf(row)              the words a row replaces: { earlier, what, terms }
//   termKinds(rows)              each term's kind, from Gate 2 and the changes after it
//   kindPage(kind)               the kind page a kind's terms live on
//   anchorOf(term)               the anchor of a term's definition, in kebab-case
//   currentTerms(rows)           the terms the glossary uses now
//   follow(word, retired)        the terms a word ends up as, and the decision that put it there
//   retiredMap(rows, ids)        each word a resolved row replaces, with its outcome and its D-n
//   build(project, opts)         writes the register and the section decisions files
//   and the types GateRow, Outcome, Retired and Followed.
//
// Exit codes: 0 written; 1 a gate-log row is still open or its "Applies to" is wrong, or a candidate has no outcome,
// each listed; 2 the gate log,
// the register page, a section's draft or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { KIT_ROOT, pathOf, projectDir, readText, writeText, LayoutError, type PathOptions } from './lib/run-paths.ts';
import { headings, tableUnder, list, type Cell, type Row } from './lib/md-tables.ts';
import { plural } from './lib/text.ts';

const TEMPLATES = path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'glossary', 'templates');
const OUTCOME = /^(.+?):\s+(renamed to|merged into|split into|withdrawn)(?:\s+(.+))?$/i;
// "Applies to" is a link to a section's folder, such as [claims](claims/), or All sections (output-formats.md, "The
// gate log"). Any other link would build a broken "Where" link, so it is a finding, and nothing is written.
const APPLIES_TO = /^\[([^\]]+)\]\(([^)/]+)\/?\)$/;
const CANDIDATE_QUESTION = /Should\s+"?(.+?)"?\s+be a glossary term\?/i;
// The tables whose rows replace words.
const REPLACING = ['conflict', 'weak', 'change'] as const;

// The kind of row, from its part and its table.
export type GateTable = 'definition' | 'change' | 'conflict' | 'weak' | 'candidate' | 'question' | 'unknown';
export type OutcomeKind = 'renamed' | 'merged' | 'split' | 'withdrawn';

const WHAT: Record<string, OutcomeKind> = { 'renamed to': 'renamed', 'merged into': 'merged', 'split into': 'split', withdrawn: 'withdrawn' };

// One gate-log row, with the cells the records are built from.
export interface GateRow {
  id: string;
  anchor: string;
  part: string;
  table: GateTable;
  appliesTo: string;
  question: string;
  recommended: string;
  recommendedCell: string;
  term: string;
  kind: string;
  source: string;
  sourceCell: string;
  status: string;
  resolution: string[];
  decided: string;
}

// A word a row replaces, what happened to it, and the terms it became.
export interface Outcome {
  earlier: string;
  what: OutcomeKind;
  terms: string[];
}

export interface Retired extends Outcome {
  n: number;
  row: GateRow;
}

export interface Followed {
  terms: string[];
  n: number;
}

export interface BuildResult {
  written: string[];
  findings: string[];
  decisions?: number;
}

interface SectionDecisions {
  text: string;
  findings: string[];
}

const cellLines = (c: Cell | undefined): string[] => list(c).map((x) => String(x).trim()).filter(Boolean);
const joined = (c: Cell | undefined): string => cellLines(c).join(' ');
const low = (s: string): string => String(s).trim().toLowerCase();
// A cell carried into another page: several lines stay a list, one per line.
const carried = (c: Cell | undefined): string => { const ls = cellLines(c); return ls.length > 1 ? ls.map((l) => `• ${l}`).join('<br>') : (ls[0] || ''); };
// A link written in the gate log, in deep-dives/, made to work from the decision register, one folder up.
const fromDeepDives = (s: string): string => s.replace(/\]\((?!https?:\/\/|#|\/)([^)]*)\)/g, (_, p: string) => `](${path.posix.normalize(`deep-dives/${p}`)})`);
const replacesWords = (table: GateTable): boolean => (REPLACING as readonly string[]).includes(table);

function tableOf(part: string, heading: string, row: Row): GateTable {
  if ('Term' in row) return 'definition';
  if (/^Change\b/.test(part)) return 'change';
  if (/^Conflicts\b/.test(heading)) return 'conflict';
  if (/^Weak words\b/.test(heading)) return 'weak';
  if (/^Candidates to judge\b/.test(heading)) return 'candidate';
  if (/^Questions\b/.test(heading)) return 'question';
  return 'unknown';
}

export function readGateLog(textOfLog: string): GateRow[] {
  const parts = headings(textOfLog).filter((h) => h.level === 2 && /^(Gate [12]|Change|Re-run)\b/.test(h.text));
  const rows: GateRow[] = [];
  for (const p of parts) {
    for (const r of tableUnder(textOfLog, p.text) || []) {
      const raw = joined(r['#']);
      const anchor = (raw.match(/<a id="([^"]+)"><\/a>/) || [])[1];
      const id = raw.replace(/<a id="[^"]*"><\/a>/g, '').trim();
      if (!id || /^\{/.test(id)) continue;
      rows.push({
        id,
        anchor: anchor || low(id),
        part: p.text,
        table: tableOf(p.text, r._heading, r),
        appliesTo: joined(r['Applies to']),
        question: joined(r['The question']),
        recommended: joined(r['Recommended, and why']),
        recommendedCell: carried(r['Recommended, and why']),
        term: joined(r.Term),
        kind: joined(r.Kind),
        source: joined(r.Source),
        sourceCell: carried(r.Source),
        status: low(joined(r.Status)),
        resolution: cellLines(r.Resolution),
        decided: joined(r.Decided),
      });
    }
  }
  return rows;
}

export function decisionIds(rows: GateRow[]): Map<string, number> {
  const ids = new Map<string, number>();
  let n = 0;
  for (const r of rows) if (r.status && r.status !== 'open') ids.set(r.id, ++n);
  return ids;
}

export function outcomesOf(row: GateRow): Outcome[] {
  if (!replacesWords(row.table)) return [];
  return row.resolution.slice(1).map((l) => l.match(OUTCOME)).filter((m): m is RegExpMatchArray => m !== null).map((m) => ({
    earlier: m[1].trim(),
    what: WHAT[low(m[2])],
    terms: m[3] ? m[3].split(/\s+and\s+|,\s*/).map((t) => t.trim()).filter(Boolean) : [],
  }));
}

// Each term's kind: from its Gate 2 row, and for a word a change brings, the kind of the word it replaces.
export function termKinds(rows: GateRow[]): Map<string, string> {
  const kinds = new Map<string, string>();
  for (const r of rows) if (r.table === 'definition' && r.term) kinds.set(low(r.term), r.kind);
  for (const r of rows) {
    for (const o of outcomesOf(r)) {
      const earlierKind = kinds.get(low(o.earlier));
      if (earlierKind === undefined) continue;
      for (const t of o.terms) if (!kinds.has(low(t))) kinds.set(low(t), earlierKind);
    }
  }
  return kinds;
}

export function kindPage(kind: string): string | null {
  const k = low(kind);
  if (/^object/.test(k)) return 'object-terms.md';
  if (/^role/.test(k)) return 'role-terms.md';
  if (/^step/.test(k)) return 'step-terms.md';
  if (/state|value/.test(k)) return 'states-and-values.md';
  return null;
}

export function anchorOf(term: string): string {
  return low(term).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// The terms the glossary uses now: the log read in order, each Gate 2 term added, each word a row replaces taken
// away, and each word a change brings added.
export function currentTerms(rows: GateRow[]): Map<string, string> {
  const now = new Map<string, string>();
  for (const r of rows) {
    if (r.table === 'definition' && r.term) now.set(low(r.term), r.term);
    for (const o of outcomesOf(r)) {
      now.delete(low(o.earlier));
      if (r.table === 'change' && o.what !== 'merged') for (const t of o.terms) now.set(low(t), t);
    }
  }
  return now;
}

// Where a word ends up: each word it was renamed, merged or split into is followed to the terms used now. n is the
// latest decision on the way, the one that put the word where it is.
export function follow(word: string, retired: Map<string, Retired>, seen: Set<string> = new Set()): Followed {
  const r = retired.get(low(word));
  if (!r || seen.has(low(word))) return { terms: [word], n: 0 };
  seen.add(low(word));
  if (r.what === 'withdrawn') return { terms: [], n: r.n };
  const out = r.terms.map((t) => follow(t, retired, new Set(seen)));
  return { terms: out.flatMap((o) => o.terms), n: Math.max(r.n, ...out.map((o) => o.n)) };
}

export function retiredMap(rows: GateRow[], ids: Map<string, number>): Map<string, Retired> {
  const retired = new Map<string, Retired>();
  for (const r of rows) {
    const n = ids.get(r.id);
    if (n === undefined) continue;
    for (const o of outcomesOf(r)) retired.set(low(o.earlier), { ...o, n, row: r });
  }
  return retired;
}

function linkToTerm(term: string, kinds: Map<string, string>, from: string): string {
  const page = kindPage(kinds.get(low(term)) || '');
  return page ? `[${term}](${from}${page}#${anchorOf(term)})` : term;
}

// The candidate a "Should ... be a glossary term?" question asks about.
function candidateAskedAbout(question: string): string | undefined {
  return (question.match(CANDIDATE_QUESTION) || [])[1];
}

function register(rows: GateRow[], ids: Map<string, number>): string[] {
  const kinds = termKinds(rows);
  const out = ['| ID | Term | Where | Decided | Chosen | Retired / overrides | Basis | Gate row | Date |', '|---|---|---|---|---|---|---|---|---|'];
  const settled: { n: number; term: string }[] = []; // each register row's term, for a later change to name the decision it reverses
  for (const r of rows) {
    const n = ids.get(r.id);
    if (!n) continue;
    const chosen = r.resolution[0] || '-';
    let term = '-';
    let decided = r.question || '-';
    if (replacesWords(r.table)) term = chosen;
    else if (r.table === 'candidate') term = candidateAskedAbout(r.question) || '-';
    else if (r.table === 'definition') { term = r.term; decided = `the definition of ${r.term}`; }
    const retiredLines = outcomesOf(r).map((o) => `${o.earlier}: ${o.what}${o.terms.length ? ` ${o.what === 'split' ? 'into' : o.what === 'merged' ? 'into' : 'to'} ${o.terms.join(' and ')}` : ''}`);
    if (r.table === 'change') {
      const words = [...outcomesOf(r).map((o) => o.earlier), chosen].map(low);
      const before = settled.filter((s) => words.includes(s.term)).pop();
      if (before) retiredLines.push(`overrides D-${before.n}`);
    }
    const basis = fromDeepDives(r.table === 'definition' ? (r.sourceCell || '-') : r.status === 'overridden' ? `Overrode the recommendation: ${r.recommendedCell}` : (r.recommendedCell || '-'));
    const where = r.appliesTo.replace(APPLIES_TO, (_, name: string, p: string) => `[${name}](deep-dives/${p}/${p}-glossary.md)`) || '-';
    const termCell = term === '-' || (r.table === 'candidate' && low(chosen) === 'drop') ? term : linkToTerm(term, kinds, '');
    const chosenCell = r.table === 'question' || r.table === 'definition' ? (r.resolution.length > 1 ? r.resolution.map((l) => `• ${l}`).join('<br>') : chosen) : chosen;
    out.push(`| <a id="d-${n}"></a>D-${n} | ${termCell} | ${where} | ${decided} | ${chosenCell} | ${retiredLines.length ? retiredLines.join('<br>') : '-'} | ${basis} | [${r.id}](deep-dives/gate-log.md#${r.anchor}) | ${r.decided || '-'} |`);
    settled.push({ n, term: low(term) });
  }
  return out;
}

function appliesToFindings(rows: GateRow[], sections: string[]): string[] {
  const out: string[] = [];
  for (const r of rows) {
    if (/^all sections$/i.test(r.appliesTo)) continue;
    const m = r.appliesTo.match(APPLIES_TO);
    if (m && sections.includes(m[2])) continue;
    const folder = (r.appliesTo.match(/\]\(([^)/]+)\//) || [])[1];
    const fix = sections.includes(folder) ? `[${folder}](${folder}/)` : 'a link to the section\'s folder, such as [claims](claims/)';
    out.push(`${r.id}: "Applies to" reads "${r.appliesTo || 'nothing'}". Write ${fix}, or All sections.`);
  }
  return out;
}

// The register page keeps everything glossary-author wrote; only the table under "The register" is replaced.
function writeRegisterTable(file: string, table: string[]): void {
  const all = readText(file).split('\n');
  const start = all.findIndex((l) => /^## The register\s*$/.test(l));
  if (start < 0) throw new LayoutError(`${file} has no "The register" section. Write the page from its template first.`);
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  const keep = all.slice(start, end).filter((l) => !/^\|/.test(l) && !/^None yet\.?\s*$/.test(l));
  while (keep.length && keep[keep.length - 1].trim() === '') keep.pop();
  writeText(file, [...all.slice(0, start), ...keep, '', ...table, '', ...all.slice(end)].join('\n'));
}

// Each candidate the gates dropped, with its D-n.
function droppedAtGate(rows: GateRow[], ids: Map<string, number>): Map<string, number> {
  const dropped = new Map<string, number>();
  for (const r of rows) {
    const n = ids.get(r.id);
    if (r.table !== 'candidate' || n === undefined || low(r.resolution[0] || '') !== 'drop') continue;
    const c = candidateAskedAbout(r.question);
    if (c) dropped.set(low(c), n);
  }
  return dropped;
}

// The section decisions template, with its notes taken out and the section's name filled in.
function sectionTemplate(section: string): string {
  return readText(path.join(TEMPLATES, 'section-decisions.md'))
    .split('\n')
    .filter((l) => !/^<!--.*-->\s*$/.test(l) && !/^None yet - written once the gates are passed\.\s*$/.test(l))
    .join('\n')
    .replace(/\{section\}/g, section);
}

// One section's decisions file, whole, from its template.
function sectionDecisions(section: string, draftText: string, rows: GateRow[], ids: Map<string, number>, dropped: Map<string, string>): SectionDecisions {
  const kinds = termKinds(rows);
  const retired = retiredMap(rows, ids);
  const now = currentTerms(rows);
  const chosenBy = new Map<string, number>();
  for (const r of rows) {
    const n = ids.get(r.id);
    if (n !== undefined && replacesWords(r.table) && r.resolution[0]) chosenBy.set(low(r.resolution[0]), n);
  }
  const atGate = droppedAtGate(rows, ids);
  const findings: string[] = [];
  const link = (t: string) => linkToTerm(t, kinds, '../../');
  const dLink = (n: number | undefined) => `[D-${n}](../../decision-register.md#d-${n})`;
  // "None." is the empty-table marker (lens1-ontology.md), not a candidate, so it never needs an outcome.
  const candidates = (tableUnder(draftText, 'The candidates found (ontology)') || []).map((r) => joined(r.Candidate)).filter((c) => c && !/^\{/.test(c) && low(c) !== 'none.' && low(c) !== 'none');
  const out: string[] = [];
  for (const c of candidates) {
    const k = low(c);
    const r = retired.get(k);
    if (r) {
      const f = follow(c, retired);
      const outcome = f.terms.length === 0 ? 'dropped' : r.what === 'merged' ? 'merged' : 'renamed';
      out.push(`| ${c} | ${outcome} | ${f.terms.length ? f.terms.map(link).join('<br>') : '-'} | ${dLink(f.n || r.n)} |`);
    } else if (now.has(k)) {
      out.push(`| ${c} | kept | ${link(now.get(k) ?? '')} | ${chosenBy.has(k) ? dLink(chosenBy.get(k)) : '-'} |`);
    } else if (atGate.has(k)) {
      out.push(`| ${c} | dropped | - | ${dLink(atGate.get(k))} |`);
    } else if (dropped.has(k)) {
      out.push(`| ${c} | dropped | - | failed ${dropped.get(k)} |`);
    } else {
      out.push(`| ${c} | pending | - | - |`);
      findings.push(`${section}: the candidate "${c}" has no outcome: it isn't a term, and no gate row or failed test settles it.`);
    }
  }
  const template = sectionTemplate(section);
  const placeholderRow = template.split('\n').find((l) => /^\| \{candidate\} \|/.test(l));
  const filled = placeholderRow ? template.replace(placeholderRow, out.join('\n')) : template;
  return { text: filled.replace(/\n{3,}/g, '\n\n'), findings };
}

// Candidates the assembly draft dropped for failing a test, by section: Map(section -> Map(candidate -> test)).
function droppedInDraft(project: string, opts: PathOptions): Map<string, Map<string, string>> {
  const file = pathOf(project, 'glossary-assembly-draft', {}, opts);
  const by = new Map<string, Map<string, string>>();
  if (!fs.existsSync(file)) return by;
  for (const r of tableUnder(file, 'Candidates dropped, and why') || []) {
    const section = (joined(r['Found in']).match(/\]\(([^/)]+)\//) || [])[1];
    if (!section) continue;
    let tests = by.get(section);
    if (!tests) by.set(section, (tests = new Map()));
    tests.set(low(joined(r.Candidate)), joined(r['Test failed']));
  }
  return by;
}

export function build(project: string, opts: PathOptions = {}): BuildResult {
  const logFile = pathOf(project, 'gate-log', {}, opts);
  if (!fs.existsSync(logFile)) throw new LayoutError(`There is no gate log yet: ${logFile}`);
  const rows = readGateLog(readText(logFile));
  const open = rows.filter((r) => !r.status || r.status === 'open');
  if (open.length) return { written: [], findings: open.map((r) => `${r.id} is still open. Nothing is built until every row is resolved.`) };
  const deep = pathOf(project, 'deep-dives', {}, opts);
  const sections = fs.readdirSync(deep, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name).sort();
  const badLinks = appliesToFindings(rows, sections);
  if (badLinks.length) return { written: [], findings: badLinks };
  const ids = decisionIds(rows);
  const registerFile = pathOf(project, 'decision-register', {}, opts);
  if (!fs.existsSync(registerFile)) throw new LayoutError(`The decision register page isn't there yet: ${registerFile}. Write it from its template first.`);
  writeRegisterTable(registerFile, register(rows, ids));
  const written = [path.relative(projectDir(project, opts), registerFile)];
  const findings: string[] = [];
  const dropped = droppedInDraft(project, opts);
  for (const section of sections) {
    const draft = pathOf(project, 'section-glossary', { section }, opts);
    if (!fs.existsSync(draft)) throw new LayoutError(`The section folder ${section}/ has no draft: ${draft}`);
    const decisions = sectionDecisions(section, readText(draft), rows, ids, dropped.get(section) || new Map<string, string>());
    const file = pathOf(project, 'section-decisions', { section }, opts);
    fs.writeFileSync(file, decisions.text);
    written.push(path.relative(projectDir(project, opts), file));
    findings.push(...decisions.findings);
  }
  return { written, findings, decisions: ids.size };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/build-glossary-records.ts --project <p>');
  const result = build(project, { output: args.output });
  if (result.written.length) {
    process.stdout.write(`Built from the gate log: ${result.decisions} decisions.\n${result.written.map((w) => `- ${w.split(path.sep).join('/')}`).join('\n')}\n`);
  }
  if (result.findings.length) process.stdout.write(`${plural(result.findings.length, 'finding')}:\n${result.findings.map((f) => `- ${f}`).join('\n')}\n`);
  return result.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
