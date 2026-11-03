---
name: feature-impact
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Given a requirement change and one item made later from that requirement, judge
  whether the item is actually affected. Classify how badly, and recommend the call,
  with a rationale: no change, update, split, or a new story. An update gives the
  exact edits. Use whenever someone asks what a requirement change affects, whether
  a story needs updating or replacing, or wants an impact assessment. For example,
  "BR-05 changed, does the refund story still hold?", or "what's the impact of this
  PRD change on the stories?". This is the per-item judgement change-request-workflow
  runs once for each linked item. Run it standalone for a single item.
---

# Feature impact (per-item)

Take one requirement change and one item that might depend on it, and return a
clear verdict: is it hit, how hard, and what to do about it. This is deliberately
*single-item*, so it is precise and defensible. change-request-workflow runs this across every
linked item and writes the results into section 13 of the Change impact report. On its
own it answers one question well.

This skill loads shared rules from `../_shared/`. Output paths are relative to the
project root.

## Load first

Read `../_shared/conventions.md` for its rules "Nothing invented" and "Cite every specific".
Read `../_shared/simple-writing-rules.md` for how to write, and `../_shared/decision-review-gates.md` for gating. If one is missing, stop and name it.

## Inputs

- **The change** — the before/after of a `BR-xx` or `FR-xx`. It comes from the item's
  history or the Version log, `version-log/log.md`, or it is pasted.
- **The item** — the story, AC, EPIC, or feature that the traceability map links
  to the changed ID.
- **The link** — how they're connected. Name the ID the item traces to.
- **A data model row** can be judged too. It is one action, field or move of a thing, such as `Loan, Extend` in `lending.md`.

If you can't see the actual before/after or the item's text, say so and ask. Do
not guess the impact.

## Method

1. **Confirm the link.** Does this item really depend on the changed `BR/FR`?
   Prove it from the trace, or report "no real dependency — not affected."
2. **Classify the impact:**
   - **None** — the change doesn't touch what this item relies on.
   - **Cosmetic** — wording/reference update only. The behaviour is unchanged.
   - **Substantive** — behaviour, scope, rules, or acceptance change within the same capability.
   - **Breaking** — the capability itself changed or was removed. The item no longer holds.
3. **Recommend the call:**
   - **No change** — record why it's safe.
   - **Update** — the item stays. List the **specific edits**: which scope item, rule, flow step, or AC scenario changes, and to what.
   - **Split / New story** — the change adds a genuinely new capability → recommend a **new** story rather than overloading the existing one. Give a one-line rationale.
   - **A data model row** gets No change or Update only. For Update, the specific edits name each cell that changes, and its new value.
4. **Note the ripple.** Do this item's *own* later items now need re-checking? They are its dependent stories and AC. List them so nothing is missed.

## Verdict (output)

An example, from the made-up Expense claims product, where change 001 raises the finance limit from 500 to 1,000:

> **F-05.1, impact of REQ-3.2**
> - **Affected:** Yes, because the rule names the limit the change raises
> - **Impact class:** Substantive
> - **Recommendation:** Update
> - **Specific edits:** F-05.1 reads "send a claim over 1,000 to a finance approver once its line manager approves it"
> - **Ripple:** Approve a Claim over 500, Scenario 1
> - **Confidence:** CONFIRMED, because the rule and the change both give the limit as a number

| Line | What it holds |
|---|---|
| The heading | the item's ID or title, then "impact of" and the changed BR or FR |
| **Affected:** | Yes / No, and why |
| **Impact class:** | None / Cosmetic / Substantive / Breaking |
| **Recommendation:** | No change / Update / New story / Split |
| **Specific edits:** | what changes, and to what, or "n/a" |
| **Ripple:** | the later items to re-check, or "none" |
| **Confidence:** | CONFIRMED / TENTATIVE, and what's uncertain |

Standalone, show the block in the conversation. Inside change-request-workflow, return
the block: its **Recommendation** becomes the item's Judgement in section 13 of the
Change impact report, and its why, in one line, the Why. When the change moves a
feature to another EPIC or FRD, that line starts "moves to", then the EPIC or FRD.

Write the block as `../_shared/simple-writing-rules.md` says, every time. Inside change-request-workflow, `check-change-report.cjs` checks it in section 13. When you write the block into a file yourself, run `node tools/check-simple-writing.cjs --file {file}` on that file. Fix what it lists to fix, and run it again. Then show the one line it prints, such as "Simple writing, impact.md: 0 to fix, 2 to look at."

## Rules

- **Prove the dependency** before claiming impact, as "Cite every specific" says. No dependency → not affected.
- **Update vs new is the judgment** — same capability, changed detail → *update*. A
  new capability → *new story*. State which and why.
- **Never invent** what the change says. If the before/after isn't visible, ask, as "Nothing invented" says.
- The recommendation is a proposal. **Applying it stays gated.** End with
  `HUMAN ACTION REQUIRED: Decide update / new / no-change for this item.`
  Inside change-request-workflow the line is collected into the report, not asked: the
  decision is your one yes, at the workflow's step 5.
