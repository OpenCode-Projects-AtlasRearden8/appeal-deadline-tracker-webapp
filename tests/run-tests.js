/* Test runner for the pure countdown/deadline math.
 *
 * The app is a single HTML file by design, so these tests extract the marked
 * pure-function block from index.html (between "== PURE-START ==" and
 * "== PURE-END ==" comments) and evaluate it in a fresh sandbox — the tests
 * verify the exact code that ships in the app, not a copy.
 *
 * Bigger values (e.g. +180 days) are checked against an independent
 * reference implementation based on Date.UTC, not against the app's own
 * helpers.
 *
 * Run with:  node tests/run-tests.js   (or: npm test)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const APP_DIR = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(APP_DIR, "index.html"), "utf8");

const match = html.match(/\/\* == PURE-START ==[\s\S]*?\/\* == PURE-END ==\s*\*\//);
if (!match) {
  console.error("FAIL: pure-function block not found in index.html");
  process.exit(1);
}
let code = match[0];
code = code.replace(/^[\s\S]*?\*\//, ""); // strip the "PURE-START" comment header
code = code.replace(/\/\* == PURE-END ==\*\//, ""); // strip the end marker

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: "pure-functions.js" });

const {
  startOfDay, parseLocalDate, addDays, daysBetween, toISO,
  daysLeft, statusForDaysLeft, levelDueDate
} = sandbox;

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push({ name, error: e });
  }
}

// Independent reference helpers (deliberately NOT the app's functions)
function refISO(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error("invalid date " + y + "-" + m + "-" + d);
  }
  const p = (n) => String(n).padStart(2, "0");
  return y + "-" + p(m) + "-" + p(d);
}
function refShift(fromISOStr, days) {
  const [y, m, d] = fromISOStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days)); // Date.UTC handles rollover
  return refISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}
function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* ---- parseLocalDate ---- */
test("parseLocalDate accepts valid ISO date", () => {
  const d = parseLocalDate("2026-03-15");
  assert.strictEqual(d.getFullYear(), 2026);
  assert.strictEqual(d.getMonth(), 2);
  assert.strictEqual(d.getDate(), 15);
});
test("parseLocalDate rejects impossible dates (Feb 30)", () => {
  assert.strictEqual(parseLocalDate("2026-02-30"), null);
});
test("parseLocalDate rejects non-ISO strings, empty, non-string", () => {
  assert.strictEqual(parseLocalDate("03/15/2026"), null);
  assert.strictEqual(parseLocalDate(""), null);
  assert.strictEqual(parseLocalDate(null), null);
  assert.strictEqual(parseLocalDate(12345), null);
  assert.strictEqual(parseLocalDate("2026-3-5"), null);
});

/* ---- startOfDay / addDays ---- */
test("startOfDay clears time components", () => {
  const d = new Date(2026, 4, 2, 15, 42, 11, 500);
  const s = startOfDay(d);
  assert.strictEqual(s.getHours(), 0);
  assert.strictEqual(s.getMinutes(), 0);
  assert.strictEqual(s.getSeconds(), 0);
  assert.strictEqual(s.getMilliseconds(), 0);
  assert.strictEqual(s.getDate(), 2);
});
test("addDays rolls over month boundary", () => {
  const out = addDays(new Date(2026, 0, 31), 1);
  assert.strictEqual(out.getMonth(), 1);
  assert.strictEqual(out.getDate(), 1);
});
test("addDays rolls over year boundary", () => {
  const out = addDays(new Date(2025, 11, 31), 1);
  assert.strictEqual(out.getFullYear(), 2026);
  assert.strictEqual(out.getMonth(), 0);
  assert.strictEqual(out.getDate(), 1);
});
test("addDays handles leap day", () => {
  const out = addDays(new Date(2024, 1, 28), 1);
  assert.strictEqual(out.getMonth(), 1);
  assert.strictEqual(out.getDate(), 29);
});
test("addDays handles leap century correctly (2100 is not a leap year)", () => {
  const out = addDays(new Date(2100, 1, 28), 1);
  assert.strictEqual(out.getMonth(), 2);
  assert.strictEqual(out.getDate(), 1);
});
test("addDays works with negative counts", () => {
  const out = addDays(new Date(2026, 2, 1), -1);
  assert.strictEqual(out.getMonth(), 1);
  assert.strictEqual(out.getDate(), 28);
});
test("addDays: +180 days matches the independent reference", () => {
  const out = addDays(isoToDate("2026-01-10"), 180);
  assert.strictEqual(toISO(out), refShift("2026-01-10", 180));
});

/* ---- toISO ---- */
test("toISO zero-pads month and day", () => {
  assert.strictEqual(toISO(new Date(2026, 2, 5)), "2026-03-05");
  assert.strictEqual(toISO(new Date(2026, 11, 30)), "2026-12-30");
});

/* ---- daysBetween ---- */
test("daysBetween same day is 0", () => {
  const d = new Date(2026, 5, 10);
  assert.strictEqual(daysBetween(d, d), 0);
});
test("daysBetween is symmetric under negation", () => {
  const a = isoToDate("2026-05-10");
  const b = isoToDate("2026-09-02");
  assert.strictEqual(daysBetween(a, b) + daysBetween(b, a), 0);
});
test("daysBetween matches an independent day-count chain", () => {
  for (let n = 0; n <= 200; n += 17) {
    const to = refShift("2026-01-15", n);
    assert.strictEqual(daysBetween(isoToDate("2026-01-15"), isoToDate(to)), n, "n=" + n);
  }
});
test("daysBetween counts calendar days across a weekend", () => {
  const a = isoToDate("2026-03-07");
  const b = isoToDate("2026-03-09");
  assert.strictEqual(daysBetween(a, b), 2);
});

