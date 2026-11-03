'use strict';
// simple-writing.cjs — checks a document against _shared/simple-writing-rules.md.
//
// Exports:
//   check(text, opts)              { toFix, toLook }: each item is { n, where, kind, what }
//   glossaryTerms(project, opts)   the agreed Glossary words and values, which the check never flags
//   report(name, result, limit)    the result as text, for check-simple-writing.cjs
//   RULES                          the path of the rules file
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

const fs = require('fs');
const path = require('path');
const rp = require('./run-paths.cjs');
const md = require('./md-tables.cjs');

const RULES = path.join(rp.KIT_ROOT, '.claude', 'skills', '_shared', 'simple-writing-rules.md');
const LONG = 20;
const SKIP_SECTIONS = ['placeholders', 'check record'];
const UNCHECKED = "word that can't be checked";
const LISTS = [['Hard words', 'hard word'], ['Figures of speech', 'figure of speech'], ['Pointing words', 'pointing word'], ["Words that can't be checked", UNCHECKED]];
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
const GLOSSARY_PAGES = ['object-terms.md', 'role-terms.md', 'step-terms.md', 'states-and-values.md'];

let cachedLists = null;

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pattern(phrase, plural = false) {
  const body = phrase.trim().split(/\s+/).map(escape).join('\\s+') + (plural ? '(?:s|es)?' : '');
  return new RegExp(`(?<![A-Za-z0-9'’-])${body}(?![A-Za-z0-9'’-])`, 'gi');
}

function lists() {
  if (cachedLists) return cachedLists;
  if (!fs.existsSync(RULES)) throw new rp.LayoutError(`The simple writing rules are missing: ${RULES}`);
  const out = [];
  for (const [heading, kind] of LISTS) {
    const rows = md.tableUnder(RULES, heading);
    if (!rows || !rows.length) throw new rp.LayoutError(`The simple writing rules have no "${heading}" list.`);
    for (const r of rows) {
      const instead = md.list(r['Say instead']).join(', ');
      for (const word of md.list(r['Word or phrase'])) out.push({ kind, word, instead, re: pattern(word) });
    }
  }
  cachedLists = out;
  return out;
}

// The kit's own names that stay for now, from the rules file's "Kit names kept for now" list.
function kitNames() {
  return (md.tableUnder(RULES, 'Kit names kept for now') || []).map((r) => String(r.Name || '').trim()).filter(Boolean);
}

