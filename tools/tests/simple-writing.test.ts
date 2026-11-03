#!/usr/bin/env node
// Tests for simple writing: the rules file, lib/simple-writing.ts, check-simple-writing.ts, and the kit's own text.
//
//   node tools/tests/simple-writing.test.ts
//
// Every test that writes works in a temporary folder. Nothing in the kit is changed.

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { check as checkWriting, RULES } from '../lib/simple-writing.ts';
import { requirementsOf } from '../lib/check-document.ts';
import { tableUnder, list } from '../lib/md-tables.ts';
import { KIT, SHARED, readText, test, run, tempDir, copyDir, report } from './helpers/harness.ts';

type WritingResult = ReturnType<typeof checkWriting>;
type WritingOptions = Parameters<typeof checkWriting>[1];

function walk(dir: string): string[] {
  let out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

const kinds = (r: WritingResult): string[] => r.toFix.map((x) => x.kind);
const fix = (text: string, opts?: WritingOptions): WritingResult['toFix'] => checkWriting(text, opts).toFix;
const look = (text: string, opts?: WritingOptions): WritingResult['toLook'] => checkWriting(text, opts).toLook;

// ---------------------------------------------------------------- the rules file

test('the rules file has its three word lists and its kit names, and every row has words and what to say instead', () => {
  for (const heading of ['Hard words', 'Figures of speech', 'Pointing words']) {
    const rows = tableUnder(RULES, heading);
    assert.ok(rows && rows.length, `no "${heading}" list`);
    for (const r of rows) {
      assert.ok(list(r['Word or phrase']).length, `${heading}: a row has no word`);
      assert.ok(list(r['Say instead']).length, `${heading}: ${list(r['Word or phrase'])[0]} says nothing to write instead`);
    }
  }
  assert.ok((tableUnder(RULES, 'Kit names kept for now') || []).length, 'no "Kit names kept for now" list');
});

test('the rules file has its "Words that can\'t be checked" list: each word is found, and passes in a line that names its question', () => {
  const rows = tableUnder(RULES, "Words that can't be checked");
  assert.ok(rows && rows.length, 'no "Words that can\'t be checked" list');
  const words = rows.flatMap((r) => list(r['Word or phrase']));
  for (const w of ['etc.', 'and so on', 'as needed', 'properly']) assert.ok(words.includes(w), `the list has no "${w}"`);
  for (const r of rows) {
    assert.ok(list(r['Say instead']).length, `${list(r['Word or phrase'])[0]} says nothing to write instead`);
    for (const w of list(r['Word or phrase'])) {
      assert.deepStrictEqual(kinds(checkWriting(`Claims are checked ${w}.\n`)), ["word that can't be checked"], w);
      assert.deepStrictEqual(fix(`Claims are checked ${w}, question 9.\n`), [], w);
    }
  }
});

test('every author skill points to the rules file', () => {
  const skills = ['discovery-author', 'brd-author', 'prd-author', 'probing-questions-author', 'glossary-author', 'glossary-check', 'glossary-disposition', 'feature-author', 'epic-grouping-author', 'epic-author', 'frd-author', 'story-drafter', 'story-groomer', 'ac-author', 'change-request-disposition', 'change-impact-author', 'feature-impact', 'adversarial-check'];
  for (const s of skills) assert.ok(readText(path.join(KIT, '.claude', 'skills', s, 'SKILL.md')).includes('simple-writing-rules.md'), `${s} doesn't point to simple-writing-rules.md`);
});

// ---------------------------------------------------------------- what the check finds

test('it finds a hard word, a figure of speech, a pointing word, a semicolon and a side note, each with what to say instead', () => {
  assert.deepStrictEqual(kinds(checkWriting('The address is read-only.\n')), ['hard word']);
  assert.deepStrictEqual(kinds(checkWriting('Every order carries a number.\n')), ['figure of speech']);
  assert.deepStrictEqual(kinds(checkWriting('Addresses are managed in one place.\n')), ['pointing word']);
  assert.deepStrictEqual(kinds(checkWriting('A customer pays; the order moves on.\n')), ['semicolon']);
  assert.deepStrictEqual(kinds(checkWriting('The order — once it is paid — moves on.\n')), ['side note']);
  assert.deepStrictEqual(kinds(checkWriting('The order (paid, packed and labelled) is sent.\n')), ['side note']);
  assert.match(fix('The address is read-only.\n')[0].what, /Say instead: can be seen, but not changed\./);
});

test('a sentence over 20 words is only to look at, never to fix', () => {
  const long = 'A customer pays for the order and the order then moves to packing where a free picker takes it and packs it for the courier.\n';
  assert.deepStrictEqual(fix(long), []);
  assert.deepStrictEqual(look(long).map((x) => x.kind), ['long sentence']);
});

test('in a table, it checks each cell and each item of a list on its own, and names the row and column', () => {
  const t = '| ID | Rule |\n|---|---|\n| R-1 | • only while Open<br>• refused here |\n';
  const f = fix(t);
  assert.deepStrictEqual(f.map((x) => x.where), ['R-1, Rule']);
  assert.strictEqual(f[0].n, 3);
});

// ---------------------------------------------------------------- what the check allows on purpose

test('it allows the kit\'s own formats: "there is", labels and citations after a dash, a heading\'s dash and the kit\'s bracket labels', () => {
  const ok = [
    'There is no default provider.',
    '- **Accept** — Why you\'d pick it: everything matches.',
    '| F-03.dw1 — Each manager sees every claim waiting for them |',
    '| Penalty — paying an unapproved claim breaks the policy |',
    '| proposed — Why: no file says |',
    '| Does not apply — the PRD never removes a claim |',
    '- The payroll run pays approved claims — per payroll-cutoff.eml',
    '- Every claim is made in euros — Proposed (needs confirmation), question 4',
    '- Every claim is made in euros — why: every amount in the files is in euros. Question 4.',
    '- F-01 Send a claim — owned by EPIC-001',
    '### Decision 2 — Which currencies can a claim be made in?',
    '| 1 | Approve a Claim (Work Item ID pending) |',
    '| | Claim (also written as: request for payment) |',
  ];
  for (const line of ok) assert.deepStrictEqual(fix(`${line}\n`), [], line);
});

test('it allows a dash after a "data model" source label, as an FRD rule\'s Source cell gives it, and finds a side note after other words', () => {
  const rules = '| Rule | The system shall… | Source |\n|---|---|---|\n';
  for (const source of ['data model — Claim, Approve over the limit', 'data model — Claim, Draft → Submitted', 'data model — Claim, amount<br>The finance team asked for it.']) {
    assert.deepStrictEqual(fix(`${rules}| F-05.4 | **only** send a claim to a finance approver when it is over 500 | ${source} |\n`), [], source);
  }
  assert.deepStrictEqual(fix('- data model — Claim, Approve over the limit\n'), []);
  // Only the label at the start of the cell: words before it, or a second dash after it, are a side note.
  assert.deepStrictEqual(fix(`${rules}| F-05.4 | **only** send a claim to a finance approver when it is over 500 | the data model — Claim, Approve over the limit |\n`).map((x) => `${x.where}: ${x.kind}`), ['F-05.4, Source: side note']);
  assert.deepStrictEqual(fix(`${rules}| F-05.4 | **only** send a claim to a finance approver when it is over 500 | data model — Claim — the limit row |\n`).map((x) => `${x.where}: ${x.kind}`), ['F-05.4, Source: side note']);
});

test('it skips code, quotes, link targets, the columns it is told to skip, and the Placeholders and Check record sections', () => {
  assert.deepStrictEqual(fix('Run `read-only` here as code.\n').map((x) => x.kind), ['pointing word']);
  assert.deepStrictEqual(fix('The file says "managed in one place".\n'), []);
  assert.deepStrictEqual(fix('See [the page](here-and-there.md).\n'), []);
  assert.deepStrictEqual(fix('| ID | The client\'s words |\n|---|---|\n| R-1 | managed in one place |\n', { skipColumns: ["The client's words"] }), []);
  assert.deepStrictEqual(fix('## Placeholders\n\nAnything here; carries.\n\n## Check record\n\nAnything here; carries.\n'), []);
});

test('it allows an agreed Glossary word, and the kit names kept for now', () => {
  assert.deepStrictEqual(kinds(checkWriting('Every artifact is exported.\n')), ['hard word']);
  assert.deepStrictEqual(fix('Every Artifact is exported.\n', { allow: ['Artifact'] }), []);
  assert.deepStrictEqual(fix('## Families at a glance (index)\n'), []);
});

// ---------------------------------------------------------------- the PRD's two columns

test('with compare, it shows a copy, a lost number and a lost "no" to look at, and fixes nothing for them', () => {
  const t = '| ID | In simple words | The client\'s words |\n|---|---|---|\n'
    + '| R-1 | Customers pay within 5 days. | Customers pay within 5 days. |\n'
    + '| R-2 | Customers pay quickly. | Customers pay within 5 days, and no refunds are given. |\n';
  const r = checkWriting(t, { skipColumns: ["The client's words"], compare: ['In simple words', "The client's words"] });
  assert.deepStrictEqual(r.toFix, []);
  assert.deepStrictEqual(r.toLook.map((x) => `${x.where} ${x.kind}`), ['R-1 copied', 'R-2 number', 'R-2 condition']);
});

test('a word that can\'t be checked is found in the simple words, not in the client\'s words, and passes when its question is named', () => {
  const t = '| ID | In simple words | The client\'s words |\n|---|---|---|\n'
    + '| R-1 | Staff restock the shelves as needed. | Staff restock the shelves as needed. |\n'
    + '| R-2 | Staff restock the shelves as needed, question 9. | Staff restock the shelves as needed. |\n';
  const r = checkWriting(t, { skipColumns: ["The client's words"] });
  assert.deepStrictEqual(r.toFix.map((x) => `${x.where}: ${x.kind}`), ["R-1, In simple words: word that can't be checked"]);
});

test('"and so on" is found, unless 2 items before it show the pattern', () => {
  assert.deepStrictEqual(kinds(checkWriting('The shop sells shoes, bags and so on.\n')), ["word that can't be checked"]);
  assert.deepStrictEqual(fix('IDs run F-01, F-02 and so on.\n'), []);
  assert.deepStrictEqual(fix('Rows are `G1-01`, `G1-02` and so on.\n'), []);
});

test('requirementsOf reads a row\'s kind, and reads a PRD with no Kind column as all Requirement rows', () => {
  const rows = requirementsOf('## 4. Requirements\n\n| ID | Kind | In simple words | The client\'s words | Source | Traces to |\n|---|---|---|---|---|---|\n| R-1 | Requirement | a | a | f, version 1 | • BR-01 |\n| R-2 | Scope | b | b | f, version 1 | • BRD section 4 |\n');
  assert.deepStrictEqual(rows.map((r) => [r.kind, r.hasKind, r.isRequirement]), [['Requirement', true, true], ['Scope', true, false]]);
  const none = requirementsOf('## 4. Requirements\n\n| ID | In simple words | The client\'s words | Source | Traces to |\n|---|---|---|---|---|\n| R-1 | a | a | f, version 1 | • BR-01 |\n');
  assert.deepStrictEqual(none.map((r) => [r.kind, r.hasKind, r.isRequirement]), [['Requirement', false, true]]);
});

test('requirementsOf reads a PRD in the new form and in the old form, and says which', () => {
  const now = requirementsOf('## 4. Requirements\n\n| ID | In simple words | The client\'s words | Source | Traces to |\n|---|---|---|---|---|\n| R-1 | **A** — simple | **A** — client | f, version 1 | • BR-01 |\n');
  assert.deepStrictEqual(now.map((r) => [r.simple, r.client, r.oldForm]), [['**A** — simple', '**A** — client', false]]);
  const old = requirementsOf('## 4. Requirements, word for word\n\n| ID | Requirement as written | Source | Traces to |\n|---|---|---|---|\n| R-1 | **A** — client | f, version 1 | • BR-01 |\n');
  assert.deepStrictEqual(old.map((r) => [r.simple, r.client, r.oldForm]), [['**A** — client', '**A** — client', true]]);
});

// ---------------------------------------------------------------- the kit's own text

test('every template, Glossary template and example follows the rules, its Placeholders table included', () => {
  const files = [...walk(path.join(SHARED, 'templates')), ...walk(path.join(SHARED, 'glossary', 'templates')), ...walk(path.join(SHARED, 'examples'))];
  const found: string[] = [];
  for (const f of files) {
    const text = readText(f).replace(/^## Placeholders[ \t]*$/m, '## Placeholder labels');
    for (const x of fix(text, { skipColumns: ["The client's words", 'Before', 'After'] })) found.push(`${path.relative(SHARED, f)}, line ${x.n}: ${x.what}`);
  }
  assert.deepStrictEqual(found, []);
});

// ---------------------------------------------------------------- check-simple-writing.ts

test('check-simple-writing.ts: exits 1 with something to fix, 0 with nothing, and 2 when the file is missing', () => {
  const dir = tempDir('simple');
  fs.writeFileSync(path.join(dir, 'hard.md'), '# Hard\n\nThe address is read-only.\n');
  fs.writeFileSync(path.join(dir, 'simple.md'), '# Simple\n\nThe address can be seen, but not changed.\n');
  const hard = run('check-simple-writing.ts', ['--file', path.join(dir, 'hard.md')]);
  assert.strictEqual(hard.code, 1);
  assert.match(hard.out, /Simple writing, hard\.md: 1 to fix, 0 to look at\./);
  assert.match(hard.out, /- line 3, the top: "read-only"\. Say instead: can be seen, but not changed\./);
  assert.strictEqual(run('check-simple-writing.ts', ['--file', path.join(dir, 'simple.md')]).code, 0);
  assert.strictEqual(run('check-simple-writing.ts', ['--file', path.join(dir, 'missing.md')]).code, 2);
});

test('check-simple-writing.ts: --skip-column skips the column it names, its name included, and no other', () => {
  const dir = tempDir('simple');
  const file = path.join(dir, 'two-columns.md');
  fs.writeFileSync(file, '# Two columns\n\n| ID | The client\'s words | In simple words; for now |\n|---|---|---|\n| R-1 | The address is read-only. | The address can be seen, but not changed. |\n');
  const all = run('check-simple-writing.ts', ['--file', file]);
  assert.strictEqual(all.code, 1);
  assert.match(all.out, /^- line 5, R-1, The client's words: "read-only"\. Say instead: can be seen, but not changed\.$/m);
  assert.match(all.out, /^- line 3, the top, a column name: a semicolon joins two ideas\. Split them\.$/m);
  const skipped = run('check-simple-writing.ts', ['--file', file, '--skip-column', "The client's words"]);
  assert.strictEqual(skipped.code, 1);
  assert.match(skipped.out, /Simple writing, two-columns\.md: 1 to fix, 0 to look at\./);
  assert.doesNotMatch(skipped.out, /read-only/);
  const both = run('check-simple-writing.ts', ['--file', file, '--skip-column', "The client's words", '--skip-column', 'In simple words; for now']);
  assert.strictEqual(both.code, 0, both.out);
  // A name that isn't a column skips nothing.
  assert.match(run('check-simple-writing.ts', ['--file', file, '--skip-column', 'Words']).out, /2 to fix/);
});

// ---------------------------------------------------------------- check-register.ts

// The Expense claims project: the worked examples and the later documents in fixtures/expense-claims/.
function expenseClaims(): { out: string; read: (rel: string) => string; change: (rel: string, from: string, to: string) => void } {
  const out = tempDir('simple');
  const dir = path.join(out, 'expense-claims');
  copyDir(path.join(KIT, 'fixtures', 'expense-claims'), dir);
  for (const d of ['discovery-brief', 'brd', 'prd', 'question-log']) fs.copyFileSync(path.join(SHARED, 'examples', `${d}.md`), path.join(dir, `expense-claims-${d}.md`));
  const read = (rel: string): string => readText(path.join(dir, rel));
  const change = (rel: string, from: string, to: string): void => {
    const t = read(rel);
    assert.strictEqual(t.split(from).length - 1, 1, `"${from}" isn't in ${rel} once`);
    fs.writeFileSync(path.join(dir, rel), t.replace(from, to));
  };
  return { out, read, change };
}
const REGISTER = 'epics/register.md';
const registerArgs = (out: string): string[] => ['--project', 'expense-claims', '--output', out, '--date', '2026-10-22'];

test('check-register: it runs the simple-writing check, and a place to look at never fails it', () => {
  const { out } = expenseClaims();
  const r = run('check-register.ts', registerArgs(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  // EPIC-001's outcome is a sentence of 22 words.
  assert.match(r.out, /^Simple writing: 0 to fix, 1 to look at\.$/m);
});

test('check-register: a hard word in the register fails it, though the copy matches, and the check date is left alone', () => {
  const { out, read, change } = expenseClaims();
  change(REGISTER, '- **Based on:** BRD and PRD both accepted', '- **Based on:** BRD and PRD both accepted, and kept read-only');
  const r = run('check-register.ts', registerArgs(out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /^check-register\.ts, 2026-10-22: the register matches the chosen grouping, but its simple writing has 1 place to fix\.$/m);
  assert.match(r.out, /^Simple writing: 1 to fix, 1 to look at\.$/m);
  assert.match(r.out, /^- Line 7, the top: "read-only"\. Say instead: can be seen, but not changed\.$/m);
  assert.match(read(REGISTER), /^- \*\*Copy checked on:\*\* not yet$/m);
});

// ---------------------------------------------------------------- report

report();
