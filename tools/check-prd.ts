// check-prd.ts — checks the PRD before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-prd.ts --project <p>
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
//     simple words may hold two actions is shown to look at, never a finding, through lib/one-per-row.ts.
//   - no priority column, and no grouping by capability: the requirements keep the client's own order and headings
//   - no business-rules section, no data section and no Open questions section
//   - NFR IDs are unique and numbered from NFR-1; an evidenced NFR says where it came from and has a confidence tag;
//     a recommended one is marked AI-RECOMMENDED
//   - the journey has its steps, and each names requirements that are in the PRD
//   - every transition requirement has a unique ID, says where it came from, and says whether it needs building
//   - every business requirement in the BRD has its row in the traceability matrix, listing exactly the
//     requirements that trace to it; a business requirement nothing covers is a Gap, and names its question
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - grade-questions.ts finds nothing wrong with this PRD's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exports: check(project, opts), the PRD's checks, for report().
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the PRD, the BRD or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { projectDir, readText, type PathOptions } from './lib/run-paths.ts';
import { headings, tableUnder, normalize, list, cellText, type Cell, type Row } from './lib/md-tables.ts';
import { plural } from './lib/text.ts';
import {
  load, lines, opening, sections, placeholders, rendering, simpleWriting, requirementsOf, questions, questionFindingsFor,
  report, KINDS, KIND_HOME, type Requirement,
} from './lib/check-document.ts';
import { retiredWords, currentTerms, scan } from './lib/scan-retired-words.ts';
import { check as checkOnePerRow, notices as onePerRowNotices } from './lib/one-per-row.ts';
import type { Check, CheckResult } from './lib/types.ts';

// Where a line came from, in one of four forms (conventions.md, "Cite every specific" and "Unknowns").
const ORIGIN = /\bper\b|Proposed \(needs confirmation\)|\bTBD\b|\[Not specified in provided sources\]/;
const CONFIDENCE = /^(CONFIRMED|TENTATIVE)\b/;
const QUESTION = /question \d+/i;
const BR_ID = /^BR-\d{2,}$/;
const REQUIREMENTS_SECTIONS = ['requirements', 'requirements, word for word'] as const;
const KIND_NAMES = `${KINDS.slice(0, -1).join(', ')} or ${KINDS[KINDS.length - 1]}`;

const items = (c: Cell | undefined): string[] => list(c).map((x) => String(x).trim()).filter(Boolean);
const words = (s: string): string => (String(s).replace(/\*\*/g, '').toLowerCase().match(/[a-z0-9]+/g) || []).join(' ');

// What one requirement row lacks, but a second use of its ID.
function requirementRowFindings(r: Requirement, at: string, brIds: Set<string>): string[] {
  const findings: string[] = [];
  if (r.hasKind && !(KINDS as readonly string[]).includes(r.kind)) findings.push(`${at}: its kind is "${r.kind}". It should be ${KIND_NAMES}.`);
  if (!r.simple) findings.push(`${at} has no simple words.`);
  if (!r.oldForm && !r.client) findings.push(`${at} has none of the client's words.`);
  if (!/\bversion\b/i.test(cellText(r.Source))) findings.push(`${at}: its source doesn't name the document and its version, such as "claims-requirements-v2.docx, version 2, section 2.1".`);
  const traces = items(r['Traces to']);
  // A Purpose, Scope or Way of working row names the section that holds it, never a business requirement.
  if (!r.isRequirement) {
    const home = KIND_HOME[r.kind as keyof typeof KIND_HOME];
    if (traces.some((b) => BR_ID.test(b))) findings.push(`${at} is a ${r.kind} row, so it traces to ${home}, not to a business requirement.`);
    else if (!traces.includes(home)) findings.push(`${at} is a ${r.kind} row, so "Traces to" names ${home}.`);
    return findings;
  }
  // Every FRD reads a requirement's title and text from this shape, so a row in any other shape is caught here.
  if (r.simple && !/^\*\*(.+?)\*\* — (.+)$/.test(r.simple)) findings.push(`${at}: its simple words don't start with a short title in bold, then " — ", then the requirement, such as "**Finance approval** — The finance team also approves each claim over 500."`);
  if (!traces.length) findings.push(`${at} traces to no business requirement. Name one, or write "TBD, question {number}".`);
  for (const b of traces) {
    if (BR_ID.test(b) && !brIds.has(b)) findings.push(`${at} traces to ${b}, which isn't in the BRD.`);
    else if (!BR_ID.test(b) && !ORIGIN.test(b)) findings.push(`${at} traces to "${b}", which is neither a BR ID nor a gap that names its question.`);
  }
  return findings;
}

