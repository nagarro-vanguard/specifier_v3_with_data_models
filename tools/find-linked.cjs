#!/usr/bin/env node
'use strict';
// find-linked.cjs — lists everything linked to what a change lands on, so nothing affected is missed.
//
//   node tools/find-linked.cjs --project <p> --change <nnn>
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
// Exit codes: 0 written; 1 an ID in section 6 is in no document, each listed, and nothing is written; 2 the change,
// its report, the map or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const tm = require('./traceability-map.cjs');

// Links followed from the item linked to, back to the item that links: "covers" from a requirement to its features.
const BACK = ['traces', 'covers', 'tells', 'proves', 'names-rule', 'names-row'];
// Links followed forward, from the item that links: "has-piece" from a feature to its pieces.
const FORWARD = ['has-piece', 'has-rule', 'in-frd', 'in-epic'];
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none\b/i.test(x));

// Every document drafted since it was last accepted, or never accepted: its text differs from its latest saved copy.
function drafted(project, opts) {
  const latest = tm.latestAccepted(project, opts);
  const out = [];
  for (const kind of Object.keys(tm.EXTRACT)) {
    for (const m of rp.matches(project, kind, opts)) {
      const text = rp.readText(m.abs);
      const v = latest.get(m.rel);
      const copy = v && rp.pathOf(project, 'version-copy', { document: m.rel.replace(/\.(md|json)$/, ''), n: v }, opts);
      if (copy && fs.existsSync(copy) && rp.readText(copy) === text) continue;
      out.push({ ...m, kind, text });
    }
  }
  return out;
}

// The map's items and links, with those of the drafted documents added.
function working(project, opts) {
  const mapFile = rp.pathOf(project, 'traceability-map', {}, opts);
  if (!fs.existsSync(mapFile)) throw new rp.LayoutError(`There is no Traceability map yet: ${mapFile}. It is built at every acceptance.`);
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  const known = new Map(map.items.map((i) => [i.id, i]));
  const links = [...map.links];
  for (const d of drafted(project, opts)) {
    const add = {
      item(id, type) { if (!known.has(id)) known.set(id, { id, type, document: d.rel }); },
      link(from, to, type) { if (!links.some((l) => l.from === from && l.to === to && l.type === type)) links.push({ from, to, type }); },
    };
    tm.EXTRACT[d.kind](d.text, add, d.values);
  }
  return { known, links };
}

function linked(project, change, opts = {}) {
  const c = cd.changeOf(project, change, opts);
  if (!fs.existsSync(c.report)) throw new rp.LayoutError(`The change has no report yet: ${c.report}`);
  const { known, links } = working(project, opts);
  const report = rp.readText(c.report);
  const starts = [];
  for (const r of md.tableUnder(report, 'Where it lands') || []) {
    for (const col of ['Requirement', 'Feature', 'FRD', 'EPIC', 'Data model']) for (const id of items(r[col])) if (!starts.includes(id)) starts.push(id);
  }
  const missing = starts.filter((id) => !known.has(id));
  if (missing.length) return { change: c, findings: missing.map((id) => `${id}, in section 6, isn't in the Traceability map or in any drafted document.`), rows: [] };

  const next = new Map();
  const add = (from, to, type) => { if (!next.has(from)) next.set(from, []); next.get(from).push({ to, type }); };
  for (const l of links) {
    if (BACK.includes(l.type)) add(l.to, l.from, l.type);
    if (FORWARD.includes(l.type)) add(l.from, l.to, l.type);
  }
  const rows = starts.map((id) => ({ id, through: 'where the change lands' }));
  const seen = new Set(starts);
  const queue = [...starts];
  while (queue.length) {
    const id = queue.shift();
    for (const n of next.get(id) || []) {
      if (seen.has(n.to) || !known.has(n.to)) continue;
      seen.add(n.to);
      rows.push({ id: n.to, through: `${n.type}, from ${id}` });
      queue.push(n.to);
    }
  }
  // Grouped by document, in the order the documents are first reached; in the order reached within each.
  for (const r of rows) Object.assign(r, { type: known.get(r.id).type, document: known.get(r.id).document });
  const docs = [...new Set(rows.map((r) => r.document))];
  rows.sort((a, b) => docs.indexOf(a.document) - docs.indexOf(b.document));
  return { change: c, findings: [], rows };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true) rp.fail('Use: node tools/find-linked.cjs --project <p> --change <nnn>', 2);
  const r = linked(args.project, change, { output: args.output });
  if (r.findings.length) {
    process.stdout.write(`${cd.plural(r.findings.length, 'finding')}:\n${r.findings.map((f) => `- ${f}`).join('\n')}\n`);
    return 1;
  }
  cd.replaceSection(r.change.report, 'Linked items', ['| Item | Type | Linked through |', '|---|---|---|', ...r.rows.map((x) => `| ${x.id} | ${x.type} | ${x.through} |`)]);
  process.stdout.write(`find-linked.cjs: change ${r.change.number}, ${cd.plural(r.rows.length, 'linked item')}, written to section 12.\n`);
  return 0;
}

module.exports = { linked, working };

if (require.main === module) rp.run(main);
