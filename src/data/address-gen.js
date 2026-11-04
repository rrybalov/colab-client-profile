// Generates a plausible address history for a sample client. Deterministic per client id, and separate from
// the main random stream in seed.js, so adding addresses changes no other sample data.
//
// Each history has the client's current address as its most recent open record, earlier residences going back
// in time, and the situations a real merged record shows: a mailing address open alongside the residence,
// out-of-state billing addresses, shelter stays, stays that overlap, custody records that overlap an address
// left open, and occasionally the same address reappearing years later.
import { groupConcurrent, overlaps, stateOf } from './addresses.js';

function rng(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) { h ^= seedText.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const usToDate = (us) => { const [m, d, y] = String(us).split('/').map(Number); return new Date(y, m - 1, d); };

// Named source systems behind each bucket (codes as in the county's data warehouse).
const SYSTEMS = {
  OBH: [['DCS - HealthChoices - CCBH Eligibility', 'CCBHEL'], ['DCS - HealthChoices - BH Outreach', 'BHOUT'], ['DCS - HealthChoices - Annual Assessment', 'BHANNL'], ['DCS - Homeless Mgmt Info System (HMIS)', 'HMIS'], ['DCS - Other', 'DCSOTH']],
  DHS: [['DCS - Benefits Correspondence (Mailing)', 'BNFMAIL'], ['DCS - Voter Registration (PA)', 'PAVOTR'], ['DCS - Case Management Cross-Reference', 'CMXREF'], ['DCS - Courts - Adult Probation (APCMS)', 'APCMS'], ['DCS - Other', 'DCSOTH']],
  SNAP: [['DCS - SNAP Enrollment', 'SNPENR'], ['DCS - SNAP Benefits Renewal', 'BNFREN']],
  Medicare: [['CMS - Medicare Enrollment (MBI)', 'MBIENR'], ['CMS - Part B Billing Address', 'PARTB']],
  CYF: [['DCS - CYF Family Services Record', 'CYFFSR'], ['DCS - CYF Intake', 'CYFINT']],
  Shelter: [['DCS - Operation Safety Net - Street Log', 'OSNSL'], ['DCS - Homeless Mgmt Info System (HMIS)', 'HMIS']],
  Provider: [['DCS - Provider - Case Management Record', 'PRCMR'], ['DCS - Provider - Home Visit Log', 'PRVHVL']]
};
const AGENCY = {
  OBH: 'OBH – Allegheny County', DHS: 'Allegheny County DHS', SNAP: 'SNAP – Allegheny DHS', Medicare: 'Medicare / Medicaid (CMS)',
  CYF: 'CYF – Allegheny County', ACHD: 'Allegheny County Health Dept', Self: 'DHS intake (self-report)'
};
const METHOD = {
  OBH: ['Intake form', 'Annual assessment form', 'Outreach contact', 'Case management intake'],
  DHS: ['Benefits renewal — client reported', 'Case file update', 'Benefits address update', 'Case file cross-reference'],
  SNAP: ['SNAP enrollment address', 'SNAP renewal address', 'Benefits renewal — client reported'],
  Medicare: ['Billing address on file', 'Enrollment address'],
  CYF: ['Family services file', 'Family services follow-up'],
  ACHD: ['Public health visit', 'On-site health screening'],
  Self: ['Verbal self-report', 'Self-reported at intake']
};
const OFFICES = {
  DHS: ['Allegheny County DHS — Main Office', 'DHS-ALCTY-0019'],
  OBH: ['OBH – Allegheny County, 333 Forbes Ave', 'OBH-ALCTY-0001'],
  CYF: ['CYF – Allegheny County, 333 Forbes Ave', 'CYF-ALCTY-0001'],
  Medicare: ['CMS Medicare — Region 3', 'CMS-MED-PA-44291'],
  ACHD: ['Allegheny County Health Dept (ACHD)', 'ACHD-ALCTY-0033']
};
const SHELTERS = [
  ['Salvation Army – Penn Ave Shelter', 'Pittsburgh', '15224', 'Salvation Army Penn Ave Shelter, 2403 Penn Ave, Pittsburgh, PA 15222', 'SHLT-SAL-PGH-0022'],
  ['Light of Life Rescue Mission — North Ave', 'Pittsburgh', '15212', 'Light of Life Ministries, 913 North Ave, Pittsburgh, PA 15212', 'SHLT-LOL-PGH-0007'],
  ['Severe Weather Emergency Shelter — Smithfield St', 'Pittsburgh', '15222', 'Smithfield United Church, 620 Smithfield St, Pittsburgh, PA 15222', 'SHLT-SWE-PGH-0003'],
  ['Bethlehem Haven — Fifth Ave', 'Pittsburgh', '15219', 'Bethlehem Haven, 905 Watson St, Pittsburgh, PA 15219', 'SHLT-BHV-PGH-0014']
];
const OUT_OF_STATE = [
  ['88 Pleasant View Dr', 'Weirton', 'Weirton', 'Hancock (WV)', '26062'],
  ['590 E State St', 'East Liverpool', 'East Liverpool', 'Columbiana (OH)', '43920'],
  ['1410 Market St', 'Wheeling', 'Wheeling', 'Ohio (WV)', '26003'],
  ['215 Washington St', 'Steubenville', 'Steubenville', 'Jefferson (OH)', '43952']
];
const OOS_SCHOOL = 'N/A';
// Where each custody facility in the sample justice records is: [city, county, zip].
const FACILITY_PLACE = {
  'SCI Greene': ['Waynesburg', 'Greene', '15370'], 'SCI Fayette': ['LaBelle', 'Fayette', '15450'], 'SCI Pine Grove': ['Indiana', 'Indiana', '15701'],
  'UPMC Western Psychiatric Hospital': ['Pittsburgh', 'Allegheny', '15213'], 'Allegheny General Hospital': ['Pittsburgh', 'Allegheny', '15212'],
  'Renewal Center': ['Pittsburgh', 'Allegheny', '15219'], 'Allegheny County Alternative Housing': ['Pittsburgh', 'Allegheny', '15222']
};

export function makeAddressHistory(c, t, { places, providers }) {
  const r = rng(c.id + ':addresses');
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const chance = (p) => r() < p;
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  let n = 0;
  const id = () => c.id + '-ad' + (n++);

  // Which programs know this client, so sources match their record.
  const enrolled = (word) => (c.enrollments || []).some((e) => e.name.includes(word));
  const programs = new Set((c.instances || []).map((i) => i.program));
  const buckets = ['DHS'];
  if (enrolled('SNAP')) buckets.push('SNAP');
  if (enrolled('Medicaid') || enrolled('SSI')) buckets.push('Medicare');
  if (programs.has('Behavioral Health')) buckets.push('OBH');
  if (c.colabs.includes('CYF QA') || (c.services || []).some((s) => s.program === 'Child Welfare')) buckets.push('CYF');
  const myProviders = providers.filter((p) => (c.instances || []).some((i) => i.provider === p.name));

  function sourcesFor(kind) {
    if (kind === 'self') return ['Self'];
    if (kind === 'shelter') return chance(0.6) ? ['Shelter', 'OBH'] : ['Shelter'];
    const first = pick(buckets);
    const second = chance(0.4) ? pick(buckets.concat(myProviders.length ? ['Provider'] : [], ['ACHD'])) : null;
    return second && second !== first ? [first, second] : [first];
  }
  function reportsFor(rec) {
    const start = new Date(rec._s), end = rec._e ? new Date(rec._e) : t;
    return rec.sources.map((b, i) => {
      const at = i === 0 ? start : addDays(start, int(5, 90));
      const date = at > end ? start : at;
      const agency = b === 'Provider' ? (myProviders[0] ? myProviders[0].name + ' (case mgr)' : 'Service provider (case mgr)')
        : b === 'Shelter' ? rec.street.split(/ [—–] /)[0] + ' (intake log)' : AGENCY[b];
      const method = b === 'Provider' ? 'Home visit verification' : b === 'Shelter' ? 'Shelter bed assignment' : pick(METHOD[b]);
      return { agency, date: iso(date), method, county: rec.county };
    });
  }
  function systemsFor(rec) {
    if (!chance(0.55)) return undefined;
    const out = [];
    rec.sources.forEach((b) => {
      const list = SYSTEMS[b];
      if (!list) return;
      const k = int(1, Math.min(3, list.length));
      list.slice().sort(() => r() - 0.5).slice(0, k).forEach(([name, code]) => out.push({ bucket: b, name, code }));
    });
    return out.length ? out : undefined;
  }
  function place() { return pick(places); }
  function street(p) { return int(10, 4999) + ' ' + pick(p.streets) + (chance(0.3) ? ', Apt ' + pick(['1', '2', '3B', '2R', '4', '7']) : ''); }
  function record(fields) {
    const rec = {
      id: id(), township: fields.city, county: 'Allegheny', addressType: 'Permanent', residential: true, kind: 'home',
      ...fields
    };
    rec.start = iso(rec._s); rec.end = rec._e ? iso(rec._e) : null;
    if (!rec.sources) rec.sources = sourcesFor(rec.kind === 'shelter' ? 'shelter' : 'home');
    rec.reports = reportsFor(rec);
    const sys = systemsFor(rec); if (sys) rec.specificSources = sys;
    const office = OFFICES[rec.sources[0]];
    if (!rec.providerLocation && office && chance(0.55)) { rec.providerLocation = office[0]; rec.facilityId = office[1]; }
    if (!rec.providerLocation && rec.sources.includes('Provider') && myProviders.length) {
      const p = myProviders[0];
      rec.providerLocation = p.name + ', ' + p.address; rec.facilityId = 'PA-PRV-' + p.name.replace(/[^A-Z]/g, '').slice(0, 4) + '-' + String(int(1, 99999)).padStart(5, '0');
    }
    if (rec.sources.includes('Self')) rec.certainty = 'low';
    else rec.certainty = rec.sources.length > 1 ? 'high' : rec.addressType === 'Mailing' ? 'low' : 'medium';
    if (chance(0.3)) rec.effDate = iso(addDays(rec._s, int(0, 5)));
    return rec;
  }

  const out = [];
  const birth = c.dob ? usToDate(c.dob) : addDays(t, -365 * 40);
  const adultAt = addDays(birth, 365 * 17);
  // Adults' records start in adulthood; a young client's follow their family from birth.
  const earliest = new Date(Math.max((adultAt < addDays(t, -365 * 3) ? adultAt : birth).getTime(), new Date(1998, 0, 1).getTime()));
  const unhoused = c.living === 'Shelter' || c.living === 'Unhoused';

  // 1. The current address shown on the profile: the most recently started open record.
  const mainStart = addDays(t, -int(unhoused ? 40 : 120, unhoused ? 400 : 1500));
  const main = record({
    _s: mainStart, street: c.address.street, city: c.address.city, zip: c.address.zip, schoolDistrict: c.address.school,
    sources: ['DHS'].concat(buckets.includes('SNAP') ? ['SNAP'] : []),
    useDescription: pick(['Primary residence — confirmed at benefits renewal', 'Residence of record — verified by DHS case file', 'Current residence — reported at program intake']),
    email: c.email || undefined, phone: c.phone ? { number: c.phone, type: pick(['Mobile', 'Home']), validDate: iso(mainStart) } : undefined
  });
  out.push(main);

  // 2. Other open records alongside it.
  if (chance(0.25)) {
    const s = addDays(mainStart, -int(30, 500));
    out.push(record({ _s: s, street: 'PO Box ' + int(1000, 9999), city: 'Pittsburgh', zip: pick(['15230', '15233', '15290']), schoolDistrict: 'N/A', addressType: 'Mailing', residential: false, sources: ['DHS'], useDescription: 'Mailing address on file with DHS — benefits correspondence; no physical residence confirmed' }));
  }
  if (buckets.includes('Medicare') && chance(0.18)) {
    const [st, city, township, county, zip] = pick(OUT_OF_STATE);
    out.push(record({ _s: addDays(mainStart, -int(60, 700)), street: st, city, township, county, zip, schoolDistrict: OOS_SCHOOL, sources: ['Medicare'], providerLocation: 'CMS Medicare — Region 3', facilityId: 'CMS-MED-' + stateOf(county) + '-' + int(10000, 99999), useDescription: `Medicare billing address — out of state (${stateOf(county)}); open at the same time as PA residences` }));
  }
  if (unhoused && chance(0.85)) {
    out.push(record({ _s: addDays(mainStart, -int(10, 200)), street: 'No Fixed Address — ' + pick(['Downtown Outreach Zone', 'North Shore Outreach Zone', 'Strip District Outreach Zone']), city: 'Pittsburgh', zip: '15219', schoolDistrict: 'N/A', addressType: 'Temporary', residential: false, kind: 'shelter', sources: ['OBH', 'Shelter'], useDescription: 'Client reported unsheltered / no fixed address during street outreach' }));
  }
  if (chance(0.07) && /\d/.test(c.address.street)) {
    const base = c.address.street.replace(/, Apt .*$/, '');
    out.push(record({ _s: addDays(mainStart, -int(20, 120)), street: base + ', Unit ' + int(100, 600), city: c.address.city, zip: c.address.zip, schoolDistrict: c.address.school, sources: myProviders.length ? ['Provider'] : ['OBH'], useDescription: 'Same building as the current address but a different unit and source; possible duplicate or a move within the building' }));
  }

  // 3. Earlier residences, walking back in time. Some stays overlap the next one; some leave a gap.
  let cursor = mainStart;
  const history = int(2, 8) + (unhoused ? 2 : 0);
  const recurring = [];
  for (let i = 0; i < history; i++) {
    const end = addDays(cursor, chance(0.25) ? int(10, 75) : -int(0, 60));
    const months = chance(0.3) ? int(2, 6) : int(6, 40);
    if (end - earliest < 75 * 864e5) break;
    const start = new Date(Math.max(addDays(end, -Math.round(months * 30.4)).getTime(), earliest.getTime()));
    const roll = r();
    let rec;
    if (roll < (unhoused ? 0.3 : 0.1)) {
      const [st, city, zip, loc, fac] = pick(SHELTERS);
      rec = record({ _s: start, _e: end, street: st, city, zip, schoolDistrict: 'N/A', addressType: 'Shelter', residential: false, kind: 'shelter', providerLocation: loc, facilityId: fac, useDescription: 'Shelter bed assignment — outreach contact made on-site' });
    } else if (roll < (unhoused ? 0.38 : 0.15)) {
      rec = record({ _s: start, _e: end, street: pick(['Greenfield Community Transitional Housing', 'Crossroads Transitional House — N Craig St', 'Bridge Housing — Webster Ave']), city: 'Pittsburgh', zip: pick(['15207', '15213', '15219']), schoolDistrict: 'Pittsburgh School District', addressType: 'Transitional', residential: false, kind: 'transitional', useDescription: 'Transitional housing program placement' });
    } else if (recurring.length && chance(0.12)) {
      const again = recurring[0];
      rec = record({ _s: start, _e: end, street: again.street, city: again.city, zip: again.zip, schoolDistrict: again.schoolDistrict, sources: ['DHS'], useDescription: 'The same address reappears — reported again by DHS' });
    } else {
      const p = place();
      const self = chance(0.15);
      rec = record({ _s: start, _e: end, street: street(p), city: p.city, zip: p.zip, schoolDistrict: p.school, addressType: chance(0.15) ? 'Temporary' : 'Permanent', sources: self ? ['Self'] : undefined, useDescription: self ? 'Verbal self-report — no corroborating source' : pick(['Residence at time of benefits enrollment', 'Address recorded during program intake', 'Residence confirmed by case file', 'Billing address on file']) });
      if (chance(0.25)) rec.phone = { number: '(412) ' + int(200, 999) + '-' + String(int(0, 9999)).padStart(4, '0'), type: pick(['Mobile', 'Home', 'Work']), validDate: rec.start };
      if (!recurring.length && chance(0.5)) recurring.push(rec);
    }
    out.push(rec);
    cursor = start;
  }

  // 4. Custody stays from the client's justice record, as addresses. Residences are rarely closed for them.
  const KINDS = {
    prison: { addressType: 'Incarceration', kind: 'incarcerated', county: 'Allegheny', zip: '15219', city: 'Pittsburgh', note: 'State sentence — benefits suspended pending release' },
    hold: { addressType: 'Temporary', kind: 'transitional', county: 'Allegheny', zip: '15213', city: 'Pittsburgh', note: 'Behavioral health hold — inpatient stay' },
    housing: { addressType: 'Transitional', kind: 'transitional', county: 'Allegheny', zip: '15219', city: 'Pittsburgh', note: 'Community residential placement — structured re-entry' }
  };
  ((c.justice && c.justice.incarceration) || []).forEach((g) => g.items.forEach((e) => {
    const k = KINDS[e.kind] || KINDS.housing;
    const [from, to] = e.range.split(' to ');
    const s = new Date(from), endText = new Date('15 ' + to);
    if (isNaN(s) || isNaN(endText)) return;
    const [city, county, zip] = FACILITY_PLACE[e.facility] || [k.city, k.county, k.zip];
    out.push(record({
      _s: s, _e: endText < t ? endText : null, street: e.facility, city, township: city, county, zip, schoolDistrict: 'N/A',
      addressType: k.addressType, residential: false, kind: k.kind, sources: ['DHS'], useDescription: k.note,
      providerLocation: e.facility + (e.agency ? ' — ' + e.agency : ''), facilityId: (k.kind === 'incarcerated' ? 'PA-SCI-' : 'PA-RES-') + String(int(100000, 9999999))
    }));
  }));

  // 5. Explain each overlap the way a caseworker would read it.
  const list = out.map(({ _s, _e, ...rest }) => rest);
  groupConcurrent(list).forEach((g) => {
    if (g.type !== 'concurrent') return;
    g.addrs.forEach((a) => {
      const others = g.addrs.filter((b) => b !== a && overlaps(a, b));
      if (!others.length) return;
      const other = others[0];
      if (a.kind === 'incarcerated') a.conflict = `Incarceration overlaps an open residential address (${other.street}) — benefits not suspended`;
      else if (others.some((b) => b.kind === 'incarcerated')) a.conflict = 'Residential address left open across a documented incarceration period';
      else if (a.addressType === 'Mailing') a.conflict = `Mailing-only address open at the same time as ${other.street}`;
      else if (stateOf(a.county) !== 'PA') a.conflict = 'Out-of-state billing address open concurrently with Allegheny County residences';
      else if (/, Unit \d+$/.test(a.street)) a.conflict = `Near-duplicate of ${other.street} — same building, different unit and source`;
      else if (!a.end && !other.end) a.conflict = `Open concurrently with ${others.length} other current address${others.length > 1 ? 'es' : ''}`;
      else a.conflict = `Overlaps ${other.street} — sources disagree on where the client lived`;
    });
  });
  return list;
}
