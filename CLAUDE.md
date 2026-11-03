# Working in this kit

## Questions to the user

Every question to the user, at a kit gate or in plain chat, follows probing-questions-author, "Ask: put one decision to the specifier" (`.claude/skills/probing-questions-author/SKILL.md`).

- Ask it with AskUserQuestion: the message above the control has every part, and the control holds the choices.
- Never ask a question in plain text, or in the app's next-step box.
- A hook in `.claude/settings.json` runs `tools/check-question.ts` before every question, and refuses one that doesn't follow the shape. Fix what it lists, and ask again.
