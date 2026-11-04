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

## Test it

```sh
npm install
npx playwright install chromium   # once
npm test
```

`npm test` builds the app and runs `tests/e2e.mjs` in a real browser twice: once on the sample data in the browser and once against the mock API. It covers every page, filter, sort, save, undo, reload, dialog, loading and error state, plus accessibility, phone width and a check of every data point for all 64 clients, including each one's address badge, dialog and timeline. `node tests/e2e.mjs local` or `node tests/e2e.mjs api` runs one mode.

## Connect a real API

The app reads all data through one interface with two plug-ins (`src/data/sources/`):

- **local**: sample data saved in the browser. This is the default.
- **api**: a CoLab API over HTTP.

To switch a deployed copy, edit `config.js`. No rebuild needed:

```js
window.COLAB_CONFIG = {
  dataSource: 'api',
  api: { baseUrl: 'https://colab.example.gov/api', credentials: 'include', headers: {} }
};
```

`docs/API.md` is the contract a backend team builds to: every endpoint, request and record shape.

To try it without a backend, run the mock API and open the app through it:

```sh
npm run mock-api                      # serves the app and the API on http://localhost:8787
# open http://localhost:8787/?api=/api
```

`?api=<url>` in the address points one visit at an API. It only works while `config.js` is on sample data, so a live, API-backed site can't be redirected by a link.

## Versions and rolling back

Every release is kept on its own branch, so nothing is lost:

| Branch | What it is |
| --- | --- |
| `archive/v1.0` | The first client profile, in plain JavaScript |
| `archive/v1.1` | Home, My pages, Starred and search, in plain JavaScript |
| `archive/v2.0` | The React rebuild with saved state and sample data |
| `archive/v2.1` | Fixes from review: target sizes, Show more, panel layout, headers, typo |
| `archive/v3.0` | The data layer, API support, loading and error states, tests |
| `archive/v3.1` | Address History |

`CHANGELOG.md` lists what changed in each.

**See an old version:** on GitHub, open the branch menu and pick an `archive/` branch. To run it, download that branch and open `index.html`.

**Roll the live site back** to a version, keeping history (here, to v2.1):

```sh
git checkout main
git revert --no-edit archive/v2.1..HEAD
git push
```

Or, to make `main` exactly match an archived version, and throw away everything after it:

```sh
git checkout main
git reset --hard archive/v2.1
git push --force-with-lease
```

The second command rewrites `main`, so use the first unless you're sure.

Data saved in a browser upgrades forward automatically (v2.x and v3.0 notes, stars and changes are kept in v3.1, and every client gains an address history). Going back to an older version resets that browser to the sample data.

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
| Address History | `#client/c1/address-history` |

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
| Address | On Client Overview: the most recent address, an **N Concurrent** badge when other addresses are open at the same time, **View Address Details** and **View Full Address History** |
| Address Details dialog | Most recent verified address, its program tags and as-of date; every concurrent address as an expandable card (one open at a time) with contact details and the matched provider; a button to the full history |
| Address History | Timeline grouped by year, with concurrent periods outlined and dated; or a table with search, sorting and report counts. Both filter by program (OBH, DHS, Medicare, SNAP, CYF, ACHD, Shelter, Provider, Self). Hover or focus a program tag to see the systems or report dates behind it |

Other details carried over from the Figma file:

- The left rail on client pages shows its labels on hover.
- The PA DHS source pill explains where the data comes from.
- Program Enrollment spreads across the page when the notes panel is collapsed.

## Everything you do is saved

Changes stay in place across reloads and between visits, in this browser:

- **Records:** new, edited and deleted case notes; completed, added and edited action items; stars; reports from Report Missing Client and Report an Issue.
- **Where you were:** every filter, search box, sort, page number, rows-per-page choice, tab, expanded row (including the open address card and the Address History view and program filter), the CoLab you picked, whether the notes panel is open, and any open dialog. Moving to another page closes an open dialog; a reload keeps it.
- **Drafts:** a half-written case note, action item or form survives a reload or a trip to another page.

The full SSN is the one exception. It is fetched only when someone clicks Show SSN or Copy SSN, so a real system can log each request, and it hides again on reload.

Changes show on screen at once. If the data source refuses one, the change is undone and an error explains why. With sample data, records also sync live between open tabs.

**Reset sample data**, at the bottom of the sidebar, erases your changes and restores the sample data after a confirmation. With sample data, records live in the browser's `localStorage` (`colab.db`), so each browser and each person has their own copy. UI state is always saved in the browser (`colab.prefs`). With an API, records live on the server and Reset sample data is hidden.

## Sample data

`src/data/seed.js` generates 64 clients from a fixed seed, so everyone sees the same people:

