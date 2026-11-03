#!/usr/bin/env node
// Tests for the kit's foundation: the libraries, the shared programs, the rules files, the templates and examples,
// and a run on the slice of a real requirement.
//
//   node tools/tests/foundation.test.ts
//
// Every test works on a copy in a temporary folder. Nothing in fixtures/ or Output/ is changed.
// The small documents built in the status tests are test scaffolding, not project content.

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { layout, setupFolders, projectDir, pathOf, identify, relOf, slug, matches } from '../lib/run-paths.ts';
import type { Values } from '../lib/run-paths.ts';
import { parseArgs } from '../lib/cli.ts';
import { headings, tableUnder, list } from '../lib/md-tables.ts';
import { lint } from '../lib/md-lint.ts';
import { readGrid, TEMPLATE, grade as gradeQuestions } from '../grade-questions.ts';
import type { MapItem, MapLink } from '../traceability-map.ts';
import { KIT, TOOLS, SHARED, TEMPLATES, EXAMPLES, FIXTURES, readText, test, run, tempDir, copyDir, report } from './helpers/harness.ts';
import type { RunResult } from './helpers/harness.ts';

const FIXTURE = path.join(FIXTURES, 'mcp-slice');
const EPIC_003 = 'EPIC-003-source-and-team-setup';
const DATE = '2026-10-19';

const DOCUMENT_TEMPLATES = ['discovery-brief', 'brd', 'prd', 'question-log', 'data-model-things', 'data-model', 'data-model-decisions', 'feature-catalog', 'epic-grouping', 'epic-register', 'epic-brief', 'frd', 'story-list', 'story', 'change-impact-report'];
// The data model's decisions file is checked at the gate of the things file and of each data model file.
const WITH_A_GATE = ['discovery-brief', 'brd', 'prd', 'data-model-things', 'data-model', 'data-model-decisions', 'feature-catalog', 'epic-grouping', 'epic-brief', 'frd', 'story-list', 'change-impact-report'];
// A Story and the Question log have no status line: a Story's state is in its Story list, and the log is never accepted on its own.
const NO_STATUS_LINE = ['story', 'question-log'];

// traceability-map.json, as traceability-map.ts writes it.
interface TraceabilityMap {
  items: MapItem[];
  links: MapLink[];
}

function slice(): string {
  const out = tempDir('foundation');
  copyDir(FIXTURE, path.join(out, 'mcp-slice'));
  return out;
}

function accept(out: string, project: string, document: string, extra: string[] = []): RunResult {
  return run('accept.ts', ['--project', project, '--document', document, '--output', out, '--date', DATE, ...extra]);
}

function write(file: string, text: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function nextOf(out: string, project: string): string {
  const r = run('status.ts', ['--project', project, '--output', out]);
  assert.strictEqual(r.code, 0, r.err);
  return r.out.match(/^Next: (.*)$/m)![1];
}

// The kit's own markdown files. Output/ holds projects, which are not the kit's, so it is left out. The archives are
// left out too: they keep earlier notes and runs exactly as they were written.
const ARCHIVES = ['_archive', path.join('_data_model', '_data_model_archive')];
function mdFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && dir === KIT && e.name === 'Output') continue;
    if (e.isDirectory() && ARCHIVES.includes(path.relative(KIT, p))) continue;
    if (e.isDirectory()) mdFiles(p, out);
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- run-paths

test('run-paths: the layout reads, its table and JSON block agree, and it names the folders made at setup', () => {
  assert.ok(Object.keys(layout()).length >= 30);
  assert.deepStrictEqual(setupFolders(), ['sources/', 'glossary/', 'glossary/deep-dives/', 'glossary/data-models/', 'frd/', 'epics/']);
});

test('run-paths: every document in project-folders.md resolves, and identifies back', () => {
  const values: Values = { capability: 'claim-approval', epic: 'EPIC-002-claim-approval', story: 'reject-a-claim', change: '001-receipt-limit', section: 'claim-approval', family: 'lending', document: 'frd/frd-claim-approval', n: '1' };
  const dir = projectDir('expense-claims', { output: '/x' });
  for (const name of Object.keys(layout())) {
    const p = pathOf('expense-claims', name, values, { output: '/x' });
    assert.ok(p.startsWith(dir), `${name} resolves outside the project: ${p}`);
    assert.ok(!p.includes('{'), `${name} kept a placeholder: ${p}`);
    const back = identify(relOf(name, { product: 'expense-claims', ...values }));
    if (!layout()[name].endsWith('/')) assert.strictEqual(back && back.document, name, `${name} doesn't identify back`);
  }
  assert.strictEqual(relOf('brd', { product: 'expense-claims' }), 'expense-claims-brd.md');
  assert.strictEqual(slug('Source & Team Setup'), 'source-and-team-setup');
});

test('run-paths: in the data model folder, the things file and the decisions file are never taken for a family\'s file', () => {
  assert.deepStrictEqual(identify('glossary/data-models/city-library-glossary-things.md'), { document: 'data-model-things', values: { product: 'city-library' } });
  assert.deepStrictEqual(identify('glossary/data-models/city-library-data-model-decisions.md'), { document: 'data-model-decisions', values: { product: 'city-library' } });
  assert.deepStrictEqual(identify('glossary/data-models/lending.md'), { document: 'data-model', values: { family: 'lending' } });
  assert.deepStrictEqual(parseArgs(['--project', 'city-library', '--family', 'lending']).values, { product: 'city-library', family: 'lending' });
  const out = tempDir('foundation');
  for (const f of ['city-library-glossary-things.md', 'city-library-data-model-decisions.md', 'books.md', 'lending.md']) write(path.join(out, 'city-library', 'glossary', 'data-models', f), '# x\n');
  assert.deepStrictEqual(matches('city-library', 'data-model', { output: out }).map((m) => m.values.family), ['books', 'lending']);
});

test('run-paths: a missing value names the option to use', () => {
  assert.throws(() => relOf('frd', {}), /needs a value for {capability}\. Use --capability/);
});

test('run-paths: a malformed layout makes a program exit with code 2', () => {
  const dir = tempDir('foundation');
  const bad = path.join(dir, 'project-folders.md');
  fs.writeFileSync(bad, '# Project folders\n\n```json\n{ "paths": { "prd": "{product}-prd.md", \n```\n');
  const r = run('version-log.ts', ['--project', 'p', '--document', 'prd', '--output', dir], { env: { SPECIFIER_LAYOUT: bad } });
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /malformed/);
  fs.writeFileSync(bad, '# Project folders\n\nNo block here.\n');
  assert.strictEqual(run('status.ts', ['--project', 'p', '--output', dir], { env: { SPECIFIER_LAYOUT: bad } }).code, 2);
});

test('run-paths: a Story list or an EPIC brief is never listed as a Story', () => {
  const out = slice();
  write(path.join(out, 'mcp-slice', 'epics', EPIC_003, 'brief.md'), '# EPIC brief\n');
  const files = matches('mcp-slice', 'story', { output: out }).map((m) => m.values.story);
  assert.deepStrictEqual(files, ['add-team-member', 'import-members-in-bulk', 'set-member-status']);
});

// ---------------------------------------------------------------- md-tables

test('md-tables: every table in every template reads, with its own columns', () => {
  for (const file of fs.readdirSync(TEMPLATES).filter((f) => f.endsWith('.md'))) {
    const text = readText(path.join(TEMPLATES, file));
    for (const h of headings(text)) {
      const rows = tableUnder(text, h.text);
      assert.ok(Array.isArray(rows), `${file}: "${h.text}" didn't read`);
      for (const r of rows) assert.ok(Object.keys(r).length > 1 || '' in r === false, `${file}: a row under "${h.text}" has no columns`);
    }
  }
});

test('md-tables: the tables the programs read have the columns they expect', () => {
  const t = (f: string): string => path.join(TEMPLATES, f);
  const expect: [string, string, string[]][] = [
    ['brd.md', 'Business requirements', ['BR ID']],
    ['prd.md', 'Requirements', ['ID', 'Kind', 'In simple words', "The client's words", 'Traces to']],
    ['prd.md', 'NFRs', ['NFR ID']],
    ['prd.md', 'Transition requirements', ['ID']],
    ['feature-catalog.md', 'Feature catalog', ['Feature ID', 'Covers (source IDs)', 'Capability']],
    ['feature-catalog.md', '"Done when" pieces', ['Piece ID']],
    ['epic-register.md', 'EPICs', ['EPIC', 'Name', 'Features', 'Depends on']],
    ['epic-register.md', 'Run order', ['EPIC']],
    ['frd.md', 'Rules', ['Rule']],
    ['frd.md', 'Coverage', ['Done-when', 'Proved by']],
    ['epic-brief.md', 'NFRs that apply', ['NFR ID']],
    ['story-list.md', 'Stories', ['Story', 'Feature ID', 'Status']],
    ['story.md', 'Rules', ['Step', 'FRD rule ID', 'Rule']],
  ];
  for (const [file, heading, cols] of expect) {
    const rows = tableUnder(t(file), heading);
    assert.ok(rows && rows.length, `${file}: no rows under "${heading}"`);
    for (const c of cols) assert.ok(c in rows[0], `${file}: "${heading}" has no column "${c}"`);
  }
});

test('md-tables: comments and code blocks are skipped', () => {
  const text = '# T\n\n## H\n\n<!-- a note\n| X | Y |\n|---|---|\n| hidden | row |\n-->\n\n```\n| A | B |\n|---|---|\n| code | row |\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |\n';
  assert.deepStrictEqual(tableUnder(text, 'H')!.map((r) => r.A), ['1']);
  assert.strictEqual(headings(path.join(TEMPLATES, 'frd.md')).some((h) => h.text.includes('flowchart')), false);
});

test('md-tables: <br> splits a cell into a list, and bullets are removed', () => {
  const rows = tableUnder(path.join(TEMPLATES, 'epic-grouping.md'), 'Option A: {strategy}')!;
  assert.deepStrictEqual(rows[0]['Features (by ID)'], ['{feature ID}', '{feature ID}']);
  assert.deepStrictEqual(list('• F-01'), ['F-01']);
  assert.deepStrictEqual(list(''), []);
});

test('md-tables: a heading matches without its number or the text after a dash, and a section beats the title', () => {
  const text = '# T\n\n## 4. Coverage — every piece\n\n| A | B |\n|---|---|\n| 1 | 2 |\n';
  assert.deepStrictEqual(tableUnder(text, 'Coverage')!.map((r) => r.A), ['1']);
  assert.strictEqual(tableUnder(text, 'Nowhere'), null);
  const titled = '# Stories — EPIC-001\n\n| X | Y |\n|---|---|\n| a | b |\n\n## Stories\n\n| A | B |\n|---|---|\n| 1 | 2 |\n';
  assert.deepStrictEqual(tableUnder(titled, 'Stories')!.map((r) => r.A), ['1']);
});

