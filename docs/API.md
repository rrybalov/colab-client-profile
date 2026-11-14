# CoLab API contract

What the app needs from a backend. Build these endpoints, set `dataSource: 'api'` in `config.js`, and the app runs on real data with no code changes.

`tools/mock-api.mjs` implements every endpoint here from the sample data. Use it as a working reference, and run `npm test` against a new backend to check it behaves the same.

## Conventions

- All paths are relative to `api.baseUrl` in `config.js` (default `/api`).
- Requests and responses are JSON. Send `Content-Type: application/json` on bodies.
- Errors return a 4xx or 5xx status with `{ "error": "A sentence a person can read." }`. The app shows that sentence.
  - `404` for a missing client, note, action item or provider. The app shows "Client not found" for a 404 on `GET /clients/:id`.
  - `400` for invalid input.
- Authentication is the server's job. The app sends cookies (`credentials` in `config.js`) and any `headers` you list there, such as a bearer token.
- Dates shown to people use `mm/dd/yyyy`. Action-item `due` dates use `yyyy-mm-dd`, because they feed a date input.
- Unknown fields are ignored. Missing optional fields become empty values (see `src/data/schema.js`, which normalizes every response).

## Records

The shapes are defined in full, with types, in `src/data/schema.js`.

**Staff** `{ id, first, last, org, email, initials }`

**CoLab** `{ id, name, tag }`. `tag` is the uppercase label on notes and action items, such as `IPV` or `WELLNESS CHECKS`.

**ClientSummary**: what lists, cards and search results need.

```json
{
  "id": "c1", "first": "Jimothy", "last": "Jones", "household": false, "dob": "02/09/2000",
  "mci": "1234567890", "ssn4": "1234", "phone": "(412) 123-4567", "email": "…",
  "address": { "street": "999 Murray Avenue, Apt 502", "city": "Pittsburgh", "state": "PA", "zip": "15217",
               "school": "Pittsburgh City School District", "ward": "Ward 15, District 8 (Pittsburgh)", "facility": null },
  "colabs": ["IPV", "ACGO"],
  "starred": "IPV",
  "favorited": "01/06/2026"
}
```

- `starred`: `null` when not starred. Otherwise `"private"` (starred by this person) or the id of the CoLab it was starred in.
- For a household, `first` is the family name, `last` is `"Household"`, and `dob` is empty.

**Client**: a ClientSummary plus:

- identity and demographics: `members` (household member names or `null`), `dhs`, `dpw`, `gender`, `legalSex`, `race`, `ethnicity`, `marital`, `living`, `language`
- `sources`: where each contact detail came from and when, as `{ address, phone, email }`. Each is `{ source: "PA DHS", asOf: "10/14/2026" }`.
- `services`: `[{ id, service, area, program, first, last, added, all: [provider], grouped: [provider] }]`
- `instances`: `[{ service, provider, facility, program, dx, units, rate, rateType, cost, status, first, last }]`
- `enrollments`: `[{ name, kind, status, pct, start, end, asOf, stale }]`. `kind` is one of `active`, `ending`, `presumed` or `inactive`.
- `justice`: `null`, or `{ highRisk, jail, involvement, bip, cases, probation, incarceration, custody }`. See the schema for the inner fields. Custody events carry `facility`, `agency`, `admission` and `release`.
- `addresses`: every address any program has reported for the client, as AddressRecords (below). Send them in any order.

`address` is the one address the profile leads with. It should be the most recent open AddressRecord (`end: null`, latest `start`); the overview, the Address Details dialog and the Address History page all read `addresses`.

**AddressRecord**: one address, as the programs that reported it saw it.

