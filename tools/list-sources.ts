// list-sources.ts — lists every file in a project's sources/ folder, and marks the ones that are the same as another,
// or an older version of another, so no file is missed or counted twice.
//
//   node tools/list-sources.ts --project <p>
//
// What it does:
//   1. lists every file under sources/, folder by folder, numbered from 1: the files directly in sources/ first, then
//      each folder in name order, and the files in each folder in name order
//   2. marks a file "same as" another when their contents are identical, keeping the one with the shortest name
//   3. marks a file "older version of" another when their names differ only by a version mark, such as v1 and v2,
//      and the other has the higher version
//   4. names, for discovery-author to judge, files whose names differ only by a date. A date often marks one of a
//      series, such as weekly notes, rather than an older version, so it is never marked by itself.
//   5. prints two blocks:
//      - "For the brief": the Summary's counts and one table per folder, in the shape of the Discovery brief's
//        section 1. The columns only a reader can fill are left as placeholders.
//      - "For discovery-author": the files to judge, or "None".
//
// Exports: list(project, opts), report(sources), stemOf(name, re), and the types SourceFile and SourceList.
//
// Exit codes: 0 listed; 2 sources/ is missing or empty, or the project or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, LayoutError, type PathOptions } from './lib/run-paths.ts';

// A version mark: v2, V2.1, ver 3, version 4, rev 5, standing alone between separators.
const VERSION = /(^|[\s._-])(?:v|ver|version|rev)[\s._-]?(\d+(?:\.\d+)*)(?=$|[\s._-])/i;
// A date: 2026-09-12, 2026_09_12, 2026.09.12 or 20260912, standing alone between separators.
const DATE = /(^|[\s._-])(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})(?=$|[\s._-])/;

// Why a file is not used: the same as file number `of`, or an older version of it.
export interface SourceMark {
  kind: 'same' | 'older';
  of: number;
}

export interface SourceFile {
  n: number;
  rel: string;
  name: string;
  // The folder inside sources/, ending in "/", or "" for a file directly in sources/.
  folder: string;
  mark: SourceMark | null;
}

export interface SourceList {
  files: SourceFile[];
  // Each set of files whose names differ only by a date.
  toJudge: SourceFile[][];
}

export interface Stem {
  key: string;
  mark: RegExpMatchArray;
}

