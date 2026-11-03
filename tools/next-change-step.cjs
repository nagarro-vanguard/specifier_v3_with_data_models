#!/usr/bin/env node
'use strict';
// next-change-step.cjs — names the next update of a change you said yes to, for change-orchestration-workflow.
//
//   node tools/next-change-step.cjs --project <p> --change <nnn>
//
// What it does:
//   1. reads the change's to-do list, changes/{change}/progress.md, which track-change.cjs wrote at your yes
//   2. takes its first row still pending, in the list's order, which is the order the workflows run
//   3. names the workflow and the step that row is for, and the items section 15 of the report gives that step
//   4. prints the next update, then how many are left, or "Every update is made." when none is pending
//
// Exit codes: 0 named, or every update made; 2 the change, its report, its to-do list or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cr = require('./lib/change-report.cjs');
const tc = require('./track-change.cjs');

const text = (c) => md.list(c).map((x) => String(x).trim()).join(' ').trim();

// Each row of section 15, as "{workflow}, {step}", or the step alone when it runs on its own, with its items.
function steps(report) {
  return (md.tableUnder(report.text, 'The recommendation') || []).map((x) => {
    const workflow = text(x.Workflow);
    const step = text(x.Step);
    return { workflow, step, label: workflow === 'on its own' ? step : `${workflow}, ${step}`, items: md.list(x.Items).map((i) => String(i).trim()).filter(Boolean) };
  });
}

function next(project, change, opts = {}) {
  const r = cr.read(project, change, opts);
  const file = rp.pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`Change ${r.change.number} has no to-do list yet: say yes at step 5 of change-request-workflow first.`);
  const p = tc.read(file);
  const pending = p.rows.filter((x) => x.status === 'pending');
  if (!pending.length) return { change: r.change, closed: p.closed, next: null, left: 0, of: p.rows.length };
  const row = pending[0];
  const known = steps(r);
  const runs = row.for.map((f) => known.find((s) => s.label === f) || { label: f, workflow: null, step: f, items: [] });
  return { change: r.change, closed: p.closed, next: { document: row.document, runs }, left: pending.length, of: p.rows.length };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true) rp.fail('Use: node tools/next-change-step.cjs --project <p> --change <nnn>', 2);
  const o = next(args.project, change, { output: args.output });
  if (!o.next) {
    process.stdout.write(`Every update is made: ${o.of} of ${o.of}.${o.closed ? ` Change ${o.change.number} is closed.` : ''} Next: run change-summary.cjs.\n`);
    return 0;
  }
  const lines = [`Next: ${o.next.document}`];
  for (const s of o.next.runs) lines.push(`- run ${s.label}${s.items.length ? `, for ${s.items.join(', ')}` : ''}`);
  lines.push('', `${o.left} of ${o.of} still to make.`);
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

module.exports = { next, steps };

if (require.main === module) rp.run(main);
