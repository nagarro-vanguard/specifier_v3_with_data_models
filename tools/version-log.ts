// version-log.ts — saves a numbered copy of a document the moment it is accepted.
//
//   node tools/version-log.ts --project <p> --document <name> [--capability|--epic|--story|--change <value>]
//   node tools/version-log.ts --project <p> --document <path inside the project>
//
// Any document project-folders.md names can be saved, the data model's things file, data model files and decisions
// file among them, such as --document data-model --family lending.
//
// What it does, in order:
//   1. sets the document's status line to "accepted on <date>, version <n>" (a Story has none). A data model file
//      written before the kit's document shape, with "Status: Accepted on <date>", gets the kit's line too.
//   2. copies the document to version-log/<document path, without .md>/v<n>.md
//   3. appends one row to version-log/log.md, in the shape of templates/parts/version-log.md. Its Decision record entry
//      is the document's latest Decision record entry, or, for the data model's decisions file, its latest settled
//      decision, such as DM-6.
//
// Exit codes: 0 saved; 2 the document, the project or the layout is missing.
// Options for tests: --output <dir> instead of Output/ in the folder you work from; --date <YYYY-MM-DD> instead of today.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, textOption, today, fail, runMain, type ExitCode } from './lib/cli.ts';
import { resolveDocument, projectDir, pathOf, readText, writeText, eolOf, type PathOptions } from './lib/run-paths.ts';

// A generated document opens with one line saying a program writes it (conventions.md, "The opening of every
// document").
const LOG_DEFINITION = [
  'Written by version-log.ts, one row at each acceptance. Never edit it by hand.',
  '',
].join('\n');

const LOG_HEADER = [
  '| Version | Document | Date | Decision record entry | Copy | Lines added | Lines removed |',
  '|---|---|---|---|---|---|---|',
] as const;

interface LogRow {
  version: number;
  document: string;
}

function linesOf(text: string): string[] {
  const all = text.split(/\r?\n/);
  if (all.length && all[all.length - 1] === '') all.pop();
  return all;
}

// The length of the longest common run of lines, kept in two rows.
function lcsLength(a: string[], b: string[]): number {
  let prev = new Uint32Array(b.length + 1);
  let cur = new Uint32Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    [prev, cur] = [cur, prev];
    cur.fill(0);
  }
  return prev[b.length];
}

// Every row already in the log, keyed by column.
function readLog(logPath: string): LogRow[] {
  if (!fs.existsSync(logPath)) return [];
  const rows: LogRow[] = [];
  for (const line of readText(logPath).split(/\r?\n/)) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((s) => s.trim());
    rows.push({ version: Number(cells[0]), document: cells[1] });
  }
  return rows;
}

// The latest entry of the document's Decision record. The data model's decisions file has no Decision record: its
// latest entry is the last decision under "Settled", such as DM-6, since each one is added in the order it is settled.
function lastDecision(text: string): string {
  const all = [...text.matchAll(/^###\s+Decision\s+(\d+)\b/gm)].map((m) => Number(m[1]));
  if (all.length) return `Decision ${Math.max(...all)}`;
  const settled = (text.split(/^## Settled[ \t]*$/m)[1] || '').split(/^## /m)[0];
  const dms = [...settled.matchAll(/^###\s+(DM-\d+)\b/gm)].map((m) => m[1]);
  return dms.length ? dms[dms.length - 1] : 'None';
}

// The lines added and removed against the version before, or every line as added for the first version.
function linesChanged(project: string, docKey: string, n: number, text: string, opts: PathOptions): { added: number; removed: number } {
  const now = linesOf(text);
  if (n > 1) {
    const prevPath = pathOf(project, 'version-copy', { document: docKey, n: String(n - 1) }, opts);
    if (fs.existsSync(prevPath)) {
      const before = linesOf(readText(prevPath));
      const common = lcsLength(before, now);
      return { added: now.length - common, removed: before.length - common };
    }
  }
  return { added: now.length, removed: 0 };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const doc = resolveDocument(args.document, args.values);
  // An empty name fails in projectDir the same way a missing one does.
  const project = textOption(args, 'project') ?? '';
  const dir = projectDir(project, args);
  if (!fs.existsSync(dir)) fail(`The project folder doesn't exist: ${dir}`, 2);
  const docPath = path.join(dir, doc.rel);
  if (!fs.existsSync(docPath)) fail(`The document doesn't exist: ${doc.rel}`, 2);

  const date = textOption(args, 'date') ?? today();
  const logPath = pathOf(project, 'version-log', {}, args);
  const n = readLog(logPath).filter((r) => r.document === doc.rel).reduce((m, r) => Math.max(m, r.version), 0) + 1;

  // 1. The status line, when the document has one.
  const eol = eolOf(fs.readFileSync(docPath, 'utf8'));
  let text = readText(docPath);
  if (/^Status: .*$/m.test(text)) {
    text = text.replace(/^Status: .*$/m, `Status: accepted on ${date}, version ${n}`);
    writeText(docPath, text);
  }

  // 2. The copy, with the document's own line endings.
  const docKey = doc.rel.replace(/\.(md|json)$/, '');
  const copyPath = pathOf(project, 'version-copy', { document: docKey, n: String(n) }, args);
  fs.mkdirSync(path.dirname(copyPath), { recursive: true });
  writeText(copyPath, text, eol);

  // 3. The row, with the lines added and removed against the version before.
  const { added, removed } = linesChanged(project, docKey, n, text, args);
  const copyLink = path.relative(path.dirname(logPath), copyPath).split(path.sep).join('/');
  const row = `| ${n} | ${doc.rel} | ${date} | ${lastDecision(text)} | [v${n}](${copyLink}) | ${added} | ${removed} |`;

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  let log = fs.existsSync(logPath) ? readText(logPath) : `# Version log — ${project}\n\n${LOG_DEFINITION}\n${LOG_HEADER.join('\n')}\n`;
  if (!log.endsWith('\n')) log += '\n';
  writeText(logPath, log + row + '\n');

  process.stdout.write(`Saved ${doc.rel} as version ${n}: ${added} lines added, ${removed} removed.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
