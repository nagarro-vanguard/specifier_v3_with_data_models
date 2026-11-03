// track-change.ts — keeps each open change's progress up to date.
//
//   node tools/track-change.ts --project <p>
//
// accept.ts runs it at every acceptance. For each change whose report is accepted and whose progress isn't closed:
//   1. when the change has no progress yet, it writes changes/{change}/progress.md, from the option chosen at the
//      report's gate, in section 16:
//      - Run the path: one row for each document the recommendation sends work to, as recommend.ts gives it at the
//        moment the report is accepted, which is the section 15 check-change-report.ts compared
//      - Insert it, or Copy the wording: one row for each document the small update writes in
//      - Re-run the whole workflow: one row for each document accepted so far, except the Question log and the
//        changes' reports
//      - Close it: no rows
//      Each row keeps the document's latest accepted version at the start. A document that doesn't exist yet, such as
//      a new FRD, is written as such, and counts as accepted when a document of its kind is accepted for the first time.
//      Work for data-model-workflow gets one row for each data model file it is sent to, and one for the things file:
//      - a data model row, or a thing, judged to change: the data model file that holds it
//      - a renamed word: each data model file that uses it
//      - "Ask n": the data model file of each thing or row the ask lands on, in section 6. When it lands on none, the
//        row reads "a data model file", and counts as accepted when any data model file is accepted after the start.
//   2. marks each row accepted once a later version of its document is in the Version log
//   3. when every row is accepted, closes the change through close-change.ts
//
// progress.md is generated. Its parts each have one writer: track-change.ts writes the rows, insert-answer.ts and
// copy-wording.ts write "Places written", and close-change.ts closes it.
//
// Exports: track(project, opts), updates every open change; read(file), a change's progress; logRows(project, opts),
// the Version log's rows.
//
// Exit codes: 0 done; 2 the project or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import { parseArgs, requireOption, textOption, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { identify, matches, pathOf, projectDir, readText, relOf, type PathOptions } from './lib/run-paths.ts';
import { list, tableUnder, type Cell } from './lib/md-tables.ts';
import { epicOf } from './lib/check-document.ts';
import { read as readReport, type ChangeReport } from './lib/change-report.ts';
import { readThings } from './lib/data-model.ts';
import { plural } from './lib/text.ts';
import { recommendation, storyListOf, STEPS, type RecommendRow, type StepItem } from './recommend.ts';
import { working, type WorkingSet } from './find-linked.ts';
// close-change.ts imports this file too. Neither uses the other while it loads, so the cycle is safe.
import { close, type CloseOptions } from './close-change.ts';

const USE = 'Use: node tools/track-change.ts --project <p>';

// The row a document that doesn't exist yet is written as, by its kind.
const NEW = { frd: 'a new FRD', 'story-list': "a new EPIC's Story list", 'data-model': 'a data model file' } as const;
type NewKind = keyof typeof NEW;
// The documents a step writes one of for each item, rather than one for the whole product.
const PER_ITEM: readonly string[] = ['frd', 'epic-brief', 'story-list', 'data-model'];
// The documents a re-run of the whole workflow leaves out.
const NOT_RERUN: readonly string[] = ['question-log', 'change-impact-report'];

// One row of a change's progress: a document, the steps it is for, its version at the start, and its status.
export interface ProgressRow {
  document: string;
  for: string[];
  // A version number, or "none" when the document didn't exist at the start.
  start: number | string;
  status: string;
}

// A change's progress, as progress.md holds it.
export interface Progress {
  text: string;
  head: string[];
  rows: ProgressRow[];
  places: string[] | null;
  closed: boolean;
  entriesAtStart: number;
}

// One row of the Version log.
export interface LogRow {
  version: number;
  rel: string;
}

const oneLine = (cell: Cell | undefined): string => list(cell).map((x) => x.trim()).join(' ').trim();
const isDataModelFile = (rel: string | undefined): boolean => Boolean(rel && identify(rel)?.document === 'data-model');

// The data model file each thing's own part is in, from the things file: a Map from the thing to the file's path in
// the project.
function thingFiles(project: string, opts: PathOptions): Map<string, string> {
  const file = pathOf(project, 'data-model-things', {}, opts);
  const out = new Map<string, string>();
  if (!fs.existsSync(file)) return out;
  for (const f of readThings(file).families) {
    for (const t of f.things) out.set(oneLine(t.Thing), relOf('data-model', { family: f.value }));
  }
  return out;
}

