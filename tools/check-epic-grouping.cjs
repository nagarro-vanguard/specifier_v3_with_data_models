#!/usr/bin/env node
'use strict';
// check-epic-grouping.cjs — checks the EPIC grouping before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-epic-grouping.cjs --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the EPIC grouping template, in order, with no section of its own
//   - the feature inventory is the Feature catalog: every feature once, with its name, requirements, priority and
//     what it depends on copied as they are
//   - there are two or three options, each following a strategy from the list, and each places every feature in
//     exactly one EPIC; the recommended option is one of them
//   - the chosen grouping is one of the options, copied in full: the same EPICs, names, bands and features. Each
//     EPIC's band fits its MVP and Later features, and its outcome reads "As a ..., I need ..., so that ...".
//   - the inter-EPIC dependencies are exactly the ones the catalog's "Depends on" makes across EPICs
//   - every EPIC is in the suggested sequence once, and the EPIC brief list follows that order, with yes or no and a
//     reason for each
//   - every clash is settled, by a decision in the Decision record. A clash is a first-band feature that depends on a
//     later-band one, or an EPIC sequenced before an EPIC it depends on; the program finds every one from the catalog.
//   - once the grouping is accepted, the Decision record holds the pick
//   - no retired Glossary word is used, through lib/scan-retired-words.cjs
//   - no placeholder is left, and lib/md-lint.cjs finds nothing
//   - grade-questions.cjs finds nothing wrong with this grouping's gaps or the questions it raised
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the grouping, the catalog, the Glossary or
// the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const sw = require('./lib/scan-retired-words.cjs');

const STRATEGIES = ['By business capability', 'By user journey stage', 'By persona or role', 'By value stream or outcome', 'By delivery sequence', 'By complexity or risk'];
const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));
const numberOf = (c) => Number((text(c).match(/^(\d+)/) || [])[1]);
const same = (a, b) => a.slice().sort().join() === b.slice().sort().join();

// The tables under a level-3 heading inside a level-2 section, such as "Option A: ..." in "2. Options".
function underHeading(t, prefix) {
  return md.headings(t).filter((h) => h.level === 3 && h.text.startsWith(prefix));
}

