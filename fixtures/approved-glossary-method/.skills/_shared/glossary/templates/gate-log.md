<!-- Shape per output-formats.md - "The gate log" and "The Gate 1 review". File: deep-dives/gate-log.md. Copy every heading and column heading exactly as written here - never retype, rename, or recase them (glossary-assembly-principles.md, "How templates use this doc", rule 3). Words: method-words.md. -->
# Gate log - <glossary>

This page is the full story of how every decision in the glossary was taken. Each item a person had to decide is one row: the question, the evidence from the source, the recommendation, and the person's resolution, with its date. Rows are never deleted. The settled outcome of each row is also written to [decision-register.md](../decision-register.md), which links back here; each section's decisions file then shows what the decision did to that section's words.

## How to read this page

What a term, a kind, a family, and a level mean: see [What this glossary contains](../README.md#what-this-glossary-contains-fixed-block).

- **#** - the row's id. Gate 1 rows are `G1-01`, `G1-02` and so on; Gate 2 rows are `G2-001` and so on; later changes are `CH-01` and so on, in a "Change" part; a "Re-run" part continues the Gate 1 and Gate 2 numbering.
- **Applies to** - the section the item came from, as a link to that section's folder. **All sections** means no single section owns the item: it is a decision about the glossary as a whole, for example which source wins when the sources disagree, or which groups become the families. Its effect shows in the decisions file of every section it touches.
- **The question** - what you are being asked, in one sentence.
- **Why you're seeing it - evidence** - the quotes from the source that raised it, each with the section it came from.
- **Recommended, and why** - the answer we suggest, and the reason.
- **Options** - the choices, labelled (a), (b), (c).
- **What changes if you take it** - which words are retired or renamed, for each option.
- **Term** - in Gate 2, the term whose definition is proposed.
- **Kind** - in Gate 2, the term's kind, one of the four in [What this glossary contains](../README.md#what-this-glossary-contains-fixed-block).
- **Proposed definition** - in Gate 2, the definition we propose, in one plain sentence.
- **Also written as** - in Gate 2, the other words the sources use for the term, which the glossary retires; `-` when there are none.
- **Source** - in Gate 2, where the sources define the term: the section, as a link, and the item id.
- **Status** - `open` until you decide; then `accepted` (you took the recommendation), `overridden` (you chose another option), or `answered` (you answered a question). A gate is not passed while any of its rows is `open`.
- **Resolution** - your answer to the row: the winning word, keep or drop, or the answer. Blank while `open`.
- **Decided** - the date of your resolution. Blank while `open`.
- Candidates and terms are written in sentence case, as everywhere in the glossary; quotes keep the source's own wording.

## How to answer

- Go one row at a time, in the order shown. **All sections** rows come first, because they set defaults for the rows after them; then each section, in the source's order.
- Reply "yes" to take the recommendation, or name another option. If a row is unclear, ask; nothing moves on until the row has an answer.
- Every row can be read on its own: you never need to open another file to answer it.

---

## Gate 1 - agree the words

**What you're reading.** The places, found while reading the source, where one meaning has several words, a word is too vague to keep, a word may not deserve a glossary entry, or a question only you can answer - each with our recommendation.
**Why it matters.** These resolutions decide which words the glossary uses and which it retires.
**What to do with it.** Work through the four tables in order and give each row an answer.
**What it affects.** Nothing goes into the glossary until every row has an answer; then the definitions are written and brought to you in Gate 2.

### Conflicts - one meaning with several words, or one word with several meanings

**What you're reading.** Places where the source uses different words for what looks like one meaning, or one word for different meanings. Where the assembly draft shows a proposed merge, its row is here.
**Why it matters.** Two words for one meaning, or one word for two, is the commonest cause of a misread requirement.
**What to do with it.** Choose the word the glossary will use, or say whether two words really have one meaning.
**What it affects.** The chosen word is used everywhere in the glossary; the other words are listed as retired in the decision register.

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-01"></a>G1-01 | <[section](section/) or All sections> | <one plain sentence, ending in a question mark, naming the words> | <quotes, one per line, each with its section link> | <the exact word, and why in one sentence> | <(a) ... one per line> | <for each option, what is retired or renamed, one per line> | open | | |

### Weak words - words too vague to keep as they are

**What you're reading.** Words the source uses that are relative (no axis), generic, used with several meanings, or that clash with a standard meaning.
**Why it matters.** A reader could take such a word the wrong way, and change what is built or tested.
**What to do with it.** Take the replacement we suggest, or keep the source's word.
**What it affects.** The word you choose is used in the glossary; the other is listed as retired.

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-02"></a>G1-02 | <[section](section/) or All sections> | <one plain sentence, ending in a question mark> | <quotes, one per line, each with its section link> | <the exact replacement, and why> | <(a) ... one per line> | <what changes, one per line> | open | | |

### Candidates to judge - words that may not deserve an entry

**What you're reading.** Words that are borderline: used in only one place but for several requirements, or proposed by us where the source describes something but does not name it.
**Why it matters.** A glossary with too many entries hides the ones that matter; one with too few leaves a word open to misreading.
**What to do with it.** Keep or drop each one.
**What it affects.** A kept candidate gets a definition in Gate 2. A dropped candidate gets no entry, and its section's decisions file shows it as dropped.

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-03"></a>G1-03 | <[section](section/) or All sections> | <"Should <candidate> be a glossary term?"> | <quotes, one per line, each with its section link> | <keep or drop, and why> | <(a) keep<br>(b) drop> | <what changes, one per line> | open | | |

### Questions - what only you can answer

**What you're reading.** Questions the source does not settle - an abbreviation it never spells out, or two sources that contradict each other - and the standing question of which groups become the families.
**Why it matters.** The method never answers these itself; a guess here would be invented meaning.
**What to do with it.** Choose an option, or give the answer.
**What it affects.** Your answer is applied wherever the row says, and recorded in the decision register; the family answer is linked from every glossary page.

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g1-04"></a>G1-04 | All sections | Which of the source's top-level groups become the families, and in what order? | <the source's top-level groups, one per line, each with where it appears> | <the families, one per line, in order, and why> | <(a) ... one per line> | <which candidates fall in each family; every glossary page links to this decision when it explains what a family is> | open | | |
| <a id="g1-05"></a>G1-05 | <[section](section/) or All sections> | <one plain sentence, ending in a question mark> | <quotes, one per line, each with its section link> | <the answer we suggest, and why> | <(a) ... one per line> | <what changes, one per line> | open | | |

---

## Gate 2 - agree the definitions

**What you're reading.** One row for every term that came through Gate 1, with the definition we propose, written to the definition rules in lens1-ontology.md.
**Why it matters.** The definition is what every reader of the glossary relies on; it must say only what the source says.
**What to do with it.** Approve each definition as written, or edit its wording.
**What it affects.** Once every row is approved, the seven glossary pages are written with these definitions, and each section's decisions file is filled in.

| # | Applies to | Term | Kind | Proposed definition | Also written as | Source | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="g2-001"></a>G2-001 | <[section](section/)> | <Term> | <object / role / step / state or value> | <one plain sentence> | <retired words, one per line, or -> | <section link and item, one per line> | open | | |

<!-- Later parts are added here, above Related pages, and never overwritten: one "Change - <date>" part for each change made by disposition, and one "Re-run - <date>" part for each re-run. Leave both out until the first one happens. -->

---

## Change - <date>

**What you're reading.** A change asked for after the glossary was written - a term to rename, redefine, split, merge, or withdraw - with our recommendation.
**Why it matters.** The term changes on every page that uses it, so the resolution should be made knowing what it touches.
**What to do with it.** Take the recommendation, or choose another option.
**What it affects.** Once answered, the term's entry and every place it appears are updated, a row is added to the decision register, and the section decisions files the change touches are updated.

| # | Applies to | The question | Why you're seeing it - evidence | Recommended, and why | Options | What changes if you take it | Status | Resolution | Decided |
|---|---|---|---|---|---|---|---|---|---|
| <a id="ch-01"></a>CH-01 | <[section](section/) or All sections> | <one plain sentence naming the term and the change, ending in a question mark> | <the quote or finding that raised it, one per line> | <the change, and why in one sentence> | <(a) ... one per line> | <for each option, what is renamed, redefined, split, or withdrawn, one per line> | open | | |

## Re-run - <date>

**What you're reading.** The items a new reading of the source raised against the glossary that already exists: new words, words that may have the same meaning as a term already in the glossary, and new definitions.
**Why it matters.** A re-run never starts from zero; only what differs from the existing glossary is brought to you.
**What to do with it.** Answer each row, as in Gate 1 and Gate 2.
**What it affects.** Once every row is answered, the seven glossary pages are updated, and so are the section decisions files.

<This part repeats the four Gate 1 tables and the Gate 2 table above - the same headings, explainers, and columns. Row ids continue the numbering of Gate 1 and Gate 2, so every id stays unique.>

---

## Related pages

| Page | Why it relates |
|---|---|
| [decision-register.md](../decision-register.md) | the settled outcome of every row in this log, each linking back here |
| [glossary-assembly-draft.md](glossary-assembly-draft.md) | the assembly draft the Gate 1 rows are raised from |
