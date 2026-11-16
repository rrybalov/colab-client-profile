// ASC server logic: contacts (calls and in-person visits), identifying and enrolling the client, the automatic
// follow-ups, and contact history. Like backend.js, these run in the browser's sample-data source and in
// tools/mock-api.mjs. docs/API.md describes the endpoints.
import { NotFound, BadRequest, Forbidden, summary, fullRecord, newId, createNote } from './backend.js';
import { followUpPlan, SCREENING, totals, plural, summaryNote, isSummaryNote, LEGACY, OPEN, CRISIS, SUPERVISOR, addBusinessDays, dayOf, shown } from './asc.js';
import { describePatch, appendLog, backfillLog } from './asc-log.js';
import { ASC_ENROLLMENT } from './asc-seed.js';

const pad = (n) => String(n).padStart(2, '0');
const usOf = (d) => pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear();
const findContact = (db, id) => { const k = (db.contacts || []).find((x) => x.id === id); if (!k) throw new NotFound('Contact'); return k; };
const findClient = (db, id) => { const c = db.clients.find((x) => x.id === id); if (!c) throw new NotFound('Client'); return c; };
const clone = (v) => JSON.parse(JSON.stringify(v));
const ensure = (db) => { if (!db.contacts) db.contacts = []; if (!db.contactSeq) db.contactSeq = 184; if (db.ascModel !== 3) migrate(db); };

// v4.1 renamed outcomes, merged screening's "Not sure" and "Prefers not to say" into "Skip", shortened the safety
// answer and added roles. Stored data is upgraded once, in place.
const ROLES = { u1: 'ASC Coordinator', u2: 'ASC Coordinator', u6: 'ASC Coordinator', u4: SUPERVISOR };
export const ascReady = (db) => ensure(db);
function migrate(db) {
  (db.contacts || []).forEach((k) => {
    k.needs.forEach((n) => { if (LEGACY.outcome[n.outcome]) n.outcome = LEGACY.outcome[n.outcome]; });
    if (k.intake && k.intake.safety in LEGACY.safety) k.intake.safety = LEGACY.safety[k.intake.safety];
    Object.keys(k.screening || {}).forEach((q) => { if (LEGACY.screening[k.screening[q]]) k.screening[q] = LEGACY.screening[k.screening[q]]; });
    if (!k.corrections) k.corrections = [];
    if (k.correction === undefined) k.correction = null;
    backfillLog(k); // v4.2: a step-by-step log, built from the answers for contacts saved before it existed
  });
  (db.staff || []).forEach((s) => { if (!s.role && ROLES[s.id]) s.role = ROLES[s.id]; });
  (db.clients || []).forEach((c) => syncAscService(db, c));
  db.ascModel = 3;
}
const me = (db) => (db.staff || []).find((s) => s.id === db.userId) || {};
const isSupervisor = (db) => me(db).role === SUPERVISOR;
const staffLabel = (db, id) => { const s = (db.staff || []).find((x) => x.id === id); return s ? s.first + ' ' + s.last : 'ASC'; };
const clientName = (c) => (c ? c.first + ' ' + c.last : '');

function contactSummary(db, k) {
  const c = k.clientId ? db.clients.find((x) => x.id === k.clientId) : null;
  const t = totals(k.interactions);
  return {
    id: k.id, ref: k.ref, channel: k.channel, site: k.site, startedAt: k.startedAt, endedAt: k.endedAt, status: k.status, closedKind: k.closedKind,
    staff: k.staff, clientId: k.clientId, identity: k.identity, path: k.path, clientName: clientName(c) || (k.identity === 'unverified' ? k.unverifiedName : ''),
    anonName: k.anon.name, needs: k.needs.map((n) => ({ name: n.name, urg: n.urg, outcome: n.outcome })), ixCount: t.count, ixMin: t.min, ixUnits: t.units
  };
}

// Anonymous contacts that may belong to this contact's client: ones flagged as a likely match or tied by a
// reference number the caller gave, and not already on someone's record.
function possibleLinks(db, k) {
  if (!k.clientId) return [];
  return db.contacts.filter((x) => x.id !== k.id && !x.clientId && (x.possibleClientId === k.clientId || (k.group && x.group === k.group)) && k.linkedPrior !== 'no');
}

