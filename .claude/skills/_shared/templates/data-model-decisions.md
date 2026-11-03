# Data model decisions — {product name}

Status: drafted

## Open

### {ID} — {question}

- **Where:** {where}
- **Why I'm asking:** {why}
- **Options:**
  - **{option}.** Why you'd pick it: {why pick}. What happens next: {what next}
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** {option}, because {reason}
- **How it is asked:** {how asked}
- **Chosen:** open

## Settled

### {ID} — {question}

- **Where:** {where}
- **Why I'm asking:** {why}
- **Options:**
  - **{option}.** Why you'd pick it: {why pick}. What happens next: {what next}
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** {option}
- **Chosen:** {chosen}
- **Decided by:** {who}, {date}

## Glossary changes

### {GC ID} — {term}

- **The Glossary says:** {glossary says}
- **What is needed:** {needed}
- **Proposed:** {proposed}
- **Raised from:** {raised from}
- **Status:** {gc status}

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** Every decision the data model asks you, open or settled. It also holds every Glossary change the data model needs.
- **What it is not:** The Question log. The data model's decisions stay with the specifier. None of them goes into the Question log, or onto the list for the client. The client sees each one later, only as an FRD rule. It never holds a change to the requirements either. The data model works from the Glossary, and never comments on the requirements.
- **Written by:** things-author and data-model-author, from `templates/data-model-decisions.md`. `data-model-design.md` opens the decisions in steps 1, 5 and 6, and settles them at gates 1 and 2. It opens the Glossary changes in steps 1 and 5. It sends them to the Glossary together in step 8, and brings their answers into the data model in step 9. "Where each gap goes", in the design's section 2, says which gap goes where. Checked by check-data-model.ts, with the things file or a data model file, before each gate.
- **File name:** `Output/{project}/glossary/data-models/{product}-data-model-decisions.md`. There is one per product.
- **The status line:** a skill sets it to "drafted" when it adds an entry or settles one. You accept the things file or a data model file. Then accept.ts saves a copy of this file too, and sets its status line. A mark on a Glossary change, such as "Raised" or "Settled in the Glossary", leaves the status line as it is. The next acceptance saves the mark.

### What each section holds

| Section | What it holds |
|---|---|
| Open | Every decision still open, in the order it was opened. A decision answered "I don't know yet" stays open, with "Proposed: {answer}" under "Chosen". When there is none, the section says "None yet." |
| Settled | Every decision you settled, in the order you settled it. A settled decision is never edited. When there is none, the section says "None yet." |
| Glossary changes | Every Glossary change the data model needs, in the order it was opened, with its status. The Glossary settles it, never this file. When there is none, the section says "None yet." |
| Check record | The record of the last check, pasted exactly as check-data-model.ts printed it. |

### The rules

- IDs run DM-1, DM-2 and so on across the whole product, in the order the decisions are opened, with no gaps.
- An open decision moves to "Settled" once you choose.
- "I don't know yet" keeps it under "Open", with "Proposed: {answer}" under "Chosen". {answer} is the recommended one. Each cell it answers still shows "? ({ID})". It is never forgotten:
  - `status.ts` lists it, under "Data model, still open".
  - The skill that owns it asks it again first, at its next run. That is things-author for a product-wide decision, and data-model-author for the decision of one file.
- When two requirements disagree, or the BRD and the PRD do, that is a decision too. Its options are the answers they give. You pick which one the data model uses.
- A settled decision is never edited. A later change adds a new entry, with the next ID, whose question starts "Replaces DM-{n}:". Each ID has one entry only.
- A Glossary change is numbered GC-1, GC-2 and so on across the whole product. The data model collects all of them first. Once every data model file is accepted, all of them go to glossary-disposition together, in one run. Its status shows where it is:
  - "To raise": found, and waiting for the others
  - "Raised": sent to glossary-disposition, with the others
  - "Left open on {date}": you answered "I don't know yet" at glossary-disposition's gate, or glossary-author left the new word open. It stays open in this file, and never goes into the Question log. The skill that raised it asks it again first, at its next run.
  - "Settled in the Glossary on {date}": the Glossary has its answer
  - then "Settled in the Glossary on {date}. Brought into the data model on {date}": the data model is in step with it
