#!/usr/bin/env node
'use strict';
// track-change.cjs — keeps each open change's progress up to date.
//
//   node tools/track-change.cjs --project <p>
//
// accept.cjs runs it at every acceptance. For each change whose report is accepted and whose progress isn't closed:
//   1. when the change has no progress yet, it writes changes/{change}/progress.md, from the option chosen at the
//      report's gate, in section 16:
//      - Run the path: one row for each document the recommendation sends work to, as recommend.cjs gives it at the
//        moment the report is accepted, which is the section 15 check-change-report.cjs compared
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
//   3. when every row is accepted, closes the change through close-change.cjs
//
// progress.md is generated. Its parts each have one writer: track-change.cjs writes the rows, insert-answer.cjs and
// copy-wording.cjs write "Places written", and close-change.cjs closes it.
//
// Exit codes: 0 done; 2 the project or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const cr = require('./lib/change-report.cjs');
const rc = require('./recommend.cjs');
const fl = require('./find-linked.cjs');
const dm = require('./lib/data-model.cjs');

const text = (c) => md.list(c).map((x) => String(x).trim()).join(' ').trim();
const NEW = { frd: 'a new FRD', 'story-list': "a new EPIC's Story list", 'data-model': 'a data model file' };

// The data model file each thing's own part is in, from the things file: a Map from the thing to the file's path in
// the project.
function thingFiles(project, opts) {
  const file = rp.pathOf(project, 'data-model-things', {}, opts);
  const out = new Map();
  if (!fs.existsSync(file)) return out;
  for (const f of dm.readThings(file).families) {
    for (const t of f.things) out.set(text(t.Thing), rp.relOf('data-model', { family: f.value }));
  }
  return out;
}

// The data model files one item of data-model-author's row is written in.
function dataModelFilesOf(item, ctx, files) {
  const isFile = (rel) => rel && rp.identify(rel) && rp.identify(rel).document === 'data-model';
  if (item.documents) return item.documents;
  if (isFile(item.document)) return [item.document];
  if (files.has(item.id)) return [files.get(item.id)];
  const out = [];
  for (const id of item.lands || []) {
    const known = ctx.known.get(id);
    if (known && isFile(known.document)) out.push(known.document);
    else if (files.has(id)) out.push(files.get(id));
  }
  return out.length ? out : [NEW['data-model']];
}

// The Version log's rows, in the order they were written: { version, rel }.
function logRows(project, opts) {
  const file = rp.pathOf(project, 'version-log', {}, opts);
  if (!fs.existsSync(file)) return [];
  return rp.readText(file).split(/\r?\n/).map((l) => l.split('|').slice(1, -1).map((c) => c.trim())).filter((c) => c.length > 1 && /^\d+$/.test(c[0])).map((c) => ({ version: Number(c[0]), rel: c[1] }));
}

// The document each item of a recommendation's row is written in.
function documentsOf(project, row, ctx, opts) {
  const s = rc.STEPS[row.key];
  if (!s) return [];
  if (!['frd', 'epic-brief', 'story-list', 'data-model'].includes(s.doc)) return [rp.relOf(s.doc, { product: project })];
  const out = [];
  const files = s.doc === 'data-model' ? thingFiles(project, opts) : null;
  for (const it of row.items) {
    if (s.doc === 'data-model') {
      out.push(...dataModelFilesOf(it, ctx, files));
    } else if (s.doc === 'frd') {
      const frd = it.document && rp.identify(it.document) && rp.identify(it.document).document === 'frd' ? it.document : null;
      const landed = (it.lands || []).map((id) => ctx.known.get(id)).find((x) => x && x.type === 'FRD');
      out.push(frd || (landed && landed.document) || NEW.frd);
    } else if (s.doc === 'epic-brief') {
      const e = cd.epicOf(project, it.id, opts);
      out.push(rp.relOf('epic-brief', { product: project, epic: e.folder }));
    } else {
      const list = rc.storyListOf(project, it, opts);
      const landed = (it.lands || []).find((id) => /^EPIC-\d{3}$/.test(id));
      out.push(list || (landed && rp.relOf('story-list', { product: project, epic: cd.epicOf(project, landed, opts).folder })) || NEW['story-list']);
    }
  }
  return out;
}

