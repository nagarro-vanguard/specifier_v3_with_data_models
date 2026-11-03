#!/usr/bin/env node
'use strict';
// status.cjs — says where a project stands, and what to run next.
//
//   node tools/status.cjs --project <p>
//
// It prints one line per step and piece, then the open changes, then every Must answer question still open in the
// Question log, then every entry still open in the data model's decisions file, then "Next:". The questions come from
// grade-questions.cjs, which only reads here and changes nothing.
// A document's state comes from its status line (conventions.md, "The opening of every document"):
//   not started   the file isn't there
//   drafted       the status line says drafted, or the file has no status line
//   accepted      the status line says accepted
//   parked        the status line says parked
//   ready         an EPIC whose stories are all ready
//   written       a generated file that is there
// The status line is read in any case, because the data model's files written before the kit's document shape say
// "Accepted on {date}".
// The data model's files come from its things file, which names one file per family, as
// "Data model file: [lending.md](lending.md)" or "Data model file: lending.md". Its decisions and its Glossary changes
// come from its decisions file. Both files are read through lib/data-model.cjs.
//   - step 3 is still to do while a Glossary change reads "To raise" or "Raised". glossary-disposition settles all of
//     them in one run.
//   - step 4 is still to do while a Glossary change reads "Settled in the Glossary on {date}", and not yet ". Brought
//     into the data model on {date}".
//   - a decision settled while an accepted data model file still shows its "? (DM-n)", such as a product-wide decision
//     things-author settled later, is still to do too: data-model-author writes the answer into that file, in a change.
//     It is listed under "Data model, still open", and "Next:" names it before the families still to write.
//   - a decision answered "I don't know yet", and a Glossary change "Left open on {date}", hold up no step. Each is
//     listed under "Data model, still open", with every open decision and the skill that asks each one again first.
//     Under the "Next:" line, one line for each skill, and each data model file, says who asks them again, and when:
//     first, at the next run of data-model-workflow.
// An accepted FRD that still waits on an answer the data model now has is listed on its own line in the FRDs' block:
// "waits on DM-n", or "? (DM-n)" in its copy of the data model, where DM-n is settled. A Glossary change counts once it
// is brought into the data model. "Next:" names frd-author for it, in the FRDs' order, so the answer moves forward.
// A data model file being drafted is work in progress, as size-rules.cjs reads it. Like the Feature catalog, it is
// never parked, because a change's path writes it again. So "Next:" names it before the features, even in a change.
// The FRDs and EPICs come from the latest accepted Feature catalog and EPIC register.
//
// "Next:" follows the flow's order, with parked pieces last:
//   requirements-workflow, glossary-author, data-model-workflow, features-and-epics-workflow, then every FRD,
//   then every EPIC.
//   An EPIC waits while an FRD of its features isn't accepted, or an EPIC it depends on is parked.
//   A parked piece comes back once only pieces that wait on it are left.
//
// Exit codes: 0 printed; 2 the project or the layout is missing.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const { tableUnder, list } = require('./lib/md-tables.cjs');
const { grade } = require('./grade-questions.cjs');
const dm = require('./lib/data-model.cjs');

function stateOf(file) {
  if (!fs.existsSync(file)) return { state: 'not started' };
  const m = rp.readText(file).match(/^Status: (.*)$/m);
  if (!m) return { state: 'drafted' };
  const s = m[1].trim();
  if (/^accepted\b/i.test(s)) return { state: 'accepted', detail: s.replace(/^accepted /i, '') };
  if (/^parked\b/i.test(s)) return { state: 'parked', detail: s.replace(/^parked /i, '') };
  return { state: 'drafted' };
}

// The data model's decisions file, read through lib/data-model.cjs: its decisions and its Glossary changes, each with
// its ID and its state. None when the file isn't there.
function decisionsIn(file) {
  if (!fs.existsSync(file)) return dm.readDecisions('\n');
  return dm.readDecisions(file);
}

