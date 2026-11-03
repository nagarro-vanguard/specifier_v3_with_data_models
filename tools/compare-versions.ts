// compare-versions.ts — lists every difference between a new and an old version of a requirement file, so no quiet
// edit is missed.
//
//   node tools/compare-versions.ts --project <p> --change <nnn> --new <file> --old <file>
//
// Each file is found in the change's folder, then in the project's folder, then in the folder you work from. Both
// must be text: a Word or PDF file is compared from a text copy you bring beside it.
//
// What it does:
//   - when both versions hold requirement IDs, such as REQ-3.2, it compares them requirement by requirement. Each
//     requirement's text runs from the line its ID first appears on to the next ID. Each one is marked added, removed
//     or changed.
//   - otherwise it compares them line by line, and lists each line changed, added or removed
//   - for a requirement the PRD holds, it adds the kind the PRD gives it: Requirement, Purpose, Scope or Way of
//     working, such as "REQ-2.3, changed. The PRD holds it as Scope." change-request-disposition then judges whether
//     the new words change its kind, such as a Scope line that now asks for something to be built.
//   - it writes section 3 of the change's report, "Other differences in a new version": one row per difference, or
//     one line when there is none
//
// Exports: compare(newText, oldText), every difference; withKinds(diffs, kinds), each difference with the kind the PRD
// gives its requirement; prdKinds(project, opts), the kind the PRD gives each requirement.
//
// Exit codes: 0 written; 2 either version, the change, its report or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, pathOf, projectDir, readText, type PathOptions } from './lib/run-paths.ts';
import { changeOf, replaceSection, requirementsOf } from './lib/check-document.ts';
import { plural } from './lib/text.ts';

const USE = 'Use: node tools/compare-versions.ts --project <p> --change <nnn> --new <file> --old <file>';

// A requirement ID: the source's own, such as REQ-3.2, as traceability-map.ts reads it.
const ID = /\b(?!BR-|NFR-|F-|EPIC-|FRD-)[A-Z][A-Z0-9]*-\d+(?:\.\d+)*\b/;

// One difference: where it is, and the words before and after. null when there were none.
export interface Difference {
  where: string;
  before: string | null;
  after: string | null;
}

const quoted = (s: string | null): string => (s === null ? 'None' : `"${s.replace(/\|/g, '\\|')}"`);
const flat = (lines: string[]): string => lines.map((l) => l.trim()).filter(Boolean).join(' ');

function find(project: string, change: string, file: string, opts: PathOptions): string {
  const c = changeOf(project, change, opts);
  for (const dir of [c.dir, projectDir(project, opts), process.cwd()]) {
    const p = path.resolve(dir, file);
    if (fs.existsSync(p)) return p;
  }
  throw new LayoutError(`The file isn't there: ${file}. Look for it in ${c.dir}, or give its path.`);
}

// A version's requirements, by ID, in order: each runs from its ID's first line to the next ID's.
function requirements(lines: string[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const l of lines) {
    const m = l.match(ID);
    if (m && !out.has(m[0])) { current = []; out.set(m[0], current); }
    if (current) current.push(l);
  }
  return out;
}

// Line by line: the longest run of lines the two share, and every line outside it.
function lineDiff(a: string[], b: string[]): Difference[] {
  const n = a.length;
  const m = b.length;
  // shared[i][j]: how many lines a from i and b from j share, in order.
  const shared = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) shared[i][j] = a[i] === b[j] ? shared[i + 1][j + 1] + 1 : Math.max(shared[i + 1][j], shared[i][j + 1]);
  const out: Difference[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
    if (i < n && j < m && shared[i + 1][j] === shared[i][j + 1] && shared[i + 1][j + 1] === shared[i][j]) {
      if (a[i].trim() || b[j].trim()) out.push({ where: `line ${j + 1}`, before: a[i], after: b[j] });
      i++; j++;
    } else if (j < m && (i >= n || shared[i][j + 1] >= shared[i + 1][j])) {
      if (b[j].trim()) out.push({ where: `line ${j + 1}`, before: null, after: b[j] });
      j++;
    } else {
      if (a[i].trim()) out.push({ where: `line ${i + 1} of the old version`, before: a[i], after: null });
      i++;
    }
  }
  return out;
}

// The kind the PRD gives each requirement, by ID, or an empty map when the project has no PRD yet.
export function prdKinds(project: string, opts: PathOptions): Map<string, string> {
  const file = pathOf(project, 'prd', {}, opts);
  if (!fs.existsSync(file)) return new Map();
  const out = new Map<string, string>();
  for (const r of requirementsOf(readText(file))) {
    const id = String(Array.isArray(r.ID) ? r.ID.join(' ') : r.ID || '').match(ID)?.[0];
    if (id) out.set(id, r.kind);
  }
  return out;
}

// Each difference on a requirement the PRD holds says the kind the PRD gives it.
export function withKinds(diffs: Difference[], kinds: Map<string, string>): Difference[] {
  return diffs.map((d) => {
    const id = d.where.match(ID)?.[0];
    return id && kinds.has(id) && !/, added$/.test(d.where) ? { ...d, where: `${d.where}. The PRD holds it as ${kinds.get(id)}.` } : d;
  });
}

export function compare(newText: string, oldText: string): Difference[] {
  const a = oldText.split(/\r?\n/);
  const b = newText.split(/\r?\n/);
  const before = requirements(a);
  const after = requirements(b);
  if (!before.size || !after.size) return lineDiff(a, b);
  const out: Difference[] = [];
  for (const [id, lines] of after) {
    const old = before.get(id);
    if (!old) out.push({ where: `${id}, added`, before: null, after: flat(lines) });
    else if (flat(old) !== flat(lines)) out.push({ where: `${id}, changed`, before: flat(old), after: flat(lines) });
  }
  for (const [id, lines] of before) if (!after.has(id)) out.push({ where: `${id}, removed`, before: flat(lines), after: null });
  return out;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const newFile = requireOption(args, 'new', USE);
  const oldFile = requireOption(args, 'old', USE);
  const opts = { output: args.output };
  const c = changeOf(project, change, opts);
  if (!fs.existsSync(c.report)) throw new LayoutError(`The change has no report yet: ${c.report}`);
  const diffs = withKinds(compare(readText(find(project, change, newFile, opts)), readText(find(project, change, oldFile, opts))), prdKinds(project, opts));
  const body = diffs.length
    ? ['| Where | Before | After |', '|---|---|---|', ...diffs.map((d) => `| ${d.where} | ${quoted(d.before)} | ${quoted(d.after)} |`)]
    : [`The new version, ${path.basename(newFile)}, doesn't differ from ${path.basename(oldFile)}.`];
  replaceSection(c.report, 'Other differences in a new version', body);
  process.stdout.write(`${programName(import.meta.filename)}: change ${c.number}, ${plural(diffs.length, 'difference')}, written to section 3.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
