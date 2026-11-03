# How the kit's programs are written

> **What this is:** The rules for every program in `tools/`, its library in `tools/lib/`, and its tests in `tools/tests/`.
>
> **What it is not:** What each program checks. That is in each program's opening comment, and in the skill that runs it.

## 1. TypeScript that Node.js runs as it is

- Every program is a `.ts` file. Node.js runs it directly, such as `node tools/check-brd.ts --project expense-claims`. There is no build step, and no compiled copy.
- Node.js only removes the types. So use only TypeScript that can be removed:
  - no `enum`: use a list `as const`, and take its type from the list
  - no `namespace`
  - no constructor parameter properties, such as `constructor(private name: string)`
- `npm run typecheck` checks the types. It needs `npm install` once. The programs themselves need only Node.js 24.2 or later.

## 2. Imports

- Import each function by its name, with the file's `.ts` ending: `import { tableUnder, list } from './lib/md-tables.ts';`
- Import Node.js's own modules with `node:`: `import fs from 'node:fs';`
- Import a type with `type`: `import type { Row } from './lib/md-tables.ts';`
- Use `import.meta.dirname` for the program's folder, never `__dirname`.
- Never use top-level `await`. An older program could not load the file.

## 3. Types

- Keep them few and small. Type what goes into a function and what comes out. Let TypeScript work out the rest.
- Use `interface` for the shape of an object, and `type` for a choice, such as `'drafted' | 'accepted' | 'parked'`.
- Never use `any`. Data from a JSON file or from outside the program is `unknown` until it is checked.
- A type that only one file uses stays in that file. A type that several files share lives in the file that makes it, such as `Row` in `lib/md-tables.ts`. `lib/types.ts` holds only the shapes a check program hands to `report()`.

## 4. How a program starts

Every program starts and ends the same way, through `lib/cli.ts`:

```ts
import { parseArgs, requireOption, textOption, today, programName, runMain, type ExitCode } from './lib/cli.ts';

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const project = requireOption(args, 'project', 'Use: node tools/check-brd.ts --project <p>');
  const date = textOption(args, 'date') ?? today();
  ...
  return findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
```

- Exit code 0: every check passed. 1: a check found something. 2: the program could not run, such as a missing file. Throw a `LayoutError` for code 2.
- A check program names itself in its report with `programName(import.meta.filename)`, never with its name typed out.

## 5. Clean code

- **A function does one thing.** Each check is its own function that returns a `Check`: `{ name, findings }`. When a function grows past about 50 lines, split it into named steps.
- **Names say what a thing is.** Write `const rows = tableUnder(...)`, not `const r = ...`. Short names are fine only inside a short arrow function, such as `(r) => r.ID`.
- **Write each helper once.** Before you write a small helper, look in `tools/lib/` first:
  - `md-tables.ts` has `cellText`, `cellItems`, `cellNumber` and `list`, for table cells
  - `text.ts` has `plural` and `escapeRegExp`
  - `cli.ts` has `today`
- **Fixed lists are constants,** in capitals, `as const`: `const GROUPS = ['Must answer', 'Should answer', 'Can move ahead'] as const;`
- **Comments say why, not what.** Each file opens with what it does and what it exports. Add a comment inside the code only where the reason isn't plain from the code.

## 6. What a program says never changes by accident

Every message, exit code, option and file a program writes is read by a skill, a gate or a test. Changing how the code is written must not change one letter of what it prints or writes. When a message must change, change the skill and the test in the same change.

## 7. Tests

- Each test file imports its tools from `tests/helpers/harness.ts`: `test`, `run`, `readText`, `tempDir`, `copyDir` and `report`, and the kit's folders, such as `TOOLS` and `EXAMPLES`.
- A test file ends with `report();`, which prints each result and exits with code 1 when a test failed.
- `npm test` runs every test file.
