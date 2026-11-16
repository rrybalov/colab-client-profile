// Step 4, Wrap Up: an outcome for each need, anything that would stop the contact being reported, then close.
// Closing saves an automatic summary as a case note. A supervisor can later correct a closed contact.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Table } from '../../ui/controls.jsx';
import { useApi } from '../../state/store.jsx';
import { useSession } from '../../state/data.js';
import { useAscMutations } from '../../state/asc.js';
import { Link, navigate } from '../../router.jsx';
import { OUTCOMES, OPEN, reportingIssues, overtime, unitsFor, serviceCode, minutesBetween, clockTime, usDate, plural, followUpPlan, weekday, shown } from '../../data/asc.js';
import { Badge, Section, StepHeading, useMountFocus } from './parts.jsx';
import { EditClosed } from './Correction.jsx';

const STATE_SPEC = { grid: 'minmax(120px,1.2fr) minmax(90px,1fr) 100px 90px 70px minmax(120px,1fr)', min: 640 };

// Everything that needs a look before closing, in one list. Errors stop state reporting; warnings don't.
export function wrapIssues(k) {
  const out = k.clientId ? reportingIssues(k).map((i) => ({ ...i, kind: 'error' })) : [];
  if (k.clientId && !k.followUp.ok) out.push({ id: 'follow', step: 'interactions', kind: 'warn', title: 'Follow-up not asked.', text: 'Nothing is scheduled until they say it’s OK.' });
  const over = overtime(k);
  if (over) out.push({ id: 'over', step: 'interactions', kind: 'warn', title: over.documented + ' minutes documented in a ' + over.length + '-minute contact.', text: 'Check the minutes; they go to the state.' });
  return out;
}

function StateTable({ k }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="asc-sent">
      <button type="button" className="btn-text is-icon" aria-expanded={open} aria-controls={open ? 'asc-sent' : undefined} onClick={() => setOpen(!open)}><Icon name="chevronDown" size={16} className={'chev' + (open ? ' is-open' : '')} />{open ? 'Hide What’s Sent' : 'Show What’s Sent'}</button>
      {open && (
        <div id="asc-sent">
          <Table label="What goes to the state" spec={STATE_SPEC} empty="No interactions yet."
            head={['Client', 'Service code', 'Date', 'Unit type', 'Units', 'Place'].map((h) => <div className="th" role="columnheader" key={h}>{h}</div>)}>
            {k.interactions.map((x) => {
              const u = unitsFor(x.min);
              return (
                <div className="tr is-row is-ruled" role="row" key={x.id}>
                  <div className="td" role="cell">{k.client.first} {k.client.last}</div>
                  <div className="td mono" role="cell">{serviceCode(x.type).replace(/[[\]]/g, '')}</div>
                  <div className="td" role="cell">{usDate(k.startedAt)}</div>
                  <div className="td" role="cell">15 min</div>
                  <div className={'td' + (u ? '' : ' is-missing')} role="cell">{u || 'Missing'}</div>
                  <div className={'td' + (x.place ? '' : ' is-missing')} role="cell">{x.place ? shown(x.place) : 'Missing'}</div>
                </div>
              );
            })}
          </Table>
        </div>
      )}
    </div>
  );
}

function Closed({ k }) {
  const head = useMountFocus();
  const { staffName } = useSession();
  const { createContact } = useAscMutations();
  const issues = k.clientId ? reportingIssues(k) : [];
  const report = !k.clientId ? (k.identity === 'unverified' ? 'Counted in ASC reports. Sent to the state once verified.' : 'Anonymous. Counted in ASC reports.')
    : issues.length ? 'Not ready for state reporting: ' + issues.map((i) => i.title.replace(/\.$/, '').toLowerCase()).join(', ') + '.' : 'Ready for state reporting.';
  const next = () => createContact({ channel: k.channel }).then((c) => navigate({ page: 'contact', id: c.id, step: 'intake' }), () => {});
  return (
    <div className="view asc-view">
      <StepHeading>Wrap Up</StepHeading>
      <div className="success asc-closed" role="status">
        <Icon name="check" size={44} />
        <strong tabIndex={-1} ref={head}>{k.closedKind === 'urgent' ? 'Closed: sent to crisis' : 'Contact closed'}</strong>
        <span>{usDate(k.startedAt)}, {clockTime(k.startedAt)}–{clockTime(k.endedAt)} · {minutesBetween(k.startedAt, k.endedAt)} min</span>
      </div>
      <ul className="asc-summary">
        {k.summarized && <li><Icon name="notes" size={14} />Summary saved as a case note{k.clientId ? ' on ' + k.client.first + '’s record' : ''}.</li>}
        <li className={issues.length ? 'is-warn' : ''}><Icon name={issues.length ? 'alert' : 'checkSmall'} size={14} />{report}</li>
      </ul>
      {k.corrections.length > 0 && (
        <section className="asc-corrections" aria-labelledby="h-corr">
          <h3 className="field-label" id="h-corr">Corrections</h3>
          <ul>{k.corrections.map((c) => <li key={c.at}>{usDate(c.at)}, {staffName(c.by)}: “{c.reason}”. Changed {c.changed.length ? c.changed.join(', ') : 'nothing'}.</li>)}</ul>
        </section>
      )}
      <div className="asc-inline-row is-center">
        <button type="button" className="btn-primary is-icon" onClick={next}><Icon name={k.channel === 'person' ? 'door' : 'phone'} />Start Next Contact</button>
        <EditClosed k={k} compact />
        <Link className="btn-text" to="#asc">Back to ASC Contacts</Link>
      </div>
    </div>
  );
}

