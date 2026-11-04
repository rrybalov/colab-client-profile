// Client profile: header, the five tabs, service and provider details, full-page notes and action items,
// and the case notes / action items side panel.
import React, { useEffect, useRef, useState } from 'react';
import { Icon, BrandMark } from '../icons.jsx';
import { useStore, usePref } from '../store.jsx';
import { Link, navigate, CLIENT_TABS } from '../router.jsx';
import { PROVIDERS } from '../data/seed.js';
import {
  STAFF, ME, colabTag, dobText, fullName, isOverdue, isoToUS, todayISO, plural, countText, money,
  sortKey, sortRows, matches, serviceSummary, providerSummary, staffName
} from '../lib.js';
import { Clamp, Tip, Segmented, usePaged, Pager, SortHead, useSort, Table, StarButton, CopyButton, NoteRow, ActionRow, useTaskActions, LockBadge } from '../ui.jsx';

const me = STAFF.find((s) => s.id === ME);
const MONEY = [
  { key: 'units', label: 'Units', type: 'num' }, { key: 'status', label: 'Status', type: 'text' },
  { key: 'rate', label: 'Rate', type: 'num' }, { key: 'rateType', label: 'Rate Type', type: 'text' }, { key: 'cost', label: 'Cost', type: 'num' }
];
const DEFS = {
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
const GRID = {
  svc: '112px 112px minmax(150px,1.3fr) minmax(160px,1.3fr) minmax(170px,1.5fr) minmax(130px,1fr) 100px 40px',
  prov: 'minmax(110px,1.2fr) minmax(110px,1fr) 112px 112px 84px minmax(120px,1fr) 64px 76px 64px 92px 76px',
  sd: '112px 112px minmax(110px,1fr) 84px minmax(150px,1.3fr) minmax(110px,1fr) 64px 76px 64px 92px 76px',
  pd: 'minmax(160px,1.4fr) 112px 112px minmax(110px,1fr) minmax(120px,1fr) 64px 76px 64px 92px 76px',
  cases: '130px 170px 100px minmax(170px,1.4fr) 130px 150px'
};
const PROGRAMS = ['Behavioral Health', 'Housing', 'Justice'];
const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();
const tabRoute = (id, tab) => ({ page: 'client', id, sub: 'tab', tab });
const serviceRoute = (id, sid) => ({ page: 'client', id, sub: 'service', key: sid });
const providerRoute = (id, name) => ({ page: 'client', id, sub: 'provider', key: name });

// Closes a popover or menu on an outside click or Escape.
function useDismiss(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return ref;
}

function Chip({ label, children }) { return <div className="chip"><dt>{label}</dt><dd>{children}</dd></div>; }
function ProviderTags({ client, names }) {
  return names.map((n) => <Link key={n} className="tag" to={providerRoute(client.id, n)} aria-label={'Open provider ' + n}>{n}</Link>);
}
function SearchBox({ id, value, onChange, label, placeholder = 'Search' }) {
  return <><label className="sr-only" htmlFor={id}>{label}</label><input className="input is-search" id={id} type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></>;
}
function SelectBox({ id, value, onChange, label, placeholder, options }) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <select className="select" id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return <option key={v} value={v}>{l}</option>; })}
      </select>
    </>
  );
}

// ================================================================== shell
export function ClientPage({ route }) {
  const { state } = useStore();
  const client = state.db.clients.find((c) => c.id === route.id);
  const [, setLastTab] = usePref('client.lastTab.' + route.id, 'overview');
  useEffect(() => { if (route.sub === 'tab') setLastTab(route.tab); }, [route.sub, route.tab, route.id]);

  if (!client) {
    return (
      <Shell client={null}>
        <div className="empty-box" style={{ marginTop: 24 }}>
          <h1 className="title" style={{ fontSize: 18 }}>Client not found</h1>
          <p>This client isn't in the sample data. They may have been removed when the sample data was reset.</p>
          <Link className="btn-outline" to="#home"><Icon name="home" />Back to CoLab Home</Link>
        </div>
      </Shell>
    );
  }
  if (route.sub === 'notes') return <Shell client={client}><ClientHeader client={client} crumb="All Case Notes" crumbIcon="notes" /><ClientNotesPage client={client} /></Shell>;
  if (route.sub === 'actions') return <Shell client={client}><ClientHeader client={client} crumb="All Action Items" crumbIcon="inbox" /><ClientActionsPage client={client} /></Shell>;
  if (route.sub === 'service') {
    const svc = client.services.find((s) => s.id === route.key);
    return <Shell client={client} panelKey="detail"><ClientHeader client={client} crumb="Service Details" crumbIcon="layers" /><section className="card">{svc ? <ServiceDetail client={client} svc={svc} /> : <Missing what="service" client={client} />}</section></Shell>;
  }
  if (route.sub === 'provider') {
    const has = client.instances.some((i) => i.provider === route.key);
    return <Shell client={client} panelKey="detail"><ClientHeader client={client} crumb="Provider Details" crumbIcon="lifebuoy" /><section className="card">{has ? <ProviderDetail client={client} name={route.key} /> : <Missing what="provider" client={client} />}</section></Shell>;
  }
  const views = { services: Services, overview: Overview, 'program-info': Program, providers: Providers, benefits: Benefits };
  const View = views[route.tab] || Overview;
  return (
    <Shell client={client} panelKey={route.tab}>
      <ClientHeader client={client} />
      <section className="card">
        <div className="tabs-wrap">
          <nav className="tabs" aria-label="Client sections">
            {CLIENT_TABS.map(([id, label]) => <Link key={id} className="tab" to={tabRoute(client.id, id)} focus={false} aria-current={route.tab === id ? 'page' : undefined}>{label}</Link>)}
          </nav>
        </div>
        <View client={client} />
      </section>
    </Shell>
  );
}

function Missing({ what, client }) {
  return <div className="empty-box"><p>This {what} isn't in {fullName(client)}'s record.</p><Link className="link-btn is-inline" to={tabRoute(client.id, 'services')}>Back to Services</Link></div>;
}

