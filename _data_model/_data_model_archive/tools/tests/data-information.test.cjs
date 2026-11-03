#!/usr/bin/env node
'use strict';
// Tests for the Data and Information workflow: its programs, its templates and its skills.
//
//   node tools/tests/data-information.test.cjs
//
// Every test works on a made-up Expense claims project in a temporary folder. Nothing in fixtures/ or Output/ is changed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const KIT = path.resolve(__dirname, '..', '..');
const TOOLS = path.join(KIT, 'tools');
const { lint } = require('../lib/md-lint.cjs');

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

// ---------------------------------------------------------------- the made-up project

const OPENING = (title, written, previous, primary) => [
  `# ${title} — Expense claims`,
  '',
  '> **What this is:** A test document.',
  '>',
  '> **What it is not:** Anything else.',
  '>',
  `> **Written by:** ${written}. Checked by check-data-information.cjs before its gate.`,
  '',
  '> **Lineage**',
  `> - **Previous step:** ${previous}`,
  `> - **Primary source:** ${primary}`,
  '> - **Supporting sources:** None',
  '> - **Next step:** the next step',
  '',
  'Status: drafted',
  '',
].join('\n');

const RECORDS = '## Decision record\n\nNone yet.\n\n## Check record\n\nNone yet.\n';

const GLOSSARY = {
  'object-terms.md': `# Objects

## Claims

| Term | What it is | Relationship to the term above | Source | Decision |
|---|---|---|---|---|
| <a id="claim"></a>Claim | A request to be paid back for expenses, with one or more expense lines. | - | REQ-1.1 | - |
| <a id="expense-line"></a>Expense line | One expense in a claim, with its amount and a receipt. | part of a [Claim](#claim) | REQ-1.1 | - |
| <a id="receipt"></a>Receipt | The proof of one expense. | part of an [Expense line](#expense-line) | REQ-1.2 | - |

### Not placed in the hierarchy (not placed)

| Term | What it is | Where else it appears | Source | Decision |
|---|---|---|---|---|
| <a id="home"></a>Home | The landing page. | nowhere else | REQ-5.1 | - |

## Terms replaced or retired over time

| Earlier word | What happened | Use now | Decision | Date |
|---|---|---|---|---|
| Expense report | merged | [Claim](#claim) | [D-1](decision-register.md#d-1) | 2026-10-10 |
`,
  'states-and-values.md': `# States and values

## Claims

| Value-set | What it is | Belongs to | Values | Notes | Source | Decision |
|---|---|---|---|---|---|---|
| <a id="claim-stage"></a>Claim stage | Where a claim is in its approval. | [Claim](object-terms.md#claim) | • Submitted<br>• Approved<br>• Rejected<br>• Paid | - | REQ-2.1 | - |
| <a id="claim-priority"></a>Claim priority | How urgent a claim is. | [Claim](object-terms.md#claim) | - | - | REQ-2.9 | - |
`,
  'role-terms.md': `# Roles

| Term | What it is | Persona or access role | Sits under | Home family | Source | Decision |
|---|---|---|---|---|---|---|
| <a id="employee"></a>Employee | A person who sends claims. | persona | - | Claims | REQ-1.1 | - |
| <a id="line-manager"></a>Line manager | A person who approves their team's claims. | persona | - | Claims | REQ-2.1 | - |
`,
  'step-terms.md': `# Steps

| First | Relationship | Second | Reads as |
|---|---|---|---|
| Submission | comes before | Approval | Submission happens before approval. |

| Term | What it is | In the flow | Home family | Source | Decision |
|---|---|---|---|---|---|
| <a id="submission"></a>Submission | The stage where an employee sends a claim. | Submission happens before approval. | Claims | REQ-1.1 | - |
| <a id="approval"></a>Approval | The stage where the line manager decides. | - | Claims | REQ-2.1 | - |
`,
};

