# BRD — {product name}

Status: drafted

## 1. Executive summary

{summary}

- **Problem or opportunity:** {problem or opportunity}
- **Classification:** {classification}

## 2. Background and current state

- {fact about today} — per {source and place}

## 3. Objectives and success metrics

| Objective | Source |
|---|---|
| {objective} | {line source} |

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

- {in scope item} — per {source and place}

### Out of scope

- {out of scope item} — per {source and place}

### Assumptions

- {assumption} — {line source}

### Dependencies

- {dependency} — per {source and place}

## 5. Business requirements

| BR ID | Business requirement | Source |
|---|---|---|
| {BR ID} | {business requirement} | {line source} |

## 6. Risks, constraints and mitigations

### Risks

| Risk | Impact | Likelihood | Mitigation | Source |
|---|---|---|---|---|
| {risk} | {impact} | {likelihood} | {mitigation} | {line source} |

### Constraints

- {constraint} — per {source and place}

## 7. Release criteria

| # | Release criterion | Source |
|---|---|---|
| {number} | {release criterion} | {line source} |

## Traceability mini-map

| Objective | Business requirements | Release criteria |
|---|---|---|
| {objective} | • {BR ID}<br>• {BR ID} | • {number} |

## Decision record

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The business case: why the product is needed, what it must achieve and how success is measured, and the business requirements, BR-01 onward, that everything after it traces to.
- **What it is not:** What the product must do in detail. That is the PRD, in simple words, with the requirement files' own words next to them. NFRs are not in the BRD either. They are written only in the PRD.
- **Written by:** brd-author, from `templates/brd.md`. Checked by check-brd.cjs before its gate.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Executive summary | Why the product is needed and what it is worth, readable in under a minute. Someone who reads only this section should be able to decide whether to go ahead. It names a measurable outcome, never a vague one such as "improve" or "enhance". |
| 2. Background and current state | How things work today, and the evidence behind the problem or opportunity. It supports the classification in section 1, and never contradicts it. |
| 3. Objectives and success metrics | What the product must achieve, and how we will know it has. Every KPI supports an objective, and has one confidence tag (`conventions.md`, "Confidence"). Every cell says where it came from, on its own: per a file, per a decision, Proposed (needs confirmation), or TBD. A value that no file and no answer gives is TBD or Proposed, never made up, and names its question in the Question log, such as "TBD, question 7". When nothing gives an objective, the skill suggests one, marked Proposed (needs confirmation), for you to decide at the gate. |
| 4. Scope, assumptions and dependencies | What is in and what is out, both stated outright. Out of scope is never blank: it names what people are likely to assume is included. Assumptions and dependencies are kept apart from the requirements. |
| 5. Business requirements | What the business needs, in the business's words, one need per row. Each is numbered BR-01 onward, can be tested, and traces to an objective in section 3. They are the anchors every later document traces back to, so each must stand on its own. When nothing gives a business requirement the product clearly needs, the skill suggests it, marked Proposed (needs confirmation), with its question, for you to decide at the gate. |
| 6. Risks, constraints and mitigations | What could stop the product from reaching its objectives, and what we will do about it. Constraints are limits we have to work within, listed separately from risks. Every risk says where it came from: a file, or the skill's own suggestion, marked Proposed (needs confirmation) with its question. |
| 7. Release criteria | The pass or fail tests for releasing the product as a whole, each one measurable. Detailed criteria for each story come much later, from ac-author, and are not repeated in the BRD. |
| Traceability mini-map | Three to six rows linking each objective to the business requirements that serve it, and to the release criteria that prove it. |
| Decision record | Every decision made at the BRD's gate, in the order made, in the shape of `templates/parts/decision-record.md`. |
| Check record | The record of the last check, pasted exactly as check-brd.cjs printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as in the Discovery brief | Expense claims |
| {summary} | two to four sentences: the problem or opportunity, what the product will do about it, and the outcome it aims for | Expense claims are made on paper today and take 18 working days to pay. The new service lets employees claim online and managers approve online, and aims to cut the time to payment. |
| {problem or opportunity} | one paragraph on what is wrong today, or what could be gained, with the source of each fact | Paper claims take 18 working days from sending to payment — per workshop-notes-2026-09-12.md, item 2 |
| {classification} | Problem, when it fixes a measurable pain, or Opportunity, when it unlocks new value | Problem |
| {fact about today} | one fact about how things work today, with any figure the files give | Claims are made on a paper form and checked by hand by the finance team |
| {source and place} | the file's name, and the section or item | claims-requirements-v2.docx, section 1.1 |
| {line source} | where the line came from, in one of four forms:<br>• per a file and place, such as "per claims-requirements-v2.docx, section 2.2"<br>• per your decision, such as "per Discovery brief, Decision 5"<br>• Proposed (needs confirmation), with its question<br>• TBD, with its question | per Discovery brief, Decision 5 |
| {objective} | one outcome the product must achieve | Pay approved claims faster |
| {confirmed count}, {tentative count}, {recommended count} | how many KPIs have each tag | 0, 2, 1 |
| {KPI} | what is measured | Working days from sending a claim to paying it |
| {baseline} | today's figure and its source, or TBD with its question | 18, per workshop-notes-2026-09-12.md, item 2 |
| {target} | the figure to reach and its source, or TBD or Proposed with its question | TBD, question 7 |
| {measurement method} | the report or data it is measured from, with its source, or TBD or Proposed with its question | Payment dates in the finance team's records, per workshop-notes-2026-09-12.md, item 2 |
| {cadence} | how often it is measured, with its source, or TBD or Proposed with its question | Monthly, per workshop-notes-2026-09-12.md, item 2 |
| {owner} | who owns the KPI, with its source, or TBD or Proposed with its question | Finance team, per workshop-notes-2026-09-12.md, item 2 |
| {confidence} | CONFIRMED, TENTATIVE or AI-RECOMMENDED. For TENTATIVE, say what is missing. | TENTATIVE: no file gives a target |
| {in scope item} | something the product covers | Making, approving and paying expense claims |
| {out of scope item} | something people may assume is covered, but isn't | Booking travel |
| {assumption} | something taken as true without proof | Every claim is made in euros |
| {dependency} | something that must exist or happen for the product to work | Each claimant's line manager is known |
| {BR ID} | BR- and a two-digit number, from BR-01 | BR-01 |
| {business requirement} | one need, testable, in business language | Employees and contractors can claim business expenses without a paper form. |
| {risk} | what could go wrong | Managers leave claims waiting |
| {impact} | High, Medium or Low, and what it would cost | High: a claim that misses the 20th is paid a month late |
| {likelihood} | High, Medium or Low, or TBD with its question | Medium |
| {mitigation} | what we will do about it, with its source, or marked Proposed (needs confirmation) with its question when no file says so | A reminder after 3 working days, Proposed (needs confirmation), question 8 |
| {constraint} | a limit the product must work within | Claims approved after the 20th are paid the following month |
| {number} | a number, from 1 | 1 |
| {release criterion} | a pass or fail test for the whole product | Every claim made by the pilot team in one month is paid without a paper form |
