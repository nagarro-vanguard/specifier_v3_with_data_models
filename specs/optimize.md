# Optimize: specs

**Frozen:** this file is a record of the design. It was last changed on 2026-10-27 and is not updated any more. What was actually built, and every change made after the design, is in [build-log.md](../build-log.md).

**What this doc is:** every item where an existing piece already does the job, and we change or remove parts of it, and may add.

**How to read it:**
- Every item has the same 11 parts. Part 4 lists the changes under four headings: **Keep**, **Remove**, **Change** and **Add**.
- Each change names the decision behind it. "Row N" is row N on the [Old vs New Workflow](https://claude.ai/artifact/XpiJqPk4DQTrRhqjqKwKKW) page.
- "Copied" means the old file is copied into `specifier_v3/` and edited there. The original is never touched.

**Two changes that apply to every skill here, so they aren't repeated per item:**
- **Load first.** Pointers to the old shared files are replaced:
  - `_shared/system-prompt.md` becomes `_shared/conventions.md` (NET-NEW item 1)
  - `_shared/standard-formats.md` becomes the templates in this doc
  - `_shared/quality-characteristics.md` becomes item 1 below
- **Saving and handoff.** Every "Save to Output/…" path becomes the path in `project-folders.md`. Every closing "HUMAN ACTION REQUIRED" line becomes the skill's one gate, run by `decision-review-gates.md` (EXTEND item 2).

**Status:** draft for your review, 2026-10-19. Updated 2026-10-21 for the Question log, the decision review gates and glossary decisions written once.

## Summary

Every item in this doc, one row each, in spec order. Read across a row to see what it is, what it takes in and gives out, and where it sits in the flow. The full spec for each follows below.

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| `quality-characteristics.md` | The ten quality checks, Q1 to Q10, that skills name for their output. | • none | • Q1 to Q10 | • read by the skills that name a Q code | none | Optimize<br>phase 1<br>[OPTIMIZE 1](optimize.md) |
| Discovery brief | The shape of the Discovery brief:<br>• the sources and the order of authority<br>• every topic compared<br>• clashes<br>• what is assumed<br>• risks<br>• your decisions<br>Its questions are in the Question log. | • none | • the Discovery brief's sections | • filled by `discovery-author`<br>• checked by `check-discovery-brief.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 2](optimize.md) |
| BRD | The shape of the BRD, without a journey or NFRs. | • none | • the BRD's sections | • filled by `brd-author`<br>• checked by `check-brd.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 3](optimize.md) |
| PRD | The shape of the PRD:<br>• requirements, word for word, with sources<br>• personas<br>• the journey<br>• NFRs<br>• transition requirements | • none | • the PRD's sections | • filled by `prd-author`<br>• checked by `check-prd.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 4](optimize.md) |
| Feature catalog | The shape of the Feature catalog, with capabilities and "Done when" pieces. | • none | • the catalog's sections and columns | • filled by `feature-author`<br>• checked by `check-features.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 5](optimize.md) |
| EPIC grouping | The shape of the EPIC grouping:<br>• the options<br>• the pick<br>• clashes settled<br>• the EPIC brief list | • none | • the EPIC grouping's sections | • filled by `epic-grouping-author`<br>• checked by `check-epic-grouping.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 6](optimize.md) |
| EPIC register | The shape of the EPIC register: one row per EPIC, and the run order. | • none | • the register's table | • filled by `epic-author`<br>• checked by `check-register.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 7](optimize.md) |
| EPIC brief | The shape of an EPIC brief, with the NFR IDs that apply. | • none | • the detail's eight sections | • filled by `epic-author`<br>• checked by `check-epic-brief.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 8](optimize.md) |
| FRD | The shape of an FRD: its rules, flow and data for one capability, with its decisions and status. | • none | • the FRD's sections | • filled by `frd-author`<br>• checked by `check-frd.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 9](optimize.md) |
| Story list | The shape of an EPIC's Story list: its stories in order, with their status. | • none | • the list's sections | • filled by the story skills<br>• checked by `check-stories.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 10](optimize.md) |
| Story | The shape of one story: the statement, grooming, and behaviour-only acceptance criteria. | • none | • the Story's sections | • filled by the story skills<br>• checked by `check-stories.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 11](optimize.md) |
| `discovery-author` | The skill that starts every product. It lists the sources, settles which one wins when they disagree, compares every topic, and sends what is missing to the Question log. | • Sources | • Discovery brief<br>• Question log | • first step of `requirements-workflow`<br>• comes before `brd-author` | Accept the Discovery brief? | Optimize<br>phase 2<br>[OPTIMIZE 12](optimize.md) |
| `brd-author` | Writes the BRD: why the product is needed, its objectives, scope and business requirements. When nothing gives an objective or business requirement, it suggests one, marked Proposed. | • Sources<br>• Discovery brief<br>• in a change: the Change impact report | • BRD<br>• Question log | • comes after `discovery-author`<br>• comes before `prd-author` | Accept the BRD? | Optimize<br>phase 2<br>[OPTIMIZE 13](optimize.md) |
| `prd-author` | Records what the client asked for, word for word, each with its source. It also holds:<br>• the personas<br>• the end-to-end journey<br>• the NFRs<br>• the transition requirements | • Sources<br>• Discovery brief<br>• BRD<br>• in a change: the Change impact report and your files | • PRD<br>• Question log | • comes after `brd-author`<br>• comes before `glossary-author` | Accept the PRD? | Optimize<br>phase 2<br>[OPTIMIZE 14](optimize.md) |
| `glossary-author` | Agrees the words the product uses and their definitions, or adds only the new words a change brings. | • BRD<br>• PRD<br>• in a change: the Change impact report | • Glossary<br>• Glossary gate log | • comes after `prd-author`<br>• comes before `feature-author`<br>• runs `fill-also-written-as.cjs` before Gate 2<br>• `build-glossary-records.cjs` and `build-retired-words-tables.cjs` run after it | Gate 1: are the words settled?<br>Gate 2: are the definitions settled? | Optimize<br>phase 3<br>[OPTIMIZE 15](optimize.md) |
| `glossary-disposition` | Settles a glossary mismatch: fix the document, change the Glossary, or add a new word. | • Check findings, or a word to change<br>• Glossary | • Glossary<br>• Glossary gate log | • step 4 of `requirement-update-workflow`, only when the Check findings hold a mismatch<br>• first in the Extend and Update paths when a change renames an agreed word<br>• runs on its own when you give it a word to change<br>• `build-glossary-records.cjs` and `build-retired-words-tables.cjs` run after it | How should each mismatched word be settled? | Optimize<br>phase 3<br>[OPTIMIZE 16](optimize.md) |
| glossary method, record-keeping files | The parts of the glossary method that say where decisions are recorded: only in the gate log. Every other place is filled from it by a program. | • none | • the record-keeping rules | • read by the Glossary package skills | none | Optimize<br>phase 3<br>[OPTIMIZE 17](optimize.md) |
| `feature-author` | Turns the PRD's requirements into features. Each feature gets:<br>• a priority<br>• a capability, which says which FRD it goes in<br>• its "Done when", cut into pieces | • PRD<br>• Glossary, looked up<br>• BRD, looked up | • Feature catalog<br>• Question log | • first step of `features-and-epics-workflow`<br>• comes after `glossary-author`<br>• comes before `epic-grouping-author` | Accept the Feature catalog? | Optimize<br>phase 4<br>[OPTIMIZE 18](optimize.md) |
| `epic-grouping-author` | Offers 2 to 3 ways to group the features into EPICs, settles any clashes, and proposes which EPICs get an EPIC brief. | • Feature catalog | • EPIC grouping<br>• Question log | • comes after `feature-author`<br>• comes before `epic-author` | Pick a grouping, settle its clashes, confirm the EPIC brief list | Optimize<br>phase 4<br>[OPTIMIZE 19](optimize.md) |
| `epic-author` | Copies the chosen grouping into the EPIC register, and writes an EPIC brief for each EPIC on the list. | • EPIC grouping, for the register<br>• EPIC register, BRD, PRD and Feature catalog, for a brief | • EPIC register<br>• EPIC brief<br>• Question log, for a brief | • register mode: comes after `epic-grouping-author`, checked by `check-register.cjs`<br>• brief mode: the first story step of a listed EPIC, before `story-drafter` | register mode: none<br>brief mode: Accept the EPIC brief? | Optimize<br>phase 4 and 6<br>[OPTIMIZE 20](optimize.md) |
| `frd-author` | Writes one FRD, whole, for one capability: everything the stories will need about its rules, flow and data. | • Feature catalog<br>• PRD, looked up<br>• Glossary, looked up<br>• Question log, looked up | • FRD<br>• Question log | • comes after `route-next-capability.cjs`<br>• every FRD comes before any story | Accept the FRD? The Must answer questions it builds on come first, one at a time. While one is open, it can't be accepted: answer it, or park the FRD. | Optimize<br>phase 5<br>[OPTIMIZE 21](optimize.md) |
| `check-frd.cjs` | Checks an FRD, including that its features and pieces match the Feature catalog, and that no Must answer question it builds on is open at acceptance. | • FRD<br>• Feature catalog<br>• PRD<br>• Question log | • pass, or the problems found | • before `frd-author`'s gate | none | Optimize<br>phase 5<br>[OPTIMIZE 22](optimize.md) |
| `story-drafter` | Splits one EPIC into stories along the FRD flows, and sets their order. | • the EPIC's Register row<br>• FRDs<br>• design, if any<br>• Glossary, looked up<br>• BRD, looked up<br>• PRD, looked up | • Story list<br>• story shells<br>• Question log | • comes after the EPIC brief, or the brief-list route<br>• comes before `story-groomer` | Approve the split? All stories together. | Optimize<br>phase 6<br>[OPTIMIZE 23](optimize.md) |
| `story-groomer` | Fills each story of the EPIC from documents already decided:<br>• its scope<br>• the rules, quoted from the FRD<br>• the FRD flow steps it covers | • Story list<br>• story shells<br>• FRDs, looked up<br>• Feature catalog, looked up<br>• BRD, looked up<br>• EPIC brief, looked up<br>• Glossary, looked up | • Stories, groomed<br>• Question log | • comes after `story-drafter`<br>• comes before `ac-author` | Accept the grooming? All stories together. | Optimize<br>phase 6<br>[OPTIMIZE 24](optimize.md) |
| `ac-author` | Writes behaviour-only acceptance criteria, each naming the FRD rules it proves, and marks the stories ready. | • Stories<br>• FRDs, looked up<br>• Glossary, looked up | • Stories, with acceptance criteria<br>• ready marks in the Story list<br>• Question log | • comes after `story-groomer`<br>• `coverage-check.cjs` runs before its gate<br>• the last step of an EPIC | Accept the criteria? This marks the stories ready. While a Must answer question raised in them is open, they can't be. | Optimize<br>phase 6<br>[OPTIMIZE 25](optimize.md) |

