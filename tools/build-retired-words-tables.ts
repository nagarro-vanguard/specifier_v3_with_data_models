// build-retired-words-tables.ts — writes the "Terms replaced or retired over time" table on each of the four kind
// pages from the gate log, in the order the glossary method's G8 sets. Never edited by hand.
//
//   node tools/build-retired-words-tables.ts --project <p>
//
// What it does:
//   1. reads every word the gate log replaces: each Gate 1, Re-run and Change row's Resolution, in the form
//      output-formats.md sets, such as "basket: merged into Cart", through build-glossary-records.ts
//   2. while any gate-log row is still open, it writes nothing, and lists the open rows
//   3. gives each word one row: Earlier word, What happened, Use now, Decision and Date (G8 rules 2 to 8):
//      - Use now is always the term used today, followed through every later rename, merge or split, or "-" when the
//        word was withdrawn with nothing in its place
//      - Decision is the register row that settled it, with the same D-n build-glossary-records.ts gives it
//   4. puts each row on the kind page of the term in Use now, or, for a word withdrawn with nothing in its place, of
//      the word itself, in G8's order (rule 6): rows for the same term together, in the order the terms appear on the
//      page; the latest change first; rows with "-" last
//   5. writes only that table on each page, under its explainer and the line "Filled in by a program from the gate
//      log. Never edit by hand.", or "None yet." when a page has no rows
//
// Exports: build(project, opts), ordered(rows, order) and termOrder(pageText), and the type RetiredRow.
//
// Exit codes: 0 written; 1 a gate-log row is still open, or a word's term has no kind or no definition on its page,
// each listed; 2 the gate log, a kind page or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, readText, writeText, LayoutError, type PathOptions } from './lib/run-paths.ts';
import { plural } from './lib/text.ts';
import {
  readGateLog, decisionIds, retiredMap, termKinds, outcomesOf, follow, kindPage, anchorOf, type GateRow, type OutcomeKind,
} from './build-glossary-records.ts';

// Each kind page, and its name in project-folders.md.
const PAGES = { 'object-terms.md': 'object-terms', 'role-terms.md': 'role-terms', 'step-terms.md': 'step-terms', 'states-and-values.md': 'states-and-values' } as const;
const HEADING = '## Terms replaced or retired over time';
const FIXED = 'Filled in by a program from the gate log. Never edit by hand.';
const low = (s: string): string => String(s).trim().toLowerCase();

// One row of a kind page's table.
export interface RetiredRow {
  earlier: string;
  what: OutcomeKind;
  useNow: string[];
  page: string;
  n: number;
  date: string;
}

interface BuildResult {
  written: string[];
  findings: string[];
}

// The anchors of the terms on a page, in the order they appear above the retired-words table.
export function termOrder(pageText: string): string[] {
  const main = pageText.slice(0, Math.max(0, pageText.indexOf(HEADING)) || pageText.length);
  return [...main.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]);
}

function rowsFor(logRows: GateRow[]): { rows: RetiredRow[]; findings: string[] } {
  const ids = decisionIds(logRows);
  const retired = retiredMap(logRows, ids);
  const kinds = termKinds(logRows);
  const out: RetiredRow[] = [];
  const findings: string[] = [];
  for (const r of logRows) {
    const n = ids.get(r.id);
    if (!n) continue;
    for (const o of outcomesOf(r)) {
      // Use now: followed through every later change, from this word's own outcome.
      const useNow = o.what === 'withdrawn' ? [] : o.terms.flatMap((t) => follow(t, retired).terms);
      const kindOf = useNow.length ? useNow[0] : o.earlier;
      const page = kindPage(kinds.get(low(kindOf)) || '');
      if (!page) { findings.push(`${r.id}: "${o.earlier}" has no kind page: "${kindOf}" has no kind in Gate 2.`); continue; }
      out.push({ earlier: o.earlier, what: o.what, useNow, page, n, date: r.decided });
    }
  }
  return { rows: out, findings };
}

// G8 rule 6: groups by the term in Use now, in the page's order; inside a group the latest first, the same date in the
// register's order; rows with "-" last, latest first.
export function ordered(rows: RetiredRow[], order: string[]): RetiredRow[] {
  // A term missing from the page is a finding; its rows go after the page's own terms, before the "-" rows.
  const at = (r: RetiredRow): number => {
    if (!r.useNow.length) return Infinity;
    const i = order.indexOf(anchorOf(r.useNow[0]));
    return i < 0 ? order.length : i;
  };
  const byDate = (a: RetiredRow, b: RetiredRow): number => (a.date === b.date ? a.n - b.n : a.date < b.date ? 1 : -1);
  return rows.slice().sort((a, b) => at(a) - at(b) || byDate(a, b));
}

function tableLines(rows: RetiredRow[]): string[] {
  if (!rows.length) return ['None yet.'];
  return [
    '| Earlier word | What happened | Use now | Decision | Date |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.earlier} | ${r.what} | ${r.useNow.length ? r.useNow.map((t) => `[${t}](#${anchorOf(t)})`).join('<br>') : '-'} | [D-${r.n}](decision-register.md#d-${r.n}) | ${r.date || '-'} |`),
  ];
}

// Replaces everything under the heading, after its explainer, up to the next heading or rule.
function writeTable(file: string, lines: string[]): void {
  const all = readText(file).split('\n');
  const start = all.findIndex((l) => l.trim() === HEADING);
  if (start < 0) throw new LayoutError(`${file} has no "Terms replaced or retired over time" part. Write the page from its template first.`);
  let end = all.findIndex((l, i) => i > start && (/^## /.test(l) || /^---\s*$/.test(l)));
  if (end < 0) end = all.length;
  const explainer = all.slice(start + 1, end).filter((l) => /^\*\*[^*]+\*\*/.test(l));
  writeText(file, [...all.slice(0, start + 1), '', ...explainer, '', FIXED, '', ...lines, '', ...all.slice(end)].join('\n'));
}

export function build(project: string, opts: PathOptions = {}): BuildResult {
  const logFile = pathOf(project, 'gate-log', {}, opts);
  if (!fs.existsSync(logFile)) throw new LayoutError(`There is no gate log yet: ${logFile}`);
  const logRows = readGateLog(readText(logFile));
  const open = logRows.filter((r) => !r.status || r.status === 'open');
  if (open.length) return { written: [], findings: open.map((r) => `${r.id} is still open. Nothing is built until every row is resolved.`) };
  const { rows, findings } = rowsFor(logRows);
  const written: string[] = [];
  for (const [page, name] of Object.entries(PAGES)) {
    const file = pathOf(project, name, {}, opts);
    if (!fs.existsSync(file)) throw new LayoutError(`The kind page isn't there yet: ${file}. Write it from its template first.`);
    const order = termOrder(readText(file));
    const mine = rows.filter((r) => r.page === page);
    for (const r of mine) for (const t of r.useNow) if (!order.includes(anchorOf(t))) findings.push(`${page}: "${r.earlier}" points to ${t}, which has no definition on the page.`);
    writeTable(file, tableLines(ordered(mine, order)));
    written.push(`${page}: ${plural(mine.length, 'row')}`);
  }
  return { written, findings };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/build-retired-words-tables.ts --project <p>');
  const result = build(project, { output: args.output });
  if (result.written.length) process.stdout.write(`Terms replaced or retired over time, from the gate log:\n${result.written.map((w) => `- ${w}`).join('\n')}\n`);
  if (result.findings.length) process.stdout.write(`${plural(result.findings.length, 'finding')}:\n${result.findings.map((f) => `- ${f}`).join('\n')}\n`);
  return result.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
