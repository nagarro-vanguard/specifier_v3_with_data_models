#!/usr/bin/env node
'use strict';
// recommend.cjs — writes the recommendation of a change: which workflows to run, from which steps, for which items.
//
//   node tools/recommend.cjs --project <p> --change <nnn>
//
// What it does, from the change's report:
//   1. takes the path for each ask's kind, in section 7, exactly as master-plan.md section 4, "The kinds of change",
//      gives it. Already covered has nothing to run. Blocked has nothing until its question is answered.
//      data-model-workflow's two steps, things-author and data-model-author, sit after glossary-author and before
//      feature-author on the Net new and the Extend or enhance paths, and before frd-author on the Update or optimize
//      path.
//   2. gives each step on the path its items:
//      - every linked item that section 13 judges Update, New story or Split, given to the step that writes it:
//        - a business requirement: brd-author
//        - a requirement or an NFR: prd-author
//        - a thing or a data model row: data-model-author
//        - a feature or a piece: feature-author
//        - an EPIC: epic-author, in brief mode when the EPIC has a brief, in register mode otherwise
//        - an FRD or a rule: frd-author
//        - a story judged New story or Split: story-drafter
//        - a story judged Update: story-groomer. A story already ready in an accepted Story list is never
//          changed: it becomes "new story for the difference", for story-drafter.
//        - a scenario: ac-author, which also takes each story sent to story-drafter or story-groomer
//      - for a Net new or an Extend or enhance ask, "Ask n" too, for each step that writes the new part
//      - every agreed word section 5 says the change renames, for glossary-disposition
//      - every new word section 9 lists, for glossary-author
//      - for a Net new ask that names no business requirement or requirement in section 6, "Ask n", for brd-author:
//        it falls outside the BRD's scope
//      - when the project has a data model, read through lib/data-model.cjs:
//        - every renamed word and every new word, for things-author too, because the things file places every
//          agreed word
//        - every renamed word that a data model file uses, for data-model-author, with the files that use it
//        - every data model row that waits on this change, for data-model-author. A row waits on it when one of its
//          cells holds a Proposed answer to a question this change answers.
//        With no data model, the two data model steps have nothing to do.
//   3. leaves out each step of the path that has no items, and says why. Adds each step that has items though the
//      path doesn't name it, and says so.
//   4. orders the steps as the workflows run. The size, in section 14, is a hint for priority, and changes nothing here.
//   5. offers a small update instead, when one fits:
//      - "Insert it": an ask that reads "Question 7 is answered: ...", whose question has Low impact or whose answer
//        confirms the answer in use. It names every place insert-answer.cjs would change.
//      - "Copy the wording": an ask whose update test reads "wording only" and nothing else. It names every place
//        copy-wording.cjs would change.
//   6. flags a dramatic change: when the change reaches more than half of the BRD's business requirements, through
//      its linked items, it offers a re-run of the whole workflow
//   7. lists your choices at the gate, and the one it recommends
//
// It writes section 15, "The recommendation".
//
// Exit codes: 0 written; 2 the change, its report, the map or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const md = require('./lib/md-tables.cjs');
const rp = require('./lib/run-paths.cjs');
const cd = require('./lib/check-document.cjs');
const cr = require('./lib/change-report.cjs');
const fl = require('./find-linked.cjs');
const tm = require('./traceability-map.cjs');
const ia = require('./insert-answer.cjs');
const cw = require('./copy-wording.cjs');
const dm = require('./lib/data-model.cjs');

// "More than half" of the business requirements makes a change dramatic. A starting point, and can be changed.
const DRAMATIC = 0.5;

