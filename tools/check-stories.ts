// check-stories.ts — checks an EPIC's Story list and Stories before each story gate, and prints the three blocks the
// gate needs.
//
//   node tools/check-stories.ts --project <p> --epic EPIC-002
//
// Each Story's stage is read from its Status row: drafted, groomed or ready. A drafted story has its Description;
// a groomed story adds the sections from Dependencies to Design links; a ready story adds its Acceptance criteria.
//
// What it checks:
//   - always:
//     - the Story list's opening and sections follow its template, with no Open questions section
//     - every row of the list has its Story, and every Story file is in the list
//     - every story has a title of two to six words and an "As a ..., I want ..., so that ..." statement, repeated
//       word for word in its Description, with the same requirement, feature and status
//     - every requirement ID is in the PRD and every feature ID in the Feature catalog, and the feature is this EPIC's
//     - the Coverage table names every feature of the EPIC, with the stories that tell it
//     - no retired Glossary word is used, through lib/scan-retired-words.ts
//   - once groomed, also:
//     - the grooming sections are there; Roles is optional
//     - every rule quoted is an FRD rule that exists, quoted word for word
//     - every rule's Step is the FRD flow step tagged with it, numbered or Alternate, and the rules are in flow order
//   - once ready, also:
//     - three to seven scenarios, each with Given, When and Then, each naming in its title at least one FRD rule it
//       proves
//     - every scenario is behaviour only: none of frd-author's "how" words
//     - the ready guard: while a Must answer question raised in these stories is open, the stories can't be ready
//   - no placeholder is left, lib/md-lint.ts finds nothing, and grade-questions.ts finds nothing wrong with the
//     gaps and questions of these files
//   - one capability per story, and one action per scenario's When, through lib/one-per-row.ts: a story whose title
//     or "I want" may hold two, and a scenario whose When may hold two, are shown to look at, never a finding
//
// Exports:
//   check(project, epic, opts)   every check on the Story list and its Stories, what they hold, and the gate's notices
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the Story list, the register, the catalog,
// the PRD, the Glossary or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, textOption, today, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { KIT_ROOT, pathOf, projectDir, readText, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellItems, scenarios, type Row } from './lib/md-tables.ts';
import {
  load, opening, openingNotes, sections, placeholders, rendering, simpleWriting, requirementsOf, questions,
  questionFindingsFor, report, epicOf, type Epic,
} from './lib/check-document.ts';
import { retiredWords, currentTerms, scan, type RetiredWord } from './lib/scan-retired-words.ts';
import { check as onePerRow, notices as onePerRowNotices, type RowToRead } from './lib/one-per-row.ts';
import { plural, escapeRegExp } from './lib/text.ts';
import { NOT_STORIES } from './coverage-check.ts';
import type { Check, CheckResult, LoadedDocument } from './lib/types.ts';
import type { Graded } from './grade-questions.ts';

const PROGRAM = programName(import.meta.filename);
const CONVENTIONS = path.join(KIT_ROOT, '.claude', 'skills', 'frd-author', 'references', 'conventions.md');
const GROOMING = ['Dependencies', 'Scope', 'Rules', 'Metrics traceability', 'Design links'] as const;
const STAGES = ['drafted', 'groomed', 'ready'] as const;
const STATEMENT = /^As an? .+, I want .+, so that .+\.$/;

interface Story {
  title: string;
  // The file's name in the EPIC's folder, as the list's link gives it.
  file: string;
  full: string;
  row: Row;
  text: string;
}

// Where an FRD's flow tags a rule: the FRD's ID, the step's number or Alternate, and its place in the flow.
interface FlowStep {
  frd: string;
  step: string;
  pos: number;
}

interface FrdRules {
  // Each rule's text, by its ID.
  rules: Map<string, string>;
  stepOf: Map<string, FlowStep>;
}

// What one story's checks found, by check, in the order the story's lines were read.
interface StoryFindings {
  story: string[];
  grooming: string[];
  criteria: string[];
  notices: string[];
  whens: RowToRead[];
  hasCriteria: boolean;
}

// What the checks on every story share.
interface StoryContext {
  project: string;
  opts: PathOptions;
  frdRules: FrdRules;
  how: string[];
  retired: RetiredWord[];
  current: string[];
}

