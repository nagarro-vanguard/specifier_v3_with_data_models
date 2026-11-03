#!/usr/bin/env node
'use strict';
// check-glossary-sources.cjs — checks that the Glossary's evidence points at the accepted BRD and PRD, never at the
// requirement files they were written from. Only discovery-author, brd-author and prd-author read those files
// (conventions.md, part 4), so a Glossary that cites them skips the documents it is built from.
//
//   node tools/check-glossary-sources.cjs --project <p>
//
// What it checks, in every file in glossary/deep-dives/, such as each section draft, the assembly draft and the
// gate log:
//   - each section draft's "**Source:**" line names the PRD, {project}-prd.md, or the BRD, {project}-brd.md
//   - no file names a requirement file from sources/
//   - every REQ-x.y it names is in the PRD, and every BR-nn it names is in the BRD
//
// Exit codes: 0 nothing to fix; 1 something to fix, each listed; 2 the PRD, the BRD or the deep-dives folder is
// missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const md = require('./lib/md-tables.cjs');
const cd = require('./lib/check-document.cjs');

const text = (c) => (Array.isArray(c) ? c.join(' ') : String(c || '')).trim();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Every file under a folder, at any depth.
function filesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesIn(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

function check(project, opts = {}) {
  const prd = cd.load(project, 'prd', {}, opts);
  const brd = cd.load(project, 'brd', {}, opts);
  const deep = rp.pathOf(project, 'deep-dives', {}, opts);
  if (!fs.existsSync(deep)) throw new rp.LayoutError(`The Glossary's deep-dives folder isn't there yet: ${deep}`);
  const prdName = path.basename(prd.file);
  const brdName = path.basename(brd.file);
  const reqIds = new Set(cd.requirementsOf(prd.text).map((r) => text(r.ID)));
  const brIds = new Set((md.tableUnder(brd.text, 'Business requirements') || []).map((r) => text(r['BR ID'])));
  const sources = filesIn(rp.pathOf(project, 'sources', {}, opts)).map((f) => path.basename(f));
  const cite = `Cite the PRD, ${prdName}, by its REQ IDs, or the BRD, ${brdName}, by its BR IDs.`;

  const findings = [];
  for (const file of filesIn(deep).filter((f) => f.endsWith('.md')).sort()) {
    const rel = path.relative(deep, file).split(path.sep).join('/');
    const lines = rp.readText(file).split('\n');
    if (/^[^/]+\/[^/]+-glossary\.md$/.test(rel)) {
      const source = lines.find((l) => /^\*\*Source:\*\*/.test(l));
      if (!source) findings.push(`${rel}: there is no "**Source:**" line. ${cite}`);
      else if (!source.includes(prdName) && !source.includes(brdName)) findings.push(`${rel}: the Source line reads "${source.replace(/^\*\*Source:\*\*\s*/, '')}". ${cite}`);
    }
    lines.forEach((l, i) => {
      const at = `${rel}, line ${i + 1}`;
      for (const s of sources) if (new RegExp(escape(s), 'i').test(l)) findings.push(`${at}: names "${s}", a requirement file in sources/. ${cite}`);
      for (const id of new Set(l.match(/\bREQ-\d+\.\d+\b/g) || [])) if (!reqIds.has(id)) findings.push(`${at}: names ${id}, which isn't in the PRD.`);
      for (const id of new Set(l.match(/\bBR-\d+\b/g) || [])) if (!brIds.has(id)) findings.push(`${at}: names ${id}, which isn't in the BRD.`);
    });
  }
  return findings;
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  if (!args.project || args.project === true) rp.fail('Use: node tools/check-glossary-sources.cjs --project <p>', 2);
  const findings = check(args.project, { output: args.output });
  process.stdout.write(`Glossary sources: ${findings.length} to fix.\n${findings.map((f) => `- ${f}\n`).join('')}`);
  return findings.length ? 1 : 0;
}

module.exports = { check };

if (require.main === module) rp.run(main);