function full(db, k) {
  const out = clone(k);
  out.client = k.clientId ? summary(findClient(db, k.clientId)) : null;
  out.candidate = k.candidateId && !k.clientId ? summary(findClient(db, k.candidateId)) : null;
  out.possibleLinks = possibleLinks(db, k).map((x) => contactSummary(db, x));
  return out;
}

export function listContacts(db, q = {}) {
  ensure(db);
  return db.contacts
    .filter((k) => (!q.status || k.status === q.status) && (!q.clientId || k.clientId === q.clientId))
    .map((k) => contactSummary(db, k))
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export const getContact = (db, id) => { ensure(db); return full(db, findContact(db, id)); };

export function createContact(db, body = {}) {
  ensure(db);
  const n = db.contactSeq++;
  const channel = body.channel === 'person' ? 'person' : 'phone';
  const k = {
    id: newId('k'), ref: 'EV-26-' + String(n).padStart(6, '0'), channel,
    logId: (channel === 'person' ? 'VS-0912-' : 'CL-4417-') + String(4000 + n), site: channel === 'person' ? (body.site || 'Mercy Behavioral Health') : '',
    startedAt: new Date().toISOString(), endedAt: null, status: 'open', closedKind: null, staff: db.userId,
    clientId: null, identity: null, candidateId: null, possibleClientId: null, path: null, group: '', priorRefs: [], linkedPrior: null,
    anon: { name: '', zip: '', county: 'Allegheny', language: 'English' }, unverifiedName: '',
    intake: { safety: null, caller: null, callerOther: '', callerName: '', age: null, story: '', reason: null, reasonText: '', coverage: null, coverageDetail: '', found: null, foundOther: '', privacy: null, callerConfirmed: null, coverageConfirmed: null },
    screening: { mh: null, ph: null, house: null, food: null, su: null },
    needs: [], interactions: [], followUp: { ok: null, how: 'Phone call', time: '' }, onsite: { idCheck: null, consentSigned: '', docs: [] },
    notes: [], actions: [], links: [], urgent: null, correction: null, corrections: [], log: [], reminderId: null, createdAt: new Date().toISOString()
  };
  appendLog(k, [{ key: 'start', text: channel === 'person' ? 'Started an in-person visit at ' + k.site : 'Started a phone call' }], db.userId);
  if (body.clientId) {
    const c = findClient(db, body.clientId);
    if (c.colabs.indexOf('ASC') < 0) throw new BadRequest('This client is not enrolled in ASC.');
    Object.assign(k, { clientId: c.id, identity: 'matched', path: 'client' });
    appendLog(k, [{ key: 'identity', text: 'Started from ' + c.first + ' ' + c.last + '’s record' }], db.userId);
  }
  db.contacts.unshift(k);
  return full(db, k);
}

// Creates, updates or removes the two automatic follow-ups so they match the contact's follow-up answer.
// Returns the client action items it changed.
function syncFollowUps(db, k) {
  const changed = [], removed = [];
  const autos = k.links.filter((l) => l.auto);
  const wanted = k.clientId && k.followUp.ok === 'Yes';
  if (!wanted) {
    autos.forEach((l) => {
      const i = db.actions.findIndex((a) => a.id === l.actionId);
      if (i >= 0 && !db.actions[i].done) { db.actions.splice(i, 1); removed.push(l.actionId); }
    });
    k.links = k.links.filter((l) => !l.auto || !removed.includes(l.actionId));
    return { changed, removed };
  }
  const c = findClient(db, k.clientId);
  const guardian = c.guardian && k.intake.caller === 'Parent or guardian' ? c.guardian.name.split(' ')[0] : c.first;
  followUpPlan(k, guardian).forEach((p) => {
    const link = autos.find((l) => l.auto === p.key);
    const existing = link && db.actions.find((a) => a.id === link.actionId);
    if (existing) {
      if (!existing.done && (existing.text !== p.text)) { existing.text = p.text; changed.push(existing); }
      return;
    }
    const a = { id: newId('a'), clientId: c.id, tag: 'ASC', text: p.text, assignee: k.staff, due: p.due, done: false, edited: false };
    db.actions.unshift(a); changed.push(a);
    k.links.push({ actionId: a.id, ixId: null, auto: p.key });
  });
  return { changed, removed };
}

const SECTIONS = ['intake', 'screening', 'followUp', 'onsite', 'anon'];
const LISTS = ['needs', 'interactions', 'notes', 'actions'];

// What can still change once a contact is closed: case notes and action items (and their links).
const AFTER_CLOSE = ['notes', 'actions', 'addLinks', 'removeLinks'];
// What a supervisor can correct on a closed contact. Who the contact is (identity, links) stays as closed.
const CORRECTABLE = ['intake', 'screening', 'needs', 'interactions', 'followUp', 'onsite', 'anon', 'site', 'channel', 'dropIxLinks'];
const text = (v, max) => String(v == null ? '' : v).slice(0, max);
const cleanSection = (v) => {
  const out = {};
  Object.keys(v).slice(0, 60).forEach((key) => { const x = v[key]; out[key] = Array.isArray(x) ? x.slice(0, 40).map((y) => text(y, 200)) : typeof x === 'boolean' || x === null ? x : typeof x === 'number' ? x : text(x, 4000); });
  return out;
};
const cleanNeed = (n) => ({ id: text(n.id, 40), name: text(n.name, 120), urg: text(n.urg, 40), outcome: text(n.outcome, 120), outcomeNote: text(n.outcomeNote, 2000) });
// Minutes stay as typed, but no single interaction is recorded as longer than 10 hours.
const cleanMin = (v) => { const t = text(v, 6).trim(); const m = Number(t); return t && m > 600 ? '600' : t; };
const cleanIx = (x) => ({ id: text(x.id, 40), what: text(x.what, 300), need: text(x.need, 40), type: text(x.type, 120), how: text(x.how, 60), min: cleanMin(x.min), place: text(x.place, 120), notes: text(x.notes, 4000) });

export function updateContact(db, id, patch = {}) {
  ensure(db);
  const k = findContact(db, id);
  if (k.status === 'closed') {
    const allowed = k.correction ? AFTER_CLOSE.concat(CORRECTABLE) : AFTER_CLOSE;
    const blocked = Object.keys(patch).filter((key) => allowed.indexOf(key) < 0);
    if (blocked.length) throw new BadRequest(k.correction ? 'Who the contact is can’t change in a correction.' : 'This contact is closed. Only case notes and action items can be added.');
    if (k.correction) Object.keys(patch).filter((key) => CORRECTABLE.indexOf(key) >= 0 && k.correction.changed.indexOf(key) < 0).forEach((key) => k.correction.changed.push(key));
  }
  const lines = describePatch(k, patch);
  SECTIONS.forEach((s) => { if (patch[s] && typeof patch[s] === 'object' && !Array.isArray(patch[s])) k[s] = { ...k[s], ...cleanSection(patch[s]) }; });
  LISTS.forEach((s) => {
    if (!Array.isArray(patch[s])) return;
    const list = patch[s].filter((x) => x && typeof x === 'object').slice(0, 100);
    k[s] = s === 'needs' ? list.map(cleanNeed) : s === 'interactions' ? list.map(cleanIx) : list;
  });
  // Links are added and removed one at a time, so two screens saving at once can't drop each other's.
  if (Array.isArray(patch.addLinks)) patch.addLinks.forEach((l) => { if (l && l.actionId && !k.links.some((x) => x.actionId === l.actionId)) k.links.push({ actionId: String(l.actionId), ixId: l.ixId ? String(l.ixId) : null, auto: null }); });
  if (Array.isArray(patch.removeLinks)) k.links = k.links.filter((l) => patch.removeLinks.indexOf(l.actionId) < 0 || l.auto);
  if (patch.dropIxLinks) k.links = k.links.filter((l) => l.ixId !== patch.dropIxLinks);
  if ('channel' in patch) k.channel = patch.channel === 'person' ? 'person' : 'phone';
  if ('site' in patch) k.site = String(patch.site || '');
  if ('path' in patch) k.path = patch.path === 'anon' || patch.path === 'client' ? patch.path : null;
  if ('candidateId' in patch) {
    const cand = patch.candidateId ? findClient(db, patch.candidateId) : null;
    if ((patch.candidateId || null) !== k.candidateId) lines.push({ key: 'candidate', text: cand ? 'Selected ' + cand.first + ' ' + cand.last + ' from MCI' : 'Cleared the MCI match' });
    k.candidateId = patch.candidateId || null;
  }
  if ('unverifiedName' in patch) k.unverifiedName = String(patch.unverifiedName || '');
  if ('identity' in patch) {
    if (patch.identity !== 'unverified' && patch.identity !== null) throw new BadRequest('Link a client to set a matched identity.');
    if (k.clientId) throw new BadRequest('This contact is already on a client record.');
    k.identity = patch.identity;
    k.path = patch.identity === 'unverified' ? 'client' : k.path;
  }
  // The caller gave a reference number from an earlier contact.
  if ('priorRef' in patch) {
    const found = findByRef(db, patch.priorRef);
    if (!found) throw new BadRequest('No contact has the reference number ' + patch.priorRef + '.');
    k.group = found.group || found.id;
    if (!found.group) found.group = k.group;
    k.priorRefs = db.contacts.filter((x) => x.id !== k.id && x.group === k.group).map((x) => x.ref);
    if (found.clientId && !k.clientId) k.candidateId = found.clientId;
  }
  const moved = { notes: [], actions: [] };
  if ('linkedPrior' in patch) {
    if (patch.linkedPrior === 'linked') possibleLinks(db, k).forEach((x) => { x.clientId = k.clientId; x.identity = 'matched'; const m = moveToClient(db, x); moved.notes.push(...m.notes); moved.actions.push(...m.actions); });
    k.linkedPrior = patch.linkedPrior === 'linked' || patch.linkedPrior === 'no' ? patch.linkedPrior : null;
  }
  // Notes and action items belong to the client record once there is one.
  if (k.clientId && (k.notes.length || k.actions.length)) { const m = moveToClient(db, k); moved.notes.push(...m.notes); moved.actions.push(...m.actions); }
  const sync = syncFollowUps(db, k);
  appendLog(k, lines, db.userId, { correction: !!k.correction });
  return { contact: full(db, k), notes: moved.notes, actions: moved.actions.concat(sync.changed).map(clone), removeActions: sync.removed };
}

function findByRef(db, text) {
  const d = String(text || '').replace(/\D/g, '');
  if (!d) return null;
  return db.contacts.find((x) => x.ref.replace(/\D/g, '').endsWith(d.padStart(6, '0')) || x.ref.replace(/\D/g, '') === d) || null;
}

// The reference-number lookup for a returning caller, before anything is attached to the contact.
export function lookupContact(db, ref) {
  ensure(db);
  const found = findByRef(db, ref);
  if (!found) throw new NotFound('Contact ' + ref);
  return contactSummary(db, found);
}

function moveToClient(db, k) {
  const moved = { notes: [], actions: [] };
  k.notes.forEach((n) => {
    const note = { id: n.id, clientId: k.clientId, date: n.date, edited: !!n.edited, restricted: !!n.restricted, tag: 'ASC', author: n.author || k.staff, text: n.text };
    db.notes.unshift(note); moved.notes.push(note);
  });
  k.actions.forEach((a) => {
    const act = { id: a.id, clientId: k.clientId, tag: 'ASC', text: a.text, assignee: a.assignee || k.staff, due: a.due || '', done: !!a.done, edited: !!a.edited };
    db.actions.unshift(act); moved.actions.push(act);
  });
  k.notes = []; k.actions = [];
  return moved;
}

const MCI = (db) => 'R' + String(1100000000 + db.clients.length * 7919 + db.contactSeq).slice(-10);

// Puts the contact on a client's record: an existing client (`clientId`) or one registered now (`newClient`).
// Enrolls the client in ASC, moves the contact's notes and action items over, and schedules follow-ups.
export function linkContact(db, id, body = {}) {
  ensure(db);
  const k = findContact(db, id);
  if (k.clientId) throw new BadRequest('This contact is already on a client record.');
  let c;
  let identity = 'matched';
  if (body.clientId) c = findClient(db, body.clientId);
  else if (body.newClient) {
    const f = body.newClient;
    if (!String(f.first || '').trim() || !String(f.last || '').trim() || !f.dob || !f.gender) throw new BadRequest('First name, last name, date of birth and gender are required.');
    const num = db.clients.length + 1;
    let cid = 'c' + num; while (db.clients.some((x) => x.id === cid)) cid += 'x';
    c = {
      id: cid, first: f.first.trim(), last: f.last.trim(), household: false, members: null, dob: f.dob, gender: f.gender, legalSex: f.gender,
      race: f.race || '', ethnicity: f.ethnicity || '', marital: '', living: f.living || '', language: f.language || 'English',
      mci: MCI(db), ssn4: String(f.ssn || '').replace(/\D/g, '').slice(-4), ssnFull: '', dhs: '', dpw: '', phone: f.phone || '', email: '',
      address: { street: f.street || '', city: f.city || '', state: f.state || 'PA', zip: f.zip || '', school: '', ward: '', facility: null },
      colabs: [], starred: null, favorited: '', guardian: null, coverage: null, enrollments: [], services: [], instances: [], justice: null,
      sources: { address: { source: 'ASC', asOf: usOf(new Date()) }, phone: { source: 'ASC', asOf: usOf(new Date()) }, email: { source: '', asOf: '' } },
      addresses: f.street ? [{ id: 'addr0', street: f.street, city: f.city || '', township: '', county: f.county || 'Allegheny', zip: f.zip || '', schoolDistrict: '', addressType: 'Permanent', residential: true, kind: 'home', useDescription: 'Residence', start: new Date().toISOString().slice(0, 10), effDate: '', end: null, sources: ['Self'], specificSources: [{ bucket: 'Self', name: 'ASC intake', code: 'ASC' }], reports: [{ agency: 'ASC', date: usOf(new Date()), method: 'Phone', county: f.county || 'Allegheny' }], certainty: 'medium', conflict: '', email: '', phone: null, altPhones: [], providerLocation: '', facilityId: '' }] : []
    };
    db.clients.push(c);
    identity = 'new';
  } else throw new BadRequest('Choose a client or register a new one.');

  const today = usOf(new Date());
  if (c.colabs.indexOf('ASC') < 0) c.colabs.push('ASC');
  if (!(c.enrollments || []).some((e) => e.name === ASC_ENROLLMENT && e.kind === 'active')) {
    c.enrollments = (c.enrollments || []).concat([{ name: ASC_ENROLLMENT, kind: 'active', status: 'Active', pct: 0, start: today, end: 'Ongoing', asOf: 'As of ' + today + ' | Today', stale: false }]);
  }
  Object.assign(k, { clientId: c.id, identity, path: 'client', candidateId: null, unverifiedName: '' });
  // Earlier calls tied by the caller's reference number are theirs by definition.
  const earlier = { notes: [], actions: [] };
  if (k.group) db.contacts.forEach((x) => {
    if (x.id === k.id || x.group !== k.group || x.clientId) return;
    x.clientId = c.id; x.identity = 'matched';
    const m = moveToClient(db, x); earlier.notes.push(...m.notes); earlier.actions.push(...m.actions);
  });
  if (k.group) k.linkedPrior = 'linked';
  const moved = moveToClient(db, k);
  const sync = syncFollowUps(db, k);
  syncAscService(db, c);
  appendLog(k, [{ key: 'identity', text: (identity === 'new' ? 'Registered ' + c.first + ' ' + c.last + ' in MCI' : 'Matched ' + c.first + ' ' + c.last + ' in MCI') + ' and enrolled in ASC' }].concat(earlier.notes.length || earlier.actions.length || k.group ? [{ key: 'linkedPrior', text: 'Earlier contacts moved to their record' }] : []), db.userId);
  return { contact: full(db, k), client: fullRecord(c), notes: moved.notes.concat(earlier.notes), actions: moved.actions.concat(earlier.actions, sync.changed).map(clone), removeActions: sync.removed };
}

// ASC shows on the client's Services tab: one service row, with one instance per contact (its units and site).
const ASC_SERVICE = 'Administrative Service Coordination';
const ASC_PROVIDER = 'DHS ASC';
export function syncAscService(db, c) {
  if (!c || c.colabs.indexOf('ASC') < 0) return;
  const mine = db.contacts.filter((x) => x.clientId === c.id).sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1));
  const enroll = (c.enrollments || []).find((e) => e.name === ASC_ENROLLMENT);
  const first = enroll ? enroll.start : mine.length ? usOf(new Date(mine[0].startedAt)) : usOf(new Date());
  const last = mine.length ? usOf(new Date(mine[mine.length - 1].startedAt)) : first;
  c.services = (c.services || []).filter((s) => s.id !== 'asc');
  c.services.unshift({ id: 'asc', service: ASC_SERVICE, area: 'Service Coordination', program: 'Service Coordination', first, last, added: first, all: [ASC_PROVIDER], grouped: [ASC_PROVIDER] });
  c.instances = (c.instances || []).filter((i) => i.service !== ASC_SERVICE).concat(mine.map((x) => {
    const t = totals(x.interactions);
    return { service: ASC_SERVICE, provider: ASC_PROVIDER, facility: x.channel === 'person' ? x.site || 'ASC site' : 'ASC call center', program: 'Service Coordination', dx: '—', units: String(t.units), rate: 'TBD', rateType: 'Per 15 min', cost: 'TBD', status: x.status === 'open' ? 'Active' : 'Pending', first: usOf(new Date(x.startedAt)), last: usOf(new Date(x.endedAt || x.startedAt)) };
  }));
}

