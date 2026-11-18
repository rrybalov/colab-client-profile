// Searching the behavioral health provider directory (data/bh-providers.json) during a contact.
// Pure functions, so the search behaves the same in the browser, the mock API and tests.

// What each ASC need starts the search with. Needs the directory doesn't cover say so instead.
export const NEED_SEARCH = {
  'Mental health services for a child': { services: ['mh-outpatient'], ages: 'children' },
  'Mental health, adult': { services: ['mh-outpatient'], ages: 'adults' },
  'Substance use treatment': { services: ['sud-assessment'], ages: 'adults' },
  Housing: { category: 'housing' }
};
export const NOT_COVERED = {
  'Health coverage (MA or HealthChoices)': 'For coverage questions, Community Care Member Services is in the directory (search “Community Care”).',
  'Food or other benefits': 'Food and benefits aren’t in this directory. 211 covers them.',
  'Physical health care': 'Physical health care isn’t in this directory yet.',
  'Rides to care (MATP)': 'Rides aren’t in this directory. Use the MATP resource.'
};

// The person's age from the intake answer, as a directory age group.
export const ageFromIntake = (age) => (age === 'Child, 0–17' ? 'children' : age === 'Adult, 18–59' ? 'adults' : age === 'Older adult, 60+' ? 'older-adults' : '');
export const AGE_FILTERS = [['', 'Any age'], ['children', 'Children'], ['adolescents', 'Adolescents'], ['transition-age-youth', 'Transition-age youth'], ['adults', 'Adults'], ['older-adults', 'Older adults']];
// Children's services are usually labeled "children" and "adolescents" together, so a child search also matches adolescents' listings.
const AGE_MATCH = { children: ['children'], adolescents: ['adolescents'], 'transition-age-youth': ['transition-age-youth', 'adults'], adults: ['adults'], 'older-adults': ['older-adults', 'adults'] };

export function emptyFilters(seed = {}) {
  return { q: '', category: '', service: '', ages: '', population: '', area: '', inCounty: true, ...seed };
}

// The filters to start with for one interaction: its need, and the age from intake.
export function filtersFor(need, intakeAge) {
  const s = NEED_SEARCH[need] || {};
  return emptyFilters({ service: s.services ? s.services[0] : '', category: s.category || '', ages: ageFromIntake(intakeAge) || s.ages || '' });
}

const has = (hay, needle) => String(hay || '').toLowerCase().indexOf(needle) >= 0;
const addressText = (f) => (f.address ? [f.address.line1, f.address.line2, f.address.city, f.address.zip].join(' ') : '');

function serviceMatches(s, f, labels, cats) {
  if (f.service && s.service !== f.service) return false;
  if (!f.service && f.category && cats[s.service] !== f.category) return false;
  if (f.ages) {
    const want = AGE_MATCH[f.ages] || [f.ages];
    if (s.ageGroups.length && !s.ageGroups.some((g) => want.indexOf(g) >= 0)) return false;
  }
  return true;
}

// Returns matching providers, each with the sites that offer a matching service. Sites a source didn't confirm are
// returned as "unsited" services: the provider offers it, call to find where.
export function searchProviders(dir, filters) {
  if (!dir) return [];
  const f = emptyFilters(filters);
  const q = f.q.trim().toLowerCase();
  const area = f.area.trim().toLowerCase();
  const labels = {}, cats = {};
  dir.vocabularies.services.forEach((s) => { labels[s.id] = s.label; cats[s.id] = s.category; });
  const out = [];
  dir.providers.forEach((p) => {
    if (q) {
      const text = [p.name, p.aka.join(' '), p.operator, p.notes].concat(p.services.map((s) => labels[s.service] + ' ' + (s.notes || ''))).join(' ').toLowerCase();
      if (text.indexOf(q) < 0) return;
    }
    const matched = p.services.filter((s) => serviceMatches(s, f, labels, cats)
      && (!f.population || s.populations.indexOf(f.population) >= 0 || p.serves.populations.indexOf(f.population) >= 0));
    if (!matched.length) return;
    const byFacility = {};
    const unsited = [];
    matched.forEach((s) => {
      if (!s.facilities.length) { unsited.push(s); return; }
      s.facilities.forEach((id) => { (byFacility[id] = byFacility[id] || []).push(s); });
    });
    const sites = p.facilities.filter((fac) => byFacility[fac.id]
      && (!f.inCounty || fac.inAlleghenyCounty)
      && (!area || has(addressText(fac), area) || has(fac.name, area)))
      .map((fac) => ({ facility: fac, services: byFacility[fac.id] }));
    const keepUnsited = unsited.length && !area && (!f.inCounty || p.facilities.some((fac) => fac.inAlleghenyCounty) || !p.facilities.length);
    if (!sites.length && !keepUnsited) return;
    const specific = f.population && matched.some((s) => s.populations.indexOf(f.population) >= 0) ? 2 : 0;
    out.push({ provider: p, sites, unsited: keepUnsited ? unsited : [], score: specific + sites.length * 0.1 + (p.verification.level === 'multiple' ? 0.5 : 0) });
  });
  return out.sort((a, b) => b.score - a.score || a.provider.name.localeCompare(b.provider.name));
}

// What gets saved on the interaction: a snapshot, so the record still reads right if the directory changes.
export function referralFrom(p, fac) {
  const a = fac && fac.address;
  return {
    providerId: p.id, facilityId: fac ? fac.id : '', name: p.name, site: fac ? fac.name : '',
    phone: (fac && fac.phone) || Object.values(p.phones)[0] || '',
    address: a ? [a.line1, a.line2].filter(Boolean).join(', ') + ', ' + a.city + ' ' + a.zip : ''
  };
}
export const referralText = (r) => (!r || !r.name ? '' : r.name + (r.site && r.site !== r.name ? ' (' + r.site + ')' : ''));
