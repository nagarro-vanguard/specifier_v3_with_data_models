---
name: data-dictionary-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the Data Dictionary, BABOK's Data Dictionary technique: one entry for
  every attribute in the accepted data model, with its meaning, its allowed values
  or format, whether it can be left out and whether it repeats, plus every
  composite element. The one home of every attribute's allowed values, except a
  Glossary value-set's, which it names. One gate, "Accept the Data Dictionary?". Use once the data model
  is accepted, as step 2 of data-model-workflow, or on its own, for example
  "write the Data Dictionary for expense-claims". Not for entities or
  relationships (use data-model-author).
---

# data-dictionary-author

> **What this is:** The skill that describes every attribute in the data model, so that anyone building or testing the product knows exactly which values each one allows.
>
> **What it is not:** The data model, which decides which attributes there are, or the state models, which decide how a state attribute's values change.
>
> **Who uses it:** `data-model-workflow`, at step 2. A specifier, on its own, with the project's name.

- You **draft**; the specifier **decides** every question it raises, and whether to accept it.
- The Data Dictionary is a **living document**, and the one home of every attribute's allowed values.

## Words used in this skill

| Word | What it means | Example |
|---|---|---|
| Element | one attribute, with its entity | Claim, amount |
| Allowed values | the Glossary value-set it holds, by name; or a format: its kind, its length or range, its characters | Claim stage, per Glossary |
| Can be left out | whether one may exist without it | No |
| Repeats | whether it holds one value or several | Once |
| Composite element | an element made of other elements, in order | Claim.claimant |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `expense-claims` |

- It reads the accepted data model, and looks up the Glossary and the PRD by ID.
- If the data model isn't accepted, say so and stop.

## Load first

- `../_shared/data-information.md`: the rules. **Enforce them; don't restate them.**
- `../_shared/templates/data-dictionary.md`: the document's layout.
- `../_shared/decision-review-gates.md`: how you speak at the gate.

## Step 1: Draft

1. Create `data/data-dictionary.md` from the template, with `Status: drafted`.
2. Write one row for every attribute in the data model's Attributes table, in its order, with its entity first. No attribute is left out, and none is added: a missing one is a mistake in the data model, raised as a question.
3. For each row, answer the four items from the evidence the data model gives, the requirement it names, and the Glossary:
   - **Meaning:** what the sources say it is, with any other name a source uses for it in brackets. For an attribute that holds a Glossary value-set, the value-set's name: never its definition.
   - **Allowed values:** when the attribute holds a Glossary value-set, its name, and its values stay in the Glossary. Otherwise the format the sources state, in business words: what kind of value, how long or how large, which characters. When they state none, it is a question: never a guess, and never a "sensible default".
   - **Can be left out** and **Repeats:** from the sources' own words, such as "optional", "each", "one or more".
4. Write every composite element the sources describe as made of others.

## Step 2: Questions and the check

- Run probing-questions-author on the Data Dictionary. One gap shared by several elements is one question naming them all. Then run `node tools/grade-questions.cjs --project {project}`.
- Run `node tools/check-data-information.cjs --project {project} --document data-dictionary`. Fix every finding, and run it again. **Never show the specifier anything while a check fails.**

## Step 3: The gate and acceptance

Hold the gate as `../_shared/decision-review-gates.md` says, exactly as data-model-author does, with **Accept the Data Dictionary?**. After **Accept**, run `node tools/accept.cjs --project {project} --document data-dictionary`, paste the "For the file" block into the Check record, and close with `status.cjs`.

## In a change

When a Change impact report names the Data Dictionary, change only the entries it names. An element's ID never changes.

## Output

- The file `data/data-dictionary.md`, holding the Data Dictionary only.
