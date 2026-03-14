/**
 * Smoke test for the Canvas class.
 * Imports from compiled dist/ and exercises the drawing API.
 * Run with: node --loader mcp/loader.mjs mcp/test-canvas.mjs
 */

import { Canvas } from "./dist/mcp/src/canvas.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

// ─── Test 1: Full wireframe sequence ────────────────────────────────────────
console.log("\n=== Test 1: Full wireframe (Login + Dashboard + arrow) ===\n");

const canvas = new Canvas();

// canvas_new (reset)
canvas.reset();

// draw_box(0, 0, 20, 5, "Login")
canvas.drawBox(0, 0, 20, 5, "Login");

// add_text(2, 2, "Username:")
canvas.addText(2, 2, "Username:");

// draw_box(0, 7, 20, 5, "Dashboard")
canvas.drawBox(0, 7, 20, 5, "Dashboard");

// draw_arrow(10, 5, 10, 7)
canvas.drawArrow(10, 5, 10, 7);

// canvas_export
const result1 = canvas.export();
console.log(result1);
console.log();

const lines1 = result1.split("\n");

// Verify top-left corner of Login box
assert(lines1[0][0] === "┌", "Login box: top-left corner is ┌");
// Verify top-right corner of Login box (width 20, so index 19)
assert(lines1[0][19] === "┐", "Login box: top-right corner is ┐");
// Verify bottom-left corner of Login box (height 5, so row 4)
assert(lines1[4][0] === "└", "Login box: bottom-left corner is └");
// Verify bottom-right corner of Login box
assert(lines1[4][19] === "┘", "Login box: bottom-right corner is ┘");
// Verify horizontal lines
assert(lines1[0].includes("─"), "Login box: top edge has ─");
assert(lines1[4].includes("─"), "Login box: bottom edge has ─");
// Verify vertical lines
assert(lines1[1][0] === "│", "Login box: left edge has │");
assert(lines1[1][19] === "│", "Login box: right edge has │");
// Verify label "Login" appears on top edge
assert(lines1[0].includes("Login"), 'Login box: label "Login" on top edge');
// Verify text inside box
assert(lines1[2].includes("Username:"), 'Text "Username:" inside Login box');

// Verify Dashboard box (starts at y=7)
assert(lines1[7][0] === "┌", "Dashboard box: top-left corner is ┌");
assert(lines1[7][19] === "┐", "Dashboard box: top-right corner is ┐");
assert(lines1[11][0] === "└", "Dashboard box: bottom-left corner is └");
assert(lines1[11][19] === "┘", "Dashboard box: bottom-right corner is ┘");
// The arrow tip ▼ at (10,7) overwrites the 'b' in "Dashboard", so check for partial label
assert(lines1[7].includes("Dash") && lines1[7].includes("ard"), 'Dashboard box: partial label visible on top edge (arrow tip overwrites one char)');

// Verify arrow: at (10,5) should be │ (line going down), at (10,7) should be ▼
assert(lines1[5][10] === "│", "Arrow: vertical line at (10,5)");
assert(lines1[6][10] === "│", "Arrow: vertical line at (10,6)");
assert(lines1[7][10] === "▼", "Arrow: arrowhead ▼ at (10,7)");

// ─── Test 2: Simple box with no label ───────────────────────────────────────
console.log("\n=== Test 2: Simple box (10x3, no label) ===\n");

const canvas2 = new Canvas();
canvas2.drawBox(0, 0, 10, 3);
const result2 = canvas2.export();
console.log(result2);
console.log();

const lines2 = result2.split("\n");

assert(lines2.length === 3, "Box has 3 rows");
assert(lines2[0][0] === "┌", "Simple box: top-left corner is ┌");
assert(lines2[0][9] === "┐", "Simple box: top-right corner is ┐");
assert(lines2[2][0] === "└", "Simple box: bottom-left corner is └");
assert(lines2[2][9] === "┘", "Simple box: bottom-right corner is ┘");
assert(lines2[0].slice(1, 9).split("").every((c) => c === "─"), "Simple box: top edge all ─");
assert(lines2[2].slice(1, 9).split("").every((c) => c === "─"), "Simple box: bottom edge all ─");
assert(lines2[1][0] === "│", "Simple box: left edge │");
assert(lines2[1][9] === "│", "Simple box: right edge │");
// No label — interior of top edge should be all ─
assert(!lines2[0].slice(1, 9).includes("┌"), "Simple box: no label characters on top edge");

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
  process.exit(1);
}
