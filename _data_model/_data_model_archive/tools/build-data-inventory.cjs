#!/usr/bin/env node
'use strict';
// build-data-inventory.cjs — Concept Modelling, run inside the Glossary run: reads everything the Glossary holds so
// far into one inventory, so data-model-workflow starts from it and nothing the Glossary settled is asked again.
//
//   node tools/build-data-inventory.cjs --project <p>
//
// glossary-author runs it after each section draft, and again when the seven pages are written. Each run rebuilds the
// inventory in full from whatever exists:
//   - from each section draft in deep-dives/: its candidates, with their quotes, by kind; the relationships Topology
//     found; the states and flow links Choreography found; and its "Attributes noticed"
//   - from the seven pages, once written: the agreed terms, which then replace the section drafts' candidates; each
//     object's definition, source and the term above it; each role and step; each value-set, the term it belongs to
//     and its values; the lookup of terms that belong in more than one place; and the earlier words, so a section
//     draft's old word is read as the agreed one
//
// What it writes: data/inventory.json, a generated file. Never edit it by hand.
// What it prints: the counts, then what the data model must settle that the Glossary leaves open:
//   - value-sets with no values
//   - value-sets that belong to a step, a role or nothing, rather than an object
//   - states a section draft found that no value-set holds
//   - objects the Glossary places under nothing
//   - the attributes the section drafts noticed
//
// Exit codes: 0 written; 2 the project, the layout, or every section draft and page is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const di = require('./lib/data-information.cjs');
const cd = require('./lib/check-document.cjs');

const has = (row, ...cols) => cols.every((c) => c in row);
const key = (s) => di.plain(s).toLowerCase();
const KINDS = { Objects: 'object', Roles: 'role', Steps: 'step', 'States and values': 'value-set' };

function read(project, document, opts) {
  const file = rp.pathOf(project, document, {}, opts);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

// "part of a [Project](#project)", "a kind of [Finding](#finding)", "shown when a [Domain](#domain) is opened",
// "created by [Finding](#finding)": the term above, and how it relates.
function above(cell) {
  const raw = Array.isArray(cell) ? cell.join(' ') : String(cell || '');
  const m = raw.match(/\[([^\]]+)\]\(([^)]*)\)/);
  if (!m) return null;
  const t = di.plain(raw).toLowerCase();
  const relation = /^part of/.test(t) ? 'contains' : /kind of/.test(t) ? 'kind of' : /shown when/.test(t) ? 'reveals' : /created by/.test(t) ? 'produces' : null;
  return relation ? { relation, term: m[1].trim() } : null;
}

