// one-per-row.ts — lists the rows that may hold two requirements, against _shared/atomic-rules.md, part 4.
//
// Exports:
//   check(rows)             [{ id, kind, what }]: each row that may hold two requirements, in the order given. Each
//                           one is to look at. The check never fails a row, because only a person can judge it.
//   notices(found, noun)    the lines "For the person" shows: one line that counts the rows, then "- {id}" for each.
//                           noun names one row, such as "rule" or "feature name". Nothing found gives no line.
//   KINDS                   the kinds of row the check reads
//   RULES                   the path of the rules file
//
// rows: [{ id, text, kind }]. The kind says how the text is read. It is 'statement' when it is left out.
//   - 'statement': sentences, such as a requirement, a business requirement or a feature's description. A bold title
//     at the start, such as "**Title** — ", is not read. A sentence is listed when an action word, such as "can",
//     "must" or "shall", comes before "and" or "or", and a second action follows.
//   - 'action': a text that starts with its action, such as an FRD rule, read after "The system shall", or a story's
//     "I want" part. It is listed when a second action follows "and" or "or".
//   - 'step': a scenario's When, with each line under it that starts with "And", joined by " and ". It is listed when
//     it holds "and" or "or", unless a number or a word such as "more" follows, as in "one or more".
//   - 'name': a short name, such as a feature's name or a story's title. It is listed when it holds "and", "or",
//     "plus", "/", "&" or a comma.
//
// A second action follows "and" or "or" when the next word is not a word such as "the", "each" or "what", a number,
// or a word with a capital letter, such as a value, and one of these is true:
//   - a word such as "the", "it" or "every" comes after it, as in "or remove it" or "or reject every claim"
//   - it ends in "ed", and so does the word before "and" or "or", as in "paused, stopped and restarted"
//   - the word before "and" or "or" is the first action, as in "can approve or reject", or an FRD rule's first word
// So "a street, a city and a postcode" and "epics and stories" are never listed.
// In every kind but 'name', a row is also listed when "and no", "and not", "and never", "or no", "or never" or "nor"
// joins two things that are not allowed. "whether or not" joins nothing.
// Not read: a sentence's "so that" part, which gives the reason. Inline code and a bold value, such as
// "**not tested**", each count as one name. A bold "not", "no", "never" or "only" counts as the word.

import path from 'node:path';
import { KIT_ROOT } from './run-paths.ts';

export const RULES = path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'atomic-rules.md');
export const KINDS = ['statement', 'action', 'step', 'name'] as const;
export type RowKind = (typeof KINDS)[number];

// A row to read: its ID, its text, and how the text is read. The kind is 'statement' when it is left out.
export interface RowToRead {
  id: string;
  text: string;
  kind?: RowKind;
}

// A row that may hold two requirements, and why.
export interface MaybeTwo {
  id: string;
  kind: RowKind;
  what: string;
}

