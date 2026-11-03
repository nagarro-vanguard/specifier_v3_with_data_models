---
name: things-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Finds the things a product keeps information about, from its Glossary: every
  Glossary word becomes a thing, a field, a choice or nothing, and each thing gets
  its Glossary family, its definition and its data model file, written to
  {product}-glossary-things.md. Also opens the product-wide decisions every family
  shares, such as which roles can act in the first release. One gate: the
  product-wide decisions, then "Accept the things?". Says up front which mode it
  is in: a change, a new build, picking up where it stopped, or nothing to do.
  Use once the Glossary is written, for example "find the things for
  city-library". Not for the actions, fields and rules of each thing (use
  data-model-author).
---

# things-author

> **What this is:** The skill that lists the things a product keeps information about, straight from the Glossary, says which data model file each one goes in, and settles the decisions every family shares.
>
> **What it is not:** The actions, fields and rules of each thing, which data-model-author writes.
>
> **Who uses it:** `data-model-workflow`, as its first step, and at its fourth step, in a change. A specifier, on its own, with the project's name.

This skill follows `../_shared/data-model-design.md`, sections 1 to 5, and writes from `../_shared/templates/data-model-things.md` and `../_shared/templates/data-model-decisions.md`. It loads them, and never restates them. If any is missing, it names the file and stops.

## What it reads and writes

- **Reads:**
  - the Glossary's term pages: `object-terms.md`, `role-terms.md`, `step-terms.md` and `states-and-values.md`
  - the Glossary's `terms-and-relationships.md`, for the "kind of" rows that tie a word to a thing in another family
  - the Glossary family each term sits under
  - the BRD, for what the first release covers and who acts in it
  - the PRD, only to see whether a word has details of its own
  - the Question log, only for the recommended answer to a question the PRD left open
- **Writes:**
  - `Output/{project}/glossary/data-models/{product}-glossary-things.md`
  - its product-wide decisions and Glossary changes, in `Output/{project}/glossary/data-models/{product}-data-model-decisions.md`
- **Its gate:** the product-wide decisions, then "Accept the things?"
- **Its check:** `check-data-model.cjs`. It runs `data-model-design.md`, step 7, check 1, and the kit's checks, on the things file and on the decisions file.

## Steps

### 1. Mode

Find the mode, as `data-model-design.md`, section 3, "Before you start", sets out. Take the first that fits, and state it in one sentence, first:
- a change names `{product}-glossary-things.md` → a change: follow "In a change"
- no `{product}-glossary-things.md` → new build: run every step from step 2. A start again from `requirements-workflow`, step 1, is always a new build, as the project starts again from nothing.
- `{product}-glossary-things.md`, not yet accepted → picking up. Check the inputs, then go on from the gate, step 10. A decision already settled stays settled.
- `{product}-glossary-things.md`, accepted, with an entry still open that this skill owns → picking up. Ask each one again, in step 3. Hold the gate again only when an answer changes the file.
- `{product}-glossary-things.md`, accepted, nothing still open for this skill, and no change → nothing to do. Say so, and stop. data-model-author goes on with the next family.

### 2. Set up

Check the inputs, as `data-model-design.md`, section 3, "Before you start", says.

### 3. Ask again what is still open

Before anything else is written, ask again each entry still open that this skill owns, as `data-model-design.md`, section 3, "What is still open is asked again first", says. Run `node tools/status.cjs --project {project}`. Its block "Data model, still open" lists each entry, and names the skill that asks it. This skill owns the entries of the things file:
- each product-wide decision answered "I don't know yet": ask it again as gate 1 asks it, one per message, as multiple choice, with the recommended answer first and "I don't know yet"
- each Glossary change raised from the things file and left open: ask whether to send it to the Glossary again, with "Send it with the next batch" recommended, and "I don't know yet"

Record each answer straight away, in the register and in the file. An answer to a product-wide decision also fills its "?" in every family's file. data-model-author writes it into each of those files, in a change.

### 4. Read the sources

Read them in the order, and by the rules, in `data-model-design.md`, section 2.

### 5. Sort every Glossary word

Take the words in the Glossary's order. For each word, read its kind page and its rows in `terms-and-relationships.md`, then give it the row it matches in the table in `data-model-design.md`, step 1: a thing, a field, a choice, nothing, or a Glossary change. A Glossary change is a gap. It goes where `data-model-design.md`, "Where each gap goes", sends it. That is the decision register's "Glossary changes" section, written as the design's step 5 says. The word is left out until the Glossary settles it.

### 6. Find the product-wide decisions

