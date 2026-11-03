'use strict';
// data-model.cjs — reads a product's data model: the things file, the data model file of each family it names, and the
// data model's decisions file. The shapes it reads are the templates in .claude/skills/_shared/templates/:
// data-model-things.md, data-model.md and data-model-decisions.md.
//
// Exports:
//   load(project, opts)        the whole data model: { thingsFile, files }
//                                - thingsFile: readThings's result, with file, rel and name
//                                - files: one entry per family the things file names, in its order: readFile's result,
//                                  with family, name (such as "lending.md"), value (such as "lending"), file, rel and
//                                  exists
//                              The data model is required. A missing things file, or a missing data model file the
//                              things file names, is a LayoutError, so the program exits with code 2. With
//                              opts.allowMissing, a missing data model file comes back with exists false and no parts.
//                              opts.output is the Output folder, as for every program.
//   readThings(fileOrText)     the things file: { status, nextStep, families, decisions, waitingOnGlossary }
//                                - each family: { family, name, value, line, things: [{ Thing, Definition }],
//                                  kindOf: [lines], leftOut }
//   readFile(fileOrText)       one data model file: { status, nextStep, title, fieldsList, parts }
//                                - fieldsList: the rows of "Things and their fields"
//                                - parts: one per "## {Thing}" or "## Adds to {Thing}" section, in the file's order
//   statusOf(text)             the first status line in the text, in either form in use. See "Status" below.
//   cell(value)                one cell, read: { text, items, gaps, proposed, none }. See "Cells" below.
//   typeOf(value)              a Type cell, read: { base, choices, setFrom }, such as { base: 'one of', choices:
//                              ['On loan', 'Overdue'], setFrom: null }
//   moveName(row)              a move's name: its From and its To, joined by " → ", such as "On loan → Overdue"
//   actionsAndMoves(model)     every row of every Actions table and every Moves table, in the files' order, and in each
//                              file in the order its tables come: { file, family, thing, kind, name, row, part }
//                                - kind is "action" or "move"
//                                - name is the Action cell, or moveName(row)
//                              model is load's result, or any { files: [{ name, family, parts }] }
//   things(model)              each thing, with what its own part and every "Adds to" part give it: a Map from the
//                              thing's name to { thing, file, definition, actions, fields, moves, states, parts }.
//                              Its own part comes first, so actions[0] is the action that makes it. Each row has _file.
//   readDecisions(fileOrText)  the decisions file: every DM and GC entry, open and settled. See "Decisions" below.
//   decisionsOf(project, opts) readDecisions's result for the project's decisions file, with file, rel, name and
//                              exists. A missing file comes back with exists false and no entries: a program that needs
//                              it says so itself.
//   stillOpen(decisions, thingsName)
//                              every entry still open, in the file's order: each decision under "Open", and each
//                              Glossary change the Glossary hasn't settled. See "Still open" below.
//
// A part: { heading, thing, addsTo, line, definition, kindOf, actions, fields, moves, states, decisions,
//           waitingOnGlossary, labels, notes, tables }
//   - thing is the heading, or the thing after "Adds to". addsTo is true for an "Adds to" part.
//   - definition is the "Definition:" line under the heading, after its label. A file written before the kit's document
//     shape has the definition as a line in italics instead, and that is read too, without its stars.
//   - kindOf is { parent, file } from the "one kind of" line, or null.
//   - actions, fields, moves, states, decisions and waitingOnGlossary are the rows of the table of that kind. The rules
//     table is fields. Each move row also has _field: the status field its "How {field} moves" label names.
//   - labels are the bold lines, such as "Actions" or "How state moves", each { text, line }.
//   - notes are the other lines, such as "Moves back to an earlier state: ? (DM-3)", each { text, line }.
//   - tables holds every table, in order: { kind, label, line, columns, raw, rows }. kind is one of the names above, or "other".
//     label is the last bold line above the table, so the rules table, which has none, shares the Actions label.
//     raw is the table's lines as the file has them, for a check that compares a copy word for word.
// Each row is keyed by its table's column names, as lib/md-tables.cjs reads it: a cell holding <br> is a list, with its
// bullets removed. So "one of:<br>• On loan<br>• Overdue" is ['one of:', 'On loan', 'Overdue'].
//
// Status. The data model's files write the kit's status line, as every other document does: "Status: drafted", then
// "Status: accepted on {date}, version {n}", which accept.cjs writes, or "Status: parked on …". Files written before
// the kit's document shape write "Status: Drafted", "Status: Accepted on {date}" or "Status: Accepted on {date}, with
// open decisions". statusOf reads each of them, in any case:
//   { state, raw, acceptedOn, version, openDecisions }
//   - state is "drafted", "accepted", "parked", or null when there is no status line or it is none of these
//   - raw is the text after "Status: ", or null
//
// Decisions. readDecisions gives { status, title, open, settled, glossaryChanges, entries, inForce }:
//   - open and settled: the DM entries under "## Open" and "## Settled". glossaryChanges: the GC entries under
//     "## Glossary changes". entries: all of them, in the file's order.
//   - inForce: a Map from each ID to its entry. Each ID has one entry only, and check-data-model.cjs names an ID with
//     more than one. Then the last entry for the ID is the one in the Map.
// Each entry is { id, kind, number, question, section, line, fields, options, recommended, reason, chosen, proposed,
//   state, replaces, replacedBy, decidedBy, date, broughtIn }:
//   - kind is "DM" or "GC". question is the heading's text after " — ". section is "open", "settled" or "glossary
//     changes".
//   - fields: each "- **{Label}:** {text}" line, keyed by its label, such as fields.Where
//   - options: each option under "Options", as { label, text }, "I don't know yet" included. The label is the bold
//     text, without its last full stop.
//   - recommended and reason: the Recommended line, split at ", because"
//   - chosen: the Chosen line. proposed: the answer of an open DM answered "I don't know yet", whose Chosen reads
//     "Proposed: {answer}".
//   - state: "open" or "settled" for a DM. For a GC, from its Status line: "to raise", "raised", "left open",
//     "settled" for "Settled in the Glossary on {date}", or "brought in" once it also reads ". Brought into the data
//     model on {date}". null when the line is none of these.
//   - replaces: the ID a "Replaces DM-{n}:" question names. replacedBy: the ID of the entry that replaces this one.
//   - decidedBy: BA or PO, and date: the date it was decided, settled or left open, as YYYY-MM-DD. broughtIn: the
//     date a GC was brought into the data model, or null.
//
// Still open. stillOpen gives one { entry, file, asks, waits } for each entry still open:
//   - a decision under "Open". waits is "not answered yet", or "answered \"I don't know yet\"" when it is marked
//     Proposed.
//   - a Glossary change marked "To raise", "Raised" or "Left open on {date}". waits is its status.
//   - file is the file its Where, or its "Raised from", names first. A Glossary change raised from a decision takes the
//     file of that decision. asks is the skill that asks it: things-author for the things file, or data-model-author
//     for a data model file. A decision answered "I don't know yet", and a Glossary change left open, are asked again
//     first, at that skill's next run.
//
// Cells. A gap is "? ({ID})", where the ID is a decision (DM-) or a Glossary change (GC-). An answer still to be
// confirmed is "{answer}, Proposed (needs confirmation), question {n}".
// cell gives:
//   - text: the cell as one line, its list items joined by a space
//   - items: the cell as a list
//   - gaps: each gap's ID, such as ['DM-2']
//   - proposed: each answer still to be confirmed, as { answer, question }
//   - none: true when the cell is "–"

