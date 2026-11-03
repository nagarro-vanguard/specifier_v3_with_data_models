# Method words

> **What this is** - the one place the method's words are defined. Every method doc, skill, template and page uses these words with these meanings, and no others.
> **What it is not** - a glossary of any product. The product's own words go in the glossary the method builds.
> **Related docs**
>
> - `otc-methodology.md`
> - `glossary-assembly-principles.md`
> - `output-formats.md`

## How this list works

1. **One word, one meaning.** Each word below has one meaning, and each meaning has one word - in the method docs, the skills, the templates, every page the method writes, and the README alike.
2. **Nothing else defines these words.** Every doc, skill, template, and page uses them as written here. The README's fixed block copies these rows, word for word, in this order:
   - Source
   - Section
   - Candidate
   - The three tests
   - Term
   - Kind, with the four kinds (part 8)
   - Family
   - Gate
   - Level
3. **Don't use** lists the words we have stopped using for that meaning. A word in **bold** is never used anywhere, so the end-of-run search ([G6](glossary-assembly-principles.md#g6)) fails if it finds one. The other words are stopped only for that meaning, and are checked by reading.
4. **A new meaning gets its row here first,** before any doc, skill, template, or page uses it.
5. **Lists bind columns.** Each list in part 8 is written exactly as listed, in lower case, and says where it is used. A column named in a list's "Used in" line holds only that list's values, or `-`. The end-of-run search ([G6](glossary-assembly-principles.md#g6)) checks every such column.
6. **Every skill and prompt reads this list.** Every skill or prompt for the glossary - now or added later - names this file among what it reads, and uses only its words. A skill or prompt that does not is incomplete.
7. **Every template takes its words from this list.** Its headings, column headings, column guides, and placeholders use only these words, with these meanings ([`glossary-assembly-principles.md`](glossary-assembly-principles.md), "How templates use this doc", rule 4).

The parts follow the method from start to finish:
1. The method
2. What we read
3. What we find
4. How terms relate
5. How we decide
6. What we write
7. After the glossary exists
8. Lists

---

## 1. The method

| Word | Means | Example | Don't use |
|---|---|---|---|
| OTC | The way the method reads a source: each section is read three ways, in this order:<br>• Ontology<br>• Topology<br>• Choreography | Reading a store's Checkout section three ways. | - |
| Lens | One of the three readings. | Topology is the second lens. | **OTC lens** |
| Ontology | The first lens: what a section names. | Finds Cart, Shopper, Checkout, Paid. | - |
| Topology | The second lens: how the candidates fit together - the structure relationships. | Finds that a cart contains line items. | - |
| Choreography | The third lens: how they move - the flow relationships and the states. | Finds that checkout comes before payment. | - |
| Harvest | The skill that builds or updates the glossary. | - | - |
| Check | The skill that measures a document against the glossary. It changes nothing. | Checking a user story for retired words. | - |
| Disposition | The skill that acts on what check found, through a gate. | - | disposition, for what it decides |
| New build | A run when no glossary page exists yet. | The first run on a store's requirements. | **first run** |
| Resumed build | A run that continues from the open gate rows of a build that stopped. | - | - |
| Re-run | A run when the seven pages already exist. | Running again after the requirements change. | **re-scan** |

## 2. What we read

| Word | Means | Example | Don't use |
|---|---|---|---|
| Source | A document the glossary is built from. It is read, never changed. | `checkout-requirements.docx` | • document, for a source<br>• **root doc**<br>• input, for a source |
| Document | Anything outside the glossary that is not a source, such as a story that check measures. | A user story. | document, for a source or a page |
| Product | What the sources describe; the subject of the glossary. | An online store. | - |
| Section | One part of a source, read on its own, taken from the source's own headings, in source order, and fixed before reading starts. Not the same as a family: a section is how we read. | "E02 Checkout" in a backlog is the section `checkout`. | • module, for a section<br>• area, for a section<br>• slice, for a section<br>• feature, for a section<br>• epic, for a section |
| Item id | The id a source gives its own items: a requirement, story, or heading number. | FR-12 | - |
| Evidence | The exact words of a source, and where they are. | "items stay in the cart until payment" - checkout, FR-12 | - |

## 3. What we find

| Word | Means | Example | Don't use |
|---|---|---|---|
| Word | Any word or phrase as a source writes it, before anything is judged. | "basket" | - |
| Candidate | A word Ontology keeps for judging. It is not yet a term. | "cart" and "basket", both kept by Ontology. | **candidate term** |
| Dropped | Said of a word or candidate that did not become a term. The reason says at which stage. | "click" - an everyday word. | • **left out**<br>• **set aside**<br>• **rejected** |
| Term | A candidate that passed the three tests and Gate 1. Gate 2 then agrees its definition. | Cart | term, for a word or a candidate |
| Entry | The row on a kind page that defines one term. | The Cart row on `object-terms.md`. | - |
| Definition | An entry's "What it is": one sentence, at most 25 words. Not the same as a meaning. | "The items a shopper has chosen but not yet paid for." | - |
| Meaning | In a section draft, what the source says a candidate is, in at most 12 words. | "items held until payment" | - |
| Kind | Which of the four kinds (part 8) a term is. Not the same as the relationship word "kind of". | Cart is an object. | • type, for a kind<br>• kind, for anything else |
| Object | The kind for something the product stores, shows, or acts on. | Cart, Order | **thing** |
| Role | The kind for a person the product serves, records, or gives access to. | Shopper | • **a kind of person**<br>• **actor** |
| Step | The kind for a named stage of the work. | Checkout | stage, for the kind |
| State or value | The kind for a condition a term can be in, or one member of a closed set. | Paid | • state, for the kind<br>• value, for the kind<br>• **state / value**<br>• **States & values** |
| Value-set | The name of a condition, or of a closed set of values. One row on `states-and-values.md`. | Order status | - |
| Family | A group of terms the glossary's pages are arranged by, decided at Gate 1, usually from the source's top-level groups. Not the same as a section: a family is how a reader browses. | Buying - the cart, order, and checkout terms. | • group, for a family<br>• cluster, for a family<br>• domain, for a family |

## 4. How terms relate

| Word | Means | Example | Don't use |
|---|---|---|---|
| Relationship | A stated connection between two terms, written with one relationship word (part 8). | Cart contains Line item. | link, for a relationship |
| Structure relationship | A relationship that says what is part of, or a kind of, what. | contains | - |
| Flow relationship | A relationship that says what comes before, creates, or controls what. | comes before | - |
| Parent | In a structure relationship: the whole, the category, or the term that opens. | Cart, in "Cart contains Line item". | - |
| Child | In a structure relationship: the part, the member, or the term shown. | Line item | - |
| Hierarchy | Every placed term, each under one parent, by level. | - | **outline** |
| Level | How far down the hierarchy a term sits, written L1, L2 and so on. L1 is the top. | Cart at L1, Line item at L2. | **tier** |
| Level table | The hierarchy as a table: one row per term, its level shown by the column it sits in. | - | - |
| Lookup | The table of terms that also belong under another parent, with their takeaways. | Address: shown under Order, also part of Shopper. | **second parents** |
| Takeaway | One fixed sentence in the lookup, from the list in G5 rule 4. | "Address is shared: a change to it affects all of them." | **inference** |
| Family view | Everything shown for one family:<br>• its tree<br>• its picture<br>• its slice<br>• its lookup rows<br>• its terms not placed | - | - |
| Slice | One family's rows of the level table, at the same levels. | - | slice, for a part of a source |
| Context row | A row from another family, shown in a slice so the rows under it keep their parent. | - | - |
| Not placed | Said of a term with no structure relationship. | - | **standalone** |
| Tree | The text drawing of a hierarchy, made with ├── └── and │. | - | - |
| Picture | A diagram, drawn in mermaid. | The family's diagram. | picture, for a section draft or the assembly draft |
| Flow | The order of the steps, and what each one creates or controls. | Checkout, then Payment. | forward thread, except as the method word in brackets |
| Supporting action | A step the source does not pin to one stage; it can happen at any point in the flow. | Notify the shopper. | - |

## 5. How we decide

| Word | Means | Example | Don't use |
|---|---|---|---|
| The three tests | The tests a candidate must all pass to become a term:<br>• special meaning<br>• consequence<br>• reach | - | - |
| Special meaning | Test 1: a newcomer would take the everyday sense and be wrong. | "Cart" means the unpaid items, not a trolley. | - |
| Consequence | Test 2: a misreading would change what is built or tested. | - | - |
| Reach | Test 3: the word is used in more than one section. | Cart appears in Catalogue and Checkout. | feature, in this test |
| Weak word | A source word that is one of:<br>• relative, with no measure<br>• generic<br>• overloaded<br>• clashing with a standard meaning | "quick ship" - quick by what measure? | - |
| Conflict | A clash between words, of one of the conflict types (part 8). | "cart" and "basket" | - |
| Same-meaning test | The test that finds several words with one meaning. | Finds that "cart" and "basket" are one. | **same-thing test** |
| Proposed merge | One row in the assembly draft for words the same-meaning test finds to be one, decided at Gate 1. | Cart (also written as: basket) | - |
| Gate | A point where a person decides. The run stops until every gate row is resolved. | Gate 1 | • **checkpoint**<br>• **gate package** |
| Gate 1 | The gate that settles the words, and which groups become the families. | - | - |
| Gate 2 | The gate that settles the definitions. | - | - |
| Gate row | One item a person must answer, in the gate log. | G1-03: are "cart" and "basket" one? | **gate item** |
| Recommendation | What the method proposes for a gate row. Never a decision. | "Use Cart." | - |
| Resolution | The person's answer to a gate row. | "Yes, use Cart." | • call, for a resolution<br>• **your call** |
| Decision | A resolved gate row, recorded in the decision register as D-n. | D-12 | - |
| Retired word | Any word the glossary no longer uses, whatever happened to it. The umbrella for the "What happened" list (part 8). | "basket", after the merge into Cart. | retired, for one of the outcomes |

## 6. What we write

| Word | Means | Example | Don't use |
|---|---|---|---|
| Glossary | The seven pages:<br>• the README<br>• terms and relationships<br>• the four kind pages<br>• the decision register | - | - |
| Page | Anything the method writes for a person to read:<br>• the seven glossary pages<br>• the deep-dives pages | `object-terms.md` | document, for a page |
| File | Used only when naming a file or folder on disk. | - | - |
| Kind page | One of the four pages that define terms of one kind. | `role-terms.md` | **kind document** |
| Part | A numbered division of a page. A sub-part sits inside a part. | "1. Families at a glance" | section, for a part of a page |
| Deep-dives | The folder of evidence kept with the glossary. | - | **working folder** |
| Section draft | The page holding one section's three readings, with evidence. | `checkout/checkout-glossary.md` | picture, for a section draft |
| Section decisions | The page giving the glossary's word for each candidate in a section draft. | `checkout/checkout-decisions.md` | - |
| Assembly draft | The page joining all section drafts, made before Gate 1. | - | • **joined picture**<br>• **assembled picture** |
| Gate log | The page holding every gate row, open or resolved. | - | - |
| Decision register | The page holding every decision, one row each. | - | - |
| Template | The blank shape of a page. Copied, never retyped. | `templates/role-terms.md` | **skeleton** |
| Fixed block | The definitions every glossary page relies on, printed in the README and copied from this list. | - | - |
| Explainer | The four lines that open every numbered part:<br>• What you're reading<br>• Why it matters<br>• What to do with it<br>• What it affects | - | - |
| Column guide | The list under "How to read this page" that says what each column holds on that page. | - | **legend** |

## 7. After the glossary exists

| Word | Means | Example | Don't use |
|---|---|---|---|
| Drift | A document using a word differently from the glossary. | A story that still says "basket". | - |
| Finding | One drift that check reports. | - | - |
| Next best action | What disposition decides for one finding: one of the values in the Next best action list (part 8). | Change the glossary. | • disposition, for what it decides<br>• action, for what it decides |
| Change | What disposition does to an entry: one of the changes (part 8). | Rename Basket to Cart. | - |
| Ripple list | Every line in other documents that still uses a retired word after a change. | - | **impact shape** |

---

## 8. Lists

Each list is complete: no other value is ever used.

### The four kinds

Used in the Kind column on every page that has one.

| Value | Means |
|---|---|
| object | something the product stores, shows, or acts on |
| role | a person the product serves, records, or gives access to |
| step | a named stage of the work |
| state or value | a condition a term can be in, or one member of a closed set |

### Relationship words

Used in the Relationship column of every table that lists relationships, and in every relationship written in a sentence. On `terms-and-relationships.md`, which shows structure, the two ends of every relationship are written `<parent>` and `<child>`, so produces reads "A <parent> creates a <child>."

| Value | Means | Reads as |
|---|---|---|
| contains | the first is the whole, the second a part of it | Each <child> is part of a <parent>. |
| kind of | the first is the category, the second a member of it | A <child> is one kind of <parent>. |
| reveals | opening the first shows the second | Opening a <parent> shows its <child>. |
| produces | the first creates the second | A <first> creates a <second>. |
| comes before | the first happens, then the second | <First> happens before <second>. |
| locks | the first stops the second from happening | <First> stops <second> from happening. |
| unlocks | the first lets the second happen | <First> lets <second> happen. |
| re-checks | the first re-examines the second and updates it | <First> re-examines <second> and updates it. |

### Conflict types

Used in the Conflict type column of each section draft, and to name the conflict in each Gate 1 conflicts row.

| Value | Means |
|---|---|
| several words, one meaning | synonyms to collapse into one term |
| one word, several meanings | a word to split or narrow |
| part vs whole | a whole confused with one of its parts |
| clashes with a method word | a product word that is also a word in this list |
| drift between sources | one meaning named differently in different sources |

### Gate row status

Used in the Status column of the gate log.

| Value | Means |
|---|---|
| open | raised, not yet answered |
| accepted | the person took the recommendation |
| overridden | the person chose another option |
| answered | the person answered a question |

### Outcome

Used in the Outcome column of each section decisions page.

| Value | Means |
|---|---|
| kept | a term, under the same word |
| renamed | a term, under a different word |
| merged | the same meaning as another term, and now goes by that term's word |
| dropped | not a term |
| pending | its meaning is not stated in the source; it waits for an answer |

### What happened

Used in the What happened column of the "Terms replaced or retired over time" table on each kind page. Every value describes a retired word.

| Value | Means |
|---|---|
| renamed | the term now goes by another word |
| merged | the word now goes by another term's word |
| split | the term became two or more terms |
| withdrawn | the term was taken out, with nothing in its place |

### Change

Used by disposition, to name the change in each row of the gate log's Change part. It is not a column, so the column check does not apply.

| Value | Means |
|---|---|
| rename | give a term a new word |
| redefine | give a term a new definition |
| split | make one term into two or more |
| merge | fold one term into another |
| withdraw | take a term out, with nothing in its place |

### Re-run outcome

Used in the Re-run column of a section draft.

| Value | Means |
|---|---|
| add | new - nothing in the glossary covers it |
| merge | the same meaning as a term, under a new word |
| change | an existing term whose meaning has shifted |
| no change | already in the glossary, same meaning |

### Persona or access role

Used in the "Persona or access role" column of `role-terms.md`.

| Value | Means |
|---|---|
| persona | a person the product is designed around |
| access role | a label that grants access or duties |

### Issue

Used in the Issue column of check findings.

| Value | Means |
|---|---|
| a retired word in use | the document uses a word the glossary no longer uses |
| a term used against its definition | the word is right, the meaning is not |
| a product word with no entry | a word that would pass the tests, but has no entry |
| two words for one meaning | the document uses two words where the glossary has one term |

### Next best action

Used in the Next best action column of check findings.

| Value | Means |
|---|---|
| fix the document | the glossary is right; the document changes |
| change the glossary | the document shows the glossary is wrong; disposition changes it |
| add the term through harvest | a new product word; harvest adds it |
