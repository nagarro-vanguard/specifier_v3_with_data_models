# Skill pass

> **What this is:** The record of the pass over the test data, before the trial: every skill run once, as a new specifier would run it from the README, with every gate answered by the option the skill recommends, and every place the kit fell short.
>
> **What it is not:** Your decisions. Every answer here was taken by the pass, on test data. Your own decisions come in the trial. Nothing in the kit was changed during the pass: each gap waits for your decision.
>
> **Who uses it:** You, to see how the skills behaved, and to decide which gaps are fixed before the trial.

## 1. Where the pass stands

Each stage is run by a fresh agent that knows only the kit's files. Before the pass, every kit file was fingerprinted; after each stage the fingerprints are compared, so a run that changed the kit would be caught.

| Stage | What runs | On | State | Kit unchanged |
|---|---|---|---|---|
| 1 | requirements-workflow: Discovery brief, BRD, PRD | the full requirement file, in `Output/control-plane/` | done: all three accepted, 13 questions answered | yes, 197 files |
| 2 | glossary-author: Gate 1 and Gate 2 | the same project | done: 59 terms, 97 decisions, accepted | yes: skills and programs unchanged |
| 3 | features-and-epics-workflow | the same project | done: 65 features, 11 EPICs, all accepted | yes: skills and programs unchanged |
| 4 | frd-workflow, twice | the Setup section's two capabilities | skipped, as you decided: its first run is in your trial | |
| 5 | stories-workflow | the EPIC that holds the Setup features | skipped, as you decided | |
| 6 | requirement-update-workflow, six changes | the same project | skipped, as you decided | |
| 7a | probing-questions-author, on its own | `Output/mcp-slice/` and `Output/expense-claims/` | done | yes, 197 files |
| 7b | glossary-check, on its own | a story with two planted mistakes, against the project's Glossary | done: both found, and two more | yes, 197 files |
| 7c | adversarial-check and feature-impact, on their own | the same project | skipped, as you decided: their first run is in your trial | |
| 8 | audit-skill, on all 22 skills, read-only | the kit | done: 3 blocking findings | yes, 197 files |

## 2. Gaps found

Each gap is a place where the kit fell short while a skill was followed to the letter. The run took the most literal reading and carried on. Kinds:
- **Skill:** a SKILL.md or its references
- **Shared:** conventions, gates, templates
- **Program:** a program in `tools/`
- **Example:** a worked example in `_shared/examples/`
- **Test data:** a fixture