const DRAFT = `# Section draft - Claims

## 1. The candidates found (ontology)

**Objects.** What this section holds.

| # | Candidate | Meaning | Evidence | Re-run |
|---|---|---|---|---|
| 1 | Expense report | a request to be paid back | "an expense report" - REQ-1.1 | add |
| 2 | Expense line | one expense in it | "each expense line" - REQ-1.1 | add |

**Roles.** Who it names.

| # | Candidate | Meaning | Evidence | Re-run |
|---|---|---|---|---|
| 1 | Employee | sends claims | "an employee sends" - REQ-1.1 | add |

**States and values.** The conditions it names.

| # | Candidate | Meaning | Evidence | Re-run |
|---|---|---|---|---|
| 1 | Claim stage | • Submitted<br>• Approved | "submitted, then approved" - REQ-2.1 | add |

## 2. How they fit together (topology)

| Parent | Relationship | Child | Reads as | Evidence |
|---|---|---|---|---|
| Expense report | contains | Expense line | Each expense line is part of an expense report. | "each expense line" - REQ-1.1 |

## 3. How they move (choreography)

| Belongs to | States | Evidence |
|---|---|---|
| Expense report | • Submitted<br>• Withdrawn | "a claim can be withdrawn" - REQ-2.8 |

## 6. Attributes noticed

| Phrase | Belongs to | Evidence |
|---|---|---|
| amount | Expense line | "with its amount" - REQ-1.1 |
`;

const DATA_MODEL = `${OPENING('Data model', 'data-model-author, from `templates/data-model.md`', 'Glossary', '[glossary/](../glossary/)')}## Entities

| Entity | Identifier | Starts when | Ends when |
|---|---|---|---|
| [Claim](../glossary/object-terms.md#claim) | TBD, question 4 | when an employee sends it, per REQ-1.1 | Does not apply: a claim is kept once paid, per REQ-4.2 |
| [Expense line](../glossary/object-terms.md#expense-line) | its place in the claim, per REQ-1.1 | with its claim, per REQ-1.1 | with its claim, per REQ-1.1 |

## Attributes

| Entity | Attribute | Evidence | From the Glossary |
|---|---|---|---|
| Claim | stage | "where a claim is in its approval", Glossary | Claim stage |
| Claim | priority | "how urgent a claim is", Glossary | Claim priority |
| Expense line | amount | "with its amount", REQ-1.1 | - |
| Expense line | receipt | "and a receipt", REQ-1.1 | Receipt |

## Relationships

| Relationship | How many |
|---|---|
| Claim → Expense line | 1 or more, per REQ-1.1 |
| Expense line → Claim | exactly 1, per REQ-1.1 |

## Metadata

| Entity | Recorded | Restrictions | Security, privacy or audit |
|---|---|---|---|
| Claim | who sent it and when, per REQ-1.4 | an approved claim can't be changed, per REQ-2.4 | TBD, question 8 |
| Expense line | Does not apply: recorded with its claim, per REQ-1.4 | Does not apply: changed only with its claim, per REQ-2.4 | Does not apply: none beyond its claim's, per REQ-1.4 |

## Not data

| Glossary term | Why |
|---|---|
| Home | a page, nothing is kept about it, per Glossary |

## Diagram

\`\`\`mermaid
flowchart LR
    claim["Claim"] -->|"has one or more"| line["Expense line"]
\`\`\`

## The workflows that follow

| Workflow | Runs | Why |
|---|---|---|
| state-model-workflow | Runs | Claim.stage moves through its values, per REQ-2.1 |
| data-flow-workflow | Runs | employees send claims and line managers decide them, per REQ-1.1 and REQ-2.1 |

${RECORDS}`;

const DATA_DICTIONARY = `${OPENING('Data Dictionary', 'data-dictionary-author, from `templates/data-dictionary.md`', 'Data model', '[data-model.md](data-model.md)')}## Elements

| Entity | Attribute | Meaning | Allowed values | Can be left out | Repeats |
|---|---|---|---|---|---|
| Claim | stage | Claim stage, per Glossary | Claim stage, per Glossary | no, per REQ-2.1 | once, per REQ-2.1 |
| Claim | priority | Claim priority, per Glossary | TBD, question 5 | TBD, question 5 | once, per REQ-2.9 |
| Expense line | amount | what the expense cost, per REQ-1.1 | TBD, question 6 | no, per REQ-1.1 | once, per REQ-1.1 |
| Expense line | receipt | the proof of the expense, per REQ-1.2 | TBD, question 7 | no, per REQ-1.2 | once, per REQ-1.2 |

## Composite elements

None.

${RECORDS}`;

