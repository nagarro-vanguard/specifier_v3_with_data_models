# EPIC register — {product name}

Status: drafted

- **Created:** {created date}
- **Source grouping:** [grouping.md](grouping.md), version {grouping version}
- **Based on:** {based on}
- **Copy checked on:** {check date}

## 1. EPICs

| EPIC | Name | Outcome | Features | Band | Persona | Depends on |
|---|---|---|---|---|---|---|
| {EPIC ID} | {EPIC name} | {outcome} | • {feature ID}<br>• {feature ID} | {band} | {persona} | • {depends on} |

## 2. Run order

| Order | EPIC | Rationale |
|---|---|---|
| {number} | {EPIC ID} | {rationale} |

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The list of EPICs, copied field for field from the chosen grouping in the EPIC grouping, with the order they are worked in.
- **What it is not:** A place to decide anything. Nothing in the register is written fresh, and a program checks that it matches the EPIC grouping.
- **Written by:** epic-author, from `templates/epic-register.md`. Checked by check-register.ts. It has no gate: it is accepted when the check finds it matches the EPIC grouping.

### What each section holds

| Section | What it holds |
|---|---|
| The top | Where the register comes from, and when its copy was last checked. |
| 1. EPICs | One row per EPIC, every field copied from the EPIC grouping's EPIC definitions, never written fresh. That way two runs over the same grouping give the same register. Each column is filled like this:<br>• EPIC: "EPIC-", then the grouping's Sl. No. as three digits, so row 1 becomes EPIC-001<br>• Name and Outcome: copied word for word<br>• Features: the feature IDs from MVP and Later, together<br>• Band and Persona: copied as they are<br>• Depends on: each EPIC this one depends on, from the grouping's inter-EPIC dependencies, with its Sl. No. turned into its EPIC ID |
| 2. Run order | The order the EPICs are worked in, copied from the EPIC grouping's suggested sequence. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as in the EPIC grouping | Expense claims |
| {created date} | the date the register was first written, as YYYY-MM-DD | 2026-10-20 |
| {grouping version} | the EPIC grouping's accepted version | 1 |
| {based on} | whether the BRD and PRD were accepted. When there is no BRD, say so. The outcomes are then hypotheses only. | BRD and PRD both accepted |
| {check date} | the date check-register.ts last passed, as YYYY-MM-DD, which it writes itself. Until it passes, write: not yet | 2026-10-20 |
| {EPIC ID} | EPIC- and three digits, from the grouping's Sl. No. | EPIC-002 |
| {EPIC name} | the EPIC's name, word for word | Claim approval |
| {outcome} | the EPIC's outcome, word for word | As a line manager, I need to approve my team's claims, so that only checked claims are paid |
| {feature ID} | each feature ID in the EPIC | F-03 |
| {band} | MVP, Later or Mixed | Mixed |
| {persona} | the EPIC's persona | Line manager |
| {depends on} | each EPIC this one depends on, or None | EPIC-001 |
| {number} | a number, from 1 | 1 |
| {rationale} | the reason for its place, copied from the grouping | foundational: every other EPIC needs claims to exist |
