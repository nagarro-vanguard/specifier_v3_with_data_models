---
name: frd-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes one capability's FRD, whole: the always-true "The system shall" rules for
  the capability the Feature catalog names, each traced to a "Done when" piece, the
  data model, the requirement's own text, or the specifier's decision, with its
  gates, flow, data and standard questions. One gate, "Accept the FRD?", where the
  Must answer questions it builds on come first. Use when frd-workflow names the
  next capability, or on its own, for example "write the FRD for Claim approval".
  Not for the Feature catalog (use feature-author), EPICs (use epic-author) or
  stories.
---

# frd-author

> **What this is:** The skill that turns one capability, a group of features the Feature catalog puts together, into its FRD: the rules the system must always obey, each traced to its source and ready for acceptance criteria to prove.
>
> **What it is not:** The Feature catalog, which decides the capabilities and cuts each "Done when" into pieces. The data model, which the FRD copies, and whose files it never changes. Or the stories, which are cut from these rules later.
>
> **Who uses it:** `frd-workflow`, once for each capability. A specifier, on its own, with the project's name and a capability.

- You **draft**. The specifier **decides** every suggested rule, every question the FRD raises or builds on, and whether to accept the FRD.
- The FRD is a **living document**: its status line says only drafted, accepted or parked, and only programs change it. Its Decision record says what was decided, by whom and when.
- The FRD **copies the data model**. A decision at the gate may change a data model answer. Then the FRD says the new answer, with a note that names the decision, as step 3 says. The data model stays as it is, and nothing goes back.

## Words used in this skill

| Word | What it means | Where it comes from | Example |
|---|---|---|---|
| Feature catalog | the list of numbered features, each with a "Done when" line, its pieces and its capability | `frd/feature-catalog.md` | F-04 Manager approval |
| Section | a numbered section of the PRD, and of the catalog | the catalog's section headings | 3. Approving claims |
| Capability | a group of related features within one section. One FRD covers one capability. | the catalog's Capability column | FRD-3a Claim approval |
| Requirement | one numbered requirement in the PRD | the PRD's simple words, copied exactly | "Line manager approval" (REQ-3.1) |
| "Done when" | the catalog's line saying when a feature counts as finished | the catalog, column "Done when" | Each manager sees every claim waiting for them, and can approve it or reject it with a reason |
| Piece | one separate condition within a "Done when" line, numbered dw1, dw2 | the catalog's "Done when" pieces. The FRD lists them in its Coverage table. | can approve it (F-04.dw2) |
| Data model file | one Glossary family's things: their actions, rules and moves | `glossary/data-models/{family}.md` | lending.md |
| Data model answer | one action, field or move of a thing in a data model file | the data model file | Loan, Extend |
| Data model decision | a decision the specifier took while the data model was written, numbered DM-n. It stays with the specifier, and is never in the Question log. | the data model's decision register | DM-1 |
| Rule | one "The system shall…" sentence, numbered per feature | written by you, in the FRD's Rules table | let a line manager approve a claim waiting for them (F-04.2) |
| Suggested rule | a rule you suggest, written `proposed`, because the sources name the options but not which applies | written by you. The specifier keeps or drops it. | let a claimant send a rejected claim again |
| Decided rule | a rule added or kept because of the specifier's decision, written `decided`, with a note | written by you, after the decision | not accept a claim over the limit without a finance approver |
| Note | "Updated from the requirement on the basis of Decision n: what changed" — wherever the FRD differs from the PRD. For a data model decision, it names DM-n in place of Decision n. Wherever a decision at the gate changed a data model answer, it reads "Updated from the data model on the basis of Decision n: what changed". | written by you, next to what changed | Updated from the data model on the basis of Decision 4: 5 books, not 3 |
| Question | a gap only the specifier can answer, in the Question log. An unknown in the FRD reads TBD and names it. | probing-questions-author, from your draft | question 6 |
| Standard questions | the same seven questions asked about every thing in the FRD's Data | the template's Standard questions section | Can it be removed? |
| Gate | where you stop and wait for the specifier's decisions: "Accept the FRD?" | `../_shared/decision-review-gates.md` | Accept the FRD? |
| Decision record | the FRD's section recording, for each decision:<br>• the question<br>• every option offered<br>• the choice<br>• who decided, and when | written by you at the gate | `Decision 1 — Can a rejected claim be sent again?` |
| Last changed | the date and number of the latest decision, near the top of the FRD | the Decision record | 2026-10-14, Decision 2 |
| Gates | a section inside the FRD, not the same as the gate:<br>• what must be true before<br>• what it makes possible<br>• what undoes it | the catalog, columns "Depends on" and "Done when" | In: the "Done when" of Send a claim |
| The check | the checking program | `tools/check-frd.ts` | 44 of 44 checks passed |
| Check record | the FRD's last section: the program's record of the latest passing check | pasted by you from the program | check-frd.ts, 2026-10-14: 44 of 44 checks passed |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `expense-claims` |
| the **capability**, as `route-next-capability.ts` names it | `FRD-3a Claim approval` |

