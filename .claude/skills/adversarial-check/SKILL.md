---
name: adversarial-check
allowed-tools: Read, Glob, Grep, Edit, Bash
description: >-
  Challenges the verdict in a Change impact report and reports only what's
  wrong with it: every citation opened and read, every reuse claim presumed an
  overclaim, the gaps hunted again, and every rule the update test compared
  checked against its FRD. Writes its findings and its verdict, PASS,
  PASS_WITH_FINDINGS or FAIL, into section 11 of the report. Use when
  change-request-disposition calls it, or on its own with a project and a
  change, for example "challenge change 004 for city-library". Not for writing
  or fixing the analysis (use change-request-disposition).
---

# adversarial-check — challenge the verdict in a Change impact report

> **What this is:** A second, hostile reading of a change's type of change, sections 5 and 7 to 10 of its Change impact report, that reports only what the analysis got wrong or missed.
>
> **What it is not:** The analysis, or a fix to it. change-request-disposition writes the analysis, and answers each finding.
>
> **Who uses it:** change-request-disposition, after its analysis. A specifier, on its own, with the project and the change.

One job: adversarially verify a finished feature-journey analysis. It does not produce, rewrite, or improve the analysis. It only reports where the analysis is wrong. Everything else is out of scope.

> Convention:
> - glossary terms and values are in pills. Glossary pages are referred to by the file names harvest gives them
> - words: this prompt reads `.claude/skills/_shared/glossary/method-words.md` first. It uses every method word only as that file defines it, such as page, section, kind and relationship
> - LOB means line of business. It is the glossary's own deployment or dialect
> - its findings land in section 11 of the Change impact report, `Output/{project}/changes/{change}/impact-report.md`

## Step 1: what must exist, and where the findings go

Confirm the inputs exist before anything else:

- a Change impact report whose sections 5 and 7 to 10 are written: change-request-disposition's analysis, made with the Feature Fit method (`../change-request-disposition/references/feature-fit.md`) and the update test (`../change-request-disposition/references/update-test.md`), and
- the glossary it was built against.

The findings are written into section 11 of the report. If either input is missing, stop and ask. The check cannot run without both.

## Input

- the Change impact report's sections 5 and 7 to 10: the restated change, its kind with the test that decided it, the journey, what's reused and what's new, and what blocks. Section 7 holds the verdict, sections 8 and 9 the reuse and the net-new, and each section its evidence.
- read access to the same glossary: `object-terms.md`, `step-terms.md`, `terms-and-relationships.md`, `states-and-values.md`, `role-terms.md`, `decision-register.md`, reconciliation, and the section deep-dives.
- read access to the FRDs, to open each rule the update test compared.

## Stance

Adversarial by default. Presume, until the evidence forces otherwise, that:

- every reuse claim is an overclaim, and
- every token marked "covered" is hiding a gap.

A claim survives only when its cited source, opened and read, plainly says what the analysis says it says.

## The checks

These are the only checks it makes.

- Citation check: for every claim, open the cited source and confirm it states the claim. Unresolvable, mislocated, or non-supporting citations fail.
- Reuse-claim challenge: for each reuse row, confirm the match is a true exact, synonym, value, relationship, or gate hit. A "close" match that is really an analogue borrowed from another family or object is downgraded to a gap.
- Missed-gap hunt: re-decompose the feature independently (own tokenization) and look for tokens or qualifiers that were folded away, matched loosely, or skipped. Test qualifier materiality.
- Verdict challenge: does the evidence support the stated verdict under the thresholds, or does it warrant a harder one? For example, New capability where Extend was claimed.
- Update-test check: for every rule section 7 compares, open its FRD. Confirm the rule says what the comparison assumes. Confirm that its result follows from the rule's words and the change's. The result is same, opposite, changed value, new, or wording only.
- Consistency check: table counts equal row counts. The diagrams' reuse and new nodes match the tables. The LOB handling matches the evidence.

## Output (findings only)

Every finding is written as `../_shared/simple-writing-rules.md` says. One row per finding:

| Field | Holds |
|---|---|
| Target | the row, claim, or node challenged |
| Type | overclaim, missed-gap, weak-citation, verdict-drift, or inconsistency |
| Quote | the words of the source read, copied exactly, that ground the finding |
| From | the file the quote is in, as its path inside the project's folder, such as `glossary/object-terms.md` |
| Would change | the type, what's new, what blocks, or none of these |
| Who can fix | the files settle it, or needs your answer |
| Correction | the specific change the analysis needs |

Close with one verdict: PASS, PASS_WITH_FINDINGS, or FAIL. PASS means nothing survived challenge as a defect.

The verdict follows a fixed rule, never a feel. A finding whose Would change is the type, what's new or what blocks gives FAIL. Any other finding that survives gives PASS_WITH_FINDINGS. `check-change-report.ts` works the verdict out again from the Would change column, and finds every quote in its file, word for word.

Each finding is one row of section 11's table. The row holds its number, then the finding, as its Target, Type and Correction, then its Quote, From, Would change and Who can fix. Last comes an Answer, which change-request-disposition writes. The verdict goes below the table, as **Verdict:** PASS, PASS_WITH_FINDINGS or FAIL. A FAIL sends the report back to change-request-disposition, which redoes what the files settle and calls this check again. A finding that needs your answer is never redone: it becomes a question in the Question log. After a second FAIL in a row, the report goes to the specifier's gate with its findings, and the verdict line reads **Verdict:** FAIL, taken to your gate.

After it writes section 11, it runs the quick check on the report: `node tools/check-simple-writing.ts --project {project} --file Output/{project}/changes/{change}/impact-report.md --skip-column Before --skip-column After --skip-column "Your words" --skip-column Quote`. It fixes what the check lists to fix in section 11, and runs the check again. The other sections belong to their own writers. On its own, it shows the line the check prints, such as "Simple writing, impact-report.md: 0 to fix, 2 to look at." Inside change-request-workflow, `check-change-report.ts` checks the whole report again before your yes.

## Out of scope

- Producing or rewriting the analysis.
- Designing the glossary or proposing new terms.
- Anything beyond reporting findings against one analysis.
