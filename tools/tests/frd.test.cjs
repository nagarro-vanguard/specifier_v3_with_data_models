#!/usr/bin/env node
'use strict';
// Tests for the FRD: its programs and its skills.
//
//   node tools/tests/frd.test.cjs
//
// Every test works on a copy in a temporary folder. Nothing in fixtures/ or Output/ is changed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const KIT = path.resolve(__dirname, '..', '..');
const TOOLS = path.join(KIT, 'tools');
const EXAMPLES = path.join(KIT, '.claude', 'skills', '_shared', 'examples');
const FIXTURE = path.join(KIT, 'fixtures', 'expense-claims');
const { lint } = require('../lib/md-lint.cjs');

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

function expenseClaims() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'specifier-frd-'));
  const dir = path.join(out, 'expense-claims');
  fs.mkdirSync(dir, { recursive: true });
  for (const d of ['discovery-brief', 'brd', 'prd', 'question-log']) fs.copyFileSync(path.join(EXAMPLES, `${d}.md`), path.join(dir, `expense-claims-${d}.md`));
  copyDir(FIXTURE, dir);
  const read = (rel) => readText(path.join(dir, rel));
  const write = (rel, t) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), t); };
  const change = (rel, from, to) => {
    const t = read(rel);
    const at = t.split(from).length - 1;
    assert.strictEqual(at, 1, `"${from}" is in ${rel} ${at} times, not once`);
    write(rel, t.replace(from, to));
  };
  return { out, dir, read, write, change };
}

const FRD = 'frd/frd-claim-approval.md';
const CATALOG = 'frd/feature-catalog.md';
const checkFrd = (out) => run('check-frd.cjs', ['--project', 'expense-claims', '--frd', 'frd-claim-approval.md', '--output', out, '--date', '2026-10-22']);
const route = (out) => run('route-next-capability.cjs', ['--project', 'expense-claims', '--output', out]);

// ---------------------------------------------------------------- check-frd

test('check-frd: the Claim approval FRD passes every check, and the gate sees what it holds and its suggested rule', () => {
  const { out } = expenseClaims();
  const r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 46 checks\.$/m);
  assert.match(r.out, /^- 12 rules: 7 from the pieces, 4 from the data model, 0 from the requirements, 1 suggested, 0 decided$/m);
  assert.match(r.out, /^- 0 notes where a decision at this gate changed a data model answer$/m);
  assert.match(r.out, /^- Rules: F-04\.8: proposed — Why:/m);
  assert.match(r.out, /^Not checked by the program, for the specifier to read:$/m);
  assert.ok(!/can't be accepted yet/.test(r.out));
});

