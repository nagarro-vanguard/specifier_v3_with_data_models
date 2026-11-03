// check-document.ts — the checks every document's check program shares, and the three blocks it prints for its gate
// (decision-review-gates.md, rule 1).
//
// Exports:
//   load(project, document, values, opts)   the document's text, path and status line
//   lines(text)                             each line outside fenced code: { n, line, section }
//   opening(text)                           findings: the status line is missing, or an opening note is left in
//   openingNotes(text)                      findings: an opening note left in, for a document with no status line
//   sections(text, template)                findings: the template's sections are missing, out of order, or extra
//   placeholders(text)                      findings: a {placeholder} left in the document
//   rendering(text)                         findings: anything lib/md-lint.ts finds
//   simpleWriting(text, opts)               { findings, notices }: what lib/simple-writing.ts finds to fix, and to look at
//   requirementsOf(prdText)                 the PRD's requirements, each with its simple words, the client's words and its kind
//   KINDS, KIND_HOME                        the four kinds of PRD row, and the section that holds each kind but Requirement
//   questions(project, opts)                the grader's findings and counts, through grade-questions.ts
//   questionFindingsFor(doc, graded)        the grader's findings that belong to this document
//   beyond(text)                            every place the document goes beyond, or differs from, the client's words
//   stillNeeded(text, graded)               what we still need from the client: each open question the document names
//   answered(text)                          each decision at this document's gate, with its answer
//   report(spec)                            the three blocks: For the person, One line, For the file
//   epicOf(project, epic, opts)             an EPIC from its ID or folder name: its ID, name, folder and register row
//   changeOf(project, change, opts)         a change from its number or folder name: its folder and its report
//   replaceSection(file, heading, body)     writes what one level-2 section holds, keeping the lines in italics under it
//   DocumentLine, Requirement, PrdKind, SimpleWritingOptions, Epic, ChangeFolder
//                                           the types these give and take
//
// A check is a name and its findings. A document passes when no check has a finding.
// The shapes a check program hands to report() are in lib/types.ts.

import fs from 'node:fs';
import path from 'node:path';
import { KIT_ROOT, LayoutError, pathOf, readText, relOf, slug, writeText, type PathOptions, type Values } from './run-paths.ts';
import { cellText, headings, list, normalize, tableUnder, type Row } from './md-tables.ts';
import { lint } from './md-lint.ts';
import { check as checkWriting, glossaryTerms } from './simple-writing.ts';
import { grade, type Graded } from '../grade-questions.ts';
import { escapeRegExp, plural } from './text.ts';
import { checkRecordLine, PROPOSED_MARK, TBD_MARK } from './marks.ts';
import type { DocStatus, LoadedDocument, Report, ReportSpec } from './types.ts';

// A line outside fenced code: its number, from 1, its text, and the level-2 section it sits in.
export interface DocumentLine {
  n: number;
  line: string;
  section: string;
}

// The four kinds of row in the PRD's section 4 (prd-author, step 2), and the section that holds each kind but
// Requirement.
export const KINDS = ['Requirement', 'Purpose', 'Scope', 'Way of working'] as const;
export type PrdKind = (typeof KINDS)[number];
export const KIND_HOME: Record<Exclude<PrdKind, 'Requirement'>, string> = { Purpose: 'PRD section 2', Scope: 'BRD section 4', 'Way of working': 'PRD section 8' };

// A PRD requirement: its row, with what requirementsOf reads from it.
export type Requirement = Row & {
  // true for a PRD written before simple-writing-rules.md, with one "Requirement as written" column
  oldForm: boolean;
  hasKind: boolean;
  kind: string;
  // false only for a Purpose, Scope or Way of working row
  isRequirement: boolean;
  simple: string;
  client: string;
};

export interface SimpleWritingOptions extends PathOptions {
  // The project, whose agreed Glossary words are always allowed.
  project?: string;
  skipColumns?: readonly string[];
  compare?: readonly string[];
}

export interface Epic {
  id: string;
  name: string;
  folder: string;
  row: Row;
}

export interface ChangeFolder {
  number: string;
  folder: string;
  // The change's folder, as a full path.
  dir: string;
  // The path of its Change impact report.
  report: string;
}

const TEMPLATES = path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'templates');
// The sections that hold records, not content. Nothing in them counts as going beyond the client's words.
const RECORDS = ['decision record', 'check record', 'placeholders'];
const OPENING_NOTES = ['What this is', 'What it is not', 'Written by', 'Lineage'] as const;

