// Seeded sample data for the CoLab prototype.
// Every person, ID and record here is fictional. The generator is deterministic (same seed, same data),
// and dates are placed relative to the day the data is first created in a browser.

export const SEED_VERSION = 3;

// ------------------------------------------------------------------ random helpers
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(20261104);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const chance = (p) => rand() < p;
function weighted(pairs) {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let r = rand() * total;
  for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; }
  return pairs[pairs.length - 1][0];
}
function sample(arr, n) {
  const copy = arr.slice(); const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
}
const digits = (n) => Array.from({ length: n }, () => int(0, 9)).join('');

// ------------------------------------------------------------------ dates
const pad = (n) => String(n).padStart(2, '0');
export function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
export function toUS(d) { return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear(); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function today() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }

// ------------------------------------------------------------------ reference lists
export const COLABS = [
  { id: 'IPV', name: 'IPV CoLab', tag: 'IPV' },
  { id: 'ACGO', name: 'ACGO', tag: 'ACGO' },
  { id: 'Allegheny Go', name: 'Allegheny Go', tag: 'ALLEGHENY GO' },
  { id: 'CYF QA', name: 'CYF QA', tag: 'CYF QA' },
  { id: 'Wellness Checks', name: 'Wellness Checks', tag: 'WELLNESS CHECKS' }
];

export const STAFF = [
  { id: 'u1', first: 'Logan', last: 'Bialik', org: 'DHS', email: 'logan.bialik@alleghenycounty.us', initials: 'LB' },
  { id: 'u2', first: 'Dana', last: 'Whitfield', org: 'DHS', email: 'dana.whitfield@alleghenycounty.us', initials: 'DW' },
  { id: 'u3', first: 'Marcus', last: 'Lee', org: 'CYF', email: 'marcus.lee@alleghenycounty.us', initials: 'ML' },
  { id: 'u4', first: 'Priya', last: 'Natarajan', org: 'DHS', email: 'priya.natarajan@alleghenycounty.us', initials: 'PN' },
  { id: 'u5', first: 'Keisha', last: 'Brown', org: 'Probation', email: 'keisha.brown@alleghenycounty.us', initials: 'KB' },
  { id: 'u6', first: 'Tom', last: 'Rinaldi', org: 'DHS', email: 'tom.rinaldi@alleghenycounty.us', initials: 'TR' },
  { id: 'u7', first: 'Ana', last: 'Morales', org: 'OBH', email: 'ana.morales@alleghenycounty.us', initials: 'AM' },
  { id: 'u8', first: 'Sam', last: 'Kowalczyk', org: 'CYF', email: 'sam.kowalczyk@alleghenycounty.us', initials: 'SK' }
];
export const ME = 'u1';

const FIRST = ['Aaliyah', 'Aaron', 'Abdi', 'Alicia', 'Amara', 'Andre', 'Angela', 'Brandon', 'Brianna', 'Carlos', 'Carmen', 'Chloe', 'Christopher', 'Danielle', 'DeShawn', 'Destiny', 'Diego', 'Elena', 'Emily', 'Eric', 'Fatima', 'Gabriel', 'Hannah', 'Hector', 'Imani', 'Isaiah', 'Jacob', 'Jamal', 'Jasmine', 'Jennifer', 'Jordan', 'Joseph', 'Kayla', 'Keith', 'Kevin', 'Lamar', 'Latoya', 'Lauren', 'Lena', 'Malik', 'Mariah', 'Mark', 'Megan', 'Mei', 'Michael', 'Nathan', 'Nia', 'Omar', 'Paul', 'Rachel', 'Raymond', 'Rosa', 'Ryan', 'Sabrina', 'Samantha', 'Shawn', 'Sophia', 'Tamika', 'Terrence', 'Tiffany', 'Trevor', 'Valerie', 'Victor', 'Wanda', 'Xavier', 'Yolanda', 'Zoe'];
const LAST = ['Adams', 'Alvarez', 'Bennett', 'Brooks', 'Campbell', 'Chen', 'Coleman', 'Cruz', 'Davis', 'Dixon', 'Edwards', 'Fischer', 'Foster', 'Garcia', 'Gibson', 'Graham', 'Hayes', 'Henderson', 'Hughes', 'Jackson', 'Jenkins', 'Kaminski', 'Kim', 'Kowalski', 'Lopez', 'Marshall', 'Mitchell', 'Moore', 'Murphy', 'Nguyen', 'Novak', 'Owens', 'Patel', 'Perry', 'Ramirez', 'Reed', 'Reyes', 'Robinson', 'Russell', 'Sanders', 'Shrestha', 'Simmons', 'Stewart', 'Sullivan', 'Thomas', 'Tran', 'Turner', 'Walker', 'Washington', 'Williams', 'Wright', 'Yusuf', 'Zielinski'];

