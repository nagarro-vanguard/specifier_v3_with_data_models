# Specifier v3: book of knowledge

**Frozen:** this file is a record of the design. It was last changed on 2026-10-27 and is not updated any more. What was actually built, and every change made after the design, is in [build-log.md](../build-log.md).

Everything about Specifier v3 in one place, written like a glossary: the ideas, every document, and every item we build. Each item links to its full spec.

**87 items:**
- 55 Net new
- 25 Optimize
- 4 Extend
- 3 Reuse

**Contents**
1. The ideas
2. The documents
3. Workflows
4. Skills
5. Programs
6. Templates
7. Shared files
8. Other

---

## 1. The ideas

| Term | What it means | Where you meet it |
|---|---|---|
| **the specifiers** | The BA and the PO. The only people in the workflow, and the only ones who decide. | • every gate |
| **a gate** | A decision review gate, or gate for short: the point where a skill shows you its whole draft, asks its questions in order, then asks whether to accept it. Nothing goes on until you answer. | • every skill with a judgement |
| **the third "no"** | After the third "no" at the same gate, the skill stops redrafting and offers:<br>• park it, at an FRD or EPIC gate only<br>• accept it as it is, with your remaining points as rated questions in the Question log<br>• one more round | • every gate |
| **one gate per skill** | Each skill drafts the whole document, runs its check, then holds one gate. The one exception is glossary-author, with Gate 1 and Gate 2. | • every skill |
| **acceptance** | Your "yes" at a gate. It saves a copy in the Version log, saves a copy of the Question log, rebuilds the Traceability map, and updates any open change. | • `accept.cjs` |
| **decision record** | The section in each living document where every question you were asked at its gate, and your answer, is written. Never rewritten. | • every living document |
| **living document** | A document that only changes as a new version, made by its own skill. | • BRD<br>• PRD<br>• Question log<br>• Glossary<br>• Feature catalog<br>• EPIC register<br>• FRD<br>• EPIC brief<br>• Story list<br>• Stories |
| **record** | A document written once. A later change adds an entry; nothing is rewritten. | • Discovery brief<br>• EPIC grouping<br>• gate log<br>• Change impact report<br>• Version log |
| **generated file** | A file a program rebuilds from other documents. Never edited by hand. | • EPIC sequencing<br>• EPIC mapping<br>• decision register<br>• Traceability map |
| **external** | Something that comes from outside the workflow. | • Sources<br>• design<br>• files brought with a change |
| **one home per fact** | Each fact lives in one document. Every other document looks it up by ID. | • every document |
| **agreed words** | The words the Glossary settled. Everything from the Feature catalog on uses them; the BRD and PRD keep the client's own words. | • Glossary<br>• every check from the Feature catalog on |
| **also written as** | The client's own word for an agreed term, kept in the Glossary's section decisions files. | • Glossary |
| **retired word** | A word the Glossary replaced. The check programs flag it outside quoted text. | • `lib/scan-retired-words.cjs` |
| **the journey** | How the work flows, kept at three levels:<br>• the PRD: the end-to-end journey across capabilities<br>• each FRD: the flow inside its capability<br>• the Glossary Steps page: how the steps connect | • PRD<br>• FRD<br>• Glossary |
| **capability** | A group of features that share one FRD, set in the Feature catalog. | • Feature catalog<br>• FRD |
| **"Done when" pieces** | A feature's "Done when" cut into numbered pieces, F-nn.dw1 onward. Each FRD rule points to one piece. | • Feature catalog<br>• FRD |
| **clash** | A feature in an early EPIC that depends on a feature in a later EPIC. Settled at the EPIC grouping gate. | • EPIC grouping |
| **EPIC brief list** | Which EPICs get an EPIC brief, in run order, decided at the EPIC grouping gate. | • EPIC grouping<br>• `route-brief-list.cjs` |
| **run order** | The order the EPICs are worked in, from the EPIC register. | • EPIC register<br>• the routes |
| **a piece in progress** | Whatever is drafted but not yet accepted, one of:<br>• an EPIC<br>• an FRD<br>• the Feature catalog<br>• the EPIC grouping | • `size-rules.cjs` |
| **parked** | A piece moved to the back of the queue because a large change hit it. Anything depending on it waits too. | • `park.cjs`<br>• the routes |
| **a change** | A requirement-update: anything that changes an approved document. It can come from:<br>• the client<br>• you<br>• a step that found a mistake | • `requirement-update-workflow` |
| **kind of change** | One of these:<br>• net new<br>• extend/enhance<br>• update/optimize<br>• already covered<br>• blocked<br>The kind sets the path. | • Change impact report |
| **size of a change** | Small: folded into the piece in progress. Large: that piece is parked. | • `size-rules.cjs` |
| **the path** | The workflows and steps a change re-runs, set by its kind. | • `recommend.cjs` |
| **the Question log** | The one place every question in a project lives, whichever document raised it. Each document names the question behind each of its gaps, such as "TBD, question 12". | • every document with a gap<br>• every gate<br>• `status.cjs` |
| **impact and severity** | How each question is rated. Impact measures rework: how much is redone if the answer is wrong. Severity measures harm: how much harm is done if work goes ahead on a wrong answer. | • Question log |
| **Must answer, Should answer and Can move ahead** | The three groups a question is placed in, from its severity and impact:<br>• Must answer: any High severity; asked first, one at a time<br>• Should answer: asked next, one at a time<br>• Can move ahead: settled together, as one list | • Question log<br>• every gate<br>• `grade-questions.cjs` |
| **the Must answer guard** | A Must answer question is answered before an FRD that builds on it is accepted, and before the stories it was raised in are marked ready. | • `check-frd.cjs`<br>• `check-stories.cjs`<br>• `status.cjs` |
| **"I don't know yet"** | An answer offered with every question. The recommended answer is used, marked Proposed, and the question stays open in the Question log. | • every gate<br>• decision record |
| **running on its own** | Any skill can be called without its workflow and behaves the same: it finds its inputs, checks, holds its gate and records. | • every skill |
| **Net new, Optimize, Extend, Reuse** | The four labels for build work:<br>• Net new: nothing does it today<br>• Optimize: existing, changed<br>• Extend: existing, only added to<br>• Reuse: existing, copied unchanged | • the specs |

