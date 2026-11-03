---
name: stories-workflow
allowed-tools: Read, Glob, Grep, Bash, Skill
description: >-
  The workflow after the FRDs: takes one EPIC from its brief to ready stories. It
  names the next EPIC, checks whether it gets an EPIC brief, then runs epic-author
  in brief mode if it does, story-drafter, story-groomer and ac-author, stopping
  at each one's gate. Use once the FRDs of an EPIC's own features are accepted, even
  while another FRD is parked, and again for each EPIC, for example
  "write the stories for the next EPIC of expense-claims", or from a named step for
  named stories. Not for the FRDs (use frd-workflow).
---

# stories-workflow

> **What this is:** The workflow that takes one EPIC from its brief, if it has one, to stories ready to build.
>
> **What it is not:** A skill. It writes nothing, checks nothing and decides nothing itself: the programs route, and each skill holds its own check and its own gate.
>
> **Who uses it:** A specifier, once the FRDs of an EPIC's own features are accepted, and again for each EPIC. A change's paths, from a named step for named stories.

This workflow follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. Each skill it calls loads what it needs.

## One run

- **Covers:** one EPIC.
- **Starts when:**
  - the FRDs of the EPIC's own features are accepted. Another FRD may still be waiting or parked. story-drafter checks this in its step 1.
  - a change's path names step 3, 4, 5 or 6, in section 15 of its Change impact report
- **Ends with:** that EPIC's stories marked ready.
- **Next:** run it again for the next EPIC. When every EPIC is ready, the flow is done, and a change comes in through `change-request-workflow`. In a change, the next row of the change's path.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `route-next-epic.ts` | start | • EPIC register<br>• every Story list | none | the next EPIC that isn't waiting on a parked one or on a Must answer question | none | none | 2, or "every EPIC ready" |
| 2 | `route-brief-list.ts` | 1 | EPIC grouping | none | yes or no | none | none | yes: 3<br>no: 4 |
| 3 | `epic-author`, brief mode | 2 | EPIC register | • BRD<br>• PRD<br>• Feature catalog | • EPIC brief<br>• Question log | `check-epic-brief.ts` | Accept the EPIC brief? | 4 |
| 4 | `story-drafter` | 2 or 3 | • EPIC register<br>• FRDs<br>• Design, if any | • Glossary<br>• BRD<br>• PRD | • Story list<br>• story shells<br>• Question log | `check-stories.ts` | Approve the split? All stories together. | 5 |
| 5 | `story-groomer` | 4 | • Story list<br>• story shells | • FRDs<br>• Feature catalog<br>• BRD<br>• EPIC brief<br>• Glossary | • Stories, groomed<br>• Question log | `check-stories.ts` | Accept the grooming? All stories together. | 6 |
| 6 | `ac-author` | 5 | Stories | • FRDs<br>• Glossary | • Stories, with acceptance criteria<br>• ready marks<br>• Question log | • `check-stories.ts`<br>• `coverage-check.ts` | Accept the criteria? This marks the stories ready. While a Must answer question raised in these stories is open, they can't be marked ready. | end of this run |

## How it runs

1. Run `node tools/route-next-epic.ts --project {project}`. When the specifier names an EPIC, use that one instead. If it prints "Every EPIC ready.", print that line and stop.
2. Run `node tools/scaffold-project.ts --project {project} --epic {epic folder}`.
3. Run `node tools/route-brief-list.ts --project {project} --epic {EPIC ID}`. On "yes", call epic-author in brief mode for the EPIC, and wait for its gate. On "no", go to the next step.
4. Call story-drafter, then story-groomer, then ac-author, for the EPIC, each waiting for its gate to end. When the specifier names a step and the stories it covers, start at that step, for those stories only.
   - **In a change:** run only the steps the change's path names, for the EPIC and the stories it names. Give each skill the change's number. A story already marked ready is never changed: the path sends a new story for the difference to story-drafter.
5. **The ready guard:** the stories can't be marked ready while a Must answer question raised in them is open. ac-author asks each such question first. If one can't be answered yet, the EPIC can be parked, and other work goes on.
6. Add nothing between the steps. Each skill runs probing-questions-author and `grade-questions.ts` inside itself, before its check and its gate, so the workflow has no steps of its own.
7. Run `node tools/route-next-epic.ts --project {project}` again, and print its first line, which says what comes next. In a change, print the next row of the change's path instead.

**Putting a ready story into a tracker,** such as a GitHub issue: use the reader's copy, `node tools/reader-copy.ts --file {Story file}`, as the issue's body. It leaves out the citations, which only the kit's programs need. The Story file keeps them, and stays the agreed copy: a change to the story is made in the file, and the reader's copy is made again.

## How it goes back

- **A rule in an FRD that holds two behaviours:** the rule is split only in its FRD, through a change, because a story quotes its rules word for word. Until then, the story's scenarios test each behaviour on its own.
- **A Must answer question raised in the stories:** answer it at ac-author's gate, or park the EPIC. A parked EPIC goes to the back of the queue.
- **Any other mistake in a document already accepted:** a change, through `change-request-workflow`.
