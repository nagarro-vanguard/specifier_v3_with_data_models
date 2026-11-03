# The data model in the kit: the plan

Status: Decisions settled on 2026-10-30; decisions 1 and 2 replaced the same day, when "Where each answer comes from" was removed. Nothing in `.claude/` or `tools/` has changed.

Next step: the trial in section 5, on continuum's Onboarding, following these edits by hand. Step 1 is at gate 3. The kit changes only after you accept the trial.

**Note, 2026-11-02.** This plan was built into the kit on 2026-11-02, through `data-model-stitching-plan.md`, and is not committed. The trial in section 5 was not run. The stitching plan's fresh trial, in its part 8, takes its place. Gate 3 is gone: data-model-author now has one gate, gate 2, which asks the decisions and then accepts the file. Part 4's open items moved to the stitching plan's part 10, "Left for later".

---

## 1. What changes, with an example

```
BRD, PRD, Glossary
  → data model: each thing's actions, rules and moves
  → Feature catalog: every action and move is given to one feature
  → FRD: every action, field and move its features own becomes a rule, citing the data model
  → stories and tests: unchanged, because ac-author already writes a test for every FRD rule
```

| Step | Today | After |
|---|---|---|
| Order | Glossary, then features | Glossary, then the data model, then features |
| Feature catalog | every requirement lands in a feature | also: every action and move in the data model lands in a feature |
| FRD rules | from the Done-when pieces, the requirement text, and decisions at the FRD's gate | also: one or more rules for every action, field and move its features own |
| FRD Data section | what each thing holds, written fresh | each thing's rules table, copied word for word from the data model |
| Standard questions | answered from the PRD, or asked | answered from the data model first |
| Stories and tests | a test for every FRD rule | no change |

**City library, end to end.** Take one action from `lending.md`:

1. **Data model.** Loan's Extend action says "Only while the loan is On loan."
2. **Feature catalog.** Section 5 gives Extend to F-02 Extend a loan.
3. **FRD.** F-02's FRD lists Extend in its new "Coverage — every data model answer has a rule" table, and writes the rule:
   `F-02.3 | not let a loan be extended unless it is On loan | data model — Loan, Extend`
4. **Test.** ac-author, unchanged, proves F-02.3: "Given an Overdue loan, when its member asks to extend it, then the extension is refused."

A field travels the same way. Once DM-1 is settled as "a book is on one loan at a time", Loan's book field says "Can two share it: no". Fields go with the feature that owns the thing's first action, Borrow, so F-01's FRD gets `not lend a book that is already on a loan | data model — Loan, book`, and ac-author tests it. Why it is "no" is in the decision register, under DM-1.

---

## 2. Decisions, settled first

### Decision 1: How does a rule taken from the data model name its source?

**Settled on 2026-10-30: A. Replaced the same day by C, when "Where each answer comes from" was removed: the decision register already says where each decision lands, and the FRD reads the PRD and the Glossary itself.**

Today an FRD rule cites one of four sources: a Done-when piece, `req`, `proposed` or `decided`.

| Option | What it means | Why, or why not |
|---|---|---|
| A. One new source, copied from a sources table | `data model — REQ-2.3`, `data model — DM-1` | Needed a sources table in every data model file, which mostly repeated the register, the PRD and the Glossary |
| B. Reuse today's sources | REQ answers become `req`, DM answers become `decided — see DM-n`, and the BRD and the Glossary each get a new source | Three changes instead of one, and `req` would mean two different things |
| **C. Name the data model's place (chosen)** | `data model — Loan, Extend`, `data model — Loan, book`: the thing, then its action, field or move | One new source, the same way the FRD names a Done-when piece. The reader opens the data model file to see the rule, and its register to see why. |

### Decision 2: Which feature owns each data model answer?

**Settled on 2026-10-30: A, fixed rules. Replaced the same day by the fixed rules below, which no longer need each answer's source.**

One thing, such as Loan, is used by several features. Each answer must be proved once, in one FRD, so it is tested once.