| # | Stage | Kind | Where | What fell short | What the run did |
|---|---|---|---|---|---|
| 1 | 7a | Skill | probing-questions-author, steps 2 and 6 | Step 2 keeps only a gap that is material, one that would change the design or the scope. Step 6, the conventions and the grader require every labelled gap to name a question, material or not, such as "Owner: TBD". | raised a Low and Low question for it |
| 2 | 7a | Test data | the slice's EPIC register, line 18 | Its check date reads "TBD". The register template says "not yet" until the copy is checked, which is what the grader expects. | left it: 1 grader finding remains |
| 3 | 7a | Skill | probing-questions-author, "Writes" | It may change open questions only. An answered question worded "No ..." can't be reworded by it, though its spec says it should. | reworded question 4 in place, keeping its number; its answer no longer matches the FRD's Decision 5 word for word |
| 4 | 7a | Skill | probing-questions-author, step 6 | A gap found by walking the probe dimensions has no label in the document, so its question's number has nowhere to go without adding text, and the grader can't see it. | named the place in "Raised in" only |
| 5 | 7a | Skill | probing-questions-author, step 4 | On its own it may only write numbers into a document, so "Answer in use for now" can't be put in the document. | left the document's TBD |
| 6 | 7a | Example | the Expense claims PRD's Decision record | It cites "Question: 9", but the Question log ends at question 8. The grader skips Decision records, so nothing catches it. | numbered new questions from 10 |
| 7 | 7a | Example | the Expense claims example | The requirement files it cites aren't in the kit, while the conventions say a skill on its own stops when an input is missing. | read the cited files through the Discovery brief's quotes |
| 8 | 7a | Shared | conventions, "What each step reads" | It says only three skills read the requirement files; probing-questions-author says it reads the files a document cites. | followed the skill |
| 9 | 7a | Shared | conventions, "Running a skill on its own" | It says a skill stops when an input isn't accepted; probing-questions-author is written for drafted documents. | followed the skill |
| 10 | 7a | Skill | probing-questions-author, and the Question log's Check record | Run on its own, nothing pastes the grader's record into the log's Check record. The example log still shows a record from 2026-10-06. | left it |
| 11 | 7a | Program | grade-questions.cjs | It checks that each part of a question is there, not its shape: a recommendation's "because", a named person in the example, and who answers "I don't know yet". Several questions in the slice and the example miss these and pass. | left them |
| 12 | 7a | Test data | the slice's Question log, and `fixtures/README.md` | Questions 2 to 10 point to "open questions" sections that no longer exist. The fixtures README says the slice's FRD has no status line and an Open questions section; it has a status line and none. | fixed question 1's "Raised in" only |
| 13 | 7a | Skill | probing-questions-author | It never runs `scaffold-project.cjs`, which the conventions say every skill run on its own runs first. | ran it |
| 14 | 7a | Skill | probing-questions-author, step 2 | A clash between a document and a decision isn't among the gaps it looks for; the gates give tensions to the calling skill. | raised it as a question |
| 15 | 7a | Skill | probing-questions-author, step 2 | "Material" sets no level, so walking a PRD could raise every FRD standard question now, and two runs could give different sets of questions. | kept to the document's own level |
| 16 | 1 | Skill | discovery-author, step 2 | A file's owner, when unstated, is written "[Not specified in provided sources]", which must name a question, though it isn't material. Once answered, the cell never shows the answer, so the grader prints a standing note on every run. | raised a Low and Low question |
| 17 | 1 | Shared | the Discovery brief template | With one source file, no topic can be Agree or Differ, so a contradiction inside the file has no home. The order of authority must still be asked with two real answers, though there is one kind of document. | put the contradiction under Risks, and made up a second answer |
| 18 | 1 | Shared | the decision record template | It has no example of a Can move ahead entry: its heading isn't a question, and its answers mark none as recommended. After acceptance the check lists the entry without each question's answer. | wrote the entry as best it could |
| 19 | 1 | Shared | decision-review-gates.md | It doesn't say whether the gate's own question, such as "Accept the BRD?", gets a Decision record entry. | wrote none, as the examples do |
| 20 | 1 | Shared | decision-review-gates.md, rules 1 and 5 | They disagree on when the check's "For the file" block is pasted; pasting after accept.cjs edits a document already saved. | pasted it before accept.cjs |
| 21 | 1 | Shared | decision-review-gates.md, rule 5 | Its list of what to do after each answer leaves out updating the cells the decision settles. | updated them, as the examples do |
| 22 | 1 | Program | check-document.cjs, the list for the client | A recommended answer that narrows the client's words isn't listed, so the client is never told. The brief's Decision 1 reads "everyone sees everything" as "only the project's team", and the PRD's Decision 2 limits setup to the Admin, against "There is no access control"; the list said None. | nothing |
| 23 | 1 | Program | check-document.cjs, "What we still need from the client" | It lists open questions only, not the TBDs, nor answered questions whose answer is "ask the client". The PRD's four TBD NFRs were missing from it. | nothing |
| 24 | 1 | Program | check-document.cjs, "Where it goes beyond the client's words" | It shows one mark per table row, so a second Proposed cell in the same row is hidden until the first is settled. | nothing |
| 25 | 1 | Skill | brd-author, step 6, and its checklist | The checklist puts AI-RECOMMENDED KPIs to the specifier at the gate; the steps don't. Nothing says how to tag a KPI suggested by the AI and chosen at an earlier gate. | didn't ask again; kept AI-RECOMMENDED |
| 26 | 1 | Shared | the PRD template | It has no place for the client's own "Verify by" and "Priority + why" columns, so the client's priorities and checks never reach feature-author. | recorded the title and wording only |
| 27 | 1 | Shared | the PRD template | Statements the client didn't number, such as which surfaces collaboration is on, have no ID, so they aren't kept word for word. | carried some into the BRD's scope and the PRD's assumptions |
| 28 | 1 | Shared | conventions, IDs | The PRD ID rule reads two ways when the client numbers by section, as "1.1" does. traceability-map.cjs knows only IDs with a prefix. | used REQ-1.1, as the example does |
| 29 | 1 | Shared | the PRD template | It gives no form for "no transition requirements". | wrote "None." |
| 30 | 1 | Skill | prd-author, step 6 | "unless a question above already settled it" doesn't say whether earlier gates count. | read it as this gate only |
| 31 | 1 | Shared | conventions | No rule covers documents the client names that aren't among the sources: here, three base documents. | made it an assumption with a question |
| 32 | 1 | Shared | the BRD template | "Problem" needs measurable pain; the file describes pain with no figure. | classed it Problem, on the stated risk |
| 33 | 1 | Shared | the PRD template, roles table | A permission cell holds only Yes, No or TBD, with no place for the decision that set it. | wrote "No, per PRD, Decision 2" |
| 34 | 2 | Skill | glossary-author, step 1 | It tells a first build from a resumed one by the folders, but project setup creates `glossary/` and `deep-dives/`, so every first run reads as resumed, with nothing to resume. | started from the beginning |
| 35 | 2 | Shared | the glossary method, sections | It takes sections from "the source's own structure", one source. With a BRD and a PRD, nothing says which headings, at which level, or how to combine the two. | took the PRD's personas and its 12 requirement groups; read each BRD row in the section it cites |
| 36 | 2 | Shared | the gate log template | It has no status line, though `status.cjs` reads the Glossary's state from one; without it the Glossary would read "drafted" for ever. The glossary templates also lack the conventions' opening blocks. | added "Status: drafted", which `accept.cjs` then set |
| 37 | 2 | Shared | the decision record template and gate rule 5 | They say a glossary decision is recorded in the document's Decision record, "Asked at: Gate 1 or Gate 2"; the skill says the gate log is the only place, and the gate log has no Decision record or decider. | followed the skill |
| 38 | 2 | Skill | glossary-author | It has no gate question, such as "Accept the Glossary?", which gate rules 3 and 6 require. | each gate passed when no row was open |
| 39 | 2 | Skill | glossary-author, steps 7 and 8 | Step 8 runs `fill-also-written-as.cjs` before the Gate 2 rows exist, so it fills nothing; step 7 doesn't say where the definitions are written. | wrote the Gate 2 rows first, then ran the program again |
| 40 | 2 | Program | fill-also-written-as.cjs | It joins the words with line breaks but no bullets, against the method's own list rule. | left it |
| 41 | 2 | Program | build-glossary-records.cjs | The decision register it writes is damaged:<br>• a recommendation that starts in bold arrives as broken bold text<br>• links copied from the gate log point one folder too high: 124 broken links<br>• answers of several lines run into one | left the generated page as it was |
| 42 | 2 | Shared | the glossary method, G5 rule 4 | The "shared" takeaway needs the number of other families before the families exist. | dropped that clause in the drafts |
| 43 | 2 | Shared | two glossary templates | Their relationship tables leave out "re-checks", which the word list and G5 include. | added the row where used |
| 44 | 2 | Shared | the assembly draft template | It says the draft is updated after Gate 1; the skill and output formats say it is never changed. | didn't change it |
| 45 | 2 | Shared | the glossary method, G5 rule 1 | It places terms under parents they produce, but the tables come from topology only, so the final hierarchy differs from the joined one. | followed G5 |
| 46 | 2 | Shared | the glossary method, the drop list | Its closed list of reasons has none for an example in brackets or for a verb. | used "used once, obvious" and "a verb, not a noun" |
| 47 | 2 | Shared | the glossary method, merge labels | "Also written as" puts several words in brackets, which its own list rule forbids. | joined two words with "and" |
| 48 | 2 | Shared | conventions, "Plain characters and lists" | A one-sentence definition can't hold a list without joining it with commas. | kept to two examples per definition |
| 49 | 2 | Shared | the glossary method, G5 rule 5 | Its closed wording for a term not placed fits no value-set. | wrote "nowhere else" |
| 50 | 2 | Shared | the glossary method, anchors | A family named like a term, such as Evidence, gives a heading and a term the same anchor. | used other anchors on one page |
| 51 | 2 | Shared | the glossary method, families | It asks for "a small set" of families; the source has 13 groups, and nothing says how a term's home family is chosen. | put the rule into Gate 1, row G1-36 |
| 52 | 2 | Shared | the gate log template | Its Options column doesn't show "I don't know yet", which the skill says every row carries. | added it to every row |
| 53 | 2 | Program | build-glossary-records.cjs | It maps outcomes by word across the whole log, so a word whose meaning differs by section, such as Domain in Target, shows the wrong outcome in a section's decisions. | kept everyday uses out of the candidate tables |
| 54 | 2 | Program | check-frd.cjs | On an FRD in an older shape, one check says "could not run" with an internal error, instead of a finding. Found while checking the slice's FRD. | nothing |
| 55 | 7b | Skill | glossary-check, "Reads" | It reads the seven pages only, so it can't see a word harvest already dropped, which is recorded only in `deep-dives/`. It flagged "health" again, though harvest had dropped it. | kept to the seven pages |
| 56 | 7b | Shared | glossary-check and the method's word list | The skill flags a product word that passes the keep rule; the word list says one that "would pass the tests", which include a reach no single document can show. | used the skill's rule |
| 57 | 7b | Shared | the glossary method, the drop list | It doesn't settle whether a word for a place in the product, such as "workspace", is everyday noise. | flagged it, naming the doubt |
| 58 | 7b | Shared | the check findings template | One word can be two issues at once, such as a retired word that also gives two words for one meaning; the template takes one, and nothing says which wins. | wrote one, and named the other |
| 59 | 7b | Skill | glossary-check, step 2 | The kit's own document names clash with a client's product words: every story opens "Story — ...", and this product's Glossary defines Story as work in a plan. EPIC will clash the same way. Nothing says to skip the kit's own labels. | flagged it, with "change the glossary", the only action that fitted |
| 60 | 7b | Skill | glossary-check, the next best action | Whether a word with no entry needs the document fixed or the Glossary added to depends on the sources, which the skill doesn't read. | took "add the term" |
| 61 | 7b | Shared | the four issues glossary-check looks for | None covers a document that contradicts the Glossary's flow, such as a read that needs a key. | noted it only |
| 62 | 7b | Skill | glossary-check, step 5 | "Hand the findings to glossary-disposition" is unclear on its own, when the findings are only shown. | showed them and stopped |
| 63 | 7b | Shared | the check findings template | Its placeholders don't say whether a document is named by its file or its title, nor how to link one outside the project. | used the title, and the full path |
| 64 | 3 | Program | scan-retired-words.cjs | It flagged the kit's own words: the catalog template's column names, its lines in italics, and the check's own record. This project's Glossary retired "source", "section" and "note", so the catalog's check could never pass. | accepted with 31 findings, all the kit's own text |
| 65 | 3 | Program | scan-retired-words.cjs | It flagged the plural of an agreed term as a retired word, such as "goal sections" as "sections". | wrote singular forms, and renamed three features |
| 66 | 3 | Program | check-features.cjs | Its own Check record line, "open questions", is a retired word in this Glossary, so pasting the record adds a finding. | left it |
| 67 | 3 | Shared | conventions, "Cite every specific" and the list rule | The citation form "per {document} section {n}" uses a word this Glossary retired, and a "Done when" line, one sentence, can't avoid an inline list. | cited without "section"; kept the inline lists |
| 68 | 3 | Shared | the PRD template and feature-author | The client's own priorities never reach the catalog: the PRD holds no priorities, and feature-author can't read the requirement file. 24 of the 65 priorities were proposed by the run, marked for confirmation. | proposed them, with question 14 |
| 69 | 3 | Program | check-document.cjs, the list for the client | A priority or answer decided at the gate isn't listed for the client to confirm. Same root as gap 22. | nothing |
| 70 | 3 | Skill | feature-author | The client's requirement titles hold words this Glossary retired, while the catalog must quote them word for word. | put each title in quotes |
| 71 | 3 | Skill | feature-author | Nothing guides a feature's size or how many FRDs result: 87 requirements became 65 features and 24 FRDs. Nothing says which section numbers an FRD when a feature covers two. | used the feature's main section |
| 72 | 3 | Skill | epic-grouping-author | No rule says which EPICs get a brief, and "confirm the EPIC brief list" is a yes or no question, which the gate rules forbid. | proposed a rule, and asked "Which EPICs get a brief?" |
| 73 | 3 | Shared | the EPIC grouping template | The Clashes table gives no "None" form; the reference and the template disagree on "none" and "N/A"; Admin, a role, can't be an EPIC's persona. | wrote "None", "N/A", and SME |
| 74 | 3 | Shared | the EPIC grouping template | The proof of a "Depends on" has no column. | wrote it in Notes |
| 75 | 3 | Program | accept.cjs | It saves the Question log at every acceptance, even unchanged, which adds versions with no change. | nothing |

