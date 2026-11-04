// Shared building blocks.
import React, { useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { useStore, usePref } from './store.jsx';
import { Link } from './router.jsx';
import { fullName, isOverdue, isoToUS, staffName } from './lib.js';

export function Tip({ label, children, size = 14 }) {
  return (
    <span className="tip">
      <button type="button" className="tip-trigger" aria-label={label}><Icon name="info" size={size} /></button>
      <span className="tip-box" role="tooltip">{children}</span>
    </span>
  );
}

export function Segmented({ label, value, onChange, options, fill, small }) {
  return (
    <div className={'segmented' + (fill ? ' is-fill' : '') + (small ? ' is-small' : '')} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" className="seg" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.icon && <Icon name={o.icon} size={small ? 13 : 18} />}{o.label}
        </button>
      ))}
    </div>
  );
}

export function FilterCards({ value, onChange, cards, label = 'Filter' }) {
  return (
    <div className="filter-cards" role="group" aria-label={label}>
      {cards.map((c) => (
        <button key={c.id} type="button" className="filter-card" aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
          <strong>{c.count}</strong><span>{c.label}</span><Icon name="funnel" size={14} />
        </button>
      ))}
    </div>
  );
}

// Pagination with a persistent page size and page number.
export function usePaged(key, list, sizes = [10, 25, 50]) {
  const [size, setSize] = usePref('size.' + key, sizes[0]);
  const [pageRaw, setPage] = usePref('page.' + key, 0);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const page = Math.min(pageRaw, pages - 1);
  const start = page * size;
  return {
    items: list.slice(start, start + size), page, pages, start, end: Math.min(start + size, list.length), total: list.length, size, sizes,
    setSize: (s) => { setSize(s); setPage(0); }, setPage, key, reset: () => setPage(0)
  };
}
export function Pager({ p }) {
  const id = 'size-' + p.key;
  return (
    <div className="pager">
      <label htmlFor={id}>Rows per page:</label>
      <select className="select" id={id} value={p.size} onChange={(e) => p.setSize(Number(e.target.value))}>
        {p.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <span>{p.total ? `${p.start + 1}–${p.end} of ${p.total}` : '0 of 0'}</span>
      <span className="pager-btns">
        <button type="button" className="tool-btn" aria-label="Previous page" disabled={p.page === 0} onClick={() => p.setPage(p.page - 1)}><Icon name="chevronLeft" /></button>
        <button type="button" className="tool-btn" aria-label="Next page" disabled={p.page >= p.pages - 1} onClick={() => p.setPage(p.page + 1)}><Icon name="chevronRight" /></button>
      </span>
    </div>
  );
}

export function SortHead({ defs, sort, onSort }) {
  return defs.map((d) => {
    const on = sort.key === d.key;
    return (
      <div key={d.key} className="th" role="columnheader" aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className={'sort-btn' + (on ? ' is-active' : '')} onClick={() => onSort(d)}>
          {d.label}<Icon name="chevronDown" size={14} className={'sort-icon' + (on && sort.dir === 'asc' ? ' is-asc' : '')} />
        </button>
      </div>
    );
  });
}
export function useSort(key, initial) {
  const [sort, setSort] = usePref('sort.' + key, initial);
  const onSort = (d) => setSort(sort.key === d.key ? { key: d.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key: d.key, dir: d.type === 'text' ? 'asc' : 'desc' });
  return [sort, onSort];
}

export function Table({ label, cols, min, head, children, empty }) {
  const hasRows = React.Children.toArray(children).length > 0;
  return (
    <div className="table-wrap">
      <div className="table" role="table" aria-label={label} style={{ '--cols': cols, '--min': min + 'px' }}>
        <div className="tr is-head" role="row">{head}</div>
        {hasRows ? children : (typeof empty === 'string' ? <p className="empty">{empty}</p> : empty)}
      </div>
    </div>
  );
}

export function StarButton({ client, size = 20 }) {
  const { mutate } = useStore();
  const on = !!client.starred;
  const toggle = () => mutate((db) => ({
    ...db,
    clients: db.clients.map((c) => (c.id === client.id ? { ...c, starred: on ? null : 'private', favorited: on ? c.favorited : isoToUS(new Date().toISOString().slice(0, 10)) } : c))
  }), on ? fullName(client) + ' removed from starred clients' : fullName(client) + ' added to starred clients', true);
  return (
    <button type="button" className="fav" aria-pressed={on} onClick={toggle} aria-label={(on ? 'Remove ' : 'Add ') + fullName(client) + (on ? ' from' : ' to') + ' starred clients'}>
      <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill={on ? '#EDCA91' : 'none'} stroke={on ? '#C99A4B' : '#3D3D4B'} strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l2.8 5.8 6.2.8-4.5 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.8z" />
      </svg>
    </button>
  );
}

export const TagChip = ({ tag }) => <span className={'chip-tag' + (tag === 'PERSONAL' ? ' is-personal' : '')}>{tag}</span>;
export function ClientRef({ client }) {
  if (!client) return null;
  return <Link className="client-ref" to={{ page: 'client', id: client.id, sub: 'tab', tab: 'overview' }}><Icon name={client.household ? 'users' : 'user'} size={14} />{fullName(client)}</Link>;
}
export const LockBadge = ({ restricted }) => (restricted
  ? <span className="sep lock is-restricted"><Icon name="lock" size={14} />Restricted</span>
  : <span className="sep lock is-open"><Icon name="unlock" size={14} />Unrestricted</span>);

export function CopyButton({ value, label, size = 14, className = 'icon-btn is-action' }) {
  const { toast } = useStore();
  const copy = () => {
    try { navigator.clipboard.writeText(value).then(() => toast(label + ' copied'), () => toast('Copy failed. Select the text and copy it instead.')); }
    catch (e) { toast('Copy failed. Select the text and copy it instead.'); }
  };
  return <button type="button" className={className} onClick={copy} aria-label={'Copy ' + label}><Icon name="copy" size={size} /></button>;
}

// Note and action rows used on Home, My pages and the client's full-page lists.
export function NoteRow({ note, client, showClient, lock, clampKey, onEdit, onDelete }) {
  const [open, setOpen] = usePref(clampKey ? 'open.' + clampKey + '.' + note.id : 'x', !clampKey);
  const isOpen = clampKey ? open : true;
  return (
    <li className="feed-item">
      <div className="feed-body">
        {clampKey && !isOpen
          ? <div className="note-clamp" style={{ fontSize: 13 }}><span>{note.text}</span><button type="button" className="more-btn" aria-expanded="false" onClick={() => setOpen(true)}>Show more</button></div>
          : <p className="feed-text">{note.text}{clampKey && <> <button type="button" className="more-btn" aria-expanded="true" onClick={() => setOpen(false)}>Show less</button></>}</p>}
        <div className="meta">
          <span>{note.date}</span>
          {note.edited && <span className="sep edited">Edited</span>}
          {lock && <LockBadge restricted={note.restricted} />}
          {note.author && note.author !== 'u1' && <span className="sep">{staffName(note.author)}</span>}
          <span className="spacer" />
          {showClient && <><TagChip tag={note.tag} /><ClientRef client={client} /></>}
          {onEdit && <button type="button" className="icon-btn" onClick={onEdit} aria-label={'Edit note from ' + note.date}><Icon name="edit" size={15} /></button>}
          {onDelete && <button type="button" className="icon-btn is-danger" onClick={onDelete} aria-label={'Delete note from ' + note.date}><Icon name="trash" size={15} /></button>}
        </div>
      </div>
    </li>
  );
}

export function useTaskActions() {
  const { mutate } = useStore();
  return {
    toggle: (a) => mutate((db) => ({ ...db, actions: db.actions.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)) }), a.done ? 'Marked open' : 'Marked complete', true),
    remove: (a) => mutate((db) => ({ ...db, actions: db.actions.filter((x) => x.id !== a.id) }), 'Action item deleted', true),
    removeNote: (n) => mutate((db) => ({ ...db, notes: db.notes.filter((x) => x.id !== n.id) }), 'Case note deleted', true)
  };
}

