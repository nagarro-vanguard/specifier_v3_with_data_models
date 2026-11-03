// coverage-check.ts — proves that every rule of an EPIC's features is named by at least one acceptance scenario.
//
//   node tools/coverage-check.ts --project <p> --epic EPIC-002
//
// What it does:
//   1. finds the EPIC's features in the EPIC register
//   2. finds their rules in the FRDs, in the frd/ folder: every rule under a "### F-nn" heading for those features
//   3. reads which rules each scenario in the EPIC's Stories proves: the rule IDs in brackets at the end of each
//      scenario's title
//   4. lists every rule no scenario names. Rules of features in other EPICs are ignored, and so is a scenario that
//      names a rule of another EPIC.
//
// Exports:
//   coverage(project, epic, opts)   the EPIC, its features, their rules, the rules no scenario names, and who names each
//   NOT_STORIES                     the files in an EPIC's folder that aren't Stories
//
// Exit codes: 0 every rule is covered; 1 uncovered rules, each listed; 2 the register, the EPIC or the layout is
// missing.
// Option for tests: --output <dir> instead of Output/ in the folder you work from.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOption, fail, programName, runMain, type ExitCode } from './lib/cli.ts';
import { pathOf, readText, type PathOptions } from './lib/run-paths.ts';
import { cellItems, scenarios } from './lib/md-tables.ts';
import { epicOf, type Epic } from './lib/check-document.ts';
import { plural } from './lib/text.ts';

const PROGRAM = programName(import.meta.filename);

// The files in an EPIC's folder that aren't Stories.
export const NOT_STORIES = ['story-list.md', 'brief.md'] as const;

export interface FrdRule {
  id: string;
  text: string;
  // The FRD's ID, such as FRD-3a, or its file name when it has no ID.
  frd: string;
}

export interface Coverage {
  epic: Epic;
  features: string[];
  rules: FrdRule[];
  uncovered: FrdRule[];
  // Each rule ID a scenario names, with each "{Story}, Scenario n" that names it.
  named: Map<string, string[]>;
}

// Every rule of these features, from the FRDs in the frd/ folder, in file-name order.
function rulesOf(project: string, features: string[], opts: PathOptions): FrdRule[] {
  const frdDir = path.dirname(pathOf(project, 'feature-catalog', {}, opts));
  const rules: FrdRule[] = [];
  for (const f of fs.existsSync(frdDir) ? fs.readdirSync(frdDir).filter((x) => /^frd-.+\.md$/.test(x)).sort() : []) {
    const t = readText(path.join(frdDir, f));
    const frd = t.match(/^# (FRD-\d+[a-z])\b/m)?.[1] || f;
    let feature: string | null = null;
    for (const line of t.split('\n')) {
      if (/^## /.test(line)) feature = null;
      const h = line.match(/^### (F-\d+) /);
      if (h) feature = h[1];
      const r = line.match(/^\| (F-\d+\.\d+) \| (.+?) \| /);
      if (r && feature && features.includes(feature)) rules.push({ id: r[1], text: r[2], frd });
    }
  }
  return rules;
}

// Each rule ID the EPIC's scenarios name, with the scenarios that name it.
function namedRules(dir: string): Map<string, string[]> {
  const named = new Map<string, string[]>();
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !(NOT_STORIES as readonly string[]).includes(x)) : []) {
    const t = readText(path.join(dir, f));
    for (const scenario of scenarios(t)) {
      for (const id of scenario.rules) {
        if (!named.has(id)) named.set(id, []);
        named.get(id)!.push(`${f.replace(/\.md$/, '')}, ${scenario.id}`);
      }
    }
  }
  return named;
}

export function coverage(project: string, epicName: string, opts: PathOptions = {}): Coverage {
  const epic = epicOf(project, epicName, opts);
  const features = cellItems(epic.row.Features);
  const rules = rulesOf(project, features, opts);
  const named = namedRules(pathOf(project, 'epic-folder', { epic: epic.folder }, opts));
  const uncovered = rules.filter((r) => !named.has(r.id));
  return { epic, features, rules, uncovered, named };
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  const use = 'Use: node tools/coverage-check.ts --project <p> --epic EPIC-002';
  const project = requireOption(args, 'project', use);
  const epic = args.values.epic;
  if (!epic) fail(use, 2);
  const result = coverage(project, String(epic), { output: args.output });
  const head = `${PROGRAM}: ${result.epic.id} ${result.epic.name}, ${plural(result.features.length, 'feature')}, ${plural(result.rules.length, 'rule')}`;
  if (!result.rules.length) {
    process.stdout.write(`${head}: no FRD rule found for this EPIC's features. Are its FRDs accepted?\n`);
    return 1;
  }
  if (result.uncovered.length) {
    process.stdout.write(`${head}: ${result.uncovered.length} no scenario names:\n${result.uncovered.map((u) => `- ${u.id} (${u.frd}): ${u.text}`).join('\n')}\n`);
    return 1;
  }
  process.stdout.write(`${head}: every rule is named by at least one scenario.\n`);
  return 0;
}

if (import.meta.main) runMain(main);
