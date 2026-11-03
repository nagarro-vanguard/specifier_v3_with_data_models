// check-features.ts — checks the Feature catalog before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-features.ts --project <p>
//
// Exports:
//   check(project, opts)            every check on the Feature catalog, what the draft holds, and the gate's notices
//   piecesFit(doneWhen, pieces)     whether the pieces give back the "Done when", in order, with only joining words left
//
// What it checks:
//   - the opening blocks, and every section of the Feature catalog template, in order, with no section of its own
//   - every feature sits under a heading of the PRD's own, and has: an ID, F-01 onward, used once; a name; a
//     description; a "Done when" that adds at least one word its description doesn't have; the requirements it covers,
//     each one in the PRD; a priority, Must, Should, Could or Won't, with a basis from the fixed list; what it depends
//     on, each a feature in the catalog; and a capability, such as "FRD-3a Claim approval"
//   - every feature's "Done when" is cut into pieces, F-01.dw1 onward, each in its own words and its own order, so read
//     together they give it back, with nothing left over but "and", "or", "then" or punctuation; and each feature's
//     pieces sit under its own heading, its ID and then its name, as section 2 has them
//   - every Requirement row in the PRD is covered by a feature, or is a Gap that names its question, and the coverage
//     check lists exactly the features that cover each one. A Purpose, Scope or Way of working row gets no feature
//     and no coverage row.
//   - data model coverage: every row of every Actions table and every Moves table in the data model files has exactly
//     one row in section 5, in the files' order, with its data model file, its thing and its action or move word for
//     word, and one feature from the catalog. A move is named From → To. Section 5 lists nothing else. The things
//     file and every data model file it names are accepted. The files are read through lib/data-model.ts.
//   - a row of section 5 may wait on a change instead of naming a feature, until that change adds its feature. Its
//     Feature cell then reads "waits on change" and the change's 3-digit number, such as "waits on change 004", and
//     nothing else. The change must be in the project's changes/ folder, found through check-document.ts's changeOf.
//     A waiting row is never a finding, and never counted as having a feature. "For the person" lists each one, and
//     the coverage line says how many wait. A row that still waits on a closed change is a finding. A change is
//     closed when its progress file, changes/{change}/progress.md, reads "Status: closed". The change has run, so
//     the row should name its feature.
//   - a row of section 5 that no feature names yet shows "?" in its Feature cell, until the gate settles it. An open
//     row is never a finding before the catalog is accepted, and never counted as having a feature. The table of
//     rows to settle at the gate, under the same section, has one row for each open row, with the two answers of
//     feature-author's step 6, each yes or no, and the recommendation they give. A recommendation that names a feature
//     names the one that owns the thing's first action, as that action's row names it. "For the person" lists each
//     open row with its recommendation, under a line saying the catalog can't be accepted yet. This is the catalog's
//     guard, like the FRD guard in check-frd.ts. Once the catalog is accepted, a row that still shows "?" is a finding.
//   - one capability per feature: a feature's name that may name two things, a description that may hold two
//     actions, and a "Done when" piece that may hold two, are shown to look at, never a finding, through
//     lib/one-per-row.ts
//   - one FRD for each PRD section: each PRD section whose features name more than one capability is shown to look
//     at, never a finding, as feature-author's FR-7 says
//   - no retired Glossary word is used, through lib/scan-retired-words.ts. It skips text copied exactly from the PRD,
//     because the PRD is never rewritten to match the Glossary: a heading that is a PRD section's heading, and a
//     coverage check row's requirement title that is its PRD title. It skips text copied exactly from the data model
//     the same way: in section 5, a row's data model file, thing, and action or move. A copy that differs is scanned.
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - grade-questions.ts finds nothing wrong with this catalog's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the catalog, the PRD, the Glossary, the
// data model's things file, a data model file it names, or the layout is missing. The data model is required, as the
// Glossary is.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, pathOf, readText, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellItems, normalize, type Cell, type Row } from './lib/md-tables.ts';
import {
  load, opening, sections, placeholders, rendering, simpleWriting, requirementsOf, questions, questionFindingsFor,
  report, changeOf,
} from './lib/check-document.ts';
import { retiredWords, currentTerms, scan } from './lib/scan-retired-words.ts';
import { load as loadDataModel, cell, actionsAndMoves, things, type DataModel } from './lib/data-model.ts';
import { check as onePerRow, notices as onePerRowNotices } from './lib/one-per-row.ts';
import { plural } from './lib/text.ts';
import type { Check, CheckResult, LoadedDocument } from './lib/types.ts';

