# FRD conventions — the rules the FRD author enforces

These rules are never broken. The template, `../../_shared/templates/frd.md`, gives the FRD's shape. This file gives its rules. How you speak to the specifier at the gate is in `../../_shared/decision-review-gates.md`.

Other files point to a section by its name, for example "the Done when section of the conventions". Terms such as piece, gate and suggested rule are defined in `SKILL.md`, under "Words used in this skill".

**An FRD is a living document.** Its status line says only where it stands: drafted, accepted or parked (`../../_shared/conventions.md`, "The opening of every document"). What has been decided, by whom and when, is in its Decision record.

## 1. IDs — only these, never invent new prefixes

| ID | Means | Who assigns it |
|---|---|---|
| `REQ-x.y` | a requirement | the PRD |
| `F-nn` | a feature | the Feature catalog |
| `F-nn.dwN` | the Nth piece of feature F-nn's "Done when" | the Feature catalog |
| `F-nn.n` | a rule | the FRD author |
| `DM-n` | a data model decision | the data model's decision register |
| `GC-n` | a Glossary change the data model waits on | the data model's decision register |

Use no other prefix, such as `FR-`, `BR-`, `AC-` or `GI/GO`. If you feel the need for a new prefix, stop. You don't need it.

The data model's IDs appear in only these places:
- `DM-n`, in a note that names the data model decision a rule follows
- `DM-n` or `GC-n`, after "waits on", for a data model answer that is still open
- any of them, in the Data section's copy of a rules table

Rules are numbered per feature from 1 with no gaps: `F-16.1`, `F-16.2`, `F-16.3`.

**Rule order is source order** until the FRD is first accepted, so every run gives the same behaviour the same ID:
1. Rules from Done-when pieces, in piece order: all of `dw1`'s rules first, then all of `dw2`'s, until the last piece. Within one piece, in the order the piece mentions things.
2. Then `data model` rules, in the order of the data model coverage table.
3. Then `req` rules, in the order the requirement text states them.
4. Then `proposed` and `decided` rules.

**Once the FRD is accepted,** rule IDs never change. A rule added later takes the next free number. The Changes and acceptance section says when the FRD is accepted.

## 2. Capability — one FRD per capability

- A **capability** is a group of related features *within one section* of the PRD. The Feature catalog decides it. Each feature's Capability column names its FRD, such as `FRD-3a Claim approval`. The FRD author never decides or changes it. A capability that looks wrong is raised as a question, and it is changed in the catalog through a change.
- **Number:** `FRD-{section}{capability letter}`, as the catalog gives it. A letter, never a second number, so an FRD can never be read as a requirement ID (`FRD-3b` vs `REQ-3.2`).
- **Name:** the capability's name, exactly as the catalog gives it.
- **Filename:** `frd-{capability}.md` in the project's `frd/` folder. `{capability}` is the capability's name without its number, as `tools/lib/run-paths.ts` writes it:
  - it is in lowercase, and `&` becomes `and`
  - each space, or other sign that isn't a letter or a digit, becomes `-`
  - two or more `-` in a row become one

  For example, `FRD-2a Book lending` gives `book-lending`. The file is `frd/frd-book-lending.md`. Every program that takes `--capability` takes this same value: `--capability book-lending`.

## 3. Rules

- Every rule opens with **The system shall …**. Those words are in the column header. Each cell holds the rest of the sentence.
- **One behaviour per rule.** Never join two behaviours with "and" or "or". Split them into two rules.
- **The Source column cites exactly one source per rule:**
  - `F-nn.dwN — {piece}` when it comes from a Done-when piece
  - `data model — {Thing}, {action, field or move}` when it comes from an action, field or move this FRD's features own. The thing and its action, field or move are named as the data model file names them.
  - `req — from the requirement` when it comes from the requirement text, beyond the Done-when and the data model
  - `proposed — Why: {the options the sources name, and why this one}` when the author suggests the rule. It waits for the specifier's decision, as the Never invent section says.
  - `decided — see Decision n` when the specifier's decision added or kept the rule
