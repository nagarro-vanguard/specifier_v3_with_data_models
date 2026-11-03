# Conventions

> **What this is:** The rules every specifier skill follows when it writes a document: who decides, the kinds of document, IDs, how every document opens, how unknowns are handled, and how everything is written.
>
> **What it is not:** How any one skill does its work. Each skill's own instructions say that, and they follow these rules.
>
> **Who uses it:** Every skill and program. And you, when you want to know why a document looks the way it does.

## 1. Who decides

- Only two people make decisions: the BA and the PO. These rules call them the specifiers.
- Skills read, draft, check and record. Programs check, route and generate. Neither decides anything.
- Anyone else who has something to say, such as the client, an architect or a designer, doesn't decide at a gate. What they say comes in as a document in the project's `sources/` folder, and the skills read it like any other source.

## 2. Kinds of document

| Kind | What it means | For example |
|---|---|---|
| **Living** | Kept up to date by its own skill. Each change makes a new version, saved when you accept it. | • BRD<br>• PRD<br>• Glossary<br>• the data model's things file<br>• each data model file<br>• the data model's decisions<br>• Feature catalog<br>• FRD<br>• Stories<br>• Question log |
| **Record** | Only ever added to. A later change adds an entry, and nothing already written is changed. | • Discovery brief<br>• EPIC grouping<br>• Change impact report<br>• Version log |
| **Generated** | Rebuilt by a program from other documents. Never edited by hand. | • EPIC sequencing<br>• EPIC mapping<br>• Traceability map |
| **External** | Brought in by you, from outside. | • your requirement files<br>• design files |

## 3. Each fact is written once

- Each fact is written in one living document only. For example, the wording of an NFR is kept in the PRD and nowhere else.
- Any other document that needs the fact refers to it by its ID, such as NFR-2, instead of writing it again in its own words. When the fact changes, only that document changes.
- Sometimes a document does copy text from another. Then a program checks that the copy matches. For example:
  - the EPIC register copies the EPIC grouping
  - an FRD quotes a requirement's simple words from the PRD
  - an FRD copies a thing's rules table from its data model file. A cell that a decision at the FRD's gate changed is the one exception. That cell says the new answer, with its note (part 24).
  - a story quotes its FRD's rules, with the flow step of each

**The latest document wins, and nothing goes back.** A decision at a later gate may change an answer that an earlier document gives. Then the later document says the new answer, with a note that names the decision. The earlier document stays as it is, and no change is raised for it. For example, the data model says a member borrows 3 books at a time. A decision at an FRD's gate makes it 5. The FRD then says 5, with the note *Updated from the data model on the basis of Decision n: …*. The data model file still says 3, and the stories copy the FRD. A real mistake is the one exception. When a step finds that an earlier document is wrong, such as a feature's "Done when", that document is fixed through a change, as part 17 says.

## 4. What each step reads

- Only three skills read your requirement files directly: `discovery-author`, `brd-author` and `prd-author`.
- When you raise a change and bring new files with it, `change-request-disposition` and `compare-versions.cjs` read those files too.
- Every other step reads the document just before it in the flow, and looks up anything else it needs by ID. For example, `frd-author` reads the Feature catalog, and finds a requirement's wording in the PRD by the requirement's ID.
- The data model's steps read the Glossary, the BRD and the PRD, as `data-model-design.md`, section 2, says.

## 5. Agreed words

- The Glossary settles which word the product uses for each thing.
- From the data model on, every document uses those agreed words.
- The BRD uses the client's own words for things, because the Glossary comes after it. Where the client's word differs from the agreed one, the Glossary records it as "also written as", so the two can always be matched.
- On a project's first run, the PRD comes before the Glossary, so its simple words are plain words, not agreed ones. The accepted PRD is never rewritten to match the Glossary afterwards: the Glossary records each word it replaced as "also written as", so the two can always be matched, as for the BRD.
- When the project already has a Glossary, such as in a change, the PRD's simple words use its agreed words, never a retired one.
- A check program finds each word the Glossary retired, and names the agreed word to use instead. It uses `tools/lib/scan-retired-words.cjs`. These check programs run it:
  - `check-data-model.cjs`
  - `check-features.cjs`
  - `check-epic-grouping.cjs`
  - `check-epic-brief.cjs`
  - `check-frd.cjs`
  - `check-stories.cjs`
  - `check-prd.cjs`, only when the project already has a Glossary
- No document copies the client's sentences into a requirement. The PRD writes each requirement in simple words, and keeps the client's exact words next to it. `simple-writing-rules.md`, part 4, says where else the client's exact words are kept.

## 6. Draft first, decide once

