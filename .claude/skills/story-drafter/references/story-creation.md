# Story creation — the quality standard and examples

How `story-drafter` makes each story sound. The shape of the Story list and of each Story is in `../../_shared/templates/story-list.md` and `../../_shared/templates/story.md`. The statement reads "As a" persona, "I want" one capability, "so that" the value.

## Story quality standard

### Story component rules

| Component | Rule | Example |
|-----------|------|---------|
| **Title** | 2–6 words, starts with a verb, no "and/or", one intent | "Withdraw a Claim" not "Withdraw and Resend a Claim" |
| **"I want"** | Exactly ONE capability. No "and", "or", "also" or "plus". | "I want to withdraw a claim" not "I want to withdraw or change a claim" |
| **"I want"** | Use observable actions: View, Search, Filter, Create, Update, Delete, Upload, Download, Submit, Approve, Reject, Track, Configure, Assign | "I want to view my claims" |
| **"I want"** | Legible and at one altitude. One idea, which reads on the first pass. No stacked relative clauses, no dashed or bracketed aside, and no listed outputs or mechanisms. Those go to the acceptance criteria. This is Q10. | "I want to view my claims" not "I want to view my claims arranged by stage with counts of expense lines, receipts, and amounts" |
| **"So that"** | Grounded in the requirement. If the requirement doesn't state the value, use a conservative value that fits its intent. It must add a benefit, not restate the "I want" in other words. | "so that I can stop a claim I sent by mistake" |

### INVEST check

Apply it silently to each story.

| Criterion | What to check |
|-----------|---------------|
| **I**ndependent | Phrased as a stand-alone user goal |
| **N**egotiable | Not a solution spec |
| **V**aluable | Clear outcome stated |
| **E**stimable | Not a vague "everything" |
| **S**mall | Single capability only |
| **T**estable | Clear outcome, even without acceptance criteria |

### Quality do's and don'ts

| Do | Don't |
|----|-------|
| Keep stories user-centred (no "the system shall…") | Don't bundle several capabilities in one story |
| Split big or bundled requirements into several stories | Don't embed business rules, validations, edge cases, or technical steps |
| Keep language consistent with the requirement's wording, in the Glossary's agreed words | Don't speculate on detailed workflows not stated |

## Appendix A: story creation examples

### A.1 Quick reference: good vs bad stories

| Quality | Story | Issue or reason |
|---------|-------|--------------|
| Bad | As a user, I want to manage claims, so that it's easy. | Vague capability ("manage"), vague value ("easy") |
| Good | As a claimant, I want to withdraw a claim, so that I can stop a claim I sent by mistake. | Single capability, concrete value |
| Bad | As a line manager, I want to search and filter my team's claims… | Bundled capabilities ("and") |
| Good | As a line manager, I want to search my team's claims… | Single capability |
| Good | As a line manager, I want to filter my team's claims… | Single capability (separate story) |
| Bad | As a claimant, I want to view my claims arranged by stage with counts of expense lines, receipts, and amounts… | Overstuffed — listed outputs belong in the acceptance criteria (Q1) |
| Bad | As a line manager, I want to record a reason as one that reflects the expense line it responds to… | Convoluted — stacked relative clauses, not legible (Q10) |
| Good | As a claimant, I want to view my claims… | One idea, legible. Detail is left to the acceptance criteria. |

### A.2 Good story example

**Title:** View a Claim's Stage

**Story:** As a claimant, I want to view the stage of a claim I sent, so that I know when it will be paid without asking the finance team.

*Why it's good:* Single capability, user-facing language, clear value, about 1–2 days of work.

### A.3 Bad story example (vague)

**Title:** Manage Claims

**Story:** As a user, I want to manage my claims, so that I can do claim things.

*Why it's bad:*
- "Manage" is vague. It should be split: View, Send, Withdraw.
- "user" is too generic. It should be a specific persona, such as the claimant.
- "do claim things" gives no clear value
- Too broad for 1–2 days of work

### A.4 Bad story example (technical)

**Title:** Implement Claim Stage API Endpoint

**Story:** As a developer, I want to create a REST API for claim stages, so that the frontend can call it.

*Why it's bad:*
- A technical story, not user-facing
- A developer is not a valid persona for user stories
- Describes how it is built, not the user's value

### A.5 Bad story example (overstuffed — wrong altitude)

**Title:** View a Claim's Progress

**Story:** As a claimant, I want to view my claim as ordered stages with counts of expense lines, receipts, and days per stage, so that I can judge its progress and when it will be paid.

*Why it's bad:*
- The "I want" **lists outputs**: "counts of expense lines, receipts, and days". They belong in the acceptance criteria, not the statement.
- The list is a hidden **compound**, against Q1. It reads as one want, but it has several deliverables.
- The "so that" bundles **two benefits** ("progress" and "when it will be paid")

**Fixed:** As a claimant, I want to view my claim by stage, so that I can see where it stands.

The counts for each stage move to the acceptance criteria.

### A.6 Bad story example (convoluted — not legible)

**Title:** Record a Rejection Reason

**Story:** As a line manager, I want to record my reason as one that reflects the expense line it responds to, so that the reason is tied to the expense line rather than assumed.

*Why it's bad:*
- **Stacked relative clauses**, such as "as one that reflects the expense line it responds to", force a re-read to recover a simple idea. This is against Q10.
- The "so that" **restates the want** in other words. The words "reflects the expense line" mean the same as "tied to the expense line". It adds no benefit.

**Fixed:** As a line manager, I want to record my reason against a specific expense line, so that the claimant knows which expense line to fix.
