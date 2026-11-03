# Two PRD fixes: the plan

Status: Decisions A1, A2, B1, B2 and B3 settled on 2026-10-30, each as recommended. Both parts built on 2026-11-02, not committed. Part 6 says what was built, and where the build differs from this plan.

Next step: commit, then try both parts on a real PRD. The build came first, as you chose for the data model, so the trial in section 4 now tests the built kit, not a hand-made copy.

Archived on 2026-11-02, in `_archive/root-notes-2026-11-02/`. Both fixes are built. The checks in section 4, "The trial works when", moved to `_data_model/data-model-stitching-plan.md`, part 8, so the fresh trial tests them. Section 3, "Left for later", moved to the stitching plan's part 10.

The two parts are separate. Each one can be settled, tried and built without the other. If both are built, build Part A first, because Part B's rule then applies to Requirement rows only.

---

## 1. Part A: sentences in the client's list that aren't requirements

### A.1 What happens today

A client's list of requirements often holds sentences that aren't requirements:
- why the product exists (its purpose)
- what the project covers or leaves out (its scope)
- how the client's people work today: a way of working

The kit copies every one of them into the PRD as a requirement:
- `prd-author/SKILL.md`, step 2, item 4: "every requirement the client stated … Nothing is merged, split or ranked, and nothing is added."
- `prd-author/SKILL.md`, step 2, item 4: every row traces to business requirements, or "reads TBD and names its question".
- `feature-author/SKILL.md`, step 5: "Every requirement in the PRD lands in at least one feature. A requirement nothing covers is a Gap, and names its question." `check-features.cjs` checks this, at line 132.

So a purpose sentence must either get a feature that nobody needs, or become a Gap with a question that nobody needs.

**Example, an online shop.** The client's file, section 1:

| ID | The client's words | What it really is |
|---|---|---|
| REQ-1.1 | The new shop lets us sell online all year round. | Purpose |
| REQ-1.2 | Gift cards are not part of this project. | Scope |
| REQ-1.3 | Our warehouse team packs orders each morning. | Way of working |
| REQ-1.4 | A customer can pay by card. | Requirement |

Today, all four rows need a feature or a Gap.

**From BABOK v3:**
- 2.3, Requirements Classification Schema. Requirements are sorted into kinds: business, stakeholder, solution and transition.
- A purpose is a business need. The BRD holds it.
- A scope line is part of the change strategy (6.4). The BRD's scope section holds it.
- A way of working describes the current state (6.1). In the PRD, it becomes an assumption or a dependency.

### A.2 Decisions

#### Decision A1: Where does a sentence that isn't a requirement go?

**Settled on 2026-10-30: B, keep the row, and mark its kind.**

| Option | What it means | Why, or why not |
|---|---|---|
| A. Move it out of section 4 | The row moves to the overview, to scope or to assumptions. This is what the review proposed. | • It breaks "nothing is merged, split or added" and the client's order.<br>• When the client sends a new version of the file, the row-by-row comparison shows the moved row as deleted.<br>• The PRD doesn't own scope. The BRD does. |
| **B. Keep the row, and mark its kind (chosen)** | The row stays where it is, with the client's words and its source. A new column, Kind, says Requirement, Purpose, Scope or Way of working. Only Requirement rows get features. The other rows say where they are handled. | • The client's order and the row-by-row comparison stay as they are.<br>• The feature check skips rows that aren't requirements, so nothing is made up to fill them.<br>• The specifier confirms each kind at the gate. |
| C. Change nothing, and raise a question each time | The skill asks about each such row at the gate | The same question comes back in every project, and the feature or Gap is still needed afterwards |

With option B, the Kind column is required in every PRD. A PRD without it gets a finding from `check-prd`, which says how to add it. This is the same way the check handles the old form of section 4 today. Until the PRD is fixed, the later checks treat a missing Kind as Requirement, so they keep working.

#### Decision A2: What about a row that mixes a requirement with something else?

