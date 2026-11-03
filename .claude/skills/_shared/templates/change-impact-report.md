# Change {change number} — {change name}

Status: drafted

## 1. The requests, as you stated them

| Request | Called | Your words |
|---|---|---|
| {request number} | {called} | {your words} |

## 2. Files you brought

| File | What it is | Where it is |
|---|---|---|
| {file name} | {what the file is} | {file link} |

## 3. Other differences in a new version

| Where | Before | After |
|---|---|---|
| {where} | {old words} | {new words} |

## 4. Check findings on documents from outside

- {findings link}

| Word found | Where | Settled as |
|---|---|---|
| {word found} | {where found} | {settled as} |

## 5. Restated, and split if several asks

| Ask | Restated |
|---|---|
| {ask number} | {restated ask} |

### Agreed words this change renames

| Agreed word | Becomes |
|---|---|
| {agreed word} | {new word} |

## 6. Where it lands

| Ask | Requirement | Feature | FRD | EPIC | Data model |
|---|---|---|---|---|---|
| {ask number} | • {requirement ID} | • {feature ID} | • {FRD ID} | • {EPIC ID} | • {data model row} |

## 7. Its kind

| Ask | Kind | The test that decided it |
|---|---|---|
| {ask number} | {kind} | {test and result} |

## 8. The journey

| Step | What happens | Mark |
|---|---|---|
| {step number} | {journey step} | {mark} |

## 9. What's reused, and what's new

### Reused

- {reused item}

### New

- {new item}

## 10. What blocks

- {blocker}

## 11. The challenge's findings

| # | Finding | Quote | From | Would change | Who can fix | Answer |
|---|---|---|---|---|---|---|
| {number} | {finding} | {quote} | {quote file} | {would change} | {who can fix} | {answer} |

**Verdict:** {verdict}

## 12. Linked items

| Item | Type | Linked through |
|---|---|---|
| {item ID} | {item type} | {linked through} |

## 13. Each linked item's judgement

| Item | Judgement | Why |
|---|---|---|
| {item ID} | {judgement} | {why} |

## 14. The tentative size

- **Size:** {size}
- **The rule that decided it:** {size rule}
- **Against:** {in progress}

## 15. The recommendation

| Order | Workflow | Step | Items |
|---|---|---|---|
| {number} | {workflow} | {start step} | • {item ID} |

**Your choices at the gate:**
- **{choice}:** {what the choice does}

**Recommended:** {choice}

## 16. Your decision

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** One change, from your requests to your one yes: what type of change each one is, where it lands, what it touches, how big it is, and which updates to make.
- **What it is not:** The updates. After your yes, `change-orchestration-workflow` makes them.
- **Written by:** `change-request-workflow`, from `templates/change-impact-report.md`. Each section has exactly one writer, named in the table below, and nobody else writes in it. Checked by check-change-report.ts before your yes.

### What each section holds

