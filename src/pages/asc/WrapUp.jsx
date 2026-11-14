// Step 4, Wrap Up: every need ends somewhere, the reporting check, then close the contact.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Table } from '../../ui/controls.jsx';
import { useApi } from '../../state/store.jsx';
import { useAscMutations } from '../../state/asc.js';
import { Link, navigate } from '../../router.jsx';
import { OUTCOMES, reportingIssues, totals, totalsText, unitsFor, serviceCode, screeningLine, minutesBetween, clockTime, usDate, plural, followUpPlan, weekday } from '../../data/asc.js';
import { Badge, Section, channelLabel, useMountFocus } from './parts.jsx';

const STATE_SPEC = { grid: 'minmax(120px,1.2fr) minmax(90px,1fr) 100px 90px 70px minmax(120px,1fr)', min: 640 };

function StartNext() {
  const { createContact } = useAscMutations();
  const start = (channel) => createContact({ channel }).then((c) => navigate({ page: 'contact', id: c.id, step: 'intake' }), () => {});
  return (
    <div className="asc-inline-row">
      <button type="button" className="btn-primary is-icon" onClick={() => start('phone')}><Icon name="phone" />Start Next Phone Contact</button>
      <button type="button" className="btn-outline" onClick={() => start('person')}><Icon name="door" />Start In-Person Contact</button>
      <Link className="btn-text" to="#asc">Back to ASC Contacts</Link>
    </div>
  );
}

function Closed({ k }) {
  const head = useMountFocus();
  const t = totals(k.interactions);
  const lines = [];
  if (k.closedKind === 'urgent') lines.push((k.urgent.need || 'The need') + ': ' + k.urgent.dest + ', ' + k.urgent.how.split(':')[0].toLowerCase());
  lines.push(k.clientId ? (k.identity === 'new' ? 'Registered in MCI and enrolled in ASC' : 'On ' + k.client.first + ' ' + k.client.last + '’s record') : k.identity === 'unverified' ? 'Saved with name only: verify on a later contact' : 'Anonymous. Reference number ' + k.ref + ' given');
  lines.push(totalsText(t) + ' documented');
  lines.push(k.needs.map((n) => n.name + ': ' + (n.outcome || '—').toLowerCase()).join(' · '));
  if (k.clientId) lines.push(k.followUp.ok === 'Yes' ? 'Follow-ups scheduled: 7-day and 90-day' : k.followUp.ok === 'No' ? 'They declined follow-up' : 'Follow-up permission not asked');
  if (k.channel === 'person') lines.push('In person at ' + k.site + (k.onsite.idCheck && k.onsite.idCheck !== 'None shown' ? ', ID checked' : '') + (k.onsite.consentSigned ? ', consent signed' : '') + (k.onsite.docs.length ? ', ' + plural(k.onsite.docs.length, 'document', 'documents') + ' scanned' : ''));
  const issues = k.clientId ? reportingIssues(k) : [];
  lines.push(k.clientId ? (issues.length ? 'Not ready for state reporting: ' + issues.map((i) => i.title.replace(/\.$/, '').toLowerCase()).join(', ') : 'Ready for state reporting') : 'Counted in ASC reports by caller, reason and outcome');
  return (
    <div className="view asc-view">
      <div className="success asc-closed" role="status">
        <Icon name="check" size={44} />
        <strong tabIndex={-1} ref={head}>{k.closedKind === 'urgent' ? 'Contact closed: transferred to crisis' : 'Contact closed'}</strong>
        <span>{usDate(k.startedAt)}, {clockTime(k.startedAt)}–{clockTime(k.endedAt)} · {minutesBetween(k.startedAt, k.endedAt)} min · {channelLabel(k.channel)}</span>
      </div>
      <ul className="asc-summary">{lines.map((l) => <li key={l}><Icon name="checkSmall" size={14} />{l}</li>)}</ul>
      <StartNext />
    </div>
  );
}

