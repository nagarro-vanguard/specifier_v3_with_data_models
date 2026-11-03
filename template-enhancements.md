# Template enhancements

> **What this is:** Enhancements to the Story template (`templates/story.md`) and the skills and checks that write and read it, found on 2026-10-27 from the specifier's review and the team's feedback on the first stories pushed to GitHub (issues 85-89: Create, Browse, Search, Open and Delete a project).
>
> **What it is not:** Bugs in the check programs (those are in kit-findings.md), or how a gate is presented (`_archive/root-notes-2026-11-02/GATE-UX-ENHANCEMENTS.md`, all done).

## Context

A story file has two readers:

- **The team**, reading the story as a GitHub issue. They want it short: what to build, what it depends on, the rules, and the tests.
- **The kit's programs**, reading the story file. `check-stories.cjs` checks it before each gate, `coverage-check.cjs` proves every rule is tested, `traceability-map.cjs` links tests to rules, and `find-linked.cjs` uses those links to find what a change affects.

The team's feedback removed and reshaped parts of issues 85-89 by hand. Most of the edits are right for the first reader. Some break the second. Each enhancement below says which.

The team's edited issues no longer match the template, so `check-stories.cjs` and `coverage-check.cjs` will fail on them until the template and checks are changed to match the enhancements accepted here.

## Enhancements

### 1. Quote FRD flow steps word for word, with the FRD's own numbers

- **Found:** "FRD flow steps covered" listed step numbers only, such as `• 3`. A reader had to open the FRD to see what step 3 was. The team rewrote the steps in plain words, but renumbered them from 1 in each story: Delete a project covered FRD-4a steps 21-26 and now shows 1-6; the same happened in Browse (11), Search (12-14) and Open (15-20). Those steps can no longer be found in the FRD by number.
- **Done:** the section is now one row per step, `FRD | Step | Flow step`, the step's text quoted word for word from the FRD with its rule tag, and the FRD's own step number. An alternate step's Step reads `Alternate`. `check-stories.cjs` flags a step the FRD hasn't got, a quote that isn't word for word, and a step given by number with no text.
- **Also found by it:** the fixture story "Reject a Claim" pointed at step 3, which is "The line manager approves it". It now quotes the three rejection alternate steps.
- **Touches:** `templates/story.md`, `story-groomer/SKILL.md`, `story-groomer/references/story-grooming.md`, `_shared/conventions.md` (section 3), `tools/check-stories.cjs`, `tools/tests/stories.test.cjs` (3 new tests), the three EPIC-002 fixture stories.
- **Verified:** `stories.test.cjs` passes 36 of 36 with LF line endings; every other suite gives the same result as before the change.
- **To do:** issues 85-89 need their step numbers put back to the FRD's.
- **Status:** done 2026-10-27, then replaced by enhancement 2 on 2026-11-02: the flow-steps table is gone, and each rule carries its step in the Rules table instead.

### 2. Merge the flow steps into the Rules table

