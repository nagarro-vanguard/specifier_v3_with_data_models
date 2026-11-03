// recommend.ts — writes the recommendation of a change: which workflows to run, from which steps, for which items.
//
//   node tools/recommend.ts --project <p> --change <nnn>
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
//      - when the project has a data model, read through lib/data-model.ts:
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
//        confirms the answer in use. It names every place insert-answer.ts would change.
//      - "Copy the wording": an ask whose update test reads "wording only" and nothing else. It names every place
//        copy-wording.ts would change.
//   6. flags a dramatic change: when the change reaches more than half of the BRD's business requirements, through
//      its linked items, it offers a re-run of the whole workflow
//   7. lists your choices at the gate, and the one it recommends
//
// It writes section 15, "The recommendation".
//
// Exports: recommendation(project, change, opts), the recommendation; lines(recommendation), section 15's lines;
// STEPS, PATHS, DATA_MODEL and DRAMATIC, the steps, the paths and the rules it follows; storyListOf(project, item),
// the Story list an item belongs to.
//
// Exit codes: 0 written; 2 the change, its report, the map or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import { parseArgs, requireOption, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { identify, matches, pathOf, readText, relOf, type MatchedFile, type PathOptions } from './lib/run-paths.ts';
import { list, tableUnder, type Cell } from './lib/md-tables.ts';
import { replaceSection } from './lib/check-document.ts';
import { read, type ChangeReport } from './lib/change-report.ts';
import { load as loadDataModel, cell, moveName, type DataModel } from './lib/data-model.ts';
import { plural, escapeRegExp } from './lib/text.ts';
import { working, type WorkingSet } from './find-linked.ts';
import { latestAccepted } from './traceability-map.ts';
import { places as insertPlaces } from './insert-answer.ts';
import { places as wordingPlaces, newWording } from './copy-wording.ts';

const USE = 'Use: node tools/recommend.ts --project <p> --change <nnn>';

// "More than half" of the business requirements makes a change dramatic. A starting point, and can be changed.
export const DRAMATIC = 0.5;

// Every step a recommendation can name, in the order the workflows run. "doc" is the document the step accepts.
export const STEPS = {
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
} as const;

export type StepKey = keyof typeof STEPS;
export type Step = (typeof STEPS)[StepKey];
const ORDER = Object.keys(STEPS) as StepKey[];

// One step of a path. "ask" marks a step that writes the new part of a Net new or an Extend or enhance ask, so it
// takes "Ask n".
type PathStep = readonly [StepKey, 'ask'?];

// The path for each kind, as master-plan.md section 4 gives it.
export const PATHS: Readonly<Record<string, readonly PathStep[]>> = {
  'Net new': [['brd-author'], ['prd-author', 'ask'], ['glossary-author'], ['things-author'], ['data-model-author', 'ask'], ['feature-author', 'ask'], ['epic-grouping-author', 'ask'], ['frd-author', 'ask'], ['story-drafter', 'ask'], ['story-groomer', 'ask'], ['ac-author', 'ask']],
  'Extend or enhance': [['glossary-disposition'], ['brd-author'], ['prd-author', 'ask'], ['glossary-author'], ['things-author'], ['data-model-author', 'ask'], ['feature-author', 'ask'], ['frd-author', 'ask'], ['story-groomer', 'ask'], ['ac-author', 'ask'], ['story-drafter']],
  'Update or optimize': [['glossary-disposition'], ['brd-author'], ['prd-author'], ['things-author'], ['data-model-author'], ['frd-author'], ['story-groomer'], ['ac-author']],
  'Already covered': [],
  Blocked: [],
};
// The steps of data-model-workflow. They have nothing to do in a project with no data model.
export const DATA_MODEL: readonly StepKey[] = ['things-author', 'data-model-author'];