const fs = require('fs');
const path = require('path');
const rp = require('./run-paths.cjs');
const md = require('./md-tables.cjs');

// The sections of a data model file that are not a thing's part.
const NOT_PARTS = ['things and their fields', 'decision record', 'check record', 'placeholders', 'filling in this template'];

function textOf(fileOrText) {
  if (fileOrText.includes('\n') || !fs.existsSync(fileOrText)) return fileOrText.replace(/\r\n/g, '\n');
  return rp.readText(fileOrText);
}

const join = (c) => md.list(c).map((x) => String(x).trim()).filter(Boolean).join(' ');

function columnsOf(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// The text, read as a list of pieces in order: headings, bold labels, tables and other lines. Fenced code, such as a
// "How it moves" picture, and comments are skipped. Line numbers start at 1.
function pieces(text) {
  const lines = text.split('\n');
  const out = [];
  let fence = false;
  let comment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) { if (/^\s*```/.test(line)) fence = false; continue; }
    if (comment) { if (line.includes('-->')) comment = false; continue; }
    if (/^\s*```/.test(line)) { fence = true; continue; }
    if (/^\s*<!--/.test(line)) { if (!line.includes('-->')) comment = true; continue; }
    const h = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (h) { out.push({ type: 'heading', level: h[1].length, text: h[2], line: i + 1 }); continue; }
    if (/^\s*\|/.test(line)) {
      const start = i;
      while (i + 1 < lines.length && /^\s*\|/.test(lines[i + 1])) i++;
      const raw = lines.slice(start, i + 1);
      // md-tables reads the rows, so every program reads a cell the same way.
      const rows = (md.tableUnder(`# table\n${raw.join('\n')}`, 'table') || []).map(({ _heading, ...r }) => r);
      out.push({ type: 'table', line: start + 1, columns: columnsOf(raw[0]), raw: raw.join('\n'), rows });
      continue;
    }
    const b = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (b) { out.push({ type: 'label', text: b[1].trim(), line: i + 1 }); continue; }
    if (line.trim()) out.push({ type: 'line', text: line.trim(), line: i + 1 });
  }
  return out;
}