// ---------------------------------------------------------------- md-lint, and what every file may say

test('md-lint: it finds each kind of break, and passes what renders', () => {
  const problems = (t: string): string => lint(t).map((p) => p.problem).join('\n');
  assert.match(problems('| A | B |\n|---|---|\n| a | b \\| c |\n| e | f | g |\n'), /table row has 3 cells; its header has 2/);
  assert.match(problems('# BRD — <product name>\n'), /is hidden when rendered/);
  assert.match(problems('[x](../sources/my file.md)\n'), /link path/);
  assert.match(problems('```mermaid\nflowchart TD\n  A[{action}] --> B\n```\n'), /mermaid label needs double quotes/);
  const clean = '# T\n\n| A | B |\n|---|---|\n| a<br>b | `x` |\n\n```mermaid\nflowchart TD\n  A["role(s) <br> {x}"] -.->|"go"| B(["done"])\n```\n';
  assert.deepStrictEqual(lint(clean), []);
});

test('md-lint: markdown shown inside a code block is found, and JSON or a tree is not', () => {
  const lineage = '**The Lineage block:**\n\n```\n> **Lineage**\n> - **Previous step:** {the step before}\n```\n';
  assert.match(lint(lineage).map((p) => p.problem).join('\n'), /markdown shown inside a code block/);
  assert.deepStrictEqual(lint('```json\n{ "a": 1 }\n```\n\n```\nOutput/\n  sources/   your files\n```\n'), []);
});

