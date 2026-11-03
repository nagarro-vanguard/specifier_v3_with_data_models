// route-next-epic.ts — names the next EPIC to write stories for.
//
//   node tools/route-next-epic.ts --project <p>
//
// What it does:
//   1. goes through the EPICs in the EPIC register's run order
//   2. leaves out the EPICs that are ready: every story in their Story list is ready
//   3. puts after the others an EPIC waiting on an open Must answer question: one its Story list or Stories name. It
//      comes back once the question is answered, or when only waiting and parked EPICs are left.
//   4. puts a parked EPIC after the waiting ones: its Story list reads "Status: parked"
//   5. puts last an EPIC that depends, directly or through others, on a parked EPIC: it can't start until the parked
//      one is ready. So when only those are left, the parked EPIC comes back first.
//   6. prints the next EPIC, then the queue, or "Every EPIC ready."
//
// Exports:
//   route(project, opts)   every EPIC, sorted into ready, normal, waiting, parked and blocked, and the queue
//
// Exit codes: 0 routed; 2 the register or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, readText, slug, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellItems, type Row } from './lib/md-tables.ts';
import { load, questions } from './lib/check-document.ts';

export type EpicState = 'not started' | 'in progress' | 'ready' | 'parked';

export interface RoutedEpic {
  id: string;
  name: string;
  deps: string[];
  state: EpicState;
  // The open Must answer questions its Story list or Stories name.
  waitsOn: Set<number>;
  // The parked EPIC it waits for, directly or through others. Set only for an EPIC that is neither ready nor parked.
  blockedBy?: string | null;
}

export interface EpicRoute {
  ready: RoutedEpic[];
  normal: RoutedEpic[];
  waiting: RoutedEpic[];
  parked: RoutedEpic[];
  blocked: RoutedEpic[];
  // normal, then waiting, then parked, then blocked
  queue: RoutedEpic[];
}

// One EPIC, with its state and the open Must answer questions its folder's files name.
function readEpic(project: string, id: string, row: Row, mustOpen: Set<number | null>, opts: PathOptions): RoutedEpic {
  const epic: RoutedEpic = { id, name: cellText(row.Name), deps: cellItems(row['Depends on']), state: 'not started', waitsOn: new Set() };
  const dir = pathOf(project, 'epic-folder', { epic: `${id}-${slug(epic.name)}` }, opts);
  const storyList = path.join(dir, 'story-list.md');
  if (!fs.existsSync(storyList)) return epic;
  const listText = readText(storyList);
  const statuses = (tableUnder(listText, 'Stories') || []).map((r) => cellText(r.Status));
  if (/^Status: parked/m.test(listText)) epic.state = 'parked';
  else if (statuses.length && statuses.every((s) => s === 'ready')) epic.state = 'ready';
  else epic.state = 'in progress';
  const all = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => readText(path.join(dir, f))).join('\n');
  for (const m of all.matchAll(/question (\d+)/gi)) if (mustOpen.has(Number(m[1]))) epic.waitsOn.add(Number(m[1]));
  return epic;
}

export function route(project: string, opts: PathOptions = {}): EpicRoute {
  const register = load(project, 'epic-register', {}, opts);
  const graded = questions(project, opts);
  const mustOpen = new Set(graded.open.filter((q) => q.group === 'Must answer').map((q) => q.n));
  const order = (tableUnder(register.text, 'Run order') || []).map((r) => cellText(r.EPIC));
  const rows = tableUnder(register.text, 'EPICs') || [];
  const ids = [...order, ...rows.map((r) => cellText(r.EPIC)).filter((id) => !order.includes(id))];

  const epics = new Map<string, RoutedEpic>();
  for (const id of ids) {
    const row = rows.find((r) => cellText(r.EPIC) === id);
    if (row) epics.set(id, readEpic(project, id, row, mustOpen, opts));
  }
  const parked = new Set([...epics.values()].filter((e) => e.state === 'parked').map((e) => e.id));
  const blockedBy = (epic: RoutedEpic, seen = new Set<string>()): string | null => {
    for (const d of epic.deps) {
      if (seen.has(d)) continue;
      seen.add(d);
      if (parked.has(d)) return d;
      const dependency = epics.get(d);
      const deeper = dependency && blockedBy(dependency, seen);
      if (deeper) return deeper;
    }
    return null;
  };
  const out: EpicRoute = { ready: [], normal: [], waiting: [], parked: [], blocked: [], queue: [] };
  for (const e of epics.values()) {
    if (e.state === 'ready') out.ready.push(e);
    else if (e.state === 'parked') out.parked.push(e);
    else if ((e.blockedBy = blockedBy(e))) out.blocked.push(e);
    else if (e.waitsOn.size) out.waiting.push(e);
    else out.normal.push(e);
  }
  out.queue = [...out.normal, ...out.waiting, ...out.parked, ...out.blocked];
  return out;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/route-next-epic.ts --project <p>');
  const result = route(project, { output: args.output });
  if (!result.queue.length) {
    process.stdout.write('Every EPIC ready.\n');
    return 0;
  }
  const why = (e: RoutedEpic) => (e.state === 'parked' ? 'parked' : e.blockedBy ? `waits for parked ${e.blockedBy}` : e.waitsOn.size ? `waits on Must answer ${[...e.waitsOn].map((n) => `question ${n}`).join(' and ')}` : e.state);
  const next = result.queue[0];
  const lines = [`Next: ${next.id} ${next.name}${result.normal.length ? '' : `: ${why(next)}, but nothing else is ready`}`, '', 'The queue:'];
  result.queue.forEach((e, i) => lines.push(`${i + 1}. ${e.id} ${e.name}: ${why(e)}`));
  if (result.ready.length) lines.push('', `Ready: ${result.ready.map((e) => e.id).join(', ')}`);
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

if (import.meta.main) runMain(main);