// Section 4: every requirement in simple words, with the client's words next to it.
function requirementsCheck(reqs: Requirement[], brIds: Set<string>): Check {
  const findings: string[] = [];
  const seen = new Set<string>();
  if (!reqs.length) findings.push('There is no requirement.');
  if (reqs.some((r) => r.oldForm)) findings.push('Section 4 is in the old form. Give each requirement an "In simple words" column and a "The client\'s words" column, under the heading "Requirements".');
  else if (reqs.some((r) => !r.hasKind)) findings.push(`Section 4 has no Kind column. Add it after ID, and give each row its kind: ${KIND_NAMES}.`);
  reqs.forEach((r, i) => {
    const id = cellText(r.ID);
    const at = id || `row ${i + 1} under "${r._heading}"`;
    if (!id) findings.push(`A requirement under "${r._heading}" has no ID.`);
    else if (seen.has(id)) findings.push(`The ID ${id} is used twice.`);
    seen.add(id);
    findings.push(...requirementRowFindings(r, at, brIds));
  });
  return { name: 'Requirements', findings };
}

// The IDs count up from REQ-{section}.1 in each section, in the client's order, with no letters and no gaps.
function idsCheck(reqs: Requirement[]): Check {
  const findings: string[] = [];
  const counts = new Map<string, number>();
  for (const r of reqs) {
    const id = cellText(r.ID);
    const m = id.match(/^REQ-(\d+)\.(\d+)$/);
    if (!m) { findings.push(`${id || 'A row'} isn't in the form REQ-{section}.{n}, such as REQ-3.1.`); continue; }
    const head = String(r._heading).match(/^(\d+)\./);
    if (head && head[1] !== m[1]) findings.push(`${id} is under "${r._heading}", so its ID starts REQ-${head[1]}.`);
    const want = (counts.get(r._heading) || 0) + 1;
    counts.set(r._heading, want);
    if (Number(m[2]) !== want) findings.push(`${id} should be REQ-${m[1]}.${want}: the IDs count up from 1 in each section, with no gaps.`);
  }
  return { name: 'Requirement IDs', findings };
}

