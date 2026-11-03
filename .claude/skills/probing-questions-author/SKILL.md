---
name: probing-questions-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
description: >-
  Owns every question the specifier sees, from writing it down to asking it.
  Raise: drafts the question behind every gap in a specifier document, rates its
  impact and severity, and writes it into the project's Question log. It runs
  inside every author skill except the data model's two skills, after the skill
  drafts and before its check program. Ask: puts one decision to the specifier
  in chat, so that someone who hasn't followed the work can answer it. Every gate,
  every workflow and every skill that stops for an answer hands each decision to
  it, the data model's decisions and the Glossary's rows included. Run it on its
  own with a project and a document to raise the questions for that document
  alone, for example "raise the questions for the online-shop BRD". It never
  decides a question, and never records an answer: the calling skill records it.
---

# probing-questions-author

> **What this is:** The skill that owns every question the specifier sees. It turns every gap in a document into a question: what is missing, why it matters, what each answer would change, and how much harm and rework a wrong answer would cause. Then, when a skill needs the answer, it asks the question in chat, in words the specifier can follow without having seen the work.
>
> **What it is not:** The gate. The gate belongs to the skill that wrote the document: it sets which decisions are asked, records each answer, and asks its own question, such as "Accept the PRD?", through this skill. This skill doesn't set the order the questions are asked in: `grade-questions.ts` does. It doesn't hold the answers: the Decision record does.
>
> **Who uses it:** Every author skill, after it drafts, to raise its questions. The data model's two skills, things-author and data-model-author, don't raise questions through it, on purpose: their decisions stay in the data model's own decisions file, never in the Question log (`../_shared/data-model-design.md`, "Where each gap goes"). Every skill and workflow that puts a decision to the specifier, to ask it, the data model's two skills included. A specifier, on its own, for one document.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`, and writes in the shape of `../_shared/templates/question-log.md`. Its question bank is `references/probe-dimensions.md`. A finished question, asked the way this skill asks it, is in `references/asking-example.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

It works in one of two modes. **Raise** writes questions into the Question log. **Ask** puts one decision to the specifier. The calling skill names the mode.

## What it reads and writes

- **Reads:**
  - the document the calling skill just drafted, and every gap in it
  - the Question log, `Output/{project}/{product}-question-log.md`, so a question is never asked twice
  - the requirement files the document cites, to say what each file says and leaves open
  - `references/probe-dimensions.md`
  - in Ask mode, the decision where it is kept: the Question log, the data model's decisions file, or the Glossary's gate log
- **Writes:** new questions, and changes to open ones, in the Question log. `grade-questions.ts` then places each in its group and sets the order. In Ask mode it writes nothing. It hands the answer back to the calling skill.
- **Its gate:** none. In Ask mode, it asks at the calling skill's gate.

## Raise: write the questions down

### 1. Load

If the document is one of the data model's files, stop, and say so. The data model's decisions stay in its own decisions file, never in the Question log. The data model's files are the things file, each data model file and the decisions file, all in `glossary/data-models/`. things-author and data-model-author open each decision in the decisions file themselves.

Otherwise, read the document, and find the Question log through `tools/lib/run-paths.ts`. When the project has no Question log yet, write one from `templates/question-log.md`: fill in its opening, keep sections 1 to 4 exactly as the template has them, and leave every group "None yet".

### 2. Find the gaps

Restate what the document holds, without inventing anything:
- **Known:** stated in a file, with its source.
- **Assumed:** implied but not confirmed. An assumption is never promoted to fact. It gets a question.

Then find every gap:
- every gap label in the document that names no question: TBD, Proposed (needs confirmation), [Not specified in provided sources] and [Needs source excerpt] (`conventions.md`, "Unknowns")
- in a Discovery brief, every Silent topic, every clash the order of authority can't settle, and every assumption
- in a PRD, every Requirement row whose simple words fail Q4. A part has two meanings, or can't be checked yes or no.
- every area of `references/probe-dimensions.md` that fits the document, walked for what is missing

Keep only a gap whose answer is missing and material: one that would change the product, its scope, or what the client agreed to. A gap the files already settle is not a question, and neither is a field a program fills in, such as the date a check program writes. A choice about how a document is written, not about what the product does, is not a question either. The skill's own rules settle it.

### 3. One question for each decision, asked once

- Each question is one decision, worded so its answers are the real choices, ending in a question mark.
- Before drafting, look in the Question log for a question about the same decision, open or answered. If there is one, the gap names that question, and no new question is drafted.
- A new question takes the log's next number. A number is never reused, and a question keeps its number for life.

### 4. Draft every part

