#!/usr/bin/env node
'use strict';
// route-next-capability.cjs — names the next FRD to write.
//
//   node tools/route-next-capability.cjs --project <p>
//
// What it does:
//   1. lists every capability the Feature catalog names, such as "FRD-3a Claim approval", with its features
//   2. orders them by the earliest EPIC, in the EPIC register's run order, that holds any of their features; a
//      capability no EPIC holds comes after the rest, in the catalog's order
//   3. leaves out each capability whose FRD is accepted
//   4. puts a capability waiting on an open Must answer question after the others: one whose Feature catalog row, for
//      any of its features, names that question, such as "Proposed (needs confirmation), question 4". It comes back
//      once the question is answered, or when only waiting and parked capabilities are left.
//   5. puts parked capabilities last
//   6. prints the next capability and its features, then the queue, or "Every FRD accepted: next, run stories-workflow."
//
// Exit codes: 0 routed; 2 the catalog, the register or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');

const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));

function route(project, opts = {}) {
  const catalog = cd.load(project, 'feature-catalog', {}, opts);
  const register = cd.load(project, 'epic-register', {}, opts);
  const graded = cd.questions(project, opts);
  const mustOpen = new Set((graded.open || []).filter((q) => q.group === 'Must answer').map((q) => q.n));

  const rows = (md.tableUnder(catalog.text, 'Feature catalog') || []).filter((r) => 'Feature ID' in r);
  const caps = new Map();
  for (const r of rows) {
    const cap = text(r.Capability);
    if (!cap) continue;
    if (!caps.has(cap)) caps.set(cap, { cap, features: [], waitsOn: new Set() });
    const c = caps.get(cap);
    c.features.push(`${text(r['Feature ID'])} ${text(r.Feature)}`);
    const rowText = Object.entries(r).filter(([k]) => k !== '_heading').map(([, v]) => text(v)).join(' ');
    for (const m of rowText.matchAll(/question (\d+)/gi)) if (mustOpen.has(Number(m[1]))) c.waitsOn.add(Number(m[1]));
  }

  // The run order: each EPIC's place, then each feature's earliest EPIC.
  const order = (md.tableUnder(register.text, 'Run order') || []).map((r) => text(r.EPIC));
  const featureAt = new Map();
  for (const e of md.tableUnder(register.text, 'EPICs') || []) {
    const at = order.indexOf(text(e.EPIC));
    for (const f of items(e.Features)) if (!featureAt.has(f) || at < featureAt.get(f)) featureAt.set(f, at < 0 ? Infinity : at);
  }
  const catalogOrder = [...caps.keys()];
  const placeOf = (c) => Math.min(...c.features.map((f) => featureAt.has(f.split(' ')[0]) ? featureAt.get(f.split(' ')[0]) : Infinity));

  const out = { ready: [], waiting: [], parked: [], accepted: [] };
  for (const c of caps.values()) {
    const name = c.cap.replace(/^FRD-\d+[a-z]\s+/, '');
    const file = rp.pathOf(project, 'frd', { capability: rp.slug(name) }, opts);
    c.file = `frd/frd-${rp.slug(name)}.md`;
    const status = fs.existsSync(file) ? (rp.readText(file).match(/^Status: (drafted|accepted|parked)/m) || [])[1] : null;
    c.status = status || 'not started';
    if (status === 'accepted') out.accepted.push(c);
    else if (status === 'parked') out.parked.push(c);
    else if (c.waitsOn.size) out.waiting.push(c);
    else out.ready.push(c);
  }
  const byPlace = (a, b) => placeOf(a) - placeOf(b) || catalogOrder.indexOf(a.cap) - catalogOrder.indexOf(b.cap);
  for (const k of ['ready', 'waiting', 'parked']) out[k].sort(byPlace);
  out.queue = [...out.ready, ...out.waiting, ...out.parked];
  return out;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/route-next-capability.cjs --project <p>', 2);
  const r = route(args.project, { output: args.output });
  if (!r.queue.length) {
    process.stdout.write('Every FRD accepted: next, run stories-workflow.\n');
    return 0;
  }
  const next = r.queue[0];
  const why = (c) => (r.parked.includes(c) ? 'parked' : c.waitsOn.size ? `waits on Must answer ${[...c.waitsOn].map((n) => `question ${n}`).join(' and ')}` : c.status);
  const lines = [`Next: ${next.cap}, ${next.file}${r.ready.length ? '' : `: ${why(next)}, but nothing else is ready`}`, ...next.features.map((f) => `- ${f}`), '', 'The queue:'];
  r.queue.forEach((c, i) => lines.push(`${i + 1}. ${c.cap}: ${why(c)}`));
  if (r.accepted.length) lines.push('', `Accepted: ${r.accepted.map((c) => c.cap).join(', ')}`);
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

module.exports = { route };

if (require.main === module) rp.run(main);
