#!/usr/bin/env node
// Tests for the data model: check-data-model.ts, lib/data-model.ts, what accept.ts and version-log.ts save with
// it, and its workflow's place in the master plan.
//
//   node tools/tests/data-model.test.ts
//
// Every test works on a copy in a temporary folder. Nothing in fixtures/ or Output/ is changed.
// The small City library files built in the lib/data-model.ts tests are test scaffolding, not project content.

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { tableUnder, list } from '../lib/md-tables.ts';
import type { Row } from '../lib/md-tables.ts';
import {
  load, readThings, readFile, statusOf, cell, typeOf, moveName, actionsAndMoves, things, readDecisions, decisionsOf, stillOpen,
} from '../lib/data-model.ts';
import { slug, LayoutError } from '../lib/run-paths.ts';
import { retiredWords, currentTerms, scan } from '../lib/scan-retired-words.ts';
import { KIT, TOOLS, SKILLS, readText, test, run, tempDir, report } from './helpers/harness.ts';
import type { RunResult } from './helpers/harness.ts';
import { expenseClaims } from './helpers/projects.ts';
import type { TestProject } from './helpers/projects.ts';

const PLAN = path.join(KIT, 'master-plan.md');
const DATE = '2026-10-22';

const columnsOf = (rows: Row[]): string[] => Object.keys(rows[0]).filter((c) => c !== '_heading');

// The Expense claims project: the worked examples, then the later documents in fixtures/expense-claims/, the data
// model among them. change(rel, from, to) plants one failure; from must be found exactly once.
const project = (): TestProject => expenseClaims('data-model');

const THINGS = 'glossary/data-models/expense-claims-glossary-things.md';
const CLAIMS = 'glossary/data-models/claims.md';
const DECISIONS = 'glossary/data-models/expense-claims-data-model-decisions.md';
const OBJECTS = 'glossary/object-terms.md';

// check-data-model.ts on the things file, or, with a family, on that family's data model file.
function check(out: string, family?: string | null): RunResult {
  return run('check-data-model.ts', ['--project', 'expense-claims', '--output', out, '--date', DATE, ...(family ? ['--family', family] : [])]);
}
// The findings, as the Check record lists them.
const findingsOf = (r: RunResult): string[] => (r.out.split('\nFor the file:\n')[1] || '').split('\n').filter((l) => l.startsWith('- '));

// ---------------------------------------------------------------- the workflow

test('data-model-workflow: its steps are the master plan\'s data model table, step for step', () => {
  const plan = tableUnder(PLAN, 'The data model: `data-model-workflow`');
  const skill = tableUnder(path.join(SKILLS, 'data-model-workflow', 'SKILL.md'), 'The steps');
  assert.ok(plan && plan.length, 'the master plan has no table for data-model-workflow');
  assert.ok(skill && skill.length, 'data-model-workflow has no table of its steps');
  // The plan's table has the same columns as every other workflow's table in the plan.
  assert.deepStrictEqual(columnsOf(plan), columnsOf(tableUnder(PLAN, 'Workflow 2: `features-and-epics-workflow`')!));
  // Every column the skill's table has is compared, by the plan's name for it.
  const inPlan: Record<string, string> = { Gates: 'Your gate', Gate: 'Your gate', 'Check before the gate': 'Check before your gate' };
  const columns = columnsOf(skill);
  const pick = (rows: Row[], name: (c: string) => string): string[] => rows.map((r) => columns.map((c) => JSON.stringify(r[name(c)])).join(' | '));
  assert.deepStrictEqual(pick(skill, (c) => c), pick(plan, (c) => inPlan[c] || c));
});

const DESIGN = path.join(SKILLS, '_shared', 'data-model-design.md');
const DM_SKILLS = ['data-model-workflow', 'things-author', 'data-model-author'].map((s) => path.join(SKILLS, s, 'SKILL.md'));
const DM_TEMPLATES = ['data-model', 'data-model-things', 'data-model-decisions'].map((t) => path.join(SKILLS, '_shared', 'templates', `${t}.md`));