---

## Phase 1: shared file and templates

### 1. `quality-characteristics.md`

1. **Label and kind:** Optimize. A shared file, `.claude/skills/_shared/quality-characteristics.md`.
2. **Its one job:** define the ten quality characteristics, Q1 to Q10, that skills name for their output.
3. **What exists today:** `.claude/skills/_shared/quality-characteristics.md`, 45 lines, with two sections:
   - "The ten characteristics": a table of code, characteristic, meaning and test
   - "How layers use this"
4. **Changes:**
   - **Keep:** the table of ten characteristics, word for word. At the Phase 1 gate, the text around it was rewritten in plain words, and a short table now explains the words the table uses: field contract, the ⊆ test and the word-flag threshold.
   - **Remove:** the "rubric" bullet in "How layers use this". Evals are still to decide.
   - **Change:**
     - "layer" becomes "skill" throughout.
     - Q7 and Q9 point to the business-language and nothing-invented sections of `conventions.md`, instead of the old G-rules.
   - **Add:** nothing.
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** reviewed at the Phase 1 gate.
9. **On its own:** read by skills.
10. **Done when:** every skill that names a Q code finds it here.
11. **Open points:** none.

### 2. Discovery brief template

1. **Label and kind:** Optimize. A template, `_shared/templates/discovery-brief.md`, with a worked example in `examples/discovery-brief.md`.
2. **Its one job:** fix the shape of the Discovery brief.
3. **What exists today:** `.claude/skills/probe-requirements/`:
   - SKILL.md, "Discovery Brief (output structure)": Known, Assumed, Missing (prioritized questions), Risks and edge cases, Recommended next
   - `references/probe-dimensions.md`: the nine areas questions come from
4. **Changes:**
   - **Keep:**
     - Known, now compared topic by topic across every file
     - Assumed, each with why we think so
     - Risks and edge cases
     - the nine areas, named in the template so a reader knows them
   - **Remove:**
     - "Recommended next". The next step is always brd-author.
     - **Removed 2026-10-21:** Missing, the list of prioritized questions, with its columns for whether a question held up the gate and where it was answered. Each question moves to the Question log (NET-NEW 50), drafted and rated by probing-questions-author (EXTEND 4).
   - **Add,** in this order, after the opening blocks:
     1. **Sources:** every file in `sources/`, one table per folder, with an "at a glance" count. Each file says whether it is used: not when it is the same as another file, an older version, or out of scope. The file facts come from `list-sources.cjs` (NET-NEW 47), so hundreds of files are handled without any being missed.
     2. **Which kind of source wins:** an order of authority between kinds of document, proposed by the skill and settled once at the gate. A newer version of the same document always replaces the older one.
     3. **Known, topic by topic:** every topic any file speaks about, plus every topic in the nine areas, compared across all used files, with a verdict: Agree, One source, Differ or Silent. A clash can't be missed, because every topic is compared.
     4. **Clashes, and how each is settled:** every Differ topic, with its kind (contradiction, different value or different scope), settled by the order of authority or by your decision.
     5. Assumed
     6. Risks and edge cases
     7. a Decision record, then a Check record
   - **Changed after the Phase 1 gate, at your request:** examples are of a made-up product, never a client's material, and the clash table no longer depends on someone noticing a clash.
   - **Changed 2026-10-21, with the Question log:**
     - a Silent topic in section 3 names its question in the Question log
     - section 4, Clashes, gains a Question column, for a clash the order of authority can't settle, or that you want to settle yourself
     - each assumption in section 5 names its question
     - Risks and edge cases is now section 6
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-discovery-brief.cjs` checks this shape.
9. **On its own:** used by `discovery-author`.
10. **Done when:** the Discovery brief for your new requirement fills every section, and its example reads as a finished Brief.
11. **Open points:** none.
12. **Changed while building** (2026-10-22, a call made while building, listed in MASTER-PLAN section 8): the Placeholders row for "Used" says that a file discovery-author proposes as out of scope reads "No: out of scope, to be decided at the gate" until the gate settles it, then names the decision. Without it, the check before the gate would fail a decision not yet made.

### 3. BRD template

1. **Label and kind:** Optimize. A template, `_shared/templates/brd.md`.
2. **Its one job:** fix the shape of the BRD.
3. **What exists today:** inside `.claude/skills/write-brd/SKILL.md`:
   - "Phase 2 — The BRD", with nine sections:
     1. Executive Summary
     2. Background and Current State
     3. Objectives and Success Metrics
     4. Scope, Assumptions, Dependencies
     5. Business Requirements
     6. Non-Functional Requirements
     7. Risks, Constraints, Mitigations
     8. User Journey
     9. Acceptance and Exit Criteria
   - "Deliverables to include":
     - Problem or Opportunity statement
     - RACI-light
     - KPI table
     - Traceability mini-map
4. **Changes:**
   - **Keep,** renumbered 1 to 7:
     1. Executive summary, with the Problem or Opportunity statement and its classification
     2. Background and current state
     3. Objectives and success metrics, with the KPI table: KPI, Baseline, Target, Measurement method, Measurement cadence, Owner, Confidence
     4. Scope in and out, assumptions, dependencies
     5. Business requirements, BR-01 onward
     6. Risks, constraints and mitigations
     7. Release criteria
     - and the Traceability mini-map, from objectives to business requirements to release criteria
   - **Remove:**
     - section 6, Non-Functional Requirements (Row 42)
     - section 8, User Journey (Row 11)
     - RACI-light: only the specifiers decide (Row 2)
   - **Change:** "Document information" keeps version and status only.
   - **Add:**
     - the Lineage block, first
     - a decision record, last
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
     - a Check record section, last, for the check program's "For the file" block (your answer A at the Phase 1 gate, 2026-10-19)
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
   - **Changed 2026-10-21, with the Question log:**
     - every gap names its question in the Question log, such as "TBD, question 7"
     - every objective, assumption, business requirement, risk and release criterion says where it came from, in one of four ways:
       - per a file
       - per a decision
       - Proposed (needs confirmation), with its question
       - TBD, with its question
     - each KPI cell states its own origin
     - Risks gain a Source column
     - objectives and business requirements may be Proposed: when nothing gives one, the skill suggests it, for you to decide at the gate (`conventions.md`, "Ask, don't assume")
     - the example shows one line of each origin, with a key in its Example note
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-brd.cjs` checks this shape.
9. **On its own:** used by `brd-author`.
10. **Done when:** the MCP BRD fills every section.
11. **Open points:** none.

### 4. PRD template

1. **Label and kind:** Optimize. A template, `_shared/templates/prd.md`.
2. **Its one job:** fix the shape of the PRD.
3. **What exists today:** inside `.claude/skills/write-prd/SKILL.md`, "The document (sections)":
   1. Document Control
   2. Product Overview
   3. Personas and Roles
   4. Functional Requirements: FR ID, requirement, traces to, priority, status, grouped by capability
   5. Business Rules and Validations
   6. Data Requirements
   7. Key User Flows
   8. NFRs: evidenced and recommended
   9. Dependencies and Assumptions
   10. Traceability Matrix
   11. Open Questions
