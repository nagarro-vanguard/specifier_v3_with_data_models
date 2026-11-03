#!/usr/bin/env node
'use strict';
// check-frd.cjs — the deterministic checks on one FRD, before its gate, and the three blocks the gate needs.
//
//   node tools/check-frd.cjs --project <p> --frd <file>
//
// --frd is the FRD's file, such as frd-claim-approval.md, or its path inside the project. The Feature catalog, the
// PRD and the Glossary are found through lib/run-paths.cjs, and the data model files through lib/data-model.cjs.
//
// Every check enforces a written rule, and its name says which section of frd-author's conventions it comes from,
// or the template. It adds no rule of its own. These are structure checks: they prove the document is copied,
// numbered and linked correctly, not that its rules are right; what only a reader can check is listed at the end of
// "For the person".
//
// The data model is required, as it is for check-features.cjs. Who owns each action, field and move follows the
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
// through lib/scan-retired-words.cjs. It skips a requirement's title and text copied exactly from the PRD, because the
// PRD is never rewritten to match the Glossary. It skips text copied exactly from the data model the same way: the
// rules tables in Data, and each thing with its action, field or move where the FRD names them.
//
// One behaviour per rule, from the Rules section of frd-author's conventions: a rule that may hold two behaviours is
// listed in "For the person", to look at, through lib/one-per-row.cjs. It is never a finding: only a reader can judge.
//
// The FRD guard: every Must answer question the FRD names that is still open is listed in "For the person", with a
// line saying the FRD can't be accepted until it is answered, and can be parked. An open question is never a finding.
// A question named only in Data's copy of the data model doesn't count: a rule that builds on it names it too.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the FRD, the catalog, the PRD, the
// Glossary, the data model's things file, a data model file it names, or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const sw = require('./lib/scan-retired-words.cjs');
const dm = require('./lib/data-model.cjs');
const op = require('./lib/one-per-row.cjs');

const CONVENTIONS = path.join(rp.KIT_ROOT, '.claude', 'skills', 'frd-author', 'references', 'conventions.md');
const TEMPLATE = path.join(rp.KIT_ROOT, '.claude', 'skills', '_shared', 'templates', 'frd.md');
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
];

const text = (c) => (Array.isArray(c) ? c.join('<br>') : String(c || '')).trim();
const cells = (line) => line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
const tableRows = (block) => block.filter((l) => l.startsWith('|')).slice(2).map(cells);
const ids = (s, re) => [...String(s).matchAll(re)].map((m) => m[0]);
const featIds = (s) => ids(s, /F-\d+(?![.\d])/g);
const reqIds = (s) => ids(s, /REQ-\d+\.\d+/g);
const ruleIds = (s) => ids(s, /F-\d+\.\d+/g);
const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const firstDiff = (a, b) => {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const cut = (s) => JSON.stringify(s.slice(Math.max(0, i - 25), i + 25));
  return `at character ${i}: FRD ${cut(a)}, source ${cut(b)}`;
};
const joinLines = (list) => (list.length === 1 ? list[0] : list.map((x) => `• ${x}`).join('<br>'));

