#!/usr/bin/env node
'use strict';
// check-data-information.cjs — checks one document of the Data and Information workflows before its gate, and prints
// the three blocks the gate needs.
//
//   node tools/check-data-information.cjs --project <p> --document <data-model|data-dictionary|state-models|data-flows|interfaces>
//
// On every document: the opening blocks; every section of its template, in order, with none of its own; every answer
// is "per" its source, "TBD, question {n}", or "Does not apply:" and the reason; no placeholder is left; nothing breaks
// the markdown; and grade-questions.cjs finds nothing wrong with the questions this document raised.
//
// Then, within each model and against the ones before it (_shared/data-information.md):
//   data-model       every entity links to its Glossary definition; every Glossary object is an entity, an
//                    attribute's "From the Glossary", or Not data; every value-set is an attribute of the entity it
//                    belongs to, or Not data; every attribute a section draft noticed on an entity is carried by one of
//                    its attributes; every attribute has its evidence and an entity in the Entities; every
//                    relationship says how many, in both directions, and every Glossary "contains" or "reveals" link
//                    between two entities is one; every entity has its metadata; and "The workflows that follow" says
//                    whether state-model-workflow and data-flow-workflow run, naming the state attributes when
//                    state-model-workflow does
//   data-dictionary  one entry for every attribute in the data model, and none it hasn't got; an attribute that holds
//                    a Glossary value-set names it; a composite is made of attributes in the data model
//   state-models     a model for every attribute the data model names as a state; every value of its value-set is a
//                    state; the starting state is one of its states; every move joins two of its states
//   data-flows       every external, process and data store has a data flow; every process has one in and one out;
//                    every data flow starts or ends at a process, and names data in the data model
//   interfaces       one interface for every external in the data flows; every element that passes in or out, or is
//                    checked, is in the Data Dictionary
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the document, a document it is checked
// against, or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const di = require('./lib/data-information.cjs');
const inventory = require('./build-data-inventory.cjs');

const DOCUMENTS = ['data-model', 'data-dictionary', 'state-models', 'data-flows', 'interfaces'];
const WORKFLOWS = ['state-model-workflow', 'data-flow-workflow'];
const HOW_MANY = /^(exactly 1|0 or 1|1 or more|0 or more)\b/i;
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const key = (s) => di.plain(s).toLowerCase();
const rows = (text, heading) => md.tableUnder(text, heading) || [];
const settled = (cell) => /\bTBD, question \d+/.test(di.plain(cell)) || /^Does not apply: \S/.test(di.plain(cell));
// "Result → Repository": the two ends of an arrow.
const ends = (cell) => { const p = di.plain(cell).split(/\s*(?:→|->)\s*/); return p.length === 2 ? p : null; };
// The first name in a cell, before any comma: "Coupling, Proposed (needs confirmation), question 6" is Coupling.
const firstName = (cell) => di.linkText(cell).split(',')[0].trim();

// Every cell in a column that must be an answer: "per" its source, TBD and its question, or Does not apply and why.
function answers(list, columns, label) {
  const f = [];
  for (const r of list) for (const c of columns) {
    const p = di.answerProblem(r[c]);
    if (p) f.push(`${label(r)}, ${c}: ${p}.`);
  }
  return f;
}

function common(doc, template) {
  return [
    { name: 'Opening', findings: cd.opening(doc.text) },
    { name: 'Sections', findings: di.sections(doc.text, template) },
  ];
}

// The data model's attributes, each with its ID: the entity, a dot, and its name.
function attributesOf(dataModelText) {
  return rows(dataModelText, 'Attributes').map((a) => ({ ...a, id: `${di.plain(a.Entity)}.${di.plain(a.Attribute)}` }));
}

function entitiesOf(dataModelText) {
  return rows(dataModelText, 'Entities').map((e) => ({ ...e, name: di.linkText(e.Entity) }));
}

// The Data Dictionary's entries, each with its ID: the entity, a dot, and the attribute.
function elementsOf(dictionaryText) {
  return rows(dictionaryText, 'Elements').map((e) => ({ ...e, id: `${di.plain(e.Entity)}.${di.plain(e.Attribute)}` }));
}

