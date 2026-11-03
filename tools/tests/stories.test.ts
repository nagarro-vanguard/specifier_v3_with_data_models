#!/usr/bin/env node
// Tests for the stories: their programs and their skills.
//
//   node tools/tests/stories.test.ts
//
// Every test works on a copy in a temporary folder. Nothing in fixtures/ or Output/ is changed.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert';
import { lint } from '../lib/md-lint.ts';
import { tableUnder } from '../lib/md-tables.ts';
import type { Row } from '../lib/md-tables.ts';
import { readerCopy } from '../reader-copy.ts';
import { KIT, TOOLS, SKILLS, FIXTURES, readText, test, run, report } from './helpers/harness.ts';
import { expenseClaims } from './helpers/projects.ts';
import type { TestProject } from './helpers/projects.ts';

const FIXTURE = path.join(FIXTURES, 'expense-claims');

const project = (): TestProject => expenseClaims('stories');

const E2 = 'epics/EPIC-002-claim-approval';
const BRIEF = `${E2}/brief.md`;
const LIST = `${E2}/story-list.md`;
const REJECT = `${E2}/reject-a-claim.md`;
const OVER = `${E2}/approve-a-claim-over-500.md`;
const REGISTER = 'epics/register.md';
const epicArgs = (out: string, epic = 'EPIC-002'): string[] => ['--project', 'expense-claims', '--epic', epic, '--output', out, '--date', '2026-10-22'];

// ---------------------------------------------------------------- route-brief-list

test('route-brief-list: it answers yes or no for every EPIC, and an EPIC not on the list exits with code 1', () => {
  const { out, change } = project();
  let r = run('route-brief-list.ts', epicArgs(out, 'EPIC-002'));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^yes\nEPIC-002 Claim approval: it gets an EPIC brief/);
  r = run('route-brief-list.ts', epicArgs(out, 'EPIC-001'));
  assert.match(r.out, /^no\n/);
  change('epics/grouping.md', '| 1 | 1 Claim submission | no | its features are clear from the catalog |\n', '');
  r = run('route-brief-list.ts', epicArgs(out, 'EPIC-001'));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /isn't in the EPIC grouping's EPIC brief list/);
});

// ---------------------------------------------------------------- route-next-epic

// Four EPICs, in run order: 2 depends on 1, 4 on 3.
const FOUR = `| EPIC | Name | Outcome | Features | Band | Persona | Depends on |
|---|---|---|---|---|---|---|
| EPIC-001 | Claim submission | o | • F-01 | MVP | Claimant | None |
| EPIC-002 | Claim approval | o | • F-04 | MVP | Line manager | • EPIC-001 |
| EPIC-003 | Claim stages | o | • F-03 | Later | Claimant | None |
| EPIC-004 | Finance approval | o | • F-05 | MVP | Finance approver | • EPIC-003 |`;
const FOUR_ORDER = `| Order | EPIC | Rationale |
|---|---|---|
| 1 | EPIC-001 | r |
| 2 | EPIC-002 | r |
| 3 | EPIC-003 | r |
| 4 | EPIC-004 | r |`;

function fourEpics(env: TestProject): void {
  const reg = env.read(REGISTER);
  const a = reg.indexOf('| EPIC | Name |');
  const b = reg.indexOf('\n\n## 2. Run order');
  const c = reg.indexOf('| Order | EPIC |');
  env.write(REGISTER, `${reg.slice(0, a)}${FOUR}${reg.slice(b, c)}${FOUR_ORDER}\n`);
  // EPIC-002's stories are not ready yet.
  env.write(LIST, env.read(LIST).replace(/\| ready \|$/gm, '| groomed |'));
}
const parkList = (env: TestProject, folder: string): void => env.write(`epics/${folder}/story-list.md`, env.read(LIST).replace(/^Status: .*$/m, 'Status: parked on 2026-10-20, at its gate'));

