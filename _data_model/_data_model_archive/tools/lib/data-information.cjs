'use strict';
// data-information.cjs — what the Data and Information programs share: where the data/ documents and their templates
// are, how a cell is read, and whether an answer is complete (_shared/data-information.md, "How every item is answered").
//
// Exports:
//   DOCS                                    the data/ documents, by name, and their paths inside the project
//   pathOf(project, document, opts)         a data/ document's full path
//   relOf(document)                         its path inside the project folder
//   templatePath(name)                      a template's path
//   load(project, document, opts)           the document's text, path and status line
//   allRows(text)                           every table row in a document, each with its _heading
//   plain(cell)                             a cell as plain text: no anchors, links as their text, no bold
//   items(cell)                             a cell as a list of plain items, without "None"
//   linkText(cell)                          the text of the first link in a cell, or the cell as plain text
//   answerProblem(cell)                     why a cell isn't a complete answer, or null
//   sections(text, template)                findings: the template's sections missing, out of order, or extra
//   sectionText(text, heading)              the raw text of one level-2 section, code blocks included
//
// Until project-folders.md lists the data/ documents, the paths come from DOCS; once it does, from the layout. The
// templates are looked for in .claude/skills/_shared/templates first, then in _shared/templates in the kit's root.

const fs = require('fs');
const path = require('path');
const rp = require('./run-paths.cjs');
const md = require('./md-tables.cjs');

const DOCS = {
  'data-inventory': 'data/inventory.json',
  'data-model': 'data/data-model.md',
  'data-dictionary': 'data/data-dictionary.md',
  'state-models': 'data/state-models.md',
  'data-flows': 'data/data-flows.md',
  interfaces: 'data/interfaces.md',
};

function inLayout(document) {
  try {
    return document in rp.layout();
  } catch (e) {
    if (e instanceof rp.LayoutError) return false;
    throw e;
  }
}

function relOf(document) {
  if (!(document in DOCS)) throw new rp.LayoutError(`"${document}" is not a Data and Information document. Known documents:\n${Object.keys(DOCS).map((k) => `- ${k}`).join('\n')}`);
  return inLayout(document) ? rp.relOf(document, {}) : DOCS[document];
}

function pathOf(project, document, opts = {}) {
  return path.join(rp.projectDir(project, opts), relOf(document));
}

const TEMPLATE_DIRS = [
  path.join(rp.KIT_ROOT, '.claude', 'skills', '_shared', 'templates'),
  path.join(rp.KIT_ROOT, '_shared', 'templates'),
];

function templatePath(name) {
  for (const d of TEMPLATE_DIRS) {
    const f = path.join(d, `${name}.md`);
    if (fs.existsSync(f)) return f;
  }
  throw new rp.LayoutError(`The template ${name}.md is missing from:\n${TEMPLATE_DIRS.map((d) => `- ${d}`).join('\n')}`);
}

function load(project, document, opts = {}) {
  const file = pathOf(project, document, opts);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`The document isn't there yet: ${file}`);
  const text = fs.readFileSync(file, 'utf8');
  const s = text.match(/^Status: (drafted|accepted on (\d{4}-\d{2}-\d{2}), version (\d+)|parked on .*)\s*$/m);
  const status = !s ? null : s[1] === 'drafted' ? 'drafted' : s[2] ? 'accepted' : 'parked';
  return { file, rel: relOf(document), text, status, acceptedOn: s && s[2], version: s && s[3] && Number(s[3]) };
}

// Every row of every table, under one made-up heading that holds the whole document.
function allRows(text) {
  return md.tableUnder(`# __all__\n${text.replace(/^# .*$/gm, '')}`, '__all__') || [];
}

function plain(cell) {
  const t = Array.isArray(cell) ? cell.join(' ') : String(cell === undefined || cell === null ? '' : cell);
  return t
    .replace(/<a id="[^"]*"><\/a>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim();
}

function items(cell) {
  return md.list(cell).map(plain).filter((x) => x && x !== '-' && !/^none\.?$/i.test(x));
}

function linkText(cell) {
  const t = Array.isArray(cell) ? cell.join(' ') : String(cell || '');
  const m = t.match(/\[([^\]]+)\]\(/);
  return m ? m[1].trim() : plain(t);
}

// An answer is "per" its source, "TBD, question {n}", or "Does not apply:" and the reason. Nothing else.
function answerProblem(cell) {
  const t = plain(cell);
  if (!t || t === '-' || /^\{[^}]+\}$/.test(t)) return 'is blank';
  if (/\bTBD\b/.test(t) && !/\bTBD, question \d+/.test(t)) return 'has a TBD that names no question';
  if (/^Does not apply\b/i.test(t) && !/^Does not apply: \S/.test(t)) return 'says "Does not apply" without a reason';
  if (/\bTBD, question \d+/.test(t) || /^Does not apply: \S/.test(t)) return null;
  if (!/\bper\b/i.test(t)) return 'names no source: an answer says "per" and where it came from';
  return null;
}

// A template heading as a pattern: each {placeholder} matches any text.
function headingPattern(h) {
  const parts = h.split(/\{[^}]+\}/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${parts.join('.+')}$`);
}

function sections(text, template) {
  const want = md.headings(fs.readFileSync(templatePath(template), 'utf8')).filter((h) => h.level === 2 && h.text !== 'Placeholders').map((h) => h.text);
  const have = md.headings(text).filter((h) => h.level === 2).map((h) => h.text);
  const f = [];
  let from = 0;
  for (const w of want) {
    const re = headingPattern(w);
    const i = have.findIndex((h, k) => k >= from && re.test(h));
    if (i < 0) f.push(have.some((h) => re.test(h)) ? `The section "${w}" is out of order.` : `The section "${w}" is missing.`);
    else from = i + 1;
  }
  for (const h of have) {
    if (h === 'Placeholders') f.push('The document carries the template\'s Placeholders section, which is never copied in.');
    else if (!want.some((w) => headingPattern(w).test(h))) f.push(`The section "${h}" isn't in the template.`);
  }
  return f;
}

function sectionText(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i').test(l));
  if (start < 0) return null;
  let fence = false;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) fence = !fence;
    if (!fence && /^##?\s/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end).join('\n');
}

module.exports = { DOCS, pathOf, relOf, templatePath, load, allRows, plain, items, linkText, answerProblem, sections, sectionText };
