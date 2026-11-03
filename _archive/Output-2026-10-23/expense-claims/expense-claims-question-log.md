# Question log — Expense claims

> **What this is:** Every question the specifiers are asked in this project, whichever document raised it. Each is rated for impact and severity, and placed in a group that says how soon it must be answered.
>
> **What it is not:** The answers themselves, in the documents. Each document names the question behind each of its gaps, such as "TBD, question 12", and the decision that settles a question is recorded in the Decision record of the document whose gate asked it.
>
> **Written by:** probing-questions-author, from `templates/question-log.md`: it drafts and rates each question. grade-questions.cjs places each question in its group, sets the order and checks the log. The log has no gate of its own: its questions are asked at the gates of the documents that raised them, and accept.cjs saves a copy at every acceptance.

> **Lineage**
> - **Previous step:** every step whose skill raised a question
> - **Primary source:** Does not exist. Each question names the document that raised it.
> - **Supporting sources:**
>   - [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md)
>   - [expense-claims-brd.md](expense-claims-brd.md)
> - **Next step:** each open question is asked at the next gate, in the order below

## 1. Impact

*Impact measures rework: how much has to be redone if the answer turns out to be wrong. Every question gets one level, with the reason in its own words.*

| Impact | What it means | If the answer is wrong | Example |
|---|---|---|---|
| High | The answer reaches several features, through any of:<br>• the scope<br>• an objective<br>• who the users are<br>• a business requirement that several features serve | Many features and stories are built on it, and are redone through a change or a re-run | Who can make a claim: employees only, or contractors too? |
| Medium | The answer reaches one feature, or one capability's rules, even when they are written as a business requirement | One FRD and its stories are redone | Above what amount must the finance team also approve a claim? |
| Low | The answer reaches one detail inside a feature, or something nothing is built on, such as a KPI's target | That one detail is corrected, and nothing else moves | What must a manager write when rejecting a claim? |

## 2. Severity

*Severity measures harm: how much harm is done if the work goes ahead on a wrong answer. Every question gets one level, with the reason in its own words.*

| Severity | What it means | If the answer is wrong | Example |
|---|---|---|---|
| High | The answer touches any of:<br>• the law, a policy or a contract<br>• money<br>• personal data<br>• whether people can do their job at all | Real harm is done:<br>• a law, policy or contract is broken<br>• money is paid wrongly<br>• personal data is exposed<br>• people can't do their job | Above what amount must the finance team also approve a claim? With the wrong limit, claims are paid without an approval the policy requires. |
| Medium | The answer touches how quickly or easily people get things done | People are slowed down or confused, and a change fixes it before anyone is harmed | Who approves a claim when the manager is away? Claims wait an extra week. |
| Low | The answer touches how things look, read or are measured | Nobody is harmed or slowed. At most, something looks or reads wrong. | What is the target for days from claim to payment? A target set too low harms nobody. |

## 3. The grid

*Where each question goes, from its severity and impact, and the order questions are asked in. Harm comes before reach: severity sets the order first, then impact. grade-questions.cjs places every question by this grid, read from the template, and checks that this copy matches it.*

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

*How each group is asked at a gate, what "I don't know yet" does, and when an answer is due.*

| Group | How it's asked | If the specifier doesn't know yet | When it must be answered |
|---|---|---|---|
| Must answer | First, one at a time, in the order of the grid | The recommended answer is used, marked Proposed, and goes on the list for the client. Work carries on. | Before any FRD that builds on it is accepted. For a question raised while writing stories, before those stories are marked ready. Until then, it comes first at every gate, and an FRD waiting on it can be parked while other work carries on. |
| Should answer | Next, one at a time, in the order of the grid | The recommended answer is used, marked Proposed, and goes on the list for the client | No deadline. It stays open until it's answered, or the client confirms it. |
| Can move ahead | As one list, each with its recommended answer, settled by one decision | The recommended answer is used, marked Proposed, and goes on the list for the client | No deadline |

## 5. Must answer

*Every open question whose severity is High, in the order of the grid, then by number. Each question keeps its number for life, and every gap it explains names it, such as "TBD, question 12".*

