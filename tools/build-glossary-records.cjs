#!/usr/bin/env node
'use strict';
// build-glossary-records.cjs — builds the decision register and every section decisions file from the gate log, the
// only place a glossary decision is written.
//
//   node tools/build-glossary-records.cjs --project <p>
//
// What it does:
//   1. reads every row of the gate log, in order: Gate 1's four tables, Gate 2, then each Change and Re-run part
//   2. while any row is still open, or a row's "Applies to" is neither a link to a section's folder nor All sections,
//      it writes nothing, and lists those rows
//   3. gives each resolved row a decision id, D-1 onward, in the log's order, so the same log always gives the same ids,
//      and writes the register's table under "The register" in glossary/decision-register.md. The rest of that page is
//      glossary-author's, and is left as it is.
//   4. writes glossary/deep-dives/{section}/{section}-decisions.md for every section, whole, from its template: one row
//      for every candidate in the section's draft, in the draft's order, with what the gates did to it
//
// Each row's Resolution is read in the form output-formats.md sets ("The gate log"): the word the glossary uses, then
// one line for each word it replaces, such as "basket: merged into Cart".
//
// Exports, so fill-also-written-as.cjs and build-retired-words-tables.cjs read the gate log the same way:
//   readGateLog(text)    every row, in order, with its part, its table and its cells
//   decisionIds(rows)    each resolved row's D-n
//   outcomesOf(row)      the words a row replaces: { earlier, what, terms }
//   termKinds(rows)      each term's kind, from Gate 2 and the changes after it
//   kindPage(kind)       the kind page a kind's terms live on
//   anchorOf(term)       the anchor of a term's definition, in kebab-case
//
// Exit codes: 0 written; 1 a gate-log row is still open or its "Applies to" is wrong, or a candidate has no outcome,
// each listed; 2 the gate log,
// the register page, a section's draft or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');