// The body of a level-2 section, up to the next level-2 heading.
function body(t: string, heading: string): string | null {
  const lines = t.split('\n');
  const at = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (at < 0) return null;
  const end = lines.findIndex((l, i) => i > at && /^## /.test(l));
  return lines.slice(at + 1, end < 0 ? lines.length : end).join('\n');
}

const pending = (b: string | null): boolean => b !== null && /^Pending\b/m.test(b.replace(/^\*.*\*$/gm, '').trim());

// Each scenario's When, with each "And" line under it before its Then.
function whens(criteria: string): { scenario: string; parts: string[] }[] {
  const out: { scenario: string; parts: string[] }[] = [];
  let scenario: string | null = null;
  let when: { scenario: string; parts: string[] } | null = null;
  for (const line of criteria.split(/\r?\n/)) {
    const h = line.match(/^\*\*(Scenario \d+) - /);
    if (h) {
      scenario = h[1];
      when = null;
      continue;
    }
    const k = line.match(/^- \*\*(Given|When|Then|And)\*\* (.+)$/);
    if (!scenario || !k) continue;
    if (k[1] === 'When') {
      when = { scenario, parts: [k[2].trim()] };
      out.push(when);
    } else if (k[1] === 'And' && when) when.parts.push(k[2].trim());
    else when = null;
  }
  return out;
}

// Every FRD's rules, and the flow step tagged with each. The FRDs sit beside the Feature catalog.
function frds(project: string, opts: PathOptions): FrdRules {
  const dir = path.dirname(pathOf(project, 'feature-catalog', {}, opts));
  const rules = new Map<string, string>();
  const stepOf = new Map<string, FlowStep>();
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => /^frd-.+\.md$/.test(x)) : []) {
    const t = readText(path.join(dir, f));
    const id = t.match(/^# (FRD-\d+[a-z])\b/m)?.[1];
    for (const m of t.matchAll(/^\| (F-\d+\.\d+) \| (.+?) \| .+ \|$/gm)) rules.set(m[1], m[2].trim());
    if (!id) continue;
    let pos = 0;
    for (const line of (body(t, 'Flow') || '').split('\n')) {
      const m = line.match(/^(?:(\d+)\.|- \*Alternate:\*) .+\*\((F-\d+\.\d+)\)\*\s*$/);
      if (m && !stepOf.has(m[2])) stepOf.set(m[2], { frd: id, step: m[1] || 'Alternate', pos: pos++ });
    }
  }
  return { rules, stepOf };
}

const stepName = (s: string): string => (s === 'Alternate' ? 'an alternate step' : `step ${s}`);

// The "how" words a scenario may not use, from frd-author's conventions.
function howWords(): string[] {
  return (readText(CONVENTIONS).match(/"how" word:\*\*([\s\S]*?)\. Rewrite/)?.[1] ?? '').split(',').map((w) => w.trim()).filter(Boolean);
}

// Each row of the Story list, read and checked, with the Stories its rows link to.
function readStories(listRows: Row[], epic: Epic, dir: string, reqIds: Set<string>, featureIds: Set<string>): { stories: Story[]; findings: string[] } {
  const mine = cellItems(epic.row.Features);
  const stories: Story[] = [];
  const findings: string[] = [];
  for (const r of listRows) {
    const link = cellText(r.Story).match(/^\[(.+?)\]\(([^)]+)\)$/);
    if (!link) {
      findings.push(`Row ${cellText(r['#'])}: the story should be a link to its file, such as [Approve a Claim](approve-a-claim.md).`);
      continue;
    }
    const [, title, file] = link;
    const words = title.split(/\s+/).length;
    if (words < 2 || words > 6) findings.push(`"${title}": a title is two to six words.`);
    if (!STATEMENT.test(cellText(r.Statement))) findings.push(`"${title}": its statement should read "As a ..., I want ..., so that ...".`);
    for (const q of cellItems(r['Req ID'])) if (!reqIds.has(q)) findings.push(`"${title}": ${q} isn't in the PRD.`);
    const fid = cellText(r['Feature ID']);
    if (!featureIds.has(fid)) findings.push(`"${title}": ${fid} isn't in the Feature catalog.`);
    else if (!mine.includes(fid)) findings.push(`"${title}": ${fid} isn't one of ${epic.id}'s features.`);
    if (!(STAGES as readonly string[]).includes(cellText(r.Status))) findings.push(`"${title}": its status should be drafted, groomed or ready.`);
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) {
      findings.push(`"${title}" has no file: ${file}.`);
      continue;
    }
    stories.push({ title, file, full, row: r, text: readText(full) });
  }
  return { stories, findings };
}