## 3. What each stage found

### Stage 1: requirements-workflow

All three documents were accepted at version 1, each check passing before its gate:

| Document | Lines | Check | Questions raised | Decisions at its gate |
|---|---|---|---|---|
| Discovery brief | 260 | 12 of 12 | 6, 2 of them Must answer | 6 |
| BRD | 188 | 10 of 10 | 3 | 1 |
| PRD | 393 | 12 of 12 | 4, 2 of them Must answer | 7 |

- **The PRD holds all 87 of the client's requirements, word for word,** each under the client's own 12 headings. This was checked by comparing every row with the requirement file, outside the run.
- **The BRD** has 3 objectives, 2 KPIs and 19 business requirements; the PRD covers all 19.
- **The Traceability map** holds 112 items and 100 links.
- **Every question is answered,** so `status.cjs` shows no Must answer question open, and names glossary-author next.

**Gates answered, each with the recommended option, as test data:**

| Document | Decision | Question | Answer taken |
|---|---|---|---|
| Discovery brief | 1 | Who can see a project: only the team named in its Setup, or everyone who can sign in? | Only the team named in the project's Setup |
| Discovery brief | 2 | Whose data-protection rules apply to the personal data the product holds? | A data-protection policy the client supplies |
| Discovery brief | 3 | Do we write the BRD and the PRD from the requirements file alone, or wait for the three base documents it names? | Write from the requirements file alone |
| Discovery brief | 4 | How will we know the product has worked? | Both: every claim traced to its evidence, and each modernization ending in a handed-off plan |
| Discovery brief | 5 | Can move ahead: questions 1 and 6 | Take all the recommended answers |
| Discovery brief | 6 | When two kinds of document disagree, which one wins? | The requirements document, the only kind used |
| BRD | 1 | Can move ahead: questions 7 to 9 | Take all the recommended answers |
| PRD | 1 | Who sets the scale, performance, security and delivery shape the product must meet? | The client, before the first FRD is accepted |
| PRD | 2 | Who may set up a project, its provider and its team? | Only a person holding the Admin role |
| PRD | 3 | Do modernizations already under way move onto the platform? | New modernizations only |
| PRD | 4 | Who may approve a target architecture view? | Anyone on the project's team |
| PRD | 5 | Keep NFR-5, personal data following the client's policy? | Keep it as written |
| PRD | 6 | Keep NFR-6, the provider key and repository accounts never shown in full? | Keep it as written |
| PRD | 7 | NFR-6 against the brief's Decision 1, "everyone on the team sees everything". Keep both, or revisit one? | Keep both |

