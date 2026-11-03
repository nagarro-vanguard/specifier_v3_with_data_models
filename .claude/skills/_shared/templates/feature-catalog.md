# Feature catalog — {product name}

Status: drafted

## 1. Catalog control

- **Requirement IDs:** {requirement ID scheme}
- **Feature IDs:** F-01 onward, running on across every section. A feature's ID never changes, and the ID of a dropped feature is never used again.
- **BR links:** per the BRD

## 2. Feature catalog

### {PRD section heading}

| Feature ID | Feature | Description (what it is) | Done when (observable) | Covers (source IDs) | Priority | Basis | Depends on | Capability | Notes |
|---|---|---|---|---|---|---|---|---|---|
| {feature ID} | {feature name} | {description} | {done when} | • {requirement ID} | {priority} | {basis} | • {depends on} | {capability} | {notes} |

| Basis | The priority is driven by |
|---|---|
| Benefit | the value delivered when it is built |
| Penalty | what happens if it isn't built, including policy and legal demands |
| Cost | the effort it takes to build |
| Risk | the chance it can't deliver its value, or can't be built at all |
| Dependency | other features can't work without it |
| Time-sensitivity | its value drops after a date |
| Stability | how likely it is to change. A feature likely to change may wait. |
| Regulatory | the law or a policy requires it |

## 3. "Done when" pieces

### {feature ID} {feature name}

| Piece ID | Piece |
|---|---|
| {piece ID} | {piece} |

## 4. Coverage check

### {PRD section heading}

| Requirement ID | Requirement | Covered by | Status |
|---|---|---|---|
| {requirement ID} | {requirement title} | • {feature ID} | {coverage} |

## 5. Data model coverage

| Data model file | Thing | Action or move | Feature |
|---|---|---|---|
| {data model file} | {thing} | {action or move} | {feature, the change it waits on, or ?} |

**To settle at the gate**

| Data model file | Thing | Action or move | PRD says it? | Big enough? | Recommended |
|---|---|---|---|---|---|
| {data model file} | {thing} | {action or move} | {PRD says it?} | {big enough?} | {recommended} |

