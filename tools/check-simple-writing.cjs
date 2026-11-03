#!/usr/bin/env node
'use strict';
// check-simple-writing.cjs — checks one or more documents against _shared/simple-writing-rules.md, and says what to
// fix and what to look at. Every check program runs the same check; this program is for a document that has no check
// program of its own, such as a Glossary page, or for any document on its own.
//
//   node tools/check-simple-writing.cjs --file <document.md> [--file <document.md>]... [--project <p>]
//                                       [--skip-column <name>]... [--compare <simple column> <client column>]
//
// With --project, the project's agreed Glossary words are allowed, even when a word list has them.
//
// Exit codes: 0 nothing to fix; 1 something to fix; 2 a document or the rules file is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const sw = require('./lib/simple-writing.cjs');

function main() {
  const argv = process.argv.slice(2);
  const files = [];
  const skipColumns = [];
  let compare = null;
  let project = null;
  let output = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') files.push(argv[++i]);
    else if (a === '--skip-column') skipColumns.push(argv[++i]);
    else if (a === '--compare') compare = [argv[++i], argv[++i]];
    else if (a === '--project') project = argv[++i];
    else if (a === '--output') output = path.resolve(argv[++i]);
  }
  if (!files.length || files.some((f) => !f)) rp.fail('Use: node tools/check-simple-writing.cjs --file <document.md> [--project <p>] [--skip-column <name>]... [--compare <simple column> <client column>]', 2);
  const allow = project ? sw.glossaryTerms(project, { output }) : [];
  let toFix = 0;
  const out = [];
  for (const file of files) {
    if (!fs.existsSync(file)) throw new rp.LayoutError(`The document isn't there: ${file}`);
    const r = sw.check(rp.readText(file), { skipColumns, compare, allow });
    toFix += r.toFix.length;
    out.push(sw.report(path.basename(file), r));
  }
  process.stdout.write(out.join('\n'));
  return toFix ? 1 : 0;
}

if (require.main === module) rp.run(main);