/* ---- daysLeft ---- */
test("daysLeft: due date today counts as 0", () => {
  assert.strictEqual(daysLeft("2026-11-03", "2026-11-03"), 0);
});
test("daysLeft counts calendar days until deadline", () => {
  assert.strictEqual(daysLeft("2026-03-10", "2026-03-01"), 9);
});
test("daysLeft negative when deadline passed", () => {
  assert.strictEqual(daysLeft("2026-03-01", "2026-03-10"), -9);
});
test("daysLeft returns null on bad input", () => {
  assert.strictEqual(daysLeft("garbage", "2026-01-01"), null);
  assert.strictEqual(daysLeft("2026-01-01", null), null);
});

/* ---- statusForDaysLeft ---- */
test("statusForDaysLeft overdue / due-soon / on-track / unknown", () => {
  assert.strictEqual(statusForDaysLeft(-1), "overdue");
  assert.strictEqual(statusForDaysLeft(-45), "overdue");
  assert.strictEqual(statusForDaysLeft(0), "due-soon");
  assert.strictEqual(statusForDaysLeft(7), "due-soon");
  assert.strictEqual(statusForDaysLeft(8), "on-track");
  assert.strictEqual(statusForDaysLeft(180), "on-track");
  assert.strictEqual(statusForDaysLeft(null), "unknown");
  assert.strictEqual(statusForDaysLeft(undefined), "unknown");
});

/* ---- levelDueDate ---- */
test("level 1 due date = denial date + window", () => {
  const info = levelDueDate("2026-01-10", 180, 1, {});
  assert.strictEqual(info.due, refShift("2026-01-10", 180));
  assert.strictEqual(info.estimated, true);
});
test("level 1 with 60-day window", () => {
  assert.strictEqual(levelDueDate("2026-01-10", 60, 1, {}).due, refShift("2026-01-10", 60));
});
test("level 1 window rollover across month end (Jun 30 + 5)", () => {
  assert.strictEqual(levelDueDate("2026-06-30", 5, 1, {}).due, "2026-07-05");
});
test("level 2 without outcome is two windows after denial (estimate)", () => {
  const info = levelDueDate("2026-01-10", 180, 2, {});
  assert.strictEqual(info.due, refShift("2026-01-10", 360));
  assert.strictEqual(info.estimated, true);
});
test("level 2 with recorded level-1 outcome anchors on the actual decision date", () => {
  const info = levelDueDate("2026-01-10", 180, 2, { 1: "2026-07-08" });
  assert.strictEqual(info.due, refShift("2026-07-08", 180));
  assert.strictEqual(info.estimated, false);
});
test("level 3 anchors on the most recent known outcome (level 2), not level 1", () => {
  const info = levelDueDate("2026-01-10", 180, 3, { 1: "2026-07-08", 2: "2026-10-01" });
  assert.strictEqual(info.due, refShift("2026-10-01", 180));
  assert.strictEqual(info.estimated, false);
});
test("level 3 with only level-1 outcome falls back to chain estimate", () => {
  const info = levelDueDate("2026-01-10", 365, 3, { 1: "2027-01-10" });
  assert.strictEqual(info.due, refShift("2027-01-10", 730));
  assert.strictEqual(info.estimated, true);
});
test("levelDueDate returns null on invalid inputs", () => {
  assert.strictEqual(levelDueDate("", 180, 1, {}), null);
  assert.strictEqual(levelDueDate("nope", 180, 1, {}), null);
  assert.strictEqual(levelDueDate("2026-01-10", 0, 1, {}), null);
  assert.strictEqual(levelDueDate("2026-01-10", -5, 1, {}), null);
  assert.strictEqual(levelDueDate("2026-01-10", 180, 0, {}), null);
  assert.strictEqual(levelDueDate("2026-01-10", 180, 1.5, {}), null);
  assert.strictEqual(levelDueDate("2026-02-30", 180, 1, {}), null);
});
test("levelDueDate works without a resolutions argument", () => {
  assert.strictEqual(levelDueDate("2026-01-10", 180, 1).due, refShift("2026-01-10", 180));
});

/* ---- end-to-end countdown scenarios ---- */
test("scenario: denial on 2025-11-01 + 180d window lands on 2026-04-30", () => {
  assert.strictEqual(levelDueDate("2025-11-01", 180, 1, {}).due, "2026-04-30");
});
test("scenario: stale appeal reads as overdue via daysLeft + status", () => {
  const due = levelDueDate("2026-01-01", 180, 1, {}).due;
  const days = daysLeft(due, "2026-08-01");
  assert.ok(days < 0);
  assert.strictEqual(statusForDaysLeft(days), "overdue");
});
test("scenario: level 2 anchored on a real level-1 decision (claim-list math)", () => {
  const info = levelDueDate("2026-01-01", 180, 2, { 1: "2026-07-01" });
  assert.strictEqual(info.due, "2026-12-28");
  assert.strictEqual(daysLeft("2026-12-28", "2026-11-03"), 55);
});

/* summary */
if (failures.length > 0) {
  console.error("\nFAILED " + failures.length + " test(s) (" + passed + " passed):");
  failures.forEach((f, i) => {
    console.error("  [" + (i + 1) + "] " + f.name);
    const msg = (f.error && f.error.stack ? f.error.message : String(f.error));
    console.error("      " + String(msg).split("\n").join("\n      "));
  });
  process.exit(1);
}
console.log("OK — " + passed + " countdown-math tests passed (pure functions extracted from index.html).");