test('the kit carries no build history: no interim name, spec item, build phase, design-page row, gate answer or builder note', () => {
  // Everything a specifier opens is the kit: the README, the rules, templates and examples, the programs and their
  // tests, and the notes on the test data. The history of how the kit was built lives in the specs, the master plan,
  // the build log and the pass record, which are build documents.
  const dir = (d: string, ext: string): string[] => fs.readdirSync(d).filter((f) => f.endsWith(ext)).map((f) => path.join(d, f));
  const files = [
    path.join(KIT, 'README.md'),
    ...mdFiles(path.join(KIT, '.claude')),
    path.join(KIT, 'fixtures', 'README.md'),
    path.join(KIT, 'fixtures', 'approved-glossary-method', 'README.md'),
    ...dir(TOOLS, '.ts'),
    ...dir(path.join(TOOLS, 'lib'), '.ts'),
    ...dir(path.join(TOOLS, 'tests'), '.ts'),
    ...dir(path.join(TOOLS, 'tests', 'helpers'), '.ts'),
  ];
  // Each banned pattern, what it is, and the files whose own content may use the same words: the glossary method,
  // approved as it is, gives a numbered release as an example of a section name, and the tests quote programs that number a
  // table's rows. "BABOK v3" is the edition of the BABOK Guide that the writing rules cite, not the interim name.
  const banned = [
    [/(^|[\s(])(?<!BABOK )v3\b/i, 'the interim name "v3"'],
    [/specifier_v3|SPECIFIER_V3/i, 'the interim folder name'],
    [/\bRows? \d/, 'a row of a design page', /^tools[\\/]tests[\\/]/],
    [/Old vs New/i, 'a design page'],
    [/Phase \d gate|your answer [A-C]\b|decision of 20\d\d/i, 'a gate answer'],
    [/points here, and never repeats|names the decision behind it/i, 'a note written for the builders'],
    [/\b(?:NET-NEW|OPTIMIZE|EXTEND|REUSE)\b(?: item)? ?\d/, 'a spec item'],
    [/\bPhases? \d/, 'a build phase', /[\\/]_shared[\\/]glossary[\\/]/],
    [/phase-\d+-inputs|phase-\d+\.test/, 'a build folder or file name'],
    [/\|\s*Copied (?:from|by)\s*\|/, 'a column saying where a file was copied from'],
    [/\bapproved (?:it |them )?on \d|\bas you approved\b/i, 'an approval date'],
  ];
  const found: string[] = [];
  for (const f of files) {
    const rel = path.relative(KIT, f);
    // This test's own list of patterns is left out, since each pattern names what it bans.
    let inList = false;
    readText(f).split('\n').forEach((line, i) => {
      if (f === import.meta.filename && /^ {2}const banned = \[$/.test(line)) inList = true;
      if (inList) { if (/^ {2}\];$/.test(line)) inList = false; return; }
      for (const [re, what, except] of banned as [RegExp, string, RegExp?][]) if (re.test(line) && !(except && except.test(rel))) found.push(`${rel}:${i + 1}: ${what}`);
    });
  }
  assert.deepStrictEqual(found, []);
});

test('rules files, templates and programs use no client material: every example is the made-up Expense claims product', () => {
  // The test data in fixtures/ is the one place a real client's material may appear.
  const files = [
    ...mdFiles(path.join(KIT, '.claude')),
    ...fs.readdirSync(TOOLS).filter((f) => f.endsWith('.ts')).map((f) => path.join(TOOLS, f)),
    ...fs.readdirSync(path.join(TOOLS, 'lib')).map((f) => path.join(TOOLS, 'lib', f)),
  ];
  const client = /\bmcp\b|mcp-|Modernization Control Plane|Team & roles|team-and-roles|add-team-member|member-phone|Source & Team/i;
  const found: string[] = [];
  for (const f of files) {
    readText(f).split('\n').forEach((line, i) => {
      if (client.test(line)) found.push(`${path.relative(KIT, f)}:${i + 1}`);
    });
  }
  assert.deepStrictEqual(found, []);
});

test('rules files, templates, examples and programs use the agreed names only', () => {
  const files = [
    ...mdFiles(path.join(KIT, '.claude')),
    path.join(KIT, 'fixtures', 'README.md'),
    ...fs.readdirSync(TOOLS).filter((f) => f.endsWith('.ts')).map((f) => path.join(TOOLS, f)),
  ];
  const old = /\bClustering\b|clustering-author|EPIC detail|Story index|story file|story-index|story-file|epic-detail|EPIC Register|Discovery Brief|Change Impact Report|the-stop\.md|how-a-stop-works|WITH_A_STOP|run-layout|version-log-entry/;
  const found: string[] = [];
  for (const f of files) {
    readText(f).split('\n').forEach((line, i) => {
      if (old.test(line)) found.push(`${path.relative(KIT, f)}:${i + 1}: ${line.match(old)![0]}`);
    });
  }
  assert.deepStrictEqual(found, []);
});

test('rules files, templates, examples and programs call the point of decision a gate, and the question groups by their names', () => {
  // "Stop" as a verb stays, as in "the skill stops redrafting". As a noun it is now "gate", or "decision review gate".
  // The question groups are Must answer, Should answer and Can move ahead, never "blocking".
  // The glossary method in _shared/glossary/ is copied as approved: its words are set by its own word list,
  // method-words.md, where a gate "blocks" and "a stop that lives only in the conversation is not a gate".
  const method = path.join(KIT, '.claude', 'skills', '_shared', 'glossary');
  const files = [
    ...mdFiles(path.join(KIT, '.claude')).filter((f) => !f.startsWith(method)),
    path.join(KIT, 'fixtures', 'README.md'),
    ...fs.readdirSync(TOOLS).filter((f) => f.endsWith('.ts')).map((f) => path.join(TOOLS, f)),
  ];
  const old = /\b(a|an|the|each|every|its|this|next|same|any|no|your|whose|their|first|last) stops?\b|\bat (a|the|every|each|its) stop\b|\bStop \d|\bstop's\b|\bstops? (question|message|rule|layout)s?\b|\b(non-)?blocking\b/i;
  const found: string[] = [];
  for (const f of files) {
    readText(f).split('\n').forEach((line, i) => {
      if (old.test(line)) found.push(`${path.relative(KIT, f)}:${i + 1}: ${line.match(old)![0]}`);
    });
  }
  assert.deepStrictEqual(found, []);
});

test('every kit document renders cleanly: templates, examples, shared files, specs, plan, build log and fixtures', () => {
  const found: string[] = [];
  // The approved glossary method is kept exactly as it was approved, so only its README is held to the kit's rules.
  // The old change-impact skill is kept exactly as it was too.
  const later = (f: string): boolean => /^fixtures[\\/](approved-glossary-method[\\/](?!README\.md$)|old-change-impact-skill[\\/])/.test(path.relative(KIT, f));
  for (const f of mdFiles(KIT).filter((x) => !later(x))) for (const p of lint(readText(f))) found.push(`${path.relative(KIT, f)}:${p.line}: ${p.problem}`);
  assert.deepStrictEqual(found, []);
});

// ---------------------------------------------------------------- templates and examples

test('every document template opens with its title, then its status line, with no opening notes', () => {
  for (const name of DOCUMENT_TEMPLATES) {
    const text = readText(path.join(TEMPLATES, `${name}.md`));
    const body = text.slice(0, text.indexOf('\n## Placeholders\n'));
    assert.ok(!/^> \*\*(What this is|What it is not|Written by|Lineage)\b/m.test(body), `${name}: an opening note is outside the Placeholders part`);
    if (!NO_STATUS_LINE.includes(name)) assert.match(text, /^# .+\n\nStatus: drafted\n/, `${name}: the status line isn't straight under the title`);
    else assert.ok(!/^Status:/m.test(text), `${name}: has a status line, and shouldn't`);
  }
});

test('every template makes sense on its own: nothing hidden, no line in italics, and every section in "What each section holds"', () => {
  const found: string[] = [];
  for (const name of DOCUMENT_TEMPLATES) {
    const text = readText(path.join(TEMPLATES, `${name}.md`));
    const at = text.indexOf('\n## Placeholders\n');
    const body = text.slice(0, at);
    if (text.includes('<!--')) found.push(`${name}: holds a hidden HTML comment`);
    // A flow step ends with its rule tag in italics, such as *(F-04.3)*: it is content, not guidance.
    for (const l of body.split('\n')) if (/^(- )?\*[^*].*\*\s*$/.test(l.trim()) && !/\*\([^)]*\)\*\s*$/.test(l)) found.push(`${name}: a line in italics: ${l.slice(0, 60)}`);
    if (!/^### About this template$/m.test(text.slice(at))) found.push(`${name}: its Placeholders part has no "About this template"`);
    const holds = new Set((tableUnder(text.slice(at), 'What each section holds') || []).map((r) => String(r.Section).replace(/\\\|/g, '|')));
    for (const h of headings(body).filter((x) => x.level === 2)) if (!holds.has(h.text)) found.push(`${name}: "${h.text}" isn't in "What each section holds"`);
  }
  assert.deepStrictEqual(found, []);
});

test('every template has a short title, and ends with a Placeholders table that explains every label it uses', () => {
  const found: string[] = [];
  for (const name of DOCUMENT_TEMPLATES) {
    const text = readText(path.join(TEMPLATES, `${name}.md`));
    const title = text.split('\n')[0];
    for (const label of title.match(/\{[^}]+\}/g) || []) if (label.length > 20) found.push(`${name}: the title's label ${label} is long`);
    const at = text.indexOf('\n## Placeholders\n');
    if (at < 0) { found.push(`${name}: no Placeholders section`); continue; }
    if (/\n## /.test(text.slice(at + 3))) found.push(`${name}: the Placeholders section is not last`);
    const used = new Set((text.slice(0, at).replace(/`[^`\n]*`/g, '').match(/\{[^}\n]+\}/g)) || []);
    const rows = tableUnder(text.slice(at), 'What to write for each label') || [];
    const explained = new Set(rows.flatMap((r) => (String(r.Label).match(/\{[^}]+\}/g) || [])));
    for (const u of used) if (!explained.has(u)) found.push(`${name}: ${u} is used but not explained`);
    for (const e of explained) if (!used.has(e)) found.push(`${name}: ${e} is explained but not used`);
    for (const r of rows) if (!String(r['What to write']).trim() || !String(r.Example).trim()) found.push(`${name}: ${r.Label} has no explanation or no example`);
  }
  assert.deepStrictEqual(found, []);
});

test('every document with a gate, and the Question log, has a Check record, followed only by its Placeholders', () => {
  for (const name of [...WITH_A_GATE, 'question-log']) {
    const text = readText(path.join(TEMPLATES, `${name}.md`));
    assert.match(text, /## Check record\n\n(\*[^\n]*\*\n\n)?None yet\.\n\n## Placeholders\n/, `${name}: the Check record isn't just before the Placeholders`);
  }
});

test('every example has a template of the same name, says it is an example, and leaves no placeholder', () => {
  for (const f of fs.readdirSync(EXAMPLES)) {
    assert.ok(fs.existsSync(path.join(TEMPLATES, f)), `examples/${f} has no template of the same name`);
    const text = readText(path.join(EXAMPLES, f));
    assert.match(text, /^> \*\*Example\.\*\* A worked example/, `examples/${f}: doesn't say it is an example`);
    assert.ok(!/\{[^}\n]*\}/.test(text.replace(/`[^`]*`/g, '')), `examples/${f}: a placeholder is left`);
    assert.ok(!text.includes('## Placeholders'), `examples/${f}: carries the Placeholders section`);
  }
});

// What each section holds stays in the template, so an example has its template's headings, and no notes of its own.
test('every example has its template\'s headings, and no opening note or line in italics', () => {
  const sections = (text: string) => text.replace(/\r\n/g, '\n').split('\n').map((l) => (l.match(/^## (.+)$/) || [])[1]).filter((h) => h && h !== 'Placeholders');
  for (const f of fs.readdirSync(EXAMPLES)) {
    const text = readText(path.join(EXAMPLES, f));
    assert.deepStrictEqual(sections(text), sections(readText(path.join(TEMPLATES, f))), `examples/${f}: its headings differ from the template's`);
    assert.ok(!/^> \*\*(What this is|What it is not|Written by|Lineage)\b/m.test(text), `examples/${f}: has an opening note`);
    assert.ok(!text.split('\n').some((l) => /^(- )?\*[^*].*\*\s*$/.test(l.trim()) && !/\*\([^)]*\)\*\s*$/.test(l)), `examples/${f}: has a line in italics`);
  }
});

// ---------------------------------------------------------------- version-log

test('version-log: a new log opens with the program that writes it', () => {
  const out = slice();
  run('version-log.ts', ['--project', 'mcp-slice', '--document', 'prd', '--output', out, '--date', DATE]);
  const log = readText(path.join(out, 'mcp-slice', 'version-log', 'log.md'));
  assert.match(log, /^# Version log — mcp-slice\n\nWritten by version-log\.ts, one row at each acceptance\. Never edit it by hand\.\n/);
  assert.deepStrictEqual(lint(log), []);
});

test('version-log: two acceptances give v1 and v2, with the right line counts', () => {
  const out = slice();
  const prd = path.join(out, 'mcp-slice', 'mcp-slice-prd.md');
  const total = readText(prd).split('\n').length - 1;
  let r = run('version-log.ts', ['--project', 'mcp-slice', '--document', 'prd', '--output', out, '--date', DATE]);
  assert.strictEqual(r.code, 0, r.err);
  assert.match(readText(prd), /^Status: accepted on 2026-10-19, version 1$/m);
  assert.ok(fs.existsSync(path.join(out, 'mcp-slice', 'version-log', 'mcp-slice-prd', 'v1.md')));

  // A redraft: the status goes back to drafted, two lines are added and one is removed.
  const text = readText(prd)
    .replace(/^Status: .*$/m, 'Status: drafted')
    .replace('- None\n', '- First added line\n- Second added line\n');
  fs.writeFileSync(prd, text);
  r = run('version-log.ts', ['--project', 'mcp-slice', '--document', 'mcp-slice-prd.md', '--output', out, '--date', DATE]);
  assert.strictEqual(r.code, 0, r.err);
  const log = readText(path.join(out, 'mcp-slice', 'version-log', 'log.md'));
  const rows = log.split('\n').filter((l) => /^\| \d/.test(l));
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0], `| 1 | mcp-slice-prd.md | ${DATE} | None | [v1](mcp-slice-prd/v1.md) | ${total} | 0 |`);
  // The status line changed (1 added, 1 removed), plus 2 added and 1 removed.
  assert.strictEqual(rows[1], `| 2 | mcp-slice-prd.md | ${DATE} | None | [v2](mcp-slice-prd/v2.md) | 3 | 2 |`);
});

test('version-log: it names the last decision, and leaves a Story without a status line', () => {
  const out = slice();
  let r = run('version-log.ts', ['--project', 'mcp-slice', '--document', 'frd', '--capability', 'team-and-roles', '--output', out, '--date', DATE]);
  assert.strictEqual(r.code, 0, r.err);
  r = run('version-log.ts', ['--project', 'mcp-slice', '--document', 'story', '--epic', EPIC_003, '--story', 'add-team-member', '--output', out, '--date', DATE]);
  assert.strictEqual(r.code, 0, r.err);
  const log = readText(path.join(out, 'mcp-slice', 'version-log', 'log.md'));
  assert.match(log, /\| 1 \| frd\/frd-team-and-roles\.md \| 2026-10-19 \| Decision 13 \|/);
  const story = readText(path.join(out, 'mcp-slice', 'epics', EPIC_003, 'add-team-member.md'));
  assert.ok(!/^Status:/m.test(story));
});

test('version-log: a missing document exits with code 2', () => {
  const out = slice();
  const r = run('version-log.ts', ['--project', 'mcp-slice', '--document', 'brd', '--output', out]);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /doesn't exist: mcp-slice-brd\.md/);
});

// ---------------------------------------------------------------- traceability-map

function acceptSlice(out: string): void {
  for (const d of [['prd'], ['feature-catalog'], ['epic-register'], ['frd', '--capability', 'team-and-roles'], ['story-list', '--epic', EPIC_003]]) {
    const r = accept(out, 'mcp-slice', d[0], d.slice(1));
    assert.strictEqual(r.code, 0, `${d[0]}: ${r.out}${r.err}`);
  }
}

test('traceability-map: on the MCP slice, every ID appears once and every expected link is there', () => {
  const out = slice();
  acceptSlice(out);
  const map = JSON.parse(fs.readFileSync(path.join(out, 'mcp-slice', 'traceability-map.json'), 'utf8')) as TraceabilityMap;
  const count = (type: string): number => map.items.filter((i) => i.type === type).length;
  assert.deepStrictEqual(
    { requirement: count('requirement'), feature: count('feature'), piece: count('piece'), EPIC: count('EPIC'), FRD: count('FRD'), rule: count('rule'), story: count('story') },
    { requirement: 6, feature: 6, piece: 14, EPIC: 1, FRD: 1, rule: 19, story: 12 },
  );
  const ids = map.items.map((i) => i.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  const has = (from: string, to: string, type: string): boolean => map.links.some((l) => l.from === from && l.to === to && l.type === type);
  assert.ok(has('F-15', 'REQ-3.1', 'covers'));
  assert.ok(has('F-15', 'F-15.dw3', 'has-piece'));
  assert.ok(has('F-15', 'FRD-3a', 'in-frd'));
  assert.ok(has('F-20', 'FRD-3c', 'in-frd'));
  assert.ok(has('F-20', 'EPIC-003', 'in-epic'));
  assert.ok(has('F-15.6', 'F-15.dw2', 'proves'));
  assert.ok(has('F-15', 'F-15.6', 'has-rule'));
  assert.ok(has('Import Members in Bulk', 'F-15', 'tells'));
  const byType = (t: string): number => map.links.filter((l) => l.type === t).length;
  assert.deepStrictEqual(
    { covers: byType('covers'), 'has-piece': byType('has-piece'), 'in-frd': byType('in-frd'), 'in-epic': byType('in-epic'), proves: byType('proves'), tells: byType('tells') },
    { covers: 6, 'has-piece': 14, 'in-frd': 6, 'in-epic': 6, proves: 7, tells: 12 },
  );
  const item = map.items.find((i) => i.id === 'F-15.1');
  assert.deepStrictEqual(item, { id: 'F-15.1', type: 'rule', document: 'frd/frd-team-and-roles.md', version: 1 });
});

test('traceability-map: FRDs not yet written are waiting, not problems', () => {
  const out = slice();
  acceptSlice(out);
  const r = run('traceability-map.ts', ['--project', 'mcp-slice', '--output', out]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /- FRD-3b, wanted by:\n  - F-16\n  - F-17\n  - F-18\n  - F-19/);
  assert.match(r.out, /- FRD-3c, wanted by:\n  - F-20/);
});

test('traceability-map: a link to an ID missing from an accepted document is a problem, with exit code 1', () => {
  const out = slice();
  const cat = path.join(out, 'mcp-slice', 'frd', 'feature-catalog.md');
  fs.writeFileSync(cat, readText(cat).replace('| • REQ-3.6 |', '| • REQ-3.9 |'));
  assert.strictEqual(accept(out, 'mcp-slice', 'prd').code, 0);
  const r = accept(out, 'mcp-slice', 'feature-catalog');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /covers: F-20 -> REQ-3\.9, but REQ-3\.9 isn't in the accepted prd/);
});

test('traceability-map: an ID that appears twice is a problem', () => {
  const out = slice();
  const cat = path.join(out, 'mcp-slice', 'frd', 'feature-catalog.md');
  fs.writeFileSync(cat, readText(cat).replace('| F-16.dw1 |', '| F-15.dw1 |'));
  const r = accept(out, 'mcp-slice', 'feature-catalog');
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /F-15\.dw1 appears twice/);
});

test('traceability-map: the link types the MCP slice has no data for yet: traces, applies, names-rule', () => {
  // Small scaffold documents, holding only the tables the map reads.
  const out = tempDir('foundation');
  const docs = {
    'run-brd.md': '## 5. Business requirements\n\n| BR ID | Business requirement | Source |\n|---|---|---|\n| BR-01 | x | y |\n',
    'run-prd.md': '## 4. Requirements\n\n### 1. One\n\n| ID | In simple words | The client\'s words | Source | Traces to |\n|---|---|---|---|---|\n| REQ-1.1 | x | x | y | • BR-01 |\n\n## 6. NFRs\n\n### Evidenced\n\n| NFR ID | NFR | Source | Confidence |\n|---|---|---|---|\n| NFR-1 | x | y | CONFIRMED |\n\n## 7. Transition requirements\n\n| ID | Requirement | Source | Needs building? |\n|---|---|---|---|\n| TR-1 | x | y | no |\n',
    'frd/feature-catalog.md': '## 2. Feature catalog\n\n| Feature ID | Covers (source IDs) | Capability |\n|---|---|---|\n| F-01 | • REQ-1.1 | FRD-1a One |\n\n## 3. "Done when" pieces\n\n| Piece ID | Piece |\n|---|---|\n| F-01.dw1 | x |\n',
    'epics/register.md': '## 1. EPICs\n\n| EPIC | Features |\n|---|---|\n| EPIC-001 | • F-01 |\n',
    'frd/frd-one.md': '# FRD-1a One\n\n## Rules\n\n### F-01 One\n\n| Rule | The system shall… | Source |\n|---|---|---|\n| F-01.1 | x | F-01.dw1 — x |\n\n## Coverage — every Done-when piece has a rule\n\n| Done-when | Clause | Proved by |\n|---|---|---|\n| F-01.dw1 | x | F-01.1 |\n',
    'epics/EPIC-001-x/brief.md': '## 7. NFRs that apply\n\n| NFR ID |\n|---|\n| NFR-1 |\n',
    'epics/EPIC-001-x/story-list.md': '## Stories\n\n| # | Story | Statement | Req ID | Feature ID | Status |\n|---|---|---|---|---|---|\n| 1 | [Do It](do-it.md) | x | • REQ-1.1 | F-01 | ready |\n',
    'epics/EPIC-001-x/do-it.md': '# Story — Do It\n\n## Acceptance criteria\n\n### Behaviour\n\n**Scenario 1 - Do it (F-01.1)**\n- **Given** x\n- **When** y\n- **Then** z\n',
  };
  for (const [rel, text] of Object.entries(docs)) {
    write(path.join(out, 'run', rel), text);
    const r = run('version-log.ts', ['--project', 'run', '--document', rel, '--output', out, '--date', DATE]);
    assert.strictEqual(r.code, 0, `${rel}: ${r.err}`);
  }
  const r = run('traceability-map.ts', ['--project', 'run', '--output', out]);
  assert.strictEqual(r.code, 0, r.out);
  const map = JSON.parse(fs.readFileSync(path.join(out, 'run', 'traceability-map.json'), 'utf8')) as TraceabilityMap;
  const has = (from: string, to: string, type: string): boolean => map.links.some((l) => l.from === from && l.to === to && l.type === type);
  assert.ok(has('REQ-1.1', 'BR-01', 'traces'));
  assert.ok(has('EPIC-001', 'NFR-1', 'applies'));
  assert.ok(has('Do It, Scenario 1', 'F-01.1', 'names-rule'));
  assert.ok(has('F-01', 'F-01.1', 'has-rule'));
  assert.ok(map.items.some((i) => i.id === 'TR-1' && i.type === 'requirement'));
  assert.strictEqual(map.links.length, 10);
});

// ---------------------------------------------------------------- accept

test('accept: one call leaves a new version and a rebuilt map, and runs track-change last', () => {
  const out = slice();
  const r = accept(out, 'mcp-slice', 'prd');
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /Saved mcp-slice-prd\.md as version 1/);
  assert.match(r.out, /Map rebuilt: 6 items, 0 links\./);
  assert.match(r.out, /track-change\.ts: no open change\.\n$/);
  assert.ok(fs.existsSync(path.join(out, 'mcp-slice', 'traceability-map.json')));
});

test('accept: it stops at the first failure, with that step\'s code', () => {
  const out = slice();
  const r = accept(out, 'mcp-slice', 'brd');
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /Acceptance stopped at version-log\.ts, exit code 2/);
  assert.ok(!fs.existsSync(path.join(out, 'mcp-slice', 'traceability-map.json')));
});

test('accept: every acceptance also saves a copy of the Question log, once, and a project without one is left as it is', () => {
  const out = slice();
  let r = accept(out, 'mcp-slice', 'prd');
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /Saved mcp-slice-question-log\.md as version 1/);
  assert.ok(fs.existsSync(path.join(out, 'mcp-slice', 'version-log', 'mcp-slice-question-log', 'v1.md')));
  r = accept(out, 'mcp-slice', 'question-log');
  assert.strictEqual(r.code, 0, r.err);
  assert.strictEqual((r.out.match(/Saved mcp-slice-question-log\.md/g) || []).length, 1);
  fs.unlinkSync(path.join(out, 'mcp-slice', 'mcp-slice-question-log.md'));
  r = accept(out, 'mcp-slice', 'prd');
  assert.strictEqual(r.code, 0, r.err);
  assert.ok(!/question-log/.test(r.out));
});