### Question 4: Which currencies can a claim be made in?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), section 5, Assumed |
| Why I'm asking | Every amount in claims-requirements-v2.docx and expense-policy-2026.pdf is in euros, but no file says a claim can't be in another currency. |
| For example | Asha, a contractor, pays 120 pounds for a hotel in London. Can she claim it, and for how much? |
| What it changes | making a claim, the finance approval limit of 500, and the amount that's paid |
| Impact | High. It reaches three features. |
| Severity | High. It's about money: with no rule, a claim in pounds could be paid as if it were in euros. |
| Answers | • **Euros only**. Why you'd pick it: nothing in the files mentions another currency. What happens next: every claim is in euros, and the claimant converts the amount and attaches the receipt.<br>• **Any currency, converted by the claimant**. Why you'd pick it: staff travel abroad, and the claimant knows the rate they paid. What happens next: the claim holds both amounts, and the finance team checks the conversion.<br>• **Any currency, converted at the day's rate**. Why you'd pick it: staff travel abroad, and one rate is fairer. What happens next: the product needs each day's exchange rate, and the 500 limit is checked after conversion.<br>• **I don't know yet**. What happens next: I use "Euros only", marked Proposed, and the finance team is asked before the FRD for making a claim is accepted. |
| Recommended | Euros only, because the files point that way, and it's the smaller product |
| Answer in use for now | Euros only, Proposed (needs confirmation) |
| Who can answer | the finance team |
| Answer by | before the FRD for making a claim is accepted |
| Next best action | Ask the finance team this week whether staff claim in other currencies, because the answer changes three features. |

### Question 10: How is a contractor's approved claim paid: in the monthly payroll run, or outside it, by the finance team?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-brd.md](expense-claims-brd.md), section 4, Dependencies, "The monthly payroll run pays approved claims" |
| Why I'm asking | payroll-cutoff-2026-09-20.eml says approved claims are paid with the monthly payroll run. expense-policy-2026.pdf, section 1.1, makes contractors claimants too, and BR-01 includes them. No file says whether contractors are paid through the payroll run. |
| For example | Asha, a contractor, has a 120 euro taxi claim approved on the 12th. If she is not on the payroll, the payroll run on the 20th has nothing to pay her through. |
| What it changes | • who is paid, and how<br>• the payroll cut-off on the 20th, and whether it holds for contractors<br>• the objective "Pay approved claims faster", measured in working days to payment |
| Impact | High. It reaches who the users are and the scope of paying, which several features and an objective rest on. |
| Severity | High. It's about money: a contractor's approved claim could be left unpaid, or paid through the wrong route. |
| Answers | • **In the monthly payroll run, like an employee's**. Why you'd pick it: the payroll email names one route for approved claims, and one route keeps the product small. What happens next: the BRD keeps its one dependency, and the payroll lead confirms that contractors are on the payroll run.<br>• **Outside the payroll run, by the finance team**. Why you'd pick it: contractors may not be on the company's payroll at all. What happens next: the BRD gains a second way to pay, with its own dependency, and the payroll cut-off holds for employees only.<br>• **I don't know yet**. What happens next: I use "In the monthly payroll run, like an employee's", marked Proposed, and the payroll lead is asked before the BRD is accepted. |
| Recommended | In the monthly payroll run, like an employee's, because it is the only route any file names, and the payroll lead can confirm it in one reply |
| Answer in use for now | In the monthly payroll run, like an employee's, Proposed (needs confirmation) |
| Who can answer | the payroll lead, who sent payroll-cutoff-2026-09-20.eml, asked by the PO |
| Answer by | before the BRD is accepted |
| Next best action | Choose "In the monthly payroll run" now, and ask the payroll lead this week whether contractors are on the payroll run. |

### Question 11: Which year's budget does a claim sent at the end of the financial year come from: the year the expense was paid, or the year the claim is paid?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), section 6, Risks and edge cases, "Claims sent in the last days of the financial year" |
| Why I'm asking | The Discovery brief names the risk that claims sent in the last days of the financial year may be paid from the next year's budget, and payroll-cutoff-2026-09-20.eml says claims approved after the 20th are paid the following month. No file says which year's budget a claim belongs to, and the BRD's risks don't carry this one. |
| For example | Tom pays 900 euros for a conference on the 28th of the last month of the financial year. His claim is approved on the 30th, and paid the next month, in the new financial year. |
| What it changes | • what each claim records about when each expense was paid<br>• whether claims have a year-end deadline for sending<br>• the BRD's risks and constraints |
| Impact | Medium. It reaches one capability's rules: making a claim. |
| Severity | High. It's about money: a cost counted in the wrong year's budget misstates both years. |
| Answers | • **The year the expense was paid**. Why you'd pick it: the cost belongs to the year it happened, which is the risk the Discovery brief names. What happens next: each expense line keeps the date it was paid, and the finance team counts year-end claims against the old year.<br>• **The year the claim is paid**. Why you'd pick it: nothing new to build, and it follows the payroll run as it is. What happens next: no rule is added, and the BRD lists it as a constraint.<br>• **I don't know yet**. What happens next: I use "The year the expense was paid", marked Proposed, and the finance team is asked before the FRD for making a claim is accepted. |
| Recommended | The year the expense was paid, because the Discovery brief names the cost landing in the next year's budget as the risk |
| Answer in use for now | The year the expense was paid, Proposed (needs confirmation) |
| Who can answer | the finance team |
| Answer by | before the FRD for making a claim is accepted |
| Next best action | Choose "The year the expense was paid" now, and ask the finance team how year-end paper claims are counted today. |