**Settled on 2026-10-30: A, the row is a Requirement.**

Example: "Customers can track their order, because we want fewer calls to our help desk." The first part is a requirement. The second part is a purpose.

| Option | What it means | Why, or why not |
|---|---|---|
| **A. The row is a Requirement (chosen)** | The row stays whole and gets its feature. Its simple words keep each idea, one sentence each, as they do today. | Nothing is split, and the source ID stays the client's. The purpose part does no harm inside a requirement. |
| B. Split the row into REQ-3.7a and REQ-3.7b | Two rows, one of each kind | It breaks "nothing is split", and it makes IDs the client's file doesn't have (`conventions.md`, "IDs") |

The same rule covers any row whose kind isn't clear: it is a Requirement. A requirement is never dropped by mistake.

### A.3 The edits, file by file

Paths start at `.claude/skills/` unless they start with `tools/`. Each edit quotes the kit's text as it is today.

**`prd-author/SKILL.md`**

1. Step 2, item 4, a new bullet after the ID bullet:

   > - **Kind:** what the row is, from this table. A row that holds a requirement and something else is a Requirement, and is never split. A row whose kind isn't clear is a Requirement.
   >
   > | Kind | The sentence says | Example | Traces to |
   > |---|---|---|---|
   > | Requirement | what the product must do, or how well | A customer can pay by card. | the business requirements it serves |
   > | Purpose | why the product exists, or what it is worth | The new shop lets us sell online all year round. | PRD section 2 |
   > | Scope | what the project covers or leaves out, and nothing the product must do | Gift cards are not part of this project. | BRD section 4, In scope or Out of scope |
   > | Way of working | how the client's people work today, and nothing the product must do | Our warehouse team packs orders each morning. | PRD section 8, Assumptions or Dependencies |

2. Step 2, item 4, the last bullet. Today: "the business requirements it traces to. A requirement that traces to none reads TBD and names its question." New: "what it traces to. A Requirement traces to business requirements. One that traces to none reads TBD and names its question. A row of any other kind names the section that holds it, as the Kind table says."
3. Step 2, after "Where two files say different things, the Discovery brief's settlement says which file's words are recorded.", add: "A Scope row must agree with the BRD's In scope or Out of scope. One that doesn't gets a question, so the BRD can be updated through a change. A Way of working row is also written in section 8, with its source."
4. Step 2, item 5. Today: "Each step names the requirements it involves." New: "Each step names the Requirement rows it involves."
5. Step 2, item 9. Today: "with the requirements that cover it." New: "with the Requirement rows that cover it."
6. Step 6, the gate. After the bullet "Do the simple words say the same as the client's words?", add:

   > - then **"Are these rows not requirements?"**, showing each row whose Kind isn't Requirement, with its kind and the section that holds it. This question is skipped when every row is a Requirement. The answers:
   >   - "They are all right."
   >   - "Some are requirements after all." The specifier names the rows. Each one becomes a Requirement, with its business requirements.
   >   - "I don't know yet." The kinds are used, marked Proposed. The rows go on the list for the client to confirm.

**`prd-author/references/prd-checklist.md`**, under "Personas and scope", add: "- [ ] Every row has its Kind. A Scope row agrees with the BRD's scope, or names its question. A Way of working row is also in section 8. (The Kind values and what each kind traces to are checked by check-prd.cjs.)"

**`_shared/templates/prd.md`**

1. Section 4's line in italics. After "Nothing is merged, split or ranked in this section.", add: "Kind says whether a row is a requirement, or the client's purpose, scope or way of working. Only Requirement rows become features."
2. The table. Today: "| ID | In simple words | The client's words | Source | Traces to |". New: "| ID | Kind | In simple words | The client's words | Source | Traces to |", with "{kind}" in the new column.
3. Placeholders, add a row: "{kind} · Requirement, Purpose, Scope or Way of working. A row of any kind but Requirement names, in Traces to, the section that holds it. · Requirement".