// Why a step of the path has nothing to do.
const LEFT_OUT: Partial<Record<StepKey, string>> = {
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

// The links followed up, from an item to the business requirements it reaches: from the item that links, and back.
const UP = ['traces', 'covers', 'tells', 'names-rule', 'proves'] as const;
const UP_BACK = ['has-piece', 'has-rule'] as const;

// One item a step is given.
export interface StepItem {
  id: string;
  label: string;
  type?: string;
  document?: string;
  // The data model files a renamed word is used in.
  documents?: string[];
  // For "Ask n": the ask, and the IDs it lands on in section 6.
  ask?: string;
  lands?: string[];
  // A data model row that waits on this change.
  waits?: boolean;
}

export interface RecommendRow {
  key: StepKey;
  workflow: Step['workflow'];
  step: Step['step'];
  doc: Step['doc'];
  items: StepItem[];
}

export interface OfferPlace {
  rel: string;
  where: string;
  before: string;
  after: string;
}

// A small update offered instead of the path.
export interface Offer {
  choice: 'Insert it' | 'Copy the wording';
  program: string;
  what: string;
  places: OfferPlace[];
}

export interface Recommendation {
  report: ChangeReport;
  rows: RecommendRow[];
  left: StepKey[];
  added: StepKey[];
  offers: Offer[];
  notOffered: string[];
  dramatic: { reached: number; of: number } | null;
  // Each choice at the gate, and what happens when it is chosen.
  choices: [string, string][];
  recommended: string | null;
  dataModel: boolean;
}

// The context every judgement is read in: the items and links of the accepted and drafted documents.
interface Context extends WorkingSet {
  ready: (title: string, listRel: string | undefined) => boolean;
  briefOf: (epic: string) => MatchedFile | undefined;
}

type Items = Map<StepKey, StepItem[]>;

const label = (k: StepKey): string => `${STEPS[k].workflow === 'on its own' ? '' : `${STEPS[k].workflow}, `}${STEPS[k].step}`;
const oneLine = (c: Cell | undefined): string => list(c).join(' ').trim();
const storyTitle = (c: Cell | undefined): string => {
  const s = oneLine(c);
  const m = s.match(/^\[([^\]]+)\]/);
  return m ? m[1].trim() : s;
};

function context(project: string, opts: PathOptions): Context {
  const { known, links } = working(project, opts);
  const briefs = matches(project, 'epic-brief', opts);
  const latest = latestAccepted(project, opts);
  // A story is ready for good when the latest accepted copy of its Story list marks it ready.
  const ready = (title: string, listRel: string | undefined): boolean => {
    const version = listRel && latest.get(listRel);
    if (!listRel || !version) return false;
    const copy = pathOf(project, 'version-copy', { document: listRel.replace(/\.md$/, ''), n: String(version) }, opts);
    if (!fs.existsSync(copy)) return false;
    return (tableUnder(readText(copy), 'Stories') || []).some((r) => storyTitle(r.Story) === title && oneLine(r.Status).toLowerCase() === 'ready');
  };
  const briefOf = (epic: string) => briefs.find((m) => m.values.epic === epic || String(m.values.epic).startsWith(`${epic}-`));
  return { known, links, ready, briefOf };
}

// The project's data model, read through lib/data-model.ts, or null when the project has no things file yet. A data
// model file the things file names but that isn't written yet is left out.
function dataModelOf(project: string, opts: PathOptions): DataModel | null {
  if (!fs.existsSync(pathOf(project, 'data-model-things', {}, opts))) return null;
  const model = loadDataModel(project, { ...opts, allowMissing: true });
  return { ...model, files: model.files.filter((f) => f.exists) };
}

// Every data model row that waits on this change: one of its cells holds a Proposed answer to a question in
// questions.
function waitingRows(model: DataModel, questions: number[]): { id: string; document: string; why: string[] }[] {
  const out: { id: string; document: string; why: string[] }[] = [];
  for (const f of model.files) {
    for (const part of f.parts) {
      for (const t of part.tables) {
        if (!['actions', 'fields', 'moves'].includes(t.kind)) continue;
        for (const row of t.rows) {
          const cells = Object.keys(row).filter((k) => !k.startsWith('_')).map((k) => cell(row[k]));
          const asked = [...new Set(cells.flatMap((c) => c.proposed.map((p) => p.question)))].filter((q) => questions.includes(q));
          if (!asked.length) continue;
          const name = t.kind === 'moves' ? moveName(row) : cell(t.kind === 'actions' ? row.Action : row.Field).text;
          out.push({ id: `${part.thing}, ${name}`, document: f.rel, why: asked.map((q) => `question ${q}'s answer`) });
        }
      }
    }
  }
  return out;
}