// [street names, municipality, zip, school district, ward or null]
const PLACES = [
  { city: 'Pittsburgh', zip: '15219', area: 'Hill District', school: 'Pittsburgh School District', ward: 'Ward 5, District 6 (Pittsburgh)', streets: ['Centre Ave', 'Wylie Ave', 'Webster Ave', 'Bedford Ave'] },
  { city: 'Pittsburgh', zip: '15212', area: 'Northside', school: 'Pittsburgh School District', ward: 'Ward 25, District 1 (Pittsburgh)', streets: ['E Ohio St', 'Perrysville Ave', 'Brighton Rd', 'Federal St'] },
  { city: 'Pittsburgh', zip: '15206', area: 'East Liberty', school: 'Pittsburgh School District', ward: 'Ward 11, District 9 (Pittsburgh)', streets: ['Penn Ave', 'Negley Ave', 'Broad St', 'Larimer Ave'] },
  { city: 'Pittsburgh', zip: '15207', area: 'Hazelwood', school: 'Pittsburgh School District', ward: 'Ward 15, District 5 (Pittsburgh)', streets: ['Second Ave', 'Hazelwood Ave', 'Glen Caladh St'] },
  { city: 'Pittsburgh', zip: '15210', area: 'Carrick', school: 'Pittsburgh School District', ward: 'Ward 29, District 4 (Pittsburgh)', streets: ['Brownsville Rd', 'Spencer Ave', 'Overbrook Blvd'] },
  { city: 'Pittsburgh', zip: '15208', area: 'Homewood', school: 'Pittsburgh School District', ward: 'Ward 13, District 9 (Pittsburgh)', streets: ['Frankstown Ave', 'Hamilton Ave', 'N Homewood Ave'] },
  { city: 'Pittsburgh', zip: '15204', area: 'Sheraden', school: 'Pittsburgh School District', ward: 'Ward 20, District 2 (Pittsburgh)', streets: ['Chartiers Ave', 'Sheraden Blvd', 'Hillsboro St'] },
  { city: 'McKeesport', zip: '15132', school: 'McKeesport Area School District', ward: 'City of McKeesport', streets: ['Fifth Ave', 'Walnut St', 'Lysle Blvd', 'Versailles Ave'] },
  { city: 'Wilkinsburg', zip: '15221', school: 'Wilkinsburg School District', ward: 'Wilkinsburg Borough', streets: ['Penn Ave', 'Wood St', 'Hill Ave', 'Rebecca Ave'] },
  { city: 'Penn Hills', zip: '15235', school: 'Penn Hills School District', ward: 'Penn Hills Township', streets: ['Frankstown Rd', 'Rodi Rd', 'Jefferson Rd'] },
  { city: 'McKees Rocks', zip: '15136', school: 'Sto-Rox School District', ward: 'McKees Rocks Borough', streets: ['Broadway Ave', 'Chartiers Ave', 'Island Ave'] },
  { city: 'Homestead', zip: '15120', school: 'Steel Valley School District', ward: 'Homestead Borough', streets: ['E 8th Ave', 'W 9th Ave', 'Amity St'] },
  { city: 'Clairton', zip: '15025', school: 'Clairton City School District', ward: 'City of Clairton', streets: ['St Clair Ave', 'Miller Ave', 'N State St'] },
  { city: 'Braddock', zip: '15104', school: 'Woodland Hills School District', ward: 'Braddock Borough', streets: ['Braddock Ave', 'Talbot Ave', 'Library St'] }
];

export const PROVIDERS = [
  { name: 'Mercy', facilities: ['Mercy Behavioral Health', '2nd Ave Commons'], address: '1200 Reedsdale Street, Pittsburgh, PA 15233', phone: '(412) 555-0110', email: 'intake@mercy.example.org' },
  { name: 'UPMC', facilities: ['UPMC Western Psychiatric Hospital', 'UPMC Mercy'], address: '3811 O\'Hara Street, Pittsburgh, PA 15213', phone: '(412) 555-0124', email: 'referrals@upmc.example.org' },
  { name: 'P.O.W.E.R.', facilities: ['P.O.W.E.R. Outpatient', 'Wood Street Commons'], address: '7445 Church Street, Swissvale, PA 15218', phone: '(412) 555-0137', email: 'office@power.example.org' },
  { name: 'Revival Inc', facilities: ['Revival Inc Hill District', 'Allegheny County Jail'], address: '2032 Centre Avenue, Pittsburgh, PA 15219', phone: '(412) 555-0141', email: 'info@revival.example.org' },
  { name: 'Three Rivers Family Services', facilities: ['Three Rivers Family Center'], address: '615 Penn Avenue, Wilkinsburg, PA 15221', phone: '(412) 555-0158', email: 'help@threerivers.example.org' },
  { name: 'Northside Community Health', facilities: ['Northside Community Health Clinic'], address: '1100 Federal Street, Pittsburgh, PA 15212', phone: '(412) 555-0162', email: 'frontdesk@northside.example.org' },
  { name: 'Steel Valley Recovery Center', facilities: ['Steel Valley Recovery Center'], address: '500 Fifth Avenue, McKeesport, PA 15132', phone: '(412) 555-0179', email: 'admissions@steelvalley.example.org' }
];