// A word that says what someone or something may, must or will do. The action it names comes after it. "to" is one
// only after "need", "want" or "able".
const ACTION_WORDS = new Set(['can', 'cannot', "can't", 'could', 'must', 'may', 'shall', 'should', 'will', "won't", 'let', 'lets', 'allow', 'allows']);
const TO_AFTER = new Set(['need', 'needs', 'want', 'wants', 'able']);
// Two things not allowed, such as "no guest checkout and no gift wrapping".
const TWO_NOES = /\b(?:and|or)\s+(?:no|not|never)\b|\bnor\b/i;
// Words that start no second action: a word such as "the" or "each", a word for how many, or a word such as "what".
const NO_ACTION = new Set(['a', 'an', 'the', 'this', 'that', 'these', 'those', 'its', 'their', 'his', 'her', 'our', 'your', 'my', 'each', 'every', 'all', 'any', 'some', 'both', 'either', 'neither', 'other', 'another', 'many', 'few', 'several', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'more', 'less', 'fewer', 'so', 'what', 'which', 'who', 'how', 'when', 'where', 'why', 'whether', 'and', 'or']);
// Words that start what an action is done to, as in "remove it" or "reject every claim".
const OBJECT = new Set(['a', 'an', 'the', 'this', 'that', 'these', 'those', 'its', 'their', 'his', 'her', 'our', 'your', 'my', 'each', 'every', 'all', 'any', 'some', 'it', 'them', 'him', 'me', 'us', 'you']);
// In a scenario's When, only a word for how many may follow "and" or "or", as in "one or more" or "and so on".
const HOW_MANY = new Set(['more', 'less', 'fewer', 'so']);
const TITLE = /^\s*\*\*[^*]+\*\*\s*[—–]\s*/;
const NAME_JOIN = /\b(?:and|or|plus)\b|[/&,]/i;
const TOKEN = /[A-Za-z0-9][\w'’-]*|[,;:]/g;

// What a reader reads. Inline code and a bold value, such as "**not tested**", each become one name. A bold "not",
// "no", "never" or "only" stays a word, without its bold marks. "whether or not" joins nothing.
function plain(s: string): string {
  return String(s || '')
    .replace(/`[^`]*`/g, 'Code')
    .replace(/\*\*(not|no|never|only)\*\*/gi, '$1')
    .replace(/\*\*[^*]+\*\*/g, 'Value')
    .replace(/\bwhether or not\b/gi, 'whether')
    .replace(/\s+/g, ' ')
    .trim();
}

// Each sentence, without its "so that" part, which gives the reason. Only a person can judge whether the product
// must do that part too.
function sentences(s: string): string[] {
  return s.split(/(?<=[.!?])\s+/).map((x) => x.split(/,?\s+so that\b/i)[0]).filter(Boolean);
}

const isWord = (t: string | undefined): t is string => t !== undefined && /^[A-Za-z0-9]/.test(t);

// Where the first action is: the word after the first action word in a sentence, or the first word of an action.
// A "to" or "be" before it is skipped, as in "to approve" or "can be paused". -1 when there is no action word.
function firstAction(tokens: string[], kind: RowKind): number {
  let at = -1;
  if (kind === 'action') at = 0;
  else {
    const w = tokens.map((t) => t.toLowerCase());
    const i = w.findIndex((t, k) => ACTION_WORDS.has(t) || (t === 'to' && TO_AFTER.has(w[k - 1])));
    if (i < 0) return -1;
    at = i + 1;
  }
  while (at < tokens.length && ['to', 'be'].includes(tokens[at].toLowerCase())) at++;
  return at;
}

// Is a second action joined at tokens[i], an "and" or an "or"?
function joinsActions(tokens: string[], i: number, first: number): boolean {
  const after = tokens[i + 1];
  if (!isWord(after) || NO_ACTION.has(after.toLowerCase()) || /^\d/.test(after) || /^[A-Z]/.test(after)) return false;
  const b = isWord(tokens[i - 1]) ? i - 1 : i - 2;
  const before = tokens[b] || '';
  const next = tokens[i + 2];
  if (isWord(next) && OBJECT.has(next.toLowerCase())) return true;
  if (/ed$/i.test(after) && /ed$/i.test(before)) return true;
  return b === first;
}

// Why the text may hold two requirements, or null.
function reason(text: string, kind: RowKind): string | null {
  const t = plain(kind === 'statement' ? String(text || '').replace(TITLE, '') : text);
  if (!t) return null;
  if (kind === 'name') return NAME_JOIN.test(t) ? 'two things in one name' : null;
  const parts = sentences(t);
  if (parts.some((s) => TWO_NOES.test(s))) return 'two things not allowed';
  for (const s of parts) {
    const tokens = s.match(TOKEN) || [];
    const first = firstAction(tokens, kind);
    for (let i = 0; i < tokens.length; i++) {
      const join = tokens[i].toLowerCase();
      if (join !== 'and' && join !== 'or') continue;
      if (kind === 'step') {
        const after = tokens[i + 1];
        if (isWord(after) && !/^\d/.test(after) && !HOW_MANY.has(after.toLowerCase())) return `two actions joined by "${join}"`;
        continue;
      }
      if (kind === 'statement' && (first < 0 || first > i)) continue;
      if (joinsActions(tokens, i, first)) return `two actions joined by "${join}"`;
    }
  }
  return null;
}

export function check(rows: readonly RowToRead[]): MaybeTwo[] {
  const out: MaybeTwo[] = [];
  for (const r of rows) {
    const kind = r.kind || 'statement';
    // A caller may still hand over a kind the type doesn't know, so the check stays.
    if (!(KINDS as readonly string[]).includes(kind)) throw new Error(`one-per-row.ts: "${kind}" isn't a kind of row. Use ${KINDS.join(', ')}.`);
    const what = reason(r.text, kind);
    if (what) out.push({ id: r.id, kind, what });
  }
  return out;
}

function count(n: number, noun: string): string {
  if (n === 1) return `1 ${noun}`;
  return `${n} ${/[^aeiou]y$/.test(noun) ? `${noun.slice(0, -1)}ie` : noun}s`;
}

export function notices(found: readonly MaybeTwo[], noun = 'row'): string[] {
  if (!found.length) return [];
  const names = found.every((f) => f.kind === 'name');
  const what = names ? 'may name two things joined by "and", "or", "/" or a comma' : 'may hold two actions joined by "and" or "or"';
  return [`One requirement per row, to look at: ${count(found.length, noun)} ${what}. Split each one whose ${names ? 'parts' : 'actions'} can be built on their own.`, ...found.map((f) => `- ${f.id}`)];
}
