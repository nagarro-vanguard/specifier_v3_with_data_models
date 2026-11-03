// check-epic-brief.ts — checks an EPIC brief before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-epic-brief.ts --project <p> --epic EPIC-002
//
// What it checks:
//   - the opening blocks, and every section of the EPIC brief template, in order, with no section of its own
//   - the EPIC is on the EPIC brief list, marked yes
//   - its hypothesis is the register row's outcome, word for word
//   - its features are its register row's, each with the catalog's name, requirements and description, and the band
//     the EPIC grouping gives it; In scope is those features, and Out of scope every other EPIC's, each with its owner
//   - "EPICs this one needs" and "EPICs that need this one" are the EPICs the register says this one depends on, and
//     that depend on it
//   - every measure has a confidence tag, and an AI-RECOMMENDED measure's baseline and target are TBD
//   - its NFR section lists only NFR IDs that are in the PRD
//   - no retired Glossary word is used, through lib/scan-retired-words.ts
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - grade-questions.ts finds nothing wrong with this brief's gaps or the questions it raised
//
// Exports:
//   check(project, epic, opts)   every check on the brief, what the draft holds, and the gate's notices
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the brief, the register, the catalog, the
// PRD, the Glossary or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import { parseArgs, requireOption, textOption, today, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import type { PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellItems, cellNumber, type Row } from './lib/md-tables.ts';
import { load, lines, opening, sections, placeholders, rendering, simpleWriting, questions, questionFindingsFor, report, epicOf, type Epic } from './lib/check-document.ts';
import { retiredWords, currentTerms, scan } from './lib/scan-retired-words.ts';
import { plural } from './lib/text.ts';
import type { Check, CheckResult } from './lib/types.ts';
import { sameItems } from './check-epic-grouping.ts';

const PROGRAM = programName(import.meta.filename);

