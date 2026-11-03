# Glossary assembly principles

## Purpose and scope

**Assembly is the last stage of building a glossary.** The lenses find the candidates and how they connect; the judgments settle which word wins and what each term means. Assembly is what happens next: it writes those settled terms into the reader-facing pages in `Output/{project}/glossary/`.

This doc exists so that assembly is **deterministic** - the same settled terms always produce the same pages, laid out the same way, with the same columns, groupings, diagrams, and links. Nothing here is left to the writer's taste on the day.

The rules come in two layers:

- **Part A - Ground rules.** Cross-cutting rules that hold for *every* page in the deliverable.
- **Part B - Page-specific rules.** One part per page, stating what only that page does, and naming which ground rules it applies.

Every page, and every blank template in `templates/`, is built by applying Part A and then that page's Part B rules. A template's first line names its Part B rules so the source of truth is never in doubt.

---

# Part A - Ground rules

Each ground rule is written as: **Statement** (the rule), **Why** (the reason), **How to apply** (the exact steps), and **Deterministic output** (what is fixed, so no author choice remains).

<a id="g1"></a>
## G1 - Partition by kind, then by family

**Statement.** The glossary is split first into four **kind** pages, because every term is exactly one kind:
- `object-terms.md`
- `role-terms.md`
- `step-terms.md`
- `states-and-values.md`

Inside a kind page, terms are clustered into a small, named set of **families** taken from the source's own top-level groups. Each family is a top-level part of the page.

**Why.** Kind answers "what is this"; family answers "which part of the product does it belong to". Two coarse cuts let a reader reach any term in two decisions, without scanning a long list.

