'use strict';
// check-document.cjs — the checks every document's check program shares, and the three blocks it prints for its gate
// (decision-review-gates.md, rule 1).
//
// Exports:
//   load(project, document, values, opts)   the document's text, path and status line
//   opening(text)                           findings: the status line is missing, or an opening note is left in
//   openingNotes(text)                      findings: an opening note left in, for a document with no status line
//   sections(text, template)                findings: the template's sections are missing, out of order, or extra
//   placeholders(text)                      findings: a {placeholder} left in the document
//   rendering(text)                         findings: anything lib/md-lint.cjs finds
//   simpleWriting(text, opts)               { findings, notices }: what lib/simple-writing.cjs finds to fix, and to look at
//   requirementsOf(prdText)                 the PRD's requirements, each with its simple words, the client's words and its kind
//   KINDS, KIND_HOME                        the four kinds of PRD row, and the section that holds each kind but Requirement
//   questions(project, opts)                the grader's findings and counts, through grade-questions.cjs
//   questionFindingsFor(doc, graded)        the grader's findings that belong to this document
//   beyond(text)                            every place the document goes beyond, or differs from, the client's words
//   stillNeeded(text, graded)               what we still need from the client: each open question the document names
//   answered(text)                          each decision at this document's gate, with its answer
//   report(spec)                            the three blocks: For the person, One line, For the file
//   epicOf(project, epic, opts)             an EPIC from its ID or folder name: its ID, name, folder and register row
//   changeOf(project, change, opts)         a change from its number or folder name: its folder and its report
//   replaceSection(file, heading, body)     writes what one level-2 section holds, keeping the lines in italics under it
//
// A check is a name and its findings. A document passes when no check has a finding.

const fs = require('fs');
const path = require('path');
const rp = require('./run-paths.cjs');
const md = require('./md-tables.cjs');
const { lint } = require('./md-lint.cjs');
const sw = require('./simple-writing.cjs');

const TEMPLATES = path.join(rp.KIT_ROOT, '.claude', 'skills', '_shared', 'templates');
// The sections that hold records, not content. Nothing in them counts as going beyond the client's words.
const RECORDS = ['decision record', 'check record', 'placeholders'];

function load(project, document, values = {}, opts = {}) {
  const file = rp.pathOf(project, document, values, opts);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`The document isn't there yet: ${file}`);
  const text = rp.readText(file);
  const s = text.match(/^Status: (drafted|accepted on (\d{4}-\d{2}-\d{2}), version (\d+)|parked on .*)\s*$/m);
  const status = !s ? null : s[1] === 'drafted' ? 'drafted' : s[2] ? 'accepted' : 'parked';
  return { file, rel: rp.relOf(document, { product: project, ...values }), text, status, acceptedOn: s && s[2], version: s && s[3] && Number(s[3]) };
}

// Lines outside fenced code blocks, with their numbers from 1 and the level-2 section each one sits in.
function lines(text) {
  const out = [];
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
function openingNotes(text) {
  return ['What this is', 'What it is not', 'Written by', 'Lineage']
    .filter((m) => new RegExp(`^> \\*\\*${m}\\b`, 'm').test(text))
    .map((m) => `The document still has the opening note "${m}": the template's notes stay in its Placeholders part.`);
}

function opening(text) {
  return [...(/^Status: /m.test(text) ? [] : ['The document has no status line.']), ...openingNotes(text)];
}

// A template heading as a pattern: each {placeholder} matches any text.
function headingPattern(h) {
  const parts = h.split(/\{[^}]+\}/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${parts.join('.+')}$`);
}

function sections(text, template) {
  const tFile = path.join(TEMPLATES, `${template}.md`);
  const want = md.headings(rp.readText(tFile)).filter((h) => h.level === 2 && h.text !== 'Placeholders').map((h) => h.text);
  const have = md.headings(text).filter((h) => h.level === 2).map((h) => h.text);
  const f = [];
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

function placeholders(text) {
  const f = [];
  for (const { n, line } of lines(text)) {
    const bare = line.replace(/`[^`]*`/g, '');
    for (const m of bare.matchAll(/\{[^}\n]+\}/g)) f.push(`Line ${n}: the placeholder ${m[0]} is still there.`);
  }
  return f;
}

