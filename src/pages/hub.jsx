// The CoLab hub: Home, My Action Items, My Case Notes, Starred Clients.
import React, { useMemo, useState } from 'react';
import { Icon, BrandMark } from '../icons.jsx';
import { useStore, usePref } from '../store.jsx';
import { Link } from '../router.jsx';
import { COLABS, STAFF, ME, colabTag, displayName, dobText, fullName, isOverdue, byDateDesc, matches, sortRows, sortKey } from '../lib.js';
import { ActionRow, NoteRow, FilterCards, Segmented, usePaged, Pager, SortHead, useSort, Table, StarButton, CopyButton } from '../ui.jsx';

const me = STAFF.find((s) => s.id === ME);

// The CoLab chosen in the sidebar narrows every hub page.
export function useColabScope() {
  const [colab, setColab] = usePref('colab', '');
  const tag = colab ? colabTag(colab) : '';
  return {
    colab, setColab,
    item: (x) => !colab || x.tag === tag,
    client: (c) => !colab || c.colabs.indexOf(colab) >= 0
  };
}

function ColabNotice() {
  const { colab } = useColabScope();
  if (!colab) return null;
  const c = COLABS.find((x) => x.id === colab);
  return <p className="notice"><Icon name="funnel" size={14} /><span>Showing {c ? c.name : colab} only. Choose All CoLabs in the menu to see everything.</span></p>;
}

function ResetData() {
  const { dispatch } = useStore();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return <button type="button" className="side-link side-report" onClick={() => setConfirm(true)}><Icon name="refresh" size={16} />Reset sample data</button>;
  }
  return (
    <div className="reset-confirm" role="group" aria-label="Reset sample data">
      <span>Erase your changes and restore the sample data?</span>
      <div>
        <button type="button" className="btn-text" onClick={() => setConfirm(false)}>Cancel</button>
        <button type="button" className="btn-solid is-danger" onClick={() => { dispatch({ type: 'reset' }); setConfirm(false); }}>Reset</button>
      </div>
    </div>
  );
}

