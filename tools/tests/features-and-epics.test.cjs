#!/usr/bin/env node
'use strict';
// Tests for the features and EPICs: their programs and their skills.
//
//   node tools/tests/features-and-epics.test.cjs
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

// The Expense claims project: the worked examples, then the later documents in fixtures/expense-claims/.
// change(rel, from, to) plants one failure; from must be found exactly once.
function expenseClaims() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'specifier-features-epics-'));
  const dir = path.join(out, 'expense-claims');
  fs.mkdirSync(dir, { recursive: true });
  for (const d of ['discovery-brief', 'brd', 'prd', 'question-log']) fs.copyFileSync(path.join(EXAMPLES, `${d}.md`), path.join(dir, `expense-claims-${d}.md`));
  copyDir(FIXTURE, dir);
  const read = (rel) => readText(path.join(dir, rel));
  const change = (rel, from, to) => {
    const text = read(rel);
    const at = text.split(from).length - 1;
    assert.strictEqual(at, 1, `"${from}" is in ${rel} ${at} times, not once`);
    fs.writeFileSync(path.join(dir, rel), text.replace(from, to));
  };
  return { out, dir, read, change };
}

const args = (out) => ['--project', 'expense-claims', '--output', out, '--date', '2026-10-22'];
const CATALOG = 'frd/feature-catalog.md';
const GROUPING = 'epics/grouping.md';
const REGISTER = 'epics/register.md';

// ---------------------------------------------------------------- check-features

test('check-features: the Expense claims catalog passes every check, and the gate sees what it holds', () => {
  const { out } = expenseClaims();
  const r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 11 checks\.$/m);
  assert.match(r.out, /^- 5 features: 4 Must, 1 Should, 0 Could, 0 Won't$/m);
  assert.match(r.out, /^- 5 of 5 requirements covered$/m);
});

