# CoLab

A clickable prototype of **CoLab**, Allegheny County DHS's case-conferencing tool. It covers a staff member's home page, their own action items, case notes and starred clients, client search, and the full client profile.

It is a static site: plain HTML, CSS and JavaScript, with no framework and no build step.

**Live site:** https://rrybalov.github.io/colab-client-profile/ (once GitHub Pages is on)

> **All data is fictional.** Names, IDs, SSNs, cases and records in `data.js` are sample values for design review. Never put real client data in this repo.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

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

`c1` is Jimothy Jones. Any client ID from `data.js` works. The old single-page links (`#services`, `#overview` and so on) still open Jimothy Jones.

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
| Client profile | Everything from the first prototype: tabs, service and provider details, search, filters, sortable tables, the notes and action items panel |
| Client: All Case Notes | Add with a Restricted toggle, edit, delete with undo, date sort, pagination |
| Client: All Action Items | Add, edit, complete, delete with undo; Open / Overdue / Completed; pagination |

Other details carried over from the Figma file:

- The left rail on client pages shows its labels on hover.
- The PA DHS source pill explains where the data comes from.
- Program Enrollment spreads across the page when the notes panel is collapsed.

Changes made in the prototype, such as new notes, completed items and stars, live in memory only. A page reload resets them to the sample data.

Sample due dates and note dates move forward with the calendar, so "overdue" and "recent" stay meaningful no matter when you open the site.

Not wired yet: undo/redo, choose columns, row density and export on the Services table; the Services table's own pagination; and the Benefits tab, which has no design.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | Mount points for the app, modals and notifications |
| `styles.css` | ACDHS design tokens and every component style |
| `data.js` | Sample data. Swap this for API calls when the backend exists |
| `app.js` | Routing, state, rendering and interactions |

`app.js` keeps one `state` object. `render()` rebuilds the page from it and restores focus and scroll position afterwards. Clicks route through `data-action` attributes and form fields through `data-model`.

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
