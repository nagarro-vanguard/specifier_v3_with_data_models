#!/usr/bin/env node
'use strict';
// build-sequencing-mapping.cjs — builds the EPIC sequencing and the EPIC mapping from the EPIC register, so neither is
// ever written by hand.
//
//   node tools/build-sequencing-mapping.cjs --project <p>
//
// What it does:
//   - EPIC sequencing, epics/sequencing.md:
//     - each EPIC's step comes from what it depends on: an EPIC that depends on none is step 1; any other is one more
//       than the highest step of the EPICs it depends on. EPICs with the same step can run side by side.
//     - each EPIC's reason is copied from the EPIC grouping's suggested sequence
//     - the critical path is the longest chain of dependencies. When two chains are as long, the one that ends with the
//       EPIC earlier in the register wins.
//     - the most depended-on EPIC is the one with the most EPICs waiting on it, directly or through others. A tie goes
//       to the EPIC earlier in the register.
//   - EPIC mapping, epics/mapping.md: one row per EPIC, with its band, its features and the requirements they cover,
//     and a coverage line: every feature in the Feature catalog is in exactly one EPIC
//   Everything is written in fixed sentences, with no free prose, so the same register always gives the same files.
//
// Exit codes: 0 written; 1 the dependencies form a loop, or a feature isn't in exactly one EPIC, each listed, and
// nothing is written for a loop; 2 the register, the grouping, the catalog or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');

const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));
const numberOf = (c) => Number((text(c).match(/^(\d+)/) || [])[1]);
const epicId = (n) => `EPIC-${String(n).padStart(3, '0')}`;

function steps(epics) {
  const step = new Map();
  const loop = [];
  const visit = (id, path) => {
    if (step.has(id)) return step.get(id);
    if (path.includes(id)) { loop.push([...path.slice(path.indexOf(id)), id].join(' -> ')); return 0; }
    const e = epics.get(id);
    const deps = e ? e.deps.filter((d) => epics.has(d)) : [];
    const s = deps.length ? 1 + Math.max(...deps.map((d) => visit(d, [...path, id]))) : 1;
    if (!loop.length) step.set(id, s);
    return s;
  };
  for (const id of epics.keys()) visit(id, []);
  return { step, loop };
}