// A source file in the project's sources/ folder, found by its name.
function sourceFile(project: string, name: string, opts: PathOptions): string | null {
  const stack = [path.join(projectDir(project, opts), 'sources')];
  let dir: string | undefined;
  while ((dir = stack.pop()) !== undefined) {
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
function clientRowTexts(file: string, number: string): string[] {
  const out: string[] = [];
  const esc = number.replace(/\./g, '\\.');
  for (const line of readText(file).split(/\r?\n/)) {
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

interface Rebuilt {
  check: Check;
  // How many client rows there are, and how many could be read from their source file.
  checked: number;
  rows: number;
}

// For each client row, its parts in "The client's words", read in order, give back the row word for word. Only a
// markdown or text source can be read: any other is counted, and left to the person at the gate.
function rebuildCheck(project: string, reqs: Requirement[], opts: PathOptions): Rebuilt {
  const groups: { source: string; rows: Requirement[] }[] = [];
  for (const r of reqs) {
    const source = cellText(r.Source);
    const last = groups[groups.length - 1];
    if (last && last.source === source) last.rows.push(r);
    else groups.push({ source, rows: [r] });
  }
  const findings: string[] = [];
  let checked = 0;
  for (const g of groups) {
    const file = g.source.split(',')[0].trim();
    const number = (g.source.match(/(?:section|item)\s+([\w.]+)\s*$/i) || [])[1];
    if (!number || !/\.(md|txt)$/i.test(file)) continue;
    const found = sourceFile(project, file, opts);
    if (!found) continue;
    checked++;
    const joined = words(g.rows.map((r) => r.client).join(' '));
    if (!clientRowTexts(found, number).some((c) => words(c) === joined)) {
      const ids = g.rows.map((r) => cellText(r.ID));
      findings.push(`${ids.length > 1 ? `${ids[0]} to ${ids[ids.length - 1]}` : ids[0]}: the parts of the client's words don't give back row ${number} of ${file}, word for word.`);
    }
  }
  return { check: { name: 'The client\'s words, in parts', findings }, checked, rows: groups.length };
}

// The simple words use no word the Glossary retired, when the project has a Glossary.
function agreedWordsCheck(project: string, reqs: Requirement[], opts: PathOptions): Check {
  const name = 'Agreed words';
  if (!fs.existsSync(path.join(projectDir(project, opts), 'glossary', 'object-terms.md'))) return { name, findings: [] };
  const retired = retiredWords(project, opts);
  if (!retired.length) return { name, findings: [] };
  const hits = scan(reqs.map((r) => r.simple).join('\n'), retired, currentTerms(project, opts), 'prd');
  return { name, findings: hits.map((h) => `${cellText(reqs[h.line - 1].ID)}: "${h.word}" is a word the Glossary retired. Use ${h.useNow.join(' or ') || 'another plain word'}.`) };
}

function groupingCheck(text: string): Check {
  const tableLines: string[] = [];
  const reqHeadings: string[] = [];
  for (const { line, section } of lines(text)) {
    if (/^\|/.test(line) && !/^\|\s*:?-{2,}/.test(line)) tableLines.push(line);
    const inReqs = (REQUIREMENTS_SECTIONS as readonly string[]).includes(normalize(section));
    const h = line.match(/^###\s+(.*?)\s*$/);
    if (inReqs && h) reqHeadings.push(h[1]);
  }
  const findings: string[] = [];
  const columns = new Set<string>();
  for (const line of tableLines) {
    for (const c of line.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim())) {
      if (/^(priority|moscow)$/i.test(c) && !columns.has(c)) { columns.add(c); findings.push(`A table has a "${c}" column. Requirements are never ranked in the PRD.`); }
    }
  }
  for (const h of reqHeadings) {
    if (/capabilit|must have|should have|could have|won't have|priority/i.test(h)) findings.push(`The heading "${h}" groups the requirements. They keep the headings of the client's own file.`);
  }
  return { name: 'No priority, and no grouping by capability', findings };
}

function extraSectionsCheck(text: string): Check {
  const extra = headings(text).filter((h) => h.level >= 2 && /business rules|^data( requirements)?$|open questions/i.test(normalize(h.text)));
  return {
    name: 'No business-rules, data or Open questions section',
    findings: extra.map((h) => `The heading "${h.text}" doesn't belong in the PRD: ${/open questions/i.test(h.text) ? 'questions live in the Question log' : 'rules and data live in the FRDs and the Glossary'}.`),
  };
}

// Section 6: NFRs, numbered across both tables.
function nfrsCheck(nfrs: Row[]): Check {
  const findings: string[] = [];
  nfrs.forEach((r, i) => {
    const want = `NFR-${i + 1}`;
    const id = cellText(r['NFR ID']);
    if (id !== want) findings.push(`Row ${i + 1} is "${id}"; it should be ${want}.`);
    if ('Why recommended' in r) {
      if (cellText(r.Confidence) !== 'AI-RECOMMENDED') findings.push(`${id}, recommended, is not marked AI-RECOMMENDED.`);
    } else {
      if (!ORIGIN.test(cellText(r.Source))) findings.push(`${id} doesn't say where it came from.`);
      if (!CONFIDENCE.test(cellText(r.Confidence))) findings.push(`${id} has no confidence tag: CONFIRMED or TENTATIVE.`);
    }
  });
  return { name: 'NFRs', findings };
}

function journeyCheck(journey: Row[], reqs: Requirement[]): Check {
  const findings = journey.length ? [] : ['The journey has no steps.'];
  const rowOf = new Map(reqs.map((r) => [cellText(r.ID), r]));
  journey.forEach((r) => {
    const step = cellText(r.Step);
    for (const id of items(r.Requirements)) {
      const row = rowOf.get(id);
      if (!row) findings.push(`Step ${step} names ${id}, which isn't in section 4.`);
      else if (!row.isRequirement) findings.push(`Step ${step} names ${id}, which is a ${row.kind} row, not a requirement.`);
    }
    if (!items(r.Requirements).length) findings.push(`Step ${step} names no requirement.`);
  });
  return { name: 'Journey', findings };
}

function transitionsCheck(transitions: Row[]): Check {
  const findings: string[] = [];
  const seen = new Set<string>();
  transitions.forEach((r, i) => {
    const id = cellText(r.ID) || `row ${i + 1}`;
    if (seen.has(id)) findings.push(`The ID ${id} is used twice.`);
    seen.add(id);
    if (!ORIGIN.test(cellText(r.Source))) findings.push(`${id} doesn't say where it came from.`);
    if (!/^(Yes|No)$/.test(cellText(r['Needs building?']))) findings.push(`${id}: "Needs building?" is "${cellText(r['Needs building?'])}"; it should be Yes or No.`);
  });
  return { name: 'Transition requirements', findings };
}

// Each business requirement in the BRD, and the IDs of the Requirement rows that trace to it.
function tracingOf(reqs: Requirement[], brIds: Set<string>): Map<string, Set<string>> {
  const tracing = new Map([...brIds].map((b) => [b, new Set<string>()]));
  for (const r of reqs.filter((x) => x.isRequirement)) for (const b of items(r['Traces to'])) tracing.get(b)?.add(cellText(r.ID));
  return tracing;
}

// Section 9: the traceability matrix agrees with the BRD and with section 4.
function traceCheck(matrix: Row[], brIds: Set<string>, tracing: Map<string, Set<string>>): Check {
  const findings: string[] = [];
  const rowsByBr = new Map(matrix.map((r) => [cellText(r['BR ID']), r]));
  for (const b of brIds) {
    const row = rowsByBr.get(b);
    const want = [...(tracing.get(b) ?? [])].sort();
    if (!row) { findings.push(`${b} has no row.`); continue; }
    const have = items(row['Covered by']).filter((x) => !ORIGIN.test(x) && !/^none$/i.test(x)).sort();
    if (want.join() !== have.join()) findings.push(`${b}: "Covered by" lists ${have.length ? have.join(', ') : 'nothing'}, but the requirements that trace to it are ${want.length ? want.join(', ') : 'none'}.`);
    const status = cellText(row.Status);
    if (want.length && status !== 'Covered') findings.push(`${b}: its status is "${status}"; it should be Covered.`);
    if (!want.length) {
      if (!/^Gap\b/.test(status)) findings.push(`${b}: nothing traces to it, so its status should be Gap.`);
      if (!QUESTION.test(cellText(row.Status) + ' ' + cellText(row['Covered by']))) findings.push(`${b} is a Gap that names no question.`);
    }
  }
  for (const b of rowsByBr.keys()) if (!brIds.has(b)) findings.push(`The row ${b} isn't a business requirement in the BRD.`);
  return { name: 'Every business requirement traced', findings };
}

export function check(project: string, opts: PathOptions = {}): CheckResult {
  const doc = load(project, 'prd', {}, opts);
  const brd = load(project, 'brd', {}, opts);
  const text = doc.text;
  const brIds = new Set((tableUnder(brd.text, 'Business requirements') || []).map((r) => cellText(r['BR ID'])));
  const reqs = requirementsOf(text);
  // One requirement per row (prd-author, step 2, and _shared/atomic-rules.md). A PRD in the old form has already been
  // told to change.
  const rows = reqs.filter((r) => !r.oldForm);
  const rebuild = rebuildCheck(project, rows, opts);
  // Only a Requirement row is read: a Purpose, Scope or Way of working row holds nothing the product must do.
  const maybeTwo = checkOnePerRow(rows.filter((r) => r.isRequirement).map((r) => ({ id: cellText(r.ID), text: r.simple })));
  const nfrs = tableUnder(text, 'NFRs') || [];
  const journey = tableUnder(text, 'The end-to-end journey') || [];
  const transitions = tableUnder(text, 'Transition requirements') || [];
  const tracing = tracingOf(reqs, brIds);

  // The client's words are kept as they are. The check compares them with the simple words, so nothing is lost.
  // The matrix copies each business requirement from the BRD, word for word, and check-brd.ts checks those words.
  const writing = simpleWriting(text, { project, output: opts.output, skipColumns: ["The client's words", 'Requirement as written', 'Business requirement'], compare: ['In simple words', "The client's words"] });
  const graded = questions(project, opts);
  const checks: Check[] = [
    { name: 'Opening', findings: opening(text) },
    { name: 'Sections', findings: sections(text, 'prd') },
    requirementsCheck(reqs, brIds),
    idsCheck(rows),
    rebuild.check,
    agreedWordsCheck(project, rows, opts),
    groupingCheck(text),
    extraSectionsCheck(text),
    nfrsCheck(nfrs),
    journeyCheck(journey, reqs),
    transitionsCheck(transitions),
    traceCheck(tableUnder(text, 'Traceability matrix') || [], brIds, tracing),
    { name: 'Placeholders', findings: placeholders(text) },
    { name: 'Display', findings: rendering(text) },
    { name: 'Simple writing', findings: writing.findings },
    { name: 'Question log', findings: questionFindingsFor(doc, graded) },
  ];

  const evidenced = nfrs.filter((r) => !('Why recommended' in r)).length;
  const covered = [...tracing.values()].filter((s) => s.size).length;
  const others = reqs.filter((r) => !r.isRequirement).length;
  const holds = [
    `${plural(reqs.length - others, 'requirement')}${others ? `, and ${plural(others, 'row')} of purpose, scope or way of working` : ''}, under ${plural(new Set(reqs.map((r) => r._heading)).size, 'heading')} of the client's files`,
    `${plural(rebuild.rows, 'client row')}: ${rebuild.checked} checked against their source file, word for word, and ${rebuild.rows - rebuild.checked} in a file the program can't read`,
    plural(journey.length, 'journey step'),
    `${plural(nfrs.length, 'NFR')}: ${evidenced} evidenced, ${nfrs.length - evidenced} recommended`,
    plural(transitions.length, 'transition requirement'),
    `${covered} of ${plural(brIds.size, 'business requirement')} covered`,
  ];
  const notices = [...writing.notices, ...onePerRowNotices(maybeTwo, 'row')];
  return { doc, checks, holds, graded, notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-prd.ts --project <p>');
  const date = textOption(args, 'date') ?? today();
  const result = check(project, { output: args.output });
  const out = report({ program: programName(import.meta.filename), date, ...result });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
