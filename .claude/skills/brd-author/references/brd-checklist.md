# BRD checklist

Run this before the BRD's check program. It is the acceptance bar for the document: work top to bottom, and fix anything that fails. A gap that can't be fixed from the files becomes a question in the Question log, through probing-questions-author. A line, or the part of a line, that says it is checked by check-brd.ts is left to the program, so the skill spends its time on the judgements.

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
- [ ] Each business requirement is single, testable, and uniquely IDed. The IDs are checked by check-brd.ts.
- [ ] Requirements are in business language, not implementation
- [ ] Each requirement traces to an objective
- [ ] Each release criterion is measurable pass/fail and maps back to a requirement
- [ ] No ambiguous language in requirements or release criteria

## Metrics and success criteria
- [ ] KPI table complete: Baseline, Target, Measurement method, Measurement cadence, Owner, Confidence. Checked by check-brd.ts.
- [ ] Baselines are quantified, or `[TBD, Q{n}]`. Targets are specific. Timeframes are realistic.
- [ ] Every KPI has a Measurement method, or `[TBD, Q{n}]`
- [ ] Every KPI has a confidence tag: CONFIRMED, TENTATIVE or AI-RECOMMENDED. Checked by check-brd.ts.
- [ ] AI-RECOMMENDED KPIs give their reason, and are put to the specifier at the gate
- [ ] KPIs directly support the stated objectives
- [ ] Traceability mini-map links Objectives to Requirements to Release criteria

## Scope clarity
- [ ] In-scope items concrete and specific
- [ ] Out of scope explicitly stated. Checked by check-brd.ts.
- [ ] Boundaries clear and defensible. No scope creep hidden in other sections.
- [ ] Dependencies won't block in-scope items

## Risk management
- [ ] Key risks identified: technical, business and resource.
- [ ] Each risk has impact, likelihood and a mitigation
- [ ] Constraints documented separately
- [ ] Every open point is a question in the Question log, with who can answer it

## Source integrity
- [ ] Nothing fabricated to fill a gap (`conventions.md`, "Nothing invented")
- [ ] All assumptions explicitly called out
- [ ] Everything in the BRD comes from a file the Discovery brief marks Used, or from an answer, even though the BRD names neither
- [ ] Missing values read `[TBD, Q{n}]`. Suggested values carry `<sup>*Q{n}</sup>`. Each names its question. Checked by grade-questions.ts.
- [ ] No citations: no "per …", no file name, no section or decision number, and no Source column. Checked by check-brd.ts.
- [ ] Every table or list with a `<sup>*Q{n}</sup>` has the legend line straight under it, and no other has one. Checked by check-brd.ts.
- [ ] No Decision record. The Check record holds "None yet." or one line, Pass or Fail with the date and time. Checked by check-brd.ts.

## Executive readiness
- [ ] Readable from top to bottom in 10–15 minutes. The value is obvious to readers who aren't technical.
- [ ] Decision points and next steps stated
- [ ] The status line is in place, directly under the title, with no opening notes and no lines in italics. Checked by check-brd.ts.