test('data-model-design: "Where each gap goes" sends nothing back to the requirements, and two requirements that disagree are a decision', () => {
  const rows = tableUnder(DESIGN, 'Where each gap goes')!;
  assert.strictEqual(rows.length, 7);
  const where = (n: number): string => list(rows[n - 1]['Where it goes']).join(' ');
  for (const r of rows) {
    const to = list(r['Where it goes']).join(' ');
    assert.doesNotMatch(to, /change to the requirements|requirement-update-workflow|\bRC-/, `row ${list(r['#']).join('')}`);
    assert.doesNotMatch(list(r['Does the PRD change?']).join(' '), /^Yes\b/, `row ${list(r['#']).join('')}`);
  }
  assert.match(where(4), /^A data model decision, asked at gate 2\. Its options are the answers the requirements give\./);
  assert.match(where(3), /together, in one run/);
  assert.match(where(7), /only when the Glossary names it/);
  assert.match(where(7), /`feature-author` then decides, at the Feature catalog's gate/);
  const text = readText(DESIGN);
  assert.match(text, /\*\*A gap that fits two rows\*\* goes to the first that fits, in this order: row 7, row 3, row 5\. Any other gap is a data model decision: row 1, 2, 4 or 6\./);
  assert.match(text, /The answers in rows 1, 2, 4 and 6 are the person's/);
});

test('the data model\'s skills, design, templates and programs never name a change to the requirements', () => {
  const found: string[] = [];
  for (const f of [DESIGN, ...DM_SKILLS, ...DM_TEMPLATES]) {
    readText(f).split('\n').forEach((l, i) => {
      if (/\bRC-|Waiting on a change|Raised as change|^#+ Changes to the requirements|requirement-update-workflow`?, once for each/.test(l)) found.push(`${path.relative(KIT, f)}:${i + 1}`);
    });
  }
  for (const p of ['check-data-model.ts', path.join('lib', 'data-model.ts'), 'status.ts', 'recommend.ts']) {
    readText(path.join(TOOLS, p)).split('\n').forEach((l, i) => {
      if (/\bRC\b|RC-|waitingOnChange|raisedAs|changes to the requirements/i.test(l)) found.push(`tools/${p}:${i + 1}`);
    });
  }
  assert.deepStrictEqual(found, []);
});

test('the batch: glossary-disposition settles the data model\'s Glossary changes in one run, with only the answers that fit, and glossary-author adds the new words from a request', () => {
  const disposition = path.join(SKILLS, 'glossary-disposition', 'SKILL.md');
  const answers = (tableUnder(disposition, 'A batch of Glossary changes from the data model') || []).map((r) => list(r.Answer).join(' '));
  assert.deepStrictEqual(answers, ['change the Glossary', 'add new words', 'I don\'t know yet']);
  const batch = readText(disposition).split('## A batch of Glossary changes from the data model')[1].split('\n## ')[0];
  assert.match(batch, /Settle the whole batch in one run\./);
  assert.match(batch, /Never offer "fix the document"/);
  assert.match(batch, /never goes into the Question log/);
  assert.match(batch, /send every "add new words" answer to \*\*glossary-author\*\* as one batch, in its mode "add words from a request"/);
  const author = readText(path.join(SKILLS, 'glossary-author', 'SKILL.md'));
  assert.match(author, /^1\. \*\*Mode\.\*\* First, a batch of new words from glossary-disposition → adding words from a request\./m);
  const add = author.split('## Add words from a request')[1].split('\n## ')[0];
  assert.match(add, /evidence: what the Glossary, the BRD and the PRD say about it/);
  assert.match(add, /\*\*Gate 1, on those words only\.\*\*/);
  assert.match(add, /A word the sources don't name is never invented\. It stays open, and is reported back/);
  // The workflow's step 3 runs glossary-disposition once, for the whole batch.
  const step3 = tableUnder(path.join(SKILLS, 'data-model-workflow', 'SKILL.md'), 'The steps')![2];
  assert.strictEqual(list(step3['Done by']).join(' '), '`glossary-disposition`, once, with every Glossary change as one batch');
  assert.deepStrictEqual(list(step3.Gate).slice(1), ['change the Glossary', 'add new words, through `glossary-author` and its gates', 'I don\'t know yet']);
});

test('the re-asking: things-author and data-model-author ask again what is still open, first, and paste the check before accept.ts', () => {
  for (const f of DM_SKILLS.slice(1)) {
    const t = readText(f);
    const steps = [...t.matchAll(/^### (\d+)\. (.+)$/gm)].map((m) => `${m[1]}. ${m[2]}`);
    assert.deepStrictEqual(steps.slice(0, 4), ['1. Mode', '2. Set up', '3. Ask again what is still open', '4. Read the sources'], f);
    const ask = t.split('### 3. Ask again what is still open')[1].split('\n### ')[0];
    assert.match(ask, /`node tools\/status\.ts --project \{project\}`\. Its block "Data model, still open" lists each entry/, f);
    assert.match(ask, /answered "I don't know yet"/, f);
    assert.match(ask, /left open: ask whether to send it to the Glossary again, with "Send it with the next batch" recommended, and "I don't know yet"/, f);
    // The check's result goes into the Check record before accept.ts saves the file, never after.
    const gate = t.split(/^### \d+\. The gate$/m)[1].split('\n## ')[0];
    const paste = gate.search(/paste its "For the file" block/i);
    const accept = gate.search(/run `node tools\/accept\.ts/i);
    assert.ok(paste > 0 && accept > paste, `${f}: the Check record is pasted before accept.ts`);
    assert.match(gate, /Do this before `accept\.ts`, never after\./, f);
  }
  assert.match(readText(DESIGN), /\*\*What is still open is asked again first\.\*\*/);
});

test('data-model-workflow: picking up covers each entry still open, and a settled answer a file still shows, and names the skill for each', () => {
  const modes = readText(DM_SKILLS[0]).split('1. **Find the mode and the starting step.**')[1].split('\n2. **Step 1:**')[0];
  const rows = [
    /^ {3}- a product-wide decision answered "I don't know yet", or a Glossary change raised from the things file and marked "Left open on \{date\}" → picking up: start at step 1, for that entry\. `things-author` asks it again first\./m,
    /^ {3}- a decision of one family's own, answered "I don't know yet", or a Glossary change raised from that family's file and marked "Left open on \{date\}" → picking up: start at step 2, for that family only\. `data-model-author` asks it again first\.$/m,
    /^ {3}- a product-wide decision now settled, while a family's file still shows its "\? \(DM-\{n\}\)" → picking up: start at step 2, for that family only\. `data-model-author` writes the answer into those cells, in a change\.$/m,
  ];
  for (const r of rows) assert.match(modes, r);
  // Each comes before "nothing to do", and a run asks each entry once, so an answer of "I don't know yet" holds up no step.
  for (const r of rows) assert.ok(modes.search(r) < modes.search(/^ {3}- none of these → nothing to do/m), String(r));
  assert.match(modes, /A run asks each entry still open once\./);
  assert.match(modes, /It holds up no other step\./);
  // data-model-author: a settled product-wide decision whose "? (DM-n)" the file still shows is picking up.
  const mode = readText(DM_SKILLS[2]).split('### 1. Mode')[1].split('\n### ')[0];
  assert.match(mode, /^- the file is accepted, and a product-wide decision is now settled, while this file still shows its "\? \(DM-\{n\}\)" → picking up\. This is not "nothing to do"\. Write the settled answer in place of each "\? \(DM-\{n\}\)"/m);
});

// ---------------------------------------------------------------- check-data-model: the sample passes

test('check-data-model: the Expense claims things file passes every check, and so does claims.md', () => {
  const { out } = project();
  let r = check(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 19 checks\.$/m);
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 28 checks\.$/m);
  // The answer in use for question 4 is on the list for the client.
  assert.match(r.out, /^- Claim: amount: in euros, Proposed \(needs confirmation\), question 4$/m);
  // --family takes the file's name with or without ".md".
  assert.strictEqual(check(out, 'claims.md').code, 0);
});

test('check-data-model: before the gate, it says what the draft holds, the decisions file included', () => {
  const { out, change } = project();
  change(THINGS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted');
  let r = check(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.ok(r.out.includes('What the draft holds:\n- 1 family, with 3 things\n- 3 words left out\n- 0 product-wide decisions open, and 0 words waiting on the Glossary\n- The decisions file: 0 open decisions, 9 settled decisions and 0 Glossary changes\n'), r.out);
  change(THINGS, 'Status: drafted', 'Status: accepted on 2026-10-11, version 1');
  change(CLAIMS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.ok(r.out.includes('What the draft holds:\n- 3 things, and 0 things of an earlier family it adds to\n- 19 actions, 4 fields and 5 moves\n- 0 open decisions for this file, and 1 answer marked Proposed\n- 0 waiting on the Glossary\n'), r.out);
});

// ---------------------------------------------------------------- check-data-model: the things file's checks

// Each row: what is planted, the file it goes in, the text found exactly once, what replaces it, and the finding.
const THINGS_FAILURES: [string, string, string, string, RegExp][] = [
  ['a title that isn\'t the template\'s', THINGS, '# Things — Expense claims', '# The things — Expense claims', /^- Opening: The title should start "Things — "\.$/m],
  ['an opening note', THINGS, '# Things — Expense claims\n', '# Things — Expense claims\n\n> **What this is:** the things of Expense claims.\n', /^- Opening: The document still has the opening note "What this is"/m],
  ['a status line that isn\'t straight under the title', THINGS, '# Things — Expense claims\n', '# Things — Expense claims\n\nThe things of Expense claims.\n', /^- Opening: The status line should come straight after the title\.$/m],
  ['a status line in the earlier form', THINGS, 'Status: accepted on 2026-10-11, version 1', 'Status: Accepted on 2026-10-11', /^- Opening: The status line reads "Accepted on 2026-10-11"\. Write the kit's status line/m],
  ['no "Next step" line', THINGS, 'Next step: None: the things are accepted.\n', '', /^- Next step: There is no "Next step" line under the status line\.$/m],
  ['an accepted file whose "Next step" line isn\'t "None"', THINGS, 'Next step: None: the things are accepted.', 'Next step: accept the things', /^- Next step: The file is accepted, so its "Next step" line should start "None"\.$/m],
  ['a section that names no data model file', THINGS, '## Check record', '## Notes\n\nSome notes.\n\n## Check record', /^- Sections: The section "Notes" names no data model file\./m],
  ['a thing that isn\'t a Glossary term', THINGS, '| Receipt | what it is', '| Receipts | what it is', /^- 1\. The things file covers the Glossary: Claims: Receipts isn't a Glossary term, word for word\.$/m],
  ['a Glossary object that is neither a thing nor a word left out', THINGS, '| Receipt | what it is, in one plain sentence |\n', '', /^- 1\. The things file covers the Glossary: Receipt has nothing above it in the Glossary, so it is a thing, a word left out, or a word waiting on the Glossary\. It is none of these\.$/m],
  ['a data model file not named after its family', THINGS, 'Data model file: [claims.md](claims.md)', 'Data model file: [claim.md](claim.md)', /^- 1\. The things file covers the Glossary: Claims: its data model file should be named claims\.md\.$/m],
  ['a word left out with no reason', THINGS, 'Left out: Claimant (no details kept), Line manager (no details kept), Finance approver (no details kept)', 'Left out: Claimant', /^- 1\. The things file covers the Glossary: Claims: each word left out says why, in brackets/m],
  ['a definition that isn\'t the Glossary\'s, word for word', THINGS, '| Claim | what it is, in one plain sentence |', '| Claim | what it is, in one short sentence |', /^- 8\. Things and definitions are the Glossary's: Claim: its definition isn't the Glossary's, word for word\.$/m],
  ['a "Kind of" line that isn\'t in the template\'s form', THINGS, 'Left out:', 'Kind of:\n\n- Receipt, a kind of Claim\n\nLeft out:', /^- 10\. Every "kind of" is listed: Claims: "Receipt, a kind of Claim" should read "\{thing\}, one kind of \{other thing\}"/m],
  ['a "Kind of" line for a thing the family hasn\'t got', THINGS, 'Left out:', 'Kind of:\n\n- Invoice, one kind of Claim\n\nLeft out:', /^- 10\. Every "kind of" is listed: Claims: Invoice is in its "Kind of" list, but isn't one of its things\.$/m],
  ['a settled decision still in "Decisions to make"', THINGS, '## Check record', '## Decisions to make\n\n| Decision | Question | Recommended | Why |\n|---|---|---|---|\n| DM-1 | What stage does a new claim start in? | Draft | the claimant can write the claim first |\n\n## Check record', /^- 5\. Every open decision and Glossary change is listed: "Decisions to make" lists DM-1, which is settled\. A settled decision leaves the table\.$/m],
  ['a word waiting on a Glossary change the decisions file hasn\'t got', THINGS, '## Check record', '## Waiting on the Glossary\n\n| Change | Word | What the Glossary needs |\n|---|---|---|\n| GC-1 | Payroll run | which thing it belongs to |\n\n## Check record', /^- 5\. Every open decision and Glossary change is listed: "Waiting on the Glossary" lists GC-1, which isn't a Glossary change in the decisions file\.$/m],
  ['a placeholder left in', THINGS, 'Next step: None: the things are accepted.', 'Next step: None: the {things} are accepted.', /^- Placeholders: Line 5: the placeholder \{things\} is still there\.$/m],
  ['a link that doesn\'t render', THINGS, 'Next step: None: the things are accepted.', 'Next step: None: the things are accepted. See [the notes](my notes.md).', /^- Display: Line 5: link path "my notes\.md" holds a space/m],
  ['a hard word', THINGS, 'Next step: None: the things are accepted.', 'Next step: None: the things are accepted, and the list is read-only.', /^- Simple writing: Line 5, the top: "read-only"\./m],
  ['a retired Glossary word', THINGS, 'Next step: None: the things are accepted.', 'Next step: None: the things are accepted, so each expense report has its data model.', /^- Glossary words: Line 5: "expense report" is a retired word; use Claim\.$/m],
];

for (const [what, rel, from, to, finding] of THINGS_FAILURES) {
  test(`check-data-model, the things file: finds ${what}`, () => {
    const { out, change } = project();
    change(rel, from, to);
    const r = check(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out.split('\nFor the file:\n')[1], finding);
  });
}

// ---------------------------------------------------------------- check-data-model: a data model file's checks

// The end of Receipt's part, which is the last part of claims.md.
const RECEIPT_END = '| Remove | Send | Claimant | Only while its claim is **Draft**. |\n\n| Field | Type | Required | Limits | Can two share it | Can change | Starts as |\n|---|---|---|---|---|---|---|\n\n## Check record';
const RECEIPT_ROW = '| receipt | one Receipt | yes, only when its claim is sent | – | no | yes | – |';
const receiptRow = (cells: (string | undefined)[]): string => `| receipt | ${['one Receipt', 'yes, only when its claim is sent', '–', 'no', 'yes', '–'].map((c, i) => (cells[i] === undefined ? c : cells[i])).join(' | ')} |`;

const FAMILY_FAILURES: [string, string, string, string, RegExp][] = [
  ['a things file that isn\'t accepted', THINGS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted', /^- Things file accepted: The things file, expense-claims-glossary-things\.md, isn't accepted, so no data model file is written yet\. Its status is "drafted"\.$/m],
  ['a title that isn\'t the template\'s', CLAIMS, '# Data model — Claims, Expense claims', '# Claims data model — Expense claims', /^- Opening: The title should start "Data model — Claims, "\.$/m],
  ['an accepted file whose "Next step" line isn\'t "None"', CLAIMS, 'Next step: None: this file is accepted.', 'Next step: accept the file', /^- Next step: The file is accepted, so its "Next step" line should start "None"\.$/m],
  ['a part named after no thing of the family', CLAIMS, '## Receipt\n', '## Receipts\n', /^- Sections: The section "Receipts" isn't a thing of Claims in the things file, or a section of the template\.$/m],
  ['a thing\'s part after an "Adds to" part', CLAIMS, '## Expense line\n', '## Adds to Claim\n\n**Actions**\n\n| Action | In step | Who | Rules |\n|---|---|---|---|\n| Pay | – | the product | Once a month. |\n\n## Expense line\n', /^- Sections: "Expense line" comes after an "Adds to" part\. The "Adds to" parts come after every thing of the family\.$/m],
  ['an "Adds to" part for a thing of the same family', CLAIMS, '## Check record', '## Adds to Claim\n\n**Actions**\n\n| Action | In step | Who | Rules |\n|---|---|---|---|\n| Pay | – | the product | Once a month. |\n\n## Check record', /^- 2\. Every thing of the family has its part: "Adds to Claim": Claim isn't a thing of an earlier family, so this family can't add to it\.$/m],
  ['"Things and their fields" listing a field the rules table hasn\'t got', CLAIMS, '| Expense line | receipt |', '| Expense line | receipt, cost |', /^- 2\. Every thing of the family has its part: "Things and their fields": Expense line should list receipt, the fields of its rules table, in order\.$/m],
  ['a rules table with a column that isn\'t the template\'s', CLAIMS, RECEIPT_END, RECEIPT_END.replace('| Starts as |', '| Starts with |'), /^- 3\. Every thing has all its parts, in order: Receipt: a table's columns should be Field, Type, Required, Limits, Can two share it, Can change, Starts as\.$/m],
  ['a thing with no "Definition:" line', CLAIMS, '## Receipt\n\nDefinition: what it is, in one plain sentence\n', '## Receipt\n', /^- 3\. Every thing has all its parts, in order: Receipt has no "Definition:" line\.$/m],
  ['an empty cell', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, '']), /^- 4\. Every cell holds an answer, "–" or a gap with its ID: Expense line, receipt, Limits is empty\./m],
  ['a "?" that names no ID', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, '?']), /^- 4\. Every cell holds an answer, "–" or a gap with its ID: Expense line, receipt, Limits has a "\?" that names no ID/m],
  ['a Proposed answer that names no question', CLAIMS, 'in euros, Proposed (needs confirmation), question 4', 'in euros, Proposed (needs confirmation)', /^- 4\. Every cell holds an answer, "–" or a gap with its ID: Claim, amount, Limits: an answer marked "Proposed \(needs confirmation\)" names its question/m],
  ['a Proposed answer naming a question that isn\'t in the Question log', CLAIMS, 'in euros, Proposed (needs confirmation), question 4', 'in euros, Proposed (needs confirmation), question 99', /^- 4\. Every cell holds an answer, "–" or a gap with its ID: Claim, amount, Limits names question 99, which isn't in the Question log\.$/m],
  ['a Proposed answer naming a question that is answered', CLAIMS, 'in euros, Proposed (needs confirmation), question 4', 'in euros, Proposed (needs confirmation), question 1', /^- 4\. Every cell holds an answer, "–" or a gap with its ID: Claim, amount, Limits names question 1, which is answered\./m],
  ['a Type the design doesn\'t allow', CLAIMS, '| amount | number |', '| amount | money |', /^- 4\. Every rules table cell holds an answer its column allows: Claim, amount: its Type, "money", isn't one the design allows/m],
  ['a field with choices that has only one', CLAIMS, '| stage | one of:<br>• Draft<br>• Submitted<br>• Approved<br>• Rejected<br>• Paid |', '| stage | one of: Draft |', /^- 4\. Every rules table cell holds an answer its column allows: Claim, stage: "one of" lists each choice as a bullet on its own line, and there are at least 2\.$/m],
  ['a Required that isn\'t yes, no or "yes, only when"', CLAIMS, '| amount | number | yes, only when it is sent |', '| amount | number | mostly |', /^- 4\. Every rules table cell holds an answer its column allows: Claim, amount: Required should be yes, no, or "yes, only when" and the condition\.$/m],
  ['Limits on a field with choices', CLAIMS, '• Paid | yes | – |', '• Paid | yes | 5 stages |', /^- 4\. Every rules table cell holds an answer its column allows: Claim, stage: Limits doesn't apply to a field with choices or a yes-or-no field, so it reads "–"\.$/m],
  ['a "Can two share it" that isn\'t yes, no or "–"', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, undefined, 'never']), /^- 4\. Every rules table cell holds an answer its column allows: Expense line, receipt: "Can two share it" should be yes, no, or "–"\.$/m],
  ['a "Can change" that isn\'t one of its forms', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, undefined, undefined, 'sometimes']), /^- 4\. Every rules table cell holds an answer its column allows: Expense line, receipt: "Can change" should be yes, no, "only while" and a value/m],
  ['"only while" a value no field has', CLAIMS, '| 1 or more | no | only while Draft |', '| 1 or more | no | only while Open |', /^- 4\. Every rules table cell holds an answer its column allows: Claim, expense lines: "only while Open" should name a choice of one of Claim's fields\.$/m],
  ['a "Starts as" on a field with no choices', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, undefined, undefined, undefined, 'a receipt']), /^- 4\. Every rules table cell holds an answer its column allows: Expense line, receipt: "Starts as" applies only to a field with choices, so it reads "–"\.$/m],
  ['a gap naming a settled decision', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, undefined, '? (DM-9)']), /^- 5\. Every gap names where it went: Expense line still has "\? \(DM-9\)", but DM-9 is settled\. Write its answer in place of each "\?"\.$/m],
  ['a gap naming a decision the decisions file hasn\'t got', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, undefined, '? (DM-10)']), /^- 5\. Every gap names where it went: Expense line names DM-10, which isn't in the decisions file\.$/m],
  ['a gap naming a Glossary change the decisions file hasn\'t got', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, undefined, '? (GC-1)']), /^- 5\. Every gap names where it went: Expense line names GC-1, which isn't a Glossary change in the decisions file\.$/m],
  // The data model never raises a change to the requirements, so "? (RC-1)" is no gap it knows.
  ['a gap naming RC-1, a change to the requirements, which the data model never raises', CLAIMS, RECEIPT_ROW, receiptRow([undefined, undefined, undefined, '? (RC-1)']), /^- 4\. Every cell holds an answer, "–" or a gap with its ID: Expense line, receipt, Can two share it has a "\?" that names no ID/m],
  ['an answer that is assumed', CLAIMS, 'No stage moves back.', 'No stage moves back, as assumed.', /^- 6\. Nothing is assumed: Line 53 says "assumed"\. A gap is sent where its kind goes, never assumed\.$/m],
  ['an answer that cites a document', CLAIMS, 'Only for a claim over 500.', 'Only for a claim over 500, per the BRD.', /^- 7\. No answer cites a source: Claim, Approve over the limit, Rules cites "per" and a document\. The file shows answers only\.$/m],
  ['an answer that cites a requirement', CLAIMS, 'Only for a claim over 500.', 'Only for a claim over 500, as REQ-3.2 says.', /^- 7\. No answer cites a source: Claim, Approve over the limit, Rules cites a requirement's ID\. The file shows answers only\.$/m],
  ['a decision named outside a gap', CLAIMS, 'Only for a claim over 500.', 'Only for a claim over 500, as DM-6 says.', /^- 7\. No answer cites a source: Claim, Approve over the limit, Rules names DM-6 outside a gap\./m],
  ['a step that isn\'t a Glossary step', CLAIMS, '| Approve over the limit | Approve |', '| Approve over the limit | Finance check |', /^- 8\. Things, definitions, steps and states are the Glossary's: Claim, Approve over the limit: "Finance check" isn't a Glossary step\./m],
  ['a definition that isn\'t the things file\'s, word for word', CLAIMS, '## Receipt\n\nDefinition: what it is, in one plain sentence\n', '## Receipt\n\nDefinition: what it is, in one short sentence\n', /^- 8\. Things, definitions, steps and states are the Glossary's: Receipt: its definition isn't the things file's, word for word\.$/m],
  ['a move to a value its field hasn\'t got', CLAIMS, '| Approved | Paid |', '| Approved | Settled |', /^- How it moves: Claim, the move Approved → Settled: "Settled" isn't one of stage's choices\.$/m],
  ['a "Starts as" that isn\'t where the first move from Start goes', CLAIMS, '| Start | Draft |', '| Start | Submitted |', /^- How it moves: Claim, stage: it starts as "Draft", but the first move from Start goes to "Submitted"\.$/m],
  ['a states table missing a choice', CLAIMS, '| Paid | is kept as a record. |\n', '', /^- How it moves: Claim: what each state means has one row per choice of stage, in its order: Draft, Submitted, Approved, Rejected, Paid\.$/m],
  ['a Who that isn\'t a Glossary role', CLAIMS, '| Approve | Approve | Line manager |', '| Approve | Approve | Manager |', /^- 9\. Every Who is a Glossary role: Claim, Approve: its Who, "Manager", should be a Glossary role, "the product", or "\?" and its ID/m],
  ['a move whose Who is "–", which only an action never allowed may have', CLAIMS, '| Submitted | Rejected | its line manager rejects it | Line manager |', '| Submitted | Rejected | its line manager rejects it | – |', /^- 9\. Every Who is a Glossary role: Claim, Submitted → Rejected: its Who, "–", should be a Glossary role, "the product", or "\?" and its ID\.$/m],
  ['a "kind of" line the things file doesn\'t list', CLAIMS, '## Receipt\n\nDefinition: what it is, in one plain sentence\n', '## Receipt\n\nDefinition: what it is, in one plain sentence\n\nA receipt is one kind of Claim. What holds for every Claim is written in claims.md.\n', /^- 10\. Every "kind of" line matches the things file: Receipt has a "kind of" line, but the things file doesn't list it as one kind of another thing\.$/m],
  ['a thing with no Remove row', CLAIMS, RECEIPT_END, RECEIPT_END.replace('| Remove | Send | Claimant | Only while its claim is **Draft**. |\n', ''), /^- 11\. Every thing can be made, found, opened and removed: Receipt has no Remove row\./m],
  ['a placeholder left in', CLAIMS, 'No stage moves back.', 'No stage moves back {ever}.', /^- Placeholders: Line 53: the placeholder \{ever\} is still there\.$/m],
  ['a link that doesn\'t render', CLAIMS, 'No stage moves back.', 'No stage moves back. See [the notes](my notes.md).', /^- Display: Line 53: link path "my notes\.md" holds a space/m],
  ['a hard word', CLAIMS, 'No stage moves back.', 'No stage moves back. A paid claim is read-only.', /^- Simple writing: Line 53, Claim: "read-only"\./m],
  ['a retired Glossary word', CLAIMS, 'No stage moves back.', 'No stage moves back. A paid expense report stays paid.', /^- Glossary words: Line 53: "expense report" is a retired word; use Claim\.$/m],
];

for (const [what, rel, from, to, finding] of FAMILY_FAILURES) {
  test(`check-data-model, claims.md: finds ${what}`, () => {
    const { out, change } = project();
    change(rel, from, to);
    const r = check(out, 'claims');
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out.split('\nFor the file:\n')[1], finding);
  });
}

test('check-data-model, the things file: a family that names its data model file twice is one finding', () => {
  const { out, change } = project();
  change(THINGS, 'Data model file: [claims.md](claims.md)\n', 'Data model file: [claims.md](claims.md)\n\nData model file: [claims.md](claims.md)\n');
  const r = check(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 1. The things file covers the Glossary: Claims names its data model file 2 times. It names it once.']);
});

test('check-data-model: a thing the Glossary makes part of another has no Browse or Open row, and still has a Remove row', () => {
  const { out, change } = project();
  // The Glossary's objects page ties Receipt to the term above it.
  change(OBJECTS, '| Term | What it is | Source | Decision |\n|---|---|---|---|', '| Term | What it is | Relationship to the term above | Source | Decision |\n|---|---|---|---|---|');
  change(OBJECTS, '| <a id="claim"></a>Claim | what it is, in one plain sentence |', '| <a id="claim"></a>Claim | what it is, in one plain sentence | – |');
  change(OBJECTS, '| <a id="expense-line"></a>Expense line | what it is, in one plain sentence |', '| <a id="expense-line"></a>Expense line | what it is, in one plain sentence | – |');
  change(OBJECTS, '| <a id="receipt"></a>Receipt | what it is, in one plain sentence |', '| <a id="receipt"></a>Receipt | what it is, in one plain sentence | part of Expense line |');
  change(CLAIMS, '| Browse | – | • Claimant<br>• Line manager<br>• Finance approver | Seen with its expense line, by each person who sees the claim. |\n| Open | – | • Claimant<br>• Line manager<br>• Finance approver | Opened with its expense line, by each person who opens the claim. |\n', '');
  let r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.strictEqual(check(out).code, 0);
  change(CLAIMS, RECEIPT_END, RECEIPT_END.replace('| Remove | Send | Claimant | Only while its claim is **Draft**. |\n', ''));
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 11. Every thing can be made, found, opened and removed: Receipt has no Remove row. Write it, with "?" and its ID where the sources don\'t say.']);
});

test('check-data-model: a thing the Glossary makes one kind of another is in its family\'s "Kind of" list, and its part says so', () => {
  const { out, change } = project();
  change(OBJECTS, '| Term | What it is | Source | Decision |\n|---|---|---|---|', '| Term | What it is | Relationship to the term above | Source | Decision |\n|---|---|---|---|---|');
  change(OBJECTS, '| <a id="claim"></a>Claim | what it is, in one plain sentence |', '| <a id="claim"></a>Claim | what it is, in one plain sentence | – |');
  change(OBJECTS, '| <a id="expense-line"></a>Expense line | what it is, in one plain sentence |', '| <a id="expense-line"></a>Expense line | what it is, in one plain sentence | – |');
  change(OBJECTS, '| <a id="receipt"></a>Receipt | what it is, in one plain sentence |', '| <a id="receipt"></a>Receipt | what it is, in one plain sentence | a kind of Expense line |');
  let r = check(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 10. Every "kind of" is listed: The Glossary makes Receipt one kind of Expense line, so its family\'s "Kind of" list names it.']);
  change(THINGS, 'Left out:', 'Kind of:\n\n- Receipt, one kind of Expense line\n\nLeft out:');
  assert.strictEqual(check(out).code, 0);
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 10. Every "kind of" line matches the things file: Receipt is one kind of Expense line in the things file, so its part has the "kind of" line.']);
  change(CLAIMS, '## Receipt\n\nDefinition: what it is, in one plain sentence\n', '## Receipt\n\nDefinition: what it is, in one plain sentence\n\nA receipt is one kind of Expense line. What holds for every Expense line is written in claims.md.\n');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
});

test('check-data-model: a Glossary value set that belongs to a thing is one of its fields, with the Glossary\'s values as its choices', () => {
  const { out, change } = project();
  const STATES = 'glossary/states-and-values.md';
  const valueSet = (name: string, owner: string, values: string): string => `## Claims\n\n| Value-set | What it is | Belongs to | Values | Notes | Source | Decision |\n|---|---|---|---|---|---|---|\n| <a id="${slug(name)}"></a>${name} | what it is, in one plain sentence | [${owner}](object-terms.md#${slug(owner)}) | ${values} | - | the PRD | - |\n\n## Terms replaced or retired over time`;
  change(STATES, '## Terms replaced or retired over time', valueSet('Claim stage', 'Claim', 'Draft<br>Submitted<br>Approved<br>Rejected<br>Paid'));
  let r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.strictEqual(check(out).code, 0);
  change(STATES, 'Draft<br>Submitted<br>', 'Draft<br>Sent<br>');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 8. Things, definitions, steps and states are the Glossary\'s: Claim, stage: its choices should be the Glossary\'s values for Claim stage, word for word: Draft, Sent, Approved, Rejected, Paid.']);
  change(STATES, '<a id="claim-stage"></a>Claim stage | what it is, in one plain sentence | [Claim](object-terms.md#claim) |', '<a id="expense-line-status"></a>Expense line status | what it is, in one plain sentence | [Expense line](object-terms.md#expense-line) |');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 2. Every thing of the family has its part: The Glossary\'s Expense line status belongs to Expense line, but no field of Expense line holds it. Its field is named "status".']);
});

// ---------------------------------------------------------------- check-data-model: the decisions file's checks

// The end of DM-9, the last settled decision.
const DM9_END = '- **Recommended:** A receipt is for one expense line only\n- **Chosen:** A receipt is for one expense line only\n- **Decided by:** PO, 2026-10-11\n';
const dm9End = (recommended?: string | null, chosen?: string | null, decidedBy?: string | null): string => `- **Recommended:** ${recommended || 'A receipt is for one expense line only'}\n- **Chosen:** ${chosen || 'A receipt is for one expense line only'}\n- **Decided by:** ${decidedBy || 'PO, 2026-10-11'}\n`;
const DM9_SECOND_OPTION = '  - **One receipt can cover several expense lines.** Why you\'d pick it: one bill can hold several expenses. What happens next: the finance team checks one receipt against several expense lines.\n';
const IDK = '  - **I don\'t know yet.** What happens next: this decision stays open, and is asked again first at the next run.\n';
const NO_OPEN = '## Open\n\nNone yet.\n';
// An open decision, as the template writes it, for the part "Open".
const openDecision = (id: string, { question = 'Can a claim be paid in two parts?', asked = 'One at a time', chosen = 'open' }: { question?: string; asked?: string; chosen?: string } = {}): string => `### ${id} — ${question}\n\n- **Where:** claims.md · Claim · How stage moves\n- **Why I'm asking:** The PRD says a claim is paid. It doesn't say whether it can be paid in two parts.\n- **Options:**\n  - **Paid in one go.** Why you'd pick it: one payment for each claim. What happens next: a claim is paid once.\n  - **Paid in two parts.** Why you'd pick it: a large claim can be split. What happens next: a claim is paid twice.\n${IDK}- **Recommended:** Paid in one go, because it keeps each claim simple.\n- **How it is asked:** ${asked}\n- **Chosen:** ${chosen}\n`;
const withOpen = (...entries: string[]): string => `## Open\n\n${entries.join('\n')}`;
const GC_1 = (status: string): string => `## Glossary changes\n\n### GC-1 — Payroll run\n\n- **The Glossary says:** belongs to nothing\n- **What is needed:** which thing Payroll run belongs to\n- **Proposed:** it belongs to Claim\n- **Raised from:** claims.md · Claim\n- **Status:** ${status}\n`;
const WHY_DM3 = '- **Why I\'m asking:** The PRD says a claimant sends a claim with its expense lines and receipts.';
const GC_STATUS_FINDING = /^- Decisions file: entries: GC-1: its status should be "To raise", "Raised", "Left open on" and the date, or "Settled in the Glossary on" and the date\. Once the data model is in step, that last one goes on with "\. Brought into the data model on" and the date\.$/m;

const DECISIONS_FAILURES: [string, string, string, RegExp][] = [
  ['a title that isn\'t the template\'s', '# Data model decisions — Expense claims', '# Decisions — Expense claims', /^- Decisions file: opening: The title should start "Data model decisions — "\.$/m],
  ['a missing section', '## Glossary changes\n\nNone yet.\n\n', '', /^- Decisions file: sections: The section "Glossary changes" is missing\.$/m],
  ['an entry whose heading has no ID', '### DM-9 — Can two expense lines hold the same receipt?', '### Can two expense lines hold the same receipt?', /^- Decisions file: entries: The entry at line \d+: its heading should be its ID, " — ", then its question or term/m],
  ['an entry under a part that holds another kind', '## Glossary changes\n\nNone yet.\n', '## Glossary changes\n\n### DM-10 — Who pays a claim?\n\n- **Where:** claims.md · Claim\n', /^- Decisions file: entries: DM-10 sits under "glossary changes", which holds GC entries only\.$/m],
  ['a settled decision with a part missing', DM9_END, '- **Recommended:** A receipt is for one expense line only\n- **Chosen:** A receipt is for one expense line only\n', /^- Decisions file: entries: DM-9 has no "Decided by"\.$/m],
  ['parts out of the template\'s order', DM9_END, '- **Chosen:** A receipt is for one expense line only\n- **Recommended:** A receipt is for one expense line only\n- **Decided by:** PO, 2026-10-11\n', /^- Decisions file: entries: DM-9: its parts should come in the template's order: Where, Why I'm asking, Options, Recommended, Chosen, Decided by\.$/m],
  ['a part the template doesn\'t have', DM9_END, `${DM9_END}- **Notes:** none\n`, /^- Decisions file: entries: DM-9 has a part the template doesn't have: "Notes"\.$/m],
  ['a decision with one real option', DM9_SECOND_OPTION, '', /^- Decisions file: entries: DM-9 offers 1 real option\. It needs at least 2, then "I don't know yet"\.$/m],
  ['a decision whose last option isn\'t "I don\'t know yet"', `${DM9_SECOND_OPTION}${IDK}`, DM9_SECOND_OPTION, /^- Decisions file: entries: DM-9: its last option should be "I don't know yet"\.$/m],
  ['an option that is "yes" or "no"', '  - **One receipt can cover several expense lines.**', '  - **No.**', /^- Decisions file: entries: DM-9: the option "No" should be a real answer, never "yes" or "no"\.$/m],
  ['a recommendation that isn\'t one of the options', DM9_END, dm9End('One receipt for each line'), /^- Decisions file: entries: DM-9: its recommendation, "One receipt for each line", isn't one of its options, word for word\.$/m],
  ['a choice that isn\'t one of the options', DM9_END, dm9End(null, 'One receipt for each line'), /^- Decisions file: entries: DM-9: its choice, "One receipt for each line", should be one of its options, word for word, or "Other:" and the person's words\.$/m],
  ['a "Decided by" that isn\'t BA or PO', DM9_END, dm9End(null, null, 'the team, 2026-10-11'), /^- Decisions file: entries: DM-9: "Decided by" should be BA or PO, then the date/m],
  ['an open decision asked in a way the template hasn\'t got', NO_OPEN, withOpen(openDecision('DM-10', { asked: 'When we can' })), /^- Decisions file: entries: DM-10: "How it is asked" should be "One at a time" or "Settled together"\.$/m],
  ['an open decision with a choice', NO_OPEN, withOpen(openDecision('DM-10', { chosen: 'Paid in one go' })), /^- Decisions file: entries: DM-10 is open, so "Chosen" should read "open", or "Proposed:" and the answer in use\.$/m],
  ['a Glossary change with a status the template hasn\'t got', '## Glossary changes\n\nNone yet.\n', GC_1('Waiting'), GC_STATUS_FINDING],
  ['a Glossary change brought into the data model with no date the Glossary settled it', '## Glossary changes\n\nNone yet.\n', GC_1('Brought into the data model on 2026-10-21'), GC_STATUS_FINDING],
  ['a Glossary change left open with no date', '## Glossary changes\n\nNone yet.\n', GC_1('Left open'), GC_STATUS_FINDING],
  // The decisions file holds no changes to the requirements: the data model never comments on the requirements.
  ['a part for changes to the requirements, which the template no longer has', '## Glossary changes\n\nNone yet.\n', '## Glossary changes\n\nNone yet.\n\n## Changes to the requirements\n\nNone yet.\n', /^- Decisions file: sections: The section "Changes to the requirements" isn't in the template\.$/m],
  ['an RC entry under the Glossary changes', '## Glossary changes\n\nNone yet.\n', '## Glossary changes\n\n### RC-1 — How often is a claim paid?\n\n- **Status:** To raise\n', /^- Decisions file: entries: The entry at line \d+: its heading should be its ID, " — ", then its question or term/m],
  ['a part with no entry that doesn\'t say "None yet."', '## Glossary changes\n\nNone yet.\n', '## Glossary changes\n\n', /^- Decisions file: entries: "Glossary changes" has no entry, so it should say "None yet\."$/m],
  ['a gap in the IDs', '### DM-9 — Can two', '### DM-10 — Can two', /^- Decisions file: IDs: DM- numbers should run from DM-1 with no gaps: DM-9 is missing\.$/m],
  ['a decision open twice', NO_OPEN, withOpen(openDecision('DM-10'), openDecision('DM-10')), /^- Decisions file: IDs: DM-10 is open twice\.$/m],
  // A decision that changes gets a new entry, with the next ID, so an ID both open and settled is a mistake.
  ['a decision both open and settled', NO_OPEN, withOpen(openDecision('DM-9')), /^- Decisions file: IDs: DM-9 has 2 entries\. Each ID has one entry only\.$/m],
  ['a decision that replaces one the file hasn\'t got', NO_OPEN, withOpen(openDecision('DM-10', { question: 'Replaces DM-12: Can a claim be paid in two parts?' })), /^- Decisions file: IDs: DM-10 replaces DM-12, which isn't in the file\.$/m],
  ['a placeholder left in', WHY_DM3, WHY_DM3.replace('sends a claim', 'sends a {claim}'), /^- Decisions file: placeholders: Line 38: the placeholder \{claim\} is still there\.$/m],
  ['a link that doesn\'t render', WHY_DM3, WHY_DM3.replace('The PRD says', 'The [PRD](my prd.md) says'), /^- Decisions file: display: Line 38: link path "my prd\.md" holds a space/m],
  ['a hard word', WHY_DM3, WHY_DM3.replace('receipts.', 'receipts, and a sent claim is read-only.'), /^- Decisions file: simple writing: Line 38, Settled: "read-only"\./m],
  ['a retired Glossary word', WHY_DM3, WHY_DM3.replace('sends a claim', 'sends an expense report'), /^- Decisions file: Glossary words: Line 38: "expense report" is a retired word; use Claim\.$/m],
];

for (const [what, from, to, finding] of DECISIONS_FAILURES) {
  test(`check-data-model, the decisions file: finds ${what}`, () => {
    const { out, change } = project();
    change(DECISIONS, from, to);
    const r = check(out);
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out.split('\nFor the file:\n')[1], finding);
  });
}

test('check-data-model: two gaps in the IDs name the two IDs missing, and never an ID that is there', () => {
  const { out, change } = project();
  change(DECISIONS, '### DM-2 — Who can see', '### DM-10 — Who can see');
  change(DECISIONS, '### DM-4 — Can a claim', '### DM-11 — Can a claim');
  const r = check(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), [
    '- Decisions file: IDs: DM- numbers should run from DM-1 with no gaps: DM-2 is missing.',
    '- Decisions file: IDs: DM- numbers should run from DM-1 with no gaps: DM-4 is missing.',
  ]);
});

test('check-data-model: the decisions file is checked with a data model file too', () => {
  const { out, change } = project();
  change(DECISIONS, WHY_DM3, WHY_DM3.replace('sends a claim', 'sends an expense report'));
  const r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- Decisions file: Glossary words: Line 38: "expense report" is a retired word; use Claim.']);
});

test('check-data-model: an open product-wide decision is listed in the things file, as the decisions file words it', () => {
  const { out, change } = project();
  // The things file is at its gate.
  change(THINGS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted');
  change(DECISIONS, NO_OPEN, withOpen(openDecision('DM-10').replace('claims.md · Claim · How stage moves', 'expense-claims-glossary-things.md · Claims')));
  let r = check(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 5. Every open decision and Glossary change is listed: DM-10 is open for expense-claims-glossary-things.md, but "Decisions to make" doesn\'t list it.']);
  const row = '| DM-10 | Can a claim be paid in two parts? | Paid in one go | it keeps each claim simple |';
  change(THINGS, '## Check record', `## Decisions to make\n\n| Decision | Question | Recommended | Why |\n|---|---|---|---|\n${row}\n\n## Check record`);
  r = check(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 1 product-wide decision open, and 0 words waiting on the Glossary$/m);
  change(THINGS, row, '| DM-10 | Can a claim be paid twice? | Paid in two parts | a claim can be large |');
  r = check(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), [
    '- 5. Every open decision and Glossary change is listed: DM-10: its question isn\'t the decisions file\'s, word for word.',
    '- 5. Every open decision and Glossary change is listed: DM-10: its recommended answer isn\'t the decisions file\'s, word for word.',
    '- 5. Every open decision and Glossary change is listed: DM-10: its "Why" isn\'t the reason the decisions file gives, word for word.',
  ]);
});

test('check-data-model: an open decision in claims.md has its gap and its row under its thing, as the decisions file words it', () => {
  const { out, change } = project();
  // claims.md is at its gate.
  change(CLAIMS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted');
  change(DECISIONS, NO_OPEN, withOpen(openDecision('DM-10')));
  change(CLAIMS, 'No stage moves back. A **Rejected** claim stays **Rejected**.', 'Moves back to an earlier state: ? (DM-10)');
  let r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 5. Every gap names where it went: Claim names DM-10, but its "Decisions to make" table has no row for it.']);
  const row = '| DM-10 | Can a claim be paid in two parts? | Paid in one go | it keeps each claim simple |';
  change(CLAIMS, '| Paid | is kept as a record. |\n', `| Paid | is kept as a record. |\n\n**Decisions to make**\n\n| Decision | Question | Recommended | Why |\n|---|---|---|---|\n${row}\n`);
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 1 open decision for this file, and 1 answer marked Proposed$/m);
  change(CLAIMS, row, '| DM-10 | Can a claim be paid in two parts? | Paid in two parts | it keeps each claim simple |');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 5. Every gap names where it went: Claim: DM-10: its recommended answer isn\'t the decisions file\'s, word for word.']);
});

test('check-data-model: a gap waits on a Glossary change while it is to raise, raised or left open, and never once the Glossary settles it', () => {
  const { out, change } = project();
  // claims.md is at its gate.
  change(CLAIMS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted');
  change(DECISIONS, '## Glossary changes\n\nNone yet.\n', GC_1('To raise'));
  change(CLAIMS, `${RECEIPT_ROW}\n`, `${receiptRow([undefined, undefined, undefined, '? (GC-1)'])}\n\n**Waiting on the Glossary**\n\n| Change | What the Glossary needs | Proposed |\n|---|---|---|\n| GC-1 | which thing Payroll run belongs to | it belongs to Claim |\n`);
  let status = 'To raise';
  const mark = (now: string): void => { change(DECISIONS, `- **Status:** ${status}\n`, `- **Status:** ${now}\n`); status = now; };
  let r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 1 waiting on the Glossary$/m);
  assert.match(r.out, /^- The decisions file: 0 open decisions, 9 settled decisions and 1 Glossary change$/m);
  // Sent with the batch, or left open at the Glossary's gate: the gap still waits.
  for (const now of ['Raised', 'Left open on 2026-10-20']) {
    mark(now);
    r = check(out, 'claims');
    assert.strictEqual(r.code, 0, `${now}: ${r.out}${r.err}`);
  }
  // Settled in the Glossary, then brought into the data model: nothing waits on it any more.
  for (const now of ['Settled in the Glossary on 2026-10-21', 'Settled in the Glossary on 2026-10-21. Brought into the data model on 2026-10-22']) {
    mark(now);
    r = check(out, 'claims');
    assert.strictEqual(r.code, 1, `${now}: ${r.out}${r.err}`);
    assert.deepStrictEqual(findingsOf(r), ['- 5. Every gap names where it went: Expense line still waits on GC-1, which the Glossary has settled. Bring the file in step with the Glossary.'], now);
  }
});

test('check-data-model: a decision opened for claims.md needs its gap, even when it is answered "I don\'t know yet"', () => {
  const { out, change } = project();
  change(CLAIMS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted');
  change(DECISIONS, NO_OPEN, withOpen(openDecision('DM-10')));
  const missing = ['- 5. Every gap names where it went: DM-10 is open for claims.md, but no cell of the file names it as "? (DM-10)".'];
  let r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), missing);
  // The things file opened none of it, so it has nothing to list.
  assert.strictEqual(check(out).code, 0);
  // "I don't know yet" keeps the decision open, so its cell keeps its "?".
  change(DECISIONS, '- **Chosen:** open', '- **Chosen:** Proposed: Paid in one go');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), missing);
  change(CLAIMS, 'No stage moves back. A **Rejected** claim stays **Rejected**.', 'Moves back to an earlier state: ? (DM-10)');
  change(CLAIMS, '| Paid | is kept as a record. |\n', '| Paid | is kept as a record. |\n\n**Decisions to make**\n\n| Decision | Question | Recommended | Why |\n|---|---|---|---|\n| DM-10 | Can a claim be paid in two parts? | Paid in one go | it keeps each claim simple |\n');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 1 open decision for this file, and 1 answer marked Proposed$/m);
});

test('check-data-model: a product-wide decision answered "I don\'t know yet" stays in the things file\'s list, and every family\'s file shows its "?" and lists it', () => {
  const { out, change } = project();
  const productWide = openDecision('DM-10', { chosen: 'Proposed: Paid in one go' }).replace('claims.md · Claim · How stage moves', 'expense-claims-glossary-things.md · Claims');
  change(DECISIONS, NO_OPEN, withOpen(productWide));
  let r = check(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 5. Every open decision and Glossary change is listed: DM-10 is open for expense-claims-glossary-things.md, but "Decisions to make" doesn\'t list it.']);
  const row = '| DM-10 | Can a claim be paid in two parts? | Paid in one go | it keeps each claim simple |';
  change(THINGS, '## Check record', `## Decisions to make\n\n| Decision | Question | Recommended | Why |\n|---|---|---|---|\n${row}\n\n## Check record`);
  r = check(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  // claims.md is a family's file, so a cell of it shows "? (DM-10)", and its thing lists the decision as open.
  change(CLAIMS, 'Status: accepted on 2026-10-11, version 1', 'Status: drafted');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 5. Every gap names where it went: DM-10 is a product-wide decision, still open, so a cell of claims.md names it as "? (DM-10)". Its answer fills a "?" in every family\'s file.']);
  change(CLAIMS, 'No stage moves back. A **Rejected** claim stays **Rejected**.', 'Moves back to an earlier state: ? (DM-10)');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- 5. Every gap names where it went: Claim names DM-10, but its "Decisions to make" table has no row for it.']);
  change(CLAIMS, '| Paid | is kept as a record. |\n', `| Paid | is kept as a record. |\n\n**Decisions to make**\n\n| Decision | Question | Recommended | Why |\n|---|---|---|---|\n${row}\n`);
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
});

