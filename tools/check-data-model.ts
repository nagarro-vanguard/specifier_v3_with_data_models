// check-data-model.ts — checks the data model before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-data-model.ts --project <p>                     the things file, at things-author's gate
//   node tools/check-data-model.ts --project <p> --family <family>   one data model file, at data-model-author's gate.
//                                                                     <family> is its file name, such as lending.
//
// Exports:
//   check(project, family, opts)   every check on the things file, or on one family's file, and on the decisions file
//   glossaryOf(project, opts)      what the Glossary's four term pages say: terms, families, roles, steps, value sets
//
// The decisions file is checked in both, as a whole, because every gate of the data model writes to it. accept.ts
// saves a copy of it each time it accepts the things file or a data model file. Its checks start "Decisions file".
// The files are read through lib/data-model.ts, and the Glossary's four term pages are read here.
//
// The checks of data-model-design.md, step 7. Each check's name starts with its number there.
//   1. The things file covers the Glossary: every thing is a Glossary term, in its Glossary family, and every word
//      left out is one. Every family is a Glossary family, in the Glossary's order, and names its data model file
//      once, named after the family. Every Glossary object with nothing above it is a thing, left out, or waiting on
//      the Glossary.
//   2. Every thing of this family has its part, in the things file's order, and each "Adds to" part adds to a thing
//      of an earlier family. "Things and their fields" has one row per part, listing its rules table's fields, in
//      order. Each Glossary value set of this family that belongs to a thing shows as one of its fields.
//   3. Every thing has all its parts, in the template's order, with the template's columns.
//   4. Every cell holds an answer, "–", "? ({ID})", or an answer marked "Proposed (needs confirmation)" with its
//      question's number. That question is in the Question log, and still open. Each rules table cell holds one of
//      the answers its column allows, as data-model-design.md, step 4, lists them.
//   5. Every "? (DM-n)" is an open decision in the decisions file, with a row in its thing's "Decisions to make". Every
//      "? (GC-n)" is a Glossary change the Glossary hasn't settled, with a row in "Waiting on the Glossary". Every open
//      decision for the file has a "?", even one answered "I don't know yet", and so does every product-wide decision
//      still open. The things file lists every product-wide decision still open. Each row of "Decisions to make" gives
//      the question, the recommended answer and why, as the decisions file has them.
//   6. Nothing says "assumed".
//   7. No answer cites a source. An answer not yet confirmed names only its question.
//   8. Every thing and definition matches the Glossary word for word. Every "In step" is a Glossary step. Every value
//      of a Glossary value set that belongs to a thing is a choice of its field. Every move and every state is a
//      choice of the field that moves, and "Starts as" is where the first move from Start goes.
//   9. Every "Who" is a Glossary role, "the product", "? ({ID})", or "–" for an action that is never allowed.
//  10. Every "kind of" line matches the things file, and every thing the Glossary makes one kind of another is in its
//      family's "Kind of" list.
//  11. Every thing has an action that makes it, and a Remove row. It has Browse and Open rows, unless the Glossary
//      makes it part of another thing.
//
// The kit's checks, as every check program runs them:
//   - the opening: the title, then the kit's status line, "Status: drafted" until accept.ts sets it, and no opening
//     note. The data model's files also have a "Next step" line.
//   - the template's sections, in order, with the Check record last
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - simple writing, through check-document.ts. A definition is copied word for word from the Glossary, so it is
//     never a finding here: "For the person" shows what it would flag, for a Glossary change.
//   - no retired Glossary word is used, through lib/scan-retired-words.ts. Text copied exactly from the Glossary is
//     skipped: each definition that is its Glossary definition, word for word. So is a retired word that the
//     template's own form uses, such as "decision" in the decisions file, because the kit's words are never the
//     product's.
//   - one requirement per row, to look at only, through lib/one-per-row.ts: each action's name, and each sentence of
//     its rules. It is never a finding.
//
// The decisions file's own checks: its opening and sections; each entry under its part, with its parts in order, at
// least 2 real options and "I don't know yet", a recommendation that is one of them, how it is asked, and its choice
// or status; and IDs that run from 1 with no gaps, one entry for each. A Glossary change's status is "To raise",
// "Raised", "Left open on {date}" or "Settled in the Glossary on {date}", which gets ". Brought into the data model on
// {date}" once the data model is in step.
//
// What only a person can judge is listed at the end of "For the person".
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the things file, the data model file
// named, the decisions file, a Glossary page or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, textOption, today, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { KIT_ROOT, LayoutError, pathOf, readText, slug, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, headings, list, normalize, type Cell } from './lib/md-tables.ts';
import {
  load, opening, sections as templateSections, placeholders, rendering, simpleWriting, questions, report,
} from './lib/check-document.ts';
import { retiredWords, currentTerms, scan } from './lib/scan-retired-words.ts';
import {
  load as loadDataModel, cell, typeOf, moveName, things as thingsOf, decisionsOf, fileOfWhere,
  type DataModel, type DataModelFile, type Family, type ThingsFile, type Decision,
} from './lib/data-model.ts';
import { check as onePerRow, notices as onePerRowNotices } from './lib/one-per-row.ts';
import { plural, escapeRegExp } from './lib/text.ts';
import type { Check, CheckResult, LoadedDocument } from './lib/types.ts';
import type { Graded, Question } from './grade-questions.ts';

const NOT_CHECKED = [
  'every Glossary word that becomes a field or a choice is on its thing (checks 1 and 2)',
  'nothing was added that the sources don\'t name, and every answer is what the sources state or plainly follows from them (check 6)',
  'every Glossary flow or relationship row that involves the family shows in the file, beyond its "kind of" lines (check 10)',
  'every thing has a row for changing it (check 11)',
  'every word for a person, a thing, a step, a state or a value is the Glossary\'s, beyond the retired words (check 8)',
  'each gap went where "Where each gap goes" sends its kind',
] as const;

// The answers each column of a rules table allows (data-model-design.md, step 4).
const BASE_TYPES = ['text', 'number', 'date', 'yes or no', 'one of', 'one or more of', 'file', 'a street address', 'a web address', 'an email address'] as const;
const COLUMNS = {
  actions: ['Action', 'In step', 'Who', 'Rules'],
  fields: ['Field', 'Type', 'Required', 'Limits', 'Can two share it', 'Can change', 'Starts as'],
  moves: ['From', 'To', 'When', 'Who'],
  decisions: ['Decision', 'Question', 'Recommended', 'Why'],
  waitingOnGlossary: ['Change', 'What the Glossary needs', 'Proposed'],
} as const;
// The order of a part's tables (the template's order).
const PART_ORDER = ['actions', 'fields', 'moves', 'states', 'decisions', 'waitingOnGlossary'] as const;
// The bold line each table sits under. The moves table's is "How {field} moves".
const TABLE_LABELS = { actions: 'Actions', decisions: 'Decisions to make', waitingOnGlossary: 'Waiting on the Glossary' } as const;
// A Glossary change the Glossary has settled: nothing waits on it any more.
const SETTLED = ['settled', 'brought in'] as const;
const DATE_RE = '\\d{4}-\\d{2}-\\d{2}';
const GC_STATUS = new RegExp(`^(To raise|Raised|Left open on ${DATE_RE}|Settled in the Glossary on ${DATE_RE}(\\. Brought into the data model on ${DATE_RE})?)$`);
const ANSWER_TABLES = ['actions', 'fields', 'moves', 'states'] as const;
const PROPOSED = /Proposed \(needs confirmation\)/;
const NONE = /^[–-]$/;
// The Glossary pages a term is read from, and the kind of term each holds.
const TERM_PAGES = [['object-terms', 'object'], ['role-terms', 'role'], ['step-terms', 'step'], ['states-and-values', 'state']] as const;
// The sections of a Glossary page that hold no terms.
const NOT_TERMS = ['how to read this page', 'terms replaced or retired over time', 'related pages', 'families at a glance', 'contents'] as const;
// The tail of the things file, after the families, in its order.
const THINGS_TAIL = ['Decisions to make', 'Waiting on the Glossary', 'Check record'] as const;
// The parts of each kind of entry in the decisions file, in the template's order, and the kind of ID it holds.
const ENTRY_PARTS: Record<string, readonly string[]> = {
  open: ['Where', "Why I'm asking", 'Options', 'Recommended', 'How it is asked', 'Chosen'],
  settled: ['Where', "Why I'm asking", 'Options', 'Recommended', 'Chosen', 'Decided by'],
  'glossary changes': ['The Glossary says', 'What is needed', 'Proposed', 'Raised from', 'Status'],
};
const ENTRY_KIND: Record<string, string> = { open: 'DM', settled: 'DM', 'glossary changes': 'GC' };
const DECISION_SECTIONS = ['Open', 'Settled', 'Glossary changes'] as const;
// A citation, in the forms of conventions.md, "Cite every specific". "One provider per project" cites nothing.
const CITES: readonly (readonly [RegExp, string])[] = [
  [/\bper (?:the |your )?(?:BRD|PRD|Glossary|decision|[A-Z]+-\d|[\w-]+\.(?:md|docx|pdf|xlsx|txt)\b)/i, '"per" and a document'],
  [/\b(?:REQ|BR|NFR|TR)-\d/, 'a requirement\'s ID'],
  [/\bD-\d+\b/, 'a Glossary decision'],
  [/\bDecision \d+\b/, 'a decision'],
  [/\bsection \d/i, 'a section'],
];

