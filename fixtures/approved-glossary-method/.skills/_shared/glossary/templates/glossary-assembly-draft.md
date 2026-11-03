<!-- Shape per output-formats.md - "What the assembly draft must contain". File: deep-dives/glossary-assembly-draft.md. Copy every heading and column heading exactly as written here - never retype, rename, or recase them (glossary-assembly-principles.md, "How templates use this doc", rule 3). Words: method-words.md. -->
# Assembly draft - <glossary>

**Status:** <proposed, before Gate 1 | updated after Gate 1 on <date>>

This is the assembly draft of the whole source. Each section was first read on its own; this page puts those sections together, so a candidate that several sections use appears once, and you can see how the candidates relate across the whole product. It is made before Gate 1 and kept afterwards as evidence. It holds no decisions: every question it raises is in [gate-log.md](gate-log.md).

**Sections joined** (in the source's order):
- [<section-1>](<section-1>/<section-1>-glossary.md)
- [<section-2>](<section-2>/<section-2>-glossary.md)

## Contents

1. [The joined hierarchy](#1-the-joined-hierarchy)
2. [The joined flow](#2-the-joined-flow)
3. [Candidates dropped, and why](#3-candidates-dropped-and-why)

## How to read this page

What a term, a kind, a family, and a level mean: see [What this glossary contains](../README.md#what-this-glossary-contains-fixed-block). Families are not chosen until Gate 1, so this draft does not group candidates by family.

- **A proposed merge** is a candidate written as `<Word> (also written as: <other word>)`. It means the sections use several words for what we believe is one meaning. The first word is the one we recommend. You confirm or override the merge in the gate log row named in the proposed-merges table. If you override it, this page is updated after Gate 1 to match your resolution.
- **Relationship to the candidate above** - in plain words: part of, a kind of, shown when opened, or created by.
- **Reads as** - a relationship said as a plain sentence.

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

## 1. The joined hierarchy

**What you're reading.** <...>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <and that, after the gates, this is used to build the hierarchy, the lookup and the family views in terms-and-relationships.md, and the groups in object-terms.md>

**The level table (levels).** <One line.>

| L1 | L2 | L3 | Relationship to the candidate above | Kind |
|---|---|---|---|---|
| <Candidate> | | | - | <kind> |
| | <Word> (also written as: <other word>) | | part of a <candidate> | <kind> |

**Candidates that also belong elsewhere (lookup).** <One line.>

| Candidate | Shown under | Also a kind of | Also part of | Also shown or created by | Takeaways |
|---|---|---|---|---|---|
| <...> | <...> | <...> | <...> | <...> | <takeaway, one per line, from the closed list in G5 rule 4> |

**Proposed merges.** <One line: several words that we believe have one meaning, each decided in the gate log.>

| Recommended word | Also written as | Where each word appears | Decided in |
|---|---|---|---|
| <Word> | <other word, one per line> | <each word with its section links, one per line> | [<G1-nn>](gate-log.md#g1-nn) |

**Not placed in the hierarchy (not placed).** <One line.>

| Candidate | Where else it appears |
|---|---|
| <Candidate> | <in the flow (part 2), or nowhere else: the sources name it but never relate it to another candidate> |

---

## 2. The joined flow

**What you're reading.** <...>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <and that, after the gates, this is used to build step-terms.md and states-and-values.md>

**The flow, step by step.** <One line.>

1. <First step>
   - <reads-as sentence>

**Every flow relationship, as a table (verbatim).** <One line.>

| First | Relationship | Second | Reads as |
|---|---|---|---|
| <A> | <relationship> | <B> | <reads as> |

**The picture (diagram).** <One line.>

```mermaid
flowchart TD
    <the same flow relationships; a term in a state is written "Term: state"; safe camelCase ids; no subgraphs>
```

**States each candidate can be in.** <One line.>

| Belongs to | States |
|---|---|
| <Candidate> | <state, one per line> |

---

## 3. Candidates dropped, and why

**What you're reading.** <...>
**Why it matters.** <...>
**What to do with it.** <...>
**What it affects.** <and that each section's decisions file lists these words as dropped, with the test they failed>

| Candidate | Found in | Test failed | Why |
|---|---|---|---|
| <Candidate> | [<section>](<section>/<section>-glossary.md) | <special meaning / consequence / reach> | <one line, with a short quote from the source> |

---

## Related pages

| Page | Why it relates |
|---|---|
| [gate-log.md](gate-log.md) | every question this assembly draft raises, and how each was decided |
| `<section>/<section>-glossary.md` | one section's own reading, with the source quotes behind every relationship |
| [../terms-and-relationships.md](../terms-and-relationships.md) | the final hierarchy, built from part 1 with the agreed words |