// One line for an entry still open, and who asks it again.
function openLine(o) {
  const e = o.entry;
  const where = o.file ? ` (${o.file})` : '';
  const forFile = o.asks === 'data-model-author' && o.file ? ` for ${o.file}` : '';
  const again = `${o.asks} asks it again first, at its next run${forFile}`;
  if (e.kind === 'DM') {
    const then = e.proposed ? again : `${o.asks} asks it at its gate${forFile}`;
    return `- ${e.id}${where}: ${e.question} ${o.waits[0].toUpperCase()}${o.waits.slice(1)}. ${then}.`;
  }
  const then = e.state === 'left open' ? again
    : e.state === 'raised' ? 'glossary-disposition settles it, with the others in its batch'
      : 'data-model-workflow, step 3, sends it to the Glossary with the others';
  return `- ${e.id}${where}: ${e.question}. ${o.waits}. ${then}.`;
}

// Each settled decision whose "? (DM-n)" a data model file still shows, read through lib/data-model.cjs, so the cells
// and notes are read as check-data-model.cjs reads them.
function settledGapsIn(file, decisions) {
  const ids = new Set();
  for (const part of dm.readFile(file).parts) {
    for (const t of part.tables) for (const row of t.rows) for (const v of Object.values(row)) dm.cell(v).gaps.forEach((g) => ids.add(g));
    for (const n of part.notes) dm.cell(n.text).gaps.forEach((g) => ids.add(g));
  }
  return [...ids].filter((id) => {
    const e = decisions.inForce.get(id);
    return e && e.kind === 'DM' && e.section === 'settled';
  });
}

