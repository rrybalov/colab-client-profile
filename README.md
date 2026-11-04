# CoLab

A clickable prototype of **CoLab**, Allegheny County DHS's case-conferencing tool. It covers a staff member's home page, their own action items, case notes and starred clients, client search, and the full client profile.

It is built with React and bundled with esbuild into a single `app.js`, which is committed so GitHub Pages can serve the site with no build on its side.

**Live site:** https://rrybalov.github.io/colab-client-profile/ (once GitHub Pages is on)

> **All data is fictional.** Every name, ID, SSN, case and record comes from the sample-data generator in `src/data/seed.js`. Never put real client data in this repo.

## Run it

The built `app.js` is in the repo, so you can open `index.html` directly or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

To change the code, install and rebuild:

```sh
npm install
npm run build    # writes app.js
npm run watch    # rebuilds on save and serves on http://localhost:8000
```

Commit the rebuilt `app.js` with your source changes.

## Publish with GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. Save. The site goes live at the address above within a minute or two.

The `.nojekyll` file tells Pages to serve the files as they are.

## Pages and links

Every page has its own address, so you can link straight to it and the browser's back button works.

| Page | Address |
| --- | --- |
| CoLab Home | `#home` |
| My Action Items | `#my-action-items` |
| My Case Notes | `#my-case-notes` |
| Starred Clients | `#starred-clients` |
| Client profile tabs | `#client/c1/overview`, `/services`, `/program-info`, `/providers`, `/benefits` |
| Client: all case notes | `#client/c1/case-notes` |
| Client: all action items | `#client/c1/action-items` |
| Service details | `#client/c1/service/s1` |
| Provider details | `#client/c1/provider/Mercy` |

`c1` is Jimothy Jones, the client drawn in Figma. `c2` to `c64` are generated clients. The old single-page links (`#services`, `#overview` and so on) still open Jimothy Jones.

## What works

| Area | Interactions |
| --- | --- |
| Home | Starred clients carousel with paging, star and copy-ID buttons; recent action items with Open / Overdue; recent case notes with Show more; links to every "View all" page |
| Sidebar | Page navigation; **Choose CoLab** narrows Home and every My page to one CoLab; Report an Issue |
| My Action Items | All / Personal / CoLab filter cards with counts; Open / Overdue / Completed; complete with undo; pagination with rows per page |
| My Case Notes | All / Personal / CoLab filter cards; date sort; pagination |
| Starred Clients | Filter cards for private stars and each CoLab; search; sortable name, date of birth and date favorited; unstar with undo; pagination |
| Search for Clients | Search by any combination of fields; results, no-match and too-many-results states; star from results; open a client; Report Missing Client form with required fields and confirmation |
| Report an Issue | Issue type, details, contact info; submit enables when complete; confirmation |
| Client profile | Tabs, service and provider details (each with its own address), search, filters, sortable and paged tables, the notes and action items panel; clients with no justice records or enrollments show empty states |
| Client: All Case Notes | Add with a Restricted toggle, edit, delete with undo, date sort, pagination |
| Client: All Action Items | Add, edit, complete, delete with undo; Open / Overdue / Completed; pagination |

Other details carried over from the Figma file:

- The left rail on client pages shows its labels on hover.
- The PA DHS source pill explains where the data comes from.
- Program Enrollment spreads across the page when the notes panel is collapsed.

## Everything you do is saved

Changes stay in place across reloads and between visits, in this browser:

- **Records:** new, edited and deleted case notes; completed, added and edited action items; stars; reports from Report Missing Client and Report an Issue.
- **Where you were:** every filter, search box, sort, page number, rows-per-page choice, tab, expanded row, the CoLab you picked, whether the notes panel is open, and any open dialog.
- **Drafts:** a half-written case note, action item or form survives a reload or a trip to another page.

The full SSN is the one exception. It hides again on reload on purpose.

Records also sync live between open tabs, so a "View All" page opened in a new tab stays in step with the profile.

**Reset sample data**, at the bottom of the sidebar, erases your changes and restores the sample data after a confirmation. Data lives in the browser's `localStorage` (`colab.db` for records, `colab.prefs` for UI state), so each browser and each person has their own copy.

## Sample data

`src/data/seed.js` generates 64 clients from a fixed seed, so everyone sees the same people:

- Jimothy Jones (`c1`) keeps the record drawn in Figma.
- The other 63 have names, households, dates of birth, contact details, Pittsburgh-area addresses, CoLab memberships, services and service instances from seven providers, benefit enrollments, and for some, court, jail, probation and custody history.
- Case notes and action items are written from templates that fit each client's CoLabs, programs and providers.
- Eight staff members write notes and own action items. You are signed in as Logan Bialik, so the "My" pages show only Logan's notes and items.

Dates are placed relative to the day the data is first created in a browser, so "overdue" and "recent" stay meaningful.

Not wired yet: undo/redo, choose columns, row density and export on the Services table, and the Benefits tab, which has no design.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | Page shell; loads `styles.css` and `app.js` |
| `styles.css` | ACDHS design tokens and every component style |
| `app.js` | The built bundle. Don't edit it by hand |
| `src/main.jsx` | Entry point: routes to a page, sets the title, mounts dialogs and notifications |
| `src/store.jsx` | State: records and UI preferences, saving to `localStorage`, undo, cross-tab sync, reset |
| `src/router.jsx` | Hash routes and the `Link` component |
| `src/ui.jsx` | Shared pieces: tables, sort headers, pagers, filter cards, note and action rows, dialog |
| `src/pages/hub.jsx` | Sidebar, Home, My Action Items, My Case Notes, Starred Clients |
| `src/pages/client.jsx` | Client profile, its tabs, details pages, full-page notes and action items, the side panel |
| `src/modals.jsx` | Search, Report Missing Client, Report an Issue |
| `src/data/seed.js` | The sample-data generator. Swap it for API calls when the backend exists |
| `src/lib.js` | Date, name, sort and summary helpers |

Any piece of UI state that should survive a reload uses `usePref(key, default)` in place of `useState`. Record changes go through `mutate(fn, toastText, undoable)`.

## Design system

Colors and type come from the ACDHS design system, defined as CSS custom properties at the top of `styles.css`:

- **Surfaces:** White `#FFFFFF`, Smoke `#F5F5FF`, Ash `#DBDBF0`
- **Content:** Black `#121221`, Slate `#3D3D4B`, Stone `#6C7084`
- **Action:** Blue `#2626D9`, Light Blue `#5E66BA`, Dark Blue `#262673`
- **Signals:** Green `#05DEB4`, Yellow `#EDCA91`, Red `#ED9489`, Sky Blue `#ACD0FF`

The typeface is Roboto. To switch to Noto Sans, change the Google Fonts link in `index.html` and `--font` in `styles.css`.

Deliberate departures from the source design, all for WCAG 2.1 AA:

- Delete and overdue icons use a darker red (`--red-text: #B4382C`). Signal Red on white is below 3:1.
- Every icon-only button has an accessible name, sortable headers report their sort state, and dialogs keep keyboard focus inside them and close with Escape.
- On client pages, the top bar, rail and notes panel stay fixed while only the main column scrolls. Below 760px wide the page scrolls normally.

## Source

Rebuilt from the Figma file *CoLab (Case Conferencing)*: the ClientView MVP page (home, my work, starred clients, search) and the Services page and prototype (client profile).
