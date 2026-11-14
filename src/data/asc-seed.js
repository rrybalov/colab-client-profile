// Sample data for ASC (Administrative Service Coordination): the ASC CoLab, Jayden Ruiz (the client in the
// walkthrough), six clients already enrolled with past contacts, and two anonymous calls from Jayden's mother.
// Everything is fictional. Values come from fixed lists and a hash of the client id, not the main random
// stream, so adding ASC leaves every other sample record exactly as it was.
import { addBusinessDays, addDaysOnWeekday, isoDate } from './asc.js';

export const ASC_COLAB = { id: 'ASC', name: 'ASC', tag: 'ASC' };
export const ASC_ENROLLMENT = 'Administrative Service Coordination (ASC)';

const pad = (n) => String(n).padStart(2, '0');
const toUS = (d) => pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const at = (t, days, h, m) => { const x = addDays(t, days); x.setHours(h, m, 0, 0); return x.toISOString(); };
const later = (iso, min) => new Date(new Date(iso).getTime() + min * 60000).toISOString();
const ref = (n) => 'EV-26-' + String(n).padStart(6, '0');

export function jayden(t) {
  return {
    id: 'c65', first: 'Jayden', last: 'Ruiz', household: false, members: null, dob: '03/14/2020',
    gender: 'Male', legalSex: 'Male', race: 'White', ethnicity: 'Hispanic/Latinx', marital: 'Never Married/Single', living: 'With family', language: 'English',
    mci: 'R1100284761', ssn4: '4821', ssnFull: '204-61-4821', dhs: '470284761', dpw: '110028476100', phone: '(412) 555-0142', email: '',
    address: { street: '418 Arlington Ave', city: 'Pittsburgh', state: 'PA', zip: '15210', school: 'Pittsburgh School District', ward: 'Ward 29, District 4 (Pittsburgh)', facility: null },
    colabs: [], starred: null, favorited: '',
    guardian: { name: 'Maria Ruiz', relationship: 'Mother', phone: '(412) 555-0142', note: 'Prefers calls after 3 PM' },
    coverage: { plan: 'HealthChoices (CCBH)', status: 'Active', asOf: toUS(addDays(t, -20)) },
    enrollments: [
      { name: 'Medicaid', kind: 'active', status: 'Active', pct: 40, start: toUS(addDays(t, -700)), end: toUS(addDays(t, 300)), asOf: 'As of ' + toUS(addDays(t, -20)) + ' | 3 weeks ago', stale: false },
      { name: 'Supplemental Nutrition Assistance Program (SNAP)', kind: 'active', status: 'Active', pct: 55, start: toUS(addDays(t, -400)), end: toUS(addDays(t, 200)), asOf: 'As of ' + toUS(addDays(t, -9)) + ' | 9 days ago', stale: false }
    ],
    services: [], instances: [], justice: null
  };
}

function blankContact(id, n, t) {
  return {
    id, ref: ref(n), channel: 'phone', logId: 'CL-4417-' + String(2200 + n), site: '',
    startedAt: '', endedAt: null, status: 'closed', closedKind: null, staff: 'u1',
    clientId: null, identity: null, candidateId: null, possibleClientId: null, path: null, group: '', priorRefs: [], linkedPrior: null,
    anon: { name: '', zip: '', county: 'Allegheny', language: 'English' }, unverifiedName: '',
    intake: { safety: 'Asked: no danger now', caller: 'The client', callerOther: '', callerName: '', age: 'Adult, 18–59', story: '', reason: 'Find services', reasonText: '', coverage: 'Medical Assistance or HealthChoices', coverageDetail: '', found: 'On their own', foundOther: '', privacy: null, callerConfirmed: null, coverageConfirmed: null },
    screening: { mh: 'No', ph: 'Yes, OK', house: 'Yes, stable', food: 'Yes', su: 'No' },
    needs: [], interactions: [], followUp: { ok: null, how: 'Phone call', time: '' }, onsite: { idCheck: null, consentSigned: '', docs: [] },
    notes: [], actions: [], links: [], urgent: null, createdAt: t.toISOString()
  };
}

const ix = (id, what, need, type, how, min, place, notes) => ({ id, what, need, type, how, min: String(min), place, notes: notes || '' });