function rendering(text) {
  return lint(text).map((p) => `Line ${p.line}: ${p.problem}`);
}

// The four kinds of row in the PRD's section 4 (prd-author, step 2), and the section that holds each kind but
// Requirement.
const KINDS = ['Requirement', 'Purpose', 'Scope', 'Way of working'];
const KIND_HOME = { Purpose: 'PRD section 2', Scope: 'BRD section 4', 'Way of working': 'PRD section 8' };

// The PRD's requirements, from section 4, each row with more fields: simple, the requirement in simple words; client,
// the client's own words; kind, from the Kind column; and isRequirement, false only for a Purpose, Scope or Way of
// working row. A PRD with no Kind column has hasKind false, and every row is read as a Requirement, so the later checks
// keep working until it is fixed. A PRD written before simple-writing-rules.md has one column, "Requirement as
// written", under "Requirements, word for word": simple and client then hold that column, and oldForm is true.
function requirementsOf(prdText) {
  const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
  const rows = md.tableUnder(prdText, 'Requirements') || md.tableUnder(prdText, 'Requirements, word for word') || [];
  return rows.map((r) => {
    const oldForm = !('In simple words' in r);
    const hasKind = 'Kind' in r;
    const kind = hasKind ? text(r.Kind) : 'Requirement';
    return { ...r, oldForm, hasKind, kind, isRequirement: !Object.keys(KIND_HOME).includes(kind), simple: text(oldForm ? r['Requirement as written'] : r['In simple words']), client: text(oldForm ? r['Requirement as written'] : r["The client's words"]) };
  });
}

// simple-writing-rules.md: what the check program fails on, and what the gate shows the person to look at.
// opts: { project, output, skipColumns, compare }. The project's agreed Glossary words are always allowed.
function simpleWriting(text, opts = {}) {
  const allow = opts.project ? sw.glossaryTerms(opts.project, { output: opts.output }) : [];
  const r = sw.check(text, { skipColumns: opts.skipColumns, compare: opts.compare, allow });
  const notices = r.toLook.length ? [`Simple writing, to look at: ${plural(r.toLook.length, 'place')}`, ...r.toLook.map((x) => `- Line ${x.n}, ${x.where}: ${x.what}`)] : [];
  return { findings: r.toFix.map((x) => `Line ${x.n}, ${x.where}: ${x.what}`), notices };
}

function questions(project, opts = {}) {
  const grader = require('../grade-questions.cjs');
  return grader.grade(project, { output: opts.output, checkOnly: true });
}

