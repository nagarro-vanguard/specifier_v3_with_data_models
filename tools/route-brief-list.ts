// route-brief-list.ts — says whether an EPIC gets an EPIC brief, from the EPIC grouping's EPIC brief list.
//
//   node tools/route-brief-list.ts --project <p> --epic EPIC-002
//
// It prints "yes" or "no" on the first line, then the reason the list gives. The EPIC is found in the list by its
// number: EPIC-002 is the list's EPIC 2.
//
// Exports:
//   answer(project, epic, opts)   the EPIC, and its row in the EPIC brief list, or undefined when it isn't there
//
// Exit codes: 0 answered; 1 the EPIC isn't in the list; 2 the grouping, the register or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import { parseArgs, requireOption, fail, runMain, type ExitCode } from './lib/cli.ts';
import type { PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellNumber, type Row } from './lib/md-tables.ts';
import { load, epicOf, type Epic } from './lib/check-document.ts';

export interface BriefAnswer {
  epic: Epic;
  row: Row | undefined;
}

export function answer(project: string, epic: string, opts: PathOptions = {}): BriefAnswer {
  const found = epicOf(project, epic, opts);
  const grouping = load(project, 'epic-grouping', {}, opts);
  const n = Number(found.id.slice(5));
  const row = (tableUnder(grouping.text, 'EPIC brief list, in run order') || []).find((r) => cellNumber(r.EPIC) === n);
  return { epic: found, row };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const use = 'Use: node tools/route-brief-list.ts --project <p> --epic EPIC-002';
  const project = requireOption(args, 'project', use);
  const epic = args.values.epic;
  if (!epic) fail(use, 2);
  const result = answer(project, String(epic), { output: args.output });
  if (!result.row) {
    process.stdout.write(`${result.epic.id} ${result.epic.name} isn't in the EPIC grouping's EPIC brief list.\n`);
    return 1;
  }
  const brief = cellText(result.row.Brief).toLowerCase();
  process.stdout.write(`${brief}\n${result.epic.id} ${result.epic.name}: ${brief === 'yes' ? 'it gets an EPIC brief' : 'no EPIC brief: its stories come next'}, because ${cellText(result.row.Reason)}.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