- It finds the Feature catalog, the PRD, the Glossary and the data model files itself, through `tools/lib/run-paths.ts`.
- In file names and programs, the capability is `{capability}`. It is the capability's name without its number, in lowercase, with hyphens, as `tools/lib/run-paths.ts` writes it. For `FRD-2a Book lending`, it is `book-lending`. The file is `frd/frd-book-lending.md`, `--frd` takes `frd-book-lending.md`, and `--capability` takes `book-lending`. The Capability section of the conventions has the whole rule.
- Use only these inputs. Never use facts from chat or memory.
- If the capability isn't in the Feature catalog, or a data model file is missing, say so and stop. The specifiers, the BA and the PO, decide at the gate.

## Load first

- `references/conventions.md`: the rules. **Follow them, and don't repeat them.**
- `../_shared/templates/frd.md`: the document's layout. **Fill it, and don't describe it again in this skill.**
- `../_shared/decision-review-gates.md` — how you speak at the gate. **Every message the specifier sees follows it.**
- `../_shared/simple-writing-rules.md` — how you write. **Every sentence of the FRD, and every message the specifier sees, follows it.** A rule has one action, in everyday words.
- `../_shared/atomic-rules.md`: when to split, and when to keep together. **Every rule in the Rules table follows it.**
- `../_shared/data-model-design.md`: how the data model is written. Its step 2 says where each standard question's answer is in a data model file.
- `tools/check-frd.ts` — the check you run before the gate and after every decision.

## Step 1 — Draft

- Run `node tools/scaffold-project.ts --project {project}`, then create the FRD file from the template, named per the conventions, with `Status: drafted`. The Decision record and the Check record start as `None yet.`, and so does Last changed.
- Fill every part. Everything except the rules is copying or derivation that the template and conventions already specify. **The rules are the work.** Per feature:
  1. Use the "Done when" pieces exactly as the catalog cuts them. Never change them. If one proves wrong, raise it as a question. The catalog is then changed through a change.
  2. Write one `The system shall…` rule per behaviour, as `../_shared/atomic-rules.md` says. A piece with two behaviours gets a rule for each. Tag each rule's source:
     - from a "Done when" piece → `F-nn.dwN`
     - from an action, field or move this FRD's features own → `data model — {Thing}, {action, field or move}`. Also list it under **From the data model** in the Coverage section.
     - from the requirement's own text, beyond the "Done when" and the data model → `req`
     - a gap where the sources name the possible answers but not which applies → `proposed — Why: {the options, and why this one}`. Also list it under **From your decisions** in the Coverage section.
     - any other gap → a question in the Question log, marked `TBD` where the FRD needs it. It is never a rule, as the Never invent section of the conventions says.
  3. Limits and must-nots are rules too. Write them with **not** or **only**. A limit the source states is its own rule, separate from the allowing rule. A limit is a count, a closed list of values, or "only". The Rules section of the conventions has an example.
  4. Fill **Proved by** in the Coverage table: every piece gets at least one rule, or names the open question it waits on.
  5. Fill the data model coverage table. List every action, field and move this FRD's features own, and the rules that prove each one. A row whose answer is still open waits on its ID, such as "waits on DM-5". Then copy into Data the rules table of each thing the table names. Copy it word for word from its data model file. The Sources section of the conventions says which feature owns each one.
- Fill the Standard questions section. For each thing in Data, answer each standard question with its place. Look in the data model file first, then in the documents. When none of them answers it, it becomes a question in the Question log. The Standard questions section of the conventions says how.
- Every rule appears in the flow at least once.