const STATE_MODELS = `${OPENING('State models', 'state-model-author, from `templates/state-models.md`', 'Data Dictionary', '[data-model.md](data-model.md)')}## Entities that move through states

| Entity | State held in | Starts in | Ends in | Can go back or skip |
|---|---|---|---|---|
| Claim | stage | Submitted, per REQ-1.1 | Paid, per REQ-4.2 | TBD, question 9 |

## Each model

### Claim

| State | What can be done in it |
|---|---|
| Submitted | the line manager decides it, per REQ-2.1 |
| Approved | finance pays it, per REQ-4.1 |
| Rejected | the employee reads why, per REQ-2.2 |
| Paid | Does not apply: nothing more happens, per REQ-4.2 |

| Move | Event | Condition | Actions |
|---|---|---|---|
| Submitted → Approved | the line manager approves it, per REQ-2.1 | Does not apply: no condition, per REQ-2.1 | the employee is told, per REQ-2.5 |
| Submitted → Rejected | the line manager rejects it, per REQ-2.2 | Does not apply: no condition, per REQ-2.2 | the employee is told, per REQ-2.5 |
| Approved → Paid | finance pays it, per REQ-4.1 | Does not apply: no condition, per REQ-4.1 | TBD, question 10 |

\`\`\`mermaid
stateDiagram-v2
    [*] --> Submitted
    Submitted --> Approved
    Submitted --> Rejected
    Approved --> Paid
\`\`\`

${RECORDS}`;

const DATA_FLOWS = `${OPENING('Data flows', 'data-flow-author, from `templates/data-flows.md`', 'State models', '[data-model.md](data-model.md)')}## Externals

| External | Kind |
|---|---|
| Employee | Person |
| Line manager | Person |

## Processes

| Process | Name | Glossary step |
|---|---|---|
| P1 | Send a claim | Submission |
| P2 | Decide a claim | Approval |

## Data stores

| Data store | Entity |
|---|---|
| Claims | Claim |

## Data flows

| Data flow | Moves | Data |
|---|---|---|
| Claim details | Employee → P1 | • Expense line.amount<br>• Expense line.receipt |
| Sent claim | P1 → Claims | Claim |
| Claim to decide | Claims → P2 | Claim |
| Decision | Line manager → P2 | Claim.stage |
| Decided claim | P2 → Claims | Claim.stage |
| Claim outcome | P2 → Employee | Claim.stage |

## Context diagram

\`\`\`mermaid
flowchart LR
    emp["Employee"] -->|"Claim details"| product(("Expense claims"))
    mgr["Line manager"] -->|"Decision"| product
\`\`\`

## Level 1 diagram

\`\`\`mermaid
flowchart LR
    emp["Employee"] -->|"Claim details"| p1(("Send a claim"))
    p1 -->|"Sent claim"| ds[("Claims")]
    ds -->|"Claim to decide"| p2(("Decide a claim"))
\`\`\`

${RECORDS}`;

const iface = (id, ext, inn, out, checks) => `### ${id} ${ext}

| Item | Answer |
|---|---|
| Who uses it | ${ext.toLowerCase()}s, per REQ-1.1 |
| Why it is needed | to take part in claims, per REQ-1.1 |
| What passes in | ${inn} |
| What passes out | ${out} |
| How much | TBD, question 11 |
| When, and how often | whenever a claim moves, per REQ-2.1 |
| Checks on what comes in | ${checks} |
| What starts an exchange | a claim is sent or decided, per REQ-2.1 |
| When an exchange fails | TBD, question 12 |
`;