// The standard questions, read from the FRD template, where they are written once.
function standardQuestions() {
  const lines = rp.readText(TEMPLATE).split('\n');
  const start = lines.findIndex((l) => /^## Standard questions/.test(l));
  const out = [];
  for (let i = start + 1; start >= 0 && i < lines.length && !/^## /.test(lines[i]); i++) {
    const m = lines[i].match(/^\d+\. \*(.+)\*$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

// The banned "how" words, read from the Rules section of frd-author's conventions.
function howWords() {
  const m = rp.readText(CONVENTIONS).match(/"how" word:\*\*([\s\S]*?)\. Rewrite/);
  return m ? m[1].split(',').map((w) => w.trim()).filter(Boolean) : null;
}

function check(project, frdArg, opts = {}) {
  const frdRel = frdArg.includes('/') ? frdArg : `frd/${frdArg}`;
  const id = rp.identify(frdRel);
  if (!id || id.document !== 'frd') throw new rp.LayoutError(`"${frdArg}" isn't an FRD's file, such as frd-claim-approval.md.`);
  const doc = cd.load(project, 'frd', id.values, opts);
  const catalogDoc = cd.load(project, 'feature-catalog', {}, opts);
  const prd = cd.load(project, 'prd', {}, opts);
  // The data model is required. A missing things file, or a missing data model file, stops the check with exit code 2.
  const model = dm.load(project, opts);
  const retired = sw.retiredWords(project, opts);
  const currentTerms = sw.currentTerms(project, opts);
  const frd = doc.text.replace(/\r\n/g, '\n');
  const lines = frd.split('\n');

  // ---------- the sources ----------
  const catalog = {};
  const moduleNames = {};
  for (const r of (md.tableUnder(catalogDoc.text, 'Feature catalog') || []).filter((x) => 'Feature ID' in x)) {
    const mod = Number((r._heading.match(/^(\d+)\./) || [])[1]);
    moduleNames[mod] = r._heading.replace(/^\d+\.\s*/, '');
    catalog[text(r['Feature ID'])] = {
      name: text(r.Feature), desc: text(r['Description (what it is)']), done: text(r['Done when (observable)']),
      reqs: reqIds(text(r['Covers (source IDs)'])), priority: text(r.Priority), deps: featIds(text(r['Depends on'])),
      capability: text(r.Capability), module: mod,
    };
  }
  const pieces = (md.tableUnder(catalogDoc.text, '"Done when" pieces') || []).map((r) => ({ dw: text(r['Piece ID']), piece: text(r.Piece) }));
  const reqs = {};
  for (const r of cd.requirementsOf(prd.text)) {
    const m = r.simple.match(/^\*\*(.+?)\*\* — (.+)$/);
    if (m) reqs[text(r.ID)] = { title: m[1], text: m[2] };
  }
  const graded = cd.questions(project, opts);
  const logQuestions = new Map((graded.questions || []).map((q) => [q.n, q]));

  // ---------- the data model ----------
  // Who owns each action, field and move: the Sources section of frd-author's conventions. An action or a move
  // belongs to the feature the catalog's section 5 gives it. Every field belongs to the feature that owns the thing's
  // first action, the one that makes it.
  const dmKey = (thing, name) => `${thing}, ${name}`;
  const fileName = (c) => text(c).replace(/^\[([^\]]*)\]\([^)]*\)$/, '$1').replace(/`/g, '').trim();
  const catalogDm = md.tableUnder(catalogDoc.text, 'Data model coverage');
  const ownerOf = new Map();
  for (const r of catalogDm || []) {
    const fids = md.list(r.Feature).map((x) => String(x).trim()).filter(Boolean);
    if (fids.length === 1) ownerOf.set(`${fileName(r['Data model file'])}, ${dmKey(text(r.Thing), text(r['Action or move']))}`, fids[0]);
  }
  const dmThings = dm.things(model);
  const thingNames = [...dmThings.keys()].sort((a, b) => b.length - a.length);
  const firstActionOwner = (thing) => {
    const first = (dmThings.get(thing) || { actions: [] }).actions[0];
    return first ? ownerOf.get(`${first._file}, ${dmKey(thing, dm.cell(first.Action).text)}`) || null : null;
  };
  // Every action, field and move in the data model files, in the files' order, with the feature that owns it.
  const dmRows = [];
  const partFile = new Map();
  for (const f of model.files) {
    for (const part of f.parts) {
      partFile.set(part, f);
      for (const t of part.tables) {
        if (!['actions', 'fields', 'moves'].includes(t.kind)) continue;
        for (const row of t.rows) {
          const name = t.kind === 'moves' ? dm.moveName(row) : dm.cell(t.kind === 'actions' ? row.Action : row.Field).text;
          const owner = t.kind === 'fields' ? firstActionOwner(part.thing) : ownerOf.get(`${f.name}, ${dmKey(part.thing, name)}`) || null;
          const cellsOf = Object.keys(row).filter((k) => !k.startsWith('_')).map((k) => dm.cell(row[k]));
          // A row waits only on a DM-n or a GC-n. The data model raises no changes to the requirements.
          dmRows.push({
            file: f.name, thing: part.thing, kind: t.kind.replace(/s$/, ''), name, key: dmKey(part.thing, name), owner,
            gaps: [...new Set(cellsOf.flatMap((c) => c.gaps))].filter((g) => /^(?:DM|GC)-\d+$/.test(g)), proposed: cellsOf.flatMap((c) => c.proposed),
          });
        }
      }
    }
  }
  const dmRowOf = (key) => dmRows.find((r) => r.key === key);
  // An action or a move whose row in the catalog's section 5 still shows "?", or waits on a change, has no feature
  // yet. Then this says why, in words. A field has no row there. It belongs to the feature of its thing's first
  // action, so that action's row says it. It is null when the row names a feature.
  const noFeatureYet = (r) => {
    const w = String(r.owner || '').match(/^waits on change (\d{3})$/);
    if (r.owner !== '?' && !w) return null;
    const says = w ? `waits on change ${w[1]}` : 'still shows "?"';
    if (r.kind !== 'field') return `Its row in section 5 of the Feature catalog ${says}.`;
    const first = dm.cell(dmThings.get(r.thing).actions[0].Action).text;
    return `A field belongs to the feature of its thing's first action, ${first}. That action's row in section 5 of the Feature catalog ${says}.`;
  };
  // Every line of every rules table, for the checks that skip text copied word for word from the data model.
  const dmTableLines = new Set();
  for (const f of model.files) for (const part of f.parts) for (const t of part.tables) if (t.kind === 'fields') t.raw.split('\n').forEach((l) => dmTableLines.add(l.trim()));

  // ---------- the FRD ----------
  const crIndex = lines.findIndex((l) => l.startsWith('## Check record'));
  const bodyLines = crIndex >= 0 ? lines.slice(0, crIndex) : lines;
  const body = bodyLines.join('\n');
  const sections = {};
  let current = '_head';
  for (const line of lines) {
    const h = line.match(/^## (.+)$/);
    if (h) current = h[1];
    (sections[current] = sections[current] || []).push(line);
  }
  const head = sections._head;
  const section = (name) => sections[Object.keys(sections).find((k) => k.startsWith(name))] || [];
  // The sub-bullets under a head line such as "- **Depends on:** ...", leaving out None.
  const under = (label) => {
    const i = head.findIndex((l) => l.startsWith(`- **${label}:**`));
    if (i < 0) return null;
    const out = [];
    for (let j = i + 1; j < head.length && /^\s{2,}- /.test(head[j]); j++) out.push(head[j].replace(/^\s*- /, '').trim());
    return out.filter((x) => !/^None\.?$/.test(x));
  };

  const h1 = lines.find((l) => l.startsWith('# ')) || '';
  const title = h1.replace(/^# /, '');
  const capName = (title.match(/^FRD-\d+[a-z] (.+)$/) || [])[1] || title;
  const dependsOn = under('Depends on') || [];
  const excludes = under('Excludes') || [];
  const lastChanged = (head.find((l) => l.startsWith('- **Last changed:**')) || '').replace('- **Last changed:**', '').trim();
  const frdReqs = head.map((l) => l.match(/^- \*\*(REQ-\d+\.\d+) (.+?)\*\* — (.+)$/)).filter(Boolean).map((m) => ({ id: m[1], title: m[2], text: m[3] }));
  const covered = tableRows(section('Features covered')).map((c) => ({ id: c[0], name: c[1], desc: c[2], reqs: reqIds(c[3]), priority: c[4] }));
  const gateRows = tableRows(section('Gates')).map((c) => ({ key: (c[0].match(/\*\*(.+?)\*\*/) || [])[1], cond: c[1], tied: c[2] || '' }));
  const gates = Object.fromEntries(gateRows.map((g) => [g.key, g.cond]));
  const actorRows = tableRows(section('Actors')).map((c) => ({ actor: c[0], does: c[1] || '' }));
  const sqRows = tableRows(section('Standard questions')).map((c) => ({ thing: c[0], question: c[1], answer: c[2] || '' }));
  // Data: a "### {Thing}" heading for each thing, then, for each data model file it comes from, a "From" line that
  // links to the file, and the rules table copied from it. Each table line keeps its index in lines.
  const dataThings = [];
  const dataStray = [];
  // The FRD's own text on each line of Data, by its index in lines. A line copied word for word from the data model
  // has none: each rules table's lines, and each "From" line, which names a data model file. A table line where a
  // decision at this gate changed a cell has only that cell, with its note. The Data check adds those lines. The
  // checks that skip text copied from the data model read the rest.
  const dataOwn = new Map();
  {
    let current = '';
    let thing = null;
    let block = null;
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
  }
  const ownText = (l, i) => (dataOwn.has(i) ? dataOwn.get(i) : l);

  // A note names the decision a rule follows: a decision at this FRD's gate, or a data model decision. It says what
  // the rule differs from: the requirement, or the data model.
  const NOTE = '<br>*Updated from the ';
  const rules = [];
  let feature = null;
  for (const line of section('Rules')) {
    const h = line.match(/^### (F-\d+) (.+)$/);
    if (h) { feature = { id: h[1], heading: h[2] }; continue; }
    if (feature && /^\| F-\d+\.\d+ \|/.test(line)) {
      const c = cells(line);
      const at = c[2].indexOf(NOTE);
      const source = at < 0 ? c[2] : c[2].slice(0, at);
      const noteRaw = at < 0 ? '' : c[2].slice(at + 4);
      const nm = noteRaw.match(/^\*Updated from the (requirement|data model) on the basis of (?:Decision (\d+)|(DM-\d+)): (.+)\.\*$/);
      rules.push({
        feature: feature.id, heading: feature.heading, id: c[0], text: c[1], source, note: noteRaw, noteFrom: nm ? nm[1] : '',
        noteDecision: nm && nm[2] ? Number(nm[2]) : 0, noteDm: nm && nm[3] ? nm[3] : '', noteText: nm ? nm[4] : '',
      });
    }
  }
  const ruleHeadings = section('Rules').map((l) => l.match(/^### (F-\d+) (.+)$/)).filter(Boolean);
  const pieceSection = section('Coverage — every Done-when');
  const coverage = tableRows(pieceSection).map((c) => ({ dw: c[0], piece: c[1], byText: c[2] || '', by: ruleIds(c[2] || ''), question: Number(((c[2] || '').match(/^question (\d+)$/i) || [])[1]) || 0 }));
  // A data model answer still open waits on a data model decision, DM-n, or a Glossary change, GC-n.
  const waitsOn = (s) => [...String(s).matchAll(/\bwaits on ((?:DM|GC)-\d+)/g)].map((m) => m[1]);
  const dmCoverage = tableRows(section('Coverage — every data model')).map((c) => ({ thing: c[0], name: c[1] || '', key: dmKey(c[0], c[1] || ''), byText: c[2] || '', by: ruleIds(c[2] || ''), waits: waitsOn(c[2] || '') }));
  const listUnder = (block, marker) => {
    const i = block.findIndex((l) => l.startsWith(marker));
    if (i < 0) return [];
    const out = [];
    for (let j = i + 1; j < block.length && /^- /.test(block[j]); j++) out.push(block[j].replace(/^- /, '').trim());
    return out.filter((x) => !/^None\.?$/.test(x));
  };
  const reqList = listUnder(pieceSection, '**From the requirement');
  const dmList = listUnder(pieceSection, '**From the data model');
  const decList = listUnder(pieceSection, '**From your decisions');
  const flow = section('Flow').join('\n');
  const flowSteps = flow.split('```').slice(2).join('```').split('\n');

  const decisions = [];
  let dec = null;
  for (const line of section('Decision record')) {
    const h = line.match(/^### Decision (\d+) — (.+)$/);
    if (h) { dec = { n: Number(h[1]), question: h[2], options: [], fields: {} }; decisions.push(dec); continue; }
    if (!dec) continue;
    const opt = line.match(/^\s{2,}- \*\*(.+?)\*\*(.*)$/);
    if (opt) { dec.options.push({ label: opt[1], rest: opt[2] }); continue; }
    const f = line.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (f) dec.fields[f[1]] = f[2].trim();
  }
  const decisionNumbers = decisions.map((d) => d.n);
  const latest = decisions[decisions.length - 1];
  const accepted = doc.status === 'accepted';
  const everAccepted = accepted || fs.existsSync(path.join(rp.projectDir(project, opts), 'version-log', doc.rel.replace(/\.md$/, '')));
  const decisionDate = (d) => ((d && d.fields['Decided by']) || '').match(/(\d{4}-\d{2}-\d{2})$/)?.[1] || '';

  const parseSource = (s) => {
    let m;
    if ((m = s.match(/^(F-\d+)\.dw(\d+) — (.+)$/))) return { kind: 'dw', feature: m[1], n: Number(m[2]), piece: m[3] };
    // "data model — {Thing}, {action, field or move}". The thing is found among the data model's things first, so a
    // thing whose name holds a comma still reads.
    if ((m = s.match(/^data model — (.+)$/))) {
      const thing = thingNames.find((t) => m[1].startsWith(`${t}, `)) || m[1].slice(0, Math.max(0, m[1].indexOf(', ')));
      const name = m[1].slice(thing.length + 2).trim();
      return thing && name ? { kind: 'dm', thing, name, key: dmKey(thing, name) } : { kind: 'invalid' };
    }
    if (s === 'req — from the requirement') return { kind: 'req' };
    if (/^proposed — Why: \S/.test(s)) return { kind: 'proposed' };
    if ((m = s.match(/^decided — see Decision (\d+)$/))) return { kind: 'decided', decision: Number(m[1]) };
    return { kind: 'invalid' };
  };
  for (const r of rules) r.src = parseSource(r.source);

  // ---------- checks ----------
  const checks = [];
  const add = (name, fn) => {
    const problems = [];
    try { fn((msg) => problems.push(msg)); } catch (e) { problems.push(`could not run: ${e.message}`); }
    checks.push({ name, findings: problems });
  };

  add('Opening', (fail) => cd.opening(frd).forEach(fail));
  add('Sections match the template, in order', (fail) => cd.sections(frd, 'frd').forEach(fail));

  const inside = covered.map((f) => f.id);
  // The actions, fields and moves this FRD's features own, in the data model files' order.
  const owned = dmRows.filter((r) => inside.includes(r.owner));
  const ownedThings = [...new Set(owned.map((r) => r.thing))];
  const featureName = (fid) => (fid ? `${fid}${catalog[fid] ? ` ${catalog[fid].name}` : ''}` : 'no feature');
  const capFeatures = Object.keys(catalog).filter((fid) => catalog[fid].capability === title);
  add('Capability: the title, the file name, and the features the catalog gives it', (fail) => {
    const m = title.match(/^FRD-(\d+)([a-z]) (.+)$/);
    if (!m) return fail(`the title must read "# FRD-{section}{letter} {capability name}", found: ${h1}`);
    const want = `frd-${rp.slug(m[3])}.md`;
    if (path.basename(doc.file) !== want) fail(`the file should be named ${want}, is ${path.basename(doc.file)}`);
    if (!capFeatures.length) fail(`no feature in the Feature catalog names the capability "${title}"`);
    else if (!sameSet(inside, capFeatures)) fail(`the catalog gives "${title}" ${capFeatures.join(', ')}; the FRD covers ${inside.join(', ') || 'nothing'}`);
  });

  add('Last changed names the latest decision', (fail) => {
    const want = latest ? `${decisionDate(latest)}, Decision ${latest.n}` : 'None yet.';
    if (!head.some((l) => l.startsWith('- **Last changed:**'))) fail('missing the line "- **Last changed:** ..."');
    else if (lastChanged !== want) fail(`reads "${lastChanged}", should read "${want}"`);
  });

  add('Every covered feature sits in the FRD\'s section', (fail) => {
    const m = title.match(/^FRD-(\d+)/);
    for (const f of covered) {
      if (!catalog[f.id]) fail(`${f.id} is not in the catalog`);
      else if (m && catalog[f.id].module !== Number(m[1])) fail(`${f.id} is in section ${catalog[f.id].module}, not ${m[1]}`);
    }
  });

  add('Features covered match the catalog', (fail) => {
    for (const f of covered) {
      const c = catalog[f.id];
      if (!c) continue;
      if (f.name !== c.name) fail(`${f.id} name ${firstDiff(f.name, c.name)}`);
      if (f.desc !== c.desc) fail(`${f.id} description ${firstDiff(f.desc, c.desc)}`);
      if (!sameSet(f.reqs, c.reqs)) fail(`${f.id} Req. ID is ${f.reqs.join(' and ')}, the catalog says ${c.reqs.join(' and ')}`);
      if (f.priority !== c.priority) fail(`${f.id} priority is ${f.priority}, the catalog says ${c.priority}`);
    }
  });

  add('Requirements listed are exactly those of the features covered', (fail) => {
    const want = [...new Set(covered.flatMap((f) => f.reqs))];
    const got = frdReqs.map((r) => r.id);
    if (!sameSet(want, got)) fail(`the features cover ${want.join(', ')}; Requirements lists ${got.join(', ')}`);
  });

  add('Requirement titles and text are the PRD\'s simple words, copied exactly', (fail) => {
    for (const r of frdReqs) {
      const src = reqs[r.id];
      if (!src) { fail(`${r.id} is not in the PRD`); continue; }
      if (r.title !== src.title) fail(`${r.id} title ${firstDiff(r.title, src.title)}`);
      if (r.text !== src.text) fail(`${r.id} text ${firstDiff(r.text, src.text)}`);
    }
  });

  const outsideDeps = [...new Set(covered.flatMap((f) => (catalog[f.id] || { deps: [] }).deps))].filter((d) => !inside.includes(d));
  const dependents = Object.keys(catalog).filter((fid) => !inside.includes(fid) && catalog[fid].deps.some((d) => inside.includes(d)));

  add('Depends on lists the outside features the catalog names', (fail) => {
    const got = dependsOn.map((d) => d.match(/^(F-\d+) (.+)$/) || []);
    if (!sameSet(outsideDeps, got.map((g) => g[1]).filter(Boolean))) fail(`the catalog says ${outsideDeps.join(', ') || 'none'}; the FRD lists ${dependsOn.join(', ') || 'none'}`);
    for (const [, fid, name] of got) if (catalog[fid] && name !== catalog[fid].name) fail(`${fid} is named "${name}", the catalog says "${catalog[fid].name}"`);
  });

  const exMod = Number((title.match(/^FRD-(\d+)/) || [])[1]);
  const exNum = (fid) => Number(fid.slice(2));
  const exSiblings = Object.keys(catalog).filter((fid) => catalog[fid].module === exMod && !inside.includes(fid)).sort((a, b) => exNum(a) - exNum(b));
  const exItems = excludes.map((t) => {
    let m;
    if ((m = t.match(/^(F-\d+) (.+?)(?:, linked by (REQ-\d+\.\d+))?$/))) return { text: t, named: [{ id: m[1], name: m[2] }], link: m[3], sibling: exSiblings.includes(m[1]) && !m[3] };
    if ((m = t.match(/^(.+) module, linked by (REQ-\d+\.\d+)$/))) return { text: t, module: m[1], named: [], link: m[2], sibling: false };
    return { text: t, named: [], bad: true, sibling: false };
  });
  add('Excludes lists every sibling feature, then only requirement-linked neighbours', (fail) => {
    for (const i of exItems) {
      if (i.bad) fail(`must read "F-xx {catalog name}", "F-xx {catalog name}, linked by REQ-x.y" or "{Section} module, linked by REQ-x.y": ${i.text}`);
      if (i.module && !Object.values(moduleNames).includes(i.module)) fail(`"${i.module}" is not a section of the catalog: ${i.text}`);
      if (i.named.length && exSiblings.includes(i.named[0].id) && i.link) fail(`a feature of the same section is listed plainly, without "linked by": ${i.text}`);
    }
    for (const s of exSiblings) if (!exItems.some((i) => i.sibling && i.named[0].id === s)) fail(`missing sibling: ${s} ${catalog[s].name}`);
    const sibOrder = exItems.filter((i) => i.sibling).map((i) => i.named[0].id);
    if (sibOrder.join() !== [...sibOrder].sort((a, b) => exNum(a) - exNum(b)).join()) fail(`siblings are not in feature-ID order: ${sibOrder.join(', ')}`);
    const firstLinked = exItems.findIndex((i) => !i.sibling);
    if (firstLinked >= 0 && exItems.slice(firstLinked).some((i) => i.sibling)) fail('siblings must all come before the requirement-linked items');
    for (const i of exItems) {
      if (!i.bad && !i.sibling && !i.link) fail(`not a feature of the same section, so it must end ", linked by REQ-x.y": ${i.text}`);
      if (i.link && !frdReqs.some((r) => r.id === i.link)) fail(`${i.link} is not one of this FRD's own requirements: ${i.text}`);
      for (const n of i.named) if (catalog[n.id] && n.name !== catalog[n.id].name) fail(`${n.id} is named "${n.name}", the catalog says "${catalog[n.id].name}"`);
    }
  });

  add('One Rules subsection per covered feature, named as in the catalog', (fail) => {
    if (!sameSet(ruleHeadings.map((h) => h[1]), inside)) fail(`subsections: ${ruleHeadings.map((h) => h[1]).join(', ')}; features covered: ${inside.join(', ')}`);
    for (const [, fid, name] of ruleHeadings) if (catalog[fid] && name !== catalog[fid].name) fail(`### ${fid} reads "${name}", the catalog says "${catalog[fid].name}"`);
  });

  add('Rule IDs are numbered from 1 with no gaps', (fail) => {
    for (const [, fid] of ruleHeadings) {
      const nums = rules.filter((r) => r.feature === fid).map((r) => r.id);
      const want = nums.map((_, i) => `${fid}.${i + 1}`);
      if (nums.join() !== want.join()) fail(`${fid}: ${nums.join(', ')} (expected ${want.join(', ')})`);
    }
  });

  add('Rules are numbered in source order until the FRD is first accepted', (fail) => {
    if (everAccepted) return;
    // Pieces first, then data model rules in the order of the data model coverage table, then req, then the rest.
    const dmAt = (r) => { const i = owned.findIndex((x) => x.key === r.src.key); return i < 0 ? owned.length : i; };
    const rank = (r) => (r.src.kind === 'dw' ? r.src.n : r.src.kind === 'dm' ? 1000 + dmAt(r) : r.src.kind === 'req' ? 100000 : 200000);
    const label = (r) => (r.src.kind === 'dw' ? `dw${r.src.n}` : r.src.kind === 'dm' ? `data model, ${r.src.key}` : r.src.kind);
    for (const [, fid] of ruleHeadings) {
      const own = rules.filter((r) => r.feature === fid);
      for (let i = 1; i < own.length; i++) if (rank(own[i]) < rank(own[i - 1])) fail(`${own[i].id} (${label(own[i])}) comes after ${own[i - 1].id} (${label(own[i - 1])})`);
    }
  });

  add('Every rule cites exactly one allowed source', (fail) => {
    for (const r of rules) {
      if (r.src.kind === 'invalid') fail(`${r.id}: "${r.source}"`);
      else if (r.src.kind === 'dw' && r.src.feature !== r.feature) fail(`${r.id} cites a piece of ${r.src.feature}`);
      if (r.note && !r.noteDecision && !r.noteDm) fail(`${r.id}: the note must read "*Updated from the requirement on the basis of Decision n: {what changed}.*". For a data model decision, it names DM-n. For a data model answer that a decision at this gate changed, it reads "*Updated from the data model on the basis of Decision n: {what changed}.*"`);
    }
  });

  add('Every decided rule carries a note naming its own decision', (fail) => {
    for (const r of rules.filter((x) => x.src.kind === 'decided')) {
      if (!r.noteDecision) fail(r.noteDm ? `${r.id} is decided by Decision ${r.src.decision}, but its note names ${r.noteDm}` : `${r.id} is decided by Decision ${r.src.decision} but has no note`);
      else if (r.noteDecision !== r.src.decision) fail(`${r.id} is decided by Decision ${r.src.decision}, but its note names Decision ${r.noteDecision}`);
    }
  });

  const catPieces = pieces.filter((p) => inside.some((fid) => p.dw.startsWith(`${fid}.dw`)));
  add('The pieces are the catalog\'s, exactly', (fail) => {
    const want = catPieces.map((p) => `${p.dw} ${p.piece}`);
    const got = coverage.map((x) => `${x.dw} ${x.piece}`);
    for (const w of want) if (!got.includes(w)) fail(`the catalog's piece ${w.split(' ')[0]} isn't in Coverage as the catalog has it: "${w.slice(w.indexOf(' ') + 1)}"`);
    for (const g of got) if (!want.includes(g)) fail(`Coverage lists ${g.split(' ')[0]}, "${g.slice(g.indexOf(' ') + 1)}", which isn't a piece of a covered feature in the catalog`);
  });

  add('Rules quote each piece exactly as the catalog lists it', (fail) => {
    const split = Object.fromEntries(catPieces.map((p) => [p.dw, p.piece]));
    for (const r of rules) {
      if (r.src.kind !== 'dw') continue;
      const dw = `${r.src.feature}.dw${r.src.n}`;
      if (!(dw in split)) fail(`${r.id} cites ${dw}, which is not one of the catalog's pieces`);
      else if (r.src.piece !== split[dw]) fail(`${r.id} quotes ${dw} ${firstDiff(r.src.piece, split[dw])}`);
    }
  });

  add('Proved by matches the Rules table, and every piece has a rule or an open question', (fail) => {
    const want = {};
    for (const r of rules) if (r.src.kind === 'dw') (want[`${r.src.feature}.dw${r.src.n}`] = want[`${r.src.feature}.dw${r.src.n}`] || []).push(r.id);
    for (const x of coverage) {
      const w = want[x.dw] || [];
      if (x.question) {
        const q = logQuestions.get(x.question);
        if (!q) fail(`${x.dw}: Proved by names question ${x.question}, which isn't in the Question log`);
        else if (q.group === 'Answered') fail(`${x.dw}: question ${x.question} is answered, so a rule must prove this piece now`);
        if (w.length) fail(`${x.dw}: Proved by names question ${x.question}, but rules prove it: ${w.join(', ')}`);
      } else if (!w.length) fail(`${x.dw} has no rule`);
      else if (!sameSet(x.by, w)) fail(`${x.dw}: Proved by says ${x.by.join(', ') || 'nothing'}, the rules say ${w.join(', ')}`);
    }
  });

  add('Data model coverage lists exactly the actions, fields and moves the covered features own, named as the data model names them', (fail) => {
    if (catalogDm === null) return fail('the Feature catalog has no "Data model coverage" section, so no action or move has a feature yet');
    const count = (keys) => keys.reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map());
    const need = count(owned.map((r) => r.key));
    const have = count(dmCoverage.map((x) => x.key));
    for (const r of owned) {
      if (!have.has(r.key)) fail(`${r.key}: this ${r.kind} belongs to ${featureName(r.owner)}, but the table has no row for it`);
    }
    for (const [key, n] of have) {
      if (need.has(key)) { if (n !== need.get(key)) fail(`${key} has ${n} rows. It needs ${need.get(key) === 1 ? 'exactly one' : need.get(key)}.`); continue; }
      const known = dmRowOf(key);
      const why = known && noFeatureYet(known);
      if (why) fail(`${key} has no feature yet. ${why} So this FRD can't list it yet.`);
      else if (known) fail(`${key} belongs to ${featureName(known.owner)}, which this FRD doesn't cover`);
      else fail(`${key} isn't an action, field or move in the data model files, word for word`);
    }
    // The rows follow the data model files' order. Each one is placed by its first row.
    const order = [...new Set(dmCoverage.map((x) => x.key).filter((k) => need.has(k)))];
    const expected = [...need.keys()].filter((k) => have.has(k));
    const at = order.findIndex((k, i) => k !== expected[i]);
    if (at >= 0) fail(`the rows aren't in the data model files' order: "${order[at]}" comes where "${expected[at]}" should`);
  });

  add('Every data model row has a rule, or waits on its open decision', (fail) => {
    for (const x of dmCoverage) {
      const known = dmRowOf(x.key);
      if (!known) continue;
      const want = rules.filter((r) => r.src.kind === 'dm' && r.src.key === x.key).map((r) => r.id);
      for (const w of x.waits) if (!known.gaps.includes(w)) fail(`${x.key}: Proved by waits on ${w}, but no cell of its row in ${known.file} reads "? (${w})"`);
      if (!want.length) {
        if (x.by.length) fail(`${x.key}: Proved by names ${x.by.join(', ')}, but no rule's source names ${x.key}`);
        else if (!x.waits.length) fail(`${x.key} has no rule${known.gaps.length ? `. Its row in ${known.file} waits on ${known.gaps.join(' and ')}, so Proved by reads "waits on" and that ID.` : ''}`);
        continue;
      }
      if (!sameSet(x.by, want)) fail(`${x.key}: Proved by says ${x.by.join(', ') || 'nothing'}, the rules say ${want.join(', ')}`);
      // An answer still to be confirmed keeps its mark and its question in the rule that comes from it.
      for (const p of known.proposed) {
        const mark = `Proposed (needs confirmation), question ${p.question}`;
        if (!rules.some((r) => want.includes(r.id) && r.text.includes(mark))) fail(`${x.key}: its row in ${known.file} holds "${p.answer}, ${mark}". The rule from it keeps "${mark}".`);
      }
    }
  });

  add('Every data model rule is in the coverage table, and names a thing and an action, field or move of a row it proves', (fail) => {
    for (const r of rules.filter((x) => x.src.kind === 'dm')) {
      const known = dmRowOf(r.src.key);
      if (!known) { fail(`${r.id} names "${r.src.key}", which isn't an action, field or move in the data model files, word for word`); continue; }
      const why = noFeatureYet(known);
      if (why) fail(`${r.id} proves ${r.src.key}, which has no feature yet. ${why} So no rule can prove it yet.`);
      else if (known.owner !== r.feature) fail(`${r.id} proves ${r.src.key}, which belongs to ${featureName(known.owner)}, not ${r.feature}`);
      if (!dmCoverage.some((x) => x.key === r.src.key)) fail(`${r.id} proves ${r.src.key}, which has no row in the data model coverage table`);
    }
  });

  add('"From the requirement" lists exactly the req rules', (fail) => {
    const want = rules.filter((r) => r.src.kind === 'req').map((r) => r.id);
    if (!sameSet(reqList, want)) fail(`the list: ${reqList.join(', ') || 'none'}; req rules: ${want.join(', ') || 'none'}`);
  });

  add('"From the data model" lists exactly the data model rules', (fail) => {
    const want = rules.filter((r) => r.src.kind === 'dm').map((r) => r.id);
    if (!sameSet(dmList, want)) fail(`the list: ${dmList.join(', ') || 'none'}; data model rules: ${want.join(', ') || 'none'}`);
  });

  add('"From your decisions" lists exactly the suggested and decided rules', (fail) => {
    const want = rules.filter((r) => ['proposed', 'decided'].includes(r.src.kind)).map((r) => r.id);
    if (!sameSet(decList, want)) fail(`the list: ${decList.join(', ') || 'none'}; suggested and decided rules: ${want.join(', ') || 'none'}`);
  });

  add('Once the FRD is accepted, nothing is left undecided', (fail) => {
    if (!accepted) return;
    const open = rules.filter((r) => r.src.kind === 'proposed').map((r) => r.id);
    if (open.length) fail(`suggested rules still waiting for a decision: ${open.join(', ')}`);
  });

  add('No banned "how" words in rules', (fail) => {
    const words = howWords();
    if (!words) return fail('could not read the banned-word list from the Rules section of frd-author\'s conventions');
    for (const r of rules) for (const w of words) if (new RegExp(`\\b${esc(w)}s?\\b`, 'i').test(r.text.replace(/<br>/g, ' '))) fail(`${r.id} contains "${w}"`);
  });

  add('Gates are tied to the features the catalog\'s Depends on gives', (fail) => {
    const want = { In: outsideDeps, Out: dependents };
    for (const g of gateRows) {
      const gids = featIds(g.tied);
      // Each feature's name is read from its ID, so a catalog name with a comma in it, such as "Add, remove and
      // reorder", still matches.
      for (const m of g.tied.matchAll(/(F-\d+) /g)) {
        const c = catalog[m[1]];
        const rest = g.tied.slice(m.index + m[0].length);
        if (!c || new RegExp(`^${esc(c.name)}(?= \\(|,|<br>|\\s*$)`).test(rest)) continue;
        const named = (rest.match(/^.*?(?= \(|<br>|, *(?:• *)?F-\d|\s*$)/) || [rest])[0].trim();
        fail(`${g.key}: ${m[1]} is named "${named}", the catalog says "${c.name}"`);
      }
      if (/TBD/.test(g.tied)) fail(`${g.key}: "Tied to" is never TBD; write the catalog's features, or None.`);
      if (g.key in want) {
        const w = want[g.key];
        if (!w.length && g.tied !== 'None.') fail(`${g.key}: the catalog shows no feature, so "Tied to" must be None. (found "${g.tied}")`);
        else if (w.length && !sameSet(gids, w)) fail(`${g.key}: tied to ${gids.join(', ') || 'nothing'}; the catalog gives ${w.join(', ')}`);
      } else if (g.tied !== 'None.' && !gids.every((fid) => inside.includes(fid))) fail(`${g.key}: must be a covered feature, or None. (found "${g.tied}")`);
    }
  });

  add('Gate conditions copied from the catalog match it word for word', (fail) => {
    const wantIn = outsideDeps.length ? joinLines(outsideDeps.map((d) => catalog[d].done)) : 'None.';
    if (gates.In !== wantIn) fail(`In ${firstDiff(gates.In || '', wantIn)}`);
    const out = gateRows.find((g) => g.key === 'Out');
    if (out && out.tied === 'None.') {
      const wantOut = joinLines(covered.map((f) => (catalog[f.id] ? catalog[f.id].done : '')));
      if (out.cond !== wantOut) fail(`Out: nothing depends on this capability, so the condition is its own "Done when", ${firstDiff(out.cond, wantOut)}`);
    }
    const undone = gateRows.find((g) => g.key === 'Undone if');
    if (undone && undone.tied === 'None.' && undone.cond !== 'None.') fail('Undone if: "Tied to" is None., so the condition must be None. too');
  });

  add('Entry and Exit repeat the Gates conditions word for word', (fail) => {
    const pairs = [
      ['the Entry line', (flow.match(/\*\*Entry:\*\* (.+?) \*\(Gate in\)\*/) || [])[1], gates.In],
      ['the ENTRY box', (flow.match(/ENTRY: ([^"\]]+)/) || [])[1], gates.In],
      ['the Exit line', (flow.match(/\*\*Exit:\*\* (.+?) \*\(Gate out\)\*/) || [])[1], gates.Out],
      ['the EXIT box', (flow.match(/EXIT: ([^"\]]+)/) || [])[1], gates.Out],
    ];
    for (const [name, got, want] of pairs) {
      if (got === undefined) fail(`${name} not found`);
      else if (got.trim() !== want) fail(`${name} ${firstDiff(got.trim(), want || '')}`);
    }
  });

  const flowCites = [];
  add('Each flow step cites exactly one existing rule', (fail) => {
    const known = rules.map((r) => r.id);
    for (const line of flowSteps) {
      if (/\(Gate (in|out)\)/.test(line) || !line.trim()) continue;
      const isStep = /^\d+\. /.test(line) || /^- \*Alternate/.test(line);
      const cites = [...line.matchAll(/\*\(([^)]*)\)\*/g)].map((m) => m[1]);
      if (isStep && cites.length !== 1) fail(`the step cites ${cites.length} rules: ${line.trim()}`);
      for (const c of cites) {
        flowCites.push(c);
        if (!/^F-\d+\.\d+$/.test(c)) fail(`"${c}" is not exactly one rule: ${line.trim()}`);
        else if (!known.includes(c)) fail(`${c} is not a rule in this FRD`);
      }
    }
  });

  add('Every rule appears in the flow at least once', (fail) => {
    for (const r of rules) if (!flowCites.includes(r.id)) fail(`${r.id} is not in the flow`);
  });

  // A cell of Data that a decision at this FRD's gate changed: the new answer, then this note. The Data check lists each
  // one, and the next check finds its decision in the Decision record.
  const DATA_NOTE = /<br>\*Updated from the data model on the basis of Decision (\d+): (.+)\.\*$/;
  const dataNotes = [];
  add('Data copies each thing\'s rules table word for word, under a link to its file, except a cell a decision changed', (fail) => {
    const cut = (s) => (s.length > 60 ? `${s.slice(0, 59)}…` : s);
    const got = dataThings.map((d) => d.thing);
    const stray = (list) => `${cd.plural(list.length, 'line')}, from "${cut(list[0])}"`;
    if (dataStray.length) fail(`${stray(dataStray)}, come before the first thing's heading. Each thing in Data starts with a "###" heading that names it.`);
    for (const t of ownedThings) if (!got.includes(t)) fail(`${t} is in the data model coverage table, but Data has no "### ${t}"`);
    for (const t of got) if (!ownedThings.includes(t)) fail(`"### ${t}" isn't a thing in the data model coverage table`);
    const order = got.filter((t) => ownedThings.includes(t));
    const expected = ownedThings.filter((t) => got.includes(t));
    const at = order.findIndex((t, i) => t !== expected[i]);
    if (at >= 0) fail(`the things aren't in the order of the data model coverage table: ${order[at]} comes where ${expected[at]} should`);
    for (const d of dataThings) {
      const t = dmThings.get(d.thing);
      if (!t || !ownedThings.includes(d.thing)) continue;
      if (d.stray.length) fail(`${d.thing}: ${stray(d.stray)}, aren't a copy of the data model. Data holds only a "From" line and its rules table, for each file.`);
      // Its own part's rules table first, then each "Adds to" part's, in the files' order.
      let want = t.parts.filter((p) => p.tables.some((x) => x.kind === 'fields')).map((p) => ({ part: p, table: p.tables.find((x) => x.kind === 'fields') }));
      if (!want.length) want = t.parts.slice(0, 1).map((p) => ({ part: p, table: null }));
      if (d.blocks.length !== want.length) fail(`${d.thing}: Data has ${d.blocks.length} "From" lines. The data model gives it ${want.length}: ${want.map((w) => partFile.get(w.part).name).join(' and ')}.`);
      want.forEach((w, i) => {
        const b = d.blocks[i];
        if (!b) return;
        const f = partFile.get(w.part);
        const wantLine = `From [${f.name}](${path.posix.relative(path.posix.dirname(doc.rel), f.rel)}).`;
        const gotLine = `From [${b.name}](${b.link}).`;
        if (gotLine !== wantLine) fail(`${d.thing}: the line reads "${gotLine}", and should read "${wantLine}"`);
        const wantRaw = w.table ? w.table.raw.split('\n').map((l) => l.trim()) : [];
        const columns = cells(wantRaw[0] || '');
        const notCopied = `${d.thing}: the rules table from ${f.name} isn't copied word for word.`;
        for (let j = 0; j < Math.max(wantRaw.length, b.table.length); j++) {
          const gotRow = b.table[j];
          const wantRow = wantRaw[j];
          if (gotRow === wantRow) continue;
          const g = gotRow === undefined ? [] : cells(gotRow);
          const wc = wantRow === undefined ? [] : cells(wantRow);
          // The heading, its line of dashes, a line added or left out, or a row with more or fewer cells: no decision
          // explains it, so the first such line is the finding.
          if (j < 2 || gotRow === undefined || wantRow === undefined || g.length !== wc.length) {
            fail(`${notCopied} At its line ${j + 1}, ${firstDiff(gotRow || '', wantRow || '')}`);
            break;
          }
          const own = [];
          g.forEach((c, k) => {
            if (c === wc[k]) return;
            own.push(c);
            const where = `in the row for ${wc[0]}, "${columns[k] || `column ${k + 1}`}"`;
            const m = c.match(DATA_NOTE);
            if (!m) fail(`${notCopied} At its line ${j + 1}, ${where} reads "${c}", and the data model says "${wc[k]}". A cell that a decision at this gate changed ends with a note that names the decision: "*Updated from the data model on the basis of Decision n: {what changed}.*"`);
            else if (c.slice(0, m.index) === wc[k]) fail(`${d.thing}: at line ${j + 1} of the rules table from ${f.name}, ${where} has a note, but its answer is the data model's. A note goes only where a decision changed the answer.`);
            else dataNotes.push({ thing: d.thing, field: wc[0], column: columns[k] || `column ${k + 1}`, decision: Number(m[1]) });
          });
          dataOwn.set(b.at[j], own.join(' | '));
        }
      });
    }
  });

  add('A difference from the data model has a note that names a decision in the Decision record', (fail) => {
    for (const r of rules.filter((x) => x.noteFrom === 'data model')) {
      if (r.src.kind !== 'dm') fail(`${r.id}: only a data model rule has a note "Updated from the data model". Its source is "${r.source}".`);
      if (r.noteDm) fail(`${r.id}: its note names ${r.noteDm}, a data model decision, which the data model already follows. A note "Updated from the data model" names a decision at this gate, as Decision n.`);
      else if (!decisionNumbers.includes(r.noteDecision)) fail(`${r.id}: its note names Decision ${r.noteDecision}, which isn't in the Decision record`);
    }
    for (const n of dataNotes) if (!decisionNumbers.includes(n.decision)) fail(`${n.thing}, in Data: in the row for ${n.field}, the note in "${n.column}" names Decision ${n.decision}, which isn't in the Decision record`);
  });

  const std = standardQuestions();
  // "{family}.md, {Thing} {action, field or move}": an answer in a data model file. A place in a data model file that
  // is no thing's action, field or move comes back with missing.
  const dmFiles = new Set(model.files.map((f) => f.name));
  const dmPlaceOf = (place) => {
    const m = place.match(/^(\S+\.md), (.+)$/);
    if (!m || !dmFiles.has(m[1])) return null;
    return dmRows.find((r) => r.file === m[1] && `${r.thing} ${r.name}` === m[2]) || { file: m[1], missing: m[2] };
  };
  add('Every thing in Data has every standard question, each answered in an allowed way', (fail) => {
    if (!std.length) return fail('could not read the standard questions from the FRD template');
    const things = dataThings.map((d) => d.thing);
    for (const row of sqRows) if (!things.includes(row.thing)) fail(`"${row.thing}" is not a thing in the Data section`);
    for (const t of things) {
      const got = sqRows.filter((r) => r.thing === t).map((r) => r.question);
      if (got.join('|') !== std.join('|')) fail(`${t}: the questions must be the ${std.length} standard questions, word for word, in order`);
    }
    const ruleExists = (s) => { const found = ruleIds(s); return found.length && found.every((rid) => rules.some((r) => r.id === rid)); };
    for (const row of sqRows) {
      const a = row.answer;
      const where = `${row.thing}, "${row.question}"`;
      let m;
      if ((m = a.match(/^Decision (\d+)\s(?:->|→)\sno rule$/))) { if (!decisionNumbers.includes(Number(m[1]))) fail(`${where}: there is no Decision ${m[1]}`); }
      else if ((m = a.match(/^Decision (\d+)\s(?:->|→)\s(.+)$/))) {
        if (!decisionNumbers.includes(Number(m[1]))) fail(`${where}: there is no Decision ${m[1]}`);
        if (!ruleExists(m[2])) fail(`${where}: names a rule that is not in the Rules table`);
      } else if ((m = a.match(/^question (\d+)$/i))) {
        const q = logQuestions.get(Number(m[1]));
        if (!q) fail(`${where}: question ${m[1]} isn't in the Question log`);
      } else if (/^Does not apply — \S/.test(a)) {
        // the reader checks that a document rules it out
      } else if ((m = a.match(/^(.+, .+)\s(?:->|→)\s(.+)$/))) {
        // The place, then the last arrow. A move in the place keeps its own arrow.
        const [, place, target] = m;
        const at = dmPlaceOf(place);
        let w;
        if (at && at.missing) fail(`${where}: "${at.missing}" isn't a thing and its action, field or move in ${at.file}, word for word`);
        else if ((w = target.match(/^waits on ((?:DM|GC)-\d+)$/))) {
          if (!at) fail(`${where}: "waits on" answers only for a data model answer, such as "lending.md, Loan Browse -> waits on DM-5"`);
          else if (!at.gaps.includes(w[1])) fail(`${where}: no cell of ${at.key} in ${at.file} reads "? (${w[1]})"`);
        } else if ((w = target.match(/^(F-\d+) (.+)$/))) {
          if (!at) fail(`${where}: a feature in another FRD answers only for a data model answer, such as "lending.md, Loan book -> F-01 Borrow a book"`);
          else if (inside.includes(w[1])) fail(`${where}: ${w[1]} is in this FRD, so name the rules that prove ${at.key}`);
          else if (noFeatureYet(at)) fail(`${where}: ${at.key} has no feature yet. ${noFeatureYet(at)} So the answer can't name a feature yet.`);
          else if (at.owner !== w[1]) fail(`${where}: ${at.key} belongs to ${featureName(at.owner)}, not ${w[1]}`);
          else if (catalog[w[1]] && w[2] !== catalog[w[1]].name) fail(`${where}: ${w[1]} is named "${w[2]}", the catalog says "${catalog[w[1]].name}"`);
        } else if (!ruleExists(target)) fail(`${where}: names a rule that is not in the Rules table`);
      } else fail(`${where}: "${a}" is not one of the allowed answer forms`);
    }
  });

  add('Each decision records its question, the gate, every option offered, the choice, who and when', (fail) => {
    const block = section('Decision record').slice(1).filter((l) => l.trim() && !/^\*[^*]/.test(l));
    if (!decisions.length) {
      if (block.length && !(block.length === 1 && block[0].trim() === 'None yet.')) fail('no "### Decision n — ..." entries, so the section must say exactly "None yet."');
      return;
    }
    const nums = decisions.map((d) => d.n);
    if (nums.join() !== nums.map((_, i) => i + 1).join()) fail(`entries are numbered ${nums.join(', ')} (expected ${nums.map((_, i) => i + 1).join(', ')})`);
    for (const d of decisions) {
      const where = `Decision ${d.n}`;
      if (d.fields['Asked at'] !== GATE) fail(`${where}: "Asked at" must be "${GATE}"`);
      if (!/^(None|\d+(, \d+)*)$/.test(d.fields.Question || '')) fail(`${where}: "Question" must be its number in the Question log, or None`);
      const real = d.options.filter((o) => o.label !== 'I don\'t know yet');
      if (real.length < 2) fail(`${where}: at least two real options must be recorded (found ${real.length})`);
      for (const o of real) {
        if (o.label.startsWith('Other: ')) continue;
        if (!/ — Why: .+\. What happens next: .+/.test(o.rest)) fail(`${where}: option "${o.label}" needs "— Why: ... What happens next: ..."`);
      }
      const labels = d.options.map((o) => o.label);
      if (!labels.includes(d.fields.Chosen)) fail(`${where}: "Chosen" (${d.fields.Chosen || 'missing'}) must be exactly one of the options offered`);
      if (d.fields.Recommended !== 'None' && !labels.includes(d.fields.Recommended)) fail(`${where}: "Recommended" (${d.fields.Recommended || 'missing'}) must be one of the options offered, or None`);
      if (d.fields.Chosen === 'I don\'t know yet' && !d.fields['Answer in use for now']) fail(`${where}: "I don't know yet" was chosen, so it needs "Answer in use for now"`);
      if (!/^(BA|PO), \d{4}-\d{2}-\d{2}$/.test(d.fields['Decided by'] || '')) fail(`${where}: "Decided by" must read "BA, YYYY-MM-DD" or "PO, YYYY-MM-DD"`);
    }
  });

  add('Every reference to a decision points to an entry that exists', (fail) => {
    for (const m of body.matchAll(/Decision (\d+)/g)) if (!decisionNumbers.includes(Number(m[1]))) fail(`"Decision ${m[1]}" is mentioned, but there is no Decision ${m[1]}`);
  });

  // A note "on the basis of DM-n", and a coverage row that "waits on" a DM- or GC- ID, name an entry of the data
  // model's decisions file, read through lib/data-model.cjs.
  add('Every data model decision or Glossary change it names is in the data model\'s decisions file', (fail) => {
    const register = dm.decisionsOf(project, opts);
    for (const id of new Set([...body.matchAll(/\b(?:on the basis of|waits on) ((?:DM|GC)-\d+)\b/g)].map((m) => m[1]))) {
      if (!register.inForce.has(id)) fail(`${id} is named, but the data model's decisions file, ${register.name}, has no ${id}${register.exists ? '' : ': the file is missing'}`);
    }
  });

  add('The Check record holds the check\'s record, or None yet.', (fail) => {
    const block = section('Check record').slice(1).filter((l) => l.trim() && !/^\*[^*]/.test(l));
    if (crIndex < 0) return fail('missing the "## Check record" section');
    if (block.length === 1 && block[0].trim() === 'None yet.') return;
    if (!block.length || !/^check-frd\.cjs, \d{4}-\d{2}-\d{2}: /.test(block[0])) fail('must be exactly "None yet." or the check\'s "For the file" block, pasted as it is');
  });

  add('No template markers or writer notes are left in the document', (fail) => {
    lines.forEach((line, i) => { if (line.includes('<!--')) fail(`line ${i + 1}: ${line.trim()}`); });
  });

  add('Only the allowed ID prefixes appear', (fail) => {
    // DM- and GC- are the data model's IDs. They appear only in a note that names a data model decision, after
    // "waits on", and in Data's copy of the data model (the IDs section of frd-author's conventions).
    const own = bodyLines.map(ownText).join('\n')
      .replace(/on the basis of DM-\d+/g, '')
      .replace(/\bwaits on (?:DM|GC)-\d+/g, '');
    const bad = [...new Set(ids(own, /\b[A-Z][A-Za-z]*-\d/g).map((s) => s.slice(0, -2)))].filter((p) => !['REQ', 'F', 'FRD'].includes(p));
    if (bad.length) fail(`unexpected prefixes: ${bad.join(', ')}`);
  });

  add('No middle dots anywhere and no slash-joined items', (fail) => {
    const verbatim = [
      ...frdReqs.flatMap((r) => [r.title, r.text]),
      ...covered.flatMap((f) => [f.name, f.desc]),
      ...Object.values(catalog).flatMap((c) => [c.name, c.done]),
      ...coverage.map((x) => x.piece),
      ...rules.filter((r) => r.src.kind === 'dw').map((r) => r.src.piece),
      ...dmRows.flatMap((r) => [r.thing, r.name]),
    ].filter(Boolean).sort((a, b) => b.length - a.length);
    bodyLines.forEach((line, i) => {
      let s = ownText(line, i).replace(/\[[^\]]*\]\([^)]*\)/g, 'LINK').replace(/`[^`]*`/g, 'CODE');
      for (const v of verbatim) s = s.split(v).join('VERBATIM');
      if (s.includes('·')) fail(`line ${i + 1}: contains a middle dot`);
      if (/\S\/\S|\s\/\s/.test(s)) fail(`line ${i + 1}: slash-joined items: ${line.trim()}`);
    });
  });

  // A requirement's title and text, copied exactly from the PRD, are the PRD's words, not the FRD's. On a first run the
  // PRD comes before the Glossary, and it is never rewritten to match it ("Agreed words" in _shared/conventions.md), so
  // the scan skips them. A requirement line that isn't an exact copy is scanned. Text copied exactly from the data
  // model is skipped the same way: Data's copies, and each thing with its action, field or move where the FRD names
  // them, in a rule's source, a row of the data model coverage table, or an answer to a standard question. In a line of
  // Data that a decision changed, only the changed cells are scanned.
  const blank = (s) => ' '.repeat(s.length);
  const dmCopies = [...new Map(dmRows.flatMap((r) => [
    [`data model — ${r.key}`, `data model — ${blank(r.key)}`],
    [`| ${r.thing} | ${r.name} |`, `| ${blank(r.thing)} | ${blank(r.name)} |`],
    [`${r.file}, ${r.thing} ${r.name}`, blank(`${r.file}, ${r.thing} ${r.name}`)],
  ])).entries()].sort((a, b) => b[0].length - a[0].length);
  add('Glossary words', (fail) => {
    const own = lines.map((l, i) => {
      if (dataOwn.has(i)) return dataOwn.get(i);
      const m = i < head.length && l.match(/^(- \*\*(REQ-\d+\.\d+) )(.+?)(\*\* — )(.+)$/);
      const src = m && reqs[m[2]];
      if (!src || m[3] !== src.title || m[5] !== src.text) return dmCopies.reduce((s, [from, to]) => s.split(from).join(to), l);
      return `${m[1]}${' '.repeat(m[3].length)}${m[4]}${' '.repeat(m[5].length)}`;
    }).join('\n');
    for (const h of sw.scan(own, retired, currentTerms, 'frd')) fail(`Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`);
  });

  add('Placeholders', (fail) => cd.placeholders(frd).forEach(fail));
  add('Display', (fail) => cd.rendering(frd).forEach(fail));
  const writing = cd.simpleWriting(frd, { project, output: opts.output });
  add('Simple writing', (fail) => writing.findings.forEach(fail));
  add('Question log', (fail) => cd.questionFindingsFor(doc, graded).forEach(fail));

  // ---------- what the gate shows ----------
  // A question named only in Data's copy of the data model is not one this FRD builds on. A rule that builds on it
  // keeps its "question {n}", so the question is named there. A cell of Data that a decision changed is the FRD's own.
  const named = new Set();
  for (const { n, line, section: s } of cd.lines(frd)) {
    if (['decision record', 'check record'].includes(md.normalize(s)) || /^\s*\*[^*]/.test(line)) continue;
    for (const m of ownText(line, n - 1).matchAll(/question (\d+)/gi)) named.add(Number(m[1]));
  }
  const guard = (graded.open || []).filter((q) => q.group === 'Must answer' && named.has(q.n));
  const notices = [];
  if (guard.length) {
    notices.push(`This FRD can't be accepted yet: it builds on ${cd.plural(guard.length, 'Must answer question')} still open. Answer ${guard.length === 1 ? 'it' : 'them'} first, or park the FRD with park.cjs while other work carries on:`);
    notices.push(...guard.map((q) => `- question ${q.n}: ${q.title}`));
  }
  notices.push(...writing.notices);
  // Each rule is read after "The system shall", so it starts with its action.
  notices.push(...op.notices(op.check(rules.map((r) => ({ id: r.id, text: r.text, kind: 'action' }))), 'rule'));
  notices.push('Not checked by the program, for the specifier to read:', ...NOT_CHECKED.map((n) => `- ${n}`));

  const kinds = (k) => rules.filter((r) => r.src.kind === k).length;
  const dmNotes = rules.filter((r) => r.noteFrom === 'data model').length + dataNotes.length;
  const holds = [
    `${cd.plural(covered.length, 'feature')}, ${cd.plural(coverage.length, '"Done when" piece')}`,
    `${cd.plural(rules.length, 'rule')}: ${kinds('dw')} from the pieces, ${kinds('dm')} from the data model, ${kinds('req')} from the requirements, ${kinds('proposed')} suggested, ${kinds('decided')} decided`,
    `${owned.length} data model ${owned.length === 1 ? 'answer' : 'answers'} its features own, ${dmCoverage.filter((x) => x.waits.length && !x.by.length).length} of them waiting on an open decision or Glossary change`,
    `${cd.plural(dmNotes, 'note')} where a decision at this gate changed a data model answer`,
    `${cd.plural(dataThings.length, 'thing')} in Data, with ${cd.plural(sqRows.length, 'standard question')} answered`,
    cd.plural(decisions.length, 'decision') + (decisions.length ? ' so far' : ''),
  ];
  return { doc, checks, holds, graded, notices, guard };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true || !args.frd || args.frd === true) rp.fail('Use: node tools/check-frd.cjs --project <p> --frd <file>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, args.frd, { output: args.output });
  const out = cd.report({ program: 'check-frd.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
