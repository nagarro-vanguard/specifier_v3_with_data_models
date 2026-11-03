// text.ts — small helpers for the text programs print and search.
//
// Exports:
//   plural(n, word)      "1 finding", "2 findings"
//   escapeRegExp(s)      s with every character a regular expression treats as special escaped, to match it as written

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