// The data model files that use a word, as a whole word, in any case.
function filesUsing(model: DataModel, word: string): string[] {
  const re = new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(word)}(?![A-Za-z0-9])`, 'i');
  return model.files.filter((f) => re.test(readText(f.file))).map((f) => f.rel);
}

// The Story list a stories-workflow item belongs to: a story's own list, or the list beside the Story a scenario is in.
export function storyListOf(project: string, item: { document?: string }): string | null {
  if (!item.document) return null;
  const id = identify(item.document);
  if (!id) return null;
  if (id.document === 'story-list') return item.document;
  if (id.document === 'story') return relOf('story-list', { product: project, epic: id.values.epic });
  return null;
}

// Gives a step an item, unless it has one with the same label.
function give(items: Items, k: StepKey, it: StepItem): void {
  const given = items.get(k)!;
  if (!given.some((x) => x.label === it.label)) given.push(it);
}

// Every linked item section 13 judges to change, given to the step that writes it.
function giveJudged(items: Items, r: ChangeReport, ctx: Context): void {
  for (const j of r.judged) {
    if (j.judgement === 'No change') continue;
    const it: StepItem = { id: j.id, label: j.id, ...(ctx.known.get(j.id) || { type: r.linked.find((l) => l.id === j.id)?.type }) };
    switch (it.type) {
      case 'BR': give(items, 'brd-author', it); break;
      case 'requirement': case 'NFR': give(items, 'prd-author', it); break;
      case 'thing': case 'data model row': give(items, 'data-model-author', it); break;
      case 'feature': case 'piece': give(items, 'feature-author', it); break;
      case 'EPIC': give(items, ctx.briefOf(j.id) ? 'epic-author-brief' : 'epic-author-register', it); break;
      case 'FRD': case 'rule': give(items, 'frd-author', it); break;
      case 'story':
        if (j.judgement === 'Update' && !ctx.ready(j.id, it.document)) give(items, 'story-groomer', it);
        else give(items, 'story-drafter', { ...it, label: j.judgement === 'Update' ? `new story for the difference: ${j.id}` : j.id });
        break;
      case 'scenario': give(items, 'ac-author', it); break;
      default: break;
    }
  }
  // ac-author writes the criteria of every story sent to story-drafter or story-groomer, unless its scenarios are listed.
  for (const k of ['story-drafter', 'story-groomer'] as const) {
    for (const it of items.get(k)!) {
      if (!items.get('ac-author')!.some((s) => s.id.startsWith(`${it.id}, `))) give(items, 'ac-author', it);
    }
  }
}

// The renamed and new words, for the Glossary's steps, and, with a data model, for its steps too.
function giveWords(items: Items, r: ChangeReport, model: DataModel | null): void {
  for (const w of r.renames) give(items, 'glossary-disposition', { id: w.word, label: `${w.word}, becomes ${w.becomes}` });
  for (const w of r.newWords) give(items, 'glossary-author', { id: w, label: `New word: ${w}` });
  if (!model) return;
  // The things file places every agreed word, so a renamed word or a new one is things-author's too.
  for (const w of r.renames) give(items, 'things-author', { id: w.word, label: `${w.word}, becomes ${w.becomes}` });
  for (const w of r.newWords) give(items, 'things-author', { id: w, label: `New word: ${w}` });
  for (const w of r.renames) {
    const files = filesUsing(model, w.word);
    if (files.length) give(items, 'data-model-author', { id: w.word, label: `${w.word}, becomes ${w.becomes}`, documents: files });
  }
  // The rows that wait on this change: each one that holds a Proposed answer to a question this change answers.
  const late = r.asks.map((a) => a.restated.match(/^Question (\d+) is answered:/i)?.[1]).filter(Boolean).map(Number);
  for (const x of waitingRows(model, late)) {
    if (!items.get('data-model-author')!.some((it) => it.id === x.id)) give(items, 'data-model-author', { id: x.id, label: `${x.id}: ${x.why.join(', ')}`, document: x.document, waits: true });
  }
}

// "Ask n", for each step of its path that writes the new part, and for brd-author when a Net new ask falls outside the
// BRD's scope.
function giveAsks(items: Items, r: ChangeReport, ctx: Context, model: DataModel | null): void {
  for (const k of r.kinds) {
    const steps = PATHS[k.kind] || [];
    const land = r.lands.find((l) => l.ask === k.ask) || { ids: [] };
    for (const [step, ask] of steps) {
      // With no data model, data-model-author has no new part to write.
      if (ask && (model || !DATA_MODEL.includes(step))) give(items, step, { id: `Ask ${k.ask}`, label: `Ask ${k.ask}`, ask: k.ask, lands: land.ids });
    }
    if (k.kind === 'Net new' && !land.ids.some((id) => ['BR', 'requirement'].includes(ctx.known.get(id)?.type ?? ''))) give(items, 'brd-author', { id: `Ask ${k.ask}`, label: `Ask ${k.ask}`, ask: k.ask, lands: land.ids });
  }
}

// Each step with items, in order, and the steps of the path left out or added.
function pathRows(kinds: string[], items: Items): Pick<Recommendation, 'rows' | 'left' | 'added'> {
  const onPath = new Set(kinds.flatMap((k) => (PATHS[k] || []).map(([s]) => s)));
  const out: Pick<Recommendation, 'rows' | 'left' | 'added'> = { rows: [], left: [], added: [] };
  for (const k of ORDER) {
    if (items.get(k)!.length) {
      out.rows.push({ key: k, ...STEPS[k], items: items.get(k)! });
      if (!onPath.has(k)) out.added.push(k);
    } else if (onPath.has(k)) out.left.push(k);
  }
  return out;
}

// "Insert it", for each ask that reads "Question n is answered: ...", or why it isn't offered.
function insertOffers(project: string, r: ChangeReport, opts: PathOptions, out: Recommendation): void {
  for (const a of r.asks) {
    const late = a.restated.match(/^Question (\d+) is answered:/i);
    if (!late) continue;
    const p = insertPlaces(project, Number(late[1]), opts);
    if ('error' in p) { out.notOffered.push(`Insert it: ${p.error}`); continue; }
    const confirms = p.answer.whole.toLowerCase() === p.answer.inUse.toLowerCase();
    if (p.answer.impact !== 'Low' && !confirms) out.notOffered.push(`Insert it: question ${late[1]}'s impact is ${p.answer.impact || 'not rated'}, and its answer doesn't confirm the answer in use`);
    else if (p.refused.length) out.notOffered.push(`Insert it: ${plural(p.refused.length, 'place')} would need other words changed`);
    else if (!p.places.length) out.notOffered.push(`Insert it: no document names question ${late[1]} as a gap`);
    else out.offers.push({ choice: 'Insert it', program: 'insert-answer.ts', what: `question ${late[1]}'s answer`, places: p.places.map((x) => ({ rel: x.rel, where: x.where, before: x.before, after: x.after })) });
  }
}