test('route-next-epic: EPICs come in run order, and a ready EPIC is left out', () => {
  const env = project();
  const r = run('route-next-epic.ts', ['--project', 'expense-claims', '--output', env.out]);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Next: EPIC-001 Claim submission$/m);
  assert.match(r.out, /^Ready: EPIC-002$/m);
});

test('route-next-epic: with EPIC-001 parked, it names EPIC-003, then EPIC-004, then EPIC-001, and EPIC-002 waits for it', () => {
  const env = project();
  fourEpics(env);
  parkList(env, 'EPIC-001-claim-submission');
  const r = run('route-next-epic.ts', ['--project', 'expense-claims', '--output', env.out]);
  assert.match(r.out, /^Next: EPIC-003 Claim stages$/m);
  assert.match(r.out, /^1\. EPIC-003 Claim stages: not started\n2\. EPIC-004 Finance approval: not started\n3\. EPIC-001 Claim submission: parked\n4\. EPIC-002 Claim approval: waits for parked EPIC-001$/m);
});

test('route-next-epic: an EPIC whose stories name an open Must answer question goes after the others, and comes back when only it is left', () => {
  const env = project();
  env.write(LIST, env.read(LIST).replace(/\| ready \|$/gm, '| groomed |'));
  env.change(REJECT, '- The reason reaches the claimant: the claimant sees why their claim was rejected', '- The reason reaches the claimant: the claimant sees why their claim was rejected, in euros, Proposed (needs confirmation), question 4');
  let r = run('route-next-epic.ts', ['--project', 'expense-claims', '--output', env.out]);
  assert.match(r.out, /^Next: EPIC-001 Claim submission$/m);
  assert.match(r.out, /^2\. EPIC-002 Claim approval: waits on Must answer question 4$/m);
  // Once EPIC-001 is ready, the waiting EPIC comes back, and says why.
  env.write('epics/EPIC-001-claim-submission/story-list.md', env.read(LIST).replace(/\| groomed \|$/gm, '| ready |'));
  r = run('route-next-epic.ts', ['--project', 'expense-claims', '--output', env.out]);
  assert.match(r.out, /^Next: EPIC-002 Claim approval: waits on Must answer question 4, but nothing else is ready$/m);
});

test('route-next-epic: once every EPIC is ready, it says so', () => {
  const env = project();
  env.write('epics/EPIC-001-claim-submission/story-list.md', env.read(LIST));
  const r = run('route-next-epic.ts', ['--project', 'expense-claims', '--output', env.out]);
  assert.strictEqual(r.out, 'Every EPIC ready.\n');
});

// ---------------------------------------------------------------- check-epic-brief

