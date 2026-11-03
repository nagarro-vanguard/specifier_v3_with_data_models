#!/usr/bin/env node
'use strict';
// reader-copy.cjs — prints the copy of a document that a reader sees, such as the body of a story's GitHub issue.
// The document keeps its citations, because the kit's programs and the Traceability map read them. The reader's copy
// leaves them out. A document written before its template lost its opening notes and lines in italics loses those too.
//
//   node tools/reader-copy.cjs --file <document.md>
//
// What it leaves out:
//   - the opening notes: each block quote that starts with "What this is", "Who uses it" or "Lineage"
//   - every line that is wholly in italics, such as the line under each heading
//   - every citation: " — per ..." to the end of its line or table cell, and "per {file}, section n", such as
//     "per claims-requirements-v2.docx, section 3.2"
// Everything else stays word for word, including the status rows, other block quotes such as a sizing alert, and
// code blocks. The document itself is never changed.
//
// Exit codes: 0 printed; 2 the document is missing.

const fs = require('fs');
const rp = require('./lib/run-paths.cjs');

const OPENING = /^> \*\*(What this is|What it is not|Written by|Who uses it|Lineage)\b/;
const ITALIC = /^\*[^*].*\*$/;

// A citation goes, and the words around it stay. A sentence keeps its full stop.
function dropCitations(line) {
  return line
    .replace(/ — per [^|]*?(\.?)(?=\s*\||\s*$)/g, '$1')
    .replace(/,? per [\w-]+(?:\.[\w-]+)*\.(?:md|docx|xlsx|pdf|txt)(?:, (?:version|section|item|row|sheet) [\w.]+)*/g, '');
}

function readerCopy(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inCode = false;
  let skipQuote = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) inCode = !inCode;
    if (inCode || /^\s*```/.test(line)) { out.push(line); continue; }
    if (/^>/.test(line)) {
      // A block quote is left out whole when its first line is an opening note.
      if (!(out.length && /^>/.test(out[out.length - 1])) && !skipQuote) skipQuote = OPENING.test(line);
      if (skipQuote) continue;
    } else skipQuote = false;
    if (ITALIC.test(line.trim())) continue;
    out.push(dropCitations(line));
  }
  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function main() {
  const argv = process.argv.slice(2);
  const at = argv.indexOf('--file');
  const file = at >= 0 ? argv[at + 1] : null;
  if (!file) rp.fail('Use: node tools/reader-copy.cjs --file <document.md>', 2);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`The document isn't there: ${file}`);
  process.stdout.write(readerCopy(rp.readText(file)));
  return 0;
}

module.exports = { readerCopy };

if (require.main === module) rp.run(main);