// The data model files one item of data-model-author's row is written in.
function dataModelFilesOf(item: StepItem, ctx: WorkingSet, files: Map<string, string>): string[] {
  if (item.documents) return item.documents;
  if (item.document && isDataModelFile(item.document)) return [item.document];
  if (files.has(item.id)) return [files.get(item.id)!];
  const out: string[] = [];
  for (const id of item.lands || []) {
    const known = ctx.known.get(id);
    if (known && isDataModelFile(known.document)) out.push(known.document);
    else if (files.has(id)) out.push(files.get(id)!);
  }
  return out.length ? out : [NEW['data-model']];
}

// The FRD an item of frd-author's row is written in: its own, the FRD its ask lands on, or a new one.
function frdOf(item: StepItem, ctx: WorkingSet): string {
  const own = item.document && identify(item.document)?.document === 'frd' ? item.document : null;
  const landed = (item.lands || []).map((id) => ctx.known.get(id)).find((x) => x && x.type === 'FRD');
  return own || landed?.document || NEW.frd;
}

// The Story list an item of a stories-workflow row is written in: its own, the list of the EPIC its ask lands on, or a
// new one.
function storyListFor(project: string, item: StepItem, opts: PathOptions): string {
  const own = storyListOf(project, item);
  if (own) return own;
  const landed = (item.lands || []).find((id) => /^EPIC-\d{3}$/.test(id));
  return (landed && relOf('story-list', { product: project, epic: epicOf(project, landed, opts).folder })) || NEW['story-list'];
}

// The Version log's rows, in the order they were written.
export function logRows(project: string, opts: PathOptions): LogRow[] {
  const file = pathOf(project, 'version-log', {}, opts);
  if (!fs.existsSync(file)) return [];
  return readText(file).split(/\r?\n/).map((l) => l.split('|').slice(1, -1).map((c) => c.trim())).filter((c) => c.length > 1 && /^\d+$/.test(c[0])).map((c) => ({ version: Number(c[0]), rel: c[1] }));
}

// The document each item of a recommendation's row is written in.
function documentsOf(project: string, row: RecommendRow, ctx: WorkingSet, opts: PathOptions): string[] {
  const s = STEPS[row.key];
  if (!PER_ITEM.includes(s.doc)) return [relOf(s.doc, { product: project })];
  if (s.doc === 'data-model') {
    const files = thingFiles(project, opts);
    return row.items.flatMap((it) => dataModelFilesOf(it, ctx, files));
  }
  if (s.doc === 'frd') return row.items.map((it) => frdOf(it, ctx));
  if (s.doc === 'epic-brief') return row.items.map((it) => relOf('epic-brief', { product: project, epic: epicOf(project, it.id, opts).folder }));
  return row.items.map((it) => storyListFor(project, it, opts));
}

// The progress's rows, from the option chosen at the report's gate.
function rowsFor(project: string, r: ChangeReport, opts: PathOptions): ProgressRow[] {
  const latest = new Map<string, number>();
  for (const x of logRows(project, opts)) latest.set(x.rel, x.version);
  const rows: ProgressRow[] = [];
  const add = (rel: string, why: string) => {
    let row = rows.find((x) => x.document === rel);
    if (!row) { row = { document: rel, for: [], start: latest.get(rel) || 'none', status: 'pending' }; rows.push(row); }
    if (!row.for.includes(why)) row.for.push(why);
  };
  if (r.choice === 'Run the path') {
    const o = recommendation(project, r.change.number, opts);
    const ctx = working(project, opts);
    for (const row of o.rows) {
      for (const rel of documentsOf(project, row, ctx, opts)) add(rel, `${row.workflow === 'on its own' ? '' : `${row.workflow}, `}${row.step}`);
    }
  } else if (r.choice === 'Insert it' || r.choice === 'Copy the wording') {
    const o = recommendation(project, r.change.number, opts);
    const offer = o.offers.find((x) => x.choice === r.choice);
    if (offer) for (const p of offer.places) add(p.rel, `${offer.program}, ${offer.what}`);
  } else if (r.choice === 'Re-run the whole workflow') {
    for (const rel of latest.keys()) {
      const id = identify(rel);
      if (id && !NOT_RERUN.includes(id.document)) add(rel, 'the whole workflow, from requirements-workflow, step 1');
    }
  }
  return rows;
}

