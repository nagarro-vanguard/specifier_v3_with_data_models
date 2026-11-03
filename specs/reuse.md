# Reuse as is: specs

**Frozen:** this file is a record of the design. It was last changed on 2026-10-27 and is not updated any more. What was actually built, and every change made after the design, is in [build-log.md](../build-log.md).

**What this doc is:** every item where an existing piece does the job exactly as needed, so it is copied unchanged.

**The allowed edits:** only these two, and each item lists them.
- file paths, updated to `project-folders.md`, because the run folders are new
- the names of skills and shared files it points to, because those were renamed

Any other edit would make the item Optimize.

**How to read it:** every item has the same 11 parts. Old files are copied into `specifier_v3/`; the originals are never touched.

**Status:** draft for your review, 2026-10-19. Updated 2026-10-21: glossary-disposition runs after glossary-check, and seven glossary method files moved to OPTIMIZE item 17.

## Summary

Every item in this doc, one row each, in spec order. Read across a row to see what it is, what it takes in and gives out, and where it sits in the flow. The full spec for each follows below.

| Item | What it is | Takes in | Gives out | In the flow | Your gate | Label, phase and spec |
|---|---|---|---|---|---|---|
| `glossary-check` | Reads a document brought in from outside and lists where its words don't match the Glossary. | • a document you brought<br>• Glossary, looked up | • Check findings | • step 3 of `requirement-update-workflow`<br>• comes before `glossary-disposition` when there is a mismatch<br>• otherwise comes before `change-impact-author` | none | Reuse<br>phase 3<br>[REUSE 1](reuse.md) |
| glossary method, the rest | The glossary method as you approved it, with its word list:<br>• the three lenses<br>• the run rules<br>• the templates<br>• the word list<br>• the Feature Fit method | • none | • the method | • read by the Glossary package skills | none | Reuse<br>phase 3<br>[REUSE 2](reuse.md) |
| `feature-impact` | Judges one linked item for a change: is it hit, how badly, and what exactly changes. Renamed from change-impact. | • the change<br>• one linked item | • one judgement, in the report | • called by `change-impact-author` once per linked item | none when called; its own when run alone | Reuse<br>phase 7<br>[REUSE 3](reuse.md) |

---

## Phase 3

### 1. `glossary-check`

1. **Label and kind:** Reuse as is. A skill, `.claude/skills/glossary-check/SKILL.md`.
2. **Its one job:** find where a document from outside has drifted from the Glossary, and list each finding with a recommended fix. (Row 41)
3. **What exists today:** `glossary_methodology/.skills/check/SKILL.md`, 37 lines, and the version you approved on 2026-10-06, reworded to the glossary word list, saved in `fixtures/approved-glossary-method/.skills/check/SKILL.md`. Phase 3 copies the approved version (your decision of 2026-10-22). The original:
   - "Reads", "Produces"
   - "Steps" 1 to 5: load the glossary, read the document skipping quoted passages, flag the four kinds of drift, fill the findings template, hand the findings on
   - "Must not", "Connects"
4. **Changes:**
   - **Keep:** everything.
   - **Path edits:**
     - "Output/glossary/" becomes the Glossary's folder in `project-folders.md`
     - the findings go to the change's folder, as Check findings
     - "Connects" names `glossary-disposition`, instead of disposition and the old `skill-orchestration.md`
     - the skill name becomes `glossary-check`
   - **Where it sits, 2026-10-21:** when its Check findings hold a mismatch, glossary-disposition runs next, as step 4 of `requirement-update-workflow` (OPTIMIZE 16). Nothing in the skill changes.
5. **Reads / looks up:**
   - reads the document from outside
   - looks up the Glossary
6. **Writes:** Check findings.
7. **Its gate:** none. It's read-only.
8. **Its check:** the findings follow the method's `templates/check-findings.md`.
9. **On its own:** invoked with the project and the document.
10. **Done when:** on the MCP test slice, a seeded retired word and a new product word are both found.
11. **Open points:** none.
12. **Built** 2026-10-22: copied from the approved version with the path and name edits. Inside the skill, the other skills go by their names in this kit, glossary-author and glossary-disposition. Inside a change, its findings are saved in the change's folder, so `output-formats.md` and the check findings template say so (a call made while building, listed in MASTER-PLAN section 8).

### 2. The glossary method files, as you approved them

1. **Label and kind:** Reuse as is. Shared method files, copied to `.claude/skills/_shared/glossary/`.
2. **Its one job:** hold the glossary method that `glossary-author`, `glossary-check` and `glossary-disposition` follow.
3. **What exists today:** the versions you approved on 2026-10-06, reworded to the glossary word list and saved in `fixtures/approved-glossary-method/`, of these files in `glossary_methodology/.skills/_shared/glossary/`. Phase 3 copies the approved versions (your decision of 2026-10-22):
   - `lens1-ontology.md`, 213 lines
   - `lens2-topology.md`, 141 lines
   - `lens3-choreography.md`, 120 lines
   - `otc-methodology.md`, 114 lines
   - `otc-run-rules.md`, 104 lines
   - and these 5 templates:
     - `README.md`
     - `change-ripple.md`
     - `check-findings.md`
     - `section-glossary.md`
     - `terms-and-relationships.md`
