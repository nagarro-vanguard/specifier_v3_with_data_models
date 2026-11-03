// projects.ts — the test projects several test files build the same way.
//
// Exports:
//   expenseClaims(name)   the Expense claims project in a new temporary folder: the worked examples, then the later
//                         documents in fixtures/expense-claims/. name names the folder, such as specifier-frd-a1b2c3.
//
// Each project gives read(rel) and write(rel, text) for a file in its folder, and change(rel, from, to), which plants
// one failure: from must be found exactly once.

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { EXAMPLES, FIXTURES, readText, tempDir, copyDir } from './harness.ts';

export interface TestProject {
  // The Output folder.
  out: string;
  // The project's own folder in it.
  dir: string;
  read(rel: string): string;
  write(rel: string, text: string): void;
  change(rel: string, from: string, to: string): void;
}

export function expenseClaims(name: string): TestProject {
  const out = tempDir(name);
  const dir = path.join(out, 'expense-claims');
  fs.mkdirSync(dir, { recursive: true });
  for (const d of ['discovery-brief', 'brd', 'prd', 'question-log']) fs.copyFileSync(path.join(EXAMPLES, `${d}.md`), path.join(dir, `expense-claims-${d}.md`));
  copyDir(path.join(FIXTURES, 'expense-claims'), dir);
  const read = (rel: string): string => readText(path.join(dir, rel));
  const write = (rel: string, t: string): void => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), t); };
  const change = (rel: string, from: string, to: string): void => {
    const t = read(rel);
    const at = t.split(from).length - 1;
    assert.strictEqual(at, 1, `"${from}" is in ${rel} ${at} times, not once`);
    write(rel, t.replace(from, to));
  };
  return { out, dir, read, write, change };
}
