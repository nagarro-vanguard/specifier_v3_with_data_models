#!/usr/bin/env node
'use strict';
// check-prd.cjs — checks the PRD before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-prd.cjs --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the PRD template, in order, with no section of its own
//   - every requirement has its ID, its wording, and the document and version it came from; IDs are unique, and
//     each traces to business requirements that are in the BRD
//   - section 4 has a Kind column, and each row's kind is Requirement, Purpose, Scope or Way of working (prd-author,
//     step 2). A row of any kind but Requirement names the section that holds it, never a business requirement, and
//     no journey step names it. Only Requirement rows count in the traceability matrix.
//   - one requirement per row (prd-author, step 2, and _shared/atomic-rules.md): the IDs count up from REQ-{section}.1 in each section; the parts of
//     each client row, read in order, give back the row word for word, when its source is a markdown or text file in
//     sources/; and, when the project has a Glossary, the simple words use no word it retired. A Requirement row whose
//     simple words may hold two actions is shown to look at, never a finding, through lib/one-per-row.cjs.
//   - no priority column, and no grouping by capability: the requirements keep the client's own order and headings
//   - no business-rules section, no data section and no Open questions section
//   - NFR IDs are unique and numbered from NFR-1; an evidenced NFR says where it came from and has a confidence tag;
//     a recommended one is marked AI-RECOMMENDED
//   - the journey has its steps, and each names requirements that are in the PRD
//   - every transition requirement has a unique ID, says where it came from, and says whether it needs building
//   - every business requirement in the BRD has its row in the traceability matrix, listing exactly the
//     requirements that trace to it; a business requirement nothing covers is a Gap, and names its question
//   - no placeholder is left, and lib/md-lint.cjs finds nothing
//   - grade-questions.cjs finds nothing wrong with this PRD's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the PRD, the BRD or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const sr = require('./lib/scan-retired-words.cjs');
const op = require('./lib/one-per-row.cjs');

// Where a line came from, in one of four forms (conventions.md, "Cite every specific" and "Unknowns").
const ORIGIN = /\bper\b|Proposed \(needs confirmation\)|\bTBD\b|\[Not specified in provided sources\]/;
const CONFIDENCE = /^(CONFIRMED|TENTATIVE)\b/;
const QUESTION = /question \d+/i;
const BR_ID = /^BR-\d{2,}$/;
const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter(Boolean);
const words = (s) => (String(s).replace(/\*\*/g, '').toLowerCase().match(/[a-z0-9]+/g) || []).join(' ');
const KIND_NAMES = `${cd.KINDS.slice(0, -1).join(', ')} or ${cd.KINDS[cd.KINDS.length - 1]}`;

// The IDs count up from REQ-{section}.1 in each section, in the client's order, with no letters and no gaps.
function idFindings(reqs) {
  const out = [];
  const counts = new Map();
  for (const r of reqs) {
    const id = text(r.ID);
    const m = id.match(/^REQ-(\d+)\.(\d+)$/);
    if (!m) { out.push(`${id || 'A row'} isn't in the form REQ-{section}.{n}, such as REQ-3.1.`); continue; }
    const head = String(r._heading).match(/^(\d+)\./);
    if (head && head[1] !== m[1]) out.push(`${id} is under "${r._heading}", so its ID starts REQ-${head[1]}.`);
    const want = (counts.get(r._heading) || 0) + 1;
    counts.set(r._heading, want);
    if (Number(m[2]) !== want) out.push(`${id} should be REQ-${m[1]}.${want}: the IDs count up from 1 in each section, with no gaps.`);
  }
  return out;
}

// A source file in the project's sources/ folder, found by its name.
function sourceFile(project, name, opts) {
  const stack = [path.join(rp.projectDir(project, opts), 'sources')];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === name) return p;
    }
  }
  return null;
}

// Each way the client's row can read in a source file: a table row's cells after its number, joined from the first
// onward, or the rest of a line that starts with the number.
function clientRowTexts(file, number) {
  const out = [];
  const esc = number.replace(/\./g, '\\.');
  for (const line of rp.readText(file).split(/\r?\n/)) {
    if (/^\s*\|/.test(line)) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells[0] === number) for (let k = 2; k <= cells.length; k++) out.push(cells.slice(1, k).join(' '));
    } else {
      const m = line.match(new RegExp(`^\\s*(?:REQ-)?${esc}\\s+(.+)$`));
      if (m) out.push(m[1]);
    }
  }
  return out;
}