// The grader's findings that belong to this document: its own gaps, the questions it raised, and anything wrong with
// the Question log as a whole. A slip in another document is that document's check's finding, not this one's.
function questionFindingsFor(doc, graded) {
  const name = path.basename(doc.rel);
  const raisedHere = new Set((graded.questions || []).filter((q) => String(q.parts && q.parts['Raised in'] || '').includes(name)).map((q) => q.n));
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
function placeOf(line, mark) {
  if (/^\s*\|/.test(line)) {
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const holder = cells.find((c) => mark.test(c)) || '';
    if (holder === cells[0]) return cells[0];
    const bare = holder.replace(mark, '').replace(/[\s,:.—-]+/g, '');
    const about = cells.slice(1).find((c) => !KINDS.includes(c)) || cells[1];
    return bare ? `${cells[0]}: ${holder}` : `${cells[0]}: ${about}, ${holder}`;
  }
  return line.trim().replace(/^[-*]\s+/, '');
}

function shorten(s, max = 160) {
  const t = s.replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// conventions.md, "Beyond the client's words": every place a document marks as going beyond what the client wrote,
// including an FRD rule whose source is proposed or decided, a rule a data model decision changed, whose note names
// its DM-n, and a data model answer a decision at an FRD's gate changed, whose note reads "Updated from the data model
// on the basis of Decision n".
const BEYOND = /Proposed \(needs confirmation\)|AI-RECOMMENDED|Updated from the requirement on the basis of Decision|Updated from the data model on the basis of Decision|on the basis of DM-\d+|\bproposed — Why:|\bdecided — see Decision/;

function beyond(text) {
  const out = [];
  let decision = null;
  for (const { line, section } of lines(text)) {
    if (/^\s*\*[^*]/.test(line) || /^>/.test(line)) continue; // a rule under a heading, or the opening and summary blocks
    const inRecord = RECORDS.includes(md.normalize(section));
    if (!inRecord && BEYOND.test(line)) out.push(`${section}: ${shorten(placeOf(line, BEYOND))}`);
    if (md.normalize(section) === 'decision record') {
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
function stillNeeded(text, graded) {
  const named = new Set();
  const tbd = new Set();
  for (const { line, section } of lines(text)) {
    if (RECORDS.includes(md.normalize(section)) || /^\s*\*[^*]/.test(line)) continue;
    for (const m of line.matchAll(/question (\d+)/gi)) named.add(Number(m[1]));
    for (const m of line.matchAll(/\bTBD, question (\d+)/g)) tbd.add(Number(m[1]));
  }
  const open = (graded.open || []).filter((q) => named.has(q.n)).map((q) => {
    const inUse = String(q.parts && q.parts['Answer in use for now'] || '').trim();
    return `question ${q.n}: ${q.title}${inUse ? ` In use for now: ${inUse}.` : ''}`;
  });
  const waiting = (graded.questions || []).filter((q) => q.group === 'Answered' && tbd.has(q.n)).map((q) => {
    const answer = md.list(q.parts && q.parts.Answer).map((x) => String(x).trim()).join(' ');
    return `question ${q.n}: ${q.title} Answered: ${answer}. The value itself is still TBD.`;
  });
  return [...open, ...waiting];
}

// Each decision at this document's gate, with the answer chosen.
function answered(text) {
  const out = [];
  let current = null;
  for (const { line, section } of lines(text)) {
    if (md.normalize(section) !== 'decision record') continue;
    const h = line.match(/^###\s+(Decision \d+) — (.*)$/);
    if (h) current = { decision: h[1], question: h[2] };
    const c = line.match(/^- \*\*Chosen:\*\* (.*)$/);
    if (c && current) out.push(`${current.decision}, ${current.question} ${c[1]}`);
  }
  return out;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// spec: { program, date, doc, checks: [{ name, findings }], holds: [lines], graded, notices: [lines] }
// notices are facts the gate must show that are never findings, such as an FRD waiting on a Must answer question.
function report(spec) {
  const { program, date, doc, checks, graded } = spec;
  const findings = checks.flatMap((c) => c.findings.map((f) => `${c.name}: ${f}`));
  const passed = checks.filter((c) => !c.findings.length).length;
  // Worded as grade-questions.cjs words it, so the two read alike: a colon for the person, brackets in one line.
  const counts = graded && graded.counts ? `${graded.counts['Must answer'] || 0} must answer, ${graded.counts['Should answer'] || 0} should answer, ${graded.counts['Can move ahead'] || 0} can move ahead` : '';
  const openLine = graded && graded.counts ? `${plural(graded.open.length, 'open question')} (${counts}).` : 'No Question log yet.';
  const openForPerson = graded && graded.counts ? `${plural(graded.open.length, 'open question')}: ${counts}.` : openLine;
  const places = beyond(doc.text);
  const person = [];
  if (doc.status === 'accepted') {
    person.push(`Accepted on ${doc.acceptedOn}, version ${doc.version}.`, '', 'Each question, with its answer:');
    const a = answered(doc.text);
    person.push(...(a.length ? a.map((x) => `- ${x}`) : ['- None']));
    person.push('', 'The list for the client:', 'What we changed or added, for the client to confirm:');
    person.push(...(places.length ? places.map((x) => `- ${x}`) : ['- None']));
    person.push('What we still need from the client:');
    const need = graded ? stillNeeded(doc.text, graded) : [];
    person.push(...(need.length ? need.map((x) => `- ${x}`) : ['- None']));
  } else {
    person.push('What the draft holds:', ...spec.holds.map((h) => `- ${h}`), '', 'Where it goes beyond the client\'s words:');
    person.push(...(places.length ? places.map((x) => `- ${x}`) : ['- None']));
    person.push('', openForPerson);
  }
  if (spec.notices && spec.notices.length) person.push('', ...spec.notices);
  person.push('');
  if (findings.length) person.push(`${plural(findings.length, 'finding')}:`, ...findings.map((f) => `- ${f}`));
  else person.push(`Every check passed: ${plural(checks.length, 'check')}.`);
  const line = `${program}: ${passed} of ${plural(checks.length, 'check')} passed, ${plural(findings.length, 'finding')}; ${openLine}`;
  const file = [`${program}, ${date}: ${passed} of ${plural(checks.length, 'check')} passed, ${plural(findings.length, 'finding')}. ${openLine}`, ...findings.map((f) => `- ${f}`)];
  return { text: ['For the person:', ...person, '', 'One line:', line, '', 'For the file:', ...file, ''].join('\n'), findings };
}

// An EPIC, from its ID, such as EPIC-002, or its folder's name, such as EPIC-002-claim-approval, through the EPIC
// register: { id, name, folder, row }. Its folder is its ID and its name in lowercase with hyphens.
function epicOf(project, epic, opts = {}) {
  const register = load(project, 'epic-register', {}, opts);
  const id = (String(epic).match(/^EPIC-\d{3}/) || [])[0];
  const row = (md.tableUnder(register.text, 'EPICs') || []).find((r) => String(r.EPIC).trim() === id);
  if (!row) throw new rp.LayoutError(`"${epic}" isn't an EPIC in the EPIC register.`);
  const name = String(row.Name).trim();
  return { id, name, folder: `${id}-${rp.slug(name)}`, row };
}

// A change, from its number, such as 001, or its folder's name, such as 001-finance-limit:
// { number, folder, dir, report }. Its folder is in the project's changes/ folder.
function changeOf(project, change, opts = {}) {
  const number = (String(change).match(/^\d{3}/) || [])[0];
  if (!number) throw new rp.LayoutError(`"${change}" isn't a change's number, such as 001.`);
  const changes = path.dirname(rp.pathOf(project, 'change', { change: 'x' }, opts));
  const folder = fs.existsSync(changes) && fs.readdirSync(changes).find((f) => f === change || f.startsWith(`${number}-`));
  if (!folder) throw new rp.LayoutError(`There is no change ${number} in ${changes}.`);
  return { number, folder, dir: path.join(changes, folder), report: rp.pathOf(project, 'change-impact-report', { change: folder }, opts) };
}

// Replaces what a level-2 section holds, keeping its heading and the lines in italics under it, which say what it
// holds. Used by the programs that write one section of a document, such as a section of a Change impact report.
function replaceSection(file, heading, body) {
  const all = rp.readText(file).split('\n');
  const start = all.findIndex((l) => /^## /.test(l) && md.normalize(l.slice(3)) === md.normalize(heading));
  if (start < 0) throw new rp.LayoutError(`${file} has no "${heading}" section.`);
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  const keep = [all[start], ''];
  for (let i = start + 1; i < end && (all[i].trim() === '' || /^\*[^*].*\*$/.test(all[i].trim())); i++) if (all[i].trim()) keep.push(all[i], '');
  rp.writeText(file, [...all.slice(0, start), ...keep, ...body, '', ...all.slice(end)].join('\n'));
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

module.exports = { load, lines, opening, openingNotes, sections, placeholders, rendering, simpleWriting, requirementsOf, KINDS, KIND_HOME, questions, questionFindingsFor, beyond, stillNeeded, answered, report, epicOf, changeOf, replaceSection, today, plural };