// What a reader reads: no code, link targets, quotes or bold and italic marks. Code and quotes become one stand-in
// word, so sentences still split and count as the reader sees them.
function readable(s) {
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
function withoutAllowedDashes(s, heading) {
  let t = s.replace(LABEL, '').replace(CITED, ' ');
  if (heading) t = t.replace(/\s[—–]\s/, ' ');
  return t.replace(/\*\*|\*/g, '');
}

function cells(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

// Every piece of text a reader reads, with its line number and where it sits: a line, or one item of a table cell.
function pieces(text, skipColumns, compare) {
  const out = [];
  const pairs = [];
  let fence = false;
  let comment = false;
  let section = 'the top';
  let header = null;
  text.split(/\r?\n/).forEach((raw, i) => {
    const n = i + 1;
    if (/^\s*```/.test(raw)) { fence = !fence; return; }
    if (fence) return;
    let line = raw;
    if (comment) {
      if (!line.includes('-->')) return;
      comment = false;
      line = line.slice(line.indexOf('-->') + 3);
    }
    if (line.includes('<!--')) {
      if (!line.includes('-->', line.indexOf('<!--'))) comment = true;
      line = line.replace(/<!--.*?(-->|$)/g, '');
    }
    const h = line.match(/^##\s+(.*?)\s*$/);
    if (h) section = h[1];
    if (SKIP_SECTIONS.includes(md.normalize(section))) return;

    if (!/^\s*\|/.test(line)) {
      header = null;
      const heading = /^\s*#{1,6}\s/.test(line);
      // A bullet is a mark followed by a space, so the stars of a bold label stay.
      const body = line.replace(/^\s*(?:#{1,6}|>|[-*•](?=\s)|\d+\.(?=\s))\s*/, '').replace(/^\s*(?:>|[-*•](?=\s))\s*/, '');
      if (body.trim()) out.push({ n, where: section, text: body, heading });
      return;
    }
    const row = cells(line);
    if (row.every((c) => /^:?-{2,}:?$/.test(c))) return;
    if (!header) {
      header = row;
      row.forEach((c) => { if (c && !skipColumns.includes(c)) out.push({ n, where: `${section}, a column name`, text: c }); });
      return;
    }
    const id = readable(row[0] || '').replace(/\*\*|\*/g, '') || section;
    row.forEach((c, k) => {
      const column = header[k] || '';
      if (skipColumns.includes(column)) return;
      for (const item of c.split(/<br\s*\/?>/i)) {
        const body = item.replace(/^\s*(?:•\s*|[-*]\s+)/, '');
        if (body.trim()) out.push({ n, where: `${id}, ${column}`, text: body });
      }
    });
    if (compare) {
      const p = header.indexOf(compare[0]);
      const c = header.indexOf(compare[1]);
      if (p >= 0 && c >= 0) pairs.push({ n, id, simple: readable(row[p] || ''), client: readable(row[c] || '') });
    }
  });
  return { out, pairs };
}

function sentences(s) {
  return s.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((x) => x.trim()).filter(Boolean);
}

function wordCount(s) {
  return (s.match(/[A-Za-z0-9][A-Za-z0-9'’.\-]*/g) || []).length;
}

function shorten(s, max = 90) {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function check(text, opts = {}) {
  const words = lists();
  // An allowed word is allowed in the plural too, such as "artifacts" for the Glossary's "Artifact".
  const allow = [...(opts.allow || []), ...kitNames()].filter((w) => w && w.trim()).sort((a, b) => b.length - a.length).map((w) => pattern(w, true));
  const { out, pairs } = pieces(text, opts.skipColumns || [], opts.compare);
  const toFix = [];
  const toLook = [];
  for (const p of out) {
    const shown = readable(p.text);
    if (!shown) continue;
    let t = shown;
    for (const re of allow) t = t.replace(re, 'Term');
    const plain = withoutAllowedDashes(t, p.heading);
    for (const w of words) {
      if (w.kind === UNCHECKED && NAMES_QUESTION.test(plain)) continue;
      w.re.lastIndex = 0;
      let m;
      while ((m = w.re.exec(plain))) {
        if (/^there$/i.test(w.word) && THERE_IS.test(plain.slice(m.index))) continue;
        if (/^and so on$/i.test(w.word) && SERIES.test(plain.slice(0, m.index))) continue;
        toFix.push({ n: p.n, where: p.where, kind: w.kind, what: `"${m[0]}". Say instead: ${w.instead}.` });
      }
    }
    if (plain.includes(';')) toFix.push({ n: p.n, where: p.where, kind: 'semicolon', what: 'a semicolon joins two ideas. Split them.' });
    if (/\s[—–]\s/.test(plain)) toFix.push({ n: p.n, where: p.where, kind: 'side note', what: 'a side note after a dash. Make it its own sentence.' });
    for (const b of plain.match(/\(([^)]*)\)/g) || []) {
      const inside = b.slice(1, -1).trim();
      if (wordCount(inside) >= 4 && !BRACKET_LABELS.test(inside)) toFix.push({ n: p.n, where: p.where, kind: 'side note', what: `a side note in brackets: "${shorten(b, 50)}". Make it its own sentence.` });
    }
    // Long sentences are counted and shown in the document's own words, not with allowed words replaced.
    for (const s of sentences(withoutAllowedDashes(shown, p.heading))) {
      const c = wordCount(s);
      if (c > LONG) toLook.push({ n: p.n, where: p.where, kind: 'long sentence', what: `a sentence of ${c} words: "${shorten(s)}"` });
    }
  }
  for (const p of pairs) {
    const same = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    // A copy that breaks a rule is already to fix. A copy of words that are already simple is only shown.
    if (p.simple && same(p.simple) === same(p.client)) toLook.push({ n: p.n, where: p.id, kind: 'copied', what: "the simple words are the client's words, copied. Check that they say who does what, one idea at a time." });
    // Facts are compared without a bold title at the start: a client row's title rides on its first part, but it
    // names the whole row.
    const body = (s) => s.replace(/^\*\*[^*]+\*\*\s*[—–]\s*/, '');
    const simpleNumbers = new Set(body(p.simple).match(NUMBER) || []);
    for (const num of new Set(body(p.client).match(NUMBER) || [])) {
      if (!simpleNumbers.has(num)) toLook.push({ n: p.n, where: p.id, kind: 'number', what: `the client's words have ${num}, and the simple words don't.` });
    }
    const negClient = (body(p.client).match(NEGATION) || []).length;
    const negSimple = (body(p.simple).match(NEGATION) || []).length;
    if (negSimple < negClient) toLook.push({ n: p.n, where: p.id, kind: 'condition', what: `the client's words have ${negClient} of the words "no", "not", "never" and the like, and the simple words have ${negSimple}.` });
  }
  return { toFix, toLook };
}

// The agreed Glossary words and their values, from the project's Glossary pages, when it has them.
function glossaryTerms(project, opts = {}) {
  let dir;
  try { dir = path.join(rp.projectDir(project, opts), 'glossary'); } catch (e) { return []; }
  const out = [];
  for (const page of GLOSSARY_PAGES) {
    const file = path.join(dir, page);
    if (!fs.existsSync(file)) continue;
    for (const line of rp.readText(file).split(/\r?\n/)) {
      const term = line.match(/^\|\s*<a id="[^"]+"><\/a>([^|]+?)\s*\|/);
      if (term) out.push(term[1].trim());
    }
    if (page === 'states-and-values.md') {
      for (const line of rp.readText(file).split(/\r?\n/)) {
        if (!/^\|\s*<a id=/.test(line)) continue;
        const values = cells(line)[3] || '';
        out.push(...values.split(/<br\s*\/?>/i).map((v) => v.replace(/^\s*•\s*/, '').trim()).filter((v) => v && v !== '-'));
      }
    }
  }
  return [...new Set(out)];
}

const KINDS = ['hard word', 'figure of speech', 'pointing word', UNCHECKED, 'semicolon', 'side note'];

function report(name, r, limit = 40) {
  const count = (items) => items.reduce((c, x) => ({ ...c, [x.kind]: (c[x.kind] || 0) + 1 }), {});
  const c = count(r.toFix);
  const lines = ['For the person:', `Simple writing, ${name}: ${r.toFix.length} to fix, ${r.toLook.length} to look at.`, ''];
  if (r.toFix.length) {
    lines.push('To fix, by kind:');
    for (const k of KINDS) if (c[k]) lines.push(`- ${k}: ${c[k]}`);
    lines.push('', 'To fix:');
    for (const x of r.toFix.slice(0, limit)) lines.push(`- line ${x.n}, ${x.where}: ${x.what}`);
    if (r.toFix.length > limit) lines.push(`- and ${r.toFix.length - limit} more`);
    lines.push('');
  }
  if (r.toLook.length) {
    lines.push('To look at:');
    for (const x of r.toLook.slice(0, limit)) lines.push(`- line ${x.n}, ${x.where}: ${x.what}`);
    if (r.toLook.length > limit) lines.push(`- and ${r.toLook.length - limit} more`);
    lines.push('');
  }
  lines.push('One line:', `check-simple-writing.cjs, ${name}: ${r.toFix.length} to fix, ${r.toLook.length} to look at.`, '');
  return lines.join('\n');
}

module.exports = { check, glossaryTerms, report, RULES };
