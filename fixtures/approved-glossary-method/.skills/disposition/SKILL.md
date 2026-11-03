---
name: disposition
allowed-tools: Read, Write, Edit, Glob, Grep
description: >-
  Decide and carry out what to do about glossary drift — update the glossary (rename,
  redefine, split, or withdraw a term) or flag a document to fix — with a person approving
  each next best action, every glossary change timestamped and its ripple reported. Use to act on
  what check found, or to change a term directly — e.g. "rename reading order to
  recommended read order", "the definition of source must change", "dispose of these
  check findings". It edits the glossary, not the documents that use a term. Not for
  detecting drift (use check) or building the glossary (use harvest).
---

# disposition — decide and act on glossary drift

Take a drift — a check finding, or a term change asked for directly — decide what to do, gate it, apply the glossary side, and report the ripple. The method lives in `../_shared/glossary/` — **follow those files; do not restate them.**

## Reads
- The drift — check findings, or a term-change request.
- The glossary at `Output/glossary/` — the seven pages, not `deep-dives/`: the term, and every page that uses it. Term absent, or the seven pages absent → stop.
- The method — `../_shared/glossary/method-words.md` (the words every file uses), `../_shared/glossary/otc-run-rules.md` (boundary, gate), `../_shared/glossary/output-formats.md` (the term-change effects, the register, the ripple list), `../_shared/glossary/glossary-assembly-principles.md` (the shape the changed glossary must keep).

## Produces
- The updated glossary — the entry and every place the term appears (kind page, the hierarchy and lookup rows in `terms-and-relationships.md`, links), kept adherent to `../_shared/glossary/glossary-assembly-principles.md`, plus a timestamped register row with its **Retired / overrides**, the earlier word's row in the kind page's Terms replaced or retired over time table, the touched rows of each section's `deep-dives/<section>/<section>-decisions.md` updated, and a ripple list. disposition does not edit the documents that use the term.

## Steps
1. **Restate** the drift and the next best action you propose.
2. **Gate** — write the proposed next best action to the gate log (`../_shared/glossary/output-formats.md`, "The gate log") as an open gate row, present it recommendation-first per `../_shared/glossary/output-formats.md` ("How the gate is answered"), and apply nothing while it is open. The person confirms or overrides; on doubt, clarify before moving. The item goes into the glossary's own `deep-dives/gate-log.md`, in a new `Change - <date>` part, rows numbered `CH-01`, `CH-02` ....
3. **Apply one next best action:**
   - **fix the document** → flag it for the author or a check follow-up; no glossary change.
   - **change the glossary** → rename, redefine, split, withdraw, or merge the entry as `../_shared/glossary/output-formats.md` ("Changing a term") sets out - an earlier word is never deleted but moves to the kind page's Terms replaced or retired over time table (`../_shared/glossary/glossary-assembly-principles.md`, G8) - keeping the deliverable adherent to `../_shared/glossary/glossary-assembly-principles.md` — G6 sentence case, the family/parent grouping, the row schema, and every place the term appears (its kind page, the hierarchy and lookup rows in `terms-and-relationships.md`, cross-links) updated to match. Then run the G6 character sweep and confirm every decision link resolves.
   - **add the term through harvest** → route it to **harvest** as a term request.
4. **Record** — for a glossary change, append a timestamped row to `Output/glossary/decision-register.md`, **Retired / overrides** naming the earlier word and the decision it reverses, and **Gate row** linking to its `CH-` row. Then update every `deep-dives/<section>/<section>-decisions.md` row whose word the change touches, so it shows the new outcome, word, and `D-n` link (`../_shared/glossary/output-formats.md`, "Where each decision is recorded"). The section drafts themselves are not edited.
5. **Report the ripple** — grep the term and its retired forms across the documents; list every file and line by filling `../_shared/glossary/templates/change-ripple.md`, as `../_shared/glossary/output-formats.md` ("The check findings and the ripple list") sets out.

## Must not
Edit the documents that use the term — flag them. Never rename a file or an identifier. Every next best action passes the gate.

## Connects
**check** spots drift; **disposition** acts on it; **harvest** builds and updates the glossary. How the three fit together: `../../skill-orchestration.md`.
