// Address History: every address on record for a client, as a timeline of years and concurrent periods,
// or as a searchable, sortable table. Both views share the program filter.
import React, { useState } from 'react';
import { Icon } from '../../../ui/icons.jsx';
import { usePref } from '../../../state/store.jsx';
import { Link } from '../../../router.jsx';
import { Segmented, useDismiss, Table } from '../../../ui/controls.jsx';
import {
  SOURCE_BUCKETS, byStartDesc, cityLine, concurrentPeriods, countyCount, isOpen, periodMonth, timelineYears
} from '../../../data/addresses.js';
import { AddressCard, AddressDetails, CurrentChip, DateRange, KindIcon, SourceTag, SourceTags } from './parts.jsx';
import { tabRoute } from '../routes.js';

const NO_MATCH = 'No addresses match the current filters.';

function SourceFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const label = value.length === 0 ? 'All sources' : value.length === 1 ? value[0] : value.length + ' sources';
  const toggle = (b) => onChange(value.includes(b) ? value.filter((x) => x !== b) : SOURCE_BUCKETS.filter((x) => x === b || value.includes(x)));
  return (
    <div className="addr-filter">
      <span className="addr-overline" id="src-filter-label">Source</span>
      <div className="pop-anchor" ref={ref}>
        <button type="button" className="select-btn" aria-haspopup="true" aria-expanded={open} aria-labelledby="src-filter-label src-filter-btn" id="src-filter-btn" onClick={() => setOpen(!open)}>
          {label}<Icon name="chevronDown" size={16} />
        </button>
        {open && (
          <div className="popover is-narrow" role="group" aria-label="Filter by source">
            {SOURCE_BUCKETS.map((b) => (
              <label key={b} className="check-row">
                <input type="checkbox" checked={value.includes(b)} onChange={() => toggle(b)} />
                <SourceTag bucket={b} />
              </label>
            ))}
            {value.length > 0 && <div className="popover-foot is-full"><button type="button" className="btn-text" onClick={() => onChange([])}>Clear all</button></div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ list, openId, toggle }) {
  if (!list.length) return <p className="empty">{NO_MATCH}</p>;
  return (
    <div className="addr-timeline">
      {timelineYears(list).map(({ year, groups }) => (
        <div className="addr-year-row" key={year}>
          <div className="addr-year">{year}</div>
          <div className="addr-stack">
            {groups.map((g) => (g.type === 'concurrent' ? (
              <section className="addr-period" key={'p' + g.addrs[0].id} aria-label={'Concurrent reports, ' + periodMonth(g.start) + ' to ' + periodMonth(g.end)}>
                <p className="addr-period-head"><Icon name="alert" size={16} />Concurrent reports ({g.addrs.length} addresses reported between {periodMonth(g.start)} and {periodMonth(g.end)})</p>
                <div className="addr-stack">
                  {g.addrs.map((a) => <AddressCard key={a.id} addr={a} open={openId === a.id} onToggle={() => toggle(a.id)} />)}
                </div>
              </section>
            ) : <AddressCard key={g.addr.id} addr={g.addr} open={openId === g.addr.id} onToggle={() => toggle(g.addr.id)} />))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Columns sort like the prototype: a new column starts descending, a second click reverses it.
const SORTS = {
  street: (a) => a.street,
  start: (a) => a.start,
  end: (a) => a.end || '9999',
  county: (a) => a.county
};
const TABLE = { grid: '40px minmax(260px, 2fr) minmax(150px, 1fr) minmax(140px, 1fr) 96px', min: 760 };

function AddressTable({ client, list, total, openId, toggle }) {
  const [search, setSearch] = usePref('address.search.' + client.id, '');
  const [sort, setSort] = usePref('sort.addresses', { key: 'start', dir: 'desc' });
  const q = search.trim().toLowerCase();
  const rows = list.filter((a) => !q || a.street.toLowerCase().includes(q) || a.city.toLowerCase().includes(q))
    .slice().sort((a, b) => {
      const x = SORTS[sort.key](a), y = SORTS[sort.key](b);
      return x < y ? (sort.dir === 'asc' ? -1 : 1) : x > y ? (sort.dir === 'asc' ? 1 : -1) : 0;
    });
  const head = (key, label) => {
    const on = sort.key === key;
    return (
      <div className="th" role="columnheader" aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className={'sort-btn' + (on ? ' is-active' : '')} onClick={() => setSort(on ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })}>
          {label}{on && <Icon name="chevronDown" size={14} className={'sort-icon' + (sort.dir === 'asc' ? ' is-asc' : '')} />}
        </button>
      </div>
    );
  };
  return (
    <>
      <div className="toolbar">
        <label className="sr-only" htmlFor="addr-search">Search addresses</label>
        <input className="input is-search" id="addr-search" type="search" placeholder="Search address or city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="addr-count" role="status">{rows.length} of {total} shown</span>
      </div>
      <Table label="Address history" spec={TABLE} empty={NO_MATCH}
        head={<><div className="th" role="columnheader"><span className="sr-only">Details</span></div>{head('street', 'Address')}{head('start', 'Date Range')}<div className="th" role="columnheader">Sources</div><div className="th" role="columnheader">Reports</div></>}>
        {rows.flatMap((a) => {
          const open = openId === a.id, current = isOpen(a);
          const out = [(
            <div className={'tr is-row is-ruled addr-row' + (open ? ' is-open' : '')} role="row" key={a.id} onClick={() => toggle(a.id)}>
              <div className="td is-tight" role="cell">
                <button type="button" className="icon-btn" aria-expanded={open} aria-label={(open ? 'Hide' : 'Show') + ' details for ' + a.street} onClick={(e) => { e.stopPropagation(); toggle(a.id); }}>
                  <Icon name="chevronRight" size={18} className={'addr-chev' + (open ? ' is-open' : '')} />
                </button>
              </div>
              <div className="td" role="cell">
                <span className="addr-cell">
                  <KindIcon kind={a.kind} size={16} />
                  <span className="addr-main">
                    <span className="addr-street-row"><span className={'addr-street' + (current ? ' is-current' : ' is-past')}>{a.street}</span>{a.conflict && <span className="addr-concurrent-chip">concurrent</span>}{current && <CurrentChip label="Active" />}</span>
                    <span className="addr-city">{cityLine(a)}</span>
                  </span>
                </span>
              </div>
              <div className="td" role="cell"><DateRange addr={a} /></div>
              <div className="td" role="cell"><SourceTags addr={a} /></div>
              <div className="td" role="cell"><strong>{a.reports.length}</strong> <span className="addr-sub">report{a.reports.length !== 1 ? 's' : ''}</span></div>
            </div>
          )];
          if (open) out.push(<div className="addr-detail-row" role="row" key={a.id + '-d'}><div role="cell"><AddressDetails addr={a} /></div></div>);
          return out;
        })}
      </Table>
    </>
  );
}

export function AddressHistory({ client }) {
  const [view, setView] = usePref('address.view', 'timeline');
  const [sources, setSources] = usePref('address.sources.' + client.id, []);
  const [openId, setOpenId] = usePref('address.open.' + client.id, null);
  const all = client.addresses;
  const list = all.filter((a) => sources.length === 0 || a.sources.some((s) => sources.includes(s))).sort(byStartDesc);
  const periods = concurrentPeriods(list);
  const toggle = (id) => setOpenId(openId === id ? null : id);
  const changeSources = (v) => { setSources(v); setOpenId(null); };
  const changeView = (v) => { setOpenId(null); setView(v); };
  return (
    <div className="view is-detail addr-history">
      <Link className="link-btn is-small is-inline addr-back" to={tabRoute(client.id, 'overview')}><Icon name="arrowLeft" size={16} />Back to Client Overview</Link>
      <div className="view-head">
        <div>
          <h2 className="title"><Icon name="pin" size={24} />Address History</h2>
          <p className="addr-sub">{all.length} address{all.length !== 1 ? 'es' : ''} on record · {countyCount(all)} counties/states</p>
        </div>
        <Segmented label="Address history view" value={view} onChange={changeView} options={[{ id: 'timeline', icon: 'timeline', label: 'Timeline' }, { id: 'table', icon: 'list', label: 'Table' }]} />
      </div>
      <div className="addr-filterbar">
        {periods > 0 && <span className="addr-periods"><span aria-hidden="true">⇉</span> {periods} concurrent period{periods > 1 ? 's' : ''}</span>}
        <SourceFilter value={sources} onChange={changeSources} />
      </div>
      {view === 'timeline'
        ? <Timeline list={list} openId={openId} toggle={toggle} />
        : <AddressTable client={client} list={list} total={all.length} openId={openId} toggle={toggle} />}
    </div>
  );
}
