# PRD checklist

Run this before the PRD's check program. Anything unchecked is fixed, or becomes a question in the Question log through probing-questions-author. A line, or the part of a line, that says it is checked by check-prd.ts is left to the program, so the skill spends its time on the judgements.

## Traceability and coverage
- [ ] Every Requirement row traces to a business requirement, or reads `[TBD, Q{n}]`. Checked by check-prd.ts.
- [ ] Every business requirement in the BRD appears in the traceability matrix. Each one has its own row, named from the BRD, and a range is never collapsed into one row. Its status is Covered or Gap. Checked by check-prd.ts.
- [ ] A Gap is a business requirement nothing covers. Each Gap reads `Gap [TBD, Q{n}]`, and is not hidden. Checked by check-prd.ts.

## Personas and scope
- [ ] Actors and roles are locked. The roles and permissions table is filled from the files. A cell the files don't settle reads `[TBD, Q{n}]`.
- [ ] The scope follows the BRD's In and Out of scope, and nothing outside it is recorded
- [ ] Every row has its kind. A Scope row agrees with the BRD's scope, or names its question. A Way of working row is also in section 8. The four kinds, and what each one traces to, are checked by check-prd.ts.
- [ ] Every row has its Label. A Purpose row has Problem or Value. A Scope row has In MVP or Out of MVP. Any other row has "—". Checked by check-prd.ts.
- [ ] A Purpose row's statement is one plain fact. A Scope row's statement says plainly what is in or out.

## NFRs
- [ ] NFRs split Evidenced and Recommended, each with its confidence tag. Checked by check-prd.ts.
- [ ] No invented thresholds: as the file states them, or `[TBD, Q{n}]`

## Source integrity
- [ ] Nothing invented to fill a gap (`conventions.md`, "Nothing invented")
- [ ] Everything in the PRD comes from a file the Discovery brief marks Used, or from an answer, even though the PRD names neither
- [ ] Missing values read `[TBD, Q{n}]`. Suggested values have `<sup>*Q{n}</sup>`. Each names its question. Checked by grade-questions.ts.
- [ ] No citations: no "per …", no file name, no version, no section or decision number, and no Source column. Checked by check-prd.ts.
- [ ] Every table or list with a `<sup>*Q{n}</sup>` has the legend line straight under it, and no other has one. Checked by check-prd.ts.
- [ ] No Decision record. The Check record holds "None yet." or one line, Pass or Fail with the date and time. Checked by check-prd.ts.
- [ ] Every requirement is in simple words, with its part of the client's words next to it, under the client's own heading. Both columns are checked by check-prd.ts.
- [ ] Every row's simple words start with a short title in bold, then " — ", then the statement. Checked by check-prd.ts.
- [ ] Every title is a noun that names the thing, such as "Named approval of decisions". A Requirement's title names the capability.
- [ ] No title holds an image, such as "thread", "edges", "waves", "north star" or "control plane". It names what the thing does instead.
- [ ] Every Requirement row reads "{Who} can {action}" or "The platform {does something}". Checked by check-prd.ts.
- [ ] Every Requirement row can be checked yes or no, or names its question (Q4). The words on the "Words that can't be checked" list are checked by check-prd.ts.
- [ ] One requirement per row, as `atomic-rules.md` says. A row is split only when its parts are separate capabilities. The steps of one capability stay in one row, such as make, sign and approve a decision. A row that may join two actions with "and" or "or" is flagged by check-prd.ts.
- [ ] For each client row, the parts in "The client's words" give back the whole row, word for word
- [ ] The IDs count up from 1 in each section, with no letters. Checked by check-prd.ts.
- [ ] No word the Glossary retired is in the simple words. Checked by check-prd.ts when the project has a Glossary.

## Document readiness
- [ ] The status line is in place, directly under the title, with no opening notes and no lines in italics. Checked by check-prd.ts.
- [ ] Document control complete: Owner and Source BRD with its version
- [ ] Product overview references the BRD without repeating the business case
- [ ] A delivery team could decompose this into features and stories without re-reading the BRD