## Decision record

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The requirements turned into features, in the Glossary's agreed words. Each feature has a priority, the FRD it belongs to, and a "Done when" line cut into pieces that the FRD's rules must prove. Every action and every move in the data model is given to one feature, or waits on the change that adds its feature. Until the gate settles a row, it shows "?".
- **What it is not:** The grouping into EPICs, which is the EPIC grouping, or the detailed rules, which are in the FRDs.
- **Written by:** feature-author, from `templates/feature-catalog.md`. Checked by check-features.ts before its gate.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Catalog control | How the IDs in this catalog work. |
| 2. Feature catalog | Every feature, one row each, in one table per section of the PRD, under the section's own heading. A feature is something a user can recognise and use. The words are the Glossary's agreed words. The two fields people mix up most are kept apart:<br>• Description says what the feature is: what it does, so that the value, in one sentence.<br>• Done when says how an outside observer can see it is finished. It must add at least one condition the Description doesn't have. For example, for a feature "Name is fixed after creation", the Done when "the name is fixed after creation" fails, because it only repeats the Description. "After creation, a change to the name is not accepted" passes. Covers lists only requirement IDs from the PRD. Priority is Must, Should, Could or Won't, and Basis gives the one reason for it. Capability names the FRD the feature goes in. |
| {PRD section heading} | The basis for a priority is one of these: When no file supports a priority, it is marked Proposed (needs confirmation), and names its question in the Question log. |
| 3. "Done when" pieces | Each feature's Done when, cut into separate conditions, using only its own words, in its own order. Read together in order, a feature's pieces give back its Done when exactly. Every piece must be proved by at least one rule in the feature's FRD. Each feature has its own heading, its ID and then its name, with its own small table of pieces under it. So a reader sees a feature and its pieces together. |
| 4. Coverage check | Every Requirement row in the PRD, one row each, and the features that cover it, grouped like the PRD. A row of any other kind, such as Scope, has no row in the coverage check. A requirement no feature covers is a Gap, and its row names its question in the Question log. |
| 5. Data model coverage | Every action and every move in the data model files, one row each, in the files' order, and the one feature it belongs to. That feature's FRD turns it into rules. A move is written as its From, then →, then its To. Feature is the ID of one feature in section 2.<br>• A row that no feature names shows "?" in Feature, until the gate settles it. "To settle at the gate" lists each such row, with the recommendation for the gate. Its two answers say whether the PRD says the action or the move, and whether it is big enough to be a feature. When the gate settles the row, Feature gets the answer, and the row leaves "To settle at the gate". When no row shows "?", "To settle at the gate" is left out. The catalog can't be accepted while a row shows "?".<br>• The PRD may not say an action or a move that is big enough to be a feature. Then its row needs a new requirement first. At the gate, the change that adds the requirement is opened, and it gets its number. Its analysis and its own gate come after the catalog's gate. Until that change is done, Feature reads "waits on change" and the change's 3-digit number. The change is in the project's changes/ folder. A waiting row is not a finding. The gate shows each one. When the change is done, the row gets its feature. A row that still waits once its change is closed is a finding. |
| Decision record | Every decision made at the Feature catalog's gate, in the order made, in the shape of `templates/parts/decision-record.md`. |
| Check record | The record of the last check, pasted exactly as check-features.ts printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as in the PRD | Expense claims |
| {requirement ID scheme} | how the PRD numbers its requirements | REQ- and the section number from the client's file: section 3.2 is REQ-3.2 |
| {PRD section heading} | the heading of a section of the PRD, word for word | 3. Approving claims |
| {feature ID} | F- and the next two-digit number | F-03 |
| {feature name} | a short business name, in the Glossary's agreed words | Manager approval |
| {description} | what it does, so that the value, in one sentence | A line manager approves or rejects each claim from their team, so that only checked claims are paid |
| {done when} | what an outside observer can see when it is finished | Each manager sees every claim waiting for them, and can approve it or reject it with a reason |
| {requirement ID} | a requirement ID from the PRD | REQ-3.1 |
| {priority} | Must, Should, Could or Won't | Must |
| {basis} | one basis from the table, then one clause | Penalty — paying an unapproved claim breaks the expense policy |
| {depends on} | each feature that must exist first, or None | F-01 |
| {capability} | FRD-, the PRD section number and a letter, then the capability's name | FRD-3a Claim approval |
| {notes} | anything a reader needs to know, or None | None |
| {piece ID} | the feature ID, ".dw" and a number from 1 | F-03.dw1 |
| {piece} | one condition, in the Done when's own words | Each manager sees every claim waiting for them |
| {requirement title} | the requirement's title, from the PRD's "In simple words" column | Line manager approval |
| {coverage} | Covered or Partial, or Gap with its question | Covered |
| {data model file} | the family's data model file | lending.md |
| {thing} | a thing, in the Glossary's word | Loan |
| {action or move} | the action as its Actions table names it, or the move as From → To | Extend |
| {feature, the change it waits on, or ?} | the ID of one feature in section 2. Or, until a change adds the feature it needs, "waits on change" and the change's 3-digit number. Or "?", until the gate settles the row. | • F-04, for Extend on a Loan<br>• waits on change 004, for Reserve on a Loan. No requirement says that members can reserve a book that is on loan.<br>• ?, for Browse on a Loan, until the gate settles it |
| {PRD says it?} | yes when one of the PRD's requirements names the action or the move. Otherwise no. | no |
| {big enough?} | yes or no, from the test "Is it big enough to be a feature?" in `data-model-design.md`, section 2 | no |
| {recommended} | the recommendation the two answers give, as feature-author's step 6 says. It is one of these, where F-03 stands for the feature that owns the thing's first action:<br>• Add a piece to the Done when of F-03<br>• A new feature<br>• Give it to F-03<br>• A new requirement first, then a new feature | Give it to F-03, for Browse on a Loan. F-03 owns Borrow, the action that makes a Loan. |
