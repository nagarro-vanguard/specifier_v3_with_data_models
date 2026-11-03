# Adversarial check - a feature-journey analysis

One job: adversarially verify a finished feature-journey analysis. It does not produce, rewrite, or improve the analysis; it only reports where the analysis is wrong. Everything else is out of scope.

> Convention:
> - glossary terms and values are in pills; glossary pages are referred to by the file names harvest gives them
> - words: this prompt reads `.skills/_shared/glossary/method-words.md` first and uses every method word (page, section, kind, relationship and the rest) only as defined there
> - LOB means line of business (the glossary's own deployment or dialect)
> - the check names no output folder: its findings land beside the analysis, or the location is confirmed with the person

## Step 1 (prerequisite and location)

Confirm the inputs exist before anything else:

- a completed feature-journey analysis (the Feature Fit view), and
- the glossary it was built against.

Resolve where to write the findings (beside the analysis by default). If either input is missing, stop and ask; the check cannot run without both.

## Input

- the completed analysis: its verdict, reuse table, net-new table, diagrams, and evidence.
- read access to the same glossary (`object-terms.md`, `step-terms.md`, `terms-and-relationships.md`, `states-and-values.md`, `role-terms.md`, `decision-register.md`, reconciliation, and the section deep-dives).

## Stance

Adversarial by default. Presume, until the evidence forces otherwise, that:

- every reuse claim is an overclaim, and
- every token marked "covered" is hiding a gap.

A claim survives only when its cited source, opened and read, plainly says what the analysis says it says.

## The checks (the only checks this does)

- Citation check: for every claim, open the cited source and confirm it states the claim. Unresolvable, mislocated, or non-supporting citations fail.
- Reuse-claim challenge: for each reuse row, confirm the match is a true exact, synonym, value, relationship, or gate hit. A "close" match that is really an analogue borrowed from another family or object is downgraded to a gap.
- Missed-gap hunt: re-decompose the feature independently (own tokenization) and look for tokens or qualifiers that were folded away, matched loosely, or skipped. Test qualifier materiality.
- Verdict challenge: does the evidence support the stated verdict under the thresholds, or does it warrant a harder one (for example New capability where Extend was claimed)?
- Consistency check: table counts equal row counts; the diagrams' reuse and new nodes match the tables; the LOB handling matches the evidence.

## Output (findings only)

One row per finding:

| Field | Holds |
|---|---|
| Target | the row, claim, or node challenged |
| Type | overclaim, missed-gap, weak-citation, verdict-drift, or inconsistency |
| Evidence | the source read, quoted, that grounds the finding |
| Correction | the specific change the analysis needs |

Close with one verdict: PASS (nothing survived challenge as a defect), PASS_WITH_FINDINGS, or FAIL.

## Out of scope

- Producing or rewriting the analysis.
- Designing the glossary or proposing new terms.
- Anything beyond reporting findings against one analysis.
