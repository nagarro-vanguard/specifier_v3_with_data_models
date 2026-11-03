// copy-wording.ts — copies a requirement's new wording to every place that quotes it, and nothing else.
//
//   node tools/copy-wording.ts --project <p> --change <nnn> --requirement <ID>
//
// It runs only after you chose "Copy the wording" at the change's gate, so the change's report is accepted and its
// progress exists.
//
// What it does:
//   1. takes the new wording from section 5 of the change's report, where an ask reads:
//      REQ-3.2 now reads: "Claims over 1,000 need finance approval."
//   2. takes the old wording from the requirement's row in the PRD, without its name in bold:
//      **Finance approval** — Claims over 500 need finance approval.
//   3. finds every place that quotes the requirement: its row in the PRD, and the line that names it in each FRD's
//      Requirements list. Every document that exists counts, drafted or accepted.
//   4. refuses, and writes nothing, when a place doesn't hold the old wording word for word, so a copy that has
//      drifted is never overwritten without anyone seeing it
//   5. replaces the old wording with the new in every place, and records each one in the change's progress, under
//      "Places written"
//   6. runs accept.ts for each accepted document it changed, so each gets a new version
//
// Exports: places(project, id, opts), every place that quotes the requirement; newWording(report, id), the new
// wording section 5 gives it.
//
// Exit codes: 0 written; 1 refused, or the change's decision isn't "Copy the wording", or the report gives no new
// wording for the requirement; 2 the change, its report, its progress, the PRD or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD>.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { LayoutError, matches, pathOf, projectDir, readText, writeText, type PathOptions } from './lib/run-paths.ts';
import { list } from './lib/md-tables.ts';
import { load, lines, replaceSection, requirementsOf } from './lib/check-document.ts';
import { read, type ChangeReport } from './lib/change-report.ts';
import { plural, escapeRegExp } from './lib/text.ts';
import { acceptAgain } from './insert-answer.ts';

const USE = 'Use: node tools/copy-wording.ts --project <p> --change <nnn> --requirement <ID>';

// A place that quotes the requirement.
export interface WordingPlace {
  rel: string;
  line: number;
  where: string;
}

export interface Drifted {
  rel: string;
  line: number;
  why: string;
}

export type WordingPlaces =
  | { old: null; places: WordingPlace[]; drifted: Drifted[]; error: string }
  | { old: string; places: WordingPlace[]; drifted: Drifted[] };

// The new wording an ask gives a requirement: REQ-3.2 now reads: "...".
export function newWording(report: ChangeReport, id: string): string | null {
  for (const a of report.asks) {
    const m = a.restated.match(new RegExp(`^${escapeRegExp(id)} now reads:\\s*"(.+)"\\s*$`));
    if (m) return m[1];
  }
  return null;
}

// Every place that quotes the requirement, each with the old wording, or why it has drifted.
export function places(project: string, id: string, opts: PathOptions = {}): WordingPlaces {
  const prd = load(project, 'prd', {}, opts);
  // The simple words are read from the "In simple words" column, and a transition requirement's from its second column.
  // The client's words, next to them, are never changed here.
  const row = lines(prd.text).find((l) => /^Requirements\b|^Transition requirements/i.test(l.section.replace(/^\d+\.\s*/, '')) && l.line.split('|')[1] && l.line.split('|')[1].trim() === id);
  if (!row) return { old: null, places: [], drifted: [], error: `${id} isn't a requirement in the PRD.` };
  const req = requirementsOf(prd.text).find((r) => list(r.ID).join(' ').trim() === id);
  const asWritten = req ? req.simple : row.line.split('|')[2].trim();
  const old = asWritten.replace(/^\*\*[^*]+\*\*\s+—\s+/, '');
  const quoted: WordingPlace[] = [{ rel: prd.rel, line: row.n, where: `section 4, ${id}` }];
  const drifted: Drifted[] = [];
  for (const m of matches(project, 'frd', opts)) {
    // The Requirements list is the only place in an FRD with lines that start with a requirement's ID in bold.
    for (const l of lines(readText(m.abs))) {
      if (!l.line.startsWith(`- **${id} `)) continue;
      if (l.line.includes(old)) quoted.push({ rel: m.rel, line: l.n, where: `Requirements, ${id}` });
      else drifted.push({ rel: m.rel, line: l.n, why: `it doesn't quote ${id} word for word as the PRD has it` });
    }
  }
  return { old, places: quoted, drifted };
}

// Writes the new wording in place of the old in every place, and returns the documents written.
function writeWording(dir: string, quoted: WordingPlace[], old: string, wording: string): string[] {
  const docs = [...new Set(quoted.map((x) => x.rel))];
  for (const rel of docs) {
    const file = path.join(dir, rel);
    const all = readText(file).split('\n');
    for (const x of quoted.filter((y) => y.rel === rel)) all[x.line - 1] = all[x.line - 1].replace(old, wording);
    writeText(file, all.join('\n'));
  }
  return docs;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', USE);
  const change = args.values.change;
  if (!change || change === true) fail(USE, 2);
  const id = requireOption(args, 'requirement', USE);
  const opts = { output: args.output };
  const r = read(project, change, opts);
  if (r.choice !== 'Copy the wording') {
    process.stdout.write(`Change ${r.change.number}'s decision is ${r.choice ? `"${r.choice}"` : 'not made yet'}, not "Copy the wording": nothing is written.\n`);
    return 1;
  }
  const progress = pathOf(project, 'change-progress', { change: r.change.folder }, opts);
  if (!fs.existsSync(progress)) throw new LayoutError(`The change has no progress yet: ${progress}. It is written when the change's report is accepted.`);
  const wording = newWording(r, id);
  if (!wording) { process.stdout.write(`Section 5 gives no new wording for ${id}. It reads: ${id} now reads: "{the new wording}".\n`); return 1; }

  const p = places(project, id, opts);
  if ('error' in p) { process.stdout.write(`${p.error}\n`); return 1; }
  if (p.drifted.length) {
    process.stdout.write(`Nothing is written: ${plural(p.drifted.length, 'place')} quote ${id} differently from the PRD. Bring them back in line first:\n`);
    for (const x of p.drifted) process.stdout.write(`- ${x.rel}, line ${x.line}: ${x.why}\n`);
    return 1;
  }
  const docs = writeWording(projectDir(project, opts), p.places, p.old, wording);
  replaceSection(progress, 'Places written', ['| Document | Where | Before | After |', '|---|---|---|---|', ...p.places.map((x) => `| ${x.rel} | ${x.where} | ${p.old} | ${wording} |`)]);

  const out = [`${programName(import.meta.filename)}: ${id}'s new wording written in ${plural(p.places.length, 'place')}, in ${plural(docs.length, 'document')}.`];
  const again = acceptAgain(project, docs, args);
  out.push(...again.lines);
  process.stdout.write(`${out.join('\n')}\n`);
  return again.code;
}

if (import.meta.main) runMain(main);