### Question 12: While the line manager is away, whose approval lets a claim be paid: their own manager's, or the line manager's only?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-brd.md](expense-claims-brd.md), section 7, Release criteria, criterion 2 |
| Why I'm asking | expense-policy-2026.pdf, section 2.1, says a claim is approved by the employee's line manager, and the BRD's release criterion 2 follows it: no claim is paid without its line manager's approval. Decision 4 in the Discovery brief chose the manager's own manager as the approver while the manager is away. No file says whether the policy allows that. |
| For example | Priya's manager is on leave for two weeks. His own manager, Sunil, approves her 640 euro hotel claim. Under release criterion 2 as written, it can't be paid. |
| What it changes | • release criterion 2<br>• the rule for an absent manager, in the FRD for approving a claim<br>• whether the product keeps to the expense policy |
| Impact | Medium. It reaches one capability's rules: approving a claim. |
| Severity | High. It touches a policy: a claim paid without the approval the policy names breaks it. |
| Answers | • **Their own manager's approval is enough**. Why you'd pick it: it keeps Decision 4, so no claim waits for an absent manager. What happens next: release criterion 2 is reworded to allow the manager's own manager, and the Chief Financial Officer is asked to confirm that the policy allows it.<br>• **The line manager's approval only**. Why you'd pick it: expense-policy-2026.pdf ranks first, and its section 2.1 names the line manager. What happens next: Decision 4 is revisited, and a claim waits until its line manager is back.<br>• **I don't know yet**. What happens next: I use "Their own manager's approval is enough", marked Proposed, and the Chief Financial Officer is asked before the FRD for approving a claim is accepted. |
| Recommended | Their own manager's approval is enough, because it keeps the decision already made, and the policy names who approves without saying what happens when they are away |
| Answer in use for now | Their own manager's approval is enough, Proposed (needs confirmation) |
| Who can answer | the Chief Financial Officer, who owns expense-policy-2026.pdf, asked by the PO |
| Answer by | before the FRD for approving a claim is accepted |
| Next best action | Choose "Their own manager's approval is enough" now, and ask the Chief Financial Officer this week to confirm that the policy allows it. |

## 6. Should answer

*Every open question rated Medium severity with High or Medium impact, or Low severity with High impact. Each has the same parts as a Must answer question.*

### Question 6: What happens to a claimant's open claims when they leave the company?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-brd.md](expense-claims-brd.md), section 6, Risks |
| Why I'm asking | No file speaks to it. The Discovery brief lists it as a risk: nobody may be left to approve the claims of someone who has left. |
| For example | Tom sends a 310 euro claim on his last day. His manager is on leave, and his account closes the next morning. |
| What it changes | the approval rules, and who can see a claim after its claimant has gone |
| Impact | Medium. It reaches one capability's rules: approving a claim. |
| Severity | Medium. A claim that nobody can approve waits, and a change fixes it before anyone is harmed. |
| Answers | • **They go to the claimant's line manager as usual**. Why you'd pick it: nothing new to build. What happens next: claims still go to the manager, who approves them as normal.<br>• **They pass to the line manager's own manager**. Why you'd pick it: it matches the rule for an absent manager. What happens next: the approval FRD gains a rule for leavers.<br>• **The finance team closes them**. Why you'd pick it: someone in finance already checks leavers' pay. What happens next: the finance team gets a list of leavers' open claims.<br>• **I don't know yet**. What happens next: I use "They pass to the line manager's own manager", marked Proposed, and the question goes on the list for the client. |
| Recommended | They pass to the line manager's own manager, because it matches the rule already decided for an absent manager |
| Answer in use for now | They pass to the line manager's own manager, Proposed (needs confirmation) |
| Who can answer | the finance team |
| Answer by | before the FRD for approving a claim is accepted |
| Next best action | Take the recommended answer, and ask the finance team how leavers' claims are handled on paper today. |

## 7. Can move ahead

