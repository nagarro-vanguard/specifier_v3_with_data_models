// change-report.ts — reads a Change impact report into data, so every program reads its sections the same way.
//
// Exports:
//   read(project, change, opts)   the change and every section the programs use, as a ChangeReport:
//     change      { number, folder, dir, report }, from check-document.ts's changeOf
//     text        the report's text
//     name        the change's short name, from its folder: "finance limit"
//     status      drafted, accepted or parked, from its status line
//     requests    section 1: [{ n, called, words }]
//     asks        section 5: [{ n, restated }]
//     renames     section 5, "Agreed words this change renames": [{ word, becomes }]
//     lands       section 6: [{ ask, ids, dataModel }]
//                   - ids: every ID the row names, the "Data model" column's items included
//                   - dataModel: the "Data model" column's items alone, each "{Thing}, {action, field or move}", or a
//                     thing alone when the ask adds to it
//     dataModelColumn  whether section 6's table has its "Data model" column
//     kinds       section 7: [{ ask, kind, tests: [{ id, result }], fit }]
//     newWords    section 9: each "New word: {word}" line under "New"
//     blockers    section 10: each line, or [] when it says None
//     findings    section 11: [{ n, finding, quote, from, wouldChange, whoCanFix, answer }]
//     verdict     section 11: PASS, PASS_WITH_FINDINGS or FAIL, or null
//     verdictTaken  section 11: whether the verdict was taken to your gate
//     linked      section 12: [{ id, type, through }]
//     judged      section 13: [{ id, judgement, why }]
//     size        section 14: { size, rule, against }
//     choice      section 16: the option chosen at the last "Make these updates?" decision, or null
//     decision    that decision's number, or null
//   section(text, heading)        the lines of one level-2 section, its heading left out
//   KINDS                         the five kinds, as section 7 writes them, and their type, ChangeKind
//   RESULTS                       the update test's results, as section 7 writes them
//   JUDGEMENTS                    feature-impact's calls, as section 13 writes them
//   CALLED                        the names a request can be called by, as section 1 writes them
//   WOULD_CHANGE                  what a finding would change, as section 11 writes it
//   WHO_CAN_FIX                   who can fix a finding, as section 11 writes it

import fs from 'node:fs';
import { list, normalize, tableUnder, type Cell, type Row } from './md-tables.ts';
import { changeOf, type ChangeFolder } from './check-document.ts';
import { LayoutError, readText, type PathOptions } from './run-paths.ts';
import type { DocStatus } from './types.ts';

export const KINDS = ['Net new', 'Extend or enhance', 'Update or optimize', 'Already covered', 'Blocked'] as const;
export type ChangeKind = (typeof KINDS)[number];
export const RESULTS = ['same', 'opposite', 'changed value', 'new', 'wording only'] as const;
export const JUDGEMENTS = ['No change', 'Update', 'New story', 'Split'] as const;
export const CALLED = ['change request', 'new request', 'a late answer'] as const;
// A finding that would change the type, what's new or what blocks gives FAIL.
export const WOULD_CHANGE = ['the type', "what's new", 'what blocks', 'none of these'] as const;
export const WHO_CAN_FIX = ['the files settle it', 'needs your answer'] as const;
// The columns of section 6 that name IDs, before the "Data model" column.
const ID_COLUMNS = ['Requirement', 'Feature', 'FRD', 'EPIC'] as const;

export interface ChangeRequest { n: string; called: string; words: string }
export interface ChangeAsk { n: string; restated: string }
export interface Rename { word: string; becomes: string }
export interface Landing { ask: string; ids: string[]; dataModel: string[] }
export interface TestResult { id: string; result: string }
export interface KindOfAsk { ask: string; kind: string; tests: TestResult[]; fit: string | null }
export interface ChallengeFinding { n: string; finding: string; quote: string; from: string; wouldChange: string; whoCanFix: string; answer: string }
export interface LinkedItem { id: string; type: string; through: string }
export interface Judged { id: string; judgement: string; why: string }
export interface TentativeSize { size: string | null; rule: string | null; against: string | null }

export interface ChangeReport {
  change: ChangeFolder;
  text: string;
  status: DocStatus | null;
  name: string;
  requests: ChangeRequest[];
  asks: ChangeAsk[];
  renames: Rename[];
  lands: Landing[];
  dataModelColumn: boolean;
  kinds: KindOfAsk[];
  newWords: string[];
  blockers: string[];
  findings: ChallengeFinding[];
  verdict: string | null;
  verdictTaken: boolean;
  linked: LinkedItem[];
  judged: Judged[];
  size: TentativeSize;
  choice: string | null;
  decision: number | null;
}