const INTERFACES = `${OPENING('Interfaces', 'interface-author, from `templates/interfaces.md`', 'Data flows', '[data-flows.md](data-flows.md)')}## The interfaces

| Interface | External | Data flows |
|---|---|---|
| IF-1 | Employee | • Claim details<br>• Claim outcome |
| IF-2 | Line manager | • Decision |

## Each interface

${iface('IF-1', 'Employee', '• Expense line.amount<br>• Expense line.receipt', '• Claim.stage', '• Expense line.amount: its allowed values, per the Data Dictionary')}
${iface('IF-2', 'Line manager', '• Claim.stage', 'Does not apply: nothing passes out to them, per REQ-2.1', 'Does not apply: a decision is chosen from Claim.stage, per REQ-2.1')}
${RECORDS}`;

const DOCS = { 'data-model.md': DATA_MODEL, 'data-dictionary.md': DATA_DICTIONARY, 'state-models.md': STATE_MODELS, 'data-flows.md': DATA_FLOWS, 'interfaces.md': INTERFACES };

function project(changes = {}) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'data-info-'));
  const dir = path.join(out, 'expense-claims');
  fs.mkdirSync(path.join(dir, 'glossary', 'deep-dives', 'claims'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  for (const [f, t] of Object.entries(GLOSSARY)) fs.writeFileSync(path.join(dir, 'glossary', f), t);
  fs.writeFileSync(path.join(dir, 'glossary', 'deep-dives', 'claims', 'claims-glossary.md'), DRAFT);
  for (const [f, t] of Object.entries(DOCS)) fs.writeFileSync(path.join(dir, 'data', f), changes[f] !== undefined ? changes[f](t) : t);
  return out;
}

const check = (out, document) => run('check-data-information.cjs', ['--project', 'expense-claims', '--document', document, '--output', out, '--date', '2026-10-28']);

// ---------------------------------------------------------------- build-data-inventory.cjs

test('the inventory reads every object, role, step, value-set and link the Glossary holds', () => {
  const out = project();
  const r = run('build-data-inventory.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-28']);
  assert.strictEqual(r.code, 0, r.err || r.out);
  const inv = JSON.parse(fs.readFileSync(path.join(out, 'expense-claims', 'data', 'inventory.json'), 'utf8'));
  assert.deepStrictEqual(inv.objects.map((o) => o.term), ['Claim', 'Expense line', 'Receipt', 'Home']);
  assert.deepStrictEqual(inv.roles.map((o) => o.term), ['Employee', 'Line manager']);
  assert.deepStrictEqual(inv.steps.map((o) => o.term), ['Submission', 'Approval']);
  assert.deepStrictEqual(inv.valueSets.map((v) => [v.name, v.belongsTo, v.values.length]), [['Claim stage', 'Claim', 4], ['Claim priority', 'Claim', 0]]);
  assert.deepStrictEqual(inv.relationships.map((l) => `${l.parent} ${l.relation} ${l.child}`), ['Claim contains Expense line', 'Expense line contains Receipt']);
  assert.strictEqual(inv.flow.length, 1);
});

test('the inventory prints what the data model must settle, reading a section draft\'s earlier words as the agreed ones', () => {
  const out = project();
  const r = run('build-data-inventory.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-28']);
  assert.match(r.out, /Value-sets with no values:\n- Claim priority/);
  assert.match(r.out, /States a section draft found that no value-set holds:\n- Claim: Withdrawn \(section claims\)/);
  assert.match(r.out, /Objects the Glossary places under nothing:\n- Home/);
});

test('during the Glossary run, before the pages exist, the inventory is built from the section drafts', () => {
  const out = project();
  for (const f of Object.keys(GLOSSARY)) fs.rmSync(path.join(out, 'expense-claims', 'glossary', f));
  const r = run('build-data-inventory.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-28']);
  assert.strictEqual(r.code, 0, r.err || r.out);
  assert.match(r.out, /from the section drafts only/);
  const inv = JSON.parse(fs.readFileSync(path.join(out, 'expense-claims', 'data', 'inventory.json'), 'utf8'));
  assert.deepStrictEqual(inv.objects.map((o) => o.term), ['Expense report', 'Expense line']);
  assert.deepStrictEqual(inv.roles.map((o) => o.term), ['Employee']);
  assert.deepStrictEqual(inv.valueSets.map((v) => [v.name, v.values]), [['Claim stage', ['Submitted', 'Approved']]]);
  assert.deepStrictEqual(inv.relationships.map((l) => `${l.parent} ${l.relation} ${l.child}`), ['Expense report contains Expense line']);
  assert.deepStrictEqual(inv.attributesNoticed.map((a) => `${a.belongsTo}: ${a.phrase}`), ['Expense line: amount']);
});

