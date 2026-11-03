// check-frd.ts — the deterministic checks on one FRD, before its gate, and the three blocks the gate needs.
//
//   node tools/check-frd.ts --project <p> --frd <file>
//
// --frd is the FRD's file, such as frd-claim-approval.md, or its path inside the project. The Feature catalog, the
// PRD and the Glossary are found through lib/run-paths.ts, and the data model files through lib/data-model.ts.
//
// Exports:
//   check(project, frdArg, opts)   every check on the FRD, what the draft holds, and the gate's notices
//
// Every check enforces a written rule, and its name says which section of frd-author's conventions it comes from,
// or the template. It adds no rule of its own. These are structure checks: they prove the document is copied,
// numbered and linked correctly, not that its rules are right; what only a reader can check is listed at the end of
// "For the person".
//
// The data model is required, as it is for check-features.ts. Who owns each action, field and move follows the
// Sources section of frd-author's conventions: an action or a move belongs to the feature the Feature catalog's
// section 5 gives it, and every field belongs to the feature that owns the thing's first action, the one that makes
// it. While that row still shows "?", or waits on a change, the action or move has no feature yet, and a finding
// about it says so. Five checks read it:
//   - the data model coverage table lists exactly the actions, fields and moves the covered features own, in the
//     data model files' order, named as the files name them
//   - every row has a rule, or waits on an ID that one of its own cells holds, such as "? (DM-5)". A row with an
//     answer still to be confirmed has a rule that keeps its "Proposed (needs confirmation), question {n}".
//   - every data model rule names a thing and an action, field or move of the data model, which this rule's own
//     feature owns, and which has a row in the coverage table
//   - "From the data model" lists exactly the data model rules
//   - Data copies each thing's rules table word for word, under a "From" line that links to its data model file
// One more reads the data model's decisions file: each DM-n a note names, as "on the basis of DM-n", and each DM-n or
// GC-n a coverage row waits on, is in it.
//
// A decision at this FRD's gate can change a data model answer, such as 5 loans at a time, not 3. Then the FRD says the
// new answer, and the data model stays as it is (the Rules section of frd-author's conventions). The FRD may differ
// from the data model only where a note says so: "*Updated from the data model on the basis of Decision n: {what
// changed}.*". In a data model rule, the note follows its source. In Data, it ends the cell that changed. Every other
// cell of Data is copied word for word. The decision the note names must be in the FRD's Decision record. A data
// model rule is the FRD's own wording, so the program can't see where it differs. The reader checks that.
//
// The "Glossary words" check enforces "Agreed words" in _shared/conventions.md: no retired Glossary word is used,
// through lib/scan-retired-words.ts. It skips a requirement's title and text copied exactly from the PRD, because the
// PRD is never rewritten to match the Glossary. It skips text copied exactly from the data model the same way: the
// rules tables in Data, and each thing with its action, field or move where the FRD names them.
//
// One behaviour per rule, from the Rules section of frd-author's conventions: a rule that may hold two behaviours is
// listed in "For the person", to look at, through lib/one-per-row.ts. It is never a finding: only a reader can judge.
//
// The FRD guard: every Must answer question the FRD names that is still open is listed in "For the person", with a
// line saying the FRD can't be accepted until it is answered, and can be parked. An open question is never a finding.
// A question named only in Data's copy of the data model doesn't count: a rule that builds on it names it too.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the FRD, the catalog, the PRD, the
// Glossary, the data model's things file, a data model file it names, or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { KIT_ROOT, LayoutError, identify, projectDir, readText, slug, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, list, normalize, type Cell, type Row } from './lib/md-tables.ts';
import {
  load, lines as documentLines, opening, sections as templateSections, placeholders, rendering, simpleWriting,
  requirementsOf, questions, questionFindingsFor, report,
} from './lib/check-document.ts';
import { retiredWords, currentTerms, scan, type RetiredWord } from './lib/scan-retired-words.ts';
import { load as loadDataModel, cell, moveName, things, decisionsOf, type DataModel, type DataModelFile } from './lib/data-model.ts';
import { check as onePerRow, notices as onePerRowNotices } from './lib/one-per-row.ts';
import { plural, escapeRegExp } from './lib/text.ts';
import type { Check, CheckResult, LoadedDocument } from './lib/types.ts';
import type { Graded, Question } from './grade-questions.ts';

const PROGRAM = programName(import.meta.filename);
const CONVENTIONS = path.join(KIT_ROOT, '.claude', 'skills', 'frd-author', 'references', 'conventions.md');
const TEMPLATE = path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'templates', 'frd.md');
const GATE = 'Accept the FRD?';
const NOT_CHECKED = [
  'lists of three or more items joined with commas',
  'the written Gates sentences are plain, and written for no one role in particular',
  'each rule states one behaviour, and states behaviour, not mechanism',
  'each rule is a faithful reading of the source it cites',
  'each data model rule is a faithful reading of its action, field or move',
  'a data model rule whose wording differs from its requirement because of a data model decision has a note that names that DM-n',
  'a data model rule whose answer differs from the data model has a note that names the decision at this gate that changed it',
  'each suggested rule picks between options the sources name; any other gap is a question in the Question log',
  'the Actors and the flow agree with the final rules',
  'every "Does not apply" in Standard questions is backed by a document that rules the topic out',
  'tensions between decisions were raised before the FRD was accepted',
] as const;
// A note names the decision a rule follows: a decision at this FRD's gate, or a data model decision. It says what
// the rule differs from: the requirement, or the data model.
const NOTE = '<br>*Updated from the ';
// A cell of Data that a decision at this FRD's gate changed: the new answer, then this note. The Data check lists each
// one, and the next check finds its decision in the Decision record.
const DATA_NOTE = /<br>\*Updated from the data model on the basis of Decision (\d+): (.+)\.\*$/;
const DM_KINDS = ['actions', 'fields', 'moves'] as const;
const ALLOWED_PREFIXES = ['REQ', 'F', 'FRD'] as const;

type Things = ReturnType<typeof things>;
type Part = DataModelFile['parts'][number];
type Proposed = ReturnType<typeof cell>['proposed'][number];
type OpenQuestion = Graded['open'][number];

interface CatalogFeature {
  name: string;
  desc: string;
  done: string;
  reqs: string[];
  priority: string;
  deps: string[];
  capability: string;
  // The catalog's section the feature sits in, from its heading's number.
  module: number;
}

interface CatalogPiece {
  dw: string;
  piece: string;
}

// A requirement's simple words in the PRD: "**{title}** — {text}".
interface PrdRequirement {
  title: string;
  text: string;
}

// The Feature catalog, the PRD and the Question log, as the checks read them.
interface Sources {
  catalog: Record<string, CatalogFeature>;
  moduleNames: Record<number, string>;
  pieces: CatalogPiece[];
  reqs: Record<string, PrdRequirement>;
  graded: Graded;
  logQuestions: Map<number | null, Question>;
  // The Glossary's retired words, and the terms in use now.
  retired: RetiredWord[];
  current: string[];
}

// An action, field or move in the data model files, with the feature that owns it.
interface DmRow {
  file: string;
  thing: string;
  kind: string;
  name: string;
  key: string;
  owner: string | null;
  gaps: string[];
  proposed: Proposed[];
}

// The data model, as the checks read it.
interface ModelView {
  model: DataModel;
  // The catalog's section 5, or null when the catalog has none.
  catalogDm: Row[] | null;
  dmThings: Things;
  // The things' names, longest first, so a thing whose name holds another's is found first.
  thingNames: string[];
  dmRows: DmRow[];
  partFile: Map<Part, DataModelFile>;
  // Every line of every rules table, for the checks that skip text copied word for word from the data model.
  dmTableLines: Set<string>;
}

interface FrdRequirement {
  id: string;
  title: string;
  text: string;
}

interface CoveredFeature {
  id: string;
  name: string;
  desc: string;
  reqs: string[];
  priority: string;
}

interface GateRow {
  key: string | undefined;
  cond: string;
  tied: string;
}

interface StandardAnswer {
  thing: string;
  question: string;
  answer: string;
}

// A "From" line in Data, and the rules table under it. at holds each table line's index in the FRD's lines.
interface DataBlock {
  name: string;
  link: string;
  table: string[];
  at: number[];
  closed?: boolean;
}

interface DataThing {
  thing: string;
  blocks: DataBlock[];
  stray: string[];
}

type RuleSource =
  | { kind: 'dw'; feature: string; n: number; piece: string }
  | { kind: 'dm'; thing: string; name: string; key: string }
  | { kind: 'req' }
  | { kind: 'proposed' }
  | { kind: 'decided'; decision: number }
  | { kind: 'invalid' };

interface Rule {
  feature: string;
  heading: string;
  id: string;
  text: string;
  source: string;
  note: string;
  noteFrom: string;
  noteDecision: number;
  noteDm: string;
  noteText: string;
  src: RuleSource;
}

interface PieceCoverage {
  dw: string;
  piece: string;
  byText: string;
  by: string[];
  question: number;
}

interface DmCoverage {
  thing: string;
  name: string;
  key: string;
  byText: string;
  by: string[];
  waits: string[];
}

interface FrdDecision {
  n: number;
  question: string;
  options: { label: string; rest: string }[];
  fields: Record<string, string>;
}

interface DataNote {
  thing: string;
  field: string;
  column: string;
  decision: number;
}

interface ExcludeItem {
  text: string;
  named: { id: string; name: string }[];
  link?: string;
  module?: string;
  sibling: boolean;
  bad?: boolean;
}

// The FRD, read into its parts.
interface Frd {
  text: string;
  lines: string[];
  crIndex: number;
  bodyLines: string[];
  body: string;
  sections: Record<string, string[]>;
  head: string[];
  h1: string;
  title: string;
  dependsOn: string[];
  excludes: string[];
  lastChanged: string;
  frdReqs: FrdRequirement[];
  covered: CoveredFeature[];
  gateRows: GateRow[];
  gates: Record<string, string>;
  sqRows: StandardAnswer[];
  dataThings: DataThing[];
  dataStray: string[];
  // The FRD's own text on each line of Data, by its index in lines. A line copied word for word from the data model
  // has none: each rules table's lines, and each "From" line, which names a data model file. A table line where a
  // decision at this gate changed a cell has only that cell, with its note. The Data check adds those lines. The
  // checks that skip text copied from the data model read the rest.
  dataOwn: Map<number, string>;
  rules: Rule[];
  ruleHeadings: RegExpMatchArray[];
  coverage: PieceCoverage[];
  dmCoverage: DmCoverage[];
  reqList: string[];
  dmList: string[];
  decList: string[];
  flow: string;
  flowSteps: string[];
  decisions: FrdDecision[];
}

