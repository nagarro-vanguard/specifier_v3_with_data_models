// cli.ts — what every program does on the command line: read its options, check the ones it needs, and exit.
//
// Exports:
//   parseArgs(argv)                   the shared command-line options
//   textOption(args, name)            an option's text, or undefined when it is left out or given with no value
//   hasOption(args, name)             whether an option is given, such as --check-only
//   requireOption(args, name, use)    an option's text, or the use line and exit code 2 when it is missing
//   programName(file)                 a program's file name, such as "check-brd.ts", for its report
//   today()                           today's date, as 2026-10-22
//   fail(message, code)               print and exit
//   runMain(main)                     runs a program's main function, turning a LayoutError into exit code 2
//
// A program starts the same way every time:
//
//   if (import.meta.main) runMain(main);
//
// Exit codes: 0 when every check passed, 1 when a check found something, 2 when the program could not run.

import path from 'node:path';
import { LayoutError, VALUE_NAMES, type Values } from './run-paths.ts';

export type ExitCode = 0 | 1 | 2;

// An option given with no value after it, such as --check-only, is true.
export type Option = string | true;

export interface CliArgs {
  // The values a path may hold, such as epic or change. product is the project's name.
  values: Values;
  // The Output folder, as a full path.
  output?: string;
  project?: Option;
  document?: Option;
  date?: Option;
  [option: string]: Option | Values | undefined;
}

// The shared options: --project, --output, --document, --date, and one per value name.
export function parseArgs(argv: readonly string[]): CliArgs {
  const values: Values = {};
  const options: Record<string, Option> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    const val: Option = next !== undefined && !next.startsWith('--') ? argv[++i] : true;
    if (isValueName(key) && key !== 'document') values[key] = val;
    else options[key] = val;
  }
  const { output, ...rest } = options;
  if (output === true) throw new LayoutError('No folder was given. Use --output <folder>.');
  const args: CliArgs = { values, ...rest };
  if (output) args.output = path.resolve(output);
  if (typeof args.project === 'string' && args.project) values.product = args.project;
  return args;
}

function isValueName(key: string): boolean {
  return (VALUE_NAMES as readonly string[]).includes(key);
}

// An empty value, such as --date "", counts as left out, as every program has always treated it.
export function textOption(args: CliArgs, name: string): string | undefined {
  const v = args[name];
  return typeof v === 'string' && v !== '' ? v : undefined;
}

export function hasOption(args: CliArgs, name: string): boolean {
  return Boolean(args[name]);
}

export function requireOption(args: CliArgs, name: string, use: string): string {
  const v = textOption(args, name);
  if (!v) fail(use, 2);
  return v;
}

export function programName(file: string): string {
  return path.basename(file);
}

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fail(message: string, code: ExitCode): never {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

export function runMain(main: () => ExitCode | void): void {
  try {
    process.exit(main() || 0);
  } catch (e) {
    if (e instanceof LayoutError) fail(e.message, 2);
    throw e;
  }
}
