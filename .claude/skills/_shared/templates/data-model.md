# Data model — {family name}, {product name}

Status: drafted

Next step: {next step}

## Things and their fields

| Thing | Fields it gives |
|---|---|
| {Thing} | {fields} |

## {Thing}

Definition: {definition}

A {thing} is one kind of {Parent}. What holds for every {Parent} is written in {parent file}.

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| {action} | {step} | {who} | {rules} |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| {field} | {type} | {required} | {limits} | {can two share it} | {can change} | {starts as} |

**How {status field} moves**

```
{picture}
```

| From | To | When | Who |
|---|---|---|---|
| Start | {to} | {when} | {who} |
| {from} | {to} | {when} | {who} |

| State | The {thing}… |
|---|---|
| {value} | {what it means} |

**Decisions to make**

| Decision | Question | Recommended | Why |
|---|---|---|---|
| {ID} | {question} | {recommended} | {why} |

**Waiting on the Glossary**

| Change | What the Glossary needs | Proposed |
|---|---|---|
| {GC ID} | {what the Glossary needs} | {proposed} |

## Adds to {Thing}

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| {action} | {step} | {who} | {rules} |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| {field} | {type} | {required} | {limits} | {can two share it} | {can change} | {starts as} |

**How {status field} moves, in {family name}**

| From | To | When | Who |
|---|---|---|---|
| {from} | {to} | {when} | {who} |

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** One Glossary family's things. For each thing, it holds its actions, the rules for each field, and how it moves. A story writer turns each of them into the same tests every time.
- **What it is not:** Screens, how the data is stored, or data passed to or from outside systems. The reasons for each decision, which are in the data model's decisions file.
- **Written by:** data-model-author, from `templates/data-model.md`, as `data-model-design.md`, steps 2 to 7 and gate 2, say. Checked by check-data-model.cjs before its gate. When you accept the file, accept.cjs sets the status line. It also saves a copy of this file and of the decisions file.
- **File name:** `Output/{project}/glossary/data-models/{family}.md`. {family} is the family's name in lowercase with hyphens, such as `lending`, as `project-folders.md` says.
- **The Next step line:** what the person needs to do next. Before the gate, it says how many decisions are open. Once the file is accepted, it reads "None: this file is accepted." When a decision is still open after the gate, it names that decision too.

### What each section holds

| Section | What it holds |
|---|---|
| Things and their fields | One row per thing in this family, then one per thing this family adds to, in the order of their parts. Each row lists the fields of that part's rules table, in the same order. |
| {Thing} | One part per thing in this family, in the Glossary's order. Its parts come in the order the next table gives. |
| Adds to {Thing} | One part per thing from an earlier family that this family adds a field, an action or a move to. It holds only what this family adds, and leaves out any table it adds nothing to. When it has open decisions, it ends with "Decisions to make". |
| Check record | The record of the last check, pasted exactly as check-data-model.cjs printed it. |

### What each part of a thing holds

| Part | When it appears | What it holds |
|---|---|---|
| Definition | always | The Glossary's definition, word for word. |
| The "kind of" line | only when the Glossary makes the thing one kind of another thing, on its kind page or in `terms-and-relationships.md` | The other thing, and the data model file that holds its part, even when it is in another family. |
| Actions | always | One row per action, in the order the work happens: make, find, open, change, move on, remove. A thing that is part of another has no Browse or Open row. |
| The rules table | always | One row per field, in the order of "Things and their fields". |
| How {status field} moves | only for a field that holds a status or a step, and only with the moves this family's part of the PRD names | The picture, the moves, and what each state means. A move back to an earlier value is a row of its own. When the sources rule a move back out, its row is left out, and one line under the table says so. When it is open, one line under the table says "Moves back to an earlier state: ? ({ID})". |
| Decisions to make | only when the thing has an open decision | One row per open decision, in the order of the decisions file, with the recommended answer and why. A decision answered "I don't know yet" is still open, so it stays. So does a product-wide decision still open, under each thing with a cell it answers. A settled decision leaves the table. It comes after how it moves, or after the rules table when nothing moves. |
| Waiting on the Glossary | only when the thing has a gap that needs a Glossary change | One row per change, as the decisions file has it, until the Glossary settles it. A gap waiting on it is written "? ({GC ID})". It comes last in the thing's part. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {family name} | the Glossary family's name, as the Glossary writes it | Lending |
| {product name} | the product's name | City library |
| {next step} | what the person needs to do next | settle the 5 open decisions. Each one is listed under its thing with a recommended answer. At gate 2, take the recommendation or pick another option. |
| {Thing} and {thing} | the thing, in the Glossary's word, and in lowercase inside a sentence | Loan, loan |
| {fields} | its fields, in order | book, member, due date, state |
| {definition} | the Glossary's definition, word for word | One lending of a book to a member, due back by a date. |
| {Parent} | the thing the Glossary says this thing is one kind of | Book, for Audiobook |
| {parent file} | the data model file that holds that thing's part | books.md |
| {action} | a short verb, in the sources' word where they have one | Borrow |
| {step} | the Glossary step it happens in: the step a flow row names, or else the step this family's part of the PRD describes. Write "–" when the Glossary has no step for it. | Lending |
| {rules} | what must hold for the action: what it needs first, when it is refused, what else it makes or removes, and whether several can be done at once. Each rule is one short, plain sentence. Where there is a gap, write ? and its decision. | Only while On loan |
| {field} | the field's name, in plain words | due date |
| {type} | one of these:<br>• text<br>• number<br>• date<br>• yes or no<br>• one of, then each choice as a bullet on its own line<br>• one or more of, then each choice as a bullet on its own line<br>• one {Thing}<br>• several {Things}<br>• file<br>• a street address<br>• a web address<br>• an email address<br>Add "set from {field}" when the product works it out. | one of:<br>• On loan<br>• Overdue<br>• Returned |
| {required} | yes, no, or yes, only when… | yes |
| {limits} | a length, range, format or most allowed, or a rule that ties it to another field | three weeks after it is lent |
| {can two share it} | yes or no: can two loans, or two of whatever the thing is, have the same value in this field? | yes |
| {can change} | one of these:<br>• yes<br>• no<br>• only while {value}<br>• follows {field}<br>• moves: see How {status field} moves | only while On loan |
| {starts as} | its value when the thing is first made | On loan |
| {status field} | the field that holds the status or step | state |
| {picture} | one line: Start, then the main path through the values, joined by → one way and ⇄ both ways. Other moves appear only in the table. | Start → On loan → Overdue → Returned |
| {from}, {to} | the value a move leaves, Start for a new thing, and the value it reaches | On loan, Overdue |
| {when} | what causes the move, or ? and its decision | the due date passes without a return |
| {who} | one of these:<br>• a Glossary role<br>• "the product", when it happens by itself<br>• ? and its decision | Member |
| {value} and {what it means} | one value, and what the thing has or allows while it holds it, and what unlocks next, in positive terms | • Overdue<br>• lets its member borrow again once it is returned |
| {GC ID}, {what the Glossary needs}, {proposed} | the Glossary change's ID, what it asks the Glossary to settle, and the proposed answer, as the decisions file has them | • GC-2<br>• a state for Shelf<br>• Shelf state, with the values On shelf and Missing |
| {ID}, {question}, {recommended}, {why} | the decision's ID, its question, the recommended option and why, as the decisions file has them | • DM-4<br>• Can a loan be removed?<br>• Keep every loan as a record<br>• a returned loan is part of the member's history |