const SERVICE_CATALOG = [
  { service: 'D & A Service Plan Announcement', area: 'Substance Use Disorder Services (All)', program: 'Child Welfare', rate: 30, rateType: 'Per Diem', dx: 'Code 305' },
  { service: 'Mobile Crisis, Team Delivered', area: 'Mental Health Services (All)', program: 'Justice Involvement', rate: 45, rateType: 'Per Unit', dx: 'Code 296' },
  { service: 'Telephone Crisis', area: 'Substance Use Disorder Services (All)', program: 'Behavioral Health', rate: 25, rateType: 'Per Call', dx: 'Code 305' },
  { service: 'Administrative Management', area: 'Mental Health Services (All)', program: 'Family Strengthening', rate: 30, rateType: 'Per Diem', dx: 'Code 309' },
  { service: 'Individual Psychotherapy - 75 - 80 minute sessions (OPDA)', area: 'Mental Health Services (All)', program: 'Developmental Support', rate: 55, rateType: 'Per Session', dx: 'Code 296' },
  { service: 'Outpatient Drug and Alcohol Counseling', area: 'Substance Use Disorder Services (All)', program: 'Behavioral Health', rate: 40, rateType: 'Per Session', dx: 'Code 304' },
  { service: 'Recovery Housing', area: 'Housing Services', program: 'Housing', rate: 35, rateType: 'Per Diem', dx: 'Code 305' },
  { service: 'Case Management, Blended', area: 'Mental Health Services (All)', program: 'Behavioral Health', rate: 32, rateType: 'Per Unit', dx: 'Code 300' },
  { service: 'Family Group Decision Making', area: 'Children and Family Services', program: 'Child Welfare', rate: 60, rateType: 'Per Session', dx: 'Code 309' },
  { service: 'Peer Support Services', area: 'Mental Health Services (All)', program: 'Behavioral Health', rate: 22, rateType: 'Per Unit', dx: 'Code 300' },
  { service: 'Rapid Rehousing', area: 'Housing Services', program: 'Housing', rate: 40, rateType: 'Per Diem', dx: 'Code 412' }
];

const PROGRAMS = [
  ['Supplemental Nutrition Assistance Program (SNAP)', 0.55],
  ['Medicaid', 0.6],
  ['Supplemental Security Income (SSI)', 0.2],
  ['Temporary Assistance for Needy Families (TANF)', 0.15],
  ['Allegheny GO', 0.3],
  ['Low Income Home Energy Assistance Program (LIHEAP)', 0.2],
  ['Women, Infants and Children (WIC)', 0.1],
  ['Housing Choice Voucher', 0.12]
];

const CHARGES = ['Simple Assault', 'Arrest For Violation of Order (PFA)', 'Harassment', 'Robbery of Motor Vehicle', 'Burglary - Not Adapted for Overnight Accommodation', 'Retail Theft', 'Possession of Controlled Substance', 'DUI: General Impairment', 'Terroristic Threats', 'Criminal Mischief'];
const DV_CHARGES = ['Simple Assault', 'Arrest For Violation of Order (PFA)', 'Harassment', 'Terroristic Threats'];
const AGENCIES = ['Pittsburgh Police Department', 'McKeesport Police Department', 'Allegheny County Police', 'Wilkinsburg Police Department', 'Penn Hills Police Department'];
const DISPOSITIONS = ['Sent to Common Pleas', 'Held for Court', 'Withdrawn', 'Guilty Plea', 'Dismissed'];
const NEXT_EVENTS = ['Preliminary Hearing', 'Formal Arraignment', 'Status Conference', 'Trial', 'Sentencing'];
const PROBATION_UNITS = ['McKeesport', 'Hill District', 'Northside', 'Wilkinsburg', 'East End'];
const OFFICERS = ['Jam, James', 'Patel, Reena', 'Rossi, Michael', 'Owens, Tanya', 'Kim, David'];

