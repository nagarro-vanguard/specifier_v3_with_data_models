#!/usr/bin/env node
'use strict';
// Tests for a requirement update: from the change's report to the change closing.
//
//   node tools/tests/requirement-update.test.cjs
//
// Every test works on a copy in a temporary folder. Nothing in fixtures/ or Output/ is changed.
// The project is the Expense claims examples and fixtures, with the BRD, the PRD, the Feature catalog, the EPIC
// grouping, the EPIC register and the Claim approval FRD accepted, and EPIC-002's stories still being written. The
// examples' "Example" notes are taken out, as a real project has none.

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const KIT = path.resolve(__dirname, '..', '..');
const TOOLS = path.join(KIT, 'tools');
const EXAMPLES = path.join(KIT, '.claude', 'skills', '_shared', 'examples');
const FIXTURE = path.join(KIT, 'fixtures', 'expense-claims');
const SKILLS = path.join(KIT, '.claude', 'skills');
const md = require('../lib/md-tables.cjs');
const cd = require('../lib/check-document.cjs');
const { lint } = require('../lib/md-lint.cjs');
const mc = require('./helpers/method-copy.cjs');

// A file's text, with every line ending as "\n". The kit's files may end their lines with "\r\n", as Windows saves
// them, or with "\n", and every check here works the same on both.
function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: e });
  }
}

function run(program, args) {
  const r = spawnSync(process.execPath, [path.join(TOOLS, program), ...args], { encoding: 'utf8', cwd: os.tmpdir() });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.isDirectory()) copyDir(path.join(from, e.name), path.join(to, e.name));
    else fs.copyFileSync(path.join(from, e.name), path.join(to, e.name));
  }
}

const DATE = '2026-10-22';
const args = (out, extra = []) => ['--project', 'expense-claims', '--output', out, '--date', DATE, ...extra];

// The accepted project, built once, and copied for each test.
let BASE = null;
function base() {
  if (BASE) return BASE;
  BASE = fs.mkdtempSync(path.join(os.tmpdir(), 'specifier-update-base-'));
  const dir = path.join(BASE, 'expense-claims');
  fs.mkdirSync(dir, { recursive: true });
  for (const d of ['discovery-brief', 'brd', 'prd', 'question-log']) {
    const t = readText(path.join(EXAMPLES, `${d}.md`)).replace(/^> \*\*Example\.\*\*[\s\S]*?\n\n/, '');
    fs.writeFileSync(path.join(dir, `expense-claims-${d}.md`), t);
  }
  copyDir(FIXTURE, dir);
  for (const d of [['brd'], ['prd'], ['data-model-things'], ['data-model', '--family', 'claims'], ['feature-catalog'], ['epic-grouping'], ['epic-register'], ['frd', '--capability', 'claim-approval']]) {
    const r = run('accept.cjs', args(BASE, ['--document', ...d]));
    if (r.code !== 0) throw new Error(`${d[0]}: ${r.out}${r.err}`);
  }
  return BASE;
}

function project() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'specifier-update-'));
  copyDir(base(), out);
  const dir = path.join(out, 'expense-claims');
  const file = (rel) => path.join(dir, rel);
  const read = (rel) => readText(file(rel));
  const write = (rel, t) => { fs.mkdirSync(path.dirname(file(rel)), { recursive: true }); fs.writeFileSync(file(rel), t); };
  const change = (rel, from, to) => {
    const t = read(rel);
    const at = t.split(from).length - 1;
    assert.strictEqual(at, 1, `"${from}" is in ${rel} ${at} times, not once`);
    write(rel, t.replace(from, to));
  };
  const section = (rel, heading, lines) => cd.replaceSection(file(rel), heading, lines);
  const accept = (...d) => run('accept.cjs', args(out, ['--document', ...d]));
  return { out, dir, file, read, write, change, section, accept, args: (extra) => args(out, extra) };
}

