# Appeal Deadline Tracker

A tiny, offline web app for keeping track of insurance claim denials and appeals **as paperwork** — deadlines, documents to gather, phone calls with reference numbers, and what's due next at each appeal level.

It is a folder-and-deadline organizer for the *administrative* side of appealing a denial. It is not medical advice, not legal advice, and it never comments on what care should or shouldn't be covered. It just helps you stay on top of letters and dates.

> **Companion project:** this tool is deliberately distinct from our
> [insurance-appeals-calm-guide](https://github.com/dylanasdale/insurance-appeals-calm-guide) — that's a plain-English *manual* that explains the appeal process. This app is the *tracker* you use while following any such guide or your insurer's own instructions. No duplicate content; they complement each other.

## Who it's for

Anyone who received a denial letter and wants one calm, private place to track:

- the claim number, insurer, denial date, and the reason stated on the letter
- an **appeal window countdown** from the denial date
- a **documents-to-gather** checklist per case
- a **call log** — date, who you called, what was said, and especially the **reference number** every call agent gives you
- **next-letter due dates** across appeal levels (Level 1 internal, Level 2, external review, and any custom levels you add)

Written in the same spirit as everything from [Asdale Dynamics, LLC](https://dylanasdale.github.io): plain English, step by step, local-first, and no condescension.

## How to run it

1. Download or clone this folder.
2. Double-click `index.html` (or open it in any modern browser).

That's it. There is no install step, no server, no build, and no account. The app is a **single HTML file** with all CSS and JavaScript inline, and it works straight from `file://`. Your data is stored only in your own browser's localStorage — nothing ever leaves your computer.

### Cold-start tip

Open your denial letter before you start. It gives you everything the app asks for: the claim number, the denial date, the stated reason, and (usually) how long you have to appeal.

### The appeal-level model

- **Level 1** letters are due `window days` after the **denial date**.
- Each later level is due `window days` after the **previous level's decision date**.
- Until you record a real decision date, later levels are shown as **estimates** (chained off the prior level's due date). Enter the actual decision date when it arrives and the schedule snaps to reality.
- The default window is 180 days. Plans and states genuinely differ — the banner in the app and this README both say to confirm deadlines with your denial letter, plan documents, or state regulator. The app is a planning aid, not a ruling.

## Features

- One record per claim; add, edit, search, and delete
- Color-coded countdown: on-track / due-soon (≤ 7 days) / overdue / due today
- Per-level next-letter due dates, with estimated vs. actual anchoring
- Documents-to-gather checklist with progress count
- Call log with reference number highlight
- **Export backup** (JSON) and **Import backup** (keeps existing claims)
- Works completely offline from `file://`, zero dependencies

## Privacy

All data lives in your browser's localStorage on your own machine. The app makes no network requests of any kind. Export to JSON and keep the file somewhere safe if the appeal matters to you — and don't put more private detail into a tracker than you're comfortable keeping locally.

## Tests

The date/deadline math lives in a marked pure-function block inside `index.html` (between `/* == PURE-START == */` and `/* == PURE-END == */`), so the single-file app and the tests share exactly the same code — no drift:

```bash
node tests/run-tests.js
# or
npm test
```

32 tests cover date parsing, day rollovers (month ends, year ends, leap years), day-count chains against an independent reference, countdown statuses, and the per-level deadline anchoring — including DST-immunity (calendar days, not 24-hour groups).

## Known limitations

- Browser localStorage can be cleared by clearing site data; export a backup for anything important.
- Some browsers restrict storage on `file://` pages; if data doesn't persist, the app is still fully usable in-session, and backing up via Export works regardless.
- Numbers, not law: appeals windows vary by plan, state, and appeal type (including provider-filed appeals). Always verify with authoritative sources.
- No printing/PDF generation yet, and no multi-device sync by design.

## Project by

- **App:** Appeal Deadline Tracker by [Asdale Dynamics, LLC](https://dylanasdale.github.io) — from Dylan Asdale's practical-tools line: local-first, beginner-friendly, tested.
- **License:** MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Asdale Dynamics, LLC.
