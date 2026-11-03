// check-brd.ts — checks the BRD before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-brd.ts --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the BRD template, in order, with no section of its own
//   - no journey section and no NFR section: both live in the PRD
//   - business requirement IDs are unique, and numbered from BR-01 with no gaps
//   - every KPI has a confidence tag, and every KPI cell holds a value, a [TBD, Q{n}], or a value marked <sup>*Q{n}</sup>
//   - no citations: no "per …", no old gap label, such as "TBD, question 7", and no Source column (lib/marks.ts)
//   - every table or list with a <sup>*Q{n}</sup> has the legend line straight under it, and no other has one
//   - the Check record holds "None yet." or its one line, Pass or Fail with the date and time
//   - "Out of scope" is not empty
//   - one business requirement per row: a business requirement that may hold two actions is shown to look at, never a
//     finding, through lib/one-per-row.ts
//   - no placeholder is left, and lib/md-lint.ts finds nothing
//   - grade-questions.ts finds nothing wrong with this BRD's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exports: check(project, opts), the BRD's checks, for report().
//
// "For the file" is one line, such as "Pass, 2026-11-03 14:05", for the BRD's Check record.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the BRD or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today;
// --time <HH:MM> instead of the time now.

import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import type { PathOptions } from './lib/run-paths.ts';
import { headings, tableUnder, cellText, type Row } from './lib/md-tables.ts';
import { plural } from './lib/text.ts';
import {
  load, lines, opening, sections, placeholders, rendering, simpleWriting, questions, questionFindingsFor, report,
  type DocumentLine,
} from './lib/check-document.ts';
import { check as checkOnePerRow, notices as onePerRowNotices } from './lib/one-per-row.ts';
import { citationFindings, legendFindings, checkRecordFindings, timeNow } from './lib/marks.ts';
import type { Check, CheckResult } from './lib/types.ts';

const CONFIDENCE = /^(CONFIRMED|TENTATIVE|AI-RECOMMENDED)\b/;
const KPI_CELLS = ['Baseline', 'Target', 'Measurement method', 'Measurement cadence', 'Owner'] as const;

// Scan only level-2 section headings: a journey or NFR SECTION belongs in the PRD. Level-3 entries (such as a
// Decision record heading that quotes an NFR question) are not sections and must not trip this.
function noJourneyOrNfrCheck(text: string): Check {
  return {
    name: 'No journey or NFR section',
    findings: headings(text).filter((h) => h.level === 2 && /journey|\bNFRs?\b|non-functional/i.test(h.text)).map((h) => `The heading "${h.text}" belongs in the PRD.`),
  };
}

function idsCheck(brs: Row[]): Check {
  const findings: string[] = [];
  brs.map((r) => cellText(r['BR ID'])).forEach((id, i) => {
    const want = `BR-${String(i + 1).padStart(2, '0')}`;
    if (id !== want) findings.push(`Row ${i + 1} is "${id}"; it should be ${want}.`);
  });
  if (!brs.length) findings.push('There is no business requirement.');
  return { name: 'Business requirement IDs', findings };
}

function kpisCheck(kpis: Row[]): Check {
  const findings: string[] = [];
  for (const k of kpis) {
    if (!CONFIDENCE.test(cellText(k.Confidence))) findings.push(`The KPI "${cellText(k.KPI)}" has no confidence tag: CONFIRMED, TENTATIVE or AI-RECOMMENDED.`);
    for (const col of KPI_CELLS) {
      if (!cellText(k[col])) findings.push(`The KPI "${cellText(k.KPI)}": its ${col.toLowerCase()} is empty. Write the value, [TBD, Q{n}], or the value marked <sup>*Q{n}</sup>.`);
    }
  }
  return { name: 'KPIs', findings };
}

// The bullets under the first heading that matches, up to the next level-2 or level-3 heading, or null when there is
// no such heading.
function bulletsUnder(text: string, heading: RegExp): DocumentLine[] | null {
  const all = lines(text);
  const found = all.filter((l) => heading.test(l.line));
  if (!found.length) return null;
  const after = all.filter((l) => l.n > found[0].n);
  const end = after.findIndex((l) => /^#{2,3}\s/.test(l.line));
  return (end < 0 ? after : after.slice(0, end)).filter((l) => /^\s*-\s+\S/.test(l.line));
}

function outOfScopeCheck(text: string): Check {
  const body = bulletsUnder(text, /^###\s+Out of scope/);
  const findings: string[] = [];
  if (!body) findings.push('There is no "Out of scope" heading.');
  else if (!body.length) findings.push('"Out of scope" is empty. It names what people are likely to assume is included.');
  return { name: 'Out of scope', findings };
}

export function check(project: string, opts: PathOptions = {}): CheckResult {
  const doc = load(project, 'brd', {}, opts);
  const text = doc.text;
  const brs = tableUnder(text, 'Business requirements') || [];
  const kpis = (tableUnder(text, 'Objectives and success metrics') || []).filter((r) => 'KPI' in r);
  const objectives = bulletsUnder(text, /^##\s+3\.\s+Objectives and success metrics/) || [];
  const risks = tableUnder(text, 'Risks') || [];
  const release = tableUnder(text, 'Release criteria') || [];

  const writing = simpleWriting(text, { project, output: opts.output });
  const graded = questions(project, opts);
  const checks: Check[] = [
    { name: 'Opening', findings: opening(text) },
    { name: 'Sections', findings: sections(text, 'brd') },
    noJourneyOrNfrCheck(text),
    idsCheck(brs),
    kpisCheck(kpis),
    { name: 'No citations', findings: citationFindings(text) },
    { name: 'Legend', findings: legendFindings(text) },
    { name: 'Check record', findings: checkRecordFindings(text) },
    outOfScopeCheck(text),
    { name: 'Placeholders', findings: placeholders(text) },
    { name: 'Display', findings: rendering(text) },
    { name: 'Simple writing', findings: writing.findings },
    { name: 'Question log', findings: questionFindingsFor(doc, graded) },
  ];

  const holds = [
    plural(objectives.length, 'objective'),
    plural(kpis.length, 'KPI'),
    plural(brs.length, 'business requirement'),
    plural(risks.length, 'risk'),
    plural((bulletsUnder(text, /^###\s+Constraints/) || []).length, 'constraint'),
    plural(release.length, 'release criterion').replace(/criterions$/, 'criteria'),
  ];
  const maybeTwo = checkOnePerRow(brs.map((r) => ({ id: cellText(r['BR ID']), text: cellText(r['Business requirement']) })));
  return { doc, checks, holds, graded, notices: [...writing.notices, ...onePerRowNotices(maybeTwo, 'business requirement')] };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-brd.ts --project <p>');
  const date = textOption(args, 'date') ?? today();
  const recordTime = textOption(args, 'time') ?? timeNow();
  const result = check(project, { output: args.output });
  const out = report({ program: programName(import.meta.filename), date, recordTime, ...result });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