// ---------------------------------------------------------------- questions

// The three Expense claims examples and their Question log, as one project.
function expenseClaims(): string {
  const out = tempDir('foundation');
  for (const d of ['discovery-brief', 'brd', 'prd', 'question-log']) {
    write(path.join(out, 'expense-claims', relOf(d, { product: 'expense-claims' })), readText(path.join(EXAMPLES, `${d}.md`)));
  }
  return out;
}
function logOf(out: string): string {
  return path.join(out, 'expense-claims', 'expense-claims-question-log.md');
}
// Rewrites one line of one question's block: the row for a part, or the heading when part is null. A value of null removes the row.
function setPart(out: string, n: number, part: string | null, value: string | null): void {
  const lines = readText(logOf(out)).split('\n');
  const at = lines.findIndex((l) => l.startsWith(`### Question ${n}:`));
  assert.ok(at >= 0, `no question ${n}`);
  if (part === null) lines[at] = value as string;
  else {
    const row = lines.findIndex((l, i) => i > at && l.startsWith(`| ${part} |`));
    assert.ok(row > at, `question ${n} has no ${part}`);
    if (value === null) lines.splice(row, 1);
    else lines[row] = `| ${part} | ${value} |`;
  }
  fs.writeFileSync(logOf(out), lines.join('\n'));
}
function questionsUnder(out: string, section: string): number[] {
  const text = readText(logOf(out));
  const a = text.indexOf(`\n## ${section}\n`);
  const b = text.indexOf('\n## ', a + 4);
  return [...text.slice(a, b).matchAll(/^### Question (\d+):/gm)].map((m) => Number(m[1]));
}
function grade(out: string, project: string, extra: string[] = []): RunResult {
  return run('grade-questions.ts', ['--project', project, '--output', out, '--date', DATE, ...extra]);
}

test('grade-questions: the grid has nine cells, each with its order and group, and the template is its only home', () => {
  assert.deepStrictEqual(readGrid(TEMPLATE), {
    'High|High': { order: 1, group: 'Must answer' },
    'High|Medium': { order: 2, group: 'Must answer' },
    'High|Low': { order: 3, group: 'Must answer' },
    'Medium|High': { order: 4, group: 'Should answer' },
    'Medium|Medium': { order: 5, group: 'Should answer' },
    'Low|High': { order: 6, group: 'Should answer' },
    'Medium|Low': { order: 7, group: 'Can move ahead' },
    'Low|Medium': { order: 8, group: 'Can move ahead' },
    'Low|Low': { order: 9, group: 'Can move ahead' },
  });
  // The example is a filled-in Question log, so it carries the log's copy of the grid. No rules file holds another.
  const holders = mdFiles(path.join(KIT, '.claude')).filter((f) => readText(f).includes('| Order | Severity | Impact | Group |'));
  assert.deepStrictEqual(holders.map((f) => path.relative(SHARED, f).split(path.sep).join('/')).sort(), ['examples/question-log.md', 'templates/question-log.md']);
});

test('grade-questions: the Expense claims examples together have no findings, and their open questions are not findings', () => {
  const out = expenseClaims();
  const r = grade(out, 'expense-claims', ['--check-only']);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^4 open questions: 1 must answer, 1 should answer, 2 can move ahead\. 4 answered\.$/m);
  assert.deepStrictEqual(gradeQuestions('expense-claims', { output: out, checkOnly: true }).order.map((q) => q.n), [4, 6, 8, 7]);
  // Each line of the order shows both ratings, so the reason for the group is visible at the gate.
  assert.match(r.out, /^- question 4, must answer \(severity High, impact High\): Which currencies can a claim be made in\?$/m);
  assert.match(r.out, /^- question 7, can move ahead \(severity Low, impact Low\): What targets must the two success measures reach\?$/m);
  assert.match(r.out, /^One line:\nQuestion log: 4 open questions \(1 must answer, 1 should answer, 2 can move ahead\), 0 findings\.$/m);
  assert.match(r.out, /^For the file:\ngrade-questions\.ts, 2026-10-19: /m);
});

test('grade-questions: a new rating moves a question to its group, in the grid\'s order, and --check-only only reports it', () => {
  const out = expenseClaims();
  setPart(out, 8, 'Impact', 'High. It now reaches every claim.');
  setPart(out, 8, 'Severity', 'High. A claim left waiting misses the payroll date.');
  setPart(out, 6, 'Severity', 'High. A claim nobody can approve is never paid.');
  setPart(out, 6, 'Impact', 'Low. It reaches one detail.');
  const before = readText(logOf(out));
  let r = grade(out, 'expense-claims', ['--check-only']);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /- moved: Question 8 moves from Can move ahead to Must answer\./);
  assert.match(r.out, /- moved: Question 6 moves from Should answer to Must answer\./);
  assert.strictEqual(readText(logOf(out)), before);
  r = grade(out, 'expense-claims');
  assert.strictEqual(r.code, 0, r.out);
  // Must answer: questions 4 and 8 are High severity and High impact, so first, by number; then question 6, High and Low.
  assert.deepStrictEqual(questionsUnder(out, '5. Must answer'), [4, 8, 6]);
  assert.deepStrictEqual(questionsUnder(out, '6. Should answer'), []);
  assert.deepStrictEqual(questionsUnder(out, '7. Can move ahead'), [7]);
  assert.match(readText(logOf(out)), /## 6\. Should answer\n\nNone yet\./);
  r = grade(out, 'expense-claims', ['--check-only']);
  assert.ok(!/moved:/.test(r.out), r.out);
});

test('grade-questions: an answer moves a question to Answered, in number order', () => {
  const out = expenseClaims();
  setPart(out, 7, 'Next best action', 'Ask the finance team.');
  const lines = readText(logOf(out)).split('\n');
  const at = lines.findIndex((l, i) => i > lines.findIndex((x) => x.startsWith('### Question 7:')) && l.startsWith('| Next best action |'));
  lines.splice(at + 1, 0, '| Answer | 10 working days |', '| Decided in | [expense-claims-brd.md](expense-claims-brd.md), Decision 2 |');
  fs.writeFileSync(logOf(out), lines.join('\n'));
  const r = grade(out, 'expense-claims');
  assert.strictEqual(r.code, 0, r.out);
  assert.deepStrictEqual(questionsUnder(out, '7. Can move ahead'), [8]);
  assert.deepStrictEqual(questionsUnder(out, '8. Answered'), [1, 2, 3, 5, 7]);
});

test('grade-questions: each broken part of a question is a finding', () => {
  const out = expenseClaims();
  setPart(out, 4, 'Answers', "• **Yes, euros only**. Why you'd pick it: no file mentions another currency. What happens next: every claim is in euros.<br>• **Any currency**. Why you'd pick it: staff travel. What happens next: the claim holds both amounts.");
  setPart(out, 6, "Why I'm asking", 'Because it matters.');
  setPart(out, 8, 'Impact', 'Big.');
  setPart(out, 7, 'Next best action', null);
  setPart(out, 1, null, '### Question 1: Who approves? And when?');
  setPart(out, 3, null, '### Question 2: When two limits differ, which holds?');
  const r = grade(out, 'expense-claims', ['--check-only']);
  assert.strictEqual(r.code, 1, r.out);
  for (const re of [
    /Question 4: the answer "Yes, euros only" starts with "Yes" or "No"/,
    /Question 4: its answers must offer "I don't know yet", once\./,
    /Question 6: "Why I'm asking" must cite a file, or say that no file speaks to it\./,
    /Question 8: its impact must read High, Medium or Low, then the reason\./,
    /Question 7: it has no "Next best action"\./,
    /Question 1: it must be one question, ending in a single question mark\./,
    /Question 2 appears twice\./,
  ]) assert.match(r.out, re);
});

test('grade-questions: every gap names a question in the log, and a gap whose question is answered is a note', () => {
  const out = expenseClaims();
  write(path.join(out, 'expense-claims', 'notes.md'), [
    '# Notes', '', '## 1. Notes', '', '*Write TBD, with its question, where no file says.*', '',
    '- Rate: TBD', '- Fee: TBD, question 99', '- Paper claims: TBD, question 5', '- Work item: TBD', '',
    '## Decision record', '', '- Limit: TBD', '',
  ].join('\n'));
  const r = grade(out, 'expense-claims', ['--check-only']);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /notes\.md, line 7: "TBD" names no question\. Write it as "TBD, question \{number\}"\./);
  assert.match(r.out, /notes\.md, line 8: "TBD" names question 99, which isn't in the Question log\./);
  assert.match(r.out, /- note: notes\.md, line 9: question 5 is answered/);
  assert.match(r.out, /^2 findings:$/m);
});

test('grade-questions: on the MCP slice it finds the gaps that name no question, and the answer that starts with "No"', () => {
  const r = grade(slice(), 'mcp-slice', ['--check-only']);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /^10 findings:$/m);
  assert.match(r.out, /Question 4: the answer "No two members may share an email" starts with "Yes" or "No"/);
  assert.strictEqual((r.out.match(/^- .* names no question\./gm) || []).length / 2, 9);
});

