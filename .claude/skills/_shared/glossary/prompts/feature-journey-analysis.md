# Feature to Glossary fit - the mental model

A project-agnostic method for placing a feature against an existing glossary, and classifying it. The glossary is one the OTC method produced. Every claim names its source, and every gap is stated honestly.

> Convention:
> - glossary terms and values are in pills. Kinds are tagged in [square brackets].
> - glossary pages are referred to by the file names harvest gives them
> - words: this prompt reads `.claude/skills/_shared/glossary/method-words.md` first. It uses every method word, such as page, section, kind and relationship, only as that file defines it.
> - LOB means line of business. It is the glossary's own deployment or dialect. In a glossary with two dialects, each LOB is one dialect.
> - the method names no output folder. The analysis lands beside the glossary it reads, or where the person or a calling skill says, as step 1 sets out.
> - companion (separate file): an adversarial verification pass, adversarial-check.md, which checks a finished analysis and does only that

---

## The four reading layers

Every glossary this method reads can be worked at four layers. Each one unravels something different and helps in a different way. The reading order runs top to bottom.

| Layer | What it unravels | How it helps |
|---|---|---|
| Layer 1 - Family | which part of the product a feature belongs to | narrows the search to one family, so you do not read the whole glossary |
| Layer 2 - Term and kind | the agreed word, and whether it is an object, role, step, or state or value | gives the exact word to match, and points to the right page |
| Layer 3 - Structure and movement | how the term connects, and the step-by-step flow with its flow relationships | shows whether the feature can reuse existing rails, and where it plugs in |
| Layer 4 - Proof and borderline judgements | the exact quotes, the LOB differences, the reuse-vs-missing judgement | lets you cite every claim and settle the tricky judgements honestly |

Plain rule: use Layers 1 to 3, the high-level pages, to find and match. Drop into Layer 4, the section deep-dives, to prove and settle. The high-level layers alone are not enough: the citations and the borderline judgements are kept in Layer 4.

---

## 1. Purpose and scope

- Input: any feature, requirement, or change request, stated neutrally.
- Output: the verdict, where the feature sits, and how it moves. The verdict is Fits, Extend, New capability, or Blocked.
- Whether a feature is "new" is an answer the method produces, never an assumption it starts with. The pipeline runs identically whether the result is "you already have this" or "this is net-new".

## 2. When to use it

- Before stories or estimates, as a grounded triage check against an existing glossary.
- On a single feature at a time. Roll the token results up into one verdict.

## 3. The taxonomy: the map you navigate

How a glossary is organised, largest to smallest:
- Glossary: one per LOB. If the feature names no LOB, keep all of them, and mark it an open question.
- Family: a top-level part of each page, identified by its root term.
- Kind: object, role, step, or state or value.
- Term: the individual entry.
- Attached to a term: structure relationships, flow relationships, values, and decisions.
- Cross-cutting objects: terms owned by no single family. Check this list before declaring a gap.

How the LOBs are determined: the feature-fit method does not decide them, it reads them. The LOBs were fixed when the glossary was built, from its sources. They show up as the LOB folders under the glossary, or in the project manifest. One LOB means there is no LOB level at all. If the LOB is unset for a feature, keep all of them, and ask.

## 4. The pages, by what each is for

Filenames vary by project and skill version. Match each page by its job, not its name:

- `object-terms.md`: the objects the product stores, shows, or acts on.
- `step-terms.md`: the stages and actions, in order.
- `terms-and-relationships.md`: the hierarchy and how terms connect.
- `states-and-values.md`: the named conditions and closed value-sets.
- `role-terms.md`: the people the product serves, records, or gives access to.
- `decision-register.md`: synonyms retired, terms split, and why a word was chosen.
- the reconciliation page: the joined view that stitches the sections and the LOBs into one coherent model. It records the resolved conflicts: several words with one meaning, one word with several meanings, a part against its whole, and the drift between LOBs. This is where "same concept across LOBs" is settled, so it has the cross-LOB notes a feature-fit call needs.
- the raw evidence source: whatever folder holds the source quotes, word for word. It is the evidence layer, the section deep-dives. In a glossary built by the OTC harvest skill this is `deep-dives/`, beside the glossary files: one folder per section, each with its draft and a decisions file that maps the source's words to the glossary's words.

Which page serves which layer, from "The four reading layers":

- Layer 1 (family): `terms-and-relationships.md` or the families overview.
- Layer 2 (term and kind): `object-terms.md`, `role-terms.md`, `step-terms.md` and `states-and-values.md`. `decision-register.md` settles synonyms.
- Layer 3 (structure and movement): `terms-and-relationships.md` (connections) and `step-terms.md` (the flow).
- Layer 4, proof and borderline judgements: the section deep-dives, and the reconciliation page for cross-LOB judgements.

Use Layers 1 to 3 to find and match. Use Layer 4 to prove and settle.

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

## 9. Output: the Feature Fit view

- Verdict-first: the business answer on top, attribution underneath.
- Two diagrams:
  - Movement (from `step-terms.md`): how the feature would flow.
  - Model (from `terms-and-relationships.md`): where it sits in the term graph.
  - Both coloured: green for reuse, red for new, blue for a decision.
- Tables for Reuse and Net-new. Counts equal the row counts.
- Plus: Roles, a Steps-followed operation trace, an Evidence and traceability table, and a Files-drawn-on roster near the header. The roster is grouped by the four reading layers, with one small table per layer, and lists only the specific files actually referenced.
- Where it lands: the analysis is written in a feature-fit folder beside the glossary, or where the person or the calling skill specified. This method hardcodes no path.

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

## 11. Worked examples (illustrations only)

- Extend: "show slots for the next 5 days". The whole flow is reuse. The one net-new piece is a display window that is not an existing value.
- New capability: "allocate visitor parking for a period". The component nouns are reused. The capability, to allocate a space to a visitor for a period, is not modelled. The core relationship and steps are absent.

## 12. One-page recap

- Rule: pick the Glossary, narrow to the Family by its root term, let the Kind pick the page, match the Term strictly, then reuse with a citation or declare a gap.
- Ladder: exact, then synonym, then value, then structure or flow relationship, then cross-cutting, then gap.
- Verdict: Fits, Extend, New capability, or Blocked, by the part 8 thresholds.
- Guarantee: the process, structure, vocabulary, and evidence are repeatable and auditable. Judgment is narrowed to a few named points: decomposition grain, the loose family match, and the reuse-vs-gap boundary. That is the honest ceiling, not "fully deterministic".

## 13. Blank template

Copy this template and fill it. Keep the part order. It is the shape every Feature Fit view takes, and filling it the same way each time is what makes the output repeatable.

The blank template is [templates/feature-fit.md](../templates/feature-fit.md).

## 14. Golden examples

Two worked outputs, one per verdict class, for a sample product called Acme, to copy the shape and depth from:

- Extend: examples/feature-fit-acme-booking.md ("show slots for the next 5 days"). The whole flow is reuse, with one net-new value.
- New capability: examples/feature-fit-acme-parking.md ("allocate visitor parking for a period"). The nouns are reused. The capability is not modelled.
