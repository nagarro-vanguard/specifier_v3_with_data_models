<!-- Shape per output-formats.md - "What the section draft must contain". File: deep-dives/<section>/<section>-glossary.md. Copy every heading and column heading exactly as written here - never retype, rename, or recase them (glossary-assembly-principles.md, "How templates use this doc", rule 3). Words: method-words.md. -->
# Section draft - <section name>

<One short paragraph: which part of the source this section is, that it was read on its own through three lenses - the candidates found, how they fit together, how they move - and that it is kept as the evidence behind every glossary entry that comes from it. The glossary's words for these candidates are in this folder's decisions file.>

**Source:** <file>, <sheet or heading>, <item ids covered, one per line>

## Contents

1. [The candidates found](#1-the-candidates-found-ontology)
2. [How they fit together](#2-how-they-fit-together-topology)
3. [How they move](#3-how-they-move-choreography)
4. [Conflicts noticed in this section](#4-conflicts-noticed-in-this-section)
5. [Words dropped](#5-words-dropped)

## How to read this page

What a term, a kind, a family, and a level mean: see [What this glossary contains](../../README.md#what-this-glossary-contains-fixed-block).

**The columns used on this page:**
- **Candidate** - the word as this section of the source writes it, cased per the glossary's rule.
- **Meaning** - what the source says it is, in at most 12 words.
- **Evidence** - the exact quote from the source, and where it is.
- **Re-run** - one of the following; on a new build, every row is `add`:
  - `add` - new: nothing in the glossary covers it.
  - `merge` - the same meaning as a term, under a new word.
  - `change` - an existing term whose meaning has shifted.
  - `no change` - already in the glossary, same meaning.
- **Reads as** - the relationship said as a plain sentence.

**The relationship words:**

| Relationship | What it means | Reads as |
|---|---|---|
| contains | the first is the whole, the second a part of it | Each <child> is part of a <parent>. |
| kind of | the first is the category, the second a member of it | A <child> is one kind of <parent>. |
| reveals | opening the first shows the second | Opening a <parent> shows its <child>. |
| comes before | the first happens, then the second | <First> happens before <second>. |
| produces | the first creates the second | A <first> creates a <second>. |
| locks | the first stops the second from happening | <First> stops <second> from happening. |
| unlocks | the first lets the second happen | <First> lets <second> happen. |

---

## 1. The candidates found (ontology)

**What you're reading.** <the words this section of the source uses for objects, people, stages, and conditions>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <...>

**Objects.** <One line.>

| # | Candidate | Meaning | Evidence | Re-run |
|---|---|---|---|---|
| 1 | <Candidate> | <meaning> | "<quote>" - <where> | add |

**Roles.** <One line.>

<same table, or "None.">

**Steps.** <One line.>

<same table, or "None.">

**States and values.** <One line.>

| # | Candidate | Meaning | Evidence | Re-run |
|---|---|---|---|---|
| 1 | <Candidate> | <value, one per line> | "<quote>" - <where> | add |

---

## 2. How they fit together (topology)

**What you're reading.** <...>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <...>

**The tree (text tree).** <One line.>

```
<Candidate>
└── <Candidate>
```

**The picture (diagram).** <One line; a dotted line is "kind of".>

```mermaid
flowchart TD
    <the same rows; kind of as a dotted line labelled "kind of"; safe camelCase ids; no subgraphs>
```

**The level table (levels).** <One line.>

| L1 | L2 | L3 | Relationship to the candidate above | Kind |
|---|---|---|---|---|
| <Candidate> | | | - | <kind> |
| | <Candidate> | | part of a <candidate> | <kind> |

**Candidates that also belong elsewhere (lookup).** <One line.>

| Candidate | Shown under | Also a kind of | Also part of | Also shown or created by | Takeaways |
|---|---|---|---|---|---|
| <...> | <...> | <...> | <...> | <...> | <takeaway, one per line, from the closed list in G5 rule 4> |

**Every relationship, as a table (verbatim).** <One line: the source of truth, with the quote that states each relationship.>

| Parent | Relationship | Child | Reads as | Evidence |
|---|---|---|---|---|
| <Parent> | <relationship> | <Child> | <reads as> | "<quote>" - <where> |

---

## 3. How they move (choreography)

**What you're reading.** <...>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <...>

**States each candidate can be in.** <One line.>

| Belongs to | States | Evidence |
|---|---|---|
| <Candidate> | <state, one per line> | "<quote>" - <where> |

**The flow, step by step.** <One line.>

1. <First step>
   - <reads-as sentence>

**Every flow relationship, as a table (verbatim).** <One line.>

| First | Relationship | Second | Reads as | Evidence |
|---|---|---|---|---|
| <A> | <relationship> | <B> | <reads as> | "<quote>" - <where> |

**The picture (diagram).** <One line.>

```mermaid
flowchart TD
    <the same flow relationships; safe camelCase ids; no subgraphs>
```

---

## 4. Conflicts noticed in this section

**What you're reading.** <...>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <...>

| Conflict type | Words | Evidence |
|---|---|---|
| <a conflict type, from the list in method-words.md> | <word, one per line> | "<quote>" - <where>, one per line |

---

## 5. Words dropped

**What you're reading.** <...>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <...>

| Phrase | Dropped | Why |
|---|---|---|
| "<phrase>" | <word> | <the DROP-list reason from lens1-ontology.md> |

---

## Related pages

| Page | Why it relates |
|---|---|
| [<section>-decisions.md](<section>-decisions.md) | the glossary's word for each candidate in this draft, and the decision behind it |
| [glossary-assembly-draft.md](../glossary-assembly-draft.md) | where this section is joined with the others |
| [gate-log.md](../gate-log.md) | how each question raised from this section was decided |
