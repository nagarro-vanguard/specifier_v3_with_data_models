# Traceability map — template

> **What this is:** The shape of the Traceability map: the file that links every ID to the IDs it traces to, such as a requirement to its BR, a feature to its requirements, or a rule to the piece it proves.
>
> **What it is not:** A document you read or edit. A program rebuilds it at every acceptance.
>
> **Who uses it:** `traceability-map.cjs` writes it. `find-linked.cjs` reads it, to find what a change touches.

It is the file `traceability-map.json`. Only `traceability-map.cjs` writes it, rebuilt at every acceptance from the latest accepted version of each document. Nobody edits it by hand.

## The shape

```json
{
  "project": "{project}",
  "built": "{YYYY-MM-DD}",
  "items": [
    { "id": "F-03", "type": "feature", "document": "frd/feature-catalog.md", "version": 1 }
  ],
  "links": [
    { "from": "F-03", "to": "REQ-3.1", "type": "covers" }
  ]
}
```

## Items

One per ID. Each ID appears once.

| Type | ID | Read from |
|---|---|---|
| BR | BR-01 | BRD, section 5, column "BR ID" |
| requirement | the PRD's own ID, such as REQ-3.1, or TR-1 for a transition requirement | PRD, section 4, column "ID", and section 7, column "ID" |
| NFR | NFR-1 | PRD, section 6, column "NFR ID" |
| feature | F-03 | Feature catalog, section 2, column "Feature ID" |
| piece | F-03.dw1 | Feature catalog, section 3, column "Piece ID" |
| EPIC | EPIC-002 | EPIC register, section 1, column "EPIC" |
| FRD | FRD-3a | each FRD's title |
| rule | F-03.1 | each FRD's Rules tables, column "Rule" |
| story | the story's title | each Story list, "Stories", column "Story" |
| scenario | the story's title, then "Scenario n" | each Story, "Acceptance criteria", column "Scenario" |

## Links

| Type | From | To | Read from |
|---|---|---|---|
| traces | requirement | BR | PRD, section 4, column "Traces to" |
| covers | feature | requirement | Feature catalog, section 2, column "Covers (source IDs)" |
| has-piece | feature | piece | Feature catalog, section 3: the piece ID starts with the feature ID |
| in-frd | feature | FRD | Feature catalog, section 2, column "Capability" |
| in-epic | feature | EPIC | EPIC register, section 1, column "Features" |
| has-rule | feature | rule | each FRD's Rules tables: the rule ID starts with the feature ID |
| proves | rule | piece | each FRD's Coverage table, column "Proved by" |
| applies | EPIC | NFR | each EPIC brief, section 7, column "NFR ID" |
| tells | story | feature | each Story list, "Stories", column "Feature ID" |
| names-rule | scenario | rule | each Story, "Acceptance criteria", the rule IDs in brackets at the end of each scenario's title |

## The check

Every link's from and to must be an existing item. `traceability-map.cjs` lists any that aren't, and exits with code 1.
