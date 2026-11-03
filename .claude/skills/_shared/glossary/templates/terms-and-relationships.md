<!-- Assembled per glossary-assembly-principles.md - Part B: terms-and-relationships. Copy every heading and column heading exactly as written here - never retype, rename, or recase them (glossary-assembly-principles.md, "How templates use this doc", rule 3). Words: method-words.md. -->
# Terms and their relationships

{One short paragraph: this page shows how the terms in {product} relate to each other in structure - what is part of what, what is a kind of what, what is shown when what is opened - first as one hierarchy for the whole product, then family by family. It covers terms of every kind the sources relate. What happens in what order is in step-terms.md.}

## Contents

1. [Families at a glance](#1-families-at-a-glance-index)
2. [The whole hierarchy, level by level](#2-the-whole-hierarchy-level-by-level-hierarchy)
3. [Each family, one by one](#3-each-family-one-by-one-family-views)

## How to read this page

These words mean the same on every page. They are copied from the method's word list, `method-words.md`.

| Word | Means |
|---|---|
| Source | A document the glossary is built from. It is read, never changed. |
| Section | One part of a source, read on its own, taken from the source's own headings, in source order, and fixed before reading starts. Not the same as a family: a section is how we read. |
| Candidate | A word Ontology keeps for judging. It is not yet a term. |
| The three tests | The tests a candidate must all pass to become a term:<br>• special meaning<br>• consequence<br>• reach |
| Term | A candidate that passed the three tests and Gate 1. Gate 2 then agrees its definition. |
| Kind | Which of the four kinds a term is. Not the same as the relationship word "kind of". |
| Family | A group of terms the glossary's pages are arranged by, decided at Gate 1, usually from the source's top-level groups. Not the same as a section: a family is how a reader browses. |
| Gate | A point where a person decides. The run stops until every gate row is resolved. |
| Level | How far down the hierarchy a term sits, written L1, L2 and so on. L1 is the top. |

**The four kinds:**

| Kind | Means | Defined in |
|---|---|---|
| object | something the product stores, shows, or acts on | [object-terms.md](object-terms.md) |
| role | a person the product serves, records, or gives access to | [role-terms.md](role-terms.md) |
| step | a named stage of the work | [step-terms.md](step-terms.md) |
| state or value | a condition a term can be in, or one member of a closed set | [states-and-values.md](states-and-values.md) |

How the families were chosen: [D-n](decision-register.md#d-n).

**The relationship words:**

| Relationship | What it means | Reads as |
|---|---|---|
| contains | the first is the whole, the second a part of it | Each {child} is part of a {parent}. |
| kind of | the first is the category, the second a member of it | A {child} is one kind of {parent}. |
| reveals | opening the first shows the second | Opening a {parent} shows its {child}. |
| produces | the first creates the second | A {parent} creates a {child}. |

**How to read a level table:**

| Column | What it means |
|---|---|
| L1 to Ln | the term sits in the column of its level |
| Relationship to the term above | in plain words: part of, a kind of, shown when opened, or created by |
| Kind | • object<br>• role<br>• step<br>• state or value |
| Home family | the family the term belongs to. "(context)" marks a term from another family, shown only so the terms below it have a parent. |

Each term appears once in the hierarchy. Where it also belongs elsewhere, the table that follows says where, and what that means. Where the sources state a relationship that skips a level - A contains C, when A contains B and B contains C - it is implied by the levels and not shown again.

---

## 1. Families at a glance (index)

**What you're reading.** {...}
**Why it matters.** {...}
**What to do with it.** {...}
**What it affects.** {...}

| Family | What it covers | L1 terms (origin) | Terms |
|---|---|---|---|
| [{Family}](#{family-anchor}) | {what it covers} | {[term](#row-anchor), one per line} | {kind: [n](page#anchor), one per line} |

---

## 2. The whole hierarchy, level by level (hierarchy)

**What you're reading.** {...}
**Why it matters.** {...}
**What to do with it.** {...}
**What it affects.** {...}

| L1 | L2 | L3 | Relationship to the term above | Kind | Home family |
|---|---|---|---|---|---|
| <a id="{row-anchor}"></a>{Term} | | | - | {kind} | [{Family}](#{family-anchor}) |
| | <a id="{row-anchor}"></a>{Term} | | part of a {term} | {kind} | [{Family}](#{family-anchor}) |

**Terms that also belong elsewhere (lookup).** {One line: each term above that has another parent, where else it belongs, and what that means.}

| Term | Shown under | Also a kind of | Also part of | Also shown or created by | Takeaways |
|---|---|---|---|---|---|
| [{Term}](#row-anchor) | [{Term}](#row-anchor) | {[term](#row-anchor), one per line, or -} | {[term](#row-anchor), one per line, or -} | {[term](#row-anchor), one per line, or -} | {takeaway, one per line, from the closed list in G5 rule 4} |

---

## 3. Each family, one by one (family views)

**What you're reading.** {...}
**Why it matters.** {...}
**What to do with it.** {...}
**What it affects.** {...}

### {Family}

{One line: what this family covers.}

**The tree (text tree).** {One line: this family's terms, under the term each sits under.}

```
{Term} (from {family})
└── {Term}
    └── {Term}
```

**The picture (diagram).** {One line: the same rows, drawn. A dotted line is "kind of".}

```mermaid
flowchart TD
    {the same rows; kind of as a dotted line labelled "kind of"; a term from another family labelled with its family; safe camelCase ids; no subgraphs}
```

**Its slice of the hierarchy (family slice).** {One line: this family's rows of part 2, at the same levels.}

| L1 | L2 | L3 | Relationship to the term above | Kind | Home family |
|---|---|---|---|---|---|
| {Term} | | | - | {kind} | [{Family}](#{family-anchor}) (context) |
| | {Term} | | part of a {term} | {kind} | [{Family}](#{family-anchor}) |

**Terms that also belong elsewhere (lookup).** {One line: this family's rows of the lookup in part 2.}

| Term | Shown under | Also a kind of | Also part of | Also shown or created by | Takeaways |
|---|---|---|---|---|---|
| {...} | {...} | {...} | {...} | {...} | {...} |

**Also in this family, not placed in the hierarchy (not placed).** {One line: this family's terms the sources never place under or over another term.}

| Term | Where else it appears |
|---|---|
| {Term} | {in the flow: see step-terms.md, or nowhere else: the sources name it but never relate it to another term - a gap to raise with the source's owner} |

{repeat for every family, in family order}

---

## Related pages

| Page | Why it relates |
|---|---|
| [object-terms.md](object-terms.md) | the definition of every object on this page, family by family |
| [step-terms.md](step-terms.md) | what happens in what order - the flow this page leaves out |