---

## 2. The documents

| Document | What it holds | Kind | Written by | Read by | Looked up by ID by |
|---|---|---|---|---|---|
| **Sources** | • the client's documents and notes, or an idea | external | you | • `discovery-author`<br>• `brd-author`<br>• `prd-author`<br>• `compare-versions.cjs` | • nobody |
| **Files brought with a change** | • anything that backs up a change, including documents from outside | external | you | • `change-impact-author`<br>• `glossary-check`<br>• `compare-versions.cjs`<br>• `prd-author`, in a change | • nobody |
| **Discovery brief** | • the sources and the order of authority<br>• every topic compared<br>• clashes<br>• what's assumed<br>• risks<br>• your decisions | record | `discovery-author` | • `brd-author`<br>• `prd-author` | • nobody |
| **BRD** | • why the product is needed<br>• objectives and KPIs<br>• scope<br>• business requirements<br>• risks<br>• release criteria | living | `brd-author` | • `prd-author`<br>• `glossary-author` | • `feature-author`<br>• `epic-author`, for a detail<br>• `story-drafter`<br>• `story-groomer` |
| **PRD** | • what was asked, word for word with sources<br>• personas<br>• the end-to-end journey<br>• NFRs<br>• transition requirements | living | `prd-author` | • `glossary-author`<br>• `feature-author` | • `frd-author`<br>• `epic-author`, for a detail<br>• `story-drafter`<br>• `change-impact-author`<br>• `adversarial-check` |
| **Question log** | • every question in the project<br>• its impact and severity<br>• its group and order<br>• its answer, once given | living | • `probing-questions-author`<br>• `grade-questions.cjs`, for the order | • every gate<br>• `status.cjs`<br>• `check-frd.cjs`<br>• `check-stories.cjs`<br>• `change-impact-author` | • every document with a gap, by question number |
| **Glossary gate log** | • every glossary decision<br>• the only glossary record | record | • `glossary-author`<br>• `glossary-disposition` | • `build-glossary-records.cjs`<br>• `fill-also-written-as.cjs`<br>• `build-retired-words-tables.cjs` | • nobody |
| **Glossary** | • the agreed terms, by kind<br>• how they relate<br>• the retired words | living | • `glossary-author`<br>• `glossary-disposition`<br>• `build-retired-words-tables.cjs`, for the retired-words tables | • `glossary-check` | • `feature-author`<br>• `frd-author`<br>• the story skills<br>• every check from the Feature catalog on<br>• `change-impact-author`<br>• `adversarial-check` |
| **Decision register and section decisions** | • each settled glossary decision<br>• each section's words mapped to the agreed ones | generated | `build-glossary-records.cjs` | • you, for reference | • nobody |
| **Feature catalog** | • features<br>• each with its description, "Done when" pieces, capability and priority | living | `feature-author` | • `epic-grouping-author`<br>• `frd-author` | • `epic-author`<br>• `story-groomer`<br>• `change-impact-author`<br>• `feature-impact` |
| **EPIC grouping** | • the options<br>• the pick<br>• clashes settled<br>• the EPIC brief list | record | `epic-grouping-author` | • `epic-author`<br>• `build-sequencing-mapping.cjs`<br>• `route-brief-list.cjs` | • nobody |
| **EPIC register** | • one row per EPIC, copied from the pick, and the run order | living | `epic-author` | • the routes<br>• `story-drafter`<br>• `coverage-check.cjs`<br>• `build-sequencing-mapping.cjs` | • `change-impact-author` |
| **EPIC sequencing** | • the build order<br>• which EPICs run side by side<br>• the critical path | generated | `build-sequencing-mapping.cjs` | • you, for reference | • nobody |
| **EPIC mapping** | • each EPIC's band and features, and the coverage count | generated | `build-sequencing-mapping.cjs` | • you, for reference | • nobody |
| **FRD** | • one capability's rules, flow and data<br>• its decisions<br>• its status | living | `frd-author` | • `story-drafter`<br>• `coverage-check.cjs` | • `story-groomer`<br>• `ac-author`<br>• `change-impact-author`<br>• `adversarial-check`<br>• `feature-impact` |
| **Design** | • screens or flows, if they exist | external | you | • `story-drafter` | • nobody |
| **EPIC brief** | • description<br>• value<br>• fitness criteria<br>• scope<br>• features<br>• dependencies<br>• the NFR IDs that apply | living | `epic-author` | • nobody | • `story-groomer` |
| **Story list** | • an EPIC's stories in order, with their status | living | • `story-drafter`<br>• `ac-author`, for the ready marks<br>• `park.cjs` | • `story-groomer`<br>• `route-next-epic.cjs`<br>• `size-rules.cjs` | • `feature-impact` |
| **Stories** | • its statement<br>• its scope<br>• rules quoted from the FRD<br>• the FRD flow steps it covers<br>• acceptance criteria | living | • `story-drafter`<br>• `story-groomer`<br>• `ac-author` | • `story-groomer`<br>• `ac-author`<br>• `coverage-check.cjs` | • `feature-impact` |
| **Change impact report** | • what the change is<br>• its kind<br>• the journey<br>• linked items<br>• the size<br>• the recommendation<br>• your decision | record | • the workflow's first step<br>• `compare-versions.cjs`<br>• `change-impact-author`<br>• the steps it runs | • you, at the gate<br>• the skills the path re-runs<br>• `park.cjs`<br>• `track-change.cjs` | • nobody |
| **Check findings** | • the words in a document from outside that don't match the Glossary | record | `glossary-check` | • `glossary-disposition`<br>• `change-impact-author`<br>• you | • nobody |
| **Decision record** | • every question asked at a gate, and your answer, including "I don't know yet"<br>• a change's closing entry | record | • every skill with a gate<br>• `close-change.cjs` | • you | • nobody |
| **Version log** | • a copy of each document every time it is accepted, and of the Question log as it stood | record | `version-log.cjs` | • `status.cjs`<br>• `size-rules.cjs` | • `change-impact-author`<br>• `feature-impact` |
| **Traceability map** | • every ID and what it links to, from requirement to story | generated | `traceability-map.cjs` | • `find-linked.cjs` | • nobody |