test('grade-questions: a project with no Question log has no questions, and a missing project exits with code 2', () => {
  const out = tempDir('foundation');
  fs.mkdirSync(path.join(out, 'empty'));
  const r = grade(out, 'empty');
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /No questions yet\.\n- note: There is no Question log yet\./);
  assert.strictEqual(grade(out, 'nowhere').code, 2);
});

test('status: it lists every Must answer question still open, with where it was raised, when it is due and the next best action', () => {
  const out = expenseClaims();
  const r = run('status.ts', ['--project', 'expense-claims', '--output', out]);
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /^Must answer, still open\n- question 4: Which currencies can a claim be made in\? Raised in expense-claims-discovery-brief\.md, section 5, Assumed\. Answer by: before the FRD for making a claim is accepted\. Next best action: Ask the finance team this week/m);
  assert.ok(!/question 6:/.test(r.out), 'a Should answer question is listed');
  const s = run('status.ts', ['--project', 'mcp-slice', '--output', slice()]);
  assert.match(s.out, /^Must answer, still open\n- None$/m);
});

// ---------------------------------------------------------------- status

// A small project called "run", written step by step, to check "Next:" at every point of a run.
function scaffold(out: string, rel: string, status: string, body = ''): void {
  write(path.join(out, 'run', rel), `# ${rel}\n\nStatus: ${status}\n\n${body}`);
}
function acceptDoc(out: string, rel: string): void {
  const r = run('version-log.ts', ['--project', 'run', '--document', rel, '--output', out, '--date', DATE]);
  assert.strictEqual(r.code, 0, r.err);
}

const CATALOG = `## 2. Feature catalog

| Feature ID | Feature | Capability |
|---|---|---|
| F-01 | One | FRD-1a First |
| F-02 | Two | FRD-1b Second |
| F-03 | Three | FRD-2a Third |
`;
const REGISTER = `## 1. EPICs

| EPIC | Name | Features | Depends on |
|---|---|---|---|
| EPIC-001 | Alpha | • F-01 | None |
| EPIC-002 | Beta | • F-02 | • EPIC-001 |
| EPIC-003 | Gamma | • F-03 | None |

## 2. Run order

| Order | EPIC |
|---|---|
| 1 | EPIC-001 |
| 2 | EPIC-002 |
| 3 | EPIC-003 |
`;
// The data model: a things file naming two families' files, and a decisions file holding Glossary changes. The data
// model's files write their own status line, "Accepted on {date}".
const THINGS = 'glossary/data-models/run-glossary-things.md';
const THINGS_BODY = '## Books\n\nData model file: [books.md](books.md)\n\n## Lending\n\nData model file: [lending.md](lending.md)\n';
const DECISIONS_REL = path.join('run', 'glossary', 'data-models', 'run-data-model-decisions.md');
// A decisions file with the open decisions given, then one Glossary change per status given, GC-1 onward, and the
// settled decisions given.
function decisionsFile(out: string, statuses: string[], open: string[] = [], settled: string[] = []): void {
  const gcs = statuses.map((s, i) => `### GC-${i + 1} — Word ${i + 1}\n\n- **The Glossary says:** belongs to nothing\n- **Raised from:** ${i % 2 ? 'lending.md · Loan' : 'books.md · Book'}\n- **Status:** ${s}\n`);
  write(path.join(out, DECISIONS_REL), `# Data model decisions — Run\n\n## Open\n\n${open.join('\n') || 'None yet.\n'}\n## Settled\n\n${settled.join('\n') || 'None yet.\n'}\n## Glossary changes\n\n${gcs.join('\n') || 'None yet.\n'}`);
}
// One decision of the decisions file: open, with its Chosen line, or settled, when it names who decided it.
const dmEntry = (id: string, where: string, chosen: string, decidedBy?: string): string => `### ${id} — Question ${id}?\n\n- **Where:** ${where}\n- **Chosen:** ${chosen}\n${decidedBy ? `- **Decided by:** ${decidedBy}\n` : ''}`;
// What status.ts prints under its "Next:" line.
function underNext(out: string): string[] {
  const r = run('status.ts', ['--project', 'run', '--output', out]);
  assert.strictEqual(r.code, 0, r.err);
  return r.out.split(/^Next: .*$/m)[1].split('\n').filter(Boolean);
}
// The requirements, the Glossary and the data model accepted: the things file names books.md and lending.md.
function upToTheFeatures(out: string): void {
  for (const rel of ['run-discovery-brief.md', 'run-brd.md', 'run-prd.md', 'glossary/deep-dives/gate-log.md']) {
    scaffold(out, rel, 'drafted'); acceptDoc(out, rel);
  }
  scaffold(out, THINGS, 'accepted on 2026-10-19, version 1', THINGS_BODY);
  for (const f of ['books', 'lending']) scaffold(out, `glossary/data-models/${f}.md`, 'accepted on 2026-10-19, version 1');
}
function stories(out: string, epicFolder: string, statuses: string[], status = 'accepted on 2026-10-19, version 1'): void {
  const rows = statuses.map((s, i) => `| ${i + 1} | [S${i + 1}](s${i + 1}.md) | x | • REQ-1 | F-01 | ${s} |`).join('\n');
  scaffold(out, `epics/${epicFolder}/story-list.md`, status, `## Stories\n\n| # | Story | Statement | Req ID | Feature ID | Status |\n|---|---|---|---|---|---|\n${rows}\n`);
}
function upToTheFrds(out: string): void {
  for (const rel of ['run-discovery-brief.md', 'run-brd.md', 'run-prd.md', 'glossary/deep-dives/gate-log.md', 'epics/grouping.md']) {
    scaffold(out, rel, 'drafted'); acceptDoc(out, rel);
  }
  scaffold(out, THINGS, 'Accepted on 2026-10-19', THINGS_BODY);
  for (const f of ['books', 'lending']) scaffold(out, `glossary/data-models/${f}.md`, 'Accepted on 2026-10-19');
  scaffold(out, 'frd/feature-catalog.md', 'drafted', CATALOG); acceptDoc(out, 'frd/feature-catalog.md');
  scaffold(out, 'epics/register.md', 'drafted', REGISTER); acceptDoc(out, 'epics/register.md');
  write(path.join(out, 'run', 'epics', 'sequencing.md'), 'x');
  write(path.join(out, 'run', 'epics', 'mapping.md'), 'x');
}

