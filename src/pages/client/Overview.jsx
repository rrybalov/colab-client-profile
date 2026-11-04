// Client Overview tab: contact information, demographics and program enrollment.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { Segmented } from '../../ui/controls.jsx';
import { Link } from '../../router.jsx';
import { useModalControls } from '../../state/modal.js';
import { currentAddresses, stateOf } from '../../data/addresses.js';
import { historyRoute } from './address/AddressModal.jsx';
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

// The most recent address, with how many others are open at the same time, and the ways into the history.
function AddressBlock({ client: c }) {
  const { openModal } = useModalControls();
  const current = currentAddresses(c.addresses);
  const top = current[0];
  const others = current.length - 1;
  const a = c.address;
  const details = () => openModal('address', { clientId: c.id });
  return (
    <div className="kv">
      <div className="addr-label-row">
        <div className="kv-label">Address <span>(Most Recent)</span></div>
        {top && others > 0 && (
          <span className="tip">
            <button type="button" className="concurrent-pill" onClick={details} aria-describedby={'conc-tip-' + c.id}>{others} Concurrent</button>
            <span className="tip-box is-right" role="tooltip" id={'conc-tip-' + c.id}>{others} other address{others > 1 ? 'es' : ''} reported for the same period</span>
          </span>
        )}
      </div>
      {top ? (
        <>
          <div className="kv-value">{top.street},<br />{top.city}, {stateOf(top.county)} {top.zip}</div>
          <ul className="kv-list">
            {a.facility && <li><Icon name="pin" size={14} />{a.facility}</li>}
            {a.ward && <li><Icon name="landmark" size={14} />{a.ward}</li>}
            <li><Icon name="book" size={14} />{top.schoolDistrict || a.school}</li>
          </ul>
          <Source stamp={c.sources.address} />
          <div className="addr-links">
            <button type="button" className="link-btn is-small" onClick={details}>View Address Details</button>
            <span className="addr-links-sep" aria-hidden="true" />
            <Link className="link-btn is-small is-inline" to={historyRoute(c.id)}>View Full Address History<Icon name="external" size={13} /></Link>
          </div>
        </>
      ) : <div className="kv-value is-missing">No current address on file</div>}
    </div>
  );
}

export function Overview({ client: c }) {
  const [sub, setSub] = usePref('overview.sub', 'contact');
  let body;
  if (sub === 'contact') {
    body = (
      <div className="kv-grid">
        <AddressBlock client={c} />
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