---

## 3. Workflows (5)

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| `requirements-workflow` | Connects discovery-author, brd-author and prd-author for one product. | • Sources | • Discovery brief<br>• BRD<br>• PRD | • the first workflow<br>• run again from step 1 after a dramatic change<br>• comes before `glossary-author` | the skills' own: 3 | Net new<br>phase 2<br>[NET-NEW 17](net-new.md) |
| `features-and-epics-workflow` | Connects feature-author, epic-grouping-author and epic-author, then checks the register and builds sequencing and mapping. | • PRD<br>• Glossary | • Feature catalog<br>• EPIC grouping<br>• EPIC register<br>• EPIC sequencing<br>• EPIC mapping | • comes after `glossary-author`<br>• comes before `frd-workflow` | the skills' own: 2 | Net new<br>phase 4<br>[NET-NEW 24](net-new.md) |
| `frd-workflow` | Writes one FRD per run: it picks the next capability, then runs frd-author. | • Feature catalog<br>• EPIC register | • one FRD | • comes after `features-and-epics-workflow`<br>• run again until every FRD is accepted<br>• comes before `stories-workflow` | frd-author's: 1 | Net new<br>phase 5<br>[NET-NEW 26](net-new.md) |
| `stories-workflow` | Takes one EPIC from its brief to ready stories. | • EPIC register<br>• FRDs<br>• EPIC grouping | • EPIC brief, if listed<br>• Story list<br>• Stories, ready | • comes after every FRD is accepted<br>• run again for each EPIC | the skills' own: 3, or 4 with a brief | Net new<br>phase 6<br>[NET-NEW 32](net-new.md) |
| `requirement-update-workflow` | Takes one change to your decision. The workflows it names then apply the change. | • your statement<br>• the files you bring | • Change impact report<br>• the parking, if the change is large | • runs at any time<br>• after it, you run the workflows the recommendation names | change-impact-author's: 1<br>glossary-disposition's too, when a word must be settled | Net new<br>phase 7<br>[NET-NEW 43](net-new.md) |

---