test('status: "Next:" names the right workflow at every point of a run', () => {
  const out = tempDir('foundation');
  fs.mkdirSync(path.join(out, 'run'), { recursive: true });
  const expectNext = (pattern: RegExp): void => assert.match(nextOf(out, 'run'), pattern);

  expectNext(/^requirements-workflow, step 1: discovery-author/);
  scaffold(out, 'run-discovery-brief.md', 'drafted');
  expectNext(/^requirements-workflow, step 1: discovery-author/);
  acceptDoc(out, 'run-discovery-brief.md');
  expectNext(/^requirements-workflow, step 2: brd-author/);
  scaffold(out, 'run-brd.md', 'drafted'); acceptDoc(out, 'run-brd.md');
  expectNext(/^requirements-workflow, step 3: prd-author/);
  scaffold(out, 'run-prd.md', 'drafted'); acceptDoc(out, 'run-prd.md');
  expectNext(/^glossary-author/);
  scaffold(out, 'glossary/deep-dives/gate-log.md', 'drafted'); acceptDoc(out, 'glossary/deep-dives/gate-log.md');

  // The data model: the things file, then each family's file in the things file's order, then every Glossary change
  // sent to the Glossary together, then the ones it settled brought into the data model.
  expectNext(/^data-model-workflow, step 1: things-author finds the things$/);
  scaffold(out, THINGS, 'Drafted', THINGS_BODY);
  expectNext(/^data-model-workflow, step 1: things-author finds the things$/);
  scaffold(out, THINGS, 'Accepted on 2026-10-19', THINGS_BODY);
  expectNext(/^data-model-workflow, step 2: data-model-author writes books\.md$/);
  scaffold(out, 'glossary/data-models/books.md', 'Accepted on 2026-10-19');
  expectNext(/^data-model-workflow, step 2: data-model-author writes lending\.md$/);
  scaffold(out, 'glossary/data-models/lending.md', 'Drafted');
  decisionsFile(out, ['To raise']);
  expectNext(/^data-model-workflow, step 2: data-model-author writes lending\.md$/);
  scaffold(out, 'glossary/data-models/lending.md', 'Accepted on 2026-10-19, with open decisions');
  expectNext(/^data-model-workflow, step 3: glossary-disposition settles every Glossary change in one run: GC-1$/);
  decisionsFile(out, ['Raised']);
  expectNext(/^data-model-workflow, step 3: glossary-disposition settles every Glossary change in one run: GC-1$/);
  decisionsFile(out, ['Settled in the Glossary on 2026-10-19']);
  expectNext(/^data-model-workflow, step 4: things-author, then data-model-author, bring GC-1 into the data model$/);
  decisionsFile(out, ['Settled in the Glossary on 2026-10-19. Brought into the data model on 2026-10-19']);
  const shown = run('status.ts', ['--project', 'run', '--output', out]).out;
  assert.ok(shown.includes('data-model-workflow\n- 1. Things file: accepted on 2026-10-19\n- 2. books.md: accepted on 2026-10-19\n- 2. lending.md: accepted on 2026-10-19, with open decisions\n- 3. Glossary changes: 1 of 1 settled in the Glossary\n- 4. Settled changes brought into the data model: 1 of 1\n'), shown);
  expectNext(/^features-and-epics-workflow, step 1: feature-author/);
  scaffold(out, 'frd/feature-catalog.md', 'drafted', CATALOG); acceptDoc(out, 'frd/feature-catalog.md');
  expectNext(/^features-and-epics-workflow, step 2: epic-grouping-author writes the EPIC grouping/);
  scaffold(out, 'epics/grouping.md', 'drafted'); acceptDoc(out, 'epics/grouping.md');
  expectNext(/^features-and-epics-workflow, step 3: epic-author copies the EPIC register/);
  scaffold(out, 'epics/register.md', 'drafted', REGISTER); acceptDoc(out, 'epics/register.md');
  expectNext(/^features-and-epics-workflow, step 4: build-sequencing-mapping\.ts/);
  write(path.join(out, 'run', 'epics', 'sequencing.md'), 'x');
  write(path.join(out, 'run', 'epics', 'mapping.md'), 'x');

  // FRDs, in EPIC register order. Each file is named after its capability.
  expectNext(/^frd-workflow, for FRD-1a First$/);
  scaffold(out, 'frd/frd-first.md', 'accepted on 2026-10-19, version 1');
  expectNext(/^frd-workflow, for FRD-1b Second$/);
  // FRD-1b is parked: the next FRD goes ahead, and the parked one comes last.
  scaffold(out, 'frd/frd-second.md', 'parked on 2026-10-19, change 001');
  expectNext(/^frd-workflow, for FRD-2a Third$/);
  scaffold(out, 'frd/frd-third.md', 'accepted on 2026-10-19, version 1');

  // Stories: EPIC-002 waits for the parked FRD-1b, so EPIC-003 goes ahead of it.
  expectNext(/^stories-workflow, for EPIC-001 Alpha$/);
  stories(out, 'EPIC-001-alpha', ['ready', 'groomed']);
  expectNext(/^stories-workflow, for EPIC-001 Alpha$/);
  stories(out, 'EPIC-001-alpha', ['ready', 'ready']);
  expectNext(/^stories-workflow, for EPIC-003 Gamma$/);
  stories(out, 'EPIC-003-gamma', ['ready']);
  // Only EPIC-002 is left, and it waits on FRD-1b: the parked FRD comes back.
  expectNext(/^frd-workflow, for FRD-1b Second, which was parked on 2026-10-19, change 001$/);
  scaffold(out, 'frd/frd-second.md', 'accepted on 2026-10-19, version 1');
  expectNext(/^stories-workflow, for EPIC-002 Beta$/);
  stories(out, 'EPIC-002-beta', ['ready']);
  expectNext(/^nothing to run\./);
});

test('status: the data model\'s files in the kit\'s status line, its Glossary changes, sent together and brought in, and a project with none', () => {
  const out = tempDir('foundation');
  for (const rel of ['run-discovery-brief.md', 'run-brd.md', 'run-prd.md', 'glossary/deep-dives/gate-log.md']) {
    scaffold(out, rel, 'drafted'); acceptDoc(out, rel);
  }
  const shown = (): string => run('status.ts', ['--project', 'run', '--output', out]).out;
  const dataModel = (): string => shown().split('\ndata-model-workflow\n')[1].split('\n\n')[0];
  // Nothing written yet: no file is named, and there is nothing to send or bring in.
  assert.strictEqual(dataModel(), '- 1. Things file: not started\n- 2. Data model files: none named yet\n- 3. Glossary changes: none\n- 4. Settled changes brought into the data model: none');
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 1: things-author finds the things$/);
  // The kit's status line: "drafted", then "accepted on {date}, version {n}", which accept.ts writes.
  scaffold(out, THINGS, 'drafted', THINGS_BODY);
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 1: things-author finds the things$/);
  acceptDoc(out, THINGS);
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 2: data-model-author writes books\.md$/);
  scaffold(out, 'glossary/data-models/books.md', 'drafted');
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 2: data-model-author writes books\.md$/);
  acceptDoc(out, 'glossary/data-models/books.md');
  scaffold(out, 'glossary/data-models/lending.md', 'drafted'); acceptDoc(out, 'glossary/data-models/lending.md');
  assert.strictEqual(dataModel(), '- 1. Things file: accepted on 2026-10-19, version 1\n- 2. books.md: accepted on 2026-10-19, version 1\n- 2. lending.md: accepted on 2026-10-19, version 1\n- 3. Glossary changes: none\n- 4. Settled changes brought into the data model: none');
  // With no decisions file, the data model is done once every file is accepted.
  assert.match(nextOf(out, 'run'), /^features-and-epics-workflow, step 1: feature-author/);
  // The batch: every Glossary change still to send, or sent, is named in one step 3, in order.
  decisionsFile(out, ['Raised', 'To raise']);
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 3: glossary-disposition settles every Glossary change in one run: GC-1, GC-2$/);
  // The marks: step 4 is still to do while a change is settled in the Glossary but not yet brought into the data
  // model. A change left open holds up no step.
  decisionsFile(out, ['Settled in the Glossary on 2026-10-19', 'Left open on 2026-10-19', 'Settled in the Glossary on 2026-10-19. Brought into the data model on 2026-10-20', 'Settled in the Glossary on 2026-10-19']);
  assert.strictEqual(dataModel().split('\n').slice(-2).join('\n'), '- 3. Glossary changes: 3 of 4 settled in the Glossary\n- 4. Settled changes brought into the data model: 1 of 3');
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 4: things-author, then data-model-author, bring GC-1, GC-4 into the data model$/);
  // A change sent while others wait to be brought in: the batch goes first, then step 4.
  decisionsFile(out, ['Settled in the Glossary on 2026-10-19', 'To raise']);
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 3: glossary-disposition settles every Glossary change in one run: GC-2$/);
  decisionsFile(out, ['Settled in the Glossary on 2026-10-19. Brought into the data model on 2026-10-20', 'Left open on 2026-10-21']);
  assert.strictEqual(dataModel().split('\n').slice(-2).join('\n'), '- 3. Glossary changes: 1 of 2 settled in the Glossary\n- 4. Settled changes brought into the data model: 1 of 1');
  assert.match(nextOf(out, 'run'), /^features-and-epics-workflow, step 1: feature-author/);
});

test('status: lists every open data model decision and every open Glossary change, and the skill that asks each one again', () => {
  const out = tempDir('foundation');
  fs.mkdirSync(path.join(out, 'run'), { recursive: true });
  const stillOpen = (): string => run('status.ts', ['--project', 'run', '--output', out]).out.split('\nData model, still open\n')[1].split('\n\n')[0];
  // No decisions file yet: nothing is open.
  assert.strictEqual(stillOpen(), '- None');
  const decision = (id: string, where: string, chosen: string): string => `### ${id} — Question ${id}?\n\n- **Where:** ${where}\n- **Chosen:** ${chosen}\n`;
  const settled = '### DM-4 — Question DM-4?\n\n- **Where:** lending.md · Loan\n- **Chosen:** Keep it\n- **Decided by:** PO, 2026-10-19\n';
  decisionsFile(out, ['To raise', 'Left open on 2026-10-20', 'Raised', 'Left open on 2026-10-20', 'Settled in the Glossary on 2026-10-19'], [
    decision('DM-1', 'run-glossary-things.md · Lending', 'Proposed: Not in the first release'),
    decision('DM-2', 'lending.md · Loan · Remove', 'Proposed: Keep every loan'),
    decision('DM-3', 'books.md · Book · title · Limits', 'open'),
  ]);
  // A settled decision is never listed.
  fs.writeFileSync(path.join(out, DECISIONS_REL), fs.readFileSync(path.join(out, DECISIONS_REL), 'utf8').replace('## Settled\n\nNone yet.\n', `## Settled\n\n${settled}`));
  assert.strictEqual(stillOpen(), [
    '- DM-1 (run-glossary-things.md): Question DM-1? Answered "I don\'t know yet". things-author asks it again first, at its next run.',
    '- DM-2 (lending.md): Question DM-2? Answered "I don\'t know yet". data-model-author asks it again first, at its next run for lending.md.',
    '- DM-3 (books.md): Question DM-3? Not answered yet. data-model-author asks it at its gate for books.md.',
    '- GC-1 (books.md): Word 1. To raise. data-model-workflow, step 3, sends it to the Glossary with the others.',
    '- GC-2 (lending.md): Word 2. Left open on 2026-10-20. data-model-author asks it again first, at its next run for lending.md.',
    '- GC-3 (books.md): Word 3. Raised. glossary-disposition settles it, with the others in its batch.',
    '- GC-4 (lending.md): Word 4. Left open on 2026-10-20. data-model-author asks it again first, at its next run for lending.md.',
  ].join('\n'));
  // A Glossary change raised from the things file, or from a product-wide decision, is things-author's to ask again.
  fs.writeFileSync(path.join(out, DECISIONS_REL), fs.readFileSync(path.join(out, DECISIONS_REL), 'utf8').replace('- **Raised from:** lending.md · Loan\n- **Status:** Left open on 2026-10-20\n\n### GC-3', '- **Raised from:** DM-1, at gate 1\n- **Status:** Left open on 2026-10-20\n\n### GC-3'));
  assert.match(stillOpen(), /^- GC-2 \(run-glossary-things\.md\): Word 2\. Left open on 2026-10-20\. things-author asks it again first, at its next run\.$/m);
});

