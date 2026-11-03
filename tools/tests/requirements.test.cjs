#!/usr/bin/env node
'use strict';
// Tests for the Requirements workflow: its programs and its skills.
//
//   node tools/tests/requirements.test.cjs
//
// Every test works on a copy in a temporary folder. Nothing in fixtures/ or Output/ is changed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const KIT = path.resolve(__dirname, '..', '..');
const TOOLS = path.join(KIT, 'tools');

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

function tmpOutput() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specifier-requirements-'));
}

function run(program, args, cwd) {
  // Programs run from a temporary folder, so a missing --output can never write into the repository.
  const r = spawnSync(process.execPath, [path.join(TOOLS, program), ...args], { encoding: 'utf8', cwd: cwd || os.tmpdir() });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

// ---------------------------------------------------------------- list-sources

// Builds a sources/ folder of several hundred files: unique files in 12 folders, plus planted copies, older versions,
// and a series of dated notes that must never be marked as versions.
function plantedSources() {
  const out = tmpOutput();
  const src = path.join(out, 'big', 'sources');
  const unique = [];
  for (let f = 1; f <= 12; f++) {
    for (let i = 1; i <= 25; i++) {
      const rel = `folder-${String(f).padStart(2, '0')}/note-${f}-${i}.md`;
      write(path.join(src, rel), `unique ${f} ${i}\n`);
      unique.push(rel);
    }
  }
  // 20 copies: same contents as a unique file, with a longer name.
  for (let i = 1; i <= 20; i++) write(path.join(src, `copies/note-1-${i} copy.md`), `unique 1 ${i}\n`);
  // 15 documents in three versions each: the first two are older, the third is the newest.
  for (let i = 1; i <= 15; i++) {
    for (const v of [1, 2, 3]) write(path.join(src, `versions/spec-${i}-v${v}.docx`), `spec ${i} version ${v}\n`);
  }
  // 10 dated notes: a series, so none is marked, and all are named for discovery-author.
  for (let d = 10; d < 20; d++) write(path.join(src, `meetings/weekly-notes-2026-09-${d}.md`), `meeting on ${d}\n`);
  return { out, unique: unique.length };
}

test('list-sources: on several hundred files it lists each once, and marks every planted copy and older version', () => {
  const { out } = plantedSources();
  const r = run('list-sources.cjs', ['--project', 'big', '--output', out]);
  assert.strictEqual(r.code, 0, r.err);
  const rows = r.out.split('\n').filter((l) => /^\| \d+ \| \[/.test(l));
  const total = 300 + 20 + 45 + 10;
  assert.strictEqual(rows.length, total);
  const numbers = rows.map((l) => Number(l.split(' | ')[0].slice(2)));
  assert.deepStrictEqual(numbers, numbers.map((_, i) => i + 1));
  const marked = (re) => rows.filter((l) => re.test(l));
  assert.strictEqual(marked(/\| No: same as \d+ \|$/).length, 20);
  assert.ok(marked(/\| No: same as \d+ \|$/).every((l) => / copy\.md\]/.test(l)), 'a copy was kept instead of its original');
  assert.strictEqual(marked(/\| No: older version of \d+ \|$/).length, 30);
  assert.ok(marked(/\| No: older version of \d+ \|$/).every((l) => /-v[12]\.docx\]/.test(l)), 'a newest version was marked older');
  assert.match(r.out, new RegExp(`^\\| ${total} \\| ${total - 50} \\| 20 \\| 30 \\| 0 \\|$`, 'm'));
});

test('list-sources: files that differ only by a date are named for discovery-author, never marked', () => {
  const { out } = plantedSources();
  const r = run('list-sources.cjs', ['--project', 'big', '--output', out]);
  assert.ok(r.out.split('\n').filter((l) => /weekly-notes/.test(l) && /^\| /.test(l)).every((l) => /\| Yes \|$/.test(l)));
  const tail = r.out.slice(r.out.indexOf('For discovery-author:'));
  assert.match(tail, /^- Set 1:$/m);
  assert.strictEqual((tail.match(/meetings\/weekly-notes-2026-09-\d\d\.md/g) || []).length, 10);
});

test('list-sources: the table it prints renders cleanly, with spaces in file names encoded in the links', () => {
  const { out } = plantedSources();
  const r = run('list-sources.cjs', ['--project', 'big', '--output', out]);
  const brief = r.out.slice(r.out.indexOf('For the brief:') + 'For the brief:'.length, r.out.indexOf('For discovery-author:'));
  const { lint } = require('../lib/md-lint.cjs');
  assert.deepStrictEqual(lint(brief), []);
  assert.match(r.out, /\(sources\/copies\/note-1-1%20copy\.md\)/);
});

