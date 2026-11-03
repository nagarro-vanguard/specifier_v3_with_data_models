// status.ts — says where a project stands, and what to run next.
//
//   node tools/status.ts --project <p>
//
// It prints one line per step and piece, then the open changes, then every Must answer question still open in the
// Question log, then every entry still open in the data model's decisions file, then "Next:". The questions come from
// grade-questions.ts, which only reads here and changes nothing.
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
// come from its decisions file. Both files are read through lib/data-model.ts.
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
// A data model file being drafted is work in progress, as size-rules.ts reads it. Like the Feature catalog, it is
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

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, textOption, fail, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, projectDir, relOf, slug, matches, readText, type PathOptions, type Values } from './lib/run-paths.ts';
import { tableUnder, list, type Cell } from './lib/md-tables.ts';
import { grade } from './grade-questions.ts';
import { readThings, readFile, readDecisions, cell, fileOfWhere, stillOpen, type Decisions, type DecisionState, type StillOpen } from './lib/data-model.ts';

type State = 'not started' | 'drafted' | 'accepted' | 'parked' | 'ready';

interface DocState {
  state: State;
  detail?: string;
}

// The document of each step of a workflow, its name, and what "Next:" says while it isn't accepted.
type Step = readonly [document: string, name: string, next: string];

const REQUIREMENTS_STEPS: readonly Step[] = [
  ['discovery-brief', 'Discovery brief', 'requirements-workflow, step 1: discovery-author writes the Discovery brief'],
  ['brd', 'BRD', 'requirements-workflow, step 2: brd-author writes the BRD'],
  ['prd', 'PRD', 'requirements-workflow, step 3: prd-author writes the PRD'],
];
// The states of a Glossary change the Glossary has settled, and of one still to send to it.
const SETTLED_IN_GLOSSARY: readonly (DecisionState | null)[] = ['settled', 'brought in'];
const TO_SEND: readonly (DecisionState | null)[] = ['to raise', 'raised'];
const FEATURES_STEPS: readonly Step[] = [
  ['feature-catalog', 'Feature catalog', 'features-and-epics-workflow, step 1: feature-author writes the Feature catalog'],
  ['epic-grouping', 'EPIC grouping', 'features-and-epics-workflow, step 2: epic-grouping-author writes the EPIC grouping'],
  ['epic-register', 'EPIC register', 'features-and-epics-workflow, step 3: epic-author copies the EPIC register'],
];

// The lines printed so far, and the first thing still to run.
interface Run {
  project: string;
  opts: PathOptions;
  out: string[];
  next: string | null;
}

// An accepted data model file that still shows the "? (DM-n)" of decisions settled since.
interface WriteIn {
  file: string;
  ids: string[];
}

interface DataModelStatus {
  thingsFile: string;
  decisions: Decisions;
  writeIn: WriteIn[];
}

interface Catalog {
  // Each feature's FRD ID.
  capabilityOf: Map<string, string>;
  // Each FRD ID and its name, in the catalog's order.
  frdNames: Map<string, string>;
}

interface Epic {
  id: string;
  name: string;
  features: string[];
  dependsOn: string[];
}

interface FrdStatus {
  id: string;
  name: string;
  st: DocState;
  // The settled answers an accepted FRD still waits on.
  waits: string[];
}

interface EpicStatus extends Epic {
  st: DocState;
}

function at(run: Run, document: string, values: Values = {}): string {
  return pathOf(run.project, document, values, run.opts);
}

function want(run: Run, text: string): void {
  if (!run.next) run.next = text;
}

function stateOf(file: string): DocState {
  if (!fs.existsSync(file)) return { state: 'not started' };
  const m = readText(file).match(/^Status: (.*)$/m);
  if (!m) return { state: 'drafted' };
  const s = m[1].trim();
  if (/^accepted\b/i.test(s)) return { state: 'accepted', detail: s.replace(/^accepted /i, '') };
  if (/^parked\b/i.test(s)) return { state: 'parked', detail: s.replace(/^parked /i, '') };
  return { state: 'drafted' };
}

// The data model's decisions file, read through lib/data-model.ts: its decisions and its Glossary changes, each with
// its ID and its state. None when the file isn't there.
function decisionsIn(file: string): Decisions {
  if (!fs.existsSync(file)) return readDecisions('\n');
  return readDecisions(file);
}