function rowsFor(project, r, opts) {
  const latest = new Map();
  for (const x of logRows(project, opts)) latest.set(x.rel, x.version);
  const rows = [];
  const add = (rel, why) => {
    let row = rows.find((x) => x.document === rel);
    if (!row) { row = { document: rel, for: [], start: latest.get(rel) || 'none', status: 'pending' }; rows.push(row); }
    if (!row.for.includes(why)) row.for.push(why);
  };
  if (r.choice === 'Run the path') {
    const o = rc.recommendation(project, r.change.number, opts);
    const ctx = fl.working(project, opts);
    for (const row of o.rows) {
      for (const rel of documentsOf(project, row, ctx, opts)) add(rel, `${row.workflow === 'on its own' ? '' : `${row.workflow}, `}${row.step}`);
    }
  } else if (r.choice === 'Insert it' || r.choice === 'Copy the wording') {
    const o = rc.recommendation(project, r.change.number, opts);
    const offer = o.offers.find((x) => x.choice === r.choice);
    for (const p of offer ? offer.places : []) add(p.rel, `${offer.program}, ${offer.what}`);
  } else if (r.choice === 'Re-run the whole workflow') {
    for (const rel of latest.keys()) {
      const id = rp.identify(rel);
      if (id && !['question-log', 'change-impact-report'].includes(id.document)) add(rel, 'the whole workflow, from requirements-workflow, step 1');
    }
  }
  return rows;
}

function write(file, r, head, rows, places) {
  const out = [
    `# Change ${r.change.number} — ${r.name.charAt(0).toUpperCase()}${r.name.slice(1)}: progress`,
    '',
    'Written by track-change.cjs at every acceptance. insert-answer.cjs and copy-wording.cjs write "Places written", and close-change.cjs closes it. Never edit it by hand.',
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

function read(file) {
  const t = rp.readText(file);
  const all = t.split(/\r?\n/);
  const trim = (a) => { const b = [...a]; while (b.length && !b[0].trim()) b.shift(); while (b.length && !b[b.length - 1].trim()) b.pop(); return b; };
  const head = trim(all.slice(all.findIndex((l) => /^Status: /.test(l)), all.findIndex((l) => /^## Documents/.test(l))));
  const rows = (md.tableUnder(t, 'Documents') || []).map((x) => ({ document: text(x.Document), for: md.list(x.For).map((f) => String(f).trim()), start: text(x['Version at the start']), status: text(x.Status) }));
  const p = all.findIndex((l) => /^## Places written/.test(l));
  const places = p < 0 ? null : trim(all.slice(p + 1));
  return { text: t, head, rows, places, closed: /^Status: closed/m.test(t), entriesAtStart: Number((t.match(/^- \*\*Version log entries at the start:\*\* (\d+)/m) || [])[1]) || 0 };
}

// Marks each pending row accepted once a later version of its document is logged.
function update(rows, log, entriesAtStart) {
  const latest = new Map();
  for (const x of log) latest.set(x.rel, x.version);
  const before = new Set(log.slice(0, entriesAtStart).map((x) => x.rel));
  for (const row of rows) {
    if (row.status !== 'pending') continue;
    const kind = Object.keys(NEW).find((k) => NEW[k] === row.document);
    if (kind) {
      // A new FRD or Story list: the first of its kind accepted since the start. A data model file not known at the
      // start: any data model file accepted since the start.
      const fits = (x) => rp.identify(x.rel) && rp.identify(x.rel).document === kind && (kind === 'data-model' || !before.has(x.rel));
      const first = log.slice(entriesAtStart).find(fits);
      if (first) row.status = `accepted: ${first.rel}, version ${latest.get(first.rel)}`;
      continue;
    }
    const v = latest.get(row.document);
    if (v && (row.start === 'none' || v > Number(row.start))) row.status = `accepted, version ${v}`;
  }
}

function track(project, opts = {}) {
  const out = [];
  const log = logRows(project, opts);
  for (const m of rp.matches(project, 'change-impact-report', opts)) {
    const r = cr.read(project, m.values.change, opts);
    if (r.status !== 'accepted') continue;
    const file = rp.pathOf(project, 'change-progress', { change: r.change.folder }, opts);
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
    if (pending) { out.push(`- change ${r.change.number}: ${pending} of ${cd.plural(p.rows.length, 'document')} still pending.`); continue; }
    const cc = require('./close-change.cjs');
    const c = cc.close(project, r.change.number, opts);
    out.push(`- change ${r.change.number}: ${c.message}`);
  }
  return out;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/track-change.cjs --project <p>', 2);
  if (!fs.existsSync(rp.projectDir(args.project, args))) rp.fail(`The project folder doesn't exist: ${rp.projectDir(args.project, args)}`, 2);
  const out = track(args.project, { output: args.output, date: args.date && args.date !== true ? args.date : undefined });
  process.stdout.write(`track-change.cjs:${out.length ? `\n${out.join('\n')}` : ' no open change.'}\n`);
  return 0;
}

module.exports = { track, read, logRows };

if (require.main === module) rp.run(main);
