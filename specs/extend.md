# Extend: specs

**Frozen:** this file is a record of the design. It was last changed on 2026-10-27 and is not updated any more. What was actually built, and every change made after the design, is in [build-log.md](../build-log.md).

**What this doc is:** every item where an existing piece does the job, and we keep all of it and only add.

**How to read it:** every item has the same 11 parts. "Row N" is row N on the [Old vs New Workflow](https://claude.ai/artifact/XpiJqPk4DQTrRhqjqKwKKW) page. Old files are copied into `specifier_v3/` and extended there; the originals are never touched.

**Status:** draft for your review, 2026-10-19. Updated 2026-10-21 for the Question log and the decision review gates.

## Summary

Every item in this doc, one row each, in spec order. Read across a row to see what it is, what it takes in and gives out, and where it sits in the flow. The full spec for each follows below.

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| decision record | The shape of a decision record: each question asked at a gate, the options, and your answer, including "I don't know yet". | • none | • one numbered entry per decision | • filled by every skill with a gate, and by `close-change.cjs` | none | Extend<br>phase 1<br>[EXTEND 1](extend.md) |
| `decision-review-gates.md` | How every skill talks to you at its gate: what you see first, the order the questions come in, and the shape of each decision. | • none | • the rules for every gate | • read by every skill with a gate | none | Extend<br>phase 1<br>[EXTEND 2](extend.md) |
| `adversarial-check` | Challenges a change's verdict. It looks for:<br>• reuse that is overclaimed<br>• gaps that were missed<br>• a verdict that is too soft | • Change impact report<br>• Glossary, looked up<br>• PRD, looked up<br>• FRDs, looked up | • its findings, in the report | • called by `change-impact-author` after its analysis<br>• a fail sends the report back | none | Extend<br>phase 7<br>[EXTEND 3](extend.md) |
| `probing-questions-author` | Turns each gap in a draft into a question, and rates its impact and severity. Every skill that writes a document runs it inside itself. | • the draft the calling skill just wrote<br>• Question log, looked up<br>• its question bank, looked up | • new questions, in the Question log | • runs inside every skill that writes a document, after it drafts<br>• comes before `grade-questions.cjs` | none: its questions are asked at the calling skill's gate | Extend<br>phase 2<br>[EXTEND 4](extend.md) |

---

## Phase 1

### 1. Decision record template

1. **Label and kind:** Extend. A template, `_shared/templates/parts/decision-record.md`.
2. **Its one job:** fix the shape of the decision record that every living document carries. (Row 29)
3. **What exists today:** `frd_experiment/frd-author/references/conventions.md`, section 12, "Decision record":
   - one entry per decision, numbered Decision 1, Decision 2 and so on
   - each entry holds:
     - the question as asked
     - the gate it was asked at
     - every option offered, with why you'd pick it and what happens next
     - the option recommended
     - the option chosen
     - who decided, and the date
   - an answer that wasn't offered is recorded as "Other: your words"
   - a past entry is never edited; a later decision "Replaces Decision n"
4. **Changes:**
   - **Keep:** all of section 12, in meaning. At the Phase 1 gate it was rewritten in plain words, and its shape is now shown as a real example and a table, not as markdown inside a code block.
   - **Add:**
     - "the gate it was asked at" names the skill's one gate, instead of Step 1, 2 or 3
     - one more kind of entry, the **closing entry of a change**: the change's number, and every place it was applied, with document and version. Written by `close-change.cjs`. (Row 39)
     - who decided is always one of the specifiers, the BA or the PO (Row 2)
   - **Added 2026-10-21, with the Question log:**
     - "What it is not" says the questions themselves live in the Question log. An entry records what you decided, and names its question.
     - each entry gains a **Question** line: its number in the Question log, or "None" for a decision about the draft itself
     - every option list offers at least two real answers, never "yes" or "no", then "I don't know yet"
     - **"I don't know yet"** is recorded as chosen, like any other answer. The entry then adds **Answer in use for now**: the recommended answer, marked Proposed (needs confirmation). The question stays open in the Question log, with who can answer it and by which step.
     - the example is reworded so it isn't a yes-or-no question: "When a claim is rejected, what does the claimant do next?"
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** each document's check program checks that the decision record is present and its entries are numbered with no gaps.
9. **On its own:** used by every skill that has a gate.
10. **Done when:** every document on the MCP test slice carries a decision record in this shape.
11. **Open points:** none.

### 2. `decision-review-gates.md`

1. **Label and kind:** Extend. A shared file, `.claude/skills/_shared/decision-review-gates.md`.
2. **Its one job:** say how every skill talks to you at its gate.
3. **What exists today:** `frd_experiment/frd-author/references/talking-to-the-person.md`, 166 lines:
   - "The rules":
     1. facts come from the program
     2. names, not codes
     3. one decision at a time
     4. every decision has the same shape
     5. record every decision straight away
     6. tensions, then acceptance
     7. close by saying what happens next
     8. lists go one item per line
   - "Layouts": the first message, every later decision, the close
   - "Worked example": a decision at the Team & roles gate
4. **Changes:**
   - **Keep:** all of it, in meaning. At the Phase 1 gate it was rewritten in plain words and one voice: "the skill" gates, "the specifier" decides. No rule changed.
   - **Add:**
     - **It applies to every skill**, not just frd-author.
     - **What each answer does:**
       - "yes" runs `accept.cjs`
       - "no" sends the draft back to the same skill with your words
       - "Other" is recorded as given
     - **When a skill is blocked:** it asks that one question and nothing else, in the shape of rule 4, then carries on.
     - **The close names the next run.** In rule 7, "what happens next" names the next workflow, or what `status.cjs` would say.
     - **The third "no".** After the third "no" at the same gate in one run, the skill stops redrafting and offers three choices:
       - **park it:** `park.cjs` sends the piece to the back of the queue, with the guard, and other work carries on
       - **accept it as it is:** your remaining points become questions in the Question log, rated by probing-questions-author and placed by `grade-questions.cjs`, and `accept.cjs` runs. Until 2026-10-21 they became open questions in the document.
       - **one more round**
       - Your choice is recorded in the decision record. The count resets when you accept. (Your decision of 2026-10-19: "A")
   - **Decided at the Phase 1 gate** (your answer A at the Phase 1 gate, 2026-10-19): "park it" is offered only at an FRD's gate and at an EPIC's gates, where other work can carry on. Every gate that covers the whole product offers only "accept it as it is" and "one more round":
     - the Discovery brief
     - the BRD
     - the PRD
     - the Glossary's Gate 1 and Gate 2
     - the Feature catalog
     - the EPIC grouping
     - the change recommendation
   - **Decided at the Phase 1 gate** (your answer A at the Phase 1 gate, 2026-10-19), question 3: the two parts of the FRD's summary that were lost when the rules were made general come back, at every gate. Before you accept, the summary shows where the draft goes beyond or differs from the client's words. After you accept, it gives you that list for the client.
   - **Decided at the Phase 1 gate** (your answer A at the Phase 1 gate, 2026-10-19): every check program that runs before a gate prints the three blocks of rule 1, not only `check-frd.cjs`. The last block goes in the document's Check record.
   - **Changed 2026-10-21, with the gate rename and the Question log** (your decisions of 2026-10-21):
     - **The name.** Renamed from `how-a-stop-works.md` to `decision-review-gates.md`. The point where you decide is a "decision review gate", or "gate" for short, everywhere.
     - **Rule 1.** "For the person" counts the open questions in each group, as `grade-questions.cjs` counts them. After acceptance, the list for the client has two halves:
       - what we changed or added, for the client to confirm
       - what we still need from the client: every open question and every TBD, each already worded as a question
     - **Rule 2.** The table of names gains a row for a question: its words, with its number in the Question log.
     - **Rule 3.** The order at a gate:
       1. the "For the person" blocks: the check program's, then `grade-questions.cjs`'s, which lists the open questions in order, each with its severity and impact (your call at the second Phase 1 review, 2026-10-21)
       2. the Must answer questions, one at a time, in the order `grade-questions.cjs` sets
       3. the Should answer questions, one at a time
       4. the Can move ahead questions, as one list with the recommended answer to each, settled by one decision with real choices: take all the recommended answers; change some, then take the rest; or "I don't know yet"
       5. the gate's own question
     - **The guards.** An open question never stops a document from being accepted, except at two guards:
       - a Must answer question an FRD builds on must be answered before that FRD is accepted
       - a Must answer question raised in stories must be answered before those stories are marked ready
     - **Rule 4.** Every decision has the same shape:
       - why I'm asking, citing each file, or saying no file speaks to it
       - a real example
       - what it changes, with the question's impact and severity, and the reason for each
       - the answers, which are the real choices, never "yes" or "no"
       - "I don't know yet", offered every time: the recommended answer is used, marked Proposed, and the question stays open
       - the recommendation
       - the next best action
     - **Drafting.** How a question is found, drafted and rated is in probing-questions-author's instructions (item 4). The only yes-or-no question left is the gate's own.
     - **Rule 5.** As soon as you answer, the question moves to Answered in the Question log, keeping its number.
     - **Rule 7.** The close pastes two parts of what `status.cjs` prints: the "Must answer, still open" list, and the "Next:" line.
     - **Rule 9.** "I don't know yet" uses the recommended answer, marked Proposed, and the question stays open.
     - **Rule 11.** After "accept it as it is", each remaining point becomes a rated question in the Question log.
     - **Layouts.** A new layout for the Can move ahead list, and the close shows both parts from `status.cjs`.
     - **The example** is reworded so it isn't a yes-or-no question: "How should "done" for Manager approval be split into conditions?"
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** reviewed by you at the Phase 1 gate. Since 2026-10-21, a Phase 1 test also fails if "how-a-stop-works", "blocking" or "stop" in the sense of a gate comes back into the kit.
9. **On its own:** read by every skill.
10. **Done when:**
    - every skill's gate on the MCP test slice follows it
    - a third "no" at a gate offers the three choices, and each choice does what it says
    - a gate's first message counts the open questions in each group, lists them in order with their ratings, and they are asked in the order rule 3 gives
11. **Open points:** none. The limit on repeated "no" is decided: the third "no" brings the three choices above.

---

## Phase 2

### 4. `probing-questions-author`

1. **Label and kind:** Extend. A skill, `.claude/skills/probing-questions-author/SKILL.md`, plus `references/probe-dimensions.md`, its question bank. Added 2026-10-21 (your decision of 2026-10-21: one skill drafts and rates, one program places, and the Question log is the one output).
2. **Its one job:** draft each question from a gap, and rate its impact and severity, so it can be asked at the next gate.
3. **What exists today:** `.claude/skills/probe-requirements/`:
   - SKILL.md, "Mandatory steps":
     - step 3, "Restate and classify": Known, with its source, and Assumed, labelled and never promoted to fact
     - step 4, "Probe": walk the dimensions that fit, ask only what is missing and material, group by dimension, rank the most urgent first, say in one line why each matters, and offer 2 to 3 options
   - `references/probe-dimensions.md`, 88 lines: the nine dimensions and their questions
4. **Changes:**
   - **Keep:**
     - step 3's split of Known and Assumed: an assumption is never promoted to fact
     - step 4's test: ask only a question whose answer is missing and would change the design or the scope
     - step 4's one line on why each question matters
     - offering concrete answers to react to, rather than an open question
     - `references/probe-dimensions.md`, whole, moved here from discovery-author (OPTIMIZE 12)
   - **Add:**
     - **It runs inside every author skill,** after the skill drafts and before `grade-questions.cjs` (NET-NEW 49), never as a workflow step of its own (`conventions.md`, "Ask, don't assume").
     - **The answers are the real choices.** At least two, none starting with "Yes" or "No", each with why you'd pick it and what happens next. Then "I don't know yet", with what happens next (`decision-review-gates.md`, rule 4).
     - **A rating for each question,** from the tables in the Question log template (NET-NEW 50):
       - impact, how much is redone if the answer is wrong: High, Medium or Low, with the reason
       - severity, how much harm is done if work goes ahead on a wrong answer: High, Medium or Low, with the reason
     - **Every part of the question block,** in the template's shape:
       - Raised in
       - Why I'm asking, citing a file, or saying no file speaks to it
       - For example
       - What it changes
       - Impact
       - Severity
       - Answers
       - Recommended
       - Answer in use for now
       - Who can answer
       - Answer by
       - Next best action
     - **The gap names its question.** The calling skill writes the question's number next to the gap, in the same place, such as "TBD, question 12" (`conventions.md`, "Unknowns").
     - **One number for life.** A new question takes the log's next number. A question already in the log is not asked twice.
   - **Where the rest of the old skill goes:**
     - steps 1, 2 and 5, which take the input and write the Discovery brief, are discovery-author's (OPTIMIZE 12)
     - step 4's ranking is done by `grade-questions.cjs`, from the grid in the Question log template
     - step 4's closing "HUMAN ACTION REQUIRED" line becomes the calling skill's gate, where the questions are asked
   - **On a re-run** of the whole workflow (your decision of 2026-10-22): a question you answered before is asked again, keeping its number. Its answer moves to Recommended, with the date you chose it, such as "The manager's own manager, as you chose on 2026-10-02", and the question goes back to its group until you answer it again. The answer's history stays in the Decision record that settled it, and in the Version log's copies of the Question log.
   - **Changed while building** (2026-10-22, calls made while building, listed in MASTER-PLAN section 8):
     - the question bank keeps every question word for word. Its area names use "and" instead of "&", so they match the nine areas of the Discovery brief, and its closing rule points to `conventions.md` instead of the old shared rules, which are not carried over.
     - a field a program fills in, such as the date a check program writes, is not a gap, and gets no question. Found on the MCP test slice, where the EPIC register's "Copy checked on" reads TBD.
     - on its own, it writes the question numbers into a drafted document itself; for an accepted document, it lists each gap and its question, since an accepted document changes only through a change
5. **Reads / looks up:**
   - reads the draft the calling skill just wrote, and its gaps
   - looks up the Question log, so a question is never asked twice
   - looks up `references/probe-dimensions.md`
6. **Writes:** new questions, and changes to open ones, in `{product}-question-log.md`. `grade-questions.cjs` then places them in their groups.
7. **Its gate:** none. Its questions are asked at the calling skill's gate.
8. **Its check:** `grade-questions.cjs`, run straight after it. It checks that every part is there, both ratings have a reason, the answers are real choices plus "I don't know yet", and every gap names a question in the log.
9. **On its own:** invoked with the project and a document, to raise the questions for that document alone.
10. **Done when:** run in the pass over the test data before the trial (MASTER-PLAN section 5, Phase 8):
    - on the Expense claims Discovery brief and BRD, every gap gets a question in the log's shape, and `grade-questions.cjs` reports no findings
    - on the MCP test slice, each gap that names no question gets one, and the answer that starts with "No" is reworded as a real choice, so `grade-questions.cjs` reports no findings
11. **Open points:**
    - It is built first in Phase 2, because discovery-author runs it.
    - Decided 2026-10-22: on a re-run, earlier answers are offered as the recommended ones (my proposal 4).

---

## Phase 7

### 3. `adversarial-check`

1. **Label and kind:** Extend. A skill, `.claude/skills/adversarial-check/SKILL.md`.
2. **Its one job:** challenge the verdict in a Change impact report, and report only what's wrong with it.
3. **What exists today:** `glossary_methodology/glossary-methodology-prompts/adversarial-check.md`, 58 lines, and the version you approved on 2026-10-06, reworded to the glossary word list, saved in `fixtures/approved-glossary-method/glossary-methodology-prompts/adversarial-check.md`. Phase 3 starts from the approved version (your decision of 2026-10-22). It's a prompt, not a skill, with these sections:
   - Step 1: prerequisite and location
   - Input
   - Stance: presume every reuse claim is an overclaim
   - The checks:
     - citation
     - reuse claims
     - missed gaps
     - the verdict
     - consistency
   - Output: findings only, ending PASS, PASS_WITH_FINDINGS or FAIL
   - Out of scope
4. **Changes:**
   - **Keep:** every section, word for word.
   - **Add:**
     - a skill header (name and description), so it can be invoked as a skill
     - its input is the Change impact report's sections 5 to 10, instead of a separate Feature Fit view
     - its findings are written into section 11 of the report
     - one more check: every rule the update test compared has a result that matches the FRD (NET-NEW item 33)
5. **Reads / looks up:**
   - reads the Change impact report
   - looks up the Glossary, the PRD and the FRDs
6. **Writes:** section 11 of the Change impact report.
7. **Its gate:** none. A FAIL sends the report back to `change-impact-author`.
8. **Its check:** its output ends with PASS, PASS_WITH_FINDINGS or FAIL.
9. **On its own:** invoked with the project and the change.
10. **Done when:** on the MCP test slice, a seeded overclaim is caught, and a FAIL sends the report back.
11. **Open points:** none.
12. **Built** 2026-10-22, from the approved prompt, word for word, with the kit's display and path fixes, a skill header and opening, and only the edits this spec names: the report's sections 5 to 10 as its input, the FRDs, the update-test check, and its findings and verdict in section 11. A Phase 7 test counts every line taken out and put in. Its runs on the test data come in the pass before the trial.
