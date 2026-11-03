#!/usr/bin/env node
'use strict';
// build-retired-words-tables.cjs — writes the "Terms replaced or retired over time" table on each of the four kind
// pages from the gate log, in the order the glossary method's G8 sets. Never edited by hand.
//
//   node tools/build-retired-words-tables.cjs --project <p>
//
// What it does:
//   1. reads every word the gate log replaces: each Gate 1, Re-run and Change row's Resolution, in the form
//      output-formats.md sets, such as "basket: merged into Cart", through build-glossary-records.cjs
//   2. while any gate-log row is still open, it writes nothing, and lists the open rows
//   3. gives each word one row: Earlier word, What happened, Use now, Decision and Date (G8 rules 2 to 8):
//      - Use now is always the term used today, followed through every later rename, merge or split, or "-" when the
//        word was withdrawn with nothing in its place
//      - Decision is the register row that settled it, with the same D-n build-glossary-records.cjs gives it
//   4. puts each row on the kind page of the term in Use now, or, for a word withdrawn with nothing in its place, of
//      the word itself, in G8's order (rule 6): rows for the same term together, in the order the terms appear on the
//      page; the latest change first; rows with "-" last
//   5. writes only that table on each page, under its explainer and the line "Filled in by a program from the gate
//      log. Never edit by hand.", or "None yet." when a page has no rows
//
// Exit codes: 0 written; 1 a gate-log row is still open, or a word's term has no kind or no definition on its page,
// each listed; 2 the gate log, a kind page or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const gl = require('./build-glossary-records.cjs');

const PAGES = { 'object-terms.md': 'object-terms', 'role-terms.md': 'role-terms', 'step-terms.md': 'step-terms', 'states-and-values.md': 'states-and-values' };
const HEADING = '## Terms replaced or retired over time';
const FIXED = 'Filled in by a program from the gate log. Never edit by hand.';
const low = (s) => String(s).trim().toLowerCase();

// The anchors of the terms on a page, in the order they appear above the retired-words table.
function termOrder(pageText) {
  const main = pageText.slice(0, Math.max(0, pageText.indexOf(HEADING)) || pageText.length);
  return [...main.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]);
}

function rowsFor(logRows) {
  const ids = gl.decisionIds(logRows);
  const retired = gl.retiredMap(logRows, ids);
  const kinds = gl.termKinds(logRows);
  const out = [];
  const findings = [];
  for (const r of logRows) {
    const n = ids.get(r.id);
    if (!n) continue;
    for (const o of gl.outcomesOf(r)) {
      // Use now: followed through every later change, from this word's own outcome.
      const useNow = o.what === 'withdrawn' ? [] : o.terms.flatMap((t) => gl.follow(t, retired).terms);
      const kindOf = useNow.length ? useNow[0] : o.earlier;
      const page = gl.kindPage(kinds.get(low(kindOf)) || '');
      if (!page) { findings.push(`${r.id}: "${o.earlier}" has no kind page: "${kindOf}" has no kind in Gate 2.`); continue; }
      out.push({ earlier: o.earlier, what: o.what, useNow, page, n, date: r.decided });
    }
  }
  return { rows: out, findings };
}

// G8 rule 6: groups by the term in Use now, in the page's order; inside a group the latest first, the same date in the
// register's order; rows with "-" last, latest first.
function ordered(rows, order) {
  // A term missing from the page is a finding; its rows go after the page's own terms, before the "-" rows.
  const at = (r) => {
    if (!r.useNow.length) return Infinity;
    const i = order.indexOf(gl.anchorOf(r.useNow[0]));
    return i < 0 ? order.length : i;
  };
  const byDate = (a, b) => (a.date === b.date ? a.n - b.n : a.date < b.date ? 1 : -1);
  return rows.slice().sort((a, b) => at(a) - at(b) || byDate(a, b));
}

function tableLines(rows) {
  if (!rows.length) return ['None yet.'];
  return [
    '| Earlier word | What happened | Use now | Decision | Date |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.earlier} | ${r.what} | ${r.useNow.length ? r.useNow.map((t) => `[${t}](#${gl.anchorOf(t)})`).join('<br>') : '-'} | [D-${r.n}](decision-register.md#d-${r.n}) | ${r.date || '-'} |`),
  ];
}

// Replaces everything under the heading, after its explainer, up to the next heading or rule.
function writeTable(file, lines) {
  const all = rp.readText(file).split('\n');
  const start = all.findIndex((l) => l.trim() === HEADING);
  if (start < 0) throw new rp.LayoutError(`${file} has no "Terms replaced or retired over time" part. Write the page from its template first.`);
  let end = all.findIndex((l, i) => i > start && (/^## /.test(l) || /^---\s*$/.test(l)));
  if (end < 0) end = all.length;
  const explainer = all.slice(start + 1, end).filter((l) => /^\*\*[^*]+\*\*/.test(l));
  rp.writeText(file, [...all.slice(0, start + 1), '', ...explainer, '', FIXED, '', ...lines, '', ...all.slice(end)].join('\n'));
}

function build(project, opts = {}) {
  const logFile = rp.pathOf(project, 'gate-log', {}, opts);
  if (!fs.existsSync(logFile)) throw new rp.LayoutError(`There is no gate log yet: ${logFile}`);
  const logRows = gl.readGateLog(rp.readText(logFile));
  const open = logRows.filter((r) => !r.status || r.status === 'open');
  if (open.length) return { written: [], findings: open.map((r) => `${r.id} is still open. Nothing is built until every row is resolved.`) };
  const { rows, findings } = rowsFor(logRows);
  const written = [];
  for (const [page, name] of Object.entries(PAGES)) {
    const file = rp.pathOf(project, name, {}, opts);
    if (!fs.existsSync(file)) throw new rp.LayoutError(`The kind page isn't there yet: ${file}. Write it from its template first.`);
    const order = termOrder(rp.readText(file));
    const mine = rows.filter((r) => r.page === page);
    for (const r of mine) for (const t of r.useNow) if (!order.includes(gl.anchorOf(t))) findings.push(`${page}: "${r.earlier}" points to ${t}, which has no definition on the page.`);
    writeTable(file, tableLines(ordered(mine, order)));
    written.push(`${page}: ${mine.length} row${mine.length === 1 ? '' : 's'}`);
  }
  return { written, findings };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/build-retired-words-tables.cjs --project <p>', 2);
  const r = build(args.project, { output: args.output });
  if (r.written.length) process.stdout.write(`Terms replaced or retired over time, from the gate log:\n${r.written.map((w) => `- ${w}`).join('\n')}\n`);
  if (r.findings.length) process.stdout.write(`${r.findings.length} finding${r.findings.length === 1 ? '' : 's'}:\n${r.findings.map((f) => `- ${f}`).join('\n')}\n`);
  return r.findings.length ? 1 : 0;
}

module.exports = { build, ordered, termOrder };

if (require.main === module) rp.run(main);
