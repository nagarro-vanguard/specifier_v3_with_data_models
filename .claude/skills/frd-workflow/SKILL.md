---
name: frd-workflow
allowed-tools: Read, Glob, Grep, Bash, Skill
description: >-
  The workflow after the EPIC register: writes one FRD per run.
  route-next-capability.ts names the next capability, in EPIC register order,
  with any waiting on a Must answer question, then parked ones, last. Then
  frd-author writes its FRD and holds its gate. Use once the EPIC register is written, and again after each FRD is
  accepted, for example "write the next FRD for expense-claims", or naming the
  capability, such as "the FRD for Claim approval". Not for the Feature catalog
  (use features-and-epics-workflow) or the stories (use stories-workflow).
---

# frd-workflow

> **What this is:** The workflow that writes the FRDs, one per run, in the order the EPICs are built.
>
> **What it is not:** A skill. It writes nothing, checks nothing and decides nothing itself: `route-next-capability.ts` names what comes next, and frd-author holds its own check and its own gate.
>
> **Who uses it:** A specifier, once the EPIC register is written, and again after each FRD is accepted. A change's path, from step 2, for the FRDs it names.

This workflow follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. frd-author loads what it needs.

## One run

- **Covers:** one FRD.
- **Starts when:**
  - the EPIC register is written, or the previous FRD is accepted
  - a change's path names step 2, in section 15 of its Change impact report
- **Ends with:** one accepted FRD.
- **Next:** run it again for the next capability. `stories-workflow` can start on an EPIC once the FRDs of its own features are accepted. Other FRDs can still be open. In a change, the next row of the change's path.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `route-next-capability.ts` | start | • EPIC register<br>• Feature catalog<br>• the FRDs' status lines | none | the next capability, with any waiting on a Must answer question, then parked ones, last | none | none | 2, or "every FRD accepted" |
| 2 | `frd-author` | 1 | Feature catalog | • PRD<br>• Glossary<br>• data model files | • FRD<br>• Question log | `check-frd.ts` | Accept the FRD? The Must answer questions it builds on come first, one at a time. While one is open, the FRD can't be accepted: answer it, or park the FRD. | end of this run |

## How it runs

1. Run `node tools/scaffold-project.ts --project {project}`.
2. Run `node tools/route-next-capability.ts --project {project}`. When the specifier names a capability, use that one instead.
   - If it prints "Every FRD accepted: next, run stories-workflow.", print that line and stop.
   - **In a change:** skip the routing. Call frd-author for each FRD the change's path names, with the change's number. frd-author then works in its "In a change" mode.
   - **An accepted FRD that waits on a data model answer now settled,** such as "waits on DM-5": `status.ts` lists it, and names frd-author for it. Skip the routing. Call frd-author for that FRD, and name the settled answer. frd-author then works as its part "When an answer it waits on is settled" says. This moves forward, from the data model to the FRD.
3. Call frd-author with the project and the capability, and wait for its gate to end:
   - **Accepted:** the run ends.
   - **Parked,** while a Must answer question it builds on waits for someone else: the run ends, and the next run routes to other work first.
4. Add nothing between the steps. frd-author runs probing-questions-author and `grade-questions.ts` inside itself, before its check and its gate, so the workflow has no steps of its own.
5. Run `node tools/route-next-capability.ts --project {project}` again, and print its first line, which says what comes next. In a change, print the next row of the change's path instead.

## How it goes back

- **A decision that changes a data model answer** doesn't go back. Instead, frd-author writes the new answer in the FRD, with a note that names the decision. The data model stays as it is.- **A "Done when" piece that proves wrong:** frd-author never changes it. It raises a question, and the Feature catalog is changed through a change.
- **A Must answer question still open:** answer it at the gate, or park the FRD. A waiting or parked FRD goes to the back of the queue, and `route-next-capability.ts` names it again later.