## 4. Skills (17)

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| `discovery-author` | The skill that starts every product. It lists the sources, settles which one wins when they disagree, compares every topic, and sends what is missing to the Question log. | • Sources | • Discovery brief<br>• Question log | • first step of `requirements-workflow`<br>• comes before `brd-author` | Accept the Discovery brief? | Optimize<br>phase 2<br>[OPTIMIZE 12](optimize.md) |
| `brd-author` | Writes the BRD: why the product is needed, its objectives, scope and business requirements. When nothing gives an objective or business requirement, it suggests one, marked Proposed. | • Sources<br>• Discovery brief<br>• in a change: the Change impact report | • BRD<br>• Question log | • comes after `discovery-author`<br>• comes before `prd-author` | Accept the BRD? | Optimize<br>phase 2<br>[OPTIMIZE 13](optimize.md) |
| `prd-author` | Records what the client asked for, word for word, each with its source. It also holds:<br>• the personas<br>• the end-to-end journey<br>• the NFRs<br>• the transition requirements | • Sources<br>• Discovery brief<br>• BRD<br>• in a change: the Change impact report and your files | • PRD<br>• Question log | • comes after `brd-author`<br>• comes before `glossary-author` | Accept the PRD? | Optimize<br>phase 2<br>[OPTIMIZE 14](optimize.md) |
| `glossary-author` | Agrees the words the product uses and their definitions, or adds only the new words a change brings. | • BRD<br>• PRD<br>• in a change: the Change impact report | • Glossary<br>• Glossary gate log | • comes after `prd-author`<br>• comes before `feature-author`<br>• runs `fill-also-written-as.cjs` before Gate 2<br>• `build-glossary-records.cjs` and `build-retired-words-tables.cjs` run after it | Gate 1: are the words settled?<br>Gate 2: are the definitions settled? | Optimize<br>phase 3<br>[OPTIMIZE 15](optimize.md) |
| `glossary-check` | Reads a document brought in from outside and lists where its words don't match the Glossary. | • a document you brought<br>• Glossary, looked up | • Check findings | • step 3 of `requirement-update-workflow`<br>• comes before `glossary-disposition` when there is a mismatch<br>• otherwise comes before `change-impact-author` | none | Reuse<br>phase 3<br>[REUSE 1](reuse.md) |
| `glossary-disposition` | Settles a glossary mismatch: fix the document, change the Glossary, or add a new word. | • Check findings, or a word to change<br>• Glossary | • Glossary<br>• Glossary gate log | • step 4 of `requirement-update-workflow`, only when the Check findings hold a mismatch<br>• first in the Extend and Update paths when a change renames an agreed word<br>• runs on its own when you give it a word to change<br>• `build-glossary-records.cjs` and `build-retired-words-tables.cjs` run after it | How should each mismatched word be settled? | Optimize<br>phase 3<br>[OPTIMIZE 16](optimize.md) |
| `feature-author` | Turns the PRD's requirements into features. Each feature gets:<br>• a priority<br>• a capability, which says which FRD it goes in<br>• its "Done when", cut into pieces | • PRD<br>• Glossary, looked up<br>• BRD, looked up | • Feature catalog<br>• Question log | • first step of `features-and-epics-workflow`<br>• comes after `glossary-author`<br>• comes before `epic-grouping-author` | Accept the Feature catalog? | Optimize<br>phase 4<br>[OPTIMIZE 18](optimize.md) |
| `epic-grouping-author` | Offers 2 to 3 ways to group the features into EPICs, settles any clashes, and proposes which EPICs get an EPIC brief. | • Feature catalog | • EPIC grouping<br>• Question log | • comes after `feature-author`<br>• comes before `epic-author` | Pick a grouping, settle its clashes, confirm the EPIC brief list | Optimize<br>phase 4<br>[OPTIMIZE 19](optimize.md) |
| `epic-author` | Copies the chosen grouping into the EPIC register, and writes an EPIC brief for each EPIC on the list. | • EPIC grouping, for the register<br>• EPIC register, BRD, PRD and Feature catalog, for a brief | • EPIC register<br>• EPIC brief<br>• Question log, for a brief | • register mode: comes after `epic-grouping-author`, checked by `check-register.cjs`<br>• brief mode: the first story step of a listed EPIC, before `story-drafter` | register mode: none<br>brief mode: Accept the EPIC brief? | Optimize<br>phase 4 and 6<br>[OPTIMIZE 20](optimize.md) |
| `frd-author` | Writes one FRD, whole, for one capability: everything the stories will need about its rules, flow and data. | • Feature catalog<br>• PRD, looked up<br>• Glossary, looked up<br>• Question log, looked up | • FRD<br>• Question log | • comes after `route-next-capability.cjs`<br>• every FRD comes before any story | Accept the FRD? The Must answer questions it builds on come first, one at a time. While one is open, it can't be accepted: answer it, or park the FRD. | Optimize<br>phase 5<br>[OPTIMIZE 21](optimize.md) |
| `story-drafter` | Splits one EPIC into stories along the FRD flows, and sets their order. | • the EPIC's Register row<br>• FRDs<br>• design, if any<br>• Glossary, looked up<br>• BRD, looked up<br>• PRD, looked up | • Story list<br>• story shells<br>• Question log | • comes after the EPIC brief, or the brief-list route<br>• comes before `story-groomer` | Approve the split? All stories together. | Optimize<br>phase 6<br>[OPTIMIZE 23](optimize.md) |
| `story-groomer` | Fills each story of the EPIC from documents already decided:<br>• its scope<br>• the rules, quoted from the FRD<br>• the FRD flow steps it covers | • Story list<br>• story shells<br>• FRDs, looked up<br>• Feature catalog, looked up<br>• BRD, looked up<br>• EPIC brief, looked up<br>• Glossary, looked up | • Stories, groomed<br>• Question log | • comes after `story-drafter`<br>• comes before `ac-author` | Accept the grooming? All stories together. | Optimize<br>phase 6<br>[OPTIMIZE 24](optimize.md) |
| `ac-author` | Writes behaviour-only acceptance criteria, each naming the FRD rules it proves, and marks the stories ready. | • Stories<br>• FRDs, looked up<br>• Glossary, looked up | • Stories, with acceptance criteria<br>• ready marks in the Story list<br>• Question log | • comes after `story-groomer`<br>• `coverage-check.cjs` runs before its gate<br>• the last step of an EPIC | Accept the criteria? This marks the stories ready. While a Must answer question raised in them is open, they can't be. | Optimize<br>phase 6<br>[OPTIMIZE 25](optimize.md) |
| `change-impact-author` | Works out what a change is, how big it is and what to re-run, and asks for your decision. | • the files you brought<br>• Check findings, settled<br>• PRD, looked up<br>• FRDs, looked up<br>• Feature catalog, looked up<br>• EPIC register, looked up<br>• Glossary, looked up<br>• Version log, looked up<br>• Traceability map, looked up | • Change impact report<br>• Question log, when it is blocked | • step 5 of `requirement-update-workflow`<br>• runs inside itself, in order:<br>&nbsp;&nbsp;`adversarial-check`<br>&nbsp;&nbsp;`find-linked.cjs`<br>&nbsp;&nbsp;`feature-impact`<br>&nbsp;&nbsp;`size-rules.cjs`<br>&nbsp;&nbsp;`recommend.cjs`<br>• comes before `park.cjs` | Accept the recommendation, including the size? | Net new<br>phase 7<br>[NET-NEW 34](net-new.md) |
| `adversarial-check` | Challenges a change's verdict. It looks for:<br>• reuse that is overclaimed<br>• gaps that were missed<br>• a verdict that is too soft | • Change impact report<br>• Glossary, looked up<br>• PRD, looked up<br>• FRDs, looked up | • its findings, in the report | • called by `change-impact-author` after its analysis<br>• a fail sends the report back | none | Extend<br>phase 7<br>[EXTEND 3](extend.md) |
| `feature-impact` | Judges one linked item for a change: is it hit, how badly, and what exactly changes. Renamed from change-impact. | • the change<br>• one linked item | • one judgement, in the report | • called by `change-impact-author` once per linked item | none when called; its own when run alone | Reuse<br>phase 7<br>[REUSE 3](reuse.md) |
| `probing-questions-author` | Turns each gap in a draft into a question, and rates its impact and severity. Every skill that writes a document runs it inside itself. | • the draft the calling skill just wrote<br>• Question log, looked up<br>• its question bank, looked up | • new questions, in the Question log | • runs inside every skill that writes a document, after it drafts<br>• comes before `grade-questions.cjs` | none: its questions are asked at the calling skill's gate | Extend<br>phase 2<br>[EXTEND 4](extend.md) |