// Each answer an accepted FRD still waits on, though the data model now has it: "waits on DM-n", or "? (DM-n)" in its
// copy of the data model, where DM-n is settled, or GC-n is brought into the data model.
function settledWaitsIn(file, decisions) {
  const ids = new Set([...rp.readText(file).matchAll(/(?:\bwaits on |\?\s*\()((?:DM|GC)-\d+)\b/g)].map((m) => m[1]));
  return [...ids].filter((id) => {
    const e = decisions.inForce.get(id);
    if (!e) return false;
    return e.kind === 'DM' ? e.section === 'settled' : e.state === 'brought in';
  });
}

function show(st) {
  return st.detail ? `${st.state} ${st.detail}` : st.state;
}

function latestCopy(project, rel, opts) {
  const logPath = rp.pathOf(project, 'version-log', {}, opts);
  if (!fs.existsSync(logPath)) return null;
  let best = 0;
  for (const line of rp.readText(logPath).split(/\r?\n/)) {
    const c = line.split('|').slice(1, -1).map((s) => s.trim());
    if (c.length > 1 && /^\d+$/.test(c[0]) && c[1] === rel) best = Math.max(best, Number(c[0]));
  }
  if (!best) return null;
  const copy = rp.pathOf(project, 'version-copy', { document: rel.replace(/\.md$/, ''), n: best }, opts);
  return fs.existsSync(copy) ? rp.readText(copy) : null;
}

function firstMatch(cell, re) {
  const m = list(cell).join(' ').match(re);
  return m ? m[0] : null;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const project = args.project;
  const dir = rp.projectDir(project, args);
  if (!fs.existsSync(dir)) rp.fail(`The project folder doesn't exist: ${dir}`, 2);
  const at = (doc, values) => rp.pathOf(project, doc, values, args);
  const out = [`Project: ${project}`, ''];
  let next = null;
  const want = (text) => { if (!next) next = text; };

  // Workflow 1 and the Glossary.
  const req = [
    ['discovery-brief', 'Discovery brief', 'requirements-workflow, step 1: discovery-author writes the Discovery brief'],
    ['brd', 'BRD', 'requirements-workflow, step 2: brd-author writes the BRD'],
    ['prd', 'PRD', 'requirements-workflow, step 3: prd-author writes the PRD'],
  ];
  out.push('requirements-workflow');
  req.forEach(([doc, name, nextText], i) => {
    const st = stateOf(at(doc));
    out.push(`- ${i + 1}. ${name}: ${show(st)}`);
    if (st.state !== 'accepted') want(nextText);
  });
  const glossary = stateOf(at('gate-log'));
  out.push('', 'glossary-author');
  out.push(`- Glossary: ${show(glossary)}`);
  if (glossary.state !== 'accepted') want('glossary-author builds the Glossary');

  // The data model: the things file, then one file per family, then the Glossary changes it found, sent to the
  // Glossary together, then the ones the Glossary settled, brought into the data model.
  out.push('', 'data-model-workflow');
  const thingsFile = at('data-model-things');
  const things = stateOf(thingsFile);
  out.push(`- 1. Things file: ${show(things)}`);
  if (things.state !== 'accepted') want('data-model-workflow, step 1: things-author finds the things');
  // Read through lib/data-model.cjs, as check-data-model.cjs reads it, so both find the same files in either form.
  const families = things.state === 'not started' ? [] : dm.readThings(thingsFile).families.map((f) => f.name);
  if (!families.length) out.push('- 2. Data model files: none named yet');
  const familyFiles = families.map((file) => {
    const abs = at('data-model', { family: file.replace(/\.md$/, '') });
    const st = stateOf(abs);
    out.push(`- 2. ${file}: ${show(st)}`);
    return { file, abs, st };
  });
  const decisions = decisionsIn(at('data-model-decisions'));
  // A decision settled later, such as a product-wide one, whose "? (DM-n)" an accepted file still shows: data-model-author
  // writes its answer into that file, in a change. It comes before the families still to write, as data-model-workflow
  // takes it.
  const writeIn = familyFiles.filter((f) => f.st.state === 'accepted')
    .map((f) => ({ file: f.file, ids: settledGapsIn(f.abs, decisions) }))
    .filter((w) => w.ids.length);
  for (const w of writeIn) want(`data-model-workflow, picking up: data-model-author writes the settled answer of ${w.ids.join(', ')} into ${w.file}, in a change`);
  for (const f of familyFiles) if (f.st.state !== 'accepted') want(`data-model-workflow, step 2: data-model-author writes ${f.file}`);
  const changes = decisions.glossaryChanges;
  const settled = changes.filter((c) => ['settled', 'brought in'].includes(c.state));
  const toSend = changes.filter((c) => ['to raise', 'raised'].includes(c.state));
  const toBring = changes.filter((c) => c.state === 'settled');
  out.push(`- 3. Glossary changes: ${changes.length ? `${settled.length} of ${changes.length} settled in the Glossary` : 'none'}`);
  out.push(`- 4. Settled changes brought into the data model: ${settled.length ? `${settled.length - toBring.length} of ${settled.length}` : 'none'}`);
  if (toSend.length) want(`data-model-workflow, step 3: glossary-disposition settles every Glossary change in one run: ${toSend.map((c) => c.id).join(', ')}`);
  if (toBring.length) want(`data-model-workflow, step 4: things-author, then data-model-author, bring ${toBring.map((c) => c.id).join(', ')} into the data model`);

  // Workflow 2.
  out.push('', 'features-and-epics-workflow');
  const fe = [
    ['feature-catalog', 'Feature catalog', 'features-and-epics-workflow, step 1: feature-author writes the Feature catalog'],
    ['epic-grouping', 'EPIC grouping', 'features-and-epics-workflow, step 2: epic-grouping-author writes the EPIC grouping'],
    ['epic-register', 'EPIC register', 'features-and-epics-workflow, step 3: epic-author copies the EPIC register'],
  ];
  fe.forEach(([doc, name, nextText], i) => {
    const st = stateOf(at(doc));
    out.push(`- ${i + 1}. ${name}: ${show(st)}`);
    if (st.state !== 'accepted') want(nextText);
  });
  const generated = fs.existsSync(at('epic-sequencing')) && fs.existsSync(at('epic-mapping'));
  out.push(`- 4. EPIC sequencing and mapping: ${generated ? 'written' : 'not started'}`);
  if (!generated) want('features-and-epics-workflow, step 4: build-sequencing-mapping.cjs writes the EPIC sequencing and mapping');

  // The accepted catalog and register give the FRDs and the EPICs.
  const catalog = latestCopy(project, rp.relOf('feature-catalog'), args);
  const register = latestCopy(project, rp.relOf('epic-register'), args);
  const capabilityOf = new Map(); // feature -> FRD ID
  const frdName = new Map(); // FRD ID -> its name
  const catalogOrder = [];
  if (catalog) {
    for (const r of tableUnder(catalog, 'Feature catalog') || []) {
      const f = firstMatch(r['Feature ID'], /\bF-\d+\b/);
      const cap = list(r.Capability).join(' ').trim();
      const id = (cap.match(/\bFRD-\d+[a-z]\b/) || [])[0];
      if (!f || !id) continue;
      capabilityOf.set(f, id);
      if (!frdName.has(id)) {
        frdName.set(id, cap.replace(id, '').trim());
        catalogOrder.push(id);
      }
    }
  }
  const epics = [];
  if (register) {
    for (const r of tableUnder(register, 'EPICs') || []) {
      const id = firstMatch(r.EPIC, /\bEPIC-\d{3}\b/);
      if (!id) continue;
      epics.push({
        id,
        name: list(r.Name).join(' ').trim(),
        features: list(r.Features).join(' ').match(/\bF-\d+(?![.\d])/g) || [],
        dependsOn: list(r['Depends on']).join(' ').match(/\bEPIC-\d{3}\b/g) || [],
      });
    }
    const order = (tableUnder(register, 'Run order') || []).flatMap((r) => list(r.EPIC).join(' ').match(/\bEPIC-\d{3}\b/g) || []);
    epics.sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
    });
  }

  // Workflow 3: FRDs in EPIC register order, then any the register doesn't reach.
  // Each FRD's file is named after its capability: frd/frd-{capability}.md.
  const frdOrder = [];
  for (const e of epics) for (const f of e.features) {
    const id = capabilityOf.get(f);
    if (id && !frdOrder.includes(id)) frdOrder.push(id);
  }
  for (const id of catalogOrder) if (!frdOrder.includes(id)) frdOrder.push(id);
  const frdState = new Map();
  const frdWaits = new Map(); // FRD ID -> the settled answers an accepted FRD still waits on
  out.push('', 'frd-workflow, in EPIC register order');
  if (!catalog) out.push('- Waits for an accepted Feature catalog');
  for (const id of frdOrder) {
    const file = at('frd', { capability: rp.slug(frdName.get(id)) });
    const st = stateOf(file);
    frdState.set(id, st);
    out.push(`- ${id} ${frdName.get(id)}: ${show(st)}`);
    const waits = st.state === 'accepted' ? settledWaitsIn(file, decisions) : [];
    if (!waits.length) continue;
    frdWaits.set(id, waits);
    out.push(`- ${id} ${frdName.get(id)} waits on ${waits.join(', ')}, which ${waits.length > 1 ? 'are' : 'is'} settled now. frd-author runs again for it, writes the rule from the answer, and holds its gate again.`);
  }

  // Workflow 4: EPICs in run order.
  const epicState = new Map();
  out.push('', 'stories-workflow, in run order');
  if (!register) out.push('- Waits for an accepted EPIC register');
  for (const e of epics) {
    // Each EPIC's folder is named by its ID and name: epics/{epic}/.
    const listPath = at('story-list', { epic: `${e.id}-${rp.slug(e.name)}` });
    let st = stateOf(listPath);
    let note = '';
    if (st.state !== 'not started' && st.state !== 'parked') {
      const stories = tableUnder(listPath, 'Stories') || [];
      const ready = stories.filter((s) => list(s.Status).join(' ').trim().toLowerCase() === 'ready').length;
      note = ` (${ready} of ${stories.length} stories ready)`;
      st = stories.length && ready === stories.length && st.state === 'accepted' ? { state: 'ready' } : { state: 'drafted' };
    }
    epicState.set(e.id, st);
    out.push(`- ${e.id} ${e.name}: ${show(st)}${note}`);
  }

  // Open changes.
  out.push('', 'Open changes');
  const progress = rp.matches(project, 'change-progress', args);
  const open = progress.filter((p) => !/^Status: closed/im.test(rp.readText(p.abs)));
  if (!open.length) out.push('- None');
  for (const p of open) out.push(`- ${p.values.change}: open`);

  // Must answer questions follow you from step to step until they are answered.
  out.push('', 'Must answer, still open');
  const questions = grade(project, { output: args.output, checkOnly: true });
  const must = questions.open.filter((q) => q.group === 'Must answer');
  if (!must.length) out.push('- None');
  const plain = (cell) => list(cell).join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
  for (const q of must) out.push(`- question ${q.n}: ${q.title} Raised in ${plain(q.parts['Raised in'])}. Answer by: ${plain(q.parts['Answer by'])}. Next best action: ${plain(q.parts['Next best action'])}`);

  // Every data model decision still open, and every Glossary change the Glossary hasn't settled. A decision answered
  // "I don't know yet", or a change left open, is never forgotten: the skill named asks it again first.
  out.push('', 'Data model, still open');
  const thingsName = path.basename(thingsFile);
  const stillOpen = dm.stillOpen(decisions, thingsName);
  if (!stillOpen.length && !writeIn.length) out.push('- None');
  for (const o of stillOpen) out.push(openLine(o));
  // A settled decision whose "? (DM-n)" an accepted file still shows: its cells are still open.
  for (const id of [...new Set(writeIn.flatMap((w) => w.ids))]) {
    const e = decisions.inForce.get(id);
    const where = dm.fileOfWhere(e.fields.Where);
    const files = writeIn.filter((w) => w.ids.includes(id)).map((w) => w.file).join(', ');
    out.push(`- ${id}${where ? ` (${where})` : ''}: ${e.question} Settled, but ${files} still ${files.includes(',') ? 'show' : 'shows'} "? (${id})". data-model-author writes the answer in, in a change, at the next run of data-model-workflow.`);
  }
  // Who asks again what is still open, and when: a decision answered "I don't know yet", and a Glossary change left
  // open, are asked again first, at the next run of data-model-workflow. They hold up no step, so they go under "Next:".
  const again = new Map();
  for (const o of stillOpen) {
    const e = o.entry;
    if (!(e.kind === 'DM' ? e.proposed : e.state === 'left open')) continue;
    const file = o.asks === 'data-model-author' ? o.file : null;
    const key = `${o.asks} ${file || ''}`;
    if (!again.has(key)) again.set(key, { asks: o.asks, file, ids: [] });
    again.get(key).ids.push(e.id);
  }
  const askAgain = [...again.values()].map((a) => `- Still open: ${a.asks} asks ${a.ids.join(', ')} again first, at the next run of data-model-workflow${a.file ? `, for ${a.file}` : ''}. It holds up no other step.`);

  // Next, after workflows 1 and 2 and the data model: FRDs, then EPICs, then parked pieces. An accepted FRD that waits
  // on an answer now settled takes its place in the FRDs' order.
  if (!next) {
    const frdNext = frdOrder.find((id) => frdWaits.has(id) || !['accepted', 'parked'].includes(frdState.get(id).state));
    if (frdNext && frdWaits.has(frdNext)) want(`frd-author, for ${frdNext} ${frdName.get(frdNext)}: it brings in the settled answer of ${frdWaits.get(frdNext).join(', ')}, and holds its gate again`);
    else if (frdNext) want(`frd-workflow, for ${frdNext} ${frdName.get(frdNext)}`);
  }
  const waitsOn = (e) => {
    const frds = e.features.map((f) => capabilityOf.get(f)).filter(Boolean);
    const frd = frds.find((id) => frdState.get(id).state !== 'accepted');
    if (frd) return frd;
    return e.dependsOn.find((d) => epicState.has(d) && epicState.get(d).state === 'parked') || null;
  };
  if (!next) {
    const epicNext = epics.find((e) => !['ready', 'parked'].includes(epicState.get(e.id).state) && !waitsOn(e));
    if (epicNext) want(`stories-workflow, for ${epicNext.id} ${epicNext.name}`);
  }
  if (!next) {
    const parkedFrd = frdOrder.find((id) => frdState.get(id).state === 'parked');
    if (parkedFrd) want(`frd-workflow, for ${parkedFrd} ${frdName.get(parkedFrd)}, which was parked ${frdState.get(parkedFrd).detail}`);
  }
  if (!next) {
    const parkedEpic = epics.find((e) => epicState.get(e.id).state === 'parked');
    if (parkedEpic) want(`stories-workflow, for ${parkedEpic.id} ${parkedEpic.name}, which was parked ${epicState.get(parkedEpic.id).detail}`);
  }
  if (!next) want('nothing to run. Every FRD is accepted and every EPIC is ready.');

  out.push('', `Next: ${next}`, ...askAgain);
  process.stdout.write(out.join('\n') + '\n');
  return 0;
}

rp.run(main);
