// next-change-step.ts — names the next update of a change you said yes to, for change-orchestration-workflow.
//
//   node tools/next-change-step.ts --project <p> --change <nnn>
//
// What it does:
//   1. reads the change's to-do list, changes/{change}/progress.md, which track-change.ts wrote at your yes
//   2. takes its first row still pending, in the list's order, which is the order the workflows run
//   3. names the workflow and the step that row is for, and the items section 15 of the report gives that step
//   4. prints the next update, then how many are left, or "Every update is made." when none is pending
//
// Exports: next(project, change, opts), the next update; steps(report), each row of section 15 with its items.
//
// Exit codes: 0 named, or every update made; 2 the change, its report, its to-do list or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, fail, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, pathOf, type PathOptions } from './lib/run-paths.ts';
import type { ChangeFolder } from './lib/check-document.ts';
import { list, tableUnder, type Cell } from './lib/md-tables.ts';
import { read, type ChangeReport } from './lib/change-report.ts';
import { read as readProgress } from './track-change.ts';

const USE = 'Use: node tools/next-change-step.ts --project <p> --change <nnn>';

// One row of section 15: its workflow, its step, the two as one label, and its items. workflow is null for a step
// section 15 doesn't name.
export interface RecommendedStep {
  workflow: string | null;
  step: string;
  label: string;
  items: string[];
}

export interface NextStep {
  change: ChangeFolder;
  closed: boolean;
  next: { document: string; runs: RecommendedStep[] } | null;
  left: number;
  of: number;
}

const oneLine = (cell: Cell | undefined): string => list(cell).map((x) => x.trim()).join(' ').trim();

// Each row of section 15, as "{workflow}, {step}", or the step alone when it runs on its own, with its items.
export function steps(report: ChangeReport): RecommendedStep[] {
  return (tableUnder(report.text, 'The recommendation') || []).map((x) => {
    const workflow = oneLine(x.Workflow);
    const step = oneLine(x.Step);
    return { workflow, step, label: workflow === 'on its own' ? step : `${workflow}, ${step}`, items: list(x.Items).map((i) => i.trim()).filter(Boolean) };
  });
}

export function next(project: string, change: string, opts: PathOptions = {}): NextStep {
  const r = read(project, change, opts);
  const file = pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(file)) throw new LayoutError(`Change ${r.change.number} has no to-do list yet: say yes at step 5 of change-request-workflow first.`);
  const p = readProgress(file);
  const pending = p.rows.filter((x) => x.status === 'pending');
  if (!pending.length) return { change: r.change, closed: p.closed, next: null, left: 0, of: p.rows.length };
  const row = pending[0];
  const known = steps(r);
  const runs = row.for.map((f) => known.find((s) => s.label === f) || { label: f, workflow: null, step: f, items: [] });
  return { change: r.change, closed: p.closed, next: { document: row.document, runs }, left: pending.length, of: p.rows.length };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const o = next(project, change, { output: args.output });
  if (!o.next) {
    process.stdout.write(`Every update is made: ${o.of} of ${o.of}.${o.closed ? ` Change ${o.change.number} is closed.` : ''} Next: run change-summary.ts.\n`);
    return 0;
  }
  const lines = [`Next: ${o.next.document}`];
  for (const s of o.next.runs) lines.push(`- run ${s.label}${s.items.length ? `, for ${s.items.join(', ')}` : ''}`);
  lines.push('', `${o.left} of ${o.of} still to make.`);
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

if (import.meta.main) runMain(main);
