// harness.ts — what every test file shares: the kit's folders, test() to record a test, run() to run a program, and
// report() to print the results and exit.
//
// A test file reads:
//
//   import { test, run, report } from './helpers/harness.ts';
//   test('the check passes on the example', () => { ... });
//   report();
//
// report() exits with code 1 when a test failed, so `npm test` and `node --test` see the failure.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const KIT = path.resolve(import.meta.dirname, '..', '..', '..');
export const TOOLS = path.join(KIT, 'tools');
export const SKILLS = path.join(KIT, '.claude', 'skills');
export const SHARED = path.join(SKILLS, '_shared');
export const TEMPLATES = path.join(SHARED, 'templates');
export const EXAMPLES = path.join(SHARED, 'examples');
export const FIXTURES = path.join(KIT, 'fixtures');

export interface RunResult {
  // null when the program was stopped by a signal
  code: number | null;
  out: string;
  err: string;
}

export interface RunOptions {
  // Added to this process's environment.
  env?: NodeJS.ProcessEnv;
  // The folder the program runs from. A temporary folder when it is left out.
  cwd?: string;
}

interface Result {
  name: string;
  error?: unknown;
}

const results: Result[] = [];

// A file's text, with every line ending as "\n". The kit's files may end their lines with "\r\n", as Windows saves
// them, or with "\n", and every check here works the same on both.
export function readText(file: string): string {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

export function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name });
  } catch (error) {
    results.push({ name, error: error ?? new Error('failed') });
  }
}

// Runs one of the kit's programs, such as run('check-brd.ts', ['--project', 'expense-claims']).
export function run(program: string, args: readonly string[], opts: RunOptions = {}): RunResult {
  // Programs run from a temporary folder, so a missing --output can never write into the repository.
  const r = spawnSync(process.execPath, [path.join(TOOLS, program), ...args], {
    encoding: 'utf8',
    cwd: opts.cwd || os.tmpdir(),
    env: { ...process.env, ...opts.env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

// A new, empty folder for one test, such as specifier-frd-a1b2c3.
export function tempDir(name: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `specifier-${name}-`));
}

export function copyDir(from: string, to: string): void {
  fs.cpSync(from, to, { recursive: true });
}

export function report(): never {
  let failed = 0;
  for (const r of results) {
    if (!('error' in r)) process.stdout.write(`pass  ${r.name}\n`);
    else {
      failed++;
      const message = r.error instanceof Error ? r.error.message : String(r.error);
      process.stdout.write(`FAIL  ${r.name}\n      ${message.split('\n').join('\n      ')}\n`);
    }
  }
  process.stdout.write(`\n${results.length - failed} of ${results.length} passed.\n`);
  process.exit(failed ? 1 : 0);
}