## Step 2 — Questions and the check

- Run probing-questions-author on the FRD, write each question's number where its gap is, then run `node tools/grade-questions.ts --project {project}`.
- Run `node tools/check-frd.ts --project {project} --frd frd-{capability}.md`. One of its checks finds each word the Glossary retired, and names the agreed word to use instead. On any finding, fix the document by following `references/conventions.md`, then run it again. **Never show the specifier anything while a check fails.**
- Then read the document yourself for the things the program can't check. It lists them in its "For the person" block.

## Step 3 — The gate, changes and acceptance

Hold the gate exactly as `../_shared/decision-review-gates.md` says, with probing-questions-author asking each decision in its Ask mode, and follow the Changes and acceptance section of the conventions:
- First, the two "For the person" blocks: the check's, then `grade-questions.ts`'s.
- **The FRD guard:** the Must answer questions this FRD builds on come first, one at a time. While one is open, the FRD can't be accepted: the specifier answers it, or parks the FRD, and other work goes on.
- Then the other questions the FRD raised or builds on, in the order `grade-questions.ts` sets, and each suggested rule, as "keep or drop", one at a time. Record each answer as soon as it is given (rule 5).
- Apply every decision:
  - a kept suggested rule becomes `decided — see Decision n`, with its note
  - a dropped suggested rule is deleted from the Rules table and the From your decisions list
  - each rule an answer adds or changes is `decided — see Decision n`, with its note
- Rebuild the Actors, Gates and Flow from the final rules, with notes where they changed. Data stays a copy of the data model, except a cell a decision changed. Update the Standard questions answers to name the decisions and rules.
- **A decision that changes a data model answer.** For example, a member may borrow 5 books, not 3, where the data model says 3. Tell the specifier which data model answer the decision changes. Then write the new answer in the FRD, with its note, as the Rules section of the conventions says:
  - in each data model rule it changes
  - in the cell of Data it changes

  The data model stays as it is, and nothing goes back to it. The FRD is the latest document, so the stories copy the FRD.
- Never decide a suggested rule or a question yourself.
- Run the check again. Ask about each tension between decisions, one at a time.
- Ask **Accept the FRD?** If the answer is **Change something first**, make the change, run the check, and show the review again.
- After **Accept**, paste the check's "For the file" block into the Check record first. Then run `node tools/accept.ts --project {project} --document frd --capability {capability}`, so the version it saves is the file as it stands. Close with `status.ts`.

After a third "no", offer to park the FRD with `park.ts`, to accept it as it is, or to run one more round (`../_shared/decision-review-gates.md`, rule 11).

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names this FRD, read the report too, and change only what it names. Rule IDs already accepted never change. A new rule takes the next free number.

## When an answer it waits on is settled

An accepted FRD can wait on a data model answer that is still open. A row of its data model coverage table then reads "waits on DM-n" in Proved by, or a cell of Data shows "? (DM-n)". The Sources and Never invent sections of the conventions say how. Once DM-n is settled, the FRD takes the answer. This moves forward, from the data model to the later FRD, and nothing goes back. `status.ts` lists each such FRD, and names frd-author for it under "Next:". A Glossary change, GC-n, counts once it is brought into the data model.

Run again for that FRD, and change only what the answer reaches:
1. Check that the data model file now holds the answer in place of "? (DM-n)". If it doesn't, say so and stop. `status.ts` names data-model-author to write it in first.
2. Set the status line to "Status: drafted".
3. Copy each cell the answer changed into Data, word for word.
4. Write the rule from the settled answer, as Step 1 says, with its source `data model — {Thing}, {action, field or move}`. A new rule takes the next free number. Rule IDs already accepted never change. Put the rule in Proved by, in place of "waits on DM-n", and list it under **From the data model**.
5. Rebuild the Actors, Gates and Flow where the new rule reaches them.
6. Run Step 2. Then hold the gate again, as Step 3 says, for what changed.

## Output

- The file `frd/frd-{capability}.md`, beside the Feature catalog.
- The file holds the FRD only, with no notes to the specifier.
- Everything said to the specifier goes in the message, in the layouts of `../_shared/decision-review-gates.md`.