**What a reviewer should look at:** two recommended answers narrow what the client wrote, "There is no access control - everyone sees everything": the brief's Decision 1 and the PRD's Decision 2. In a trial you would decide these yourself; the gap is that the list for the client didn't show them (gap 22).

### Stage 2: glossary-author

The Glossary was accepted through both gates, as version 1 of its gate log. `status.cjs` names features-and-epics-workflow next.

| Page | Terms |
|---|---|
| Object terms | 38 |
| Step terms | 14 |
| Role terms | 4 |
| States and values | 3 |
| Terms and relationships | 49 placed in the hierarchy, 10 not placed |
| Decision register | 97 decisions, written by its program |

- **13 sections:** the PRD's personas and its 12 requirement groups.
- **Every page renders.** The decision register has 124 broken links, written by its program (gap 41). It was left as written, since it is generated.

**Gate 1: 38 rows, each answered with the recommended option, as test data:**

| Rows | What they settled | Answer taken |
|---|---|---|
| G1-01 | step, role, evidence, finding and resolution are also the method's own words | kept as the product's words |
| G1-02 | Goal, Analysis, Target, Summary and Plan each name a step and its output | one step term each |
| G1-03 | Project, effort and engagement | Project |
| G1-04 | Source and repository | Repository |
| G1-05 | "the read": the whole reading, or one part | the whole |
| G1-06 | a section in Goal and in Summary | split into Goal section and Summary section |
| G1-07 to G1-17 | one word each for: comment, AI synthesis, C-level, SME, team member, AI provider, architecture view, journey, result, work gate, unknown | the first of each pair |
| G1-18 | Evidence: a step, or what a claim opens to | an object, not in the flow |
| G1-19 | "Domains and Journeys" on their own in Target | the target ones |
| G1-20 to G1-22 | goal, quick scan, deep read | the first of each pair |
| G1-23 | "approval" | renamed Architecture approval |
| G1-24 to G1-35 | 12 candidate terms | 11 kept; Surface dropped |
| G1-36 | the families | the 13 groups, in the source's order |
| G1-37 | Summary or Plan first | Summary, then Plan |
| G1-38 | what SME stands for | kept unexpanded |

