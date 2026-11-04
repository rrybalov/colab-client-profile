// Case notes and action items for one client: saved drafts, the composers, and the full-page lists.
// The side panel (Panel.jsx) uses the same drafts and composers.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref, useData } from '../../state/store.jsx';
import { useClientNotes, useClientActions, useMutations, useSession } from '../../state/data.js';
import { Segmented, usePaged, Pager, Loaded } from '../../ui/controls.jsx';
import { NoteRow, ActionRow, LockBadge } from '../../ui/records.jsx';
import { byDueAsc, isOverdue, plural, todayUS } from '../../lib.js';

const focusLater = (id) => setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 0);

// Drafts are saved preferences, so a half-written note survives a reload or a trip to another page.
// save() resolves to the saved record, or null when the draft was empty.
export function useNoteDraft(clientId) {
  const [d, setD] = usePref('draft.note.' + clientId, null);
  const { notes } = useData();
  const { createNote, updateNote } = useMutations();
  const { me } = useSession();
  return {
    d,
    start: () => { setD({ editing: null, text: '', restricted: false, error: false }); focusLater('note-draft'); },
    edit: (n) => { setD({ editing: n.id, text: n.text, restricted: !!n.restricted, error: false }); focusLater('note-draft'); },
    set: (patch) => setD({ ...d, ...patch }),
    cancel: () => setD(null),
    async save() {
      const text = (d.text || '').trim();
      if (!text) { setD({ ...d, error: true }); focusLater('note-draft'); return null; }
      const draft = d;
      setD(null);
      const fields = { text, restricted: !!draft.restricted };
      const original = draft.editing && notes[draft.editing];
      try {
        return original ? await updateNote(original, fields) : await createNote(clientId, fields, me);
      } catch (e) { setD(draft); return null; } // keep the words if the save failed
    }
  };
}

export function useActionDraft(clientId) {
  const [d, setD] = usePref('draft.action.' + clientId, null);
  const { actions } = useData();
  const { createAction, updateAction } = useMutations();
  const { me } = useSession();
  return {
    d,
    start: () => { setD({ editing: null, text: '', assignee: me, due: '', error: false }); focusLater('action-draft'); },
    edit: (a) => { setD({ editing: a.id, text: a.text, assignee: a.assignee || me, due: a.due || '', error: false }); focusLater('action-draft'); },
    set: (patch) => setD({ ...d, ...patch }),
    cancel: () => setD(null),
    async save() {
      const text = (d.text || '').trim();
      if (!text) { setD({ ...d, error: true }); focusLater('action-draft'); return null; }
      const draft = d;
      setD(null);
      const fields = { text, assignee: draft.assignee || me, due: draft.due || '' };
      const original = draft.editing && actions[draft.editing];
      try {
        return original ? await updateAction(original, fields) : await createAction(clientId, fields);
      } catch (e) { setD(draft); return null; }
    }
  };
}

export function NoteComposer({ draft, isPage, onSaved }) {
  const { user } = useSession();
  const d = draft.d;
  if (!d) return null;
  const save = () => draft.save().then((n) => { if (n && onSaved) onSaved(n, !d.editing); });
  const restricted = <input type="checkbox" id="note-restricted" checked={d.restricted} onChange={(e) => draft.set({ restricted: e.target.checked })} />;
  return (
    <div className={'composer' + (isPage ? ' is-page' : '')}>
      {isPage && (
        <div className="composer-meta"><strong>{d.editing ? 'Edit Case Note' : 'Add New Case Note'}</strong>
          <LockBadge restricted={d.restricted} />
          <span className="sep">{todayUS()}</span><span className="sep">{user.first} {user.last} ({user.org})</span></div>
      )}
      {isPage ? <label className="sr-only" htmlFor="note-draft">Case note</label> : <label className="field-label" htmlFor="note-draft">{d.editing ? 'Edit case note' : 'New case note'}</label>}
      <textarea className="input is-block" id="note-draft" rows={isPage ? 4 : 3} placeholder="Enter case note" value={d.text} onChange={(e) => draft.set({ text: e.target.value, error: false })} />
      {d.error && <span className="error" role="alert">Write the note before saving.</span>}
      {isPage ? (
        <div className="composer-foot is-split">
          <button type="button" className="btn-text" onClick={draft.cancel}>Cancel</button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <label className="toggle" htmlFor="note-restricted">Restricted note {restricted}</label>
            <button type="button" className="btn-primary" onClick={save}>Save</button>
          </span>
        </div>
      ) : (
        <div className="composer-foot">
          <label className="toggle" htmlFor="note-restricted" style={{ marginRight: 'auto', fontSize: 12 }}>Restricted {restricted}</label>
          <button type="button" className="btn-text" onClick={draft.cancel}>Cancel</button><button type="button" className="btn-outline is-wide" onClick={save}>Save</button>
        </div>
      )}
    </div>
  );
}

