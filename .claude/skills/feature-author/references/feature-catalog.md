# Feature catalog — rules, field contract and delivery checklist

The detailed guidance for `feature-author`. The SKILL.md has the steps. `../../_shared/templates/feature-catalog.md` has the table shape. This file has the rules that make each row sound. It **takes the quality characteristics Q1 to Q10 from `../../_shared/quality-characteristics.md`**, and adds the rules for a feature catalog. Do not restate Q1 to Q10. Apply them.

---

## 1. The field contract

The field contract makes Q2, Q3 and Q5 concrete. Every row has two prose fields that are easy to collapse into each other. Keep them distinct:

| Field | Answers | Shape | Must NOT be |
|-------|---------|-------|-------------|
| **Name** | *What does a person do with it?* | What a person does, and to what, in the Glossary's words, in at most 5 words, such as "Approve a claim" | A heading copied from the client's file, or a slogan such as "Claims in one place" |
| **Category** | *Which part of the source does it belong to?* | The PRD section's heading, **word for word**. The row sits under that `###` sub-table. | An invented category, which the PRD does not have |
| **Description** | *What is this feature?* | One sentence: `{capability} so that {value or outcome}` | The feature name reworded |
| **Done when** | *How do we observe it is fully realized?* | An observable end-state an outside party could confirm, covering all the feature's requirements | The Description reworded |

**The ⊆ test.** It tests Q3 and Q5, and it gives the same answer every time. Read the Done when. Is every condition in it already stated in the Description? Then the Done when ⊆ the Description, and the row **fails**. The Done when must add **at least one observable condition** that the Description does not have. `check-features.ts` fails a Done when whose every word is already in its Description.

**Verifiability, Q5.** A Done when built on *intention* verbs fails. These verbs are "supports", "allows", "handles" and "enables". Rephrase it as an outcome. Write "a claim over the limit waits for a finance approver", not "allows a limit to be set".

### Worked example — the collapse, and its fix

- ❌ **Rejected.** The Done when just rewords the Description, so it fails the ⊆ test.
  > Description: *A claim's amount is fixed once it is sent.*
  > Done when: *the claim's amount is fixed once it is sent.*

- ✅ **Correct.** The Done when adds an observable condition.
  > Description: *A claim's amount becomes fixed once it is sent.*
  > Done when: *After a claim is sent, a change to its amount is not accepted.*

---

## 2. Feature rules

These rules add to Q1 to Q10.

### FR-1 — Stable feature ID (absolute reference)
Each feature gets an ID from `F-01` onward, given in order. An ID is **unique and never changes**. When a feature is dropped or merged, its number is **retired**, and never used again. Never renumber the catalog, because that breaks every link after it.

### FR-2 — Source IDs: the PRD's own, never invented
The `Covers` column links each feature to the requirements it comes from. The PRD already holds each requirement's ID (`conventions.md`, "IDs"), so:
1. `Covers` may contain **only** requirement IDs that are in the PRD, and only of Requirement rows. An ID that appears nowhere in the PRD is a defect (invented traceability), and `check-features.ts` finds it. So is the ID of a Purpose, Scope or Way of working row.
2. **Never** emit a bare `1.1`, and **never** mint an ID the PRD lacks: that is renumbering, not tracing.
3. **BR links** come from the BRD, per the PRD's traceability matrix. Never fabricate a `BR-xx`.

### FR-3 — Priority has a named basis
Every feature has a MoSCoW rank, Q8, **and** a basis. The basis comes from the fixed list in the template: **Benefit, Penalty, Cost, Risk, Dependency, Time-sensitivity, Stability, Regulatory**. The Basis cell names one and states it in one clause, such as "Penalty — paying an unapproved claim breaks the expense policy". If no file supports a rank, mark it `Proposed (needs confirmation)` with its question. Never assert a priority that no file supports.

### FR-4 — Complete coverage (set level)
The catalog must **completely describe** the requirements: every Requirement row in the PRD lands in **at least one** feature. A row of any other kind, such as Scope, gets no feature and no coverage row. The coverage check is section 4 of the template. It has one row for each Requirement row, named by its title in the PRD's simple words. The rows are grouped like the PRD, and a range of rows is never joined into one. A Requirement row that no feature covers has its own `Gap` row, which names its question in the Question log. Each feature links to its requirements, and together the features cover every one.

### FR-5 — Group by source category
Write the catalog as one `###` table **for each section of the PRD**, with the section's heading **word for word**. A feature belongs to **one** section, its main one. When it also covers a requirement from another section, say so in `Notes`, and never write the feature twice. Feature IDs **run on across all sections**, from F-01 onward, and never start again in a new section (FR-1). Never invent a section (Q9, `conventions.md`, "Nothing invented").