4. **Changes:**
   - **Keep:**
     - 1 Document control
     - 2 Product overview
     - 3 Personas and roles, with the Roles and Permissions grid
     - 9 Dependencies and assumptions
     - 10 Traceability matrix, from BR to requirement, with Covered, Partial or Gap
   - **Remove:**
     - **Removed 2026-10-21:** section 11, Open questions. Every question now lives in the Question log (NET-NEW 50), and each gap names its question, such as "Proposed (needs confirmation), question 4".
     - the priority and status columns (Row 10)
     - grouping by capability (Row 10)
     - section 5, Business rules and validations. A rule the client states stays in section 4, word for word, under the source's own heading; decided rules live in the FRDs. (Your decision of 2026-10-19: "A")
     - section 6, Data requirements. Data lives in each FRD's Data section, and the objects and states in the Glossary. (Same decision)
   - **Change:**
     - section 4 becomes **"Requirements, word for word"**, with columns: ID, Requirement as written, Source (document, version and place), Traces to (BR). Requirements keep the source's own order and section headings. When there's no requirements document, the source is the Discovery brief answer or the BR it came from. (Rows 10, 43)
     - section 7 becomes **"The end-to-end journey"**: one numbered journey across capabilities, with the requirement IDs at each step (Row 11)
     - section 8, NFRs, keeps the evidenced and recommended split and confidence tags, and gives each NFR an ID, NFR-1 onward (Row 42)
   - **Add:**
     - the Lineage block, first
     - **"Transition requirements"**: ID, Requirement, Source, Needs building? yes or no. A "no" is checked against the BRD's release criteria. (Row 12)
     - a decision record, last
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
     - a Check record section, last, for the check program's "For the file" block (your answer A at the Phase 1 gate, 2026-10-19)
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-prd.cjs` checks this shape.
9. **On its own:** used by `prd-author`.
10. **Done when:** the MCP PRD fills every section.
11. **Open points:** none. Sections 5 and 6 are decided: both are dropped (see Remove above).

### 5. Feature catalog template

1. **Label and kind:** Optimize. A template, `_shared/templates/feature-catalog.md`.
2. **Its one job:** fix the shape of the Feature catalog.
3. **What exists today:**
   - `.claude/skills/define-features/SKILL.md`, "The catalog (output)":
     1. Title, Lineage and Catalog control
     2. the catalog, in one sub-table per source category, with columns: Feature ID, Feature, Description, Done when, Covers, Priority, Basis, Depends on, Notes
     3. Coverage check
     4. Open Questions
   - its `references/feature-catalog.md`: the field contract and rules FR-1 to FR-5
   - `_shared/standard-formats.md`: "Prioritization basis (vocabulary)"
4. **Changes:**
   - **Keep:**
     - the first three sections and every column
     - the Prioritization basis list, copied in here
   - **Remove:** section 4, Open Questions, removed 2026-10-21. Every question now lives in the Question log (NET-NEW 50), and each gap names its question.
   - **Change:** all wording is in the Glossary's agreed words. (Row 13)
   - **Add:**
     - a **Capability** column: which FRD the feature goes in (Row 16)
     - a **"Done when" pieces** table: Piece ID (F-nn.dwN), Piece (quoted from the Done when) (Row 16)
     - a decision record, last
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
     - a Check record section, last, for the check program's "For the file" block (your answer A at the Phase 1 gate, 2026-10-19)
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-features.cjs` checks this shape.
9. **On its own:** used by `feature-author`.
10. **Done when:** the MCP catalog fills every column, with capabilities and pieces for all 81 features.
11. **Open points:** none.

### 6. EPIC grouping template

1. **Label and kind:** Optimize. A template, `_shared/templates/epic-grouping.md`.
2. **Its one job:** fix the shape of the EPIC grouping.
3. **What exists today:**
   - `.claude/skills/cluster-features/references/feature-clustering.md`, "FINAL OUTPUT — document shape (append-only)":
     - Header
     - Step 1: the Feature Inventory
     - Step 2: the options and the AI recommendation
     - the finalized EPIC grouping, with its EPIC definitions, borderline features, inter-EPIC dependencies and suggested sequence
   - its SKILL.md "Output contract": name, outcome, features, band, persona, dependencies
4. **Changes:**
   - **Keep:** every section and field above. It stays append-only.
   - **Remove:** "open decisions for generate-epics". Clashes are settled here instead. (Row 18)
   - **Change:** nothing else.
   - **Add:**
     - **"Clashes, and how you settled them"**: Clash, Feature, Depends on, Settlement, Decided at (Row 17)
     - **"EPIC brief list, in run order"**: Order, EPIC, Detail (yes or no), Reason (Row 17)
     - **"Placements from changes"**: appended entries, one per net-new feature placed later (Row 35)
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
     - a Check record section, last, for the check program's "For the file" block (your answer A at the Phase 1 gate, 2026-10-19)
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-epic-grouping.cjs` checks this shape.
9. **On its own:** used by `epic-grouping-author`.
10. **Done when:** the MCP EPIC grouping records the F-23 and F-52 clashes as settled.
11. **Open points:** none.

### 7. EPIC register template

1. **Label and kind:** Optimize. A template, `_shared/templates/epic-register.md`.
2. **Its one job:** fix the shape of the EPIC register.
3. **What exists today:** `_shared/standard-formats.md`, "EPIC Register (schema)", with six blocks:
   1. Header
   2. the EPICs table: EPIC, Name, Outcome, Features, Band, Persona, Depends on, each with its provenance
   3. Capability roll-up, optional
   4. MVP build order
   5. Open decisions
   6. Gate line
4. **Changes:**
   - **Keep:**
     - the EPICs table, with every column and its provenance rule
     - the build order, now called "run order"
   - **Remove:**
     - block 5, Open decisions (Row 18)
     - block 6, Gate line: there's no gate (Row 18)
     - block 3, the optional roll-up
     - the manifest note: the Traceability map replaces it (Row 28)
   - **Change:** the header's status becomes "Copy checked on date".
   - **Add:** the Lineage block, first.
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-register.cjs`.
9. **On its own:** used by `epic-author`.
10. **Done when:** the MCP Register matches the MCP EPIC grouping field for field.
11. **Open points:** none.

### 8. EPIC brief template

1. **Label and kind:** Optimize. A template, `_shared/templates/epic-brief.md`.
2. **Its one job:** fix the shape of an EPIC brief.
3. **What exists today:** `_shared/standard-formats.md`, "EPIC detail file (schema)", and `generate-epics/references/epic-generation.md`. They have eight sections:
   1. Description
   2. Business Value
   3. Success or Fitness Criteria
   4. Scope
   5. Features
   6. Dependencies
   7. Non-Functional Requirements
   8. References
4. **Changes:**
   - **Keep:** sections 1 to 6 and 8, with their provenance rules.
   - **Remove:** section 7's own wording, both evidenced and recommended. (Row 42)
   - **Change:** section 7 becomes **"NFRs that apply"**: a list of NFR IDs from the PRD, and nothing else. (Row 42)
   - **Add:**
     - the Lineage block, first
     - a decision record, last
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
     - a Check record section, last, for the check program's "For the file" block (your answer A at the Phase 1 gate, 2026-10-19)
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-epic-brief.cjs`.
9. **On its own:** used by `epic-author`.
10. **Done when:** an MCP EPIC brief holds NFR IDs only.
11. **Open points:** none.

### 9. FRD template

1. **Label and kind:** Optimize. A template, `_shared/templates/frd.md`.
2. **Its one job:** fix the shape of an FRD.
3. **What exists today:** `frd_experiment/frd-author/references/frd-template.md`, 136 lines. Its sections are marked "Step 1" or "Step 2":
   - Features covered
   - Gates
   - Actors
   - Rules
   - Coverage
   - Flow
   - Data
   - Standard questions
   - Open questions
   - Decision record
   - Check record
4. **Changes:**
   - **Keep:** every section, in order, apart from Open questions.
   - **Remove:**
     - the "Step 1" and "Step 2" markers, and the instructions tied to them (Row 16)
     - the scope decisions that opened the decision record (Row 16)
     - **Removed 2026-10-21:** Open questions. The FRD's questions go to the Question log (NET-NEW 50).
   - **Change:**
     - "Features covered" and Coverage's "Done when" pieces are copied from the Feature catalog, not decided here. (Row 16)
     - **Changed 2026-10-21:** a "Done when" piece that waits on an open question names it in Coverage's "Proved by", such as "question 12", until it is answered
     - **Changed 2026-10-21:** a Standard question's "Answered by" names a question in the Question log by its number, while it is open
   - **Add:** a status line under the title: drafted, accepted or parked. (Row 37)
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-frd.cjs` (item 22).
9. **On its own:** used by `frd-author`.
10. **Done when:** the MCP Team & roles FRD fills every section without a scope gate.
11. **Open points:** none.

### 10. Story list template

1. **Label and kind:** Optimize. A template, `_shared/templates/story-list.md`.
2. **Its one job:** fix the shape of an EPIC's Story list.
3. **What exists today:** `_shared/standard-formats.md`, "Story folder, index & file (schema)", "Index layout":
   1. Lineage
   2. Header
   3. Stories: number, Story, Statement, Req ID, Feature ID, Status
   4. Out of scope / routed
   5. Coverage
   6. Open Questions
   - Also a batch navigation index, `epics-list-draft.md`, across EPICs.