| Option | What it means | Why, or why not |
|---|---|---|
| **A. Fixed rules (chosen)** | **1.** An action or a move belongs to the feature the Feature catalog gives it. **2.** Every field, and what each state means, belongs to the feature that owns the thing's first action, the one that makes it. | Every answer has exactly one owner, worked out the same way every time. A rule about one action, such as "Only while the loan is On loan" on Extend, stays with that action. |
| B. Every FRD that uses the thing proves all of it | Loan's answers are proved in every FRD that touches Loan | The same rule is written and tested several times, and the copies can drift |
| C. feature-author gives every answer to a feature by hand | One catalog row for every action, field and move | A long table, and more judgement, so less repeatable |

### Decision 3: What does the FRD's Data section hold?

**Settled on 2026-10-30: A, each thing's rules table, copied word for word.**

| Option | What it means | Why, or why not |
|---|---|---|
| **A. Each thing's rules table, copied word for word, with a link to its data model file (chosen)** | Data lists every thing that has a row in the FRD's data model coverage table | The same rule the FRD already follows for requirements: copy, never reword. check-frd can compare the copy word for word. |
| B. Keep "Thing, Holds", and add a link | Data stays a short list, written fresh | The reader can't see the limits without opening another file, and the list can drift from the data model |

### Decision 4: What happens to a project with no data model?

**Settled on 2026-10-30: A, the data model is required.**

| Option | What it means | Why, or why not |
|---|---|---|
| **A. The data model is required (chosen)** | check-features and check-frd stop when the data model is missing, as they do for a missing Glossary. The Expense claims sample project gets its data model files. | One path, so every run is the same |
| B. The checks skip the data model when it is missing | Old projects pass as they are | Two ways to run, and an FRD could skip its data rules without anyone noticing |

---

## 3. The edits, file by file

These edits apply the answers settled above. Each edit quotes the kit's text as it is today. Paths start at `.claude/skills/` unless they start with `tools/`.

### 3.1 The order of the steps

**`glossary-author/SKILL.md`**, under "Connects"
- Today: "After it, `features-and-epics-workflow` runs, and from the Feature catalog on every document uses the glossary's words."
- New: "After it, `data-model-workflow` runs, then `features-and-epics-workflow`. From the data model on, every document uses the glossary's words."

**`features-and-epics-workflow/SKILL.md`**
1. Description. Today: "Use once the Glossary is written". New: "Use once the data model is accepted".
2. "Who uses it". Today: "A specifier, once the Glossary is written; and a change's paths, from a named step." New: "A specifier, once the data model is accepted; and a change's paths, from a named step."
3. "Starts when". Today: "the Glossary is written." New: "`data-model-workflow` has ended, and every data model file is accepted."
4. Step 1's row. "Previous step" today: "start: Glossary written". New: "start: data model accepted". "Looks up by ID" today: "• Glossary<br>• BRD". New: "• Glossary<br>• BRD<br>• data model files".

**`feature-author/SKILL.md`**, description. Today: "Use once the Glossary is written". New: "Use once the data model is accepted".

**`_shared/project-folders.md`**
1. The folder tree, under "- `glossary/`: the Glossary's seven files", add: "- `data-models/`: the data model: the things file, one file per family, and its decision register".
2. The folder table, after the `glossary/deep-dives/{section}/` row, add: "| `glossary/data-models/` | • the things file<br>• one data model file per family<br>• the data model's decision register | • things-author<br>• data-model-author | when the project is set up |".
3. The paths table and the JSON block (they must agree), add:
   - Data model folder: `glossary/data-models/`
   - Data model things file: `glossary/data-models/{product}-glossary-things.md`
   - A data model file: `glossary/data-models/{family}.md`
   - Data model decision register: `glossary/data-models/{product}-glossary-decision-register.md`
4. "createdAtSetup": add `"glossary/data-models/"`.

**`tools/lib/run-paths.cjs`**, line 31: add `'family'` to `VALUE_NAMES`, so the `{family}` path is allowed.

### 3.2 The Feature catalog

