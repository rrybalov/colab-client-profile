import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useStarred, useSession } from '../../state/data.js';
import { Link } from '../../router.jsx';
import { FilterCards, usePaged, Pager, SortHead, useSort, Table, Loaded } from '../../ui/controls.jsx';
import { StarButton, clientRoute } from '../../ui/records.jsx';
import { displayName, dobText, matches, sortRows } from '../../lib.js';
import { TABLES } from '../../tables.js';
import { ColabNotice, SearchLaunch, useColabScope } from './HubShell.jsx';

const T = TABLES.starred;

export function Starred() {
  const scope = useColabScope();
  const { colabs, colabTag } = useSession();
  const { query, clients } = useStarred();
  const [filter, setFilter] = usePref('starred.filter', 'all');
  const [search, setSearch] = usePref('starred.query', '');
  const [sort, onSort] = useSort('starred', T.sort);
  const starred = clients.filter(scope.client);
  const cards = [{ id: 'all', label: 'All clients', count: starred.length }, { id: 'private', label: 'Privately starred', count: starred.filter((c) => c.starred === 'private').length }]
    .concat(colabs.map((k) => ({ id: k.id, label: k.name, count: starred.filter((c) => c.colabs.indexOf(k.id) >= 0).length })));
  const rows = sortRows(
    starred.filter((c) => filter === 'all' || (filter === 'private' ? c.starred === 'private' : c.colabs.indexOf(filter) >= 0))
      .map((c) => ({ ...c, sortName: displayName(c), name: displayName(c) }))
      .filter((c) => matches(c, ['name', 'mci', 'ssn4', 'first', 'last'], search)),
    sort, T.cols
  );
  const p = usePaged('starred', rows);
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name="star" size={26} />My Starred Clients</h1><SearchLaunch /></div>
      <ColabNotice />
      <section className="panel-card">
        <Loaded query={query} what="starred clients" block>{() => (
          <>
            <FilterCards value={filter} onChange={(v) => { setFilter(v); p.reset(); }} cards={cards} />
            <div className="toolbar">
              <label className="sr-only" htmlFor="starred-search">Search starred clients</label>
              <input className="input is-search" id="starred-search" type="search" placeholder="Search by name, MCI or SSN last 4" value={search} onChange={(e) => { setSearch(e.target.value); p.reset(); }} />
            </div>
            <Table label="Starred clients" spec={T} empty="No starred clients match. Clear the search or pick another filter."
              head={<>
                <div className="th" role="columnheader">Action</div>
                <SortHead defs={T.cols} sort={sort} onSort={(d) => { onSort(d); p.reset(); }} />
                <div className="th" role="columnheader">SSN</div><div className="th" role="columnheader">MCI ID</div><div className="th" role="columnheader">CoLabs</div>
              </>}>
              {p.items.map((c) => (
                <div className="tr is-row" role="row" key={c.id}>
                  <div className="td is-tight" role="cell"><StarButton client={c} /></div>
                  <div className="td" role="cell"><Link className="link-btn" to={clientRoute(c.id)}>{c.name}</Link></div>
                  <div className="td" role="cell">{dobText(c)}</div>
                  <div className="td" role="cell">{c.favorited}</div>
                  <div className="td" role="cell">*{c.ssn4}</div>
                  <div className="td" role="cell">{c.mci}</div>
                  <div className="td tag-list" role="cell">{c.colabs.map((k) => <span className="chip-tag" key={k}>{colabTag(k)}</span>)}</div>
                </div>
              ))}
            </Table>
            <Pager p={p} />
          </>
        )}</Loaded>
      </section>
    </>
  );
}
