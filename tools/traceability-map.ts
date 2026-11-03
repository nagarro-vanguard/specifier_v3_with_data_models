// traceability-map.ts — rebuilds traceability-map.json from the accepted documents.
//
//   node tools/traceability-map.ts --project <p>
//
// It reads only the latest accepted version of each document: the copy that version-log.ts saved,
// found through version-log/log.md. The shape is templates/parts/traceability-map.md.
//
// The data model, read through lib/data-model.ts:
//   - the things file gives each thing as an item, typed "thing", such as Loan
//   - each data model file gives each action, field and move of each thing as an item, typed "data model row", such as
//     "Loan, Extend". A move is named by its From and its To, such as "Loan, On loan → Overdue". A "has-row" link joins
//     the thing to each of its rows.
//   - an FRD rule whose source is "data model — Loan, Extend" gets a "names-row" link to the row "Loan, Extend"
// The data model files cite no source, so no link leads from a requirement to a row. A change reaches a row through
// the "Data model" column of its report's section 6.
//
// A link whose far end is missing is:
//   - waiting, when the document that would hold it isn't accepted yet. It is listed, and is not a failure.
//   - a problem, when that document is accepted and the ID isn't in it. A data model row is missing for good only once
//     the things file and every data model file it names are accepted.
// An ID that appears twice is also a problem.
//
// It exports EXTRACT, the reader for each document, and latestAccepted, so find-linked.ts reads documents the same way,
// and the types Adder, Extractor, MapItem and MapLink.
//
// Exit codes: 0 rebuilt with no problems; 1 rebuilt, with problems listed; 2 the project or the layout is missing.
// Options for tests: --output <dir>; --date <YYYY-MM-DD>.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, textOption, today, fail, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, projectDir, identify, relOf, readText, type PathOptions, type Values } from './lib/run-paths.ts';
import { tableUnder, list, scenarios, type Cell, type Row } from './lib/md-tables.ts';
import { readThings, readFile, moveName, cell } from './lib/data-model.ts';

const RE = {
  br: /\bBR-\d+\b/g,
  nfr: /\bNFR-\d+\b/g,
  feature: /\bF-\d+(?![.\d])/g,
  piece: /\bF-\d+\.dw\d+\b/g,
  rule: /\bF-\d+\.\d+\b/g,
  epic: /\bEPIC-\d{3}\b/g,
  frd: /\bFRD-\d+[a-z]\b/g,
  // A requirement ID: the source's own, word for word. Anything shaped PREFIX-number that isn't one of ours.
  requirement: /\b(?!BR-|NFR-|F-|EPIC-|FRD-)[A-Z][A-Z0-9]*-\d+(?:\.\d+)*\b/g,
} as const;

// What each link points at, and which document would hold it.
const TARGET: Record<string, string> = {
  traces: 'BR', covers: 'requirement', 'has-piece': 'piece', 'in-frd': 'FRD', 'in-epic': 'EPIC',
  proves: 'piece', applies: 'NFR', tells: 'feature', 'names-rule': 'rule', 'has-rule': 'rule',
  'has-row': 'data model row', 'names-row': 'data model row',
};
const HOME: Record<string, string> = {
  BR: 'brd', requirement: 'prd', NFR: 'prd', feature: 'feature-catalog', piece: 'feature-catalog', EPIC: 'epic-register', story: 'story-list',
  thing: 'data-model-things', 'data model row': 'data-model',
};
const DATA_MODEL_TABLES = ['actions', 'fields', 'moves'] as const;

// What a reader hands each item and link it finds to.
export interface Adder {
  item(id: string, type: string): void;
  link(from: string, to: string, type: string): void;
}

export type Extractor = (text: string, add: Adder, values: Values) => void;

export interface MapItem {
  id: string;
  type: string;
  document: string;
  version: number;
}

export interface MapLink {
  from: string;
  to: string;
  type: string;
}

