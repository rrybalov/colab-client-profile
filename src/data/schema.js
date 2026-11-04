// The shape of every record the app works with, and normalizers that turn whatever a data source returns
// into exactly that shape. Every response from the API passes through these, so a missing optional field
// becomes an empty value instead of a crash. docs/API.md describes the same shapes for a backend team.
//
// Dates: mm/dd/yyyy strings for display dates (dob, note dates, service dates); yyyy-mm-dd for action-item
// due dates, which feed a date input.

/**
 * @typedef {{ id: string, first: string, last: string, org: string, email: string, initials: string }} Staff
 * @typedef {{ id: string, name: string, tag: string }} Colab
 * @typedef {{ user: Staff, staff: Staff[], colabs: Colab[], canReset?: boolean }} Session
 * @typedef {{ street: string, city: string, state: string, zip: string, school: string, ward: string, facility: string|null }} Address
 * @typedef {{ source: string, asOf: string }} SourceStamp
 *
 * The fields every list, card and search result needs.
 * @typedef {{
 *   id: string, first: string, last: string, household: boolean, dob: string,
 *   mci: string, ssn4: string, phone: string, email: string, address: Address,
 *   colabs: string[], starred: string|null, favorited: string
 * }} ClientSummary
 *
 * The full record for the client profile. Never includes the full SSN: that comes from revealSsn.
 * @typedef {ClientSummary & {
 *   full: true, members: string[]|null, dhs: string, dpw: string,
 *   gender: string, legalSex: string, race: string, ethnicity: string, marital: string, living: string, language: string,
 *   sources: { address: SourceStamp, phone: SourceStamp, email: SourceStamp },
 *   services: Service[], instances: ServiceInstance[], enrollments: Enrollment[], justice: Justice|null
 * }} Client
 *
 * @typedef {{ id: string, service: string, area: string, program: string, first: string, last: string, added: string, all: string[], grouped: string[] }} Service
 * @typedef {{ service: string, provider: string, facility: string, program: string, dx: string, units: string, rate: string, rateType: string, cost: string, status: string, first: string, last: string }} ServiceInstance
 * @typedef {{ name: string, kind: 'active'|'ending'|'presumed'|'inactive', status: string, pct: number, start: string, end: string, asOf: string, stale: boolean }} Enrollment
 * @typedef {{ otn: string, date: string, agency: string, filed: string, charge: string, disp: string, next: string, nextDate: string, dv: boolean }} CourtCase
 * @typedef {{ id: string, title: string, kind: 'housing'|'hold'|'prison', range: string, dur: string, facility: string, agency: string, admission: string, release: string }} CustodyEvent
 * @typedef {{
 *   highRisk: string[], jail: { doc: string, docket: string, pod: string, podLevel: string }|null,
 *   involvement: { activeDV: boolean, adult: number, dvFilings: number, convictions: number },
 *   bip: string|null, cases: CourtCase[],
 *   probation: { status: string, unit: string, officer: string, lastIntake: string, lastActive: string }|null,
 *   incarceration: { label: string, items: CustodyEvent[] }[],
 *   custody: { total: string, events: number, facilities: number }
 * }} Justice
 *
 * @typedef {{ id: string, clientId: string, date: string, edited: boolean, restricted: boolean, tag: string, author: string, text: string }} Note
 * @typedef {{ id: string, clientId: string, tag: string, text: string, assignee: string, due: string, done: boolean, edited: boolean }} ActionItem
 * @typedef {{ name: string, address: string, phone: string, email: string, facilities: string[] }} Provider
 */

const str = (v) => (v == null ? '' : String(v));
const arr = (v) => (Array.isArray(v) ? v : []);
const bool = (v) => v === true || v === 'true';
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function normalizeStaff(s) {
  const first = str(s && s.first), last = str(s && s.last);
  return { id: str(s && s.id), first, last, org: str(s && s.org), email: str(s && s.email), initials: str(s && s.initials) || (first[0] || '') + (last[0] || '') };
}
export function normalizeColab(c) {
  return { id: str(c && c.id), name: str(c && (c.name || c.id)), tag: str(c && (c.tag || c.name || c.id)).toUpperCase() };
}
/** @returns {Session} */
export function normalizeSession(s) {
  return { user: normalizeStaff(s && s.user), staff: arr(s && s.staff).map(normalizeStaff), colabs: arr(s && s.colabs).map(normalizeColab), canReset: bool(s && s.canReset) };
}

