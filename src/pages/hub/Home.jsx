import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useStarred, useMyActions, useMyNotes, useClientsById, useSession } from '../../state/data.js';
import { Link } from '../../router.jsx';
import { Segmented, Loaded } from '../../ui/controls.jsx';
import { ActionRow, NoteRow, StarButton, CopyButton, clientRoute } from '../../ui/records.jsx';
import { byDueAsc, displayName, fullName, isOverdue, sortKey } from '../../lib.js';
import { ColabNotice, SearchLaunch, useColabScope } from './HubShell.jsx';

const PER_PAGE = 8;

function StarredCarousel() {
  const scope = useColabScope();
  const { query, clients } = useStarred();
  const [pageRaw, setPage] = usePref('home.starPage', 0);
  const starred = clients.filter(scope.client).sort((a, b) => (sortKey(b.favorited, 'date') > sortKey(a.favorited, 'date') ? 1 : -1));
  const pages = Math.max(1, Math.ceil(starred.length / PER_PAGE));
  const page = Math.min(pageRaw, pages - 1);
  const shown = starred.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  return (
    <section className="panel-card" aria-labelledby="starred-h">
      <div className="card-head">
        <h2 className="card-title" id="starred-h"><Icon name="star" size={22} />My Starred Clients {query.ready && <span>({shown.length} of {starred.length})</span>}</h2>
        <Link className="link-btn is-small is-inline" to="#starred-clients"><Icon name="external" size={14} />View All Starred Clients</Link>
      </div>
      <Loaded query={query} what="starred clients">{() => (starred.length ? (
        <div className="carousel">
          <button type="button" className="carousel-btn" aria-label="Previous starred clients" disabled={page === 0} onClick={() => setPage(page - 1)}><Icon name="chevronLeft" size={30} /></button>
          <div className="star-grid">
            {shown.map((c) => (
              <div className="star-card" key={c.id}>
                <div className="star-card-top">
                  <Link className="link-btn" to={clientRoute(c.id)}><Icon name={c.household ? 'users' : 'user'} /><span>{displayName(c)}</span></Link>
                  <StarButton client={c} />
                </div>
                <div className="id-line">MCI ID: {c.mci}<CopyButton value={c.mci} label={'MCI ID for ' + fullName(c)} className="icon-btn" /></div>
                <div className="id-line">SSN: *{c.ssn4}<CopyButton value={c.ssn4} label={'SSN last 4 for ' + fullName(c)} className="icon-btn" /></div>
              </div>
            ))}
          </div>
          <button type="button" className="carousel-btn" aria-label="Next starred clients" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><Icon name="chevronRight" size={30} /></button>
        </div>
      ) : (
        <div className="empty-state"><Icon name="star" size={28} /><strong>No starred clients yet</strong><span>Star a client from search or their profile to keep them here.</span></div>
      ))}</Loaded>
    </section>
  );
}

function RecentActions() {
  const scope = useColabScope();
  const lookup = useClientsById();
  const { query, actions } = useMyActions();
  const [tab, setTab] = usePref('home.actionTab', 'open');
  const mine = actions.filter(scope.item);
  const open = mine.filter((a) => !a.done), over = mine.filter(isOverdue);
  const list = (tab === 'overdue' ? over : open).slice().sort(byDueAsc).slice(0, 5);
  return (
    <section className="panel-card" aria-labelledby="recent-a-h">
      <div className="card-head">
        <h2 className="card-title" id="recent-a-h"><Icon name="inbox" size={22} />Recent Action Items {query.ready && <span>({list.length} of {mine.length})</span>}</h2>
        <Link className="link-btn is-small is-inline" to="#my-action-items"><Icon name="external" size={14} />View All Action Items</Link>
      </div>
      <Loaded query={query} what="action items">{() => (
        <>
          <Segmented small fill label="Show action items" value={tab} onChange={setTab}
            options={[{ id: 'open', label: `Open (${open.length})` }, { id: 'overdue', label: `Overdue (${over.length})`, icon: 'alert' }]} />
          <ul className="feed">
            {list.length ? list.map((a) => <ActionRow key={a.id} action={a} client={lookup[a.clientId]} showClient idPrefix="ha" />) : <li className="empty">Nothing here.</li>}
          </ul>
        </>
      )}</Loaded>
    </section>
  );
}

function RecentNotes() {
  const scope = useColabScope();
  const lookup = useClientsById();
  const { query, notes } = useMyNotes();
  const mine = notes.filter(scope.item);
  const recent = mine.slice(0, 5);
  return (
    <section className="panel-card" aria-labelledby="recent-n-h">
      <div className="card-head">
        <h2 className="card-title" id="recent-n-h"><Icon name="notes" size={22} />Recent Case Notes {query.ready && <span>({recent.length} of {mine.length})</span>}</h2>
        <Link className="link-btn is-small is-inline" to="#my-case-notes"><Icon name="external" size={14} />View All Case Notes</Link>
      </div>
      <Loaded query={query} what="case notes">{() => (
        <>
          <div className="list-head"><span className="sort-btn" style={{ cursor: 'default' }}>Date <Icon name="sortLines" size={14} /><span>Newest first</span></span></div>
          <ul className="feed is-scroll">
            {recent.length ? recent.map((n) => <NoteRow key={n.id} note={n} client={lookup[n.clientId]} showClient lock clampKey="home" />) : <li className="empty">No case notes yet.</li>}
          </ul>
        </>
      )}</Loaded>
    </section>
  );
}

export function Home() {
  const { user } = useSession();
  return (
    <>
      <div className="page-head"><h1 className="page-title is-welcome">Welcome, {user.first} <span aria-hidden="true">👋</span></h1><SearchLaunch /></div>
      <ColabNotice />
      <StarredCarousel />
      <div className="home-grid">
        <RecentActions />
        <RecentNotes />
      </div>
    </>
  );
}
