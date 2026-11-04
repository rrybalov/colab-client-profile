// The case notes and action items panel beside the client profile. Shows the five most recent of each.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useClientNotes, useClientActions, useMutations, useSession } from '../../state/data.js';
import { Link } from '../../router.jsx';
import { Clamp, Segmented, Loaded } from '../../ui/controls.jsx';
import { DueDate } from '../../ui/records.jsx';
import { isOverdue, plural } from '../../lib.js';
import { useNoteDraft, useActionDraft, NoteComposer, ActionComposer, NoteSortButton, useNoteSort } from './Notes.jsx';

const SHOWN = 5;
const FILTERS = { all: () => true, open: (a) => !a.done, overdue: isOverdue, completed: (a) => a.done };

function PanelNotes({ client: c }) {
  const [sort, setSort] = useNoteSort();
  const { query, notes } = useClientNotes(c.id, sort);
  const draft = useNoteDraft(c.id);
  const { deleteNote } = useMutations();
  const [noteOpen, setNoteOpen] = usePref('panel.noteOpen', {});
  const shown = notes.slice(0, SHOWN);
  return (
    <section className="panel-section" aria-labelledby="notes-h">
      <div className="panel-title-row">
        <h2 className="panel-title" id="notes-h"><Icon name="notes" size={20} />Case Notes {query.ready && <span>({shown.length} of {plural(notes.length, 'note', 'notes')})</span>}</h2>
        <Link className="link-btn is-small is-inline" to={{ page: 'client', id: c.id, sub: 'notes' }}><Icon name="external" size={14} />View All Case Notes</Link>
      </div>
      <Loaded query={query} what="case notes">{() => (
        <>
          <NoteSortButton sort={sort} setSort={setSort} />
          <ul className="scroll-list">
            {shown.length ? shown.map((n) => {
              const open = !!noteOpen[n.id];
              return (
                <li className="note" key={n.id}>
                  <Clamp text={n.text} open={open} onToggle={() => setNoteOpen({ ...noteOpen, [n.id]: !open })} fullClassName="note-full" />
                  <div className="meta"><span>{n.date}</span>{n.edited && <span className="sep edited">Edited</span>}
                    {n.restricted && <span className="sep lock is-restricted"><Icon name="lock" size={13} label="Restricted" /></span>}
                    <span className="spacer" />
                    <button type="button" className="icon-btn" aria-label={'Edit note from ' + n.date} onClick={() => draft.edit(n)}><Icon name="edit" size={15} /></button>
                    <button type="button" className="icon-btn is-danger" aria-label={'Delete note from ' + n.date} onClick={() => deleteNote(n).catch(() => {})}><Icon name="trash" size={15} /></button>
                  </div>
                </li>
              );
            }) : <li className="empty" style={{ fontSize: 12 }}>No case notes yet.</li>}
          </ul>
        </>
      )}</Loaded>
      {draft.d
        ? <NoteComposer draft={draft} onSaved={(n, isNew) => { setNoteOpen({ ...noteOpen, [n.id]: true }); if (isNew) setSort('desc'); }} />
        : <div className="align-end"><button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Case Note</button></div>}
    </section>
  );
}

function PanelActions({ client: c }) {
  const { query, actions } = useClientActions(c.id);
  const draft = useActionDraft(c.id);
  const { toggleAction, deleteAction } = useMutations();
  const { staffName } = useSession();
  const [filter, setFilter] = usePref('panel.actionFilter', 'open');
  const counts = {}; Object.keys(FILTERS).forEach((k) => { counts[k] = actions.filter(FILTERS[k]).length; });
  // Newest first, so an item just added is always visible.
  const shown = actions.filter(FILTERS[filter] || FILTERS.open).slice(0, SHOWN);
  return (
    <section className="panel-section" aria-labelledby="actions-h">
      <div className="panel-title-row">
        <h2 className="panel-title" id="actions-h"><Icon name="inbox" size={20} />Action Items {query.ready && <span>({shown.length} of {plural(actions.length, 'item', 'items')})</span>}</h2>
        <Link className="link-btn is-small is-inline" to={{ page: 'client', id: c.id, sub: 'actions' }}><Icon name="external" size={14} />View All Action Items</Link>
      </div>
      <Loaded query={query} what="action items">{() => (
        <>
          <Segmented small fill label="Show action items" value={filter} onChange={setFilter}
            options={[{ id: 'all', label: `All (${counts.all})` }, { id: 'open', label: `Open (${counts.open})` }, { id: 'overdue', label: `Overdue (${counts.overdue})`, icon: 'alert' }, { id: 'completed', label: `Completed (${counts.completed})` }]} />
          <ul className="scroll-list">
            {shown.length ? shown.map((a) => (
              <li className={'task' + (a.done ? ' is-done' : '')} key={a.id}>
                <input type="checkbox" id={'ai-' + a.id} checked={a.done} onChange={() => toggleAction(a).catch(() => {})} />
                <div className="task-body"><label className="task-text" htmlFor={'ai-' + a.id}>{a.text}</label>
                  <div className="meta"><span>{staffName(a.assignee)}</span><DueDate action={a} className="sep" />{a.edited && <span className="sep edited">Edited</span>}</div>
                </div>
                <div className="task-actions">
                  <button type="button" className="icon-btn" aria-label="Edit action item" onClick={() => draft.edit(a)}><Icon name="edit" size={15} /></button>
                  <button type="button" className="icon-btn is-danger" aria-label="Delete action item" onClick={() => deleteAction(a).catch(() => {})}><Icon name="trash" size={15} /></button>
                </div>
              </li>
            )) : <li className="empty" style={{ fontSize: 12 }}>Nothing here. Switch filters or add an action item.</li>}
          </ul>
        </>
      )}</Loaded>
      {draft.d
        ? <ActionComposer draft={draft} onSaved={() => { if (filter === 'completed') setFilter('open'); }} />
        : <div className="align-end"><button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Action Item</button></div>}
    </section>
  );
}

export function Panel({ client, open, setOpen }) {
  if (!open) {
    return (
      <aside className="panel-rail" aria-label="Case notes and action items">
        <button type="button" className="rail-btn" aria-label="Expand case notes and action items" aria-expanded="false" style={{ color: 'var(--slate)' }} onClick={() => setOpen(true)}><Icon name="chevronLeft" size={18} /></button>
        <button type="button" className="rail-btn" aria-label="Open case notes" style={{ color: 'var(--slate)' }} onClick={() => setOpen(true)}><Icon name="notes" size={20} /></button>
        <button type="button" className="rail-btn" aria-label="Open action items" style={{ color: 'var(--slate)' }} onClick={() => setOpen(true)}><Icon name="inbox" size={20} /></button>
      </aside>
    );
  }
  return (
    <aside className="panel" aria-label="Case notes and action items">
      <div className="panel-head">
        <button type="button" className="rail-btn" aria-label="Collapse case notes and action items" aria-expanded="true" onClick={() => setOpen(false)}><Icon name="chevronRight" size={18} /></button>
        <span className="private-pill">Only visible to you</span>
      </div>
      <PanelNotes client={client} />
      <PanelActions client={client} />
    </aside>
  );
}
