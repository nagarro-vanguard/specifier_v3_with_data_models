'use strict';
// method-copy.cjs — the only edits allowed when the approved glossary method is copied into the kit, written once so
// the copying and the test that checks it can never disagree.
//
// Exports:
//   display(text)   placeholders in <angle brackets> become {curly braces}, so a viewer shows them. Real HTML stays:
//                   <br>, empty anchors such as <a id="g1-01"></a>, and comments.
//   paths(text)     paths and names that point outside the kit point to the kit's own files instead
//   copy(text)      both, in that order

const TAG = /^(br\s*\/?|a\s+(id|href|name)=.*|\/a|!--[\s\S]*)$/i;

function display(text) {
  // Real tags are held aside while placeholders are converted, innermost first, so nested ones convert too.
  // An anchor's id may itself be a placeholder, <a id="<term-anchor>"></a>, which becomes <a id="{term-anchor}"></a>.
  const held = [];
  let t = text.replace(/<!--[\s\S]*?-->|<br\s*\/?>|<a\s+(?:id|href|name)="[^"]*"\s*>|<\/a>/gi, (m) => {
    held.push(m.startsWith('<a') ? m.replace(/"<([^<>"]+)>"/, '"{$1}"') : m);
    return `\u0001${held.length - 1}\u0002`;
  });
  for (;;) {
    let changed = false;
    t = t.replace(/<([^<>\n]+)>/g, (m, inner) => {
      // A placeholder starts with a letter, a digit, a quote, a bracket or an ellipsis: never with a space, an arrow
      // or an equals sign, so "a < b > c" and "<--" are left alone.
      if (TAG.test(inner) || !/^[A-Za-z0-9"'[(.…*`]/.test(inner)) return m;
      changed = true;
      return `{${inner}}`;
    });
    if (!changed) break;
  }
  // A link's path holds no spaces, so a placeholder inside one joins its words with hyphens: {kind page} -> {kind-page}.
  t = t.replace(/\]\(([^)\n]*)\)/g, (m, p) => `](${p.replace(/\{([^}]*)\}/g, (x, inner) => `{${inner.replace(/\s+/g, '-')}}`)})`);
  return t.replace(/\u0001(\d+)\u0002/g, (m, i) => held[Number(i)]);
}

const PATHS = [
  // The method's own folder, wherever it is named
  [/\.skills\/_shared\/glossary\//g, '.claude/skills/_shared/glossary/'],
  // A glossary lives in its project's folder (project-folders.md)
  [/Output\/glossary\//g, 'Output/{project}/glossary/'],
];

function paths(text) {
  return PATHS.reduce((t, [re, to]) => t.replace(re, to), text);
}

function copy(text) {
  return paths(display(text));
}

module.exports = { display, paths, copy };
