// run-paths.ts — turns a project and a document name into its path,
// using the JSON block in .claude/skills/_shared/project-folders.md (the only copy of the layout).
//
// Exports:
//   pathOf(project, document, values, opts)   the full path, with {placeholders} filled in
//   exists(project, document, values, opts)   whether that file is there
//   relOf(document, values)                   the path inside the project folder
//   matches(project, document, opts)          every file on disk that fits the document's pattern
//   identify(relPath)                         which document a project-relative path is, and its values
//   resolveDocument(name, values)             --document, given as a layout name or as a path inside the project
//   projectDir(project, opts)                 the project folder
//   layout()                                  every document's path, read and checked
//   setupFolders()                            the folders created when a project is set up
//   slug(name)                                a name in lowercase with hyphens, as used in paths
//   readText(file)                            a file's text, with every line ending as "\n"
//   writeText(file, text, eol)                writes text whose lines end in "\n", keeping the file's own line endings
//   eolOf(text)                               the line ending a text uses: "\r\n" or "\n"
//
// Every failure to read the layout is a LayoutError, and a program that meets one exits with code 2.
//
// Line endings: a document may end its lines with "\r\n", as Windows saves them, or with "\n". Every program reads a
// document through readText, so each pattern it uses works the same on both. A program that writes a document back
// uses writeText, so the document keeps the line endings it had.

import fs from 'node:fs';
import path from 'node:path';
import { escapeRegExp } from './text.ts';

export const KIT_ROOT = path.resolve(import.meta.dirname, '..', '..');
// SPECIFIER_LAYOUT points at another layout file. Only the tests use it, to check a broken layout fails.
export const LAYOUT_FILE = process.env.SPECIFIER_LAYOUT || path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'project-folders.md');
// Projects live in Output/<project>/, in the folder you work from. Nothing depends on where the kit itself sits.
export const DEFAULT_OUTPUT = path.resolve(process.cwd(), 'Output');

// The value names a path may hold, and the command-line option that carries each.
// {product} is always the project's name, so it is filled in, never given on its own.
export const VALUE_NAMES = ['product', 'capability', 'epic', 'story', 'change', 'section', 'family', 'document', 'n'] as const;

// A path's values, by value name, such as { epic: 'EPIC-002' }. A value given on the command line with nothing after
// it is true, and is refused when the path needs it.
export type Values = Record<string, string | true>;

// Every document's name, and its path inside the project folder, such as "frd/frd-{capability}.md".
export type Layout = Record<string, string>;

export interface PathOptions {
  // The Output folder. DEFAULT_OUTPUT when it is left out.
  output?: string;
}

export interface Identified {
  document: string;
  values: Values;
}

export interface DocumentRef extends Identified {
  rel: string;
}

export interface MatchedFile {
  rel: string;
  abs: string;
  values: Values;
}

export class LayoutError extends Error {
  readonly code = 2;
}

let cached: { paths: Layout; setup: string[] } | null = null;

function readLayout(): { paths: Layout; setup: string[] } {
  if (!fs.existsSync(LAYOUT_FILE)) throw new LayoutError(`The project folders file is missing: ${LAYOUT_FILE}`);
  const text = readText(LAYOUT_FILE);
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)];
  if (blocks.length !== 1) throw new LayoutError(`project-folders.md must hold exactly one JSON block; it holds ${blocks.length}.`);
  let whole: unknown;
  try {
    whole = JSON.parse(blocks[0][1]);
  } catch (e) {
    throw new LayoutError(`The JSON block in project-folders.md is malformed: ${(e as Error).message}`);
  }
  const { paths, createdAtSetup: setup } = (whole ?? {}) as { paths?: unknown; createdAtSetup?: unknown };
  if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
    throw new LayoutError('The JSON block in project-folders.md must hold "paths": an object of document names to paths.');
  }
  if (!Array.isArray(setup) || setup.some((s) => typeof s !== 'string' || !s.endsWith('/'))) {
    throw new LayoutError('The JSON block in project-folders.md must hold "createdAtSetup": a list of folders, each ending in "/".');
  }
  for (const [name, p] of Object.entries(paths)) {
    if (typeof p !== 'string' || !p) throw new LayoutError(`In project-folders.md, "${name}" has no path.`);
    for (const ph of p.matchAll(/{([^}]+)}/g)) {
      if (!isValueName(ph[1])) throw new LayoutError(`In project-folders.md, "${name}" uses an unknown value {${ph[1]}}.`);
    }
  }
  checkTableAgrees(text, paths as Layout);
  return { paths: paths as Layout, setup };
}

