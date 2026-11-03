# Things — {product name}

Status: drafted

Next step: {next step}

## {Family}

Data model file: [{file}]({file})

| Thing | Definition |
|---|---|
| {Thing} | {definition} |

Kind of:

- {kind}

Left out: {left out}

## Decisions to make

| Decision | Question | Recommended | Why |
|---|---|---|---|
| {ID} | {question} | {recommended} | {why} |

## Waiting on the Glossary

| Change | Word | What the Glossary needs |
|---|---|---|
| {GC ID} | {word} | {what the Glossary needs} |

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The things a product keeps information about, found from its Glossary. Each Glossary family gets one section, which names the family's data model file. While a decision every family shares is open, this file lists it too. So does each family's data model file, with "? ({ID})" in each cell the decision answers.
- **What it is not:** The actions, fields and rules of each thing, which are in each family's data model file. The decisions themselves, which are in the data model's decisions file.
- **Written by:** things-author, from `templates/data-model-things.md`, as `data-model-design.md`, step 1 and gate 1, say. Checked by check-data-model.cjs before its gate. When you accept the things, accept.cjs sets the status line. It also saves a copy of this file and of the decisions file.
- **File name:** `Output/{project}/glossary/data-models/{product}-glossary-things.md`, such as `city-library-glossary-things.md`.
- **The Next step line:** what the person needs to do next. Before the gate, it says to settle the open decisions and accept the things. Once they are accepted, it reads "None: the things are accepted."

### What each section holds

| Section | What it holds |
|---|---|
| {Family} | One section per Glossary family with at least one thing, in the Glossary's order. Its first line names the family's data model file, once. Then comes one row per thing in the family, in the Glossary's order, with its definition word for word. "Kind of" appears only when the Glossary makes a thing of the family one kind of another thing, on its kind page or in `terms-and-relationships.md`. It has one bullet per such thing. Each bullet names the other thing's family when it is another one. "Left out" appears only when the family has a word that becomes nothing. Words that become a field or a field's choices are not listed. data-model-author puts them on their thing. |
| Decisions to make | Appears only when a product-wide decision is open: one that would be asked the same way in every family's file. One row per decision, in the order of the decisions file, with the recommended answer and why. A decision answered "I don't know yet" is still open, so it stays in the table. A settled decision leaves the table. |
| Waiting on the Glossary | Appears only when a word can't be placed. The word is left out and raised as a Glossary change, in the decisions file. One row per change, until the Glossary settles it. |
| Check record | The record of the last check, pasted exactly as check-data-model.cjs printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name | City library |
| {next step} | what the person needs to do next | settle the 1 open decision, then accept the things, so step 2 can start |
| {Family} | the Glossary family, as the Glossary writes it | Lending |
| {file} | the family's name in lowercase with hyphens, then .md | lending.md |
| {Thing} | the thing, in the Glossary's word | Loan |
| {definition} | the Glossary's definition, word for word | One lending of a book to a member, due back by a date. |
| {kind} | one thing of the family that is one kind of another thing. Add that other thing's family in brackets when it is another one. | Audiobook, one kind of Book (Books) |
| {left out} | each word that becomes nothing, with why in brackets | Catalogue (a screen) |
| {ID}, {question}, {recommended}, {why} | the product-wide decision's ID, its question, the recommended option and why, as the decisions file has them | • DM-1<br>• Can volunteers act in the first release?<br>• Not in the first release<br>• the BRD never names anything volunteers do |
| {GC ID}, {word}, {what the Glossary needs} | the Glossary change's ID, the word waiting on it, and what the Glossary needs to settle | • GC-1<br>• Shelf status<br>• it belongs to nothing: which thing holds it? |

### Example: City library

The things file of a made-up City library, at its gate. Barcode, Paperback, Hardback and Loan state are not listed. data-model-author makes them Book's barcode field, the choices in Book's format field, and Loan's state field. No product-wide decision is open, and no thing is a kind of another, so neither part appears.

#### Things — City library

Status: drafted

Next step: accept the things, so step 2 can start

##### Books

Data model file: [books.md](books.md)

| Thing | Definition |
|---|---|
| Book | A title the library lends, with its author, barcode and format. |

Left out: Catalogue (a screen)

##### Lending

Data model file: [lending.md](lending.md)

| Thing | Definition |
|---|---|
| Loan | One lending of a book to a member, due back by a date. |

##### Members

Data model file: [members.md](members.md)

| Thing | Definition |
|---|---|
| Member | A person registered to borrow, with a name and an email. |

Left out: Librarian (no details kept)

##### Check record

None yet.