// ---------------------------------------------------------------- check-data-model: exit code 2

const EXIT_2: [string, (p: TestProject) => string[], RegExp][] = [
  ['no project is given', () => ['--output', tempDir('data-model')], /^Use: node tools\/check-data-model\.ts --project <p>/],
  ['the project isn\'t there', () => ['--project', 'nowhere', '--output', tempDir('data-model')], /its things file is missing/],
  ['the things file is missing', (p) => { fs.rmSync(path.join(p.dir, THINGS)); return []; }, /The data model isn't there yet: its things file is missing/],
  ['--family has no value', () => ['--family'], /Use: --family followed by the family's file name/],
  ['the family isn\'t one the things file names', () => ['--family', 'payments'], /The things file names no data model file payments\.md\. It names: claims\.md\./],
  ['the data model file named is missing', (p) => { fs.rmSync(path.join(p.dir, CLAIMS)); return ['--family', 'claims']; }, /The data model file isn't there yet: .*claims\.md/],
  ['the decisions file is missing', (p) => { fs.rmSync(path.join(p.dir, DECISIONS)); return []; }, /The data model's decisions file isn't there yet: .*expense-claims-data-model-decisions\.md/],
  ['a Glossary page is missing', (p) => { fs.rmSync(path.join(p.dir, 'glossary', 'step-terms.md')); return []; }, /The Glossary page isn't there: .*step-terms\.md/],
];

for (const [what, setup, message] of EXIT_2) {
  test(`check-data-model: exits with code 2 when ${what}`, () => {
    const p = project();
    const extra = setup(p);
    const args = extra.includes('--output') ? extra : ['--project', 'expense-claims', '--output', p.out, ...extra];
    const r = run('check-data-model.ts', args);
    assert.strictEqual(r.code, 2, r.out + r.err);
    assert.match(r.err, message);
  });
}

test('check-data-model: exits with code 2 when the layout is malformed', () => {
  const { out } = project();
  const bad = path.join(out, 'project-folders.md');
  fs.writeFileSync(bad, '# Project folders\n\nNo block here.\n');
  const r = run('check-data-model.ts', ['--project', 'expense-claims', '--output', out], { env: { SPECIFIER_LAYOUT: bad } });
  assert.strictEqual(r.code, 2, r.out + r.err);
});

test('check-data-model: on the things file, a data model file not written yet is no reason to stop', () => {
  const { out, dir } = project();
  fs.rmSync(path.join(dir, CLAIMS));
  const r = check(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
});

// ---------------------------------------------------------------- check-data-model: the Glossary words scan

test('check-data-model: the Glossary words scan skips a definition copied from the Glossary, and still flags the retired word anywhere else', () => {
  const { out, change } = project();
  // The Glossary's own definition of Claim uses a retired word, and both files copy it word for word.
  const definition = 'a request to pay back what an expense report lists';
  change(OBJECTS, '| <a id="claim"></a>Claim | what it is, in one plain sentence |', `| <a id="claim"></a>Claim | ${definition} |`);
  change(THINGS, '| Claim | what it is, in one plain sentence |', `| Claim | ${definition} |`);
  change(CLAIMS, '## Claim\n\nDefinition: what it is, in one plain sentence\n', `## Claim\n\nDefinition: ${definition}\n`);
  let r = check(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  // The same word in the file's own text is flagged, once, on its own line.
  change(CLAIMS, 'No stage moves back.', 'No stage moves back. A paid expense report stays paid.');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- Glossary words: Line 53: "expense report" is a retired word; use Claim.']);
  change(THINGS, 'Next step: None: the things are accepted.', 'Next step: None: each expense report is a thing.');
  r = check(out);
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.deepStrictEqual(findingsOf(r), ['- Glossary words: Line 5: "expense report" is a retired word; use Claim.']);
});

test('check-data-model: simple writing never fails a definition copied from the Glossary, and shows what it would flag, for a Glossary change', () => {
  const { out, change } = project();
  const definition = 'a request to pay back expenses, read-only once it is sent';
  change(OBJECTS, '| <a id="claim"></a>Claim | what it is, in one plain sentence |', `| <a id="claim"></a>Claim | ${definition} |`);
  change(THINGS, '| Claim | what it is, in one plain sentence |', `| Claim | ${definition} |`);
  change(CLAIMS, '## Claim\n\nDefinition: what it is, in one plain sentence\n', `## Claim\n\nDefinition: ${definition}\n`);
  let r = check(out);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Simple writing in a Glossary definition, copied word for word into expense-claims-glossary-things\.md: 1 place\. Each one belongs to the Glossary, as a Glossary change\.$/m);
  r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Simple writing in a Glossary definition, copied word for word into claims\.md: 1 place\. Each one belongs to the Glossary, as a Glossary change\.$/m);
  // The same words in the file's own text are a finding.
  change(CLAIMS, 'No stage moves back.', 'No stage moves back. A paid claim is read-only.');
  r = check(out, 'claims');
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.strictEqual(findingsOf(r).length, 1, r.out);
  assert.match(findingsOf(r)[0], /^- Simple writing: Line 53, Claim: "read-only"\./);
});

test('check-data-model: a retired word that the template\'s own form uses, such as "decision", is never a finding', () => {
  const { out, change, read } = project();
  change(OBJECTS, '| Reimbursement request | renamed | [Claim](#claim) | [D-1](decision-register.md#d-1) | 2026-10-10 |', '| Reimbursement request | renamed | [Claim](#claim) | [D-1](decision-register.md#d-1) | 2026-10-10 |\n| Decision | renamed | [Claim](#claim) | [D-1](decision-register.md#d-1) | 2026-10-10 |');
  // The scan alone flags the decisions file's title, which is the template's own form.
  const opts = { output: out };
  const hits = scan(read(DECISIONS), retiredWords('expense-claims', opts), currentTerms('expense-claims', opts), 'data-model-decisions');
  assert.deepStrictEqual(hits.map((h) => `${h.line}: ${h.word}`), ['1: decisions']);
  for (const family of [null, 'claims']) {
    const r = check(out, family);
    assert.strictEqual(r.code, 0, r.out + r.err);
  }
});

// ---------------------------------------------------------------- check-data-model: one requirement per row

test('check-data-model: an Action that holds two actions is listed to look at, and is never a finding', () => {
  const { out, change } = project();
  assert.doesNotMatch(check(out, 'claims').out, /One requirement per row/);
  change(CLAIMS, '| Approve | Approve | Line manager |', '| Approve or reject | Approve | Line manager |');
  const r = check(out, 'claims');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.ok(r.out.includes('One requirement per row, to look at: 1 action name may name two things joined by "and", "or", "/" or a comma. Split each one whose parts can be built on their own.\n- Claim, Approve or reject\n'), r.out);
  assert.match(r.out, /^Every check passed: 28 checks\.$/m);
  assert.deepStrictEqual(findingsOf(r), []);
});

// ---------------------------------------------------------------- lib/data-model.ts

// City library: books.md, written before the kit's document shape, and lending.md, which adds to Book.
const BOOKS = `# Data model — Books, City library

Status: Accepted on 2026-10-30

## Things and their fields

| Thing | Fields it gives |
|---|---|
| Book | title, format |
| Audiobook | length |

## Book

*A title the library lends, with its author, barcode and format.*

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Add | Stocking | Librarian | – |
| Browse | – | • Member<br>• Librarian | – |
| Remove | Stocking | Librarian | ? (DM-1) |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| title | text | yes | up to 200 characters | yes | yes | – |
| format | one of:<br>• Paperback<br>• Hardback | yes | – | – | yes | Paperback |

## Audiobook

Definition: A book read aloud, kept as a recording.

An audiobook is one kind of Book. What holds for every Book is written in books.md.

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Add | Stocking | Librarian | – |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| length | number, set from recording | yes | – | – | no | – |
`;

const LENDING = `# Data model — Lending, City library

Status: drafted

Next step: settle DM-4, then accept the file

## Things and their fields

| Thing | Fields it gives |
|---|---|
| Loan | due date, state |
| Book | shelf |

## Loan

Definition: One lending of a book to a member, due back by a date.

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Borrow | Lending | Member | For exactly one book. |
| Remove | Lending | ? (DM-4) | ? (DM-4) |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| due date | date | yes | three weeks after it is lent, Proposed (needs confirmation), question 7 | yes | only while On loan | – |
| state | one of:<br>• On loan<br>• Overdue<br>• Returned | yes | – | – | moves: see How state moves | On loan |

**How state moves**

\`\`\`
Start → On loan → Overdue → Returned
\`\`\`

| From | To | When | Who |
|---|---|---|---|
| Start | On loan | a member borrows a book | Member |
| On loan | Overdue | the due date passes without a return | the product |

Moves back to an earlier state: ? (DM-3)

| State | The loan… |
|---|---|
| On loan | can have its due date extended |
| Overdue | lets its member borrow again once it is returned |
| Returned | is back on the shelf |

**Decisions to make**

| Decision | Question | Recommended | Why |
|---|---|---|---|
| DM-4 | Can a loan be removed? | Keep every loan as a record | a returned loan is part of the member's history |

**Waiting on the Glossary**

| Change | What the Glossary needs | Proposed |
|---|---|---|
| GC-1 | which thing Shelf status belongs to | it belongs to Book |

## Adds to Book

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Reserve | Lending | Member | ? (GC-1) |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| shelf | one of: On shelf | yes | – | – | moves: see How shelf moves | On shelf |

**How shelf moves, in Lending**

| From | To | When | Who |
|---|---|---|---|
| On shelf | On loan | a member borrows it | Member |

## Check record

None yet.
`;

const THINGS_FILE = `# Things — City library

Status: drafted

Next step: settle DM-1, then accept the things

## Books

Data model file: [books.md](books.md)

| Thing | Definition |
|---|---|
| Book | A title the library lends, with its author, barcode and format. |
| Audiobook | A book read aloud, kept as a recording. |

Kind of:

- Audiobook, one kind of Book

Left out: Catalogue (a screen)

## Lending

Data model file: lending.md

| Thing | Definition |
|---|---|
| Loan | One lending of a book to a member, due back by a date. |

## Decisions to make

| Decision | Question | Recommended | Why |
|---|---|---|---|
| DM-1 | Can a book be removed? | Keep every book as a record | a book's loans stay with it |

## Waiting on the Glossary

| Change | Word | What the Glossary needs |
|---|---|---|
| GC-1 | Shelf status | which thing Shelf status belongs to |

## Check record

None yet.
`;

test('data-model: readThings reads each family, its file in either form, its things, its "Kind of" list and its words left out', () => {
  const t = readThings(THINGS_FILE);
  assert.deepStrictEqual(t.status, { state: 'drafted', raw: 'drafted', acceptedOn: null, version: null, openDecisions: false });
  assert.strictEqual(t.nextStep, 'settle DM-1, then accept the things');
  assert.deepStrictEqual(t.families.map((f) => [f.family, f.name, f.value]), [['Books', 'books.md', 'books'], ['Lending', 'lending.md', 'lending']]);
  assert.deepStrictEqual(t.families[0].things.map((r) => [r.Thing, r.Definition]), [['Book', 'A title the library lends, with its author, barcode and format.'], ['Audiobook', 'A book read aloud, kept as a recording.']]);
  assert.deepStrictEqual(t.families[0].kindOf, ['Audiobook, one kind of Book']);
  assert.strictEqual(t.families[0].leftOut, 'Catalogue (a screen)');
  assert.deepStrictEqual(t.families[1].kindOf, []);
  assert.strictEqual(t.families[1].leftOut, null);
  assert.deepStrictEqual(t.decisions.map((r) => [r.Decision, r.Recommended]), [['DM-1', 'Keep every book as a record']]);
  assert.deepStrictEqual(t.waitingOnGlossary.map((r) => [r.Change, r.Word]), [['GC-1', 'Shelf status']]);
  // A file with "\r\n" line endings reads the same.
  assert.deepStrictEqual(readThings(THINGS_FILE.replace(/\n/g, '\r\n')), t);
});

test('data-model: readFile reads each part, both forms of a definition, the "kind of" line, notes, and every table of the template', () => {
  const books = readFile(BOOKS);
  assert.strictEqual(books.title, 'Data model — Books, City library');
  assert.strictEqual(books.status.state, 'accepted');
  assert.strictEqual(books.nextStep, null);
  assert.deepStrictEqual(books.fieldsList.map((r) => r.Thing), ['Book', 'Audiobook']);
  assert.deepStrictEqual(books.parts.map((p) => [p.heading, p.thing, p.addsTo]), [['Book', 'Book', false], ['Audiobook', 'Audiobook', false]]);
  // A definition in italics, from a file written before the kit's document shape, and a "Definition:" line.
  assert.strictEqual(books.parts[0].definition, 'A title the library lends, with its author, barcode and format.');
  assert.strictEqual(books.parts[1].definition, 'A book read aloud, kept as a recording.');
  assert.strictEqual(books.parts[0].kindOf, null);
  assert.deepStrictEqual(books.parts[1].kindOf, { parent: 'Book', file: 'books.md' });

  const lending = readFile(LENDING);
  assert.deepStrictEqual(lending.parts.map((p) => [p.heading, p.thing, p.addsTo]), [['Loan', 'Loan', false], ['Adds to Book', 'Book', true]]);
  const loan = lending.parts[0];
  assert.deepStrictEqual(loan.tables.map((t) => [t.kind, t.label]), [
    ['actions', 'Actions'], ['fields', 'Actions'], ['moves', 'How state moves'], ['states', 'How state moves'],
    ['decisions', 'Decisions to make'], ['waitingOnGlossary', 'Waiting on the Glossary'],
  ]);
  assert.deepStrictEqual(loan.actions.map((r) => r.Action), ['Borrow', 'Remove']);
  assert.deepStrictEqual(loan.fields.map((r) => r.Field), ['due date', 'state']);
  // Each move knows the field its "How {field} moves" line names. The picture in its code block is not read.
  assert.deepStrictEqual(loan.moves.map((r) => [moveName(r), r._field]), [['Start → On loan', 'state'], ['On loan → Overdue', 'state']]);
  assert.deepStrictEqual(loan.states.map((r) => r.State), ['On loan', 'Overdue', 'Returned']);
  assert.deepStrictEqual(loan.decisions.map((r) => r.Decision), ['DM-4']);
  assert.deepStrictEqual(loan.waitingOnGlossary.map((r) => [r.Change, r.Proposed]), [['GC-1', 'it belongs to Book']]);
  assert.deepStrictEqual(loan.labels.map((l) => l.text), ['Actions', 'How state moves', 'Decisions to make', 'Waiting on the Glossary']);
  // A "Waiting on a change" table is no table of the template any more: the data model raises no change to the
  // requirements. So it is read as "other", which check-data-model.ts flags.
  const old = readFile(LENDING.replace('\n## Adds to Book', '\n**Waiting on a change**\n\n| Change | What the requirements say |\n|---|---|\n| RC-1 | One requirement says 5 loans. Another says 3. |\n\n## Adds to Book'));
  assert.deepStrictEqual(old.parts[0].tables.map((t) => t.kind).slice(-1), ['other']);
  assert.strictEqual('waitingOnChange' in old.parts[0], false);
  assert.deepStrictEqual(loan.notes.map((n) => n.text), ['Moves back to an earlier state: ? (DM-3)']);
  assert.match(loan.tables[0].raw, /^\| Action \| In step \| Who \| Rules \|\n\|---\|/);
  // An "Adds to" part's move knows its field too, from "How {field} moves, in {family}".
  assert.deepStrictEqual(lending.parts[1].moves.map((r) => r._field), ['shelf']);
  assert.strictEqual(lending.parts[1].definition, null);
});

test('data-model: typeOf reads choices written as bullets, choices on the first line, and "set from"', () => {
  const books = readFile(BOOKS);
  assert.deepStrictEqual(typeOf(books.parts[0].fields[1].Type), { base: 'one of', choices: ['Paperback', 'Hardback'], setFrom: null });
  assert.deepStrictEqual(typeOf(books.parts[0].fields[0].Type), { base: 'text', choices: [], setFrom: null });
  assert.deepStrictEqual(typeOf(books.parts[1].fields[0].Type), { base: 'number', choices: [], setFrom: 'recording' });
  const lending = readFile(LENDING);
  assert.deepStrictEqual(typeOf(lending.parts[0].fields[1].Type), { base: 'one of', choices: ['On loan', 'Overdue', 'Returned'], setFrom: null });
  assert.deepStrictEqual(typeOf(lending.parts[1].fields[0].Type), { base: 'one of', choices: ['On shelf'], setFrom: null });
  // A cell as lib/md-tables.ts reads it: "One or more of:<br>• Email<br>• Text message" is a list.
  assert.deepStrictEqual(typeOf(['One or more of:', 'Email', 'Text message']), { base: 'one or more of', choices: ['Email', 'Text message'], setFrom: null });
  assert.deepStrictEqual(typeOf(['date', 'set from lent on']), { base: 'date', choices: [], setFrom: 'lent on' });
});

test('data-model: cell reads a gap of each kind, a Proposed answer with its question, "–", and a list', () => {
  const loan = readFile(LENDING).parts[0];
  assert.deepStrictEqual(cell(loan.actions[1].Who), { text: '? (DM-4)', items: ['? (DM-4)'], gaps: ['DM-4'], proposed: [], none: false });
  // A gap is a decision or a Glossary change. "? (RC-1)" names no gap: the data model raises no change to the
  // requirements.
  assert.deepStrictEqual(cell('? (RC-1)').gaps, []);
  assert.deepStrictEqual(cell(loan.fields[0]['Can change']).gaps, []);
  assert.deepStrictEqual(cell(readFile(LENDING).parts[1].actions[0].Rules).gaps, ['GC-1']);
  assert.deepStrictEqual(cell(loan.notes[0].text).gaps, ['DM-3']);
  assert.deepStrictEqual(cell(loan.fields[0].Limits).proposed, [{ answer: 'three weeks after it is lent', question: 7 }]);
  assert.deepStrictEqual(cell(loan.fields[0].Limits).gaps, []);
  assert.strictEqual(cell(loan.fields[0]['Starts as']).none, true);
  assert.strictEqual(cell('-').none, true);
  const browse = cell(readFile(BOOKS).parts[0].actions[1].Who);
  assert.deepStrictEqual([browse.items, browse.text, browse.none], [['Member', 'Librarian'], 'Member Librarian', false]);
  assert.deepStrictEqual(cell('? (DM-2) and ? (GC-3)').gaps, ['DM-2', 'GC-3']);
  // A Proposed answer starts after the sentence before it, and a full stop inside a number ends no sentence.
  assert.deepStrictEqual(cell('up to 2.5 hours, Proposed (needs confirmation), question 7').proposed, [{ answer: 'up to 2.5 hours', question: 7 }]);
  assert.deepStrictEqual(cell('Only while Draft. Up to 2.5 kg, Proposed (needs confirmation), question 7').proposed, [{ answer: 'Up to 2.5 kg', question: 7 }]);
  assert.deepStrictEqual(cell('Two a day, Proposed (needs confirmation), question 3. Up to 1.5 kg, Proposed (needs confirmation), question 5').proposed, [{ answer: 'Two a day', question: 3 }, { answer: 'Up to 1.5 kg', question: 5 }]);
});

test('data-model: statusOf reads every status line in use, in any case', () => {
  const s = (line: string): ReturnType<typeof statusOf> => statusOf(`# T\n\n${line}\n`);
  const none = { state: null, raw: null, acceptedOn: null, version: null, openDecisions: false };
  assert.deepStrictEqual(statusOf('# T\n\nNo status here.\n'), none);
  assert.deepStrictEqual(s('Status: drafted'), { ...none, state: 'drafted', raw: 'drafted' });
  assert.deepStrictEqual(s('Status: Drafted'), { ...none, state: 'drafted', raw: 'Drafted' });
  assert.deepStrictEqual(s('Status: accepted on 2026-10-30, version 2'), { ...none, state: 'accepted', raw: 'accepted on 2026-10-30, version 2', acceptedOn: '2026-10-30', version: 2 });
  assert.deepStrictEqual(s('Status: Accepted on 2026-10-30'), { ...none, state: 'accepted', raw: 'Accepted on 2026-10-30', acceptedOn: '2026-10-30' });
  assert.deepStrictEqual(s('Status: Accepted on 2026-10-30.'), { ...none, state: 'accepted', raw: 'Accepted on 2026-10-30.', acceptedOn: '2026-10-30' });
  assert.deepStrictEqual(s('Status: Accepted on 2026-10-30, with open decisions'), { ...none, state: 'accepted', raw: 'Accepted on 2026-10-30, with open decisions', acceptedOn: '2026-10-30', openDecisions: true });
  assert.deepStrictEqual(s('Status: accepted on 2026-10-30, version 3, with open decisions'), { ...none, state: 'accepted', raw: 'accepted on 2026-10-30, version 3, with open decisions', acceptedOn: '2026-10-30', version: 3, openDecisions: true });
  assert.deepStrictEqual(s('Status: parked on 2026-10-30, change 002'), { ...none, state: 'parked', raw: 'parked on 2026-10-30, change 002' });
  assert.deepStrictEqual(s('Status: in review'), { ...none, raw: 'in review' });
  // The first status line is the one read.
  assert.strictEqual(statusOf('Status: drafted\n\nStatus: Accepted on 2026-10-30\n').state, 'drafted');
});

test('data-model: things puts a thing\'s "Adds to" part after its own part, whatever the order of the files', () => {
  // lending.md comes first here, so its "Adds to Book" part is read before books.md's own Book part.
  const model = { files: [{ name: 'lending.md', family: 'Lending', parts: readFile(LENDING).parts }, { name: 'books.md', family: 'Books', parts: readFile(BOOKS).parts }] };
  const all = things(model);
  assert.deepStrictEqual([...all.keys()], ['Loan', 'Book', 'Audiobook']);
  const book = all.get('Book')!;
  assert.strictEqual(book.file, 'books.md');
  assert.strictEqual(book.definition, 'A title the library lends, with its author, barcode and format.');
  assert.deepStrictEqual(book.parts.map((p) => p.heading), ['Book', 'Adds to Book']);
  // Its own part comes first, so actions[0] is the action that makes it.
  assert.deepStrictEqual(book.actions.map((r) => `${r.Action} (${r._file})`), ['Add (books.md)', 'Browse (books.md)', 'Remove (books.md)', 'Reserve (lending.md)']);
  assert.deepStrictEqual(book.fields.map((r) => `${r.Field} (${r._file})`), ['title (books.md)', 'format (books.md)', 'shelf (lending.md)']);
  assert.deepStrictEqual(book.moves.map((r) => moveName(r)), ['On shelf → On loan']);
  assert.deepStrictEqual(all.get('Loan')!.states.map((r) => r.State), ['On loan', 'Overdue', 'Returned']);
});

test('data-model: actionsAndMoves gives every action and move in the files\' order, and in each file in its tables\' order', () => {
  const model = { files: [{ name: 'books.md', family: 'Books', parts: readFile(BOOKS).parts }, { name: 'lending.md', family: 'Lending', parts: readFile(LENDING).parts }] };
  const all = actionsAndMoves(model);
  assert.deepStrictEqual(all.map((x) => `${x.file} · ${x.thing} · ${x.kind} · ${x.name}`), [
    'books.md · Book · action · Add',
    'books.md · Book · action · Browse',
    'books.md · Book · action · Remove',
    'books.md · Audiobook · action · Add',
    'lending.md · Loan · action · Borrow',
    'lending.md · Loan · action · Remove',
    'lending.md · Loan · move · Start → On loan',
    'lending.md · Loan · move · On loan → Overdue',
    'lending.md · Book · action · Reserve',
    'lending.md · Book · move · On shelf → On loan',
  ]);
  assert.strictEqual(all[0].family, 'Books');
  assert.strictEqual(all[8].part.addsTo, true);
  assert.strictEqual(all[6].row.When, 'a member borrows a book');
  assert.deepStrictEqual(actionsAndMoves({}), []);
});

test('data-model: load reads the things file and each file it names, and a missing file is a layout error unless it may be missing', () => {
  const out = tempDir('data-model');
  const dir = path.join(out, 'city-library', 'glossary', 'data-models');
  assert.throws(() => load('city-library', { output: out }), (e) => e instanceof LayoutError && /its things file is missing/.test(e.message));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'city-library-glossary-things.md'), THINGS_FILE);
  fs.writeFileSync(path.join(dir, 'books.md'), BOOKS);
  assert.throws(() => load('city-library', { output: out }), (e) => e instanceof LayoutError && /The data model file lending\.md, which the things file names for Lending, is missing/.test(e.message));
  let model = load('city-library', { output: out, allowMissing: true });
  assert.strictEqual(model.thingsFile.name, 'city-library-glossary-things.md');
  assert.strictEqual(model.thingsFile.rel, 'glossary/data-models/city-library-glossary-things.md');
  assert.deepStrictEqual(model.files.map((f) => [f.name, f.value, f.family, f.exists, f.parts.length]), [['books.md', 'books', 'Books', true, 2], ['lending.md', 'lending', 'Lending', false, 0]]);
  assert.strictEqual(model.files[1].status.state, null);
  fs.writeFileSync(path.join(dir, 'lending.md'), LENDING.replace(/\n/g, '\r\n'));
  model = load('city-library', { output: out });
  assert.deepStrictEqual(model.files.map((f) => [f.rel, f.status.state, f.parts.length]), [['glossary/data-models/books.md', 'accepted', 2], ['glossary/data-models/lending.md', 'drafted', 2]]);
});

// A decisions file: DM-3 is open, DM-5 is answered "I don't know yet", and DM-6 replaces DM-4, which is settled.
const DECISIONS_FILE = `# Data model decisions — City library

Status: drafted

## Open

### DM-3 — Can a loan go back to an earlier state?

- **Where:** lending.md · Loan · How state moves
- **Why I'm asking:** The PRD says how a loan is returned, but not whether a return can be undone.
- **Options:**
  - **Never.** Why you'd pick it: a returned book is back on the shelf. What happens next: a return can't be undone.
  - **A librarian can undo a return.** Why you'd pick it: a return made by mistake can be cleared. What happens next: a loan can move from Returned back to On loan.
  - **I don't know yet.** What happens next: the recommended answer is used, marked Proposed, and this decision stays open.
- **Recommended:** Never, because a returned book is back on the shelf.
- **How it is asked:** One at a time
- **Chosen:** open

### DM-5 — Who can see the list of loans, and open one?

- **Where:** lending.md · Loan · Browse and Open
- **Why I'm asking:** The PRD says who borrows a book. It doesn't say who can see the list of loans.
- **Options:**
  - **A member sees their own loans.** Why you'd pick it: members need their due dates. What happens next: a member sees only their own loans.
  - **Every member sees every loan.** Why you'd pick it: anyone can see who has a book. What happens next: a member sees the loans of other members.
  - **I don't know yet.** What happens next: the recommended answer is used, marked Proposed, and this decision stays open.
- **Recommended:** A member sees their own loans, because members need their due dates.
- **How it is asked:** Settled together
- **Chosen:** Proposed: A member sees their own loans

### DM-6 — Replaces DM-4: Can a loan be removed?

- **Where:** lending.md · Loan · Remove
- **Why I'm asking:** A change lets a librarian clear a loan made by mistake.
- **Options:**
  - **Keep every loan as a record.** Why you'd pick it: the library can see who borrowed what. What happens next: no loan is ever removed.
  - **A librarian can remove a loan made by mistake.** Why you'd pick it: a wrong loan can be cleared. What happens next: a "Remove a loan" story, for librarians only.
  - **I don't know yet.** What happens next: the recommended answer is used, marked Proposed, and this decision stays open.
- **Recommended:** A librarian can remove a loan made by mistake, because the change asks for it.
- **How it is asked:** One at a time
- **Chosen:** open

## Settled

### DM-4 — Can a loan be removed?

- **Where:** lending.md · Loan · Remove
- **Why I'm asking:** The PRD says how loans are made and returned, but never that one can be removed.
- **Options:**
  - **Keep every loan as a record.** Why you'd pick it: the library can see who borrowed what. What happens next: no loan is ever removed.
  - **A librarian can remove a loan made by mistake.** Why you'd pick it: a wrong loan can be cleared. What happens next: a "Remove a loan" story, for librarians only.
  - **I don't know yet.** What happens next: the recommended answer is used, marked Proposed, and this decision stays open.
- **Recommended:** Keep every loan as a record
- **Chosen:** Keep every loan as a record
- **Decided by:** BA, 2026-10-31

## Glossary changes

### GC-1 — Shelf status

- **The Glossary says:** belongs to nothing
- **What is needed:** which thing Shelf status belongs to
- **Proposed:** it belongs to Book
- **Raised from:** city-library-glossary-things.md · Books
- **Status:** Settled in the Glossary on 2026-11-01

### GC-2 — Reading room

- **The Glossary says:** a place, with no family
- **What is needed:** which family Reading room belongs to
- **Proposed:** it belongs to Books
- **Raised from:** books.md · Book
- **Status:** To raise

### GC-3 — Loan desk

- **The Glossary says:** nothing
- **What is needed:** a word for the place a member collects a loan
- **Proposed:** a new object, Loan desk
- **Raised from:** DM-5, at gate 2
- **Status:** Left open on 2026-11-02

### GC-4 — Loan state

- **The Glossary says:** On loan, Late, Returned
- **What is needed:** one word for a loan past its due date
- **Proposed:** rename Late to Overdue
- **Raised from:** lending.md · Loan
- **Status:** Settled in the Glossary on 2026-11-01. Brought into the data model on 2026-11-02

## Check record

None yet.
`;

test('data-model: readDecisions reads every entry under its part, with its options, its recommendation and its choice', () => {
  const d = readDecisions(DECISIONS_FILE);
  assert.strictEqual(d.title, 'Data model decisions — City library');
  assert.strictEqual(d.status.state, 'drafted');
  assert.deepStrictEqual(d.entries.map((e) => `${e.id} ${e.section}`), ['DM-3 open', 'DM-5 open', 'DM-6 open', 'DM-4 settled', 'GC-1 glossary changes', 'GC-2 glossary changes', 'GC-3 glossary changes', 'GC-4 glossary changes']);
  assert.deepStrictEqual(d.open.map((e) => e.id), ['DM-3', 'DM-5', 'DM-6']);
  assert.deepStrictEqual(d.settled.map((e) => e.id), ['DM-4']);
  assert.deepStrictEqual(d.glossaryChanges.map((e) => e.id), ['GC-1', 'GC-2', 'GC-3', 'GC-4']);
  // The decisions file holds no changes to the requirements. A part for them, left from an earlier file, is not read.
  assert.strictEqual('changes' in d, false);
  const old = readDecisions(DECISIONS_FILE.replace('## Check record', '## Changes to the requirements\n\n### RC-1 — How many loans can a member have?\n\n- **Status:** To raise\n\n## Check record'));
  assert.deepStrictEqual(old.entries.map((e) => e.id), d.entries.map((e) => e.id));
  const [dm3] = d.open;
  assert.deepStrictEqual([dm3.kind, dm3.number, dm3.question, dm3.line], ['DM', 3, 'Can a loan go back to an earlier state?', 7]);
  assert.strictEqual(dm3.fields.Where, 'lending.md · Loan · How state moves');
  assert.deepStrictEqual(dm3.options.map((o) => o.label), ['Never', 'A librarian can undo a return', "I don't know yet"]);
  assert.strictEqual(dm3.options[0].text, 'Why you\'d pick it: a returned book is back on the shelf. What happens next: a return can\'t be undone.');
  assert.deepStrictEqual([dm3.recommended, dm3.reason, dm3.chosen, dm3.proposed, dm3.state], ['Never', 'a returned book is back on the shelf', 'open', null, 'open']);
  const dm4 = d.settled[0];
  assert.deepStrictEqual([dm4.recommended, dm4.reason, dm4.chosen, dm4.decidedBy, dm4.date, dm4.state], ['Keep every loan as a record', null, 'Keep every loan as a record', 'BA', '2026-10-31', 'settled']);
});

test('data-model: readDecisions maps each ID to its entry, and links an entry to the one it replaces', () => {
  const d = readDecisions(DECISIONS_FILE);
  assert.strictEqual(d.inForce.get('DM-3'), d.open[0]);
  assert.strictEqual(d.inForce.get('DM-4'), d.settled[0]);
  assert.deepStrictEqual([...d.inForce.keys()], ['DM-3', 'DM-5', 'DM-6', 'DM-4', 'GC-1', 'GC-2', 'GC-3', 'GC-4']);
  // DM-6 replaces DM-4, and DM-4 knows it.
  const dm6 = d.inForce.get('DM-6')!;
  assert.deepStrictEqual([dm6.replaces, dm6.replacedBy], ['DM-4', null]);
  assert.deepStrictEqual([d.inForce.get('DM-4')!.replaces, d.inForce.get('DM-4')!.replacedBy], [null, 'DM-6']);
  assert.strictEqual(d.inForce.get('DM-5')!.replacedBy, null);
});

test('data-model: readDecisions reads a Proposed choice, and each status of a Glossary change, its two marks included', () => {
  const d = readDecisions(DECISIONS_FILE);
  const dm5 = d.inForce.get('DM-5')!;
  assert.deepStrictEqual([dm5.chosen, dm5.proposed, dm5.state], ['Proposed: A member sees their own loans', 'A member sees their own loans', 'open']);
  assert.deepStrictEqual([dm5.recommended, dm5.reason, dm5.fields['How it is asked']], ['A member sees their own loans', 'members need their due dates', 'Settled together']);
  const [gc1, gc2, gc3, gc4] = d.glossaryChanges;
  // "Settled in the Glossary on {date}", then ". Brought into the data model on {date}" once the data model is in step.
  assert.deepStrictEqual([gc1.kind, gc1.question, gc1.state, gc1.date, gc1.broughtIn], ['GC', 'Shelf status', 'settled', '2026-11-01', null]);
  assert.deepStrictEqual([gc4.state, gc4.date, gc4.broughtIn], ['brought in', '2026-11-01', '2026-11-02']);
  assert.deepStrictEqual([gc2.state, gc2.date, gc2.fields['Raised from']], ['to raise', null, 'books.md · Book']);
  // "I don't know yet" at the Glossary's gate leaves the change open, with its date.
  assert.deepStrictEqual([gc3.state, gc3.date, gc3.broughtIn], ['left open', '2026-11-02', null]);
  // A "Proposed:" choice on a settled entry is not an answer in use.
  const settled = readDecisions(DECISIONS_FILE.replace('- **Chosen:** Keep every loan as a record', '- **Chosen:** Proposed: Keep every loan as a record'));
  assert.strictEqual(settled.inForce.get('DM-4')!.proposed, null);
  // "Raised": sent to the Glossary with the others in the batch.
  const later = readDecisions(DECISIONS_FILE.replace('- **Status:** To raise', '- **Status:** Raised'));
  assert.strictEqual(later.inForce.get('GC-2')!.state, 'raised');
});

test('data-model: stillOpen lists every open decision and every Glossary change the Glossary hasn\'t settled, with the skill that asks it again', () => {
  const things = 'city-library-glossary-things.md';
  // DM-5 is made product-wide here: things-author asks it.
  const d = readDecisions(DECISIONS_FILE.replace('lending.md · Loan · Browse and Open', `${things} · Lending`));
  const open = stillOpen(d, things);
  assert.deepStrictEqual(open.map((o) => [o.entry.id, o.file, o.asks, o.waits]), [
    ['DM-3', 'lending.md', 'data-model-author', 'not answered yet'],
    ['DM-5', things, 'things-author', 'answered "I don\'t know yet"'],
    ['DM-6', 'lending.md', 'data-model-author', 'not answered yet'],
    ['GC-2', 'books.md', 'data-model-author', 'To raise'],
    // GC-3 was raised from DM-5, so it takes DM-5's file.
    ['GC-3', things, 'things-author', 'Left open on 2026-11-02'],
  ]);
  // A decision settled, and a Glossary change settled or brought in, is not open.
  assert.ok(!open.some((o) => ['DM-4', 'GC-1', 'GC-4'].includes(o.entry.id!) || o.entry.section === 'settled'));
  assert.deepStrictEqual(stillOpen(readDecisions('\n'), things), []);
});

test('data-model: decisionsOf reads the project\'s decisions file, and a missing one comes back empty', () => {
  const out = tempDir('data-model');
  fs.mkdirSync(path.join(out, 'city-library'), { recursive: true });
  const missing = decisionsOf('city-library', { output: out });
  assert.deepStrictEqual([missing.exists, missing.name, missing.rel, missing.entries, missing.open, missing.settled, missing.glossaryChanges, missing.inForce.size], [false, 'city-library-data-model-decisions.md', 'glossary/data-models/city-library-data-model-decisions.md', [], [], [], [], 0]);
  assert.strictEqual(missing.file, path.join(out, 'city-library', 'glossary', 'data-models', 'city-library-data-model-decisions.md'));
  fs.mkdirSync(path.dirname(missing.file), { recursive: true });
  fs.writeFileSync(missing.file, DECISIONS_FILE.replace(/\n/g, '\r\n'));
  const found = decisionsOf('city-library', { output: out });
  assert.strictEqual(found.exists, true);
  assert.deepStrictEqual(found.entries.map((e) => e.id), ['DM-3', 'DM-5', 'DM-6', 'DM-4', 'GC-1', 'GC-2', 'GC-3', 'GC-4']);
  assert.strictEqual(found.inForce.get('DM-3')!.section, 'open');
});

// ---------------------------------------------------------------- accept.ts and version-log.ts

function accept(out: string, document: string, extra: string[] = []): RunResult {
  return run('accept.ts', ['--project', 'expense-claims', '--document', document, '--output', out, '--date', DATE, ...extra]);
}
const SAVED_DECISIONS = /^Saved glossary\/data-models\/expense-claims-data-model-decisions\.md as version (\d+)/gm;
const savedDecisions = (r: RunResult): number[] => [...r.out.matchAll(SAVED_DECISIONS)].map((m) => Number(m[1]));
const versionLog = (dir: string): string[] => readText(path.join(dir, 'version-log', 'log.md')).split('\n').filter((l) => /^\| \d/.test(l));

test('accept: accepting the things file saves the decisions file with it, and so does accepting a data model file', () => {
  const { out, dir, read } = project();
  let r = accept(out, 'data-model-things');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Saved glossary\/data-models\/expense-claims-glossary-things\.md as version 1/m);
  assert.deepStrictEqual(savedDecisions(r), [1]);
  assert.match(read(DECISIONS), new RegExp(`^Status: accepted on ${DATE}, version 1$`, 'm'));
  assert.ok(fs.existsSync(path.join(dir, 'version-log', 'glossary', 'data-models', 'expense-claims-data-model-decisions', 'v1.md')));
  r = accept(out, 'data-model', ['--family', 'claims']);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Saved glossary\/data-models\/claims\.md as version 1/m);
  assert.deepStrictEqual(savedDecisions(r), [2]);
  // A data model file named by its path inside the project saves it too.
  r = accept(out, 'glossary/data-models/claims.md');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(savedDecisions(r), [3]);
  assert.match(read(DECISIONS), new RegExp(`^Status: accepted on ${DATE}, version 3$`, 'm'));
  // The decisions file is saved after the document, and before the Question log.
  const docs = versionLog(dir).map((l) => l.split('|')[2].trim());
  assert.deepStrictEqual(docs.slice(0, 3), [THINGS, DECISIONS, 'expense-claims-question-log.md']);
});

