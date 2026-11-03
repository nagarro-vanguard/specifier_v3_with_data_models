# Data model: what we learned, and what changes where

> **What this is:** The lessons from building the data model step for the specifier kit and running it on continuum's Onboarding and Goal, on 2026-10-29 and 2026-10-30: the principles we settled, the mistakes they fix, and every change still to make, file by file.
>
> **What it is not:** The instructions themselves. Those are in `data-model-design.md` and its templates.

## 1. The principles we settled

| # | Principle | What it means in practice |
|---|---|---|
| 1 | **The goal is repeatable stories** | Given a feature, AI writes its stories and tests the same way every time. The data model gives each story the actions and the field rules it needs, and nothing else. |
| 2 | **The Glossary is the one true copy** | What a term is, its kind, definition, values and what it belongs to come only from the Glossary. When the PRD differs, the Glossary wins. When the Glossary is silent or inconsistent, raise a Glossary change; never decide it in the data model. |
| 3 | **Only the BRD, the PRD and the Glossary are sources** | They are all that exists when the data model is written. A data model decision is never a source for another answer. |
| 4 | **Nothing is invented** | Every thing, field, action, value, limit and move is stated in the sources, or plainly follows from them. Anything else is a decision, with options and a recommendation, never an assumption. |
| 5 | **Only Glossary words** | Every term in a file is the Glossary's: "Who" is a Glossary role (Person, Owner, Member, SME, C-Level, Admin, Delivery team), or "the product" when the product does it by itself, never "the team"; Note and Synthesis, never "comments". |
| 6 | **Flow first** | Each thing's actions come from the flow: the BRD, the PRD's end-to-end journey and requirements, and the Glossary's flow (produces, re-checks, unlocks, locks, comes before, reveals, kind of). They cover create, read, update and remove, including browsing and opening. The Glossary's flow should already say, for each step, what must exist before it and who creates it: asked properly, creating things falls out of it, and the data model then covers changing and removing. |
| 7 | **Every Glossary flow row is used** | Every flow or relationship row that involves a family's terms is reflected in its file, including rows that cross families, such as "A goal section is one kind of block". |
| 8 | **Stay within the family** | A family's file covers only its own part of the PRD. A later family adds to an earlier thing in its own file, under "Adds to {Thing}". |
| 9 | **Decide before writing the moves** | Gaps are decided at gate 2; only then is "How it moves" written. |
| 10 | **Product-wide questions first** | A question that affects every family, such as who can act in the MVP, is decided once, at gate 1. |
| 11 | **Glossary changes last** | They are collected as GC-1, GC-2… and raised only once every data model file is accepted, through `glossary-disposition`, which changes the word or sends a new word to `glossary-author`. A Glossary change is not a requirement change, so `requirement-update-workflow` is not used. The data model is then brought back in step with the Glossary. |
| 12 | **Never leave the reader in the dark** | Every gap shows "? ({ID})", a "Decisions to make" table with the recommended answer and why, and a "Next step" line. |
| 13 | **Question; don't blame the sources** | A PRD never holds every answer. The Glossary and the data model are where the questions get asked. A gap the sources leave is a question at the gate, not a fault in the sources or in the method. |
| 14 | **A decision beyond the PRD stays a decision** | When a decision adds behaviour the PRD doesn't have, such as archiving a project, the Glossary takes any new word through `glossary-disposition`, and the FRD carries the behaviour as a rule from that decision. The requirements are not changed. |
| 15 | **Easy to read** | No citations in the data model files; several values in braces, separated by semicolons; positive wording; moves as a one-line picture, a Moves table and a "What each state means" table, with one start; no italic header. |

**Note, 2026-11-02, on principle 9.** You reversed it during the build, when you chose one gate for data-model-author. The whole file, its moves included, is now written before that one gate. Where a move depends on an open decision, it follows the recommended answer. When you pick another answer at the gate, the moves are changed at that gate, before you accept the file. `_shared/data-model-design.md`, step 6 and gate 2, says how. The table above keeps principle 9 as it was first settled.

## 2. The mistakes, and the rule that now prevents each

