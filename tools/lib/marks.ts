// marks.ts — the two short marks a document that cites nothing, such as the BRD, writes for a gap, and the checks that
// go with them (conventions.md, parts 9 and 12, and templates/brd.md, "No citations, and two marks").
//
//   [TBD, Q7]                    no file and no answer gives the value yet
//   a value<sup>*Q4</sup>        the skill suggests the value, for the specifier to confirm
//
// Exports:
//   TBD_MARK, PROPOSED_MARK      the two marks, each with its question's number in group 1
//   LEGEND                       the line straight under each table or list that holds a PROPOSED_MARK
//   citationFindings(text)       a citation, an old gap label, or a Source column
//   legendFindings(text)         a table or list with a PROPOSED_MARK and no legend under it, or a legend with no mark
//   withoutLonelyLegends(text)   the text, without each legend that has no PROPOSED_MARK left above it
//   checkRecordFindings(text)    the Check record holds more than "None yet." or its one line
//   checkRecordLine(passed, date, time)   the one line, such as "Pass, 2026-11-03 14:05"
//   timeNow()                    the time now, as 14:05

import { normalize } from './md-tables.ts';

export const TBD_MARK = /\[TBD, Q(\d+)\]/;
export const PROPOSED_MARK = /<sup>\*Q(\d+)<\/sup>/;
export const LEGEND = '<sup>*</sup> Proposed: needs your confirmation. Qn is its question in the Question log.';

// A citation as the other documents write it: after a dash, or naming a file, a decision, a change or the Discovery
// brief. "Claims per month" is not one.
const CITATION = /— per |\bper (?:your decision|the Discovery brief|Discovery brief|change \d{3}|[\w.-]+\.(?:md|docx?|pdf|eml|xlsx?|csv|txt|pptx?)\b)/i;
const OLD_LABEL = /Proposed \(needs confirmation\)|\bTBD, question \d+/;
// The sections a mark or a citation is never looked for in.
const NOT_CONTENT = ['check record', 'placeholders'];
const RECORD_LINE = /^(Pass|Fail), \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

interface ContentLine {
  n: number;
  line: string;
}

// The lines a reader reads: outside fenced code, block quotes and the record sections. A heading is kept, so a table
// or list ends at it.
function contentLines(text: string): ContentLine[] {
  const out: ContentLine[] = [];
  let fence = false;
  let skip = false;
  text.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*```/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const h = line.match(/^##\s+(.*?)\s*$/);
    if (h) skip = NOT_CONTENT.includes(normalize(h[1]));
    if (skip || /^>/.test(line)) return;
    out.push({ n: i + 1, line });
  });
  return out;
}

const isBlockLine = (line: string): boolean => /^\s*(\||-\s|•)/.test(line);
const isSeparator = (line: string): boolean => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

export function citationFindings(text: string): string[] {
  const all = contentLines(text);
  const findings: string[] = [];
  all.forEach(({ n, line }, i) => {
    if (CITATION.test(line)) findings.push(`Line ${n} cites a source. The document names no file, section or decision.`);
    const old = line.match(OLD_LABEL);
    if (old) findings.push(`Line ${n} has "${old[0]}". Write a gap as [TBD, Q{n}], or a suggestion as the value and <sup>*Q{n}</sup>.`);
    const next = all[i + 1];
    if (/^\s*\|/.test(line) && next && isSeparator(next.line) && line.split('|').some((c) => c.trim() === 'Source')) {
      findings.push(`Line ${n}: the table has a Source column. The document names no source.`);
    }
  });
  return findings;
}

// Each table or list: its lines in a row, and the line straight after them.
function blocks(text: string): { first: number; lines: string[]; after: ContentLine | undefined }[] {
  const all = contentLines(text).filter((l) => l.line.trim() !== '');
  const out: { first: number; lines: string[]; after: ContentLine | undefined }[] = [];
  for (let i = 0; i < all.length; i++) {
    if (!isBlockLine(all[i].line)) continue;
    const start = i;
    while (i + 1 < all.length && isBlockLine(all[i + 1].line)) i++;
    out.push({ first: all[start].n, lines: all.slice(start, i + 1).map((l) => l.line), after: all[i + 1] });
  }
  return out;
}

export function legendFindings(text: string): string[] {
  const findings: string[] = [];
  const legendsUsed = new Set<number>();
  for (const b of blocks(text)) {
    const marked = b.lines.some((l) => PROPOSED_MARK.test(l));
    const legend = b.after && b.after.line.trim() === LEGEND;
    if (legend && b.after) legendsUsed.add(b.after.n);
    if (marked && !legend) findings.push(`Line ${b.first}: the table or list has a <sup>*Q{n}</sup> and no legend line straight under it.`);
    if (!marked && legend && b.after) findings.push(`Line ${b.after.n}: the legend line has no <sup>*Q{n}</sup> above it.`);
  }
  for (const { n, line } of contentLines(text)) {
    if (line.trim() === LEGEND && !legendsUsed.has(n)) findings.push(`Line ${n}: the legend line isn't straight under a table or list.`);
  }
  return findings;
}

// After an answer takes the place of a mark, a legend may have no mark left above it. It goes, with the blank line
// before it.
export function withoutLonelyLegends(text: string): string {
  const lonely = new Set(blocks(text).filter((b) => b.after && b.after.line.trim() === LEGEND && !b.lines.some((l) => PROPOSED_MARK.test(l))).map((b) => (b.after as ContentLine).n));
  if (!lonely.size) return text;
  const all = text.split('\n');
  const keep = all.filter((_, i) => !lonely.has(i + 1) && !(lonely.has(i + 2) && all[i].trim() === ''));
  return keep.join('\n');
}

export function checkRecordFindings(text: string): string[] {
  const all = text.split(/\r?\n/);
  const start = all.findIndex((l) => /^##\s+Check record\s*$/.test(l));
  if (start < 0) return [];
  let end = all.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end < 0) end = all.length;
  const body = all.slice(start + 1, end).map((l) => l.trim()).filter(Boolean);
  if (body.length === 1 && (body[0] === 'None yet.' || RECORD_LINE.test(body[0]))) return [];
  return ['The Check record holds "None yet." or one line: Pass or Fail, then the date and time, such as "Pass, 2026-11-03 14:05".'];
}

export function checkRecordLine(passed: boolean, date: string, time: string): string {
  return `${passed ? 'Pass' : 'Fail'}, ${date} ${time}`;
}

export function timeNow(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
