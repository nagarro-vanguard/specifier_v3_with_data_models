'use strict';
// run-paths.cjs — turns a project and a document name into its path,
// using the JSON block in .claude/skills/_shared/project-folders.md (the only copy of the layout).
//
// Exports:
//   pathOf(project, document, values, opts)   the full path, with {placeholders} filled in
//   exists(project, document, values, opts)   whether that file is there
//   relOf(document, values)                   the path inside the project folder
//   matches(project, document, opts)          every file on disk that fits the document's pattern
//   identify(relPath)                         which document a project-relative path is, and its values
//   projectDir(project, opts)                 the project folder
//   layout()                                  every document's path, read and checked
//   setupFolders()                            the folders created when a project is set up
//   slug(name)                                a name in lowercase with hyphens, as used in paths
//   parseArgs(argv)                           the shared command-line options
//   fail(message, code)                       print and exit
//   readText(file)                            a file's text, with every line ending as "\n"
//   writeText(file, text, eol)                writes text whose lines end in "\n", keeping the file's own line endings
//   eolOf(text)                               the line ending a text uses: "\r\n" or "\n"
//
// Every failure to read the layout is a LayoutError, and a program that meets one exits with code 2.
//
// Line endings: a document may end its lines with "\r\n", as Windows saves them, or with "\n". Every program reads a
// document through readText, so each pattern it uses works the same on both. A program that writes a document back
// uses writeText, so the document keeps the line endings it had.

const fs = require('fs');
const path = require('path');

const KIT_ROOT = path.resolve(__dirname, '..', '..');
// SPECIFIER_LAYOUT points at another layout file. Only the tests use it, to check a broken layout fails.
const LAYOUT_FILE = process.env.SPECIFIER_LAYOUT || path.join(KIT_ROOT, '.claude', 'skills', '_shared', 'project-folders.md');
// Projects live in Output/<project>/, in the folder you work from. Nothing depends on where the kit itself sits.
const DEFAULT_OUTPUT = path.resolve(process.cwd(), 'Output');

// The value names a path may hold, and the command-line option that carries each.
// {product} is always the project's name, so it is filled in, never given on its own.
const VALUE_NAMES = ['product', 'capability', 'epic', 'story', 'change', 'section', 'family', 'document', 'n'];

class LayoutError extends Error {
  constructor(message) {
    super(message);
    this.code = 2;
  }
}

let cached = null;
let cachedSetup = null;

