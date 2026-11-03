// fill-also-written-as.ts — before Gate 2 is shown, fills each Gate 2 row's "Also written as" from the settled
// Gate 1 rows, so the words a term replaces are copied by a program, never retyped.
//
//   node tools/fill-also-written-as.ts --project <p>
//
// What it does:
//   1. reads every Gate 1 row of the gate log, in Gate 1 and in any Re-run part, through build-glossary-records.ts
//   2. while any of them is still open, it writes nothing, and lists them
//   3. for each word a Gate 1 row renamed to, merged into or split into a term, notes that word against the term
//   4. writes, in each Gate 2 row, the term's words under "Also written as", one per line, or "-" when there are none.
//      It writes only that column: every other cell stays exactly as it is.
//
// Exports: fill(project, opts), and cellsOf(line), a table row's cells as written.
//
// Exit codes: 0 filled; 1 a Gate 1 row is still open, each listed; 2 the gate log or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, readText, writeText, LayoutError, type PathOptions } from './lib/run-paths.ts';
import { plural } from './lib/text.ts';
import { readGateLog, outcomesOf, type GateRow } from './build-glossary-records.ts';

const GATE1 = ['conflict', 'weak', 'candidate', 'question'] as const;
const low = (s: string): string => String(s).trim().toLowerCase();

interface FillResult {
  filled: number;
  findings: string[];
}

// The cells of a table row, keeping each cell's text as written. A "\|" stays inside its cell.
export function cellsOf(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells: string[] = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') { cur += '\\|'; i++; } else if (s[i] === '|') { cells.push(cur.trim()); cur = ''; } else cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

// Each term, in lowercase, and the earlier words it replaces, in the order the gate log gives them.
function wordsByTerm(gate1: GateRow[]): Map<string, string[]> {
  const words = new Map<string, string[]>();
  for (const r of gate1) {
    for (const o of outcomesOf(r)) {
      for (const t of o.terms) {
        let these = words.get(low(t));
        if (!these) words.set(low(t), (these = []));
        if (!these.some((w) => low(w) === low(o.earlier))) these.push(o.earlier);
      }
    }
  }
  return words;
}

// Rewrites only the "Also written as" cell of each row in a table that has both "Term" and "Also written as", and
// returns how many rows it filled.
function fillTables(lines: string[], words: Map<string, string[]>): number {
  let header: string[] | null = null;
  let filled = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!/^\s*\|/.test(l)) { header = null; continue; }
    if (/^\s*\|?\s*:?-{2,}/.test(l)) continue;
    if (!header) { header = cellsOf(l); continue; }
    const at = header.indexOf('Also written as');
    const termAt = header.indexOf('Term');
    if (at < 0 || termAt < 0) continue;
    const cells = cellsOf(l);
    const term = cells[termAt];
    if (!term || /^\{/.test(term)) continue;
    const these = words.get(low(term)) || [];
    cells[at] = these.length ? these.join('<br>') : '-';
    lines[i] = `| ${cells.join(' | ')} |`;
    filled++;
  }
  return filled;
}

export function fill(project: string, opts: PathOptions = {}): FillResult {
  const file = pathOf(project, 'gate-log', {}, opts);
  if (!fs.existsSync(file)) throw new LayoutError(`There is no gate log yet: ${file}`);
  const before = readText(file);
  const rows = readGateLog(before);
  const gate1 = rows.filter((r) => (GATE1 as readonly string[]).includes(r.table));
  const open = gate1.filter((r) => !r.status || r.status === 'open');
  if (open.length) return { filled: 0, findings: open.map((r) => `${r.id} is still open. "Also written as" is filled once every Gate 1 row is resolved.`) };

  const lines = before.split('\n');
  const filled = fillTables(lines, wordsByTerm(gate1));
  const after = lines.join('\n');
  if (after !== before) writeText(file, after);
  return { filled, findings: [] };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/fill-also-written-as.ts --project <p>');
  const result = fill(project, { output: args.output });
  if (result.findings.length) {
    process.stdout.write(`${plural(result.findings.length, 'finding')}:\n${result.findings.map((f) => `- ${f}`).join('\n')}\n`);
    return 1;
  }
  process.stdout.write(`Filled "Also written as" in ${plural(result.filled, 'Gate 2 row')}.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
