#!/usr/bin/env node
'use strict';
// close-change.cjs — writes a change's closing entry, once every document it named is accepted.
//
//   node tools/close-change.cjs --project <p> --change <nnn>
//
// track-change.cjs calls it when the last row of a change's progress is accepted. What it does:
//   1. refuses while any row of the progress is still pending, and lists each one
//   2. appends the closing entry to the Decision record of the first document in the progress that has one. When
//      none has, such as a change that needed nothing, it goes in the report's own Decision record, section 16. The
//      entry is in the shape of templates/parts/decision-record.md, "The closing entry of a change":
//        ### Decision {n} — Change {nnn} closed
//        - **Change:** {nnn}, {short name}
//        - **Applied in:** each document, with its version, one per line
//        - **Closed on:** {date}
//   3. marks the progress closed: "Status: closed on {date}"
//
// Exit codes: 0 closed, or closed already; 1 a row is still pending; 2 the change, its progress or the layout is
// missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

const fs = require('fs');
const path = require('path');
const rp = require('./lib/run-paths.cjs');
const cd = require('./lib/check-document.cjs');
const cr = require('./lib/change-report.cjs');

// Adds an entry at the end of a document's Decision record, replacing "None yet." when it is the first.
function appendDecision(file, entry) {
  const all = rp.readText(file).split('\n');
  const start = all.findIndex((l) => /^## /.test(l) && /^(\d+\.\s*)?(Decision record|Your decision)\s*$/i.test(l.slice(3).trim()));
  if (start < 0) return null;
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  const n = all.slice(start, end).filter((l) => /^### Decision \d+/.test(l)).length + 1;
  const none = all.findIndex((l, i) => i > start && i < end && l.trim() === 'None yet.');
  const lines = [`### Decision ${n} — ${entry.title}`, ...entry.lines];
  if (none >= 0) all.splice(none, 1, ...lines);
  else {
    let at = end;
    while (at > start + 1 && !all[at - 1].trim()) at--;
    all.splice(at, 0, '', ...lines);
  }
  rp.writeText(file, all.join('\n'));
  return n;
}

function close(project, change, opts = {}) {
  const r = cr.read(project, change, opts);
  const file = rp.pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(file)) throw new rp.LayoutError(`The change has no progress yet: ${file}. It is written when the change's report is accepted.`);
  const tc = require('./track-change.cjs');
  const p = tc.read(file);
  if (p.closed) return { code: 0, message: 'closed already.' };
  const pending = p.rows.filter((x) => x.status === 'pending');
  if (pending.length) return { code: 1, message: `can't close yet: ${cd.plural(pending.length, 'document')} still pending:\n${pending.map((x) => `- ${x.document}`).join('\n')}` };

  const date = opts.date || cd.today();
  const projectDir = rp.projectDir(project, opts);
  const applied = p.rows.map((x) => {
    const m = x.status.match(/^accepted(?::\s*(.+?))?, version (\d+)$/);
    return m ? `${m[1] || x.document}, version ${m[2]}` : x.document;
  });
  const entry = {
    title: `Change ${r.change.number} closed`,
    lines: [
      `- **Change:** ${r.change.number}, ${r.name}`,
      '- **Applied in:**',
      ...(applied.length ? applied.map((a) => `  - ${a}`) : ['  - None: nothing needed to change']),
      `- **Closed on:** ${date}`,
    ],
  };
  let where = null;
  let n = null;
  for (const a of applied) {
    const rel = a.replace(/, version \d+$/, '');
    const doc = path.join(projectDir, rel);
    if (fs.existsSync(doc) && (n = appendDecision(doc, entry))) { where = rel; break; }
  }
  if (!where) { n = appendDecision(r.change.report, entry); where = path.relative(projectDir, r.change.report).split(path.sep).join('/'); }
  rp.writeText(file, p.text.replace(/^Status: .*$/m, `Status: closed on ${date}`));
  return { code: 0, message: `closed on ${date}: Decision ${n} in ${where}.` };
}

function main() {
  const args = rp.parseArgs(process.argv.slice(2));
  const change = args.values.change;
  if (!args.project || args.project === true || !change || change === true) rp.fail('Use: node tools/close-change.cjs --project <p> --change <nnn>', 2);
  const c = close(args.project, change, { output: args.output, date: args.date && args.date !== true ? args.date : undefined });
  process.stdout.write(`close-change.cjs: change ${String(change).slice(0, 3)} ${c.message}\n`);
  return c.code;
}

module.exports = { close, appendDecision };

if (require.main === module) rp.run(main);