const TEMPLATES = path.join(rp.KIT_ROOT, '.claude', 'skills', '_shared', 'glossary', 'templates');
const OUTCOME = /^(.+?):\s+(renamed to|merged into|split into|withdrawn)(?:\s+(.+))?$/i;
const WHAT = { 'renamed to': 'renamed', 'merged into': 'merged', 'split into': 'split', withdrawn: 'withdrawn' };
const lines = (c) => md.list(c).map((x) => String(x).trim()).filter(Boolean);
const text = (c) => lines(c).join(' ');
const low = (s) => String(s).trim().toLowerCase();
// A cell carried into another page: several lines stay a list, one per line.
const cell = (c) => { const ls = lines(c); return ls.length > 1 ? ls.map((l) => `• ${l}`).join('<br>') : (ls[0] || ''); };
// A link written in the gate log, in deep-dives/, made to work from the decision register, one folder up.
const fromDeepDives = (s) => s.replace(/\]\((?!https?:\/\/|#|\/)([^)]*)\)/g, (m, p) => `](${path.posix.normalize(`deep-dives/${p}`)})`);

// The kind of row, from its part and its table.
function tableOf(part, heading, row) {
  if ('Term' in row) return 'definition';
  if (/^Change\b/.test(part)) return 'change';
  const h = String(heading);
  if (/^Conflicts\b/.test(h)) return 'conflict';
  if (/^Weak words\b/.test(h)) return 'weak';
  if (/^Candidates to judge\b/.test(h)) return 'candidate';
  if (/^Questions\b/.test(h)) return 'question';
  return 'unknown';
}

function readGateLog(textOfLog) {
  const parts = md.headings(textOfLog).filter((h) => h.level === 2 && /^(Gate [12]|Change|Re-run)\b/.test(h.text));
  const rows = [];
  for (const p of parts) {
    for (const r of md.tableUnder(textOfLog, p.text) || []) {
      const raw = text(r['#']);
      const anchor = (raw.match(/<a id="([^"]+)"><\/a>/) || [])[1];
      const id = raw.replace(/<a id="[^"]*"><\/a>/g, '').trim();
      if (!id || /^\{/.test(id)) continue;
      rows.push({
        id,
        anchor: anchor || low(id),
        part: p.text,
        table: tableOf(p.text, r._heading, r),
        appliesTo: text(r['Applies to']),
        question: text(r['The question']),
        recommended: text(r['Recommended, and why']),
        recommendedCell: cell(r['Recommended, and why']),
        term: text(r.Term),
        kind: text(r.Kind),
        source: text(r.Source),
        sourceCell: cell(r.Source),
        status: low(text(r.Status)),
        resolution: lines(r.Resolution),
        decided: text(r.Decided),
      });
    }
  }
  return rows;
}

function decisionIds(rows) {
  const ids = new Map();
  let n = 0;
  for (const r of rows) if (r.status && r.status !== 'open') ids.set(r.id, ++n);
  return ids;
}

function outcomesOf(row) {
  if (!['conflict', 'weak', 'change'].includes(row.table)) return [];
  return row.resolution.slice(1).map((l) => l.match(OUTCOME)).filter(Boolean).map((m) => ({
    earlier: m[1].trim(),
    what: WHAT[low(m[2])],
    terms: m[3] ? m[3].split(/\s+and\s+|,\s*/).map((t) => t.trim()).filter(Boolean) : [],
  }));
}

// Each term's kind: from its Gate 2 row, and for a word a change brings, the kind of the word it replaces.
function termKinds(rows) {
  const kinds = new Map();
  for (const r of rows) if (r.table === 'definition' && r.term) kinds.set(low(r.term), r.kind);
  for (const r of rows) {
    for (const o of outcomesOf(r)) for (const t of o.terms) if (!kinds.has(low(t)) && kinds.has(low(o.earlier))) kinds.set(low(t), kinds.get(low(o.earlier)));
  }
  return kinds;
}

function kindPage(kind) {
  const k = low(kind);
  if (/^object/.test(k)) return 'object-terms.md';
  if (/^role/.test(k)) return 'role-terms.md';
  if (/^step/.test(k)) return 'step-terms.md';
  if (/state|value/.test(k)) return 'states-and-values.md';
  return null;
}

function anchorOf(term) {
  return low(term).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// The terms the glossary uses now: the log read in order, each Gate 2 term added, each word a row replaces taken
// away, and each word a change brings added.
function currentTerms(rows) {
  const now = new Map();
  for (const r of rows) {
    if (r.table === 'definition' && r.term) now.set(low(r.term), r.term);
    for (const o of outcomesOf(r)) {
      now.delete(low(o.earlier));
      if (r.table === 'change' && o.what !== 'merged') for (const t of o.terms) now.set(low(t), t);
    }
  }
  return now;
}

// Where a word ends up: each word it was renamed, merged or split into is followed to the terms used now. n is the
// latest decision on the way, the one that put the word where it is.
function follow(word, retired, seen = new Set()) {
  const r = retired.get(low(word));
  if (!r || seen.has(low(word))) return { terms: [word], n: 0 };
  seen.add(low(word));
  if (r.what === 'withdrawn') return { terms: [], n: r.n };
  const out = r.terms.map((t) => follow(t, retired, new Set(seen)));
  return { terms: out.flatMap((o) => o.terms), n: Math.max(r.n, ...out.map((o) => o.n)) };
}

function retiredMap(rows, ids) {
  const retired = new Map();
  for (const r of rows) {
    if (!ids.has(r.id)) continue;
    for (const o of outcomesOf(r)) retired.set(low(o.earlier), { ...o, n: ids.get(r.id), row: r });
  }
  return retired;
}

function linkToTerm(term, kinds, from) {
  const page = kindPage(kinds.get(low(term)) || '');
  return page ? `[${term}](${from}${page}#${anchorOf(term)})` : term;
}

function register(rows, ids) {
  const kinds = termKinds(rows);
  const out = ['| ID | Term | Where | Decided | Chosen | Retired / overrides | Basis | Gate row | Date |', '|---|---|---|---|---|---|---|---|---|'];
  const settled = []; // each register row's term, for a later change to name the decision it reverses
  for (const r of rows) {
    const n = ids.get(r.id);
    if (!n) continue;
    const chosen = r.resolution[0] || '-';
    let term = '-';
    let decided = r.question || '-';
    if (['conflict', 'weak', 'change'].includes(r.table)) term = chosen;
    else if (r.table === 'candidate') term = (r.question.match(/Should\s+"?(.+?)"?\s+be a glossary term\?/i) || [])[1] || '-';
    else if (r.table === 'definition') { term = r.term; decided = `the definition of ${r.term}`; }
    const retiredLines = outcomesOf(r).map((o) => `${o.earlier}: ${o.what}${o.terms.length ? ` ${o.what === 'split' ? 'into' : o.what === 'merged' ? 'into' : 'to'} ${o.terms.join(' and ')}` : ''}`);
    if (r.table === 'change') {
      const words = [...outcomesOf(r).map((o) => o.earlier), chosen].map(low);
      const before = settled.filter((s) => words.includes(s.term)).pop();
      if (before) retiredLines.push(`overrides D-${before.n}`);
    }
    const basis = fromDeepDives(r.table === 'definition' ? (r.sourceCell || '-') : r.status === 'overridden' ? `Overrode the recommendation: ${r.recommendedCell}` : (r.recommendedCell || '-'));
    const where = r.appliesTo.replace(APPLIES_TO, (m, name, p) => `[${name}](deep-dives/${p}/${p}-glossary.md)`) || '-';
    const termCell = term === '-' || (r.table === 'candidate' && low(chosen) === 'drop') ? term : linkToTerm(term, kinds, '');
    const chosenCell = r.table === 'question' || r.table === 'definition' ? (r.resolution.length > 1 ? r.resolution.map((l) => `• ${l}`).join('<br>') : chosen) : chosen;
    out.push(`| <a id="d-${n}"></a>D-${n} | ${termCell} | ${where} | ${decided} | ${chosenCell} | ${retiredLines.length ? retiredLines.join('<br>') : '-'} | ${basis} | [${r.id}](deep-dives/gate-log.md#${r.anchor}) | ${r.decided || '-'} |`);
    settled.push({ n, term: low(term) });
  }
  return out;
}

// "Applies to" is a link to a section's folder, such as [claims](claims/), or All sections (output-formats.md, "The
// gate log"). Any other link would build a broken "Where" link, so it is a finding, and nothing is written.
const APPLIES_TO = /^\[([^\]]+)\]\(([^)/]+)\/?\)$/;
function appliesToFindings(rows, sections) {
  const out = [];
  for (const r of rows) {
    if (/^all sections$/i.test(r.appliesTo)) continue;
    const m = r.appliesTo.match(APPLIES_TO);
    if (m && sections.includes(m[2])) continue;
    const folder = (r.appliesTo.match(/\]\(([^)/]+)\//) || [])[1];
    const fix = sections.includes(folder) ? `[${folder}](${folder}/)` : 'a link to the section\'s folder, such as [claims](claims/)';
    out.push(`${r.id}: "Applies to" reads "${r.appliesTo || 'nothing'}". Write ${fix}, or All sections.`);
  }
  return out;
}

// The register page keeps everything glossary-author wrote; only the table under "The register" is replaced.
function writeRegisterTable(file, table) {
  const all = rp.readText(file).split('\n');
  const start = all.findIndex((l) => /^## The register\s*$/.test(l));
  if (start < 0) throw new rp.LayoutError(`${file} has no "The register" section. Write the page from its template first.`);
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  const keep = all.slice(start, end).filter((l) => !/^\|/.test(l) && !/^None yet\.?\s*$/.test(l));
  while (keep.length && keep[keep.length - 1].trim() === '') keep.pop();
  rp.writeText(file, [...all.slice(0, start), ...keep, '', ...table, '', ...all.slice(end)].join('\n'));
}

// One section's decisions file, whole, from its template.
function sectionDecisions(section, draftText, rows, ids, dropped) {
  const kinds = termKinds(rows);
  const retired = retiredMap(rows, ids);
  const now = currentTerms(rows);
  const chosenBy = new Map();
  for (const r of rows) if (ids.has(r.id) && ['conflict', 'weak', 'change'].includes(r.table) && r.resolution[0]) chosenBy.set(low(r.resolution[0]), ids.get(r.id));
  const droppedAtGate = new Map();
  for (const r of rows) {
    if (r.table !== 'candidate' || !ids.has(r.id) || low(r.resolution[0] || '') !== 'drop') continue;
    const c = (r.question.match(/Should\s+"?(.+?)"?\s+be a glossary term\?/i) || [])[1];
    if (c) droppedAtGate.set(low(c), ids.get(r.id));
  }
  const findings = [];
  const link = (t) => linkToTerm(t, kinds, '../../');
  const dLink = (n) => `[D-${n}](../../decision-register.md#d-${n})`;
  // "None." is the empty-table marker (lens1-ontology.md), not a candidate, so it never needs an outcome.
  const candidates = (md.tableUnder(draftText, 'The candidates found (ontology)') || []).map((r) => text(r.Candidate)).filter((c) => c && !/^\{/.test(c) && low(c) !== 'none.' && low(c) !== 'none');
  const out = [];
  for (const c of candidates) {
    const k = low(c);
    if (retired.has(k)) {
      const r = retired.get(k);
      const f = follow(c, retired);
      const outcome = f.terms.length === 0 ? 'dropped' : r.what === 'merged' ? 'merged' : 'renamed';
      out.push(`| ${c} | ${outcome} | ${f.terms.length ? f.terms.map(link).join('<br>') : '-'} | ${dLink(f.n || r.n)} |`);
    } else if (now.has(k)) {
      out.push(`| ${c} | kept | ${link(now.get(k))} | ${chosenBy.has(k) ? dLink(chosenBy.get(k)) : '-'} |`);
    } else if (droppedAtGate.has(k)) {
      out.push(`| ${c} | dropped | - | ${dLink(droppedAtGate.get(k))} |`);
    } else if (dropped.has(k)) {
      out.push(`| ${c} | dropped | - | failed ${dropped.get(k)} |`);
    } else {
      out.push(`| ${c} | pending | - | - |`);
      findings.push(`${section}: the candidate "${c}" has no outcome: it isn't a term, and no gate row or failed test settles it.`);
    }
  }
  const template = rp.readText(path.join(TEMPLATES, 'section-decisions.md'))
    .split('\n')
    .filter((l) => !/^<!--.*-->\s*$/.test(l) && !/^None yet - written once the gates are passed\.\s*$/.test(l))
    .join('\n')
    .replace(/\{section\}/g, section);
  const placeholderRow = template.split('\n').find((l) => /^\| \{candidate\} \|/.test(l));
  return { text: template.replace(placeholderRow, out.join('\n')).replace(/\n{3,}/g, '\n\n'), findings };
}

// Candidates the assembly draft dropped for failing a test, by section: Map(section -> Map(candidate -> test)).
function droppedInDraft(project, opts) {
  const file = rp.pathOf(project, 'glossary-assembly-draft', {}, opts);
  const by = new Map();
  if (!fs.existsSync(file)) return by;
  for (const r of md.tableUnder(file, 'Candidates dropped, and why') || []) {
    const section = (text(r['Found in']).match(/\]\(([^/)]+)\//) || [])[1];
    if (!section) continue;
    if (!by.has(section)) by.set(section, new Map());
    by.get(section).set(low(text(r.Candidate)), text(r['Test failed']));
  }
  return by;
}

function build(project, opts = {}) {
  const logFile = rp.pathOf(project, 'gate-log', {}, opts);
  if (!fs.existsSync(logFile)) throw new rp.LayoutError(`There is no gate log yet: ${logFile}`);
  const rows = readGateLog(rp.readText(logFile));
  const open = rows.filter((r) => !r.status || r.status === 'open');
  if (open.length) return { written: [], findings: open.map((r) => `${r.id} is still open. Nothing is built until every row is resolved.`) };
  const deep = rp.pathOf(project, 'deep-dives', {}, opts);
  const sections = fs.readdirSync(deep, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name).sort();
  const badLinks = appliesToFindings(rows, sections);
  if (badLinks.length) return { written: [], findings: badLinks };
  const ids = decisionIds(rows);
  const registerFile = rp.pathOf(project, 'decision-register', {}, opts);
  if (!fs.existsSync(registerFile)) throw new rp.LayoutError(`The decision register page isn't there yet: ${registerFile}. Write it from its template first.`);
  writeRegisterTable(registerFile, register(rows, ids));
  const written = [path.relative(rp.projectDir(project, opts), registerFile)];
  const findings = [];
  const dropped = droppedInDraft(project, opts);
  for (const e of sections) {
    const draft = rp.pathOf(project, 'section-glossary', { section: e }, opts);
    if (!fs.existsSync(draft)) throw new rp.LayoutError(`The section folder ${e}/ has no draft: ${draft}`);
    const s = sectionDecisions(e, rp.readText(draft), rows, ids, dropped.get(e) || new Map());
    const file = rp.pathOf(project, 'section-decisions', { section: e }, opts);
    fs.writeFileSync(file, s.text);
    written.push(path.relative(rp.projectDir(project, opts), file));
    findings.push(...s.findings);
  }
  return { written, findings, decisions: ids.size };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/build-glossary-records.cjs --project <p>', 2);
  const r = build(args.project, { output: args.output });
  if (r.written.length) {
    process.stdout.write(`Built from the gate log: ${r.decisions} decisions.\n${r.written.map((w) => `- ${w.split(path.sep).join('/')}`).join('\n')}\n`);
  }
  if (r.findings.length) process.stdout.write(`${r.findings.length} finding${r.findings.length === 1 ? '' : 's'}:\n${r.findings.map((f) => `- ${f}`).join('\n')}\n`);
  return r.findings.length ? 1 : 0;
}

module.exports = { readGateLog, decisionIds, outcomesOf, termKinds, kindPage, anchorOf, currentTerms, follow, retiredMap, build };

if (require.main === module) rp.run(main);
