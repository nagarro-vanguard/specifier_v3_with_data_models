<!-- Assembled per glossary-assembly-principles.md - Part B: step-terms. Copy every heading and column heading exactly as written here - never retype, rename, or recase them (glossary-assembly-principles.md, "How templates use this doc", rule 3). Words: method-words.md. -->
# Steps

{One short paragraph: the named stages of the work in {product} - the main stages in order, what controls them, and the actions that happen throughout - and a definition for each of the {n} step terms. The only page that shows the flow.}

## How to read this page

{The G4 fixed block, copied exactly from README.md.}

**The columns used on this page:**
- **Term** - the agreed word for the stage or action.
- **What it is** - the definition.
- **In the flow** - every flow relationship the step takes part in, as a plain sentence, one per line.
- **Home family** - the family it comes from, as a link to that family's view.
- **Source** and **Decision** - where the sources define it, and the decision that settled it.

**The columns of Terms replaced or retired over time:**
- **Earlier word** - a word the glossary no longer uses.
- **What happened** - one of:
  - renamed
  - merged
  - split
  - withdrawn
- **Use now** - the current term to use instead, as a link to its definition. It is `-` when the word was withdrawn with nothing in its place.
- **Decision** - a link to the decision that replaced or retired it.
- **Date** - the date of that decision.

**The flow words:**

| Relationship | What it means | Reads as |
|---|---|---|
| comes before | the first happens, then the second | {First} happens before {second}. |
| produces | the first creates the second | A {first} creates a {second}. |
| locks | the first stops the second from happening | {First} stops {second} from happening. |
| unlocks | the first lets the second happen | {First} lets {second} happen. |

A term in a state is written "Term: state". The flow is shown three ways: a numbered list, a table, and a picture. If they seem to disagree, trust the table.

---

## The flow, step by step (forward thread)

**What you're reading.** {...}
**Why it matters.** {...}
**What to do with it.** {...}
**What it affects.** {...}

1. {First step}
   - {reads-as sentence}

| First | Relationship | Second | Reads as |
|---|---|---|---|
| {A} | {relationship} | {B} | {reads as} |

```mermaid
flowchart TD
    {the same relationships; safe camelCase ids; no subgraphs}
```

---

## Actions that happen throughout (supporting actions)

{the same shape as the part above}

---

## The terms

**What you're reading.** {...}
**Why it matters.** {...}
**What to do with it.** {...}
**What it affects.** {...}

| Term | What it is | In the flow | Home family | Source | Decision |
|---|---|---|---|---|---|
| <a id="{term-anchor}"></a>{Step} | {definition} | {reads-as sentence, one per line} | [{Family}](terms-and-relationships.md#{family-anchor}) | {source} | {decision or -} |

## Steps not in the flow

{One line.}

| Term | Where else it appears |
|---|---|
| {Step} | {in the hierarchy: see [its row](terms-and-relationships.md#row-anchor), or nowhere else ...} |

---

## Terms replaced or retired over time

**What you're reading.** {...}
**Why it matters.** {...}
**What to do with it.** {...}
**What it affects.** {...}

Filled in by a program from the gate log. Never edit by hand.

| Earlier word | What happened | Use now | Decision | Date |
|---|---|---|---|---|
| {Earlier word} | {renamed / merged / split / withdrawn} | {[Term](#term-anchor), one per line, or -} | [D-n](decision-register.md#d-n) | {date} |

<!-- Order per G8 rule 6: rows that point to the same current term sit together, the groups in the order those terms appear above, the latest change first; rows with - in Use now come last, latest first. With no rows, the table is replaced by one line: None yet. -->

---

## Related pages

| Page | Why it relates |
|---|---|
| [terms-and-relationships.md](terms-and-relationships.md) | the structure the flow moves through |
| [object-terms.md](object-terms.md) | the objects each step creates and uses, defined in full |
