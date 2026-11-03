#!/usr/bin/env node
'use strict';
// check-stories.cjs — checks an EPIC's Story list and Stories before each story gate, and prints the three blocks the
// gate needs.
//
//   node tools/check-stories.cjs --project <p> --epic EPIC-002
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
//     - no retired Glossary word is used, through lib/scan-retired-words.cjs
//   - once groomed, also:
//     - the grooming sections are there; Roles is optional
//     - every rule quoted is an FRD rule that exists, quoted word for word
//     - every rule's Step is the FRD flow step tagged with it, numbered or Alternate, and the rules are in flow order
//   - once ready, also:
//     - three to seven scenarios, each with Given, When and Then, each naming in its title at least one FRD rule it
//       proves
//     - every scenario is behaviour only: none of frd-author's "how" words
//     - the ready guard: while a Must answer question raised in these stories is open, the stories can't be ready
//   - no placeholder is left, lib/md-lint.cjs finds nothing, and grade-questions.cjs finds nothing wrong with the
//     gaps and questions of these files
//   - one capability per story, and one action per scenario's When, through lib/one-per-row.cjs: a story whose title
//     or "I want" may hold two, and a scenario whose When may hold two, are shown to look at, never a finding
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the Story list, the register, the catalog,
// the PRD, the Glossary or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const sw = require('./lib/scan-retired-words.cjs');
const op = require('./lib/one-per-row.cjs');