// What this FRD covers, worked out from the FRD and the catalog.
interface Scope {
  inside: string[];
  // The actions, fields and moves this FRD's features own, in the data model files' order.
  owned: DmRow[];
  ownedThings: string[];
  capFeatures: string[];
  outsideDeps: string[];
  dependents: string[];
  decisionNumbers: number[];
  latest: FrdDecision | undefined;
  accepted: boolean;
  everAccepted: boolean;
}

interface FrdContext {
  project: string;
  opts: PathOptions;
  doc: LoadedDocument;
  sources: Sources;
  model: ModelView;
  frd: Frd;
  scope: Scope;
  // Filled in as the checks run: each rule the flow cites, and each cell of Data a decision at this gate changed.
  flowCites: string[];
  dataNotes: DataNote[];
}

export interface FrdCheckResult extends CheckResult {
  graded: Graded;
  notices: string[];
  // The Must answer questions still open that the FRD builds on.
  guard: OpenQuestion[];
}

// ---------------------------------------------------------------- small helpers

// A cell as one text, its items joined by <br> as the FRD writes them.
const cellWithBreaks = (c: Cell | null | undefined): string => (Array.isArray(c) ? c.join('<br>') : String(c || '')).trim();
const rowCells = (line: string): string[] => line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
const tableRows = (block: string[]): string[][] => block.filter((l) => l.startsWith('|')).slice(2).map(rowCells);
const idsIn = (s: string, re: RegExp): string[] => [...String(s).matchAll(re)].map((m) => m[0]);
const featureIds = (s: string): string[] => idsIn(s, /F-\d+(?![.\d])/g);
const requirementIds = (s: string): string[] => idsIn(s, /REQ-\d+\.\d+/g);
const ruleIds = (s: string): string[] => idsIn(s, /F-\d+\.\d+/g);
const sameSet = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
const dmKey = (thing: string, name: string): string => `${thing}, ${name}`;
const fileName = (c: Cell): string => cellWithBreaks(c).replace(/^\[([^\]]*)\]\([^)]*\)$/, '$1').replace(/`/g, '').trim();
const featureNumber = (fid: string): number => Number(fid.slice(2));
const blank = (s: string): string => ' '.repeat(s.length);
// A data model answer still open waits on a data model decision, DM-n, or a Glossary change, GC-n.
const waitsOn = (s: string): string[] => [...String(s).matchAll(/\bwaits on ((?:DM|GC)-\d+)/g)].map((m) => m[1]);

function firstDiff(a: string, b: string): string {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const cut = (s: string) => JSON.stringify(s.slice(Math.max(0, i - 25), i + 25));
  return `at character ${i}: FRD ${cut(a)}, source ${cut(b)}`;
}

function bulletLines(items: string[]): string {
  return items.length === 1 ? items[0] : items.map((x) => `• ${x}`).join('<br>');
}

// Runs one check's body. A body that throws keeps what it found so far, and says it could not run.
function runCheck(name: string, body: (findings: string[]) => void): Check {
  const findings: string[] = [];
  try {
    body(findings);
  } catch (e) {
    findings.push(`could not run: ${(e as Error).message}`);
  }
  return { name, findings };
}

// The standard questions, read from the FRD template, where they are written once.
function standardQuestions(): string[] {
  const lines = readText(TEMPLATE).split('\n');
  const start = lines.findIndex((l) => /^## Standard questions/.test(l));
  const out: string[] = [];
  for (let i = start + 1; start >= 0 && i < lines.length && !/^## /.test(lines[i]); i++) {
    const m = lines[i].match(/^\d+\. \*(.+)\*$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

// The banned "how" words, read from the Rules section of frd-author's conventions.
function howWords(): string[] | null {
  const m = readText(CONVENTIONS).match(/"how" word:\*\*([\s\S]*?)\. Rewrite/);
  return m ? m[1].split(',').map((w) => w.trim()).filter(Boolean) : null;
}

// ---------------------------------------------------------------- the sources

function readCatalog(catalogText: string): Pick<Sources, 'catalog' | 'moduleNames' | 'pieces'> {
  const catalog: Record<string, CatalogFeature> = {};
  const moduleNames: Record<number, string> = {};
  for (const r of (tableUnder(catalogText, 'Feature catalog') || []).filter((x) => 'Feature ID' in x)) {
    const mod = Number((r._heading.match(/^(\d+)\./) || [])[1]);
    moduleNames[mod] = r._heading.replace(/^\d+\.\s*/, '');
    catalog[cellWithBreaks(r['Feature ID'])] = {
      name: cellWithBreaks(r.Feature), desc: cellWithBreaks(r['Description (what it is)']), done: cellWithBreaks(r['Done when (observable)']),
      reqs: requirementIds(cellWithBreaks(r['Covers (source IDs)'])), priority: cellWithBreaks(r.Priority), deps: featureIds(cellWithBreaks(r['Depends on'])),
      capability: cellWithBreaks(r.Capability), module: mod,
    };
  }
  const pieces = (tableUnder(catalogText, '"Done when" pieces') || []).map((r) => ({ dw: cellWithBreaks(r['Piece ID']), piece: cellWithBreaks(r.Piece) }));
  return { catalog, moduleNames, pieces };
}

function readPrdRequirements(prdText: string): Record<string, PrdRequirement> {
  const reqs: Record<string, PrdRequirement> = {};
  for (const r of requirementsOf(prdText)) {
    const m = r.simple.match(/^\*\*(.+?)\*\* — (.+)$/);
    if (m) reqs[cellWithBreaks(r.ID)] = { title: m[1], text: m[2] };
  }
  return reqs;
}

// ---------------------------------------------------------------- the data model

// Who owns each action, field and move: the Sources section of frd-author's conventions. An action or a move
// belongs to the feature the catalog's section 5 gives it. Every field belongs to the feature that owns the thing's
// first action, the one that makes it.
function readModelView(model: DataModel, catalogText: string): ModelView {
  const catalogDm = tableUnder(catalogText, 'Data model coverage');
  const ownerOf = new Map<string, string>();
  for (const r of catalogDm || []) {
    const fids = list(r.Feature).map((x) => String(x).trim()).filter(Boolean);
    if (fids.length === 1) ownerOf.set(`${fileName(r['Data model file'])}, ${dmKey(cellWithBreaks(r.Thing), cellWithBreaks(r['Action or move']))}`, fids[0]);
  }
  const dmThings = things(model);
  const thingNames = [...dmThings.keys()].sort((a, b) => b.length - a.length);
  const firstActionOwner = (thing: string): string | null => {
    const first = (dmThings.get(thing) || { actions: [] }).actions[0];
    return first ? ownerOf.get(`${first._file}, ${dmKey(thing, cell(first.Action).text)}`) || null : null;
  };
  // Every action, field and move in the data model files, in the files' order, with the feature that owns it.
  const dmRows: DmRow[] = [];
  const partFile = new Map<Part, DataModelFile>();
  for (const f of model.files) {
    for (const part of f.parts) {
      partFile.set(part, f);
      for (const t of part.tables) {
        if (!(DM_KINDS as readonly string[]).includes(t.kind)) continue;
        for (const row of t.rows) {
          const name = t.kind === 'moves' ? moveName(row) : cell(t.kind === 'actions' ? row.Action : row.Field).text;
          const owner = t.kind === 'fields' ? firstActionOwner(part.thing) : ownerOf.get(`${f.name}, ${dmKey(part.thing, name)}`) || null;
          const cellsOf = Object.keys(row).filter((k) => !k.startsWith('_')).map((k) => cell(row[k]));
          // A row waits only on a DM-n or a GC-n. The data model raises no changes to the requirements.
          dmRows.push({
            file: f.name, thing: part.thing, kind: t.kind.replace(/s$/, ''), name, key: dmKey(part.thing, name), owner,
            gaps: [...new Set(cellsOf.flatMap((c) => c.gaps))].filter((g) => /^(?:DM|GC)-\d+$/.test(g)), proposed: cellsOf.flatMap((c) => c.proposed),
          });
        }
      }
    }
  }
  const dmTableLines = new Set<string>();
  for (const f of model.files) {
    for (const part of f.parts) {
      for (const t of part.tables) if (t.kind === 'fields') t.raw.split('\n').forEach((l) => dmTableLines.add(l.trim()));
    }
  }
  return { model, catalogDm, dmThings, thingNames, dmRows, partFile, dmTableLines };
}

const dmRowOf = (model: ModelView, key: string): DmRow | undefined => model.dmRows.find((r) => r.key === key);

// An action or a move whose row in the catalog's section 5 still shows "?", or waits on a change, has no feature
// yet. Then this says why, in words. A field has no row there. It belongs to the feature of its thing's first
// action, so that action's row says it. It is null when the row names a feature.
function noFeatureYet(model: ModelView, r: DmRow): string | null {
  const w = String(r.owner || '').match(/^waits on change (\d{3})$/);
  if (r.owner !== '?' && !w) return null;
  const says = w ? `waits on change ${w[1]}` : 'still shows "?"';
  if (r.kind !== 'field') return `Its row in section 5 of the Feature catalog ${says}.`;
  const first = cell(model.dmThings.get(r.thing)!.actions[0].Action).text;
  return `A field belongs to the feature of its thing's first action, ${first}. That action's row in section 5 of the Feature catalog ${says}.`;
}

function featureName(sources: Sources, fid: string | null): string {
  return fid ? `${fid}${sources.catalog[fid] ? ` ${sources.catalog[fid].name}` : ''}` : 'no feature';
}

// ---------------------------------------------------------------- the FRD

function readSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current = '_head';
  for (const line of lines) {
    const h = line.match(/^## (.+)$/);
    if (h) current = h[1];
    (sections[current] = sections[current] || []).push(line);
  }
  return sections;
}

function sectionOf(sections: Record<string, string[]>, name: string): string[] {
  return sections[Object.keys(sections).find((k) => k.startsWith(name))!] || [];
}

// The sub-bullets under a head line such as "- **Depends on:** ...", leaving out None.
function bulletsUnder(head: string[], label: string): string[] | null {
  const i = head.findIndex((l) => l.startsWith(`- **${label}:**`));
  if (i < 0) return null;
  const out: string[] = [];
  for (let j = i + 1; j < head.length && /^\s{2,}- /.test(head[j]); j++) out.push(head[j].replace(/^\s*- /, '').trim());
  return out.filter((x) => !/^None\.?$/.test(x));
}

// The list under a bold line such as "**From the requirement**", leaving out None.
function listUnder(block: string[], marker: string): string[] {
  const i = block.findIndex((l) => l.startsWith(marker));
  if (i < 0) return [];
  const out: string[] = [];
  for (let j = i + 1; j < block.length && /^- /.test(block[j]); j++) out.push(block[j].replace(/^- /, '').trim());
  return out.filter((x) => !/^None\.?$/.test(x));
}

// Data: a "### {Thing}" heading for each thing, then, for each data model file it comes from, a "From" line that
// links to the file, and the rules table copied from it. Each table line keeps its index in lines.
function readData(lines: string[], dmTableLines: Set<string>): Pick<Frd, 'dataThings' | 'dataStray' | 'dataOwn'> {
  const dataThings: DataThing[] = [];
  const dataStray: string[] = [];
  const dataOwn = new Map<number, string>();
  let current = '';
  let thing: DataThing | null = null;
  let block: DataBlock | null = null;
  lines.forEach((line, i) => {
    const s = line.match(/^## (.+)$/);
    if (s) { current = s[1]; return; }
    if (current !== 'Data') return;
    if ((/^\s*\|/.test(line) && dmTableLines.has(line.trim())) || /^From \[[^\]]+\]\([^)]+\)\.\s*$/.test(line)) dataOwn.set(i, '');
    const h = line.match(/^### (.+?)\s*$/);
    if (h) { thing = { thing: h[1], blocks: [], stray: [] }; dataThings.push(thing); block = null; return; }
    if (!line.trim()) { if (block && block.table.length) block.closed = true; return; }
    if (!thing) { dataStray.push(line.trim()); return; }
    const from = line.match(/^From \[([^\]]+)\]\(([^)]+)\)\.\s*$/);
    if (from) { block = { name: from[1], link: from[2], table: [], at: [] }; thing.blocks.push(block); return; }
    if (/^\s*\|/.test(line) && block && !block.closed) { block.table.push(line.trim()); block.at.push(i); return; }
    thing.stray.push(line.trim());
  });
  return { dataThings, dataStray, dataOwn };
}

// "{piece ID} — {piece}", "data model — {Thing}, {action, field or move}", "req — from the requirement",
// "proposed — Why: ..." or "decided — see Decision n".
function parseSource(s: string, thingNames: string[]): RuleSource {
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(F-\d+)\.dw(\d+) — (.+)$/))) return { kind: 'dw', feature: m[1], n: Number(m[2]), piece: m[3] };
  // The thing is found among the data model's things first, so a thing whose name holds a comma still reads.
  if ((m = s.match(/^data model — (.+)$/))) {
    const place = m[1];
    const thing = thingNames.find((t) => place.startsWith(`${t}, `)) || place.slice(0, Math.max(0, place.indexOf(', ')));
    const name = place.slice(thing.length + 2).trim();
    return thing && name ? { kind: 'dm', thing, name, key: dmKey(thing, name) } : { kind: 'invalid' };
  }
  if (s === 'req — from the requirement') return { kind: 'req' };
  if (/^proposed — Why: \S/.test(s)) return { kind: 'proposed' };
  if ((m = s.match(/^decided — see Decision (\d+)$/))) return { kind: 'decided', decision: Number(m[1]) };
  return { kind: 'invalid' };
}

function readRules(rulesSection: string[], thingNames: string[]): Rule[] {
  const rules: Rule[] = [];
  let feature: { id: string; heading: string } | null = null;
  for (const line of rulesSection) {
    const h = line.match(/^### (F-\d+) (.+)$/);
    if (h) { feature = { id: h[1], heading: h[2] }; continue; }
    if (feature && /^\| F-\d+\.\d+ \|/.test(line)) {
      const c = rowCells(line);
      const at = c[2].indexOf(NOTE);
      const source = at < 0 ? c[2] : c[2].slice(0, at);
      const noteRaw = at < 0 ? '' : c[2].slice(at + 4);
      const nm = noteRaw.match(/^\*Updated from the (requirement|data model) on the basis of (?:Decision (\d+)|(DM-\d+)): (.+)\.\*$/);
      rules.push({
        feature: feature.id, heading: feature.heading, id: c[0], text: c[1], source, note: noteRaw, noteFrom: nm ? nm[1] : '',
        noteDecision: nm && nm[2] ? Number(nm[2]) : 0, noteDm: nm && nm[3] ? nm[3] : '', noteText: nm ? nm[4] : '',
        src: parseSource(source, thingNames),
      });
    }
  }
  return rules;
}

function readDecisionRecord(block: string[]): FrdDecision[] {
  const decisions: FrdDecision[] = [];
  let dec: FrdDecision | null = null;
  for (const line of block) {
    const h = line.match(/^### Decision (\d+) — (.+)$/);
    if (h) { dec = { n: Number(h[1]), question: h[2], options: [], fields: {} }; decisions.push(dec); continue; }
    if (!dec) continue;
    const opt = line.match(/^\s{2,}- \*\*(.+?)\*\*(.*)$/);
    if (opt) { dec.options.push({ label: opt[1], rest: opt[2] }); continue; }
    const f = line.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (f) dec.fields[f[1]] = f[2].trim();
  }
  return decisions;
}

function readFrd(text: string, model: ModelView): Frd {
  const lines = text.split('\n');
  const crIndex = lines.findIndex((l) => l.startsWith('## Check record'));
  const bodyLines = crIndex >= 0 ? lines.slice(0, crIndex) : lines;
  const sections = readSections(lines);
  const section = (name: string) => sectionOf(sections, name);
  const head = sections._head;
  const h1 = lines.find((l) => l.startsWith('# ')) || '';
  const pieceSection = section('Coverage — every Done-when');
  const flow = section('Flow').join('\n');
  const gateRows = tableRows(section('Gates')).map((c) => ({ key: (c[0].match(/\*\*(.+?)\*\*/) || [])[1], cond: c[1], tied: c[2] || '' }));
  return {
    text,
    lines,
    crIndex,
    bodyLines,
    body: bodyLines.join('\n'),
    sections,
    head,
    h1,
    title: h1.replace(/^# /, ''),
    dependsOn: bulletsUnder(head, 'Depends on') || [],
    excludes: bulletsUnder(head, 'Excludes') || [],
    lastChanged: (head.find((l) => l.startsWith('- **Last changed:**')) || '').replace('- **Last changed:**', '').trim(),
    frdReqs: head.map((l) => l.match(/^- \*\*(REQ-\d+\.\d+) (.+?)\*\* — (.+)$/)).filter((m) => m !== null).map((m) => ({ id: m[1], title: m[2], text: m[3] })),
    covered: tableRows(section('Features covered')).map((c) => ({ id: c[0], name: c[1], desc: c[2], reqs: requirementIds(c[3]), priority: c[4] })),
    gateRows,
    gates: Object.fromEntries(gateRows.map((g) => [String(g.key), g.cond])),
    sqRows: tableRows(section('Standard questions')).map((c) => ({ thing: c[0], question: c[1], answer: c[2] || '' })),
    ...readData(lines, model.dmTableLines),
    rules: readRules(section('Rules'), model.thingNames),
    ruleHeadings: section('Rules').map((l) => l.match(/^### (F-\d+) (.+)$/)).filter((m) => m !== null),
    coverage: tableRows(pieceSection).map((c) => ({ dw: c[0], piece: c[1], byText: c[2] || '', by: ruleIds(c[2] || ''), question: Number(((c[2] || '').match(/^question (\d+)$/i) || [])[1]) || 0 })),
    dmCoverage: tableRows(section('Coverage — every data model')).map((c) => ({ thing: c[0], name: c[1] || '', key: dmKey(c[0], c[1] || ''), byText: c[2] || '', by: ruleIds(c[2] || ''), waits: waitsOn(c[2] || '') })),
    reqList: listUnder(pieceSection, '**From the requirement'),
    dmList: listUnder(pieceSection, '**From the data model'),
    decList: listUnder(pieceSection, '**From your decisions'),
    flow,
    flowSteps: flow.split('```').slice(2).join('```').split('\n'),
    decisions: readDecisionRecord(section('Decision record')),
  };
}

// The FRD's own text on a line: the line, unless Data copied it from the data model.
function ownText(frd: Frd, line: string, i: number): string {
  return frd.dataOwn.has(i) ? frd.dataOwn.get(i)! : line;
}

function readScope(project: string, opts: PathOptions, doc: LoadedDocument, sources: Sources, model: ModelView, frd: Frd): Scope {
  const { catalog } = sources;
  const inside = frd.covered.map((f) => f.id);
  const owned = model.dmRows.filter((r) => r.owner !== null && inside.includes(r.owner));
  const accepted = doc.status === 'accepted';
  return {
    inside,
    owned,
    ownedThings: [...new Set(owned.map((r) => r.thing))],
    capFeatures: Object.keys(catalog).filter((fid) => catalog[fid].capability === frd.title),
    outsideDeps: [...new Set(frd.covered.flatMap((f) => (catalog[f.id] || { deps: [] }).deps))].filter((d) => !inside.includes(d)),
    dependents: Object.keys(catalog).filter((fid) => !inside.includes(fid) && catalog[fid].deps.some((d) => inside.includes(d))),
    decisionNumbers: frd.decisions.map((d) => d.n),
    latest: frd.decisions[frd.decisions.length - 1],
    accepted,
    everAccepted: accepted || fs.existsSync(path.join(projectDir(project, opts), 'version-log', doc.rel.replace(/\.md$/, ''))),
  };
}

const decisionDate = (d: FrdDecision | undefined): string => ((d && d.fields['Decided by']) || '').match(/(\d{4}-\d{2}-\d{2})$/)?.[1] || '';

// ---------------------------------------------------------------- the checks: title, head and features

function capabilityCheck({ doc, frd, scope }: FrdContext): Check {
  return runCheck('Capability: the title, the file name, and the features the catalog gives it', (findings) => {
    const { title } = frd;
    const m = title.match(/^FRD-(\d+)([a-z]) (.+)$/);
    if (!m) {
      findings.push(`the title must read "# FRD-{section}{letter} {capability name}", found: ${frd.h1}`);
      return;
    }
    const want = `frd-${slug(m[3])}.md`;
    if (path.basename(doc.file) !== want) findings.push(`the file should be named ${want}, is ${path.basename(doc.file)}`);
    if (!scope.capFeatures.length) findings.push(`no feature in the Feature catalog names the capability "${title}"`);
    else if (!sameSet(scope.inside, scope.capFeatures)) findings.push(`the catalog gives "${title}" ${scope.capFeatures.join(', ')}; the FRD covers ${scope.inside.join(', ') || 'nothing'}`);
  });
}

function lastChangedCheck({ frd, scope }: FrdContext): Check {
  return runCheck('Last changed names the latest decision', (findings) => {
    const { latest } = scope;
    const want = latest ? `${decisionDate(latest)}, Decision ${latest.n}` : 'None yet.';
    if (!frd.head.some((l) => l.startsWith('- **Last changed:**'))) findings.push('missing the line "- **Last changed:** ..."');
    else if (frd.lastChanged !== want) findings.push(`reads "${frd.lastChanged}", should read "${want}"`);
  });
}

function featuresInSectionCheck({ sources, frd }: FrdContext): Check {
  return runCheck('Every covered feature sits in the FRD\'s section', (findings) => {
    const { catalog } = sources;
    const m = frd.title.match(/^FRD-(\d+)/);
    for (const f of frd.covered) {
      if (!catalog[f.id]) findings.push(`${f.id} is not in the catalog`);
      else if (m && catalog[f.id].module !== Number(m[1])) findings.push(`${f.id} is in section ${catalog[f.id].module}, not ${m[1]}`);
    }
  });
}

function featuresMatchCatalogCheck({ sources, frd }: FrdContext): Check {
  return runCheck('Features covered match the catalog', (findings) => {
    for (const f of frd.covered) {
      const c = sources.catalog[f.id];
      if (!c) continue;
      if (f.name !== c.name) findings.push(`${f.id} name ${firstDiff(f.name, c.name)}`);
      if (f.desc !== c.desc) findings.push(`${f.id} description ${firstDiff(f.desc, c.desc)}`);
      if (!sameSet(f.reqs, c.reqs)) findings.push(`${f.id} Req. ID is ${f.reqs.join(' and ')}, the catalog says ${c.reqs.join(' and ')}`);
      if (f.priority !== c.priority) findings.push(`${f.id} priority is ${f.priority}, the catalog says ${c.priority}`);
    }
  });
}

function requirementsListedCheck({ frd }: FrdContext): Check {
  return runCheck('Requirements listed are exactly those of the features covered', (findings) => {
    const want = [...new Set(frd.covered.flatMap((f) => f.reqs))];
    const got = frd.frdReqs.map((r) => r.id);
    if (!sameSet(want, got)) findings.push(`the features cover ${want.join(', ')}; Requirements lists ${got.join(', ')}`);
  });
}

function requirementTextCheck({ sources, frd }: FrdContext): Check {
  return runCheck('Requirement titles and text are the PRD\'s simple words, copied exactly', (findings) => {
    for (const r of frd.frdReqs) {
      const src = sources.reqs[r.id];
      if (!src) { findings.push(`${r.id} is not in the PRD`); continue; }
      if (r.title !== src.title) findings.push(`${r.id} title ${firstDiff(r.title, src.title)}`);
      if (r.text !== src.text) findings.push(`${r.id} text ${firstDiff(r.text, src.text)}`);
    }
  });
}

function dependsOnCheck({ sources, frd, scope }: FrdContext): Check {
  return runCheck('Depends on lists the outside features the catalog names', (findings) => {
    const { catalog } = sources;
    const got = frd.dependsOn.map((d) => d.match(/^(F-\d+) (.+)$/) || []);
    if (!sameSet(scope.outsideDeps, got.map((g) => g[1]).filter(Boolean))) findings.push(`the catalog says ${scope.outsideDeps.join(', ') || 'none'}; the FRD lists ${frd.dependsOn.join(', ') || 'none'}`);
    for (const [, fid, name] of got) if (catalog[fid] && name !== catalog[fid].name) findings.push(`${fid} is named "${name}", the catalog says "${catalog[fid].name}"`);
  });
}

// The catalog's other features in the FRD's own section, in feature-ID order.
function siblingsOf(sources: Sources, frd: Frd, scope: Scope): string[] {
  const { catalog } = sources;
  const section = Number((frd.title.match(/^FRD-(\d+)/) || [])[1]);
  return Object.keys(catalog).filter((fid) => catalog[fid].module === section && !scope.inside.includes(fid)).sort((a, b) => featureNumber(a) - featureNumber(b));
}

function readExcludes(excludes: string[], siblings: string[]): ExcludeItem[] {
  return excludes.map((t) => {
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(F-\d+) (.+?)(?:, linked by (REQ-\d+\.\d+))?$/))) return { text: t, named: [{ id: m[1], name: m[2] }], link: m[3], sibling: siblings.includes(m[1]) && !m[3] };
    if ((m = t.match(/^(.+) module, linked by (REQ-\d+\.\d+)$/))) return { text: t, module: m[1], named: [], link: m[2], sibling: false };
    return { text: t, named: [], bad: true, sibling: false };
  });
}

function excludesCheck({ sources, frd }: FrdContext, siblings: string[], items: ExcludeItem[]): Check {
  return runCheck('Excludes lists every sibling feature, then only requirement-linked neighbours', (findings) => {
    const { catalog } = sources;
    for (const i of items) {
      if (i.bad) findings.push(`must read "F-xx {catalog name}", "F-xx {catalog name}, linked by REQ-x.y" or "{Section} module, linked by REQ-x.y": ${i.text}`);
      if (i.module && !Object.values(sources.moduleNames).includes(i.module)) findings.push(`"${i.module}" is not a section of the catalog: ${i.text}`);
      if (i.named.length && siblings.includes(i.named[0].id) && i.link) findings.push(`a feature of the same section is listed plainly, without "linked by": ${i.text}`);
    }
    for (const s of siblings) if (!items.some((i) => i.sibling && i.named[0].id === s)) findings.push(`missing sibling: ${s} ${catalog[s].name}`);
    const sibOrder = items.filter((i) => i.sibling).map((i) => i.named[0].id);
    if (sibOrder.join() !== [...sibOrder].sort((a, b) => featureNumber(a) - featureNumber(b)).join()) findings.push(`siblings are not in feature-ID order: ${sibOrder.join(', ')}`);
    const firstLinked = items.findIndex((i) => !i.sibling);
    if (firstLinked >= 0 && items.slice(firstLinked).some((i) => i.sibling)) findings.push('siblings must all come before the requirement-linked items');
    for (const i of items) {
      if (!i.bad && !i.sibling && !i.link) findings.push(`not a feature of the same section, so it must end ", linked by REQ-x.y": ${i.text}`);
      if (i.link && !frd.frdReqs.some((r) => r.id === i.link)) findings.push(`${i.link} is not one of this FRD's own requirements: ${i.text}`);
      for (const n of i.named) if (catalog[n.id] && n.name !== catalog[n.id].name) findings.push(`${n.id} is named "${n.name}", the catalog says "${catalog[n.id].name}"`);
    }
  });
}

