---
name: prd-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the PRD from the accepted BRD, the Discovery brief and the requirement
  files they mark Used: every requirement the client stated, one requirement per
  row, in simple words, with the part of the client's words it comes from, the
  document and version it came from, and the business requirements it traces to, plus
  the personas, the end-to-end journey, the NFRs and the transition requirements.
  One gate, "Accept the PRD?". Use after the BRD is accepted, for example "write
  the PRD for expense-claims", or in a change whose recommendation names the PRD.
  Not for the business case (use brd-author), features (use feature-author) or
  decided rules (use frd-author).
---

# prd-author

> **What this is:** The skill that records what the client asked for, one requirement per row, in simple words, with the part of the client's words and the source next to each requirement. It also writes the product context around them: the personas, the end-to-end journey, the NFRs and the transition requirements.
>
> **What it is not:** Features, priorities or decided rules. Features and priorities come in the Feature catalog, and decided rules in the FRDs. It never adds a requirement of its own.
>
> **Who uses it:** `requirements-workflow`, as its third step, and the Extend and Update paths of a change when the PRD holds the changed thing. A specifier, on its own, with the project's name.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md`, `../_shared/atomic-rules.md` and `../_shared/decision-review-gates.md`. It writes from `../_shared/templates/prd.md`, and `../_shared/examples/prd.md` shows a finished one. Its checklist is `references/prd-checklist.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:**
  - the accepted BRD, always, for its business requirements
  - the Discovery brief, for the order of authority and how each clash was settled
  - the requirement files the brief marks Used, and only those
  - in a change, also the Change impact report and the files the specifier brought
- **Writes:**
  - `{product}-prd.md`
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
- **Its gate:** "Accept the PRD?"
- **Its check:** `check-prd.cjs`

## Steps

### 1. Set up

Run `node tools/scaffold-project.cjs --project {project}`. If the BRD is missing, or isn't accepted, say so and stop. The PRD never runs ahead of the BRD.

### 2. Write each section

Write every section of the template, in order, as its "What each section holds" says. Those notes stay in the template: the document has no line in italics under its headings.

1. **Document control:** the owner, and the BRD version it was written from.
2. **Product overview:** three to five sentences on what the product is and what it is worth. It points to the BRD, and doesn't repeat the business case.
3. **Personas and roles:** who uses the product, and what each role may do, only from the files. A cell the files don't settle reads TBD and names its question.
4. **Requirements:** every requirement the client stated, one requirement per row, in the order and under the headings of the client's own file. Nothing is merged, ranked or added.

   **Cut each client row into its requirements,** as `../_shared/atomic-rules.md` says: one requirement per row. A client row that holds one requirement stays one row.

   **Give each row its kind.** Most rows are requirements. Some only say why the product exists, what the project covers, or how the client's people work today. Those rows keep their place, so the client's order stays the same, but they get no feature.

   | Kind | The row says | Example | Traces to |
   |---|---|---|---|
   | Requirement | what the product must do, or how well | A customer can pay by card. | the business requirements it serves |
   | Purpose | why the product exists, or what it is worth | The new shop lets us sell online all year round. | PRD section 2 |
   | Scope | what the project covers or leaves out, and nothing the product must do | Gift cards are not part of this project. | BRD section 4 |
   | Way of working | how the client's people work today, and nothing the product must do | Our warehouse team packs orders each morning. | PRD section 8 |

   A row that holds a requirement and its reason is a Requirement. A row whose kind isn't clear is a Requirement. So a requirement is never dropped by mistake.

   Each row has:
   - its ID: REQ-{section}.{n}, counted by the PRD from 1 in each section, in the client's order, with no letters (`conventions.md`, "IDs"). Once the PRD is accepted, an ID never changes, and a new requirement takes the next free number in its section.
   - **Kind:** Requirement, Purpose, Scope or Way of working, from the kind table.
   - **In simple words:** the one requirement, as `simple-writing-rules.md` says: a short title in bold, then a dash, then the requirement. It keeps every condition, number and "no" or "not" of its part of the client's words, and adds nothing. When the project has a Glossary, it uses the agreed words. When an agreed word doesn't fit the meaning, it uses another plain word, never a retired one (`conventions.md`, "Agreed words"). When a part has two possible meanings, it is not guessed. It becomes a question, and the simple words name it, such as "TBD, question 7". Each Requirement row must also be one that can be checked yes or no (Q4). When it can't, such as "quickly" with no time, no limit is made up. The simple words keep the client's word and name its question, such as "A customer finds any product quickly, question 9". Words that are already simple may stay as the client wrote them.
   - **The client's words:** only the part of the client's row that this requirement comes from, exactly as the file writes it. The first part keeps the client row's title, in bold. Read in order, the parts give back the client's whole row, word for word. They are kept so the specifier can check each row against them. No later document copies them.
   - its source: the document, its version and the client's own number for the row, such as "claims-requirements-v2.docx, version 2, section 2.1" (`conventions.md`, "Each requirement's source"). The PRD's ID is its own, so the source is how each row is traced back to the client's.
   - what it traces to. A Requirement traces to the business requirements of the client row it comes from. One that traces to none reads TBD and names its question. A row of any other kind names the section that holds it, as the kind table says.

   Where two files say different things, the Discovery brief's settlement says which file's words are recorded. A Scope row must agree with the BRD's In scope or Out of scope. One that doesn't gets a question, so the BRD can be updated through a change. A Way of working row is also written in section 8, with its source. A rule the client states stays in the PRD. Rules decided later are written in the FRDs.