type TermKind = (typeof TERM_PAGES)[number][1];
type Cells = Record<string, Cell>;
type Things = ReturnType<typeof thingsOf>;
type ThingOf = Things extends Map<string, infer T> ? T : never;
type Part = DataModelFile['parts'][number];
type Decisions = ReturnType<typeof decisionsOf>;

interface GlossaryTerm {
  name: string;
  kind: TermKind;
  definition: string;
  family: string;
  // "kind of", "part of" or "shown when opened", from the column that ties it to the term above
  relation: string | null;
  parent: string | null;
}

interface ValueSet {
  name: string;
  definition: string;
  belongsTo: string;
  values: string[];
  family: string;
}

export interface Glossary {
  terms: GlossaryTerm[];
  families: string[];
  roles: string[];
  steps: string[];
  valueSets: ValueSet[];
}

interface Section {
  text: string;
  line: number;
}

// What the things file's checks, or one family's, give back to check().
interface FileResult {
  doc: LoadedDocument;
  checks: Check[];
  // Each Glossary definition copied word for word, which simple writing and the retired words skip.
  copies: string[];
  holds: string[];
  notices: string[];
  template: string;
}

// One family's data model file, and what its checks read.
interface FamilyContext {
  doc: LoadedDocument;
  text: string;
  things: ThingsFile;
  fam: DataModelFile;
  famEntry: Family;
  own: string[];
  // Each thing of an earlier family, with its family.
  earlier: Map<string, Family>;
  allThings: Map<string, { family: Family; definition: string }>;
  byName: Map<string, GlossaryTerm>;
  whole: Things;
  parts: Part[];
  glossary: Glossary;
  dec: Decisions;
  graded: Graded;
}

// The definitions a file holds: the ones that differ from their source, and the ones copied word for word.
interface Definitions {
  findings: string[];
  copies: string[];
}

// ---------------------------------------------------------------- small helpers

// A cell as one line: its items, each trimmed, joined by a space.
const cellLine = (c: Cell | null | undefined): string => list(c).map((x) => String(x).trim()).filter(Boolean).join(' ');
const plain = (s: string | null | undefined): string => String(s || '').replace(/\*\*/g, '').trim();
const linkText = (s: string | null | undefined): string => String(s || '').replace(/<a\s[^>]*>\s*<\/a>/gi, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
const blank = (s: string): string => ' '.repeat(s.length);
const isOneOf = (items: readonly string[], x: string): boolean => items.includes(x);

// The level-2 headings of a text, outside code.
const sectionsOf = (t: string): Section[] => headings(t).filter((h) => h.level === 2).map((h) => ({ text: h.text, line: h.line + 1 }));

// What a level-2 section holds, up to the next level-2 heading.
const sectionText = (t: string, heading: string): string => (t.split(new RegExp(`^## ${escapeRegExp(heading)}[ \\t]*$`, 'm'))[1] || '').split(/^## /m)[0];

function termsByName(glossary: Glossary): Map<string, GlossaryTerm> {
  const byName = new Map<string, GlossaryTerm>();
  for (const term of glossary.terms) if (!byName.has(term.name)) byName.set(term.name, term);
  return byName;
}

// ---------------------------------------------------------------- the Glossary

// Every table in a text, with the level-2 heading it sits under.
function tables(t: string): { section: string; rows: Cells[] }[] {
  const out: { section: string; rows: Cells[] }[] = [];
  let section = '';
  let fence = false;
  const lines = t.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) { fence = !fence; continue; }
    if (fence) continue;
    const h = lines[i].match(/^##\s+(.+?)\s*$/);
    if (h) { section = h[1]; continue; }
    if (!/^\s*\|/.test(lines[i])) continue;
    const start = i;
    while (i + 1 < lines.length && /^\s*\|/.test(lines[i + 1])) i++;
    const rows = (tableUnder(`# table\n${lines.slice(start, i + 1).join('\n')}`, 'table') || []).map(({ _heading, ...r }) => r);
    out.push({ section, rows });
  }
  return out;
}

function glossaryPage(project: string, name: string, opts: PathOptions): string {
  const f = pathOf(project, name, {}, opts);
  if (!fs.existsSync(f)) throw new LayoutError(`The Glossary page isn't there: ${f}`);
  return readText(f);
}

function valueSetOf(r: Cells, family: string): ValueSet {
  const values = list(r.Values).map((v) => plain(v)).filter((v) => v && !NONE.test(v));
  return { name: linkText(cellLine(r['Value-set'])), definition: cellLine(r['What it is']), belongsTo: linkText(cellLine(r['Belongs to'])), values, family };
}

function termOf(r: Cells, kind: TermKind, ownFamily: string): GlossaryTerm {
  const relCell = linkText(cellLine(r['Relationship to the term above'] || r['Sits under'] || ''));
  const rel = relCell.match(/^(?:a |an )?(kind of|part of)\s+(?:a |an |the )?(.+)$/i);
  const shown = relCell.match(/^shown when (?:a |an |the )?(.+?) is opened$/i);
  const family = linkText(cellLine(r['Home family'] || '')) || ownFamily;
  return { name: linkText(cellLine(r.Term)), kind, definition: cellLine(r['What it is']), family, relation: rel ? rel[1].toLowerCase() : shown ? 'shown when opened' : null, parent: rel ? rel[2].trim() : shown ? shown[1].trim() : null };
}

// What the Glossary's four term pages say. A page with no families, such as a small sample, gives terms with no
// family.
export function glossaryOf(project: string, opts: PathOptions): Glossary {
  const out: Glossary = { terms: [], families: [], roles: [], steps: [], valueSets: [] };
  for (const [name, kind] of TERM_PAGES) {
    const t = glossaryPage(project, name, opts);
    for (const tb of tables(t)) {
      const section = normalize(tb.section.replace(/\s*\(.*\)\s*$/, ''));
      // The objects page's "Families at a glance" table names every family, in the Glossary's order.
      if (kind === 'object' && section === 'families at a glance') out.families.push(...tb.rows.map((r) => linkText(cellLine(r.Family))).filter(Boolean));
      if (isOneOf(NOT_TERMS, section)) continue;
      for (const r of tb.rows) {
        const own = normalize(tb.section) === 'the terms' ? '' : tb.section;
        if ('Value-set' in r) {
          out.valueSets.push(valueSetOf(r, own));
          continue;
        }
        if (!('Term' in r)) continue;
        const term = termOf(r, kind, own);
        if (!term.name) continue;
        out.terms.push(term);
        if (kind === 'role') out.roles.push(term.name);
        if (kind === 'step') out.steps.push(term.name);
      }
    }
  }
  if (!out.families.length) {
    for (const t of out.terms.filter((x) => x.kind === 'object' && x.family)) if (!out.families.includes(t.family)) out.families.push(t.family);
  }
  return out;
}

// ---------------------------------------------------------------- shared checks

// The kit's opening: the title, then the status line, and no opening note. The status line is the kit's.
function kitOpening(doc: LoadedDocument, titleStart: string): string[] {
  const f = opening(doc.text);
  const first = doc.text.split('\n').find((l) => l.trim());
  if (!first || !first.startsWith(`# ${titleStart}`)) f.push(`The title should start "${titleStart}".`);
  if (/^Status: /m.test(doc.text) && !doc.status) f.push(`The status line reads "${(doc.text.match(/^Status: (.*)$/m) || [])[1]}". Write the kit's status line: "Status: drafted". accept.ts sets it to "accepted on" a date and a version.`);
  const lines = doc.text.split('\n').filter((l) => l.trim());
  if (/^Status: /m.test(doc.text) && lines[1] && !/^Status: /.test(lines[1])) f.push('The status line should come straight after the title.');
  return f;
}

function nextStep(doc: LoadedDocument): string[] {
  const m = doc.text.match(/^Next step:[ \t]*(.*?)[ \t]*$/m);
  if (!m || !m[1]) return ['There is no "Next step" line under the status line.'];
  if (doc.status === 'accepted' && !/^None\b/.test(m[1])) return [`The file is accepted, so its "Next step" line should start "None".`];
  return [];
}

function checkRecord(sections: Section[]): string[] {
  const f: string[] = [];
  const last = sections[sections.length - 1];
  if (!sections.some((s) => s.text === 'Check record')) f.push('The section "Check record" is missing.');
  else if (last.text !== 'Check record') f.push('The section "Check record" should be the last one.');
  if (sections.some((s) => s.text === 'Placeholders')) f.push('The document carries the template\'s Placeholders section, which is never copied in.');
  return f;
}

// The Question log's questions, by number, or null when there is no log yet.
function questionsOf(graded: Graded | null): Map<number | null, Question> | null {
  if (!graded || !graded.questions || !graded.questions.length) return null;
  return new Map(graded.questions.filter((q) => q.n !== null).map((q) => [q.n, q]));
}

const withoutCopies = (t: string, copies: string[]): string => copies.reduce((own, c) => own.split(c).join(blank(c)), t);

// Simple writing, with each Glossary copy blanked so it is never a finding. What a copy would flag is shown, to look at.
function writing(t: string, copies: string[], project: string, opts: PathOptions, name: string): { findings: string[]; notices: string[] } {
  const w = simpleWriting(withoutCopies(t, copies), { project, output: opts.output });
  const notices = [...w.notices];
  const inCopies = copies.length ? simpleWriting(copies.join('\n'), { project, output: opts.output }).findings : [];
  if (inCopies.length) notices.push(`Simple writing in a Glossary definition, copied word for word into ${name}: ${plural(inCopies.length, 'place')}. Each one belongs to the Glossary, as a Glossary change.`);
  return { findings: w.findings, notices };
}

// The kit's own words: the text of the template's form, above its Placeholders part, and the "What to write" column of
// its labels, without placeholders. Its examples are left out, because they are a product's words. A product's
// Glossary may retire one of the kit's words, such as "decision" or "sources", and the kit's words are never the
// product's.
function kitWords(template: string): string {
  const file = path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'templates', `${template}.md`);
  const [form, rest] = readText(file).split(/^## Placeholders[ \t]*$/m);
  const guidance = (tableUnder(rest || '', 'What to write for each label') || []).map((r) => list(r['What to write']).join(' '));
  return [form, ...guidance].join('\n').replace(/\{[^}\n]*\}/g, ' ');
}