export function closeContact(db, id, body = {}) {
  ensure(db);
  const k = findContact(db, id);
  if (k.status === 'closed') throw new BadRequest('This contact is already closed.');
  if (body.urgent) {
    const u = body.urgent;
    k.urgent = { dest: String(u.dest || ''), how: String(u.how || ''), need: String(u.need || ''), note: String(u.note || ''), at: new Date().toISOString() };
    k.needs = k.needs.map((n) => ({ ...n, outcome: n.name === u.need ? CRISIS : (n.outcome || OPEN) }));
    k.closedKind = 'urgent';
  } else {
    if (!k.needs.length) throw new BadRequest('Add at least one need before closing.');
    const open = k.needs.filter((n) => !n.outcome);
    if (open.length) throw new BadRequest('Give each need an outcome before closing: ' + open.map((n) => n.name).join(', ') + '.');
    k.closedKind = k.clientId ? 'client' : 'anon';
  }
  k.status = 'closed';
  k.endedAt = new Date().toISOString();
  appendLog(k, [{ key: 'close', text: k.closedKind === 'urgent' ? 'Closed as a transfer to ' + shown(k.urgent.dest) + ' (' + k.urgent.how.split(':')[0].toLowerCase() + ')' : 'Closed the contact' }], db.userId);
  // The automatic summary: a case note on the client's record, or on the contact while the person is anonymous.
  const notes = [addNote(db, k, summaryNote(k, staffLabel(db, k.staff)), k.staff)].filter(Boolean);
  k.summarized = true; // contacts closed before v4.0.2 have no summary note
  const reminder = remindOpenItems(db, k);
  if (k.clientId) syncAscService(db, findClient(db, k.clientId));
  return { contact: full(db, k), notes, actions: reminder ? [clone(reminder)] : [] };
}

