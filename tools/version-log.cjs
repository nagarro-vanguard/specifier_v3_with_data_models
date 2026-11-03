#!/usr/bin/env node
'use strict';
// version-log.cjs — saves a numbered copy of a document the moment it is accepted.
//
//   node tools/version-log.cjs --project <p> --document <name> [--capability|--epic|--story|--change <value>]
//   node tools/version-log.cjs --project <p> --document <path inside the project>
//
// Any document project-folders.md names can be saved, the data model's things file, data model files and decisions
// file among them, such as --document data-model --family lending.
//
// What it does, in order:
//   1. sets the document's status line to "accepted on <date>, version <n>" (a Story has none). A data model file
//      written before the kit's document shape, with "Status: Accepted on <date>", gets the kit's line too.
//   2. copies the document to version-log/<document path, without .md>/v<n>.md
//   3. appends one row to version-log/log.md, in the shape of templates/parts/version-log.md. Its Decision record entry
//      is the document's latest Decision record entry, or, for the data model's decisions file, its latest settled
//      decision, such as DM-6.
//
// Exit codes: 0 saved; 2 the document, the project or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');

// A generated document opens with one line saying a program writes it (conventions.md, "The opening of every
// document").
const LOG_DEFINITION = [
  'Written by version-log.cjs, one row at each acceptance. Never edit it by hand.',
  '',
].join('\n');

const LOG_HEADER = [
  '| Version | Document | Date | Decision record entry | Copy | Lines added | Lines removed |',
  '|---|---|---|---|---|---|---|',
];

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function lines(text) {
  const l = text.split(/\r?\n/);
  if (l.length && l[l.length - 1] === '') l.pop();
  return l;
}

// The length of the longest common run of lines, kept in two rows.
function lcsLength(a, b) {
  let prev = new Uint32Array(b.length + 1);
  let cur = new Uint32Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    [prev, cur] = [cur, prev];
    cur.fill(0);
  }
  return prev[b.length];
}

// Every row already in the log, keyed by column.
function readLog(logPath) {
  if (!fs.existsSync(logPath)) return [];
  const rows = [];
  for (const line of rp.readText(logPath).split(/\r?\n/)) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const c = line.split('|').slice(1, -1).map((s) => s.trim());
    rows.push({ version: Number(c[0]), document: c[1] });
  }
  return rows;
}

// The latest entry of the document's Decision record. The data model's decisions file has no Decision record: its
// latest entry is the last decision under "Settled", such as DM-6, since each one is added in the order it is settled.
function lastDecision(text) {
  const all = [...text.matchAll(/^###\s+Decision\s+(\d+)\b/gm)].map((m) => Number(m[1]));
  if (all.length) return `Decision ${Math.max(...all)}`;
  const settled = (text.split(/^## Settled[ \t]*$/m)[1] || '').split(/^## /m)[0];
  const dms = [...settled.matchAll(/^###\s+(DM-\d+)\b/gm)].map((m) => m[1]);
  return dms.length ? dms[dms.length - 1] : 'None';
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const doc = rp.resolveDocument(args);
  const projectDir = rp.projectDir(args.project, args);
  if (!fs.existsSync(projectDir)) rp.fail(`The project folder doesn't exist: ${projectDir}`, 2);
  const docPath = path.join(projectDir, doc.rel);
  if (!fs.existsSync(docPath)) rp.fail(`The document doesn't exist: ${doc.rel}`, 2);

  const date = args.date && args.date !== true ? args.date : today();
  const logPath = rp.pathOf(args.project, 'version-log', {}, args);
  const n = readLog(logPath).filter((r) => r.document === doc.rel).reduce((m, r) => Math.max(m, r.version), 0) + 1;

  // 1. The status line, when the document has one.
  const eol = rp.eolOf(fs.readFileSync(docPath, 'utf8'));
  let text = rp.readText(docPath);
  if (/^Status: .*$/m.test(text)) {
    text = text.replace(/^Status: .*$/m, `Status: accepted on ${date}, version ${n}`);
    rp.writeText(docPath, text);
  }

  // 2. The copy, with the document's own line endings.
  const docKey = doc.rel.replace(/\.(md|json)$/, '');
  const copyPath = rp.pathOf(args.project, 'version-copy', { document: docKey, n }, args);
  fs.mkdirSync(path.dirname(copyPath), { recursive: true });
  rp.writeText(copyPath, text, eol);

  // 3. The row, with the lines added and removed against the version before.
  let added = lines(text).length;
  let removed = 0;
  if (n > 1) {
    const prevPath = rp.pathOf(args.project, 'version-copy', { document: docKey, n: n - 1 }, args);
    if (fs.existsSync(prevPath)) {
      const a = lines(rp.readText(prevPath));
      const b = lines(text);
      const common = lcsLength(a, b);
      added = b.length - common;
      removed = a.length - common;
    }
  }
  const copyLink = path.relative(path.dirname(logPath), copyPath).split(path.sep).join('/');
  const row = `| ${n} | ${doc.rel} | ${date} | ${lastDecision(text)} | [v${n}](${copyLink}) | ${added} | ${removed} |`;

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  let log = fs.existsSync(logPath) ? rp.readText(logPath) : `# Version log — ${args.project}\n\n${LOG_DEFINITION}\n${LOG_HEADER.join('\n')}\n`;
  if (!log.endsWith('\n')) log += '\n';
  rp.writeText(logPath, log + row + '\n');

  process.stdout.write(`Saved ${doc.rel} as version ${n}: ${added} lines added, ${removed} removed.\n`);
  return 0;
}

rp.run(main);