Follow `data-model-design.md`, step 1, "Then find the product-wide decisions": a gap whose answer would fill a "?" in every family's file, such as which roles can act in the first release. Find each gap's kind in `data-model-design.md`, "Where each gap goes", and send it where its kind goes. Open each data model decision in the decision register, asked one at a time, with its options and a recommendation.

### 7. Name each thing's data model file

Give each family the file named after it, as `data-model-design.md`, section 3, "Which file a thing goes in", says.

### 8. Write {product}-glossary-things.md

Fill in `data-model-things.md`, as its Placeholders part says. Its status line reads "Status: drafted". When this skill adds an entry to the decisions file, or settles one, it sets the decisions file's status line to "Status: drafted" too. The things file holds:
- one section per Glossary family, naming its data model file once
- every thing in the family, with its definition word for word
- under each family, which of its things is a kind of another thing, and the words left out
- the open product-wide decisions, under "Decisions to make", those answered "I don't know yet" included
- the Glossary changes the Glossary hasn't settled, under "Waiting on the Glossary"

Words that become a field or choices are not listed: data-model-author puts them on their thing.

### 9. Check

Run `node tools/check-data-model.cjs --project {project}`. It runs check 1 in `data-model-design.md`, step 7: every Glossary term that is a thing, or becomes nothing, is in `{product}-glossary-things.md`. It also checks that every family names its file, that every definition matches the Glossary word for word, that every thing the Glossary makes one kind of another thing is in its family's "Kind of" list, and that every open product-wide decision is under "Decisions to make". It runs the kit's checks too: the opening, the sections, the placeholders, simple writing and the retired Glossary words. It checks the decisions file as well. Fix every finding, and run it again, until every check passes.

It runs simple writing, so it counts as the quick check that `../_shared/simple-writing-rules.md` asks for. A definition is copied word for word from the Glossary, so never change one to pass the check. The check never fails a definition. When it shows one to look at, that belongs to the Glossary. Send it where a Glossary change goes, as `data-model-design.md`, "Where each gap goes", says. Run the check again each time a file changes at the gate.

### 10. The gate

Hold gate 1, as `data-model-design.md`, section 5, says:
- show the person `{product}-glossary-things.md`
- show the check's "For the person" block first. It holds what the check program shows for each file, such as "Simple writing, to look at: 3 places".
- show the Glossary changes found. Each one waits, marked "To raise". Once every data model file is accepted, all of them go to the Glossary together, as step 8 of `data-model-design.md` says.
- ask the product-wide decisions first, one per message, as multiple choice. The recommended answer comes first, and "I don't know yet" is always one of the answers. Record each answer straight away, in the register and in the file.
- then ask **"Accept the things?"**
- when they change a row, change it in `{product}-glossary-things.md`, then ask again
- when they accept:
  1. set the "Next step" line to "None: the things are accepted."
  2. run the check once more, and paste its "For the file" block into the Check record of the things file, and into the Check record of the decisions file. Do this before `accept.cjs`, never after.
  3. run `node tools/accept.cjs --project {project} --document data-model-things`. It sets the status line of the things file, and saves a copy of it in the Version log. It does the same for the decisions file.
  4. close with `node tools/status.cjs --project {project}`

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When a Glossary term is added, renamed or withdrawn after `{product}-glossary-things.md` is accepted, change only the rows for that term, then hold the gate again. Every other row stays as it is. Step 4 of `data-model-workflow` is such a change: it names the Glossary changes the Glossary has settled, and a word that waited on one is placed now. While the skill changes the file, its status line reads "Status: drafted". When the person accepts it again, `accept.cjs` saves the new version, so the change can see what changed.

## Rules

The most important few:
- **The Glossary is the agreed copy.** Its words, definitions, kinds, values and what each term belongs to are used as they are. Never rename, redefine or reclassify a term: a step stays a step.
- **Every thing and every left-out word is listed.** Words that become a field or choices wait for data-model-author.
- **Never invent a thing** the Glossary doesn't name.
- **Each gap goes where its kind goes,** as `data-model-design.md`, "Where each gap goes", says. A data model decision stays with the specifier, and never goes into the Question log. The data model never comments on the requirements.
- **Product-wide decisions are asked once, by this skill.** Every family's file then uses the same answer. While one is open, each family's file shows "? (DM-{n})" in each cell it answers.
- **What is still open is asked again first.** A decision answered "I don't know yet", and a Glossary change left open, are never forgotten.
- **The status line is set by programs.** The skill writes "Status: drafted". `accept.cjs` sets it when the person accepts.
- **Template only.** The saved file is exactly the template's sections. Narration stays in the conversation.

## Handoff

The accepted `{product}-glossary-things.md` feeds `data-model-author`, which writes each data model file it names, one at a time. The settled product-wide decisions fill their gaps in every one of those files.
