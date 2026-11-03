# Simple writing plan

Archived on 2026-11-02, in `_archive/root-notes-2026-11-02/`. Its open items moved to `_data_model/data-model-stitching-plan.md`, part 10, "Left for later". Its run on continuum is the stitching plan's fresh trial, in its part 8.

> **What this is:** The plan to make the kit's documents easy to read for people whose first language isn't English. It lists every file the work changes. It also says:
> - how the rules fit the workflows
> - what you see at each gate
> - what happens when the check finds a problem
> - how the run on continuum goes, step by step
>
> **What it is not:** The rules themselves. They are in the kit, in `.claude/skills/_shared/simple-writing-rules.md`. The check is `tools/lib/simple-writing.cjs`, and `tools/check-simple-writing.cjs` runs it on one file. This plan stays at the top of the folder as a working note.

## 1. What you decided

| Question | Your answer |
|---|---|
| Keep the client's exact words in the PRD? | Yes, in a second column. The first column holds simple words, as simple as the examples in part 7. |
| Copy the client's words into a requirement anywhere? | No, in no document. They are kept only where part 4 of the rules says. This follows BABOK v3. |
| Where do the writing rules go? | In their own file, `simple-writing-rules.md`. Every author file points to it. `conventions.md` gets no writing rules. |
| How are the documents already written fixed? | A full run, starting from the PRD. |
| Which project? | continuum, using the documents it has today. |
| In what order? | The order the workflows meet the documents: PRD, Glossary, Feature catalog, EPICs, FRDs, then EPIC briefs and stories. |
| File names? | Lowercase, with hyphens. |

## 2. Where it stands

**Done, in the kit, on 2026-10-30.** Any session that runs a skill now uses the rules:
- `_shared/simple-writing-rules.md` holds the rules, the BABOK reasons, the word lists and the kit names kept for now.
- Every author skill points to it.
- `tools/lib/simple-writing.cjs` is the check. 9 check programs run it before their gate. `tools/check-simple-writing.cjs` runs it on any one document, such as a Glossary page.
- The PRD has two columns, "In simple words" and "The client's words". FRDs copy the simple words. No document copies the client's sentences into a requirement.
- Every template, Glossary template and example passes the check, its Placeholders table included.
- `tools/tests/simple-writing.test.cjs` has 12 tests, and all pass. Every other test file passes exactly the tests it passed before the change.

**What changes for a session working now:**
- A document in hard English fails its check program. The skill fixes what the check lists before the gate.
- A PRD in the old form, with one "Requirement as written" column, is a finding. The programs still read it, so later steps don't break.
- The project's agreed Glossary words are always allowed, even when a word list has them.

**Done on 2026-11-02:** the quick check after every file a skill writes, in every skill. This was step 8 of the build in `_data_model/data-model-stitching-plan.md`, part 7. It is built, and not committed.

**Not done yet:**
- The run on continuum, from the PRD: part 8, steps 7 onward. The stitching plan's fresh trial does this run, in its part 8. It is step 14 of that build.
- Decision 2 in part 9, and the follow-ups in part 10 that are still open. They moved to the stitching plan's part 10, "Left for later". Decision 1 in part 9 is settled: part 3.3 records your decision, and `simple-writing-rules.md`, part 4, holds the rule. The follow-up on the data model drafts is done, in steps 2 and 8 of the build. The follow-up on the approved copy of the Glossary method is done too: its test now passes.

## 3. Affected files

Paths start at `.claude/skills/`, unless they start with `tools/`, `fixtures/` or name a file in this folder.

### 3.1 New files

| File | Made from |
|---|---|
| `_shared/simple-writing-rules.md` | the draft rules file |
| `tools/lib/simple-writing.cjs` | the draft check |
| `tools/tests/simple-writing.test.cjs` | new tests for the check |

### 3.2 Files that copy the client's words: these must change

