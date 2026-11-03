# Data and Information workflows: design

> **What this is:** The design of three small workflows that build the product's Data and Information model: what the product holds, which values each thing allows, how things move through their states, and where data flows. They run right after the Glossary.
>
> **What it is not:** A change to the files already in `.claude/`. The new files sit in the root folder for now, and section 9 lists what changes when they move in.
>
> **Grounded in:** the BABOK Guide v3, `_reference/BABOKV3.pdf`, by technique name.

## 1. Purpose

Requirements name what a product holds, and the values each thing carries, usually in passing. For example, "a claim with a receipt" names one thing, a claim, and one of its values, its receipt. Before a value can be built or tested, it needs answers:
- what it means
- which values it allows
- whether it can be left out
- what tells one apart from another
- how it starts, changes and ends
- what happens when it is wrong

These workflows ask those questions of every value, the way BABOK's Data and Information techniques define them. Every later artifact is then:

| Quality | Because |
|---|---|
| Complete | every value is listed by a program and a fixed procedure, not from memory |
| Testable | every value ends with its allowed values |
| Traceable | every answer names its source, or the specifier's decision |
| Honest | a value the sources leave silent becomes a question, never a guess |
| Consistent | each fact has one home, and later documents quote it by ID |

## 2. The workflows

BABOK groups six techniques under its Data and Information model category: Glossary, Data Modelling, Data Dictionary, State Modelling, Data Flow Diagrams and Interface Analysis. A concept model, it says, starts from a glossary. The work is split into small workflows, each ending in documents the specifier accepts:

| Workflow | BABOK techniques | Runs | Writes | Next |
|---|---|---|---|---|
| `glossary-author`, already in the kit | • Glossary<br>• Concept Modelling | always | • the Glossary<br>• the inventory, kept current as it goes | `data-model-workflow` |
| `data-model-workflow` | • Data Modelling<br>• Data Dictionary | always | • data model<br>• Data Dictionary | the workflow the data model confirms next |
| `state-model-workflow` | State Modelling | when the data model confirms that an entity moves through states | state models | `data-flow-workflow` when confirmed, otherwise `features-and-epics-workflow` |
| `data-flow-workflow` | • Data Flow Diagrams<br>• Interface Analysis | when the data model confirms that data moves to or from someone or something outside the product | • data flows<br>• interfaces | `features-and-epics-workflow` |

## 3. Gated moves

As in every other workflow:
- Each step stops at its own gate, and the next step starts only once it is accepted.
- Which of the two conditional workflows run is the specifier's call, made at the data model's gate: **"Accept the data model, and confirm which workflows follow?"** It works the way the EPIC grouping's gate confirms which EPICs get an EPIC brief.
- `route-data-workflows.cjs` reads the accepted data model and names the next workflow. Each workflow ends by running it.

**data-model-workflow**

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `data-model-author` | start: Glossary written | • inventory<br>• Glossary<br>• PRD | none | • data model<br>• Question log | `check-data-information.cjs` | Accept the data model, and confirm which workflows follow? | 2 |
| 2 | `data-dictionary-author` | 1 | data model | • Glossary<br>• PRD | • Data Dictionary<br>• Question log | `check-data-information.cjs` | Accept the Data Dictionary? | 3 |
| 3 | `route-data-workflows.cjs` | 2 | data model | none | none | none | none | the workflow it names |

**state-model-workflow**

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `state-model-author` | start: the data model confirms it, and the Data Dictionary is accepted | • data model<br>• Data Dictionary | • Glossary<br>• PRD | • state models<br>• Question log | `check-data-information.cjs` | Accept the state models? | 2 |
| 2 | `route-data-workflows.cjs` | 1 | data model | none | none | none | none | the workflow it names |

**data-flow-workflow**

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `data-flow-author` | start: the data model confirms it, and the workflows before it are accepted | • data model<br>• Data Dictionary | • Glossary<br>• PRD | • data flows<br>• Question log | `check-data-information.cjs` | Accept the data flows? | 2 |
| 2 | `interface-author` | 1 | • data flows<br>• Data Dictionary | PRD | • interfaces<br>• Question log | `check-data-information.cjs` | Accept the interfaces? | 3 |
| 3 | `route-data-workflows.cjs` | 2 | data model | none | none | none | none | `features-and-epics-workflow` |

## 4. Concept Modelling, during the Glossary run

The inventory doesn't wait for the Glossary to finish. It is built as the Glossary is:
- **After each section draft,** and again **when the seven pages are written**, `glossary-author` runs `build-data-inventory.cjs`. When `data-model-workflow` starts, the inventory is already current.
- **Ontology records attributes.** It already reads every noun phrase, with its quote, and drops the ones that aren't terms. A phrase that names one piece of information about a term goes into a new part of the section draft, "Attributes noticed", with the term and the quote, instead of being lost. For example, the Analysis section draft of the continuum Glossary dropped "category" as "an attribute of a gap, carried by its row". Recorded instead, it reaches the data model as Gap.category, with its quote.

What the inventory takes from the Glossary run:

| From | It takes |
|---|---|
| each section draft | • the candidates, with their quotes<br>• the relationships Topology found<br>• the states and flow links Choreography found<br>• the attributes noticed |
| the seven pages, once written | • the agreed terms, which replace the section drafts' words<br>• each object's definition and the term above it: part of, a kind of, shown when opened<br>• each value-set, the term it belongs to, and its values<br>• the earlier words, so a section draft's old word is read as the agreed one |