function decisionsOf(t) {
  const out = new Map();
  let current = null;
  for (const { line, section } of cd.lines(t)) {
    if (md.normalize(section) !== 'decision record') continue;
    const h = line.match(/^###\s+Decision (\d+) — /);
    if (h) { current = Number(h[1]); out.set(current, ''); }
    const c = line.match(/^- \*\*Chosen:\*\* (.*)$/);
    if (c && current !== null) out.set(current, c[1]);
  }
  return out;
}

function check(project, opts = {}) {
  const doc = cd.load(project, 'epic-grouping', {}, opts);
  const catalog = cd.load(project, 'feature-catalog', {}, opts);
  const t = doc.text;
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Opening', cd.opening(t));
  add('Sections', cd.sections(t, 'epic-grouping'));

  const features = (md.tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const byId = new Map(features.map((f) => [text(f['Feature ID']), f]));
  const inventory = md.tableUnder(t, 'Feature inventory') || [];
  const invFindings = [];
  const seenInv = new Set();
  for (const r of inventory) {
    const id = text(r['Feature ID']);
    const f = byId.get(id);
    if (seenInv.has(id)) invFindings.push(`${id} is listed twice.`);
    seenInv.add(id);
    if (!f) { invFindings.push(`${id} isn't in the Feature catalog.`); continue; }
    if (text(r['Feature Name']) !== text(f.Feature)) invFindings.push(`${id}: its name isn't the catalog's, "${text(f.Feature)}".`);
    if (!same(items(r['Source Reference']), items(f['Covers (source IDs)']))) invFindings.push(`${id}: its source reference isn't what the catalog says it covers.`);
    if (text(r.Priority) !== text(f.Priority)) invFindings.push(`${id}: its priority isn't the catalog's, ${text(f.Priority)}.`);
    if (!same(items(r['Depends on']), items(f['Depends on']))) invFindings.push(`${id}: what it depends on isn't what the catalog says.`);
  }
  for (const id of byId.keys()) if (!seenInv.has(id)) invFindings.push(`${id} is in the Feature catalog but not in the inventory.`);
  add('Feature inventory', invFindings);

  // Every option places every feature in exactly one EPIC.
  const options = new Map();
  const optFindings = [];
  for (const h of underHeading(t, 'Option ')) {
    const m = h.text.match(/^Option ([A-C]): (.+)$/);
    if (!m) { optFindings.push(`"${h.text}" isn't named "Option A: {strategy}".`); continue; }
    if (!STRATEGIES.includes(m[2])) optFindings.push(`Option ${m[1]}: "${m[2]}" isn't a strategy from the list.`);
    const rows = md.tableUnder(t, h.text) || [];
    options.set(m[1], { strategy: m[2], rows });
    const placed = rows.flatMap((r) => items(r['Features (by ID)']));
    for (const id of seenInv) {
      const n = placed.filter((p) => p === id).length;
      if (n !== 1) optFindings.push(`Option ${m[1]} places ${id} ${n === 0 ? 'in no EPIC' : `in ${n} EPICs`}.`);
    }
    for (const p of placed) if (!seenInv.has(p)) optFindings.push(`Option ${m[1]} places ${p}, which isn't in the inventory.`);
  }
  if (options.size < 2 || options.size > 3) optFindings.push(`There ${options.size === 1 ? 'is 1 option' : `are ${options.size} options`}; there should be two or three.`);
  const recommended = (t.match(/^- \*\*Recommended option:\*\* ([A-C])\b/m) || [])[1];
  if (!recommended || !options.has(recommended)) optFindings.push('The recommended option isn\'t one of the options.');
  add('Options', optFindings);

  // The chosen grouping, copied in full from its option.
  const chosenHeading = md.headings(t).find((h) => h.level === 2 && /Chosen grouping: Option ([A-C])/.test(h.text));
  const letter = chosenHeading && chosenHeading.text.match(/Option ([A-C])/)[1];
  const option = letter && options.get(letter);
  const list = md.tableUnder(t, 'EPIC list') || [];
  const defs = md.tableUnder(t, 'EPIC definitions') || [];
  const chosenFindings = [];
  if (!option) chosenFindings.push('The chosen grouping doesn\'t name one of the options.');
  else {
    const want = option.rows.map((r) => `${text(r['Sl. No.'])} ${text(r['EPIC Name'])} ${text(r.Band)}`);
    const haveList = list.map((r) => `${text(r['Sl. No.'])} ${text(r['EPIC Name'])} ${text(r.Band)}`);
    if (want.join('\n') !== haveList.join('\n')) chosenFindings.push(`The EPIC list isn't option ${letter}'s EPICs, names and bands.`);
    for (const r of option.rows) {
      const n = text(r['Sl. No.']);
      const d = defs.find((x) => text(x['Sl. No.']) === n);
      if (!d) { chosenFindings.push(`EPIC ${n} has no definition.`); continue; }
      if (text(d['EPIC Name']) !== text(r['EPIC Name'])) chosenFindings.push(`EPIC ${n}: its name isn't option ${letter}'s.`);
      if (!same([...items(d.MVP), ...items(d.Later)], items(r['Features (by ID)']))) chosenFindings.push(`EPIC ${n}: its MVP and Later features aren't option ${letter}'s.`);
    }
    for (const d of defs) if (!option.rows.some((r) => text(r['Sl. No.']) === text(d['Sl. No.']))) chosenFindings.push(`EPIC ${text(d['Sl. No.'])} isn't in option ${letter}.`);
  }
  for (const d of defs) {
    const n = text(d['Sl. No.']);
    const band = items(d.MVP).length && items(d.Later).length ? 'Mixed' : items(d.Later).length ? 'Later' : 'MVP';
    if (text(d.Band) !== band) chosenFindings.push(`EPIC ${n}: its band is ${text(d.Band)}, but its features make it ${band}.`);
    if (!/^As an? .+, I need .+, so that .+/.test(text(d['Outcome (hypothesis)']))) chosenFindings.push(`EPIC ${n}: its outcome should read "As a {persona}, I need {capability}, so that {outcome}".`);
    if (!text(d.Persona)) chosenFindings.push(`EPIC ${n} has no persona.`);
  }
  add('Chosen grouping', chosenFindings);

  // Inter-EPIC dependencies: exactly the pairs the catalog's "Depends on" makes across EPICs.
  const epicOf = new Map();
  const bandOf = new Map();
  for (const d of defs) {
    for (const f of items(d.MVP)) { epicOf.set(f, numberOf(d['Sl. No.'])); bandOf.set(f, 'MVP'); }
    for (const f of items(d.Later)) { epicOf.set(f, numberOf(d['Sl. No.'])); bandOf.set(f, 'Later'); }
  }
  const edges = [];
  for (const f of features) for (const g of items(f['Depends on'])) edges.push([text(f['Feature ID']), g]);
  const pairs = new Set(edges.filter(([f, g]) => epicOf.has(f) && epicOf.has(g) && epicOf.get(f) !== epicOf.get(g)).map(([f, g]) => `${epicOf.get(f)}>${epicOf.get(g)}`));
  const listed = new Set((md.tableUnder(t, 'Inter-EPIC dependencies') || []).map((r) => `${numberOf(r['From (Sl. No.)'])}>${numberOf(r['Depends on (Sl. No.)'])}`));
  const depFindings = [];
  for (const p of pairs) if (!listed.has(p)) depFindings.push(`EPIC ${p.split('>')[0]} depends on EPIC ${p.split('>')[1]} through the catalog, but it isn't listed.`);
  for (const p of listed) if (!pairs.has(p)) depFindings.push(`EPIC ${p.split('>')[0]} is listed as depending on EPIC ${p.split('>')[1]}, but no feature makes it so.`);
  add('Inter-EPIC dependencies', depFindings);

  // The sequence and the EPIC brief list.
  const sequence = (md.tableUnder(t, 'Suggested EPIC sequence') || []).map((r) => numberOf(r.EPIC));
  const briefs = md.tableUnder(t, 'EPIC brief list, in run order') || [];
  const seqFindings = [];
  for (const d of defs) {
    const n = numberOf(d['Sl. No.']);
    const k = sequence.filter((s) => s === n).length;
    if (k !== 1) seqFindings.push(`EPIC ${n} is in the suggested sequence ${k} times; it should be there once.`);
  }
  if (briefs.map((r) => numberOf(r.EPIC)).join() !== sequence.join()) seqFindings.push('The EPIC brief list doesn\'t follow the suggested sequence.');
  for (const r of briefs) {
    if (!/^(yes|no)$/i.test(text(r.Brief))) seqFindings.push(`EPIC ${numberOf(r.EPIC)}: "Brief" should be yes or no.`);
    if (!text(r.Reason)) seqFindings.push(`EPIC ${numberOf(r.EPIC)} has no reason for its brief.`);
  }
  add('Sequence and EPIC briefs', seqFindings);

  // Clashes, found from the catalog, each settled by a decision.
  const decided = decisionsOf(t);
  const clashRows = md.tableUnder(t, 'Clashes, and how you settled them') || [];
  const clashes = [];
  for (const [f, g] of edges) {
    if (bandOf.get(f) === 'MVP' && bandOf.get(g) === 'Later') clashes.push({ f, g, why: `${f}, in the first band, depends on ${g}, in the later band` });
    const ef = epicOf.get(f);
    const eg = epicOf.get(g);
    if (ef !== undefined && eg !== undefined && ef !== eg && sequence.indexOf(eg) > sequence.indexOf(ef)) clashes.push({ f, g, why: `EPIC ${ef} comes before EPIC ${eg}, but ${f} depends on ${g}` });
  }
  const clashFindings = [];
  for (const c of clashes) {
    const row = clashRows.find((r) => text(r.Feature) === c.f && items(r['Depends on']).includes(c.g));
    if (!row) { clashFindings.push(`A clash isn't settled: ${c.why}.`); continue; }
    if (!text(row.Settlement)) clashFindings.push(`The clash between ${c.f} and ${c.g} has no settlement.`);
    const n = Number((text(row['Decided at']).match(/Decision (\d+)/) || [])[1]);
    if (!decided.has(n)) clashFindings.push(`The clash between ${c.f} and ${c.g} isn't settled by a decision in the Decision record.`);
  }
  add('Clashes', clashFindings);

  const pickFindings = [];
  if (doc.status === 'accepted' && letter && ![...decided.values()].some((c) => new RegExp(`\\bOption ${letter}\\b`).test(c))) pickFindings.push(`The grouping is accepted, but no decision chose option ${letter}.`);
  add('The pick', pickFindings);

  const hits = sw.scan(t, sw.retiredWords(project, opts), sw.currentTerms(project, opts), 'epic-grouping');
  add('Glossary words', hits.map((h) => `Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`));

  add('Placeholders', cd.placeholders(t));
  add('Display', cd.rendering(t));
  const writing = cd.simpleWriting(t, { project, output: opts.output });
  add('Simple writing', writing.findings);
  const graded = cd.questions(project, opts);
  add('Question log', cd.questionFindingsFor(doc, graded));

  const holds = [
    `${cd.plural(options.size, 'option')}, option ${recommended || '?'} recommended`,
    `the chosen grouping: option ${letter || '?'}, ${cd.plural(defs.length, 'EPIC')}`,
    `${cd.plural(clashes.length, 'clash').replace(/clashs$/, 'clashes')} found, ${clashRows.length} settled`,
    `${briefs.filter((r) => /^yes$/i.test(text(r.Brief))).length} of ${cd.plural(briefs.length, 'EPIC')} with an EPIC brief`,
  ];
  return { doc, checks, holds, graded, notices: writing.notices };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/check-epic-grouping.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, { output: args.output });
  const out = cd.report({ program: 'check-epic-grouping.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