export function WrapUpStep({ k, edit, flush }) {
  const { closeContact } = useAscMutations();
  const { toast } = useApi();
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  if (k.status === 'closed' && !k.correction) return <Closed k={k} />;

  const unset = k.needs.filter((n) => !n.outcome);
  const setOutcome = (n, v) => edit({ needs: k.needs.map((x) => (x.id === n.id ? { ...x, outcome: v } : x)) }, { now: true });
  const close = () => {
    setTried(true);
    if (!k.needs.length || unset.length) { const el = document.getElementById(unset.length ? 'out-' + unset[0].id : 'h-wneeds'); if (el) el.focus(); return; }
    setBusy(true);
    flush().then(() => closeContact(k, {})).then(() => { toast('Contact ' + k.ref + ' closed'); setBusy(false); }, () => setBusy(false));
  };
  const plan = k.clientId && k.followUp.ok === 'Yes' ? followUpPlan(k, '') : null;
  const issues = wrapIssues(k);
  const fix = (step) => navigate({ page: 'contact', id: k.id, step });

  return (
    <div className="view asc-view">
      <StepHeading>Wrap Up</StepHeading>
      <Section id="h-wneeds" title="Finish documenting today's conversation" icon="layers" hint="Pick an outcome for each need.">
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
                    {bad && <span className="field-error" id={'out-err-' + n.id}>Choose an outcome.</span>}
                    {n.outcome === OPEN && <span className="asc-hint">{plan ? '7-day follow-up on ' + weekday(plan[0].due) + ' ' + usDate(plan[0].due) + '.' : k.clientId ? 'No follow-up scheduled yet.' : 'Stays open for their next contact.'}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className={'asc-empty' + (tried ? ' is-error' : '')} tabIndex={-1}>No needs yet. <Link className="link-btn" to={{ page: 'contact', id: k.id, step: 'intake' }}>Add One on Intake</Link></p>}
      </Section>

      <Section id="h-check" title="Before you close" icon="database">
        <ul className="asc-checks">
          {issues.map((i) => <li key={i.id} className={i.kind === 'error' ? 'is-error' : 'is-warn'}><Icon name="alert" size={16} /><span><strong>{i.title}</strong> {i.text}</span><button type="button" className="btn-outline is-small" onClick={() => fix(i.step)}>Go to Step</button></li>)}
          {!issues.length && <li className="is-good"><Icon name="check" size={16} /><span>{k.clientId ? 'Ready for state reporting.' : k.identity === 'unverified' ? 'Counted in ASC reports. Sent to the state once verified.' : 'Anonymous. Counted in ASC reports. Reference number ' + k.ref + '.'}</span></li>}
        </ul>
        {k.clientId && k.interactions.length > 0 && <StateTable k={k} />}
      </Section>

      {!k.correction && (
        <div className="asc-foot">
          {tried && (unset.length || !k.needs.length) ? <p className="asc-gaps is-error" role="alert"><Icon name="alert" size={16} />{k.needs.length ? 'Choose an outcome for ' + plural(unset.length, 'need', 'needs') + ' before closing.' : 'Add a need before closing.'}</p> : <span />}
          <button type="button" className="btn-primary" onClick={close} disabled={busy}>Close Contact</button>
        </div>
      )}
    </div>
  );
}
