#!/usr/bin/env node
'use strict';
// change-summary.cjs — shows what a change updated, once change-orchestration-workflow has made its updates.
//
//   node tools/change-summary.cjs --project <p> --change <nnn>
//
// What it does:
//   1. reads the change's to-do list, changes/{change}/progress.md, and section 15 of its report
//   2. prints one row for each document: its version before the change, its version after, and the items section 15
//      gave the steps that updated it
//   3. says whether the change is closed, or how many updates are still to make
//
// It writes nothing.
//
// Exit codes: 0 shown; 2 the change, its report, its to-do list or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const cr = require('./lib/change-report.cjs');
const tc = require('./track-change.cjs');
const ns = require('./next-change-step.cjs');

function summary(project, change, opts = {}) {
  const r = cr.read(project, change, opts);
  const file = rp.pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`Change ${r.change.number} has no to-do list yet: say yes at step 5 of change-request-workflow first.`);
  const p = tc.read(file);
  const known = ns.steps(r);
  const rows = p.rows.map((x) => {
    const after = (x.status.match(/version (\d+)$/) || [])[1];
    const what = x.for.flatMap((f) => (known.find((s) => s.label === f) || { items: [f] }).items);
    return { document: x.document, before: x.start === 'none' ? 'new' : `version ${x.start}`, after: after ? `version ${after}` : 'not yet', what };
  });
  return { change: r.change, name: r.name, closed: p.closed, rows, left: p.rows.filter((x) => x.status === 'pending').length };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true) rp.fail('Use: node tools/change-summary.cjs --project <p> --change <nnn>', 2);
  const s = summary(args.project, change, { output: args.output });
  const lines = [`Change ${s.change.number}, ${s.name}: ${s.closed ? 'closed' : s.left ? `${s.left} still to make` : 'every update made'}.`, ''];
  if (!s.rows.length) lines.push('Nothing needed to change.');
  else {
    lines.push('| Document | Before | After | What changed |', '|---|---|---|---|');
    for (const x of s.rows) lines.push(`| ${x.document} | ${x.before} | ${x.after} | ${x.what.map((w) => `• ${w}`).join('<br>')} |`);
  }
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

module.exports = { summary };

if (require.main === module) rp.run(main);