- **Notes.** Wherever the document differs from the PRD because of a decision, a note says so, right where the difference shows. The note always reads `*Updated from the requirement on the basis of Decision n: {what changed, in a few words}.*` For a data model decision, it reads `*Updated from the requirement on the basis of DM-n: {what changed, in a few words}.*`
  - In a rule's Source cell, the note follows the source after `<br>`.
  - Every `decided` rule has a note that names its own decision.
  - A rule taken from a Done-when piece or the requirement, whose wording a decision changed, keeps its source and adds the note.
  - A `data model` rule whose wording differs from its requirement because of a data model decision has a note that names that DM-n.
  - In Actors, the note sits next to the item that changed.
- **A decision that changes a data model answer.** A decision at this FRD's gate may change an answer the data model gives. For example, a member may borrow 5 books, not 3. Then the FRD says the new answer, with a note. The data model is not changed, and nothing goes back to it. The note reads `*Updated from the data model on the basis of Decision n: {what changed, in a few words}.*`
  - A `data model` rule that the decision changes keeps its source, and the note follows it after `<br>`. For example: `data model — Member, loans at a time<br>*Updated from the data model on the basis of Decision 4: 5 books, not 3.*`
  - In Data, the cell that the decision changes holds the new answer, then the note after `<br>`. For example: `at most 5<br>*Updated from the data model on the basis of Decision 4: 5 books, not 3.*` Every other cell stays a copy of the data model.
  - The note names a decision in this FRD's Decision record. It never names a data model decision, DM-n, because the data model already follows it.
  - A difference from the data model with no note is an error.
- **Limits and checks are rules too.** A must-not, or a list of allowed values, goes in the same table. Write it with **not** or **only**.
- **A limit is its own rule.** If the source states a count ("one or more", "at most"), a closed list of values, or "only", write the allowing rule and a separate **not** or **only** rule for the limit. Example: "one or more expense lines" → "let a claim hold one or more expense lines" and "**not** accept a claim that holds no expense line".
- **State behaviour, never mechanism.** A rule says what a person sees or does, not how it's built. **Reject any rule containing a "how" word:** screen, page, button, click, tab, modal, dropdown, field, API, endpoint, database, schema, cache, queue, retry, chunk, checkpoint, commit, webhook, cron, thread, token, pixel. Rewrite it as behaviour, or drop it.

## 4. Done when — the anchor

- The Feature catalog holds each feature's Done when, and cuts it into pieces, `F-nn.dw1` onward. The FRD copies them **exactly**. It never edits, splits again, renumbers or rewords them.
- **The Coverage table lists every piece** of the features covered, with its ID and text, exactly as the catalog lists them.
- **Every piece must map to at least one rule** — the Proved by column. A piece with no rule is an error, unless it waits on a question in the Question log: then Proved by names that question, such as "question 12", until it is answered. A rule tracing to nothing is either `proposed`, `decided`, or an invention to cut.
- A feature's Done when may be **thin**: one vague piece that drops what the requirement says. Then raise it as a question, and rely on the requirement text.

## 5. Sources — copied word for word, and named

- **Requirements** are listed with their **title and simple words, copied exactly** from the PRD's "In simple words" column. Each one is **named**, never a bare `REQ-3.2`. The client's own words stay in the PRD, and are never copied into an FRD.
- **Feature descriptions** in "Features covered" are the catalog descriptions, word for word. Feature name, requirement ID, and priority are the catalog's too.
- **Depends on** lists every feature the catalog names under "Depends on" for the covered features, except the features inside this capability. Each one is written `F-xx {catalog name}`.
- **Last changed** reads `{date}, Decision {n}`: the date and number of the latest entry in the Decision record. Before the first decision it reads `None yet.` Update it every time a decision is recorded.
- **Excludes** lists exactly these, one per line, and nothing else:
  1. every other feature in the same section of the catalog, in feature-ID order, as `F-xx {catalog name}`
  2. then any feature or section that **this FRD's own requirements** name in their text, by its catalog name or section name. It is written `F-xx {catalog name}, linked by REQ-x.y` or `{Section name} module, linked by REQ-x.y`. Requirements this FRD does not cover never add an item.
  No description is added. The catalog name says what it is, so every run writes the same line. A neighbour that this FRD's own requirement text does not name is not listed. With nothing to list, it reads `None`.