// For each client row, its parts in "The client's words", read in order, give back the row word for word. Only a
// markdown or text source can be read: any other is counted, and left to the person at the gate.
function rebuildFindings(project, reqs, opts) {
  const groups = [];
  for (const r of reqs) {
    const source = text(r.Source);
    const last = groups[groups.length - 1];
    if (last && last.source === source) last.rows.push(r);
    else groups.push({ source, rows: [r] });
  }
  const findings = [];
  let checked = 0;
  for (const g of groups) {
    const file = g.source.split(',')[0].trim();
    const number = (g.source.match(/(?:section|item)\s+([\w.]+)\s*$/i) || [])[1];
    const found = number && /\.(md|txt)$/i.test(file) ? sourceFile(project, file, opts) : null;
    if (!found) continue;
    checked++;
    const joined = words(g.rows.map((r) => r.client).join(' '));
    if (!clientRowTexts(found, number).some((c) => words(c) === joined)) {
      const ids = g.rows.map((r) => text(r.ID));
      findings.push(`${ids.length > 1 ? `${ids[0]} to ${ids[ids.length - 1]}` : ids[0]}: the parts of the client's words don't give back row ${number} of ${file}, word for word.`);
    }
  }
  return { findings, checked, rows: groups.length };
}

// The simple words use no word the Glossary retired, when the project has a Glossary.
function retiredFindings(project, reqs, opts) {
  if (!fs.existsSync(path.join(rp.projectDir(project, opts), 'glossary', 'object-terms.md'))) return [];
  const retired = sr.retiredWords(project, opts);
  if (!retired.length) return [];
  const hits = sr.scan(reqs.map((r) => r.simple).join('\n'), retired, sr.currentTerms(project, opts), 'prd');
  return hits.map((h) => `${text(reqs[h.line - 1].ID)}: "${h.word}" is a word the Glossary retired. Use ${h.useNow.join(' or ') || 'another plain word'}.`);
}

