# Story list — {EPIC ID} {EPIC name}

Status: drafted

| | |
|---|---|
| Source EPIC | {EPIC ID} {EPIC name} |
| Persona | {persona} |
| Identity | Req ID and Feature ID |

## Stories

| # | Story | Statement | Req ID | Feature ID | Status |
|---|---|---|---|---|---|
| {number} | {story link} | {statement} | • {requirement ID} | {feature ID} | {story status} |

## Out of scope / routed

| Item | Where it went | Why |
|---|---|---|
| {item} | {where it went} | {why} |

## Coverage

| Feature | Story(ies) |
|---|---|
| {feature ID} {feature name} | • {story title} |

## Decision record

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The list of one EPIC's stories, in order, each with its statement and status, and which stories cover each feature.
- **What it is not:** The stories' detail. Each Story's grooming and acceptance criteria are in its own file, beside this one.
- **Written by:** story-drafter, from `templates/story-list.md`, and kept up to date by story-groomer and ac-author. Checked by check-stories.cjs before each of their gates.

### What each section holds

| Section | What it holds |
|---|---|
| The top | The EPIC these stories come from, and how each story is identified. |
| Stories | Every story in this EPIC, in the order they are worked. A story's title is its identity: a verb and an object, two to six words, such as "Reject a Claim". Its statement reads "As a" persona, "I want" one capability, "so that" the value. This list owns the statement, and the Story's own file repeats it exactly. Status is drafted, groomed or ready. The EPIC is ready when every story is ready. |
| Out of scope / routed | Anything someone might expect in this EPIC that isn't in it, where it went instead, and why. |
| Coverage | Every feature of this EPIC, and the stories that tell it. A feature with no story is routed, and listed under "Out of scope / routed". |
| Decision record | Every decision made at this EPIC's story gates, in the order made, in the shape of `templates/parts/decision-record.md`. |
| Check record | The record of the last check, pasted exactly as check-stories.cjs printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {EPIC ID} | the EPIC's ID, from the register | EPIC-002 |
| {EPIC name} | the EPIC's name, from the register | Claim approval |
| {persona} | the EPIC's persona, from the register | Line manager |
| {number} | the story's place in the order the stories are worked, from 1 | 2 |
| {story link} | a link to the story's file, with its title as the text | [Reject a Claim](reject-a-claim.md) |
| {statement} | "As a" persona, "I want" one capability, "so that" the value | As a line manager, I want to reject a claim with a reason, so that the claimant knows what to fix. |
| {requirement ID} | each requirement ID the story serves | REQ-3.1 |
| {feature ID} | the feature the story tells | F-03 |
| {story status} | drafted, groomed or ready | drafted |
| {item} | something someone might expect in this EPIC that isn't in it | Paying an approved claim |
| {where it went} | the EPIC or story that has it | EPIC-003 |
| {why} | one line on why | payment is its own EPIC |
| {feature name} | the feature's name, from the catalog | Manager approval |
| {story title} | each story that tells the feature | Reject a Claim |
