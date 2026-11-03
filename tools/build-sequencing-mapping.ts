// build-sequencing-mapping.ts — builds the EPIC sequencing and the EPIC mapping from the EPIC register, so neither is
// ever written by hand.
//
//   node tools/build-sequencing-mapping.ts --project <p>
//
// What it does:
//   - EPIC sequencing, epics/sequencing.md:
//     - each EPIC's step comes from what it depends on: an EPIC that depends on none is step 1; any other is one more
//       than the highest step of the EPICs it depends on. EPICs with the same step can run side by side.
//     - each EPIC's reason is copied from the EPIC grouping's suggested sequence
//     - the critical path is the longest chain of dependencies. When two chains are as long, the one that ends with the
//       EPIC earlier in the register wins.
//     - the most depended-on EPIC is the one with the most EPICs waiting on it, directly or through others. A tie goes
//       to the EPIC earlier in the register.
//   - EPIC mapping, epics/mapping.md: one row per EPIC, with its band, its features and the requirements they cover,
//     and a coverage line: every feature in the Feature catalog is in exactly one EPIC
//   Everything is written in fixed sentences, with no free prose, so the same register always gives the same files.
//
// Exports:
//   build(project, opts)   writes both files: what it wrote, its findings, the critical path and how many steps
//   steps(epics)           each EPIC's step, and every loop in the dependencies
//
// Exit codes: 0 written; 1 the dependencies form a loop, or a feature isn't in exactly one EPIC, each listed, and
// nothing is written for a loop; 2 the register, the grouping, the catalog or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellItems, cellNumber } from './lib/md-tables.ts';
import { load } from './lib/check-document.ts';
import { plural } from './lib/text.ts';
import { epicId } from './check-register.ts';

// An EPIC as its register row gives it.
export interface RegisterEpic {
  id: string;
  name: string;
  band: string;
  features: string[];
  deps: string[];
}

export interface Steps {
  // Each EPIC's step, from 1. Empty of the EPICs after a loop is found.
  step: Map<string, number>;
  // Each loop, such as "EPIC-001 -> EPIC-002 -> EPIC-001".
  loop: string[];
}

export type BuildResult =
  | { written: string[]; findings: string[] }
  | { written: string[]; findings: string[]; path: string[]; steps: number };

interface Register {
  // The EPIC IDs, in the register's order.
  order: string[];
  epics: Map<string, RegisterEpic>;
}

export function steps(epics: Map<string, RegisterEpic>): Steps {
  const step = new Map<string, number>();
  const loop: string[] = [];
  const visit = (id: string, chain: string[]): number => {
    const known = step.get(id);
    if (known !== undefined) return known;
    if (chain.includes(id)) {
      loop.push([...chain.slice(chain.indexOf(id)), id].join(' -> '));
      return 0;
    }
    const epic = epics.get(id);
    const deps = epic ? epic.deps.filter((d) => epics.has(d)) : [];
    const s = deps.length ? 1 + Math.max(...deps.map((d) => visit(d, [...chain, id]))) : 1;
    if (!loop.length) step.set(id, s);
    return s;
  };
  for (const id of epics.keys()) visit(id, []);
  return { step, loop };
}

function readRegister(registerText: string): Register {
  const order: string[] = [];
  const epics = new Map<string, RegisterEpic>();
  for (const r of tableUnder(registerText, 'EPICs') || []) {
    const id = cellText(r.EPIC);
    order.push(id);
    epics.set(id, { id, name: cellText(r.Name), band: cellText(r.Band), features: cellItems(r.Features), deps: cellItems(r['Depends on']) });
  }
  return { order, epics };
}

// The critical path: the longest chain, ending at the earliest EPIC in the register with the highest step.
function criticalPath({ order, epics }: Register, step: Map<string, number>, top: number): string[] {
  let at = order.find((id) => step.get(id) === top) as string;
  const chain = [at];
  while (epics.get(at)!.deps.length) {
    const deps = epics.get(at)!.deps.filter((d) => epics.has(d));
    const best = Math.max(...deps.map((d) => step.get(d) as number));
    at = order.find((id) => deps.includes(id) && step.get(id) === best) as string;
    chain.unshift(at);
  }
  return chain;
}

// The most depended-on EPIC: the most EPICs waiting on it, directly or through others. A tie goes to the earlier one.
function mostDependedOn({ order, epics }: Register): { most: string; waiting: number } {
  const waiting = new Map(order.map((id) => [id, new Set<string>()]));
  const reach = (id: string, from: string): void => {
    for (const d of epics.get(id)!.deps) {
      if (epics.has(d) && !waiting.get(d)!.has(from)) {
        waiting.get(d)!.add(from);
        reach(d, from);
      }
    }
  };
  for (const id of order) reach(id, id);
  const most = order.reduce((a, b) => (waiting.get(b)!.size > waiting.get(a)!.size ? b : a), order[0]);
  return { most, waiting: waiting.get(most)!.size };
}

// A generated document opens with its title and one line saying a program writes it; it has no opening notes.
function openingOf(title: string, product: string): string[] {
  return [
    `# ${title} — ${product}`,
    '',
    'Written by build-sequencing-mapping.ts, from the EPIC register, every time it runs. Never edit it by hand.',
    '',
  ];
}

