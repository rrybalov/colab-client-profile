// App state.
// - Records from the data source live in three tables (clients, notes, actions) keyed by id. Pages read the
//   rows they need through the hooks in ./data.js, which also load them; each load is a "query" with a status.
// - UI preferences (filters, sorts, open panels, drafts) persist in localStorage under colab.prefs.
// - Each slice has its own context, so changing a filter doesn't re-render components that only read records.
import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useCallback } from 'react';

const PREFS_KEY = 'colab.prefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) { /* storage full or blocked */ } };

const EMPTY = { clients: {}, notes: {}, actions: {}, queries: {} };

function merge(table, rows, idKey = 'id') {
  if (!rows || !rows.length) return table;
  const next = { ...table };
  rows.forEach((r) => { next[r[idKey]] = next[r[idKey]] ? { ...next[r[idKey]], ...r } : r; });
  return next;
}
function drop(table, ids) {
  if (!ids || !ids.length) return table;
  const next = { ...table };
  ids.forEach((id) => { delete next[id]; });
  return next;
}
// After a list loads, rows that used to belong to it but are no longer returned were deleted elsewhere.
function prune(table, rows, belongs) {
  const keep = new Set(rows.map((r) => r.id));
  const gone = Object.keys(table).filter((id) => !keep.has(id) && !id.startsWith('tmp-') && belongs(table[id]));
  return drop(table, gone);
}

function applyRecords(s, r) {
  let { clients, notes, actions } = s;
  if (r.prune) {
    if (r.prune.notes) notes = prune(notes, r.notes || [], r.prune.notes);
    if (r.prune.actions) actions = prune(actions, r.actions || [], r.prune.actions);
    if (r.prune.clients) { // clients are never dropped; ones missing from the starred list are unstarred
      const keep = new Set((r.clients || []).map((c) => c.id));
      const unstar = Object.values(clients).filter((c) => !keep.has(c.id) && r.prune.clients(c)).map((c) => ({ id: c.id, starred: null }));
      clients = merge(clients, unstar);
    }
  }
  return {
    ...s,
    clients: merge(clients, r.clients),
    notes: drop(merge(notes, r.notes), r.removeNotes),
    actions: drop(merge(actions, r.actions), r.removeActions)
  };
}

function dataReducer(s, a) {
  switch (a.type) {
    case 'query/start': {
      const q = s.queries[a.key];
      return { ...s, queries: { ...s.queries, [a.key]: { ...q, status: q && q.data !== undefined ? 'refreshing' : 'loading', error: null } } };
    }
    case 'query/done':
      return { ...applyRecords(s, a.records || {}), queries: { ...s.queries, [a.key]: { status: 'ready', data: a.data === undefined ? true : a.data, error: null } } };
    case 'query/fail': {
      const q = s.queries[a.key];
      // A failed background refresh keeps showing what was already loaded.
      const status = q && q.data !== undefined ? 'ready' : 'error';
      return { ...s, queries: { ...s.queries, [a.key]: { ...q, status, error: a.error } } };
    }
    case 'records': return applyRecords(s, a.records);
    case 'invalidate': {
      const queries = {};
      Object.keys(s.queries).forEach((k) => { queries[k] = { ...s.queries[k], status: s.queries[k].data !== undefined ? 'stale' : s.queries[k].status }; });
      return { ...s, queries };
    }
    case 'clear': return EMPTY;
    default: return s;
  }
}

const DataCtx = createContext(EMPTY);
const PrefsCtx = createContext({});
const ToastCtx = createContext(null);
const ApiCtx = createContext(null);