| File | What changes |
|---|---|
| `_shared/conventions.md` | Parts 3, 5, 8 and 15 say that the BRD and PRD keep the client's own words. They also say that an FRD quotes a requirement. Only those lines change. No writing rules are added. |
| • `_shared/templates/prd.md`<br>• `_shared/examples/prd.md` | Section 4 is now called "Requirements". It gets 2 columns: "In simple words" and "The client's words". The opening and the guidance lines stop saying "word for word". |
| `prd-author/SKILL.md` | Its description, "What this is" and step 4 change. The line "recorded, not judged" goes: the simple words are now checked by Q1 to Q10. |
| `prd-author/references/prd-checklist.md` | "Every requirement is word for word" becomes "in simple words, with the client's words next to it". |
| • `frd-author/SKILL.md`<br>• `frd-author/references/conventions.md`<br>• `_shared/templates/frd.md` | An FRD lists each requirement in the PRD's simple words, not the client's. |
| • `brd-author/SKILL.md`<br>• `_shared/templates/brd.md`<br>• `_shared/examples/brd.md` | Their opening lines describe the PRD as "word for word". |
| • `discovery-author/SKILL.md`<br>• `_shared/templates/discovery-brief.md`<br>• `_shared/examples/discovery-brief.md` | "What now holds" copies the winning file's words. It becomes simple words. The quotes from each file stay, as notes. |
| `_shared/decision-review-gates.md` | A requirement is named from the column "Requirement as written". It becomes "In simple words". |
| • `feature-author/references/feature-catalog.md`<br>• `_shared/templates/feature-catalog.md` | The coverage table names each requirement by the client's title. It uses the simple title. |
| `tools/check-prd.cjs` | It reads the old heading and the old column. |
| `tools/check-frd.cjs` | It checks an FRD's requirement against the client's words. It checks against the simple words. |
| • `tools/copy-wording.cjs`<br>• `tools/recommend.cjs` | They copy a requirement's wording from the PRD to each FRD. They copy the simple words. |
| • `tools/check-features.cjs`<br>• `tools/check-stories.cjs`<br>• `tools/traceability-map.cjs` | They find the PRD's requirements by the old heading. |
| `tools/check-discovery-brief.cjs` | It checks that "What now holds" is the winning file's words. |
| `tools/tests/`: foundation, requirements, frd, requirement-update and stories tests | They build PRDs with the old heading and columns. |
| • `fixtures/mcp-slice/mcp-slice-prd.md`<br>• `fixtures/expense-claims/frd/frd-claim-approval.md` | Test documents with the old columns, or with the client's words quoted. |

### 3.3 Copies of our own words: these stay word for word

These copy one kit document into another, so one rule has one wording everywhere. BABOK 5.1 asks that each requirement can be traced, and 7.2 asks that requirements don't conflict. Two wordings of one rule can conflict. Once the first document is simple, its copies are simple too. **Your decision:** keep these as they are.

| What is copied | Files |
|---|---|
| The EPIC grouping, into the EPIC register | • `_shared/templates/epic-register.md`<br>• `tools/check-register.cjs` |
| The register's outcome and the catalog's descriptions, into the EPIC brief | • `_shared/templates/epic-brief.md`<br>• `tools/check-epic-brief.cjs` |
| The catalog's descriptions, "Done when" pieces and gate conditions, into the FRD | • `frd-author/references/conventions.md`<br>• `_shared/templates/frd.md`<br>• `tools/check-frd.cjs` |
| The Story list's statement, and the FRD's rules and flow steps, into each story | • `_shared/templates/story.md`<br>• `_shared/templates/story-list.md`<br>• `story-drafter/SKILL.md`<br>• `story-groomer/SKILL.md` and `references/story-grooming.md`<br>• `tools/check-stories.cjs` |
| The Glossary's definitions, into the data model | `_data_model/data-model-design.md` and `_data_model/data-model-template.md` |

### 3.4 Exact quotes kept as evidence: no change

BABOK 10.18 keeps a document's exact details in the analyst's notes, and 4.3 checks results against their source.

