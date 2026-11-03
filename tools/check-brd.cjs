#!/usr/bin/env node
'use strict';
// check-brd.cjs — checks the BRD before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-brd.cjs --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the BRD template, in order, with no section of its own
//   - no journey section and no NFR section: both live in the PRD
//   - business requirement IDs are unique, and numbered from BR-01 with no gaps
//   - every KPI has a confidence tag, and every KPI cell says where it came from
//   - every objective, business requirement, risk and release criterion says where it came from
//   - "Out of scope" is not empty
//   - one business requirement per row: a business requirement that may hold two actions is shown to look at, never a
//     finding, through lib/one-per-row.cjs
//   - no placeholder is left, and lib/md-lint.cjs finds nothing
//   - grade-questions.cjs finds nothing wrong with this BRD's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the BRD or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const op = require('./lib/one-per-row.cjs');

// Where a line came from, in one of four forms (conventions.md, "Cite every specific" and "Unknowns").
const ORIGIN = /\bper\b|Proposed \(needs confirmation\)|\bTBD\b|\[Not specified in provided sources\]/;
const CONFIDENCE = /^(CONFIRMED|TENTATIVE|AI-RECOMMENDED)\b/;
const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();

function check(project, opts = {}) {
  const doc = cd.load(project, 'brd', {}, opts);
  const t = doc.text;
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Opening', cd.opening(t));
  add('Sections', cd.sections(t, 'brd'));
  // Scan only level-2 section headings: a journey or NFR SECTION belongs in the PRD. Level-3 entries (such as a
  // Decision record heading that quotes an NFR question) are not sections and must not trip this.
  add('No journey or NFR section', md.headings(t).filter((h) => h.level === 2 && /journey|\bNFRs?\b|non-functional/i.test(h.text)).map((h) => `The heading "${h.text}" belongs in the PRD.`));

  const brs = md.tableUnder(t, 'Business requirements') || [];
  const ids = brs.map((r) => text(r['BR ID']));
  const idFindings = [];
  ids.forEach((id, i) => {
    const want = `BR-${String(i + 1).padStart(2, '0')}`;
    if (id !== want) idFindings.push(`Row ${i + 1} is "${id}"; it should be ${want}.`);
  });
  if (!brs.length) idFindings.push('There is no business requirement.');
  add('Business requirement IDs', idFindings);

  const rows = md.tableUnder(t, 'Objectives and success metrics') || [];
  const kpis = rows.filter((r) => 'KPI' in r);
  const objectives = rows.filter((r) => 'Objective' in r);
  const kpiFindings = [];
  for (const k of kpis) {
    if (!CONFIDENCE.test(text(k.Confidence))) kpiFindings.push(`The KPI "${text(k.KPI)}" has no confidence tag: CONFIRMED, TENTATIVE or AI-RECOMMENDED.`);
    for (const col of ['Baseline', 'Target', 'Measurement method', 'Measurement cadence', 'Owner']) {
      if (!ORIGIN.test(text(k[col]))) kpiFindings.push(`The KPI "${text(k.KPI)}": its ${col.toLowerCase()} doesn't say where it came from.`);
    }
  }
  add('KPIs', kpiFindings);

  const sourced = (rowsOf, label, key, col) => rowsOf.filter((r) => !ORIGIN.test(text(r[col]))).map((r) => `The ${label} "${text(r[key])}" doesn't say where it came from.`);
  const risks = md.tableUnder(t, 'Risks') || [];
  const release = md.tableUnder(t, 'Release criteria') || [];
  const riskSource = risks.length && !('Source' in risks[0]) ? ['The Risks table has no Source column.'] : sourced(risks, 'risk', 'Risk', 'Source');
  add('Every line says where it came from', [
    ...sourced(objectives, 'objective', 'Objective', 'Source'),
    ...sourced(brs, 'business requirement', 'BR ID', 'Source'),
    ...riskSource,
    ...sourced(release, 'release criterion', '#', 'Source'),
  ]);

  const outOfScope = cd.lines(t).filter((l) => /^###\s+Out of scope/.test(l.line));
  const outFindings = [];
  if (!outOfScope.length) outFindings.push('There is no "Out of scope" heading.');
  else {
    const after = cd.lines(t).filter((l) => l.n > outOfScope[0].n);
    const end = after.findIndex((l) => /^#{2,3}\s/.test(l.line));
    const body = (end < 0 ? after : after.slice(0, end)).filter((l) => /^\s*-\s+\S/.test(l.line));
    if (!body.length) outFindings.push('"Out of scope" is empty. It names what people are likely to assume is included.');
  }
  add('Out of scope', outFindings);

  add('Placeholders', cd.placeholders(t));
  add('Display', cd.rendering(t));
  const writing = cd.simpleWriting(t, { project, output: opts.output });
  add('Simple writing', writing.findings);
  const graded = cd.questions(project, opts);
  add('Question log', cd.questionFindingsFor(doc, graded));

  const count = (n, word) => cd.plural(n, word);
  const constraints = cd.lines(t).filter((l) => /^###\s+Constraints/.test(l.line));
  let nConstraints = 0;
  if (constraints.length) {
    const after = cd.lines(t).filter((l) => l.n > constraints[0].n);
    const end = after.findIndex((l) => /^#{2,3}\s/.test(l.line));
    nConstraints = (end < 0 ? after : after.slice(0, end)).filter((l) => /^\s*-\s+\S/.test(l.line)).length;
  }
  const holds = [
    count(objectives.length, 'objective'),
    count(kpis.length, 'KPI'),
    count(brs.length, 'business requirement'),
    count(risks.length, 'risk'),
    count(nConstraints, 'constraint'),
    count(release.length, 'release criterion').replace(/criterions$/, 'criteria'),
  ];
  const maybeTwo = op.check(brs.map((r) => ({ id: text(r['BR ID']), text: text(r['Business requirement']) })));
  return { doc, checks, holds, graded, notices: [...writing.notices, ...op.notices(maybeTwo, 'business requirement')] };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/check-brd.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, { output: args.output });
  const out = cd.report({ program: 'check-brd.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
