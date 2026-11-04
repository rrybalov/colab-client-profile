// Data source backed by sample data saved in this browser's localStorage. It runs the same server logic as
// the mock API (../backend.js), so screens can't tell it apart from a real API.
import * as api from '../backend.js';
import { buildSeed, enrich, SEED_VERSION } from '../seed.js';
import { normalizeSession, normalizeClient, normalizeClientSummary, normalizeNote, normalizeAction, normalizeProvider } from '../schema.js';

const KEY = 'colab.db';

function read() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

// Older saved data is upgraded in place so changes people made are kept:
// version 3 (app v2.x) lacked staff, contact sources and full SSNs; version 4 (app v3.0) lacked address histories.
function upgrade(stored) {
  if (stored && stored.version === SEED_VERSION) return stored;
  if (!stored || (stored.version !== 3 && stored.version !== 4)) return buildSeed();
  const fresh = stored.version === 3 ? buildSeed() : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  stored.clients.forEach((c) => enrich(c, today));
  const extra = fresh ? { userId: fresh.userId, staff: fresh.staff, colabs: fresh.colabs, providers: fresh.providers } : {};
  return { ...stored, ...extra, version: SEED_VERSION, reports: stored.reports || [] };
}

export function createLocalSource() {
  let db = upgrade(read());
  db.canReset = true;
  let saveFailed = false;
  const listeners = new Set();

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); saveFailed = false; }
    catch (e) { saveFailed = true; }
  };
  save();

  // Copies stand in for the network: nothing the screens hold can change the stored data by reference.
  const copy = (v) => JSON.parse(JSON.stringify(v));
  const run = (fn, write) => new Promise((resolve, reject) => {
    try {
      const out = copy(fn(db));
      if (write) save();
      resolve(out);
    } catch (e) { reject(e); }
  });

  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try { const next = JSON.parse(e.newValue); if (next.version === SEED_VERSION) { db = next; db.canReset = true; listeners.forEach((fn) => fn()); } } catch (err) { /* ignore */ }
  });

  return {
    kind: 'local',
    get saveFailed() { return saveFailed; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { db = buildSeed(); db.canReset = true; save(); return Promise.resolve(); },

    getSession: () => run((d) => api.session(d)).then(normalizeSession),
    getStarredClients: () => run((d) => api.starredClients(d)).then((l) => l.map(normalizeClientSummary)),
    setStar: (id, body) => run((d) => api.setStar(d, id, body), true).then(normalizeClientSummary),
    searchClients: (q) => run((d) => api.searchClients(d, q)).then((r) => ({ total: r.total, results: r.results.map(normalizeClientSummary) })),
    getClient: (id) => run((d) => api.getClient(d, id)).then(normalizeClient),
    revealSsn: (id) => run((d) => api.revealSsn(d, id)).then((r) => r.ssn),
    getClientNotes: (id) => run((d) => api.clientNotes(d, id)).then((l) => l.map(normalizeNote)),
    getClientActions: (id) => run((d) => api.clientActions(d, id)).then((l) => l.map(normalizeAction)),
    getMyNotes: () => run((d) => api.myNotes(d)).then((r) => ({ notes: r.notes.map(normalizeNote), clients: r.clients.map(normalizeClientSummary) })),
    getMyActions: () => run((d) => api.myActions(d)).then((r) => ({ actionItems: r.actionItems.map(normalizeAction), clients: r.clients.map(normalizeClientSummary) })),
    createNote: (clientId, body) => run((d) => api.createNote(d, clientId, body), true).then(normalizeNote),
    updateNote: (id, patch) => run((d) => api.updateNote(d, id, patch), true).then(normalizeNote),
    deleteNote: (id) => run((d) => api.deleteNote(d, id), true).then(() => undefined),
    createAction: (clientId, body) => run((d) => api.createAction(d, clientId, body), true).then(normalizeAction),
    updateAction: (id, patch) => run((d) => api.updateAction(d, id, patch), true).then(normalizeAction),
    deleteAction: (id) => run((d) => api.deleteAction(d, id), true).then(() => undefined),
    getProvider: (name) => run((d) => api.getProvider(d, name)).then(normalizeProvider),
    submitReport: (body) => run((d) => api.createReport(d, body), true)
  };
}