test('list-sources: a missing or empty sources/ folder exits with code 2', () => {
  const out = tmpOutput();
  assert.strictEqual(run('list-sources.cjs', ['--project', 'none', '--output', out]).code, 2);
  fs.mkdirSync(path.join(out, 'empty', 'sources'), { recursive: true });
  const r = run('list-sources.cjs', ['--project', 'empty', '--output', out]);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /empty/);
});

// ---------------------------------------------------------------- the Expense claims project

const EXAMPLES = path.join(KIT, '.claude', 'skills', '_shared', 'examples');
const FIXTURE = path.join(KIT, 'fixtures', 'expense-claims');

// The sources the worked Discovery brief lists, planted so list-sources.cjs finds what it says: two versions of the
// requirements, a policy and its identical copy, a policy ruled out of scope, workshop notes and an email.
const EXAMPLE_SOURCES = {
  'requirements/claims-requirements-v2.docx': 'claims requirements, version 2',
  'requirements/claims-requirements-v1.docx': 'claims requirements, version 1',
  'policies/expense-policy-2026.pdf': 'expense policy, 2026 edition',
  'policies/expense-policy-2026-copy.pdf': 'expense policy, 2026 edition',
  'policies/travel-booking-policy-2026.pdf': 'travel booking policy, 2026 edition',
  'workshops/workshop-notes-2026-09-12.md': 'workshop notes, 12 September',
  'emails/payroll-cutoff-2026-09-20.eml': 'payroll cut-off, 20 September',
};

// A project built from the worked examples: the Discovery brief, BRD, PRD and Question log, under their project names,
// and the sources they list. change(document, from, to) plants one failure in the copy; from must be found exactly once.
function expenseClaims() {
  const out = tmpOutput();
  const dir = path.join(out, 'expense-claims');
  for (const d of ['discovery-brief', 'brd', 'prd', 'question-log']) {
    write(path.join(dir, `expense-claims-${d}.md`), readText(path.join(EXAMPLES, `${d}.md`)));
  }
  for (const [rel, content] of Object.entries(EXAMPLE_SOURCES)) write(path.join(dir, 'sources', rel), `${content}\n`);
  const change = (document, from, to) => {
    const file = path.join(dir, `expense-claims-${document}.md`);
    const text = readText(file);
    const at = text.split(from).length - 1;
    assert.strictEqual(at, 1, `"${from}" is in the ${document} ${at} times, not once`);
    fs.writeFileSync(file, text.replace(from, to));
  };
  return { out, change };
}

// A gap in the worked PRD, and the same line with its question lost. (Its "TBD, question 10" sits in the italic rule
// under a heading, which the grader skips, so it can't be used.)
const PRD_GAP = 'Every claim is made in euros — Proposed (needs confirmation), question 4';
const PRD_GAP_LOST = 'Every claim is made in euros — Proposed (needs confirmation)';

// ---------------------------------------------------------------- check-brd

const checkBrd = (out) => run('check-brd.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-22']);

test('check-brd: the worked BRD passes every check, and the gate sees what it holds and where it goes beyond the files', () => {
  const { out } = expenseClaims();
  const r = checkBrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 11 checks\.$/m);
  assert.match(r.out, /^- 4 business requirements$/m);
  assert.match(r.out, /^- 3 release criteria$/m);
  assert.strictEqual(r.out.slice(r.out.indexOf('Where it goes beyond'), r.out.indexOf('open questions')).split('\n').filter((l) => /Proposed \(needs confirmation\)/.test(l)).length, 3);
  assert.match(r.out, /^One line:\ncheck-brd\.cjs: 11 of 11 checks passed, 0 findings; 4 open questions \(1 must answer, 1 should answer, 2 can move ahead\)\.$/m);
  assert.match(r.out, /^For the file:\ncheck-brd\.cjs, 2026-10-22: 11 of 11 checks passed, 0 findings\./m);
});