- **Found:** the FRD tags each flow step with exactly one rule, and every rule appears in the flow. So the steps' text repeats the rules: rule F-05.2 "let a finance approver approve a claim over 500" and step 6 "The finance approver approves it *(F-05.2)*". Quoting both in a story shows the same thing twice. What a step adds is only its order and whether it is on the main path or an alternate.
- **To do:** drop the separate "FRD flow steps" section. Add a Step column (the FRD's step number, or `Alternate`) to the Rules table, and list the rules in flow order.
- **Touches:** the same files as enhancement 1.
- **Status:** done 2026-11-02, not committed. `check-stories.cjs` checks each rule's Step against the FRD flow step tagged with it, and that the rules are in flow order. 3 tests replace the 4 flow-step tests.

### 3. Check that a story's rules and flow steps agree

- **Found:** "Reject a Claim" listed rules F-04.3, F-04.4 and F-04.6, but its flow step was tagged F-04.2. No check compared the two.
- **To do:** in `check-stories.cjs`, every rule tag on a quoted step must be in the story's Rules table, and every rule in the table must have a step.
- **Note:** not needed if enhancement 2 is taken, because one table can't disagree with itself.
- **Status:** not needed: enhancement 2 is done.

### 4. Report when a feature is done, from its "Done when" pieces

- **Found:** the "Done when" pieces are used up to the FRD: every piece must be proved by a rule (`check-frd.cjs`), they set the FRD's In and Out gates, and they are in the trace map. After the FRD, stories and acceptance criteria only name rules. Nothing reports "F-04 is done: dw1, dw2 and dw3 are each tested by a ready story".
- **Why not write acceptance criteria from the pieces instead:** the rules cover more. F-04 has 3 pieces and 6 rules; F-04.5 (send each claim to the claimant's own line manager) comes from the requirement text and F-04.6 (send a rejected claim again) from a decision, so neither is in the Done when. And every piece already has a rule, so testing every rule tests every piece.
- **To do:** extend `coverage-check.cjs`, and the Story list's Coverage table if it fits, to show per feature: each piece, the rules that prove it, the scenarios that prove those rules, and whether the feature is done.
- **Status:** proposed.

### 5. Take the opening notes and italic guidance out of every document; strip citations for GitHub

- **Found (team):** the who-wrote-it notes (What this is, What it is not, Written by, Lineage) and the italic line under every heading mean nothing to a developer picking up the story.
- **First verdict (2026-10-27):** right for GitHub, wrong for the files: keep both in the files, and strip them only in a reader's copy.
- **Changed (specifier, 2026-11-02):** take them out of the templates, and so out of every document. They are notes for the writer, not the reader.
- **Also strip the citations (specifier, 2026-10-30):** the reader's copy drops the citations, such as "— per BR-12" and file names with section numbers. The files keep them, because the programs and the trace map use them to link each fact to its source. Citations in gate messages are the same idea, in `_archive/root-notes-2026-11-02/GATE-UX-ENHANCEMENTS.md`, item 10.
- **Status:** done 2026-11-02, not committed.
  - **Templates:** the 12 document templates open with their title, then their status line. Each template's notes moved to its Placeholders part, which is never copied into a document: "About this template" (what it is, what it is not, who writes it) and "What each section holds" (every italic line, with its rules). The Lineage block is gone, with the labels only it used. The three part templates in `templates/parts/` keep their notes: they are rules about a shape, never copied into a document.
  - **Documents:** the 4 examples and 19 fixture documents lost their notes and italic guidance. Content in italics, such as an FRD's "Alternate" flow steps, stays.
  - **Programs:** `lib/check-document.cjs` checks for the status line, and flags an opening note left in. `check-stories.cjs` flags one in a story. `check-frd.cjs` and `check-discovery-brief.cjs` no longer check the Lineage block. `build-sequencing-mapping.cjs`, `track-change.cjs` and `version-log.cjs` open their documents with one line saying which program writes them. `grade-questions.cjs` writes an empty group cleanly with no italic line.
  - **Rules and skills:** `conventions.md` parts 8 and 23, brd-author, prd-author, discovery-author, epic-author, frd-author, the BRD and PRD checklists, `simple-writing-rules.md` and stories-workflow.
  - **The reader's copy:** `tools/reader-copy.cjs --file {document}` now mainly drops the citations. It also drops notes and italic lines from a document written before this change. A table's Source column is kept: it is a column, not a citation inside the text.
  - **Not changed:** the Glossary templates follow the approved Glossary method and keep their own notes. Continuum's documents in `Output/` were written before this change, so their check now flags their opening notes.

### 6. Remove the EPIC row from the story header

- **Found (team):** the story sits in its EPIC's folder, and on GitHub it is a sub-issue of the epic.
- **Verdict:** valid.
- **To do:** remove the row from the template; stop `check-stories.cjs` requiring it.
- **Status:** done 2026-11-02, not committed.

### 7. Remove the "Grooming" wrapper and make its sub-sections main sections

- **Found (team):** "Grooming" was a heading that only held other headings.
- **Verdict:** valid. `check-stories.cjs` uses "Pending, added at grooming" under it to tell whether a story is groomed; the Status row already says that.
- **To do:** Scope, Dependencies, Rules, Metrics and Design links become level-2 sections; the check reads the stage from the Status row.
- **Status:** done 2026-11-02, not committed. A drafted story has its Description only; story-groomer adds the grooming sections and ac-author the Acceptance criteria, so no section says "Pending" any more.

### 8. Rename "Story" to "Description"

- **Found (team):** "Description" is what the section holds and what the team calls it.
- **Verdict:** valid.
- **To do:** rename in the template; `check-stories.cjs` reads the statement from the renamed section.
- **Status:** done 2026-11-02, not committed.

### 9. Show Roles only when it says something

- **Found (team):** every story said "Person: Yes", which told nobody anything.
- **Verdict:** partly valid. With one actor it is noise. With two actors who differ, such as a line manager who can reject a claim and a finance approver who can't, it is the only place that says so.
- **To do:** the Roles section appears only when the FRD has more than one actor for the story's action, or when a cell is No or TBD; otherwise it is left out.
- **Status:** done 2026-11-02, not committed. In the fixtures, only "Approve a Claim over 500" keeps its Roles.

### 10. Dependencies as one line each, with the reason kept

- **Found (team):** a five-column table for one or two dependencies. The team wrote "Create a project (#85)" instead.
- **Verdict:** valid, but story-groomer must prove every dependency, so the proof stays.
- **To do:** one line each, straight after the description: `{story} ({work item}): {why}, ({FRD gate or step})`, such as "Create a project (85): a project must exist first (FRD-4a, Gate In)".
- **Status:** done 2026-11-02, not committed. A story with no tracker ID yet reads "work item pending", because the question check refuses a bare "TBD".

### 11. Scope as a bulleted list

- **Found (team):** a numbered table with Source IDs. The team wrote bullets, with "Out of scope:" items at the end.
- **Verdict:** valid. The Rules table already traces each item to the FRD.
- **To do:** bullets in the template; in-scope items first, then "Out of scope:" items. A gap still names its question, such as "TBD, question 12".
- **Status:** done 2026-11-02, not committed.

### 12. Name the rules in the scenario title instead of the Proves table

- **Found (team):** removed the "Proves" table that mapped each scenario to the rules it proves.
- **Verdict:** not valid as it stands. `coverage-check.cjs` reads the table to prove every rule is tested, and `traceability-map.cjs` reads it to link tests to rules. Without it every rule shows as untested.
- **To do:** drop the table, and put the rule IDs in each scenario's title, such as "Scenario 2 - Reject without a reason (F-04.4)". Change `check-stories.cjs`, `coverage-check.cjs` and `traceability-map.cjs` to read them from there.
- **Status:** done 2026-11-02, not committed. The three programs read the titles through one shared reader, `lib/md-tables.cjs` `scenarios()`. Trace IDs stay "{story}, Scenario n".

### 13. Acceptance criteria: drop example names, keep values the rule depends on

- **Found (team):** example data such as "Billing" and "Payments" was replaced with plain descriptions, such as "a project exists", in Create, Search and Delete.
- **Verdict:** partly valid. Made-up names add nothing. A value the rule depends on is what makes a test checkable: "a claim of 120", "a claim over 500". "A project exists" is fine; "a claim exists" for a rule about a limit isn't.
- **To do:** in `ac-author/references/acceptance-criteria.md`, say to use plain descriptions for things the rule doesn't depend on, and real values for the ones it does. Its examples (Asha, Priya, 120) need the same review.
- **Status:** done 2026-11-02, not committed. The guide, its examples and the three fixture stories name people by role, and keep 640 and 120 only where the rule depends on the amount.

## Other templates

### 14. Check findings: merge the action into the recommendation, and name the affected file

- **Found (specifier):** in change 001 of continuum-backlog-v3, raised 2026-10-28, the Check findings table (`_shared/glossary/templates/check-findings.md`) was hard to read. The File and Line columns repeated the same file on every row. The "Next best action" column said "fix the document" without saying which document, or where the fix lands. For a document from outside, the source is never edited: glossary-disposition only flags it, and the agreed word goes into the Change impact report's section 5 and the documents the recommendation names.
- **Verdict:** valid. The Line column can go. The Source column stays, so each defect can be traced to where it comes from.
- **To do:**
  - Drop the Line and Next best action columns, and rename File to Source.
  - Rename "Recommended, and why" to "Recommended Next Best Action". It holds the action first, in bold (Fix the document, Change the glossary, or Add the term through harvest), then what to use and why, then `Affected file: <file name>`, the file the fix is written into.
  - For Fix the document on a document from outside, say that the source stays as it is, and that the fix lands in section 5's restatement and then in the documents the recommendation names.
- **Touches:** `_shared/glossary/templates/check-findings.md`, `_shared/glossary/output-formats.md` ("The check findings and the ripple list"), `glossary-check/SKILL.md`, and `glossary-disposition/SKILL.md`, which reads the action from its own column today.
- **Status:** done 2026-11-02, not committed. The glossary method test's list of allowed edits names the new lines.

### 15. PRD: one requirement per row

- **Found (specifier):** at continuum's PRD gate on 2026-10-30, in section 1, many rows held several requirements each. For example, the client's row 1.3 holds 4: one AI provider for each project, the key is optional at first, no key means no provider, and no key means no AI. The PRD's rule "Nothing is merged, split or ranked" kept each client row as one requirement, so every later document treated it as one. BABOK 7.2 lists "Atomic" as a quality of every requirement.
- **Verdict:** valid. The mental model is in `_archive/root-notes-2026-11-02/atomic-requirements-model.md`. Its parts 1 and 2 are now the kit's `_shared/atomic-rules.md`. Section 1 of continuum was rewritten to it as a sample: 5 client rows became 21 requirements, and their parts rebuild each client row word for word.
- **To do:**
  - In `prd-author/SKILL.md`:
    - the description says "one requirement per row"
    - step 4 cuts each client row into its requirements. Split two actions, two separate rules, each thing that is not allowed, and a "so that" part the product must also do. Keep together a list of details of one thing, a list of values, an example, and a reason.
    - the ID is REQ-{section}.{n}, counted by the PRD from 1 in each section, in the client's order, with no letters. Once the PRD is accepted, an ID never changes, and a new requirement takes the next free number in its section.
    - "The client's words" holds only the part of the client's row that the requirement comes from. The first part keeps the client row's title.
    - the Source column always names the client's own number for the row
    - Quality adds Q1, Atomic
  - In `references/prd-checklist.md`: one requirement per row, the parts rebuild each client row, and no retired word.
  - In `templates/prd.md` and `examples/prd.md`: the italic line under section 4, the placeholders, and the example re-cut into one requirement per row.
  - In `conventions.md`, part 7: the PRD's ID is its own, and the client's number goes in Source.
  - In `check-prd.cjs`:
    - fail when a client row's parts don't rebuild it word for word
    - fail when the IDs don't count up from 1 in each section
    - flag, to look at, a row whose simple words join two actions with "and" or "or"
    - compare each part's "no" and "not" words without the client row's title, which only rides on the first part
  - New tests for each check.
- **Touches:** `prd-author/SKILL.md`, `prd-author/references/prd-checklist.md`, `_shared/templates/prd.md`, `_shared/examples/prd.md`, `_shared/conventions.md` (part 7), `tools/check-prd.cjs`, `tools/tests/requirements.test.cjs`.
- **Status:** done 2026-11-02, not committed. 5 new tests in `requirements.test.cjs` pass, and no test that passed before fails. The example's client row 2.4 is now the PRD's REQ-2.3, in the example, the expense-claims fixtures and their tests. The PRD itself is re-run next.
- **Status, 2026-11-02, the data model build:** the check that lists a row with two actions is now the kit's shared check, `tools/lib/one-per-row.cjs`. `check-prd.cjs` runs it, and so do the checks of the BRD, the Feature catalog, the FRD, the stories and the data model. The rules are in `_shared/atomic-rules.md`. The PRD is re-run in the fresh trial, in `_data_model/data-model-stitching-plan.md`, part 8.

### 16. PRD: the simple words use the Glossary's agreed words

- **Found (specifier):** in the same PRD run, the simple words still said "effort", which the Glossary had merged into Project, in decision D-1. The kit's retired-word scanner found 59 retired words across the PRD's 87 rows. Two causes. `conventions.md`, part 5, says the PRD uses the client's own words for things, because the Glossary comes after it. And no check looks for retired words in the PRD.
- **Verdict:** valid. Only "The client's words" keeps the client's own words.
- **To do:**
  - In `conventions.md`, part 5: the PRD's simple words use the Glossary's agreed words.
  - In `prd-author/SKILL.md`, step 4: use the agreed word when it means the same. When it doesn't fit the meaning, use another plain word, never the retired one.
  - In `check-prd.cjs`: when the project has a Glossary, fail a row whose simple words use a retired word, and name the word to use now. It uses `lib/scan-retired-words.cjs`, which `check-stories.cjs` already runs.
  - This holds only when the project already has a Glossary, such as on a re-run or in a change. On a first run the PRD comes before the Glossary, so it can't use agreed words. The accepted PRD is not rewritten afterwards: the Glossary's "also written as" and its "Terms replaced or retired over time" tables match the PRD's words to the agreed ones (specifier, 2026-11-02; this replaces an earlier "bring the PRD in line after the Glossary" step).
- **Touches:** `_shared/conventions.md` (part 5), `prd-author/SKILL.md`, `tools/check-prd.cjs`, `tools/tests/requirements.test.cjs`.
- **Status:** done 2026-11-02, not committed.

## Kept as is

The status block, Work Item ID, the Rules table, the sizing alert, Metrics, Design links, and the Given / When / Then scenarios.

## Where this applies

- **Template:** `templates/story.md`.
- **Skills:** story-drafter, story-groomer, ac-author.
- **Checks:** `check-stories.cjs`, `coverage-check.cjs`, `traceability-map.cjs`, and through the trace map, `find-linked.cjs`.
- **Test data:** the EPIC-002 fixture stories and `tools/tests/stories.test.cjs`.

## Status

Done 2026-11-02, not committed: 2, 6 to 14, 15 and 16. Enhancement 1 was done 2026-10-27 and then replaced by 2. Enhancement 3 is not needed, because 2 is done. Enhancement 5 was done the same day: the notes and italic guidance are out of every document, and the reader's copy drops the citations. Still proposed: 4, a report of when a feature is done. Issues 85-89 on GitHub and continuum's own stories are still in the old shape.
