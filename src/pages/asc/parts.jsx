// Small pieces the ASC screens share: option buttons, sections, the screening summary and contact labels.
import React, { useEffect, useRef } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { SCREENING, isConcern, CHANNELS, clockTime, usDate } from '../../data/asc.js';

// One answer out of several, as toggle buttons. Pressing the chosen answer again clears it, unless `required`.
export function Options({ label, labelId, value, options, onChange, concern, required, small }) {
  return (
    <div className={'opts' + (small ? ' is-small' : '')} role="group" aria-label={labelId ? undefined : label} aria-labelledby={labelId}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value, text = typeof o === 'string' ? o : o.label;
        const on = value === v;
        const warn = on && concern && concern.indexOf(v) >= 0;
        return (
          <button key={v} type="button" className={'opt' + (warn ? ' is-concern' : '') + (o.danger ? ' is-danger' : '')} aria-pressed={on}
            onClick={() => onChange(on && !required ? null : v)}>
            {on && <Icon name="checkSmall" size={14} />}{text}
          </button>
        );
      })}
    </div>
  );
}

export function Section({ id, title, hint, icon, children, aside, className = '' }) {
  return (
    <section className={'asc-section ' + className} aria-labelledby={id}>
      <div className="asc-section-head">
        <div>
          <h3 className="section-label" id={id} tabIndex={-1}>{icon && <Icon name={icon} size={18} />}{title}</h3>
          {hint && <p className="asc-hint">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function ScreeningSummary({ screening }) {
  return (
    <dl className="asc-screen-grid">
      {SCREENING.map((q) => {
        const a = screening[q.key];
        const concern = isConcern(q, a);
        return (
          <div className={'asc-screen-item' + (concern ? ' is-concern' : '') + (a ? '' : ' is-empty')} key={q.key}>
            <dt>{q.label}</dt><dd>{concern && <Icon name="alert" size={13} label="Concern" />}{a || 'Not asked'}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export const channelIcon = (channel) => (channel === 'person' ? 'door' : 'phone');
export const channelLabel = (channel) => CHANNELS[channel] || CHANNELS.phone;
export const whenText = (iso) => (iso ? usDate(iso) + ' · ' + clockTime(iso) : '');
export function personLabel(k) {
  if (k.clientName) return k.clientName;
  if (k.identity === 'unverified') return 'Unverified';
  return 'Anonymous' + (k.anonName ? ': ' + k.anonName : '');
}

export function StatusPill({ status, kind }) {
  if (status === 'open') return <span className="status is-active">In progress</span>;
  return <span className="status is-inactive">{kind === 'urgent' ? 'Closed: crisis' : 'Closed'}</span>;
}

export function Badge({ urg }) {
  return <span className={'asc-urg is-' + String(urg || 'Routine').toLowerCase()}>{urg}</span>;
}

// When a screen swaps one block for another, focus would fall back to the page. This puts it on the new
// block's heading instead, but only if focus was lost, so it never pulls focus away from where someone is.
// Takes focus when the element first appears (pass `ready` when it waits on data), unless focus is already somewhere.
export function useMountFocus(ready = true) {
  const ref = useRef(null);
  useEffect(() => {
    const a = document.activeElement;
    if (ready && ref.current && (!a || a === document.body || !document.contains(a))) ref.current.focus({ preventScroll: false });
  }, [ready]);
  return ref;
}
// Removing something offers Undo in the CoLab toast, so a slip during a call costs nothing.
export function removeWithUndo(toast, edit, k, key, item, label) {
  const before = k[key];
  edit({ [key]: before.filter((x) => x.id !== item.id) }, { now: true });
  toast(label + ' removed', { undo: () => edit({ [key]: before }, { now: true }) });
}
export function focusLater(id) { setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 30); }

export const initials = (c) => ((c.first || '')[0] || '') + ((c.last || '')[0] || '');