const BASES = ['Benefit', 'Penalty', 'Cost', 'Risk', 'Dependency', 'Time-sensitivity', 'Stability', 'Regulatory'] as const;
const PRIORITIES = ['Must', 'Should', 'Could', "Won't"] as const;
const GAP = /Proposed \(needs confirmation\)|\bTBD\b|\[Not specified in provided sources\]/;
// Words that join two pieces of a "Done when"; nothing else may be left over between them.
const JOINS = /^[\s,;:.]*(?:(?:and|or|then|but)\b[\s,;:.]*)?$/i;
// The cells a feature must fill, and what each one is called in a finding.
const REQUIRED_CELLS = [['Feature', 'name'], ['Description (what it is)', 'description'], ['Done when (observable)', '"Done when"'], ['Capability', 'capability']] as const;
// A row of section 5 that waits on a change, until the change adds its feature: "waits on change 004", and nothing else.
const WAITS = /^waits on change (\d{3})$/;
// A row of section 5 that no feature names yet shows "?" in its Feature cell, until the gate settles it.
const OPEN = '?';
// The recommendation for an open row, from its two answers, as feature-author's step 6 gives it. Where it names a
// feature, that feature owns the thing's first action.
const RECOMMENDED = [
  { prd: 'yes', big: 'no', re: /^Add a piece to the Done when of (F-\d{2,})$/, says: 'Add a piece to the Done when of F-nn' },
  { prd: 'yes', big: 'yes', re: /^A new feature$/, says: 'A new feature' },
  { prd: 'no', big: 'no', re: /^Give it to (F-\d{2,})$/, says: 'Give it to F-nn' },
  { prd: 'no', big: 'yes', re: /^A new requirement first, then a new feature$/, says: 'A new requirement first, then a new feature' },
] as const;

type PrdRequirement = ReturnType<typeof requirementsOf>[number];

// A row of section 5, read.
interface ListedRow {
  key: string;
  features: string[];
  waitsOn: string | null;
  open: boolean;
}

interface OpenRow {
  key: string;
  recommended: string | null;
}

interface WaitingRow {
  key: string;
  change: string;
}

// What section 5 holds, and how many actions and moves have a feature.
interface DataModelCoverage {
  findings: string[];
  wanted: number;
  covered: number;
  waiting: WaitingRow[];
  open: OpenRow[];
}

// The feature that owns a thing's first action, and that action.
interface FirstOwner {
  feature: string;
  action: string;
}

