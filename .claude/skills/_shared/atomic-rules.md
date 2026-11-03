# One requirement per row

> **What this is:** The rules for cutting what the client needs into requirements, one requirement per row. They say what one requirement is, when to split, and when to keep things together. They apply wherever the kit writes requirements, rules, stories or tests.
>
> **What it is not:** The rules for how each sentence is written. Those are in `simple-writing-rules.md`. It is also not the rules for one kind of document. Each document's template and skill say what its rows hold, and they follow these rules.
>
> **Who uses it:** Every skill in part 3, and every check program in part 4. And you, at the gate, when a check lists a row to look at.

**The rule: one requirement per row, in every document.**
- Every skill in part 3 follows these rules for every row it writes or changes.
- A skill points to this file, and says where it applies the rules. It never copies them.
- The check lists each row that may hold two requirements. You see the list at the gate. Only a person can judge a row, so the list never fails a check.

*Q1 in `quality-characteristics.md` points to this file. The check is `tools/lib/one-per-row.ts`.*

## 1. What one requirement is

One requirement is one thing the product must do, or must not do, that you can test on its own. This is "Atomic" in BABOK 7.2. A reader understands it on its own, without the other requirements.

**The test:** can you write one pass or fail check for it? Could it be built, changed or dropped without the others? If yes, it is one requirement. If it needs two checks, it is two requirements.

## 2. When to split, and when to keep together

The examples are for a made-up online shop. The Before column is the text as the client wrote it.

| The text has | Do this | Before | After |
|---|---|---|---|
| two actions that are separate capabilities, joined by "and", "or", a semicolon or a comma | **Split.** Give each action its own row. | "A customer can add an item to the cart, or remove it." | • A customer can add an item to the cart.<br>• A customer can remove an item from the cart. |
| the steps of one capability | **Keep together.** Split only when the parts are separate capabilities. | "A store manager can make, sign and approve a refund decision." | A store manager can make, sign and approve a refund decision. |
| a rule, then a second rule about something else | **Split.** | "The cart keeps its items for 30 days; an empty cart shows a message." | • The cart keeps its items for 30 days.<br>• An empty cart shows a message. |
| several things that are not allowed | **Split.** Give each one its own row. | "There is no guest checkout and no gift wrapping." | • There is no guest checkout.<br>• There is no gift wrapping. |
| a "so that" part that the product must also do | **Split.** | "A customer signs in, so every order is linked to their name." | • A customer signs in.<br>• Every order is linked to the customer's name. |
| a list of details of one thing | **Keep together.** It is one thing to check. | "Each address has a street, a city and a postcode." | Each address has a street, a city and a postcode. |
| a list of the values a thing can have | **Keep together.** | "An order is Open, Paid or Sent." | An order is **Open**, **Paid** or **Sent**. |
| an example | **Keep it with its requirement.** An example is not a requirement. | "A customer can pay by card, for example Visa." | A customer can pay by card. For example, Visa. |
| a "so that" part that only gives the reason | **Keep it with its requirement.** | "A product's price is fixed once ordered, so invoices match." | A product's price can't change once it is ordered. So invoices match. |

**A client row, cut in two.** Sometimes one row of the client's file holds two requirements. Each one gets its own row, written in our words, as rule 11 of `simple-writing-rules.md` says.

| The client's row | The requirements |
|---|---|
| "Orders are fulfilled in one place, where a picker resumes the queue." | • A picker packs each order in the Packing step.<br>• A picker can continue the list of orders they started. |

## 3. Where the rules apply

| What is written | Who writes it | One row holds |
|---|---|---|
| a business requirement, in the BRD | brd-author | one business need |
| a Requirement row, in the PRD | prd-author | one thing the product must do, or must not do. Each client row is cut into its requirements. |
| a feature, in the Feature catalog | feature-author | one capability. Its name and its description name one thing. |
| a rule, in an FRD | frd-author | one behaviour. A "Done when" piece with two behaviours gets a rule for each. |
| a story, in the Story list | story-drafter | one capability. Its title and its "I want" name one action. |
| a Scope item, in a Story | story-groomer | one thing the story covers, or leaves out |
| a scenario, in a Story's acceptance criteria | ac-author | one behaviour to test. Its When holds one action. |
| an action, in a data model file | data-model-author | one action. Each of its rules is one sentence. |

**A copy stays a copy.** A story quotes its FRD's rules word for word. A rule that holds two behaviours is split only in its FRD, through a change. Until then, the story's scenarios test each behaviour on its own.

## 4. How the check works

`tools/lib/one-per-row.ts` reads the rows a check program gives it. It lists each row that may hold two requirements, to look at. It never fails a check, because only a person can judge a row.

| What it reads | When a row is listed |
|---|---|
| a sentence, such as a requirement, a business requirement or a feature's description | an action word, such as "can", "must" or "shall", comes before "and" or "or", and a second action follows |
| a text that starts with its action, such as an FRD rule or a story's "I want" | a second action follows "and" or "or" |
| a scenario's When | it holds "and" or "or", or a line under it starts with **And**. A number or a word such as "more" after "or" is not a second action, as in "one or more". |
| a name, such as a feature's name or a story's title | it holds "and", "or", "plus", "/", "&" or a comma |
| any of these, except a name | "and no", "and not", "and never", "or no", "or never" or "nor" joins two things that are not allowed |

**A second action follows** "and" or "or" when one of these is true:
- a word such as "the", "it" or "every" comes after the second action, as in "or remove it"
- the word after "and" ends in "ed", and so does the word before it, as in "paused and restarted"
- the word before "and" is the first action, as in "can approve or reject"

So "a street, a city and a postcode" is never listed. A "so that" part is not read, because it gives the reason.

**What the check can't see.** The check misses some rows that hold two requirements. A person still reads every row for these:
- two actions in the present tense, with no word such as "can" before them, as in "A store manager approves or rejects a refund."
- a second action with a word such as "to" straight after it, as in "A customer can rate an item or write to the shop."
- one action on a list of things, as in "A store manager can add products and offers." Adding a product and adding an offer can be built on their own.
- 3 actions with nothing after the last one, as in "A customer can pause, stop and restart."
- a second "cannot", as in "A guest cannot send the order and cannot pay it."

**The check programs that run it:**
- `check-brd.ts`: the business requirements
- `check-prd.ts`: the Requirement rows. A Purpose, Scope or Way of working row is not read.
- `check-features.ts`: each feature's name, its description and each "Done when" piece
- `check-frd.ts`: the rules
- `check-stories.ts`: each story's title and its "I want", and each scenario's When
- `check-data-model.ts`: each action's name, and each sentence of its rules, in a data model file

**What to do with a listed row.** Read it against part 2. Split it when its parts are separate capabilities, each one built, changed or dropped on its own. Keep it when it is the steps of one capability, a list of details or of values, or an example.
