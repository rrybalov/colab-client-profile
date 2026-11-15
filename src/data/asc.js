// Administrative Service Coordination (ASC): reference lists and the rules every screen and the server share.
// Pure functions only, so the browser, the in-browser data source and tools/mock-api.mjs all agree on
// units, follow-up dates and what the state report needs.

export const CHANNELS = { phone: 'Phone call', person: 'In person' };

export const SAFETY = ['Asked: no danger now', 'Not asked yet'];
export const CALLERS = ['The client', 'Parent or guardian', 'Other family', 'Provider for their client', 'School, CYF, hospital or jail', 'Other'];
export const AGES = ['Child, 0–17', 'Adult, 18–59', 'Older adult, 60+', 'Not sure'];
export const REASONS = ['Find services', 'Question about coverage', 'Following up on an earlier contact', 'Referring someone', 'Something else'];
export const COVERAGE = ['Medical Assistance or HealthChoices', 'Medicare', 'Private insurance', 'None', 'Doesn’t know'];
export const FOUND = ['On their own', 'Provider', 'School', 'CYF', 'Hospital', 'Jail', '211', 'Other'];
export const PRIVACY = ['Private room', 'Shared space, like a lobby'];
export const URGENCY = ['Routine', 'Urgent', 'Crisis'];
export const NEED_OPTIONS = ['Mental health services for a child', 'Mental health, adult', 'Substance use treatment', 'Health coverage (MA or HealthChoices)', 'Housing', 'Food or other benefits', 'Physical health care', 'Rides to care (MATP)'];

// The screening asked on every contact. A concern answer offers to add the matching need.
export const SCREENING = [
  { key: 'mh', label: 'Mental health', short: 'mental health', question: 'Any mental health concerns?', options: ['Yes', 'No', 'Not sure', 'Prefers not to say'], concern: ['Yes'], need: 'MH' },
  { key: 'ph', label: 'Physical health', short: 'physical health', question: 'Is everything OK with their physical health?', options: ['Yes, OK', 'Concern', 'Not sure', 'Prefers not to say'], concern: ['Concern'], need: 'Physical health care' },
  { key: 'house', label: 'Housing', short: 'housing', question: 'Do they have housing?', options: ['Yes, stable', 'At risk of losing it', 'No housing', 'Prefers not to say'], concern: ['At risk of losing it', 'No housing'], need: 'Housing' },
  { key: 'food', label: 'Access to food', short: 'food', question: 'Do they have access to food?', options: ['Yes', 'Sometimes', 'No', 'Prefers not to say'], concern: ['Sometimes', 'No'], need: 'Food or other benefits' },
  { key: 'su', label: 'Substance use', short: 'substance use', question: 'Is there a substance use concern?', options: ['Yes', 'No', 'Not sure', 'Prefers not to say'], concern: ['Yes'], need: 'Substance use treatment' }
];
export const needForScreen = (q, age) => (q.need === 'MH' ? (age === 'Child, 0–17' ? 'Mental health services for a child' : 'Mental health, adult') : q.need);
export const isConcern = (q, answer) => q.concern.indexOf(answer) >= 0;

export const IX_TYPES = ['Information and resources [code TBD]', 'Benefit Assistance · T1016BA', 'Service Planning and Coordination · T1016SP', 'Casefinding [code TBD]', 'Liability determination [code TBD]'];
export const PLACES = ['Telephone [code TBD]', 'Office [code TBD]', 'Community [code TBD]'];
export const HOWS = ['Explained by phone', 'Explained in person', 'Number given', 'Warm transfer', 'Walked them to the provider', 'Transferred', 'Sent in writing [not decided]'];
export const defaultPlace = (channel) => (channel === 'person' ? PLACES[1] : PLACES[0]);
export function howFor(channel, how) {
  if (channel !== 'person') return how;
  return how === 'Explained by phone' ? 'Explained in person' : how === 'Warm transfer' ? 'Walked them to the provider' : how;
}

// Resources a coordinator gives often. `need` picks the need the interaction counts toward.
export const PRESETS = [
  { label: 'IBHS evaluation info', what: 'How to get a child’s mental health evaluation (IBHS)', need: 'MH', type: IX_TYPES[0], how: 'Explained by phone' },
  { label: 'CCBH Member Services', what: 'CCBH Member Services', need: 'Health coverage (MA or HealthChoices)', type: IX_TYPES[1], how: 'Number given' },
  { label: 'Allegheny Link', what: 'Allegheny Link [confirm number]', need: 'Housing', type: IX_TYPES[0], how: 'Number given' },
  { label: '211', what: '211', need: 'Food or other benefits', type: IX_TYPES[0], how: 'Warm transfer' },
  { label: 'MATP', what: 'MATP, rides to medical appointments', need: 'Rides to care (MATP)', type: IX_TYPES[0], how: 'Number given' }
];

export const OUTCOMES = ['Keep open with a follow-up', 'Information given', 'Connected', 'Handed off', 'Transferred to crisis', 'Unable to assist', 'Declined'];
export const URGENT_DESTINATIONS = [
  { id: '911', label: '911', text: 'Immediate danger to life or safety' },
  { id: '988', label: '988 Lifeline', text: 'Thoughts of suicide or emotional crisis' },
  { id: 'resolve', label: 'resolve Crisis Services', text: 'County crisis line, mobile team and walk-in center [confirm number]' }
];
export const URGENT_HOWS = ['Warm transfer: stayed on until connected', 'Transferred', 'Gave them the number'];

export const FOLLOW_HOWS = ['Phone call', 'Text', 'Email', 'Mail'];
const FOLLOW_VERB = { 'Phone call': 'call', Text: 'text', Email: 'email', Mail: 'letter' };

