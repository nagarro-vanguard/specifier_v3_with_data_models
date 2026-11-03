# Quality characteristics

> **What this is:** The ten tests, Q1 to Q10, that every unit a skill writes must pass. A unit is one item a skill writes. Each skill names its unit. For example, a unit can be a business requirement, a requirement, a feature, a story, a line of the Discovery brief or a question.
>
> **What it is not:** The rules on sources and format. Those are in `conventions.md`.
>
> **Who uses it:** Skills that write units, and their check programs.

- `conventions.md` says where a unit's content may come from, and how it is written. This file says whether each unit is well formed.
- A skill names the tests its units must pass by their codes, Q1 to Q10. It never copies the table below.
- Each test has a yes or no answer, so two people checking the same unit reach the same answer. Where `conventions.md` already checks part of a test, the test points to `conventions.md` instead of repeating it.

## 1. The ten characteristics

| Code | Characteristic | What it means, in one line | Deterministic test: it fails when… |
|------|----------------|--------------------------|----------------------------------|
| **Q1** | **Atomic** | One unit is one capability, understandable on its own. | The name or description joins two capabilities with "and", "plus", a slash or a comma. **Or** it covers two actions, each with its own object, that could ship separately. When to split, and when to keep together, is in **`atomic-rules.md`**. `tools/lib/one-per-row.ts` lists each unit that may fail, for a person to judge. |
| **Q2** | **Complete** | Has enough for the next stage to act without reopening the source. | A required field is blank, **or** the description names the capability but not the value or the outcome it delivers. |
| **Q3** | **Concise** | No field restates another. No filler. | Two fields on the same unit hold the same information. For example, a completion field only rewords the description. The ⊆ test in each skill's field contract checks this. |
| **Q4** | **Unambiguous** | Exactly one reading. | A word from the "Words that can't be checked" list in `simple-writing-rules.md` is used with no limit. **Or** "is this unit met?" cannot be answered yes or no from its own text. In a requirement, such a word names its question instead, as `conventions.md`, "Unknowns", says. |
| **Q5** | **Verifiable** | States an observable signal that it is fulfilled. | The completion signal describes an intention ("supports", "allows", "handles") rather than an outcome an outside observer could confirm. |
| **Q6** | **Consistent** | Does not conflict with or duplicate a sibling or the source. | Two units claim the same capability, **or** a unit contradicts another unit or its source. |
| **Q7** | **Understandable** | Business language, in the audience's terms. | Enforced by **`conventions.md`, "Business language"**, and by **`simple-writing-rules.md`**, which `tools/lib/simple-writing.ts` checks. A unit fails on any term in its list. Before the Glossary, nouns come from the source's own words. After it, they are the Glossary's agreed words, as `conventions.md`, "Agreed words", says. |
| **Q8** | **Prioritized** | Has an explicit rank. | No MoSCoW value is present on the unit. The values are Must, Should, Could and Won't. |
| **Q9** | **Feasible & sourced** | Grounded in a source. Nothing invented. | Enforced by **`conventions.md`, "Nothing invented" and "Cite every specific"**. A specific with no source fails, unless it is marked `TBD` or `Proposed (needs confirmation)`. |
| **Q10** | **Legible** | One unit is one idea, stated so it reads on the first pass. | The statement stacks **two or more nested relative clauses**, such as the chain *…that…which…it…from*. **Or** it buries detail in an **em-dash or parenthetical aside**, or in a `by …-ing` mechanism clause. A statement **longer than the skill's word-flag threshold** is an **advisory flag, not a fail**. There is no authoritative maximum length, so length alone never fails a unit. |

## 2. Words the table uses

| Words | What they mean |
|---|---|
| field contract | a skill's own rules for what each field of its unit holds. For example, the Feature catalog's rules say what goes in a feature's Description, and what goes in its "Done when". |
| the ⊆ test, in Q3 | a check on two fields of the same unit. Read the completion field, such as "Done when". If everything it says is already said by the description, the unit fails: the completion field must add at least one thing an outside observer could check. |
| word-flag threshold, in Q10 | a word count, set in each skill's own rules. A statement longer than that is pointed out to you, but never fails on length alone. |

## 3. How skills use this

- A skill names the codes its units must pass, and sets its own field contract, which makes Q3 and Q5 exact for its kind of unit.
- Q1's rules on when to split, and when to keep together, are in `atomic-rules.md`. Every skill that writes requirements, rules, stories or tests points to that file.
- Q7 and Q9 are checked by the rules in `conventions.md`, not in this file. A finding under "Business language", "Nothing invented" or "Cite every specific" covers them.
- Q10's readability rules for every sentence are in `simple-writing-rules.md`, and every check program checks them. Q10's word count is set by each skill, not in this file. Only Q10's other tests apply to every skill, and only those can fail a unit:
  - two or more relative clauses stacked inside each other
  - detail hidden in a dash or a bracketed aside
  - a "by doing something" clause that describes how, not what
