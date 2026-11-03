// change-summary.ts — shows what a change updated, once change-orchestration-workflow has made its updates.
//
//   node tools/change-summary.ts --project <p> --change <nnn>
//
// What it does:
//   1. reads the change's to-do list, changes/{change}/progress.md, and section 15 of its report
//   2. prints one row for each document: its version before the change, its version after, and the items section 15
//      gave the steps that updated it
//   3. says whether the change is closed, or how many updates are still to make
//
// It writes nothing.
//
// Exports: summary(project, change, opts), the change's summary.
//
// Exit codes: 0 shown; 2 the change, its report, its to-do list or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, fail, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, pathOf, type PathOptions } from './lib/run-paths.ts';
import type { ChangeFolder } from './lib/check-document.ts';
import { read } from './lib/change-report.ts';
import { read as readProgress } from './track-change.ts';
import { steps } from './next-change-step.ts';

const USE = 'Use: node tools/change-summary.ts --project <p> --change <nnn>';

// One document the change updated: its version before and after, and what changed in it.
export interface SummaryRow {
  document: string;
  before: string;
  after: string;
  what: string[];
}

export interface Summary {
  change: ChangeFolder;
  name: string;
  closed: boolean;
  rows: SummaryRow[];
  left: number;
}

export function summary(project: string, change: string, opts: PathOptions = {}): Summary {
  const r = read(project, change, opts);
  const file = pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(file)) throw new LayoutError(`Change ${r.change.number} has no to-do list yet: say yes at step 5 of change-request-workflow first.`);
  const p = readProgress(file);
  const known = steps(r);
  const rows = p.rows.map((x) => {
    const after = x.status.match(/version (\d+)$/)?.[1];
    const what = x.for.flatMap((f) => (known.find((s) => s.label === f) || { items: [f] }).items);
    return { document: x.document, before: x.start === 'none' ? 'new' : `version ${x.start}`, after: after ? `version ${after}` : 'not yet', what };
  });
  return { change: r.change, name: r.name, closed: p.closed, rows, left: p.rows.filter((x) => x.status === 'pending').length };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const s = summary(project, change, { output: args.output });
  const lines = [`Change ${s.change.number}, ${s.name}: ${s.closed ? 'closed' : s.left ? `${s.left} still to make` : 'every update made'}.`, ''];
  if (!s.rows.length) lines.push('Nothing needed to change.');
  else {
    lines.push('| Document | Before | After | What changed |', '|---|---|---|---|');
    for (const x of s.rows) lines.push(`| ${x.document} | ${x.before} | ${x.after} | ${x.what.map((w) => `• ${w}`).join('<br>')} |`);
  }
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

if (import.meta.main) runMain(main);
