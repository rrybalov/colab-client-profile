// ASC Contacts: every call and visit, open ones first, and where to start a new one.
// Also the small launch card on CoLab Home when the ASC CoLab is chosen.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useSession } from '../../state/data.js';
import { useContacts, useAscMutations } from '../../state/asc.js';
import { Link, navigate } from '../../router.jsx';
import { Loaded, Table, FilterCards, usePaged, Pager } from '../../ui/controls.jsx';
import { plural } from '../../data/asc.js';
import { SearchLaunch } from '../hub/HubShell.jsx';
import { channelIcon, channelLabel, personLabel, StatusPill, whenText } from './parts.jsx';

// Six columns so the list fits a laptop with the sidebar open; contact type and coordinator sit under the person.
const SPEC = { grid: 'minmax(104px,1fr) 100px minmax(150px,1.5fr) minmax(130px,1.4fr) 112px 108px', min: 680 };
const HEAD = ['Started', 'Event ID', 'Person', 'Needs', 'Interactions', 'Status'].map((h) => <div className="th" role="columnheader" key={h}>{h}</div>);

export function useStartContact() {
  const { createContact } = useAscMutations();
  return (channel) => createContact({ channel }).then((c) => navigate({ page: 'contact', id: c.id, step: 'intake' }), () => {});
}

export function StartButtons({ small }) {
  const start = useStartContact();
  return (
    <div className="asc-start">
      <button type="button" className={small ? 'btn-outline' : 'btn-primary is-icon'} onClick={() => start('phone')}><Icon name="phone" />New Phone Contact</button>
      <button type="button" className="btn-outline" onClick={() => start('person')}><Icon name="door" />New In-Person Contact</button>
    </div>
  );
}

function Row({ k }) {
  const { staffName } = useSession();
  const to = { page: 'contact', id: k.id, step: k.status === 'open' ? 'intake' : 'wrap-up' };
  return (
    <div className="tr is-row is-ruled" role="row">
      <div className="td" role="cell">{whenText(k.startedAt)}</div>
      <div className="td" role="cell"><Link className="link-btn mono" to={to}>{k.ref}</Link></div>
      <div className="td" role="cell">{k.clientId ? <Link className="link-btn" to={{ page: 'client', id: k.clientId, sub: 'tab', tab: 'asc' }}>{k.clientName}</Link> : personLabel(k)}
        <small className="asc-cell-icon"><Icon name={channelIcon(k.channel)} size={13} />{channelLabel(k.channel)} · {staffName(k.staff)}</small></div>
      <div className="td" role="cell">{k.needs.length ? k.needs.map((n) => n.name).join(', ') : '—'}</div>
      <div className="td" role="cell">{k.ixCount ? plural(k.ixCount, 'interaction', 'interactions') : '—'}<small>{k.ixMin ? k.ixMin + ' min · ' + plural(k.ixUnits, 'unit', 'units') : ''}</small></div>
      <div className="td" role="cell"><StatusPill status={k.status} kind={k.closedKind} /></div>
    </div>
  );
}

export function AscHome() {
  const { me } = useSession();
  const { query, contacts } = useContacts({});
  const [chosen, setFilter] = usePref('asc.filter', null);
  const mine = contacts.filter((k) => k.staff === me);
  const lists = { open: contacts.filter((k) => k.status === 'open'), mine, closed: contacts.filter((k) => k.status === 'closed'), all: contacts };
  // Starts on contacts in progress, or on all of them when none are.
  const filter = chosen || (lists.open.length ? 'open' : 'all');
  const list = lists[filter] || lists.open;
  const p = usePaged('asc.contacts', list, [10, 25, 50]);
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
            <Table label="ASC contacts" spec={SPEC} head={HEAD} empty={filter === 'open' ? 'No contacts in progress. Start one above.' : 'No contacts here.'}>
              {p.items.map((k) => <Row key={k.id} k={k} />)}
            </Table>
            <Pager p={p} />
          </>
        )}</Loaded>
      </section>
    </>
  );
}

// On CoLab Home, when the ASC CoLab is chosen.
export function AscLaunch() {
  const { query, contacts } = useContacts({ status: 'open' });
  return (
    <section className="panel-card asc-launch" aria-labelledby="asc-home-h">
      <div className="card-head">
        <h2 className="card-title" id="asc-home-h"><Icon name="headset" size={22} />ASC {query.ready && <span>({plural(contacts.length, 'contact', 'contacts')} in progress)</span>}</h2>
        <Link className="link-btn is-small is-inline" to="#asc"><Icon name="external" size={14} />View All ASC Contacts</Link>
      </div>
      <div className="asc-launch-body">
        <StartButtons />
        {query.ready && contacts.length > 0 && (
          <ul className="asc-mini">
            {contacts.slice(0, 3).map((k) => <li key={k.id}><Icon name={channelIcon(k.channel)} size={15} /><Link className="link-btn" to={{ page: 'contact', id: k.id, step: 'intake' }}>Resume {k.ref}</Link><span>{personLabel(k)} · started {whenText(k.startedAt)}</span></li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