- **Gates.** Every "Tied to" cell names features as `F-xx {catalog name}`. When there are none, it reads `None.`, never `TBD`.
  - **In** — Tied to: the Depends-on features. Condition: the catalog's "Done when" line of each Depends-on feature, word for word. When there are several, each one is on its own line, after `• `, and they are joined by `<br>`. When there is none, the condition is `None.`
  - **Out** — Tied to: the features whose catalog Depends on names a covered feature, from outside this capability. Condition: a plain sentence on what this capability makes possible for them. When Tied to is `None.`, the condition is this capability's own "Done when" line, word for word. When there are several features, it has one line for each, written as for In.
  - **Undone if** — Tied to: the covered feature whose rule undoes Out. Condition: a plain sentence. `None.` in both cells when nothing undoes it.
- **Written gate conditions** are the Out and Undone if sentences that are not copied. They are plain, and written for no one role in particular. Any outside reader understands them. They use no product jargon.
- **Actors** are the roles that this FRD's own requirement text names as doing something. They also include the Who of each action and move that this FRD's features own in the data model. When none of them names a role, the actor is `Any member`, and a question in the Question log asks who does it. When a decision has already settled who, the row has that decision's note instead.
- **The data model coverage table** lists every action, field and move that the covered features own. They are in the data model files' order, and named as the files name them. A move is named by its From, then →, then its To, such as `On loan → Overdue`. Who owns each one:
  - An action or a move belongs to the feature that section 5 of the Feature catalog gives it.
  - Every field, and what each state means, belongs to the feature that owns the thing's first action: the action that makes it.
- **Every row of the data model coverage table is proved by at least one rule.** Proved by lists exactly the rules whose source names the row, such as `data model — Loan, Extend`. A row can have a cell that is still open: `? (DM-n)` or `? (GC-n)`. While it is open, Proved by reads "waits on" and that ID, such as "waits on DM-5". A row with no rule is an error, unless it waits on an ID from one of its own cells.
- **A Proposed answer keeps its mark.** A data model cell can hold an answer still to be confirmed: `{answer}, Proposed (needs confirmation), question {n}`. A rule from it keeps the mark and the question, such as "let a member extend a loan up to 2 times, Proposed (needs confirmation), question 7".
- **A rule names a field by its own name**, such as "due date". It never says "field", because "field" is a "how" word.
- **Data** holds the rules table of every thing in the data model coverage table. Each one is copied word for word from the thing's data model file, under a link to that file. A later family can add fields to the thing. Then the rules table of its "Adds to" part follows, under a link to its own file. Data is never written fresh. The one exception is a cell that a decision at this gate changed. It holds the new answer and its note, as the Rules section says.

## 6. Never invent — ask instead

- Never invent a limit, value, threshold, or rule. A data model answer is never a gap: the FRD copies it, and never suggests one. When the sources leave a gap, one test decides how it is raised:
  - **The sources name the possible answers, and the gap is which one applies** → a `proposed` rule picking one, written `proposed — Why: {the options the sources name, and why this one}`. Example: the sources give a claim's stages, but not whether a rejected claim can be sent again.
  - **Anything else** → a question in the Question log, through probing-questions-author, with the unknown marked `TBD` where the FRD needs it. Never a rule.
  The specifier decides both at the gate.
- **An open data model answer is not a gap for the FRD.** Its cell reads `? (DM-n)` or `? (GC-n)`. It waits on that ID. It is never a question in the Question log, and never a suggested rule. Once the ID is settled, and the data model holds the answer, an accepted FRD takes it: frd-author runs again for it, as its part "When an answer it waits on is settled" says.
- **The data model's decisions stay with the specifier.** A `DM-n` is never put in the Question log. The client sees it only as the FRD rule that follows it.
- **Two readings.** When a source can be read two ways, the question's answers are the two readings.
- **Every pending `proposed` rule appears in exactly two places**, and is put to the specifier at the gate as "keep or drop":
  - its row in the Rules table
  - the **From your decisions** list under Coverage