// One line for an entry still open, and who asks it again.
function openLine(o: StillOpen): string {
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

// Each settled decision whose "? (DM-n)" a data model file still shows, read through lib/data-model.ts, so the cells
// and notes are read as check-data-model.ts reads them.
function settledGapsIn(file: string, decisions: Decisions): string[] {
  const ids = new Set<string>();
  for (const part of readFile(file).parts) {
    for (const t of part.tables) for (const row of t.rows) for (const v of Object.values(row)) cell(v).gaps.forEach((g) => ids.add(g));
    for (const n of part.notes) cell(n.text).gaps.forEach((g) => ids.add(g));
  }
  return [...ids].filter((id) => {
    const e = decisions.inForce.get(id);
    return e && e.kind === 'DM' && e.section === 'settled';
  });
}

// Each answer an accepted FRD still waits on, though the data model now has it: "waits on DM-n", or "? (DM-n)" in its
// copy of the data model, where DM-n is settled, or GC-n is brought into the data model.
function settledWaitsIn(file: string, decisions: Decisions): string[] {
  const ids = new Set([...readText(file).matchAll(/(?:\bwaits on |\?\s*\()((?:DM|GC)-\d+)\b/g)].map((m) => m[1]));
  return [...ids].filter((id) => {
    const e = decisions.inForce.get(id);
    if (!e) return false;
    return e.kind === 'DM' ? e.section === 'settled' : e.state === 'brought in';
  });
}

function show(st: DocState): string {
  return st.detail ? `${st.state} ${st.detail}` : st.state;
}

function latestCopy(project: string, rel: string, opts: PathOptions): string | null {
  const logPath = pathOf(project, 'version-log', {}, opts);
  if (!fs.existsSync(logPath)) return null;
  let best = 0;
  for (const line of readText(logPath).split(/\r?\n/)) {
    const c = line.split('|').slice(1, -1).map((s) => s.trim());
    if (c.length > 1 && /^\d+$/.test(c[0]) && c[1] === rel) best = Math.max(best, Number(c[0]));
  }
  if (!best) return null;
  const copy = pathOf(project, 'version-copy', { document: rel.replace(/\.md$/, ''), n: String(best) }, opts);
  return fs.existsSync(copy) ? readText(copy) : null;
}

function firstMatch(c: Cell | undefined, re: RegExp): string | null {
  const m = list(c).join(' ').match(re);
  return m ? m[0] : null;
}

function joinedText(c: Cell | undefined): string {
  return list(c).join(' ').trim();
}

// One line per step, and the first step not yet accepted is what to run next.
function stepsBlock(run: Run, steps: readonly Step[]): void {
  steps.forEach(([doc, name, nextText], i) => {
    const st = stateOf(at(run, doc));
    run.out.push(`- ${i + 1}. ${name}: ${show(st)}`);
    if (st.state !== 'accepted') want(run, nextText);
  });
}

// Workflow 1 and the Glossary.
function requirementsBlock(run: Run): void {
  run.out.push('requirements-workflow');
  stepsBlock(run, REQUIREMENTS_STEPS);
  const glossary = stateOf(at(run, 'gate-log'));
  run.out.push('', 'glossary-author');
  run.out.push(`- Glossary: ${show(glossary)}`);
  if (glossary.state !== 'accepted') want(run, 'glossary-author builds the Glossary');
}

// The data model: the things file, then one file per family, then the Glossary changes it found, sent to the
// Glossary together, then the ones the Glossary settled, brought into the data model.
function dataModelBlock(run: Run): DataModelStatus {
  run.out.push('', 'data-model-workflow');
  const thingsFile = at(run, 'data-model-things');
  const things = stateOf(thingsFile);
  run.out.push(`- 1. Things file: ${show(things)}`);
  if (things.state !== 'accepted') want(run, 'data-model-workflow, step 1: things-author finds the things');
  // Read through lib/data-model.ts, as check-data-model.ts reads it, so both find the same files in either form.
  const families = things.state === 'not started' ? [] : readThings(thingsFile).families.map((f) => f.name);
  if (!families.length) run.out.push('- 2. Data model files: none named yet');
  const familyFiles = families.map((file) => {
    const abs = at(run, 'data-model', { family: file.replace(/\.md$/, '') });
    const st = stateOf(abs);
    run.out.push(`- 2. ${file}: ${show(st)}`);
    return { file, abs, st };
  });
  const decisions = decisionsIn(at(run, 'data-model-decisions'));
  // A decision settled later, such as a product-wide one, whose "? (DM-n)" an accepted file still shows: data-model-author
  // writes its answer into that file, in a change. It comes before the families still to write, as data-model-workflow
  // takes it.
  const writeIn = familyFiles.filter((f) => f.st.state === 'accepted')
    .map((f) => ({ file: f.file, ids: settledGapsIn(f.abs, decisions) }))
    .filter((w) => w.ids.length);
  for (const w of writeIn) want(run, `data-model-workflow, picking up: data-model-author writes the settled answer of ${w.ids.join(', ')} into ${w.file}, in a change`);
  for (const f of familyFiles) if (f.st.state !== 'accepted') want(run, `data-model-workflow, step 2: data-model-author writes ${f.file}`);
  const changes = decisions.glossaryChanges;
  const settled = changes.filter((c) => SETTLED_IN_GLOSSARY.includes(c.state));
  const toSend = changes.filter((c) => TO_SEND.includes(c.state));
  const toBring = changes.filter((c) => c.state === 'settled');
  run.out.push(`- 3. Glossary changes: ${changes.length ? `${settled.length} of ${changes.length} settled in the Glossary` : 'none'}`);
  run.out.push(`- 4. Settled changes brought into the data model: ${settled.length ? `${settled.length - toBring.length} of ${settled.length}` : 'none'}`);
  if (toSend.length) want(run, `data-model-workflow, step 3: glossary-disposition settles every Glossary change in one run: ${toSend.map((c) => c.id).join(', ')}`);
  if (toBring.length) want(run, `data-model-workflow, step 4: things-author, then data-model-author, bring ${toBring.map((c) => c.id).join(', ')} into the data model`);
  return { thingsFile, decisions, writeIn };
}

// Workflow 2.
function featuresBlock(run: Run): void {
  run.out.push('', 'features-and-epics-workflow');
  stepsBlock(run, FEATURES_STEPS);
  const generated = fs.existsSync(at(run, 'epic-sequencing')) && fs.existsSync(at(run, 'epic-mapping'));
  run.out.push(`- 4. EPIC sequencing and mapping: ${generated ? 'written' : 'not started'}`);
  if (!generated) want(run, 'features-and-epics-workflow, step 4: build-sequencing-mapping.ts writes the EPIC sequencing and mapping');
}

// The accepted catalog gives the FRDs, and the feature each one holds.
function readCatalog(catalog: string | null): Catalog {
  const capabilityOf = new Map<string, string>();
  const frdNames = new Map<string, string>();
  if (!catalog) return { capabilityOf, frdNames };
  for (const r of tableUnder(catalog, 'Feature catalog') || []) {
    const f = firstMatch(r['Feature ID'], /\bF-\d+\b/);
    const cap = joinedText(r.Capability);
    const id = (cap.match(/\bFRD-\d+[a-z]\b/) || [])[0];
    if (!f || !id) continue;
    capabilityOf.set(f, id);
    if (!frdNames.has(id)) frdNames.set(id, cap.replace(id, '').trim());
  }
  return { capabilityOf, frdNames };
}

// The accepted register gives the EPICs, in its run order.
function readRegister(register: string | null): Epic[] {
  const epics: Epic[] = [];
  if (!register) return epics;
  for (const r of tableUnder(register, 'EPICs') || []) {
    const id = firstMatch(r.EPIC, /\bEPIC-\d{3}\b/);
    if (!id) continue;
    epics.push({
      id,
      name: joinedText(r.Name),
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
  return epics;
}

// Workflow 3: FRDs in EPIC register order, then any the register doesn't reach.
// Each FRD's file is named after its capability: frd/frd-{capability}.md.
function frdsBlock(run: Run, catalog: Catalog, hasCatalog: boolean, epics: Epic[], decisions: Decisions): FrdStatus[] {
  const order: string[] = [];
  for (const e of epics) for (const f of e.features) {
    const id = catalog.capabilityOf.get(f);
    if (id && !order.includes(id)) order.push(id);
  }
  for (const id of catalog.frdNames.keys()) if (!order.includes(id)) order.push(id);
  run.out.push('', 'frd-workflow, in EPIC register order');
  if (!hasCatalog) run.out.push('- Waits for an accepted Feature catalog');
  return order.map((id) => {
    const name = catalog.frdNames.get(id) ?? '';
    const file = at(run, 'frd', { capability: slug(name) });
    const st = stateOf(file);
    run.out.push(`- ${id} ${name}: ${show(st)}`);
    const waits = st.state === 'accepted' ? settledWaitsIn(file, decisions) : [];
    if (waits.length) run.out.push(`- ${id} ${name} waits on ${waits.join(', ')}, which ${waits.length > 1 ? 'are' : 'is'} settled now. frd-author runs again for it, writes the rule from the answer, and holds its gate again.`);
    return { id, name, st, waits };
  });
}

// Workflow 4: EPICs in run order.
function epicsBlock(run: Run, epics: Epic[], hasRegister: boolean): EpicStatus[] {
  run.out.push('', 'stories-workflow, in run order');
  if (!hasRegister) run.out.push('- Waits for an accepted EPIC register');
  return epics.map((e) => {
    // Each EPIC's folder is named by its ID and name: epics/{epic}/.
    const listPath = at(run, 'story-list', { epic: `${e.id}-${slug(e.name)}` });
    let st = stateOf(listPath);
    let note = '';
    if (st.state !== 'not started' && st.state !== 'parked') {
      const stories = tableUnder(listPath, 'Stories') || [];
      const ready = stories.filter((s) => joinedText(s.Status).toLowerCase() === 'ready').length;
      note = ` (${ready} of ${stories.length} stories ready)`;
      st = stories.length && ready === stories.length && st.state === 'accepted' ? { state: 'ready' } : { state: 'drafted' };
    }
    run.out.push(`- ${e.id} ${e.name}: ${show(st)}${note}`);
    return { ...e, st };
  });
}

function openChangesBlock(run: Run): void {
  run.out.push('', 'Open changes');
  const progress = matches(run.project, 'change-progress', run.opts);
  const open = progress.filter((p) => !/^Status: closed/im.test(readText(p.abs)));
  if (!open.length) run.out.push('- None');
  for (const p of open) run.out.push(`- ${p.values.change}: open`);
}

// Must answer questions follow you from step to step until they are answered.
function mustAnswerBlock(run: Run): void {
  run.out.push('', 'Must answer, still open');
  const questions = grade(run.project, { output: run.opts.output, checkOnly: true });
  const must = questions.open.filter((q) => q.group === 'Must answer');
  if (!must.length) run.out.push('- None');
  const plain = (c: Cell | undefined) => list(c).join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
  for (const q of must) run.out.push(`- question ${q.n}: ${q.title} Raised in ${plain(q.parts['Raised in'])}. Answer by: ${plain(q.parts['Answer by'])}. Next best action: ${plain(q.parts['Next best action'])}`);
}

// Every data model decision still open, and every Glossary change the Glossary hasn't settled. A decision answered
// "I don't know yet", or a change left open, is never forgotten: the skill named asks it again first.
// Returns the lines that go under "Next:".
function dataModelOpenBlock(run: Run, dataModel: DataModelStatus): string[] {
  const { decisions, writeIn } = dataModel;
  run.out.push('', 'Data model, still open');
  const open = stillOpen(decisions, path.basename(dataModel.thingsFile));
  if (!open.length && !writeIn.length) run.out.push('- None');
  for (const o of open) run.out.push(openLine(o));
  // A settled decision whose "? (DM-n)" an accepted file still shows: its cells are still open.
  for (const id of [...new Set(writeIn.flatMap((w) => w.ids))]) {
    const e = decisions.inForce.get(id);
    if (!e) continue;
    const where = fileOfWhere(e.fields.Where);
    const files = writeIn.filter((w) => w.ids.includes(id)).map((w) => w.file).join(', ');
    run.out.push(`- ${id}${where ? ` (${where})` : ''}: ${e.question} Settled, but ${files} still ${files.includes(',') ? 'show' : 'shows'} "? (${id})". data-model-author writes the answer in, in a change, at the next run of data-model-workflow.`);
  }
  return askAgainLines(open);
}

// Who asks again what is still open, and when: a decision answered "I don't know yet", and a Glossary change left
// open, are asked again first, at the next run of data-model-workflow. They hold up no step, so they go under "Next:".
function askAgainLines(open: StillOpen[]): string[] {
  const again = new Map<string, { asks: string; file: string | null; ids: (string | null)[] }>();
  for (const o of open) {
    const e = o.entry;
    if (!(e.kind === 'DM' ? e.proposed : e.state === 'left open')) continue;
    const file = o.asks === 'data-model-author' ? o.file : null;
    const key = `${o.asks} ${file || ''}`;
    let asker = again.get(key);
    if (!asker) again.set(key, (asker = { asks: o.asks, file, ids: [] }));
    asker.ids.push(e.id);
  }
  return [...again.values()].map((a) => `- Still open: ${a.asks} asks ${a.ids.join(', ')} again first, at the next run of data-model-workflow${a.file ? `, for ${a.file}` : ''}. It holds up no other step.`);
}

// Next, after workflows 1 and 2 and the data model: FRDs, then EPICs, then parked pieces. An accepted FRD that waits
// on an answer now settled takes its place in the FRDs' order.
function chooseNext(run: Run, frds: FrdStatus[], epics: EpicStatus[], capabilityOf: Map<string, string>): void {
  const frdNext = frds.find((f) => f.waits.length || !['accepted', 'parked'].includes(f.st.state));
  if (frdNext && frdNext.waits.length) want(run, `frd-author, for ${frdNext.id} ${frdNext.name}: it brings in the settled answer of ${frdNext.waits.join(', ')}, and holds its gate again`);
  else if (frdNext) want(run, `frd-workflow, for ${frdNext.id} ${frdNext.name}`);

  const frdById = new Map(frds.map((f) => [f.id, f]));
  const epicById = new Map(epics.map((e) => [e.id, e]));
  const waitsOn = (e: EpicStatus): string | null => {
    const ids = e.features.map((f) => capabilityOf.get(f)).filter((id): id is string => Boolean(id));
    const frd = ids.find((id) => frdById.get(id)?.st.state !== 'accepted');
    if (frd) return frd;
    return e.dependsOn.find((d) => epicById.get(d)?.st.state === 'parked') || null;
  };
  const epicNext = epics.find((e) => !['ready', 'parked'].includes(e.st.state) && !waitsOn(e));
  if (epicNext) want(run, `stories-workflow, for ${epicNext.id} ${epicNext.name}`);

  const parkedFrd = frds.find((f) => f.st.state === 'parked');
  if (parkedFrd) want(run, `frd-workflow, for ${parkedFrd.id} ${parkedFrd.name}, which was parked ${parkedFrd.st.detail}`);
  const parkedEpic = epics.find((e) => e.st.state === 'parked');
  if (parkedEpic) want(run, `stories-workflow, for ${parkedEpic.id} ${parkedEpic.name}, which was parked ${parkedEpic.st.detail}`);
  want(run, 'nothing to run. Every FRD is accepted and every EPIC is ready.');
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  // An empty name fails in projectDir the same way a missing one does.
  const project = textOption(args, 'project') ?? '';
  const dir = projectDir(project, args);
  if (!fs.existsSync(dir)) fail(`The project folder doesn't exist: ${dir}`, 2);
  const run: Run = { project, opts: args, out: [`Project: ${project}`, ''], next: null };

  requirementsBlock(run);
  const dataModel = dataModelBlock(run);
  featuresBlock(run);

  const catalogText = latestCopy(project, relOf('feature-catalog'), args);
  const registerText = latestCopy(project, relOf('epic-register'), args);
  const catalog = readCatalog(catalogText);
  const epics = readRegister(registerText);
  const frds = frdsBlock(run, catalog, Boolean(catalogText), epics, dataModel.decisions);
  const epicStates = epicsBlock(run, epics, Boolean(registerText));

  openChangesBlock(run);
  mustAnswerBlock(run);
  const askAgain = dataModelOpenBlock(run, dataModel);
  chooseNext(run, frds, epicStates, catalog.capabilityOf);

  run.out.push('', `Next: ${run.next}`, ...askAgain);
  process.stdout.write(run.out.join('\n') + '\n');
  return 0;
}

if (import.meta.main) runMain(main);
