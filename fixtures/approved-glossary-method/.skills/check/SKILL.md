---
name: check
allowed-tools: Read, Glob, Grep
description: >-
  Find where a document or story has drifted from the agreed glossary — a retired word in use,
  a term used against its definition, a product word with no entry, or two words for one meaning — and
  report each with a recommended fix. Read-only: it spots the drift; disposition decides
  what to do about it. Use to check or lint a document or story against the glossary
  after it changed — e.g. "does this story use the agreed terms?", "check this spec
  against the glossary". Not for building the glossary (use harvest) or acting on the
  drift (use disposition).
---

# check — spot where a document has drifted from the glossary

Read one document and report where it disagrees with the glossary. **Read-only.** The method lives in `../_shared/glossary/` — **follow those files; do not restate them.**

## Reads
- The document — the file or story shared.
- The glossary at `Output/glossary/` — the seven pages only, not `deep-dives/`: approved terms, and the retired words in each kind page's Terms replaced or retired over time table. The seven pages absent → stop; run **harvest** first.
- The method — `../_shared/glossary/method-words.md` (the words every file uses), `../_shared/glossary/lens1-ontology.md` (the keep rule, to tell a product word from an everyday one), `../_shared/glossary/otc-run-rules.md` (the boundary), `../_shared/glossary/output-formats.md` ("The check findings and the ripple list").

## Produces
- A findings list for **disposition**. check writes nothing and fixes nothing.

## Steps
1. Load the glossary — approved terms and retired words.
2. Read the document's own words; skip passages quoted verbatim from the source.
3. Flag four issues: a retired word in use; a term used against its definition; a product word (passes the `../_shared/glossary/lens1-ontology.md` keep rule) with no entry; two words for one meaning inside the document.
4. Show the findings by filling `../_shared/glossary/templates/check-findings.md`, one row per finding.
5. Hand the findings to **disposition**.

## Must not
Edit the document or the glossary — that is disposition's job. On a baselined source, report only.

## Connects
**check** spots drift; **disposition** acts on it; **harvest** builds and updates the glossary. How the three fit together: `../../skill-orchestration.md`.