test('accept: no other document saves the decisions file, and a project without one is left as it is', () => {
  const { out, dir, read } = project();
  const before = read(DECISIONS);
  for (const [document, extra] of [['prd', []], ['question-log', []], ['feature-catalog', []], ['frd', ['--capability', 'claim-approval']]] as [string, string[]][]) {
    const r = accept(out, document, extra);
    assert.strictEqual(r.code, 0, `${document}: ${r.out}${r.err}`);
    assert.deepStrictEqual(savedDecisions(r), [], document);
  }
  assert.strictEqual(read(DECISIONS), before);
  assert.ok(!fs.existsSync(path.join(dir, 'version-log', 'glossary', 'data-models', 'expense-claims-data-model-decisions')));
  fs.rmSync(path.join(dir, DECISIONS));
  const r = accept(out, 'data-model-things');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(savedDecisions(r), []);
  assert.ok(!fs.existsSync(path.join(dir, DECISIONS)));
});

test('accept: a data model file with no family named exits with code 2, and saves nothing', () => {
  const { out, dir } = project();
  const r = accept(out, 'data-model');
  assert.strictEqual(r.code, 2, r.out + r.err);
  assert.match(r.err, /"data-model" needs a value for \{family\}\. Use --family/);
  assert.ok(!fs.existsSync(path.join(dir, 'version-log')));
});