**Gate 2: 59 definitions,** each approved as written: 38 objects, 14 steps, 4 roles and 3 states or values.

### Stage 3: features-and-epics-workflow

Every step was accepted or done, and `status.cjs` names frd-workflow next, for FRD-1a Sign-in.

| What | Count |
|---|---|
| Features, covering all 87 requirements | 65: 41 Must, 19 Should, 5 Could |
| "Done when" pieces | 124 |
| Capabilities, one FRD each | 24 |
| EPICs | 11, 7 of them with an EPIC brief |
| Grouping options | 2: by business capability, chosen; by delivery sequence |

- **The Setup section's five features** are in EPIC-003 Setup, fourth in the run order.
- **The Feature catalog's check stopped at 8 of 9, with 31 findings,** every one the kit's own wording flagged as a retired word (gap 64). Since fix 11 it passes 9 of 9, with no finding.

**Gates answered, each with the recommended option, as test data:**

| Document | Decision | Question | Answer taken |
|---|---|---|---|
| Feature catalog | 1 | Where do the priorities come from for the features no release criterion needs? | The ranks this catalog proposes |
| Feature catalog | 2 | When is the target agreed: once every architecture view is approved, or as soon as one is? | Once every architecture view is approved |
| Feature catalog | 3 | Can move ahead: question 15 | Take all the recommended answers |
| Feature catalog | 4 | Do Summary export and Plan export go in their own steps' FRDs, or the One-way export FRD? | Each in its own step's FRD |
| Feature catalog | 5 | Does Goal agreement go in the Goal capture FRD, or the Comments FRD? | The Goal capture FRD |
| Feature catalog | 6 | How is the "Done when" of Wave breakdown cut? | Three conditions, with status on its own |
| EPIC grouping | 1 | Which grouping of the features into EPICs do we take? | By business capability |
| EPIC grouping | 2 | Which EPICs get an EPIC brief? | The seven proposed |

