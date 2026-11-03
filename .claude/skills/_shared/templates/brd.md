# BRD — {product name}

Status: drafted

## 1. Executive summary

{summary}

- **Problem or opportunity:** {problem or opportunity}
- **Classification:** {classification}

## 2. Background and current state

- {fact about today}

## 3. Objectives and success metrics

- {objective}

> **Metrics Confidence Summary:**
> - **CONFIRMED:** {confirmed count} metrics. Each one is fully supported by the source documents.
> - **TENTATIVE:** {tentative count} metrics. Each one is partly supported, and its details need checking.
> - **AI-RECOMMENDED:** {recommended count} metrics. The AI suggested each one, and you decide at the gate.
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

| KPI | Baseline | Target | Measurement method | Measurement cadence | Owner | Confidence |
|---|---|---|---|---|---|---|
| {KPI} | {baseline} | {target} | {measurement method} | {cadence} | {owner} | {confidence} |

## 4. Scope, assumptions and dependencies

### In scope

- {in scope item}

### Out of scope

- {out of scope item}

### Assumptions

- {assumption}

### Dependencies

- {dependency}

## 5. Business requirements

| BR ID | Business requirement |
|---|---|
| {BR ID} | {business requirement} |

## 6. Risks, constraints and mitigations

### Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| {risk} | {impact} | {likelihood} | {mitigation} |

### Constraints

- {constraint}

## 7. Release criteria

| # | Release criterion |
|---|---|
| {number} | {release criterion} |

## Traceability mini-map

| Objective | Business requirements | Release criteria |
|---|---|---|
| {objective} | • {BR ID}<br>• {BR ID} | • {number} |

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The business case: why the product is needed, what it must achieve and how success is measured, and the business requirements, BR-01 onward, that everything after it traces to.
- **What it is not:** What the product must do in detail. That is the PRD, in simple words, with the requirement files' own words next to them. NFRs are not in the BRD either. They are written only in the PRD.
- **Written by:** brd-author, from `templates/brd.md`. Checked by check-brd.ts before its gate.

### No citations, and two marks

The BRD names no file, no section and no decision. Nothing reads "per …", and no table has a Source column. Where each fact came from is kept elsewhere: the Discovery brief lists the files the BRD is written from, and the Question log keeps every question, its answer and where it was decided.

A value that isn't a plain fact from the files has one of two marks, and the mark names its question in the Question log:

| When | Write | Example |
|---|---|---|
| No file and no answer gives the value yet | `[TBD, Q{n}]`, in place of the value | `[TBD, Q7]` |
| The skill suggests the value, for you to confirm | the value, then `<sup>*Q{n}</sup>` | `A reminder after 3 working days<sup>*Q8</sup>` |

Every table or list that holds a `<sup>*Q{n}</sup>` has this line straight under it, once:

`<sup>*</sup> Proposed: needs your confirmation. Qn is its question in the Question log.`

A table or list with no `<sup>*Q{n}</sup>` has no such line.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Executive summary | Why the product is needed and what it is worth, readable in under a minute. Someone who reads only this section should be able to decide whether to go ahead. It names a measurable outcome, never a vague one such as "improve" or "enhance". |
| 2. Background and current state | How things work today, and the evidence behind the problem or opportunity. It supports the classification in section 1, and never contradicts it. |
| 3. Objectives and success metrics | What the product must achieve, and how we will know it has. Every KPI supports an objective, and has one confidence tag (`conventions.md`, "Confidence"). Every KPI cell holds a value, `[TBD, Q{n}]`, or a value marked `<sup>*Q{n}</sup>`. A value that no file and no answer gives is never made up. When nothing gives an objective, the skill suggests one, marked `<sup>*Q{n}</sup>`, for you to decide at the gate. |
| 4. Scope, assumptions and dependencies | What is in and what is out, both stated outright. Out of scope is never blank: it names what people are likely to assume is included. Assumptions and dependencies are kept apart from the requirements. |
| 5. Business requirements | What the business needs, in the business's words, one need per row. Each is numbered BR-01 onward, can be tested, and traces to an objective in section 3. They are the anchors every later document traces back to, so each must stand on its own. When nothing gives a business requirement the product clearly needs, the skill suggests it, marked `<sup>*Q{n}</sup>`, for you to decide at the gate. |
| 6. Risks, constraints and mitigations | What could stop the product from reaching its objectives, and what we will do about it. Constraints are limits we have to work within, listed separately from risks. A risk or mitigation the skill suggests is marked `<sup>*Q{n}</sup>`. |
| 7. Release criteria | The pass or fail tests for releasing the product as a whole, each one measurable. Detailed criteria for each story come much later, from ac-author, and are not repeated in the BRD. |
| Traceability mini-map | Three to six rows linking each objective to the business requirements that serve it, and to the release criteria that prove it. |
| Check record | One line: Pass or Fail, then the date and time of the last check, exactly as check-brd.ts printed it under "For the file", such as `Pass, 2026-11-03 14:05`. |