function dataModel(project, doc, opts) {
  const t = doc.text;
  const inv = inventory.build(project, opts);
  const entities = entitiesOf(t);
  const attributes = attributesOf(t);
  const rels = rows(t, 'Relationships');
  const meta = rows(t, 'Metadata');
  const notData = rows(t, 'Not data');
  const chain = rows(t, 'The workflows that follow');
  const isEntity = new Set(entities.map((e) => key(e.name)));
  const fromGlossary = new Map(attributes.map((a) => [key(firstName(a['From the Glossary'])), a]));
  const notDataSet = new Set(notData.map((n) => key(n['Glossary term'])));

  const sorting = [];
  for (const o of inv.objects) {
    const k = key(o.term);
    const places = [isEntity.has(k), fromGlossary.has(k), notDataSet.has(k)].filter(Boolean).length;
    if (!places) sorting.push(`The Glossary object ${o.term} is not an entity, not an attribute's "From the Glossary", and not under Not data.`);
    else if (places > 1) sorting.push(`The Glossary object ${o.term} is placed more than once: it is exactly one of an entity, an attribute or not data.`);
  }
  for (const v of inv.valueSets) {
    const a = fromGlossary.get(key(v.name));
    if (!a && !notDataSet.has(key(v.name))) sorting.push(`The value-set ${v.name} is not an attribute's "From the Glossary", and not under Not data.`);
    else if (a && v.belongsToKind === 'object' && isEntity.has(key(v.belongsTo)) && key(a.Entity) !== key(v.belongsTo)) sorting.push(`The value-set ${v.name} belongs to ${v.belongsTo} in the Glossary, but its attribute ${a.id} is on ${di.plain(a.Entity)}.`);
  }
  for (const n of notData) if (!di.plain(n.Why)) sorting.push(`Not data, ${di.plain(n['Glossary term'])}: says no reason.`);

  const ent = [];
  if (!entities.length) ent.push('The Entities table is empty.');
  for (const e of entities) if (!/\]\([^)]*glossary\//.test(String(e.Entity))) ent.push(`${e.name}: links to its definition in the Glossary.`);
  ent.push(...answers(entities, ['Identifier', 'Starts when', 'Ends when'], (e) => e.name));

  const att = [];
  const seen = new Set();
  for (const a of attributes) {
    if (!NAME.test(di.plain(a.Attribute))) att.push(`${a.id}: an attribute's name is in lowercase, with hyphens between words.`);
    if (seen.has(a.id)) att.push(`${a.id} is listed twice.`);
    seen.add(a.id);
    if (!isEntity.has(key(a.Entity))) att.push(`${a.id}: its entity, ${di.plain(a.Entity)}, isn't in the Entities.`);
    if (!/"[^"]+"\s*,?\s*\S/.test(di.plain(a.Evidence))) att.push(`${a.id}, Evidence: the exact words that name it, in quotes, then where they are.`);
  }
  for (const n of inv.attributesNoticed) {
    if (!isEntity.has(key(n.belongsTo))) continue;
    const carried = attributes.some((a) => key(a.Entity) === key(n.belongsTo) && `${di.plain(a.Attribute)} ${di.plain(a.Evidence)}`.toLowerCase().includes(n.phrase.toLowerCase()));
    if (!carried) att.push(`The section draft ${n.section} noticed "${n.phrase}" on ${n.belongsTo}, but no attribute of ${n.belongsTo} carries it.`);
  }

  const rel = [];
  const pair = new Set();
  for (const r of rels) {
    const e = ends(r.Relationship);
    if (!e) { rel.push(`"${di.plain(r.Relationship)}": a relationship reads "{entity} → {other entity}".`); continue; }
    pair.add(`${key(e[0])}>${key(e[1])}`);
    for (const x of e) if (!isEntity.has(key(x))) rel.push(`${e[0]} → ${e[1]}: ${x} isn't in the Entities.`);
    if (!settled(r['How many']) && !HOW_MANY.test(di.plain(r['How many']))) rel.push(`${e[0]} → ${e[1]}, How many: exactly 1, 0 or 1, 1 or more, or 0 or more.`);
  }
  for (const r of rels) {
    const e = ends(r.Relationship);
    if (e && !pair.has(`${key(e[1])}>${key(e[0])}`)) rel.push(`${e[0]} → ${e[1]} has no row the other way, ${e[1]} → ${e[0]}.`);
  }
  rel.push(...answers(rels, ['How many'], (r) => di.plain(r.Relationship)));
  for (const l of inv.relationships) {
    if (!['contains', 'reveals'].includes(l.relation) || !isEntity.has(key(l.parent)) || !isEntity.has(key(l.child))) continue;
    if (!pair.has(`${key(l.parent)}>${key(l.child)}`)) rel.push(`The Glossary says ${l.parent} ${l.relation} ${l.child}, and both are entities, but the Relationships don't say how many.`);
  }

  const mt = [];
  const metaOf = new Set(meta.map((m) => key(m.Entity)));
  for (const e of entities) if (!metaOf.has(key(e.name))) mt.push(`${e.name} has no row in the Metadata.`);
  mt.push(...answers(meta, ['Recorded', 'Restrictions', 'Security, privacy or audit'], (m) => di.plain(m.Entity)));

  const ch = [];
  for (const w of WORKFLOWS) {
    const r = chain.find((c) => di.plain(c.Workflow) === w);
    if (!r) { ch.push(`${w} has no row.`); continue; }
    if (!/^(Runs|Does not run)$/.test(di.plain(r.Runs))) ch.push(`${w}: Runs is "Runs" or "Does not run".`);
    if (!di.plain(r.Why)) ch.push(`${w}: says no reason.`);
  }
  const states = stateAttributes(t);
  if (runs(t, 'state-model-workflow')) {
    if (!states.length) ch.push('state-model-workflow runs, so its "Why" names every attribute whose values are states, by ID.');
    for (const s of states) if (!seen.has(s)) ch.push(`state-model-workflow names ${s}, which isn't in the Attributes.`);
  }

  const checks = [
    ...common(doc, 'data-model'),
    { name: 'Sorting', findings: sorting },
    { name: 'Entities', findings: ent },
    { name: 'Attributes', findings: att },
    { name: 'Relationships', findings: rel },
    { name: 'Metadata', findings: mt },
    { name: 'The workflows that follow', findings: ch },
  ];
  const holds = [
    `${cd.plural(entities.length, 'entity').replace(/entitys$/, 'entities')}, ${cd.plural(attributes.length, 'attribute')}, ${cd.plural(new Set([...pair].map((p) => p.split('>').sort().join('|'))).size, 'relationship')}`,
    `${cd.plural(notData.length, 'Glossary term')} not data`,
    `The workflows that follow: ${chain.map((c) => `${di.plain(c.Workflow)} ${di.plain(c.Runs).toLowerCase()}`).join('; ')}`,
  ];
  return { checks, holds };
}