```json
{
  "id": "a01", "street": "999 Murray Ave, Unit 500", "city": "Pittsburgh", "township": "Pittsburgh",
  "county": "Allegheny", "zip": "15217", "schoolDistrict": "Pittsburgh City School District",
  "addressType": "Permanent", "residential": true, "kind": "home", "useDescription": "Primary residence — client re-housed via OBH rapid re-housing program",
  "start": "2025-04-01", "effDate": "2025-04-03", "end": null,
  "sources": ["OBH", "Provider"],
  "specificSources": [{ "bucket": "OBH", "name": "DCS - HealthChoices - CCBH Eligibility", "code": "CCBHEL" }, …],
  "reports": [{ "agency": "OBH – Allegheny County", "date": "2025-04-01", "method": "Intake form", "county": "Allegheny" }, …],
  "certainty": "high", "conflict": "",
  "email": "dmwilliams84@gmail.com", "phone": { "number": "(412) 555-0183", "type": "Mobile", "validDate": "2025-04-01" },
  "altPhones": [{ "number": "(412) 555-0297", "type": "Work", "validDate": "2025-04-15" }], "providerLocation": "Mercy Behavioral Health, 1 Smithfield St, Pittsburgh, PA 15222",
  "facilityId": "PA-OBH-MBH-00017"
}
```

- Dates are `yyyy-mm-dd` calendar days, shown as the same day everywhere. `end: null` means the address is still open (current). `effDate` is optional.
- **Concurrent addresses.** Records whose date ranges overlap (an open record runs to today and beyond) form a concurrent period. Several open records at once is normal: a mailing address, a shelter stay and a residence can all be current. The app works this out from the dates; the API doesn't group them.
- `sources` are program tags, from `OBH`, `DHS`, `Medicare`, `SNAP`, `CYF`, `ACHD`, `Shelter`, `Provider`, `Self`. `specificSources` names the systems behind each tag; when a tag has none, the app lists the `reports` whose `agency` contains the tag name.
- `county` may end with a state code in brackets, such as `"Brooke (WV)"`. Without one the state is PA.
- `kind` picks the icon: `home`, `shelter`, `transitional` or `incarcerated`.
- `conflict` is a free-text note; when it is present the table marks the row "concurrent".
- `providerLocation` is `"Name, street, city, ST zip"`; the name is everything before the first part that starts with a number.

It **never** includes the full SSN.

**Note** `{ id, clientId, date, edited, restricted, tag, author, text }`. `author` is a staff id.

**ActionItem** `{ id, clientId, tag, text, assignee, due, done, edited }`. `assignee` is a staff id.

**Provider** `{ name, address, phone, email, facilities }`

**Client** also carries two optional ASC fields: `guardian: { name, relationship, phone, note } | null` and `coverage: { plan, status, asOf } | null` (coverage on file, shown as a quick check during intake).

### ASC (Administrative Service Coordination)

A **Contact** is one phone call or in-person visit. It starts anonymous. `clientId` is set once the person is identified and enrolled in ASC; until then its case notes and action items live on the contact itself.

**Contact** `{ id, ref, channel, logId, site, startedAt, endedAt, status, closedKind, staff, clientId, identity, candidateId, path, group, priorRefs, linkedPrior, unverifiedName, anon, intake, screening, needs, interactions, followUp, onsite, notes, actions, links, urgent, client, candidate, possibleLinks }`

