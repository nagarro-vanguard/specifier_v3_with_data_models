# Story — {story title}

| | |
|---|---|
| Status | {story status} |
| Req ID | • {requirement ID} |
| Feature ID | {feature ID} |
| Work Item ID | {work item ID} |

## Description

{statement}

## Dependencies

- {story} ({work item}): {why}. Proved by {FRD gate or step}.

## Scope

> **SIZING ALERT**
> This story may exceed the recommended 2-day scope based on:
> - {warning sign}
>
> **Recommendation:** Consider splitting. The ways to split it are raised as a question in the Question log.

- {scope item}
- Out of scope: {left-out item}

## Roles

| Role | {action} |
|---|---|
| {actor} | {permission} |

## Rules

| Step | FRD rule ID | Rule |
|---|---|---|
| {step} | {rule ID} | {rule} |

## Metrics traceability

- {measure}

## Design links

- {design link}

## Acceptance criteria

### Behaviour

**Scenario 1 - {scenario title} ({rule IDs})**
- **Given** {starting state}
- **When** {action taken}
- **Then** {outcome}
- **And** {further outcome}

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** One story, built up in this one file: its description, then its grooming, then its acceptance criteria, each scenario naming the FRD rules it proves.
- **What it is not:** A place for new rules. Every rule a story uses is quoted from an FRD.
- **Written by:** story-drafter writes the description, story-groomer the sections from Dependencies to Design links, and ac-author the acceptance criteria, from `templates/story.md`. Checked by check-stories.ts.

### What each section holds

| Section | What it holds |
|---|---|
| The top | The story's status, and where it traces to. A Story has no separate status line: its status is the Status row below. The status also says which sections the story has. A drafted story has its Description only. A groomed story adds the sections from Dependencies to Design links. A ready story adds its Acceptance criteria. |
| Description | The statement, exactly as the Story list has it: who wants what, and why. |
| Dependencies | Stories or work that must come first, one line each. Each line gives the story, its work item, why it comes first, and the FRD gate or step that proves it. When nothing must come first, this says None. |
| Scope | What is in this story, then what is left out, one bullet each. A sizing alert comes first in this section, only when the story may take more than two days. That is when the story has any of these: 5 or more scope items, 8 or more rules, more than 1 persona, or "and" or "or" in what it lets someone do. |
| Roles | Who can do what in this story, taken only from the FRD's Actors. This section appears only when the FRD has more than one actor for this story's action, or a cell is No or TBD. Otherwise it is left out. |
| Rules | Every FRD rule this story delivers, quoted word for word, in the order of the FRD's flow. Step is the number of the flow step tagged with the rule, or Alternate for an alternate step. |
| Metrics traceability | Which of the EPIC brief's success measures this story helps move. When the EPIC has no brief, this says None. |
| Design links | Links to the design for this story, when there is one. Otherwise this says None. |
| Acceptance criteria | Three to seven scenarios, each written as Given, When, Then. Each scenario's title ends with the FRD rules it proves, in brackets. Each "Then" is something an outside observer can check. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {story title} | the story's title, as in the Story list: a verb and an object, two to six words | Reject a Claim |
| {story status} | drafted, groomed or ready | groomed |
| {requirement ID} | each requirement ID the story serves | REQ-3.1 |
| {feature ID} | the feature the story tells | F-04 |
| {work item ID} | the tracker's ID, once a tracker creates it, or TBD | TBD |
| {statement} | the statement, exactly as the Story list has it | As a line manager, I want to reject a claim with a reason, so that the claimant knows what to fix. |
| {story} | the title of the story that must come first, or the name of the work, for work outside this EPIC | Approve a Claim |
| {work item} | that story's tracker ID, "work item pending" until a tracker creates it, or EXTERNAL for work outside this EPIC | work item pending |
| {why} | why it must come first, in a few words | a claim must reach its line manager first |
| {FRD gate or step} | the FRD gate or flow step that proves it, or the EPIC register | FRD-3a, Gate In |
| {warning sign} | the sign that the story may be too big | nine rules |
| {scope item} | one thing the story covers, with what it means when the title alone isn't clear | A reason is required: a rejection without a reason is not accepted |
| {left-out item} | one thing left out, and where it is told instead, or its question | Reject a claim, told in Reject a Claim |
| {action} | what this story lets a person do, as a column heading | Approve a claim over 500 |
| {actor} | an actor from the FRD | Line manager |
| {permission} | Yes or No, or TBD with its question when the FRD doesn't say | No |
| {step} | the number of the FRD flow step tagged with this rule, or Alternate | 4 |
| {rule ID} | an FRD rule ID | F-04.4 |
| {rule} | the rule, quoted from the FRD | **not** accept a rejection that gives no reason |
| {measure} | a measure from the EPIC brief, or None | Working days from sending a claim to paying it |
| {design link} | a link to the design, or None | None |
| {scenario title} | a short title for the scenario | Reject without a reason |
| {rule IDs} | the FRD rules the scenario proves, separated by commas | F-04.4 |
| {starting state} | the state before the action. Use a plain description for anything the rule doesn't depend on, and a real value for anything it does. | a claim waits for its line manager's approval |
| {action taken} | what someone does, named by their role | the line manager rejects it without giving a reason |
| {outcome} | what an outside observer can check afterwards | the claim is not rejected |
| {further outcome} | a further outcome, if there is one | it still waits for the line manager |
