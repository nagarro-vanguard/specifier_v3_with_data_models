// find-linked.ts — lists everything linked to what a change lands on, so nothing affected is missed.
//
//   node tools/find-linked.ts --project <p> --change <nnn>
//
// What it does:
//   1. starts from the IDs in section 6 of the change's report, "Where it lands": its business requirements,
//      requirements, features, FRDs and EPICs, and the data model rows of its "Data model" column, such as
//      "Loan, Extend". A thing named alone, such as "Loan", is where the change lands, and leads to nothing more.
//   2. reads the links of the Traceability map, which holds the accepted documents, and the links of every document
//      drafted since it was last accepted, read the same way, so work in progress is reached too. The data model files
//      and the things file are among them.
//   3. follows the links downstream, from what is traced to, to what traces to it:
//      - a business requirement leads to the requirements that trace to it
//      - a requirement leads to the features that cover it
//      - a feature leads to its pieces, its rules, its FRD, its EPIC, and the stories that tell it
//      - a piece leads to the rules that prove it
//      - a data model row leads to the rules whose source names it
//      - a rule leads to the scenarios that name it
//   4. writes section 12, "Linked items": every item reached, grouped by the document it is in, in the order the
//      documents are reached. Each says the link and the item it was reached from, or "where the change lands".
//
// Exports: linked(project, change, opts), the linked items of a change; working(project, opts), the map's items and
// links with those of the drafted documents added.
//
// Exit codes: 0 written; 1 an ID in section 6 is in no document, each listed, and nothing is written; 2 the change,
// its report, the map or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, matches, pathOf, readText, type MatchedFile, type PathOptions } from './lib/run-paths.ts';
import { list, tableUnder, type Cell } from './lib/md-tables.ts';
import { changeOf, replaceSection, type ChangeFolder } from './lib/check-document.ts';
import { plural } from './lib/text.ts';
import { EXTRACT, latestAccepted, type Extractor, type MapItem, type MapLink } from './traceability-map.ts';

const USE = 'Use: node tools/find-linked.ts --project <p> --change <nnn>';

// Links followed from the item linked to, back to the item that links: "covers" from a requirement to its features.
const BACK = ['traces', 'covers', 'tells', 'proves', 'names-rule', 'names-row'] as const;
// Links followed forward, from the item that links: "has-piece" from a feature to its pieces.
const FORWARD = ['has-piece', 'has-rule', 'in-frd', 'in-epic'] as const;
// The columns of section 6 a change starts from.
const START_COLUMNS = ['Requirement', 'Feature', 'FRD', 'EPIC', 'Data model'] as const;

// An item of the Traceability map, or of a drafted document, which has no version yet.
export type KnownItem = Pick<MapItem, 'id' | 'type' | 'document'>;

export interface WorkingSet {
  known: Map<string, KnownItem>;
  links: MapLink[];
}

// One linked item, with the link and the item it was reached from.
export interface LinkedRow {
  id: string;
  through: string;
  type: string;
  document: string;
}

export interface Linked {
  change: ChangeFolder;
  findings: string[];
  rows: LinkedRow[];
}

interface DraftedDocument extends MatchedFile {
  extract: Extractor;
  text: string;
}

const idsIn = (cell: Cell | undefined): string[] => list(cell).map((x) => x.trim()).filter((x) => x && !/^none\b/i.test(x));

// Every document drafted since it was last accepted, or never accepted: its text differs from its latest saved copy.
function drafted(project: string, opts: PathOptions): DraftedDocument[] {
  const latest = latestAccepted(project, opts);
  const out: DraftedDocument[] = [];
  for (const [kind, extract] of Object.entries(EXTRACT)) {
    for (const m of matches(project, kind, opts)) {
      const text = readText(m.abs);
      const version = latest.get(m.rel);
      const copy = version && pathOf(project, 'version-copy', { document: m.rel.replace(/\.(md|json)$/, ''), n: String(version) }, opts);
      if (copy && fs.existsSync(copy) && readText(copy) === text) continue;
      out.push({ ...m, extract, text });
    }
  }
  return out;
}

