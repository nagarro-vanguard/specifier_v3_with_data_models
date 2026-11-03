# The change tool: the plan

Status: stitched into the kit on 2026-11-03, steps S1 to S15, with all 572 tests passing. Not committed. Left: the tool's own test run, in S16.

*The examples are for a made-up library app: members borrow books, and each borrowing is a Loan.*

---

## 1. The flow

**change request → disposition → impact → affect → acknowledge → orchestration**

| # | Step | What happens | Example | Done by |
|---|---|---|---|---|
| 1 | Change request | you call it in your own words, one request or several | change request: a loan can be extended twice, not once | `change-request-workflow` |
| 2 | Disposition | what type of change it is, then a second reader challenges it | changes something: the extend limit goes from 1 to 2 | `change-request-disposition` (new), then `adversarial-check` |
| 3 | Impact | everything it touches, and how big it is, as a hint | the requirement, the data model, 1 FRD rule, 1 story, 2 tests. Small. | `change-impact-author`, made smaller |
| 4 | Affect | for each thing touched: no change, update or new story, with the exact edit | FRD rule: "not more than once" becomes "not more than twice" | `feature-impact`, unchanged |
| 5 | Acknowledge | you see it all, and say yes once | yes | `change-request-workflow` |
| 6 | Orchestration | enters at the right step for the type, runs each update, closes the change | starts at the requirements, then the data model, the FRD, the story and the tests | `change-orchestration-workflow` (new), which starts by itself |

**Two workflows, split at your yes.** Before your yes, no document changes. After it, documents change. If the updates stop halfway, the second workflow can be started again on its own.

---

## 2. Your calls

| # | Your call |
|---|---|
| 1 | You call the tool by name: "change request" or "new request". The name is a hint. The tool still works out the type. |
| 2 | One yes covers all. No update asks "accept?" again. |
| 3 | Size is a hint for priority. It never pauses other work. |
| 4 | Several requests go together, and close together. |
| 5 | The data model never changes a requirement. It flags a clash, you answer, and the answer goes to the FRD. *Built by the other session.* |
| 6 | The latest document wins, with a note. Nothing goes back. *Built by the other session.* |
| 7 | Each step has one job. |
| 8 | Reuse your past work as much as possible. |
| 9 | Step 2 is a skill called `change-request-disposition`. |
| 10 | Two workflows: `change-request-workflow` and `change-orchestration-workflow`. |
| 11 | The tool gets a test run of its own. |
| 12 | No undo. A reversal is a new change request, like any other. |
| 13 | When an update finds something the analysis didn't list, it stops and asks you: add it to this change, or leave it for a new one. |
| 14 | The second reader quotes its source, and a program checks the quote is in that file. |
| 15 | When a finding needs your answer, the tool asks you, and doesn't guess. |
| 16 | A fixed rule decides pass or fail, not the AI. |
| 17 | In the test run, each request is analysed 3 times, and the answers are compared. |

---

## 3. The drafts, ready to stitch

| Draft | Steps |
|---|---|
| `_change/drafts/change-request-workflow/SKILL.md` | 1 to 5. It replaces `requirement-update-workflow`. |
| `_change/drafts/change-request-disposition/SKILL.md` | 2 |
| `_change/drafts/change-orchestration-workflow/SKILL.md` | 6 |

---

## 4. Stitching them in

**Before stitching:** no other session is editing the kit, and everything is committed.

| # | What | Files |
|---|---|---|
| S1 | Move the three drafts into `.claude/skills/`. Remove `requirement-update-workflow`. | 3 new skills |
| S2 | Make `change-impact-author` smaller: only where it lands, what's linked and how big. Its type-of-change part, its challenge and its gate move out. Move its two references to `change-request-disposition`. | `change-impact-author` |
| S3 | A change mode with no "accept?" in each skill a change can reach. Each one says what it may do alone, and when it must stop. | 13 skills |
| S4 | A change mode for the 2 skills that have none | `glossary-disposition`, `epic-author` |
| S5 | Two new programs: `next-change-step.cjs` and `change-summary.cjs` | `tools/` |
| S6 | Size as a hint: `park.cjs` no longer runs for a change, and `recommend.cjs` no longer puts it first | `recommend.cjs`, `park.cjs` |
| S7 | Several requests in one change: section 1 of the report holds each request, numbered, with its name | the report template, `check-change-report.cjs` |
| S8 | The section writers in the report template: sections 5 and 7 to 10 move to `change-request-disposition`, section 13 to the workflow, section 15 and 16 to the workflow | the report template, `check-change-report.cjs` |
| S9 | Gap G1: check that the report's restated asks use the Glossary's words | `check-change-report.cjs` |
| S10 | Gap G2: flag a line that moves between scope and requirement in a new version of a client's file | `compare-versions.cjs`, `change-request-disposition` |
| S11 | The new names everywhere: 16 files name `requirement-update-workflow` today | skills, README, `master-plan.md`, `recommend.cjs`, 2 test files |
| S12 | The library examples in the change skills | the change skills, the report template |
| S13 | The kit's rule "nothing runs the whole flow in one go" gets one exception: making the updates of a change you said yes to | `master-plan.md`, `conventions.md` |
| S14 | Calls 14 to 16: each finding of the second reader has a quote, what it would change, and who can fix it. Its verdict line is written by the check, not by the reader. | `adversarial-check`, the report template |
| S15 | Calls 14 and 16 in the check: each quote is found word for word in its file, and the verdict is worked out from what each finding would change | `check-change-report.cjs` |
| S16 | The tests, then the tool's own test run. Call 17: each request in the test run is analysed 3 times, fresh, and the type, where it lands and the linked items are compared. | `tools/tests/`, the test run |

---

## 5. The gaps, explained

| # | The gap | Example | What goes wrong today |
|---|---|---|---|
| G1 | Nothing checks that the tool turns your words into the Glossary's words | You write "a borrower can renew twice". The Glossary says Member and Extend. | The tool searches for "renew", finds nothing, calls it brand new, and misses the FRD rule and its tests. |
| G2 | A line that moves from scope to requirement isn't flagged | Version 1: "The library may later support reserving books." Version 2: "Members must be able to reserve a book." | It is treated as new wording. Reserving gets no feature and no stories, so nobody builds it. |