// The Coverage table names every feature of the EPIC, with the stories that tell it.
function coverageFindings(listText: string, epic: Epic, stories: Story[]): string[] {
  const findings: string[] = [];
  const coverage = tableUnder(listText, 'Coverage') || [];
  for (const fid of cellItems(epic.row.Features)) {
    const row = coverage.find((c) => cellText(c.Feature).startsWith(`${fid} `));
    const want = stories.filter((s) => cellText(s.row['Feature ID']) === fid).map((s) => s.title).sort();
    if (!row) findings.push(`Coverage has no row for ${fid}.`);
    else if (cellItems(row['Story(ies)']).sort().join('|') !== want.join('|') && !(want.length === 0)) findings.push(`Coverage: ${fid} is told by ${want.join(', ') || 'no story'}, not ${cellItems(row['Story(ies)']).join(', ') || 'none'}.`);
  }
  return findings;
}

function storyListCheck(list: LoadedDocument, epic: Epic, reqIds: Set<string>, featureIds: Set<string>): { check: Check; stories: Story[] } {
  const dir = path.dirname(list.file);
  const { stories, findings } = readStories(tableUnder(list.text, 'Stories') || [], epic, dir, reqIds, featureIds);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !(NOT_STORIES as readonly string[]).includes(x))) {
    if (!stories.some((s) => s.file === f)) findings.push(`${f} is a Story file the list doesn't name.`);
  }
  findings.push(...coverageFindings(list.text, epic, stories));
  return { check: { name: 'Story list: stories', findings }, stories };
}

