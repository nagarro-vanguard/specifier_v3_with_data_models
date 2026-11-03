// simple-writing.ts — checks a document against _shared/simple-writing-rules.md.
//
// Exports:
//   check(text, opts)              { toFix, toLook }: each item is { n, where, kind, what }
//   glossaryTerms(project, opts)   the agreed Glossary words and values, which the check never flags
//   report(name, result, limit)    the result as text, for check-simple-writing.ts
//   RULES                          the path of the rules file
//   WritingOptions, WritingItem, WritingResult
//                                  the types of check's options, of one item it finds, and of its result
//
// opts: { skipColumns: [names], compare: [simple column, client column], allow: [words] }
//
// To fix (each one fails a check program):
//   - a word or phrase from the rules file's four lists: hard words, figures of speech, pointing words, and words that
//     can't be checked. A word that can't be checked is allowed in a line or cell that names its question, such as
//     "as needed, question 9". "and so on" is allowed right after 2 items that show the pattern, such as "F-01, F-02
//     and so on".
//   - a semicolon, which joins two ideas or two rules
//   - a side note after a spaced dash, or in brackets of 4 or more words
// To look at (never fails, and the gate shows each one):
//   - a sentence over 20 words
//   - with compare: simple words that are the client's words, copied
//   - with compare: a number in the client's words that the simple words don't have, or fewer words such as "no"
//
// Not read: fenced code, inline code, comments, link targets, text in double quotes, the columns skipColumns names, and
// the Placeholders and Check record sections. Allowed on purpose: a dash after a bold label at the start of a line or
// cell, such as "**Accept** — Why", a dash before a citation, a gap's label or a reason, such as "— per BR-12" or
// "— why:", the first dash in a heading, and the label "(needs confirmation)".

import fs from 'node:fs';
import path from 'node:path';
import { KIT_ROOT, LayoutError, projectDir, readText, type PathOptions } from './run-paths.ts';
import { list, normalize, tableUnder } from './md-tables.ts';
import { escapeRegExp } from './text.ts';

export interface WritingOptions {
  // Columns not read, by name, such as the client's own words.
  skipColumns?: readonly string[];
  // [simple column, client column]: the two columns whose words are compared.
  compare?: readonly string[];
  // Words always allowed, such as the agreed Glossary words.
  allow?: readonly string[];
}

// One place to fix or to look at: its line, from 1, where it sits, the kind of problem, and what to do.
export interface WritingItem {
  n: number;
  where: string;
  kind: string;
  what: string;
}

export interface WritingResult {
  toFix: WritingItem[];
  toLook: WritingItem[];
}

// A piece of text a reader reads: a line, or one item of a table cell. heading is set for a line only.
interface Piece {
  n: number;
  where: string;
  text: string;
  heading?: boolean;
}

// One table row's simple words and the client's words, to compare.
interface Pair {
  n: number;
  id: string;
  simple: string;
  client: string;
}

// A word or phrase from one of the rules file's lists.
interface ListedWord {
  kind: string;
  word: string;
  instead: string;
  re: RegExp;
}

