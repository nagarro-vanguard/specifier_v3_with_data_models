// check-epic-grouping.ts — checks the EPIC grouping before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-epic-grouping.ts --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the EPIC grouping template, in order, with no section of its own
//   - the feature inventory is the Feature catalog: every feature once, with its name, requirements, priority and
//     what it depends on copied as they are
//   - there are two or three options, each following a strategy from the list, and each places every feature in
//     exactly one EPIC; the recommended option is one of them
//   - the chosen grouping is one of the options, copied in full: the same EPICs, names, bands and features. Each
//     EPIC's band fits its MVP and Later features, and its outcome reads "As a ..., I need ..., so that ...".
//   - the inter-EPIC dependencies are exactly the ones the catalog's "Depends on" makes across EPICs
//   - every EPIC is in the suggested sequence once, and the EPIC brief list follows that order, with yes or no and a
//     reason for each
//   - every clash is settled, by a decision in the Decision record. A clash is a first-band feature that depends on a
//     later-band one, or an EPIC sequenced before an EPIC it depends on; the program finds every one from the catalog.
//   - once the grouping is accepted, the Decision record holds the pick
//   - no retired Glossary word is used, through lib/scan-retired-words.ts
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - grade-questions.ts finds nothing wrong with this grouping's gaps or the questions it raised
//
// Exports:
//   check(project, opts)   every check on the grouping, what the draft holds, and the gate's notices
//   sameItems(a, b)        whether two lists hold the same items, in any order
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the grouping, the catalog, the Glossary or
// the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import type { PathOptions } from './lib/run-paths.ts';
import { tableUnder, headings, normalize, cellText, cellItems, cellNumber, type Row } from './lib/md-tables.ts';
import { load, lines, opening, sections, placeholders, rendering, simpleWriting, questions, questionFindingsFor, report } from './lib/check-document.ts';
import { retiredWords, currentTerms, scan } from './lib/scan-retired-words.ts';
import { plural } from './lib/text.ts';
import type { Check, CheckResult, LoadedDocument } from './lib/types.ts';

const PROGRAM = programName(import.meta.filename);
const STRATEGIES = ['By business capability', 'By user journey stage', 'By persona or role', 'By value stream or outcome', 'By delivery sequence', 'By complexity or risk'] as const;

// Whether two lists hold the same items, in any order.
export const sameItems = (a: readonly string[], b: readonly string[]): boolean => a.slice().sort().join() === b.slice().sort().join();

interface GroupingOption {
  strategy: string;
  rows: Row[];
}

// Where the chosen grouping puts each feature: its EPIC's Sl. No. and its band.
interface Placement {
  epicOf: Map<string, number>;
  bandOf: Map<string, 'MVP' | 'Later'>;
}

// A dependency the catalog names: the feature, and the feature it depends on.
type Edge = [string, string];

interface Clash {
  f: string;
  g: string;
  why: string;
}

// The level-3 headings inside a level-2 section that start with prefix, such as "Option A: ..." in "2. Options".
function underHeading(t: string, prefix: string) {
  return headings(t).filter((h) => h.level === 3 && h.text.startsWith(prefix));
}