export function StoreProvider({ source, children }) {
  const [data, dispatchData] = useReducer(dataReducer, EMPTY);
  const [prefs, setPrefsState] = useReducer((p, patch) => (patch === null ? {} : { ...p, ...patch }), undefined, loadPrefs);
  const [toast, setToast] = useReducer((t, next) => next, null);
  const inflight = useRef(new Map());

  useEffect(() => { savePrefs(prefs); }, [prefs]);
  useEffect(() => (source.subscribe ? source.subscribe(() => dispatchData({ type: 'invalidate' })) : undefined), [source]);

  const api = useMemo(() => {
    const showToast = (text, opts = {}) => setToast(text ? { id: Date.now() + Math.random(), text, undo: opts.undo || null, error: !!opts.error } : null);
    const afterWrite = () => { if (source.saveFailed) showToast("Changes can't be saved in this browser. They'll be lost on reload.", { error: true }); };
    return {
      source,
      dispatch: dispatchData,
      setPref: (key, value) => setPrefsState({ [key]: value }),
      setPrefs: (patch) => setPrefsState(patch),
      toast: showToast,
      // Loads a query once; concurrent callers share the request.
      load(key, fetcher) {
        if (inflight.current.has(key)) return inflight.current.get(key);
        dispatchData({ type: 'query/start', key });
        const p = Promise.resolve().then(fetcher).then(
          (res) => { dispatchData({ type: 'query/done', key, data: res && res.data, records: res && res.records }); },
          (error) => { dispatchData({ type: 'query/fail', key, error }); }
        ).finally(() => inflight.current.delete(key));
        inflight.current.set(key, p);
        return p;
      },
      // Shows the change at once, then confirms it with the data source. On failure the change is rolled back.
      // The confirmation shows at once; Undo waits for the original request so the two can't cross.
      async optimistic({ apply, revert, call, confirm, done, undo }) {
        if (apply) dispatchData({ type: 'records', records: apply });
        const pending = call();
        if (done) showToast(done, { undo: undo ? () => pending.then(undo) : null });
        try {
          const result = await pending;
          if (confirm) dispatchData({ type: 'records', records: confirm(result) });
          afterWrite();
          return result;
        } catch (e) {
          if (revert) dispatchData({ type: 'records', records: revert });
          showToast((e && e.message ? e.message + ' ' : '') + 'Your change was not saved.', { error: true });
          throw e;
        }
      },
      async reset() {
        await source.reset();
        setPrefsState(null);
        dispatchData({ type: 'clear' });
        showToast('Sample data reset');
      }
    };
  }, [source]);

  return (
    <ApiCtx.Provider value={api}>
      <DataCtx.Provider value={data}>
        <PrefsCtx.Provider value={prefs}>
          <ToastCtx.Provider value={toast}>{children}</ToastCtx.Provider>
        </PrefsCtx.Provider>
      </DataCtx.Provider>
    </ApiCtx.Provider>
  );
}

export const useApi = () => useContext(ApiCtx);
export const useData = () => useContext(DataCtx);
export const useToastState = () => useContext(ToastCtx);

// A piece of UI state that persists across reloads (a drop-in for useState).
export function usePref(key, fallback) {
  const prefs = useContext(PrefsCtx);
  const { setPref } = useContext(ApiCtx);
  const has = Object.prototype.hasOwnProperty.call(prefs, key);
  const value = has ? prefs[key] : fallback;
  const set = useCallback((v) => setPref(key, typeof v === 'function' ? v(value) : v), [setPref, key, value]);
  return [value, set];
}

// Loads `key` when it has never loaded or was marked stale; returns its status.
export function useQuery(key, fetcher) {
  const { queries } = useContext(DataCtx);
  const { load } = useContext(ApiCtx);
  const q = key ? queries[key] : null;
  const status = q ? q.status : 'idle';
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  useEffect(() => {
    if (key && (status === 'idle' || status === 'stale')) load(key, () => fetchRef.current());
  }, [key, status, load]);
  const retry = useCallback(() => { if (key) load(key, () => fetchRef.current()); }, [key, load]);
  return {
    status: key ? (status === 'idle' ? 'loading' : status) : 'idle',
    ready: status === 'ready' || status === 'stale' || status === 'refreshing',
    error: q ? q.error : null,
    data: q ? q.data : undefined,
    retry
  };
}