// Everything read from the accepted documents.
interface Accepted {
  items: MapItem[];
  byId: Map<string, MapItem>;
  links: MapLink[];
  problems: string[];
  acceptedKinds: Set<string>;
  acceptedRels: Set<string>;
  thingsText: string | null;
}

function idsIn(c: Cell | undefined, re: RegExp): string[] {
  return list(c).join(' ').match(re) || [];
}

function storyTitle(c: Cell | undefined): string {
  const s = list(c).join(' ').trim();
  const m = s.match(/^\[([^\]]+)\]/);
  return m ? m[1].trim() : s;
}

function rowsOr(text: string, heading: string): Row[] {
  return tableUnder(text, heading) || [];
}

// Reads one accepted document's items and links.
export const EXTRACT: Record<string, Extractor> = {
  brd(text, add) {
    for (const r of rowsOr(text, 'Business requirements')) for (const id of idsIn(r['BR ID'], RE.br)) add.item(id, 'BR');
  },
  'data-model-things'(text, add) {
    for (const f of readThings(text).families) {
      for (const t of f.things) {
        const thing = list(t.Thing).join(' ').trim();
        if (thing) add.item(thing, 'thing');
      }
    }
  },
  'data-model'(text, add) {
    // Each action, field and move, named as the FRD's source names it: the thing, a comma, then the Action cell, the
    // Field cell, or the move's From and To.
    for (const part of readFile(text).parts) {
      for (const t of part.tables) {
        if (!(DATA_MODEL_TABLES as readonly string[]).includes(t.kind)) continue;
        for (const row of t.rows) {
          const name = t.kind === 'moves' ? moveName(row) : cell(t.kind === 'actions' ? row.Action : row.Field).text;
          if (!name) continue;
          const id = `${part.thing}, ${name}`;
          add.item(id, 'data model row');
          add.link(part.thing, id, 'has-row');
        }
      }
    }
  },
  prd(text, add) {
    for (const r of rowsOr(text, 'Requirements').concat(rowsOr(text, 'Requirements, word for word'))) {
      const id = list(r.ID).join(' ').trim();
      if (!id) continue;
      add.item(id, 'requirement');
      for (const br of idsIn(r['Traces to'], RE.br)) add.link(id, br, 'traces');
    }
    for (const r of rowsOr(text, 'NFRs')) for (const id of idsIn(r['NFR ID'], RE.nfr)) add.item(id, 'NFR');
    for (const r of rowsOr(text, 'Transition requirements')) {
      const id = list(r.ID).join(' ').trim();
      if (id) add.item(id, 'requirement');
    }
  },
  'feature-catalog'(text, add) {
    for (const r of rowsOr(text, 'Feature catalog')) {
      const [id] = idsIn(r['Feature ID'], RE.feature);
      if (!id) continue;
      add.item(id, 'feature');
      for (const req of idsIn(r['Covers (source IDs)'], RE.requirement)) add.link(id, req, 'covers');
      for (const frd of idsIn(r.Capability, RE.frd)) add.link(id, frd, 'in-frd');
    }
    for (const r of rowsOr(text, '"Done when" pieces')) {
      for (const piece of idsIn(r['Piece ID'], RE.piece)) {
        add.item(piece, 'piece');
        add.link(piece.replace(/\.dw\d+$/, ''), piece, 'has-piece');
      }
    }
  },
  'epic-register'(text, add) {
    for (const r of rowsOr(text, 'EPICs')) {
      const [id] = idsIn(r.EPIC, RE.epic);
      if (!id) continue;
      add.item(id, 'EPIC');
      for (const f of idsIn(r.Features, RE.feature)) add.link(f, id, 'in-epic');
    }
  },
  frd(text, add) {
    const title = text.match(/^#\s+(FRD-\d+[a-z])\b/m);
    if (title) add.item(title[1], 'FRD');
    // A rule's ID starts with its feature's ID, so every rule is linked to its feature, even one no piece names.
    // A rule whose source is "data model — {Thing}, {action, field or move}" names that data model row. The source is
    // the cell's first line: a note may follow it.
    for (const r of rowsOr(text, 'Rules')) {
      const source = String(list(r.Source)[0] || '').trim().match(/^data model — (.+)$/);
      for (const id of idsIn(r.Rule, RE.rule)) {
        add.item(id, 'rule');
        add.link(id.replace(/\.\d+$/, ''), id, 'has-rule');
        if (source) add.link(id, source[1].trim(), 'names-row');
      }
    }
    for (const r of rowsOr(text, 'Coverage')) {
      for (const piece of idsIn(r['Done-when'], RE.piece)) {
        for (const rule of idsIn(r['Proved by'], RE.rule)) add.link(rule, piece, 'proves');
      }
    }
  },
  'epic-brief'(text, add, values) {
    // The EPIC's folder is named by its ID and name, such as EPIC-002-claim-approval.
    const [epic] = String(values.epic).match(RE.epic) || [];
    if (!epic) return;
    for (const r of rowsOr(text, 'NFRs that apply')) for (const nfr of idsIn(r['NFR ID'], RE.nfr)) add.link(epic, nfr, 'applies');
  },
  'story-list'(text, add) {
    for (const r of rowsOr(text, 'Stories')) {
      const title = storyTitle(r.Story);
      if (!title) continue;
      add.item(title, 'story');
      for (const f of idsIn(r['Feature ID'], RE.feature)) add.link(title, f, 'tells');
    }
  },
  story(text, add) {
    // The title reads "Story — {story title}"; the story's ID is its title.
    const t = text.match(/^#\s+(?:Story\s+—\s+)?(.+?)\s*$/m);
    if (!t) return;
    // Each scenario names the rules it proves in brackets at the end of its title.
    for (const sc of scenarios(text)) {
      const id = `${t[1]}, ${sc.id}`;
      add.item(id, 'scenario');
      for (const rule of sc.rules) add.link(id, rule, 'names-rule');
    }
  },
};

// The latest accepted version of each document, from the log.
export function latestAccepted(project: string, opts: PathOptions): Map<string, number> {
  const logPath = pathOf(project, 'version-log', {}, opts);
  const latest = new Map<string, number>();
  if (!fs.existsSync(logPath)) return latest;
  for (const line of readText(logPath).split(/\r?\n/)) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((s) => s.trim());
    const version = Number(cells[0]);
    const rel = cells[1];
    const known = latest.get(rel);
    if (known === undefined || known < version) latest.set(rel, version);
  }
  return latest;
}

// Reads every accepted document's saved copy, through its reader in EXTRACT.
function readAccepted(project: string, dir: string, opts: PathOptions): Accepted {
  const found: Accepted = { items: [], byId: new Map(), links: [], problems: [], acceptedKinds: new Set(), acceptedRels: new Set(), thingsText: null };
  const { items, byId, links, problems } = found;
  for (const [rel, version] of latestAccepted(project, opts)) {
    const id = identify(rel);
    if (!id || !EXTRACT[id.document]) continue;
    const copy = pathOf(project, 'version-copy', { document: rel.replace(/\.(md|json)$/, ''), n: String(version) }, opts);
    if (!fs.existsSync(copy)) {
      problems.push(`The log names version ${version} of ${rel}, but its copy is missing: ${path.relative(dir, copy)}`);
      continue;
    }
    found.acceptedKinds.add(id.document);
    found.acceptedRels.add(rel);
    const text = readText(copy);
    if (id.document === 'data-model-things') found.thingsText = text;
    const add: Adder = {
      item(itemId, type) {
        const there = byId.get(itemId);
        if (there) {
          problems.push(`${itemId} appears twice: in ${there.document} and in ${rel}`);
          return;
        }
        const it = { id: itemId, type, document: rel, version };
        byId.set(itemId, it);
        items.push(it);
      },
      link(from, to, type) {
        if (!links.some((l) => l.from === from && l.to === to && l.type === type)) links.push({ from, to, type });
      },
    };
    EXTRACT[id.document](text, add, id.values);
  }
  return found;
}

// Whether the document that would hold a missing item of this type is accepted, so the item is missing for good.
function homeAcceptedTest(found: Accepted): (type: string, missingId: string) => boolean {
  // Which FRD each feature belongs to, so a missing rule can be told apart from a rule not yet written.
  const frdOfFeature = new Map(found.links.filter((l) => l.type === 'in-frd').map((l) => [l.from, l.to]));
  // A data model row is missing for good only once the things file and every data model file it names are accepted.
  const families = found.thingsText ? readThings(found.thingsText).families : [];
  const dataModelAccepted = families.length > 0 && families.every((f) => found.acceptedRels.has(relOf('data-model', { family: f.value })));
  return (type, missingId) => {
    if (type === 'FRD') return false; // an FRD that isn't in the map hasn't been accepted yet
    if (type === 'data model row') return dataModelAccepted;
    if (type === 'rule') {
      const frd = frdOfFeature.get(missingId.replace(/\.\d+$/, ''));
      return Boolean(frd && found.byId.has(frd));
    }
    return found.acceptedKinds.has(HOME[type]);
  };
}

// Each missing far end that waits for a document not yet accepted, and who wants it. Every other missing end is a
// problem.
function waitingFor(found: Accepted): Map<string, string[]> {
  const { byId, acceptedKinds, problems } = found;
  const homeAccepted = homeAcceptedTest(found);
  const waiting = new Map<string, string[]>();
  const wait = (id: string, by: string) => {
    let wanted = waiting.get(id);
    if (!wanted) waiting.set(id, (wanted = []));
    wanted.push(by);
  };
  for (const l of found.links) {
    // A rule's feature is in the Feature catalog, so it waits while the catalog isn't accepted. A data model row's thing
    // is in the things file, so it waits while the things file isn't accepted.
    if (!byId.has(l.from)) {
      if (l.type === 'has-rule' && !acceptedKinds.has('feature-catalog')) wait(l.from, l.to);
      else if (l.type === 'has-row' && !acceptedKinds.has('data-model-things')) wait(l.from, l.to);
      else problems.push(`${l.type}: ${l.from} -> ${l.to}, but ${l.from} isn't in any accepted document`);
    }
    if (!byId.has(l.to)) {
      const type = TARGET[l.type];
      if (homeAccepted(type, l.to)) problems.push(`${l.type}: ${l.from} -> ${l.to}, but ${l.to} isn't in the accepted ${HOME[type] || 'FRD'}`);
      else wait(l.to, l.from);
    }
  }
  return waiting;
}

function summary(found: Accepted, waiting: Map<string, string[]>): string {
  const out = [`Map rebuilt: ${found.items.length} items, ${found.links.length} links.`];
  if (waiting.size) {
    out.push(`Waiting for documents not yet accepted (${waiting.size}):`);
    for (const [to, froms] of waiting) out.push(`- ${to}, wanted by:${froms.map((f) => `\n  - ${f}`).join('')}`);
  }
  if (found.problems.length) {
    out.push(`Problems (${found.problems.length}):`);
    for (const p of found.problems) out.push(`- ${p}`);
  }
  return out.join('\n') + '\n';
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  // An empty name fails in projectDir the same way a missing one does.
  const project = textOption(args, 'project') ?? '';
  const dir = projectDir(project, args);
  if (!fs.existsSync(dir)) fail(`The project folder doesn't exist: ${dir}`, 2);

  const found = readAccepted(project, dir, args);
  const waiting = waitingFor(found);

  const map = { project, built: textOption(args, 'date') ?? today(), items: found.items, links: found.links };
  fs.writeFileSync(pathOf(project, 'traceability-map', {}, args), JSON.stringify(map, null, 2) + '\n');

  process.stdout.write(summary(found, waiting));
  return found.problems.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
