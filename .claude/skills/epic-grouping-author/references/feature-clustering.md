# Feature clustering — the options, the comparison and the recommendation

How `epic-grouping-author` builds the options it offers, compares them and recommends one. The shape of each part is in `../../_shared/templates/epic-grouping.md`. This file says how to fill it well.

## Proposing the options

| Aspect | Details |
|--------|---------|
| **Intent** | Present 2–3 credible ways to group features into EPICs, with pros and cons and a recommendation |
| **Input** | The feature inventory, copied from the Feature catalog |
| **Processing** | Apply 2–3 different strategies from the template's list. Build each option. Write the comparison. Recommend one, with a reason. |
| **Self-check before the gate** | • 2–3 genuinely different options presented<br>• every feature appears in exactly one EPIC per option<br>• each EPIC **name** is a short capability phrase, not an outcome sentence. The outcome is the EPIC's hypothesis.<br>• each **outcome** is a result a person can see, in simple words, with no figure of speech, as `../../_shared/simple-writing-rules.md` says<br>• **no sliver EPICs**. No EPIC is a trivial leftover. MVP and Later splits only where each half is a meaningful increment.<br>• each option has pros AND cons, and names its own clashes in its cons<br>• the recommendation cites its reason<br>• the comparison table is present |

## Each option

- **Cutting angle:** one sentence that says what defines the boundaries in this option.
- **EPICs proposed:** one row per EPIC: its number, a short capability name, its features by ID, and its band. The band is MVP when every feature is Must. It is Later when every feature is Should or Could. It is Mixed when it has both.
- **Pros:** concrete benefits, one per line.
- **Cons:** concrete trade-offs, one per line, including each clash the option creates: a first-band feature that depends on a later-band one, or an EPIC that depends on one sequenced after it.
- **Best if:** one line that says when this option is the right call.

## The comparison

One column per option, every row filled:

| Dimension | What to write |
|-----------|---------------|
| Number of EPICs | the count |
| Cutting angle | the strategy |
| Delivery parallelism | High, Medium or Low |
| Foundational dependency depth | Deep or Shallow |
| Business-value visibility per EPIC | High, Medium or Low |
| Team-boundary alignment | Strong, Weak, or none where teams aren't known |

## The recommendation

- **Recommended option:** the letter.
- **Rationale:** 2–4 sentences explaining WHY, citing whichever of these apply: delivery risk, dependency depth, the order business value arrives in, team boundaries, roadmap constraints.
- **What could change this recommendation:** 1–2 factors the specifier might weigh differently. For example, "if the finance team's rules are still changing, option B keeps them in one EPIC".
