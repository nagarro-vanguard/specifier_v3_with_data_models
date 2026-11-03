# Decision review gates

> **What this is:** The rules for every decision review gate, or "gate" for short: the point where a skill hands its finished draft to the specifier for a decision. They cover what the specifier sees first, the order the questions come in, how each decision is put, what each answer does, and what happens after a third "no".
>
> **What it is not:** What any one skill asks. Each skill's own instructions give its gate question. How a question is drafted, rated and asked is in probing-questions-author's instructions, and where questions are kept is the Question log (`templates/question-log.md`).
>
> **Who uses it:** Every skill that has a gate.

In these rules, **the skill** is the one whose gate it is, and **the specifier** is the BA or the PO who decides (`conventions.md`, "Who decides").

Documents use codes, such as feature numbers, rule numbers and piece numbers, so that later steps can point at an exact rule. **The specifier never has to read those codes to make a decision.** Every message the specifier sees follows the rules and layouts below.

## The rules

### 1. Facts come from the check program, never from the skill

When every check passes, the skill's check program prints three blocks. The skill pastes each one exactly as it is. It never:
- retypes it
- shortens it
- rewords it
- adds a fact to it

The three blocks:

- **"For the person"**: the facts for the first message at the gate, each with the place it came from. What it shows depends on where the document stands:
  - **Before acceptance:**
    - what the draft holds
    - every place it goes beyond, or differs from, what the client wrote
    - how many questions are open in each group of the Question log, as `grade-questions.ts` counts them, for example "5 open questions: 1 must answer, 2 should answer, 2 can move ahead"
  - **After acceptance:**
    - each question, with its answer
    - **the list for the client**, in two halves:
      - every place the specifier's decisions changed or added to the client's words, ready to take back to the client to confirm
      - what we still need from the client: every open question and every TBD, each already worded as a question

      When the client replies, the reply comes in as a new version of their document, through `change-request-workflow`.
  - A place counts as going beyond the client's words when the document marks it that way (`conventions.md`, "Beyond the client's words").
- **"One line"**: the check result in a single line, for each later decision at the same gate.
- **"For the file"**: the check record. When the gate ends, the skill pastes it into the document, replacing everything under "Check record".

`grade-questions.ts` prints the same three blocks for the Question log. Its "For the person" block lists the open questions in the order they are asked, each with its severity and impact, and the skill pastes it straight after the check program's block, exactly as it is.

The skill writes only the decisions, as rules 3 and 4 describe.

### 2. Names, not codes

When the skill refers to something in its own words, it uses these names:

| Thing | Call it | Where the name comes from | Example |
|---|---|---|---|
| A feature | its name, exactly | the Feature catalog, column "Feature" | Manager approval |
| A requirement | its title, in quotes | the PRD, column "In simple words" | "Line manager approval" |
| A module | its section title | the Feature catalog, the section heading | 3. Approving claims |
| A "done" condition | its own words, in quotes | the Feature catalog's "Done when" pieces | "can approve it" |
| A rule | its words, without its number | the FRD's Rules table | show each manager every claim waiting for their approval |
| A question | its question, with its number | the Question log | "Which currencies can a claim be made in?" (question 4) |

- A code, such as F-03, appears only in brackets after the name, and only when the specifier will need it later.
- Every message at a gate follows `simple-writing-rules.md`: one idea per sentence, everyday words, and no figure of speech.
- The skill never uses its own working words as if the specifier knows them. It says the plain meaning instead:

| Instead of | Say |
|---|---|
| piece, or dw1 | one of the conditions in its "done when" line |
| `req` | taken from the requirement's own text |
| `proposed` | a rule I'm suggesting, which your documents don't decide |
| `decided` | a rule that comes from your decision |
| Excludes | what this part leaves out |
| Depends on | what has to exist before this part |
| Gate In | what must be true before this part starts |
| Gate Out | what this part makes possible |
| TBD | not decided yet |

### 3. The order at a gate, with as little to read as possible