test('accept: --document data-model-decisions saves the decisions file on its own, once', () => {
  const { out, dir, read } = project();
  const r = accept(out, 'data-model-decisions');
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.deepStrictEqual(savedDecisions(r), [1]);
  assert.match(read(DECISIONS), new RegExp(`^Status: accepted on ${DATE}, version 1$`, 'm'));
  assert.doesNotMatch(r.out, /glossary-things|claims\.md/);
  assert.deepStrictEqual(versionLog(dir).map((l) => l.split('|')[2].trim()), [DECISIONS, 'expense-claims-question-log.md']);
});

test('version-log: the decisions file\'s row names its last settled decision, never an open one', () => {
  const { out, dir, change, read } = project();
  const save = (): string[] => {
    const r = run('version-log.ts', ['--project', 'expense-claims', '--document', 'data-model-decisions', '--output', out, '--date', DATE]);
    assert.strictEqual(r.code, 0, r.err);
    const rows = versionLog(dir);
    return rows[rows.length - 1].split('|').map((c) => c.trim()).slice(1, 5);
  };
  assert.deepStrictEqual(save(), ['1', DECISIONS, DATE, 'DM-9']);
  // An open decision is not settled, so the row still names DM-9.
  change(DECISIONS, NO_OPEN, withOpen(openDecision('DM-10'), openDecision('DM-11')));
  assert.deepStrictEqual(save(), ['2', DECISIONS, DATE, 'DM-9']);
  // Settled entries come in the order they are settled, not by number: DM-11 is settled first, then DM-10, so DM-10
  // comes last.
  for (const id of ['DM-11', 'DM-10']) {
    change(DECISIONS, openDecision(id), '');
    const settled = openDecision(id).replace('- **How it is asked:** One at a time\n- **Chosen:** open\n', '- **Chosen:** Paid in one go\n- **Decided by:** PO, 2026-10-12\n');
    change(DECISIONS, '\n## Glossary changes', `\n${settled}\n## Glossary changes`);
  }
  assert.deepStrictEqual(save(), ['3', DECISIONS, DATE, 'DM-10']);
  // With nothing settled, the row says None.
  const text = read(DECISIONS);
  fs.writeFileSync(path.join(dir, DECISIONS), `${text.slice(0, text.indexOf('## Settled'))}## Settled\n\nNone yet.\n\n${text.slice(text.indexOf('## Glossary changes'))}`);
  assert.deepStrictEqual(save(), ['4', DECISIONS, DATE, 'None']);
});

