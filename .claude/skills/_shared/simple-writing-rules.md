# Simple writing rules

> **What this is:** The rules every document in the kit follows. With them, a reader whose first language isn't English understands each document the first time. This file also holds the word lists that the check program reads.
>
> **What it is not:** The rules for one kind of document. Each document's template and skill add their own rules, and they follow these.
>
> **Who uses it:** Every skill that writes a document, and every check program before its gate. And you, when you add a word to a list.

**The rule: every skill, every file, every time.**
- Every skill follows these rules for every file it writes or changes, and for every message at a gate. It follows them every time, not only for a new document.
- After it writes, the skill runs the quick check on each file it wrote or changed: `node tools/check-simple-writing.cjs --file {file}`. Once the project has a Glossary, it adds `--project {project}`, so the agreed Glossary words are allowed. It fixes everything the check lists to fix, and runs the check again.
- When the skill's own check program already runs this check, that counts as the quick check.
- At the gate, the skill shows the one line the quick check prints for each file, such as "Simple writing, lending.md: 0 to fix, 4 to look at."
- No program can check a message at a gate. For gate messages, the rule is an instruction only. The skill follows it as it writes each message.

*Every author skill points to this file. `conventions.md` holds no writing rules. The check is `tools/lib/simple-writing.cjs`. Every check program runs it, and `tools/check-simple-writing.cjs` runs it on any one document.*

## 1. Who we write for

Our readers know the business well, but English is not their first language. They read every word, often twice. So every sentence must:
- have one meaning only
- be clear the first time it is read
- keep every fact

## 2. The rules

The examples are for a made-up online shop.

| # | The rule | Before | After |
|---|---|---|---|
| 1 | One idea per sentence. A sentence over 20 words is flagged for you to look at. | "A customer pays, and the order moves to packing, where a free picker takes it." | A customer pays. The order moves to packing. A free picker takes it. |
| 2 | One rule at a time. Give each rule its own sentence. In a list, give each rule its own bullet. Never join two rules with a semicolon. | "only while Open; refused when empty" | • only while the order is **Open**<br>• refused when the cart is empty |
| 3 | Use everyday words. The hard words list says what to write instead. | "The address is read-only." | The address can be seen, but not changed. |
| 4 | Don't point at a place the reader can't see. Name the step or the thing. | "Addresses are managed in one place." | A customer adds, changes and removes addresses in the Account step. |
| 5 | Say who does it. | "The refund is approved." | A store manager approves the refund. |
| 6 | Say it directly, with no figure of speech. | "The cart is the customer's home for items." | The cart holds the items a customer wants to buy. |
| 7 | Write a state's name in bold inside a sentence. | "only while Open" | only while the order is **Open** |
| 8 | Don't put many describing words before a noun. | "a single, secure, guest-friendly checkout" | one checkout. It is secure, and a guest can use it. |
| 9 | Write numbers as digits. | "five or more items" | 5 or more items |
| 10 | No side notes in dashes or brackets. Make the side note its own sentence. | "The order (paid, packed and labelled) is sent." | The order is paid, packed and labelled. Then it is sent. |
| 11 | Write what the client needs in our words, not the client's. Part 4 says where the client's words are kept. `atomic-rules.md` says how to cut a client row into requirements. | "Orders are fulfilled in one place by the picker." | A picker packs each order in the Packing step. |

## 3. What simple writing never does

- It never drops a condition, a number or a source.
- It never picks one meaning when a phrase has two. That phrase becomes a question in the Question log.
- It never changes an agreed Glossary word on its own. A hard Glossary word is changed only at the Glossary's Gate 1. The old word stays as "also written as".

## 4. Our words, not the client's

**The rule.** A requirement is written in simple words, in every document. The client's exact words are not copied into a requirement.

**Where the client's exact words are kept:**

| Place | Why they are kept |
|---|---|
| The PRD's "The client's words" column, next to the simple words | • Each requirement can be checked against its source.<br>• A new version of the client's file can be compared row by row. |
| The Discovery brief's quotes from each file | They are the notes on what each file says, before anything is decided |
| The Glossary's `deep-dives/` pages | They are the evidence behind each word |
| A Change impact report's old words and new words | They show exactly what changed in the client's file |

**Copies of our own words stay the same.** Sometimes a document copies another kit document. For example, a story quotes its FRD's rule. That copy stays word for word, so one rule has one wording everywhere. Those copies are simple, because what they copy is simple.

**Why, from BABOK v3:**

