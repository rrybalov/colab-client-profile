// Column definitions for every sortable table: header label, sort type, and the grid track widths.
const MONEY = [
  { key: 'units', label: 'Units', type: 'num' }, { key: 'status', label: 'Status', type: 'text' },
  { key: 'rate', label: 'Rate', type: 'num' }, { key: 'rateType', label: 'Rate Type', type: 'text' }, { key: 'cost', label: 'Cost', type: 'num' }
];

export const TABLES = {
  services: {
    cols: [
      { key: 'first', label: 'First Activity', type: 'date' }, { key: 'last', label: 'Last Activity', type: 'date' },
      { key: 'area', label: 'Program Area', type: 'text' }, { key: 'provSort', label: 'Provider/SCU', type: 'text' },
      { key: 'service', label: 'Service', type: 'text' }, { key: 'program', label: 'Program Area', type: 'text' },
      { key: 'added', label: 'Date Added', type: 'date' }
    ],
    grid: '112px 112px minmax(150px,1.3fr) minmax(160px,1.3fr) minmax(170px,1.5fr) minmax(130px,1fr) 100px 40px',
    min: 1080, sort: { key: 'last', dir: 'desc' }
  },
  providers: {
    cols: [
      { key: 'provider', label: 'Provider', type: 'text' }, { key: 'program', label: 'Program', type: 'text' },
      { key: 'first', label: 'First Activity', type: 'date' }, { key: 'last', label: 'Last Activity', type: 'date' },
      { key: 'dx', label: 'Diagnosis', type: 'text' }, { key: 'facility', label: 'Facility Name', type: 'text' }
    ].concat(MONEY),
    grid: 'minmax(110px,1.2fr) minmax(110px,1fr) 112px 112px 84px minmax(120px,1fr) 64px 76px 64px 92px 76px',
    min: 1140, sort: { key: 'last', dir: 'desc' }
  },
  serviceDetail: {
    cols: [
      { key: 'first', label: 'First Activity', type: 'date' }, { key: 'last', label: 'Last Activity', type: 'date' },
      { key: 'program', label: 'Program', type: 'text' }, { key: 'dx', label: 'Diagnosis', type: 'text' },
      { key: 'provider', label: 'Provider', type: 'text' }, { key: 'facility', label: 'Facility Name', type: 'text' }
    ].concat(MONEY),
    grid: '112px 112px minmax(110px,1fr) 84px minmax(150px,1.3fr) minmax(110px,1fr) 64px 76px 64px 92px 76px',
    min: 1100, sort: { key: 'last', dir: 'desc' }
  },
  providerDetail: {
    cols: [
      { key: 'service', label: 'Service', type: 'text' }, { key: 'first', label: 'First Activity', type: 'date' },
      { key: 'last', label: 'Last Activity', type: 'date' }, { key: 'program', label: 'Program', type: 'text' },
      { key: 'facility', label: 'Facility Name', type: 'text' }
    ].concat(MONEY),
    grid: 'minmax(160px,1.4fr) 112px 112px minmax(110px,1fr) minmax(120px,1fr) 64px 76px 64px 92px 76px',
    min: 1060, sort: { key: 'last', dir: 'desc' }
  },
  cases: {
    cols: [
      { key: 'otn', label: 'OTN', type: 'text' }, { key: 'date', label: 'Arrest Date', type: 'date' },
      { key: 'filed', label: 'Filing Date', type: 'date' }, { key: 'charge', label: 'Highest Charge', type: 'text' },
      { key: 'disp', label: 'Case Disposition', type: 'text' }, { key: 'nextDate', label: 'Next Court Event', type: 'date' }
    ],
    grid: '130px 170px 100px minmax(170px,1.4fr) 130px 150px',
    min: 860, sort: { key: 'date', dir: 'desc' }
  },
  starred: {
    cols: [
      { key: 'sortName', label: 'Client Name', type: 'text' }, { key: 'dob', label: 'Date of Birth (Age)', type: 'date' },
      { key: 'favorited', label: 'Date Favorited', type: 'date' }
    ],
    grid: '52px minmax(150px,1.4fr) 156px 132px 64px 120px minmax(120px,1fr)',
    min: 880, sort: { key: 'favorited', dir: 'desc' }
  },
  search: {
    grid: '58px minmax(150px,1.2fr) minmax(140px,1fr) minmax(220px,1.6fr) minmax(170px,1.2fr)',
    min: 760
  }
};
