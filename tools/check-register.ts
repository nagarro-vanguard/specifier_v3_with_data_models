// check-register.ts — proves the EPIC register is an exact copy of the chosen grouping in the EPIC grouping.
//
//   node tools/check-register.ts --project <p>
//
// What it checks, for each EPIC in the chosen grouping's definitions, in order:
//   - its row is EPIC- and its Sl. No. as three digits, so 1 becomes EPIC-001
//   - Name, Outcome, Band and Persona are copied word for word
//   - Features are its MVP features, then its Later ones
//   - Depends on is each EPIC its inter-EPIC dependencies name, as EPIC IDs, or None
// and that the run order is the suggested sequence, each rationale copied word for word. A row the grouping hasn't
// got is a mismatch too.
//
// It also checks the register against simple-writing-rules.md, through lib/check-document.ts, as every check program
// does. Anything to fix is a finding. How many places are to look at is shown in one line, such as
// "Simple writing: 0 to fix, 1 to look at."
//
// When everything matches and nothing is to fix, it writes the date on the register's "Copy checked on" line, and
// nothing else. The register has no gate: epic-author then runs accept.ts, because a pass is its acceptance.
//
// Exports:
//   check(project, opts)   the register, its mismatches, its simple writing, and how many EPICs the grouping has
//   epicId(n)              an EPIC's ID from its Sl. No., such as EPIC-001 for 1
//
// Exit codes: 0 the register matches, with nothing to fix; 1 mismatches or simple writing to fix, each listed; 2 the
// register, the grouping or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { writeText, type PathOptions } from './lib/run-paths.ts';
import { tableUnder, cellText, cellItems, cellNumber, type Row } from './lib/md-tables.ts';
import { load, simpleWriting } from './lib/check-document.ts';
import { plural } from './lib/text.ts';
import type { LoadedDocument } from './lib/types.ts';

const PROGRAM = programName(import.meta.filename);
const FIELDS = ['Name', 'Outcome', 'Features', 'Band', 'Persona', 'Depends on'] as const;
type Field = (typeof FIELDS)[number];

export interface RegisterCheck {
  register: LoadedDocument;
  findings: string[];
  writing: ReturnType<typeof simpleWriting>;
  // How many EPICs the chosen grouping defines.
  epics: number;
}

export const epicId = (n: number): string => `EPIC-${String(n).padStart(3, '0')}`;

// Each EPIC's fields as the grouping gives them.
function fromGrouping(definition: Row, n: number, deps: Row[]): Record<Field, string> {
  return {
    Name: cellText(definition['EPIC Name']),
    Outcome: cellText(definition['Outcome (hypothesis)']),
    Features: [...cellItems(definition.MVP), ...cellItems(definition.Later)].join(', '),
    Band: cellText(definition.Band),
    Persona: cellText(definition.Persona),
    'Depends on': deps.filter((x) => cellNumber(x['From (Sl. No.)']) === n).map((x) => epicId(cellNumber(x['Depends on (Sl. No.)']))).sort().join(', ') || 'None',
  };
}

// Each EPIC's fields as the register's row has them.
function fromRegister(row: Row): Record<Field, string> {
  return {
    Name: cellText(row.Name),
    Outcome: cellText(row.Outcome),
    Features: cellItems(row.Features).join(', '),
    Band: cellText(row.Band),
    Persona: cellText(row.Persona),
    'Depends on': cellItems(row['Depends on']).slice().sort().join(', ') || 'None',
  };
}

function rowFindings(definitions: Row[], deps: Row[], rows: Row[]): string[] {
  const findings: string[] = [];
  const byId = new Map(rows.map((r) => [cellText(r.EPIC), r]));
  for (const definition of definitions) {
    const n = cellNumber(definition['Sl. No.']);
    const id = epicId(n);
    const row = byId.get(id);
    if (!row) {
      findings.push(`${id} is missing: the grouping's EPIC ${n}, ${cellText(definition['EPIC Name'])}.`);
      continue;
    }
    const want = fromGrouping(definition, n, deps);
    const have = fromRegister(row);
    for (const field of FIELDS) if (want[field] !== have[field]) findings.push(`${id}: ${field} is "${have[field]}"; the grouping has "${want[field]}".`);
  }
  for (const id of byId.keys()) if (!definitions.some((d) => epicId(cellNumber(d['Sl. No.'])) === id)) findings.push(`${id} isn't in the chosen grouping.`);
  return findings;
}

function runOrderFindings(sequence: Row[], order: Row[]): string[] {
  const findings: string[] = [];
  const wantOrder = sequence.map((s) => `${cellText(s.Sequence)} ${epicId(cellNumber(s.EPIC))} ${cellText(s.Rationale)}`);
  const haveOrder = order.map((o) => `${cellText(o.Order)} ${cellText(o.EPIC)} ${cellText(o.Rationale)}`);
  wantOrder.forEach((want, i) => {
    if (haveOrder[i] !== want) findings.push(`Run order, row ${i + 1}: "${haveOrder[i] || 'missing'}"; the grouping has "${want}".`);
  });
  if (haveOrder.length > wantOrder.length) findings.push(`The run order has ${haveOrder.length} rows; the grouping's sequence has ${wantOrder.length}.`);
  return findings;
}

export function check(project: string, opts: PathOptions = {}): RegisterCheck {
  const register = load(project, 'epic-register', {}, opts);
  const grouping = load(project, 'epic-grouping', {}, opts);
  const definitions = tableUnder(grouping.text, 'EPIC definitions') || [];
  const deps = tableUnder(grouping.text, 'Inter-EPIC dependencies') || [];
  const sequence = tableUnder(grouping.text, 'Suggested EPIC sequence') || [];
  const rows = tableUnder(register.text, 'EPICs') || [];
  const order = tableUnder(register.text, 'Run order') || [];
  const findings = [...rowFindings(definitions, deps, rows), ...runOrderFindings(sequence, order)];
  const writing = simpleWriting(register.text, { project, output: opts.output });
  return { register, findings, writing, epics: definitions.length };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-register.ts --project <p>');
  const date = textOption(args, 'date') ?? today();
  const result = check(project, { output: args.output });
  const toFix = result.writing.findings;
  const toLook = result.writing.notices.filter((n) => n.startsWith('- ')).length;
  const writingLine = `Simple writing: ${toFix.length} to fix, ${toLook} to look at.`;
  if (result.findings.length || toFix.length) {
    const out = result.findings.length
      ? [`${PROGRAM}, ${date}: the register doesn't match the chosen grouping: ${plural(result.findings.length, 'mismatch').replace(/mismatchs$/, 'mismatches')}.`, ...result.findings.map((f) => `- ${f}`)]
      : [`${PROGRAM}, ${date}: the register matches the chosen grouping, but its simple writing has ${plural(toFix.length, 'place')} to fix.`];
    out.push(writingLine, ...toFix.map((f) => `- ${f}`));
    process.stdout.write(`${out.join('\n')}\n`);
    return 1;
  }
  const before = result.register.text;
  const after = before.replace(/^- \*\*Copy checked on:\*\* .*$/m, `- **Copy checked on:** ${date}`);
  if (after !== before) writeText(result.register.file, after);
  process.stdout.write(`${PROGRAM}, ${date}: the register matches the chosen grouping: ${plural(result.epics, 'EPIC')}, field for field, and the run order.\n${writingLine}\n`);
  return 0;
}

if (import.meta.main) runMain(main);