// The Traceability map's items and links, as JSON gives them.
function readMap(file: string): { items: KnownItem[]; links: MapLink[] } {
  const map: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { items, links } = (map ?? {}) as { items?: unknown; links?: unknown };
  if (!Array.isArray(items) || !Array.isArray(links)) throw new LayoutError(`The Traceability map has no items or no links: ${file}`);
  return { items: items as KnownItem[], links: links as MapLink[] };
}

// The map's items and links, with those of the drafted documents added.
export function working(project: string, opts: PathOptions): WorkingSet {
  const mapFile = pathOf(project, 'traceability-map', {}, opts);
  if (!fs.existsSync(mapFile)) throw new LayoutError(`There is no Traceability map yet: ${mapFile}. It is built at every acceptance.`);
  const map = readMap(mapFile);
  const known = new Map(map.items.map((i) => [i.id, i]));
  const links = [...map.links];
  for (const d of drafted(project, opts)) {
    const add = {
      item(id: string, type: string): void { if (!known.has(id)) known.set(id, { id, type, document: d.rel }); },
      link(from: string, to: string, type: string): void { if (!links.some((l) => l.from === from && l.to === to && l.type === type)) links.push({ from, to, type }); },
    };
    d.extract(d.text, add, d.values);
  }
  return { known, links };
}

// The IDs section 6 names, each once, in the order they are first named.
function startsOf(reportText: string): string[] {
  const starts: string[] = [];
  for (const row of tableUnder(reportText, 'Where it lands') || []) {
    for (const column of START_COLUMNS) for (const id of idsIn(row[column])) if (!starts.includes(id)) starts.push(id);
  }
  return starts;
}

// From each item, the items its links lead to downstream.
function nextItems(links: MapLink[]): Map<string, { to: string; type: string }[]> {
  const next = new Map<string, { to: string; type: string }[]>();
  const add = (from: string, to: string, type: string) => {
    if (!next.has(from)) next.set(from, []);
    next.get(from)!.push({ to, type });
  };
  for (const l of links) {
    if ((BACK as readonly string[]).includes(l.type)) add(l.to, l.from, l.type);
    if ((FORWARD as readonly string[]).includes(l.type)) add(l.from, l.to, l.type);
  }
  return next;
}

// Every item reached from the starts, breadth first, grouped by document in the order the documents are first reached.
function reach(starts: string[], { known, links }: WorkingSet): LinkedRow[] {
  const next = nextItems(links);
  const reached = starts.map((id) => ({ id, through: 'where the change lands' }));
  const seen = new Set(starts);
  const queue = [...starts];
  while (queue.length) {
    const id = queue.shift()!;
    for (const n of next.get(id) || []) {
      if (seen.has(n.to) || !known.has(n.to)) continue;
      seen.add(n.to);
      reached.push({ id: n.to, through: `${n.type}, from ${id}` });
      queue.push(n.to);
    }
  }
  const rows = reached.map((r) => ({ ...r, type: known.get(r.id)!.type, document: known.get(r.id)!.document }));
  const docs = [...new Set(rows.map((r) => r.document))];
  return rows.sort((a, b) => docs.indexOf(a.document) - docs.indexOf(b.document));
}

export function linked(project: string, change: string, opts: PathOptions = {}): Linked {
  const c = changeOf(project, change, opts);
  if (!fs.existsSync(c.report)) throw new LayoutError(`The change has no report yet: ${c.report}`);
  const set = working(project, opts);
  const starts = startsOf(readText(c.report));
  const missing = starts.filter((id) => !set.known.has(id));
  if (missing.length) return { change: c, findings: missing.map((id) => `${id}, in section 6, isn't in the Traceability map or in any drafted document.`), rows: [] };
  return { change: c, findings: [], rows: reach(starts, set) };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const r = linked(project, change, { output: args.output });
  if (r.findings.length) {
    process.stdout.write(`${plural(r.findings.length, 'finding')}:\n${r.findings.map((f) => `- ${f}`).join('\n')}\n`);
    return 1;
  }
  replaceSection(r.change.report, 'Linked items', ['| Item | Type | Linked through |', '|---|---|---|', ...r.rows.map((x) => `| ${x.id} | ${x.type} | ${x.through} |`)]);
  process.stdout.write(`${programName(import.meta.filename)}: change ${r.change.number}, ${plural(r.rows.length, 'linked item')}, written to section 12.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