function retired(t: string, copies: string[], project: string, opts: PathOptions, template: string): string[] {
  const own = withoutCopies(t, copies);
  const kit = kitWords(template);
  const isKit = (w: string) => new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(w)}(?:s|es)?(?![A-Za-z0-9])`, 'i').test(kit);
  return scan(own, retiredWords(project, opts), currentTerms(project, opts), template)
    .filter((h) => !isKit(h.earlier))
    .map((h) => `Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`);
}

// A row of "Decisions to make" gives the question, the recommended answer and why, as the decisions file has them.
function sameAsRegister(id: string, row: Cells, e: Decision): string[] {
  const f: string[] = [];
  if (cellLine(row.Question) !== e.question) f.push(`${id}: its question isn't the decisions file's, word for word.`);
  if (e.recommended && cellLine(row.Recommended) !== e.recommended) f.push(`${id}: its recommended answer isn't the decisions file's, word for word.`);
  if (e.reason && cellLine(row.Why) !== e.reason) f.push(`${id}: its "Why" isn't the reason the decisions file gives, word for word.`);
  return f;
}

// ---------------------------------------------------------------- the decisions file

function decisionOptionFindings(at: string, e: Decision): string[] {
  const f: string[] = [];
  const real = e.options.filter((o) => !/^I don't know yet$/i.test(o.label));
  if (real.length < 2) f.push(`${at} offers ${real.length} real ${real.length === 1 ? 'option' : 'options'}. It needs at least 2, then "I don't know yet".`);
  if (!e.options.length || !/^I don't know yet$/i.test(e.options[e.options.length - 1].label)) f.push(`${at}: its last option should be "I don't know yet".`);
  for (const o of real) if (/^(yes|no)\b[.!]?$/i.test(o.label)) f.push(`${at}: the option "${o.label}" should be a real answer, never "yes" or "no".`);
  if (e.recommended && !real.some((o) => o.label === e.recommended)) f.push(`${at}: its recommendation, "${e.recommended}", isn't one of its options, word for word.`);
  if (e.section === 'open') {
    if (!/^(One at a time|Settled together)$/.test(e.fields['How it is asked'] || '')) f.push(`${at}: "How it is asked" should be "One at a time" or "Settled together".`);
    if (e.chosen !== null && !/^open$/i.test(e.chosen) && !e.proposed) f.push(`${at} is open, so "Chosen" should read "open", or "Proposed:" and the answer in use.`);
  } else {
    if (e.chosen !== null && !real.some((o) => o.label === e.chosen) && !/^Other: \S/.test(e.chosen)) f.push(`${at}: its choice, "${e.chosen}", should be one of its options, word for word, or "Other:" and the person's words.`);
    if (e.fields['Decided by'] !== undefined && !/^(BA|PO)$/.test(e.decidedBy || '')) f.push(`${at}: "Decided by" should be BA or PO, then the date, such as "PO, 2026-10-30".`);
  }
  return f;
}

function decisionEntryFindings(e: Decision): string[] {
  const at = e.id || `The entry at line ${e.line}`;
  if (!e.id) return [`${at}: its heading should be its ID, " — ", then its question or term, such as "DM-4 — Can a loan be removed?".`];
  if (e.kind !== ENTRY_KIND[e.section]) return [`${at} sits under "${e.section}", which holds ${ENTRY_KIND[e.section]} entries only.`];
  const f: string[] = [];
  const want = ENTRY_PARTS[e.section];
  const have = Object.keys(e.fields);
  const missing = want.filter((w) => !have.includes(w));
  if (missing.length) f.push(`${at} has no ${missing.map((m) => `"${m}"`).join(', ')}.`);
  else if (have.filter((h) => want.includes(h)).join('|') !== want.join('|')) f.push(`${at}: its parts should come in the template's order: ${want.join(', ')}.`);
  for (const h of have) if (!want.includes(h)) f.push(`${at} has a part the template doesn't have: "${h}".`);
  if (e.kind === 'DM') f.push(...decisionOptionFindings(at, e));
  if (e.kind === 'GC' && e.fields.Status !== undefined && !GC_STATUS.test(e.fields.Status)) f.push(`${at}: its status should be "To raise", "Raised", "Left open on" and the date, or "Settled in the Glossary on" and the date. Once the data model is in step, that last one goes on with ". Brought into the data model on" and the date.`);
  return f;
}

function decisionEntriesCheck(doc: LoadedDocument, dec: Decisions): Check {
  const f = dec.entries.flatMap(decisionEntryFindings);
  // A part with no entry says "None yet."
  const t = doc.text;
  for (const s of DECISION_SECTIONS) {
    const part = sectionText(t, s);
    if (!/^### /m.test(part) && /^## /m.test(t) && t.includes(`## ${s}`) && !/^None yet\.\s*$/m.test(part)) f.push(`"${s}" has no entry, so it should say "None yet."`);
  }
  return { name: 'Decisions file: entries', findings: f };
}

function decisionIdsCheck(dec: Decisions): Check {
  const ids: string[] = [];
  for (const kind of ['DM', 'GC'] as const) {
    // Each number missing below the highest one is named, so two gaps name the two missing IDs.
    const numbers = new Set(dec.entries.filter((e) => e.kind === kind).map((e) => e.number));
    const highest = Math.max(0, ...[...numbers].map(Number));
    for (let n = 1; n <= highest; n++) if (!numbers.has(n)) ids.push(`${kind}- numbers should run from ${kind}-1 with no gaps: ${kind}-${n} is missing.`);
    // Each ID has one entry only. A decision that changes gets a new entry, with the next ID.
    const all = dec.entries.filter((e) => e.kind === kind);
    for (const id of new Set(all.map((e) => e.id))) {
      const n = all.filter((e) => e.id === id).length;
      if (n < 2) continue;
      if (dec.open.filter((e) => e.id === id).length === n) ids.push(`${id} is open twice.`);
      else ids.push(`${id} has ${n} entries. Each ID has one entry only.`);
    }
  }
  for (const e of dec.entries) if (e.replaces && !dec.entries.some((x) => x.id === e.replaces)) ids.push(`${e.id} replaces ${e.replaces}, which isn't in the file.`);
  return { name: 'Decisions file: IDs', findings: [...new Set(ids)] };
}

function decisionsChecks(project: string, opts: PathOptions, dec: Decisions): { doc: LoadedDocument; checks: Check[] } {
  const doc = load(project, 'data-model-decisions', {}, opts);
  return {
    doc,
    checks: [
      { name: 'Decisions file: opening', findings: kitOpening(doc, 'Data model decisions — ') },
      { name: 'Decisions file: sections', findings: templateSections(doc.text, 'data-model-decisions') },
      decisionEntriesCheck(doc, dec),
      decisionIdsCheck(dec),
    ],
  };
}

// ---------------------------------------------------------------- the things file

// Each thing the things file lists, with the family it is listed under last.
function thingFamilies(things: ThingsFile): Map<string, string> {
  const seen = new Map<string, string>();
  for (const f of things.families) for (const r of f.things) seen.set(cellLine(r.Thing), f.family);
  return seen;
}

const leftOutWords = (things: ThingsFile): Set<string> => new Set(things.families.flatMap((f) => [...String(f.leftOut || '').matchAll(/([^,(]+?)\s*\(/g)].map((m) => m[1].trim())));
const waitingWords = (things: ThingsFile): Set<string> => new Set(things.waitingOnGlossary.flatMap((r) => list(r.Word).flatMap((w) => String(w).split(/,\s*|\s+and\s+/)).map((w) => w.trim())));

// Sections: one per family, each naming its data model file, then "Decisions to make" and "Waiting on the
// Glossary" when there are any, then the Check record.
function thingsSectionsCheck(t: string, things: ThingsFile): Check {
  const secs = sectionsOf(t);
  const sf = checkRecord(secs);
  let seenTail = -1;
  for (const s of secs) {
    const k = THINGS_TAIL.indexOf(s.text as (typeof THINGS_TAIL)[number]);
    if (k >= 0) {
      if (k < seenTail) sf.push(`The section "${s.text}" is out of order.`);
      seenTail = Math.max(seenTail, k);
    } else if (s.text !== 'Placeholders') {
      if (seenTail >= 0) sf.push(`The family section "${s.text}" comes after "${THINGS_TAIL[seenTail]}".`);
      if (!things.families.some((f) => f.family === s.text)) sf.push(`The section "${s.text}" names no data model file. A family's section starts "Data model file:", then a link to its file.`);
    }
  }
  return { name: 'Sections', findings: sf };
}

// Every family is a Glossary family, in its order, and names its file once, named after it.
function familiesFindings(t: string, things: ThingsFile, glossary: Glossary): string[] {
  const f1: string[] = [];
  const fams = things.families.map((f) => f.family);
  for (const f of things.families) {
    if (glossary.families.length && !glossary.families.includes(f.family)) f1.push(`${f.family} isn't a Glossary family.`);
    if (f.name !== `${slug(f.family)}.md`) f1.push(`${f.family}: its data model file should be named ${slug(f.family)}.md.`);
    const lines = sectionText(t, f.family).split('\n').filter((l) => /^Data model file:/.test(l));
    if (lines.length > 1) f1.push(`${f.family} names its data model file ${lines.length} times. It names it once.`);
  }
  const order = glossary.families.filter((x) => fams.includes(x));
  const listed = fams.filter((x) => glossary.families.includes(x));
  const wrong = listed.findIndex((x, i) => x !== order[i]);
  if (wrong >= 0) f1.push(`The families aren't in the Glossary's order: ${listed[wrong]} comes where ${order[wrong]} should.`);
  return f1;
}

// 1. Every family is a Glossary family, in its order, and names its file once, named after it. Every thing is a
// Glossary term of its family, and so is every word left out.
function coversGlossaryCheck(t: string, things: ThingsFile, glossary: Glossary, byName: Map<string, GlossaryTerm>): Check {
  const f1 = familiesFindings(t, things, glossary);
  const seen = new Map<string, string>();
  for (const f of things.families) {
    for (const r of f.things) {
      const name = cellLine(r.Thing);
      if (seen.has(name)) f1.push(`${name} is listed twice: under ${seen.get(name)} and under ${f.family}.`);
      seen.set(name, f.family);
      const term = byName.get(name);
      if (!term) { f1.push(`${f.family}: ${name} isn't a Glossary term, word for word.`); continue; }
      if (!['object', 'role'].includes(term.kind)) f1.push(`${f.family}: ${name} is a Glossary ${term.kind}, not an object or a role, so it can't be a thing.`);
      if (term.family && term.family !== f.family) f1.push(`${name} sits under ${f.family}, but its Glossary family is ${term.family}.`);
    }
    for (const m of String(f.leftOut || '').matchAll(/([^,(]+?)\s*\(([^)]*)\)/g)) {
      if (!byName.has(m[1].trim())) f1.push(`${f.family}: "${m[1].trim()}", left out, isn't a Glossary term, word for word.`);
    }
    if (f.leftOut !== null && !/\(/.test(f.leftOut)) f1.push(`${f.family}: each word left out says why, in brackets, such as "Catalogue (a screen)".`);
  }
  // Every Glossary object with nothing above it is a thing, a word left out, or waiting on the Glossary.
  const leftOut = leftOutWords(things);
  const waiting = waitingWords(things);
  for (const term of glossary.terms.filter((x) => x.kind === 'object' && !x.parent)) {
    if (!seen.has(term.name) && !leftOut.has(term.name) && !waiting.has(term.name)) f1.push(`${term.name} has nothing above it in the Glossary, so it is a thing, a word left out, or a word waiting on the Glossary. It is none of these.`);
  }
  // A family that names its file twice is read as two families, so the same finding comes twice. It is listed once.
  return { name: '1. The things file covers the Glossary', findings: [...new Set(f1)] };
}

// 8. Every definition is the Glossary's, word for word.
function thingDefinitions(things: ThingsFile, byName: Map<string, GlossaryTerm>): Definitions {
  const findings: string[] = [];
  const copies: string[] = [];
  for (const f of things.families) {
    for (const r of f.things) {
      const term = byName.get(cellLine(r.Thing));
      const def = cellLine(r.Definition);
      if (term && def !== term.definition) findings.push(`${cellLine(r.Thing)}: its definition isn't the Glossary's, word for word.`);
      else if (term) copies.push(def);
    }
  }
  return { findings, copies };
}

// 10. The "Kind of" lists.
function kindOfListsCheck(things: ThingsFile, byName: Map<string, GlossaryTerm>, seen: Map<string, string>): Check {
  const f10: string[] = [];
  const kindsListed = new Map<string, string>();
  for (const f of things.families) {
    const mine = f.things.map((r) => cellLine(r.Thing));
    for (const k of f.kindOf) {
      const m = k.match(/^(.+?), one kind of (.+?)(?: \((.+)\))?$/);
      if (!m) { f10.push(`${f.family}: "${k}" should read "{thing}, one kind of {other thing}", with the other thing's family in brackets when it is another one.`); continue; }
      kindsListed.set(m[1], m[2]);
      if (!mine.includes(m[1])) f10.push(`${f.family}: ${m[1]} is in its "Kind of" list, but isn't one of its things.`);
      const parentFamily = seen.get(m[2]) || (byName.get(m[2]) || { family: undefined }).family;
      if (parentFamily && parentFamily !== f.family && m[3] !== parentFamily) f10.push(`${f.family}: ${m[1]} is one kind of ${m[2]}, which is in ${parentFamily}, so the line names that family in brackets.`);
      const term = byName.get(m[1]);
      if (term && term.relation === 'kind of' && term.parent !== m[2]) f10.push(`${f.family}: the Glossary makes ${m[1]} one kind of ${term.parent}, not of ${m[2]}.`);
    }
  }
  for (const [name] of seen) {
    const term = byName.get(name);
    if (term && term.relation === 'kind of' && !kindsListed.has(name)) f10.push(`The Glossary makes ${name} one kind of ${term.parent}, so its family's "Kind of" list names it.`);
  }
  return { name: '10. Every "kind of" is listed', findings: f10 };
}

// 5. The product-wide decisions and the Glossary changes the things file raised.
function thingsDecisionsCheck(things: ThingsFile, dec: Decisions): Check {
  const f5: string[] = [];
  const { name } = things;
  for (const r of things.decisions) {
    const id = cellLine(r.Decision);
    const e = dec.inForce.get(id);
    if (!e || e.kind !== 'DM') f5.push(`"Decisions to make" lists ${id}, which isn't in the decisions file.`);
    else if (e.section !== 'open') f5.push(`"Decisions to make" lists ${id}, which is settled. A settled decision leaves the table.`);
    else f5.push(...sameAsRegister(id, r, e));
  }
  // A product-wide decision stays listed while it is open, even when it was answered "I don't know yet".
  for (const e of dec.open) {
    if (fileOfWhere(e.fields.Where) === name && !things.decisions.some((r) => cellLine(r.Decision) === e.id)) f5.push(`${e.id} is open for ${name}, but "Decisions to make" doesn't list it.`);
  }
  for (const r of things.waitingOnGlossary) {
    const id = cellLine(r.Change);
    const e = dec.inForce.get(id);
    if (!e || e.kind !== 'GC') f5.push(`"Waiting on the Glossary" lists ${id}, which isn't a Glossary change in the decisions file.`);
    else if (isOneOf(SETTLED, String(e.state))) f5.push(`"Waiting on the Glossary" lists ${id}, which the Glossary has settled.`);
  }
  for (const e of dec.glossaryChanges) {
    if (fileOfWhere(e.fields['Raised from']) === name && !isOneOf(SETTLED, String(e.state)) && !things.waitingOnGlossary.some((r) => cellLine(r.Change) === e.id)) f5.push(`${e.id} was raised from ${name}, but "Waiting on the Glossary" doesn't list it.`);
  }
  return { name: '5. Every open decision and Glossary change is listed', findings: f5 };
}

function checkThings(project: string, opts: PathOptions, model: DataModel, glossary: Glossary, dec: Decisions): FileResult {
  const doc = load(project, 'data-model-things', {}, opts);
  const t = doc.text;
  const things = model.thingsFile;
  const byName = termsByName(glossary);
  const seen = thingFamilies(things);
  const definitions = thingDefinitions(things, byName);
  const checks: Check[] = [
    { name: 'Opening', findings: kitOpening(doc, 'Things — ') },
    { name: 'Next step', findings: nextStep(doc) },
    thingsSectionsCheck(t, things),
    coversGlossaryCheck(t, things, glossary, byName),
    { name: '8. Things and definitions are the Glossary\'s', findings: definitions.findings },
    kindOfListsCheck(things, byName, seen),
    thingsDecisionsCheck(things, dec),
  ];

  // The words that are not things or left out, so each becomes a field or a choice. data-model-author places them.
  const leftOut = leftOutWords(things);
  const waiting = waitingWords(things);
  const notPlaced = glossary.terms.filter((x) => x.kind === 'object' && x.parent && !seen.has(x.name) && !leftOut.has(x.name) && !waiting.has(x.name)).map((x) => x.name);
  const notices = notPlaced.length ? [`Glossary objects that are not things, so each one becomes a field or a choice of a thing: ${notPlaced.length}. data-model-author puts each on its thing:`, ...notPlaced.map((x) => `- ${x}`)] : [];

  const thingCount = things.families.reduce((n, f) => n + f.things.length, 0);
  const holds = [
    `${plural(things.families.length, 'family')}, with ${plural(thingCount, 'thing')}`.replace(/familys/, 'families'),
    `${plural(leftOut.size, 'word')} left out`,
    `${plural(things.decisions.length, 'product-wide decision')} open, and ${plural(things.waitingOnGlossary.length, 'word')} waiting on the Glossary`,
  ];
  return { doc, checks, copies: definitions.copies, holds, notices, template: 'data-model-things' };
}

// ---------------------------------------------------------------- one data model file

const cellsOf = (row: Cells) => Object.keys(row).filter((k) => !k.startsWith('_')).map((k) => ({ column: k, cell: cell(row[k]) }));
const answerRows = (p: Part) => p.tables.filter((tb) => isOneOf(ANSWER_TABLES, tb.kind)).flatMap((tb) => tb.rows.map((row) => ({ kind: tb.kind, row: row as Cells })));
const rowName = (kind: string, row: Cells): string => (kind === 'moves' ? moveName(row) : cellLine(kind === 'actions' ? row.Action : kind === 'fields' ? row.Field : row.State));

// Sections: "Things and their fields", one part per thing of this family in the things file's order, then the
// "Adds to" parts, then the Check record.
function familySectionsCheck({ text, own, famEntry }: FamilyContext): Check {
  const secs = sectionsOf(text);
  const sf = checkRecord(secs);
  const want = ['Things and their fields', ...own];
  const have = secs.map((s) => s.text).filter((s) => !/^Adds to /.test(s) && s !== 'Check record' && s !== 'Placeholders');
  if (have.join('|') !== want.join('|')) {
    for (const w of want) if (!have.includes(w)) sf.push(`The section "${w}" is missing. ${w === 'Things and their fields' ? 'It comes first.' : `${w} is a thing of ${famEntry.family} in the things file.`}`);
    for (const h of have) if (!want.includes(h)) sf.push(`The section "${h}" isn't a thing of ${famEntry.family} in the things file, or a section of the template.`);
    const common = have.filter((h) => want.includes(h));
    if (common.join('|') !== want.filter((w) => have.includes(w)).join('|')) sf.push(`The parts aren't in the things file's order: ${want.join(', ')}.`);
  }
  let addsSeen = false;
  for (const s of secs) {
    if (/^Adds to /.test(s.text)) addsSeen = true;
    else if (addsSeen && s.text !== 'Check record') sf.push(`"${s.text}" comes after an "Adds to" part. The "Adds to" parts come after every thing of the family.`);
  }
  return { name: 'Sections', findings: sf };
}

// 2. Every "Adds to" part adds to a thing of an earlier family, and "Things and their fields" lists every part.
function partsCheck({ fam, parts, allThings, earlier, glossary, whole }: FamilyContext): Check {
  const f2: string[] = [];
  for (const p of parts.filter((x) => x.addsTo)) {
    if (!allThings.has(p.thing)) f2.push(`"${p.heading}": ${p.thing} isn't a thing in the things file.`);
    else if (!earlier.has(p.thing)) f2.push(`"${p.heading}": ${p.thing} isn't a thing of an earlier family, so this family can't add to it.`);
  }
  const listed = fam.fieldsList.map((r) => ({ thing: cellLine(r.Thing), fields: list(r['Fields it gives']).flatMap((x) => String(x).split(',')).map((x) => x.trim()).filter((x) => x && !NONE.test(x)) }));
  const wantList = parts.map((p) => ({ thing: p.thing, fields: p.fields.map((r) => cellLine(r.Field)) }));
  if (listed.map((x) => x.thing).join('|') !== wantList.map((x) => x.thing).join('|')) f2.push(`"Things and their fields" should have one row per part, in the parts' order: ${wantList.map((x) => x.thing).join(', ')}.`);
  for (const w of wantList) {
    const row = listed.find((x) => x.thing === w.thing);
    if (row && row.fields.join('|') !== w.fields.join('|')) f2.push(`"Things and their fields": ${w.thing} should list ${w.fields.join(', ') || '–'}, the fields of its rules table, in order.`);
  }
  // Each Glossary value set that belongs to a thing of this file shows as one of its fields.
  for (const vs of glossary.valueSets) {
    if (!parts.some((p) => p.thing === vs.belongsTo)) continue;
    const field = fieldOfValueSet(vs, whole.get(vs.belongsTo));
    if (!field) f2.push(`The Glossary's ${vs.name} belongs to ${vs.belongsTo}, but no field of ${vs.belongsTo} holds it. Its field is named "${vs.name.replace(new RegExp(`^${vs.belongsTo}\\s+`, 'i'), '').toLowerCase()}".`);
  }
  return { name: '2. Every thing of the family has its part', findings: f2 };
}

// 3. Every thing has all its parts, in the template's order, with the template's columns.
function partTablesCheck({ parts }: FamilyContext): Check {
  const f3: string[] = [];
  for (const p of parts) {
    const at = p.heading;
    if (!p.addsTo) {
      if (p.definition === null) f3.push(`${at} has no "Definition:" line.`);
      if (!p.tables.some((x) => x.kind === 'actions')) f3.push(`${at} has no Actions table.`);
      if (!p.tables.some((x) => x.kind === 'fields')) f3.push(`${at} has no rules table.`);
    }
    const order = PART_ORDER as readonly string[];
    const kinds = p.tables.map((x) => x.kind).filter((k) => order.includes(k));
    const sorted = kinds.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (kinds.join('|') !== sorted.join('|')) f3.push(`${at}: its tables should come in the template's order: Actions, the rules table, how it moves, Decisions to make, Waiting on the Glossary.`);
    for (const k of Object.keys(COLUMNS) as (keyof typeof COLUMNS)[]) for (const tb of p.tables.filter((x) => x.kind === k)) if (tb.columns.join('|') !== COLUMNS[k].join('|')) f3.push(`${at}: a table's columns should be ${COLUMNS[k].join(', ')}.`);
    for (const tb of p.tables.filter((x) => x.kind === 'states')) if (tb.columns.length !== 2 || !/^The .+…$/.test(tb.columns[1])) f3.push(`${at}: the states table's columns should be State, then "The ${p.thing.toLowerCase()}…".`);
    for (const tb of p.tables.filter((x) => x.kind === 'other')) f3.push(`${at}: a table at line ${tb.line} isn't one the template has.`);
    for (const [k, label] of Object.entries(TABLE_LABELS)) for (const tb of p.tables.filter((x) => x.kind === k)) if (tb.label !== label) f3.push(`${at}: the ${label} table should sit under the bold line "${label}".`);
    for (const tb of p.tables.filter((x) => x.kind === 'moves')) if (!/^How .+ moves(, in .+)?$/.test(tb.label || '')) f3.push(`${at}: the moves table should sit under the bold line "How {field} moves".`);
  }
  return { name: '3. Every thing has all its parts, in order', findings: f3 };
}

// 4. Every cell holds an answer, "–", "? ({ID})", or a Proposed answer naming its question.
function cellAnswersCheck({ parts, graded }: FamilyContext): Check {
  const f4: string[] = [];
  const questions = questionsOf(graded);
  for (const p of parts) {
    for (const { kind, row } of answerRows(p)) {
      for (const { column, cell: c } of cellsOf(row)) {
        const where = `${p.thing}, ${rowName(kind, row) || '(no name)'}, ${column}`;
        if (!c.text) { f4.push(`${where} is empty. Write the answer, "–", or "?" and the ID of its gap.`); continue; }
        const bare = c.text.replace(/\?\s*\((?:DM|GC)-\d+\)/g, '');
        if (/(^|[\s(])\?(?=\s|$|[.,;)])/.test(bare)) f4.push(`${where} has a "?" that names no ID, such as "? (DM-8)".`);
        if (PROPOSED.test(c.text) && !c.proposed.length) f4.push(`${where}: an answer marked "Proposed (needs confirmation)" names its question, such as "up to 2 times, Proposed (needs confirmation), question 7".`);
        for (const pr of c.proposed) {
          const q = questions && questions.get(pr.question);
          if (questions && !q) f4.push(`${where} names question ${pr.question}, which isn't in the Question log.`);
          else if (q && q.group === 'Answered') f4.push(`${where} names question ${pr.question}, which is answered. Write its answer in place of "${pr.answer}, Proposed (needs confirmation)".`);
        }
      }
    }
  }
  return { name: '4. Every cell holds an answer, "–" or a gap with its ID', findings: f4 };
}

// How many answers in the file are marked Proposed.
function proposedCount(parts: Part[]): number {
  let n = 0;
  for (const p of parts) for (const { row } of answerRows(p)) for (const { cell: c } of cellsOf(row)) n += c.proposed.length;
  return n;
}

// Each gap of one part names where it went, and each row of its "Decisions to make" is an open decision of this part.
function partGapFindings(p: Part, dec: Decisions, named: Set<string>): string[] {
  const f5: string[] = [];
  const gaps = new Set<string>();
  for (const { row } of answerRows(p)) for (const { cell: c } of cellsOf(row)) c.gaps.forEach((g) => gaps.add(g));
  for (const n of p.notes) cell(n.text).gaps.forEach((g) => gaps.add(g));
  const dmRows = p.decisions.map((r) => cellLine(r.Decision));
  const gcRows = p.waitingOnGlossary.map((r) => cellLine(r.Change));
  for (const g of gaps) {
    named.add(g);
    const e = dec.inForce.get(g);
    if (g.startsWith('DM')) {
      if (!e) f5.push(`${p.heading} names ${g}, which isn't in the decisions file.`);
      else if (e.section !== 'open') f5.push(`${p.heading} still has "? (${g})", but ${g} is settled. Write its answer in place of each "?".`);
      if (!dmRows.includes(g)) f5.push(`${p.heading} names ${g}, but its "Decisions to make" table has no row for it.`);
    } else if (g.startsWith('GC')) {
      if (!e) f5.push(`${p.heading} names ${g}, which isn't a Glossary change in the decisions file.`);
      else if (isOneOf(SETTLED, String(e.state))) f5.push(`${p.heading} still waits on ${g}, which the Glossary has settled. Bring the file in step with the Glossary.`);
      if (!gcRows.includes(g)) f5.push(`${p.heading} names ${g}, but its "Waiting on the Glossary" table has no row for it.`);
    }
  }
  for (const r of p.decisions) {
    const id = cellLine(r.Decision);
    const e = dec.inForce.get(id);
    if (!e || e.kind !== 'DM') { f5.push(`${p.heading}: "Decisions to make" lists ${id}, which isn't in the decisions file.`); continue; }
    if (e.section !== 'open') f5.push(`${p.heading}: "Decisions to make" lists ${id}, which is settled. A settled decision leaves the table.`);
    else if (!gaps.has(id)) f5.push(`${p.heading}: "Decisions to make" lists ${id}, but no cell of ${p.thing} names it.`);
    if (e.section === 'open') f5.push(...sameAsRegister(id, r, e).map((x) => `${p.heading}: ${x}`));
  }
  for (const id of gcRows) {
    const e = dec.inForce.get(id);
    if (!e || e.kind !== 'GC') f5.push(`${p.heading}: "Waiting on the Glossary" lists ${id}, which isn't a Glossary change in the decisions file.`);
  }
  return f5;
}

// 5. Every gap names where it went, and every open decision for this file has its gap.
function gapsCheck({ parts, dec, fam, things }: FamilyContext): Check {
  const named = new Set<string>();
  const f5 = parts.flatMap((p) => partGapFindings(p, dec, named));
  // An open decision keeps its "?", even when it was answered "I don't know yet". A product-wide decision still open
  // fills a "?" in every family's file.
  for (const e of dec.open) {
    const where = fileOfWhere(e.fields.Where);
    if (e.id !== null && named.has(e.id)) continue;
    if (where === fam.name) f5.push(`${e.id} is open for ${fam.name}, but no cell of the file names it as "? (${e.id})".`);
    else if (where === things.name) f5.push(`${e.id} is a product-wide decision, still open, so a cell of ${fam.name} names it as "? (${e.id})". Its answer fills a "?" in every family's file.`);
  }
  return { name: '5. Every gap names where it went', findings: [...new Set(f5)] };
}

// 6. Nothing says "assumed".
function nothingAssumedCheck({ text }: FamilyContext): Check {
  const body = text.split(/^## Check record[ \t]*$/m)[0];
  const f6: string[] = [];
  body.split('\n').forEach((l, i) => { if (/\bassum(e|ed|es|ing|ption|ptions)\b/i.test(l)) f6.push(`Line ${i + 1} says "${l.match(/\bassum\w*/i)![0]}". A gap is sent where its kind goes, never assumed.`); });
  return { name: '6. Nothing is assumed', findings: f6 };
}

// 7. No answer cites a source. An answer not yet confirmed names only its question.
function noCitationsCheck({ parts }: FamilyContext): Check {
  const f7: string[] = [];
  for (const p of parts) {
    const places = [
      ...answerRows(p).flatMap(({ kind, row }) => cellsOf(row).map(({ column, cell: c }) => ({ where: `${p.thing}, ${rowName(kind, row)}, ${column}`, s: c.text }))),
      ...p.notes.map((n) => ({ where: `${p.heading}, line ${n.line}`, s: n.text })),
    ];
    for (const { where, s } of places) {
      const bare = s.replace(/\?\s*\((?:DM|GC)-\d+\)/g, '').replace(/,\s*Proposed \(needs confirmation\),\s*question \d+/g, '');
      for (const [re, what] of CITES) if (re.test(bare)) f7.push(`${where} cites ${what}. The file shows answers only.`);
      if (/\b(?:DM|GC)-\d+\b/.test(bare)) f7.push(`${where} names ${bare.match(/\b(?:DM|GC)-\d+\b/)![0]} outside a gap. Only a gap names its ID, as "? (DM-8)".`);
      if (/\bquestion \d+/i.test(bare)) f7.push(`${where} names a question outside a Proposed answer.`);
    }
  }
  return { name: '7. No answer cites a source', findings: f7 };
}

// 8. Each thing's definition is the things file's and the Glossary's, word for word.
function partDefinitions({ parts, allThings, byName }: FamilyContext): Definitions {
  const findings: string[] = [];
  const copies: string[] = [];
  for (const p of parts.filter((x) => !x.addsTo)) {
    const fromThings = (allThings.get(p.thing) || { definition: undefined }).definition;
    const term = byName.get(p.thing);
    if (p.definition !== null && fromThings !== undefined && p.definition !== fromThings) findings.push(`${p.thing}: its definition isn't the things file's, word for word.`);
    else if (p.definition !== null && term && p.definition !== term.definition) findings.push(`${p.thing}: its definition isn't the Glossary's, word for word.`);
    else if (p.definition) copies.push(p.definition);
  }
  return { findings, copies };
}

// 8. Things, definitions, steps and states are the Glossary's.
function glossaryMatchCheck({ parts, glossary, whole }: FamilyContext, definitions: Definitions): Check {
  const f8 = [...definitions.findings];
  for (const p of parts) {
    for (const r of p.actions) {
      const step = cell(r['In step']);
      if (step.gaps.length || step.none || !step.text) continue;
      if (glossary.steps.length && !glossary.steps.includes(plain(step.text))) f8.push(`${p.thing}, ${cellLine(r.Action)}: "${step.text}" isn't a Glossary step. Write the step's name, word for word, or "–".`);
    }
  }
  for (const p of parts) {
    const thing = whole.get(p.thing);
    for (const vs of glossary.valueSets.filter((x) => x.belongsTo === p.thing && x.values.length)) {
      const field = fieldOfValueSet(vs, thing);
      if (!field) continue;
      const choices = typeOf(field.Type).choices.map(plain);
      const missing = vs.values.filter((v) => !choices.includes(v));
      const extra = choices.filter((c) => !vs.values.includes(c));
      if (p.fields.some((r) => cellLine(r.Field) === cellLine(field.Field)) && (missing.length || extra.length)) f8.push(`${p.thing}, ${cellLine(field.Field)}: its choices should be the Glossary's values for ${vs.name}, word for word: ${vs.values.join(', ')}.`);
    }
  }
  return { name: '8. Things, definitions, steps and states are the Glossary\'s', findings: f8 };
}

// 9. Every Who is a Glossary role, "the product", a gap, or "–" for an action never allowed.
function whoCheck({ parts, glossary }: FamilyContext): Check {
  const f9: string[] = [];
  for (const p of parts) {
    for (const [rows, kind] of [[p.actions, 'actions'], [p.moves, 'moves']] as const) {
      for (const r of rows) {
        const who = cell(r.Who);
        if (who.gaps.length) continue;
        const items = who.items.map(plain);
        const ok = items.length && items.every((w) => (glossary.roles.length ? glossary.roles.includes(w) : true) || w === 'the product') || (kind === 'actions' && who.none);
        if (!ok) f9.push(`${p.thing}, ${rowName(kind, r)}: its Who, "${who.text}", should be a Glossary role, "the product", or "?" and its ID${kind === 'actions' ? ', or "–" for an action that is never allowed' : ''}.`);
      }
    }
  }
  return { name: '9. Every Who is a Glossary role', findings: f9 };
}

// 10. Every "kind of" line matches the things file.
function kindOfLinesCheck({ parts, things, allThings }: FamilyContext): Check {
  const f10: string[] = [];
  const kinds = new Map(things.families.flatMap((f) => f.kindOf.map((k) => k.match(/^(.+?), one kind of (.+?)(?: \(.+\))?$/)).filter((m) => m !== null).map((m) => [m[1], m[2]] as const)));
  for (const p of parts.filter((x) => !x.addsTo)) {
    const parent = kinds.get(p.thing);
    if (parent && !p.kindOf) f10.push(`${p.thing} is one kind of ${parent} in the things file, so its part has the "kind of" line.`);
    else if (!parent && p.kindOf) f10.push(`${p.thing} has a "kind of" line, but the things file doesn't list it as one kind of another thing.`);
    else if (parent && p.kindOf) {
      if (p.kindOf.parent !== parent) f10.push(`${p.thing}: its "kind of" line names ${p.kindOf.parent}, but the things file says ${parent}.`);
      const pf = allThings.get(parent);
      if (pf && p.kindOf.file && p.kindOf.file !== pf.family.name) f10.push(`${p.thing}: its "kind of" line says ${parent} is written in ${p.kindOf.file}, but the things file names ${pf.family.name}.`);
    }
  }
  return { name: '10. Every "kind of" line matches the things file', findings: f10 };
}

// 11. Every thing can be made, found, opened and removed.
function lifecycleCheck({ parts, byName }: FamilyContext): Check {
  const f11: string[] = [];
  for (const p of parts.filter((x) => !x.addsTo)) {
    const names = p.actions.map((r) => plain(cellLine(r.Action)));
    if (!names.length) { f11.push(`${p.thing} has no action, so nothing makes it.`); continue; }
    const term = byName.get(p.thing);
    const partOf = term && term.relation === 'part of';
    for (const need of partOf ? ['Remove'] : ['Browse', 'Open', 'Remove']) {
      if (!names.includes(need)) f11.push(`${p.thing} has no ${need} row. Write it, with "?" and its ID where the sources don't say.${need !== 'Remove' ? ' Only a thing that is part of another has none.' : ''}`);
    }
  }
  return { name: '11. Every thing can be made, found, opened and removed', findings: f11 };
}

// To look at: one action per row, and one rule per sentence.
function onePerRowFamily(parts: Part[]): string[] {
  const rows: { id: string; text: string; kind: 'name' | 'action' }[] = [];
  for (const p of parts) {
    for (const r of p.actions) {
      const action = cellLine(r.Action);
      rows.push({ id: `${p.thing}, ${action}`, text: action, kind: 'name' });
      const rules = cell(r.Rules);
      if (rules.gaps.length || rules.none) continue;
      rules.text.split(/(?<=[.!?])\s+/).filter(Boolean).forEach((s, i) => rows.push({ id: `${p.thing}, ${action}, rule ${i + 1}`, text: s, kind: 'action' }));
    }
  }
  const found = onePerRow(rows);
  return [...onePerRowNotices(found.filter((x) => x.kind === 'name'), 'action name'), ...onePerRowNotices(found.filter((x) => x.kind !== 'name'), 'rule')];
}

function familyHolds({ parts, dec, fam }: FamilyContext): string[] {
  const openHere = dec.open.filter((e) => fileOfWhere(e.fields.Where) === fam.name);
  const count = (k: 'actions' | 'fields' | 'moves' | 'waitingOnGlossary') => parts.reduce((n, p) => n + p[k].length, 0);
  return [
    `${plural(parts.filter((p) => !p.addsTo).length, 'thing')}, and ${plural(parts.filter((p) => p.addsTo).length, 'thing')} of an earlier family it adds to`,
    `${plural(count('actions'), 'action')}, ${plural(count('fields'), 'field')} and ${plural(count('moves'), 'move')}`,
    `${plural(openHere.length, 'open decision')} for this file, and ${plural(proposedCount(parts), 'answer')} marked Proposed`,
    `${count('waitingOnGlossary')} waiting on the Glossary`,
  ];
}

function familyContext(project: string, family: string, opts: PathOptions, model: DataModel, glossary: Glossary, dec: Decisions, graded: Graded): FamilyContext {
  const fam = model.files.find((f) => f.value === family);
  if (!fam) throw new LayoutError(`The things file names no data model file ${family}.md. It names: ${model.files.map((f) => f.name).join(', ') || 'none'}.`);
  if (!fam.exists) throw new LayoutError(`The data model file isn't there yet: ${fam.file}`);
  const doc = load(project, 'data-model', { family }, opts);
  const things = model.thingsFile;
  const famIndex = things.families.indexOf(things.families.find((f) => f.value === family)!);
  const famEntry = things.families[famIndex];
  return {
    doc,
    text: doc.text,
    things,
    fam,
    famEntry,
    own: famEntry.things.map((r) => cellLine(r.Thing)),
    earlier: new Map(things.families.slice(0, famIndex).flatMap((f) => f.things.map((r) => [cellLine(r.Thing), f] as const))),
    allThings: new Map(things.families.flatMap((f) => f.things.map((r) => [cellLine(r.Thing), { family: f, definition: cellLine(r.Definition) }] as const))),
    byName: termsByName(glossary),
    whole: thingsOf(model),
    parts: fam.parts,
    glossary,
    dec,
    graded,
  };
}

function checkFamily(project: string, family: string, opts: PathOptions, model: DataModel, glossary: Glossary, dec: Decisions, graded: Graded): FileResult {
  const ctx = familyContext(project, family, opts, model, glossary, dec, graded);
  const { doc, things, famEntry, parts, whole, allThings } = ctx;
  const definitions = partDefinitions(ctx);
  const checks: Check[] = [
    { name: 'Things file accepted', findings: things.status.state === 'accepted' ? [] : [`The things file, ${things.name}, isn't accepted, so no data model file is written yet. Its status is "${things.status.raw || 'missing'}".`] },
    { name: 'Opening', findings: kitOpening(doc, `Data model — ${famEntry.family}, `) },
    { name: 'Next step', findings: nextStep(doc) },
    familySectionsCheck(ctx),
    partsCheck(ctx),
    partTablesCheck(ctx),
    cellAnswersCheck(ctx),
    { name: '4. Every rules table cell holds an answer its column allows', findings: ruleAnswers(parts, whole, allThings) },
    gapsCheck(ctx),
    nothingAssumedCheck(ctx),
    noCitationsCheck(ctx),
    glossaryMatchCheck(ctx, definitions),
    { name: 'How it moves', findings: moves(parts, whole, ctx.text, famEntry.family) },
    whoCheck(ctx),
    kindOfLinesCheck(ctx),
    lifecycleCheck(ctx),
  ];
  return { doc, checks, copies: definitions.copies, holds: familyHolds(ctx), notices: onePerRowFamily(parts), template: 'data-model' };
}

// The field of a thing that holds a Glossary value set: "Loan state", which belongs to Loan, is Loan's "state" field.
function fieldOfValueSet(vs: ValueSet, thing: ThingOf | undefined): Cells | null {
  if (!thing) return null;
  const name = vs.name.replace(new RegExp(`^${escapeRegExp(vs.belongsTo)}\\s+`, 'i'), '').toLowerCase();
  return thing.fields.find((r) => cellLine(r.Field).toLowerCase() === name || cellLine(r.Field).toLowerCase() === vs.name.toLowerCase()) || null;
}

// One field's answer in a column, read without its Proposed mark, or null when it is a gap.
function answerIn(r: Cells, col: string): string | null {
  const c = cell(r[col]);
  if (c.gaps.length) return null;
  return plain(c.proposed.length ? c.proposed[0].answer : c.text);
}

// The Type column: a base the design allows, at least 2 choices, and "set from" a field of the thing.
function typeFindings(at: string, r: Cells, thingName: string, thingNames: string[], fieldNames: string[]): string[] {
  const f: string[] = [];
  const type = typeOf(r.Type);
  const isChoice = ['one of', 'one or more of'].includes(type.base);
  const base = plain(type.base);
  const one = base.match(/^one (.+)$/);
  const several = base.match(/^several (.+)$/);
  const known = isOneOf(BASE_TYPES, base) || (one && thingNames.includes(one[1])) || (several && thingNames.some((x) => [x, `${x}s`, `${x}es`].includes(several[1])));
  if (!known) f.push(`${at}: its Type, "${base}", isn't one the design allows: text, number, date, yes or no, one of, one or more of, "one" and a thing, "several" and things, file, a street address, a web address or an email address.`);
  if (isChoice && type.choices.length < 2) f.push(`${at}: "${type.base}" lists each choice as a bullet on its own line, and there are at least 2.`);
  if (type.setFrom && !fieldNames.includes(type.setFrom)) f.push(`${at}: it is set from "${type.setFrom}", which isn't a field of ${thingName}.`);
  return f;
}

// The "Can change" column: yes, no, "only while" a choice, "follows" a field, or "moves: see How {field} moves".
function canChangeFindings(at: string, change: string, thingName: string, fieldNames: string[], allChoices: string[], movers: Set<string>): string[] {
  let m: RegExpMatchArray | null;
  if (/^(yes|no)$/.test(change)) return [];
  if ((m = change.match(/^only while (.+)$/))) return allChoices.includes(m[1]) ? [] : [`${at}: "only while ${m[1]}" should name a choice of one of ${thingName}'s fields.`];
  if ((m = change.match(/^follows (.+)$/))) return fieldNames.includes(m[1]) ? [] : [`${at}: it follows "${m[1]}", which isn't a field of ${thingName}.`];
  if ((m = change.match(/^moves: see How (.+) moves$/))) return movers.has(m[1]) ? [] : [`${at}: it points to "How ${m[1]} moves", which no part of ${thingName} has.`];
  return [`${at}: "Can change" should be yes, no, "only while" and a value, "follows" and a field, or "moves: see How", the field, then "moves".`];
}

// The answers each column of a rules table allows (data-model-design.md, step 4). A gap is never checked here, and a
// Proposed answer is read without its mark.
function ruleAnswers(parts: Part[], whole: Things, allThings: Map<string, unknown>): string[] {
  const f: string[] = [];
  const thingNames = [...allThings.keys()];
  for (const p of parts) {
    const t = whole.get(p.thing) || { fields: [], parts: [] };
    const fieldNames = t.fields.map((r) => cellLine(r.Field));
    const allChoices = t.fields.flatMap((r) => typeOf(r.Type).choices.map(plain));
    const movers = new Set(t.parts.flatMap((x) => x.labels.map((l) => (l.text.match(/^How (.+?) moves(?:, in .+)?$/) || [])[1]).filter(Boolean)));
    for (const r of p.fields) {
      const at = `${p.thing}, ${cellLine(r.Field)}`;
      const type = typeOf(r.Type);
      const isChoice = ['one of', 'one or more of'].includes(type.base);
      if (answerIn(r, 'Type') !== null) f.push(...typeFindings(at, r, p.thing, thingNames, fieldNames));
      const req = answerIn(r, 'Required');
      if (req !== null && !/^(yes|no|yes, only when .+)$/.test(req)) f.push(`${at}: Required should be yes, no, or "yes, only when" and the condition.`);
      const limits = answerIn(r, 'Limits');
      if (limits !== null && (isChoice || type.base === 'yes or no') && !NONE.test(limits)) f.push(`${at}: Limits doesn't apply to a field with choices or a yes-or-no field, so it reads "–".`);
      const share = answerIn(r, 'Can two share it');
      if (share !== null && !/^(yes|no|[–-])$/.test(share)) f.push(`${at}: "Can two share it" should be yes, no, or "–".`);
      const change = answerIn(r, 'Can change');
      if (change !== null) f.push(...canChangeFindings(at, change, p.thing, fieldNames, allChoices, movers));
      const starts = answerIn(r, 'Starts as');
      if (starts !== null && !NONE.test(starts)) {
        if (!isChoice) f.push(`${at}: "Starts as" applies only to a field with choices, so it reads "–".`);
        else if (!type.choices.map(plain).includes(starts)) f.push(`${at}: it starts as "${starts}", which isn't one of its choices.`);
      }
    }
  }
  return f;
}

// One "How {field} moves": its moves and its states are the field's choices, and it starts where "Starts as" says.
function movesOfField(p: Part, l: Part['labels'][number], m: RegExpMatchArray, field: Cells, lines: string[], familyName: string): string[] {
  const f: string[] = [];
  const choices = typeOf(field.Type).choices.map(plain);
  if (!choices.length) f.push(`${p.heading}: ${m[1]} has no choices, so it has no moves. Only a status or a step moves.`);
  if (p.addsTo && m[2] !== familyName) f.push(`${p.heading}: the bold line reads "How ${m[1]} moves, in ${familyName}".`);
  if (!p.addsTo && m[2]) f.push(`${p.heading}: the bold line reads "How ${m[1]} moves", with no family.`);
  if (!p.addsTo) {
    let k = l.line;
    while (k < lines.length && !lines[k].trim()) k++;
    if (!/^\s*```/.test(lines[k] || '')) f.push(`${p.heading}: "${l.text}" starts with its picture, in a code block.`);
  }
  const rows = p.moves.filter((r) => r._field === m[1]);
  if (!rows.length) f.push(`${p.heading}: "${l.text}" has no moves table.`);
  for (const r of rows) {
    for (const [col, allowStart] of [['From', true], ['To', false]] as const) {
      const c = cell(r[col]);
      if (c.gaps.length) continue;
      const v = plain(c.text);
      if (!(allowStart && v === 'Start') && choices.length && !choices.includes(v)) f.push(`${p.heading}, the move ${moveName(r)}: "${v}" isn't one of ${m[1]}'s choices${allowStart ? ', or Start' : ''}.`);
    }
  }
  const start = rows.find((r) => plain(cellLine(r.From)) === 'Start');
  const startsAs = cell(field['Starts as']);
  if (!p.addsTo && !start) f.push(`${p.heading}: the first move starts from "Start".`);
  if (start && !startsAs.gaps.length && !cell(start.To).gaps.length && plain(startsAs.text) !== plain(cellLine(start.To))) f.push(`${p.thing}, ${m[1]}: it starts as "${startsAs.text}", but the first move from Start goes to "${cellLine(start.To)}".`);
  if (!p.addsTo) {
    const states = p.states.map((r) => plain(cellLine(r.State)));
    if (!states.length) f.push(`${p.heading}: "${l.text}" has no table of what each state means.`);
    else if (choices.length && states.join('|') !== choices.join('|')) f.push(`${p.heading}: what each state means has one row per choice of ${m[1]}, in its order: ${choices.join(', ')}.`);
  }
  return f;
}

// How it moves: each "How {field} moves" names a field with choices, the main part has its picture, every move and
// every state is one of the field's choices, the states table has one row per choice, and "Starts as" is where the
// first move from Start goes.
function moves(parts: Part[], whole: Things, t: string, familyName: string): string[] {
  const f: string[] = [];
  const lines = t.split('\n');
  for (const p of parts) {
    const thing = whole.get(p.thing) || { fields: [] };
    for (const l of p.labels) {
      const m = l.text.match(/^How (.+?) moves(?:, in (.+))?$/);
      if (!m) continue;
      const field = thing.fields.find((r) => cellLine(r.Field) === m[1]);
      if (!field) { f.push(`${p.heading}: "${l.text}" names ${m[1]}, which isn't a field of ${p.thing}.`); continue; }
      f.push(...movesOfField(p, l, m, field, lines, familyName));
    }
  }
  return f;
}

// ---------------------------------------------------------------- the check

export function check(project: string, family: string | null, opts: PathOptions = {}): CheckResult {
  const model = loadDataModel(project, { ...opts, allowMissing: true });
  const dec = decisionsOf(project, opts);
  if (!dec.exists) throw new LayoutError(`The data model's decisions file isn't there yet: ${dec.file}`);
  const glossary = glossaryOf(project, opts);
  const graded = questions(project, opts);

  const r = family ? checkFamily(project, family, opts, model, glossary, dec, graded) : checkThings(project, opts, model, glossary, dec);
  const t = r.doc.text;
  const checks = [...r.checks];
  checks.push({ name: 'Placeholders', findings: placeholders(t) });
  checks.push({ name: 'Display', findings: rendering(t) });
  const w = writing(t, r.copies, project, opts, r.doc.rel.split('/').pop()!);
  checks.push({ name: 'Simple writing', findings: w.findings });
  checks.push({ name: 'Glossary words', findings: retired(t, r.copies, project, opts, r.template) });

  // The decisions file, as a whole.
  const decisionsFile = decisionsChecks(project, opts, dec);
  const decText = decisionsFile.doc.text;
  checks.push(...decisionsFile.checks);
  checks.push({ name: 'Decisions file: placeholders', findings: placeholders(decText) });
  checks.push({ name: 'Decisions file: display', findings: rendering(decText) });
  const dw = simpleWriting(decText, { project, output: opts.output });
  checks.push({ name: 'Decisions file: simple writing', findings: dw.findings });
  checks.push({ name: 'Decisions file: Glossary words', findings: retired(decText, [], project, opts, 'data-model-decisions') });

  const holds = [
    ...r.holds,
    `The decisions file: ${plural(dec.open.length, 'open decision')}, ${plural(dec.settled.length, 'settled decision')} and ${plural(dec.glossaryChanges.length, 'Glossary change')}`,
  ];
  const notices = [...r.notices, ...w.notices, ...dw.notices.map((n) => n.replace(/^Simple writing, to look at:/, 'Simple writing in the decisions file, to look at:'))];
  notices.push('Not checked by the program, for the specifier to read:', ...NOT_CHECKED.map((n) => `- ${n}`));
  return { doc: r.doc, checks, holds, graded, notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-data-model.ts --project <p> [--family <family>]');
  const given = args.values.family;
  const family = given && given !== true ? String(given).replace(/\.md$/, '') : null;
  if (given === true) fail('Use: --family followed by the family\'s file name, such as --family lending.', 2);
  const date = textOption(args, 'date') ?? today();
  const out = report({ program: programName(import.meta.filename), date, ...check(project, family, { output: args.output }) });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