// Every step a recommendation can name, in the order the workflows run. "doc" is the document the step accepts.
const STEPS = {
  'glossary-disposition': { workflow: 'on its own', step: 'glossary-disposition', doc: 'gate-log' },
  'brd-author': { workflow: 'requirements-workflow', step: 'step 2, brd-author', doc: 'brd' },
  'prd-author': { workflow: 'requirements-workflow', step: 'step 3, prd-author', doc: 'prd' },
  'glossary-author': { workflow: 'on its own', step: 'glossary-author', doc: 'gate-log' },
  'things-author': { workflow: 'data-model-workflow', step: 'step 1, things-author', doc: 'data-model-things' },
  'data-model-author': { workflow: 'data-model-workflow', step: 'step 2, data-model-author', doc: 'data-model' },
  'feature-author': { workflow: 'features-and-epics-workflow', step: 'step 1, feature-author', doc: 'feature-catalog' },
  'epic-grouping-author': { workflow: 'features-and-epics-workflow', step: 'step 2, epic-grouping-author', doc: 'epic-grouping' },
  'epic-author-register': { workflow: 'features-and-epics-workflow', step: 'step 3, epic-author', doc: 'epic-register' },
  'frd-author': { workflow: 'frd-workflow', step: 'step 2, frd-author', doc: 'frd' },
  'epic-author-brief': { workflow: 'stories-workflow', step: 'step 3, epic-author', doc: 'epic-brief' },
  'story-drafter': { workflow: 'stories-workflow', step: 'step 4, story-drafter', doc: 'story-list' },
  'story-groomer': { workflow: 'stories-workflow', step: 'step 5, story-groomer', doc: 'story-list' },
  'ac-author': { workflow: 'stories-workflow', step: 'step 6, ac-author', doc: 'story-list' },
};
const ORDER = Object.keys(STEPS);

// The path for each kind, as master-plan.md section 4 gives it. "ask" marks a step that writes the new part of a
// Net new or an Extend or enhance ask, so it takes "Ask n".
const PATHS = {
  'Net new': [['brd-author'], ['prd-author', 'ask'], ['glossary-author'], ['things-author'], ['data-model-author', 'ask'], ['feature-author', 'ask'], ['epic-grouping-author', 'ask'], ['frd-author', 'ask'], ['story-drafter', 'ask'], ['story-groomer', 'ask'], ['ac-author', 'ask']],
  'Extend or enhance': [['glossary-disposition'], ['brd-author'], ['prd-author', 'ask'], ['glossary-author'], ['things-author'], ['data-model-author', 'ask'], ['feature-author', 'ask'], ['frd-author', 'ask'], ['story-groomer', 'ask'], ['ac-author', 'ask'], ['story-drafter']],
  'Update or optimize': [['glossary-disposition'], ['brd-author'], ['prd-author'], ['things-author'], ['data-model-author'], ['frd-author'], ['story-groomer'], ['ac-author']],
  'Already covered': [],
  Blocked: [],
};
// The steps of data-model-workflow. They have nothing to do in a project with no data model.
const DATA_MODEL = ['things-author', 'data-model-author'];

// Why a step of the path has nothing to do.
const LEFT_OUT = {
  'glossary-disposition': 'section 5 lists no agreed word this change renames',
  'brd-author': 'no business requirement is judged to change, and no new ask falls outside the BRD\'s scope',
  'prd-author': 'no requirement is judged to change',
  'glossary-author': 'section 9 lists no new word',
  'things-author': 'section 5 lists no agreed word this change renames, and section 9 lists no new word',
  'data-model-author': 'no data model row is judged to change, and none waits on this change',
  'frd-author': 'no FRD or rule is judged to change',
  'story-drafter': 'no story is added',
  'story-groomer': 'no story is judged to change',
  'ac-author': 'no scenario is judged to change',
};

const label = (k) => `${STEPS[k].workflow === 'on its own' ? '' : `${STEPS[k].workflow}, `}${STEPS[k].step}`;
const storyTitle = (cell) => { const s = md.list(cell).join(' ').trim(); const m = s.match(/^\[([^\]]+)\]/); return m ? m[1].trim() : s; };

// The context every judgement is read in: the items and links of the accepted and drafted documents.
function context(project, opts) {
  const { known, links } = fl.working(project, opts);
  const briefs = rp.matches(project, 'epic-brief', opts);
  const latest = tm.latestAccepted(project, opts);
  // A story is ready for good when the latest accepted copy of its Story list marks it ready.
  const ready = (title, listRel) => {
    const v = latest.get(listRel);
    if (!v) return false;
    const copy = rp.pathOf(project, 'version-copy', { document: listRel.replace(/\.md$/, ''), n: v }, opts);
    if (!fs.existsSync(copy)) return false;
    return (md.tableUnder(rp.readText(copy), 'Stories') || []).some((r) => storyTitle(r.Story) === title && md.list(r.Status).join(' ').trim().toLowerCase() === 'ready');
  };
  const briefOf = (epic) => briefs.find((m) => m.values.epic === epic || m.values.epic.startsWith(`${epic}-`));
  return { known, links, ready, briefOf };
}

