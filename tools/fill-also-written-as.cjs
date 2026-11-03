#!/usr/bin/env node
'use strict';
// fill-also-written-as.cjs — before Gate 2 is shown, fills each Gate 2 row's "Also written as" from the settled
// Gate 1 rows, so the words a term replaces are copied by a program, never retyped.
//
//   node tools/fill-also-written-as.cjs --project <p>
//
// What it does:
//   1. reads every Gate 1 row of the gate log, in Gate 1 and in any Re-run part, through build-glossary-records.cjs
//   2. while any of them is still open, it writes nothing, and lists them
//   3. for each word a Gate 1 row renamed to, merged into or split into a term, notes that word against the term
//   4. writes, in each Gate 2 row, the term's words under "Also written as", one per line, or "-" when there are none.
//      It writes only that column: every other cell stays exactly as it is.
//
// Exit codes: 0 filled; 1 a Gate 1 row is still open, each listed; 2 the gate log or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const gl = require('./build-glossary-records.cjs');

const GATE1 = ['conflict', 'weak', 'candidate', 'question'];
const low = (s) => String(s).trim().toLowerCase();

// The cells of a table row, keeping each cell's text as written. A "\|" stays inside its cell.
function cellsOf(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') { cur += '\\|'; i++; } else if (s[i] === '|') { cells.push(cur.trim()); cur = ''; } else cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

function fill(project, opts = {}) {
  const file = rp.pathOf(project, 'gate-log', {}, opts);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`There is no gate log yet: ${file}`);
  const before = rp.readText(file);
  const rows = gl.readGateLog(before);
  const gate1 = rows.filter((r) => GATE1.includes(r.table));
  const open = gate1.filter((r) => !r.status || r.status === 'open');
  if (open.length) return { filled: 0, findings: open.map((r) => `${r.id} is still open. "Also written as" is filled once every Gate 1 row is resolved.`) };

  const words = new Map();
  for (const r of gate1) {
    for (const o of gl.outcomesOf(r)) {
      for (const t of o.terms) {
        if (!words.has(low(t))) words.set(low(t), []);
        if (!words.get(low(t)).some((w) => low(w) === low(o.earlier))) words.get(low(t)).push(o.earlier);
      }
    }
  }

  // Rewrite only the "Also written as" cell of each row in a table that has both "Term" and "Also written as".
  const lines = before.split('\n');
  let header = null;
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
  const after = lines.join('\n');
  if (after !== before) rp.writeText(file, after);
  return { filled, findings: [] };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/fill-also-written-as.cjs --project <p>', 2);
  const r = fill(args.project, { output: args.output });
  if (r.findings.length) {
    process.stdout.write(`${r.findings.length} finding${r.findings.length === 1 ? '' : 's'}:\n${r.findings.map((f) => `- ${f}`).join('\n')}\n`);
    return 1;
  }
  process.stdout.write(`Filled "Also written as" in ${r.filled} Gate 2 row${r.filled === 1 ? '' : 's'}.\n`);
  return 0;
}

module.exports = { fill, cellsOf };

if (require.main === module) rp.run(main);
