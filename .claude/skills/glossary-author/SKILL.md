---
name: glossary-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Build the Glossary from the accepted BRD and PRD, or add the new words a change
  brings: read each section, agree one word per meaning at Gate 1, agree each
  definition at Gate 2, and write the seven glossary pages, with the specifier
  deciding at both gates. Use once the PRD is accepted, for example "build the
  glossary for expense-claims", in a change whose recommendation names it, or
  when glossary-disposition sends a batch of new words. Says up front whether it
  is a new build, picking up where it stopped, a re-run, or adding words from a
  request. Not for checking a document against the Glossary (use glossary-check)
  or acting on drift (use glossary-disposition).
---

# glossary-author — build or update the glossary

> **What this is:** The skill that builds the Glossary: the one word the product uses for each meaning, its definition, and how the words relate. It sequences the glossary method and holds its two gates.
>
> **What it is not:** The method itself, which is kept in `../_shared/glossary/`, or the records filled from the gate log, which programs write.
>
> **Who uses it:** A specifier, once the PRD is accepted. The Extend and Update paths of a change that brings new words. glossary-disposition, with a batch of new words, such as the words the data model's Glossary changes need.

Sequence the method and hold the gates. The method is kept in `../_shared/glossary/`. **Follow those files, and do not restate them.** It also follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`.

## Reads
- The source: the accepted BRD and PRD, `Output/{project}/{project}-brd.md` and `Output/{project}/{project}-prd.md`. In a change, also the Change impact report, and only the requirements it names. When adding words from a request, also the request: each word, with its evidence from the Glossary, the BRD and the PRD.
- The existing glossary at `Output/{project}/glossary/` (the seven pages), if any, and its `deep-dives/`.
- The method: `../_shared/glossary/`. It includes `../_shared/glossary/method-words.md`, for the words every file uses, and `glossary-assembly-principles.md`, which decides the shape of the assembled glossary.
- The blank output files: `../_shared/glossary/templates/`.

## Produces
- `Output/{project}/glossary/` — the reader-facing glossary, seven pages: a `README.md` gateway, `terms-and-relationships.md`, the four kind pages and `decision-register.md`. The four kind pages are `object-terms.md`, `role-terms.md`, `step-terms.md` and `states-and-values.md`. Assembled per `../_shared/glossary/glossary-assembly-principles.md`.
- `Output/{project}/glossary/deep-dives/` — how the glossary was reached, kept as its evidence: one folder per section holding `{section}-glossary.md` and `{section}-decisions.md`, plus `glossary-assembly-draft.md` and `gate-log.md` at its root. Shapes in `../_shared/glossary/output-formats.md` ("The deep-dives").
- The gate log is the only place a glossary decision is written. The decision register, the section decisions files, Gate 2's "Also written as" and the kind pages' "Terms replaced or retired over time" tables are filled from it by programs (`../_shared/glossary/output-formats.md`, "Where each decision is recorded").
- The section decisions files are where the BRD's and the PRD's own words are listed next to the glossary's word for each, so a reader can always match the client's words to the agreed ones.

## Steps
1. **Mode.** First, a batch of new words from glossary-disposition → adding words from a request. Follow "Add words from a request", below, in place of steps 2 to 9. Otherwise, look for the seven glossary pages, not for an empty folder, as `../_shared/glossary/output-formats.md` ("What a run finds, and what it does") sets out:
   - no gate log, `deep-dives/gate-log.md` → new build. Project setup creates `glossary/` and `deep-dives/` empty, so the folders alone don't tell a new build from one picking up where it stopped.
   - a gate log but not the seven pages → picking up where it stopped. The method calls this a "resumed build". Continue from the gate log's `open` rows.
   - all seven pages → re-run.
   State which in one sentence, first. If the PRD isn't accepted, say so and stop.
2. **Sections.** Divide the source as `../_shared/glossary/otc-methodology.md` ("Sections") says, and name them.
3. **Scaffolding.** Before writing anything, run `node tools/scaffold-project.ts --project {project}`, which creates the folders. Then show where this run will write, as a tree, one file per line, using the layout in `../_shared/glossary/output-formats.md` ("The run root"). The tree shows the `Output/{project}/glossary/` files and every `deep-dives/` file. **Always announce the tree. Stop for a decision only when there is a real fork:**
   - the source splits into more than one glossary → each glossary becomes a project of its own. Show each project's paths, and confirm the split before creating any folder.
   - a re-run would remove a section folder the source no longer has → ask before removing it.
   Otherwise announce the tree and proceed. The paths are the person's to confirm. They are never invented silently.
4. **Read each section, in order** — follow `../_shared/glossary/lens1-ontology.md`, then `../_shared/glossary/lens2-topology.md`, then `../_shared/glossary/lens3-choreography.md`. Write the draft to `deep-dives/{section}/{section}-glossary.md` by filling `../_shared/glossary/templates/section-glossary.md`, as `../_shared/glossary/output-formats.md` ("What the section draft must contain") requires, cased per G6. The draft is named by its section, never a bare `picture.md`. Write `deep-dives/{section}/{section}-decisions.md` with its one placeholder line.
5. **Assemble and judge.** Join the sections into `deep-dives/glossary-assembly-draft.md` by filling `../_shared/glossary/templates/glossary-assembly-draft.md` as `../_shared/glossary/output-formats.md` ("What the assembly draft must contain") sets out. Include a proposed merge wherever the same-meaning test finds several words for one meaning. Then apply the rules in `../_shared/glossary/otc-run-rules.md` to the assembly draft.
6. **Gate 1** — write the review to `deep-dives/gate-log.md` by filling `../_shared/glossary/templates/gate-log.md`, with every gate row `open`. `../_shared/glossary/output-formats.md` says how, in "The Gate 1 review" and "The gate log". Then run the gate as `../_shared/glossary/otc-run-rules.md` sets it, resolving each row to `accepted`, `overridden`, or `answered`. Do not pass Gate 1 while any row is `open`. When picking up where it stopped, continue from the log's open rows rather than re-deriving the gate. The gate log is the only place the decisions are written at this step.
7. **Definitions.** Write each as `../_shared/glossary/lens1-ontology.md` ("Writing a definition") says.
8. **Gate 2** — first run `node tools/fill-also-written-as.ts --project {project}`, which fills each Gate 2 row's "Also written as" from the settled Gate 1 rows. Then write the definitions review to the gate log, in its Gate 2 part, with every gate row `open`, and run the gate as `../_shared/glossary/otc-run-rules.md` sets it, resolving each row. Do not pass Gate 2 while any row is `open`.
9. **Write output.** Only once no row in either gate is `open`, in this order:
   - assemble the seven pages in `Output/{project}/glossary/` per `../_shared/glossary/glossary-assembly-principles.md`. Apply its ground rules, Part A, and each page's Part B rules, filling the blanks in `../_shared/glossary/templates/`.
   - run `node tools/build-glossary-records.ts --project {project}`, which writes the decision register's rows, each linking back to its gate row, and every `deep-dives/{section}/{section}-decisions.md`, from the gate log.
   - run `node tools/build-retired-words-tables.ts --project {project}`, which writes each kind page's "Terms replaced or retired over time" table from the gate log.
   The assembly draft is not changed: it stays as it was at Gate 1, and the outcomes are in the gate log. Before finishing, run the casing and character sweep (G6) over the seven pages **and** everything in `deep-dives/`, and confirm every decision link resolves. Then run `node tools/check-simple-writing.ts --project {project}` with `--file` for each of the seven pages and for each file in `deep-dives/`. Add the `--skip-column` options that "The columns the quick check skips" lists, below. These columns hold the source's own words, so the check skips them. Fix everything it lists to fix in the kit's own sentences, and run it again. In a file a program fills from the gate log, fix the gate log, then run that program again. A word the source used, or a quote, stays as it is. Show the line the check prints for each file, such as "Simple writing, object-terms.md: 0 to fix, 2 to look at." Then run `node tools/check-glossary-sources.ts --project {project}` once more, and fix what it lists in the same way.
   - Last, run `node tools/accept.ts --project {project} --document gate-log`, which saves this version of the gate log and brings any open change's progress up to date.

## Add words from a request

glossary-disposition sends a batch of new words, all in one request. The data model's Glossary changes are one source of such a batch. Each word comes with its evidence: what the Glossary, the BRD and the PRD say about it, and where each one says it. Run the batch in one run:
1. **Check the request.** The seven pages must exist. If they don't, say so and stop. Say how many words the batch holds.
2. **Check each word's evidence.** Read the BRD and the PRD where the evidence points, and the Glossary pages the word would join. A word the BRD or the PRD names, in the sense the request needs, goes on. A word the sources don't name is never invented. It stays open, and is reported back, with why, such as "the BRD and the PRD never name a shelf code".
3. **Gate 1, on those words only.** Add a new part to the gate log, as a re-run does (`../_shared/glossary/output-formats.md`, "What a run finds, and what it does"), with one row per word. Ask each row as "How the gates are asked", below, says.
4. **Definitions and Gate 2, on those words only,** as steps 7 and 8 say.
5. **"I don't know yet", for a word that came from the data model.** In this mode, that answer leaves the word open. The word is not added to the Glossary for now, and it never goes into the Question log, so probing-questions-author raises no question for it. This takes the place of what "How the gates are asked", below, says for "I don't know yet". Its gate row is still resolved, so the gate can close: the word is not kept for now. The word is reported back as left open. glossary-disposition then marks its Glossary change "Left open on {date}", through `data-model-workflow`. The skill that owns that change asks it again first, at its next run.
6. **Write output** as step 9 says, for those words only. Every other word of the Glossary stays as it is.
7. **Report back** to glossary-disposition: each word added, and each word left open, with why.

## In a change

When a change's recommendation names the Glossary, add only the new words section 9 of its Change impact report lists, each written `New word: {the word}`. Run them as "Add words from a request" says, with each word's evidence from the report.

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

## How the gates are asked

Both gates are held as `../_shared/decision-review-gates.md` sets out, with the gate log as the record of every row:
- **Before each gate, the quick check.** Run `node tools/check-simple-writing.ts --project {project}` with `--file` for each file this run wrote or changed in `deep-dives/`. Add the `--skip-column` options that "The columns the quick check skips" lists, below. Those columns hold the source's own words, as the source wrote them, so the check doesn't read them. Fix what it lists to fix in the kit's own sentences, and run it again. A word the source uses stays as it is. Gate 1 settles a hard one, as `../_shared/simple-writing-rules.md`, part 3, says.
- **Before each gate, the sources check.** Run `node tools/check-glossary-sources.ts --project {project}`. Every piece of evidence must point at the accepted PRD, by its REQ IDs, or the BRD, by its BR IDs. It must never point at a requirement file in `sources/`. Fix everything it lists, and run it again, until it lists nothing. A gate is never held while it lists something.
- Each gate opens with the line the quick check printed for each of those files, then the sources check's line. Then comes `grade-questions.ts`'s "For the person" block, then any open Must answer question in the Question log that the Glossary builds on, one at a time.
- Then the gate rows, in the method's order (`../_shared/glossary/output-formats.md`, "How the gate is answered"), one at a time. probing-questions-author asks every decision at both gates, in its Ask mode, as rule 4 says. For a gate row, it works from the row's evidence in the gate log.
- **Each gate row is one decision, asked on its own.** Never put several rows into one question, such as eight merges at once. Rows of the same kind still come one at a time.
- **The question names the exact words it decides.** For example: "Do "cart" and "basket" mean the same thing? If so, which word does the glossary use?" Never "see above", and never a bare row number.
- **Each answer names its exact outcome:** the word kept, and the word retired or renamed, such as "One term, called Cart". Its description says what changes in the glossary, and which documents that use the word change too.
- **The evidence is said in plain words at the gate.** Quote the words, and name the PRD's part by its title. Name no file and no section number. The gate log keeps the links to the evidence.
- "I don't know yet" takes the recommendation for now, except for a word from the data model, as "Add words from a request", step 5, says:
  - the row is resolved `accepted`
  - its Resolution says Proposed (needs confirmation), and names its question
  - probing-questions-author raises that question in the Question log, with who can answer it and by when
- The glossary is the one agreed exception to "one gate per skill": Gate 1 settles the words, and Gate 2 the definitions.

## The columns the quick check skips

These columns hold the source's own words. Give the quick check one `--skip-column` option for each:
- `--skip-column "Candidate"`
- `--skip-column "Candidate in this draft"`
- `--skip-column "Earlier word"`
- `--skip-column "Retired / overrides"`
- `--skip-column "Parent"` and `--skip-column "Child"`, the relationship table's columns in the section draft
- `--skip-column "Belongs to"` and `--skip-column "States"`, the states table's columns
- `--skip-column "First"` and `--skip-column "Second"`, the flow table's columns
- `--skip-column "Words"`, the conflicts table's column
- `--skip-column "Dropped"`, the column of words left out
- `--skip-column "Shown under"`, `--skip-column "Also a kind of"`, `--skip-column "Also part of"` and `--skip-column "Also shown or created by"`, the lookup table's columns
- `--skip-column "Recommended word"` and `--skip-column "Also written as"`, the assembly draft's word table
- `--skip-column "L1"`, `--skip-column "L2"` and `--skip-column "L3"`, a level table's columns

A level table has one column for each level, so it can have more than 3. For each further level column a file has, add one more option, such as `--skip-column "L4"`. glossary-disposition uses the same options.

## Must not
Follow the boundary in `../_shared/glossary/otc-run-rules.md`:
- propose, never decide
- never invent a meaning or pick a winning word
- edit prose only
- never rename a file or an identifier

## Connects
glossary-author builds the glossary. **glossary-check** spots drift in a document. **glossary-disposition** acts on drift. After glossary-author, `data-model-workflow` runs, then `features-and-epics-workflow`. From the data model on, every document uses the glossary's words.