// The readable table must name exactly the same paths as the JSON block.
function checkTableAgrees(text: string, paths: Layout): void {
  const tablePaths = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\|[^|]+\|\s*`([^`]+)`\s*\|$/);
    if (m) tablePaths.add(m[1]);
  }
  const jsonPaths = new Set(Object.values(paths));
  const onlyTable = [...tablePaths].filter((p) => !jsonPaths.has(p));
  const onlyJson = [...jsonPaths].filter((p) => !tablePaths.has(p));
  if (!onlyTable.length && !onlyJson.length) return;
  const lines = ['The table and the JSON block in project-folders.md disagree.'];
  for (const p of onlyTable) lines.push(`- only in the table: ${p}`);
  for (const p of onlyJson) lines.push(`- only in the JSON block: ${p}`);
  throw new LayoutError(lines.join('\n'));
}

function isValueName(name: string): boolean {
  return (VALUE_NAMES as readonly string[]).includes(name);
}

export function layout(): Layout {
  cached ??= readLayout();
  return cached.paths;
}

export function setupFolders(): string[] {
  cached ??= readLayout();
  return cached.setup;
}

// A name as it appears in a path: lowercase, "&" as "and", and anything that isn't a letter or a digit as one hyphen.
export function slug(name: string): string {
  return String(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function projectDir(project: string | true | undefined, opts: PathOptions = {}): string {
  if (!project || project === true) throw new LayoutError('No project was given. Use --project <name>.');
  return path.join(opts.output || DEFAULT_OUTPUT, project);
}

function template(document: string): string {
  const l = layout();
  if (!(document in l)) {
    throw new LayoutError(`"${document}" is not a document in project-folders.md. Known documents:\n${Object.keys(l).map((k) => `- ${k}`).join('\n')}`);
  }
  return l[document];
}

export function relOf(document: string, values: Values = {}): string {
  return template(document).replace(/{([^}]+)}/g, (_, name: string) => {
    const v = values[name];
    if (v === undefined || v === null || v === '' || v === true) {
      throw new LayoutError(`"${document}" needs a value for {${name}}. Use --${name} followed by the value.`);
    }
    return String(v);
  });
}

export function pathOf(project: string, document: string, values: Values = {}, opts: PathOptions = {}): string {
  return path.join(projectDir(project, opts), relOf(document, { product: project, ...values }));
}

export function exists(project: string, document: string, values: Values = {}, opts: PathOptions = {}): boolean {
  return fs.existsSync(pathOf(project, document, values, opts));
}

// A pattern's regular expression, with one group per value.
function patternRe(document: string): { re: RegExp; names: string[] } {
  const t = template(document);
  let re = '';
  let last = 0;
  const names: string[] = [];
  for (const m of t.matchAll(/{([^}]+)}/g)) {
    re += escapeRegExp(t.slice(last, m.index));
    re += m[1] === 'document' ? '(.+?)' : '([^/]+?)';
    names.push(m[1]);
    last = m.index + m[0].length;
  }
  re += escapeRegExp(t.slice(last));
  return { re: new RegExp(`^${re}$`), names };
}

function valuesOf(names: string[], m: RegExpMatchArray): Values {
  const values: Values = {};
  names.forEach((n, i) => { values[n] = m[i + 1]; });
  return values;
}

function walk(dir: string, base = dir, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

export function matches(project: string, document: string, opts: PathOptions = {}): MatchedFile[] {
  const { re, names } = patternRe(document);
  const dir = projectDir(project, opts);
  const found: MatchedFile[] = [];
  for (const rel of walk(dir).sort()) {
    const m = rel.match(re);
    if (!m) continue;
    // A file that fits an earlier, more exact entry, such as a Story list, is not this document.
    const id = identify(rel);
    if (!id || id.document !== document) continue;
    found.push({ rel, abs: path.join(dir, rel), values: valuesOf(names, m) });
  }
  return found;
}

// Which document a project-relative path is. Fixed paths win over patterns, and patterns are tried in layout order.
export function identify(relPath: string): Identified | null {
  const rel = relPath.split(path.sep).join('/');
  const l = layout();
  for (const [name, t] of Object.entries(l)) {
    if (!t.includes('{') && t === rel) return { document: name, values: {} };
  }
  for (const name of Object.keys(l)) {
    if (!l[name].includes('{')) continue;
    const { re, names } = patternRe(name);
    const m = rel.match(re);
    if (m) return { document: name, values: valuesOf(names, m) };
  }
  return null;
}

// Resolves --document, given either as a layout name with values, or as a path inside the project.
export function resolveDocument(name: string | true | undefined, values: Values): DocumentRef {
  if (!name || name === true) throw new LayoutError('No document was given. Use --document <name>.');
  if (name.includes('/') || name.endsWith('.md') || name.endsWith('.json')) {
    const id = identify(name);
    if (!id) throw new LayoutError(`"${name}" is not a path that project-folders.md knows.`);
    return { document: id.document, values: id.values, rel: name.split(path.sep).join('/') };
  }
  return { document: name, values, rel: relOf(name, values) };
}

// The line ending a text uses: "\r\n" when its lines end so, and "\n" otherwise.
export function eolOf(text: string): '\r\n' | '\n' {
  return /\r\n/.test(text) ? '\r\n' : '\n';
}

export function readText(file: string): string {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

// Writes text whose lines end in "\n". A file that is already there keeps its line endings. A new file gets eol when
// it is given, such as the line ending of the document it copies, and "\n" otherwise.
export function writeText(file: string, text: string, eol?: string): void {
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const end = old.includes('\n') ? eolOf(old) : eol || '\n';
  const lf = text.replace(/\r\n/g, '\n');
  fs.writeFileSync(file, end === '\n' ? lf : lf.replace(/\n/g, end));
}