// ------------------------------------------------------------------ note and action templates
const NOTE_TEMPLATES = {
  IPV: [
    "DA's office confirmed they will not close out the case until the individual completes BIP. Waiting on DHS for BIP attendance updates.",
    'Probation officer ({officer}) reports {first} attended {n} of 4 BIP sessions this month. One absence was excused.',
    'Protection from Abuse order extended through {month}. Victim services has the updated copy.',
    'Pretrial services confirmed the address on file. No contact condition remains in place.',
    'Case conference held with WCS, probation and DHS. Next review set for {month}.'
  ],
  ACGO: [
    'SNAP recertification is due within six weeks. Confirm the renewal packet went to the {street} address.',
    'Benefits screen completed. Eligible for LIHEAP; referred to the energy assistance line.',
    'Employer letter for the Medicaid renewal is still missing. {first} will drop it off at the CAO.',
    'Emergency contact updated in ACGO.'
  ],
  'Allegheny Go': [
    'Allegheny GO card reported lost. Replacement requested.',
    'Enrollment renewed for another year. No changes to household size.',
    '{first} asked whether the Allegheny GO discount covers the incline. Sent the fare chart.'
  ],
  'CYF QA': [
    'Family connected with Hello Baby. First home visit scheduled for next {weekday}.',
    'QA review flagged a missing safety assessment on the last visit. Supervisor notified.',
    'Children now enrolled at the same school. Transportation plan confirmed with {school}.',
    'Family Group Decision Making meeting set. {provider} will facilitate.'
  ],
  'Wellness Checks': [
    'Wellness check by phone. {first} is out of medication; pharmacy refill requested.',
    'Wellness check completed. {first} reports stable housing and regular outpatient appointments at {provider}.',
    '{first} asked about rental assistance. Gave the Allegheny Link number and logged the call.',
    'No answer on two attempts. Left a voicemail and texted the callback number.'
  ],
  PERSONAL: [
    '{first} prefers calls after 3pm. Text first; the voicemail box is often full.',
    'Interpreter ({language}) needed for every call. The language line works best.',
    'Check in after the housing inspection on {date}.',
    'Ask {provider} whether the intake paperwork arrived.'
  ]
};
const ACTION_TEMPLATES = {
  IPV: ['Call PO and fill them in on updates', 'Request BIP attendance records from WCS', 'Alert Child Welfare about the IPV situation and encourage messaging', 'Confirm the PFA order was served', 'Remind {first} of the {date} court date'],
  ACGO: ['Confirm the SNAP renewal packet was received', 'Send the LIHEAP application checklist to {first}', 'Follow up on the Medicaid employer letter', 'Update the emergency contact in ACGO'],
  'Allegheny Go': ['Confirm the replacement Allegheny GO card arrived', 'File the renewed enrollment confirmation'],
  'CYF QA': ['Connect the family to Hello Baby', 'Add the missing safety assessment to the visit record', 'Check the transportation plan with {school}'],
  'Wellness Checks': ['Confirm the prescription was picked up', 'Schedule the next wellness check by phone', 'Follow up on the Allegheny Link rental assistance call'],
  PERSONAL: ['Review updated summary from meeting, collect client info and email it out to the team', 'Book an interpreter ({language}) for the next call', 'Update the mailing address once the move is final', 'Ask {provider} whether the intake paperwork arrived']
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
function fill(tpl, c, extra) {
  return tpl
    .replace(/\{first\}/g, c.household ? 'The family' : c.first)
    .replace(/\{officer\}/g, (c.justice && c.justice.probation && c.justice.probation.officer) || pick(OFFICERS))
    .replace(/\{n\}/g, String(int(2, 3)))
    .replace(/\{month\}/g, MONTHS[(today().getMonth() + int(1, 4)) % 12])
    .replace(/\{weekday\}/g, pick(WEEKDAYS))
    .replace(/\{street\}/g, c.address.street.replace(/^\d+\s/, ''))
    .replace(/\{school\}/g, c.address.school)
    .replace(/\{language\}/g, c.language === 'English' ? 'Spanish' : c.language)
    .replace(/\{provider\}/g, (c.services[0] && c.services[0].grouped[0]) || 'Mercy')
    .replace(/\{date\}/g, (extra && extra.date) || toUS(addDays(today(), int(5, 40))));
}

// ------------------------------------------------------------------ builders
function makeEnrollments(t, forced) {
  const list = [];
  PROGRAMS.forEach(([name, p]) => {
    if (!(forced ? forced.indexOf(name) >= 0 : chance(p))) return;
    const start = addDays(t, -int(60, 900));
    const end = chance(0.15) ? addDays(t, -int(10, 200)) : chance(0.2) ? addDays(t, int(5, 55)) : addDays(t, int(120, 900));
    const asOfDays = chance(0.2) ? int(91, 300) : chance(0.3) ? int(31, 60) : int(0, 20);
    const asOf = addDays(t, -asOfDays);
    let kind = 'active', status = 'Active';
    if (end < t) { kind = 'inactive'; status = 'Inactive'; }
    else if (asOfDays > 90) { kind = 'presumed'; status = 'Presumed Inactive'; }
    else if ((end - t) / 864e5 <= 60) { kind = 'ending'; status = 'Ending soon'; }
    const pct = Math.max(0, Math.min(100, Math.round(((t - start) / (end - start)) * 100)));
    const ago = asOfDays === 0 ? 'Today' : asOfDays < 14 ? asOfDays + ' days ago' : Math.round(asOfDays / 7) + ' weeks ago';
    list.push({ name, kind, status, pct: kind === 'inactive' ? 100 : pct, start: toUS(start), end: toUS(end), asOf: 'As of ' + toUS(asOf) + ' | ' + ago, stale: asOfDays > 30 && kind !== 'inactive' });
  });
  return list;
}

function makeServices(t, count) {
  const chosen = sample(SERVICE_CATALOG, count);
  const services = [], instances = [];
  chosen.forEach((cat, i) => {
    const provs = sample(PROVIDERS, int(1, 3));
    const first = addDays(t, -int(200, 4000));
    const last = addDays(t, -int(5, 180));
    const svc = { id: 's' + (i + 1), service: cat.service, area: chance(0.12) ? '' : cat.area, program: cat.program, first: toUS(first), last: toUS(last), added: toUS(first), all: [provs[0].name], grouped: provs.map((p) => p.name) };
    services.push(svc);
    provs.forEach((p) => {
      const n = int(1, 2);
      for (let k = 0; k < n; k++) {
        const units = int(1, 24);
        const iFirst = addDays(first, int(0, Math.max(1, Math.round((last - first) / 864e5) - 30)));
        instances.push({
          service: cat.service, provider: p.name, facility: pick(p.facilities), program: cat.program.replace('Family Strengthening', 'Behavioral Health').replace('Developmental Support', 'Behavioral Health').replace('Justice Involvement', 'Justice').replace('Child Welfare', 'Behavioral Health'),
          dx: cat.dx, units: String(units), rate: '$' + cat.rate.toFixed(2), rateType: cat.rateType, cost: '$' + (units * cat.rate).toFixed(2),
          status: weighted([['Paid', 5], ['Active', 3], ['Pending', 1], ['Denied', 1]]), first: toUS(iFirst), last: toUS(addDays(iFirst, int(1, 300)))
        });
      }
    });
  });
  return { services, instances };
}

function makeJustice(t, c, dvDefendant) {
  const cases = [];
  const nCases = dvDefendant ? int(2, 5) : int(1, 3);
  for (let i = 0; i < nCases; i++) {
    const dv = dvDefendant && chance(0.75);
    const date = addDays(t, -int(60, 1600));
    cases.push({ otn: 'R' + digits(10), date: toUS(date), agency: pick(AGENCIES), filed: toUS(addDays(date, int(0, 2))), charge: dv ? pick(DV_CHARGES) : pick(CHARGES), disp: pick(DISPOSITIONS), next: pick(NEXT_EVENTS), nextDate: toUS(addDays(date, int(14, 60))), dv });
  }
  const incarcerated = chance(dvDefendant ? 0.6 : 0.3);
  const incarceration = [];
  if (incarcerated) {
    const kinds = ['housing', 'hold', 'prison'];
    const titles = { housing: 'Community residential placement', hold: 'Behavioral health hold', prison: 'State sentence' };
    let cursor = addDays(t, -int(30, 120));
    const groups = {};
    for (let i = 0; i < int(2, 5); i++) {
      const kind = pick(kinds);
      const months = kind === 'hold' ? 1 : int(2, 18);
      const end = cursor;
      const start = addDays(end, -months * 30);
      const label = String(start.getFullYear());
      (groups[label] = groups[label] || []).push({ id: c.id + '-i' + i, title: titles[kind], kind, range: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' to ' + end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), dur: months + (months === 1 ? ' month' : ' months'), facility: kind === 'prison' ? '[State correctional institution]' : kind === 'hold' ? '[Hospital name]' : '[Community corrections center]' });
      cursor = addDays(start, -int(60, 500));
    }
    Object.keys(groups).sort().reverse().forEach((k) => incarceration.push({ label: k, items: groups[k] }));
  }
  const totalMonths = incarceration.reduce((s, g) => s + g.items.reduce((a, e) => a + parseInt(e.dur, 10), 0), 0);
  const probation = chance(0.7) ? { status: chance(0.8) ? 'Active' : 'Closed', unit: pick(PROBATION_UNITS), officer: pick(OFFICERS), lastIntake: toUS(addDays(t, -int(30, 600))), lastActive: toUS(addDays(t, -int(1, 60))) } : null;
  const dvCount = cases.filter((x) => x.dv).length;
  return {
    highRisk: dvDefendant ? sample(['Repeat Offender', 'Serious Charge', 'Recidivism Case'], int(1, 3)) : (chance(0.3) ? ['Repeat Offender'] : []),
    jail: incarcerated && chance(0.5) ? { doc: digits(10), docket: digits(10), pod: int(1, 9) + pick(['A', 'B', 'C']), podLevel: pick(['General', 'Medical', 'Max']) } : null,
    involvement: { activeDV: dvCount > 0 && chance(0.7), adult: cases.length + int(0, 6), dvFilings: dvCount, convictions: int(0, Math.max(1, Math.floor(cases.length / 2))) },
    bip: dvDefendant ? weighted([['Active', 3], ['Completed', 1], ['Referred', 1]]) : null,
    cases, probation, incarceration,
    custody: { total: totalMonths >= 12 ? Math.floor(totalMonths / 12) + ' yrs ' + (totalMonths % 12) + ' mo' : totalMonths + ' mo', events: incarceration.reduce((s, g) => s + g.items.length, 0), facilities: Math.min(incarceration.reduce((s, g) => s + g.items.length, 0), int(1, 4)) }
  };
}

