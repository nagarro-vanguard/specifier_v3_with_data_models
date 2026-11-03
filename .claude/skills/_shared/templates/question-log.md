# Question log — {product name}

## 1. Impact

| Impact | What it means | If the answer is wrong | Example |
|---|---|---|---|
| High | The answer reaches several features, through any of:<br>• the scope<br>• an objective<br>• who the users are<br>• a business requirement that several features serve | Many features and stories are built on it, and are redone through a change or a re-run | Who can make a claim: employees only, or contractors too? |
| Medium | The answer reaches one feature, or one capability's rules, even when they are written as a business requirement | One FRD and its stories are redone | Above what amount must the finance team also approve a claim? |
| Low | The answer reaches one detail inside a feature, or something nothing is built on, such as a KPI's target | That one detail is corrected, and nothing else moves | What must a manager write when rejecting a claim? |

## 2. Severity

| Severity | What it means | If the answer is wrong | Example |
|---|---|---|---|
| High | The answer touches any of:<br>• the law, a policy or a contract<br>• money<br>• personal data<br>• whether people can do their job at all | Real harm is done:<br>• a law, policy or contract is broken<br>• money is paid wrongly<br>• personal data is exposed<br>• people can't do their job | Above what amount must the finance team also approve a claim? With the wrong limit, claims are paid without an approval the policy requires. |
| Medium | The answer touches how quickly or easily people get things done | People are slowed down or confused, and a change fixes it before anyone is harmed | Who approves a claim when the manager is away? Claims wait an extra week. |
| Low | The answer touches how things look, read or are measured | Nobody is harmed or slowed. At most, something looks or reads wrong. | What is the target for days from claim to payment? A target set too low harms nobody. |

## 3. The grid

| Order | Severity | Impact | Group |
|---|---|---|---|
| 1 | High | High | Must answer |
| 2 | High | Medium | Must answer |
| 3 | High | Low | Must answer |
| 4 | Medium | High | Should answer |
| 5 | Medium | Medium | Should answer |
| 6 | Low | High | Should answer |
| 7 | Medium | Low | Can move ahead |
| 8 | Low | Medium | Can move ahead |
| 9 | Low | Low | Can move ahead |

## 4. What each group does

| Group | How it's asked | If the specifier doesn't know yet | When it must be answered |
|---|---|---|---|
| Must answer | First, one at a time, in the order of the grid | The recommended answer is used, marked Proposed, and goes on the list for the client. Work goes on. | Before any FRD that builds on it is accepted. For a question raised while writing stories, before those stories are marked ready. Until then, it comes first at every gate, and an FRD waiting on it can be parked while other work goes on. |
| Should answer | Next, one at a time, in the order of the grid | The recommended answer is used, marked Proposed, and goes on the list for the client | No deadline. It stays open until it's answered, or the client confirms it. |
| Can move ahead | As one list, each with its recommended answer, settled by one decision | The recommended answer is used, marked Proposed, and goes on the list for the client | No deadline |

## 5. Must answer

### Question {n}: {question}

| Part | What it says |
|---|---|
| Raised in | {raised in} |
| Why I'm asking | {why asking} |
| For example | {real case} |
| What it changes | {what it changes} |
| Impact | {impact level}. {impact reason} |
| Severity | {severity level}. {severity reason} |
| Answers | • **{answer}**. Why you'd pick it: {why pick}. What happens next: {what next}<br>• **{answer}**. Why you'd pick it: {why pick}. What happens next: {what next}<br>• **I don't know yet**. What happens next: {if unknown} |
| Recommended | {recommended answer}, because {recommended reason} |
| Answer in use for now | {answer in use} |
| Who can answer | {who answers} |
| Answer by | {answer by} |
| Next best action | {next best action} |

## 6. Should answer

None yet.

## 7. Can move ahead

None yet.

## 8. Answered

None yet.

## Check record

None yet.

## Placeholders

This part is never copied into a document. It says what the template is for, what each section holds, and what to write for each label.

### About this template

