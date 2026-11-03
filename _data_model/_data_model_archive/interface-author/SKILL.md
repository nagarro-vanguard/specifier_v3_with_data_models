---
name: interface-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the interfaces, BABOK's Interface Analysis: one interface for each
  external in the accepted data flows, answering who uses it, why, what passes in
  and out, how much, when and how often, the checks on what comes in, what starts
  an exchange, and what happens when one fails. How an exchange is built stays out.
  Runs once the data flows are accepted. One gate, "Accept the interfaces?". Use
  as step 2 of data-flow-workflow, or on its own, for example "analyse the interfaces
  for expense-claims". Not for the data flows (use data-flow-author).
---

# interface-author

> **What this is:** The skill that settles, for every exchange between the product and someone or something outside it, what passes, what is checked, and what happens when it goes wrong.
>
> **What it is not:** A design of the exchange: its method, protocol and message format are left to design. Nor the values an element allows, which stay in the Data Dictionary.
>
> **Who uses it:** `data-flow-workflow`, at step 2. A specifier, on its own, with the project's name.

- You **draft**; the specifier **decides** every question it raises, and whether to accept it.
- If the data flows aren't accepted, say so and stop.

## Words used in this skill

| Word | What it means | Example |
|---|---|---|
| Interface | the exchange between the product and one external | IF-1 Employee |
| What passes in, what passes out | the Data Dictionary elements that cross, each way | Claim.amount |
| Checks on what comes in | each element checked as it arrives, against its allowed values in the Data Dictionary | Claim.amount |
| What starts an exchange | the event that begins it | an employee sends a claim |
| When an exchange fails | what happens, and what the person or system is told | the employee is told which line is wrong |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `expense-claims` |

- It reads the accepted data flows and Data Dictionary, and looks up the PRD by ID.

## Load first

- `../_shared/data-information.md`: the rules. **Enforce them; don't restate them.**
- `../_shared/templates/interfaces.md`: the document's layout.
- `../_shared/decision-review-gates.md`: how you speak at the gate.

## Step 1: Draft

1. Create `data/interfaces.md` from the template, with `Status: drafted`.
2. Write one interface for each external in the data flows, in their order, with the data flows it carries.
3. Answer the nine items for each, from the requirements and the documents before it:
   - **What passes in and out:** the elements its data flows carry, by their Data Dictionary IDs.
   - **Checks on what comes in:** every element that passes in and has allowed values in the Data Dictionary is checked against them. Name it; never copy its values here.
   - **When an exchange fails:** for each check, and for the external being unreachable, what happens and what the person or system is told. When the sources don't say, it is a question.
   - Everything else from the sources' own words; otherwise a question.
4. Never write how the exchange is built: no method, protocol or message format.

## Step 2: Questions and the check

- Run probing-questions-author on the interfaces, then `node tools/grade-questions.cjs --project {project}`.
- Run `node tools/check-data-information.cjs --project {project} --document interfaces`. Fix every finding, and run it again.

## Step 3: The gate and acceptance

Hold the gate as `../_shared/decision-review-gates.md` says, with **Accept the interfaces?**. After **Accept**, run `node tools/accept.cjs --project {project} --document interfaces`, paste the "For the file" block into the Check record, and close with `status.cjs`.

## Output

- The file `data/interfaces.md`, holding the interfaces only.
