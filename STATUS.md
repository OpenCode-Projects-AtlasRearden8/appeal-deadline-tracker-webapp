# STATUS — Appeal Deadline Tracker

Last updated: 2026-11-03
Owner: Asdale Dynamics, LLC (Dylan Asdale)

## What was built

A single-file, offline web app for tracking insurance claim denials as
paperwork (deadlines and documents, never medicine):

- `index.html` — the entire app: one record per claim (case name, claim
  number, insurer, denial date, denial reason + notes), per-level appeal
  deadlines, appeal window countdown badges, documents-to-gather checklist,
  call log with reference numbers. Pure HTML/CSS/JS, all inline, zero
  dependencies, runs from `file://`, data in localStorage only.
- `tests/run-tests.js` — 32 countdown-math tests. They extract the marked
  pure-function block (`/* == PURE-START == */ … /* == PURE-END == */`)
  straight from `index.html` and run it in a Node sandbox, so the tests
  verify exactly the code that ships.
- `package.json` — `npm test` alias for `node tests/run-tests.js` (no deps).
- `README.md` — usage, privacy notes, appeal-level model, limitations;
  credits Asdale Dynamics, LLC and positions the app as the *tool* companion
  to the insurance-appeals-calm-guide *manual* (no content overlap).
- `LICENSE` — MIT, copyright line exactly: `Copyright (c) 2026 Asdale Dynamics, LLC`
- `STATUS.md` — this file.

Goal compliance: education/admin only (prominent banner + README), one
record per claim, denial reason, appeal window countdown, documents list,
call log with reference numbers, next-letter due dates across appeal levels
(estimated until real decision dates are recorded, then anchored on actuals).

## How to run

- App: open `index.html` in any modern browser. No install, no server.
- Tests: `node tests/run-tests.js` (or `npm test`).

## Verification results

- `node tests/run-tests.js` → **OK — 32 countdown-math tests passed**
  - Also verified under `TZ=America/New_York` and `TZ=Asia/Los_Angeles`
    (calendar-day counting, DST-immune).
  - Reference checks use an independent `Date.UTC`-based implementation, not
    the app's own helpers.
- Full inline `<script>` extracted and passed `node --check` (syntax).
- Static sanity check: all 26 DOM ids referenced by the script exist in the
  HTML; no duplicate ids.
- Bug fixed during review: `levelDueDate` mis-anchored later appeal levels to
  the wrong prior-level outcome and double-added the window days (caught by
  the tests, rewritten, all tests pass).
- Header badge fixed: a claim with every appeal level decided now shows
  "All appeal levels decided" instead of a stale countdown.

## Known gaps

- localStorage can be cleared by the user/browser; Export backup exists,
  but there is no auto-backup.
- A few browsers restrict localStorage on `file://` pages; in that case the
  session still works but persistence is limited.
- Deadline windows are user-entered estimates; real windows vary by plan,
  state, and appeal type. The app says so prominently — it is not a ruling.
- No print/PDF view, no sync (by design), no encryption of local data.
- Call-log entry uses sequential prompts (works everywhere from file://,
  but a form would be friendlier).