*Every open question rated Medium severity with Low impact, or Low severity with Medium or Low impact. Each has the same parts as a Must answer question. At a gate they are settled together, by one decision.*

### Question 8: How soon should a manager be reminded about a claim waiting for approval?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-brd.md](expense-claims-brd.md), section 6, Risks |
| Why I'm asking | payroll-cutoff-2026-09-20.eml says claims approved after the 20th wait a month, but no file says when a waiting claim should be chased. |
| For example | Priya sends a claim on the 15th. Her manager hasn't looked at it by the 19th. |
| What it changes | one detail of approving a claim: when the reminder goes |
| Impact | Low. It's one detail inside one feature. |
| Severity | Medium. Claims that miss the 20th are paid a month late. |
| Answers | • **After 3 working days**. Why you'd pick it: most claims still make the 20th. What happens next: the approval FRD has a reminder rule set at 3 working days.<br>• **After 5 working days**. Why you'd pick it: fewer reminders for managers. What happens next: more claims miss the 20th.<br>• **Two days before the 20th**. Why you'd pick it: it's tied to the payroll cut-off. What happens next: one reminder each month, whenever the claim came in.<br>• **I don't know yet**. What happens next: I use "After 3 working days", marked Proposed. |
| Recommended | After 3 working days, because most claims still make the 20th |
| Answer in use for now | After 3 working days, Proposed (needs confirmation) |
| Who can answer | the specifier |
| Answer by | before the FRD for approving a claim is accepted |
| Next best action | Take the recommended answer with the Can move ahead list at the BRD's gate. |

### Question 7: What targets must the two success measures reach?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-brd.md](expense-claims-brd.md), section 3, Objectives and success metrics |
| Why I'm asking | workshop-notes-2026-09-12.md gives today's figures, 18 working days and 1 claim in 5 sent back, but no file gives a target for either. |
| For example | If the target is 10 working days and the service brings it to 12, the team needs to know whether that counts as success. |
| What it changes | the two KPI targets in the BRD, and nothing that gets built |
| Impact | Low. Nothing is built on a target. |
| Severity | Low. A target set too low harms nobody. |
| Answers | • **The finance team sets both targets**. Why you'd pick it: they own the measures. What happens next: both targets stay TBD until the finance team replies.<br>• **10 working days, and 1 claim in 20 sent back**. Why you'd pick it: it gives the finance team something to react to. What happens next: both targets read Proposed until the finance team confirms them.<br>• **I don't know yet**. What happens next: both targets stay TBD, and the question goes on the list for the client. |
| Recommended | The finance team sets both targets, because a target is theirs to set |
| Answer in use for now | TBD |
| Who can answer | the finance team |
| Answer by | before the product is released |
| Next best action | Take the recommended answer with the Can move ahead list at the BRD's gate, and add both targets to the list for the client. |

## 8. Answered

*Every question that a decision has settled, in number order. Each keeps its number and its parts, and gains two more at the end: Answer, the answer given, and Decided in, a link to the Decision record entry that settled it. On a re-run of the whole workflow, a question you answered before is asked again, keeping its number: its answer becomes the recommended one, with the date you chose it, and it goes back to its group until you answer it again.*

### Question 1: When the approving manager is away, who approves the claim?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), section 3, Silent topic "The approving manager is away" |
| Why I'm asking | No file speaks to it. claims-requirements-v2.docx, section 3.1, says the line manager approves every claim, and nothing says what happens when they are away. |
| For example | Priya's manager is on leave for two weeks, and Priya's 640 euro hotel claim is waiting. |
| What it changes | the approval rules |
| Impact | Medium. It reaches one capability's rules: approving a claim. |
| Severity | Medium. Claims wait, and a change fixes it before anyone is harmed. |
| Answers | • **The manager's own manager**. Why you'd pick it: no claim waits, and the approver is still someone senior to the claimant. What happens next: the FRD for approval gets a stand-in rule.<br>• **The claim waits until the manager is back**. Why you'd pick it: the simplest rule, with nothing new to build. What happens next: no stand-in rule, and claims may wait for weeks.<br>• **The claimant picks another approver**. Why you'd pick it: the claimant knows who is around. What happens next: the FRD needs rules on who may be picked.<br>• **I don't know yet**. What happens next: I use "The manager's own manager", marked Proposed. |
| Recommended | The manager's own manager, because no claim waits, and the approver is still senior to the claimant |
| Answer in use for now | The manager's own manager |
| Who can answer | the specifier |
| Answer by | before the FRD for approving a claim is accepted |
| Next best action | Answer it at the Discovery brief's gate. |
| Answer | The manager's own manager |
| Decided in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), Decision 4 |