function walk(dir: string, base: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else if (e.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function folderOf(rel: string): string {
  return rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/') + 1) : '';
}

// Files directly in sources/ first, then each folder in name order; files in name order within a folder.
function order(rels: string[]): string[] {
  return rels.slice().sort((a, b) => {
    const fa = folderOf(a);
    const fb = folderOf(b);
    if (fa !== fb) {
      if (fa === '') return -1;
      if (fb === '') return 1;
      return fa < fb ? -1 : 1;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function hashOf(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// The name with its version mark or date taken out, so names that differ only by that mark share a stem.
export function stemOf(name: string, re: RegExp): Stem | null {
  const ext = path.extname(name).toLowerCase();
  const base = name.slice(0, name.length - path.extname(name).length);
  const mark = base.match(re);
  if (!mark) return null;
  const at = mark.index ?? 0;
  const without = (base.slice(0, at) + mark[1] + base.slice(at + mark[0].length)).toLowerCase().replace(/[\s._-]+/g, '-').replace(/^-+|-+$/g, '');
  return { key: `${without}${ext}`, mark };
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

// A link to a source file, from the project folder, where the Discovery brief sits. Spaces are encoded, because a
// link's path never holds a space, and the client's own file names are never changed.
function link(rel: string): string {
  const name = rel.slice(rel.lastIndexOf('/') + 1);
  const href = `sources/${rel}`.split('/').map((s) => encodeURIComponent(s).replace(/%2F/g, '/')).join('/');
  return `[${name.replace(/([[\]|])/g, '\\$1')}](${href})`;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string | null): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (key === null) continue;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = []));
    group.push(item);
  }
  return groups;
}

// Same contents: the file with the shortest name is kept, as a copy's name is usually the original's plus
// something, such as "copy" or "(1)". Ties go to the first in the listing. Every other copy points to it.
function markCopies(dir: string, files: SourceFile[]): void {
  for (const group of groupBy(files, (f) => hashOf(path.join(dir, f.rel))).values()) {
    if (group.length < 2) continue;
    const kept = group.reduce((a, b) => (b.name.length < a.name.length ? b : a));
    for (const f of group) if (f !== kept) f.mark = { kind: 'same', of: kept.n };
  }
}

// Names that differ only by a version mark: every lower version points to the highest.
function markOlderVersions(files: SourceFile[]): void {
  const versioned: { f: SourceFile; key: string; version: string }[] = [];
  for (const f of files) {
    if (f.mark) continue;
    const stem = stemOf(f.name, VERSION);
    if (stem) versioned.push({ f, key: stem.key, version: stem.mark[2] });
  }
  for (const group of groupBy(versioned, (v) => v.key).values()) {
    if (group.length < 2) continue;
    const newest = group.reduce((a, b) => (compareVersions(b.version, a.version) > 0 ? b : a));
    for (const g of group) {
      if (g !== newest && compareVersions(g.version, newest.version) < 0) g.f.mark = { kind: 'older', of: newest.f.n };
    }
  }
}

// Names that differ only by a date: named for discovery-author to judge, never marked here.
function filesToJudge(files: SourceFile[]): SourceFile[][] {
  const byDateStem = groupBy(files.filter((f) => !f.mark), (f) => stemOf(f.name, DATE)?.key ?? null);
  return [...byDateStem.values()].filter((g) => g.length > 1);
}

export function list(project: string, opts: PathOptions = {}): SourceList {
  const dir = pathOf(project, 'sources', {}, opts);
  if (!fs.existsSync(dir)) throw new LayoutError(`There is no sources/ folder in the project: ${dir}`);
  const rels = order(walk(dir, dir));
  if (!rels.length) throw new LayoutError(`The sources/ folder is empty: ${dir}. Put the requirement files there first.`);

  const files: SourceFile[] = rels.map((rel, i) => ({ n: i + 1, rel, name: rel.slice(rel.lastIndexOf('/') + 1), folder: folderOf(rel), mark: null }));
  markCopies(dir, files);
  markOlderVersions(files);
  return { files, toJudge: filesToJudge(files) };
}

export function report(sources: SourceList): string {
  const same = sources.files.filter((f) => f.mark && f.mark.kind === 'same').length;
  const older = sources.files.filter((f) => f.mark && f.mark.kind === 'older').length;
  const used = sources.files.length - same - older;
  const out = ['For the brief:', '', '### Summary', '', '| Files | Used | Same as another file | Older version | Out of scope |', '|---|---|---|---|---|', `| ${sources.files.length} | ${used} | ${same} | ${older} | 0 |`];
  const folders = [...new Set(sources.files.map((f) => f.folder))];
  for (const folder of folders) {
    out.push('', `### ${folder || 'sources/'}`, '', '| # | File | Kind of document | Version or date | Owner | Standing | Used |', '|---|---|---|---|---|---|---|');
    for (const f of sources.files.filter((x) => x.folder === folder)) {
      const usedCell = !f.mark ? 'Yes' : f.mark.kind === 'same' ? `No: same as ${f.mark.of}` : `No: older version of ${f.mark.of}`;
      out.push(`| ${f.n} | ${link(f.rel)} | {kind of document} | {version or date} | {owner} | {standing} | ${usedCell} |`);
    }
  }
  out.push('', 'For discovery-author:');
  if (!sources.toJudge.length) out.push('None.');
  else {
    out.push('These files differ only by a date. Read them: if one replaces another, mark the earlier one "No: older version of" the later one; if they are a series, such as notes from different meetings, use them all.');
    sources.toJudge.forEach((g, i) => {
      out.push(`- Set ${i + 1}:`);
      for (const f of g) out.push(`  - ${f.n}: ${f.rel}`);
    });
  }
  return `${out.join('\n')}\n`;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/list-sources.ts --project <p>');
  process.stdout.write(report(list(project, { output: args.output })));
  return 0;
}

if (import.meta.main) runMain(main);
