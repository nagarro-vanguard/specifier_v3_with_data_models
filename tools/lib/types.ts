// types.ts — the shapes a check program hands to lib/check-document.ts, which prints its gate's three blocks.
//
// A type that only one file uses stays in that file. A type that several files share lives in the file that makes it,
// such as Row in lib/md-tables.ts or Graded in grade-questions.ts. This file holds only what no one file makes:
// the contract between the check programs and report().

import type { Graded } from '../grade-questions.ts';

export type DocStatus = 'drafted' | 'accepted' | 'parked';

// A document as lib/check-document.ts's load() reads it.
export interface LoadedDocument {
  file: string;
  rel: string;
  text: string;
  // null when the document has no status line
  status: DocStatus | null;
  acceptedOn?: string;
  version?: number;
}

// One check, and what it found. No findings means it passed.
export interface Check {
  name: string;
  findings: string[];
}

// What a check program's check() returns, and report() reads.
export interface CheckResult {
  doc: LoadedDocument;
  checks: Check[];
  // One line for each count the draft holds, such as "4 objectives". Shown while the document is a draft.
  holds: string[];
  // The Question log, graded. Left out when the project has no Question log yet.
  graded?: Graded | null;
  // Facts the gate must show that are never findings, such as an FRD waiting on a Must answer question.
  notices?: string[];
}

export interface ReportSpec extends CheckResult {
  program: string;
  date: string;
  // Set for a document whose Check record is one line, such as the BRD: "For the file" is then only "Pass" or "Fail",
  // the date and this time, such as 14:05.
  recordTime?: string;
}

// The three blocks for the gate, as one text, and every finding.
export interface Report {
  text: string;
  findings: string[];
}
