'use strict';
// scan-retired-words.cjs — finds the glossary's retired words used in a document, outside quoted text, so a check
// program can say which word to use now.
//
// Exports:
//   retiredWords(project, opts)    every earlier word in the four kind pages' "Terms replaced or retired over time"
//                                  tables, with the terms to use now
//   currentTerms(project, opts)    every term defined on the four kind pages
//   scan(text, retired, current, template)
//                                  each retired word used in the text: { line, word, earlier, useNow }. template is
//                                  the name of the document's template, such as "feature-catalog".
//
// What scan skips, because none of it is the document's own words:
//   - the kit's own text: every line that is word for word a line of the document's template, such as a table's
//     column names or the line in italics that says what a section holds. A client's Glossary may retire a word the
//     kit itself uses, such as "source", and the kit's own words are never the product's.
//   - the Decision record, whose options stay exactly as they were offered, and the Check record, which a program
//     writes
//   - quoted passages: lines starting with ">", and text inside double quotes
//   - the cells of an ID column, such as "ID", "BR ID" or "#"
//   - code: fenced blocks and `code spans`, and the path of a link
//   - a term used today, with or without a plural, and a retired word inside it, such as "claim" inside "Expense
//     claims"
// A retired word is found whole, in any case, with or without a plural "s" or "es".
//
// The tables it reads are written from the gate log by build-retired-words-tables.cjs, never by hand.

const fs = require('fs');
const path = require('path');
const rp = require('./run-paths.cjs');
const md = require('./md-tables.cjs');

const PAGES = ['object-terms', 'role-terms', 'step-terms', 'states-and-values'];
const RETIRED_HEADING = 'Terms replaced or retired over time';
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const plainOf = (cell) => md.list(cell).map((x) => String(x).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim()).filter((x) => x && x !== '-');

function pages(project, opts) {
  return PAGES.map((p) => {
    const file = rp.pathOf(project, p, {}, opts);
    if (!fs.existsSync(file)) throw new rp.LayoutError(`The Glossary page isn't there: ${file}`);
    return rp.readText(file);
  });
}

function retiredWords(project, opts = {}) {
  const out = [];
  for (const t of pages(project, opts)) {
    for (const r of md.tableUnder(t, RETIRED_HEADING) || []) {
      const earlier = String(r['Earlier word'] || '').trim();
      if (earlier && !/^\{/.test(earlier)) out.push({ earlier, useNow: plainOf(r['Use now']) });
    }
  }
  return out;
}

// A term is written after its anchor in its page's main tables: <a id="cart"></a>Cart
function currentTerms(project, opts = {}) {
  const out = [];
  for (const t of pages(project, opts)) {
    const main = t.indexOf(`## ${RETIRED_HEADING}`) >= 0 ? t.slice(0, t.indexOf(`## ${RETIRED_HEADING}`)) : t;
    for (const m of main.matchAll(/<a id="[^"]+"><\/a>\s*([^|<\n]+)/g)) out.push(m[1].trim());
  }
  return [...new Set(out)];
}

function blank(s) {
  return ' '.repeat(s.length);
}

// The lines of a document's template, trimmed, so the kit's own text can be told from the document's.
function templateLines(name) {
  if (!name) return new Set();
  const file = path.join(rp.KIT_ROOT, '.claude', 'skills', '_shared', 'templates', `${name}.md`);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`The template isn't there: ${file}`);
  return new Set(rp.readText(file).split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
}

function scan(text, retired, current = [], template = null) {
  const hits = [];
  const kit = templateLines(template);
  const terms = current.slice().sort((a, b) => b.length - a.length).map((t) => new RegExp(`\\b${escape(t)}(?:s|es)?\\b`, 'gi'));
  const words = retired.map((r) => ({ ...r, re: new RegExp(`\\b${escape(r.earlier)}(?:s|es)?\\b`, 'gi') }));
  let fence = false;
  let records = false;
  let idColumns = null;
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    if (/^\s*```/.test(raw)) { fence = !fence; return; }
    const h = raw.match(/^##\s+(.*?)\s*$/);
    if (h) records = /^(decision record|check record)$/i.test(md.normalize(h[1]));
    if (fence || records || /^\s*>/.test(raw) || kit.has(raw.trim())) return;
    let line = raw;
    if (/^\s*\|/.test(line)) {
      const cells = line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/);
      if (i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        idColumns = cells.map((c) => /(^|\s)ID$|^#$/i.test(c.trim()));
      } else if (/^\s*\|?\s*:?-{2,}/.test(line)) {
        return;
      } else if (idColumns) {
        line = `|${cells.map((c, k) => (idColumns[k] ? blank(c) : c)).join('|')}|`;
      }
    } else idColumns = null;
    line = line
      .replace(/`[^`]*`/g, blank)
      .replace(/\]\([^)]*\)/g, blank)
      .replace(/"[^"\n]*"|“[^”\n]*”/g, blank);
    for (const re of terms) line = line.replace(re, blank);
    for (const w of words) {
      for (const m of line.matchAll(w.re)) hits.push({ line: i + 1, at: m.index, word: m[0], earlier: w.earlier, useNow: w.useNow });
    }
  });
  // In reading order: by line, then by place in the line.
  return hits.sort((a, b) => a.line - b.line || a.at - b.at).map(({ at, ...h }) => h);
}

module.exports = { retiredWords, currentTerms, scan };