// The project's data model, read through lib/data-model.cjs, or null when the project has no things file yet. A data
// model file the things file names but that isn't written yet is left out.
function dataModelOf(project, opts) {
  if (!fs.existsSync(rp.pathOf(project, 'data-model-things', {}, opts))) return null;
  const model = dm.load(project, { ...opts, allowMissing: true });
  return { ...model, files: model.files.filter((f) => f.exists) };
}

// Every data model row that waits on this change: one of its cells holds a Proposed answer to a question in
// questions. Each is { id, document, why }.
function waitingRows(model, questions) {
  const out = [];
  for (const f of model.files) {
    for (const part of f.parts) {
      for (const t of part.tables) {
        if (!['actions', 'fields', 'moves'].includes(t.kind)) continue;
        for (const row of t.rows) {
          const cells = Object.keys(row).filter((k) => !k.startsWith('_')).map((k) => dm.cell(row[k]));
          const asked = [...new Set(cells.flatMap((c) => c.proposed.map((p) => p.question)))].filter((q) => questions.includes(q));
          if (!asked.length) continue;
          const name = t.kind === 'moves' ? dm.moveName(row) : dm.cell(t.kind === 'actions' ? row.Action : row.Field).text;
          out.push({ id: `${part.thing}, ${name}`, document: f.rel, why: asked.map((q) => `question ${q}'s answer`) });
        }
      }
    }
  }
  return out;
}

// The data model files that use a word, as a whole word, in any case.
function filesUsing(model, word) {
  const re = new RegExp(`(^|[^A-Za-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`, 'i');
  return model.files.filter((f) => re.test(rp.readText(f.file))).map((f) => f.rel);
}

// The Story list a stories-workflow item belongs to: a story's own list, or the list beside the Story a scenario is in.
function storyListOf(project, item, opts) {
  if (!item.document) return null;
  const id = rp.identify(item.document);
  if (!id) return null;
  if (id.document === 'story-list') return item.document;
  if (id.document === 'story') return rp.relOf('story-list', { product: project, epic: id.values.epic });
  return null;
}

