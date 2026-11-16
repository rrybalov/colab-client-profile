// The ASC home's other pages: close-out requests, the team's open work (to reassign), and the monthly state report.
// Coordinators see their own close-out requests; Team and State Reporting are for supervisors.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useSession } from '../../state/data.js';
import { useModalControls } from '../../state/modal.js';
import { useCloseouts, useTeamWork, useStateReport, useSupervisorMutations } from '../../state/asc.js';
import { Link } from '../../router.jsx';
import { Loaded, Table, FilterCards, Segmented, SelectBox, usePaged, Pager } from '../../ui/controls.jsx';
import { SUPERVISOR, usDate, plural, reportPeriods, periodLabel } from '../../data/asc.js';
import { isOverdue } from '../../lib.js';
import { SearchLaunch } from '../hub/HubShell.jsx';
import { whenText, personLabel } from './parts.jsx';
import { CloseoutStatus } from './Closeout.jsx';

export const ASC_TABS = [['', 'Contacts'], ['closeouts', 'Close-Outs'], ['team', 'Team', true], ['reporting', 'State Reporting', true]];

export function AscNav({ current = '' }) {
  const { user, me } = useSession();
  const sup = user.role === SUPERVISOR;
  const { closeouts } = useCloseouts();
  const waiting = closeouts.filter((r) => r.status === 'pending' && (sup || r.by === me)).length;
  return (
    <div className="tabs-wrap asc-nav">
      <nav className="tabs" aria-label="ASC pages">
        {ASC_TABS.filter((t) => sup || !t[2]).map(([id, label]) => (
          <Link key={id || 'contacts'} className="tab" to={id ? '#asc/' + id : '#asc'} focus={false} aria-current={current === id ? 'page' : undefined}>
            {label}{id === 'closeouts' && waiting > 0 && <span className="tab-count" aria-label={waiting + ' waiting'}>{waiting}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Head({ title, icon, sub }) {
  return (
    <>
      <div className="page-head"><h1 className="page-title"><Icon name={icon} size={28} />{title}</h1><SearchLaunch /></div>
      <AscNav current={sub} />
    </>
  );
}

function SupervisorsOnly({ title, icon, sub }) {
  return (
    <>
      <Head title={title} icon={icon} sub={sub} />
      <div className="empty-box"><Icon name="lock" size={24} /><p>Only ASC supervisors can see this page.</p><Link className="btn-outline" to="#asc"><Icon name="headset" />ASC Contacts</Link></div>
    </>
  );
}

const clientLink = (id, name) => <Link className="link-btn" to={{ page: 'client', id, sub: 'tab', tab: 'asc' }}>{name}</Link>;

// ------------------------------------------------------------------ close-outs
export function CloseoutsPage() {
  const { user, me } = useSession();
  const sup = user.role === SUPERVISOR;
  const { openModal } = useModalControls();
  const { withdrawCloseout } = useSupervisorMutations();
  const { query, closeouts } = useCloseouts();
  const [tab, setTab] = usePref('asc.closeouts.tab', 'pending');
  const mine = sup ? closeouts : closeouts.filter((r) => r.by === me);
  const pending = mine.filter((r) => r.status === 'pending');
  const decided = mine.filter((r) => r.status !== 'pending');
  const list = tab === 'pending' ? pending : decided;
  return (
    <>
      <Head title="ASC Close-Outs" icon="door" sub="closeouts" />
      <section className="panel-card" aria-labelledby="co-h">
        <div className="card-head">
          <h2 className="card-title" id="co-h">{sup ? 'Close-out requests' : 'Your close-out requests'}</h2>
        </div>
        <p className="asc-hint">{sup ? 'Coordinators ask to close out a client when their work is done. Discharge ends the client’s ASC enrollment; decline keeps them enrolled and tells the coordinator why.'
          : 'To ask for a close-out, open the client’s ASC tab and choose Request Close-Out. A supervisor reviews it.'}</p>
        <Loaded query={query} what="close-out requests">{() => (
          <>
            <Segmented small label="Show requests" value={tab} onChange={setTab}
              options={[{ id: 'pending', label: 'Waiting (' + pending.length + ')' }, { id: 'decided', label: 'Decided (' + decided.length + ')' }]} />
            {list.length ? (
              <ul className="asc-co-list">
                {list.map((r) => (
                  <li key={r.id} className="asc-co">
                    <div className="asc-co-main">
                      <div className="asc-co-top">
                        {clientLink(r.clientId, r.client.first + ' ' + r.client.last)}
                        <CloseoutStatus status={r.status} />
                      </div>
                      <p><strong>{r.reason}</strong>{r.note ? ': ' + r.note : ''}</p>
                      <p className="asc-hint">Asked by {r.byName}, {whenText(r.at)}{r.lastContact ? ' · Last contact ' + usDate(r.lastContact) : ''}</p>
                      {r.status === 'pending' && (r.openContacts || r.openActions || r.openNeeds.length) ? (
                        <p className="asc-co-open"><Icon name="alert" size={14} />Still open: {[r.openContacts && plural(r.openContacts, 'contact in progress', 'contacts in progress'), r.openActions && plural(r.openActions, 'action item', 'action items'), r.openNeeds.length && plural(r.openNeeds.length, 'need kept open', 'needs kept open')].filter(Boolean).join(', ')}</p>
                      ) : null}
                      {r.status !== 'pending' && r.decidedAt && <p className="asc-hint">{r.status === 'withdrawn' ? 'Withdrawn' : r.status === 'declined' ? 'Declined' : 'Discharged'} by {r.decidedByName}, {usDate(r.decidedAt)}{r.decisionNote ? ': ' + r.decisionNote : ''}</p>}
                    </div>
                    {r.status === 'pending' && (
                      <div className="asc-co-btns">
                        {sup && <button type="button" className="btn-outline is-small" onClick={() => openModal('ascCloseout', { clientId: r.clientId, mode: 'decide', closeoutId: r.id, decision: 'decline' })}>Decline</button>}
                        {sup && <button type="button" className="btn-primary is-small" onClick={() => openModal('ascCloseout', { clientId: r.clientId, mode: 'decide', closeoutId: r.id, decision: 'discharge' })}>Discharge</button>}
                        {!sup && r.by === me && <button type="button" className="btn-text is-small" onClick={() => withdrawCloseout(r.id).catch(() => {})}>Withdraw</button>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="empty">{tab === 'pending' ? 'Nothing waiting.' : 'No decided requests yet.'}</p>}
          </>
        )}</Loaded>
      </section>
    </>
  );
}

// ------------------------------------------------------------------ team and reassignment
export function TeamPage() {
  const { user } = useSession();
  const sup = user.role === SUPERVISOR;
  const { query, team } = useTeamWork(sup);
  const [who, setWho] = usePref('asc.team.who', '');
  if (!sup) return <SupervisorsOnly title="ASC Team" icon="users" sub="team" />;
  const staff = team.staff;
  const current = staff.find((s) => s.id === who) || staff.find((s) => s.contacts.length + s.actions.length) || staff[0];
  return (
    <>
      <Head title="ASC Team" icon="users" sub="team" />
      <section className="panel-card" aria-labelledby="team-h">
        <div className="card-head"><h2 className="card-title" id="team-h">Open work by person</h2></div>
        <p className="asc-hint">Move contacts in progress and open action items to someone else, for example when a coordinator is out. Each move is logged on the contact.</p>
        <Loaded query={query} what="the team’s work">{() => (
          <>
            <FilterCards label="Choose a person" value={current ? current.id : ''} onChange={setWho}
              cards={staff.map((s) => ({ id: s.id, count: s.contacts.length + s.actions.length, label: s.name + (s.role === SUPERVISOR ? ' (supervisor)' : '') }))} />
            {current && <Work key={current.id} person={current} staff={staff} />}
          </>
        )}</Loaded>
      </section>
    </>
  );
}

function Work({ person: s, staff }) {
  const { reassign } = useSupervisorMutations();
  const [picked, setPicked] = useState({});
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const all = s.contacts.map((k) => 'c:' + k.id).concat(s.actions.map((a) => 'a:' + a.id));
  const n = all.filter((id) => picked[id]).length;
  const toggle = (id) => setPicked({ ...picked, [id]: !picked[id] });
  const every = n === all.length && n > 0;
  const go = () => {
    const ids = all.filter((id) => picked[id]);
    setBusy(true);
    reassign({ to, contactIds: ids.filter((x) => x[0] === 'c').map((x) => x.slice(2)), actionIds: ids.filter((x) => x[0] === 'a').map((x) => x.slice(2)) })
      .then(() => { setPicked({}); setBusy(false); }, () => setBusy(false));
  };
  if (!all.length) return <p className="empty">{s.name} has no contacts in progress and no open ASC action items.</p>;
  return (
    <div className="asc-team-work">
      <div className="toolbar asc-reassign" role="group" aria-label="Reassign">
        <label className="check-row"><input type="checkbox" checked={every} onChange={() => setPicked(every ? {} : Object.fromEntries(all.map((id) => [id, true])))} />Select all ({all.length})</label>
        <SelectBox id="asc-reassign-to" label="Reassign to" placeholder="Reassign to…" value={to} onChange={setTo} options={staff.filter((x) => x.id !== s.id).map((x) => [x.id, x.name])} />
        <button type="button" className="btn-primary is-small" disabled={!n || !to || busy} onClick={go}>Reassign {n ? plural(n, 'item', 'items') : ''}</button>
      </div>
      {s.contacts.length > 0 && <h3 className="subtitle">Contacts in progress ({s.contacts.length})</h3>}
      {s.contacts.length > 0 && (
        <ul className="asc-pick-list">
          {s.contacts.map((k) => (
            <li key={k.id}>
              <input type="checkbox" id={'rc-' + k.id} checked={!!picked['c:' + k.id]} onChange={() => toggle('c:' + k.id)} />
              <label htmlFor={'rc-' + k.id}><span className="mono">{k.ref}</span> · {k.clientName || personLabel(k)}<small>Started {whenText(k.startedAt)}{k.needs.length ? ' · ' + k.needs.map((x) => x.name).join(', ') : ''}</small></label>
              <Link className="link-btn is-small" to={{ page: 'contact', id: k.id, step: 'intake' }}>Open</Link>
            </li>
          ))}
        </ul>
      )}
      {s.actions.length > 0 && <h3 className="subtitle">Open action items ({s.actions.length})</h3>}
      {s.actions.length > 0 && (
        <ul className="asc-pick-list">
          {s.actions.map((a) => {
            const late = isOverdue({ due: a.due, done: false });
            return (
              <li key={a.id}>
                <input type="checkbox" id={'ra-' + a.id} checked={!!picked['a:' + a.id]} onChange={() => toggle('a:' + a.id)} />
                <label htmlFor={'ra-' + a.id}>{a.text}<small className={late ? 'is-late' : ''}>{a.due ? (late ? 'Overdue, was due ' : 'Due ') + usDate(a.due) : 'No due date'} · {a.where}</small></label>
                {a.clientId ? <Link className="link-btn is-small" to={{ page: 'client', id: a.clientId, sub: 'tab', tab: 'asc' }}>Open</Link>
                  : <Link className="link-btn is-small" to={{ page: 'contact', id: a.contactId, step: 'wrap-up' }}>Open</Link>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ state reporting
const R_SPEC = { grid: '84px 118px minmax(120px,1.2fr) 70px 44px 76px minmax(150px,1.6fr)', min: 734 };
const CSV_COLS = [['MCI ID', 'mci'], ['Client', 'clientName'], ['Service date', 'date'], ['Procedure code', 'code'], ['Units', 'units'], ['Place of service', 'place'], ['Coordinator', 'coordinator'], ['Event ID', 'ref']];
const csvCell = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

function downloadCsv(report) {
  const lines = [CSV_COLS.map((c) => c[0]).join(',')].concat(report.rows.map((r) => CSV_COLS.map((c) => csvCell(r[c[1]])).join(',')));
  const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'asc-state-report-' + report.period + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportingPage() {
  const { user } = useSession();
  const sup = user.role === SUPERVISOR;
  const periods = reportPeriods(new Date(), 6);
  const [period, setPeriod] = usePref('asc.report.period', periods[1]);
  const { query, report } = useStateReport(period, sup);
  const [show, setShow] = usePref('asc.report.show', 'all');
  const { submitStateReport } = useSupervisorMutations();
  const [busy, setBusy] = useState(false);
  const rows = report ? (show === 'problems' ? report.rows.filter((r) => r.problems.length) : report.rows) : [];
  const p = usePaged('asc.report', rows, [25, 50, 100]);
  if (!sup) return <SupervisorsOnly title="ASC State Reporting" icon="chart" sub="reporting" />;
  const submit = () => { setBusy(true); submitStateReport(period).then(() => setBusy(false), () => setBusy(false)); };
  return (
    <>
      <Head title="ASC State Reporting" icon="chart" sub="reporting" />
      <section className="panel-card" aria-labelledby="rep-h">
        <div className="card-head">
          <h2 className="card-title" id="rep-h">Monthly ASC services</h2>
          <div className="asc-rep-period">
            <label className="field-label" htmlFor="asc-period">Month</label>
            <select className="select" id="asc-period" value={period} onChange={(e) => { setPeriod(e.target.value); setShow('all'); p.reset(); }}>
              {periods.map((x, n) => <option key={x} value={x}>{periodLabel(x)}{n === 0 ? ' (so far)' : ''}</option>)}
            </select>
          </div>
        </div>
        <p className="asc-hint">Every interaction on a closed contact with a client verified in MCI, one line per service. Check the problems, fix them on the contact, then download the file and mark it submitted.</p>
        <Loaded query={query} what="the report">{() => {
          const t = report.totals, ns = report.notSent, sub = report.submission;
          const notSent = [ns.open && plural(ns.open, 'contact in progress', 'contacts in progress'), ns.anonymous && plural(ns.anonymous, 'anonymous contact', 'anonymous contacts'), ns.unverified && plural(ns.unverified, 'name-only contact', 'name-only contacts')].filter(Boolean);
          const blocked = !report.rows.length ? 'Nothing to send for this month.' : t.problems ? 'Fix ' + plural(t.problems, 'line', 'lines') + ' with problems first.' : '';
          return (
            <>
              {sub && (sub.changedSince.length
                ? <p className="notice is-warn"><Icon name="alert" size={18} /><span><strong>Changed since it was submitted</strong> on {usDate(sub.at)}: {sub.changedSince.join(', ')} {sub.changedSince.length === 1 ? 'was' : 'were'} corrected. Send a corrected file and mark it submitted again.</span></p>
                : <p className="notice is-good"><Icon name="check" size={18} /><span><strong>Submitted</strong> {whenText(sub.at)} by {sub.byName}{sub.version > 1 ? ' (version ' + sub.version + ')' : ''}: {plural(sub.rows, 'line', 'lines')}, {plural(sub.units, 'unit', 'units')}.</span></p>)}
              <dl className="asc-rep-stats">
                <div><dt>Contacts</dt><dd>{t.contacts}</dd></div>
                <div><dt>Clients</dt><dd>{t.clients}</dd></div>
                <div><dt>Service lines</dt><dd>{t.rows}</dd></div>
                <div><dt>Units (15 min)</dt><dd>{t.units}</dd></div>
                <div className={t.problems ? 'is-warn' : ''}><dt>Lines with problems</dt><dd>{t.problems}</dd></div>
              </dl>
              {notSent.length > 0 && <p className="asc-hint is-icon"><Icon name="info" size={14} />Not reported: {notSent.join(', ')}. Only closed contacts with a verified client go to the state.</p>}
              <div className="toolbar asc-rep-bar">
                <Segmented small label="Show lines" value={show} onChange={(v) => { setShow(v); p.reset(); }}
                  options={[{ id: 'all', label: 'All lines (' + t.rows + ')' }, { id: 'problems', label: 'Problems (' + t.problems + ')', icon: t.problems ? 'alert' : undefined }]} />
                <div className="asc-rep-actions">
                  <button type="button" className="btn-outline is-small" disabled={!report.rows.length} onClick={() => downloadCsv(report)}><Icon name="download" size={16} />Download CSV</button>
                  <button type="button" className="btn-primary is-small" disabled={!!blocked || busy || (sub && !sub.changedSince.length)} aria-describedby="rep-why" onClick={submit}>{sub ? 'Mark Resubmitted' : 'Mark as Submitted'}</button>
                </div>
              </div>
              <p className="asc-hint" id="rep-why">{blocked || (sub && !sub.changedSince.length ? 'Already submitted. Nothing has changed since.' : 'This records that you sent the file to the state. It doesn’t send anything itself.')}</p>
              <Table label={'State report lines, ' + periodLabel(period)} spec={R_SPEC} empty={show === 'problems' ? 'No problems. Every line is ready.' : 'No ASC services to report for this month.'}
                head={['Date', 'Event ID', 'Client', 'Code', 'Units', 'Place', 'Problems'].map((h) => <div key={h} className="th" role="columnheader">{h}</div>)}>
                {p.items.map((r) => (
                  <div className={'tr is-row is-ruled' + (r.problems.length ? ' is-flagged' : '')} role="row" key={r.id}>
                    <div className="td" role="cell">{r.date}</div>
                    <div className="td" role="cell"><Link className="link-btn mono" to={{ page: 'contact', id: r.contactId, step: 'wrap-up' }}>{r.ref}</Link><small>{r.coordinator}</small></div>
                    <div className="td" role="cell">{clientLink(r.clientId, r.clientName)}<small className="mono">MCI {r.mci}</small></div>
                    <div className="td mono" role="cell">{r.code || '—'}</div>
                    <div className="td" role="cell">{r.units}</div>
                    <div className="td" role="cell">{r.place || '—'}</div>
                    <div className="td" role="cell">{r.problems.length ? <ul className="asc-rep-problems">{r.problems.map((x) => <li key={x}><Icon name="alert" size={13} />{x}</li>)}</ul> : <span className="asc-rep-ok"><Icon name="check" size={13} />Ready</span>}</div>
                  </div>
                ))}
              </Table>
              <Pager p={p} />
            </>
          );
        }}</Loaded>
      </section>
    </>
  );
}