export function load(project: string, document: string, values: Values = {}, opts: PathOptions = {}): LoadedDocument {
  const file = pathOf(project, document, values, opts);
  if (!fs.existsSync(file)) throw new LayoutError(`The document isn't there yet: ${file}`);
  const text = readText(file);
  const s = text.match(/^Status: (drafted|accepted on (\d{4}-\d{2}-\d{2}), version (\d+)|parked on .*)\s*$/m);
  const status: DocStatus | null = !s ? null : s[1] === 'drafted' ? 'drafted' : s[2] ? 'accepted' : 'parked';
  const acceptedOn = s?.[2];
  return { file, rel: relOf(document, { product: project, ...values }), text, status, acceptedOn, version: acceptedOn ? Number(s?.[3]) : undefined };
}

// Lines outside fenced code blocks, with their numbers from 1 and the level-2 section each one sits in.
export function lines(text: string): DocumentLine[] {
  const out: DocumentLine[] = [];
  let fence = false;
  let section = '';
  text.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*```/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const h = line.match(/^##\s+(.*?)\s*$/);
    if (h) section = h[1];
    out.push({ n: i + 1, line, section });
  });
  return out;
}

// A document opens with its title, then its status line. The notes on what a template is for live in its
// Placeholders part, never in the document.
export function openingNotes(text: string): string[] {
  return OPENING_NOTES
    .filter((m) => new RegExp(`^> \\*\\*${m}\\b`, 'm').test(text))
    .map((m) => `The document still has the opening note "${m}": the template's notes stay in its Placeholders part.`);
}

export function opening(text: string): string[] {
  return [...(/^Status: /m.test(text) ? [] : ['The document has no status line.']), ...openingNotes(text)];
}

// A template heading as a pattern: each {placeholder} matches any text.
function headingPattern(h: string): RegExp {
  const parts = h.split(/\{[^}]+\}/).map(escapeRegExp);
  return new RegExp(`^${parts.join('.+')}$`);
}

export function sections(text: string, template: string): string[] {
  const templateFile = path.join(TEMPLATES, `${template}.md`);
  const want = headings(readText(templateFile)).filter((h) => h.level === 2 && h.text !== 'Placeholders').map((h) => h.text);
  const have = headings(text).filter((h) => h.level === 2).map((h) => h.text);
  const f: string[] = [];
  let from = 0;
  for (const w of want) {
    const re = headingPattern(w);
    const i = have.findIndex((h, k) => k >= from && re.test(h));
    if (i < 0) {
      f.push(have.some((h) => re.test(h)) ? `The section "${w}" is out of order.` : `The section "${w}" is missing.`);
    } else from = i + 1;
  }
  for (const h of have) {
    if (h === 'Placeholders') f.push('The document carries the template\'s Placeholders section, which is never copied in.');
    else if (!want.some((w) => headingPattern(w).test(h))) f.push(`The section "${h}" isn't in the template.`);
  }
  return f;
}

