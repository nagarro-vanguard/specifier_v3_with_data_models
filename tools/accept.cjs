#!/usr/bin/env node
'use strict';
// accept.cjs — runs what happens at every acceptance, in a fixed order, stopping at the first failure.
//
//   node tools/accept.cjs --project <p> --document <name> [--capability|--epic|--story|--change <value>]
//
// In order:
//   1. version-log.cjs       saves a numbered copy, and sets the status line to accepted
//   2. version-log.cjs       saves a numbered copy of the data model's decisions file too, and sets its status line,
//                            when the document is the data model's things file or a data model file, such as
//                            --document data-model --family lending. Their gates record each answer in the
//                            decisions file. Skipped when the project has no decisions file.
//   3. version-log.cjs       saves a numbered copy of the Question log too, so every acceptance records the
//                            questions as they stood. Skipped when the project has no Question log yet, or
//                            when the Question log is the document being accepted.
//   4. traceability-map.cjs  rebuilds the map from the accepted documents
//   5. track-change.cjs      updates the progress of every open change, and closes a change once the last document
//                            it named is accepted
//
// A check program runs before each gate, inside its skill, as conventions.md, "Draft first, decide once", says. The
// data model's skills run check-data-model.cjs there, so it doesn't run again here.
//
// Exit codes: 0 every step passed; otherwise the code of the first step that failed.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const rp = require('./lib/run-paths.cjs');

const STEPS = [
  { program: 'version-log.cjs', passDocument: true },
  { program: 'version-log.cjs', decisions: true },
  { program: 'version-log.cjs', questionLog: true },
  { program: 'traceability-map.cjs', passDocument: false },
  { program: 'track-change.cjs', passDocument: false },
];

// The options every step shares, and the ones only the document steps take.
function split(argv) {
  const shared = [];
  const documentOnly = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const hasValue = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--');
    const pair = hasValue ? [a, argv[++i]] : [a];
    if (['--project', '--output', '--date'].includes(a)) shared.push(...pair);
    else documentOnly.push(...pair);
  }
  return { shared, documentOnly };
}

function main() {
  const argv = process.argv.slice(2);
  if (!argv.includes('--project') || !argv.includes('--document')) {
    process.stderr.write('Use: node tools/accept.cjs --project <p> --document <name>\n');
    return 2;
  }
  const { shared, documentOnly } = split(argv);

  // The Question log, and whether it is the document being accepted.
  const args = rp.parseArgs(argv);
  const logPath = rp.pathOf(args.project, 'question-log', {}, args);
  const doc = rp.resolveDocument(args);
  const isLog = path.join(rp.projectDir(args.project, args), doc.rel) === logPath;
  // The data model's decisions file goes with the things file and each data model file.
  const withDecisions = ['data-model-things', 'data-model'].includes(doc.document) && fs.existsSync(rp.pathOf(args.project, 'data-model-decisions', {}, args));

  for (const step of STEPS) {
    if (step.questionLog && (isLog || !fs.existsSync(logPath))) continue;
    if (step.decisions && !withDecisions) continue;
    const file = path.join(__dirname, step.program);
    let stepArgs = step.passDocument ? [...shared, ...documentOnly] : shared;
    if (step.decisions) stepArgs = [...shared, '--document', 'data-model-decisions'];
    if (step.questionLog) stepArgs = [...shared, '--document', 'question-log'];
    const r = spawnSync(process.execPath, [file, ...stepArgs], { encoding: 'utf8' });
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    if (r.status !== 0) {
      process.stderr.write(`Acceptance stopped at ${step.program}, exit code ${r.status}.\n`);
      return r.status === null ? 2 : r.status;
    }
  }
  return 0;
}

rp.run(main);