4. **Changes:**
   - **Keep:** every file above, word for word, as you approved it on 2026-10-06.
   - **Also copied, from the approved set:**
     - `method-words.md`, the word list: one word for each meaning, with the words not to use. Every glossary skill and prompt reads it, and the method's end-of-run search fails on a banned word.
     - `glossary-design.md`, the short overview of the method
     - the Feature Fit method, `glossary-methodology-prompts/feature-journey-analysis.md` and its README, which change-impact-author reads, copied to `.claude/skills/_shared/glossary/prompts/`
   - **Display edits:** each file is brought in line with the kit's markdown rules as it is copied, so `lib/md-lint.cjs` passes on it.
   - **Path edits:**
     - "Output/glossary/" becomes `Output/<project>/glossary/`, the Glossary's folder in `project-folders.md`, wherever it appears.
     - harvest's scaffolding step, step 3, names `scaffold-project.cjs`, which creates the folders, and keeps its announcement of the tree.
   - Handled elsewhere:
     - `output-formats.md`, `templates/decision-register.md` and `templates/section-decisions.md` are in OPTIMIZE item 17
     - moved to OPTIMIZE item 17 on 2026-10-21, because each glossary decision is now written once, in the gate log, and these files change to say so:
       - `glossary-assembly-principles.md`
       - `templates/gate-log.md`
       - `templates/glossary-assembly-draft.md`
       - `templates/object-terms.md`
       - `templates/role-terms.md`
       - `templates/step-terms.md`
       - `templates/states-and-values.md`
     - the two sweep briefs aren't copied
5. **Reads / looks up:** nothing.
6. **Writes:** nothing.
7. **Its gate:** none.
8. **Its check:** a file comparison shows each copy differs from its original only in paths.
9. **On its own:** read by the Glossary package skills.
10. **Done when:** `glossary-author` runs on the MCP test slice using only these copies.
11. **Open points:**
    - The Glossary keeps its Steps page with its "In the flow" column, so every file here stays as it is (your decision of 2026-10-19: "b").
    - To settle before Phase 3: the method allows several glossaries from one source, each in `Output/<glossary>/glossary/`. Inside a project that becomes either one glossary per project, or `Output/<project>/<glossary>/glossary/`.
12. **Built** 2026-10-22: copied from `fixtures/approved-glossary-method/` with only the display and path fixes in `tools/tests/helpers/method-copy.cjs`, and a Phase 3 test proves each copy. The open point is settled: one glossary per project. Beyond the spec, each a call made while building, listed in MASTER-PLAN section 8:
    - `method-words.md`: its entries for Harvest, Check and Disposition name the skills in this kit, so the method keeps its own words and every reference still resolves
    - `glossary-design.md`: names the three skills and the workflows instead of the orchestration page, which isn't carried over
    - the Feature Fit blank template moves out of a code block into `templates/feature-fit.md`, so it renders
    - the two Feature Fit examples are copied from `glossary_methodology/` as they are, with display fixes only, because the approved set didn't hold them and the prompt points to them. They are about a made-up product called Acme, not Expense claims: Phase 7, which uses them, decides whether they are rewritten.
    - `lib/md-lint.cjs` (NET-NEW item 46) now passes an empty anchor, such as the one on every term and gate row, and a mermaid hexagon in quotes

---

## Phase 7

### 3. `feature-impact`

1. **Label and kind:** Reuse as is. A skill, `.claude/skills/feature-impact/SKILL.md`. Renamed from `change-impact`, so the name says it judges one item, not the whole change.
2. **Its one job:** judge whether one linked item is hit by a change, how badly, and what to do: no change, update, split or new story.
3. **What exists today:** `.claude/skills/change-impact/SKILL.md`, 84 lines:
   - "Load first", "Inputs"
   - "Method":
     1. confirm the link
     2. classify the impact as None, Cosmetic, Substantive or Breaking
     3. recommend the call
     4. note the ripple
   - "Verdict (output)", "Rules"
4. **Changes:**
   - **Keep:** everything.
   - **Path and name edits:**
     - the skill name becomes `feature-impact`
     - "Load first" points to `_shared/conventions.md` instead of the old system prompt
   - Its "HUMAN ACTION REQUIRED" line stays. When `change-impact-author` calls it, the line is collected into the report, not asked; your decision is at `change-impact-author`'s gate.
5. **Reads / looks up:**
   - reads the change, and one linked item
   - looks up its link in the Traceability map
6. **Writes:** one verdict, which `change-impact-author` writes into section 13 of the report.
7. **Its gate:** none, when called by `change-impact-author`. When run on its own, its "HUMAN ACTION REQUIRED" line asks you about that one item.
8. **Its check:** the verdict has every field of its "Verdict (output)" block.
9. **On its own:** invoked with a change and one item.
10. **Done when:** on MCP, F-15 is judged "update" for the phone-number change.
11. **Open points:** none.
12. **Built** 2026-10-22, from `.claude/skills/change-impact/SKILL.md`, with its name, its pointers and its place in change-impact-author changed. Its verdict was markdown shown inside a code block, which the kit's rendering check doesn't allow, so it is a real Expense claims example with a table of what each line holds; its standalone file and its "save early" note go, as the kit has no place for that file (a call made while building, listed in MASTER-PLAN section 8). A Phase 7 test counts every line taken out and put in. Its runs on the test data come in the pass before the trial.