export const RULES = path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'simple-writing-rules.md');
const LONG = 20;
const SKIP_SECTIONS = ['placeholders', 'check record'];
const UNCHECKED = "word that can't be checked";
const LISTS = [['Hard words', 'hard word'], ['Figures of speech', 'figure of speech'], ['Pointing words', 'pointing word'], ["Words that can't be checked", UNCHECKED]] as const;
// The kinds to fix, in the order the report counts them.
const FIX_KINDS = ['hard word', 'figure of speech', 'pointing word', UNCHECKED, 'semicolon', 'side note'] as const;
// A word that can't be checked is allowed where its question is named, because the question asks for the limit.
const NAMES_QUESTION = /\bquestion \d+/i;
// "and so on" right after 2 items that show the pattern: each one has a digit, or is code, such as "L1, L2 and so on".
const SERIES = /(?:\S*\d\S*|Code)\s*,\s*(?:\S*\d\S*|Code)\s*,?\s*$/;
const NEGATION = /\b(no|not|never|none|nothing|nobody|without|cannot|can't|couldn't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|won't|wouldn't|shouldn't|hasn't|haven't|only)\b/gi;
const NUMBER = /\b\d+(?:[.,]\d+)*\b/g;
// "there" points at a place, unless it starts "there is", "there are" and the like.
const THERE_IS = /^there(?:'s|\s+(?:is|are|was|were|will|would|can|could|must|may|might|should|has|have|had|seems?)\b)/i;
// Labels the kit writes in brackets on purpose, such as "Proposed (needs confirmation)".
const BRACKET_LABELS = /^(needs confirmation|Work Item ID pending|also written as: .*)$/i;
const GLOSSARY_PAGES = ['object-terms.md', 'role-terms.md', 'step-terms.md', 'states-and-values.md'] as const;

let cachedLists: ListedWord[] | null = null;

function pattern(phrase: string, plural = false): RegExp {
  const body = phrase.trim().split(/\s+/).map(escapeRegExp).join('\\s+') + (plural ? '(?:s|es)?' : '');
  return new RegExp(`(?<![A-Za-z0-9'’-])${body}(?![A-Za-z0-9'’-])`, 'gi');
}

function lists(): ListedWord[] {
  if (cachedLists) return cachedLists;
  if (!fs.existsSync(RULES)) throw new LayoutError(`The simple writing rules are missing: ${RULES}`);
  const out: ListedWord[] = [];
  for (const [heading, kind] of LISTS) {
    const rows = tableUnder(RULES, heading);
    if (!rows || !rows.length) throw new LayoutError(`The simple writing rules have no "${heading}" list.`);
    for (const row of rows) {
      const instead = list(row['Say instead']).join(', ');
      for (const word of list(row['Word or phrase'])) out.push({ kind, word, instead, re: pattern(word) });
    }
  }
  cachedLists = out;
  return out;
}

// The kit's own names that stay for now, from the rules file's "Kit names kept for now" list.
function kitNames(): string[] {
  return (tableUnder(RULES, 'Kit names kept for now') || []).map((row) => String(row.Name || '').trim()).filter(Boolean);
}

// What a reader reads: no code, link targets, quotes or bold and italic marks. Code and quotes become one stand-in
// word, so sentences still split and count as the reader sees them.
function readable(s: string): string {
  return s
    .replace(/`[^`]*`/g, 'Code')
    .replace(/<a\s[^>]*>\s*<\/a>/gi, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/"[^"]*"|“[^”]*”/g, 'Quote')
    .replace(/\s+/g, ' ')
    .trim();
}

// What may follow a dash in the kit's own formats: a citation, a gap's label, or the reason for an assumption, such as
// "— per BR-12", "— Proposed (needs confirmation), question 4" or "— why: every amount is in euros". In a template,
// the citation is still a {placeholder}.
const CITED = /\s[—–]\s(?=per\b|Proposed \(needs confirmation\)|TBD\b|AI-RECOMMENDED\b|\[Not specified|\[Needs source|question \d|Decision \d|why: |owned by |\{)/g;
// A label before a dash, at the start of a line or a cell: bold text, an ID such as "F-03.dw1", one word such as
// "Penalty", an FRD rule's source kind, such as "proposed — Why:" or "data model — Loan, Extend", or "Does not apply —".
const LABEL = /^\s*(?:\*\*[^*]+\*\*|[A-Z]+-[\w.]+|[A-Z][\w-]*|req|proposed|decided|data model|Does not apply)\s*[—–]\s*/;

// The kit's own uses of a dash: after a label that starts the text, and before a citation. A label is bold, an ID such
// as "F-03.dw1", or one word such as "Penalty".
function withoutAllowedDashes(s: string, heading: boolean | undefined): string {
  let t = s.replace(LABEL, '').replace(CITED, ' ');
  if (heading) t = t.replace(/\s[—–]\s/, ' ');
  return t.replace(/\*\*|\*/g, '');
}

function cells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

interface ReadState {
  fence: boolean;
  comment: boolean;
}

// The line as a reader sees it, without comments, or null when it sits in fenced code or a comment.
function visibleLine(raw: string, state: ReadState): string | null {
  if (/^\s*```/.test(raw)) { state.fence = !state.fence; return null; }
  if (state.fence) return null;
  let line = raw;
  if (state.comment) {
    if (!line.includes('-->')) return null;
    state.comment = false;
    line = line.slice(line.indexOf('-->') + 3);
  }
  if (line.includes('<!--')) {
    if (!line.includes('-->', line.indexOf('<!--'))) state.comment = true;
    line = line.replace(/<!--.*?(-->|$)/g, '');
  }
  return line;
}

// A line that isn't a table row, without its heading marks, quote mark, bullet or number.
function linePiece(line: string, n: number, section: string): Piece | null {
  const heading = /^\s*#{1,6}\s/.test(line);
  // A bullet is a mark followed by a space, so the stars of a bold label stay.
  const body = line.replace(/^\s*(?:#{1,6}|>|[-*•](?=\s)|\d+\.(?=\s))\s*/, '').replace(/^\s*(?:>|[-*•](?=\s))\s*/, '');
  return body.trim() ? { n, where: section, text: body, heading } : null;
}

// Each item of each cell in a table row, but those in a column skipColumns names.
function cellPieces(row: string[], header: string[], n: number, id: string, skipColumns: readonly string[]): Piece[] {
  const out: Piece[] = [];
  row.forEach((c, k) => {
    const column = header[k] || '';
    if (skipColumns.includes(column)) return;
    for (const item of c.split(/<br\s*\/?>/i)) {
      const body = item.replace(/^\s*(?:•\s*|[-*]\s+)/, '');
      if (body.trim()) out.push({ n, where: `${id}, ${column}`, text: body });
    }
  });
  return out;
}

// Every piece of text a reader reads, with its line number and where it sits: a line, or one item of a table cell.
function pieces(text: string, skipColumns: readonly string[], compare: readonly string[] | undefined): { out: Piece[]; pairs: Pair[] } {
  const out: Piece[] = [];
  const pairs: Pair[] = [];
  const state: ReadState = { fence: false, comment: false };
  let section = 'the top';
  let header: string[] | null = null;
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const n = i + 1;
    const line = visibleLine(raw, state);
    if (line === null) continue;
    const h = line.match(/^##\s+(.*?)\s*$/);
    if (h) section = h[1];
    if (SKIP_SECTIONS.includes(normalize(section))) continue;

    if (!/^\s*\|/.test(line)) {
      header = null;
      const piece = linePiece(line, n, section);
      if (piece) out.push(piece);
      continue;
    }
    const row = cells(line);
    if (row.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    if (!header) {
      header = row;
      for (const c of row) if (c && !skipColumns.includes(c)) out.push({ n, where: `${section}, a column name`, text: c });
      continue;
    }
    const id = readable(row[0] || '').replace(/\*\*|\*/g, '') || section;
    out.push(...cellPieces(row, header, n, id, skipColumns));
    if (compare) {
      const simpleAt = header.indexOf(compare[0]);
      const clientAt = header.indexOf(compare[1]);
      if (simpleAt >= 0 && clientAt >= 0) pairs.push({ n, id, simple: readable(row[simpleAt] || ''), client: readable(row[clientAt] || '') });
    }
  }
  return { out, pairs };
}

function sentences(s: string): string[] {
  return s.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((x) => x.trim()).filter(Boolean);
}

function wordCount(s: string): number {
  return (s.match(/[A-Za-z0-9][A-Za-z0-9'’.\-]*/g) || []).length;
}

function shorten(s: string, max = 90): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

// What one piece has to fix: each listed word, a semicolon, and each side note.
function pieceToFix(piece: Piece, shown: string, words: readonly ListedWord[], allow: readonly RegExp[]): WritingItem[] {
  const toFix: WritingItem[] = [];
  const { n, where } = piece;
  let t = shown;
  for (const re of allow) t = t.replace(re, 'Term');
  const plain = withoutAllowedDashes(t, piece.heading);
  for (const w of words) {
    if (w.kind === UNCHECKED && NAMES_QUESTION.test(plain)) continue;
    w.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = w.re.exec(plain))) {
      if (/^there$/i.test(w.word) && THERE_IS.test(plain.slice(m.index))) continue;
      if (/^and so on$/i.test(w.word) && SERIES.test(plain.slice(0, m.index))) continue;
      toFix.push({ n, where, kind: w.kind, what: `"${m[0]}". Say instead: ${w.instead}.` });
    }
  }
  if (plain.includes(';')) toFix.push({ n, where, kind: 'semicolon', what: 'a semicolon joins two ideas. Split them.' });
  if (/\s[—–]\s/.test(plain)) toFix.push({ n, where, kind: 'side note', what: 'a side note after a dash. Make it its own sentence.' });
  for (const b of plain.match(/\(([^)]*)\)/g) || []) {
    const inside = b.slice(1, -1).trim();
    if (wordCount(inside) >= 4 && !BRACKET_LABELS.test(inside)) toFix.push({ n, where, kind: 'side note', what: `a side note in brackets: "${shorten(b, 50)}". Make it its own sentence.` });
  }
  return toFix;
}

// Long sentences are counted and shown in the document's own words, not with allowed words replaced.
function longSentences(piece: Piece, shown: string): WritingItem[] {
  const toLook: WritingItem[] = [];
  for (const s of sentences(withoutAllowedDashes(shown, piece.heading))) {
    const c = wordCount(s);
    if (c > LONG) toLook.push({ n: piece.n, where: piece.where, kind: 'long sentence', what: `a sentence of ${c} words: "${shorten(s)}"` });
  }
  return toLook;
}

const comparable = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Facts are compared without a bold title at the start: a client row's title rides on its first part, but it names the
// whole row.
const withoutTitle = (s: string): string => s.replace(/^\*\*[^*]+\*\*\s*[—–]\s*/, '');

// What a row's simple words lost from the client's words: a plain copy, a number, or a word such as "no".
function pairToLook(pair: Pair): WritingItem[] {
  const toLook: WritingItem[] = [];
  const { n, id: where } = pair;
  // A copy that breaks a rule is already to fix. A copy of words that are already simple is only shown.
  if (pair.simple && comparable(pair.simple) === comparable(pair.client)) toLook.push({ n, where, kind: 'copied', what: "the simple words are the client's words, copied. Check that they say who does what, one idea at a time." });
  const simpleNumbers = new Set(withoutTitle(pair.simple).match(NUMBER) || []);
  for (const num of new Set(withoutTitle(pair.client).match(NUMBER) || [])) {
    if (!simpleNumbers.has(num)) toLook.push({ n, where, kind: 'number', what: `the client's words have ${num}, and the simple words don't.` });
  }
  const negClient = (withoutTitle(pair.client).match(NEGATION) || []).length;
  const negSimple = (withoutTitle(pair.simple).match(NEGATION) || []).length;
  if (negSimple < negClient) toLook.push({ n, where, kind: 'condition', what: `the client's words have ${negClient} of the words "no", "not", "never" and the like, and the simple words have ${negSimple}.` });
  return toLook;
}

export function check(text: string, opts: WritingOptions = {}): WritingResult {
  const words = lists();
  // An allowed word is allowed in the plural too, such as "artifacts" for the Glossary's "Artifact".
  const allow = [...(opts.allow || []), ...kitNames()].filter((w) => w && w.trim()).sort((a, b) => b.length - a.length).map((w) => pattern(w, true));
  const { out, pairs } = pieces(text, opts.skipColumns || [], opts.compare);
  const toFix: WritingItem[] = [];
  const toLook: WritingItem[] = [];
  for (const piece of out) {
    const shown = readable(piece.text);
    if (!shown) continue;
    toFix.push(...pieceToFix(piece, shown, words, allow));
    toLook.push(...longSentences(piece, shown));
  }
  for (const pair of pairs) toLook.push(...pairToLook(pair));
  return { toFix, toLook };
}

// The agreed Glossary words and their values, from the project's Glossary pages, when it has them.
export function glossaryTerms(project: string, opts: PathOptions = {}): string[] {
  let dir: string;
  try { dir = path.join(projectDir(project, opts), 'glossary'); } catch { return []; }
  const out: string[] = [];
  for (const page of GLOSSARY_PAGES) {
    const file = path.join(dir, page);
    if (!fs.existsSync(file)) continue;
    for (const line of readText(file).split(/\r?\n/)) {
      const term = line.match(/^\|\s*<a id="[^"]+"><\/a>([^|]+?)\s*\|/);
      if (term) out.push(term[1].trim());
    }
    if (page === 'states-and-values.md') {
      for (const line of readText(file).split(/\r?\n/)) {
        if (!/^\|\s*<a id=/.test(line)) continue;
        const values = cells(line)[3] || '';
        out.push(...values.split(/<br\s*\/?>/i).map((v) => v.replace(/^\s*•\s*/, '').trim()).filter((v) => v && v !== '-'));
      }
    }
  }
  return [...new Set(out)];
}

// The first items, one line each, then a line for how many more there are.
function itemLines(items: readonly WritingItem[], limit: number): string[] {
  const lines = items.slice(0, limit).map((x) => `- line ${x.n}, ${x.where}: ${x.what}`);
  if (items.length > limit) lines.push(`- and ${items.length - limit} more`);
  return lines;
}

export function report(name: string, result: WritingResult, limit = 40): string {
  const { toFix, toLook } = result;
  const byKind: Record<string, number> = {};
  for (const x of toFix) byKind[x.kind] = (byKind[x.kind] || 0) + 1;
  const lines = ['For the person:', `Simple writing, ${name}: ${toFix.length} to fix, ${toLook.length} to look at.`, ''];
  if (toFix.length) {
    lines.push('To fix, by kind:');
    for (const kind of FIX_KINDS) if (byKind[kind]) lines.push(`- ${kind}: ${byKind[kind]}`);
    lines.push('', 'To fix:', ...itemLines(toFix, limit), '');
  }
  if (toLook.length) lines.push('To look at:', ...itemLines(toLook, limit), '');
  lines.push('One line:', `check-simple-writing.ts, ${name}: ${toFix.length} to fix, ${toLook.length} to look at.`, '');
  return lines.join('\n');
}
