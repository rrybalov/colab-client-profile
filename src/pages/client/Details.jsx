// Service details and provider details pages.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useProvider } from '../../state/data.js';
import { Link } from '../../router.jsx';
import { Loaded, Chip, SearchBox, SelectBox, Table, SortHead, useSort, usePaged, Pager } from '../../ui/controls.jsx';
import { money, sortRows, matches, uniq, timeline, totalCost } from '../../lib.js';
import { TABLES } from '../../tables.js';
import { serviceRoute, providerRoute } from './routes.js';
import { ProviderTags } from './Services.jsx';

// Summary chips for a set of service instances.
function DetailChips({ list, client, showProviders }) {
  const provs = uniq(list.map((i) => i.provider));
  return (
    <dl className="chips">
      <Chip label="Timeline">{timeline(list)}</Chip>
      <Chip label="Service Instances">{list.length}</Chip>
      <Chip label="Total Cost">{money(totalCost(list))}</Chip>
      {showProviders && <Chip label={`Associated Providers (${provs.length})`}><ProviderTags client={client} names={provs} /></Chip>}
      <Chip label="Programs">{uniq(list.map((i) => i.program)).join('; ')}</Chip>
      {!showProviders && <Chip label="Facilities Used">{uniq(list.map((i) => i.facility)).length}</Chip>}
    </dl>
  );
}

export function ServiceDetail({ client: c, svc }) {
  const k = 'sd.' + c.id + '.' + svc.id + '.';
  const [query, setQuery] = usePref(k + 'query', '');
  const [provider, setProvider] = usePref(k + 'provider', '');
  const [program, setProgram] = usePref(k + 'program', '');
  const [sort, onSort] = useSort('sd', TABLES.serviceDetail.sort);
  const all = c.instances.filter((i) => i.service === svc.service);
  const rows = sortRows(all.filter((r) => (!provider || r.provider === provider) && (!program || r.program === program) && matches(r, ['provider', 'program', 'dx', 'facility', 'status'], query)), sort, TABLES.serviceDetail.cols);
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
      <Table label="Service instances" spec={TABLES.serviceDetail} empty="No service instances match these filters. Clear the search or filters to see all of them." head={<SortHead defs={TABLES.serviceDetail.cols} sort={sort} onSort={onSort} />}>
        {p.items.map((r, i) => (
          <div className="tr is-row" role="row" key={r.provider + r.first + i}>
            {TABLES.serviceDetail.cols.map((d) => <div className="td is-tight" role="cell" key={d.key}>{d.key === 'provider' ? <Link className="link-btn" to={providerRoute(c.id, r.provider)}>{r.provider}</Link> : r[d.key]}</div>)}
          </div>
        ))}
      </Table>
      <Pager p={p} />
    </div>
  );
}

function ProviderContact({ info }) {
  const addr = info.address.split(', ');
  const kv = { gap: 4 }, label = { fontSize: 10 };
  return (
    <dl className="chips" style={{ gap: '14px 48px' }}>
      <div className="kv" style={kv}><dt className="kv-label" style={label}>Main Address</dt><dd style={{ fontSize: 12, color: 'var(--black)' }}>{info.address ? <>{addr[0]},<br />{addr.slice(1).join(', ')}</> : 'Not on file'}</dd></div>
      <div className="kv" style={kv}><dt className="kv-label" style={label}>Main Phone Number</dt><dd className="kv-value num" style={{ fontSize: 12, gap: 6 }}>{info.phone || 'Not on file'}{info.phone && <span style={{ color: 'var(--blue)' }}><Icon name="phone" size={14} /></span>}</dd></div>
      <div className="kv" style={kv}><dt className="kv-label" style={label}>Main Email</dt><dd className="kv-value" style={{ fontSize: 12, gap: 6 }}>{info.email || 'Not on file'}{info.email && <span style={{ color: 'var(--blue)' }}><Icon name="mail" size={14} /></span>}</dd></div>
    </dl>
  );
}

export function ProviderDetail({ client: c, name }) {
  const k = 'pd.' + c.id + '.' + name + '.';
  const [query, setQuery] = usePref(k + 'query', '');
  const [program, setProgram] = usePref(k + 'program', '');
  const [sort, onSort] = useSort('pd', TABLES.providerDetail.sort);
  const contact = useProvider(name);
  const all = c.instances.filter((i) => i.provider === name);
  const rows = sortRows(all.filter((r) => (!program || r.program === program) && matches(r, ['service', 'program', 'facility', 'status'], query)), sort, TABLES.providerDetail.cols);
  const p = usePaged('pd.' + c.id + '.' + name, rows);
  const sid = (service) => (c.services.find((s) => s.service === service) || {}).id;
  return (
    <div className="view is-detail">
      <h2 className="title"><Icon name="lifebuoy" size={24} />Provider: {name}</h2>
      <Loaded query={contact} what="provider contact details">{() => <ProviderContact info={contact.data} />}</Loaded>
      <DetailChips list={all} client={c} />
      <div className="toolbar">
        <SearchBox id="pd-search" label="Search this provider's services" value={query} onChange={(v) => { setQuery(v); p.reset(); }} />
        <SelectBox id="pd-program" label="Program filter" placeholder="Program Filter" value={program} onChange={(v) => { setProgram(v); p.reset(); }} options={uniq(all.map((i) => i.program))} />
      </div>
      <Table label="Services from this provider" spec={TABLES.providerDetail} empty="No services from this provider match these filters. Clear the search or program filter to see all of them." head={<SortHead defs={TABLES.providerDetail.cols} sort={sort} onSort={onSort} />}>
        {p.items.map((r, i) => (
          <div className="tr is-row" role="row" key={r.service + r.first + i}>
            <div className="td is-tight" role="cell">{sid(r.service) ? <Link className="link-btn" to={serviceRoute(c.id, sid(r.service))}>{r.service}</Link> : r.service}</div>
            {TABLES.providerDetail.cols.slice(1).map((d) => <div className="td is-tight" role="cell" key={d.key}>{r[d.key]}</div>)}
          </div>
        ))}
      </Table>
      <Pager p={p} />
    </div>
  );
}
