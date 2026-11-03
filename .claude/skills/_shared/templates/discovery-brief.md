# Discovery brief — {product name}

Status: drafted

## 1. Sources

### Summary

| Files | Used | Same as another file | Older version | Out of scope |
|---|---|---|---|---|
| {file count} | {used count} | {same count} | {older count} | {out of scope count} |

### {folder}

| # | File | Kind of document | Version or date | Owner | Standing | Used |
|---|---|---|---|---|---|---|
| {number} | {file link} | {kind of document} | {version or date} | {owner} | {standing} | {used} |

## 2. Which kind of source wins

| Rank | Kind of document | Why it has this rank |
|---|---|---|
| {rank} | {kind of document} | {why} |

## 3. Known: what the sources say, topic by topic

### {area}

| Topic | What the sources say | Verdict |
|---|---|---|
| {topic} | • "{quote}" — per {source and place}<br>• "{quote}" — per {source and place} | {verdict} |

## 4. Clashes, and how each is settled

| # | Topic | Kind of clash | What each file says | Settled by | What now holds | Question |
|---|---|---|---|---|---|---|
| {number} | {topic} | {kind of clash} | • "{quote}" — per {source and place}<br>• "{quote}" — per {source and place} | {settled by} | {what now holds} | {clash question} |

## 5. Assumed

- {assumption} — why: {reason}. Question {question number}.

## 6. Risks and edge cases

- {risk}. The cost: {cost}

## Decision record

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The first look at the requirement files: which files there are, which kind of file wins when two disagree, what the files say topic by topic, what they only imply, and what could go wrong. Whatever is missing becomes a question in the Question log, and the brief names it.
- **What it is not:** The requirements. Nothing in this brief is decided until the BRD and the PRD say so.
- **Written by:** discovery-author, from `templates/discovery-brief.md`. Checked by check-discovery-brief.ts before its gate.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Sources | Every file in the project's `sources/` folder, and whether it is used. Only files marked Used are read by the steps after this one. A file is not used when it is the same as another file, when a newer version of it is in the folder, or when you rule it out of scope at the gate. There is one table per folder inside `sources/`, so hundreds of files stay readable. The file names, the folders, and the "same as" and "older version" marks come from list-sources.ts, so no file is missed or counted twice. discovery-author fills in the rest by reading each file. |
| 2. Which kind of source wins | The order of authority between the kinds of document in section 1, settled once, at the gate. When two used files disagree, the file of the higher kind wins, unless you decide otherwise for that clash. Two versions of the same document never clash: the newer one is used, and the older one is marked in section 1. discovery-author proposes the order. You confirm or change it, and your answer is recorded as a decision. |
| 3. Known: what the sources say, topic by topic | Every topic any used file speaks about, compared across all of them, so no disagreement is left to chance. The topics come from two places: the files' own section headings, and the nine areas below, so a topic no file mentions is still checked. Each row quotes only the files that speak to that topic, so it stays readable however many files there are. Topics are grouped by area. The nine areas:<br>• Users and context: who uses it, what they do today, and how often<br>• Problem and value: what breaks or costs money now, and what "better" looks like<br>• Scope edges: what is out, and what people will assume is in<br>• Rules and constraints: business rules, policies, limits and compliance<br>• Data and states: the things it holds, and the states they move through<br>• Edge cases and failure modes: empty, invalid, duplicate, slow, or two people at once<br>• Dependencies and integrations: what must exist first, and what depends on it<br>• Success and acceptance: how we'll know it worked, and what "done" means<br>• Non-functional: speed, security, availability, accessibility and scale Each topic gets one of four verdicts:<br>• Agree: every file that speaks to it says the same thing.<br>• One source: only one file speaks to it. It is known, but nothing else confirms it.<br>• Differ: two or more files say different things. It becomes a clash in section 4.<br>• Silent: no file speaks to it, but a later document needs it. It becomes a question in the Question log, and its row names that question. |
| 4. Clashes, and how each is settled | Every topic marked Differ in section 3, one row each. A clash is settled by the order in section 2, unless you decide otherwise at the gate. A clash the order can't settle, or that you want to settle yourself, becomes a question in the Question log, and its row names that question. Two files using different words for the same thing is not a clash: the Glossary records both words later. When nothing differs, this section says None. Each clash is one of three kinds:<br>• Contradiction: one file allows what another forbids.<br>• Different value: the files give different numbers, dates or limits for the same thing.<br>• Different scope: one file includes something another leaves out on purpose. |
| 5. Assumed | What the files imply but never say. Each line says why we think so, and names its question in the Question log, because nothing in this part is relied on until you confirm it at a gate. |
| 6. Risks and edge cases | What could go wrong, or an unhappy path the files don't cover, and what it would cost if nobody plans for it. |
| Decision record | Every decision made at this brief's gate, in the order made, in the shape of `templates/parts/decision-record.md`. |
| Check record | The record of the last check, pasted exactly as check-discovery-brief.ts printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as the requirement files give it | Expense claims |
| {file count} | how many files are in `sources/` | 214 |
| {used count} | how many of them are used | 187 |
| {same count} | how many are the same as another file | 9 |
| {older count} | how many are an older version of another file | 15 |
| {out of scope count} | how many you ruled out of scope | 3 |
| {folder} | a folder inside `sources/`, or `sources/` itself when there are no folders | policies/ |
| {number} | a number, from 1, running on across the whole section | 3 |
| {file link} | a link to the file | [expense-policy-2026.pdf](sources/policies/expense-policy-2026.pdf) |
| {kind of document} | what sort of document it is | Policy |
| {version or date} | the version or date the file itself states, or [Not specified in provided sources] | 2026 edition |
| {owner} | who wrote or owns it, as the file says, or [Not specified in provided sources] | Chief Financial Officer |
| {standing} | Approved, Final, Draft or Unknown, as the file says | Approved |
| {used} | Yes, or No with the reason. A file discovery-author proposes as out of scope reads "No: out of scope, to be decided at the gate" until the gate settles it, then names the decision. | No: older version of 1 |
| {rank} | a number from 1. The most authoritative kind is 1, and each kind after it gets the next number. | 1 |
| {why} | why that kind has its rank | approved by the Chief Financial Officer, and binding on every claim |
| {area} | one of the nine areas listed in section 3 | Rules and constraints |
| {topic} | the topic in a few words, the same wherever it appears | Finance approval limit |
| {quote} | a file's own words, in quotation marks | Claims over 500 need finance approval. |
| {source and place} | the file's name, and the section or item | claims-requirements-v2.docx, section 3.2 |
| {verdict} | Agree, One source, Differ or Silent. A Silent topic names its question. | Silent, question 1 |
| {kind of clash} | Contradiction, Different value or Different scope | Different value |
| {settled by} | the rank that settled it, or the decision that did | Rank 1: Policy |
| {what now holds} | what is now true, in simple words: what the winning file says, or your answer | Claims over 500 need finance approval. |
| {clash question} | the question in the Question log, when you settle it yourself, or - when the order in section 2 settles it | question 3 |
| {assumption} | what we think is true | Every claim is made in euros |
| {reason} | what in the files suggests it | every amount in the files is in euros |
| {question number} | the number of its question in the Question log | 4 |
| {risk} | the risk, or the unhappy path | Claims sent in the last days of the financial year |
| {cost} | what it would cost if nobody plans for it | they may be paid from the next year's budget |