**`feature-author/SKILL.md`**
1. "What it reads and writes". Today: "- **Reads:** the accepted PRD." New: "- **Reads:** the accepted PRD, and the accepted data model files the things file names."
2. Step 1. Today: "If the PRD isn't accepted, or there is no Glossary, say so and stop." New: "If the PRD isn't accepted, there is no Glossary, or a data model file the things file names isn't accepted, say so and stop."
3. A new step after "### 5. Check coverage". The steps after it move down by one.

   > ### 6. Check every action and move has a feature
   >
   > In section 5 of the catalog, list every row of every Actions table and every Moves table in the data model files, in the files' order. Give each to the one feature whose requirements or Done when name it. For a row no feature names, ask two questions:
   > 1. **Does the PRD say it?** It does when one of its requirements names the action or the move.
   > 2. **Is it big enough to be a feature?** It is when it moves the thing to a state no other action reaches, when its Who is a role no other action of the thing has, or when the PRD gives it a priority of its own.
   >
   > | PRD says it? | Big enough? | Recommend |
   > |---|---|---|
   > | yes | no | Add a piece to the Done when of the feature that owns the thing's first action |
   > | yes | yes | A new feature |
   > | no | no | Give it to the feature that owns the thing's first action. Its FRD proves it from the data model, with no new piece. |
   > | no | yes | A new requirement first, through `requirement-update-workflow`, then a new feature |

4. The gate. After "- then the decisions about capabilities and pieces, …", add: "- then each action or move no feature named, with the recommendation step 6 gave it, one at a time".
5. "Rules", add: "- **Every action and move has a feature** (FR-6): each row of the data model's Actions and Moves tables lands in exactly one feature."

**`feature-author/references/feature-catalog.md`**
1. After FR-5, add: "### FR-6 — Every action and move lands in a feature. Section 5 has one row for each row of every Actions and Moves table in the data model files, in their order, each with one feature from the catalog. A row no feature names is settled at the gate, by the two questions in SKILL.md, step 6."
2. The checklist, under "Set level", add: "- [ ] **FR-6** Every action and move in the data model has one row in section 5, with a feature (checked by check-features.cjs)".

**`_shared/templates/feature-catalog.md`**
1. Lineage. Today: "**Previous step:** Glossary". New: "**Previous step:** data model". Under "Supporting sources", add: "[glossary/data-models/](../glossary/data-models/)".
2. A new section after "## 4. Coverage check":

   > ## 5. Data model coverage
   >
   > *Every action and every move in the data model files, one row each, in the files' order, and the one feature it belongs to. That feature's FRD turns it into rules.*
   >
   > | Data model file | Thing | Action or move | Feature |
   > |---|---|---|---|
   > | {data model file} | {thing} | {action or move} | {feature ID} |

3. Placeholders, add: "{data model file} · the family's data model file · lending.md", "{thing} · a thing, in the Glossary's word · Loan", "{action or move} · the action as its Actions table names it, or the move as From → To · Extend".

**`tools/check-features.cjs`**
1. Load the things file and every data model file it names. Stop with exit code 2 if one is missing (decision 4).
2. A new check, "Data model coverage": every Actions row and Moves row of every data model file has exactly one row in section 5, in the files' order, with the thing and the action or move word for word; every Feature is in the catalog; every data model file is accepted.
3. The header comment lists the new check.
4. The "Sections" check needs no change: it reads the template.

### 3.3 The FRD

**`frd-workflow/SKILL.md`**, step 2's row. "Looks up by ID" today: "• PRD<br>• Glossary". New: "• PRD<br>• Glossary<br>• data model files".

**`frd-author/SKILL.md`**
1. Description. Today: "each traced to a "Done when" piece, the requirement's own text, or the specifier's decision". New: "each traced to a "Done when" piece, the data model, the requirement's own text, or the specifier's decision".
2. "Words used in this skill", add two rows: "Data model file · one Glossary family's things: their actions, rules and moves · `glossary/data-models/{family}.md` · lending.md" and "Data model answer · one action, field or move of a thing in a data model file · the data model file · Loan, Extend".
3. "Invoke it with". Today: "It finds the Feature catalog, the PRD and the Glossary itself". New: "It finds the Feature catalog, the PRD, the Glossary and the data model files itself".
4. Step 1, the sources. After "from a "Done when" piece → `F-nn.dwN`", add: "from an action, field or move this FRD's features own → `data model — {Thing}, {action, field or move}`". Today: "from the requirement's own text, beyond the "Done when" → `req`". New: "from the requirement's own text, beyond the "Done when" and the data model → `req`".
5. Step 1, a new item after "Fill **Proved by**": "Fill the data model coverage table: every action, field and move this FRD's features own, and the rules that prove it. Copy into Data the rules table of each thing it names."
6. Step 1. Today: "each standard question is answered from the documents with its place". New: "each standard question is answered from the data model file first, then the documents, with its place".
7. Step 3. Today: "Rebuild the Actors, Gates, Flow and Data from the final rules, with notes where they changed." New: "Rebuild the Actors, Gates and Flow from the final rules, with notes where they changed. Data stays a copy of the data model. A decision that would change a data model answer is raised as a change to the data model file, through `data-model-author`; the FRD never differs from it."

