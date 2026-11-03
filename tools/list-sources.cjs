#!/usr/bin/env node
'use strict';
// list-sources.cjs — lists every file in a project's sources/ folder, and marks the ones that are the same as another,
// or an older version of another, so no file is missed or counted twice.
//
//   node tools/list-sources.cjs --project <p>
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
// Exit codes: 0 listed; 2 sources/ is missing or empty, or the project or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const rp = require('./lib/run-paths.cjs');

// A version mark: v2, V2.1, ver 3, version 4, rev 5, standing alone between separators.
const VERSION = /(^|[\s._-])(?:v|ver|version|rev)[\s._-]?(\d+(?:\.\d+)*)(?=$|[\s._-])/i;
// A date: 2026-09-12, 2026_09_12, 2026.09.12 or 20260912, standing alone between separators.
const DATE = /(^|[\s._-])(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})(?=$|[\s._-])/;

function walk(dir, base, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else if (e.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

// Files directly in sources/ first, then each folder in name order; files in name order within a folder.
function order(rels) {
  const folderOf = (r) => (r.includes('/') ? r.slice(0, r.lastIndexOf('/') + 1) : '');
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

function hashOf(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// The name with its version mark or date taken out, so names that differ only by that mark share a stem.
function stemOf(name, re) {
  const ext = path.extname(name).toLowerCase();
  const base = name.slice(0, name.length - path.extname(name).length);
  const m = base.match(re);
  if (!m) return null;
  const without = (base.slice(0, m.index) + m[1] + base.slice(m.index + m[0].length)).toLowerCase().replace(/[\s._-]+/g, '-').replace(/^-+|-+$/g, '');
  return { key: `${without}${ext}`, mark: m };
}

function compareVersions(a, b) {
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
function link(rel) {
  const name = rel.slice(rel.lastIndexOf('/') + 1);
  const href = `sources/${rel}`.split('/').map((s) => encodeURIComponent(s).replace(/%2F/g, '/')).join('/');
  return `[${name.replace(/([[\]|])/g, '\\$1')}](${href})`;
}

function list(project, opts = {}) {
  const dir = rp.pathOf(project, 'sources', {}, opts);
  if (!fs.existsSync(dir)) throw new rp.LayoutError(`There is no sources/ folder in the project: ${dir}`);
  const rels = order(walk(dir, dir));
  if (!rels.length) throw new rp.LayoutError(`The sources/ folder is empty: ${dir}. Put the requirement files there first.`);

  const files = rels.map((rel, i) => ({ n: i + 1, rel, name: rel.slice(rel.lastIndexOf('/') + 1), folder: rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/') + 1) : '', mark: null }));

  // Same contents: the file with the shortest name is kept, as a copy's name is usually the original's plus
  // something, such as "copy" or "(1)". Ties go to the first in the listing. Every other copy points to it.
  const byHash = new Map();
  for (const f of files) {
    const h = hashOf(path.join(dir, f.rel));
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(f);
  }
  for (const group of byHash.values()) {
    if (group.length < 2) continue;
    const kept = group.reduce((a, b) => (b.name.length < a.name.length ? b : a));
    for (const f of group) if (f !== kept) f.mark = { kind: 'same', of: kept.n };
  }

  // Names that differ only by a version mark: every lower version points to the highest.
  const byVersionStem = new Map();
  for (const f of files) {
    if (f.mark) continue;
    const s = stemOf(f.name, VERSION);
    if (!s) continue;
    if (!byVersionStem.has(s.key)) byVersionStem.set(s.key, []);
    byVersionStem.get(s.key).push({ f, version: s.mark[2] });
  }
  for (const group of byVersionStem.values()) {
    if (group.length < 2) continue;
    const newest = group.reduce((a, b) => (compareVersions(b.version, a.version) > 0 ? b : a));
    for (const g of group) {
      if (g !== newest && compareVersions(g.version, newest.version) < 0) g.f.mark = { kind: 'older', of: newest.f.n };
    }
  }

  // Names that differ only by a date: named for discovery-author to judge, never marked here.
  const byDateStem = new Map();
  for (const f of files) {
    if (f.mark) continue;
    const s = stemOf(f.name, DATE);
    if (!s) continue;
    if (!byDateStem.has(s.key)) byDateStem.set(s.key, []);
    byDateStem.get(s.key).push(f);
  }
  const toJudge = [...byDateStem.values()].filter((g) => g.length > 1);

  return { files, toJudge };
}

function report(r) {
  const same = r.files.filter((f) => f.mark && f.mark.kind === 'same').length;
  const older = r.files.filter((f) => f.mark && f.mark.kind === 'older').length;
  const used = r.files.length - same - older;
  const out = ['For the brief:', '', '### Summary', '', '| Files | Used | Same as another file | Older version | Out of scope |', '|---|---|---|---|---|', `| ${r.files.length} | ${used} | ${same} | ${older} | 0 |`];
  const folders = [...new Set(r.files.map((f) => f.folder))];
  for (const folder of folders) {
    out.push('', `### ${folder || 'sources/'}`, '', '| # | File | Kind of document | Version or date | Owner | Standing | Used |', '|---|---|---|---|---|---|---|');
    for (const f of r.files.filter((x) => x.folder === folder)) {
      const usedCell = !f.mark ? 'Yes' : f.mark.kind === 'same' ? `No: same as ${f.mark.of}` : `No: older version of ${f.mark.of}`;
      out.push(`| ${f.n} | ${link(f.rel)} | {kind of document} | {version or date} | {owner} | {standing} | ${usedCell} |`);
    }
  }
  out.push('', 'For discovery-author:');
  if (!r.toJudge.length) out.push('None.');
  else {
    out.push('These files differ only by a date. Read them: if one replaces another, mark the earlier one "No: older version of" the later one; if they are a series, such as notes from different meetings, use them all.');
    r.toJudge.forEach((g, i) => {
      out.push(`- Set ${i + 1}:`);
      for (const f of g) out.push(`  - ${f.n}: ${f.rel}`);
    });
  }
  return `${out.join('\n')}\n`;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/list-sources.cjs --project <p>', 2);
  process.stdout.write(report(list(args.project, { output: args.output })));
  return 0;
}

module.exports = { list, report, stemOf };

if (require.main === module) rp.run(main);