// Each decision in the Decision record, by its number, with what it chose.
function decisionsOf(t: string): Map<number, string> {
  const out = new Map<number, string>();
  let current: number | null = null;
  for (const { line, section } of lines(t)) {
    if (normalize(section) !== 'decision record') continue;
    const h = line.match(/^###\s+Decision (\d+) — /);
    if (h) {
      current = Number(h[1]);
      out.set(current, '');
    }
    const c = line.match(/^- \*\*Chosen:\*\* (.*)$/);
    if (c && current !== null) out.set(current, c[1]);
  }
  return out;
}

function inventoryCheck(inventory: Row[], byId: Map<string, Row>): { check: Check; seen: Set<string> } {
  const findings: string[] = [];
  const seen = new Set<string>();
  for (const r of inventory) {
    const id = cellText(r['Feature ID']);
    const f = byId.get(id);
    if (seen.has(id)) findings.push(`${id} is listed twice.`);
    seen.add(id);
    if (!f) {
      findings.push(`${id} isn't in the Feature catalog.`);
      continue;
    }
    if (cellText(r['Feature Name']) !== cellText(f.Feature)) findings.push(`${id}: its name isn't the catalog's, "${cellText(f.Feature)}".`);
    if (!sameItems(cellItems(r['Source Reference']), cellItems(f['Covers (source IDs)']))) findings.push(`${id}: its source reference isn't what the catalog says it covers.`);
    if (cellText(r.Priority) !== cellText(f.Priority)) findings.push(`${id}: its priority isn't the catalog's, ${cellText(f.Priority)}.`);
    if (!sameItems(cellItems(r['Depends on']), cellItems(f['Depends on']))) findings.push(`${id}: what it depends on isn't what the catalog says.`);
  }
  for (const id of byId.keys()) if (!seen.has(id)) findings.push(`${id} is in the Feature catalog but not in the inventory.`);
  return { check: { name: 'Feature inventory', findings }, seen };
}

// Every option places every feature in exactly one EPIC.
function optionsCheck(t: string, inventory: Set<string>): { check: Check; options: Map<string, GroupingOption>; recommended: string | undefined } {
  const options = new Map<string, GroupingOption>();
  const findings: string[] = [];
  for (const h of underHeading(t, 'Option ')) {
    const m = h.text.match(/^Option ([A-C]): (.+)$/);
    if (!m) {
      findings.push(`"${h.text}" isn't named "Option A: {strategy}".`);
      continue;
    }
    if (!(STRATEGIES as readonly string[]).includes(m[2])) findings.push(`Option ${m[1]}: "${m[2]}" isn't a strategy from the list.`);
    const rows = tableUnder(t, h.text) || [];
    options.set(m[1], { strategy: m[2], rows });
    const placed = rows.flatMap((r) => cellItems(r['Features (by ID)']));
    for (const id of inventory) {
      const n = placed.filter((p) => p === id).length;
      if (n !== 1) findings.push(`Option ${m[1]} places ${id} ${n === 0 ? 'in no EPIC' : `in ${n} EPICs`}.`);
    }
    for (const p of placed) if (!inventory.has(p)) findings.push(`Option ${m[1]} places ${p}, which isn't in the inventory.`);
  }
  if (options.size < 2 || options.size > 3) findings.push(`There ${options.size === 1 ? 'is 1 option' : `are ${options.size} options`}; there should be two or three.`);
  const recommended = t.match(/^- \*\*Recommended option:\*\* ([A-C])\b/m)?.[1];
  if (!recommended || !options.has(recommended)) findings.push('The recommended option isn\'t one of the options.');
  return { check: { name: 'Options', findings }, options, recommended };
}

// The chosen grouping's EPIC list and definitions are its option's, copied in full.
function copiedFromOption(option: GroupingOption, letter: string, epicList: Row[], definitions: Row[]): string[] {
  const findings: string[] = [];
  const want = option.rows.map((r) => `${cellText(r['Sl. No.'])} ${cellText(r['EPIC Name'])} ${cellText(r.Band)}`);
  const haveList = epicList.map((r) => `${cellText(r['Sl. No.'])} ${cellText(r['EPIC Name'])} ${cellText(r.Band)}`);
  if (want.join('\n') !== haveList.join('\n')) findings.push(`The EPIC list isn't option ${letter}'s EPICs, names and bands.`);
  for (const r of option.rows) {
    const n = cellText(r['Sl. No.']);
    const definition = definitions.find((x) => cellText(x['Sl. No.']) === n);
    if (!definition) {
      findings.push(`EPIC ${n} has no definition.`);
      continue;
    }
    if (cellText(definition['EPIC Name']) !== cellText(r['EPIC Name'])) findings.push(`EPIC ${n}: its name isn't option ${letter}'s.`);
    if (!sameItems([...cellItems(definition.MVP), ...cellItems(definition.Later)], cellItems(r['Features (by ID)']))) findings.push(`EPIC ${n}: its MVP and Later features aren't option ${letter}'s.`);
  }
  for (const d of definitions) if (!option.rows.some((r) => cellText(r['Sl. No.']) === cellText(d['Sl. No.']))) findings.push(`EPIC ${cellText(d['Sl. No.'])} isn't in option ${letter}.`);
  return findings;
}

function chosenGroupingCheck(t: string, options: Map<string, GroupingOption>): { check: Check; letter: string | undefined; definitions: Row[] } {
  const chosenHeading = headings(t).find((h) => h.level === 2 && /Chosen grouping: Option ([A-C])/.test(h.text));
  const letter = chosenHeading?.text.match(/Option ([A-C])/)?.[1];
  const option = letter ? options.get(letter) : undefined;
  const epicList = tableUnder(t, 'EPIC list') || [];
  const definitions = tableUnder(t, 'EPIC definitions') || [];
  const findings: string[] = [];
  if (!letter || !option) findings.push('The chosen grouping doesn\'t name one of the options.');
  else findings.push(...copiedFromOption(option, letter, epicList, definitions));
  for (const d of definitions) {
    const n = cellText(d['Sl. No.']);
    const band = cellItems(d.MVP).length && cellItems(d.Later).length ? 'Mixed' : cellItems(d.Later).length ? 'Later' : 'MVP';
    if (cellText(d.Band) !== band) findings.push(`EPIC ${n}: its band is ${cellText(d.Band)}, but its features make it ${band}.`);
    if (!/^As an? .+, I need .+, so that .+/.test(cellText(d['Outcome (hypothesis)']))) findings.push(`EPIC ${n}: its outcome should read "As a {persona}, I need {capability}, so that {outcome}".`);
    if (!cellText(d.Persona)) findings.push(`EPIC ${n} has no persona.`);
  }
  return { check: { name: 'Chosen grouping', findings }, letter, definitions };
}

function placementOf(definitions: Row[]): Placement {
  const epicOf = new Map<string, number>();
  const bandOf = new Map<string, 'MVP' | 'Later'>();
  for (const d of definitions) {
    for (const f of cellItems(d.MVP)) {
      epicOf.set(f, cellNumber(d['Sl. No.']));
      bandOf.set(f, 'MVP');
    }
    for (const f of cellItems(d.Later)) {
      epicOf.set(f, cellNumber(d['Sl. No.']));
      bandOf.set(f, 'Later');
    }
  }
  return { epicOf, bandOf };
}

// Inter-EPIC dependencies: exactly the pairs the catalog's "Depends on" makes across EPICs.
function dependenciesCheck(t: string, edges: Edge[], { epicOf }: Placement): Check {
  const pairs = new Set(edges.filter(([f, g]) => epicOf.has(f) && epicOf.has(g) && epicOf.get(f) !== epicOf.get(g)).map(([f, g]) => `${epicOf.get(f)}>${epicOf.get(g)}`));
  const listed = new Set((tableUnder(t, 'Inter-EPIC dependencies') || []).map((r) => `${cellNumber(r['From (Sl. No.)'])}>${cellNumber(r['Depends on (Sl. No.)'])}`));
  const findings: string[] = [];
  for (const p of pairs) if (!listed.has(p)) findings.push(`EPIC ${p.split('>')[0]} depends on EPIC ${p.split('>')[1]} through the catalog, but it isn't listed.`);
  for (const p of listed) if (!pairs.has(p)) findings.push(`EPIC ${p.split('>')[0]} is listed as depending on EPIC ${p.split('>')[1]}, but no feature makes it so.`);
  return { name: 'Inter-EPIC dependencies', findings };
}

// The sequence and the EPIC brief list.
function sequenceCheck(t: string, definitions: Row[]): { check: Check; sequence: number[]; briefs: Row[] } {
  const sequence = (tableUnder(t, 'Suggested EPIC sequence') || []).map((r) => cellNumber(r.EPIC));
  const briefs = tableUnder(t, 'EPIC brief list, in run order') || [];
  const findings: string[] = [];
  for (const d of definitions) {
    const n = cellNumber(d['Sl. No.']);
    const times = sequence.filter((s) => s === n).length;
    if (times !== 1) findings.push(`EPIC ${n} is in the suggested sequence ${times} times; it should be there once.`);
  }
  if (briefs.map((r) => cellNumber(r.EPIC)).join() !== sequence.join()) findings.push('The EPIC brief list doesn\'t follow the suggested sequence.');
  for (const r of briefs) {
    if (!/^(yes|no)$/i.test(cellText(r.Brief))) findings.push(`EPIC ${cellNumber(r.EPIC)}: "Brief" should be yes or no.`);
    if (!cellText(r.Reason)) findings.push(`EPIC ${cellNumber(r.EPIC)} has no reason for its brief.`);
  }
  return { check: { name: 'Sequence and EPIC briefs', findings }, sequence, briefs };
}

// Every clash the catalog makes: a first-band feature that depends on a later-band one, or an EPIC sequenced before
// an EPIC it depends on.
function clashesOf(edges: Edge[], { epicOf, bandOf }: Placement, sequence: number[]): Clash[] {
  const clashes: Clash[] = [];
  for (const [f, g] of edges) {
    if (bandOf.get(f) === 'MVP' && bandOf.get(g) === 'Later') clashes.push({ f, g, why: `${f}, in the first band, depends on ${g}, in the later band` });
    const ef = epicOf.get(f);
    const eg = epicOf.get(g);
    if (ef !== undefined && eg !== undefined && ef !== eg && sequence.indexOf(eg) > sequence.indexOf(ef)) clashes.push({ f, g, why: `EPIC ${ef} comes before EPIC ${eg}, but ${f} depends on ${g}` });
  }
  return clashes;
}

// Each clash settled by a decision.
function clashesCheck(clashes: Clash[], clashRows: Row[], decided: Map<number, string>): Check {
  const findings: string[] = [];
  for (const c of clashes) {
    const row = clashRows.find((r) => cellText(r.Feature) === c.f && cellItems(r['Depends on']).includes(c.g));
    if (!row) {
      findings.push(`A clash isn't settled: ${c.why}.`);
      continue;
    }
    if (!cellText(row.Settlement)) findings.push(`The clash between ${c.f} and ${c.g} has no settlement.`);
    const n = Number(cellText(row['Decided at']).match(/Decision (\d+)/)?.[1]);
    if (!decided.has(n)) findings.push(`The clash between ${c.f} and ${c.g} isn't settled by a decision in the Decision record.`);
  }
  return { name: 'Clashes', findings };
}

function pickCheck(doc: LoadedDocument, letter: string | undefined, decided: Map<number, string>): Check {
  const findings: string[] = [];
  if (doc.status === 'accepted' && letter && ![...decided.values()].some((c) => new RegExp(`\\bOption ${letter}\\b`).test(c))) findings.push(`The grouping is accepted, but no decision chose option ${letter}.`);
  return { name: 'The pick', findings };
}

export function check(project: string, opts: PathOptions = {}): CheckResult {
  const doc = load(project, 'epic-grouping', {}, opts);
  const catalog = load(project, 'feature-catalog', {}, opts);
  const t = doc.text;
  const checks: Check[] = [
    { name: 'Opening', findings: opening(t) },
    { name: 'Sections', findings: sections(t, 'epic-grouping') },
  ];

  const features = (tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const byId = new Map(features.map((f) => [cellText(f['Feature ID']), f]));
  const inventory = inventoryCheck(tableUnder(t, 'Feature inventory') || [], byId);
  const options = optionsCheck(t, inventory.seen);
  const chosen = chosenGroupingCheck(t, options.options);
  checks.push(inventory.check, options.check, chosen.check);

  const placement = placementOf(chosen.definitions);
  const edges: Edge[] = [];
  for (const f of features) for (const g of cellItems(f['Depends on'])) edges.push([cellText(f['Feature ID']), g]);
  checks.push(dependenciesCheck(t, edges, placement));
  const sequence = sequenceCheck(t, chosen.definitions);
  checks.push(sequence.check);

  const decided = decisionsOf(t);
  const clashRows = tableUnder(t, 'Clashes, and how you settled them') || [];
  const clashes = clashesOf(edges, placement, sequence.sequence);
  checks.push(clashesCheck(clashes, clashRows, decided), pickCheck(doc, chosen.letter, decided));

  const hits = scan(t, retiredWords(project, opts), currentTerms(project, opts), 'epic-grouping');
  checks.push({ name: 'Glossary words', findings: hits.map((h) => `Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`) });
  checks.push({ name: 'Placeholders', findings: placeholders(t) }, { name: 'Display', findings: rendering(t) });
  const writing = simpleWriting(t, { project, output: opts.output });
  checks.push({ name: 'Simple writing', findings: writing.findings });
  const graded = questions(project, opts);
  checks.push({ name: 'Question log', findings: questionFindingsFor(doc, graded) });

  const briefs = sequence.briefs;
  const holds = [
    `${plural(options.options.size, 'option')}, option ${options.recommended || '?'} recommended`,
    `the chosen grouping: option ${chosen.letter || '?'}, ${plural(chosen.definitions.length, 'EPIC')}`,
    `${plural(clashes.length, 'clash').replace(/clashs$/, 'clashes')} found, ${clashRows.length} settled`,
    `${briefs.filter((r) => /^yes$/i.test(cellText(r.Brief))).length} of ${plural(briefs.length, 'EPIC')} with an EPIC brief`,
  ];
  return { doc, checks, holds, graded, notices: writing.notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-epic-grouping.ts --project <p>');
  const date = textOption(args, 'date') ?? today();
  const out = report({ program: PROGRAM, date, ...check(project, { output: args.output }) });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