**`_shared/examples/prd.md`** and **`fixtures/mcp-slice/mcp-slice-prd.md`**: the new line in italics, and the Kind column, with Requirement in every row. They get no new example rows, as section 3, item 2 says.

**`feature-author/SKILL.md`**

1. Step 5. Today: "Every requirement in the PRD lands in at least one feature." New: "Every Requirement row in the PRD lands in at least one feature. A row of any other kind gets no feature."
2. Rules, FR-4. Today: "every requirement lands in at least one feature". New: "every Requirement row lands in at least one feature".

**`feature-author/references/feature-catalog.md`**, FR-4. Today: "every requirement in the PRD lands in **at least one** feature. The coverage check, section 4 of the template, has one row per requirement". New: "every Requirement row in the PRD lands in **at least one** feature. The coverage check, section 4 of the template, has one row per Requirement row". The checklist line for FR-4 changes the same way.

**`_shared/templates/feature-catalog.md`**, section 4's line in italics. Today: "*Every requirement in the PRD, one row each,". New: "*Every Requirement row in the PRD, one row each,".

**`tools/lib/check-document.cjs`**, `requirementsOf`: each row also gets `kind`, from the Kind column. When the column is missing, `kind` is Requirement.

**`tools/check-prd.cjs`**

1. "Requirements": a finding when the Kind column is missing, saying how to add it, and when a Kind isn't one of the four.
2. "Requirements": a Requirement row traces as it does today. Any other row names "PRD section 2", "BRD section 4" or "PRD section 8", as the Kind table says.
3. "Journey": a finding when a step names a row that isn't a Requirement.
4. "Every business requirement traced": only Requirement rows count.
5. The "holds" line: "{n} requirements, and {n} rows of purpose, scope or way of working, under {n} headings of the client's files".
6. The header comment lists the new checks.

**`tools/check-features.cjs`**, "Coverage": only Requirement rows need a row in the coverage check. A coverage row for a row of any other kind is a finding: "{ID} is a {kind} row, not a requirement, so it needs no row."

**Tests**

- `tools/tests/foundation.test.cjs`, line 161: add Kind to the PRD's columns. Line 535: add the Kind column to the test PRD.
- `tools/tests/requirements.test.cjs`: passes on the sample. It fails on:
  - a Kind that isn't one of the four
  - a Scope row that traces to a business requirement
  - a journey step that names a Scope row
- `tools/tests/features-and-epics.test.cjs`: a Scope row needs no feature, and a coverage row for it is a finding.

### A.4 What stays as it is, and why

| File | Why it needs no change |
|---|---|
| `frd-author`, `copy-wording.cjs` | They copy the simple words of the requirements a feature covers. A feature never covers a row of another kind. |
| `requirement-update-workflow` | The rows stay where they are, so a new version of the client's file is still compared row by row |
| `glossary-author` | It reads the whole PRD. A purpose sentence can still give it words. |
| `story-drafter`, `story-groomer`, `ac-author` | They work from features and FRD rules |

---

## 2. Part B: requirements that can't be checked

### B.1 What happens today

- `prd-author/SKILL.md`, step 2, item 4: "When a part has two possible meanings, it is not guessed: it becomes a question". Nothing says what to do with a part that has one meaning but can't be checked.
- `quality-characteristics.md`, Q4, already has the test: it fails when "is this unit met?" cannot be answered yes or no from its own text. `prd-author` names Q4 under "Quality", but no step turns a Q4 failure into a question.
- `probing-questions-author/references/probe-dimensions.md`, area 8, asks about KPIs and release criteria. Nothing in it asks about each requirement.
- `simple-writing-rules.md` flags "one place" as a pointing word, and says "name the step or the thing". When the client named no step, that fix pushes the writer to make one up.
- No program checks Q4's own list of words, such as "etc.", "as needed" and "robust".

**Example, an online shop.**
- "Customers can find any product quickly." What is quickly?
- "Nothing important is lost if the shop stops working." What is important?
- "Orders are managed in one place." Which place?