const words = (s: string): Set<string> => new Set((s.toLowerCase().match(/[a-z0-9']+/g) || []));
// A data model file's name in a cell: "lending.md", "`lending.md`", or a link to it.
const fileName = (c: Cell): string => cellText(c).replace(/^\[([^\]]*)\]\([^)]*\)$/, '$1').replace(/`/g, '').trim();
const keyOf = (file: string, thing: string, name: string): string => `${file}, ${thing}, ${name}`;
const rowKey = (r: Row): string => keyOf(fileName(r['Data model file']), cellText(r.Thing), cellText(r['Action or move']));
// How many rows wait, as the coverage line says it: "none waits", "1 waits" or "2 wait".
const waitCount = (n: number): string => (n === 0 ? 'none waits' : n === 1 ? '1 waits' : `${n} wait`);
// How many rows still show "?", as the coverage line says it: "none shows", "1 shows" or "2 show".
const openCount = (n: number): string => (n === 0 ? 'none shows' : n === 1 ? '1 shows' : `${n} show`);
const countKeys = (rows: { key: string }[]): Map<string, number> => rows.reduce((m, x) => m.set(x.key, (m.get(x.key) || 0) + 1), new Map<string, number>());
const blank = (s: string): string => ' '.repeat(s.length);

// The pieces must appear in the Done when, in order, with only joining words between them and at the ends.
export function piecesFit(doneWhen: string, pieces: string[]): boolean {
  let rest = doneWhen.toLowerCase();
  for (const p of pieces) {
    const at = rest.indexOf(p.toLowerCase());
    if (at < 0 || !JOINS.test(rest.slice(0, at))) return false;
    rest = rest.slice(at + p.length);
  }
  return JOINS.test(rest);
}

// A change is closed once close-change.ts sets its progress file's status line to "Status: closed on {date}".
function isClosed(project: string, change: ReturnType<typeof changeOf>, opts: PathOptions): boolean {
  const file = pathOf(project, 'change-progress', { change: change.folder }, opts);
  return fs.existsSync(file) && /^Status: closed/m.test(readText(file));
}

// ---------------------------------------------------------------- section 5: data model coverage

// The things file and every data model file are accepted, and the things file names at least one.
function acceptedFindings(model: DataModel): string[] {
  const findings: string[] = [];
  for (const f of [model.thingsFile, ...model.files]) {
    if (f.status.state !== 'accepted') findings.push(`${f.name} isn't accepted. Its status is "${f.status.raw || 'missing'}".`);
  }
  if (!model.files.length) findings.push(`The things file, ${model.thingsFile.name}, names no data model file.`);
  return findings;
}

function readListed(rows: Row[]): ListedRow[] {
  return rows.map((r) => {
    const features = cellItems(r.Feature);
    const w = features.length === 1 && features[0].match(WAITS);
    return { key: rowKey(r), features, waitsOn: w ? w[1] : null, open: features.length === 1 && features[0] === OPEN };
  });
}

// One row's Feature cell: "?", a change it waits on, or one feature of the catalog. A row that waits on a change is
// neither a finding nor covered. Its change must be in the project's changes/ folder, and still open.
function featureCellFindings(l: ListedRow, need: Map<string, number>, ids: string[], project: string, opts: PathOptions, waiting: WaitingRow[]): string[] {
  const findings: string[] = [];
  if (l.open) return findings;
  if (l.waitsOn) {
    let change: ReturnType<typeof changeOf> | null = null;
    try {
      change = changeOf(project, l.waitsOn, opts);
    } catch (e) {
      if (!(e instanceof LayoutError)) throw e;
      findings.push(`${l.key} waits on change ${l.waitsOn}, which isn't in the project's changes/ folder.`);
    }
    if (change && isClosed(project, change, opts)) findings.push(`${l.key} still waits on change ${l.waitsOn}, which is closed. The change has run, so the row should name its feature.`);
    else if (change && need.has(l.key)) waiting.push({ key: l.key, change: l.waitsOn });
  } else if (l.features.some((x) => /^waits\b/i.test(x))) findings.push(`${l.key}: a row that waits on a change reads "waits on change" and the change's 3-digit number, such as "waits on change 004", and nothing else.`);
  else if (l.features.length !== 1) findings.push(`${l.key} should name exactly one feature. It names ${l.features.length}.`);
  else if (!ids.includes(l.features[0])) findings.push(`${l.key} goes to ${l.features[0]}, which isn't in the catalog.`);
  return findings;
}

// The feature that owns each thing's first action, the one that makes it, as its row in section 5 names it. A
// recommendation that names a feature names this one. It isn't known while that row names no feature of its own.
function firstOwners(model: DataModel, listed: ListedRow[], good: (l: ListedRow) => boolean): Map<string, FirstOwner> {
  const firstOwner = new Map<string, FirstOwner>();
  for (const [thing, t] of things(model)) {
    const first = t.actions[0];
    if (!first) continue;
    const action = cell(first.Action).text;
    const row = listed.find((l) => l.key === keyOf(first._file, thing, action));
    if (row && good(row)) firstOwner.set(thing, { feature: row.features[0], action });
  }
  return firstOwner;
}

// One row to settle at the gate: its two answers, each yes or no, give the recommendation, as feature-author's step 6
// says.
function recommendationFindings(key: string, r: Row, ids: string[], firstOwner: Map<string, FirstOwner>, open: OpenRow[]): string[] {
  const prd = cellText(r['PRD says it?']).toLowerCase();
  const big = cellText(r['Big enough?']).toLowerCase();
  const recommended = cellText(r.Recommended).replace(/\.$/, '');
  open.push({ key, recommended });
  const rule = RECOMMENDED.find((x) => x.prd === prd && x.big === big);
  if (!rule) return [`${key}: "PRD says it?" and "Big enough?" should each be yes or no.`];
  const m = recommended.match(rule.re);
  if (!m) return [`${key}: "PRD says it?" is ${prd}, and "Big enough?" is ${big}. So the recommendation is "${rule.says}", as feature-author's step 6 says.${/F-nn/.test(rule.says) ? ' F-nn is the feature that owns the thing\'s first action.' : ''}`];
  if (m[1] && !ids.includes(m[1])) return [`${key}: its recommendation names ${m[1]}, which isn't in the catalog.`];
  if (m[1]) {
    const owner = firstOwner.get(cellText(r.Thing));
    if (owner && m[1] !== owner.feature) return [`${key}: its recommendation names ${m[1]}, but ${owner.feature} owns ${owner.action}, the thing's first action. So the recommendation names ${owner.feature}.`];
  }
  return [];
}

// The rows to settle at the gate: one for each open row, with its two answers and the recommendation they give.
function settleFindings(toSettle: Row[], openKeys: string[], ids: string[], firstOwner: Map<string, FirstOwner>, open: OpenRow[]): string[] {
  const findings: string[] = [];
  const settleOf = new Map<string, Row[]>();
  for (const r of toSettle) {
    const key = rowKey(r);
    if (!settleOf.has(key)) settleOf.set(key, []);
    settleOf.get(key)!.push(r);
  }
  for (const [key, rs] of settleOf) {
    if (!openKeys.includes(key)) findings.push(`${key} is listed to settle at the gate, but its row in section 5 doesn't show "?".`);
    if (rs.length > 1) findings.push(`${key} is listed ${rs.length} times to settle at the gate. It needs exactly one row.`);
  }
  for (const key of openKeys) {
    const r = (settleOf.get(key) || [])[0];
    if (!r) {
      findings.push(`${key} shows "?", but the rows to settle at the gate don't list it with a recommendation.`);
      open.push({ key, recommended: null });
      continue;
    }
    findings.push(...recommendationFindings(key, r, ids, firstOwner, open));
  }
  return findings;
}

// Section 5: every action and every move in the data model files, one row each, in the files' order, and the one
// feature it belongs to, the change it waits on, or "?" until the gate settles it. Each one is named "{file}, {thing},
// {action or move}".
function dataModelCoverage(t: string, model: DataModel, ids: string[], project: string, opts: PathOptions): DataModelCoverage {
  const findings = acceptedFindings(model);
  const wanted = actionsAndMoves(model).map((a) => ({ key: keyOf(a.file, a.thing, a.name), kind: a.kind }));
  const all = tableUnder(t, 'Data model coverage');
  if (all === null) {
    findings.push('There is no "Data model coverage" section, so no action or move has a feature.');
    return { findings, wanted: wanted.length, covered: 0, waiting: [], open: [] };
  }
  // The section holds two tables: one row for each action and move, and the rows to settle at the gate.
  const listed = readListed(all.filter((r) => 'Feature' in r));
  const toSettle = all.filter((r) => 'Recommended' in r);
  const need = countKeys(wanted);
  const have = countKeys(listed);
  const good = (l: ListedRow) => l.features.length === 1 && ids.includes(l.features[0]);
  let covered = 0;
  for (const [key, n] of need) {
    const h = have.get(key) || 0;
    const kind = wanted.find((w) => w.key === key)!.kind;
    if (!h) findings.push(`${key}: this ${kind} has no row.`);
    else if (h !== n) findings.push(`${key} has ${h} rows. It needs ${n === 1 ? 'exactly one' : n}.`);
    else if (listed.filter((l) => l.key === key).every(good)) covered += n;
  }
  // An open row, which shows "?", is neither a finding nor covered either.
  const waiting: WaitingRow[] = [];
  const openKeys: string[] = [];
  for (const l of listed) {
    if (!need.has(l.key)) findings.push(`${l.key} isn't an action or a move in the data model files, word for word.`);
    if (l.open && need.has(l.key)) openKeys.push(l.key);
    findings.push(...featureCellFindings(l, need, ids, project, opts, waiting));
  }
  // The rows follow the files' order. Each one is placed by its first row.
  const order = [...new Set(listed.map((l) => l.key).filter((k) => need.has(k)))];
  const expected = [...need.keys()].filter((k) => have.has(k));
  const at = order.findIndex((k, i) => k !== expected[i]);
  if (at >= 0) findings.push(`The rows aren't in the data model files' order: "${order[at]}" comes where "${expected[at]}" should.`);

  const open: OpenRow[] = [];
  findings.push(...settleFindings(toSettle, openKeys, ids, firstOwners(model, listed, good), open));
  return { findings, wanted: wanted.length, covered, waiting, open };
}

// ---------------------------------------------------------------- the checks

function oneFeatureFindings(f: Row, ids: string[], reqIds: Map<string, PrdRequirement>, prdHeadings: Set<string>, last: { n: number }): string[] {
  const findings: string[] = [];
  const id = cellText(f['Feature ID']);
  const at = id || `A feature under "${f._heading}"`;
  const m = id.match(/^F-(\d{2,})$/);
  if (!m) findings.push(`${at}: its ID should be F- and a two-digit number, such as F-03.`);
  else {
    if (Number(m[1]) <= last.n) findings.push(`${id} is out of order, or used twice: IDs run on from F-01.`);
    last.n = Number(m[1]);
  }
  if (!prdHeadings.has(f._heading)) findings.push(`${at} sits under "${f._heading}", which isn't a heading of the PRD.`);
  for (const [col, label] of REQUIRED_CELLS) {
    if (!cellText(f[col])) findings.push(`${at} has no ${label}.`);
  }
  const dw = words(cellText(f['Done when (observable)']));
  const desc = words(cellText(f['Description (what it is)']));
  if (dw.size && [...dw].every((w) => desc.has(w))) findings.push(`${at}: its "Done when" only repeats its description; it must add at least one condition.`);
  const covers = cellItems(f['Covers (source IDs)']);
  if (!covers.length) findings.push(`${at} covers no requirement.`);
  for (const c of covers) {
    if (!reqIds.has(c) && !GAP.test(c)) findings.push(`${at} covers ${c}, which isn't in the PRD.`);
    else if (reqIds.has(c) && !reqIds.get(c)!.isRequirement) findings.push(`${at} covers ${c}, which is a ${reqIds.get(c)!.kind} row, not a requirement.`);
  }
  const priority = cellText(f.Priority);
  if (!(PRIORITIES as readonly string[]).includes(priority) && !GAP.test(priority)) findings.push(`${at}: its priority is "${priority}"; it should be Must, Should, Could or Won't.`);
  const basis = cellText(f.Basis);
  if (!BASES.some((b) => basis.startsWith(`${b} — `)) && !GAP.test(basis)) findings.push(`${at}: its basis should be one from the fixed list, then " — " and one clause, such as "Penalty — paying an unapproved claim breaks the expense policy".`);
  for (const d of cellItems(f['Depends on'])) if (!ids.includes(d)) findings.push(`${at} depends on ${d}, which isn't in the catalog.`);
  const cap = cellText(f.Capability);
  if (cap && !/^FRD-\d+[a-z] \S/.test(cap)) findings.push(`${at}: its capability should be FRD-, the PRD section number and a letter, then a name, such as "FRD-3a Claim approval".`);
  return findings;
}

function featuresCheck(features: Row[], ids: string[], reqIds: Map<string, PrdRequirement>, prdHeadings: Set<string>): Check {
  const last = { n: 0 };
  const findings = features.flatMap((f) => oneFeatureFindings(f, ids, reqIds, prdHeadings, last));
  if (!features.length) findings.push('There is no feature.');
  return { name: 'Features', findings };
}

function piecesCheck(features: Row[], pieces: Row[], ids: string[]): Check {
  const findings: string[] = [];
  const byFeature = new Map<string, { n: number; piece: string }[]>();
  // Each feature's pieces sit under its own heading, "{Feature ID} {Feature}", so a reader sees them together.
  const headingOf = new Map(features.map((f) => [cellText(f['Feature ID']), `${cellText(f['Feature ID'])} ${cellText(f.Feature)}`]));
  for (const p of pieces) {
    const pid = cellText(p['Piece ID']);
    const m = pid.match(/^(F-\d{2,})\.dw(\d+)$/);
    if (!m) { findings.push(`"${pid}" isn't a piece ID, such as F-03.dw1.`); continue; }
    if (!ids.includes(m[1])) findings.push(`${pid} belongs to ${m[1]}, which isn't in the catalog.`);
    else if (cellText(p._heading) !== headingOf.get(m[1])) findings.push(`${pid} should sit under its feature's own heading, "${headingOf.get(m[1])}".`);
    if (!byFeature.has(m[1])) byFeature.set(m[1], []);
    byFeature.get(m[1])!.push({ n: Number(m[2]), piece: cellText(p.Piece) });
  }
  for (const f of features) {
    const id = cellText(f['Feature ID']);
    const mine = byFeature.get(id) || [];
    if (!mine.length) { findings.push(`${id} has no pieces.`); continue; }
    if (mine.some((p, i) => p.n !== i + 1)) findings.push(`${id}: its pieces should run from dw1 onward, in order, with no gaps.`);
    if (!piecesFit(cellText(f['Done when (observable)']), mine.map((p) => p.piece))) findings.push(`${id}: its pieces don't give back its "Done when", in its own words and order.`);
  }
  return { name: '"Done when" pieces', findings };
}

// Only Requirement rows need a feature. A Purpose, Scope or Way of working row needs none.
function coveringFeatures(reqs: PrdRequirement[], features: Row[]): Map<string, string[]> {
  const covering = new Map(reqs.filter((r) => r.isRequirement).map((r) => [cellText(r.ID), [] as string[]]));
  for (const f of features) for (const c of cellItems(f['Covers (source IDs)'])) if (covering.has(c)) covering.get(c)!.push(cellText(f['Feature ID']));
  return covering;
}

function coverageCheck(t: string, covering: Map<string, string[]>, reqIds: Map<string, PrdRequirement>): Check {
  const coverage = tableUnder(t, 'Coverage check') || [];
  const rowOf = new Map(coverage.map((r) => [cellText(r['Requirement ID']), r]));
  const findings: string[] = [];
  for (const [req, fids] of covering) {
    const row = rowOf.get(req);
    if (!row) { findings.push(`${req} has no row in the coverage check.`); continue; }
    const listed = cellItems(row['Covered by']).filter((x) => /^F-\d/.test(x)).sort();
    if (listed.join() !== fids.slice().sort().join()) findings.push(`${req}: "Covered by" lists ${listed.join(', ') || 'nothing'}, but the features that cover it are ${fids.join(', ') || 'none'}.`);
    const status = cellText(row.Status);
    if (fids.length && !/^(Covered|Partial)\b/.test(status)) findings.push(`${req} is covered, so its status should be Covered or Partial.`);
    if (!fids.length && !(/^Gap\b/.test(status) && /question \d+/i.test(status))) findings.push(`${req}: no feature covers it, so it is a Gap that names its question.`);
  }
  for (const r of rowOf.keys()) {
    if (reqIds.has(r) && !reqIds.get(r)!.isRequirement) findings.push(`${r} is a ${reqIds.get(r)!.kind} row, not a requirement, so it needs no row.`);
    else if (!covering.has(r)) findings.push(`The coverage check lists ${r}, which isn't in the PRD.`);
  }
  return { name: 'Coverage', findings };
}

function dataModelCoverageCheck(coverage: DataModelCoverage, doc: LoadedDocument): Check {
  // The catalog's guard: the gate settles every "?" before the catalog is accepted.
  if (doc.status === 'accepted') {
    for (const o of coverage.open) coverage.findings.push(`${o.key} still shows "?", but the catalog is accepted. The gate settles every "?" before the catalog is accepted.`);
  }
  return { name: 'Data model coverage', findings: coverage.findings };
}

// Text copied exactly from the PRD is the PRD's words, not the catalog's. On a first run the PRD comes before the
// Glossary, and it is never rewritten to match it ("Agreed words" in _shared/conventions.md), so the scan skips two
// copies: a level-3 heading that is a PRD section's heading, word for word, and a coverage check row's requirement
// title that is its PRD title, word for word. Text copied exactly from the data model is skipped the same way, as
// check-frd.ts skips it: a row of section 5 whose data model file, thing, and action or move are an action or a
// move of the data model files, word for word. Both of section 5's tables copy them. Each copy is blanked, so line
// numbers stay the same. Everything else, a copy that differs included, is scanned.
function ownWords(t: string, reqs: PrdRequirement[], prdHeadings: Set<string>, model: DataModel): string {
  const titles = new Map<string, string>();
  for (const r of reqs) {
    const m = r.simple.match(/^\*\*(.+?)\*\* — /);
    if (m) titles.set(cellText(r.ID), m[1]);
  }
  const dmKeys = new Set(actionsAndMoves(model).map((a) => keyOf(a.file, a.thing, a.name)));
  let section = '';
  return t.split('\n').map((l) => {
    const h = l.match(/^(#{2,3}\s+)(.*?)\s*$/);
    if (h) {
      if (/^##\s/.test(l)) section = normalize(h[2]);
      return /^###\s/.test(l) && prdHeadings.has(h[2]) ? `${h[1]}${blank(h[2])}` : l;
    }
    const copied = section === 'data model coverage' && l.match(/^(\|\s*)([^|]*?)(\s*\|\s*)([^|]*?)(\s*\|\s*)([^|]*?)(\s*\|.*)$/);
    if (copied && dmKeys.has(`${fileName(copied[2])}, ${copied[4]}, ${copied[6]}`)) {
      const [, a, file, b, thing, c, name, rest] = copied;
      return `${a}${blank(file)}${b}${blank(thing)}${c}${blank(name)}${rest}`;
    }
    const row = section === 'coverage check' && l.match(/^(\|\s*(\S+?)\s*\|\s*)(.*?)(\s*\|.*)$/);
    return row && titles.get(row[2]) === row[3] ? `${row[1]}${blank(row[3])}${row[4]}` : l;
  }).join('\n');
}

function glossaryWordsCheck(own: string, project: string, opts: PathOptions): Check {
  const hits = scan(own, retiredWords(project, opts), currentTerms(project, opts), 'feature-catalog');
  return { name: 'Glossary words', findings: hits.map((h) => `Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`) };
}

// ---------------------------------------------------------------- what the gate shows

function holdsOf(features: Row[], pieces: Row[], covering: Map<string, string[]>, coverage: DataModelCoverage): string[] {
  const count = (p: string) => features.filter((f) => cellText(f.Priority) === p).length;
  return [
    `${plural(features.length, 'feature')}: ${PRIORITIES.map((p) => `${count(p)} ${p}`).join(', ')}`,
    plural(pieces.length, '"Done when" piece'),
    plural(new Set(features.map((f) => cellText(f.Capability)).filter(Boolean)).size, 'capability').replace(/capabilitys$/, 'capabilities'),
    `${[...covering.values()].filter((v) => v.length).length} of ${plural(covering.size, 'requirement')} covered`,
    `${coverage.covered} of ${coverage.wanted} actions and moves in the data model have a feature, ${openCount(coverage.open.length)} "?", and ${waitCount(coverage.waiting.length)} on a change`,
  ];
}

// The catalog's guard. Each row that still shows "?" is shown at the gate, with its recommendation. Before the
// catalog is accepted, it is never a finding. Each row that waits on a change is shown too. It is never a finding.
function coverageNotices(coverage: DataModelCoverage, doc: LoadedDocument): string[] {
  const notices: string[] = [];
  if (coverage.open.length && doc.status !== 'accepted') {
    notices.push(`This Feature catalog can't be accepted yet: ${coverage.open.length === 1 ? '1 row of section 5 still shows' : `${coverage.open.length} rows of section 5 still show`} "?". The gate settles each one first. The recommendation for each:`);
    notices.push(...coverage.open.map((o) => `- ${o.key}: ${o.recommended || 'no recommendation yet'}`));
  }
  if (coverage.waiting.length) {
    notices.push(`Waiting on a change, so no feature yet: ${coverage.waiting.length}. Each one gets its feature when its change runs feature-author:`);
    notices.push(...coverage.waiting.map((w) => `- ${w.key}: waits on change ${w.change}`));
  }
  return notices;
}

// One capability per feature: its name and its description, each to look at. One behaviour per piece: a piece with two
// gets a rule for each in the FRD (atomic-rules.md, part 3).
function onePerRowNoticesOf(features: Row[], pieces: Row[]): string[] {
  const ofFeature = (col: string, kind: 'name' | 'statement') => features.map((f) => ({ id: cellText(f['Feature ID']), text: cellText(f[col]), kind }));
  return [
    ...onePerRowNotices(onePerRow(ofFeature('Feature', 'name')), 'feature name'),
    ...onePerRowNotices(onePerRow(ofFeature('Description (what it is)', 'statement')), 'feature description'),
    ...onePerRowNotices(onePerRow(pieces.map((p) => ({ id: cellText(p['Piece ID']), text: cellText(p.Piece), kind: 'statement' as const }))), '"Done when" piece'),
  ];
}

// A capability is one FRD (feature-author, FR-7): one for each PRD section, unless the section holds two sets of
// rules that don't depend on each other. Each section with more than one is shown to look at, never a finding.
function splitSectionNotices(features: Row[]): string[] {
  const bySection = new Map<string, string[]>();
  for (const cap of new Set(features.map((f) => cellText(f.Capability)))) {
    const n = (cap.match(/^FRD-(\d+)[a-z] /) || [])[1];
    if (n) bySection.set(n, [...(bySection.get(n) || []), cap]);
  }
  const split = [...bySection].filter(([, caps]) => caps.length > 1);
  if (!split.length) return [];
  return [
    `One FRD for each PRD section, to look at: ${plural(split.length, 'PRD section')} ${split.length === 1 ? 'has' : 'have'} more than one capability. Keep a split only when each part holds rules that don't depend on the other's, and different people act in each.`,
    ...split.map(([n, caps]) => `- section ${n}: ${caps.join(', ')}`),
  ];
}

// ---------------------------------------------------------------- the check

export function check(project: string, opts: PathOptions = {}): CheckResult {
  const doc = load(project, 'feature-catalog', {}, opts);
  const prd = load(project, 'prd', {}, opts);
  // The data model is required. A missing things file, or a missing data model file, stops the check with exit code 2.
  const model = loadDataModel(project, opts);
  const t = doc.text;

  // The PRD's requirements, and the headings they sit under.
  const reqs = requirementsOf(prd.text);
  const reqIds = new Map(reqs.map((r) => [cellText(r.ID), r]));
  const prdHeadings = new Set(reqs.map((r) => r._heading));
  const features = (tableUnder(t, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const ids = features.map((f) => cellText(f['Feature ID']));
  const pieces = tableUnder(t, '"Done when" pieces') || [];
  const covering = coveringFeatures(reqs, features);

  const checks: Check[] = [
    { name: 'Opening', findings: opening(t) },
    { name: 'Sections', findings: sections(t, 'feature-catalog') },
    featuresCheck(features, ids, reqIds, prdHeadings),
    piecesCheck(features, pieces, ids),
    coverageCheck(t, covering, reqIds),
  ];
  const coverage = dataModelCoverage(t, model, ids, project, opts);
  checks.push(dataModelCoverageCheck(coverage, doc));
  checks.push(glossaryWordsCheck(ownWords(t, reqs, prdHeadings, model), project, opts));
  checks.push({ name: 'Placeholders', findings: placeholders(t) });
  checks.push({ name: 'Display', findings: rendering(t) });
  const writing = simpleWriting(t, { project, output: opts.output });
  checks.push({ name: 'Simple writing', findings: writing.findings });
  const graded = questions(project, opts);
  checks.push({ name: 'Question log', findings: questionFindingsFor(doc, graded) });

  const notices = [...coverageNotices(coverage, doc), ...writing.notices, ...onePerRowNoticesOf(features, pieces), ...splitSectionNotices(features)];
  return { doc, checks, holds: holdsOf(features, pieces, covering, coverage), graded, notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-features.ts --project <p>');
  const date = textOption(args, 'date') ?? today();
  const out = report({ program: programName(import.meta.filename), date, ...check(project, { output: args.output }) });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
