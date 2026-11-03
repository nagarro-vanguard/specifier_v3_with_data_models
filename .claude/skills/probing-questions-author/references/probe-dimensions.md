# Probe dimensions: the question bank

The nine areas `probing-questions-author` works through, with the sharp questions that show what a first description usually leaves out. They are the same nine areas the Discovery brief compares its topics in. Work the areas that fit the input. Skip the ones that plainly don't. For every question, offer the real choices the person can react to, never an open "what do you want?": reacting is easier than inventing. "I don't know yet" is always one of them (`decision-review-gates.md`, rule 4).

## Contents

1. Users and context
2. Problem and value
3. Scope edges
4. Rules and constraints
5. Data and states
6. Edge cases and failure modes
7. Dependencies and integrations
8. Success and acceptance
9. Non-functional

---

## 1. Users and context
- Who is the primary user, and who else touches this? For example, an approver, an admin, or someone who uses the result later.
- What are they doing *today* to get this done? That is the workaround we're replacing.
- Where are they when they do it (device, channel, in-the-flow-of-what)?
- How often: daily, per transaction, or once a quarter? Volume changes everything.
- What's their expertise? Expert-daily vs novice-occasional pull opposite designs.

## 2. Problem and value
- What breaks or costs money *right now* if we do nothing?
- Is this fixing measurable pain (a Problem) or unlocking new value (an Opportunity)? What's the evidence?
- Who feels the pain, and how do they quantify it? For example, in time, errors, revenue, risk or complaints.
- If we shipped only *one* slice, which slice removes the most pain?
- What does "clearly better" look like in a number?

## 3. Scope edges
- What is explicitly **out** of scope for this round?
- What's the adjacent thing people will *assume* is included but isn't?
- Is this net-new, or a change to an existing capability? A change brings migration and backward compatibility with it.
- One persona or several? One channel or several? Each extra one is scope.
- Where does this pass to another team or system? Is that boundary in or out?

## 4. Rules and constraints
- What business rules, policies, eligibility, or limits control this? Get the *source*, not a guess.
- Any compliance or regulatory constraint? For example, privacy, financial, accessibility or retention.
- Does the action need an approval, a threshold or a state before it can happen?
- What must *never* happen? These are the hard constraints and safety rails.
- Which numbers are real vs assumed? Anything unsourced is a TBD, not a fact.

## 5. Data and states
- What are the core entities, and what states can each be in (Draft → Submitted → Approved → …)?
- Who owns each piece of data? Where does it originate? How fresh must it be?
- What transitions are allowed, and who can trigger them?
- Any history or audit requirement? For example, who changed what, and when.
- Which copy is the agreed copy when two systems disagree?

## 6. Edge cases and failure modes
- What happens on empty state (nothing yet), and on the very first use?
- What happens when the input is invalid, partial, or duplicated?
- What happens when a dependency is down or slow?
- Concurrency: two people act on the same thing at once. Who wins?
- Permissions: what does an unauthorized attempt see/experience?

## 7. Dependencies and integrations
- What must exist *before* this can work? For example, sign-in, roles, data or another feature.
- What other features/teams depend on *this* once it exists?
- Any third party/vendor/external system involved, with its own timeline?
- Does the work have to follow an order? For example, X must ship before Y.
- Which dependencies are proven from a source vs assumed?

## 8. Success and acceptance
- How will we *know* it worked? Name the specific outcome we can observe.
- What's the KPI, its baseline, target, timeframe, and how it's measured? (Confidence-tier each.)
- What's the release or exit criterion? It is the pass or fail test for "done enough to ship".
- What would make us roll it back?
- Whose sign-off is required?
- For each requirement: could two people check, yes or no, that the product does it? Which word stops them?
- What number, list or rule would make that word checkable? Offer the choices the files point to. Never put a number forward as a fact.

## 9. Non-functional
- Performance/latency expectations, if the feature is interactive or data-heavy.
- Security and access: who can see or do what? Is anything sensitive?
- Availability/reliability expectations.
- Accessibility (if user-facing) and localization (if multi-market).
- Scale/capacity now and expected growth.

> **Rule for every area:** capture answers as sourced facts (`per {source}`), mark anything inferred as **Proposed (needs confirmation)** with its question in the Question log, and never invent a number to fill a gap (`conventions.md`, "Nothing invented"). A surfaced gap is a *success* of probing, not a failure.
