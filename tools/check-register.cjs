#!/usr/bin/env node
'use strict';
// check-register.cjs — proves the EPIC register is an exact copy of the chosen grouping in the EPIC grouping.
//
//   node tools/check-register.cjs --project <p>
//
// What it checks, for each EPIC in the chosen grouping's definitions, in order:
//   - its row is EPIC- and its Sl. No. as three digits, so 1 becomes EPIC-001
//   - Name, Outcome, Band and Persona are copied word for word
//   - Features are its MVP features, then its Later ones
//   - Depends on is each EPIC its inter-EPIC dependencies name, as EPIC IDs, or None
// and that the run order is the suggested sequence, each rationale copied word for word. A row the grouping hasn't
// got is a mismatch too.
//
// It also checks the register against simple-writing-rules.md, through lib/check-document.cjs, as every check program
// does. Anything to fix is a finding. How many places are to look at is shown in one line, such as
// "Simple writing: 0 to fix, 1 to look at."
//
// When everything matches and nothing is to fix, it writes the date on the register's "Copy checked on" line, and
// nothing else. The register has no gate: epic-author then runs accept.cjs, because a pass is its acceptance.
//
// Exit codes: 0 the register matches, with nothing to fix; 1 mismatches or simple writing to fix, each listed; 2 the
// register, the grouping or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');

const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));
const numberOf = (c) => Number((text(c).match(/^(\d+)/) || [])[1]);
const epicId = (n) => `EPIC-${String(n).padStart(3, '0')}`;

function check(project, opts = {}) {
  const register = cd.load(project, 'epic-register', {}, opts);
  const grouping = cd.load(project, 'epic-grouping', {}, opts);
  const g = grouping.text;
  const defs = md.tableUnder(g, 'EPIC definitions') || [];
  const deps = md.tableUnder(g, 'Inter-EPIC dependencies') || [];
  const sequence = md.tableUnder(g, 'Suggested EPIC sequence') || [];
  const rows = md.tableUnder(register.text, 'EPICs') || [];
  const order = md.tableUnder(register.text, 'Run order') || [];
  const findings = [];

  const byId = new Map(rows.map((r) => [text(r.EPIC), r]));
  for (const d of defs) {
    const n = numberOf(d['Sl. No.']);
    const id = epicId(n);
    const r = byId.get(id);
    if (!r) { findings.push(`${id} is missing: the grouping's EPIC ${n}, ${text(d['EPIC Name'])}.`); continue; }
    const want = {
      Name: text(d['EPIC Name']),
      Outcome: text(d['Outcome (hypothesis)']),
      Features: [...items(d.MVP), ...items(d.Later)].join(', '),
      Band: text(d.Band),
      Persona: text(d.Persona),
      'Depends on': deps.filter((x) => numberOf(x['From (Sl. No.)']) === n).map((x) => epicId(numberOf(x['Depends on (Sl. No.)']))).sort().join(', ') || 'None',
    };
    const have = {
      Name: text(r.Name),
      Outcome: text(r.Outcome),
      Features: items(r.Features).join(', '),
      Band: text(r.Band),
      Persona: text(r.Persona),
      'Depends on': items(r['Depends on']).slice().sort().join(', ') || 'None',
    };
    for (const k of Object.keys(want)) if (want[k] !== have[k]) findings.push(`${id}: ${k} is "${have[k]}"; the grouping has "${want[k]}".`);
  }
  for (const id of byId.keys()) if (!defs.some((d) => epicId(numberOf(d['Sl. No.'])) === id)) findings.push(`${id} isn't in the chosen grouping.`);

  const wantOrder = sequence.map((s) => `${text(s.Sequence)} ${epicId(numberOf(s.EPIC))} ${text(s.Rationale)}`);
  const haveOrder = order.map((o) => `${text(o.Order)} ${text(o.EPIC)} ${text(o.Rationale)}`);
  wantOrder.forEach((w, i) => { if (haveOrder[i] !== w) findings.push(`Run order, row ${i + 1}: "${haveOrder[i] || 'missing'}"; the grouping has "${w}".`); });
  if (haveOrder.length > wantOrder.length) findings.push(`The run order has ${haveOrder.length} rows; the grouping's sequence has ${wantOrder.length}.`);
  const writing = cd.simpleWriting(register.text, { project, output: opts.output });
  return { register, findings, writing, epics: defs.length };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/check-register.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, { output: args.output });
  const toFix = r.writing.findings;
  const toLook = r.writing.notices.filter((n) => n.startsWith('- ')).length;
  const writingLine = `Simple writing: ${toFix.length} to fix, ${toLook} to look at.`;
  if (r.findings.length || toFix.length) {
    const out = r.findings.length
      ? [`check-register.cjs, ${date}: the register doesn't match the chosen grouping: ${cd.plural(r.findings.length, 'mismatch').replace(/mismatchs$/, 'mismatches')}.`, ...r.findings.map((f) => `- ${f}`)]
      : [`check-register.cjs, ${date}: the register matches the chosen grouping, but its simple writing has ${cd.plural(toFix.length, 'place')} to fix.`];
    out.push(writingLine, ...toFix.map((f) => `- ${f}`));
    process.stdout.write(`${out.join('\n')}\n`);
    return 1;
  }
  const before = r.register.text;
  const after = before.replace(/^- \*\*Copy checked on:\*\* .*$/m, `- **Copy checked on:** ${date}`);
  if (after !== before) rp.writeText(r.register.file, after);
  process.stdout.write(`check-register.cjs, ${date}: the register matches the chosen grouping: ${cd.plural(r.epics, 'EPIC')}, field for field, and the run order.\n${writingLine}\n`);
  return 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