function makeNotes(t, c, idBase) {
  const notes = [];
  const used = new Set();
  const pools = c.colabs.concat(['PERSONAL']);
  const n = c.id === 'c1' ? 0 : int(2, 9);
  for (let i = 0; i < n; i++) {
    const tag = pick(pools);
    const key = tag === 'PERSONAL' ? 'PERSONAL' : tag;
    const options = NOTE_TEMPLATES[key].filter((x) => !used.has(x));
    if (!options.length) continue;
    const tpl = pick(options); used.add(tpl);
    const date = addDays(t, -int(1, 200));
    notes.push({ id: idBase + i, clientId: c.id, date: toUS(date), edited: chance(0.2), restricted: tag === 'IPV' || tag === 'PERSONAL' ? chance(0.7) : chance(0.2), tag: tag === 'PERSONAL' ? 'PERSONAL' : COLABS.find((x) => x.id === tag).tag, author: chance(0.78) ? ME : pick(STAFF.slice(1)).id, text: fill(tpl, c) });
  }
  return notes;
}
function makeActions(t, c, idBase) {
  const out = [];
  const used = new Set();
  const pools = c.colabs.concat(['PERSONAL']);
  const n = c.id === 'c1' ? 0 : int(1, 6);
  for (let i = 0; i < n; i++) {
    const tag = pick(pools);
    const options = ACTION_TEMPLATES[tag === 'PERSONAL' ? 'PERSONAL' : tag].filter((x) => !used.has(x));
    if (!options.length) continue;
    const tpl = pick(options); used.add(tpl);
    const done = chance(0.35);
    const due = done ? addDays(t, -int(1, 90)) : addDays(t, int(-20, 35));
    out.push({ id: idBase + i, clientId: c.id, tag: tag === 'PERSONAL' ? 'PERSONAL' : COLABS.find((x) => x.id === tag).tag, text: fill(tpl, c), assignee: chance(0.72) ? ME : pick(STAFF.slice(1)).id, due: toISO(due), done, edited: chance(0.15) });
  }
  return out;
}