// Six clients already in ASC, each with a closed contact and, for some, an open follow-up.
const ENROLLED = [
  { id: 'c3', days: -38, staff: 'u2', channel: 'phone', need: 'Housing', urg: 'Urgent', screen: { house: 'At risk of losing it' }, what: 'Allegheny Link [confirm number]', how: 'Warm transfer', min: 22, note: 'Behind two months on rent after losing hours at work. Warm transfer to Allegheny Link for rental assistance screening.', open: 'Confirm the rental assistance screening happened' },
  { id: 'c8', days: -61, staff: 'u1', channel: 'person', need: 'Substance use treatment', urg: 'Urgent', screen: { su: 'Yes' }, what: 'Steel Valley Recovery Center intake', how: 'Walked them to the provider', min: 34, note: 'Came in at the Steel Valley site. Walked over to intake the same afternoon; assessment scheduled.', open: '' },
  { id: 'c14', days: -12, staff: 'u1', channel: 'phone', need: 'Food or other benefits', urg: 'Routine', screen: { food: 'Sometimes' }, what: '211', how: 'Warm transfer', min: 11, note: 'SNAP ran out mid-month. Connected to 211 for pantries near Wilkinsburg and explained how to report the income change.', open: 'Check whether the SNAP change was reported' },
  { id: 'c21', days: -96, staff: 'u1', channel: 'phone', need: 'Health coverage (MA or HealthChoices)', urg: 'Routine', screen: {}, what: 'CCBH Member Services', how: 'Number given', min: 9, note: 'Coverage question about a new psychiatrist. Gave CCBH Member Services; the provider is in network.', open: '' },
  { id: 'c33', days: -24, staff: 'u6', channel: 'person', need: 'Mental health, adult', urg: 'Urgent', screen: { mh: 'Yes', ph: 'Concern' }, what: 'Mercy outpatient walk-in hours', how: 'Explained in person', min: 26, note: 'Met at Mercy. Wants counseling closer to home; explained walk-in hours and the bus route. Asked for a call in a week.', open: '7-day follow-up call' },
  { id: 'c47', days: -150, staff: 'u2', channel: 'phone', need: 'Rides to care (MATP)', urg: 'Routine', screen: {}, what: 'MATP, rides to medical appointments', how: 'Number given', min: 8, note: 'Needs rides to dialysis three times a week. Gave the MATP number and explained the 48-hour booking rule.', open: '' }
];