- **What this is:** Every question the specifiers are asked in this project, whichever document raised it. Each is rated for impact and severity, and placed in a group that says how soon it must be answered.
- **What it is not:** The answers themselves, in the documents. Each document names the question behind each of its gaps, such as "TBD, question 12", and the decision that settles a question is recorded in the Decision record of the document whose gate asked it.
- **Written by:** probing-questions-author, from `templates/question-log.md`: it drafts and rates each question. grade-questions.cjs places each question in its group, sets the order and checks the log. The log has no gate of its own: its questions are asked at the gates of the documents that raised them, and accept.cjs saves a copy at every acceptance.

### What each section holds

| Section | What it holds |
|---|---|
| 1. Impact | Impact measures rework: how much has to be redone if the answer turns out to be wrong. Every question gets one level, with the reason in its own words. |
| 2. Severity | Severity measures harm: how much harm is done if the work goes ahead on a wrong answer. Every question gets one level, with the reason in its own words. |
| 3. The grid | Where each question goes, from its severity and impact, and the order questions are asked in. Harm comes before reach: severity sets the order first, then impact. grade-questions.cjs places every question by this grid, read from the template, and checks that this copy matches it. |
| 4. What each group does | How each group is asked at a gate, what "I don't know yet" does, and when an answer is due. |
| 5. Must answer | Every open question whose severity is High, in the order of the grid, then by number. Each question keeps its number for life, and every gap it explains names it, such as "TBD, question 12". |
| 6. Should answer | Every open question rated Medium severity with High or Medium impact, or Low severity with High impact. Each has the same parts as a Must answer question. |
| 7. Can move ahead | Every open question rated Medium severity with Low impact, or Low severity with Medium or Low impact. Each has the same parts as a Must answer question. At a gate they are settled together, by one decision. |
| 8. Answered | Every question that a decision has settled, in number order. Each keeps its number and its parts, and gains two more at the end: Answer, the answer given, and Decided in, a link to the Decision record entry that settled it. A re-run of the whole workflow starts the project again from nothing, so this log is archived with the other documents, and no earlier question is asked again. |
| Check record | The last check by grade-questions.cjs, pasted from its "For the file" block. |

### What to write for each label

| Label | What to write | Example |
|---|---|---|
| {product name} | the product's name, as in the BRD | Expense claims |
| {n} | the question's number, from 1, never reused | 3 |
| {question} | one decision, worded so its answers are the real choices, never yes or no, ending in a question mark | Which currencies can a claim be made in? |
| {raised in} | the document and the place that raised it, as a link | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), Silent topic "Currencies" |
| {why asking} | what the files say and what they leave open, citing each file, or saying that no file speaks to it | Every amount in claims-requirements-v2.docx and expense-policy-2026.pdf is in euros, but no file says a claim can't be in another currency |
| {real case} | a real case, with a person and an amount where that helps | Asha, a contractor, pays 120 pounds for a hotel in London. Can she claim it, and for how much? |
| {what it changes} | the parts of the product that depend on the answer | making a claim, the finance approval limit, and the amount that's paid |
| {impact level} | High, Medium or Low, from section 1 | High |
| {impact reason} | why, in one sentence | It reaches three features. |
| {severity level} | High, Medium or Low, from section 2 | High |
| {severity reason} | why, in one sentence | It's about money: a claim in pounds could be paid as if it were in euros. |
| {answer} | one real choice, never starting with "Yes" or "No" | Euros only |
| {why pick} | why the specifier would pick it | nothing in the files mentions another currency |
| {what next} | what happens next if they do | every claim is in euros, and the claimant converts the amount and attaches the receipt |
| {if unknown} | the recommended answer used for now, marked Proposed, who should answer, and by which step | I use "Euros only", marked Proposed, and the finance team is asked before the FRD for making a claim is accepted |
| {recommended answer} | the answer the skill recommends | Euros only |
| {recommended reason} | why, in one sentence | the files point that way, and it's the smaller product |
| {answer in use} | the answer the documents use until this is settled, marked Proposed, or TBD | Euros only, Proposed (needs confirmation) |
| {who answers} | who can answer it: the specifier, or someone named whom the specifier asks | the finance team |
| {answer by} | the step by which it must be answered | before the FRD for making a claim is accepted |
| {next best action} | what the specifier should do now | choose "Euros only" for now, and ask the finance team this week whether staff claim in other currencies |
