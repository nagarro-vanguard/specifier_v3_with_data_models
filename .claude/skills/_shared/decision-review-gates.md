# Decision review gates

> **What this is:** The rules for every decision review gate, or "gate" for short: the point where a skill hands its finished draft to the specifier for a decision. They cover what the specifier sees first, the order the questions come in, how each decision is put, what each answer does, and what happens after a third "no".
>
> **What it is not:** What any one skill asks. Each skill's own instructions give its gate question. How a question is drafted and rated is in probing-questions-author's instructions, and where questions are kept is the Question log (`templates/question-log.md`).
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
    - how many questions are open in each group of the Question log, as `grade-questions.cjs` counts them, for example "5 open questions: 1 must answer, 2 should answer, 2 can move ahead"
  - **After acceptance:**
    - each question, with its answer
    - **the list for the client**, in two halves:
      - every place the specifier's decisions changed or added to the client's words, ready to take back to the client to confirm
      - what we still need from the client: every open question and every TBD, each already worded as a question

      When the client replies, the reply comes in as a new version of their document, through `change-request-workflow`.
  - A place counts as going beyond the client's words when the document marks it that way (`conventions.md`, "Beyond the client's words").
- **"One line"**: the check result in a single line, for each later decision at the same gate.
- **"For the file"**: the check record. When the gate ends, the skill pastes it into the document, replacing everything under "Check record".

`grade-questions.cjs` prints the same three blocks for the Question log. Its "For the person" block lists the open questions in the order they are asked, each with its severity and impact, and the skill pastes it straight after the check program's block, exactly as it is.

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
1. **The "For the person" blocks:** the check program's, which ends with any "Simple writing, to look at" places, then `grade-questions.cjs`'s, which lists the open questions in the order they are asked, each with its severity and impact.
   - Some files have no check program. The skill that wrote them runs the quick check, `tools/check-simple-writing.cjs`, as `simple-writing-rules.md` says. For each of those files, the gate shows the one line the quick check prints. For example: "Simple writing, lending.md: 0 to fix, 4 to look at." The line comes after the check program's block, when the skill has one.
2. **The Must answer questions** this document raised or builds on, one at a time, in the order `grade-questions.cjs` sets.
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

### 4. Every decision has the same shape

- **Why I'm asking:** one or two plain sentences on what the documents say and what they leave open, or saying that no document speaks to it. At the gate it names no file and no section number. It says which document in words, such as "the PRD" or "the expense policy". The question's entry in the Question log keeps every citation, so the link back to each source is not lost.
- **For example:** a real case, with a person and an amount where that helps, so the consequences are something the specifier can picture.
- **What it changes:** the parts of the product that depend on the answer, with the question's impact and severity and the reason for each.
- **The answers.** They are the real choices, never "yes" or "no", and no answer starts with "Yes" or "No". For each one:
  - what it is
  - why the specifier would pick it
  - what happens next if they do
- **"I don't know yet"**, offered every time. What happens next: the recommended answer is used, marked Proposed, and the question stays open in the Question log, with who can answer it and by which step. The data model is different, as rule 9 says. Its cell keeps "? (DM-n)", and the decision stays open in its own decisions file. It is asked again first at the next run.
- **The skill's recommendation,** and why.
- **The next best action:** what the specifier should do now, such as "choose 1,000 now, and ask the finance team before the approval FRD is written".

The only yes-or-no question left is the gate's own, such as "Accept the FRD?", because it decides about the document, not about the product. When the question is "two readings" of the same source text, the answers are the two readings. How a question is found, drafted and rated is in probing-questions-author's instructions.

**How the specifier picks an answer.** Some clients have a control for picking one answer from a list. In Claude Code, this control is AskUserQuestion. When the client has one, the skill asks every decision at the gate with it:
- each Must answer and Should answer question
- the Can move ahead list, as one decision with its three answers
- the gate's own question, such as "Accept the FRD?"

For each decision:
- One decision goes in each control. The skill asks the next decision only after it records the answer, as rule 5 says.
- The message above the control holds the rest of the decision:
  - Why I'm asking
  - For example
  - What it changes
  - the recommendation
  - the next best action
- The control holds the answers. Each answer's label is the answer in a few words. Its description says why the specifier would pick it, and what happens next.
- The recommended answer comes first. Its label ends with "Recommended".
- "I don't know yet" is always one of the answers, except at the gate's own question. Its answers are the ones rule 6 gives. A change's gate is different: it offers "I don't know yet", which leaves the report drafted, as rule 9 says.
- The client adds its own answer for the specifier's own words. An answer given that way is recorded as rule 9 says.
- A box that shows only two buttons, such as the app's next-step box, is never used for a gate decision. It can't show "I don't know yet" next to two real answers.

Sometimes the client has no such control. Sometimes a decision has more answers than the control can show. Then the message lists every answer, numbered, with "Recommended" after the recommended one. The specifier can reply with the number.

