# Change 001 — Finance limit

Status: drafted

## 1. The requests, as you stated them

| Request | Called | Your words |
|---|---|---|
| 1 | change request | The finance team has confirmed the policy's limit: from now on they approve only claims over 1,000, not claims over 500. |

## 2. Files you brought

No file came with this change: the statement is all there is.

## 3. Other differences in a new version

No new version of a requirement file was brought.

## 4. Check findings on documents from outside

None: no document from outside came with this change.

## 5. Restated, and split if several asks

| Ask | Restated |
|---|---|
| 1 | A claim goes to a finance approver only when it is over 1,000, instead of over 500. |

### Agreed words this change renames

None

## 6. Where it lands

| Ask | Requirement | Feature | FRD | EPIC | Data model |
|---|---|---|---|---|---|
| 1 | • BR-03<br>• REQ-3.2 | • F-05 | • FRD-3a | • EPIC-002 | • Claim, Approve over the limit |

## 7. Its kind

| Ask | Kind | The test that decided it |
|---|---|---|
| 1 | Update or optimize | • Feature Fit: Fits. Claim, Finance approver and Approve are all in the Glossary<br>• F-05.1: changed value<br>• F-05.2: changed value<br>• F-05.3: changed value<br>• F-05.4: changed value |

## 8. The journey

| Step | What happens | Mark |
|---|---|---|
| 2 | Approve: a finance approver approves a claim over 1,000, once its line manager has | Reused |

## 9. What's reused, and what's new

### Reused

- F-05 Finance approval
- The Finance approver role
- The Approve step

### New

- None: the change only changes a value, the limit, in rules that exist

## 10. What blocks

None

## 11. The challenge's findings

| # | Finding | Quote | From | Would change | Who can fix | Answer |
|---|---|---|---|---|---|---|
| 1 | Section 7: missed-gap. Question 3 was answered "500" at the Discovery brief's gate, Decision 2. Say that the change overturns an answered question. | The finance team confirmed on 2 October that 500 is the new limit, and the policy will be updated. | expense-claims-discovery-brief.md | none of these | the files settle it | Agreed: brd-author records the new limit as a decision in the BRD's Decision record. The Discovery brief is a record, and isn't changed. |

**Verdict:** PASS_WITH_FINDINGS

## 12. Linked items

| Item | Type | Linked through |
|---|---|---|
| BR-03 | BR | where the change lands |
| REQ-3.2 | requirement | where the change lands |
| F-05 | feature | where the change lands |
| F-05.dw1 | piece | has-piece, from F-05 |
| F-05.dw2 | piece | has-piece, from F-05 |
| FRD-3a | FRD | where the change lands |
| F-05.1 | rule | has-rule, from F-05 |
| F-05.2 | rule | has-rule, from F-05 |
| F-05.3 | rule | has-rule, from F-05 |
| F-05.4 | rule | has-rule, from F-05 |
| EPIC-002 | EPIC | where the change lands |
| Claim, Approve over the limit | data model row | where the change lands |
| Approve a Claim over 500 | story | tells, from F-05 |
| Approve a Claim over 500, Scenario 1 | scenario | names-rule, from F-05.1 |
| Approve a Claim over 500, Scenario 3 | scenario | names-rule, from F-05.2 |
| Approve a Claim over 500, Scenario 2 | scenario | names-rule, from F-05.4 |

## 13. Each linked item's judgement

| Item | Judgement | Why |
|---|---|---|
| BR-03 | Update | it reads "Claims over 500 are also approved by the finance team." |
| REQ-3.2 | Update | it reads "Claims over 500 need finance approval." |
| F-05 | Update | its description reads "each claim over 500" |
| F-05.dw1 | Update | it reads "A claim over 500 waits for a finance approver" |
| F-05.dw2 | No change | it names no limit |
| FRD-3a | Update | its Gates, Actors and Flow name the limit of 500 |
| F-05.1 | Update | the limit it names goes from 500 to 1,000 |
| F-05.2 | Update | the limit it names goes from 500 to 1,000 |
| F-05.3 | Update | the limit it names goes from 500 to 1,000 |
| F-05.4 | Update | the limit it names goes from 500 to 1,000 |
| EPIC-002 | Update | its brief names the limit, in sections 1 and 2 |
| Claim, Approve over the limit | Update | its rule reads "Only for a claim over 500." |
| Approve a Claim over 500 | Update | its title, statement and scope name the limit |
| Approve a Claim over 500, Scenario 1 | Update | its claim of 640 is now under the limit, so it no longer goes to finance |
| Approve a Claim over 500, Scenario 3 | Update | its claim of 640 is now under the limit |
| Approve a Claim over 500, Scenario 2 | Update | its title names 500 |

## 14. The tentative size

- **Size:** Small
- **The rule that decided it:** none of the large rules holds: no feature moves into or out of EPIC-002, no more than one story in progress is judged New story or Split, and no two pieces need regrouping
- **Against:** EPIC-002 Claim approval's stories

## 15. The recommendation

| Order | Workflow | Step | Items |
|---|---|---|---|
| 1 | requirements-workflow | step 2, brd-author | • BR-03 |
| 2 | requirements-workflow | step 3, prd-author | • REQ-3.2 |
| 3 | data-model-workflow | step 2, data-model-author | • Claim, Approve over the limit |
| 4 | features-and-epics-workflow | step 1, feature-author | • F-05<br>• F-05.dw1 |
| 5 | frd-workflow | step 2, frd-author | • FRD-3a<br>• F-05.1<br>• F-05.2<br>• F-05.3<br>• F-05.4 |
| 6 | stories-workflow | step 3, epic-author | • EPIC-002 |
| 7 | stories-workflow | step 5, story-groomer | • Approve a Claim over 500 |
| 8 | stories-workflow | step 6, ac-author | • Approve a Claim over 500, Scenario 1<br>• Approve a Claim over 500, Scenario 3<br>• Approve a Claim over 500, Scenario 2 |

**Left out of the path:**
- glossary-disposition: section 5 lists no agreed word this change renames
- data-model-workflow, step 1, things-author: section 5 lists no agreed word this change renames, and section 9 lists no new word

**Added to the path:**
- features-and-epics-workflow, step 1, feature-author: section 13 judges its items to change, though the path for the kind doesn't name it
- stories-workflow, step 3, epic-author: section 13 judges its items to change, though the path for the kind doesn't name it

**Your choices at the gate:**
- **Run the path:** change-orchestration-workflow makes the updates above, in order, with no more questions
- **Correct the analysis:** change-request-workflow redoes it from step 2, with your correction

**Recommended:** Run the path


## 16. Your decision

None yet.

## Check record

None yet.