function build(project, opts = {}) {
  const register = cd.load(project, 'epic-register', {}, opts);
  const grouping = cd.load(project, 'epic-grouping', {}, opts);
  const catalog = cd.load(project, 'feature-catalog', {}, opts);
  const product = (register.text.match(/^# EPIC register — (.+)$/m) || [])[1] || project;
  const order = [];
  const epics = new Map();
  for (const r of md.tableUnder(register.text, 'EPICs') || []) {
    const id = text(r.EPIC);
    order.push(id);
    epics.set(id, { id, name: text(r.Name), band: text(r.Band), features: items(r.Features), deps: items(r['Depends on']) });
  }
  const { step, loop } = steps(epics);
  if (loop.length) return { written: [], findings: [...new Set(loop)].map((l) => `The dependencies form a loop: ${l}.`) };

  const reasons = new Map((md.tableUnder(grouping.text, 'Suggested EPIC sequence') || []).map((s) => [epicId(numberOf(s.EPIC)), text(s.Rationale)]));
  const label = (id) => `${id} ${epics.get(id).name}`;

  // The critical path: the longest chain, ending at the earliest EPIC in the register with the highest step.
  const top = Math.max(...step.values());
  let at = order.find((id) => step.get(id) === top);
  const path = [at];
  while (epics.get(at).deps.length) {
    const deps = epics.get(at).deps.filter((d) => epics.has(d));
    const best = Math.max(...deps.map((d) => step.get(d)));
    at = order.find((id) => deps.includes(id) && step.get(id) === best);
    path.unshift(at);
  }
  // The most depended-on EPIC: the most EPICs waiting on it, directly or through others.
  const waiting = new Map(order.map((id) => [id, new Set()]));
  const reach = (id, from) => { for (const d of epics.get(id).deps) if (epics.has(d) && !waiting.get(d).has(from)) { waiting.get(d).add(from); reach(d, from); } };
  for (const id of order) reach(id, id);
  const most = order.reduce((a, b) => (waiting.get(b).size > waiting.get(a).size ? b : a), order[0]);

  // A generated document opens with its title and one line saying a program writes it; it has no opening notes.
  const opening = (title) => [
    `# ${title} — ${product}`,
    '',
    'Written by build-sequencing-mapping.cjs, from the EPIC register, every time it runs. Never edit it by hand.',
    '',
  ];
  const seq = [
    ...opening('EPIC sequencing'),
    '## 1. Steps',
    '',
    '| Step | EPICs, side by side | Depends on |',
    '|---|---|---|',
  ];
  for (let s = 1; s <= top; s++) {
    const here = order.filter((id) => step.get(id) === s);
    const deps = [...new Set(here.flatMap((id) => epics.get(id).deps))].filter((d) => epics.has(d));
    seq.push(`| ${s} | ${here.map((id) => `• ${label(id)}`).join('<br>')} | ${deps.length ? deps.map((d) => `• ${d}`).join('<br>') : 'None'} |`);
  }
  seq.push('', '## 2. Why each EPIC is where it is', '', '| EPIC | Step | Reason |', '|---|---|---|');
  for (const id of order) seq.push(`| ${label(id)} | ${step.get(id)} | ${reasons.get(id) || 'None given'} |`);
  seq.push('', '## 3. The critical path', '');
  seq.push(path.length === 1 ? `No EPIC depends on another, so the critical path is one EPIC long: ${label(path[0])}.` : `The critical path is ${path.length} EPICs long: ${path.map(label).join(', then ')}.`);
  seq.push('', '## 4. The most depended-on EPIC', '');
  seq.push(waiting.get(most).size ? `${label(most)}: ${cd.plural(waiting.get(most).size, 'EPIC')} ${waiting.get(most).size === 1 ? 'waits' : 'wait'} on it, directly or through others.` : 'None: no EPIC depends on another.');

  // The mapping, and coverage: every catalog feature in exactly one EPIC.
  const features = (md.tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const nameOf = new Map(features.map((f) => [text(f['Feature ID']), text(f.Feature)]));
  const coversOf = new Map(features.map((f) => [text(f['Feature ID']), items(f['Covers (source IDs)'])]));
  const map = [
    ...opening('EPIC mapping'),
    '## 1. EPICs, features and requirements',
    '',
    '| EPIC | Band | Features | Requirements |',
    '|---|---|---|---|',
  ];
  for (const id of order) {
    const e = epics.get(id);
    const reqs = [...new Set(e.features.flatMap((f) => coversOf.get(f) || []))];
    map.push(`| ${label(id)} | ${e.band} | ${e.features.map((f) => `• ${f} ${nameOf.get(f) || ''}`.trim()).join('<br>')} | ${reqs.map((r) => `• ${r}`).join('<br>') || 'None'} |`);
  }
  const findings = [];
  for (const f of nameOf.keys()) {
    const n = order.filter((id) => epics.get(id).features.includes(f)).length;
    if (n !== 1) findings.push(`${f} is in ${n === 0 ? 'no EPIC' : `${n} EPICs`}.`);
  }
  for (const id of order) for (const f of epics.get(id).features) if (!nameOf.has(f)) findings.push(`${id} holds ${f}, which isn't in the Feature catalog.`);
  map.push('', '## 2. Coverage', '');
  const placed = [...nameOf.keys()].filter((f) => order.filter((id) => epics.get(id).features.includes(f)).length === 1).length;
  map.push(findings.length ? `${placed} of ${cd.plural(nameOf.size, 'feature')} are in exactly one EPIC. The others:` : `Every feature is in exactly one EPIC: ${placed} of ${nameOf.size}.`);
  if (findings.length) map.push('', ...findings.map((f) => `- ${f}`));

  fs.writeFileSync(rp.pathOf(project, 'epic-sequencing', {}, opts), `${seq.join('\n')}\n`);
  fs.writeFileSync(rp.pathOf(project, 'epic-mapping', {}, opts), `${map.join('\n')}\n`);
  return { written: ['epics/sequencing.md', 'epics/mapping.md'], findings, path, steps: top };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/build-sequencing-mapping.cjs --project <p>', 2);
  const r = build(args.project, { output: args.output });
  if (r.written.length) process.stdout.write(`Built from the EPIC register: ${cd.plural(r.steps, 'step')}, critical path ${r.path.join(', then ')}.\n${r.written.map((w) => `- ${w}`).join('\n')}\n`);
  if (r.findings.length) process.stdout.write(`${cd.plural(r.findings.length, 'finding')}:\n${r.findings.map((f) => `- ${f}`).join('\n')}\n`);
  return r.findings.length ? 1 : 0;
}

module.exports = { build, steps };

if (require.main === module) rp.run(main);