// ---------------------------------------------------------------- the checks: rules and their sources

function ruleSubsectionsCheck({ sources, frd, scope }: FrdContext): Check {
  return runCheck('One Rules subsection per covered feature, named as in the catalog', (findings) => {
    const { catalog } = sources;
    if (!sameSet(frd.ruleHeadings.map((h) => h[1]), scope.inside)) findings.push(`subsections: ${frd.ruleHeadings.map((h) => h[1]).join(', ')}; features covered: ${scope.inside.join(', ')}`);
    for (const [, fid, name] of frd.ruleHeadings) if (catalog[fid] && name !== catalog[fid].name) findings.push(`### ${fid} reads "${name}", the catalog says "${catalog[fid].name}"`);
  });
}

function ruleNumbersCheck({ frd }: FrdContext): Check {
  return runCheck('Rule IDs are numbered from 1 with no gaps', (findings) => {
    for (const [, fid] of frd.ruleHeadings) {
      const nums = frd.rules.filter((r) => r.feature === fid).map((r) => r.id);
      const want = nums.map((_, i) => `${fid}.${i + 1}`);
      if (nums.join() !== want.join()) findings.push(`${fid}: ${nums.join(', ')} (expected ${want.join(', ')})`);
    }
  });
}

function ruleOrderCheck({ frd, scope }: FrdContext): Check {
  return runCheck('Rules are numbered in source order until the FRD is first accepted', (findings) => {
    if (scope.everAccepted) return;
    const { owned } = scope;
    // Pieces first, then data model rules in the order of the data model coverage table, then req, then the rest.
    const dmAt = (key: string) => { const i = owned.findIndex((x) => x.key === key); return i < 0 ? owned.length : i; };
    const rank = (r: Rule) => (r.src.kind === 'dw' ? r.src.n : r.src.kind === 'dm' ? 1000 + dmAt(r.src.key) : r.src.kind === 'req' ? 100000 : 200000);
    const label = (r: Rule) => (r.src.kind === 'dw' ? `dw${r.src.n}` : r.src.kind === 'dm' ? `data model, ${r.src.key}` : r.src.kind);
    for (const [, fid] of frd.ruleHeadings) {
      const own = frd.rules.filter((r) => r.feature === fid);
      for (let i = 1; i < own.length; i++) if (rank(own[i]) < rank(own[i - 1])) findings.push(`${own[i].id} (${label(own[i])}) comes after ${own[i - 1].id} (${label(own[i - 1])})`);
    }
  });
}

