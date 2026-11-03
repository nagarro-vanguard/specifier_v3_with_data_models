#!/usr/bin/env node
// Tests for one requirement per row: lib/one-per-row.ts, against _shared/atomic-rules.md, part 4.
//
//   node tools/tests/one-per-row.test.ts
//
// Nothing is written: every test reads text it builds itself. The notices each check program shows are tested with
// that program: check-prd.ts and check-brd.ts in requirements.test.ts, check-stories.ts in stories.test.ts.

import fs from 'node:fs';
import assert from 'node:assert';
import { check, notices, KINDS, RULES, type RowKind } from '../lib/one-per-row.ts';
import { test, report } from './helpers/harness.ts';

// Why one text may hold two requirements, or null when it isn't listed.
const why = (text: string, kind?: RowKind): string | null => {
  const found = check([{ id: 'R-1', text, kind }]);
  return found.length ? found[0].what : null;
};
// Every text of a list that is listed, so a failure names them all.
const listed = (texts: string[], kind?: RowKind): string[] => texts.filter((t) => why(t, kind) !== null);

// ---------------------------------------------------------------- what it reads

test('it reads four kinds of row, and its rules file is atomic-rules.md', () => {
  assert.deepStrictEqual(KINDS, ['statement', 'action', 'step', 'name']);
  assert.ok(RULES.replace(/\\/g, '/').endsWith('.claude/skills/_shared/atomic-rules.md'), RULES);
  assert.ok(fs.existsSync(RULES));
});