test('version-log: a data model file in the earlier status form gets the kit\'s status line, and keeps its line endings', () => {
  const { out, dir, read } = project();
  // The copy in the temporary folder ends its lines with "\r\n", as Windows saves them.
  const file = path.join(dir, CLAIMS);
  fs.writeFileSync(file, read(CLAIMS).replace('Status: accepted on 2026-10-11, version 1', 'Status: Accepted on 2026-10-11, with open decisions').replace(/\n/g, '\r\n'));
  const r = run('version-log.ts', ['--project', 'expense-claims', '--document', 'data-model', '--family', 'claims', '--output', out, '--date', DATE]);
  assert.strictEqual(r.code, 0, r.err);
  const raw = fs.readFileSync(file, 'utf8');
  assert.match(raw, new RegExp(`^# Data model — Claims, Expense claims\\r\\n\\r\\nStatus: accepted on ${DATE}, version 1\\r\\n`));
  assert.ok(!/[^\r]\n/.test(raw), 'a line lost its "\\r\\n"');
  const copy = fs.readFileSync(path.join(dir, 'version-log', 'glossary', 'data-models', 'claims', 'v1.md'), 'utf8');
  assert.strictEqual(copy, raw);
  assert.strictEqual(statusOf(read(CLAIMS)).version, 1);
});

// ---------------------------------------------------------------- report

report();
