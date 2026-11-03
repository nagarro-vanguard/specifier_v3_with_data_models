---
name: brd-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the BRD from the accepted Discovery brief and the requirement files it
  marks Used: the executive summary with its Problem or Opportunity call,
  objectives with confidence-tagged KPIs, scope, business requirements BR-01
  onward, risks and constraints, and release criteria, with no citations: a gap
  reads [TBD, Q7] and a suggestion is marked with a superscript *. One gate, "Accept the BRD?". Use after the Discovery brief is
  accepted, for example "write the BRD for expense-claims", or in a change whose
  recommendation names the BRD. Not for the detailed requirements (use prd-author)
  or the Discovery brief (use discovery-author).
---

# brd-author

> **What this is:** The skill that writes the business case: why the product is needed, what it must achieve and how success is measured, and the business requirements, BR-01 onward, that everything after it traces to.
>
> **What it is not:** The detailed requirements, which prd-author records in the PRD, in simple words, with the client's words next to them. The BRD holds no NFRs and no journey: both are kept in the PRD.
>
> **Who uses it:** `requirements-workflow`, as its second step, and the Extend and Update paths of a change when the BRD holds the changed thing. A specifier, on its own, with the project's name.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md`, `../_shared/atomic-rules.md` and `../_shared/decision-review-gates.md`. It writes from `../_shared/templates/brd.md`, and `../_shared/examples/brd.md` shows a finished one. Its checklist is `references/brd-checklist.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:**
  - the accepted Discovery brief, always
  - the requirement files the brief marks Used, and only those
  - in a change, also the Change impact report
- **Writes:**
  - `{product}-brd.md`
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.ts`
- **Its gate:** "Accept the BRD?"
- **Its check:** `check-brd.ts`

## Steps

### 1. Set up

Run `node tools/scaffold-project.ts --project {project}`. If the Discovery brief is missing, or isn't accepted, say so and stop.

### 2. Write each section

Write every section of the template, in order, as its "What each section holds" says. Those notes stay in the template: the document has no line in italics under its headings.

The BRD cites nothing: no "per …", no file name, no section number, no decision number, and no Source column. A value from the files, or from an answer, is written as it is. A value nothing gives yet, or one the skill suggests, carries a mark that names its question, as the template's "No citations, and two marks" says:
- not known yet: `[TBD, Q{n}]`, in place of the value
- suggested by the skill: the value, then `<sup>*Q{n}</sup>`, and the legend line straight under that table or list, once

1. **Executive summary:** the "why" and the value, clear in under 60 seconds. Someone who reads only this section can decide whether to go ahead. It names a measurable outcome, never a vague "improve" or "enhance". Then the call:
   - **Problem:** fixes measurable pain today: time, cost, errors, risk, complaints, revenue leakage.
   - **Opportunity:** unlocks new value, such as enterprise readiness, upsell, delight or differentiation, without strong existing pain.
   - **Both:** labelled "Problem (primary), Opportunity (secondary)".
2. **Background and current state:** the pain or opportunity, with any baseline data. It supports the call in section 1, and never contradicts it.
3. **Objectives and success metrics:** each objective, one per line. Each KPI with its baseline, target, measurement method, measurement cadence and owner, every cell holding a value or a mark. The measurement method is the report or record it is read from, such as "payment dates in the finance team's records". Tag every KPI CONFIRMED, TENTATIVE or AI-RECOMMENDED (`conventions.md`, "Confidence"), and fill the Metrics Confidence Summary above the KPI table.
4. **Scope, assumptions and dependencies:** In and Out both stated outright. Out of scope is never blank: it names what people are likely to assume is included. Assumptions and dependencies are kept apart from the requirements.
5. **Business requirements:** numbered BR-01 onward. Each is single, testable, in business language, traces to an objective, and stands on its own: these are the anchors the rest of the work traces to. Each row holds one business requirement, as `../_shared/atomic-rules.md` says.
6. **Risks, constraints and mitigations:** each risk with its impact, likelihood and mitigation. Constraints are listed separately.
7. **Release criteria:** measurable pass or fail tests for the product as a whole. Story-level criteria come much later, from ac-author, and are not repeated in the BRD.
8. **Traceability mini-map:** three to six rows, linking each objective to the business requirements that serve it and the release criteria that prove it.

When no file and no answer gives an objective or a business requirement the product clearly needs, suggest one, marked `<sup>*Q{n}</sup>`, and go on. The specifier decides each one at the gate (`conventions.md`, "Ask, don't assume").

Never invent a number, limit, threshold or timeframe (`conventions.md`, "Nothing invented"): a value no file and no answer gives is `[TBD, Q{n}]`, or a suggestion marked `<sup>*Q{n}</sup>`.

### 3. Run the checklist

Work through `references/brd-checklist.md`, and fix anything that fails. Lines marked "checked by check-brd.ts" are left to the program.

### 4. Raise the questions

Run probing-questions-author on the BRD. It drafts and rates a question for every gap, and hands back each gap's place and its question's number. Write each number into its mark, such as `[TBD, Q7]` or `<sup>*Q8</sup>`. Then run `node tools/grade-questions.ts --project {project}`.

### 5. Check

Run `node tools/check-brd.ts --project {project}`. Fix every finding and run it again, until every check passes.

### 6. The gate

Hold the gate exactly as `decision-review-gates.md` says, with probing-questions-author asking each decision in its Ask mode. The order:
- first, the two "For the person" blocks: the check program's, then `grade-questions.ts`'s
- then the questions the BRD raised or builds on, one at a time, in the order `grade-questions.ts` sets, and the Can move ahead list
- then each objective and business requirement marked `<sup>*Q{n}</sup>`, unless a question above already settled it
- then the gate's own question, **Accept the BRD?**

The BRD has no Decision record. Record each answer straight away, in the Question log only: its Answer, and "Decided in" naming the BRD's gate and the date, such as "expense-claims-brd.md, at its gate, 2026-10-06". Then write the answer into the BRD: the value takes the place of `[TBD, Q{n}]`, or loses its `<sup>*Q{n}</sup>`. When a table or list has no `<sup>*Q{n}</sup>` left, its legend line goes too.

When the gate ends, paste check-brd.ts's "For the file" line into the Check record, in place of what it held: Pass or Fail, then the date and time, such as `Pass, 2026-11-03 14:05`.

When the specifier accepts, run `node tools/accept.ts --project {project} --document brd`, then close with `status.ts`.

The BRD covers the whole product, so after a third "no" the skill offers only "accept it as it is" and "one more round" (`decision-review-gates.md`, rule 11).

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names the BRD, read the report too, and change only what it names. Everything else stays as it is. The BRD then goes through its check and its gate again, and acceptance saves a new version.

## Quality

From `../_shared/quality-characteristics.md`, every business requirement must pass:
- Q1, one capability
- Q2, complete
- Q4, one reading
- Q5, verifiable
- Q6, consistent with the others and with its source
- Q7, business language
- Q9, sourced: it comes from a file the Discovery brief marks Used, or from an answer, though the BRD names neither
- Q10, readable on the first pass

## Handoff

The accepted BRD feeds `prd-author`, which traces every requirement to a business requirement.