4. **Changes:**
   - **Keep:** the first five sections and their columns.
   - **Remove:**
     - the batch navigation index. `status.cjs` shows every EPIC's state. (NET-NEW item 11)
     - **Removed 2026-10-21:** section 6, Open Questions. Every question now lives in the Question log (NET-NEW 50), and each gap names its question.
   - **Change:**
     - the file is `epics/{epic}/story-list.md`
     - the number column is the order within the EPIC (Row 23)
     - the story statuses are drafted, groomed and ready (Row 26)
   - **Add:**
     - an EPIC status line: in progress, ready or parked (Rows 26, 37)
     - a decision record, last
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
     - a Check record section, last, for the check program's "For the file" block (your answer A at the Phase 1 gate, 2026-10-19)
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-stories.cjs`.
9. **On its own:** used by the three story skills.
10. **Done when:** the MCP EPIC-003 index holds 12 stories in order.
11. **Open points:** none.

### 11. Story template

1. **Label and kind:** Optimize. A template, `_shared/templates/story.md`.
2. **Its one job:** fix the shape of a Story.
3. **What exists today:** `_shared/standard-formats.md`:
   - "Story file layout": the Lineage block, a metadata table (Status, Req ID, Feature ID, EPIC, Work Item ID), then Story, Grooming and Acceptance Criteria
   - the table templates for grooming: dependency, roles grid, scope, key rules, user flow, sizing alert
   - the groom-stories and write-acceptance-criteria references set what goes under Grooming and Acceptance Criteria
4. **Changes:**
   - **Keep:**
     - the Lineage block
     - the metadata table
     - the Story section
     - the scope table
     - the roles grid, filled from the FRD's actors
     - the dependency table, proved from the FRD gates and the register
     - the sizing alert
   - **Remove:**
     - the user flow table (Row 11)
     - the UI and System scenario sections (Row 24)
   - **Change:**
     - the key rules table becomes **"Rules"**: FRD rule ID and the rule, quoted (Row 24)
     - metrics traceability points to the EPIC brief's fitness criteria, when an EPIC brief exists
     - Acceptance Criteria has one category, **Behaviour**. Each scenario names the rule IDs it proves. (Row 24)
     - the story statuses are drafted, groomed and ready (Row 26)
     - **Changed 2026-10-21:** the sizing alert no longer points to "Open questions". The ways to split the story are raised as a question in the Question log.
   - **Add:**
     - **"FRD flow steps covered"**: the FRD and its step numbers, by reference (Row 11)
     - **"Design links"**, when a design exists (Row 22)
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-stories.cjs`.
9. **On its own:** used by the three story skills.
10. **Done when:** an MCP EPIC-003 story fills every section.
11. **Open points:** none.

---

## Phase 2: Requirements

### 12. `discovery-author`

1. **Label and kind:** Optimize. A skill, `.claude/skills/discovery-author/SKILL.md`. Its question bank, `references/probe-dimensions.md`, moved to probing-questions-author on 2026-10-21 (EXTEND 4).
2. **Its one job:** find what the sources say, what's missing and which source wins, and record your answers.
3. **What exists today:** `.claude/skills/probe-requirements/`:
   - SKILL.md, 91 lines: "Mandatory steps" 1 to 5, "Discovery Brief (output structure)", "What this enforces", "Handoff"
   - `references/probe-dimensions.md`, 88 lines: the nine dimensions and their questions
4. **Changes:**
   - **Keep:** step 3: restate, and classify each point as Known or Assumed.
   - **Remove:**
     - "only if the idea is thin", and "re-runnable on any artifact at any stage". Later gaps go through a change. (Rows 8, 33)
     - step 1's pointer to the old system prompt, and "What this enforces"
     - the second gate, "Review the Discovery brief" (Row 8)
     - **Removed 2026-10-21:**
       - `references/probe-dimensions.md`, which moves whole into probing-questions-author as its question bank. discovery-author keeps only the nine areas, as the topic list in its template.
       - step 4, probing. Drafting and rating questions is probing-questions-author's job, and `grade-questions.cjs` sets their order.
       - the Discovery brief's old section 6, Missing (item 2)
   - **Change:**
     - the description: always the first step of the Requirements workflow
     - one gate: "Accept the Discovery brief?" (Row 8). Renamed 2026-10-21, because an open question no longer holds a document back.
     - "Handoff": it feeds brd-author and prd-author
   - **Add:** an intake step before probing (Row 8):
     - list every source, with its name, its version and what it covers
     - find every clash between sources
     - make each clash a question: "which one wins?"
   - **Added after the Phase 1 gate:**
     - it runs `list-sources.cjs` first, so every file is listed, and duplicates and older versions are marked by a program
     - it proposes the order of authority between kinds of document, and you settle it at the gate
     - it reads the files folder by folder, and builds the topic-by-topic comparison as it goes, so hundreds of files are handled in parts
     - every topic marked Differ becomes a clash, and every topic marked Silent becomes a question
   - **Added 2026-10-21, with the Question log:**
     - after drafting, it runs probing-questions-author, which drafts and rates a question for every Silent topic, every clash the order of authority can't settle, and every assumption
     - then it runs `grade-questions.cjs`, which places each question in its group and sets the order
     - both run inside it, before its check program and its gate (`conventions.md`, "Ask, don't assume")
     - every Silent topic, clash and assumption in the brief names its question
     - at its gate, the questions come first, in the order `decision-review-gates.md` rule 3 gives, then "Accept the Discovery brief?"
5. **Reads / looks up:**
   - reads `sources/`
   - looks up the Question log, through probing-questions-author
6. **Writes:**
   - `{product}-discovery-brief.md`, from item 2
   - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
7. **Its gate:** "Accept the Discovery brief?"
   - first, the questions this brief raised, one at a time, in the order `grade-questions.cjs` sets
   - Accept: `accept.cjs`
   - Change something first: it redrafts with your words, and comes back to the same gate
8. **Its check:** `check-discovery-brief.cjs`, after `grade-questions.cjs`.
9. **On its own:** invoked with the project. If `sources/` is empty, it says so and stops.
10. **Done when:** on your new requirement, it lists every file with its version, settles the order of authority with you, compares every topic, raises every clash, records your answers, and every gap in the brief names a question in the Question log.
    - **Built** 2026-10-22. Its gate puts the decisions about the brief itself after the questions, each with "Question: None": the order of authority, and each file proposed as out of scope. It reads each set of dated files `list-sources.cjs` names, and judges whether one replaces another (NET-NEW item 47).
11. **Open points:** none.

### 13. `brd-author`

1. **Label and kind:** Optimize. A skill: `.claude/skills/brd-author/SKILL.md` plus `references/brd-checklist.md`.
2. **Its one job:** write the BRD from the sources and the Discovery brief.
3. **What exists today:** `.claude/skills/write-brd/`:
   - SKILL.md, 112 lines:
     - "Phase 1 — Discovery"
     - "Phase 2 — The BRD", with nine sections, "Deliverables", "Before you deliver"
     - "What this enforces"
   - `references/brd-checklist.md`, 76 lines, with eleven groups of checks
4. **Changes:**
   - **Keep:**
     - Phase 2's writing guidance for each kept section, including the Problem or Opportunity rule and KPI confidence tags
     - these checklist groups:
       - classification and alignment
       - executive summary
       - requirements quality
       - metrics and success criteria
       - scope clarity
       - risk management
       - source integrity
       - executive readiness
   - **Remove:**
     - Phase 1, Discovery, whole (Rows 8, 9)
     - the checklist groups "Non-functional" (Row 42) and "Traceability & RACI", whose RACI part goes under Row 2
     - every NFR and journey line in Phase 2 (Rows 11, 42)
   - **Change:**
     - it starts from the Discovery brief, always. The Lineage block's previous step is the Discovery brief.
     - one gate: "Accept the BRD?" (Row 9)
   - **Add:** a decision record entry for each answer you give at the gate.
   - **Added 2026-10-21, with the Question log:**
     - after drafting, it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before `check-brd.cjs` and its gate (`conventions.md`, "Ask, don't assume")
     - every gap names its question, such as "TBD, question 7"
     - when no file and no answer gives an objective or a business requirement, it suggests one, marked Proposed (needs confirmation) with its question, and carries on. You decide each one at the gate.
     - every line says where it came from, in one of the four ways item 3 lists
     - at its gate, the questions come first, in the order `grade-questions.cjs` sets, then "Accept the BRD?"
   - **Added 2026-10-21, in a change:** the Extend and Update paths include brd-author when the BRD holds the changed thing. It then also reads the Change impact report, and changes only what the recommendation names.
5. **Reads / looks up:**
   - reads `sources/` and the Discovery brief
   - in a change, also the Change impact report
   - looks up the Question log, through probing-questions-author
6. **Writes:**
   - `{product}-brd.md`, from item 3
   - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
