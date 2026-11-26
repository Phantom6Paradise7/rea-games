// Names a module exports with `export const|let|var|function|class`, for scripts/bundle.mjs.
// A declaration may bind several names (`export const W = 10, H = 20;`): every binding is kept.
// A comma only separates bindings at depth zero, not inside a string, a comment, (), [] or {}.
const DECL = /^export\s+(?:async\s+)?(?:function\*?|class)\s+([A-Za-z_$][\w$]*)/gm;
const VARS = /^export\s+(?:const|let|var)\s+/gm;
const NAME = /^[A-Za-z_$][\w$]*/;
const CONTINUES = /[,=+\-*/%?:|&!<>(\[{.]$/;

export function exportedNames(src) {
  const found = [];
  for (const m of src.matchAll(DECL)) found.push([m.index, m[1]]);
  for (const m of src.matchAll(VARS)) {
    for (const [at, name] of bindings(src, m.index + m[0].length)) found.push([at, name]);
  }
  return found.sort((a, b) => a[0] - b[0]).map(([, name]) => name);
}

function bindings(src, i) {
  const out = [];
  let expectName = true;
  let depth = 0;
  let last = "";
  while (i < src.length) {
    if (expectName) {
      while (/\s/.test(src[i])) i++;
      const name = NAME.exec(src.slice(i));
      if (!name) throw new Error(`exported-names: unsupported export at offset ${i} (destructuring?)`);
      out.push([i, name[0]]);
      i += name[0].length;
      last = name[0].at(-1);
      expectName = false;
      continue;
    }
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { const end = src.indexOf("*/", i + 2); i = end < 0 ? src.length : end + 2; continue; }
    if (c === '"' || c === "'" || c === "`") {
      i++;
      while (i < src.length && src[i] !== c) i += src[i] === "\\" ? 2 : 1;
      i++; last = c; continue;
    }
    if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    else if (depth === 0 && c === ",") { expectName = true; i++; continue; }
    else if (depth === 0 && c === ";") break;
    else if (depth === 0 && c === "\n" && !CONTINUES.test(last)) break;
    if (!/\s/.test(c)) last = c;
    i++;
  }
  return out;
}