Today, each of these reaches the FRD as it is. frd-author is the first step that asks about it.

**From BABOK v3:** 7.2, Verify Requirements. A good requirement is unambiguous and testable: someone can check that the product meets it.

### B.2 Decisions

#### Decision B1: Who spots a requirement that can't be checked?

**Settled on 2026-10-30: A, prd-author spots it, and probing-questions-author asks.**

| Option | What it means | Why, or why not |
|---|---|---|
| **A. prd-author spots it, and probing-questions-author asks (chosen)** | While writing the simple words, prd-author tests each Requirement row with Q4. A row that fails is not guessed: it becomes a question, as a row with two meanings does today. | It follows the path the kit already uses for two meanings. The question is asked at the PRD's gate. |
| B. Only the FRD finds it | No change. frd-author raises it later. | The FRD's rules are then built on a requirement nobody could check, and the question comes late |

#### Decision B2: Does a program also look for these words?

**Settled on 2026-10-30: A, yes, one short list.**

| Option | What it means | Why, or why not |
|---|---|---|
| **A. Yes, one short list (chosen)** | A new list in `simple-writing-rules.md`, "Words that can't be checked", with Q4's words, and "properly" and "where applicable" from `story-grooming.md`. `simple-writing.cjs` flags them in every document, as it does the other lists. The client's words are skipped, as they are today. | • One list instead of three. Today the words are in Q4, in `story-grooming.md` and in `brd-checklist.md`.<br>• It catches only the listed words. Words such as "quickly" are left to the judgement in B1. |
| B. No program, only judgement | prd-author's Q4 test is the only check | Two runs can give different results, and a missed word goes through |

"Important" and "quickly" are not on the proposed list. The kit's own text uses them, for example "most important" in place of "load-bearing". The trial (section 4) shows whether more words should be added.

#### Decision B3: Once the question is answered, what changes in the PRD?

**Settled on 2026-10-30: A, the simple words stay, and name the question.**

| Option | What it means | Why, or why not |
|---|---|---|
| **A. The simple words stay, and name the question (chosen)** | "Customers can find any product quickly, question 9." The answer is recorded in the Decision record and the Question log. frd-author uses it as a decided rule. When it is about speed, size or availability, it is also an NFR, with the answer as its threshold. | It keeps today's rule: "A rule the client states stays here. Rules decided later are written in the FRDs." The question is still settled at the PRD's gate, not at the FRD. |
| B. Rewrite the simple words with the answer | "Customers find a product within 2 seconds of searching." | The simple words then say more than the client did. That breaks "adds nothing", and the check against the client's words would no longer hold. |

### B.3 The edits, file by file

**`prd-author/SKILL.md`**, step 2, item 4, the "In simple words" bullet. Today: "When a part has two possible meanings, it is not guessed: it becomes a question, and the simple words name it, such as "question 7"." New: "When a part has two possible meanings, or can't be checked yes or no, such as "quickly" with no time, it is not guessed: it becomes a question, and the simple words name it, such as "question 7" (Q4)."

**`prd-author/references/prd-checklist.md`**, under "Source integrity", add: "- [ ] Every Requirement row can be checked yes or no, or names its question (Q4). (The words on the "Words that can't be checked" list are checked by check-prd.cjs.)"

**`probing-questions-author/SKILL.md`**, step 2, the list of gaps. After the Discovery brief bullet, add: "- in a PRD, every Requirement row whose simple words fail Q4: a part with two meanings, or a part that can't be checked yes or no"

**`probing-questions-author/references/probe-dimensions.md`**, area 8, "Success and acceptance". The nine areas stay nine, because the Discovery brief uses the same nine. Add:
- "For each requirement: could two people check, yes or no, that the product does it? Which word stops them?"
- "What number, list or rule would make that word checkable? Offer the choices the files point to. Never put a number forward as a fact."