export function placeholders(text: string): string[] {
  const f: string[] = [];
  for (const { n, line } of lines(text)) {
    const bare = line.replace(/`[^`]*`/g, '');
    for (const m of bare.matchAll(/\{[^}\n]+\}/g)) f.push(`Line ${n}: the placeholder ${m[0]} is still there.`);
  }
  return f;
}

export function rendering(text: string): string[] {
  return lint(text).map((p) => `Line ${p.line}: ${p.problem}`);
}

// The PRD's requirements, from section 4, each row with more fields: simple, the requirement in simple words; client,
// the client's own words; kind, from the Kind column; and isRequirement, false only for a Purpose, Scope or Way of
// working row. A PRD with no Kind column has hasKind false, and every row is read as a Requirement, so the later checks
// keep working until it is fixed. A PRD written before simple-writing-rules.md has one column, "Requirement as
// written", under "Requirements, word for word": simple and client then hold that column, and oldForm is true.
export function requirementsOf(prdText: string): Requirement[] {
  const rows = tableUnder(prdText, 'Requirements') || tableUnder(prdText, 'Requirements, word for word') || [];
  return rows.map((r) => {
    const oldForm = !('In simple words' in r);
    const hasKind = 'Kind' in r;
    const kind = hasKind ? cellText(r.Kind) : 'Requirement';
    const isRequirement = !Object.keys(KIND_HOME).includes(kind);
    const simple = cellText(oldForm ? r['Requirement as written'] : r['In simple words']);
    const client = cellText(oldForm ? r['Requirement as written'] : r["The client's words"]);
    return { ...r, oldForm, hasKind, kind, isRequirement, simple, client } as Requirement;
  });
}

// simple-writing-rules.md: what the check program fails on, and what the gate shows the person to look at.
// The project's agreed Glossary words are always allowed.
export function simpleWriting(text: string, opts: SimpleWritingOptions = {}): { findings: string[]; notices: string[] } {
  const allow = opts.project ? glossaryTerms(opts.project, { output: opts.output }) : [];
  const r = checkWriting(text, { skipColumns: opts.skipColumns, compare: opts.compare, allow });
  const notices = r.toLook.length ? [`Simple writing, to look at: ${plural(r.toLook.length, 'place')}`, ...r.toLook.map((x) => `- Line ${x.n}, ${x.where}: ${x.what}`)] : [];
  return { findings: r.toFix.map((x) => `Line ${x.n}, ${x.where}: ${x.what}`), notices };
}

export function questions(project: string, opts: PathOptions = {}): Graded {
  return grade(project, { output: opts.output, checkOnly: true });
}

// The grader's findings that belong to this document: its own gaps, the questions it raised, and anything wrong with
// the Question log as a whole. A slip in another document is that document's check's finding, not this one's.
export function questionFindingsFor(doc: { rel: string }, graded: Graded): string[] {
  const name = path.basename(doc.rel);
  const raisedHere = new Set((graded.questions || []).filter((q) => String((q.parts && q.parts['Raised in']) || '').includes(name)).map((q) => q.n));
  return (graded.findings || []).filter((f) => {
    const gap = f.match(/^(.+?), line \d+: /);
    if (gap) return gap[1] === doc.rel;
    const q = f.match(/^Question (\d+):/);
    if (q) return raisedHere.has(Number(q[1]));
    return true;
  });
}

// The text of a line, for a list: a table row as its first cell, then the cell that holds the mark. When that cell
// holds nothing but the mark, such as "AI-RECOMMENDED", the next cell says what the row is about. In the PRD, that is
// the cell after the row's kind.
function placeOf(line: string, mark: RegExp): string {
  if (/^\s*\|/.test(line)) {
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const holder = cells.find((c) => mark.test(c)) || '';
    if (holder === cells[0]) return cells[0];
    const bare = holder.replace(mark, '').replace(/[\s,:.—-]+/g, '');
    const about = cells.slice(1).find((c) => !(KINDS as readonly string[]).includes(c)) || cells[1];
    return bare ? `${cells[0]}: ${holder}` : `${cells[0]}: ${about}, ${holder}`;
  }
  return line.trim().replace(/^[-*]\s+/, '');
}

function shorten(s: string, max = 160): string {
  const t = s.replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// conventions.md, "Beyond the client's words": every place a document marks as going beyond what the client wrote,
// including an FRD rule whose source is proposed or decided, a rule a data model decision changed, whose note names
// its DM-n, and a data model answer a decision at an FRD's gate changed, whose note reads "Updated from the data model
// on the basis of Decision n".
// The BRD's <sup>*Q{n}</sup> is the same mark as Proposed (needs confirmation), and reads as it for the person.
const BEYOND = new RegExp(`Proposed \\(needs confirmation\\)|${PROPOSED_MARK.source}|AI-RECOMMENDED|Updated from the requirement on the basis of Decision|Updated from the data model on the basis of Decision|on the basis of DM-\\d+|\\bproposed — Why:|\\bdecided — see Decision`);
const SHORT_PROPOSED = new RegExp(PROPOSED_MARK.source, 'g');

export function beyond(text: string): string[] {
  const out: string[] = [];
  let decision: { name: string; question: string; number: number | null } | null = null;
  for (const { line, section } of lines(text)) {
    if (/^\s*\*[^*]/.test(line) || /^>/.test(line)) continue; // a rule under a heading, or the opening and summary blocks
    const inRecord = RECORDS.includes(normalize(section));
    if (!inRecord && BEYOND.test(line)) out.push(`${section}: ${shorten(placeOf(line, BEYOND).replace(SHORT_PROPOSED, ', Proposed (needs confirmation), question $1'))}`);
    if (normalize(section) === 'decision record') {
      const h = line.match(/^###\s+(Decision \d+) — (.*)$/);
      if (h) decision = { name: h[1], question: h[2], number: null };
      const q = line.match(/^- \*\*Question:\*\* (\d+)/);
      if (q && decision) decision.number = Number(q[1]);
      const chosen = line.match(/^- \*\*Chosen:\*\* (.*)$/);
      // A question the files left open, settled by the specifier: the answer is theirs, not the client's.
      if (chosen && decision && decision.number && !/^I don't know yet/i.test(chosen[1])) out.push(`${decision.name}, question ${decision.number}: ${shorten(chosen[1])}`);
      else if (chosen && /^Other: /.test(chosen[1])) out.push(`${section}: ${shorten(chosen[1])}`);
    }
  }
  return out;
}

// What we still need from the client: each question the document names that is still open, with the answer in use,
// then each TBD left in the document whose question is answered, since its value has yet to arrive.
export function stillNeeded(text: string, graded: Graded): string[] {
  const named = new Set<number>();
  const tbd = new Set<number>();
  for (const { line, section } of lines(text)) {
    if (RECORDS.includes(normalize(section)) || /^\s*\*[^*]/.test(line)) continue;
    for (const m of line.matchAll(/question (\d+)/gi)) named.add(Number(m[1]));
    for (const m of line.matchAll(/\bTBD, question (\d+)/g)) tbd.add(Number(m[1]));
    for (const m of line.matchAll(new RegExp(TBD_MARK.source, 'g'))) { named.add(Number(m[1])); tbd.add(Number(m[1])); }
    for (const m of line.matchAll(SHORT_PROPOSED)) named.add(Number(m[1]));
  }
  const open = (graded.open || []).filter((q) => q.n !== null && named.has(q.n)).map((q) => {
    const inUse = String((q.parts && q.parts['Answer in use for now']) || '').trim();
    return `question ${q.n}: ${q.title}${inUse ? ` In use for now: ${inUse}.` : ''}`;
  });
  const waiting = (graded.questions || []).filter((q) => q.group === 'Answered' && q.n !== null && tbd.has(q.n)).map((q) => {
    const answer = list(q.parts && q.parts.Answer).map((x) => String(x).trim()).join(' ');
    return `question ${q.n}: ${q.title} Answered: ${answer}. The value itself is still TBD.`;
  });
  return [...open, ...waiting];
}

// Each question answered at the gate of a document with no Decision record, such as the BRD: the Question log's
// "Decided in" names the document.
function answeredInLog(rel: string, graded: Graded): string[] {
  const name = path.basename(rel);
  return (graded.questions || [])
    .filter((q) => q.group === 'Answered' && String((q.parts && q.parts['Decided in']) || '').includes(name))
    .map((q) => `question ${q.n}: ${q.title} ${list(q.parts && q.parts.Answer).map((x) => String(x).trim()).join(' ')}`);
}

// Each decision at this document's gate, with the answer chosen.
export function answered(text: string): string[] {
  const out: string[] = [];
  let current: { decision: string; question: string } | null = null;
  for (const { line, section } of lines(text)) {
    if (normalize(section) !== 'decision record') continue;
    const h = line.match(/^###\s+(Decision \d+) — (.*)$/);
    if (h) current = { decision: h[1], question: h[2] };
    const c = line.match(/^- \*\*Chosen:\*\* (.*)$/);
    if (c && current) out.push(`${current.decision}, ${current.question} ${c[1]}`);
  }
  return out;
}

// Each item as a bullet, or "- None".
const bullets = (items: readonly string[]): string[] => (items.length ? items.map((x) => `- ${x}`) : ['- None']);

// What the person reads about an accepted document: its answers, and the list for the client.
function acceptedBlock(doc: LoadedDocument, places: readonly string[], graded: Graded | null | undefined): string[] {
  return [
    `Accepted on ${doc.acceptedOn}, version ${doc.version}.`, '', 'Each question, with its answer:',
    ...bullets(/^##\s+Decision record\s*$/m.test(doc.text) || !graded ? answered(doc.text) : answeredInLog(doc.rel, graded)),
    '', 'The list for the client:', 'What we changed or added, for the client to confirm:',
    ...bullets(places),
    'What we still need from the client:',
    ...bullets(graded ? stillNeeded(doc.text, graded) : []),
  ];
}

// notices are facts the gate must show that are never findings, such as an FRD waiting on a Must answer question.
export function report(spec: ReportSpec): Report {
  const { program, date, doc, checks, graded } = spec;
  const findings = checks.flatMap((c) => c.findings.map((f) => `${c.name}: ${f}`));
  const passed = checks.filter((c) => !c.findings.length).length;
  // Worded as grade-questions.ts words it, so the two read alike: a colon for the person, brackets in one line.
  const counts = graded && graded.counts ? `${graded.counts['Must answer'] || 0} must answer, ${graded.counts['Should answer'] || 0} should answer, ${graded.counts['Can move ahead'] || 0} can move ahead` : '';
  const openLine = graded && graded.counts ? `${plural(graded.open.length, 'open question')} (${counts}).` : 'No Question log yet.';
  const openForPerson = graded && graded.counts ? `${plural(graded.open.length, 'open question')}: ${counts}.` : openLine;
  const places = beyond(doc.text);
  const person: string[] = [];
  if (doc.status === 'accepted') {
    person.push(...acceptedBlock(doc, places, graded));
  } else {
    person.push('What the draft holds:', ...spec.holds.map((h) => `- ${h}`), '', 'Where it goes beyond the client\'s words:');
    person.push(...bullets(places));
    person.push('', openForPerson);
  }
  if (spec.notices && spec.notices.length) person.push('', ...spec.notices);
  person.push('');
  if (findings.length) person.push(`${plural(findings.length, 'finding')}:`, ...findings.map((f) => `- ${f}`));
  else person.push(`Every check passed: ${plural(checks.length, 'check')}.`);
  const line = `${program}: ${passed} of ${plural(checks.length, 'check')} passed, ${plural(findings.length, 'finding')}; ${openLine}`;
  const file = spec.recordTime
    ? [checkRecordLine(!findings.length, date, spec.recordTime)]
    : [`${program}, ${date}: ${passed} of ${plural(checks.length, 'check')} passed, ${plural(findings.length, 'finding')}. ${openLine}`, ...findings.map((f) => `- ${f}`)];
  return { text: ['For the person:', ...person, '', 'One line:', line, '', 'For the file:', ...file, ''].join('\n'), findings };
}

// An EPIC, from its ID, such as EPIC-002, or its folder's name, such as EPIC-002-claim-approval, through the EPIC
// register: { id, name, folder, row }. Its folder is its ID and its name in lowercase with hyphens.
export function epicOf(project: string, epic: string, opts: PathOptions = {}): Epic {
  const register = load(project, 'epic-register', {}, opts);
  const id = String(epic).match(/^EPIC-\d{3}/)?.[0];
  const row = (tableUnder(register.text, 'EPICs') || []).find((r) => String(r.EPIC).trim() === id);
  if (!row || !id) throw new LayoutError(`"${epic}" isn't an EPIC in the EPIC register.`);
  const name = String(row.Name).trim();
  return { id, name, folder: `${id}-${slug(name)}`, row };
}

// A change, from its number, such as 001, or its folder's name, such as 001-finance-limit:
// { number, folder, dir, report }. Its folder is in the project's changes/ folder.
export function changeOf(project: string, change: string, opts: PathOptions = {}): ChangeFolder {
  const number = String(change).match(/^\d{3}/)?.[0];
  if (!number) throw new LayoutError(`"${change}" isn't a change's number, such as 001.`);
  const changes = path.dirname(pathOf(project, 'change', { change: 'x' }, opts));
  const folder = fs.existsSync(changes) ? fs.readdirSync(changes).find((f) => f === change || f.startsWith(`${number}-`)) : undefined;
  if (!folder) throw new LayoutError(`There is no change ${number} in ${changes}.`);
  return { number, folder, dir: path.join(changes, folder), report: pathOf(project, 'change-impact-report', { change: folder }, opts) };
}

// Replaces what a level-2 section holds, keeping its heading and the lines in italics under it, which say what it
// holds. Used by the programs that write one section of a document, such as a section of a Change impact report.
export function replaceSection(file: string, heading: string, body: readonly string[]): void {
  const all = readText(file).split('\n');
  const start = all.findIndex((l) => /^## /.test(l) && normalize(l.slice(3)) === normalize(heading));
  if (start < 0) throw new LayoutError(`${file} has no "${heading}" section.`);
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  const keep = [all[start], ''];
  for (let i = start + 1; i < end && (all[i].trim() === '' || /^\*[^*].*\*$/.test(all[i].trim())); i++) if (all[i].trim()) keep.push(all[i], '');
  writeText(file, [...all.slice(0, start), ...keep, ...body, '', ...all.slice(end)].join('\n'));
}