7. **Its gate:** "Accept the BRD?", with the questions it raised first.
8. **Its check:** `check-brd.cjs`, after `grade-questions.cjs`.
9. **On its own:** invoked with the project. If there's no accepted Discovery brief, it says so and stops.
10. **Done when:** the MCP BRD passes `check-brd.cjs`, has no journey and no NFR section, and every gap in it names a question in the Question log.
    - **Built** 2026-10-22. The checklist group "Content completeness" was neither kept nor removed by this spec, so it isn't carried over: `check-brd.cjs` now checks what it held. In the kept groups, each line a program checks says so, and lines that pointed to the old shared rules point to `conventions.md`.
11. **Open points:** none.

### 14. `prd-author`

1. **Label and kind:** Optimize. A skill: `.claude/skills/prd-author/SKILL.md` plus `references/prd-checklist.md`.
2. **Its one job:** record what was asked, word for word, with its sources, and the product context around it.
3. **What exists today:** `.claude/skills/write-prd/`:
   - SKILL.md, 105 lines: "Load first", "The gated flow" (five gates), "The document (sections)", "Rules that make it a PRD", "Output & handoff"
   - `references/prd-checklist.md`, 38 lines
4. **Changes:**
   - **Keep:**
     - the rules:
       - trace every requirement to a BR
       - business language
       - what, not how
       - never invent
     - these checklist groups:
       - traceability and coverage
       - personas and scope
       - NFRs
       - source integrity
       - document readiness
   - **Remove:**
     - "The gated flow", all five gates (Row 10)
     - "One capability per FR, split instead": splitting is feature-author's job (Rows 10, 16)
     - the checklist lines on MoSCoW priority, status and grouping by capability (Row 10)
     - the steps that write the Key Rules table and the data requirements (decision of 2026-10-19)
     - the checklist lines on the Key Rules table and the data requirements
   - **Change:**
     - it records the requirements word for word, with their source, instead of deriving FR-xx (Rows 10, 43)
     - one gate: "Accept the PRD?"
     - in a change, it also reads the Change impact report and the files you brought, and changes only what the recommendation names (Row 36)
   - **Add:**
     - the journey section (Row 11)
     - the transition requirements section (Row 12)
     - NFR IDs (Row 42)
     - a decision record
   - **Added 2026-10-21, with the Question log:**
     - after drafting, it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before `check-prd.cjs` and its gate (`conventions.md`, "Ask, don't assume")
     - every gap names its question, such as "Proposed (needs confirmation), question 4"
     - it never adds a requirement of its own: what the client asked is recorded word for word. A value it suggests, such as an assumption or a recommended NFR, is marked Proposed (needs confirmation) with its question, and it carries on.
     - at its gate, the questions come first, in the order `grade-questions.cjs` sets, then "Accept the PRD?"
5. **Reads / looks up:**
   - reads `sources/`, the Discovery brief and the BRD
   - in a change, also the Change impact report and the files you brought
   - looks up the Question log, through probing-questions-author
6. **Writes:**
   - `{product}-prd.md`, from item 4
   - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
7. **Its gate:** "Accept the PRD?", with the questions it raised first.
8. **Its check:** `check-prd.cjs`, after `grade-questions.cjs`.
9. **On its own:** invoked with the project. If there's no accepted BRD, it says so and stops.
10. **Done when:** the MCP PRD carries every requirement of `mcp-requirements-v4.md` word for word, each with its source, and every gap in it names a question in the Question log.
    - **Built** 2026-10-22. The checklist groups "Functional requirements" and "Flows" are not carried over, since the PRD no longer derives FR-xx; their business-language and "what, not how" lines live in the skill's own rules. A transition requirement that needs no building, and isn't one of the BRD's release criteria, gets a question, so the BRD is updated through a change.
11. **Open points:** none.

---

## Phase 3: Glossary package

### 15. `glossary-author`

1. **Label and kind:** Optimize. A skill, `.claude/skills/glossary-author/SKILL.md`.
2. **Its one job:** build the Glossary, or add the new words a change brings, through Gate 1 and Gate 2.
3. **What exists today:** `glossary_methodology/.skills/harvest/SKILL.md`, 53 lines, and the version you approved on 2026-10-06, reworded to the glossary word list, saved in `fixtures/approved-glossary-method/.skills/harvest/SKILL.md`. Phase 3 copies the approved version (your decision of 2026-10-22). The original:
   - "Reads", "Produces"
   - "Steps" 1 to 9: mode, sections, scaffolding, read each section, assemble and judge, Gate 1, definitions, Gate 2, write output
   - "Must not", "Connects"
4. **Changes:**
   - **Keep:**
     - steps 1 to 8, whole, including both gates
     - "Must not", whole
     - the three modes: new build, resumed build, re-run
   - **Remove:**
     - the clauses about the sweep and the assembly agent: the sweep isn't carried over
     - "Connects" pointing to the old `skill-orchestration.md`
     - **Removed 2026-10-21:** step 9's update of the assembly draft, which set its status line to "updated after Gate 1" and relabelled the merges you rejected. The draft stays as it was at Gate 1, and its status line is fixed text: "Proposed before Gate 1. The outcomes are in the gate log." (item 17)
   - **Change:**
     - "Reads: the source, requirements and/or feature catalog" becomes **the BRD and the PRD** (Row 13)
     - step 9: the decision register and the section decisions files are no longer written by hand. It runs `build-glossary-records.cjs`. (Row 14)
     - the re-run mode, in a change, reads only the requirements the Change impact report names (Row 40)
     - paths follow `project-folders.md`
     - **Changed 2026-10-21:** Gate 1 and Gate 2 ask each question in the way `decision-review-gates.md` sets (EXTEND 2): Must answer questions first, one at a time, each with its real answers, "I don't know yet" and the next best action. The gate log stays the record of every row.
   - **Add:**
     - a note that the section decisions files are where the BRD's and PRD's own words are listed as "also written as". Nothing new is built for this. (Row 15)
     - **Added 2026-10-21, so each glossary decision is written once, in the gate log:**
       - before showing Gate 2, it runs `fill-also-written-as.cjs` (NET-NEW 51), which fills each Gate 2 row's "Also written as" from the settled Gate 1 rows
       - after writing the seven files, it runs `build-retired-words-tables.cjs` (NET-NEW 52), next to `build-glossary-records.cjs`. It writes each kind page's "Terms replaced or retired over time" table from the gate log.
5. **Reads / looks up:**
   - reads the BRD and the PRD
   - in a change, also the Change impact report
6. **Writes:**
   - the Glossary, its seven files
   - the gate log, the only place a glossary decision is written
7. **Its gates:** Gate 1 and Gate 2. This is the one agreed exception to "one gate per skill".
8. **Its check:** the method's own casing and character sweep, and the link check in step 9.
9. **On its own:** invoked with the project. If there's no accepted PRD, it says so and stops.
10. **Done when:**
    - on MCP, both gates close, and the register and section decisions are generated
    - in a change, only the new words reach Gate 1
    - on MCP, a merged word shows next to its term at Gate 2, filled in by `fill-also-written-as.cjs`
    - the assembly draft is unchanged after Gate 1
11. **Open points:** to settle before Phase 3. With your answer A at the Phase 1 gate, every other gate opens with a summary printed by a program. Should Gate 1 and Gate 2 do the same? Today the glossary method's own gate format has the skill write them.
12. **Built** 2026-10-22. The open point is settled (a call made while building, listed in MASTER-PLAN section 8): each gate opens with `grade-questions.cjs`'s block, which exists already, and keeps the method's own format, with each gate row put in the shape of `decision-review-gates.md` rule 4. "I don't know yet" resolves a row with the recommendation, marked Proposed, and probing-questions-author raises its question in the Question log. A source that splits into several glossaries becomes several projects, one glossary each. Its runs on the test data come in the pass before the trial.

### 16. `glossary-disposition`

1. **Label and kind:** Optimize. A skill, `.claude/skills/glossary-disposition/SKILL.md`.
2. **Its one job:** settle a glossary mismatch, or change an agreed word, through its gate.
3. **What exists today:** `glossary_methodology/.skills/disposition/SKILL.md`, 40 lines, and the version you approved on 2026-10-06, reworded to the glossary word list, saved in `fixtures/approved-glossary-method/.skills/disposition/SKILL.md`. Phase 3 copies the approved version (your decision of 2026-10-22). The original:
   - "Reads", "Produces"
   - "Steps" 1 to 5: restate, gate, apply, record, ripple
   - "Must not", "Connects"
4. **Changes:**
   - **Keep:**
     - steps 1, 2 and 5
     - step 3, apart from the retired-words table below
     - "Must not", whole
   - **Remove:**
     - step 4's hand-written decision-register row and section-decisions edits (Row 14)
     - **Removed 2026-10-21:** step 3's hand edit of the kind page's "Terms replaced or retired over time" table. A program writes it from the gate log.
   - **Change:**
     - step 4 writes only the gate log's change row, then runs `build-glossary-records.cjs` (Row 14)
     - a new product word goes to `glossary-author`, in re-run mode
     - paths follow `project-folders.md`
     - **Changed 2026-10-21:** its gate is worded as a choice, "How should each mismatched word be settled?", asked one word at a time in the way `decision-review-gates.md` sets. The answers:
       - fix the document
       - change the Glossary
       - add a new word, which goes to `glossary-author` in re-run mode
   - **Add:**
     - **Where it runs, added 2026-10-21** (following Row 40, your answer "A, agree the word first"):
       - step 4 of `requirement-update-workflow`, only when the Check findings hold a mismatch, so change-impact-author works with agreed words
       - first in the Extend and Update paths, when a change renames an agreed word. `recommend.cjs` reads the renamed word from the Change impact report and puts this skill first.
       - on its own, with a word to change
     - **Added 2026-10-21, so each glossary decision is written once, in the gate log:** after every change, it also runs `build-retired-words-tables.cjs` (NET-NEW 52), next to `build-glossary-records.cjs`.
