// ASC Contacts, the ASC CoLab's home: every call and visit, filtered and sorted, and where to start a new one.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useSession } from '../../state/data.js';
import { useContacts, useAscMutations } from '../../state/asc.js';
import { Link, navigate } from '../../router.jsx';
import { Loaded, Table, FilterCards, usePaged, Pager, SortHead, useSort, SearchBox, SelectBox } from '../../ui/controls.jsx';
import { plural, CHANNELS } from '../../data/asc.js';
import { sortRows } from '../../lib.js';
import { SearchLaunch } from '../hub/HubShell.jsx';
import { channelIcon, channelLabel, personLabel, StatusPill, whenText } from './parts.jsx';

// Contact type and coordinator are their own columns, so they can be sorted and filtered.
const COLS = [
  { key: 'startedTs', label: 'Started', type: 'num' }, { key: 'ref', label: 'Event ID', type: 'text' }, { key: 'person', label: 'Person', type: 'text' },
  { key: 'typeLabel', label: 'Contact type', type: 'text' }, { key: 'staffLabel', label: 'Coordinator', type: 'text' }, { key: 'statusLabel', label: 'Status', type: 'text' }
];
const SPEC = { grid: 'minmax(84px,.9fr) 98px minmax(104px,1.2fr) 100px minmax(96px,1fr) 96px minmax(110px,1.4fr)', min: 690 };
const STATUS = { open: 'In progress', closed: 'Closed' };

export function useStartContact() {
  const { createContact } = useAscMutations();
  return (channel) => createContact({ channel }).then((c) => navigate({ page: 'contact', id: c.id, step: 'intake' }), () => {});
}

export function StartButtons({ small }) {
  const start = useStartContact();
  return (
    <div className="asc-start">
      <button type="button" className="btn-outline" onClick={() => start('person')}><Icon name="door" />New In-Person Contact</button>
      <button type="button" className={small ? 'btn-outline' : 'btn-primary is-icon'} onClick={() => start('phone')}><Icon name="phone" />New Phone Contact</button>
    </div>
  );
}

function Row({ k }) {
  const to = { page: 'contact', id: k.id, step: k.status === 'open' ? 'intake' : 'wrap-up' };
  return (
    <div className="tr is-row is-ruled" role="row">
      <div className="td" role="cell">{whenText(k.startedAt)}</div>
      <div className="td" role="cell"><Link className="link-btn mono" to={to}>{k.ref}</Link></div>
      <div className="td" role="cell">{k.clientId ? <Link className="link-btn" to={{ page: 'client', id: k.clientId, sub: 'tab', tab: 'asc' }}>{k.clientName}</Link> : k.person}</div>
      <div className="td asc-cell-icon" role="cell"><Icon name={channelIcon(k.channel)} size={15} />{k.typeLabel}</div>
      <div className="td" role="cell">{k.staffLabel}</div>
      <div className="td" role="cell"><StatusPill status={k.status} kind={k.closedKind} /></div>
      <div className="td" role="cell">{k.needs.length ? k.needs.map((n) => n.name).join(', ') : '—'}<small>{k.ixCount ? plural(k.ixCount, 'interaction', 'interactions') + ' · ' + k.ixMin + ' min' : ''}</small></div>
    </div>
  );
}

export function AscHome() {
  const { me, staffName } = useSession();
  const { query, contacts: raw } = useContacts({});
  const [chosen, setFilter] = usePref('asc.filter', null);
  const [type, setType] = usePref('asc.type', '');
  const [worker, setWorker] = usePref('asc.worker', '');
  const [search, setSearch] = usePref('asc.query', '');
  const [sort, onSort] = useSort('asc', { key: 'startedTs', dir: 'desc' });
  const contacts = raw.map((k) => ({ ...k, startedTs: new Date(k.startedAt).getTime(), person: k.clientId ? k.clientName : personLabel(k), typeLabel: channelLabel(k.channel), staffLabel: staffName(k.staff), statusLabel: STATUS[k.status] }));
  const mine = contacts.filter((k) => k.staff === me);
  const lists = { open: contacts.filter((k) => k.status === 'open'), mine, closed: contacts.filter((k) => k.status === 'closed'), all: contacts };
  // Starts on contacts in progress, or on all of them when none are.
  const filter = chosen || (lists.open.length ? 'open' : 'all');
  const q = search.trim().toLowerCase();
  const list = sortRows((lists[filter] || lists.open).filter((k) => (!type || k.channel === type) && (!worker || k.staff === worker)
    && (!q || (k.ref + ' ' + k.person + ' ' + k.needs.map((n) => n.name).join(' ')).toLowerCase().indexOf(q) >= 0)), sort, COLS);
  const workers = [...new Set(contacts.map((k) => k.staff))].map((id) => [id, staffName(id)]).sort((a, b) => (a[1] < b[1] ? -1 : 1));
  const p = usePaged('asc.contacts', list, [10, 25, 50]);
  const reset = (fn) => (v) => { fn(v); p.reset(); };
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name="headset" size={28} />ASC Contacts</h1><SearchLaunch /></div>
      <section className="panel-card asc-launch" aria-labelledby="asc-start-h">
        <div className="card-head">
          <h2 className="card-title" id="asc-start-h">Administrative Service Coordination</h2>
          <StartButtons />
        </div>
      </section>
      <section className="panel-card" aria-labelledby="asc-list-h">
        <div className="card-head"><h2 className="card-title" id="asc-list-h"><Icon name="history" size={22} />Contacts {query.ready && <span>({list.length} of {contacts.length})</span>}</h2></div>
        <Loaded query={query} what="contacts">{() => (
          <>
            <FilterCards label="Show contacts" value={filter} onChange={(v) => { setFilter(v); p.reset(); }}
              cards={[{ id: 'open', count: lists.open.length, label: 'In progress' }, { id: 'mine', count: mine.length, label: 'Mine' }, { id: 'closed', count: lists.closed.length, label: 'Closed' }, { id: 'all', count: contacts.length, label: 'All contacts' }]} />
            <div className="toolbar">
              <SearchBox id="asc-search" label="Search contacts" placeholder="Search by person, event ID or need" value={search} onChange={reset(setSearch)} />
              <SelectBox id="asc-type" label="Contact type" placeholder="All contact types" value={type} onChange={reset(setType)} options={Object.entries(CHANNELS)} />
              <SelectBox id="asc-worker" label="Coordinator" placeholder="All coordinators" value={worker} onChange={reset(setWorker)} options={workers} />
            </div>
            <Table label="ASC contacts" spec={SPEC} empty={filter === 'open' && !type && !worker && !q ? 'No contacts in progress. Start one above.' : 'No contacts match. Clear the search or pick another filter.'}
              head={<><SortHead defs={COLS} sort={sort} onSort={(d) => { onSort(d); p.reset(); }} /><div className="th" role="columnheader">Needs</div></>}>
              {p.items.map((k) => <Row key={k.id} k={k} />)}
            </Table>
            <Pager p={p} />
          </>
        )}</Loaded>
      </section>
    </>
  );
}
