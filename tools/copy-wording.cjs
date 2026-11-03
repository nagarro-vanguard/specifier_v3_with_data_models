#!/usr/bin/env node
'use strict';
// copy-wording.cjs — copies a requirement's new wording to every place that quotes it, and nothing else.
//
//   node tools/copy-wording.cjs --project <p> --change <nnn> --requirement <ID>
//
// It runs only after you chose "Copy the wording" at the change's gate, so the change's report is accepted and its
// progress exists.
//
// What it does:
//   1. takes the new wording from section 5 of the change's report, where an ask reads:
//      REQ-3.2 now reads: "Claims over 1,000 need finance approval."
//   2. takes the old wording from the requirement's row in the PRD, without its name in bold:
//      **Finance approval** — Claims over 500 need finance approval.
//   3. finds every place that quotes the requirement: its row in the PRD, and the line that names it in each FRD's
//      Requirements list. Every document that exists counts, drafted or accepted.
//   4. refuses, and writes nothing, when a place doesn't hold the old wording word for word, so a copy that has
//      drifted is never overwritten without anyone seeing it
//   5. replaces the old wording with the new in every place, and records each one in the change's progress, under
//      "Places written"
//   6. runs accept.cjs for each accepted document it changed, so each gets a new version
//
// Exit codes: 0 written; 1 refused, or the change's decision isn't "Copy the wording", or the report gives no new
// wording for the requirement; 2 the change, its report, its progress, the PRD or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD>.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const cr = require('./lib/change-report.cjs');
const ia = require('./insert-answer.cjs');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The new wording an ask gives a requirement: REQ-3.2 now reads: "...".
function newWording(report, id) {
  for (const a of report.asks) {
    const m = a.restated.match(new RegExp(`^${esc(id)} now reads:\\s*"(.+)"\\s*$`));
    if (m) return m[1];
  }
  return null;
}

// Every place that quotes the requirement, each with the old wording, or why it has drifted.
function places(project, id, opts = {}) {
  const prd = cd.load(project, 'prd', {}, opts);
  const out = { old: null, places: [], drifted: [] };
  // The simple words are read from the "In simple words" column, and a transition requirement's from its second column.
  // The client's words, next to them, are never changed here.
  const row = cd.lines(prd.text).find((l) => /^Requirements\b|^Transition requirements/i.test(l.section.replace(/^\d+\.\s*/, '')) && l.line.split('|')[1] && l.line.split('|')[1].trim() === id);
  if (!row) return { ...out, error: `${id} isn't a requirement in the PRD.` };
  const req = cd.requirementsOf(prd.text).find((r) => md.list(r.ID).join(' ').trim() === id);
  const asWritten = req ? req.simple : row.line.split('|')[2].trim();
  out.old = asWritten.replace(/^\*\*[^*]+\*\*\s+—\s+/, '');
  out.places.push({ rel: prd.rel, line: row.n, where: `section 4, ${id}` });
  for (const m of rp.matches(project, 'frd', opts)) {
    const text = rp.readText(m.abs);
    // The Requirements list is the only place in an FRD with lines that start with a requirement's ID in bold.
    for (const l of cd.lines(text)) {
      if (!l.line.startsWith(`- **${id} `)) continue;
      if (l.line.includes(out.old)) out.places.push({ rel: m.rel, line: l.n, where: `Requirements, ${id}` });
      else out.drifted.push({ rel: m.rel, line: l.n, why: `it doesn't quote ${id} word for word as the PRD has it` });
    }
  }
  return out;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  const id = args.requirement;
  if (!args.project || args.project === true || !change || change === true || !id || id === true) rp.fail('Use: node tools/copy-wording.cjs --project <p> --change <nnn> --requirement <ID>', 2);
  const opts = { output: args.output };
  const r = cr.read(args.project, change, opts);
  if (r.choice !== 'Copy the wording') {
    process.stdout.write(`Change ${r.change.number}'s decision is ${r.choice ? `"${r.choice}"` : 'not made yet'}, not "Copy the wording": nothing is written.\n`);
    return 1;
  }
  const progress = rp.pathOf(args.project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(progress)) throw new rp.LayoutError(`The change has no progress yet: ${progress}. It is written when the change's report is accepted.`);
  const wording = newWording(r, id);
  if (!wording) { process.stdout.write(`Section 5 gives no new wording for ${id}. It reads: ${id} now reads: "{the new wording}".\n`); return 1; }

  const p = places(args.project, id, opts);
  if (p.error) { process.stdout.write(`${p.error}\n`); return 1; }
  if (p.drifted.length) {
    process.stdout.write(`Nothing is written: ${cd.plural(p.drifted.length, 'place')} quote ${id} differently from the PRD. Bring them back in line first:\n`);
    for (const x of p.drifted) process.stdout.write(`- ${x.rel}, line ${x.line}: ${x.why}\n`);
    return 1;
  }
  const projectDir = rp.projectDir(args.project, opts);
  const docs = [...new Set(p.places.map((x) => x.rel))];
  for (const rel of docs) {
    const file = path.join(projectDir, rel);
    const all = rp.readText(file).split('\n');
    for (const x of p.places.filter((y) => y.rel === rel)) all[x.line - 1] = all[x.line - 1].replace(p.old, wording);
    rp.writeText(file, all.join('\n'));
  }
  cd.replaceSection(progress, 'Places written', ['| Document | Where | Before | After |', '|---|---|---|---|', ...p.places.map((x) => `| ${x.rel} | ${x.where} | ${p.old} | ${wording} |`)]);

  const out = [`copy-wording.cjs: ${id}'s new wording written in ${cd.plural(p.places.length, 'place')}, in ${cd.plural(docs.length, 'document')}.`];
  const again = ia.acceptAgain(args.project, docs, args);
  out.push(...again.lines);
  process.stdout.write(`${out.join('\n')}\n`);
  return again.code;
}

module.exports = { places, newWording };

if (require.main === module) rp.run(main);