const FRD_FAILURES = [
  ['a piece that doesn\'t match the catalog', '| F-04.dw2 | can approve it | F-04.2 |', '| F-04.dw2 | can approve the claim | F-04.2 |', /the catalog's piece F-04\.dw2 isn't in Coverage as the catalog has it/],
  ['a rule with no allowed source', '| **only** send a claim to a finance approver when it is over 500 | data model — Claim, Approve over the limit |', '| **only** send a claim to a finance approver when it is over 500 | from the requirement |', /Every rule cites exactly one allowed source: F-05\.4: "from the requirement"/],
  ['a piece no rule proves', '| let a line manager approve a claim waiting for them | F-04.dw2 — can approve it |', '| let a line manager approve a claim waiting for them | req — from the requirement |', /F-04\.dw2 has no rule/],
  ['a "how" word in a rule', 'show each line manager every claim waiting for their approval', 'show each line manager a page of every claim waiting for their approval', /F-04\.1 contains "page"/],
  ['a Gate In condition not copied word for word', '| **In** (true before start) | A sent claim holds every expense line, and its stage is Submitted |', '| **In** (true before start) | A sent claim holds every expense line, and its stage is Sent |', /Gate conditions copied from the catalog match it word for word: In at character/],
  ['a rule the flow leaves out', '- *Alternate:* The claimant sees the reason their claim was rejected *(F-04.8)*\n', '', /F-04\.8 is not in the flow/],
  ['a standard question answered in a form that isn\'t allowed', '| PRD, REQ-3.1 -> F-04.2 and F-04.3 |', '| the line manager |', /"the line manager" is not one of the allowed answer forms/],
  ['a question that isn\'t in the Question log', '| PRD, REQ-3.1 -> F-04.2 and F-04.3 |', '| question 42 |', /question 42 isn't in the Question log/],
  ['a missing status line', 'Status: drafted\n', '', /The document has no status line\./],
  ['a suggested rule left once the FRD is accepted', 'Status: drafted', 'Status: accepted on 2026-10-14, version 1', /suggested rules still waiting for a decision: F-04\.8/],
  ['a retired Glossary word in a rule', 'show each line manager every claim waiting for their approval', 'show each line manager every expense report waiting for their approval', /Glossary words: Line \d+: "expense report" is a retired word; use Claim\./],
];

for (const [what, from, to, finding] of FRD_FAILURES) {
  test(`check-frd: finds ${what}`, () => {
    const { out, change } = expenseClaims();
    change(FRD, from, to);
    const r = checkFrd(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-frd: a Gates "Tied to" feature whose catalog name holds a comma matches it, and a shortened name is a finding', () => {
  const { out, read, write, change } = expenseClaims();
  change(CATALOG, '| F-01 | Send a claim |', '| F-01 | Send, check and file a claim |');
  write(FRD, read(FRD).replaceAll('F-01 Send a claim', 'F-01 Send, check and file a claim'));
  const r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  change(FRD, 'Submitted | F-01 Send, check and file a claim |', 'Submitted | F-01 Send |');
  assert.match(checkFrd(out).out, /In: F-01 is named "Send", the catalog says "Send, check and file a claim"/);
});

test('check-frd: finds a feature the catalog gives this capability, but the FRD leaves out', () => {
  const { out, change } = expenseClaims();
  change(CATALOG, '| • F-01 | FRD-2a Making a claim | None |\n| F-03 |', '| • F-01 | FRD-3a Claim approval | None |\n| F-03 |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /the catalog gives "FRD-3a Claim approval" F-02, F-04, F-05; the FRD covers F-04, F-05/);
});

test('check-frd: a decision asked anywhere but the FRD\'s gate is a finding', () => {
  const { out, change } = expenseClaims();
  change(FRD, '- **Last changed:** None yet.', '- **Last changed:** 2026-10-14, Decision 1');
  change(FRD, '## Decision record\n\nNone yet.',
    '## Decision record\n\n### Decision 1 — Can a rejected claim be sent again?\n- **Question:** None\n- **Asked at:** Step 2\n- **Options offered:**\n  - **Keep the rule** — Why: the claimant keeps their receipts. What happens next: F-04.6 is kept.\n  - **Drop the rule** — Why: a rejected claim is final. What happens next: F-04.6 is dropped.\n  - **I don\'t know yet** — What happens next: the rule stays suggested.\n- **Recommended:** Keep the rule\n- **Chosen:** Keep the rule\n- **Decided by:** PO, 2026-10-14');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Decision 1: "Asked at" must be "Accept the FRD\?"/);
});

test('check-frd: the FRD guard says the FRD can\'t be accepted while a Must answer question it builds on is open, and it is not a finding', () => {
  const { out, change } = expenseClaims();
  change(FRD, '| Claim | Can it be removed? | claims.md, Claim Remove -> F-01 Send a claim |', '| Claim | Can it be removed? | question 4 |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /This FRD can't be accepted yet: it builds on 1 Must answer question still open\. Answer it first, or park the FRD with park\.cjs while other work carries on:\n- question 4: Which currencies can a claim be made in\?/);
});

test('check-frd: a file that isn\'t an FRD, or an FRD that isn\'t there, exits with code 2', () => {
  const { out } = expenseClaims();
  assert.strictEqual(run('check-frd.cjs', ['--project', 'expense-claims', '--frd', 'epics/register.md', '--output', out]).code, 2);
  assert.strictEqual(run('check-frd.cjs', ['--project', 'expense-claims', '--frd', 'frd-making-a-claim.md', '--output', out]).code, 2);
});

// ---------------------------------------------------------------- check-frd: the data model

const DM = 'glossary/data-models/claims.md';
const THINGS = 'glossary/data-models/expense-claims-glossary-things.md';
const DECISIONS = 'glossary/data-models/expense-claims-data-model-decisions.md';
const PRD = 'expense-claims-prd.md';
const FINANCE_COVERAGE = '| Claim | Approve over the limit | F-05.4 |';
const FINANCE_ACTION = '| Approve over the limit | Approve | Finance approver |';
// F-05.4 is the one rule from Approve over the limit. These take it out of the FRD: its row, its line in "From the
// data model", and the flow step that cites it, which then cites F-05.1.
const NO_F05_4 = [
  [FRD, '| F-05.4 | **only** send a claim to a finance approver when it is over 500 | data model — Claim, Approve over the limit |', ''],
  [FRD, '- F-05.4', ''],
  [FRD, '5. A claim of 500 or less never goes to a finance approver *(F-05.4)*', '5. A claim of 500 or less never goes to a finance approver *(F-05.1)*'],
];

// Each one plants one failure, through one or more changes, each [file, from, to]. A swap goes through a stand-in, so
// every from is found exactly once.
const DATA_MODEL_FAILURES = [
  ['a rule whose data model source names a row the data model hasn\'t got', [[FRD, '| data model — Claim, Approve |', '| data model — Claim, Accept |']], /Every data model rule is in the coverage table, and names a thing and an action, field or move of a row it proves: F-04\.6 names "Claim, Accept", which isn't an action, field or move in the data model files, word for word/],
  ['a data model rule that proves an answer another feature owns', [[FRD, 'when it is over 500 | data model — Claim, Approve over the limit |', 'when it is over 500 | data model — Claim, Reject |']], /F-05\.4 proves Claim, Reject, which belongs to F-04 Manager approval, not F-05/],
  ['a data model rule whose answer has no row in the coverage table', [[FRD, '| Claim | Reject | F-04.7 |', '| Claim | Remove | F-04.7 |']], /F-04\.7 proves Claim, Reject, which has no row in the data model coverage table/],
  ['a row of the data model the coverage table leaves out',[[FRD, '| Claim | Reject | F-04.7 |', '| Claim | Remove | F-04.7 |']], /Data model coverage lists exactly the actions, fields and moves the covered features own, named as the data model names them: Claim, Reject: this action belongs to F-04 Manager approval, but the table has no row for it/],
  ['a coverage row for an answer another FRD\'s feature owns', [[FRD, FINANCE_COVERAGE, `${FINANCE_COVERAGE}\n| Claim | Remove | – |`]], /Claim, Remove belongs to F-01 Send a claim, which this FRD doesn't cover/],
  ['a coverage row that isn\'t in the data model', [[FRD, '| Claim | Reject | F-04.7 |', '| Claim | Rejects | F-04.7 |']], /Claim, Rejects isn't an action, field or move in the data model files, word for word/],
  ['two coverage rows for one answer', [[FRD, FINANCE_COVERAGE, `${FINANCE_COVERAGE}\n${FINANCE_COVERAGE}`]], /Claim, Approve over the limit has 2 rows\. It needs exactly one\./],
  ['coverage rows out of the data model files\' order', [
    [FRD, '| Claim | Browse | F-04.5 |', 'STAND-IN'],
    [FRD, '| Claim | Approve | F-04.6 |', '| Claim | Browse | F-04.5 |'],
    [FRD, 'STAND-IN', '| Claim | Approve | F-04.6 |'],
  ], /the rows aren't in the data model files' order: "Claim, Approve" comes where "Claim, Browse" should/],
  ['a data model row with no rule', [...NO_F05_4, [FRD, FINANCE_COVERAGE, '| Claim | Approve over the limit | – |']], /Every data model row has a rule, or waits on its open decision: Claim, Approve over the limit has no rule$/m],
  ['a data model row whose Proved by names a rule from another source', [[FRD, '| Claim | Reject | F-04.7 |', '| Claim | Reject | F-04.3 |']], /Claim, Reject: Proved by says F-04\.3, the rules say F-04\.7/],
  ['a rule from an answer still to be confirmed that drops its mark', [[DM, '| Approve | Approve | Line manager | Only while the claim is **Submitted**. Only the claimant\'s own line manager approves it. |', '| Approve | Approve | Line manager | Only while the claim is **Submitted**. Only the claimant\'s own line manager approves it. A reminder goes after 3 working days, Proposed (needs confirmation), question 8. |']], /Claim, Approve: its row in claims\.md holds "A reminder goes after 3 working days, Proposed \(needs confirmation\), question 8"\. The rule from it keeps "Proposed \(needs confirmation\), question 8"\./],
  ['a "From the data model" list that isn\'t exactly the data model rules', [[FRD, '- F-04.7', '- F-04.8']], /"From the data model" lists exactly the data model rules: the list: F-04\.5, F-04\.6, F-04\.8, F-05\.4; data model rules: F-04\.5, F-04\.6, F-04\.7, F-05\.4/],
  ['a rules table in Data that isn\'t copied word for word, with no note that names a decision', [[FRD, '| expense lines | several Expense lines | yes, only when it is sent | 1 or more |', '| expense lines | several Expense lines | yes, only when it is sent | 2 or more |']], /Data copies each thing's rules table word for word, under a link to its file, except a cell a decision changed: Claim: the rules table from claims\.md isn't copied word for word\. At its line 3, in the row for expense lines, "Limits" reads "2 or more", and the data model says "1 or more"\. A cell that a decision at this gate changed ends with a note that names the decision/],
  ['a rules table in Data with a line left out', [[FRD, '| amount | number | yes, only when it is sent | in euros, Proposed (needs confirmation), question 4 | – | only while Draft | – |', '']], /Claim: the rules table from claims\.md isn't copied word for word\. At its line 5,/],
  ['a "From" line in Data that doesn\'t link to its data model file', [[FRD, 'From [claims.md](../glossary/data-models/claims.md).', 'From [claims.md](claims.md).']], /Claim: the line reads "From \[claims\.md\]\(claims\.md\)\.", and should read "From \[claims\.md\]\(\.\.\/glossary\/data-models\/claims\.md\)\."/],
  ['a note on the basis of a DM-n the decisions file hasn\'t got', [[FRD, '| data model — Claim, Reject |', '| data model — Claim, Reject<br>*Updated from the requirement on the basis of DM-12: only the claimant\'s own line manager rejects a claim.* |']], /Every data model decision or Glossary change it names is in the data model's decisions file: DM-12 is named, but the data model's decisions file, expense-claims-data-model-decisions\.md, has no DM-12/],
  ['a coverage row that waits on a DM-n the decisions file hasn\'t got', [...NO_F05_4, [FRD, FINANCE_COVERAGE, '| Claim | Approve over the limit | waits on DM-12 |'], [DM, FINANCE_ACTION, '| Approve over the limit | Approve | ? (DM-12) |']], /DM-12 is named, but the data model's decisions file, expense-claims-data-model-decisions\.md, has no DM-12/],
  ['a standard question that waits on a decision no cell of its row reads', [[FRD, '| Claim | Who can do each of these? | PRD, REQ-3.1 -> F-04.2 and F-04.3 |', '| Claim | Who can do each of these? | claims.md, Claim Approve over the limit -> waits on DM-6 |']], /Claim, "Who can do each of these\?": no cell of Claim, Approve over the limit in claims\.md reads "\? \(DM-6\)"/],
];

for (const [what, changes, finding] of DATA_MODEL_FAILURES) {
  test(`check-frd: finds ${what}`, () => {
    const { out, change } = expenseClaims();
    for (const [rel, from, to] of changes) change(rel, from, to);
    const r = checkFrd(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-frd: an action or a field whose row in the catalog\'s section 5 still shows "?" has no feature yet, and the finding says so', () => {
  const { out, change } = expenseClaims();
  // Remove on a Claim shows "?". So does Make, the Claim's first action, which every field of a Claim belongs with.
  change(CATALOG, '| claims.md | Claim | Make | F-01 |', '| claims.md | Claim | Make | ? |');
  change(CATALOG, '| claims.md | Claim | Remove | F-01 |', '| claims.md | Claim | Remove | ? |');
  change(FRD, FINANCE_COVERAGE, `${FINANCE_COVERAGE}\n| Claim | Remove | – |\n| Claim | amount | – |`);
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /named as the data model names them: Claim, Remove has no feature yet\. Its row in section 5 of the Feature catalog still shows "\?"\. So this FRD can't list it yet\.$/m);
  assert.match(r.out, /named as the data model names them: Claim, amount has no feature yet\. A field belongs to the feature of its thing's first action, Make\. That action's row in section 5 of the Feature catalog still shows "\?"\. So this FRD can't list it yet\.$/m);
  assert.match(r.out, /Claim, "Can it be removed\?": Claim, Remove has no feature yet\. Its row in section 5 of the Feature catalog still shows "\?"\. So the answer can't name a feature yet\.$/m);
  assert.doesNotMatch(r.out, /belongs to \?/);
});

test('check-frd: an action whose row in the catalog\'s section 5 waits on a change has no feature yet, and the finding says so', () => {
  const { out, change } = expenseClaims();
  // Approve over the limit waits on change 001. So F-05, which this FRD covers, doesn't own it yet.
  change(CATALOG, '| claims.md | Claim | Approve over the limit | F-05 |', '| claims.md | Claim | Approve over the limit | waits on change 001 |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /named as the data model names them: Claim, Approve over the limit has no feature yet\. Its row in section 5 of the Feature catalog waits on change 001\. So this FRD can't list it yet\.$/m);
  assert.match(r.out, /F-05\.4 proves Claim, Approve over the limit, which has no feature yet\. Its row in section 5 of the Feature catalog waits on change 001\. So no rule can prove it yet\.$/m);
  assert.doesNotMatch(r.out, /belongs to waits on change/);
});

test('check-frd: a rule from an answer still to be confirmed passes once it keeps the mark and its question', () => {
  const { out, change } = expenseClaims();
  change(DM, 'Only the claimant\'s own line manager approves it. |', 'Only the claimant\'s own line manager approves it. A reminder goes after 3 working days, Proposed (needs confirmation), question 8. |');
  change(FRD, '| send each claim to the claimant\'s own line manager |', '| send each claim to the claimant\'s own line manager, with a reminder after 3 working days, Proposed (needs confirmation), question 8 |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
});

test('check-frd: a note on the basis of a DM-n in the data model\'s decisions file passes', () => {
  const { out, change } = expenseClaims();
  change(FRD, '| data model — Claim, Reject |', '| data model — Claim, Reject<br>*Updated from the requirement on the basis of DM-5: only the claimant\'s own line manager rejects a claim.* |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
});

// ---------------------------------------------------------------- check-frd: a decision that changes a data model answer

// At the FRD's gate, Decision 1 changes how many expense lines a claim holds, a cell of Data. Decision 2 changes the
// finance limit, in a data model rule. The FRD says the new answers, each with a note. The data model is not changed.
const decisionEntry = (n, question, from, to) => [
  `### Decision ${n} — ${question}`,
  '- **Question:** None',
  '- **Asked at:** Accept the FRD?',
  '- **Options offered:**',
  `  - **${from}** — Why: the data model says so. What happens next: the FRD keeps the data model's answer.`,
  `  - **${to}** — Why: the finance team asks for it. What happens next: the FRD says ${to}, with a note.`,
  '  - **I don\'t know yet** — What happens next: the FRD keeps the data model\'s answer for now.',
  `- **Recommended:** ${to}`,
  `- **Chosen:** ${to}`,
  '- **Decided by:** PO, 2026-10-14',
].join('\n');
function withDecisions({ change, read, write }) {
  change(FRD, '- **Last changed:** None yet.', '- **Last changed:** 2026-10-14, Decision 2');
  const record = ['## Decision record', decisionEntry(1, 'How many expense lines must a claim hold?', '1 or more', '2 or more'), decisionEntry(2, 'Which claims go to a finance approver?', 'Over 500', 'Over 1,000')].join('\n\n');
  write(FRD, read(FRD).replace(/## Decision record\s+None yet\./, record));
}
const LINES_ROW = '| expense lines | several Expense lines | yes, only when it is sent | 1 or more |';
const linesRow = (cell) => `| expense lines | several Expense lines | yes, only when it is sent | ${cell} |`;
const F05_4 = '| **only** send a claim to a finance approver when it is over 500 | data model — Claim, Approve over the limit |';
const f05_4 = (note) => `| **only** send a claim to a finance approver when it is over 1,000 | data model — Claim, Approve over the limit<br>${note} |`;

test('check-frd: a difference from the data model passes where a note names a decision in the Decision record, and the data model stays as it is', () => {
  const ec = expenseClaims();
  withDecisions(ec);
  ec.change(FRD, LINES_ROW, linesRow('2 or more<br>*Updated from the data model on the basis of Decision 1: 2 or more expense lines, not 1.*'));
  ec.change(FRD, F05_4, f05_4('*Updated from the data model on the basis of Decision 2: over 1,000, not 500.*'));
  const r = checkFrd(ec.out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 2 notes where a decision at this gate changed a data model answer$/m);
  assert.ok(ec.read(DM).includes(LINES_ROW), 'the data model still says 1 or more');
});

test('check-frd: each note "Updated from the data model" is listed where the FRD goes beyond the client\'s words', () => {
  const ec = expenseClaims();
  withDecisions(ec);
  ec.change(FRD, LINES_ROW, linesRow('2 or more<br>*Updated from the data model on the basis of Decision 1: 2 or more expense lines, not 1.*'));
  ec.change(FRD, F05_4, f05_4('*Updated from the data model on the basis of Decision 2: over 1,000, not 500.*'));
  const r = checkFrd(ec.out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  const block = r.out.slice(r.out.indexOf('Where it goes beyond the client\'s words:'), r.out.indexOf('open questions'));
  assert.match(block, /^- Rules: F-05\.4: .*\*Updated from the data model on the basis of Decision 2: over 1,000, not 500\.\*$/m);
  assert.match(block, /^- Data: expense lines: 2 or more \*Updated from the data model on the basis of Decision 1: 2 or more expense lines, not 1\.\*$/m);
});

test('check-frd: a difference from the data model in Data with no note is a finding, even when a decision in the record explains it', () => {
  const ec = expenseClaims();
  withDecisions(ec);
  ec.change(FRD, LINES_ROW, linesRow('2 or more'));
  const r = checkFrd(ec.out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Claim: the rules table from claims\.md isn't copied word for word\. At its line 3, in the row for expense lines, "Limits" reads "2 or more", and the data model says "1 or more"\./);
});

test('check-frd: a note that names a decision the Decision record hasn\'t got is a finding, in Data and in a data model rule', () => {
  const ec = expenseClaims();
  withDecisions(ec);
  ec.change(FRD, LINES_ROW, linesRow('2 or more<br>*Updated from the data model on the basis of Decision 3: 2 or more expense lines, not 1.*'));
  ec.change(FRD, F05_4, f05_4('*Updated from the data model on the basis of Decision 4: over 1,000, not 500.*'));
  const r = checkFrd(ec.out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /A difference from the data model has a note that names a decision in the Decision record: F-05\.4: its note names Decision 4, which isn't in the Decision record$/m);
  assert.match(r.out, /A difference from the data model has a note that names a decision in the Decision record: Claim, in Data: in the row for expense lines, the note in "Limits" names Decision 3, which isn't in the Decision record$/m);
});

const DIFFERENCE_FAILURES = [
  ['a note in Data on a cell that says what the data model says', [[FRD, LINES_ROW, linesRow('1 or more<br>*Updated from the data model on the basis of Decision 1: 2 or more expense lines, not 1.*')]], /Claim: at line 3 of the rules table from claims\.md, in the row for expense lines, "Limits" has a note, but its answer is the data model's\. A note goes only where a decision changed the answer\./],
  ['a note "Updated from the data model" on a rule that isn\'t a data model rule', [[FRD, '| let a line manager approve a claim waiting for them | F-04.dw2 — can approve it |', '| let a line manager approve a claim waiting for them | F-04.dw2 — can approve it<br>*Updated from the data model on the basis of Decision 1: 2 or more expense lines, not 1.* |']], /F-04\.2: only a data model rule has a note "Updated from the data model"\. Its source is "F-04\.dw2 — can approve it"\./],
  ['a note "Updated from the data model" that names a DM-n', [[FRD, F05_4, f05_4('*Updated from the data model on the basis of DM-5: over 1,000, not 500.*')]], /F-05\.4: its note names DM-5, a data model decision, which the data model already follows\./],
];

for (const [what, changes, finding] of DIFFERENCE_FAILURES) {
  test(`check-frd: finds ${what}`, () => {
    const ec = expenseClaims();
    withDecisions(ec);
    for (const [rel, from, to] of changes) ec.change(rel, from, to);
    const r = checkFrd(ec.out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

// An entry for each kind of ID a coverage row may wait on, written into the data model's decisions file.
const WAIT_ENTRIES = {
  'DM-10': ['## Open', '## Open\n\n### DM-10 — Who approves a claim over the limit?\n\n- **Where:** claims.md · Claim · Approve over the limit · Who\n- **Why I\'m asking:** The PRD says the finance team approves a claim over 500. It doesn\'t say who in the finance team.\n- **Options:**\n  - **A finance approver.** Why you\'d pick it: the Glossary has the role. What happens next: a finance approver approves a claim over the limit.\n  - **I don\'t know yet.** What happens next: the recommended answer is used, marked Proposed, and this decision stays open.\n- **Recommended:** A finance approver, because the Glossary has the role\n- **How it is asked:** at the gate\n- **Chosen:** open'],
  'GC-1': ['## Glossary changes', '## Glossary changes\n\n### GC-1 — Finance approver\n\n- **The Glossary says:** what it is, in one plain sentence\n- **What is needed:** a definition that says who in the finance team approves\n- **Proposed:** a member of the finance team who approves each claim over the limit\n- **Raised from:** claims.md · Claim · Approve over the limit · Who\n- **Status:** to raise'],
};

for (const [id, [heading, entry]] of Object.entries(WAIT_ENTRIES)) {
  test(`check-frd: a data model row with no rule may wait on ${id.replace(/\d+$/, 'n')}, but only while a cell of its row reads "? (${id.replace(/\d+$/, 'n')})"`, () => {
    const { out, change } = expenseClaims();
    for (const [rel, from, to] of NO_F05_4) change(rel, from, to);
    change(DECISIONS, heading, entry);
    change(FRD, FINANCE_COVERAGE, `| Claim | Approve over the limit | waits on ${id} |`);
    let r = checkFrd(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, new RegExp(`Claim, Approve over the limit: Proved by waits on ${id}, but no cell of its row in claims\\.md reads "\\? \\(${id}\\)"`));
    change(DM, FINANCE_ACTION, `| Approve over the limit | Approve | ? (${id}) |`);
    r = checkFrd(out);
    assert.strictEqual(r.code, 0, r.out + r.err);
    assert.match(r.out, /^- 4 data model answers its features own, 1 of them waiting on an open decision or Glossary change$/m);
  });
}

test('check-frd: a data model row can\'t wait on an RC-n, because the data model raises no changes to the requirements', () => {
  const { out, change } = expenseClaims();
  for (const [rel, from, to] of NO_F05_4) change(rel, from, to);
  change(DM, FINANCE_ACTION, '| Approve over the limit | Approve | ? (RC-1) |');
  change(FRD, FINANCE_COVERAGE, '| Claim | Approve over the limit | waits on RC-1 |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Every data model row has a rule, or waits on its open decision: Claim, Approve over the limit has no rule$/m);
  assert.match(r.out, /Only the allowed ID prefixes appear: unexpected prefixes: RC$/m);
});

test('check-frd: a data model row with no rule, whose row waits on a decision, is told to wait on it', () => {
  const { out, change } = expenseClaims();
  for (const [rel, from, to] of NO_F05_4) change(rel, from, to);
  change(DM, FINANCE_ACTION, '| Approve over the limit | Approve | ? (DM-6) |');
  change(FRD, FINANCE_COVERAGE, '| Claim | Approve over the limit | – |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Claim, Approve over the limit has no rule\. Its row in claims\.md waits on DM-6, so Proved by reads "waits on" and that ID\./);
});

test('check-frd: a data model rule numbered before a rule from a piece is a finding', () => {
  const { out, change } = expenseClaims();
  change(FRD, '| F-04.4 | **not** accept a rejection that gives no reason | F-04.dw3 — reject it with a reason |', '| F-04.4 | **only** show each person their own claims, or the claims waiting for them | data model — Claim, Browse |');
  change(FRD, '| F-04.5 | **only** show each person their own claims, or the claims waiting for them | data model — Claim, Browse |', '| F-04.5 | **not** accept a rejection that gives no reason | F-04.dw3 — reject it with a reason |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Rules are numbered in source order until the FRD is first accepted: F-04\.5 \(dw3\) comes after F-04\.4 \(data model, Claim, Browse\)/);
});

test('check-frd: data model rules numbered out of the coverage table\'s order are a finding', () => {
  const { out, change } = expenseClaims();
  change(FRD, '| F-04.6 | send each claim to the claimant\'s own line manager | data model — Claim, Approve |', '| F-04.6 | **only** let the claimant\'s own line manager reject a claim | data model — Claim, Reject |');
  change(FRD, '| F-04.7 | **only** let the claimant\'s own line manager reject a claim | data model — Claim, Reject |', '| F-04.7 | send each claim to the claimant\'s own line manager | data model — Claim, Approve |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Rules are numbered in source order until the FRD is first accepted: F-04\.7 \(data model, Claim, Approve\) comes after F-04\.6 \(data model, Claim, Reject\)/);
});

// ---------------------------------------------------------------- check-frd: Glossary words, one per row

const glossaryFindings = (out) => out.split('\nOne line:\n')[0].split('\n').filter((l) => l.startsWith('- Glossary words: '));

test('check-frd: the Glossary words check skips a requirement copied exactly from a PRD that holds a retired word, and scans a copy that differs', () => {
  const { out, change, read } = expenseClaims();
  change(PRD, '| REQ-3.2 | Requirement | **Finance approval** — Claims over 500 need finance approval. |', '| REQ-3.2 | Requirement | **Expense report approval** — Expense reports over 500 need finance approval. |');
  change(FRD, '- **REQ-3.2 Finance approval** — Claims over 500 need finance approval.', '- **REQ-3.2 Expense report approval** — Expense reports over 500 need finance approval.');
  let r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(glossaryFindings(r.out), []);
  change(FRD, '— Expense reports over 500 need finance approval.', '— Expense reports over 500 need a finance approval.');
  r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  const line = read(FRD).split('\n').findIndex((l) => l.startsWith('- **REQ-3.2 ')) + 1;
  assert.deepStrictEqual(glossaryFindings(r.out), [
    `- Glossary words: Line ${line}: "Expense report" is a retired word; use Claim.`,
    `- Glossary words: Line ${line}: "Expense reports" is a retired word; use Claim.`,
  ]);
});

test('check-frd: the Glossary words check skips text copied exactly from the data model, and scans a copy that differs', () => {
  const { out, change, read } = expenseClaims();
  // An action whose name holds a retired word, named where the FRD names a thing and its action: a rule's source, a
  // row of the coverage table, and an answer to a standard question.
  change(DM, FINANCE_ACTION, '| Approve the expense report over the limit | Approve | Finance approver |');
  change(CATALOG, '| claims.md | Claim | Approve over the limit | F-05 |', '| claims.md | Claim | Approve the expense report over the limit | F-05 |');
  change(FRD, '| data model — Claim, Approve over the limit |', '| data model — Claim, Approve the expense report over the limit |');
  change(FRD, FINANCE_COVERAGE, '| Claim | Approve the expense report over the limit | F-05.4 |');
  change(FRD, '| Claim | Who can do each of these? | PRD, REQ-3.1 -> F-04.2 and F-04.3 |', '| Claim | Who can do each of these? | claims.md, Claim Approve the expense report over the limit -> F-05.4 |');
  // A rules table that holds a retired word, copied into Data.
  for (const rel of [DM, FRD]) change(rel, '| expense lines | several Expense lines | yes, only when it is sent |', '| expense lines | several Expense lines | yes, only when the expense report is sent |');
  let r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(glossaryFindings(r.out), []);
  change(FRD, 'yes, only when the expense report is sent |', 'yes, only once the expense report is sent |');
  r = checkFrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  const line = read(FRD).split('\n').findIndex((l) => l.includes('only once the expense report is sent')) + 1;
  assert.deepStrictEqual(glossaryFindings(r.out), [`- Glossary words: Line ${line}: "expense report" is a retired word; use Claim.`]);
});

test('check-frd: a rule that may hold two behaviours is shown to look at, and is never a finding', () => {
  const { out, change } = expenseClaims();
  change(FRD, '| let a line manager approve a claim waiting for them |', '| let a line manager approve a claim or reject it |');
  const r = checkFrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^One requirement per row, to look at: 1 rule may hold two actions joined by "and" or "or"\. Split each one whose actions can be built on their own\.\n- F-04\.2$/m);
});

test('check-frd: without the data model\'s things file, or a data model file it names, it exits with code 2', () => {
  for (const [rel, says] of [[DM, /The data model file claims\.md, which the things file names for Claims, is missing/], [THINGS, /its things file is missing/]]) {
    const { out, dir } = expenseClaims();
    fs.rmSync(path.join(dir, rel));
    const r = checkFrd(out);
    assert.strictEqual(r.code, 2, `${rel}: ${r.out}${r.err}`);
    assert.match(r.err, says);
  }
});

// ---------------------------------------------------------------- route-next-capability

const F01_NOTES = '| • REQ-2.1 | Must | Benefit — no claim is paid until it is sent | None | FRD-2a Making a claim | None |';
const status = (write, read, rel, line) => write(rel, read(rel).replace(/^Status: .*$/m, line));

test('route-next-capability: capabilities come in EPIC run order', () => {
  const { out } = expenseClaims();
  const r = route(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Next: FRD-2a Making a claim, frd\/frd-making-a-claim\.md\n- F-01 Send a claim\n- F-02 Receipts\n- F-03 Claim stages\n/);
  assert.match(r.out, /^1\. FRD-2a Making a claim: not started\n2\. FRD-3a Claim approval: drafted$/m);
});

test('route-next-capability: a capability waiting on an open Must answer question goes after the others', () => {
  const { out, change } = expenseClaims();
  change(CATALOG, F01_NOTES, F01_NOTES.replace(/\| None \|$/, '| Every claim is in euros, Proposed (needs confirmation), question 4 |'));
  const r = route(out);
  assert.match(r.out, /^Next: FRD-3a Claim approval, frd\/frd-claim-approval\.md$/m);
  assert.match(r.out, /^2\. FRD-2a Making a claim: waits on Must answer question 4$/m);
});

test('route-next-capability: when only waiting work is left, it comes back, and says so', () => {
  const { out, change, write, read } = expenseClaims();
  change(CATALOG, F01_NOTES, F01_NOTES.replace(/\| None \|$/, '| Every claim is in euros, Proposed (needs confirmation), question 4 |'));
  status(write, read, FRD, 'Status: accepted on 2026-10-14, version 1');
  const r = route(out);
  assert.match(r.out, /^Next: FRD-2a Making a claim, frd\/frd-making-a-claim\.md: waits on Must answer question 4, but nothing else is ready$/m);
  assert.match(r.out, /^Accepted: FRD-3a Claim approval$/m);
});

test('route-next-capability: a parked capability goes last, after waiting ones', () => {
  const { out, write, read } = expenseClaims();
  write('frd/frd-making-a-claim.md', read(FRD).replace(/^Status: .*$/m, 'Status: parked on 2026-10-15, at its gate'));
  const r = route(out);
  assert.match(r.out, /^Next: FRD-3a Claim approval/m);
  assert.match(r.out, /^2\. FRD-2a Making a claim: parked$/m);
});

test('route-next-capability: once every FRD is accepted, it says to run stories-workflow', () => {
  const { out, write, read } = expenseClaims();
  status(write, read, FRD, 'Status: accepted on 2026-10-14, version 1');
  write('frd/frd-making-a-claim.md', read(FRD));
  const r = route(out);
  assert.strictEqual(r.out, 'Every FRD accepted: next, run stories-workflow.\n');
});

// ---------------------------------------------------------------- the skills and the workflow

const SKILLS = path.join(KIT, '.claude', 'skills');

test('frd-workflow: its steps are the master plan\'s Workflow 3 table, step for step', () => {
  const md = require('../lib/md-tables.cjs');
  const plan = md.tableUnder(path.join(KIT, 'master-plan.md'), 'Workflow 3: `frd-workflow`');
  const skill = md.tableUnder(path.join(SKILLS, 'frd-workflow', 'SKILL.md'), 'The steps');
  const pick = (rows, check, gate) => rows.map((r) => [r.Step, r['Done by'], r['Previous step'], r.Reads, r['Looks up by ID'], r.Writes, r[check], r[gate], r['Next step']].map((c) => JSON.stringify(c)).join(' | '));
  assert.deepStrictEqual(pick(skill, 'Check before the gate', 'Gate'), pick(plan, 'Check before your gate', 'Your gate'));
});

test('the FRD skills: each has its name, a description, its opening block, and every file and program it points to exists', () => {
  for (const name of ['frd-author', 'frd-workflow']) {
    const dir = path.join(SKILLS, name);
    const t = readText(path.join(dir, 'SKILL.md'));
    assert.match(t, new RegExp(`^---\\nname: ${name}\\n`), `${name}: the name line`);
    assert.match(t, /\ndescription: >-\n {2}\S/, `${name}: the description`);
    for (const m of ['> **What this is:**', '> **What it is not:**', '> **Who uses it:**']) assert.ok(t.includes(m), `${name}: ${m}`);
    for (const ref of t.matchAll(/`((?:\.\.\/_shared|references)\/[^`]+\.md)`/g)) assert.ok(fs.existsSync(path.join(dir, ref[1])), `${name}: ${ref[1]} doesn't exist`);
    for (const prog of t.matchAll(/`(?:node )?tools\/([a-z-]+\.cjs)/g)) assert.ok(fs.existsSync(path.join(TOOLS, prog[1])), `${name}: tools/${prog[1]} doesn't exist`);
    assert.deepStrictEqual(lint(t.replace(/^---\n[\s\S]*?\n---\n/, '')), [], `${name}: renders`);
  }
  assert.deepStrictEqual(lint(readText(path.join(SKILLS, 'frd-author', 'references', 'conventions.md'))), []);
});

test('frd-author\'s conventions keep the sections the spec names, and no review stops, steps 1 to 3 or Open questions section', () => {
  const t = readText(path.join(SKILLS, 'frd-author', 'references', 'conventions.md'));
  const heads = [...t.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => `${m[1]}. ${m[2]}`);
  assert.deepStrictEqual(heads, ['1. IDs — only these, never invent new prefixes', '2. Capability — one FRD per capability', '3. Rules', '4. Done when — the anchor', '5. Sources — copied word for word, and named', '6. Never invent — ask instead', '7. Standard questions', '8. Flow', '9. Output — what may appear in the document', '10. Who decides — at the gate', '11. Changes and acceptance', '12. Decision record', '13. Check record']);
  assert.ok(!/review stop|Step [123]\b|Open questions section|Keep or drop F-/.test(t), 'a word from the earlier, three-stop flow');
});

test('the FRD skills and template: a decision that changes a data model answer moves forward, and nothing pauses for a change', () => {
  const files = [
    path.join(SKILLS, 'frd-author', 'SKILL.md'),
    path.join(SKILLS, 'frd-author', 'references', 'conventions.md'),
    path.join(SKILLS, 'frd-workflow', 'SKILL.md'),
    path.join(SKILLS, '_shared', 'templates', 'frd.md'),
  ];
  for (const f of files) {
    const t = readText(f);
    assert.ok(!/\bpause|never differs from the data model|RC-n|\? \(RC-/.test(t), `${path.basename(path.dirname(f))}/${path.basename(f)}: a word from the pause for a change`);
  }
  assert.ok(readText(files[1]).includes('`*Updated from the data model on the basis of Decision n: {what changed, in a few words}.*`'), 'the conventions give the note');
});

test('frd-author: an accepted FRD that waits on a data model answer now settled runs again, writes the rule from it, and holds its gate again', () => {
  const t = readText(path.join(SKILLS, 'frd-author', 'SKILL.md'));
  const part = t.split('## When an answer it waits on is settled')[1].split('\n## ')[0];
  assert.match(part, /This moves forward, from the data model to the later FRD, and nothing goes back\./);
  assert.match(part, /`status\.cjs` lists each such FRD, and names frd-author for it under "Next:"\./);
  const steps = [...part.matchAll(/^(\d+)\. (.+)$/gm)].map((m) => m[2]);
  assert.strictEqual(steps.length, 6);
  assert.match(steps[0], /^Check that the data model file now holds the answer in place of "\? \(DM-n\)"\./);
  assert.match(steps[3], /^Write the rule from the settled answer, as Step 1 says, .*A new rule takes the next free number\. Rule IDs already accepted never change\./);
  assert.match(steps[5], /^Run Step 2\. Then hold the gate again, as Step 3 says, for what changed\.$/);
  // The conventions and the workflow point to it.
  assert.match(readText(path.join(SKILLS, 'frd-author', 'references', 'conventions.md')), /Once the ID is settled, and the data model holds the answer, an accepted FRD takes it: frd-author runs again for it/);
  assert.match(readText(path.join(SKILLS, 'frd-workflow', 'SKILL.md')), /\*\*An accepted FRD that waits on a data model answer now settled,\*\* .*frd-author then works as its part "When an answer it waits on is settled" says\./);
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