**When an answer needs the specifier's own words.** Some answers need more than a click, such as "Change some, then take the rest". After that answer, the skill asks for the words in one short message, in a text box when the client has one. It records them as given.

**Where the specifier is.** Each decision opens with one progress line:

> Decision {number}. {group}: {i} of {n}. Left at this gate: {left}.

- {number} is the number the Decision record gives it (rule 3).
- {group} is Must answer, Should answer, Can move ahead, or "The gate's own question".
- {i} of {n} is its place in its group. The Can move ahead list counts as one.
- {left} counts the decisions still to come at this gate, this one included.

**Going back, and skipping.**
- The specifier can go back to any earlier decision at the same gate by saying "go back to Decision {number}". The skill asks it again, in the same shape. The new answer is a new entry in the Decision record. Its question starts with "Replaces Decision {number}:". The earlier entry stays as it is (`templates/parts/decision-record.md`, part 2).
- Skipping a question is the answer "I don't know yet".
- The first message at the gate says once that the specifier can go back.

### 5. Record every decision straight away

As soon as the specifier answers, the skill:
- adds the entry to the document's Decision record, in the shape of `templates/parts/decision-record.md`
- moves the question to "Answered" in the Question log, keeping its number
- sets "Last changed" to that decision's date and number, when the document has that line
- runs the check again, so the record is checked before the next decision
- runs the quick check, `node tools/check-simple-writing.cjs --project {project} --file Output/{project}/{product}-question-log.md`, because the Question log changed too. It fixes what the check lists to fix.
- pastes the "For the file" block into the Check record section, when this was the gate's last decision

At a data model gate, the skill records the answer in two files: the data model's decisions file, and the data model file. `data-model-design.md`, gate 2, says how. The Question log doesn't change.

### 6. Tensions, then acceptance

- When two decisions pull against each other, the skill asks about it as a decision of its own: keep both, or revisit one.
- Then it asks its gate question, in exactly the words its own instructions give, such as **Accept the FRD?**
  - **Accept.** Why the specifier would pick it: everything their decisions touch now matches them. What happens next: the IDs are fixed from now on, and a new item takes the next number.
  - **Change something first.** Why the specifier would pick it: something shown is wrong. What happens next: the specifier says what, and the skill shows the review again.
- The skill never writes "approved", "accepted" or "parked" into a document. Only programs change the status line once it says "drafted": `version-log.cjs`, run by `accept.cjs`, and `park.cjs` (`conventions.md`, "The opening of every document").

### 7. Close by saying what happens next

After acceptance, the skill runs `node tools/status.cjs --project {project}` and pastes these parts of what it prints, exactly as they are:
- the "Must answer, still open" list
- at the data model's own gates, things-author's and data-model-author's, the "Data model, still open" block too
- the "Next:" line, which names the next workflow to run, with any lines under it. Each of those names the skill that asks again a data model entry still open, and when.

The skill adds nothing to them.

### 8. Lists go one item per line

Never joined with commas, middle dots or slashes. It's the same rule as in the documents (`conventions.md`, "Plain characters and lists").

### 9. What each answer does

- **"Yes", or Accept:** the skill runs `node tools/accept.cjs --project {project} --document {name}`.
- **"No", or Change something first:** the draft goes back to the same skill, with the specifier's words. The skill redrafts, runs its check again, and comes back to the same gate.
- **"I don't know yet":** the recommended answer is used, marked Proposed, and the question stays open in the Question log. There are two exceptions:
  - **The data model.** Its open cell keeps "? (DM-n)". The decision stays open in the data model's decisions file, never in the Question log. A Glossary change left open in step 3 of `data-model-workflow` stays in that file too, marked "Left open on {date}". `status.cjs` lists each one, and the next run asks it again first. `data-model-design.md`, "Where each gap goes", says more.
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

- **Park it**, at an FRD's or an EPIC's gate only. Why the specifier would pick it: the open points need someone else, or more time. What happens next: `park.cjs` sends this piece to the back of the queue. Anything that depends on it waits, and all other work goes on.
- **Accept it as it is.** Why the specifier would pick it: what's there is right, and the open points can be settled later. What happens next: each of the specifier's remaining points becomes a question in the Question log, rated by probing-questions-author and placed by `grade-questions.cjs`, and `accept.cjs` runs. At a data model gate, each remaining point goes where its kind goes, as `data-model-design.md`, "Where each gap goes", says. It never goes into the Question log.
- **One more round.** Why the specifier would pick it: one more redraft will settle it. What happens next: the skill redrafts with the specifier's words, and comes back to the same gate.

The choice is recorded in the Decision record. The count of "no" answers starts again after an acceptance.

### 12. Inside a change you said yes to

