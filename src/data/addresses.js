// Address history: the rules for reading a client's address records, shared by the screens, the sample-data
// generator and the tests. Pure functions, no React.
//
// An address record is open (current) when `end` is null. Two records are concurrent when their date ranges
// overlap; an open record runs to the present. Concurrent records chain into periods: if A overlaps B and
// B overlaps C, all three are one concurrent period, even if A and C never overlap.

// The programs (source buckets) an address can come from, in the order the source filter lists them.
export const SOURCE_BUCKETS = ['OBH', 'DHS', 'Medicare', 'SNAP', 'CYF', 'ACHD', 'Shelter', 'Provider', 'Self'];
export const SOURCE_NAMES = {
  OBH: 'Office of Behavioral Health', DHS: 'Dept. of Human Services', Medicare: 'Medicare / Medicaid (CMS)',
  SNAP: 'SNAP — Food Assistance', CYF: 'Children, Youth & Families', ACHD: 'Allegheny County Health Dept.',
  Shelter: 'Shelter / Emergency Housing', Provider: 'Service Provider Records', Self: 'Self-Reported'
};

// ------------------------------------------------------------------ dates
// Dates are yyyy-mm-dd. They're read as local calendar days, so "2025-06-01" is June 1 in every time zone.
export function day(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const OPEN = 8.64e15; // an open record runs to the end of time
const startMs = (a) => day(a.start).getTime();
const endMs = (a) => (a.end ? day(a.end).getTime() : OPEN);

export const monthYear = (iso) => (iso ? day(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present');
export const longDate = (iso) => (iso ? day(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Present');

// "1 yr 6 mo", "8 mo" or "< 1 mo", counting an open record to today.
export function duration(start, end) {
  const months = Math.round(((end ? day(end) : today()) - day(start)) / (864e5 * 30.44));
  if (months < 2) return '< 1 mo';
  if (months < 12) return months + ' mo';
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y} yr ${m} mo` : `${y} yr`;
}
export function dayCount(start, end) {
  const n = Math.round(((end ? day(end) : today()) - day(start)) / 864e5);
  return n.toLocaleString('en-US') + ' day' + (n !== 1 ? 's' : '');
}

// "Hancock (WV)" → WV; Pennsylvania counties have no suffix.
export const stateOf = (county) => { const m = String(county || '').match(/\(([A-Z]{2})\)/); return m ? m[1] : 'PA'; };
export const cityLine = (a) => `${a.city}, ${stateOf(a.county)} ${a.zip}`;

// ------------------------------------------------------------------ reading a history
export const byStartDesc = (a, b) => startMs(b) - startMs(a);
export const isOpen = (a) => !a.end;
export const currentAddresses = (list) => list.filter(isOpen).sort(byStartDesc);
// The most recently started open record, or the latest record when none is open.
export const mostRecent = (list) => currentAddresses(list)[0] || list.slice().sort(byStartDesc)[0] || null;
export const overlaps = (a, b) => startMs(a) < endMs(b) && startMs(b) < endMs(a);
export const countyCount = (list) => new Set(list.map((a) => a.county)).size;

// Groups records into single addresses and concurrent periods (chains of overlapping records).
// Returns [{ type: 'single', addr } | { type: 'concurrent', addrs, start, end }], each period's records newest first.
export function groupConcurrent(list) {
  const links = {};
  list.forEach((a) => { links[a.id] = []; });
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (overlaps(list[i], list[j])) { links[list[i].id].push(list[j].id); links[list[j].id].push(list[i].id); }
    }
  }
  const byId = {}; list.forEach((a) => { byId[a.id] = a; });
  const seen = new Set();
  const out = [];
  list.forEach((a) => {
    if (seen.has(a.id)) return;
    if (!links[a.id].length) { seen.add(a.id); out.push({ type: 'single', addr: a }); return; }
    const addrs = [];
    const queue = [a.id];
    while (queue.length) {
      const id = queue.shift();
      if (seen.has(id)) continue;
      seen.add(id); addrs.push(byId[id]);
      links[id].forEach((n) => { if (!seen.has(n)) queue.push(n); });
    }
    addrs.sort(byStartDesc);
    const s = Math.min(...addrs.map(startMs)), e = Math.max(...addrs.map(endMs));
    out.push({ type: 'concurrent', addrs, start: new Date(s), end: e === OPEN ? null : new Date(e) });
  });
  return out;
}
const groupStart = (g) => (g.type === 'single' ? day(g.addr.start) : g.start);

// Groups by the year each address or concurrent period began, newest year first.
export function timelineYears(list) {
  const years = {};
  groupConcurrent(list).forEach((g) => { const y = groupStart(g).getFullYear(); (years[y] = years[y] || []).push(g); });
  return Object.keys(years).map(Number).sort((a, b) => b - a)
    .map((year) => ({ year, groups: years[year].sort((a, b) => groupStart(b) - groupStart(a)) }));
}
export const concurrentPeriods = (list) => groupConcurrent(list).filter((g) => g.type === 'concurrent').length;
export const periodMonth = (date) => (date ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present');

// The source systems behind one bucket on one record, or failing that, the dates it reported the address.
export function bucketDetail(addr, bucket) {
  const systems = (addr.specificSources || []).filter((s) => s.bucket === bucket);
  // Without named systems, list the reports whose agency names the bucket (as the prototype does).
  const reports = systems.length ? [] : addr.reports.filter((r) => r.agency.includes(bucket));
  return { name: SOURCE_NAMES[bucket] || bucket, systems, reports };
}
export const lastReported = (addr) => (addr.reports.length ? addr.reports.map((r) => r.date).sort().pop() : null);
// "Mercy Behavioral Health, 1 Smithfield St, …" → "Mercy Behavioral Health"
export function providerName(location) {
  const parts = String(location).split(', ');
  const i = parts.findIndex((p) => /^\d/.test(p));
  return i > 0 ? parts.slice(0, i).join(', ') : location;
}