### Stage 7b: glossary-check, on its own

Run on a short story with two mistakes planted in it, against the project's accepted Glossary, without being told what was planted. It found both, and two more:

| # | Found | Issue | Next best action |
|---|---|---|---|
| 1 | "Story — Start the read" | a term used against its definition: the kit's own story heading, while this product's Glossary defines Story as work in a plan | change the glossary |
| 2 | "the engagement", planted | a retired word in use: merged into Project at Gate 1 | fix the document |
| 3 | "the workspace", planted | a product word with no entry | add the term |
| 4 | "with its health" | a product word with no entry, though harvest had dropped it | add the term |

Finding 1 is the most useful thing it turned up: the kit's own document names, Story and EPIC, can clash with a client's product words (gap 59). Finding 4 shows the check can't see what harvest dropped (gap 55).

### Stage 7a: probing-questions-author, on its own

**On the slice:** grade-questions.cjs went from 10 findings to 1, the one in gap 2.
- 7 questions were added, numbers 11 to 17. Two are Must answer:
  - who can do the rest of Setup: any member, or only members who hold Admin
  - what members see of the account a repository is reached through
- 2 questions were reworded:
  - question 1, into its real choices
  - question 4, whose answer started with "No"

**On the Expense claims examples:** no findings before or after. 3 Must answer questions were added, and two of them show defects in the kit's own example:
- the BRD's release criterion 2, "No claim is paid without its line manager's approval", clashes with the Discovery brief's Decision 4, which lets the manager's own manager approve while the line manager is away
- the Discovery brief's year-end risk was dropped by the BRD without a question

The skill has no gate, so no decision was taken.

## 4. Fixed before your trial

You decided to stop the pass after stage 3, fix the 3 serious problems and any that would trip your trial, and leave the rest for after it. Each fix is a rule, a template line or a program change, and every test passes after it: 249 of 249.