- Jimothy Jones (`c1`) keeps the record drawn in Figma. His 47-address history is the Address History prototype's own data, so his address is now 999 Murray Avenue, Apt 502, the prototype's most recent verified address.
- Every other client gets an address history of 3 to 40-odd records built from their own profile (`src/data/address-gen.js`): the current address first, earlier homes going back to adulthood, shelter and transitional stays for people who were unhoused, custody records matching their jail and prison history, mailing PO boxes, out-of-state Medicare addresses, and duplicate units, with overlaps that make concurrent periods. Each record has program tags, source systems, report dates, contact details and, where it fits, a matched provider.
- The other 63 have names, households, dates of birth, contact details, Pittsburgh-area addresses, CoLab memberships, services and service instances from seven providers, benefit enrollments, and for some, court, jail, probation and custody history.
- Case notes and action items are written from templates that fit each client's CoLabs, programs and providers.
- Eight staff members write notes and own action items. You are signed in as Logan Bialik, so the "My" pages show only Logan's notes and items.

Dates are placed relative to the day the data is first created in a browser, so "overdue" and "recent" stay meaningful.

Not wired yet: undo/redo, choose columns, row density and export on the Services table, and the Benefits tab, which has no design.

Contact-detail sources and dates, custody facilities and admission and release reasons, provider contact details and full SSNs all come from the data, so a real API can supply them.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | Page shell; loads `styles.css`, `config.js` and `app.js` |
| `config.js` | Runtime settings: sample data or an API, and the API's address |
| `styles.css` | ACDHS design tokens and every component style |
| `app.js` | The built bundle. Don't edit it by hand |
| `src/main.jsx` | Entry point: picks the data source, waits for the session, routes to a page |
| `src/config.js` | Reads `config.js` and the `?api=` override |
| `src/router.jsx` | Hash routes and the `Link` component |
| `src/state/store.jsx` | State: the record cache, query status, saved UI choices, notifications, optimistic saves |
| `src/state/data.js` | Hooks that load and return records (`useClient`, `useMyNotes`, `useSearch`…) and every change (`useMutations`) |
| `src/state/modal.js` | Opening and closing dialogs |
| `src/data/schema.js` | Every record's shape, and the normalizers API responses pass through |
| `src/data/backend.js` | What the server does: search, filters, saving. Shared by the local source and the mock API |
| `src/data/sources/local.js` | Sample data in the browser, with upgrade from older saved data |
| `src/data/sources/http.js` | The real API client |
| `src/data/seed.js` | The sample-data generator |
| `src/data/addresses.js` | Address rules: current and most recent, concurrent periods, the timeline, durations, program tags |
| `src/data/address-gen.js`, `src/data/address-c1.js` | Generated address histories, and Jimothy's from the prototype |
| `src/tables.js` | Every sortable table's columns and widths |
| `src/lib.js` | Date, name, sort and summary helpers |
| `src/ui/` | Icons, generic controls (tables, pagers, dialogs, loading and error states) and record pieces (note and action rows, star button) |
| `src/pages/hub/` | Sidebar, Home, My Action Items, My Case Notes, Starred Clients |
| `src/pages/client/` | Client profile: frame, header, one file per tab, details pages, full-page lists, the side panel. `address/` holds the Address Details dialog and the Address History page |
| `src/modals/` | Search, Report Missing Client, Report an Issue |
| `tools/mock-api.mjs` | A stand-in API serving the sample data |
| `tests/e2e.mjs` | The browser test suite |
| `docs/API.md` | The API contract |

How the pieces fit:

- Pages never call the data source. They use the hooks in `src/state/data.js`, which load what a screen needs, cache it, and return it ready to show.
- Records sit in one cache keyed by id, so a star or a completed item updates every screen at once.
- UI state that should survive a reload uses `usePref(key, default)` in place of `useState`.

## Design system

Colors and type come from the ACDHS design system, defined as CSS custom properties at the top of `styles.css`:

- **Surfaces:** White `#FFFFFF`, Smoke `#F5F5FF`, Ash `#DBDBF0`
- **Content:** Black `#121221`, Slate `#3D3D4B`, Stone `#6C7084`
- **Action:** Blue `#2626D9`, Light Blue `#5E66BA`, Dark Blue `#262673`
- **Signals:** Green `#05DEB4`, Yellow `#EDCA91`, Red `#ED9489`, Sky Blue `#ACD0FF`

The typeface is Roboto. To switch to Noto Sans, change the Google Fonts link in `index.html` and `--font` in `styles.css`.

Deliberate departures from the source design, all for WCAG 2.1 AA:

- Delete and overdue icons use a darker red (`--red-text: #B4382C`). Signal Red on white is below 3:1.
- Address program tags use the prototype's colors, one per program. SNAP, ACHD, Provider and Self text is a shade darker than the prototype's so every tag passes 4.5:1.
- Every icon-only button has an accessible name, sortable headers report their sort state, and dialogs keep keyboard focus inside them and close with Escape.
- On client pages, the top bar, rail and notes panel stay fixed while only the main column scrolls. Below 760px wide the page scrolls normally.

## Source

Rebuilt from the Figma file *CoLab (Case Conferencing)*: the ClientView MVP page (home, my work, starred clients, search) and the Services page and prototype (client profile).
