---
name: change-request-disposition
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Skill
description: >-
  Says what type of change each request is: Net new, Extend or enhance, Update
  or optimize, Already covered, or Blocked. It restates each request in the
  Glossary's agreed words, one ask per row, finds the type through Feature Fit
  and the update test, draws the journey, lists what's reused and what's new,
  and what blocks. Then adversarial-check challenges it. No gate: the
  specifier's yes comes at step 5 of change-request-workflow. Use when
  change-request-workflow reaches step 2, or on its own with a project and a
  change, for example "what type of change is 004 for city-library?". Not for
  what the change touches (use change-impact-author) or what changes in each
  thing (use feature-impact).
---

# change-request-disposition

> **What this is:** The skill that says what type of change each request is, and why.
>
> **What it is not:** What the change touches, or what changes in each thing. `change-impact-author` and `feature-impact` do those, at steps 3 and 4. It changes no document but the Change impact report and the Question log.
>
> **Who uses it:** `change-request-workflow`, at step 2. A specifier, on its own, with the project and the change.

- You **work out the type**. The specifier decides at step 5 of the workflow, once, for the whole change.
- You write sections 5, 7, 8, 9 and 10 of the report, and your answers in section 11. Nothing else.

## Words used in this skill

| Word | What it means | Example |
|---|---|---|
| Request | one thing the specifier asks for, in their own words, in section 1 | change request: a loan can be extended twice, not once |
| Ask | one thing a request asks for. A request that asks for several is split, one ask per row. | Ask 1 |
| Type | Net new, Extend or enhance, Update or optimize, Already covered, or Blocked | Update or optimize |
| Feature Fit | the method that says whether the request's words are in the Glossary: Fits, Extend, New capability or Blocked | Fits |
| Update test | the steps that say whether the request changes a rule that exists | F-05.1: changed value |
| Late answer | an answer to an open question that comes after the documents that use it exist | question 7 is answered: 14 days |

**The five types, with an example each:**

| Type | What it means | Example |
|---|---|---|
| Net new | nothing in the documents covers it | members can reserve a book that is on loan |
| Extend or enhance | it adds to something that exists | a librarian can also extend a loan for a member |
| Update or optimize | it changes a rule that exists | a loan can be extended twice, not once |
| Already covered | the documents already say it | a member who owes a fine can't borrow |
| Blocked | a question must be answered first | members get longer loans, but how long isn't said |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `city-library` |
| the **change**, by its number, once sections 1 to 4 are written | `004` |

Use only the report, the files the request brought, the Glossary, the FRDs and the Question log. Never facts from chat or memory.

## Load first

- `../_shared/templates/change-impact-report.md`: the report's layout. **Fill it. Don't describe it again in this skill.**
- `references/feature-fit.md`: how to find the Feature Fit verdict, and draw the journey.
- `references/update-test.md`: how to find whether a rule changes, and how section 7 is written.
- `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`.

## Step 1: The type of change

1. **Restate** each request in the Glossary's agreed words, one ask per row, in section 5. The specifier's words can be anything: you turn them into the agreed words. Two shapes are fixed, so the programs can read them:
   - a late answer reads `Question {n} is answered: {the answer}`
   - a request that only rewords a requirement reads `{ID} now reads: "{the new wording}"`
2. **A late answer is recorded first,** as `../_shared/decision-review-gates.md` rule 5 says for every answer:
   - write it as Decision 1 in section 16, with its question's number, the answer, and who decided
   - move the question under Answered in the Question log, with its Answer and its "Decided in"
   - run `node tools/grade-questions.ts --project {project}`
3. **List the agreed words the request renames,** under "Agreed words this change renames", each with the word it becomes, or None.
4. **Find its type,** in section 7: Feature Fit first, then the update test, written as the update test says.
5. **Draw the journey,** in section 8, from the Glossary's Steps page, and place the request on the PRD's journey and the FRD's flow it touches.
6. **List what's reused and what's new,** in section 9. Each word the Glossary doesn't have is written `New word: {the word}`.
7. **List what blocks,** in section 10. When an answer is needed, run probing-questions-author to raise it in the Question log, then `node tools/grade-questions.ts --project {project}`, and name its number. A blocked request goes no further: the workflow asks its question first, at step 5.
8. **The name it was called by.** When the type differs from the name in section 1, say so in one line in section 7. For example: "Called a new request. Already covered: rule F-03.2 says it."
9. **A requirement whose kind changes.** Each changed requirement in section 3 says the kind the PRD gives it. Read its new words against that kind, as prd-author's kind table does:
   - a Purpose, Scope or Way of working row whose new words now ask for something to be built: an ask of its own, Net new. For example, "The library may later support reserving books" becomes "Members must be able to reserve a book".
   - a Requirement row whose new words no longer ask for anything to be built: an ask of its own, Update or optimize, which takes the requirement away. For example, "Members must be able to reserve a book" becomes "Reserving may come later".
   - otherwise, the kind stays, and the row is read as any other difference

## Step 2: The challenge

Call `adversarial-check` with the project and the change. It writes its findings into section 11. Each finding has:
- a quote from the file it read, and the file. `check-change-report.ts` finds the quote word for word in that file.
- what it would change: the type, what's new, what blocks, or none of these
- who can fix it: "the files settle it" or "needs your answer"

The verdict follows a fixed rule, and `check-change-report.ts` works it out again from what each finding would change. A finding that would change the type, what's new or what blocks gives FAIL. Any other finding gives PASS_WITH_FINDINGS. No finding gives PASS.

Write your answer to each finding in its row. Then:
- **A finding the files settle:** redo the part of step 1 it names, and call `adversarial-check` again.
- **A finding that needs your answer:** never redo it. Run probing-questions-author to raise it in the Question log, then `node tools/grade-questions.ts --project {project}`, and name its number in the finding's Answer. It is asked at step 5 of the workflow.
- After a second FAIL in a row, stop redoing. Write the verdict line as "**Verdict:** FAIL, taken to your gate". Its findings come first at step 5 of the workflow.

Then run the quick check on the report, `node tools/check-simple-writing.ts --project {project} --file Output/{project}/changes/{change}/impact-report.md --skip-column Before --skip-column After --skip-column "Your words" --skip-column Quote`, and fix what it lists to fix in your sections.

## Rules

- Never write a section another writer owns.
- A type is never made up. Each names the rule, the file or the decision it is based on.
- Never ask the specifier anything. Questions go to the Question log, and are asked at step 5 of the workflow.

## Output

- The file `changes/{change}/impact-report.md`: sections 5, 7, 8, 9 and 10, and the answers in section 11.
- The questions it raises, in the Question log.

