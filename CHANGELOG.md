# Changelog

Each version is kept on an `archive/` branch. See "Versions and rolling back" in the README.

## v3.1: Address History

From the Address History prototype (timelinedisplay.replit.app), built in our design system.

- **Client Overview.** The address block shows the most recent address, an **N Concurrent** badge (with a tooltip) when other addresses are open at the same time, and two links: **View Address Details** and **View Full Address History**. With no open address it says "No current address on file".
- **Address Details dialog.** The most recent verified address with its dates, facility, ward, school district, program tags and as-of date; then every concurrent address as a card that expands to the full details. One card opens at a time. The footer opens the full history.
- **Address History page** (`#client/<id>/address-history`). Timeline: years newest first, each concurrent period outlined with how many addresses and the months it spans, each address with its icon (residence, shelter, transitional, custody), dates, length of stay and up to three program tags. Table: search by street or city, sort by address or start date, report counts, "concurrent" and "Active" chips. A program filter (multi-select, Clear all) and a concurrent-period count apply to both views.
- **Address details** in both places: program tags, last reported date, township, county, school district, start and end dates, length in years, months and days, email, phones with valid-since dates, and the matched provider with facility ID, residential flag and property use. Each program tag's tooltip lists the systems behind it, or the dates it was reported.
- **Data.** Every client has an address history (470 records across 64 clients). Jimothy's 47 are the prototype's own records. The API contract gains `addresses` and the AddressRecord shape.
- **Remembered:** view, program filter, table search and sort, and the open card. Leaving a page now closes any open dialog.
- **Tests:** 440 browser checks across both data sources, up from 215, including the prototype's figures for Jimothy and every client's badge, dialog, timeline and dates.

Differences from the prototype, on purpose:

- **Dates are the real calendar day.** The prototype reads `2025-06-01` as midnight UTC, so in US time zones it shows May 31, 2025 and "May 2025". CoLab shows June 1 and "Jun 2025". The same shift moves two of the prototype's labels (Unit 500 starts Apr 2025, not Mar; one concurrent period starts Nov 2015, not Oct).
- The history opens as its own page, with a breadcrumb and a back link, like the service and provider details pages, instead of inside the tab.
- Program tag colors are the prototype's, darkened where needed for contrast. The green for "Present" is our `--green-text`.
- Within a year, addresses are ordered by start date, newest first.

## v3.0: ready for a real API

- **Data layer.** Every read and write goes through one interface with two plug-ins: sample data in the browser, or a CoLab API over HTTP. `config.js` picks one without a rebuild. `docs/API.md` is the backend contract.
- **Loads what each screen needs.** Clients, notes, action items, starred clients and search results load per screen and are cached. Search runs on the data source. Nothing assumes every client is in memory.
- **Loading, error and Try again states** on every page, and for the whole app if the session can't load.
- **Optimistic saves.** Changes show at once and are undone, with an error message, if the server refuses them. Undo is the opposite request, sent after the original.
- **No hard-coded data on screen.** The signed-in user, staff, CoLabs, provider contacts, contact-detail sources and dates, and custody facilities, agencies, and admission and release reasons now come from the data. The full SSN is fetched only when someone asks for it, instead of being faked.
- **Code.** The 860-line client page is now one file per tab or feature. Table definitions are in one place, dead code is removed, summaries are memoized, and state is split so a filter change doesn't re-render record views.
- **Mock API** (`npm run mock-api`) serving the sample data over the real contract.
- **Tests in the repo** (`npm test`): 215 browser checks across both data sources, including every data point for all 64 clients.
- **Saved data upgrades.** Notes, stars and changes saved by v2.x carry over.
- On Home, "Show more" no longer appears on a note that fits on its line.

## v2.1: review fixes

- Every button and link is at least 24px (WCAG 2.2 target size).
- "Show more" appears only when a note is cut off.
- The notes panel's action filters fit on one line; edit and delete sit in their own column.
- Wider table columns so sort headers don't wrap.
- Fixed "Who is the client you are trying to access?"

## v2.0: React rebuild

- Rebuilt in React. Every change and every filter, sort, page, tab and draft is saved across reloads.
- 64 sample clients, 8 staff, and notes and action items to match.
- Service and provider details pages, empty states, action items assigned to staff.

## v1.1: the hub

- Home, My Action Items, My Case Notes, Starred Clients, client search, Report Missing Client and Report an Issue, in plain JavaScript.

## v1.0: client profile

- The client profile from Figma: tabs, filters, sorting, and the notes and action items panel.