5. **The end-to-end journey:** the whole product as one journey, from the first thing a user does to the last, in simple words. Each step names the Requirement rows it involves.
6. **NFRs:** NFR-1 onward, across both tables. Evidenced NFRs are in simple words, say where they came from, and have the tag CONFIRMED or TENTATIVE. Recommended NFRs are ones no file states but the product would be at risk without, each marked AI-RECOMMENDED. Never invent a threshold: state it as the file does, or TBD with its question.
7. **Transition requirements:** what has to happen to move from today's way of working to the new product, each with its source, and whether the product itself must do it. Every "No" must also be one of the BRD's release criteria. One that isn't gets a question, so the BRD can be updated through a change.
8. **Dependencies and assumptions:** what the product relies on, and what is taken as true, each with its source. An assumption no file confirms is Proposed (needs confirmation), with its question.
9. **Traceability matrix:** every business requirement in the BRD, one row each, named as the BRD names it, with the Requirement rows that cover it. One that nothing covers is a Gap, and names its question. The PRD never suggests a requirement to fill a Gap (`conventions.md`, "Ask, don't assume").

Business language throughout: what the product does, never how it is built (`conventions.md`, "Business language"). Never invent a limit, threshold or rule (`conventions.md`, "Nothing invented").

### 3. Run the checklist

Work through `references/prd-checklist.md`, and fix anything that fails. Lines marked "checked by check-prd.cjs" are left to the program.

### 4. Raise the questions

Run probing-questions-author on the PRD. It drafts and rates a question for every gap, and hands back each gap's place and its question's number. Write each number in, such as "Proposed (needs confirmation), question 4". Then run `node tools/grade-questions.cjs --project {project}`.

### 5. Check

Run `node tools/check-prd.cjs --project {project}`. Fix every finding and run it again, until every check passes.

### 6. The gate

Hold the gate exactly as `decision-review-gates.md` says:
- first, the two "For the person" blocks: the check program's, then `grade-questions.cjs`'s
- then the questions the PRD raised or builds on, one at a time, in the order `grade-questions.cjs` sets, and the Can move ahead list
- then each recommended NFR, to accept, change or reject, unless a question above already settled it
- then **"Do the simple words say the same as the client's words?"**. This is BABOK 4.3, Confirm Elicitation Results. The answers:
  - "They all say the same."
  - "Some need changing." The specifier names the rows, and the skill rewrites only those.
  - "Show me one section at a time." One decision for each section of the PRD.
  - "I don't know yet." The simple words are used, and every row goes on the list for the client to confirm.
- then **"Are these rows not requirements?"**, showing each row whose kind isn't Requirement, with its kind and the section that holds it. This question is skipped when every row is a Requirement. The answers:
  - "They are all right."
  - "Some are requirements after all." The specifier names the rows. Each one becomes a Requirement, with its business requirements.
  - "I don't know yet." The kinds are used as they are, and the rows go on the list for the client to confirm.
- then the gate's own question, **Accept the PRD?**

Record each answer straight away, in the Decision record and the Question log. When the specifier accepts, run `node tools/accept.cjs --project {project} --document prd`, then close with `status.cjs`.

The PRD covers the whole product, so after a third "no" the skill offers only "accept it as it is" and "one more round" (`decision-review-gates.md`, rule 11).

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names the PRD, read the report and the files the specifier brought, and change only what the recommendation names. Everything else stays as it is. The PRD then goes through its check and its gate again, and acceptance saves a new version.

## Quality

Everything the skill writes, including each requirement's simple words, follows `../_shared/simple-writing-rules.md`. The client's words are recorded, not judged. From `../_shared/quality-characteristics.md`, everything the skill writes must pass:
- Q1, one requirement per row
- Q4, one reading
- Q7, business language
- Q9, sourced
- Q10, readable on the first pass

## Handoff

The accepted PRD feeds `glossary-author`, which agrees the words the product uses. Then it feeds `data-model-workflow`, and then `feature-author`.