function layout() {
  if (cached) return cached;
  if (!fs.existsSync(LAYOUT_FILE)) throw new LayoutError(`The project folders file is missing: ${LAYOUT_FILE}`);
  const text = readText(LAYOUT_FILE);
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)];
  if (blocks.length !== 1) throw new LayoutError(`project-folders.md must hold exactly one JSON block; it holds ${blocks.length}.`);
  let whole;
  try {
    whole = JSON.parse(blocks[0][1]);
  } catch (e) {
    throw new LayoutError(`The JSON block in project-folders.md is malformed: ${e.message}`);
  }
  const json = whole && whole.paths;
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new LayoutError('The JSON block in project-folders.md must hold "paths": an object of document names to paths.');
  }
  const setup = whole.createdAtSetup;
  if (!Array.isArray(setup) || setup.some((s) => typeof s !== 'string' || !s.endsWith('/'))) {
    throw new LayoutError('The JSON block in project-folders.md must hold "createdAtSetup": a list of folders, each ending in "/".');
  }
  for (const [name, p] of Object.entries(json)) {
    if (typeof p !== 'string' || !p) throw new LayoutError(`In project-folders.md, "${name}" has no path.`);
    for (const ph of p.matchAll(/{([^}]+)}/g)) {
      if (!VALUE_NAMES.includes(ph[1])) throw new LayoutError(`In project-folders.md, "${name}" uses an unknown value {${ph[1]}}.`);
    }
  }
  // The readable table must name exactly the same paths as the JSON block.
  const tablePaths = new Set();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\|[^|]+\|\s*`([^`]+)`\s*\|$/);
    if (m) tablePaths.add(m[1]);
  }
  const jsonPaths = new Set(Object.values(json));
  const onlyTable = [...tablePaths].filter((p) => !jsonPaths.has(p));
  const onlyJson = [...jsonPaths].filter((p) => !tablePaths.has(p));
  if (onlyTable.length || onlyJson.length) {
    const lines = ['The table and the JSON block in project-folders.md disagree.'];
    for (const p of onlyTable) lines.push(`- only in the table: ${p}`);
    for (const p of onlyJson) lines.push(`- only in the JSON block: ${p}`);
    throw new LayoutError(lines.join('\n'));
  }
  cached = json;
  cachedSetup = setup;
  return json;
}

function setupFolders() {
  layout();
  return cachedSetup;
}

// A name as it appears in a path: lowercase, "&" as "and", and anything that isn't a letter or a digit as one hyphen.
function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function projectDir(project, opts = {}) {
  if (!project || project === true) throw new LayoutError('No project was given. Use --project <name>.');
  return path.join(opts.output || DEFAULT_OUTPUT, project);
}

function template(document) {
  const l = layout();
  if (!(document in l)) {
    throw new LayoutError(`"${document}" is not a document in project-folders.md. Known documents:\n${Object.keys(l).map((k) => `- ${k}`).join('\n')}`);
  }
  return l[document];
}

function relOf(document, values = {}) {
  return template(document).replace(/{([^}]+)}/g, (_, name) => {
    const v = values[name];
    if (v === undefined || v === null || v === '' || v === true) {
      throw new LayoutError(`"${document}" needs a value for {${name}}. Use --${name} followed by the value.`);
    }
    return String(v);
  });
}

function pathOf(project, document, values = {}, opts = {}) {
  return path.join(projectDir(project, opts), relOf(document, { product: project, ...values }));
}

function exists(project, document, values = {}, opts = {}) {
  return fs.existsSync(pathOf(project, document, values, opts));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A pattern's regular expression, with one group per value.
function patternRe(document) {
  const t = template(document);
  let re = '';
  let last = 0;
  const names = [];
  for (const m of t.matchAll(/{([^}]+)}/g)) {
    re += escapeRe(t.slice(last, m.index));
    re += m[1] === 'document' ? '(.+?)' : '([^/]+?)';
    names.push(m[1]);
    last = m.index + m[0].length;
  }
  re += escapeRe(t.slice(last));
  return { re: new RegExp(`^${re}$`), names };
}

function walk(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function matches(project, document, opts = {}) {
  const { re, names } = patternRe(document);
  const dir = projectDir(project, opts);
  const found = [];
  for (const rel of walk(dir).sort()) {
    const m = rel.match(re);
    if (!m) continue;
    // A file that fits an earlier, more exact entry, such as a Story list, is not this document.
    const id = identify(rel);
    if (!id || id.document !== document) continue;
    const values = {};
    names.forEach((n, i) => { values[n] = m[i + 1]; });
    found.push({ rel, abs: path.join(dir, rel), values });
  }
  return found;
}

// Which document a project-relative path is. Fixed paths win over patterns, and patterns are tried in layout order.
function identify(relPath) {
  const rel = relPath.split(path.sep).join('/');
  const l = layout();
  for (const [name, t] of Object.entries(l)) {
    if (!t.includes('{') && t === rel) return { document: name, values: {} };
  }
  for (const name of Object.keys(l)) {
    if (!l[name].includes('{')) continue;
    const { re, names } = patternRe(name);
    const m = rel.match(re);
    if (m) {
      const values = {};
      names.forEach((n, i) => { values[n] = m[i + 1]; });
      return { document: name, values };
    }
  }
  return null;
}

// The shared options: --project, --output, --document, --date, and one per value name.
function parseArgs(argv) {
  const args = { values: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    if (VALUE_NAMES.includes(key) && key !== 'document') args.values[key] = val;
    else args[key] = val;
  }
  if (args.output) args.output = path.resolve(args.output);
  if (args.project && args.project !== true) args.values.product = args.project;
  return args;
}

// Resolves --document, given either as a layout name with values, or as a path inside the project.
function resolveDocument(args) {
  const name = args.document;
  if (!name || name === true) throw new LayoutError('No document was given. Use --document <name>.');
  if (name.includes('/') || name.endsWith('.md') || name.endsWith('.json')) {
    const id = identify(name);
    if (!id) throw new LayoutError(`"${name}" is not a path that project-folders.md knows.`);
    return { document: id.document, values: id.values, rel: name.split(path.sep).join('/') };
  }
  return { document: name, values: args.values, rel: relOf(name, args.values) };
}

function fail(message, code) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

// The line ending a text uses: "\r\n" when its lines end so, and "\n" otherwise.
function eolOf(text) {
  return /\r\n/.test(text) ? '\r\n' : '\n';
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

// Writes text whose lines end in "\n". A file that is already there keeps its line endings. A new file gets eol when
// it is given, such as the line ending of the document it copies, and "\n" otherwise.
function writeText(file, text, eol) {
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const end = old.includes('\n') ? eolOf(old) : eol || '\n';
  const lf = text.replace(/\r\n/g, '\n');
  fs.writeFileSync(file, end === '\n' ? lf : lf.replace(/\n/g, end));
}

// Runs a program's main function, turning a LayoutError into exit code 2.
function run(main) {
  try {
    const code = main();
    process.exit(code || 0);
  } catch (e) {
    if (e instanceof LayoutError) fail(e.message, 2);
    throw e;
  }
}

module.exports = {
  LayoutError, layout, setupFolders, slug, projectDir, relOf, pathOf, exists, matches, identify,
  parseArgs, resolveDocument, fail, run, readText, writeText, eolOf, KIT_ROOT, LAYOUT_FILE, DEFAULT_OUTPUT,
};