| BABOK v3 | What it says, in short | What it means for the kit |
|---|---|---|
| 4.4 Communicate Business Analysis Information | Share information in language, tone and style that suit the audience. | Write for readers whose first language isn't English. |
| 7.1 Specify and Model Requirements | The analyst analyses, combines and refines elicitation results into requirements. | A copied quote is an elicitation result. It is not yet a requirement. |
| 7.2 Verify Requirements | A good requirement is understandable in the audience's own terms, has one meaning, and is concise. | The simple words are the requirement. |
| 4.3 Confirm Elicitation Results | Elicitation results are checked against their source. | The client's words stay next to the simple words, for checking. |
| 5.1 Trace Requirements | Each requirement can be traced back to its source. | Each row keeps its source: the file, its version and its place. |
| 10.18 Document Analysis | Notes on a document hold its exact details next to a summary in the analyst's words. | Exact quotes belong in the Discovery brief, not in the PRD's requirements. |

## 5. Where these rules apply

**They apply to every sentence the kit writes:**
- the text of every document
- headings and table cells
- the notes in each template's Placeholders part: what the template is for, and what each section holds
- every message at a gate

**They don't apply to:**
- the client's exact words, in the places part 4 lists
- IDs, file names, links and code
- a Glossary word, once the Glossary has agreed it. Gate 1 tests each word for simple writing first.

## 6. How the check works

`tools/lib/simple-writing.cjs` reads a document and the lists in part 7. Every check program runs it before its gate. Anything "to fix" is a finding, and the skill fixes it before you see the document. Anything "to look at" is shown to you at the gate.

| What it finds | What happens |
|---|---|
| A word or phrase from one of the lists | To fix. The skill fixes it before the gate, and checks again. |
| A semicolon | To fix. It joins two ideas or two rules. |
| A side note after a dash, or in brackets of 4 or more words | To fix. |
| A sentence over 20 words | To look at. You see it at the gate. It never fails the check. |
| In the PRD, simple words that are the client's words, copied | To look at. Hard words in the copy are already to fix. A copy of words that are already simple is shown, so you can check it says who does what. |
| In the PRD, a number in the client's words that the simple words don't have | To look at. A fact may be lost. |
| In the PRD, fewer words such as "no", "not" and "never" in the simple words | To look at. A condition may be lost. |

**What the check allows on purpose:**
- "There" when it starts "there is", "there are" and the like
- a word that can't be checked, in a line or table cell that also names its question, such as "as needed, question 9". The question asks the client for the limit.
- "and so on" right after 2 items that show the pattern, such as "F-01, F-02 and so on"
- a dash after a label that starts a line or a cell: a bold label, such as "**Accept** — Why you'd pick it", an ID, such as "F-03.dw1 — Each manager sees…", one word, such as "Penalty — paying…", an FRD rule's source, such as "proposed — Why:", or "Does not apply —"
- a dash before a citation, a gap's label, a reason or an owner, such as "— per BR-12", "— Proposed (needs confirmation), question 4", "— TBD", "— why: every amount is in euros" or "— owned by EPIC-001"
- the first dash in a heading, such as "Decision 2 — Which currencies?"
- the labels "Proposed (needs confirmation)", "(Work Item ID pending)" and "(also written as: …)"
- an agreed Glossary word or value, even when a list has it. Gate 1 already tested it for simple writing.
- a name in the "Kit names kept for now" list, in part 7

## 7. Word lists

*Each list is a table. The check matches each word or phrase as a whole word, in any case. To add a word, add a row. The check finds it everywhere from its next run.*

### Hard words

