#!/usr/bin/env node
'use strict';
// check-discovery-brief.cjs — checks the Discovery brief before its gate, and prints the three blocks the gate needs.
//
//   node tools/check-discovery-brief.cjs --project <p>
//
// What it checks:
//   - the opening blocks, and every section of the Discovery brief template, in order, with no section of its own
//   - section 1 lists every file list-sources.cjs finds in sources/, once each, under its own folder, and nothing else:
//     - every copy and older version list-sources.cjs marks is marked the same way, pointing to the same file
//     - "same as" is used only for files whose contents are identical
//     - every file not used gives its reason, and a file ruled out of scope names the decision that ruled it out, or,
//       until the gate settles it, reads "to be decided at the gate"
//     - the Summary's counts add up
//   - the order of authority ranks from 1, and covers every kind of document marked Used
//   - every topic sits under one of the nine areas, has a verdict that fits its quotes, and quotes only files marked
//     Used; every Silent topic names its question
//   - every Differ topic is a clash, and every clash is a Differ topic; every clash is settled: by a rank, where the
//     file of the higher kind wins, or by a decision that names its question. "What now holds" is in simple words.
//   - every assumption names its question, and every question named is in the Question log
//   - every risk says what it would cost
//   - no placeholder is left, and lib/md-lint.cjs finds nothing
//   - grade-questions.cjs finds nothing wrong with this brief's gaps or the questions it raised. An open question is
//     never a finding.
//
// Exit codes: 0 every check passed; 1 findings, each listed; 2 the project, the brief, sources/ or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const ls = require('./list-sources.cjs');

const AREAS = [
  'Users and context',
  'Problem and value',
  'Scope edges',
  'Rules and constraints',
  'Data and states',
  'Edge cases and failure modes',
  'Dependencies and integrations',
  'Success and acceptance',
  'Non-functional',
];
const VERDICT = /^(Agree|One source|Differ|Silent)\b/;
const KINDS_OF_CLASH = ['Contradiction', 'Different value', 'Different scope'];
const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter(Boolean);
const lower = (s) => s.toLowerCase();

// A link's target, decoded, from the project folder: [name](sources/a%20b/c.md) -> sources/a b/c.md
function target(cell) {
  const m = text(cell).match(/\]\(([^)]+)\)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
}

// Each quote in a cell: { quote, file }, from lines like: "Any employee can claim." — per claims-v2.docx, section 1.2
function quotes(cell) {
  return items(cell).map((q) => q.match(/^"(.*)"\s+—\s+per\s+([^,]+?)(?:,.*)?$/)).filter(Boolean).map((m) => ({ quote: m[1], file: m[2].trim() }));
}

// The section a line sits in, by its level-2 heading.
function bodyOf(t, heading) {
  return cd.lines(t).filter((l) => md.normalize(l.section) === lower(heading));
}