| Mistake | Where it showed | The rule that prevents it |
|---|---|---|
| Filled gaps with invented numbers, such as "1–100 characters" | the first onboarding draft | 4: nothing is invented |
| Marked answers "(assumed)" | the first onboarding draft | 4, and 12: a gap is a decision, shown with its recommendation |
| Decided between the PRD and the Glossary, making status a separate field | DM-6, later replaced by DM-24 | 2: the Glossary wins |
| Turned two steps into things | DM-2 and DM-3, later replaced by DM-23 | 2: never change a term's kind |
| Put Analysis and later steps into Onboarding | the first onboarding draft | 8: stay within the family |
| Wrote the moves before the decisions | onboarding's first moves | 9: decide first |
| Never covered browsing, opening, or who creates a thing | onboarding and goal | 6: flow first |
| Never read the BRD | the whole run until the end | 3: the BRD is a source |
| Cited data model decisions as if they were sources | the first Actions tables | 3: only the BRD, PRD and Glossary |
| Used "the team", "comments" and "evidence" | goal.md | 5: only Glossary words |
| Missed "A goal section is one kind of block" | goal.md | 7: every flow row is used |
| Routed Glossary changes through `requirement-update-workflow`, as if they changed requirements | step 8 of the design | 11: Glossary changes go to `glossary-disposition` |
| Blamed the sources for the missing create actions, when the slip was not asking what each step needs to exist first | the Actions discussion | 6 and 13: question each step's prerequisites |
| Put continuum examples into the kit's guidance | the design's examples | the kit rule: guidance uses generic examples only |

## 3. What changes, and where

### 3.1 The drafts at the specifier_v3 root

| File | Change | Status |
|---|---|---|
| `data-model-design.md` | Principles 2, 4, 8, 9, 11, 12 and 15 | done |
| `data-model-design.md` | Add the BRD to "What you need" and to the reading order | done |
| `data-model-design.md` | Add an **Actions** step before the fields: action, step, who, rules, built from the BRD, the PRD journey and requirements, and the Glossary flow. It replaces step 4, "Answer the seven questions"; the Actions rows answer them. | done: it is the new step 2, and the fields and rules tables are now steps 3 and 4 |
| `data-model-design.md` | Add principles 5 and 7 to the rules: "Who" is a Glossary role, or "the product" when the product does it by itself; every word is a Glossary word; every Glossary flow row involving the family is used | done |
| `data-model-design.md` | Step 1 reads `terms-and-relationships.md` too, for "kind of" rows that cross families | done |
| `data-model-design.md` | Gate 1 also settles product-wide decisions, such as who can act in the MVP | done |
| `data-model-design.md` | Step 7 checks: every "Who" is a Glossary role or "the product"; every Glossary flow row involving the family is reflected; every thing has its make, find, open, change and remove rows | done |
| `data-model-template.md` | Replace "Managing a {thing}" with the Actions table; add a "kind of {Thing}" line under the definition; update the City library example | done |
| `data-model-things-template.md` | A "Decisions to make" part for product-wide decisions at gate 1, and a "Kind of" line per family | done |
| `data-model-decision-register-template.md` | No change needed | – |
| `things-author/SKILL.md` | Reads the BRD and `terms-and-relationships.md`; raises product-wide decisions at gate 1 | done |
| `data-model-author/SKILL.md` | The Actions step; the BRD as a source; the Glossary-words rule | done: its steps now point to the design's new step numbers, and it runs checks 2 to 11 |
| `data-model-workflow/SKILL.md` | The BRD as an input to both skills | done |
| `data-model-design.md`, `data-model-template.md`, `data-model-author/SKILL.md` | A "Where each answer comes from" table at the end of each data model file, giving each answer's source | added, then removed on 2026-10-30 at the user's request: it mostly repeated the decision register, the PRD and the Glossary. The FRD now names the data model's place, such as "data model — Loan, Extend", and every field goes with the feature that owns the thing's first action (plan decisions 1 and 2, replaced). |

### 3.2 Continuum's output, in `Output/continuum/glossary/data-models/`

On 2026-10-30 this first run was moved to `_data_model_archive/continuum-run-1/`, for a fresh start that follows the updated drafts from things-author on. The rows below record the first run.

The fresh run (run 2) on 2026-10-30: things-author gave the same 45 things in 9 families and the same 4 Glossary changes, so step 1 repeats. One slip in run 1 was fixed: Owner, a Glossary role the product keeps nothing about, is now under "Left out" in Goal; run 1 had left it off. DM-1, the product-wide decision, was settled as "each role acts only in its own work"; that sits against BR-13, "the MVP itself has none [access control]", The user revisited it: DM-2 replaces DM-1 with "any person can do every action", in line with BR-13, so every "Who" is Person and no requirement changes. Then, writing onboarding.md, the PRD's "Roles and permissions" table turned up: only an Admin sets up the project, team and provider (REQ-3.1). DM-1 and DM-2 had been asked without it, a slip: a product-wide decision must quote every source on it, the PRD included. DM-3 replaced DM-2: an Admin sets up the project, its team and its provider; any person does everything else. That leaves BR-13, "the MVP itself has none [access control]", to be corrected through requirement-update-workflow. At gate 2 all 18 Onboarding decisions were settled, 17 as recommended; DM-20 became "never removed; their place on a team is made active or inactive", using the Glossary's Member state, so no Glossary change. The design's "write one at a time" rule was dropped as invented, and "–" is now allowed in Who for an action that is never allowed.