function Shell({ client, panelKey, children }) {
  const { openModal, toast } = useStore();
  const defaultOpen = !!panelKey && panelKey !== 'services' && panelKey !== 'benefits' && panelKey !== 'detail';
  const [panelOpen, setPanelOpen] = usePref('panel.' + (panelKey || 'none'), defaultOpen);
  const share = () => {
    try { navigator.clipboard.writeText(location.href).then(() => toast('Profile link copied'), () => toast('Copy failed. Copy the address from the address bar instead.')); }
    catch (e) { toast('Copy failed. Copy the address from the address bar instead.'); }
  };
  const hasPanel = !!(client && panelKey);
  return (
    <div className="app"><div className="shell">
      <header className="topbar">
        <Link className="brand" to="#home"><BrandMark />CoLab</Link>
        <nav className="top-actions" aria-label="Profile actions">
          <button type="button" className="btn-ghost" onClick={() => openModal({ id: 'issue' })}><Icon name="bug" />Report Issue</button>
          {client && <button type="button" className="btn-ghost" onClick={share}><Icon name="mail" />Share Profile</button>}
          {client && <div className="user-chip"><Icon name={client.household ? 'users' : 'user'} size={20} /><div><strong>{fullName(client)}</strong><span>MCI ID: {client.mci}</span></div></div>}
        </nav>
      </header>
      <div className="body">
        <nav className="rail" aria-label="Main">
          <Link className="rail-btn" to="#home" aria-label="CoLab Home" data-tip="CoLab Home"><Icon name="home" size={20} /></Link>
          <Link className="rail-btn" to="#my-action-items" aria-label="My Action Items" data-tip="My Action Items"><Icon name="inbox" size={20} /></Link>
          <Link className="rail-btn" to="#starred-clients" aria-label="Starred Clients" data-tip="Starred Clients"><Icon name="star" size={20} /></Link>
          <div className="rail-divider" />
          {client && <Link className="rail-btn" to={tabRoute(client.id, 'overview')} aria-label="Client profile" aria-current="page" data-tip="Client profile"><Icon name="user" size={20} /></Link>}
          <div className="rail-avatar" aria-label={'Signed in as ' + me.first + ' ' + me.last}>{me.initials}</div>
        </nav>
        <div className={'work' + (hasPanel && !panelOpen ? ' is-panel-closed' : '')}>
          <main className="main" id="main" tabIndex={-1}>{children}</main>
          {hasPanel && <Panel client={client} open={panelOpen} setOpen={setPanelOpen} />}
        </div>
      </div>
    </div></div>
  );
}

function ClientHeader({ client: c, crumb, crumbIcon }) {
  const [ssn, setSsn] = useState(false); // Deliberately not saved: the full SSN should hide again on reload.
  const [lastTab] = usePref('client.lastTab.' + c.id, 'overview');
  useEffect(() => setSsn(false), [c.id]);
  const ssnFull = '123-45-' + c.ssn4;
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link className="crumb-link crumb" to="#home"><Icon name="home" size={15} />Home</Link><Icon name="chevronRight" size={14} />
        {crumb ? (
          <><Link className="crumb-link crumb" to={tabRoute(c.id, lastTab)}><Icon name="users" size={15} />Client Details</Link><Icon name="chevronRight" size={14} />
            <span className="crumb" aria-current="page"><Icon name={crumbIcon} size={15} />{crumb}</span></>
        ) : <span className="crumb" aria-current="page"><Icon name="users" size={15} />Client Details</span>}
      </nav>
      <section className="client-head" aria-label="Client identity">
        <div className="client-id">
          <div className="avatar"><Icon name={c.household ? 'users' : 'userSolid'} size={26} /></div>
          <div>
            <div className="client-name"><h1>{fullName(c)}</h1><StarButton client={c} size={24} /></div>
            <div className="tags">{c.colabs.map((t) => <span className="tag" key={t}>{colabTag(t)}</span>)}</div>
          </div>
        </div>
        <dl className="ids">
          <div><dt>MCI ID<Tip label="About MCI ID">Unique value used for DHS identification purposes</Tip></dt><dd>{c.mci}</dd></div>
          <div><dt>SSN<Tip label="About SSN">Unique value across all benefits and services</Tip></dt><dd>
            <span>{ssn ? ssnFull : '••• •• ' + c.ssn4}</span>
            <button type="button" className="icon-btn" aria-pressed={ssn} aria-label={ssn ? 'Hide SSN' : 'Show SSN'} onClick={() => setSsn(!ssn)}><Icon name="eye" size={15} /></button>
            <CopyButton value={ssnFull} label="SSN" size={15} />
          </dd></div>
          <div><dt>MA ID &amp; PA DHS ID<Tip label="About MA ID and PA DHS ID">This is the individual ID provided by PA DHS</Tip></dt><dd>{c.dhs}</dd></div>
          <div><dt>DPW Record #<Tip label="About DPW Record number">Record number from the state's legacy Department of Public Welfare system.</Tip></dt><dd>{c.dpw}</dd></div>
        </dl>
      </section>
    </>
  );
}

