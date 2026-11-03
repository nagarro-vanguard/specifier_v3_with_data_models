// check-simple-writing.ts — checks one or more documents against _shared/simple-writing-rules.md, and says what to
// fix and what to look at. Every check program runs the same check; this program is for a document that has no check
// program of its own, such as a Glossary page, or for any document on its own.
//
//   node tools/check-simple-writing.ts --file <document.md> [--file <document.md>]... [--project <p>]
//                                       [--skip-column <name>]... [--compare <simple column> <client column>]
//
// With --project, the project's agreed Glossary words are allowed, even when a word list has them.
//
// Exit codes: 0 nothing to fix; 1 something to fix; 2 a document or the rules file is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import path from 'node:path';
import { fail, runMain, type ExitCode } from './lib/cli.ts';
import { readText, LayoutError } from './lib/run-paths.ts';
import { check, glossaryTerms, report } from './lib/simple-writing.ts';

const USE = 'Use: node tools/check-simple-writing.ts --file <document.md> [--project <p>] [--skip-column <name>]... [--compare <simple column> <client column>]';

interface Options {
  files: string[];
  skipColumns: string[];
  compare?: [string, string];
  project?: string;
  output?: string;
}

// Its own reading of the command line, since --file and --skip-column may each be given more than once.
function readOptions(argv: string[]): Options {
  const options: Options = { files: [], skipColumns: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') options.files.push(argv[++i]);
    else if (a === '--skip-column') options.skipColumns.push(argv[++i]);
    else if (a === '--compare') options.compare = [argv[++i], argv[++i]];
    else if (a === '--project') options.project = argv[++i];
    else if (a === '--output') options.output = path.resolve(argv[++i]);
  }
  return options;
}

function main(): ExitCode {
  const { files, skipColumns, compare, project, output } = readOptions(process.argv.slice(2));
  if (!files.length || files.some((f) => !f)) fail(USE, 2);
  const allow = project ? glossaryTerms(project, { output }) : [];
  let toFix = 0;
  const out: string[] = [];
  for (const file of files) {
    if (!fs.existsSync(file)) throw new LayoutError(`The document isn't there: ${file}`);
    const result = check(readText(file), { skipColumns, compare, allow });
    toFix += result.toFix.length;
    out.push(report(path.basename(file), result));
  }
  process.stdout.write(out.join('\n'));
  return toFix ? 1 : 0;
}

if (import.meta.main) runMain(main);
