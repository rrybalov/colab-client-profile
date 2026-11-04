// App state. Records (clients, notes, action items, reports) and UI preferences both persist in
// localStorage, so every change survives a reload. Records also sync live across open tabs.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { buildSeed, SEED_VERSION } from './data/seed.js';

const DB_KEY = 'colab.db';
const PREFS_KEY = 'colab.prefs';

function load(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
}
function initialState() {
  const stored = load(DB_KEY);
  const db = stored && stored.version === SEED_VERSION ? stored : buildSeed();
  const prefs = (stored && stored.version === SEED_VERSION && load(PREFS_KEY)) || {};
  return { db, prefs, toast: null, modal: null };
}

function reducer(state, a) {
  switch (a.type) {
    case 'pref': return state.prefs[a.key] === a.value ? state : { ...state, prefs: { ...state.prefs, [a.key]: a.value } };
    case 'prefs': return { ...state, prefs: { ...state.prefs, ...a.patch } };
    case 'db': {
      const db = a.fn(state.db);
      return { ...state, db, toast: a.toast ? { id: Date.now(), text: a.toast, undo: a.undo ? state.db : null } : state.toast };
    }
    case 'undo': return state.toast && state.toast.undo ? { ...state, db: state.toast.undo, toast: null } : state;
    case 'toast': return { ...state, toast: a.text ? { id: Date.now(), text: a.text, undo: null } : null };
    case 'replaceDb': return { ...state, db: a.db };
    case 'modal': return { ...state, modal: a.modal };
    case 'reset': return { db: buildSeed(), prefs: {}, toast: { id: Date.now(), text: 'Sample data reset', undo: null }, modal: null };
    default: return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const warned = useRef(false);

  useEffect(() => {
    if (!save(DB_KEY, state.db) && !warned.current) { warned.current = true; dispatch({ type: 'toast', text: "Changes can't be saved in this browser. They'll be lost on reload." }); }
  }, [state.db]);
  useEffect(() => { save(PREFS_KEY, state.prefs); }, [state.prefs]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== DB_KEY || !e.newValue) return;
      try { const db = JSON.parse(e.newValue); if (db.version === SEED_VERSION) dispatch({ type: 'replaceDb', db }); } catch (err) { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const api = useMemo(() => ({
    state, dispatch,
    mutate: (fn, toast, undo) => dispatch({ type: 'db', fn, toast, undo }),
    setPref: (key, value) => dispatch({ type: 'pref', key, value }),
    setPrefs: (patch) => dispatch({ type: 'prefs', patch }),
    toast: (text) => dispatch({ type: 'toast', text }),
    // The open dialog is saved too, so a reload puts the person back where they were.
    openModal: (modal) => dispatch({ type: 'pref', key: 'modal', value: modal }),
    closeModal: () => dispatch({ type: 'pref', key: 'modal', value: null })
  }), [state]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() { return useContext(Ctx); }

// A piece of UI state that persists across reloads.
export function usePref(key, fallback) {
  const { state, dispatch } = useContext(Ctx);
  const value = Object.prototype.hasOwnProperty.call(state.prefs, key) ? state.prefs[key] : fallback;
  const set = useCallback((v) => dispatch({ type: 'pref', key, value: typeof v === 'function' ? v(value) : v }), [dispatch, key, value]);
  return [value, set];
}

// Record helpers
export function useClient(id) {
  const { state } = useContext(Ctx);
  return state.db.clients.find((c) => c.id === id) || null;
}