export function ActionRow({ action, client, showClient, showAssignee, onEdit, onDelete, idPrefix = 'fa' }) {
  const { toggle } = useTaskActions();
  const over = isOverdue(action);
  const id = idPrefix + '-' + action.id;
  return (
    <li className={'feed-item' + (action.done ? ' is-done' : '')}>
      <input type="checkbox" id={id} checked={action.done} onChange={() => toggle(action)} />
      <div className="feed-body">
        <label className="feed-text" htmlFor={id}>{action.text}</label>
        <div className="meta">
          {showAssignee && <span>{staffName(action.assignee) || '[Assignee Name]'}</span>}
          <span className={(showAssignee ? 'sep ' : '') + (over ? 'is-overdue' : '')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="calendar" size={13} />{action.due ? isoToUS(action.due) : 'No due date'}{over && <Icon name="alert" size={13} label="Overdue" />}
          </span>
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

export function Toast() {
  const { state, dispatch } = useStore();
  const t = state.toast;
  useEffect(() => {
    if (!t) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'toast', text: null }), t.undo ? 6000 : 2600);
    return () => clearTimeout(timer);
  }, [t && t.id]);
  return (
    <div className="toast-root" role="status" aria-live="polite">
      {t && <div className="toast"><span>{t.text}</span>{t.undo && <button type="button" onClick={() => dispatch({ type: 'undo' })}>Undo</button>}</div>}
    </div>
  );
}

export function Modal({ id, title, intro, icon, narrow, children, onClose, focusKey }) {
  const ref = useRef(null);
  const opener = useRef(document.activeElement);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const first = el.querySelector('input, textarea') || el.querySelector('.choice, .btn-primary, button:not(.modal-close)');
    if (first) first.focus({ preventScroll: true });
  }, [focusKey]);
  useEffect(() => {
    const el = ref.current;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !el) return;
      const nodes = [...el.querySelectorAll('button:not([disabled]), input, select, textarea, a[href]')].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const f = nodes[0], l = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      const o = opener.current;
      if (o && document.contains(o)) o.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (narrow ? ' is-narrow' : '')} role="dialog" aria-modal="true" aria-labelledby={id + '-title'} ref={ref}>
        <div className="modal-head">
          <div><h2 id={id + '-title'}>{icon && <Icon name={icon} size={22} />}{title}</h2>{intro && <p>{intro}</p>}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><Icon name="x" size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ id, label, value, onChange, required, tip, textarea, wide, ...input }) {
  return (
    <div className={'field' + (wide ? ' is-wide' : '')}>
      <div className="field-top">
        <span className="field-name"><label htmlFor={id}>{label}</label>{tip}</span>
        {required && <span className="req">Required</span>}
      </div>
      {textarea
        ? <textarea className="input" id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} {...input} />
        : <input className="input" id={id} value={value} onChange={(e) => onChange(e.target.value)} {...input} />}
    </div>
  );
}
