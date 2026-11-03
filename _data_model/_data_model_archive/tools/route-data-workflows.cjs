#!/usr/bin/env node
'use strict';
// route-data-workflows.cjs — names the next Data and Information workflow, from where each of its documents stands and
// from what the specifier confirmed at the data model's gate, in "The workflows that follow".
//
//   node tools/route-data-workflows.cjs --project <p>
//
// The order:
//   1. data-model-workflow: the data model, then the Data Dictionary
//   2. state-model-workflow: the state models, only when the accepted data model confirms it runs
//   3. data-flow-workflow: the data flows, then the interfaces, only when the accepted data model confirms it runs
//   4. features-and-epics-workflow, once every workflow that runs has its documents accepted
// A workflow is next while any of its documents is missing or not accepted. Until the data model is accepted, what
// follows it is not confirmed, so nothing after data-model-workflow is named.
//
// It prints one line for each workflow, then the last line, which the workflow that ran it prints exactly:
// "Next: run {workflow}."
//
// Exit codes: 0 always, once the project is found; 2 the project or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const di = require('./lib/data-information.cjs');

const WORKFLOWS = [
  { name: 'data-model-workflow', documents: [['data-model', 'data model'], ['data-dictionary', 'Data Dictionary']] },
  { name: 'state-model-workflow', documents: [['state-models', 'state models']], conditional: true },
  { name: 'data-flow-workflow', documents: [['data-flows', 'data flows'], ['interfaces', 'interfaces']], conditional: true },
];

function statusOf(project, document, opts) {
  const file = di.pathOf(project, document, opts);
  if (!fs.existsSync(file)) return { status: 'not written', text: '' };
  const doc = di.load(project, document, opts);
  return { status: doc.status || 'drafted', text: doc.text };
}

function route(project, opts = {}) {
  if (!fs.existsSync(rp.projectDir(project, opts))) throw new rp.LayoutError(`The project folder doesn't exist: ${rp.projectDir(project, opts)}`);
  const model = statusOf(project, 'data-model', opts);
  const confirmed = model.status === 'accepted';
  const follow = md.tableUnder(model.text, 'The workflows that follow') || [];
  const lines = [];
  let next = null;
  for (const w of WORKFLOWS) {
    const states = w.documents.map(([doc, label]) => ({ label, ...statusOf(project, doc, opts) }));
    const done = states.every((s) => s.status === 'accepted');
    const list = states.map((s) => `${s.label} ${s.status}`).join('; ');
    if (!w.conditional) {
      lines.push(`- ${w.name}: ${list}`);
      if (!done && !next) next = w.name;
      continue;
    }
    if (!confirmed) { lines.push(`- ${w.name}: not confirmed yet, until the data model is accepted`); continue; }
    const row = follow.find((r) => di.plain(r.Workflow) === w.name);
    if (!row || di.plain(row.Runs) !== 'Runs') {
      lines.push(`- ${w.name}: confirmed not to run${row ? `: ${di.plain(row.Why)}` : ''}`);
      continue;
    }
    lines.push(`- ${w.name}: confirmed to run; ${list}`);
    if (!done && !next) next = w.name;
  }
  return { lines, next: next || (confirmed ? 'features-and-epics-workflow' : 'data-model-workflow') };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/route-data-workflows.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = route(args.project, { output: args.output });
  process.stdout.write([`route-data-workflows.cjs, ${date}: the Data and Information workflows of ${args.project}.`, ...r.lines, `Next: run ${r.next}.`, ''].join('\n'));
  return 0;
}

module.exports = { route };

if (require.main === module) rp.run(main);
