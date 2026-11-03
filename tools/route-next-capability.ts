// route-next-capability.ts — names the next FRD to write.
//
//   node tools/route-next-capability.ts --project <p>
//
// What it does:
//   1. lists every capability the Feature catalog names, such as "FRD-3a Claim approval", with its features
//   2. orders them by the earliest EPIC, in the EPIC register's run order, that holds any of their features; a
//      capability no EPIC holds comes after the rest, in the catalog's order
//   3. leaves out each capability whose FRD is accepted
//   4. puts a capability waiting on an open Must answer question after the others: one whose Feature catalog row, for
//      any of its features, names that question, such as "Proposed (needs confirmation), question 4". It comes back
//      once the question is answered, or when only waiting and parked capabilities are left.
//   5. puts parked capabilities last
//   6. prints the next capability and its features, then the queue, or "Every FRD accepted: next, run stories-workflow."
//
// Exports:
//   route(project, opts)   every capability, sorted into ready, waiting, parked and accepted, and the queue
//
// Exit codes: 0 routed; 2 the catalog, the register or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, readText, slug, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellItems, type Row } from './lib/md-tables.ts';
import { load, questions } from './lib/check-document.ts';

export interface Capability {
  // As the catalog names it, such as "FRD-3a Claim approval".
  cap: string;
  // Each feature as "F-04 Manager approval".
  features: string[];
  // The open Must answer questions its catalog rows name.
  waitsOn: Set<number>;
  // Its FRD's path inside the project, such as frd/frd-claim-approval.md.
  file?: string;
  status?: string;
}

export interface CapabilityRoute {
  ready: Capability[];
  waiting: Capability[];
  parked: Capability[];
  accepted: Capability[];
  // ready, then waiting, then parked
  queue: Capability[];
}

// Each capability the catalog names, in the catalog's order, with its features and the open Must answer questions
// its rows name.
function capabilitiesOf(catalogRows: Row[], mustOpen: Set<number | null>): Map<string, Capability> {
  const caps = new Map<string, Capability>();
  for (const r of catalogRows) {
    const cap = cellText(r.Capability);
    if (!cap) continue;
    if (!caps.has(cap)) caps.set(cap, { cap, features: [], waitsOn: new Set() });
    const c = caps.get(cap)!;
    c.features.push(`${cellText(r['Feature ID'])} ${cellText(r.Feature)}`);
    const rowText = Object.entries(r).filter(([k]) => k !== '_heading').map(([, v]) => cellText(v)).join(' ');
    for (const m of rowText.matchAll(/question (\d+)/gi)) if (mustOpen.has(Number(m[1]))) c.waitsOn.add(Number(m[1]));
  }
  return caps;
}

// Each feature's place in the run order: the earliest EPIC that holds it.
function featurePlaces(registerText: string): Map<string, number> {
  const order = (tableUnder(registerText, 'Run order') || []).map((r) => cellText(r.EPIC));
  const featureAt = new Map<string, number>();
  for (const e of tableUnder(registerText, 'EPICs') || []) {
    const at = order.indexOf(cellText(e.EPIC));
    for (const f of cellItems(e.Features)) if (!featureAt.has(f) || at < featureAt.get(f)!) featureAt.set(f, at < 0 ? Infinity : at);
  }
  return featureAt;
}

export function route(project: string, opts: PathOptions = {}): CapabilityRoute {
  const catalog = load(project, 'feature-catalog', {}, opts);
  const register = load(project, 'epic-register', {}, opts);
  const graded = questions(project, opts);
  const mustOpen = new Set(graded.open.filter((q) => q.group === 'Must answer').map((q) => q.n));

  const rows = (tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const caps = capabilitiesOf(rows, mustOpen);
  const featureAt = featurePlaces(register.text);
  const catalogOrder = [...caps.keys()];
  const placeOf = (c: Capability) => Math.min(...c.features.map((f) => featureAt.get(f.split(' ')[0]) ?? Infinity));

  const out: CapabilityRoute = { ready: [], waiting: [], parked: [], accepted: [], queue: [] };
  for (const c of caps.values()) {
    const name = c.cap.replace(/^FRD-\d+[a-z]\s+/, '');
    const file = pathOf(project, 'frd', { capability: slug(name) }, opts);
    c.file = `frd/frd-${slug(name)}.md`;
    const status = fs.existsSync(file) ? readText(file).match(/^Status: (drafted|accepted|parked)/m)?.[1] : null;
    c.status = status || 'not started';
    if (status === 'accepted') out.accepted.push(c);
    else if (status === 'parked') out.parked.push(c);
    else if (c.waitsOn.size) out.waiting.push(c);
    else out.ready.push(c);
  }
  const byPlace = (a: Capability, b: Capability) => placeOf(a) - placeOf(b) || catalogOrder.indexOf(a.cap) - catalogOrder.indexOf(b.cap);
  for (const group of [out.ready, out.waiting, out.parked]) group.sort(byPlace);
  out.queue = [...out.ready, ...out.waiting, ...out.parked];
  return out;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/route-next-capability.ts --project <p>');
  const result = route(project, { output: args.output });
  if (!result.queue.length) {
    process.stdout.write('Every FRD accepted: next, run stories-workflow.\n');
    return 0;
  }
  const next = result.queue[0];
  const why = (c: Capability) => (result.parked.includes(c) ? 'parked' : c.waitsOn.size ? `waits on Must answer ${[...c.waitsOn].map((n) => `question ${n}`).join(' and ')}` : c.status);
  const lines = [`Next: ${next.cap}, ${next.file}${result.ready.length ? '' : `: ${why(next)}, but nothing else is ready`}`, ...next.features.map((f) => `- ${f}`), '', 'The queue:'];
  result.queue.forEach((c, i) => lines.push(`${i + 1}. ${c.cap}: ${why(c)}`));
  if (result.accepted.length) lines.push('', `Accepted: ${result.accepted.map((c) => c.cap).join(', ')}`);
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

if (import.meta.main) runMain(main);
