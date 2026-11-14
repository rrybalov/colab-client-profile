// The ASC tab on a client's profile: enrollment, the latest screening and follow-up answers, and every
// contact. Answers from each contact's intake carry here.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useSession } from '../../state/data.js';
import { useContacts, useContact, useAscMutations } from '../../state/asc.js';
import { navigate } from '../../router.jsx';
import { Loaded } from '../../ui/controls.jsx';
import { ASC_ENROLLMENT } from '../../data/asc-seed.js';
import { usDate } from '../../data/asc.js';
import { ScreeningSummary, Badge } from './parts.jsx';
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
          <button type="button" className="btn-primary is-icon" onClick={() => start('phone')}><Icon name="phone" />New Phone Contact</button>
          <button type="button" className="btn-outline" onClick={() => start('person')}><Icon name="door" />New In-Person Contact</button>
        </div>
      </div>
      <Loaded query={query} what="ASC contacts">{() => {
        const latest = contacts[0];
        const needs = [];
        const seen = new Set();
        contacts.forEach((k) => k.needs.forEach((n) => { if (!seen.has(n.name)) { seen.add(n.name); needs.push({ ...n, ref: k.ref, date: k.startedAt }); } }));
        const open = needs.filter((n) => n.outcome === 'Keep open with a follow-up' || !n.outcome);
        return (
          <>
            <div className="card-grid">
              <div className="info-card">
                <h3 className="asc-card-title"><Icon name="check" size={18} />Enrollment</h3>
                <dl className="pairs is-small">
                  <dt>Status</dt><dd><span className="status is-active">Active</span></dd>
                  <dt>Since</dt><dd>{enrollment ? enrollment.start : '—'}</dd>
                  <dt>Contacts</dt><dd>{contacts.length}</dd>
                  <dt>Last contact</dt><dd>{latest ? usDate(latest.startedAt) + ' · ' + staffName(latest.staff) : '—'}</dd>
                </dl>
              </div>
              <div className="info-card">
                <h3 className="asc-card-title"><Icon name="layers" size={18} />Open needs</h3>
                {open.length ? <ul>{open.map((n) => <li key={n.name}><Badge urg={n.urg} /> {n.name}</li>)}</ul> : <p className="asc-hint">None open.</p>}
              </div>
            </div>
            {latest && <LatestScreening contactId={latest.id} />}
          </>
        );
      }}</Loaded>
      <section aria-labelledby="h-asc-hist" className="asc-section">
        <h3 className="subtitle" id="h-asc-hist">Previous interactions</h3>
        <HistoryList q={{ clientId: c.id }} empty={'No ASC contacts for ' + c.first + ' yet.'} />
      </section>
    </div>
  );
}

function LatestScreening({ contactId }) {
  const { contact: k } = useContact(contactId);
  if (!k) return null;
  return (
    <section className="asc-section" aria-labelledby="h-asc-scr">
      <div className="asc-section-head"><div><h3 className="section-label" id="h-asc-scr"><Icon name="check" size={18} />Screening, latest contact</h3><p className="asc-hint">{k.ref} · {usDate(k.startedAt)}. Follow-up: {k.followUp.ok === 'Yes' ? 'OK by ' + k.followUp.how.toLowerCase() + (k.followUp.time ? ', ' + k.followUp.time : '') : k.followUp.ok === 'No' ? 'declined' : 'not asked'}.</p></div></div>
      <ScreeningSummary screening={k.screening} />
    </section>
  );
}