### Question 2: How will we know the new service has worked?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), section 3, Silent topic "How success is measured" |
| Why I'm asking | No file speaks to it. The BRD needs objectives, and a way to measure each one. |
| For example | A year after go-live, the finance director asks whether the service was worth it. |
| What it changes | the BRD's objectives and how each is measured |
| Impact | High. Objectives shape every feature. |
| Severity | Low. A measure chosen badly harms nobody. |
| Answers | • **Fewer days from claim to payment**. Why you'd pick it: it's the pain the workshop raised first. What happens next: one objective, measured in working days.<br>• **Fewer claims sent back for a missing receipt**. Why you'd pick it: it's the finance team's biggest cost. What happens next: one objective, measured as a share of claims.<br>• **Both**. Why you'd pick it: each is a real pain today. What happens next: two objectives, each with its own measure.<br>• **I don't know yet**. What happens next: I use "Both", marked Proposed. |
| Recommended | Both, because each is a real pain today |
| Answer in use for now | Both |
| Who can answer | the specifier |
| Answer by | before the BRD is accepted |
| Next best action | Answer it at the Discovery brief's gate. |
| Answer | Both |
| Decided in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), Decision 5 |

### Question 3: When the requirements and the expense policy give different finance approval limits, which limit holds?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), section 4, clash 3 |
| Why I'm asking | claims-requirements-v2.docx, section 3.2, says 500. expense-policy-2026.pdf, section 4.1, says 1,000. The policy ranks higher, but the requirements are newer. |
| For example | Tom claims 750 euros for a training course. Under one limit the finance team approves it, and under the other it doesn't. |
| What it changes | business requirement BR-03, and the approval rules |
| Impact | Medium. It reaches one capability's rules, even though it is written as a business requirement. |
| Severity | High. It's about money and a policy: with the wrong limit, claims are paid without an approval the policy requires. |
| Answers | • **1,000, as the policy says**. Why you'd pick it: the policy ranks first. What happens next: the BRD and PRD use 1,000.<br>• **500, as the requirements say**. Why you'd pick it: the finance team may have lowered the limit since the policy was written. What happens next: the BRD and PRD use 500, and the policy owner is told.<br>• **I don't know yet**. What happens next: I use 1,000, marked Proposed, and the finance team is asked before the FRD for approving a claim is accepted. |
| Recommended | 1,000, as the policy says, because the policy ranks first |
| Answer in use for now | 500 |
| Who can answer | the finance team |
| Answer by | before the FRD for approving a claim is accepted |
| Next best action | Ask the finance team which limit they mean before the approval FRD is written. |
| Answer | Other: 500. The finance team confirmed on 2 October that 500 is the new limit, and the policy will be updated. |
| Decided in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), Decision 2 |

### Question 5: What happens to paper claims once the service goes live?

| Part | What it says |
|---|---|
| Raised in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), section 5, Assumed |
| Why I'm asking | The requirements describe no paper route, and workshop-notes-2026-09-12.md, item 11, calls the paper form "the old way", but no file says when it stops. |
| For example | Sam sent a paper claim on the day before go-live. It hasn't been approved yet. |
| What it changes | the scope: whether the product also takes in paper claims |
| Impact | High. It decides the scope. |
| Severity | Medium. Claimants are slowed or confused, and a change fixes it before anyone is harmed. |
| Answers | • **None are taken**. Why you'd pick it: one route for every claim. What happens next: paper claims are refused from go-live.<br>• **They're taken for a set period**. Why you'd pick it: claimants get time to switch. What happens next: the product needs a way to enter a paper claim.<br>• **Only claims already open are finished on paper**. Why you'd pick it: nothing new to build, and nobody's claim is lost. What happens next: a release criterion covers the paper claims open on go-live day.<br>• **I don't know yet**. What happens next: I use "Only claims already open are finished on paper", marked Proposed. |
| Recommended | Only claims already open are finished on paper, because nothing new is built and nobody's claim is lost |
| Answer in use for now | Only claims already open are finished on paper |
| Who can answer | the specifier |
| Answer by | before the BRD is accepted |
| Next best action | Answer it at the Discovery brief's gate. |
| Answer | Only claims already open are finished on paper |
| Decided in | [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md), Decision 3 |

## Check record

*The last check by grade-questions.cjs, pasted from its "For the file" block.*

grade-questions.cjs, 2026-10-06: 4 open questions (1 must answer, 1 should answer, 2 can move ahead), 4 answered, 0 findings.
