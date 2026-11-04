// Services tab: every service the client has received, with search, filters, sorting and paging.
import React, { useMemo, useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { Link, navigate } from '../../router.jsx';
import { Chip, SearchBox, SelectBox, Segmented, Table, SortHead, useSort, usePaged, Pager, useDismiss } from '../../ui/controls.jsx';
import { countText, money, sortKey, sortRows, matches, serviceSummary, uniq } from '../../lib.js';
import { TABLES } from '../../tables.js';
import { serviceRoute, providerRoute } from './routes.js';

export function ProviderTags({ client, names }) {
  return names.map((n) => <Link key={n} className="tag" to={providerRoute(client.id, n)} aria-label={'Open provider ' + n}>{n}</Link>);
}

const CATEGORIES = ['Behavioral Health', 'Child Welfare', 'Developmental Support', 'Family Strengthening', 'Housing', 'Justice Involvement', 'Physical Health'];
export function Services({ client: c }) {
  const k = 'svc.' + c.id + '.';
  const [mode, setMode] = usePref('svc.mode', 'all');
  const [query, setQuery] = usePref(k + 'query', '');
  const [provider, setProvider] = usePref(k + 'provider', '');
  const [area, setArea] = usePref(k + 'area', '');
  const [category, setCategory] = usePref(k + 'category', '');
  const [from, setFrom] = usePref(k + 'from', '');
  const [sort, onSort] = useSort('svc', TABLES.services.sort);
  const [menuRow, setMenuRow] = useState(null);
  const [popOpen, setPopOpen] = useState(false);
  const popRef = useDismiss(popOpen, () => setPopOpen(false));
  const menuRef = useDismiss(!!menuRow, () => setMenuRow(null));
  const grouped = mode === 'grouped';
  const sum = useMemo(() => serviceSummary(c), [c]);
  const fromKey = from ? from.replace(/-/g, '') : '';
  const rows = sortRows(c.services.map((r) => { const provs = grouped ? r.grouped : r.all; return { ...r, provs, provSort: provs[0] || '' }; }).filter((r) => {
    if (provider && r.provs.indexOf(provider) < 0) return false;
    if (area && r.area !== area) return false;
    if (category && r.program !== category) return false;
    if (fromKey && sortKey(r.last, 'date') < fromKey) return false;
    return matches(r, ['service', 'area', 'program', 'provs'], query);
  }), sort, TABLES.services.cols);
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
      <Table label="Services" spec={TABLES.services} empty="No services match these filters. Clear the search or filters to see all services."
        head={<><SortHead defs={TABLES.services.cols} sort={sort} onSort={(d) => { onSort(d); setMenuRow(null); }} /><div className="th" role="columnheader"><span className="sr-only">Actions</span></div></>}>
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
