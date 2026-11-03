# Test fixtures

> **What this is:** The test data the programs and skills are tested on.
>
> **What it is not:** A real project. The tests copy it to a temporary folder and never change it.
>
> **Who uses it:** The tests in `tools/tests/`.

## `mcp-slice/`: one section of a real requirement

A project folder called `mcp-slice`, laid out as `.claude/skills/_shared/project-folders.md` says. It holds one section of a real requirement, its Setup section, carried through an earlier way of working, so the programs are tested on real material as well as the made-up one.

| File | What it holds |
|---|---|
| `sources/mcp-requirements-v4.md` | the requirement file, whole |
| `mcp-slice-prd.md` | the Setup section's six requirements, each with its source. Its "In simple words" column still holds the client's words: this test data tests the programs on real material, not the writing. |
| `mcp-slice-question-log.md` | the questions the documents below raised, each with its ratings and its answer where it has one |
| `frd/feature-catalog.md` | the six features that cover the Setup section, each with its capability and its "Done when" pieces |
| `frd/frd-team-and-roles.md` | the FRD for Team & roles, with its rules and its 13 decisions |
| `epics/register.md` | the EPIC that holds the Setup features |
| `epics/EPIC-003-source-and-team-setup/story-list.md` | that EPIC's twelve stories, each drafted |
| `epics/EPIC-003-source-and-team-setup/`:<br>• `add-team-member.md`<br>• `set-member-status.md`<br>• `import-members-in-bulk.md` | three of its Stories, with no grooming or acceptance criteria yet |

### What the slice shows on purpose

- **Gaps that name no question.** The PRD and the EPIC register were written before every gap had to name its question, so `grade-questions.ts` reports their TBDs. The tests use this to check that a lost gap is found.
- **An answer that starts with "No".** The FRD's Decision 5 was worded before answers had to be the real choices, so the grader reports question 4.

### What the slice doesn't have

- **A Discovery brief and a BRD.** Their checks are tested on the worked examples in `.claude/skills/_shared/examples/`.
- **A Glossary and an EPIC grouping.** The glossary tests build a Glossary of their own, and the features and EPICs tests use `expense-claims/`.
- **An FRD in the kit's shape.** The slice's FRD keeps the shape it was written in: its decisions are asked at "Step 1" and "Step 2", and its Coverage section has an earlier name. The FRD checks are tested on `expense-claims/`.
- **NFRs, transition requirements and acceptance criteria.** The tests check those links on small documents they build themselves.

## `expense-claims/`: the later documents of the worked example

The documents after the PRD, for the made-up Expense claims product, built from the worked PRD in `.claude/skills/_shared/examples/`. The tests copy the worked examples and this folder into one project, `expense-claims`.

| File | What it holds |
|---|---|
| `frd/feature-catalog.md` | five features covering the PRD's five requirements, in two capabilities. Section 5 gives each of the data model's 24 actions and moves to a feature. 10 of them were settled at the catalog's gate, so its Decision record holds 10 decisions. |
| `epics/grouping.md` | two options, option A chosen, with its EPIC brief list |
| `epics/register.md` | the chosen grouping, copied into two EPICs |
| `frd/frd-claim-approval.md` | the FRD for Claim approval: two features and 12 rules. 7 rules come from the "Done when" pieces, and 4 from the data model. 1 rule is suggested, and waits for a decision. |
| `epics/EPIC-002-claim-approval/` | the EPIC brief, the Story list and three ready Stories of Claim approval, whose scenarios prove all 12 rules |
| `glossary/` | the four kind pages, each with its terms, and two retired words for Claim |
| `glossary/data-models/` | the accepted data model: the things file, `claims.md` for the one family, and the decisions file with 9 settled decisions. Claim, Expense line and Receipt are its things. A claim's stage moves from Draft to Paid, and a claim's amount holds the answer in use for question 4. |
| `changes/001-finance-limit/` | the Change impact report of change 001, the finance limit going up from 500 to 1,000, analysed and checked, waiting for your decision. Sections 12 to 15 are what the programs give when the documents up to the Claim approval FRD are accepted and EPIC-002's stories are still being written. The data model is among the accepted documents. |

## `approved-glossary-method/`: the glossary method, as approved

The glossary method's files exactly as they were approved, never edited. The tests compare the kit's copies with them line by line. Its own README lists each file.

## `old-change-impact-skill/`: the old kit's change-impact skill

The old kit's change-impact skill exactly as it was, never edited. A test compares `feature-impact` with it line by line.
