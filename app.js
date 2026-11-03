/* CoLab client profile: state, rendering and interactions.
   No framework and no build step. render() rebuilds the main column and the notes panel from `state`;
   clicks route through [data-action], form fields through [data-model]. */
(function () {
  'use strict';

  var D = window.COLAB_DATA;
  var mainEl = document.getElementById('main');
  var panelSlot = document.getElementById('panel-slot');

  // ---------------------------------------------------------------- icons
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
    sortLines: '<path d="M4 6h10M4 12h7M4 18h4M17 5v14M14 16l3 3 3-3"/>'
  };

  function icon(name, size, cls, label) {
    size = size || 16;
    var a11y = label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"';
    return '<svg class="icon ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' + a11y + '>' + ICONS[name] + '</svg>';
  }

  // ---------------------------------------------------------------- helpers
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function attr(name, value) { return value == null || value === false ? '' : ' ' + name + '="' + esc(value) + '"'; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function isoToUS(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : ''; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

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
  function matches(row, keys, query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    return keys.map(function (k) { var v = row[k]; return Array.isArray(v) ? v.join(' ') : (v == null ? '' : v); }).join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function countText(n, total, noun) { return (n === total ? '' : 'Showing ') + n + ' of ' + total + ' ' + noun; }

  // ---------------------------------------------------------------- column definitions
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
    ]
  };
  var GRID = {
    svc: '92px 100px minmax(150px,1.3fr) minmax(160px,1.3fr) minmax(170px,1.5fr) minmax(130px,1fr) 88px 40px',
    prov: 'minmax(110px,1.2fr) minmax(110px,1fr) 92px 100px 80px minmax(120px,1fr) 70px 86px 60px 80px 76px',
    sd: '92px 100px minmax(110px,1fr) 80px minmax(150px,1.3fr) minmax(100px,1fr) 70px 86px 60px 74px 76px',
    pd: 'minmax(160px,1.4fr) 92px 100px minmax(110px,1fr) minmax(120px,1fr) 70px 86px 60px 74px 76px',
    cases: '130px 170px 90px minmax(170px,1.4fr) 120px 140px'
  };

  // ---------------------------------------------------------------- state
  var TABS = [['overview', 'Client Overview'], ['services', 'Services'], ['program-info', 'Program Info'], ['providers', 'Providers'], ['benefits', 'Benefits']];
  var startTab = (location.hash || '').slice(1);
  if (!TABS.some(function (t) { return t[0] === startTab; })) startTab = 'services';

  var state = {
    view: 'tabs', tab: startTab, panel: startTab !== 'services' && startTab !== 'benefits',
    service: '', provider: '',
    ssn: false, copied: false,
    // Services
    svcMode: 'all', query: '', providerFilter: '', programFilter: '', categoryFilter: '', svcFrom: '', svcFilterOpen: false, menuRow: null,
    // Detail views and Providers tab
    sdQuery: '', sdProvider: '', sdProgram: '', pdQuery: '', pdProgram: '', provQuery: '', provProgram: '',
    // Overview
    sub: 'contact',
    // Program Info
    program: 'justice', caseFilter: 'all', incOpen: {},
    sorts: { svc: { key: 'last', dir: 'desc' }, prov: { key: 'last', dir: 'desc' }, sd: { key: 'last', dir: 'desc' }, pd: { key: 'last', dir: 'desc' }, cases: { key: 'date', dir: 'desc' } },
    // Notes panel
    notes: clone(D.notes), noteOpen: { n2: true }, noteSort: 'desc',
    composingNote: false, editingNote: null, noteDraft: '', noteError: false,
    actions: clone(D.actions), actionFilter: 'open',
    composingAction: false, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false
  };

  function set(patch) { Object.assign(state, patch); render(); }

  // ---------------------------------------------------------------- shared pieces
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
  function tableShell(table, label, minWidth, rowsHtml, emptyText) {
    return '<div class="table-wrap"><div class="table" role="table" aria-label="' + esc(label) + '" style="--cols: ' + GRID[table] + '; --min: ' + minWidth + 'px">' +
      headerRow(table) + rowsHtml + (rowsHtml ? '' : '<p class="empty">' + esc(emptyText) + '</p>') + '</div></div>';
  }
  function chip(label, value, extra) {
    return '<div class="chip"><dt>' + label + '</dt><dd>' + value + '</dd></div>' + (extra || '');
  }
  function providerTags(names) {
    return names.map(function (n) {
      return '<button type="button" class="tag" data-action="openProvider" data-name="' + esc(n) + '" aria-label="Open provider ' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');
  }
  function tip(label, body) {
    return '<span class="tip"><button type="button" class="tip-trigger" aria-label="' + esc(label) + '">' + icon('info', 14) + '</button><span class="tip-box" role="tooltip">' + body + '</span></span>';
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
  function pager(text) {
    return '<div class="pager"><span>Rows per page: <strong>10</strong></span><span>' + esc(text) + '</span></div>';
  }
  var TIMELINE_CHIP = chip('Timeline', '02/09/2000 – 07/16/2025 (25.5 years)');
  var PROGRAMS = ['Behavioral Health', 'Housing', 'Justice'];

  // ---------------------------------------------------------------- client header
  function renderHeader() {
    var c = D.client;
    var crumbs;
    if (state.view === 'tabs') {
      crumbs = '<span class="crumb" aria-current="page">' + icon('users', 15) + 'Client Details</span>';
    } else {
      var isService = state.view === 'service';
      crumbs = '<button type="button" class="crumb-link crumb" data-action="backToClient">' + icon('users', 15) + 'Client Details</button>' +
        icon('chevronRight', 14) +
        '<span class="crumb" aria-current="page">' + icon(isService ? 'layers' : 'lifebuoy', 15) + (isService ? 'Service Details' : 'Provider Details') + '</span>';
    }
    return '<nav class="crumbs" aria-label="Breadcrumb"><span class="crumb">' + icon('home', 15) + 'Home</span>' + icon('chevronRight', 14) + crumbs + '</nav>' +
      '<section class="client-head" aria-label="Client identity">' +
        '<div class="client-id"><div class="avatar">' + icon('userSolid', 26) + '</div><div>' +
          '<div class="client-name"><h1>' + esc(c.name) + '</h1>' +
          '<button type="button" class="fav" aria-label="Remove from favorites" aria-pressed="true"><svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="#EDCA91" stroke="#C99A4B" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true">' + ICONS.star + '</svg></button></div>' +
          '<div class="tags">' + c.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '</div></div>' +
        '<dl class="ids">' +
          '<div><dt>MCI ID' + tip('About MCI ID', 'Master Client Index ID. DHS uses it to match one person across every county system.') + '</dt><dd>' + esc(c.mciId) + '</dd></div>' +
          '<div><dt>SSN' + tip('About SSN', 'Masked by default. Revealing it is logged to your account.') + '</dt><dd>' +
            '<span>' + (state.ssn ? esc(c.ssnFull) : '••• •• ' + esc(c.ssnLast4)) + '</span>' +
            '<button type="button" class="icon-btn" data-action="toggleSsn" aria-pressed="' + state.ssn + '" aria-label="' + (state.ssn ? 'Hide SSN' : 'Show SSN') + '">' + icon('eye', 15) + '</button>' +
            '<button type="button" class="icon-btn is-action" data-action="copySsn" aria-label="Copy SSN">' + icon('copy', 15) + '</button>' +
            (state.copied ? '<span class="copied" role="status">Copied</span>' : '') +
          '</dd></div>' +
          '<div><dt>' + (state.panel ? 'MA ID &amp; PA DHS ID' : 'PA DHS ID') + tip('About PA DHS ID', "The client's Pennsylvania Department of Human Services ID, used for Medical Assistance and state benefits.") + '</dt><dd>' + esc(c.paDhsId) + '</dd></div>' +
          '<div><dt>DPW Record #' + tip('About DPW Record number', "Record number from the state's legacy Department of Public Welfare system.") + '</dt><dd>' + esc(c.dpwRecord) + '</dd></div>' +
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
      '<div class="pager"><span>Rows per page: <strong>10</strong></span><span>' + (anyFilter ? countText(rows.length, D.services.length, 'services') : '1–10 of 300') + '</span>' +
        '<span class="pager-btns"><button type="button" class="tool-btn" aria-label="Previous page" disabled>' + icon('chevronLeft', 16) + '</button><button type="button" class="tool-btn" aria-label="Next page">' + icon('chevronRight', 16) + '</button></span></div>' +
    '</div>';
  }

  // ---------------------------------------------------------------- Client Overview tab
  function renderOverview() {
    var sub = state.sub;
    var body;
    if (sub === 'contact') {
      body = '<div class="kv-grid">' +
        '<div class="kv"><div class="kv-label">Address <span>(Most Recent)</span></div>' +
          '<div class="kv-value">950 Second Avenue,<br>Pittsburgh, PA 15219</div>' +
          '<ul class="kv-list">' +
            '<li>' + icon('pin', 14) + 'Allegheny County Jail [facility or building name]</li>' +
            '<li>' + icon('landmark', 14) + 'Ward 15, District 8 (Pittsburgh)</li>' +
            '<li>' + icon('book', 14) + 'Pittsburgh School District</li>' +
          '</ul>' +
          '<div class="source">Source: <span class="source-pill">PA DHS</span> As of 10/14/2026</div></div>' +
        '<div class="kv" style="gap: 18px">' +
          '<div class="kv"><div class="kv-label">Phone Number <span>(Most Recent)</span></div><div class="kv-value num">(412) 123-4567<span style="color: var(--blue)">' + icon('phone', 16) + '</span></div>' +
            '<div class="source">Source: <span class="source-pill">ACGO</span> As of 09/22/2026</div></div>' +
          '<div class="kv"><div class="kv-label">Email <span>(Most Recent)</span></div><div class="kv-value">thisisafakeemail@gmail.com<span style="color: var(--blue)">' + icon('mail', 16) + '</span></div>' +
            '<div class="source">Source: <span class="source-pill">ACGO</span> As of 09/22/2026</div></div>' +
        '</div></div>';
    } else if (sub === 'demo') {
      var pairs = [['Date of Birth', '02/09/2000 (26 yo)'], ['Marital Status', 'Never Married/Single<span class="as-of">As of 06/01/2025</span>'], ['Race', 'White'], ['Ethnicity', 'Not Hispanic/Latinx'], ['Gender', 'Male'], ['Legal Sex', 'Male'],
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
      '<div class="pager">' + esc(countText(rows.length, D.providerSummary.length, 'providers')) + '</div>' +
    '</div>';
  }

  function renderBenefits() {
    return '<div class="empty-box"><h2 class="title" style="font-size: 18px; font-weight: 600">Benefits</h2>' +
      '<p>This tab is not designed yet. Benefit enrollments currently show under Client Overview › Program Enrollment.</p></div>';
  }

  // ---------------------------------------------------------------- Service details
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
      pager(countText(rows.length, D.serviceInstances.length, 'service instances')) +
    '</div>';
  }

  // ---------------------------------------------------------------- Provider details
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
      pager(countText(rows.length, D.providerServices.length, 'services')) +
    '</div>';
  }

  // ---------------------------------------------------------------- main column
  function renderMain() {
    var inner;
    if (state.view === 'service') inner = renderServiceDetail();
    else if (state.view === 'provider') inner = renderProviderDetail();
    else {
      var tabs = '<div class="tabs-wrap"><nav class="tabs" aria-label="Client sections">' + TABS.map(function (t) {
        return '<button type="button" class="tab" data-action="tab" data-id="' + t[0] + '"' + (state.tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</nav></div>';
      var views = { services: renderServices, overview: renderOverview, 'program-info': renderProgram, providers: renderProviders, benefits: renderBenefits };
      inner = tabs + views[state.tab]();
    }
    return renderHeader() + '<section class="card">' + inner + '</section>';
  }

  // ---------------------------------------------------------------- notes panel
  function renderPanel() {
    if (!state.panel) {
      return '<aside class="panel-rail" aria-label="Case notes and action items">' +
        '<button type="button" class="rail-btn" data-action="openPanel" aria-label="Expand case notes and action items" aria-expanded="false" style="color: var(--slate)">' + icon('chevronLeft', 18) + '</button>' +
        '<button type="button" class="rail-btn" data-action="openPanel" aria-label="Open case notes" style="color: var(--slate)">' + icon('notes', 20) + '</button>' +
        '<button type="button" class="rail-btn" data-action="openPanel" aria-label="Open action items" style="color: var(--slate)">' + icon('inbox', 20) + '</button>' +
      '</aside>';
    }

    var dir = state.noteSort === 'asc' ? 1 : -1;
    var notes = state.notes.slice().sort(function (a, b) {
      var x = sortKey(a.date, 'date'), y = sortKey(b.date, 'date');
      return x < y ? -dir : x > y ? dir : 0;
    });
    var notesHtml = notes.map(function (n) {
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

    var noteComposer = state.composingNote
      ? '<div class="composer"><label class="field-label" for="note-draft">' + (state.editingNote ? 'Edit case note' : 'New case note') + '</label>' +
        '<textarea class="input is-block" id="note-draft" rows="3" placeholder="Enter case note" data-model="noteDraft">' + esc(state.noteDraft) + '</textarea>' +
        (state.noteError ? '<span class="error" role="alert">Write the note before saving.</span>' : '') +
        '<div class="composer-foot"><button type="button" class="btn-text" data-action="cancelNote">Cancel</button><button type="button" class="btn-outline is-wide" data-action="saveNote">Save</button></div></div>'
      : '<div class="align-end"><button type="button" class="btn-outline" data-action="addNote">' + icon('plusCircle', 16) + 'Add New Case Note</button></div>';

    var today = todayISO();
    function overdue(a) { return !a.done && !!a.due && a.due < today; }
    var counts = {
      all: state.actions.length,
      open: state.actions.filter(function (a) { return !a.done; }).length,
      overdue: state.actions.filter(overdue).length,
      completed: state.actions.filter(function (a) { return a.done; }).length
    };
    var shown = state.actions.filter(function (a) {
      return state.actionFilter === 'all' ? true : state.actionFilter === 'open' ? !a.done : state.actionFilter === 'overdue' ? overdue(a) : a.done;
    });
    var actionsHtml = shown.map(function (a) {
      var over = overdue(a);
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

    var actionComposer = state.composingAction
      ? '<div class="composer">' +
        '<label class="sr-only" for="action-draft">Action item</label><input class="input is-block" id="action-draft" type="text" placeholder="Enter action item here" data-model="aDraft" value="' + esc(state.aDraft) + '">' +
        '<div class="composer-row"><label class="sr-only" for="action-assignee">Assignee (optional)</label><input class="input" id="action-assignee" type="text" placeholder="Enter assignee (optional)" data-model="aAssignee" value="' + esc(state.aAssignee) + '">' +
        '<label class="sr-only" for="action-due">Due date (optional)</label><input class="input" id="action-due" type="date" data-model="aDue" value="' + esc(state.aDue) + '"></div>' +
        (state.actionError ? '<span class="error" role="alert">Describe the action item before saving.</span>' : '') +
        '<div class="composer-foot"><button type="button" class="btn-text" data-action="cancelTask">Cancel</button><button type="button" class="btn-outline is-wide" data-action="saveTask">Save</button></div></div>'
      : '<div class="align-end"><button type="button" class="btn-outline" data-action="addTask">' + icon('plusCircle', 16) + 'Add New Action Item</button></div>';

    function af(id, label, ic) {
      return '<button type="button" class="seg" data-action="actionFilter" data-id="' + id + '" aria-pressed="' + (state.actionFilter === id) + '">' + (ic ? icon(ic, 13) : '') + label + ' (' + counts[id] + ')</button>';
    }
    var noteSortText = state.noteSort === 'asc' ? 'Oldest first' : 'Newest first';

    return '<aside class="panel" aria-label="Case notes and action items" data-scroll-key="panel">' +
      '<div class="panel-head"><button type="button" class="rail-btn" data-action="closePanel" aria-label="Collapse case notes and action items" aria-expanded="true">' + icon('chevronRight', 18) + '</button>' +
        '<span class="private-pill">Only visible to you</span></div>' +
      '<section class="panel-section" aria-labelledby="notes-h">' +
        '<div class="panel-title-row"><h2 class="panel-title" id="notes-h">' + icon('notes', 20) + 'Case Notes <span>(' + state.notes.length + (state.notes.length === 1 ? ' note' : ' notes') + ')</span></h2>' +
          '<button type="button" class="link-btn is-small is-inline">' + icon('external', 14) + 'View All Case Notes</button></div>' +
        '<div class="list-head"><button type="button" class="sort-btn" data-action="noteSort" aria-label="Date, ' + noteSortText.toLowerCase() + '. Reverse order">Date ' + icon('sortLines', 14, state.noteSort === 'asc' ? 'flip' : '') + '<span>' + noteSortText + '</span></button></div>' +
        '<ul class="scroll-list" data-scroll-key="notes">' + notesHtml + '</ul>' + noteComposer +
      '</section>' +
      '<section class="panel-section" aria-labelledby="actions-h">' +
        '<div class="panel-title-row"><h2 class="panel-title" id="actions-h">' + icon('inbox', 20) + 'Action Items <span>(' + state.actions.length + (state.actions.length === 1 ? ' item' : ' items') + ')</span></h2>' +
          '<button type="button" class="link-btn is-small is-inline">' + icon('external', 14) + 'View All Action Items</button></div>' +
        '<div class="segmented is-fill is-small" role="group" aria-label="Show action items">' +
          af('all', 'All') + af('open', 'Open') + af('overdue', 'Overdue', 'alert') + af('completed', 'Completed') +
        '</div>' +
        '<ul class="scroll-list" data-scroll-key="tasks">' + actionsHtml + '</ul>' + actionComposer +
      '</section>' +
    '</aside>';
  }

  // ---------------------------------------------------------------- render (keeps focus and scroll)
  function render() {
    var active = document.activeElement;
    var focusId = active && active.id;
    var focusAction = !focusId && active && active.dataset ? active.dataset.action + '|' + (active.dataset.id || active.dataset.key || active.dataset.name || '') : null;
    var selStart = null, selEnd = null;
    try { if (focusId && typeof active.selectionStart === 'number') { selStart = active.selectionStart; selEnd = active.selectionEnd; } } catch (e) { /* date inputs throw */ }
    var scrolls = {};
    document.querySelectorAll('[data-scroll-key]').forEach(function (el) { scrolls[el.dataset.scrollKey] = el.scrollTop; });

    mainEl.innerHTML = renderMain();
    panelSlot.innerHTML = renderPanel();

    document.querySelectorAll('[data-scroll-key]').forEach(function (el) {
      if (scrolls[el.dataset.scrollKey] != null) el.scrollTop = scrolls[el.dataset.scrollKey];
    });
    var target = null;
    if (focusId) target = document.getElementById(focusId);
    else if (focusAction) {
      document.querySelectorAll('[data-action]').forEach(function (el) {
        if (!target && el.dataset.action + '|' + (el.dataset.id || el.dataset.key || el.dataset.name || '') === focusAction) target = el;
      });
    }
    if (target) {
      target.focus({ preventScroll: true });
      if (selStart != null) { try { target.setSelectionRange(selStart, selEnd); } catch (e) { /* not a text input */ } }
    }
  }

  // ---------------------------------------------------------------- actions
  var copyTimer = null;
  var ACTIONS = {
    tab: function (d) {
      set({ view: 'tabs', tab: d.id, panel: d.id !== 'services' && d.id !== 'benefits', menuRow: null, svcFilterOpen: false });
      if (location.hash.slice(1) !== d.id) history.replaceState(null, '', '#' + d.id);
    },
    backToClient: function () { set({ view: 'tabs', tab: 'services', panel: false }); history.replaceState(null, '', '#services'); mainEl.scrollTop = 0; },
    openService: function (d) { set({ view: 'service', service: d.name, panel: false, menuRow: null, svcFilterOpen: false, sdQuery: '', sdProvider: '', sdProgram: '' }); mainEl.scrollTop = 0; },
    openProvider: function (d) { set({ view: 'provider', provider: d.name, panel: false, menuRow: null, svcFilterOpen: false, pdQuery: '', pdProgram: '' }); mainEl.scrollTop = 0; },
    svcMode: function (d) { set({ svcMode: d.id }); },
    sub: function (d) { set({ sub: d.id }); },
    caseFilter: function (d) { set({ caseFilter: d.id }); },
    actionFilter: function (d) { set({ actionFilter: d.id }); },
    sort: function (d) {
      var cur = state.sorts[d.table];
      var def = DEFS[d.table].filter(function (x) { return x.key === d.key; })[0];
      var dir = cur.key === d.key ? (cur.dir === 'asc' ? 'desc' : 'asc') : (def.type === 'text' ? 'asc' : 'desc');
      var sorts = Object.assign({}, state.sorts); sorts[d.table] = { key: d.key, dir: dir };
      set({ sorts: sorts, menuRow: null });
    },
    noteSort: function () { set({ noteSort: state.noteSort === 'asc' ? 'desc' : 'asc' }); },
    menu: function (d) { set({ menuRow: state.menuRow === d.id ? null : d.id, svcFilterOpen: false }); },
    toggleSvcFilter: function () { set({ svcFilterOpen: !state.svcFilterOpen, menuRow: null }); },
    clearSvcFilters: function () { set({ query: '', providerFilter: '', programFilter: '', categoryFilter: '', svcFrom: '' }); },
    toggleInc: function (d) { var o = Object.assign({}, state.incOpen); o[d.id] = !o[d.id]; set({ incOpen: o }); },
    toggleSsn: function () { set({ ssn: !state.ssn }); },
    copySsn: function () {
      var done = function () {
        set({ copied: true });
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () { set({ copied: false }); }, 1600);
      };
      try { navigator.clipboard.writeText(D.client.ssnFull).then(done, done); } catch (e) { done(); }
    },
    openPanel: function () { set({ panel: true }); },
    closePanel: function () { set({ panel: false }); },

    toggleNote: function (d) { var o = Object.assign({}, state.noteOpen); o[d.id] = !o[d.id]; set({ noteOpen: o }); },
    addNote: function () { set({ composingNote: true, editingNote: null, noteDraft: '', noteError: false }); focusLater('note-draft'); },
    editNote: function (d) {
      var n = state.notes.filter(function (x) { return x.id === d.id; })[0];
      set({ composingNote: true, editingNote: d.id, noteDraft: n.text, noteError: false }); focusLater('note-draft');
    },
    deleteNote: function (d) { set({ notes: state.notes.filter(function (x) { return x.id !== d.id; }) }); },
    cancelNote: function () { set({ composingNote: false, editingNote: null, noteDraft: '', noteError: false }); },
    saveNote: function () {
      var text = state.noteDraft.trim();
      if (!text) { set({ noteError: true }); focusLater('note-draft'); return; }
      if (state.editingNote) {
        set({ notes: state.notes.map(function (x) { return x.id === state.editingNote ? Object.assign({}, x, { text: text, edited: true }) : x; }), composingNote: false, editingNote: null, noteDraft: '', noteError: false });
      } else {
        var id = 'n' + Date.now();
        var open = Object.assign({}, state.noteOpen); open[id] = true;
        set({ notes: [{ id: id, text: text, date: isoToUS(todayISO()), edited: false }].concat(state.notes), noteOpen: open, composingNote: false, noteDraft: '', noteError: false });
      }
    },

    toggleTask: function (d) { set({ actions: state.actions.map(function (x) { return x.id === d.id ? Object.assign({}, x, { done: !x.done }) : x; }) }); },
    addTask: function () { set({ composingAction: true, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false }); focusLater('action-draft'); },
    editTask: function (d) {
      var a = state.actions.filter(function (x) { return x.id === d.id; })[0];
      set({ composingAction: true, editingAction: d.id, aDraft: a.text, aAssignee: a.assignee === '[Assignee Name]' ? '' : a.assignee, aDue: a.due || '', actionError: false });
      focusLater('action-draft');
    },
    deleteTask: function (d) { set({ actions: state.actions.filter(function (x) { return x.id !== d.id; }) }); },
    cancelTask: function () { set({ composingAction: false, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false }); },
    saveTask: function () {
      var text = state.aDraft.trim();
      if (!text) { set({ actionError: true }); focusLater('action-draft'); return; }
      var fields = { text: text, assignee: state.aAssignee.trim() || '[Assignee Name]', due: state.aDue || '' };
      var reset = { composingAction: false, editingAction: null, aDraft: '', aAssignee: '', aDue: '', actionError: false };
      if (state.editingAction) {
        set(Object.assign({ actions: state.actions.map(function (x) { return x.id === state.editingAction ? Object.assign({}, x, fields, { edited: true }) : x; }) }, reset));
      } else {
        set(Object.assign({ actions: [Object.assign({ id: 'a' + Date.now(), done: false, edited: false }, fields)].concat(state.actions), actionFilter: state.actionFilter === 'completed' ? 'open' : state.actionFilter }, reset));
      }
    }
  };

  function focusLater(id) { setTimeout(function () { var el = document.getElementById(id); if (el) el.focus(); }, 0); }

  // Drafts update state silently; filters and selects re-render.
  var SILENT_MODELS = { noteDraft: 'noteError', aDraft: 'actionError', aAssignee: null, aDue: null };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (el && el.tagName !== 'INPUT') {
      var fn = ACTIONS[el.dataset.action];
      if (fn) { e.preventDefault(); fn(el.dataset); return; }
    }
    // Clicking outside an open menu or popover closes it.
    if ((state.menuRow || state.svcFilterOpen) && !e.target.closest('[data-menu-root]')) set({ menuRow: null, svcFilterOpen: false });
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.matches('input[type="checkbox"][data-action]')) { ACTIONS[el.dataset.action](el.dataset); return; }
    if (el.dataset.model && el.tagName === 'SELECT') { var p = {}; p[el.dataset.model] = el.value; set(p); }
    if (el.dataset.model && el.type === 'date') { var q = {}; q[el.dataset.model] = el.value; if (el.dataset.model in SILENT_MODELS) Object.assign(state, q); else set(q); }
  });
  document.addEventListener('input', function (e) {
    var el = e.target, model = el.dataset.model;
    if (!model || el.tagName === 'SELECT' || el.type === 'date') return;
    if (model in SILENT_MODELS) {
      state[model] = el.value;
      var errKey = SILENT_MODELS[model];
      if (errKey && state[errKey]) set((function () { var p = {}; p[errKey] = false; return p; })());
      return;
    }
    var p = {}; p[model] = el.value; set(p);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (state.menuRow || state.svcFilterOpen)) set({ menuRow: null, svcFilterOpen: false });
  });
  window.addEventListener('hashchange', function () {
    var id = location.hash.slice(1);
    if (TABS.some(function (t) { return t[0] === id; }) && (state.view !== 'tabs' || state.tab !== id)) ACTIONS.tab({ id: id });
  });

  // Static frame icons
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    var size = el.classList.contains('rail-btn') ? 20 : el.classList.contains('btn-ghost') ? 16 : 20;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, size));
  });

  render();
})();