function recommendation(project, change, opts = {}) {
  const r = cr.read(project, change, opts);
  const ctx = context(project, opts);
  const kinds = [...new Set(r.kinds.map((k) => k.kind))];
  const model = dataModelOf(project, opts);
  const out = { report: r, rows: [], left: [], added: [], offers: [], notOffered: [], dramatic: null, choices: [], recommended: null, dataModel: Boolean(model) };

  const blocked = kinds.includes('Blocked');
  const items = new Map(ORDER.map((k) => [k, []]));
  const give = (k, it) => { if (!items.get(k).some((x) => x.label === it.label)) items.get(k).push(it); };

  if (!blocked) {
    for (const j of r.judged) {
      if (j.judgement === 'No change') continue;
      const it = { id: j.id, label: j.id, ...(ctx.known.get(j.id) || { type: (r.linked.find((l) => l.id === j.id) || {}).type }) };
      switch (it.type) {
        case 'BR': give('brd-author', it); break;
        case 'requirement': case 'NFR': give('prd-author', it); break;
        case 'thing': case 'data model row': give('data-model-author', it); break;
        case 'feature': case 'piece': give('feature-author', it); break;
        case 'EPIC': give(ctx.briefOf(j.id) ? 'epic-author-brief' : 'epic-author-register', it); break;
        case 'FRD': case 'rule': give('frd-author', it); break;
        case 'story':
          if (j.judgement === 'Update' && !ctx.ready(j.id, it.document)) give('story-groomer', it);
          else give('story-drafter', { ...it, label: j.judgement === 'Update' ? `new story for the difference: ${j.id}` : j.id });
          break;
        case 'scenario': give('ac-author', it); break;
        default: break;
      }
    }
    // ac-author writes the criteria of every story sent to story-drafter or story-groomer, unless its scenarios are listed.
    for (const k of ['story-drafter', 'story-groomer']) {
      for (const it of items.get(k)) {
        if (!items.get('ac-author').some((s) => s.id.startsWith(`${it.id}, `))) give('ac-author', it);
      }
    }
    for (const w of r.renames) give('glossary-disposition', { id: w.word, label: `${w.word}, becomes ${w.becomes}` });
    for (const w of r.newWords) give('glossary-author', { id: w, label: `New word: ${w}` });
    if (model) {
      // The things file places every agreed word, so a renamed word or a new one is things-author's too.
      for (const w of r.renames) give('things-author', { id: w.word, label: `${w.word}, becomes ${w.becomes}` });
      for (const w of r.newWords) give('things-author', { id: w, label: `New word: ${w}` });
      for (const w of r.renames) {
        const files = filesUsing(model, w.word);
        if (files.length) give('data-model-author', { id: w.word, label: `${w.word}, becomes ${w.becomes}`, documents: files });
      }
      // The rows that wait on this change: each one that holds a Proposed answer to a question this change answers.
      const late = r.asks.map((a) => (a.restated.match(/^Question (\d+) is answered:/i) || [])[1]).filter(Boolean).map(Number);
      for (const x of waitingRows(model, late)) {
        if (!items.get('data-model-author').some((it) => it.id === x.id)) give('data-model-author', { id: x.id, label: `${x.id}: ${x.why.join(', ')}`, document: x.document, waits: true });
      }
    }
    for (const k of r.kinds) {
      const steps = PATHS[k.kind] || [];
      const land = r.lands.find((l) => l.ask === k.ask) || { ids: [] };
      for (const [step, ask] of steps) {
        // With no data model, data-model-author has no new part to write.
        if (ask && (model || !DATA_MODEL.includes(step))) give(step, { id: `Ask ${k.ask}`, label: `Ask ${k.ask}`, ask: k.ask, lands: land.ids });
      }
      if (k.kind === 'Net new' && !land.ids.some((id) => ['BR', 'requirement'].includes((ctx.known.get(id) || {}).type))) give('brd-author', { id: `Ask ${k.ask}`, label: `Ask ${k.ask}`, ask: k.ask, lands: land.ids });
    }
  }

  const onPath = new Set(kinds.flatMap((k) => (PATHS[k] || []).map(([s]) => s)));
  for (const k of ORDER) {
    if (items.get(k).length) {
      out.rows.push({ key: k, ...STEPS[k], items: items.get(k) });
      if (!onPath.has(k)) out.added.push(k);
    } else if (onPath.has(k)) out.left.push(k);
  }

  // A small update, instead of the path.
  for (const a of r.asks) {
    const late = a.restated.match(/^Question (\d+) is answered:/i);
    if (!late) continue;
    const p = ia.places(project, Number(late[1]), opts);
    if (p.error) { out.notOffered.push(`Insert it: ${p.error}`); continue; }
    const confirms = p.answer.whole.toLowerCase() === p.answer.inUse.toLowerCase();
    if (p.answer.impact !== 'Low' && !confirms) out.notOffered.push(`Insert it: question ${late[1]}'s impact is ${p.answer.impact || 'not rated'}, and its answer doesn't confirm the answer in use`);
    else if (p.refused.length) out.notOffered.push(`Insert it: ${cd.plural(p.refused.length, 'place')} would need other words changed`);
    else if (!p.places.length) out.notOffered.push(`Insert it: no document names question ${late[1]} as a gap`);
    else out.offers.push({ choice: 'Insert it', program: 'insert-answer.cjs', what: `question ${late[1]}'s answer`, places: p.places.map((x) => ({ rel: x.rel, where: x.where, before: x.before, after: x.after })) });
  }
  for (const k of r.kinds) {
    const wording = k.tests.filter((t) => t.result === 'wording only');
    if (!wording.length || k.tests.some((t) => t.result !== 'wording only' && t.result !== 'same')) continue;
    for (const t of wording) {
      const now = cw.newWording(r, t.id);
      if (!now) { out.notOffered.push(`Copy the wording: section 5 gives no new wording for ${t.id}`); continue; }
      const p = cw.places(project, t.id, opts);
      if (p.error) out.notOffered.push(`Copy the wording: ${p.error}`);
      else if (p.drifted.length) out.notOffered.push(`Copy the wording: ${cd.plural(p.drifted.length, 'place')} quote ${t.id} differently from the PRD`);
      else out.offers.push({ choice: 'Copy the wording', program: 'copy-wording.cjs', what: `${t.id}'s new wording`, places: p.places.map((x) => ({ rel: x.rel, where: x.where, before: p.old, after: now })) });
    }
  }

  // A dramatic change: the business requirements its linked items reach, up the links.
  const brs = [...ctx.known.values()].filter((i) => i.type === 'BR').map((i) => i.id);
  if (brs.length) {
    const up = new Map();
    const add = (from, to) => { if (!up.has(from)) up.set(from, []); up.get(from).push(to); };
    for (const l of ctx.links) {
      if (['traces', 'covers', 'tells', 'names-rule', 'proves'].includes(l.type)) add(l.from, l.to);
      if (['has-piece', 'has-rule'].includes(l.type)) add(l.to, l.from);
    }
    const seen = new Set();
    const queue = r.linked.map((l) => l.id).filter((id) => !['FRD', 'EPIC'].includes((ctx.known.get(id) || {}).type));
    while (queue.length) {
      const id = queue.shift();
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push(...(up.get(id) || []));
    }
    const reached = brs.filter((b) => seen.has(b));
    if (reached.length > brs.length * DRAMATIC) out.dramatic = { reached: reached.length, of: brs.length };
  }

  // The choices at the gate, and the one recommended.
  const path = out.rows.length > 0;
  if (blocked) {
    const q = (r.blockers.join(' ').match(/question (\d+)/i) || [])[1];
    out.recommended = q ? `Answer question ${q} first` : 'Answer the question that blocks it first';
  } else {
    if (path) out.choices.push(['Run the path', 'change-orchestration-workflow makes the updates above, in order, with no more questions']);
    for (const o of out.offers) out.choices.push([o.choice, `${o.program} writes ${o.what} in the places above, and nothing is re-run`]);
    if (out.dramatic) out.choices.push(['Re-run the whole workflow', 'from requirements-workflow, step 1, discovery-author']);
    if (!path && !out.offers.length) out.choices.push(['Close it', 'nothing needs to change, so the change closes when you accept']);
    out.choices.push(['Correct the analysis', 'change-request-workflow redoes it from step 2, with your correction']);
    out.recommended = out.offers.length ? out.offers[0].choice : path ? 'Run the path' : 'Close it';
  }
  return out;
}