// ================================================================== Services tab
const CATEGORIES = ['Behavioral Health', 'Child Welfare', 'Developmental Support', 'Family Strengthening', 'Housing', 'Justice Involvement', 'Physical Health'];
function Services({ client: c }) {
  const k = 'svc.' + c.id + '.';
  const [mode, setMode] = usePref('svc.mode', 'all');
  const [query, setQuery] = usePref(k + 'query', '');
  const [provider, setProvider] = usePref(k + 'provider', '');
  const [area, setArea] = usePref(k + 'area', '');
  const [category, setCategory] = usePref(k + 'category', '');
  const [from, setFrom] = usePref(k + 'from', '');
  const [sort, onSort] = useSort('svc', { key: 'last', dir: 'desc' });
  const [menuRow, setMenuRow] = useState(null);
  const [popOpen, setPopOpen] = useState(false);
  const popRef = useDismiss(popOpen, () => setPopOpen(false));
  const menuRef = useDismiss(!!menuRow, () => setMenuRow(null));
  const grouped = mode === 'grouped';
  const sum = serviceSummary(c);
  const fromKey = from ? from.replace(/-/g, '') : '';
  const rows = sortRows(c.services.map((r) => { const provs = grouped ? r.grouped : r.all; return { ...r, provs, provSort: provs[0] || '' }; }).filter((r) => {
    if (provider && r.provs.indexOf(provider) < 0) return false;
    if (area && r.area !== area) return false;
    if (category && r.program !== category) return false;
    if (fromKey && sortKey(r.last, 'date') < fromKey) return false;
    return matches(r, ['service', 'area', 'program', 'provs'], query);
  }), sort, DEFS.svc);
  const p = usePaged('svc.' + c.id, rows);
  const popCount = (category ? 1 : 0) + (from ? 1 : 0);
  const reset = (fn) => (v) => { fn(v); p.reset(); };
  const clearAll = () => { setQuery(''); setProvider(''); setArea(''); setCategory(''); setFrom(''); p.reset(); };
  const providers = uniq(c.services.flatMap((s) => (grouped ? s.grouped : s.all)));
  const areas = uniq(c.services.map((s) => s.area));

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="title"><Icon name="layers" size={26} />Services Information</h2>
        <Segmented label="Service view" value={mode} onChange={setMode} options={[{ id: 'grouped', label: 'Grouped Services' }, { id: 'all', label: 'All Services' }]} />
      </div>
      <dl className="chips">
        <Chip label="Timeline">{sum.timeline}</Chip>
        <Chip label={grouped ? 'Unique Services' : 'All Services'}>{(grouped ? sum.unique : sum.instances).toLocaleString()}</Chip>
        <Chip label="Total Cost">{money(sum.cost)}</Chip>
        <Chip label={`Associated Providers (${sum.providers.length})`}><ProviderTags client={c} names={sum.providers} /></Chip>
        <Chip label={grouped ? 'Program Areas' : 'Programs'}>{(grouped ? sum.areas : sum.programs).join('; ') || '—'}</Chip>
      </dl>
      <div className="toolbar">
        <SearchBox id="svc-search" label="Search services" value={query} onChange={reset(setQuery)} />
        <SelectBox id="svc-provider" label="Provider filter" placeholder="Provider Filter" value={provider} onChange={reset(setProvider)} options={providers} />
        <SelectBox id="svc-program" label="Program filter" placeholder="Program Filter" value={area} onChange={reset(setArea)} options={areas.map((a) => [a, a.replace(' Services (All)', '')])} />
        <div className="tools" role="toolbar" aria-label="Table tools">
          <button type="button" className="tool-btn" aria-label="Undo" disabled><Icon name="undo" size={17} /></button>
          <button type="button" className="tool-btn" aria-label="Redo" disabled><Icon name="redo" size={17} /></button>
          <span className="tool-sep" aria-hidden="true" />
          <button type="button" className="tool-btn" aria-label="Choose columns"><Icon name="columns" size={17} /></button>
          <div className="pop-anchor" ref={popRef}>
            <button type="button" className={'tool-btn' + (popCount ? ' is-on' : '')} aria-label="More filters" aria-expanded={popOpen} onClick={() => { setPopOpen(!popOpen); setMenuRow(null); }}>
              <Icon name="filter" size={17} />{popCount > 0 && <span className="badge">{popCount}</span>}
            </button>
            {popOpen && (
              <div className="popover" role="dialog" aria-label="More filters">
                <span className="popover-title">More filters</span>
                <label className="field-label" htmlFor="svc-category">Program area</label>
                <select className="select" id="svc-category" value={category} onChange={(e) => reset(setCategory)(e.target.value)}>
                  <option value="">Any program area</option>
                  {CATEGORIES.map((x) => <option key={x}>{x}</option>)}
                </select>
                <label className="field-label" htmlFor="svc-from">Last activity on or after</label>
                <input className="input" id="svc-from" type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} />
                <div className="popover-foot"><button type="button" className="btn-text" onClick={clearAll}>Clear all filters</button><button type="button" className="btn-solid" onClick={() => setPopOpen(false)}>Done</button></div>
              </div>
            )}
          </div>
          <button type="button" className="tool-btn" aria-label="Row density"><Icon name="rows" size={17} /></button>
          <span className="tool-sep" aria-hidden="true" />
          <button type="button" className="tool-btn" aria-label="Export table"><Icon name="download" size={17} /></button>
        </div>
      </div>
      <Table label="Services" cols={GRID.svc} min={1080} empty="No services match these filters. Clear the search or filters to see all services."
        head={<><SortHead defs={DEFS.svc} sort={sort} onSort={(d) => { onSort(d); setMenuRow(null); }} /><div className="th" role="columnheader"><span className="sr-only">Actions</span></div></>}>
        {p.items.map((r) => (
          <div className="tr is-row" role="row" key={r.id}>
            <div className="td" role="cell">{r.first}</div>
            <div className="td" role="cell">{r.last}</div>
            <div className="td" role="cell">{r.area}</div>
            <div className="td tag-list" role="cell"><ProviderTags client={c} names={r.provs} /></div>
            <div className="td" role="cell"><Link className="link-btn" to={serviceRoute(c.id, r.id)}>{r.service}</Link></div>
            <div className="td" role="cell">{r.program}</div>
            <div className="td" role="cell">{r.added}</div>
            <div className="td is-tight kebab-cell" role="cell" ref={menuRow === r.id ? menuRef : undefined}>
              <button type="button" className="tool-btn" aria-label={'More actions for ' + r.service} aria-expanded={menuRow === r.id} onClick={() => { setMenuRow(menuRow === r.id ? null : r.id); setPopOpen(false); }}><Icon name="more" size={18} /></button>
              {menuRow === r.id && (
                <div className="menu">
                  <button type="button" className="menu-item" onClick={() => navigate(serviceRoute(c.id, r.id))}>View service details</button>
                  {r.provs[0] && <button type="button" className="menu-item" onClick={() => navigate(providerRoute(c.id, r.provs[0]))}>View provider details</button>}
                </div>
              )}
            </div>
          </div>
        ))}
      </Table>
      <Pager p={p} />
      {(query || provider || area || popCount > 0) && <p className="req" role="status">{countText(rows.length, c.services.length, 'services')}</p>}
    </div>
  );
}

// ================================================================== Client Overview tab
function Overview({ client: c }) {
  const [sub, setSub] = usePref('overview.sub', 'contact');
  const a = c.address;
  const sourceTip = <span className="tip"><button type="button" className="tip-trigger source-pill" aria-label="About this source: PA DHS">PA DHS</button><span className="tip-box" role="tooltip">This info comes from the benefits funds from the Pennsylvania Department of Human Services (PA DHS)</span></span>;
  let body;
  if (sub === 'contact') {
    body = (
      <div className="kv-grid">
        <div className="kv">
          <div className="kv-label">Address <span>(Most Recent)</span></div>
          <div className="kv-value">{a.street},<br />{a.city}, {a.state} {a.zip}</div>
          <ul className="kv-list">
            {a.facility && <li><Icon name="pin" size={14} />{a.facility}</li>}
            <li><Icon name="landmark" size={14} />{a.ward}</li>
            <li><Icon name="book" size={14} />{a.school}</li>
          </ul>
          <div className="source">Source: {sourceTip} As of 10/14/2026</div>
        </div>
        <div className="kv" style={{ gap: 18 }}>
          <div className="kv"><div className="kv-label">Phone Number <span>(Most Recent)</span></div>
            <div className="kv-value num">{c.phone || 'Not on file'}{c.phone && <span style={{ color: 'var(--blue)' }}><Icon name="phone" /></span>}</div>
            <div className="source">Source: <span className="source-pill">ACGO</span> As of 09/22/2026</div></div>
          <div className="kv"><div className="kv-label">Email <span>(Most Recent)</span></div>
            <div className="kv-value">{c.email || 'Not on file'}{c.email && <span style={{ color: 'var(--blue)' }}><Icon name="mail" /></span>}</div>
            <div className="source">Source: <span className="source-pill">ACGO</span> As of 09/22/2026</div></div>
        </div>
      </div>
    );
  } else if (sub === 'demo') {
    const pairs = c.household
      ? [['Household Members', (c.members || []).join(', ')], ['Primary Language', c.language], ['Living Arrangement', c.living]]
      : [['Date of Birth', dobText(c)], ['Marital Status', c.marital], ['Race', c.race], ['Ethnicity', c.ethnicity], ['Gender', c.gender], ['Legal Sex', c.legalSex], ['Primary Language', c.language], ['Living Arrangement', c.living]];
    body = <dl className="demo-grid">{pairs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}</dl>;
  } else {
    const list = c.enrollments || [];
    body = list.length ? (
      <ul className="enroll-list">
        {list.map((e) => (
          <li key={e.name} className={'enroll is-' + e.kind}>
            <div className="enroll-top">
              <div><div className="enroll-name">{e.name}</div>
                <div className="enroll-asof">{e.asOf}{e.stale && <span style={{ color: 'var(--red-text)' }}><Icon name="alert" size={13} label="Out of date" /></span>}</div></div>
              <span className={'status is-' + e.kind}>{e.status}</span>
            </div>
            <div className="enroll-dates"><span><strong>Start date:</strong> {e.start}</span><span className="track" aria-hidden="true"><span style={{ width: e.pct + '%' }} /></span><span><strong>End date:</strong> {e.end}</span></div>
          </li>
        ))}
      </ul>
    ) : <div className="empty-box"><p>No program enrollments on record for {fullName(c)}.</p></div>;
  }
  return (
    <div className="view" style={{ gap: 18 }}>
      <h2 className="title"><Icon name="user" size={24} />Client Overview</h2>
      <Segmented fill label="Overview section" value={sub} onChange={setSub}
        options={[{ id: 'contact', icon: 'building', label: 'Contact Information' }, { id: 'demo', icon: 'userCircle', label: 'Demographic Information' }, { id: 'enroll', icon: 'gridPlus', label: 'Program Enrollment' }]} />
      {body}
    </div>
  );
}