**How to apply.**
1. Take each term's kind straight from the harvest (object, role, step, or state or value).
2. Assign each term a family from the families settled at Gate 1 ([`otc-run-rules.md`](otc-run-rules.md), "The gates"), which are taken from the source's own top-level structure. If the source has no such grouping, the Gate 1 recommendation is a single family named All.
3. Order families in the order they appear in the source. Name every family in sentence case (see [G6](#g6)). The family taxonomy is **shared across all four kind pages** - the same families, in the same order - so a reader learns it once and meets it everywhere.
4. Open `object-terms.md` with a **families-at-a-glance** table: `Family | What it covers | L1 terms (origin) | Source`, so a reader learns the families once. "L1 terms (origin)" are the family's terms that sit at L1 of the whole hierarchy, each a link to its place; a family with none shows `-`.

**Deterministic output.** Kind is read from the harvest and family from the Gate 1 decision, never chosen while writing. The number of families, their names, and their order are fixed by the source, so two runs produce the same parts in the same order.

<a id="g2"></a>
## G2 - Group by parent, following the hierarchy; never a flat list

**Statement.** In a kind page grouped by family, terms are shown family by family and, inside a family, under the parent they sit under in the hierarchy - the same placement as [G5](#g5) rule 1, so a term sits in the same place on every page. A term appears once. Where it also belongs elsewhere, the page points to its row in the lookup in `terms-and-relationships.md` rather than repeating it.

**Why.** A flat table forces the reader to rebuild the hierarchy in their head. Following the one placement used everywhere means a reader who has seen where a term sits on one page finds it in the same place on the next.

**How to apply.**
1. **Placement** is [G5](#g5) rule 1's: one parent per term, the same order, catch-all parts last.
2. **Starting points (family roots).** First, a table of the family's terms whose parent is absent or belongs to another family, in tree order. Their relationship cell names that parent and its family, or `-`.
3. **One group per parent**, in tree order, for every term that has children in this family: a `### {parent}` heading; its definition on the first line - or, for a parent of another kind or another family, its kind or family with a link to where it is defined; then a table of its children in this family.
4. **Also belongs elsewhere.** After the groups, a bulleted list of the family's terms that also belong elsewhere, each a link to its row in the lookup in `terms-and-relationships.md`.
5. **Not placed in the hierarchy.** Last, the family's terms with no structural relationship: `Term | What it is | Where else it appears | Source | Decision`, where "where else it appears" uses the closed wording of [G5](#g5) rule 5.

**Deterministic output.** Given the same relationships, the starting points, the groups, their membership, and their order are fully fixed by the shared placement - no author choice remains.

<a id="g3"></a>
## G3 - One fixed row schema

**Statement.** Every term is one table row. The **common columns sit in fixed slots**: `Term` and `What it is` always first, and `Source` and `Decision` always last. Between them, each kind inserts its **relational columns**, defined in that kind's Part B rules. Column order is fixed and no cell is ever blank - absence is written `-`.

**Why.** One shape everywhere means a reader learns the columns once and never re-learns them.

**How to apply.**
1. Fill the common columns in their fixed slots - `Term` and `What it is` at the front, `Source` and `Decision` at the end:
   - `Term` - the agreed word, in sentence case ([G6](#g6)), carrying a hidden anchor - the term in kebab-case, for example `<a id="order-line"></a>` - so any page can link to its definition.
   - `What it is` - the term's definition, written as `lens1-ontology.md` ("Writing a definition") sets out.
   - `Source` - where the source defines it: the section, as a link to its `deep-dives/` folder, and the item id the source itself uses (a requirement, story, or heading number), one per line.
   - `Decision` - if the term was contested, a link to its row in the register, `[D-n](decision-register.md#d-n)`; otherwise `-`.
2. Insert the kind's relational column(s) between `What it is` and `Source`, exactly as its Part B rules specify.
3. **Relationships in plain words.** A relationship cell uses the same plain words as the level table ([G5](#g5) rule 2) - `part of a {parent}`, `a kind of {parent}`, `shown when a {parent} is opened`, `created by a {parent}` - with the parent as a link to where it is defined. A flow cell uses the "reads as" sentences of [G5](#g5) rule 3, one per line.
4. **Links between terms.** Wherever a page names another term in a cell - a parent, an owner, a chosen word - it links to that term's definition by its anchor.

**Deterministic output.** The common columns and their fixed slots (front and back) are set here; each kind's relational columns and their order are fixed in Part B; every cell value is read from the harvest and the shared placement.

<a id="g4"></a>
## G4 - Everything explains itself

**Statement.** The reader is assumed to know nothing about the method. So every page - the seven glossary pages and every page under `deep-dives/` - opens with a **description** and a **How to read this page** part that starts with a **fixed block** printed the same way in every glossary page; a page under `deep-dives/` does not repeat the block but opens its How to read with one line linking to it in `README.md`. Every numbered part of a page opens with a **four-line explainer**; every sub-part inside it opens with **one plain line**. Labels a reader sees are plain words, with the method's own term kept beside them in brackets.

**Why.** A one-line label such as "Verbatim (complete)" tells a reader nothing: not what they are looking at, why it is there, or what to do with it. A reader taking a decision needs that answered on the spot, without opening another file - and needs the basic words, such as "term", to mean the same on every page.

**How to apply.**
1. **Description.** The first paragraph under the title says what the page is, who it is for, and what it holds.
2. **How to read this page.** Next, under that heading, in this order:
   - **The fixed block** - printed verbatim; the only part filled in per run is the family decision link. It copies its rows from `method-words.md` exactly, and is never reworded:

     > These words mean the same on every page. They are copied from the method's word list, `method-words.md`.
     >
     > | Word | Means |
     > |---|---|
     > | Source | A document the glossary is built from. It is read, never changed. |
     > | Section | One part of a source, read on its own, taken from the source's own headings, in source order, and fixed before reading starts. Not the same as a family: a section is how we read. |
     > | Candidate | A word Ontology keeps for judging. It is not yet a term. |
     > | The three tests | The tests a candidate must all pass to become a term:<br>• special meaning<br>• consequence<br>• reach |
     > | Term | A candidate that passed the three tests and Gate 1. Gate 2 then agrees its definition. |
     > | Kind | Which of the four kinds a term is. Not the same as the relationship word "kind of". |
     > | Family | A group of terms the glossary's pages are arranged by, decided at Gate 1, usually from the source's top-level groups. Not the same as a section: a family is how a reader browses. |
     > | Gate | A point where a person decides. The run stops until every gate row is resolved. |
     > | Level | How far down the hierarchy a term sits, written L1, L2 and so on. L1 is the top. |
     >
     > **The four kinds:**
     >
     > | Kind | Means | Defined in |
     > |---|---|---|
     > | object | something the product stores, shows, or acts on | [object-terms.md](object-terms.md) |
     > | role | a person the product serves, records, or gives access to | [role-terms.md](role-terms.md) |
     > | step | a named stage of the work | [step-terms.md](step-terms.md) |
     > | state or value | a condition a term can be in, or one member of a closed set | [states-and-values.md](states-and-values.md) |
     >
     > How the families were chosen: [D-n](decision-register.md#d-n).

   - **The columns** this page uses, one bullet each, in plain words.
   - **The relationship words** this page uses, as a table `Relationship | What it means | Reads as`, taken from [G5](#g5) rule 3 - only the words that appear on this page.
3. **The explainer.** Every **numbered part** of a page opens with these four lines, in this order, each at most two sentences:
   - **What you're reading** - what this part shows, in everyday words.
   - **Why it matters** - what a reader gets from it.
   - **What to do with it** - what the reader is expected to do: read, check, decide, or look up.
   - **What it affects** - what depends on it, or what goes wrong if it is misread or wrong.

   Every **sub-part** inside a numbered part - a family, a tree, a table, a picture - opens with **one plain line** saying what it is and how it differs from its neighbours. Each line must say something true of *this* part only: a sentence that would fit any table ("this table shows the data") fails the rule.
4. **Reading guides are tables.** Wherever a reader needs a guide to labels, markers, or notes, it is a table `Label | What it means`, never a list of prose bullets.
5. **Plain labels, method word in brackets.** A reader-facing heading or label uses the plain form, followed by the method's term in brackets. The closed list:

   | Plain label | Method term in brackets |
   |---|---|
   | Families at a glance | (index) |
   | L1 terms | (origin) |
   | The whole hierarchy, level by level | (hierarchy) |
   | Terms that also belong elsewhere | (lookup) |
   | Candidates that also belong elsewhere | (lookup) |
   | Each family, one by one | (family views) |
   | Its slice of the hierarchy | (family slice) |
   | Starting points | (family roots) |
   | Also belongs elsewhere | (lookup) |
   | Steps not in the flow | - |
   | What this glossary contains | (fixed block) |
   | The tree | (text tree) |
   | The picture | (diagram) |
   | Also in this family, not placed in the hierarchy | (not placed) |
   | Not placed in the hierarchy | (not placed) |
   | Every relationship, as a table | (verbatim) |
   | How to read this table | (reading key) |
   | The candidates found | (ontology) |
   | How they fit together | (topology) |
   | How they move | (choreography) |
   | The flow, step by step | (forward thread) |
   | Actions that happen throughout | (supporting actions) |

   Any other method word a reader would meet - for example "reach" or "gate" - is defined once under How to read this page.

6. **Contents and links between parts.** A page with numbered parts lists them, each as a link, under a **Contents** heading directly after the description. Every mention of a part, a family part, or another page is a link to it, never a bare name or number for the reader to hunt for.

**Deterministic output.** The description, the contents, the fixed block, the four-line explainer on every numbered part, and the one line on every sub-part are always present; the fixed block's wording and the labels come from closed lists; only the explainer lines are written per part, and they are held to the four fixed questions.

<a id="g5"></a>
## G5 - Relationships are shown as levels: a lean hierarchy, then where else each term belongs

**Statement.** Structure is shown as a **level table**: one row per term, its level made explicit by the column it sits in (L1, L2, and so on), so a reader sees at a glance what sits under what. A page that covers the whole product shows **one hierarchy for the whole product**, with true levels; a family view is a **slice** of that same hierarchy - the same rows, the same levels. Each term appears once in the hierarchy; everywhere else it belongs is listed in a **lookup table** that says, in fixed sentences, what that means for the reader. Families are shown one by one with a tree and a picture of that family alone; the whole product is never drawn as one picture. The word used is "relationship", never "link".

**Why.** Families cut across the hierarchy: in a real glossary half the relationships can join terms in different families, so a tree drawn family by family restarts the levels and leaves terms floating. One hierarchy for the product keeps the levels true, and a slice keeps every term attached. Putting every other place a term belongs into its own table keeps the hierarchy short enough to read; turning those places into fixed takeaways tells the reader why they matter without anyone inventing meaning. A picture of one family stays small; a picture of the whole product tangles.

**How to apply.**
1. **Placement - where each term sits.**
   - A term sits under its **"part of" parent** - a `contains`, `reveals`, or `produces` relationship. Only a term with no such parent sits under its category, through `kind of`.
   - **Nearest parent, within a family:** if A contains B and B contains C, and also A contains C, C sits under B when A, B and C are all in the same family. A term from another family never counts as the step between two terms. The direct A-C relationship is implied by the levels and is not shown again.
   - **One place per term:** a term with several possible parents sits under the first one in source order; every other parent goes in the lookup table (rule 4).
   - **Catch-all parts last:** under each parent, a child whose name begins with one of these words goes after its siblings: unallocated, unassigned, unmapped, unmatched, unknown, other.
   - **Top of the hierarchy (L1):** a term with no parent sits at L1, in source order.
   - **Loops:** if placement would make a term its own ancestor, the first term of the loop in source order is placed at L1.
2. **The level table.** One row per placed term, in placement order (each parent, then its children). Columns: `L1 | L2 | ... | Ln | Relationship to the term above | Kind | Home family`.
   - The term's name sits in the column of its level; the other level cells are blank. Every row carries a hidden anchor so other tables can link to it.
   - **Relationship to the term above**, in plain words: `part of a {parent}`, `a kind of {parent}`, `shown when a {parent} is opened`, or `created by a {parent}`; `-` at L1.
   - **Kind**: object, role, step, or state or value.
   - **Home family**: always a link to that family's view.
3. **"Reads as" - the meaning of each relationship word.** Wherever a relationship is listed as a row, its "reads as" cell is built from a fixed pattern:

   | Relationship | What it means | Reads as |
   |---|---|---|
   | contains | the first is the whole, the second a part of it | Each {child} is part of a {parent}. |
   | kind of | the first is the category, the second a member of it | A {child} is one kind of {parent}. |
   | reveals | opening the first shows the second | Opening a {parent} shows its {child}. |
   | produces | the first creates the second | A {first} creates a {second}. |
   | comes before | the first happens, then the second | {First} happens before {second}. |
   | locks | the first stops the second from happening | {First} stops {second} from happening. |
   | unlocks | the first lets the second happen | {First} lets {second} happen. |
   | re-checks | the first re-examines the second and updates it | {First} re-examines {second} and updates it. |

   Grammar, so every sentence reads naturally: "a" or "an" follows how the word is said (an API, a SKU); a company or product name takes no article; a plural or uncountable term takes no "a" or "each"; a term in a state is written "Term: state" and takes no article.
4. **Terms that also belong elsewhere (lookup).** Directly after a level table, one row for every term in it that has another parent: `Term | Shown under | Also a kind of | Also part of | Also shown or created by | Takeaways`. Each "also" cell lists its terms one per line, each a link to its row; "shown under" links to the parent's row. **Takeaways** come only from this closed list, one bullet each, in this order:

   | When | Takeaway |
   |---|---|
   | it is also a kind of a category that is an object or a role | Anything the glossary says about {category} also applies to {term}: see {category}. |
   | it is also a kind of a set of values (a state or value) | {Term} is one of the values of {set}, alongside {other values}; it is not a member of a category. |
   | it is also part of other terms | {Term} is shared: besides {shown under}, it is part of {n} other terms in {m} other families, so a change to it affects all of them. |
   | it is also shown when another term is opened, or created by one | • shown: {Term} is also visible when {a term} is opened, not only under {shown under}.<br>• created: {Term} is also created by {a term}. |
   | it sits in 4 or more places in all | Used in {n} places: it may carry more than one meaning, which is worth checking at the next gate. |

   Takeaways never add anything the relationships and kinds do not already state.
5. **A family view.** For each family, in family order:
   - a heading and **one line** on what the family covers;
   - **the tree** - a text tree in a code block, drawn with `├──`, `└──` and `│`, names only, except that a term from another family reads "{term} (from {family})";
   - **the picture** - a mermaid `flowchart TD` of the same rows: `kind of` drawn as a dotted line labelled "kind of", other relationships as solid lines labelled with their relationship; a term from another family labelled with its family. Safe ids: alphanumeric, no hyphens (`source-system` becomes `sourceSystem`); no subgraphs;
   - **its slice of the hierarchy** - the rows of the product-wide level table whose home family is this one, keeping their levels. Where a row's parent belongs to another family, that parent's row is shown directly above it, its home family written "{family} (context)";
   - **terms that also belong elsewhere** - the lookup rows (rule 4) for this family's terms;
   - **also in this family, not placed in the hierarchy** - the family's terms with no structural relationship: `Term | Where else it appears`, where the second column is "in the flow: see step-terms.md" when the term takes part in the flow, or "nowhere else: the sources name it but never relate it to another term - a gap to raise with the source's owner".
6. **The flow, step by step.** Flow is not a hierarchy. It is a numbered list of steps in `comes before` order (ties in source order); under each step, one bullet per term it produces, locks, or unlocks, each written as its "reads as" sentence; then every flow relationship as a table `First | Relationship | Second | Reads as`, and a picture of the same relationships.
7. **No picture of the whole product.** Pictures are drawn per family view (rule 5) and per flow part (rule 6) only.

**Deterministic output.** Placement is fixed by the relationships, the source's order, and the closed catch-all list; levels are computed, never chosen; every family slice repeats the product-wide rows at the same levels; "reads as" sentences and takeaways come from closed patterns; node ids are a fixed transform of the term; and every structural relationship is either drawn in the level table, listed in the lookup table, or implied by the levels as a shortcut - which a check can prove.

<a id="g6"></a>
## G6 - Naming and character hygiene

**Statement.** Every term and every family name is written in **sentence case** wherever it is shown, and the same word always looks the same - in the seven glossary pages **and** in every page under `deep-dives/` (section drafts, decisions files, the assembly draft, and the gate log). Kebab-case is kept only for file names, folder names, and the hidden anchor id behind a link, never as visible text. Terms are not backticked. The text uses the plain hyphen and straight quotes, and contains none of the banned characters: no section symbol, no middot, no em dash or en dash (a dash is always the plain hyphen), no math or logic notation, no decorative glyphs (the tree lines `├`, `└`, `│` and `─` are allowed only inside a [G5](#g5) tree code block), and no arrows except an explicit `->` where a genuine flow reads better. This matches the source's own character-hygiene rule.

**Why.** One casing everywhere means a reader never meets "Org" in one file and "org" in the next and wonders whether they are two terms. Sentence case reads as ordinary language, so a term looks like the word people actually say.

**How to apply.** Eight rules, applied in this order:
1. **Terms and family names - sentence case.** Capitalise the first word where the term starts a heading, a table cell, a bullet, or a diagram label; inside a sentence, write the term in lower case. Examples: a cell reads "Order line" and "Payment method"; a sentence reads "each order holds its order lines".
2. **Acronyms - always in capitals**, wherever they sit. For example:
   - SKU
   - API
   - VAT
3. **Names of companies, products and vendors - their own form**, wherever they sit. For example:
   - PayPal
   - Shopify
   - Stripe

   A screen or module name inside the product being described is a term, not a product name, so rule 1 applies to it: "Order history", not "Order History".
4. **Relationship words - always lower case**, even at the start of a cell, because they are a fixed vocabulary and not terms. The closed list:
   - contains
   - kind of
   - reveals
   - produces
   - comes before
   - locks
   - unlocks
   - re-checks
5. **Hyphens - as the source writes them.** A term is shown with the source's own spelling, cased by rule 1. A hyphen stays where the source writes one; it is never added, and never turned into a space. For example:
   - Re-sync
   - Read-only
   - Part-month split

   Kebab-case is used only for file names, folder names, and the hidden anchor id behind a link (lower case, hyphens); it is never shown, and a term's display is never derived from it. If the source spells one candidate both ways (for example "sign in" and "sign-in"), that is a weak word for Gate 1, not a choice made while writing.
6. **Quotes from the source - never recased.** Evidence quotes keep the source's exact wording and casing.
7. **Several items - one per line.** Where a table cell or a line holds several items, each item goes on its own line as a bullet: `<br>• ` inside a table cell, `- ` outside a table. Items are never joined with commas, slashes, or middots. Split only between the items themselves - never inside brackets or quotes. If a bracket holds a list, rewrite the text so the bracket goes and each bullet carries its own detail: not "delivery address (checkout, account)" split in two, but one bullet per source, each naming what it holds.
8. **Table column headings - sentence case.** Every header cell of a table starts with a capital letter and is otherwise cased by rule 1, so acronyms stay in capitals (ID, L1) and later words are lower case unless a rule above keeps them: "Relationship to the term above", not "relationship to the term above" or "Relationship To The Term Above". A column guide that names a column, and any rule text that quotes a column or a list of columns, writes the name exactly as the heading does. This rule holds for every table in every file, always: the seven glossary pages, every page under `deep-dives/`, every template in `templates/`, and the method's own docs and skills.

Run a casing and character sweep before finishing and fix any page that breaks a rule or contains a banned character - over the seven pages and everything in `deep-dives/`. The same sweep runs two more checks, and either one failing fails the run:
- **Retired words.** It searches every page and method doc for each word that `method-words.md` marks in bold under Don't use.
- **List values.** For each list in part 8 of `method-words.md` whose "Used in" line names a column, every cell in that column holds one of the list's values, written exactly as listed, or `-`.

**Deterministic output.** The display form is fixed by the source's spelling and the closed acronym, product-name and relationship-word rules, so no choice remains; the bullet rule leaves one layout for any list; and the banned set is a closed list, so a page either passes the sweep or it does not.

<a id="g7"></a>
## G7 - Every page ends with a correlated related-pages footer

**Statement.** Every page - each of the seven glossary pages and every page under `deep-dives/` - ends with a **related pages** table that links only to the pages that genuinely correlate with it - not to all of them - each with a one-line reason. The one exception is `README.md`: its pages-and-reading-order table already links every page, so README carries no separate related-pages footer.

**Why.** A reader finishing a page should be handed the next relevant page, not a full directory.

**How to apply.**
1. Choose the two to four pages most related to this one.
2. Write a table: `Page | Why it relates`, using relative links.
3. The related set for each page is fixed in that page's Part B rules - or, for a page under `deep-dives/`, in its part of `output-formats.md` - so it is not re-chosen each run.

**Deterministic output.** Each page's related set is named in Part B or in `output-formats.md`, so it is fixed, not re-decided per run.

<a id="g8"></a>
## G8 - A word the glossary stops using never disappears

**Statement.** Each kind page - `object-terms.md`, `role-terms.md`, `step-terms.md`, and `states-and-values.md` - shows only the current terms in its main tables, and ends, just before its related pages, with a table of the earlier words of that kind that the glossary no longer uses, each pointing to the term to use now.

**Why.** A reader still meets the earlier words - in the source, and in documents written before a change. This table is where they find the word to use instead, and how it came to change, without opening the decision register.

**How to apply.**
1. **Heading:** `Terms replaced or retired over time`, opened with the [G4](#g4) four-line explainer. The part is always present; with no rows, the table is replaced by one line: `None yet.`
2. **Columns:** `Earlier word | What happened | Use now | Decision | Date`.
3. **Rows.** One row for every earlier word of this page's kind:
   - each source word retired at Gate 1 - merged into another term, or replaced as a weak word;
   - each term later renamed, merged, split, or withdrawn through disposition.

   The kind is the kind of the term in **Use now**; for a withdrawn term with nothing in its place, its own kind.
4. **What happened** - one of:
   - renamed
   - merged
   - split
   - withdrawn
5. **Use now** - always the current term, as a link to its definition, never a word in between: if "Checkout cart" became "Basket" and "Basket" later became "Cart", both rows say Cart. A split lists each current term, one per line. A term withdrawn with nothing in its place shows `-`.
6. **Order.** Rows that point to the same current term sit together. The groups follow the order the current terms appear in this page's main tables. Inside a group, the latest change comes first; rows with the same date keep the decision register's order. Rows with `-` in **Use now** come last, latest first.
7. **Decision** - a link to the register row that settled it, `[D-n](decision-register.md#d-n)`; **Date** - that row's date.
8. **Earlier word** - the word cased per [G6](#g6), as the source or the earlier glossary wrote it. It carries no anchor, because it is no longer a term.
9. **Redefined terms are not listed:** the term keeps its name, so its row in the main table simply carries the new definition. The earlier wording is kept in the gate log's change row and in the register.

**Deterministic output.** Every row comes from the gate log, through the decision register, and is written by `build-retired-words-tables.cjs`, never by hand. The four "What happened" words are a closed list, and the order is fixed by rule 6, so the same gate log always gives the same table.

---

# How templates use this doc (the determinism mechanism)

This doc is the **law**. The blank files in `templates/` are the **fill-in templates**. They connect two ways:

1. Each `templates/{page}.md` **embeds the exact structure** its Part B rules mandate - the headings, the column guide text, the column headers, and placeholder rows and diagrams - and opens with a first line: `Assembled per glossary-assembly-principles.md - Part B: {page}`.
2. When assembly runs, it only **fills the placeholders** from the harvested data by applying Part A and the page's Part B rules. It never invents structure. The same settled terms therefore always produce the same page.
3. **Headings are copied, never retyped.** Every heading and every table header row in a template is already written to [G6](#g6) - sentence case, rule 8 for column headings. Whoever fills the template copies them exactly as written: it never renames, recases, adds, drops, or reorders a column. Only a level table's L1 to Ln columns grow, one per level, written L1, L2 and so on. The templates for the files under `deep-dives/`, and for the check findings and the ripple list, follow the same rule, with `output-formats.md` as their law. Each template's first line repeats this rule.
4. **Every word comes from the word list.** A template's headings, column headings, column guides, and placeholders use only words from `method-words.md`, with the meanings it gives them. A template changes only together with that list: a new word goes into the list first.

To change the standard, edit this doc **and** the affected template together; changing one without the other is not allowed.

---

# Part B - Page-specific rules

Each page has a part below. Each names the ground rules it applies (linked) and states what only that page does. Nothing here names a product: every rule works for any source. Templates link back to these parts by their anchor.

<a id="b-readme"></a>
## README.md - the gateway

**What only this page does.** It is the gateway: it orients a reader, says what the glossary's basic words mean, and points to every page. It carries no term data, no run history, and no operational rationale.
**Ground rules applied.** [G4](#g4) (description; the fixed block; an explainer on each table), [G6](#g6). **Exempt from [G7](#g7)** - its pages table already links every page.
**Page-specific rules.**
1. **Freshness datum.** A single `**Last updated:** {date}` line directly under the title. Nothing more - no run history.
2. **Description.** One short paragraph: what the glossary is, who it serves, and what a reader can look up.
3. **How this glossary was built.** Directly after the description and before the fixed block, the README carries this paragraph, exactly as written:

   > **How this glossary was built.** The sources were read one section at a time, three ways: what each section names (Ontology), how those fit together (Topology), and how they move from one stage or state to the next (Choreography). The candidates were joined across sections, and a person settled every contested word at two gates: first the words, then their definitions. The evidence behind every entry is in [deep-dives/](deep-dives/).

4. **What this glossary contains (fixed block).** The [G4](#g4) fixed block, under this heading - the one place a reader meets the basic words first. Files under `deep-dives/` link here instead of repeating it.
5. **Sources table.** Opens with the G4 explainer. `Source | What it provides`, one row per source, each provision one per line, followed by the line stating the glossary is derived from these and must not contradict them.
6. **Pages and reading order table.** Opens with the G4 explainer. One combined table `# | Page | Read it for | Terms`, ordered as the intended reading path (terms and their relationships first). Each count is a link to the page it counts. Its last row is always `deep-dives/`, read it for "how each term was reached: the source quotes behind every entry and how each decision was taken", terms `-`.
7. **Nothing else** - no footer, no run history. Whether a run's resolutions were made by a person or taken automatically is recorded only in the decision register.

**Per-run placeholders.** the product name in the title, the family decision link, the source rows, each page's term count, and the date.

<a id="b-map"></a>
## terms-and-relationships.md - terms and their relationships

**What only this page does.** It shows how the terms relate to each other in structure - what is part of what, what is a kind of what, what opens to show what - first as one hierarchy for the whole product, then family by family. It covers terms of every kind that the source relates, not only objects. The flow - what happens in what order - lives in `step-terms.md`, not here.
**Ground rules applied.** [G4](#g4) (with contents and links between parts), [G5](#g5) (levels, lookup, family views), [G6](#g6), [G7](#g7).
**Page-specific rules.**
1. **Title:** `Terms and their relationships`.
2. **Parts, in this order:**
   - description, then **Contents** ([G4](#g4) rule 6)
   - How to read this page: the fixed block, the relationship words, the level-table columns, and one line saying that a relationship skipping a level is implied by the levels and not shown again ([G4](#g4) rule 2)
   - **1. Families at a glance (index)** - `Family | What it covers | L1 terms (origin) | Terms`: each family a link to its view in part 3; each of the family's terms at L1 of the whole hierarchy, as a link to its row in part 2 (`-` when it has none); "terms" counted by kind, one per line, each count a link to where those terms are defined.
   - **2. The whole hierarchy, level by level (hierarchy)** - the product-wide level table ([G5](#g5) rules 1 and 2), then **terms that also belong elsewhere** ([G5](#g5) rule 4).
   - **3. Each family, one by one (family views)** - every family in family order, as [G5](#g5) rule 5 sets out.
   - related pages
3. Each numbered part opens with the four-line explainer; each family inside part 3 opens with its one line ([G4](#g4) rule 3).
4. **No flow** here: this page points to `step-terms.md` for the flow.

**Per-run placeholders.** the families and what each covers, the hierarchy rows and their levels, the lookup rows and their takeaways, and each family's view.

<a id="b-objects"></a>
## object-terms.md - the objects

**What only this page does.** Defines the objects the product stores, shows, or acts on, family by family, each under the parent it sits under in the hierarchy.
**Ground rules applied.** [G1](#g1), [G2](#g2), [G3](#g3), [G4](#g4), [G5](#g5), [G6](#g6), [G7](#g7), [G8](#g8).
**Page-specific rules.**
1. **Parts, in this order:** description; How to read this page (the fixed block, then the columns); **Families at a glance**; one part per family, in family order; a final "Cross-cutting" part **only if** some object belongs to no family; **Terms replaced or retired over time** ([G8](#g8)); related pages.
2. **Families at a glance.** Opens with the G4 explainer. `Family | What it covers | L1 terms (origin) | Source`: each family a link to its part below; each L1 term - an object of the family at L1 of the whole hierarchy - a link to its row in `terms-and-relationships.md`; `-` when there is none.
3. **Each family part**, a sentence-case heading with no "Family N" prefix, holds in order:
   - the four-line explainer;
   - **the tree** and **the picture** - the family view of `terms-and-relationships.md` ([G5](#g5) rule 5), drawn the same way;
   - **starting points**, **one group per parent**, **also belongs elsewhere**, and **not placed in the hierarchy**, as [G2](#g2) sets out.
4. **Columns** of the starting-points and group tables: `Term | What it is | Relationship to the term above | Source | Decision`, the relationship in plain words with the parent linked ([G3](#g3) rule 3). Only objects are rows; a parent of another kind is named in its group heading with a link to where it is defined.

**Per-run placeholders.** the families, the trees and pictures, the groups and their rows, the definitions, sources, and decision links.

<a id="b-roles"></a>
## role-terms.md - the people the product serves, records, or gives access to

**What only this page does.** Defines the people the product serves, records, or gives access to, and says where each sits in the hierarchy.
**Ground rules applied.** [G3](#g3), [G4](#g4), [G6](#g6), [G7](#g7), [G8](#g8). Presented as one group, not by family; each role names its home family in a column. Where roles relate to each other, the hierarchy and the lookup in `terms-and-relationships.md` show it, so this page does not draw it again.
**Page-specific rules.**
1. **Parts:** description; How to read this page (the fixed block, then the columns); **The terms**, opened with the G4 explainer; **Terms replaced or retired over time** ([G8](#g8)); related pages.
2. **Columns:** `Term | What it is | Persona or access role | Sits under | Home family | Source | Decision`.
3. `Persona or access role`: **persona** - a person the product is designed around; **access role** - a label that grants access or duties; `-` when the sources do not say which.
4. `Sits under`: the role's place in the hierarchy in plain words, with the parent linked to its row in `terms-and-relationships.md`; when the role also belongs elsewhere, a second line "also belongs elsewhere: see the lookup", linked to its lookup row; `-` when it is not placed.
5. `Home family`: a link to the family's view in `terms-and-relationships.md`.

**Per-run placeholders.** the roles, the persona or access role split, their place in the hierarchy, their families, and sources.

<a id="b-steps"></a>
## step-terms.md - the stages of the work

**What only this page does.** Holds the whole flow - the main stages in order, what controls them, and the actions that happen throughout - and defines every step term. It is the single home of the flow; `terms-and-relationships.md` does not repeat it.
**Ground rules applied.** [G3](#g3), [G4](#g4), [G5](#g5) rules 3 and 6, [G6](#g6), [G7](#g7), [G8](#g8). **Grouped by the flow, not by family** - a deliberate exception to [G1](#g1), because the flow is the steps' own structure.
**Page-specific rules.**
1. **Parts:** description; How to read this page (the fixed block, the columns, and the flow words); **The flow, step by step (forward thread)** - the main stages in the order the source gives them; **Actions that happen throughout (supporting actions)** - steps the source does not pin to one stage; **The terms**; **Steps not in the flow**, only if there are any; **Terms replaced or retired over time** ([G8](#g8)); related pages. Each part opens with the G4 explainer.
2. Each of the two flow parts is shown as a numbered list, a table, and a picture ([G5](#g5) rules 3 and 6).
3. **The terms** columns: `Term | What it is | In the flow | Home family | Source | Decision`. `In the flow` lists the step's flow relationships as "reads as" sentences, one per line, each other term linked; `Home family` is a link to the family's view in `terms-and-relationships.md`.
4. **Steps not in the flow**: `Term | Where else it appears`, worded as in [G5](#g5) rule 5, with "in the hierarchy: see {its row}" when the step is placed there.

**Per-run placeholders.** the stages, the actions, their flow relationships, their families, and sources.

<a id="b-states"></a>
## states-and-values.md - the named conditions

**What only this page does.** Defines the named conditions and the closed sets of values, grouped by the **same families** as the other kind pages, with the term each belongs to named and linked.
**Ground rules applied.** [G1](#g1) (the shared families), [G3](#g3), [G4](#g4), [G6](#g6), [G7](#g7), [G8](#g8).
**Page-specific rules.**
1. **Parts:** description; How to read this page (the fixed block, then the columns); one part per family that holds conditions, in family order, each opened with the G4 explainer; a final **Platform-wide** part for any set that belongs to no single term; **Terms replaced or retired over time** ([G8](#g8)); related pages. Family headings stay exactly the family names, so other pages can link to them.
2. **Columns:** `Value-set | What it is | Belongs to | Values | Notes | Source | Decision`.
3. `Belongs to` names the exact owning term as a link to its definition; a set that qualifies no single term sits in Platform-wide.
4. `Values`: the allowed members, one per line, cased per [G6](#g6).
5. `Notes` comes only from this closed list, else `-`: "The sources also write {members} as kinds of {set}; read them as its values" - when the hierarchy has `kind of` relationships under this set.

**Per-run placeholders.** the families, the value-sets, their owners, values, notes, and sources.

<a id="b-decisions"></a>
## decision-register.md - the audit trail

**What only this page does.** Records every contested term and how it was settled, including the choice of families; it is the one place operational reasoning lives, and every other page links to it by anchor.
**Ground rules applied.** [G3](#g3) rule 4, [G4](#g4), [G6](#g6), [G7](#g7).
**Page-specific rules.**
1. **Parts:** description; the operational note (rule 5); How to read this page (the fixed block, then the columns); **The register**, opened with the G4 explainer; related pages.
2. One append-only table, one row per contested term, keyed by a global id `D-n` with a hidden anchor `<a id="d-n">` so other pages can link to the exact row.
3. Columns: `ID | Term | Where | Decided | Chosen | Retired / overrides | Basis | Gate row | Date`. `Term` and `Chosen` link each term to its definition; `Where` names the section as a link to its evidence, or **All sections**; `Gate row` links to the row in `deep-dives/gate-log.md` where the decision was taken.
4. Term and chosen are cased per [G6](#g6); retired words and basis stay as prose (they are the dropped forms and the reasoning).
5. It carries the one operational note: when a run's resolutions were taken automatically rather than by a person, one line says so, with the date. No other page carries rationale.

**Per-run placeholders.** the decision rows.
