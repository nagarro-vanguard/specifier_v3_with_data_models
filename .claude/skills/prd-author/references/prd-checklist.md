# PRD checklist

Run this before the PRD's check program. Anything unchecked is fixed, or becomes a question in the Question log through probing-questions-author. A line, or the part of a line, that says it is checked by check-prd.cjs is left to the program, so the skill spends its time on the judgements.

## Traceability and coverage
- [ ] Every Requirement row traces to a business requirement, or reads TBD with its question. Checked by check-prd.cjs.
- [ ] Every business requirement in the BRD appears in the traceability matrix. Each one has its own row, named from the BRD, and a range is never collapsed into one row. Its status is Covered or Gap. Checked by check-prd.cjs.
- [ ] A Gap is a business requirement nothing covers. Each Gap names its question, and is not hidden. Checked by check-prd.cjs.

## Personas and scope
- [ ] Actors and roles are locked. The roles and permissions table is filled from the files. A cell the files don't settle reads TBD with its question.
- [ ] The scope follows the BRD's In and Out of scope, and nothing outside it is recorded
- [ ] Every row has its kind. A Scope row agrees with the BRD's scope, or names its question. A Way of working row is also in section 8. The four kinds, and what each one traces to, are checked by check-prd.cjs.

## NFRs
- [ ] NFRs split Evidenced and Recommended, each with its confidence tag. Checked by check-prd.cjs.
- [ ] No invented thresholds: sourced, as the file states them, or TBD with its question

## Source integrity
- [ ] Nothing invented to fill a gap. Unknowns are TBD or Proposed (needs confirmation), each with its question. Checked by grade-questions.cjs.
- [ ] Every specific has a citation (`conventions.md`, "Cite every specific")
- [ ] Every requirement is in simple words, with its part of the client's words next to it, and its document and version. Both columns and the source are checked by check-prd.cjs.
- [ ] Every Requirement row's simple words start with a short title in bold, then " — ", then the requirement. Checked by check-prd.cjs.
- [ ] Every Requirement row can be checked yes or no, or names its question (Q4). The words on the "Words that can't be checked" list are checked by check-prd.cjs.
- [ ] One requirement per row, as `atomic-rules.md` says: no row joins two actions that could be built on their own. A row that may join two actions with "and" or "or" is flagged by check-prd.cjs.
- [ ] For each client row, the parts in "The client's words" give back the whole row, word for word. Checked by check-prd.cjs when the source file can be read.
- [ ] The IDs count up from 1 in each section, with no letters. Checked by check-prd.cjs.
- [ ] No word the Glossary retired is in the simple words. Checked by check-prd.cjs when the project has a Glossary.

## Document readiness
- [ ] The status line is in place, directly under the title, with no opening notes and no lines in italics. Checked by check-prd.cjs.
- [ ] Document control complete: Owner and Source BRD with its version
- [ ] Product overview references the BRD without repeating the business case
- [ ] A delivery team could decompose this into features and stories without re-reading the BRD