// The lines a section holds, below its lines in italics.
function held(text, heading) {
  const all = text.split('\n');
  const start = all.findIndex((l) => /^## /.test(l) && md.normalize(l.slice(3)) === md.normalize(heading));
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  const out = all.slice(start + 1, end);
  while (out.length && (!out[0].trim() || /^\*[^*].*\*$/.test(out[0].trim()))) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

const C1 = 'changes/001-finance-limit/impact-report.md';
const LIST = 'epics/EPIC-002-claim-approval/story-list.md';

// A new change's report, made from change 001's by replacing what this change says. Sections 12 to 16 start empty.
function makeReport(p, folder, s) {
  const rel = `changes/${folder}/impact-report.md`;
  let t = p.read(C1)
    .replace('# Change 001 — Finance limit', `# Change ${folder.slice(0, 3)} — ${s.title}`)
    .replace('| 1 | change request | The finance team has confirmed the policy\'s limit: from now on they approve only claims over 1,000, not claims over 500. |', `| 1 | change request | ${s.statement} |`)
    .replace('| 1 | A claim goes to a finance approver only when it is over 1,000, instead of over 500. |', `| 1 | ${s.restated} |`)
    .replace('| 1 | • BR-03<br>• REQ-3.2 | • F-05 | • FRD-3a | • EPIC-002 | • Claim, Approve over the limit |', `| 1 | ${s.lands} | None |`)
    .replace(/^\| 1 \| Update or optimize \| .* \|$/m, `| 1 | ${s.kind} | ${s.test} |`)
    .replace('- None: the change only changes a value, the limit, in rules that exist', (s.newItems || ['- None: nothing is added']).join('\n'));
  p.write(rel, t);
  p.section(rel, 'What blocks', s.blockers || ['None']);
  p.section(rel, "The challenge's findings", ['None: nothing survived the challenge.', '', '**Verdict:** PASS']);
  if (s.renames) {
    t = p.read(rel).replace(/(### Agreed words this change renames\n\n)None/, `$1| Agreed word | Becomes |\n|---|---|\n${s.renames.map((r) => `| ${r[0]} | ${r[1]} |`).join('\n')}`);
    p.write(rel, t);
  }
  for (const h of ['Linked items', "Each linked item's judgement", 'The tentative size', 'The recommendation']) p.section(rel, h, ['None yet.']);
  return rel;
}

// Writes section 13: every linked item judged, Update unless named otherwise.
function judgeAll(p, rel, overrides = {}) {
  const rows = (md.tableUnder(p.read(rel), 'Linked items') || []).map((r) => md.list(r.Item).join(' ').trim());
  p.section(rel, "Each linked item's judgement", ['| Item | Judgement | Why |', '|---|---|---|', ...rows.map((id) => {
    const [j, why] = overrides[id] || ['Update', 'it names what the change changes'];
    return `| ${id} | ${j} | ${why} |`;
  })]);
}

function analyse(p, change, rel, overrides) {
  for (const prog of ['find-linked.cjs']) assert.strictEqual(run(prog, p.args(['--change', change])).code, 0);
  judgeAll(p, rel, overrides);
  for (const prog of ['size-rules.cjs', 'recommend.cjs']) {
    const r = run(prog, p.args(['--change', change]));
    assert.strictEqual(r.code, 0, `${prog}: ${r.out}${r.err}`);
  }
}

function decision(n, question, choice, extra = []) {
  return [
    `### Decision ${n} — ${question}`,
    `- **Question:** ${extra.question || 'None'}`,
    '- **Asked at:** Make these updates?',
    '- **Options offered:**',
    `  - **${choice}** — Why: it is what the recommendation names. What happens next: it runs.`,
    '  - **Correct the analysis** — Why: something in the report is wrong. What happens next: change-request-workflow redoes it from step 2.',
    '  - **I don\'t know yet** — What happens next: nothing runs.',
    `- **Recommended:** ${choice}`,
    `- **Chosen:** ${choice}`,
    `- **Decided by:** PO, ${DATE}`,
  ];
}
const ACCEPT_Q = 'Make these updates?';

// ---------------------------------------------------------------- find-linked

test('find-linked: change 001 reaches every rule of F-05, F-05.4 through its feature, and the drafted stories, grouped by document', () => {
  const p = project();
  const want = held(p.read(C1), 'Linked items');
  p.section(C1, 'Linked items', ['None yet.']);
  const r = run('find-linked.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /change 001, 16 linked items, written to section 12\./);
  const got = held(p.read(C1), 'Linked items');
  assert.deepStrictEqual(got, want);
  assert.ok(got.includes('| F-05.4 | rule | has-rule, from F-05 |'));
  assert.ok(got.includes('| Approve a Claim over 500, Scenario 2 | scenario | names-rule, from F-05.4 |'));
  assert.ok(got.indexOf('| F-05.dw1 | piece | has-piece, from F-05 |') < got.indexOf('| FRD-3a | FRD | where the change lands |'), 'grouped by document: the catalog\'s pieces before the FRD');
});

test('find-linked: an ID in section 6 that no document holds is a finding, and nothing is written', () => {
  const p = project();
  p.change(C1, '| 1 | • BR-03<br>• REQ-3.2 | • F-05 |', '| 1 | • BR-03<br>• REQ-3.9 | • F-05 |');
  const before = p.read(C1);
  const r = run('find-linked.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /REQ-3\.9, in section 6, isn't in the Traceability map or in any drafted document\./);
  assert.strictEqual(p.read(C1), before);
});

test('find-linked: with no Traceability map, or no such change, it exits with code 2', () => {
  const p = project();
  assert.strictEqual(run('find-linked.cjs', p.args(['--change', '009'])).code, 2);
  fs.rmSync(p.file('traceability-map.json'));
  assert.strictEqual(run('find-linked.cjs', p.args(['--change', '001'])).code, 2);
});

// ---------------------------------------------------------------- size-rules

test('size-rules: change 001 is small against EPIC-002\'s stories, in progress', () => {
  const p = project();
  const want = held(p.read(C1), 'The tentative size');
  p.section(C1, 'The tentative size', ['None yet.']);
  const r = run('size-rules.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /change 001 is small/);
  assert.deepStrictEqual(held(p.read(C1), 'The tentative size'), want);
  assert.ok(want.includes("- **Against:** EPIC-002 Claim approval's stories"));
});

test('size-rules: once every story is ready and the list accepted, nothing is in progress, and the change is not sized', () => {
  const p = project();
  assert.strictEqual(p.accept('story-list', '--epic', 'EPIC-002-claim-approval').code, 0);
  run('size-rules.cjs', p.args(['--change', '001']));
  assert.deepStrictEqual(held(p.read(C1), 'The tentative size'), [
    '- **Size:** Not sized',
    '- **The rule that decided it:** nothing is in progress, so there is nothing to size against',
    '- **Against:** Nothing in progress',
  ]);
});

test('size-rules: moving F-05 out of EPIC-002, in progress, is large, and so is regrouping two EPICs', () => {
  const p = project();
  p.change(C1, '| F-05 | Update | its description reads "each claim over 500" |', '| F-05 | Update | moves to EPIC-001, with the claims it checks |');
  run('size-rules.cjs', p.args(['--change', '001']));
  const s = held(p.read(C1), 'The tentative size');
  assert.strictEqual(s[0], '- **Size:** Large');
  assert.ok(s.includes('  - F-05 moves out of EPIC-002, which is in progress'), s.join('\n'));
  assert.ok(s.includes('  - the features that move regroup 2 pieces, EPIC-002 and EPIC-001'), s.join('\n'));
});

test('size-rules: two of EPIC-002\'s stories judged New story make the change large', () => {
  const p = project();
  p.change(C1, '| 1 | • BR-03<br>• REQ-3.2 | • F-05 |', '| 1 | • BR-03<br>• REQ-3.2 | • F-04<br>• F-05 |');
  run('find-linked.cjs', p.args(['--change', '001']));
  judgeAll(p, C1, { 'Approve a Claim': ['New story', 'a second check is a new capability'], 'Reject a Claim': ['Split', 'it now holds two rejections'] });
  run('size-rules.cjs', p.args(['--change', '001']));
  const s = held(p.read(C1), 'The tentative size');
  assert.deepStrictEqual(s.slice(0, 2), ['- **Size:** Large', "- **The rule that decided it:** 2 of EPIC-002's stories are judged New story or Split"]);
});

// ---------------------------------------------------------------- recommend

test('recommend: change 001 gets the Update path, with the steps section 13 adds and the one it leaves out', () => {
  const p = project();
  const want = held(p.read(C1), 'The recommendation');
  p.section(C1, 'The recommendation', ['None yet.']);
  const r = run('recommend.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /8 steps in the recommendation; recommended: Run the path\./);
  const got = held(p.read(C1), 'The recommendation');
  assert.deepStrictEqual(got, want);
  assert.ok(got.includes('- glossary-disposition: section 5 lists no agreed word this change renames'));
  assert.ok(got.includes("- features-and-epics-workflow, step 1, feature-author: section 13 judges its items to change, though the path for the kind doesn't name it"));
});

test('recommend: a change that renames an agreed word starts with glossary-disposition', () => {
  const p = project();
  const t = p.read(C1).replace(/(### Agreed words this change renames\n\n)None/, '$1| Agreed word | Becomes |\n|---|---|\n| Finance approver | Finance checker |');
  p.write(C1, t);
  run('recommend.cjs', p.args(['--change', '001']));
  const got = held(p.read(C1), 'The recommendation');
  assert.strictEqual(got[2], '| 1 | on its own | glossary-disposition | • Finance approver, becomes Finance checker |');
  const c = run('check-change-report.cjs', p.args(['--change', '001']));
  assert.strictEqual(c.code, 0, c.out);
});

test('recommend: a story already ready in an accepted Story list is never changed: it becomes a new story for the difference', () => {
  const p = project();
  assert.strictEqual(p.accept('story-list', '--epic', 'EPIC-002-claim-approval').code, 0);
  run('recommend.cjs', p.args(['--change', '001']));
  const got = held(p.read(C1), 'The recommendation');
  assert.ok(got.includes('| 7 | stories-workflow | step 4, story-drafter | • new story for the difference: Approve a Claim over 500 |'), got.join('\n'));
  assert.ok(got.includes('- stories-workflow, step 5, story-groomer: no story is judged to change'));
});

test('recommend: a large change is a hint only: nothing is parked, and the updates start at their first step', () => {
  const p = project();
  p.change(C1, '| F-05 | Update | its description reads "each claim over 500" |', '| F-05 | Update | moves to EPIC-001, with the claims it checks |');
  run('size-rules.cjs', p.args(['--change', '001']));
  assert.strictEqual(held(p.read(C1), 'The tentative size')[0], '- **Size:** Large');
  run('recommend.cjs', p.args(['--change', '001']));
  const got = held(p.read(C1), 'The recommendation');
  assert.strictEqual(got[2], '| 1 | requirements-workflow | step 2, brd-author | • BR-03 |');
  assert.ok(!got.join('\n').includes('park'), got.join('\n'));
});

test('recommend: a Net new change gets its whole path, glossary-author for its new word, and brd-author when it falls outside the BRD\'s scope', () => {
  const p = project();
  const rel = makeReport(p, '004-draft-claims', {
    title: 'Draft claims', statement: 'Claimants want to save a claim and finish it later.', restated: 'A claimant can save a draft claim and send it later.',
    lands: 'None | None | None | • EPIC-001', kind: 'Net new', test: '• Feature Fit: New capability. Draft claim is not in the Glossary', newItems: ['- New word: Draft claim'],
  });
  analyse(p, '004', rel, { 'EPIC-001': ['No change', 'its outcome stays'] });
  const got = held(p.read(rel), 'The recommendation');
  const steps = got.filter((l) => /^\| \d+ \|/.test(l)).map((l) => l.split('|').slice(2, 5).map((c) => c.trim()).join(' / '));
  assert.deepStrictEqual(steps, [
    'requirements-workflow / step 2, brd-author / • Ask 1',
    'requirements-workflow / step 3, prd-author / • Ask 1',
    'on its own / glossary-author / • New word: Draft claim',
    'data-model-workflow / step 1, things-author / • New word: Draft claim',
    'data-model-workflow / step 2, data-model-author / • Ask 1',
    'features-and-epics-workflow / step 1, feature-author / • Ask 1',
    'features-and-epics-workflow / step 2, epic-grouping-author / • Ask 1',
    'frd-workflow / step 2, frd-author / • Ask 1',
    'stories-workflow / step 4, story-drafter / • Ask 1',
    'stories-workflow / step 5, story-groomer / • Ask 1',
    'stories-workflow / step 6, ac-author / • Ask 1',
  ]);
  const c = run('check-change-report.cjs', p.args(['--change', '004']));
  assert.strictEqual(c.code, 0, c.out);
});

test('recommend: an Already covered change has nothing to run, and a Blocked one waits for its question', () => {
  const p = project();
  const rel = makeReport(p, '005-finance-check', {
    title: 'Finance check', statement: 'Claims over 500 need the finance team to approve them.', restated: 'A claim over 500 goes to a finance approver.',
    lands: '• REQ-3.2 | • F-05 | • FRD-3a | • EPIC-002', kind: 'Already covered', test: '• Feature Fit: Fits. Every word is in the Glossary<br>• F-05.1: same',
  });
  const judged = {};
  run('find-linked.cjs', p.args(['--change', '005']));
  for (const r of md.tableUnder(p.read(rel), 'Linked items')) judged[md.list(r.Item).join(' ').trim()] = ['No change', 'it already says this'];
  analyse(p, '005', rel, judged);
  let got = held(p.read(rel), 'The recommendation');
  assert.strictEqual(got[0], 'Nothing to run: the documents already say it.');
  assert.ok(got.includes('- **Close it:** nothing needs to change, so the change closes when you accept'));
  assert.strictEqual(got[got.length - 1], '**Recommended:** Close it');

  p.change(rel, '| 1 | Already covered |', '| 1 | Blocked |');
  p.section(rel, 'What blocks', ["- Who approves a claim once its claimant has left: question 6, which the finance team answers"]);
  run('recommend.cjs', p.args(['--change', '005']));
  got = held(p.read(rel), 'The recommendation');
  assert.deepStrictEqual(got, ['Nothing is recommended until the question that blocks it is answered: see section 10.', '', '**Recommended:** Answer question 6 first']);
});

// A late answer to question 7, recorded as the specifier would: its answer in the Question log, under Answered.
function answerQuestion7(p) {
  const log = 'expense-claims-question-log.md';
  p.change(log, "| Next best action | Take the recommended answer with the Can move ahead list at the BRD's gate, and add both targets to the list for the client. |",
    "| Next best action | Take the recommended answer with the Can move ahead list at the BRD's gate, and add both targets to the list for the client. |\n| Answer | • Working days from sending a claim to paying it: 10 working days<br>• Share of claims sent back for a missing receipt: 1 in 20 |\n| Decided in | [impact-report.md](changes/002-kpi-targets/impact-report.md), Decision 1 |");
  const g = run('grade-questions.cjs', p.args());
  assert.ok([0, 1].includes(g.code), g.err);
  const rel = makeReport(p, '002-kpi-targets', {
    title: 'KPI targets', statement: 'The finance team has set the targets: 10 working days, and 1 claim in 20 sent back.',
    restated: 'Question 7 is answered: 10 working days from sending a claim to paying it, and 1 claim in 20 sent back for a missing receipt',
    lands: 'None | None | None | • EPIC-002', kind: 'Update or optimize', test: '• Feature Fit: Fits. Both measures are in the BRD<br>• Working days from sending a claim to paying it: changed value',
  });
  p.section(rel, 'Your decision', [
    '### Decision 1 — What targets must the two success measures reach?',
    '- **Question:** 7',
    '- **Asked at:** the change\'s statement',
    '- **Options offered:**',
    '  - **Other: 10 working days, and 1 claim in 20 sent back** — Why: the finance team set them. What happens next: both targets are written.',
    '  - **I don\'t know yet** — What happens next: both targets stay TBD.',
    '- **Recommended:** Other: 10 working days, and 1 claim in 20 sent back',
    '- **Chosen:** Other: 10 working days, and 1 claim in 20 sent back',
    `- **Decided by:** PO, ${DATE}`,
  ]);
  analyse(p, '002', rel, { 'EPIC-002': ['Update', 'its brief names question 7 as its target'] });
  return rel;
}

test('recommend: a late answer to a Low impact question offers "Insert it", naming every place it would change', () => {
  const p = project();
  const rel = answerQuestion7(p);
  const got = held(p.read(rel), 'The recommendation');
  const at = got.indexOf("**Insert it instead:** insert-answer.cjs writes question 7's answer in these places, and nothing else changes:");
  assert.ok(at > 0, got.join('\n'));
  assert.deepStrictEqual(got.slice(at + 1, at + 4), [
    '- expense-claims-brd.md, Working days from sending a claim to paying it: "TBD, question 7" becomes "10 working days, per change 002, Decision 1"',
    '- expense-claims-brd.md, Share of claims sent back for a missing receipt: "TBD, question 7" becomes "1 in 20, per change 002, Decision 1"',
    '- epics/EPIC-002-claim-approval/brief.md, Working days from sending a claim to paying it: "TBD, question 7" becomes "10 working days, per change 002, Decision 1"',
  ]);
  assert.strictEqual(got[got.length - 1], '**Recommended:** Insert it');
  const c = run('check-change-report.cjs', p.args(['--change', '002']));
  assert.strictEqual(c.code, 0, c.out);
});

test('recommend: a late answer that neither has Low impact nor confirms the answer in use is not offered as an insert', () => {
  const p = project();
  const rel = answerQuestion7(p);
  p.change(rel, '| 1 | Question 7 is answered:', '| 1 | Question 4 is answered: any currency, converted at the day\'s rate. Before:');
  p.change('expense-claims-question-log.md', '| Next best action | Ask the finance team this week whether staff claim in other currencies, because the answer changes three features. |',
    '| Next best action | Ask the finance team this week whether staff claim in other currencies, because the answer changes three features. |\n| Answer | Any currency, converted at the day\'s rate |\n| Decided in | [impact-report.md](changes/002-kpi-targets/impact-report.md), Decision 1 |');
  run('grade-questions.cjs', p.args());
  run('recommend.cjs', p.args(['--change', '002']));
  const got = held(p.read(rel), 'The recommendation');
  assert.ok(got.includes("- Insert it: question 4's impact is High, and its answer doesn't confirm the answer in use"), got.join('\n'));
  assert.ok(!got.some((l) => l.startsWith('**Insert it instead')));
});

// A change that only rewords REQ-3.2.
function rewordReq32(p) {
  const rel = makeReport(p, '003-finance-wording', {
    title: 'Finance wording', statement: 'Please word REQ-3.2 as the policy does: claims above 500 must be approved by the finance team.',
    restated: 'REQ-3.2 now reads: "Claims above 500 must be approved by the finance team."',
    lands: '• REQ-3.2 | None | • FRD-3a | None', kind: 'Update or optimize', test: '• Feature Fit: Fits. Every word is in the Glossary<br>• REQ-3.2: wording only',
  });
  analyse(p, '003', rel, {});
  return rel;
}

test('recommend: a change that only rewords a requirement offers "Copy the wording", naming its PRD row and the FRD line that quotes it', () => {
  const p = project();
  const rel = rewordReq32(p);
  const got = held(p.read(rel), 'The recommendation');
  const at = got.indexOf("**Copy the wording instead:** copy-wording.cjs writes REQ-3.2's new wording in these places, and nothing else changes:");
  assert.ok(at > 0, got.join('\n'));
  assert.deepStrictEqual(got.slice(at + 1, at + 3), [
    '- expense-claims-prd.md, section 4, REQ-3.2: "Claims over 500 need finance approval." becomes "Claims above 500 must be approved by the finance team."',
    '- frd/frd-claim-approval.md, Requirements, REQ-3.2: "Claims over 500 need finance approval." becomes "Claims above 500 must be approved by the finance team."',
  ]);
  assert.strictEqual(got[got.length - 1], '**Recommended:** Copy the wording');
});

test('recommend: a change that reaches most of the business requirements is flagged, and offers the re-run', () => {
  const p = project();
  p.change(C1, '| 1 | • BR-03<br>• REQ-3.2 | • F-05 |', '| 1 | • BR-01<br>• BR-02<br>• BR-03<br>• REQ-3.2 | • F-05 |');
  analyse(p, '001', C1, {});
  const got = held(p.read(C1), 'The recommendation');
  assert.ok(got.includes('**This change reaches most of the business requirements:** 3 of 4. Consider a re-run of the whole workflow, from requirements-workflow, step 1.'), got.join('\n'));
  assert.ok(got.includes('- **Re-run the whole workflow:** from requirements-workflow, step 1, discovery-author'));
});

// ---------------------------------------------------------------- check-change-report

test('check-change-report: change 001 passes every check, and prints the three blocks the gate needs', () => {
  const p = project();
  const r = run('check-change-report.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^For the person:\nWhat the draft holds:\n- Ask 1: Update or optimize\n- 16 linked items, 15 judged to change\n- Size: Small\n- Recommended: Run the path\n/);
  assert.match(r.out, /\nOne line:\ncheck-change-report\.cjs: 19 of 19 checks passed, 0 findings; /);
  assert.match(r.out, /\nFor the file:\ncheck-change-report\.cjs, 2026-10-22: 19 of 19 checks passed, 0 findings\./);
});

test('check-change-report: it catches each seeded failure', () => {
  const p = project();
  const clean = p.read(C1);
  const seeds = [
    ['a kind that is not one of the five', '| 1 | Update or optimize |', '| 1 | Changed |', /Kind: Ask 1's kind, "Changed", isn't one of the five/],
    ['a result the update test does not give', '• F-05.2: changed value', '• F-05.2: bigger', /The update test: Ask 1: F-05\.2's result, "bigger", isn't one of/],
    ['a changed rule with a kind other than Update', '| 1 | Update or optimize |', '| 1 | Extend or enhance |', /so its kind is Update or optimize, not Extend or enhance/],
    ['a failed challenge', '**Verdict:** PASS_WITH_FINDINGS', '**Verdict:** FAIL', /The challenge: The challenge failed/],
    ['no verdict', '**Verdict:** PASS_WITH_FINDINGS', 'No verdict.', /has no "\*\*Verdict:\*\*" line/],
    ['a linked item with no judgement', '| F-05.dw2 | No change | it names no limit |\n', '', /F-05\.dw2 has no judgement in section 13/],
    ['a judgement feature-impact does not give', '| F-05.dw2 | No change |', '| F-05.dw2 | Stays |', /F-05\.dw2's judgement, "Stays", isn't one of/],
    ['a size program would not give', '- **Size:** Small', '- **Size:** Large', /Section 14 isn't what size-rules\.cjs gives now, Small/],
    ['a recommendation program would not give', '| 2 | requirements-workflow | step 3, prd-author | • REQ-3.2 |\n', '', /Section 15 isn't what recommend\.cjs gives now/],
    ['a blocker that names no question', '## 10. What blocks', '## 10. What blocks\n\n- The finance team has not said when the new limit starts', /names no question in the Question log/],
    ['a blocker that names a question not in the log', '## 10. What blocks', '## 10. What blocks\n\n- When the new limit starts: question 99', /names question 99, which isn't in the Question log/],
    ['a word found with no settling', 'None: no document from outside came with this change.', '| Word found | Where | Settled as |\n|---|---|---|\n| approver | email, line 2 | |', /"approver" doesn't say how it was settled/],
    ['no part for the agreed words renamed', '### Agreed words this change renames', '### Other words', /Section 5 has no "Agreed words this change renames" part/],
    ['a placeholder left', '| 1 | A claim goes to a finance approver', '| 1 | {restated ask} A claim goes to a finance approver', /Placeholders: /],
    ['a gap that names no question', '- The Approve step', '- The Approve step, TBD', /names no question/],
    ['a renamed word without glossary-disposition first', '### Agreed words this change renames\n\nNone', '### Agreed words this change renames\n\n| Agreed word | Becomes |\n|---|---|\n| Finance approver | Finance checker |', /glossary-disposition comes first/],
    ['a request called by a name the kit has not got', '| 1 | change request |', '| 1 | wish |', /Requests: Request 1 is called "wish"/],
    ['a quote that is not in its file', '| The finance team confirmed on 2 October that 500 is the new limit, and the policy will be updated. |', '| The finance team confirmed that 750 is the limit. |', /The findings: Finding 1: its quote isn't in expense-claims-discovery-brief\.md, word for word\./],
    ['a quote from a file the project has not got', '| expense-claims-discovery-brief.md |', '| notes/meeting.md |', /The findings: Finding 1: its file, notes\/meeting\.md, isn't in the project\./],
    ['a finding with no say in what it would change', '| none of these | the files settle it |', '| a lot | the files settle it |', /The findings: Finding 1: "a lot" isn't what a finding can change/],
    ['a verdict the fixed rule does not give', '| none of these | the files settle it |', '| the type | the files settle it |', /The findings: The verdict is PASS_WITH_FINDINGS, but the fixed rule gives FAIL for these findings\./],
    ['a finding that needs your answer, with no question', '| none of these | the files settle it |', '| none of these | needs your answer |', /The findings: Finding 1 needs your answer, so its Answer names its question in the Question log\./],
    ['a word the Glossary retired, in section 5', '| 1 | A claim goes to a finance approver', '| 1 | An expense report goes to a finance approver', /Agreed words: Section 5: "[Ee]xpense report" is a word the Glossary retired\. Use Claim\./],
  ];
  const missed = [];
  for (const [name, from, to, want] of seeds) {
    p.write(C1, clean);
    p.change(C1, from, to);
    const r = run('check-change-report.cjs', p.args(['--change', '001']));
    if (r.code !== 1 || !want.test(r.out)) missed.push(`${name}: exit ${r.code}\n${r.out}`);
  }
  assert.deepStrictEqual(missed, []);
});

// ---------------------------------------------------------------- park

test('park: a change never parks anything, however large; an EPIC parked at its gate goes last for route-next-epic', () => {
  const p = project();
  p.change(C1, '| F-05 | Update | its description reads "each claim over 500" |', '| F-05 | Update | moves to EPIC-001, with the claims it checks |');
  run('size-rules.cjs', p.args(['--change', '001']));
  let r = run('park.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 2, r.out + r.err);
  assert.doesNotMatch(p.read(LIST), /^Status: parked/m);
  r = run('park.cjs', p.args(['--epic', 'EPIC-002']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const n = run('route-next-epic.cjs', p.args());
  assert.match(n.out, /^Next: EPIC-001/m, n.out);
  assert.ok(n.out.indexOf('EPIC-002') > n.out.indexOf('EPIC-001'), n.out);
});

test('park: at an FRD\'s gate it parks a drafted FRD, and refuses an accepted one', () => {
  const p = project();
  let r = run('park.cjs', p.args(['--capability', 'claim-approval']));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Nothing in progress to park/);
  p.write('frd/frd-claim-approval.md', p.read('frd/frd-claim-approval.md').replace(/^Status: .*$/m, 'Status: drafted'));
  r = run('park.cjs', p.args(['--capability', 'claim-approval']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(p.read('frd/frd-claim-approval.md'), /^Status: parked on 2026-10-22, at its gate$/m);
  r = run('park.cjs', p.args(['--epic', 'EPIC-002']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(p.read(LIST), /^Status: parked on 2026-10-22, at its gate$/m);
});

// ---------------------------------------------------------------- track-change and close-change

test('track-change: accepting change 001 starts its progress, and the last acceptance it names closes it with its closing entry', () => {
  const p = project();
  p.section(C1, 'Your decision', decision(1, ACCEPT_Q, 'Run the path'));
  let r = p.accept('change-impact-report', '--change', '001-finance-limit');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /track-change\.cjs:\n- change 001: 7 of 7 documents still pending\./);
  const progress = 'changes/001-finance-limit/progress.md';
  assert.deepStrictEqual(md.tableUnder(p.read(progress), 'Documents').map((x) => [md.list(x.Document).join(''), md.list(x['Version at the start']).join(''), md.list(x.Status).join('')]), [
    ['expense-claims-brd.md', '1', 'pending'],
    ['expense-claims-prd.md', '1', 'pending'],
    ['glossary/data-models/claims.md', '1', 'pending'],
    ['frd/feature-catalog.md', '1', 'pending'],
    ['frd/frd-claim-approval.md', '1', 'pending'],
    ['epics/EPIC-002-claim-approval/brief.md', 'none', 'pending'],
    ['epics/EPIC-002-claim-approval/story-list.md', 'none', 'pending'],
  ]);
  const s = run('status.cjs', p.args());
  assert.match(s.out, /Open changes\n- 001-finance-limit: open/);
  r = run('close-change.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /change 001 can't close yet: 7 documents still pending:/);
  for (const d of [['brd'], ['prd'], ['data-model', '--family', 'claims'], ['feature-catalog'], ['frd', '--capability', 'claim-approval'], ['epic-brief', '--epic', 'EPIC-002-claim-approval']]) assert.strictEqual(p.accept(...d).code, 0);
  r = p.accept('story-list', '--epic', 'EPIC-002-claim-approval');
  assert.match(r.out, /- change 001: closed on 2026-10-22: Decision 2 in expense-claims-brd\.md\./, r.out);
  assert.match(p.read(progress), /^Status: closed on 2026-10-22$/m);
  assert.ok(p.read('expense-claims-brd.md').includes([
    '### Decision 2 — Change 001 closed',
    '- **Change:** 001, finance limit',
    '- **Applied in:**',
    '  - expense-claims-brd.md, version 2',
    '  - expense-claims-prd.md, version 2',
    '  - glossary/data-models/claims.md, version 2',
    '  - frd/feature-catalog.md, version 2',
    '  - frd/frd-claim-approval.md, version 2',
    '  - epics/EPIC-002-claim-approval/brief.md, version 1',
    '  - epics/EPIC-002-claim-approval/story-list.md, version 1',
    '- **Closed on:** 2026-10-22',
  ].join('\n')));
  assert.match(run('status.cjs', p.args()).out, /Open changes\n- None/);
  assert.match(run('close-change.cjs', p.args(['--change', '001'])).out, /change 001 closed already\./);
});

test('next-change-step and change-summary: after your yes, each names the next update, then what every update changed', () => {
  const p = project();
  let r = run('next-change-step.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 2, 'no to-do list before your yes');
  p.section(C1, 'Your decision', decision(1, ACCEPT_Q, 'Run the path'));
  assert.strictEqual(p.accept('change-impact-report', '--change', '001-finance-limit').code, 0);
  r = run('next-change-step.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.strictEqual(r.out, 'Next: expense-claims-brd.md\n- run requirements-workflow, step 2, brd-author, for BR-03\n\n7 of 7 still to make.\n');
  assert.strictEqual(p.accept('brd').code, 0);
  r = run('next-change-step.cjs', p.args(['--change', '001']));
  assert.match(r.out, /^Next: expense-claims-prd\.md\n- run requirements-workflow, step 3, prd-author, for REQ-3\.2\n\n6 of 7 still to make\.\n$/);
  r = run('change-summary.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Change 001, finance limit: 6 still to make\.\n/);
  assert.ok(r.out.includes('| expense-claims-brd.md | version 1 | version 2 | • BR-03 |'), r.out);
  assert.ok(r.out.includes('| expense-claims-prd.md | version 1 | not yet | • REQ-3.2 |'), r.out);
  for (const d of [['prd'], ['data-model', '--family', 'claims'], ['feature-catalog'], ['frd', '--capability', 'claim-approval'], ['epic-brief', '--epic', 'EPIC-002-claim-approval'], ['story-list', '--epic', 'EPIC-002-claim-approval']]) assert.strictEqual(p.accept(...d).code, 0);
  r = run('next-change-step.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.out, 'Every update is made: 7 of 7. Change 001 is closed. Next: run change-summary.cjs.\n');
  assert.match(run('change-summary.cjs', p.args(['--change', '001'])).out, /^Change 001, finance limit: closed\.\n/);
});

test('track-change: an Already covered change, closed with nothing to run, closes as soon as it is accepted', () => {
  const p = project();
  const rel = makeReport(p, '005-finance-check', {
    title: 'Finance check', statement: 'Claims over 500 need the finance team to approve them.', restated: 'A claim over 500 goes to a finance approver.',
    lands: '• REQ-3.2 | • F-05 | • FRD-3a | • EPIC-002', kind: 'Already covered', test: '• Feature Fit: Fits. Every word is in the Glossary<br>• F-05.1: same',
  });
  run('find-linked.cjs', p.args(['--change', '005']));
  const judged = {};
  for (const r of md.tableUnder(p.read(rel), 'Linked items')) judged[md.list(r.Item).join(' ').trim()] = ['No change', 'it already says this'];
  analyse(p, '005', rel, judged);
  p.section(rel, 'Your decision', decision(1, ACCEPT_Q, 'Close it'));
  const r = p.accept('change-impact-report', '--change', '005-finance-check');
  assert.match(r.out, /- change 005: closed on 2026-10-22: Decision 2 in changes\/005-finance-check\/impact-report\.md\./, r.out);
  assert.ok(p.read(rel).includes('### Decision 2 — Change 005 closed\n- **Change:** 005, finance check\n- **Applied in:**\n  - None: nothing needed to change'));
});

// ---------------------------------------------------------------- insert-answer

test('insert-answer: question 7\'s answer fills both KPI targets in the BRD and the EPIC brief\'s, and nothing else changes', () => {
  const p = project();
  const rel = answerQuestion7(p);
  const brdBefore = p.read('expense-claims-brd.md').split('\n');
  p.section(rel, 'Your decision', [...p.read(rel).split('\n').slice(0, 0), ...held(p.read(rel), 'Your decision'), '', ...decision(2, ACCEPT_Q, 'Insert it')]);
  assert.strictEqual(p.accept('change-impact-report', '--change', '002-kpi-targets').code, 0);
  const r = run('insert-answer.cjs', p.args(['--change', '002', '--question', '7']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /question 7's answer written in 3 places, in 2 documents\./);
  assert.match(r.out, /- expense-claims-brd\.md: accepted again, as version 2\./);
  assert.match(r.out, /- epics\/EPIC-002-claim-approval\/brief\.md: drafted, so it keeps the new words in its next draft\./);
  assert.match(r.out, /No gap outside the records still names question 7\./);
  const brdAfter = p.read('expense-claims-brd.md').split('\n');
  const changed = brdAfter.filter((l, i) => l !== brdBefore[i]);
  assert.strictEqual(brdAfter.length, brdBefore.length);
  assert.strictEqual(changed.length, 3, changed.join('\n'));
  assert.ok(changed.some((l) => l.startsWith('Status: accepted on 2026-10-22, version 2')));
  assert.ok(changed.some((l) => l.includes('| 10 working days, per change 002, Decision 1 |')));
  assert.ok(changed.some((l) => l.includes('| 1 in 20, per change 002, Decision 1 |')));
  assert.match(p.read('epics/EPIC-002-claim-approval/brief.md'), /^Status: drafted$/m);
  assert.ok(p.read('epics/EPIC-002-claim-approval/brief.md').includes('| 10 working days, per change 002, Decision 1 | TENTATIVE: no file gives a target |'));
  const progress = p.read('changes/002-kpi-targets/progress.md');
  assert.strictEqual(md.tableUnder(progress, 'Places written').length, 3);
  assert.match(progress, /^Status: open$/m);
  const done = p.accept('epic-brief', '--epic', 'EPIC-002-claim-approval');
  assert.match(done.out, /- change 002: closed on 2026-10-22/, done.out);
});

test('insert-answer: an answer that would need other words changed is refused, and names the path instead', () => {
  const p = project();
  const rel = answerQuestion7(p);
  p.section(rel, 'Your decision', [...held(p.read(rel), 'Your decision'), '', ...decision(2, ACCEPT_Q, 'Insert it')]);
  assert.strictEqual(p.accept('change-impact-report', '--change', '002-kpi-targets').code, 0);
  p.change('expense-claims-question-log.md', '| Next best action | Ask the finance team this week whether staff claim in other currencies, because the answer changes three features. |',
    '| Next best action | Ask the finance team this week whether staff claim in other currencies, because the answer changes three features. |\n| Answer | Any currency, converted at the day\'s rate |\n| Decided in | [impact-report.md](changes/002-kpi-targets/impact-report.md), Decision 1 |');
  run('grade-questions.cjs', p.args());
  const before = p.read('expense-claims-brd.md');
  const r = run('insert-answer.cjs', p.args(['--change', '002', '--question', '4']));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Nothing is written: 4 places would need other words changed, so the change needs the path for its kind, in section 15\./);
  assert.match(r.out, /doesn't confirm the answer in use, "Euros only"/);
  assert.strictEqual(p.read('expense-claims-brd.md'), before);
});

test('insert-answer: without "Insert it" chosen at the gate, nothing is written', () => {
  const p = project();
  answerQuestion7(p);
  const r = run('insert-answer.cjs', p.args(['--change', '002', '--question', '7']));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Change 002's decision is not made yet, not "Insert it": nothing is written\./);
});

// ---------------------------------------------------------------- copy-wording

test('copy-wording: rewording REQ-3.2 changes its PRD row and the FRD line that quotes it, and nothing else; the change then closes', () => {
  const p = project();
  const rel = rewordReq32(p);
  p.section(rel, 'Your decision', decision(1, ACCEPT_Q, 'Copy the wording'));
  assert.strictEqual(p.accept('change-impact-report', '--change', '003-finance-wording').code, 0);
  const prdBefore = p.read('expense-claims-prd.md').split('\n');
  const frdBefore = p.read('frd/frd-claim-approval.md').split('\n');
  const r = run('copy-wording.cjs', p.args(['--change', '003', '--requirement', 'REQ-3.2']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /REQ-3\.2's new wording written in 2 places, in 2 documents\./);
  // Every line put in, beyond the new status line, and the closing entry the change writes in the PRD once it closes.
  const added = (before, rel2) => p.read(rel2).split('\n').filter((l) => !before.includes(l) && !/^Status: /.test(l));
  assert.deepStrictEqual(added(prdBefore, 'expense-claims-prd.md'), [
    '| REQ-3.2 | Requirement | **Finance approval** — Claims above 500 must be approved by the finance team. | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |',
    '### Decision 2 — Change 003 closed',
    '- **Change:** 003, finance wording',
    '- **Applied in:**',
    '  - expense-claims-prd.md, version 2',
    '  - frd/frd-claim-approval.md, version 2',
    '- **Closed on:** 2026-10-22',
  ]);
  assert.deepStrictEqual(added(frdBefore, 'frd/frd-claim-approval.md'), ['- **REQ-3.2 Finance approval** — Claims above 500 must be approved by the finance team.']);
  assert.match(p.read('changes/003-finance-wording/progress.md'), /^Status: closed on 2026-10-22$/m);
});

test('copy-wording: a place that quotes the requirement differently is refused, and nothing is written', () => {
  const p = project();
  const rel = rewordReq32(p);
  p.section(rel, 'Your decision', decision(1, ACCEPT_Q, 'Copy the wording'));
  assert.strictEqual(p.accept('change-impact-report', '--change', '003-finance-wording').code, 0);
  p.change('frd/frd-claim-approval.md', '- **REQ-3.2 Finance approval** — Claims over 500 need finance approval.', '- **REQ-3.2 Finance approval** — Claims over 500 need a finance approval.');
  const before = p.read('expense-claims-prd.md');
  const r = run('copy-wording.cjs', p.args(['--change', '003', '--requirement', 'REQ-3.2']));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /1 place quote REQ-3\.2 differently from the PRD/);
  assert.strictEqual(p.read('expense-claims-prd.md'), before);
});

// ---------------------------------------------------------------- compare-versions

test('compare-versions: requirement by requirement, a quiet edit beside the change is listed, with what was added', () => {
  const p = project();
  p.write('sources/requirements/claims-requirements-v2.md', '# Claims requirements, version 2\n\nREQ-3.2 Finance approval: Claims over 500 need finance approval.\n\nREQ-4.1 Payment: Approved claims are paid with the monthly payroll.\n');
  p.write('changes/001-finance-limit/claims-requirements-v3.md', '# Claims requirements, version 3\n\nREQ-3.2 Finance approval: Claims over 1,000 need finance approval.\n\nREQ-4.1 Payment: Approved claims are paid with the weekly payroll.\n\nREQ-4.2 Receipts: Receipts are kept for seven years.\n');
  const r = run('compare-versions.cjs', p.args(['--change', '001', '--new', 'claims-requirements-v3.md', '--old', 'sources/requirements/claims-requirements-v2.md']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /3 differences, written to section 3/);
  assert.deepStrictEqual(held(p.read(C1), 'Other differences in a new version'), [
    '| Where | Before | After |',
    '|---|---|---|',
    '| REQ-3.2, changed. The PRD holds it as Requirement. | "REQ-3.2 Finance approval: Claims over 500 need finance approval." | "REQ-3.2 Finance approval: Claims over 1,000 need finance approval." |',
    '| REQ-4.1, changed | "REQ-4.1 Payment: Approved claims are paid with the monthly payroll." | "REQ-4.1 Payment: Approved claims are paid with the weekly payroll." |',
    '| REQ-4.2, added | None | "REQ-4.2 Receipts: Receipts are kept for seven years." |',
  ]);
});

test('compare-versions: a changed requirement the PRD holds as Scope says so, for change-request-disposition to judge its kind', () => {
  const p = project();
  p.change('expense-claims-prd.md', '| REQ-2.3 | Requirement |', '| REQ-2.3 | Scope |');
  p.write('sources/requirements/claims-requirements-v2.md', '# Claims requirements, version 2\n\nREQ-2.3 Drafts: Claimants may later keep a claim as a draft.\n');
  p.write('changes/001-finance-limit/claims-requirements-v3.md', '# Claims requirements, version 3\n\nREQ-2.3 Drafts: Claimants must be able to keep a claim as a draft.\n');
  const r = run('compare-versions.cjs', p.args(['--change', '001', '--new', 'claims-requirements-v3.md', '--old', 'sources/requirements/claims-requirements-v2.md']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.strictEqual(held(p.read(C1), 'Other differences in a new version')[2], '| REQ-2.3, changed. The PRD holds it as Scope. | "REQ-2.3 Drafts: Claimants may later keep a claim as a draft." | "REQ-2.3 Drafts: Claimants must be able to keep a claim as a draft." |');
});

test('compare-versions: without requirement IDs it compares line by line; a missing version exits with code 2', () => {
  const p = project();
  p.write('sources/notes-v1.md', 'Claims are paid monthly.\nReceipts are kept.\n');
  p.write('changes/001-finance-limit/notes-v2.md', 'Claims are paid weekly.\nReceipts are kept.\nManagers are reminded after 3 days.\n');
  const r = run('compare-versions.cjs', p.args(['--change', '001', '--new', 'notes-v2.md', '--old', 'sources/notes-v1.md']));
  assert.strictEqual(r.code, 0, r.err);
  assert.deepStrictEqual(held(p.read(C1), 'Other differences in a new version').slice(2), [
    '| line 1 | "Claims are paid monthly." | "Claims are paid weekly." |',
    '| line 3 | None | "Managers are reminded after 3 days." |',
  ]);
  assert.strictEqual(run('compare-versions.cjs', p.args(['--change', '001', '--new', 'missing.md', '--old', 'sources/notes-v1.md'])).code, 2);
});

// ---------------------------------------------------------------- a change reaches the data model

const THINGS = 'glossary/data-models/expense-claims-glossary-things.md';
const CLAIMS = 'glossary/data-models/claims.md';
const FRD = 'frd/frd-claim-approval.md';
const mapOf = (p) => JSON.parse(fs.readFileSync(p.file('traceability-map.json'), 'utf8'));
const stepRows = (lines) => lines.filter((l) => /^\| \d+ \|/.test(l));
const progressRows = (p, folder) => md.tableUnder(p.read(`changes/${folder}/progress.md`), 'Documents').map((x) => [md.list(x.Document).join(''), md.list(x.For).join(' + '), md.list(x['Version at the start']).join(''), md.list(x.Status).join('')]);

test('traceability-map: the things file gives each thing, and claims.md each action, field and move, linked to its thing', () => {
  const p = project();
  const map = mapOf(p);
  const of = (type) => map.items.filter((i) => i.type === type);
  assert.deepStrictEqual(of('thing').map((i) => [i.id, i.document]), [['Claim', THINGS], ['Expense line', THINGS], ['Receipt', THINGS]]);
  const rows = of('data model row');
  // Claim: 9 actions, 3 fields and 5 moves. Expense line: 5 actions and 1 field. Receipt: 5 actions.
  assert.strictEqual(rows.length, 28);
  assert.ok(rows.every((i) => i.document === CLAIMS && i.version === 1));
  for (const id of ['Claim, Approve over the limit', 'Claim, amount', 'Claim, Draft → Submitted', 'Expense line, receipt', 'Receipt, Attach']) assert.ok(rows.some((i) => i.id === id), id);
  const hasRow = map.links.filter((l) => l.type === 'has-row');
  assert.deepStrictEqual(hasRow.map((l) => l.to).sort(), rows.map((i) => i.id).sort());
  assert.ok(hasRow.every((l) => l.to.startsWith(`${l.from}, `)), 'a row is linked to another thing');
  assert.deepStrictEqual(['Claim', 'Expense line', 'Receipt'].map((t) => hasRow.filter((l) => l.from === t).length), [17, 6, 5]);
});

test('traceability-map: a rule whose source is "data model — {thing}, {row}" names that row, and no other rule names one', () => {
  const p = project();
  assert.deepStrictEqual(mapOf(p).links.filter((l) => l.type === 'names-row').map((l) => `${l.from} -> ${l.to}`), [
    'F-04.5 -> Claim, Browse',
    'F-04.6 -> Claim, Approve',
    'F-04.7 -> Claim, Reject',
    'F-05.4 -> Claim, Approve over the limit',
  ]);
});

test('traceability-map: a rule naming a row the accepted data model hasn\'t got is a problem, and the acceptance stops', () => {
  const p = project();
  p.change(FRD, '| data model — Claim, Approve over the limit |', '| data model — Claim, Archive |');
  const r = p.accept('frd', '--capability', 'claim-approval');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /^- names-row: F-05\.4 -> Claim, Archive, but Claim, Archive isn't in the accepted data-model$/m);
  assert.match(r.err, /Acceptance stopped at traceability-map\.cjs, exit code 1\./);
  assert.strictEqual(run('traceability-map.cjs', p.args()).code, 1);
});

test('traceability-map: a row of a data model file not yet accepted is only waiting, and a problem once that file is accepted without it', () => {
  const p = project();
  // A second family, Payments, which the things file names before its data model file is written.
  p.change(THINGS, 'Left out: Claimant (no details kept), Line manager (no details kept), Finance approver (no details kept)', [
    'Left out: Claimant (no details kept), Line manager (no details kept), Finance approver (no details kept)', '',
    '## Payments', '', 'Data model file: [payments.md](payments.md)', '',
    '| Thing | Definition |', '|---|---|', '| Payment | what it is, in one plain sentence |',
  ].join('\n'));
  assert.strictEqual(p.accept('data-model-things').code, 0);
  p.change(FRD, '| data model — Claim, Approve over the limit |', '| data model — Payment, Make |');
  let r = p.accept('frd', '--capability', 'claim-approval');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- Payment, Make, wanted by:\n {2}- F-05\.4$/m);
  assert.doesNotMatch(r.out, /Problems/);
  p.write('glossary/data-models/payments.md', [
    '# Data model — Payments, Expense claims', '', 'Status: drafted', '', 'Next step: accept it.', '',
    '## Things and their fields', '', '| Thing | Fields it gives |', '|---|---|', '| Payment | – |', '',
    '## Payment', '', 'Definition: what it is, in one plain sentence', '', '**Actions**', '',
    '| Action | In step | Who | Rules |', '|---|---|---|---|', '| Pay | Pay | the product | Only for an **Approved** claim. |', '',
    '## Check record', '', 'None yet.', '',
  ].join('\n'));
  r = p.accept('data-model', '--family', 'payments');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /^- names-row: F-05\.4 -> Payment, Make, but Payment, Make isn't in the accepted data-model$/m);
  assert.ok(mapOf(p).items.some((i) => i.id === 'Payment, Pay' && i.document === 'glossary/data-models/payments.md'));
});

test('find-linked: from a data model row in section 6 it reaches the rule whose source names it, then that rule\'s scenario; a thing named alone leads to nothing more', () => {
  const p = project();
  p.change(C1, '| 1 | • BR-03<br>• REQ-3.2 | • F-05 | • FRD-3a | • EPIC-002 | • Claim, Approve over the limit |', '| 1 | None | None | None | None | • Claim, Approve over the limit<br>• Receipt |');
  const r = run('find-linked.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(held(p.read(C1), 'Linked items'), [
    '| Item | Type | Linked through |',
    '|---|---|---|',
    '| Claim, Approve over the limit | data model row | where the change lands |',
    '| Receipt | thing | where the change lands |',
    '| F-05.4 | rule | names-row, from Claim, Approve over the limit |',
    '| Approve a Claim over 500, Scenario 2 | scenario | names-rule, from F-05.4 |',
  ]);
  p.change(C1, '• Claim, Approve over the limit<br>• Receipt |', '• Claim, Archive |');
  const missing = run('find-linked.cjs', p.args(['--change', '001']));
  assert.strictEqual(missing.code, 1);
  assert.match(missing.out, /Claim, Archive, in section 6, isn't in the Traceability map or in any drafted document\./);
});

test('check-change-report: it catches a missing Data model column, and a thing the things file hasn\'t got', () => {
  const p = project();
  const clean = p.read(C1);
  const seeds = [
    ['no Data model column', [['| Ask | Requirement | Feature | FRD | EPIC | Data model |\n|---|---|---|---|---|---|\n', '| Ask | Requirement | Feature | FRD | EPIC |\n|---|---|---|---|---|\n'], ['| • EPIC-002 | • Claim, Approve over the limit |', '| • EPIC-002 |']],
      /Asks: Section 6 has no "Data model" column: it says None for an ask that touches no thing\./],
    ['a row of a thing the things file hasn\'t got', [['| • EPIC-002 | • Claim, Approve over the limit |', '| • EPIC-002 | • Payment, Approve over the limit |']],
      /Asks: Ask 1: "Payment, Approve over the limit", in the Data model column, names no thing in the things file\./],
    ['a thing alone the things file hasn\'t got', [['| • EPIC-002 | • Claim, Approve over the limit |', '| • EPIC-002 | • Claims |']],
      /Asks: Ask 1: "Claims", in the Data model column, names no thing in the things file\./],
  ];
  const missed = [];
  for (const [name, edits, want] of seeds) {
    p.write(C1, clean);
    for (const [from, to] of edits) p.change(C1, from, to);
    const r = run('check-change-report.cjs', p.args(['--change', '001']));
    if (r.code !== 1 || !want.test(r.out)) missed.push(`${name}: exit ${r.code}\n${r.out}`);
  }
  assert.deepStrictEqual(missed, []);
});

test('check-change-report: a thing named alone in the Data model column passes, and with no things file each item there is a finding', () => {
  const p = project();
  p.change(C1, '| • EPIC-002 | • Claim, Approve over the limit |', '| • EPIC-002 | • Claim |');
  let r = run('check-change-report.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 0, r.out);
  fs.rmSync(p.file(THINGS));
  r = run('check-change-report.cjs', p.args(['--change', '001']));
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /Asks: Ask 1: "Claim", in the Data model column, names a thing, but the project has no things file yet\./);
});

// The data model never raises a change to the requirements, and an FRD's gate never sends a change back to it. So a
// cell that still names an RC, left from an earlier kit, makes no row wait on any change.
test('recommend: a data model cell that names an RC, and a statement that names one, send nothing to data-model-author', () => {
  const p = project();
  p.change(CLAIMS, '| Only for a claim over 500. Only while the claim is **Approved**. |', '| Only for a claim over 500. Only while the claim is **Approved**. Needs ? (RC-1) finance approvals. |');
  const rel = makeReport(p, '006-finance-approvals', {
    title: 'Finance approvals', statement: 'RC-1 is answered: one finance approver approves a claim over the limit.', restated: 'A claim over the limit needs one finance approval.',
    lands: '• REQ-3.2 | None | None | None', kind: 'Update or optimize', test: '• Feature Fit: Fits. Every word is in the Glossary<br>• REQ-3.2: changed value',
  });
  run('find-linked.cjs', p.args(['--change', '006']));
  const judged = {};
  for (const r of md.tableUnder(p.read(rel), 'Linked items')) judged[md.list(r.Item).join(' ').trim()] = ['No change', 'it names no count of approvals'];
  delete judged['REQ-3.2'];
  analyse(p, '006', rel, judged);
  const got = held(p.read(rel), 'The recommendation');
  assert.deepStrictEqual(stepRows(got), ['| 1 | requirements-workflow | step 3, prd-author | • REQ-3.2 |']);
  assert.ok(got.includes('- data-model-workflow, step 2, data-model-author: no data model row is judged to change, and none waits on this change'), got.join('\n'));
});

// A late answer to question 4, recorded as the specifier would, in change 002. It lands on the FRD whose Data section
// holds the answer in use, marked Proposed.
function answerQuestion4(p, answer) {
  p.change('expense-claims-question-log.md', '| Next best action | Ask the finance team this week whether staff claim in other currencies, because the answer changes three features. |',
    `| Next best action | Ask the finance team this week whether staff claim in other currencies, because the answer changes three features. |\n| Answer | ${answer} |\n| Decided in | [impact-report.md](changes/002-currencies/impact-report.md), Decision 1 |`);
  run('grade-questions.cjs', p.args());
  const rel = makeReport(p, '002-currencies', {
    title: 'Currencies', statement: `The finance team has answered question 4: ${answer}.`, restated: `Question 4 is answered: ${answer}`,
    lands: 'None | None | • FRD-3a | None', kind: 'Update or optimize', test: '• Feature Fit: Fits. Every word is in the Glossary<br>• F-05.1: same',
  });
  p.section(rel, 'Your decision', [
    '### Decision 1 — Which currencies can a claim be made in?',
    '- **Question:** 4',
    '- **Asked at:** the change\'s statement',
    '- **Options offered:**',
    `  - **Other: ${answer}** — Why: the finance team said so. What happens next: the answer is written.`,
    '  - **I don\'t know yet** — What happens next: the answer in use stays.',
    `- **Recommended:** Other: ${answer}`,
    `- **Chosen:** Other: ${answer}`,
    `- **Decided by:** PO, ${DATE}`,
  ]);
  analyse(p, '002', rel, { 'FRD-3a': ['Update', 'its Data section gives the amount in euros, marked Proposed'] });
  return rel;
}

test('recommend: a late answer sends the data model row that holds its Proposed answer to data-model-author, before frd-author', () => {
  const p = project();
  const rel = answerQuestion4(p, 'Any currency, converted at the day\'s rate');
  const got = held(p.read(rel), 'The recommendation');
  assert.deepStrictEqual(stepRows(got), [
    '| 1 | data-model-workflow | step 2, data-model-author | • Claim, amount: question 4\'s answer |',
    '| 2 | frd-workflow | step 2, frd-author | • FRD-3a |',
  ]);
  assert.ok(got.includes("- Insert it: question 4's impact is High, and its answer doesn't confirm the answer in use"), got.join('\n'));
  const c = run('check-change-report.cjs', p.args(['--change', '002']));
  assert.strictEqual(c.code, 0, c.out);
});

// Change 007, which renames Finance approver. It lands on F-05, and nothing linked is judged to change.
function renameFinanceApprover(p) {
  const rel = makeReport(p, '007-finance-checker', {
    title: 'Finance checker', statement: 'Call the finance approver the finance checker from now on.', restated: 'Finance approver becomes Finance checker.',
    lands: 'None | • F-05 | None | None', kind: 'Update or optimize', test: '• Feature Fit: Fits. Finance checker replaces an agreed word', renames: [['Finance approver', 'Finance checker']],
  });
  run('find-linked.cjs', p.args(['--change', '007']));
  const judged = {};
  for (const r of md.tableUnder(p.read(rel), 'Linked items')) judged[md.list(r.Item).join(' ').trim()] = ['No change', 'the rename is the Glossary\'s'];
  analyse(p, '007', rel, judged);
  return rel;
}

test('recommend: with a data model, a renamed word goes to things-author, and to data-model-author for the data model files that use it', () => {
  const p = project();
  const rel = renameFinanceApprover(p);
  assert.deepStrictEqual(stepRows(held(p.read(rel), 'The recommendation')), [
    '| 1 | on its own | glossary-disposition | • Finance approver, becomes Finance checker |',
    '| 2 | data-model-workflow | step 1, things-author | • Finance approver, becomes Finance checker |',
    '| 3 | data-model-workflow | step 2, data-model-author | • Finance approver, becomes Finance checker |',
  ]);
  const c = run('check-change-report.cjs', p.args(['--change', '007']));
  assert.strictEqual(c.code, 0, c.out);
});

test('recommend: a Net new change gives things-author its new word and data-model-author its ask only while the project has a data model', () => {
  const p = project();
  const rel = makeReport(p, '004-draft-claims', {
    title: 'Draft claims', statement: 'Claimants want to save a claim and finish it later.', restated: 'A claimant can save a draft claim and send it later.',
    lands: 'None | None | None | • EPIC-001', kind: 'Net new', test: '• Feature Fit: New capability. Draft claim is not in the Glossary', newItems: ['- New word: Draft claim'],
  });
  analyse(p, '004', rel, { 'EPIC-001': ['No change', 'its outcome stays'] });
  let got = held(p.read(rel), 'The recommendation');
  assert.ok(got.includes('| 4 | data-model-workflow | step 1, things-author | • New word: Draft claim |'), got.join('\n'));
  assert.ok(got.includes('| 5 | data-model-workflow | step 2, data-model-author | • Ask 1 |'), got.join('\n'));
  // With no things file, the project has no data model, and the two steps have nothing to do.
  fs.rmSync(p.file(THINGS));
  assert.strictEqual(run('recommend.cjs', p.args(['--change', '004'])).code, 0);
  got = held(p.read(rel), 'The recommendation');
  assert.ok(!stepRows(got).some((l) => l.includes('| data-model-workflow |')), got.join('\n'));
  assert.ok(got.includes('- data-model-workflow, step 1, things-author: the project has no data model yet'), got.join('\n'));
  assert.ok(got.includes('- data-model-workflow, step 2, data-model-author: the project has no data model yet'), got.join('\n'));
});

test('track-change: a renamed word gives a progress row to the things file and to each data model file that uses it', () => {
  const p = project();
  const rel = renameFinanceApprover(p);
  p.section(rel, 'Your decision', decision(1, ACCEPT_Q, 'Run the path'));
  const r = p.accept('change-impact-report', '--change', '007-finance-checker');
  assert.match(r.out, /- change 007: 3 of 3 documents still pending\./, r.out);
  assert.deepStrictEqual(progressRows(p, '007-finance-checker'), [
    ['glossary/deep-dives/gate-log.md', 'glossary-disposition', 'none', 'pending'],
    [THINGS, 'data-model-workflow, step 1, things-author', '1', 'pending'],
    [CLAIMS, 'data-model-workflow, step 2, data-model-author', '1', 'pending'],
  ]);
});

test('track-change: a new ask that lands on no thing waits for "a data model file", and any data model file accepted later counts for it', () => {
  const p = project();
  const rel = makeReport(p, '004-draft-claims', {
    title: 'Draft claims', statement: 'Claimants want to save a claim and finish it later.', restated: 'A claimant can save a draft claim and send it later.',
    lands: 'None | None | None | • EPIC-001', kind: 'Net new', test: '• Feature Fit: New capability. Draft claim is not in the Glossary', newItems: ['- New word: Draft claim'],
  });
  analyse(p, '004', rel, { 'EPIC-001': ['No change', 'its outcome stays'] });
  p.section(rel, 'Your decision', decision(1, ACCEPT_Q, 'Run the path'));
  assert.strictEqual(p.accept('change-impact-report', '--change', '004-draft-claims').code, 0);
  const row = (doc) => progressRows(p, '004-draft-claims').find((x) => x[0] === doc);
  assert.deepStrictEqual(row(THINGS), [THINGS, 'data-model-workflow, step 1, things-author', '1', 'pending']);
  assert.deepStrictEqual(row('a data model file'), ['a data model file', 'data-model-workflow, step 2, data-model-author', 'none', 'pending']);
  assert.strictEqual(p.accept('data-model', '--family', 'claims').code, 0);
  assert.deepStrictEqual(row('a data model file'), ['a data model file', 'data-model-workflow, step 2, data-model-author', 'none', `accepted: ${CLAIMS}, version 2`]);
  assert.strictEqual(row(THINGS)[3], 'pending');
});

test('track-change: an ask that adds to a thing waits for the data model file that holds the thing', () => {
  const p = project();
  const rel = makeReport(p, '008-claim-notes', {
    title: 'Claim notes', statement: 'A claimant can add a note to a claim.', restated: 'A claimant can add a note to a claim before sending it.',
    lands: '• REQ-2.1 | • F-01 | None | • EPIC-001', kind: 'Extend or enhance', test: '• Feature Fit: Extends F-01. Note is not in the Glossary<br>• F-01.1: new', newItems: ['- New word: Note'],
  });
  p.change(rel, '| 1 | • REQ-2.1 | • F-01 | None | • EPIC-001 | None |', '| 1 | • REQ-2.1 | • F-01 | None | • EPIC-001 | • Claim |');
  analyse(p, '008', rel, { Claim: ['No change', 'the note is a new field, written for Ask 1'] });
  assert.ok(stepRows(held(p.read(rel), 'The recommendation')).includes('| 4 | data-model-workflow | step 2, data-model-author | • Ask 1 |'));
  p.section(rel, 'Your decision', decision(1, ACCEPT_Q, 'Run the path'));
  assert.strictEqual(p.accept('change-impact-report', '--change', '008-claim-notes').code, 0);
  assert.deepStrictEqual(progressRows(p, '008-claim-notes').find((x) => x[1] === 'data-model-workflow, step 2, data-model-author'), [CLAIMS, 'data-model-workflow, step 2, data-model-author', '1', 'pending']);
});

test('track-change: a row that waits on the change gives a progress row to its data model file, before the FRD\'s', () => {
  const p = project();
  // A late answer: claims.md holds question 4's answer in use, marked Proposed, so its row waits on the change.
  const rel = answerQuestion4(p, 'Any currency, converted at the day\'s rate');
  p.section(rel, 'Your decision', [...held(p.read(rel), 'Your decision'), '', ...decision(2, ACCEPT_Q, 'Run the path')]);
  const r = p.accept('change-impact-report', '--change', '002-currencies');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(progressRows(p, '002-currencies'), [
    [CLAIMS, 'data-model-workflow, step 2, data-model-author', '1', 'pending'],
    [FRD, 'frd-workflow, step 2, frd-author', '1', 'pending'],
  ]);
});

test('size-rules: a drafted data model file is in progress and sized against, but never parked', () => {
  const p = project();
  p.write(CLAIMS, p.read(CLAIMS).replace(/^Status: .*$/m, 'Status: drafted'));
  run('size-rules.cjs', p.args(['--change', '001']));
  let s = held(p.read(C1), 'The tentative size');
  assert.strictEqual(s[0], '- **Size:** Small');
  assert.deepStrictEqual(s.slice(-3), ['- **Against:** 2 pieces in progress:', '  - the data model file claims.md', "  - EPIC-002 Claim approval's stories"]);
  // A large change is a hint only: nothing is parked, and claims.md stays drafted.
  p.change(C1, '| F-05 | Update | its description reads "each claim over 500" |', '| F-05 | Update | moves to EPIC-001, with the claims it checks |');
  run('size-rules.cjs', p.args(['--change', '001']));
  s = held(p.read(C1), 'The tentative size');
  assert.strictEqual(s[0], '- **Size:** Large');
  run('recommend.cjs', p.args(['--change', '001']));
  assert.ok(!held(p.read(C1), 'The recommendation').join('\n').includes('park'));
  assert.match(p.read(CLAIMS), /^Status: drafted$/m);
  assert.doesNotMatch(p.read(LIST), /^Status: parked/m);
});

test('size-rules: a drafted things file is in progress too', () => {
  const p = project();
  assert.strictEqual(p.accept('story-list', '--epic', 'EPIC-002-claim-approval').code, 0);
  p.write(THINGS, p.read(THINGS).replace(/^Status: .*$/m, 'Status: drafted'));
  run('size-rules.cjs', p.args(['--change', '001']));
  const s = held(p.read(C1), 'The tentative size');
  assert.strictEqual(s[0], '- **Size:** Small');
  assert.strictEqual(s[s.length - 1], '- **Against:** the things file');
});

test('size-rules: while only the data model is in progress, the rule says it holds no feature and no story', () => {
  const p = project();
  assert.strictEqual(p.accept('story-list', '--epic', 'EPIC-002-claim-approval').code, 0);
  // The things file alone, then claims.md alone, then both.
  const things = p.read(THINGS);
  const drafted = (rel) => p.write(rel, p.read(rel).replace(/^Status: .*$/m, 'Status: drafted'));
  const sized = () => { run('size-rules.cjs', p.args(['--change', '001'])); return held(p.read(C1), 'The tentative size'); };
  drafted(THINGS);
  assert.deepStrictEqual(sized(), [
    '- **Size:** Small',
    '- **The rule that decided it:** none of the large rules holds: the things file holds no feature and no story, and no two pieces need regrouping',
    '- **Against:** the things file',
  ]);
  p.write(THINGS, things);
  drafted(CLAIMS);
  assert.deepStrictEqual(sized().slice(0, 2), [
    '- **Size:** Small',
    '- **The rule that decided it:** none of the large rules holds: the data model file claims.md holds no feature and no story, and no two pieces need regrouping',
  ]);
  drafted(THINGS);
  assert.deepStrictEqual(sized().slice(0, 3), [
    '- **Size:** Small',
    '- **The rule that decided it:** none of the large rules holds: the data model holds no feature and no story, and no two pieces need regrouping',
    '- **Against:** 2 pieces in progress:',
  ]);
  // A piece that isn't the data model brings back the rule about features moving.
  drafted('frd/feature-catalog.md');
  assert.strictEqual(sized()[1], '- **The rule that decided it:** none of the large rules holds: no feature moves into or out of a piece in progress, no more than one story in progress is judged New story or Split, and no two pieces need regrouping');
});

test('insert-answer: an answer that confirms a data model cell\'s Proposed answer takes off its mark, and the data model file is accepted again', () => {
  const p = project();
  const rel = answerQuestion4(p, 'Euros only');
  const got = held(p.read(rel), 'The recommendation');
  assert.ok(got.includes('- glossary/data-models/claims.md, amount: "in euros, Proposed (needs confirmation), question 4" becomes "in euros"'), got.join('\n'));
  assert.strictEqual(got[got.length - 1], '**Recommended:** Insert it');
  p.section(rel, 'Your decision', [...held(p.read(rel), 'Your decision'), '', ...decision(2, ACCEPT_Q, 'Insert it')]);
  assert.strictEqual(p.accept('change-impact-report', '--change', '002-currencies').code, 0);
  const before = p.read(CLAIMS).split('\n');
  const r = run('insert-answer.cjs', p.args(['--change', '002', '--question', '4']));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /question 4's answer written in 4 places, in 4 documents\./);
  assert.match(r.out, /^- glossary\/data-models\/claims\.md: accepted again, as version 2\.$/m);
  assert.match(r.out, /No gap outside the records still names question 4\./);
  const after = p.read(CLAIMS).split('\n');
  assert.deepStrictEqual(after.filter((l, i) => l !== before[i]), [
    'Status: accepted on 2026-10-22, version 2',
    '| amount | number | yes, only when it is sent | in euros | – | only while Draft | – |',
  ]);
  const progress = p.read('changes/002-currencies/progress.md');
  assert.ok(progress.includes('| glossary/data-models/claims.md | amount | in euros, Proposed (needs confirmation), question 4 | in euros |'));
  assert.match(progress, /^Status: closed on 2026-10-22$/m);
});

test('insert-answer: in a data model file, anything but a confirmed Proposed answer is refused, and nothing is written', () => {
  const p = project();
  const rel = answerQuestion4(p, 'Euros only');
  p.section(rel, 'Your decision', [...held(p.read(rel), 'Your decision'), '', ...decision(2, ACCEPT_Q, 'Insert it')]);
  assert.strictEqual(p.accept('change-impact-report', '--change', '002-currencies').code, 0);
  // A gap that isn't a Proposed answer: only data-model-author fills it.
  p.change(CLAIMS, '| receipt | one Receipt | yes, only when its claim is sent | – |', '| receipt | one Receipt | yes, only when its claim is sent | TBD, question 4 |');
  const claims = p.read(CLAIMS);
  const brd = p.read('expense-claims-brd.md');
  let r = run('insert-answer.cjs', p.args(['--change', '002', '--question', '4']));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /^Nothing is written: 1 place would need other words changed, so the change needs the path for its kind, in section 15\.$/m);
  assert.match(r.out, /^- glossary\/data-models\/claims\.md, line \d+: a data model file holds only a Proposed answer, so "TBD" needs data-model-author$/m);
  assert.strictEqual(p.read(CLAIMS), claims);
  assert.strictEqual(p.read('expense-claims-brd.md'), brd);
  // An answer that doesn't confirm the answer in use would change the data model's answer.
  p.change(CLAIMS, '| TBD, question 4 |', '| – |');
  p.change('expense-claims-question-log.md', '| Answer | Euros only |', '| Answer | Any currency, converted at the day\'s rate |');
  run('grade-questions.cjs', p.args());
  const restored = p.read(CLAIMS);
  r = run('insert-answer.cjs', p.args(['--change', '002', '--question', '4']));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /^- glossary\/data-models\/claims\.md, line \d+: the answer, "Any currency, converted at the day's rate", doesn't confirm the answer in use, "Euros only", so the data model's answer would change$/m);
  assert.strictEqual(p.read(CLAIMS), restored);
});

// ---------------------------------------------------------------- the skills and the workflow

test('the change workflows: each one\'s steps are its master plan table, step for step', () => {
  for (const [n, name] of [[5, 'change-request-workflow'], [6, 'change-orchestration-workflow']]) {
    const plan = md.tableUnder(path.join(KIT, 'master-plan.md'), `Workflow ${n}: \`${name}\``);
    const skill = md.tableUnder(path.join(SKILLS, name, 'SKILL.md'), 'The steps');
    assert.ok(plan && plan.length, `${name}: the master plan has no table`);
    const rows = (t) => t.map(({ _heading, ...r }) => r);
    assert.deepStrictEqual(rows(skill), rows(plan), name);
  }
});

test('the change skills: each has its name, a description, its opening, and every file and program it points to exists', () => {
  for (const name of ['change-request-disposition', 'change-impact-author', 'adversarial-check', 'feature-impact', 'change-request-workflow', 'change-orchestration-workflow']) {
    const dir = path.join(SKILLS, name);
    const t = readText(path.join(dir, 'SKILL.md'));
    assert.match(t, new RegExp(`^---\\nname: ${name}\\n`), `${name}: the name line`);
    assert.match(t, /\ndescription: >-\n {2}\S/, `${name}: the description`);
    if (name !== 'feature-impact') for (const m of ['> **What this is:**', '> **What it is not:**', '> **Who uses it:**']) assert.ok(t.includes(m), `${name}: ${m}`);
    for (const ref of t.matchAll(/`((?:\.\.\/[a-z_-]+|references)\/[^`]+\.md)`/g)) assert.ok(fs.existsSync(path.join(dir, ref[1])), `${name}: ${ref[1]} doesn't exist`);
    for (const prog of t.matchAll(/`(?:node )?tools\/([a-z-]+\.cjs)/g)) assert.ok(fs.existsSync(path.join(TOOLS, prog[1])), `${name}: tools/${prog[1]} doesn't exist`);
    for (const skill of t.matchAll(/`([a-z]+(?:-[a-z]+)+)`/g)) if (!skill[1].endsWith('-workflow') || fs.existsSync(path.join(SKILLS, skill[1]))) continue; else assert.fail(`${name}: ${skill[1]} isn't a skill`);
    assert.deepStrictEqual(lint(t.replace(/^---\n[\s\S]*?\n---\n/, '')), [], `${name}: renders`);
  }
  for (const ref of ['update-test.md', 'feature-fit.md']) assert.deepStrictEqual(lint(readText(path.join(SKILLS, 'change-request-disposition', 'references', ref))), [], ref);
});

// Lines taken out of the original and put in the copy, counted, each put-in line matching what its spec names.
function edits(original, copy) {
  const a = original.split('\n');
  const b = copy.split('\n');
  const A = new Set(a);
  const B = new Set(b);
  return { out: a.filter((l) => !B.has(l)), put: b.filter((l) => !A.has(l)) };
}

test('adversarial-check: the approved prompt, word for word, with only the edits its spec names', () => {
  const approved = mc.copy(readText(path.join(KIT, 'fixtures', 'approved-glossary-method', 'glossary-methodology-prompts', 'adversarial-check.md')));
  const skill = readText(path.join(SKILLS, 'adversarial-check', 'SKILL.md')).replace(/^---\n[\s\S]*?\n---\n\n/, '');
  const e = edits(approved, skill);
  // Out: the title, the output-folder convention, the analysis as input, where the findings go, and the line that opens
  // the output. Then 10 lines put in simple words, as simple-writing-rules.md says: a semicolon becomes two sentences,
  // a side note in brackets becomes its own sentence, and "prerequisite" and "there" are said plainly.
  // Then the change workflows: section 6 is no longer read, and the findings' Quote, From, Would change and Who can
  // fix, with the fixed rule for the verdict, take the place of Evidence and the FAIL line.
  assert.strictEqual(e.out.length, 17, e.out.join('\n'));
  // In: the title and the opening, then the report as input, the FRDs, the update-test check, section 11, and the line
  // that opens the output, which now points to the simple writing rules. Then the same 10 lines in simple words, with
  // the checks' heading split into a heading and a sentence, and the quick check on section 11.
  assert.strictEqual(e.put.length, 31, e.put.join('\n'));
  for (const l of e.put) assert.match(l, /adversarial-check|^>$|What this is|What it is not|Who uses it|section 11|sections 5 to 10|FRDs?|update test|Update-test check|FAIL is the verdict|simple-writing-rules\.md|It only reports where the analysis is wrong\.|are in pills\. Glossary pages|only as that file defines it|line of business\. It is|^## Step 1: what must exist, and where the findings go$|^- read access to the same glossary: |^## The checks$|^These are the only checks it makes\.$|warrant a harder one\? For example,|row counts\. The diagrams'|PASS means nothing survived|check-simple-writing\.cjs|sections 5 and 7 to 10|^\| Quote \||^\| From \||^\| Would change \||^\| Who can fix \||^The verdict follows a fixed rule/, l);
});

test('feature-impact: the old change-impact skill, with only its name, its paths and its place in change-request-workflow changed, and its wording simplified', () => {
  const old = readText(path.join(KIT, 'fixtures', 'old-change-impact-skill', 'SKILL.md'));
  const skill = readText(path.join(SKILLS, 'feature-impact', 'SKILL.md'));
  const e = edits(old, skill);
  // Out: the old name, the blast-radius workflow, the old system prompt and its rule numbers, the audit trail, the
  // verdict shown as markdown in a code block, and the standalone file with its save-early note. Then the tools line,
  // which now names Bash, so the skill can run the quick check. Then 20 lines put in simple words, as
  // simple-writing-rules.md says: a semicolon or a side note after a dash becomes its own sentence, a side note in
  // brackets becomes its own sentence, and "downstream", "artifact" and "e.g." are said plainly.
  assert.strictEqual(e.out.length, 48, e.out.join('\n'));
  // In: the new name, change-impact-author and section 13, the conventions' rule names, the Version log, and the
  // verdict as a real example with a table of what each line holds. Then the tools line with Bash, and the quick check
  // on a file the skill writes, as simple-writing-rules.md says. Then a data model row: one line says it can be judged,
  // and one says its two calls, No change or Update. Then the same 20 lines in simple words, with "artifact" said as
  // "item" and "downstream" as "later". The lines put in before are in simple words too, line for line, so their
  // count stays.
  assert.strictEqual(e.put.length, 59, e.put.join('\n'));
  for (const l of e.put) assert.match(l, /feature-impact|Feature impact|change-request-workflow|decision is your one yes|linked item|conventions\.md|decision-review-gates|Version log|Nothing invented|Cite every specific|section 13|Change impact report|moves to|feature to another|not asked|decision is at|Standalone, show|one question well|Expense claims|^> |^\||^allowed-tools: Read, Write, Edit, Glob, Grep, Bash$|check-simple-writing\.cjs|^- \*\*A data model row\*\* can be judged too\.|^ {3}- \*\*A data model row\*\* gets No change or Update only\.|one item made later from that requirement|affected\. Classify how badly|or a new story\. An update gives the|exact edits\. Use whenever|impact assessment\. For example,|still hold\?", or "what's the impact|^Take one requirement change and one item that might depend on it|\. It comes from the item's$|^- \*\*The item\*\* — the story, AC, EPIC, or feature|connected\. Name the ID the item traces to\.|the item's text, say so and ask\. Do$|Does this item really depend|what this item relies on|update only\. The behaviour is unchanged\.|was removed\. The item no longer holds\.|the item stays\. List the \*\*specific edits\*\*: |existing one\. Give a one-line rationale\.|Do this item's \*own\* later items now need re-checking\? They are its dependent stories and AC\.|→ \*update\*\. A$|proposal\. \*\*Applying it stays gated\.\*\* End with/, l);
  for (const k of ['| **Recommendation:** | No change / Update / New story / Split |', 'HUMAN ACTION REQUIRED: Decide update / new / no-change for this item.', '## Method', '## Verdict (output)']) assert.ok(skill.includes(k), k);
});

test('change-request-disposition: its Feature Fit reference is sections 5 to 8 and 10 of the method, word for word', () => {
  const method = readText(path.join(SKILLS, '_shared', 'glossary', 'prompts', 'feature-journey-analysis.md')).split('\n');
  const ref = readText(path.join(SKILLS, 'change-request-disposition', 'references', 'feature-fit.md'));
  for (const n of [5, 6, 7, 8, 10]) {
    const start = method.findIndex((l) => l.startsWith(`## ${n}. `));
    const end = method.findIndex((l, i) => i > start && /^## /.test(l));
    const part = method.slice(start, end).join('\n').trim();
    assert.ok(ref.includes(part), `section ${n} isn't copied word for word`);
  }
  for (const n of [9, 11]) assert.ok(!method.some((l) => l.startsWith(`## ${n}. `) && ref.includes(l)), `section ${n} is copied`);
});

// ---------------------------------------------------------------- report

let failed = 0;
for (const r of results) {
  if (r.ok) process.stdout.write(`pass  ${r.name}\n`);
  else {
    failed++;
    process.stdout.write(`FAIL  ${r.name}\n      ${String(r.error && r.error.message).split('\n').join('\n      ')}\n`);
  }
}
process.stdout.write(`\n${results.length - failed} of ${results.length} passed.\n`);
process.exit(failed ? 1 : 0);