| # | What was wrong | What changed | Closes |
|---|---|---|---|
| 1 | A late answer couldn't be recorded in a change | change-impact-author records the answer in the Question log itself, as the gate rules say, one line per place when it fills several | audit A1 |
| 2 | The challenge of a change could loop for ever | adversarial-check gives FAIL only for a finding that changes the kind, where it lands, or what blocks it; after a second FAIL in a row, its findings go to your gate, and the check says so | audit A2 |
| 3 | A change that adds a feature never closed | epic-grouping-author writes the placement, checks it, asks where the feature goes, then accepts the grouping | audit A3 |
| 4 | The Glossary never showed as accepted | the gate log template has a status line | gap 36 |
| 5 | Every first Glossary build read as a restart | glossary-author tells a new build from a resumed one by the gate log, not the folders | gap 34 |
| 6 | The decision register had 124 broken links | build-glossary-records.cjs fixes each copied link for the register's folder, keeps bold and lists; the shared table reader no longer reads a star in "**bold**" as a bullet | gap 41 |
| 7 | The list for the client missed what you decided | every decision on a question from the Question log is listed for the client, and every TBD still waiting for its value; the rule in conventions, "Beyond the client's words", says so too | gaps 22, 23 and 69 |
| 8 | Four skills had no rule for working inside a change | feature-author, story-drafter, story-groomer and ac-author each change only what the change names, and a story keeps its title | audit D |
| 9 | The story skills' examples were about loans, orders and invoices | every example is about Expense claims, in the Story template's own shapes, with the table of rules each scenario proves | audit F |
| 10 | The kit's own labels were flagged against a product's words | glossary-check skips a document's title and its template's headings | gap 59 |
| 11 | The checks flagged the kit's own wording as retired words | the retired-words scan skips every line of the document's template, the Decision and Check records, and the plural of a term used today | gaps 64, 65 and 66 |

Every other gap waits for your decision after the trial.

## 5. The audit

audit-skill was run on each of the 22 skills, from where it sits, read-only. It also checked that every program a skill names exists, takes the options the skill passes, and prints the lines the skill quotes. It didn't run the programs.

### Scores

| Skill | Score out of 5 | Blocking | Not blocking |
|---|---|---|---|
| requirements-workflow | 4.7 | 0 | 3 |
| probing-questions-author | 4.5 | 0 | 4 |
| discovery-author | 4.8 | 0 | 2 |
| brd-author | 4.7 | 0 | 2 |
| prd-author | 4.7 | 0 | 2 |
| glossary-author | 4.6 | 0 | 4 |
| glossary-check | 4.7 | 0 | 3 |
| glossary-disposition | 4.5 | 0 | 6 |
| features-and-epics-workflow | 5.0 | 0 | 1 |
| feature-author | 4.7 | 0 | 4 |
| epic-grouping-author | 4.4 | 1 | 4 |
| epic-author | 4.8 | 0 | 2 |
| frd-workflow | 5.0 | 0 | 1 |
| frd-author | 4.6 | 0 | 4 |
| stories-workflow | 4.7 | 0 | 3 |
| story-drafter | 4.6 | 0 | 5 |
| story-groomer | 4.6 | 0 | 7 |
| ac-author | 4.7 | 0 | 5 |
| requirement-update-workflow | 5.0 | 0 | 1 |
| change-impact-author | 4.5 | 1 | 4 |
| adversarial-check | 4.1 | 1 | 6 |
| feature-impact | 4.9 | 0 | 1 |

### Blocking, each checked against the files

| # | Skill | What's wrong | Fix it proposes |
|---|---|---|---|
| A1 | change-impact-author | A late answer can't be recorded. Step 1 has probing-questions-author move the question to Answered, but that skill "never asks a question itself, or records an answer". The question then never reaches Answered, and insert-answer.cjs stops, so "Insert it" breaks. | change-impact-author moves the question to Answered itself, as gate rule 5 says, then runs grade-questions.cjs |
| A2 | adversarial-check | Nothing says which findings make FAIL rather than PASS_WITH_FINDINGS, and a FAIL sends the report back with no limit. Since the check starts from "every reuse claim is an overclaim", two runs on the same report can split between reaching the gate and looping. | one rule for FAIL, such as a finding that changes the kind or the verdict, and a limit on redos, after which the specifier decides |
| A3 | epic-grouping-author | In a change, "Confirm the placement?" is asked before the placement is written, no check runs on it, and no acceptance is named. track-change.cjs waits for a new version of the EPIC grouping, so a Net new change never closes. | write the placement, run check-epic-grouping.cjs, ask, then run accept.cjs on the grouping |

### Not blocking, found in several skills

