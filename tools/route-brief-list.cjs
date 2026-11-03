#!/usr/bin/env node
'use strict';
// route-brief-list.cjs — says whether an EPIC gets an EPIC brief, from the EPIC grouping's EPIC brief list.
//
//   node tools/route-brief-list.cjs --project <p> --epic EPIC-002
//
// It prints "yes" or "no" on the first line, then the reason the list gives. The EPIC is found in the list by its
// number: EPIC-002 is the list's EPIC 2.
//
// Exit codes: 0 answered; 1 the EPIC isn't in the list; 2 the grouping, the register or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');

const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();

function answer(project, epic, opts = {}) {
  const e = cd.epicOf(project, epic, opts);
  const grouping = cd.load(project, 'epic-grouping', {}, opts);
  const n = Number(e.id.slice(5));
  const row = (md.tableUnder(grouping.text, 'EPIC brief list, in run order') || []).find((r) => Number((text(r.EPIC).match(/^(\d+)/) || [])[1]) === n);
  return { epic: e, row };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const epic = args.values.epic;
  if (!args.project || args.project === true || !epic) rp.fail('Use: node tools/route-brief-list.cjs --project <p> --epic EPIC-002', 2);
  const r = answer(args.project, epic, { output: args.output });
  if (!r.row) {
    process.stdout.write(`${r.epic.id} ${r.epic.name} isn't in the EPIC grouping's EPIC brief list.\n`);
    return 1;
  }
  const brief = text(r.row.Brief).toLowerCase();
  process.stdout.write(`${brief}\n${r.epic.id} ${r.epic.name}: ${brief === 'yes' ? 'it gets an EPIC brief' : 'no EPIC brief: its stories come next'}, because ${text(r.row.Reason)}.\n`);
  return 0;
}

module.exports = { answer };

if (require.main === module) rp.run(main);