test('the inventory carries the attributes a section draft noticed, and prints them', () => {
  const out = project();
  const r = run('build-data-inventory.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-28']);
  assert.match(r.out, /Attributes the section drafts noticed:\n- Expense line: amount, "with its amount" - REQ-1\.1 \(section claims\)/);
});

test('the inventory stops with code 2 when the Glossary run hasn\'t started', () => {
  const out = project();
  fs.rmSync(path.join(out, 'expense-claims', 'glossary'), { recursive: true });
  const r = run('build-data-inventory.cjs', ['--project', 'expense-claims', '--output', out]);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /The Glossary run hasn't started/);
});

// ---------------------------------------------------------------- check-data-information.cjs: passing

for (const document of ['data-model', 'data-dictionary', 'state-models', 'data-flows', 'interfaces']) {
  test(`check-data-information.cjs passes a complete ${document}`, () => {
    const r = check(project(), document);
    assert.strictEqual(r.code, 0, r.out + r.err);
    assert.match(r.out, /Every check passed/);
  });
}

// ---------------------------------------------------------------- check-data-information.cjs: findings

test('the data model: an unsorted Glossary object, a value-set on the wrong entity, and a missing direction are findings', () => {
  const r = check(project({
    'data-model.md': (t) => t
      .replace('| Home | a page, nothing is kept about it, per Glossary |\n', '| Lobby | a page, per Glossary |\n')
      .replace('| Claim | priority |', '| Expense line | priority |')
      .replace('| Claim → Expense line | 1 or more, per REQ-1.1 |\n', ''),
  }), 'data-model');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /The Glossary object Home is not an entity/);
  assert.match(r.out, /The value-set Claim priority belongs to Claim in the Glossary, but its attribute Expense line\.priority is on Expense line/);
  assert.match(r.out, /Expense line → Claim has no row the other way/);
  assert.match(r.out, /The Glossary says Claim contains Expense line, and both are entities, but the Relationships don't say how many/);
});

test('the data model: a blank identifier, a TBD with no question, and an answer with no source are findings', () => {
  const r = check(project({
    'data-model.md': (t) => t
      .replace('| TBD, question 4 |', '|  |')
      .replace('TBD, question 8', 'TBD')
      .replace('who sent it and when, per REQ-1.4', 'who sent it and when'),
  }), 'data-model');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Claim, Identifier: is blank/);
  assert.match(r.out, /Claim, Security, privacy or audit: has a TBD that names no question/);
  assert.match(r.out, /Claim, Recorded: names no source/);
});

test('the data model: an attribute with no quote, and state modelling that names no attribute, are findings', () => {
  const r = check(project({
    'data-model.md': (t) => t
      .replace('"with its amount", REQ-1.1', 'its amount')
      .replace('Claim.stage moves through its values, per REQ-2.1', 'claims move, per REQ-2.1'),
  }), 'data-model');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Expense line\.amount, Evidence: the exact words that name it/);
  assert.match(r.out, /state-model-workflow runs, so its "Why" names every attribute/);
});

test('the data model: an attribute a section draft noticed, carried by no attribute, is a finding', () => {
  const r = check(project({ 'data-model.md': (t) => t.replace(/\| Expense line \| amount \|.*\n/, '') }), 'data-model');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /The section draft claims noticed "amount" on Expense line, but no attribute of Expense line carries it/);
});

test('the data model: a workflow that follows with no row, or neither Runs nor Does not run, is a finding', () => {
  const r = check(project({
    'data-model.md': (t) => t
      .replace(/\| data-flow-workflow \|.*\n/, '')
      .replace('| state-model-workflow | Runs |', '| state-model-workflow | Maybe |'),
  }), 'data-model');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /data-flow-workflow has no row/);
  assert.match(r.out, /state-model-workflow: Runs is "Runs" or "Does not run"/);
});

