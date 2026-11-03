#!/usr/bin/env node
'use strict';
// route-next-epic.cjs — names the next EPIC to write stories for.
//
//   node tools/route-next-epic.cjs --project <p>
//
// What it does:
//   1. goes through the EPICs in the EPIC register's run order
//   2. leaves out the EPICs that are ready: every story in their Story list is ready
//   3. puts after the others an EPIC waiting on an open Must answer question: one its Story list or Stories name. It
//      comes back once the question is answered, or when only waiting and parked EPICs are left.
//   4. puts a parked EPIC after the waiting ones: its Story list reads "Status: parked"
//   5. puts last an EPIC that depends, directly or through others, on a parked EPIC: it can't start until the parked
//      one is ready. So when only those are left, the parked EPIC comes back first.
//   6. prints the next EPIC, then the queue, or "Every EPIC ready."
//
// Exit codes: 0 routed; 2 the register or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');

const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));

function route(project, opts = {}) {
  const register = cd.load(project, 'epic-register', {}, opts);
  const graded = cd.questions(project, opts);
  const mustOpen = new Set((graded.open || []).filter((q) => q.group === 'Must answer').map((q) => q.n));
  const order = (md.tableUnder(register.text, 'Run order') || []).map((r) => text(r.EPIC));
  const rows = md.tableUnder(register.text, 'EPICs') || [];
  const ids = [...order, ...rows.map((r) => text(r.EPIC)).filter((id) => !order.includes(id))];

  const epics = new Map();
  for (const id of ids) {
    const row = rows.find((r) => text(r.EPIC) === id);
    if (!row) continue;
    const e = { id, name: text(row.Name), deps: items(row['Depends on']), state: 'not started', waitsOn: new Set() };
    const dir = rp.pathOf(project, 'epic-folder', { epic: `${id}-${rp.slug(e.name)}` }, opts);
    const list = path.join(dir, 'story-list.md');
    if (fs.existsSync(list)) {
      const t = rp.readText(list);
      const statuses = (md.tableUnder(t, 'Stories') || []).map((r) => text(r.Status));
      if (/^Status: parked/m.test(t)) e.state = 'parked';
      else if (statuses.length && statuses.every((s) => s === 'ready')) e.state = 'ready';
      else e.state = 'in progress';
      const all = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => rp.readText(path.join(dir, f))).join('\n');
      for (const m of all.matchAll(/question (\d+)/gi)) if (mustOpen.has(Number(m[1]))) e.waitsOn.add(Number(m[1]));
    }
    epics.set(id, e);
  }
  const parked = new Set([...epics.values()].filter((e) => e.state === 'parked').map((e) => e.id));
  const blockedBy = (e, seen = new Set()) => {
    for (const d of e.deps) {
      if (seen.has(d)) continue;
      seen.add(d);
      if (parked.has(d)) return d;
      const de = epics.get(d);
      const deeper = de && blockedBy(de, seen);
      if (deeper) return deeper;
    }
    return null;
  };
  const out = { ready: [], normal: [], waiting: [], parked: [], blocked: [] };
  for (const e of epics.values()) {
    if (e.state === 'ready') out.ready.push(e);
    else if (e.state === 'parked') out.parked.push(e);
    else if ((e.blockedBy = blockedBy(e))) out.blocked.push(e);
    else if (e.waitsOn.size) out.waiting.push(e);
    else out.normal.push(e);
  }
  out.queue = [...out.normal, ...out.waiting, ...out.parked, ...out.blocked];
  return out;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/route-next-epic.cjs --project <p>', 2);
  const r = route(args.project, { output: args.output });
  if (!r.queue.length) {
    process.stdout.write('Every EPIC ready.\n');
    return 0;
  }
  const why = (e) => (e.state === 'parked' ? 'parked' : e.blockedBy ? `waits for parked ${e.blockedBy}` : e.waitsOn.size ? `waits on Must answer ${[...e.waitsOn].map((n) => `question ${n}`).join(' and ')}` : e.state);
  const next = r.queue[0];
  const lines = [`Next: ${next.id} ${next.name}${r.normal.length ? '' : `: ${why(next)}, but nothing else is ready`}`, '', 'The queue:'];
  r.queue.forEach((e, i) => lines.push(`${i + 1}. ${e.id} ${e.name}: ${why(e)}`));
  if (r.ready.length) lines.push('', `Ready: ${r.ready.map((e) => e.id).join(', ')}`);
  process.stdout.write(`${lines.join('\n')}\n`);
  return 0;
}

module.exports = { route };

if (require.main === module) rp.run(main);
