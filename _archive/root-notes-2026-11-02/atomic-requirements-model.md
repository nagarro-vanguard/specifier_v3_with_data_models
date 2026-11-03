# One requirement per row

> **What this is:** The mental model for cutting the client's text into requirements, one requirement per row, in the PRD. It says what one requirement is, when to split, when not to, how each row is numbered, and how the program proves nothing was lost.
>
> **What it is not:** The kit's rules. Since 2026-11-02, the model is in prd-author, step 4, the PRD template and example, `conventions.md` parts 5 and 7, and `check-prd.cjs`. This file keeps the reasons. Its parts 1 and 2 become the kit's shared file, `_shared/atomic-rules.md`, in step 9 of the build in `_data_model/data-model-stitching-plan.md`.

*Written 2026-10-30, put into the kit 2026-11-02, as enhancements 15 and 16 in `TEMPLATE-ENHANCEMENTS.md`. The examples are for a made-up online shop.*

## 1. What one requirement is

One requirement is **one thing the product must do, or must not do, that you can test on its own**. This is "Atomic" in BABOK 7.2: understood on its own, without the other requirements. It is also the kit's Q1 test: no requirement joins two things that could be built separately.

**The test:** can you write one pass or fail check for it, and could it be built, changed or dropped without the others? If yes, it is one requirement. If it needs two checks, it is two requirements.

## 2. When to split, and when not to

| The client's text has | Do this | Before | After |
|---|---|---|---|
| two actions, joined by "and", "or", a semicolon or a comma | **Split.** One row for each action. | A customer can add an item to the cart, or remove it. | • A customer can add an item to the cart.<br>• A customer can remove an item from the cart. |
| a rule, then a second rule about something else | **Split.** | The cart keeps its items for 30 days; an empty cart shows a message. | • The cart keeps its items for 30 days.<br>• An empty cart shows a message. |
| several things that are not allowed | **Split.** One row for each. | There is no guest checkout and no gift wrapping. | • There is no guest checkout.<br>• There is no gift wrapping. |
| a "so that" part that the product must also do | **Split.** | A customer signs in, so every order is linked to their name. | • A customer signs in.<br>• Every order is linked to the customer's name. |
| a list of details of one thing | **Keep together.** It is one thing to check. | Each address has a street, a city and a postcode. | Each address has a street, a city and a postcode. |
| a list of the values a thing can have | **Keep together.** | An order is Open, Paid or Sent. | An order is **Open**, **Paid** or **Sent**. |
| an example | **Keep it with its requirement.** It is not a requirement. | A customer can pay by card, for example Visa. | A customer can pay by card. For example, Visa. |
| a "so that" part that only gives the reason | **Keep it with its requirement.** | A product's price is fixed once ordered, so invoices match. | A product's price can't change once it is ordered. So invoices match. |

## 3. Each row

| Column | What it holds |
|---|---|
| ID | REQ-{section}.{n}. It counts the requirements in the section, from 1, in the client's order. A split row takes the next number. There are no letters. |
| In simple words | the one requirement, its short title in bold first, as `simple-writing-rules.md` says |
| The client's words | only the part of the client's row that this requirement comes from, exactly as the file writes it |
| Source | the file, its version, and the client's own number for the row, such as "shop-requirements.md, version 2, section 1.3" |
| Traces to | the business requirements the client's row traces to |

**The client's numbers move to the Source column.** The PRD's ID is its own. So the PRD's REQ-1.3 may come from the client's section 1.2. The Source column always says which.

**The simple words use the Glossary's agreed words.** A word the Glossary retired, such as "order request" when the agreed word is "Order", appears only in "The client's words". When the agreed word means the same, use it. When it doesn't fit the meaning, use another plain word, never the retired one. On a project's first run, the Glossary comes after the PRD, and the PRD is not changed to match it. The flow only goes forward. The PRD uses the agreed words only in a re-run or a change, when the Glossary already exists. This was settled on 2026-11-02, in decision 7 of `_data_model/data-model-stitching-plan.md`.

## 4. What the program proves

- **Nothing is lost.** For each client row, its parts, read in order, give back the client's row word for word. This is the same idea as a feature's "Done when" pieces.
- **Nothing is added.** Every part is a piece of the client's text.
- **The IDs count up** in each section, from 1, with no gaps.
- **Each row is one requirement.** The program flags a row whose simple words join two actions with "and" or "or". You see each flag at the gate. Only a person can judge it.
- **No retired word.** When the project has a Glossary, the program fails a row whose simple words use a word the Glossary retired, with the word to use now. It uses `lib/scan-retired-words.cjs`, which the stories check already runs.

## 5. What changes in the kit

- `prd-author/SKILL.md` and `references/prd-checklist.md`: the model in parts 1 to 3
- `templates/prd.md` and `examples/prd.md`: the italic line under section 4, and the example rows
- `conventions.md`, part 7: the PRD's ID is REQ-{section}.{n}, counted by the PRD, and the client's number goes in Source
- `conventions.md`, part 5: the PRD's simple words use the Glossary's agreed words. Only "The client's words" keeps the client's own words.
- `check-prd.cjs`: the checks in part 4
- the programs that read requirement IDs: none needs to change, because the IDs keep the same shape