At every gate, things come in this order:
1. **The "For the person" blocks:** the check program's, which ends with any "Simple writing, to look at" places, then `grade-questions.ts`'s, which lists the open questions in the order they are asked, each with its severity and impact.
   - Some files have no check program. The skill that wrote them runs the quick check, `tools/check-simple-writing.ts`, as `simple-writing-rules.md` says. For each of those files, the gate shows the one line the quick check prints. For example: "Simple writing, lending.md: 0 to fix, 4 to look at." The line comes after the check program's block, when the skill has one.
2. **The Must answer questions** this document raised or builds on, one at a time, in the order `grade-questions.ts` sets.
3. **The Should answer questions**, one at a time, in the same order.
4. **The Can move ahead questions**, as one list with the recommended answer to each. One decision settles them all. Its three answers:
   - take all the recommended answers
   - change some, then take the rest
   - "I don't know yet"
5. **The gate's own question**, such as "Accept the BRD?".

- **Every later decision at the same gate** opens with only the "One line" block. The skill never repeats the full block.
- Decisions are numbered as the Decision record numbers them, such as "Decision 4 of 10", so the number the specifier sees is the number recorded.
- An open question never stops a document from being accepted, except where a rule names a guard: a Must answer question an FRD builds on must be answered before that FRD is accepted, and one raised while writing stories must be answered before those stories are marked ready.
- The Feature catalog has a guard of its own. A row of its section 5 that no feature names shows "?" until the catalog's gate settles it. The catalog can't be accepted while a "?" is left.
  - "I don't know yet" settles the row with its recommendation, marked Proposed, as rule 9 says.
  - An answer may say the row needs a new requirement first. Then only step 1 of `change-request-workflow` runs at this gate, and gives the change its number. The row reads "waits on change {nnn}", such as "waits on change 004". The catalog can be accepted while a row waits. The rest of the change comes after this gate.
- The data model's gates take a different order. Its decisions are kept in its own decisions file, not in the Question log. After the check program's block, they ask the data model's decisions, then the gate's own question. `data-model-design.md` says how: gate 1 for the things file, and gate 2 for each data model file. Each has one gate.

### 4. Every decision is asked by probing-questions-author

The specifier may not have followed the work. So every decision put to the specifier, anywhere in the kit, is asked by probing-questions-author, in its Ask mode. Its instructions, "Ask: put one decision to the specifier", say how. This covers:
- each Must answer and Should answer question
- the Can move ahead list, as one decision with its three answers
- the skill's own questions at its gate, such as the PRD's "same meaning" question
- the data model's decisions, and the Glossary's gate rows
- a tension between two decisions (rule 6)
- the gate's own question, such as "Accept the FRD?"
- the choices after a third "no" (rule 11)
- a question when a skill is blocked (rule 10), or stops inside a change (rule 12)

At each gate, before the first decision, the skill loads probing-questions-author's instructions again, so they are fresh. For each decision, it hands over:
- the decision
- where we are: what the skill is working on, and what it has finished
- the count: the decision's number in the Decision record, and how many decisions are left at this gate

It asks the next decision only after it records the answer, as rule 5 says.

Every decision the specifier sees has:
- where we are, so a question never comes out of the blue
- the client's own words that matter, and what they leave open. No file name and no section number. The Question log keeps every citation.
- a real case, and what goes wrong if the answer is wrong
- the real choices. Each says what will be true in the product, and when to choose it. They are never "yes" or "no", and no answer starts with "Yes" or "No".
- "I don't know yet", every time except at the gate's own question, whose answers rule 6 gives. What happens next: the recommended answer is used, marked Proposed, and the question stays open in the Question log, with who can answer it and by which step. The data model is different, as rule 9 says. Its cell keeps "? (DM-n)", and the decision stays open in its own decisions file. It is asked again first at the next run. A change's gate is different too: "I don't know yet" leaves the report drafted, as rule 9 says.
- the recommendation: what it is based on, how sure the skill is, and when to choose another answer
- the next best action

