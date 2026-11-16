// IPV High Risk Team Review: people referred after an intimate partner violence arrest (from arrest data or
// entered by DHS), who move from Intake to For Review (scheduled for the next case conference) to Reviewed.
// Like backend.js, this runs in the browser's sample-data source and in tools/mock-api.mjs.
import { NotFound, BadRequest, summary } from './backend.js';

export const IPV_STATUS = { intake: 'Intake', review: 'For Review', reviewed: 'Reviewed' };
const keyOf = (us) => (us ? us.slice(6) + us.slice(0, 2) + us.slice(3, 5) : '');
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const staffLabel = (db, id) => { const s = (db.staff || []).find((x) => x.id === id); return s ? s.first + ' ' + s.last : id === 'system' ? 'Arrest data feed' : ''; };
const isPgh = (agency) => /pittsburgh police/i.test(agency || '');

export const ipvReady = (db) => { if (!db.ipv) seedIpv(db); };

// One referral per IPV CoLab client (households aren't referred). Built from each person's most recent
// domestic violence arrest when there is one; the rest were entered by hand and have no arrest details yet.
// Uses a hash of the client id, not the seed's random stream, so stored data can be upgraded in place.
function seedIpv(db) {
  const t = new Date(); t.setHours(10, 0, 0, 0);
  const at = (days, h = 10) => { const d = new Date(t); d.setDate(d.getDate() + days); d.setHours(h, (days * 7) % 60, 0, 0); return d.toISOString(); };
  const people = db.clients.filter((c) => c.colabs.indexOf('IPV') >= 0 && !c.household).sort((a, b) => hash(a.id + 'ipv') - hash(b.id + 'ipv'));
  const coordinators = ['u2', 'u3', 'u5'];
  db.ipv = {
    referrals: people.map((c, i) => {
      const h = hash(c.id + 'ipv');
      const arrest = c.justice ? c.justice.cases.filter((x) => x.dv).sort((a, b) => (keyOf(a.date) < keyOf(b.date) ? 1 : -1))[0] : null;
      const status = i < 3 ? 'reviewed' : i < 6 ? 'review' : 'intake';
      const added = -(3 + (h % 70)); // days ago it came in
      const by = coordinators[h % 3];
      const activity = [{ at: at(added, 8), by: arrest ? 'system' : by, text: arrest ? 'Added from arrest data' : 'Added by DHS' }];
      if (status !== 'intake') activity.push({ at: at(Math.min(-2, added + 4)), by, text: 'Moved to For Review' });
      if (status === 'reviewed') activity.push({ at: at(Math.min(-1, added + 11), 14), by: 'u4', text: 'Reviewed at the IPV case conference' });
      return {
        id: 'r' + c.id.slice(1), clientId: c.id, status,
        sid: String(10000000 + (h % 89999999)),
        doc: c.justice && c.justice.jail ? 'DOC-' + c.justice.jail.doc.slice(0, 6) : '',
        arrest: arrest ? { otn: 'OTN-' + arrest.otn.slice(3), date: arrest.date, agency: arrest.agency, charge: arrest.charge, filed: arrest.filed, effective: arrest.filed } : null,
        risk: c.justice ? c.justice.highRisk.slice() : [],
        source: arrest ? 'arrest' : 'manual',
        activity
      };
    })
  };
}

const findReferral = (db, id) => { ipvReady(db); const r = db.ipv.referrals.find((x) => x.id === id); if (!r) throw new NotFound('Referral'); return r; };

function view(db, r) {
  const c = db.clients.find((x) => x.id === r.clientId);
  const last = r.activity.map((a) => a.at).sort().pop() || '';
  return {
    ...r,
    client: c ? summary(c) : null,
    mci: c ? c.mci : '',
    agencyGroup: r.arrest ? (isPgh(r.arrest.agency) ? 'pittsburgh' : 'other') : '',
    lastActivity: last,
    activity: r.activity.slice().sort((a, b) => (a.at < b.at ? 1 : -1)).map((a) => ({ ...a, byName: staffLabel(db, a.by) }))
  };
}

export function listReferrals(db) {
  ipvReady(db);
  return db.ipv.referrals.map((r) => view(db, r));
}

export const getReferral = (db, id) => view(db, findReferral(db, id));

// Moves a referral between Intake, For Review and Reviewed. Each move is in its activity.
export function setReferralStatus(db, id, body = {}) {
  const r = findReferral(db, id);
  if (!IPV_STATUS[body.status]) throw new BadRequest('Choose Intake, For Review or Reviewed.');
  if (body.status === r.status) return view(db, r);
  const text = body.status === 'reviewed' ? 'Reviewed at the IPV case conference' : 'Moved to ' + IPV_STATUS[body.status];
  r.activity.push({ at: new Date().toISOString(), by: db.userId, text: text + (r.status === 'reviewed' || (r.status === 'review' && body.status === 'intake') ? ' (from ' + IPV_STATUS[r.status] + ')' : '') });
  r.status = body.status;
  return view(db, r);
}

export function setReferralsStatus(db, body = {}) {
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) throw new BadRequest('Choose at least one referral.');
  if (!IPV_STATUS[body.status]) throw new BadRequest('Choose Intake, For Review or Reviewed.');
  ids.forEach((id) => findReferral(db, id));
  return ids.map((id) => setReferralStatus(db, id, { status: body.status }));
}
