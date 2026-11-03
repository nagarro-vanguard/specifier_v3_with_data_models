# EPIC generation — how to fill each section of an EPIC brief

How `epic-author`, in brief mode, fills each section of `../../_shared/templates/epic-brief.md`. The template holds the shape of every section. This file says how to derive each one, and what to do and not do.

## 1. Description

**Steps to derive:**
1. Identify the primary persona.
2. Write the **EPIC hypothesis**, `As a … I need … so that …`. It holds the outcome or value the EPIC delivers. The persona and the outcome are copied from the EPIC register.
3. Add a context paragraph of 1 or 2 sentences.

**DOs:**
- keep it user-centric
- cover all included features without becoming vague
- put the outcome or value in the hypothesis. It is NOT in the name.

**DON'Ts:**
- bundle unrelated capabilities
- include technical terms (`conventions.md`, "Business language")

## 2. Business value

**Steps to derive:**
1. Extract value statements from the sources, such as time saved, cost reduced, money protected or risk reduced.
2. Remove duplicates.
3. Present at most 5 lines, each tied to a feature or requirement.

**DOs:**
- quantify only when the sources provide numbers
- tie value to the problem

**DON'Ts:**
- use generic value, such as "better experience", without why or how
- invent numbers

## 3. Success or fitness criteria

> **Rule (`conventions.md`, "Nothing invented"):** NEVER invent numbers, baselines, targets or timeframes. If data is not in the sources, mark it TBD, with its question. Classify every measure with a confidence tag: CONFIRMED, TENTATIVE or AI-RECOMMENDED. State how each is measured.

**Steps to derive:**
1. Write a one-line **benefit hypothesis**: what becomes true, and how you'll know.
2. Extract any evidenced measures from the sources.
3. Where none exist, state so. Mark every measure **AI-RECOMMENDED**, with a TBD baseline and target.
4. Fill the Metrics Confidence Summary above the table.

**DOs:**
- keep measures outcome-based
- label unknowns TBD with their question
- tag every measure's confidence
- put every AI-RECOMMENDED measure to the specifier at the gate

**DON'Ts:**
- invent baselines or targets
- mark an AI-suggested measure as CONFIRMED or TENTATIVE

## 4. Scope

*Source: the In items come from the EPIC's features. The Out items come from the EPIC grouping: they are the features other EPICs own. Cite every item.*

**DOs:**
- write concrete items: capabilities, not adjectives
- be explicit about exclusions
- cite the source for every item

**DON'Ts:**
- say "everything else"
- add scope the sources don't support

## 5. Features

*Source: the feature list and descriptions from the EPIC register and the Feature catalog. Write one row per feature, and drop none. Keep the feature ID in its own column, separate from the name.*

**DOs:**
- keep descriptions user-visible
- list every feature in the EPIC, one row each

**DON'Ts:**
- rewrite the PRD
- add acceptance criteria. They belong to the stories.

## 6. Dependencies

*Source: the EPIC register's "Depends on", and the EPIC grouping's inter-EPIC dependencies. Dependencies are never invented. Use plain business language.*

**Steps to derive:**
1. Take the dependencies.
2. Remove duplicates.
3. Where details are missing, mark TBD with its question.
4. Split them into "EPICs this one needs" and "EPICs that need this one".

**DOs:**
- describe what the dependency blocks or enables
- name the owning team or system where known

**DON'Ts:**
- invent owners, dates or statuses
- add risks in this section, or ways to reduce them

## 7. NFRs that apply

List only the IDs of the PRD's NFRs that apply to this EPIC, such as NFR-1. Their wording is kept only in the PRD (`conventions.md`, "NFRs"). Never copy it into the brief, and never write an NFR of your own. An EPIC that needs an NFR the PRD hasn't got raises a question, so the PRD can be updated through a change.

## 8. References

*Source: the documents this EPIC is built from, as links. A document that doesn't exist yet is written Does not exist.*

## Rules for every section

- **Features are a table**, one row per feature. Never write a prose block per feature.
- **No acceptance criteria and no story mapping in an EPIC.** Criteria and stories belong to the stories. The feature list already keeps the traceability.
- **Never invent** measures, baselines or targets. Tag every measure's confidence. A generated measure is AI-RECOMMENDED, so the reader knows which parts are not copies.
- **Every tracker work item ID is TBD.** Never invent one.
- **Readability:** one idea per sentence, active voice, no stacked clauses.