// Which table it is, from its columns.
function kindOf(columns) {
  const has = (...cs) => cs.every((c) => columns.includes(c));
  if (has('Action', 'Who')) return 'actions';
  if (has('Field', 'Type')) return 'fields';
  if (has('From', 'To')) return 'moves';
  if (columns[0] === 'State') return 'states';
  if (has('Decision', 'Question')) return 'decisions';
  if (has('Change', 'What the Glossary needs')) return 'waitingOnGlossary';
  if (has('Thing', 'Fields it gives')) return 'fieldsList';
  if (has('Thing', 'Definition')) return 'things';
  return 'other';
}

function statusOf(text) {
  const m = String(text || '').match(/^Status:[ \t]*(.*?)[ \t]*$/m);
  const none = { state: null, raw: m ? m[1] : null, acceptedOn: null, version: null, openDecisions: false };
  if (!m) return none;
  const raw = m[1];
  const a = raw.match(/^accepted on (\d{4}-\d{2}-\d{2})(?:, version (\d+))?(, with open decisions)?\.?$/i);
  if (a) return { ...none, state: 'accepted', acceptedOn: a[1], version: a[2] ? Number(a[2]) : null, openDecisions: Boolean(a[3]) };
  if (/^drafted\.?$/i.test(raw)) return { ...none, state: 'drafted' };
  if (/^parked on /i.test(raw)) return { ...none, state: 'parked' };
  return none;
}

function nextStepOf(text) {
  const m = text.match(/^Next step:[ \t]*(.*?)[ \t]*$/m);
  return m ? m[1] : null;
}

function cell(value) {
  const items = md.list(value).map((x) => String(x).trim()).filter(Boolean);
  const text = items.join(' ');
  const gaps = [...text.matchAll(/\?\s*\(((?:DM|GC)-\d+)\)/g)].map((m) => m[1]);
  // The answer starts after the sentence before it, if any. A full stop inside a number, as in "2.5 hours", ends no
  // sentence.
  const proposed = [...text.matchAll(/((?:[^.]|\.(?!\s))*?),\s*Proposed \(needs confirmation\),\s*question (\d+)/g)]
    .map((m) => ({ answer: m[1].trim(), question: Number(m[2]) }));
  return { text, items, gaps, proposed, none: /^[–-]$/.test(text) };
}

function typeOf(value) {
  const items = md.list(value).map((x) => String(x).trim()).filter(Boolean);
  let setFrom = null;
  // "set from {field}" may end the first item, such as "number, set from due date", or be an item of its own.
  const rest = [];
  items.forEach((item, i) => {
    const m = item.match(/^(.*?)[,\s]*\bset from (.+?)\.?$/i);
    if (m) {
      setFrom = m[2].trim();
      if (i === 0 || m[1].trim()) rest.push(m[1].trim());
    } else rest.push(item);
  });
  const first = rest[0] || '';
  const many = first.match(/^(one or more of|one of)\s*:\s*(.*)$/i);
  if (!many) return { base: first, choices: [], setFrom };
  return { base: many[1].toLowerCase(), choices: [...(many[2] ? [many[2]] : []), ...rest.slice(1)], setFrom };
}

function moveName(row) {
  return `${join(row.From)} → ${join(row.To)}`;
}