| # | What | Skills |
|---|---|---|
| B | Rules the template or the skill's own reference already holds are written again in the SKILL.md, though each skill says it never restates them | • brd-author<br>• prd-author<br>• discovery-author<br>• probing-questions-author<br>• feature-author<br>• epic-grouping-author<br>• epic-author<br>• frd-author<br>• story-drafter<br>• story-groomer<br>• ac-author |
| C | Only one example request in the description, so other ways of asking may not start the skill | • ac-author<br>• adversarial-check<br>• brd-author<br>• change-impact-author<br>• discovery-author<br>• epic-grouping-author<br>• feature-author<br>• frd-author<br>• glossary-author<br>• prd-author<br>• probing-questions-author<br>• stories-workflow<br>• story-drafter<br>• story-groomer |
| D | No "In a change" section, though recommend.cjs puts the skill on change paths, so a literal run redrafts everything. A re-split can rename stories, and a story's title is its ID. | • feature-author<br>• story-drafter<br>• story-groomer<br>• ac-author |
| E | The check record is pasted after accept.cjs saves the version, so the saved version lacks it | • frd-author<br>• change-impact-author |
| F | The story examples are about loans, orders and invoices, and use story codes such as "S4", though every example is to be about Expense claims and a story has no code | • story-drafter<br>• story-groomer<br>• ac-author |
| G | The gate names no acceptance command | • story-drafter<br>• story-groomer |
| H | Two "Next" lines at the end of a run: the skill's, then the workflow's | • requirements-workflow<br>• frd-workflow<br>• stories-workflow |
| I | The long glossary method files have no contents list | • glossary-author<br>• glossary-check<br>• glossary-disposition |
| J | Em dashes, arrows and lists joined with slashes | • glossary-author<br>• glossary-disposition |
| K | No file the skills read says to run from the kit's folder: the conventions' "Running a skill on its own" doesn't, and project-folders.md shows a placeholder for the tools folder's path | every skill |

### Not blocking, in one skill

- **requirements-workflow:** its description has no "Not for", so "write the BRD" could start the workflow instead of brd-author.
- **probing-questions-author:** step 1 points to `templates/question-log.md`, a path that doesn't exist from the skill's folder; and it never points to the worked Question log.
- **glossary-check:** it is called read-only, yet it saves the Check findings, with no Write tool; requirement-update-workflow also says it saves them.
- **glossary-disposition:**
  - "flag it for the author" doesn't say where the flag goes
  - one 120-word sentence in step 3
  - "I don't know yet" doesn't say the row resolves as accepted
- **features-and-epics-workflow:** a loop in the dependencies found at step 4 sends work back to an accepted grouping, which only a change may alter; the grouping check doesn't look for loops.
- **feature-author:** its reference names its rules FR-1 to FR-5, which read like requirement numbers.
- **epic-grouping-author:** its gate never asks "Accept the EPIC grouping?", so the rules on accepting and on a third "no" have nothing to count; and it has no worked example.
- **epic-author:** no worked example of a register row or a brief section.
- **frd-author:** its `references/conventions.md` has the same name as the shared `conventions.md`, so "the conventions" reads two ways.
- **story-groomer:** "ask and stop" goes against "Ask, don't assume", which says a skill never stalls; and its example's flow steps are a sentence, not the template's table.
- **ac-author:** its example scenarios leave out the "Scenario and Proves" table that coverage-check.cjs reads, and are numbered 3 and 4.
- **requirement-update-workflow:** it writes sections 1 and 2 of the report and saves the Check findings, while the other workflows write nothing.
- **change-impact-author:** its copy of the Feature Fit method keeps "default to a feature-fit folder beside the glossary", which could make a run write there.
- **adversarial-check:**
  - it is told to read a glossary page called "reconciliation", which doesn't exist
  - a lone "Step 1" heading, with no step 2
  - no example of a finding
  - some wording from the prompt it came from, such as "re-decompose the feature", doesn't fit a change
- **feature-impact:** it is allowed to write files, though it only shows or returns its verdict.

### What the audit couldn't judge

- **Which skills start in practice.** The session the audit ran in loaded the older skills from the folder above the kit, such as write-prd, and none of the kit's 22. Their descriptions overlap. So the trial must be opened in the kit's own folder, as the README says, or the older skills may start instead.
- **Whether each check catches what a skill leaves to it,** since the audit didn't run the programs. The 246 tests and the pass cover this.
- **Whether skills or programs should copy.** The kit says programs do every copying, yet in four places the skill copies and a program checks the copy:
  - epic-author's register
  - epic-grouping-author's feature inventory
  - frd-author's copied parts
  - requirement-update-workflow's section 1

  This is for you to decide.