// ------------------------------------------------------------------ Jimothy Jones: the designed record, kept as drawn
function jimothy(t) {
  const d = (n) => toUS(addDays(t, n));
  const iso = (n) => toISO(addDays(t, n));
  const services = [
    { id: 's1', first: '02/09/2000', last: '07/16/2025', area: 'Substance Use Disorder Services (All)', all: ['Mercy'], grouped: ['Mercy', 'UPMC', 'P.O.W.E.R.', 'Revival Inc'], service: 'D & A Service Plan Announcement', program: 'Child Welfare', added: '02/09/2000' },
    { id: 's2', first: '05/12/2008', last: '06/30/2025', area: 'Mental Health Services (All)', all: ['Mercy'], grouped: ['Mercy'], service: 'Mobile Crisis, Team Delivered', program: 'Justice Involvement', added: '05/12/2008' },
    { id: 's3', first: '11/03/2011', last: '05/19/2025', area: 'Substance Use Disorder Services (All)', all: ['P.O.W.E.R.'], grouped: ['P.O.W.E.R.'], service: 'Telephone Crisis', program: 'Behavioral Health', added: '11/03/2011' },
    { id: 's4', first: '01/27/2014', last: '04/02/2025', area: 'Mental Health Services (All)', all: ['UPMC'], grouped: ['UPMC'], service: 'Administrative Management', program: 'Family Strengthening', added: '01/27/2014' },
    { id: 's5', first: '08/15/2016', last: '03/11/2025', area: '', all: ['Mercy'], grouped: ['Mercy', 'UPMC', 'P.O.W.E.R.', 'Revival Inc'], service: 'Individual Psychotherapy - 75 - 80 minute sessions (OPDA)', program: 'Developmental Support', added: '08/15/2016' },
    { id: 's6', first: '02/02/2019', last: '01/20/2025', area: 'Mental Health Services (All)', all: ['UPMC'], grouped: ['Mercy', 'UPMC', 'P.O.W.E.R.', 'Revival Inc'], service: 'Recovery Housing', program: 'Housing', added: '02/02/2019' },
    { id: 's7', first: '09/09/2021', last: '12/04/2024', area: 'Substance Use Disorder Services (All)', all: ['Revival Inc'], grouped: ['Revival Inc'], service: 'Peer Support Services', program: 'Physical Health', added: '09/09/2021' }
  ];
  const mk = (o) => Object.assign({ program: 'Behavioral Health', dx: 'Code 305', facility: '2nd Ave Commons', status: 'Active', rate: '$30.00', rateType: 'Per Diem' }, o);
  const instances = [
    mk({ service: 'D & A Service Plan Announcement', provider: 'UPMC', facility: 'UPMC Western Psychiatric Hospital', first: '02/09/2000', last: '07/16/2025', units: '2', cost: '$60.00' }),
    mk({ service: 'D & A Service Plan Announcement', provider: 'Mercy', first: '03/14/2004', last: '05/02/2025', units: '5', cost: '$150.00' }),
    mk({ service: 'D & A Service Plan Announcement', provider: 'P.O.W.E.R.', program: 'Housing', dx: 'Code 412', facility: 'Wood Street Commons', first: '06/01/2010', last: '11/18/2024', units: '12', status: 'Paid', rate: '$45.00', rateType: 'Per Unit', cost: '$540.00' }),
    mk({ service: 'D & A Service Plan Announcement', provider: 'Revival Inc', program: 'Justice', facility: 'Allegheny County Jail', first: '09/22/2013', last: '08/09/2024', units: '3', status: 'Denied', cost: '$90.00' }),
    mk({ service: 'Mobile Crisis, Team Delivered', provider: 'Mercy', first: '05/12/2008', last: '06/30/2025', units: '4', status: 'Paid', rate: '$45.00', rateType: 'Per Unit', cost: '$180.00' }),
    mk({ service: 'Telephone Crisis', provider: 'P.O.W.E.R.', program: 'Justice', facility: 'P.O.W.E.R. Outpatient', first: '11/03/2011', last: '05/19/2025', units: '4', status: 'Paid', rate: '$25.00', rateType: 'Per Call', cost: '$100.00' }),
    mk({ service: 'Administrative Management', provider: 'UPMC', dx: 'Code 309', facility: 'UPMC Mercy', first: '01/27/2014', last: '04/02/2025', units: '5', cost: '$150.00' }),
    mk({ service: 'Individual Psychotherapy - 75 - 80 minute sessions (OPDA)', provider: 'Mercy', dx: 'Code 296', facility: 'Mercy Behavioral Health', first: '08/15/2016', last: '03/11/2025', units: '6', status: 'Paid', rate: '$55.00', rateType: 'Per Session', cost: '$330.00' }),
    mk({ service: 'Recovery Housing', provider: 'P.O.W.E.R.', program: 'Housing', facility: 'Wood Street Commons', first: '02/02/2019', last: '01/20/2025', units: '8', status: 'Paid', rate: '$35.00', cost: '$280.00' }),
    mk({ service: 'Peer Support Services', provider: 'Revival Inc', facility: 'Revival Inc Hill District', first: '09/09/2021', last: '12/04/2024', units: '10', status: 'Pending', rate: '$22.00', rateType: 'Per Unit', cost: '$220.00' })
  ];
  const justice = {
    highRisk: ['Repeat Offender', 'Serious Charge', 'Recidivism Case'],
    jail: { doc: '0987654321', docket: '0987654321', pod: '14B', podLevel: 'ABCXYZ' },
    involvement: { activeDV: true, adult: 20, dvFilings: 19, convictions: 4 },
    bip: 'Active',
    cases: [
      { otn: 'R1234567890', date: '02/09/2022', agency: 'Pittsburgh Police Department', filed: '02/09/2022', charge: 'Robbery of Motor Vehicle', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '03/02/2022', dv: false },
      { otn: 'R1234567891', date: '01/14/2022', agency: 'Pittsburgh Police Department', filed: '01/15/2022', charge: 'Arrest For Violation of Order (PFA)', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '02/04/2022', dv: true },
      { otn: 'R1234567892', date: '10/03/2021', agency: 'Pittsburgh Police Department', filed: '10/04/2021', charge: 'Burglary - Not Adapted for Overnight Accommodation', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '10/25/2021', dv: true },
      { otn: 'R1234567893', date: '06/22/2021', agency: 'Pittsburgh Police Department', filed: '06/22/2021', charge: 'Arrest For Violation of Order (PFA)', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '07/13/2021', dv: true }
    ],
    probation: { status: 'Active', unit: 'McKeesport', officer: 'Jam, James', lastIntake: '09/09/2025', lastActive: '09/09/2025' },
    incarceration: [
      { label: '2023–2026', items: [
        { id: 'i1', title: 'Community residential placement', kind: 'housing', range: 'Dec 16, 2024 to Jul 2026', dur: '19 months', facility: '[Community corrections center]' },
        { id: 'i2', title: 'Behavioral health hold', kind: 'hold', range: 'Mar 3, 2024 to Apr 2, 2024', dur: '1 month', facility: '[Hospital name]' },
        { id: 'i3', title: 'State sentence', kind: 'prison', range: 'Jan 9, 2023 to Feb 20, 2024', dur: '13 months', facility: '[State correctional institution]' }
      ] },
      { label: '2022', items: [
        { id: 'i4', title: 'Community residential placement', kind: 'housing', range: 'Jun 1, 2022 to Dec 15, 2022', dur: '6 months', facility: '[Community corrections center]' },
        { id: 'i5', title: 'Community residential placement', kind: 'housing', range: 'Feb 7, 2022 to May 30, 2022', dur: '4 months', facility: '[Community corrections center]' }
      ] }
    ],
    custody: { total: '17 yrs 5 mo', events: 19, facilities: 12 }
  };
  const client = {
    id: 'c1', first: 'Jimothy', last: 'Jones', dob: '02/09/2000', gender: 'Male', legalSex: 'Male', race: 'White', ethnicity: 'Not Hispanic/Latinx', marital: 'Never Married/Single', living: 'With family', language: 'English',
    mci: '1234567890', ssn4: '1234', dhs: '470106828', dpw: '123456778890', phone: '(412) 123-4567', email: 'thisisafakeemail@gmail.com',
    address: { street: '950 Second Avenue', city: 'Pittsburgh', state: 'PA', zip: '15219', school: 'Pittsburgh School District', ward: 'Ward 15, District 8 (Pittsburgh)', facility: 'Allegheny County Jail [facility or building name]' },
    colabs: ['IPV', 'ACGO'], starred: 'IPV', favorited: d(-300),
    enrollments: null, services, instances, justice
  };
  const notes = [
    { text: "DA's office confirmed that they will not close out the case until the individual completes BIP. WCS confirmed connecting with the DA's Office about coordinating around this case. Pending are updates needed from DHS about the individual's BIP attendance and engagement.", tag: 'PERSONAL', restricted: true, edited: true, days: -7 },
    { text: "WCS confirmed it is coordinating with the DA's Office on this case. Next step is a joint call before the next case conference.", tag: 'WELLNESS CHECKS', restricted: false, days: -14 },
    { text: 'Probation officer (Jam, James) reports the client attended 3 of 4 BIP sessions this month. One absence was excused.', tag: 'IPV', restricted: true, days: -21 },
    { text: 'SNAP recertification is due within six weeks. Caseworker to confirm the renewal packet went to the Second Avenue address.', tag: 'ACGO', restricted: false, days: -33 },
    { text: 'Mercy outpatient team asked to be added to the next case conference invite.', tag: 'IPV', restricted: false, days: -41 },
    { text: 'Client prefers calls after 3pm. Text first; the voicemail box is often full.', tag: 'PERSONAL', restricted: true, edited: true, days: -54 },
    { text: 'Protection from Abuse order extended through March. Victim services has the updated copy.', tag: 'IPV', restricted: false, days: -67 },
    { text: 'Pretrial services confirmed the address on file. No contact condition remains in place.', tag: 'IPV', restricted: true, days: -81 },
    { text: 'Allegheny GO enrollment confirmed. Card mailed to the Second Avenue address.', tag: 'ACGO', restricted: false, days: -95 },
    { text: 'Wellness check completed. Client reports stable housing and regular attendance at outpatient appointments.', tag: 'WELLNESS CHECKS', restricted: false, days: -109 },
    { text: 'Follow up on whether the employer letter for the Medicaid renewal was submitted.', tag: 'PERSONAL', restricted: true, days: -125 },
    { text: 'Case conference held with WCS, probation and DHS. Next review set for September.', tag: 'IPV', restricted: false, days: -137 }
  ].map((n, i) => ({ id: 'n1-' + i, clientId: 'c1', date: d(n.days), edited: !!n.edited, restricted: n.restricted, tag: n.tag, author: ME, text: n.text }));
  const actions = [
    ['Review updated summary from meeting, collect client info and email it out to the team', 'IPV', -5, false, true],
    ['Call PO and fill them in on updates', 'WELLNESS CHECKS', -4, false],
    ['Pretrial to contact defendant about no contact and confirm his address; DHS will reach out to CYF about messaging to the family', 'PERSONAL', 10, false],
    ['Confirm the SNAP renewal packet was received', 'ACGO', 16, false],
    ['Request September and October BIP attendance records from WCS', 'PERSONAL', 6, false],
    ['Share the probation officer’s contact details with the housing navigator', 'IPV', -25, true],
    ['Update the client’s emergency contact in ACGO', 'ACGO', -35, true]
  ].map((a, i) => ({ id: 'a1-' + i, clientId: 'c1', text: a[0], tag: a[1], due: iso(a[2]), done: a[3], edited: !!a[4], assignee: ME }));
  return { client, notes, actions };
}