### FR-6 — Every action and move lands in a feature
Section 5 has one row for each row of every Actions and Moves table in the data model files. The rows keep the files' order. Each row has one feature from the catalog. A row no feature names is settled at the gate, by the two questions in SKILL.md, step 6.

Until the gate settles it, such a row shows "?" in its Feature cell. Nothing else goes in the cell. The table "To settle at the gate", under section 5, lists each such row. It gives the row's two answers, each yes or no, and the recommendation they give. The data model shows its open decisions the same way. It writes a "?" in the cell, and lists the recommended answer for the gate. An open row is not a finding, and it doesn't count as having a feature. But the catalog can't be accepted while a row shows "?". This is the catalog's guard. Once the catalog is accepted, a row that still shows "?" is a finding.

A row may wait on a change instead. That happens when the PRD doesn't say the action or the move, but it is big enough for a feature. A new requirement comes first, through `change-request-workflow`, and then a new feature. At the catalog's gate, only the start of that workflow runs. Its step 1 writes the change's statement, and gives the change its number. The change's analysis and its own gate come after the catalog's gate. Until that change is done, the row's Feature cell reads "waits on change" and the change's 3-digit number, such as "waits on change 004". Nothing else goes in the cell. The change must be in the project's `changes/` folder. A waiting row is not a finding, and it doesn't count as having a feature. So the catalog can be accepted while the row waits. The gate shows each waiting row. When the change is done, its path runs feature-author, and the row gets its feature. A row that still waits on a closed change is a finding. A change is closed when its progress file reads "Status: closed". The change has run, so the row should name its feature.

### FR-7 — A capability is one FRD
A capability is the FRD its features go in, so the number of capabilities is the number of FRDs to write and keep up to date. A capability holds the rules that belong together for one part of the product. Start with one capability for each PRD section. Split a section into two capabilities only when it holds two sets of rules that don't depend on each other, and different people act in each. Never give each feature, or each small group of features, a capability of its own. Many thin FRDs spread the rules out, and each one is written and kept up to date on its own. `check-features.ts` lists each PRD section with more than one capability, for the specifier to look at at the gate.

### Template only
The saved file contains **only** the template's sections, in its order. The approval prompts, the narration of each step, and any "what changed" notes are said in the conversation. They are never written into the document. Questions are kept in the Question log, never in the catalog.

---

## 3. Delivery checklist

Run before the check program. Anything unchecked is fixed, or becomes a question in the Question log. A line, or the part of a line, that says it is checked by check-features.ts is left to the program.

### Each row
- [ ] **Q1** One capability. No `and`, no `/` and no bundled verbs. A compound feature is split.
- [ ] **Q2** The Description gives the capability **and** the value. No required field is blank.
- [ ] **Q3 and Q5** The Done when is observable **and** passes the ⊆ test. It adds a condition the Description lacks. The ⊆ test is checked by check-features.ts.
- [ ] **Q4** No word from the "Words that can't be checked" list without its question. "Is it met?" can be answered yes or no from the row.
- [ ] **Q7** Business language. No term from `conventions.md`, "Business language". The Glossary's agreed words are used throughout. Retired words are checked by check-features.ts.
- [ ] **Q8** Each feature has a MoSCoW rank. Checked by check-features.ts.
- [ ] **FR-3** The basis is named from the fixed list, or is `Proposed (needs confirmation)` with its question. Checked by check-features.ts.
- [ ] Capability names the FRD the feature goes in, such as `FRD-3a Claim approval`. Checked by check-features.ts.
- [ ] **FR-7** One capability for each PRD section, unless the section holds two sets of rules that don't depend on each other, and different people act in each.
- [ ] The Done when is cut into pieces, in its own words and order. Checked by check-features.ts.
- [ ] Each feature's pieces sit under its own heading, its ID and then its name. Checked by check-features.ts.

### Traceability and IDs
- [ ] **FR-1** Feature IDs are unique and in order, and none is used again. Checked by check-features.ts.
- [ ] **FR-2** Every `Covers` ID is in the PRD. None is invented. Checked by check-features.ts.

### Set level
- [ ] **FR-4** Every Requirement row is in at least one feature, or is a Gap that names its question. Checked by check-features.ts.
- [ ] **FR-5** One sub-table for each PRD section, with its heading word for word. The IDs run on across the whole catalog. No section is invented.
- [ ] **FR-6** Every action and move in the data model has one row in section 5. Its Feature cell names one feature, or the change it waits on, such as "waits on change 004". Until the gate, it may show "?". That change is in the project's `changes/` folder, and isn't closed. Each "?" row is listed under "To settle at the gate", with the recommendation its two answers give. Checked by check-features.ts.
- [ ] **Q6** No two features claim the same capability. No feature contradicts another feature, or the source.

### Source integrity
- [ ] **Q9** Nothing invented. Every specific has its source, or is `TBD` or `Proposed (needs confirmation)` with its question.
