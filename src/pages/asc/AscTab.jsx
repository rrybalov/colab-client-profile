// The ASC tab on a client's profile: flags from what they've reported, enrollment, and every contact. Each
// contact's full record (answers, screening and a step-by-step log) opens from its history entry.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useSession } from '../../state/data.js';
import { useContacts, useContactHistory, useAscMutations, useCloseouts, useSupervisorMutations } from '../../state/asc.js';
import { useModalControls } from '../../state/modal.js';
import { navigate } from '../../router.jsx';
import { Loaded } from '../../ui/controls.jsx';
import { ASC_ENROLLMENT } from '../../data/asc-seed.js';
import { usDate, clientFlags, SUPERVISOR } from '../../data/asc.js';
import { HistoryList } from './History.jsx';

// The enrollment to show: the active one, or else the most recent.
export function ascEnrollment(c) {
  const all = (c.enrollments || []).filter((e) => e.name === ASC_ENROLLMENT);
  const t = (e) => { const p = String(e.start || '').split('/'); return p.length === 3 ? p[2] + p[0] + p[1] : ''; };
  return all.find((e) => e.kind === 'active') || all.sort((a, b) => (t(a) < t(b) ? 1 : -1))[0] || null;
}

export function AscTab({ client: c }) {
  const { staffName, me, user } = useSession();
  const { createContact } = useAscMutations();
  const { withdrawCloseout } = useSupervisorMutations();
  const { openModal } = useModalControls();
  const { query, contacts } = useContacts({ clientId: c.id });
  const { closeouts } = useCloseouts();
  const enrolled = c.colabs.indexOf('ASC') >= 0;
  const enrollment = ascEnrollment(c);
  const supervisor = user.role === SUPERVISOR;
  const pending = closeouts.find((r) => r.clientId === c.id && r.status === 'pending');
  const last = closeouts.find((r) => r.clientId === c.id && r.status === 'declined');
  const start = (channel) => createContact({ channel, clientId: c.id }).then((k) => navigate({ page: 'contact', id: k.id, step: 'intake' }), () => {});
  if (!enrolled && !enrollment) {
    return (
      <div className="view">
        <h2 className="title"><Icon name="headset" size={24} />Administrative Service Coordination</h2>
        <div className="empty-box"><p>{c.first} isn't enrolled in ASC. Enrollment happens during a contact, once they share their information.</p></div>
      </div>
    );
  }
  const d = c.ascDischarge;
  return (
    <div className="view asc-view">
      <div className="view-head">
        <h2 className="title"><Icon name="headset" size={24} />Administrative Service Coordination</h2>
        <div className="asc-start">
          <button type="button" className="btn-outline" onClick={() => start('person')}><Icon name="door" />New In-Person Contact</button>
          <button type="button" className="btn-primary is-icon" onClick={() => start('phone')}><Icon name="phone" />New Phone Contact</button>
        </div>
      </div>
      {!enrolled && <p className="notice is-info"><Icon name="info" size={18} /><span><strong>Discharged from ASC{d ? ' ' + usDate(d.at) : ''}.</strong> A new contact re-enrolls {c.first}.</span></p>}
      <Loaded query={query} what="ASC contacts">{() => {
        const latest = contacts[0];
        return (
          <>
            <div className="card-grid asc-tab-cards">
              <Flags client={c} />
              <div className="info-card asc-enroll-card">
                <h3 className="asc-card-title"><Icon name="check" size={18} />Enrollment</h3>
                <dl className="pairs is-small">
                  <dt>Status</dt><dd>{enrolled ? (pending ? <span className="status is-ending">Close-out requested</span> : <span className="status is-active">Active</span>) : <span className="status is-inactive">Discharged</span>}</dd>
                  <dt>Since</dt><dd>{enrollment ? enrollment.start : '—'}</dd>
                  {!enrolled && <><dt>Ended</dt><dd>{enrollment ? enrollment.end : '—'}</dd></>}
                  {!enrolled && d && <><dt>Reason</dt><dd>{d.reason}{d.note ? <small className="asc-sub">{d.note}</small> : null}</dd><dt>By</dt><dd>{staffName(d.by)}</dd></>}
                  <dt>Contacts</dt><dd>{contacts.length}</dd>
                  <dt>Last contact</dt><dd>{latest ? usDate(latest.startedAt) + ' · ' + staffName(latest.staff) : '—'}</dd>
                </dl>
                {enrolled && pending && (
                  <div className="asc-closeout-box" role="note">
                    <p><strong>{pending.byName}</strong> asked to close out on {usDate(pending.at)}: {pending.reason}.{pending.note ? ' “' + pending.note + '”' : ''}</p>
                    <div className="asc-closeout-btns">
                      {supervisor && <button type="button" className="btn-outline is-small" onClick={() => openModal('ascCloseout', { clientId: c.id, mode: 'decide', closeoutId: pending.id })}>Review</button>}
                      {(pending.by === me || supervisor) && <button type="button" className="btn-text is-small" onClick={() => withdrawCloseout(pending.id).catch(() => {})}>Withdraw Request</button>}
                    </div>
                  </div>
                )}
                {enrolled && !pending && last && last.decidedAt && (
                  <p className="asc-hint">Close-out declined {usDate(last.decidedAt)} by {last.decidedByName}: {last.decisionNote}</p>
                )}
                {enrolled && !pending && (
                  <div className="asc-closeout-btns">
                    {supervisor
                      ? <button type="button" className="btn-outline is-small" onClick={() => openModal('ascCloseout', { clientId: c.id, mode: 'discharge' })}><Icon name="door" size={16} />Discharge from ASC</button>
                      : <button type="button" className="btn-outline is-small" onClick={() => openModal('ascCloseout', { clientId: c.id, mode: 'request' })}><Icon name="door" size={16} />Request Close-Out</button>}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      }}</Loaded>
      <section aria-labelledby="h-asc-hist" className="asc-section">
        <h3 className="subtitle" id="h-asc-hist">History</h3>
        <HistoryList q={{ clientId: c.id }} empty={'No ASC contacts for ' + c.first + ' yet.'} />
      </section>
    </div>
  );
}

// Flags from what the person has reported in their ASC contacts: their latest answer in each screening area.
function Flags({ client: c }) {
  const { history } = useContactHistory({ clientId: c.id });
  const records = history.contacts.filter((x) => x.record && x.record.clientId === c.id).map((x) => x.record);
  const { current, earlier } = clientFlags(records);
  return (
    <div className="info-card asc-flags" aria-labelledby="h-flags">
      <h3 className="asc-card-title" id="h-flags"><Icon name="flag" size={18} />Flags</h3>
      {current.length ? (
        <ul className="asc-flag-list">
          {current.map((f) => <li key={f.key} className="is-on"><Icon name="alert" size={14} /><strong>{f.label}</strong><span>{f.answer} · {usDate(f.date)}</span></li>)}
        </ul>
      ) : <p className="asc-hint">Nothing flagged from what {c.first} has told us.</p>}
      {earlier.length > 0 && (
        <>
          <p className="field-label">Earlier, not in their latest answer</p>
          <ul className="asc-flag-list">{earlier.map((f) => <li key={f.key}><strong>{f.label}</strong><span>{f.answer} · {usDate(f.date)}</span></li>)}</ul>
        </>
      )}
      <p className="asc-hint">Self-reported during ASC contacts.</p>
    </div>
  );
}
