# Version log entry — template

> **What this is:** The shape of the Version log: the list of every accepted version of every document.
>
> **What it is not:** The copies themselves. Each row links to its copy.
>
> **Who uses it:** `version-log.cjs` writes it. `status.cjs` and `traceability-map.cjs` read it.

Only `version-log.cjs` writes the Version log. Nobody edits it by hand.

## 1. Where it lives

- The log is `version-log/log.md`, in the project folder (`project-folders.md`).
- Each copy is `version-log/{the document's path, without .md}/v{n}.md`, with n starting at 1. For example, the second accepted version of the Claim approval FRD is `version-log/frd/frd-claim-approval/v2.md`.

## 2. The log

The log opens with its title, "Version log — {project}", and the two lines on what it is and isn't. Then comes one table, with one row for each acceptance, added at the bottom. A row is never edited.

At every acceptance, `accept.cjs` also saves a copy of the Question log as it stands, so the log gains a row for the Question log too. Its Decision record entry is None, because the Question log has no gate of its own.

You may accept the data model's things file or a data model file. Then `accept.cjs` also saves a copy of the data model's decisions file, so the log gains a row for it too. Each data model gate records its answers in the decisions file. Its Decision record entry is its last settled decision, such as DM-6.

| Column | What it holds |
|---|---|
| Version | n, for this document. Its first acceptance is 1. |
| Document | the document's path inside the project folder |
| Date | the date it was accepted, as YYYY-MM-DD |
| Decision record entry | the last decision in the document's Decision record when it was accepted, or None. For the data model's decisions file, its last settled decision. |
| Copy | a link to the saved copy |
| Lines added | the lines in this version that weren't in the version before. For version 1, every line. |
| Lines removed | the lines in the version before that aren't in this one. For version 1, 0. |

## 3. Example

| Version | Document | Date | Decision record entry | Copy | Lines added | Lines removed |
|---|---|---|---|---|---|---|
| 1 | frd/frd-claim-approval.md | 2026-10-19 | Decision 6 | [v1](frd/frd-claim-approval/v1.md) | 214 | 0 |
| 2 | frd/frd-claim-approval.md | 2026-11-02 | Decision 7 | [v2](frd/frd-claim-approval/v2.md) | 6 | 2 |
| 7 | expense-claims-question-log.md | 2026-11-02 | None | [v7](expense-claims-question-log/v7.md) | 18 | 9 |