| Word or phrase | Say instead |
|---|---|
| attributable | linked to the person who did it |
| • attributed to<br>• attribute every<br>• attribute each | recorded as done by |
| configuration | settings |
| • utilise<br>• utilize<br>• utilised<br>• utilized | use |
| • facilitate<br>• facilitates | help |
| • leverage<br>• leverages | use |
| tractable | possible |
| downstream | later |
| upstream | earlier, or needed first |
| • subsequent<br>• subsequently | later |
| prior to | before |
| in order to | to |
| • commence<br>• commences | start |
| • terminate<br>• terminates | end |
| sufficient | enough |
| approximately | about |
| additional | more |
| • ensure<br>• ensures | make sure |
| • indicate<br>• indicates | show |
| • modify<br>• modifies | change |
| • obtain<br>• obtains | get |
| via | through |
| e.g. | for example |
| i.e. | that is |
| whereby | by which |
| respectively | name each one |
| aforementioned | name it |
| whilst | while |
| upon | on |
| • deem<br>• deemed | consider |
| • pertaining to<br>• with regard to<br>• in respect of | about |
| holistic | whole |
| granular | detailed |
| canonical | agreed |
| provenance | where it came from |
| • govern<br>• governs | control, or decide |
| read-only | can be seen, but not changed |
| • rotate<br>• rotates<br>• rotating | replace with a new one |
| • resume<br>• resumes<br>• resumed | continue, or open again |
| estate | set of systems |
| control plane | say what it does |
| verbatim | word for word |
| such that | so that |
| thereby | so |
| henceforth | from now on |
| notwithstanding | even though |
| ad hoc | one-off |
| bespoke | custom |
| ascertain | find out |
| discrepancy | difference |
| in lieu of | instead of |
| prerequisite | what must exist first |
| • seamless<br>• seamlessly | say what happens |
| • artifact<br>• artifacts<br>• artefact<br>• artefacts | document, or result |
| • surface<br>• surfaces | show, or name the step |
| tranche | part |
| cohort | group |
| • mitigate<br>• mitigates | reduce |
| articulate | say |
| delineate | describe |
| enumerate | list |
| • encompass<br>• encompasses | include |
| • comprise<br>• comprises | has, or is made of |
| • constitute<br>• constitutes | is, or makes up |
| pertinent | relevant |

### Figures of speech

| Word or phrase | Say instead |
|---|---|
| • a home<br>• one home<br>• its home<br>• stable home<br>• the home for | say where it is kept |
| • lives in<br>• live in<br>• lives only in<br>• live only in | is kept in, or is written in |
| on the record | recorded |
| • gates the<br>• gate the | works only when |
| • powers a<br>• powers the<br>• powers its | does, or runs |
| • steer<br>• steers<br>• steer by<br>• steerable | guide, or change |
| • in the weeds<br>• into the weeds | in the details |
| from above | say who, and how |
| • heavy lifting<br>• heavy work | the hardest work |
| under the hood | inside |
| • source of truth<br>• one true copy | the agreed copy |
| load-bearing | most important |
| north star | main goal |
| low-hanging fruit | easy first step |
| • rests on<br>• rest on | is based on |
| opens to | links to |
| • hands off<br>• hand off<br>• handed off<br>• hand-off | passes to |
| baked in | built in |
| out of the box | as standard |
| at a glance | in short |
| grown in place | built up in this file |
| • carries<br>• carry<br>• carrying<br>• carried | has, or keeps |
| • driving link<br>• driving edge | the link that causes it |
| true baseline | facts |
| • bubble up<br>• bubbles up | show |
| drill down | look in detail |
| moving parts | parts |
| big picture | overview |
| move the needle | make a difference |
| day one | from the start |

### Pointing words

| Word or phrase | Say instead |
|---|---|
| here | name the step or the thing |
| there | name the step or the thing |
| • one place<br>• single place | name the step or the thing. In a requirement, when the client names none, raise a question. |
| • see above<br>• as above<br>• the above<br>• shown above<br>• listed above | name the part, or link to it |
| • see below<br>• as below<br>• the below<br>• shown below<br>• listed below | name the part, or link to it |
| • the former<br>• the latter | name it |
| • herein<br>• therein<br>• thereof<br>• hereby | name it |

### Words that can't be checked

*A sentence with one of these words can't be checked yes or no. In a requirement, when the client's words give no limit, don't make one up: raise a question. This list is Q4 in `quality-characteristics.md`.*

| Word or phrase | Say instead |
|---|---|
| • etc.<br>• and so on | name every item, or ask for the full list |
| • as appropriate<br>• as needed<br>• where applicable | say when, as a rule |
| • flexible<br>• various<br>• robust | say exactly what |
| properly | say what correct looks like |

### Kit names kept for now

*Names the kit's own method defines, which other documents and programs use. The check allows them. Each one is renamed only by a change to the method that defines it.*

| Name | Why it stays for now |
|---|---|
| Families at a glance | The Glossary method defines it in `method-words.md`. The approved copy of the method and the data model design use it. |
| Every relationship, as a table (verbatim) | A label from the Glossary method's closed list, in `glossary-assembly-principles.md`, G4. |
| Every flow relationship, as a table (verbatim) | A label from the Glossary method's closed list, in `glossary-assembly-principles.md`, G4. |