| Evidence | Files |
|---|---|
| The Discovery brief's quotes from each file | • `discovery-author/SKILL.md`<br>• `tools/check-discovery-brief.cjs` |
| The Glossary's `deep-dives/` pages | • `_shared/glossary/output-formats.md`<br>• `_shared/glossary/lens2-topology.md`<br>• `_shared/glossary/lens3-choreography.md`<br>• `_shared/glossary/templates/section-glossary.md`<br>• `_shared/glossary/templates/section-decisions.md` |
| A Change impact report's old words and new words, and your statement | • `_shared/templates/change-impact-report.md`<br>• `requirement-update-workflow/SKILL.md`<br>• `adversarial-check/SKILL.md` |
| Glossary checks skip quotes | `glossary-check/SKILL.md` |

### 3.5 Files that point to the simple writing rules

**Every author skill** gets one line, "This skill follows `../_shared/simple-writing-rules.md`", and its own changes from part 7:
- `discovery-author`
- `brd-author`
- `prd-author`
- `probing-questions-author`
- `glossary-author`
- `glossary-check`
- `glossary-disposition`
- `feature-author`
- `epic-grouping-author`
- `epic-author`
- `frd-author`
- `story-drafter`
- `story-groomer`
- `ac-author`
- `change-impact-author`
- `feature-impact`
- `adversarial-check`
- in `_data_model/`, the data model drafts: `things-author` and `data-model-author`

**Shared files:**
- `_shared/decision-review-gates.md`: gate messages follow the rules. It also says where the check's results show, and adds the PRD's "same meaning" decision.
- `_shared/quality-characteristics.md`: Q4, Q7 and Q10 point to the rules.
- the Glossary method: `lens1-ontology.md`, `otc-run-rules.md`, `glossary-assembly-principles.md` and `method-words.md`
- the guidance lines in every template, in `_shared/templates/` and `_shared/glossary/templates/`

**Programs:**
- `tools/lib/check-document.cjs`: one shared call, as its `rendering()` calls `md-lint.cjs` today
- 9 check programs make that call: `check-discovery-brief`, `check-brd`, `check-prd`, `check-features`, `check-epic-grouping`, `check-epic-brief`, `check-frd`, `check-stories` and `check-change-report`. `check-register` doesn't: it only checks that the register copies the grouping, and the grouping is checked itself.

### 3.6 Not about wording: no change

Some lines say "exactly as" about the kit's own steps and records, not about the client's words:
- "Hold the gate exactly as `decision-review-gates.md` says"
- "pasted exactly as the program printed it"
- an opening "copied from the template exactly"
- decision options "exactly as offered"
- Glossary template headings "copied exactly"

## 4. How the rules fit the workflows

No workflow gets a new step. The rules work inside steps that already run:
- **When a skill writes:** each author skill follows `simple-writing-rules.md`, so its first draft is simple.
- **Before each gate:** each check program runs the check, as it runs `md-lint.cjs` today. So the check runs in every workflow, including a change.
- **glossary-author** has no check program, so it runs the check on its pages before each gate.
- **One limit:** messages at a gate are not documents. For them, the rules are an instruction to the skill, and no program checks them.

## 5. What you see at each gate

The order stays as `decision-review-gates.md`, part 3, says:
1. **The check program's block,** with a new part. For example:

   > **Simple writing: 0 to fix, 4 to look at.**
   > - REQ-2.3, In simple words: a sentence of 24 words: "A person writes the goal in their own words, and…"
   > - REQ-4.6: the client's words have 3 words such as "no" or "not", and the simple words have 2.

   "To fix" is always 0 at the gate, because the skill fixes those first.
2. **The questions,** in the usual order. This includes any question raised because a phrase had two meanings.
3. **For the PRD only: "Do the simple words say the same as the client's words?"** This is BABOK 4.3, Confirm Elicitation Results. The answers:
   - **They all say the same.** The PRD can be accepted.
   - **Some need changing.** You name the rows. The skill rewrites only those, checks again, and comes back.
   - **Show me one section at a time.** You get one decision for each section of the PRD.
   - **I don't know yet.** The simple words are used, and every row goes on the list for the client to confirm.
