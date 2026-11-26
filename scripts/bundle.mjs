// Turns each game's playable port into ONE html file (docs/play/<game>.html) that works from file:// and GitHub Pages.
// Module imports are inlined, `export` is dropped. Only relative "./x.mjs" imports are supported.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listGames, loadGame } from "../lib/verify.mjs";
import { exportedNames } from "./exported-names.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = new Map();
const IMPORT = /^import\s*\{([^}]*)\}\s*from\s*["'](\.\/[^"']+)["'];?\s*$/gm;
// Each module runs in its own function scope and hands back its named exports, so two files may
// both declare the same top-level name (the page and its logic module often both define W and H).
function inline(dir, file, out) {
  const full = path.join(dir, file);
  if (modules.has(full)) return modules.get(full);
  const id = `__mod${modules.size}`;
  modules.set(full, id);
  const src = fs.readFileSync(full, "utf8");
  const names = exportedNames(src);
  const body = imports(src, path.dirname(full), out).replace(/^export\s+/gm, "");
  out.push(`const ${id} = (() => {\n${body}\nreturn { ${names.join(", ")} };\n})();\n`);
  return id;
}
function imports(src, dir, out) {
  return src.replace(IMPORT, (_, list, rel) => {
    const id = inline(dir, rel, out);
    const binds = list.split(",").map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ": "));
    return `const { ${binds.join(", ")} } = ${id};`;
  });
}
fs.mkdirSync(path.join(root, "docs/play"), { recursive: true });
for (const g of listGames(root)) {
  const { dir, meta } = loadGame(root, g);
  const play = Object.values(meta.ports).find((p) => p.play)?.play;
  if (!play) continue;
  const htmlPath = path.join(dir, play);
  const html = fs.readFileSync(htmlPath, "utf8");
  const out = html.replace(/<script type="module">([\s\S]*?)<\/script>/, (_, body) => {
    const mods = [];
    const rest = imports(body, path.dirname(htmlPath), mods);
    return `<script>\n(() => {\n${mods.join("")}${rest}\n})();\n</script>`;
  });
  fs.writeFileSync(path.join(root, "docs/play", `${g}.html`), out);
  console.log("wrote docs/play/" + g + ".html", out.length, "bytes");
  modules.clear();
}