The only yes-or-no question left is the gate's own, such as "Accept the FRD?", because it decides about the document, not about the product. When the question is "two readings" of the same source text, the answers are the two readings.

**Going back, and skipping.**
- The specifier can go back to any earlier decision at the same gate by saying "go back to Decision {number}". The skill asks it again, through probing-questions-author. The new answer is a new entry in the Decision record. Its question starts with "Replaces Decision {number}:". The earlier entry stays as it is (`templates/parts/decision-record.md`, part 2).
- Skipping a question is the answer "I don't know yet".
- The first message at the gate says once that the specifier can go back.

### 5. Record every decision straight away

As soon as the specifier answers, the skill:
- adds the entry to the document's Decision record, in the shape of `templates/parts/decision-record.md`
- moves the question to "Answered" in the Question log, keeping its number
- sets "Last changed" to that decision's date and number, when the document has that line
- runs the check again, so the record is checked before the next decision
- runs the quick check, `node tools/check-simple-writing.ts --project {project} --file Output/{project}/{product}-question-log.md`, because the Question log changed too. It fixes what the check lists to fix.
- pastes the "For the file" block into the Check record section, when this was the gate's last decision

At the BRD's gate and the PRD's gate, there is no Decision record. The answer goes into the Question log only, and its "Decided in" names the document's gate and the date. The skill then writes the answer into the document in place of its mark, and the "For the file" line it pastes is one line, Pass or Fail with the date and time. brd-author and prd-author, step 6, say how.

At a data model gate, the skill records the answer in two files: the data model's decisions file, and the data model file. `data-model-design.md`, gate 2, says how. The Question log doesn't change.

### 6. Tensions, then acceptance

- When two decisions pull against each other, the skill asks about it as a decision of its own: keep both, or revisit one.
- Then it asks its gate question, in exactly the words its own instructions give, such as **Accept the FRD?**
  - **Accept.** Why the specifier would pick it: everything their decisions touch now matches them. What happens next: the IDs are fixed from now on, and a new item takes the next number.
  - **Change something first.** Why the specifier would pick it: something shown is wrong. What happens next: the specifier says what, and the skill shows the review again.
- The skill never writes "approved", "accepted" or "parked" into a document. Only programs change the status line once it says "drafted": `version-log.ts`, run by `accept.ts`, and `park.ts` (`conventions.md`, "The opening of every document").

### 7. Close by saying what happens next

After acceptance, the skill runs `node tools/status.ts --project {project}` and pastes these parts of what it prints, exactly as they are:
- the "Must answer, still open" list
- at the data model's own gates, things-author's and data-model-author's, the "Data model, still open" block too
- the "Next:" line, which names the next workflow to run, with any lines under it. Each of those names the skill that asks again a data model entry still open, and when.

The skill adds nothing to them.

### 8. Lists go one item per line

Never joined with commas, middle dots or slashes. It's the same rule as in the documents (`conventions.md`, "Plain characters and lists").

### 9. What each answer does

- **"Yes", or Accept:** the skill runs `node tools/accept.ts --project {project} --document {name}`.
- **"No", or Change something first:** the draft goes back to the same skill, with the specifier's words. The skill redrafts, runs its check again, and comes back to the same gate.
- **"I don't know yet":** the recommended answer is used, marked Proposed, and the question stays open in the Question log. There are two exceptions:
  - **The data model.** Its open cell keeps "? (DM-n)". The decision stays open in the data model's decisions file, never in the Question log. A Glossary change left open in step 3 of `data-model-workflow` stays in that file too, marked "Left open on {date}". `status.ts` lists each one, and the next run asks it again first. `data-model-design.md`, "Where each gap goes", says more.
  - **A change's own gate,** "Make these updates?". At this gate, "I don't know yet" leaves the Change impact report drafted, and nothing runs, as `change-request-workflow` says.
