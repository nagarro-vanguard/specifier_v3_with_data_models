#!/usr/bin/env node
'use strict';
// scaffold-project.cjs — checks that a project's folders exist, and creates any that are missing.
//
//   node tools/scaffold-project.cjs --project <p> [--epic <EPIC-nnn-name>] [--change <nnn-name>] [--section <name>]
//
// Which folders, from the JSON block in project-folders.md, the only copy of the layout:
//   - always: the folders listed under "createdAtSetup", such as sources/, frd/ and epics/
//   - a piece's own folder, such as epics/EPIC-002-claim-approval/, only when its value is given
//   - never a folder that is created on first use: changes/ comes with a change, version-log/ with the first
//     acceptance, and design/ when you bring design files
// It never deletes, moves or overwrites anything.
//
// When the project folder already holds something the layout doesn't know, such as a folder from an
// earlier way of working, it creates nothing and says so. That keeps older work untouched.
//
// Run it at the start of every workflow, and from every skill run on its own, before anything is written.
// Running it again changes nothing that is already there.
//
// Exit codes: 0 every folder is there; 1 the project folder holds things the layout doesn't know;
// 2 no project was given, or the layout is missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');

// The folders of every path that holds a value which was given, such as epics/{epic}/ when --epic is given.
function pieceFolders(layout, values) {
  const out = new Set();
  for (const p of Object.values(layout)) {
    const folder = p.endsWith('/') ? p.slice(0, -1) : path.posix.dirname(p);
    const needs = [...folder.matchAll(/{([^}]+)}/g)].map((m) => m[1]);
    if (!needs.length || needs.some((n) => n === 'document' || n === 'n' || !values[n])) continue;
    out.add(folder.replace(/{([^}]+)}/g, (_, n) => values[n]));
  }
  return [...out];
}

// Every parent folder too, so the list reads top-down.
function withParents(folders) {
  const out = new Set();
  for (const f of folders) {
    const parts = f.replace(/\/$/, '').split('/');
    for (let i = 1; i <= parts.length; i++) out.add(parts.slice(0, i).join('/'));
  }
  return [...out].sort();
}

// A name at the top of a project folder is known when a path starts with it, or when it is a document itself,
// such as expense-claims-brd.md.
function isKnown(layout, name) {
  const firsts = new Set(Object.values(layout).map((p) => p.split('/')[0]).filter((f) => !f.includes('{')));
  return firsts.has(name) || Boolean(rp.identify(name));
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const layout = rp.layout();
  const dir = rp.projectDir(args.project, args);

  if (fs.existsSync(dir)) {
    const strangers = fs.readdirSync(dir).filter((n) => !n.startsWith('.') && !isKnown(layout, n));
    if (strangers.length) {
      const lines = [
        `${dir} already holds things this layout doesn't know:`,
        ...strangers.map((n) => `- ${n}`),
        'Nothing was created, so nothing there is touched. Use another project name, or move those out first.',
      ];
      process.stdout.write(lines.join('\n') + '\n');
      return 1;
    }
  }

  const folders = withParents([...rp.setupFolders(), ...pieceFolders(layout, args.values)]);
  const created = [];
  const there = [];
  for (const f of folders) {
    const abs = path.join(dir, ...f.split('/'));
    if (fs.existsSync(abs)) there.push(f);
    else {
      fs.mkdirSync(abs, { recursive: true });
      created.push(f);
    }
  }

  const out = [`Project folder: ${dir}`];
  if (created.length) out.push('Created:', ...created.map((f) => `- ${f}/`));
  if (there.length) out.push('Already there:', ...there.map((f) => `- ${f}/`));
  if (!created.length) out.push('Every folder is already there. Nothing was created.');
  const sources = path.join(dir, ...layout.sources.replace(/\/$/, '').split('/'));
  const empty = fs.readdirSync(sources).filter((n) => !n.startsWith('.')).length === 0;
  if (empty) out.push('', `Next: put your requirement files in ${sources}, then run requirements-workflow.`);
  process.stdout.write(out.join('\n') + '\n');
  return 0;
}

rp.run(main);
