// Client Overview tab: contact information, demographics and program enrollment.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { Segmented } from '../../ui/controls.jsx';
import { dobText, fullName } from '../../lib.js';

// Where a contact detail came from and when. Sources with a known description get an explanatory tooltip.
const SOURCE_INFO = { 'PA DHS': 'This info comes from the benefits funds from the Pennsylvania Department of Human Services (PA DHS)' };
function Source({ stamp }) {
  if (!stamp || !stamp.source) return null;
  const info = SOURCE_INFO[stamp.source];
  const pill = info
    ? <span className="tip"><button type="button" className="tip-trigger source-pill" aria-label={'About this source: ' + stamp.source}>{stamp.source}</button><span className="tip-box" role="tooltip">{info}</span></span>
    : <span className="source-pill">{stamp.source}</span>;
  return <div className="source">Source: {pill}{stamp.asOf && <> As of {stamp.asOf}</>}</div>;
}

export function Overview({ client: c }) {
  const [sub, setSub] = usePref('overview.sub', 'contact');
  const a = c.address;
  let body;
  if (sub === 'contact') {
    body = (
      <div className="kv-grid">
        <div className="kv">
          <div className="kv-label">Address <span>(Most Recent)</span></div>
          <div className="kv-value">{a.street},<br />{a.city}, {a.state} {a.zip}</div>
          <ul className="kv-list">
            {a.facility && <li><Icon name="pin" size={14} />{a.facility}</li>}
            <li><Icon name="landmark" size={14} />{a.ward}</li>
            <li><Icon name="book" size={14} />{a.school}</li>
          </ul>
          <Source stamp={c.sources.address} />
        </div>
        <div className="kv" style={{ gap: 18 }}>
          <div className="kv"><div className="kv-label">Phone Number <span>(Most Recent)</span></div>
            <div className="kv-value num">{c.phone || 'Not on file'}{c.phone && <span style={{ color: 'var(--blue)' }}><Icon name="phone" /></span>}</div>
            <Source stamp={c.sources.phone} /></div>
          <div className="kv"><div className="kv-label">Email <span>(Most Recent)</span></div>
            <div className="kv-value">{c.email || 'Not on file'}{c.email && <span style={{ color: 'var(--blue)' }}><Icon name="mail" /></span>}</div>
            <Source stamp={c.sources.email} /></div>
        </div>
      </div>
    );
  } else if (sub === 'demo') {
    const pairs = c.household
      ? [['Household Members', (c.members || []).join(', ')], ['Primary Language', c.language], ['Living Arrangement', c.living]]
      : [['Date of Birth', dobText(c)], ['Marital Status', c.marital], ['Race', c.race], ['Ethnicity', c.ethnicity], ['Gender', c.gender], ['Legal Sex', c.legalSex], ['Primary Language', c.language], ['Living Arrangement', c.living]];
    body = <dl className="demo-grid">{pairs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}</dl>;
  } else {
    const list = c.enrollments || [];
    body = list.length ? (
      <ul className="enroll-list">
        {list.map((e) => (
          <li key={e.name} className={'enroll is-' + e.kind}>
            <div className="enroll-top">
              <div><div className="enroll-name">{e.name}</div>
                <div className="enroll-asof">{e.asOf}{e.stale && <span style={{ color: 'var(--red-text)' }}><Icon name="alert" size={13} label="Out of date" /></span>}</div></div>
              <span className={'status is-' + e.kind}>{e.status}</span>
            </div>
            <div className="enroll-dates"><span><strong>Start date:</strong> {e.start}</span><span className="track" aria-hidden="true"><span style={{ width: e.pct + '%' }} /></span><span><strong>End date:</strong> {e.end}</span></div>
          </li>
        ))}
      </ul>
    ) : <div className="empty-box"><p>No program enrollments on record for {fullName(c)}.</p></div>;
  }
  return (
    <div className="view" style={{ gap: 18 }}>
      <h2 className="title"><Icon name="user" size={24} />Client Overview</h2>
      <Segmented fill label="Overview section" value={sub} onChange={setSub}
        options={[{ id: 'contact', icon: 'building', label: 'Contact Information' }, { id: 'demo', icon: 'userCircle', label: 'Demographic Information' }, { id: 'enroll', icon: 'gridPlus', label: 'Program Enrollment' }]} />
      {body}
    </div>
  );
}