**`_shared/quality-characteristics.md`**, Q4. Today: "An unbounded vague term is used with no limit — `etc.`, `and so on`, `as appropriate`, `as needed`, `flexible`, `various`, `robust` — **or**". New: "A word from the "Words that can't be checked" list in `simple-writing-rules.md` is used with no limit, **or**".

**`_shared/simple-writing-rules.md`**

1. A new list after "Pointing words":

   > ### Words that can't be checked
   >
   > *A sentence with one of these words can't be checked yes or no. In a requirement, when the client's words give no limit, don't make one up: raise a question.*
   >
   > | Word or phrase | Say instead |
   > |---|---|
   > | • etc.<br>• and so on | name every item, or ask for the full list |
   > | • as appropriate<br>• as needed<br>• where applicable | say when, as a rule |
   > | • flexible<br>• various<br>• robust | say exactly what |
   > | properly | say what correct looks like |

2. Pointing words, the "one place" row. Today: "name the step or the thing". New: "name the step or the thing. In a requirement, when the client names none, raise a question."

**`tools/lib/simple-writing.cjs`**: add "Words that can't be checked" to `LISTS`, at line 34, and its kind to `KINDS`, at line 252.

**`story-groomer/references/story-grooming.md`**, line 9. The "Don't" column points to the new list instead of naming its own words.

**Tests**

- `tools/tests/simple-writing.test.cjs`: a word from the new list is found in the simple words, and not in the client's words.
- `tools/tests/requirements.test.cjs`: a PRD with "as needed" in a Requirement row's simple words, and no question named, fails.

### B.4 What stays as it is, and why

| File | Why it needs no change |
|---|---|
| `decision-review-gates.md` | The new questions are asked at the PRD's gate, by its rules |
| `grade-questions.cjs` | It rates and orders every question, whatever raised it |
| `frd-author` | It already uses an answered question as a `decided` source |
| `check-brd.cjs` | The BRD's "improve" and "enhance" stay in its own checklist. Those words are fine in other places. |

---

## 3. Left for later, and why

| # | What | Why later | When |
|---|---|---|---|
| 1 | `traceability-map.cjs` shows each row's Kind | It shows the requirements correctly without it | After the trial |
| 2 | The example PRD gets a row of each kind | The example is the Expense claims product, and new examples should be generic. Changing every example is its own clean-up. | Its own change |
| 3 | A new version of the client's file changes a row's kind | `change-impact-author` treats it as a changed row today, which is safe | Before the kit is used for changes |
| 4 | Points 5 and 6 of the review: a stakeholder table, and a table from the kit's words to BABOK's | They aren't part of these two fixes | Their own plans |
| 5 | The project's `.agents/` copy of the kit is older than this one. It still has "Requirements, word for word". | Update it from this kit before the trial | Before the trial |

---

## 4. The trial

The trial follows this plan by hand, on a project you choose. Nothing in `.claude/`, `tools/` or the project's accepted documents changes. The results go in a root folder, `prd-fixes-trial/`.

| Step | What | Where it goes | Needs you |
|---|---|---|---|
| 1 | Give each row of the PRD's section 4 its Kind, by the table in A.3 | `prd-fixes-trial/section-4-kinds.md` | "Are these rows not requirements?" |
| 2 | Test each Requirement row with Q4, and draft a question for each one that fails | `prd-fixes-trial/questions.md` | Each question |
| 3 | Run steps 1 and 2 a second time, fresh, and compare | `prd-fixes-trial/run-2.md` | – |

The trial works when:
- every row has a kind, and no Purpose, Scope or Way of working row needs a feature
- every Requirement row can be checked yes or no, or names its question
- nothing is invented: no number, step or rule that the client's words don't give
- the two runs give the same kinds, and question the same rows

---

## 5. Found while writing this plan

- **Both parts change the same bullet in `prd-author`.** Build Part A first. Part B's Q4 test then runs on Requirement rows only, so a purpose sentence such as "We want to grow" isn't questioned for a number.
- **The pointing-word fix can lead to a made-up step.** `simple-writing-rules.md` tells the writer to "name the step or the thing" in place of "one place". In a requirement where the client named none, that means guessing. Part B, item 2 under `simple-writing-rules.md`, makes it a question instead.