// ------------------------------------------------------------------ the whole dataset
export function buildSeed() {
  rand = mulberry32(20261104);
  const t = today();
  const clients = [], notes = [], actions = [];
  const j = jimothy(t);
  const e = (name, kind, status, pct, asOfDays, endDays, stale) => ({ name, kind, status, pct, start: toUS(addDays(t, -460)), end: toUS(addDays(t, endDays)), asOf: 'As of ' + toUS(addDays(t, -asOfDays)) + (asOfDays === 0 ? ' | Today' : asOfDays >= 14 ? ' | ' + Math.round(asOfDays / 7) + ' weeks ago' : ''), stale: !!stale });
  j.client.enrollments = [
    e('Supplemental Nutrition Assistance Program (SNAP)', 'active', 'Active', 62, 42, 270, true),
    e('Supplemental Security Income (SSI)', 'active', 'Active', 62, 5, 270),
    e('Temporary Assistance for Needy Families (TANF)', 'presumed', 'Presumed Inactive', 62, 120, 270),
    e('Medicaid', 'ending', 'Ending soon', 92, 5, 40),
    e('Allegheny GO', 'active', 'Active', 62, 0, 270),
    e('[Program Name that is currently inactive]', 'inactive', 'Inactive', 100, 200, -30)
  ];
  clients.push(j.client); notes.push(...j.notes); actions.push(...j.actions);

  const usedNames = new Set(['Jimothy Jones']);
  const total = 64;
  for (let i = 2; i <= total; i++) {
    const household = chance(0.12);
    let first = pick(FIRST), last = pick(LAST);
    while (usedNames.has(first + ' ' + last)) { first = pick(FIRST); last = pick(LAST); }
    usedNames.add(first + ' ' + last);
    const place = pick(PLACES);
    const age = household ? 0 : weighted([[int(18, 25), 2], [int(26, 45), 5], [int(46, 64), 3], [int(65, 85), 1], [int(12, 17), 1]]);
    const dob = household ? '' : toUS(new Date(t.getFullYear() - age, int(0, 11), int(1, 28)));
    const gender = weighted([['Female', 50], ['Male', 47], ['Nonbinary', 3]]);
    const colabs = sample(COLABS.map((x) => x.id), weighted([[1, 6], [2, 3], [3, 1]]));
    const language = weighted([['English', 84], ['Spanish', 7], ['Nepali', 3], ['Arabic', 3], ['Swahili', 3]]);
    const hasPhone = chance(0.88);
    const c = {
      id: 'c' + i,
      first: household ? last : first, last: household ? 'Household' : last, household,
      members: household ? [first + ' ' + last, pick(FIRST) + ' ' + last, pick(FIRST) + ' ' + last].slice(0, int(2, 3)) : null,
      dob, gender: household ? '' : gender, legalSex: household ? '' : (gender === 'Nonbinary' ? pick(['Female', 'Male']) : gender),
      race: weighted([['White', 52], ['Black or African American', 35], ['Asian', 5], ['Two or more races', 5], ['Unknown', 3]]),
      ethnicity: weighted([['Not Hispanic/Latinx', 92], ['Hispanic/Latinx', 8]]),
      marital: age < 18 ? 'Never Married/Single' : weighted([['Never Married/Single', 5], ['Married', 2], ['Divorced', 2], ['Separated', 1], ['Widowed', age > 60 ? 2 : 0.2]]),
      living: weighted([['Independent', 4], ['With family', 4], ['Shelter', 1], ['Supported housing', 1], ['Unhoused', 0.6]]),
      language,
      mci: 'R' + digits(10), ssn4: digits(4), dhs: '47' + digits(7), dpw: '1' + digits(11),
      phone: hasPhone ? '(412) ' + int(200, 999) + '-' + digits(4) : '',
      email: chance(0.7) ? (first + '.' + last).toLowerCase().replace(/[^a-z.]/g, '') + int(1, 99) + '@example.com' : '',
      address: { street: int(10, 4999) + ' ' + pick(place.streets), city: place.city, state: 'PA', zip: place.zip, school: place.school, ward: place.ward, facility: null },
      colabs,
      starred: null, favorited: ''
    };
    if (chance(0.42)) { c.starred = chance(0.45) ? 'private' : pick(colabs); c.favorited = toUS(addDays(t, -int(1, 420))); }
    const svc = makeServices(t, int(2, 7));
    c.services = svc.services; c.instances = svc.instances;
    c.enrollments = makeEnrollments(t);
    const ipv = colabs.indexOf('IPV') >= 0;
    const dvDefendant = ipv && chance(0.6) && !household;
    c.justice = dvDefendant || (!household && chance(0.22)) ? makeJustice(t, c, dvDefendant) : null;
    if (c.justice && c.justice.jail && chance(0.5)) c.address.facility = 'Allegheny County Jail [facility or building name]';
    clients.push(c);
    notes.push(...makeNotes(t, c, 'n' + i + '-'));
    actions.push(...makeActions(t, c, 'a' + i + '-'));
  }
  return { version: SEED_VERSION, createdAt: toISO(t), clients, notes, actions, reports: [] };
}