// The bullets under a level-3 heading, up to the next level-2 or level-3 heading, each without its "- ".
function bullets(t: string, heading: string): string[] {
  return lines(t).filter((l, i, all) => {
    const at = all.findIndex((x) => x.line.trim() === `### ${heading}`);
    if (at < 0 || i <= at) return false;
    const end = all.findIndex((x, k) => k > at && /^#{2,3}\s/.test(x.line));
    return (end < 0 || i < end) && /^- \S/.test(l.line);
  }).map((l) => l.line.replace(/^- /, '').trim());
}

function briefListCheck(epic: Epic, n: number, groupingText: string): Check {
  const listed = (tableUnder(groupingText, 'EPIC brief list, in run order') || []).find((r) => cellNumber(r.EPIC) === n);
  const findings = !listed ? [`${epic.id} isn't on the EPIC grouping's brief list.`] : /^yes$/i.test(cellText(listed.Brief)) ? [] : [`The EPIC brief list says ${epic.id} gets no brief.`];
  return { name: 'On the EPIC brief list', findings };
}

function hypothesisCheck(epic: Epic, t: string): Check {
  const hypothesis = t.match(/^\*\*Epic hypothesis:\*\* (.+?)\.?$/m)?.[1];
  const outcome = cellText(epic.row.Outcome).replace(/\.$/, '');
  const findings = hypothesis === undefined ? ['There is no "Epic hypothesis" line.'] : hypothesis !== outcome ? [`The hypothesis isn't the register's outcome, word for word: "${outcome}".`] : [];
  return { name: 'Hypothesis', findings };
}

// Each feature row is the catalog's, with the band the EPIC grouping gives it.
function featureRowFindings(table: Row[], byId: Map<string, Row>, definition: Row | undefined): string[] {
  const bandOf = (f: string) => (definition && cellItems(definition.MVP).includes(f) ? 'MVP' : definition && cellItems(definition.Later).includes(f) ? 'Later' : '?');
  const findings: string[] = [];
  for (const r of table) {
    const f = byId.get(cellText(r['Feature ID']));
    if (!f) continue;
    const id = cellText(r['Feature ID']);
    if (cellText(r.Feature) !== cellText(f.Feature)) findings.push(`${id}: its name isn't the catalog's, "${cellText(f.Feature)}".`);
    if (!sameItems(cellItems(r['Req ID']), cellItems(f['Covers (source IDs)']))) findings.push(`${id}: its requirements aren't the ones the catalog says it covers.`);
    if (cellText(r['What it delivers']) !== cellText(f['Description (what it is)'])) findings.push(`${id}: "What it delivers" isn't the catalog's description, word for word.`);
    if (cellText(r.Band) !== bandOf(id)) findings.push(`${id}: its band is ${cellText(r.Band)}; the EPIC grouping puts it in ${bandOf(id)}.`);
  }
  return findings;
}

// In scope is the EPIC's features, and Out of scope every other EPIC's, each with its owner.
function scopeFindings(t: string, epic: Epic, mine: string[], registerRows: Row[]): string[] {
  const findings: string[] = [];
  const inScope = bullets(t, 'In').map((b) => b.split(' ')[0]);
  if (!sameItems(inScope, mine)) findings.push(`In scope lists ${inScope.join(', ') || 'nothing'}; the EPIC's features are ${mine.join(', ')}.`);
  const owner = new Map<string, string>();
  for (const r of registerRows) for (const f of cellItems(r.Features)) owner.set(f, cellText(r.EPIC));
  const outOfScope = bullets(t, 'Out');
  for (const [f, o] of owner) {
    if (o === epic.id) continue;
    const line = outOfScope.find((b) => b.startsWith(`${f} `));
    if (!line) findings.push(`Out of scope leaves out ${f}, owned by ${o}.`);
    else if (!line.endsWith(`owned by ${o}`)) findings.push(`Out of scope: ${f} is owned by ${o}.`);
  }
  return findings;
}

// Features, scope and bands.
function featuresCheck(t: string, epic: Epic, n: number, table: Row[], registerRows: Row[], catalogText: string, groupingText: string): Check {
  const mine = cellItems(epic.row.Features);
  const byId = new Map((tableUnder(catalogText, 'Feature catalog') || []).filter((r) => 'Feature ID' in r).map((r) => [cellText(r['Feature ID']), r]));
  const definition = (tableUnder(groupingText, 'EPIC definitions') || []).find((d) => cellNumber(d['Sl. No.']) === n);
  const findings: string[] = [];
  const listedIds = table.map((r) => cellText(r['Feature ID']));
  if (!sameItems(listedIds, mine)) findings.push(`The features are ${listedIds.join(', ') || 'none'}; the register row has ${mine.join(', ')}.`);
  findings.push(...featureRowFindings(table, byId, definition), ...scopeFindings(t, epic, mine, registerRows));
  return { name: 'Features and scope', findings };
}

// The EPICs a dependency part lists. A brief written before simple-writing-rules.md names these parts Upstream and
// Downstream.
function listedEpics(t: string, name: string, old: string): string[] {
  const listed = bullets(t, name).length ? bullets(t, name) : bullets(t, old);
  return listed.map((b) => b.split(' ')[0]).filter((x) => /^EPIC-/.test(x));
}

function dependenciesCheck(epic: Epic, upstream: string[], downstream: string[], registerRows: Row[]): Check {
  const wantUp = cellItems(epic.row['Depends on']);
  const wantDown = registerRows.filter((r) => cellItems(r['Depends on']).includes(epic.id)).map((r) => cellText(r.EPIC));
  const findings: string[] = [];
  if (!sameItems(upstream, wantUp)) findings.push(`"EPICs this one needs" lists ${upstream.join(', ') || 'none'}; the register has ${wantUp.join(', ') || 'none'}.`);
  if (!sameItems(downstream, wantDown)) findings.push(`"EPICs that need this one" lists ${downstream.join(', ') || 'none'}; the register has ${wantDown.join(', ') || 'none'}.`);
  return { name: 'Dependencies', findings };
}

function measuresCheck(measures: Row[]): Check {
  const findings: string[] = [];
  for (const m of measures) {
    const confidence = cellText(m.Confidence);
    if (!/^(CONFIRMED|TENTATIVE|AI-RECOMMENDED)\b/.test(confidence)) findings.push(`"${cellText(m.Measure)}" has no confidence tag.`);
    if (/^AI-RECOMMENDED/.test(confidence) && (!/\bTBD\b/.test(cellText(m.Baseline)) || !/\bTBD\b/.test(cellText(m.Target)))) findings.push(`"${cellText(m.Measure)}" is AI-RECOMMENDED, so its baseline and target are TBD.`);
  }
  return { name: 'Measures', findings };
}

function nfrCheck(nfrs: string[], prdText: string): Check {
  const nfrIds = new Set((tableUnder(prdText, 'NFRs') || []).map((r) => cellText(r['NFR ID'])));
  const findings = nfrs.filter((x) => !nfrIds.has(x)).map((x) => `${x} isn't an NFR in the PRD.`);
  if (nfrs.some((x) => !/^NFR-\d+$/.test(x))) findings.push('The NFR section lists only NFR IDs, never their wording.');
  return { name: 'NFRs that apply', findings };
}

export function check(project: string, epicName: string, opts: PathOptions = {}): CheckResult {
  const epic = epicOf(project, epicName, opts);
  const doc = load(project, 'epic-brief', { epic: epic.folder }, opts);
  const register = load(project, 'epic-register', {}, opts);
  const grouping = load(project, 'epic-grouping', {}, opts);
  const catalog = load(project, 'feature-catalog', {}, opts);
  const prd = load(project, 'prd', {}, opts);
  const t = doc.text;
  const n = Number(epic.id.slice(5));
  const registerRows = tableUnder(register.text, 'EPICs') || [];
  const table = tableUnder(t, 'Features') || [];
  const upstream = listedEpics(t, 'EPICs this one needs', 'Upstream');
  const downstream = listedEpics(t, 'EPICs that need this one', 'Downstream');
  const measures = tableUnder(t, 'Success or fitness criteria') || [];
  const nfrs = (tableUnder(t, 'NFRs that apply') || []).map((r) => cellText(r['NFR ID']));

  const checks: Check[] = [
    { name: 'Opening', findings: opening(t) },
    { name: 'Sections', findings: sections(t, 'epic-brief') },
    briefListCheck(epic, n, grouping.text),
    hypothesisCheck(epic, t),
    featuresCheck(t, epic, n, table, registerRows, catalog.text, grouping.text),
    dependenciesCheck(epic, upstream, downstream, registerRows),
    measuresCheck(measures),
    nfrCheck(nfrs, prd.text),
  ];
  const hits = scan(t, retiredWords(project, opts), currentTerms(project, opts), 'epic-brief');
  checks.push({ name: 'Glossary words', findings: hits.map((h) => `Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`) });
  checks.push({ name: 'Placeholders', findings: placeholders(t) }, { name: 'Display', findings: rendering(t) });
  const writing = simpleWriting(t, { project, output: opts.output });
  checks.push({ name: 'Simple writing', findings: writing.findings });
  const graded = questions(project, opts);
  checks.push({ name: 'Question log', findings: questionFindingsFor(doc, graded) });

  const holds = [
    `${epic.id} ${epic.name}: ${plural(table.length, 'feature')}`,
    plural(measures.length, 'success measure'),
    `${plural(nfrs.length, 'NFR')} that ${nfrs.length === 1 ? 'applies' : 'apply'}`,
    `${upstream.length} upstream and ${downstream.length} downstream ${upstream.length + downstream.length === 1 ? 'EPIC' : 'EPICs'}`,
  ];
  return { doc, checks, holds, graded, notices: writing.notices };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const use = 'Use: node tools/check-epic-brief.ts --project <p> --epic EPIC-002';
  const project = requireOption(args, 'project', use);
  const epic = args.values.epic;
  if (!epic) fail(use, 2);
  const date = textOption(args, 'date') ?? today();
  const out = report({ program: PROGRAM, date, ...check(project, String(epic), { output: args.output }) });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