Write each question as a block in the template's shape, with every part filled. Write each part for a reader who has seen nothing else, because Ask mode builds the message from it. The template's Placeholders table says what each part holds, with an example:
- **Raised in:** a link to the document, and the place in it
- **Why I'm asking:** one or two plain sentences on what the files say and what they leave open, citing each file, or saying that no file speaks to it. Quote the client's own words that matter, briefly.
- **For example:** a real case, with a person and an amount where that helps
- **What it changes:** the parts of the product that depend on the answer
- **Impact** and **Severity:** step 5
- **Answers:** at least two real choices. No answer starts with "Yes" or "No". For each:
  - "Why you'd pick it" says the situation in which the specifier would choose it, such as "the client sells to other shops, not only to the public".
  - "What happens next" says what will be true in the product, for the person in the example. It never names the next step of the kit, such as "the FRD is drafted against it".

  Then **I don't know yet**, with what happens next: the recommended answer is used, marked Proposed, and who is asked by which step.
- **Recommended:** the answer the skill recommends, then three things, each in one sentence:
  - why: what the recommendation is based on, and which kind of support it is: the client's own words, an answer already given, or common practice
  - how sure: Sure, Fairly sure or A guess, with the reason
  - when to choose another answer
- **Answer in use for now:** the recommended answer, marked Proposed (needs confirmation), or TBD when no answer can be used
- **Who can answer:** the specifier, or someone named whom the specifier asks
- **Answer by:** the step by which it must be answered
- **Next best action:** what the specifier should do now

When two readings of the same source text are possible, the answers are the two readings.

### 5. Rate it

Rate each question from the tables in sections 1 and 2 of the Question log template, each level with its reason in one sentence:
- **Severity:** how much harm is done if work goes ahead on a wrong answer. Anything touching the law, a policy, a contract, money, personal data, or whether people can do their job is High.
- **Impact:** how much is redone if the answer turns out to be wrong.

Put the question in the group the grid in section 3 gives it. `grade-questions.ts` moves any question that sits in the wrong group, and sets the order.

### 6. Name the question at the gap

Every gap names its question in the same place, such as "TBD, question 12" or "Euros only, Proposed (needs confirmation), question 4" (`conventions.md`, "Unknowns"):
- **Inside a calling skill:** hand the skill each gap's place and its question's number. The calling skill writes them in.
- **On its own:** write the numbers in yourself when the document is drafted, changing nothing else. A document already accepted changes only through a change (`conventions.md`, "A mistake found later"), so list each gap and its question for the specifier instead.

### 7. On a re-run of the whole workflow

A run of the whole workflow from step 1 starts the project again from nothing (`../requirements-workflow/SKILL.md`, "Starting again from nothing"). It happens only when the specifier asks for it in words, and says yes to what will move. Every file and folder in `Output/{project}/` except `sources/` moves to `_archive/Output-{date}/{project}/`, the Question log too. No program does this move yet: the workflow does it by hand. So raise every question fresh, as for a new project. Never ask an earlier question again.

### 8. Check

Run `node tools/grade-questions.ts --project {project}`. Inside a calling skill, the calling skill runs it straight after this skill. It checks that every part is filled in, both ratings have a reason, the answers are real choices plus "I don't know yet", and every gap names a question in the log. Fix every finding in the questions this skill wrote, and run it again until it reports none.

Then run the quick check on the Question log, as `../_shared/simple-writing-rules.md` says: `node tools/check-simple-writing.ts --project {project} --file Output/{project}/{product}-question-log.md`. Fix what it lists to fix in the questions this skill wrote, and run it again. It prints one line, such as "Simple writing, online-shop-question-log.md: 0 to fix, 3 to look at." Inside a calling skill, hand that line to the calling skill, for its gate. On its own, show it.

## Ask: put one decision to the specifier

The specifier may not have followed the work. They must be able to answer from this one message, and know why they're answering.

### 1. What the calling skill hands over

- **The decision:** a question number in the Question log, a data model decision, such as DM-3, a Glossary gate row, or one of the skill's own questions, such as "Accept the PRD?", with the answers its instructions give
- **Where we are:** what the skill is working on, and what it has finished
- **The count:** the decision's number in the Decision record, and how many decisions are left at this gate

### 2. Read it again

Read the decision where it is kept, the place in the document it's about, and the client's words it is based on. Never ask from what you remember of an earlier read.

### 3. Write the message

Write these parts in this order. Each is short.

1. **The count:** "Decision {number}. {left} left at this step, this one included."
2. **Where we are:** one or two sentences on what I'm working on and what I've finished.
   - At the first decision of a gate, add what the work produced, in one sentence. Add that the specifier can go back to an earlier decision by saying "go back to Decision" and its number.
   - At a later decision, one sentence is enough.
3. **The question,** in bold, in one sentence, in the product's words.
4. **What I found:** the client's own words that matter, quoted briefly, with the document named in words, such as "the client's returns policy". Then what those words leave open.
   - When no document speaks to it, say so.
   - When the question is about the skill's own draft, show the items side by side, in a small table: what the client wrote, what the draft says, and what differs.