- A skill writes the whole document first, runs its check program, and only then stops for your decision. It stops once for each document.
- The one exception is `glossary-author`, which has two gates: Gate 1 settles the words, and Gate 2 settles their definitions.
- Before its gate, a skill also runs the quick check on each file it wrote or changed, as `simple-writing-rules.md` says.
- At the gate, the first thing you read is printed by programs, counted from the documents, so none of it is the AI's own wording: the check program's summary, then `grade-questions.cjs`'s list of open questions, in order, each with its ratings. The program's last block is pasted into the document's Check record section, at the very end.
- The data model's gates show the check program's summary, then the data model's own decisions, from its decisions file. `data-model-design.md`, gates 1 and 2, says how.
- How a skill talks to you at its gate is in `decision-review-gates.md`.

## 7. IDs

Every count starts at 1.

| What | ID |
|---|---|
| Business requirement | BR-01, BR-02 and so on |
| Requirement in the PRD | REQ-{section}.{n}, counted by the PRD from 1 in each section, one requirement per row, such as REQ-3.1. The client's own number for the row goes in its source. Every row of the PRD's Requirements section has one, whatever its Kind: Requirement, Purpose, Scope or Way of working. Only a Requirement row becomes a feature. |
| NFR | NFR-1, NFR-2 and so on |
| Transition requirement | the source's own ID, or TR-1, TR-2 and so on |
| Data model decision | DM-1, DM-2 and so on, across the whole product |
| A Glossary change the data model waits on | GC-1, GC-2 and so on, across the whole product |
| Feature | F-01, F-02 and so on |
| A piece of a feature's "Done when" | F-{nn}.dw1, F-{nn}.dw2 and so on |
| EPIC | EPIC-001, EPIC-002 and so on |
| FRD | FRD-, then the module number and a capability letter, such as FRD-3a |
| FRD rule | F-{nn}.1, F-{nn}.2 and so on |
| Story | its title. There is no story code. |
| Change | its folder number, 001 onward |
| Question in the Question log | its number, from 1, never reused, written as "question {n}", such as question 12 |

A work item ID from a tracker, such as Jira, stays TBD until the tracker creates it.

## 8. The opening of every document

Every document opens with its title, then its status line. Nothing comes between them: no notes on what the document is, and no Lineage block.

**What a template is for, and what each of its sections holds,** is written once, in the template's Placeholders part, which is never copied into a document:
- **About this template:** what it is, what it is not, and which skill writes it and which program checks it
- **What each section holds:** one row per section, with any rule that applies to it, such as when a section says None

A shared rules file, such as this one, and a skill keep their own opening notes: What this is, What it is not, and Who uses it. The people and skills that use the kit read them, and they are never copied into a document.

**The status line.** One line saying where the document stands.

| The line reads | It means | Written by |
|---|---|---|
| Status: drafted | being written, or rewritten after a "no" at its gate | the skill |
| Status: accepted on {date}, version {n} | you accepted it, and version n is saved | `version-log.cjs`, when you accept |
| Status: parked on {date}, at its gate | set aside at its gate, after your third "no" | `park.cjs` |

- `status.cjs` and `size-rules.cjs` read this line to see what's in progress.
- A Story has no status line. Its status is the Status row of its own table: drafted, groomed or ready. An EPIC is ready when every one of its stories is ready.
- The data model's things file and each data model file have one more line, straight after the status line. It starts "Next step:", and says what you do next.
- A document a program writes, such as the Version log, opens with one line saying which program writes it, and that it is never edited by hand.

**The reader's copy.** A document keeps its citations, such as "per BR-03", because the kit's programs and the Traceability map link each fact to its source. A reader outside the kit, such as a developer reading a story as a GitHub issue, gets the reader's copy instead: `node tools/reader-copy.cjs --file {document}` prints the document without its citations. The document itself never changes.

**Example: the opening of a PRD.** Its first line is the title, "PRD — Expense claims". The next line is its status line, "Status: accepted on 2026-10-19, version 2". Its first section follows straight after.

## 9. Unknowns

Never fill a gap with a guess. Use one of these labels instead:

| Situation | Label |
|---|---|
| The sources don't say | [Not specified in provided sources] |
| A value is suggested, but not confirmed | Proposed (needs confirmation) |
| The information is still to come | TBD |
| A quote from a source is missing | [Needs source excerpt] |

Every gap names its question in the Question log, in the same place, such as "TBD, question 12" or "Euros only, Proposed (needs confirmation), question 4". The question says why it is asked, what it changes and who can answer it, and `grade-questions.cjs` checks that no gap is left without one. A document never holds its own list of open questions. They are kept only in the Question log.

