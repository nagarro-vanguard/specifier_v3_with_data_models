# EPIC grouping — {product name}

Status: drafted

## 1. Feature inventory

| Feature ID | Feature Name | Source Reference | Priority | Brief Description | Depends on |
|---|---|---|---|---|---|
| {feature ID} | {feature name} | • {requirement ID} | {priority} | {brief description} | • {depends on} |

## 2. Options

| Strategy | Groups EPICs by | Fits best when |
|---|---|---|
| By business capability | what the business does, such as Claim submission or Claim approval | most products, and the default first choice |
| By user journey stage | where the user is in the journey, such as Start, Use or Get support | the features follow one journey from end to end |
| By persona or role | who uses it, such as Claimant, Manager or Finance team | different users have clearly different work |
| By value stream or outcome | the business outcome, such as Faster payment or Lower cost | the plan is framed by outcomes |
| By delivery sequence | a first band to deliver, then a later band | there is a clear first release |
| By complexity or risk | small and safe first, then larger and riskier | sizing drives the plan |

### Option A: {strategy}

**Cutting angle:** {cutting angle}

| Sl. No. | EPIC Name | Features (by ID) | Band |
|---|---|---|---|
| {number} | {EPIC name} | • {feature ID}<br>• {feature ID} | {band} |

**Pros:**
- {pro}

**Cons:**
- {con}

**Best if:** {best if}

### Option B: {strategy}

{same parts as option A}

### Comparison in short

| Dimension | Option A | Option B |
|---|---|---|
| Number of EPICs | {EPIC count} | {EPIC count} |
| Cutting angle | {strategy} | {strategy} |
| Delivery parallelism | {level} | {level} |
| Foundational dependency depth | {depth} | {depth} |
| Business-value visibility per EPIC | {level} | {level} |
| Team-boundary alignment | {alignment} | {alignment} |

### AI recommendation

- **Recommended option:** {option letter}
- **Rationale:** {rationale}
- **What could change this recommendation:** {what could change it}

## 3. Chosen grouping: Option {option letter}, {strategy}

### EPIC list

| Sl. No. | EPIC Name | Band |
|---|---|---|
| {number} | {EPIC name} | {band} |

### EPIC definitions

| Sl. No. | EPIC Name | Outcome (hypothesis) | MVP | Later | Band | Persona |
|---|---|---|---|---|---|---|
| {number} | {EPIC name} | {outcome} | • {feature ID} | • {feature ID} | {band} | {persona} |

### Borderline features

| Feature | Source | Placed in EPIC | Alternative EPIC | Why placed as decided |
|---|---|---|---|---|
| {feature} | {requirement ID} | {number} | {number} | {why placed} |

### Inter-EPIC dependencies

| From (Sl. No.) | Depends on (Sl. No.) | Impact if unresolved | Linked by |
|---|---|---|---|
| {number} | {number} | {impact} | {link} |

### Suggested EPIC sequence

| Sequence | EPIC | Rationale |
|---|---|---|
| {number} | {number and EPIC name} | {sequence reason} |

### Clashes, and how you settled them

| Clash | Feature | Depends on | Settlement | Decided at |
|---|---|---|---|---|
| {clash} | {feature ID} | {feature ID} | {settlement} | {decision} |

### EPIC brief list, in run order

| Order | EPIC | Brief | Reason |
|---|---|---|---|
| {number} | {number and EPIC name} | {yes or no} | {brief reason} |

## 4. Placements from changes

None yet.