// ------------------------------------------------------------------ dates
const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
// A yyyy-mm-dd date, or the local calendar day of an ISO timestamp.
export const dayOf = (iso) => (String(iso || '').indexOf('T') > 0 ? isoDate(new Date(iso)) : String(iso || '').slice(0, 10));
export const usDate = (iso) => { const p = dayOf(iso).split('-'); return p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : ''; };
const atMidnight = (iso) => { const p = String(iso).slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
export function addBusinessDays(iso, n) {
  const d = atMidnight(iso);
  while (n > 0) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n--; }
  return isoDate(d);
}
// Calendar days, moved forward to Monday when they land on a weekend.
export function addDaysOnWeekday(iso, n) {
  const d = atMidnight(iso);
  d.setDate(d.getDate() + n);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return isoDate(d);
}
export const weekday = (iso) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][atMidnight(iso).getDay()];
export function clockTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  return ((h % 12) || 12) + ':' + pad(d.getMinutes()) + ' ' + (h < 12 ? 'AM' : 'PM');
}
export const minutesBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));

// The two follow-ups scheduled once the person says it's OK to follow up.
export function followUpPlan(contact, firstName) {
  const start = dayOf(contact.startedAt);
  const how = contact.followUp.how;
  const who = firstName || 'them';
  const when = contact.followUp.time ? ', ' + contact.followUp.time.charAt(0).toLowerCase() + contact.followUp.time.slice(1) : '';
  return [
    { key: 'd7', text: '7-day follow-up ' + (FOLLOW_VERB[how] || 'call') + ' with ' + who + when, due: addBusinessDays(start, 7), label: 'Auto · 7 business days' },
    { key: 'd90', text: '90-day check-in: are they connected to care?', due: addDaysOnWeekday(start, 90), label: 'Auto · 90 days' }
  ];
}

// ------------------------------------------------------------------ interactions and reporting
export const unitsFor = (min) => { const m = Number(min); return m > 0 ? Math.max(1, Math.round(m / 15)) : 0; };
export function missingFor(ix) {
  const m = [];
  if (!String(ix.what || '').trim()) m.push('what was given');
  if (!(Number(ix.min) > 0)) m.push('minutes');
  if (!ix.place) m.push('place of service');
  return m;
}
export const serviceCode = (type) => { const m = /T1016\w+/.exec(type || ''); return m ? m[0] : '[TBD]'; };
export function totals(interactions) {
  let min = 0, units = 0, incomplete = 0;
  interactions.forEach((x) => { min += Number(x.min) > 0 ? Number(x.min) : 0; units += unitsFor(x.min); if (missingFor(x).length) incomplete++; });
  return { count: interactions.length, min, units, incomplete };
}
export const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
export const totalsText = (t) => plural(t.count, 'interaction', 'interactions') + ' · ' + t.min + ' min · ' + plural(t.units, 'unit', 'units');

// Documented time that runs past the contact itself (with five minutes' grace for rounding). A warning, not a block:
// a coordinator can document work done after the call ended, but a typo like 300 for 30 should be caught.
export function overtime(contact, now) {
  const length = minutesBetween(contact.startedAt, contact.endedAt || now || new Date().toISOString());
  const documented = totals(contact.interactions).min;
  return documented > length + 5 ? { documented, length } : null;
}

// What still blocks state reporting for an identified contact; empty when it is ready.
export function reportingIssues(contact) {
  const out = [];
  const t = totals(contact.interactions);
  if (!t.count) out.push({ id: 'none', step: 'interactions', title: 'No interactions documented.', text: 'Add at least one before the contact can be reported.' });
  else if (t.incomplete) out.push({ id: 'ix', step: 'interactions', title: 'Minutes or place of service missing', text: 'on ' + plural(t.incomplete, 'interaction', 'interactions') + '.' });
  if (contact.identity === 'unverified') out.push({ id: 'verify', step: 'identify', title: 'Identity not verified.', text: 'Unverified contacts are counted in ASC reports but not sent to the state.' });
  return out;
}

// Steps of a contact, in order, with whether each is done.
export const STEPS = [['intake', 'Intake'], ['identify', 'Identify'], ['interactions', 'Interactions'], ['wrap-up', 'Wrap Up']];
export function stepState(contact) {
  const i = contact.intake;
  const screened = SCREENING.filter((q) => contact.screening[q.key]).length;
  return {
    intake: !!i.safety && i.safety !== 'Not asked yet' && contact.needs.length > 0 && screened === SCREENING.length && !!i.coverage && !!i.found,
    identify: contact.path === 'anon' || !!contact.clientId || contact.identity === 'unverified',
    interactions: contact.interactions.length > 0 && !totals(contact.interactions).incomplete,
    'wrap-up': contact.status === 'closed'
  };
}
export function intakeGaps(contact) {
  const i = contact.intake, gaps = [];
  if (!i.safety || i.safety === 'Not asked yet') gaps.push('safety');
  const screened = SCREENING.filter((q) => contact.screening[q.key]).length;
  if (screened < SCREENING.length) gaps.push('screening (' + screened + ' of ' + SCREENING.length + ')');
  if (!contact.needs.length) gaps.push('needs');
  if (!i.coverage) gaps.push('coverage');
  if (!i.found) gaps.push('how they found us');
  return gaps;
}
export function screeningLine(screening) {
  const asked = SCREENING.filter((q) => screening[q.key]);
  if (!asked.length) return 'Not asked yet';
  const concerns = SCREENING.filter((q) => isConcern(q, screening[q.key])).map((q) => q.short);
  return (concerns.length ? 'Concerns: ' + concerns.join(', ') : 'No concerns') + ' · ' + asked.length + ' of ' + SCREENING.length + ' asked';
}
