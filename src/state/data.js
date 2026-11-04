// Hooks that load records and return them ready to show, plus every change a person can make.
// Pages never call the data source directly; this file is the one place that knows the API's operations.
import { useMemo, useCallback } from 'react';
import { useApi, useData, useQuery } from './store.jsx';
import { byDateDesc, todayUS } from '../lib.js';

// Rows in the order the data source returned them, with rows added since (newest first) ahead of them.
function ordered(table, ids, belongs) {
  const known = new Set(ids || []);
  const added = Object.values(table).filter((r) => !known.has(r.id) && belongs(r)).sort((a, b) => (a.createdOrder || 0) - (b.createdOrder || 0));
  return added.concat((ids || []).map((id) => table[id]).filter((r) => r && belongs(r)));
}
const ids = (list) => list.map((r) => r.id);

// ------------------------------------------------------------------ session (signed-in user, staff, CoLabs)
export function useSessionQuery() {
  const { source } = useApi();
  return useQuery('session', () => source.getSession().then((data) => ({ data })));
}
// Only used below the app's loading gate, so the session is always loaded.
export function useSession() {
  const { queries } = useData();
  const s = queries.session.data;
  return useMemo(() => {
    const staffById = {}; s.staff.forEach((x) => { staffById[x.id] = x; });
    const colabById = {}; s.colabs.forEach((x) => { colabById[x.id] = x; });
    return {
      ...s,
      me: s.user.id,
      staffName: (id) => (staffById[id] ? staffById[id].first + ' ' + staffById[id].last : id || ''),
      colabTag: (id) => (colabById[id] ? colabById[id].tag : id),
      colabName: (id) => (colabById[id] ? colabById[id].name : id)
    };
  }, [s]);
}

// ------------------------------------------------------------------ lists
export function useStarred() {
  const { source } = useApi();
  const { clients } = useData();
  const query = useQuery('starred', () => source.getStarredClients().then((list) => ({ records: { clients: list, prune: { clients: (c) => !!c.starred } } })));
  const list = useMemo(() => Object.values(clients).filter((c) => c.starred), [clients]);
  return { query, clients: list };
}

export function useMyNotes() {
  const { source } = useApi();
  const { notes } = useData();
  const { me } = useSession();
  const query = useQuery('myNotes', () => source.getMyNotes().then((r) => ({ data: ids(r.notes), records: { notes: r.notes, clients: r.clients, prune: { notes: (n) => n.author === me } } })));
  const list = useMemo(() => ordered(notes, query.data, (n) => n.author === me).sort(byDateDesc), [notes, query.data, me]);
  return { query, notes: list };
}

export function useMyActions() {
  const { source } = useApi();
  const { actions } = useData();
  const { me } = useSession();
  const query = useQuery('myActions', () => source.getMyActions().then((r) => ({ data: ids(r.actionItems), records: { actions: r.actionItems, clients: r.clients, prune: { actions: (a) => a.assignee === me } } })));
  const list = useMemo(() => ordered(actions, query.data, (a) => a.assignee === me), [actions, query.data, me]);
  return { query, actions: list };
}

export function useClientsById() {
  return useData().clients;
}

// ------------------------------------------------------------------ one client
export function useClient(id) {
  const { source } = useApi();
  const { clients } = useData();
  const query = useQuery(id ? 'client:' + id : null, () => source.getClient(id).then((c) => ({ records: { clients: [c] } })));
  const c = clients[id];
  return { query, client: c && c.full ? c : null };
}

export function useClientNotes(id, sort = 'desc') {
  const { source } = useApi();
  const { notes } = useData();
  const query = useQuery('notes:' + id, () => source.getClientNotes(id).then((list) => ({ data: ids(list), records: { notes: list, prune: { notes: (n) => n.clientId === id } } })));
  const list = useMemo(() => {
    return ordered(notes, query.data, (n) => n.clientId === id).sort(sort === 'asc' ? (a, b) => byDateDesc(b, a) : byDateDesc);
  }, [notes, query.data, id, sort]);
  return { query, notes: list };
}

export function useClientActions(id) {
  const { source } = useApi();
  const { actions } = useData();
  const query = useQuery('actions:' + id, () => source.getClientActions(id).then((list) => ({ data: ids(list), records: { actions: list, prune: { actions: (a) => a.clientId === id } } })));
  // Newest first, so an item just added shows at the top of short lists.
  const list = useMemo(() => ordered(actions, query.data, (a) => a.clientId === id), [actions, query.data, id]);
  return { query, actions: list };
}

export function useProvider(name) {
  const { source } = useApi();
  return useQuery('provider:' + name, () => source.getProvider(name).then((data) => ({ data })));
}

export function useSearch(params) {
  const { source } = useApi();
  const { clients } = useData();
  const key = params ? 'search:' + JSON.stringify(params) : null;
  const query = useQuery(key, () => source.searchClients(params).then((r) => ({ data: { total: r.total, ids: r.results.map((c) => c.id) }, records: { clients: r.results } })));
  const results = useMemo(() => (query.data ? query.data.ids.map((id) => clients[id]).filter(Boolean) : []), [query.data, clients]);
  return { query, total: query.data ? query.data.total : 0, results };
}

