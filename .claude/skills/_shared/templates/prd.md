# PRD — {product name}

Status: drafted

## 1. Document control

| | |
|---|---|
| Owner | {owner} |
| Source BRD | [{product}-brd.md]({product}-brd.md), version {BRD version} |

## 2. Product overview

{overview}

## 3. Personas and roles

### Personas

| Persona | Who they are | Source |
|---|---|---|
| {persona} | {who they are} | per {source and place} |

### Roles and permissions

| Role | {action} | {action} |
|---|---|---|
| {role} | {permission} | {permission} |

## 4. Requirements

### {source heading}

| ID | Kind | In simple words | The client's words | Source | Traces to |
|---|---|---|---|---|---|
| {requirement ID} | {kind} | {simple words} | {client's words} | {source, version and place} | • {BR ID} |

## 5. The end-to-end journey

| Step | What happens | Requirements |
|---|---|---|
| {number} | {journey step} | • {requirement ID}<br>• {requirement ID} |

## 6. NFRs

> **Metrics Confidence Summary:**
> - **CONFIRMED:** {confirmed count} metrics. Each one is fully supported by the source documents.
> - **TENTATIVE:** {tentative count} metrics. Each one is partly supported, and its details need checking.
> - **AI-RECOMMENDED:** {recommended count} metrics. The AI suggested each one, and you decide at the gate.
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

### Evidenced

| NFR ID | NFR | Source | Confidence |
|---|---|---|---|
| {NFR ID} | {NFR} | per {source and place} | {confidence} |

### Recommended

| NFR ID | NFR | Why recommended | Confidence |
|---|---|---|---|
| {NFR ID} | {NFR} | {why recommended} | AI-RECOMMENDED |

## 7. Transition requirements

| ID | Requirement | Source | Needs building? |
|---|---|---|---|
| {transition ID} | {transition requirement} | per {source and place} | {needs building} |

## 8. Dependencies and assumptions

### Dependencies

- {dependency} — per {source and place}

### Assumptions

- {assumption} — per {source and place}, or Proposed (needs confirmation)

## 9. Traceability matrix

| BR ID | Business requirement | Covered by | Status |
|---|---|---|---|
| {BR ID} | {business requirement} | • {requirement ID}<br>• {requirement ID} | {coverage} |

## Decision record

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** Every requirement the client stated, in the source's own order. Each one is in simple words, with the client's own words and its source next to it. It also holds the personas, the end-to-end journey, the NFRs and the transition requirements.
- **What it is not:** Features, priorities or decided rules. Features and priorities come in the Feature catalog, and decided rules in the FRDs.
- **Written by:** prd-author, from `templates/prd.md`. Checked by check-prd.cjs before its gate.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Document control | Who owns the PRD, and which version of the BRD it was written from. |
| 2. Product overview | What the product is and what it is worth, in three to five sentences. It points to the BRD for the business case, and doesn't repeat it. |
| 3. Personas and roles | Who uses the product, and what each role may do. Roles and permissions come only from the files: a cell the files don't settle reads TBD and names its question in the Question log, such as "TBD, question 10". |
| 4. Requirements | Every requirement, one per row, in the order and under the headings of the client's own file. A client's row that holds several requirements is cut into one row for each, as `atomic-rules.md` says. "In simple words" says the requirement in simple words, and every later document copies these words. "The client's words" holds the part of the client's row it comes from, so you can check each row against it. Read in order, the parts give back the client's row. Nothing is merged, ranked or added in this section. Kind says whether a row is a requirement, or only the client's purpose, scope or way of working. Only Requirement rows become features. A rule the client states stays in this section. Rules decided later are written in the FRDs. Each row names its source, with the client's own number for the row. |
| 5. The end-to-end journey | The whole product as one journey, from the first thing a user does to the last, in simple words. Each step names the Requirement rows it involves. Later, each FRD describes the flow inside one part of this journey. |
| 6. NFRs | How well the product must work, rather than what it does: speed, availability, security, accessibility and scale. NFRs are written only in this section, each with an ID. Every later document names them by ID. A threshold no file gives is TBD, never made up. |
| Evidenced | NFRs that a file states. |
| Recommended | NFRs no file states, suggested because the product would be at risk without them. Each one is accepted, changed or rejected at the gate. |
| 7. Transition requirements | What has to happen to move from today's way of working to the new product, such as moving old records, training people, or running the old and new ways side by side. "Needs building?" says whether the product itself must do it. Every "No" must also appear in the BRD's release criteria, so it is still checked before release. |
| 8. Dependencies and assumptions | What the product relies on that it doesn't control, and what is taken as true without proof. |
| 9. Traceability matrix | Every business requirement in the BRD, one row each, and the Requirement rows that cover it. A BR with nothing covering it is a Gap, and its row names its question in the Question log. |
| Decision record | Every decision made at the PRD's gate, in the order made, in the shape of `templates/parts/decision-record.md`. |
| Check record | The record of the last check, pasted exactly as check-prd.cjs printed it. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as in the BRD | Expense claims |
| {product} | the project's name, as its folder has it | expense-claims |
| {owner} | the specifier who owns the PRD: BA or PO | PO |
| {BRD version} | the BRD's accepted version | 1 |
| {overview} | three to five sentences on what the product is and what it is worth | Expense claims lets employees and contractors claim business expenses online. Their line manager approves each claim, and the finance team also approves claims over 500. |
| {persona} | a kind of user | Claimant |
| {who they are} | one line on who they are and what they want | an employee or contractor who has paid for something on the business's behalf |
| {source and place} | the file's name, and the section or item | expense-policy-2026.pdf, section 1.1 |
| {action} | one thing a person can do, as a column heading | Approve a claim from their team |
| {role} | a role | Line manager |
| {permission} | Yes or No, or TBD with its question when the files don't say | Yes |
| {source heading} | the heading of a section in the client's file, as the file names it. It is a reference, like a file name. | 3. Approving claims |
| {requirement ID} | REQ-, the section's number, a dot, and the requirement's number in the section, counted from 1 in the client's order. No letters. | REQ-3.2 |
| {kind} | Requirement, Purpose, Scope or Way of working, as prd-author's kind table says. A row whose kind isn't clear is a Requirement. | Requirement |
| {simple words} | one requirement, as `atomic-rules.md` says, in simple words, as `simple-writing-rules.md` says. A short title comes first, in bold, then a dash, then the requirement. Nothing in its part of the client's words is lost, and nothing is added. It uses the Glossary's agreed words when the project has a Glossary. A part with two possible meanings becomes a question. | **Finance approval** — The finance team also approves each claim over 500. |
| {client's words} | only the part of the client's row that this requirement comes from, exactly as the file writes it. The first part keeps the row's title, in bold. When a row holds 2 requirements, such as "Claims over 500 need finance approval, and the approver is named on the claim.", it becomes 2 rows, one for each part. | **Finance approval** — Claims over 500 need finance approval. |
| {source, version and place} | the file, its version, and the client's own number for the row | claims-requirements-v2.docx, version 2, section 3.2 |
| {BR ID} | an ID from the BRD. A row of any kind but Requirement names the section that holds it instead: PRD section 2 for Purpose, BRD section 4 for Scope, or PRD section 8 for Way of working. | BR-03 |
| {number} | a number, from 1 | 2 |
| {journey step} | one step of the journey, in simple words | The claimant's line manager approves the claim |
| {confirmed count}, {tentative count}, {recommended count} | how many NFRs have each tag | 0, 1, 1 |
| {NFR ID} | NFR- and a number, from NFR-1 | NFR-1 |
| {NFR} | the NFR, in simple words | The product works at least during office hours. |
| {confidence} | CONFIRMED, or TENTATIVE with what is missing | TENTATIVE: office hours are not defined |
| {why recommended} | the risk the NFR covers | receipts are financial records, and no file says how long to keep them |
| {transition ID} | the file's own ID, or TR- and a number, from TR-1 | TR-1 |
| {transition requirement} | what has to happen to move from today's way to the new product | Paper claims still open on the go-live date are finished on paper |
| {needs building} | Yes or No | No |
| {dependency} | something the product relies on that it doesn't control | The monthly payroll run pays approved claims |
| {assumption} | something taken as true without proof | Every claim is made in euros |
| {business requirement} | the BR's words, copied exactly from the BRD | Claims over 500 are also approved by the finance team. |
| {coverage} | Covered or Partial, or Gap with its question | Covered |
