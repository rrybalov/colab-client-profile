// My Action Items and My Case Notes: the signed-in person's own work across every client.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useMyActions, useMyNotes, useClientsById } from '../../state/data.js';
import { FilterCards, Segmented, usePaged, Pager, Loaded } from '../../ui/controls.jsx';
import { ActionRow, NoteRow } from '../../ui/records.jsx';
import { byDueAsc, byDueDesc, isOverdue } from '../../lib.js';
import { ColabNotice, useColabScope } from './HubShell.jsx';

const SCOPES = (all, personal, colab, allLabel) => [{ id: 'all', label: allLabel, count: all }, { id: 'personal', label: 'Personal', count: personal }, { id: 'colab', label: 'CoLab', count: colab }];
const byScope = (list, scope) => (scope === 'personal' ? list.filter((x) => x.tag === 'PERSONAL') : scope === 'colab' ? list.filter((x) => x.tag !== 'PERSONAL') : list);

export function MyActions() {
  const colab = useColabScope();
  const lookup = useClientsById();
  const { query, actions } = useMyActions();
  const [filter, setFilter] = usePref('myActions.filter', 'all');
  const [status, setStatus] = usePref('myActions.status', 'open');
  const base = actions.filter(colab.item);
  const scoped = byScope(base, filter);
  const open = scoped.filter((a) => !a.done), over = scoped.filter(isOverdue), done = scoped.filter((a) => a.done);
  const list = (status === 'overdue' ? over : status === 'completed' ? done : open).slice().sort(status === 'completed' ? byDueDesc : byDueAsc);
  const p = usePaged('myActions', list);
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name="inbox" size={26} />My Action Items</h1></div>
      <ColabNotice />
      <section className="panel-card">
        <Loaded query={query} what="your action items" block>{() => (
          <>
            <FilterCards value={filter} onChange={(v) => { setFilter(v); p.reset(); }} cards={SCOPES(base.length, byScope(base, 'personal').length, byScope(base, 'colab').length, 'All action items')} />
            <Segmented small fill label="Status" value={status} onChange={(v) => { setStatus(v); p.reset(); }}
              options={[{ id: 'open', label: `Open (${open.length})` }, { id: 'overdue', label: `Overdue (${over.length})`, icon: 'alert' }, { id: 'completed', label: `Completed (${done.length})` }]} />
            <ul className="feed">
              {p.items.length ? p.items.map((a) => <ActionRow key={a.id} action={a} client={lookup[a.clientId]} showClient showAssignee />) : <li className="empty">No action items here. Try another filter.</li>}
            </ul>
            <Pager p={p} />
          </>
        )}</Loaded>
      </section>
    </>
  );
}

export function MyNotes() {
  const colab = useColabScope();
  const lookup = useClientsById();
  const { query, notes } = useMyNotes();
  const [filter, setFilter] = usePref('myNotes.filter', 'all');
  const [sort, setSort] = usePref('myNotes.sort', 'desc');
  const base = notes.filter(colab.item);
  const list = byScope(base, filter);
  const ordered = sort === 'asc' ? list.slice().reverse() : list;
  const p = usePaged('myNotes', ordered);
  const sortText = sort === 'asc' ? 'Oldest first' : 'Newest first';
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name="notes" size={26} />My Case Notes</h1></div>
      <ColabNotice />
      <section className="panel-card">
        <Loaded query={query} what="your case notes" block>{() => (
          <>
            <FilterCards value={filter} onChange={(v) => { setFilter(v); p.reset(); }} cards={SCOPES(base.length, byScope(base, 'personal').length, byScope(base, 'colab').length, 'All Case Notes')} />
            <div className="list-head">
              <button type="button" className="sort-btn" aria-label={'Date, ' + sortText.toLowerCase() + '. Reverse order'} onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}>
                Date <Icon name="sortLines" size={14} className={sort === 'asc' ? 'flip' : ''} /><span>{sortText}</span>
              </button>
            </div>
            <ul className="feed">
              {p.items.length ? p.items.map((n) => <NoteRow key={n.id} note={n} client={lookup[n.clientId]} showClient lock />) : <li className="empty">No case notes here. Try another filter.</li>}
            </ul>
            <Pager p={p} />
          </>
        )}</Loaded>
      </section>
    </>
  );
}
