---
name: glossary-disposition
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Decide what to do about glossary drift, and do it, one mismatched word at a
  time. The answers are to fix the document, change the glossary, or add a new
  word through glossary-author. Changing the glossary means to rename, redefine,
  split, merge, or withdraw a term. The specifier chooses at each gate. Every
  glossary change is recorded in the gate log, and its
  ripple is reported. Use to act on what glossary-check found, inside a change or on
  its own, to change a term directly, for example "rename claim to expense claim"
  or "the definition of approver must change", or to settle, in one run, the batch
  of Glossary changes the data model sends. It edits the glossary, not the
  documents that use a term. Not for detecting drift (use glossary-check) or
  building the glossary (use glossary-author).
---

# glossary-disposition — decide and act on glossary drift

> **What this is:** The skill that settles a mismatch between a document and the Glossary, or changes an agreed word, through its gate.
>
> **What it is not:** The search for drift, which is glossary-check's, or the records filled from the gate log, which programs write. It never edits the documents that use a term: it reports them.
>
> **Who uses it:** `change-request-workflow`, at its step 1, when the Check findings hold a mismatch, so the analysis works with agreed words. `change-orchestration-workflow`, first, when a change renames an agreed word. `data-model-workflow`, at its step 3, once, with every Glossary change the data model raised, as one batch. A specifier, on its own, with a word to change.

