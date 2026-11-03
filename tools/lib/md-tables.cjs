'use strict';
// md-tables.cjs — reads the markdown tables under a given heading into rows keyed by column name.
//
// Exports:
//   headings(fileOrText)                 every heading, in order: { level, text, line }
//   tableUnder(fileOrText, heading)      the rows of every table in that heading's section,
//                                        its sub-sections included, in order
//   list(cell)                           a cell as a list, always
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

const fs = require('fs');

function textOf(fileOrText) {
  if (fileOrText.includes('\n') || !fs.existsSync(fileOrText)) return fileOrText;
  return fs.readFileSync(fileOrText, 'utf8').replace(/\r\n/g, '\n');
}

// The document's lines, with comments and code blocks blanked so line numbers stay the same.
function cleanLines(text) {
  const lines = text.split(/\r?\n/);
  let inComment = false;
  let inFence = false;
  return lines.map((line) => {
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

function normalize(heading) {
  return heading
    .replace(/^\d+(\.\d+)*\.?\s+/, '')
    .split(' — ')[0]
    .trim()
    .toLowerCase();
}

function headings(fileOrText) {
  const out = [];
  cleanLines(textOf(fileOrText)).forEach((line, i) => {
    const m = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (m) out.push({ level: m[1].length, text: m[2], line: i });
  });
  return out;
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
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

function cellValue(raw) {
  if (!/<br\s*\/?>/i.test(raw)) return raw;
  return raw
    .split(/<br\s*\/?>/i)
    .map((p) => p.trim().replace(BULLET, '').trim())
    .filter((p) => p !== '');
}

// A bullet that starts an item: "•", or "-" or "*" followed by a space, so bold text such as "**Keep**" keeps its stars.
const BULLET = /^(?:•\s*|[-*]\s+)/;

function list(cell) {
  if (cell === undefined || cell === null) return [];
  if (Array.isArray(cell)) return cell;
  const s = String(cell).trim().replace(BULLET, '').trim();
  return s === '' ? [] : [s];
}

function isSeparator(line) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

function tableUnder(fileOrText, heading) {
  const lines = cleanLines(textOf(fileOrText));
  const hs = headings(lines.join('\n'));
  const want = normalize(heading);
  const found = hs.filter((h) => normalize(h.text) === want);
  const start = found.find((h) => h.level > 1) || found[0];
  if (!start) return null;
  const next = hs.find((h) => h.line > start.line && h.level <= start.level);
  const end = next ? next.line : lines.length;

  const rows = [];
  let nearest = start.text;
  let i = start.line + 1;
  while (i < end) {
    const h = lines[i].match(/^(#{1,6})\s+(.*?)\s*$/);
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
        const row = { _heading: nearest };
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
function scenarios(fileOrText) {
  const out = [];
  for (const m of cleanLines(textOf(fileOrText)).join('\n').matchAll(/^\*\*(Scenario \d+) - (.+?)\*\*\s*$/gm)) {
    const named = m[2].match(/\s\(([^()]*)\)$/);
    const rules = (named && named[1].match(/\bF-\d+\.\d+\b/g)) || [];
    out.push({ id: m[1], title: rules.length ? m[2].slice(0, named.index) : m[2], rules });
  }
  return out;
}

module.exports = { headings, tableUnder, list, normalize, scenarios };