// "Copy the wording", for each ask whose update test reads "wording only" and nothing else, or why it isn't offered.
function copyOffers(project: string, r: ChangeReport, opts: PathOptions, out: Recommendation): void {
  for (const k of r.kinds) {
    const wording = k.tests.filter((t) => t.result === 'wording only');
    if (!wording.length || k.tests.some((t) => t.result !== 'wording only' && t.result !== 'same')) continue;
    for (const t of wording) {
      const now = newWording(r, t.id);
      if (!now) { out.notOffered.push(`Copy the wording: section 5 gives no new wording for ${t.id}`); continue; }
      const p = wordingPlaces(project, t.id, opts);
      if ('error' in p) out.notOffered.push(`Copy the wording: ${p.error}`);
      else if (p.drifted.length) out.notOffered.push(`Copy the wording: ${plural(p.drifted.length, 'place')} quote ${t.id} differently from the PRD`);
      else out.offers.push({ choice: 'Copy the wording', program: 'copy-wording.ts', what: `${t.id}'s new wording`, places: p.places.map((x) => ({ rel: x.rel, where: x.where, before: p.old, after: now })) });
    }
  }
}

// A dramatic change: the business requirements its linked items reach, up the links, are more than half of them.
function dramaticOf(r: ChangeReport, ctx: Context): Recommendation['dramatic'] {
  const brs = [...ctx.known.values()].filter((i) => i.type === 'BR').map((i) => i.id);
  if (!brs.length) return null;
  const up = new Map<string, string[]>();
  const add = (from: string, to: string) => {
    if (!up.has(from)) up.set(from, []);
    up.get(from)!.push(to);
  };
  for (const l of ctx.links) {
    if ((UP as readonly string[]).includes(l.type)) add(l.from, l.to);
    if ((UP_BACK as readonly string[]).includes(l.type)) add(l.to, l.from);
  }
  const seen = new Set<string>();
  const queue = r.linked.map((l) => l.id).filter((id) => !['FRD', 'EPIC'].includes(ctx.known.get(id)?.type ?? ''));
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...(up.get(id) || []));
  }
  const reached = brs.filter((b) => seen.has(b));
  return reached.length > brs.length * DRAMATIC ? { reached: reached.length, of: brs.length } : null;
}