- **After the specifier answers**, the decision is recorded in the Decision record, and then:
  - **A kept suggested rule** → its Source becomes `decided — see Decision n`, with its note.
  - **A dropped suggested rule** → deleted from the Rules table and the From your decisions list.
  - **An answer that adds or changes rules** → each new rule's Source is `decided — see Decision n`, with its note, and it is listed under From your decisions.
- Unknowns are `TBD`, and name their question in the Question log. They are never guessed.

## 7. Standard questions

The same questions are asked about every thing the Data section holds, so no run skips one. **The questions, in order,** are the seven listed under "Standard questions" in the template. They are written only in the template.

- The Standard questions section has one row for each thing and each question, in this order, the question copied word for word.
- **First look for the answer in the data model file, then in the documents.** `../../_shared/data-model-design.md`, step 2, says where each answer is in a data model file. Only when they are all silent does the question go to the specifier, as a question in the Question log. Never answer a standard question with a guess.
- The **Answered by** cell holds exactly one of these:
  - `{document}, {place} -> {rule IDs}` — the documents answer it. Example: `PRD, REQ-3.1 -> F-04.2`
  - `{family}.md, {Thing} {action or field} -> {rule IDs}` — the data model answers it. Example: `lending.md, Loan Remove -> F-05.2`
  - `{family}.md, {Thing} {action or field} -> {feature ID} {feature name}` — the answer belongs to a feature in another FRD. Example: `lending.md, Loan book -> F-01 Borrow a book`
  - `{family}.md, {Thing} {action or field} -> waits on {ID}` — the data model's answer is still open. Example: `lending.md, Loan Browse -> waits on DM-5`
  - `Decision n -> {rule IDs}` — the specifier's answer, and the rules it produced
  - `Decision n -> no rule` — the specifier's answer added no rule
  - `question n` — asked in the Question log, not yet answered
  - `Does not apply — {reason, naming the document that rules it out}` — only when the documents rule the topic out. Questions 4, 6 and 7 do not apply when the documents never add several at once, or never give the thing a status.
- Two rule IDs are joined with ` and `. Three or more are listed one per line, each after `<br>• `.

## 8. Flow

- A **diagram**, written in Mermaid, a text format for drawings. It shows the order of actions and their branches. It has a start box labelled `ENTRY` and an end box labelled `EXIT`.
- **And** a **numbered list of steps**: one action per step, each tagged with **exactly one** rule. A step that covers several rules is split into sub-steps, one rule each. The list opens with an **Entry** line and closes with an **Exit** line, tied to the Gates.
- **Every rule appears in the flow at least once.**
- The flow **names** rules. It never adds a behaviour that isn't already a rule in the Rules section.
- **Entry and Exit repeat the Gates, word for word.** The `Entry` line and the diagram's `ENTRY` box use the Gate In condition exactly. The `Exit` line and the `EXIT` box use the Gate Out condition exactly. Never reword or shorten them. The condition is written once, in the Gates table.

## 9. Output — what may appear in the document

- **The status line first**, directly under the title, with no opening notes (`../../_shared/conventions.md`, "The opening of every document").
- **No notes about the process** in the document, such as "generated by…".
- **The status line is set by programs only.** The skill writes `Status: drafted`. `accept.ts` and `park.ts` change it.
- **No placeholders or writer notes.** Every `{placeholder}` is replaced when its part is filled, and none reaches a finished document. Labels in the template that a reader sees are written for the reader, never as instructions.
- **One item per line.** Never join items with `·`, `/`, or commas. Three or more items go on separate lines: bullets in text, and `<br>• ` inside a table cell or a diagram label. Two items may be joined with `and` or `or` in a sentence. Text copied word for word is copied as it is, and this rule never rewrites it. That text is the requirements, the catalog's names, descriptions and Done-when lines, and the data model's names and rules tables.
- **No `·` anywhere.** An ID and its name sit side by side with a space: `F-04 Manager approval`, `FRD-3a Claim approval`.
- Sections in the template's order. Empty section → say "None." honestly rather than padding.