5. **Reads / looks up:**
   - reads the Check findings, or a term-change request
   - looks up the Glossary
6. **Writes:**
   - the Glossary
   - the gate log, the only place a glossary decision is written
7. **Its gate:** "How should each mismatched word be settled?", one word at a time.
8. **Its check:** the method's character sweep and link check.
9. **On its own:** invoked with the project and the findings, or with a term to change.
10. **Done when:**
    - on the MCP test slice, a renamed term updates the Glossary, and the register and the retired-words tables are regenerated
    - in a change that brings a document from outside, every mismatch is settled before change-impact-author runs
11. **Open points:** none.
12. **Built** 2026-10-22. Its gate offers the three answers, then "I don't know yet". It reads the Check findings from the change's folder, and writes nothing by hand: the gate log's Change row is the record, and the programs fill the rest. Its runs on the test data come in the pass before the trial.

### 17. The glossary method's record-keeping files

1. **Label and kind:** Optimize. Shared method files under `.claude/skills/_shared/glossary/`.
2. **Its one job:** say where glossary decisions are recorded: once, in the gate log, with every other place filled from it by a program.
3. **What exists today:** the versions you approved on 2026-10-06, reworded to the glossary word list and saved in `fixtures/approved-glossary-method/`, of these files in `glossary_methodology/.skills/_shared/glossary/`. The changes below are made to the approved versions (your decision of 2026-10-22):
   - `output-formats.md`, 353 lines. These of its sections are affected:
     - "The decision register — one file, keyed by decision id"
     - "Where each decision is recorded — one home for each fact"
     - "What the assembly draft must contain"
   - `templates/decision-register.md` and `templates/section-decisions.md`
   - added 2026-10-21, from REUSE item 2:
     - `glossary-assembly-principles.md`, 409 lines, its rule G8
     - `templates/glossary-assembly-draft.md`
     - `templates/gate-log.md`
     - the four kind templates:
       - `templates/object-terms.md`
       - `templates/role-terms.md`
       - `templates/step-terms.md`
       - `templates/states-and-values.md`
4. **Changes:**
   - **Keep:** everything else in these files, word for word.
   - **Remove:** `sweep-builder-brief.md` and `sweep-reader-brief.md` aren't copied, because the sweep isn't carried over.
   - **Change:**
     - the two sections say: the gate log is the only place a decision is written, and the register and the section decisions files are generated from it (Row 14)
     - "The run root" uses `project-folders.md`
     - **Changed 2026-10-21, so each glossary decision is written once:**
       - `output-formats.md`, "Where each decision is recorded": the gate log is the only place a decision is written. It lists every place filled from it, and the program that fills each:
         - the decision register and the section decisions, by `build-glossary-records.cjs`
         - Gate 2's "Also written as", by `fill-also-written-as.cjs` (NET-NEW 51)
         - the "Terms replaced or retired over time" tables, by `build-retired-words-tables.cjs` (NET-NEW 52)
       - `output-formats.md`, "What the assembly draft must contain": loses the update after Gate 1
       - `templates/glossary-assembly-draft.md`: the status line is fixed text, "Proposed before Gate 1. The outcomes are in the gate log."
       - `templates/gate-log.md`: the Gate 2 "Also written as" placeholder says "Filled in by a program from Gate 1."
       - the four kind templates: the "Terms replaced or retired over time" table says "Filled in by a program from the gate log. Never edit by hand."
       - `glossary-assembly-principles.md`, G8: the table is built by `build-retired-words-tables.cjs`
   - **Add:** a first line in both templates: "Generated from the gate log by build-glossary-records.cjs. Never edit by hand."
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** reviewed at the Phase 3 gate.
9. **On its own:** read by the Glossary package skills.
10. **Done when:** no line says a glossary decision is written by hand anywhere but the gate log.
11. **Open points:** none. The Glossary keeps its Steps page, so `lens3-choreography.md` stays as it is (REUSE item 2), and `templates/step-terms.md` changes only in its retired-words table note, above.
12. **Built** 2026-10-22, with a Phase 3 test that compares each file with its approved original, line by line. Beyond the spec (a call made while building, listed in MASTER-PLAN section 8): `output-formats.md`, "The gate log", sets a Resolution a program can read, such as "basket: merged into Cart"; "The run root" has one glossary per project; and the check findings are saved in the change's folder inside a change, as REUSE item 1 needs.

---

## Phase 4: Features and EPICs

### 18. `feature-author`

1. **Label and kind:** Optimize. A skill: `.claude/skills/feature-author/SKILL.md` plus `references/feature-catalog.md`.
2. **Its one job:** turn the PRD's requirements into features, each with its "Done when" pieces, its capability and its priority.
3. **What exists today:** `.claude/skills/define-features/`:
   - SKILL.md, 140 lines: "What a feature is", "The gated flow" steps 1 to 4 (three gates), "The catalog (output)", "Rules", "Handoff"
   - `references/feature-catalog.md`, 129 lines: the field contract, rules FR-1 to FR-5, the delivery checklist
4. **Changes:**
   - **Keep:**
     - "What a feature is"
     - all the "Rules":
       - one capability
       - the Description is not the Done when
       - real ID tokens
       - priority with a basis
       - nothing invented
       - 100% coverage
       - grouped by source category
       - template only
     - `references/feature-catalog.md`, whole
   - **Remove:**
     - step 1's gate to approve the ID scheme. The PRD now holds the IDs word for word. (Row 16)
     - the gates after steps 2 and 4 (Row 16)
   - **Change:**
     - one gate: "Accept the Feature catalog?"
     - it reads the PRD and looks up the BRD and Glossary by ID (Row 30)
     - every word is the agreed word (Row 13)
   - **Add:**
     - for each feature, its capability (Row 16)
     - for each feature, its "Done when" cut into numbered pieces (Row 16)
     - a decision record of your answers about capabilities and pieces
   - **Added 2026-10-21:** it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before its check and its gate. Its questions go to the Question log, and each gap names its question (`conventions.md`, "Ask, don't assume").
5. **Reads / looks up:**
   - reads the PRD
   - looks up the Glossary and the BRD
6. **Writes:** `frd/feature-catalog.md`, from item 5.
7. **Its gate:** "Accept the Feature catalog?"
8. **Its check:** `check-features.cjs`.
9. **On its own:** invoked with the project. If there's no Glossary or no accepted PRD, it says so and stops.
10. **Done when:** the MCP catalog covers every requirement, with capabilities that put F-15 in Team & roles and F-16 to F-19 in Source management.
11. **Open points:** none.
12. **Built** 2026-10-22. `references/feature-catalog.md` is kept with its field contract, rules and checklist; its pointers to the old shared rules now point to `conventions.md` and the template, FR-2 no longer asks for the ID scheme's approval, since the gate that did is removed, and each checklist line a program checks says so (a call made while building, listed in MASTER-PLAN section 8). Its runs on the test data come in the pass before the trial.

### 19. `epic-grouping-author`

1. **Label and kind:** Optimize. A skill: `.claude/skills/epic-grouping-author/SKILL.md` plus `references/feature-clustering.md`.
2. **Its one job:** group the features into EPICs, settle the clashes, and propose the EPIC brief list.
3. **What exists today:** `.claude/skills/cluster-features/`:
   - SKILL.md, 90 lines: "Inputs", "The gated flow" steps 1 to 4, "EPIC grouping strategy menu", "Rules", "Output contract", "Output & handoff"
   - `references/feature-clustering.md`, 297 lines: role, rules, input, the four-step workflow, the final output shape
4. **Changes:**
   - **Keep:**
     - the strategy menu
     - every rule:
       - never invent
       - the EPIC name is a capability phrase
       - 100% coverage
       - options genuinely differ
       - recommend honestly
       - no sliver EPICs
       - borderline features and dependencies always delivered
       - the cross-band check
     - `references/feature-clustering.md`'s option layout, comparison and recommendation
   - **Remove:**
     - the gates after intake and after options (Row 17)
     - the separate deep-dive gate: its content is always delivered (Row 17)
     - "or record the coupling as an open decision" in the cross-band rule (Row 18)
   - **Change:** one gate: "Pick a grouping, settle its clashes, confirm the EPIC brief list." Each option shows its own clashes. (Row 17)
   - **Add:**
     - the EPIC brief list, proposed in run order, with yes or no and a reason for each EPIC (Row 17)
     - a "place one feature" mode for net-new changes: it proposes an existing or new EPIC, its place in the run order, and yes or no for detail. Its gate is "Confirm the placement?", and the result is appended to the EPIC grouping. (Row 35)
   - **Added 2026-10-21:** it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before its check and its gate. Its questions go to the Question log, and each gap names its question (`conventions.md`, "Ask, don't assume").
