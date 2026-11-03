#!/usr/bin/env node
'use strict';
// compare-versions.cjs — lists every difference between a new and an old version of a requirement file, so no quiet
// edit is missed.
//
//   node tools/compare-versions.cjs --project <p> --change <nnn> --new <file> --old <file>
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
// Exit codes: 0 written; 2 either version, the change, its report or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const cd = require('./lib/check-document.cjs');

// A requirement ID: the source's own, such as REQ-3.2, as traceability-map.cjs reads it.
const ID = /\b(?!BR-|NFR-|F-|EPIC-|FRD-)[A-Z][A-Z0-9]*-\d+(?:\.\d+)*\b/;
const cell = (s) => (s === null ? 'None' : `"${s.replace(/\|/g, '\\|')}"`);
const flat = (lines) => lines.map((l) => l.trim()).filter(Boolean).join(' ');

function find(project, change, file, opts) {
  const c = cd.changeOf(project, change, opts);
  for (const dir of [c.dir, rp.projectDir(project, opts), process.cwd()]) {
    const p = path.resolve(dir, file);
    if (fs.existsSync(p)) return p;
  }
  throw new rp.LayoutError(`The file isn't there: ${file}. Look for it in ${c.dir}, or give its path.`);
}

// A version's requirements, by ID, in order: each runs from its ID's first line to the next ID's.
function requirements(lines) {
  const out = new Map();
  let cur = null;
  for (const l of lines) {
    const m = l.match(ID);
    if (m && !out.has(m[0])) { cur = m[0]; out.set(cur, []); }
    if (cur) out.get(cur).push(l);
  }
  return out;
}

// Line by line: the longest run of lines the two share, and every line outside it.
function lineDiff(a, b) {
  const n = a.length;
  const m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
    if (i < n && j < m && L[i + 1][j] === L[i][j + 1] && L[i + 1][j + 1] === L[i][j]) {
      if (a[i].trim() || b[j].trim()) out.push({ where: `line ${j + 1}`, before: a[i], after: b[j] });
      i++; j++;
    } else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) {
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
function prdKinds(project, opts) {
  const file = rp.pathOf(project, 'prd', {}, opts);
  if (!fs.existsSync(file)) return new Map();
  const out = new Map();
  for (const r of cd.requirementsOf(rp.readText(file))) {
    const id = (String(Array.isArray(r.ID) ? r.ID.join(' ') : r.ID || '').match(ID) || [])[0];
    if (id) out.set(id, r.kind);
  }
  return out;
}

// Each difference on a requirement the PRD holds says the kind the PRD gives it.
function withKinds(diffs, kinds) {
  return diffs.map((d) => {
    const id = (d.where.match(ID) || [])[0];
    return id && kinds.has(id) && !/, added$/.test(d.where) ? { ...d, where: `${d.where}. The PRD holds it as ${kinds.get(id)}.` } : d;
  });
}

function compare(newText, oldText) {
  const a = oldText.split(/\r?\n/);
  const b = newText.split(/\r?\n/);
  const ra = requirements(a);
  const rb = requirements(b);
  if (!ra.size || !rb.size) return lineDiff(a, b);
  const out = [];
  for (const [id, lines] of rb) {
    if (!ra.has(id)) out.push({ where: `${id}, added`, before: null, after: flat(lines) });
    else if (flat(ra.get(id)) !== flat(lines)) out.push({ where: `${id}, changed`, before: flat(ra.get(id)), after: flat(lines) });
  }
  for (const [id, lines] of ra) if (!rb.has(id)) out.push({ where: `${id}, removed`, before: flat(lines), after: null });
  return out;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true || !args.new || args.new === true || !args.old || args.old === true) {
    rp.fail('Use: node tools/compare-versions.cjs --project <p> --change <nnn> --new <file> --old <file>', 2);
  }
  const opts = { output: args.output };
  const c = cd.changeOf(args.project, change, opts);
  if (!fs.existsSync(c.report)) throw new rp.LayoutError(`The change has no report yet: ${c.report}`);
  const diffs = withKinds(compare(rp.readText(find(args.project, change, args.new, opts)), rp.readText(find(args.project, change, args.old, opts))), prdKinds(args.project, opts));
  const body = diffs.length
    ? ['| Where | Before | After |', '|---|---|---|', ...diffs.map((d) => `| ${d.where} | ${cell(d.before)} | ${cell(d.after)} |`)]
    : [`The new version, ${path.basename(args.new)}, doesn't differ from ${path.basename(args.old)}.`];
  cd.replaceSection(c.report, 'Other differences in a new version', body);
  process.stdout.write(`compare-versions.cjs: change ${c.number}, ${cd.plural(diffs.length, 'difference')}, written to section 3.\n`);
  return 0;
}

module.exports = { compare, withKinds, prdKinds };

if (require.main === module) rp.run(main);