## Decision record

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** The record of how the features were grouped into EPICs: the options offered, the one you chose, the clashes you settled, and which EPICs get an EPIC brief. It is only ever added to.
- **What it is not:** The list of EPICs itself. The EPIC register is a checked copy of the chosen grouping.
- **Written by:** epic-grouping-author, from `templates/epic-grouping.md`. Checked by check-epic-grouping.cjs before its gate.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Feature inventory | Every feature in the Feature catalog, one row each. This is the one list every option below groups, so no feature is left out or counted twice. |
| 2. Options | Two or three different ways to group the features into EPICs, each built on a different strategy. Every feature sits in exactly one EPIC in each option. An EPIC's name is a short phrase for a capability, never a sentence. An EPIC is never a small leftover, and is split into a first and a later part only when each part is worth delivering on its own. The strategies an option can follow: |
| AI recommendation | The option epic-grouping-author recommends, why, and what would change its mind. You choose at the gate. |
| 3. Chosen grouping: Option {option letter}, {strategy} | The option you chose at the gate, written out in full. epic-author copies it, field for field, into the EPIC register. |
| EPIC definitions | Each EPIC's name, the outcome it delivers, its features split into first and later bands, and the persona it serves. The outcome is one sentence: "As a" persona, "I need" a capability, "so that" an outcome. |
| Borderline features | Features that could reasonably sit in more than one EPIC, where each was placed, and why. When there are none, this says None. |
| Inter-EPIC dependencies | Which EPIC needs another to exist first, taken from the features' "Depends on" in the catalog, never made up. Any two EPICs that depend on each other are called out. |
| Suggested EPIC sequence | The order the EPICs are worked in, with the reason for each place. |
| Clashes, and how you settled them | A clash is a first-band feature that depends on a later-band feature, or a dependency that runs against the sequence. Every clash is settled at this gate, so nothing is left for later steps. |
| EPIC brief list, in run order | For each EPIC, in the order it is worked, whether it gets an EPIC brief, and why. An EPIC without one goes straight to its stories. |
| 4. Placements from changes | Each feature added later through a change, and the EPIC it was placed in. Entries are only ever added. When there are none, this says None yet. |
| Decision record | Every decision made at the EPIC grouping's gate, in the order made, in the shape of `templates/parts/decision-record.md`. |
| Check record | The record of the last check, pasted exactly as check-epic-grouping.cjs printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as in the Feature catalog | Expense claims |
| {feature ID} | a feature ID from the catalog | F-03 |
| {feature name} | the feature's name, from the catalog | Manager approval |
| {requirement ID} | each requirement ID the feature covers | REQ-3.1 |
| {priority} | the feature's priority, from the catalog | Must |
| {brief description} | one line, from the catalog's Description | A line manager approves or rejects each claim from their team |
| {depends on} | each feature it depends on, or None | F-01 |
| {strategy} | the strategy's name, from the table of strategies | By business capability |
| {cutting angle} | one sentence on what decides the boundaries | Each EPIC is one thing the business does with a claim |
| {number} | a number, from 1 | 2 |
| {EPIC name} | a short phrase for a capability | Claim approval |
| {band} | MVP, Later, or Mixed when it holds both | Mixed |
| {pro} | a concrete benefit | Each EPIC maps to one team that owns it |
| {con} | a concrete trade-off | Approval can't be shown working until submission is built |
| {best if} | one line on when this option is the right call | the business wants each capability owned end to end |
| {same parts as option A} | the same parts as Option A, for this option | the cutting angle, the EPICs, the pros, the cons and when it fits best |
| {EPIC count} | how many EPICs the option has | 2 |
| {level} | High, Medium or Low | High |
| {depth} | Deep or Shallow | Shallow |
| {alignment} | Strong, Weak or N/A | Strong |
| {option letter} | the letter of an option | A |
| {rationale} | two to four sentences, citing whichever applies: delivery risk, how deep the dependencies go, the order value is delivered in, or team boundaries | Option A keeps each capability whole, and its one dependency is shallow. |
| {what could change it} | one or two things you might weigh differently | if showing approval early matters more, Option B is stronger |
| {outcome} | "As a {persona}, I need {capability}, so that {outcome}" | As a line manager, I need to approve my team's claims, so that only checked claims are paid |
| {persona} | one of the PRD's personas, or Both | Line manager |
| {feature} | the feature's ID and name | F-04 Finance approval |
| {why placed} | one line, citing the source | approving over the limit is part of approving a claim |
| {impact} | what breaks if the dependency isn't met, in plain business words | there are no claims to approve |
| {link} | the feature link behind it | F-03 -> F-01 |
| {number and EPIC name} | the EPIC's number and name | 1 Claim submission |
| {sequence reason} | foundational, value-first or dependency-driven, and why | foundational: every other EPIC needs claims to exist |
| {clash} | one line on the clash | Manager approval is in the first band, but depends on Stand-in approver, which is later |
| {settlement} | what was decided | Stand-in approver moves to the first band |
| {decision} | the decision that settled it | Decision 3 |
| {yes or no} | Yes or No | Yes |
| {brief reason} | one line on why it does or doesn't get a brief | four features and a finance rule worth describing in full |
