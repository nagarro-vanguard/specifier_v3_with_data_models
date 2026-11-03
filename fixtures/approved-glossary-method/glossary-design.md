# The glossary method - overview

> **What this is** - a short explanation of what the glossary method does and how its parts fit together, for someone meeting it for the first time.
> **What it is not** - an instruction. No skill, prompt, or agent acts on this page; they follow the docs it points to. It restates no rule: every rule lives in the doc named beside it.
> **Related docs**
>
> - words: `.skills/_shared/glossary/method-words.md`
> - method: `.skills/_shared/glossary/otc-methodology.md`
> - skills: `skill-orchestration.md`
>
> **Next step** - read `otc-methodology.md`.

---

## 1. Why a glossary

A source written by several people over several weeks rarely uses one word per meaning. In an online store's requirements, for example:

- one meaning is written three ways:
  - cart
  - basket
  - bag
- one word has two meanings: order is a customer's purchase in one place, and the sort sequence of a list in another.
- a word is weak: "quick ship" does not say quick by what measure.

The glossary settles each of these once. Every term has one word and one meaning, and the glossary also shows how the terms relate: what is part of what, and what comes before what. Every later document is then held to those words.

## 2. How a source is read

A source is divided into sections, taken from its own headings (`otc-methodology.md`, "Sections"). Each section is read three ways, in this order:

| Lens | What it finds | Doc |
|---|---|---|
| Ontology | the candidates the section names | `lens1-ontology.md` |
| Topology | the structure relationships between them | `lens2-topology.md` |
| Choreography | the flow relationships, and the states | `lens3-choreography.md` |

Each section's three readings are written to its section draft. The section drafts are then joined into one assembly draft (`output-formats.md`, "What the assembly draft must contain").

## 3. How a word becomes a term

| Stage | What it is | Settled by |
|---|---|---|
| Word | any word or phrase as a source writes it | - |
| Candidate | a word Ontology keeps for judging | the keep and drop lists in `lens1-ontology.md` |
| Term | a candidate that passed the three tests and Gate 1 | the three tests in `otc-run-rules.md`, then a person at Gate 1 |
| Definition | the agreed meaning of a term | a person at Gate 2 |

The method recommends; a person decides. A gate stops the run until every gate row is resolved (`otc-run-rules.md`, "The gates"). Every decision is recorded in the decision register.

## 4. The three skills

| Skill | What it does | Reads | Writes |
|---|---|---|---|
| harvest | builds or updates the glossary | the sources | the seven glossary pages and `deep-dives/` |
| check | measures a document against the glossary; it changes nothing | a document and the seven glossary pages | the check findings, shown in the conversation |
| disposition | acts on a finding, through a gate | the check findings, or a request to change a term | the changed pages, a decision register row, and the ripple list |

When to use each skill is in `skill-orchestration.md`. What each one reads and writes, step by step, is in its own `SKILL.md`.

## 5. What the method produces

**The glossary** - seven pages in `Output/glossary/` (`output-formats.md`, "The output"):
- `README.md`
- `terms-and-relationships.md`
- `object-terms.md`
- `role-terms.md`
- `step-terms.md`
- `states-and-values.md`
- `decision-register.md`

**The evidence** - `Output/glossary/deep-dives/`, kept with the glossary:
- one section draft and one section decisions page for each section
- the assembly draft
- the gate log

Every page is built from its template in `.skills/_shared/glossary/templates/`, by the rules in `glossary-assembly-principles.md`.

## 6. The words this method uses

Every word on this page has one meaning, defined once in `method-words.md`. No doc, skill, template, or page defines a word of its own.
