# Changelog

Each version is kept on an `archive/` branch. See "Versions and rolling back" in the README.

## v4.4: IPV High Risk Team Review, and CoLab tool sidebars

**IPV High Risk Team Review.** Choosing IPV CoLab in the menu opens IPV's own tool, built from the live IPV design:
- A status bar across the top: All Referrals, Intake (the default), For Review, Reviewed. Each view has its own address (`#ipv/intake`, `#ipv/review`, …), with a count.
- One grid per view: client and date of birth, OTN and SID, arrest date and agency, filing and effective dates (Intake and For Review) or effective date and last activity (All and Reviewed), risk type and status.
- Search by name, OTN, SID or MCI ID. Filter by Pittsburgh Police or other police departments. Sort by name or date.
- Each row's status is a menu: move a referral between Intake, For Review and Reviewed. Undo is offered.
- Select rows to move them together or download them. The download icon exports the selected rows, or the whole view, as CSV.
- At laptop widths the middle columns scroll while the client and status stay in view.

**Referral profile** (`#ipv/referral/<id>`): breadcrumb back to the view you came from, the status menu, MCI ID, SID and DOC #, then four collapsible sections:
- Referral Overview: Personal Information, or Client Activity (every status change, with who and when).
- Action Items and Case Notes, filed under IPV.
- Case Information: the arrest behind the referral and their other cases.

**Sidebar.** Choosing a CoLab switches the sidebar to that CoLab's own pages, as IPV does in the live tool. The CoLab menu moved to the top.
- IPV: Referrals (with its four views) and Reports. On a referral, Referral Profile lists the sections and follows the scroll.
- ASC: Contacts (In Progress, Mine, Closed, All Contacts), Close-Outs with a waiting count, and for supervisors Team and State Reporting. These replace the tabs on the ASC pages.
- All CoLabs and the other CoLabs keep CoLab Home, Action Items, Case Notes and Starred Clients.

**ASC Contacts.** The views are a status bar like IPV's, each with an address (`#asc/in-progress`, `#asc/all`, …). New In-Person Contact and New Phone Contact moved into the page header.

**Sample data.** One IPV referral for each IPV CoLab client, from their most recent domestic violence arrest when they have one; the rest were entered by DHS. All fictional.

## v4.3: Supervisor tools and close-outs

**ASC pages.** The ASC home has tabs: Contacts, Close-Outs, and, for supervisors, Team and State Reporting (`#asc/closeouts`, `#asc/team`, `#asc/reporting`). Close-Outs shows how many requests are waiting.

**Close-outs (coordinators).** Request Close-Out on a client's ASC tab asks a supervisor to discharge them:
- It needs a reason (needs met, connected to ongoing services, declined, unable to reach, moved, other) and takes a note.
- The dialog lists what's still open for the client first.
- The request waits; nothing changes until a supervisor decides. The person who asked can withdraw it.

**Discharge (supervisors).** From the Close-Outs queue, a supervisor discharges or declines (declining needs a note for the coordinator). Supervisors can also discharge directly from a client's ASC tab. Discharge:
- Ends the ASC enrollment and removes ASC from the client's CoLabs.
- Removes 7-day and 90-day follow-ups that haven't happened. Other action items stay.
- Writes an ASC case note and ends the ASC row on the Services tab.
- Can't happen while a contact is in progress.

The ASC tab stays on a discharged client's profile with the discharge details, and a new contact started there re-enrolls them.

**Reassignment (supervisors).** Team lists each person's contacts in progress and open ASC action items (overdue ones marked). Select some or all and reassign them to someone else. Each moved contact logs "Reassigned from … to …".

**State reporting (supervisors).** Pick a month to see every service line that would go to the state: one line per interaction on a closed contact with a verified client, with MCI ID, date, procedure code, units, place and coordinator.
- Lines that would be rejected are flagged: no interactions, missing minutes or place, no state service code, or the client's date of birth or gender missing.
- Contacts in progress, anonymous and name-only contacts are counted but not sent.
- Download CSV, then Mark as Submitted, which is blocked while any line has a problem.
- If a submitted month's contacts are corrected later, the page says which ones and asks for a resubmission.
- The prototype doesn't send anything to the state itself.

**Sample data.** One close-out request waits for a supervisor, and one October contact uses an interaction type with no state code yet, so the report has a problem to review.

**Fixed.** Overview lists both ASC enrollments when someone has been discharged and re-enrolled.

## v4.2: CoLab navigation, contact records, flags and follow-through

**Navigation.** The CoLab menu in the sidebar now takes you to that CoLab's home page instead of filtering every page:
- ASC opens ASC Contacts.
- The other CoLabs open their own home: starred clients, action items and case notes for that CoLab only.
- All CoLabs opens CoLab Home.

