# CoLab Client Profile

A clickable prototype of the client profile in **CoLab**, Allegheny County DHS's case-conferencing tool. It covers what a case conference team sees for one client: services, program enrollment, justice involvement, providers, and a private panel of case notes and action items.

It is a static site: plain HTML, CSS and JavaScript, with no framework and no build step.

> **All data is fictional.** Names, IDs, SSNs, cases and records in `data.js` are sample values for design review. Never put real client data in this repo.

## Run it

Open `index.html` in a browser, or serve the folder so hash links behave like they will in production:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publish with GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. Save. The site is live at `https://<account>.github.io/<repo>/` within a minute or two.

The `.nojekyll` file tells Pages to serve the files as they are.

## What works

| Area | Interactions |
| --- | --- |
| Client header | SSN reveal and copy; tooltips on every ID |
| Services tab | Grouped / All Services toggle; search; provider and program filters; **More filters** (program area, last-activity date) with a count badge; sortable columns; row menu |
| Service / Provider details | Open from any service name or provider tag; search, filters and sortable columns; breadcrumb back to the client |
| Client Overview | Contact, Demographic and Program Enrollment views |
| Program Info | Program picker; Case History filter (All / Domestic Violence) and sortable columns; expandable incarceration events |
| Providers tab | Search, program filter, sortable columns; provider names open Provider details |
| Notes panel | Collapse and expand; add, edit, delete and expand case notes; sort notes by date; add, edit, complete and delete action items; filter by All / Open / Overdue / Completed |

Each tab has its own URL hash (`#services`, `#overview`, `#program-info`, `#providers`, `#benefits`), so you can link straight to one.

Not wired yet: undo/redo, choose columns, row density, export, pagination, and the Benefits tab, which has no design.

Edits to notes and action items live in memory only. A page reload resets them to the sample data.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | The fixed app frame (top bar and left rail) and mount points |
| `styles.css` | ACDHS design tokens and every component style |
| `data.js` | Sample data. Swap this for API calls when the backend exists |
| `app.js` | State, rendering and interactions |

`app.js` keeps one `state` object. `render()` rebuilds the main column and the notes panel from it, and restores focus and scroll position afterwards. Clicks route through `data-action` attributes and form fields through `data-model`.

## Design system

Colors and type come from the ACDHS design system, defined as CSS custom properties at the top of `styles.css`:

- **Surfaces:** White `#FFFFFF`, Smoke `#F5F5FF`, Ash `#DBDBF0`
- **Content:** Black `#121221`, Slate `#3D3D4B`, Stone `#6C7084`
- **Action:** Blue `#2626D9`, Light Blue `#5E66BA`, Dark Blue `#262673`
- **Signals:** Green `#05DEB4`, Yellow `#EDCA91`, Red `#ED9489`, Sky Blue `#ACD0FF`

The typeface is Roboto. To switch to Noto Sans, change the Google Fonts link in `index.html` and `--font` in `styles.css`.

Two deliberate departures from the source design, both for WCAG 2.1 AA:

- Delete and overdue icons use a darker red (`--red-text: #B4382C`). Signal Red on white is below 3:1.
- Every icon-only button has an accessible name, every sortable header reports its sort state, and the top bar, rail and notes panel stay fixed while only the main column scrolls (below 760px wide the page scrolls normally).

## Source

Rebuilt from the Figma file *CoLab (Case Conferencing)*, Services page and prototype.