function ruleSourceCheck({ frd }: FrdContext): Check {
  return runCheck('Every rule cites exactly one allowed source', (findings) => {
    for (const r of frd.rules) {
      if (r.src.kind === 'invalid') findings.push(`${r.id}: "${r.source}"`);
      else if (r.src.kind === 'dw' && r.src.feature !== r.feature) findings.push(`${r.id} cites a piece of ${r.src.feature}`);
      if (r.note && !r.noteDecision && !r.noteDm) findings.push(`${r.id}: the note must read "*Updated from the requirement on the basis of Decision n: {what changed}.*". For a data model decision, it names DM-n. For a data model answer that a decision at this gate changed, it reads "*Updated from the data model on the basis of Decision n: {what changed}.*"`);
    }
  });
}

function decidedRuleNoteCheck({ frd }: FrdContext): Check {
  return runCheck('Every decided rule carries a note naming its own decision', (findings) => {
    for (const r of frd.rules) {
      if (r.src.kind !== 'decided') continue;
      if (!r.noteDecision) findings.push(r.noteDm ? `${r.id} is decided by Decision ${r.src.decision}, but its note names ${r.noteDm}` : `${r.id} is decided by Decision ${r.src.decision} but has no note`);
      else if (r.noteDecision !== r.src.decision) findings.push(`${r.id} is decided by Decision ${r.src.decision}, but its note names Decision ${r.noteDecision}`);
    }
  });
}