// Whether the data model's "The workflows that follow" says a workflow runs.
function runs(dataModelText, workflow) {
  const r = rows(dataModelText, 'The workflows that follow').find((c) => di.plain(c.Workflow) === workflow);
  return Boolean(r) && di.plain(r.Runs) === 'Runs';
}

// The attribute IDs the data model's "The workflows that follow" names for state-model-workflow.
function stateAttributes(dataModelText) {
  const r = rows(dataModelText, 'The workflows that follow').find((c) => di.plain(c.Workflow) === 'state-model-workflow');
  if (!r) return [];
  return [...new Set((di.plain(r.Why).match(/\b[A-Z][A-Za-z ]*?\.[a-z0-9-]+\b/g) || []).map((s) => s.trim()))];
}

function dataDictionary(project, doc, opts) {
  const t = doc.text;
  const model = di.load(project, 'data-model', opts).text;
  const inv = inventory.build(project, opts);
  const modelAttrs = attributesOf(model);
  const ids = modelAttrs.map((a) => a.id);
  const entries = elementsOf(t);
  const have = new Map(entries.map((e) => [e.id, e]));
  const cov = [];
  for (const id of ids) if (!have.has(id)) cov.push(`${id} is in the data model, but has no entry.`);
  for (const id of have.keys()) if (!ids.includes(id)) cov.push(`${id} has an entry, but isn't in the data model.`);
  const items = answers(entries, ['Meaning', 'Allowed values', 'Can be left out', 'Repeats'], (e) => e.id);
  const lists = [];
  for (const a of modelAttrs) {
    const vs = inv.valueSets.find((v) => key(v.name) === key(firstName(a['From the Glossary'])));
    const e = have.get(a.id);
    if (!vs || !e || settled(e['Allowed values'])) continue;
    if (!key(e['Allowed values']).includes(key(vs.name))) lists.push(`${a.id}, Allowed values: names the Glossary's ${vs.name}, whose values stay in the Glossary.`);
  }
  const comp = [];
  const composites = rows(t, 'Composite elements');
  for (const c of composites) for (const p of di.items(c['Made of, in order'])) if (!ids.includes(p)) comp.push(`${di.plain(c.Composite)}: ${p} isn't in the data model.`);
  const checks = [
    ...common(doc, 'data-dictionary'),
    { name: 'Every attribute', findings: cov },
    { name: 'Items', findings: items },
    { name: 'Value-sets', findings: lists },
    { name: 'Composite elements', findings: comp },
  ];
  const tbd = entries.filter((e) => /\bTBD, question \d+/.test(di.plain(e['Allowed values']))).length;
  const holds = [`${cd.plural(entries.length, 'element')}, ${tbd} with allowed values still to settle`, cd.plural(composites.length, 'composite element')];
  return { checks, holds };
}

