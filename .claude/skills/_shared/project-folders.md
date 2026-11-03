# Project folders

> **What this is:** The map of a project's folders: where every document lives, inside `Output/{project}/`, and which step writes it.
>
> **What it is not:** What goes inside each document. Each document's shape is its template, in `templates/`.
>
> **Who uses it:** You, to find a file. Every skill and program, through `tools/lib/run-paths.cjs`. And `tools/scaffold-project.cjs`, to create the folders.

## 1. Where a project lives

Every project gets one folder, `Output/{project}/`, in the folder you work from. Everything the workflows write for that project goes inside it, and nothing else does. The project's name, such as `expense-claims`, is also the product name. You type it once. It starts the file names of these documents:
- the Discovery brief
- the BRD
- the PRD
- the Question log
- the data model's things file
- the data model's decisions

**To set up a project, or to check one,** run the program `scaffold-project.cjs`, from the folder you work from, with your project's name: `node {path to the tools folder}/scaffold-project.cjs --project {project}`.

It creates the folders every project needs, and never deletes, moves or overwrites anything. Every workflow's first step runs it too, and so does every skill run on its own. If the folder already holds work from an older way of working, it creates nothing and tells you so.

## 2. The folders and files

Three rules keep the names short:
- No numbers in folder or file names.
- A file name never repeats what its folder already says.
- A folder exists only to group several files. A single document sits directly in its parent folder.

For a project called `expense-claims`:

- `Output/`
  - `expense-claims/`
    - `sources/`: your requirement files, as you received them
    - `expense-claims-discovery-brief.md`: the Discovery brief
    - `expense-claims-brd.md`: the BRD
    - `expense-claims-prd.md`: the PRD
    - `expense-claims-question-log.md`: the Question log, every question asked in the project
    - `glossary/`: the Glossary's seven files
      - `deep-dives/`: how the Glossary was reached: the gate log and the assembly draft
        - `{section}/`: one folder per section of the sources, with its draft and its decisions
      - `data-models/`: the data model: the things file, one data model file per family, and the data model's decisions
        - `expense-claims-glossary-things.md`: the things file
        - `claims.md`: one data model file per Glossary family, named after the family
        - `expense-claims-data-model-decisions.md`: the data model's decisions
    - `frd/`
      - `feature-catalog.md`: the Feature catalog
      - `frd-claim-approval.md`: one FRD per capability, named after the capability
    - `epics/`
      - `grouping.md`: the EPIC grouping
      - `register.md`: the EPIC register
      - `sequencing.md`: the EPIC sequencing
      - `mapping.md`: the EPIC mapping
      - `EPIC-002-claim-approval/`: one folder per EPIC, named by its ID and name
        - `brief.md`: the EPIC brief, only for the EPICs picked for one
        - `story-list.md`: the EPIC's Story list
        - `reject-a-claim.md`: one Story per file, named after the story's title
    - `design/`: design files you bring, if any
    - `changes/`
      - `001-receipt-limit/`: one folder per change, numbered from 001
        - `impact-report.md`: the Change impact report
        - `check-findings.md`: the check findings on documents from outside
        - `progress.md`: the change's progress
    - `version-log/`
      - `log.md`: the Version log, one row per acceptance
      - `{document}/`: a numbered copy of each accepted version of that document
    - `traceability-map.json`: the links between every ID, rebuilt at every acceptance

| Folder | What goes in it | Written by | Created |
|---|---|---|---|
| `sources/` | your requirement files, unchanged | you | when the project is set up |
| the project folder | • the Discovery brief<br>• the BRD<br>• the PRD<br>• the Question log<br>• the Traceability map | • discovery-author<br>• brd-author<br>• prd-author<br>• probing-questions-author and grade-questions.cjs<br>• traceability-map.cjs | when the project is set up |
| `glossary/` | the Glossary's seven files | glossary-author | when the project is set up |
| `glossary/deep-dives/` | • the gate log<br>• the assembly draft | glossary-author | when the project is set up |
| `glossary/deep-dives/{section}/` | • the section's draft<br>• the section's decisions | glossary-author | when the Glossary reads that section |
| `glossary/data-models/` | • the things file<br>• one data model file per family<br>• the data model's decisions | • things-author<br>• data-model-author | when the project is set up |
| `frd/` | • the Feature catalog<br>• one FRD per capability | • feature-author<br>• frd-author | when the project is set up |
| `epics/` | • the EPIC grouping<br>• the EPIC register<br>• the EPIC sequencing and mapping | • epic-grouping-author<br>• epic-author<br>• build-sequencing-mapping.cjs | when the project is set up |
| `epics/{epic}/` | • the EPIC brief, if the EPIC has one<br>• the Story list<br>• one file per Story | • epic-author<br>• story-drafter<br>• story-groomer<br>• ac-author | when that EPIC's brief or stories start |
| `design/` | design files | you, if there are any | by you, when you bring design files |
| `changes/{change}/` | • the Change impact report<br>• the check findings<br>• the change's progress | • `change-request-workflow`<br>• its skills and programs | when the change is raised |
| `version-log/` | • the log<br>• one folder of copies per document | version-log.cjs | at the first acceptance |

## 3. Every document's path

This part is for the programs. The JSON block below is the only copy of the layout. `tools/lib/run-paths.cjs` reads its paths, and every skill and program finds its files through that library. `tools/scaffold-project.cjs` reads which folders to create at setup. The table is a readable copy of the paths. If you change one, change both. `run-paths.cjs` checks they agree.

