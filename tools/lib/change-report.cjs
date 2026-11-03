'use strict';
// change-report.cjs — reads a Change impact report into data, so every program reads its sections the same way.
//
// Exports:
//   read(project, change, opts)   the change and every section the programs use:
//     change      { number, folder, dir, report }, from check-document.cjs's changeOf
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
//     linked      section 12: [{ id, type, through }]
//     judged      section 13: [{ id, judgement, why }]
//     size        section 14: { size, rule, against }
//     choice      section 16: the option chosen at the last "Make these updates?" decision, or null
//     decision    that decision's number, or null
//   section(text, heading)        the lines of one level-2 section, its heading left out
//   KINDS                         the five kinds, as section 7 writes them
//   RESULTS                       the update test's results, as section 7 writes them
//   JUDGEMENTS                    feature-impact's calls, as section 13 writes them
//   CALLED                        the names a request can be called by, as section 1 writes them
//   WOULD_CHANGE                  what a finding would change, as section 11 writes it
//   WHO_CAN_FIX                   who can fix a finding, as section 11 writes it

const fs = require('fs');
const md = require('./md-tables.cjs');
const cd = require('./check-document.cjs');
const rp = require('./run-paths.cjs');

const KINDS = ['Net new', 'Extend or enhance', 'Update or optimize', 'Already covered', 'Blocked'];
const RESULTS = ['same', 'opposite', 'changed value', 'new', 'wording only'];
const JUDGEMENTS = ['No change', 'Update', 'New story', 'Split'];
const CALLED = ['change request', 'new request', 'a late answer'];
// A finding that would change the type, what's new or what blocks gives FAIL.
const WOULD_CHANGE = ['the type', "what's new", 'what blocks', 'none of these'];
const WHO_CAN_FIX = ['the files settle it', 'needs your answer'];

const plain = (c) => md.list(c).map((x) => String(x).trim()).filter(Boolean);
const one = (c) => plain(c).join(' ').trim();
const none = (s) => /^none\b/i.test(String(s).trim());

function section(text, heading) {
  const all = text.split(/\r?\n/);
  const start = all.findIndex((l) => /^## /.test(l) && md.normalize(l.slice(3)) === md.normalize(heading));
  if (start < 0) return null;
  let end = all.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = all.length;
  return all.slice(start + 1, end);
}

// The lines a section holds, without its italic lines and blank lines.
const body = (lines) => (lines || []).filter((l) => l.trim() && !/^\*[^*].*\*$/.test(l.trim()));

function read(project, change, opts = {}) {
  const c = cd.changeOf(project, change, opts);
  if (!fs.existsSync(c.report)) throw new rp.LayoutError(`The change has no report yet: ${c.report}`);
  const text = rp.readText(c.report);
  const s = text.match(/^Status: (drafted|accepted on .*|parked on .*)\s*$/m);
  const status = !s ? null : s[1] === 'drafted' ? 'drafted' : s[1].startsWith('accepted') ? 'accepted' : 'parked';
  const rows = (h) => md.tableUnder(text, h) || [];

  const requests = rows('The requests, as you stated them').map((r) => ({ n: one(r.Request), called: one(r.Called), words: one(r['Your words']) })).filter((r) => r.n && !/^\{/.test(r.n));
  const asks = rows('Restated, and split if several asks').filter((r) => r.Ask !== undefined).map((r) => ({ n: one(r.Ask), restated: one(r.Restated) }));
  const renames = rows('Agreed words this change renames').map((r) => ({ word: one(r['Agreed word']), becomes: one(r.Becomes) })).filter((r) => r.word && !none(r.word));
  const landRows = rows('Where it lands');
  const lands = landRows.map((r) => {
    const dataModel = plain(r['Data model']).filter((x) => !none(x));
    return { ask: one(r.Ask), ids: [...['Requirement', 'Feature', 'FRD', 'EPIC'].flatMap((k) => plain(r[k]).filter((x) => !none(x))), ...dataModel], dataModel };
  });
  const dataModelColumn = landRows.length > 0 && 'Data model' in landRows[0];
  const kinds = rows('Its kind').map((r) => {
    const tests = [];
    let fit = null;
    for (const line of plain(r['The test that decided it'])) {
      const f = line.match(/^Feature Fit:\s*([^.]+)/i);
      if (f) { fit = f[1].trim(); continue; }
      const t = line.match(/^([^:]+):\s*(.+)$/);
      if (t) tests.push({ id: t[1].trim(), result: t[2].trim() });
    }
    return { ask: one(r.Ask), kind: one(r.Kind), tests, fit };
  });

  const newLines = body(section(text, "What's reused, and what's new"));
  const at = newLines.findIndex((l) => /^### New/.test(l));
  const newWords = at < 0 ? [] : newLines.slice(at + 1).map((l) => l.match(/^- New word:\s*(.+)$/)).filter(Boolean).map((m) => m[1].trim());

  const blockers = body(section(text, 'What blocks')).map((l) => l.replace(/^- /, '').trim()).filter((l) => !none(l));
  const v = body(section(text, "The challenge's findings")).join('\n').match(/\*\*Verdict:\*\*\s*(PASS_WITH_FINDINGS|PASS|FAIL)\b(, taken to your gate)?/);
  const findings = rows("The challenge's findings").map((r) => ({ n: one(r['#']), finding: one(r.Finding), quote: one(r.Quote), from: one(r.From), wouldChange: one(r['Would change']), whoCanFix: one(r['Who can fix']), answer: one(r.Answer) })).filter((r) => r.n && !/^\{/.test(r.n) && !none(r.n));
  const linked = rows('Linked items').map((r) => ({ id: one(r.Item), type: one(r.Type), through: one(r['Linked through']) })).filter((r) => r.id && !/^\{/.test(r.id));
  const judged = rows("Each linked item's judgement").map((r) => ({ id: one(r.Item), judgement: one(r.Judgement), why: one(r.Why) })).filter((r) => r.id && !/^\{/.test(r.id));

  const sizeLines = body(section(text, 'The tentative size')).join('\n');
  const field = (label) => { const m = sizeLines.match(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*(.*)$`, 'm')); return m ? m[1].trim() : null; };
  const size = { size: field('Size'), rule: field('The rule that decided it'), against: field('Against') };

  // The last decision taken at the recommendation's gate, the option chosen, and the decision's number.
  let choice = null;
  let decision = null;
  const decisions = (section(text, 'Your decision') || []).join('\n').split(/^### /m).slice(1);
  for (const d of decisions) {
    if (!/Make these updates|Accept the recommendation/i.test(d.split('\n')[0])) continue;
    const m = d.match(/^- \*\*Chosen:\*\*\s*(.+)$/m);
    if (m) { choice = m[1].trim(); decision = Number((d.match(/^Decision (\d+)/) || [])[1]) || null; }
  }

  return {
    change: c, text, status, name: c.folder.replace(/^\d{3}-/, '').replace(/-/g, ' '),
    requests, asks, renames, lands, dataModelColumn, kinds, newWords, blockers, findings, verdict: v ? v[1] : null, verdictTaken: Boolean(v && v[2]), linked, judged, size, choice, decision,
  };
}

module.exports = { read, section, KINDS, RESULTS, JUDGEMENTS, CALLED, WOULD_CHANGE, WHO_CAN_FIX };
