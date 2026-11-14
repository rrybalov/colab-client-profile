// Case notes and action items for a contact with no client record yet. Same look as the client panel; once
// the person is identified, these move to their record and the client panel takes over.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useSession } from '../../state/data.js';
import { Clamp } from '../../ui/controls.jsx';
import { DueDate } from '../../ui/records.jsx';
import { todayUS } from '../../lib.js';
import { focusLater, removeWithUndo } from './parts.jsx';
import { useApi } from '../../state/store.jsx';

let seq = 0;
const uid = (p) => p + Date.now().toString(36) + (seq++).toString(36);

function Notes({ k, edit }) {
  const { me } = useSession();
  const { toast } = useApi();
  const [draft, setDraft] = useState(null);
  const [open, setOpen] = useState({});
  const save = (e) => {
    e.preventDefault();
    if (!draft.text.trim()) { setDraft({ ...draft, error: true }); return; }
    edit({ notes: [{ id: uid('kn'), text: draft.text.trim(), restricted: draft.restricted, date: todayUS(), author: me, edited: false }].concat(k.notes) }, { now: true });
    setDraft(null); focusLater('k-add-note');
  };
  return (
    <section className="panel-section" aria-labelledby="k-notes-h">
      <div className="panel-title-row"><h2 className="panel-title" id="k-notes-h"><Icon name="notes" size={20} />Case Notes <span>({k.notes.length})</span></h2></div>
      <ul className="scroll-list">
        {k.notes.length ? k.notes.map((n) => (
          <li className="note" key={n.id}>
            <Clamp text={n.text} open={!!open[n.id]} onToggle={() => setOpen({ ...open, [n.id]: !open[n.id] })} fullClassName="note-full" />
            <div className="meta"><span>{n.date}</span>{n.restricted && <span className="sep lock is-restricted"><Icon name="lock" size={13} label="Restricted" /></span>}<span className="spacer" />
              <button type="button" className="icon-btn is-danger" aria-label={'Delete note from ' + n.date} onClick={() => removeWithUndo(toast, edit, k, 'notes', n, 'Case note')}><Icon name="trash" size={15} /></button></div>
          </li>
        )) : <li className="empty" style={{ fontSize: 12 }}>No case notes on this contact yet.</li>}
      </ul>
      {draft ? (
        <form className="composer" onSubmit={save} noValidate>
          <label className="field-label" htmlFor="k-note-draft">New case note</label>
          <textarea className="input is-block" id="k-note-draft" rows={3} autoFocus placeholder="Enter case note" value={draft.text} aria-invalid={!!draft.error} onChange={(e) => setDraft({ ...draft, text: e.target.value, error: false })} />
          {draft.error && <span className="error" role="alert">Write the note before saving.</span>}
          <div className="composer-foot">
            <label className="toggle" htmlFor="k-note-restricted" style={{ marginRight: 'auto', fontSize: 12 }}>Restricted <input type="checkbox" id="k-note-restricted" checked={draft.restricted} onChange={(e) => setDraft({ ...draft, restricted: e.target.checked })} /></label>
            <button type="button" className="btn-text" onClick={() => { setDraft(null); focusLater('k-add-note'); }}>Cancel</button><button type="submit" className="btn-outline is-wide">Save</button>
          </div>
        </form>
      ) : <div className="align-end"><button type="button" className="btn-outline" id="k-add-note" onClick={() => setDraft({ text: '', restricted: false })}><Icon name="plusCircle" />Add New Case Note</button></div>}
    </section>
  );
}

function Actions({ k, edit }) {
  const { staff, me, staffName } = useSession();
  const { toast } = useApi();
  const [draft, setDraft] = useState(null);
  const save = (e) => {
    e.preventDefault();
    if (!draft.text.trim()) { setDraft({ ...draft, error: true }); return; }
    edit({ actions: [{ id: uid('ka'), text: draft.text.trim(), assignee: draft.assignee, due: draft.due, done: false, edited: false }].concat(k.actions) }, { now: true });
    setDraft(null); focusLater('k-add-action');
  };
  const toggle = (a) => edit({ actions: k.actions.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)) }, { now: true });
  return (
    <section className="panel-section" aria-labelledby="k-actions-h">
      <div className="panel-title-row"><h2 className="panel-title" id="k-actions-h"><Icon name="inbox" size={20} />Action Items <span>({k.actions.length})</span></h2></div>
      <ul className="scroll-list">
        {k.actions.length ? k.actions.map((a) => (
          <li className={'task' + (a.done ? ' is-done' : '')} key={a.id}>
            <input type="checkbox" id={'ka-' + a.id} checked={a.done} onChange={() => toggle(a)} />
            <div className="task-body"><label className="task-text" htmlFor={'ka-' + a.id}>{a.text}</label>
              <div className="meta"><span>{staffName(a.assignee)}</span><DueDate action={a} className="sep" /></div></div>
            <div className="task-actions"><button type="button" className="icon-btn is-danger" aria-label={'Delete action item: ' + a.text} onClick={() => removeWithUndo(toast, edit, k, 'actions', a, 'Action item')}><Icon name="trash" size={15} /></button></div>
          </li>
        )) : <li className="empty" style={{ fontSize: 12 }}>None yet. The 7-day and 90-day follow-ups are added once the person is identified and says it's OK.</li>}
      </ul>
      {draft ? (
        <form className="composer" onSubmit={save} noValidate>
          <label className="sr-only" htmlFor="k-action-draft">Action item</label>
          <input className="input is-block" id="k-action-draft" autoFocus placeholder="Enter action item here" value={draft.text} aria-invalid={!!draft.error} onChange={(e) => setDraft({ ...draft, text: e.target.value, error: false })} />
          <div className="composer-row">
            <label className="sr-only" htmlFor="k-action-who">Assignee</label>
            <select className="select" id="k-action-who" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} style={{ flex: '1 1 150px' }}>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.first} {s.last}{s.id === me ? ' (me)' : ''}</option>)}
            </select>
            <label className="sr-only" htmlFor="k-action-due">Due date (optional)</label>
            <input className="input" id="k-action-due" type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
          </div>
          {draft.error && <span className="error" role="alert">Describe the action item before saving.</span>}
          <div className="composer-foot"><button type="button" className="btn-text" onClick={() => { setDraft(null); focusLater('k-add-action'); }}>Cancel</button><button type="submit" className="btn-outline is-wide">Save</button></div>
        </form>
      ) : <div className="align-end"><button type="button" className="btn-outline" id="k-add-action" onClick={() => setDraft({ text: '', assignee: me, due: '' })}><Icon name="plusCircle" />Add New Action Item</button></div>}
    </section>
  );
}

export function ContactPanel({ k, edit, open, setOpen }) {
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
        <span className="private-pill">On this contact · {k.ref}</span>
      </div>
      <Notes k={k} edit={edit} />
      <Actions k={k} edit={edit} />
    </aside>
  );
}