// The choices at the gate, and the one recommended.
function choose(r: ChangeReport, blocked: boolean, out: Recommendation): void {
  const path = out.rows.length > 0;
  if (blocked) {
    const q = r.blockers.join(' ').match(/question (\d+)/i)?.[1];
    out.recommended = q ? `Answer question ${q} first` : 'Answer the question that blocks it first';
    return;
  }
  if (path) out.choices.push(['Run the path', 'change-orchestration-workflow makes the updates above, in order, with no more questions']);
  for (const o of out.offers) out.choices.push([o.choice, `${o.program} writes ${o.what} in the places above, and nothing is re-run`]);
  if (out.dramatic) out.choices.push(['Re-run the whole workflow', 'from requirements-workflow, step 1, discovery-author']);
  if (!path && !out.offers.length) out.choices.push(['Close it', 'nothing needs to change, so the change closes when you accept']);
  out.choices.push(['Correct the analysis', 'change-request-workflow redoes it from step 2, with your correction']);
  out.recommended = out.offers.length ? out.offers[0].choice : path ? 'Run the path' : 'Close it';
}

export function recommendation(project: string, change: string, opts: PathOptions = {}): Recommendation {
  const r = read(project, change, opts);
  const ctx = context(project, opts);
  const kinds = [...new Set(r.kinds.map((k) => k.kind))];
  const model = dataModelOf(project, opts);
  const blocked = kinds.includes('Blocked');
  const items: Items = new Map(ORDER.map((k) => [k, []]));
  if (!blocked) {
    giveJudged(items, r, ctx);
    giveWords(items, r, model);
    giveAsks(items, r, ctx, model);
  }
  const out: Recommendation = {
    report: r, ...pathRows(kinds, items), offers: [], notOffered: [], dramatic: null, choices: [], recommended: null, dataModel: Boolean(model),
  };
  // A small update, instead of the path.
  insertOffers(project, r, opts, out);
  copyOffers(project, r, opts, out);
  out.dramatic = dramaticOf(r, ctx);
  choose(r, blocked, out);
  return out;
}

export function lines(o: Recommendation): string[] {
  const out: string[] = [];
  const kinds = o.report.kinds.map((k) => k.kind);
  if (kinds.includes('Blocked')) {
    out.push(`Nothing is recommended until the question that blocks it is answered: see section 10.`, '', `**Recommended:** ${o.recommended}`);
    return out;
  }
  if (o.rows.length) {
    out.push('| Order | Workflow | Step | Items |', '|---|---|---|---|');
    o.rows.forEach((x, i) => out.push(`| ${i + 1} | ${x.workflow} | ${x.step} | ${x.items.map((it) => `• ${it.label}`).join('<br>')} |`));
  } else out.push(kinds.every((k) => k === 'Already covered') ? 'Nothing to run: the documents already say it.' : 'Nothing to run on the path.');
  const leftOut = (k: StepKey) => (DATA_MODEL.includes(k) && !o.dataModel ? 'the project has no data model yet' : LEFT_OUT[k]);
  const addedWhy = (k: StepKey) => (o.rows.find((x) => x.key === k)!.items.every((it) => it.waits)
    ? 'its data model rows wait on this change, though the path for the kind doesn\'t name it'
    : 'section 13 judges its items to change, though the path for the kind doesn\'t name it');
  if (o.left.length) out.push('', '**Left out of the path:**', ...o.left.map((k) => `- ${label(k)}: ${leftOut(k)}`));
  if (o.added.length) out.push('', '**Added to the path:**', ...o.added.map((k) => `- ${label(k)}: ${addedWhy(k)}`));
  for (const offer of o.offers) {
    out.push('', `**${offer.choice} instead:** ${offer.program} writes ${offer.what} in these places, and nothing else changes:`);
    for (const p of offer.places) out.push(`- ${p.rel}, ${p.where}: "${p.before}" becomes "${p.after}"`);
  }
  if (o.notOffered.length) out.push('', '**Not offered:**', ...o.notOffered.map((x) => `- ${x}`));
  if (o.dramatic) out.push('', `**This change reaches most of the business requirements:** ${o.dramatic.reached} of ${o.dramatic.of}. Consider a re-run of the whole workflow, from requirements-workflow, step 1.`);
  out.push('', '**Your choices at the gate:**', ...o.choices.map(([c, what]) => `- **${c}:** ${what}`));
  out.push('', `**Recommended:** ${o.recommended}`);
  return out;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const o = recommendation(project, change, { output: args.output });
  replaceSection(o.report.change.report, 'The recommendation', lines(o));
  process.stdout.write(`${programName(import.meta.filename)}: change ${o.report.change.number}, ${plural(o.rows.length, 'step')} in the recommendation; recommended: ${o.recommended}. Written to section 15.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