4. **The gate's own question,** such as "Accept the PRD?"

## 6. When the check finds something

| What the check finds | Who fixes it | When | What you see |
|---|---|---|---|
| A word from a list, a semicolon or a side note | the skill, using the list's "Say instead" | before the gate | nothing |
| Simple words that are the client's words, copied | the skill writes them in simple words | before the gate | nothing |
| A phrase with two meanings | the skill raises a question | before the gate | the question, at the gate |
| A long sentence | the skill splits it if it can | before the gate | any that are left, as "to look at" |
| A lost number, or a lost "no" or "not" | the skill puts the fact back | before the gate | any that differ on purpose, as "to look at" |
| A row you think is wrong | the skill rewrites only the rows you name | at the gate | the same gate again |
| A hard word the list doesn't have | you name it, and it goes on the list | any time | the check finds it everywhere from its next run |
| A listed word that is fine where it is used | you narrow or remove that row of the list | any time | the check stops flagging it |
| A hard Glossary word | the skill suggests a simpler word | the Glossary's Gate 1 | your choice. The old word stays as "also written as". |

## 7. Before and after

### 7.1 What the check finds today

The PRD row counts the client's words, because today they are the only words a reader has.

| Documents | To fix | Long sentences | Expected after |
|---|---|---|---|
| PRD, all text | 262 | 105 | 0 to fix |
| PRD, only the text the kit writes | 58 | 30 | 0 to fix |
| Glossary, 7 pages | 136 | 54 | 0 to fix |
| Feature catalog | 265 | 117 | 0 to fix |
| EPIC grouping and register | 110 | 49 | 0 to fix |
| EPIC briefs, 12 | 213 | 109 | 0 to fix |
| FRDs, 16 | 366 | 189 | 0 to fix |

"Artifact" is the word found most often. It is a Glossary word in continuum. So the Glossary's Gate 1 settles it, not the word list.

### 7.2 How lines will read

The examples come from continuum, because that is where the problems were seen.

| Document | Before | After |
|---|---|---|
| PRD, REQ-1.2 | Efforts are kept in one place, where a person starts a new one or resumes an existing one; each project is one modernization (its goal, team, repositories, analysis, and plan), each carrying its status and the step it has reached. There is no shared provider pool across efforts. | • Each modernization is one project.<br>• A person starts a new project, or opens one that exists.<br>• A project holds its goal, team, repositories, analysis and plan.<br>• A project's status is the step its work has reached.<br>• Projects don't share AI providers. |
| PRD, REQ-1.5 | One project's configuration is managed in one place: its status, its members (read-only here, managed in Setup), and its one provider, rotating the key or changing the provider. There is no test or verify step, no first-run gate, and no default or backup provider. | • A person sees a project's status, members and provider together.<br>• Members can be seen but not changed. They are changed in the Setup step.<br>• A person can replace the provider's key, or change the provider.<br>• The product does not test the key.<br>• There is no default or backup provider.<br>• Question: can a person use a new project before a key is added? |
| Glossary, Provider | The AI provider, with its key, that powers a project's AI work, set one to one on the project. | The AI service, and its key, that does a project's AI work. Each project has exactly one. |
| Glossary, top of each page | Candidate: A word Ontology keeps for judging. It is not yet a term. | Removed from reader pages. Kept only in `deep-dives/`. |
| Feature catalog, F-02 | Project as the one place | Start or open a project |
| EPIC register, EPIC-001 | …so that the work has one attributable, AI-ready home. | …so that the team keeps each system's work in one project, knows who decided what, and can use the AI. |
| FRD, F-01.3 | attribute every decision downstream to the named person who signed in | record the name of the signed-in person on every later decision |
| Story template, sizing line | A sizing alert appears here, before everything else, only when… five or more scope items, eight or more rules… | A sizing alert comes first in this section, only when… 5 or more scope items, 8 or more rules… |