5. **Reads / looks up:**
   - reads the Feature catalog
   - in a change, also the Change impact report
6. **Writes:** `epics/grouping.md`, from item 6. It only ever appends.
7. **Its gate:**
   - "Pick a grouping, settle its clashes, confirm the EPIC brief list."
   - in place-one-feature mode: "Confirm the placement?"
8. **Its check:** `check-epic-grouping.cjs`.
9. **On its own:** invoked with the project. If there's no accepted Feature catalog, it says so and stops.
10. **Done when:** on MCP, the F-23 and F-52 clashes are settled at the pick, and the EPIC brief list is recorded.
11. **Open points:** none.
12. **Built** 2026-10-22. Before the gate it writes the chosen grouping out for the recommended option, so the specifier sees exactly what they would take; a different pick is written out again and checked again. Each option's cons name its own clashes. Its runs on the test data come in the pass before the trial.

### 20. `epic-author`

1. **Label and kind:** Optimize. A skill: `.claude/skills/epic-author/SKILL.md` plus `references/epic-generation.md`.
2. **Its one job:** write EPIC documents. In register mode, it copies the pick into the EPIC register. In brief mode, it writes one EPIC brief.
3. **What exists today:** `.claude/skills/generate-epics/`:
   - SKILL.md, 83 lines: "Inputs", "The flow" (Register with a gate, then detail files on demand, one gate each), "Rules", "Output & handoff"
   - `references/epic-generation.md`, 299 lines: the eight-section detail template
4. **Changes:**
   - **Keep:**
     - the register's copy rules: transcribe, enum or derive, never compose
     - the rules:
       - features as a table
       - no acceptance criteria
       - never invent
       - confidence tags
       - tracker IDs as TBD
       - readability
     - `references/epic-generation.md`'s sections 1 to 6 and 8
   - **Remove:**
     - the register's gate (Row 18)
     - the manifest rows (Row 28)
     - the sequencing and mapping summaries (Row 19)
     - "on demand, MVP band first, or the EPICs requested" (Row 17)
   - **Change:**
     - register mode ends with `check-register.cjs`, and a pass is the acceptance (Row 18)
     - brief mode runs only for an EPIC on the EPIC brief list, as the first gate of that EPIC's stories (Rows 17, 20)
     - section 7 of the detail is the NFR IDs that apply (Row 42)
   - **Add:** a decision record in each EPIC brief.
   - **Added 2026-10-21:** in brief mode, it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before its check and its gate. Its questions go to the Question log, and each gap names its question (`conventions.md`, "Ask, don't assume"). Register mode only copies, so it raises no questions.
5. **Reads / looks up:**
   - register mode: reads the EPIC grouping, and looks up the Feature catalog
   - brief mode: reads the EPIC register, and looks up:
     - the BRD
     - the PRD
     - the Feature catalog
6. **Writes:**
   - `epics/register.md`
   - `epics/{epic}/brief.md`
7. **Its gate:**
   - register mode: none
   - brief mode: "Accept the EPIC brief?"
8. **Its check:** `check-register.cjs`, or `check-epic-brief.cjs`.
9. **On its own:** invoked with the project and the mode. Detail mode also needs the EPIC.
10. **Done when:** the MCP Register passes the copy check, and an MCP EPIC brief holds NFR IDs only.
11. **Open points:** none.
12. **Built** 2026-10-22. In register mode it writes "Copy checked on: not yet", runs `check-register.cjs`, and runs `accept.cjs` on a pass. In brief mode its reference keeps the guidance for sections 1 to 6 and 8, and section 7 lists only NFR IDs. Brief mode's check, `check-epic-brief.cjs`, is built in Phase 6.

---

## Phase 5: FRD

### 21. `frd-author`

1. **Label and kind:** Optimize. A skill: `.claude/skills/frd-author/SKILL.md` plus `references/conventions.md`.
2. **Its one job:** write one FRD, whole, for one capability.
3. **What exists today:** `frd_experiment/frd-author/`:
   - SKILL.md, 158 lines: "Words used", "Invoke it with", "Load first", "How the template marks the steps", "Step 1 — Scope", "Step 2 — Draft", "Step 3 — Changes and acceptance", "The check", "Output"
   - `references/conventions.md`, 270 lines, sections 1 to 13
   - `references/frd-template.md`
   - `references/talking-to-the-person.md`
   - `scripts/check-frd.cjs`
4. **Changes:**
   - **Keep:**
     - "Words used"
     - "Step 2 — Draft", whole: "The rules are the work"
     - "Step 3 — Changes and acceptance"
     - "The check"
     - `references/conventions.md` sections 1, 3 and 5 to 13
   - **Remove:**
     - "Step 1 — Scope", whole: capabilities and pieces come from the Feature catalog (Row 16)
     - "How the template marks the steps" (Row 16)
     - the `--step1` check call
   - **Change:**
     - "Invoke it with": the capability, from `route-next-capability.cjs`, and the project. It finds the Feature catalog and the PRD itself. "Who decides" is the specifiers. (Row 2)
     - `conventions.md` section 2, "Capability", and section 4, "Done when": capabilities and pieces are read from the Feature catalog, not decided here (Row 16)
     - `conventions.md`, "Who decides": one gate, with the open questions asked one at a time inside it (Row 21)
     - the template is item 9, and `talking-to-the-person.md` becomes `_shared/decision-review-gates.md`
   - **Add:** the status line: drafted, accepted or parked.
   - **Added 2026-10-21, with the Question log:**
     - it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before `check-frd.cjs` and its gate. Its open questions go to the Question log, not into the FRD (item 9).
     - **the FRD guard:** at its gate, every Must answer question this FRD builds on comes first, one at a time. It must be answered before the FRD is accepted. If you answer "I don't know yet", the question stays open, and you can park the FRD with `park.cjs` while other work carries on (`decision-review-gates.md`, rule 3).
     - a question the FRD builds on is one it names, such as "Proposed (needs confirmation), question 4" in a rule, or "question 12" in Coverage's "Proved by"
5. **Reads / looks up:**
   - reads the Feature catalog
   - looks up the PRD, the Glossary and the Question log
   - in a change, also the Change impact report
6. **Writes:**
   - `frd/frd-{capability}.md`, from item 9
   - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
7. **Its gate:** "Accept the FRD?", with the questions it raised or builds on first, in the order `grade-questions.cjs` sets. While a Must answer question it builds on is open, it can't be accepted, and can be parked.
8. **Its check:** `check-frd.cjs`, item 22, after `grade-questions.cjs`.
9. **On its own:** invoked with the project and a capability. If the capability isn't in the Feature catalog, it says so and stops.
10. **Done when:**
    - the MCP Team & roles FRD is written whole with one gate, and its rules match the decisions in `frd_experiment/FRD-3a-team-and-roles.md`, apart from the two scope decisions
    - with a Must answer question open and named in an FRD, the FRD can't be accepted until it is answered, and can be parked
11. **Open points:** none. Decided 2026-10-21: `route-next-capability.cjs` puts a capability waiting on a Must answer question last (NET-NEW 25).
12. **Built** 2026-10-22. It keeps "Words used", "The rules are the work" and the changes and acceptance, now one gate with the FRD guard. `references/conventions.md` keeps sections 1, 3 and 5 to 13; sections 2, 4 and 10 now read the capability and its pieces from the catalog, at one gate, and the Open questions and review stops of the earlier flow become the Question log and the gate. The standard questions are written once, in the template, and the conventions point there (a call made while building, listed in MASTER-PLAN section 8). Its runs on the test data come in the pass before the trial.

### 22. `check-frd.cjs`

1. **Label and kind:** Optimize. A program, `tools/check-frd.cjs`.
2. **Its one job:** check an FRD before its gate.
3. **What exists today:** `frd_experiment/frd-author/scripts/check-frd.cjs`, 791 lines. It's called as `check-frd.cjs <FRD.md> <feature-catalog.md> <requirements.md> [--step1]`.
4. **Changes:**
   - **Keep:** every check that runs without `--step1`.
   - **Remove:** the `--step1` mode and its code: the flag, the Step 1 section list and the Step 1 section checks.
   - **Change:**
     - it's called as `node tools/check-frd.cjs --project <p> --frd <file>` and finds the Feature catalog and PRD through `lib/run-paths.cjs`
     - "requirements" is read from the PRD
   - **Add:**
     - a check that the FRD's features and pieces match the Feature catalog exactly
     - a check that the status line is present
     - **Added 2026-10-21, the FRD guard:** it lists every Must answer question the FRD names that is still open, read through `grade-questions.cjs`. While one is open, its "For the person" block says the FRD can't be accepted yet, and that it can be parked. This is not a check failure: an open question never fails a check (`conventions.md`, "Ask, don't assume").
     - **Changed 2026-10-21:** the checks on the FRD's Open questions section go, because the section moved to the Question log. Where a Standard question's "Answered by" or a Coverage row's "Proved by" said "Open question n", it now names a question in the Question log by its number, and the check confirms that question is there.
