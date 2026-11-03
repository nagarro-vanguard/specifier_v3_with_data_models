// close-change.ts — writes a change's closing entry, once every document it named is accepted.
//
//   node tools/close-change.ts --project <p> --change <nnn>
//
// track-change.ts calls it when the last row of a change's progress is accepted. What it does:
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
// Exports: close(project, change, opts), closes the change; appendDecision(file, entry), adds an entry at the end of
// a document's Decision record.
//
// Exit codes: 0 closed, or closed already; 1 a row is still pending; 2 the change, its progress or the layout is
// missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, textOption, fail, today, programName, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, pathOf, projectDir, readText, writeText, type PathOptions } from './lib/run-paths.ts';
import { read } from './lib/change-report.ts';
import { plural } from './lib/text.ts';
// track-change.ts imports this file too. Neither uses the other while it loads, so the cycle is safe.
import { read as readProgress } from './track-change.ts';

const USE = 'Use: node tools/close-change.ts --project <p> --change <nnn>';

export interface CloseOptions extends PathOptions {
  // The date the change closes on. Today when it is left out.
  date?: string;
}

export interface Closed {
  code: ExitCode;
  message: string;
}

// An entry of a Decision record: its title, after "Decision {n} — ", and its lines.
export interface DecisionEntry {
  title: string;
  lines: string[];
}

// Adds an entry at the end of a document's Decision record, replacing "None yet." when it is the first. Returns the
// entry's number, or null when the document has no Decision record.
export function appendDecision(file: string, entry: DecisionEntry): number | null {
  const all = readText(file).split('\n');
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
  writeText(file, all.join('\n'));
  return n;
}

export function close(project: string, change: string, opts: CloseOptions = {}): Closed {
  const r = read(project, change, opts);
  const file = pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(file)) throw new LayoutError(`The change has no progress yet: ${file}. It is written when the change's report is accepted.`);
  const p = readProgress(file);
  if (p.closed) return { code: 0, message: 'closed already.' };
  const pending = p.rows.filter((x) => x.status === 'pending');
  if (pending.length) return { code: 1, message: `can't close yet: ${plural(pending.length, 'document')} still pending:\n${pending.map((x) => `- ${x.document}`).join('\n')}` };

  const date = opts.date || today();
  const dir = projectDir(project, opts);
  const applied = p.rows.map((x) => {
    const m = x.status.match(/^accepted(?::\s*(.+?))?, version (\d+)$/);
    return m ? `${m[1] || x.document}, version ${m[2]}` : x.document;
  });
  const entry: DecisionEntry = {
    title: `Change ${r.change.number} closed`,
    lines: [
      `- **Change:** ${r.change.number}, ${r.name}`,
      '- **Applied in:**',
      ...(applied.length ? applied.map((a) => `  - ${a}`) : ['  - None: nothing needed to change']),
      `- **Closed on:** ${date}`,
    ],
  };
  // The first document in the progress that has a Decision record, or else the report's own.
  let where: string | null = null;
  let n: number | null = null;
  for (const a of applied) {
    const rel = a.replace(/, version \d+$/, '');
    const doc = path.join(dir, rel);
    if (!fs.existsSync(doc)) continue;
    n = appendDecision(doc, entry);
    if (n) { where = rel; break; }
  }
  if (!where) { n = appendDecision(r.change.report, entry); where = path.relative(dir, r.change.report).split(path.sep).join('/'); }
  writeText(file, p.text.replace(/^Status: .*$/m, `Status: closed on ${date}`));
  return { code: 0, message: `closed on ${date}: Decision ${n} in ${where}.` };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const c = close(project, change, { output: args.output, date: textOption(args, 'date') });
  process.stdout.write(`${programName(import.meta.filename)}: change ${change.slice(0, 3)} ${c.message}\n`);
  return c.code;
}

if (import.meta.main) runMain(main);