test('a kind it doesn\'t read is an error that names the four', () => {
  assert.throws(() => check([{ id: 'R-1', text: 'A customer pays.', kind: 'sentence' as RowKind }]), /"sentence" isn't a kind of row\. Use statement, action, step, name\./);
});

test('a row with no kind is read as a statement, and the rows listed keep the order given', () => {
  const found = check([
    { id: 'BR-01', text: 'A line manager can approve or reject a claim.' },
    { id: 'BR-02', text: 'A claim is approved once.' },
    { id: 'BR-03', text: 'Staff can send and change a claim.' },
  ]);
  assert.deepStrictEqual(found, [
    { id: 'BR-01', kind: 'statement', what: 'two actions joined by "or"' },
    { id: 'BR-03', kind: 'statement', what: 'two actions joined by "and"' },
  ]);
});

// ---------------------------------------------------------------- what it lists, kind by kind

test('statement: two actions after an action word are listed, whichever rule finds the second action', () => {
  // The word before "or" is the first action.
  assert.strictEqual(why('A line manager can approve or reject a claim.', 'statement'), 'two actions joined by "or"');
  // A word such as "it" or "an" follows the second action.
  assert.strictEqual(why('A customer can add an item to the cart, or remove it.', 'statement'), 'two actions joined by "or"');
  assert.strictEqual(why('A picker can pause, stop and restart a list.', 'statement'), 'two actions joined by "and"');
  // Both words around "and" end in "ed".
  assert.strictEqual(why('A campaign can be paused, stopped and restarted.', 'statement'), 'two actions joined by "and"');
  // "need to", "want to" and "able to" are action words too.
  assert.strictEqual(why('Staff need to send and change their claims.', 'statement'), 'two actions joined by "and"');
});

test('statement: two things not allowed are listed', () => {
  assert.strictEqual(why('There is no guest checkout and no gift wrapping.', 'statement'), 'two things not allowed');
  assert.strictEqual(why('A claim is never paid twice, nor paid without its receipts.', 'statement'), 'two things not allowed');
});

test('statement: a bold title at the start is not read, and an "and" before the action word joins nothing', () => {
  assert.deepStrictEqual(listed([
    '**Approve or reject** — A line manager approves each claim.',
    'Claims are approved and the claimant can see them.',
  ], 'statement'), []);
  assert.strictEqual(why('**Approval** — A line manager can approve or reject a claim.', 'statement'), 'two actions joined by "or"');
});

test('action: a second action after "and" or "or" is listed, from the first word on', () => {
  assert.strictEqual(why('approve a claim and pay it', 'action'), 'two actions joined by "and"');
  assert.strictEqual(why('**only** let the claimant\'s own line manager approve or reject a claim', 'action'), 'two actions joined by "or"');
  // A story's "I want" starts with "to".
  assert.strictEqual(why('to reject a claim with a reason and return it to the claimant', 'action'), 'two actions joined by "and"');
  assert.strictEqual(why('**not** accept a rejection that gives no reason and no note', 'action'), 'two things not allowed');
  assert.deepStrictEqual(listed(['send each claim to the claimant\'s own line manager', 'let a claimant see claims and receipts'], 'action'), []);
});

test('step: a scenario\'s When with "and" or "or" is listed, unless a number or a word such as "more" follows', () => {
  assert.strictEqual(why('the line manager approves it and adds a note', 'step'), 'two actions joined by "and"');
  assert.strictEqual(why('the line manager approves it and the claimant is told', 'step'), 'two actions joined by "and"');
  assert.deepStrictEqual(listed([
    'the claimant sends one or more claims',
    'the claimant sends 2 or 3 claims',
    'the claimant sends it, and so on',
    'the line manager rejects it without giving a reason',
  ], 'step'), []);
});

test('name: "and", "or", "plus", "/", "&" or a comma in a name is listed', () => {
  for (const n of ['Approve and reject claims', 'Approve or reject', 'Claims plus receipts', 'Claims/receipts', 'Claims & receipts', 'Approve, reject']) {
    assert.strictEqual(why(n, 'name'), 'two things in one name', n);
  }
  assert.deepStrictEqual(listed(['Claim approval', 'Reject a Claim', 'Approve a Claim over 500'], 'name'), []);
});

// ---------------------------------------------------------------- what it must not list

test('a "so that" part is not read, because it gives the reason', () => {
  assert.strictEqual(why('A customer can sign in, so that the shop can track and reorder each order.', 'statement'), null);
  assert.strictEqual(why('A customer can track and reorder each order.', 'statement'), 'two actions joined by "and"', 'the same words, outside "so that", are listed');
});

test('a list of the values of one thing, or of the details of one thing, is never listed', () => {
  assert.deepStrictEqual(listed([
    'A customer can mark an order Open, Paid or Sent.',
    'A customer can mark an order **Open**, **Paid** or **Sent**.',
    'An order is **Open**, **Paid** or **Sent**.',
    'Each address must have a street, a city and a postcode.',
    'A user can see epics and stories.',
    'A customer can pay by card, for example Visa or Mastercard.',
  ], 'statement'), []);
  assert.deepStrictEqual(listed(['show `Approve` or `Reject` to the manager', 'let a claim be **Approved** or **Rejected**'], 'action'), []);
});

test('"whether or not" joins nothing', () => {
  assert.strictEqual(why('A manager can choose whether or not to approve a claim.', 'statement'), null);
  assert.strictEqual(why('ask whether or not the claim is paid', 'action'), null);
});

// ---------------------------------------------------------------- notices

test('notices: nothing found gives no line', () => {
  assert.deepStrictEqual(notices([], 'rule'), []);
  assert.deepStrictEqual(notices(check([{ id: 'R-1', text: 'A claim is approved once.' }])), []);
});

test('notices: one line counts the rows, in the noun given, then one line for each', () => {
  const found = check([
    { id: 'BR-01', text: 'A line manager can approve or reject a claim.' },
    { id: 'BR-02', text: 'Staff can send and change a claim.' },
  ]);
  assert.deepStrictEqual(notices(found, 'business requirement'), [
    'One requirement per row, to look at: 2 business requirements may hold two actions joined by "and" or "or". Split each one whose actions can be built on their own.',
    '- BR-01',
    '- BR-02',
  ]);
  // The noun is "row" when it is left out, and is counted in the singular for one row.
  assert.strictEqual(notices(found.slice(0, 1))[0], 'One requirement per row, to look at: 1 row may hold two actions joined by "and" or "or". Split each one whose actions can be built on their own.');
});

test('notices: when every row found is a name, the line says names, and a noun ending in "y" counts as "ies"', () => {
  const found = check([{ id: 'Approve and pay', text: 'Approve and pay', kind: 'name' }, { id: 'Claims/receipts', text: 'Claims/receipts', kind: 'name' }]);
  assert.deepStrictEqual(notices(found, 'story'), [
    'One requirement per row, to look at: 2 stories may name two things joined by "and", "or", "/" or a comma. Split each one whose parts can be built on their own.',
    '- Approve and pay',
    '- Claims/receipts',
  ]);
  assert.match(notices(found.slice(0, 1), 'feature name')[0], /: 1 feature name may name two things/);
});

// ---------------------------------------------------------------- report

report();