// ---------------------------------------------------------------- route-data-workflows.cjs

const ACCEPTED = (t) => t.replace('Status: drafted', 'Status: accepted on 2026-10-28, version 1');
const route = (out) => run('route-data-workflows.cjs', ['--project', 'expense-claims', '--output', out, '--date', '2026-10-28']);

test('the route: data-model-workflow is next until its two documents are accepted, and nothing after it is confirmed', () => {
  const r = route(project({ 'data-model.md': ACCEPTED }));
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /- data-model-workflow: data model accepted; Data Dictionary drafted/);
  assert.match(r.out, /Next: run data-model-workflow\.\n$/);
  const r2 = route(project());
  assert.match(r2.out, /- state-model-workflow: not confirmed yet, until the data model is accepted/);
});

test('the route: each confirmed workflow follows in order, then features-and-epics-workflow', () => {
  const both = { 'data-model.md': ACCEPTED, 'data-dictionary.md': ACCEPTED };
  assert.match(route(project(both)).out, /Next: run state-model-workflow\./);
  assert.match(route(project({ ...both, 'state-models.md': ACCEPTED })).out, /Next: run data-flow-workflow\./);
  assert.match(route(project({ ...both, 'state-models.md': ACCEPTED, 'data-flows.md': ACCEPTED })).out, /Next: run data-flow-workflow\./);
  assert.match(route(project({ ...both, 'state-models.md': ACCEPTED, 'data-flows.md': ACCEPTED, 'interfaces.md': ACCEPTED })).out, /Next: run features-and-epics-workflow\./);
});

test('the route: a workflow the data model confirms not to run is skipped, with its reason', () => {
  const r = route(project({
    'data-model.md': (t) => ACCEPTED(t).replace('| state-model-workflow | Runs | Claim.stage moves through its values, per REQ-2.1 |', '| state-model-workflow | Does not run | nothing moves through states, per REQ-2.1 |'),
    'data-dictionary.md': ACCEPTED,
  }));
  assert.match(r.out, /- state-model-workflow: confirmed not to run: nothing moves through states, per REQ-2\.1/);
  assert.match(r.out, /Next: run data-flow-workflow\./);
});

test('the Data Dictionary: a missing entry, an extra one, and a value-set copied instead of named are findings', () => {
  const r = check(project({
    'data-dictionary.md': (t) => t
      .replace(/\| Expense line \| receipt \|.*\n/, '| Expense line | currency | the currency, per REQ-1.1 | TBD, question 13 | no, per REQ-1.1 | once, per REQ-1.1 |\n')
      .replace('| Claim | stage | Claim stage, per Glossary | Claim stage, per Glossary |', '| Claim | stage | Claim stage, per Glossary | • Submitted<br>• Approved<br>• Paid, per REQ-2.1 |'),
  }), 'data-dictionary');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Expense line\.receipt is in the data model, but has no entry/);
  assert.match(r.out, /Expense line\.currency has an entry, but isn't in the data model/);
  assert.match(r.out, /Claim\.stage, Allowed values: names the Glossary's Claim stage, whose values stay in the Glossary/);
});

test('the state models: a Glossary value that isn\'t a state, and a move to an unknown state, are findings', () => {
  const r = check(project({
    'state-models.md': (t) => t
      .replace('| Rejected | the employee reads why, per REQ-2.2 |\n', '')
      .replace('| Submitted → Rejected |', '| Submitted → Withdrawn |'),
  }), 'state-models');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Claim: the Glossary's Claim stage holds Rejected, which isn't one of its states/);
  assert.match(r.out, /the move Submitted → Withdrawn names Withdrawn, which isn't one of its states/);
});

test('the data flows: a process with no flow out, and data not in the data model, are findings', () => {
  const r = check(project({
    'data-flows.md': (t) => t
      .replace('| Sent claim | P1 → Claims | Claim |\n', '')
      .replace('• Expense line.amount<br>• Expense line.receipt', '• Expense line.amount<br>• Claim.currency'),
  }), 'data-flows');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /The process P1 has no data flow out/);
  assert.match(r.out, /Claim details, Data: Claim\.currency isn't an entity or attribute in the data model/);
});

test('the interfaces: an external with no interface, and an element not in the Data Dictionary, are findings', () => {
  const r = check(project({
    'interfaces.md': (t) => t
      .replace('| IF-2 | Line manager | • Decision |\n', '')
      .replace('| What passes out | • Claim.stage |', '| What passes out | • Claim.reason |'),
  }), 'interfaces');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /The external Line manager has no interface/);
  assert.match(r.out, /IF-1, What passes out: Claim\.reason isn't in the Data Dictionary/);
});

test('a missing section, and a placeholder left in, are findings on any document', () => {
  const r = check(project({ 'data-dictionary.md': (t) => t.replace('## Composite elements\n\nNone.\n', '').replace('the proof of the expense', '{meaning}') }), 'data-dictionary');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /The section "Composite elements" is missing/);
  assert.match(r.out, /the placeholder \{meaning\} is still there/);
});