function normalizeAddress(a) {
  a = a || {};
  return { street: str(a.street), city: str(a.city), state: str(a.state), zip: str(a.zip), school: str(a.school), ward: str(a.ward), facility: a.facility ? str(a.facility) : null };
}
const stamp = (s) => ({ source: str(s && s.source), asOf: str(s && s.asOf) });

/** @returns {ClientSummary} */
export function normalizeClientSummary(c) {
  return {
    id: str(c.id), first: str(c.first), last: str(c.last), household: bool(c.household), dob: str(c.dob),
    mci: str(c.mci), ssn4: str(c.ssn4), phone: str(c.phone), email: str(c.email), address: normalizeAddress(c.address),
    colabs: arr(c.colabs).map(str), starred: c.starred ? str(c.starred) : null, favorited: str(c.favorited)
  };
}

/** @returns {Client} */
export function normalizeClient(c) {
  const j = c.justice;
  return {
    ...normalizeClientSummary(c),
    full: true,
    members: c.members ? arr(c.members).map(str) : null,
    dhs: str(c.dhs), dpw: str(c.dpw), gender: str(c.gender), legalSex: str(c.legalSex), race: str(c.race),
    ethnicity: str(c.ethnicity), marital: str(c.marital), living: str(c.living), language: str(c.language),
    sources: { address: stamp(c.sources && c.sources.address), phone: stamp(c.sources && c.sources.phone), email: stamp(c.sources && c.sources.email) },
    services: arr(c.services).map((s) => ({ id: str(s.id), service: str(s.service), area: str(s.area), program: str(s.program), first: str(s.first), last: str(s.last), added: str(s.added), all: arr(s.all).map(str), grouped: arr(s.grouped).map(str) })),
    instances: arr(c.instances).map((i) => ({ service: str(i.service), provider: str(i.provider), facility: str(i.facility), program: str(i.program), dx: str(i.dx), units: str(i.units), rate: str(i.rate), rateType: str(i.rateType), cost: str(i.cost), status: str(i.status), first: str(i.first), last: str(i.last) })),
    enrollments: arr(c.enrollments).map((e) => ({ name: str(e.name), kind: str(e.kind) || 'active', status: str(e.status), pct: num(e.pct), start: str(e.start), end: str(e.end), asOf: str(e.asOf), stale: bool(e.stale) })),
    justice: j ? {
      highRisk: arr(j.highRisk).map(str),
      jail: j.jail ? { doc: str(j.jail.doc), docket: str(j.jail.docket), pod: str(j.jail.pod), podLevel: str(j.jail.podLevel) } : null,
      involvement: { activeDV: bool(j.involvement && j.involvement.activeDV), adult: num(j.involvement && j.involvement.adult), dvFilings: num(j.involvement && j.involvement.dvFilings), convictions: num(j.involvement && j.involvement.convictions) },
      bip: j.bip ? str(j.bip) : null,
      cases: arr(j.cases).map((x) => ({ otn: str(x.otn), date: str(x.date), agency: str(x.agency), filed: str(x.filed), charge: str(x.charge), disp: str(x.disp), next: str(x.next), nextDate: str(x.nextDate), dv: bool(x.dv) })),
      probation: j.probation ? { status: str(j.probation.status), unit: str(j.probation.unit), officer: str(j.probation.officer), lastIntake: str(j.probation.lastIntake), lastActive: str(j.probation.lastActive) } : null,
      incarceration: arr(j.incarceration).map((g) => ({ label: str(g.label), items: arr(g.items).map((e) => ({ id: str(e.id), title: str(e.title), kind: str(e.kind), range: str(e.range), dur: str(e.dur), facility: str(e.facility), agency: str(e.agency), admission: str(e.admission), release: str(e.release) })) })),
      custody: { total: str(j.custody && j.custody.total), events: num(j.custody && j.custody.events), facilities: num(j.custody && j.custody.facilities) }
    } : null
  };
}

/** @returns {Note} */
export function normalizeNote(n) {
  return { id: str(n.id), clientId: str(n.clientId), date: str(n.date), edited: bool(n.edited), restricted: bool(n.restricted), tag: str(n.tag) || 'PERSONAL', author: str(n.author), text: str(n.text) };
}
/** @returns {ActionItem} */
export function normalizeAction(a) {
  return { id: str(a.id), clientId: str(a.clientId), tag: str(a.tag) || 'PERSONAL', text: str(a.text), assignee: str(a.assignee), due: str(a.due), done: bool(a.done), edited: bool(a.edited) };
}
/** @returns {Provider} */
export function normalizeProvider(p) {
  return { name: str(p && p.name), address: str(p && p.address), phone: str(p && p.phone), email: str(p && p.email), facilities: arr(p && p.facilities).map(str) };
}