// ================================================================== Program Info tab
function Program({ client: c }) {
  const [program, setProgram] = usePref('program.which', 'justice');
  const [caseFilter, setCaseFilter] = usePref('program.caseFilter', 'all');
  const [incOpen, setIncOpen] = usePref('program.incOpen', {});
  const [sort, onSort] = useSort('cases', { key: 'date', dir: 'desc' });
  const titles = { justice: 'Justice Involvement', behavioral: 'Behavioral Health', housing: 'Housing' };
  const title = titles[program];
  const head = (
    <>
      <h2 className="title" style={{ fontSize: 22 }}><Icon name="lifebuoy" size={22} />Program Info</h2>
      <div className="view-head">
        <h3 className="title-lg">{title}<Tip label="About this section">Records from Allegheny County courts, the jail and adult probation, matched to this client by MCI ID.</Tip></h3>
        <label className="sr-only" htmlFor="program-select">Program</label>
        <select className="select is-program" id="program-select" value={program} onChange={(e) => setProgram(e.target.value)}>
          <option value="justice">Justice</option><option value="behavioral">Behavioral Health</option><option value="housing">Housing</option>
        </select>
      </div>
    </>
  );
  if (program !== 'justice') return <div className="view">{head}<div className="empty-box"><p>The {title} view has not been designed yet. Justice is the only program with records in this prototype.</p></div></div>;
  const j = c.justice;
  if (!j) return <div className="view">{head}<div className="empty-box"><p>No court, jail or probation records are matched to {fullName(c)}.</p></div></div>;

  const dvCount = j.cases.filter((x) => x.dv).length;
  const cases = sortRows(caseFilter === 'dv' ? j.cases.filter((x) => x.dv) : j.cases, sort, DEFS.cases);
  const tags = { housing: 'Alternative housing', hold: 'Behavioral Health Hold', prison: 'State Prison' };
  return (
    <div className="view" style={{ gap: 22 }}>
      {head}
      <div className="card-grid">
        <div className="info-card"><h4>High Risk Flag<Tip label="How the high risk flag is set">Added when a client has met the following criteria:<ul><li>• Repeat Offender: [criteria]</li><li>• Serious Charge: [criteria]</li><li>• Recidivism Case: [criteria]</li></ul></Tip></h4>
          {j.highRisk.length ? <ul>{j.highRisk.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="req">No flags</p>}</div>
        <div className="info-card"><h4>Jail Information</h4>
          {j.jail ? <dl className="pairs"><dt>DOC Number</dt><dd>{j.jail.doc}</dd><dt>Docket Number</dt><dd>{j.jail.docket}</dd><dt>POD Number</dt><dd>{j.jail.pod}</dd><dt>POD Level</dt><dd>{j.jail.podLevel}</dd></dl> : <p className="req">Not in county jail</p>}</div>
        <div className="info-card"><h4>Justice Involvement</h4><ul>
          {j.involvement.activeDV && <li>Active DV Case</li>}
          <li>Adult Criminal Filings: <strong>{j.involvement.adult}</strong></li><li>DV Criminal Filings: <strong>{j.involvement.dvFilings}</strong></li><li>Convictions: <strong>{j.involvement.convictions}</strong></li>
        </ul></div>
        <div className="info-card"><h4>Batterers Intervention Program (BIP)</h4>
          <div className="kv-value" style={{ fontSize: 14, color: 'var(--slate)' }}>Status: <strong>{j.bip || 'Not referred'}</strong>{j.bip && <button type="button" className="icon-btn is-action" aria-label="Open BIP record"><Icon name="external" size={15} /></button>}</div></div>
      </div>
      <section className="view" style={{ gap: 14 }}>
        <h3 className="subtitle">Case History<Tip label="About case history">Criminal cases filed in Pennsylvania courts. OTN opens the case in the UJS Portal.</Tip></h3>
        <div className="filter-pills" role="group" aria-label="Case filter">
          <button type="button" className="filter-pill" aria-pressed={caseFilter === 'all'} onClick={() => setCaseFilter('all')}>All ({j.cases.length})</button>
          <button type="button" className="filter-pill" aria-pressed={caseFilter === 'dv'} onClick={() => setCaseFilter('dv')}>Domestic Violence Arrests ({dvCount})</button>
        </div>
        <Table label="Case history" cols={GRID.cases} min={860} empty="No cases match this filter." head={<SortHead defs={DEFS.cases} sort={sort} onSort={onSort} />}>
          {cases.map((x) => (
            <div className="tr is-row is-ruled" role="row" key={x.otn}>
              <div className="td" role="cell"><a className="link-btn is-inline" style={{ padding: 0, textDecoration: 'none' }} href="https://ujsportal.pacourts.us/" target="_blank" rel="noopener noreferrer">{x.otn}<Icon name="external" size={13} /><span className="sr-only">(opens UJS Portal)</span></a></div>
              <div className="td" role="cell">{x.date}<small>{x.agency}</small></div>
              <div className="td" role="cell">{x.filed}</div>
              <div className="td" role="cell">{x.charge}</div>
              <div className="td" role="cell">{x.disp}</div>
              <div className="td" role="cell">{x.next}<small>{x.nextDate}</small></div>
            </div>
          ))}
        </Table>
      </section>
      <section className="view" style={{ gap: 14 }}>
        <h3 className="subtitle">Probation Information<Tip label="About probation information">From Allegheny County Adult Probation. Updated nightly.</Tip></h3>
        {j.probation ? (
          <div className="card-grid">
            <dl className="info-card pairs is-small"><dt>Status</dt><dd>{j.probation.status}</dd><dt>Unit</dt><dd>{j.probation.unit}</dd><dt>Probation Officer</dt><dd>{j.probation.officer}</dd></dl>
            <dl className="info-card pairs is-small"><dt>Last Intake</dt><dd>{j.probation.lastIntake}</dd><dt>Last Active Date</dt><dd>{j.probation.lastActive}</dd></dl>
          </div>
        ) : <p className="req">No probation record.</p>}
      </section>
      <section className="view" style={{ gap: 16 }}>
        <h3 className="subtitle">Incarceration History<Tip label="About incarceration history">Custody events from the county jail and the PA Board of Probation and Parole, newest first.</Tip></h3>
        {j.incarceration.length ? (
          <>
            <dl className="stats"><div><dt>Total Time in Custody</dt><dd>{j.custody.total}</dd></div><div><dt>Custody Events</dt><dd>{j.custody.events}</dd></div><div><dt>Facilities</dt><dd>{j.custody.facilities}</dd></div></dl>
            {j.incarceration.map((g) => (
              <div className="timeline-group" key={g.label}><span className="year-pill">{g.label}</span>
                <ol className="timeline">
                  {g.items.map((e) => {
                    const open = !!incOpen[e.id];
                    return (
                      <li className={'event is-' + e.kind} key={e.id}><span className="event-dot" aria-hidden="true" />
                        <div className="event-card">
                          <button type="button" className="event-toggle" aria-expanded={open} onClick={() => setIncOpen({ ...incOpen, [e.id]: !open })}>
                            <span className="event-body"><span className="event-title">{e.title}</span>
                              <span className="event-meta"><span><Icon name="building" size={13} />PA Board of Probation &amp; Parole</span></span>
                              <span className="event-meta"><span className="event-tag">{tags[e.kind]}</span><span>{e.range}</span><span><Icon name="clock" size={13} />{e.dur}</span></span></span>
                            <Icon name="chevronDown" size={18} className={'chev' + (open ? ' is-open' : '')} />
                          </button>
                          {open && <dl className="event-details"><div><dt>Facility</dt><dd>{e.facility}</dd></div><div><dt>Admission reason</dt><dd>[Admission reason]</dd></div><div><dt>Release type</dt><dd>[Release type]</dd></div></dl>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </>
        ) : <p className="req">No custody events on record.</p>}
      </section>
    </div>
  );
}

// ================================================================== Providers tab
function Providers({ client: c }) {
  const [query, setQuery] = usePref('prov.' + c.id + '.query', '');
  const [program, setProgram] = usePref('prov.' + c.id + '.program', '');
  const [sort, onSort] = useSort('prov', { key: 'last', dir: 'desc' });
  const all = providerSummary(c);
  const sum = serviceSummary(c);
  const facilities = uniq(c.instances.map((i) => i.facility)).length;
  const rows = sortRows(all.filter((r) => (!program || r.program.split('; ').indexOf(program) >= 0) && matches(r, ['provider', 'program', 'dx', 'facility', 'status'], query)), sort, DEFS.prov);
  return (
    <div className="view" style={{ gap: 18 }}>
      <h2 className="title"><Icon name="lifebuoy" size={22} />Providers</h2>
      <dl className="chips">
        <Chip label="Timeline">{sum.timeline}</Chip><Chip label="Service Instances">{sum.instances.toLocaleString()}</Chip>
        <Chip label="Total Cost">{money(sum.cost)}</Chip><Chip label="Programs">{sum.programs.join('; ')}</Chip><Chip label="Facilities Used">{facilities}</Chip>
      </dl>
      <div className="toolbar">
        <SearchBox id="prov-search" label="Search providers" value={query} onChange={setQuery} />
        <SelectBox id="prov-program" label="Program filter" placeholder="Program Filter" value={program} onChange={setProgram} options={uniq(c.instances.map((i) => i.program))} />
      </div>
      <Table label="Providers" cols={GRID.prov} min={1140} empty="No providers match these filters. Clear the search or program filter to see all providers." head={<SortHead defs={DEFS.prov} sort={sort} onSort={onSort} />}>
        {rows.map((r) => (
          <div className="tr is-row" role="row" key={r.provider}>
            <div className="td is-tight" role="cell"><Link className="link-btn" to={providerRoute(c.id, r.provider)}>{r.provider}</Link></div>
            {['program', 'first', 'last', 'dx', 'facility', 'units', 'status', 'rate', 'rateType', 'cost'].map((key) => <div className="td is-tight" role="cell" key={key}>{r[key]}</div>)}
          </div>
        ))}
      </Table>
      <div className="pager is-start">{countText(rows.length, all.length, 'providers')}</div>
    </div>
  );
}

function Benefits() {
  return <div className="empty-box"><h2 className="title" style={{ fontSize: 18, fontWeight: 600 }}>Benefits</h2><p>This tab is not designed yet. Benefit enrollments currently show under Client Overview › Program Enrollment.</p></div>;
}

// ================================================================== Service and provider details
function DetailChips({ list, client, showProviders }) {
  const firsts = list.map((i) => sortKey(i.first, 'date')).sort();
  const lasts = list.map((i) => sortKey(i.last, 'date')).sort();
  const fmt = (k) => (k ? k.slice(4, 6) + '/' + k.slice(6, 8) + '/' + k.slice(0, 4) : '');
  const yrs = firsts.length ? ((new Date(fmt(lasts[lasts.length - 1])) - new Date(fmt(firsts[0]))) / (365.25 * 864e5)).toFixed(1) : '0';
  const cost = list.reduce((s, i) => s + sortKey(i.cost, 'num'), 0);
  const provs = uniq(list.map((i) => i.provider));
  return (
    <dl className="chips">
      <Chip label="Timeline">{firsts.length ? `${fmt(firsts[0])} – ${fmt(lasts[lasts.length - 1])} (${yrs} years)` : '—'}</Chip>
      <Chip label="Service Instances">{list.length}</Chip>
      <Chip label="Total Cost">{money(cost)}</Chip>
      {showProviders && <Chip label={`Associated Providers (${provs.length})`}><ProviderTags client={client} names={provs} /></Chip>}
      <Chip label="Programs">{uniq(list.map((i) => i.program)).join('; ')}</Chip>
      {!showProviders && <Chip label="Facilities Used">{uniq(list.map((i) => i.facility)).length}</Chip>}
    </dl>
  );
}

function ServiceDetail({ client: c, svc }) {
  const k = 'sd.' + c.id + '.' + svc.id + '.';
  const [query, setQuery] = usePref(k + 'query', '');
  const [provider, setProvider] = usePref(k + 'provider', '');
  const [program, setProgram] = usePref(k + 'program', '');
  const [sort, onSort] = useSort('sd', { key: 'last', dir: 'desc' });
  const all = c.instances.filter((i) => i.service === svc.service);
  const rows = sortRows(all.filter((r) => (!provider || r.provider === provider) && (!program || r.program === program) && matches(r, ['provider', 'program', 'dx', 'facility', 'status'], query)), sort, DEFS.sd);
  const p = usePaged('sd.' + c.id + '.' + svc.id, rows);
  return (
    <div className="view is-detail">
      <h2 className="title"><Icon name="layers" size={26} />Service: {svc.service}</h2>
      <DetailChips list={all} client={c} showProviders />
      <div className="toolbar">
        <SearchBox id="sd-search" label="Search service instances" value={query} onChange={(v) => { setQuery(v); p.reset(); }} />
        <SelectBox id="sd-provider" label="Provider filter" placeholder="Provider Filter" value={provider} onChange={(v) => { setProvider(v); p.reset(); }} options={uniq(all.map((i) => i.provider))} />
        <SelectBox id="sd-program" label="Program filter" placeholder="Program Filter" value={program} onChange={(v) => { setProgram(v); p.reset(); }} options={uniq(all.map((i) => i.program))} />
      </div>
      <Table label="Service instances" cols={GRID.sd} min={1100} empty="No service instances match these filters. Clear the search or filters to see all of them." head={<SortHead defs={DEFS.sd} sort={sort} onSort={onSort} />}>
        {p.items.map((r, i) => (
          <div className="tr is-row" role="row" key={r.provider + r.first + i}>
            {DEFS.sd.map((d) => <div className="td is-tight" role="cell" key={d.key}>{d.key === 'provider' ? <Link className="link-btn" to={providerRoute(c.id, r.provider)}>{r.provider}</Link> : r[d.key]}</div>)}
          </div>
        ))}
      </Table>
      <Pager p={p} />
    </div>
  );
}

function ProviderDetail({ client: c, name }) {
  const k = 'pd.' + c.id + '.' + name + '.';
  const [query, setQuery] = usePref(k + 'query', '');
  const [program, setProgram] = usePref(k + 'program', '');
  const [sort, onSort] = useSort('pd', { key: 'last', dir: 'desc' });
  const info = PROVIDERS.find((x) => x.name === name) || {};
  const all = c.instances.filter((i) => i.provider === name);
  const rows = sortRows(all.filter((r) => (!program || r.program === program) && matches(r, ['service', 'program', 'facility', 'status'], query)), sort, DEFS.pd);
  const p = usePaged('pd.' + c.id + '.' + name, rows);
  const sid = (service) => (c.services.find((s) => s.service === service) || {}).id;
  const addr = String(info.address || '').split(', ');
  return (
    <div className="view is-detail">
      <h2 className="title"><Icon name="lifebuoy" size={24} />Provider: {name}</h2>
      <dl className="chips" style={{ gap: '14px 48px' }}>
        <div className="kv" style={{ gap: 4 }}><dt className="kv-label" style={{ fontSize: 10 }}>Main Address</dt><dd style={{ fontSize: 12, color: 'var(--black)' }}>{addr[0]},<br />{addr.slice(1).join(', ')}</dd></div>
        <div className="kv" style={{ gap: 4 }}><dt className="kv-label" style={{ fontSize: 10 }}>Main Phone Number</dt><dd className="kv-value num" style={{ fontSize: 12, gap: 6 }}>{info.phone}<span style={{ color: 'var(--blue)' }}><Icon name="phone" size={14} /></span></dd></div>
        <div className="kv" style={{ gap: 4 }}><dt className="kv-label" style={{ fontSize: 10 }}>Main Email</dt><dd className="kv-value" style={{ fontSize: 12, gap: 6 }}>{info.email}<span style={{ color: 'var(--blue)' }}><Icon name="mail" size={14} /></span></dd></div>
      </dl>
      <DetailChips list={all} client={c} />
      <div className="toolbar">
        <SearchBox id="pd-search" label="Search this provider's services" value={query} onChange={(v) => { setQuery(v); p.reset(); }} />
        <SelectBox id="pd-program" label="Program filter" placeholder="Program Filter" value={program} onChange={(v) => { setProgram(v); p.reset(); }} options={uniq(all.map((i) => i.program))} />
      </div>
      <Table label="Services from this provider" cols={GRID.pd} min={1060} empty="No services from this provider match these filters. Clear the search or program filter to see all of them." head={<SortHead defs={DEFS.pd} sort={sort} onSort={onSort} />}>
        {p.items.map((r, i) => (
          <div className="tr is-row" role="row" key={r.service + r.first + i}>
            <div className="td is-tight" role="cell">{sid(r.service) ? <Link className="link-btn" to={serviceRoute(c.id, sid(r.service))}>{r.service}</Link> : r.service}</div>
            {DEFS.pd.slice(1).map((d) => <div className="td is-tight" role="cell" key={d.key}>{r[d.key]}</div>)}
          </div>
        ))}
      </Table>
      <Pager p={p} />
    </div>
  );
}

// ================================================================== Notes and action items (shared by the panel and the full pages)
// Drafts live in saved preferences, so a half-written note survives a reload or a trip to another page.
function useNoteDraft(clientId) {
  const [d, setD] = usePref('draft.note.' + clientId, null);
  const { mutate } = useStore();
  const focus = () => setTimeout(() => { const el = document.getElementById('note-draft'); if (el) el.focus(); }, 0);
  return {
    d,
    start: () => { setD({ editing: null, text: '', restricted: false, error: false }); focus(); },
    edit: (n) => { setD({ editing: n.id, text: n.text, restricted: !!n.restricted, error: false }); focus(); },
    set: (patch) => setD({ ...d, ...patch }),
    cancel: () => setD(null),
    save: () => {
      const text = (d.text || '').trim();
      if (!text) { setD({ ...d, error: true }); focus(); return null; }
      if (d.editing) {
        mutate((db) => ({ ...db, notes: db.notes.map((x) => (x.id === d.editing ? { ...x, text, edited: true, restricted: d.restricted } : x)) }), 'Case note updated');
      } else {
        const id = 'n' + Date.now();
        mutate((db) => ({ ...db, notes: [{ id, clientId, date: isoToUS(todayISO()), edited: false, restricted: d.restricted, tag: 'PERSONAL', author: ME, text }].concat(db.notes) }), 'Case note saved');
        setD(null);
        return id;
      }
      setD(null);
      return d.editing;
    }
  };
}
function useActionDraft(clientId) {
  const [d, setD] = usePref('draft.action.' + clientId, null);
  const { mutate } = useStore();
  const focus = () => setTimeout(() => { const el = document.getElementById('action-draft'); if (el) el.focus(); }, 0);
  return {
    d,
    start: () => { setD({ editing: null, text: '', assignee: ME, due: '', error: false }); focus(); },
    edit: (a) => { setD({ editing: a.id, text: a.text, assignee: a.assignee || ME, due: a.due || '', error: false }); focus(); },
    set: (patch) => setD({ ...d, ...patch }),
    cancel: () => setD(null),
    save: () => {
      const text = (d.text || '').trim();
      if (!text) { setD({ ...d, error: true }); focus(); return false; }
      const fields = { text, assignee: d.assignee || ME, due: d.due || '' };
      if (d.editing) mutate((db) => ({ ...db, actions: db.actions.map((x) => (x.id === d.editing ? { ...x, ...fields, edited: true } : x)) }), 'Action item updated');
      else mutate((db) => ({ ...db, actions: [{ id: 'a' + Date.now(), clientId, tag: 'PERSONAL', done: false, edited: false, ...fields }].concat(db.actions) }), 'Action item added');
      setD(null);
      return true;
    }
  };
}

function NoteComposer({ draft, isPage }) {
  const d = draft.d;
  if (!d) return null;
  return (
    <div className={'composer' + (isPage ? ' is-page' : '')}>
      {isPage && (
        <div className="composer-meta"><strong>{d.editing ? 'Edit Case Note' : 'Add New Case Note'}</strong>
          <LockBadge restricted={d.restricted} />
          <span className="sep">{isoToUS(todayISO())}</span><span className="sep">{me.first} {me.last} ({me.org})</span></div>
      )}
      {isPage ? <label className="sr-only" htmlFor="note-draft">Case note</label> : <label className="field-label" htmlFor="note-draft">{d.editing ? 'Edit case note' : 'New case note'}</label>}
      <textarea className="input is-block" id="note-draft" rows={isPage ? 4 : 3} placeholder="Enter case note" value={d.text} onChange={(e) => draft.set({ text: e.target.value, error: false })} />
      {d.error && <span className="error" role="alert">Write the note before saving.</span>}
      {isPage ? (
        <div className="composer-foot is-split">
          <button type="button" className="btn-text" onClick={draft.cancel}>Cancel</button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <label className="toggle" htmlFor="note-restricted">Restricted note <input type="checkbox" id="note-restricted" checked={d.restricted} onChange={(e) => draft.set({ restricted: e.target.checked })} /></label>
            <button type="button" className="btn-primary" onClick={draft.save}>Save</button>
          </span>
        </div>
      ) : (
        <div className="composer-foot">
          <label className="toggle" htmlFor="note-restricted" style={{ marginRight: 'auto', fontSize: 12 }}>Restricted <input type="checkbox" id="note-restricted" checked={d.restricted} onChange={(e) => draft.set({ restricted: e.target.checked })} /></label>
          <button type="button" className="btn-text" onClick={draft.cancel}>Cancel</button><button type="button" className="btn-outline is-wide" onClick={draft.save}>Save</button>
        </div>
      )}
    </div>
  );
}

function ActionComposer({ draft }) {
  const d = draft.d;
  if (!d) return null;
  return (
    <div className="composer">
      <label className="sr-only" htmlFor="action-draft">Action item</label>
      <input className="input is-block" id="action-draft" type="text" placeholder="Enter action item here" value={d.text} onChange={(e) => draft.set({ text: e.target.value, error: false })} />
      <div className="composer-row">
        <label className="sr-only" htmlFor="action-assignee">Assignee</label>
        <select className="select" id="action-assignee" value={d.assignee} onChange={(e) => draft.set({ assignee: e.target.value })} style={{ flex: '1 1 150px' }}>
          {STAFF.map((s) => <option key={s.id} value={s.id}>{s.first} {s.last}{s.id === ME ? ' (me)' : ''}</option>)}
        </select>
        <label className="sr-only" htmlFor="action-due">Due date (optional)</label>
        <input className="input" id="action-due" type="date" value={d.due} onChange={(e) => draft.set({ due: e.target.value })} />
      </div>
      {d.error && <span className="error" role="alert">Describe the action item before saving.</span>}
      <div className="composer-foot"><button type="button" className="btn-text" onClick={draft.cancel}>Cancel</button><button type="button" className="btn-outline is-wide" onClick={draft.save}>Save</button></div>
    </div>
  );
}

function useClientLists(c) {
  const { state } = useStore();
  const [noteSort, setNoteSort] = usePref('notes.sort', 'desc');
  const dir = noteSort === 'asc' ? 1 : -1;
  const notes = state.db.notes.filter((n) => n.clientId === c.id).sort((a, b) => { const x = sortKey(a.date, 'date'), y = sortKey(b.date, 'date'); return x < y ? -dir : x > y ? dir : 0; });
  const actions = state.db.actions.filter((a) => a.clientId === c.id);
  return { notes, actions, noteSort, setNoteSort };
}
function NoteSortButton({ sort, setSort }) {
  const text = sort === 'asc' ? 'Oldest first' : 'Newest first';
  return (
    <div className="list-head">
      <button type="button" className="sort-btn" aria-label={'Date, ' + text.toLowerCase() + '. Reverse order'} onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}>
        Date <Icon name="sortLines" size={14} className={sort === 'asc' ? 'flip' : ''} /><span>{text}</span>
      </button>
    </div>
  );
}
const byDue = (a, b) => ((a.due || '9999') < (b.due || '9999') ? -1 : 1);

function ClientNotesPage({ client: c }) {
  const { notes, noteSort, setNoteSort } = useClientLists(c);
  const draft = useNoteDraft(c.id);
  const { removeNote } = useTaskActions();
  const p = usePaged('clientNotes.' + c.id, notes);
  return (
    <section className="list-card" aria-labelledby="all-notes-h">
      <div className="card-head">
        <h2 className="card-title" id="all-notes-h"><Icon name="notes" size={22} />All Case Notes <span>({plural(notes.length, 'note', 'notes')})</span></h2>
        {!draft.d && <button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Case Note</button>}
      </div>
      <NoteComposer draft={{ ...draft, save: () => { if (draft.save() && !draft.d.editing) { setNoteSort('desc'); p.reset(); } } }} isPage />
      <NoteSortButton sort={noteSort} setSort={setNoteSort} />
      <ul className="feed">
        {p.items.length ? p.items.map((n) => <NoteRow key={n.id} note={n} lock onEdit={() => draft.edit(n)} onDelete={() => removeNote(n)} />) : <li className="empty">No case notes for this client yet. Add the first one above.</li>}
      </ul>
      <Pager p={p} />
    </section>
  );
}

function ClientActionsPage({ client: c }) {
  const { actions } = useClientLists(c);
  const draft = useActionDraft(c.id);
  const { remove } = useTaskActions();
  const [status, setStatus] = usePref('clientActions.status', 'open');
  const open = actions.filter((a) => !a.done), over = actions.filter(isOverdue), done = actions.filter((a) => a.done);
  const list = (status === 'overdue' ? over : status === 'completed' ? done : open).slice().sort(byDue);
  const p = usePaged('clientActions.' + c.id, list);
  return (
    <section className="list-card" aria-labelledby="all-actions-h">
      <div className="card-head">
        <h2 className="card-title" id="all-actions-h"><Icon name="inbox" size={22} />Action Items <span>({plural(actions.length, 'item', 'items')})</span></h2>
        {!draft.d && <button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Action Item</button>}
      </div>
      <ActionComposer draft={{ ...draft, save: () => { if (draft.save() && status === 'completed') setStatus('open'); } }} />
      <Segmented small fill label="Status" value={status} onChange={(v) => { setStatus(v); p.reset(); }}
        options={[{ id: 'open', label: `Open (${open.length})` }, { id: 'overdue', label: `Overdue (${over.length})`, icon: 'alert' }, { id: 'completed', label: `Completed (${done.length})` }]} />
      <ul className="feed">
        {p.items.length ? p.items.map((a) => <ActionRow key={a.id} action={a} showAssignee onEdit={() => draft.edit(a)} onDelete={() => remove(a)} />) : <li className="empty">No action items here. Try another status or add one above.</li>}
      </ul>
      <Pager p={p} />
    </section>
  );
}

function Panel({ client: c, open, setOpen }) {
  const { notes, actions, noteSort, setNoteSort } = useClientLists(c);
  const noteDraft = useNoteDraft(c.id);
  const actionDraft = useActionDraft(c.id);
  const { toggle, remove, removeNote } = useTaskActions();
  const [noteOpen, setNoteOpen] = usePref('panel.noteOpen', {});
  const [filter, setFilter] = usePref('panel.actionFilter', 'open');
  if (!open) {
    return (
      <aside className="panel-rail" aria-label="Case notes and action items">
        <button type="button" className="rail-btn" aria-label="Expand case notes and action items" aria-expanded="false" style={{ color: 'var(--slate)' }} onClick={() => setOpen(true)}><Icon name="chevronLeft" size={18} /></button>
        <button type="button" className="rail-btn" aria-label="Open case notes" style={{ color: 'var(--slate)' }} onClick={() => setOpen(true)}><Icon name="notes" size={20} /></button>
        <button type="button" className="rail-btn" aria-label="Open action items" style={{ color: 'var(--slate)' }} onClick={() => setOpen(true)}><Icon name="inbox" size={20} /></button>
      </aside>
    );
  }
  const shownNotes = notes.slice(0, 5);
  const counts = { all: actions.length, open: actions.filter((a) => !a.done).length, overdue: actions.filter(isOverdue).length, completed: actions.filter((a) => a.done).length };
  const shown = actions.filter((a) => (filter === 'all' ? true : filter === 'open' ? !a.done : filter === 'overdue' ? isOverdue(a) : a.done)).slice(0, 5); // newest first, so a just-added item is always visible
  const saveNote = () => { const id = noteDraft.save(); if (id) { setNoteOpen({ ...noteOpen, [id]: true }); if (!noteDraft.d.editing) setNoteSort('desc'); } };
  const saveAction = () => { if (actionDraft.save() && filter === 'completed') setFilter('open'); };
  return (
    <aside className="panel" aria-label="Case notes and action items">
      <div className="panel-head">
        <button type="button" className="rail-btn" aria-label="Collapse case notes and action items" aria-expanded="true" onClick={() => setOpen(false)}><Icon name="chevronRight" size={18} /></button>
        <span className="private-pill">Only visible to you</span>
      </div>
      <section className="panel-section" aria-labelledby="notes-h">
        <div className="panel-title-row">
          <h2 className="panel-title" id="notes-h"><Icon name="notes" size={20} />Case Notes <span>({shownNotes.length} of {plural(notes.length, 'note', 'notes')})</span></h2>
          <Link className="link-btn is-small is-inline" to={{ page: 'client', id: c.id, sub: 'notes' }}><Icon name="external" size={14} />View All Case Notes</Link>
        </div>
        <NoteSortButton sort={noteSort} setSort={setNoteSort} />
        <ul className="scroll-list">
          {shownNotes.length ? shownNotes.map((n) => {
            const o = !!noteOpen[n.id];
            const flip = () => setNoteOpen({ ...noteOpen, [n.id]: !o });
            return (
              <li className="note" key={n.id}>
                <Clamp text={n.text} open={o} onToggle={flip} fullClassName="note-full" />
                <div className="meta"><span>{n.date}</span>{n.edited && <span className="sep edited">Edited</span>}
                  {n.restricted && <span className="sep lock is-restricted"><Icon name="lock" size={13} label="Restricted" /></span>}
                  <span className="spacer" />
                  <button type="button" className="icon-btn" aria-label={'Edit note from ' + n.date} onClick={() => noteDraft.edit(n)}><Icon name="edit" size={15} /></button>
                  <button type="button" className="icon-btn is-danger" aria-label={'Delete note from ' + n.date} onClick={() => removeNote(n)}><Icon name="trash" size={15} /></button>
                </div>
              </li>
            );
          }) : <li className="empty" style={{ fontSize: 12 }}>No case notes yet.</li>}
        </ul>
        {noteDraft.d ? <NoteComposer draft={{ ...noteDraft, save: saveNote }} /> : <div className="align-end"><button type="button" className="btn-outline" onClick={noteDraft.start}><Icon name="plusCircle" />Add New Case Note</button></div>}
      </section>
      <section className="panel-section" aria-labelledby="actions-h">
        <div className="panel-title-row">
          <h2 className="panel-title" id="actions-h"><Icon name="inbox" size={20} />Action Items <span>({shown.length} of {plural(actions.length, 'item', 'items')})</span></h2>
          <Link className="link-btn is-small is-inline" to={{ page: 'client', id: c.id, sub: 'actions' }}><Icon name="external" size={14} />View All Action Items</Link>
        </div>
        <Segmented small fill label="Show action items" value={filter} onChange={setFilter}
          options={[{ id: 'all', label: `All (${counts.all})` }, { id: 'open', label: `Open (${counts.open})` }, { id: 'overdue', label: `Overdue (${counts.overdue})`, icon: 'alert' }, { id: 'completed', label: `Completed (${counts.completed})` }]} />
        <ul className="scroll-list">
          {shown.length ? shown.map((a) => {
            const over = isOverdue(a);
            return (
              <li className={'task' + (a.done ? ' is-done' : '')} key={a.id}>
                <input type="checkbox" id={'ai-' + a.id} checked={a.done} onChange={() => toggle(a)} />
                <div className="task-body"><label className="task-text" htmlFor={'ai-' + a.id}>{a.text}</label>
                  <div className="meta"><span>{staffName(a.assignee)}</span>
                    <span className={'sep' + (over ? ' is-overdue' : '')}><Icon name="calendar" size={13} />{a.due ? isoToUS(a.due) : 'No due date'}{over && <Icon name="alert" size={13} label="Overdue" />}</span>
                    {a.edited && <span className="sep edited">Edited</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button type="button" className="icon-btn" aria-label="Edit action item" onClick={() => actionDraft.edit(a)}><Icon name="edit" size={15} /></button>
                  <button type="button" className="icon-btn is-danger" aria-label="Delete action item" onClick={() => remove(a)}><Icon name="trash" size={15} /></button>
                </div>
              </li>
            );
          }) : <li className="empty" style={{ fontSize: 12 }}>Nothing here. Switch filters or add an action item.</li>}
        </ul>
        {actionDraft.d ? <ActionComposer draft={{ ...actionDraft, save: saveAction }} /> : <div className="align-end"><button type="button" className="btn-outline" onClick={actionDraft.start}><Icon name="plusCircle" />Add New Action Item</button></div>}
      </section>
    </aside>
  );
}