---

## 6. What was built, 2026-11-02

Both parts are in the kit. Nothing is committed.

### 6.1 Where the build differs from this plan

| # | The plan said | What was built | Why |
|---|---|---|---|
| 1 | A2: a row that holds a requirement and something else is a Requirement, "and is never split" | "A row that holds a requirement and its reason is a Requirement." | prd-author now cuts each client row into its requirements first, one requirement per row. So "never split" no longer holds. A reason stays with its requirement, as the cutting table already says. |
| 2 | The gate's "I don't know yet": the kinds are used, marked Proposed | The kinds are used as they are, and the rows go on the list for the client to confirm | It is the same as the answer to "Do the simple words say the same as the client's words?". A kind marked Proposed would need its own question number in the cell. |
| 3 | The "holds" line always says "and {n} rows of purpose, scope or way of working" | It says so only when there is at least 1 such row | A PRD with only Requirement rows reads as before |
| 4 | Not in the plan | check-features.cjs also finds a feature that covers a Purpose, Scope or Way of working row | That row needs no feature, so a feature for it is made up |
| 5 | B3: the simple words keep the word, and name the question | The check allows a word that can't be checked in a line or cell that names its question, such as "as needed, question 9" | Without this, B3's own form would fail the check |
| 6 | "and so on" is on the new list | It is on the list. The check allows it right after 2 items that show the pattern, such as "F-01, F-02 and so on". | The approved Glossary templates say "L1, L2 and so on", and must stay word for word. Four other kit lines were reworded to "from … onward". |
| 7 | Not in the plan | copy-wording.cjs reads the simple words from the "In simple words" column by its name | It read the PRD's second column, which is now Kind |
| 8 | Not in the plan | The gate's list of where a document goes beyond the client's words skips the Kind cell | It showed "Requirement" in place of the requirement's words |

### 6.2 The files

| Part | Files |
|---|---|
| A | `prd-author/SKILL.md`, its checklist, `templates/prd.md`, `examples/prd.md`, `fixtures/mcp-slice/mcp-slice-prd.md`, `feature-author/SKILL.md`, its `references/feature-catalog.md`, `templates/feature-catalog.md`, `tools/lib/check-document.cjs`, `tools/check-prd.cjs`, `tools/check-features.cjs`, `tools/copy-wording.cjs` |
| B | `prd-author/SKILL.md`, its checklist, `probing-questions-author/SKILL.md`, its `references/probe-dimensions.md`, `quality-characteristics.md`, `simple-writing-rules.md`, `tools/lib/simple-writing.cjs`, `story-groomer/references/story-grooming.md` |
| The "and so on" rewording | `templates/parts/decision-record.md`, `templates/discovery-brief.md`, `glossary/templates/gate-log.md`, `frd-author/references/conventions.md`, `feature-author/references/feature-catalog.md`, `tools/check-features.cjs` |

### 6.3 Tests

New tests, each passing on a copy of the kit with plain line endings:
- `requirements.test.cjs`: a kind that isn't one of the four, a Scope row that traces to a business requirement, a journey step that names a Scope row, a Purpose row that passes, a PRD with no Kind column, a word that can't be checked with no question, and the same word passing when its question is named
- `features-and-epics.test.cjs`: a Scope row needs no feature, and a feature or a coverage row for it is a finding
- `simple-writing.test.cjs`: the new list in the simple words and not in the client's words, "and so on" after a pattern, and the kind of each PRD row

On this PC, every test file has the same failures as before the build, and no new ones. The one new test that fails on this PC fails only because of the line endings, like the tests next to it.

### 6.4 What this means for a PRD already accepted

A PRD with no Kind column passes every later check, because each row is read as a Requirement. check-prd.cjs gives it one finding, which says how to add the column. That check runs only at the PRD's gate, so an accepted PRD gets the column through its next change.