- A requirement that can't be checked yes or no names its question in the same way, such as "as needed, question 9". `simple-writing-rules.md` lists the words that can't be checked.
- The data model is the one exception. A gap in a data model file names where it went, such as "? (DM-8)" for a decision. The data model's decisions file keeps each one. `data-model-design.md`, "Where each gap goes", says where each kind of gap goes.

## 10. Confidence

Every KPI, NFR and measurable claim has one of these tags:

| Tag | Meaning |
|---|---|
| **CONFIRMED** | Every detail is stated in a source. Cite it. |
| **TENTATIVE** | It's in a source, but incomplete. Say exactly what's missing. |
| **AI-RECOMMENDED** | It isn't in any source. You accept, change or reject it at the gate. |

An AI-RECOMMENDED item is never relabelled as CONFIRMED or TENTATIVE.

## 11. Nothing invented

No number, limit, threshold, timeframe, percentage or rule appears unless a source states it. Otherwise it is TBD, or marked "Proposed (needs confirmation)".

## 12. Cite every specific

Every specific says where it came from, in one of these forms:
- "per {document}", such as "per claims-requirements-v2.docx"
- "per {document} section {n}"
- "per your decision at {gate}", for something you decided at a gate

The data model files are the one exception. They cite no source. The data model's decisions file keeps the reason for each decision, as `data-model-design.md`, section 2, says under "No citations".

## 13. Business language

Documents describe what the user sees and does, never how it is built. None of these words appears in a BRD, PRD, Feature catalog, EPIC, FRD rule, story or acceptance criterion, unless a source document itself uses it:
- API, REST, GraphQL, WebSocket, HTTP, endpoint
- microservice, backend, frontend
- database, SQL, NoSQL, schema, table, column, index, query
- React, Angular, Vue, Node, .NET
- Azure, AWS, GCP, container, Docker, Kubernetes
- CSS, HTML, DOM
- cache, Redis, queue, Kafka, RabbitMQ, polling, webhook

## 14. A name is not a source

A title, a feature name or a file name only points at sourced text. It is never a source in its own right. A word that appears only in a name never becomes content, unless sourced text defines it.

For example, a feature called "Manager approval" doesn't tell you who counts as a manager. Only the requirement's own text, which says "the claimant's line manager", does.

## 15. Ask, don't assume

- When something that matters is unknown, the skill never guesses. It runs probing-questions-author, which drafts the question and rates its impact and severity, and then `grade-questions.cjs`, which places it in the Question log. Both run inside the skill, after it drafts and before its check program.
- The skill doesn't stall either. Until a question is answered, the document uses the recommended answer, marked Proposed (needs confirmation), and names the question.
- The data model is the one exception. Its gaps never go into the Question log. Each one goes where its kind goes, as `data-model-design.md`, "Where each gap goes", says. Most go to a decision in the data model's own decisions file. The data model reads the Question log only for the recommended answer to a question the PRD left open.
- When no file and no answer gives an objective or a business requirement, brd-author suggests one, marked Proposed (needs confirmation), and goes on. You decide each one at the gate. The PRD never suggests a requirement: it records only what the client asked for, and a business requirement nothing covers becomes a question.
- At the gate, questions are asked in the order `grade-questions.cjs` sets, in the shape `decision-review-gates.md` gives. Their answers are the real choices, never "yes" or "no", and "I don't know yet" is always one of them.
- An open question never fails a check. A check fails only when a gap is lost, or a question is incomplete: a gap that names no question, or a question missing one of its parts, such as its ratings or its next best action.
- When the requirements change so much that most of the work would change, you can start the project again from nothing, instead of raising a change. This re-run of the whole workflow happens only when you ask for it in words, such as "start the project again from nothing". `requirements-workflow` first shows what will move, and asks for your yes. Then every file and folder in `Output/{project}/` except `sources/` moves to `_archive/Output-{date}/{project}/`, at the top of the kit. No program does this move yet: the workflow does it by hand, as its part "Starting again from nothing" says. Every step then runs fresh, from the Discovery brief on. A re-run doesn't ask each earlier question again.

## 16. Plain characters and lists

- No middle dots, and no section sign. Name a section instead.
- A list is bullets, one item per line, never items joined with commas. This holds inside table cells too, with a line break before each bullet.
- Every count, step and phase starts at 1.

**Markdown that renders.** Every document must read correctly in a markdown viewer:
- A placeholder is written in `{curly braces}`. Angle brackets are never used outside code, because a viewer treats them as hidden HTML, and the text disappears.
- A table cell never holds a "|". Write "and" instead, or the row splits into extra cells.
- A link's path holds no spaces. Use hyphens.
- In a mermaid diagram, every label that holds brackets, braces or quotes is wrapped in double quotes, and edge labels are written as `-->|"label"|`.
- Markdown is never shown inside a code block as an example. Show a real example, and a table of what each line holds.
- `tools/lib/md-lint.cjs` finds every break, and every check program runs it.