5. **Why it matters:** a real case, with a person and a number. Then two sentences:
   - "If we get it wrong: {the harm}." Then the severity level, and why, as its own sentence.
   - "Fixing it later means {what is redone}." Then the impact level, and why, as its own sentence.
6. **Your choices:** for each choice:
   - **{the choice in a few words}.** What it means: {what will be true in the product, for the person in the example}. Choose this if: {the situation}.
   - Last, **I don't know yet.** Meanwhile: {the recommended answer is used, not confirmed yet}, and {who} is asked before {which step}.
7. **My recommendation:** {the choice}, because {what it is based on}. Then:
   - **How sure I am:** Sure, Fairly sure or A guess, and why.
   - **Choose something else if:** {the situation}.
8. **What I'd do now:** the next best action.
9. Last, the reference in brackets, such as "(question 12)" or "(data model decision DM-3)". This is the only place a number or code appears.

When the decision is in the Question log, its parts give the content: "Why I'm asking" gives "What I found", "For example", "What it changes", "Impact" and "Severity" give "Why it matters", "Answers" gives "Your choices", "Recommended" gives "My recommendation", and "Next best action" gives "What I'd do now". Rewrite them for this reader. A citation becomes the document named in words, with the client's words quoted.

### 4. The words

- Use the product's words and the Glossary's agreed words.
- Follow `decision-review-gates.md`, rule 2, "Names, not codes", and `simple-writing-rules.md`.
- Never use a file name, a section number, or a working word of the kit. Say what it means instead:
  - "not confirmed yet", not "Proposed"
  - "has to be answered before {step}", not "Must answer"
  - "the short version I wrote", not "the simple words"

### 5. Don't ask what a check can settle

- When the question asks the specifier to confirm the skill's own work in bulk, such as "Do the simple words say the same as the client's words?", run the check that compares them first. Ask only about what it found, and show each item.
- When the check finds nothing, say so in "What I found". Show up to five items with the biggest change, so the specifier sees a sample.
- A question the files or an earlier answer already settle is never asked.

### 6. Put it in the control

When the client has a control for picking one answer, such as AskUserQuestion in Claude Code, use it. Steps 3 to 5 go in the message above the control. The control holds the choices:
- Put one decision in each control.
- Make each label the choice in a few words.
- Make each description "Choose this if {the situation}. Then {what will be true}."
- Put the recommended choice first. Its label ends with "(Recommended)".
- Always include "I don't know yet", except at the gate's own question. Rule 6 of `decision-review-gates.md` gives that question's answers.
- The client adds its own box for the specifier's own words.
- Never use a box that shows only two buttons, such as the app's next-step box. It can't show "I don't know yet" next to two real choices.

When the client has no such control, or the decision has more choices than the control shows, list every choice in the message, numbered, with "(Recommended)" after the recommended one. The specifier can reply with the number.

When a choice needs the specifier's own words, such as "Change some, then take the rest", ask for the words next, in one short message.

### 7. Test it before asking

Read the message as someone who has seen nothing else in this conversation. Answer each question:
- Could they answer from this message alone?
- Does it name a file, a section number, a code or a working word of the kit, anywhere but the reference at the end?
- Does each choice say what will be true in the product, and when to choose it?
- Does the recommendation say what it is based on, how sure I am, and when to choose another?

Rewrite until the first answer is yes, the second is no, and the last two are yes. Then ask.

A program then checks the question: `tools/check-question.ts`. It refuses a question when:
- the message misses a part of step 3, under the names step 3 gives them
- the message names a file, a code or a working word of the kit, anywhere but the reference at the end
- the control holds more than one decision
- the recommended choice isn't first, or "I don't know yet" is missing
- a choice's description doesn't say "Choose this if" and "Then"

In Claude Code it runs by itself before the control is shown. Fix everything it lists, and ask again. In a client where it can't run by itself, save the message to a file and run `node tools/check-question.ts --message {file}` before asking.

### 8. Hand the answer back

Hand the answer to the calling skill, as given. An answer that wasn't one of the choices goes back as the specifier's own words. The calling skill records it, as `decision-review-gates.md`, rule 5, says, then hands over the next decision.

## Quality

Each question must pass, from `../_shared/quality-characteristics.md`:
- Q1, one decision per question
- Q4, one reading
- Q7, business language
- Q9, every fact in "Why I'm asking" cited
- Q10, readable on the first pass

## What it never does

- It never decides a question, or records an answer. The calling skill records each answer, as `decision-review-gates.md`, rule 5, says.
- It never invents a value to close a gap (`conventions.md`, "Nothing invented"). A surfaced gap is a success, not a failure.
- It never asks a question whose answers are "yes" and "no", except the gate's own question.
- It never asks two decisions in one message.
