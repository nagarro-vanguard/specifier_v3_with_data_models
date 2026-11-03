'use strict';
// md-lint.cjs — finds markdown that won't render as written.
//
// Exports:
//   lint(text)   a list of { line, problem }, empty when the text renders cleanly
//
// What it finds (conventions.md, "Markdown that renders"):
//   1. a table row with more or fewer cells than its header. A "|" inside a cell splits it, even inside
//      backticks, unless it is written "\|".
//   2. text in angle brackets outside code. A renderer treats it as an HTML tag and hides it.
//      Only <br> is allowed, inside table cells, and an empty anchor, <a id="..."></a>, which hides no text and
//      lets another page link to that place.
//   3. a link whose path holds a space or angle brackets. The link breaks.
//   4. in a mermaid diagram: <angle brackets> other than <br>, or a label that holds brackets,
//      braces or quotes without being wrapped in double quotes. The diagram fails to draw.
//   5. markdown shown inside a code block, such as a blockquote or a table given as an example.
//      Viewers draw it differently. Show a real example, and a table of what each line holds.
// Other code blocks and HTML comments are skipped. Mermaid blocks are checked by rule 4.

function cellCount(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  let n = 1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') { i++; continue; }
    if (s[i] === '|') n++;
  }
  return n;
}

function isSeparator(line) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

function withoutCodeSpans(line) {
  return line.replace(/(`+)[\s\S]*?\1/g, (m) => ' '.repeat(m.length));
}

// A mermaid line: labels inside [..], (..), {..} and their doubled forms, and edge labels |..|.
// Text inside double quotes is safe, so it is blanked before the line is read.
const CLOSER = { '([': '])', '[[': ']]', '[(': ')]', '((': '))', '{{': '}}', '[': ']', '(': ')', '{': '}' };
function mermaidProblems(line) {
  const problems = [];
  const outsideQuotes = line.replace(/"[^"]*"/g, (m) => `"${'x'.repeat(m.length - 2)}"`);
  const noBr = outsideQuotes.replace(/<br\s*\/?>/gi, '');
  if (/<(?![-.=])/.test(noBr.replace(/<-->|<--|<-\.|<==/g, ''))) problems.push('angle brackets in a mermaid diagram outside double quotes; only <br> draws');
  for (const m of outsideQuotes.matchAll(/\b[A-Za-z]\w*(\(\[|\[\[|\[\(|\(\(|\{\{|\[|\(|\{)/g)) {
    const start = m.index + m[0].length;
    if (outsideQuotes[start] === '"') continue;
    const end = outsideQuotes.indexOf(CLOSER[m[1]], start);
    const inner = end < 0 ? outsideQuotes.slice(start) : outsideQuotes.slice(start, end);
    if (/[[\](){}"<>]/.test(inner)) problems.push(`mermaid label needs double quotes: ${inner.slice(0, 40)}`);
  }
  for (const m of outsideQuotes.matchAll(/\|([^|]*)\|/g)) {
    if (/[[\](){}<>]/.test(m[1])) problems.push(`mermaid edge label needs double quotes: ${m[1].slice(0, 40)}`);
  }
  return problems;
}

function lint(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let fence = null; // null, 'code' or 'mermaid'
  let inComment = false;
  let tableCols = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const at = i + 1;

    if (fence) {
      if (/^\s*```/.test(raw)) { fence = null; continue; }
      if (fence === 'mermaid') for (const p of mermaidProblems(raw)) out.push({ line: at, problem: p });
      // Rule 5: markdown shown inside a code block. Viewers draw it differently, and it is hard to read.
      if (fence === 'plain' && /^\s*(>|#{1,6}\s|\|.*\||[-*]\s+\*\*|\d+\.\s)/.test(raw)) {
        out.push({ line: at, problem: 'markdown shown inside a code block; show a real example and a table of what each line holds' });
        fence = 'reported';
      }
      continue;
    }
    const f = raw.match(/^\s*```\s*(\w*)/);
    if (f) {
      const lang = f[1].toLowerCase();
      fence = lang === 'mermaid' ? 'mermaid' : ['', 'md', 'markdown', 'text'].includes(lang) ? 'plain' : 'code';
      tableCols = null;
      continue;
    }

    let line = raw;
    if (inComment) {
      const end = line.indexOf('-->');
      if (end < 0) continue;
      inComment = false;
      line = ' '.repeat(end + 3) + line.slice(end + 3);
    }
    line = line.replace(/<!--.*?-->/g, (m) => ' '.repeat(m.length));
    const open = line.indexOf('<!--');
    if (open >= 0) { inComment = true; line = line.slice(0, open); }

    // Rule 1: tables.
    const isRow = /^\s*\|/.test(line) || (tableCols !== null && line.includes('|') && line.trim() !== '');
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isSeparator(lines[i + 1]) && tableCols === null) {
      tableCols = cellCount(line);
    } else if (tableCols !== null && isRow && !isSeparator(line)) {
      const n = cellCount(line);
      if (n !== tableCols) out.push({ line: at, problem: `table row has ${n} cells; its header has ${tableCols}` });
    } else if (!isRow && !isSeparator(line)) {
      tableCols = null;
    }

    // An empty anchor hides no text: it only marks a place another page links to.
    const plain = withoutCodeSpans(line).replace(/<a id="[^"<>]*"><\/a>/g, (m) => ' '.repeat(m.length));

    // Rule 2: angle brackets that a renderer would hide.
    for (const m of plain.matchAll(/<\/?([^\s>][^>]*)>/g)) {
      const tag = m[1].trim().toLowerCase();
      if (/^br\s*\/?$/.test(tag)) continue;
      if (/^https?:/.test(tag)) continue;
      out.push({ line: at, problem: `"${m[0].slice(0, 40)}" is hidden when rendered; use {curly braces} for a placeholder` });
    }

    // Rule 3: links that break. A template may hold a placeholder in a link path, written without spaces.
    for (const m of plain.matchAll(/\]\(([^)]*)\)/g)) {
      if (/\s|[<>]/.test(m[1])) out.push({ line: at, problem: `link path "${m[1].slice(0, 40)}" holds a space or angle brackets` });
    }
  }
  return out;
}

module.exports = { lint };
