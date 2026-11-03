---
name: change-impact-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the impact of one change in its Change impact report: where each ask
  lands, in the requirements, the features, the FRDs, the EPICs and the data
  model, then everything linked to it, through find-linked.ts, and how big the
  change is, as a hint for priority, through size-rules.ts. No gate: the
  specifier's yes comes at step 5 of change-request-workflow. Use when
  change-request-workflow reaches step 3, or on its own with a project and a
  change, for example "what does change 004 touch in city-library?". Not for
  the type of change (use change-request-disposition) or what changes in each
  linked item (use feature-impact).
---

# change-impact-author

> **What this is:** The skill that finds everything one change touches, and how big it is.
>
> **What it is not:** The type of change, which `change-request-disposition` works out first, or what changes in each linked item, which `feature-impact` says next. It changes no document but the Change impact report.
>
> **Who uses it:** `change-request-workflow`, at step 3. A specifier, on its own, with the project and the change.

- You write section 6, and run the programs that write sections 12 and 14. Nothing else.
- The size is a hint for priority. It pauses nothing.

## Words used in this skill

| Word | What it means | Where it comes from | Example |
|---|---|---|---|
| Ask | one thing a change asks for, in the Glossary's agreed words | section 5 | Ask 1 |
| Data model row | one action, field or move of a thing, as its data model file names it | the things file, `{product}-glossary-things.md`, and the data model file it names for the thing | Loan, Extend |
| Linked item | anything linked to where the change lands, through the Traceability map or a drafted document | section 12, by find-linked.ts | F-05.4 |
| Size | Small, Large or Not sized, against the work in progress. A hint for priority. | section 14, by size-rules.ts | Small |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `city-library` |
| the **change**, by its number, once sections 5 and 7 are written | `004` |

- It finds the report, the PRD, the FRDs, the Feature catalog, the EPIC register, the Glossary and the data model itself, through `tools/lib/run-paths.ts`.
- Use only these inputs. Never facts from chat or memory.

## Load first

- `../_shared/templates/change-impact-report.md`: the report's layout. **Fill it. Don't describe it again in this skill.**
- `../_shared/conventions.md` and `../_shared/simple-writing-rules.md`.

## Step 1: Where it lands, section 6

For each ask, write every business requirement, requirement, feature, FRD and EPIC it touches. A Net new ask names the business requirement whose scope it falls in, or None when it falls outside the BRD's scope.
- **The data model too.** The data model files cite no source, so no link leads to them. Find them through the Glossary's words instead. The things file, `{product}-glossary-things.md`, says which agreed words are things. For each such word in the ask, open the data model file the things file names for it. In the Data model column, write each action, field or move the ask touches. Write it as `{Thing}, {action, field or move}`, such as `Loan, Extend`. Copy each name as the file writes it. A move is its From, then →, then its To.
- When the ask adds a new action, field or move to a thing, write the thing alone, such as `Loan`.
- A late answer also lands on each data model row whose cell holds "Proposed (needs confirmation)" and the question's number.
- Write None when the ask touches no thing.

## Step 2: What it touches, and how big

1. Run `node tools/find-linked.ts --project {project} --change {change}`, which writes section 12.
2. Run `node tools/size-rules.ts --project {project} --change {change}`, which writes section 14.

## Rules

- Never write a section another writer owns.
- A place is never made up. Each names the ID, the file or the data model row it is.

## Output

- The file `changes/{change}/impact-report.md`: section 6, and sections 12 and 14 through the programs.
