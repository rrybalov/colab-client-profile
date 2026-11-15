# Changelog

Each version is kept on an `archive/` branch. See "Versions and rolling back" in the README.

## v4.0.1: ASC QA fixes

A full QA pass on v4.0: a walk-through of the live site in Chrome at laptop size, failure and edge cases in the test browser, and a code review. Fixes:

- **Nothing typed is lost when a save fails.** If the connection drops or the server errors, the text stays on screen, the header says "Not saved yet. Your changes are still here." with **Try Again**, and the next save sends it. A change the server refuses is rolled back and says so.
- **Closed contacts are read-only.** Intake, Identify and Interactions show their answers locked, with a note; case notes and action items can still be added. The server refuses changes to a closed contact's answers too.
- **Minutes check.** Interactions and Wrap Up warn when more minutes are documented than the contact lasted (a 300 for 30), without blocking. The server caps one interaction at 600 minutes and trims text fields.
- **Focus:** Returning Caller and They Gave Their Name focus their first field when opened and give focus back to their button on Cancel; choosing a match moves focus to the match card; Add to This Contact no longer pulls focus out from behind the history dialog.
- **The app no longer jumps when focus moves** (all of CoLab). Screen-reader-only text inside a scrolling area was measured against the page, so focusing some controls scrolled the whole app shell out of view. Each scrolling area now contains its own.
- **Laptop widths:** the ASC Contacts list fits without scrolling sideways (contact type and coordinator now sit under the person), and every client profile tab, ASC included, fits beside the panel.
- **Tests:** 597 browser checks across both data sources, up from 573, with a check for each fix.

## v4.0: ASC, inside CoLab

Version 2 of the ASC intake design, built into CoLab with its components, type and frame. Version 1, the clickable prototype, is saved on the ASC design canvas.

- **ASC is a CoLab.** Choose ASC under All CoLabs: Home gets an ASC card with New Phone Contact and New In-Person Contact, and the sidebar links to **ASC Contacts** (`#asc`), a list of every contact with In progress, Mine, Closed and All filters.
- **A contact** (`#asc/contact/<id>/<step>`) uses the client profile's frame: top bar with the running call or visit, Previous Interactions, Urgent Routing and Report Issue; the four steps as tabs that tick off when done; case notes and action items on the right. Everything saves as people type, with a saved indicator.
- **Intake** for every call and visit: phone or in person (site, privacy check), Safety first, who's calling, situation and reason, five screening questions (mental health, physical health, housing, food, substance use; a concern offers to add the need), needs with urgency, coverage, how they found us. **Returning Caller** by reference number. **They Gave Their Name** pins the MCI match on the intake, which keeps going; answers on file become one-tap confirmations.
- **Identify:** stay anonymous with a reference number, or search MCI (simple or advanced) and confirm and enroll, register a new client, or keep a name unverified. Earlier anonymous contacts can be linked. Enrolling moves the contact's notes and action items to the client, tagged ASC.
- **Interactions:** one card per resource or hand-off, the main in-call task, with need, service interaction type, how, minutes, calculated units, place of service and notes. Reminders from any card become action items. Follow-up permission and the best way to reach them; a yes schedules a 7-business-day follow-up and a 90-day check-in, on weekdays. In person: ID check, consent on the tablet, document scans.
- **Wrap Up:** an outcome for every need, a reporting check with the rows that go to the state, Close Contact.
- **Previous Interactions:** open items first, then every earlier contact with who handled it and what was given. **Urgent Routing** logs a transfer and closes the contact.
- **ASC tab** on enrolled clients' profiles: enrollment, open needs, latest screening and follow-up answers, contact history.
- **Data:** contacts in the data layer, the API contract (`/asc/…` endpoints) and the mock API; the server schedules follow-ups and moves records on enrollment. Search gains date of birth and ZIP. Jayden Ruiz joins the sample data; six clients are enrolled in ASC with past contacts. Saved data from v3.1 and earlier upgrades in place.
- **Accessibility:** WCAG 2.2 AA audit of every ASC screen and state, all issues fixed (see `docs/ASC-QA.md`). Also fixes two things across CoLab: dialogs pull focus back in if it escapes, and the rows-per-page menu's edge now meets 3:1.
- **Tests:** 573 browser checks across both data sources, up from 440, including the whole ASC flow, follow-up dates, keyboard use and ASC screens in the contrast, name and target-size audit.

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