function sequencingLines(register: Register, product: string, step: Map<string, number>, top: number, chain: string[], reasons: Map<string, string>): string[] {
  const { order, epics } = register;
  const label = (id: string) => `${id} ${epics.get(id)!.name}`;
  const lines = [
    ...openingOf('EPIC sequencing', product),
    '## 1. Steps',
    '',
    '| Step | EPICs, side by side | Depends on |',
    '|---|---|---|',
  ];
  for (let s = 1; s <= top; s++) {
    const here = order.filter((id) => step.get(id) === s);
    const deps = [...new Set(here.flatMap((id) => epics.get(id)!.deps))].filter((d) => epics.has(d));
    lines.push(`| ${s} | ${here.map((id) => `• ${label(id)}`).join('<br>')} | ${deps.length ? deps.map((d) => `• ${d}`).join('<br>') : 'None'} |`);
  }
  lines.push('', '## 2. Why each EPIC is where it is', '', '| EPIC | Step | Reason |', '|---|---|---|');
  for (const id of order) lines.push(`| ${label(id)} | ${step.get(id)} | ${reasons.get(id) || 'None given'} |`);
  lines.push('', '## 3. The critical path', '');
  lines.push(chain.length === 1 ? `No EPIC depends on another, so the critical path is one EPIC long: ${label(chain[0])}.` : `The critical path is ${chain.length} EPICs long: ${chain.map(label).join(', then ')}.`);
  lines.push('', '## 4. The most depended-on EPIC', '');
  const { most, waiting } = mostDependedOn(register);
  lines.push(waiting ? `${label(most)}: ${plural(waiting, 'EPIC')} ${waiting === 1 ? 'waits' : 'wait'} on it, directly or through others.` : 'None: no EPIC depends on another.');
  return lines;
}

// The mapping, and coverage: every catalog feature in exactly one EPIC.
function mappingLines({ order, epics }: Register, product: string, catalogText: string): { lines: string[]; findings: string[] } {
  const label = (id: string) => `${id} ${epics.get(id)!.name}`;
  const features = (tableUnder(catalogText, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const nameOf = new Map(features.map((f) => [cellText(f['Feature ID']), cellText(f.Feature)]));
  const coversOf = new Map(features.map((f) => [cellText(f['Feature ID']), cellItems(f['Covers (source IDs)'])]));
  const lines = [
    ...openingOf('EPIC mapping', product),
    '## 1. EPICs, features and requirements',
    '',
    '| EPIC | Band | Features | Requirements |',
    '|---|---|---|---|',
  ];
  for (const id of order) {
    const epic = epics.get(id)!;
    const reqs = [...new Set(epic.features.flatMap((f) => coversOf.get(f) || []))];
    lines.push(`| ${label(id)} | ${epic.band} | ${epic.features.map((f) => `• ${f} ${nameOf.get(f) || ''}`.trim()).join('<br>')} | ${reqs.map((r) => `• ${r}`).join('<br>') || 'None'} |`);
  }
  const holding = (f: string) => order.filter((id) => epics.get(id)!.features.includes(f)).length;
  const findings: string[] = [];
  for (const f of nameOf.keys()) {
    const n = holding(f);
    if (n !== 1) findings.push(`${f} is in ${n === 0 ? 'no EPIC' : `${n} EPICs`}.`);
  }
  for (const id of order) for (const f of epics.get(id)!.features) if (!nameOf.has(f)) findings.push(`${id} holds ${f}, which isn't in the Feature catalog.`);
  lines.push('', '## 2. Coverage', '');
  const placed = [...nameOf.keys()].filter((f) => holding(f) === 1).length;
  lines.push(findings.length ? `${placed} of ${plural(nameOf.size, 'feature')} are in exactly one EPIC. The others:` : `Every feature is in exactly one EPIC: ${placed} of ${nameOf.size}.`);
  if (findings.length) lines.push('', ...findings.map((f) => `- ${f}`));
  return { lines, findings };
}

export function build(project: string, opts: PathOptions = {}): BuildResult {
  const registerDoc = load(project, 'epic-register', {}, opts);
  const grouping = load(project, 'epic-grouping', {}, opts);
  const catalog = load(project, 'feature-catalog', {}, opts);
  const product = registerDoc.text.match(/^# EPIC register — (.+)$/m)?.[1] || project;
  const register = readRegister(registerDoc.text);
  const { step, loop } = steps(register.epics);
  if (loop.length) return { written: [], findings: [...new Set(loop)].map((l) => `The dependencies form a loop: ${l}.`) };

  const reasons = new Map((tableUnder(grouping.text, 'Suggested EPIC sequence') || []).map((s) => [epicId(cellNumber(s.EPIC)), cellText(s.Rationale)]));
  const top = Math.max(...step.values());
  const chain = criticalPath(register, step, top);
  const sequencing = sequencingLines(register, product, step, top, chain, reasons);
  const mapping = mappingLines(register, product, catalog.text);

  fs.writeFileSync(pathOf(project, 'epic-sequencing', {}, opts), `${sequencing.join('\n')}\n`);
  fs.writeFileSync(pathOf(project, 'epic-mapping', {}, opts), `${mapping.lines.join('\n')}\n`);
  return { written: ['epics/sequencing.md', 'epics/mapping.md'], findings: mapping.findings, path: chain, steps: top };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/build-sequencing-mapping.ts --project <p>');
  const result = build(project, { output: args.output });
  if ('path' in result) process.stdout.write(`Built from the EPIC register: ${plural(result.steps, 'step')}, critical path ${result.path.join(', then ')}.\n${result.written.map((w) => `- ${w}`).join('\n')}\n`);
  if (result.findings.length) process.stdout.write(`${plural(result.findings.length, 'finding')}:\n${result.findings.map((f) => `- ${f}`).join('\n')}\n`);
  return result.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