export function ActionComposer({ draft, onSaved }) {
  const { staff, me } = useSession();
  const d = draft.d;
  if (!d) return null;
  const save = () => draft.save().then((a) => { if (a && onSaved) onSaved(a); });
  return (
    <div className="composer">
      <label className="sr-only" htmlFor="action-draft">Action item</label>
      <input className="input is-block" id="action-draft" type="text" placeholder="Enter action item here" value={d.text} onChange={(e) => draft.set({ text: e.target.value, error: false })} />
      <div className="composer-row">
        <label className="sr-only" htmlFor="action-assignee">Assignee</label>
        <select className="select" id="action-assignee" value={d.assignee} onChange={(e) => draft.set({ assignee: e.target.value })} style={{ flex: '1 1 150px' }}>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.first} {s.last}{s.id === me ? ' (me)' : ''}</option>)}
        </select>
        <label className="sr-only" htmlFor="action-due">Due date (optional)</label>
        <input className="input" id="action-due" type="date" value={d.due} onChange={(e) => draft.set({ due: e.target.value })} />
      </div>
      {d.error && <span className="error" role="alert">Describe the action item before saving.</span>}
      <div className="composer-foot"><button type="button" className="btn-text" onClick={draft.cancel}>Cancel</button><button type="button" className="btn-outline is-wide" onClick={save}>Save</button></div>
    </div>
  );
}

// The note-date sort is shared by the panel and the full page.
export function useNoteSort() { return usePref('notes.sort', 'desc'); }
export function NoteSortButton({ sort, setSort }) {
  const text = sort === 'asc' ? 'Oldest first' : 'Newest first';
  return (
    <div className="list-head">
      <button type="button" className="sort-btn" aria-label={'Date, ' + text.toLowerCase() + '. Reverse order'} onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}>
        Date <Icon name="sortLines" size={14} className={sort === 'asc' ? 'flip' : ''} /><span>{text}</span>
      </button>
    </div>
  );
}

export function ClientNotesPage({ client: c }) {
  const [sort, setSort] = useNoteSort();
  const { query, notes } = useClientNotes(c.id, sort);
  const draft = useNoteDraft(c.id);
  const { deleteNote } = useMutations();
  const p = usePaged('clientNotes.' + c.id, notes);
  return (
    <section className="list-card" aria-labelledby="all-notes-h">
      <div className="card-head">
        <h2 className="card-title" id="all-notes-h"><Icon name="notes" size={22} />All Case Notes {query.ready && <span>({plural(notes.length, 'note', 'notes')})</span>}</h2>
        {!draft.d && <button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Case Note</button>}
      </div>
      <NoteComposer draft={draft} isPage onSaved={(n, isNew) => { if (isNew) { setSort('desc'); p.reset(); } }} />
      <Loaded query={query} what="case notes" block>{() => (
        <>
          <NoteSortButton sort={sort} setSort={setSort} />
          <ul className="feed">
            {p.items.length ? p.items.map((n) => <NoteRow key={n.id} note={n} lock onEdit={() => draft.edit(n)} onDelete={() => deleteNote(n).catch(() => {})} />) : <li className="empty">No case notes for this client yet. Add the first one above.</li>}
          </ul>
          <Pager p={p} />
        </>
      )}</Loaded>
    </section>
  );
}

export function ClientActionsPage({ client: c }) {
  const { query, actions } = useClientActions(c.id);
  const draft = useActionDraft(c.id);
  const { deleteAction } = useMutations();
  const [status, setStatus] = usePref('clientActions.status', 'open');
  const open = actions.filter((a) => !a.done), over = actions.filter(isOverdue), done = actions.filter((a) => a.done);
  const list = (status === 'overdue' ? over : status === 'completed' ? done : open).slice().sort(byDueAsc);
  const p = usePaged('clientActions.' + c.id, list);
  return (
    <section className="list-card" aria-labelledby="all-actions-h">
      <div className="card-head">
        <h2 className="card-title" id="all-actions-h"><Icon name="inbox" size={22} />Action Items {query.ready && <span>({plural(actions.length, 'item', 'items')})</span>}</h2>
        {!draft.d && <button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Action Item</button>}
      </div>
      <ActionComposer draft={draft} onSaved={() => { if (status === 'completed') setStatus('open'); }} />
      <Loaded query={query} what="action items" block>{() => (
        <>
          <Segmented small fill label="Status" value={status} onChange={(v) => { setStatus(v); p.reset(); }}
            options={[{ id: 'open', label: `Open (${open.length})` }, { id: 'overdue', label: `Overdue (${over.length})`, icon: 'alert' }, { id: 'completed', label: `Completed (${done.length})` }]} />
          <ul className="feed">
            {p.items.length ? p.items.map((a) => <ActionRow key={a.id} action={a} showAssignee onEdit={() => draft.edit(a)} onDelete={() => deleteAction(a).catch(() => {})} />) : <li className="empty">No action items here. Try another status or add one above.</li>}
          </ul>
          <Pager p={p} />
        </>
      )}</Loaded>
    </section>
  );
}
