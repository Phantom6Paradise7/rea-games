// Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { exportedNames } from "../scripts/exported-names.mjs";

test("every binding of a multi-name export is kept", () => {
  assert.deepEqual(exportedNames("export const W = 10, H = 20;\n"), ["W", "H"]);
  assert.deepEqual(
    exportedNames("export const START_STEP = 0.6, STEP_DECREMENT = 0.005, MIN_STEP = 0.1; // seconds per row\n"),
    ["START_STEP", "STEP_DECREMENT", "MIN_STEP"],
  );
});

test("commas inside calls, literals, strings and comments do not start a new binding", () => {
  assert.deepEqual(exportedNames("export const A = foo(1, 2), B = 3\n"), ["A", "B"]);
  assert.deepEqual(exportedNames("export const P = [1, 2], Q = { x: 1, y: 2 }, R = 'a, b', S = `c, ${d}`;\n"), ["P", "Q", "R", "S"]);
  assert.deepEqual(exportedNames("export const T = 1 /* , U */;\nexport let V = 2\n"), ["T", "V"]);
  assert.deepEqual(exportedNames("export const M = {\n  a: 1,\n  b: [2, 3],\n};\n"), ["M"]);
});

test("functions and classes are listed in source order", () => {
  assert.deepEqual(
    exportedNames("export const K = 1;\nexport function f(a, b) {}\nexport async function g() {}\nexport class C {}\n"),
    ["K", "f", "g", "C"],
  );
});

test("the Blocks logic exports H, STEP_DECREMENT and MIN_STEP", () => {
  const names = exportedNames(fs.readFileSync(new URL("../games/blocks/ports/web/blocks.mjs", import.meta.url), "utf8"));
  for (const n of ["W", "H", "KINDS", "SHAPES", "START_STEP", "STEP_DECREMENT", "MIN_STEP", "T0", "cellsOf", "Blocks"]) assert.ok(names.includes(n), n);
});