## 8. The run, step by step

Each step is one activity, and each one ends with your review. Steps 1 to 3 are done, as drafts.

| # | Step | Needs first | Ends with | Before → after |
|---|---|---|---|---|
| 1 | Write the rules and word lists | your decisions | `simple-writing-rules.md` | done, as a draft |
| 2 | Build the check | the rules | `simple-writing-check.cjs`, tested on samples | done, as a draft |
| 3 | Count today's problems | the check | the counts in part 7.1 | done |
| 4 | Move the rules file and the check into the kit | your go-ahead | the files in part 3.1 | done |
| 5 | Point every author file and check program to the rules | step 4 | the files in part 3.5, and no test that passed before fails | done |
| 6 | Stop copying the client's words | step 5 | the files in part 3.2, and no test that passed before fails | done |
| 7 | Run prd-author on continuum | step 6 | a new PRD, and its gate with you | 262 → 0 |
| 8 | Change the Glossary's rules | the PRD accepted | its method files, templates and skill changed | – |
| 9 | Run glossary-author on continuum | step 8 | Gate 1 and Gate 2 with you | 136 → 0 |
| 10 | Change the Feature catalog's rules | the Glossary accepted | its skill, template and program changed | – |
| 11 | Run feature-author on continuum | step 10 | its gate with you | 265 → 0 |
| 12 | Change the EPIC grouping and register rules | the Feature catalog accepted | their skills, templates and programs changed | – |
| 13 | Run epic-grouping-author and epic-author on continuum | step 12 | the grouping's gate with you, and the register's copy check | 110 → 0 |
| 14 | Change the FRD's rules | the EPIC register written | its skill, template and program changed | – |
| 15 | Run the FRD workflow on continuum, one capability at a time | step 14 | one gate with you for each FRD | 366 → 0 |
| 16 | Change the EPIC brief and story rules | every FRD accepted | their skills, templates and programs changed | – |
| 17 | Run the stories workflow on continuum, one EPIC at a time | step 16 | the EPIC brief and story gates with you | 213 → 0 for the briefs. Stories are new, and start at 0. |

## 9. Decisions still open

1. **Copies of our own words** (part 3.3): keep them word for word? Recommended: yes, so one rule has one wording. The kit now works this way. Say if you want it changed.
2. **The BRD:** the PRD's traceability matrix repeats each business requirement's words from the BRD. The BRD is not in the run, so those words stay hard. Either start the run from the BRD, or show only the IDs in the matrix. This is needed before step 7.

## 10. What to watch

- **Each run step replaces a continuum document.** The accepted copy stays in the version log. For the PRD, `version-log/continuum-prd/v1.md` is the same as today's file.
- **The data model drafts depend on the Glossary.** The files in `glossary/data-models/` are built on today's Glossary. After step 9, they need writing again.
- **The continuum documents keep their file names.** The kit's programs find them by name.
- **Today's PRD already has 4 findings** from `check-prd.cjs`: decisions marked Proposed that name no question. The new run fixes them.

**Follow-ups, each a change of its own:**
- **Glossary method words on reader pages.** The top of each Glossary page still explains the method's own words, such as Candidate and Ontology. Moving them to `deep-dives/` changes the Glossary method, `glossary-assembly-principles.md`, G4.
- **"Families at a glance".** The Glossary method defines this name, and the data model design uses it. It stays on the "Kit names kept for now" list until the method renames it.
- **The data model drafts** in `_data_model/`, `things-author` and `data-model-author`, don't point to the rules yet. Another session was editing them, so they were left alone.
- **Program messages.** The check programs' own messages, such as their findings, are read at the gate too. They are not checked yet.
- **The `mcp-slice` test data** keeps its real client wording, on purpose. Its "In simple words" column holds the client's words.
- **The approved copy of the Glossary method**, in `fixtures/approved-glossary-method/`, now differs from the method in more places. Its test already failed before this change.