// Adds ASC to a dataset (a new one, or one saved before ASC existed). Safe to run twice.
export function seedAsc(db, t) {
  if (!db.colabs.some((c) => c.id === 'ASC')) db.colabs.push({ ...ASC_COLAB });
  if (!db.clients.some((c) => c.id === 'c65')) db.clients.push(jayden(t));
  if (db.contacts) return db;
  const contacts = [];
  const clientById = {}; db.clients.forEach((c) => { clientById[c.id] = c; });

  ENROLLED.forEach((e, k) => {
    const c = clientById[e.id];
    if (!c) return;
    if (c.colabs.indexOf('ASC') < 0) c.colabs.push('ASC');
    const n = 184 + Math.floor(e.days * 0.6); // reference numbers rise with the date
    const start = addDays(t, e.days);
    c.enrollments = (c.enrollments || []).filter((x) => x.name !== ASC_ENROLLMENT).concat([{ name: ASC_ENROLLMENT, kind: 'active', status: 'Active', pct: 10, start: toUS(start), end: 'Ongoing', asOf: 'As of ' + toUS(start), stale: false }]);
    const x = blankContact('k' + n, n, t);
    x.channel = e.channel; if (e.channel === 'person') { x.logId = 'VS-0912-' + String(4400 + n); x.site = 'Mercy Behavioral Health'; }
    x.startedAt = at(t, e.days, 10 + (k % 5), 5 * k); x.endedAt = later(x.startedAt, e.min + 4);
    x.staff = e.staff; x.clientId = c.id; x.identity = 'matched'; x.path = 'client'; x.closedKind = 'client';
    x.intake.age = c.dob && Number(c.dob.slice(-4)) > t.getFullYear() - 18 ? 'Child, 0–17' : 'Adult, 18–59';
    x.intake.story = e.note;
    Object.assign(x.screening, e.screen);
    x.needs = [{ id: 'n1', name: e.need, urg: e.urg, outcome: e.open ? 'Keep open with a follow-up' : 'Connected', outcomeNote: '' }];
    x.interactions = [ix('i1', e.what, e.need, e.need === 'Health coverage (MA or HealthChoices)' ? 'Benefit Assistance · T1016BA' : 'Service Planning and Coordination · T1016SP', e.how, e.min, e.channel === 'person' ? 'Office [code TBD]' : 'Telephone [code TBD]', e.note)];
    x.followUp = { ok: 'Yes', how: 'Phone call', time: '' };
    contacts.push(x);
    db.notes.unshift({ id: 'kn' + n, clientId: c.id, date: toUS(start), edited: false, restricted: false, tag: 'ASC', author: e.staff, text: 'ASC contact ' + x.ref + ' – ' + e.note });
    if (e.open) {
      const due = addBusinessDays(isoDate(start), 7);
      db.actions.unshift({ id: 'ka' + n, clientId: c.id, tag: 'ASC', text: e.open, assignee: e.staff, due, done: false, edited: false });
      x.links.push({ actionId: 'ka' + n, ixId: null, auto: 'd7' });
      const due90 = addDaysOnWeekday(isoDate(start), 90);
      db.actions.unshift({ id: 'kb' + n, clientId: c.id, tag: 'ASC', text: '90-day check-in: are they connected to care?', assignee: e.staff, due: due90, done: false, edited: false });
      x.links.push({ actionId: 'kb' + n, ixId: null, auto: 'd90' });
    }
  });

  // Maria Ruiz called twice without sharing her son's information.
  const maria = (n, days, h, staff, need, urg, outcome, list, note) => {
    const x = blankContact('k' + n, n, t);
    x.startedAt = at(t, days, h, 5); x.endedAt = later(x.startedAt, list.reduce((s, i) => s + Number(i.min), 0) + 2);
    x.staff = staff; x.path = 'anon'; x.closedKind = 'anon'; x.group = 'g-ruiz'; x.possibleClientId = 'c65';
    x.anon = { name: 'Maria', zip: '15210', county: 'Allegheny', language: 'English' };
    Object.assign(x.intake, { caller: 'Parent or guardian', age: 'Child, 0–17', story: note, coverage: 'Medical Assistance or HealthChoices', found: 'School' });
    x.screening = { mh: 'Yes', ph: 'Yes, OK', house: 'Yes, stable', food: null, su: null };
    x.needs = [{ id: 'n1', name: need, urg, outcome, outcomeNote: '' }];
    x.interactions = list;
    x.notes = [{ id: 'kn' + n, text: note, restricted: false, date: toUS(addDays(t, days)), author: staff }];
    contacts.push(x);
    return x;
  };
  maria(97, -23, 11, 'u6', 'Health coverage (MA or HealthChoices)', 'Routine', 'Information given',
    [ix('i1', 'CCBH Member Services', 'Health coverage (MA or HealthChoices)', 'Benefit Assistance · T1016BA', 'Number given', 9, 'Telephone [code TBD]', 'Asked whether HealthChoices covers an evaluation for her son.')],
    'Asked whether HealthChoices covers an evaluation for her son. Gave CCBH Member Services. Didn’t want to share info yet.');
  const second = maria(142, -16, 14, 'u2', 'Mental health services for a child', 'Urgent', 'Keep open with a follow-up',
    [ix('i1', 'How to get a child’s mental health evaluation (IBHS)', 'Mental health services for a child', 'Information and resources [code TBD]', 'Explained by phone', 9, 'Telephone [code TBD]'),
      ix('i2', 'resolve Crisis Services, if things escalate', 'Mental health services for a child', 'Information and resources [code TBD]', 'Number given', 5, 'Telephone [code TBD]')],
    'Son, 6, sent home from school twice. Explained the IBHS evaluation path. Maria will look for last year’s evaluation and call back with her reference number. Best time to talk is after 3 PM.');
  second.actions = [{ id: 'ka142', text: 'When Maria calls back: offer to share info so we can refer', assignee: 'u2', due: isoDate(addDays(t, -9)), done: false, tag: 'ASC' }];

  db.contacts = contacts;
  db.contactSeq = 184;
  return db;
}
