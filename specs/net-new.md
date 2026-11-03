# Net new: specs

**Frozen:** this file is a record of the design. It was last changed on 2026-10-27 and is not updated any more. What was actually built, and every change made after the design, is in [build-log.md](../build-log.md).

**What this doc is:** every item that nothing in today's toolkit does. Each is written from scratch, from the decisions on the two design pages.

**How to read it:** every item has the same 11 parts. "Row N" means row N on the [Old vs New Workflow](https://claude.ai/artifact/XpiJqPk4DQTrRhqjqKwKKW) page.

**Shared program conventions,** so they're not repeated per item:
- Every program is run as `node specifier_v3/tools/<name>.cjs --project <project> ...`.
- Exit codes:
  - 0: done, or the check passed
  - 1: the check found problems, listed one per line
  - 2: an input is missing, named in the message
- Programs never decide anything; they only copy, compare, count or route.

**Status:** draft for your review, 2026-10-19, updated 2026-10-22. Nothing is built until its "Open points" part is empty.

## Summary

Every item in this doc, one row each, in spec order. Read across a row to see what it is, what it takes in and gives out, and where it sits in the flow. The full spec for each follows below.

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| `conventions.md` | The rules every skill follows, in one place. | • none | • the rules | • read by every skill | none | Net new<br>phase 1<br>[NET-NEW 1](net-new.md) |
| `project-folders.md` | Where every document of a run lives. | • none | • the folder of each document | • read by `lib/run-paths.cjs` | none | Net new<br>phase 1<br>[NET-NEW 2](net-new.md) |
| Version log entry | The shape of one line in the Version log. | • none | • one row per accepted version | • filled by `version-log.cjs` | none | Net new<br>phase 1<br>[NET-NEW 3](net-new.md) |
| Traceability map | The shape of the Traceability map: every ID and its links. | • none | • items and links | • filled by `traceability-map.cjs`<br>• read by `find-linked.cjs` | none | Net new<br>phase 1<br>[NET-NEW 4](net-new.md) |
| Change impact report | The shape of the Change impact report: 16 sections, each with one writer. | • none | • the report's sections | • filled during `requirement-update-workflow`<br>• checked by `check-change-report.cjs` | none | Net new<br>phase 1<br>[NET-NEW 5](net-new.md) |
| `lib/run-paths.cjs` | Finds where any document of a run lives. | • `project-folders.md` | • a file path | • used by every program and skill | none | Net new<br>phase 1<br>[NET-NEW 6](net-new.md) |
| `lib/md-tables.cjs` | Reads the table under a heading into rows. | • any document | • rows | • used by the check programs | none | Net new<br>phase 1<br>[NET-NEW 7](net-new.md) |
| `version-log.cjs` | Saves a numbered copy of a document when you accept it. | • the accepted document | • Version log entry and copy | • run by `accept.cjs` | none | Net new<br>phase 1<br>[NET-NEW 8](net-new.md) |
| `traceability-map.cjs` | Rebuilds the links from requirement to feature to EPIC to FRD rule to story. | • the accepted documents | • Traceability map | • run by `accept.cjs`<br>• read by `find-linked.cjs` | none | Net new<br>phase 1<br>[NET-NEW 9](net-new.md) |
| `accept.cjs` | Runs the four things that happen at every acceptance, in order. | • the accepted document's name | • runs `version-log.cjs` for the document, then for the Question log, then `traceability-map.cjs`, then `track-change.cjs` | • after every "yes" at a gate | none | Net new<br>phase 1<br>[NET-NEW 10](net-new.md) |
| `status.cjs` | Says what's done, what's parked, which Must answer questions are open, and what to run next. | • Version log<br>• Story lists<br>• FRD status lines<br>• change progress<br>• Question log | • a status list, with the Must answer questions still open, ending with "Next:" | • run any time | none | Net new<br>phase 1<br>[NET-NEW 11](net-new.md) |
| `fixtures/mcp-slice/` | A slice of MCP's Setup section, copied from the earlier MCP run, for testing every skill and program. | • none | • test sources | • used in every phase's test | none | Net new<br>phase 1<br>[NET-NEW 12](net-new.md) |
| `build-log.md` | The build status of every item. | • none | • one row per item | • updated after every build step | none | Net new<br>phase 1<br>[NET-NEW 13](net-new.md) |
| `check-discovery-brief.cjs` | Checks the Discovery brief. | • Discovery brief<br>• Question log | • pass, or the problems found | • before `discovery-author`'s gate | none | Net new<br>phase 2<br>[NET-NEW 14](net-new.md) |
| `check-brd.cjs` | Checks the BRD. | • BRD<br>• Question log | • pass, or the problems found | • before `brd-author`'s gate | none | Net new<br>phase 2<br>[NET-NEW 15](net-new.md) |
| `check-prd.cjs` | Checks the PRD, including that every requirement has its source. | • PRD<br>• BRD<br>• Question log | • pass, or the problems found | • before `prd-author`'s gate | none | Net new<br>phase 2<br>[NET-NEW 16](net-new.md) |
| `requirements-workflow` | Connects discovery-author, brd-author and prd-author for one product. | • Sources | • Discovery brief<br>• BRD<br>• PRD | • the first workflow<br>• run again from step 1 after a dramatic change<br>• comes before `glossary-author` | the skills' own: 3 | Net new<br>phase 2<br>[NET-NEW 17](net-new.md) |
| `lib/scan-retired-words.cjs` | Finds retired glossary words used outside quoted text. | • Glossary<br>• the document being checked | • each retired word found, with the word to use now | • used by every check from the Feature catalog on | none | Net new<br>phase 3<br>[NET-NEW 18](net-new.md) |
| `build-glossary-records.cjs` | Builds the decision register and the section decisions from the gate log. | • Glossary gate log | • Decision register<br>• Section decisions | • runs after `glossary-author` and `glossary-disposition` | none | Net new<br>phase 3<br>[NET-NEW 19](net-new.md) |
| `check-features.cjs` | Checks the Feature catalog:<br>• every requirement covered<br>• every feature has a capability and its pieces<br>• no retired words | • Feature catalog<br>• PRD<br>• Glossary<br>• Question log | • pass, or the problems found | • before `feature-author`'s gate | none | Net new<br>phase 4<br>[NET-NEW 20](net-new.md) |
| `check-epic-grouping.cjs` | Checks the EPIC grouping:<br>• every feature placed once<br>• clashes settled<br>• the brief list present | • EPIC grouping<br>• Feature catalog<br>• Question log | • pass, or the problems found | • before `epic-grouping-author`'s gate | none | Net new<br>phase 4<br>[NET-NEW 21](net-new.md) |
| `check-register.cjs` | Proves the EPIC register is an exact copy of the pick. A pass counts as acceptance. | • EPIC register<br>• EPIC grouping | • pass, or each mismatch | • comes after `epic-author`, register mode<br>• comes before `build-sequencing-mapping.cjs` | none | Net new<br>phase 4<br>[NET-NEW 22](net-new.md) |
| `build-sequencing-mapping.cjs` | Builds EPIC sequencing and EPIC mapping by rearranging the register. | • EPIC register<br>• EPIC grouping<br>• Feature catalog | • EPIC sequencing<br>• EPIC mapping | • the last step of `features-and-epics-workflow` | none | Net new<br>phase 4<br>[NET-NEW 23](net-new.md) |
| `features-and-epics-workflow` | Connects feature-author, epic-grouping-author and epic-author, then checks the register and builds sequencing and mapping. | • PRD<br>• Glossary | • Feature catalog<br>• EPIC grouping<br>• EPIC register<br>• EPIC sequencing<br>• EPIC mapping | • comes after `glossary-author`<br>• comes before `frd-workflow` | the skills' own: 2 | Net new<br>phase 4<br>[NET-NEW 24](net-new.md) |
| `route-next-capability.cjs` | Names the next FRD to write, in Register order, with any waiting on a Must answer question, then parked ones, last. | • Feature catalog<br>• EPIC register<br>• FRD status lines<br>• Question log | • the next capability | • the first step of `frd-workflow` | none | Net new<br>phase 5<br>[NET-NEW 25](net-new.md) |
| `frd-workflow` | Writes one FRD per run: it picks the next capability, then runs frd-author. | • Feature catalog<br>• EPIC register | • one FRD | • comes after `features-and-epics-workflow`<br>• run again until every FRD is accepted<br>• comes before `stories-workflow` | frd-author's: 1 | Net new<br>phase 5<br>[NET-NEW 26](net-new.md) |
| `route-next-epic.cjs` | Names the next EPIC, skipping any that wait on a parked one or on a Must answer question. | • EPIC register<br>• Story lists<br>• Question log | • the next EPIC | • the first step of `stories-workflow` | none | Net new<br>phase 6<br>[NET-NEW 27](net-new.md) |
| `route-brief-list.cjs` | Says whether an EPIC gets an EPIC brief. | • EPIC grouping | • yes or no | • the second step of `stories-workflow` | none | Net new<br>phase 6<br>[NET-NEW 28](net-new.md) |
| `check-epic-brief.cjs` | Checks an EPIC brief, including that it lists only NFR IDs from the PRD. | • EPIC brief<br>• EPIC register<br>• PRD<br>• Glossary<br>• Question log | • pass, or the problems found | • before `epic-author`'s brief gate | none | Net new<br>phase 6<br>[NET-NEW 29](net-new.md) |
| `check-stories.cjs` | Checks an EPIC's Story list and Stories at each stage, and that no story is marked ready while a Must answer question raised in it is open. | • Story list<br>• Stories<br>• Feature catalog<br>• FRDs<br>• Glossary<br>• Question log | • pass, or the problems found | • before each story skill's gate | none | Net new<br>phase 6<br>[NET-NEW 30](net-new.md) |
| `coverage-check.cjs` | Proves every rule of the EPIC's features is named by at least one scenario. | • EPIC register<br>• FRDs<br>• Stories | • pass, or each uncovered rule | • before `ac-author`'s gate | none | Net new<br>phase 6<br>[NET-NEW 31](net-new.md) |
| `stories-workflow` | Takes one EPIC from its brief to ready stories. | • EPIC register<br>• FRDs<br>• EPIC grouping | • EPIC brief, if listed<br>• Story list<br>• Stories, ready | • comes after every FRD is accepted<br>• run again for each EPIC | the skills' own: 3, or 4 with a brief | Net new<br>phase 6<br>[NET-NEW 32](net-new.md) |
| the update test | Decides whether a change alters an existing FRD rule, value, limit or wording. | • FRDs | • each rule compared, with its result | • used by `change-impact-author` | none | Net new<br>phase 7<br>[NET-NEW 33](net-new.md) |
| `change-impact-author` | Works out what a change is, how big it is and what to re-run, and asks for your decision. | • the files you brought<br>• Check findings, settled<br>• PRD, looked up<br>• FRDs, looked up<br>• Feature catalog, looked up<br>• EPIC register, looked up<br>• Glossary, looked up<br>• Version log, looked up<br>• Traceability map, looked up | • Change impact report<br>• Question log, when it is blocked | • step 5 of `requirement-update-workflow`<br>• runs inside itself, in order:<br>&nbsp;&nbsp;`adversarial-check`<br>&nbsp;&nbsp;`find-linked.cjs`<br>&nbsp;&nbsp;`feature-impact`<br>&nbsp;&nbsp;`size-rules.cjs`<br>&nbsp;&nbsp;`recommend.cjs`<br>• comes before `park.cjs` | Accept the recommendation, including the size? | Net new<br>phase 7<br>[NET-NEW 34](net-new.md) |
| `compare-versions.cjs` | Lists every difference between a new and an old version of a source. | • the new version you brought<br>• the old version in Sources | • the differences, in the report | • step 2 of `requirement-update-workflow`, only when a new version is attached | none | Net new<br>phase 7<br>[NET-NEW 35](net-new.md) |
| `find-linked.cjs` | Lists everything linked to what a change touches. | • Traceability map<br>• Change impact report | • the linked items, in the report | • run by `change-impact-author` | none | Net new<br>phase 7<br>[NET-NEW 36](net-new.md) |
| `size-rules.cjs` | Sizes a change as small or large, against whatever is in progress. | • Change impact report<br>• Story lists<br>• FRD status lines<br>• Version log | • the tentative size, in the report | • run by `change-impact-author`, after `feature-impact` | none | Net new<br>phase 7<br>[NET-NEW 37](net-new.md) |
| `recommend.cjs` | Writes the path a change should take, from its kind and the judgements: "insert it" for a small update, and a re-run offered when it reaches most business requirements. | • Change impact report<br>• Question log | • the recommendation, in the report | • run by `change-impact-author`, after `size-rules.cjs` | none | Net new<br>phase 7<br>[NET-NEW 38](net-new.md) |
| `check-change-report.cjs` | Checks the Change impact report. | • Change impact report<br>• Question log | • pass, or the problems found | • before `change-impact-author`'s gate | none | Net new<br>phase 7<br>[NET-NEW 39](net-new.md) |
| `park.cjs` | Marks the piece in progress as parked, at the back of the queue. | • Change impact report | • "parked" on a Story list or FRD | • the last step of `requirement-update-workflow`, only when large<br>• from an FRD or EPIC gate, when you choose to park after the third "no" | none | Net new<br>phase 7<br>[NET-NEW 40](net-new.md) |
| `track-change.cjs` | Keeps each open change's progress up to date. | • each open change's recommendation and progress | • the change's progress file | • run by `accept.cjs`<br>• calls `close-change.cjs` when a change is complete | none | Net new<br>phase 7<br>[NET-NEW 41](net-new.md) |
| `close-change.cjs` | Writes a change's closing entry, listing every place it was applied. | • the change's progress<br>• Change impact report | • the closing entry, in a decision record | • run by `track-change.cjs` | none | Net new<br>phase 7<br>[NET-NEW 42](net-new.md) |
| `requirement-update-workflow` | Takes one change to your decision. The workflows it names then apply the change. | • your statement<br>• the files you bring | • Change impact report<br>• the parking, if the change is large | • runs at any time<br>• after it, you run the workflows the recommendation names | change-impact-author's: 1<br>glossary-disposition's too, when a word must be settled | Net new<br>phase 7<br>[NET-NEW 43](net-new.md) |
| `README.md` | How a specifier uses v3. | • none | • the guide | • written last, read first | none | Net new<br>phase 8<br>[NET-NEW 44](net-new.md) |
| `scaffold-project.cjs` | Checks that a project's folders exist, and creates any that are missing. It never deletes or overwrites anything, and leaves a folder that holds older work alone. | • the project name<br>• project-folders.md | • the project's folders | • the first thing every workflow runs<br>• run by every skill on its own, before it writes | none | Net new<br>phase 1<br>[NET-NEW 45](net-new.md) |
| `lib/md-lint.cjs` | Finds markdown that won't read correctly in a viewer: broken table rows, hidden text, broken links and diagrams that won't draw. | • a document's text | • each problem, with its line number | • run by every check program<br>• run by the Phase 1 tests on every kit document | none | Net new<br>phase 1<br>[NET-NEW 46](net-new.md) |
| `list-sources.cjs` | Lists every file in a project's sources folder, marks the ones that are the same as another, or an older version of another, and names files that differ only by a date for discovery-author to judge. | • the files in sources/ | • the Discovery brief's list of sources<br>• the sets of dated files to judge | • run by `discovery-author`, first | none | Net new<br>phase 2<br>[NET-NEW 47](net-new.md) |
| `examples/` | A complete worked example of each document, all for one made-up product, Expense claims, including the Question log. | • none | • one example per template | • read alongside each template | none | Net new<br>phase 1<br>[NET-NEW 48](net-new.md) |
| `grade-questions.cjs` | Places each question in the Question log in its group by the grid, sets the order, checks each question's shape, and finds gaps that name no question. Open questions never fail it. | • Question log<br>• the grid, from its template<br>• the project's documents | • the questions in order<br>• the count in each group<br>• pass, or the problems found | • run by every skill that writes a document, after `probing-questions-author`<br>• run by every check program<br>• run by `status.cjs`, to list the Must answer questions | none | Net new<br>phase 1<br>[NET-NEW 49](net-new.md) |
| Question log | The shape of the Question log: the impact and severity tables, the grid, and the four groups. The grid lives only here. | • none | • the log's sections<br>• one block per question | • filled by `probing-questions-author`<br>• ordered and checked by `grade-questions.cjs` | none | Net new<br>phase 1<br>[NET-NEW 50](net-new.md) |
| `fill-also-written-as.cjs` | Fills each Gate 2 row's "Also written as" from the settled Gate 1 rows, before Gate 2 is shown. | • Glossary gate log | • the "Also written as" column at Gate 2 | • run by `glossary-author`, before Gate 2 | none | Net new<br>phase 3<br>[NET-NEW 51](net-new.md) |
| `build-retired-words-tables.cjs` | Writes the "Terms replaced or retired over time" table on each kind page from the gate log. | • Glossary gate log<br>• the four kind pages | • one retired-words table per kind page | • runs after `glossary-author` and `glossary-disposition`<br>• read by `lib/scan-retired-words.cjs` | none | Net new<br>phase 3<br>[NET-NEW 52](net-new.md) |
| `insert-answer.cjs` | Writes a late answer into every place the documents name its question, and nothing else. | • Question log<br>• every document<br>• Change impact report | • the answer, in place<br>• the change's progress | • runs when you choose "insert it" at the recommendation's gate | none | Net new<br>phase 7<br>[NET-NEW 53](net-new.md) |
| `copy-wording.cjs` | Copies a requirement's new wording to every place that quotes it, and nothing else. | • Change impact report<br>• PRD<br>• FRDs | • the new wording, in place<br>• the change's progress | • runs when you choose it at the recommendation's gate, for a wording-only change | none | Net new<br>phase 7<br>[NET-NEW 54](net-new.md) |
| `lib/check-document.cjs` | The checks every document shares, and the three blocks printed at its gate, written once for every check program. | • a document<br>• its template<br>• Question log | • each problem found<br>• the three blocks for the gate | • used by every check program, from `check-discovery-brief.cjs` on | none | Net new<br>phase 2<br>[NET-NEW 55](net-new.md) |

---

## Phase 1: foundation

### 1. `conventions.md`

1. **Label and kind:** Net new. A shared file, `.claude/skills/_shared/conventions.md`.
2. **Its one job:** hold the rules every skill follows, in one place, so no skill repeats them.
3. **What exists today:** nothing written for this design. The old `_shared/system-prompt.md` and `standard-formats.md` cover a different flow. They are not used as a source (your rule: don't be shaped by what exists).
4. **What it contains, section by section:**
   1. **Who decides:** only the specifiers, the BA and the PO. Skills read, draft, check and record; programs check, route and generate. (Row 2)
   2. **Kinds of document:**
      - living: changes only as a new version, made by its own skill
      - record: written once; a change adds an entry
      - generated: rebuilt by a program
      - external: comes from outside
      - (Row 5)
   3. **One home per fact.** Each fact lives in one living document; others look it up by ID. (Row 5)
   4. **What each step reads:**
      - Sources are read only by:
        - `discovery-author`
        - `brd-author`
        - `prd-author`
      - In a change, `change-impact-author` and `compare-versions.cjs` also read the files you bring.
      - Every other step reads its nearest input and looks up the rest by ID.
      - (Rows 28, 30)
   5. **Agreed words.** From the Feature catalog on, every document uses the Glossary's agreed words. The BRD and PRD keep the client's own words. (Rows 13, 15)
   6. **Draft first, decide once.** A skill drafts the whole document, runs its check, then holds one gate. (Row 3)
   7. **IDs:**
      - BR-nn in the BRD
      - the source's own requirement IDs in the PRD; REQ-section.n when the source numbers by section
      - NFR-n in the PRD
      - F-nn in the Feature catalog
      - F-nn.dwN for the pieces of a "Done when"
      - EPIC-nnn in the EPIC register
      - FRD-module-letter for each FRD
      - F-nn.N for each FRD rule
      - stories are known by their title
      - a question in the Question log is known by its number, written as "question {n}", never reused (added at the second Phase 1 review, 2026-10-21)
      - Every count starts at 1.
   8. **The Lineage block:** the first block of every document names the previous step, the primary source, any supporting sources and the next step.
   9. **Unknowns and confidence:** an unknown is labelled TBD, never invented, and names its question in the Question log in the same place, such as "TBD, question 12". No document keeps its own list of open questions (your decision of 2026-10-21). Every KPI and NFR carries one confidence tag:
      - CONFIRMED
      - TENTATIVE
      - AI-RECOMMENDED
   10. **Plain characters:**
       - no middle dots
       - no section sign
       - lists are bullets, one item per line
   11. **A mistake found later.** When a step finds a mistake in a document you've already approved, it pauses and you raise it as a change. (Row 33)
   12. **NFRs** live only in the PRD. (Row 42)
   13. **Each requirement's source:** the PRD records where its wording came from, as document and version. (Row 43)
   14. **Running a skill on its own.** Given only the project name, a skill finds its inputs through `lib/run-paths.cjs`. If one is missing, it names it and stops.
   15. **Acceptance.** Every "yes" at a gate runs `accept.cjs`.
   16. **Nothing invented.** No number, limit, timeframe or rule appears unless a source states it. Otherwise it's TBD, or marked "Proposed (needs confirmation)".
   17. **Cite every specific.** Every specific names where it came from.
   18. **Business language.** Documents describe behaviour, not implementation. The list of implementation terms not to use is carried over, in meaning, from the global rules in the old `_shared/system-prompt.md`, and rewritten in plain words. That's a declared reuse.
   19. **Ask, don't assume.** When something material is unknown, the skill doesn't guess, and doesn't stall either (your decisions of 2026-10-21):
       - it runs probing-questions-author (EXTEND 4), then `grade-questions.cjs` (item 49), inside itself, after it drafts and before its check program
       - until a question is answered, the document uses the recommended answer, marked Proposed (needs confirmation), and names the question
       - when no file and no answer gives an objective or a business requirement, the skill suggests one, marked Proposed (needs confirmation), and you decide it at the gate
       - at the gate, questions come in the order `grade-questions.cjs` sets, in the shape `decision-review-gates.md` gives
       - an open question never fails a check
       - when the requirements change so much that most of the work would change, you re-run the whole workflow from the start, instead of raising a change. On a re-run, a question you answered before is asked again, with your earlier answer recommended and dated (your decision of 2026-10-22).
   20. **Added at the Phase 1 gate:**
       - every document opens with what it is, and what it is not
       - markdown that renders: placeholders in curly braces, no "|" inside a table cell, link paths without spaces, and mermaid labels in double quotes
       - the check program prints the facts read at the gate, and its last block goes in the Check record
   21. **Added at the Phase 1 gate:** "Beyond the client's words", the marks a program uses to list every place a document goes beyond its sources (your answer A at the Phase 1 gate, 2026-10-19). After acceptance, the list for the client comes in two halves (your decision of 2026-10-21):
       - what we changed or added, for the client to confirm
       - "What we still need from you": every open question and every TBD, each worded as a question from the Question log
5. **Reads / looks up:** nothing; it's read by every skill.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** reviewed by you at the Phase 1 gate.
9. **On its own:** not applicable.
10. **Done when:**
    - every rule above is present. The design-page row behind each rule is named here, in the spec, never in the file itself.
    - no rule appears in any skill's SKILL.md as well
11. **Open points:** none.

### 2. `project-folders.md`

1. **Label and kind:** Net new. A shared file, `.claude/skills/_shared/project-folders.md`.
2. **Its one job:** say where every document of a run lives.
3. **What exists today:** nothing for this design.
4. **What it contains:** a short explanation, then one block of JSON that `lib/run-paths.cjs` reads. The JSON is the only copy of the layout. The folders are named by document, with no numbers:

   | Document | Path under `Output/<project>/`, in the folder you work from |
   |---|---|
   | Sources | `sources/` |
   | Discovery brief | `{product}-discovery-brief.md` |
   | BRD | `{product}-brd.md` |
   | PRD | `{product}-prd.md` |
   | Question log | `{product}-question-log.md` |
   | Glossary, the seven files | `glossary/`, named as the glossary method names them |
   | Glossary gate log | `glossary/deep-dives/gate-log.md` |
   | Glossary assembly draft | `glossary/deep-dives/glossary-assembly-draft.md` |
   | Glossary section draft and decisions | `glossary/deep-dives/{section}/` |
   | Feature catalog | `frd/feature-catalog.md` |
   | EPIC grouping | `epics/grouping.md` |
   | EPIC register | `epics/register.md` |
   | EPIC sequencing | `epics/sequencing.md` |
   | EPIC mapping | `epics/mapping.md` |
   | EPIC brief | `epics/{epic}/brief.md` |
   | FRD | `frd/frd-{capability}.md` |
   | Design | `design/` |
   | Story list | `epics/{epic}/story-list.md` |
   | Story | `epics/{epic}/{story}.md` |
   | a change | `changes/{change}/`, numbered from 001, holding `impact-report.md`, `check-findings.md` and `progress.md` |
   | Version log | `version-log/log.md`, and the copies |
   | Traceability map | `traceability-map.json` |
   - **Added at the Phase 1 gate:** a guide for people: a picture of the folders, and a table of what goes in each, who writes it and when it is created. Placeholders are written in curly braces, such as `{epic}`.
   - **Renamed after the gate, at your request:** `run-layout.md` became `project-folders.md`, and the layout follows three rules: no numbers in names, a file name never repeats its folder, and a folder exists only to group several files. The BRD, PRD and Discovery brief carry the product name. The JSON block also lists the folders created at setup; the others appear when first needed.
   - **Added on 2026-10-21:** the Question log, `{product}-question-log.md`, sits next to the BRD and PRD, because its questions come from every step (your decision of 2026-10-21).
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `lib/run-paths.cjs` fails if the JSON block is missing or malformed.
9. **On its own:** not applicable.
10. **Done when:** `lib/run-paths.cjs` resolves every document above for the MCP test slice.
11. **Open points:** none.

### 3. Version log entry template

1. **Label and kind:** Net new. A template, `.claude/skills/_shared/templates/parts/version-log.md`.
2. **Its one job:** fix the shape of one line in the Version log.
3. **What exists today:** nothing for this design.
4. **What it contains:** `version-log/log.md` is a table with these columns: Version | Document | Date | Decision record entry | Copy | Lines added | Lines removed. Copies are saved as `version-log/<document>/v<n>.md`, with n starting at 1.
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `version-log.cjs` writes exactly these columns.
9. **On its own:** not applicable.
10. **Done when:** used by `version-log.cjs` on the MCP test slice.
11. **Open points:** none.

### 4. Traceability map template

1. **Label and kind:** Net new. A template, `.claude/skills/_shared/templates/parts/traceability-map.md`, describing `traceability-map.json`.
2. **Its one job:** fix the shape of the map.
3. **What exists today:** nothing for this design.
4. **What it contains:**
   - **Items:** one per ID, with:
     - the ID
     - its type, one of:
       - BR
       - requirement
       - NFR
       - feature
       - piece
       - EPIC
       - FRD
       - rule
       - story
       - scenario
     - its document
     - the document's version
   - **Links:** each has a from, a to, and one of these link types:
     - covers: a feature covers a requirement
     - has-piece: a feature has a "Done when" piece
     - in-epic: a feature is in an EPIC
     - in-frd: a feature is in an FRD
     - proves: a rule proves a piece
     - tells: a story tells a feature
     - names-rule: a scenario names a rule
     - applies: an EPIC applies an NFR
     - traces: a requirement traces to a BR
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `traceability-map.cjs` writes exactly this shape.
9. **On its own:** not applicable.
10. **Done when:** used by `traceability-map.cjs` and `find-linked.cjs` on the MCP test slice.
11. **Open points:** none.

### 5. Change impact report template

1. **Label and kind:** Net new. A template, `.claude/skills/_shared/templates/change-impact-report.md`.
2. **Its one job:** fix the shape of the Change impact report.
3. **What exists today:** nothing writes a report like this. The old `change-impact`, renamed `feature-impact`, writes a verdict for one item only.
4. **What it contains,** each section owned by exactly one writer:

   | Section | Written by |
   |---|---|
   | 1. The change, as you stated it | you, through the workflow's first step |
   | 2. Files you brought | the workflow's first step |
   | 3. Other differences in a new source version | `compare-versions.cjs` |
   | 4. Check findings on documents from outside, each with how it was settled | `glossary-check`, and the "Settled as" column by `glossary-disposition` |
   | 5. Restated, and split if several asks, with the agreed words the change renames | `change-impact-author` |
   | 6. Where it lands: requirement, feature, FRD, EPIC | `change-impact-author` |
   | 7. Its kind: net new, extend/enhance, update/optimize, already covered or blocked, with the test that decided it | `change-impact-author` |
   | 8. The journey, with reuse in green, new in red and decisions in blue | `change-impact-author` |
   | 9. What's reused, and what's new | `change-impact-author` |
   | 10. What blocks, each blocker naming its question in the Question log | `change-impact-author` |
   | 11. The challenge's findings | `adversarial-check` |
   | 12. Linked items | `find-linked.cjs` |
   | 13. Each linked item's judgement | `feature-impact`, called by `change-impact-author` once per item |
   | 14. The tentative size, with the rule that decided it | `size-rules.cjs` |
   | 15. The recommendation: the path, its workflows, steps and items | `recommend.cjs` |
   | 16. Your decision | `change-impact-author`, at its gate |
   - **Added at the Phase 1 gate:**
     - the definition block under the title: what this is, and what it is not
     - a Check record section, last, for the check program's "For the file" block (your answer A at the Phase 1 gate, 2026-10-19)
   - **Rebuilt after the Phase 1 gate, to the template standard** (`conventions.md`, "Templates and examples"): no hidden notes; one italic line under each heading, kept in the finished document; every placeholder says exactly what to write, with an Expense claims example; the guidance of the old skill brought back
   - **Added on 2026-10-21,** following your row 40 call, "agree the word first", and your decisions of 2026-10-21:
     - section 4 gains a table with the columns Word found, Where and Settled as. Each mismatch is settled at `glossary-disposition`'s gate before `change-impact-author` starts, so the analysis works with agreed words.
     - section 5 gains "Agreed words this change renames", with the columns Agreed word and Becomes, which `recommend.cjs` reads. It says None when the change renames none.
     - section 10's blocker is a question in the Question log, asked in the shape `decision-review-gates.md` gives, and names its number
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** `check-change-report.cjs` checks this shape.
9. **On its own:** not applicable.
10. **Done when:** a report on the MCP test slice has all 16 sections.
11. **Open points:** none.

### 6. `lib/run-paths.cjs`

1. **Label and kind:** Net new. A program library.
2. **Its one job:** turn a project and a document name into its path, using the JSON block in `project-folders.md`.
3. **What exists today:** nothing.
4. **What it does:**
   - `pathOf(project, document, values)` returns the full path, filling in values such as the EPIC number.
   - `exists(project, document, values)` says whether that file is there.
   - It fails with exit code 2 if the layout block is missing or malformed.
5. **Reads / looks up:** `project-folders.md`.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** its own tests on the MCP test slice.
9. **On its own:** used only by other programs.
10. **Done when:** every document in `project-folders.md` resolves.
11. **Open points:** none.

### 7. `lib/md-tables.cjs`

1. **Label and kind:** Net new. A program library.
2. **Its one job:** read the markdown table under a given heading into rows keyed by column name.
3. **What exists today:** nothing in this design. `check-frd.cjs` parses tables its own way.
4. **What it does:**
   - `tableUnder(file, heading)` returns the rows.
   - `headings(file)` returns the headings, in order.
   - `<br>` inside a cell splits it into a list.
5. **Reads / looks up:** any markdown file it's given.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** its own tests.
9. **On its own:** used only by other programs.
10. **Done when:** it reads every table in every template correctly.
11. **Open points:** none.

### 8. `version-log.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** save a numbered copy of a document the moment it is accepted. (Row 27)
3. **What exists today:** nothing used. The old `version-log.js` is an optional background run and isn't borrowed.
4. **What it does:**
   - Copies the document to `version-log/<document>/v<n>.md`, where n is the last version plus 1, starting at 1.
   - Appends one row to `version-log/log.md`, shaped as item 3.
   - Counts the lines added and removed against the previous version.
5. **Reads / looks up:**
   - the accepted document
   - `version-log/log.md`
6. **Writes:**
   - the copy
   - one row in the log
7. **Its gate:** none.
8. **Its check:** fails with exit code 2 if the document doesn't exist.
9. **On its own:** `node tools/version-log.cjs --project <p> --document <name>`
10. **Done when:** two acceptances of the same document give v1 and v2, with the right line counts.
11. **Open points:** none.

### 9. `traceability-map.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** rebuild `traceability-map.json` from the accepted documents. (Row 28)
3. **What exists today:** nothing used. The old RUN MANIFEST was described but never written, and isn't borrowed.
4. **What it does:**
   - Reads the ID tables of these documents through `lib/md-tables.cjs`:
     - BRD
     - PRD
     - Feature catalog
     - EPIC register
     - every FRD
     - every EPIC brief
     - every Story list and Story
   - Writes the items and links of item 4.
   - Only the latest accepted version of each document counts.
5. **Reads / looks up:** the documents above, and `version-log/log.md` to find the latest versions.
6. **Writes:** `traceability-map.json`.
7. **Its gate:** none.
8. **Its check:** every link's from and to must be an existing item. Any that isn't is listed, with exit code 1.
9. **On its own:** `node tools/traceability-map.cjs --project <p>`
10. **Done when:** on the MCP test slice, every ID appears once and every expected link is present.
11. **Open points:** none.

### 10. `accept.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** run what happens at every acceptance, in a fixed order.
3. **What exists today:** nothing.
4. **What it does,** in order, stopping at the first failure:
   1. runs `version-log.cjs`
   2. runs `version-log.cjs` again, for the Question log, so every acceptance saves the questions as they stood. It's skipped when the project has no Question log yet, or when the Question log is the document being accepted. Added on 2026-10-21, with the Question log.
   3. runs `traceability-map.cjs`
   4. runs `track-change.cjs`. Until Phase 7 builds it, it's reported as not built yet, and skipped.
5. **Reads / looks up:**
   - the accepted document's name
   - whether the project has a Question log
6. **Writes:** nothing itself.
7. **Its gate:** none.
8. **Its check:** exits with the first failing program's code.
9. **On its own:** `node tools/accept.cjs --project <p> --document <name>`
10. **Done when:**
    - one call leaves a new version, a rebuilt map and updated change progress
    - every acceptance also leaves a new copy of the Question log, once, and a project without one is left as it is
11. **Open points:** none.

### 11. `status.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** say where a project stands and what to run next.
3. **What exists today:** nothing. The old orchestrator held this in its own run, and isn't borrowed.
4. **What it does:**
   - Prints one line per workflow and piece, with one of these states:
     - not started
     - drafted
     - accepted
     - parked
     - ready
   - Prints open changes and their progress.
   - Prints "Must answer, still open": every Must answer question still open in the Question log, each with:
     - where it was raised
     - when it must be answered by
     - its next best action
   - It reads the questions through `grade-questions.cjs` (item 49), run so that it changes nothing. After every acceptance, the skill pastes this list at the close of its gate (`decision-review-gates.md`, rule 7). Added on 2026-10-21, with the Question log.
   - Ends with "Next:" and the exact workflow to run, in the flow's order, with parked pieces last.
5. **Reads / looks up:**
   - `version-log/log.md`
   - the Story list files
   - the FRD status lines
   - `changes/*/progress.md`
   - the Question log, through `grade-questions.cjs`
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** `node tools/status.cjs --project <p>`
10. **Done when:**
    - on the MCP test slice, at every point of a run, "Next:" names the right workflow
    - on the Expense claims examples, it lists the one Must answer question still open, and on the MCP test slice it lists None
11. **Open points:** none.

### 12. `fixtures/mcp-slice/`

1. **Label and kind:** Net new. Test data.
2. **Its one job:** a small slice of the real MCP project, to test every skill and program quickly.
3. **What exists today:** the earlier MCP run's outputs, in `Output/` and `frd_experiment/`. They are copied from, never changed. The old `.claude/_plans/fixtures/` isn't borrowed.
4. **What it contains,** laid out as a project folder per `project-folders.md`:
   - `sources/mcp-requirements-v4.md`: the full source, copied as it is
   - `mcp-slice-prd.md`: section 3, Setup, REQ-3.1 to 3.6, word for word
   - `frd/feature-catalog.md`: F-15 to F-20, with their capabilities and "Done when" pieces
   - `epics/register.md`: EPIC-003
   - `frd/frd-team-and-roles.md`: the Team & roles FRD
   - `epics/EPIC-003-source-and-team-setup/`: the Story list with its 12 stories, and the 3 Team & roles Stories
   - `mcp-slice-question-log.md`: a Question log holding the slice's 10 questions, moved word for word from the PRD, the FRD and the Story list, whose Open questions sections were removed. The ratings were added for the log. Added on 2026-10-21.
   - `fixtures/README.md` says where each piece was copied from. Its section "What the slice shows on purpose" names the faults left in the slice for the checks to find:
     - gaps that name no question
     - an answer that starts with "No"
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** each test copies it into a temporary folder. No test changes it.
10. **Done when:** every phase's test runs on it.
11. **Open points:** none. The slice has no Discovery brief, BRD, Glossary or EPIC grouping yet. The Phase 2 and 3 tests add them, from the MCP requirements you provide.

### 13. `build-log.md`

1. **Label and kind:** Net new. A tracking file, `specifier_v3/build-log.md`.
2. **Its one job:** show the build status of every item in these four specs.
3. **What exists today:** nothing for this design.
4. **What it contains:** one row per item: Item | Spec doc | Phase | Status | Date | Note. The status is one of:
   - not started
   - built
   - tested
   - gate passed
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** not applicable.
10. **Done when:** every item in the four specs has a row.
11. **Open points:** none.

### 45. `scaffold-project.cjs`

1. **Label and kind:** Net new. A program. Added during Phase 1, at your request of 2026-10-19.
2. **Its one job:** check that a project's folders exist, and create any that are missing.
3. **What exists today:** nothing in this design. The glossary method's harvest skill has its own scaffolding step, which shows where it will write, for the Glossary only. It isn't borrowed.
4. **What it does:**
   - Reads the folders from the JSON block in `project-folders.md`.
   - Creates every fixed folder, and the folder that holds each kind of piece, such as `stories/` and `changes/`.
   - Creates a piece's own folder, such as `stories/EPIC-003/`, only when its value is given.
   - Never deletes, moves or overwrites anything. Running it again changes nothing.
   - If the project folder holds something the layout doesn't know, such as older work, it creates nothing and lists what it found.
   - Prints what it created and what was already there. When `sources/` is empty, it says where to put the requirement files.
5. **Reads / looks up:**
   - `project-folders.md`
   - the project folder
6. **Writes:** folders only.
7. **Its gate:** none.
8. **Its check:**
   - exit code 1 when the project folder holds things the layout doesn't know
   - exit code 2 when no project is given
9. **On its own:** `node tools/scaffold-project.cjs --project <p>`, with `--epic`, `--frd`, `--change` or `--section` for a piece's folder. Every workflow's first step runs it, and so does every skill run on its own, before anything is written.
10. **Done when:**
    - a new project gets every folder
    - a second run creates nothing
    - a folder holding older work is left alone
11. **Open points:** none.

### 46. `lib/md-lint.cjs`

1. **Label and kind:** Net new. A program library. Added at the Phase 1 gate, 2026-10-19, after you found tables, diagrams and text breaking.
2. **Its one job:** find markdown that won't read correctly in a markdown viewer.
3. **What exists today:** nothing. The glossary method has a character sweep, for its own files only. It isn't borrowed.
4. **What it finds:**
   - a table row with more or fewer cells than its header, such as one split by a "|" inside a cell
   - text in angle brackets outside code, which a viewer hides as HTML
   - a link whose path holds a space
   - in a mermaid diagram: angle brackets other than a line break, or a label with brackets, braces or quotes that isn't in double quotes
5. **Reads / looks up:** the text it is given.
6. **Writes:** nothing. It returns each problem with its line number.
7. **Its gate:** none.
8. **Its check:** its own tests, and a test that every kit document renders cleanly.
9. **On its own:** used by the check programs, and by the Phase 1 tests.
10. **Done when:** it finds each kind of break, passes what renders, and every template, shared file, spec and fixture passes it.
11. **Open points:** none.

### 48. Worked examples

1. **Label and kind:** Net new. Shared files, in `_shared/examples/`. Added after the Phase 1 gate, when you asked for examples.
2. **Its one job:** show what a finished document looks like, for a made-up product, so nobody has to guess from a blank template.
3. **What exists today:** nothing. The old skills had short examples inside their instructions only.
4. **What it contains:** one complete document per template, under the template's own file name, all for the same made-up product, Expense claims, so the examples follow on from each other. These are written now:
   - the Discovery brief
   - the BRD
   - the PRD
   - the Question log, added on 2026-10-21. Its questions are numbered across all four examples, so a gap in one names a question in the log.

   The others are written in the phase that builds their skill.
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** the Phase 1 tests check that every example renders cleanly and uses no client material, and that the four examples together give `grade-questions.cjs` no findings.
9. **On its own:** read by you, and by each skill alongside its template.
10. **Done when:** every template has its example.
11. **Open points:** none.

### 49. `grade-questions.cjs`

1. **Label and kind:** Net new. A program. Added on 2026-10-21, with the questions design (your decisions of 2026-10-21).
2. **Its one job:** place every question in the Question log in its group, set the order they are asked in, and check the log and the gaps that point to it.
3. **What exists today:** nothing. Each old skill sorted its own questions by judgement, with no shared grid.
4. **What it does,** in order:
   1. Reads the grid from `templates/question-log.md` (item 50), its only home.
   2. Reads every question in the project's Question log, with its parts and its two ratings.
   3. Places each open question in the group the grid gives it, in the grid's order and then by number, and each answered question under Answered, in number order. It rewrites only those four sections of the log. With `--check-only` it changes nothing, and reports each move it would make.
   4. Checks each question:
      - every part is there
      - its impact and its severity each read High, Medium or Low, then the reason
      - its answers are the real choices: at least two, none starting with "Yes" or "No", each saying why you'd pick it and what happens next
      - "I don't know yet" is offered, once
      - "Why I'm asking" cites a file, or says that no file speaks to it
      - it is one question, ending in a single question mark
      - no number is used twice
   5. Checks every gap in the project's documents: each of these labels must name a question that is in the log, such as "TBD, question 12":
      - TBD
      - Proposed (needs confirmation)
      - [Not specified in provided sources]
      - [Needs source excerpt]

      A gap whose question is answered is a note, not a finding: the document shows the answer once the change that brings it in is accepted.
   6. Checks that the log's copy of the grid matches the template.
   7. Prints the three blocks a gate needs, per `decision-review-gates.md` rule 1:
      - "For the person": the count of open questions in each group, the order they are asked in, each with its severity and impact so you see why it is in its group (your call at the second Phase 1 review, 2026-10-21), and any moves, notes and findings
      - "One line"
      - "For the file"
   - An open question is never a finding: a document can be accepted while questions are open.
   - Other programs can call it: `status.cjs` uses it to list the Must answer questions still open.
5. **Reads / looks up:**
   - the grid, in `templates/question-log.md`
   - the Question log
   - every document in the project folder, except those in `version-log/`, `glossary/`, `sources/` and `design/`
6. **Writes:** the four question sections of the Question log, unless `--check-only` is given.
7. **Its gate:** none.
8. **Its check:**
   - lists each finding, with exit code 1
   - exit code 2 when the project or the template is missing
9. **On its own:** `node tools/grade-questions.cjs --project <p> [--check-only]`. Every author skill runs it after probing-questions-author (EXTEND 4), and every check program runs it.
10. **Done when:**
    - on the Expense claims examples together, it finds nothing, and puts the 4 open questions in the grid's order
    - a new rating moves a question to its group, and an answer moves it to Answered
    - each kind of broken question is a finding
    - on the MCP test slice, it finds the 9 gaps that name no question, and the answer that starts with "No"
11. **Open points:** none.

### 50. Question log template

1. **Label and kind:** Net new. A template, `.claude/skills/_shared/templates/question-log.md`, with its worked example, `examples/question-log.md`. Added on 2026-10-21, with the questions design (your decisions of 2026-10-21).
2. **Its one job:** fix the shape of the Question log, the one place every question in a project is kept, whichever step raised it.
3. **What exists today:** nothing. Each old document held its own open questions, in:
   - the Discovery brief's section 6
   - the PRD's Open questions section
   - the Feature catalog's Open questions section
   - the FRD's Open questions section
   - the Story list's Open questions section

   Those sections are removed from their templates, as the OPTIMIZE spec records.
4. **What it contains:**
   - the opening blocks. It has no status line: the log is never accepted on its own, and it is of the living kind.
   - **1. Impact:** how much has to be redone if the answer is wrong. High, Medium and Low, each with what it means, what happens if the answer is wrong, and an example.
   - **2. Severity:** how much harm is done if the work goes ahead on a wrong answer. The same three levels and columns.
   - **3. The grid:** nine rows, with the columns Order, Severity, Impact and Group. This is the grid's only home, and `grade-questions.cjs` reads it from here. Severity sets the order first, then impact:
     - Must answer, orders 1 to 3: High severity
     - Should answer, orders 4 to 6: Medium severity with High or Medium impact, or Low severity with High impact
     - Can move ahead, orders 7 to 9: the rest
   - **4. What each group does:** how each group is asked at a gate, what "I don't know yet" does, and when an answer is due. A Must answer question must be answered before any FRD that builds on it is accepted, or, for a question raised while writing stories, before those stories are marked ready.
   - **Sections 5 to 7, one for each group:** each open question as a block, `### Question {n}: {question}`, then a table of its parts, in this order:
     - Raised in
     - Why I'm asking
     - For example
     - What it changes
     - Impact
     - Severity
     - Answers
     - Recommended
     - Answer in use for now
     - Who can answer
     - Answer by
     - Next best action
   - **8. Answered:** each settled question, keeping its number and parts, with two more: Answer, and Decided in
   - a Check record, for `grade-questions.cjs`'s "For the file" block
   - a Placeholders table
   - **The worked example:** the Expense claims Question log while the BRD is at its gate, with at least one question in each group, numbered across the example Discovery brief, BRD and PRD.
5. **Reads / looks up:** nothing.
6. **Writes:** nothing. Each project's log is `{product}-question-log.md`, drafted by probing-questions-author (EXTEND 4) and placed by `grade-questions.cjs`.
7. **Its gate:** none. Its questions are asked at the gates of the documents that raised them.
8. **Its check:**
   - `grade-questions.cjs` reads its grid, and checks every log against it
   - the Phase 1 tests check it against the template standard
9. **On its own:** not applicable.
10. **Done when:** `grade-questions.cjs` reads its grid, and the example gives no findings.
11. **Open points:** none.

---

## Phase 2: Requirements

### 14. `check-discovery-brief.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check the Discovery brief before your gate.
3. **What exists today:** nothing.
4. **What it checks:**
   - every section of the Discovery brief template is present
   - every file `list-sources.cjs` finds is in section 1, and every file marked not used gives its reason
   - the order of authority is there, and covers every kind of document marked used
   - every topic has a verdict, and every Differ topic is a clash
   - every clash is settled, by a rank or by a decision
   - each of these names its question in the Question log (your decision of 2026-10-21):
     - every Silent topic
     - every clash settled by a decision
     - every assumption
   - no placeholder is left
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21, with the Question log** (your decisions of 2026-10-21):
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open
     - "For the person" shows how many questions are open in each group
   - **Added while building** (2026-10-22, a call made while building, listed in MASTER-PLAN section 8), each a rule the template already states:
     - section 1 is compared with `list-sources.cjs` by path, so the files may be listed in any order; every copy and older version it marks is marked the same way, and "same as" is used only for identical files
     - a file ruled out of scope names the decision that ruled it out
     - the "At a glance" counts add up, and the Lineage block links every file marked Used
     - every topic sits under one of the nine areas, and its verdict fits its quotes: One source quotes one file, Agree and Differ two or more, Silent none
     - a topic or a clash quotes only files marked Used
     - a clash settled by a rank is won by the file of the highest kind in it, and "What now holds" is that file's words
     - a clash settled by a decision names the question that decision answers
     - every question the brief names is in the Question log
5. **Reads / looks up:**
   - the Discovery brief
   - the files in `sources/`, through `list-sources.cjs`
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-discovery-brief.cjs --project <p>`
10. **Done when:** it passes the Expense claims worked example, and catches each of these, each planted on its own copy:
    - a missing section
    - a clash with no winner
    - a Silent topic that names no question
    - **Changed while building** (2026-10-22): tested on the Expense claims worked examples, with a sources folder planted to match the example's links, because the MCP test slice has no Discovery brief.
11. **Open points:** none.

### 15. `check-brd.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check the BRD before your gate.
3. **What exists today:** nothing. The old BRD checklist is prose for the AI.
4. **What it checks:**
   - the Lineage block, and every section of the BRD template, in order
   - no journey section and no NFR section (Rows 11, 42)
   - BR IDs are unique and numbered from BR-01
   - every KPI has a confidence tag
   - "Out of scope" is not empty
   - a decision record is present
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21, with the Question log** (your decisions of 2026-10-21):
     - every KPI cell states its own origin
     - the Risks table has a Source column, and every risk says where it came from
     - every objective and business requirement marked Proposed (needs confirmation) names its question
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open
     - "For the person" shows how many questions are open in each group
   - **Added while building** (2026-10-22, a call made while building, listed in MASTER-PLAN section 8):
     - every objective, business requirement, risk and release criterion says where it came from, not only those marked Proposed, as `conventions.md`, "Cite every specific", requires
     - of the grader's findings, it fails only on this BRD's own gaps, the questions raised in it, and the Question log as a whole. A gap in another document is that document's check's finding.
5. **Reads / looks up:**
   - the BRD
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-brd.cjs --project <p>`
10. **Done when:** it passes the Expense claims worked example, and catches each failure planted on its own copy. **Changed while building** (2026-10-22): the MCP test slice has no BRD.
11. **Open points:** none.

### 16. `check-prd.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check the PRD before your gate.
3. **What exists today:** nothing.
4. **What it checks:**
   - the Lineage block, and every section of the PRD template, in order
   - every requirement row has its ID, its wording and its source (document and version) (Row 43)
   - no priority column, and no grouping by capability (Row 10)
   - no separate business-rules section and no data section (decision of 2026-10-19)
   - NFR IDs are unique and numbered from NFR-1 (Row 42)
   - the journey section and the transition requirements section are present (Rows 11, 12)
   - every BR has at least one requirement tracing to it
   - a decision record is present
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21, with the Question log** (your decisions of 2026-10-21):
     - the PRD has no Open questions section: its questions are in the Question log
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open
     - "For the person" shows how many questions are open in each group
   - **Added while building** (2026-10-22, a call made while building, listed in MASTER-PLAN section 8), each a rule the template already states:
     - a business requirement nothing traces to passes when its row in the traceability matrix is a Gap that names its question, since an open question never fails a check; the matrix lists exactly the requirements that trace to each business requirement
     - every requirement traces to business requirements that are in the BRD
     - an evidenced NFR says where it came from and has a confidence tag, and a recommended one is marked AI-RECOMMENDED
     - each journey step names requirements that are in the PRD
     - every transition requirement says where it came from, and whether it needs building
5. **Reads / looks up:**
   - the PRD
   - the BRD, for the BR IDs
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-prd.cjs --project <p>`
10. **Done when:** it passes the Expense claims worked example, and catches each failure planted on its own copy. **Changed while building** (2026-10-22): the MCP test slice has a PRD but no BRD, and this check reads the BRD for its IDs.
11. **Open points:** none.

### 17. `requirements-workflow`

1. **Label and kind:** Net new. A workflow, `.claude/skills/requirements-workflow/SKILL.md`.
2. **Its one job:** run `discovery-author`, then `brd-author`, then `prd-author`, in order, for one product.
3. **What exists today:** nothing used. The old `specifier` isn't borrowed.
4. **What it does:**
   - Its steps are exactly the Workflow 1 table in MASTER-PLAN section 4. **Changed while building** (2026-10-22, a call made while building, listed in MASTER-PLAN section 8): the kit can't point to the master plan, which is a build document, so the workflow holds a copy of the table, and a Phase 2 test fails if the two differ.
   - It calls each skill and waits for that skill's own gate. discovery-author's gate is "Accept the Discovery brief?" (your decision of 2026-10-21).
   - It adds nothing between the steps. Each skill runs probing-questions-author (EXTEND 4) and then `grade-questions.cjs` (item 49) inside itself, before its check and its gate, so the workflow gains no steps (your decision of 2026-10-21).
   - It can start at a named step, for example "from prd-author", which the change paths need.
   - **A second way in:** when the requirements change so much that most of the work would change, you re-run the whole workflow from the start, instead of raising a change (your decision of 2026-10-21). On a re-run, each question you answered before is asked again, keeping its number, with your earlier answer recommended and dated (your decision of 2026-10-22).
   - At the end, it prints "Next: run glossary-author."
5. **Reads / looks up:** nothing itself.
6. **Writes:** nothing itself.
7. **Its gate:** none of its own; the skills hold their gates.
8. **Its check:** none of its own.
9. **On its own:** invoked by name, with the project and an optional starting step.
10. **Done when:** on the MCP test slice and on the full MCP requirements, it runs all three skills in order and stops after each skill's gate.
11. **Open points:**
    - none. Decided 2026-10-22: on a re-run, earlier answers are offered as the recommended ones (my proposal 4).

### 47. `list-sources.cjs`

1. **Label and kind:** Net new. A program. Added after the Phase 1 gate, when you asked what happens with hundreds of files.
2. **Its one job:** list every file in a project's `sources/` folder, and mark the ones that are the same as another, or an older version of another.
3. **What exists today:** nothing.
4. **What it does:**
   - lists every file under `sources/`, folder by folder, numbered from 1: the files directly in `sources/` first, then each folder in name order
   - marks a file "same as" another when their contents are identical, keeping the one with the shortest name, since a copy's name is usually the original's plus something, such as "copy"
   - marks a file "older version of" another when their names differ only by a version mark, such as v1 and v2, and the other has the higher version
   - names, for discovery-author to judge, files whose names differ only by a date. It never marks them itself.
   - prints two blocks:
     - "For the brief": the "at a glance" counts and one table per folder, in the shape of the Discovery brief's section 1, with the columns only a reader can fill left as placeholders
     - "For discovery-author": each set of dated files to judge, or "None."
   - **Changed while building** (2026-10-22, a call made while building, listed in MASTER-PLAN section 8): the spec said to mark the earlier of two dated files as an older version. A date often marks one of a series, such as notes from weekly meetings, so marking it would drop all but the last without anyone reading them. discovery-author reads each set instead (OPTIMIZE item 12).
5. **Reads / looks up:** the files in `sources/`.
6. **Writes:** nothing. discovery-author pastes what it prints, and judges the dated sets.
7. **Its gate:** none.
8. **Its check:** exit code 2 when `sources/` is empty or missing.
9. **On its own:** `node tools/list-sources.cjs --project {project}`
10. **Done when:** on a test folder of several hundred files, with copies, older versions and a series of dated notes planted, it lists every file once, marks every copy and every older version, and names the dated notes without marking them.
11. **Open points:** none.

### 55. `lib/check-document.cjs`

1. **Label and kind:** Net new. A program library. Added while building, 2026-10-22 (a call made while building, listed in MASTER-PLAN section 8).
2. **Its one job:** hold the checks every document shares, and print the three blocks every check program shows at its gate, so they are written once.
3. **What exists today:** nothing.
4. **What it does:**
   - finds the document through `lib/run-paths.cjs`, and reads its status line: drafted, accepted or parked
   - checks the opening blocks are there and in order, with the status line after the Lineage block (`conventions.md`, "The opening of every document")
   - checks every section of the document's template is there, in order, with none added
   - finds every placeholder left in the document
   - runs `lib/md-lint.cjs` on the document
   - runs `grade-questions.cjs` (item 49), and keeps the findings that belong to this document: its own gaps, the questions raised in it, and the Question log as a whole
   - lists every place the document goes beyond the client's words (`conventions.md`, "Beyond the client's words")
   - prints the three blocks of `decision-review-gates.md`, rule 1:
     - before acceptance, "For the person" shows what the draft holds, where it goes beyond the client's words, and the open questions in each group
     - after acceptance, it shows each decision with its answer, and the list for the client: what we changed or added, and what we still need from them
5. **Reads / looks up:**
   - the document
   - its template
   - the Question log, through `grade-questions.cjs`
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** none of its own; each check program reports its findings.
9. **On its own:** not run on its own; each check program uses it.
10. **Done when:** `check-brd.cjs`, `check-prd.cjs` and `check-discovery-brief.cjs` use it, and their tests pass.
11. **Open points:** none.

---

## Phase 3: Glossary package

### 18. `lib/scan-retired-words.cjs`

1. **Label and kind:** Net new. A program library.
2. **Its one job:** find retired glossary words used outside quoted text. (Row 31)
3. **What exists today:** nothing. The old `check` skill does this by judgement.
4. **What it does:**
   - Collects every "Earlier term" from the "Terms replaced or retired over time" tables of the Glossary's kind documents.
   - Searches the given document, skipping:
     - quoted passages: lines starting with ">", and text inside double quotes
     - ID columns
   - Returns each hit with its word, its line and the term to use now.
   - The tables it reads are built from the gate log by `build-retired-words-tables.cjs` (item 52), and never edited by hand (your decision of 2026-10-21).
5. **Reads / looks up:**
   - the Glossary kind documents
   - the document to scan
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** its own tests.
9. **On its own:** used by the check programs from the Feature catalog on.
10. **Done when:** on the MCP test slice, it finds a seeded retired word and ignores the same word inside a quote.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on an Expense claims glossary built in the Phase 3 tests, because the MCP test slice has no Glossary (a call made while building, listed in MASTER-PLAN section 8). It also skips code and the path of a link, finds a plural, and never flags a retired word inside a term used today, such as "claim" in "Expense claim".

### 19. `build-glossary-records.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** build the decision register and the section decisions files from the gate log. (Row 14)
3. **What exists today:** nothing. Today harvest writes these files by hand.
4. **What it does:**
   - For each resolved gate-log row, writes one decision-register row, D-n, linking back to the row.
   - For each section, writes its section decisions file: each word mapped to the agreed word, with its D-n link.
   - The shapes are the glossary method's own `decision-register.md` and `section-decisions.md` templates.
   - The gate log is the only place a glossary decision is written. These files are built from it, and never edited by hand (your decision of 2026-10-21).
5. **Reads / looks up:** the Glossary gate log.
6. **Writes:**
   - `glossary/decision-register.md`
   - `glossary/deep-dives/<section>/<section>-decisions.md`
7. **Its gate:** none.
8. **Its check:** fails if any gate-log row is still open.
9. **On its own:** `node tools/build-glossary-records.cjs --project <p>`
10. **Done when:** on the MCP test slice, the register has one row per settled decision, and every row links back.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the same Expense claims glossary. It reads each row's Resolution in the form `output-formats.md` now sets, such as "basket: merged into Cart" (a call made while building, listed in MASTER-PLAN section 8). Every resolved row, Gate 2's included, gets its register row, in the log's order. It writes only the register's table, and leaves the rest of the page, which glossary-author writes, as it is. It writes each section decisions file whole, from its template, and a candidate nothing settles is a finding. A word split into two terms shows as renamed, with both, since the method's list of outcomes has no "split".

### 51. `fill-also-written-as.cjs`

1. **Label and kind:** Net new. A program. Added on 2026-10-21, when you agreed that the gate log is the only place a glossary decision is written.
2. **Its one job:** before Gate 2 is shown, fill each Gate 2 row's "Also written as" from the settled Gate 1 rows.
3. **What exists today:** nothing. Today these words are copied into Gate 2 by hand.
4. **What it does:**
   - Reads every settled Gate 1 row in the gate log: each word merged into a term.
   - For each Gate 2 row, writes the words merged into its term under "Also written as".
   - Writes only that column.
5. **Reads / looks up:** the Glossary gate log.
6. **Writes:** the "Also written as" column of the gate log's Gate 2 rows.
7. **Its gate:** none. `glossary-author` runs it before showing Gate 2 (OPTIMIZE 15).
8. **Its check:** fails if a Gate 1 row is still open.
9. **On its own:** `node tools/fill-also-written-as.cjs --project <p>`
10. **Done when:** on the MCP test slice, a merged word shows next to its term at Gate 2.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the same Expense claims glossary: it writes only the "Also written as" cells, and writes nothing while a Gate 1 row is open.

### 52. `build-retired-words-tables.cjs`

1. **Label and kind:** Net new. A program. Added on 2026-10-21, when you agreed that the gate log is the only place a glossary decision is written.
2. **Its one job:** write the "Terms replaced or retired over time" table on the four kind pages from the gate log, in the order the glossary method's G8 sets.
3. **What exists today:** nothing. Today these tables are written by hand.
4. **What it does:**
   - Reads every word the gate log retires or replaces, with the term to use now and the decision behind it.
   - Writes one table on each of the four kind pages, in the G8 order:
     - object terms
     - role terms
     - step terms
     - states and values
   - Writes only that table. The table says it is filled in by a program from the gate log, and never edited by hand.
   - `lib/scan-retired-words.cjs` (item 18) reads these tables.
5. **Reads / looks up:**
   - the Glossary gate log
   - the four kind pages
6. **Writes:** the "Terms replaced or retired over time" table on each kind page.
7. **Its gate:** none. It runs:
   - after `glossary-author` writes the seven files, next to `build-glossary-records.cjs` (OPTIMIZE 15)
   - after every change `glossary-disposition` makes (OPTIMIZE 16)
8. **Its check:** fails if a word the gate log retires has no row.
9. **On its own:** `node tools/build-retired-words-tables.cjs --project <p>`
10. **Done when:** on the MCP test slice, a merged word appears, and a later rename appears too.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the same Expense claims glossary: a merged word appears, and so does a later rename, with every earlier word pointing to the term used today, the latest first. A word whose term has no definition on its page is a finding.

---

## Phase 4: Features and EPICs

### 20. `check-features.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check the Feature catalog before your gate.
3. **What exists today:** nothing. The old feature-catalog checklist is prose for the AI.
4. **What it checks:**
   - every section of the Feature catalog template is present
   - every requirement in the PRD is covered by at least one feature
   - every feature has:
     - an ID, a name and a description
     - a "Done when"
     - at least one numbered piece, F-nn.dw1 onward
     - a capability
     - a MoSCoW priority, with a basis from the fixed list
   - every ID a feature covers exists in the PRD
   - no retired words, through `lib/scan-retired-words.cjs`
   - a decision record is present
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21, with the Question log** (your decisions of 2026-10-21):
     - the Feature catalog has no Open questions section: its questions are in the Question log
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open
     - "For the person" shows how many questions are open in each group
5. **Reads / looks up:**
   - the Feature catalog
   - the PRD
   - the Glossary
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-features.cjs --project <p>`
10. **Done when:** it catches each seeded failure on the MCP test slice.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data in `fixtures/expense-claims/`, because the MCP test slice has no EPIC grouping or Glossary, with ten failures planted one at a time (a call made while building, listed in MASTER-PLAN section 8). It also checks every rule the template states: the "Done when" adds a word its description lacks; its pieces give it back, in its own words and order; the capability names its FRD; each feature sits under a heading of the PRD; and the coverage check lists exactly the features that cover each requirement.

### 21. `check-epic-grouping.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check the EPIC grouping before your gate.
3. **What exists today:** nothing.
4. **What it checks:**
   - every option places every feature in exactly one EPIC
   - the pick is recorded
   - every clash has its settlement
   - the EPIC brief list has every EPIC, with yes or no and a reason, in run order
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21, with the Question log** (your decisions of 2026-10-21):
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open
     - "For the person" shows how many questions are open in each group
5. **Reads / looks up:**
   - the EPIC grouping
   - the Feature catalog
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-epic-grouping.cjs --project <p>`
10. **Done when:** it catches each seeded failure on the MCP test slice.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data in `fixtures/expense-claims/`, because the MCP test slice has no EPIC grouping or Glossary. It finds every clash from the catalog itself, so none can be missed, and checks that each is settled by a decision; that each band fits its MVP and Later features; that each outcome reads "As a ..., I need ..., so that ..."; and that the inter-EPIC dependencies are exactly the ones the catalog makes (a call made while building, listed in MASTER-PLAN section 8).

### 22. `check-register.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** prove the EPIC register is an exact copy of the picked option. (Row 18)
3. **What exists today:** nothing.
4. **What it checks:** for each EPIC, every field matches the EPIC grouping:
   - name
   - outcome
   - features
   - band
   - persona
   - what it depends on
   - run order
5. **Reads / looks up:**
   - the EPIC register
   - the EPIC grouping
6. **Writes:** nothing.
7. **Its gate:** none. A pass counts as acceptance and runs `accept.cjs`.
8. **Its check:** lists each mismatch, with exit code 1.
9. **On its own:** `node tools/check-register.cjs --project <p>`
10. **Done when:** a changed field in the register is caught on the MCP test slice.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data in `fixtures/expense-claims/`, because the MCP test slice has no EPIC grouping or Glossary. On a pass it writes the date on the register's "Copy checked on" line, as the register template says, and nothing else; epic-author then runs `accept.cjs`, because a pass is the acceptance (a call made while building, listed in MASTER-PLAN section 8).

### 23. `build-sequencing-mapping.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** build EPIC sequencing and EPIC mapping from the register. (Row 19)
3. **What exists today:** nothing used. Today generate-epics writes them.
4. **What it does:**
   - **EPIC sequencing:**
     - Step numbers come from the dependencies. An EPIC with none is step 1; otherwise it's one more than the highest step it depends on.
     - EPICs with the same step run side by side.
     - Each EPIC's reason is copied from the Clustering.
     - The critical path is the longest chain of dependencies.
     - The most depended-on EPIC is the one with the most EPICs waiting on it, directly or through others.
     - Everything is written as fixed sentences, with no free prose.
   - **EPIC mapping:**
     - one row per EPIC: its band, and its features with their requirement IDs
     - a coverage line: every feature in exactly one EPIC
5. **Reads / looks up:**
   - the EPIC register
   - the EPIC grouping
   - the Feature catalog
6. **Writes:**
   - `epics/sequencing.md`
   - `epics/mapping.md`
7. **Its gate:** none.
8. **Its check:** fails if the dependencies form a loop.
9. **On its own:** `node tools/build-sequencing-mapping.cjs --project <p>`
10. **Done when:** on MCP's EPIC register, it reproduces the same steps and critical path as today's hand-written file.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data in `fixtures/expense-claims/`, because the MCP test slice has no EPIC grouping or Glossary, and on a register of four EPICs where two share a step. A tie on the critical path, or on the most depended-on EPIC, goes to the EPIC earlier in the register. A feature in no EPIC, or in two, is a finding. The two files have the opening blocks and no status line, since they are generated, never accepted (a call made while building, listed in MASTER-PLAN section 8). The MCP slice's register has one EPIC and no hand-written sequencing to compare with, so the comparison waits for the trial.

### 24. `features-and-epics-workflow`

1. **Label and kind:** Net new. A workflow.
2. **Its one job:** run `feature-author`, then `epic-grouping-author`, then `epic-author` in register mode, then the copy check, then the sequencing script.
3. **What exists today:** nothing used.
4. **What it does:**
   - Its steps are exactly the Workflow 2 table in MASTER-PLAN section 4.4.
   - Each skill runs probing-questions-author (EXTEND 4) and then `grade-questions.cjs` (item 49) inside itself, before its check and its gate, so the workflow gains no steps (your decision of 2026-10-21).
   - It can start at a named step for named items, for example "epic-grouping-author, place F-82 only".
   - At the end, it prints "Next: run frd-workflow."
5. **Reads / looks up:** nothing itself.
6. **Writes:** nothing itself.
7. **Its gate:** none of its own.
8. **Its check:** none of its own.
9. **On its own:** invoked by name.
10. **Done when:** it runs on the MCP test slice and on the full MCP requirements, stopping only at the skills' gates.
11. **Open points:** none.
12. **Built** 2026-10-22. It holds a copy of the Workflow 2 table, and a Phase 4 test fails if the two differ, as for `requirements-workflow` (a call made while building, listed in MASTER-PLAN section 8). Its runs come in the pass before the trial.

---

## Phase 5: FRD

### 25. `route-next-capability.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** name the next FRD to write.
3. **What exists today:** nothing.
4. **What it does:**
   - Lists every capability in the Feature catalog.
   - Orders them by the earliest EPIC, in Register run order, that holds any of their features.
   - Skips capabilities whose FRD is accepted.
   - Puts last, after the others and before parked ones, a capability with an open Must answer question: one that the Feature catalog's row for any of its features names, such as "Proposed (needs confirmation), question 4". It comes back once the question is answered, or when only waiting and parked capabilities are left. (Your decision of 2026-10-21.)
   - Puts parked ones last.
   - Prints the next capability and its features, or "Every FRD accepted: next, run stories-workflow."
5. **Reads / looks up:**
   - the Feature catalog
   - the EPIC register
   - the FRD status lines
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** `node tools/route-next-capability.cjs --project <p>`
10. **Done when:** on the MCP test slice, it names the capabilities in the right order, with one waiting on an open Must answer question after the others, and parked ones last.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: run order, a capability waiting on an open Must answer question, one coming back when only waiting work is left, a parked one last, and every FRD accepted. The MCP slice has one EPIC, so its order is tested in the trial.

### 26. `frd-workflow`

1. **Label and kind:** Net new. A workflow.
2. **Its one job:** write one FRD: `route-next-capability.cjs`, then `frd-author`.
3. **What exists today:** nothing.
4. **What it does:**
   - Its steps are exactly the Workflow 3 table in MASTER-PLAN section 4.4.
   - One run writes one FRD.
   - frd-author runs probing-questions-author (EXTEND 4) and then `grade-questions.cjs` (item 49) inside itself, before its check and its gate, so the workflow gains no steps (your decision of 2026-10-21).
   - **The FRD guard:** at frd-author's gate, the Must answer questions this FRD builds on come first, one at a time. Each must be answered before the FRD is accepted. If one can't be answered yet, you park the FRD, and other work carries on (`decision-review-gates.md`, rule 3; your decision of 2026-10-21).
   - At the end, it prints what the route says comes next.
5. **Reads / looks up:** nothing itself.
6. **Writes:** nothing itself.
7. **Its gate:** none of its own.
8. **Its check:** none of its own.
9. **On its own:** invoked by name, optionally naming the capability.
10. **Done when:**
    - on the MCP test slice, two runs write the two FRDs in order
    - an FRD that builds on an open Must answer question isn't accepted until that question is answered, or the FRD is parked
11. **Open points:** none.
12. **Built** 2026-10-22. It holds a copy of the Workflow 3 table, and a Phase 5 test fails if the two differ (a call made while building, listed in MASTER-PLAN section 8). Its runs come in the pass before the trial.

---

## Phase 6: Stories

### 27. `route-next-epic.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** name the next EPIC to write stories for. (Row 37)
3. **What exists today:** nothing.
4. **What it does:**
   - Goes through the EPICs in EPIC register run order.
   - Skips EPICs that are ready.
   - Skips EPICs that depend, directly or through others, on a parked EPIC.
   - When only those are left, the parked EPIC comes back.
   - Puts last, as it does a parked one, an EPIC whose Story list or Stories name an open Must answer question. It comes back once the question is answered, or when only waiting EPICs are left. (Your decision of 2026-10-21.)
   - Prints the next EPIC, or "Every EPIC ready."
5. **Reads / looks up:**
   - the EPIC register
   - every Story list
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** `node tools/route-next-epic.cjs --project <p>`
10. **Done when:** on MCP's Register, with EPIC-003 parked, it names EPIC-009, then EPIC-016, then EPIC-003.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on a register of four EPICs: with EPIC-001 parked it names EPIC-003, then EPIC-004, then EPIC-001, and EPIC-002, which depends on it, waits; an EPIC waiting on a Must answer question goes after the others, and comes back when only it is left. The MCP register's own order waits for the trial.

### 28. `route-brief-list.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** say whether an EPIC is on the EPIC brief list. (Row 17)
3. **What exists today:** nothing.
4. **What it does:** prints yes or no for the given EPIC.
5. **Reads / looks up:** the EPIC grouping's EPIC brief list.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** fails if the EPIC isn't in the list.
9. **On its own:** `node tools/route-brief-list.cjs --project <p> --epic EPIC-003`
10. **Done when:** it answers correctly for every EPIC of the MCP test slice.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on both Expense claims EPICs, and on an EPIC the list leaves out, which exits with code 1.

### 29. `check-epic-brief.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check an EPIC brief before your gate.
3. **What exists today:** nothing.
4. **What it checks:**
   - every section of the EPIC brief template is present
   - its features match its Register row
   - its NFR section lists only NFR IDs that exist in the PRD (Row 42)
   - no retired words
   - a decision record is present
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21, with the Question log** (your decisions of 2026-10-21):
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open
     - "For the person" shows how many questions are open in each group
5. **Reads / looks up:**
   - the EPIC brief
   - the EPIC register
   - the PRD
   - the Glossary
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-epic-brief.cjs --project <p> --epic EPIC-003`
10. **Done when:** it catches each seeded failure on the MCP test slice.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: EPIC-002 Claim approval, with its brief, its Story list and three ready Stories, in `fixtures/expense-claims/`, because the MCP slice's Stories have no grooming or criteria yet, with eight failures planted one at a time. It also checks that the hypothesis is the register's outcome, word for word; that each feature has the catalog's name, requirements and description and the grouping's band; that Out of scope names each other EPIC's features with their owner; and that Upstream and Downstream are the register's (a call made while building, listed in MASTER-PLAN section 8).

### 30. `check-stories.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check an EPIC's Story list and Stories before each story gate.
3. **What exists today:** nothing.
4. **What it checks.** The stage is read from each Story's sections.
   - **Always:**
     - every index row has a Story
     - every story has a title and an "As a / I want / So that" statement
     - every story has a requirement ID and a feature ID that exist
     - no retired words
   - **After grooming, also:**
     - the grooming sections are present
     - every rule quoted is an FRD rule ID that exists
     - every flow step referred to exists in the FRD
   - **After acceptance criteria, also:**
     - every scenario names at least one rule ID
     - every scenario is behaviour only (Row 24)
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21, with the Question log** (your decisions of 2026-10-21):
     - the Story list has no Open questions section: its questions are in the Question log
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open, with one exception, the ready guard: after acceptance criteria, it fails while a Must answer question raised while writing these stories is still open, so the stories can't be marked ready (`decision-review-gates.md`, rule 3)
     - "For the person" shows how many questions are open in each group
5. **Reads / looks up:**
   - the Story list and Stories
   - the Feature catalog
   - the FRDs
   - the Glossary
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-stories.cjs --project <p> --epic EPIC-003`
10. **Done when:**
    - it catches each seeded failure, at each stage, on the MCP test slice
    - stories raising an open Must answer question can't be marked ready
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: EPIC-002 Claim approval, with its brief, its Story list and three ready Stories, in `fixtures/expense-claims/`, because the MCP slice's Stories have no grooming or criteria yet, with eleven failures planted one at a time, drafted stories, and the ready guard. A story's stage is read from its sections. Fewer than three scenarios is a finding; more than seven is shown at the gate as a reason to split, never a finding, as the kept rule says (a call made while building, listed in MASTER-PLAN section 8).

### 31. `coverage-check.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** prove that every rule of this EPIC's features is named by at least one acceptance scenario. (Row 25)
3. **What exists today:** nothing used. The old `coverage-gate.mjs` reads a manifest that was never written.
4. **What it does:**
   - Finds the EPIC's features in the register.
   - Finds their rules in the FRDs.
   - Lists any rule that no scenario in the EPIC's Stories names.
   - Rules of features in other EPICs are ignored.
5. **Reads / looks up:**
   - the EPIC register
   - the FRDs
   - the EPIC's Stories
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each uncovered rule, with exit code 1.
9. **On its own:** `node tools/coverage-check.cjs --project <p> --epic EPIC-003`
10. **Done when:** on the MCP test slice, an uncovered rule is caught, and a rule from another EPIC isn't flagged.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: EPIC-002 Claim approval, with its brief, its Story list and three ready Stories, in `fixtures/expense-claims/`, because the MCP slice's Stories have no grooming or criteria yet: every rule of EPIC-002's features is proved, a rule of another EPIC's feature is never flagged, and a rule no scenario names is caught.

### 32. `stories-workflow`

1. **Label and kind:** Net new. A workflow.
2. **Its one job:** write one EPIC's stories:
   - `route-next-epic.cjs`
   - `route-brief-list.cjs`
   - `epic-author` in brief mode, if the EPIC is listed
   - `story-drafter`
   - `story-groomer`
   - `ac-author`
3. **What exists today:** nothing used.
4. **What it does:**
   - Its steps are exactly the Workflow 4 table in MASTER-PLAN section 4.4.
   - One run covers one EPIC.
   - Each skill runs probing-questions-author (EXTEND 4) and then `grade-questions.cjs` (item 49) inside itself, before its check and its gate, so the workflow gains no steps (your decision of 2026-10-21).
   - **The ready guard:** the stories can't be marked ready while a Must answer question raised while writing them is still open (`decision-review-gates.md`, rule 3; your decision of 2026-10-21).
   - It can start at a named step for named stories, which the change paths need.
5. **Reads / looks up:** nothing itself.
6. **Writes:** nothing itself.
7. **Its gate:** none of its own.
8. **Its check:** none of its own.
9. **On its own:** invoked by name, optionally naming the EPIC.
10. **Done when:** on MCP's EPIC-003, it runs to ready stories with 3 gates, or 4 if the EPIC is listed.
11. **Open points:** none.
12. **Built** 2026-10-22. It holds a copy of the Workflow 4 table, and a Phase 6 test fails if the two differ (a call made while building, listed in MASTER-PLAN section 8). Its runs come in the pass before the trial.

---

## Phase 7: Requirement-update

### 33. The update test

1. **Label and kind:** Net new. A reference file inside `change-impact-author`: `references/update-test.md`.
2. **Its one job:** decide whether a change alters an existing rule, value, limit or wording. (Row 34)
3. **What exists today:** nothing. Feature Fit would call such a change "Fits".
4. **What it contains, as fixed steps:**
   1. Take each noun and limit in the restated change.
   2. Find the FRD rules that name it: every rule whose text or data names the term.
   3. For each rule, compare what the change says with what the rule says. Decide one of:
      - same
      - opposite: the rule says "not" or "only" and the change allows it, or the other way round
      - changed value: a different count, list or limit
      - new
   4. If any rule is opposite or changed value, the kind is **update/optimize**.
   5. If the change only rewords a requirement, with no rule touched, it's **update/optimize, wording only**.
   6. Each rule compared is listed in the report, with its ID and the result.
   - Worked example: "two members may share an email" is **opposite** to the Team & roles rule from Decision 5, so the kind is update/optimize.
5. **Reads / looks up:** the FRDs.
6. **Writes:** nothing itself; `change-impact-author` writes the result.
7. **Its gate:** none.
8. **Its check:** `check-change-report.cjs` checks that every rule compared has a result.
9. **On its own:** used only by `change-impact-author`.
10. **Done when:**
    - on MCP, the shared-email change comes out update/optimize, citing Decision 5's rule
    - the phone-number change comes out extend, with no opposite rule
11. **Open points:** none.
12. **Built** 2026-10-22, as `.claude/skills/change-impact-author/references/update-test.md`. Its worked examples are Expense claims changes, one for each result: same, opposite, changed value, new, and wording only. Section 7 holds the Feature Fit verdict first, then one line per rule compared, with its result, so check-change-report.cjs can read it (a call made while building, listed in MASTER-PLAN section 8).

### 34. `change-impact-author`

1. **Label and kind:** Net new. A skill.
2. **Its one job:** produce the Change impact report and get your decision on it.
3. **What exists today:** nothing writes such a report.
   - The Feature Fit method (`.claude/skills/_shared/glossary/prompts/feature-journey-analysis.md`, copied in Phase 3 from the version you approved, REUSE item 2) gives a verdict against the Glossary.
   - It has no recommendation, no size and no rule test.
   - It's used as the reference for the verdict and the journey. These parts are copied into `references/feature-fit.md`:
     - its procedure (section 5)
     - its match ladder (section 6)
     - its three-lens read, including the movement read from the Glossary's Steps page (section 7)
     - its thresholds (section 8)
     - its determinism rules (section 10)
4. **What it does,** in order:
   1. Writes sections 5 to 10 of the report:
      - restates the change, and splits several asks into several changes, one report each
      - in section 5, lists every agreed word in the Glossary that the change renames, with the word it becomes, or None. `recommend.cjs` reads this list (added on 2026-10-21).
      - places it
      - finds its kind, through Feature Fit first, then the update test
      - draws the journey from the Glossary's Steps page, as Feature Fit does, and places the change on the PRD journey and the FRD flow it touches
      - lists what's reused, what's new and what blocks
      - If blocked, it goes no further. The blocker becomes a question in the Question log, drafted and rated by probing-questions-author (EXTEND 4) and placed by `grade-questions.cjs` (item 49). It is asked in the shape `decision-review-gates.md`, rule 4, gives: the real choices, never yes or no, with "I don't know yet" (your decision of 2026-10-21).
   2. Calls `adversarial-check`. If it fails, it goes back to step 1 with the findings.
   3. Then, in order:
      - calls `find-linked.cjs`
      - runs `feature-impact` once for each linked item, several at once when there are many, and writes their judgements into section 13
      - calls `size-rules.cjs`, then `recommend.cjs`, then `check-change-report.cjs`
   4. **Holds the gate:** "Accept the recommendation, including the size?"
      - yes: writes section 16 and runs `accept.cjs`
      - no: takes your correction, and goes back to step 1
   - These are done before it is called (items 35 and 43, and OPTIMIZE 16):
     - the comparison, when a change brings a new version of a source
     - the glossary check on documents from outside
     - the settling of every mismatched word at `glossary-disposition`'s gate, added on 2026-10-21 following your row 40 call, "agree the word first"
   - It is step 5 of `requirement-update-workflow`.
5. **Reads / looks up:**
   - reads: the files you brought, and the Check findings, already settled at `glossary-disposition`'s gate
   - looks up:
     - the PRD
     - the FRDs
     - the Feature catalog
     - the EPIC register
     - the Glossary
     - the Version log
6. **Writes:**
   - sections 5 to 10, 13 and 16 of the Change impact report
   - when blocked, the blocker's question, in the Question log
7. **Its gate:**
   - "Accept the recommendation, including the size?"
   - When blocked: the blocker's question, in the shape `decision-review-gates.md`, rule 4, gives.
8. **Its check:** `check-change-report.cjs`.
9. **On its own:** invoked with the project and the change. It runs every step above itself and holds its gate, so it works without the workflow.
10. **Done when:** on MCP:
    - the phone-number change gives extend, small, with its path
    - the shared-email change gives update/optimize, citing the rule
    - a net-new change gives its path, including `glossary-author` for new words
    - a change that renames an agreed word lists it in section 5, and its path starts with `glossary-disposition`
11. **Open points:** none. The Glossary keeps its Steps page, so the journey is drawn from it (your decision of 2026-10-19: "b").
12. **Built** 2026-10-22, with `references/update-test.md` and `references/feature-fit.md`, which holds sections 5 to 8 and 10 of the Feature Fit method, word for word, as a Phase 7 test checks. Several asks stay in one report, one ask per row, as the template has it. A late answer is recorded as the report's first decision before the analysis, so the Question log names where it was decided (a call made while building, listed in MASTER-PLAN section 8). Its runs on the test data come in the pass before the trial.

### 35. `compare-versions.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** list every difference between a new and an old version of a source. (Row 43)
3. **What exists today:** nothing.
4. **What it does:**
   - If both versions have requirement IDs, it compares requirement by requirement, and marks each one:
     - added
     - removed
     - changed
   - Otherwise it lists the changed lines.
5. **Reads / looks up:**
   - the new version, among the files you brought
   - the old version, in `sources/`
6. **Writes:** section 3 of the Change impact report.
7. **Its gate:** none.
8. **Its check:** fails with exit code 2 if either version is missing.
9. **On its own:** `node tools/compare-versions.cjs --project <p> --change <nnn> --new <file> --old <file>`
10. **Done when:** on the MCP test slice, a quiet extra edit in the new version is listed.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on two versions of a requirement file written in the test: a quiet edit to REQ-4.1 beside the change is listed, with the requirement added. Without requirement IDs it compares line by line. It reads text files: a Word or PDF file is compared from a text copy beside it (a call made while building, listed in MASTER-PLAN section 8).

### 36. `find-linked.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** list everything linked to the IDs a change lands on.
3. **What exists today:** nothing.
4. **What it does:**
   - Starts from the IDs in section 6 of the report.
   - Follows the Traceability map's links downstream.
   - Lists every item reached, grouped by document.
5. **Reads / looks up:**
   - `traceability-map.json`
   - the Change impact report
6. **Writes:** section 12 of the Change impact report.
7. **Its gate:** none.
8. **Its check:** fails if an ID in section 6 isn't in the map.
9. **On its own:** `node tools/find-linked.cjs --project <p> --change <nnn>`
10. **Done when:** on MCP, REQ-3.1 leads to F-15, the Team & roles FRD and its stories.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping. REQ-3.2 leads to F-05, its pieces, all four of its rules, FRD-3a, EPIC-002, its story and three scenarios: 15 items, grouped by document. Two calls made it whole (a call made while building, listed in MASTER-PLAN section 8): the Traceability map links each feature to its rules, so F-05.4, which no piece names, is reached; and the documents drafted since they were last accepted are followed too, so the stories being written are reached.

### 37. `size-rules.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** give the tentative size of a change, against whatever is in progress. (Row 37)
3. **What exists today:** nothing.
4. **What it does:**
   - **In progress** means the piece whose latest document is drafted but not accepted. It can be:
     - an EPIC
     - an FRD
     - the Feature catalog
     - the EPIC grouping
   - **Large** if any of these is true:
     - a judgement in section 13 moves a feature into or out of the piece in progress
     - the piece is an EPIC and more than one story is judged "new story" or "split"
     - two or more pieces need regrouping
   - **Small** otherwise.
   - **Nothing in progress** means "not sized".
   - It writes the rule that decided the size.
5. **Reads / looks up:**
   - the Change impact report
   - the Story list files
   - the FRD status lines
   - `version-log/log.md`
6. **Writes:** section 14 of the Change impact report.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** `node tools/size-rules.cjs --project <p> --change <nnn>`
10. **Done when:** on MCP, the phone number during EPIC-003 is small, and moving F-15 out of EPIC-003 is large.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping. Change 001 is small against EPIC-002's stories; moving F-05 out of EPIC-002 is large; two of its stories judged New story or Split is large; with nothing in progress it is not sized. A feature moves when its judgement's why starts "moves to", then its EPIC or FRD (a call made while building, listed in MASTER-PLAN section 8).

### 38. `recommend.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** write the recommendation from the kind and the judgements. (Row 35)
3. **What exists today:** nothing.
4. **What it does:**
   - Picks the path for the kind, exactly as in MASTER-PLAN section 4.4, "The kinds of change".
   - For each workflow on the path, lists the starting step and the items to run, taken from the linked items judged "update", "new story" or "split".
   - Lists a story already marked ready as "new story for the difference".
   - Adds "park" when the size is large.
   - When section 5 lists an agreed word the change renames, puts `glossary-disposition` first in the path, before the path's own workflows. Added on 2026-10-21, following your row 40 call, "agree the word first".
   - **Added on 2026-10-21, your decisions on late answers and small updates:**
     - for a late answer whose question has Low impact, or that confirms the answer already in use, it recommends "insert it": `insert-answer.cjs` (item 53), with every place it would change
     - for a change that only rewords a requirement, it recommends `copy-wording.cjs` (item 54), with every place that quotes it
     - otherwise, the path for the kind, which in Extend and Update includes `brd-author` when the BRD holds the changed thing
     - it shows what each document would change, so you can choose at the gate: insert it, or run the path for its kind
   - **Added on 2026-10-22, your decision on a dramatic change:** it counts the business requirements the change reaches, through the linked items in section 12. When that is more than half of the BRD's business requirements, it says "This change reaches most of the business requirements: consider a re-run of the whole workflow", and offers the re-run, from `requirements-workflow` step 1, as one of your choices at the gate. "More than half" is a starting point, and can be changed.
5. **Reads / looks up:**
   - the Change impact report
   - the Question log, for a late answer
6. **Writes:** section 15 of the Change impact report.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** `node tools/recommend.cjs --project <p> --change <nnn>`
10. **Done when:**
    - on MCP, each of the three example changes gets the path its kind calls for
    - a change that renames an agreed word gets `glossary-disposition` first in its path
    - a late answer to a Low impact question gets "insert it", naming every place it would change
    - a change that reaches more than half of the business requirements is flagged, and offers the re-run as a choice
11. **Open points:** none. Decided 2026-10-22: a dramatic change is flagged (my proposal 3).
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping, and on six more changes built in the tests: a renamed agreed word, a Net new change with a new word, an Already covered change, a Blocked one, a late answer to question 7, and a reworded REQ-3.2. Each item judged to change goes to the step that writes it, and a step the path leaves out but an item needs is added, with why; a step of the path with nothing to do is left out, with why. Section 15 ends with your choices at the gate and the one recommended (a call made while building, listed in MASTER-PLAN section 8).

### 39. `check-change-report.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** check the Change impact report before the gate.
3. **What exists today:** nothing.
4. **What it checks:**
   - sections 1 to 15 are present
   - the kind is one of the five
   - every rule the update test compared has a result
   - the challenge passed
   - every linked item has a judgement
   - the size has its rule
   - the recommendation matches the kind's path
   - **Added at the Phase 1 gate:**
     - when every check passes, it prints the three blocks the gate needs, per `decision-review-gates.md` rule 1: "For the person", "One line" and "For the file" (your answer A at the Phase 1 gate, 2026-10-19)
     - it runs `lib/md-lint.cjs` on the document, so nothing in it breaks when it is read
     - it lists every place the document goes beyond or differs from the client's words (`conventions.md`, "Beyond the client's words"): before acceptance in "For the person", and after acceptance as the list for the client (your answer A at the Phase 1 gate, 2026-10-19)
   - **Added on 2026-10-21,** following your row 40 call and your decisions of 2026-10-21:
     - every word found in section 4 says how it was settled
     - section 5's "Agreed words this change renames" is present, and says None when empty
     - when it lists a word, the recommendation starts with `glossary-disposition`
     - a blocker in section 10 names its question in the Question log
     - it runs `grade-questions.cjs` (item 49), and fails on any of its findings, such as:
       - a gap that names no question
       - a question with no rating, or with a part missing, such as its next best action
       - an answer that starts with "Yes" or "No"
     - it never fails because a question is still open
     - "For the person" shows how many questions are open in each group
     - "insert it" is recommended only for a late answer whose question has Low impact or that confirms the answer in use, or for wording only, and names every place it will change
     - when the change reaches more than half of the business requirements, the recommendation flags it and offers the re-run
5. **Reads / looks up:**
   - the Change impact report
   - the Question log
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** lists each failure, with exit code 1.
9. **On its own:** `node tools/check-change-report.cjs --project <p> --change <nnn>`
10. **Done when:** it catches each seeded failure on the MCP test slice.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping, with sixteen failures planted one at a time. Sections 14 and 15 are compared with what size-rules.cjs and recommend.cjs give now, which covers the path, the inserts and the re-run in one comparison (a call made while building, listed in MASTER-PLAN section 8).

### 40. `park.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** mark the piece in progress as parked. (Row 37) It's called in two ways:
   - by the requirement-update workflow, when a change is large
   - from an FRD's gate or an EPIC's gates, when you choose "park it" after the third "no" (EXTEND item 2). No other gate offers it (your answer A at the Phase 1 gate, 2026-10-19).
3. **What exists today:** nothing.
4. **What it does:**
   - For an EPIC: sets "parked" on its Story list status line.
   - For an FRD: sets "parked" on its status line.
   - Adds the change's number and the date.
5. **Reads / looks up:** the Change impact report, or the piece named at the gate.
6. **Writes:** the status line of that Story list or FRD.
7. **Its gate:** none.
8. **Its check:** fails if nothing is in progress.
9. **On its own:** `node tools/park.cjs --project <p> --change <nnn>`
10. **Done when:** after parking, `route-next-epic.cjs` skips the parked EPIC and its dependents.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping. A small change parks nothing; a large one parks EPIC-002's Story list, and route-next-epic.cjs then names EPIC-001 first. At a gate it takes --capability or --epic, and refuses a piece that isn't in progress. The Feature catalog and the EPIC grouping are never parked: the path's own re-run redoes them (a call made while building, listed in MASTER-PLAN section 8).

### 41. `track-change.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** keep each open change's progress up to date.
3. **What exists today:** nothing.
4. **What it does:**
   - For each open change, when the accepted document is one the recommendation named, marks that row accepted in `changes/<nnn>/progress.md`.
   - When every row is accepted, calls `close-change.cjs`.
5. **Reads / looks up:**
   - every open change's recommendation, section 15
   - its `progress.md`
6. **Writes:** `progress.md`, a generated file.
7. **Its gate:** none.
8. **Its check:** none.
9. **On its own:** run by `accept.cjs`, or as `node tools/track-change.cjs --project <p>`.
10. **Done when:** on the MCP test slice, the last acceptance closes the change.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping. Accepting change 001's report starts its progress, six documents with their versions at the start; accepting the last of them closes the change. A Glossary row counts once the gate log gets a new version, so glossary-author and glossary-disposition now run accept.cjs on the gate log when they finish (a call made while building, listed in MASTER-PLAN section 8). accept.cjs runs it at every acceptance, and the Phase 1 test that expected it missing now expects it.

### 42. `close-change.cjs`

1. **Label and kind:** Net new. A program.
2. **Its one job:** write a change's closing entry. (Row 39)
3. **What exists today:** nothing.
4. **What it does:**
   - Appends a closing entry to the decision record of the first document on the change's path.
   - The entry has the change's number, and every place the change was applied, with document and version.
   - Marks `progress.md` closed.
5. **Reads / looks up:**
   - `progress.md`
   - the Change impact report
6. **Writes:**
   - the closing entry
   - the closed mark
7. **Its gate:** none.
8. **Its check:** fails if any row is still pending.
9. **On its own:** `node tools/close-change.cjs --project <p> --change <nnn>`
10. **Done when:** on the MCP test slice, the entry lists every place applied.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping. Change 001's closing entry goes into the BRD's Decision record and lists all six documents, each with its version; it refuses while a row is pending. A change that needed nothing closes in its own report's Decision record (a call made while building, listed in MASTER-PLAN section 8).

### 43. `requirement-update-workflow`

1. **Label and kind:** Net new. A workflow.
2. **Its one job:** take one change to your decision:
   - `compare-versions.cjs`, if a new version of a source is attached
   - `glossary-check`, if documents from outside are attached
   - `glossary-disposition`, if the Check findings hold a mismatch
   - `change-impact-author`
   - `park.cjs`, if large
   - after your decision, for a small update: `insert-answer.cjs` or `copy-wording.cjs`, instead of re-running any workflow
3. **What exists today:** nothing.
4. **What it does:**
   - **Step 1:** writes sections 1 and 2 of a new report in `changes/nnn-<short-name>/` from your statement and your files.
   - **Steps 2 to 6:** runs the pieces above in that order.
   - **Step 4, added on 2026-10-21,** following your row 40 call, "agree the word first": `glossary-disposition` runs only when the Check findings hold a mismatch.
     - Its gate: "How should each mismatched word be settled?", with these answers for each word:
       - fix the document
       - change the Glossary
       - add a new word
     - It writes the Glossary and the gate log, and how each word was settled into section 4 of the report, so `change-impact-author` works with agreed words.
   - `change-impact-author` is step 5, and `park.cjs` is step 6.
   - When a change renames an agreed word, the Extend and Update paths the recommendation names start with `glossary-disposition`, so each of those paths has one more gate.
   - `change-impact-author` runs probing-questions-author (EXTEND 4) and then `grade-questions.cjs` (item 49) inside itself, when a blocker needs a question, so the workflow gains no steps (your decision of 2026-10-21).
   - **Added on 2026-10-21, late answers:** a change can also start from an answer to an open question that arrives after the documents that use it exist. Your statement is the answer and its question's number, and `change-impact-author` starts from what the question says it changes.
   - At the end, it prints the workflows the recommendation names, with their starting steps.
   - It doesn't apply the change; those workflows do. A small update is the exception: when you choose "insert it", `insert-answer.cjs` or `copy-wording.cjs` writes it in place, and nothing is re-run. The change closes through `track-change.cjs`.
5. **Reads / looks up:** your statement and your files.
6. **Writes:** sections 1 and 2 of the report.
7. **Its gate:** none of its own. `glossary-disposition` holds its gate when a word mismatches, and `change-impact-author` holds the decision gate.
8. **Its check:** none of its own.
9. **On its own:** invoked by name with your change.
10. **Done when:** on MCP:
    - the phone-number change ends at your accepted recommendation
    - running the named workflows then closes it
    - a document from outside that uses a word the Glossary doesn't is settled at `glossary-disposition`'s gate before `change-impact-author` runs
    - a late answer to a Low impact question, inserted, fills every place that names its question, and no workflow runs
11. **Open points:** none. Decided 2026-10-21: a late answer comes in as a change (my proposal 2).
12. **Built** 2026-10-22. It holds a copy of the Workflow 5 table, and a Phase 7 test fails if the two differ. The plan's table said step 5 writes sections 4 to 16; section 4 is written at steps 3 and 4, so it now reads 5 to 16 (a call made while building, listed in MASTER-PLAN section 8). Its runs come in the pass before the trial.

### 53. `insert-answer.cjs`

1. **Label and kind:** Net new. A program. Added on 2026-10-21, your rule: a small update is inserted at the right place, and nothing is re-run.
2. **Its one job:** write a late answer into every place the documents name its question, and nothing else.
3. **What exists today:** nothing.
4. **What it does:**
   - Reads the answer from the Question log: the question, under Answered, with its answer and where it was decided.
   - Finds every gap that names the question, such as "TBD, question 7" or "Euros only, Proposed (needs confirmation), question 4", in every document in the project, drafted or accepted. Whatever exists is taken as the latest version.
   - Replaces each one with the answer and its source, such as "10 working days, per change 003, Decision 1". A value the answer confirms keeps its words and loses "Proposed (needs confirmation)".
   - Changes nothing else. When the answer needs any other text changed, it stops and says the change needs the path for its kind instead.
   - Never edits a record, such as the Discovery brief: a record only names the question, and the Question log holds its answer.
   - Runs `accept.cjs` for each accepted document it changed, so each gets a new version. A drafted document keeps the answer in its next draft.
   - Records every place it changed in the change's progress.
5. **Reads / looks up:**
   - the Question log
   - every document in the project
   - the Change impact report
6. **Writes:**
   - the gaps that name the question, in each document
   - the change's progress
7. **Its gate:** none. You chose "insert it" at the recommendation's gate.
8. **Its check:** afterwards, `grade-questions.cjs` finds no gap that still names the answered question.
9. **On its own:** `node tools/insert-answer.cjs --project <p> --change <nnn> --question <n>`
10. **Done when:**
    - on the Expense claims examples, answering question 7 with its targets fills both KPI targets in the BRD, and nothing else changes
    - an accepted BRD gets a new version, and a drafted one keeps its status
    - an answer that would need other text changed is refused, and names the path instead
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims examples: answering question 7 fills both KPI targets in the BRD and the EPIC-002 brief's, and nothing else changes; the accepted BRD gets version 2 and the drafted brief keeps its status; an answer to question 4 that doesn't confirm "Euros only" is refused. The places are found as grade-questions.cjs finds gaps, and a section 16 is read as the report's Decision record, so its options aren't gaps (a call made while building, listed in MASTER-PLAN section 8).

### 54. `copy-wording.cjs`

1. **Label and kind:** Net new. A program. Added on 2026-10-21, as you decided at Old vs New, row 38: a wording-only change copies the new wording to every place it is quoted, and nothing else.
2. **Its one job:** copy a requirement's new wording to every place that quotes it, and nothing else.
3. **What exists today:** nothing.
4. **What it does:**
   - Takes the requirement's ID and its new wording from the Change impact report.
   - Finds every place that quotes the requirement word for word: its row in the PRD, and each FRD that quotes it in its Requirements list.
   - Replaces the old words with the new, in every document that exists, drafted or accepted.
   - Fails when a place quotes the old words differently, so a copy that has already drifted isn't overwritten silently.
   - Runs `accept.cjs` for each accepted document it changed, so each gets a new version.
   - Records every place it changed in the change's progress.
5. **Reads / looks up:**
   - the Change impact report
   - the PRD
   - every FRD
6. **Writes:**
   - the quoted wording, in each document
   - the change's progress
7. **Its gate:** none. You chose it at the recommendation's gate.
8. **Its check:** its own tests.
9. **On its own:** `node tools/copy-wording.cjs --project <p> --change <nnn> --requirement <ID>`
10. **Done when:** on MCP, rewording REQ-3.2 updates its PRD row and the FRD line that quotes it, and nothing else.
11. **Open points:** none.
12. **Built** 2026-10-22, tested on the Expense claims test data: change 001, the finance limit going up from 500 to 1,000, in `fixtures/expense-claims/changes/`, with the documents up to the Claim approval FRD accepted and EPIC-002's stories still being written, because the MCP slice has no BRD, Glossary or EPIC grouping: rewording REQ-3.2 changes its PRD row and the FRD line that quotes it, and nothing else, and both get a new version; a line that quotes it differently is refused.

---

## Phase 8: README

### 44. `specifier_v3/README.md`

1. **Label and kind:** Net new. A document.
2. **Its one job:** tell a specifier how to use v3.
3. **What exists today:** nothing for this design.
4. **What it contains:**
   - what each workflow does
   - how to run each workflow, and each skill on its own
   - how `status.cjs` tells you what's next
   - where documents land
   - how to raise a change
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** a new person runs the MCP test slice from it, without help.
9. **On its own:** not applicable.
10. **Done when:** the full MCP run follows it.
11. **Open points:** none.
12. **Built** 2026-10-22, at the kit's top as `README.md`, titled "Specifier", with every example from Expense claims, and checked in a viewer: its tables and its diagram render. Its check is the pass over the test data, which follows it from the first step.