const FEATURE_FAILURES = [
  ['a missing section', '## 3. "Done when" pieces', '## 3. Pieces', /Sections: The section "3\. "Done when" pieces" is missing\./],
  ['a requirement no feature covers', '| • REQ-2.3 | Should |', '| • REQ-2.1 | Should |', /REQ-2\.3: no feature covers it, so it is a Gap that names its question\./],
  ['a feature covering a requirement the PRD hasn\'t got', '| • REQ-2.2 | Must |', '| • REQ-2.9 | Must |', /F-02 covers REQ-2\.9, which isn't in the PRD\./],
  ['a "Done when" that only repeats its description', '| A claimant sees their claim\'s stage: Draft, Submitted, Approved, Rejected or Paid | • REQ-2.3 |', '| Each claim shows the stage it has reached | • REQ-2.3 |', /F-03: its "Done when" only repeats its description/],
  ['a basis that isn\'t on the list', 'Benefit — fewer questions', 'Useful — fewer questions', /F-03: its basis should be one from the fixed list/],
  ['a capability that names no FRD', '| • F-04 | FRD-3a Claim approval |', '| • F-04 | Claim approval |', /F-05: its capability should be FRD-/],
  ['pieces that don\'t give back the "Done when"', '| F-04.dw2 | can approve it |', '| F-04.dw2 | can approve the claim |', /F-04: its pieces don't give back its "Done when"/],
  ['a piece under another feature\'s heading', '### F-02 Receipts', '### F-02 Proof of spend', /F-02\.dw1 should sit under its feature's own heading, "F-02 Receipts"\./],
  ['a feature with no pieces','| F-02.dw1 | A claim can\'t be sent until every expense line has a receipt |\n', '', /F-02 has no pieces\./],
  ['a retired Glossary word', 'Each claim shows the stage it has reached, so that', 'Each expense report shows the stage it has reached, so that', /"expense report" is a retired word; use Claim\./],
  ['a dependency on a feature the catalog hasn\'t got', '| • F-04 | FRD-3a Claim approval |', '| • F-09 | FRD-3a Claim approval |', /F-05 depends on F-09, which isn't in the catalog\./],
];

for (const [what, from, to, finding] of FEATURE_FAILURES) {
  test(`check-features: finds ${what}`, () => {
    const { out, change } = expenseClaims();
    change(CATALOG, from, to);
    const r = run('check-features.cjs', args(out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-features: a Scope row in the PRD needs no feature, and a feature or a coverage row for it is a finding', () => {
  const { out, change } = expenseClaims();
  change('expense-claims-prd.md', '| REQ-3.2 | Requirement |', '| REQ-3.2 | Scope |');
  let r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /F-05 covers REQ-3\.2, which is a Scope row, not a requirement\./);
  assert.match(r.out, /REQ-3\.2 is a Scope row, not a requirement, so it needs no row\./);
  change(CATALOG, '| REQ-3.2 | Finance approval | • F-05 | Covered |', '');
  r = run('check-features.cjs', args(out));
  assert.doesNotMatch(r.out, /REQ-3\.2: no feature covers it/);
  assert.doesNotMatch(r.out, /REQ-3\.2 has no row/);
});

test('check-features: without a Glossary it exits with code 2', () => {
  const { out, dir } = expenseClaims();
  // The Glossary's pages go, and the data model stays, so the missing Glossary is what stops the check.
  for (const e of fs.readdirSync(path.join(dir, 'glossary'), { withFileTypes: true })) if (e.isFile()) fs.rmSync(path.join(dir, 'glossary', e.name));
  assert.strictEqual(run('check-features.cjs', args(out)).code, 2);
});

// ---------------------------------------------------------------- check-features: data model coverage

const DM = 'glossary/data-models/claims.md';
const THINGS = 'glossary/data-models/expense-claims-glossary-things.md';
const DM_ACCEPTED = 'Status: accepted on 2026-10-11, version 1';
const LAST_ROW = '| claims.md | Receipt | Remove | F-02 |';
const FINANCE_ROW = '| claims.md | Claim | Approve over the limit | F-05 |';
const PROGRESS = 'changes/001-finance-limit/progress.md';

// Each one plants one failure in section 5, or in the data model it covers, through one or more changes, each
// [file, from, to]. A swap goes through a stand-in, so every from is found exactly once.
const DATA_MODEL_FAILURES = [
  ['an action with no row', [[CATALOG, LAST_ROW, '']], /Data model coverage: claims\.md, Receipt, Remove: this action has no row\./],
  ['a move with no row', [[CATALOG, '| claims.md | Claim | Approved → Paid | F-03 |', '| claims.md | Claim | Approved -> Paid | F-03 |']], /Data model coverage: claims\.md, Claim, Approved → Paid: this move has no row\./],
  ['two rows for one move', [[CATALOG, '| claims.md | Claim | Submitted → Rejected | F-03 |', '| claims.md | Claim | Submitted → Approved | F-03 |']], /Data model coverage: claims\.md, Claim, Submitted → Approved has 2 rows\. It needs exactly one\./],
  ['a row that goes to a feature the catalog hasn\'t got', [[CATALOG, FINANCE_ROW, '| claims.md | Claim | Approve over the limit | F-09 |']], /Data model coverage: claims\.md, Claim, Approve over the limit goes to F-09, which isn't in the catalog\./],
  ['a row that names two features', [[CATALOG, FINANCE_ROW, '| claims.md | Claim | Approve over the limit | • F-04<br>• F-05 |']], /Data model coverage: claims\.md, Claim, Approve over the limit should name exactly one feature\. It names 2\./],
  ['an extra row', [[CATALOG, LAST_ROW, `${LAST_ROW}\n| claims.md | Receipt | Print | F-02 |`]], /Data model coverage: claims\.md, Receipt, Print isn't an action or a move in the data model files, word for word\./],
  ['rows out of the data model files\' order', [
    [CATALOG, '| claims.md | Claim | Make | F-01 |', 'STAND-IN'],
    [CATALOG, '| claims.md | Claim | Browse | F-04 |', '| claims.md | Claim | Make | F-01 |'],
    [CATALOG, 'STAND-IN', '| claims.md | Claim | Browse | F-04 |'],
  ], /Data model coverage: The rows aren't in the data model files' order: "claims\.md, Claim, Browse" comes where "claims\.md, Claim, Make" should\./],
  ['a data model file that isn\'t accepted', [[DM, DM_ACCEPTED, 'Status: drafted']], /Data model coverage: claims\.md isn't accepted\. Its status is "drafted"\./],
  ['a things file that isn\'t accepted', [[THINGS, DM_ACCEPTED, 'Status: drafted']], /Data model coverage: expense-claims-glossary-things\.md isn't accepted\. Its status is "drafted"\./],
];

for (const [what, changes, finding] of DATA_MODEL_FAILURES) {
  test(`check-features: data model coverage finds ${what}`, () => {
    const { out, change } = expenseClaims();
    for (const [rel, from, to] of changes) change(rel, from, to);
    const r = run('check-features.cjs', args(out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-features: without the data model\'s things file, or a data model file it names, it exits with code 2', () => {
  for (const [rel, says] of [[THINGS, /its things file is missing/], [DM, /The data model file claims\.md, which the things file names for Claims, is missing/]]) {
    const { out, dir } = expenseClaims();
    fs.rmSync(path.join(dir, rel));
    const r = run('check-features.cjs', args(out));
    assert.strictEqual(r.code, 2, `${rel}: ${r.out}${r.err}`);
    assert.match(r.err, says);
  }
});

// Rows of section 5 that show "?", and the table of rows to settle at the gate. open: [thing, action or move, the
// feature its row named]. settle: [thing, action or move, PRD says it?, big enough?, recommended].
function withOpenRows(change, open, settle) {
  for (const [thing, name, had] of open) change(CATALOG, `| claims.md | ${thing} | ${name} | ${had} |`, `| claims.md | ${thing} | ${name} | ? |`);
  if (!settle.length) return;
  change(CATALOG, LAST_ROW, [LAST_ROW, '', '**To settle at the gate**', '', '| Data model file | Thing | Action or move | PRD says it? | Big enough? | Recommended |', '|---|---|---|---|---|---|',
    ...settle.map((s) => `| claims.md | ${s.join(' | ')} |`)].join('\n'));
}

test('check-features: while the catalog is drafted, rows that show "?" pass, and the gate says it can\'t be accepted yet, with each recommendation', () => {
  const { out, change } = expenseClaims();
  withOpenRows(change, [['Claim', 'Browse', 'F-04'], ['Receipt', 'Open', 'F-02']], [['Claim', 'Browse', 'no', 'no', 'Give it to F-01'], ['Receipt', 'Open', 'yes', 'yes', 'A new feature']]);
  const r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^This Feature catalog can't be accepted yet: 2 rows of section 5 still show "\?"\. The gate settles each one first\. The recommendation for each:\n- claims\.md, Claim, Browse: Give it to F-01\n- claims\.md, Receipt, Open: A new feature$/m);
  assert.match(r.out, /^- 22 of 24 actions and moves in the data model have a feature, 2 show "\?", and none waits on a change$/m);
});

const OPEN_ROW_FAILURES = [
  ['a row that shows "?" with no recommendation', [['Claim', 'Browse', 'F-04']], [], /claims\.md, Claim, Browse shows "\?", but the rows to settle at the gate don't list it with a recommendation\./],
  ['a recommendation its two answers don\'t give', [['Claim', 'Browse', 'F-04']], [['Claim', 'Browse', 'no', 'no', 'A new feature']], /claims\.md, Claim, Browse: "PRD says it\?" is no, and "Big enough\?" is no\. So the recommendation is "Give it to F-nn", as feature-author's step 6 says\. F-nn is the feature that owns the thing's first action\./],
  ['an answer that isn\'t yes or no', [['Claim', 'Browse', 'F-04']], [['Claim', 'Browse', 'maybe', 'no', 'Give it to F-01']], /claims\.md, Claim, Browse: "PRD says it\?" and "Big enough\?" should each be yes or no\./],
  ['a recommendation that names a feature the catalog hasn\'t got', [['Claim', 'Browse', 'F-04']], [['Claim', 'Browse', 'no', 'no', 'Give it to F-09']], /claims\.md, Claim, Browse: its recommendation names F-09, which isn't in the catalog\./],
  ['a recommendation that names a feature other than the one that owns the thing\'s first action', [['Expense line', 'Browse', 'F-01']], [['Expense line', 'Browse', 'yes', 'no', 'Add a piece to the Done when of F-04']], /claims\.md, Expense line, Browse: its recommendation names F-04, but F-01 owns Add, the thing's first action\. So the recommendation names F-01\./],
  ['a row to settle at the gate whose row doesn\'t show "?"', [], [['Claim', 'Browse', 'no', 'no', 'Give it to F-01']], /claims\.md, Claim, Browse is listed to settle at the gate, but its row in section 5 doesn't show "\?"\./],
];

for (const [what, open, settle, finding] of OPEN_ROW_FAILURES) {
  test(`check-features: data model coverage finds ${what}`, () => {
    const { out, change } = expenseClaims();
    withOpenRows(change, open, settle);
    const r = run('check-features.cjs', args(out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-features: a row that shows "?" with no recommendation is still shown at the gate, as having none yet', () => {
  const { out, change } = expenseClaims();
  withOpenRows(change, [['Claim', 'Browse', 'F-04']], []);
  const r = run('check-features.cjs', args(out));
  assert.match(r.out, /^This Feature catalog can't be accepted yet: 1 row of section 5 still shows "\?"\. The gate settles each one first\. The recommendation for each:\n- claims\.md, Claim, Browse: no recommendation yet$/m);
});

test('check-features: once the catalog is accepted, a row that still shows "?" is a finding', () => {
  const { out, change } = expenseClaims();
  change(CATALOG, 'Status: drafted', 'Status: accepted on 2026-10-12, version 1');
  withOpenRows(change, [['Claim', 'Browse', 'F-04']], [['Claim', 'Browse', 'no', 'no', 'Give it to F-01']]);
  const r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Data model coverage: claims\.md, Claim, Browse still shows "\?", but the catalog is accepted\. The gate settles every "\?" before the catalog is accepted\./);
  assert.doesNotMatch(r.out, /can't be accepted yet/);
});

test('check-features: a row that waits on an open change passes, and the gate shows it', () => {
  const { out, dir, change } = expenseClaims();
  change(CATALOG, FINANCE_ROW, '| claims.md | Claim | Approve over the limit | waits on change 001 |');
  // Change 001 has no progress file yet, and then one that reads "Status: open". Both are open.
  for (const progress of [null, '# Progress — change 001\n\nStatus: open\n']) {
    if (progress) fs.writeFileSync(path.join(dir, PROGRESS), progress);
    const r = run('check-features.cjs', args(out));
    assert.strictEqual(r.code, 0, r.out + r.err);
    assert.match(r.out, /^Waiting on a change, so no feature yet: 1\. Each one gets its feature when its change runs feature-author:\n- claims\.md, Claim, Approve over the limit: waits on change 001$/m);
    assert.match(r.out, /^- 23 of 24 actions and moves in the data model have a feature, none shows "\?", and 1 waits on a change$/m);
  }
});

const WAIT_FAILURES = [
  ['a row that waits on a change that isn\'t in changes/', 'waits on change 007', /Data model coverage: claims\.md, Claim, Approve over the limit waits on change 007, which isn't in the project's changes\/ folder\./],
  ['a row that waits on a change with no 3-digit number', 'waits on change 1', /Data model coverage: claims\.md, Claim, Approve over the limit: a row that waits on a change reads "waits on change" and the change's 3-digit number, such as "waits on change 004", and nothing else\./],
  ['a row that waits on a number with no "change"', 'waits on 001', /Data model coverage: claims\.md, Claim, Approve over the limit: a row that waits on a change reads "waits on change"/],
  ['a row that waits on a change and names a feature too', 'waits on change 001, F-05', /Data model coverage: claims\.md, Claim, Approve over the limit: a row that waits on a change reads "waits on change"/],
];

for (const [what, cell, finding] of WAIT_FAILURES) {
  test(`check-features: data model coverage finds ${what}`, () => {
    const { out, change } = expenseClaims();
    change(CATALOG, FINANCE_ROW, `| claims.md | Claim | Approve over the limit | ${cell} |`);
    const r = run('check-features.cjs', args(out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-features: a row that still waits on a closed change is a finding', () => {
  const { out, dir, change } = expenseClaims();
  change(CATALOG, FINANCE_ROW, '| claims.md | Claim | Approve over the limit | waits on change 001 |');
  fs.writeFileSync(path.join(dir, PROGRESS), '# Progress — change 001\n\nStatus: closed on 2026-10-21\n');
  const r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Data model coverage: claims\.md, Claim, Approve over the limit still waits on change 001, which is closed\. The change has run, so the row should name its feature\./);
  assert.doesNotMatch(r.out, /Waiting on a change/);
});

// ---------------------------------------------------------------- check-features: Glossary words, one per row

const PRD = 'expense-claims-prd.md';
// The Glossary words findings, as "For the person" lists them. "For the file" lists them again.
const glossaryFindings = (out) => out.split('\nOne line:\n')[0].split('\n').filter((l) => l.startsWith('- Glossary words: '));

// A PRD section's heading is in the catalog twice, over its features and over their coverage rows, so both copies
// change, and the heading must be found exactly twice. Every other change finds its text once.
function changeHeadings(dir, read, from, to) {
  const t = read(CATALOG);
  assert.strictEqual(t.split(from).length - 1, 2, `"${from}" is in ${CATALOG} ${t.split(from).length - 1} times, not twice`);
  fs.writeFileSync(path.join(dir, CATALOG), t.split(from).join(to));
}

test('check-features: the Glossary words check skips a PRD heading and a PRD title copied exactly, and still finds a retired word the catalog uses itself', () => {
  const { out, dir, change, read } = expenseClaims();
  change(PRD, '### 3. Approving claims', '### 3. Approving expense reports');
  changeHeadings(dir, read, '### 3. Approving claims', '### 3. Approving expense reports');
  change(PRD, '| REQ-3.2 | Requirement | **Finance approval** —', '| REQ-3.2 | Requirement | **Expense report approval** —');
  change(CATALOG, '| REQ-3.2 | Finance approval | • F-05 | Covered |', '| REQ-3.2 | Expense report approval | • F-05 | Covered |');
  let r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(glossaryFindings(r.out), []);
  change(CATALOG, 'Each claim shows the stage it has reached, so that', 'Each expense report shows the stage it has reached, so that');
  r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  const line = read(CATALOG).split('\n').findIndex((l) => l.includes('Each expense report shows')) + 1;
  assert.deepStrictEqual(glossaryFindings(r.out), [`- Glossary words: Line ${line}: "expense report" is a retired word; use Claim.`]);
});

test('check-features: a heading or a requirement title that differs from the PRD\'s is scanned', () => {
  const { out, dir, change, read } = expenseClaims();
  change(PRD, '### 3. Approving claims', '### 3. Approving expense reports');
  change(PRD, '| REQ-3.2 | Requirement | **Finance approval** —', '| REQ-3.2 | Requirement | **Expense report approval** —');
  // The catalog's copies each differ from the PRD's by one word.
  changeHeadings(dir, read, '### 3. Approving claims', '### 3. Approving the expense reports');
  change(CATALOG, '| REQ-3.2 | Finance approval | • F-05 | Covered |', '| REQ-3.2 | Expense report approvals | • F-05 | Covered |');
  const r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  const lines = read(CATALOG).split('\n');
  const at = (s) => lines.reduce((list, l, i) => (l.includes(s) ? [...list, i + 1] : list), []);
  const want = [...at('### 3. Approving the expense reports'), ...at('| Expense report approvals |')].sort((a, b) => a - b);
  assert.strictEqual(want.length, 3);
  assert.deepStrictEqual(glossaryFindings(r.out).map((l) => Number(l.match(/Line (\d+):/)[1])), want);
});

test('check-features: the Glossary words check skips a data model action copied exactly into section 5, and scans a copy that differs', () => {
  const { out, change, read } = expenseClaims();
  // An action whose name holds a retired word, copied into both of section 5's tables: its row, and its row to settle
  // at the gate.
  change(DM, '| Approve over the limit | Approve | Finance approver |', '| Approve the expense report over the limit | Approve | Finance approver |');
  change(CATALOG, FINANCE_ROW, '| claims.md | Claim | Approve the expense report over the limit | F-05 |');
  withOpenRows(change, [['Claim', 'Approve the expense report over the limit', 'F-05']], [['Claim', 'Approve the expense report over the limit', 'no', 'no', 'Give it to F-01']]);
  let r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(glossaryFindings(r.out), []);
  // The row's copy differs from the data model's by one word.
  change(CATALOG, '| claims.md | Claim | Approve the expense report over the limit | ? |', '| claims.md | Claim | Approve an expense report over the limit | ? |');
  r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  const line = read(CATALOG).split('\n').findIndex((l) => l.includes('| Approve an expense report over the limit |')) + 1;
  assert.deepStrictEqual(glossaryFindings(r.out), [`- Glossary words: Line ${line}: "expense report" is a retired word; use Claim.`]);
});

test('check-features: a feature name that may name two things, and a description that may hold two actions, are shown to look at, and are never a finding', () => {
  const { out, change } = expenseClaims();
  change(CATALOG, '| F-03 | Claim stages |', '| F-03 | Claim stages and history |');
  change(CATALOG, '### F-03 Claim stages', '### F-03 Claim stages and history');
  change(CATALOG, '| An employee sends a claim with one or more expense lines, so that the business can pay them back |', '| An employee can send a claim or remove it, so that the business can pay them back |');
  const r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^One requirement per row, to look at: 1 feature name may name two things joined by "and", "or", "\/" or a comma\. Split each one whose parts can be built on their own\.\n- F-03$/m);
  assert.match(r.out, /^One requirement per row, to look at: 1 feature description may hold two actions joined by "and" or "or"\. Split each one whose actions can be built on their own\.\n- F-01$/m);
});

test('check-features: a "Done when" piece that may hold two actions is shown to look at, and is never a finding', () => {
  const { out, change } = expenseClaims();
  let r = run('check-features.cjs', args(out));
  assert.ok(!/"Done when" piece/.test(r.out.split('One requirement per row')[1] || ''), 'the worked catalog has no piece to look at');
  change(CATALOG, '| F-04.dw2 | can approve it |', '| F-04.dw2 | can approve it or reject it with a reason |');
  change(CATALOG, '| F-04.dw3 | reject it with a reason |\n', '');
  r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^One requirement per row, to look at: 1 "Done when" piece may hold two actions joined by "and" or "or"\. Split each one whose actions can be built on their own\.\n- F-04\.dw2$/m);
});

test('check-features: a PRD section with more than one capability is shown to look at, and is never a finding', () => {
  const { out, change } = expenseClaims();
  let r = run('check-features.cjs', args(out));
  assert.ok(!/One FRD for each PRD section/.test(r.out), 'the worked catalog has one capability for each section');
  change(CATALOG, '| • F-04 | FRD-3a Claim approval | None |', '| • F-04 | FRD-3b Finance approval | None |');
  r = run('check-features.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^One FRD for each PRD section, to look at: 1 PRD section has more than one capability\. Keep a split only when each part holds rules that don't depend on the other's, and different people act in each\.\n- section 3: FRD-3a Claim approval, FRD-3b Finance approval$/m);
});

// ---------------------------------------------------------------- check-epic-grouping

test('check-epic-grouping: the Expense claims grouping passes every check', () => {
  const { out } = expenseClaims();
  const r = run('check-epic-grouping.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 14 checks\.$/m);
  assert.match(r.out, /^- the chosen grouping: option A, 2 EPICs$/m);
});

const GROUPING_FAILURES = [
  ['a feature missing from the inventory', '| F-05 | Finance approval | • REQ-3.2 | Must | The finance team also approves each claim over 500 | • F-04 |\n', '', /F-05 is in the Feature catalog but not in the inventory\./],
  ['an option that places a feature twice', '| 1 | Claim basics | • F-01<br>• F-03 | Mixed |', '| 1 | Claim basics | • F-01<br>• F-03<br>• F-02 | Mixed |', /Option B places F-02 in 2 EPICs\./],
  ['a chosen grouping that differs from its option', '| • F-04<br>• F-05 | None | MVP |', '| • F-04 | None | MVP |', /EPIC 2: its MVP and Later features aren't option A's\./],
  ['a band that doesn\'t fit its features', '| • F-03 | Mixed | Claimant |', '| • F-03 | MVP | Claimant |', /EPIC 1: its band is MVP, but its features make it Mixed\./],
  ['a dependency the catalog makes, but nobody listed', '| 2 | 1 | there is nothing to approve until a claim can be sent | F-04 depends on F-01 |\n', '', /EPIC 2 depends on EPIC 1 through the catalog, but it isn't listed\./],
  ['an EPIC brief list out of order', '| 1 | 1 Claim submission | no |', '| 1 | 2 Claim approval | no |', /The EPIC brief list doesn't follow the suggested sequence\./],
  ['a retired Glossary word', '**Best if:** the team works through the policy in order', '**Best if:** the team works through the policy in order, one expense report at a time', /Glossary words: Line \d+: "expense report" is a retired word; use Claim\./],
];

for (const [what, from, to, finding] of GROUPING_FAILURES) {
  test(`check-epic-grouping: finds ${what}`, () => {
    const { out, change } = expenseClaims();
    change(GROUPING, from, to);
    const r = run('check-epic-grouping.cjs', args(out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-epic-grouping: it finds a clash from the catalog that nobody settled, and passes it once a decision settles it', () => {
  const { out, change } = expenseClaims();
  // Manager approval, in the first band, now depends on Claim stages, in the later band.
  change(CATALOG, '| Penalty — paying an unapproved claim breaks the expense policy | • F-01 |', '| Penalty — paying an unapproved claim breaks the expense policy | • F-03 |');
  change(GROUPING, '| A line manager approves or rejects each claim from their team | • F-01 |', '| A line manager approves or rejects each claim from their team | • F-03 |');
  change(GROUPING, '| 2 | 1 | there is nothing to approve until a claim can be sent | F-04 depends on F-01 |', '| 2 | 1 | there is nothing to approve until a claim can be sent | F-04 depends on F-03 |');
  let r = run('check-epic-grouping.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /A clash isn't settled: F-04, in the first band, depends on F-03, in the later band\./);
  change(GROUPING, '### Clashes, and how you settled them\n\nNone.',
    '### Clashes, and how you settled them\n\n| Clash | Feature | Depends on | Settlement | Decided at |\n|---|---|---|---|---|\n| a first-band feature depends on a later-band one | F-04 | F-03 | Manager approval reads the stage once Claim stages is built. Until then it reads Submitted only. | Decision 1 |');
  r = run('check-epic-grouping.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 1 clash found, 1 settled$/m);
});

test('check-epic-grouping: an accepted grouping whose pick isn\'t in the Decision record is a finding', () => {
  const { out, change } = expenseClaims();
  change(GROUPING, 'Status: drafted', 'Status: accepted on 2026-10-12, version 1');
  change(GROUPING, '- **Chosen:** Option A, by business capability', '- **Chosen:** I don\'t know yet');
  const r = run('check-epic-grouping.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /The grouping is accepted, but no decision chose option A\./);
});

// ---------------------------------------------------------------- check-register

test('check-register: the register matches the chosen grouping, and the pass writes only the check date', () => {
  const { out, read } = expenseClaims();
  const before = read(REGISTER);
  const r = run('check-register.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /the register matches the chosen grouping: 2 EPICs/);
  const after = read(REGISTER);
  assert.match(after, /^- \*\*Copy checked on:\*\* 2026-10-22$/m);
  assert.strictEqual(after.split('\n').filter((l, i) => l !== before.split('\n')[i]).length, 1);
});

const REGISTER_FAILURES = [
  ['a changed field', '| Claimant | None |', '| Claimants | None |', /EPIC-001: Persona is "Claimants"; the grouping has "Claimant"\./],
  ['a missing feature', '| • F-04<br>• F-05 | MVP |', '| • F-04 | MVP |', /EPIC-002: Features is "F-04"; the grouping has "F-04, F-05"\./],
  ['a dependency left out', '| Line manager | • EPIC-001 |', '| Line manager | None |', /EPIC-002: Depends on is "None"; the grouping has "EPIC-001"\./],
  ['a rationale rewritten', '| 2 | EPIC-002 | it works on the claims that EPIC 1 lets people send |', '| 2 | EPIC-002 | approvals come second |', /Run order, row 2:/],
];

for (const [what, from, to, finding] of REGISTER_FAILURES) {
  test(`check-register: finds ${what}, and leaves the check date alone`, () => {
    const { out, change, read } = expenseClaims();
    change(REGISTER, from, to);
    const r = run('check-register.cjs', args(out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
    assert.match(read(REGISTER), /^- \*\*Copy checked on:\*\* not yet$/m);
  });
}

// ---------------------------------------------------------------- build-sequencing-mapping

test('build-sequencing-mapping: on the Expense claims register, the steps, the critical path and the coverage', () => {
  const { out, read } = expenseClaims();
  const r = run('build-sequencing-mapping.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const seq = read('epics/sequencing.md');
  assert.match(seq, /^\| 1 \| • EPIC-001 Claim submission \| None \|$/m);
  assert.match(seq, /^\| 2 \| • EPIC-002 Claim approval \| • EPIC-001 \|$/m);
  assert.match(seq, /^The critical path is 2 EPICs long: EPIC-001 Claim submission, then EPIC-002 Claim approval\.$/m);
  assert.match(seq, /^EPIC-001 Claim submission: 1 EPIC waits on it, directly or through others\.$/m);
  assert.match(read('epics/mapping.md'), /^Every feature is in exactly one EPIC: 5 of 5\.$/m);
  assert.deepStrictEqual(lint(seq), []);
  assert.deepStrictEqual(lint(read('epics/mapping.md')), []);
});

// Four EPICs: 2 and 3 both need 1, and 4 needs 2 and 3.
const FOUR = `| EPIC | Name | Outcome | Features | Band | Persona | Depends on |
|---|---|---|---|---|---|---|
| EPIC-001 | Claim submission | o | • F-01 | MVP | Claimant | None |
| EPIC-002 | Receipts | o | • F-02<br>• F-03 | Mixed | Claimant | • EPIC-001 |
| EPIC-003 | Manager approval | o | • F-04 | MVP | Line manager | • EPIC-001 |
| EPIC-004 | Finance approval | o | • F-05 | MVP | Finance approver | • EPIC-002<br>• EPIC-003 |`;

function withEpics(change, read, rows) {
  const reg = read(REGISTER);
  const start = reg.indexOf('| EPIC | Name |');
  const end = reg.indexOf('\n\n## 2. Run order');
  change(REGISTER, reg.slice(start, end), rows);
}

test('build-sequencing-mapping: side-by-side EPICs share a step, the critical path takes the earlier EPIC on a tie, and the most depended-on counts EPICs waiting through others', () => {
  const { out, read, change } = expenseClaims();
  withEpics(change, read, FOUR);
  const r = run('build-sequencing-mapping.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const seq = read('epics/sequencing.md');
  assert.match(seq, /^\| 2 \| • EPIC-002 Receipts<br>• EPIC-003 Manager approval \| • EPIC-001 \|$/m);
  assert.match(seq, /^\| 3 \| • EPIC-004 Finance approval \| • EPIC-002<br>• EPIC-003 \|$/m);
  assert.match(seq, /^The critical path is 3 EPICs long: EPIC-001 Claim submission, then EPIC-002 Receipts, then EPIC-004 Finance approval\.$/m);
  assert.match(seq, /^EPIC-001 Claim submission: 3 EPICs wait on it, directly or through others\.$/m);
});

test('build-sequencing-mapping: a loop in the dependencies is a finding, and nothing is written', () => {
  const { out, dir, read, change } = expenseClaims();
  change(REGISTER, '| Claimant | None |', '| Claimant | • EPIC-002 |');
  const r = run('build-sequencing-mapping.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /The dependencies form a loop: EPIC-00\d -> EPIC-00\d -> EPIC-00\d\./);
  assert.ok(!fs.existsSync(path.join(dir, 'epics', 'sequencing.md')));
  assert.ok(read(REGISTER));
});

test('build-sequencing-mapping: a feature in two EPICs is a coverage finding', () => {
  const { out, read, change } = expenseClaims();
  change(REGISTER, '| • F-04<br>• F-05 | MVP |', '| • F-03<br>• F-04<br>• F-05 | MVP |');
  const r = run('build-sequencing-mapping.cjs', args(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(read('epics/mapping.md'), /^- F-03 is in 2 EPICs\.$/m);
});

// ---------------------------------------------------------------- the skills and the workflow

const SKILLS = path.join(KIT, '.claude', 'skills');

test('features-and-epics-workflow: its steps are the master plan\'s Workflow 2 table, step for step', () => {
  const md = require('../lib/md-tables.cjs');
  const plan = md.tableUnder(path.join(KIT, 'master-plan.md'), 'Workflow 2: `features-and-epics-workflow`');
  const skill = md.tableUnder(path.join(SKILLS, 'features-and-epics-workflow', 'SKILL.md'), 'The steps');
  const pick = (rows, check, gate) => rows.map((r) => [r.Step, r['Done by'], r['Previous step'], r.Reads, r['Looks up by ID'], r.Writes, r[check], r[gate], r['Next step']].map((c) => JSON.stringify(c)).join(' | '));
  assert.deepStrictEqual(pick(skill, 'Check before the gate', 'Gate'), pick(plan, 'Check before your gate', 'Your gate'));
});

test('the features and EPICs skills: each has its name, a description, its opening block, and every file and program it points to exists', () => {
  for (const name of ['feature-author', 'epic-grouping-author', 'epic-author', 'features-and-epics-workflow']) {
    const dir = path.join(SKILLS, name);
    const t = readText(path.join(dir, 'SKILL.md'));
    assert.match(t, new RegExp(`^---\\nname: ${name}\\n`), `${name}: the name line`);
    assert.match(t, /\ndescription: >-\n {2}\S/, `${name}: the description`);
    for (const m of ['> **What this is:**', '> **What it is not:**', '> **Who uses it:**']) assert.ok(t.includes(m), `${name}: ${m}`);
    for (const ref of t.matchAll(/`((?:\.\.\/_shared|references)\/[^`]+\.md)`/g)) assert.ok(fs.existsSync(path.join(dir, ref[1])), `${name}: ${ref[1]} doesn't exist`);
    for (const prog of t.matchAll(/`(?:node )?tools\/([a-z-]+\.cjs)/g)) assert.ok(fs.existsSync(path.join(TOOLS, prog[1])), `${name}: tools/${prog[1]} doesn't exist`);
    assert.deepStrictEqual(lint(t.replace(/^---\n[\s\S]*?\n---\n/, '')), [], `${name}: renders`);
    for (const f of fs.existsSync(path.join(dir, 'references')) ? fs.readdirSync(path.join(dir, 'references')) : []) {
      assert.deepStrictEqual(lint(readText(path.join(dir, 'references', f))), [], `${name}/references/${f}: renders`);
    }
  }
});

test('the Expense claims test data renders, and its catalog, grouping and register pass their checks together', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(FIXTURE)) assert.deepStrictEqual(lint(readText(f)), [], path.relative(KIT, f));
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