// Action items still open from this conversation: ones added during it (or tied to its interactions), not the
// automatic 7-day and 90-day follow-ups. Anonymous contacts keep theirs on the contact.
export function openItemsFrom(db, k) {
  if (!k.clientId) return k.actions.filter((a) => !a.done && a.id !== k.reminderId);
  const autos = k.links.filter((l) => l.auto).map((l) => l.actionId);
  const linked = k.links.filter((l) => !l.auto).map((l) => l.actionId);
  // Reminders from any contact are about other items, never items of their own.
  const reminders = new Set(db.contacts.map((x) => x.reminderId).filter(Boolean));
  return db.actions.filter((a) => a.clientId === k.clientId && !a.done && !reminders.has(a.id) && autos.indexOf(a.id) < 0 &&
    (linked.indexOf(a.id) >= 0 || (a.tag === 'ASC' && a.createdAt && a.createdAt >= k.startedAt)));
}

// When a conversation ends with open action items, the coordinator gets a reminder to check on them in three
// business days. One per contact.
function remindOpenItems(db, k) {
  if (k.reminderId) return null;
  const open = openItemsFrom(db, k);
  if (!open.length) return null;
  const c = k.clientId ? findClient(db, k.clientId) : null;
  const a = { id: newId('a'), tag: 'ASC', text: 'Check on ' + plural(open.length, 'open action item', 'open action items') + ' from ' + k.ref + (c ? ' with ' + c.first : ''), assignee: k.staff, due: addBusinessDays(dayOf(k.endedAt), 3), done: false, edited: false, createdAt: new Date().toISOString() };
  if (c) { a.clientId = c.id; db.actions.unshift(a); } else k.actions.unshift(a);
  k.reminderId = a.id;
  appendLog(k, [{ key: 'reminder', text: 'Reminder set for ' + addBusinessDays(dayOf(k.endedAt), 3).replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1') + ': ' + a.text }], k.staff);
  return c ? a : null;
}

// A case note from the system: on the client's record, or on the contact while the person is anonymous.
function addNote(db, k, text, author) {
  if (k.clientId) return createNote(db, k.clientId, { tag: 'ASC', author, text });
  k.notes.unshift({ id: newId('kn'), text, restricted: false, date: usOf(new Date()), author, edited: false });
  return null;
}

// Supervisors correct closed contacts. Opening a correction needs a reason; every change is saved as it's made,
// and finishing records who changed what and why, as a case note and on the contact.
export function startCorrection(db, id, body = {}) {
  ensure(db);
  const k = findContact(db, id);
  if (!isSupervisor(db)) throw new Forbidden('Only an ASC supervisor can edit a closed contact.');
  if (k.status !== 'closed') throw new BadRequest('This contact is still open. Edit it directly.');
  if (k.correction) throw new BadRequest('This contact is already being corrected by ' + staffLabel(db, k.correction.by) + '.');
  const reason = String(body.reason || '').trim().slice(0, 1000);
  if (!reason) throw new BadRequest('Give a reason for the correction.');
  k.correction = { by: db.userId, at: new Date().toISOString(), reason, changed: [] };
  appendLog(k, [{ key: 'correction.start', text: 'Correction started: “' + reason + '”' }], db.userId, { correction: true });
  return { contact: full(db, k), notes: [] };
}

const FIELD_NAMES = { intake: 'intake', screening: 'screening', needs: 'needs and outcomes', interactions: 'interactions', followUp: 'follow-up', onsite: 'on-site steps', anon: 'anonymous details', site: 'site', channel: 'contact type', dropIxLinks: 'interactions' };
export function finishCorrection(db, id) {
  ensure(db);
  const k = findContact(db, id);
  if (!k.correction) throw new BadRequest('This contact isn’t being corrected.');
  if (!isSupervisor(db)) throw new Forbidden('Only an ASC supervisor can edit a closed contact.');
  if (!k.needs.length) throw new BadRequest('Add at least one need before saving.');
  const open = k.needs.filter((n) => !n.outcome);
  if (open.length) throw new BadRequest('Give each need an outcome before saving: ' + open.map((n) => n.name).join(', ') + '.');
  const c = k.correction;
  const changed = [...new Set(c.changed.map((f) => FIELD_NAMES[f] || f))];
  const entry = { by: c.by, at: new Date().toISOString(), reason: c.reason, changed };
  k.corrections.push(entry);
  k.correction = null;
  appendLog(k, [{ key: 'correction.end', text: 'Correction saved' + (changed.length ? ': ' + changed.join(', ') : '') }], entry.by, { correction: true });
  const text = 'ASC correction to ' + k.ref + ', ' + usOf(new Date(entry.at)) + ', ' + staffLabel(db, entry.by) + '.\nReason: ' + entry.reason + '\nChanged: ' + (changed.length ? changed.join(', ') : 'nothing') + '.\n\n' + summaryNote(k, staffLabel(db, k.staff));
  const notes = [addNote(db, k, text, entry.by)].filter(Boolean);
  return { contact: full(db, k), notes };
}

// Prototype only: switch between a coordinator and a supervisor to try both roles.
export const DEMO_USERS = ['u1', 'u4'];
export function switchUser(db, body = {}) {
  ensure(db);
  if (DEMO_USERS.indexOf(body.userId) < 0) throw new BadRequest('Unknown user.');
  db.userId = body.userId;
  return { ok: true };
}

// Everything a coordinator needs when a person comes back: what is still open, then each past contact.
export function contactHistory(db, q = {}) {
  ensure(db);
  let related = [];
  let current = null;
  if (q.contactId) current = findContact(db, q.contactId);
  const clientId = q.clientId || (current && current.clientId);
  const group = current && current.group;
  related = db.contacts.filter((x) => (!current || x.id !== current.id) && (
    (clientId && (x.clientId === clientId || x.possibleClientId === clientId)) || (group && x.group === group)
  ));
  related.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  const staffName = (sid) => { const s = db.staff.find((x) => x.id === sid); return s ? s.first + ' ' + s.last : sid; };
  const open = [];
  const seenNeeds = new Set();
  // Each open item says where it came from, so a screen can act on it: add the need to this contact, mark an
  // action item done, or open the contact it came from.
  const due = (a) => (a.due ? a.due.slice(5, 7) + '/' + a.due.slice(8, 10) + '/' + a.due.slice(0, 4) : 'no date');
  related.forEach((x) => x.needs.forEach((n) => {
    if (seenNeeds.has(n.name)) return;
    seenNeeds.add(n.name);
    if (n.outcome === OPEN) open.push({ kind: 'Open need', text: n.name, need: n.name, urg: n.urg, contactId: x.id, ref: x.ref, meta: n.urg + ' · open since ' + usOf(new Date(x.startedAt)) + ' · ' + staffName(x.staff) + ' · ' + x.ref });
  }));
  related.forEach((x) => x.actions.filter((a) => !a.done).forEach((a) => open.push({ kind: 'Action item', text: a.text, contactId: x.id, ref: x.ref, actionId: a.id, meta: staffName(a.assignee) + ' · due ' + due(a) + ' · from ' + x.ref })));
  if (clientId) db.actions.filter((a) => a.clientId === clientId && a.tag === 'ASC' && !a.done).forEach((a) => open.push({ kind: 'Action item', text: a.text, actionId: a.id, clientId, meta: staffName(a.assignee) + ' · due ' + due(a) }));
  return {
    openItems: open,
    contacts: related.map((x) => ({
      ...contactSummary(db, x), staffName: staffName(x.staff), possible: !x.clientId && !!clientId,
      interactions: x.interactions, notes: ((own) => own.concat(x.intake.story && !own.length ? [x.intake.story] : []))(x.notes.map((n) => n.text).filter((t) => !isSummaryNote(t))),
      screening: SCREENING.filter((s) => x.screening[s.key]).map((s) => s.label + ': ' + x.screening[s.key]),
      minutes: x.endedAt ? Math.round((new Date(x.endedAt) - new Date(x.startedAt)) / 60000) : 0,
      // The full record, for the opt-in view of everything the coordinator filled in, and the step-by-step log.
      record: { id: x.id, ref: x.ref, channel: x.channel, site: x.site, startedAt: x.startedAt, endedAt: x.endedAt, status: x.status, closedKind: x.closedKind, staff: x.staff, identity: x.identity, unverifiedName: x.unverifiedName, path: x.path, anon: x.anon, intake: x.intake, screening: x.screening, needs: x.needs, interactions: x.interactions, followUp: x.followUp, onsite: x.onsite, urgent: x.urgent, corrections: x.corrections, log: x.log, clientId: x.clientId },
      totalsText: plural(x.interactions.length, 'interaction', 'interactions')
    }))
  };
}
