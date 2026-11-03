---
name: prd-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the PRD from the accepted BRD, the Discovery brief and the requirement
  files they mark Used: every requirement the client stated, one requirement per
  row, in simple words, with the part of the client's words it comes from and the
  business requirements it traces to, plus the personas, the end-to-end journey,
  the NFRs and the transition requirements, with no citations: a gap reads
  [TBD, Q7] and a suggestion is marked with a superscript *. One gate, "Accept the PRD?". Use after the BRD is accepted, for example "write
  the PRD for expense-claims", or in a change whose recommendation names the PRD.
  Not for the business case (use brd-author), features (use feature-author) or
  decided rules (use frd-author).
---

# prd-author

> **What this is:** The skill that records what the client asked for, one requirement per row, in simple words, with the part of the client's words next to each requirement. It also writes the product context around them: the personas, the end-to-end journey, the NFRs and the transition requirements.
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
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.ts`
- **Its gate:** "Accept the PRD?"
- **Its check:** `check-prd.ts`

## Steps

### 1. Set up

Run `node tools/scaffold-project.ts --project {project}`. If the BRD is missing, or isn't accepted, say so and stop. The PRD never runs ahead of the BRD.

### 2. Write each section

Write every section of the template, in order, as its "What each section holds" says. Those notes stay in the template: the document has no line in italics under its headings.

The PRD cites nothing: no "per …", no file name, no version, no section number, no decision number, and no Source column. A value from the files, or from an answer, is written as it is. A value nothing gives yet, or one the skill suggests, has a mark that names its question, as the template's "No citations, and two marks" says:
- not known yet: `[TBD, Q{n}]`, in place of the value
- suggested by the skill: the value, then `<sup>*Q{n}</sup>`, and the legend line straight under that table or list, once

1. **Document control:** the owner, and the BRD version it was written from.
2. **Product overview:** three to five sentences on what the product is and what it is worth. It points to the BRD, and doesn't repeat the business case.
3. **Personas and roles:** who uses the product, and what each role may do, only from the files. A cell the files don't settle reads `[TBD, Q{n}]`.
4. **Requirements:** every requirement the client stated, one requirement per row, in the order and under the headings of the client's own file. Nothing is merged, ranked or added.

   **Cut each client row into its requirements,** as `../_shared/atomic-rules.md` says: one requirement per row. A client row that holds one requirement stays one row. Split a row only when its parts are separate capabilities. The steps of one capability stay in one row. For example, make, sign and approve a decision stay in one row.

   **Give each row its kind.** The kind says what the row is for. Most rows are requirements. Some only say why the product exists, what the project covers, or how the client's people work today. Those rows keep their place, so the client's order stays the same, but they get no feature.

   | Kind | The row says | Label | Example | Traces to |
   |---|---|---|---|---|
   | Requirement | what the product must do, or how well | — | **Card payment** — A customer can pay by card. | the business requirements it serves |
   | Purpose | why the product exists: a problem today, or what the product is worth | Problem or Value | **Lost phone orders** — Orders taken by phone are often lost. | PRD section 2 |
   | Scope | what the project covers or leaves out, and nothing the product must do | In MVP or Out of MVP | **Gift cards** — Gift cards are not part of the MVP. | BRD section 4 |
   | Way of working | how the client's people work today, and nothing the product must do | — | **Morning packing** — The warehouse team packs orders each morning. | PRD section 8 |

   A row that holds a requirement and its reason is a Requirement. A row whose kind isn't clear is a Requirement. So a requirement is never dropped by mistake.

   **Write each kind in its own form:**
   - **Requirement:** "{Who} can {action}", such as "A customer can pay by card.", or "The platform {does something}", such as "The platform keeps each cart for 30 days." It must be one that can be checked yes or no.
   - **Purpose:** the Label is Problem or Value. Problem is something that goes wrong today. Value is what the product is worth. The statement is one plain fact.
   - **Scope:** the Label is In MVP or Out of MVP. The statement says plainly what is in or out.
   - **Way of working:** the statement is one plain fact about how people work today.

   **Write each title the same way, for every kind:**
   - The title is a noun that names the thing, such as "Card payment" or "Named approval of decisions". For a Requirement, it names the capability.
   - It is a few plain words.
   - It holds no image. Never use the client's images, such as "thread", "edges", "waves", "north star" or "control plane". Name what the thing does instead.

   Each row has:
   - its ID: REQ-{section}.{n}, counted by the PRD from 1 in each section, in the client's order, with no letters (`conventions.md`, "IDs"). Once the PRD is accepted, an ID never changes, and a new requirement takes the next free number in its section.
   - **Kind:** Requirement, Purpose, Scope or Way of working, from the kind table.
   - **Label:** Problem or Value for a Purpose row. In MVP or Out of MVP for a Scope row. A dash, "—", for any other row.
   - **In simple words:** the one requirement, as `simple-writing-rules.md` says: a short title in bold, then a dash, then the statement in its kind's form. It keeps every condition, number and "no" or "not" of its part of the client's words, and adds nothing. When the project has a Glossary, it uses the agreed words. When an agreed word doesn't fit the meaning, it uses another plain word, never a retired one (`conventions.md`, "Agreed words"). When a part has two possible meanings, it is not guessed. It becomes a question, and the simple words name it, such as `[TBD, Q7]`. Each Requirement row must also be one that can be checked yes or no (Q4). When it can't, such as "quickly" with no time, no limit is made up. The simple words keep the client's word and name its question, such as "A customer finds any product quickly [TBD, Q9]". Words that are already simple may stay as the client wrote them.
   - **The client's words:** only the part of the client's row that this requirement comes from, exactly as the file writes it. The first part keeps the client row's title, in bold. Read in order, the parts give back the client's whole row, word for word. They are kept so the specifier can check each row against them. No later document copies them. They, and the client's own heading above the table, are how each row is traced back to the client's (`conventions.md`, "Each requirement's source").
   - what it traces to. A Requirement traces to the business requirements of the client row it comes from. One that traces to none reads `[TBD, Q{n}]`. A row of any other kind names the section that holds it, as the kind table says.

   Where two files say different things, the Discovery brief's settlement says which file's words are recorded. A Scope row must agree with the BRD's In scope or Out of scope. One that doesn't gets a question, so the BRD can be updated through a change. A Way of working row is also written in section 8. A rule the client states stays in the PRD. Rules decided later are written in the FRDs.
5. **The end-to-end journey:** the whole product as one journey, from the first thing a user does to the last, in simple words. Each step names the Requirement rows it involves.
6. **NFRs:** NFR-1 onward, across both tables. Evidenced NFRs are ones a file states, in simple words, with the tag CONFIRMED or TENTATIVE. Recommended NFRs are ones no file states but the product would be at risk without, each marked AI-RECOMMENDED. Never invent a threshold: state it as the file does, or `[TBD, Q{n}]`.
7. **Transition requirements:** what has to happen to move from today's way of working to the new product, and whether the product itself must do it. Every "No" must also be one of the BRD's release criteria. One that isn't gets a question, so the BRD can be updated through a change.
8. **Dependencies and assumptions:** what the product relies on, and what is taken as true. An assumption no file confirms is marked `<sup>*Q{n}</sup>`.
9. **Traceability matrix:** every business requirement in the BRD, one row each, named as the BRD names it, with the Requirement rows that cover it. One that nothing covers reads `Gap [TBD, Q{n}]`. The PRD never suggests a requirement to fill a Gap (`conventions.md`, "Ask, don't assume").

Business language throughout: what the product does, never how it is built (`conventions.md`, "Business language"). Never invent a limit, threshold or rule (`conventions.md`, "Nothing invented").

### 3. Run the checklist

Work through `references/prd-checklist.md`, and fix anything that fails. Lines marked "checked by check-prd.ts" are left to the program.

### 4. Raise the questions

Run probing-questions-author on the PRD. It drafts and rates a question for every gap, and hands back each gap's place and its question's number. Write each number into its mark, such as `[TBD, Q7]` or `<sup>*Q4</sup>`. Then run `node tools/grade-questions.ts --project {project}`.

### 5. Check

Run `node tools/check-prd.ts --project {project}`. Fix every finding and run it again, until every check passes.

### 6. The gate

Hold the gate exactly as `decision-review-gates.md` says, with probing-questions-author asking each decision in its Ask mode. The order:
- first, the two "For the person" blocks: the check program's, then `grade-questions.ts`'s
- then the questions the PRD raised or builds on, one at a time, in the order `grade-questions.ts` sets, and the Can move ahead list
- then each recommended NFR, to accept, change or reject, unless a question above already settled it
- then **"Do my short versions keep everything the client wrote?"**. This is BABOK 4.3, Confirm Elicitation Results. Before it is asked, compare each row's simple words with its client's words: every number, condition, "not", who and when. Start from the places check-prd.ts lists to look at. The question shows each row where something was lost or changed, side by side: what the client wrote, what the PRD says, and what differs. When a row lost something, the answers are:
  - "Put back what was lost." The skill rewrites only the rows shown. This is the recommended answer.
  - "Keep my versions as they are." The rows shown go on the list for the client to confirm.
  - "Show me every row, one section at a time." One decision for each section of the PRD.
  - "I don't know yet." The skill puts back what was lost, and every row goes on the list for the client to confirm.

  When no row lost anything, the question says so, and shows up to five rows that changed the most, as a sample. The answers are:
  - "They all say the same." This is the recommended answer.
  - "Some rows need changing." The specifier names the rows, and the skill rewrites only those.
  - "Show me every row, one section at a time." One decision for each section of the PRD.
  - "I don't know yet." The simple words are used, and every row goes on the list for the client to confirm.
- then **"Are these rows not requirements?"**, showing each row whose kind isn't Requirement, side by side: the client's words, the kind it was given, in plain words, its Label, and why. First say what each kind means, in one line each, from the kind table's "The row says" column. This question is skipped when every row is a Requirement. The answers:
  - "They are all right."
  - "Some are requirements after all." The specifier names the rows. Each one becomes a Requirement, with its business requirements.
  - "I don't know yet." The kinds are used as they are, and the rows go on the list for the client to confirm.
- then the gate's own question, **Accept the PRD?**

The PRD has no Decision record. Record each answer straight away, in the Question log only: its Answer, and "Decided in" naming the PRD's gate and the date, such as "expense-claims-prd.md, at its gate, 2026-10-08". Then write the answer into the PRD: the value takes the place of `[TBD, Q{n}]`, or loses its `<sup>*Q{n}</sup>`. When a table or list has no `<sup>*Q{n}</sup>` left, its legend line goes too.

When the gate ends, paste check-prd.ts's "For the file" line into the Check record, in place of what it held. The line is Pass or Fail, then the date and time, such as `Pass, 2026-11-03 14:05`.

When the specifier accepts, run `node tools/accept.ts --project {project} --document prd`, then close with `status.ts`.

The PRD covers the whole product, so after a third "no" the skill offers only "accept it as it is" and "one more round" (`decision-review-gates.md`, rule 11).

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names the PRD, read the report and the files the specifier brought, and change only what the recommendation names. Everything else stays as it is. The PRD then goes through its check and its gate again, and acceptance saves a new version.

## Quality

Everything the skill writes, including each requirement's simple words, follows `../_shared/simple-writing-rules.md`. The client's words are recorded, not judged. From `../_shared/quality-characteristics.md`, everything the skill writes must pass:
- Q1, one requirement per row
- Q4, one reading
- Q7, business language
- Q9, sourced: it comes from a file the Discovery brief marks Used, or from an answer, though the PRD names neither
- Q10, readable on the first pass

## Handoff

The accepted PRD feeds `glossary-author`, which agrees the words the product uses. Then it feeds `data-model-workflow`, and then `feature-author`.