| File | Change | Status |
|---|---|---|
| `goal.md` | Actions tables; Glossary words only; "a kind of Block"; DM-43 settled; GC-7 raised | done; waiting at gate 3 |
| `goal.md` and the register | "Who" can now be "the product": Offer's Who becomes "the product", and GC-7 is withdrawn | to do |
| `goal.md` and the register | "A goal section is one kind of Block" rests on the deep-dive, not the seven Glossary pages: take the line out and raise a Glossary change for Block, or keep it | to decide |
| `continuum-glossary-things.md` | Open the product-wide decision on who can act in the MVP; add the "Kind of" lines | done: DM-44 settled, an Admin sets up the project, its team and its provider, and any Person does everything else; "Gap, one kind of Finding" added; accepted again on 2026-10-30 |
| `continuum-glossary-things.md` | Note that a goal section is a kind of Block | on hold: the seven Glossary pages relate Block to nothing; only the case-driven-output deep-dive says a goal section, domain, summary section, wave and story are kinds of Block. By principle 2 that is a Glossary change, not a line in the things file. |
| `onboarding.md` | Redo with Actions tables and Glossary roles, using DM-44. New gaps to open: who is a new project's Admin before Setup names the team, what the list of projects shows, how a Person first exists | done in run 2. On 2026-11-02 two gaps run 2 missed were settled: DM-21, the person who starts a project becomes its first member, with the Admin role; DM-22, the list shows each project's name and its status. "The team" and "decision" were reworded. GC-5 raised: the Glossary's definitions of Project and Person use the retired words "effort" and "modernization". Accepted on 2026-11-02. |
| `continuum-glossary-decision-register.md` | The decisions those changes open | done: DM-3 (run 2's DM-44), DM-15 to DM-22, and GC-5 |
| Setup's data model file, when it is written | Carry DM-21: add the person who starts a project as its first member, with the Admin role, and ask for their email and their second role, SME or C-Level | to do |

**Note, 2026-11-02, on gate 3.** This table names gate 3, the gate that accepted a data model file after its moves were written. Gate 3 is gone. data-model-author now has one gate, gate 2: it asks the decisions, then accepts the file. The fresh trial in `data-model-stitching-plan.md`, part 8, starts continuum again, so these continuum rows are kept only as a record.

### 3.3 The Glossary step, in the kit

| File | Change | Status |
|---|---|---|
| `.claude/skills/_shared/glossary/lens3-choreography.md` | For each step, ask what must already exist before it starts, and which step creates it, and who. A missing maker becomes a question at the gate. | to do |

### 3.4 The kit, when the drafts move into `.claude/skills/`

The exact edits, file by file, with the four decisions to settle first, are in `data-model-kit-plan.md`. In short, already listed in `data-model-workflow/SKILL.md`, under "Not yet in the kit":
- `data-model-design.md` and its three templates move to `_shared/`
- glossary-author names `data-model-workflow` as its next step
- `features-and-epics-workflow` starts once `data-model-workflow` ends
- frd-author reads the data model files: the rules tables into its Data section, and the Actions rows into its Standard questions
- the step 7 checks become check programs
- `_shared/project-folders.md` lists `glossary/data-models/`
- `glossary-disposition` accepts a term-change request raised from the data model's decision register

## 4. The order to apply them

1. Update `data-model-design.md` and its templates (3.1).
2. Update the three skills to match (3.1).
3. Settle the product-wide decision, who can act in the MVP, at gate 1, and record it.
4. Redo `onboarding.md` in the new shape, and settle its new decisions.
5. Accept `goal.md` and `onboarding.md` at gate 3.
6. Carry on with the remaining families: Setup, Analysis, Target, Summary, Plan, Cross-cutting, Governance.
7. Raise the Glossary changes, GC-1 to GC-7 and any new ones, once every file is accepted, through `glossary-disposition`.
8. Separately, add the prerequisites question to the Glossary's lens 3 (3.3), so the next product's Glossary flow names who creates what.

**Note, 2026-11-02.** Item 5 names gate 3, which is gone: gate 2 now accepts each file. Item 8 is still open. It is item 11 of "Left for later", in `data-model-stitching-plan.md`, part 10.