// Each decision in the Decision record, with the question it answers: Map(decision number -> question number or null).
function decisions(t) {
  const out = new Map();
  let current = null;
  for (const { line, section } of cd.lines(t)) {
    if (md.normalize(section) !== 'decision record') continue;
    const h = line.match(/^###\s+Decision (\d+) — /);
    if (h) { current = Number(h[1]); out.set(current, null); }
    const q = line.match(/^- \*\*Question:\*\* (\d+)/);
    if (q && current !== null) out.set(current, Number(q[1]));
  }
  return out;
}

function check(project, opts = {}) {
  const doc = cd.load(project, 'discovery-brief', {}, opts);
  const t = doc.text;
  const listed = ls.list(project, opts);
  const graded = cd.questions(project, opts);
  const known = new Set((graded.questions || []).map((q) => q.n));
  const decided = decisions(t);
  const checks = [];
  const add = (name, findings) => checks.push({ name, findings });

  add('Opening', cd.opening(t));
  add('Sections', cd.sections(t, 'discovery-brief'));

  // Section 1, against what list-sources.cjs finds.
  const rows = (md.tableUnder(t, 'Sources') || []).filter((r) => '#' in r && 'File' in r);
  const srcFindings = [];
  const byNumber = new Map();
  const byPath = new Map();
  const proposedOut = [];
  for (const r of rows) {
    const n = Number(text(r['#']));
    const p = target(r.File);
    const rel = p && p.replace(/^sources\//, '');
    const row = { n, rel, name: rel ? rel.slice(rel.lastIndexOf('/') + 1) : '', folder: r._heading, kind: text(r['Kind of document']), used: text(r.Used) };
    if (!p || !p.startsWith('sources/')) { srcFindings.push(`File ${n} doesn't link to a file in sources/.`); continue; }
    if (byNumber.has(n)) srcFindings.push(`The number ${n} is used twice.`);
    if (byPath.has(rel)) srcFindings.push(`${rel} is listed twice.`);
    byNumber.set(n, row);
    byPath.set(rel, row);
    const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/') + 1) : 'sources/';
    if (row.folder !== folder) srcFindings.push(`File ${n}, ${rel}, is under "${row.folder}"; it belongs under "${folder}".`);
  }
  const numbers = [...byNumber.keys()].sort((a, b) => a - b);
  if (numbers.some((n, i) => n !== i + 1)) srcFindings.push('The files are not numbered from 1 with no gaps.');
  const found = new Map(listed.files.map((f) => [f.rel, f]));
  const pathOfN = (n) => (listed.files.find((f) => f.n === n) || {}).rel;
  const judged = new Set(listed.toJudge.flat().map((f) => f.rel));
  for (const f of listed.files) if (!byPath.has(f.rel)) srcFindings.push(`${f.rel} is in sources/ but not in section 1.`);
  for (const [rel, row] of byPath) {
    const f = found.get(rel);
    if (!f) { srcFindings.push(`File ${row.n}, ${rel}, isn't in sources/.`); continue; }
    const m = row.used.match(/^No: (same as|older version of) (\d+)\b/);
    const pointsTo = m && byNumber.get(Number(m[2]));
    if (f.mark) {
      const word = f.mark.kind === 'same' ? 'same as' : 'older version of';
      const want = pathOfN(f.mark.of);
      if (!m || m[1] !== word || !pointsTo || pointsTo.rel !== want) srcFindings.push(`File ${row.n}, ${rel}: list-sources.cjs marks it "${word}" ${want}; section 1 says "${row.used}".`);
    } else if (m && m[1] === 'same as') {
      srcFindings.push(`File ${row.n}, ${rel}, is marked "same as", but its contents differ from every other file.`);
    } else if (m && m[1] === 'older version of' && !pointsTo) {
      srcFindings.push(`File ${row.n}, ${rel}, is marked "older version of" a file number that isn't in section 1.`);
    } else if (m && m[1] === 'older version of' && !judged.has(rel)) {
      // A judgement beyond what list-sources.cjs can see, such as "draft" and "final": allowed, and shown at the gate.
    }
    if (!/^Yes$/.test(row.used) && !/^No: \S/.test(row.used)) srcFindings.push(`File ${row.n}, ${rel}: "Used" is "${row.used}"; it should be Yes, or No with the reason.`);
    const scope = row.used.match(/^No: out of scope\b(.*)$/);
    if (scope) {
      // Proposed by discovery-author, and settled at the gate: the decision is named once it is made.
      const pending = /to be decided at the gate/.test(scope[1]);
      const d = scope[1].match(/Decision (\d+)/);
      if (pending) {
        proposedOut.push(rel);
        if (doc.status === 'accepted') srcFindings.push(`File ${row.n}, ${rel}, still waits for its decision, but the brief is accepted.`);
      } else if (!d) srcFindings.push(`File ${row.n}, ${rel}, is out of scope, but names no decision.`);
      else if (!decided.has(Number(d[1]))) srcFindings.push(`File ${row.n}, ${rel}, names Decision ${d[1]}, which isn't in the Decision record.`);
    }
  }
  const used = [...byPath.values()].filter((r) => r.used === 'Yes');
  add('Sources', srcFindings);

  // A brief written before simple-writing-rules.md calls the Summary "At a glance".
  const glance = (md.tableUnder(t, 'Summary') || md.tableUnder(t, 'At a glance') || [])[0] || {};
  const count = (re) => [...byPath.values()].filter((r) => re.test(r.used)).length;
  const want = { Files: byPath.size, Used: used.length, 'Same as another file': count(/^No: same as /), 'Older version': count(/^No: older version of /), 'Out of scope': count(/^No: out of scope\b/) };
  const glanceFindings = Object.entries(want).filter(([k, v]) => Number(text(glance[k])) !== v).map(([k, v]) => `"${k}" says ${text(glance[k]) || 'nothing'}; the tables hold ${v}.`);
  add('Summary', glanceFindings);

  // Section 2: the order of authority.
  const ranks = md.tableUnder(t, 'Which kind of source wins') || [];
  const rankOf = new Map(ranks.map((r) => [lower(text(r['Kind of document'])), Number(text(r.Rank))]));
  const orderFindings = ranks.length ? [] : ['There is no order of authority.'];
  ranks.forEach((r, i) => { if (Number(text(r.Rank)) !== i + 1) orderFindings.push(`Row ${i + 1} has rank "${text(r.Rank)}"; it should be ${i + 1}.`); });
  for (const k of new Set(used.map((r) => r.kind))) if (!rankOf.has(lower(k))) orderFindings.push(`"${k}" is a kind of document marked Used, but it has no rank.`);
  add('Order of authority', orderFindings);

  // Section 3: topics and verdicts.
  const usedNames = new Set(used.map((r) => r.name));
  const kindOfFile = new Map([...byPath.values()].map((r) => [r.name, r.kind]));
  const topics = md.tableUnder(t, 'Known: what the sources say, topic by topic') || [];
  const topicFindings = [];
  const differ = new Set();
  const named = [];
  for (const r of topics) {
    const topic = text(r.Topic);
    const verdict = text(r.Verdict);
    const v = verdict.match(VERDICT);
    if (!AREAS.includes(r._heading)) topicFindings.push(`"${topic}" is under "${r._heading}", which isn't one of the nine areas.`);
    if (!v) { topicFindings.push(`"${topic}" has the verdict "${verdict}"; it should be Agree, One source, Differ or Silent.`); continue; }
    const qs = quotes(r['What the sources say']);
    const files = new Set(qs.map((q) => q.file));
    for (const f of files) if (!usedNames.has(f)) topicFindings.push(`"${topic}" quotes ${f}, which isn't marked Used.`);
    if (v[1] === 'Silent') {
      if (qs.length) topicFindings.push(`"${topic}" is Silent, but quotes a file.`);
      const q = verdict.match(/question (\d+)/i);
      if (!q) topicFindings.push(`"${topic}" is Silent, but names no question.`);
      else named.push({ where: `"${topic}"`, n: Number(q[1]) });
    } else if (v[1] === 'One source' && files.size !== 1) topicFindings.push(`"${topic}" is One source, but quotes ${cd.plural(files.size, 'file')}.`);
    else if ((v[1] === 'Agree' || v[1] === 'Differ') && files.size < 2) topicFindings.push(`"${topic}" is ${v[1]}, but quotes ${cd.plural(files.size, 'file')}; it needs two or more.`);
    if (v[1] === 'Differ') differ.add(topic);
  }
  add('Topics', topicFindings);

  // Section 4: every Differ topic is a clash, and every clash is settled.
  const clashes = md.tableUnder(t, 'Clashes, and how each is settled') || [];
  const clashFindings = [];
  const clashTopics = new Set(clashes.map((r) => text(r.Topic)));
  for (const d of differ) if (!clashTopics.has(d)) clashFindings.push(`"${d}" is marked Differ, but isn't a clash.`);
  for (const r of clashes) {
    const topic = text(r.Topic);
    const at = `Clash ${text(r['#'])}, "${topic}"`;
    if (!differ.has(topic)) clashFindings.push(`${at} isn't a topic marked Differ in section 3.`);
    if (!KINDS_OF_CLASH.includes(text(r['Kind of clash']))) clashFindings.push(`${at}: "${text(r['Kind of clash'])}" isn't a kind of clash: Contradiction, Different value or Different scope.`);
    const by = text(r['Settled by']);
    const holds = text(r['What now holds']).replace(/^"|"$/g, '');
    const question = text(r.Question);
    const qs = quotes(r['What each file says']);
    for (const q of qs) if (!usedNames.has(q.file)) clashFindings.push(`${at} quotes ${q.file}, which isn't marked Used.`);
    const rank = by.match(/^Rank (\d+): (.+)$/);
    const dec = by.match(/^Decision (\d+)$/);
    if (!by || !holds) clashFindings.push(`${at} has no winner: "Settled by" and "What now holds" must both be filled.`);
    else if (rank) {
      const kind = lower(rank[2]);
      if (rankOf.get(kind) !== Number(rank[1])) clashFindings.push(`${at} is settled by "${by}", which isn't a rank in section 2.`);
      const kinds = qs.map((q) => rankOf.get(lower(kindOfFile.get(q.file) || ''))).filter((n) => n !== undefined);
      if (kinds.length && Math.min(...kinds) !== Number(rank[1])) clashFindings.push(`${at} is settled by rank ${rank[1]}, but a file of rank ${Math.min(...kinds)} is in the clash, and the higher kind wins.`);
      // "What now holds" says in simple words what the winning file says (simple-writing-rules.md, part 4), so it is
      // never compared with the file's own words.
      if (question !== '-') clashFindings.push(`${at} is settled by a rank, so its question is "-", not "${question}".`);
    } else if (dec) {
      const n = Number(dec[1]);
      const q = question.match(/^question (\d+)$/i);
      if (!decided.has(n)) clashFindings.push(`${at} is settled by Decision ${n}, which isn't in the Decision record.`);
      if (!q) clashFindings.push(`${at} is settled by a decision, but names no question.`);
      else {
        named.push({ where: at, n: Number(q[1]) });
        if (decided.has(n) && decided.get(n) !== Number(q[1])) clashFindings.push(`${at} names question ${q[1]}, but Decision ${n} answers question ${decided.get(n)}.`);
      }
    } else clashFindings.push(`${at} is settled by "${by}"; it should be a rank, such as "Rank 1: Policy", or a decision, such as "Decision 2".`);
  }
  if (!clashes.length && !bodyOf(t, 'Clashes, and how each is settled').some((l) => /^None\.?$/.test(l.line.trim()))) clashFindings.push('There is no clash, so the section says None.');
  add('Clashes', clashFindings);

  // Section 5: every assumption names its question.
  const assumed = bodyOf(t, 'Assumed').filter((l) => /^- \S/.test(l.line));
  const assumedFindings = [];
  for (const { line } of assumed) {
    const q = line.match(/Question (\d+)\.?\s*$/);
    const what = line.replace(/^- /, '').split(' — ')[0];
    if (!/ — why: /.test(line)) assumedFindings.push(`"${what}" doesn't say why we think so.`);
    if (!q) assumedFindings.push(`"${what}" names no question.`);
    else named.push({ where: `The assumption "${what}"`, n: Number(q[1]) });
  }
  add('Assumed', assumedFindings);

  const risks = bodyOf(t, 'Risks and edge cases').filter((l) => /^- \S/.test(l.line));
  add('Risks', risks.filter((l) => !/ — \S|\. The cost: \S/.test(l.line)).map((l) => `"${l.line.replace(/^- /, '')}" doesn't say what it would cost.`));

  const questionFindings = cd.questionFindingsFor(doc, graded);
  for (const { where, n } of named) if (!known.has(n)) questionFindings.push(`${where} names question ${n}, which isn't in the Question log.`);
  add('Placeholders', cd.placeholders(t));
  add('Display', cd.rendering(t));
  const writing = cd.simpleWriting(t, { project, output: opts.output });
  add('Simple writing', writing.findings);
  add('Question log', questionFindings);

  const verdicts = ['Agree', 'One source', 'Differ', 'Silent'].map((v) => `${topics.filter((r) => text(r.Verdict).startsWith(v)).length} ${v}`);
  const byRank = clashes.filter((r) => /^Rank /.test(text(r['Settled by']))).length;
  const holdsLines = [
    `${cd.plural(byPath.size, 'file')}, ${used.length} used`,
    cd.plural(ranks.length, 'kind of document').replace(/kind of documents$/, 'kinds of document') + ' ranked',
    `${cd.plural(topics.length, 'topic')}: ${verdicts.join(', ')}`,
    `${cd.plural(clashes.length, 'clash').replace(/clashs$/, 'clashes')}: ${byRank} settled by rank, ${clashes.length - byRank} by a decision`,
    cd.plural(assumed.length, 'assumption'),
    cd.plural(risks.length, 'risk'),
  ];
  if (proposedOut.length) holdsLines.push(`${cd.plural(proposedOut.length, 'file')} proposed as out of scope, to be decided at the gate`);
  if (listed.toJudge.length) holdsLines.push(`${cd.plural(listed.toJudge.length, 'set')} of files that differ only by a date, judged by discovery-author`);
  return { doc, checks, holds: holdsLines, graded, notices: writing.notices };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/check-discovery-brief.cjs --project <p>', 2);
  const date = args.date && args.date !== true ? args.date : cd.today();
  const r = check(args.project, { output: args.output });
  const out = cd.report({ program: 'check-discovery-brief.cjs', date, ...r });
  process.stdout.write(out.text);
  return out.findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