function piecesMatchCatalogCheck({ frd }: FrdContext, catPieces: CatalogPiece[]): Check {
  return runCheck('The pieces are the catalog\'s, exactly', (findings) => {
    const want = catPieces.map((p) => `${p.dw} ${p.piece}`);
    const got = frd.coverage.map((x) => `${x.dw} ${x.piece}`);
    for (const w of want) if (!got.includes(w)) findings.push(`the catalog's piece ${w.split(' ')[0]} isn't in Coverage as the catalog has it: "${w.slice(w.indexOf(' ') + 1)}"`);
    for (const g of got) if (!want.includes(g)) findings.push(`Coverage lists ${g.split(' ')[0]}, "${g.slice(g.indexOf(' ') + 1)}", which isn't a piece of a covered feature in the catalog`);
  });
}

function pieceQuotesCheck({ frd }: FrdContext, catPieces: CatalogPiece[]): Check {
  return runCheck('Rules quote each piece exactly as the catalog lists it', (findings) => {
    const split = Object.fromEntries(catPieces.map((p) => [p.dw, p.piece]));
    for (const r of frd.rules) {
      if (r.src.kind !== 'dw') continue;
      const dw = `${r.src.feature}.dw${r.src.n}`;
      if (!(dw in split)) findings.push(`${r.id} cites ${dw}, which is not one of the catalog's pieces`);
      else if (r.src.piece !== split[dw]) findings.push(`${r.id} quotes ${dw} ${firstDiff(r.src.piece, split[dw])}`);
    }
  });
}

function provedByCheck({ sources, frd }: FrdContext): Check {
  return runCheck('Proved by matches the Rules table, and every piece has a rule or an open question', (findings) => {
    const want: Record<string, string[]> = {};
    for (const r of frd.rules) if (r.src.kind === 'dw') (want[`${r.src.feature}.dw${r.src.n}`] = want[`${r.src.feature}.dw${r.src.n}`] || []).push(r.id);
    for (const x of frd.coverage) {
      const w = want[x.dw] || [];
      if (x.question) {
        const q = sources.logQuestions.get(x.question);
        if (!q) findings.push(`${x.dw}: Proved by names question ${x.question}, which isn't in the Question log`);
        else if (q.group === 'Answered') findings.push(`${x.dw}: question ${x.question} is answered, so a rule must prove this piece now`);
        if (w.length) findings.push(`${x.dw}: Proved by names question ${x.question}, but rules prove it: ${w.join(', ')}`);
      } else if (!w.length) findings.push(`${x.dw} has no rule`);
      else if (!sameSet(x.by, w)) findings.push(`${x.dw}: Proved by says ${x.by.join(', ') || 'nothing'}, the rules say ${w.join(', ')}`);
    }
  });
}

// ---------------------------------------------------------------- the checks: the data model

function dmCoverageTableCheck({ sources, model, frd, scope }: FrdContext): Check {
  return runCheck('Data model coverage lists exactly the actions, fields and moves the covered features own, named as the data model names them', (findings) => {
    if (model.catalogDm === null) {
      findings.push('the Feature catalog has no "Data model coverage" section, so no action or move has a feature yet');
      return;
    }
    const count = (keys: string[]) => keys.reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map<string, number>());
    const need = count(scope.owned.map((r) => r.key));
    const have = count(frd.dmCoverage.map((x) => x.key));
    for (const r of scope.owned) {
      if (!have.has(r.key)) findings.push(`${r.key}: this ${r.kind} belongs to ${featureName(sources, r.owner)}, but the table has no row for it`);
    }
    for (const [key, n] of have) {
      if (need.has(key)) { if (n !== need.get(key)) findings.push(`${key} has ${n} rows. It needs ${need.get(key) === 1 ? 'exactly one' : need.get(key)}.`); continue; }
      const known = dmRowOf(model, key);
      const why = known && noFeatureYet(model, known);
      if (why) findings.push(`${key} has no feature yet. ${why} So this FRD can't list it yet.`);
      else if (known) findings.push(`${key} belongs to ${featureName(sources, known.owner)}, which this FRD doesn't cover`);
      else findings.push(`${key} isn't an action, field or move in the data model files, word for word`);
    }
    // The rows follow the data model files' order. Each one is placed by its first row.
    const order = [...new Set(frd.dmCoverage.map((x) => x.key).filter((k) => need.has(k)))];
    const expected = [...need.keys()].filter((k) => have.has(k));
    const at = order.findIndex((k, i) => k !== expected[i]);
    if (at >= 0) findings.push(`the rows aren't in the data model files' order: "${order[at]}" comes where "${expected[at]}" should`);
  });
}

function dmRowsHaveRulesCheck({ model, frd }: FrdContext): Check {
  return runCheck('Every data model row has a rule, or waits on its open decision', (findings) => {
    for (const x of frd.dmCoverage) {
      const known = dmRowOf(model, x.key);
      if (!known) continue;
      const want = frd.rules.filter((r) => r.src.kind === 'dm' && r.src.key === x.key).map((r) => r.id);
      for (const w of x.waits) if (!known.gaps.includes(w)) findings.push(`${x.key}: Proved by waits on ${w}, but no cell of its row in ${known.file} reads "? (${w})"`);
      if (!want.length) {
        if (x.by.length) findings.push(`${x.key}: Proved by names ${x.by.join(', ')}, but no rule's source names ${x.key}`);
        else if (!x.waits.length) findings.push(`${x.key} has no rule${known.gaps.length ? `. Its row in ${known.file} waits on ${known.gaps.join(' and ')}, so Proved by reads "waits on" and that ID.` : ''}`);
        continue;
      }
      if (!sameSet(x.by, want)) findings.push(`${x.key}: Proved by says ${x.by.join(', ') || 'nothing'}, the rules say ${want.join(', ')}`);
      // An answer still to be confirmed keeps its mark and its question in the rule that comes from it.
      for (const p of known.proposed) {
        const mark = `Proposed (needs confirmation), question ${p.question}`;
        if (!frd.rules.some((r) => want.includes(r.id) && r.text.includes(mark))) findings.push(`${x.key}: its row in ${known.file} holds "${p.answer}, ${mark}". The rule from it keeps "${mark}".`);
      }
    }
  });
}

function dmRulesCheck({ sources, model, frd }: FrdContext): Check {
  return runCheck('Every data model rule is in the coverage table, and names a thing and an action, field or move of a row it proves', (findings) => {
    for (const r of frd.rules) {
      if (r.src.kind !== 'dm') continue;
      const known = dmRowOf(model, r.src.key);
      if (!known) { findings.push(`${r.id} names "${r.src.key}", which isn't an action, field or move in the data model files, word for word`); continue; }
      const why = noFeatureYet(model, known);
      if (why) findings.push(`${r.id} proves ${r.src.key}, which has no feature yet. ${why} So no rule can prove it yet.`);
      else if (known.owner !== r.feature) findings.push(`${r.id} proves ${r.src.key}, which belongs to ${featureName(sources, known.owner)}, not ${r.feature}`);
      const key = r.src.key;
      if (!frd.dmCoverage.some((x) => x.key === key)) findings.push(`${r.id} proves ${r.src.key}, which has no row in the data model coverage table`);
    }
  });
}

// "From the requirement", "From the data model" and "From your decisions" each list exactly the rules of their kinds.
function ruleListCheck(name: string, listed: string[], rules: Rule[], kinds: readonly RuleSource['kind'][], what: string): Check {
  return runCheck(name, (findings) => {
    const want = rules.filter((r) => kinds.includes(r.src.kind)).map((r) => r.id);
    if (!sameSet(listed, want)) findings.push(`the list: ${listed.join(', ') || 'none'}; ${what}: ${want.join(', ') || 'none'}`);
  });
}

function nothingUndecidedCheck({ frd, scope }: FrdContext): Check {
  return runCheck('Once the FRD is accepted, nothing is left undecided', (findings) => {
    if (!scope.accepted) return;
    const open = frd.rules.filter((r) => r.src.kind === 'proposed').map((r) => r.id);
    if (open.length) findings.push(`suggested rules still waiting for a decision: ${open.join(', ')}`);
  });
}

function howWordsCheck({ frd }: FrdContext): Check {
  return runCheck('No banned "how" words in rules', (findings) => {
    const words = howWords();
    if (!words) {
      findings.push('could not read the banned-word list from the Rules section of frd-author\'s conventions');
      return;
    }
    for (const r of frd.rules) for (const w of words) if (new RegExp(`\\b${escapeRegExp(w)}s?\\b`, 'i').test(r.text.replace(/<br>/g, ' '))) findings.push(`${r.id} contains "${w}"`);
  });
}

// ---------------------------------------------------------------- the checks: gates and flow

