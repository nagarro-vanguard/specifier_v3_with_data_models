#!/usr/bin/env node
'use strict';
// coverage-check.cjs — proves that every rule of an EPIC's features is named by at least one acceptance scenario.
//
//   node tools/coverage-check.cjs --project <p> --epic EPIC-002
//
// What it does:
//   1. finds the EPIC's features in the EPIC register
//   2. finds their rules in the FRDs, in the frd/ folder: every rule under a "### F-nn" heading for those features
//   3. reads which rules each scenario in the EPIC's Stories proves: the rule IDs in brackets at the end of each
//      scenario's title
//   4. lists every rule no scenario names. Rules of features in other EPICs are ignored, and so is a scenario that
//      names a rule of another EPIC.
//
// Exit codes: 0 every rule is covered; 1 uncovered rules, each listed; 2 the register, the EPIC or the layout is
// missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');

const items = (c) => md.list(c).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));

function coverage(project, epic, opts = {}) {
  const e = cd.epicOf(project, epic, opts);
  const features = items(e.row.Features);
  const frdDir = path.dirname(rp.pathOf(project, 'feature-catalog', {}, opts));
  const rules = [];
  for (const f of fs.existsSync(frdDir) ? fs.readdirSync(frdDir).filter((x) => /^frd-.+\.md$/.test(x)).sort() : []) {
    const t = rp.readText(path.join(frdDir, f));
    const frd = (t.match(/^# (FRD-\d+[a-z])\b/m) || [])[1] || f;
    let feature = null;
    for (const line of t.split('\n')) {
      if (/^## /.test(line)) feature = null;
      const h = line.match(/^### (F-\d+) /);
      if (h) feature = h[1];
      const r = line.match(/^\| (F-\d+\.\d+) \| (.+?) \| /);
      if (r && feature && features.includes(feature)) rules.push({ id: r[1], text: r[2], frd });
    }
  }
  const dir = rp.pathOf(project, 'epic-folder', { epic: e.folder }, opts);
  const named = new Map();
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !['story-list.md', 'brief.md'].includes(x)) : []) {
    const t = rp.readText(path.join(dir, f));
    for (const sc of md.scenarios(t)) {
      for (const id of sc.rules) {
        if (!named.has(id)) named.set(id, []);
        named.get(id).push(`${f.replace(/\.md$/, '')}, ${sc.id}`);
      }
    }
  }
  const uncovered = rules.filter((r) => !named.has(r.id));
  return { epic: e, features, rules, uncovered, named };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const epic = args.values.epic;
  if (!args.project || args.project === true || !epic) rp.fail('Use: node tools/coverage-check.cjs --project <p> --epic EPIC-002', 2);
  const r = coverage(args.project, epic, { output: args.output });
  const head = `coverage-check.cjs: ${r.epic.id} ${r.epic.name}, ${cd.plural(r.features.length, 'feature')}, ${cd.plural(r.rules.length, 'rule')}`;
  if (!r.rules.length) {
    process.stdout.write(`${head}: no FRD rule found for this EPIC's features. Are its FRDs accepted?\n`);
    return 1;
  }
  if (r.uncovered.length) {
    process.stdout.write(`${head}: ${r.uncovered.length} no scenario names:\n${r.uncovered.map((u) => `- ${u.id} (${u.frd}): ${u.text}`).join('\n')}\n`);
    return 1;
  }
  process.stdout.write(`${head}: every rule is named by at least one scenario.\n`);
  return 0;
}

module.exports = { coverage };

if (require.main === module) rp.run(main);
