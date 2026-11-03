#!/usr/bin/env node
'use strict';
// check-features.cjs — checks the Feature catalog before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-features.cjs --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the Feature catalog template, in order, with no section of its own
//   - every feature sits under a heading of the PRD's own, and has: an ID, F-01 onward, used once; a name; a
//     description; a "Done when" that adds at least one word its description doesn't have; the requirements it covers,
//     each one in the PRD; a priority, Must, Should, Could or Won't, with a basis from the fixed list; what it depends
//     on, each a feature in the catalog; and a capability, such as "FRD-3a Claim approval"
//   - every feature's "Done when" is cut into pieces, F-01.dw1 onward, each in its own words and its own order, so read
//     together they give it back, with nothing left over but "and", "or", "then" or punctuation; and each feature's
//     pieces sit under its own heading, its ID and then its name, as section 2 has them
//   - every Requirement row in the PRD is covered by a feature, or is a Gap that names its question, and the coverage
//     check lists exactly the features that cover each one. A Purpose, Scope or Way of working row gets no feature
//     and no coverage row.
//   - data model coverage: every row of every Actions table and every Moves table in the data model files has exactly
//     one row in section 5, in the files' order, with its data model file, its thing and its action or move word for
//     word, and one feature from the catalog. A move is named From → To. Section 5 lists nothing else. The things
//     file and every data model file it names are accepted. The files are read through lib/data-model.cjs.
//   - a row of section 5 may wait on a change instead of naming a feature, until that change adds its feature. Its
//     Feature cell then reads "waits on change" and the change's 3-digit number, such as "waits on change 004", and
//     nothing else. The change must be in the project's changes/ folder, found through check-document.cjs's changeOf.
//     A waiting row is never a finding, and never counted as having a feature. "For the person" lists each one, and
//     the coverage line says how many wait. A row that still waits on a closed change is a finding. A change is
//     closed when its progress file, changes/{change}/progress.md, reads "Status: closed". The change has run, so
//     the row should name its feature.
//   - a row of section 5 that no feature names yet shows "?" in its Feature cell, until the gate settles it. An open
//     row is never a finding before the catalog is accepted, and never counted as having a feature. The table of
//     rows to settle at the gate, under the same section, has one row for each open row, with the two answers of
//     feature-author's step 6, each yes or no, and the recommendation they give. A recommendation that names a feature
//     names the one that owns the thing's first action, as that action's row names it. "For the person" lists each
//     open row with its recommendation, under a line saying the catalog can't be accepted yet. This is the catalog's
//     guard, like the FRD guard in check-frd.cjs. Once the catalog is accepted, a row that still shows "?" is a finding.
//   - one capability per feature: a feature's name that may name two things, a description that may hold two
//     actions, and a "Done when" piece that may hold two, are shown to look at, never a finding, through
//     lib/one-per-row.cjs
//   - one FRD for each PRD section: each PRD section whose features name more than one capability is shown to look
//     at, never a finding, as feature-author's FR-7 says
//   - no retired Glossary word is used, through lib/scan-retired-words.cjs. It skips text copied exactly from the PRD,
//     because the PRD is never rewritten to match the Glossary: a heading that is a PRD section's heading, and a
//     coverage check row's requirement title that is its PRD title. It skips text copied exactly from the data model
//     the same way: in section 5, a row's data model file, thing, and action or move. A copy that differs is scanned.
//   - no placeholder is left, and lib/md-lint.cjs finds nothing
//   - grade-questions.cjs finds nothing wrong with this catalog's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the catalog, the PRD, the Glossary, the
// data model's things file, a data model file it names, or the layout is missing. The data model is required, as the
// Glossary is.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const sw = require('./lib/scan-retired-words.cjs');
const dm = require('./lib/data-model.cjs');
const op = require('./lib/one-per-row.cjs');

