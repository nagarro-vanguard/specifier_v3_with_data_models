#!/usr/bin/env node
'use strict';
// Tests for the Glossary: its programs, its skills, and the kit's copy of the approved method.
//
//   node tools/tests/glossary.test.cjs
//
// Every test works on a copy in a temporary folder. Nothing in fixtures/ or Output/ is changed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const KIT = path.resolve(__dirname, '..', '..');
const TOOLS = path.join(KIT, 'tools');
const METHOD = path.join(KIT, '.claude', 'skills', '_shared', 'glossary');
const APPROVED = path.join(KIT, 'fixtures', 'approved-glossary-method');
const mc = require('./helpers/method-copy.cjs');
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

function tmpOutput() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specifier-glossary-'));
}

function run(program, args) {
  const r = spawnSync(process.execPath, [path.join(TOOLS, program), ...args], { encoding: 'utf8', cwd: os.tmpdir() });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

// ---------------------------------------------------------------- the method, copied as approved

// Each copied file, its approved original, and how far it may differ: the lines taken out and put in, counted, and a
// pattern every line put in must match. Display and path fixes (helpers/method-copy.cjs) are applied first, so a file
// with 0 and 0 is the approved file word for word.
const SKILLS_DIR = '.skills/_shared/glossary/';
const COPIES = [
  // A tenth rule for every definition: simple words, as simple-writing-rules.md says.
  ['lens1-ontology.md', `${SKILLS_DIR}lens1-ontology.md`, 1, 2, /^10\. \*\*Simple words\.\*\* The definition follows `\.\.\/simple-writing-rules\.md`|against these ten rules/],
  ['lens2-topology.md', `${SKILLS_DIR}lens2-topology.md`, 0, 0],
  ['lens3-choreography.md', `${SKILLS_DIR}lens3-choreography.md`, 0, 0],
  ['otc-methodology.md', `${SKILLS_DIR}otc-methodology.md`, 0, 0],
  // One more kind of weak word: a word that is hard for a reader whose first language isn't English.
  ['otc-run-rules.md', `${SKILLS_DIR}otc-run-rules.md`, 0, 1, /^\| hard for a reader whose first language isn't English \| .*`\.\.\/simple-writing-rules\.md`/],
  // The guidance lines in these templates, and in the templates further down, are in simple words, as
  // simple-writing-rules.md says: two ideas joined by a semicolon become two sentences, and a figure of speech becomes
  // plain words.
  ['templates/README.md', `${SKILLS_DIR}templates/README.md`, 1, 1, /one sort of question\. This table/],
  ['templates/change-ripple.md', `${SKILLS_DIR}templates/change-ripple.md`, 2, 2, /use them\. The words are the earlier word|read now\. The document's owner/],
  ['templates/section-glossary.md', `${SKILLS_DIR}templates/section-glossary.md`, 3, 3, /following\. On a new build|\{One line\. A dotted line|this table is the one to trust/],
  ['templates/terms-and-relationships.md', `${SKILLS_DIR}templates/terms-and-relationships.md`, 3, 3, /what is shown when what is opened|belongs to\. "\(context\)" marks|drawn\. A dotted line/],
  ['prompts/README.md', 'glossary-methodology-prompts/README.md', 0, 0],
  // The skills' names in this kit, beside the method's own words for them.
  ['method-words.md', `${SKILLS_DIR}method-words.md`, 3, 3, /In this kit it is `glossary-(author|check|disposition)`\./],
  // The orchestration page isn't carried over: the overview names the skills and the workflows instead, glossary-
  // disposition at step 3 of data-model-workflow included. Four more lines are in simple words, as
  // simple-writing-rules.md says: a semicolon becomes two sentences, "lives in" becomes "is written in", and "one place"
  // names the section.
  ['glossary-design.md', 'glossary-design.md', 6, 6, /^> - skills: `glossary-author`, `glossary-check` and `glossary-disposition`, each in its own `SKILL\.md`$|^When each skill runs is set by the workflows\. Once the PRD is accepted, glossary-author runs\. Inside a requirement update, glossary-check and glossary-disposition run\. At step 3 of `data-model-workflow`, glossary-disposition runs too, with the data model's Glossary changes\. |^> \*\*What it is not\*\* - an instruction\. No skill, prompt, or agent acts on this page\. They follow the docs it points to\. It restates no rule: every rule is written in the doc named beside it\.$|^- one word has two meanings: order is a customer's purchase in one section, and the sort sequence of a list in another\.$|^The method recommends\. A person decides\. |^\| check \| measures a document against the glossary\. It changes nothing\. \|/],
  // The blank template moves out of a code block into its own file, so it renders. The whole prompt is in simple words,
  // as simple-writing-rules.md says: two ideas joined by a semicolon become two sentences, a side note becomes its own
  // sentence, and a hard word or a pointing word becomes an everyday one. Steps 1 and 8, the opening and part 9 say that
  // a skill that uses the method may name the output, such as change-impact-author's Change impact report.
  // change-impact-author's Feature Fit reference copies sections 5 to 8 and 10 word for word.
  ['prompts/feature-journey-analysis.md', 'glossary-methodology-prompts/feature-journey-analysis.md', 99, 54, /^A project-agnostic method for placing a feature against an existing glossary, and classifying it\.|^> - glossary terms and values are in pills\. Kinds are tagged|It uses every method word, such as page|^> - LOB means line of business\. It is the glossary's own|^> - the method names no output folder\. The analysis lands|helps in a different way\. The reading order|^Plain rule: use Layers 1 to 3, the high-level pages,|^- Output: the verdict, where the feature sits, and how it moves\. The verdict is|^- On a single feature at a time\. Roll the token|^## 3\. The taxonomy: the map you navigate$|If the feature names no LOB, keep all of them, and mark it|no single family\. Check this list|from its sources\. They show up as the LOB folders|^## 4\. The pages, by what each is for$|into one coherent model\. It records the resolved conflicts:|holds the source quotes, word for word\. It is the evidence layer|^Which page serves which layer, from "The four reading layers":$|`states-and-values\.md`\. `decision-register\.md` settles synonyms\.|^- Layer 4, proof and borderline judgements:|^Use Layers 1 to 3 to find and match\. Use Layer 4|^- Step 8 \(output\): the Feature Fit view \(part 9\)\. When a skill named the output in step 1|^## 9\. Output: the Feature Fit view$|^- Tables for Reuse and Net-new\. Counts equal|near the header\. The roster is grouped by the four reading layers|^- Where it lands: the analysis is written in a feature-fit folder beside the glossary, or where the person or the calling skill|The whole flow is reuse\. The one net-new piece|The component nouns are reused\. The capability, to allocate|repeatable and auditable\. Judgment is narrowed|^Copy this template and fill it\. Keep the part order\.|The whole flow is reuse, with one net-new value\.|The nouns are reused\. The capability is not modelled\.|templates\/feature-fit\.md|Resolve where the glossary is, as the input|fix the definition of done\. Every claim|rank tokens by how specific they are|take each token through the taxonomy|through the thresholds in part 8|^Try the rungs in order\. Stop at|which points to the agreed term|loose, by topic\. Term matching|relationship\. Nothing is net-new|exists\. Only a value, an attribute|The capability is not modelled\.$|the view the feature appears in|^## 10\. Determinism rules: the inputs|noun phrase, for the objects\. One per verb|a person is a role\. Something the system|as in part 8\. The verdict follows|source\. Nothing is invented\. A gap|keep every LOB in the analysis|For example, "visitor" is the qualifier|a new row\. Differ by LOB|diagram prefixes are uniform\. A glossary node|as a question, before the stories/],
  // Inside a change, the check findings are saved for the next step. Its columns: Source in place of File and Line,
  // and the action, what to use and the affected file in one column, Recommended Next Best Action.
  ['templates/check-findings.md', `${SKILLS_DIR}templates/check-findings.md`, 8, 6, /inside a change, also saved|\| Source \||\| Recommended Next Best Action \||^\|---\|---\|---\|---\|---\|$|Affected file: \{file name\}/],
  // One home for each decision: the gate log, with every other place filled from it by a program; one glossary per
  // project; and a Resolution a program can read.
  ['output-formats.md', `${SKILLS_DIR}output-formats.md`, 20, 26, /Recommended Next Best Action|^ {4}- (Fix the document|Change the glossary|Add the term through harvest)$|Affected file: \{file name\}|\*\*Source\*\* is the document|build-glossary-records\.cjs|fill-also-written-as\.cjs|build-retired-words-tables\.cjs|one place only|edited by hand|Proposed before Gate 1|never changed after Gate 1|\{project|written so a program can read it|Check findings|Generated, never written by hand|Change part|^\s*$|^```$|^Output\/$|[│├└]|^### Example — several glossaries$|^Each glossary is its own project|\| several \||Glossary's folder in `project-folders.md`|The only place a decision is written/],
  ['glossary-assembly-principles.md', `${SKILLS_DIR}glossary-assembly-principles.md`, 1, 1, /build-retired-words-tables\.cjs/],
  // The gate log also gets the status line the kit's programs read, so the Glossary shows as accepted once it is. Its
  // guidance lines are in simple words.
  ['templates/gate-log.md', `${SKILLS_DIR}templates/gate-log.md`, 21, 26, /Filled in by a program from Gate 1|filled in by a program from Gate 1|written so a program can read it|^ {2}- (Conflicts|Candidates|Questions|Gate 2)|^Status: drafted$|^This page tells how every decision|are numbered from `G1-01` onward|until you decide\. Then it is|as everywhere in the glossary\. Quotes|Then each section comes|If a row is unclear, ask\. Nothing|has an answer\. Then the definitions|its row is in this part|everywhere in the glossary\. The other words|used in the glossary\. The other is|Words that are borderline\. Some are used|A glossary with too few|these itself\. A guess|decision register\. The family answer|in each family\. Every glossary page|relies on the definition\. It must say|from zero\. Only what differs|each linking back to this log/],
  ['templates/glossary-assembly-draft.md', `${SKILLS_DIR}templates/glossary-assembly-draft.md`, 3, 3, /Proposed before Gate 1\. The outcomes are in the gate log\.|its own\. This page puts|^\*\*Sections joined, in the source's order:\*\*$/],
  ['templates/object-terms.md', `${SKILLS_DIR}templates/object-terms.md`, 2, 3, /^Filled in by a program from the gate log\. Never edit by hand\.$|contested\. Otherwise it is `-`|\. It is `-` when/],
  ['templates/role-terms.md', `${SKILLS_DIR}templates/role-terms.md`, 4, 5, /^Filled in by a program from the gate log\. Never edit by hand\.$|\*\*persona\*\* is a person the product is designed around\. \*\*Access role\*\* is|\. It is `-` when|or -\. Add a second line/],
  ['templates/step-terms.md', `${SKILLS_DIR}templates/step-terms.md`, 2, 3, /^Filled in by a program from the gate log\. Never edit by hand\.$|\. It is `-` when|a picture\. If they seem to disagree, trust the table\./],
  ['templates/states-and-values.md', `${SKILLS_DIR}templates/states-and-values.md`, 4, 5, /^Filled in by a program from the gate log\. Never edit by hand\.$|\. It is `-` when|\. Otherwise it is `-`/],
  ['templates/decision-register.md', `${SKILLS_DIR}templates/decision-register.md`, 4, 5, /^Generated from the gate log by build-glossary-records\.cjs\. Never edit by hand\.$|lasting id\. Other pages link to it|\. It is `-` where|\. It is \*\*All sections\*\* when|answer taken\. Each term is a link/],
  ['templates/section-decisions.md', `${SKILLS_DIR}templates/section-decisions.md`, 7, 8, /^Generated from the gate log by build-glossary-records\.cjs\. Never edit by hand\.$|the evidence\. This page gives|in the source\. It waits for an answer|\. It is `-` when|settled it\. When it was dropped without a gate row|source's words\. This page is how|look it up on this page|updates its row on this page/],
];

test('the glossary method: every copy is the approved file, with only the edits its spec names', () => {
  const found = [];
  for (const [kit, approved, removed, added, allowed] of COPIES) {
    const a = mc.copy(readText(path.join(APPROVED, approved))).split('\n');
    const b = readText(path.join(METHOD, kit)).split('\n');
    const A = new Set(a);
    const B = new Set(b);
    const out = a.filter((l) => !B.has(l));
    const put = b.filter((l) => !A.has(l));
    if (out.length !== removed || put.length !== added) found.push(`${kit}: ${out.length} lines taken out and ${put.length} put in; expected ${removed} and ${added}`);
    for (const l of put) if (allowed && !allowed.test(l)) found.push(`${kit}: a line its spec doesn't name: ${l.slice(0, 100)}`);
  }
  assert.deepStrictEqual(found, []);
});

test('the glossary method: every file the approved set holds is copied, except the sweep briefs and the old orchestration page', () => {
  const approved = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : approved.push(path.relative(APPROVED, path.join(d, e.name)).split(path.sep).join('/'))));
  walk(APPROVED);
  const copied = new Set(COPIES.map((c) => c[1]));
  const notCopied = approved.filter((f) => !copied.has(f)).sort();
  assert.deepStrictEqual(notCopied, [
    '.skills/_shared/glossary/sweep-builder-brief.md',
    '.skills/_shared/glossary/sweep-reader-brief.md',
    '.skills/check/SKILL.md',
    '.skills/disposition/SKILL.md',
    '.skills/harvest/SKILL.md',
    'README.md',
    'glossary-methodology-prompts/adversarial-check.md',
    'skill-orchestration.md',
  ]);
});

test('the glossary method: the display fixes turn placeholders into curly braces, and leave real HTML alone', () => {
  assert.strictEqual(mc.display('| <a id="g1-01"></a>G1-01 | <(a) keep<br>(b) drop> |'), '| <a id="g1-01"></a>G1-01 | {(a) keep<br>(b) drop} |');
  assert.strictEqual(mc.display('<One short paragraph: the objects <product> uses.>'), '{One short paragraph: the objects {product} uses.}');
  assert.strictEqual(mc.display('<a id="<term-anchor>"></a><Term>'), '<a id="{term-anchor}"></a>{Term}');
  assert.strictEqual(mc.display('[<word>](../../<kind page>#<anchor>)'), '[{word}](../../{kind-page}#{anchor})');
  assert.strictEqual(mc.display('a < b > c, A --> B, <!-- keep <this> -->'), 'a < b > c, A --> B, <!-- keep <this> -->');
  assert.strictEqual(mc.paths('Output/glossary/ and .skills/_shared/glossary/method-words.md'), 'Output/{project}/glossary/ and .claude/skills/_shared/glossary/method-words.md');
});

test('md-lint: an empty anchor and a mermaid hexagon in quotes pass; a filled anchor and an unquoted hexagon do not', () => {
  assert.deepStrictEqual(lint('| a | b |\n|---|---|\n| <a id="g1-01"></a>G1-01 | x |\n'), []);
  assert.deepStrictEqual(lint('```mermaid\nflowchart TD\n  A --> G1{{"GATE 1 (draft)"}}\n```\n'), []);
  assert.strictEqual(lint('text <a href="x">link</a>\n').length, 2);
  assert.strictEqual(lint('```mermaid\nflowchart TD\n  A --> G1{{GATE 1 (draft)}}\n```\n').length, 1);
});

test('the glossary method: no line says a glossary decision is written by hand anywhere but the gate log', () => {
  const found = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    readText(p).split('\n').forEach((l, i) => {
      if (/(harvest|disposition|glossary-author|glossary-disposition)[^.|]{0,40}(writes|appends|adds|updates)[^.|]{0,40}(register row|decisions file|-decisions\.md|retired over time table|also written as)/i.test(l)) found.push(`${path.relative(KIT, p)}:${i + 1}`);
    });
  });
  walk(METHOD);
  walk(path.join(KIT, '.claude', 'skills', 'glossary-author'));
  walk(path.join(KIT, '.claude', 'skills', 'glossary-disposition'));
  assert.deepStrictEqual(found, []);
});

// ---------------------------------------------------------------- an Expense claims glossary, for the programs

const GATE_LOG = `# Gate log - Expense claims

## Gate 1 - agree the words

### Conflicts - one meaning with several words, or one word with several meanings

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-01"></a>G1-01 | All sections | Do "claim", "expense report" and "expense claim" have the same meaning, and if so, which word should the glossary use? | • [claims](claims/): "an employee sends a claim"<br>• [approvals](approvals/): "the expense report is approved" | **Yes, one term: use "Expense claim".** It names the thing in full. | • (a) one term, called Expense claim<br>• (b) one term, called Claim | • (a) "Claim" is renamed, and "Expense report" merged<br>• (b) the other way round | accepted | Expense claim<br>Claim: renamed to Expense claim<br>Expense report: merged into Expense claim | 2026-10-08 |

### Weak words - words too vague to keep as they are

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-02"></a>G1-02 | [approvals](approvals/) | Should "manager" be replaced by "Line manager"? | • [approvals](approvals/): "the manager approves it" | **Line manager.** The source means the claimant's line manager. | • (a) Line manager<br>• (b) keep Manager | • (a) "Manager" is renamed<br>• (b) nothing changes | accepted | Line manager<br>Manager: renamed to Line manager | 2026-10-08 |

### Candidates to judge - words that may not deserve an entry

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-03"></a>G1-03 | [claims](claims/) | Should Cost centre be a glossary term? | • [claims](claims/): "charged to the cost centre" | **Drop.** It is used once, and means what it means everywhere. | • (a) keep<br>• (b) drop | • (a) it gets a definition<br>• (b) no entry | accepted | drop | 2026-10-08 |

### Questions - what only you can answer

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-04"></a>G1-04 | All sections | Which of the source's top-level groups become the families, and in what order? | • Claims<br>• Approvals | **Claims, then Approvals.** The source's own order. | • (a) Claims, then Approvals | • every page groups its terms by these | answered | Claims, then Approvals | 2026-10-08 |

---

## Gate 2 - agree the definitions

| # | Applies to | Term | Kind | Proposed definition | Also written as | Source | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g2-001"></a>G2-001 | [claims](claims/) | Expense claim | object | A request to be paid back for money spent on the business's behalf. | {filled in by a program from Gate 1} | [claims](claims/), item 2.1 | accepted | approved | 2026-10-09 |
| <a id="g2-002"></a>G2-002 | [claims](claims/) | Receipt | object | Proof of what an expense cost. | {filled in by a program from Gate 1} | [claims](claims/), item 2.2 | accepted | approved | 2026-10-09 |
| <a id="g2-003"></a>G2-003 | [approvals](approvals/) | Line manager | role | The person a claimant reports to, who approves their claims. | {filled in by a program from Gate 1} | [approvals](approvals/), item 3.1 | accepted | approved | 2026-10-09 |
| <a id="g2-004"></a>G2-004 | [approvals](approvals/) | Approve | step | Agreeing that an expense claim can be paid. | {filled in by a program from Gate 1} | [approvals](approvals/), item 3.1 | accepted | approved | 2026-10-09 |
| <a id="g2-005"></a>G2-005 | [approvals](approvals/) | Paid | state or value | The stage of an expense claim once its money has gone out. | {filled in by a program from Gate 1} | [approvals](approvals/), item 2.4 | accepted | approved | 2026-10-09 |

---

## Related pages

| Page | Why it relates |
|---|---|
| [decision-register.md](../decision-register.md) | the settled outcome of every row in this log, each linking back here |
`;

const CHANGE = `
## Change - 2026-11-02

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="ch-01"></a>CH-01 | All sections | Should Expense claim be renamed to Claim form? | • the finance team's new policy calls it a claim form | **Rename it.** The policy is the higher source. | • (a) rename to Claim form<br>• (b) keep Expense claim | • (a) "Expense claim" is renamed<br>• (b) nothing changes | accepted | Claim form<br>Expense claim: renamed to Claim form | 2026-11-02 |
`;

const draft = (section, candidates) => `# Section draft - ${section}

## 1. The candidates found (ontology)

### Objects

| # | Candidate | Meaning | Evidence | Re-run |
|---|---|---|---|---|
${candidates.map((c, i) => `| ${i + 1} | ${c} | what the source means | "a quote" - item ${i + 1} | add |`).join('\n')}

## Related pages
`;

const ASSEMBLY = `# Assembly draft - Expense claims

**Status:** Proposed before Gate 1. The outcomes are in the gate log.

## 3. Candidates dropped, and why

| Candidate | Found in | Test failed | Why |
|---|---|---|---|
| Petty cash | [claims](claims/claims-glossary.md) | reach | used once, in one requirement |

## Related pages
`;

const RETIRED = `## Terms replaced or retired over time

**What you're reading.** The earlier words for these terms.
**Why it matters.** You still meet them in older documents.
**What to do with it.** Use the word in "Use now" instead.
**What it affects.** Every check from the Feature catalog on finds an earlier word.

Filled in by a program from the gate log. Never edit by hand.

None yet.

## Related pages

| Page | Why it relates |
|---|---|
| [decision-register.md](decision-register.md) | each decision |
`;

const kindPage = (title, terms) => `# ${title}

## The terms

| Term | What it is | Source | Decision |
|---|---|---|---|
${terms.map((t) => `| <a id="${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"></a>${t} | what it is | the source | - |`).join('\n')}

${RETIRED}`;

const REGISTER = `Generated from the gate log by build-glossary-records.cjs. Never edit by hand.

# Decisions

One row for every word or question contested while the glossary was built, and how it was settled.

## The register

**What you're reading.** Every decision.
**Why it matters.** It says why each term has the word it has.
**What to do with it.** Follow a decision back to its gate row.
**What it affects.** Every page links its terms' decisions here.

None yet.

## Related pages

| Page | Why it relates |
|---|---|
| [deep-dives/gate-log.md](deep-dives/gate-log.md) | the full story of each decision |
`;

function expenseGlossary() {
  const out = tmpOutput();
  const g = path.join(out, 'expense-claims', 'glossary');
  write(path.join(g, 'deep-dives', 'gate-log.md'), GATE_LOG);
  write(path.join(g, 'deep-dives', 'glossary-assembly-draft.md'), ASSEMBLY);
  write(path.join(g, 'deep-dives', 'claims', 'claims-glossary.md'), draft('claims', ['Claim', 'Expense report', 'Receipt', 'Cost centre', 'Petty cash']));
  write(path.join(g, 'deep-dives', 'claims', 'claims-decisions.md'), '# Decisions - claims\n\nNone yet - written once the gates are passed.\n');
  write(path.join(g, 'deep-dives', 'approvals', 'approvals-glossary.md'), draft('approvals', ['Manager', 'Approve', 'Paid']));
  write(path.join(g, 'deep-dives', 'approvals', 'approvals-decisions.md'), '# Decisions - approvals\n\nNone yet - written once the gates are passed.\n');
  write(path.join(g, 'decision-register.md'), REGISTER);
  write(path.join(g, 'object-terms.md'), kindPage('Object terms', ['Expense claim', 'Receipt']));
  write(path.join(g, 'role-terms.md'), kindPage('Role terms', ['Line manager']));
  write(path.join(g, 'step-terms.md'), kindPage('Step terms', ['Approve']));
  write(path.join(g, 'states-and-values.md'), kindPage('States and values', ['Paid']));
  const read = (rel) => readText(path.join(g, rel));
  const change = (rel, from, to) => write(path.join(g, rel), read(rel).replace(from, to));
  return { out, g, read, change };
}

const args = (out) => ['--project', 'expense-claims', '--output', out];

// A candidate in the approvals draft that no gate row and no failed test settles.
const addMileage = (change) => change('deep-dives/approvals/approvals-glossary.md', '| 3 | Paid |', '| 3 | Paid | what the source means | "a quote" - item 3 | add |\n| 4 | Mileage |');

// ---------------------------------------------------------------- fill-also-written-as

test('fill-also-written-as: each Gate 2 term gets the words Gate 1 merged into it, and nothing else in the log changes', () => {
  const { out, read } = expenseGlossary();
  const before = read('deep-dives/gate-log.md');
  const r = run('fill-also-written-as.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const after = read('deep-dives/gate-log.md');
  assert.match(after, /\| Expense claim \| object \| [^|]+ \| Claim<br>Expense report \|/);
  assert.match(after, /\| Line manager \| role \| [^|]+ \| Manager \|/);
  assert.match(after, /\| Receipt \| object \| [^|]+ \| - \|/);
  const changed = after.split('\n').filter((l, i) => l !== before.split('\n')[i]);
  assert.strictEqual(changed.length, 5);
  assert.ok(changed.every((l) => /^\| <a id="g2-/.test(l)));
});

test('fill-also-written-as: while a Gate 1 row is open, it writes nothing and names the row', () => {
  const { out, read, change } = expenseGlossary();
  change('deep-dives/gate-log.md', '| accepted | drop | 2026-10-08 |', '| open | | |');
  const before = read('deep-dives/gate-log.md');
  const r = run('fill-also-written-as.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /G1-03 is still open/);
  assert.strictEqual(read('deep-dives/gate-log.md'), before);
});

// ---------------------------------------------------------------- build-glossary-records

test('build-glossary-records: one register row per settled decision, in the log\'s order, each linking back to its gate row', () => {
  const { out, read } = expenseGlossary();
  const r = run('build-glossary-records.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const reg = read('decision-register.md');
  const rows = reg.split('\n').filter((l) => /^\| <a id="d-\d+"><\/a>D-\d+ \|/.test(l));
  assert.strictEqual(rows.length, 9);
  rows.forEach((l, i) => assert.ok(l.startsWith(`| <a id="d-${i + 1}"></a>D-${i + 1} |`)));
  assert.match(rows[0], /\[Expense claim\]\(object-terms\.md#expense-claim\) \| All sections \|.*Claim: renamed to Expense claim<br>Expense report: merged into Expense claim \|.*\[G1-01\]\(deep-dives\/gate-log\.md#g1-01\) \| 2026-10-08 \|$/);
  assert.match(rows[1], /\[approvals\]\(deep-dives\/approvals\/approvals-glossary\.md\)/);
  assert.match(rows[4], /\| the definition of Expense claim \| approved \|/);
  assert.match(reg, /^One row for every word or question contested/m, 'the rest of the page is left as it was');
  assert.ok(!/^None yet\.$/m.test(reg.split('## The register')[1].split('## Related pages')[0]));
});

test('build-glossary-records: a recommendation keeps its bold, and every link copied from the gate log works from the register', () => {
  const { out, g, read } = expenseGlossary();
  assert.strictEqual(run('build-glossary-records.cjs', args(out)).code, 0);
  const reg = read('decision-register.md');
  const rows = reg.split('\n').filter((l) => /^\| <a id="d-\d+"><\/a>D-\d+ \|/.test(l));
  assert.match(rows[0], /\| \*\*Yes, one term: use "Expense claim"\.\*\* It names the thing in full\. \|/);
  assert.match(rows[4], /\| \[claims\]\(deep-dives\/claims\/\), item 2\.1 \|/);
  const broken = [];
  for (const m of reg.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) if (!/^https?:/.test(m[1]) && !fs.existsSync(path.join(g, m[1]))) broken.push(m[1]);
  assert.deepStrictEqual(broken, []);
});

test('build-glossary-records: each section\'s decisions file maps every candidate in its draft to the glossary\'s word', () => {
  const { out, read, change } = expenseGlossary();
  addMileage(change);
  assert.strictEqual(run('build-glossary-records.cjs', args(out)).code, 1, 'Mileage has no outcome');
  const claims = read('deep-dives/claims/claims-decisions.md');
  assert.match(claims, /^Generated from the gate log by build-glossary-records\.cjs\. Never edit by hand\.$/m);
  assert.match(claims, /^\| Claim \| renamed \| \[Expense claim\]\(\.\.\/\.\.\/object-terms\.md#expense-claim\) \| \[D-1\]\(\.\.\/\.\.\/decision-register\.md#d-1\) \|$/m);
  assert.match(claims, /^\| Expense report \| merged \| \[Expense claim\]/m);
  assert.match(claims, /^\| Receipt \| kept \| \[Receipt\]\(\.\.\/\.\.\/object-terms\.md#receipt\) \| - \|$/m);
  assert.match(claims, /^\| Cost centre \| dropped \| - \| \[D-3\]/m);
  assert.match(claims, /^\| Petty cash \| dropped \| - \| failed reach \|$/m);
  assert.ok(!/None yet - written once the gates are passed/.test(claims));
  assert.deepStrictEqual(lint(claims), []);
  const approvals = read('deep-dives/approvals/approvals-decisions.md');
  assert.match(approvals, /^\| Manager \| renamed \| \[Line manager\]\(\.\.\/\.\.\/role-terms\.md#line-manager\) \| \[D-2\]/m);
  assert.match(approvals, /^\| Mileage \| pending \| - \| - \|$/m);
});

test('build-glossary-records: a candidate no gate row or failed test settles is a finding', () => {
  const { out, change } = expenseGlossary();
  addMileage(change);
  const r = run('build-glossary-records.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /approvals: the candidate "Mileage" has no outcome/);
});

test('build-glossary-records: while any row is open, it writes nothing and names the row', () => {
  const { out, read, change } = expenseGlossary();
  change('deep-dives/gate-log.md', '| accepted | approved | 2026-10-09 |\n| <a id="g2-005">', '| open | | |\n| <a id="g2-005">');
  const before = read('decision-register.md');
  const r = run('build-glossary-records.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /G2-004 is still open/);
  assert.strictEqual(read('decision-register.md'), before);
});

test('build-glossary-records: a later change adds its row, names the decision it reverses, and moves the section\'s words', () => {
  const { out, read, change } = expenseGlossary();
  change('deep-dives/gate-log.md', '\n---\n\n## Related pages', `${CHANGE}\n---\n\n## Related pages`);
  change('object-terms.md', '<a id="expense-claim"></a>Expense claim', '<a id="claim-form"></a>Claim form');
  const r = run('build-glossary-records.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const rows = read('decision-register.md').split('\n').filter((l) => /^\| <a id="d-/.test(l));
  assert.strictEqual(rows.length, 10);
  assert.match(rows[9], /^\| <a id="d-10"><\/a>D-10 \| \[Claim form\]\(object-terms\.md#claim-form\) \|.*Expense claim: renamed to Claim form<br>overrides D-5 \|/);
  const claims = read('deep-dives/claims/claims-decisions.md');
  assert.match(claims, /^\| Claim \| renamed \| \[Claim form\]\(\.\.\/\.\.\/object-terms\.md#claim-form\) \| \[D-10\]/m);
  assert.match(claims, /^\| Expense report \| merged \| \[Claim form\]/m);
});

test('build-glossary-records: an empty table marked "None." is not a candidate, and needs no outcome', () => {
  const { out, read, change } = expenseGlossary();
  change('deep-dives/approvals/approvals-glossary.md', '\n## Related pages', '\n### Roles\n\n| # | Candidate | Meaning | Evidence | Re-run |\n|---|---|---|---|---|\n| - | None. | this section names no roles | - | - |\n\n## Related pages');
  const r = run('build-glossary-records.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.ok(!/None\./.test(read('deep-dives/approvals/approvals-decisions.md').split('\n').filter((l) => /^\|/.test(l)).join('\n')));
});

test('build-glossary-records: an "Applies to" that links to a file, not a section\'s folder, is a finding, and nothing is written', () => {
  const { out, read, change } = expenseGlossary();
  change('deep-dives/gate-log.md', '| <a id="g1-02"></a>G1-02 | [approvals](approvals/) |', '| <a id="g1-02"></a>G1-02 | [approvals](approvals/approvals-glossary.md) |');
  const before = read('decision-register.md');
  const r = run('build-glossary-records.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /G1-02: "Applies to" reads "\[approvals\]\(approvals\/approvals-glossary\.md\)"\. Write \[approvals\]\(approvals\/\), or All sections\./);
  assert.strictEqual(read('decision-register.md'), before);
});

test('build-glossary-records: an "Applies to" that names no section folder is a finding', () => {
  const { out, change } = expenseGlossary();
  change('deep-dives/gate-log.md', '| <a id="g1-02"></a>G1-02 | [approvals](approvals/) |', '| <a id="g1-02"></a>G1-02 | [payments](payments/) |');
  const r = run('build-glossary-records.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /G1-02: "Applies to" reads "\[payments\]\(payments\/\)"\. Write a link to the section's folder/);
});

// ---------------------------------------------------------------- check-glossary-sources

// The Expense claims glossary, with its BRD and PRD, a requirement file in sources/, and a Source line in each
// section draft that names the PRD.
function sourcedGlossary() {
  const g = expenseGlossary();
  const dir = path.join(g.out, 'expense-claims');
  const EXAMPLES = path.join(KIT, '.claude', 'skills', '_shared', 'examples');
  for (const d of ['brd', 'prd']) fs.copyFileSync(path.join(EXAMPLES, `${d}.md`), path.join(dir, `expense-claims-${d}.md`));
  write(path.join(dir, 'sources', 'claims-requirements-v2.docx'), 'the client\'s file');
  for (const s of ['claims', 'approvals']) g.change(`deep-dives/${s}/${s}-glossary.md`, '\n## 1. The candidates found', '\n**Source:** expense-claims-prd.md, REQ-2.1 and REQ-3.1\n\n## 1. The candidates found');
  return g;
}

test('check-glossary-sources: a glossary whose evidence cites the PRD and the BRD passes', () => {
  const { out, change } = sourcedGlossary();
  change('deep-dives/claims/claims-glossary.md', '"a quote" - item 1 |', '"a quote" - REQ-2.1, and BR-01 |');
  const r = run('check-glossary-sources.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /^Glossary sources: 0 to fix\.$/m);
});

test('check-glossary-sources: a Source line that names a requirement file, not the PRD or the BRD, is a finding', () => {
  const { out, change } = sourcedGlossary();
  change('deep-dives/claims/claims-glossary.md', '**Source:** expense-claims-prd.md, REQ-2.1', '**Source:** claims-requirements-v2.docx, section 2');
  const r = run('check-glossary-sources.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /claims\/claims-glossary\.md: the Source line reads "claims-requirements-v2\.docx, section 2 and REQ-3\.1"\. Cite the PRD, expense-claims-prd\.md, by its REQ IDs, or the BRD, expense-claims-brd\.md, by its BR IDs\./);
  assert.match(r.out, /claims\/claims-glossary\.md, line \d+: names "claims-requirements-v2\.docx", a requirement file in sources\//);
});

test('check-glossary-sources: a requirement file named in the gate log, a section draft with no Source line, and an ID the PRD or BRD hasn\'t got are findings', () => {
  const { out, change } = sourcedGlossary();
  change('deep-dives/gate-log.md', '"an employee sends a claim"', '"an employee sends a claim" (Claims-Requirements-v2.docx)');
  change('deep-dives/approvals/approvals-glossary.md', '**Source:** expense-claims-prd.md, REQ-2.1 and REQ-3.1\n', '');
  change('deep-dives/claims/claims-glossary.md', '"a quote" - item 1 |', '"a quote" - REQ-9.9, and BR-12 |');
  const r = run('check-glossary-sources.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /^Glossary sources: 4 to fix\.$/m);
  assert.match(r.out, /gate-log\.md, line \d+: names "claims-requirements-v2\.docx", a requirement file in sources\//);
  assert.match(r.out, /approvals\/approvals-glossary\.md: there is no "\*\*Source:\*\*" line\./);
  assert.match(r.out, /claims\/claims-glossary\.md, line \d+: names REQ-9\.9, which isn't in the PRD\./);
  assert.match(r.out, /claims\/claims-glossary\.md, line \d+: names BR-12, which isn't in the BRD\./);
});

test('check-glossary-sources: a missing PRD exits with code 2', () => {
  const { out } = expenseGlossary();
  assert.strictEqual(run('check-glossary-sources.cjs', args(out)).code, 2);
});

test('build-glossary-records: a missing gate log exits with code 2', () => {
  const out = tmpOutput();
  assert.strictEqual(run('build-glossary-records.cjs', args(out)).code, 2);
});

// ---------------------------------------------------------------- build-retired-words-tables

test('build-retired-words-tables: each retired word lands on its term\'s kind page, linked to its decision', () => {
  const { out, read } = expenseGlossary();
  const r = run('build-retired-words-tables.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const objects = read('object-terms.md');
  assert.match(objects, /^\| Claim \| renamed \| \[Expense claim\]\(#expense-claim\) \| \[D-1\]\(decision-register\.md#d-1\) \| 2026-10-08 \|$/m);
  assert.match(objects, /^\| Expense report \| merged \| \[Expense claim\]\(#expense-claim\) \| \[D-1\]/m);
  assert.match(read('role-terms.md'), /^\| Manager \| renamed \| \[Line manager\]\(#line-manager\) \| \[D-2\]/m);
  assert.match(read('step-terms.md'), /Never edit by hand\.\n\nNone yet\.\n/);
  assert.match(objects, /^## Related pages$/m, 'the rest of the page is left as it was');
  for (const p of ['object-terms.md', 'role-terms.md', 'step-terms.md', 'states-and-values.md']) assert.deepStrictEqual(lint(read(p)), [], p);
});

test('build-retired-words-tables: a later rename appears too, with every earlier word pointing to the term used now, latest first', () => {
  const { out, read, change } = expenseGlossary();
  change('deep-dives/gate-log.md', '\n---\n\n## Related pages', `${CHANGE}\n---\n\n## Related pages`);
  change('object-terms.md', '<a id="expense-claim"></a>Expense claim', '<a id="claim-form"></a>Claim form');
  const r = run('build-retired-words-tables.cjs', args(out));
  assert.strictEqual(r.code, 0, r.out + r.err);
  const rows = read('object-terms.md').split('\n').filter((l) => /^\| (Claim|Expense report|Expense claim) \|/.test(l));
  assert.deepStrictEqual(rows.map((l) => l.split(' | ')[0].slice(2)), ['Expense claim', 'Claim', 'Expense report']);
  assert.ok(rows.every((l) => /\[Claim form\]\(#claim-form\)/.test(l)));
  assert.match(rows[0], /\[D-10\]\(decision-register\.md#d-10\) \| 2026-11-02 \|$/);
});

test('build-retired-words-tables: a word whose term isn\'t defined on its page is a finding', () => {
  const { out, change } = expenseGlossary();
  change('role-terms.md', '<a id="line-manager"></a>Line manager', '<a id="approver"></a>Approver');
  const r = run('build-retired-words-tables.cjs', args(out));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /role-terms\.md: "Manager" points to Line manager, which has no definition on the page\./);
});

// ---------------------------------------------------------------- lib/scan-retired-words

test('scan-retired-words: it finds a retired word, and skips quotes, ID columns, code, and the word inside a term used today', () => {
  const { out } = expenseGlossary();
  assert.strictEqual(run('build-retired-words-tables.cjs', args(out)).code, 0);
  const sw = require('../lib/scan-retired-words.cjs');
  const retired = sw.retiredWords('expense-claims', { output: out });
  assert.deepStrictEqual(retired.map((r) => r.earlier).sort(), ['Claim', 'Expense report', 'Manager']);
  const current = sw.currentTerms('expense-claims', { output: out });
  assert.ok(current.includes('Expense claim') && current.includes('Line manager'));
  const doc = [
    'The manager approves each claim.',
    '> "The manager approves each claim", as the old policy says.',
    'A Line manager approves each Expense claim.',
    'The policy says "every claim needs a receipt".',
    '| ID | Feature |',
    '|---|---|',
    '| Claim-approval | Approve an expense claim |',
    'See `claim-form.pdf`, and [the policy](claims/claim-policy.pdf).',
    'Claims sent late wait a month.',
  ].join('\n');
  const hits = sw.scan(doc, retired, current);
  assert.deepStrictEqual(hits.map((h) => [h.line, h.earlier]), [[1, 'Manager'], [1, 'Claim'], [9, 'Claim']]);
  assert.deepStrictEqual(hits[0].useNow, ['Line manager']);
});

test('scan-retired-words: the kit\'s own text, the Decision and Check records, and the plural of a term used today are never flagged', () => {
  const { out } = expenseGlossary();
  assert.strictEqual(run('build-retired-words-tables.cjs', args(out)).code, 0);
  const sw = require('../lib/scan-retired-words.cjs');
  const retired = sw.retiredWords('expense-claims', { output: out });
  const current = sw.currentTerms('expense-claims', { output: out });
  const doc = [
    '| {feature name} | a short business name, in the Glossary\'s agreed words | Manager approval |',
    'Two Expense claims wait for their Line managers.',
    'A manager approves it.',
    '## Decision record',
    '- **(a)** the manager approves it',
    '## Check record',
    'check-features.cjs: each claim checked',
  ].join('\n');
  const hits = sw.scan(doc, retired, current, 'feature-catalog');
  assert.deepStrictEqual(hits.map((h) => [h.line, h.earlier]), [[3, 'Manager']]);
});

// ---------------------------------------------------------------- the skills

test('the glossary skills: each has its name, a description, and every file and program it points to exists', () => {
  const SKILLS = path.join(KIT, '.claude', 'skills');
  for (const name of ['glossary-author', 'glossary-check', 'glossary-disposition']) {
    const dir = path.join(SKILLS, name);
    const t = readText(path.join(dir, 'SKILL.md'));
    assert.match(t, new RegExp(`^---\\nname: ${name}\\n`), `${name}: the name line`);
    assert.match(t, /\ndescription: >-\n {2}\S/, `${name}: the description`);
    for (const ref of t.matchAll(/`(\.\.\/_shared\/[^`]+\.md)`/g)) assert.ok(fs.existsSync(path.join(dir, ref[1])), `${name}: ${ref[1]} doesn't exist`);
    for (const prog of t.matchAll(/`node tools\/([a-z-]+\.cjs)/g)) assert.ok(fs.existsSync(path.join(TOOLS, prog[1])), `${name}: tools/${prog[1]} doesn't exist`);
    assert.ok(!/skill-orchestration|\bsweep\b(?! over)/.test(t.replace(/character sweep|casing and character sweep/g, '')), `${name}: names the sweep or the old orchestration page`);
    assert.deepStrictEqual(lint(t.replace(/^---\n[\s\S]*?\n---\n/, '')), [], `${name}: renders`);
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
