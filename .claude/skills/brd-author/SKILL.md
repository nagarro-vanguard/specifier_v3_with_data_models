---
name: brd-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the BRD from the accepted Discovery brief and the requirement files it
  marks Used: the executive summary with its Problem or Opportunity call,
  objectives with confidence-tagged KPIs, scope, business requirements BR-01
  onward, risks and constraints, and release criteria, every line saying where it
  came from. One gate, "Accept the BRD?". Use after the Discovery brief is
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
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
- **Its gate:** "Accept the BRD?"
- **Its check:** `check-brd.cjs`

## Steps

### 1. Set up

Run `node tools/scaffold-project.cjs --project {project}`. If the Discovery brief is missing, or isn't accepted, say so and stop.

### 2. Write each section

Write every section of the template, in order, as its "What each section holds" says. Those notes stay in the template: the document has no line in italics under its headings. Every line says where it came from, on its own, in one of four ways: per a file, per a decision, Proposed (needs confirmation) with its question, or TBD with its question.

1. **Executive summary:** the "why" and the value, clear in under 60 seconds. Someone who reads only this section can decide whether to go ahead. It names a measurable outcome, never a vague "improve" or "enhance". Then the call:
   - **Problem:** fixes measurable pain today: time, cost, errors, risk, complaints, revenue leakage.
   - **Opportunity:** unlocks new value, such as enterprise readiness, upsell, delight or differentiation, without strong existing pain.
   - **Both:** labelled "Problem (primary), Opportunity (secondary)".
2. **Background and current state:** the pain or opportunity, with any baseline data. It supports the call in section 1, and never contradicts it.
3. **Objectives and success metrics:** each objective with its source. Each KPI with its baseline, target, measurement method, measurement cadence and owner, every cell saying where it came from. The measurement method is the report or record it is read from, such as "payment dates in the finance team's records". Tag every KPI CONFIRMED, TENTATIVE or AI-RECOMMENDED (`conventions.md`, "Confidence"), and fill the Metrics Confidence Summary above the KPI table.
4. **Scope, assumptions and dependencies:** In and Out both stated outright. Out of scope is never blank: it names what people are likely to assume is included. Assumptions and dependencies are kept apart from the requirements.
5. **Business requirements:** numbered BR-01 onward. Each is single, testable, in business language, traces to an objective, and stands on its own: these are the anchors the rest of the work traces to. Each row holds one business requirement, as `../_shared/atomic-rules.md` says.
6. **Risks, constraints and mitigations:** each risk with its impact, likelihood, mitigation and source. Constraints are listed separately.
7. **Release criteria:** measurable pass or fail tests for the product as a whole. Story-level criteria come much later, from ac-author, and are not repeated in the BRD.
8. **Traceability mini-map:** three to six rows, linking each objective to the business requirements that serve it and the release criteria that prove it.

When no file and no answer gives an objective or a business requirement the product clearly needs, suggest one, marked Proposed (needs confirmation), and go on. The specifier decides each one at the gate (`conventions.md`, "Ask, don't assume").

Never invent a number, limit, threshold or timeframe (`conventions.md`, "Nothing invented"): a value no file and no answer gives is TBD or Proposed.

### 3. Run the checklist

Work through `references/brd-checklist.md`, and fix anything that fails. Lines marked "checked by check-brd.cjs" are left to the program.

### 4. Raise the questions

Run probing-questions-author on the BRD. It drafts and rates a question for every gap, and hands back each gap's place and its question's number. Write each number in, such as "TBD, question 7". Then run `node tools/grade-questions.cjs --project {project}`.

### 5. Check

Run `node tools/check-brd.cjs --project {project}`. Fix every finding and run it again, until every check passes.

### 6. The gate

Hold the gate exactly as `decision-review-gates.md` says:
- first, the two "For the person" blocks: the check program's, then `grade-questions.cjs`'s
- then the questions the BRD raised or builds on, one at a time, in the order `grade-questions.cjs` sets, and the Can move ahead list
- then each objective and business requirement marked Proposed, unless a question above already settled it
- then the gate's own question, **Accept the BRD?**

Record each answer straight away, in the Decision record and the Question log. When the specifier accepts, run `node tools/accept.cjs --project {project} --document brd`, then close with `status.cjs`.

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
- Q9, sourced
- Q10, readable on the first pass

## Handoff

The accepted BRD feeds `prd-author`, which traces every requirement to a business requirement.
