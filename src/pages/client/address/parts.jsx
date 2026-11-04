// Pieces shared by the Address Details dialog and the Address History page.
import React from 'react';
import { Icon } from '../../../ui/icons.jsx';
import { bucketDetail, cityLine, dayCount, duration, isOpen, lastReported, longDate, monthYear, providerName } from '../../../data/addresses.js';

const KIND_ICON = { home: 'homeSolid', shelter: 'bed', transitional: 'apartment', incarcerated: 'landmark' };
export function KindIcon({ kind, size = 20 }) {
  return <span className={'addr-kind is-' + (KIND_ICON[kind] ? kind : 'home')}><Icon name={KIND_ICON[kind] || 'homeSolid'} size={size} label={kind === 'incarcerated' ? 'Custody' : kind === 'shelter' ? 'Shelter' : kind === 'transitional' ? 'Transitional housing' : 'Residence'} /></span>;
}

// A program tag. Hover or focus shows the program's full name and the source systems (or report dates) behind it.
export function SourceTag({ bucket, addr }) {
  if (!addr) return <span className={'src-tag is-' + bucket}>{bucket}</span>;
  const d = bucketDetail(addr, bucket);
  return (
    <span className="tip src-tip">
      <button type="button" className={'src-tag is-' + bucket} aria-label={bucket + ': ' + d.name}>{bucket}</button>
      <span className="tip-box" role="tooltip">
        <strong className="tip-title">{d.name}</strong>
        {d.systems.length ? (
          <ul className="src-systems">{d.systems.map((s, i) => <li key={i}>{s.name} {s.code && <span className="src-code">{s.code}</span>}</li>)}</ul>
        ) : (
          <>
            <span className="tip-muted">No specific system data available.</span>
            {d.reports.map((r, i) => <span key={i} className="tip-line">• Reported {longDate(r.date)}</span>)}
          </>
        )}
      </span>
    </span>
  );
}
export function SourceTags({ addr, max }) {
  const list = max ? addr.sources.slice(0, max) : addr.sources;
  return <span className="src-tags">{list.map((b) => <SourceTag key={b} bucket={b} addr={addr} />)}</span>;
}

export const CurrentChip = ({ label = 'Current' }) => <span className="addr-current">{label}</span>;

export function DateRange({ addr }) {
  return (
    <span className="addr-dates">
      <span className="addr-range">{monthYear(addr.start)} – {addr.end ? monthYear(addr.end) : <span className="addr-present">Present</span>}</span>
      <span className="addr-dur">{duration(addr.start, addr.end)}</span>
    </span>
  );
}

const Field = ({ label, children }) => <div className="addr-field"><span className="addr-field-label">{label}</span><span className="addr-field-value">{children}</span></div>;
const Phone = ({ p }) => <><span>{p.number} ({p.type})</span>{p.validDate && <span className="addr-sub">Valid since {longDate(p.validDate)}</span>}</>;

// Everything one source said about one address.
export function AddressDetails({ addr }) {
  const last = lastReported(addr);
  return (
    <div className="addr-details">
      <div className="addr-detail-sources">
        <span className="addr-overline">Sources</span>
        <SourceTags addr={addr} />
        {last && <span className="addr-sub">· Last reported {longDate(last)}</span>}
      </div>
      <div className="addr-detail-grid">
        <section aria-label="Address information">
          <h4 className="addr-overline">Address Information</h4>
          <Field label="Address"><span>{addr.street}</span><span>{cityLine(addr)}</span></Field>
          <div className="addr-pair">
            <Field label="Township/Muni">{addr.township || '—'}</Field>
            <Field label="County">{addr.county}</Field>
          </div>
          <Field label="School District">{addr.schoolDistrict || '—'}</Field>
          <div className="addr-span">
            <div className="addr-pair">
              <Field label="Start Date"><strong>{longDate(addr.start)}</strong></Field>
              <Field label="End Date"><strong>{longDate(addr.end)}</strong></Field>
            </div>
            <Field label="Duration">{duration(addr.start, addr.end)} ({dayCount(addr.start, addr.end)})</Field>
          </div>
        </section>
        <section aria-label="Contact and provider match">
          <h4 className="addr-overline">Contact &amp; Provider Match</h4>
          <Field label="Email">{addr.email || '—'}</Field>
          <Field label="Primary Phone">{addr.phone ? <Phone p={addr.phone} /> : '—'}</Field>
          <Field label="Alternate Phones">{addr.altPhones.length ? addr.altPhones.map((p, i) => <Phone key={i} p={p} />) : '—'}</Field>
          <div className="addr-provider">
            <Field label="Provider Match">
              {addr.providerLocation ? (
                <>
                  <strong>{providerName(addr.providerLocation)}</strong>
                  <span className="addr-sub">{addr.providerLocation}</span>
                </>
              ) : '—'}
            </Field>
            {addr.providerLocation && (
              <>
                <div className="addr-pair">
                  <Field label="Facility ID"><span className="mono">{addr.facilityId || '—'}</span></Field>
                  <Field label="Residential"><span className={'addr-yes' + (addr.residential ? ' is-yes' : '')}>{addr.residential ? 'Yes' : 'No'}</span></Field>
                </div>
                {addr.useDescription && <Field label="Property Use">{addr.useDescription}</Field>}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// An address as an expandable card: kind, street, CURRENT, city line, dates, up to three program tags.
export function AddressCard({ addr, open, onToggle }) {
  const current = isOpen(addr);
  const panelId = 'addr-panel-' + addr.id;
  return (
    <div className={'addr-card' + (open ? ' is-open' : '')}>
      <div className="addr-head" onClick={onToggle}>
        <KindIcon kind={addr.kind} />
        <button type="button" className="addr-toggle" aria-expanded={open} aria-controls={panelId} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <span className="addr-main">
            <span className="addr-street-row"><span className={'addr-street' + (current ? ' is-current' : '')}>{addr.street}</span>{current && <CurrentChip />}</span>
            <span className="addr-city">{cityLine(addr)}</span>
          </span>
          <DateRange addr={addr} />
        </button>
        <span className="addr-tags"><SourceTags addr={addr} max={3} /></span>
        <Icon name="chevronRight" size={20} className={'addr-chev' + (open ? ' is-open' : '')} />
      </div>
      {open && <div className="addr-body" id={panelId}><AddressDetails addr={addr} /></div>}
    </div>
  );
}
