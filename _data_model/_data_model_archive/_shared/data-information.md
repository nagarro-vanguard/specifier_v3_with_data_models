# Data and Information rules

> **What this is:** The rules the five skills of the Data and Information workflows share: what each technique asks, how every item is answered, the IDs, and how Glossary terms are sorted into entities, attributes and states.
>
> **What it is not:** How any one skill runs its step. Each skill says that, and follows these rules. The design and its reasons are in `DATA-MODEL-DESIGN.md`.
>
> **Who uses it:** data-model-author, data-dictionary-author, state-model-author, data-flow-author and interface-author; and check-data-information.cjs, which enforces what it can.

These rules follow `conventions.md`. Where they say more, they add to it; they never contradict it.

## 1. The workflows

Each technique is BABOK's, in its Data and Information model category, done the way BABOK defines it:

| Workflow | Technique | Done by | Runs |
|---|---|---|---|
| `glossary-author` | Concept Modelling | `build-data-inventory.cjs`, after each section draft and when the pages are written | always |
| `data-model-workflow` | Data Modelling | data-model-author | always |
| `data-model-workflow` | Data Dictionary | data-dictionary-author | always |
| `state-model-workflow` | State Modelling | state-model-author | when the data model confirms it |
| `data-flow-workflow` | Data Flow Diagrams | data-flow-author | when the data model confirms it |
| `data-flow-workflow` | Interface Analysis | interface-author | when the data flows are accepted |

Every step stops at its gate, and the next starts only once it is accepted. The data model's "The workflows that follow" says whether the two conditional workflows run, and the specifier confirms it at the data model's gate. `route-data-workflows.cjs` names the next workflow. A workflow that does not run writes nothing.

## 2. What each step reads

- **Data model:** the inventory, the Glossary, and the PRD. It is the one step that reads the PRD's requirements in full, to find every attribute they name.
- **Every later step:** the documents before it, and the PRD and the Glossary by ID only.
- Nothing from chat or memory is ever an input.

## 3. How every item is answered

Every item a template asks is answered in exactly one of three ways. A blank is never an answer.

| Answer | Written as |
|---|---|
| A source says it | the answer, then "per" and where it came from, as short as it can be: "per REQ-3.2", "per Glossary", or "per decision 3" |
| The sources are silent | "TBD, question {n}". When a recommended answer exists, it follows, marked "Proposed (needs confirmation)" |
| It does not apply | "Does not apply:", then the reason, with its source |

- **Nothing invented** (conventions, "Nothing invented"). No length, list, count or limit is written unless a source states it.
- **"Per Glossary" is a source** only for what the Glossary holds: a term, its definition, a relationship, a value-set and its values. It is never a source for an allowed length, an identifier, or a move between states.
- **No column of sources.** The source goes in the answer itself, and an attribute's evidence in its own column. Nothing else carries a citation.
- **One question for one gap.** The same gap on several attributes, such as "how long can a name be?" for three names, is one question that names all three.

## 4. Sorting what the Glossary holds

The inventory lists every Glossary term. data-model-author sorts each object into one of three, with the words that decide it:

| It is | When | Example |
|---|---|---|
| **an entity** | the product keeps data about it, each one has its own identity, and it holds attributes or is related to other entities. It can be physical, organizational, abstract, or an event | Claim |
| **an attribute** of another entity | it is one piece of information about another entity, and has no identity of its own | a claim's receipt number |
| **not data** | a page, a stage or a view: nothing is kept about it | Home |

Where the words don't decide it, it is a question, and the object is listed under the more likely of the two, marked Proposed (needs confirmation).

**Value-sets.** Each value-set in the Glossary is an attribute of the entity it belongs to. It is a **state** when the entity moves through its values over time, because something happens, such as "approved", "resolved" or "reopened". It is a **classification** when a value is given and kept, such as a priority or a category. A state is modelled in step 4; a classification is only its Data Dictionary entry. Where the words don't decide it, it is a question.

## 5. Finding attributes

An attribute is listed only with the exact words that name it, and where they are: the same discipline as the Glossary's Ontology lens. Look in four places, in this order:
1. the Glossary's value-sets: each one is an attribute of the entity it belongs to
2. the attributes the section drafts noticed: Ontology records each phrase that names one piece of information about a term, with its quote, such as "tagged by category" on a gap
3. each entity's Glossary definition, and the quote it came from, such as "carrying a name, a location, an account, and a health status"
4. every PRD requirement that names a piece of information an entity holds, such as "a project's name is fixed once created"

An everyday word, such as name, email or amount, is never left out because it is everyday. The Glossary leaves those words out on purpose; this is where they belong.

## 6. IDs

| What | ID | Example |
|---|---|---|
| Entity | its Glossary term | Claim |
| Attribute | the entity, a dot, and the attribute's name in lowercase, with hyphens between words. In a table the entity and the name sit in their own columns, or the entity is the heading | Claim.amount |
| Process | P and a number, from 1 | P1 |
| Interface | IF- and a number, from 1 | IF-1 |

IDs never change once the document is accepted. A new item takes the next free number.

## 7. One home for each fact

| Fact | Its home |
|---|---|
| what a term means | the Glossary |
| which entities there are, what each holds, and how they relate | the data model |
| which values an attribute allows | the Data Dictionary |
| which states an entity moves through, and how | the state models |
| where data moves | the data flows |
| what crosses the boundary, and what happens when that fails | the interfaces |

Every other document quotes these by ID. A value is never written afresh somewhere else.

**Never restate the Glossary.** A Glossary term is named, or linked, never copied: not its definition, not a value-set's values, and not its "kind of" links. Another name a source uses for an attribute goes in its Data Dictionary meaning, in brackets.

## 8. Business words

Every document stays at BABOK's conceptual level, in business words (conventions, "Business language"). In particular, never:
- table, column, field, schema, index, primary key or foreign key
- a data type such as string, integer or varchar; write "text of up to 20 characters", "a whole number", "a date"
- how an interface is built: its method, protocol or message format

## 9. Questions and the gate

- After drafting, each skill runs probing-questions-author on its document, writes each question's number where its gap is, then runs `node tools/grade-questions.cjs --project {project}`, as every skill does.
- Then `node tools/check-data-information.cjs --project {project} --document {document}`. Nothing is shown to the specifier while a check fails.
- The gate follows `decision-review-gates.md`: the check's "For the person" block, then the grader's, then the Must answer questions one at a time, then the others in the grader's order, then "Accept the {document}?". The data model's gate also asks the specifier to confirm which workflows follow: "Accept the data model, and confirm which workflows follow?".
- On acceptance, the check's "For the file" block is pasted into the Check record.
