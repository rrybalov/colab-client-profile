// Pieces that show CoLab records: star button, client link, tags, note and action-item rows.
import React from 'react';
import { Icon } from './icons.jsx';
import { Clamp } from './controls.jsx';
import { useApi, usePref } from '../state/store.jsx';
import { useMutations, useSession } from '../state/data.js';
import { Link } from '../router.jsx';
import { fullName, isOverdue, isoToUS } from '../lib.js';

export function StarButton({ client, size = 20 }) {
  const { setStar } = useMutations();
  const on = !!client.starred;
  const toggle = () => setStar(client, !on).catch(() => {});
  return (
    <button type="button" className="fav" aria-pressed={on} onClick={toggle} aria-label={(on ? 'Remove ' : 'Add ') + fullName(client) + (on ? ' from' : ' to') + ' starred clients'}>
      <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill={on ? '#EDCA91' : 'none'} stroke={on ? '#C99A4B' : '#3D3D4B'} strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l2.8 5.8 6.2.8-4.5 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.8z" />
      </svg>
    </button>
  );
}

export function copyText(toast, value, label) {
  const fail = () => toast('Copy failed. Select the text and copy it instead.');
  try { navigator.clipboard.writeText(value).then(() => toast(label + ' copied'), fail); } catch (e) { fail(); }
}
export function CopyButton({ value, label, size = 14, className = 'icon-btn is-action' }) {
  const { toast } = useApi();
  return <button type="button" className={className} onClick={() => copyText(toast, value, label)} aria-label={'Copy ' + label}><Icon name="copy" size={size} /></button>;
}

const TagChip = ({ tag }) => <span className={'chip-tag' + (tag === 'PERSONAL' ? ' is-personal' : '')}>{tag}</span>;
export const clientRoute = (id, tab = 'overview') => ({ page: 'client', id, sub: 'tab', tab });
function ClientRef({ client }) {
  if (!client) return null;
  return <Link className="client-ref" to={clientRoute(client.id)}><Icon name={client.household ? 'users' : 'user'} size={14} />{fullName(client)}</Link>;
}
export const LockBadge = ({ restricted }) => (restricted
  ? <span className="sep lock is-restricted"><Icon name="lock" size={14} />Restricted</span>
  : <span className="sep lock is-open"><Icon name="unlock" size={14} />Unrestricted</span>);

// A note whose open/closed state is saved under `clampKey`.
function SavedClamp({ note, clampKey }) {
  const [open, setOpen] = usePref('open.' + clampKey + '.' + note.id, false);
  return <Clamp text={note.text} open={open} onToggle={() => setOpen(!open)} style={open ? undefined : { fontSize: 13 }} />;
}

export function NoteRow({ note, client, showClient, lock, clampKey, onEdit, onDelete }) {
  const { me, staffName } = useSession();
  return (
    <li className="feed-item">
      <div className="feed-body">
        {clampKey ? <SavedClamp note={note} clampKey={clampKey} /> : <p className="feed-text">{note.text}</p>}
        <div className="meta">
          <span>{note.date}</span>
          {note.edited && <span className="sep edited">Edited</span>}
          {lock && <LockBadge restricted={note.restricted} />}
          {note.author && note.author !== me && <span className="sep">{staffName(note.author)}</span>}
          <span className="spacer" />
          {showClient && <><TagChip tag={note.tag} /><ClientRef client={client} /></>}
          {onEdit && <button type="button" className="icon-btn" onClick={onEdit} aria-label={'Edit note from ' + note.date}><Icon name="edit" size={15} /></button>}
          {onDelete && <button type="button" className="icon-btn is-danger" onClick={onDelete} aria-label={'Delete note from ' + note.date}><Icon name="trash" size={15} /></button>}
        </div>
      </div>
    </li>
  );
}

export function DueDate({ action, className = '' }) {
  const over = isOverdue(action);
  return (
    <span className={className + (over ? ' is-overdue' : '')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Icon name="calendar" size={13} />{action.due ? isoToUS(action.due) : 'No due date'}{over && <Icon name="alert" size={13} label="Overdue" />}
    </span>
  );
}

export function ActionRow({ action, client, showClient, showAssignee, onEdit, onDelete, idPrefix = 'fa' }) {
  const { toggleAction } = useMutations();
  const { staffName } = useSession();
  const id = idPrefix + '-' + action.id;
  return (
    <li className={'feed-item' + (action.done ? ' is-done' : '')}>
      <input type="checkbox" id={id} checked={action.done} onChange={() => toggleAction(action).catch(() => {})} />
      <div className="feed-body">
        <label className="feed-text" htmlFor={id}>{action.text}</label>
        <div className="meta">
          {showAssignee && <span>{staffName(action.assignee) || '[Assignee Name]'}</span>}
          <DueDate action={action} className={showAssignee ? 'sep' : ''} />
          {action.edited && <span className="sep edited">Edited</span>}
          <span className="spacer" />
          {showClient && <><TagChip tag={action.tag} /><ClientRef client={client} /></>}
          {onEdit && <button type="button" className="icon-btn" onClick={onEdit} aria-label="Edit action item"><Icon name="edit" size={15} /></button>}
          {onDelete && <button type="button" className="icon-btn is-danger" onClick={onDelete} aria-label="Delete action item"><Icon name="trash" size={15} /></button>}
        </div>
      </div>
    </li>
  );
}