// A section draft's candidate tables sit under bold labels, such as "**Objects.**", in part 1.
function candidates(text) {
  const out = [];
  let kind = null;
  let cols = null;
  for (const line of text.split(/\r?\n/)) {
    const label = line.match(/^\*\*(Objects|Roles|Steps|States and values)\.\*\*/);
    if (label) { kind = KINDS[label[1]]; cols = null; continue; }
    if (/^#/.test(line)) { kind = null; cols = null; continue; }
    if (!kind || !line.trim().startsWith('|')) { if (!line.trim()) continue; cols = null; continue; }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (!cols) { cols = cells; continue; }
    if (/^:?-{2,}/.test(cells[0])) continue;
    const row = Object.fromEntries(cols.map((c, i) => [c, cells[i] || '']));
    if (row.Candidate && !/^none\.?$/i.test(di.plain(row.Candidate))) out.push({ kind, ...row });
  }
  return out;
}

function build(project, opts = {}) {
  const pages = {
    objects: read(project, 'object-terms', opts),
    values: read(project, 'states-and-values', opts),
    roles: read(project, 'role-terms', opts),
    steps: read(project, 'step-terms', opts),
    relationships: read(project, 'terms-and-relationships', opts),
  };
  const drafts = rp.matches(project, 'section-glossary', opts).map((d) => ({ section: d.values.section, rel: d.rel, text: fs.readFileSync(d.abs, 'utf8') }));
  const fromPages = Boolean(pages.objects && pages.values);
  if (!fromPages && !drafts.length) throw new rp.LayoutError('The Glossary run hasn\'t started: there is no section draft and no Glossary page.');

  // Earlier words, from every page's "Terms replaced or retired over time": the section drafts still use them.
  const retired = new Map();
  for (const t of Object.values(pages)) {
    for (const r of di.allRows(t)) {
      if (!has(r, 'Earlier word', 'Use now')) continue;
      const now = di.items(r['Use now']);
      if (now.length === 1) retired.set(key(r['Earlier word']), now[0]);
    }
  }
  const canon = (term) => retired.get(key(term)) || di.plain(term);

  const objects = new Map();
  const roles = new Map();
  const steps = new Map();
  const valueSets = [];
  const relationships = [];
  const flow = [];
  const stateFragments = [];
  const attributesNoticed = [];

  if (fromPages) {
    for (const r of di.allRows(pages.objects)) {
      if (!has(r, 'Term', 'What it is') || 'Earlier word' in r) continue;
      const term = di.plain(r.Term);
      if (term && !objects.has(key(term))) objects.set(key(term), { term, definition: di.plain(r['What it is']), source: di.plain(r.Source), above: above(r['Relationship to the term above']), evidence: [] });
    }
    for (const r of di.allRows(pages.roles)) {
      if (!has(r, 'Term', 'What it is') || 'Earlier word' in r) continue;
      const term = di.plain(r.Term);
      if (term && !roles.has(key(term))) roles.set(key(term), { term, definition: di.plain(r['What it is']), source: di.plain(r.Source), above: above(r['Sits under']) });
    }
    for (const r of di.allRows(pages.steps)) {
      if (has(r, 'Term', 'What it is') && !('Earlier word' in r)) {
        const term = di.plain(r.Term);
        if (term && !steps.has(key(term))) steps.set(key(term), { term, definition: di.plain(r['What it is']), source: di.plain(r.Source) });
      }
      if (has(r, 'First', 'Relationship', 'Second')) flow.push({ first: di.plain(r.First), relation: di.plain(r.Relationship), second: di.plain(r.Second), from: 'step-terms' });
    }
    for (const r of di.allRows(pages.values)) {
      if (!has(r, 'Value-set', 'Belongs to')) continue;
      const owner = di.plain(r['Belongs to']) === '-' ? null : di.linkText(r['Belongs to']);
      valueSets.push({ name: di.plain(r['Value-set']), definition: di.plain(r['What it is']), belongsTo: owner, values: di.items(r.Values), source: di.plain(r.Source) });
    }
    for (const o of [...objects.values(), ...roles.values()]) if (o.above) relationships.push({ parent: o.above.term, relation: o.above.relation, child: o.term, from: 'the term above' });
    for (const r of di.allRows(pages.relationships)) {
      if (!has(r, 'Term', 'Shown under')) continue;
      const child = di.plain(r.Term);
      for (const p of di.items(r['Also part of'])) relationships.push({ parent: p, relation: 'contains', child, from: 'the lookup' });
      for (const p of di.items(r['Also a kind of'])) relationships.push({ parent: p, relation: 'kind of', child, from: 'the lookup' });
      for (const p of di.items(r['Also shown or created by'])) relationships.push({ parent: p, relation: 'reveals or produces', child, from: 'the lookup' });
    }
  }

  for (const d of drafts) {
    for (const c of candidates(d.text)) {
      const term = canon(c.Candidate);
      const quote = { section: d.section, quote: di.plain(c.Evidence) };
      if (c.kind === 'object') {
        if (!objects.has(key(term)) && !fromPages) objects.set(key(term), { term, definition: di.plain(c.Meaning), source: d.section, above: null, evidence: [] });
        if (objects.has(key(term))) objects.get(key(term)).evidence.push(quote);
      } else if (!fromPages && c.kind === 'role' && !roles.has(key(term))) roles.set(key(term), { term, definition: di.plain(c.Meaning), source: d.section, above: null });
      else if (!fromPages && c.kind === 'step' && !steps.has(key(term))) steps.set(key(term), { term, definition: di.plain(c.Meaning), source: d.section });
      else if (!fromPages && c.kind === 'value-set' && !valueSets.some((v) => key(v.name) === key(term))) valueSets.push({ name: term, definition: '', belongsTo: null, values: c.Meaning.split(/<br\s*\/?>/i).map((s) => di.plain(s).replace(/^[•*-]\s*/, '')).filter(Boolean), source: d.section });
    }
    for (const r of di.allRows(d.text)) {
      if (has(r, 'Belongs to', 'States', 'Evidence')) stateFragments.push({ section: d.section, belongsTo: canon(r['Belongs to']), states: di.items(r.States), evidence: di.items(r.Evidence) });
      else if (has(r, 'Phrase', 'Belongs to', 'Evidence')) attributesNoticed.push({ section: d.section, phrase: di.plain(r.Phrase), belongsTo: canon(r['Belongs to']), evidence: di.plain(r.Evidence) });
      else if (has(r, 'First', 'Relationship', 'Second')) flow.push({ first: canon(r.First), relation: di.plain(r.Relationship), second: canon(r.Second), from: d.section });
      else if (!fromPages && has(r, 'Parent', 'Relationship', 'Child')) relationships.push({ parent: canon(r.Parent), relation: di.plain(r.Relationship), child: canon(r.Child), from: d.section });
    }
  }

  const kindOf = (term) => (!term ? null : objects.has(key(term)) ? 'object' : steps.has(key(term)) ? 'step' : roles.has(key(term)) ? 'role' : 'unknown');
  for (const v of valueSets) v.belongsToKind = kindOf(v.belongsTo);

  // What the data model must settle that the Glossary leaves open.
  // A section draft lists states under the term they belong to, or under the value-set's own name.
  const valuesOf = (term) => new Set(valueSets.filter((v) => key(v.belongsTo || '') === key(term) || key(v.name) === key(term)).flatMap((v) => v.values.map(key)));
  const unheld = [];
  for (const f of stateFragments) {
    const held = valuesOf(f.belongsTo);
    const missing = f.states.filter((s) => !held.has(key(s.replace(/\s*\(.*\)\s*$/, ''))) && !held.has(key(s)));
    if (missing.length) unheld.push({ section: f.section, belongsTo: f.belongsTo, states: missing });
  }
  const open = {
    valueSetsWithoutValues: valueSets.filter((v) => !v.values.length).map((v) => v.name),
    valueSetsNotOnAnObject: valueSets.filter((v) => v.belongsToKind !== 'object').map((v) => ({ name: v.name, belongsTo: v.belongsTo, kind: v.belongsToKind })),
    statesNoValueSetHolds: unheld,
    objectsPlacedNowhere: [...objects.values()].filter((o) => !relationships.some((r) => key(r.parent) === key(o.term) || key(r.child) === key(o.term))).map((o) => o.term),
  };

  return {
    project,
    builtFrom: fromPages ? 'the Glossary pages and section drafts' : 'the section drafts only',
    objects: [...objects.values()],
    roles: [...roles.values()],
    steps: [...steps.values()],
    valueSets,
    relationships,
    flow,
    stateFragments,
    attributesNoticed,
    sectionDrafts: drafts.map((d) => d.rel),
    open,
  };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/build-data-inventory.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const opts = { output: args.output };
  if (!fs.existsSync(rp.projectDir(args.project, opts))) throw new rp.LayoutError(`The project folder doesn't exist: ${rp.projectDir(args.project, opts)}`);
  const inv = build(args.project, opts);
  const file = di.pathOf(args.project, 'data-inventory', opts);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ built: date, ...inv }, null, 2)}\n`);

  const o = inv.open;
  const out = [
    `build-data-inventory.cjs, ${date}: read the Glossary of ${args.project}, from ${inv.builtFrom}.`,
    `- ${cd.plural(inv.objects.length, 'object')}, ${cd.plural(inv.roles.length, 'role')}, ${cd.plural(inv.steps.length, 'step')}, ${cd.plural(inv.valueSets.length, 'value-set')}`,
    `- ${cd.plural(inv.relationships.length, 'structural link')}, ${cd.plural(inv.flow.length, 'flow link')}`,
    `- ${cd.plural(inv.sectionDrafts.length, 'section draft')}, with ${cd.plural(inv.stateFragments.length, 'list')} of states and ${cd.plural(inv.attributesNoticed.length, 'attribute')} noticed`,
    '',
    'For the data model to settle:',
  ];
  const list = (title, xs) => { out.push(`${title}:`, ...(xs.length ? xs.map((x) => `- ${x}`) : ['- None'])); };
  list('Value-sets with no values', o.valueSetsWithoutValues);
  list('Value-sets that belong to no object', o.valueSetsNotOnAnObject.map((v) => (v.belongsTo ? `${v.name}, on the ${v.kind} ${v.belongsTo}` : `${v.name}, on nothing`)));
  list('States a section draft found that no value-set holds', o.statesNoValueSetHolds.map((u) => `${u.belongsTo}: ${u.states.join(', ')} (section ${u.section})`));
  list('Objects the Glossary places under nothing', o.objectsPlacedNowhere);
  list('Attributes the section drafts noticed', inv.attributesNoticed.map((a) => `${a.belongsTo}: ${a.phrase}, ${a.evidence} (section ${a.section})`));
  out.push('', `Written: ${di.relOf('data-inventory')}`, '');
  process.stdout.write(out.join('\n'));
  return 0;
}

module.exports = { build };

if (require.main === module) rp.run(main);
