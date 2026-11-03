# Glossary methodology prompts

Two invocable prompts that read a finished glossary and reason against it. They are consumers, not builders: a glossary must already exist, or they stop and ask for one.

## The words they use

Both prompts, and any prompt added here later, read `.skills/_shared/glossary/method-words.md` first and use only its words (`method-words.md`, rule 6). It is the same word list the glossary itself was built with, so a prompt and the glossary it reads never give the same word two meanings.

## The prerequisite

These prompts feed off a glossary produced by the OTC method. With no glossary there is nothing to read, so the first step of each prompt confirms a glossary exists and locates it. If none is found, the prompt stops and asks.

## The two prompts

- feature-journey-analysis.md: takes a feature (a problem statement) and a glossary, and produces a Feature Fit view - where the feature sits, how it moves, and whether it is Fits, Extend, New capability, or Blocked - with every claim cited.
- adversarial-check.md: takes a finished Feature Fit view and its glossary, and adversarially verifies it. One job, findings only. Run it after the analysis, when you want the analysis challenged.

## How to invoke

Invoke a prompt while working in the purview of a glossary. Give it the feature (for the analysis) or the finished analysis (for the check), and point it at the glossary. The prompt resolves the input and output locations as its first step.

## Where output lands

The analysis and the findings land beside the glossary (a feature-fit folder in the project), or where you specify. The prompts hardcode no path.

## LOB

LOB means line of business: the glossary's own deployment or dialect. A two-dialect glossary has one LOB per dialect; a single-line glossary has none. The prompts read the LOBs from the glossary structure; they never guess them.

## Examples

The examples folder holds two Acme golden samples, one per verdict class: feature-fit-acme-booking.md (Extend) and feature-fit-acme-parking.md (New capability). They show the output shape. They are samples for a fictional Acme product, so their citations are illustrative, not a real glossary.
