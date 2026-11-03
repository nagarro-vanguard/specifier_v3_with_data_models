# BRD checklist

Run this before the BRD's check program. It is the acceptance bar for the document: work top to bottom, and fix anything that fails. A gap that can't be fixed from the files becomes a question in the Question log, through probing-questions-author. A line, or the part of a line, that says it is checked by check-brd.cjs is left to the program, so the skill spends its time on the judgements.

## Classification and alignment
- [ ] The classification is justified against the rule. Problem means measurable pain. Opportunity means new value.
- [ ] Examples and language throughout align with the classification
- [ ] The background supports the classification. Nothing in the content contradicts it.

## Executive summary
- [ ] "Why" (business value) is immediately clear
- [ ] "What" (scope preview) summarised crisply
- [ ] Stands alone for an executive decision. It can be read in under 60 seconds.
- [ ] No vague terms ("enhance", "improve") without a measurable outcome

## Requirements quality
- [ ] Each business requirement is single, testable, and uniquely IDed. The IDs are checked by check-brd.cjs.
- [ ] Requirements are in business language, not implementation
- [ ] Each requirement traces to an objective
- [ ] Each release criterion is measurable pass/fail and maps back to a requirement
- [ ] No ambiguous language in requirements or release criteria

## Metrics and success criteria
- [ ] KPI table complete: Baseline, Target, Measurement method, Measurement cadence, Owner, Confidence. Checked by check-brd.cjs.
- [ ] Baselines are quantified, or TBD with its question. Targets are specific. Timeframes are realistic.
- [ ] Every KPI has a Measurement method, or TBD with its question
- [ ] Every KPI has a confidence tag: CONFIRMED, TENTATIVE or AI-RECOMMENDED. Checked by check-brd.cjs.
- [ ] AI-RECOMMENDED KPIs give their reason, and are put to the specifier at the gate
- [ ] KPIs directly support the stated objectives
- [ ] Traceability mini-map links Objectives to Requirements to Release criteria

## Scope clarity
- [ ] In-scope items concrete and specific
- [ ] Out of scope explicitly stated. Checked by check-brd.cjs.
- [ ] Boundaries clear and defensible. No scope creep hidden in other sections.
- [ ] Dependencies won't block in-scope items

## Risk management
- [ ] Key risks identified: technical, business and resource.
- [ ] Each risk has impact, likelihood, a mitigation and its source
- [ ] Constraints documented separately
- [ ] Every open point is a question in the Question log, with who can answer it

## Source integrity
- [ ] Nothing fabricated to fill a gap (`conventions.md`, "Nothing invented")
- [ ] All assumptions explicitly called out
- [ ] Missing values are marked TBD. Proposed values are labelled Proposed (needs confirmation). Each names its question. Checked by grade-questions.cjs.
- [ ] Every line says where it came from. Checked by check-brd.cjs.

## Executive readiness
- [ ] Readable from top to bottom in 10–15 minutes. The value is obvious to readers who aren't technical.
- [ ] Decision points and next steps stated
- [ ] The status line is in place, directly under the title, with no opening notes and no lines in italics. Checked by check-brd.cjs.
