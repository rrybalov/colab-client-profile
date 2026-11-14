// ASC hooks: load contacts and change them. Like ./data.js, pages never call the data source directly.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi, useData, useQuery } from './store.jsx';

const listKey = (q) => 'contacts:' + JSON.stringify(q || {});

export function useContacts(q) {
  const { source } = useApi();
  const query = useQuery(listKey(q), () => source.listContacts(q || {}).then((data) => ({ data })));
  return { query, contacts: query.data || [] };
}

export function useContact(id) {
  const { source } = useApi();
  const { contacts } = useData();
  const query = useQuery(id ? 'contact:' + id : null, () => source.getContact(id).then((k) => ({ records: { contacts: [k] } })));
  return { query, contact: contacts[id] || null };
}

export function useContactHistory(q) {
  const { source } = useApi();
  const key = q ? 'history:' + JSON.stringify(q) : null;
  const query = useQuery(key, () => source.getContactHistory(q).then((data) => ({ data })));
  return { query, history: query.data || { openItems: [], contacts: [] } };
}

// One level deep: sections (intake, screening…) merge; lists and plain values replace.
const OPS = ['addLinks', 'removeLinks', 'dropIxLinks', 'priorRef'];
export function mergePatch(base, patch) {
  const out = { ...base };
  if (patch.addLinks) out.links = base.links.concat(patch.addLinks.map((l) => ({ actionId: l.actionId, ixId: l.ixId || null, auto: null })));
  if (patch.removeLinks) out.links = (out.links || base.links).filter((l) => patch.removeLinks.indexOf(l.actionId) < 0 || l.auto);
  if (patch.dropIxLinks) out.links = (out.links || base.links).filter((l) => l.ixId !== patch.dropIxLinks);
  Object.keys(patch).forEach((k) => {
    if (OPS.indexOf(k) >= 0) return;
    const v = patch[k];
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) ? { ...base[k], ...v } : v;
  });
  return out;
}

export function useAscMutations() {
  const { source, dispatch, toast } = useApi();
  const refreshLists = useCallback(() => { dispatch({ type: 'invalidate', prefix: 'contacts:' }); dispatch({ type: 'invalidate', prefix: 'history:' }); }, [dispatch]);
  const apply = useCallback((r) => {
    dispatch({ type: 'records', records: { contacts: [r.contact], clients: r.client ? [r.client] : undefined, notes: r.notes, actions: r.actions, removeActions: r.removeActions } });
    refreshLists();
    return r;
  }, [dispatch, refreshLists]);
  const fail = useCallback((e) => { toast((e && e.message ? e.message + ' ' : '') + 'Your change was not saved.', { error: true }); throw e; }, [toast]);

  const createContact = useCallback((body) => source.createContact(body).then((k) => { dispatch({ type: 'records', records: { contacts: [k] } }); refreshLists(); return k; }, fail), [source, dispatch, refreshLists, fail]);
  // Shows the change at once; the server's answer (which can add follow-ups) replaces it. A failure rolls back.
  const updateContact = useCallback((k, patch) => {
    dispatch({ type: 'records', records: { contacts: [mergePatch(k, patch)] } });
    return source.updateContact(k.id, patch).then(apply, (e) => { dispatch({ type: 'records', records: { contacts: [k] } }); return fail(e); });
  }, [source, dispatch, apply, fail]);
  const linkContact = useCallback((k, body) => source.linkContact(k.id, body).then(apply, fail), [source, apply, fail]);
  const closeContact = useCallback((k, body) => source.closeContact(k.id, body).then((c) => { dispatch({ type: 'records', records: { contacts: [c] } }); refreshLists(); return c; }, fail), [source, dispatch, refreshLists, fail]);
  const lookupContact = useCallback((ref) => source.lookupContact(ref), [source]);
  return { createContact, updateContact, linkContact, closeContact, lookupContact };
}

// Editing a contact. Text fields save after a short pause; choices save at once. `view` is the contact with any
// unsaved typing applied, so screens never wait for the network. `status` feeds the "Saved" indicator.
export function useContactEditor(contact) {
  const { updateContact } = useAscMutations();
  const [pending, setPending] = useState({});
  const [status, setStatus] = useState('saved');
  const pendingRef = useRef({});
  const contactRef = useRef(contact);
  contactRef.current = contact;
  const timer = useRef(null);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const patch = pendingRef.current;
    const k = contactRef.current;
    if (!k || !Object.keys(patch).length) return Promise.resolve();
    pendingRef.current = {};
    setPending({});
    setStatus('saving');
    return updateContact(k, patch).then(() => setStatus('saved'), () => setStatus('error'));
  }, [updateContact]);

  const edit = useCallback((patch, opts = {}) => {
    const k = contactRef.current;
    const next = { ...pendingRef.current };
    Object.keys(patch).forEach((key) => {
      const v = patch[key];
      const base = next[key] !== undefined ? next[key] : k && k[key];
      next[key] = v && typeof v === 'object' && !Array.isArray(v) && base && typeof base === 'object' && !Array.isArray(base) ? { ...(next[key] || {}), ...v } : v;
    });
    pendingRef.current = next;
    setPending(next);
    setStatus('editing');
    clearTimeout(timer.current);
    if (opts.now) return flush();
    timer.current = setTimeout(flush, 600);
    return Promise.resolve();
  }, [flush]);

  // Saves anything typed when the contact changes or the page closes.
  useEffect(() => () => { flush(); }, [contact && contact.id]);
  useEffect(() => {
    const before = () => { flush(); };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [flush]);

  const view = useMemo(() => (contact ? mergePatch(contact, pending) : null), [contact, pending]);
  return { view, edit, flush, status };
}
