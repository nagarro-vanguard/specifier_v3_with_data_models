# EPIC brief — {EPIC ID} {EPIC name}

Status: drafted

## 1. Description

**Epic hypothesis:** As a {persona}, I need {capability}, so that {outcome}.

{context}

## 2. Business value

- {value} — per {feature or requirement ID}

## 3. Success or fitness criteria

**Benefit hypothesis:** {benefit hypothesis}

> **Metrics Confidence Summary:**
> - **CONFIRMED:** {confirmed count} metrics. Each one is fully supported by the source documents.
> - **TENTATIVE:** {tentative count} metrics. Each one is partly supported, and its details need checking.
> - **AI-RECOMMENDED:** {recommended count} metrics. The AI suggested each one, and you decide at the gate.
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

| Measure | Baseline | Target | Confidence |
|---|---|---|---|
| {measure} | {baseline} | {target} | {confidence} |

## 4. Scope

### In

- {feature ID} {feature name}

### Out

- {feature ID} {feature name} — owned by {EPIC ID}

## 5. Features

| Feature ID | Feature | Req ID | What it delivers | Band |
|---|---|---|---|---|
| {feature ID} | {feature name} | • {requirement ID} | {description} | {band} |

## 6. Dependencies

### EPICs this one needs

- {EPIC ID} {EPIC name}, linked by {link}, or None

### EPICs that need this one

- {EPIC ID} {EPIC name}, linked by {link}, or None

## 7. NFRs that apply

| NFR ID |
|---|
| {NFR ID} |

## 8. References

- **EPIC grouping:** [grouping.md](../grouping.md)
- **Requirements:** [{product}-prd.md](../../{product}-prd.md)
- **Design:** {design link}

## Decision record

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** One EPIC described in full: its hypothesis, its business value, how its success is measured, its scope, features and dependencies, and the NFRs that apply.
- **What it is not:** Its stories or their acceptance criteria. Those sit beside it, in the EPIC's own folder.
- **Written by:** epic-author, from `templates/epic-brief.md`, only for the EPICs the EPIC grouping's brief list marks Yes. Checked by check-epic-brief.cjs before its gate.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Description | What this EPIC delivers, and for whom, as one hypothesis sentence, then a short paragraph of context. The persona and outcome are copied from the register. |
| 2. Business value | Why this EPIC is worth doing, in at most five lines, each citing the feature or requirement it comes from. |
| 3. Success or fitness criteria | How we will know this EPIC has delivered its value. A measure no file gives is AI-RECOMMENDED, and its baseline and target are TBD, never made up, and each TBD names its question in the Question log. |
| 4. Scope | What this EPIC covers, and what it leaves to other EPICs, copied from the register and the EPIC grouping. |
| 5. Features | Every feature in this EPIC, one row each, with the catalog's description of what it delivers. |
| 6. Dependencies | The EPICs this one needs first, and the EPICs that need this one, copied from the register. |
| 7. NFRs that apply | The IDs of the PRD's NFRs that apply to this EPIC. Their wording is written only in the PRD. |
| 8. References | Where to find what this EPIC is built from. A link to something that doesn't exist yet is written Does not exist. |
| Decision record | Every decision made at the EPIC brief's gate, in the order made, in the shape of `templates/parts/decision-record.md`. |
| Check record | The record of the last check, pasted exactly as check-epic-brief.cjs printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {EPIC ID} | the EPIC's ID, from the register | EPIC-002 |
| {EPIC name} | the EPIC's name, from the register | Claim approval |
| {product} | the project's name, as its folder has it | expense-claims |
| {persona} | the EPIC's persona, from the register | line manager |
| {capability} | what the persona needs to do | to approve my team's claims |
| {outcome} | the outcome, from the register | only checked claims are paid |
| {context} | one short paragraph of context, one idea per sentence | Today a manager signs a paper form. This EPIC moves approval online, including finance approval over the limit and a stand-in when the manager is away. |
| {value} | one line of value | No claim is paid without its manager's approval |
| {feature or requirement ID} | the feature or requirement it comes from | F-03 |
| {benefit hypothesis} | one sentence on the benefit expected | If managers approve online, claims will reach payment faster |
| {confirmed count}, {tentative count}, {recommended count} | how many measures have each tag | 0, 0, 1 |
| {measure} | what is measured | Working days from sending a claim to its approval |
| {baseline} | today's figure with its source, or TBD with its question | TBD, question 12 |
| {target} | the figure to reach with its source, or TBD with its question | TBD, question 12 |
| {confidence} | CONFIRMED, TENTATIVE or AI-RECOMMENDED | AI-RECOMMENDED |
| {feature ID} | a feature ID | F-03 |
| {feature name} | the feature's name, from the catalog | Manager approval |
| {requirement ID} | each requirement ID the feature covers | REQ-3.1 |
| {description} | the feature's description, from the catalog | A line manager approves or rejects each claim from their team, so that only checked claims are paid |
| {band} | MVP or Later | MVP |
| {link} | the feature link behind the dependency | F-03 depends on F-01 |
| {NFR ID} | an NFR ID from the PRD | NFR-1 |
| {design link} | a link to the design for this EPIC, or Does not exist | Does not exist |