**`frd-author/references/conventions.md`**
1. Section 1, IDs. Add a row: "`DM-n` · a data model decision · the data model's decision register". Today: "No `FR-`, `BR-`, `AC-`, `GI/GO`, or any other prefix." New: "No `FR-`, `BR-`, `AC-`, `GI/GO`, or any other prefix. `DM-` appears only in a note that names the data model decision a rule follows."
2. Section 1, rule order. After "1. Rules from Done-when pieces…", add: "2. Then `data model` rules, in the order of the data model coverage table." The `req` and `proposed` lines become 3 and 4.
3. Section 3, the Source list. After the `F-nn.dwN` line, add: "`data model — {Thing}, {action, field or move}` when it comes from an action, field or move this FRD's features own, named as the data model file names it."
4. Section 5, add three bullets:
   - "**Data** holds, for every thing in the data model coverage table, its rules table from its data model file, word for word, under a link to that file."
   - "**The data model coverage table** lists every action, field and move the covered features own, in the data model file's order, named as the file names them. An action or move belongs to the feature the catalog's section 5 gives it. Every field, and what each state means, belongs to the feature that owns the thing's first action."
   - "**Every row of the data model coverage table is proved by at least one rule.** While a decision on it is open, Proved by reads "waits on DM-n"."
5. Section 6. After "Never invent a limit, value, threshold, or rule.", add: "A data model answer is never a gap here: it is copied, not suggested."
6. Section 7. Today: "**First look for the answer in the documents.**" New: "**First look for the answer in the data model file, then in the documents.**" Add to the Answered by list: "`{family}.md, {Thing} {action or field} -> {rule IDs}`, the data model answers it. Example: `lending.md, Loan Remove -> F-05.2`" and "`{family}.md, {Thing} {action or field} -> {feature ID} {feature name}`, when the answer belongs to a feature in another FRD".
7. Section 9. Today: "Text copied word for word (requirements, catalog names, descriptions and Done-when lines)". New: "Text copied word for word (requirements, catalog names, descriptions, Done-when lines, and data model names and rules tables)".
8. Section 10. Today: "Use only the inputs: the capability, the Feature catalog, the PRD and the Glossary." New: "Use only the inputs: the capability, the Feature catalog, the PRD, the Glossary and the data model files."
9. Section 11. Today: "Then rebuild the Actors, Gates, Flow and Data from the final rules". New: "Then rebuild the Actors, Gates and Flow from the final rules".
10. Section 3, Notes. Today: "The note always reads `*Updated from the requirement on the basis of Decision n: {what changed, in a few words}.*`" New: add "For a data model decision, it reads `*Updated from the requirement on the basis of DM-n: {what changed, in a few words}.*`"

**`_shared/templates/frd.md`**
1. Lineage, "Supporting sources", add: "[glossary/data-models/](../glossary/data-models/)".
2. The Rules intro list. After the piece ID line, add: "*data model —, then the thing and its action, field or move, such as data model — Loan, Extend*".
3. Under "## Coverage — every Done-when piece has a rule", after "**From the requirement (not a Done-when):**", add: "**From the data model (not a Done-when):**" with its list.
4. A new section after it:

   > ## Coverage — every data model answer has a rule
   >
   > *Every action, field and move the features covered own, named as the data model file names them, and the rules that prove it. A row with no rule is an error, unless a decision on it is still open: then Proved by reads "waits on" and the decision, such as "waits on DM-5".*
   >
   > | Thing | Action, field or move | Proved by |
   > |---|---|---|
   > | {thing} | {action, field or move} | {rule ID} |

