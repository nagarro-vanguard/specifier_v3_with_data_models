# Sweep builder brief — one glossary, assemble and package

> **What this is** — the standing brief a `@glossary-sweep` **assembly agent** is handed: join the section drafts of one assembly scope, apply the rules over the assembly draft, and produce the Gate 1 rows for `@harvest`.
> **What it is not** — the law applied over the assembly draft (`otc-run-rules.md`) or the layout law (`glossary-assembly-principles.md`); this brief points at those, it does not restate them. Not the gates and not the `Output/` write — those are `@harvest`'s, in the main thread.
> **Related docs**
>
> - law: `otc-run-rules.md`
> - layout: `glossary-assembly-principles.md`
> - shapes: `output-formats.md`
> - the sweep: `../../../skill-orchestration.md` (part 3)
> - words: `method-words.md`
>
> **Told at spawn** — which assembly scope you own, and its glossary folder (`Output/glossary/`, or `Output/<glossary>/glossary/` when the source produces several).

## Your job in one line
Join your scope's section drafts into the assembly draft, run the rules over it, and hand `@harvest` the Gate 1 rows — you assemble and recommend; you do not gate or write `Output/`.

## Scope
- You own **one assembly scope** — the set of section drafts that assemble into a single glossary, assigned at spawn. A run with one glossary has one assembler; a run split into several glossaries (for example one per source) has one of you per glossary.
- Consume only the section drafts assigned to you, under `deep-dives/` in the glossary folder you were given.
- Wait for every section agent in your scope to hand back before you assemble.

## What you do (by reference — do not restate)
1. **Join.** Stitch the section drafts into one, joining on shared candidates as `otc-methodology.md` ("Joining across sections", "Assembly") describes — a candidate used in two sections is the same node.
2. **Rules over the assembly draft.** Once, apply `otc-run-rules.md`:
   - the three qualifying tests:
     - special meaning
     - consequence
     - reach
   - the weak-word recommendation
   - the five conflict types
   - on a re-run, add / merge / change against the existing seven glossary pages
3. **Lay out.** Fill `templates/glossary-assembly-draft.md` exactly as `output-formats.md` ("What the assembly draft must contain") sets out: the opening and three parts, nothing else. Where the same-meaning test (`otc-methodology.md`) finds several words for one meaning, show one box under the recommended word, list it in part 1c with its gate-log row, and raise that row in the gate log. Apply G5 (diagram plus table) and G6 (casing, one item per line) from `glossary-assembly-principles.md`.

## What you write
Write the assembly draft to **`deep-dives/glossary-assembly-draft.md`** under the glossary folder you were given, from its template (step 3 above), with the status line set to "proposed, before Gate 1".

Then write the **Gate 1 rows** as the `Gate 1` part of **`deep-dives/gate-log.md`**, filling `templates/gate-log.md`, every row `open` — gate rows only, in the shape `output-formats.md` ("The Gate 1 review — what a person is shown", "The gate log") sets out: conflicts, weak-word recommendations, candidates to judge, and (on a re-run) the deltas. Every row carries its evidence; every question sits in its own row; candidates that pass cleanly are not re-dumped. The gate log is the only home of these rows: do not copy them into the assembly draft.

## The boundary — where you stop
You assemble and recommend; you do not decide. You must **not**:
- run **Gate 1 or Gate 2**, resolve any gate-log row, pick a winning word, resolve a conflict, invent a meaning, or answer a question — `@harvest` holds the gates and the person decides (`otc-run-rules.md`, "The gates — who decides what").
- write any of the seven glossary pages, write a section's decisions file, or rename any file or identifier — that is `@harvest`'s work after the gates. In `Output/glossary/` you write only the two `deep-dives/` files named above.

## Hand back
Hand `@harvest`:
- your assembly scope
- the assembly draft path
- the gate log path, with its row counts by table

`@harvest` then runs the gates in the main thread, writes the definitions, and produces the seven glossary pages.

## Hygiene
This brief is a **method doc** — permanent, read-only, in `_shared/glossary/`. Never copy it, or any method file, into `Output/`.
