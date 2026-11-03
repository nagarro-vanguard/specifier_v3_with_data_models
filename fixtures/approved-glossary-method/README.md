# Approved glossary method

> **What this is:** The glossary method's files exactly as they were approved: the word list, the method, its templates, its skills and its prompts. The tests compare the kit's copies with these files line by line, so every difference in a copy is one the kit's rules allow.
>
> **What it is not:** What the kit runs. The kit's skills read their own copies, in `.claude/skills/_shared/glossary/` and in the glossary skills' folders. These files are never edited.
>
> **Who uses it:** The tests in `tools/tests/`.

## The files

| File | What it holds |
|---|---|
| `.skills/_shared/glossary/method-words.md` | the word list: one word for each meaning, and the words not to use |
| `glossary-design.md` | a short overview of the method |
| `.skills/_shared/glossary/`:<br>• `lens1-ontology.md`<br>• `lens2-topology.md`<br>• `lens3-choreography.md`<br>• `otc-methodology.md`<br>• `otc-run-rules.md` | the method itself |
| `.skills/_shared/glossary/`:<br>• `output-formats.md`<br>• `glossary-assembly-principles.md` | how the glossary's pages and records are written |
| `.skills/_shared/glossary/templates/` | the blank pages, records and reviews the method fills |
| `.skills/`:<br>• `harvest/SKILL.md`<br>• `check/SKILL.md`<br>• `disposition/SKILL.md` | the method's three skills, which build the glossary, check a document against it, and settle a word that drifted |
| `glossary-methodology-prompts/`:<br>• `README.md`<br>• `feature-journey-analysis.md` | Feature Fit: how a feature is read against the glossary |
| `glossary-methodology-prompts/adversarial-check.md` | the challenge of a Feature Fit reading |
| `.skills/_shared/glossary/`:<br>• `sweep-builder-brief.md`<br>• `sweep-reader-brief.md`<br>and `skill-orchestration.md` | kept so the set is whole; the kit has no copy of them |