Take a drift: a glossary-check finding, or a term change asked for directly. Decide what to do, gate it, apply the glossary side, and report the ripple. The method is kept in `../_shared/glossary/`. **Follow those files, and do not restate them.** It also follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`.

## Reads
- The drift: the Check findings, `Output/{project}/changes/{change}/check-findings.md`, or a term-change request. Each finding's Recommended Next Best Action names the action in bold, what to use, and the affected file. A batch from the data model is every Glossary change its decisions file, `Output/{project}/glossary/data-models/{product}-data-model-decisions.md`, marks "Raised". Each one gives the term, what the Glossary says, what is needed and the proposed answer. "A batch of Glossary changes from the data model", below, says how it is settled.
- The glossary at `Output/{project}/glossary/`: the seven pages, not `deep-dives/`. Read the term, and every page that uses it. Term absent, or the seven pages absent → stop.
- The method:
  - `../_shared/glossary/method-words.md`, for the words every file uses
  - `../_shared/glossary/otc-run-rules.md`, for the boundary and the gate
  - `../_shared/glossary/output-formats.md`, for the term-change effects, the register and the ripple list
  - `../_shared/glossary/glossary-assembly-principles.md`, for the shape the changed glossary must keep

## Produces
- The updated glossary: the entry, and every place the term appears. Those places are its kind page, the hierarchy and lookup rows in `terms-and-relationships.md`, and links. The glossary stays in line with `../_shared/glossary/glossary-assembly-principles.md`.
- A ripple list. glossary-disposition does not edit the documents that use the term.
- One resolved row in the gate log's Change part: the only place the decision is written. The decision register, the section decisions files and the kind pages' "Terms replaced or retired over time" tables are then filled from it by programs.

## Steps
1. **Restate** the drift and the next best action you propose.
2. **Gate** — write the proposed next best action to the gate log (`../_shared/glossary/output-formats.md`, "The gate log") as an open gate row, present it recommendation-first per `../_shared/glossary/output-formats.md` ("How the gate is answered"), and apply nothing while it is open. The person confirms or overrides. On doubt, clarify before moving. The item goes into the glossary's own `deep-dives/gate-log.md`, in a new `Change - {date}` part, rows numbered `CH-01`, `CH-02` ....

   The gate asks **How should each mismatched word be settled?**, one word at a time, in the shape `../_shared/decision-review-gates.md` rule 4 gives, with these answers:
   - **fix the document** — Why: the glossary is right, and the document strayed from it. What happens next: the document is flagged for its author. The glossary doesn't change.
   - **change the glossary** — Why: the document shows the glossary is wrong. What happens next: the entry is renamed, redefined, split, merged or withdrawn, and every page that uses it is updated.
   - **add a new word** — Why: it is a product word the glossary doesn't have yet. What happens next: it goes to glossary-author, in its mode "add words from a request", and through its gates.
   - **I don't know yet** — What happens next: the recommendation is used for now, marked Proposed (needs confirmation), and probing-questions-author raises the question in the Question log, with who can answer it and by when.
3. **Apply one next best action:**
   - **fix the document** → flag it for the author or a glossary-check follow-up. The glossary doesn't change.
   - **change the glossary** → rename, redefine, split, withdraw, or merge the entry as `../_shared/glossary/output-formats.md` ("Changing a term") sets out.
     - An earlier word is never deleted. It moves to the kind page's Terms replaced or retired over time table (`../_shared/glossary/glossary-assembly-principles.md`, G8), which a program writes in step 4.
     - Keep the glossary in line with `../_shared/glossary/glossary-assembly-principles.md`: G6 sentence case, the family and parent grouping, and the row schema.
     - Update every place the term appears to match: its kind page, the hierarchy and lookup rows in `terms-and-relationships.md`, and cross-links.
     - Then run the G6 character sweep, and confirm every decision link resolves.
   - **add a new word** → route it to **glossary-author**, in its mode "add words from a request", as a term request.
4. **Record** — for a glossary change, make sure the gate log's Change row is resolved, with its Resolution in the form `../_shared/glossary/output-formats.md` ("The gate log") sets, so a program can read it, such as `claim: renamed to Expense claim`. Then run `node tools/build-glossary-records.cjs --project {project}`, which adds the register row, its **Retired / overrides** naming the earlier word and the decision it reverses, and updates every section decisions row the change touches. Then run `node tools/build-retired-words-tables.cjs --project {project}`, which writes the earlier word's row in its kind page's Terms replaced or retired over time table. Nothing is written by hand.
   - Then run the quick check on each file this run wrote or changed: `node tools/check-simple-writing.cjs --project {project}`, with `--file` for each glossary page this run changed and for `deep-dives/gate-log.md`. Add the same `--skip-column` options as glossary-author, which `../glossary-author/SKILL.md` lists under "The columns the quick check skips". Those columns hold the source's own words, so the check doesn't read them. Fix what it lists to fix in the kit's own sentences, and run it again. In a page a program fills from the gate log, fix the gate log, then run that program again. An earlier word, or a quote, stays as it is. Show the line the check prints for each file next to the ripple list, such as "Simple writing, object-terms.md: 0 to fix, 2 to look at."
   - Last, run `node tools/accept.cjs --project {project} --document gate-log`, which saves this version of the gate log and brings any open change's progress up to date.
5. **Report the ripple** — grep the term and its retired forms across the documents, the data model files included. List every file and line by filling `../_shared/glossary/templates/change-ripple.md`, as `../_shared/glossary/output-formats.md` ("The check findings and the ripple list") sets out.

## In a change

When a change renames an agreed word, section 5 of its Change impact report names the word, and the word it becomes. That is the answer "change the glossary". Apply it as step 3 says, record it as step 4 says, and report the ripple as step 5 says.

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

## A batch of Glossary changes from the data model

`data-model-workflow`, at its step 3, sends every Glossary change the data model found as one batch, once every data model file is accepted. Settle the whole batch in one run. Follow the steps above, with these differences:
1. **Restate** each change in the batch: the term, what the Glossary says, what is needed, and the proposed answer.
2. **Gate.** Ask "How should the Glossary settle this change?" for each change on its own, in the batch's order, in the shape `../_shared/decision-review-gates.md` rule 4 gives. Offer only the answers in this table that fit the change. "I don't know yet" always fits. Never offer "fix the document": the data model follows the Glossary, so the data model is never the one to fix.

| Answer | When it fits | What happens next |
|---|---|---|
| change the Glossary | the Glossary has the term, and must rename, redefine, split, merge or withdraw it, or say what it belongs to | the entry changes, as step 3 says, and so does every page that uses it |
| add new words | the answer needs a word the Glossary doesn't have yet | the word waits for the end of the batch. Then every new word of the batch goes to glossary-author together, in one run. |
| I don't know yet | always | the change stays open in the data model's decisions file, marked "Left open on {date}". It never goes into the Question log. things-author or data-model-author asks it again first, at its next run. |

3. **Apply** each "change the Glossary" answer as step 3 says. Then send every "add new words" answer to **glossary-author** as one batch, in its mode "add words from a request". With each word, give its evidence: what the Glossary, the BRD and the PRD say about it, in their own words, and where each one says it. glossary-author runs its gates on those words only.
4. **Record** as step 4 says, once for the whole batch.
5. **Report the ripple** for every term in the batch, in one ripple list, as step 5 says. Then report each change's outcome to `data-model-workflow`, which writes its mark in the decisions file:
   - settled in the Glossary, with the date
   - left open, with the date: "I don't know yet", or a new word glossary-author left open. It leaves a word open when the sources don't name it, or when its gate for that word is answered "I don't know yet". Then the change is marked "Left open on {date}", and never goes into the Question log.

## Must not
Edit the documents that use the term. Flag them instead. Never rename a file or an identifier. Every next best action passes the gate.

## Connects
**glossary-check** spots drift. **glossary-disposition** acts on it. **glossary-author** builds and updates the glossary. Inside a change, glossary-disposition runs at step 1 of `change-request-workflow`, before change-request-disposition, so the change is weighed in agreed words. In `data-model-workflow`, it runs at step 3, once every data model file is accepted, once for the whole batch. A Glossary change from the data model changes words, not requirements, so it needs no change of its own.