const CONVENTIONS = path.join(rp.KIT_ROOT, '.claude', 'skills', 'frd-author', 'references', 'conventions.md');
const GROOMING = ['Dependencies', 'Scope', 'Rules', 'Metrics traceability', 'Design links'];
const STATEMENT = /^As an? .+, I want .+, so that .+\.$/;
const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The body of a level-2 section, up to the next level-2 heading.
function body(t, heading) {
  const lines = t.split('\n');
  const at = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (at < 0) return null;
  const end = lines.findIndex((l, i) => i > at && /^## /.test(l));
  return lines.slice(at + 1, end < 0 ? lines.length : end).join('\n');
}
const pending = (b) => b !== null && /^Pending\b/m.test(b.replace(/^\*.*\*$/gm, '').trim());

// Each scenario's When, with each "And" line under it before its Then: [{ scenario, parts }].
function whens(criteria) {
  const out = [];
  let scenario = null;
  let when = null;
  for (const line of criteria.split(/\r?\n/)) {
    const h = line.match(/^\*\*(Scenario \d+) - /);
    if (h) { scenario = h[1]; when = null; continue; }
    const k = line.match(/^- \*\*(Given|When|Then|And)\*\* (.+)$/);
    if (!scenario || !k) continue;
    if (k[1] === 'When') { when = { scenario, parts: [k[2].trim()] }; out.push(when); }
    else if (k[1] === 'And' && when) when.parts.push(k[2].trim());
    else when = null;
  }
  return out;
}

// Every FRD's rules, and the flow step tagged with each: Map(rule ID -> text), Map(rule ID -> { frd, step, pos }), where
// step is the step's number, or Alternate, and pos is its place in the flow. The FRDs sit beside the Feature catalog.
function frds(project, opts) {
  const dir = path.dirname(rp.pathOf(project, 'feature-catalog', {}, opts));
  const rules = new Map();
  const stepOf = new Map();
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => /^frd-.+\.md$/.test(x)) : []) {
    const t = rp.readText(path.join(dir, f));
    const id = (t.match(/^# (FRD-\d+[a-z])\b/m) || [])[1];
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
const stepName = (s) => (s === 'Alternate' ? 'an alternate step' : `step ${s}`);

function check(project, epic, opts = {}) {
  const e = cd.epicOf(project, epic, opts);
  const list = cd.load(project, 'story-list', { epic: e.folder }, opts);
  const catalog = cd.load(project, 'feature-catalog', {}, opts);
  const prd = cd.load(project, 'prd', {}, opts);
  const dir = path.dirname(list.file);
  const graded = cd.questions(project, opts);
  const { rules, stepOf } = frds(project, opts);
  const how = (rp.readText(CONVENTIONS).match(/"how" word:\*\*([\s\S]*?)\. Rewrite/) || [, ''])[1].split(',').map((w) => w.trim()).filter(Boolean);
  const retired = sw.retiredWords(project, opts);
  const current = sw.currentTerms(project, opts);
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Story list: opening and sections', [...cd.opening(list.text), ...cd.sections(list.text, 'story-list')]);

  const reqIds = new Set(cd.requirementsOf(prd.text).map((r) => text(r.ID)));
  const featureIds = new Set((md.tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r).map((r) => text(r['Feature ID'])));
  const mine = items(e.row.Features);
  const rows = md.tableUnder(list.text, 'Stories') || [];
  const stories = [];
  const listFindings = [];
  for (const r of rows) {
    const link = text(r.Story).match(/^\[(.+?)\]\(([^)]+)\)$/);
    if (!link) { listFindings.push(`Row ${text(r['#'])}: the story should be a link to its file, such as [Approve a Claim](approve-a-claim.md).`); continue; }
    const [, title, file] = link;
    const words = title.split(/\s+/).length;
    if (words < 2 || words > 6) listFindings.push(`"${title}": a title is two to six words.`);
    if (!STATEMENT.test(text(r.Statement))) listFindings.push(`"${title}": its statement should read "As a ..., I want ..., so that ...".`);
    for (const q of items(r['Req ID'])) if (!reqIds.has(q)) listFindings.push(`"${title}": ${q} isn't in the PRD.`);
    const fid = text(r['Feature ID']);
    if (!featureIds.has(fid)) listFindings.push(`"${title}": ${fid} isn't in the Feature catalog.`);
    else if (!mine.includes(fid)) listFindings.push(`"${title}": ${fid} isn't one of ${e.id}'s features.`);
    if (!['drafted', 'groomed', 'ready'].includes(text(r.Status))) listFindings.push(`"${title}": its status should be drafted, groomed or ready.`);
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) { listFindings.push(`"${title}" has no file: ${file}.`); continue; }
    stories.push({ title, file, full, row: r, text: rp.readText(full) });
  }
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !['story-list.md', 'brief.md'].includes(x))) {
    if (!stories.some((s) => s.file === f)) listFindings.push(`${f} is a Story file the list doesn't name.`);
  }
  const coverage = md.tableUnder(list.text, 'Coverage') || [];
  for (const fid of mine) {
    const row = coverage.find((c) => text(c.Feature).startsWith(`${fid} `));
    const want = stories.filter((s) => text(s.row['Feature ID']) === fid).map((s) => s.title).sort();
    if (!row) listFindings.push(`Coverage has no row for ${fid}.`);
    else if (items(row['Story(ies)']).sort().join('|') !== want.join('|') && !(want.length === 0)) listFindings.push(`Coverage: ${fid} is told by ${want.join(', ') || 'no story'}, not ${items(row['Story(ies)']).join(', ') || 'none'}.`);
  }
  add('Story list: stories', listFindings);

  // Each story, at its stage.
  const storyFindings = [];
  const groomFindings = [];
  const acFindings = [];
  const notices = [];
  const scenarioRows = [];
  let withCriteria = 0;
  for (const s of stories) {
    const at = (msg) => `${s.title}: ${msg}`;
    const t = s.text;
    if (/^Status: /m.test(t)) storyFindings.push(at('a Story has no status line: its status is the Status row.'));
    storyFindings.push(...cd.openingNotes(t).map(at));
    if ((t.match(/^# Story — (.+)$/m) || [])[1] !== s.title) storyFindings.push(at(`its title isn't "${s.title}", as in the list.`));
    const rowsOfHead = t.split('\n').map((l) => l.match(/^\| (Status|Req ID|Feature ID|Work Item ID) \| (.+) \|$/)).filter(Boolean);
    const get = (k) => (rowsOfHead.find((m) => m[1] === k) || [])[2] || '';
    if (get('Status') !== text(s.row.Status)) storyFindings.push(at(`its Status row is "${get('Status')}"; the list says ${text(s.row.Status)}.`));
    if (items(get('Req ID')).join() !== items(s.row['Req ID']).join()) storyFindings.push(at('its Req ID isn\'t the list\'s.'));
    if (get('Feature ID') !== text(s.row['Feature ID'])) storyFindings.push(at('its Feature ID isn\'t the list\'s.'));
    const statement = (body(t, 'Description') || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^\*.*\*$/.test(l)).join(' ');
    if (statement !== text(s.row.Statement)) storyFindings.push(at('its statement isn\'t the list\'s, word for word.'));
    for (const h of sw.scan(t, retired, current, 'story')) storyFindings.push(at(`line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`));
    storyFindings.push(...cd.placeholders(t).map(at), ...cd.rendering(t).map(at));
    const writing = cd.simpleWriting(t, { project, output: opts.output });
    storyFindings.push(...writing.findings.map((f) => at(`simple writing: ${f}`)));
    notices.push(...writing.notices.map((n) => (n.startsWith('- ') ? n : `${s.title}: ${n}`)));

    const stage = text(s.row.Status);
    const criteria = body(t, 'Acceptance criteria');
    const hasCriteria = criteria !== null && !pending(criteria);
    if (stage !== 'drafted') {
      for (const g of GROOMING) {
        const b = body(t, g);
        if (b === null || pending(b)) groomFindings.push(at(`it is ${stage}, but it has no ${g} section.`));
      }
      let prev = null;
      for (const r of md.tableUnder(t, 'Rules') || []) {
        const id = text(r['FRD rule ID']);
        if (!rules.has(id)) { groomFindings.push(at(`${id} isn't a rule in any FRD.`)); continue; }
        if (text(r.Rule) !== rules.get(id)) groomFindings.push(at(`${id} isn't quoted word for word from its FRD.`));
        const flow = stepOf.get(id);
        if (!flow) { groomFindings.push(at(`${id} is on no step of its FRD's flow.`)); continue; }
        const step = /^alternate$/i.test(text(r.Step)) ? 'Alternate' : text(r.Step);
        if (step !== flow.step) groomFindings.push(at(`${id} is on ${stepName(flow.step)} of ${flow.frd}'s flow, so its Step is ${flow.step}, not ${step || 'empty'}.`));
        if (prev && prev.frd === flow.frd && flow.pos < prev.pos) groomFindings.push(at(`the rules aren't in the order of ${flow.frd}'s flow: ${id} comes before ${prev.id} there.`));
        prev = { ...flow, id };
      }
    }
    if (stage === 'ready' && !hasCriteria) acFindings.push(at('it is ready, but it has no acceptance criteria.'));
    if (hasCriteria) {
      withCriteria++;
      const scenarios = md.scenarios(criteria);
      if (scenarios.length < 3) acFindings.push(at(`it has ${cd.plural(scenarios.length, 'scenario')}; it needs three to seven.`));
      if (scenarios.length > 7) notices.push(`${s.title} has ${scenarios.length} scenarios: consider splitting it.`);
      for (const w of whens(criteria)) scenarioRows.push({ id: `${s.title}, ${w.scenario}`, text: w.parts.join(' and '), kind: 'step' });
      for (const sc of scenarios) {
        if (!sc.rules.length) acFindings.push(at(`${sc.id} names no rule it proves: end its title with the rule IDs in brackets, such as (F-04.4).`));
        for (const id of sc.rules) if (!rules.has(id)) acFindings.push(at(`${sc.id} names ${id}, which isn't a rule in any FRD.`));
        const block = criteria.slice(criteria.indexOf(`**${sc.id} - `)).split(/\n\*\*Scenario \d+ - /)[0];
        for (const k of ['Given', 'When', 'Then']) if (!new RegExp(`^- \\*\\*${k}\\*\\* `, 'm').test(block)) acFindings.push(at(`${sc.id} has no "${k}".`));
        for (const w of how) if (new RegExp(`\\b${esc(w)}s?\\b`, 'i').test(block.replace(/^\*\*.*\*\*$/m, ''))) acFindings.push(at(`${sc.id} uses "${w}": a scenario is behaviour only.`));
      }
    }
  }
  add('Stories', storyFindings);
  add('Grooming', groomFindings);
  add('Acceptance criteria', acFindings);

  // The ready guard: a Must answer question raised in these stories, still open.
  const files = [list, ...stories.map((s) => ({ rel: path.relative(rp.projectDir(project, opts), s.full).split(path.sep).join('/') }))];
  const names = new Set([path.basename(list.file), ...stories.map((s) => s.file)]);
  const raisedHere = (graded.open || []).filter((q) => q.group === 'Must answer' && [...names].some((nm) => String(q.parts && q.parts['Raised in'] || '').includes(`${e.folder}/${nm}`) || String(q.parts && q.parts['Raised in'] || '').includes(`](${nm})`)));
  const guard = [];
  if (raisedHere.length && withCriteria) guard.push(...raisedHere.map((q) => `question ${q.n}, "${q.title}", raised in these stories, is a Must answer question still open: the stories can't be marked ready until it is answered.`));
  add('The ready guard', guard);

  const listWriting = cd.simpleWriting(list.text, { project, output: opts.output });
  add('Story list: placeholders and display', [...cd.placeholders(list.text), ...cd.rendering(list.text)]);
  add('Story list: simple writing', listWriting.findings);
  notices.push(...listWriting.notices);
  // One capability per story: its title and its "I want". One action per scenario: its When. Each is to look at.
  const storyRows = [];
  for (const s of stories) {
    storyRows.push({ id: s.title, text: s.title, kind: 'name' });
    const want = text(s.row.Statement).match(/\bI want (.+?), so that /);
    if (want) storyRows.push({ id: s.title, text: want[1], kind: 'action' });
  }
  const twoInStory = op.check(storyRows).filter((f, i, all) => all.findIndex((x) => x.id === f.id) === i);
  notices.push(...op.notices(twoInStory, 'story'), ...op.notices(op.check(scenarioRows), 'scenario'));
  const qFindings = [];
  for (const f of files) qFindings.push(...cd.questionFindingsFor({ rel: f.rel }, graded));
  add('Question log', [...new Set(qFindings)]);

  const stage = (s) => text(s.row.Status);
  const holds = [
    `${e.id} ${e.name}: ${cd.plural(stories.length, 'story')}`.replace(/storys$/, 'stories'),
    `${stories.filter((s) => stage(s) === 'drafted').length} drafted, ${stories.filter((s) => stage(s) === 'groomed').length} groomed, ${stories.filter((s) => stage(s) === 'ready').length} ready`,
  ];
  return { doc: { ...list, text: [list.text, ...stories.map((s) => s.text)].join('\n') }, checks, holds, graded, notices };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const epic = args.values.epic;
  if (!args.project || args.project === true || !epic) rp.fail('Use: node tools/check-stories.cjs --project <p> --epic EPIC-002', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, epic, { output: args.output });
  const out = cd.report({ program: 'check-stories.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