5. Data. Today: "*The things this capability holds, and what each one holds, in business words.*" and the "Thing, Holds" table. New: "*Each thing in the data model coverage table, with its rules table copied word for word from its data model file.*", then for each thing a "### {thing}" heading, "From [{family}.md](../glossary/data-models/{family}.md).", and the rules table: Field, Type, Required, Limits, Can two share it, Can change, Starts as.
6. Standard questions. Today: "The files are searched for the answer first." New: "The data model file is searched first, then the other files." The Answered by line adds the two data model forms from conventions section 7.
7. Placeholders, add City library rows for {action, field or move}, {family}, and the rules table's columns. Today's {thing} and {attribute} rows go, with the "Thing, Holds" table.
8. The Rules intro. Today: ""Updated from the requirement on the basis of Decision" and its number, then what changed." New: ""Updated from the requirement on the basis of Decision" and its number, or of a data model decision and its DM-n, then what changed."

**`tools/check-frd.cjs`**
1. `parseSource`: accept `data model — {Thing}, {action, field or move}` as its own kind.
2. Rule order: piece rules, then data model rules, then `req`, then `proposed` and `decided`.
3. New checks:
   - "Data model coverage lists exactly the actions, fields and moves the covered features own, named as the data model names them", working out each owner by the rule in conventions section 5
   - "Every data model row has a rule, or waits on its open decision"
   - "Every data model rule is in the coverage table, and names a thing and an action, field or move of a row it proves"
   - "From the data model lists exactly the data model rules"
   - "Data copies each thing's rules table word for word, under a link to its file"
4. The Standard questions check accepts the "-> {feature ID} {feature name}" form when that feature owns the answer and is outside this FRD.
5. "Only the allowed ID prefixes appear": allow `DM` in a note naming a data model decision only.
6. "No middle dots": add the copied data model names and rules tables to the word-for-word list.
7. Add to `NOT_CHECKED`: "each data model rule is a faithful reading of its action, field or move".
8. Stop with exit code 2 when a data model file is missing (decision 4).
9. A note may name DM-n as well as Decision n. A data model rule whose wording differs from its requirement because of a data model decision carries a note naming that DM.

**`tools/lib/check-document.cjs`**, line 147: add `on the basis of DM-\d+` to `BEYOND`, so a rule a data model decision changed shows in "For the person" as going beyond the client's words.

**A new `tools/lib/data-model.cjs`**: reads the things file and the data model files: each thing's Actions, rules table, Moves and status. check-features and check-frd both use it.

### 3.4 Moving the drafts into the kit

| From the root | To |
|---|---|
| `data-model-design.md` | `.claude/skills/_shared/data-model-design.md` |
| `data-model-template.md` | `.claude/skills/_shared/templates/data-model.md` |
| `data-model-things-template.md` | `.claude/skills/_shared/templates/data-model-things.md` |
| `data-model-decision-register-template.md` | `.claude/skills/_shared/templates/data-model-decision-register.md` |
| `things-author/`, `data-model-author/`, `data-model-workflow/` | `.claude/skills/`, under the same names |

Then:
- the paths inside the three skills change to the new places
- every `{project}` in a data model file name becomes `{product}`, the name the kit's paths use
- the "Not yet in the kit" section of `data-model-workflow/SKILL.md` is deleted
- `data-model-learnings.md` and this plan stay at the root, as working notes

### 3.5 Tests and the sample project

- `fixtures/expense-claims/glossary/data-models/`: a things file, one data model file per family, and the register (decision 4)
- `fixtures/expense-claims/frd/feature-catalog.md`: section 5
- `fixtures/expense-claims/frd/frd-claim-approval.md`: the data model coverage table, the data model rules, and the new Data
- `tools/tests/features-and-epics.test.cjs`: passes on the sample; fails on an action no feature has
- `tools/tests/frd.test.cjs`: passes on the sample; fails on a row with no rule, on a rule naming a thing or field its row doesn't have, and on Data that isn't word for word

### 3.6 What stays as it is, and why