## 5. What each technique asks

Every item is how BABOK defines its technique. What the Glossary already holds is named or linked, never restated: a term's meaning, how terms nest, a value-set's values, and its "kind of" links.

| Technique | Of each | It asks |
|---|---|---|
| Data Modelling | entity | • its identifier<br>• how it starts, and how it ends<br>• its attributes<br>• whether who created or changed it is recorded<br>• any restriction on creating, changing or using it<br>• any security, privacy or audit limit |
| Data Modelling | relationship | how many of the other: exactly 1, 0 or 1, 1 or more, or 0 or more |
| Data Dictionary | attribute | • its meaning<br>• its allowed values, or the value-set it holds<br>• whether it can be left out<br>• whether it repeats |
| State Modelling | entity that moves through states | • what can be done in each state<br>• each move, with its event, condition and actions<br>• where it starts and ends, and whether it can go back |
| Data Flow Diagrams | product | • the externals, processes and data stores<br>• each data flow, from → to, and the data it moves |
| Interface Analysis | external | • who uses it, and why<br>• what passes in and out<br>• how much, when, and how often<br>• the checks on what comes in<br>• what starts an exchange, and what happens when one fails |

## 6. How every item is answered

| Answer | Written as |
|---|---|
| A source says it | the answer, then "per" and where: "per REQ-3.2", "per Glossary" |
| The sources are silent | "TBD, question {n}" |
| It does not apply | "Does not apply:" and why |

No table has a column of sources: the source sits in the answer, and an attribute's evidence in its own column.

**IDs.** An attribute is its entity, a dot and its name, such as Gap.category. A process is P1, P2; an interface IF-1, IF-2.

**One home for each fact.** Meaning in the Glossary; entities, attributes and how many in the data model; allowed values in the Data Dictionary; moves in the state models; movement in the data flows; exchanges in the interfaces. An FRD rule quotes them by ID.

## 7. The checks

`check-data-information.cjs` runs before every gate. Beyond the checks every document gets, it fails when:

| Document | Fails when |
|---|---|
| Data model | • a Glossary object or value-set isn't an entity, an attribute, or "Not data"<br>• an attribute the section drafts noticed isn't carried<br>• an entity's item is blank<br>• a relationship doesn't say how many, or has no row the other way<br>• an attribute has no evidence<br>• "The workflows that follow" doesn't say whether each runs |
| Data Dictionary | • an attribute has no entry, or an entry has no attribute<br>• an item is blank<br>• an attribute that holds a value-set doesn't name it |
| State models | • a confirmed state attribute has no model<br>• a value of its value-set isn't a state<br>• a move joins an unknown state |
| Data flows | • an external, process or store has no flow<br>• a process has no flow in, or none out<br>• a flow names data that isn't in the data model |
| Interfaces | • an external has no interface<br>• an element in an interface isn't in the Data Dictionary |

## 8. Example

A worked example, the Analysis family of the continuum Glossary, capabilities FRD-4a and FRD-4b, through every step, is in [DATA-MODEL-EXAMPLE.md](DATA-MODEL-EXAMPLE.md).

## 9. The files

Created in the root folder for now:

| File, in the root folder | Moves to |
|---|---|
| • `data-model-workflow/SKILL.md`<br>• `state-model-workflow/SKILL.md`<br>• `data-flow-workflow/SKILL.md` | `.claude/skills/` |
| • `data-model-author/SKILL.md`<br>• `data-dictionary-author/SKILL.md`<br>• `state-model-author/SKILL.md`<br>• `data-flow-author/SKILL.md`<br>• `interface-author/SKILL.md` | `.claude/skills/` |
| `_shared/data-information.md`, the rules the five skills share | `.claude/skills/_shared/` |
| `_shared/templates/`:<br>• `data-model.md`<br>• `data-dictionary.md`<br>• `state-models.md`<br>• `data-flows.md`<br>• `interfaces.md` | `.claude/skills/_shared/templates/` |
| • `tools/build-data-inventory.cjs`<br>• `tools/check-data-information.cjs`<br>• `tools/route-data-workflows.cjs`<br>• `tools/lib/data-information.cjs`<br>• `tools/tests/data-information.test.cjs` | stay: `tools/` is already their home |

**Changes to files already in `.claude/`,** made at the move:

| File | Change |
|---|---|
| `glossary-author/SKILL.md` | run `build-data-inventory.cjs` after each section draft and after the pages are written; next step `data-model-workflow` |
| `_shared/glossary/lens1-ontology.md`, `_shared/glossary/templates/section-glossary.md`, `_shared/glossary/output-formats.md` | the "Attributes noticed" part of the section draft: Phrase, Belongs to, Evidence |
| `_shared/project-folders.md` | the `data/` folder and its six files |
| `_shared/conventions.md` | the five documents in "Kinds of document"; the IDs for an attribute, a process and an interface |
| `features-and-epics-workflow/SKILL.md` | starts when the Data and Information workflows have ended |
| `_shared/templates/frd.md`, `frd-author`, `tools/check-frd.cjs` | Data links into the data model; the Standard questions section goes; rules quote data elements by ID |
| `tools/accept.cjs`, `tools/traceability-map.cjs` | the five new documents |

## 10. Proving it

Run the workflows on two projects, without changing their documents:
1. one whose sources state their data rules: every rule they state must land as an answer "per" its source
2. one whose sources don't: every value they leave silent must come out as a question
3. count the "Does not apply" answers, and narrow any item that is "Does not apply" almost everywhere