function stateModels(project, doc, opts) {
  const t = doc.text;
  const model = di.load(project, 'data-model', opts).text;
  const inv = inventory.build(project, opts);
  const wanted = stateAttributes(model);
  const listed = rows(t, 'Entities that move through states').map((l) => ({ ...l, id: `${di.plain(l.Entity)}.${di.plain(l['State held in'])}` }));
  const parts = rows(t, 'Each model');
  const cov = [];
  const heldIn = new Set(listed.map((l) => l.id));
  for (const id of wanted) if (!heldIn.has(id)) cov.push(`The data model names ${id} as a state, but it has no row here.`);
  for (const id of heldIn) if (!wanted.includes(id)) cov.push(`${id} has a row, but the data model doesn't name it as a state.`);
  const items = answers(listed, ['Starts in', 'Ends in', 'Can go back or skip'], (l) => di.plain(l.Entity));
  const modelF = [];
  const modelAttrs = attributesOf(model);
  for (const l of listed) {
    const entity = di.plain(l.Entity);
    const stateRows = parts.filter((p) => key(p._heading) === key(entity) && 'State' in p);
    const moves = parts.filter((p) => key(p._heading) === key(entity) && 'Move' in p);
    if (!stateRows.length) { modelF.push(`${entity} has no states under its heading in Each model.`); continue; }
    const names = new Set(stateRows.map((s) => key(s.State)));
    const a = modelAttrs.find((x) => x.id === l.id);
    const vs = a && inv.valueSets.find((v) => key(v.name) === key(firstName(a['From the Glossary'])));
    if (vs) for (const v of vs.values) if (!names.has(key(v))) modelF.push(`${entity}: the Glossary's ${vs.name} holds ${v}, which isn't one of its states.`);
    const start = di.plain(l['Starts in']).replace(/,?\s*per\b.*$/i, '');
    if (!/\bTBD\b/.test(start) && !names.has(key(start))) modelF.push(`${entity}: it starts in ${start}, which isn't one of its states.`);
    if (!moves.length) modelF.push(`${entity} has no moves.`);
    for (const m of moves) {
      const e = ends(m.Move);
      if (!e) { modelF.push(`${entity}: "${di.plain(m.Move)}": a move reads "{state} → {state}".`); continue; }
      for (const s of e) if (!names.has(key(s))) modelF.push(`${entity}: the move ${e[0]} → ${e[1]} names ${s}, which isn't one of its states.`);
    }
    modelF.push(...answers(stateRows, ['What can be done in it'], (s) => `${entity}, ${di.plain(s.State)}`));
    modelF.push(...answers(moves, ['Event', 'Condition', 'Actions'], (m) => `${entity}, ${di.plain(m.Move)}`));
  }
  const checks = [...common(doc, 'state-models'), { name: 'Every state attribute', findings: cov }, { name: 'Items', findings: items }, { name: 'Each model', findings: modelF }];
  const holds = [cd.plural(listed.length, 'state model'), cd.plural(parts.filter((p) => 'Move' in p).length, 'move')];
  return { checks, holds };
}

