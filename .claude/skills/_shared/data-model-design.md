# Data model design

> **What this is:** Step-by-step instructions for writing one product's data model from its Glossary, BRD and PRD. Followed exactly, two runs on the same files give the same result.
>
> **What it is not:** Screens, how the data is stored, or data passed to or from outside systems.
>
> **Who uses it:** things-author and data-model-author, which follow it step by step. `data-model-workflow` runs them, for example "run the data model workflow for city-library". feature-author reads its test "Is it big enough to be a feature?", and frd-author reads its step 2.

## Contents

1. [The goal and the picture](#1-the-goal-and-the-picture)
2. [The rules for every answer](#2-the-rules-for-every-answer)
   - [Where each gap goes](#where-each-gap-goes)
3. [What you need, and what you write](#3-what-you-need-and-what-you-write)
4. [Step 1: Find the things](#4-step-1-find-the-things)
5. [Gate 1: Accept the things](#5-gate-1-accept-the-things)
6. [Step 2: List each thing's actions](#6-step-2-list-each-things-actions)
7. [Step 3: List each thing's fields](#7-step-3-list-each-things-fields)
8. [Step 4: Fill the rules table](#8-step-4-fill-the-rules-table)
9. [Step 5: Send every gap where it goes](#9-step-5-send-every-gap-where-it-goes)
10. [Step 6: Write how it moves](#10-step-6-write-how-it-moves)
11. [Step 7: Check](#11-step-7-check)
12. [Gate 2: Accept the file](#12-gate-2-accept-the-file)
13. [Step 8: Send the Glossary changes together](#13-step-8-send-the-glossary-changes-together)
14. [Step 9: Bring the data model in step with the Glossary](#14-step-9-bring-the-data-model-in-step-with-the-glossary)

---

## 1. The goal and the picture

**The goal.** Given a feature, AI writes its stories and tests the same way every time. To do that, the story writer needs the actions a story can be about, and the rules for every field a story touches. The data model gives those, and nothing else.

**Where it starts.** The Glossary has already named and defined every thing. The data model never names or defines anything again: it adds the actions and the rules. It works from the Glossary, and never comments on the requirements.

**Every thing gets the same parts, in the same order:**

```
Thing
 ├─ Definition          copied from the Glossary
 ├─ Kind of             only if the Glossary makes it one kind of another thing
 ├─ Actions             what people do with it, in which step, who, and the rules for each
 ├─ Rules table         one row per field, the same columns every time
 ├─ How it moves        only if a field holds a status or a step
 └─ Decisions to make   each open decision, with the recommended answer and why
```

Every gap goes where "Where each gap goes", in section 2, says. Most gaps are a "?" with a decision ID. The person settles each one at the gate, and the decision register keeps it.

**Why it comes out the same every time.** The parts, the rules and the order never change, and each rule always becomes the same kind of test:

| Rule | The test it always gives |
|---|---|
| Action | the role named can do it, in its step, and breaking one of its rules is refused |
| Required | leaving it empty is refused |
| Limits | one past the limit is refused |
| Type with choices | a value that isn't one of the choices is refused |
| Can two share it: no | a duplicate is refused |
| Can change: no | changing it is refused |
| Starts as | a new one shows that value |
| How it moves | an allowed move works, and a blocked one is refused |

---

## 2. The rules for every answer

**Read in this order:**
1. **The Glossary.** Its words and definitions are settled. Never rename or redefine a term. Its flow rows say what each step makes, shows, changes and unlocks.
2. **The BRD,** the whole of it. It says who does what, and what the first release covers. Take only what touches this family's things.
3. **The PRD,** the part for this family, with its end-to-end journey. Read other parts only to see what they add to this family's things.

Nothing else is a source. A data model decision never is: its answer fills its own gap, and nothing more.

| Rule | What it means | Example |
|---|---|---|
| The Glossary always wins | What a term is, its kind, its definition, its values and what it belongs to come only from the Glossary. When the PRD words it differently, the Glossary wins. When the Glossary is silent or contradicts itself on any of these, raise a Glossary change and leave the term out until the Glossary settles it. The data model never decides them. | The Glossary gives Loan state the values On loan, Overdue and Returned → those are the values, with no decision, whatever the PRD calls them. |
| Nothing is invented | Every thing, action, field, choice, limit, move and answer comes from the Glossary, the BRD or the PRD: what they state, or what plainly follows from it. "Plainly follows" means the source's words allow only one reading. Anything that needs a judgement is a decision for the person. | "Each loan is for exactly one book" → book, required: yes. A title with no stated length → a decision, never "1–100 characters". |
| Only Glossary words | Every word for a person, a thing, a step, a state or a value is the Glossary's. When the BRD or the PRD uses another word, use the Glossary's. "Who" is always a Glossary role, or "the product" when the product does it by itself, never a loose word such as "the staff". | The PRD says "copy" and the Glossary says "Book" → Book. The PRD says "staff" and the Glossary's role is Librarian → Librarian. |
| Every Glossary flow row is used | Every flow or relationship row in the Glossary that involves a term of this family shows in its file: as an action, a field, a move, or a "kind of" line. That includes rows that tie it to a thing in another family. | "Lending produces a Loan" → Borrow, an action of Loan. "An audiobook is one kind of Book" → Audiobook's "kind of" line, even when Book is in another family. |
| Stay within the family's part | A family's data model file covers only what its own part of the PRD says. When a later part adds a field or a move to a thing from an earlier family, the later family's file writes it, under "Adds to {Thing}". | The Books file says nothing about lending. A Reviews family's file adds a book's reviews to Book. |
| A gap is never guessed | When the sources don't answer, that is a gap. Send it where "Where each gap goes" says. Most gaps become a decision in the decision register, with real options and a recommendation. Never fill a gap on the person's behalf, and never mark anything "assumed". Never leave the reader in the dark either: the file lists each open decision under its thing, with the recommended answer and why, and its "Next step" line says what to do. | A name with no stated length → "? (DM-8)" |
| Two sources disagree | If the Glossary is one of them, the Glossary wins. If two requirements disagree, or the BRD and the PRD do, that is a data model decision. The person picks which answer the data model uses, as "Where each gap goes", row 4, says. The requirements stay as they are. | Two requirements give different limits for one field → "? (DM-7)", with each limit as an option |
| No citations | The data model files show answers, not where each came from. The decision register keeps the reason for each decision, and where it lands. The one exception is an answer that is not yet confirmed. It names its question, as "Where each gap goes", row 5, says. | – |
| The person decides | Every open decision is asked at the gate by probing-questions-author, in its Ask mode, as multiple choice. The recommended answer comes first, and "I don't know yet" is always one of the answers. The answer replaces the "?" and is kept in the register. "I don't know yet" keeps the "?", and the decision is asked again first at the next run. | – |

**A family's part of the PRD** is the section the Glossary's "Families at a glance" table names as that family's source.

### Where each gap goes

A gap is anything the data model needs that the sources don't give. When a step meets a gap, it asks one question: what kind of gap is this? The answer decides where the gap goes. Each kind goes to only one of the places in this table, and a gap never goes to two.

| # | What the data model finds | For example | Where it goes | Does the PRD change? |
|---|---|---|---|---|
| 1 | A rule the sources leave open: a limit, whether two can share a value, whether it can change, or what it starts as | The PRD says a book has a title, but gives no length. | A data model decision, asked at gate 2 | No |
| 2 | Who does an action, when the Glossary has the role but the sources don't say | No requirement says who can remove a member. | A data model decision, asked at gate 2 | No |
| 3 | The Glossary says nothing about a term the data model needs, or says two different things about it | The Glossary names Shelf status, but no thing it belongs to. | A Glossary change. The data model collects every one it finds, across all families. Once every data model file is accepted, step 8 sends all of them to `glossary-disposition` together, in one run. | No |
| 4 | Two requirements say different things, or the BRD and the PRD disagree | One requirement says a member can have 3 loans at a time. Another says 5. | A data model decision, asked at gate 2. Its options are the answers the requirements give. The person picks which one the data model uses, with the recommended answer first. | No |
| 5 | The PRD left a question open, and the data model needs its answer | Question 7, "How many times can a loan be extended?", is still open. | The question's recommended answer, from the Question log, marked "Proposed (needs confirmation)" with the question's number. The question stays in the Question log. | Only when its answer comes in later, through a change |
| 6 | Something no requirement says, small enough to be a rule | No requirement says whether a member can change their own email. | A data model decision, asked at gate 2. The FRD proves it later. | No |
| 7 | Something no requirement says, big enough to be a feature of its own | Members reserve a book that is on loan. | An action in the file, only when the Glossary names it. `feature-author` then decides, at the Feature catalog's gate, whether it needs a feature or a new requirement. When the Glossary doesn't name it, the data model leaves it out. | Not from the data model |

**Is it big enough to be a feature?** The data model and `feature-author`, step 6, use this one test. Step 2's five questions give the rows for making, finding, opening, changing and removing a thing. An action from one of those rows is small enough to be a rule. Any other action is big enough to be a feature, such as one that moves the thing to another state. A field is small enough to be a rule. A move has the size of the action that makes it. A move the product makes by itself is small enough to be a rule.

**Is it row 6 or row 7?** A gap about something small enough to be a rule is row 6. A new action that is big enough, and that no requirement names, is row 7. The data model writes it only when the Glossary names it, and never as the answer to a decision.

**A gap that fits two rows** goes to the first that fits, in this order: row 7, row 3, row 5. Any other gap is a data model decision: row 1, 2, 4 or 6.

**Three rules hold for every row:**
- **The data model never comments on the requirements.** It works from the Glossary, and nothing it finds goes back to the BRD or the PRD. Two requirements that disagree are a decision, as in row 4. Whether a new action needs a new requirement is `feature-author`'s call, as in row 7.
- **A data model decision is only ever about a rule.** Its answer never adds a word, a state or a value the Glossary doesn't have. Such a gap is a Glossary change, as in row 3. Its answer never adds an action big enough to be a feature either. Such an action is written only when the Glossary names it, as in row 7.
- **The data model's decisions stay with the person.** The answers in rows 1, 2, 4 and 6 are the person's, not the client's. They never go into the Question log, and never onto the list for the client. The client sees each one later, only as an FRD rule.

---

## 3. What you need, and what you write

**What you need:**

| Input | Where |
|---|---|
| The Glossary | `Output/{project}/glossary/`:<br>• `object-terms.md`, with its "Families at a glance" table<br>• `role-terms.md`<br>• `step-terms.md`<br>• `states-and-values.md`<br>• `terms-and-relationships.md`, with every flow and relationship row |
| The BRD | `Output/{project}/{product}-brd.md` |
| The PRD | `Output/{project}/{product}-prd.md` |
| The Question log, only for the recommended answer to a question the PRD left open | `Output/{project}/{product}-question-log.md` |
| The things template | `_shared/templates/data-model-things.md` |
| The data model template | `_shared/templates/data-model.md` |
| The decision register template | `_shared/templates/data-model-decisions.md` |

**What you write.** All files go into `Output/{project}/glossary/data-models/`:

| File | Written by | Holds |
|---|---|---|
| `{product}-glossary-things.md` | step 1 | one section per Glossary family: its data model file, its things with their definitions, and any word left out |
| one file per Glossary family, named after the family in lowercase with hyphens, such as `lending.md` | steps 2 to 7 | each thing from that family, and anything the family adds to things from earlier families |
| `{product}-data-model-decisions.md`, the decision register | steps 1, 5, 8 and 9, and every gate | • every decision, open or settled: the question, where it applies, the options, the recommendation, the choice, who decided and when<br>• every Glossary change the data model needs, with its status |

The Glossary's own `decision-register.md` is written by a program and never edited by hand. So the data model keeps its own decision register, `{product}-data-model-decisions.md`, next to its files.

**Each file is treated like every other document in the kit.** It opens with its title, then the status line "Status: drafted", as `conventions.md`, "The opening of every document", says. It ends with a Check record. The person accepts the things file or a data model file at its gate. Then `accept.ts` sets its status line to "accepted on" the date, and its version. It also saves a copy of the file and of the decision register in the Version log. So a later change can see what changed. Each gate records its answers in the decision register, so the register is saved with the file.

**Which file a thing goes in.** A thing goes in the file of its Glossary family, which is the heading it sits under on its Glossary page. For example, Loan sits under Lending, so it goes in `lending.md`.

**Where the files are used.** Each FRD links to the data model files of the things it touches, and uses what it needs:
- the rules tables in its Data section
- the Actions tables, the rules tables and "How it moves" to answer its seven Standard questions, as step 2 shows
- each answer, as a rule that names the thing and its action, field or move as its source, such as "data model — Loan, due date"

**Before you start:**
- If any input is missing, stop and say which one.
- Find the mode the run is in, and say it in one sentence, first. Take the first row of this table that fits:

| What is found | Mode | What happens |
|---|---|---|
| a change names the things file or a data model file. Step 9 counts as a change: it names the Glossary changes the Glossary has settled. | **a change** | Only what the change names is changed. Its gate is held again, for what changed only. |
| no `{product}-glossary-things.md` | **new build** | Start at step 1. |
| `{product}-glossary-things.md`, not yet accepted | **picking up** | Go on from gate 1. Decisions already settled stay settled. |
| the things file accepted, and a family it names with no accepted file | **picking up** | Go on with the first such family, from the first step not done in its file. Decisions already settled stay settled. |
| every file accepted, and an entry still open that this skill asks again, as "What is still open is asked again first" says | **picking up** | Ask each one again. Hold the gate again only when an answer changes the file. |
| every file accepted, and a product-wide decision now settled, while a family's file still shows its "? (DM-{n})" | **picking up** | data-model-author writes the answer in place of each "? (DM-{n})" in that file, in a change. Its gate is held again, for what changed only. |
| every file accepted, nothing still open for this skill, no settled answer still to write in, and no change | **nothing to do** | Stop, and say so. An accepted file changes only in a change, or with an answer to an entry still open. |

Starting again from `requirements-workflow`, step 1, starts the project again from nothing. No data model file is left, so the data model starts as a new build.

**What is still open is asked again first.** A decision answered "I don't know yet", and a Glossary change left open, are never forgotten:
- `node tools/status.ts --project {project}` lists each one, under "Data model, still open". It also names the skill that asks it again. Under its "Next:" line, it says when: first, at the next run of `data-model-workflow`. Such an entry holds up no other step.
- In every mode, things-author and data-model-author ask each one they own again, first: once the inputs are checked, and before the sources are read. things-author owns the entries of the things file: the product-wide decisions, and the Glossary changes raised from it. data-model-author owns the entries of its own file.
- A decision is asked again as gate 2 asks it, with the same options, the recommended answer first, and "I don't know yet".
- A Glossary change left open is asked again as one question: send it to the Glossary again? The answers are "Send it with the next batch", recommended, and "I don't know yet". The first marks it "To raise", so step 8 sends it with the others. The second leaves it open.
- An answer is recorded straight away, as gate 2 says. When it changes the file, the gate is held again, for what changed only. An answer to a product-wide decision fills its "?" in every family's file: data-model-author writes the answer into each of those files, in a change.

---

## 4. Step 1: Find the things

**What this step does:** it goes through every word in the Glossary and decides what each one turns into.

**What it leads to:** `{product}-glossary-things.md`, with one section per Glossary family. Each section names its data model file once, then lists its things with their definitions, then which of them is a kind of another thing, then any word left out. The product-wide decisions and the words waiting on a Glossary change are listed at the end. The words that become a field or choices are not listed: step 3 puts them on their thing.

Take the words in the Glossary's order. For each word, read what its kind page says about it and its rows in `terms-and-relationships.md`: a "kind of" row there can tie it to a thing in another family. Then find the row that matches:

| If the Glossary says the word is… | It turns into… | Example |
|---|---|---|
| a thing or a person, with nothing above it | **a thing** | Book, Loan, Member |
| part of another thing, but has details of its own | **a thing** | Shelf, part of a Branch, where "each shelf has a code and a floor" → Shelf is a thing |
| part of another thing, with no details of its own | **a field** of that other thing | Barcode, part of a Book → Book's barcode field |
| shown when another thing is opened, and has details of its own, or another thing points to it | **a thing** | Review, shown when a Book is opened, "with a rating and a comment" → Review is a thing |
| shown when another thing is opened, with no details of its own | **a field** of that other thing | Cover image, shown when a Book is opened → Book's cover image field |
| made in a later step of the work | **a thing** | Report, made in the Reporting step → Report is a thing |
| a kind of another thing, with nothing extra | **a choice** in a field of that other thing | Paperback and Hardback, kinds of Book → choices in Book's format field |
| a kind of another thing, with details of its own | **a thing** | Audiobook, a kind of Book with its own "running time" → Audiobook is a thing |
| a step of the work | **a choice** in the field that records which step something has reached. | Ordering and Shelving → choices in Book's stage field |
| a state, such as a status | **a field** of the thing it belongs to, with its states as the choices | Loan state → Loan's state field, with the choices On loan, Overdue and Returned |
| a state that belongs to a step, or to nothing | **a Glossary change**: left out until the Glossary gives it a thing to belong to | Shelving state, which belongs to the Shelving step → a Glossary change |
| a screen or a page | **nothing**: listed under "Left out" | Catalogue, "the page where members browse books" |
| a person the product keeps nothing about | **nothing**: listed under "Left out" | Librarian |
| anything else, such as a word the Glossary relates to nothing | **a Glossary change**: left out until the Glossary settles it | – |

*The Glossary's own words behind each row:*
- *"nothing above it" is a "-" in its relationship column*
- *"part of" is "part of a {thing}"*
- *"shown when opened" is "shown when a {thing} is opened"*
- *"made in a later step" is "part of a {step}" or "in the flow"*
- *"a kind of" is "a kind of {thing}", on the word's kind page or in a row of `terms-and-relationships.md`*
- *steps are on `step-terms.md`, and states are on `states-and-values.md`*

**What you get, for the library example.** One section per family:

> **Books**
>
> Data model file: books.md
>
> | Thing | Definition |
> |---|---|
> | Book | A title the library lends, with its author, barcode and format. |
>
> Left out: Catalogue (a screen)

> **Lending**
>
> Data model file: lending.md
>
> | Thing | Definition |
> |---|---|
> | Loan | One lending of a book to a member, due back by a date. |

Barcode, Paperback, Hardback and Loan state are not listed in the things file. Step 3 makes them Book's barcode field, the choices in Book's format field, and Loan's state field.

**Then find the product-wide decisions.** Some gaps would be asked the same way in every family's file. Ask them once, in step 1, so every family uses one answer. A gap is product-wide when its answer would fill a "?" in every family's file:

| Look at | It is a product-wide decision when… | Example |
|---|---|---|
| The Glossary's roles, and what the BRD says the first release covers | the sources don't say which roles can act in the first release | The Glossary has a Volunteer role that the BRD never mentions → "Can volunteers act in the first release?" |
| Anything else | the same question would be asked in every family's file | – |

Each product-wide gap goes where "Where each gap goes", in section 2, says. Most are a data model decision. Open each decision in the decision register as step 5 says, asked one at a time, and list it under "Decisions to make" in `{product}-glossary-things.md`. Once it is settled, its answer fills that gap in every family's file, the same way any answer replaces its "?". While it is open, even after "I don't know yet", each family's file shows "? (DM-{n})" in each cell it answers. The file also lists it under "Decisions to make", under each thing with such a cell.

---

## 5. Gate 1: Accept the things

Stop, and show the person `{product}-glossary-things.md`, with the Glossary changes that step 1 raised. They go to the Glossary with all the others, in step 8. Then ask, in this order:

1. **The product-wide decisions,** one per message, laid out as gate 2 shows.
2. **The gate's own question:** "Accept the things?"

Record every answer in the decision register straight away, as gate 2 says. A settled product-wide decision leaves "Decisions to make". One answered "I don't know yet" stays in the table. When they change a row, change it in `{product}-glossary-things.md`. Run the check in step 7 again after each change.

**When the person accepts the things:** write "None: the things are accepted" as the "Next step" line. Then run the check once more, and paste its "For the file" block into the Check record of the things file and of the decision register. Do this before `accept.ts`, never after, because `accept.ts` saves each file as it is. Then run `node tools/accept.ts --project {project} --document data-model-things`. It sets the status lines of both files, and saves a copy of each. Step 2 starts only once the things are accepted.

---

## 6. Step 2: List each thing's actions

**What this step does:** it lists everything people do with each thing: make it, find it, open it, change it, move it on, and remove it. Each action is something a story can be about.

**What it leads to:** an "Actions" table under each thing, with four columns: Action, In step, Who, Rules. The fields come next, in step 3.

**Where to look,** in this order:

| # | Where to look | What to take | Example |
|---|---|---|---|
| 1 | The Glossary's flow rows that involve this family's terms, in `terms-and-relationships.md`: produces, re-checks, unlocks, locks, comes before, reveals | each row that makes, shows, changes or moves a thing gives an action, in the step the row names | "Lending produces a Loan" → Borrow, in Lending |
| 2 | The BRD | who does what, and what the first release covers | "Members borrow and extend their own loans" → Who: Member, for Borrow and Extend |
| 3 | This family's part of the PRD: its part of the end-to-end journey, and its requirements | each thing a person does with the thing, and the rules on it | "A due date can be extended, only while the loan is on loan" → Extend, only while On loan |

**Then ask five questions about every thing,** so no action is missed:

| Question | The action it gives | Example |
|---|---|---|
| What makes it, and who? What must already exist first, and which action made that? | the action that makes it | Borrow, by a Member. The book and the member already exist: the Books and Members families make them. |
| How is it found, and who sees the list? | Browse | ? (DM-5) |
| What does opening it show, and who can open it? | Open | ? (DM-5) |
| What can be changed, and by whom? | Change, or the sources' own word | Extend, by the Member |
| Can it be removed, and by whom? What goes with it? | Remove | ? (DM-4) |

The Glossary's flow should already answer the first question: a step starts only once what it needs exists, so an earlier step made it. When the sources don't answer a question, the row still goes in, with "?" in each cell they leave open, and step 5 sends each gap where it goes. That includes something no action in any family makes. A thing that is part of another is found and opened with that other thing, so it needs no Browse or Open row of its own.

**How to write each row:**

| Column | What to write | Example |
|---|---|---|
| Action | a short verb, in the sources' word where they have one | Borrow, not Add |
| In step | the Glossary step it happens in: the step a flow row names, or else the step this family's part of the PRD describes. Write "–" when the Glossary has no step for it. | Lending |
| Who | one of these:<br>• a Glossary role<br>• "the product", when the product does it by itself<br>• "? ({ID})", when the sources don't say<br>• "–", for an action the sources say is never allowed | Member |
| Rules | what the sources say must hold: what it needs first, when it is refused, what else it makes or removes, and whether several can be done at once. Each rule is one short, plain sentence. | For exactly one book. Refused while the member has an Overdue loan |

- One row per action, in the order the work happens: make, find, open, change, move on, remove.
- Every action a person takes is a row, including one that moves a status. A move the product makes by itself, such as a due date passing, is written only in "How it moves".
- When the sources name a way to make several at once, the rules of the action that makes the thing say so, and what happens when some fail. When they name none, the rules say nothing about it: the FRD's question 4 then does not apply.
- An action that only a later family's part of the PRD names goes in that family's file, under "Adds to {Thing}".

**The FRD's seven standard questions.** The data model file doesn't repeat them. The FRD reads each answer from the data model file:

| # | The FRD's question | Answered by |
|---|---|---|
| 1 | Can it be changed after it is added? Which parts? | the actions that change it, and the rules table's "Can change" |
| 2 | Can it be removed? | the Remove row |
| 3 | Can two be the same, and on what? | the rules table's "Can two share it" |
| 4 | When several are added at once, what happens if some fail? | the rules of the action that makes it |
| 5 | Who can do each of these? | the Who column |
| 6 | What is its starting status? | the rules table's "Starts as" |
| 7 | What changes in each status? | "What each state means", in step 6 |

---

## 7. Step 3: List each thing's fields

**What this step does:** it writes down every field of each thing: the boxes you would see on its form.

**What it leads to:** the "Things and their fields" table at the top of each data model file, and one row per field in each thing's rules table. Step 4 fills in the rules.

**Where to look,** in this order:

| # | Where to look | What to take | Example | Fields it gives |
|---|---|---|---|---|
| 1 | The thing's Glossary definition | each piece of information it names, except another thing from a later family, which that family adds | Book: "A title the library lends, with its author, barcode and format." | author, barcode, format |
| 2 | This family's part of the PRD | any field it names that the definition left out | "Each book has a title, an author name, a barcode of 12 digits, and a format." | title |
| 3 | The Glossary words of this family that belong to this thing | its states, its "kind of" words, its parts with no details of their own, and the steps, if it records which step it has reached | Loan state, which belongs to Loan → a state field, with the choices On loan, Overdue and Returned | state |
| 4 | Another thing it points to | when the definition or this family's part of the PRD ties it to another thing | Loan: "One lending of a book to a member" | book (one Book), member (one Member) |
| 5 | A thing from an earlier family | when this family's part of the PRD, or a Glossary word of this family, adds a field, an action or a move to it, write an "Adds to {Thing}" part with just those | Reviews, in a Review family: "each book collects its reviews" → Adds to Book: reviews | reviews |

**What counts as a field.** Only information the thing holds is a field. Use this table for every phrase you find:

| In the sources, the phrase is… | Is it a field? | Example |
|---|---|---|
| a piece of information the thing has: "with its X", "each X has a Y", "named with Y", "carrying Y", "X's Y", "the Y of the X" | **yes**, a field named Y | "each book has a title" → title |
| another thing in the Glossary that this thing is tied to | **yes**, a field that points to that thing | "a lending of a book" → book (one Book) |
| a Glossary word that belongs to this thing, from row 3 above | **yes** | Loan state → state |
| the thing itself is a statement: a limit, a measure, an item marked in or out, an editable part | **yes**, a field called "text", holding its words | Library rule, "a rule every member must follow" → text |
| one value of a field | **no:** it is a choice of that field | "the loan is on loan" → On loan is a choice of state |
| something a person or the product does: borrow, extend, check, send | **no:** it is an action, from step 2, or a move, in step 6 | "a due date can be extended" → the Extend action |
| a count or a limit | **no:** it is a limit on a field, used in step 4 | "up to five loans" → a limit on member |
| a screen, page, button, report or export | **no** | "the page where members browse books" |
| something the sources never name, such as an ID, a "created on" date or a "last changed by" | **no:** never add it | – |
| one name for something made of parts, such as "address" | **one field**, as named. Split it only if the sources name the parts. | "with an address" → address |

**How to write the fields:**

| Rule | Example |
|---|---|
| Use the Glossary's word for a field if it has one. Otherwise use the PRD's word, in plain words. | The definition says "author" and the PRD says "author name" → author |
| Put the fields in the order this family's part of the PRD first names them. Fields it never names come after, in the definition's order, then row 3's. | Book: title, author, barcode, format |
| A field found in two places gets one row | Barcode is in Book's definition and in row 3 → one row |
| A field that points to another thing is written once, on the thing whose words name it first | Loan gets "book". Book doesn't get "loans". |

**What you get, for the library example.** At the top of each data model file:

| File | Thing | Fields it gives |
|---|---|---|
| books.md | Book | title, author, barcode, format |
| lending.md | Loan | book, member, due date, state |

---

## 8. Step 4: Fill the rules table

**What this step does:** it answers the same six columns for every field.

**What it leads to:** a rules table under each thing. Each cell holds what the sources say, "–" where the column doesn't apply, or "?" for a gap. Step 5 sends each gap where it goes.

| Column | The question | Possible answers | Example |
|---|---|---|---|
| Type | What kind of value is it? | • text<br>• number<br>• date<br>• yes or no<br>• one of, then each choice as a bullet on its own line<br>• one or more of, then each choice as a bullet on its own line<br>• one {Thing}<br>• several {Things}<br>• file<br>• a street address<br>• a web address<br>• an email address<br>Add "set from {field}" when the product works it out. | format: one of:<br>• Paperback<br>• Hardback |
| Required | Must every {thing} have it? | • yes<br>• no<br>• yes, only when… | title: yes |
| Limits | How long, how many, what range or format? Is it tied to another field? | a length, range, format or most allowed, or a rule that ties it to another field | barcode: 12 digits |
| Can two share it | Can two {things} have the same value in this field? | • yes<br>• no | barcode: no |
| Can change | Can it be changed once it's set? | • yes<br>• no<br>• only while {value}<br>• follows {field}<br>• moves: see How {field} moves | due date: only while On loan |
| Starts as | What is it when the thing is first made? | one of its choices | state: On loan |

Write "–" where a column doesn't apply:
- **Limits** doesn't apply to choice fields or to yes-or-no fields. It applies to several {Things} only when a source gives a number, such as "up to five".
- **Can two share it** applies only to fields that could tell one thing from another: a name, title, code, number, email or key, and fields that point to another thing.
- **Starts as** applies only to choice fields the product sets itself, such as a status. A choice the person picks, such as a format, gets "–".

---

## 9. Step 5: Send every gap where it goes

**What this step does:** it finds the kind of every "?". Then it writes each gap down where its kind goes.

**What it leads to:** the multiple-choice questions the person answers at gate 2. It also leads to the Glossary changes that step 8 sends together.

For each "?", in the order it appears in the file, find its kind in "Where each gap goes", in section 2. Then write it as this table says:

| The gap goes to | In the file | In the decision register |
|---|---|---|
| A data model decision: rows 1, 2, 4 and 6 | "? (DM-{n})", and a row in the thing's "Decisions to make" table | an entry under "Open", as the next table says |
| A Glossary change: row 3 | "? (GC-{n})", and a row in the thing's "Waiting on the Glossary" table | an entry under "Glossary changes", marked "To raise" |
| The answer to a question the PRD left open: row 5 | the question's recommended answer, then "Proposed (needs confirmation), question {n}" | nothing. The question stays in the Question log. |

A gap of the kind in row 7 never has a "?". The data model writes the action when the Glossary names it, and leaves it out when the Glossary doesn't. Gate 2 says what to do when one comes up in an answer.

**A data model decision** is an entry in the register, in the shape of `_shared/templates/data-model-decisions.md`:

| Part | What to write | Example |
|---|---|---|
| ID | DM-, then the next free number across the whole product | DM-8 |
| The question | in plain words, worded for the thing | How long can a book's title be? |
| Where | the file first, then the thing, then the field and the column, or the part, each after a comma | books.md, Book, title, Limits |
| Why I'm asking | what the sources say, and what they leave open | The PRD says each book has a title, but gives no length. |
| Options | at least two real answers, never "yes" or "no". For each: what it is, why the person would pick it, and what happens next. Then "I don't know yet". When two requirements disagree, each answer they give is an option. | • Up to 200 characters<br>• Up to 100 characters<br>• I don't know yet |
| Recommended | one option, and why | Up to 200 characters, because some book titles are long |
| How it is asked | **One at a time** for a decision about how the product behaves: removing, adding several at once, which choices are allowed, a move or its trigger, or who can do something. **Settled together** for a limit, whether two can share a value, or whether a field can change. | Settled together |
| Chosen | "open" until the gate | open |

**A Glossary change** is written in the register's "Glossary changes" section, as GC-1, GC-2…: the term, what the Glossary says now, what is needed, a proposed answer, and where it was raised. Its status starts as "To raise". The data model collects every Glossary change it finds, across all families. Step 8 sends all of them together, once every data model file is accepted. Each one is settled in the Glossary, never in the data model. In the file, a gap waiting on it is written "? (GC-{n})", and the thing's part lists it under "Waiting on the Glossary".

Every "?" in the file names where its gap went, such as "? (DM-8)" or "? (GC-2)". In the file:
- each thing's part has a "Decisions to make" table after the rules table, or after how it moves once step 6 has written it, and an "Adds to" part ends with one: each open decision, its question, the recommended answer and why
- the "Next step" line under the status says how many decisions are open, and that each one is listed under its thing with a recommended answer

---

## 10. Step 6: Write how it moves

**Written before the gate, with the rest of the file.** Some moves depend on an open decision, such as whether a thing can move back. Those moves follow the decision's recommended answer. When the person picks another answer at gate 2, the moves are updated at that gate.

**Only for a status the product moves, or a step, and only for the moves this family's part of the PRD names.** A value the person picks, such as a book's format, gets no moves: its "Can change" says whether it can be changed. A later family writes the moves that happen in its part, under "Adds to {Thing}".

**What it leads to:** a picture of the whole path, and two tables a story writer reads straight off. Every row in "Moves" is a move a story can test. A move that isn't in the table is refused.

Write three things, in this order:

| Part | What it holds | Example |
|---|---|---|
| The picture | one line, in a code block: "Start", then the main path through the values, joined by → for a move one way and ⇄ for a move both ways. Any other move appears only in the table. | Start → On loan → Overdue → Returned |
| Moves | one row per move: From, To, When, Who. The first rows start from "Start": the value a new thing begins in, and when. A move back to an earlier value is a row of its own. | • From: Start<br>• To: On loan<br>• When: a member borrows a book<br>• Who: Member |
| What each state means | one row per value, in positive terms: what the thing has or allows while it holds that value, and what unlocks next | • State: Overdue<br>• What it means: the member borrows again once the loan is returned |

**Where each part comes from:**
- **The moves and their order:** this family's part of the PRD, and for steps, the Glossary's "comes before".
- **What each state means:** the Glossary's "locks" and "unlocks", and this family's part of the PRD.
- **Who:** the Who of the action that makes the move, from step 2. When the product makes the move itself, write "the product".
- **A gap:** where a trigger, a who or a move back isn't given, write "?" in its cell. When an open decision answers it, the cell names that decision, such as "? (DM-2)". Otherwise, send the gap where step 5 says. A decision this step opens is asked at gate 2, with the others.
- **Positive wording:** say what a state allows and what unlocks it, not what it can't do. "The member borrows again once the loan is returned", not "the member can't borrow".
- **One start:** a thing always starts in one value. If something given at creation puts it straight into a later value, that is the first move, happening at once: "the card is issued, when the member joins or later". It is never a second start.
- **Not a move:** a change that leaves the value as it is, such as renewing a member's card, is not a move. Write it in "What each state means".
- **No way back:** when the sources rule out a move back, leave its row out and say so under the table, in one line, such as "A returned loan is never reopened, so Returned has no row back."

---

## 11. Step 7: Check

`tools/check-data-model.ts` runs these checks. Run `node tools/check-data-model.ts --project {project}` for the things file, at gate 1. Run it with `--family` and the file's name, such as `--family lending`, for one data model file, at gate 2. Each time, it checks the decision register too. It also runs the kit's checks: the opening, the sections, the placeholders, simple writing, one requirement per row, and the retired Glossary words. Fix every finding, and run it again until every check passes. Some of these checks need a person. The program lists each one it can't check, at the end of what it shows. At the gate, its last block goes into the Check record.

1. Every Glossary term that is a thing, or becomes nothing, is in `{product}-glossary-things.md`, as a thing or under "Left out".
2. Every thing in this family has its part in the file, every Glossary word of this family that belongs to a thing shows as one of its fields or a field's choices, and every field, action or move this family adds to a thing from an earlier family is under "Adds to {Thing}".
3. Every thing has all its parts, in the template's order.
4. Every cell holds an answer from the sources, "–", "? ({ID})", or an answer marked "Proposed (needs confirmation)" with its question's number.
5. Every "? (DM-{n})" has an open decision in the register and a row in its thing's "Decisions to make" table. Every "? (GC-{n})" has a Glossary change the Glossary hasn't settled, and a row in "Waiting on the Glossary". Every open decision for this file has a "?", even one answered "I don't know yet". So does every product-wide decision still open, in every family's file.
6. Nothing in the file says "assumed", and nothing was added that the sources don't name.
7. No answer in the file cites a source. An answer not yet confirmed names only its question.
8. Every thing, definition, step and state value matches the Glossary word for word, and no term's kind is changed: a step stays a step, and an object stays an object. Every other word for a person, a thing, a step, a state or a value is the Glossary's too.
9. Every "Who", in Actions and in Moves, is a Glossary role, "the product", "? ({ID})", or "–" for an action the sources say is never allowed.
10. Every Glossary flow or relationship row that involves a term of this family shows in the file: as an action, a field, a move, or a "kind of" line.
11. Every thing has an action that makes it, and rows for finding, opening, changing and removing it, each answered or "? ({ID})". A thing that is part of another needs no Browse or Open row.

---

## 12. Gate 2: Accept the file

For each data model file, once steps 2 to 7 are done, stop and show the person the whole file, its moves included. Then ask, in this order:

1. **The "one at a time" decisions,** one per message, in register order, asked by probing-questions-author, in its Ask mode, as `decision-review-gates.md`, rule 4, says.
2. **The "settled together" decisions,** as one list: each question with its recommended answer. The person gives one of three answers:
   - take all the recommended answers
   - change some, then take the rest
   - "I don't know yet"
3. **The gate's own question:** "Accept the {family name} data model?", with the family's name, such as Lending.

Each decision is asked by probing-questions-author, as multiple choice, as `decision-review-gates.md`, rule 4, says. The recommended answer comes first, and "I don't know yet" is always one of the answers.

**An answer that is not a rule:**
- It may add a word, a state or a value the Glossary doesn't have. Then a Glossary change replaces the decision, as step 5 says.
- It may add an action big enough to be a feature. The data model writes such an action only when the Glossary names it, as "Where each gap goes", row 7, says. Otherwise the decision is asked again, and the person picks another answer or "I don't know yet".

**Record each answer straight away:**
- In the register: move the entry to "Settled", with the option chosen, who decided (BA or PO) and the date. An answer that wasn't one of the options is added as "Other: {the person's words}", and chosen.
- In the data model file: replace the "? ({ID})" with the answer, everywhere it appears, take its row out of "Decisions to make", and update the "Next step" line.
- "I don't know yet": the entry stays under "Open", marked "Proposed: {answer}", where {answer} is the recommended one. The file stays as it was before the gate. Each cell the decision answers keeps its "? ({ID})", and its row stays in "Decisions to make". Where the file follows an answer, such as its moves, it follows the recommended one. The decision never goes into the Question log. It is asked again first at the next run, as section 3, "What is still open is asked again first", says.

**An answer that differs from the recommended one.** Before the gate, the file follows the recommended answer wherever it depends on an open decision. So when the person picks another answer, update what that answer changes, before asking "Accept the {family name} data model?". That can be the moves, a rule or an action. Then run the checks in step 7 again.

A settled decision is never edited. A later change adds a new entry, with the next ID, whose question starts "Replaces DM-{n}:". Each ID has one entry only.

**When the person accepts:** set the "Next step" line to "None: this file is accepted." When a decision is still open, the line names it too, such as "None: this file is accepted. DM-4 is still open, and is asked again first at the next run." Run the check in step 7 once more, and paste its "For the file" block into the Check record of the file and of the decision register. Do this before `accept.ts`, never after, because `accept.ts` saves each file as it is. Then run `node tools/accept.ts --project {project} --document data-model --family {family}`, where {family} is the file's name, such as lending. It sets the status lines of the file and of the decision register, and saves a copy of each. The skill never writes "accepted" itself.

Then the workflow goes on to the next family's file.

---

## 13. Step 8: Send the Glossary changes together

**When:** once every data model file is accepted, and never before. This is step 3 of `data-model-workflow`.

**Why together:** the data model collects every Glossary change it finds, across all families, and sends them all in one run. So the Glossary is asked once, with the full picture, and never one change at a time as each is found.

**What this step does:** it sends every Glossary change marked "To raise" in the register to `glossary-disposition`, the kit's skill for changing an agreed word, as one batch. The data model never edits the Glossary itself.

**Why not `change-request-workflow`:** a Glossary change from the data model changes words, not requirements. So it goes straight to `glossary-disposition`.

1. **Mark each change in the batch "Raised".**
2. **Run `glossary-disposition` once, with the whole batch.** For each change, the term, what the Glossary says, what is needed and the proposed answer. Its gate asks each change on its own, and offers only the answers that fit it:
   - **change the Glossary:** rename, redefine, split, merge or withdraw a term, such as renaming a state's values
   - **add new words:** every new word of the batch goes to `glossary-author` together, in one run, in its mode "add words from a request"
   - **I don't know yet:** the change stays open
3. **Its ripple list** names every document that uses each term. It flags them for their authors and never edits them.
4. **Mark each change as the batch settles it:**
   - settled in the Glossary: "Settled in the Glossary on {date}"
   - "I don't know yet", or a new word `glossary-author` left open, because the sources don't name it or its gate was answered "I don't know yet": "Left open on {date}". The change stays open in this register, and never goes into the Question log. Each cell that waits on it keeps its "? (GC-{n})". It is asked again first at the next run, as section 3, "What is still open is asked again first", says.

Then step 9 brings the data model in step with the Glossary.

---

## 14. Step 9: Bring the data model in step with the Glossary

**When:** once step 8 is done, for every change marked "Settled in the Glossary on {date}". This is step 4 of `data-model-workflow`.

**What this step does:** it writes the Glossary's answers into the data model, so every file uses the Glossary's words again.

1. **Run `things-author`, then `data-model-author`, each in a change,** for the terms the Glossary changed only. A new thing gets its part. A renamed value is renamed everywhere it appears. A term that now belongs to a thing is added. Each "? (GC-{n})" gets its answer. Their gates are held again for what changed.
2. **Once every file they changed is accepted again,** mark each change "Settled in the Glossary on {date}. Brought into the data model on {date}".

Until a change has that last mark, `status.ts` shows step 4 of `data-model-workflow` as still to do.