// ---------------------------------------------------------------- templates and skills

const ROOTS = [KIT, path.join(KIT, '.claude', 'skills')];
const find = (rel) => ROOTS.map((r) => path.join(r, rel)).find((p) => fs.existsSync(p));
const SKILLS = ['data-model-workflow', 'state-model-workflow', 'data-flow-workflow', 'data-model-author', 'data-dictionary-author', 'state-model-author', 'data-flow-author', 'interface-author'];

test('every template renders, opens with its three blocks, and ends with its Placeholders', () => {
  for (const name of ['data-model', 'data-dictionary', 'state-models', 'data-flows', 'interfaces']) {
    const f = find(path.join('_shared', 'templates', `${name}.md`));
    assert.ok(f, `${name}.md is missing`);
    const t = fs.readFileSync(f, 'utf8');
    assert.deepStrictEqual(lint(t), [], `${name}: renders`);
    for (const m of ['> **What this is:**', '> **What it is not:**', '> **Written by:**', '> **Lineage**', 'Status: drafted', '## Decision record', '## Check record', '## Placeholders']) assert.ok(t.includes(m), `${name}: ${m}`);
    const labels = new Set([...t.split('## Placeholders')[0].matchAll(/\{[^}\n]+\}/g)].map((m) => m[0]).filter((l) => l !== '{n}'));
    const defined = t.split('## Placeholders')[1];
    for (const l of labels) assert.ok(defined.includes(`| ${l} |`) || defined.includes(l), `${name}: ${l} has no row in Placeholders`);
  }
});

test('every skill has its name, description and opening, and every file and program it names exists', () => {
  for (const name of SKILLS) {
    const f = find(path.join(name, 'SKILL.md'));
    assert.ok(f, `${name}/SKILL.md is missing`);
    const t = fs.readFileSync(f, 'utf8');
    assert.match(t, new RegExp(`^---\\nname: ${name}\\n`), `${name}: the name line`);
    assert.match(t, /\ndescription: >-\n {2}\S/, `${name}: the description`);
    for (const m of ['> **What this is:**', '> **What it is not:**', '> **Who uses it:**']) assert.ok(t.includes(m), `${name}: ${m}`);
    for (const ref of t.matchAll(/`\.\.\/(_shared\/[^`]+\.md)`/g)) assert.ok(find(ref[1]), `${name}: ${ref[1]} doesn't exist`);
    for (const prog of t.matchAll(/`(?:node )?tools\/([a-z-]+\.cjs)/g)) assert.ok(fs.existsSync(path.join(TOOLS, prog[1])), `${name}: tools/${prog[1]} doesn't exist`);
    assert.deepStrictEqual(lint(t.replace(/^---\n[\s\S]*?\n---\n/, '')), [], `${name}: renders`);
  }
  assert.deepStrictEqual(lint(fs.readFileSync(find(path.join('_shared', 'data-information.md')), 'utf8')), []);
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
