// check-question.ts — checks a question to the specifier against probing-questions-author, "Ask: put one decision to
// the specifier": the message above the question has every part, names no file, code or working word of the kit, and
// the choices are put the agreed way.
//
//   node tools/check-question.ts --message <file>     checks a message saved to a file
//   node tools/check-question.ts --hook               runs as Claude Code's PreToolUse hook, reading its JSON on stdin
//
// As a hook it checks AskUserQuestion: the message is the text written above the control, read from the transcript,
// with the question's own text. It also stops a question put in the app's next-step box (mcp__ccd_turn__wrap_up with
// an "ask"), which can't show the parts or "I don't know yet".
//
// Exit codes: 0 nothing to fix; 1 something to fix; 2 the message could not be read. As a hook it always exits 0,
// and refuses the question by printing Claude Code's "deny" answer, so a question never reaches the specifier unchecked.

import fs from 'node:fs';
import { parseArgs, textOption, hasOption, fail, runMain, type ExitCode } from './lib/cli.ts';

const USE = 'Use: node tools/check-question.ts --message <file> | --hook';

// The parts of the message, in the order probing-questions-author writes them.
const PARTS = [
  ['Decision', /\bDecision \d+\./],
  ['Where we are', /where we are:/i],
  ['What I found', /what i found:/i],
  ['Why it matters', /why it matters:/i],
  ['If we get it wrong', /if we get it wrong:/i],
  ['Fixing it later means', /fixing it later means/i],
  ['Your choices', /your choices:/i],
  ['My recommendation', /my recommendation:/i],
  ['How sure I am', /how sure i am:/i],
  ['Choose something else if', /choose something else if:/i],
  ["What I'd do now", /what i(?:'|’)d do now:/i],
] as const;

const FILE_NAME = /\b[\w.-]+\.(?:md|cjs|ts|js|json|docx|xlsx|pdf)\b/i;
const CODE = /\b(?:REQ|BR|NFR|FR|F|DM|CH|EPIC|Q|G\d)-\d+(?:\.\d+)?\b/;
const WORKING_WORDS = [
  ['Must answer', /\bmust answer\b/i],
  ['Should answer', /\bshould answer\b/i],
  ['Can move ahead', /\bcan move ahead\b/i],
  ['Proposed', /\bProposed\b/],
  ['TBD', /\bTBD\b/],
  ['simple words', /\bsimple words\b/i],
  ['done-when piece', /\bdw\d+\b/],
] as const;

const DONT_KNOW = /^i don(?:'|’)t know yet$/i;

interface Option {
  label: string;
  description: string;
}

interface Question {
  question: string;
  options: Option[];
}

export function checkMessage(text: string): string[] {
  const findings: string[] = [];
  for (const [name, pattern] of PARTS) if (!pattern.test(text)) findings.push(`The message has no "${name}" part.`);
  const body = withoutReference(text);
  const file = body.match(FILE_NAME);
  if (file) findings.push(`It names a file, "${file[0]}". Name the document in words, such as "the client's returns policy".`);
  const code = body.match(CODE);
  if (code) findings.push(`It uses a code, "${code[0]}". Say what it is in words. A code goes only in the reference at the end.`);
  for (const [word, pattern] of WORKING_WORDS) if (pattern.test(body)) findings.push(`It uses the kit's working word "${word}". Say what it means instead.`);
  return findings;
}

// The reference in brackets on the last line, such as "(question 12)", is the one place a code may appear.
function withoutReference(text: string): string {
  return text.trimEnd().replace(/\n\s*\([^()\n]*\)\s*$/, '');
}

export function checkControl(questions: Question[]): string[] {
  if (questions.length !== 1) return [`Put one decision in each control. This one has ${questions.length}.`];
  const [{ question, options }] = questions;
  const findings: string[] = [];
  const ownQuestion = /^(accept|approve)\b/i.test(question.trim());
  if (!options[0]?.label.endsWith('(Recommended)')) findings.push('The first choice must be the recommended one, its label ending with "(Recommended)".');
  if (options.slice(1).some((o) => /\(Recommended\)/.test(o.label))) findings.push('Only the first choice can be marked "(Recommended)".');
  const dontKnow = options.find((o) => DONT_KNOW.test(o.label.trim()));
  if (!dontKnow && !ownQuestion) findings.push('"I don\'t know yet" must be one of the choices.');
  for (const o of options) {
    if (o === dontKnow) {
      if (!/^then\b/i.test(o.description.trim())) findings.push(`"I don't know yet" must say what happens meanwhile, starting "Then".`);
      continue;
    }
    if (!ownQuestion && /^(yes|no)\b/i.test(o.label)) findings.push(`The choice "${o.label}" starts with Yes or No. Name the real choice.`);
    if (!/choose this if/i.test(o.description) || !/\bthen\b/i.test(o.description)) findings.push(`The choice "${o.label}" must say "Choose this if" and "Then" what will be true.`);
  }
  return findings;
}

// The text written above the control: every text block the assistant wrote since the last user entry.
function messageAbove(transcript: string): string {
  const texts: string[] = [];
  const lines = fs.readFileSync(transcript, 'utf8').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry: { type?: string; message?: { content?: unknown } };
    try {
      entry = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (entry.type === 'user') break;
    if (entry.type !== 'assistant' || !Array.isArray(entry.message?.content)) continue;
    for (const block of [...entry.message.content].reverse()) if (block?.type === 'text') texts.unshift(String(block.text));
  }
  return texts.join('\n');
}

function deny(findings: string[]): void {
  const reason = ['This question doesn\'t follow probing-questions-author, "Ask: put one decision to the specifier". Fix it and ask again:', ...findings.map((f) => `- ${f}`)].join('\n');
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
}

function runHook(): ExitCode {
  const input = JSON.parse(fs.readFileSync(0, 'utf8')) as { tool_name?: string; tool_input?: Record<string, unknown>; transcript_path?: string };
  const tool = input.tool_name ?? '';
  const toolInput = input.tool_input ?? {};
  if (tool.endsWith('wrap_up')) {
    if (typeof toolInput.ask === 'string' && toolInput.ask.trim()) {
      deny(['A question can\'t go in the next-step box. Ask it with AskUserQuestion, in the agreed shape, or leave the "ask" out.']);
    }
    return 0;
  }
  if (tool !== 'AskUserQuestion') return 0;
  const questions = (toolInput.questions ?? []) as Question[];
  let above = '';
  try {
    if (input.transcript_path) above = messageAbove(input.transcript_path);
  } catch {
    above = '';
  }
  const message = [above, ...questions.map((q) => q.question)].join('\n');
  const findings = [...checkMessage(message), ...checkControl(questions)];
  if (findings.length) deny(findings);
  return 0;
}

function main(): ExitCode {
  const args = parseArgs(process.argv.slice(2));
  if (hasOption(args, 'hook')) return runHook();
  const file = textOption(args, 'message');
  if (!file) fail(USE, 2);
  if (!fs.existsSync(file)) fail(`No message at ${file}.`, 2);
  const findings = checkMessage(fs.readFileSync(file, 'utf8'));
  process.stdout.write(findings.length ? `${findings.map((f) => `- ${f}`).join('\n')}\n` : 'The message has every part.\n');
  return findings.length ? 1 : 0;
}

if (import.meta.main) runMain(main);
