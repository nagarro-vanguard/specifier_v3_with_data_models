> **Example.** A worked example of a Question log, for a made-up product called Expense claims. It shows the log while the BRD is at its gate: the Discovery brief has been accepted, and the BRD's first decision is made. There is at least one question in every group. Nothing in it is a real requirement.

# Question log — Expense claims

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

## 6. Should answer

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

grade-questions.cjs, 2026-10-06: 4 open questions (1 must answer, 1 should answer, 2 can move ahead), 4 answered, 0 findings.
