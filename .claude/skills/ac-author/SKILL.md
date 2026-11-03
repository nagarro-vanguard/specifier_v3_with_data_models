---
name: ac-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the acceptance criteria for every story of one EPIC: three to seven
  Given/When/Then scenarios each, every scenario naming the FRD rules it proves,
  checked so every rule of the EPIC's features is proved. One gate for all the
  EPIC's stories, "Accept the criteria? This marks the stories ready.", where any
  open Must answer question raised in the stories comes first. Use once an EPIC's
  grooming is accepted, for example "write the acceptance criteria for EPIC-002".
  Not for grooming (use story-groomer) or drafting stories (use story-drafter).
---

# ac-author

> **What this is:** The skill that writes each story's acceptance criteria for one EPIC, proves every rule of its features is covered, and marks the stories ready.
>
> **What it is not:** A place for new rules. A scenario only proves rules the FRDs already hold. A gap becomes a question.
>
> **Who uses it:** `stories-workflow`, after the grooming is accepted. A specifier, on its own, with the project's name and the EPIC.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md`, `../_shared/atomic-rules.md` and `../_shared/decision-review-gates.md`. It writes in the shape of `../_shared/templates/story.md`, section "Acceptance criteria". Its quality standard, coverage checklist and examples are in `references/acceptance-criteria.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:** the Stories.
- **Looks up:** the FRDs, the Glossary and the Question log.
- **Writes:**
  - the Acceptance criteria section of each Story, after Design links
  - the ready marks: each story's status, ready, in the Story and the list
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
- **Its gate:** "Accept the criteria? This marks the stories ready."
- **Its checks:** `check-stories.cjs`, then `coverage-check.cjs`.

## Steps

1. **Set up.** If the EPIC's grooming isn't accepted, say so and stop.
2. **Write each story's scenarios,** three to seven, under the one heading, Behaviour, each as Given, When and Then, with a bold title and bold keywords, one per line. Each title ends with the FRD rules the scenario proves, in brackets, such as "(F-04.4)". Name people by their role, use a plain description for anything the rule doesn't depend on, and a real value for anything it does, as `references/acceptance-criteria.md` shows. Work through the coverage checklist. If a story needs eight or more, recommend splitting it before listing them.
3. **Raise the questions.** Run probing-questions-author on the Stories, write each question's number where its gap is, then run `node tools/grade-questions.cjs --project {project}`.
4. **Check.** Run `node tools/check-stories.cjs --project {project} --epic {epic}`, then `node tools/coverage-check.cjs --project {project} --epic {epic}`, which lists every rule of the EPIC's features that no scenario proves. Fix every finding and run them again.
5. **The gate.** Hold it as `../_shared/decision-review-gates.md` says:
   - first, the two "For the person" blocks
   - **the ready guard:** each Must answer question raised in these stories comes first, one at a time. While one is open, the stories can't be marked ready. `check-stories.cjs` fails until it is answered.
   - then the other questions, in order
   - then **Accept the criteria? This marks the stories ready.**
   Record each answer straight away. On acceptance, set each story's status to ready, in the Story and the list, then run `node tools/accept.cjs --project {project} --document story-list --epic {epic}`, and close with `status.cjs`.

An EPIC's gates offer "park it" after a third "no", with "accept it as it is" and "one more round" (`../_shared/decision-review-gates.md`, rule 11).

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names a scenario or a story, read the report too, and change only those scenarios, adding one for each rule the change adds or changes. Every other scenario stays word for word. The coverage check then runs again, and the stories are marked ready at the gate as usual.

## Rules

- **One behaviour per scenario,** as `../_shared/atomic-rules.md` says: its When holds one action.
- **Each "Then" is verifiable,** and something an outside observer can see. It is never a step of how it is built. Write "the claim's stage is Approved", not "call the approval service".
- **Never invent** a rule to make a scenario testable. Ask instead, as `conventions.md`, "Nothing invented", says.
- **Reuse the groomed story's exact words**: its roles, fields and statuses.
- Keep screen details out, unless a design mandates them.

## Handoff

When every story is ready, the EPIC is ready, and `stories-workflow` routes to the next EPIC.
