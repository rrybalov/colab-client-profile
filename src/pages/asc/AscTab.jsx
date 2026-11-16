// The ASC tab on a client's profile: flags from what they've reported, enrollment, and every contact. Each
// contact's full record (answers, screening and a step-by-step log) opens from its history entry.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useSession } from '../../state/data.js';
import { useContacts, useContactHistory, useAscMutations } from '../../state/asc.js';
import { navigate } from '../../router.jsx';
import { Loaded } from '../../ui/controls.jsx';
import { ASC_ENROLLMENT } from '../../data/asc-seed.js';
import { usDate, clientFlags } from '../../data/asc.js';
import { HistoryList } from './History.jsx';

export function AscTab({ client: c }) {
  const { staffName } = useSession();
  const { createContact } = useAscMutations();
  const { query, contacts } = useContacts({ clientId: c.id });
  const enrolled = c.colabs.indexOf('ASC') >= 0;
  const enrollment = (c.enrollments || []).find((e) => e.name === ASC_ENROLLMENT);
  const start = (channel) => createContact({ channel, clientId: c.id }).then((k) => navigate({ page: 'contact', id: k.id, step: 'intake' }), () => {});
  if (!enrolled) {
    return (
      <div className="view">
        <h2 className="title"><Icon name="headset" size={24} />Administrative Service Coordination</h2>
        <div className="empty-box"><p>{c.first} isn't enrolled in ASC. Enrollment happens during a contact, once they share their information.</p></div>
      </div>
    );
  }
  return (
    <div className="view asc-view">
      <div className="view-head">
        <h2 className="title"><Icon name="headset" size={24} />Administrative Service Coordination</h2>
        <div className="asc-start">
          <button type="button" className="btn-outline" onClick={() => start('person')}><Icon name="door" />New In-Person Contact</button>
          <button type="button" className="btn-primary is-icon" onClick={() => start('phone')}><Icon name="phone" />New Phone Contact</button>
        </div>
      </div>
      <Loaded query={query} what="ASC contacts">{() => {
        const latest = contacts[0];
        return (
          <>
            <div className="card-grid asc-tab-cards">
              <Flags client={c} />
              <div className="info-card">
                <h3 className="asc-card-title"><Icon name="check" size={18} />Enrollment</h3>
                <dl className="pairs is-small">
                  <dt>Status</dt><dd><span className="status is-active">Active</span></dd>
                  <dt>Since</dt><dd>{enrollment ? enrollment.start : '—'}</dd>
                  <dt>Contacts</dt><dd>{contacts.length}</dd>
                  <dt>Last contact</dt><dd>{latest ? usDate(latest.startedAt) + ' · ' + staffName(latest.staff) : '—'}</dd>
                </dl>
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
