# Feature Fit — the parts change-request-disposition uses

> **What this is:** The Feature Fit method's procedure, match ladder, three-lens read, verdict thresholds and determinism rules, copied word for word from `../../_shared/glossary/prompts/feature-journey-analysis.md`, sections 5 to 8 and 10.
>
> **What it is not:** The whole method, or its output. Its Feature Fit view, part 9, isn't used by change-request-disposition. The analysis goes into sections 5 and 7 to 10 of the Change impact report instead.
>
> **Who uses it:** change-request-disposition, to find a change's verdict and draw its journey, before the update test.

Where a part below names "part 7", "part 8", "part 9" or "part 10", it means the section of that number in the method.

## 5. Operating procedure (the steps)

- Step 1 (glossary and location): confirm a glossary exists. Resolve where the glossary is, as the input, and where the analysis will be written, as the output. If no glossary is present, stop and ask for it. A feature-fit cannot run without one. A skill that uses this method may name the output. Then the analysis goes where that skill says, such as sections 5 and 7 to 10 of the Change impact report, which change-request-disposition writes. Otherwise, if the output location is unclear, default to a feature-fit folder beside the glossary, and ask if that is wrong.
- Step 2 (frame): fix the definition of done. Every claim cites a source. Land on a real term, or declare a gap.
- Step 3 (decompose): apply the tokenization rule (part 10).
- Step 4 (entry point): rank tokens by how specific they are. Prefer a noun one family owns over a cross-cutting one. Enter at the primary object of the main verb. Then run the secondary tokens as a second pass. They are the qualifiers and the cross-cutting nouns. They catch other readings, and the places where two families meet.
- Step 5 (taxonomy per token): take each token through the taxonomy: Glossary -> Family -> Kind -> Term. Find the Family through its root term. The Kind picks the page.
- Step 6 (three-lens read): part 7.
- Step 7 (classify, roll up): the token results roll up into one verdict, through the thresholds in part 8.
- Step 8 (output): the Feature Fit view (part 9). When a skill named the output in step 1, the analysis goes into that skill's own document instead, in the shape that skill gives, and part 9 isn't used.

## 6. The match ladder (strict, per token)

Try the rungs in order. Stop at the first hit:

- exact term
- synonym in the decision register, which points to the agreed term
- value in a value-set
- structure or flow relationship
- cross-cutting object
- none: a gap

Rule: family narrowing is loose, by topic. Term matching is strict: the exact term, or its synonym in the decision register. That strictness is what prevents invention.

## 7. The three-lens read

- Ontology: does the term exist? (`object-terms.md`, `states-and-values.md`, `decision-register.md`)
- Topology: where does it sit, and how does it connect? (`terms-and-relationships.md`)
- Choreography: how does it move, and what locks or unlocks it? (`step-terms.md`)
- Roles: who acts? (`role-terms.md`)

Rule: a "where does it sit, how does it move" question is answered by topology and choreography, not ontology alone.

## 8. Verdict vocabulary and thresholds

- Fits: every token resolves to an existing term, value, or relationship. Nothing is net-new.
- Extend: the primary object exists. Only a value, an attribute, or a single step is missing.
- New capability: the primary object's core relationship or step is absent, even if the component nouns exist. The capability is not modelled.
- Blocked: a decision must be settled before the verdict can be fixed. The decision is about the LOB, the reading, or the view the feature appears in.

## 10. Determinism rules: the inputs that fix the output

- Tokenization rule: one token per noun phrase, for the objects. One per verb, for the actions. One per qualifier or constraint, such as scope, time or state. Drop pure connectors. Test each token on its own.
- Kind decision rule: a person is a role. Something the system stores, shows, or acts on is an object. An action or stage is a step. A status or a fixed value-set is a state or value. A connection between two terms is a Relationship or Gate. A token may be more than one Kind: test each, and give each its own row.
- Verdict thresholds: as in part 8. The verdict follows the rule, not a feel.
- Evidence discipline: every claim cites a source. Nothing is invented. A gap is a valid answer. Never borrow an analogue from another family or object to fill a gap.
- LOB is a variable: if the LOB is unset, keep every LOB in the analysis, and ask. Never pick one silently.
- Qualifier materiality: a qualifier is tested as its own relationship, not folded into the head noun. For example, "visitor" is the qualifier in "visitor parking".
- Split by Kind means a new row. Differ by LOB means the same row, with LOB columns.
- Counts derive from tables, so the claim cannot drift from the output.
- Presentation: diagram prefixes are uniform. A glossary node starts with its Kind. A node that is only in the flow starts with its place in the flow: Trigger, Role, Decision or Outcome. The colours are green for reuse, red for new, and blue for a decision. Pills are portable. Terms and values are in pills, file names are in italics, and Kind tags are in square brackets. One item per line where a real list belongs.
- Show each point that can't be decided as a question, before the stories.