function dataFlows(project, doc, opts) {
  const t = doc.text;
  const model = di.load(project, 'data-model', opts).text;
  const entities = new Set(entitiesOf(model).map((e) => key(e.name)));
  const attrs = new Set(attributesOf(model).map((a) => a.id));
  const externals = rows(t, 'Externals');
  const processes = rows(t, 'Processes');
  const stores = rows(t, 'Data stores');
  const flows = rows(t, 'Data flows').map((f) => ({ ...f, ends: ends(f.Moves) }));
  const ext = new Set(externals.map((e) => key(e.External)));
  const proc = new Set(processes.map((p) => key(p.Process)));
  const store = new Set(stores.map((s) => key(s['Data store'])));
  const nodes = [];
  for (const e of externals) if (!['Person', 'Organization', 'System'].includes(di.plain(e.Kind))) nodes.push(`${di.plain(e.External)}, Kind: Person, Organization or System.`);
  for (const p of processes) {
    if (!/^P\d+$/.test(di.plain(p.Process))) nodes.push(`${di.plain(p.Process)}: a process's ID is P and a number.`);
    if (di.plain(p.Name).split(/\s+/).length < 2) nodes.push(`${di.plain(p.Process)}, Name: a verb and a noun.`);
  }
  for (const s of stores) if (!entities.has(key(s.Entity))) nodes.push(`${di.plain(s['Data store'])}: its entity, ${di.plain(s.Entity)}, isn't in the data model.`);
  const fl = [];
  const known = (x) => ext.has(key(x)) || proc.has(key(x)) || store.has(key(x));
  for (const f of flows) {
    const name = di.plain(f['Data flow']);
    if (!f.ends) { fl.push(`${name}, Moves: reads "{from} → {to}".`); continue; }
    for (const x of f.ends) if (!known(x)) fl.push(`${name}: ${x} isn't an external, a process or a data store.`);
    if (!proc.has(key(f.ends[0])) && !proc.has(key(f.ends[1]))) fl.push(`${name} neither starts nor ends at a process.`);
    const data = di.items(f.Data);
    if (!data.length) fl.push(`${name}, Data: names no entity or attribute.`);
    for (const d of data) if (!entities.has(key(d)) && !attrs.has(d)) fl.push(`${name}, Data: ${d} isn't an entity or attribute in the data model.`);
  }
  const from = (x) => flows.filter((f) => f.ends && key(f.ends[0]) === key(x));
  const to = (x) => flows.filter((f) => f.ends && key(f.ends[1]) === key(x));
  for (const e of externals) if (!from(e.External).length && !to(e.External).length) fl.push(`The external ${di.plain(e.External)} has no data flow.`);
  for (const s of stores) if (!from(s['Data store']).length && !to(s['Data store']).length) fl.push(`The data store ${di.plain(s['Data store'])} has no data flow.`);
  for (const p of processes) {
    if (!to(p.Process).length) fl.push(`The process ${di.plain(p.Process)} has no data flow in.`);
    if (!from(p.Process).length) fl.push(`The process ${di.plain(p.Process)} has no data flow out.`);
  }
  const level1 = di.sectionText(t, 'Level 1 diagram') || '';
  const dia = [];
  if (!/```mermaid/.test(di.sectionText(t, 'Context diagram') || '')) dia.push('The context diagram has no diagram.');
  if (processes.length > 1 && !/```mermaid/.test(level1)) dia.push('The product has more than one process, so the level 1 diagram is drawn.');
  if (processes.length <= 1 && !/```mermaid/.test(level1) && !/Does not apply: \S/.test(level1)) dia.push('The level 1 diagram is drawn, or says "Does not apply:" and why.');
  const checks = [...common(doc, 'data-flows'), { name: 'Externals, processes and stores', findings: nodes }, { name: 'Data flows', findings: fl }, { name: 'Diagrams', findings: dia }];
  const holds = [`${cd.plural(externals.length, 'external')}, ${cd.plural(processes.length, 'process').replace(/processs$/, 'processes')}, ${cd.plural(stores.length, 'data store')}`, cd.plural(flows.length, 'data flow')];
  return { checks, holds };
}

const INTERFACE_ITEMS = ['Who uses it', 'Why it is needed', 'What passes in', 'What passes out', 'How much', 'When, and how often', 'Checks on what comes in', 'What starts an exchange', 'When an exchange fails'];

function interfaces(project, doc, opts) {
  const t = doc.text;
  const flowsText = di.load(project, 'data-flows', opts).text;
  const dictionary = new Set(elementsOf(di.load(project, 'data-dictionary', opts).text).map((e) => e.id));
  const entities = new Set(entitiesOf(di.load(project, 'data-model', opts).text).map((e) => key(e.name)));
  const externals = rows(flowsText, 'Externals').map((e) => di.plain(e.External));
  const list = rows(t, 'The interfaces');
  const parts = rows(t, 'Each interface');
  const cov = [];
  for (const e of externals) if (!list.some((l) => key(l.External) === key(e))) cov.push(`The external ${e} has no interface.`);
  for (const l of list) {
    if (!/^IF-\d+$/.test(di.plain(l.Interface))) cov.push(`${di.plain(l.Interface)}: an interface's ID is IF- and a number.`);
    if (!externals.some((e) => key(e) === key(l.External))) cov.push(`${di.plain(l.Interface)}: ${di.plain(l.External)} isn't an external in the data flows.`);
  }
  const each = [];
  for (const l of list) {
    const id = di.plain(l.Interface);
    const mine = parts.filter((p) => di.plain(p._heading).startsWith(`${id} `));
    if (!mine.length) { each.push(`${id} has no part under Each interface.`); continue; }
    for (const item of INTERFACE_ITEMS) {
      const r = mine.find((p) => di.plain(p.Item) === item);
      if (!r) { each.push(`${id} has no row "${item}".`); continue; }
      if (['What passes in', 'What passes out'].includes(item) && !settled(r.Answer)) {
        const xs = di.items(r.Answer);
        if (!xs.length) each.push(`${id}, ${item}: is blank.`);
        for (const x of xs) if (!dictionary.has(x) && !entities.has(key(x))) each.push(`${id}, ${item}: ${x} isn't in the Data Dictionary or the data model.`);
      } else if (item === 'Checks on what comes in' && !settled(r.Answer)) {
        const xs = di.items(r.Answer);
        if (!xs.length) each.push(`${id}, ${item}: is blank.`);
        for (const x of xs) {
          const el = x.split(':')[0].trim();
          if (!dictionary.has(el)) each.push(`${id}, ${item}: each check starts with a Data Dictionary element; "${el}" isn't one.`);
        }
      } else {
        const p = di.answerProblem(r.Answer);
        if (p) each.push(`${id}, ${item}: ${p}.`);
      }
    }
  }
  const checks = [...common(doc, 'interfaces'), { name: 'Every external', findings: cov }, { name: 'Each interface', findings: each }];
  return { checks, holds: [cd.plural(list.length, 'interface')] };
}