const plain = (c: Cell | undefined): string[] => list(c).map((x) => String(x).trim()).filter(Boolean);
const one = (c: Cell | undefined): string => plain(c).join(' ').trim();
const none = (s: string): boolean => /^none\b/i.test(String(s).trim());
// A row that is still the template's example, such as "{n}", is not read.
const filled = (s: string): boolean => Boolean(s) && !/^\{/.test(s);

export function section(text: string, heading: string): string[] | null {
  const all = text.split(/\r?\n/);
  const start = all.findIndex((l) => /^## /.test(l) && normalize(l.slice(3)) === normalize(heading));
  if (start < 0) return null;
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  return all.slice(start + 1, end);
}

// The lines a section holds, without its italic lines and blank lines.
const body = (lines: readonly string[] | null): string[] => (lines || []).filter((l) => l.trim() && !/^\*[^*].*\*$/.test(l.trim()));

function statusOf(text: string): DocStatus | null {
  const s = text.match(/^Status: (drafted|accepted on .*|parked on .*)\s*$/m);
  return !s ? null : s[1] === 'drafted' ? 'drafted' : s[1].startsWith('accepted') ? 'accepted' : 'parked';
}

function landsOf(rows: readonly Row[]): Landing[] {
  return rows.map((r) => {
    const dataModel = plain(r['Data model']).filter((x) => !none(x));
    return { ask: one(r.Ask), ids: [...ID_COLUMNS.flatMap((k) => plain(r[k]).filter((x) => !none(x))), ...dataModel], dataModel };
  });
}

// Section 7: each ask's kind, the update test's result for each item, and the Feature Fit line.
function kindsOf(rows: readonly Row[]): KindOfAsk[] {
  return rows.map((r) => {
    const tests: TestResult[] = [];
    let fit: string | null = null;
    for (const line of plain(r['The test that decided it'])) {
      const f = line.match(/^Feature Fit:\s*([^.]+)/i);
      if (f) { fit = f[1].trim(); continue; }
      const t = line.match(/^([^:]+):\s*(.+)$/);
      if (t) tests.push({ id: t[1].trim(), result: t[2].trim() });
    }
    return { ask: one(r.Ask), kind: one(r.Kind), tests, fit };
  });
}

function newWordsOf(text: string): string[] {
  const newLines = body(section(text, "What's reused, and what's new"));
  const at = newLines.findIndex((l) => /^### New/.test(l));
  if (at < 0) return [];
  return newLines.slice(at + 1).map((l) => l.match(/^- New word:\s*(.+)$/)).filter((m) => m !== null).map((m) => m[1].trim());
}

function sizeOf(text: string): TentativeSize {
  const sizeLines = body(section(text, 'The tentative size')).join('\n');
  const field = (label: string): string | null => sizeLines.match(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*(.*)$`, 'm'))?.[1].trim() ?? null;
  return { size: field('Size'), rule: field('The rule that decided it'), against: field('Against') };
}

// The last decision taken at the recommendation's gate, the option chosen, and the decision's number.
function lastChoice(text: string): { choice: string | null; decision: number | null } {
  let choice: string | null = null;
  let decision: number | null = null;
  const decisions = (section(text, 'Your decision') || []).join('\n').split(/^### /m).slice(1);
  for (const d of decisions) {
    if (!/Make these updates|Accept the recommendation/i.test(d.split('\n')[0])) continue;
    const m = d.match(/^- \*\*Chosen:\*\*\s*(.+)$/m);
    if (m) { choice = m[1].trim(); decision = Number((d.match(/^Decision (\d+)/) || [])[1]) || null; }
  }
  return { choice, decision };
}

export function read(project: string, change: string, opts: PathOptions = {}): ChangeReport {
  const c = changeOf(project, change, opts);
  if (!fs.existsSync(c.report)) throw new LayoutError(`The change has no report yet: ${c.report}`);
  const text = readText(c.report);
  const rows = (h: string): Row[] => tableUnder(text, h) || [];

  const requests = rows('The requests, as you stated them').map((r) => ({ n: one(r.Request), called: one(r.Called), words: one(r['Your words']) })).filter((r) => filled(r.n));
  const asks = rows('Restated, and split if several asks').filter((r) => r.Ask !== undefined).map((r) => ({ n: one(r.Ask), restated: one(r.Restated) }));
  const renames = rows('Agreed words this change renames').map((r) => ({ word: one(r['Agreed word']), becomes: one(r.Becomes) })).filter((r) => r.word && !none(r.word));
  const landRows = rows('Where it lands');
  const blockers = body(section(text, 'What blocks')).map((l) => l.replace(/^- /, '').trim()).filter((l) => !none(l));
  const verdict = body(section(text, "The challenge's findings")).join('\n').match(/\*\*Verdict:\*\*\s*(PASS_WITH_FINDINGS|PASS|FAIL)\b(, taken to your gate)?/);
  const findings = rows("The challenge's findings").map((r) => ({ n: one(r['#']), finding: one(r.Finding), quote: one(r.Quote), from: one(r.From), wouldChange: one(r['Would change']), whoCanFix: one(r['Who can fix']), answer: one(r.Answer) })).filter((r) => filled(r.n) && !none(r.n));
  const linked = rows('Linked items').map((r) => ({ id: one(r.Item), type: one(r.Type), through: one(r['Linked through']) })).filter((r) => filled(r.id));
  const judged = rows("Each linked item's judgement").map((r) => ({ id: one(r.Item), judgement: one(r.Judgement), why: one(r.Why) })).filter((r) => filled(r.id));
  const { choice, decision } = lastChoice(text);

  return {
    change: c, text, status: statusOf(text), name: c.folder.replace(/^\d{3}-/, '').replace(/-/g, ' '),
    requests, asks, renames, lands: landsOf(landRows), dataModelColumn: landRows.length > 0 && 'Data model' in landRows[0],
    kinds: kindsOf(rows('Its kind')), newWords: newWordsOf(text), blockers, findings,
    verdict: verdict ? verdict[1] : null, verdictTaken: Boolean(verdict && verdict[2]), linked, judged, size: sizeOf(text), choice, decision,
  };
}