| Field | Meaning |
| --- | --- |
| `ref` | Event ID given to the caller, `EV-26-000184`. A returning caller reads it back. |
| `channel` | `phone` or `person`. `logId` is the Call Log ID or Visit ID; `site` is where an in-person visit happens. |
| `startedAt`, `endedAt` | ISO 8601 timestamps. `status` is `open` or `closed`; `closedKind` is `anon`, `client` or `urgent`. |
| `identity` | `matched` (found in MCI), `new` (registered during the contact), `unverified` (name only, no MCI record) or `null`. |
| `candidateId` | A client picked during intake but not yet confirmed and enrolled. |
| `path` | `anon` once they choose to stay anonymous, `client` once they share info. |
| `group`, `priorRefs` | Contacts tied together by a returning caller's reference number. Linking the contact to a client links the whole group. |
| `intake` | `{ safety, caller, callerOther, callerName, age, story, reason, reasonText, coverage, coverageDetail, found, foundOther, privacy, callerConfirmed, coverageConfirmed }` |
| `screening` | `{ mh, ph, house, food, su }`, each an answer string or `null` (not asked). |
| `needs` | `[{ id, name, urg: Routine/Urgent/Crisis, outcome, outcomeNote }]` |
| `interactions` | `[{ id, what, need, type, how, min, place, notes }]`, one per resource or hand-off. Units are `max(1, round(min / 15))` [state rounding rule to confirm]. The service code is the `T1016…` code in `type`. |
| `followUp` | `{ ok: Yes/No/null, how, time }`. Follow-ups are scheduled only after `ok` is `Yes`. |
| `onsite` | `{ idCheck, consentSigned, docs }`, in person only. `idCheck` records that an ID was seen, never its number. |
| `links` | `[{ actionId, ixId, auto }]`: action items made from this contact. `ixId` is the interaction a reminder came from; `auto` is `d7` or `d90` for the automatic follow-ups. |
| `client`, `candidate`, `possibleLinks` | Read-only, added by the server: summaries of the client, the candidate, and earlier anonymous contacts that may be the same person. |

**ContactSummary** (lists) `{ id, ref, channel, site, startedAt, endedAt, status, closedKind, staff, clientId, identity, path, clientName, anonName, needs: [{ name, urg, outcome }], ixCount, ixMin, ixUnits }`

## Endpoints