- **An answer that wasn't one of the options:** it is recorded as given, as `Other: {the specifier's words}`.

### 10. When a skill is blocked

When the skill can't go on without an answer, it asks that one question and nothing else, in the shape of rule 4. When the specifier answers, it records the decision and goes on.

### 11. The third "no"

After the third "no" at the same gate in one run, the skill stops redrafting and offers its choices instead.

**Where "park it" is offered.** Only where other work can go on while this piece waits:
- an FRD's gate
- an EPIC's gates: its EPIC brief, the split, the grooming and the criteria

Every other gate covers the whole product. Everything after it depends on it, so parking it would stop the project. Those gates offer only "accept it as it is" and "one more round":
- the Discovery brief
- the BRD
- the PRD
- the Glossary's Gate 1 and Gate 2
- the data model's things file
- each data model file
- the Feature catalog
- the EPIC grouping
- a change's "Make these updates?"

The choices:

- **Park it**, at an FRD's or an EPIC's gate only. Why the specifier would pick it: the open points need someone else, or more time. What happens next: `park.ts` sends this piece to the back of the queue. Anything that depends on it waits, and all other work goes on.
- **Accept it as it is.** Why the specifier would pick it: what's there is right, and the open points can be settled later. What happens next: each of the specifier's remaining points becomes a question in the Question log, rated by probing-questions-author and placed by `grade-questions.ts`, and `accept.ts` runs. At a data model gate, each remaining point goes where its kind goes, as `data-model-design.md`, "Where each gap goes", says. It never goes into the Question log.
- **One more round.** Why the specifier would pick it: one more redraft will settle it. What happens next: the skill redrafts with the specifier's words, and comes back to the same gate.

The choice is recorded in the Decision record. At the BRD's gate and the PRD's gate, which have none, it is not written down: the count is for one run only. The count of "no" answers starts again after an acceptance.

### 12. Inside a change you said yes to

When `change-orchestration-workflow` runs a skill for a change, your yes at "Make these updates?" covers every update the change names. So the skill:
- changes only what the change names. Everything else stays as it is.
- runs its own check, and fixes what the files settle
- asks no gate question. On a pass, it runs `accept.ts`, which saves the new version and ticks the change's row.
- stops, and asks you one question in the shape of rule 4, only when:
  - an update needs an answer only you can give. It is raised in the Question log first. The skill never makes up an answer.
  - its check fails, and the files don't say how to fix it
  - it finds something the change didn't list. The question is: add it to this change, or leave it for a new one.

When you answer, the skill goes on from where it stopped. A skill run for a change you haven't said yes to holds its gate as usual.

## Layouts

Each layout below is shown the way the specifier sees it. Text in `{curly braces}` is replaced.

Each decision in these layouts is written by probing-questions-author, as rule 4 says.

### The first message at the gate

> {the check program's "For the person" block, pasted exactly as it is}
>
> {grade-questions.ts's "For the person" block, pasted exactly as it is}
>
> {the first decision, as probing-questions-author asks it}

### Every later decision at the same gate

> {the "One line" block, pasted exactly as it is}
>
> {the decision, as probing-questions-author asks it}

### The Can move ahead list

probing-questions-author asks it as one decision. In "What I found", it shows the questions in one table, each with the answer it recommends:

> | Question | What I recommend, and why |
> |---|---|
> | {the question, in plain words} | {the recommended answer}, because {what it is based on} |

Its choices:
- **Take all my recommendations.** Choose this if: each one looks right to you. Then each is recorded as your answer.
- **Change some, then take the rest.** Choose this if: you disagree with one or more. Then you say which, and what, and the rest take my recommendations.
- **I don't know yet.** Then they stay open, with my recommendations in use, not confirmed yet, and they go on the list for the client.

### The close, after acceptance

> {the "Must answer, still open" list from status.ts, pasted exactly as it is}
>
> {at a data model gate only: the "Data model, still open" block from status.ts, pasted exactly as it is}
>
> {the "Next:" line from status.ts, with any lines under it, pasted exactly as they are}

## Example

A finished decision, asked the way probing-questions-author asks it, is in `../probing-questions-author/references/asking-example.md`.
