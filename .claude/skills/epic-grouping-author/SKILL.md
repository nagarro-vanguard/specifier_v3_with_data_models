---
name: epic-grouping-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Groups the Feature catalog's features into EPICs: offers two or three genuinely
  different groupings with pros, cons and a recommendation, writes out the chosen one
  in full with its borderline features, inter-EPIC dependencies, sequence and clashes,
  and proposes which EPICs get an EPIC brief. One gate, "Pick a grouping, settle its
  clashes, confirm the EPIC brief list". In a change, places one new feature, with
  its own gate, "Confirm the placement?". Use once the Feature catalog is accepted,
  for example "group the expense-claims features into EPICs". Not for writing the
  features (use feature-author) or the EPIC register (use epic-author).
---

# epic-grouping-author

> **What this is:** The skill that gives the specifier credible ways to group the features into EPICs, honestly compared, records the one they choose, and settles every clash at one gate.
>
> **What it is not:** The EPIC register, which epic-author copies from the chosen grouping, or the EPIC briefs, which epic-author writes later.
>
> **Who uses it:** `features-and-epics-workflow`, as its second step. A change's net-new path, to place one feature. A specifier, on its own, with the project's name.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. It writes from `../_shared/templates/epic-grouping.md`. How to build, compare and recommend the options is in `references/feature-clustering.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:** the accepted Feature catalog. In a change, also the Change impact report.
- **Writes:**
  - `epics/grouping.md`. It only ever adds to it.
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.ts`
- **Its gate:** "Pick a grouping, settle its clashes, confirm the EPIC brief list." In place-one-feature mode: "Confirm the placement?"
- **Its check:** `check-epic-grouping.ts`

## Steps

### 1. Set up

Run `node tools/scaffold-project.ts --project {project}`. If the Feature catalog isn't accepted, say so and stop.

### 2. The inventory

Copy every feature from the catalog into section 1, one row each, with its name, requirements, priority and what it depends on, as they are.

### 3. The options

Offer two or three options, each on a different strategy from the template's list, built as `references/feature-clustering.md` says. Every feature sits in exactly one EPIC in each option. Each option's cons name its own clashes. Then the comparison, and the recommendation.

### 4. The chosen grouping

Write section 3 out in full for the recommended option, so the specifier sees exactly what they would take:
- the EPIC list and the EPIC definitions: each EPIC's outcome as "As a {persona}, I need {capability}, so that {outcome}", its features split into MVP and Later, its band and its persona
- the borderline features, each with where it is placed, the alternative, and why
- the inter-EPIC dependencies, taken from the features' "Depends on" in the catalog, never made up
- the suggested sequence, with the reason for each place
- the clashes: every first-band feature that depends on a later-band one, and every dependency that runs against the sequence. Each is settled at the gate, never left as an open decision.
- the EPIC brief list, in run order: for each EPIC, yes or no, and why

If the specifier picks another option at the gate, section 3 is written out again for that one, and checked again.

### 5. Raise the questions

Run probing-questions-author on the grouping, write each question's number at its gap, then run `node tools/grade-questions.ts --project {project}`.

### 6. Check

Run `node tools/check-epic-grouping.ts --project {project}`. It finds every clash from the catalog itself, so none can be missed. It also finds each word the Glossary retired, and names the agreed word to use instead. Fix every finding and run it again, until every check passes.

### 7. The gate

Hold the gate exactly as `decision-review-gates.md` says, with probing-questions-author asking each decision in its Ask mode. The order:
- first, the two "For the person" blocks: the check program's, then `grade-questions.ts`'s
- then the questions the grouping raised or builds on, in the order `grade-questions.ts` sets
- then the pick: which grouping, with each option as an answer, and "I don't know yet"
- then each clash in the chosen grouping, one at a time, with its settlements as the answers, such as moving a feature into the first band, or changing the sequence
- then the EPIC brief list, to confirm or change

**Pick a grouping, settle its clashes, confirm the EPIC brief list.** Record each answer straight away, in the Decision record and the Question log. When every decision is made and the check passes, run `node tools/accept.ts --project {project} --document epic-grouping`, then close with `status.ts`.

The EPIC grouping covers the whole product, so after a third "no" the skill offers only "accept it as it is" and "one more round" (`decision-review-gates.md`, rule 11).

## Place one feature, in a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

For a net-new feature a change brings, in this order:
1. Propose where it goes: an existing EPIC or a new one, its place in the run order, and whether it gets an EPIC brief. Write the proposal into section 4, "Placements from changes". Nothing already written is changed.
2. Run `node tools/check-epic-grouping.ts --project {project}`, and fix every finding.
3. Hold this mode's one gate, **Confirm the placement?**, as `../_shared/decision-review-gates.md` says, with probing-questions-author asking each decision in its Ask mode. The order:
   - first, the check program's "For the person" block
   - then the gate's question about the feature, **Where does {feature} go?**, in the shape rule 4 gives: the EPIC you propose, each other EPIC it could join, a new EPIC, and "I don't know yet". Record the decision straight away, and change section 4 if the answer differs from the proposal.
   - last, **Confirm the placement?**
4. When the specifier confirms, run `node tools/accept.ts --project {project} --document epic-grouping`, so the change that brought the feature can close.

## Rules

- **Never invent** features. Group only what the catalog contains.
- **The EPIC name is a short capability phrase**, never an outcome sentence. The outcome is the EPIC's hypothesis, in its definition.
- **100% coverage** — no feature left out of any option.
- **Options must genuinely differ** — a different strategy, not a relabelling.
- **Recommend honestly** — if one option is clearly better, say so, and still show the others.
- **No sliver EPICs. Split into bands only into meaningful increments.** An EPIC is a coherent capability increment, not a lone leftover feature. A capability may be split into an MVP EPIC and a Later one when each half is meaningful. Keep one Mixed EPIC with an MVP spine when the Later part is one or two small features.
- **Borderline features and inter-EPIC dependencies are always delivered** for the chosen grouping, and any two EPICs that depend on each other are called out.
- **The cross-band check.** Every MVP feature that depends on a Later feature is a clash, settled at the gate: the feature it needs moves into the first band, or the sequence changes. Never leave one unsettled.

## Handoff

The chosen grouping feeds `epic-author`, which copies it, field for field, into the EPIC register.
