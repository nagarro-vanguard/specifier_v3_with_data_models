#!/usr/bin/env node
'use strict';
// size-rules.cjs — gives the tentative size of a change, against whatever is in progress now.
//
//   node tools/size-rules.cjs --project <p> --change <nnn>
//
// What is in progress, read from the status lines (conventions.md, "The status line"), in any case:
//   - the things file, or a data model file the things file names, while its status line says drafted. Like the Feature
//     catalog, it is never parked, because the change's path writes it again.
//   - the Feature catalog, or the EPIC grouping, while its status line says drafted
//   - an FRD, while its status line says drafted
//   - an EPIC, from the moment its Story list exists until that list is accepted with every story ready, unless the
//     list is parked. This is how status.cjs reads it too.
//
// The size, against each piece in progress, from section 13 of the change's report:
//   Large when any of these holds:
//     1. a feature moves into or out of the piece in progress. A judgement moves a feature when its "Why" starts
//        "moves to", then the EPIC or FRD it goes to, such as "moves to EPIC-004". The data model holds no feature,
//        so no feature moves into or out of a data model file.
//     2. the piece is an EPIC, and more than one of its stories is judged New story or Split
//     3. the features that move regroup two or more pieces: the EPICs and FRDs they leave and join
//   Small otherwise: the change is folded into the work in progress. While only the data model is in progress, the
//   rule says it holds no feature and no story.
//   Not sized when nothing is in progress.
//
// It writes section 14, "The tentative size": the size, the rule that decided it, and the pieces it was sized
// against.
//
// Exit codes: 0 written; 2 the change, its report, the map or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');
const cr = require('./lib/change-report.cjs');
const fl = require('./find-linked.cjs');
const dm = require('./lib/data-model.cjs');

const one = (c) => md.list(c).map((x) => String(x).trim()).join(' ').trim();

// A document's state from its status line, in any case, because a data model file written before the kit's document
// shape says "Accepted on {date}".
function statusOf(file) {
  const m = rp.readText(file).match(/^Status: (.*)$/m);
  if (!m) return 'drafted';
  if (/^accepted/i.test(m[1])) return 'accepted';
  if (/^parked/i.test(m[1])) return 'parked';
  return 'drafted';
}