Values in curly braces are filled in when a path is resolved:
- `{product}`: the project's name, such as `expense-claims`
- `{capability}`: the capability's name in lowercase with hyphens, such as `claim-approval`
- `{epic}`: the EPIC's ID, then its name in lowercase with hyphens, such as `EPIC-002-claim-approval`
- `{story}`: the story's title in lowercase with hyphens, such as `reject-a-claim`
- `{change}`: the change's number from 001, then a short name, such as `001-receipt-limit`
- `{section}`: a glossary section's own name in lowercase with hyphens, such as `claim-approval`
- `{family}`: a family of the Glossary, by its name in lowercase with hyphens, such as `lending` for a City library
- `{document}`: the document's path in the project folder, without `.md`, such as `frd/frd-claim-approval`
- `{n}`: the version number, from 1

| Document | Path |
|---|---|
| Sources | `sources/` |
| Discovery brief | `{product}-discovery-brief.md` |
| BRD | `{product}-brd.md` |
| PRD | `{product}-prd.md` |
| Question log | `{product}-question-log.md` |
| Glossary folder | `glossary/` |
| Glossary: the gateway | `glossary/README.md` |
| Glossary: terms and relationships | `glossary/terms-and-relationships.md` |
| Glossary: object terms | `glossary/object-terms.md` |
| Glossary: role terms | `glossary/role-terms.md` |
| Glossary: step terms | `glossary/step-terms.md` |
| Glossary: states and values | `glossary/states-and-values.md` |
| Glossary: decision register | `glossary/decision-register.md` |
| Glossary deep-dives folder | `glossary/deep-dives/` |
| Glossary gate log | `glossary/deep-dives/gate-log.md` |
| Glossary assembly draft | `glossary/deep-dives/glossary-assembly-draft.md` |
| Glossary section draft | `glossary/deep-dives/{section}/{section}-glossary.md` |
| Glossary section decisions | `glossary/deep-dives/{section}/{section}-decisions.md` |
| Data model folder | `glossary/data-models/` |
| Data model things file | `glossary/data-models/{product}-glossary-things.md` |
| Data model decisions | `glossary/data-models/{product}-data-model-decisions.md` |
| Data model file | `glossary/data-models/{family}.md` |
| Feature catalog | `frd/feature-catalog.md` |
| FRD | `frd/frd-{capability}.md` |
| EPIC grouping | `epics/grouping.md` |
| EPIC register | `epics/register.md` |
| EPIC sequencing | `epics/sequencing.md` |
| EPIC mapping | `epics/mapping.md` |
| An EPIC's folder | `epics/{epic}/` |
| EPIC brief | `epics/{epic}/brief.md` |
| Story list | `epics/{epic}/story-list.md` |
| Story | `epics/{epic}/{story}.md` |
| Design | `design/` |
| A change's folder | `changes/{change}/` |
| Change impact report | `changes/{change}/impact-report.md` |
| Check findings | `changes/{change}/check-findings.md` |
| Change progress | `changes/{change}/progress.md` |
| Version log | `version-log/log.md` |
| A Version log copy | `version-log/{document}/v{n}.md` |
| Traceability map | `traceability-map.json` |

```json
{
  "paths": {
    "sources": "sources/",
    "discovery-brief": "{product}-discovery-brief.md",
    "brd": "{product}-brd.md",
    "prd": "{product}-prd.md",
    "question-log": "{product}-question-log.md",
    "glossary": "glossary/",
    "glossary-readme": "glossary/README.md",
    "terms-and-relationships": "glossary/terms-and-relationships.md",
    "object-terms": "glossary/object-terms.md",
    "role-terms": "glossary/role-terms.md",
    "step-terms": "glossary/step-terms.md",
    "states-and-values": "glossary/states-and-values.md",
    "decision-register": "glossary/decision-register.md",
    "deep-dives": "glossary/deep-dives/",
    "gate-log": "glossary/deep-dives/gate-log.md",
    "glossary-assembly-draft": "glossary/deep-dives/glossary-assembly-draft.md",
    "section-glossary": "glossary/deep-dives/{section}/{section}-glossary.md",
    "section-decisions": "glossary/deep-dives/{section}/{section}-decisions.md",
    "data-models": "glossary/data-models/",
    "data-model-things": "glossary/data-models/{product}-glossary-things.md",
    "data-model-decisions": "glossary/data-models/{product}-data-model-decisions.md",
    "data-model": "glossary/data-models/{family}.md",
    "feature-catalog": "frd/feature-catalog.md",
    "frd": "frd/frd-{capability}.md",
    "epic-grouping": "epics/grouping.md",
    "epic-register": "epics/register.md",
    "epic-sequencing": "epics/sequencing.md",
    "epic-mapping": "epics/mapping.md",
    "epic-folder": "epics/{epic}/",
    "epic-brief": "epics/{epic}/brief.md",
    "story-list": "epics/{epic}/story-list.md",
    "story": "epics/{epic}/{story}.md",
    "design": "design/",
    "change": "changes/{change}/",
    "change-impact-report": "changes/{change}/impact-report.md",
    "check-findings": "changes/{change}/check-findings.md",
    "change-progress": "changes/{change}/progress.md",
    "version-log": "version-log/log.md",
    "version-copy": "version-log/{document}/v{n}.md",
    "traceability-map": "traceability-map.json"
  },
  "createdAtSetup": [
    "sources/",
    "glossary/",
    "glossary/deep-dives/",
    "glossary/data-models/",
    "frd/",
    "epics/"
  ]
}
```
