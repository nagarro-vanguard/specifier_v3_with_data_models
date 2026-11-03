// md-tables.ts — reads the markdown tables under a given heading into rows keyed by column name.
//
// Exports:
//   headings(fileOrText)                 every heading, in order: { level, text, line }
//   tableUnder(fileOrText, heading)      the rows of every table in that heading's section,
//                                        its sub-sections included, in order
//   list(cell)                           a cell as a list, always
//   cellText(cell)                       a cell as one line of text, its items joined by spaces
//   cellItems(cell)                      a cell's items, each trimmed, leaving out empty ones and "None"
//   cellNumber(cell)                     the number a cell starts with, or NaN
//   normalize(heading)                   a heading as tableUnder compares it
//   scenarios(fileOrText)                a Story's acceptance scenarios: { id, title, rules }, from each
//                                        "**Scenario n - title (F-01.1, F-01.2)**" line
//
// Rules:
// - TEMPLATE NOTES (HTML comments) and fenced code blocks are skipped.
// - A heading matches when its text is equal, ignoring case, a leading number such as "2." or "3.1",
//   and anything after " — ". When the document title and a section both match, the section wins.
// - Each row is an object keyed by its table's column names. Its _heading is the nearest heading above it.
// - A cell holding <br> is split into a list, with leading bullets removed. Any other cell is a string.
// - Returns null when the heading isn't found, and [] when the section holds no table.

import fs from 'node:fs';

// A cell is a string, or a list when it holds <br>.
export type Cell = string | string[];

// One table row, keyed by column name, with the nearest heading above it.
export interface Row {
  _heading: string;
  [column: string]: Cell;
}

export interface Heading {
  level: number;
  text: string;
  // The line's index in the document, from 0.
  line: number;
}

export interface Scenario {
  id: string;
  title: string;
  rules: string[];
}

// A bullet that starts an item: "•", or "-" or "*" followed by a space, so bold text such as "**Keep**" keeps its stars.
const BULLET = /^(?:•\s*|[-*]\s+)/;
const HEADING = /^(#{1,6})\s+(.*?)\s*$/;

function textOf(fileOrText: string): string {
  if (fileOrText.includes('\n') || !fs.existsSync(fileOrText)) return fileOrText;
  return fs.readFileSync(fileOrText, 'utf8').replace(/\r\n/g, '\n');
}

// The document's lines, with comments and code blocks blanked so line numbers stay the same.
function cleanLines(text: string): string[] {
  let inComment = false;
  let inFence = false;
  return text.split(/\r?\n/).map((line) => {
    if (inFence) {
      if (/^\s*```/.test(line)) inFence = false;
      return '';
    }
    if (inComment) {
      if (line.includes('-->')) inComment = false;
      return '';
    }
    if (/^\s*```/.test(line)) {
      inFence = true;
      return '';
    }
    if (line.includes('<!--')) {
      if (!line.includes('-->')) inComment = true;
      return line.replace(/<!--.*?(-->|$)/g, '');
    }
    return line;
  });
}

export function normalize(heading: string): string {
  return heading
    .replace(/^\d+(\.\d+)*\.?\s+/, '')
    .split(' — ')[0]
    .trim()
    .toLowerCase();
}

export function headings(fileOrText: string): Heading[] {
  const out: Heading[] = [];
  cleanLines(textOf(fileOrText)).forEach((line, i) => {
    const m = line.match(HEADING);
    if (m) out.push({ level: m[1].length, text: m[2], line: i });
  });
  return out;
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells: string[] = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (s[i] === '|') {
      cells.push(cur.trim());
      cur = '';
    } else cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

function cellValue(raw: string): Cell {
  if (!/<br\s*\/?>/i.test(raw)) return raw;
  return raw
    .split(/<br\s*\/?>/i)
    .map((p) => p.trim().replace(BULLET, '').trim())
    .filter((p) => p !== '');
}

export function list(cell: Cell | null | undefined): string[] {
  if (cell === undefined || cell === null) return [];
  if (Array.isArray(cell)) return cell;
  const s = String(cell).trim().replace(BULLET, '').trim();
  return s === '' ? [] : [s];
}

export function cellText(cell: Cell | null | undefined): string {
  return (Array.isArray(cell) ? cell.join(' ') : String(cell || '')).trim();
}

export function cellItems(cell: Cell | null | undefined): string[] {
  return list(cell).map((x) => String(x).trim()).filter((x) => x && !/^none$/i.test(x));
}

export function cellNumber(cell: Cell | null | undefined): number {
  return Number(cellText(cell).match(/^(\d+)/)?.[1]);
}

function isSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

export function tableUnder(fileOrText: string, heading: string): Row[] | null {
  const lines = cleanLines(textOf(fileOrText));
  const hs = headings(lines.join('\n'));
  const want = normalize(heading);
  const found = hs.filter((h) => normalize(h.text) === want);
  const start = found.find((h) => h.level > 1) || found[0];
  if (!start) return null;
  const next = hs.find((h) => h.line > start.line && h.level <= start.level);
  const end = next ? next.line : lines.length;

  const rows: Row[] = [];
  let nearest = start.text;
  let i = start.line + 1;
  while (i < end) {
    const h = lines[i].match(HEADING);
    if (h) {
      nearest = h[2];
      i++;
      continue;
    }
    if (lines[i].trim().startsWith('|') && i + 1 < end && isSeparator(lines[i + 1])) {
      const cols = splitRow(lines[i]);
      i += 2;
      while (i < end && lines[i].trim().startsWith('|')) {
        const cells = splitRow(lines[i]);
        const row: Row = { _heading: nearest };
        cols.forEach((c, k) => { row[c] = cellValue(cells[k] !== undefined ? cells[k] : ''); });
        rows.push(row);
        i++;
      }
      continue;
    }
    i++;
  }
  return rows;
}

// Each scenario names the FRD rules it proves in brackets at the end of its title. A title with no rule IDs in
// brackets names no rule.
export function scenarios(fileOrText: string): Scenario[] {
  const out: Scenario[] = [];
  for (const m of cleanLines(textOf(fileOrText)).join('\n').matchAll(/^\*\*(Scenario \d+) - (.+?)\*\*\s*$/gm)) {
    const named = m[2].match(/\s\(([^()]*)\)$/);
    const rules = named?.[1].match(/\bF-\d+\.\d+\b/g) ?? [];
    const title = named && rules.length ? m[2].slice(0, named.index) : m[2];
    out.push({ id: m[1], title, rules });
  }
  return out;
}