The "Showing … only" banner and the separate ASC Contacts link are gone. Action Items and Case Notes (no longer "My …") filter by CoLab on the page, like Starred Clients.

**ASC Contacts:**
- Contact type and coordinator are their own columns, and both can be sorted and filtered, alongside a search.
- New Phone Contact is the top-right button.

**Contact record.** Each contact in History has **Show Full Record**: every answer the coordinator filled in, the screening, needs and outcomes, follow-up, on-site steps, urgent routing, and a step-by-step log of what happened with times.
- The server writes the log as changes are saved.
- Typing in one field is one line.
- Corrections are marked.
- Older contacts get a log built from their answers.

The screening that sat at the top of the ASC tab now lives here.

**Flags.** A new Flags card sits left of Enrollment on the ASC tab: housing insecurity, food access, substance use, mental and physical health, and safety, from the person's latest self-reported answers. Earlier concerns are listed separately.

**Services tab.** Enrollment in ASC adds Administrative Service Coordination to the client's Services tab, with one instance per contact.

**Follow-through:**
- A contact that closes with open action items gives the coordinator a reminder, due in 3 business days.
- "Still open from earlier contacts" can now be acted on:
  - **Add to This Contact** for an open need, during a contact.
  - **Mark Done** for an action item.
  - **View EV-…** to open the contact it came from.

**Tests:** 711 checks across both data sources. The WCAG 2.2 AA audit script finds nothing, now including the new pages and states.

## v4.1: Simpler ASC, and supervisor corrections

**Simpler.** Every screen lost what it didn't need:
- **Header:** Event ID, Call Log ID and MCI ID only, and one tag. Saving is silent; only a failure shows. Each step's title is in the tab only. Most gray hint text is gone. Placeholders like "[code TBD]" stay in the data but aren't shown. **History** shows only when there's history.
- **Intake:**
  - One **Look Up Caller** button takes a reference number or a name and date of birth.
  - Phone or in person is set when the contact starts; **Change** on the timer fixes a mistake.
  - Safety is **No / Yes**.
  - Reason for calling is gone.
  - Screening answers are Yes / No / **Skip**, and a concern adds its need straight away, with Undo.
  - A chosen client shows as one line.
  - The "Still to ask" footer is gone.
- **Identify:**
  - The script box is gone.
  - Search is one form, with ZIP and SSN as optional fields.
  - No match offers **Search Last Name Only**, **Save Name Only** or **Register New Client**.
  - **Stay Anonymous**.
  - "Not the right person" is on Identify only.
- **Interactions:**
  - The needs row and screening grid are gone.
  - Add an interaction from one box, which suggests common resources.
  - Units show beside Minutes, and "Type" is the label.
  - A card only flags what's missing.
  - The minutes warning waits for Wrap Up.
- **Wrap Up:**
  - "Pick an outcome for each need."
  - Shorter outcomes: Still open, Info given, Connected, Handed off, Sent to crisis, Couldn't help, Declined.
  - One **Before you close** list with **Go to Step**.
  - **Show What's Sent** for the state table.
  - The closed screen is two lines and **Start Next Contact**.
- **Elsewhere:**
  - ASC Contacts dropped its intro.
  - The client ASC tab dropped the duplicate Open needs card.
  - The side panel dropped its labels.
  - Shorter buttons: Attach and View, Enroll, Close as Transfer, Cancel, Search Again, Get Signature, View History.

**Supervisor corrections.** An ASC supervisor can choose **Edit Closed Contact**, give a reason, and change any step's answers. Who the contact is can't change. **Save Corrections** checks every need still has an outcome. It then logs who changed what and why on the contact, and adds a correction note with the updated summary to the record. Coordinators see the contact locked. Prototype only: **Demo: sign in as** in the sidebar switches between Logan Bialik (coordinator) and Priya Natarajan (supervisor).

**Data:** saved v4.0 contacts upgrade in place: old outcome names, safety and screening answers, and staff roles.

**Tests:** 673 checks across both data sources, including corrections, the upgrade, and the new screens. The WCAG 2.2 AA audit script finds nothing.

## v4.0.2: Automatic contact summary

- **Closing a contact saves a summary as a case note.** It covers who called, the reason, their words, screening, each need and its outcome, each interaction, follow-up dates, on-site steps and the IDs. It goes on the client's record (tagged ASC), or stays on the contact while the person is anonymous and moves to their record when they identify. Urgent transfers get one too. It's a normal note, so it can be edited.
- Wrap Up's first section is now **Finish documenting today's conversation**.
- Tests: 607 checks across both data sources.

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