When `change-orchestration-workflow` runs a skill for a change, your yes at "Make these updates?" covers every update the change names. So the skill:
- changes only what the change names. Everything else stays as it is.
- runs its own check, and fixes what the files settle
- asks no gate question. On a pass, it runs `accept.cjs`, which saves the new version and ticks the change's row.
- stops, and asks you one question in the shape of rule 4, only when:
  - an update needs an answer only you can give. It is raised in the Question log first. The skill never makes up an answer.
  - its check fails, and the files don't say how to fix it
  - it finds something the change didn't list. The question is: add it to this change, or leave it for a new one.

When you answer, the skill goes on from where it stopped. A skill run for a change you haven't said yes to holds its gate as usual.

## Layouts

Each layout below is shown the way the specifier sees it. Text in `{curly braces}` is replaced.

When the client has a control for picking an answer, a layout's answer lines go into that control (rule 4). The message keeps everything else.

### The first message at the gate

> {the check program's "For the person" block, pasted exactly as it is}
>
> {grade-questions.cjs's "For the person" block, pasted exactly as it is}
>
> You can go back to any earlier decision at this gate. Say "go back to Decision" and its number.
>
> Decision {number}. {group}: {i} of {n}. Left at this gate: {left}.
>
> **{the question, in plain words}** (question {question number})
>
> **Why I'm asking:** {what the documents say, and what they leave open, with no file name and no section number}
>
> **For example:** {a real case}
>
> **What it changes:** {what depends on the answer}
> - **Impact: {level}.** {the reason}
> - **Severity: {level}.** {the reason}
>
> - **{answer}**. Why you'd pick it: {the reason}. What happens next: {what follows}
> - **{answer}**. Why you'd pick it: {the reason}. What happens next: {what follows}
> - **I don't know yet.** What happens next: I use {the recommended answer}, marked Proposed, and the question stays open for {who can answer}, to be answered by {which step}.
>
> I recommend **{answer}**, because {the reason}.
>
> **Next best action:** {what to do now}

### Every later decision at the same gate

> {the "One line" block, pasted exactly as it is}
>
> Decision {number}. {group}: {i} of {n}. Left at this gate: {left}.
>
> **{the question, in plain words}** (question {question number})
>
> {the rest, in the same shape as the first message}

### The Can move ahead list

> {the "One line" block, pasted exactly as it is}
>
> Decision {number}. Can move ahead: 1 of 1. Left at this gate: {left}.
>
> **Can move ahead: {n} questions, settled together**
>
> | # | Question | Recommended answer |
> |---|---|---|
> | {n} | {the question} | {the recommended answer} |
>
> - **Take all the recommended answers.** Why you'd pick it: each one is fine as it is. What happens next: each is recorded as your answer, and the questions move to Answered.
> - **Change some, then take the rest.** Why you'd pick it: you disagree with one or more. What happens next: you say which and what, and the rest take their recommended answers.
> - **I don't know yet.** What happens next: they stay open, with their recommended answers in use, marked Proposed, and they go on the list for the client.

### The close, after acceptance

> {the "Must answer, still open" list from status.cjs, pasted exactly as it is}
>
> {at a data model gate only: the "Data model, still open" block from status.cjs, pasted exactly as it is}
>
> {the "Next:" line from status.cjs, with any lines under it, pasted exactly as they are}

## Example: a decision at feature-author's gate, for Manager approval

> Check re-run after Decision 1 was recorded: 19 of 19 structure checks passed, 15:13.
>
> Decision 2. Should answer: 1 of 1. Left at this gate: 2.
>
> **How should "done" for Manager approval be split into conditions?** (question 9)
>
> **Why I'm asking:** the catalog's "done" line for Manager approval is one sentence: "Each manager sees every claim waiting for them, and can approve it or reject it with a reason". I split it into conditions using only its own words, in its own order. Every rule in the FRD must cover at least one condition, and every condition must be covered.
>
> **For example:** Priya, a line manager, rejects a 640 euro hotel claim. If approving and rejecting are one condition, a rule that covers only approving would still count as covering it.
>
> **What it changes:** the rules the Manager approval FRD has to cover.
> - **Impact: Medium.** It reaches one capability's rules.
> - **Severity: Medium.** A missed behaviour slows managers down, and a change fixes it before anyone is harmed.
>
> - **Three conditions**: "Each manager sees every claim waiting for them", "can approve it" and "reject it with a reason". Why you'd pick it: each is one thing you could test on its own. What happens next: the FRD's rules are drafted against these three.
> - **Two conditions, joining approve and reject**: "can approve it or reject it with a reason". Why you'd pick it: approving and rejecting are one choice the manager makes. What happens next: one condition covers two behaviours, so it's harder to see whether each is covered.
> - **I don't know yet.** What happens next: I use three conditions, marked Proposed, and the question stays open for you, to be answered before the Manager approval FRD is accepted.
>
> I recommend **Three conditions**, because each can be checked separately.
>
> **Next best action:** choose three conditions now. The FRD can still join them later through a change, if the team prefers.