const BASES = ['Benefit', 'Penalty', 'Cost', 'Risk', 'Dependency', 'Time-sensitivity', 'Stability', 'Regulatory'];
const PRIORITIES = ['Must', 'Should', 'Could', "Won't"];
const GAP = /Proposed \(needs confirmation\)|\bTBD\b|\[Not specified in provided sources\]/;
// Words that join two pieces of a "Done when"; nothing else may be left over between them.
const JOINS = /^[\s,;:.]*(?:(?:and|or|then|but)\b[\s,;:.]*)?$/i;
const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));
const words = (s) => new Set((s.toLowerCase().match(/[a-z0-9']+/g) || []));

// The pieces must appear in the Done when, in order, with only joining words between them and at the ends.
function piecesFit(doneWhen, pieces) {
  let rest = doneWhen.toLowerCase();
  for (const p of pieces) {
    const at = rest.indexOf(p.toLowerCase());
    if (at < 0 || !JOINS.test(rest.slice(0, at))) return false;
    rest = rest.slice(at + p.length);
  }
  return JOINS.test(rest);
}

// A data model file's name in a cell: "lending.md", "`lending.md`", or a link to it.
const fileName = (c) => text(c).replace(/^\[([^\]]*)\]\([^)]*\)$/, '$1').replace(/`/g, '').trim();

// A row of section 5 that waits on a change, until the change adds its feature: "waits on change 004", and nothing else.
const WAITS = /^waits on change (\d{3})$/;
// How many rows wait, as the coverage line says it: "none waits", "1 waits" or "2 wait".
const waitCount = (n) => (n === 0 ? 'none waits' : n === 1 ? '1 waits' : `${n} wait`);
// A row of section 5 that no feature names yet shows "?" in its Feature cell, until the gate settles it.
const OPEN = '?';
// How many rows still show "?", as the coverage line says it: "none shows", "1 shows" or "2 show".
const openCount = (n) => (n === 0 ? 'none shows' : n === 1 ? '1 shows' : `${n} show`);
// The recommendation for an open row, from its two answers, as feature-author's step 6 gives it. Where it names a
// feature, that feature owns the thing's first action.
const RECOMMENDED = [
  { prd: 'yes', big: 'no', re: /^Add a piece to the Done when of (F-\d{2,})$/, says: 'Add a piece to the Done when of F-nn' },
  { prd: 'yes', big: 'yes', re: /^A new feature$/, says: 'A new feature' },
  { prd: 'no', big: 'no', re: /^Give it to (F-\d{2,})$/, says: 'Give it to F-nn' },
  { prd: 'no', big: 'yes', re: /^A new requirement first, then a new feature$/, says: 'A new requirement first, then a new feature' },
];

// A change is closed once close-change.cjs sets its progress file's status line to "Status: closed on {date}".
function isClosed(project, change, opts) {
  const file = rp.pathOf(project, 'change-progress', { change: change.folder }, opts);
  return fs.existsSync(file) && /^Status: closed/m.test(rp.readText(file));
}

// Section 5: every action and every move in the data model files, one row each, in the files' order, and the one
// feature it belongs to, the change it waits on, or "?" until the gate settles it. Each one is named "{file}, {thing},
// {action or move}".
function dataModelCoverage(t, model, ids, project, opts) {
  const findings = [];
  for (const f of [model.thingsFile, ...model.files]) {
    if (f.status.state !== 'accepted') findings.push(`${f.name} isn't accepted. Its status is "${f.status.raw || 'missing'}".`);
  }
  if (!model.files.length) findings.push(`The things file, ${model.thingsFile.name}, names no data model file.`);
  const keyOf = (file, thing, name) => `${file}, ${thing}, ${name}`;
  const wanted = dm.actionsAndMoves(model).map((a) => ({ key: keyOf(a.file, a.thing, a.name), kind: a.kind }));
  const all = md.tableUnder(t, 'Data model coverage');
  if (all === null) {
    findings.push('There is no "Data model coverage" section, so no action or move has a feature.');
    return { findings, wanted: wanted.length, covered: 0, waiting: [], open: [] };
  }
  // The section holds two tables: one row for each action and move, and the rows to settle at the gate.
  const rows = all.filter((r) => 'Feature' in r);
  const toSettle = all.filter((r) => 'Recommended' in r);
  const listed = rows.map((r) => {
    const features = items(r.Feature);
    const w = features.length === 1 && features[0].match(WAITS);
    return { key: keyOf(fileName(r['Data model file']), text(r.Thing), text(r['Action or move'])), features, waitsOn: w ? w[1] : null, open: features.length === 1 && features[0] === OPEN };
  });
  const count = (list) => list.reduce((m, x) => m.set(x.key, (m.get(x.key) || 0) + 1), new Map());
  const need = count(wanted);
  const have = count(listed);
  const good = (l) => l.features.length === 1 && ids.includes(l.features[0]);
  let covered = 0;
  for (const [key, n] of need) {
    const h = have.get(key) || 0;
    const kind = wanted.find((w) => w.key === key).kind;
    if (!h) findings.push(`${key}: this ${kind} has no row.`);
    else if (h !== n) findings.push(`${key} has ${h} rows. It needs ${n === 1 ? 'exactly one' : n}.`);
    else if (listed.filter((l) => l.key === key).every(good)) covered += n;
  }
  // A row that waits on a change is neither a finding nor covered. Its change must be in the project's changes/ folder,
  // and still open. An open row, which shows "?", is neither a finding nor covered either.
  const waiting = [];
  const openKeys = [];
  for (const l of listed) {
    if (!need.has(l.key)) findings.push(`${l.key} isn't an action or a move in the data model files, word for word.`);
    if (l.open) {
      if (need.has(l.key)) openKeys.push(l.key);
    } else if (l.waitsOn) {
      let change = null;
      try {
        change = cd.changeOf(project, l.waitsOn, opts);
      } catch (e) {
        if (!(e instanceof rp.LayoutError)) throw e;
        findings.push(`${l.key} waits on change ${l.waitsOn}, which isn't in the project's changes/ folder.`);
      }
      if (change && isClosed(project, change, opts)) findings.push(`${l.key} still waits on change ${l.waitsOn}, which is closed. The change has run, so the row should name its feature.`);
      else if (change && need.has(l.key)) waiting.push({ key: l.key, change: l.waitsOn });
    } else if (l.features.some((x) => /^waits\b/i.test(x))) findings.push(`${l.key}: a row that waits on a change reads "waits on change" and the change's 3-digit number, such as "waits on change 004", and nothing else.`);
    else if (l.features.length !== 1) findings.push(`${l.key} should name exactly one feature. It names ${l.features.length}.`);
    else if (!ids.includes(l.features[0])) findings.push(`${l.key} goes to ${l.features[0]}, which isn't in the catalog.`);
  }
  // The rows follow the files' order. Each one is placed by its first row.
  const order = [...new Set(listed.map((l) => l.key).filter((k) => need.has(k)))];
  const expected = [...need.keys()].filter((k) => have.has(k));
  const at = order.findIndex((k, i) => k !== expected[i]);
  if (at >= 0) findings.push(`The rows aren't in the data model files' order: "${order[at]}" comes where "${expected[at]}" should.`);

  // The feature that owns each thing's first action, the one that makes it, as its row in section 5 names it. A
  // recommendation that names a feature names this one. It isn't known while that row names no feature of its own.
  const firstOwner = new Map();
  for (const [thing, t] of dm.things(model)) {
    const first = t.actions[0];
    if (!first) continue;
    const action = dm.cell(first.Action).text;
    const row = listed.find((l) => l.key === keyOf(first._file, thing, action));
    if (row && good(row)) firstOwner.set(thing, { feature: row.features[0], action });
  }

  // The rows to settle at the gate: one for each open row, with its two answers and the recommendation they give.
  const open = [];
  const settleOf = new Map();
  for (const r of toSettle) {
    const key = keyOf(fileName(r['Data model file']), text(r.Thing), text(r['Action or move']));
    if (!settleOf.has(key)) settleOf.set(key, []);
    settleOf.get(key).push(r);
  }
  for (const [key, rs] of settleOf) {
    if (!openKeys.includes(key)) findings.push(`${key} is listed to settle at the gate, but its row in section 5 doesn't show "?".`);
    if (rs.length > 1) findings.push(`${key} is listed ${rs.length} times to settle at the gate. It needs exactly one row.`);
  }
  for (const key of openKeys) {
    const r = (settleOf.get(key) || [])[0];
    if (!r) {
      findings.push(`${key} shows "?", but the rows to settle at the gate don't list it with a recommendation.`);
      open.push({ key, recommended: null });
      continue;
    }
    const prd = text(r['PRD says it?']).toLowerCase();
    const big = text(r['Big enough?']).toLowerCase();
    const recommended = text(r.Recommended).replace(/\.$/, '');
    open.push({ key, recommended });
    const rule = RECOMMENDED.find((x) => x.prd === prd && x.big === big);
    if (!rule) { findings.push(`${key}: "PRD says it?" and "Big enough?" should each be yes or no.`); continue; }
    const m = recommended.match(rule.re);
    if (!m) findings.push(`${key}: "PRD says it?" is ${prd}, and "Big enough?" is ${big}. So the recommendation is "${rule.says}", as feature-author's step 6 says.${/F-nn/.test(rule.says) ? ' F-nn is the feature that owns the thing\'s first action.' : ''}`);
    else if (m[1] && !ids.includes(m[1])) findings.push(`${key}: its recommendation names ${m[1]}, which isn't in the catalog.`);
    else if (m[1]) {
      const owner = firstOwner.get(text(r.Thing));
      if (owner && m[1] !== owner.feature) findings.push(`${key}: its recommendation names ${m[1]}, but ${owner.feature} owns ${owner.action}, the thing's first action. So the recommendation names ${owner.feature}.`);
    }
  }
  return { findings, wanted: wanted.length, covered, waiting, open };
}

function check(project, opts = {}) {
  const doc = cd.load(project, 'feature-catalog', {}, opts);
  const prd = cd.load(project, 'prd', {}, opts);
  // The data model is required. A missing things file, or a missing data model file, stops the check with exit code 2.
  const model = dm.load(project, opts);
  const t = doc.text;
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Opening', cd.opening(t));
  add('Sections', cd.sections(t, 'feature-catalog'));

  // The PRD's requirements, and the headings they sit under.
  const reqs = cd.requirementsOf(prd.text);
  const reqIds = new Map(reqs.map((r) => [text(r.ID), r]));
  const prdHeadings = new Set(reqs.map((r) => r._heading));

  const features = (md.tableUnder(t, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const ids = features.map((f) => text(f['Feature ID']));
  const featureFindings = [];
  let last = 0;
  for (const f of features) {
    const id = text(f['Feature ID']);
    const at = id || `A feature under "${f._heading}"`;
    const m = id.match(/^F-(\d{2,})$/);
    if (!m) featureFindings.push(`${at}: its ID should be F- and a two-digit number, such as F-03.`);
    else {
      if (Number(m[1]) <= last) featureFindings.push(`${id} is out of order, or used twice: IDs run on from F-01.`);
      last = Number(m[1]);
    }
    if (!prdHeadings.has(f._heading)) featureFindings.push(`${at} sits under "${f._heading}", which isn't a heading of the PRD.`);
    for (const [col, label] of [['Feature', 'name'], ['Description (what it is)', 'description'], ['Done when (observable)', '"Done when"'], ['Capability', 'capability']]) {
      if (!text(f[col])) featureFindings.push(`${at} has no ${label}.`);
    }
    const dw = words(text(f['Done when (observable)']));
    const desc = words(text(f['Description (what it is)']));
    if (dw.size && [...dw].every((w) => desc.has(w))) featureFindings.push(`${at}: its "Done when" only repeats its description; it must add at least one condition.`);
    const covers = items(f['Covers (source IDs)']);
    if (!covers.length) featureFindings.push(`${at} covers no requirement.`);
    for (const c of covers) {
      if (!reqIds.has(c) && !GAP.test(c)) featureFindings.push(`${at} covers ${c}, which isn't in the PRD.`);
      else if (reqIds.has(c) && !reqIds.get(c).isRequirement) featureFindings.push(`${at} covers ${c}, which is a ${reqIds.get(c).kind} row, not a requirement.`);
    }
    const priority = text(f.Priority);
    if (!PRIORITIES.includes(priority) && !GAP.test(priority)) featureFindings.push(`${at}: its priority is "${priority}"; it should be Must, Should, Could or Won't.`);
    const basis = text(f.Basis);
    if (!BASES.some((b) => basis.startsWith(`${b} — `)) && !GAP.test(basis)) featureFindings.push(`${at}: its basis should be one from the fixed list, then " — " and one clause, such as "Penalty — paying an unapproved claim breaks the expense policy".`);
    for (const d of items(f['Depends on'])) if (!ids.includes(d)) featureFindings.push(`${at} depends on ${d}, which isn't in the catalog.`);
    const cap = text(f.Capability);
    if (cap && !/^FRD-\d+[a-z] \S/.test(cap)) featureFindings.push(`${at}: its capability should be FRD-, the PRD section number and a letter, then a name, such as "FRD-3a Claim approval".`);
  }
  if (!features.length) featureFindings.push('There is no feature.');
  add('Features', featureFindings);

  const pieces = md.tableUnder(t, '"Done when" pieces') || [];
  const pieceFindings = [];
  const byFeature = new Map();
  // Each feature's pieces sit under its own heading, "{Feature ID} {Feature}", so a reader sees them together.
  const headingOf = new Map(features.map((f) => [text(f['Feature ID']), `${text(f['Feature ID'])} ${text(f.Feature)}`]));
  for (const p of pieces) {
    const pid = text(p['Piece ID']);
    const m = pid.match(/^(F-\d{2,})\.dw(\d+)$/);
    if (!m) { pieceFindings.push(`"${pid}" isn't a piece ID, such as F-03.dw1.`); continue; }
    if (!ids.includes(m[1])) pieceFindings.push(`${pid} belongs to ${m[1]}, which isn't in the catalog.`);
    else if (text(p._heading) !== headingOf.get(m[1])) pieceFindings.push(`${pid} should sit under its feature's own heading, "${headingOf.get(m[1])}".`);
    if (!byFeature.has(m[1])) byFeature.set(m[1], []);
    byFeature.get(m[1]).push({ n: Number(m[2]), piece: text(p.Piece) });
  }
  for (const f of features) {
    const id = text(f['Feature ID']);
    const mine = byFeature.get(id) || [];
    if (!mine.length) { pieceFindings.push(`${id} has no pieces.`); continue; }
    if (mine.some((p, i) => p.n !== i + 1)) pieceFindings.push(`${id}: its pieces should run from dw1 onward, in order, with no gaps.`);
    if (!piecesFit(text(f['Done when (observable)']), mine.map((p) => p.piece))) pieceFindings.push(`${id}: its pieces don't give back its "Done when", in its own words and order.`);
  }
  add('"Done when" pieces', pieceFindings);

  // Only Requirement rows need a feature. A Purpose, Scope or Way of working row needs none.
  const covering = new Map(reqs.filter((r) => r.isRequirement).map((r) => [text(r.ID), []]));
  for (const f of features) for (const c of items(f['Covers (source IDs)'])) if (covering.has(c)) covering.get(c).push(text(f['Feature ID']));
  const coverage = md.tableUnder(t, 'Coverage check') || [];
  const rowOf = new Map(coverage.map((r) => [text(r['Requirement ID']), r]));
  const coverageFindings = [];
  for (const [req, fs] of covering) {
    const row = rowOf.get(req);
    if (!row) { coverageFindings.push(`${req} has no row in the coverage check.`); continue; }
    const listed = items(row['Covered by']).filter((x) => /^F-\d/.test(x)).sort();
    if (listed.join() !== fs.slice().sort().join()) coverageFindings.push(`${req}: "Covered by" lists ${listed.join(', ') || 'nothing'}, but the features that cover it are ${fs.join(', ') || 'none'}.`);
    const status = text(row.Status);
    if (fs.length && !/^(Covered|Partial)\b/.test(status)) coverageFindings.push(`${req} is covered, so its status should be Covered or Partial.`);
    if (!fs.length && !(/^Gap\b/.test(status) && /question \d+/i.test(status))) coverageFindings.push(`${req}: no feature covers it, so it is a Gap that names its question.`);
  }
  for (const r of rowOf.keys()) {
    if (reqIds.has(r) && !reqIds.get(r).isRequirement) coverageFindings.push(`${r} is a ${reqIds.get(r).kind} row, not a requirement, so it needs no row.`);
    else if (!covering.has(r)) coverageFindings.push(`The coverage check lists ${r}, which isn't in the PRD.`);
  }
  add('Coverage', coverageFindings);

  const dmCoverage = dataModelCoverage(t, model, ids, project, opts);
  // The catalog's guard: the gate settles every "?" before the catalog is accepted.
  if (doc.status === 'accepted') {
    for (const o of dmCoverage.open) dmCoverage.findings.push(`${o.key} still shows "?", but the catalog is accepted. The gate settles every "?" before the catalog is accepted.`);
  }
  add('Data model coverage', dmCoverage.findings);

  // Text copied exactly from the PRD is the PRD's words, not the catalog's. On a first run the PRD comes before the
  // Glossary, and it is never rewritten to match it ("Agreed words" in _shared/conventions.md), so the scan skips two
  // copies: a level-3 heading that is a PRD section's heading, word for word, and a coverage check row's requirement
  // title that is its PRD title, word for word. Text copied exactly from the data model is skipped the same way, as
  // check-frd.cjs skips it: a row of section 5 whose data model file, thing, and action or move are an action or a
  // move of the data model files, word for word. Both of section 5's tables copy them. Each copy is blanked, so line
  // numbers stay the same. Everything else, a copy that differs included, is scanned.
  const titles = new Map();
  for (const r of reqs) {
    const m = r.simple.match(/^\*\*(.+?)\*\* — /);
    if (m) titles.set(text(r.ID), m[1]);
  }
  const dmKeys = new Set(dm.actionsAndMoves(model).map((a) => `${a.file}, ${a.thing}, ${a.name}`));
  const blank = (s) => ' '.repeat(s.length);
  let section = '';
  const own = t.split('\n').map((l) => {
    const h = l.match(/^(#{2,3}\s+)(.*?)\s*$/);
    if (h) {
      if (/^##\s/.test(l)) section = md.normalize(h[2]);
      return /^###\s/.test(l) && prdHeadings.has(h[2]) ? `${h[1]}${blank(h[2])}` : l;
    }
    const copied = section === 'data model coverage' && l.match(/^(\|\s*)([^|]*?)(\s*\|\s*)([^|]*?)(\s*\|\s*)([^|]*?)(\s*\|.*)$/);
    if (copied && dmKeys.has(`${fileName(copied[2])}, ${copied[4]}, ${copied[6]}`)) {
      const [, a, file, b, thing, c, name, rest] = copied;
      return `${a}${blank(file)}${b}${blank(thing)}${c}${blank(name)}${rest}`;
    }
    const row = section === 'coverage check' && l.match(/^(\|\s*(\S+?)\s*\|\s*)(.*?)(\s*\|.*)$/);
    return row && titles.get(row[2]) === row[3] ? `${row[1]}${blank(row[3])}${row[4]}` : l;
  }).join('\n');
  const retired = sw.retiredWords(project, opts);
  const hits = sw.scan(own, retired, sw.currentTerms(project, opts), 'feature-catalog');
  add('Glossary words', hits.map((h) => `Line ${h.line}: "${h.word}" is a retired word; use ${h.useNow.join(' or ') || 'nothing in its place'}.`));

  add('Placeholders', cd.placeholders(t));
  add('Display', cd.rendering(t));
  const writing = cd.simpleWriting(t, { project, output: opts.output });
  add('Simple writing', writing.findings);
  const graded = cd.questions(project, opts);
  add('Question log', cd.questionFindingsFor(doc, graded));

  const count = (p) => features.filter((f) => text(f.Priority) === p).length;
  const holds = [
    `${cd.plural(features.length, 'feature')}: ${PRIORITIES.map((p) => `${count(p)} ${p}`).join(', ')}`,
    cd.plural(pieces.length, '"Done when" piece'),
    cd.plural(new Set(features.map((f) => text(f.Capability)).filter(Boolean)).size, 'capability').replace(/capabilitys$/, 'capabilities'),
    `${[...covering.values()].filter((v) => v.length).length} of ${cd.plural(covering.size, 'requirement')} covered`,
    `${dmCoverage.covered} of ${dmCoverage.wanted} actions and moves in the data model have a feature, ${openCount(dmCoverage.open.length)} "?", and ${waitCount(dmCoverage.waiting.length)} on a change`,
  ];
  const notices = [];
  // The catalog's guard. Each row that still shows "?" is shown at the gate, with its recommendation. Before the
  // catalog is accepted, it is never a finding.
  if (dmCoverage.open.length && doc.status !== 'accepted') {
    notices.push(`This Feature catalog can't be accepted yet: ${dmCoverage.open.length === 1 ? '1 row of section 5 still shows' : `${dmCoverage.open.length} rows of section 5 still show`} "?". The gate settles each one first. The recommendation for each:`);
    notices.push(...dmCoverage.open.map((o) => `- ${o.key}: ${o.recommended || 'no recommendation yet'}`));
  }
  // Each row that waits on a change is shown at the gate. It is never a finding.
  if (dmCoverage.waiting.length) {
    notices.push(`Waiting on a change, so no feature yet: ${dmCoverage.waiting.length}. Each one gets its feature when its change runs feature-author:`);
    notices.push(...dmCoverage.waiting.map((w) => `- ${w.key}: waits on change ${w.change}`));
  }
  notices.push(...writing.notices);
  // One capability per feature: its name and its description, each to look at.
  const ofFeature = (col, kind) => features.map((f) => ({ id: text(f['Feature ID']), text: text(f[col]), kind }));
  notices.push(...op.notices(op.check(ofFeature('Feature', 'name')), 'feature name'));
  notices.push(...op.notices(op.check(ofFeature('Description (what it is)', 'statement')), 'feature description'));
  // One behaviour per piece: a piece with two gets a rule for each in the FRD (atomic-rules.md, part 3).
  notices.push(...op.notices(op.check(pieces.map((p) => ({ id: text(p['Piece ID']), text: text(p.Piece), kind: 'statement' }))), '"Done when" piece'));
  // A capability is one FRD (feature-author, FR-7): one for each PRD section, unless the section holds two sets of
  // rules that don't depend on each other. Each section with more than one is shown to look at, never a finding.
  const bySection = new Map();
  for (const cap of new Set(features.map((f) => text(f.Capability)))) {
    const n = (cap.match(/^FRD-(\d+)[a-z] /) || [])[1];
    if (n) bySection.set(n, [...(bySection.get(n) || []), cap]);
  }
  const split = [...bySection].filter(([, caps]) => caps.length > 1);
  if (split.length) {
    notices.push(`One FRD for each PRD section, to look at: ${cd.plural(split.length, 'PRD section')} ${split.length === 1 ? 'has' : 'have'} more than one capability. Keep a split only when each part holds rules that don't depend on the other's, and different people act in each.`);
    notices.push(...split.map(([n, caps]) => `- section ${n}: ${caps.join(', ')}`));
  }
  return { doc, checks, holds, graded, notices };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/check-features.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, { output: args.output });
  const out = cd.report({ program: 'check-features.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check, piecesFit };

if (require.main === module) rp.run(main);