export function HubShell({ page, children }) {
  const { openModal } = useStore();
  const { colab, setColab } = useColabScope();
  const links = [['home', 'home', 'CoLab Home'], ['my-action-items', 'inbox', 'My Action Items'], ['my-case-notes', 'notes', 'My Case Notes'], ['starred-clients', 'star', 'Starred Clients']];
  return (
    <div className="hub">
      <nav className="sidebar" aria-label="CoLab">
        <Link className="brand" to="#home"><BrandMark />CoLab</Link>
        {links.map(([id, ic, label]) => (
          <Link key={id} className="side-link" to={'#' + id} aria-current={page === id ? 'page' : undefined}><Icon name={ic} size={18} />{label}</Link>
        ))}
        <div className="side-divider" role="separator" />
        <label className="sr-only" htmlFor="choose-colab">Choose CoLab</label>
        <select className="side-select" id="choose-colab" value={colab} onChange={(e) => setColab(e.target.value)}>
          <option value="">All CoLabs</option>
          {COLABS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="side-user"><span className="avatar-sm">{me.initials}</span><div><strong>{me.first} {me.last}</strong><span>{me.org}</span></div></div>
        <button type="button" className="side-link side-report" onClick={() => openModal({ id: 'issue' })}><Icon name="wrench" size={16} />Report an Issue</button>
        <ResetData />
      </nav>
      <main className="hub-main" id="main" tabIndex={-1}>{children}</main>
    </div>
  );
}

function SearchLaunch() {
  const { openModal } = useStore();
  return <button type="button" className="search-launch" onClick={() => openModal({ id: 'search' })}><Icon name="search" size={18} />Search for Client</button>;
}

function useLookup() {
  const { state } = useStore();
  return useMemo(() => { const m = {}; state.db.clients.forEach((c) => { m[c.id] = c; }); return m; }, [state.db.clients]);
}
const byDueAsc = (a, b) => (a.due || '9999') < (b.due || '9999') ? -1 : 1;
const byDueDesc = (a, b) => (a.due || '') < (b.due || '') ? 1 : -1;

// ------------------------------------------------------------------ Home
export function Home() {
  const { state } = useStore();
  const scope = useColabScope();
  const lookup = useLookup();
  const [starPageRaw, setStarPage] = usePref('home.starPage', 0);
  const [tab, setTab] = usePref('home.actionTab', 'open');

  const starred = state.db.clients.filter((c) => c.starred && scope.client(c))
    .sort((a, b) => (sortKey(b.favorited, 'date') > sortKey(a.favorited, 'date') ? 1 : -1));
  const per = 8, pages = Math.max(1, Math.ceil(starred.length / per));
  const sp = Math.min(starPageRaw, pages - 1);
  const shown = starred.slice(sp * per, sp * per + per);

  const acts = state.db.actions.filter((a) => a.assignee === ME && scope.item(a));
  const open = acts.filter((a) => !a.done), over = acts.filter(isOverdue);
  const listA = (tab === 'overdue' ? over : open).slice().sort(byDueAsc).slice(0, 5);
  const notes = state.db.notes.filter((n) => n.author === ME && scope.item(n)).sort(byDateDesc);
  const recent = notes.slice(0, 5);

  return (
    <>
      <div className="page-head"><h1 className="page-title is-welcome">Welcome, {me.first} <span aria-hidden="true">👋</span></h1><SearchLaunch /></div>
      <ColabNotice />
      <section className="panel-card" aria-labelledby="starred-h">
        <div className="card-head">
          <h2 className="card-title" id="starred-h"><Icon name="star" size={22} />My Starred Clients <span>({shown.length} of {starred.length})</span></h2>
          <Link className="link-btn is-small is-inline" to="#starred-clients"><Icon name="external" size={14} />View All Starred Clients</Link>
        </div>
        {starred.length ? (
          <div className="carousel">
            <button type="button" className="carousel-btn" aria-label="Previous starred clients" disabled={sp === 0} onClick={() => setStarPage(sp - 1)}><Icon name="chevronLeft" size={30} /></button>
            <div className="star-grid">
              {shown.map((c) => (
                <div className="star-card" key={c.id}>
                  <div className="star-card-top">
                    <Link className="link-btn" to={{ page: 'client', id: c.id, sub: 'tab', tab: 'overview' }}><Icon name={c.household ? 'users' : 'user'} /><span>{displayName(c)}</span></Link>
                    <StarButton client={c} />
                  </div>
                  <div className="id-line">MCI ID: {c.mci}<CopyButton value={c.mci} label={'MCI ID for ' + fullName(c)} className="icon-btn" /></div>
                  <div className="id-line">SSN: *{c.ssn4}<CopyButton value={c.ssn4} label={'SSN last 4 for ' + fullName(c)} className="icon-btn" /></div>
                </div>
              ))}
            </div>
            <button type="button" className="carousel-btn" aria-label="Next starred clients" disabled={sp >= pages - 1} onClick={() => setStarPage(sp + 1)}><Icon name="chevronRight" size={30} /></button>
          </div>
        ) : (
          <div className="empty-state"><Icon name="star" size={28} /><strong>No starred clients yet</strong><span>Star a client from search or their profile to keep them here.</span></div>
        )}
      </section>
      <div className="home-grid">
        <section className="panel-card" aria-labelledby="recent-a-h">
          <div className="card-head">
            <h2 className="card-title" id="recent-a-h"><Icon name="inbox" size={22} />Recent Action Items <span>({listA.length} of {acts.length})</span></h2>
            <Link className="link-btn is-small is-inline" to="#my-action-items"><Icon name="external" size={14} />View All Action Items</Link>
          </div>
          <Segmented small fill label="Show action items" value={tab} onChange={setTab}
            options={[{ id: 'open', label: `Open (${open.length})` }, { id: 'overdue', label: `Overdue (${over.length})`, icon: 'alert' }]} />
          <ul className="feed">
            {listA.length ? listA.map((a) => <ActionRow key={a.id} action={a} client={lookup[a.clientId]} showClient idPrefix="ha" />) : <li className="empty">Nothing here.</li>}
          </ul>
        </section>
        <section className="panel-card" aria-labelledby="recent-n-h">
          <div className="card-head">
            <h2 className="card-title" id="recent-n-h"><Icon name="notes" size={22} />Recent Case Notes <span>({recent.length} of {notes.length})</span></h2>
            <Link className="link-btn is-small is-inline" to="#my-case-notes"><Icon name="external" size={14} />View All Case Notes</Link>
          </div>
          <div className="list-head"><span className="sort-btn" style={{ cursor: 'default' }}>Date <Icon name="sortLines" size={14} /><span>Newest first</span></span></div>
          <ul className="feed is-scroll">
            {recent.length ? recent.map((n) => <NoteRow key={n.id} note={n} client={lookup[n.clientId]} showClient lock clampKey="home" />) : <li className="empty">No case notes yet.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ My Action Items
export function MyActions() {
  const { state } = useStore();
  const scope = useColabScope();
  const lookup = useLookup();
  const [filter, setFilter] = usePref('myActions.filter', 'all');
  const [status, setStatus] = usePref('myActions.status', 'open');
  const base = state.db.actions.filter((a) => a.assignee === ME && scope.item(a));
  const personal = base.filter((a) => a.tag === 'PERSONAL'), shared = base.filter((a) => a.tag !== 'PERSONAL');
  const scoped = filter === 'personal' ? personal : filter === 'colab' ? shared : base;
  const open = scoped.filter((a) => !a.done), over = scoped.filter(isOverdue), done = scoped.filter((a) => a.done);
  const list = (status === 'overdue' ? over : status === 'completed' ? done : open).slice().sort(status === 'completed' ? byDueDesc : byDueAsc);
  const p = usePaged('myActions', list);
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name="inbox" size={26} />My Action Items</h1></div>
      <ColabNotice />
      <section className="panel-card">
        <FilterCards value={filter} onChange={(v) => { setFilter(v); p.reset(); }} cards={[{ id: 'all', label: 'All action items', count: base.length }, { id: 'personal', label: 'Personal', count: personal.length }, { id: 'colab', label: 'CoLab', count: shared.length }]} />
        <Segmented small fill label="Status" value={status} onChange={(v) => { setStatus(v); p.reset(); }}
          options={[{ id: 'open', label: `Open (${open.length})` }, { id: 'overdue', label: `Overdue (${over.length})`, icon: 'alert' }, { id: 'completed', label: `Completed (${done.length})` }]} />
        <ul className="feed">
          {p.items.length ? p.items.map((a) => <ActionRow key={a.id} action={a} client={lookup[a.clientId]} showClient showAssignee />) : <li className="empty">No action items here. Try another filter.</li>}
        </ul>
        <Pager p={p} />
      </section>
    </>
  );
}

// ------------------------------------------------------------------ My Case Notes
export function MyNotes() {
  const { state } = useStore();
  const scope = useColabScope();
  const lookup = useLookup();
  const [filter, setFilter] = usePref('myNotes.filter', 'all');
  const [sort, setSort] = usePref('myNotes.sort', 'desc');
  const base = state.db.notes.filter((n) => n.author === ME && scope.item(n));
  const personal = base.filter((n) => n.tag === 'PERSONAL'), shared = base.filter((n) => n.tag !== 'PERSONAL');
  const list = (filter === 'personal' ? personal : filter === 'colab' ? shared : base).slice().sort(byDateDesc);
  if (sort === 'asc') list.reverse();
  const p = usePaged('myNotes', list);
  const sortText = sort === 'asc' ? 'Oldest first' : 'Newest first';
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name="notes" size={26} />My Case Notes</h1></div>
      <ColabNotice />
      <section className="panel-card">
        <FilterCards value={filter} onChange={(v) => { setFilter(v); p.reset(); }} cards={[{ id: 'all', label: 'All Case Notes', count: base.length }, { id: 'personal', label: 'Personal', count: personal.length }, { id: 'colab', label: 'CoLab', count: shared.length }]} />
        <div className="list-head">
          <button type="button" className="sort-btn" aria-label={'Date, ' + sortText.toLowerCase() + '. Reverse order'} onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}>
            Date <Icon name="sortLines" size={14} className={sort === 'asc' ? 'flip' : ''} /><span>{sortText}</span>
          </button>
        </div>
        <ul className="feed">
          {p.items.length ? p.items.map((n) => <NoteRow key={n.id} note={n} client={lookup[n.clientId]} showClient lock />) : <li className="empty">No case notes here. Try another filter.</li>}
        </ul>
        <Pager p={p} />
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Starred Clients
const STARRED_DEFS = [
  { key: 'sortName', label: 'Client Name', type: 'text' }, { key: 'dob', label: 'Date of Birth (Age)', type: 'date' },
  { key: 'favorited', label: 'Date Favorited', type: 'date' }
];
export function Starred() {
  const { state } = useStore();
  const scope = useColabScope();
  const [filter, setFilter] = usePref('starred.filter', 'all');
  const [query, setQuery] = usePref('starred.query', '');
  const [sort, onSort] = useSort('starred', { key: 'favorited', dir: 'desc' });
  const starred = state.db.clients.filter((c) => c.starred && scope.client(c));
  const cards = [{ id: 'all', label: 'All clients', count: starred.length }, { id: 'private', label: 'Privately starred', count: starred.filter((c) => c.starred === 'private').length }]
    .concat(COLABS.map((k) => ({ id: k.id, label: k.name, count: starred.filter((c) => c.colabs.indexOf(k.id) >= 0).length })));
  const scoped = starred.filter((c) => filter === 'all' || (filter === 'private' ? c.starred === 'private' : c.colabs.indexOf(filter) >= 0))
    .map((c) => ({ ...c, sortName: displayName(c), name: displayName(c) }))
    .filter((c) => matches(c, ['name', 'mci', 'ssn4', 'first', 'last'], query));
  const p = usePaged('starred', sortRows(scoped, sort, STARRED_DEFS));
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name="star" size={26} />My Starred Clients</h1><SearchLaunch /></div>
      <ColabNotice />
      <section className="panel-card">
        <FilterCards value={filter} onChange={(v) => { setFilter(v); p.reset(); }} cards={cards} />
        <div className="toolbar">
          <label className="sr-only" htmlFor="starred-search">Search starred clients</label>
          <input className="input is-search" id="starred-search" type="search" placeholder="Search by name, MCI or SSN last 4" value={query} onChange={(e) => { setQuery(e.target.value); p.reset(); }} />
        </div>
        <Table label="Starred clients" cols="52px minmax(150px,1.4fr) 130px 150px 64px 120px minmax(120px,1fr)" min={860}
          empty="No starred clients match. Clear the search or pick another filter."
          head={<>
            <div className="th" role="columnheader">Action</div>
            <SortHead defs={STARRED_DEFS} sort={sort} onSort={(d) => { onSort(d); p.reset(); }} />
            <div className="th" role="columnheader">SSN</div><div className="th" role="columnheader">MCI ID</div><div className="th" role="columnheader">CoLabs</div>
          </>}>
          {p.items.map((c) => (
            <div className="tr is-row" role="row" key={c.id}>
              <div className="td is-tight" role="cell"><StarButton client={c} /></div>
              <div className="td" role="cell"><Link className="link-btn" to={{ page: 'client', id: c.id, sub: 'tab', tab: 'overview' }}>{c.name}</Link></div>
              <div className="td" role="cell">{dobText(c)}</div>
              <div className="td" role="cell">{c.favorited}</div>
              <div className="td" role="cell">*{c.ssn4}</div>
              <div className="td" role="cell">{c.mci}</div>
              <div className="td tag-list" role="cell">{c.colabs.map((k) => <span className="chip-tag" key={k}>{colabTag(k)}</span>)}</div>
            </div>
          ))}
        </Table>
        <Pager p={p} />
      </section>
    </>
  );
}