| Section | What it holds |
|---|---|
| The top | A section that doesn't apply to this change says why, in one line. For example, section 3 says: No new version of a requirement file was brought. |
| 1. The requests, as you stated them | Written by the workflow's step 1. Each request, numbered, with the name you called it by, and your words exactly as you gave them. Several requests go in one change, and close together. |
| 2. Files you brought | Written by the workflow's step 1. Every file that came with the change, and what it is. |
| 3. Other differences in a new version | Written by compare-versions.ts. When you bring a new version of a requirement file, every other place it differs from the version the PRD was written from, so no quiet edit is missed. A line that moves between scope and requirement says so. |
| 4. Check findings on documents from outside | Written by glossary-check, then settled by glossary-disposition at the workflow's step 1, so the analysis works with agreed words. Each word in a document from outside that doesn't match the Glossary, and how it was settled at glossary-disposition's gate: the document fixed, the Glossary changed, or a new word added. When there is no document from outside, or nothing mismatches, the table says None. |
| 5. Restated, and split if several asks | Written by change-request-disposition. The requests in the Glossary's agreed words. A request that asks for several things is split, one ask per row. |
| Agreed words this change renames | Written by change-request-disposition. Every agreed word in the Glossary that this change renames, which recommend.ts reads to put glossary-disposition first. When the change renames none, this says None. |
| 6. Where it lands | Written by change-impact-author. For each ask, the requirement, feature, FRD and EPIC it touches. The Data model column names each thing the ask touches, and its action, field or move. The data model files cite no source, so this column is how a change reaches them. From each row it names, find-linked.ts reaches the FRD rules whose source names the same thing and action, field or move. |
| 7. Its kind | Written by change-request-disposition. Each ask is one of five kinds, and the kind decides which step the change enters at:<br>• Net new: nothing in the documents covers it yet<br>• Extend or enhance: it adds to something that already exists<br>• Update or optimize: it changes how something that exists works<br>• Already covered: the documents already say it, so nothing needs to change<br>• Blocked: it can't be judged until a question is answered |
| 8. The journey | Written by change-request-disposition. The steps of the product's journey the change touches, taken from the Glossary's Steps page. Each step is marked Reused when it stays as it is, New when the change adds it, or Decision when it needs your answer. |
| 9. What's reused, and what's new | Written by change-request-disposition. What already exists and stays as it is, and what the change adds. |
| 10. What blocks | Written by change-request-disposition. Anything that stops the change from being judged or applied, and what would unblock it. When an answer is needed, the blocker is a question in the Question log, asked in the shape `decision-review-gates.md` gives, and this section names its number. When nothing blocks, this says None. |
| 11. The challenge's findings | Written by adversarial-check. A second reading that tries to find what sections 5 and 7 to 10 got wrong or missed. Each finding quotes the file it read, says what it would change and who can fix it, and has change-request-disposition's answer. Then the challenge's verdict, which follows a fixed rule. |
| 12. Linked items | Written by find-linked.ts, from the Traceability map and from every document drafted since it was last accepted. Everything linked to what the change touches, grouped by the document it is in, so nothing affected is missed. |
| 13. Each linked item's judgement | Written by feature-impact, which the workflow calls once for each linked item. Whether the item must change, and why. |
| 14. The tentative size | Written by size-rules.ts. How big the change is against whatever is in progress now, and the rule that decided it. A hint for priority. It pauses nothing. |
| 15. The recommendation | Written by recommend.ts. The updates to make, in order: each workflow, the step it enters at, and its items. Under the table, each one only when it applies: the steps it leaves out, and the steps it adds, each with why. A small update you can choose instead, with every place it would change. A flag when the change reaches most of the business requirements. Then your choices at "Make these updates?", and the one it recommends. |
| 16. Your decision | Written by the workflow, at "Make these updates?". This is the report's Decision record: every decision you made about this change, in the shape of `templates/parts/decision-record.md`. The answers are the choices in section 15, then "I don't know yet". The one you choose is what change-orchestration-workflow follows until the change closes. |
| Check record | The record of the last check, pasted exactly as check-change-report.ts printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {change number} | the change's number, from 001 | 004 |
| {change name} | a short name for the change | Extend limit |
| {request number} | the request's number, from 1 | 1 |
| {called} | the name you called it by: change request, new request, or a late answer | change request |
| {your words} | your words, exactly as you gave them | A loan can be extended twice, not once. |
| {file name} | the file's name | library-rules-v3.docx |
| {what the file is} | a new version of a requirement file, or a document from outside | a new version of library-rules-v2.docx |
| {file link} | a link to the file | [library-rules-v3.docx](library-rules-v3.docx) |
| {where} | the requirement ID or the place that differs | REQ-2.4 |
| {old words} | the old words, quoted | A loan is Active, Returned or Late. |
| {new words} | the new words, quoted | A loan is Active, Returned, Late or Lost. |
| {findings link} | a link to the check findings, or None | [check-findings.md](check-findings.md) |
| {word found} | the word as the document from outside writes it | borrower |
| {where found} | the document and the place | tracker-stories-2026-11.md, story 4 |
| {settled as} | what glossary-disposition's gate decided, with a link to its row in the gate log | Document fixed: "member", [CH-01](../../glossary/deep-dives/gate-log.md) |
| {agreed word} | the Glossary's agreed word that the change renames | Extend |
| {new word} | the word it becomes | Renew |
| {ask number} | the ask's number, from 1 | 1 |
| {restated ask} | one ask, in the Glossary's agreed words. A late answer reads: Question {n} is answered: {the answer}. A change that only rewords a requirement reads: {ID} now reads: "{the new wording}" | A member can extend a loan twice. |
| {requirement ID} | each business requirement and requirement the ask touches. A Net new ask names the business requirement whose scope it falls in, or None when it falls outside the BRD's scope | REQ-4.2 |
| {feature ID} | each feature the ask touches | F-05 |
| {FRD ID} | each FRD the ask touches | FRD-3a |
| {EPIC ID} | each EPIC the ask touches | EPIC-002 |
| {data model row} | each thing the ask touches, as the things file names it, then a comma and its action, field or move, as its data model file names it. A move is its From, then →, then its To. When the ask adds a new action, field or move to a thing, write the thing alone. Write None when the ask touches no thing. | Loan, Extend |
| {kind} | Net new, Extend or enhance, Update or optimize, Already covered, or Blocked | Update or optimize |
| {test and result} | the Feature Fit verdict first, then each rule the update test compared, one per line, with its result: same, opposite, changed value, new, or wording only | • Feature Fit: Fits<br>• F-05.1: changed value |
| {step number} | the step's number on the Glossary's Steps page | 3 |
| {journey step} | the step, in the journey's words | The member extends a loan |
| {mark} | Reused, New or Decision | Reused |
| {reused item} | an item's ID and name that stays as it is | F-04 Borrow a book |
| {new item} | something the change adds. A word the Glossary doesn't have is written New word: {the word}, for glossary-author | New word: Reservation |
| {blocker} | what blocks, and what would unblock it, with the number of its question in the Question log, or None | None |
| {number} | a number, from 1 | 1 |
| {finding} | what the challenge found: the claim challenged, the kind of finding, and the correction | Section 7: missed-gap. F-05.3 also names "once". Add it to the update test. |
| {quote} | the words of the file the challenge read, copied exactly | The system shall not extend a loan more than once. |
| {quote file} | the file the quote is in, as its path inside the project's folder | frds/lending/frd.md |
| {would change} | the type, what's new, what blocks, or none of these | the type |
| {who can fix} | the files settle it, or needs your answer | the files settle it |
| {answer} | change-request-disposition's answer. For a finding that needs your answer, the number of its question in the Question log. | Added F-05.3: changed value |
| {verdict} | adversarial-check's verdict, by its fixed rule: FAIL when a finding would change the type, what's new or what blocks, PASS_WITH_FINDINGS for any other finding, PASS for none. A FAIL sends the report back to change-request-disposition. After a second FAIL in a row, it reads FAIL, taken to your gate, and its findings come first at your yes. | PASS_WITH_FINDINGS |
| {item ID} | the ID of a linked item | F-05.1 |
| {item type} | the item's type, as the Traceability map names it | rule |
| {linked through} | the link, and the item it comes from | in-frd, from F-05 |
| {judgement} | feature-impact's call: No change, Update, New story or Split | Update |
| {why} | one line on why. When the change moves a feature to another EPIC or FRD, it starts: moves to {EPIC or FRD ID} | it is the rule the change raises |
| {size} | Small, Large, or Not sized when nothing is in progress | Small |
| {size rule} | the rule that decided the size, in its own words | it touches one rule in an FRD that is already accepted |
| {in progress} | the piece in progress, each one when there are several, or Nothing in progress | EPIC-002 Lending's stories |
| {workflow} | the workflow the update enters | frd-workflow |
| {start step} | the step it enters at | step 2, frd-author |
| {choice} | a choice recommend.ts offers: Run the path, Insert it, Copy the wording, Re-run the whole workflow, Close it, or Correct the analysis | Run the path |
| {what the choice does} | what happens if you choose it | change-orchestration-workflow makes the updates above, in order |