export function WrapUpStep({ k, edit, flush }) {
  const { closeContact } = useAscMutations();
  const { toast } = useApi();
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  if (k.status === 'closed') return <Closed k={k} />;

  const t = totals(k.interactions);
  const issues = k.clientId ? reportingIssues(k) : [];
  const unset = k.needs.filter((n) => !n.outcome);
  const setOutcome = (n, v) => edit({ needs: k.needs.map((x) => (x.id === n.id ? { ...x, outcome: v } : x)) }, { now: true });
  const close = () => {
    setTried(true);
    if (!k.needs.length || unset.length) { const el = document.getElementById(unset.length ? 'out-' + unset[0].id : 'h-wneeds'); if (el) el.focus(); return; }
    setBusy(true);
    flush().then(() => closeContact(k, {})).then(() => { toast('Contact ' + k.ref + ' closed'); setBusy(false); }, () => setBusy(false));
  };
  const plan = k.clientId && k.followUp.ok === 'Yes' ? followUpPlan(k, '') : null;
  const fix = (step) => navigate({ page: 'contact', id: k.id, step });

  return (
    <div className="view asc-view">
      <div className="view-head"><h2 className="title"><Icon name="check" size={24} />Wrap Up</h2></div>

      <Section id="h-wneeds" title="Every need ends somewhere" icon="layers" hint="Choose what happens to each need. Open needs stay on the record for the next contact.">
        {k.needs.length ? (
          <ul className="asc-outcomes">
            {k.needs.map((n) => {
              const bad = tried && !n.outcome;
              return (
                <li key={n.id} className={bad ? 'is-error' : ''}>
                  <div className="asc-outcome-name"><strong>{n.name}</strong><Badge urg={n.urg} /></div>
                  <div className="field">
                    <label htmlFor={'out-' + n.id}>Outcome</label>
                    <select className="select" id={'out-' + n.id} value={n.outcome} aria-invalid={bad} aria-describedby={bad ? 'out-err-' + n.id : undefined} onChange={(e) => setOutcome(n, e.target.value)}>
                      <option value="">Choose an outcome</option>{OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    {bad && <span className="field-error" id={'out-err-' + n.id}>Choose an outcome for this need.</span>}
                    {n.outcome === 'Keep open with a follow-up' && <span className="asc-hint">{plan ? 'The 7-day follow-up is on ' + weekday(plan[0].due) + ' ' + usDate(plan[0].due) + '.' : k.clientId ? 'Ask about follow-up on the Interactions step to schedule one.' : 'Stays open for whoever takes their next contact.'}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className={'asc-empty' + (tried ? ' is-error' : '')} tabIndex={-1}>No needs recorded. Add at least one on the Intake step. <Link className="link-btn" to={{ page: 'contact', id: k.id, step: 'intake' }}>Go to Intake</Link></p>}
      </Section>

      {k.clientId ? (
        <Section id="h-check" title="Reporting check" icon="database">
          <ul className="asc-checks">
            {issues.map((i) => <li key={i.id} className="is-error"><Icon name="alert" size={16} /><span><strong>{i.title}</strong> {i.text}</span><button type="button" className="btn-outline" onClick={() => fix(i.step)}>Fix Now</button></li>)}
            {!k.followUp.ok && <li className="is-warn"><Icon name="calendar" size={16} /><span><strong>Follow-up permission not asked.</strong> No follow-ups are scheduled until they say it's OK.</span><button type="button" className="btn-outline" onClick={() => fix('interactions')}>Ask Now</button></li>}
            {!issues.length && <li className="is-good"><Icon name="check" size={16} /><span>Service code, date, unit type, units and place of service are complete on {t.count === 1 ? 'the interaction' : 'all ' + t.count + ' interactions'}.</span></li>}
          </ul>
          <h4 className="field-label">What goes to the state</h4>
          <Table label="What goes to the state" spec={STATE_SPEC} empty="No interactions yet, so nothing can be reported."
            head={['Client', 'Service code', 'Date', 'Unit type', 'Units', 'Place'].map((h) => <div className="th" role="columnheader" key={h}>{h}</div>)}>
            {k.interactions.map((x) => {
              const u = unitsFor(x.min);
              return (
                <div className="tr is-row is-ruled" role="row" key={x.id}>
                  <div className="td" role="cell">{k.client.first} {k.client.last}</div>
                  <div className="td mono" role="cell">{serviceCode(x.type)}</div>
                  <div className="td" role="cell">{usDate(k.startedAt)}</div>
                  <div className="td" role="cell">15 min</div>
                  <div className={'td' + (u ? '' : ' is-missing')} role="cell">{u || 'Missing'}</div>
                  <div className={'td' + (x.place ? '' : ' is-missing')} role="cell">{x.place ? x.place.replace(' [code TBD]', '') : 'Missing'}</div>
                </div>
              );
            })}
          </Table>
        </Section>
      ) : (
        <Section id="h-record" title="The record" icon="notes">
          <dl className="chips">
            <div className="chip"><dt>Contact</dt><dd>{channelLabel(k.channel)}, {clockTime(k.startedAt)} · {minutesBetween(k.startedAt, new Date().toISOString())} min so far</dd></div>
            <div className="chip"><dt>Interactions</dt><dd>{totalsText(t)}</dd></div>
            <div className="chip"><dt>Screening</dt><dd>{screeningLine(k.screening)}</dd></div>
            <div className="chip"><dt>Reference number</dt><dd className="mono">{k.ref}</dd></div>
          </dl>
          <p className="asc-hint">{k.identity === 'unverified' ? 'Counted in ASC reports. Sent to the state once the person is verified.' : 'Counted in ASC reports by caller, reason and outcome. If they come back with their reference number, this contact moves to their record when they identify.'}</p>
        </Section>
      )}

      <div className="asc-foot">
        {tried && (unset.length || !k.needs.length) ? <p className="asc-gaps is-error" role="alert"><Icon name="alert" size={16} />{k.needs.length ? 'Choose an outcome for ' + plural(unset.length, 'need', 'needs') + ' before closing.' : 'Add a need before closing.'}</p> : <span />}
        <button type="button" className="btn-primary" onClick={close} disabled={busy}>Close Contact</button>
      </div>
    </div>
  );
}