test('status: under "Next:", the skill that asks again each decision answered "I don\'t know yet" and each Glossary change left open, and when, holding up no step', () => {
  const out = tempDir('foundation');
  upToTheFeatures(out);
  // Nothing open: nothing under "Next:".
  assert.deepStrictEqual(underNext(out), []);
  // DM-1 is product-wide, so things-author asks it. DM-2 and GC-2 are lending.md's, and GC-1 is books.md's, so
  // data-model-author asks them, for each file. DM-3 isn't answered yet: its gate asks it, so it isn't named here.
  decisionsFile(out, ['Left open on 2026-10-20', 'Left open on 2026-10-21'], [
    dmEntry('DM-1', 'run-glossary-things.md · Lending', 'Proposed: Not in the first release'),
    dmEntry('DM-2', 'lending.md · Loan · Remove', 'Proposed: Keep every loan'),
    dmEntry('DM-3', 'books.md · Book · title · Limits', 'open'),
  ]);
  const lines = [
    '- Still open: things-author asks DM-1 again first, at the next run of data-model-workflow. It holds up no other step.',
    '- Still open: data-model-author asks DM-2, GC-2 again first, at the next run of data-model-workflow, for lending.md. It holds up no other step.',
    '- Still open: data-model-author asks GC-1 again first, at the next run of data-model-workflow, for books.md. It holds up no other step.',
  ];
  assert.deepStrictEqual(underNext(out), lines);
  // They hold up no step: the features come next.
  assert.match(nextOf(out, 'run'), /^features-and-epics-workflow, step 1: feature-author/);
  // A Glossary change sent with the next batch: step 3 comes next, and the others are still named under it.
  decisionsFile(out, ['Left open on 2026-10-20', 'To raise'], [
    dmEntry('DM-1', 'run-glossary-things.md · Lending', 'Proposed: Not in the first release'),
    dmEntry('DM-2', 'lending.md · Loan · Remove', 'Proposed: Keep every loan'),
  ]);
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 3: glossary-disposition settles every Glossary change in one run: GC-2$/);
  assert.deepStrictEqual(underNext(out), [lines[0], lines[1].replace('DM-2, GC-2', 'DM-2'), lines[2]]);
  // A Glossary change raised from a product-wide decision is things-author's to ask again.
  decisionsFile(out, ['Left open on 2026-10-20'], [dmEntry('DM-1', 'run-glossary-things.md · Lending', 'Proposed: Not in the first release')]);
  fs.writeFileSync(path.join(out, DECISIONS_REL), fs.readFileSync(path.join(out, DECISIONS_REL), 'utf8').replace('- **Raised from:** books.md · Book', '- **Raised from:** DM-1, at gate 1'));
  assert.deepStrictEqual(underNext(out), ['- Still open: things-author asks DM-1, GC-1 again first, at the next run of data-model-workflow. It holds up no other step.']);
});

test('status: a decision settled while an accepted data model file still shows its "? (DM-n)" is still to do: data-model-author writes the answer in', () => {
  const out = tempDir('foundation');
  upToTheFeatures(out);
  const stillOpen = (): string => run('status.ts', ['--project', 'run', '--output', out]).out.split('\nData model, still open\n')[1].split('\n\n')[0];
  const LOAN = '## Loan\n\n**Actions**\n\n| Action | Step | Who | Rules |\n|---|---|---|---|\n| Make | Lending | ? (DM-1) | – |\n\n**Decisions to make**\n\n| Decision | Question |\n|---|---|\n| DM-1 | Question DM-1? |\n';
  scaffold(out, 'glossary/data-models/lending.md', 'accepted on 2026-10-19, version 1', LOAN);
  // While DM-1 is open, its cell is meant to show "? (DM-1)": things-author asks it again, and nothing waits on it.
  decisionsFile(out, [], [dmEntry('DM-1', 'run-glossary-things.md · Lending', 'Proposed: Not in the first release')]);
  assert.match(nextOf(out, 'run'), /^features-and-epics-workflow, step 1: feature-author/);
  // Settled later, at things-author's gate: lending.md still shows "? (DM-1)", so data-model-author writes the answer in.
  decisionsFile(out, [], [], [dmEntry('DM-1', 'run-glossary-things.md · Lending', 'Not in the first release', 'PO, 2026-10-21')]);
  assert.strictEqual(nextOf(out, 'run'), 'data-model-workflow, picking up: data-model-author writes the settled answer of DM-1 into lending.md, in a change');
  assert.strictEqual(stillOpen(), '- DM-1 (run-glossary-things.md): Question DM-1? Settled, but lending.md still shows "? (DM-1)". data-model-author writes the answer in, in a change, at the next run of data-model-workflow.');
  assert.deepStrictEqual(underNext(out), []);
  // A note that still shows it counts too, and so does a second file.
  scaffold(out, 'glossary/data-models/books.md', 'accepted on 2026-10-19, version 1', '## Book\n\nMoves back to an earlier state: ? (DM-1)\n');
  assert.strictEqual(nextOf(out, 'run'), 'data-model-workflow, picking up: data-model-author writes the settled answer of DM-1 into books.md, in a change');
  assert.match(stillOpen(), /Settled, but books\.md, lending\.md still show "\? \(DM-1\)"\./);
  // It comes before a family still to write.
  scaffold(out, 'glossary/data-models/books.md', 'drafted', '## Book\n\nMoves back to an earlier state: ? (DM-1)\n');
  assert.strictEqual(nextOf(out, 'run'), 'data-model-workflow, picking up: data-model-author writes the settled answer of DM-1 into lending.md, in a change');
  scaffold(out, 'glossary/data-models/books.md', 'accepted on 2026-10-19, version 2');
  // Once the answer is written in, the data model is in step, and the features come next.
  scaffold(out, 'glossary/data-models/lending.md', 'accepted on 2026-10-19, version 2', LOAN.replace('? (DM-1)', 'Member').replace(/\n\*\*Decisions to make\*\*[\s\S]*$/, ''));
  assert.strictEqual(stillOpen(), '- None');
  assert.match(nextOf(out, 'run'), /^features-and-epics-workflow, step 1: feature-author/);
});

test('status: an accepted FRD that waits on a data model answer now settled is listed, and frd-author brings the answer forward', () => {
  const out = tempDir('foundation');
  upToTheFrds(out);
  const frds = (): string => run('status.ts', ['--project', 'run', '--output', out]).out.split('\nfrd-workflow, in EPIC register order\n')[1].split('\n\n')[0];
  const ACCEPTED = 'accepted on 2026-10-19, version 1';
  // FRD-1a's coverage row waits on DM-1. FRD-2a's copy of the data model shows "? (GC-1)".
  scaffold(out, 'frd/frd-first.md', ACCEPTED, '| Data model | Proved by |\n|---|---|\n| lending.md, Loan, Make | waits on DM-1 |\n');
  scaffold(out, 'frd/frd-second.md', ACCEPTED);
  scaffold(out, 'frd/frd-third.md', ACCEPTED, '| Field | Type |\n|---|---|\n| shelf | ? (GC-1) |\n');
  const open = [dmEntry('DM-1', 'run-glossary-things.md · Lending', 'Proposed: Not in the first release')];
  const settled = [dmEntry('DM-1', 'run-glossary-things.md · Lending', 'Not in the first release', 'PO, 2026-10-21')];
  // While DM-1 is open and GC-1 waits on the Glossary, the FRDs rightly wait: nothing is listed.
  decisionsFile(out, ['Raised'], open);
  const plain = '- FRD-1a First: accepted on 2026-10-19, version 1\n- FRD-1b Second: accepted on 2026-10-19, version 1\n- FRD-2a Third: accepted on 2026-10-19, version 1';
  assert.strictEqual(frds(), plain);
  // DM-1 is settled: FRD-1a gets its own line, and frd-author is next, before the stories.
  decisionsFile(out, ['Settled in the Glossary on 2026-10-20'], [], settled);
  const first = '- FRD-1a First waits on DM-1, which is settled now. frd-author runs again for it, writes the rule from the answer, and holds its gate again.';
  assert.strictEqual(frds(), plain.replace('version 1\n- FRD-1b', `version 1\n${first}\n- FRD-1b`));
  // GC-1 is settled in the Glossary, but not yet brought into the data model: step 4 comes first, and FRD-2a waits.
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 4: things-author, then data-model-author, bring GC-1 into the data model$/);
  // GC-1 brought into the data model: FRD-2a gets its line too. The FRDs' order decides which comes first.
  decisionsFile(out, ['Settled in the Glossary on 2026-10-20. Brought into the data model on 2026-10-21'], [], settled);
  assert.ok(frds().endsWith('- FRD-2a Third: accepted on 2026-10-19, version 1\n- FRD-2a Third waits on GC-1, which is settled now. frd-author runs again for it, writes the rule from the answer, and holds its gate again.'), frds());
  assert.strictEqual(nextOf(out, 'run'), 'frd-author, for FRD-1a First: it brings in the settled answer of DM-1, and holds its gate again');
  // frd-author runs again: the FRD is drafted, so it is simply the next FRD to write. A drafted FRD gets no line of its own.
  scaffold(out, 'frd/frd-first.md', 'drafted', '| Data model | Proved by |\n|---|---|\n| lending.md, Loan, Make | waits on DM-1 |\n');
  assert.strictEqual(nextOf(out, 'run'), 'frd-workflow, for FRD-1a First');
  assert.ok(!frds().includes('FRD-1a First waits on'), frds());
  // Accepted again, with the rule written from the answer: FRD-2a is next.
  scaffold(out, 'frd/frd-first.md', 'accepted on 2026-10-22, version 2', '| Data model | Proved by |\n|---|---|\n| lending.md, Loan, Make | F-01.1 |\n');
  assert.strictEqual(nextOf(out, 'run'), 'frd-author, for FRD-2a Third: it brings in the settled answer of GC-1, and holds its gate again');
  scaffold(out, 'frd/frd-third.md', 'accepted on 2026-10-22, version 2');
  assert.strictEqual(frds(), '- FRD-1a First: accepted on 2026-10-22, version 2\n- FRD-1b Second: accepted on 2026-10-19, version 1\n- FRD-2a Third: accepted on 2026-10-22, version 2');
  assert.match(nextOf(out, 'run'), /^stories-workflow, for EPIC-001 Alpha$/);
});