const BY_DOCUMENT = { 'data-model': dataModel, 'data-dictionary': dataDictionary, 'state-models': stateModels, 'data-flows': dataFlows, interfaces };

function check(project, document, opts = {}) {
  if (!DOCUMENTS.includes(document)) throw new rp.LayoutError(`--document is one of: ${DOCUMENTS.join(', ')}.`);
  const doc = di.load(project, document, opts);
  const r = BY_DOCUMENT[document](project, doc, opts);
  r.checks.push({ name: 'Placeholders', findings: cd.placeholders(doc.text) });
  r.checks.push({ name: 'Display', findings: cd.rendering(doc.text) });
  let graded = null;
  const log = rp.pathOf(project, 'question-log', {}, opts);
  if (fs.existsSync(log)) {
    graded = cd.questions(project, opts);
    r.checks.push({ name: 'Question log', findings: cd.questionFindingsFor(doc, graded) });
  }
  return { doc, checks: r.checks, holds: r.holds, graded };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true || !args.document || args.document === true) rp.fail(`Use: node tools/check-data-information.cjs --project <p> --document <${DOCUMENTS.join('|')}>`, 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, args.document, { output: args.output });
  const out = cd.report({ program: 'check-data-information.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check, stateAttributes, runs, WORKFLOWS };

if (require.main === module) rp.run(main);