## 17. A mistake found later

When a step finds a mistake in a document you've already accepted, it pauses. You raise the mistake as a change, through `change-request-workflow`. Nothing you've accepted is edited outside a change.

- An accepted data model file is changed the same way. A change names each thing it touches, and the change's path runs `data-model-author` for it. For example, a late answer to a question may change a data model answer.
- A decision at a later gate that changes an earlier answer is not a mistake, and raises no change. The later document says the new answer, with its note, as part 3 says under "The latest document wins".
- A Glossary change the data model finds is the one exception. It changes words, not requirements, so it needs no change of its own. Step 3 of `data-model-workflow` sends every such change to `glossary-disposition` as one batch, in one run. It runs once every data model file is accepted.
- The data model never comments on the requirements, so it raises no change. Two requirements that disagree become a data model decision, and the requirements stay as they are (`data-model-design.md`, "Where each gap goes").

## 18. NFRs

NFRs are kept only in the PRD, each with an ID. Every other document lists the IDs of the NFRs that apply to it, and nothing more.

## 19. Each requirement's source

For every requirement, the PRD records the document and the version its wording came from.

## 20. Running a skill on its own

- Every skill can run on its own, without a workflow. It behaves the same either way.
- Before it writes anything, it runs `tools/scaffold-project.cjs --project {project}`, which makes sure the project's folders exist. A project is kept in `Output/{project}/`, in the folder you work from, laid out as `project-folders.md` says. Folders a project may not need, such as `changes/`, are created the first time they are used.
- Given only the project's name, it finds its inputs through `tools/lib/run-paths.cjs`.
- If an input is missing, or isn't accepted yet, it names the input and stops.

## 21. Acceptance

- Every "yes" at a gate runs `tools/accept.cjs` with the document's name.
- That saves a numbered copy in the Version log, saves a copy of the Question log as it stands, rebuilds the Traceability map, and updates the progress of any open change.

## 22. Quality

- A skill that writes units, such as requirements or features, names the quality characteristics they must meet, from `quality-characteristics.md`.
- Every skill that writes requirements, rules, stories or tests follows `atomic-rules.md`: one requirement per row. Its part 3 names each skill.

## 23. Templates and examples

- Every document is written from its template, in `templates/`. Parts used inside documents, such as the Decision record, are in `templates/parts/`. A template makes sense on its own, to a person or an agent opening it in a markdown viewer. Nothing in it is hidden.
- What each section holds, and any rule that applies to it, is written in the template's Placeholders part, under "What each section holds". A document has no line in italics under its headings.
- Text in `{curly braces}` is a placeholder: a short label, such as `{product name}` or `{file link}`. Titles stay readable because of it.
- Every template ends with a "Placeholders" section. It says what the template is for, what each section holds, and, for each label, what to write and an example. That section is never copied into a document.
- Every placeholder is replaced when the document is written, and none is left at its gate.
- Every example, in a template or a rules file, is about a made-up product. No example uses a real client's material. The examples use these products:
  - Expense claims, in most templates and rules files, and in `examples/`. Employees and contractors claim expenses. Their line manager approves, and the finance team also approves claims over a limit.
  - City library, in `data-model-design.md` and the data model's three templates: members borrow books, and each borrowing is a Loan. Some FRD and Feature catalog examples use it too.
  - an online shop, in `simple-writing-rules.md` and `atomic-rules.md`
- `examples/`, beside `templates/`, holds a complete worked example of a document, for Expense claims, under the same file name as its template. For example, `templates/brd.md` is the blank form, and `examples/brd.md` is a filled one.

## 24. Beyond the client's words

Every place where a document goes beyond, or differs from, what the client wrote is marked, so that a program can list it for you:
- a value marked Proposed (needs confirmation)
- a KPI, NFR or measure tagged AI-RECOMMENDED that you accepted
- an FRD rule whose source is `proposed` or `decided`
- a note that says *Updated from the requirement on the basis of Decision n*, or *on the basis of DM-n* for a data model decision
- a note in an FRD that says *Updated from the data model on the basis of Decision n*
- an answer recorded as `Other: {your words}`
- a decision you took on a question from the Question log: the files left it open or contradicted each other, so the answer is yours, not the client's, even when it was the one recommended

At the gate, the check program shows you these places before you accept. After you accept, it gives them to you as the list for the client, in two halves (`decision-review-gates.md`, rule 1):
- what we changed or added: each of the places above, for the client to confirm
- what we still need from the client: every open question and every TBD, each already worded as a question from the Question log. A TBD stays on this list after its question is answered, until the value itself arrives, such as a target the client sets later.

A data model decision is never on this list. The client sees it only later, as an FRD rule.
