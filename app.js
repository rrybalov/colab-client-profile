/* CoLab prototype: state, routing, rendering and interactions.
   No framework and no build step. render() rebuilds the page from `state`;
   clicks route through [data-action], form fields through [data-model]. */
(function () {
  'use strict';

  var D = window.COLAB_DATA;
  var appEl = document.getElementById('app');
  var modalRoot = document.getElementById('modal-root');
  var toastRoot = document.getElementById('toast-root');

  // ================================================================ icons
  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    inbox: '<path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3H3z"/><path d="M10 13h4"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.8-4.5 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    userSolid: '<circle cx="12" cy="8" r="4" fill="currentColor" stroke="none"/><path d="M4 21c1.5-4.5 4.5-6.5 8-6.5s6.5 2 8 6.5z" fill="currentColor" stroke="none"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 1.5 4.8 4"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    layers: '<path d="M12 2 2 7l10 5 10-5z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/>',
    lifebuoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M14.8 9.2l3.6-3.6M5.6 18.4l3.6-3.6"/>',
    building: '<path d="M3 21V9l5-3v15M8 21V4h9v17M17 10h4v11M2 21h20M11 8h3M11 12h3M11 16h3"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    landmark: '<path d="M3 10h18M12 3l9 5H3zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 19v2H6"/>',
    userCircle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.3-2 3.2-3 5.5-3s4.2 1 5.5 3"/>',
    gridPlus: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>',
    columns: '<rect x="3" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="9.5" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="16" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    funnel: '<path d="M3 4h18l-7 9v6l-4 2v-8z" fill="currentColor" stroke="none"/>',
    rows: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
    more: '<circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    notes: '<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4"/>',
    plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bug: '<path d="M8 8a4 4 0 0 1 8 0v1H8z"/><path d="M6 10h12v4a6 6 0 0 1-12 0z"/><path d="M12 10v10M3 13h3M18 13h3M4 8l2 2M20 8l-2 2M4 19l2-2M20 19l-2-2"/>',
    sortLines: '<path d="M4 6h10M4 12h7M4 18h4M17 5v14M14 16l3 3 3-3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 1.3-1.3a4 4 0 0 0-5-5L5 13l-2-2 8-8 2 2z" transform="scale(.92) translate(1 1)"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3M19 6v6M5 12c0 1.7 3.1 3 7 3"/><path d="M18 14l-3.5 6h7z"/><path d="M18 16.5v1.5"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 3.5M12 16.5h.01"/>'
  };

  function icon(name, size, cls, label) {
    size = size || 16;
    var a11y = label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"';
    return '<svg class="icon ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' + a11y + '>' + ICONS[name] + '</svg>';
  }
  var BRAND_MARK = '<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5" stroke-dasharray="3 2.4"></circle><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"></circle></svg>';

  // ================================================================ helpers
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function isoToUS(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : ''; }
  function usToISO(us) { var p = String(us || '').split('/'); return p.length === 3 ? p[2] + '-' + p[0] + '-' + p[1] : ''; }
  function ageFrom(us) {
    var iso = usToISO(us); if (!iso) return '';
    var b = new Date(iso + 'T00:00:00'), t = new Date();
    var a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  }
  function dobText(c) { return c.dob ? c.dob + ' (' + ageFrom(c.dob) + 'yo)' : 'Household'; }
  function displayName(c) { return c.household ? c.first + ' ' + c.last : c.last + ', ' + c.first; }
  function fullName(c) { return c.household ? c.first + ' ' + c.last : c.first + ' ' + c.last; }

  // Sample dates were written against Nov 4, 2026. Shift them so "overdue" and "recent" stay meaningful on later visits.
  (function shiftSampleDates() {
    var anchor = Date.UTC(2026, 10, 4);
    var t = new Date();
    var delta = Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - anchor) / 864e5);
    if (delta <= 0) return;
    function shiftISO(iso) {
      if (!iso) return iso;
      var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + delta);
      return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
    }
    D.notes.forEach(function (n) { n.date = isoToUS(shiftISO(usToISO(n.date))); });
    D.actions.forEach(function (a) { a.due = shiftISO(a.due); });
    D.clients.forEach(function (c) { if (c.favorited) c.favorited = isoToUS(shiftISO(usToISO(c.favorited))); });
  })();

  // Sort key for a cell: dates (mm/dd/yyyy) become yyyymmdd, money and counts become numbers.
  function sortKey(v, type) {
    if (type === 'date') { var p = String(v || '').split('/'); return p.length === 3 ? p[2] + p[0] + p[1] : ''; }
    if (type === 'num') return parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')) || 0;
    return String(v == null ? '' : v).toLowerCase();
  }
  function sortRows(rows, table, defs) {
    var st = state.sorts[table];
    var d = defs.filter(function (x) { return x.key === st.key; })[0];
    if (!d) return rows;
    var m = st.dir === 'asc' ? 1 : -1;
    return rows.slice().sort(function (a, b) {
      var x = sortKey(a[d.key], d.type), y = sortKey(b[d.key], d.type);
      return x < y ? -m : x > y ? m : 0;
    });
  }
  function byDateDesc(a, b) { var x = sortKey(a.date, 'date'), y = sortKey(b.date, 'date'); return x < y ? 1 : x > y ? -1 : 0; }
  function matches(row, keys, query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    return keys.map(function (k) { var v = row[k]; return Array.isArray(v) ? v.join(' ') : (v == null ? '' : v); }).join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function countText(n, total, noun) { return (n === total ? '' : 'Showing ') + n + ' of ' + total + ' ' + noun; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // ================================================================ column definitions (profile tables)
  var MONEY = [
    { key: 'units', label: 'Total Units', type: 'num' }, { key: 'status', label: 'Claim Status', type: 'text' },
    { key: 'rate', label: 'Rate', type: 'num' }, { key: 'rateType', label: 'Rate Type', type: 'text' },
    { key: 'cost', label: 'Total Cost', type: 'num' }
  ];
  var DEFS = {
    svc: [
      { key: 'first', label: 'First Activity', type: 'date' }, { key: 'last', label: 'Last Activity', type: 'date' },
      { key: 'area', label: 'Program Area', type: 'text' }, { key: 'provSort', label: 'Provider/SCU', type: 'text' },
      { key: 'service', label: 'Service', type: 'text' }, { key: 'program', label: 'Program Area', type: 'text' },
      { key: 'added', label: 'Date Added', type: 'date' }
    ],
    prov: [
      { key: 'provider', label: 'Provider', type: 'text' }, { key: 'program', label: 'Program', type: 'text' },
      { key: 'first', label: 'First Activity', type: 'date' }, { key: 'last', label: 'Last Activity', type: 'date' },
      { key: 'dx', label: 'Diagnosis', type: 'text' }, { key: 'facility', label: 'Facility Name', type: 'text' }
    ].concat(MONEY),
    sd: [
      { key: 'first', label: 'First Activity', type: 'date' }, { key: 'last', label: 'Last Activity', type: 'date' },
      { key: 'program', label: 'Program', type: 'text' }, { key: 'dx', label: 'Diagnosis', type: 'text' },
      { key: 'provider', label: 'Provider', type: 'text' }, { key: 'facility', label: 'Facility Name', type: 'text' }
    ].concat(MONEY),
    pd: [
      { key: 'service', label: 'Service', type: 'text' }, { key: 'first', label: 'First Activity', type: 'date' },
      { key: 'last', label: 'Last Activity', type: 'date' }, { key: 'program', label: 'Program', type: 'text' },
      { key: 'facility', label: 'Facility Name', type: 'text' }
    ].concat(MONEY),
    cases: [
      { key: 'otn', label: 'OTN', type: 'text' }, { key: 'date', label: 'Arrest Date', type: 'date' },
      { key: 'filed', label: 'Filing Date', type: 'date' }, { key: 'charge', label: 'Highest Charge', type: 'text' },
      { key: 'disp', label: 'Case Disposition', type: 'text' }, { key: 'nextDate', label: 'Next Court Event', type: 'date' }
    ],
    starred: [
      { key: 'sortName', label: 'Client Name', type: 'text' }, { key: 'dob', label: 'Date of Birth (Age)', type: 'date' },
      { key: 'favorited', label: 'Date Favorited', type: 'date' }
    ]
  };
  var GRID = {
    svc: '92px 100px minmax(150px,1.3fr) minmax(160px,1.3fr) minmax(170px,1.5fr) minmax(130px,1fr) 88px 40px',
    prov: 'minmax(110px,1.2fr) minmax(110px,1fr) 92px 100px 80px minmax(120px,1fr) 70px 86px 60px 80px 76px',
    sd: '92px 100px minmax(110px,1fr) 80px minmax(150px,1.3fr) minmax(100px,1fr) 70px 86px 60px 74px 76px',
    pd: 'minmax(160px,1.4fr) 92px 100px minmax(110px,1fr) minmax(120px,1fr) 70px 86px 60px 74px 76px',
    cases: '130px 170px 90px minmax(170px,1.4fr) 120px 140px',
    starred: '52px minmax(150px,1.4fr) 130px 150px 64px 120px minmax(120px,1fr)',
    search: '58px minmax(150px,1.2fr) minmax(140px,1fr) minmax(220px,1.6fr) minmax(170px,1.2fr)'
  };

  // ================================================================ state
  var CLIENT_TABS = [['overview', 'Client Overview'], ['services', 'Services'], ['program-info', 'Program Info'], ['providers', 'Providers'], ['benefits', 'Benefits']];
  var HUB_PAGES = { home: 'CoLab Home', 'my-action-items': 'My Action Items', 'my-case-notes': 'My Case Notes', 'starred-clients': 'Starred Clients' };
  var PAGE_KEYS = ['home', 'myActions', 'myNotes', 'starred', 'clientNotes', 'clientActions', 'search'];

  var state = {
    route: 'home', clientId: 'c1', clientPage: 'tabs', tab: 'services', view: 'tabs', panel: false,
    colab: '',
    clients: clone(D.clients), notes: clone(D.notes), actions: clone(D.actions),
    pages: {}, sizes: { myActions: 10, myNotes: 10, starred: 10, clientNotes: 10, clientActions: 10, search: 25 },
    // Hub
    starPage: 0, homeActionTab: 'open', homeNoteOpen: {},
    myActionsFilter: 'all', myActionsStatus: 'open', myNotesFilter: 'all', myNotesSort: 'desc', myNoteOpen: {},
    starredFilter: 'all', starredQuery: '',
    // Modals
    modal: null, opener: null,
    search: { first: '', last: '', phone: '', email: '', mci: '', dhs: '', ssn: '' }, searchRun: null, searchError: '',
    missing: { first: '', last: '', dob: '', dhs: '', ssn: '', other: '', name: '', email: '' }, missingSent: false,
    issue: { type: '', details: '', name: '', email: '' }, issueSent: false,
    // Client profile
    service: '', provider: '', ssn: false, copied: false,
    svcMode: 'all', query: '', providerFilter: '', programFilter: '', categoryFilter: '', svcFrom: '', svcFilterOpen: false, menuRow: null,
    sdQuery: '', sdProvider: '', sdProgram: '', pdQuery: '', pdProgram: '', provQuery: '', provProgram: '',
    sub: 'contact', program: 'justice', caseFilter: 'all', incOpen: {},
    sorts: { svc: { key: 'last', dir: 'desc' }, prov: { key: 'last', dir: 'desc' }, sd: { key: 'last', dir: 'desc' }, pd: { key: 'last', dir: 'desc' }, cases: { key: 'date', dir: 'desc' }, starred: { key: 'favorited', dir: 'desc' } },
    noteOpen: { n2: true }, noteSort: 'desc',
    composingNote: false, editingNote: null, noteDraft: '', noteError: false, noteRestricted: false,
    actionFilter: 'open', clientActionStatus: 'open',
    composingAction: false, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false
  };
  PAGE_KEYS.forEach(function (k) { state.pages[k] = 0; });
  state.missing.name = D.user.first + ' ' + D.user.last; state.missing.email = D.user.email;
  state.issue.name = D.user.first + ' ' + D.user.last; state.issue.email = D.user.email;

  function set(patch) { Object.assign(state, patch); render(); }
  function client() { return state.clients.filter(function (c) { return c.id === state.clientId; })[0] || state.clients[0]; }
  function clientById(id) { return state.clients.filter(function (c) { return c.id === id; })[0]; }
  function colabTag(id) { var c = D.colabs.filter(function (x) { return x.id === id; })[0]; return c ? c.tag : id; }
  function inColab(item) { return !state.colab || item.tag === colabTag(state.colab); }
  function clientInColab(c) { return !state.colab || c.colabs.indexOf(state.colab) >= 0; }
  function isOverdue(a) { return !a.done && !!a.due && a.due < todayISO(); }

  // ================================================================ routing
  function parseHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    var parts = h.split('/').filter(Boolean);
    if (!parts.length || parts[0] === 'home') return { route: 'home' };
    if (HUB_PAGES[parts[0]]) return { route: parts[0] };
    var legacy = CLIENT_TABS.some(function (t) { return t[0] === parts[0]; });
    if (legacy) return { route: 'client', clientId: 'c1', clientPage: 'tabs', tab: parts[0] };
    if (parts[0] === 'client') {
      var id = clientById(parts[1]) ? parts[1] : 'c1';
      var sub = parts[2] || 'overview';
      if (sub === 'case-notes') return { route: 'client', clientId: id, clientPage: 'notes' };
      if (sub === 'action-items') return { route: 'client', clientId: id, clientPage: 'actions' };
      if (!CLIENT_TABS.some(function (t) { return t[0] === sub; })) sub = 'overview';
      return { route: 'client', clientId: id, clientPage: 'tabs', tab: sub };
    }
    return { route: 'home' };
  }
  function hashFor(r) {
    if (r.route !== 'client') return '#' + r.route;
    var base = '#client/' + r.clientId + '/';
    if (r.clientPage === 'notes') return base + 'case-notes';
    if (r.clientPage === 'actions') return base + 'action-items';
    return base + (r.tab || 'overview');
  }
  function applyRoute(r) {
    var patch = { route: r.route, menuRow: null, svcFilterOpen: false };
    if (r.route === 'client') {
      var switching = r.clientId !== state.clientId;
      patch.clientId = r.clientId;
      patch.clientPage = r.clientPage;
      if (r.clientPage === 'tabs') {
        patch.tab = r.tab; patch.view = 'tabs';
        if (switching || state.route !== 'client' || state.clientPage !== 'tabs' || state.tab !== r.tab) patch.panel = r.tab !== 'services' && r.tab !== 'benefits';
      }
      if (switching) Object.assign(patch, { ssn: false, composingNote: false, composingAction: false, noteOpen: {} });
    }
    Object.assign(state, patch);
  }
  function go(r, opts) {
    var target = hashFor(r);
    applyRoute(r);
    if (location.hash !== target) history.pushState(null, '', target);
    render();
    resetScroll();
    if (!opts || opts.focus !== false) focusMain();
  }
  function resetScroll() {
    window.scrollTo(0, 0);
    var m = document.getElementById('main'); if (m) m.scrollTop = 0;
  }
  function focusMain() { var m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); }
  window.addEventListener('popstate', function () { applyRoute(parseHash()); render(); resetScroll(); });
  window.addEventListener('hashchange', function () { applyRoute(parseHash()); render(); });

  // ================================================================ toast
  var toastTimer = null, toastUndo = null;
  function toast(text, undo) {
    toastUndo = undo || null;
    toastRoot.innerHTML = '<div class="toast"><span>' + esc(text) + '</span>' + (undo ? '<button type="button" data-action="toastUndo">Undo</button>' : '') + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastRoot.innerHTML = ''; toastUndo = null; }, undo ? 6000 : 2600);
  }
  function copyText(value, label) {
    var done = function () { toast(label + ' copied'); };
    try { navigator.clipboard.writeText(value).then(done, function () { toast('Copy failed. Select the text and copy it instead.'); }); }
    catch (e) { toast('Copy failed. Select the text and copy it instead.'); }
  }

  // ================================================================ shared pieces
  function headerRow(table) {
    var st = state.sorts[table];
    var cells = DEFS[table].map(function (d) {
      var on = st.key === d.key;
      var ariaSort = on ? (st.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return '<div class="th" role="columnheader" aria-sort="' + ariaSort + '">' +
        '<button type="button" class="sort-btn' + (on ? ' is-active' : '') + '" data-action="sort" data-table="' + table + '" data-key="' + d.key + '">' +
        esc(d.label) + icon('chevronDown', 14, 'sort-icon' + (on && st.dir === 'asc' ? ' is-asc' : '')) + '</button></div>';
    }).join('');
    if (table === 'svc') cells += '<div class="th" role="columnheader"><span class="sr-only">Actions</span></div>';
    return '<div class="tr is-head" role="row">' + cells + '</div>';
  }
  function tableShell(table, label, minWidth, rowsHtml, emptyText, head) {
    return '<div class="table-wrap"><div class="table" role="table" aria-label="' + esc(label) + '" style="--cols: ' + GRID[table] + '; --min: ' + minWidth + 'px">' +
      (head || headerRow(table)) + rowsHtml + (rowsHtml ? '' : '<p class="empty">' + esc(emptyText) + '</p>') + '</div></div>';
  }
  function chip(label, value) { return '<div class="chip"><dt>' + label + '</dt><dd>' + value + '</dd></div>'; }
  function providerTags(names) {
    return names.map(function (n) {
      return '<button type="button" class="tag" data-action="openProvider" data-name="' + esc(n) + '" aria-label="Open provider ' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');
  }
  function tip(label, body, size) {
    return '<span class="tip"><button type="button" class="tip-trigger" aria-label="' + esc(label) + '">' + icon('info', size || 14) + '</button><span class="tip-box" role="tooltip">' + body + '</span></span>';
  }
  function searchBox(id, model, label) {
    return '<label class="sr-only" for="' + id + '">' + esc(label) + '</label>' +
      '<input class="input is-search" id="' + id + '" type="search" placeholder="Search" data-model="' + model + '" value="' + esc(state[model]) + '">';
  }
  function selectBox(id, model, label, placeholder, options) {
    return '<label class="sr-only" for="' + id + '">' + esc(label) + '</label>' +
      '<select class="select" id="' + id + '" data-model="' + model + '">' +
      '<option value="">' + esc(placeholder) + '</option>' +
      options.map(function (o) {
        var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
        return '<option value="' + esc(v) + '"' + (state[model] === v ? ' selected' : '') + '>' + esc(l) + '</option>';
      }).join('') + '</select>';
  }
  function staticPager(text) { return '<div class="pager is-start"><span>Rows per page: <strong>10</strong></span><span>' + esc(text) + '</span></div>'; }

  // Real pagination: slices a list and renders the pager for it.
  function paginate(key, list) {
    var size = state.sizes[key] || 10;
    var pages = Math.max(1, Math.ceil(list.length / size));
    var page = Math.min(state.pages[key] || 0, pages - 1);
    state.pages[key] = page;
    var start = page * size;
    return { items: list.slice(start, start + size), page: page, pages: pages, start: start, end: Math.min(start + size, list.length), total: list.length, key: key, size: size };
  }
  function pagerHtml(p, sizes) {
    sizes = sizes || [10, 25, 50];
    var id = 'size-' + p.key;
    return '<div class="pager">' +
      '<label for="' + id + '">Rows per page:</label>' +
      '<select class="select" id="' + id + '" data-size="' + p.key + '">' + sizes.map(function (s) { return '<option' + (s === p.size ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
      '<span>' + (p.total ? (p.start + 1) + '–' + p.end + ' of ' + p.total : '0 of 0') + '</span>' +
      '<span class="pager-btns">' +
        '<button type="button" class="tool-btn" data-action="page" data-key="' + p.key + '" data-dir="-1" aria-label="Previous page"' + (p.page === 0 ? ' disabled' : '') + '>' + icon('chevronLeft', 16) + '</button>' +
        '<button type="button" class="tool-btn" data-action="page" data-key="' + p.key + '" data-dir="1" aria-label="Next page"' + (p.page >= p.pages - 1 ? ' disabled' : '') + '>' + icon('chevronRight', 16) + '</button>' +
      '</span></div>';
  }

  var TIMELINE_CHIP = chip('Timeline', '02/09/2000 – 07/16/2025 (25.5 years)');
  var PROGRAMS = ['Behavioral Health', 'Housing', 'Justice'];

  function tagChip(tag) { return '<span class="chip-tag' + (tag === 'PERSONAL' ? ' is-personal' : '') + '">' + esc(tag) + '</span>'; }
  function clientRef(id) {
    var c = clientById(id); if (!c) return '';
    return '<button type="button" class="client-ref" data-action="openClient" data-id="' + c.id + '">' + icon(c.household ? 'users' : 'user', 14) + esc(fullName(c)) + '</button>';
  }
  function lockBadge(n) {
    return n.restricted
      ? '<span class="sep lock is-restricted">' + icon('lock', 14) + 'Restricted</span>'
      : '<span class="sep lock is-open">' + icon('unlock', 14) + 'Unrestricted</span>';
  }
  function starButton(c, size) {
    var on = !!c.starred;
    return '<button type="button" class="fav" data-action="toggleStar" data-id="' + c.id + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove ' : 'Add ') + esc(fullName(c)) + (on ? ' from' : ' to') + ' starred clients">' +
      '<svg class="icon" width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="' + (on ? '#EDCA91' : 'none') + '" stroke="' + (on ? '#C99A4B' : '#3D3D4B') + '" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true">' + ICONS.star + '</svg></button>';
  }

  // ================================================================ hub shell
  function renderHub(page, content) {
    var links = [['home', 'home', 'CoLab Home'], ['my-action-items', 'inbox', 'My Action Items'], ['my-case-notes', 'notes', 'My Case Notes'], ['starred-clients', 'star', 'Starred Clients']];
    return '<div class="hub">' +
      '<nav class="sidebar" aria-label="CoLab">' +
        '<a class="brand" href="#home" data-action="nav" data-route="home">' + BRAND_MARK + 'CoLab</a>' +
        links.map(function (l) {
          return '<a class="side-link" href="#' + l[0] + '" data-action="nav" data-route="' + l[0] + '"' + (page === l[0] ? ' aria-current="page"' : '') + '>' + icon(l[1], 18) + l[2] + '</a>';
        }).join('') +
        '<div class="side-divider" role="separator"></div>' +
        '<label class="sr-only" for="choose-colab">Choose CoLab</label>' +
        '<select class="side-select" id="choose-colab" data-model="colab"><option value="">All CoLabs</option>' +
          D.colabs.map(function (c) { return '<option value="' + esc(c.id) + '"' + (state.colab === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
        '<div class="side-user"><span class="avatar-sm">' + esc(D.user.initials) + '</span><div><strong>' + esc(D.user.first + ' ' + D.user.last) + '</strong><span>' + esc(D.user.org) + '</span></div></div>' +
        '<button type="button" class="side-link side-report" data-action="openModal" data-id="issue">' + icon('wrench', 16) + 'Report an Issue</button>' +
      '</nav>' +
      '<main class="hub-main" id="main" tabindex="-1">' + content + '</main>' +
    '</div>';
  }

  function colabNote() {
    if (!state.colab) return '';
    var c = D.colabs.filter(function (x) { return x.id === state.colab; })[0];
    return '<p class="notice">' + icon('funnel', 14) + '<span>Showing ' + esc(c.name) + ' only. Choose All CoLabs in the menu to see everything.</span></p>';
  }

  // ---------------------------------------------------------------- Home
  function renderHome() {
    var starred = state.clients.filter(function (c) { return c.starred && clientInColab(c); })
      .sort(function (a, b) { return sortKey(b.favorited, 'date') > sortKey(a.favorited, 'date') ? 1 : -1; });
    var per = 8, pages = Math.max(1, Math.ceil(starred.length / per));
    var sp = Math.min(state.starPage, pages - 1);
    var shown = starred.slice(sp * per, sp * per + per);
    var cards = shown.map(function (c) {
      return '<div class="star-card"><div class="star-card-top">' +
        '<button type="button" class="link-btn" data-action="openClient" data-id="' + c.id + '">' + icon(c.household ? 'users' : 'user', 16) + '<span>' + esc(displayName(c)) + '</span></button>' + starButton(c, 20) + '</div>' +
        '<div class="id-line">MCI ID: ' + esc(c.mci) + '<button type="button" class="icon-btn" data-action="copy" data-value="' + esc(c.mci) + '" data-label="MCI ID" aria-label="Copy MCI ID for ' + esc(fullName(c)) + '">' + icon('copy', 14) + '</button></div>' +
        '<div class="id-line">SSN: *' + esc(c.ssn4) + '<button type="button" class="icon-btn" data-action="copy" data-value="' + esc(c.ssn4) + '" data-label="SSN last 4" aria-label="Copy SSN last 4 for ' + esc(fullName(c)) + '">' + icon('copy', 14) + '</button></div>' +
      '</div>';
    }).join('');

    var acts = state.actions.filter(inColab);
    var open = acts.filter(function (a) { return !a.done; }), over = acts.filter(isOverdue);
    var listA = (state.homeActionTab === 'overdue' ? over : open).slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 5);
    var notes = state.notes.filter(inColab).slice().sort(byDateDesc);
    var recentNotes = notes.slice(0, 5);

    return '<div class="page-head"><h1 class="page-title is-welcome">Welcome, ' + esc(D.user.first) + ' <span aria-hidden="true">👋</span></h1>' +
        '<button type="button" class="search-launch" data-action="openModal" data-id="search">' + icon('search', 18) + 'Search for Client</button></div>' +
      colabNote() +
      '<section class="panel-card" aria-labelledby="starred-h">' +
        '<div class="card-head"><h2 class="card-title" id="starred-h">' + icon('star', 22) + 'My Starred Clients <span>(' + shown.length + ' of ' + starred.length + ')</span></h2>' +
        '<a class="link-btn is-small is-inline" href="#starred-clients" data-action="nav" data-route="starred-clients">' + icon('external', 14) + 'View All Starred Clients</a></div>' +
        (starred.length
          ? '<div class="carousel"><button type="button" class="carousel-btn" data-action="starPage" data-dir="-1" aria-label="Previous starred clients"' + (sp === 0 ? ' disabled' : '') + '>' + icon('chevronLeft', 30) + '</button>' +
            '<div class="star-grid">' + cards + '</div>' +
            '<button type="button" class="carousel-btn" data-action="starPage" data-dir="1" aria-label="Next starred clients"' + (sp >= pages - 1 ? ' disabled' : '') + '>' + icon('chevronRight', 30) + '</button></div>'
          : '<div class="empty-state">' + icon('star', 28) + '<strong>No starred clients yet</strong><span>Star a client from search or their profile to keep them here.</span></div>') +
      '</section>' +
      '<div class="home-grid">' +
        '<section class="panel-card" aria-labelledby="recent-a-h">' +
          '<div class="card-head"><h2 class="card-title" id="recent-a-h">' + icon('inbox', 22) + 'Recent Action Items <span>(' + listA.length + ' of ' + acts.length + ')</span></h2>' +
          '<a class="link-btn is-small is-inline" href="#my-action-items" data-action="nav" data-route="my-action-items">' + icon('external', 14) + 'View All Action Items</a></div>' +
          '<div class="segmented is-fill is-small" role="group" aria-label="Show action items">' +
            '<button type="button" class="seg" data-action="homeActionTab" data-id="open" aria-pressed="' + (state.homeActionTab === 'open') + '">Open (' + open.length + ')</button>' +
            '<button type="button" class="seg" data-action="homeActionTab" data-id="overdue" aria-pressed="' + (state.homeActionTab === 'overdue') + '">' + icon('alert', 13) + 'Overdue (' + over.length + ')</button>' +
          '</div>' +
          '<ul class="feed">' + (listA.map(function (a) { return actionRow(a, { client: true }); }).join('') || '<li class="empty">Nothing here.</li>') + '</ul>' +
        '</section>' +
        '<section class="panel-card" aria-labelledby="recent-n-h">' +
          '<div class="card-head"><h2 class="card-title" id="recent-n-h">' + icon('notes', 22) + 'Recent Case Notes <span>(' + recentNotes.length + ' of ' + notes.length + ')</span></h2>' +
          '<a class="link-btn is-small is-inline" href="#my-case-notes" data-action="nav" data-route="my-case-notes">' + icon('external', 14) + 'View All Case Notes</a></div>' +
          '<div class="list-head"><span class="sort-btn" style="cursor: default">Date ' + icon('sortLines', 14) + '<span>Newest first</span></span></div>' +
          '<ul class="feed is-scroll" data-scroll-key="home-notes">' + (recentNotes.map(function (n) { return noteRow(n, { client: true, lock: true, clamp: 'homeNoteOpen' }); }).join('') || '<li class="empty">No case notes yet.</li>') + '</ul>' +
        '</section>' +
      '</div>';
  }

  // Note and action rows outside the client panel
  function noteRow(n, o) {
    var open = o.clamp ? !!state[o.clamp][n.id] : true;
    var text = o.clamp && !open
      ? '<div class="note-clamp" style="font-size: 13px"><span>' + esc(n.text) + '</span><button type="button" class="more-btn" data-action="toggleFlag" data-flag="' + o.clamp + '" data-id="' + n.id + '" aria-expanded="false">Show more</button></div>'
      : '<p class="feed-text">' + esc(n.text) + (o.clamp ? ' <button type="button" class="more-btn" data-action="toggleFlag" data-flag="' + o.clamp + '" data-id="' + n.id + '" aria-expanded="true">Show less</button>' : '') + '</p>';
    return '<li class="feed-item"><div class="feed-body">' + text +
      '<div class="meta"><span>' + esc(n.date) + '</span>' + (n.edited ? '<span class="sep edited">Edited</span>' : '') + (o.lock ? lockBadge(n) : '') +
      '<span class="spacer"></span>' + (o.client ? tagChip(n.tag) + clientRef(n.clientId) : '') +
      (o.edit ? '<button type="button" class="icon-btn" data-action="editNote" data-id="' + n.id + '" aria-label="Edit note from ' + esc(n.date) + '">' + icon('edit', 15) + '</button>' +
        '<button type="button" class="icon-btn is-danger" data-action="deleteNote" data-id="' + n.id + '" aria-label="Delete note from ' + esc(n.date) + '">' + icon('trash', 15) + '</button>' : '') +
      '</div></div></li>';
  }
  function actionRow(a, o) {
    var over = isOverdue(a);
    return '<li class="feed-item' + (a.done ? ' is-done' : '') + '">' +
      '<input type="checkbox" id="fa-' + a.id + '" data-action="toggleTask" data-id="' + a.id + '"' + (a.done ? ' checked' : '') + '>' +
      '<div class="feed-body"><label class="feed-text" for="fa-' + a.id + '">' + esc(a.text) + '</label>' +
      '<div class="meta">' + (o.assignee ? '<span>' + esc(a.assignee) + '</span>' : '') +
        '<span class="' + (o.assignee ? 'sep ' : '') + (over ? 'is-overdue' : '') + '" style="display: inline-flex; align-items: center; gap: 5px">' + icon('calendar', 13) + (a.due ? esc(isoToUS(a.due)) : 'No due date') + (over ? icon('alert', 13, '', 'Overdue') : '') + '</span>' +
        (a.edited ? '<span class="sep edited">Edited</span>' : '') + '<span class="spacer"></span>' +
        (o.client ? tagChip(a.tag) + clientRef(a.clientId) : '') +
        (o.edit ? '<button type="button" class="icon-btn" data-action="editTask" data-id="' + a.id + '" aria-label="Edit action item">' + icon('edit', 15) + '</button>' +
          '<button type="button" class="icon-btn is-danger" data-action="deleteTask" data-id="' + a.id + '" aria-label="Delete action item">' + icon('trash', 15) + '</button>' : '') +
      '</div></div></li>';
  }

  function filterCards(model, cards) {
    return '<div class="filter-cards" role="group" aria-label="Filter">' + cards.map(function (c) {
      return '<button type="button" class="filter-card" data-action="setFilter" data-model="' + model + '" data-id="' + esc(c.id) + '" aria-pressed="' + (state[model] === c.id) + '">' +
        '<strong>' + c.count + '</strong><span>' + esc(c.label) + '</span>' + icon('funnel', 14) + '</button>';
    }).join('') + '</div>';
  }

  // ---------------------------------------------------------------- My Action Items
  function renderMyActions() {
    var base = state.actions.filter(inColab);
    var personal = base.filter(function (a) { return a.tag === 'PERSONAL'; });
    var shared = base.filter(function (a) { return a.tag !== 'PERSONAL'; });
    var scoped = state.myActionsFilter === 'personal' ? personal : state.myActionsFilter === 'colab' ? shared : base;
    var open = scoped.filter(function (a) { return !a.done; }), over = scoped.filter(isOverdue), done = scoped.filter(function (a) { return a.done; });
    var list = (state.myActionsStatus === 'overdue' ? over : state.myActionsStatus === 'completed' ? done : open).slice()
      .sort(function (a, b) { return state.myActionsStatus === 'completed' ? (a.due < b.due ? 1 : -1) : (a.due < b.due ? -1 : 1); });
    var p = paginate('myActions', list);
    function st(id, label, n, ic) {
      return '<button type="button" class="seg" data-action="setFilter" data-model="myActionsStatus" data-id="' + id + '" aria-pressed="' + (state.myActionsStatus === id) + '">' + (ic ? icon(ic, 13) : '') + label + ' (' + n + ')</button>';
    }
    return '<div class="page-head"><h1 class="page-title">' + icon('inbox', 26) + 'My Action Items</h1></div>' + colabNote() +
      '<section class="panel-card">' +
        filterCards('myActionsFilter', [{ id: 'all', label: 'All action items', count: base.length }, { id: 'personal', label: 'Personal', count: personal.length }, { id: 'colab', label: 'CoLab', count: shared.length }]) +
        '<div class="segmented is-fill is-small" role="group" aria-label="Status">' + st('open', 'Open', open.length) + st('overdue', 'Overdue', over.length, 'alert') + st('completed', 'Completed', done.length) + '</div>' +
        '<ul class="feed">' + (p.items.map(function (a) { return actionRow(a, { client: true, assignee: true }); }).join('') || '<li class="empty">No action items here. Try another filter.</li>') + '</ul>' +
        pagerHtml(p) +
      '</section>';
  }

  // ---------------------------------------------------------------- My Case Notes
  function renderMyNotes() {
    var base = state.notes.filter(inColab);
    var personal = base.filter(function (n) { return n.tag === 'PERSONAL'; });
    var shared = base.filter(function (n) { return n.tag !== 'PERSONAL'; });
    var scoped = state.myNotesFilter === 'personal' ? personal : state.myNotesFilter === 'colab' ? shared : base;
    var list = scoped.slice().sort(byDateDesc);
    if (state.myNotesSort === 'asc') list.reverse();
    var p = paginate('myNotes', list);
    var sortText = state.myNotesSort === 'asc' ? 'Oldest first' : 'Newest first';
    return '<div class="page-head"><h1 class="page-title">' + icon('notes', 26) + 'My Case Notes</h1></div>' + colabNote() +
      '<section class="panel-card">' +
        filterCards('myNotesFilter', [{ id: 'all', label: 'All Case Notes', count: base.length }, { id: 'personal', label: 'Personal', count: personal.length }, { id: 'colab', label: 'CoLab', count: shared.length }]) +
        '<div class="list-head"><button type="button" class="sort-btn" data-action="flipSort" data-model="myNotesSort" aria-label="Date, ' + sortText.toLowerCase() + '. Reverse order">Date ' + icon('sortLines', 14, state.myNotesSort === 'asc' ? 'flip' : '') + '<span>' + sortText + '</span></button></div>' +
        '<ul class="feed">' + (p.items.map(function (n) { return noteRow(n, { client: true, lock: true }); }).join('') || '<li class="empty">No case notes here. Try another filter.</li>') + '</ul>' +
        pagerHtml(p) +
      '</section>';
  }

  // ---------------------------------------------------------------- Starred Clients
  function renderStarred() {
    var starred = state.clients.filter(function (c) { return c.starred && clientInColab(c); });
    var cards = [{ id: 'all', label: 'All clients', count: starred.length }, { id: 'private', label: 'Privately starred', count: starred.filter(function (c) { return c.starred === 'private'; }).length }]
      .concat(D.colabs.map(function (k) { return { id: k.id, label: k.name, count: starred.filter(function (c) { return c.colabs.indexOf(k.id) >= 0; }).length }; }));
    var scoped = starred.filter(function (c) {
      if (state.starredFilter === 'all') return true;
      if (state.starredFilter === 'private') return c.starred === 'private';
      return c.colabs.indexOf(state.starredFilter) >= 0;
    }).map(function (c) { return Object.assign({ sortName: displayName(c), name: displayName(c) }, c); })
      .filter(function (c) { return matches(c, ['name', 'mci', 'ssn4', 'first', 'last'], state.starredQuery); });
    var rows = sortRows(scoped, 'starred', DEFS.starred);
    var p = paginate('starred', rows);
    var head = '<div class="tr is-head" role="row"><div class="th" role="columnheader">Action</div>' +
      headerRow('starred').replace('<div class="tr is-head" role="row">', '').replace(/<\/div>$/, '') +
      '<div class="th" role="columnheader">SSN</div><div class="th" role="columnheader">MCI ID</div><div class="th" role="columnheader">CoLabs</div></div>';
    var rowsHtml = p.items.map(function (c) {
      return '<div class="tr is-row" role="row">' +
        '<div class="td is-tight" role="cell">' + starButton(c, 20) + '</div>' +
        '<div class="td" role="cell"><button type="button" class="link-btn" data-action="openClient" data-id="' + c.id + '">' + esc(c.name) + '</button></div>' +
        '<div class="td" role="cell">' + esc(dobText(c)) + '</div>' +
        '<div class="td" role="cell">' + esc(c.favorited) + '</div>' +
        '<div class="td" role="cell">*' + esc(c.ssn4) + '</div>' +
        '<div class="td" role="cell">' + esc(c.mci) + '</div>' +
        '<div class="td tag-list" role="cell">' + c.colabs.map(function (k) { return '<span class="chip-tag">' + esc(colabTag(k)) + '</span>'; }).join('') + '</div>' +
      '</div>';
    }).join('');
    return '<div class="page-head"><h1 class="page-title">' + icon('star', 26) + 'My Starred Clients</h1>' +
        '<button type="button" class="search-launch" data-action="openModal" data-id="search">' + icon('search', 18) + 'Search for Client</button></div>' + colabNote() +
      '<section class="panel-card">' +
        filterCards('starredFilter', cards) +
        '<div class="toolbar"><label class="sr-only" for="starred-search">Search starred clients</label>' +
          '<input class="input is-search" id="starred-search" type="search" placeholder="Search by name, MCI or SSN last 4" data-model="starredQuery" value="' + esc(state.starredQuery) + '"></div>' +
        tableShell('starred', 'Starred clients', 860, rowsHtml, 'No starred clients match. Clear the search or pick another filter.', head) +
        pagerHtml(p) +
      '</section>';
  }

  // ================================================================ client shell
  function renderClientShell(mainHtml, panelHtml) {
    var c = client();
    return '<div class="app"><div class="shell">' +
      '<header class="topbar">' +
        '<a class="brand" href="#home" data-action="nav" data-route="home">' + BRAND_MARK + 'CoLab</a>' +
        '<nav class="top-actions" aria-label="Profile actions">' +
          '<button type="button" class="btn-ghost" data-action="openModal" data-id="issue">' + icon('bug', 16) + 'Report Issue</button>' +
          '<button type="button" class="btn-ghost" data-action="shareProfile">' + icon('mail', 16) + 'Share Profile</button>' +
          '<div class="user-chip">' + icon(c.household ? 'users' : 'user', 20) + '<div><strong>' + esc(fullName(c)) + '</strong><span>MCI ID: ' + esc(c.mci) + '</span></div></div>' +
        '</nav>' +
      '</header>' +
      '<div class="body">' +
        '<nav class="rail" aria-label="Main">' +
          '<a class="rail-btn" href="#home" data-action="nav" data-route="home" aria-label="CoLab Home" data-tip="CoLab Home">' + icon('home', 20) + '</a>' +
          '<a class="rail-btn" href="#my-action-items" data-action="nav" data-route="my-action-items" aria-label="My Action Items" data-tip="My Action Items">' + icon('inbox', 20) + '</a>' +
          '<a class="rail-btn" href="#starred-clients" data-action="nav" data-route="starred-clients" aria-label="Starred Clients" data-tip="Starred Clients">' + icon('star', 20) + '</a>' +
          '<div class="rail-divider"></div>' +
          '<a class="rail-btn" href="' + hashFor({ route: 'client', clientId: c.id, clientPage: 'tabs', tab: 'overview' }) + '" data-action="clientTab" data-id="overview" aria-label="Client profile" aria-current="page" data-tip="Client profile">' + icon('user', 20) + '</a>' +
          '<div class="rail-avatar" aria-label="Signed in as ' + esc(D.user.first + ' ' + D.user.last) + '">' + esc(D.user.initials) + '</div>' +
        '</nav>' +
        '<div class="work' + (panelHtml && !state.panel ? ' is-panel-closed' : '') + '">' +
          '<main class="main" id="main" tabindex="-1" data-scroll-key="main">' + mainHtml + '</main>' +
          (panelHtml || '') +
        '</div>' +
      '</div>' +
    '</div></div>';
  }

  function renderClientHeader(extraCrumb) {
    var c = client();
    var crumbs;
    var clientCrumb = '<span class="crumb">' + icon('users', 15) + 'Client Details</span>';
    if (state.clientPage === 'tabs' && state.view === 'tabs' && !extraCrumb) {
      crumbs = '<span class="crumb" aria-current="page">' + icon('users', 15) + 'Client Details</span>';
    } else {
      var label = extraCrumb || (state.view === 'service' ? 'Service Details' : 'Provider Details');
      var ic = extraCrumb === 'All Case Notes' ? 'notes' : extraCrumb === 'All Action Items' ? 'inbox' : state.view === 'service' ? 'layers' : 'lifebuoy';
      clientCrumb = '<button type="button" class="crumb-link crumb" data-action="backToClient">' + icon('users', 15) + 'Client Details</button>';
      crumbs = clientCrumb + icon('chevronRight', 14) + '<span class="crumb" aria-current="page">' + icon(ic, 15) + esc(label) + '</span>';
    }
    var ssnFull = '123-45-' + c.ssn4;
    return '<nav class="crumbs" aria-label="Breadcrumb"><a class="crumb-link crumb" href="#home" data-action="nav" data-route="home">' + icon('home', 15) + 'Home</a>' + icon('chevronRight', 14) + crumbs + '</nav>' +
      '<section class="client-head" aria-label="Client identity">' +
        '<div class="client-id"><div class="avatar">' + icon(c.household ? 'users' : 'userSolid', 26) + '</div><div>' +
          '<div class="client-name"><h1>' + esc(fullName(c)) + '</h1>' + starButton(c, 24) + '</div>' +
          '<div class="tags">' + c.colabs.map(function (t) { return '<span class="tag">' + esc(colabTag(t)) + '</span>'; }).join('') + '</div>' +
        '</div></div>' +
        '<dl class="ids">' +
          '<div><dt>MCI ID' + tip('About MCI ID', 'Unique value used for DHS identification purposes') + '</dt><dd>' + esc(c.mci) + '</dd></div>' +
          '<div><dt>SSN' + tip('About SSN', 'Unique value across all benefits and services') + '</dt><dd>' +
            '<span>' + (state.ssn ? esc(ssnFull) : '••• •• ' + esc(c.ssn4)) + '</span>' +
            '<button type="button" class="icon-btn" data-action="toggleSsn" aria-pressed="' + state.ssn + '" aria-label="' + (state.ssn ? 'Hide SSN' : 'Show SSN') + '">' + icon('eye', 15) + '</button>' +
            '<button type="button" class="icon-btn is-action" data-action="copy" data-value="' + esc(ssnFull) + '" data-label="SSN" aria-label="Copy SSN">' + icon('copy', 15) + '</button>' +
          '</dd></div>' +
          '<div><dt>MA ID &amp; PA DHS ID' + tip('About MA ID and PA DHS ID', 'This is the individual ID provided by PA DHS') + '</dt><dd>' + esc(c.dhs) + '</dd></div>' +
          '<div><dt>DPW Record #' + tip('About DPW Record number', "Record number from the state's legacy Department of Public Welfare system.") + '</dt><dd>' + esc(c.dpw || ('1' + c.dhs.slice(0, 6) + '78890')) + '</dd></div>' +
        '</dl>' +
      '</section>';
  }

  // ---------------------------------------------------------------- Services tab
  function renderServices() {
    var grouped = state.svcMode === 'grouped';
    var fromKey = state.svcFrom ? state.svcFrom.replace(/-/g, '') : '';
    var rows = D.services.map(function (r) {
      var provs = grouped ? r.grouped : r.all;
      return Object.assign({}, r, { provs: provs, provSort: provs[0] || '' });
    }).filter(function (r) {
      if (state.providerFilter && r.provs.indexOf(state.providerFilter) < 0) return false;
      if (state.programFilter && r.area !== state.programFilter) return false;
      if (state.categoryFilter && r.program !== state.categoryFilter) return false;
      if (fromKey && sortKey(r.last, 'date') < fromKey) return false;
      return matches(r, ['service', 'area', 'program', 'provs'], state.query);
    });
    rows = sortRows(rows, 'svc', DEFS.svc);
    var popCount = (state.categoryFilter ? 1 : 0) + (state.svcFrom ? 1 : 0);
    var anyFilter = !!(String(state.query).trim() || state.providerFilter || state.programFilter || popCount);

    var rowsHtml = rows.map(function (r) {
      var menuOpen = state.menuRow === r.id;
      return '<div class="tr is-row" role="row">' +
        '<div class="td" role="cell">' + esc(r.first) + '</div>' +
        '<div class="td" role="cell">' + esc(r.last) + '</div>' +
        '<div class="td" role="cell">' + esc(r.area) + '</div>' +
        '<div class="td tag-list" role="cell">' + providerTags(r.provs) + '</div>' +
        '<div class="td" role="cell"><button type="button" class="link-btn" data-action="openService" data-name="' + esc(r.service) + '">' + esc(r.service) + '</button></div>' +
        '<div class="td" role="cell">' + esc(r.program) + '</div>' +
        '<div class="td" role="cell">' + esc(r.added) + '</div>' +
        '<div class="td is-tight kebab-cell" role="cell" data-menu-root>' +
          '<button type="button" class="tool-btn" data-action="menu" data-id="' + r.id + '" aria-label="More actions for ' + esc(r.service) + '" aria-expanded="' + menuOpen + '">' + icon('more', 18) + '</button>' +
          (menuOpen ? '<div class="menu">' +
            '<button type="button" class="menu-item" data-action="openService" data-name="' + esc(r.service) + '">View service details</button>' +
            '<button type="button" class="menu-item" data-action="openProvider" data-name="' + esc(r.provs[0] || 'Mercy') + '">View provider details</button>' +
          '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    var categories = ['Behavioral Health', 'Child Welfare', 'Developmental Support', 'Family Strengthening', 'Housing', 'Justice Involvement', 'Physical Health'];
    var popover = state.svcFilterOpen ?
      '<div class="popover" role="dialog" aria-label="More filters">' +
        '<span class="popover-title">More filters</span>' +
        '<label class="field-label" for="svc-category">Program area</label>' +
        '<select class="select" id="svc-category" data-model="categoryFilter"><option value="">Any program area</option>' +
          categories.map(function (c) { return '<option' + (state.categoryFilter === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
        '<label class="field-label" for="svc-from">Last activity on or after</label>' +
        '<input class="input" id="svc-from" type="date" data-model="svcFrom" value="' + esc(state.svcFrom) + '">' +
        '<div class="popover-foot"><button type="button" class="btn-text" data-action="clearSvcFilters">Clear all filters</button><button type="button" class="btn-solid" data-action="toggleSvcFilter">Done</button></div>' +
      '</div>' : '';

    return '<div class="view">' +
      '<div class="view-head"><h2 class="title">' + icon('layers', 26) + 'Services Information</h2>' +
        '<div class="segmented" role="group" aria-label="Service view">' +
          '<button type="button" class="seg" data-action="svcMode" data-id="grouped" aria-pressed="' + grouped + '">Grouped Services</button>' +
          '<button type="button" class="seg" data-action="svcMode" data-id="all" aria-pressed="' + !grouped + '">All Services</button>' +
        '</div></div>' +
      '<dl class="chips">' + TIMELINE_CHIP +
        chip(grouped ? 'Unique Services' : 'All Services', grouped ? '1,234' : '123,450') +
        chip('Total Cost', '$679,000') +
        chip('Associated Providers (13)', providerTags(D.providers)) +
        chip(grouped ? 'Program Areas' : 'Programs', 'Behavioral Health; Housing; Justice') +
      '</dl>' +
      '<div class="toolbar">' +
        searchBox('svc-search', 'query', 'Search services') +
        selectBox('svc-provider', 'providerFilter', 'Provider filter', 'Provider Filter', D.providers) +
        selectBox('svc-program', 'programFilter', 'Program filter', 'Program Filter', [['Substance Use Disorder Services (All)', 'Substance Use Disorder'], ['Mental Health Services (All)', 'Mental Health']]) +
        '<div class="tools" role="toolbar" aria-label="Table tools">' +
          '<button type="button" class="tool-btn" aria-label="Undo" disabled>' + icon('undo', 17) + '</button>' +
          '<button type="button" class="tool-btn" aria-label="Redo" disabled>' + icon('redo', 17) + '</button>' +
          '<span class="tool-sep" aria-hidden="true"></span>' +
          '<button type="button" class="tool-btn" aria-label="Choose columns">' + icon('columns', 17) + '</button>' +
          '<div class="pop-anchor" data-menu-root>' +
            '<button type="button" class="tool-btn' + (popCount ? ' is-on' : '') + '" data-action="toggleSvcFilter" aria-label="More filters" aria-expanded="' + state.svcFilterOpen + '">' + icon('filter', 17) +
              (popCount ? '<span class="badge">' + popCount + '</span>' : '') + '</button>' +
            popover +
          '</div>' +
          '<button type="button" class="tool-btn" aria-label="Row density">' + icon('rows', 17) + '</button>' +
          '<span class="tool-sep" aria-hidden="true"></span>' +
          '<button type="button" class="tool-btn" aria-label="Export table">' + icon('download', 17) + '</button>' +
        '</div>' +
      '</div>' +
      tableShell('svc', 'Services', 1000, rowsHtml, 'No services match these filters. Clear the search or filters to see all services.') +
      '<div class="pager is-start"><span>Rows per page: <strong>10</strong></span><span>' + (anyFilter ? countText(rows.length, D.services.length, 'services') : '1–10 of 300') + '</span>' +
        '<span class="pager-btns"><button type="button" class="tool-btn" aria-label="Previous page" disabled>' + icon('chevronLeft', 16) + '</button><button type="button" class="tool-btn" aria-label="Next page">' + icon('chevronRight', 16) + '</button></span></div>' +
    '</div>';
  }

  // ---------------------------------------------------------------- Client Overview tab
  function renderOverview() {
    var c = client();
    var sub = state.sub;
    var addr = String(c.address || '').split(', ');
    var body;
    var sourceTip = '<span class="tip"><button type="button" class="tip-trigger source-pill" aria-label="About this source: PA DHS">PA DHS</button><span class="tip-box" role="tooltip">This info comes from the benefits funds from the Pennsylvania Department of Human Services (PA DHS)</span></span>';
    if (sub === 'contact') {
      body = '<div class="kv-grid">' +
        '<div class="kv"><div class="kv-label">Address <span>(Most Recent)</span></div>' +
          '<div class="kv-value">' + esc(addr[0] || '') + ',<br>' + esc(addr.slice(1).join(', ')) + '</div>' +
          '<ul class="kv-list">' +
            '<li>' + icon('pin', 14) + 'Allegheny County Jail [facility or building name]</li>' +
            '<li>' + icon('landmark', 14) + 'Ward 15, District 8 (Pittsburgh)</li>' +
            '<li>' + icon('book', 14) + 'Pittsburgh School District</li>' +
          '</ul>' +
          '<div class="source">Source: ' + sourceTip + ' As of 10/14/2026</div></div>' +
        '<div class="kv" style="gap: 18px">' +
          '<div class="kv"><div class="kv-label">Phone Number <span>(Most Recent)</span></div><div class="kv-value num">' + esc(c.phone) + '<span style="color: var(--blue)">' + icon('phone', 16) + '</span></div>' +
            '<div class="source">Source: <span class="source-pill">ACGO</span> As of 09/22/2026</div></div>' +
          '<div class="kv"><div class="kv-label">Email <span>(Most Recent)</span></div><div class="kv-value">' + esc(c.email) + '<span style="color: var(--blue)">' + icon('mail', 16) + '</span></div>' +
            '<div class="source">Source: <span class="source-pill">ACGO</span> As of 09/22/2026</div></div>' +
        '</div></div>';
    } else if (sub === 'demo') {
      var pairs = [['Date of Birth', c.dob ? esc(dobText(c)) : '—'], ['Marital Status', 'Never Married/Single<span class="as-of">As of 06/01/2025</span>'], ['Race', 'White'], ['Ethnicity', 'Not Hispanic/Latinx'], ['Gender', 'Male'], ['Legal Sex', 'Male'],
        ['Living Arrangement', '[Living arrangement]<span class="source" style="margin-top: 4px">Source: <span class="source-pill">ACGO</span> As of 09/22/2026</span>']];
      body = '<dl class="demo-grid">' + pairs.map(function (p) { return '<div><dt>' + p[0] + '</dt><dd>' + p[1] + '</dd></div>'; }).join('') + '</dl>';
    } else {
      body = '<ul class="enroll-list">' + D.enrollments.map(function (e) {
        return '<li class="enroll is-' + e.kind + '"><div class="enroll-top"><div>' +
          '<div class="enroll-name">' + esc(e.name) + '</div>' +
          '<div class="enroll-asof">' + esc(e.asOf) + (e.stale ? '<span style="color: var(--red-text)">' + icon('alert', 13, '', 'Out of date') + '</span>' : '') + '</div></div>' +
          '<span class="status is-' + e.kind + '">' + esc(e.status) + '</span></div>' +
          '<div class="enroll-dates"><span><strong>Start date:</strong> ' + esc(e.start) + '</span>' +
          '<span class="track" aria-hidden="true"><span style="width: ' + e.pct + '%"></span></span>' +
          '<span><strong>End date:</strong> ' + esc(e.end) + '</span></div></li>';
      }).join('') + '</ul>';
    }
    function seg(id, ic, label) {
      return '<button type="button" class="seg" data-action="sub" data-id="' + id + '" aria-pressed="' + (sub === id) + '">' + icon(ic, 18) + label + '</button>';
    }
    return '<div class="view" style="gap: 18px"><h2 class="title">' + icon('user', 24) + 'Client Overview</h2>' +
      '<div class="segmented is-fill" role="group" aria-label="Overview section">' +
        seg('contact', 'building', 'Contact Information') + seg('demo', 'userCircle', 'Demographic Information') + seg('enroll', 'gridPlus', 'Program Enrollment') +
      '</div>' + body + '</div>';
  }

  // ---------------------------------------------------------------- Program Info tab
  function renderProgram() {
    var titles = { justice: 'Justice Involvement', behavioral: 'Behavioral Health', housing: 'Housing' };
    var title = titles[state.program];
    var head = '<h2 class="title" style="font-size: 22px">' + icon('lifebuoy', 22) + 'Program Info</h2>' +
      '<div class="view-head"><h3 class="title-lg">' + esc(title) + tip('About this section', 'Records from Allegheny County courts, the jail and adult probation, matched to this client by MCI ID.') + '</h3>' +
        '<label class="sr-only" for="program-select">Program</label>' +
        '<select class="select is-program" id="program-select" data-model="program">' +
          [['justice', 'Justice'], ['behavioral', 'Behavioral Health'], ['housing', 'Housing']].map(function (o) {
            return '<option value="' + o[0] + '"' + (state.program === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
          }).join('') + '</select></div>';

    if (state.program !== 'justice') {
      return '<div class="view">' + head + '<div class="empty-box"><p>The ' + esc(title) + ' view has not been designed yet. Justice is the only program with records in this prototype.</p></div></div>';
    }

    var cases = sortRows(state.caseFilter === 'dv' ? D.cases.filter(function (c) { return c.dv; }) : D.cases, 'cases', DEFS.cases);
    var caseRows = cases.map(function (c) {
      return '<div class="tr is-row is-ruled" role="row">' +
        '<div class="td" role="cell"><a class="link-btn is-inline" style="padding: 0; text-decoration: none" href="https://ujsportal.pacourts.us/" target="_blank" rel="noopener">' + esc(c.otn) + icon('external', 13) + '<span class="sr-only">(opens UJS Portal)</span></a></div>' +
        '<div class="td" role="cell">' + esc(c.date) + '<small>' + esc(c.agency) + '</small></div>' +
        '<div class="td" role="cell">' + esc(c.filed) + '</div>' +
        '<div class="td" role="cell">' + esc(c.charge) + '</div>' +
        '<div class="td" role="cell">' + esc(c.disp) + '</div>' +
        '<div class="td" role="cell">' + esc(c.next) + '<small>' + esc(c.nextDate) + '</small></div>' +
      '</div>';
    }).join('');
    var dvCount = D.cases.filter(function (c) { return c.dv; }).length;

    var timeline = D.incarceration.map(function (g) {
      return '<div class="timeline-group"><span class="year-pill">' + esc(g.label) + '</span><ol class="timeline">' +
        g.items.map(function (e) {
          var open = !!state.incOpen[e.id];
          var tag = { housing: 'Alternative housing', hold: 'Behavioral Health Hold', prison: 'State Prison' }[e.kind];
          return '<li class="event is-' + e.kind + '"><span class="event-dot" aria-hidden="true"></span><div class="event-card">' +
            '<button type="button" class="event-toggle" data-action="toggleInc" data-id="' + e.id + '" aria-expanded="' + open + '">' +
              '<span class="event-body"><span class="event-title">' + esc(e.title) + '</span>' +
              '<span class="event-meta"><span>' + icon('building', 13) + 'PA Board of Probation &amp; Parole</span></span>' +
              '<span class="event-meta"><span class="event-tag">' + tag + '</span><span>' + esc(e.range) + '</span><span>' + icon('clock', 13) + esc(e.dur) + '</span></span></span>' +
              icon('chevronDown', 18, 'chev' + (open ? ' is-open' : '')) +
            '</button>' +
            (open ? '<dl class="event-details"><div><dt>Facility</dt><dd>' + esc(e.facility) + '</dd></div><div><dt>Admission reason</dt><dd>[Admission reason]</dd></div><div><dt>Release type</dt><dd>[Release type]</dd></div></dl>' : '') +
          '</div></li>';
        }).join('') + '</ol></div>';
    }).join('');

    return '<div class="view" style="gap: 22px">' + head +
      '<div class="card-grid">' +
        '<div class="info-card"><h4>High Risk Flag' + tip('How the high risk flag is set', 'Added when a client has met the following criteria:<ul><li>• Repeat Offender: [criteria]</li><li>• Serious Charge: [criteria]</li><li>• Recidivism Case: [criteria]</li></ul>') + '</h4>' +
          '<ul><li>Repeat Offender</li><li>Serious Charge</li><li>Recidivism Case</li></ul></div>' +
        '<div class="info-card"><h4>Jail Information</h4><dl class="pairs"><dt>DOC Number</dt><dd>0987654321</dd><dt>Docket Number</dt><dd>0987654321</dd><dt>POD Number</dt><dd>14B</dd><dt>POD Level</dt><dd>ABCXYZ</dd></dl></div>' +
        '<div class="info-card"><h4>Justice Involvement</h4><ul><li>Active DV Case</li><li>Adult Criminal Filings: <strong>20</strong></li><li>DV Criminal Filings: <strong>19</strong></li><li>Convictions: <strong>4</strong></li></ul></div>' +
        '<div class="info-card"><h4>Batterers Intervention Program (BIP)</h4><div class="kv-value" style="font-size: 14px; color: var(--slate)">Status: <strong>Active</strong><button type="button" class="icon-btn is-action" aria-label="Open BIP record">' + icon('external', 15) + '</button></div></div>' +
      '</div>' +
      '<section class="view" style="gap: 14px"><h3 class="subtitle">Case History' + tip('About case history', 'Criminal cases filed in Pennsylvania courts. OTN opens the case in the UJS Portal.') + '</h3>' +
        '<div class="filter-pills" role="group" aria-label="Case filter">' +
          '<button type="button" class="filter-pill" data-action="caseFilter" data-id="all" aria-pressed="' + (state.caseFilter === 'all') + '">All (' + D.cases.length + ')</button>' +
          '<button type="button" class="filter-pill" data-action="caseFilter" data-id="dv" aria-pressed="' + (state.caseFilter === 'dv') + '">Domestic Violence Arrests (' + dvCount + ')</button>' +
        '</div>' +
        tableShell('cases', 'Case history', 760, caseRows, 'No cases match this filter.') +
      '</section>' +
      '<section class="view" style="gap: 14px"><h3 class="subtitle">Probation Information' + tip('About probation information', 'From Allegheny County Adult Probation. Updated nightly.') + '</h3>' +
        '<div class="card-grid">' +
          '<dl class="info-card pairs is-small"><dt>Status</dt><dd>Active</dd><dt>Unit</dt><dd>McKeesport</dd><dt>Probation Officer</dt><dd>Jam, James</dd></dl>' +
          '<dl class="info-card pairs is-small"><dt>Last Intake</dt><dd>09/09/2025</dd><dt>Last Active Date</dt><dd>09/09/2025</dd></dl>' +
        '</div></section>' +
      '<section class="view" style="gap: 16px"><h3 class="subtitle">Incarceration History' + tip('About incarceration history', 'Custody events from the county jail and the PA Board of Probation and Parole, newest first.') + '</h3>' +
        '<dl class="stats"><div><dt>Total Time in Custody</dt><dd>17 yrs 5 mo</dd></div><div><dt>Custody Events</dt><dd>19</dd></div><div><dt>Facilities</dt><dd>12</dd></div></dl>' +
        timeline +
      '</section>' +
    '</div>';
  }

  // ---------------------------------------------------------------- Providers tab
  function renderProviders() {
    var rows = sortRows(D.providerSummary.filter(function (r) {
      return (!state.provProgram || r.program === state.provProgram) && matches(r, ['provider', 'program', 'dx', 'facility', 'status'], state.provQuery);
    }), 'prov', DEFS.prov);
    var rowsHtml = rows.map(function (r) {
      return '<div class="tr is-row" role="row">' +
        '<div class="td is-tight" role="cell"><button type="button" class="link-btn" data-action="openProvider" data-name="' + esc(r.provider) + '">' + esc(r.provider) + '</button></div>' +
        ['program', 'first', 'last', 'dx', 'facility', 'units', 'status', 'rate', 'rateType', 'cost'].map(function (k) { return '<div class="td is-tight" role="cell">' + esc(r[k]) + '</div>'; }).join('') +
      '</div>';
    }).join('');
    return '<div class="view" style="gap: 18px"><h2 class="title">' + icon('lifebuoy', 22) + 'Providers</h2>' +
      '<dl class="chips">' + TIMELINE_CHIP + chip('Service Instances', '1,234') + chip('Total Cost', '$30,000') + chip('Programs', 'Behavioral Health; Housing; Justice') + chip('Facilities Used', '12') + '</dl>' +
      '<div class="toolbar">' + searchBox('prov-search', 'provQuery', 'Search providers') + selectBox('prov-program', 'provProgram', 'Program filter', 'Program Filter', PROGRAMS) + '</div>' +
      tableShell('prov', 'Providers', 980, rowsHtml, 'No providers match these filters. Clear the search or program filter to see all providers.') +
      '<div class="pager is-start">' + esc(countText(rows.length, D.providerSummary.length, 'providers')) + '</div>' +
    '</div>';
  }

  function renderBenefits() {
    return '<div class="empty-box"><h2 class="title" style="font-size: 18px; font-weight: 600">Benefits</h2>' +
      '<p>This tab is not designed yet. Benefit enrollments currently show under Client Overview › Program Enrollment.</p></div>';
  }

  // ---------------------------------------------------------------- Service and provider details
  function renderServiceDetail() {
    var rows = sortRows(D.serviceInstances.filter(function (r) {
      return (!state.sdProvider || r.provider === state.sdProvider) && (!state.sdProgram || r.program === state.sdProgram) &&
        matches(r, ['provider', 'program', 'dx', 'facility', 'status'], state.sdQuery);
    }), 'sd', DEFS.sd);
    var rowsHtml = rows.map(function (r) {
      return '<div class="tr is-row" role="row">' + DEFS.sd.map(function (d) { return '<div class="td is-tight" role="cell">' + esc(r[d.key]) + '</div>'; }).join('') + '</div>';
    }).join('');
    var providerOptions = D.serviceInstances.map(function (r) { return r.provider; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    return '<div class="view is-detail"><h2 class="title">' + icon('layers', 26) + 'Service: ' + esc(state.service) + '</h2>' +
      '<dl class="chips">' + TIMELINE_CHIP + chip('Service Instances', '1,234') + chip('Total Cost <span>(All Services)</span>', '$30,000') +
        chip('Associated Providers (13)', providerTags(D.providers)) + chip('Programs', 'Behavioral Health; Housing; Justice') + '</dl>' +
      '<div class="toolbar">' + searchBox('sd-search', 'sdQuery', 'Search service instances') +
        selectBox('sd-provider', 'sdProvider', 'Provider filter', 'Provider Filter', providerOptions) +
        selectBox('sd-program', 'sdProgram', 'Program filter', 'Program Filter', PROGRAMS) + '</div>' +
      tableShell('sd', 'Service instances', 980, rowsHtml, 'No service instances match these filters. Clear the search or filters to see all of them.') +
      staticPager(countText(rows.length, D.serviceInstances.length, 'service instances')) +
    '</div>';
  }
  function renderProviderDetail() {
    var rows = sortRows(D.providerServices.filter(function (r) {
      return (!state.pdProgram || r.program === state.pdProgram) && matches(r, ['service', 'program', 'facility', 'status'], state.pdQuery);
    }), 'pd', DEFS.pd);
    var rowsHtml = rows.map(function (r) {
      return '<div class="tr is-row" role="row">' +
        '<div class="td is-tight" role="cell"><button type="button" class="link-btn" data-action="openService" data-name="' + esc(r.service) + '">' + esc(r.service) + '</button></div>' +
        DEFS.pd.slice(1).map(function (d) { return '<div class="td is-tight" role="cell">' + esc(r[d.key]) + '</div>'; }).join('') +
      '</div>';
    }).join('');
    return '<div class="view is-detail"><h2 class="title">' + icon('lifebuoy', 24) + 'Provider: ' + esc(state.provider) + '</h2>' +
      '<dl class="chips" style="gap: 14px 48px">' +
        '<div class="kv" style="gap: 4px"><dt class="kv-label" style="font-size: 10px">Main Address</dt><dd style="font-size: 12px; color: var(--black)">950 Second Avenue,<br>Pittsburgh, PA 15219</dd></div>' +
        '<div class="kv" style="gap: 4px"><dt class="kv-label" style="font-size: 10px">Main Phone Number</dt><dd class="kv-value num" style="font-size: 12px; gap: 6px">(412) 123-4567<span style="color: var(--blue)">' + icon('phone', 14) + '</span></dd></div>' +
        '<div class="kv" style="gap: 4px"><dt class="kv-label" style="font-size: 10px">Main Email</dt><dd class="kv-value" style="font-size: 12px; gap: 6px">thisisafakeemail@gmail.com<span style="color: var(--blue)">' + icon('mail', 14) + '</span></dd></div>' +
      '</dl>' +
      '<dl class="chips">' + TIMELINE_CHIP + chip('Service Instances', '1,234') + chip('Total Cost', '$30,000') + chip('Programs', 'Behavioral Health; Housing; Justice') + chip('Facilities Used', '12') + '</dl>' +
      '<div class="toolbar">' + searchBox('pd-search', 'pdQuery', "Search this provider's services") + selectBox('pd-program', 'pdProgram', 'Program filter', 'Program Filter', PROGRAMS) + '</div>' +
      tableShell('pd', 'Services from this provider', 920, rowsHtml, 'No services from this provider match these filters. Clear the search or program filter to see all of them.') +
      staticPager(countText(rows.length, D.providerServices.length, 'services')) +
    '</div>';
  }

  // ---------------------------------------------------------------- Client profile (tabs)
  function renderClientTabs() {
    var inner;
    if (state.view === 'service') inner = renderServiceDetail();
    else if (state.view === 'provider') inner = renderProviderDetail();
    else {
      var c = client();
      var tabs = '<div class="tabs-wrap"><nav class="tabs" aria-label="Client sections">' + CLIENT_TABS.map(function (t) {
        return '<a class="tab" href="' + hashFor({ route: 'client', clientId: c.id, clientPage: 'tabs', tab: t[0] }) + '" data-action="clientTab" data-id="' + t[0] + '"' + (state.tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
      }).join('') + '</nav></div>';
      var views = { services: renderServices, overview: renderOverview, 'program-info': renderProgram, providers: renderProviders, benefits: renderBenefits };
      inner = tabs + views[state.tab]();
    }
    return renderClientHeader() + '<section class="card">' + inner + '</section>';
  }

  // ---------------------------------------------------------------- Client: All Case Notes
  function clientNotes() {
    var dir = state.noteSort === 'asc' ? 1 : -1;
    return state.notes.filter(function (n) { return n.clientId === state.clientId; }).sort(function (a, b) {
      var x = sortKey(a.date, 'date'), y = sortKey(b.date, 'date');
      return x < y ? -dir : x > y ? dir : 0;
    });
  }
  function clientActions() { return state.actions.filter(function (a) { return a.clientId === state.clientId; }); }

  function noteComposer(isPage) {
    if (!state.composingNote) return '';
    var meta = isPage
      ? '<div class="composer-meta"><strong>' + (state.editingNote ? 'Edit Case Note' : 'Add New Case Note') + '</strong>' +
          (state.noteRestricted ? '<span class="sep lock is-restricted">' + icon('lock', 14) + 'Restricted</span>' : '<span class="sep lock is-open">' + icon('unlock', 14) + 'Unrestricted</span>') +
          '<span class="sep">' + esc(isoToUS(todayISO())) + '</span><span class="sep">' + esc(D.user.first + ' ' + D.user.last) + ' (' + esc(D.user.org) + ')</span></div>'
      : '';
    var label = isPage ? '<label class="sr-only" for="note-draft">Case note</label>' : '<label class="field-label" for="note-draft">' + (state.editingNote ? 'Edit case note' : 'New case note') + '</label>';
    var foot = isPage
      ? '<div class="composer-foot is-split"><button type="button" class="btn-text" data-action="cancelNote">Cancel</button>' +
          '<span style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap">' +
            '<label class="toggle" for="note-restricted">Restricted note <input type="checkbox" id="note-restricted" data-model-check="noteRestricted"' + (state.noteRestricted ? ' checked' : '') + '></label>' +
            '<button type="button" class="btn-primary" data-action="saveNote">Save</button></span></div>'
      : '<div class="composer-foot"><button type="button" class="btn-text" data-action="cancelNote">Cancel</button><button type="button" class="btn-outline is-wide" data-action="saveNote">Save</button></div>';
    return '<div class="composer' + (isPage ? ' is-page' : '') + '">' + meta + label +
      '<textarea class="input is-block" id="note-draft" rows="' + (isPage ? 4 : 3) + '" placeholder="Enter case note" data-model="noteDraft">' + esc(state.noteDraft) + '</textarea>' +
      (state.noteError ? '<span class="error" role="alert">Write the note before saving.</span>' : '') + foot + '</div>';
  }

  function renderClientNotesPage() {
    var list = clientNotes();
    var p = paginate('clientNotes', list);
    var sortText = state.noteSort === 'asc' ? 'Oldest first' : 'Newest first';
    return renderClientHeader('All Case Notes') +
      '<section class="list-card" aria-labelledby="all-notes-h">' +
        '<div class="card-head"><h2 class="card-title" id="all-notes-h">' + icon('notes', 22) + 'All Case Notes <span>(' + plural(list.length, 'note', 'notes') + ')</span></h2>' +
          (state.composingNote ? '' : '<button type="button" class="btn-outline" data-action="addNote">' + icon('plusCircle', 16) + 'Add New Case Note</button>') + '</div>' +
        noteComposer(true) +
        '<div class="list-head"><button type="button" class="sort-btn" data-action="noteSort" aria-label="Date, ' + sortText.toLowerCase() + '. Reverse order">Date ' + icon('sortLines', 14, state.noteSort === 'asc' ? 'flip' : '') + '<span>' + sortText + '</span></button></div>' +
        '<ul class="feed">' + (p.items.map(function (n) { return noteRow(n, { lock: true, edit: true }); }).join('') || '<li class="empty">No case notes for this client yet. Add the first one above.</li>') + '</ul>' +
        pagerHtml(p) +
      '</section>';
  }

  function actionComposer() {
    if (!state.composingAction) return '';
    return '<div class="composer">' +
      '<label class="sr-only" for="action-draft">Action item</label><input class="input is-block" id="action-draft" type="text" placeholder="Enter action item here" data-model="aDraft" value="' + esc(state.aDraft) + '">' +
      '<div class="composer-row"><label class="sr-only" for="action-assignee">Assignee (optional)</label><input class="input" id="action-assignee" type="text" placeholder="Enter assignee (optional)" data-model="aAssignee" value="' + esc(state.aAssignee) + '">' +
      '<label class="sr-only" for="action-due">Due date (optional)</label><input class="input" id="action-due" type="date" data-model="aDue" value="' + esc(state.aDue) + '"></div>' +
      (state.actionError ? '<span class="error" role="alert">Describe the action item before saving.</span>' : '') +
      '<div class="composer-foot"><button type="button" class="btn-text" data-action="cancelTask">Cancel</button><button type="button" class="btn-outline is-wide" data-action="saveTask">Save</button></div></div>';
  }

  function renderClientActionsPage() {
    var all = clientActions();
    var open = all.filter(function (a) { return !a.done; }), over = all.filter(isOverdue), done = all.filter(function (a) { return a.done; });
    var list = (state.clientActionStatus === 'overdue' ? over : state.clientActionStatus === 'completed' ? done : open).slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var p = paginate('clientActions', list);
    function st(id, label, n, ic) {
      return '<button type="button" class="seg" data-action="setFilter" data-model="clientActionStatus" data-id="' + id + '" aria-pressed="' + (state.clientActionStatus === id) + '">' + (ic ? icon(ic, 13) : '') + label + ' (' + n + ')</button>';
    }
    return renderClientHeader('All Action Items') +
      '<section class="list-card" aria-labelledby="all-actions-h">' +
        '<div class="card-head"><h2 class="card-title" id="all-actions-h">' + icon('inbox', 22) + 'Action Items <span>(' + plural(all.length, 'item', 'items') + ')</span></h2>' +
          (state.composingAction ? '' : '<button type="button" class="btn-outline" data-action="addTask">' + icon('plusCircle', 16) + 'Add New Action Item</button>') + '</div>' +
        actionComposer() +
        '<div class="segmented is-fill is-small" role="group" aria-label="Status">' + st('open', 'Open', open.length) + st('overdue', 'Overdue', over.length, 'alert') + st('completed', 'Completed', done.length) + '</div>' +
        '<ul class="feed">' + (p.items.map(function (a) { return actionRow(a, { edit: true, assignee: true }); }).join('') || '<li class="empty">No action items here. Try another status or add one above.</li>') + '</ul>' +
        pagerHtml(p) +
      '</section>';
  }

  // ---------------------------------------------------------------- Client notes panel
  function renderPanel() {
    if (!state.panel) {
      return '<aside class="panel-rail" aria-label="Case notes and action items">' +
        '<button type="button" class="rail-btn" data-action="openPanel" aria-label="Expand case notes and action items" aria-expanded="false" style="color: var(--slate)">' + icon('chevronLeft', 18) + '</button>' +
        '<button type="button" class="rail-btn" data-action="openPanel" aria-label="Open case notes" style="color: var(--slate)">' + icon('notes', 20) + '</button>' +
        '<button type="button" class="rail-btn" data-action="openPanel" aria-label="Open action items" style="color: var(--slate)">' + icon('inbox', 20) + '</button>' +
      '</aside>';
    }
    var c = client();
    var notes = clientNotes();
    var shownNotes = notes.slice(0, 5);
    var notesHtml = shownNotes.map(function (n) {
      var open = !!state.noteOpen[n.id];
      var text = open
        ? '<p class="note-full">' + esc(n.text) + ' <button type="button" class="more-btn" data-action="toggleNote" data-id="' + n.id + '" aria-expanded="true">Show less</button></p>'
        : '<div class="note-clamp"><span>' + esc(n.text) + '</span><button type="button" class="more-btn" data-action="toggleNote" data-id="' + n.id + '" aria-expanded="false">Show more</button></div>';
      return '<li class="note">' + text + '<div class="meta"><span>' + esc(n.date) + '</span>' +
        (n.edited ? '<span class="sep edited">Edited</span>' : '') + '<span class="spacer"></span>' +
        '<button type="button" class="icon-btn" data-action="editNote" data-id="' + n.id + '" aria-label="Edit note from ' + esc(n.date) + '">' + icon('edit', 15) + '</button>' +
        '<button type="button" class="icon-btn is-danger" data-action="deleteNote" data-id="' + n.id + '" aria-label="Delete note from ' + esc(n.date) + '">' + icon('trash', 15) + '</button>' +
      '</div></li>';
    }).join('') || '<li class="empty" style="font-size: 12px">No case notes yet.</li>';

    var acts = clientActions();
    var counts = {
      all: acts.length,
      open: acts.filter(function (a) { return !a.done; }).length,
      overdue: acts.filter(isOverdue).length,
      completed: acts.filter(function (a) { return a.done; }).length
    };
    var shown = acts.filter(function (a) {
      return state.actionFilter === 'all' ? true : state.actionFilter === 'open' ? !a.done : state.actionFilter === 'overdue' ? isOverdue(a) : a.done;
    }).slice(0, 5);
    var actionsHtml = shown.map(function (a) {
      var over = isOverdue(a);
      return '<li class="task' + (a.done ? ' is-done' : '') + '">' +
        '<input type="checkbox" id="ai-' + a.id + '" data-action="toggleTask" data-id="' + a.id + '"' + (a.done ? ' checked' : '') + '>' +
        '<div class="task-body"><label class="task-text" for="ai-' + a.id + '">' + esc(a.text) + '</label>' +
        '<div class="meta"><span>' + esc(a.assignee) + '</span>' +
          '<span class="sep' + (over ? ' is-overdue' : '') + '">' + icon('calendar', 13) + (a.due ? esc(isoToUS(a.due)) : 'No due date') + (over ? icon('alert', 13, '', 'Overdue') : '') + '</span>' +
          (a.edited ? '<span class="sep edited">Edited</span>' : '') + '<span class="spacer"></span>' +
          '<button type="button" class="icon-btn" data-action="editTask" data-id="' + a.id + '" aria-label="Edit action item">' + icon('edit', 15) + '</button>' +
          '<button type="button" class="icon-btn is-danger" data-action="deleteTask" data-id="' + a.id + '" aria-label="Delete action item">' + icon('trash', 15) + '</button>' +
        '</div></div></li>';
    }).join('') || '<li class="empty" style="font-size: 12px">Nothing here. Switch filters or add an action item.</li>';

    function af(id, label, ic) {
      return '<button type="button" class="seg" data-action="actionFilter" data-id="' + id + '" aria-pressed="' + (state.actionFilter === id) + '">' + (ic ? icon(ic, 13) : '') + label + ' (' + counts[id] + ')</button>';
    }
    var noteSortText = state.noteSort === 'asc' ? 'Oldest first' : 'Newest first';
    var notesHash = hashFor({ route: 'client', clientId: c.id, clientPage: 'notes' });
    var actionsHash = hashFor({ route: 'client', clientId: c.id, clientPage: 'actions' });

    return '<aside class="panel" aria-label="Case notes and action items" data-scroll-key="panel">' +
      '<div class="panel-head"><button type="button" class="rail-btn" data-action="closePanel" aria-label="Collapse case notes and action items" aria-expanded="true">' + icon('chevronRight', 18) + '</button>' +
        '<span class="private-pill">Only visible to you</span></div>' +
      '<section class="panel-section" aria-labelledby="notes-h">' +
        '<div class="panel-title-row"><h2 class="panel-title" id="notes-h">' + icon('notes', 20) + 'Case Notes <span>(' + shownNotes.length + ' of ' + plural(notes.length, 'note', 'notes') + ')</span></h2>' +
          '<a class="link-btn is-small is-inline" href="' + notesHash + '" data-action="clientPage" data-id="notes">' + icon('external', 14) + 'View All Case Notes</a></div>' +
        '<div class="list-head"><button type="button" class="sort-btn" data-action="noteSort" aria-label="Date, ' + noteSortText.toLowerCase() + '. Reverse order">Date ' + icon('sortLines', 14, state.noteSort === 'asc' ? 'flip' : '') + '<span>' + noteSortText + '</span></button></div>' +
        '<ul class="scroll-list" data-scroll-key="notes">' + notesHtml + '</ul>' +
        (state.composingNote ? noteComposer(false) : '<div class="align-end"><button type="button" class="btn-outline" data-action="addNote">' + icon('plusCircle', 16) + 'Add New Case Note</button></div>') +
      '</section>' +
      '<section class="panel-section" aria-labelledby="actions-h">' +
        '<div class="panel-title-row"><h2 class="panel-title" id="actions-h">' + icon('inbox', 20) + 'Action Items <span>(' + shown.length + ' of ' + plural(acts.length, 'item', 'items') + ')</span></h2>' +
          '<a class="link-btn is-small is-inline" href="' + actionsHash + '" data-action="clientPage" data-id="actions">' + icon('external', 14) + 'View All Action Items</a></div>' +
        '<div class="segmented is-fill is-small" role="group" aria-label="Show action items">' +
          af('all', 'All') + af('open', 'Open') + af('overdue', 'Overdue', 'alert') + af('completed', 'Completed') +
        '</div>' +
        '<ul class="scroll-list" data-scroll-key="tasks">' + actionsHtml + '</ul>' +
        (state.composingAction ? actionComposer() : '<div class="align-end"><button type="button" class="btn-outline" data-action="addTask">' + icon('plusCircle', 16) + 'Add New Action Item</button></div>') +
      '</section>' +
    '</aside>';
  }

  // ================================================================ modals
  function modalShell(id, title, intro, body, narrow, titleIcon) {
    return '<div class="modal-backdrop" data-action="backdrop">' +
      '<div class="modal' + (narrow ? ' is-narrow' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-title">' +
        '<div class="modal-head"><div><h2 id="' + id + '-title">' + (titleIcon ? icon(titleIcon, 22) : '') + esc(title) + '</h2>' + (intro ? '<p>' + esc(intro) + '</p>' : '') + '</div>' +
          '<button type="button" class="modal-close" data-action="closeModal" aria-label="Close">' + icon('x', 22) + '</button></div>' +
        body +
      '</div></div>';
  }
  function field(id, label, model, value, opts) {
    opts = opts || {};
    return '<div class="field' + (opts.wide ? ' is-wide' : '') + '"><div class="field-top"><span class="field-name"><label for="' + id + '">' + esc(label) + '</label>' + (opts.tip || '') + '</span>' + (opts.required ? '<span class="req">Required</span>' : '') + '</div>' +
      (opts.textarea
        ? '<textarea class="input" id="' + id + '" rows="3" placeholder="' + esc(opts.placeholder || '') + '" data-form-model="' + model + '">' + esc(value) + '</textarea>'
        : '<input class="input" id="' + id + '" type="' + (opts.type || 'text') + '" placeholder="' + esc(opts.placeholder || '') + '" data-form-model="' + model + '" value="' + esc(value) + '"' + (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : '') + (opts.maxlength ? ' maxlength="' + opts.maxlength + '"' : '') + (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') + '>') +
      '</div>';
  }

  function runSearch(q) {
    var digits = function (s) { return String(s || '').replace(/\D/g, ''); };
    return state.clients.filter(function (c) {
      if (q.first && (c.first.toLowerCase().indexOf(q.first.toLowerCase()) < 0)) return false;
      if (q.last && (c.last.toLowerCase().indexOf(q.last.toLowerCase()) < 0)) return false;
      if (q.phone && digits(c.phone).indexOf(digits(q.phone)) < 0) return false;
      if (q.email && c.email.toLowerCase().indexOf(q.email.toLowerCase()) < 0) return false;
      if (q.mci && c.mci.toLowerCase().indexOf(q.mci.toLowerCase()) < 0) return false;
      if (q.dhs && c.dhs.indexOf(digits(q.dhs)) < 0) return false;
      if (q.ssn && c.ssn4 !== digits(q.ssn).slice(-4)) return false;
      return true;
    }).sort(function (a, b) { return displayName(a).localeCompare(displayName(b)); });
  }
  var TOO_MANY = 15;

  function renderSearchModal() {
    var s = state.search;
    var form = '<form class="view" style="gap: 16px" data-form="search" novalidate>' +
      '<div class="notice"><span>' + icon('alert', 18) + '</span><p>Sensitive cases have been intentionally excluded from Client View during this pilot. If you\'re unable to find a client you expect to see, please complete this form.</p>' +
        '<button type="button" class="btn-outline" data-action="openModal" data-id="missing">Report Missing Client</button></div>' +
      '<div class="form-grid">' +
        field('s-first', 'First Name', 'search.first', s.first, { placeholder: 'Enter first name', autocomplete: 'off' }) +
        field('s-last', 'Last Name', 'search.last', s.last, { placeholder: 'Enter last name', autocomplete: 'off' }) +
        field('s-phone', 'Phone Number', 'search.phone', s.phone, { placeholder: '(___) ___-____', type: 'tel', inputmode: 'tel', autocomplete: 'off' }) +
        field('s-email', 'Email', 'search.email', s.email, { placeholder: 'email@domain.com', type: 'email', autocomplete: 'off' }) +
      '</div><div class="form-grid is-3">' +
        field('s-mci', 'MCI ID', 'search.mci', s.mci, { placeholder: 'Enter MCI', tip: tip('About MCI ID', 'Unique value used for DHS identification purposes'), autocomplete: 'off' }) +
        field('s-dhs', 'MA ID or PA DHS ID', 'search.dhs', s.dhs, { placeholder: 'Enter PA DHS ID (10 digits)', inputmode: 'numeric', tip: tip('About MA ID or PA DHS ID', 'This is the individual ID provided by PA DHS'), autocomplete: 'off' }) +
        field('s-ssn', 'Social Security Number (SSN)', 'search.ssn', s.ssn, { placeholder: 'Enter last 4 digits of SSN', inputmode: 'numeric', maxlength: 4, tip: tip('About SSN', 'Unique value across all benefits and services'), autocomplete: 'off' }) +
      '</div>' +
      '<div class="modal-foot">' +
        (state.searchRun ? '<span class="result-count" role="status">' + (function () { var n = runSearch(state.searchRun).length; return n > TOO_MANY ? n + ' client matches found' : plural(n, 'client match', 'client matches') + ' found'; })() + '</span>' : (state.searchError ? '<span class="field-error" role="alert">' + esc(state.searchError) + '</span>' : '<span></span>')) +
        '<button type="submit" class="btn-primary" style="min-width: 190px">Search</button></div>' +
      '</form>';

    var results;
    if (!state.searchRun) {
      results = tableShell('search', 'Search results', 760, '', '', searchHead()) .replace('<p class="empty"></p>', '<p class="empty">Search for Clients</p>');
    } else {
      var list = runSearch(state.searchRun);
      if (list.length > TOO_MANY) {
        results = tableShell('search', 'Search results', 760, '', '', searchHead()).replace('<p class="empty"></p>',
          '<div class="empty-state">' + icon('database', 44) + '<strong>Too many search results to load!</strong><span>Please narrow your search criteria by including more data about your client.</span></div>');
      } else if (!list.length) {
        results = tableShell('search', 'Search results', 760, '', '', searchHead()).replace('<p class="empty"></p>',
          '<div class="empty-state">' + icon('question', 44) + '<strong>No clients match this search.</strong><span>Check the spelling, try fewer fields, or report the client as missing.</span></div>');
      } else {
        var p = paginate('search', list);
        results = tableShell('search', 'Search results', 760, p.items.map(function (c) {
          return '<div class="tr is-row" role="row">' +
            '<div class="td is-tight" role="cell">' + starButton(c, 20) + '</div>' +
            '<div class="td" role="cell"><button type="button" class="link-btn" data-action="openClient" data-id="' + c.id + '">' + esc(displayName(c)) + '</button><small>' + esc(dobText(c)) + '</small></div>' +
            '<div class="td" role="cell">MCI: ' + esc(c.mci) + '<small>SSN: *' + esc(c.ssn4) + '</small></div>' +
            '<div class="td" role="cell">Phone: ' + esc(c.phone) + '<small style="overflow-wrap: anywhere">Email: ' + esc(c.email) + '</small></div>' +
            '<div class="td" role="cell">' + esc(c.address.split(', ')[0]) + ',<small>' + esc(c.address.split(', ').slice(1).join(', ')) + '</small></div>' +
          '</div>';
        }).join(''), '', searchHead()) + pagerHtml(p, [10, 25]);
      }
    }
    return modalShell('search', 'Search for Clients', 'Use one or more fields to search all DHS clients in the database.', form + results);
  }
  function searchHead() {
    return '<div class="tr is-head" role="row">' + ['Starred', 'Client Details', 'IDs', 'Contact Info', 'Address'].map(function (h) { return '<div class="th" role="columnheader">' + h + '</div>'; }).join('') + '</div>';
  }

  function renderMissingModal() {
    var m = state.missing;
    if (state.missingSent) {
      return modalShell('missing', 'Report Missing Client', '', '<div class="success">' + icon('check', 40) + '<strong>Thanks. We got your request.</strong><span>We\'ll look for ' + esc(m.first + ' ' + m.last) + ' and email you at ' + esc(m.email) + '.</span></div>' +
        '<div class="modal-foot"><button type="button" class="btn-text" data-action="openModal" data-id="search">Back to search</button><button type="button" class="btn-primary" data-action="closeModal">Done</button></div>', true);
    }
    var ready = m.first.trim() && m.last.trim() && m.dob && m.name.trim() && m.email.trim();
    var body = '<form class="view" style="gap: 18px" data-form="missing" novalidate>' +
      '<h3 class="section-label">Who is the client are you trying to access?</h3>' +
      '<div class="form-grid is-2">' +
        field('m-first', 'First Name', 'missing.first', m.first, { placeholder: 'Enter first name', required: true }) +
        field('m-last', 'Last Name', 'missing.last', m.last, { placeholder: 'Enter last name', required: true }) +
      '</div><div class="form-grid is-3">' +
        field('m-dob', 'Date of Birth', 'missing.dob', m.dob, { type: 'date', required: true }) +
        field('m-dhs', 'MA ID or PA DHS ID', 'missing.dhs', m.dhs, { placeholder: 'Enter PA DHS ID (10 digits)', inputmode: 'numeric', tip: tip('About MA ID or PA DHS ID', 'This is the individual ID provided by PA DHS') }) +
        field('m-ssn', 'Social Security Number (SSN)', 'missing.ssn', m.ssn, { placeholder: 'Enter last 4 digits of SSN', inputmode: 'numeric', maxlength: 4, tip: tip('About SSN', 'Unique value across all benefits and services') }) +
        field('m-other', 'Other identifying info', 'missing.other', m.other, { placeholder: 'Enter any other information that would be helpful for us', textarea: true, wide: true }) +
      '</div>' +
      '<h3 class="section-label">Your information</h3>' +
      '<div class="form-grid is-2">' +
        field('m-name', 'Name', 'missing.name', m.name, { required: true, autocomplete: 'name' }) +
        field('m-email', 'Email', 'missing.email', m.email, { type: 'email', required: true, autocomplete: 'email' }) +
      '</div>' +
      '<div class="modal-foot"><button type="button" class="btn-text" data-action="openModal" data-id="search">Go back</button>' +
        '<button type="submit" class="btn-primary"' + (ready ? '' : ' disabled') + '>Submit Issue</button></div>' +
      (ready ? '' : '<p class="req" style="text-align: right">Fill in the required fields to submit.</p>') +
    '</form>';
    return modalShell('missing', 'Report Missing Client', 'If you can\'t see a particular client during this Client View pilot, please complete this form.', body, true);
  }

  function renderIssueModal() {
    var s = state.issue;
    if (state.issueSent) {
      return modalShell('issue', 'Report an Issue', '', '<div class="success">' + icon('check', 40) + '<strong>Thanks for telling us.</strong><span>We\'ll follow up at ' + esc(s.email) + ' if we need more detail.</span></div>' +
        '<div class="modal-foot"><button type="button" class="btn-primary" data-action="closeModal">Done</button></div>', true, 'wrench');
    }
    var ready = s.type && s.details.trim() && s.name.trim() && s.email.trim();
    var body = '<form class="view" style="gap: 18px" data-form="issue" novalidate>' +
      '<div class="view" style="gap: 10px"><h3 class="section-label" id="issue-type-label">What kind of issue do you want to tell us about? <span style="font-weight: 400">(select one)</span></h3>' +
        '<div class="choice-row" role="group" aria-labelledby="issue-type-label">' + ['Bug', 'Improvement', 'Data Fix'].map(function (t) {
          return '<button type="button" class="choice" data-action="issueType" data-id="' + t + '" aria-pressed="' + (s.type === t) + '">' + t + '</button>';
        }).join('') + '</div></div>' +
      field('i-details', 'Please give us more details about the issue', 'issue.details', s.details, { textarea: true, placeholder: 'Enter issue description', wide: true }) +
      '<h3 class="section-label">What contact information can we use to get in touch?</h3>' +
      '<div class="form-grid is-2">' +
        field('i-name', 'Name', 'issue.name', s.name, { autocomplete: 'name' }) +
        field('i-email', 'Email', 'issue.email', s.email, { type: 'email', autocomplete: 'email' }) +
      '</div>' +
      '<div class="modal-foot"><span></span><button type="submit" class="btn-primary"' + (ready ? '' : ' disabled') + '>Submit Issue</button></div>' +
    '</form>';
    return modalShell('issue', 'Report an Issue', 'Let us know what we need to update. Your feedback will help improve the experiences of all the users involved.', body, true, 'wrench');
  }

  function renderModal() {
    if (state.modal === 'search') return renderSearchModal();
    if (state.modal === 'missing') return renderMissingModal();
    if (state.modal === 'issue') return renderIssueModal();
    return '';
  }

  // ================================================================ render (keeps focus and scroll)
  function render() {
    var active = document.activeElement;
    var focusId = active && active.id && active.id !== 'main' ? active.id : null;
    var focusKey = !focusId && active && active.dataset && active.dataset.action ? active.dataset.action + '|' + (active.dataset.id || active.dataset.key || active.dataset.name || active.dataset.route || '') : null;
    var selStart = null, selEnd = null;
    try { if (focusId && typeof active.selectionStart === 'number') { selStart = active.selectionStart; selEnd = active.selectionEnd; } } catch (e) { /* date inputs throw */ }
    var scrolls = {};
    document.querySelectorAll('[data-scroll-key]').forEach(function (el) { scrolls[el.dataset.scrollKey] = el.scrollTop; });
    var backdrop = modalRoot.querySelector('.modal-backdrop');
    var modalScroll = backdrop ? backdrop.scrollTop : 0;

    var title;
    if (state.route === 'client') {
      var c = client();
      var panel = state.clientPage === 'tabs' ? renderPanel() : '';
      var mainHtml = state.clientPage === 'notes' ? renderClientNotesPage() : state.clientPage === 'actions' ? renderClientActionsPage() : renderClientTabs();
      appEl.innerHTML = renderClientShell(mainHtml, panel);
      title = fullName(c) + ' · ' + (state.clientPage === 'notes' ? 'All Case Notes' : state.clientPage === 'actions' ? 'All Action Items' : (CLIENT_TABS.filter(function (t) { return t[0] === state.tab; })[0] || [0, 'Client'])[1]);
    } else {
      var pages = { home: renderHome, 'my-action-items': renderMyActions, 'my-case-notes': renderMyNotes, 'starred-clients': renderStarred };
      appEl.innerHTML = renderHub(state.route, pages[state.route]());
      title = HUB_PAGES[state.route];
    }
    document.title = title + ' · CoLab';

    var wasOpen = !!backdrop;
    modalRoot.innerHTML = renderModal();
    document.body.style.overflow = state.modal ? 'hidden' : '';
    var nb = modalRoot.querySelector('.modal-backdrop');
    if (nb && wasOpen) nb.scrollTop = modalScroll;

    document.querySelectorAll('[data-scroll-key]').forEach(function (el) {
      if (scrolls[el.dataset.scrollKey] != null) el.scrollTop = scrolls[el.dataset.scrollKey];
    });
    var target = null;
    if (focusId) target = document.getElementById(focusId);
    else if (focusKey) {
      document.querySelectorAll('[data-action]').forEach(function (el) {
        if (!target && el.dataset.action + '|' + (el.dataset.id || el.dataset.key || el.dataset.name || el.dataset.route || '') === focusKey) target = el;
      });
    }
    if (target) {
      target.focus({ preventScroll: true });
      if (selStart != null) { try { target.setSelectionRange(selStart, selEnd); } catch (e) { /* not a text input */ } }
    }
  }

  // ================================================================ actions
  function openModal(id, opener) {
    var patch = { modal: id };
    if (!state.modal) patch.opener = opener || null;
    if (id === 'issue') patch.issueSent = false;
    if (id === 'missing' && state.missingSent) {
      patch.missingSent = false;
      patch.missing = { first: '', last: '', dob: '', dhs: '', ssn: '', other: '', name: D.user.first + ' ' + D.user.last, email: D.user.email };
    }
    set(patch);
    var first = { search: 's-first', missing: 'm-first', issue: null }[id];
    setTimeout(function () {
      var el = first ? document.getElementById(first) : modalRoot.querySelector('.choice');
      if (el) el.focus();
    }, 0);
  }
  function closeModal() {
    var opener = state.opener;
    set({ modal: null, opener: null });
    if (opener) {
      var el = document.querySelector('[data-action="openModal"][data-id="' + opener + '"]');
      if (el) el.focus();
    }
  }
  function focusLater(id) { setTimeout(function () { var el = document.getElementById(id); if (el) el.focus(); }, 0); }
  function openClient(id, opts) {
    var patch = { modal: null };
    Object.assign(state, patch);
    go({ route: 'client', clientId: id, clientPage: 'tabs', tab: (opts && opts.tab) || 'overview' });
  }

  var ACTIONS = {
    nav: function (d) { go({ route: d.route }); },
    openClient: function (d) { openClient(d.id); },
    clientTab: function (d) { go({ route: 'client', clientId: state.clientId, clientPage: 'tabs', tab: d.id }, { focus: false }); },
    clientPage: function (d) {
      Object.assign(state, { composingNote: false, composingAction: false, clientActionStatus: 'open' });
      state.pages.clientNotes = 0; state.pages.clientActions = 0;
      go({ route: 'client', clientId: state.clientId, clientPage: d.id });
    },
    backToClient: function () {
      if (state.clientPage !== 'tabs') go({ route: 'client', clientId: state.clientId, clientPage: 'tabs', tab: state.tab || 'overview' });
      else { set({ view: 'tabs', panel: false }); resetScroll(); }
    },
    openService: function (d) { set({ view: 'service', service: d.name, panel: false, menuRow: null, svcFilterOpen: false, sdQuery: '', sdProvider: '', sdProgram: '' }); resetScroll(); },
    openProvider: function (d) { set({ view: 'provider', provider: d.name, panel: false, menuRow: null, svcFilterOpen: false, pdQuery: '', pdProgram: '' }); resetScroll(); },
    svcMode: function (d) { set({ svcMode: d.id }); },
    sub: function (d) { set({ sub: d.id }); },
    caseFilter: function (d) { set({ caseFilter: d.id }); },
    actionFilter: function (d) { set({ actionFilter: d.id }); },
    homeActionTab: function (d) { set({ homeActionTab: d.id }); },
    setFilter: function (d) {
      var p = {}; p[d.model] = d.id;
      var pageKey = { myActionsFilter: 'myActions', myActionsStatus: 'myActions', myNotesFilter: 'myNotes', starredFilter: 'starred', clientActionStatus: 'clientActions' }[d.model];
      if (pageKey) state.pages[pageKey] = 0;
      set(p);
    },
    flipSort: function (d) { var p = {}; p[d.model] = state[d.model] === 'asc' ? 'desc' : 'asc'; set(p); },
    toggleFlag: function (d) { var o = Object.assign({}, state[d.flag]); o[d.id] = !o[d.id]; var p = {}; p[d.flag] = o; set(p); },
    page: function (d) { state.pages[d.key] = Math.max(0, (state.pages[d.key] || 0) + Number(d.dir)); render(); },
    starPage: function (d) { set({ starPage: Math.max(0, state.starPage + Number(d.dir)) }); },
    sort: function (d) {
      var cur = state.sorts[d.table];
      var def = DEFS[d.table].filter(function (x) { return x.key === d.key; })[0];
      var dir = cur.key === d.key ? (cur.dir === 'asc' ? 'desc' : 'asc') : (def.type === 'text' ? 'asc' : 'desc');
      var sorts = Object.assign({}, state.sorts); sorts[d.table] = { key: d.key, dir: dir };
      if (d.table === 'starred') state.pages.starred = 0;
      set({ sorts: sorts, menuRow: null });
    },
    noteSort: function () { set({ noteSort: state.noteSort === 'asc' ? 'desc' : 'asc' }); },
    menu: function (d) { set({ menuRow: state.menuRow === d.id ? null : d.id, svcFilterOpen: false }); },
    toggleSvcFilter: function () { set({ svcFilterOpen: !state.svcFilterOpen, menuRow: null }); },
    clearSvcFilters: function () { set({ query: '', providerFilter: '', programFilter: '', categoryFilter: '', svcFrom: '' }); },
    toggleInc: function (d) { var o = Object.assign({}, state.incOpen); o[d.id] = !o[d.id]; set({ incOpen: o }); },
    toggleSsn: function () { set({ ssn: !state.ssn }); },
    copy: function (d) { copyText(d.value, d.label); },
    shareProfile: function () { copyText(location.href, 'Profile link'); },
    toggleStar: function (d) {
      var c = clientById(d.id); if (!c) return;
      var prev = { starred: c.starred, favorited: c.favorited };
      if (c.starred) { c.starred = null; } else { c.starred = 'private'; c.favorited = isoToUS(todayISO()); }
      render();
      toast(c.starred ? fullName(c) + ' added to starred clients' : fullName(c) + ' removed from starred clients', function () { c.starred = prev.starred; c.favorited = prev.favorited; render(); });
    },
    openPanel: function () { set({ panel: true }); },
    closePanel: function () { set({ panel: false }); },

    openModal: function (d) { openModal(d.id, state.modal ? state.opener : d.id); },
    closeModal: function () { closeModal(); },
    backdrop: function (d, e) { if (e.target === e.currentTarget || e.target.classList.contains('modal-backdrop')) closeModal(); },
    issueType: function (d) { state.issue.type = d.id; render(); },
    toastUndo: function () { if (toastUndo) toastUndo(); toastRoot.innerHTML = ''; toastUndo = null; },

    toggleNote: function (d) { var o = Object.assign({}, state.noteOpen); o[d.id] = !o[d.id]; set({ noteOpen: o }); },
    addNote: function () { set({ composingNote: true, editingNote: null, noteDraft: '', noteError: false, noteRestricted: false }); focusLater('note-draft'); },
    editNote: function (d) {
      var n = state.notes.filter(function (x) { return x.id === d.id; })[0];
      if (state.route !== 'client' || n.clientId !== state.clientId) { state.clientId = n.clientId; go({ route: 'client', clientId: n.clientId, clientPage: 'notes' }, { focus: false }); }
      set({ composingNote: true, editingNote: d.id, noteDraft: n.text, noteError: false, noteRestricted: !!n.restricted }); focusLater('note-draft');
    },
    deleteNote: function (d) {
      var idx = state.notes.map(function (x) { return x.id; }).indexOf(d.id); if (idx < 0) return;
      var removed = state.notes[idx];
      set({ notes: state.notes.filter(function (x) { return x.id !== d.id; }) });
      toast('Case note deleted', function () { state.notes.splice(idx, 0, removed); render(); });
    },
    cancelNote: function () { set({ composingNote: false, editingNote: null, noteDraft: '', noteError: false }); },
    saveNote: function () {
      var text = state.noteDraft.trim();
      if (!text) { set({ noteError: true }); focusLater('note-draft'); return; }
      if (state.editingNote) {
        set({ notes: state.notes.map(function (x) { return x.id === state.editingNote ? Object.assign({}, x, { text: text, edited: true, restricted: state.noteRestricted }) : x; }), composingNote: false, editingNote: null, noteDraft: '', noteError: false });
        toast('Case note updated');
      } else {
        var id = 'n' + Date.now();
        var open = Object.assign({}, state.noteOpen); open[id] = true;
        state.pages.clientNotes = 0;
        set({ notes: [{ id: id, clientId: state.clientId, text: text, date: isoToUS(todayISO()), edited: false, restricted: state.noteRestricted, tag: 'PERSONAL' }].concat(state.notes), noteOpen: open, composingNote: false, noteDraft: '', noteError: false, noteSort: 'desc' });
        toast('Case note saved');
      }
    },

    toggleTask: function (d) {
      var a = state.actions.filter(function (x) { return x.id === d.id; })[0]; if (!a) return;
      a.done = !a.done; render();
      toast(a.done ? 'Marked complete' : 'Marked open', function () { a.done = !a.done; render(); });
    },
    addTask: function () { set({ composingAction: true, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false }); focusLater('action-draft'); },
    editTask: function (d) {
      var a = state.actions.filter(function (x) { return x.id === d.id; })[0];
      set({ composingAction: true, editingAction: d.id, aDraft: a.text, aAssignee: a.assignee === '[Assignee Name]' ? '' : a.assignee, aDue: a.due || '', actionError: false });
      focusLater('action-draft');
    },
    deleteTask: function (d) {
      var idx = state.actions.map(function (x) { return x.id; }).indexOf(d.id); if (idx < 0) return;
      var removed = state.actions[idx];
      set({ actions: state.actions.filter(function (x) { return x.id !== d.id; }) });
      toast('Action item deleted', function () { state.actions.splice(idx, 0, removed); render(); });
    },
    cancelTask: function () { set({ composingAction: false, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false }); },
    saveTask: function () {
      var text = state.aDraft.trim();
      if (!text) { set({ actionError: true }); focusLater('action-draft'); return; }
      var fields = { text: text, assignee: state.aAssignee.trim() || '[Assignee Name]', due: state.aDue || '' };
      var reset = { composingAction: false, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false };
      if (state.editingAction) {
        set(Object.assign({ actions: state.actions.map(function (x) { return x.id === state.editingAction ? Object.assign({}, x, fields, { edited: true }) : x; }) }, reset));
        toast('Action item updated');
      } else {
        set(Object.assign({ actions: [Object.assign({ id: 'a' + Date.now(), clientId: state.clientId, tag: 'PERSONAL', done: false, edited: false }, fields)].concat(state.actions),
          actionFilter: state.actionFilter === 'completed' ? 'open' : state.actionFilter, clientActionStatus: state.clientActionStatus === 'completed' ? 'open' : state.clientActionStatus }, reset));
        toast('Action item added');
      }
    }
  };

  // Drafts update state silently; filters and selects re-render.
  var SILENT_MODELS = { noteDraft: 'noteError', aDraft: 'actionError', aAssignee: null, aDue: null };
  var RESET_PAGE = { starredQuery: 'starred', colab: null };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (el && el.tagName !== 'INPUT') {
      var fn = ACTIONS[el.dataset.action];
      if (fn) {
        if (el.dataset.action === 'backdrop') { if (e.target === el) closeModal(); return; }
        if (el.tagName === 'A' && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return; // let new-tab clicks through
        e.preventDefault(); fn(el.dataset, e); return;
      }
    }
    if ((state.menuRow || state.svcFilterOpen) && !e.target.closest('[data-menu-root]')) set({ menuRow: null, svcFilterOpen: false });
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.matches('input[type="checkbox"][data-action]')) { ACTIONS[el.dataset.action](el.dataset); return; }
    if (el.dataset.modelCheck) { state[el.dataset.modelCheck] = el.checked; render(); return; }
    if (el.dataset.size) { state.sizes[el.dataset.size] = Number(el.value); state.pages[el.dataset.size] = 0; render(); return; }
    if (el.dataset.formModel && el.type === 'date') { setFormModel(el); return; }
    if (el.dataset.model && el.tagName === 'SELECT') {
      var p = {}; p[el.dataset.model] = el.value;
      if (el.dataset.model === 'colab') { PAGE_KEYS.forEach(function (k) { state.pages[k] = 0; }); state.starPage = 0; }
      set(p); return;
    }
    if (el.dataset.model && el.type === 'date') { var q = {}; q[el.dataset.model] = el.value; if (el.dataset.model in SILENT_MODELS) Object.assign(state, q); else set(q); }
  });
  function setFormModel(el) {
    var parts = el.dataset.formModel.split('.');
    state[parts[0]][parts[1]] = el.value;
    if (parts[0] === 'missing' || parts[0] === 'issue') {
      // Re-render only to update the submit button's enabled state.
      var btn = modalRoot.querySelector('button[type="submit"]');
      var m = state[parts[0]];
      var ready = parts[0] === 'missing' ? (m.first.trim() && m.last.trim() && m.dob && m.name.trim() && m.email.trim()) : (m.type && m.details.trim() && m.name.trim() && m.email.trim());
      if (btn && btn.disabled === !!ready) render();
    }
    if (parts[0] === 'search' && state.searchError) { state.searchError = ''; render(); }
  }
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.dataset.formModel) { setFormModel(el); return; }
    var model = el.dataset.model;
    if (!model || el.tagName === 'SELECT' || el.type === 'date') return;
    if (model in SILENT_MODELS) {
      state[model] = el.value;
      var errKey = SILENT_MODELS[model];
      if (errKey && state[errKey]) { var r = {}; r[errKey] = false; set(r); }
      return;
    }
    if (RESET_PAGE[model]) state.pages[RESET_PAGE[model]] = 0;
    var p = {}; p[model] = el.value; set(p);
  });
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-form]'); if (!form) return;
    e.preventDefault();
    var kind = form.dataset.form;
    if (kind === 'search') {
      var q = clone(state.search);
      var any = Object.keys(q).some(function (k) { return String(q[k]).trim(); });
      if (!any) { set({ searchError: 'Enter at least one field to search.', searchRun: null }); return; }
      state.pages.search = 0;
      set({ searchRun: q, searchError: '' });
    } else if (kind === 'missing') {
      var m = state.missing;
      if (m.first.trim() && m.last.trim() && m.dob && m.name.trim() && m.email.trim()) { set({ missingSent: true }); setTimeout(function () { var b = modalRoot.querySelector('.btn-primary'); if (b) b.focus(); }, 0); }
    } else if (kind === 'issue') {
      var s = state.issue;
      if (s.type && s.details.trim() && s.name.trim() && s.email.trim()) { set({ issueSent: true, issue: { type: '', details: '', name: s.name, email: s.email } }); state.issue.email = s.email; setTimeout(function () { var b = modalRoot.querySelector('.btn-primary'); if (b) b.focus(); }, 0); }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (state.modal) { closeModal(); return; }
      if (state.menuRow || state.svcFilterOpen) set({ menuRow: null, svcFilterOpen: false });
    }
    if (e.key === 'Tab' && state.modal) {
      var nodes = [].slice.call(modalRoot.querySelectorAll('button:not([disabled]), input, select, textarea, a[href]')).filter(function (n) { return n.offsetParent !== null; });
      if (!nodes.length) return;
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!modalRoot.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  // ================================================================ start
  applyRoute(parseHash());
  if (!location.hash) history.replaceState(null, '', '#home');
  render();
})();