---

## 5. Programs (39)

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| `lib/run-paths.cjs` | Finds where any document of a run lives. | • `project-folders.md` | • a file path | • used by every program and skill | none | Net new<br>phase 1<br>[NET-NEW 6](net-new.md) |
| `lib/md-tables.cjs` | Reads the table under a heading into rows. | • any document | • rows | • used by the check programs | none | Net new<br>phase 1<br>[NET-NEW 7](net-new.md) |
| `version-log.cjs` | Saves a numbered copy of a document when you accept it. | • the accepted document | • Version log entry and copy | • run by `accept.cjs` | none | Net new<br>phase 1<br>[NET-NEW 8](net-new.md) |
| `traceability-map.cjs` | Rebuilds the links from requirement to feature to EPIC to FRD rule to story. | • the accepted documents | • Traceability map | • run by `accept.cjs`<br>• read by `find-linked.cjs` | none | Net new<br>phase 1<br>[NET-NEW 9](net-new.md) |
| `accept.cjs` | Runs the four things that happen at every acceptance, in order. | • the accepted document's name | • runs `version-log.cjs` for the document, then for the Question log, then `traceability-map.cjs`, then `track-change.cjs` | • after every "yes" at a gate | none | Net new<br>phase 1<br>[NET-NEW 10](net-new.md) |
| `scaffold-project.cjs` | Checks that a project's folders exist, and creates any that are missing. It never deletes or overwrites anything, and leaves a folder that holds older work alone. | • the project name<br>• project-folders.md | • the project's folders | • the first thing every workflow runs<br>• run by every skill on its own, before it writes | none | Net new<br>phase 1<br>[NET-NEW 45](net-new.md) |
| `lib/md-lint.cjs` | Finds markdown that won't read correctly in a viewer: broken table rows, hidden text, broken links and diagrams that won't draw. | • a document's text | • each problem, with its line number | • run by every check program<br>• run by the Phase 1 tests on every kit document | none | Net new<br>phase 1<br>[NET-NEW 46](net-new.md) |
| `grade-questions.cjs` | Places each question in the Question log in its group by the grid, sets the order, checks each question's shape, and finds gaps that name no question. Open questions never fail it. | • Question log<br>• the grid, from its template<br>• the project's documents | • the questions in order<br>• the count in each group<br>• pass, or the problems found | • run by every skill that writes a document, after `probing-questions-author`<br>• run by every check program<br>• run by `status.cjs`, to list the Must answer questions | none | Net new<br>phase 1<br>[NET-NEW 49](net-new.md) |
| `list-sources.cjs` | Lists every file in a project's sources folder, marks the ones that are the same as another, or an older version of another, and names files that differ only by a date for discovery-author to judge. | • the files in sources/ | • the Discovery brief's list of sources<br>• the sets of dated files to judge | • run by `discovery-author`, first | none | Net new<br>phase 2<br>[NET-NEW 47](net-new.md) |
| `status.cjs` | Says what's done, what's parked, which Must answer questions are open, and what to run next. | • Version log<br>• Story lists<br>• FRD status lines<br>• change progress<br>• Question log | • a status list, with the Must answer questions still open, ending with "Next:" | • run any time | none | Net new<br>phase 1<br>[NET-NEW 11](net-new.md) |
| `check-discovery-brief.cjs` | Checks the Discovery brief. | • Discovery brief<br>• Question log | • pass, or the problems found | • before `discovery-author`'s gate | none | Net new<br>phase 2<br>[NET-NEW 14](net-new.md) |
| `check-brd.cjs` | Checks the BRD. | • BRD<br>• Question log | • pass, or the problems found | • before `brd-author`'s gate | none | Net new<br>phase 2<br>[NET-NEW 15](net-new.md) |
| `check-prd.cjs` | Checks the PRD, including that every requirement has its source. | • PRD<br>• BRD<br>• Question log | • pass, or the problems found | • before `prd-author`'s gate | none | Net new<br>phase 2<br>[NET-NEW 16](net-new.md) |
| `lib/scan-retired-words.cjs` | Finds retired glossary words used outside quoted text. | • Glossary<br>• the document being checked | • each retired word found, with the word to use now | • used by every check from the Feature catalog on | none | Net new<br>phase 3<br>[NET-NEW 18](net-new.md) |
| `build-glossary-records.cjs` | Builds the decision register and the section decisions from the gate log. | • Glossary gate log | • Decision register<br>• Section decisions | • runs after `glossary-author` and `glossary-disposition` | none | Net new<br>phase 3<br>[NET-NEW 19](net-new.md) |
| `fill-also-written-as.cjs` | Fills each Gate 2 row's "Also written as" from the settled Gate 1 rows, before Gate 2 is shown. | • Glossary gate log | • the "Also written as" column at Gate 2 | • run by `glossary-author`, before Gate 2 | none | Net new<br>phase 3<br>[NET-NEW 51](net-new.md) |
| `build-retired-words-tables.cjs` | Writes the "Terms replaced or retired over time" table on each kind page from the gate log. | • Glossary gate log<br>• the four kind pages | • one retired-words table per kind page | • runs after `glossary-author` and `glossary-disposition`<br>• read by `lib/scan-retired-words.cjs` | none | Net new<br>phase 3<br>[NET-NEW 52](net-new.md) |
| `check-features.cjs` | Checks the Feature catalog:<br>• every requirement covered<br>• every feature has a capability and its pieces<br>• no retired words | • Feature catalog<br>• PRD<br>• Glossary<br>• Question log | • pass, or the problems found | • before `feature-author`'s gate | none | Net new<br>phase 4<br>[NET-NEW 20](net-new.md) |
| `check-epic-grouping.cjs` | Checks the EPIC grouping:<br>• every feature placed once<br>• clashes settled<br>• the brief list present | • EPIC grouping<br>• Feature catalog<br>• Question log | • pass, or the problems found | • before `epic-grouping-author`'s gate | none | Net new<br>phase 4<br>[NET-NEW 21](net-new.md) |
| `check-register.cjs` | Proves the EPIC register is an exact copy of the pick. A pass counts as acceptance. | • EPIC register<br>• EPIC grouping | • pass, or each mismatch | • comes after `epic-author`, register mode<br>• comes before `build-sequencing-mapping.cjs` | none | Net new<br>phase 4<br>[NET-NEW 22](net-new.md) |
| `build-sequencing-mapping.cjs` | Builds EPIC sequencing and EPIC mapping by rearranging the register. | • EPIC register<br>• EPIC grouping<br>• Feature catalog | • EPIC sequencing<br>• EPIC mapping | • the last step of `features-and-epics-workflow` | none | Net new<br>phase 4<br>[NET-NEW 23](net-new.md) |
| `route-next-capability.cjs` | Names the next FRD to write, in Register order, with any waiting on a Must answer question, then parked ones, last. | • Feature catalog<br>• EPIC register<br>• FRD status lines<br>• Question log | • the next capability | • the first step of `frd-workflow` | none | Net new<br>phase 5<br>[NET-NEW 25](net-new.md) |
| `check-frd.cjs` | Checks an FRD, including that its features and pieces match the Feature catalog, and that no Must answer question it builds on is open at acceptance. | • FRD<br>• Feature catalog<br>• PRD<br>• Question log | • pass, or the problems found | • before `frd-author`'s gate | none | Optimize<br>phase 5<br>[OPTIMIZE 22](optimize.md) |
| `route-next-epic.cjs` | Names the next EPIC, skipping any that wait on a parked one or on a Must answer question. | • EPIC register<br>• Story lists<br>• Question log | • the next EPIC | • the first step of `stories-workflow` | none | Net new<br>phase 6<br>[NET-NEW 27](net-new.md) |
| `route-brief-list.cjs` | Says whether an EPIC gets an EPIC brief. | • EPIC grouping | • yes or no | • the second step of `stories-workflow` | none | Net new<br>phase 6<br>[NET-NEW 28](net-new.md) |
| `check-epic-brief.cjs` | Checks an EPIC brief, including that it lists only NFR IDs from the PRD. | • EPIC brief<br>• EPIC register<br>• PRD<br>• Glossary<br>• Question log | • pass, or the problems found | • before `epic-author`'s brief gate | none | Net new<br>phase 6<br>[NET-NEW 29](net-new.md) |
| `check-stories.cjs` | Checks an EPIC's Story list and Stories at each stage, and that no story is marked ready while a Must answer question raised in it is open. | • Story list<br>• Stories<br>• Feature catalog<br>• FRDs<br>• Glossary<br>• Question log | • pass, or the problems found | • before each story skill's gate | none | Net new<br>phase 6<br>[NET-NEW 30](net-new.md) |
| `coverage-check.cjs` | Proves every rule of the EPIC's features is named by at least one scenario. | • EPIC register<br>• FRDs<br>• Stories | • pass, or each uncovered rule | • before `ac-author`'s gate | none | Net new<br>phase 6<br>[NET-NEW 31](net-new.md) |
| `compare-versions.cjs` | Lists every difference between a new and an old version of a source. | • the new version you brought<br>• the old version in Sources | • the differences, in the report | • step 2 of `requirement-update-workflow`, only when a new version is attached | none | Net new<br>phase 7<br>[NET-NEW 35](net-new.md) |
| `find-linked.cjs` | Lists everything linked to what a change touches. | • Traceability map<br>• Change impact report | • the linked items, in the report | • run by `change-impact-author` | none | Net new<br>phase 7<br>[NET-NEW 36](net-new.md) |
| `size-rules.cjs` | Sizes a change as small or large, against whatever is in progress. | • Change impact report<br>• Story lists<br>• FRD status lines<br>• Version log | • the tentative size, in the report | • run by `change-impact-author`, after `feature-impact` | none | Net new<br>phase 7<br>[NET-NEW 37](net-new.md) |
| `recommend.cjs` | Writes the path a change should take, from its kind and the judgements: "insert it" for a small update, and a re-run offered when it reaches most business requirements. | • Change impact report<br>• Question log | • the recommendation, in the report | • run by `change-impact-author`, after `size-rules.cjs` | none | Net new<br>phase 7<br>[NET-NEW 38](net-new.md) |
| `check-change-report.cjs` | Checks the Change impact report. | • Change impact report<br>• Question log | • pass, or the problems found | • before `change-impact-author`'s gate | none | Net new<br>phase 7<br>[NET-NEW 39](net-new.md) |
| `park.cjs` | Marks the piece in progress as parked, at the back of the queue. | • Change impact report | • "parked" on a Story list or FRD | • the last step of `requirement-update-workflow`, only when large<br>• from an FRD or EPIC gate, when you choose to park after the third "no" | none | Net new<br>phase 7<br>[NET-NEW 40](net-new.md) |
| `track-change.cjs` | Keeps each open change's progress up to date. | • each open change's recommendation and progress | • the change's progress file | • run by `accept.cjs`<br>• calls `close-change.cjs` when a change is complete | none | Net new<br>phase 7<br>[NET-NEW 41](net-new.md) |
| `insert-answer.cjs` | Writes a late answer into every place the documents name its question, and nothing else. | • Question log<br>• every document<br>• Change impact report | • the answer, in place<br>• the change's progress | • runs when you choose "insert it" at the recommendation's gate | none | Net new<br>phase 7<br>[NET-NEW 53](net-new.md) |
| `copy-wording.cjs` | Copies a requirement's new wording to every place that quotes it, and nothing else. | • Change impact report<br>• PRD<br>• FRDs | • the new wording, in place<br>• the change's progress | • runs when you choose it at the recommendation's gate, for a wording-only change | none | Net new<br>phase 7<br>[NET-NEW 54](net-new.md) |
| `lib/check-document.cjs` | The checks every document shares, and the three blocks printed at its gate, written once for every check program. | • a document<br>• its template<br>• Question log | • each problem found<br>• the three blocks for the gate | • used by every check program, from `check-discovery-brief.cjs` on | none | Net new<br>phase 2<br>[NET-NEW 55](net-new.md) |
| `close-change.cjs` | Writes a change's closing entry, listing every place it was applied. | • the change's progress<br>• Change impact report | • the closing entry, in a decision record | • run by `track-change.cjs` | none | Net new<br>phase 7<br>[NET-NEW 42](net-new.md) |