test('check-epic-brief: the Claim approval brief passes every check', () => {
  const { out } = project();
  const r = run('check-epic-brief.ts', epicArgs(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Every check passed: 13 checks\.$/m);
  assert.match(r.out, /^- 1 NFR that applies$/m);
});

const BRIEF_FAILURES: [string, string, string, RegExp][] = [
  ['a missing section', '## 6. Dependencies', '## 6. Depends on', /Sections: The section "6\. Dependencies" is missing\./],
  ['a feature its register row hasn\'t got', '| F-05 | Finance approval | • REQ-3.2 |', '| F-03 | Finance approval | • REQ-3.2 |', /The features are F-04, F-03; the register row has F-04, F-05\./],
  ['an NFR the PRD hasn\'t got', '| NFR-1 |', '| NFR-7 |', /NFR-7 isn't an NFR in the PRD\./],
  ['an NFR written out instead of its ID', '| NFR-1 |', '| It should work during office hours at least. |', /The NFR section lists only NFR IDs, never their wording\./],
  ['a hypothesis that isn\'t the register\'s outcome', '**Epic hypothesis:** As a line manager, I need to approve or reject my team\'s claims, so that only checked claims are paid.', '**Epic hypothesis:** As a line manager, I need to approve claims, so that claims are paid.', /The hypothesis isn't the register's outcome, word for word/],
  ['a retired Glossary word', 'Every claim needs someone other than its claimant to approve it', 'Every expense report needs someone other than its claimant to approve it', /"expense report" is a retired word; use Claim\./],
  ['an AI-RECOMMENDED measure with a made-up target', '| TBD, question 7 | TENTATIVE: no file gives a target |', '| 10 days | AI-RECOMMENDED |', /is AI-RECOMMENDED, so its baseline and target are TBD\./],
  ['an Out of scope feature with the wrong owner', '- F-03 Claim stages — owned by EPIC-001', '- F-03 Claim stages — owned by EPIC-002', /Out of scope: F-03 is owned by EPIC-001\./],
];

for (const [what, from, to, finding] of BRIEF_FAILURES) {
  test(`check-epic-brief: finds ${what}`, () => {
    const { out, change } = project();
    change(BRIEF, from, to);
    const r = run('check-epic-brief.ts', epicArgs(out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

// ---------------------------------------------------------------- check-stories

test('check-stories: the three ready stories of Claim approval pass every check', () => {
  const { out } = project();
  const r = run('check-stories.ts', epicArgs(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 0 drafted, 0 groomed, 3 ready$/m);
});

const STORY_FAILURES: [string, string | RegExp, string, RegExp, string][] = [
  ['a list row whose Story file is missing', '[Approve a Claim over 500](approve-a-claim-over-500.md)', '[Approve a Claim over 500](approve-a-large-claim.md)', /"Approve a Claim over 500" has no file: approve-a-large-claim\.md\./, LIST],
  ['a statement that isn\'t "As a / I want / So that"', '| As a line manager, I want to reject a claim with a reason, so that the claimant knows what to fix. |', '| A line manager rejects a claim. |', /"Reject a Claim": its statement should read "As a \.\.\., I want \.\.\., so that \.\.\."\./, LIST],
  ['a statement the Story file doesn\'t repeat word for word', 'As a line manager, I want to reject a claim with a reason, so that the claimant knows what to fix.\n\n## Dependencies', 'As a line manager, I want to reject a claim, so that the claimant knows what to fix.\n\n## Dependencies', /Reject a Claim: its statement isn't the list's, word for word\./, REJECT],
  ['a feature from another EPIC', '| • REQ-3.2 | F-05 | ready |', '| • REQ-3.2 | F-03 | ready |', /"Approve a Claim over 500": F-03 isn't one of EPIC-002's features\./, LIST],
  ['a rule not quoted word for word', '| F-04.4 | **not** accept a rejection that gives no reason |', '| F-04.4 | **not** accept a rejection without a reason |', /Reject a Claim: F-04\.4 isn't quoted word for word from its FRD\./, REJECT],
  ['a rule no FRD has', '| F-04.4 | **not** accept a rejection that gives no reason |', '| F-04.9 | **not** accept a rejection that gives no reason |', /Reject a Claim: F-04\.9 isn't a rule in any FRD\./, REJECT],
  ['a rule on the wrong step', '| 6 | F-05.2 |', '| 7 | F-05.2 |', /Approve a Claim over 500: F-05\.2 is on step 6 of FRD-3a's flow, so its Step is 6, not 7\./, OVER],
  ['an alternate rule given a step number', '| Alternate | F-04.4 |', '| 3 | F-04.4 |', /Reject a Claim: F-04\.4 is on an alternate step of FRD-3a's flow, so its Step is Alternate, not 3\./, REJECT],
  ['rules out of flow order', '| 6 | F-05.2 | let a finance approver approve a claim over 500 |\n| 7 | F-05.3 | **not** pay a claim over 500 until a finance approver approves it |', '| 7 | F-05.3 | **not** pay a claim over 500 until a finance approver approves it |\n| 6 | F-05.2 | let a finance approver approve a claim over 500 |', /Approve a Claim over 500: the rules aren't in the order of FRD-3a's flow: F-05\.2 comes before F-05\.3 there\./, OVER],
  ['a scenario that names no rule', '**Scenario 2 - Reject without a reason (F-04.4)**', '**Scenario 2 - Reject without a reason**', /Reject a Claim: Scenario 2 names no rule it proves/, REJECT],
  ['a scenario that names a rule no FRD has', '**Scenario 2 - Reject without a reason (F-04.4)**', '**Scenario 2 - Reject without a reason (F-04.9)**', /Reject a Claim: Scenario 2 names F-04\.9, which isn't a rule in any FRD\./, REJECT],
  ['a scenario that isn\'t behaviour only', '- **When** the line manager rejects it without giving a reason', '- **When** the line manager clicks the reject button without giving a reason', /Reject a Claim: Scenario 2 uses "click": a scenario is behaviour only\./, REJECT],
  ['too few scenarios', '**Scenario 3 - Only the claimant\'s own manager rejects (F-04.7)**\n- **Given** a claim waits for its line manager\'s approval\n- **When** a line manager from another team rejects it\n- **Then** the claim is not rejected\n- **And** it still waits for its own line manager\n', '', /Reject a Claim: it has 2 scenarios; it needs three to seven\./, REJECT],
  ['a ready story with a grooming section missing', /## Scope\n[\s\S]*?\n## Rules/, '## Rules', /Reject a Claim: it is ready, but it has no Scope section\./, REJECT],
  ['a ready story with no acceptance criteria', /\n## Acceptance criteria\n[\s\S]*$/, '\n', /Reject a Claim: it is ready, but it has no acceptance criteria\./, REJECT],
];

for (const [what, from, to, finding, file] of STORY_FAILURES) {
  test(`check-stories: finds ${what}`, () => {
    const env = project();
    if (from instanceof RegExp) env.write(file, env.read(file).replace(from, to));
    else env.change(file, from, to);
    const r = run('check-stories.ts', epicArgs(env.out));
    assert.strictEqual(r.code, 1, r.out + r.err);
    assert.match(r.out, finding);
  });
}

// Each story cut back to its stage: a drafted story ends after its Description, a groomed one before its criteria.
function cutBack(env: TestProject, stage: string, before: string): void {
  env.write(LIST, env.read(LIST).replace(/\| ready \|$/gm, `| ${stage} |`));
  for (const f of ['approve-a-claim.md', 'reject-a-claim.md', 'approve-a-claim-over-500.md']) {
    const t = env.read(`${E2}/${f}`).replace('| Status | ready |', `| Status | ${stage} |`);
    env.write(`${E2}/${f}`, t.slice(0, t.indexOf(before)));
  }
}

test('check-stories: drafted stories pass with their Description only', () => {
  const env = project();
  cutBack(env, 'drafted', '## Dependencies');
  const r = run('check-stories.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 3 drafted, 0 groomed, 0 ready$/m);
});

test('check-stories: groomed stories pass with no acceptance criteria yet', () => {
  const env = project();
  cutBack(env, 'groomed', '## Acceptance criteria');
  const r = run('check-stories.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^- 0 drafted, 3 groomed, 0 ready$/m);
});

test('check-stories: the ready guard fails while a Must answer question raised in these stories is open', () => {
  const env = project();
  // Question 4, a Must answer question, now raised in one of these stories.
  const log = env.read('expense-claims-question-log.md');
  const q4 = log.indexOf('### Question 4:');
  const at = log.indexOf('| Raised in |', q4);
  const end = log.indexOf('\n', at);
  env.write('expense-claims-question-log.md', `${log.slice(0, at)}| Raised in | [reject-a-claim.md](${E2}/reject-a-claim.md), Scope |${log.slice(end)}`);
  const r = run('check-stories.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /The ready guard: question 4, "Which currencies can a claim be made in\?", raised in these stories, is a Must answer question still open: the stories can't be marked ready until it is answered\./);
});

test('check-stories: a story whose "I want" may hold two actions, and a scenario whose When may, are shown to look at, never a finding', () => {
  const env = project();
  assert.doesNotMatch(run('check-stories.ts', epicArgs(env.out)).out, /One requirement per row/);
  // The statement is in the list and in its Story, word for word.
  for (const f of [LIST, REJECT]) env.change(f, 'I want to reject a claim with a reason, so that', 'I want to reject a claim with a reason and return it to the claimant, so that');
  env.change(REJECT, '- **When** the line manager rejects it without giving a reason', '- **When** the line manager rejects it and closes it without giving a reason');
  const r = run('check-stories.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^One requirement per row, to look at: 1 story may hold two actions joined by "and" or "or"\. Split each one whose actions can be built on their own\.\n- Reject a Claim$/m);
  assert.match(r.out, /^One requirement per row, to look at: 1 scenario may hold two actions joined by "and" or "or"\. Split each one whose actions can be built on their own\.\n- Reject a Claim, Scenario 2$/m);
});

test('check-stories: a story whose title may name two things is shown once, as a name, even when its "I want" may hold two actions too', () => {
  const env = project();
  for (const f of [LIST, REJECT]) env.change(f, 'I want to reject a claim with a reason, so that', 'I want to reject a claim with a reason and return it to the claimant, so that');
  // The title is in the list, the Coverage table and the Story's heading.
  env.change(LIST, '| [Reject a Claim](reject-a-claim.md) |', '| [Reject or return a Claim](reject-a-claim.md) |');
  env.change(LIST, '<br>• Reject a Claim |', '<br>• Reject or return a Claim |');
  env.change(REJECT, '# Story — Reject a Claim', '# Story — Reject or return a Claim');
  const r = run('check-stories.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^One requirement per row, to look at: 1 story may name two things joined by "and", "or", "\/" or a comma\. Split each one whose parts can be built on their own\.\n- Reject or return a Claim$/m);
});

// ---------------------------------------------------------------- coverage-check

test('coverage-check: every rule of EPIC-002\'s features is proved, and a rule from another EPIC is never flagged', () => {
  const env = project();
  let r = run('coverage-check.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /EPIC-002 Claim approval, 2 features, 12 rules: every rule is named by at least one scenario\./);
  // A rule of EPIC-001's feature, F-01, in the same FRD folder, is left out of EPIC-002's count.
  env.write('frd/frd-making-a-claim.md', '# FRD-2a Making a claim\n\n## Rules\n\n### F-01 Send a claim\n\n| Rule | The system shall… | Source |\n|---|---|---|\n| F-01.1 | let an employee send a claim | req — from the requirement |\n');
  r = run('coverage-check.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 0, r.out + r.err);
});

test('coverage-check: a rule no scenario proves is caught', () => {
  const env = project();
  env.change(OVER, '**Scenario 2 - A claim of 500 or less doesn\'t (F-05.4)**', '**Scenario 2 - A claim of 500 or less doesn\'t (F-05.1)**');
  const r = run('coverage-check.ts', epicArgs(env.out));
  assert.strictEqual(r.code, 1, r.out + r.err);
  assert.match(r.out, /^- F-05\.4 \(FRD-3a\): \*\*only\*\* send a claim to a finance approver when it is over 500$/m);
});

// ---------------------------------------------------------------- reader-copy

test('reader-copy: a story without its opening notes and its lines in italics, and the Story file unchanged', () => {
  const env = project();
  const before = env.read(REJECT);
  const r = run('reader-copy.ts', ['--file', path.join(env.dir, REJECT)]);
  assert.strictEqual(r.code, 0, r.err);
  assert.doesNotMatch(r.out, /What this is|What it is not|Written by|Lineage|Primary source/);
  assert.doesNotMatch(r.out, /^\*[^*].*\*$/m);
  assert.match(r.out, /^# Story — Reject a Claim\n\n\| \| \|\n/);
  assert.match(r.out, /^## Description\n\nAs a line manager, I want to reject a claim with a reason, so that the claimant knows what to fix\.\n/m);
  assert.match(r.out, /^\| Alternate \| F-04\.4 \| \*\*not\*\* accept a rejection that gives no reason \|$/m);
  assert.match(r.out, /^\*\*Scenario 2 - Reject without a reason \(F-04\.4\)\*\*$/m);
  assert.strictEqual(env.read(REJECT), before);
});

test('reader-copy: a citation goes and the words around it stay; other block quotes and code blocks stay', () => {
  assert.strictEqual(readerCopy('- Claims over 500 need a second check — per claims-requirements-v2.docx, section 3.2\n'), '- Claims over 500 need a second check\n');
  assert.strictEqual(readerCopy('Every claim is approved before it is paid — per BR-03.\n'), 'Every claim is approved before it is paid.\n');
  assert.strictEqual(readerCopy('| Finance approver | Yes, per claims-requirements-v2.docx, section 3.2 | No |\n'), '| Finance approver | Yes | No |\n');
  const alert = '> **SIZING ALERT**\n> This story may exceed the recommended 2-day scope based on:\n> - nine rules\n';
  assert.strictEqual(readerCopy(alert), alert);
  const code = '```mermaid\nflowchart TD\n    A["*a step*"] --> B\n```\n';
  assert.strictEqual(readerCopy(code), code);
});

test('reader-copy: a missing document exits with code 2', () => {
  const r = run('reader-copy.ts', ['--file', path.join(os.tmpdir(), 'no-such-story.md')]);
  assert.strictEqual(r.code, 2, r.out + r.err);
});

// ---------------------------------------------------------------- the skills and the workflow

test('stories-workflow: its steps are the master plan\'s Workflow 4 table, step for step', () => {
  const plan = tableUnder(path.join(KIT, 'master-plan.md'), 'Workflow 4: `stories-workflow`');
  const skill = tableUnder(path.join(SKILLS, 'stories-workflow', 'SKILL.md'), 'The steps');
  const pick = (rows: Row[] | null, check: string, gate: string): string[] => rows!.map((r) => [r.Step, r['Done by'], r['Previous step'], r.Reads, r['Looks up by ID'], r.Writes, r[check], r[gate], r['Next step']].map((c) => JSON.stringify(c)).join(' | '));
  assert.deepStrictEqual(pick(skill, 'Check before the gate', 'Gate'), pick(plan, 'Check before your gate', 'Your gate'));
});

test('the stories skills: each has its name, a description, its opening block, and every file and program it points to exists', () => {
  for (const name of ['story-drafter', 'story-groomer', 'ac-author', 'stories-workflow']) {
    const dir = path.join(SKILLS, name);
    const t = readText(path.join(dir, 'SKILL.md'));
    assert.match(t, new RegExp(`^---\\nname: ${name}\\n`), `${name}: the name line`);
    assert.match(t, /\ndescription: >-\n {2}\S/, `${name}: the description`);
    for (const m of ['> **What this is:**', '> **What it is not:**', '> **Who uses it:**']) assert.ok(t.includes(m), `${name}: ${m}`);
    for (const ref of t.matchAll(/`((?:\.\.\/_shared|references)\/[^`]+\.md)`/g)) assert.ok(fs.existsSync(path.join(dir, ref[1])), `${name}: ${ref[1]} doesn't exist`);
    for (const prog of t.matchAll(/`(?:node )?tools\/([a-z-]+\.ts)/g)) assert.ok(fs.existsSync(path.join(TOOLS, prog[1])), `${name}: tools/${prog[1]} doesn't exist`);
    assert.deepStrictEqual(lint(t.replace(/^---\n[\s\S]*?\n---\n/, '')), [], `${name}: renders`);
    for (const f of fs.existsSync(path.join(dir, 'references')) ? fs.readdirSync(path.join(dir, 'references')) : []) {
      assert.deepStrictEqual(lint(readText(path.join(dir, 'references', f))), [], `${name}/references/${f}: renders`);
    }
  }
});

test('the stories test data renders', () => {
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(FIXTURE, 'epics'))) assert.deepStrictEqual(lint(readText(f)), [], path.relative(KIT, f));
});

// Every "yes" at a gate runs accept.ts (conventions.md, "Acceptance"). The three story gates all accept the Story
// list, which holds the Decision record and the Check record of the EPIC's story gates.
const ACCEPT_LIST = 'node tools/accept.ts --project {project} --document story-list --epic {epic}';

test('story-drafter and story-groomer: after the gate, each pastes the check record into the Story list, then runs accept.ts on it, as ac-author does', () => {
  for (const [name, gate] of [['story-drafter', '**Approve the split?**'], ['story-groomer', '**Accept the grooming?**'], ['ac-author', '**Accept the criteria? This marks the stories ready.**']]) {
    const t = readText(path.join(SKILLS, name, 'SKILL.md'));
    const g = t.indexOf(gate);
    const a = t.indexOf(ACCEPT_LIST, g);
    assert.ok(g > 0 && a > g, `${name}: its gate doesn't run ${ACCEPT_LIST}`);
    if (name === 'ac-author') continue;
    const p = t.indexOf('paste its "For the file" block into the Story list\'s Check record', g);
    assert.ok(p > g && p < a, `${name}: the check record isn't pasted into the Story list before accept.ts runs`);
  }
});

test('accept.ts on the Story list: the split, the grooming and the criteria each save a version, and the EPIC is ready only after the criteria', () => {
  const env = project();
  const args = ['--project', 'expense-claims', '--output', env.out, '--date', '2026-10-22'];
  for (const d of ['feature-catalog', 'epic-register']) {
    const r = run('accept.ts', [...args, '--document', d]);
    assert.strictEqual(r.code, 0, `${d}: ${r.out}${r.err}`);
  }
  const files = ['approve-a-claim.md', 'reject-a-claim.md', 'approve-a-claim-over-500.md'];
  const full = new Map(files.map((f) => [f, env.read(`${E2}/${f}`)]));
  const list = env.read(LIST);
  ([['drafted', '## Dependencies'], ['groomed', '## Acceptance criteria'], ['ready', null]] as [string, string | null][]).forEach(([stage, cut], i) => {
    // Each gate's skill leaves the stories at its stage. The Story list keeps the status line the last acceptance set.
    const status = env.read(LIST).match(/^Status: .*$/m)![0];
    env.write(LIST, list.replace(/\| ready \|$/gm, `| ${stage} |`).replace(/^Status: .*$/m, status));
    for (const f of files) {
      const t = full.get(f)!.replace('| Status | ready |', `| Status | ${stage} |`);
      env.write(`${E2}/${f}`, cut ? t.slice(0, t.indexOf(cut)) : t);
    }
    let r = run('check-stories.ts', epicArgs(env.out));
    assert.strictEqual(r.code, 0, `${stage}: ${r.out}${r.err}`);
    r = run('accept.ts', [...args, '--document', 'story-list', '--epic', 'EPIC-002-claim-approval']);
    assert.strictEqual(r.code, 0, `${stage}: ${r.out}${r.err}`);
    assert.match(env.read(LIST), new RegExp(`^Status: accepted on 2026-10-22, version ${i + 1}$`, 'm'));
    assert.match(env.read('version-log/log.md'), new RegExp(`^\\| ${i + 1} \\| epics/EPIC-002-claim-approval/story-list\\.md \\| 2026-10-22 \\|`, 'm'));
    r = run('status.ts', args);
    assert.strictEqual(/EPIC-002 Claim approval: ready\b/.test(r.out), stage === 'ready', `${stage}: ${r.out}`);
  });
});

// ---------------------------------------------------------------- report

report();
