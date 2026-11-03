---
name: harvest
allowed-tools: Read, Write, Edit, Glob, Grep
description: >-
  Build a glossary from a spec, or update an existing one — read the source, agree one
  word per meaning, and write it, with a person deciding at every gate. Use to create,
  build, harvest, or refresh a glossary, shared language, or terminology from
  requirements or discovery sources — e.g. "build the glossary", "harvest the terms from
  these docs", "refresh the glossary now the spec changed". Says up front whether it is a
  new build or a re-run. Not for checking a document against the glossary (use check) or
  acting on drift (use disposition).
---

# harvest — build or update the glossary

Sequence the method and hold the gates. The method lives in `../_shared/glossary/` — **follow those files; do not restate them.**

## Reads
- The source — requirements and/or feature catalog.
- The existing glossary at `Output/glossary/` (the seven pages), if any, and its `deep-dives/`.
- The method — `../_shared/glossary/`, including `../_shared/glossary/method-words.md` (the words every file uses) and `glossary-assembly-principles.md` (it governs the assembled deliverable); the blank output files — `../_shared/glossary/templates/`.

## Produces
- `Output/glossary/` — the reader-facing glossary, seven pages: a `README.md` gateway, `terms-and-relationships.md`, the four kind pages (`object-terms.md` / `role-terms.md` / `step-terms.md` / `states-and-values.md`), and `decision-register.md`. Assembled per `../_shared/glossary/glossary-assembly-principles.md`.
- `Output/glossary/deep-dives/` — how the glossary was reached, kept as its evidence: one folder per section holding `<section>-glossary.md` and `<section>-decisions.md`, plus `glossary-assembly-draft.md` and `gate-log.md` at its root. Shapes in `../_shared/glossary/output-formats.md` ("The deep-dives").

## Steps
1. **Mode.** Look for the seven glossary pages, not for an empty folder, as `../_shared/glossary/output-formats.md` ("What a run finds, and what it does") sets out:
   - no `Output/glossary/` → new build;
   - `deep-dives/` but not the seven pages → resumed build: continue from the `open` rows in `deep-dives/gate-log.md`;
   - all seven pages → re-run.
   State which in one sentence, first.
2. **Sections.** Divide the source as `../_shared/glossary/otc-methodology.md` ("Sections") says, and name them.
3. **Scaffolding.** Before writing anything, show where this run will write — the `Output/glossary/` files and every `deep-dives/` file — as a tree, one file per line, using the layout in `../_shared/glossary/output-formats.md` ("The run root"). **Announce always; stop for a decision only when there is a real fork:**
   - the source splits into more than one glossary → show each glossary's own paths and confirm the split before creating any folder;
   - a re-run would remove a section folder the source no longer has → ask before removing it.
   Otherwise announce the tree and proceed. The paths are the person's to confirm — never invented silently.
4. **Read each section, in order** — follow `../_shared/glossary/lens1-ontology.md`, then `../_shared/glossary/lens2-topology.md`, then `../_shared/glossary/lens3-choreography.md`. Write the draft to `deep-dives/<section>/<section>-glossary.md` (named by the section — never a bare `picture.md`) by filling `../_shared/glossary/templates/section-glossary.md`, as `../_shared/glossary/output-formats.md` ("What the section draft must contain") requires, cased per G6. Write `deep-dives/<section>/<section>-decisions.md` with its one placeholder line.
5. **Assemble and judge.** Join the sections into `deep-dives/glossary-assembly-draft.md` by filling `../_shared/glossary/templates/glossary-assembly-draft.md` as `../_shared/glossary/output-formats.md` ("What the assembly draft must contain") sets out - including a proposed merge wherever the same-meaning test finds several words for one meaning - then apply the rules in `../_shared/glossary/otc-run-rules.md` to the assembly draft.
6. **Gate 1** — write the review to `deep-dives/gate-log.md` by filling `../_shared/glossary/templates/gate-log.md` (`../_shared/glossary/output-formats.md`, "The Gate 1 review" and "The gate log") with every gate row `open` (in a sweep, the assembly agent has already written it), then run the gate as `../_shared/glossary/otc-run-rules.md` sets it, resolving each row to `accepted`, `overridden`, or `answered`. Do not pass Gate 1 while any row is `open`; on a resumed run, continue from the log's open rows rather than re-deriving the gate. The gate log is the only place the decisions are written at this step.
7. **Definitions.** Write each as `../_shared/glossary/lens1-ontology.md` ("Writing a definition") says.
8. **Gate 2** — write the definitions review to the gate log, in its Gate 2 part, with every gate row `open`, then run the gate as `../_shared/glossary/otc-run-rules.md` sets it, resolving each row. Do not pass Gate 2 while any row is `open`.
9. **Write output.** Only once no row in either gate is `open`, in this order:
   - assemble the seven pages in `Output/glossary/` per `../_shared/glossary/glossary-assembly-principles.md` — apply its ground rules (Part A) and each page's Part B rules, filling the blanks in `../_shared/glossary/templates/`; each settled gate row becomes a `decision-register.md` row that links back to it;
   - write each `deep-dives/<section>/<section>-decisions.md` from the register, in the shape `../_shared/glossary/output-formats.md` ("What the section decisions file must contain") sets;
   - update `deep-dives/glossary-assembly-draft.md`: set its status line to "updated after Gate 1 on <date>", and change every proposed merge the person overrode so the draft matches the decision.
   Before finishing, run the casing and character sweep (G6) over the seven pages **and** everything in `deep-dives/`, and confirm every decision link resolves.

## Must not
Follow the boundary in `../_shared/glossary/otc-run-rules.md`: propose, never decide; never invent a meaning or pick a winning word; edit prose only; never rename a file or an identifier.

## Connects
harvest builds the glossary; **check** spots drift in a document; **disposition** acts on drift. How the three fit together: `../../skill-orchestration.md`.
