---
name: data-model-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes one family's data model file. For each thing in the family, it writes
  its actions: what people do with it, in which step, who, and the rules for
  each. It writes a rules table for every field, with the same columns every
  time: type, required, limits, can two share it, can change, starts as. It
  writes how the thing moves, following the recommended answer of each open
  decision. It also writes what the family adds to things from earlier
  families. Only the Glossary, the BRD and the PRD are sources, the Glossary is
  the agreed copy, and nothing is invented. Every gap goes where its kind goes,
  most often to a decision. One gate, once the whole file is written: the
  decisions, as multiple choice, then "Accept the {family name} data model?". Says up
  front which mode it is in: a change, a new build, picking up where it stopped,
  or nothing to do. Use once the things file is accepted, for example "write
  lending.md for city-library". Not for finding the things (use things-author).
---

# data-model-author

> **What this is:** The skill that writes one family's data model file: the actions on every thing in it, and the rules for every field, so that a story writer turns each into the same tests every time.
>
> **What it is not:** Finding the things, which things-author does. Changing the Glossary, which `glossary-disposition` does at the end of `data-model-workflow`. Screens, how the data is stored, or data passed to or from outside systems.
>
> **Who uses it:** `data-model-workflow`, at its second step, once for each family, and at its fourth step, in a change. A specifier, on its own, with the project's name and the family.

This skill follows `../_shared/data-model-design.md`, sections 1 to 3 and 6 to 12. It writes from `../_shared/templates/data-model.md` and `../_shared/templates/data-model-decisions.md`. It loads them, and never restates them. If any is missing, it names the file and stops.

## What it reads and writes

- **Reads:**
  - the accepted things file, `Output/{project}/glossary/data-models/{product}-glossary-things.md`
  - the decision register, for the product-wide decisions settled at gate 1: their answers fill those gaps in this file
  - the Glossary, with the flow and relationship rows in `terms-and-relationships.md`
  - the BRD, the whole of it, taking only what touches this family's things
  - the PRD: this family's part, with its part of the end-to-end journey, and only what other parts add
  - the Question log, only for the recommended answer to a question the PRD left open
- **Writes:**
  - one data model file, `Output/{project}/glossary/data-models/{family}.md`
  - its decisions and Glossary changes, in `Output/{project}/glossary/data-models/{product}-data-model-decisions.md`
- **Its gate:** gate 2. The decisions come first, as multiple choice, then "Accept the {family name} data model?" {family name} is the family's name, such as Lending. {family} is its file name, such as lending.
- **Its check:** `check-data-model.cjs --family {family}`. It runs `data-model-design.md`, step 7, checks 2 to 11, and the kit's checks, on the file and on the decisions file.

## Steps

### 1. Mode

Find the mode for this family's file, as `data-model-design.md`, section 3, "Before you start", sets out. Take the first that fits, and state it in one sentence, first:
- a change names this file, or a thing in it → a change: follow "In a change"
- no file for this family → new build: run every step from step 2. A start again from `requirements-workflow`, step 1, is always a new build, as the project starts again from nothing.
- the file exists, not yet accepted → picking up. Check the inputs. Then read the file and the register, and go on from the first step not done. An open decision with no Proposed answer is asked at gate 2. A decision already settled stays settled.
- the file is accepted, with an entry still open that this skill owns → picking up. Ask each one again, in step 3. Hold gate 2 again only when an answer changes the file.
- the file is accepted, and a product-wide decision is now settled, while this file still shows its "? (DM-{n})" → picking up. This is not "nothing to do". Write the settled answer in place of each "? (DM-{n})", and take its row out of "Decisions to make", in a change, as "In a change" says. Then run step 10, and hold gate 2 again for what changed only.
- the file is accepted, nothing still open for this file, no settled answer still to write in, and no change → nothing to do. Say so, and stop.

### 2. Set up