| File | Why it needs no change |
|---|---|
| `ac-author` | It "only proves rules the FRDs already hold". Data model answers are now FRD rules, so they get tests with no change. |
| `tools/coverage-check.cjs` | It counts every rule under a feature's heading. Data model rules are under those headings. |
| `story-drafter`, `story-groomer` | They quote FRD rules and flow steps by ID. |
| `epic-grouping-author`, `epic-author`, `route-next-capability.cjs` | They work on features and EPICs, which keep their shape. |
| `glossary-disposition` | It already reads "a term-change request". `data-model-workflow` sends each Glossary change as one. |
| `requirement-update-workflow` | No change for this plan. See section 4, item 2. |

---

## 4. Left for later, and why

| # | What | Why later | When |
|---|---|---|---|
| 1 | A check program for the data model, `check-data-model.cjs`, for step 7's checks. With it, the data model files take the kit's opening blocks (What this is, Lineage) and get their status from `accept.cjs`, as every other document does. | The trial checks by hand. The program should follow the shape the trial settles. | After the trial, before the kit runs on a new product |
| 2 | A requirement change reaching the data model: `change-impact-author`, `find-linked.cjs` and the traceability map don't know the data model files yet | No change runs during the trial | Before the kit is used for changes; its own plan |
| 3 | The Glossary's lens 3 asks, for each step, what must exist first and who makes it (learnings 3.3) | It changes the Glossary step, not this one | Its own change |
| 4 | `frd.md`, `feature-catalog.md` and `frd-author` use the Expense claims example. The new rows use City library. | Changing every example is a separate clean-up | Its own change |
| 5 | Two files called a decision register sit under `glossary/`: the Glossary's own `decision-register.md`, and the data model's. Recommended: rename the data model's to `{product}-data-model-decisions.md`. | A name change touches every draft; best done in the move, 3.4 | Your call, before the move |

---

## 5. The trial on continuum's Onboarding

The trial follows this plan by hand. Nothing in `.claude/`, `tools/` or continuum's accepted FRDs changes. The new FRD, story and tests go in a root folder, `data-model-trial/`.

| Step | What | Where it goes | Needs you |
|---|---|---|---|
| 1 | A fresh start. things-author finds the things for the whole product; then data-model-author writes `onboarding.md`, with its Actions tables. The first run is kept in `_data_model_archive/continuum-run-1/`. | `Output/continuum/glossary/data-models/` | Gate 1, the product-wide decisions and the things; gate 2, Onboarding's decisions; gate 3, accept the file |
| 2 | Give every Onboarding action and move to a feature, F-01 to F-03. Apply the two questions to any no feature names. | `data-model-trial/feature-catalog-section-5.md` | The recommendation for each action no feature names |
| 3 | Write the FRD for the capability that holds F-02 Project as the one place, from today's FRD template with this plan's edits. | `data-model-trial/frd-onboarding.md` | Its gate |
| 4 | Groom the "Create a project" story and write its tests, following story-groomer and ac-author as they are today. | `data-model-trial/create-a-project.md` | Its gate |
| 5 | Run step 3 a second time, fresh, from the same files, and compare the two FRDs. | `data-model-trial/frd-onboarding-run-2.md` | – |

**Note, 2026-11-02.** Step 1 names gate 3, which is gone. Gate 2 now settles the decisions and accepts the file, in one gate.

The trial works when:
- every Onboarding action and move has a feature
- every action, field and move F-02 owns has a rule, and every rule names one source
- every rule has a test
- nothing is invented
- the two runs in step 5 give the same rules, with the same sources

---

## 6. Found while writing this plan

- **"Where each answer comes from" was added, then removed, on 2026-10-30.** It mostly repeated what the decision register, the PRD and the Glossary already hold. The FRD now names the data model's place instead (decision 1), and every field goes with the feature that owns the thing's first action (decision 2).
- **"one at a time" left the example's Borrow rules, and the design's rule that wrote it was dropped.** Nothing in the sources said it, so it was invented. When the sources name no way to add several at once, the FRD's question 4 does not apply.
- **A note for a data model decision.** REQ-1.2 says "a person starts a new one"; in run 2, DM-3 says an Admin sets up the project. The FRD's rule follows DM-3, so it differs from the requirement and needs a note, as the FRD's own decisions do. The note can name DM-n: conventions item 10, frd.md item 8, check-frd item 9 and check-document.