## 10. Who decides — at the gate

The author **drafts**. The **specifier decides**, at one gate, "Accept the FRD?". The questions are asked one at a time inside it, as `../../_shared/decision-review-gates.md` says. The author must not decide in the specifier's place.

| At the gate, the specifier decides | The author must NOT |
|---|---|
| priorities, which come from the catalog | change a priority |
| keep or drop each `proposed` rule | resolve a proposed rule itself |
| the answer to each question the FRD raised or builds on | answer a question itself |
| each tension between decisions | resolve a tension itself |
| each decision that changes a data model answer in this FRD | change a data model answer without the specifier's decision |
| whether to accept the FRD | accept on the specifier's behalf |
| every decision above is recorded | leave a decision out of the Decision record |

The capability, its features and their pieces come from the Feature catalog, and are not decided at this gate. The data model's answers come from the data model. A decision at this gate may change one in this FRD, with its note, as the Rules section says. The data model file is never changed from this gate. Use only the inputs: the capability, the Feature catalog, the PRD, the Glossary and the data model files. Never take facts from chat or memory.

## 11. Changes and acceptance

- **Apply every decision.** Write each rule the decisions add or change, with its note. Then rebuild the Actors, Gates and Flow from the final rules, and not only where a decision names them. Data stays a copy of the data model, except each cell a decision changed, which has its note.
- **Look across the decisions for tensions.** A tension is two decisions whose reasons or effects disagree. Ask about each one as its own decision, with two options: keep both and record the tension, or revisit one of them.
- **A decision that changes a data model answer.** The FRD says the new answer, with its note, as the Rules section says. It does so in each rule and each cell of Data that the decision changes. The data model stays as it is, and nothing goes back to it. The latest document wins, so the stories copy the FRD.
- **Show the specifier the result**, then ask exactly `Accept the FRD?` with the options `Accept` and `Change something first` (`../../_shared/decision-review-gates.md`, rule 6).
  - `Accept` → `accept.ts` runs, and rule IDs are fixed from then on.
  - `Change something first` → make the change the specifier asks for, then show the review again and ask again.
- **The FRD guard.** While a Must answer question this FRD builds on is open, the FRD can't be accepted: the question is answered, or the FRD is parked with `park.ts` while other work goes on.
- **Once the FRD is accepted**, nothing may be left undecided: no pending suggested rule.

## 12. Decision record

The Decision record records every decision the specifier makes at the gate, so anyone can see later what was offered, what was chosen, and why. Its shape is `../../_shared/templates/parts/decision-record.md`. A data model decision is never in it. It stays in the data model's decision register.

- **One entry per decision**, in the order made, numbered `Decision 1`, `Decision 2`, … with no gaps.
- **Each entry holds:**
  - the question, as it was asked
  - its question in the Question log, by number, or `None` for a decision about the draft itself
  - the gate it was asked at: `Accept the FRD?`
  - **every option offered**, exactly as offered: its label, why you'd pick it, and what happens next. At least two are offered, then "I don't know yet".
  - the option recommended
  - the option chosen: exactly one of the offered labels
  - who decided, the BA or the PO, and the date, as `YYYY-MM-DD`
- **An answer that was not offered** is added to the options as `Other: {the specifier's words}` and chosen.
- **Never edit a past entry.** If a decision changes later, add a new entry that starts its question with `Replaces Decision n:`.
- Until the first decision is made, the section says `None yet.`

## 13. Check record

- The last section of every FRD holds the record of the most recent passing check made at the gate: the checker's "For the file" block, pasted as it is. Before the first check it says `None yet.`
- Never write or edit it by hand. Each passing check at the gate replaces it.
- The checker checks only this section's shape, never its content against itself. It always holds the previous run's record.
