# Acceptance criteria — quality standard, coverage checklist and examples

How `ac-author` writes each story's scenarios. The shape is in `../../_shared/templates/story.md`, section "Acceptance criteria": three to seven scenarios under one heading, Behaviour, each title ending with the FRD rules it proves, in brackets.

## Acceptance criteria quality standard

| Quality | Description |
|---------|-------------|
| Clear | Unambiguous language |
| Specific | Concrete, not vague |
| Outcome-focused | Verifiable, testable results |
| Not implementation | Avoid "use API X", "use DB table Y" |
| Consistent terminology | The same roles, fields and statuses as the groomed story, in the Glossary's words |
| Only the values that matter | People are named by their role, such as "the line manager", never by a made-up name. Anything the rule doesn't depend on gets a plain description, such as "a claim waits for its line manager's approval". Anything the rule does depend on gets a real value, such as "a claim for 640" for a rule about claims over 500: that value is what makes the test checkable. |

## Coverage checklist (as applicable)

Every rule the story quotes is proved by at least one scenario. `coverage-check.cjs` checks it for the whole EPIC. Then, as applicable:

| Coverage area | When to include | Skip if | Where to look |
|---------------|-----------------|---------|---------------|
| Happy path | Always | Never skip | The story's rules, in their Step order |
| Validation or boundary | When inputs have rules | No input validation in the sources | The FRD's **not** and **only** rules |
| Permission or role | When access restrictions exist | No role restrictions | The story's Roles, from the FRD's Actors |
| Error handling | When failure scenarios are defined | No error scenarios in the sources | The FRD's rules, and the story's rules whose Step is Alternate |
| State transitions | When a status or state changes | No state changes | The FRD's Data and Standard questions |
| Integrations | When external systems are involved | No integrations | The story's Dependencies |
| Non-functional | Only if measurable and essential | Not specified in the sources | The NFR IDs the EPIC brief lists |
| Design-specific | When a design mandates specific behaviour | No design provided | The story's Design links |

## Examples

### A.1 Good scenarios

From the stories "Reject a Claim" and "Approve a Claim over 500", of the made-up Expense claims product:

**Scenario 1 - A manager rejects a claim, with a reason (F-04.3)**
- **Given** a claim waits for its line manager's approval
- **When** the line manager rejects it, with a reason
- **Then** the claim's stage is Rejected
- **And** the claimant sees the reason

**Scenario 2 - A rejection with no reason is not accepted (F-04.4)**
- **Given** a claim waits for its line manager's approval
- **When** the line manager rejects it without giving a reason
- **Then** the rejection is not accepted
- **And** the claim still waits for the line manager's approval

**Scenario 1 - A claim over 500 goes to finance (F-05.1)**
- **Given** a claim for 640 waits for its line manager's approval
- **When** the line manager approves it
- **Then** the claim waits for a finance approver

*Why they're good:*
- each has a bold title and bold Given, When and Then
- each title ends with the FRD rules the scenario proves, which coverage-check.cjs reads
- people are named by their role, and the rejection scenarios need no amount, because their rules don't depend on one
- the over-500 scenario gives the amount, 640, because its rule depends on it: "a claim" alone couldn't be checked
- specific outcomes an outside observer can check
- consistent words, from the groomed story and the Glossary

### A.2 Bad scenario (vague)

"Scenario 1 - View claim"
- "Given user is logged in"
- "When user does stuff"
- "Then claim is shown properly"

*Why it's bad:*
- the scenario title and the Given, When and Then aren't bold
- "does stuff" is vague
- "shown properly" can't be verified
- the role is missing. Write "claimant", not just "user".
- its title names no FRD rule it proves

### A.3 Bad scenario (technical)

"Scenario 1 - API returns stage"
- "Given the claims endpoint for a claim is called"
- "When the request carries a valid token"
- "Then the API returns 200 OK with a JSON payload"
- "And the response includes a stage field"

*Why it's bad:*
- technical details (API, token, JSON)
- not user-facing behaviour
- it tests how it is built, not what the user sees
