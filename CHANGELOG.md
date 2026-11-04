# Changelog

Each version is kept on an `archive/` branch. See "Versions and rolling back" in the README.

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