function newPart(h, partLevel) {
  const adds = h.text.match(/^Adds to (.+)$/);
  return {
    heading: h.text, thing: adds ? adds[1].trim() : h.text, addsTo: Boolean(adds), line: h.line, level: partLevel,
    definition: null, kindOf: null, actions: [], fields: [], moves: [], states: [], decisions: [],
    waitingOnGlossary: [], labels: [], notes: [], tables: [],
  };
}

function readFile(fileOrText) {
  const text = textOf(fileOrText);
  const ps = pieces(text);
  const title = ps.find((p) => p.type === 'heading');
  const top = ps.find((p) => p.type === 'heading' && md.normalize(p.text) === 'things and their fields');
  const partLevel = top ? top.level : 2;
  const out = { status: statusOf(text), nextStep: nextStepOf(text), title: title ? title.text : null, fieldsList: [], parts: [] };
  let part = null;
  let inTop = false;
  let label = null;
  let field = null;
  for (const p of ps) {
    if (p.type === 'heading') {
      if (p.level > partLevel) continue;
      part = null;
      inTop = false;
      label = null;
      field = null;
      if (p.level < partLevel) continue;
      if (md.normalize(p.text) === 'things and their fields') inTop = true;
      else if (!NOT_PARTS.includes(md.normalize(p.text))) {
        part = newPart(p, partLevel);
        out.parts.push(part);
      }
      continue;
    }
    if (inTop && p.type === 'table') { out.fieldsList.push(...p.rows); continue; }
    if (!part) continue;
    if (p.type === 'label') {
      label = p.text;
      const moves = p.text.match(/^How (.+?) moves(?:, in .+)?$/);
      field = moves ? moves[1].trim() : null;
      part.labels.push({ text: p.text, line: p.line });
    } else if (p.type === 'table') {
      const kind = kindOf(p.columns);
      const rows = kind === 'moves' ? p.rows.map((r) => ({ ...r, _field: field })) : p.rows;
      part.tables.push({ kind, label, line: p.line, columns: p.columns, raw: p.raw, rows });
      if (Array.isArray(part[kind])) part[kind].push(...rows);
    } else {
      // "Definition: {definition}", or a line in italics in a file written before the kit's document shape.
      const italic = p.text.match(/^Definition:\s*(.+)$/) || p.text.match(/^\*([^*].*?)\*$/);
      const kind = p.text.match(/\bis one kind of (.+?)\.(?:.*\bis written in (\S+?)\.?)?$/);
      if (italic && part.definition === null && !part.tables.length) part.definition = italic[1].trim();
      else if (kind && !part.kindOf) part.kindOf = { parent: kind[1].trim(), file: kind[2] ? kind[2].replace(/`/g, '') : null };
      else part.notes.push({ text: p.text, line: p.line });
    }
  }
  return out;
}

// "Data model file: [lending.md](lending.md)", or "Data model file: lending.md": the file's name.
function fileNameOf(line) {
  const m = line.match(/^Data model file:\s*(?:\[([^\]]*)\]\(([^)]*)\)|`?([^\s`]+)`?)/);
  if (!m) return null;
  return path.posix.basename((m[2] || m[3] || m[1] || '').trim());
}

function readThings(fileOrText) {
  const text = textOf(fileOrText);
  const out = { status: statusOf(text), nextStep: nextStepOf(text), families: [], decisions: [], waitingOnGlossary: [] };
  let section = null;
  let family = null;
  let inKinds = false;
  for (const p of pieces(text)) {
    if (p.type === 'heading') {
      section = p;
      family = null;
      inKinds = false;
      continue;
    }
    if (p.type === 'line' && section) {
      const name = /^Data model file:/.test(p.text) ? fileNameOf(p.text) : null;
      if (name) {
        family = { family: section.text, name, value: name.replace(/\.md$/, ''), line: section.line, things: [], kindOf: [], leftOut: null };
        out.families.push(family);
        continue;
      }
      if (!family) continue;
      if (/^Kind of:\s*$/.test(p.text)) { inKinds = true; continue; }
      const left = p.text.match(/^Left out:\s*(.*)$/);
      if (left) { family.leftOut = left[1]; inKinds = false; continue; }
      const bullet = p.text.match(/^[-*•]\s+(.*)$/);
      if (inKinds && bullet) family.kindOf.push(bullet[1].trim());
      continue;
    }
    if (p.type === 'table') {
      const kind = kindOf(p.columns);
      if (kind === 'things' && family) family.things.push(...p.rows);
      else if (kind === 'decisions') out.decisions.push(...p.rows);
      else if (has(p.columns, 'Change', 'Word')) out.waitingOnGlossary.push(...p.rows);
    }
  }
  return out;
}

function has(columns, ...cs) {
  return cs.every((c) => columns.includes(c));
}

function load(project, opts = {}) {
  const thingsPath = rp.pathOf(project, 'data-model-things', {}, opts);
  if (!fs.existsSync(thingsPath)) {
    throw new rp.LayoutError(`The data model isn't there yet: its things file is missing, ${thingsPath}. Run data-model-workflow first.`);
  }
  const thingsFile = {
    ...readThings(thingsPath),
    file: thingsPath,
    rel: rp.relOf('data-model-things', { product: project }),
    name: path.basename(thingsPath),
  };
  const files = thingsFile.families.map((f) => {
    const values = { family: f.value };
    const file = rp.pathOf(project, 'data-model', values, opts);
    const base = { family: f.family, name: f.name, value: f.value, file, rel: rp.relOf('data-model', values), exists: fs.existsSync(file) };
    if (base.exists) return { ...base, ...readFile(file) };
    if (!opts.allowMissing) {
      throw new rp.LayoutError(`The data model file ${f.name}, which the things file names for ${f.family}, is missing: ${file}`);
    }
    return { ...base, status: statusOf(''), nextStep: null, title: null, fieldsList: [], parts: [] };
  });
  return { thingsFile, files };
}

function actionsAndMoves(model) {
  const out = [];
  for (const f of model.files || []) {
    for (const part of f.parts || []) {
      for (const t of part.tables) {
        if (t.kind !== 'actions' && t.kind !== 'moves') continue;
        for (const row of t.rows) {
          const kind = t.kind === 'actions' ? 'action' : 'move';
          out.push({ file: f.name, family: f.family, thing: part.thing, kind, name: kind === 'action' ? join(row.Action) : moveName(row), row, part });
        }
      }
    }
  }
  return out;
}

function things(model) {
  const parts = [];
  for (const f of model.files || []) for (const part of f.parts || []) parts.push({ file: f.name, part });
  // A thing's own part comes first, then each "Adds to" part, in the files' order.
  parts.sort((a, b) => Number(a.part.addsTo) - Number(b.part.addsTo));
  const out = new Map();
  for (const { file, part } of parts) {
    if (!out.has(part.thing)) {
      out.set(part.thing, { thing: part.thing, file: null, definition: null, actions: [], fields: [], moves: [], states: [], parts: [] });
    }
    const t = out.get(part.thing);
    if (!part.addsTo && !t.file) {
      t.file = file;
      t.definition = part.definition;
    }
    t.parts.push(part);
    for (const k of ['actions', 'fields', 'moves', 'states']) t[k].push(...part[k].map((r) => ({ ...r, _file: file })));
  }
  return out;
}

// The three parts of the decisions file, and the kind of entry each one holds.
const DECISION_PARTS = { open: 'DM', settled: 'DM', 'glossary changes': 'GC' };

// A Glossary change's state, from its Status line: "To raise", "Raised", "Left open on {date}", "Settled in the
// Glossary on {date}", then ". Brought into the data model on {date}" once the data model is in step.
function stateOfEntry(e) {
  if (e.kind === 'DM') return e.section === 'settled' ? 'settled' : 'open';
  const s = (e.fields.Status || '').trim();
  if (/^to raise\b/i.test(s)) return 'to raise';
  if (/^raised\b/i.test(s)) return 'raised';
  if (/^left open\b/i.test(s)) return 'left open';
  if (/^settled\b/i.test(s)) return /\bbrought into the data model on \d{4}-\d{2}-\d{2}\b/i.test(s) ? 'brought in' : 'settled';
  return null;
}

function readDecisions(fileOrText) {
  const text = textOf(fileOrText);
  const title = (text.match(/^#\s+(.+?)\s*$/m) || [])[1] || null;
  const out = { status: statusOf(text), title, open: [], settled: [], glossaryChanges: [], entries: [], inForce: new Map() };
  let section = null;
  let entry = null;
  let field = null;
  let fence = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) { section = md.normalize(h2[1]); entry = null; field = null; return; }
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      entry = null;
      field = null;
      if (!(section in DECISION_PARTS)) return;
      const m = h3[1].match(/^((DM|GC)-(\d+))\s*[—–-]\s*(.*)$/);
      entry = {
        id: m ? m[1] : null, kind: m ? m[2] : null, number: m ? Number(m[3]) : null, question: m ? m[4].trim() : h3[1],
        section, line: i + 1, fields: {}, options: [],
      };
      out.entries.push(entry);
      return;
    }
    if (!entry) return;
    const f = line.match(/^-\s+\*\*(.+?):\*\*\s*(.*)$/);
    if (f) { field = f[1].trim(); entry.fields[field] = f[2].trim(); return; }
    const o = line.match(/^\s+-\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (o && field === 'Options') entry.options.push({ label: o[1].trim().replace(/\.$/, ''), text: o[2].trim() });
  });
  for (const e of out.entries) {
    const rec = e.fields.Recommended || '';
    const at = rec.indexOf(', because ');
    e.recommended = (at < 0 ? rec : rec.slice(0, at)).trim() || null;
    e.reason = at < 0 ? null : rec.slice(at + ', because '.length).replace(/\.$/, '').trim();
    e.chosen = e.fields.Chosen !== undefined ? e.fields.Chosen : null;
    const p = (e.chosen || '').match(/^Proposed:\s*(.+)$/i);
    e.proposed = e.section === 'open' && p ? p[1].trim() : null;
    e.state = stateOfEntry(e);
    const r = e.question.match(/^Replaces ((?:DM|GC)-\d+):/);
    e.replaces = r ? r[1] : null;
    e.replacedBy = null;
    const d = (e.fields['Decided by'] || '').match(/^(.*?),\s*(\d{4}-\d{2}-\d{2})\s*$/);
    e.decidedBy = d ? d[1].trim() : null;
    const settledOn = (e.fields.Status || '').match(/\bon (\d{4}-\d{2}-\d{2})\b/);
    e.date = d ? d[2] : settledOn ? settledOn[1] : null;
    const brought = (e.fields.Status || '').match(/\bBrought into the data model on (\d{4}-\d{2}-\d{2})\b/i);
    e.broughtIn = brought ? brought[1] : null;
    if (e.kind === 'DM') out[e.section === 'settled' ? 'settled' : 'open'].push(e);
    else if (e.kind === 'GC') out.glossaryChanges.push(e);
  }
  for (const e of out.entries) {
    if (!e.id) continue;
    out.inForce.set(e.id, e);
    if (e.replaces) for (const x of out.entries) if (x.id === e.replaces) x.replacedBy = e.id;
  }
  return out;
}

function decisionsOf(project, opts = {}) {
  const file = rp.pathOf(project, 'data-model-decisions', {}, opts);
  const base = { file, rel: rp.relOf('data-model-decisions', { product: project }), name: path.basename(file), exists: fs.existsSync(file) };
  return { ...base, ...readDecisions(base.exists ? rp.readText(file) : '\n') };
}

// The file a decision's Where, or a Glossary change's "Raised from", names first: "lending.md, Loan, title, Limits".
const fileOfWhere = (s) => (String(s || '').match(/^`?([\w.-]+\.md)\b/) || [])[1] || null;

function stillOpen(dec, thingsName) {
  const out = [];
  const asks = (file) => (!file || file === thingsName ? 'things-author' : 'data-model-author');
  for (const e of dec.entries) {
    if (!e.id || dec.inForce.get(e.id) !== e) continue;
    if (e.kind === 'DM' && e.section === 'open') {
      const file = fileOfWhere(e.fields.Where);
      out.push({ entry: e, file, asks: asks(file), waits: e.proposed ? 'answered "I don\'t know yet"' : 'not answered yet' });
    } else if (e.kind === 'GC' && ['to raise', 'raised', 'left open'].includes(e.state)) {
      // A Glossary change raised from a decision, such as "DM-3, at gate 2", takes that decision's file.
      const from = e.fields['Raised from'] || '';
      const dmId = (from.match(/\bDM-\d+\b/) || [])[0];
      const file = fileOfWhere(from) || (dmId && dec.inForce.has(dmId) ? fileOfWhere(dec.inForce.get(dmId).fields.Where) : null);
      out.push({ entry: e, file, asks: asks(file), waits: e.fields.Status });
    }
  }
  return out;
}

module.exports = { load, readThings, readFile, statusOf, cell, typeOf, moveName, actionsAndMoves, things, readDecisions, decisionsOf, fileOfWhere, stillOpen };