function lines(o) {
  const out = [];
  const kinds = o.report.kinds.map((k) => k.kind);
  if (kinds.includes('Blocked')) {
    out.push(`Nothing is recommended until the question that blocks it is answered: see section 10.`, '', `**Recommended:** ${o.recommended}`);
    return out;
  }
  if (o.rows.length) {
    out.push('| Order | Workflow | Step | Items |', '|---|---|---|---|');
    o.rows.forEach((x, i) => out.push(`| ${i + 1} | ${x.workflow} | ${x.step} | ${x.items.map((it) => `• ${it.label}`).join('<br>')} |`));
  } else out.push(kinds.every((k) => k === 'Already covered') ? 'Nothing to run: the documents already say it.' : 'Nothing to run on the path.');
  const leftOut = (k) => (DATA_MODEL.includes(k) && !o.dataModel ? 'the project has no data model yet' : LEFT_OUT[k]);
  const addedWhy = (k) => (o.rows.find((x) => x.key === k).items.every((it) => it.waits)
    ? 'its data model rows wait on this change, though the path for the kind doesn\'t name it'
    : 'section 13 judges its items to change, though the path for the kind doesn\'t name it');
  if (o.left.length) out.push('', '**Left out of the path:**', ...o.left.map((k) => `- ${label(k)}: ${leftOut(k)}`));
  if (o.added.length) out.push('', '**Added to the path:**', ...o.added.map((k) => `- ${label(k)}: ${addedWhy(k)}`));
  for (const of of o.offers) {
    out.push('', `**${of.choice} instead:** ${of.program} writes ${of.what} in these places, and nothing else changes:`);
    for (const p of of.places) out.push(`- ${p.rel}, ${p.where}: "${p.before}" becomes "${p.after}"`);
  }
  if (o.notOffered.length) out.push('', '**Not offered:**', ...o.notOffered.map((x) => `- ${x}`));
  if (o.dramatic) out.push('', `**This change reaches most of the business requirements:** ${o.dramatic.reached} of ${o.dramatic.of}. Consider a re-run of the whole workflow, from requirements-workflow, step 1.`);
  out.push('', '**Your choices at the gate:**', ...o.choices.map(([c, what]) => `- **${c}:** ${what}`));
  out.push('', `**Recommended:** ${o.recommended}`);
  return out;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true) rp.fail('Use: node tools/recommend.cjs --project <p> --change <nnn>', 2);
  const o = recommendation(args.project, change, { output: args.output });
  cd.replaceSection(o.report.change.report, 'The recommendation', lines(o));
  process.stdout.write(`recommend.cjs: change ${o.report.change.number}, ${cd.plural(o.rows.length, 'step')} in the recommendation; recommended: ${o.recommended}. Written to section 15.\n`);
  return 0;
}

module.exports = { recommendation, lines, STEPS, PATHS, DATA_MODEL, storyListOf, DRAMATIC };

if (require.main === module) rp.run(main);