- A decision is only ever about a rule. If its answer would add a term, a state or a value the Glossary doesn't have, the decision is replaced and a Glossary change is raised instead. If its answer would add an action big enough to be a feature, the data model writes that action only when the Glossary names it. Otherwise the decision is asked again.

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name | City library |
| {ID} | DM- and its number | DM-4 |
| {question} | the question, in plain words, worded for the thing | Can a loan be removed? |
| {where} | the file first, then the thing, then the field and the column, or the part, each after a comma | lending.md, Loan, Remove |
| {why} | what the sources say, and what they leave open | The PRD says how loans are made and returned, but never that one can be removed. |
| {option} | a real answer, never "yes" or "no". When two requirements disagree, each answer they give is an option. | Keep every loan as a record |
| {why pick} | why the person would pick it | the library can see who borrowed what |
| {what next} | what follows if it is chosen | no "remove a loan" story |
| {reason} | why it is recommended | a returned loan is part of the member's history |
| {how asked} | One at a time, or Settled together | One at a time |
| {chosen} | the option chosen, as offered, or "Other: {the person's words}" | Keep every loan as a record |
| {who} | BA or PO | PO |
| {date} | the date, as YYYY-MM-DD | 2026-10-30 |
| {GC ID} | GC- and its number | GC-1 |
| {term} | the Glossary term the change is about | Shelf status |
| {glossary says} | what the Glossary says now, in its own words | belongs to nothing |
| {needed} | what the Glossary has to settle | which thing Shelf status belongs to |
| {proposed} | the answer the data model proposes | it belongs to Book |
| {raised from} | the file first, then the part, after a comma. Or the decisions it replaces or came up in. | city-library-glossary-things.md, Books |
| {gc status} | To raise, Raised, Left open on {date}, or Settled in the Glossary on {date}. Once the data model is in step, the last one goes on: ". Brought into the data model on {date}". | To raise |

### Example: City library

The decisions file of a made-up City library, while lending.md is at its gate.

#### Data model decisions — City library

Status: drafted

##### Open

###### DM-4 — Can a loan be removed?

- **Where:** lending.md, Loan, Remove
- **Why I'm asking:** The PRD says how loans are made and returned, but never that one can be removed.
- **Options:**
  - **Keep every loan as a record.** Why you'd pick it: the library can always see who borrowed what. What happens next: no "remove a loan" story.
  - **A librarian can remove a loan made by mistake.** Why you'd pick it: a wrong loan can be cleared. What happens next: a "Remove a loan" story, for librarians only.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** Keep every loan as a record, because a returned loan is part of the member's history.
- **How it is asked:** One at a time
- **Chosen:** open

###### DM-5 — How many loans can a member have at a time?

- **Where:** lending.md, Loan, member, Limits
- **Why I'm asking:** One requirement says a member can have 5 loans at a time. Another says 3.
- **Options:**
  - **Up to 5 loans.** Why you'd pick it: members can take more books home. What happens next: a sixth loan is refused.
  - **Up to 3 loans.** Why you'd pick it: more books stay on the shelf for others. What happens next: a fourth loan is refused.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** Up to 5 loans, because the lending part of the PRD says 5, and it is the part about loans.
- **How it is asked:** Settled together
- **Chosen:** open

##### Settled

###### DM-1 — How long can a book's title be?

- **Where:** books.md, Book, title, Limits
- **Why I'm asking:** The PRD says each book has a title, but gives no length.
- **Options:**
  - **Up to 200 characters.** Why you'd pick it: some titles are long. What happens next: a 201-character title is refused.
  - **Up to 100 characters.** Why you'd pick it: titles stay short on screen. What happens next: a 101-character title is refused.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** Up to 200 characters
- **Chosen:** Up to 200 characters
- **Decided by:** PO, 2026-10-30

##### Glossary changes

None yet.

##### Check record

None yet.
