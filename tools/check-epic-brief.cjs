#!/usr/bin/env node
'use strict';
// check-epic-brief.cjs — checks an EPIC brief before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-epic-brief.cjs --project <p> --epic EPIC-002
//
// What it checks:
//   - the opening blocks, and every section of the EPIC brief template, in order, with no section of its own
//   - the EPIC is on the EPIC brief list, marked yes
//   - its hypothesis is the register row's outcome, word for word
//   - its features are its register row's, each with the catalog's name, requirements and description, and the band
//     the EPIC grouping gives it; In scope is those features, and Out of scope every other EPIC's, each with its owner
//   - "EPICs this one needs" and "EPICs that need this one" are the EPICs the register says this one depends on, and
//     that depend on it
//   - every measure has a confidence tag, and an AI-RECOMMENDED measure's baseline and target are TBD
//   - its NFR section lists only NFR IDs that are in the PRD
//   - no retired Glossary word is used, through lib/scan-retired-words.cjs
//   - no placeholder is left, and lib/md-lint.cjs finds nothing
//   - grade-questions.cjs finds nothing wrong with this brief's gaps or the questions it raised
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the brief, the register, the catalog, the
// PRD, the Glossary or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const sw = require('./lib/scan-retired-words.cjs');

const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));
const numberOf = (c) => Number((text(c).match(/^(\d+)/) || [])[1]);
const bullets = (t, heading) => cd.lines(t).filter((l, i, all) => {
  const at = all.findIndex((x) => x.line.trim() === `### ${heading}`);
  if (at < 0 || i <= at) return false;
  const end = all.findIndex((x, k) => k > at && /^#{2,3}\s/.test(x.line));
  return (end < 0 || i < end) && /^- \S/.test(l.line);
}).map((l) => l.line.replace(/^- /, '').trim());

function check(project, epic, opts = {}) {
  const e = cd.epicOf(project, epic, opts);
  const doc = cd.load(project, 'epic-brief', { epic: e.folder }, opts);
  const register = cd.load(project, 'epic-register', {}, opts);
  const grouping = cd.load(project, 'epic-grouping', {}, opts);
  const catalog = cd.load(project, 'feature-catalog', {}, opts);
  const prd = cd.load(project, 'prd', {}, opts);
  const t = doc.text;
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Opening', cd.opening(t));
  add('Sections', cd.sections(t, 'epic-brief'));

  const n = Number(e.id.slice(5));
  const listed = (md.tableUnder(grouping.text, 'EPIC brief list, in run order') || []).find((r) => numberOf(r.EPIC) === n);
  add('On the EPIC brief list', !listed ? [`${e.id} isn't on the EPIC grouping's brief list.`] : /^yes$/i.test(text(listed.Brief)) ? [] : [`The EPIC brief list says ${e.id} gets no brief.`]);

  const hyp = (t.match(/^\*\*Epic hypothesis:\*\* (.+?)\.?$/m) || [])[1];
  const outcome = text(e.row.Outcome).replace(/\.$/, '');
  add('Hypothesis', hyp === undefined ? ['There is no "Epic hypothesis" line.'] : hyp !== outcome ? [`The hypothesis isn't the register's outcome, word for word: "${outcome}".`] : []);

  // Features, scope and bands.
  const rows = md.tableUnder(register.text, 'EPICs') || [];
  const mine = items(e.row.Features);
  const byId = new Map((md.tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r).map((r) => [text(r['Feature ID']), r]));
  const defs = md.tableUnder(grouping.text, 'EPIC definitions') || [];
  const def = defs.find((d) => numberOf(d['Sl. No.']) === n);
  const bandOf = (f) => (def && items(def.MVP).includes(f) ? 'MVP' : def && items(def.Later).includes(f) ? 'Later' : '?');
  const table = md.tableUnder(t, 'Features') || [];
  const featureFindings = [];
  const listedIds = table.map((r) => text(r['Feature ID']));
  if (listedIds.slice().sort().join() !== mine.slice().sort().join()) featureFindings.push(`The features are ${listedIds.join(', ') || 'none'}; the register row has ${mine.join(', ')}.`);
  for (const r of table) {
    const f = byId.get(text(r['Feature ID']));
    if (!f) continue;
    const id = text(r['Feature ID']);
    if (text(r.Feature) !== text(f.Feature)) featureFindings.push(`${id}: its name isn't the catalog's, "${text(f.Feature)}".`);
    if (items(r['Req ID']).sort().join() !== items(f['Covers (source IDs)']).sort().join()) featureFindings.push(`${id}: its requirements aren't the ones the catalog says it covers.`);
    if (text(r['What it delivers']) !== text(f['Description (what it is)'])) featureFindings.push(`${id}: "What it delivers" isn't the catalog's description, word for word.`);
    if (text(r.Band) !== bandOf(id)) featureFindings.push(`${id}: its band is ${text(r.Band)}; the EPIC grouping puts it in ${bandOf(id)}.`);
  }
  const inScope = bullets(t, 'In').map((b) => b.split(' ')[0]);
  if (inScope.slice().sort().join() !== mine.slice().sort().join()) featureFindings.push(`In scope lists ${inScope.join(', ') || 'nothing'}; the EPIC's features are ${mine.join(', ')}.`);
  const owner = new Map();
  for (const r of rows) for (const f of items(r.Features)) owner.set(f, text(r.EPIC));
  const out = bullets(t, 'Out');
  for (const [f, o] of owner) {
    if (o === e.id) continue;
    const line = out.find((b) => b.startsWith(`${f} `));
    if (!line) featureFindings.push(`Out of scope leaves out ${f}, owned by ${o}.`);
    else if (!line.endsWith(`owned by ${o}`)) featureFindings.push(`Out of scope: ${f} is owned by ${o}.`);
  }
  add('Features and scope', featureFindings);

  // A brief written before simple-writing-rules.md names these parts Upstream and Downstream.
  const either = (name, old) => (bullets(t, name).length ? bullets(t, name) : bullets(t, old));
  const upstream = either('EPICs this one needs', 'Upstream').map((b) => b.split(' ')[0]).filter((x) => /^EPIC-/.test(x));
  const downstream = either('EPICs that need this one', 'Downstream').map((b) => b.split(' ')[0]).filter((x) => /^EPIC-/.test(x));
  const wantUp = items(e.row['Depends on']);
  const wantDown = rows.filter((r) => items(r['Depends on']).includes(e.id)).map((r) => text(r.EPIC));
  const depFindings = [];
  if (upstream.slice().sort().join() !== wantUp.slice().sort().join()) depFindings.push(`"EPICs this one needs" lists ${upstream.join(', ') || 'none'}; the register has ${wantUp.join(', ') || 'none'}.`);
  if (downstream.slice().sort().join() !== wantDown.slice().sort().join()) depFindings.push(`"EPICs that need this one" lists ${downstream.join(', ') || 'none'}; the register has ${wantDown.join(', ') || 'none'}.`);
  add('Dependencies', depFindings);

  const measures = md.tableUnder(t, 'Success or fitness criteria') || [];
  const measureFindings = [];
  for (const m of measures) {
    const c = text(m.Confidence);
    if (!/^(CONFIRMED|TENTATIVE|AI-RECOMMENDED)\b/.test(c)) measureFindings.push(`"${text(m.Measure)}" has no confidence tag.`);
    if (/^AI-RECOMMENDED/.test(c) && (!/\bTBD\b/.test(text(m.Baseline)) || !/\bTBD\b/.test(text(m.Target)))) measureFindings.push(`"${text(m.Measure)}" is AI-RECOMMENDED, so its baseline and target are TBD.`);
  }
  add('Measures', measureFindings);

  const nfrIds = new Set((md.tableUnder(prd.text, 'NFRs') || []).map((r) => text(r['NFR ID'])));
  const nfrs = (md.tableUnder(t, 'NFRs that apply') || []).map((r) => text(r['NFR ID']));
  add('NFRs that apply', nfrs.filter((x) => !nfrIds.has(x)).map((x) => `${x} isn't an NFR in the PRD.`).concat(nfrs.some((x) => !/^NFR-\d+$/.test(x)) ? ['The NFR section lists only NFR IDs, never their wording.'] : []));

  const hits = sw.scan(t, sw.retiredWords(project, opts), sw.currentTerms(project, opts), 'epic-brief');
  add('Glossary words', hits.map((h) => `Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`));
  add('Placeholders', cd.placeholders(t));
  add('Display', cd.rendering(t));
  const writing = cd.simpleWriting(t, { project, output: opts.output });
  add('Simple writing', writing.findings);
  const graded = cd.questions(project, opts);
  add('Question log', cd.questionFindingsFor(doc, graded));

  const holds = [
    `${e.id} ${e.name}: ${cd.plural(table.length, 'feature')}`,
    cd.plural(measures.length, 'success measure'),
    `${cd.plural(nfrs.length, 'NFR')} that ${nfrs.length === 1 ? 'applies' : 'apply'}`,
    `${upstream.length} upstream and ${downstream.length} downstream ${upstream.length + downstream.length === 1 ? 'EPIC' : 'EPICs'}`,
  ];
  return { doc, checks, holds, graded, notices: writing.notices };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const epic = args.values.epic;
  if (!args.project || args.project === true || !epic) rp.fail('Use: node tools/check-epic-brief.cjs --project <p> --epic EPIC-002', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, epic, { output: args.output });
  const out = cd.report({ program: 'check-epic-brief.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