function write(file: string, r: ChangeReport, head: string[], rows: ProgressRow[], places: string[] | null): void {
  const out = [
    `# Change ${r.change.number} — ${r.name.charAt(0).toUpperCase()}${r.name.slice(1)}: progress`,
    '',
    'Written by track-change.ts at every acceptance. insert-answer.ts and copy-wording.ts write "Places written", and close-change.ts closes it. Never edit it by hand.',
    '',
    ...head,
    '',
    '## Documents',
    '',
  ];
  if (!rows.length) out.push('None: nothing needs to change.');
  else out.push('| # | Document | For | Version at the start | Status |', '|---|---|---|---|---|', ...rows.map((x, i) => `| ${i + 1} | ${x.document} | ${x.for.map((f) => `• ${f}`).join('<br>')} | ${x.start} | ${x.status} |`));
  out.push('', '## Places written', '', ...(places || ['None yet.']), '');
  fs.writeFileSync(file, out.join('\n'));
}

// Lines without the blank lines at their start and end.
function trimBlank(lines: string[]): string[] {
  const out = [...lines];
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

export function read(file: string): Progress {
  const text = readText(file);
  const all = text.split(/\r?\n/);
  const head = trimBlank(all.slice(all.findIndex((l) => /^Status: /.test(l)), all.findIndex((l) => /^## Documents/.test(l))));
  const rows = (tableUnder(text, 'Documents') || []).map((x) => ({ document: oneLine(x.Document), for: list(x.For).map((f) => f.trim()), start: oneLine(x['Version at the start']), status: oneLine(x.Status) }));
  const p = all.findIndex((l) => /^## Places written/.test(l));
  const places = p < 0 ? null : trimBlank(all.slice(p + 1));
  return { text, head, rows, places, closed: /^Status: closed/m.test(text), entriesAtStart: Number(text.match(/^- \*\*Version log entries at the start:\*\* (\d+)/m)?.[1]) || 0 };
}

// Marks each pending row accepted once a later version of its document is logged.
function update(rows: ProgressRow[], log: LogRow[], entriesAtStart: number): void {
  const latest = new Map<string, number>();
  for (const x of log) latest.set(x.rel, x.version);
  const before = new Set(log.slice(0, entriesAtStart).map((x) => x.rel));
  for (const row of rows) {
    if (row.status !== 'pending') continue;
    const kind = (Object.keys(NEW) as NewKind[]).find((k) => NEW[k] === row.document);
    if (kind) {
      // A new FRD or Story list: the first of its kind accepted since the start. A data model file not known at the
      // start: any data model file accepted since the start.
      const fits = (x: LogRow) => identify(x.rel)?.document === kind && (kind === 'data-model' || !before.has(x.rel));
      const first = log.slice(entriesAtStart).find(fits);
      if (first) row.status = `accepted: ${first.rel}, version ${latest.get(first.rel)}`;
      continue;
    }
    const v = latest.get(row.document);
    if (v && (row.start === 'none' || v > Number(row.start))) row.status = `accepted, version ${v}`;
  }
}

export function track(project: string, opts: CloseOptions = {}): string[] {
  const out: string[] = [];
  const log = logRows(project, opts);
  for (const m of matches(project, 'change-impact-report', opts)) {
    const r = readReport(project, String(m.values.change), opts);
    if (r.status !== 'accepted') continue;
    const file = pathOf(project, 'change-progress', { change: r.change.folder }, opts);
    if (!fs.existsSync(file)) {
      if (!r.choice || r.choice === 'Correct the analysis') { out.push(`- change ${r.change.number}: accepted with no choice to track, in section 16.`); continue; }
      const head = ['Status: open', '', `- **Decision:** ${r.choice}, per Decision ${r.decision}`, `- **Version log entries at the start:** ${log.length}`];
      write(file, r, head, rowsFor(project, r, opts), null);
    }
    const p = read(file);
    if (p.closed) continue;
    update(p.rows, log, p.entriesAtStart);
    write(file, r, p.head, p.rows, p.places);
    const pending = p.rows.filter((x) => x.status === 'pending').length;
    if (pending) { out.push(`- change ${r.change.number}: ${pending} of ${plural(p.rows.length, 'document')} still pending.`); continue; }
    const c = close(project, r.change.number, opts);
    out.push(`- change ${r.change.number}: ${c.message}`);
  }
  return out;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const dir = projectDir(project, args);
  if (!fs.existsSync(dir)) fail(`The project folder doesn't exist: ${dir}`, 2);
  const out = track(project, { output: args.output, date: textOption(args, 'date') });
  process.stdout.write(`${programName(import.meta.filename)}:${out.length ? `\n${out.join('\n')}` : ' no open change.'}\n`);
  return 0;
}

if (import.meta.main) runMain(main);