test('status: a things file that names its data model files without a link is read as check-data-model.ts reads it', () => {
  const out = tempDir('foundation');
  for (const rel of ['run-discovery-brief.md', 'run-brd.md', 'run-prd.md', 'glossary/deep-dives/gate-log.md']) {
    scaffold(out, rel, 'drafted'); acceptDoc(out, rel);
  }
  scaffold(out, THINGS, 'accepted on 2026-10-19, version 1', '## Books\n\nData model file: books.md\n\n## Lending\n\nData model file: `lending.md`\n');
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 2: data-model-author writes books\.md$/);
  scaffold(out, 'glossary/data-models/books.md', 'accepted on 2026-10-19, version 1');
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 2: data-model-author writes lending\.md$/);
  assert.match(run('status.ts', ['--project', 'run', '--output', out]).out, /\n- 2\. books\.md: accepted on 2026-10-19, version 1\n- 2\. lending\.md: not started\n/);
});

test('status: a data model file drafted again in a change comes before the FRDs and the stories, since it is never parked', () => {
  const out = tempDir('foundation');
  upToTheFrds(out);
  for (const f of ['frd-first', 'frd-second', 'frd-third']) scaffold(out, `frd/${f}.md`, 'accepted on 2026-10-19, version 1');
  assert.match(nextOf(out, 'run'), /^stories-workflow, for EPIC-001 Alpha$/);
  scaffold(out, 'glossary/data-models/lending.md', 'drafted');
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 2: data-model-author writes lending\.md$/);
  scaffold(out, 'glossary/data-models/lending.md', 'accepted on 2026-10-19, version 2');
  // The things file, drafted again, comes first of all.
  scaffold(out, THINGS, 'drafted', THINGS_BODY);
  assert.match(nextOf(out, 'run'), /^data-model-workflow, step 1: things-author finds the things$/);
});

test('status: an EPIC that depends on a parked EPIC waits, and the parked EPIC comes back last', () => {
  const out = tempDir('foundation');
  upToTheFrds(out);
  for (const f of ['frd-first', 'frd-second', 'frd-third']) scaffold(out, `frd/${f}.md`, 'accepted on 2026-10-19, version 1');

  stories(out, 'EPIC-001-alpha', ['drafted'], 'parked on 2026-10-19, change 002');
  assert.match(nextOf(out, 'run'), /^stories-workflow, for EPIC-003 Gamma$/);
  stories(out, 'EPIC-003-gamma', ['ready']);
  assert.match(nextOf(out, 'run'), /^stories-workflow, for EPIC-001 Alpha, which was parked on 2026-10-19, change 002$/);
});

// ---------------------------------------------------------------- scaffold-project

test('scaffold-project: a new project gets only the folders every project needs, and is told where its files go', () => {
  const out = tempDir('foundation');
  const r = run('scaffold-project.ts', ['--project', 'fresh', '--output', out]);
  assert.strictEqual(r.code, 0, r.err);
  for (const f of ['sources', 'glossary', 'glossary/deep-dives', 'glossary/data-models', 'frd', 'epics']) {
    assert.ok(fs.existsSync(path.join(out, 'fresh', f)), `${f}/ wasn't created`);
  }
  for (const f of ['design', 'changes', 'version-log', 'stories', 'discovery', 'brd', 'prd', 'features']) {
    assert.ok(!fs.existsSync(path.join(out, 'fresh', f)), `${f}/ was created, but isn't needed yet`);
  }
  assert.match(r.out, /Next: put your requirement files in .*sources, then run requirements-workflow\./);
});

test('scaffold-project: with no output given, the project lands in Output/<project>/ in the folder you work from', () => {
  const work = tempDir('foundation');
  const r = run('scaffold-project.ts', ['--project', 'fresh'], { env: {}, cwd: work });
  assert.strictEqual(r.code, 0, r.err);
  assert.ok(fs.existsSync(path.join(work, 'Output', 'fresh', 'sources')));
});

test('scaffold-project: running it again creates nothing, and a piece gets its own folder only when named', () => {
  const out = tempDir('foundation');
  run('scaffold-project.ts', ['--project', 'fresh', '--output', out]);
  let r = run('scaffold-project.ts', ['--project', 'fresh', '--output', out]);
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /Every folder is already there\. Nothing was created\./);
  // A family's data model file sits straight in glossary/data-models/, so naming a family creates no folder.
  r = run('scaffold-project.ts', ['--project', 'fresh', '--epic', 'EPIC-002-claim-approval', '--section', 'claim-approval', '--change', '001-receipt-limit', '--family', 'lending', '--output', out]);
  assert.ok(r.out.includes('Created:\n- changes/\n- changes/001-receipt-limit/\n- epics/EPIC-002-claim-approval/\n- glossary/deep-dives/claim-approval/\nAlready there:\n'), r.out);
});

test('scaffold-project: an existing project keeps every file, and only missing folders are added', () => {
  const out = slice();
  const frd = path.join(out, 'mcp-slice', 'frd', 'frd-team-and-roles.md');
  const before = readText(frd);
  const r = run('scaffold-project.ts', ['--project', 'mcp-slice', '--output', out]);
  assert.strictEqual(r.code, 0, r.err);
  const created = r.out.split('Already there:')[0];
  const already = r.out.split('Already there:')[1] || '';
  assert.ok(created.includes('- glossary/\n'), r.out);
  assert.ok(already.includes('- frd/\n') && already.includes('- epics/\n'), r.out);
  assert.strictEqual(readText(frd), before);
  assert.doesNotMatch(r.out, /Next: put your requirement files/);
});

test('scaffold-project: a project\'s own documents at the top of its folder are known', () => {
  const out = tempDir('foundation');
  write(path.join(out, 'fresh', 'fresh-brd.md'), '# BRD — Fresh\n');
  write(path.join(out, 'fresh', 'traceability-map.json'), '{}');
  assert.strictEqual(run('scaffold-project.ts', ['--project', 'fresh', '--output', out]).code, 0);
});

test('scaffold-project: a folder holding older work is left alone, and nothing is created', () => {
  const out = tempDir('foundation');
  write(path.join(out, 'old', '05-epics', 'EPIC-001.md'), 'x');
  const r = run('scaffold-project.ts', ['--project', 'old', '--output', out]);
  assert.strictEqual(r.code, 1);
  assert.ok(r.out.includes('already holds things this layout doesn\'t know:\n- 05-epics\n'), r.out);
  assert.deepStrictEqual(fs.readdirSync(path.join(out, 'old')), ['05-epics']);
});

test('scaffold-project: no project name exits with code 2', () => {
  assert.strictEqual(run('scaffold-project.ts', []).code, 2);
});

// ---------------------------------------------------------------- where every file lives

test('every file and folder in the kit has its place in the master plan\'s folder layout', () => {
  // master-plan.md section 2 is the only place that decides where a file lives. This reads its tree, and fails on
  // anything in the kit's folder it doesn't name: at the top, in .claude/, in the shared rules, in tools/, in the tests
  // and in fixtures/. Programs, tests and skill folders are named by pattern, so only something else is checked there.
  // Git's own folder, .git/, and its .gitignore belong to the repository, not to the kit, so the plan never names them.
  const notTheKits = ['.git', '.gitignore'];
  const plan = readText(path.join(KIT, 'master-plan.md'));
  const tree = plan.slice(plan.indexOf('**The specifier itself.**'), plan.indexOf('**When the build ends**')).split('\n').filter((l) => /^\s*- `/.test(l));
  assert.ok(tree.length > 10, 'the folder layout in master-plan.md section 2 is missing');
  const listed = new Set<string>();
  const stack: string[] = [];
  for (const l of tree) {
    const depth = l.match(/^\s*/)![0].length / 2;
    stack.length = depth;
    stack.push(l.match(/`([^`]+)`/)![1].replace(/\/$/, ''));
    listed.add(stack.slice(1).join('/'));
  }
  const byPattern: Record<string, (e: string, isDir: boolean) => boolean> = { '.claude/skills': (e, dir) => dir, tools: (e) => e.endsWith('.ts'), 'tools/tests': (e) => e.endsWith('.test.ts') };
  const found: string[] = [];
  for (const dir of ['', '.claude', '.claude/skills', '.claude/skills/_shared', 'tools', 'tools/tests', 'fixtures']) {
    for (const e of fs.readdirSync(path.join(KIT, dir))) {
      const rel = dir ? `${dir}/${e}` : e;
      const isDir = fs.statSync(path.join(KIT, rel)).isDirectory();
      if (notTheKits.includes(rel) || listed.has(rel) || (byPattern[dir] && byPattern[dir](e, isDir))) continue;
      found.push(`${rel}${isDir ? '/' : ''}`);
    }
  }
  assert.deepStrictEqual(found, []);
});

// ---------------------------------------------------------------- a run on the slice

test('a run on the slice: accepting a document saves a numbered copy, rebuilds the map, and status reports it', () => {
  const out = slice();
  const r = accept(out, 'mcp-slice', 'frd', ['--capability', 'team-and-roles']);
  assert.strictEqual(r.code, 0, r.err);
  assert.ok(fs.existsSync(path.join(out, 'mcp-slice', 'version-log', 'frd', 'frd-team-and-roles', 'v1.md')));
  const map = JSON.parse(fs.readFileSync(path.join(out, 'mcp-slice', 'traceability-map.json'), 'utf8')) as TraceabilityMap;
  assert.strictEqual(map.items.filter((i) => i.type === 'rule').length, 19);
  acceptSlice(out);
  const s = run('status.ts', ['--project', 'mcp-slice', '--output', out]);
  assert.strictEqual(s.code, 0, s.err);
  assert.match(s.out, /- 3\. PRD: accepted on 2026-10-19, version 1/);
  assert.match(s.out, /- 1\. Feature catalog: accepted on 2026-10-19, version 1/);
  assert.match(s.out, /- 2\. EPIC grouping: not started/);
  assert.match(s.out, /- FRD-3a Team & roles: accepted on 2026-10-19, version 2/);
  assert.match(s.out, /- FRD-3b Source management: not started/);
  assert.match(s.out, /- EPIC-003 Source & Team Setup: drafted \(0 of 12 stories ready\)/);
  assert.match(s.out, /^Next: requirements-workflow, step 1: discovery-author/m);
});

// ---------------------------------------------------------------- report

report();
