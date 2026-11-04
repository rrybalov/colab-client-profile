// What a CoLab server does, written as plain functions over one data object.
// The browser's local data source and tools/mock-api.mjs both run these, so the app behaves the same with
// sample data in the browser and over HTTP. A real backend replaces this file; docs/API.md is its contract.
// Functions that change data change `db` in place and return the changed record.

const SEARCH_LIMIT = 15;
const digits = (s) => String(s || '').replace(/\D/g, '');
const lc = (s) => String(s || '').trim().toLowerCase();
const pad = (n) => String(n).padStart(2, '0');
const todayUS = () => { const d = new Date(); return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear(); };
const displayName = (c) => (c.household ? c.first + ' ' + c.last : c.last + ', ' + c.first);
let seq = 0;
const newId = (prefix) => prefix + Date.now().toString(36) + (seq++).toString(36);

export class NotFound extends Error { constructor(what) { super(what + ' not found'); this.status = 404; } }
export class BadRequest extends Error { constructor(msg) { super(msg); this.status = 400; } }

const client = (db, id) => { const c = db.clients.find((x) => x.id === id); if (!c) throw new NotFound('Client'); return c; };

export function summary(c) {
  return { id: c.id, first: c.first, last: c.last, household: c.household, dob: c.dob, mci: c.mci, ssn4: c.ssn4, phone: c.phone, email: c.email, address: c.address, colabs: c.colabs, starred: c.starred, favorited: c.favorited };
}
// Everything except the full SSN, which is only released by revealSsn.
export function fullRecord(c) {
  const { ssnFull, ...rest } = c; // eslint-disable-line no-unused-vars
  return rest;
}
const summariesFor = (db, items) => {
  const ids = new Set(items.map((x) => x.clientId));
  return db.clients.filter((c) => ids.has(c.id)).map(summary);
};

export const session = (db) => ({
  user: db.staff.find((s) => s.id === db.userId), staff: db.staff, colabs: db.colabs, canReset: !!db.canReset
});

export const starredClients = (db) => db.clients.filter((c) => c.starred).map(summary);

export function setStar(db, id, body) {
  const c = client(db, id);
  if (body && body.starred) { c.starred = String(body.starred); c.favorited = body.favorited || todayUS(); }
  else { c.starred = null; }
  return summary(c);
}

export function searchClients(db, q) {
  const first = lc(q.first), last = lc(q.last), email = lc(q.email), mci = lc(q.mci);
  const phone = digits(q.phone), dhs = digits(q.dhs), ssn = digits(q.ssn).slice(-4);
  if (!(first || last || email || mci || phone || dhs || ssn)) throw new BadRequest('Enter at least one field to search.');
  const hits = db.clients.filter((c) => {
    if (first && !lc(c.first).includes(first) && !lc((c.members || []).join(' ')).includes(first)) return false;
    if (last && !lc(c.last).includes(last) && !(c.household && lc(c.first).includes(last))) return false;
    if (phone && !digits(c.phone).includes(phone)) return false;
    if (email && !lc(c.email).includes(email)) return false;
    if (mci && !lc(c.mci).includes(mci)) return false;
    if (dhs && !String(c.dhs).includes(dhs)) return false;
    if (ssn && c.ssn4 !== ssn) return false;
    return true;
  }).sort((a, b) => displayName(a).localeCompare(displayName(b)));
  // Like a real search service: past the limit, report how many matched but send none of them.
  return { total: hits.length, results: hits.length > SEARCH_LIMIT ? [] : hits.map(summary) };
}

export const getClient = (db, id) => fullRecord(client(db, id));
export const revealSsn = (db, id) => ({ ssn: client(db, id).ssnFull || '' });

export const clientNotes = (db, id) => { client(db, id); return db.notes.filter((n) => n.clientId === id); };
export const clientActions = (db, id) => { client(db, id); return db.actions.filter((a) => a.clientId === id); };

export function myNotes(db) {
  const notes = db.notes.filter((n) => n.author === db.userId);
  return { notes, clients: summariesFor(db, notes) };
}
export function myActions(db) {
  const actionItems = db.actions.filter((a) => a.assignee === db.userId);
  return { actionItems, clients: summariesFor(db, actionItems) };
}

const text = (v) => { const t = String(v || '').trim(); if (!t) throw new BadRequest('Text is required.'); return t; };

export function createNote(db, clientId, body) {
  client(db, clientId);
  const note = {
    id: body.id || newId('n'), clientId, date: body.date || todayUS(), edited: !!body.edited, restricted: !!body.restricted,
    tag: body.tag || 'PERSONAL', author: body.author || db.userId, text: text(body.text)
  };
  db.notes.unshift(note);
  return note;
}
export function updateNote(db, id, patch) {
  const n = db.notes.find((x) => x.id === id); if (!n) throw new NotFound('Note');
  if ('text' in patch) n.text = text(patch.text);
  if ('restricted' in patch) n.restricted = !!patch.restricted;
  n.edited = 'edited' in patch ? !!patch.edited : true;
  return n;
}
export function deleteNote(db, id) {
  const i = db.notes.findIndex((x) => x.id === id); if (i < 0) throw new NotFound('Note');
  return db.notes.splice(i, 1)[0];
}

export function createAction(db, clientId, body) {
  client(db, clientId);
  const a = {
    id: body.id || newId('a'), clientId, tag: body.tag || 'PERSONAL', text: text(body.text),
    assignee: body.assignee || db.userId, due: body.due || '', done: !!body.done, edited: !!body.edited
  };
  db.actions.unshift(a);
  return a;
}
// Toggling done is not an edit; changing the text, assignee or due date is.
export function updateAction(db, id, patch) {
  const a = db.actions.find((x) => x.id === id); if (!a) throw new NotFound('Action item');
  let edited = false;
  if ('text' in patch) { a.text = text(patch.text); edited = true; }
  if ('assignee' in patch) { a.assignee = patch.assignee || db.userId; edited = true; }
  if ('due' in patch) { a.due = patch.due || ''; edited = true; }
  if ('done' in patch) a.done = !!patch.done;
  if (edited) a.edited = true;
  return a;
}
export function deleteAction(db, id) {
  const i = db.actions.findIndex((x) => x.id === id); if (i < 0) throw new NotFound('Action item');
  return db.actions.splice(i, 1)[0];
}

export function getProvider(db, name) {
  const p = db.providers.find((x) => x.name === name); if (!p) throw new NotFound('Provider');
  return p;
}

export function createReport(db, body) {
  if (!body || !body.kind) throw new BadRequest('Report kind is required.');
  const r = { ...body, id: newId('r'), at: new Date().toISOString(), by: db.userId };
  db.reports.push(r);
  return { id: r.id };
}