function check(project, opts = {}) {
  const doc = cd.load(project, 'prd', {}, opts);
  const brd = cd.load(project, 'brd', {}, opts);
  const t = doc.text;
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Opening', cd.opening(t));
  add('Sections', cd.sections(t, 'prd'));

  // Section 4: every requirement in simple words, with the client's words next to it.
  const brIds = new Set((md.tableUnder(brd.text, 'Business requirements') || []).map((r) => text(r['BR ID'])));
  const reqs = cd.requirementsOf(t);
  const reqFindings = [];
  const seen = new Set();
  if (!reqs.length) reqFindings.push('There is no requirement.');
  if (reqs.some((r) => r.oldForm)) reqFindings.push('Section 4 is in the old form. Give each requirement an "In simple words" column and a "The client\'s words" column, under the heading "Requirements".');
  else if (reqs.some((r) => !r.hasKind)) reqFindings.push(`Section 4 has no Kind column. Add it after ID, and give each row its kind: ${KIND_NAMES}.`);
  reqs.forEach((r, i) => {
    const id = text(r.ID);
    const at = id || `row ${i + 1} under "${r._heading}"`;
    if (!id) reqFindings.push(`A requirement under "${r._heading}" has no ID.`);
    else if (seen.has(id)) reqFindings.push(`The ID ${id} is used twice.`);
    seen.add(id);
    if (r.hasKind && !cd.KINDS.includes(r.kind)) reqFindings.push(`${at}: its kind is "${r.kind}". It should be ${KIND_NAMES}.`);
    if (!r.simple) reqFindings.push(`${at} has no simple words.`);
    if (!r.oldForm && !r.client) reqFindings.push(`${at} has none of the client's words.`);
    if (!/\bversion\b/i.test(text(r.Source))) reqFindings.push(`${at}: its source doesn't name the document and its version, such as "claims-requirements-v2.docx, version 2, section 2.1".`);
    const traces = items(r['Traces to']);
    // A Purpose, Scope or Way of working row names the section that holds it, never a business requirement.
    if (!r.isRequirement) {
      const home = cd.KIND_HOME[r.kind];
      if (traces.some((b) => BR_ID.test(b))) reqFindings.push(`${at} is a ${r.kind} row, so it traces to ${home}, not to a business requirement.`);
      else if (!traces.includes(home)) reqFindings.push(`${at} is a ${r.kind} row, so "Traces to" names ${home}.`);
      return;
    }
    // Every FRD reads a requirement's title and text from this shape, so a row in any other shape is caught here.
    if (r.simple && !/^\*\*(.+?)\*\* — (.+)$/.test(r.simple)) reqFindings.push(`${at}: its simple words don't start with a short title in bold, then " — ", then the requirement, such as "**Finance approval** — The finance team also approves each claim over 500."`);
    if (!traces.length) reqFindings.push(`${at} traces to no business requirement. Name one, or write "TBD, question {number}".`);
    for (const b of traces) {
      if (BR_ID.test(b) && !brIds.has(b)) reqFindings.push(`${at} traces to ${b}, which isn't in the BRD.`);
      else if (!BR_ID.test(b) && !ORIGIN.test(b)) reqFindings.push(`${at} traces to "${b}", which is neither a BR ID nor a gap that names its question.`);
    }
  });
  add('Requirements', reqFindings);

  // One requirement per row (prd-author, step 2, and _shared/atomic-rules.md). A PRD in the old form has already been
  // told to change.
  const rows = reqs.filter((r) => !r.oldForm);
  add('Requirement IDs', idFindings(rows));
  const rebuild = rebuildFindings(project, rows, opts);
  add('The client\'s words, in parts', rebuild.findings);
  add('Agreed words', retiredFindings(project, rows, opts));
  // Only a Requirement row is read: a Purpose, Scope or Way of working row holds nothing the product must do.
  const maybeTwo = op.check(rows.filter((r) => r.isRequirement).map((r) => ({ id: text(r.ID), text: r.simple })));

  const tableColumns = [];
  const reqHeadings = [];
  let inReqs = false;
  for (const { line, section } of cd.lines(t)) {
    if (/^\|/.test(line) && !/^\|\s*:?-{2,}/.test(line) && /^\|/.test(line)) tableColumns.push({ section, line });
    inReqs = ['requirements', 'requirements, word for word'].includes(md.normalize(section));
    const h = line.match(/^###\s+(.*?)\s*$/);
    if (inReqs && h) reqHeadings.push(h[1]);
  }
  const grouping = [];
  const headers = new Set();
  for (const { line } of tableColumns) {
    for (const c of line.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim())) {
      if (/^(priority|moscow)$/i.test(c) && !headers.has(c)) { headers.add(c); grouping.push(`A table has a "${c}" column. Requirements are never ranked in the PRD.`); }
    }
  }
  for (const h of reqHeadings) {
    if (/capabilit|must have|should have|could have|won't have|priority/i.test(h)) grouping.push(`The heading "${h}" groups the requirements. They keep the headings of the client's own file.`);
  }
  add('No priority, and no grouping by capability', grouping);

  const extra = md.headings(t).filter((h) => h.level >= 2 && /business rules|^data( requirements)?$|open questions/i.test(md.normalize(h.text)));
  add('No business-rules, data or Open questions section', extra.map((h) => `The heading "${h.text}" doesn't belong in the PRD: ${/open questions/i.test(h.text) ? 'questions live in the Question log' : 'rules and data live in the FRDs and the Glossary'}.`));

  // Section 6: NFRs, numbered across both tables.
  const nfrs = md.tableUnder(t, 'NFRs') || [];
  const nfrFindings = [];
  nfrs.forEach((r, i) => {
    const want = `NFR-${i + 1}`;
    const id = text(r['NFR ID']);
    if (id !== want) nfrFindings.push(`Row ${i + 1} is "${id}"; it should be ${want}.`);
    if ('Why recommended' in r) {
      if (text(r.Confidence) !== 'AI-RECOMMENDED') nfrFindings.push(`${id}, recommended, is not marked AI-RECOMMENDED.`);
    } else {
      if (!ORIGIN.test(text(r.Source))) nfrFindings.push(`${id} doesn't say where it came from.`);
      if (!CONFIDENCE.test(text(r.Confidence))) nfrFindings.push(`${id} has no confidence tag: CONFIRMED or TENTATIVE.`);
    }
  });
  add('NFRs', nfrFindings);

  const journey = md.tableUnder(t, 'The end-to-end journey') || [];
  const journeyFindings = journey.length ? [] : ['The journey has no steps.'];
  const rowOf = new Map(reqs.map((r) => [text(r.ID), r]));
  journey.forEach((r) => {
    const step = text(r.Step);
    for (const id of items(r.Requirements)) {
      if (!seen.has(id)) journeyFindings.push(`Step ${step} names ${id}, which isn't in section 4.`);
      else if (!rowOf.get(id).isRequirement) journeyFindings.push(`Step ${step} names ${id}, which is a ${rowOf.get(id).kind} row, not a requirement.`);
    }
    if (!items(r.Requirements).length) journeyFindings.push(`Step ${step} names no requirement.`);
  });
  add('Journey', journeyFindings);

  const transitions = md.tableUnder(t, 'Transition requirements') || [];
  const trFindings = [];
  const trSeen = new Set();
  transitions.forEach((r, i) => {
    const id = text(r.ID) || `row ${i + 1}`;
    if (trSeen.has(id)) trFindings.push(`The ID ${id} is used twice.`);
    trSeen.add(id);
    if (!ORIGIN.test(text(r.Source))) trFindings.push(`${id} doesn't say where it came from.`);
    if (!/^(Yes|No)$/.test(text(r['Needs building?']))) trFindings.push(`${id}: "Needs building?" is "${text(r['Needs building?'])}"; it should be Yes or No.`);
  });
  add('Transition requirements', trFindings);

  // Section 9: the traceability matrix agrees with the BRD and with section 4.
  const matrix = md.tableUnder(t, 'Traceability matrix') || [];
  const traceFindings = [];
  const tracing = new Map([...brIds].map((b) => [b, new Set()]));
  for (const r of reqs.filter((x) => x.isRequirement)) for (const b of items(r['Traces to'])) if (tracing.has(b)) tracing.get(b).add(text(r.ID));
  const rowsByBr = new Map(matrix.map((r) => [text(r['BR ID']), r]));
  for (const b of brIds) {
    const row = rowsByBr.get(b);
    const want = [...tracing.get(b)].sort();
    if (!row) { traceFindings.push(`${b} has no row.`); continue; }
    const have = items(row['Covered by']).filter((x) => !ORIGIN.test(x) && !/^none$/i.test(x)).sort();
    if (want.join() !== have.join()) traceFindings.push(`${b}: "Covered by" lists ${have.length ? have.join(', ') : 'nothing'}, but the requirements that trace to it are ${want.length ? want.join(', ') : 'none'}.`);
    const status = text(row.Status);
    if (want.length && status !== 'Covered') traceFindings.push(`${b}: its status is "${status}"; it should be Covered.`);
    if (!want.length) {
      if (!/^Gap\b/.test(status)) traceFindings.push(`${b}: nothing traces to it, so its status should be Gap.`);
      if (!QUESTION.test(text(row.Status) + ' ' + text(row['Covered by']))) traceFindings.push(`${b} is a Gap that names no question.`);
    }
  }
  for (const b of rowsByBr.keys()) if (!brIds.has(b)) traceFindings.push(`The row ${b} isn't a business requirement in the BRD.`);
  add('Every business requirement traced', traceFindings);

  add('Placeholders', cd.placeholders(t));
  add('Display', cd.rendering(t));
  // The client's words are kept as they are. The check compares them with the simple words, so nothing is lost.
  // The matrix copies each business requirement from the BRD, word for word, and check-brd.cjs checks those words.
  const writing = cd.simpleWriting(t, { project, output: opts.output, skipColumns: ["The client's words", 'Requirement as written', 'Business requirement'], compare: ['In simple words', "The client's words"] });
  add('Simple writing', writing.findings);
  const graded = cd.questions(project, opts);
  add('Question log', cd.questionFindingsFor(doc, graded));

  const evidenced = nfrs.filter((r) => !('Why recommended' in r)).length;
  const covered = [...tracing.values()].filter((s) => s.size).length;
  const others = reqs.filter((r) => !r.isRequirement).length;
  const holds = [
    `${cd.plural(reqs.length - others, 'requirement')}${others ? `, and ${cd.plural(others, 'row')} of purpose, scope or way of working` : ''}, under ${cd.plural(new Set(reqs.map((r) => r._heading)).size, 'heading')} of the client's files`,
    `${cd.plural(rebuild.rows, 'client row')}: ${rebuild.checked} checked against their source file, word for word, and ${rebuild.rows - rebuild.checked} in a file the program can't read`,
    cd.plural(journey.length, 'journey step'),
    `${cd.plural(nfrs.length, 'NFR')}: ${evidenced} evidenced, ${nfrs.length - evidenced} recommended`,
    cd.plural(transitions.length, 'transition requirement'),
    `${covered} of ${cd.plural(brIds.size, 'business requirement')} covered`,
  ];
  const notices = [...writing.notices, ...op.notices(maybeTwo, 'row')];
  return { doc, checks, holds, graded, notices };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/check-prd.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, { output: args.output });
  const out = cd.report({ program: 'check-prd.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
