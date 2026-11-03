#!/usr/bin/env node
// Tests for check-question.ts: the kit's own asking example passes, and a question out of the blue is refused.
//
//   node tools/tests/check-question.test.ts

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { checkMessage, checkControl } from '../check-question.ts';
import { spawnSync } from 'node:child_process';
import { SKILLS, TOOLS, test, report } from './helpers/harness.ts';

const EXAMPLE = path.join(SKILLS, 'probing-questions-author', 'references', 'asking-example.md');

// The message in the example, without its quote marks.
function exampleMessage(): string {
  const text = fs.readFileSync(EXAMPLE, 'utf8');
  const part = text.slice(text.indexOf('## The message'), text.indexOf('## The control'));
  return part.split('\n').filter((l) => l.startsWith('>')).map((l) => l.replace(/^> ?/, '')).join('\n');
}

const GOOD_CONTROL = [{
  question: 'When do the 30 days for a return start?',
  options: [
    { label: 'From the day it arrives (Recommended)', description: 'Choose this if orders can arrive late. Then the 30 days start when the customer gets the item.' },
    { label: 'From the day of the order', description: 'Choose this if support checks one date. Then a late delivery shortens the time to return.' },
    { label: "I don't know yet", description: 'Then I use "from the day it arrives", not confirmed yet.' },
  ],
}];

test("the kit's asking example has every part", () => {
  assert.deepStrictEqual(checkMessage(exampleMessage()), []);
});

test('a question out of the blue is refused, part by part', () => {
  const findings = checkMessage('Q15 (Must answer): is REQ-1.4 per item? See mcp-spec-v4.md.');
  assert.ok(findings.some((f) => f.includes('"Where we are"')));
  assert.ok(findings.some((f) => f.includes('names a file')));
  assert.ok(findings.some((f) => f.includes('"REQ-1.4"')));
  assert.ok(findings.some((f) => f.includes('"Must answer"')));
});

test('the reference at the end may hold a code', () => {
  const message = `${exampleMessage().replace('(question 7)', '')}\n(data model decision DM-3)`;
  assert.deepStrictEqual(checkMessage(message), []);
});

test('the choices put the agreed way pass', () => {
  assert.deepStrictEqual(checkControl(GOOD_CONTROL), []);
});

test('choices without a recommendation first or "I don\'t know yet" are refused', () => {
  const [q] = GOOD_CONTROL;
  const findings = checkControl([{ ...q, options: [q.options[1], { ...q.options[0], label: 'Yes, from arrival' }] }]);
  assert.ok(findings.some((f) => f.includes('recommended one')));
  assert.ok(findings.some((f) => f.includes("I don't know yet")));
  assert.ok(findings.some((f) => f.includes('starts with Yes or No')));
});

test("the gate's own question needs no \"I don't know yet\"", () => {
  const control = [{ question: 'Accept the PRD?', options: [
    { label: 'Accept (Recommended)', description: 'Choose this if everything shown is right. Then the PRD is saved.' },
    { label: 'Change something first', description: 'Choose this if something is wrong. Then you say what.' },
  ] }];
  assert.deepStrictEqual(checkControl(control), []);
});

// The hook reads Claude Code's JSON on stdin, which run() doesn't give, so it is started here.
function hook(input: object): string {
  return spawnSync(process.execPath, [path.join(TOOLS, 'check-question.ts'), '--hook'], { input: JSON.stringify(input), encoding: 'utf8' }).stdout;
}

test('as a hook, it refuses a question in the next-step box, and lets the box through without one', () => {
  assert.match(hook({ tool_name: 'mcp__ccd_turn__wrap_up', tool_input: { recap: 'Done.', ask: 'Shall I?' } }), /"permissionDecision":"deny"/);
  assert.strictEqual(hook({ tool_name: 'mcp__ccd_turn__wrap_up', tool_input: { recap: 'Done.' } }), '');
});

report();