5. **Reads / looks up:**
   - the FRD
   - the Feature catalog
   - the PRD
   - the Question log, through `grade-questions.cjs`
6. **Writes:** nothing. It prints the check record block for the FRD.
7. **Its gate:** none.
8. **Its check:** its own tests.
9. **On its own:** as above.
10. **Done when:**
    - it passes the MCP Team & roles FRD, and catches a piece that doesn't match the catalog
    - with a Must answer question open and named in the FRD, it says the FRD can't be accepted yet
11. **Open points:** none.
12. **Built** 2026-10-22, with 38 checks, tested on an Expense claims FRD, `fixtures/expense-claims/frd/frd-claim-approval.md`, with twelve failures planted one at a time and the FRD guard. The MCP slice's FRD keeps the experiment's earlier shape, with no status line, an Open questions section and decisions "asked at Step 2", so it is not the test (a call made while building, listed in MASTER-PLAN section 8). It prints the kit's three blocks, through `lib/check-document.cjs`, with the list of what only a reader can check; the experiment's longer review messages are not carried over. It reads the standard questions from the FRD template and the "how" words from frd-author's conventions.

---

## Phase 6: Stories

### 23. `story-drafter`

1. **Label and kind:** Optimize. A skill: `.claude/skills/story-drafter/SKILL.md` plus `references/story-creation.md`.
2. **Its one job:** split one EPIC into stories, and decide their order.
3. **What exists today:** `.claude/skills/draft-stories/`:
   - SKILL.md, 87 lines: "First response", "The eight gated steps", "Rules", "Output & handoff"
   - `references/story-creation.md`, 403 lines: rules, quality standard, eight workflow steps, output format, examples
4. **Changes:**
   - **Keep:**
     - all the "Rules":
       - one capability
       - one altitude
       - legible
       - INVEST
       - user-facing only
       - sourced only
       - no acceptance criteria
     - `references/story-creation.md`'s "Story quality standard" and "Appendix A"
   - **Remove:**
     - the gates after steps 1 to 7 (Row 23)
     - showing 4 or more splitting strategies (Row 23)
     - the batch navigation index (item 10)
     - the "Batch processing" rules
   - **Change:**
     - steps 1 to 6 run without stopping:
       - personas come from the PRD, and the role words from the Glossary
       - capabilities and the split come from the FRD flows
     - one gate: "Approve the split?", covering all the EPIC's stories together, with their order (Row 23)
     - Stories are created only after approval
   - **Add:**
     - the order within the EPIC (Row 23)
     - design links, when a design exists (Row 22)
     - **Added 2026-10-21:** it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before its check and its gate. Its questions go to the Question log, and each gap names its question (`conventions.md`, "Ask, don't assume").
5. **Reads / looks up:**
   - reads:
     - the EPIC's Register row
     - the FRDs
     - the design, if any
   - looks up:
     - the Glossary
     - the BRD
     - the PRD
6. **Writes:**
   - `epics/{epic}/story-list.md`
   - one Story per story
7. **Its gate:** "Approve the split?"
8. **Its check:** `check-stories.cjs`.
9. **On its own:** invoked with the project and the EPIC. If an FRD the EPIC needs isn't accepted, it says so and stops.
10. **Done when:** MCP's EPIC-003 is split into stories in one gate, each tracing to F-15 to F-20.
11. **Open points:** none.
12. **Built** 2026-10-22. `references/story-creation.md` keeps the Story quality standard and Appendix A; their examples, about loans and orders, are kept as they are, since they hold no client material (a call made while building, listed in MASTER-PLAN section 8). Its runs on the test data come in the pass before the trial.

### 24. `story-groomer`

1. **Label and kind:** Optimize. A skill: `.claude/skills/story-groomer/SKILL.md` plus `references/story-grooming.md`.
2. **Its one job:** fill each story of one EPIC from documents already decided.
3. **What exists today:** `.claude/skills/groom-stories/`:
   - SKILL.md, 74 lines: "Inputs & batch", "The three gated steps", "Dependency evidence", "Rules", "Output & handoff"
   - `references/story-grooming.md`, 559 lines
4. **Changes:**
   - **Keep:**
     - "Dependency evidence (no guessing)", whole
     - the rules:
       - in and out of scope stated
       - no acceptance criteria
       - a sizing alert for a bundle
     - `references/story-grooming.md`'s "Style rules", and its Appendix A examples A.1 to A.4
   - **Remove:**
     - "at most four per batch" (Row 24)
     - "must take my acknowledgement each step" (Row 24)
     - "Derive everything from sources; synthesize" (Row 30)
     - the user flow extraction method, Appendix A.5 (Row 11)
   - **Change:**
     - one gate: "Accept the grooming?", covering all the EPIC's stories together (Row 24)
     - rules are quoted from the FRD by rule ID
     - flow steps are referenced, not written
     - roles come from the FRD actors
     - metrics come from the EPIC brief's fitness criteria (Rows 11, 24)
   - **Add:** it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before its check and its gate. Its questions go to the Question log, and each gap names its question (`conventions.md`, "Ask, don't assume"). Added 2026-10-21.
5. **Reads / looks up:**
   - reads the Story list and the Stories
   - looks up:
     - the FRDs
     - the Feature catalog
     - the BRD
     - the EPIC brief
     - the Glossary
6. **Writes:** the Grooming section of each Story.
7. **Its gate:** "Accept the grooming?"
8. **Its check:** `check-stories.cjs`.
9. **On its own:** invoked with the project and the EPIC. If the split isn't approved, it says so and stops.
10. **Done when:** every MCP EPIC-003 story quotes its rules by ID and points to its FRD flow steps.
11. **Open points:** none.
12. **Built** 2026-10-22. `references/story-grooming.md` keeps the style rules and examples A.2 to A.4. Example A.1 is shown in the kit's grooming shape, with the Expense claims story "Reject a Claim", because the earlier A.1 writes the flow and the rules itself, which this spec changes to quoting the FRD by rule ID (a call made while building, listed in MASTER-PLAN section 8). Its runs on the test data come in the pass before the trial.

### 25. `ac-author`

1. **Label and kind:** Optimize. A skill: `.claude/skills/ac-author/SKILL.md` plus `references/acceptance-criteria.md`.
2. **Its one job:** write each story's acceptance criteria for one EPIC, and mark the stories ready.
3. **What exists today:** `.claude/skills/write-acceptance-criteria/`:
   - SKILL.md, 72 lines: "Step 1 — Sufficiency gate", "Step 2 — Generate AC", "Rules", "Output"
   - `references/acceptance-criteria.md`, 410 lines
4. **Changes:**
   - **Keep:**
     - the rules:
       - each "Then" is verifiable and user-observable
       - never invent
       - reuse the story's exact terms
     - 3 to 7 scenarios, with a split recommended at 8 or more
     - the Given/When/Then formatting
     - `references/acceptance-criteria.md`'s quality standard, its coverage checklist, and its behaviour examples
   - **Remove:**
     - the sufficiency gate as a separate gate. Grooming's check covers it. (Row 24)
     - the UI and System categories, and the categorization decision tree (Row 24)
     - the "Batch processing" rules
   - **Change:**
     - one gate for the EPIC: "Accept the criteria? This marks the stories ready." (Rows 24, 26)
     - every scenario names the FRD rule IDs it proves (Row 24)
   - **Add:**
     - `coverage-check.cjs` runs before the gate (Row 25)
     - **Added 2026-10-21, with the Question log:**
       - it runs probing-questions-author, then `grade-questions.cjs`, inside itself, before its checks and its gate. Its questions go to the Question log, and each gap names its question (`conventions.md`, "Ask, don't assume").
       - **the ready guard:** the stories can't be marked ready while a Must answer question raised in those stories is still open. At its gate, each such question comes first, one at a time (`decision-review-gates.md`, rule 3).
5. **Reads / looks up:**
   - reads the Stories
   - looks up the FRDs, the Glossary and the Question log
6. **Writes:**
   - the Acceptance Criteria section of each Story
   - the ready marks in the Story list
   - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
7. **Its gate:** "Accept the criteria? This marks the stories ready.", with the questions raised in the stories first. While a Must answer question raised in them is open, the stories aren't marked ready.
8. **Its check:** `check-stories.cjs`, then `coverage-check.cjs`, after `grade-questions.cjs`.
9. **On its own:** invoked with the project and the EPIC. If grooming isn't accepted, it says so and stops.
10. **Done when:**
    - every rule of EPIC-003's features is named by at least one scenario, and the stories are marked ready
    - with a Must answer question raised in the stories still open, the stories aren't marked ready
11. **Open points:** none. Decided 2026-10-21: `route-next-epic.cjs` puts an EPIC waiting on a Must answer question last (NET-NEW 27).
12. **Built** 2026-10-22. `references/acceptance-criteria.md` keeps the quality standard, the coverage checklist, with each row pointing to where the kit holds it, and the behaviour examples; the UI and System categories are gone. Its runs on the test data come in the pass before the trial.
