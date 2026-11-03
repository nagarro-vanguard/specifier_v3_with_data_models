# Sweep reader brief — one section, read only

> **What this is** — the standing brief a `@glossary-sweep` **section agent** is handed: read one assigned section with the three lenses and write its draft. One agent, one section, run in parallel with the others.
> **What it is not** — the method (the lenses in `lens1-ontology.md` / `lens2-topology.md` / `lens3-choreography.md`); this brief points at those, it does not restate them. Not the judgment over the assembly draft and not the gates — neither is a section agent's job.
> **Related docs**
>
> - method:
>   - `lens1-ontology.md`
>   - `lens2-topology.md`
>   - `lens3-choreography.md`
> - shapes: `output-formats.md`
> - the sweep: `../../../skill-orchestration.md` (part 3)
> - words: `method-words.md`
>
> **Told at spawn** — which one section you own, and the glossary folder to write under (`Output/glossary/`, or `Output/<glossary>/glossary/` when the source produces several).

## Your job in one line
Run the three lenses over your one section and write its draft — nothing judged across sections, nothing gated.

## Scope
- You own **exactly one section**, named at spawn. Read only that section of the source.
- You do **not** read or wait on other sections; the join happens later, at assembly.
- The sections were already fixed by the sweep from the source's own structure (`otc-methodology.md`, "Sections"). You do not re-section.

## Method to follow (by reference — do not restate)
Run the lenses in order, applying each lens's own inline rules as you go:
1. `lens1-ontology.md` — find the candidates in your section; four-kinds keep and drop-list applied inline.
2. `lens2-topology.md` — arrange them into a tree (`contains`, `kind of`, `reveals`); the no-phrase-no-relationship rule applied inline.
3. `lens3-choreography.md` — animate the tree with states and flow relationships; the no-phrase-no-relationship rule applied inline.

On a re-run, mark each candidate `add` or `no change` against the existing seven glossary pages as `lens1-ontology.md` says — but do **not** settle the final add / merge / change; that is settled over the assembly draft.

## What you write
Write your draft to **`deep-dives/<section>/<section>-glossary.md`** under the glossary folder you were given — named by your section, never a bare `picture.md` — by filling **`templates/section-glossary.md`**, exactly as `output-formats.md` ("What the section draft must contain") requires:

| Part of the draft | Filled from |
|---|---|
| 1. The candidates found | `lens1-ontology.md`: the candidate tables, by kind |
| 2. How they fit together | `lens2-topology.md`: the tree, the picture, the level table, the lookup, and every relationship with its quote |
| 3. How they move | `lens3-choreography.md`: the states, the flow step by step, every flow relationship with its quote, and the picture |
| 4. Conflicts noticed in this section | the conflicts visible **within your section**, for the assembler to weigh across sections |
| 5. Words dropped | the phrases you dropped, with the DROP-list reason |

No narration beyond the explainers the template asks for — the tables, trees and pictures are the content. A draft missing any part is incomplete. Candidates are cased per G6 (`glossary-assembly-principles.md`) in tables, trees and picture labels alike; quotes stay exactly as the source has them. Create `deep-dives/<section>/<section>-decisions.md` from `templates/section-decisions.md`, holding only its placeholder line — decisions are written there once the gates are passed, not by you.

## The boundary — where you stop
You are read-only and ungated. You must **not**:
- run the rules over the assembly draft (`otc-run-rules.md`) — the three tests, the weak-word recommendation, conflict classification, and add / merge / change all need every section in view, so they belong to assembly, not to you.
- pick a winning word, invent a meaning, or answer a question — the method proposes, the person disposes (`otc-run-rules.md`, "The boundary — recommend, never decide").
- rename a file or an identifier, or write anything in `Output/glossary/` outside your own `deep-dives/<section>/` folder.

## Hand back
Report to the assembler:
- your section name
- the draft path
- a candidate count by kind
- the local conflict flags you raised

Then stop.

## Hygiene
This brief is a **method doc** — permanent, read-only, in `_shared/glossary/`. Never copy it, or any method file, into `Output/`.