// ------------------------------------------------------------------ changes
let order = 0;
const tempId = () => 'tmp-' + Date.now().toString(36) + (order++).toString(36);

export function useMutations() {
  const api = useApi();
  const { source, optimistic } = api;

  const setStar = useCallback((c, on, favorited) => {
    const body = on ? { starred: 'private', favorited: favorited || todayUS() } : { starred: null };
    const before = { id: c.id, starred: c.starred, favorited: c.favorited };
    const name = c.first + ' ' + c.last;
    return optimistic({
      apply: { clients: [{ id: c.id, starred: body.starred, favorited: on ? body.favorited : c.favorited }] },
      revert: { clients: [before] },
      call: () => source.setStar(c.id, body),
      confirm: (s) => ({ clients: [s] }),
      done: on ? name + ' added to starred clients' : name + ' removed from starred clients',
      undo: () => (on ? setStar({ ...c, starred: body.starred }, false) : setStar({ ...c, starred: null }, true, before.favorited))
    });
  }, [source, optimistic]);

  const toggleAction = useCallback((a) => optimistic({
    apply: { actions: [{ id: a.id, done: !a.done }] },
    revert: { actions: [{ id: a.id, done: a.done }] },
    call: () => source.updateAction(a.id, { done: !a.done }),
    confirm: (x) => ({ actions: [x] }),
    done: a.done ? 'Marked open' : 'Marked complete',
    undo: () => toggleAction({ ...a, done: !a.done })
  }), [source, optimistic]);

  const createAction = useCallback((clientId, fields, done = 'Action item added') => {
    const tmp = { id: tempId(), clientId, tag: 'PERSONAL', done: false, edited: false, ...fields, createdOrder: -Date.now() };
    return optimistic({
      apply: { actions: [tmp] },
      revert: { removeActions: [tmp.id] },
      call: () => source.createAction(clientId, fields),
      confirm: (x) => ({ actions: [{ ...x, createdOrder: tmp.createdOrder }], removeActions: [tmp.id] }),
      done
    });
  }, [source, optimistic]);

  const updateAction = useCallback((a, fields) => optimistic({
    apply: { actions: [{ id: a.id, ...fields, edited: true }] },
    revert: { actions: [a] },
    call: () => source.updateAction(a.id, fields),
    confirm: (x) => ({ actions: [x] }),
    done: 'Action item updated'
  }), [source, optimistic]);

  const deleteAction = useCallback((a) => optimistic({
    apply: { removeActions: [a.id] },
    revert: { actions: [a] },
    call: () => source.deleteAction(a.id),
    done: 'Action item deleted',
    undo: () => optimistic({
      apply: { actions: [a] },
      revert: { removeActions: [a.id] },
      call: () => source.createAction(a.clientId, { id: a.id, tag: a.tag, text: a.text, assignee: a.assignee, due: a.due, done: a.done, edited: a.edited }),
      confirm: (x) => ({ removeActions: x.id === a.id ? [] : [a.id], actions: [{ ...x, createdOrder: a.createdOrder }] })
    })
  }), [source, optimistic]);

  const createNote = useCallback((clientId, fields, me) => {
    const tmp = { id: tempId(), clientId, date: todayUS(), edited: false, tag: 'PERSONAL', author: me, ...fields, createdOrder: -Date.now() };
    return optimistic({
      apply: { notes: [tmp] },
      revert: { removeNotes: [tmp.id] },
      call: () => source.createNote(clientId, fields),
      confirm: (x) => ({ notes: [{ ...x, createdOrder: tmp.createdOrder }], removeNotes: [tmp.id] }),
      done: 'Case note saved'
    });
  }, [source, optimistic]);

  const updateNote = useCallback((n, fields) => optimistic({
    apply: { notes: [{ id: n.id, ...fields, edited: true }] },
    revert: { notes: [n] },
    call: () => source.updateNote(n.id, fields),
    confirm: (x) => ({ notes: [x] }),
    done: 'Case note updated'
  }), [source, optimistic]);

  const deleteNote = useCallback((n) => optimistic({
    apply: { removeNotes: [n.id] },
    revert: { notes: [n] },
    call: () => source.deleteNote(n.id),
    done: 'Case note deleted',
    undo: () => optimistic({
      apply: { notes: [n] },
      revert: { removeNotes: [n.id] },
      call: () => source.createNote(n.clientId, { id: n.id, date: n.date, edited: n.edited, restricted: n.restricted, tag: n.tag, author: n.author, text: n.text }),
      confirm: (x) => ({ removeNotes: x.id === n.id ? [] : [n.id], notes: [x] })
    })
  }), [source, optimistic]);

  const submitReport = useCallback((body) => source.submitReport(body), [source]);
  const revealSsn = useCallback((id) => source.revealSsn(id), [source]);

  return { setStar, toggleAction, createAction, updateAction, deleteAction, createNote, updateNote, deleteNote, submitReport, revealSsn, reset: api.reset };
}