**Gaps.** Every gap, in any cell, is written "? ({ID})". The ID is the decision or the Glossary change opened for it in the decisions file. The cell keeps "? ({ID})" while its decision is open, even when you answered "I don't know yet". The one exception is a question the PRD left open. Its cell holds the question's recommended answer, then "Proposed (needs confirmation)" and the question's number, such as "up to 2 times, Proposed (needs confirmation), question 7".

### Example: City library, lending.md

**What it was made from**

- **Glossary, Lending family:**
  - Loan, an object: "One lending of a book to a member, due back by a date."
  - Loan state, which belongs to Loan: On loan, Overdue, Returned
  - Lending, a step, which produces a Loan
- **Glossary, roles:** Member, Librarian
- **BRD, BR-03:** Members borrow and extend their own loans. Librarians look after the books.
- **PRD, Lending section:**
  - **REQ-2.1** A member borrows a book: the new loan is on loan, for exactly one book and one member, which never change, and is due back three weeks after it is lent.
  - **REQ-2.2** A loan not returned by its due date becomes overdue. A member with an overdue loan can't borrow another book.
  - **REQ-2.3** A due date can be extended, only while the loan is on loan.
  - **REQ-2.4** A member can have up to five loans at a time.

**The document**

#### Data model — Lending, City library

Status: drafted

Next step: settle the 5 open decisions. Each one is listed under its thing with a recommended answer. At gate 2, take the recommendation or pick another option.

##### Things and their fields

| Thing | Fields it gives |
|---|---|
| Loan | book, member, due date, state |

##### Loan

Definition: One lending of a book to a member, due back by a date.

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Borrow | Lending | Member | For exactly one book. Refused while the member has an Overdue loan, or already has 5 loans. |
| Browse | Lending | ? (DM-5) | ? (DM-5) |
| Open | Lending | ? (DM-5) | ? (DM-5) |
| Extend | Lending | Member | Only while the loan is On loan. |
| Return | Lending | ? (DM-2) | ? (DM-2) |
| Remove | Lending | ? (DM-4) | ? (DM-4) |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| book | one Book | yes | – | ? (DM-1) | no | – |
| member | one Member | yes | a member can have at most 5 loans at a time | yes | no | – |
| due date | date | yes | three weeks after it is lent | – | only while On loan | – |
| state | one of:<br>• On loan<br>• Overdue<br>• Returned | yes | – | – | moves: see How state moves | On loan |

**How state moves**

```
Start → On loan → Overdue → Returned
```

| From | To | When | Who |
|---|---|---|---|
| Start | On loan | a member borrows a book | Member |
| On loan | Overdue | the due date passes without a return | the product |
| On loan | Returned | ? (DM-2) | ? (DM-2) |
| Overdue | Returned | ? (DM-2) | ? (DM-2) |

Moves back to an earlier state: ? (DM-3)

| State | The loan… |
|---|---|
| On loan | can have its due date extended |
| Overdue | lets its member borrow again once it is returned |
| Returned | ? (DM-2) |

**Decisions to make**

| Decision | Question | Recommended | Why |
|---|---|---|---|
| DM-1 | Can the same book be on two loans at the same time? | No: a book is on one loan at a time | a book is one copy, with its own barcode |
| DM-2 | How does a loan become Returned, and who returns it? | When a librarian checks the book back in | librarians look after the books, so they see each one come back |
| DM-3 | Can a loan go back to an earlier state? | Never | a returned book is back on the shelf |
| DM-4 | Can a loan be removed? | Keep every loan as a record | a returned loan is part of the member's history |
| DM-5 | Who can see the list of loans, and open one? | A member sees and opens their own loans. A librarian sees and opens every loan. | members need their due dates, and librarians look after the books |

##### Check record

None yet.

The decisions themselves are in the decisions file. Its template, `data-model-decisions.md`, shows DM-4 as its example.
