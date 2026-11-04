// Generic controls: tooltips, segmented buttons, filter cards, sortable tables, pagination, dialogs, fields,
// notifications and loading states. None of these know about clients or the data source.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { useApi, usePref, useToastState } from '../state/store.jsx';

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

export function Chip({ label, children }) { return <div className="chip"><dt>{label}</dt><dd>{children}</dd></div>; }

export function SearchBox({ id, value, onChange, label, placeholder = 'Search' }) {
  return <><label className="sr-only" htmlFor={id}>{label}</label><input className="input is-search" id={id} type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></>;
}
export function SelectBox({ id, value, onChange, label, placeholder, options }) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <select className="select" id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return <option key={v} value={v}>{l}</option>; })}
      </select>
    </>
  );
}

// Pagination with a saved page size and page number.
export function usePaged(key, list, sizes = [10, 25, 50]) {
  const [size, setSize] = usePref('size.' + key, sizes[0]);
  const [pageRaw, setPage] = usePref('page.' + key, 0);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const page = Math.min(pageRaw, pages - 1);
  const start = page * size;
  return {
    items: list.slice(start, start + size), page, pages, start, end: Math.min(start + size, list.length), total: list.length, size, sizes, key,
    setSize: (s) => { setSize(s); setPage(0); }, setPage, reset: () => { if (pageRaw !== 0) setPage(0); }
  };
}
export function Pager({ p }) {
  const id = 'size-' + p.key.replace(/[^\w-]/g, '-');
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

// A saved sort for one table. Text columns start ascending, dates and numbers descending.
export function useSort(key, initial) {
  const [sort, setSort] = usePref('sort.' + key, initial);
  const onSort = (d) => setSort(sort.key === d.key ? { key: d.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key: d.key, dir: d.type === 'text' ? 'asc' : 'desc' });
  return [sort, onSort];
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

export function Table({ label, spec, head, children, empty }) {
  const hasRows = React.Children.toArray(children).length > 0;
  return (
    <div className="table-wrap">
      <div className="table" role="table" aria-label={label} style={{ '--cols': spec.grid, '--min': spec.min + 'px' }}>
        <div className="tr is-head" role="row">{head}</div>
        {hasRows ? children : (typeof empty === 'string' ? <p className="empty">{empty}</p> : empty)}
      </div>
    </div>
  );
}

// One line of text with "Show more", offered only when the line is actually cut off.
export function Clamp({ text, open, onToggle, className = 'note-clamp', fullClassName = 'feed-text', style }) {
  const ref = useRef(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return undefined;
    const measure = () => setCut(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, [text, open]);
  if (open) return <p className={fullClassName} style={style}>{text} <button type="button" className="more-btn" aria-expanded="true" onClick={onToggle}>Show less</button></p>;
  return (
    <div className={className} style={style}>
      <span ref={ref}>{text}</span>
      {cut && <button type="button" className="more-btn" aria-expanded="false" onClick={onToggle}>Show more</button>}
    </div>
  );
}

// Closes a popover or menu on an outside click or Escape.
export function useDismiss(open, close) {
  const ref = useRef(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) closeRef.current(); };
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return ref;
}

export function Toast() {
  const t = useToastState();
  const { toast } = useApi();
  useEffect(() => {
    if (!t) return undefined;
    const timer = setTimeout(() => toast(null), t.undo || t.error ? 6000 : 2600);
    return () => clearTimeout(timer);
  }, [t && t.id]);
  return (
    <div className="toast-root" role="status" aria-live="polite">
      {t && (
        <div className={'toast' + (t.error ? ' is-error' : '')}>
          <span>{t.text}</span>
          {t.undo && <button type="button" onClick={() => { const undo = t.undo; toast(null); undo().catch(() => {}); }}>Undo</button>}
        </div>
      )}
    </div>
  );
}

// Shown while data loads. It fades in after a moment, so quick loads don't flash.
export function Loading({ label = 'Loading', block }) {
  return <div className={'loading' + (block ? ' is-block' : '')} role="status"><span className="spinner" aria-hidden="true" />{label}…</div>;
}
export function LoadError({ error, retry, what = 'this' }) {
  return (
    <div className="load-error" role="alert">
      <Icon name="alert" size={20} />
      <div><strong>Couldn't load {what}.</strong><span>{(error && error.message) || 'Something went wrong.'}</span></div>
      {retry && <button type="button" className="btn-outline" onClick={retry}><Icon name="refresh" />Try again</button>}
    </div>
  );
}
// Renders children once a query is ready; otherwise its loading or error state.
export function Loaded({ query, what, block, children }) {
  if (query.ready) return children();
  if (query.status === 'error') return <LoadError error={query.error} retry={query.retry} what={what} />;
  return <Loading label={'Loading ' + what} block={block} />;
}

export function Modal({ id, title, intro, icon, narrow, children, onClose, focusKey }) {
  const ref = useRef(null);
  const opener = useRef(document.activeElement);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
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
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
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