- If the things file isn't accepted, say so and stop.
- If the things file doesn't name this family's file, say so and stop.

### 3. Ask again what is still open

Before anything else is written, ask again each entry still open that this skill owns, as `data-model-design.md`, section 3, "What is still open is asked again first", says. Run `node tools/status.cjs --project {project}`. Its block "Data model, still open" lists each entry, and names the skill that asks it. This skill owns the entries of this family's file:
- each decision answered "I don't know yet": ask it again as gate 2 asks it, as multiple choice, with the recommended answer first and "I don't know yet"
- each Glossary change raised from this file and left open: ask whether to send it to the Glossary again, with "Send it with the next batch" recommended, and "I don't know yet"

Record each answer straight away, in the register and in the file, as section 12 of `data-model-design.md` says. A product-wide decision is things-author's to ask. Once it is settled, write its answer in place of each "? (DM-{n})" in this file, in a change.

### 4. Read the sources

Read them in the order, and by the rules, in `data-model-design.md`, section 2. Above all: only the Glossary, the BRD and the PRD are sources, the Glossary is the agreed copy, nothing is invented, and the file stays within its family's part of the PRD.

### 5. List each thing's actions

Follow `data-model-design.md`, step 2. For each thing, write its "kind of" line when the Glossary makes it one kind of another thing, then its "Actions" table, from the Glossary's flow rows, the BRD and this family's part of the PRD. Ask the step's five questions about every thing, so making, finding, opening, changing and removing each have a row. Every "Who" is a Glossary role, or "the product". Write "?" in each cell the sources leave open. This skill's step 8 sends each gap where it goes.

### 6. List each thing's fields

Follow `data-model-design.md`, step 3. Write the "Things and their fields" table, and an "Adds to {Thing}" part for each thing from an earlier family that this family adds a field, an action or a move to.

### 7. Fill the rules table

Follow `data-model-design.md`, step 4: one row per field, the same six columns every time. A field with choices lists each choice as a bullet, on its own line. Write "?" in each cell the sources leave open. That includes a rule two requirements give different answers for, which becomes a decision, and a rule the PRD left as an open question. This skill's step 8 sends each gap where it goes.

### 8. Send every gap where it goes

Follow `data-model-design.md`, step 5. For each "?", find its kind in `data-model-design.md`, "Where each gap goes", and write it down where its kind goes. Under each thing, write the "Decisions to make" table and, when there is one, the "Waiting on the Glossary" table. A product-wide decision still open shows "? (DM-{n})" in each cell it answers, and has its row in "Decisions to make" too. Write the "Next step" line under the status line. When this skill adds an entry to the decisions file, or settles one, it sets the decisions file's status line to "Status: drafted".

### 9. Write how it moves

Follow `data-model-design.md`, step 6: the picture, the Moves table and the "What each state means" table, in positive wording. This is written before the gate. Where the moves depend on an open decision, follow its recommended answer. A cell that an open decision answers shows "? (DM-{n})", as everywhere in the file. A new gap in a move is written "?", and sent where it goes, as in this skill's step 8.

### 10. Check

Run `node tools/check-data-model.cjs --project {project} --family {family}`. It runs checks 2 to 11 in `data-model-design.md`, step 7, on this file. It also runs the kit's checks: the opening, the sections, the placeholders, simple writing, one requirement per row and the retired Glossary words. It checks the decisions file too. Fix every finding, and run it again, until every check passes.

It runs simple writing, so it counts as the quick check that `../_shared/simple-writing-rules.md` asks for. A Glossary word or definition is used as it is, so never change one to pass the check. The check never fails a definition. When it shows one to look at, that belongs to the Glossary. Send it where a Glossary change goes, as `data-model-design.md`, "Where each gap goes", says. Run the check again each time a file changes at the gate.

### 11. The gate