| Method and path | Returns | Notes |
| --- | --- | --- |
| `GET /session` | `{ user: Staff, staff: Staff[], colabs: CoLab[] }` | The signed-in person, everyone who can be assigned work, and the CoLabs. Loaded once at start. |
| `GET /clients?starred=true` | `ClientSummary[]` | Every client this person has starred. |
| `GET /clients/search?first=&last=&phone=&email=&mci=&dhs=&ssn=` | `{ total, results: ClientSummary[] }` | Any combination of fields; empty ones are left out. Matching: first and last names are case-insensitive substrings, and a household matches on a member's name. Phone and DHS ID compare digits only. `ssn` is the last 4. When more than 15 match, return the `total` and an empty `results`: the app asks the person to narrow the search. With no fields, return `400`. |
| `GET /clients/:id` | `Client` | `404` if the client doesn't exist or this person can't see them. |
| `GET /clients/:id/ssn` | `{ ssn: "123-45-6789" }` | Called only when someone clicks Show SSN or Copy SSN. Log it. |
| `PUT /clients/:id/star` | `ClientSummary` | Body `{ starred: "private", favorited?: "mm/dd/yyyy" }` to star, or `{ starred: null }` to unstar. |
| `GET /clients/:id/notes` | `Note[]` | Every note on this client. Newest first is fine; the app sorts by date. |
| `POST /clients/:id/notes` | `Note` (201) | Body `{ text, restricted }`. The server sets `id`, `date`, `author` and `tag` (`PERSONAL` unless given). Undo of a delete sends the old note back with its `id`, `date`, `author` and `tag`; keep them if you can, or assign new ones. |
| `PATCH /notes/:id` | `Note` | Body: any of `{ text, restricted }`. Marks the note `edited`. |
| `DELETE /notes/:id` | 204 | |
| `GET /clients/:id/action-items` | `ActionItem[]` | Newest first. The panel shows the first five. |
| `POST /clients/:id/action-items` | `ActionItem` (201) | Body `{ text, assignee, due }`. `due` may be empty. Undo of a delete sends the old item back, as for notes. |
| `PATCH /action-items/:id` | `ActionItem` | Body: any of `{ text, assignee, due, done }`. Changing `text`, `assignee` or `due` marks it `edited`; `done` alone does not. |
| `DELETE /action-items/:id` | 204 | |
| `GET /me/notes` | `{ notes: Note[], clients: ClientSummary[] }` | Notes the signed-in person wrote, plus a summary of each client they mention. |
| `GET /me/action-items` | `{ actionItems: ActionItem[], clients: ClientSummary[] }` | Action items assigned to the signed-in person, plus their clients. |
| `GET /providers/:name` | `Provider` | Contact details for the provider details page. |
| `POST /reports` | `{ id }` (201) | Report Missing Client (`kind: "missing"`) and Report an Issue (`kind: "issue"`). Stores the form fields and the page they came from (`page`). |
| `GET /clients/search?…&dob=&zip=` | as above | ASC adds `dob` (`yyyy-mm-dd` or `mm/dd/yyyy`, exact) and `zip` (prefix). |
| `GET /asc/contacts?status=&clientId=` | `ContactSummary[]` | Newest first. Both filters optional. |
| `POST /asc/contacts` | `Contact` (201) | Body `{ channel, clientId? }`. Starts the clock and assigns `ref` and `logId`. With `clientId` (started from a client's ASC tab) the client must already be in ASC. |
| `GET /asc/contacts/lookup?ref=` | `ContactSummary` | A returning caller's reference number; the digits are enough. `404` if none. |
| `GET /asc/contacts/:id` | `Contact` | |
| `PATCH /asc/contacts/:id` | `{ contact, notes, actions, removeActions }` | Body: any of `intake`, `screening`, `followUp`, `onsite`, `anon` (merged one level deep); `needs`, `interactions`, `notes`, `actions` (replaced whole); `channel`, `site`, `path`, `candidateId`, `unverifiedName`, `identity: "unverified"|null`, `linkedPrior: "linked"|"no"`, `priorRef` (attach a returning caller's earlier contacts), and the link operations `addLinks: [{ actionId, ixId }]`, `removeLinks: [actionId]`, `dropIxLinks: ixId`. The server keeps the two automatic follow-ups in step with `followUp` and returns the client action items it created or removed. |
| `POST /asc/contacts/:id/link` | `{ contact, client, notes, actions, removeActions }` | Body `{ clientId }` for a client found in MCI, or `{ newClient: { first, last, dob, gender, ssn?, phone?, street?, city?, zip?, county?, living?, language? } }` to register one. Enrolls them in ASC (adds the `ASC` CoLab and an enrollment), moves the contact's notes and action items (and those of every contact in its group) to the client tagged `ASC`, and schedules follow-ups if allowed. Returns everything that changed. |
| `POST /asc/contacts/:id/close` | `Contact` | Body `{}` to close normally: every need needs an `outcome`, else `400`. Or `{ urgent: { dest, how, need, note } }` for urgent routing: that need closes as Transferred to crisis and the others stay open. |
| `GET /asc/history?contactId=` or `?clientId=` | `{ openItems, contacts }` | What a coordinator sees when someone comes back: open needs and open ASC action items first, then each earlier contact with who handled it, its needs and outcomes, interactions, screening and notes. |

**Automatic follow-ups.** When a contact has a client and `followUp.ok` is `Yes`, the server creates two action items, tagged `ASC` and assigned to the contact's coordinator: a follow-up 7 business days after the contact (weekends skipped) and a check-in 90 days after, moved to Monday if it lands on a weekend. Changing the way to reach them rewrites the first one's text; answering `No` deletes any that aren't done. County holidays are not skipped yet [not decided].

## What the app does with responses

- It changes the screen as soon as someone acts, then sends the request. If the request fails, it undoes the change and shows the server's error.
- Undo is the opposite request (re-create, toggle back, re-star), sent after the original finishes.
- It loads each screen's data when the screen opens and keeps it while the person moves around. With the sample data it also reloads when another tab changes something. An API source can add the same by calling the store's `invalidate` (see `src/state/store.jsx`).

## Not yet in the contract

- Paging for very long note or action-item lists. Today each client's list comes back whole.
- Who may see restricted notes. The server should filter them; the app shows whatever it receives.
- Choosing a CoLab tag for a new note or action item. The design has no control for it yet, so new ones are `PERSONAL`, except during an ASC contact, where they are `ASC`.
- ASC: real service codes and place-of-service codes (shown as `[code TBD]`), the state's unit rounding rule, county holidays in the 7-day follow-up, consent forms and document scanning (the prototype records that they happened), and the referral step that follows intake.