// What every story has, at any stage: its title, its rows, its statement, its words and its display.
function storyBasics(s: Story, ctx: StoryContext): { findings: string[]; notices: string[] } {
  const at = (msg: string) => `${s.title}: ${msg}`;
  const t = s.text;
  const findings: string[] = [];
  if (/^Status: /m.test(t)) findings.push(at('a Story has no status line: its status is the Status row.'));
  findings.push(...openingNotes(t).map(at));
  if (t.match(/^# Story — (.+)$/m)?.[1] !== s.title) findings.push(at(`its title isn't "${s.title}", as in the list.`));
  const rowsOfHead = t.split('\n').map((l) => l.match(/^\| (Status|Req ID|Feature ID|Work Item ID) \| (.+) \|$/)).filter((m) => m !== null);
  const get = (k: string) => rowsOfHead.find((m) => m[1] === k)?.[2] || '';
  if (get('Status') !== cellText(s.row.Status)) findings.push(at(`its Status row is "${get('Status')}"; the list says ${cellText(s.row.Status)}.`));
  if (cellItems(get('Req ID')).join() !== cellItems(s.row['Req ID']).join()) findings.push(at('its Req ID isn\'t the list\'s.'));
  if (get('Feature ID') !== cellText(s.row['Feature ID'])) findings.push(at('its Feature ID isn\'t the list\'s.'));
  const statement = (body(t, 'Description') || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^\*.*\*$/.test(l)).join(' ');
  if (statement !== cellText(s.row.Statement)) findings.push(at('its statement isn\'t the list\'s, word for word.'));
  for (const h of scan(t, ctx.retired, ctx.current, 'story')) findings.push(at(`line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`));
  findings.push(...placeholders(t).map(at), ...rendering(t).map(at));
  const writing = simpleWriting(t, { project: ctx.project, output: ctx.opts.output });
  findings.push(...writing.findings.map((f) => at(`simple writing: ${f}`)));
  const notices = writing.notices.map((n) => (n.startsWith('- ') ? n : `${s.title}: ${n}`));
  return { findings, notices };
}

// Once groomed: the grooming sections, and each rule quoted word for word, on its flow step, in flow order.
function groomingFindings(s: Story, stage: string, { rules, stepOf }: FrdRules): string[] {
  const at = (msg: string) => `${s.title}: ${msg}`;
  const findings: string[] = [];
  for (const g of GROOMING) {
    const b = body(s.text, g);
    if (b === null || pending(b)) findings.push(at(`it is ${stage}, but it has no ${g} section.`));
  }
  let prev: (FlowStep & { id: string }) | null = null;
  for (const r of tableUnder(s.text, 'Rules') || []) {
    const id = cellText(r['FRD rule ID']);
    if (!rules.has(id)) {
      findings.push(at(`${id} isn't a rule in any FRD.`));
      continue;
    }
    if (cellText(r.Rule) !== rules.get(id)) findings.push(at(`${id} isn't quoted word for word from its FRD.`));
    const flow = stepOf.get(id);
    if (!flow) {
      findings.push(at(`${id} is on no step of its FRD's flow.`));
      continue;
    }
    const step = /^alternate$/i.test(cellText(r.Step)) ? 'Alternate' : cellText(r.Step);
    if (step !== flow.step) findings.push(at(`${id} is on ${stepName(flow.step)} of ${flow.frd}'s flow, so its Step is ${flow.step}, not ${step || 'empty'}.`));
    if (prev && prev.frd === flow.frd && flow.pos < prev.pos) findings.push(at(`the rules aren't in the order of ${flow.frd}'s flow: ${id} comes before ${prev.id} there.`));
    prev = { ...flow, id };
  }
  return findings;
}

// The acceptance criteria: three to seven scenarios, each with Given, When and Then, each naming the rules it proves,
// and none using a "how" word.
function criteriaFindings(s: Story, criteria: string, ctx: StoryContext): { findings: string[]; notices: string[]; whens: RowToRead[] } {
  const at = (msg: string) => `${s.title}: ${msg}`;
  const findings: string[] = [];
  const notices: string[] = [];
  const found = scenarios(criteria);
  if (found.length < 3) findings.push(at(`it has ${plural(found.length, 'scenario')}; it needs three to seven.`));
  if (found.length > 7) notices.push(`${s.title} has ${found.length} scenarios: consider splitting it.`);
  const whenRows: RowToRead[] = whens(criteria).map((w) => ({ id: `${s.title}, ${w.scenario}`, text: w.parts.join(' and '), kind: 'step' }));
  for (const sc of found) {
    if (!sc.rules.length) findings.push(at(`${sc.id} names no rule it proves: end its title with the rule IDs in brackets, such as (F-04.4).`));
    for (const id of sc.rules) if (!ctx.frdRules.rules.has(id)) findings.push(at(`${sc.id} names ${id}, which isn't a rule in any FRD.`));
    const block = criteria.slice(criteria.indexOf(`**${sc.id} - `)).split(/\n\*\*Scenario \d+ - /)[0];
    for (const k of ['Given', 'When', 'Then']) if (!new RegExp(`^- \\*\\*${k}\\*\\* `, 'm').test(block)) findings.push(at(`${sc.id} has no "${k}".`));
    for (const w of ctx.how) if (new RegExp(`\\b${escapeRegExp(w)}s?\\b`, 'i').test(block.replace(/^\*\*.*\*\*$/m, ''))) findings.push(at(`${sc.id} uses "${w}": a scenario is behaviour only.`));
  }
  return { findings, notices, whens: whenRows };
}

// Each story, at its stage.
function checkStory(s: Story, ctx: StoryContext): StoryFindings {
  const basics = storyBasics(s, ctx);
  const stage = cellText(s.row.Status);
  const criteria = body(s.text, 'Acceptance criteria');
  const hasCriteria = criteria !== null && !pending(criteria);
  const result: StoryFindings = { story: basics.findings, grooming: [], criteria: [], notices: basics.notices, whens: [], hasCriteria };
  if (stage !== 'drafted') result.grooming.push(...groomingFindings(s, stage, ctx.frdRules));
  if (stage === 'ready' && !hasCriteria) result.criteria.push(`${s.title}: it is ready, but it has no acceptance criteria.`);
  if (criteria !== null && hasCriteria) {
    const found = criteriaFindings(s, criteria, ctx);
    result.criteria.push(...found.findings);
    result.notices.push(...found.notices);
    result.whens.push(...found.whens);
  }
  return result;
}

// The ready guard: a Must answer question raised in these stories, still open.
function readyGuard(listFile: string, stories: Story[], epic: Epic, graded: Graded, withCriteria: number): Check {
  const names = new Set([path.basename(listFile), ...stories.map((s) => s.file)]);
  const raisedIn = (q: Graded['open'][number]) => String(q.parts['Raised in'] || '');
  const raisedHere = graded.open.filter((q) => q.group === 'Must answer' && [...names].some((nm) => raisedIn(q).includes(`${epic.folder}/${nm}`) || raisedIn(q).includes(`](${nm})`)));
  const findings: string[] = [];
  if (raisedHere.length && withCriteria) findings.push(...raisedHere.map((q) => `question ${q.n}, "${q.title}", raised in these stories, is a Must answer question still open: the stories can't be marked ready until it is answered.`));
  return { name: 'The ready guard', findings };
}

// One capability per story: its title and its "I want". One action per scenario: its When. Each is to look at.
function twoInOneNotices(stories: Story[], scenarioRows: RowToRead[]): string[] {
  const storyRows: RowToRead[] = [];
  for (const s of stories) {
    storyRows.push({ id: s.title, text: s.title, kind: 'name' });
    const want = cellText(s.row.Statement).match(/\bI want (.+?), so that /);
    if (want) storyRows.push({ id: s.title, text: want[1], kind: 'action' });
  }
  const twoInStory = onePerRow(storyRows).filter((f, i, all) => all.findIndex((x) => x.id === f.id) === i);
  return [...onePerRowNotices(twoInStory, 'story'), ...onePerRowNotices(onePerRow(scenarioRows), 'scenario')];
}

export function check(project: string, epicName: string, opts: PathOptions = {}): CheckResult {
  const epic = epicOf(project, epicName, opts);
  const list = load(project, 'story-list', { epic: epic.folder }, opts);
  const catalog = load(project, 'feature-catalog', {}, opts);
  const prd = load(project, 'prd', {}, opts);
  const graded = questions(project, opts);
  const ctx: StoryContext = { project, opts, frdRules: frds(project, opts), how: howWords(), retired: retiredWords(project, opts), current: currentTerms(project, opts) };
  const checks: Check[] = [{ name: 'Story list: opening and sections', findings: [...opening(list.text), ...sections(list.text, 'story-list')] }];

  const reqIds = new Set(requirementsOf(prd.text).map((r) => cellText(r.ID)));
  const featureIds = new Set((tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r).map((r) => cellText(r['Feature ID'])));
  const { check: listCheck, stories } = storyListCheck(list, epic, reqIds, featureIds);
  checks.push(listCheck);

  const perStory = stories.map((s) => checkStory(s, ctx));
  const notices = perStory.flatMap((r) => r.notices);
  checks.push(
    { name: 'Stories', findings: perStory.flatMap((r) => r.story) },
    { name: 'Grooming', findings: perStory.flatMap((r) => r.grooming) },
    { name: 'Acceptance criteria', findings: perStory.flatMap((r) => r.criteria) },
    readyGuard(list.file, stories, epic, graded, perStory.filter((r) => r.hasCriteria).length),
  );

  const listWriting = simpleWriting(list.text, { project, output: opts.output });
  checks.push(
    { name: 'Story list: placeholders and display', findings: [...placeholders(list.text), ...rendering(list.text)] },
    { name: 'Story list: simple writing', findings: listWriting.findings },
  );
  notices.push(...listWriting.notices, ...twoInOneNotices(stories, perStory.flatMap((r) => r.whens)));
  const files = [list, ...stories.map((s) => ({ rel: path.relative(projectDir(project, opts), s.full).split(path.sep).join('/') }))];
  const questionFindings = files.flatMap((f) => questionFindingsFor({ rel: f.rel }, graded));
  checks.push({ name: 'Question log', findings: [...new Set(questionFindings)] });

  const stageOf = (s: Story) => cellText(s.row.Status);
  const holds = [
    `${epic.id} ${epic.name}: ${plural(stories.length, 'story')}`.replace(/storys$/, 'stories'),
    `${stories.filter((s) => stageOf(s) === 'drafted').length} drafted, ${stories.filter((s) => stageOf(s) === 'groomed').length} groomed, ${stories.filter((s) => stageOf(s) === 'ready').length} ready`,
  ];
  return { doc: { ...list, text: [list.text, ...stories.map((s) => s.text)].join('\n') }, checks, holds, graded, notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const use = 'Use: node tools/check-stories.ts --project <p> --epic EPIC-002';
  const project = requireOption(args, 'project', use);
  const epic = args.values.epic;
  if (!epic) fail(use, 2);
  const date = textOption(args, 'date') ?? today();
  const out = report({ program: PROGRAM, date, ...check(project, String(epic), { output: args.output }) });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
