# Data and Information workflows: example

> **What this is:** One family of the continuum Glossary, Analysis, taken through the Data and Information workflows: what each step reads, what it writes and what it asks.
>
> **What it is not:** The design itself, which is in [DATA-MODEL-DESIGN.md](DATA-MODEL-DESIGN.md). Nothing here is decided.

**Capabilities**

| Capability | What it covers |
|---|---|
| FRD-4a Analysis - the read | the quick analysis of every repository, the reading order, steering the run, and the deep analysis of one repository. REQ-4.1 to REQ-4.5 |
| FRD-4b Analysis - the results | what a deep analysis presents: the as-is by domain, the architecture, the gaps, and every finding traced to its evidence. REQ-4.6 to REQ-4.10 |

It uses the continuum Glossary and PRD as they stand today. Each part shows one step:
- **Reads:** what it takes from the Glossary and the steps before it
- **Writes:** an excerpt of its document, in that document's own columns
- **Asks:** the questions it raises at its gate. The numbers are for this example only.

An arrow reads "to": a term to its value-set, one entity to another, one state to the next, or where data moves from and to.

## 1. The data model, FRD-4b

**Reads**

| From | What |
|---|---|
| Glossary, objects | Result, Finding, Gap, Module |
| Glossary, links | • Result contains Finding<br>• Coupling is a kind of Finding |
| Glossary, value-set | Finding → Coverage: {Verified; Held as unknown} |
| Section draft, attribute noticed | Gap → category: "tagged by category", REQ-4.8 |

**Writes**, in `data/data-model.md`

| Entity | Identifier | Starts when | Ends when |
|---|---|---|---|
| Result | TBD, question 1 | a deep analysis presents it, per REQ-4.5 | TBD, question 2 |
| Finding | TBD, question 3 | a deep analysis produces it, per Glossary | with its result, per Glossary |

| Entity | Attribute | Evidence | From the Glossary |
|---|---|---|---|
| Gap | severity | "ranked by severity", REQ-4.8 | - |
| Gap | category | "tagged by category", REQ-4.8 | - |
| Finding | coverage | "what it verified", REQ-4.10 | Coverage |
| Module | coupling | "and coupling", REQ-4.6 | Coupling, Proposed (needs confirmation), question 4 |

| Relationship | How many |
|---|---|
| Result → Repository | exactly 1, per Glossary |
| Repository → Result | TBD, question 5 |
| Finding → Evidence | 1 or more, per REQ-4.9 |

**Asks**

| Question | Asks |
|---|---|
| 1 | What tells one result from another? |
| 2 | When does a result end? |
| 3 | What tells one finding from another? |
| 4 | Is Coupling a kind of Finding, as the Glossary has it, or part of a module, as REQ-4.6 reads? |
| 5 | Does a repository keep more than one result, or does a new deep analysis replace it? |

## 2. The Data Dictionary, FRD-4b

**Reads**

| From | What |
|---|---|
| Data model | Gap.severity, Gap.category, Finding.coverage |
| Glossary, value-set | Finding → Coverage: {Verified; Held as unknown} |

**Writes**, in `data/data-dictionary.md`

| Entity | Attribute | Meaning | Allowed values | Can be left out | Repeats |
|---|---|---|---|---|---|
| Gap | severity | how serious it is, per REQ-4.8 | TBD, question 6 | TBD, question 6 | once, per REQ-4.8 |
| Gap | category | what kind of shortfall it is, per REQ-4.8 | TBD, question 7 | TBD, question 7 | TBD, question 7 |
| Finding | coverage | Coverage, per Glossary | Coverage, per Glossary | no, per REQ-4.10 | once, per REQ-4.10 |

**Asks**

| Question | Asks |
|---|---|
| 6 | Which severity levels are there, and in what order? |
| 7 | Which categories are there, and does a gap have one or several? |

## 3. The state models, FRD-4a

**Reads**

| From | What |
|---|---|
| Glossary, value-sets | • Quick analysis → Scan run state: {Running; Paused; Stopped; Restarted}<br>• Quick analysis → Scan result: {Complete; Incomplete} |
| Glossary, flow link | Quick analysis, when Stopped, locks Deep analysis |
| Data model, The workflows that follow | Quick analysis run.state, a state: its gate confirmed that one run is something the product keeps |

**Writes**, in `data/state-models.md`

| Entity | State held in | Starts in | Ends in | Can go back or skip |
|---|---|---|---|---|
| Quick analysis run | state | Running, per REQ-4.3 | TBD, question 8 | TBD, question 9 |

| Move | Event | Condition | Actions |
|---|---|---|---|
| Running → Paused | paused, per REQ-4.3 | while running, per REQ-4.3 | TBD, question 10 |
| Paused → Running | resumed, per REQ-4.3 | while paused, per REQ-4.3 | TBD, question 10 |
| Running → Stopped | stopped, per REQ-4.3 | while running, per REQ-4.3 | results incomplete, and Deep analysis locked, per Glossary and REQ-4.4 |

The flow link becomes the action on Running → Stopped: while the run is Stopped, the deep analysis can't start.

**Asks**

| Question | Asks |
|---|---|
| 8 | Where does a run end: in Complete, from Scan result? |
| 9 | Is Restarted a state, or the move Stopped → Running? |
| 10 | What else happens when a run is paused or resumed? |

## 4. The data flows and the interfaces, FRD-4a

**Reads**

| From | What |
|---|---|
| Glossary, steps | Quick analysis, Deep analysis |
| Glossary, flow link | Quick analysis comes before Deep analysis |
| Glossary, terms | Person, Provider |
| PRD | REQ-4.1: repositories are read from outside the product |

**Writes**, in `data/data-flows.md`

| Process | Name | Glossary step |
|---|---|---|
| P1 | Scan the repositories | Quick analysis |
| P2 | Read a repository in depth | Deep analysis |

| Data flow | Moves | Data |
|---|---|---|
| Repository content | Code host → P1 | Repository |
| Recommended order | P1 → Person | Reading order |
| Findings | P2 → Results | • Finding<br>• Gap.severity |

**Writes**, in `data/interfaces.md`, for IF-1 Code host

| Item | Answer |
|---|---|
| What passes in | Repository |
| When, and how often | each quick or deep analysis, per REQ-4.1 and REQ-4.5 |
| When an exchange fails | TBD, question 12 |

**Asks**

| Question | Asks |
|---|---|
| 11 | The code host is outside the product, but the Glossary has no word for it. What is it called? |
| 12 | When a repository can't be reached, what happens, and what is the person told? |
