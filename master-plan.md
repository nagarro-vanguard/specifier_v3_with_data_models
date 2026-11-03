# Specifier v3: master plan

**Status:** draft for your review, version 5, 2026-10-22.

**What it covers:**
- what we build, and the order we build it in
- how the workflows connect the pieces

**Quick view:** [specs/summary.md](specs/summary.md) lists every item in one line each.

**Where the details are:** each item's full spec is in one of four docs. This plan only indexes them, so nothing is written twice.
- [specs/net-new.md](specs/net-new.md): nothing in today's toolkit does the job; written from scratch
- [specs/optimize.md](specs/optimize.md): an existing piece does the job; we change or remove parts of it
- [specs/extend.md](specs/extend.md): an existing piece does the job; we keep all of it and only add
- [specs/reuse.md](specs/reuse.md): an existing piece does the job exactly; copied unchanged

**Views of this plan:** this plan and the specs are the source. The two pages below show them, and change in the same pass as the plan, never on their own. Before the Workflows page is republished, a script checks it against section 4, and it isn't published while they differ.
- [Specifier v3 Workflows](https://claude.ai/artifact/DgU1Det3BfetGTzFsc4XfL): section 4, drawn as swimlanes
- [Old vs New Workflow](https://claude.ai/artifact/XpiJqPk4DQTrRhqjqKwKKW): every change from today's toolkit, with its reason and who decided. "Row N" in the specs refers to this page.

## Ground rules

- **Nothing outside `specifier_v3/` is edited.** These are only read and copied:
  - `.claude/`
  - `glossary_methodology/`
  - `frd_experiment/`
  - `Output/`
  - `_reference/`
- **Workflows, programs and wiring are written fresh.** Nothing is borrowed from the old workflows or tools.
- **For skills, existing method text is kept only where it fits.** Each spec names exactly what's kept and why.
- **Every item does one job, and does it right.** Items are never merged to cut the count.
- **Every skill runs on its own.** You can call any skill directly, without its workflow, and it behaves the same. A skill:
  - finds its inputs in the run folder, and asks if one is missing
  - runs probing-questions-author and `grade-questions.cjs` on its draft, so every gap becomes a question in the Question log
  - runs its own check program before its gate
  - holds its own gate and writes its own decision record
  - on acceptance, calls `accept.cjs`
- **A workflow only connects a few skills.** It puts them in order, covers one piece per run (one FRD, one EPIC, one change), then stops and names what comes next. Nothing runs the whole flow in one go, with one exception: `change-orchestration-workflow` makes every update of a change you said yes to.
- **One gate per skill.** The one agreed exception is glossary-author, with Gate 1 and Gate 2.
- **Programs do the copies and checks.** Only judgement goes to a skill.
- **Numbering starts at 1.** That covers every step, phase, item and folder.
- **Build everything, then one trial** (your decision of 2026-10-22). Every workflow is built end to end before anything runs on your requirement:
  - while building, each program is tested on test data: the MCP test slice, or the Expense claims worked examples where the slice has no such document
  - once every phase is built, the whole flow runs once, as a trial on your requirement, and its gates are your review
  - while building, a design choice is not put to you as a question: the option that loses nothing is taken, and recorded in section 8, "Calls made while building", for you to review before the trial
- **What a specifier uses carries no build history.** The rules, templates, programs and fixture notes never mention:
  - the interim name "Specifier v3", or the folder `specifier_v3`
  - the design pages, or their rows
  - gate answers, or notes written for us as builders

  That history lives only here and in the specs. A test fails if any of it creeps back.
- **No client material outside the test data.** Every example in a rule, template or program is about one made-up product, Expense claims. A test fails if a client's material appears there.
- **Every template makes sense on its own.** Nothing is hidden in it. Each section says what it holds, each placeholder says exactly what to write with an example, and a worked example sits beside it in `examples/`.
- **Every shared file is written in plain words, in one voice.** It says "the skill" and "the specifier", never a "you" that could mean either. It never shows markdown inside a code block: it gives a real example, and a table of what each line holds.

---

## 1. What comes first

| Order | What | Why |
|---|---|---|
| 1 | **Foundation**: the shared rules, templates and common programs | Without it, each skill invents its own formats. |
| 2 | **Skills**, a few at a time, in the order a workflow uses them | They carry the method, and each must work on its own first. |
| 3 | **The workflow that connects them**, straight after its skills | It only puts tested skills in order, so it's written once and never patched. |

There's no top-level orchestrator. To see where a project stands, `status.cjs` reads the run folder and lists:
- what's done
- what's parked
- every Must answer question still open
- what to run next

---

## 2. Folder layout

Three rules hold for every folder and file name:
- No numbers in folder or file names.
- A file name never repeats what its folder already says.
- A folder exists only to group several files.

**The specifier itself.** This list is the only place that decides where a file lives: nothing exists in the folder unless it is listed here, and a new place is put to you first. A test fails when the folder holds anything this list doesn't name. Each entry says what happens to it when the build ends (your decision of 2026-10-22): it **ships** with the kit, is **archived** outside the kit as the record of the build, or is **discarded**.

- `specifier_v3/`: the kit's home while it is built. The kit leaves it when the build ends.
  - `README.md`: how to use the kit. Ships.
  - `.claude/`: ships
    - `skills/`
      - `_shared/`: the rules every skill follows
        - `atomic-rules.md`: when to split a requirement, and when to keep it together, wherever requirements, rules, stories or tests are written
        - `conventions.md`
        - `data-model-design.md`: how to write a product's data model from its Glossary, BRD and PRD
        - `decision-review-gates.md`: how every gate runs, and how each question is put
        - `project-folders.md`
        - `quality-characteristics.md`
        - `simple-writing-rules.md`: how to write every document in simple words
        - `templates/`: a blank form for each document, such as `brd.md`, `frd.md` and `question-log.md`
          - `parts/`: pieces used inside documents: the decision record, the version log and the traceability map
        - `examples/`: the same forms, filled in for the made-up Expense claims product
        - `glossary/`: the glossary method as you approved it on 6 October, with its word list
      - `{skill name}/`: one folder per skill, such as `frd-author/`
      - `{workflow name}/`: one folder per workflow, such as `requirements-workflow/`
  - `tools/`: the programs, such as `check-frd.cjs` and `grade-questions.cjs`. Ships.
    - `lib/`: code the programs share
    - `tests/`: the tests, each named for what it tests, such as `requirements.test.cjs`
      - `helpers/`: code the tests share
  - `fixtures/`: the test data
    - `README.md`: what each piece of test data holds. Ships.
    - `expense-claims/`: the later documents of the made-up Expense claims product. Ships.
    - `mcp-slice/`: one section of a real requirement. Discarded: a real client's material doesn't ship.
    - `approved-glossary-method/`: the glossary method exactly as you approved it, which the tests compare the kit's copies with. Discarded, with the two tests that use it.
    - `old-change-impact-skill/`: the old kit's change-impact skill exactly as it was, which a test compares `feature-impact` with. Discarded, with the test that uses it.
  - `Output/`: the projects, one folder each. Ships, holding your projects; the test pass's projects are discarded.
  - `master-plan.md`: this file. Archived.
  - `build-log.md`: the status of every item. Archived.
  - `specs/`: the four spec docs, and the summary. Archived.
  - `skill-pass.md`: the pass over the test data: every gate answer and every gap. Archived.
  - `old-vs-new-workflows/`: the design pages as they were saved, from the first workflow map to the latest Specifier v3 Workflows and Old vs New Workflow, one file per saved version, each named with its date. Archived.
  - `_data_model/`: the working notes for the data model. A working folder that doesn't ship.
  - `_change/`: the working notes for joining the change workflows to the kit. A working folder that doesn't ship.
  - `_archive/`: earlier notes and runs, kept as they were written. A working folder that doesn't ship.
  - `kit-findings.md`: the bugs found in the kit on a trial run, and how each was settled. A working note that doesn't ship.
  - `template-enhancements.md`: the changes to the Story template, and to the skills and checks that use it. A working note that doesn't ship.

**When the build ends** (your decision of 2026-10-22), in this order:
1. The tests that run on `fixtures/mcp-slice/` move to the Expense claims data, and the two tests that compare the glossary copies with the approved method are retired. So is the test that compares `feature-impact` with the old change-impact skill.
2. The test pass's projects are deleted:
   - `Output/control-plane/`
   - `Output/mcp-slice/`
   - `Output/expense-claims/`
3. `fixtures/mcp-slice/`, `fixtures/approved-glossary-method/` and `fixtures/old-change-impact-skill/` are deleted.
4. The plan, the build log, the specs, the pass record and the design pages are archived outside the kit, in a folder you name then.
5. The kit moves to its final home, and `specifier_v3/` is gone.
6. The live progress page is deleted, when you say so.

Untouched, and yours to decide: the old skills in the root `.claude/skills/`, the old runs in the root `Output/`, `glossary_methodology/`, `frd_experiment/` and `_reference/`.

**A project,** for a product called Expense claims:

- `specifier_v3/Output/expense-claims/`
  - `sources/`: your requirement files
  - `expense-claims-discovery-brief.md`
  - `expense-claims-brd.md`
  - `expense-claims-prd.md`
  - `expense-claims-question-log.md`: every question asked in the project, whichever document raised it
  - `glossary/`: the Glossary's seven files, and `deep-dives/`
    - `data-models/`: the data model: the things file, one data model file per family, and the data model's decisions
  - `frd/`: `feature-catalog.md`, and one `frd-{capability}.md` per capability
  - `epics/`: `grouping.md`, `register.md`, `sequencing.md` and `mapping.md`
    - `EPIC-002-claim-approval/`: one folder per EPIC, with `brief.md` if it has one, `story-list.md`, and one file per story
  - `changes/`: one folder per change, once a change is raised
  - `version-log/`: once the first document is accepted
  - `traceability-map.json`

The full layout, and which step writes each file, is in `project-folders.md`.

`specifier_v3/` is only the kit's home while it is built. Projects live inside it, in `specifier_v3/Output/<project>/`: the kit's skills load only when Claude Code is opened in the kit's own folder, so that is the folder you work from (your decision of 2026-10-22). When the kit leaves its interim folder, `Output/` goes with it. `scaffold-project.cjs` checks that a project's folders exist and creates any that are missing, before anything is written.

Skills under `specifier_v3/.claude/skills/` are a separate set from the old ones under the root `.claude/skills/`. The old ones keep working as they do today.

---

## 3. Every item

**87 items in all:**
- 55 Net new
- 25 Optimize
- 4 Extend
- 3 Reuse as is

| Kind of item | Net new | Optimize | Extend | Reuse as is |
|---|---|---|---|---|
| Skills | • `change-request-disposition`<br>• `change-impact-author` | • `discovery-author`<br>• `brd-author`<br>• `prd-author`<br>• `glossary-author`<br>• `glossary-disposition`<br>• `feature-author`<br>• `epic-grouping-author`<br>• `epic-author`<br>• `frd-author`<br>• `story-drafter`<br>• `story-groomer`<br>• `ac-author` | • `adversarial-check`<br>• `probing-questions-author` | • `glossary-check`<br>• `feature-impact` |
| Workflows | • `requirements-workflow`<br>• `features-and-epics-workflow`<br>• `frd-workflow`<br>• `stories-workflow`<br>• `change-request-workflow`<br>• `change-orchestration-workflow` | | | |
| Programs | 38 programs; see NET-NEW | • `check-frd.cjs` | | |
| Templates | • Version log (a part)<br>• Traceability map (a part)<br>• Change impact report<br>• Question log | • Discovery brief<br>• BRD<br>• PRD<br>• Feature catalog<br>• EPIC grouping<br>• EPIC register<br>• EPIC brief<br>• FRD<br>• Story list<br>• Story | • decision record | |
| Shared files | • `conventions.md`<br>• `project-folders.md` | • `quality-characteristics.md`<br>• the glossary method's record-keeping files | • `decision-review-gates.md` | • the rest of the glossary method |
| Other | • the update test<br>• `fixtures/mcp-slice/`<br>• `build-log.md`<br>• `README.md`<br>• the worked examples, in `examples/` | | | |

The phase table in section 5 lists every item by its spec number.

---

## 4. The workflows, step by step

This section is the only copy of the steps. The specs point to this section.

Each workflow connects a few skills, covers one piece per run, then stops and names the next run. Every skill can also be run on its own.

Before any step writes, `scaffold-project.cjs` makes sure the project's folders exist. Every skill does the same when you run it on its own.

Every step done by a skill that writes a document runs two things inside itself, after drafting and before its check program:
- probing-questions-author, which turns each gap into a question, rated for impact and severity
- `grade-questions.cjs`, which places each question in its group, sets the order, and checks that every gap names its question

The questions go to the one Question log, so these steps list it among what they write. The workflows gain no extra steps.

**The data model works differently.** `things-author` and `data-model-author` run neither probing-questions-author nor `grade-questions.cjs`:
- Their decisions stay in the data model's own decisions file, never in the Question log. The client sees them only later, as FRD rules. This is decision 3 of the stitching plan.
- A question the PRD left open stays in the Question log. The data model uses its recommended answer, marked Proposed (needs confirmation), with the question's number.
- At their gates, the data model's decisions come first, as multiple choice, then the gate's own question, as `data-model-design.md` says.
- A "yes" runs `accept.cjs`, as at every other gate. It also saves a copy of the decisions file.

At every one of your gates:
- the questions come first, in the order `grade-questions.cjs` sets:
  - the Must answer questions, one at a time
  - the Should answer questions, one at a time
  - the Can move ahead questions, as one list with their recommended answers
  - then the gate's own question
- an open question never fails a check, and never stops an acceptance, except under the two guards below
- a "no" sends the step back to its skill, with your feedback
- a "yes" runs `accept.cjs`, which:
  - saves a copy of the document in the Version log
  - saves a copy of the Question log as it stands
  - rebuilds the Traceability map
  - updates any open change
- after a "yes", `status.cjs` lists every Must answer question still open, and names the next run

The two guards:
- a Must answer question must be answered before any FRD that builds on it is accepted
- a Must answer question raised while writing stories must be answered before those stories are marked ready

### Workflow 1: `requirements-workflow`

- **One run covers:** the whole product.
- **Starts when:**
  - you put the sources in `Output/<project>/sources/`
  - you ask, in words, to start the project again from nothing, after a dramatic change to the requirements. Once you say yes to what will move, every file and folder in `Output/{project}/` except `sources/` moves to `_archive/Output-{date}/{project}/`. No program does this move yet: the workflow does it by hand. Every step runs fresh, from step 1, and no earlier question is asked again.
  - a change's path names step 2 or step 3, in section 15 of its Change impact report
- **Ends with:** an accepted PRD.
- **Next:** `glossary-author`. In a change, the next row of the change's path.

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before your gate | Your gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `discovery-author`, which runs `list-sources.cjs` first | start: you bring the sources | Sources | none | • Discovery brief<br>• Question log | `check-discovery-brief.cjs` | Accept the Discovery brief? | 2 |
| 2 | `brd-author` | 1 | • Sources<br>• Discovery brief | none | • BRD<br>• Question log | `check-brd.cjs` | Accept the BRD? | 3 |
| 3 | `prd-author` | 2 | • Sources<br>• Discovery brief<br>• BRD | none | • PRD<br>• Question log | `check-prd.cjs` | Accept the PRD? | run `glossary-author` |

### The Glossary build: `glossary-author`, no separate workflow

- **One run covers:** every word in the BRD and PRD, or only the new words a change brings.
- **Starts when:** the PRD is accepted.
- **Ends with:** a written Glossary.
- **Next:** `data-model-workflow`.

The Glossary gate log is the only place a Glossary decision is written. Every other place that shows a decision is filled from it by a program.

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before your gate | Your gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `glossary-author`, words | start: PRD accepted | • BRD<br>• PRD | none | Glossary gate log, Gate 1 part | • `check-simple-writing.cjs`, on each file it wrote in `deep-dives/`<br>• `check-glossary-sources.cjs` | Gate 1: are the words settled? | 2 |
| 2 | `glossary-author`, definitions, which runs `fill-also-written-as.cjs` before showing Gate 2 | 1 | Glossary gate log | none | • Glossary<br>• Glossary gate log, Gate 2 part, with "Also written as" filled from Gate 1 | • `check-simple-writing.cjs`, on each file it wrote in `deep-dives/`<br>• `check-glossary-sources.cjs`<br>• once the seven pages are written: the method's character sweep and link check, and `check-simple-writing.cjs` on every page | Gate 2: are the definitions settled? | 3 |
| 3 | `build-glossary-records.cjs`, then `build-retired-words-tables.cjs` | 2 | Glossary gate log | none | • Decision register<br>• Section decisions<br>• the "Terms replaced or retired over time" table on each kind page | none | none | run `data-model-workflow` |

### The data model: `data-model-workflow`

- **One run covers:** the whole product.
- **Starts when:**
  - the Glossary is written
  - a change's path names step 1 or step 2, in section 15 of its Change impact report
- **Ends with:**
  - every data model file accepted
  - every Glossary change sent to the Glossary, and each one the Glossary settled brought into the data model
- **Next:** `features-and-epics-workflow`. In a change, the next row of the change's path.

The data model works from the Glossary, and never comments on the requirements. Two requirements that disagree are a data model decision: you pick which answer the data model uses. The data model collects every Glossary change it finds, across all families. Once every data model file is accepted, all of them go to `glossary-disposition` together, in one run. A Glossary change changes words, not requirements, so it doesn't go through `change-request-workflow`. Each change is marked as it goes, as the decision register's template says:
- "To raise": found, and waiting for the others
- "Raised": sent to `glossary-disposition`, with the others
- "Settled in the Glossary on {date}", or "Left open on {date}" when you answer "I don't know yet", or `glossary-author` leaves the new word open
- then "Settled in the Glossary on {date}. Brought into the data model on {date}", once step 4 is done

A decision you answer "I don't know yet", and a Glossary change you leave open, stay open in the decision register. `status.cjs` lists each one, and the skill that owns it asks it again first, at its next run.

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before your gate | Your gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `things-author` | start: Glossary written | • Glossary<br>• BRD<br>• PRD | none | • `glossary/data-models/{product}-glossary-things.md`<br>• its product-wide decisions and Glossary changes, in the decision register, `glossary/data-models/{product}-data-model-decisions.md` | `check-data-model.cjs` | Gate 1: the product-wide decisions, as multiple choice, then Accept the things? | 2 |
| 2 | `data-model-author`, once for each family the things file names | 1 | • the things file<br>• the settled product-wide decisions<br>• Glossary<br>• BRD<br>• PRD | none | • one data model file, such as `glossary/data-models/lending.md`<br>• its decisions and Glossary changes, in the decision register | `check-data-model.cjs` | Gate 2: the decisions, as multiple choice, then Accept the {family name} data model? | • 2, for the next family<br>• 3, after the last family |
| 3 | `glossary-disposition`, once, with every Glossary change as one batch | 2, every file accepted | the decision register's Glossary changes marked "To raise", from every family | Glossary | • Glossary<br>• Glossary gate log<br>• a ripple list of the documents that use each term<br>• the new words, through `glossary-author`, in one run | none before its gate. After it: the method's character sweep and link check, and `check-simple-writing.cjs` | How should the Glossary settle each change? One at a time:<br>• change the Glossary<br>• add new words, through `glossary-author` and its gates<br>• I don't know yet | 4 |
| 4 | `things-author`, then `data-model-author`, each in a change | 3, the batch settled | the changed Glossary | none | • the things file and the data model files, for the changed terms only<br>• the decision register, for a decision that changes | `check-data-model.cjs` | their own gates, for what changed | end |

### Workflow 2: `features-and-epics-workflow`

- **One run covers:** the whole product.
- **Starts when:**
  - `data-model-workflow` has ended, and every data model file is accepted
  - a change's path names step 1, 2 or 3, in section 15 of its Change impact report
- **Ends with:** the EPIC register, EPIC sequencing and EPIC mapping.
- **Next:** `frd-workflow`. In a change, the next row of the change's path.

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before your gate | Your gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `feature-author` | start: data model accepted | • PRD<br>• data model files | • Glossary<br>• BRD | • Feature catalog<br>• Question log | `check-features.cjs` | Accept the Feature catalog? | 2 |
| 2 | `epic-grouping-author` | 1 | Feature catalog | none | • EPIC grouping<br>• Question log | `check-epic-grouping.cjs` | Pick a grouping, settle its clashes, confirm the EPIC brief list | 3 |
| 3 | `epic-author`, register mode | 2 | EPIC grouping | Feature catalog | EPIC register | `check-register.cjs`. On a fail, back to step 3. | none: accepted when the copy check passes | 4 |
| 4 | `build-sequencing-mapping.cjs` | 3 | • EPIC register<br>• EPIC grouping | Feature catalog | • EPIC sequencing<br>• EPIC mapping | none | none | run `frd-workflow` |

### Workflow 3: `frd-workflow`

- **One run covers:** one FRD.
- **Starts when:**
  - the EPIC register is written, or the previous FRD is accepted
  - a change's path names step 2, in section 15 of its Change impact report
- **Ends with:** one accepted FRD.
- **Next:** run it again for the next capability. `stories-workflow` can start on an EPIC once the FRDs of its own features are accepted. Other FRDs can still be open. In a change, the next row of the change's path.

A decision at an FRD's gate may change a detail the data model gives. Then the FRD says the new value, with a note. The note reads *Updated from the data model on the basis of Decision n: …*. The data model file stays as it is, and no change is raised. The latest document wins, and the kit moves forward.

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before your gate | Your gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `route-next-capability.cjs` | start | • EPIC register<br>• Feature catalog<br>• the FRDs' status lines | none | the next capability, with any waiting on a Must answer question, then parked ones, last | none | none | 2, or "every FRD accepted" |
| 2 | `frd-author` | 1 | Feature catalog | • PRD<br>• Glossary<br>• data model files | • FRD<br>• Question log | `check-frd.cjs` | Accept the FRD? The Must answer questions it builds on come first, one at a time. While one is open, the FRD can't be accepted: answer it, or park the FRD. | end of this run |

### Workflow 4: `stories-workflow`

- **One run covers:** one EPIC.
- **Starts when:**
  - the FRDs of the EPIC's own features are accepted. Another FRD may still be waiting or parked. story-drafter checks this in its step 1.
  - a change's path names step 3, 4, 5 or 6, in section 15 of its Change impact report
- **Ends with:** that EPIC's stories marked ready.
- **Next:** run it again for the next EPIC. When every EPIC is ready, the flow is done, and a change comes in through `change-request-workflow`. In a change, the next row of the change's path.

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before your gate | Your gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `route-next-epic.cjs` | start | • EPIC register<br>• every Story list | none | the next EPIC that isn't waiting on a parked one or on a Must answer question | none | none | 2, or "every EPIC ready" |
| 2 | `route-brief-list.cjs` | 1 | EPIC grouping | none | yes or no | none | none | yes: 3<br>no: 4 |
| 3 | `epic-author`, brief mode | 2 | EPIC register | • BRD<br>• PRD<br>• Feature catalog | • EPIC brief<br>• Question log | `check-epic-brief.cjs` | Accept the EPIC brief? | 4 |
| 4 | `story-drafter` | 2 or 3 | • EPIC register<br>• FRDs<br>• Design, if any | • Glossary<br>• BRD<br>• PRD | • Story list<br>• story shells<br>• Question log | `check-stories.cjs` | Approve the split? All stories together. | 5 |
| 5 | `story-groomer` | 4 | • Story list<br>• story shells | • FRDs<br>• Feature catalog<br>• BRD<br>• EPIC brief<br>• Glossary | • Stories, groomed<br>• Question log | `check-stories.cjs` | Accept the grooming? All stories together. | 6 |
| 6 | `ac-author` | 5 | Stories | • FRDs<br>• Glossary | • Stories, with acceptance criteria<br>• ready marks<br>• Question log | • `check-stories.cjs`<br>• `coverage-check.cjs` | Accept the criteria? This marks the stories ready. While a Must answer question raised in these stories is open, they can't be marked ready. | end of this run |

### Workflow 5: `change-request-workflow`

- **One run covers:** one request, or several brought together.
- **Starts when:** you call it: "change request: {your words}" or "new request: {your words}". A request can come:
  - from the client
  - from you
  - from a step that found a mistake in an approved document
  - from an answer to an open question, arriving after the documents that use it exist
  - from the Feature catalog's gate, when you pick "a new requirement first" for an action or a move. Only step 1 runs at that gate. The rest of the change runs after it.
- **Ends with:** your yes at "Make these updates?", your correction, or "I don't know yet". Before your yes, no document changes.
- **Next:** after your yes, `change-orchestration-workflow` starts by itself.

| Step | Done by | Reads | Writes | Next step |
|---|---|---|---|---|
| 1. Change request | the workflow | your words and your files | sections 1 to 4 of a new Change impact report | 2 |
| 2. Disposition | `change-request-disposition`, then `adversarial-check` inside it | • the report, sections 1 to 4<br>• the Glossary<br>• the FRDs | sections 5 and 7 to 11 | • blocked: 5, where its question comes first<br>• otherwise: 3 |
| 3. Impact | `change-impact-author` | • the report<br>• the PRD, the features, the EPICs, the FRDs<br>• the things file and the data model files<br>• the Traceability map | • section 6: where it lands<br>• section 12, by `find-linked.cjs`: everything linked to it<br>• section 14, by `size-rules.cjs`: how big, as a hint | 4 |
| 4. Affect | `feature-impact`, once for each thing in section 12 | the report, and that thing | section 13: no change, update, new story or split, with the exact edits | 5 |
| 5. Acknowledge | the workflow: `recommend.cjs`, `check-change-report.cjs`, then your one yes | the report | • section 15: the updates, in order, from the step each one enters at<br>• section 16: your decision | • yes: `change-orchestration-workflow`<br>• a correction: back to 2<br>• I don't know yet: end |

### Workflow 6: `change-orchestration-workflow`

- **One run covers:** one change, with every request in it.
- **Starts when:** you say yes at step 5 of `change-request-workflow`, or you ask to go on with a change that stopped.
- **Ends with:** the change closed, and one summary of every update.
- **Next:** whatever you were doing before the change.
- **Your yes covers every update.** No update asks "accept?" again. A skill stops only for the reasons `decision-review-gates.md`, rule 12, gives.

| Step | Done by | What it does | Next step |
|---|---|---|---|
| 1. The next update | `next-change-step.cjs` | reads the to-do list and section 15, and names the next workflow, its step and its items, or says every update is made | • an update: 2<br>• every update made: 4 |
| 2. Make it | the workflow it names, from that step, in change mode | changes only the items named, runs its check, and saves the new version with `accept.cjs`, which ticks the row | • saved: 1<br>• it stops for you: 3 |
| 3. A question only you can answer | the workflow | asks it, as multiple choice, with the recommended answer first and "I don't know yet" | 2 |
| 4. Close | `close-change.cjs`, then `change-summary.cjs` | closes the change, and shows one summary | end |

**Afterwards, automatically:** `accept.cjs` runs `track-change.cjs` at every acceptance, which ticks the change's to-do list. When the last row is ticked, `close-change.cjs` writes the closing entry.

**The kinds of change, and the path each one names:**
- **Net new:**
  - `brd-author`, only if the change is outside the BRD's scope
  - `prd-author`
  - `glossary-author`, for the new words
  - `things-author`, only if there are new words or renamed ones
  - `data-model-author`, for the new part
  - `feature-author`
  - `epic-grouping-author`, placing one feature
  - `frd-author`
  - `story-drafter`, `story-groomer`, then `ac-author`
- **Extend/enhance:**
  - `glossary-disposition`, only when the change renames an agreed word
  - `brd-author`, only if the BRD holds the changed thing
  - `prd-author`
  - `glossary-author`, only if there are new words
  - `things-author`, only if there are new words or renamed ones
  - `data-model-author`, for the new part
  - `feature-author`
  - `frd-author`
  - `story-groomer`, then `ac-author`
  - `story-drafter` too, only if a story is added
- **Update/optimize:**
  - `glossary-disposition`, only when the change renames an agreed word
  - `brd-author`, only if the BRD holds the changed thing
  - `prd-author`, only if the PRD holds the changed thing
  - `things-author`, only if there are new words or renamed ones
  - `data-model-author`, only if a data model row changes, a data model file uses a renamed word, or a row waits on the change
  - `frd-author`
  - `story-groomer`, then `ac-author`
- **Already covered:** nothing to run.

The two data model steps are `data-model-workflow`'s steps 1 and 2. They run only when the project has a data model. A row waits on the change when a cell holds a Proposed answer to a question this change answers. `recommend.cjs` follows these paths exactly.

**A small update is inserted, not re-run.** You decided this on 2026-10-21. When a change only fills or rewrites text in place, a program writes it where the documents point to it, and no workflow runs again:
- a late answer whose question has Low impact, or that confirms the answer already in use: `insert-answer.cjs` writes it wherever the documents name its question, such as "TBD, question 7", the data model files included
- a change that only rewords a requirement: `copy-wording.cjs` copies the new wording to every place that quotes it. Old vs New, row 38, records this.

Every document that exists counts, drafted or accepted: we can't say which is a draft and which is final, so each is taken as the latest version. An accepted document that is changed gets a new version through `accept.cjs`.

Either way, the recommendation shows what each document would change, and you choose at its gate: insert it, or run the path for its kind.

**A dramatic change is flagged.** You decided this on 2026-10-22. When a change reaches more than half of the BRD's business requirements, the recommendation says so, and offers a re-run of the whole workflow, from `requirements-workflow` step 1, as one of your choices. You still decide. "More than half" is a starting point, and can be changed.

---

## 5. Build phases

Each phase builds the items listed and tests each program on test data. Phase 1's gate was held with you on 2026-10-21. From Phase 2 on, nothing runs on your requirement until every phase is built: then the whole flow runs once, as a trial, and the last column lists the gates you hold in it (your decision of 2026-10-22).

| Phase | Builds, by spec item | Tested while building | Gate with you |
|---|---|---|---|
| 1. Foundation | • NET-NEW 1 to 13, 45, 46, 48, 49 and 50<br>• OPTIMIZE 1 to 11<br>• EXTEND 1 and 2 | the programs on the MCP test slice: an acceptance saves a copy, rebuilds the map, and `status.cjs` reports it; `grade-questions.cjs` places and checks the questions | the conventions, the gate, the templates and the Question log |
| 2. Requirements | • EXTEND 4, first, because discovery-author needs it<br>• NET-NEW 14 to 17, 47 and 55<br>• OPTIMIZE 12 to 14 | each program on the Expense claims worked examples, since the MCP test slice has no Discovery brief or BRD, and `list-sources.cjs` on a planted folder of several hundred files | in the trial: the Discovery brief, BRD and PRD of your requirement, and the questions they raise |
| 3. Glossary package | • NET-NEW 18, 19, 51 and 52<br>• OPTIMIZE 15 to 17<br>• REUSE 1 and 2 | each program on test data | in the trial: Gate 1 and Gate 2 |
| 4. Features and EPICs | • NET-NEW 20 to 24<br>• OPTIMIZE 18 to 20 | each program on test data | in the trial: the Feature catalog; the pick, with clashes and the EPIC brief list |
| 5. FRD | • NET-NEW 25 and 26<br>• OPTIMIZE 21 and 22 | each program on test data | in the trial: each FRD |
| 6. Stories | • NET-NEW 27 to 32<br>• OPTIMIZE 23 to 25 | each program on test data | in the trial: the split, the grooming and the criteria. This is where the core bet is tested: stories as assembly. |
| 7. Requirement-update | • NET-NEW 33 to 43, 53 and 54<br>• EXTEND 3<br>• REUSE 3 | each program on test data | in the trial: a change to an existing rule, and a net-new change with new words; the recommendation, and the re-runs it names |
| 8. README and the full run | NET-NEW 44 | first, each skill run on the test data its spec names, in one pass; then the trial: your requirement, workflow by workflow, with `status.cjs` saying what's next | we measure, then decide what to optimize:<br>• gates<br>• time<br>• tokens<br>• story quality |

---

## 6. When a skill is done

A skill is built when its SKILL.md is written and its programs pass their tests. It is done when all of these hold:
- It runs on its own, without its workflow. Given only the project, it finds its inputs or asks for the missing one.
- Its SKILL.md has one gate and points to the shared conventions instead of repeating them.
- It runs probing-questions-author and `grade-questions.cjs` on its draft, and every gap names its question.
- Its check program passes before its gate.
- Its decision record is written at the gate.
- Acceptance runs `accept.cjs`.
- It has run in the trial for its step, its template filled in full, and you've passed its gate.
- `audit-skill`, used from where it is, finds nothing blocking.

---

## 7. Not carried over

| Piece | Why |
|---|---|
| • `.claude/skills/specifier/`, the old orchestrator<br>• `.claude/workflows/auto-spec.js`<br>• `.claude/workflows/blast-radius.js`<br>• `.claude/workflows/version-log.js`<br>• `.claude/tools/conformance-check.mjs`<br>• `.claude/tools/coverage-gate.mjs` | Workflows, programs and wiring are written fresh. |
| • `_shared/system-prompt.md`<br>• `_shared/standard-formats.md` | replaced by `conventions.md` and the templates |
| • `.claude/workflows/compliance-audit.js`<br>• `_shared/eval-runner.md`<br>• `_shared/rubrics/`<br>• `.claude/skills/artifact-eval/` | evals; still to decide |
| `.claude/skills/audit-skill/` | used from where it is, to review each new skill |
| • the glossary sweep<br>• its two briefs | not needed for the build |

---

## 8. Still to decide

Decided so far:
- **Phase 1 gate** (2026-10-19), three answers, all A:
  - every check program prints the summary you read first at a gate, and every document with a gate ends with a Check record
  - "park it" is offered only at an FRD's gate and at an EPIC's gates
  - at every gate you see where the draft goes beyond the client's words, and after you accept you get that list for the client
- **The third "no"** (2026-10-19). After the third "no" at the same gate, the skill offers to park the piece, accept it as it is, or run one more round. "Park it" is offered only at an FRD's gate and at an EPIC's gates (your answer A at the Phase 1 gate, 2026-10-19). See EXTEND item 2.
- **The PRD's business-rules and data sections** (2026-10-19). Both are dropped: client-stated rules stay in the requirements word for word, decided rules live in the FRDs, data lives in the FRDs and the Glossary. See OPTIMIZE item 4.
- **The Glossary's Steps page** (2026-10-19). It stays, with its "In the flow" column, as the glossary method has it. The method is reused as it is, and change-impact-author draws a change's journey from it. See REUSE item 2.
- **The decision review gate** (2026-10-21). The point where you decide is a "decision review gate", or "gate" for short, never a "stop". `how-a-stop-works.md` became `decision-review-gates.md`. See EXTEND item 2.
- **Questions** (2026-10-21):
  - probing-questions-author drafts and rates every question (EXTEND item 4)
  - `grade-questions.cjs` places, orders and checks them (NET-NEW item 49)
  - one Question log holds them all (NET-NEW item 50)
  - every gap in a document names its question, such as "TBD, question 12", and the Open questions sections go
  - every author skill runs probing-questions-author and the grader inside itself, so the workflows gain no steps
- **Impact, severity and the three groups** (2026-10-21). Impact measures rework; severity measures harm. Any High severity question is Must answer. The grid lives only in the Question log template.
- **How a question is asked** (2026-10-21). The answers are the real choices, never yes or no. "I don't know yet" is always offered, and every question ends with the next best action. The only yes-or-no question left is a gate's own.
- **Checks and open questions** (2026-10-21). An open question never fails a check. A check fails on:
  - a gap that names no question
  - a question with no rating
  - a question missing one of its parts, such as the next best action
- **The Must answer guard** (2026-10-21). A Must answer question is answered before an FRD that builds on it is accepted, and before stories it was raised in are marked ready.
- **Proposed objectives and business requirements, and the re-run** (2026-10-21). When nothing gives an objective or business requirement, the skill suggests one, marked Proposed, and carries on. After a dramatic change, you re-run the whole workflow.
- **The Discovery brief's gate** (2026-10-21) is "Accept the Discovery brief?". "Blocking?" goes.
- **glossary-disposition in Workflow 5** (2026-10-21). It is step 4, only when the Check findings hold a mismatch, and it starts the Extend and Update paths when a change renames an agreed word. This follows your row 40 call: agree the word first. See OPTIMIZE item 16.
- **Glossary decisions are written once** (2026-10-21). The gate log is the only place a decision is written. Three answers:
  - the assembly draft stays as it was at Gate 1
  - Gate 2's "Also written as" is filled by `fill-also-written-as.cjs` (NET-NEW item 51)
  - the "Terms replaced or retired over time" tables are filled by `build-retired-words-tables.cjs` (NET-NEW item 52)
- **Late answers, and small updates** (2026-10-21, my proposal 2, which you accepted, then your rule):
  - an answer that arrives after the documents that use it exist comes in as a change, starting from what its question says it changes
  - a small update is inserted at the right place, and nothing is re-run: `insert-answer.cjs` for a late answer, `copy-wording.cjs` for new wording (NET-NEW items 53 and 54)
  - the Extend and Update paths include `brd-author` when the BRD holds the changed thing, and you choose the path at the recommendation's gate
  - every document that exists counts, drafted or accepted, as the latest version
- **The glossary method, with its word list** (2026-10-22). Phase 3 copies the glossary method as you approved it on 6 October: the word list, `method-words.md`, and the method's files reworded to use it. It was never applied, because your old files stay untouched, so it was saved in the kit's folder, and is now in `fixtures/approved-glossary-method/`. See REUSE items 1 and 2, OPTIMIZE items 15 to 17, and EXTEND item 3.
- **Only brd-author suggests missing objectives and business requirements** (2026-10-22, you confirmed a call made while applying the change set). The PRD keeps the client's words: a business requirement nothing covers becomes a question, never a suggested requirement.
- **The Workflows page is checked** (2026-10-22, my proposal 5, which you accepted). Before the page is republished, a script compares every step and gate on it with section 4, and lists any difference. It is a helper for building this plan, not part of the kit.
- **Earlier answers on a re-run** (2026-10-22, my proposal 4, which you accepted). On a re-run of the whole workflow, each question you answered before is asked again, keeping its number, with your earlier answer recommended and dated. See EXTEND item 4.
  - Reversed on 2026-11-03: a re-run starts the project again from nothing, and no earlier question is asked again.
- **A dramatic change is flagged** (2026-10-22, my proposal 3, which you accepted). When a change reaches more than half of the business requirements, the recommendation says so and offers a re-run of the whole workflow as one of your choices. You still decide. See NET-NEW item 38.
- **Waiting work goes last** (2026-10-21, my proposal 1, which you accepted). The routing programs put a capability or an EPIC waiting on an open Must answer question at the back of the queue, so you work on what you can finish first. It comes back once the question is answered. See NET-NEW items 25 and 27.
- **Build everything, then one trial** (2026-10-22). Every workflow is built end to end first. Then the whole flow runs once on your requirement, as a trial, and its gates are your review. Your files are not needed before that. While building, design choices are not put to you as questions: the option that loses nothing is taken, and listed below under "Calls made while building".
- **The source of truth** (2026-10-21). This plan and the specs are the source; the two pages are views of them.
- **The second Phase 1 review** (2026-10-21). All 31 Phase 1 items were reviewed again, one sitting at a time, and accepted:
  - one new call: at a gate, the grader's list shows each open question's severity and impact, so you see why it is in its group (NET-NEW item 49)
  - every other fix brought a file in line with a decision already made, such as gaps pointing to the Question log instead of the removed Open questions sections
  - a Phase 1 test now fails if an example's headings, or the lines in italics under them, differ from its template's

Calls made while building, for you to review before the trial:
- **Files whose names differ only by a date** (2026-10-22, NET-NEW item 47). `list-sources.cjs` never marks them as older versions. It names each set, and discovery-author reads them: if one replaces another, the earlier is marked "older version"; if they are a series, such as notes from different meetings, all are used. You see the call at the Discovery brief's gate. The spec said to mark the earlier date as an older version, which would drop all but the last of a series of meeting notes without anyone reading them.
- **One shared library for the check programs** (2026-10-22, NET-NEW item 55). The checks every document shares, and the summary printed at its gate, are written once in `lib/check-document.cjs`, so every check program prints the same three blocks the same way.
- **Test data for Phase 2** (2026-10-22, NET-NEW items 14 to 16). The MCP test slice has no Discovery brief or BRD, so the three check programs are tested on the Expense claims worked examples, with each failure planted on its own copy.
- **Skills are run on test data in one pass, before the trial** (2026-10-22). A skill is built once its instructions are written. The runs its spec names on test data, such as probing-questions-author on the MCP test slice, are done together at the start of Phase 8, so every skill is run on finished programs and finished neighbours.
- **A file proposed as out of scope waits for the gate** (2026-10-22, OPTIMIZE item 2 and NET-NEW item 14). Until the specifier decides, its row reads "No: out of scope, to be decided at the gate", and the check lets it through; once the brief is accepted, a row still waiting is a finding.
- **The workflow holds a copy of its steps** (2026-10-22, NET-NEW item 17). The kit can't point to this plan, so `requirements-workflow` holds a copy of the Workflow 1 table, and a test fails if the two differ.
- **The three checks test every rule their template states** (2026-10-22, NET-NEW items 14 to 16), not only those their specs listed. For example:
  - in the BRD, every objective, business requirement, risk and release criterion says where it came from, as conventions.md, "Cite every specific", requires
  - in the Discovery brief, a topic's verdict fits its quotes, and a clash settled by rank is won by the highest kind of file in it
  - in the PRD, a business requirement nothing covers passes when it is a Gap that names its question, since an open question never fails a check

- **One glossary per project** (2026-10-22, REUSE item 2, settling the question kept for Phase 3). A project holds one glossary, in `Output/{project}/glossary/`, as the folder layout already has it. A source that produces several glossaries becomes several projects.
- **The Glossary's gates keep the method's own format** (2026-10-22, OPTIMIZE item 15, settling the question kept for Phase 3). Each gate opens with `grade-questions.cjs`'s list, which exists already, and each gate row is put in the shape every other decision takes. No new program prints a summary for them.
- **A gate-log Resolution a program can read** (2026-10-22, OPTIMIZE item 17 and NET-NEW items 19, 51 and 52). Each resolved row names the words it replaces, one per line, such as "basket: merged into Cart", so the programs that fill the register, the section decisions, "Also written as" and the retired-words tables read it without guessing.
- **The method keeps its own words for the skills** (2026-10-22, REUSE item 2). The method calls them harvest, check and disposition, and its word list now names each one's skill in this kit. The skills themselves use the kit's names.
- **The Feature Fit material** (2026-10-22, REUSE item 2). Its blank template moves into its own file, so it renders. Its two worked examples, about a made-up product called Acme, are copied as they are, because the approved set didn't hold them; Phase 7 decides whether they are rewritten for Expense claims.
- **Check findings are saved inside a change** (2026-10-22, REUSE item 1), so the next step can read them, as the folder layout already says. On its own, glossary-check still shows them in the conversation.
- **Two small changes to Phase 1 items** (2026-10-22). `lib/md-lint.cjs` passes an empty anchor and a mermaid hexagon in quotes, which hide nothing; and the test for the words "gate" and "blocking" skips the glossary method, whose words its own word list sets.
- **Phase 3 programs are tested on an Expense claims glossary** (2026-10-22, NET-NEW items 18, 19, 51 and 52), built in the tests, because the MCP test slice has no Glossary.

- **Expense claims test data for the later documents** (2026-10-22, Phase 4). `fixtures/expense-claims/` holds a Feature catalog, an EPIC grouping, an EPIC register and a small Glossary, built from the worked PRD, because the MCP test slice has no EPIC grouping or Glossary. Later phases add to it.
- **The register's check date** (2026-10-22, NET-NEW item 22). `check-register.cjs` writes the date on the register's "Copy checked on" line when the copy passes, as the register template says, and nothing else. Until then the line reads "not yet". epic-author runs `accept.cjs` on a pass.
- **The Phase 4 checks test every rule their template states** (2026-10-22, NET-NEW items 20 to 23). For example, the grouping check finds every clash from the catalog itself, and a tie in the sequencing goes to the EPIC earlier in the register.
- **The kept references fit the kit** (2026-10-22, OPTIMIZE items 18 to 20). Each keeps what its spec names. Pointers to the old shared rules now point to `conventions.md` and the templates, and a step the spec removes, such as approving the ID scheme, is gone from the kept text too.

- **The FRD check is tested on an Expense claims FRD** (2026-10-22, OPTIMIZE item 22). The MCP slice's FRD keeps the experiment's earlier shape, with no status line, an Open questions section and decisions asked at "Step 2", which the FRD template replaced, so it stays as it is, and `fixtures/expense-claims/frd/frd-claim-approval.md` is the test.
- **The FRD check prints the kit's three blocks** (2026-10-22, OPTIMIZE item 22), like every other check, with the list of what only a reader can check. The experiment's longer review messages are not carried over.
- **What an FRD rule adds beyond the client's words is listed at the gate** (2026-10-22). A rule whose source is proposed or decided is on the list for the client, as conventions.md, "Beyond the client's words", already says.

- **The story checks are tested on Expense claims** (2026-10-22, NET-NEW items 27 to 31). EPIC-002 Claim approval has a brief, a Story list and three ready Stories in `fixtures/expense-claims/`, because the MCP slice's Stories have no grooming or criteria yet.
- **Too many scenarios is a prompt, not a failure** (2026-10-22, NET-NEW item 30). Fewer than three scenarios fails the check; more than seven is shown at the gate as a reason to split, as the kept rule "split at 8 or more" says.
- **Kept examples stay as they are** (2026-10-22, OPTIMIZE items 23 to 25). The story references keep their examples about loans and orders, since they hold no client material. Only story-groomer's first example changes, into the kit's grooming shape, because the earlier one writes the flow and the rules itself. Replaced by the fixes before the trial, below: the audit found these examples steer stories wrong, and they are now about Expense claims.

- **A rule is linked to its feature** (2026-10-22, NET-NEW item 36). The Traceability map links each feature to its rules, read from the rule's ID, so a rule no "Done when" piece names, such as F-05.4, is still reached by a change.
- **A change reaches work in progress** (2026-10-22, NET-NEW item 36). find-linked.cjs follows the documents drafted since they were last accepted, as well as the map, which holds only accepted ones. Without that, the stories being written would be missed.
- **Section 13 uses feature-impact's own calls** (2026-10-22, REUSE item 3, NET-NEW items 37 and 38). Each judgement is No change, Update, New story or Split, as feature-impact gives them, in place of the template's "Changes, Stays or Needs a decision". A feature that moves says "moves to", then its new EPIC or FRD, which is how size-rules.cjs sees a move.
- **The recommendation names every step an item needs** (2026-10-22, NET-NEW item 38). When section 13 judges an item to change and the path for its kind leaves out the step that writes it, the step is added, and the recommendation says so. For example, change 001 changes F-05's "Done when", so feature-author is added to the Update path. A step of the path with nothing to do is left out, with why.
- **Section 15 ends with your choices** (2026-10-22, NET-NEW items 34 and 38). It lists the choices that apply, and the one recommended:
  - Run the path
  - Insert it
  - Copy the wording
  - Re-run the whole workflow
  - Close it
  - Correct the analysis

  The choice you make at the gate is what track-change.cjs follows until the change closes.
- **Shapes the programs read** (2026-10-22, NET-NEW items 33, 34 and 38). The template's placeholders now say how each is written:
  - a late answer: "Question 7 is answered: ..."
  - a reworded requirement: REQ-3.2 now reads: "..."
  - each rule the update test compared: one line, with its result
  - a word the Glossary doesn't have: "New word: ..."
  - adversarial-check's verdict: its own line under section 11
- **Section 6 names business requirements too** (2026-10-22, NET-NEW items 34 and 38), so whether brd-author runs is decided by a judgement, as for every other document. A Net new ask outside the BRD's scope names none.
- **A ready story is never changed** (2026-10-22, NET-NEW item 38). "Already marked ready" means ready in the latest accepted Story list. Such a story judged Update becomes a new story for the difference.
- **Several asks stay in one report** (2026-10-22, NET-NEW item 34), one ask per row, as the template has it, with one decision for the change. The spec said one report each.
- **A late answer is recorded first** (2026-10-22, NET-NEW items 34 and 53), as the report's Decision 1, so the Question log's "Decided in" names it, and an insert reads "per change 002, Decision 1".
- **The check compares sections 14 and 15 with the programs** (2026-10-22, NET-NEW item 39), so every rule of the path, the inserts and the re-run are checked in one comparison.
- **A change's progress, and its close** (2026-10-22, NET-NEW items 41 and 42). The progress is written when the change's report is accepted: one row for each document the choice sends work to, with its version at the start. insert-answer.cjs and copy-wording.cjs add the places they wrote. The closing entry goes in the first of those documents that has a Decision record, or in the report itself when nothing needed to change.
- **The gate log gets versions** (2026-10-22, NET-NEW item 41). glossary-author and glossary-disposition run accept.cjs on the gate log when they finish, so a change that sends work to the Glossary can close.
- **Only an FRD or an EPIC is parked** (2026-10-22, NET-NEW item 40). The Feature catalog and the EPIC grouping are redone by the path's own re-run.
- **compare-versions.cjs reads text files** (2026-10-22, NET-NEW item 35). A Word or PDF file is compared from a text copy you bring beside it.
- **feature-impact's verdict is shown as an example** (2026-10-22, REUSE item 3). Its code block of markdown becomes a real Expense claims example with a table of what each line holds, which the kit's rendering check needs. Its standalone file and "save early" note go: the kit has no place for that file, so on its own it shows the verdict in the conversation.
- **The Feature Fit examples stay about Acme** (2026-10-22, settling the question kept for Phase 7). change-impact-author uses only the method's sections 5 to 8 and 10. The update test has its own Expense claims examples.
- **Changes to items built earlier** (2026-10-22). Each brings an earlier item in line with Phase 7:
  - `traceability-map.cjs` and its template: the link from a feature to its rules
  - `accept.cjs`: it runs track-change.cjs, now built
  - `grade-questions.cjs`: it reads a change's section 16 as a Decision record, and shares its gap finder
  - the Change impact report template: the shapes above, the verdict line and the choices
  - this plan's Workflow 5 table: step 5 writes sections 5 to 16, not 4 to 16
- **Phase 7 is tested on Expense claims** (2026-10-22, Phase 7). Change 001, the finance limit going up to 1,000, is in `fixtures/expense-claims/changes/`. The tests build the other changes, and take the "Example" notes out of the copied examples, as a real project has none.

- **The README is named for the kit, not the build** (2026-10-22, NET-NEW item 44). It sits at the kit's top, titled "Specifier", and says nothing about how the kit was built. It covers the five workflows, each skill on its own, the gates, `status.cjs`, where documents land, raising a change, and what is in the folder.
- **The kit's tests leave projects alone** (2026-10-22). They check every markdown file in the kit, except what is in `Output/`, which holds projects, such as the pass over the test data.

- **No build history in what you open** (2026-10-22, after your review of the glossary method's notes). The kit's own files never mention spec items, build phases, approval dates or where a file was copied from:
  - the approved glossary method's notes were rewritten plainly
  - `fixtures/README.md` lost its "Copied from" column and its mentions of phases
  - the tests are named for what they test, such as `requirements.test.cjs`, in place of a phase number
  - the test that guards against build history now covers the README, the tests and the fixture notes, and bans spec items, build phases, approval dates and copied-from columns, with no folder left out
- **Section 2 decides where every file lives** (your decisions of 2026-10-22). I had created a folder for the approved glossary method on my own, then moved it without asking. Since then:
  - section 2 lists every file and folder in the kit's folder, and what happens to each when the build ends: it ships, is archived, or is discarded
  - a new place is put to you first, never taken as a call
  - a test fails when the folder holds anything section 2 doesn't list
  - projects live in `specifier_v3/Output/`, since the kit's skills load only when Claude Code is opened in the kit's folder
  - the cleanup at the end of the build is the one in section 2, "When the build ends"

- **The pass over the test data, cut short** (your decision of 2026-10-22). The pass ran the requirements workflow, the Glossary and the features and EPICs workflow on a real requirement file, with probing-questions-author and glossary-check on their own, and audit-skill on every skill. You stopped it there: the FRDs, the stories and the changes get their first run in your trial. Its record, every gate answer and every gap, is `skill-pass.md`.
- **Eleven fixes before the trial** (your decision of 2026-10-22): the audit's three blocking findings, and eight problems the pass showed would trip the trial. Each is listed in `skill-pass.md`, section 4, with the gaps it closes. Every other gap waits for your decision after the trial. Three of the fixes change shared code or rules:
  - `lib/md-tables.cjs` reads "-" or "*" as a bullet only when a space follows it, so bold text keeps its stars
  - `lib/scan-retired-words.cjs` skips the kit's own wording, so a client's Glossary that retires a word such as "source" never fails a check on the kit's text
  - conventions, "Beyond the client's words", lists every decision you take on a question, and keeps a TBD on the list for the client until its value arrives

Still open, to be settled while building by the rule above, and listed here once taken:
- **Any time:**
  - the workflow names in section 4
  - whether the BA and the PO split the decisions
  - auto-spec, the unattended run
  - the evals
  - who checks, at release, the transition requirements that need no build
