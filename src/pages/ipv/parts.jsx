// Small pieces shared by the IPV screens.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { IPV_STATUS } from '../../state/ipv.js';

export const STATUS_ICON = { intake: 'notice', review: 'flag', reviewed: 'check' };
const pad = (n) => String(n).padStart(2, '0');
export const isoToUSDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear(); };

// The status, colored, with a menu to move the referral. A native select, so it works by keyboard and screen reader.
export function StatusSelect({ r, name, onChange, id }) {
  return (
    <span className={'ipv-status is-' + r.status}>
      <Icon name={STATUS_ICON[r.status]} size={14} />
      <select id={id} aria-label={'Status for ' + name} value={r.status} onChange={(e) => onChange(e.target.value)}>
        {Object.keys(IPV_STATUS).map((s) => <option key={s} value={s}>{IPV_STATUS[s]}</option>)}
      </select>
      <span className="ipv-status-chev" aria-hidden="true"><Icon name="chevronDown" size={14} /></span>
    </span>
  );
}
