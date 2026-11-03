# Gate UX enhancements

> **What this is:** Enhancements to how a decision review gate is *presented* in an interactive client (the Claude Code app), found while running the continuum trial through discovery-author's gate on 2026-10-23.
>
> **What it is not:** A change to what a gate decides or to the decision content the kit prescribes. `decision-review-gates.md` rule 4 still sets every question's content (Why I'm asking, For example, What it changes, Impact, Severity, the answers, the recommendation, the next best action). These enhancements only change the *control* the specifier uses to pick an answer.

## Context

The kit already models each gate question as a multiple-choice decision: a set of named answers, never yes/no, plus "I don't know yet", plus an "Other" the specifier can type (`decision-review-gates.md`, rules 4 and 9). What was missing in the app run was a **clickable** way to pick one — the options came through as plain text, and the next-step box caps at two buttons, so a third option ("I don't know yet") showed only in prose.

## Enhancements

### 1. Present each gate question as a clickable multiple-choice control

- Each Must-answer and Should-answer question is asked one at a time, as the kit requires, but its answers are rendered as **clickable choices** the specifier can select, not just a bulleted list.
- The choice set is exactly the kit's: every real answer, then **I don't know yet**, with **Other: {your words}** always available for a free-text answer (`decision-review-gates.md`, rule 9).
- The full decision context (Why I'm asking, For example, Impact, Severity, the recommendation, the next best action) is still shown in the message above the control, so nothing the kit requires is lost.
- **Status:** done 2026-11-02, not committed. The rule is in `decision-review-gates.md`, rule 4, "How the specifier picks an answer".
  - Every decision at the gate goes in the client's control for picking an answer. In Claude Code, this is AskUserQuestion.
  - This covers each Must answer and Should answer question, the Can move ahead list and the gate's own question.
  - The recommended answer comes first. "I don't know yet" is always an answer, except at the gate's own question.
  - The Layouts say the answer lines go into the control.

### 2. Number the options

- Options are numbered (1, 2, 3, ...) so the specifier can reply with a single digit when they would rather type than click.
- The recommended option is marked "(recommended)" in line with the kit's recommendation.
- **Status:** done 2026-11-02, not committed. When the client has no control for picking an answer, or a decision has more answers than the control can show, the message lists every answer, numbered. "Recommended" follows the recommended one. The specifier can reply with the number. Inside the control, the recommended answer comes first, and its label ends with "Recommended".

### 3. The Can-move-ahead group stays one control

- The Can-move-ahead questions are still settled together by one decision (`decision-review-gates.md`, rule 3), presented as a single list with each question's recommended answer, and one clickable decision: take all recommended, change some then take the rest, or "I don't know yet".
- **Status:** done 2026-11-02, with item 1. The Can move ahead list is one decision in one control, with its three answers. It has its own progress line, from item 7.

### 4. Handle the two-button cap

- The app's next-step box shows at most two buttons. When a question has more than two answers, use the richer clickable control (which shows all answers plus "Other"), and keep the full numbered list in the message text as the fallback.
- **Status:** done 2026-11-02, not committed. Rule 4 now says a box that shows only two buttons, such as the app's next-step box, is never used for a gate decision. The numbered list from item 2 is the fallback.

### 5. A text box for free-text answers

- Wherever an answer is "Other", or needs the specifier's own words (for example "Change some, then take the rest" in the Can-move-ahead list), present a text box so they can type the answer in place, not only in chat.
- The typed answer is recorded as "Other: {the specifier's words}" and added to the options as chosen (`decision-review-gates.md`, rule 9; `decision-record.md`, rule 2).
- **Status:** done 2026-11-02, not committed. The client's control already has its own box for the specifier's words. Rule 4, "When an answer needs the specifier's own words", covers an answer such as "Change some, then take the rest". The skill then asks for the words in one short message, in a text box when the client has one, and records them as given.

### 6. Back, Skip, and Submit controls

- Each gate question carries three controls:
  - **Back** - return to the previous question to change an answer already given.
  - **Skip** - defer this question; it is recorded as "I don't know yet", the recommended answer is used and marked Proposed, and the question stays open (`decision-review-gates.md`, rule 9).
  - **Submit** - confirm the selected answer and move to the next question.
- Back respects the record: changing an earlier answer adds a new Decision entry beginning "Replaces Decision {n}:" rather than editing the past one (`decision-record.md`, rule 2).
- **Status:** done 2026-11-02, not committed, in the form the client allows. The control has no Back or Submit button of its own. So rule 4, "Going back, and skipping", says:
  - **Back:** the specifier says "go back to Decision" and its number, at any time at the same gate. The skill asks it again. The new answer is a new Decision record entry whose question starts with "Replaces Decision {number}:". The first message at the gate says once that this is possible.
  - **Skip:** the answer "I don't know yet".
  - **Submit:** picking an answer in the control.

### 7. Progress indicator (question X of Y)

- Each gate shows how far through it the specifier is - "Question 3 of 9", and the group it is in (Must answer, Should answer, or Can move ahead) - so a long gate stays legible.
- The counts reflect the grader's order and totals, for example "9 open: 2 must answer, 2 should answer, 5 can move ahead", and tick down as questions are answered.
- **Status:** done 2026-11-02, not committed. Rule 4, "Where the specifier is", and every layout open each decision with one progress line, such as "Decision 2. Should answer: 1 of 1. Left at this gate: 2." The decision's number is the one the Decision record gives it, so the specifier can use it to go back.

### 8. Gate-check questions read as ambiguous (backlog)

- **Found:** while answering continuum's glossary Gate 1, the specifier found the gate-row questions were phrased in a way that was hard to read - it was not always clear exactly what each question was asking or what each option would do.
- **To look at (later):** tighten how gate rows are worded so each question and its options are unambiguous on their own - the exact word or outcome being chosen, what it retires or changes, and the downstream effect, in plain terms. Review whether batching several rows into one question (for example the eight merges together) blurs what is being decided, and whether each row should be put more plainly one at a time.
- **Status:** done 2026-11-02, not committed. glossary-author, "How the gates are asked", now says:
  - Each gate row is one decision, asked on its own. Several rows, such as eight merges, never go into one question.
  - The question names the exact words it decides.
  - Each answer names its exact outcome: the word kept, and the word retired or renamed. Its description says what changes in the glossary, and in the documents that use the word.
  - The evidence is said in plain words at the gate, with no file and no section number. The gate log keeps the links.
  - The method file `output-formats.md` is not changed, because the approved copy of the method must stay the same.

### 9. The "Done when" pieces table needs better presentation (deliverable, not a gate)

- **Found:** while building continuum's Feature catalog, the "Done when" pieces table (template section 3) came out as one flat list of every piece across all features - 148 rows for 77 features - with the feature a piece belongs to readable only from the `F-xx` prefix of its piece ID. There is no grouping, no feature name beside the pieces, and no visual break between one feature's pieces and the next, so a reader cannot scan "what are F-20's pieces" without hunting by ID.
- **Note:** this is about how the *deliverable* presents, not how a gate is asked, so it widens this file slightly beyond gate controls; kept here because it is the presentation backlog (KIT-FINDINGS.md is for bugs and gaps, not presentation).
- **To look at (later):** present the pieces grouped by feature - for example a sub-heading or a first column carrying the feature ID and name, a small per-feature block, or the pieces shown inline under each feature row - so a reader sees a feature and its pieces together. Keep the piece IDs (`F-xx.dw1` onward) and the machine-checkable "pieces reconstruct the Done when" rule intact; change only the layout. Decide whether the template, the author skill, or a render step owns this.
- **Status:** done 2026-11-02, not committed. The template owns it.
  - Section 3 of the Feature catalog now has one heading for each feature, its ID and then its name, with its own small table of pieces under it.
  - The piece IDs, and the rule that a feature's pieces give back its Done when, stay as they were.
  - `check-features.cjs` now also checks that each piece sits under its own feature's heading. A new test proves it finds a piece under the wrong heading.
  - feature-author, its checklist, and both sample catalogs follow the new layout.
  - `check-frd.cjs` and `traceability-map.cjs` read the pieces as before, because they read every table in the section.
  - Continuum's own catalog keeps the old flat list until feature-author runs on it again.

### 10. Drop the citations from gate messages (backlog)

- **Found:** at continuum's PRD gate on 2026-10-30, each question's "Why I'm asking" named files and sections, such as "mcp-requirements-v4.md, section 12.1". The specifier found this hard to read, and asked for the citations to be dropped.
- **To do:** at the gate, "Why I'm asking" says in simple words what the documents say and what they leave open, with no file names and no section numbers. The question's entry in the Question log keeps every citation, so the link back to each source is not lost (BABOK 5.1, Trace Requirements). This changes `decision-review-gates.md`, rule 4, which today says "citing each file".
- **The same idea for documents:** `TEMPLATE-ENHANCEMENTS.md`, item 5, takes the opening notes and the italic lines out of every document, and strips the citations from the copy a reader sees.
- **Status:** done 2026-11-02, not committed. Rule 4's "Why I'm asking" now names no file and no section number at the gate. It names the document in words, such as "the PRD". The Question log keeps every citation, and probing-questions-author still writes them in the log. The layout's placeholder says the same.

## Where this applies

- Every skill gate: discovery-author, brd-author, prd-author, glossary-author (Gate 1 and Gate 2), feature-author, epic-grouping-author, epic-author, frd-author, story-drafter, story-groomer, ac-author, change-impact-author.
- The gate order and content are unchanged. Only the control the specifier uses to answer is enhanced.

## Status

Raised from the continuum trial, discovery-brief gate, 2026-10-23. All ten items are done on 2026-11-02 and not committed. Items 1 to 7 and 10 are in `decision-review-gates.md`. Item 8 is in glossary-author. Item 9 is in the Feature catalog template, feature-author and `check-features.cjs`. Not yet tried at a real gate.
