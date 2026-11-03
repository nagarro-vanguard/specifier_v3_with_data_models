#!/usr/bin/env node
'use strict';
// park.cjs — sets a piece in progress aside, at the back of the queue.
//
//   node tools/park.cjs --project <p> --capability <name>     at an FRD's gate, after your third "no"
//   node tools/park.cjs --project <p> --epic <EPIC-nnn>       at an EPIC's gates, after your third "no"
//
// What it does:
//   A change never parks anything: its size is a hint for priority only.
//   - with --capability: parks that FRD, which must be in progress
//   - with --epic: parks that EPIC, whose Story list must be in progress
//   - an FRD is parked on its status line, an EPIC on its Story list's status line (conventions.md, "The status line"):
//       Status: parked on {date}, at its gate
//   route-next-capability.cjs, route-next-epic.cjs and status.cjs then put the parked piece after the others.
//
// Exit codes: 0 parked; 1 nothing in progress to park; 2 the piece or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const cd = require('./lib/check-document.cjs');
const sr = require('./size-rules.cjs');

function setStatus(file, line) {
  const t = rp.readText(file);
  if (!/^Status: .*$/m.test(t)) throw new rp.LayoutError(`${file} has no status line to park.`);
  rp.writeText(file, t.replace(/^Status: .*$/m, line));
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const { capability, epic } = args.values;
  if (!args.project || args.project === true || [capability, epic].filter((x) => x && x !== true).length !== 1) {
    rp.fail('Use: node tools/park.cjs --project <p> with one of --capability <name> or --epic <EPIC-nnn>', 2);
  }
  const opts = { output: args.output };
  const date = args.date && args.date !== true ? args.date : cd.today();
  const inProgress = sr.inProgress(args.project, opts).filter((p) => p.kind === 'frd' || p.kind === 'epic');
  let pieces;
  let why;
  if (capability) {
    const file = rp.pathOf(args.project, 'frd', { capability: rp.slug(capability) }, opts);
    if (!fs.existsSync(file)) throw new rp.LayoutError(`There is no FRD for "${capability}": ${file}`);
    pieces = inProgress.filter((p) => p.file === file);
    why = 'at its gate';
  } else {
    const e = cd.epicOf(args.project, epic, opts);
    pieces = inProgress.filter((p) => p.kind === 'epic' && p.id === e.id);
    why = 'at its gate';
  }
  if (!pieces.length) {
    process.stdout.write('Nothing in progress to park: only an FRD that is drafted, or an EPIC whose stories are being written, can be parked.\n');
    return 1;
  }
  for (const p of pieces) setStatus(p.file, `Status: parked on ${date}, ${why}`);
  process.stdout.write(`park.cjs: parked on ${date}, ${why}:\n${pieces.map((p) => `- ${p.label}`).join('\n')}\nEach now comes after the pieces that don't wait on it.\n`);
  return 0;
}

if (require.main === module) rp.run(main);
