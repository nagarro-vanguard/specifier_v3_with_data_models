---
name: glossary-check
allowed-tools: Read, Glob, Grep
description: >-
  Find where a document or story has drifted from the agreed glossary, and report each
  place with a recommended fix. Drift is a retired word in use, a term used against its
  definition, a product word with no entry, or two words for one meaning. It changes
  nothing: it spots the drift, and glossary-disposition decides what to do about it. Use
  to check or lint a document or story against the glossary after it changed, for
  example "does this story use the agreed terms?" or "check this spec against the
  glossary". Not for building the glossary (use glossary-author) or acting on the
  drift (use glossary-disposition).
---

# glossary-check — spot where a document has drifted from the glossary

Read one document and report where it disagrees with the glossary. **It changes nothing.** The method is kept in `../_shared/glossary/`. **Follow those files, and do not restate them.** Every finding is written as `../_shared/simple-writing-rules.md` says.

## Reads
- The document: the file or story shared.
- The glossary at `Output/{project}/glossary/`: the seven pages only, not `deep-dives/`. They give the approved terms, and the retired words in each kind page's Terms replaced or retired over time table. The seven pages absent → stop, and run **glossary-author** first.
- The method:
  - `../_shared/glossary/method-words.md`, for the words every file uses
  - `../_shared/glossary/lens1-ontology.md`, for the keep rule, which tells a product word from an everyday one
  - `../_shared/glossary/otc-run-rules.md`, for the boundary
  - `../_shared/glossary/output-formats.md`, "The check findings and the ripple list"

## Produces
- A findings list for **glossary-disposition**. Inside a change, it is saved as the change's Check findings, `Output/{project}/changes/{change}/check-findings.md` (`project-folders.md`). On its own, it is shown in the conversation. glossary-check fixes nothing.

## Steps
1. Load the glossary: approved terms and retired words.
2. Read the document's own words. Skip passages quoted word for word from the source. Skip the kit's own labels too: the document's title and the headings its template gives, such as "Story —" or "EPIC brief —". They name the kit's documents, not the product's things.
3. Flag four issues:
   - a retired word in use
   - a term used against its definition
   - a product word with no entry. A product word passes the keep rule in `../_shared/glossary/lens1-ontology.md`.
   - two words for one meaning inside the document
4. Show the findings by filling `../_shared/glossary/templates/check-findings.md`, one row per finding. Each row's Recommended Next Best Action starts with the action, in bold, then what to use and why, then the affected file.
5. Hand the findings to **glossary-disposition**: inside a change, save them as the change's Check findings first.

## Must not
Edit the document or the glossary. That is glossary-disposition's job. On a baselined source, report only.

## Connects
**glossary-check** spots drift. **glossary-disposition** acts on it. **glossary-author** builds and updates the glossary. Inside a change, glossary-check runs at step 1 of `change-request-workflow`, and glossary-disposition next, when its findings hold a mismatch.
