---
name: change-impact
allowed-tools: Read, Write, Edit, Glob, Grep
description: >-
  Given a requirement change and one downstream artifact it may touch, judge whether
  the artifact is actually affected, classify how badly, and recommend the call —
  no change, update (with the exact edits), split, or a new story — with a rationale.
  Use whenever someone asks what a requirement change affects, whether a story needs
  updating or replacing, or wants an impact assessment — e.g. "BR-05 changed, does
  the refund story still hold?", "what's the impact of this PRD change on the
  stories?". This is the per-item brain the `blast-radius` workflow fans out across
  the whole blast radius; run it standalone for a single item.
---

# Change impact (per-item)

Take one requirement change and one artifact that might depend on it, and return a
clear verdict: is it hit, how hard, and what to do about it. This is deliberately
*single-item* — precise and defensible. The `blast-radius` workflow runs this
across every affected artifact and consolidates the results; on its own it answers
one question well.

This skill loads shared rules from `../_shared/`. Output paths are relative to the
project root.

## Load first

Read `../_shared/system-prompt.md` (gating, G.1–G.6, source citation). If missing,
stop and name it.

## Inputs

- **The change** — the before/after of a `BR-xx` or `FR-xx` (from the artifact's
  history / `audit-trail`, or pasted).
- **The artifact** — the story, AC, EPIC, or feature that the traceability map links
  to the changed ID.
- **The link** — how they're connected (which ID the artifact traces to).

If you can't see the actual before/after or the artifact text, say so and ask — do
not guess the impact.

## Method

1. **Confirm the link.** Does this artifact really depend on the changed `BR/FR`?
   Prove it from the trace, or report "no real dependency — not affected."
2. **Classify the impact:**
   - **None** — the change doesn't touch what this artifact relies on.
   - **Cosmetic** — wording/reference update only; behaviour unchanged.
   - **Substantive** — behaviour, scope, rules, or acceptance change within the same capability.
   - **Breaking** — the capability itself changed or was removed; the artifact no longer holds.
3. **Recommend the call:**
   - **No change** — record why it's safe.
   - **Update** — the artifact stays; list the **specific edits** (which scope item, rule, flow step, or AC scenario changes, and to what).
   - **Split / New story** — the change adds a genuinely new capability → recommend a **new** story (with a one-line rationale) rather than overloading the existing one.
4. **Note the ripple.** Does this artifact's *own* downstream (its dependent stories/AC) now need re-checking? List them so nothing is missed.

## Verdict (output)

```
### [Artifact ID / title] — impact of [changed BR/FR]
- **Affected:** Yes / No (— why)
- **Impact class:** None / Cosmetic / Substantive / Breaking
- **Recommendation:** No change / Update / New story / Split
- **Specific edits:** [what changes, and to what — or "n/a"]
- **Ripple:** [downstream items to re-check — or "none"]
- **Confidence:** CONFIRMED / TENTATIVE — [what's uncertain]
```

Standalone, save to `Output/change-impact/[change-id]-[artifact-id]-impact.md`. Inside
the `blast-radius` workflow, return the block for consolidation into the Change
Impact Report.

> **Save early, update in place** (`_shared/system-prompt.md`): on a **standalone** run, write this
> file as soon as it has reviewable content and update it in place — don't wait for finalize; carry a
> `STATUS:` line. (Inside `blast-radius` there is no file — the workflow consolidates the returned block.)

## Rules

- **Prove the dependency** before claiming impact (G.2); no dependency → not affected.
- **Update vs new is the judgment** — same capability, changed detail → *update*; a
  new capability → *new story*. State which and why.
- **Never invent** what the change says (G.1) — if the before/after isn't visible, ask.
- The recommendation is a proposal; **applying it stays gated** — end with
  `HUMAN ACTION REQUIRED: Decide update / new / no-change for this item.`