function gatesTiedCheck({ sources, frd, scope }: FrdContext): Check {
  return runCheck('Gates are tied to the features the catalog\'s Depends on gives', (findings) => {
    const want: Record<string, string[]> = { In: scope.outsideDeps, Out: scope.dependents };
    for (const g of frd.gateRows) {
      const gids = featureIds(g.tied);
      // Each feature's name is read from its ID, so a catalog name with a comma in it, such as "Add, remove and
      // reorder", still matches.
      for (const m of g.tied.matchAll(/(F-\d+) /g)) {
        const c = sources.catalog[m[1]];
        const rest = g.tied.slice(m.index + m[0].length);
        if (!c || new RegExp(`^${escapeRegExp(c.name)}(?= \\(|,|<br>|\\s*$)`).test(rest)) continue;
        const named = (rest.match(/^.*?(?= \(|<br>|, *(?:• *)?F-\d|\s*$)/) || [rest])[0].trim();
        findings.push(`${g.key}: ${m[1]} is named "${named}", the catalog says "${c.name}"`);
      }
      if (/TBD/.test(g.tied)) findings.push(`${g.key}: "Tied to" is never TBD; write the catalog's features, or None.`);
      if (g.key !== undefined && g.key in want) {
        const w = want[g.key];
        if (!w.length && g.tied !== 'None.') findings.push(`${g.key}: the catalog shows no feature, so "Tied to" must be None. (found "${g.tied}")`);
        else if (w.length && !sameSet(gids, w)) findings.push(`${g.key}: tied to ${gids.join(', ') || 'nothing'}; the catalog gives ${w.join(', ')}`);
      } else if (g.tied !== 'None.' && !gids.every((fid) => scope.inside.includes(fid))) findings.push(`${g.key}: must be a covered feature, or None. (found "${g.tied}")`);
    }
  });
}

function gateConditionsCheck({ sources, frd, scope }: FrdContext): Check {
  return runCheck('Gate conditions copied from the catalog match it word for word', (findings) => {
    const { catalog } = sources;
    const wantIn = scope.outsideDeps.length ? bulletLines(scope.outsideDeps.map((d) => catalog[d].done)) : 'None.';
    if (frd.gates.In !== wantIn) findings.push(`In ${firstDiff(frd.gates.In || '', wantIn)}`);
    const out = frd.gateRows.find((g) => g.key === 'Out');
    if (out && out.tied === 'None.') {
      const wantOut = bulletLines(frd.covered.map((f) => (catalog[f.id] ? catalog[f.id].done : '')));
      if (out.cond !== wantOut) findings.push(`Out: nothing depends on this capability, so the condition is its own "Done when", ${firstDiff(out.cond, wantOut)}`);
    }
    const undone = frd.gateRows.find((g) => g.key === 'Undone if');
    if (undone && undone.tied === 'None.' && undone.cond !== 'None.') findings.push('Undone if: "Tied to" is None., so the condition must be None. too');
  });
}

function entryExitCheck({ frd }: FrdContext): Check {
  return runCheck('Entry and Exit repeat the Gates conditions word for word', (findings) => {
    const { flow, gates } = frd;
    const pairs: [string, string | undefined, string | undefined][] = [
      ['the Entry line', (flow.match(/\*\*Entry:\*\* (.+?) \*\(Gate in\)\*/) || [])[1], gates.In],
      ['the ENTRY box', (flow.match(/ENTRY: ([^"\]]+)/) || [])[1], gates.In],
      ['the Exit line', (flow.match(/\*\*Exit:\*\* (.+?) \*\(Gate out\)\*/) || [])[1], gates.Out],
      ['the EXIT box', (flow.match(/EXIT: ([^"\]]+)/) || [])[1], gates.Out],
    ];
    for (const [name, got, want] of pairs) {
      if (got === undefined) findings.push(`${name} not found`);
      else if (got.trim() !== want) findings.push(`${name} ${firstDiff(got.trim(), want || '')}`);
    }
  });
}

function flowStepsCheck({ frd, flowCites }: FrdContext): Check {
  return runCheck('Each flow step cites exactly one existing rule', (findings) => {
    const known = frd.rules.map((r) => r.id);
    for (const line of frd.flowSteps) {
      if (/\(Gate (in|out)\)/.test(line) || !line.trim()) continue;
      const isStep = /^\d+\. /.test(line) || /^- \*Alternate/.test(line);
      const cites = [...line.matchAll(/\*\(([^)]*)\)\*/g)].map((m) => m[1]);
      if (isStep && cites.length !== 1) findings.push(`the step cites ${cites.length} rules: ${line.trim()}`);
      for (const c of cites) {
        flowCites.push(c);
        if (!/^F-\d+\.\d+$/.test(c)) findings.push(`"${c}" is not exactly one rule: ${line.trim()}`);
        else if (!known.includes(c)) findings.push(`${c} is not a rule in this FRD`);
      }
    }
  });
}

function rulesInFlowCheck({ frd, flowCites }: FrdContext): Check {
  return runCheck('Every rule appears in the flow at least once', (findings) => {
    for (const r of frd.rules) if (!flowCites.includes(r.id)) findings.push(`${r.id} is not in the flow`);
  });
}

// ---------------------------------------------------------------- the checks: Data

const cutText = (s: string): string => (s.length > 60 ? `${s.slice(0, 59)}…` : s);
const strayLines = (lines: string[]): string => `${plural(lines.length, 'line')}, from "${cutText(lines[0])}"`;

// The things in Data are the things of the coverage table, in its order, each starting with its heading.
function dataThingsFindings(frd: Frd, ownedThings: string[], findings: string[]): void {
  const got = frd.dataThings.map((d) => d.thing);
  if (frd.dataStray.length) findings.push(`${strayLines(frd.dataStray)}, come before the first thing's heading. Each thing in Data starts with a "###" heading that names it.`);
  for (const t of ownedThings) if (!got.includes(t)) findings.push(`${t} is in the data model coverage table, but Data has no "### ${t}"`);
  for (const t of got) if (!ownedThings.includes(t)) findings.push(`"### ${t}" isn't a thing in the data model coverage table`);
  const order = got.filter((t) => ownedThings.includes(t));
  const expected = ownedThings.filter((t) => got.includes(t));
  const at = order.findIndex((t, i) => t !== expected[i]);
  if (at >= 0) findings.push(`the things aren't in the order of the data model coverage table: ${order[at]} comes where ${expected[at]} should`);
}

// One copied rules table, line by line. A cell a decision at this gate changed is kept as the FRD's own text, and
// its note is listed.
function compareDataTable(ctx: FrdContext, thing: string, file: DataModelFile, block: DataBlock, wantRaw: string[], findings: string[]): void {
  const columns = rowCells(wantRaw[0] || '');
  const notCopied = `${thing}: the rules table from ${file.name} isn't copied word for word.`;
  for (let j = 0; j < Math.max(wantRaw.length, block.table.length); j++) {
    const gotRow = block.table[j];
    const wantRow = wantRaw[j];
    if (gotRow === wantRow) continue;
    const g = gotRow === undefined ? [] : rowCells(gotRow);
    const wc = wantRow === undefined ? [] : rowCells(wantRow);
    // The heading, its line of dashes, a line added or left out, or a row with more or fewer cells: no decision
    // explains it, so the first such line is the finding.
    if (j < 2 || gotRow === undefined || wantRow === undefined || g.length !== wc.length) {
      findings.push(`${notCopied} At its line ${j + 1}, ${firstDiff(gotRow || '', wantRow || '')}`);
      break;
    }
    const own: string[] = [];
    g.forEach((c, k) => {
      if (c === wc[k]) return;
      own.push(c);
      const where = `in the row for ${wc[0]}, "${columns[k] || `column ${k + 1}`}"`;
      const m = c.match(DATA_NOTE);
      if (!m) findings.push(`${notCopied} At its line ${j + 1}, ${where} reads "${c}", and the data model says "${wc[k]}". A cell that a decision at this gate changed ends with a note that names the decision: "*Updated from the data model on the basis of Decision n: {what changed}.*"`);
      else if (c.slice(0, m.index) === wc[k]) findings.push(`${thing}: at line ${j + 1} of the rules table from ${file.name}, ${where} has a note, but its answer is the data model's. A note goes only where a decision changed the answer.`);
      else ctx.dataNotes.push({ thing, field: wc[0], column: columns[k] || `column ${k + 1}`, decision: Number(m[1]) });
    });
    ctx.frd.dataOwn.set(block.at[j], own.join(' | '));
  }
}

function dataCopiesCheck(ctx: FrdContext): Check {
  return runCheck('Data copies each thing\'s rules table word for word, under a link to its file, except a cell a decision changed', (findings) => {
    const { doc, model, frd, scope } = ctx;
    dataThingsFindings(frd, scope.ownedThings, findings);
    for (const d of frd.dataThings) {
      const t = model.dmThings.get(d.thing);
      if (!t || !scope.ownedThings.includes(d.thing)) continue;
      if (d.stray.length) findings.push(`${d.thing}: ${strayLines(d.stray)}, aren't a copy of the data model. Data holds only a "From" line and its rules table, for each file.`);
      // Its own part's rules table first, then each "Adds to" part's, in the files' order.
      let want = t.parts.filter((p) => p.tables.some((x) => x.kind === 'fields')).map((p) => ({ part: p, table: p.tables.find((x) => x.kind === 'fields') || null }));
      if (!want.length) want = t.parts.slice(0, 1).map((p) => ({ part: p, table: null }));
      if (d.blocks.length !== want.length) findings.push(`${d.thing}: Data has ${d.blocks.length} "From" lines. The data model gives it ${want.length}: ${want.map((w) => model.partFile.get(w.part)!.name).join(' and ')}.`);
      want.forEach((w, i) => {
        const b = d.blocks[i];
        if (!b) return;
        const f = model.partFile.get(w.part)!;
        const wantLine = `From [${f.name}](${path.posix.relative(path.posix.dirname(doc.rel), f.rel)}).`;
        const gotLine = `From [${b.name}](${b.link}).`;
        if (gotLine !== wantLine) findings.push(`${d.thing}: the line reads "${gotLine}", and should read "${wantLine}"`);
        const wantRaw = w.table ? w.table.raw.split('\n').map((l) => l.trim()) : [];
        compareDataTable(ctx, d.thing, f, b, wantRaw, findings);
      });
    }
  });
}

function dataModelNotesCheck({ frd, scope, dataNotes }: FrdContext): Check {
  return runCheck('A difference from the data model has a note that names a decision in the Decision record', (findings) => {
    for (const r of frd.rules.filter((x) => x.noteFrom === 'data model')) {
      if (r.src.kind !== 'dm') findings.push(`${r.id}: only a data model rule has a note "Updated from the data model". Its source is "${r.source}".`);
      if (r.noteDm) findings.push(`${r.id}: its note names ${r.noteDm}, a data model decision, which the data model already follows. A note "Updated from the data model" names a decision at this gate, as Decision n.`);
      else if (!scope.decisionNumbers.includes(r.noteDecision)) findings.push(`${r.id}: its note names Decision ${r.noteDecision}, which isn't in the Decision record`);
    }
    for (const n of dataNotes) if (!scope.decisionNumbers.includes(n.decision)) findings.push(`${n.thing}, in Data: in the row for ${n.field}, the note in "${n.column}" names Decision ${n.decision}, which isn't in the Decision record`);
  });
}

// ---------------------------------------------------------------- the checks: standard questions and decisions

// "{family}.md, {Thing} {action, field or move}": an answer in a data model file. A place in a data model file that
// is no thing's action, field or move comes back with missing.
type DmPlace = DmRow | { file: string; missing: string };

function dmPlaceOf(model: ModelView, place: string): DmPlace | null {
  const m = place.match(/^(\S+\.md), (.+)$/);
  if (!m || !new Set(model.model.files.map((f) => f.name)).has(m[1])) return null;
  return model.dmRows.find((r) => r.file === m[1] && `${r.thing} ${r.name}` === m[2]) || { file: m[1], missing: m[2] };
}

// One answer of the form "{place} -> {target}": a data model answer, waiting on its gap, or proved elsewhere.
function placeAnswerFindings(ctx: FrdContext, where: string, place: string, target: string, ruleExists: (s: string) => boolean, findings: string[]): void {
  const { sources, model, scope } = ctx;
  const at = dmPlaceOf(model, place);
  let w: RegExpMatchArray | null;
  if (at && 'missing' in at) findings.push(`${where}: "${at.missing}" isn't a thing and its action, field or move in ${at.file}, word for word`);
  else if ((w = target.match(/^waits on ((?:DM|GC)-\d+)$/))) {
    if (!at) findings.push(`${where}: "waits on" answers only for a data model answer, such as "lending.md, Loan Browse -> waits on DM-5"`);
    else if (!at.gaps.includes(w[1])) findings.push(`${where}: no cell of ${at.key} in ${at.file} reads "? (${w[1]})"`);
  } else if ((w = target.match(/^(F-\d+) (.+)$/))) {
    if (!at) findings.push(`${where}: a feature in another FRD answers only for a data model answer, such as "lending.md, Loan book -> F-01 Borrow a book"`);
    else if (scope.inside.includes(w[1])) findings.push(`${where}: ${w[1]} is in this FRD, so name the rules that prove ${at.key}`);
    else if (noFeatureYet(model, at)) findings.push(`${where}: ${at.key} has no feature yet. ${noFeatureYet(model, at)} So the answer can't name a feature yet.`);
    else if (at.owner !== w[1]) findings.push(`${where}: ${at.key} belongs to ${featureName(sources, at.owner)}, not ${w[1]}`);
    else if (sources.catalog[w[1]] && w[2] !== sources.catalog[w[1]].name) findings.push(`${where}: ${w[1]} is named "${w[2]}", the catalog says "${sources.catalog[w[1]].name}"`);
  } else if (!ruleExists(target)) findings.push(`${where}: names a rule that is not in the Rules table`);
}

function standardQuestionsCheck(ctx: FrdContext, std: string[]): Check {
  return runCheck('Every thing in Data has every standard question, each answered in an allowed way', (findings) => {
    const { sources, frd, scope } = ctx;
    if (!std.length) {
      findings.push('could not read the standard questions from the FRD template');
      return;
    }
    const dataThings = frd.dataThings.map((d) => d.thing);
    for (const row of frd.sqRows) if (!dataThings.includes(row.thing)) findings.push(`"${row.thing}" is not a thing in the Data section`);
    for (const t of dataThings) {
      const got = frd.sqRows.filter((r) => r.thing === t).map((r) => r.question);
      if (got.join('|') !== std.join('|')) findings.push(`${t}: the questions must be the ${std.length} standard questions, word for word, in order`);
    }
    const ruleExists = (s: string) => { const found = ruleIds(s); return found.length > 0 && found.every((rid) => frd.rules.some((r) => r.id === rid)); };
    for (const row of frd.sqRows) {
      const a = row.answer;
      const where = `${row.thing}, "${row.question}"`;
      let m: RegExpMatchArray | null;
      if ((m = a.match(/^Decision (\d+)\s(?:->|→)\sno rule$/))) { if (!scope.decisionNumbers.includes(Number(m[1]))) findings.push(`${where}: there is no Decision ${m[1]}`); }
      else if ((m = a.match(/^Decision (\d+)\s(?:->|→)\s(.+)$/))) {
        if (!scope.decisionNumbers.includes(Number(m[1]))) findings.push(`${where}: there is no Decision ${m[1]}`);
        if (!ruleExists(m[2])) findings.push(`${where}: names a rule that is not in the Rules table`);
      } else if ((m = a.match(/^question (\d+)$/i))) {
        const q = sources.logQuestions.get(Number(m[1]));
        if (!q) findings.push(`${where}: question ${m[1]} isn't in the Question log`);
      } else if (/^Does not apply — \S/.test(a)) {
        // the reader checks that a document rules it out
      } else if ((m = a.match(/^(.+, .+)\s(?:->|→)\s(.+)$/))) {
        // The place, then the last arrow. A move in the place keeps its own arrow.
        placeAnswerFindings(ctx, where, m[1], m[2], ruleExists, findings);
      } else findings.push(`${where}: "${a}" is not one of the allowed answer forms`);
    }
  });
}

// The lines a section holds below its heading, leaving out blank lines and lines in italics.
const sectionBody = (frd: Frd, name: string): string[] => sectionOf(frd.sections, name).slice(1).filter((l) => l.trim() && !/^\*[^*]/.test(l));

function decisionEntryFindings(d: FrdDecision, findings: string[]): void {
  const where = `Decision ${d.n}`;
  if (d.fields['Asked at'] !== GATE) findings.push(`${where}: "Asked at" must be "${GATE}"`);
  if (!/^(None|\d+(, \d+)*)$/.test(d.fields.Question || '')) findings.push(`${where}: "Question" must be its number in the Question log, or None`);
  const real = d.options.filter((o) => o.label !== 'I don\'t know yet');
  if (real.length < 2) findings.push(`${where}: at least two real options must be recorded (found ${real.length})`);
  for (const o of real) {
    if (o.label.startsWith('Other: ')) continue;
    if (!/ — Why: .+\. What happens next: .+/.test(o.rest)) findings.push(`${where}: option "${o.label}" needs "— Why: ... What happens next: ..."`);
  }
  const labels = d.options.map((o) => o.label);
  if (!labels.includes(d.fields.Chosen)) findings.push(`${where}: "Chosen" (${d.fields.Chosen || 'missing'}) must be exactly one of the options offered`);
  if (d.fields.Recommended !== 'None' && !labels.includes(d.fields.Recommended)) findings.push(`${where}: "Recommended" (${d.fields.Recommended || 'missing'}) must be one of the options offered, or None`);
  if (d.fields.Chosen === 'I don\'t know yet' && !d.fields['Answer in use for now']) findings.push(`${where}: "I don't know yet" was chosen, so it needs "Answer in use for now"`);
  if (!/^(BA|PO), \d{4}-\d{2}-\d{2}$/.test(d.fields['Decided by'] || '')) findings.push(`${where}: "Decided by" must read "BA, YYYY-MM-DD" or "PO, YYYY-MM-DD"`);
}

function decisionRecordCheck({ frd }: FrdContext): Check {
  return runCheck('Each decision records its question, the gate, every option offered, the choice, who and when', (findings) => {
    const block = sectionBody(frd, 'Decision record');
    const { decisions } = frd;
    if (!decisions.length) {
      if (block.length && !(block.length === 1 && block[0].trim() === 'None yet.')) findings.push('no "### Decision n — ..." entries, so the section must say exactly "None yet."');
      return;
    }
    const nums = decisions.map((d) => d.n);
    if (nums.join() !== nums.map((_, i) => i + 1).join()) findings.push(`entries are numbered ${nums.join(', ')} (expected ${nums.map((_, i) => i + 1).join(', ')})`);
    for (const d of decisions) decisionEntryFindings(d, findings);
  });
}

function decisionReferencesCheck({ frd, scope }: FrdContext): Check {
  return runCheck('Every reference to a decision points to an entry that exists', (findings) => {
    for (const m of frd.body.matchAll(/Decision (\d+)/g)) if (!scope.decisionNumbers.includes(Number(m[1]))) findings.push(`"Decision ${m[1]}" is mentioned, but there is no Decision ${m[1]}`);
  });
}

// A note "on the basis of DM-n", and a coverage row that "waits on" a DM- or GC- ID, name an entry of the data
// model's decisions file, read through lib/data-model.ts.
function dmDecisionsCheck({ project, opts, frd }: FrdContext): Check {
  return runCheck('Every data model decision or Glossary change it names is in the data model\'s decisions file', (findings) => {
    const register = decisionsOf(project, opts);
    for (const id of new Set([...frd.body.matchAll(/\b(?:on the basis of|waits on) ((?:DM|GC)-\d+)\b/g)].map((m) => m[1]))) {
      if (!register.inForce.has(id)) findings.push(`${id} is named, but the data model's decisions file, ${register.name}, has no ${id}${register.exists ? '' : ': the file is missing'}`);
    }
  });
}

// ---------------------------------------------------------------- the checks: the whole document

function checkRecordCheck({ frd }: FrdContext): Check {
  return runCheck('The Check record holds the check\'s record, or None yet.', (findings) => {
    const block = sectionBody(frd, 'Check record');
    if (frd.crIndex < 0) {
      findings.push('missing the "## Check record" section');
      return;
    }
    if (block.length === 1 && block[0].trim() === 'None yet.') return;
    if (!block.length || !new RegExp(`^${escapeRegExp(PROGRAM)}, \\d{4}-\\d{2}-\\d{2}: `).test(block[0])) findings.push('must be exactly "None yet." or the check\'s "For the file" block, pasted as it is');
  });
}

function writerNotesCheck({ frd }: FrdContext): Check {
  return runCheck('No template markers or writer notes are left in the document', (findings) => {
    frd.lines.forEach((line, i) => { if (line.includes('<!--')) findings.push(`line ${i + 1}: ${line.trim()}`); });
  });
}

function idPrefixesCheck({ frd }: FrdContext): Check {
  return runCheck('Only the allowed ID prefixes appear', (findings) => {
    // DM- and GC- are the data model's IDs. They appear only in a note that names a data model decision, after
    // "waits on", and in Data's copy of the data model (the IDs section of frd-author's conventions).
    const own = frd.bodyLines.map((l, i) => ownText(frd, l, i)).join('\n')
      .replace(/on the basis of DM-\d+/g, '')
      .replace(/\bwaits on (?:DM|GC)-\d+/g, '');
    const bad = [...new Set(idsIn(own, /\b[A-Z][A-Za-z]*-\d/g).map((s) => s.slice(0, -2)))].filter((p) => !(ALLOWED_PREFIXES as readonly string[]).includes(p));
    if (bad.length) findings.push(`unexpected prefixes: ${bad.join(', ')}`);
  });
}

function dotsAndSlashesCheck({ sources, model, frd }: FrdContext): Check {
  return runCheck('No middle dots anywhere and no slash-joined items', (findings) => {
    const verbatim = [
      ...frd.frdReqs.flatMap((r) => [r.title, r.text]),
      ...frd.covered.flatMap((f) => [f.name, f.desc]),
      ...Object.values(sources.catalog).flatMap((c) => [c.name, c.done]),
      ...frd.coverage.map((x) => x.piece),
      ...frd.rules.flatMap((r) => (r.src.kind === 'dw' ? [r.src.piece] : [])),
      ...model.dmRows.flatMap((r) => [r.thing, r.name]),
    ].filter(Boolean).sort((a, b) => b.length - a.length);
    frd.bodyLines.forEach((line, i) => {
      let s = ownText(frd, line, i).replace(/\[[^\]]*\]\([^)]*\)/g, 'LINK').replace(/`[^`]*`/g, 'CODE');
      for (const v of verbatim) s = s.split(v).join('VERBATIM');
      if (s.includes('·')) findings.push(`line ${i + 1}: contains a middle dot`);
      if (/\S\/\S|\s\/\s/.test(s)) findings.push(`line ${i + 1}: slash-joined items: ${line.trim()}`);
    });
  });
}

// A requirement's title and text, copied exactly from the PRD, are the PRD's words, not the FRD's. On a first run the
// PRD comes before the Glossary, and it is never rewritten to match it ("Agreed words" in _shared/conventions.md), so
// the scan skips them. A requirement line that isn't an exact copy is scanned. Text copied exactly from the data
// model is skipped the same way: Data's copies, and each thing with its action, field or move where the FRD names
// them, in a rule's source, a row of the data model coverage table, or an answer to a standard question. In a line of
// Data that a decision changed, only the changed cells are scanned.
function dataModelCopies(dmRows: DmRow[]): [string, string][] {
  return [...new Map(dmRows.flatMap((r): [string, string][] => [
    [`data model — ${r.key}`, `data model — ${blank(r.key)}`],
    [`| ${r.thing} | ${r.name} |`, `| ${blank(r.thing)} | ${blank(r.name)} |`],
    [`${r.file}, ${r.thing} ${r.name}`, blank(`${r.file}, ${r.thing} ${r.name}`)],
  ])).entries()].sort((a, b) => b[0].length - a[0].length);
}

function glossaryWordsCheck({ sources, frd }: FrdContext, dmCopies: [string, string][]): Check {
  return runCheck('Glossary words', (findings) => {
    const own = frd.lines.map((l, i) => {
      if (frd.dataOwn.has(i)) return frd.dataOwn.get(i)!;
      const m = i < frd.head.length ? l.match(/^(- \*\*(REQ-\d+\.\d+) )(.+?)(\*\* — )(.+)$/) : null;
      const src = m && sources.reqs[m[2]];
      if (!m || !src || m[3] !== src.title || m[5] !== src.text) return dmCopies.reduce((s, [from, to]) => s.split(from).join(to), l);
      return `${m[1]}${' '.repeat(m[3].length)}${m[4]}${' '.repeat(m[5].length)}`;
    }).join('\n');
    for (const h of scan(own, sources.retired, sources.current, 'frd')) findings.push(`Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`);
  });
}

// ---------------------------------------------------------------- what the gate shows

// A question named only in Data's copy of the data model is not one this FRD builds on. A rule that builds on it
// keeps its "question {n}", so the question is named there. A cell of Data that a decision changed is the FRD's own.
function guardOf(frd: Frd, graded: Graded): OpenQuestion[] {
  const named = new Set<number | null>();
  for (const { n, line, section } of documentLines(frd.text)) {
    if (['decision record', 'check record'].includes(normalize(section)) || /^\s*\*[^*]/.test(line)) continue;
    for (const m of ownText(frd, line, n - 1).matchAll(/question (\d+)/gi)) named.add(Number(m[1]));
  }
  return (graded.open || []).filter((q) => q.group === 'Must answer' && named.has(q.n));
}

function noticesOf(frd: Frd, guard: OpenQuestion[], writingNotices: string[]): string[] {
  const notices: string[] = [];
  if (guard.length) {
    notices.push(`This FRD can't be accepted yet: it builds on ${plural(guard.length, 'Must answer question')} still open. Answer ${guard.length === 1 ? 'it' : 'them'} first, or park the FRD with park.ts while other work carries on:`);
    notices.push(...guard.map((q) => `- question ${q.n}: ${q.title}`));
  }
  notices.push(...writingNotices);
  // Each rule is read after "The system shall", so it starts with its action.
  notices.push(...onePerRowNotices(onePerRow(frd.rules.map((r) => ({ id: r.id, text: r.text, kind: 'action' }))), 'rule'));
  notices.push('Not checked by the program, for the specifier to read:', ...NOT_CHECKED.map((n) => `- ${n}`));
  return notices;
}

function holdsOf({ frd, scope, dataNotes }: FrdContext): string[] {
  const { rules } = frd;
  const kinds = (k: RuleSource['kind']) => rules.filter((r) => r.src.kind === k).length;
  const dmNotes = rules.filter((r) => r.noteFrom === 'data model').length + dataNotes.length;
  const { owned } = scope;
  return [
    `${plural(frd.covered.length, 'feature')}, ${plural(frd.coverage.length, '"Done when" piece')}`,
    `${plural(rules.length, 'rule')}: ${kinds('dw')} from the pieces, ${kinds('dm')} from the data model, ${kinds('req')} from the requirements, ${kinds('proposed')} suggested, ${kinds('decided')} decided`,
    `${owned.length} data model ${owned.length === 1 ? 'answer' : 'answers'} its features own, ${frd.dmCoverage.filter((x) => x.waits.length && !x.by.length).length} of them waiting on an open decision or Glossary change`,
    `${plural(dmNotes, 'note')} where a decision at this gate changed a data model answer`,
    `${plural(frd.dataThings.length, 'thing')} in Data, with ${plural(frd.sqRows.length, 'standard question')} answered`,
    plural(frd.decisions.length, 'decision') + (frd.decisions.length ? ' so far' : ''),
  ];
}

// ---------------------------------------------------------------- the check

function readContext(project: string, frdArg: string, opts: PathOptions): FrdContext {
  const frdRel = frdArg.includes('/') ? frdArg : `frd/${frdArg}`;
  const id = identify(frdRel);
  if (!id || id.document !== 'frd') throw new LayoutError(`"${frdArg}" isn't an FRD's file, such as frd-claim-approval.md.`);
  const doc = load(project, 'frd', id.values, opts);
  const catalogDoc = load(project, 'feature-catalog', {}, opts);
  const prd = load(project, 'prd', {}, opts);
  // The data model is required. A missing things file, or a missing data model file, stops the check with exit code 2.
  const dataModel = loadDataModel(project, opts);
  const retired = retiredWords(project, opts);
  const current = currentTerms(project, opts);
  const graded = questions(project, opts);
  const sources: Sources = {
    ...readCatalog(catalogDoc.text),
    reqs: readPrdRequirements(prd.text),
    graded,
    logQuestions: new Map((graded.questions || []).map((q) => [q.n, q])),
    retired,
    current,
  };
  const model = readModelView(dataModel, catalogDoc.text);
  const frd = readFrd(doc.text.replace(/\r\n/g, '\n'), model);
  const scope = readScope(project, opts, doc, sources, model, frd);
  return { project, opts, doc, sources, model, frd, scope, flowCites: [], dataNotes: [] };
}

export function check(project: string, frdArg: string, opts: PathOptions = {}): FrdCheckResult {
  const ctx = readContext(project, frdArg, opts);
  const { doc, sources, model, frd, scope } = ctx;
  const siblings = siblingsOf(sources, frd, scope);
  const excluded = readExcludes(frd.excludes, siblings);
  const catPieces = sources.pieces.filter((p) => scope.inside.some((fid) => p.dw.startsWith(`${fid}.dw`)));
  const std = standardQuestions();
  const dmCopies = dataModelCopies(model.dmRows);
  const writing = simpleWriting(frd.text, { project, output: opts.output });

  // The checks run in this order, and some read what an earlier one found: the flow's citations, and Data's notes.
  const checks: Check[] = [
    runCheck('Opening', (findings) => findings.push(...opening(frd.text))),
    runCheck('Sections match the template, in order', (findings) => findings.push(...templateSections(frd.text, 'frd'))),
    capabilityCheck(ctx),
    lastChangedCheck(ctx),
    featuresInSectionCheck(ctx),
    featuresMatchCatalogCheck(ctx),
    requirementsListedCheck(ctx),
    requirementTextCheck(ctx),
    dependsOnCheck(ctx),
    excludesCheck(ctx, siblings, excluded),
    ruleSubsectionsCheck(ctx),
    ruleNumbersCheck(ctx),
    ruleOrderCheck(ctx),
    ruleSourceCheck(ctx),
    decidedRuleNoteCheck(ctx),
    piecesMatchCatalogCheck(ctx, catPieces),
    pieceQuotesCheck(ctx, catPieces),
    provedByCheck(ctx),
    dmCoverageTableCheck(ctx),
    dmRowsHaveRulesCheck(ctx),
    dmRulesCheck(ctx),
    ruleListCheck('"From the requirement" lists exactly the req rules', frd.reqList, frd.rules, ['req'], 'req rules'),
    ruleListCheck('"From the data model" lists exactly the data model rules', frd.dmList, frd.rules, ['dm'], 'data model rules'),
    ruleListCheck('"From your decisions" lists exactly the suggested and decided rules', frd.decList, frd.rules, ['proposed', 'decided'], 'suggested and decided rules'),
    nothingUndecidedCheck(ctx),
    howWordsCheck(ctx),
    gatesTiedCheck(ctx),
    gateConditionsCheck(ctx),
    entryExitCheck(ctx),
    flowStepsCheck(ctx),
    rulesInFlowCheck(ctx),
    dataCopiesCheck(ctx),
    dataModelNotesCheck(ctx),
    standardQuestionsCheck(ctx, std),
    decisionRecordCheck(ctx),
    decisionReferencesCheck(ctx),
    dmDecisionsCheck(ctx),
    checkRecordCheck(ctx),
    writerNotesCheck(ctx),
    idPrefixesCheck(ctx),
    dotsAndSlashesCheck(ctx),
    glossaryWordsCheck(ctx, dmCopies),
    runCheck('Placeholders', (findings) => findings.push(...placeholders(frd.text))),
    runCheck('Display', (findings) => findings.push(...rendering(frd.text))),
    runCheck('Simple writing', (findings) => findings.push(...writing.findings)),
    runCheck('Question log', (findings) => findings.push(...questionFindingsFor(doc, sources.graded))),
  ];

  const guard = guardOf(frd, sources.graded);
  return { doc, checks, holds: holdsOf(ctx), graded: sources.graded, notices: noticesOf(frd, guard, writing.notices), guard };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const use = 'Use: node tools/check-frd.ts --project <p> --frd <file>';
  const project = requireOption(args, 'project', use);
  const frdArg = requireOption(args, 'frd', use);
  const date = textOption(args, 'date') ?? today();
  const out = report({ program: PROGRAM, date, ...check(project, frdArg, { output: args.output }) });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
