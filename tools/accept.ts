// accept.ts — runs what happens at every acceptance, in a fixed order, stopping at the first failure.
//
//   node tools/accept.ts --project <p> --document <name> [--capability|--epic|--story|--change <value>]
//
// In order:
//   1. version-log.ts       saves a numbered copy, and sets the status line to accepted
//   2. version-log.ts       saves a numbered copy of the data model's decisions file too, and sets its status line,
//                            when the document is the data model's things file or a data model file, such as
//                            --document data-model --family lending. Their gates record each answer in the
//                            decisions file. Skipped when the project has no decisions file.
//   3. version-log.ts       saves a numbered copy of the Question log too, so every acceptance records the
//                            questions as they stood. Skipped when the project has no Question log yet, or
//                            when the Question log is the document being accepted.
//   4. traceability-map.ts  rebuilds the map from the accepted documents
//   5. track-change.ts      updates the progress of every open change, and closes a change once the last document
//                            it named is accepted
//
// A check program runs before each gate, inside its skill, as conventions.md, "Draft first, decide once", says. The
// data model's skills run check-data-model.ts there, so it doesn't run again here.
//
// Exit codes: 0 every step passed; otherwise the code of the first step that failed.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, projectDir, resolveDocument } from './lib/run-paths.ts';

// Each step, the program it runs, and the options it takes:
//   document      the document being accepted, with every option given for it
//   decisions     the data model's decisions file
//   questionLog   the Question log
//   none          the shared options alone
const STEPS = [
  { program: 'version-log.ts', takes: 'document' },
  { program: 'version-log.ts', takes: 'decisions' },
  { program: 'version-log.ts', takes: 'questionLog' },
  { program: 'traceability-map.ts', takes: 'none' },
  { program: 'track-change.ts', takes: 'none' },
] as const;

// The options every step shares.
const SHARED = ['--project', '--output', '--date'];

// The options every step shares, and the ones only the document steps take.
function split(argv: string[]): { shared: string[]; documentOnly: string[] } {
  const shared: string[] = [];
  const documentOnly: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const hasValue = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--');
    const pair = hasValue ? [a, argv[++i]] : [a];
    if (SHARED.includes(a)) shared.push(...pair);
    else documentOnly.push(...pair);
  }
  return { shared, documentOnly };
}

function main(): ExitCode {
  const argv = process.argv.slice(2);
  if (!argv.includes('--project') || !argv.includes('--document')) {
    process.stderr.write('Use: node tools/accept.ts --project <p> --document <name>\n');
    return 2;
  }
  const { shared, documentOnly } = split(argv);

  // The Question log, and whether it is the document being accepted.
  const args = parseArgs(argv);
  // The same message run-paths.ts gives when a path is asked for with no project.
  const project = requireOption(args, 'project', 'No project was given. Use --project <name>.');
  const opts = { output: args.output };
  const logPath = pathOf(project, 'question-log', {}, opts);
  const doc = resolveDocument(args.document, args.values);
  const isLog = path.join(projectDir(project, opts), doc.rel) === logPath;
  // The data model's decisions file goes with the things file and each data model file.
  const withDecisions = ['data-model-things', 'data-model'].includes(doc.document) && fs.existsSync(pathOf(project, 'data-model-decisions', {}, opts));

  for (const step of STEPS) {
    if (step.takes === 'questionLog' && (isLog || !fs.existsSync(logPath))) continue;
    if (step.takes === 'decisions' && !withDecisions) continue;
    const file = path.join(import.meta.dirname, step.program);
    const stepArgs = step.takes === 'document' ? [...shared, ...documentOnly]
      : step.takes === 'decisions' ? [...shared, '--document', 'data-model-decisions']
        : step.takes === 'questionLog' ? [...shared, '--document', 'question-log']
          : shared;
    const r = spawnSync(process.execPath, [file, ...stepArgs], { encoding: 'utf8' });
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    if (r.status !== 0) {
      process.stderr.write(`Acceptance stopped at ${step.program}, exit code ${r.status}.\n`);
      return (r.status === null ? 2 : r.status) as ExitCode;
    }
  }
  return 0;
}

if (import.meta.main) runMain(main);