The BRD has no Decision record. Each answer at its gate is written in the Question log, and the log's "Decided in" names the BRD's gate.

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as in the Discovery brief | Expense claims |
| {summary} | two to four sentences: the problem or opportunity, what the product will do about it, and the outcome it aims for | Expense claims are made on paper today and take 18 working days to pay. The new service lets employees claim online and managers approve online, and aims to cut the time to payment. |
| {problem or opportunity} | one paragraph on what is wrong today, or what could be gained, with any figure the files give | Paper claims take 18 working days from sending to payment. |
| {classification} | Problem, when it fixes a measurable pain, or Opportunity, when it unlocks new value | Problem |
| {fact about today} | one fact about how things work today, with any figure the files give | Claims are made on a paper form and checked by hand by the finance team |
| {objective} | one outcome the product must achieve | Pay approved claims faster |
| {confirmed count}, {tentative count}, {recommended count} | how many KPIs have each tag | 0, 2, 1 |
| {KPI} | what is measured | Working days from sending a claim to paying it |
| {baseline} | today's figure, or `[TBD, Q{n}]` | 18 |
| {target} | the figure to reach, `[TBD, Q{n}]`, or a suggested figure marked `<sup>*Q{n}</sup>` | [TBD, Q7] |
| {measurement method} | the report or data it is measured from, `[TBD, Q{n}]`, or a suggestion marked `<sup>*Q{n}</sup>` | Payment dates in the finance team's records |
| {cadence} | how often it is measured, `[TBD, Q{n}]`, or a suggestion marked `<sup>*Q{n}</sup>` | Monthly |
| {owner} | who owns the KPI, `[TBD, Q{n}]`, or a suggestion marked `<sup>*Q{n}</sup>` | Finance team |
| {confidence} | CONFIRMED, TENTATIVE or AI-RECOMMENDED. For TENTATIVE, say what is missing. | TENTATIVE: no file gives a target |
| {in scope item} | something the product covers | Making, approving and paying expense claims |
| {out of scope item} | something people may assume is covered, but isn't | Booking travel |
| {assumption} | something taken as true without proof | Every claim is made in euros<sup>*Q4</sup> |
| {dependency} | something that must exist or happen for the product to work | Each claimant's line manager is known |
| {BR ID} | BR- and a two-digit number, from BR-01 | BR-01 |
| {business requirement} | one need, testable, in business language | Employees and contractors can claim business expenses without a paper form. |
| {risk} | what could go wrong | Managers leave claims waiting |
| {impact} | High, Medium or Low, and what it would cost | High: a claim that misses the 20th is paid a month late |
| {likelihood} | High, Medium or Low, or `[TBD, Q{n}]` | Medium |
| {mitigation} | what we will do about it, or a suggestion marked `<sup>*Q{n}</sup>` when no file says so | A reminder after 3 working days<sup>*Q8</sup> |
| {constraint} | a limit the product must work within | Claims approved after the 20th are paid the following month |
| {number} | a number, from 1 | 1 |
| {release criterion} | a pass or fail test for the whole product | Every claim made by the pilot team in one month is paid without a paper form |
