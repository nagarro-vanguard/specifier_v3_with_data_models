// park.ts — sets a piece in progress aside, at the back of the queue.
//
//   node tools/park.ts --project <p> --capability <name>     at an FRD's gate, after your third "no"
//   node tools/park.ts --project <p> --epic <EPIC-nnn>       at an EPIC's gates, after your third "no"
//
// What it does:
//   A change never parks anything: its size is a hint for priority only.
//   - with --capability: parks that FRD, which must be in progress
//   - with --epic: parks that EPIC, whose Story list must be in progress
//   - an FRD is parked on its status line, an EPIC on its Story list's status line (conventions.md, "The status line"):
//       Status: parked on {date}, at its gate
//   route-next-capability.ts, route-next-epic.ts and status.ts then put the parked piece after the others.
//
// Exit codes: 0 parked; 1 nothing in progress to park; 2 the piece or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import { parseArgs, requireOption, textOption, fail, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, pathOf, readText, slug, writeText, type PathOptions } from './lib/run-paths.ts';
import { epicOf } from './lib/check-document.ts';
import { inProgress, type Piece } from './size-rules.ts';

const USE = 'Use: node tools/park.ts --project <p> with one of --capability <name> or --epic <EPIC-nnn>';
const WHY = 'at its gate';

function setStatus(file: string, line: string): void {
  const text = readText(file);
  if (!/^Status: .*$/m.test(text)) throw new LayoutError(`${file} has no status line to park.`);
  writeText(file, text.replace(/^Status: .*$/m, line));
}

// The pieces in progress the option names: the FRD of a capability, or an EPIC's Story list.
function piecesNamed(project: string, capability: string | true | undefined, epic: string, opts: PathOptions): Piece[] {
  const parkable = inProgress(project, opts).filter((p) => p.kind === 'frd' || p.kind === 'epic');
  if (capability) {
    const file = pathOf(project, 'frd', { capability: slug(String(capability)) }, opts);
    if (!fs.existsSync(file)) throw new LayoutError(`There is no FRD for "${capability}": ${file}`);
    return parkable.filter((p) => p.file === file);
  }
  const e = epicOf(project, epic, opts);
  return parkable.filter((p) => p.kind === 'epic' && p.id === e.id);
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const { capability, epic } = args.values;
  const named = [capability, epic].filter((x) => x && x !== true);
  if (named.length !== 1) fail(USE, 2);
  const date = textOption(args, 'date') ?? today();
  const pieces = piecesNamed(project, capability, String(epic), { output: args.output });
  if (!pieces.length) {
    process.stdout.write('Nothing in progress to park: only an FRD that is drafted, or an EPIC whose stories are being written, can be parked.\n');
    return 1;
  }
  for (const p of pieces) setStatus(p.file, `Status: parked on ${date}, ${WHY}`);
  process.stdout.write(`${programName(import.meta.filename)}: parked on ${date}, ${WHY}:\n${pieces.map((p) => `- ${p.label}`).join('\n')}\nEach now comes after the pieces that don't wait on it.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