// Each planted failure, and the finding it must give. Every one is planted on its own copy.
const BRD_FAILURES = [
  ['a missing section', '## 7. Release criteria', '## Release tests', /Sections: The section "7\. Release criteria" is missing\./],
  ['a journey section', '## Traceability mini-map', '## 8. User journeys\n\nA manager approves a claim.\n\n## Traceability mini-map', /No journey or NFR section: The heading "8\. User journeys" belongs in the PRD\./],
  ['a gap in the BR IDs', '| BR-03 |', '| BR-05 |', /Business requirement IDs: Row 3 is "BR-05"; it should be BR-03\./],
  ['a KPI with no confidence tag', '| Monthly, per workshop-notes-2026-09-12.md, item 2 | Finance team, per workshop-notes-2026-09-12.md, item 2 | TENTATIVE: no file gives a target |', '| Monthly, per workshop-notes-2026-09-12.md, item 2 | Finance team, per workshop-notes-2026-09-12.md, item 2 | No file gives a target |', /KPIs: The KPI "Working days from sending a claim to paying it" has no confidence tag/],
  ['a KPI cell that says nothing of where it came from', '| 18, per workshop-notes-2026-09-12.md, item 2 |', '| 18 |', /KPIs: The KPI "Working days from sending a claim to paying it": its baseline doesn't say where it came from\./],
  ['a business requirement with no source', '| per claims-requirements-v2.docx, section 2.2 |', '| the requirements |', /The business requirement "BR-04" doesn't say where it came from\./],
  ['an empty Out of scope', '- Booking travel — per Discovery brief, Decision 6\n- Statements from company credit cards — per claims-requirements-v2.docx, section 1.3\n', '', /Out of scope: "Out of scope" is empty\./],
  ['a placeholder left in', '| Pay approved claims faster | per claims-requirements-v2.docx, section 1.1 |', '| Pay approved claims faster | {source} |', /Placeholders: Line \d+: the placeholder \{source\} is still there\./],
  ['a gap that names no question', '- Every claim is made in euros — Proposed (needs confirmation), question 4', '- Every claim is made in euros — Proposed (needs confirmation)', /Question log: expense-claims-brd\.md, line \d+: "Proposed \(needs confirmation\)" names no question\./],
];

for (const [what, from, to, finding] of BRD_FAILURES) {
  test(`check-brd: finds ${what}`, () => {
    const { out, change } = expenseClaims();
    change('brd', from, to);
    const r = checkBrd(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-brd: a gap in another document is that document\'s finding, not the BRD\'s', () => {
  const { out, change } = expenseClaims();
  change('prd', PRD_GAP, PRD_GAP_LOST);
  const r = checkBrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.strictEqual(run('check-prd.cjs', ['--project', 'expense-claims', '--output', out]).code, 1, 'the planted gap is not a real one');
});

test('check-brd: once the BRD is accepted, the gate sees each answer and the list for the client', () => {
  const { out, change } = expenseClaims();
  change('brd', 'Status: drafted', 'Status: accepted on 2026-10-06, version 1');
  const r = checkBrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Accepted on 2026-10-06, version 1\.$/m);
  assert.match(r.out, /^- Decision 1, Which currencies can a claim be made in\? I don't know yet$/m);
  const changed = r.out.slice(r.out.indexOf('What we changed or added'), r.out.indexOf('What we still need'));
  assert.strictEqual(changed.split('\n').filter((l) => /^- /.test(l)).length, 3);
  const need = r.out.slice(r.out.indexOf('What we still need'), r.out.indexOf('Every check passed'));
  for (const n of [4, 6, 7, 8]) assert.match(need, new RegExp(`^- question ${n}: `, 'm'));
});

test('check-brd: a business requirement that may hold two actions is shown to look at, never a finding', () => {
  const { out, change } = expenseClaims();
  assert.doesNotMatch(checkBrd(out).out, /One requirement per row/);
  change('brd', '| BR-02 | Every claim is approved by someone other than the person who made it. |', '| BR-02 | A line manager can approve or reject a claim made by someone in their team. |');
  const r = checkBrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^One requirement per row, to look at: 1 business requirement may hold two actions joined by "and" or "or"\. Split each one whose actions can be built on their own\.\n- BR-02$/m);
  assert.match(r.out, /^Every check passed: 11 checks\.$/m);
});

test('check-brd: a missing BRD, or no project, exits with code 2', () => {
  const out = tmpOutput();
  assert.strictEqual(checkBrd(out).code, 2);
  assert.strictEqual(run('check-brd.cjs', ['--output', out]).code, 2);
});

// ---------------------------------------------------------------- check-prd

const checkPrd = (out) => run('check-prd.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-22']);

test('check-prd: the worked PRD passes every check, and the gate sees what it holds and where it goes beyond the files', () => {
  const { out } = expenseClaims();
  const r = checkPrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 16 checks\.$/m);
  assert.match(r.out, /^- 5 requirements, under 2 headings of the client's files$/m);
  assert.match(r.out, /^- 4 of 4 business requirements covered$/m);
  assert.match(r.out, /^- 6\. NFRs: NFR-2: Receipts are kept for as long as the law requires, AI-RECOMMENDED$/m);
  assert.match(r.out, /^- 8\. Dependencies and assumptions: Every claim is made in euros — Proposed \(needs confirmation\), question 4$/m);
});

// Each planted failure, and the finding it must give. Every one is planted on its own copy.
const PRD_FAILURES = [
  ['a missing section', '## 5. The end-to-end journey', '## 5. Journey', /Sections: The section "5\. The end-to-end journey" is missing\./],
  ['a requirement whose source names no version', '| claims-requirements-v2.docx, version 2, section 2.2 |', '| claims-requirements-v2.docx, section 2.2 |', /REQ-2\.2: its source doesn't name the document and its version/],
  ['requirements grouped by priority', '### 2. Submitting claims', '### Must have', /The heading "Must have" groups the requirements\./],
  ['a priority column', '| NFR ID | NFR | Source | Confidence |', '| NFR ID | NFR | Source | Confidence | Priority |', /A table has a "Priority" column\./],
  ['a business-rules section', '## 9. Traceability matrix', '## Business rules\n\nA claim over 500 needs finance approval.\n\n## 9. Traceability matrix', /The heading "Business rules" doesn't belong in the PRD/],
  ['an Open questions section', '## 9. Traceability matrix', '## Open questions\n\n- Who approves claims over 500?\n\n## 9. Traceability matrix', /The heading "Open questions" doesn't belong in the PRD: questions live in the Question log\./],
  ['a gap in the NFR IDs', '| NFR-2 |', '| NFR-3 |', /NFRs: Row 2 is "NFR-3"; it should be NFR-2\./],
  ['a requirement tracing to a business requirement the BRD hasn\'t got', '| claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |', '| claims-requirements-v2.docx, version 2, section 3.2 | • BR-09 |', /REQ-3\.2 traces to BR-09, which isn't in the BRD\./],
  ['a business requirement nothing traces to, still marked Covered', '| claims-requirements-v2.docx, version 2, section 2.2 | • BR-04 |', '| claims-requirements-v2.docx, version 2, section 2.2 | • BR-01 |', /BR-04: nothing traces to it, so its status should be Gap\./],
  ['a journey step naming a requirement the PRD hasn\'t got', '| • REQ-3.2 |\n| 4 |', '| • REQ-3.9 |\n| 4 |', /Step 3 names REQ-3\.9, which isn't in section 4\./],
  ['a transition requirement that doesn\'t say whether it needs building', 'item 11 | No |', 'item 11 | Maybe |', /TR-1: "Needs building\?" is "Maybe"; it should be Yes or No\./],
  ['a gap that names no question', PRD_GAP, PRD_GAP_LOST, /Question log: expense-claims-prd\.md, line \d+: "Proposed \(needs confirmation\)" names no question\./],
  ['an ID that skips a number', '| REQ-2.3 |', '| REQ-2.4 |', /Requirement IDs: REQ-2\.4 should be REQ-2\.3: the IDs count up from 1 in each section, with no gaps\./],
  ['an ID with a letter', '| REQ-2.3 |', '| REQ-2.2a |', /Requirement IDs: REQ-2\.2a isn't in the form REQ-\{section\}\.\{n\}, such as REQ-3\.1\./],
  ['a kind that isn\'t one of the four', '| REQ-3.2 | Requirement |', '| REQ-3.2 | Rule |', /REQ-3\.2: its kind is "Rule"\. It should be Requirement, Purpose, Scope or Way of working\./],
  ['a Scope row that traces to a business requirement', '| REQ-3.2 | Requirement |', '| REQ-3.2 | Scope |', /REQ-3\.2 is a Scope row, so it traces to BRD section 4, not to a business requirement\./],
  ['a journey step that names a Scope row', '| REQ-3.2 | Requirement | **Finance approval** — Claims over 500 need finance approval. | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |', '| REQ-3.2 | Scope | **Finance approval** — Claims over 500 need finance approval. | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • BRD section 4 |', /Step 3 names REQ-3\.2, which is a Scope row, not a requirement\./],
  ['simple words with no title in bold', '| REQ-3.2 | Requirement | **Finance approval** — Claims over 500 need finance approval. |', '| REQ-3.2 | Requirement | Claims over 500 need finance approval. |', /REQ-3\.2: its simple words don't start with a short title in bold, then " — ", then the requirement/],
  ['simple words with a hyphen after the title, not " — "', '| REQ-3.2 | Requirement | **Finance approval** — Claims over 500 need finance approval. |', '| REQ-3.2 | Requirement | **Finance approval** - Claims over 500 need finance approval. |', /REQ-3\.2: its simple words don't start with a short title in bold/],
  ['a word that can\'t be checked in the simple words, with no question', '— An employee sends a claim with one or more expense lines. | **Send a claim**', '— An employee sends a claim with one or more expense lines as needed. | **Send a claim**', /"as needed"\. Say instead: say when, as a rule\./],
];

for (const [what, from, to, finding] of PRD_FAILURES) {
  test(`check-prd: finds ${what}`, () => {
    const { out, change } = expenseClaims();
    change('prd', from, to);
    const r = checkPrd(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-prd: when the source is a markdown file, the parts of the client\'s words must give back the client\'s row', () => {
  const { out, change } = expenseClaims();
  write(path.join(out, 'expense-claims', 'sources', 'requirements', 'claims.md'), '| ID | Requirement | Description |\n|---|---|---|\n| 3.2 | Finance approval | Claims over 500 need finance approval. |\n');
  change('prd', '| claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |', '| claims.md, version 2, section 3.2 | • BR-03 |');
  let r = checkPrd(out);
  assert.match(r.out, /^- 5 client rows: 1 checked against their source file, word for word, and 4 in a file the program can't read$/m);
  assert.doesNotMatch(r.out, /The client's words, in parts:/);
  change('prd', '| **Finance approval** — Claims over 500 need finance approval. | claims.md', '| **Finance approval** — Claims over 500 need approval. | claims.md');
  r = checkPrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /The client's words, in parts: REQ-3\.2: the parts of the client's words don't give back row 3\.2 of claims\.md, word for word\./);
});

test('check-prd: when the project has a Glossary, a word it retired in the simple words is a finding', () => {
  const { out, change } = expenseClaims();
  for (const f of fs.readdirSync(path.join(FIXTURE, 'glossary'), { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name)) write(path.join(out, 'expense-claims', 'glossary', f), readText(path.join(FIXTURE, 'glossary', f)));
  change('prd', '| REQ-2.1 | Requirement | **Send a claim** — An employee sends a claim with one or more expense lines. |', '| REQ-2.1 | Requirement | **Send a claim** — An employee sends an expense report with one or more expense lines. |');
  const r = checkPrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Agreed words: REQ-2\.1: "expense report" is a word the Glossary retired\. Use Claim\./);
});

test('check-prd: a row whose simple words may hold two actions is shown to look at, never a finding', () => {
  const { out, change } = expenseClaims();
  change('prd', '| REQ-3.1 | Requirement | **Line manager approval** — The claimant\'s line manager approves every claim. |', '| REQ-3.1 | Requirement | **Line manager approval** — The claimant\'s line manager can approve or reject every claim. |');
  const r = checkPrd(out);
  assert.match(r.out, /^One requirement per row, to look at: 1 row may hold two actions joined by "and" or "or"\./m);
  assert.match(r.out, /^- REQ-3\.1$/m);
  assert.doesNotMatch(r.out, /REQ-3\.1.*two actions.*\n.*finding/);
});

test('check-prd: a Purpose row passes when it names the section that holds it, and is counted apart from the requirements', () => {
  const { out, change } = expenseClaims();
  change('prd', '| REQ-3.2 | Requirement | **Finance approval** — Claims over 500 need finance approval. | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |', '| REQ-3.2 | Purpose | **Finance approval** — Claims over 500 need finance approval. | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • PRD section 2 |');
  change('prd', '| 3 | Claims over 500 also get finance approval | • REQ-3.2 |', '| 3 | Claims over 500 also get finance approval | • REQ-3.1 |');
  change('prd', '| BR-03 | Claims over 500 are also approved by the finance team. | • REQ-3.2 | Covered |', '| BR-03 | Claims over 500 are also approved by the finance team. | None | Gap, question 7 |');
  const r = checkPrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 4 requirements, and 1 row of purpose, scope or way of working, under 2 headings of the client's files$/m);
});

// REQ-3.2 as the worked PRD writes it, and the journey step and matrix row that name it, for a test that changes its kind.
const REQ_32 = '| REQ-3.2 | Requirement | **Finance approval** — Claims over 500 need finance approval. | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |';
function req32NotARequirement(change, kind, simple, traces) {
  change('prd', REQ_32, `| REQ-3.2 | ${kind} | **Finance approval** — ${simple} | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | ${traces} |`);
  change('prd', '| 3 | Claims over 500 also get finance approval | • REQ-3.2 |', '| 3 | Claims over 500 also get finance approval | • REQ-3.1 |');
  change('prd', '| BR-03 | Claims over 500 are also approved by the finance team. | • REQ-3.2 | Covered |', '| BR-03 | Claims over 500 are also approved by the finance team. | None | Gap, question 7 |');
}

test('check-prd: a Way of working row passes when it names PRD section 8, and its simple words are never read for two actions', () => {
  const { out, change } = expenseClaims();
  req32NotARequirement(change, 'Way of working', 'The finance team can check and approve claims over 500.', '• PRD section 8');
  const r = checkPrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 4 requirements, and 1 row of purpose, scope or way of working, under 2 headings of the client's files$/m);
  assert.doesNotMatch(r.out, /One requirement per row/);
});

test('check-prd: a row of any kind but Requirement that names no section is told which one to name', () => {
  const missed = [];
  for (const [kind, home] of [['Purpose', 'PRD section 2'], ['Scope', 'BRD section 4'], ['Way of working', 'PRD section 8']]) {
    const { out, change } = expenseClaims();
    req32NotARequirement(change, kind, 'Claims over 500 need finance approval.', 'None');
    const r = checkPrd(out);
    if (r.code !== 1 || !r.out.includes(`Requirements: REQ-3.2 is a ${kind} row, so "Traces to" names ${home}.`)) missed.push(`${kind}: exit ${r.code}\n${r.out}`);
  }
  assert.deepStrictEqual(missed, []);
});

test('check-prd: a PRD with no Kind column is told how to add it', () => {
  const { out } = expenseClaims();
  const file = path.join(out, 'expense-claims', 'expense-claims-prd.md');
  fs.writeFileSync(file, readText(file).replace(/\| ID \| Kind \|/g, '| ID |').replace(/^\|---\|---\|---\|---\|---\|---\|/gm, '|---|---|---|---|---|').replace(/^(\| REQ-[\d.]+ \|) Requirement \|/gm, '$1'));
  const r = checkPrd(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /Section 4 has no Kind column\. Add it after ID, and give each row its kind: Requirement, Purpose, Scope or Way of working\./);
});

test('check-prd: a word that can\'t be checked passes, when its line names its question', () => {
  const { out, change } = expenseClaims();
  change('prd', '— An employee sends a claim with one or more expense lines. | **Send a claim**', '— An employee sends a claim with one or more expense lines as needed, question 4. | **Send a claim**');
  const r = checkPrd(out);
  assert.doesNotMatch(r.out, /"as needed"/);
});

test('check-prd: a business requirement nothing covers passes, when it is a Gap that names its question', () => {
  const { out, change } = expenseClaims();
  change('prd', '| claims-requirements-v2.docx, version 2, section 2.2 | • BR-04 |', '| claims-requirements-v2.docx, version 2, section 2.2 | • BR-01 |');
  change('prd', '| • REQ-2.1<br>• REQ-2.3 | Covered |', '| • REQ-2.1<br>• REQ-2.2<br>• REQ-2.3 | Covered |');
  change('prd', '| BR-04 | No claim is paid without its receipts. | • REQ-2.2 | Covered |', '| BR-04 | No claim is paid without its receipts. | None | Gap, question 7 |');
  const r = checkPrd(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 3 of 4 business requirements covered$/m);
});

test('check-prd: a missing PRD, or a missing BRD, exits with code 2', () => {
  const out = tmpOutput();
  assert.strictEqual(checkPrd(out).code, 2);
  const { out: out2 } = expenseClaims();
  fs.unlinkSync(path.join(out2, 'expense-claims', 'expense-claims-brd.md'));
  const r = checkPrd(out2);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /brd/);
});

// ---------------------------------------------------------------- check-discovery-brief

const checkBrief = (out) => run('check-discovery-brief.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-22']);

test('check-discovery-brief: the worked brief passes every check against its sources, and the gate sees what it holds', () => {
  const { out } = expenseClaims();
  const r = checkBrief(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 13 checks\.$/m);
  assert.match(r.out, /^- 7 files, 4 used$/m);
  assert.match(r.out, /^- 11 topics: 1 Agree, 5 One source, 3 Differ, 2 Silent$/m);
  assert.match(r.out, /^- 3 clashes: 2 settled by rank, 1 by a decision$/m);
  assert.match(r.out, /^- Decision 2, question 3: Other: 500\./m);
  // A recommended answer the specifier took is listed too: the client never said it.
  assert.match(r.out, /^- Decision 3, question 5: Only claims already open are finished on paper$/m);
});

// Each planted failure, and the finding it must give. Every one is planted on its own copy.
const BRIEF_FAILURES = [
  ['a missing section', '## 6. Risks and edge cases', '## 6. Risks', /Sections: The section "6\. Risks and edge cases" is missing\./],
  ['a clash with no winner', '| Rank 1: Policy | Employees and contractors can both make a claim. | - |', '|  |  | - |', /Clash 1, "Who can make a claim" has no winner/],
  ['a Silent topic that names no question', '| Silent, question 2 |', '| Silent |', /"How success is measured" is Silent, but names no question\./],
  ['a copy marked Used', '| Approved | No: same as 3 |', '| Approved | Yes |', /File 4, policies\/expense-policy-2026-copy\.pdf: list-sources\.cjs marks it "same as" policies\/expense-policy-2026\.pdf; section 1 says "Yes"\./],
  ['counts at a glance that don\'t add up', '| 7 | 4 | 1 | 1 | 1 |', '| 7 | 5 | 1 | 1 | 1 |', /Summary: "Used" says 5; the tables hold 4\./],
  ['a Differ topic that isn\'t a clash', '| 2 | Approving your own claim |', '| 2 | Approving own claims |', /"Approving your own claim" is marked Differ, but isn't a clash\./],
  ['a clash won by the lower kind', '| Rank 1: Policy | No one approves their own claim. | - |', '| Rank 3: Workshop notes | Team leads can approve their own claims under 50. | - |', /settled by rank 3, but a file of rank 1 is in the clash, and the higher kind wins\./],
  ['an assumption that names no question', 'and no file mentions another currency. Question 4.', 'and no file mentions another currency.', /"Every claim is made in euros" names no question\./],
  ['a topic quoting a file not used', 'per claims-requirements-v2.docx, section 2.2 | One source', 'per claims-requirements-v1.docx, section 2.2 | One source', /"Receipts" quotes claims-requirements-v1\.docx, which isn't marked Used\./],
  ['a file out of scope with no decision', '| No: out of scope, Decision 6 |', '| No: out of scope |', /is out of scope, but names no decision\./],
  ['a question that isn\'t in the Question log', '| Silent, question 2 |', '| Silent, question 42 |', /"How success is measured" names question 42, which isn't in the Question log\./],
];

for (const [what, from, to, finding] of BRIEF_FAILURES) {
  test(`check-discovery-brief: finds ${what}`, () => {
    const { out, change } = expenseClaims();
    change('discovery-brief', from, to);
    const r = checkBrief(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

test('check-discovery-brief: finds a file in sources/ that section 1 misses', () => {
  const { out } = expenseClaims();
  write(path.join(out, 'expense-claims', 'sources', 'emails', 'finance-reply-2026-10-01.eml'), 'a late reply\n');
  const r = checkBrief(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /emails\/finance-reply-2026-10-01\.eml is in sources\/ but not in section 1\./);
});

test('check-discovery-brief: a file proposed as out of scope waits for the gate, and is shown as waiting', () => {
  const { out, change } = expenseClaims();
  change('discovery-brief', '| No: out of scope, Decision 6 |', '| No: out of scope, to be decided at the gate |');
  const r = checkBrief(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 1 file proposed as out of scope, to be decided at the gate$/m);
});

test('check-discovery-brief: a file still waiting for its decision once the brief is accepted is a finding', () => {
  const { out, change } = expenseClaims();
  change('discovery-brief', '| No: out of scope, Decision 6 |', '| No: out of scope, to be decided at the gate |');
  change('discovery-brief', 'Status: drafted', 'Status: accepted on 2026-10-02, version 1');
  const r = checkBrief(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /travel-booking-policy-2026\.pdf, still waits for its decision, but the brief is accepted\./);
});

test('check-discovery-brief: a missing sources/ folder exits with code 2', () => {
  const { out } = expenseClaims();
  fs.rmSync(path.join(out, 'expense-claims', 'sources'), { recursive: true });
  assert.strictEqual(checkBrief(out).code, 2);
});

// ---------------------------------------------------------------- the skills and the workflow

const SKILLS = path.join(KIT, '.claude', 'skills');

test('requirements-workflow: its steps are the master plan\'s Workflow 1 table, step for step', () => {
  const md = require('../lib/md-tables.cjs');
  const plan = md.tableUnder(path.join(KIT, 'master-plan.md'), 'Workflow 1: `requirements-workflow`');
  const skill = md.tableUnder(path.join(SKILLS, 'requirements-workflow', 'SKILL.md'), 'The steps');
  const pick = (rows, check, gate) => rows.map((r) => [r.Step, r['Done by'], r['Previous step'].replace(/you bring/, 'the specifier brings'), r.Reads, r['Looks up by ID'], r.Writes, r[check], r[gate], r['Next step']].map((c) => JSON.stringify(c)).join(' | '));
  assert.deepStrictEqual(pick(skill, 'Check before the gate', 'Gate'), pick(plan, 'Check before your gate', 'Your gate'));
});

test('the Requirements workflow skills: each has its name, a description, its opening block, and every file it points to exists', () => {
  for (const name of ['probing-questions-author', 'discovery-author', 'brd-author', 'prd-author', 'requirements-workflow']) {
    const dir = path.join(SKILLS, name);
    const text = readText(path.join(dir, 'SKILL.md'));
    assert.match(text, new RegExp(`^---\\nname: ${name}\\n`), `${name}: the name line`);
    assert.match(text, /\ndescription: >-\n {2}\S/, `${name}: the description`);
    for (const m of ['> **What this is:**', '> **What it is not:**', '> **Who uses it:**']) assert.ok(text.includes(m), `${name}: ${m}`);
    for (const ref of text.matchAll(/`((?:\.\.\/_shared|references)\/[^`]+\.md)`/g)) {
      assert.ok(fs.existsSync(path.join(dir, ref[1])), `${name}: ${ref[1]} doesn't exist`);
    }
    for (const prog of text.matchAll(/`(?:node )?tools\/([a-z-]+\.cjs)/g)) {
      assert.ok(fs.existsSync(path.join(TOOLS, prog[1])), `${name}: tools/${prog[1]} doesn't exist`);
    }
    const { lint } = require('../lib/md-lint.cjs');
    assert.deepStrictEqual(lint(text.replace(/^---\n[\s\S]*?\n---\n/, '')), [], `${name}: renders`);
  }
});

test('requirements-workflow: picking up is the normal mode, and it starts again from nothing only when asked in words, after a yes', () => {
  const text = readText(path.join(SKILLS, 'requirements-workflow', 'SKILL.md'));
  assert.doesNotMatch(text, /By default it is step 1/);
  const runs = text.split('## How it runs')[1].split('\n## ')[0];
  assert.match(runs, /\*\*Picking up is the normal mode\.\*\* Start at the first step whose document isn't accepted yet/);
  assert.match(runs, /A plain "run the requirements workflow" never starts again from nothing/);
  const fresh = text.split('## Starting again from nothing')[1].split('\n## ')[0];
  assert.match(fresh, /It happens only when the specifier asks for it in words/);
  // It shows what will move, then asks for a yes, as multiple choice, and only then moves anything.
  const show = fresh.search(/\*\*Show what will move\.\*\*/);
  const ask = fresh.search(/\*\*Ask for a yes,\*\* as multiple choice/);
  const move = fresh.search(/\*\*Move them, by hand\.\*\*/);
  assert.ok(show > 0 && ask > show && move > ask, 'it shows what will move, asks for a yes, then moves');
  assert.match(fresh, /Any answer but the first moves nothing\./);
  assert.match(fresh, /No program does this move yet/);
  // The same rule, and the same place, wherever the kit says it.
  const place = /every file and folder in `Output\/\{project\}\/` except `sources\/`,? (moves )?to `_archive\/Output-\{date\}\/\{project\}\/`/i;
  assert.match(fresh, /List every file and folder in `Output\/\{project\}\/` except `sources\/`/);
  assert.match(fresh, /`_archive\/Output-\{date\}\/\{project\}\/`, at the top of the kit/);
  for (const f of [path.join(SKILLS, '_shared', 'conventions.md'), path.join(SKILLS, 'probing-questions-author', 'SKILL.md'), path.join(KIT, 'README.md')]) {
    const t = readText(f);
    assert.match(t, /only when (the specifier asks|you ask) for it in words/, f);
    assert.match(t, place, f);
    assert.match(t, /No program does this move yet/, f);
  }
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
