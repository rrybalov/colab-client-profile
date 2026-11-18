// Data source for a real CoLab API. Endpoints and payloads are documented in docs/API.md.
// Every response passes through the normalizers in ../schema.js.
import { normalizeSession, normalizeClient, normalizeClientSummary, normalizeNote, normalizeAction, normalizeProvider, normalizeContact, normalizeContactSummary, normalizeHistory, normalizeContactChange as contactChange, normalizeTeam, normalizeReassign, normalizeCloseout, normalizeDischarge, normalizeReport, normalizeReferral, normalizeDirectory } from '../schema.js';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function createHttpSource({ baseUrl, headers = {}, credentials = 'same-origin', timeoutMs = 15000 }) {
  const root = String(baseUrl || '').replace(/\/$/, '');

  async function request(method, path, body) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl && setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(root + path, {
        method, credentials, signal: ctrl && ctrl.signal,
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new ApiError(0, e.name === 'AbortError' ? 'The server took too long to answer.' : "Can't reach the server. Check your connection.");
    } finally { if (timer) clearTimeout(timer); }
    if (res.status === 204) return undefined;
    let data = null;
    try { data = await res.json(); } catch (e) { /* empty or non-JSON body */ }
    if (!res.ok) throw new ApiError(res.status, (data && data.error) || 'The server returned an error (' + res.status + ').');
    return data;
  }
  const enc = encodeURIComponent;
  const query = (q) => Object.keys(q).filter((k) => String(q[k] || '').trim()).map((k) => enc(k) + '=' + enc(String(q[k]).trim())).join('&');

  return {
    kind: 'api',
    getSession: () => request('GET', '/session').then(normalizeSession),
    getStarredClients: () => request('GET', '/clients?starred=true').then((l) => l.map(normalizeClientSummary)),
    setStar: (id, body) => request('PUT', '/clients/' + enc(id) + '/star', body).then(normalizeClientSummary),
    searchClients: (q) => request('GET', '/clients/search?' + query(q)).then((r) => ({ total: Number(r.total) || 0, results: (r.results || []).map(normalizeClientSummary) })),
    getClient: (id) => request('GET', '/clients/' + enc(id)).then(normalizeClient),
    revealSsn: (id) => request('GET', '/clients/' + enc(id) + '/ssn').then((r) => String(r.ssn || '')),
    getClientNotes: (id) => request('GET', '/clients/' + enc(id) + '/notes').then((l) => l.map(normalizeNote)),
    getClientActions: (id) => request('GET', '/clients/' + enc(id) + '/action-items').then((l) => l.map(normalizeAction)),
    getMyNotes: () => request('GET', '/me/notes').then((r) => ({ notes: (r.notes || []).map(normalizeNote), clients: (r.clients || []).map(normalizeClientSummary) })),
    getMyActions: () => request('GET', '/me/action-items').then((r) => ({ actionItems: (r.actionItems || []).map(normalizeAction), clients: (r.clients || []).map(normalizeClientSummary) })),
    createNote: (clientId, body) => request('POST', '/clients/' + enc(clientId) + '/notes', body).then(normalizeNote),
    updateNote: (id, patch) => request('PATCH', '/notes/' + enc(id), patch).then(normalizeNote),
    deleteNote: (id) => request('DELETE', '/notes/' + enc(id)),
    createAction: (clientId, body) => request('POST', '/clients/' + enc(clientId) + '/action-items', body).then(normalizeAction),
    updateAction: (id, patch) => request('PATCH', '/action-items/' + enc(id), patch).then(normalizeAction),
    deleteAction: (id) => request('DELETE', '/action-items/' + enc(id)),
    getProvider: (name) => request('GET', '/providers/' + enc(name)).then(normalizeProvider),
    submitReport: (body) => request('POST', '/reports', body),

    listContacts: (q = {}) => request('GET', '/asc/contacts' + (query(q) ? '?' + query(q) : '')).then((l) => l.map(normalizeContactSummary)),
    getContact: (id) => request('GET', '/asc/contacts/' + enc(id)).then(normalizeContact),
    createContact: (body) => request('POST', '/asc/contacts', body).then(normalizeContact),
    updateContact: (id, patch) => request('PATCH', '/asc/contacts/' + enc(id), patch).then(contactChange),
    linkContact: (id, body) => request('POST', '/asc/contacts/' + enc(id) + '/link', body).then(contactChange),
    closeContact: (id, body) => request('POST', '/asc/contacts/' + enc(id) + '/close', body).then(contactChange),
    startCorrection: (id, body) => request('POST', '/asc/contacts/' + enc(id) + '/correction', body).then(contactChange),
    finishCorrection: (id) => request('POST', '/asc/contacts/' + enc(id) + '/correction/finish', {}).then(contactChange),
    switchUser: (userId) => request('PUT', '/session', { userId }),
    lookupContact: (ref) => request('GET', '/asc/contacts/lookup?ref=' + enc(ref)).then(normalizeContactSummary),
    getContactHistory: (q) => request('GET', '/asc/history?' + query(q)).then(normalizeHistory),
    getTeamWork: () => request('GET', '/asc/team').then(normalizeTeam),
    reassign: (body) => request('POST', '/asc/reassign', body).then(normalizeReassign),
    listCloseouts: () => request('GET', '/asc/closeouts').then((l) => l.map(normalizeCloseout)),
    requestCloseout: (clientId, body) => request('POST', '/clients/' + enc(clientId) + '/asc/closeout', body).then(normalizeCloseout),
    withdrawCloseout: (id) => request('POST', '/asc/closeouts/' + enc(id) + '/withdraw', {}).then(normalizeCloseout),
    decideCloseout: (id, body) => request('POST', '/asc/closeouts/' + enc(id) + '/decide', body).then(normalizeDischarge),
    dischargeClient: (clientId, body) => request('POST', '/clients/' + enc(clientId) + '/asc/discharge', body).then(normalizeDischarge),
    getStateReport: (period) => request('GET', '/asc/reports/' + enc(period)).then(normalizeReport),
    getProviderDirectory: () => request('GET', '/asc/provider-directory').then(normalizeDirectory),
    listReferrals: () => request('GET', '/ipv/referrals').then((l) => l.map(normalizeReferral)),
    getReferral: (id) => request('GET', '/ipv/referrals/' + enc(id)).then(normalizeReferral),
    setReferralStatus: (id, status) => request('PUT', '/ipv/referrals/' + enc(id) + '/status', { status }).then(normalizeReferral),
    setReferralsStatus: (ids, status) => request('POST', '/ipv/referrals/status', { ids, status }).then((l) => l.map(normalizeReferral)),
    submitStateReport: (period) => request('POST', '/asc/reports/' + enc(period) + '/submit', {}).then(normalizeReport)
  };
}