// Every piece in progress: { kind, id, label, file, rel }.
function inProgress(project, opts = {}) {
  const pieces = [];
  // The data model: the things file, then each data model file it names, read through lib/data-model.cjs.
  const thingsFile = rp.pathOf(project, 'data-model-things', {}, opts);
  if (fs.existsSync(thingsFile)) {
    if (statusOf(thingsFile) === 'drafted') pieces.push({ kind: 'data-model-things', id: 'data-model-things', label: 'the things file', file: thingsFile, rel: rp.relOf('data-model-things', { product: project }) });
    for (const f of dm.load(project, { ...opts, allowMissing: true }).files) {
      if (f.exists && statusOf(f.file) === 'drafted') pieces.push({ kind: 'data-model', id: f.name, label: `the data model file ${f.name}`, file: f.file, rel: f.rel });
    }
  }
  for (const [doc, label] of [['feature-catalog', 'the Feature catalog'], ['epic-grouping', 'the EPIC grouping']]) {
    const file = rp.pathOf(project, doc, {}, opts);
    if (fs.existsSync(file) && statusOf(file) === 'drafted') pieces.push({ kind: doc, id: doc, label, file, rel: rp.relOf(doc, { product: project }) });
  }
  for (const m of rp.matches(project, 'frd', opts)) {
    if (statusOf(m.abs) !== 'drafted') continue;
    const t = rp.readText(m.abs).match(/^#\s+(FRD-\d+[a-z])\s+(.*?)\s*$/m);
    pieces.push({ kind: 'frd', id: t ? t[1] : m.rel, label: t ? `${t[1]} ${t[2]}` : m.rel, file: m.abs, rel: m.rel });
  }
  for (const m of rp.matches(project, 'story-list', opts)) {
    const status = statusOf(m.abs);
    if (status === 'parked') continue;
    const stories = md.tableUnder(rp.readText(m.abs), 'Stories') || [];
    if (status === 'accepted' && stories.length && stories.every((s) => one(s.Status).toLowerCase() === 'ready')) continue;
    const id = (m.values.epic.match(/^EPIC-\d{3}/) || [])[0] || m.values.epic;
    let name = '';
    try { name = cd.epicOf(project, id, opts).name; } catch (e) { name = ''; }
    pieces.push({ kind: 'epic', id, label: `${name ? `${id} ${name}` : id}'s stories`, file: m.abs, rel: m.rel });
  }
  return pieces;
}

function sizeOf(project, change, opts = {}) {
  const r = cr.read(project, change, opts);
  const pieces = inProgress(project, opts);
  if (!pieces.length) return { report: r, pieces, size: 'Not sized', rules: ['nothing is in progress, so there is nothing to size against'] };

  const { known, links } = fl.working(project, opts);
  const home = (feature, type) => (links.find((l) => l.from === feature && l.type === type) || {}).to || null;
  const moves = [];
  for (const j of r.judged) {
    if ((known.get(j.id) || {}).type !== 'feature') continue;
    const m = j.why.match(/^moves to (EPIC-\d{3}|FRD-\d+[a-z])\b/i);
    if (m) moves.push({ feature: j.id, from: home(j.id, m[1].startsWith('EPIC') ? 'in-epic' : 'in-frd'), to: m[1] });
  }

  const rules = [];
  for (const p of pieces) {
    for (const mv of moves) {
      if (p.kind === 'epic' || p.kind === 'frd') {
        if (mv.from === p.id) rules.push(`${mv.feature} moves out of ${p.id}, which is in progress`);
        if (mv.to === p.id) rules.push(`${mv.feature} moves into ${p.id}, which is in progress`);
      } else if (p.kind === 'feature-catalog' || p.kind === 'epic-grouping') rules.push(`${mv.feature} moves to ${mv.to}, and ${p.label} is in progress`);
    }
    if (p.kind === 'epic') {
      const split = r.judged.filter((j) => ['New story', 'Split'].includes(j.judgement) && (known.get(j.id) || {}).type === 'story' && (known.get(j.id) || {}).document === p.rel);
      if (split.length > 1) rules.push(`${split.length} of ${p.id}'s stories are judged New story or Split`);
    }
  }
  const regrouped = [...new Set(moves.flatMap((m) => [m.from, m.to]).filter(Boolean))];
  if (regrouped.length >= 2) rules.push(`the features that move regroup ${regrouped.length} pieces, ${regrouped.slice(0, -1).join(', ')} and ${regrouped[regrouped.length - 1]}`);

  if (rules.length) return { report: r, pieces, size: 'Large', rules };
  // The data model holds no feature and no story. So while only the data model is in progress, the rule says that,
  // and not that no feature moves into or out of it.
  if (pieces.every((p) => ['data-model-things', 'data-model'].includes(p.kind))) {
    const what = pieces.length === 1 ? pieces[0].label : 'the data model';
    return { report: r, pieces, size: 'Small', rules: [`none of the large rules holds: ${what} holds no feature and no story, and no two pieces need regrouping`] };
  }
  const where = pieces.length !== 1 ? 'a piece in progress' : ['epic', 'frd'].includes(pieces[0].kind) ? pieces[0].id : pieces[0].label;
  return {
    report: r, pieces, size: 'Small',
    rules: [`none of the large rules holds: no feature moves into or out of ${where}, no more than one story in progress is judged New story or Split, and no two pieces need regrouping`],
  };
}

function lines(s) {
  const out = [`- **Size:** ${s.size}`];
  if (s.rules.length === 1) out.push(`- **The rule that decided it:** ${s.rules[0]}`);
  else out.push(`- **The rule that decided it:** ${s.rules.length} rules hold:`, ...s.rules.map((x) => `  - ${x}`));
  if (!s.pieces.length) out.push('- **Against:** Nothing in progress');
  else if (s.pieces.length === 1) out.push(`- **Against:** ${s.pieces[0].label}`);
  else out.push(`- **Against:** ${s.pieces.length} pieces in progress:`, ...s.pieces.map((p) => `  - ${p.label}`));
  return out;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true) rp.fail('Use: node tools/size-rules.cjs --project <p> --change <nnn>', 2);
  const s = sizeOf(args.project, change, { output: args.output });
  cd.replaceSection(s.report.change.report, 'The tentative size', lines(s));
  process.stdout.write(`size-rules.cjs: change ${s.report.change.number} is ${s.size === 'Not sized' ? 'not sized' : s.size.toLowerCase()}, written to section 14.\n`);
  return 0;
}

module.exports = { sizeOf, inProgress, lines, statusOf };

if (require.main === module) rp.run(main);