---

## 6. Templates (15)

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| Discovery brief | The shape of the Discovery brief:<br>• the sources and the order of authority<br>• every topic compared<br>• clashes<br>• what is assumed<br>• risks<br>• your decisions<br>Its questions are in the Question log. | • none | • the Discovery brief's sections | • filled by `discovery-author`<br>• checked by `check-discovery-brief.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 2](optimize.md) |
| BRD | The shape of the BRD, without a journey or NFRs. | • none | • the BRD's sections | • filled by `brd-author`<br>• checked by `check-brd.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 3](optimize.md) |
| PRD | The shape of the PRD:<br>• requirements, word for word, with sources<br>• personas<br>• the journey<br>• NFRs<br>• transition requirements | • none | • the PRD's sections | • filled by `prd-author`<br>• checked by `check-prd.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 4](optimize.md) |
| Feature catalog | The shape of the Feature catalog, with capabilities and "Done when" pieces. | • none | • the catalog's sections and columns | • filled by `feature-author`<br>• checked by `check-features.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 5](optimize.md) |
| EPIC grouping | The shape of the EPIC grouping:<br>• the options<br>• the pick<br>• clashes settled<br>• the EPIC brief list | • none | • the EPIC grouping's sections | • filled by `epic-grouping-author`<br>• checked by `check-epic-grouping.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 6](optimize.md) |
| EPIC register | The shape of the EPIC register: one row per EPIC, and the run order. | • none | • the register's table | • filled by `epic-author`<br>• checked by `check-register.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 7](optimize.md) |
| EPIC brief | The shape of an EPIC brief, with the NFR IDs that apply. | • none | • the detail's eight sections | • filled by `epic-author`<br>• checked by `check-epic-brief.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 8](optimize.md) |
| FRD | The shape of an FRD: its rules, flow and data for one capability, with its decisions and status. | • none | • the FRD's sections | • filled by `frd-author`<br>• checked by `check-frd.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 9](optimize.md) |
| Story list | The shape of an EPIC's Story list: its stories in order, with their status. | • none | • the list's sections | • filled by the story skills<br>• checked by `check-stories.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 10](optimize.md) |
| Story | The shape of one story: the statement, grooming, and behaviour-only acceptance criteria. | • none | • the Story's sections | • filled by the story skills<br>• checked by `check-stories.cjs` | none | Optimize<br>phase 1<br>[OPTIMIZE 11](optimize.md) |
| decision record | The shape of a decision record: each question asked at a gate, the options, and your answer, including "I don't know yet". | • none | • one numbered entry per decision | • filled by every skill with a gate, and by `close-change.cjs` | none | Extend<br>phase 1<br>[EXTEND 1](extend.md) |
| Version log entry | The shape of one line in the Version log. | • none | • one row per accepted version | • filled by `version-log.cjs` | none | Net new<br>phase 1<br>[NET-NEW 3](net-new.md) |
| Traceability map | The shape of the Traceability map: every ID and its links. | • none | • items and links | • filled by `traceability-map.cjs`<br>• read by `find-linked.cjs` | none | Net new<br>phase 1<br>[NET-NEW 4](net-new.md) |
| Question log | The shape of the Question log: the impact and severity tables, the grid, and the four groups. The grid lives only here. | • none | • the log's sections<br>• one block per question | • filled by `probing-questions-author`<br>• ordered and checked by `grade-questions.cjs` | none | Net new<br>phase 1<br>[NET-NEW 50](net-new.md) |
| Change impact report | The shape of the Change impact report: 16 sections, each with one writer. | • none | • the report's sections | • filled during `requirement-update-workflow`<br>• checked by `check-change-report.cjs` | none | Net new<br>phase 1<br>[NET-NEW 5](net-new.md) |

---

## 7. Shared files (6)

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| `conventions.md` | The rules every skill follows, in one place. | • none | • the rules | • read by every skill | none | Net new<br>phase 1<br>[NET-NEW 1](net-new.md) |
| `project-folders.md` | Where every document of a run lives. | • none | • the folder of each document | • read by `lib/run-paths.cjs` | none | Net new<br>phase 1<br>[NET-NEW 2](net-new.md) |
| `quality-characteristics.md` | The ten quality checks, Q1 to Q10, that skills name for their output. | • none | • Q1 to Q10 | • read by the skills that name a Q code | none | Optimize<br>phase 1<br>[OPTIMIZE 1](optimize.md) |
| `decision-review-gates.md` | How every skill talks to you at its gate: what you see first, the order the questions come in, and the shape of each decision. | • none | • the rules for every gate | • read by every skill with a gate | none | Extend<br>phase 1<br>[EXTEND 2](extend.md) |
| glossary method, record-keeping files | The parts of the glossary method that say where decisions are recorded: only in the gate log. Every other place is filled from it by a program. | • none | • the record-keeping rules | • read by the Glossary package skills | none | Optimize<br>phase 3<br>[OPTIMIZE 17](optimize.md) |
| glossary method, the rest | The glossary method as you approved it, with its word list:<br>• the three lenses<br>• the run rules<br>• the templates<br>• the word list<br>• the Feature Fit method | • none | • the method | • read by the Glossary package skills | none | Reuse<br>phase 3<br>[REUSE 2](reuse.md) |

---

## 8. Other (5)

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| the update test | Decides whether a change alters an existing FRD rule, value, limit or wording. | • FRDs | • each rule compared, with its result | • used by `change-impact-author` | none | Net new<br>phase 7<br>[NET-NEW 33](net-new.md) |
| `fixtures/mcp-slice/` | A slice of MCP's Setup section, copied from the earlier MCP run, for testing every skill and program. | • none | • test sources | • used in every phase's test | none | Net new<br>phase 1<br>[NET-NEW 12](net-new.md) |
| `build-log.md` | The build status of every item. | • none | • one row per item | • updated after every build step | none | Net new<br>phase 1<br>[NET-NEW 13](net-new.md) |
| `examples/` | A complete worked example of each document, all for one made-up product, Expense claims, including the Question log. | • none | • one example per template | • read alongside each template | none | Net new<br>phase 1<br>[NET-NEW 48](net-new.md) |
| `README.md` | How a specifier uses v3. | • none | • the guide | • written last, read first | none | Net new<br>phase 8<br>[NET-NEW 44](net-new.md) |