Hold gate 2, as `data-model-design.md`, section 12, says. Show the person the whole file. Show the check's "For the person" block first. It holds what the check program shows for each file, such as "Simple writing, to look at: 4 places". First come the "one at a time" decisions, one per message, as multiple choice. Then come the "settled together" decisions, as one list with their recommended answers. The recommended answer always comes first, and "I don't know yet" is always one of the answers. Record each answer straight away, in the register and in the file.
- "I don't know yet" keeps the decision open. Each cell it answers keeps its "? (DM-{n})", and its row stays in "Decisions to make". It is asked again first at the next run, in step 3.
- An answer may add a word, a state, a value or an action big enough to be a feature. Then it is not a rule. It goes where "Where each gap goes" sends it. `data-model-design.md`, section 12, says what happens to the decision.
- An answer may differ from the recommended one. Then update what that answer changes, before asking whether to accept the file. That can be the moves, a rule or an action. Then run the checks in step 10 again.

Then ask **"Accept the {family name} data model?"** When the person accepts:
1. Set the "Next step" line, as section 12 of `data-model-design.md` says.
2. Run the check once more. Paste its "For the file" block into the Check record of the file, and into the Check record of the decisions file. Do this before `accept.cjs`, never after.
3. Run `node tools/accept.cjs --project {project} --document data-model --family {family}`. It sets the status line of the file, and saves a copy of it in the Version log. It does the same for the decisions file.
4. Close with `node tools/status.cjs --project {project}`.

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the Glossary changes a term after the file is accepted, or a thing, an action, a field or an answer changes, change only what the change names. Open a decision that starts "Replaces DM-{n}:" when an answer changes, and hold gate 2 again for what changed only. Step 4 of `data-model-workflow` is such a change: it names the Glossary changes the Glossary has settled, and each "? (GC-{n})" gets the Glossary's answer. Everything else stays as it is. While the skill changes the file, its status line reads "Status: drafted". When the person accepts it again, `accept.cjs` saves the new version, so the change can see what changed.

## Rules

The most important few:
- **The Glossary is the agreed copy.** What a term is, its kind, definition, values and what it belongs to come only from the Glossary. A gap there is a Glossary change, never a decision.
- **Nothing is invented.** Every action, field and answer comes from the Glossary, the BRD or the PRD. A data model decision is never a source for another answer.
- **Each gap goes where its kind goes,** as `data-model-design.md`, "Where each gap goes", says. A data model decision stays with the specifier, and never goes into the Question log. The data model never comments on the requirements: two requirements that disagree are a decision.
- **What is still open is asked again first.** A decision answered "I don't know yet", and a Glossary change left open, are never forgotten.
- **Only Glossary words.** Every word for a person, a thing, a step, a state or a value is the Glossary's. "Who" is a Glossary role, or "the product".
- **Flow first.** Actions come before fields, and every Glossary flow row involving the family shows in the file.
- **One action per row.** Each row of an Actions table holds one action, and each of its rules is one sentence, as `../_shared/atomic-rules.md` says.
- **The whole file first, then one gate.** How a thing moves is written before the gate, following the recommended answer of each open decision. At the gate, the decisions come first, then "Accept the {family name} data model?".
- **The status line is set by programs.** The skill writes "Status: drafted". `accept.cjs` sets it when the person accepts.
- **Stay within the family's part of the PRD.** Later parts add to earlier things in their own files.
- **No citations** in the file. The register keeps the reason for each decision, and where it lands. An answer not yet confirmed names only its question.
- **Template only.** The saved file is exactly the template's sections. Narration stays in the conversation.

## Handoff

The accepted file is read by feature-author, which gives every action and move a feature in section 5 of the Feature catalog. It is also read by each FRD that touches its things: the rules tables in the FRD's Data section, and the Actions tables, rules tables and moves for its seven Standard questions, as `data-model-design.md`, step 2, shows. After the last family, `data-model-workflow` sends every Glossary change to the Glossary together, then brings the data model in step with the answers.
