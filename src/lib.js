// Small pure helpers: dates, names, sorting, matching, and the summary figures shown on the profile.

const pad = (n) => String(n).padStart(2, '0');
export const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
export const todayUS = () => isoToUS(todayISO());
export const isoToUS = (iso) => { const p = String(iso || '').split('-'); return p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : ''; };
export const usToISO = (us) => { const p = String(us || '').split('/'); return p.length === 3 ? p[2] + '-' + p[0] + '-' + p[1] : ''; };

export function ageFrom(us) {
  const iso = usToISO(us); if (!iso) return '';
  const b = new Date(iso + 'T00:00:00'), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}
export const dobText = (c) => (c.dob ? c.dob + ' (' + ageFrom(c.dob) + 'yo)' : 'Household');
export const displayName = (c) => (c.household ? c.first + ' ' + c.last : c.last + ', ' + c.first);
export const fullName = (c) => c.first + ' ' + c.last;
export const isOverdue = (a) => !a.done && !!a.due && a.due < todayISO();
export const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
export const countText = (n, total, noun) => (n === total ? '' : 'Showing ') + n + ' of ' + total + ' ' + noun;
export const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const uniq = (list) => Array.from(new Set(list.filter(Boolean))).sort();

// Sort key for a cell: dates (mm/dd/yyyy) become yyyymmdd, money and counts become numbers.
export function sortKey(v, type) {
  if (type === 'date') { const p = String(v || '').split('/'); return p.length === 3 ? p[2] + p[0] + p[1] : ''; }
  if (type === 'num') return parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')) || 0;
  return String(v == null ? '' : v).toLowerCase();
}
export function sortRows(rows, sort, defs) {
  const d = defs.find((x) => x.key === sort.key);
  if (!d) return rows;
  const m = sort.dir === 'asc' ? 1 : -1;
  const keyed = rows.map((r) => [sortKey(r[d.key], d.type), r]);
  keyed.sort((a, b) => (a[0] < b[0] ? -m : a[0] > b[0] ? m : 0));
  return keyed.map((k) => k[1]);
}
export const byDateDesc = (a, b) => { const x = sortKey(a.date, 'date'), y = sortKey(b.date, 'date'); return x < y ? 1 : x > y ? -1 : 0; };
export const byDueAsc = (a, b) => ((a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : 0);
export const byDueDesc = (a, b) => byDueAsc(b, a);

export function matches(row, keys, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return keys.map((k) => { const v = row[k]; return Array.isArray(v) ? v.join(' ') : v == null ? '' : v; }).join(' ').toLowerCase().indexOf(q) >= 0;
}

// Timeline text for a set of rows with first/last activity dates.
export function timeline(rows) {
  const keys = rows.flatMap((r) => [sortKey(r.first, 'date'), sortKey(r.last, 'date')]).filter(Boolean).sort();
  if (!keys.length) return '—';
  const fmt = (k) => k.slice(4, 6) + '/' + k.slice(6, 8) + '/' + k.slice(0, 4);
  const a = fmt(keys[0]), b = fmt(keys[keys.length - 1]);
  const years = ((new Date(usToISO(b)) - new Date(usToISO(a))) / (365.25 * 864e5)).toFixed(1);
  return a + ' – ' + b + ' (' + years + ' years)';
}
export const totalCost = (instances) => instances.reduce((s, i) => s + sortKey(i.cost, 'num'), 0);

// Profile summary figures computed from a client's services and service instances.
export function serviceSummary(c) {
  return {
    timeline: c.services.length ? timeline(c.services) : 'No services yet',
    unique: c.services.length,
    instances: c.instances.length,
    cost: totalCost(c.instances),
    providers: Array.from(new Set(c.instances.map((i) => i.provider))),
    areas: Array.from(new Set(c.services.map((s) => s.area).filter(Boolean).map((a) => a.replace(/ Services.*$/, '').replace(' (All)', '')))),
    programs: Array.from(new Set(c.instances.map((i) => i.program))),
    facilities: uniq(c.instances.map((i) => i.facility)).length
  };
}
export function providerSummary(c) {
  const byProv = {};
  c.instances.forEach((i) => {
    const p = byProv[i.provider] || (byProv[i.provider] = { provider: i.provider, programs: new Set(), first: i.first, last: i.last, dx: i.dx, facility: i.facility, units: 0, cost: 0, status: i.status, rate: i.rate, rateType: i.rateType });
    p.programs.add(i.program);
    if (sortKey(i.first, 'date') < sortKey(p.first, 'date')) p.first = i.first;
    if (sortKey(i.last, 'date') > sortKey(p.last, 'date')) { p.last = i.last; p.status = i.status; p.facility = i.facility; }
    p.units += sortKey(i.units, 'num'); p.cost += sortKey(i.cost, 'num');
  });
  return Object.values(byProv).map((p) => ({ ...p, programs: Array.from(p.programs), program: Array.from(p.programs).join('; '), units: String(p.units), cost: '$' + p.cost.toFixed(2) }));
}
