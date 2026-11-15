// One ASC contact (a call or an in-person visit), in the same frame as the client profile: top bar, left rail,
// the steps as tabs, and the case notes and action items panel on the right.
import React, { useEffect, useState } from 'react';
import { Icon, BrandMark } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useSession } from '../../state/data.js';
import { useContact, useContactEditor } from '../../state/asc.js';
import { useModalControls } from '../../state/modal.js';
import { Link } from '../../router.jsx';
import { Loading, LoadError } from '../../ui/controls.jsx';
import { STEPS, stepState, clockTime, minutesBetween, usDate } from '../../data/asc.js';
import { Panel } from '../client/Panel.jsx';
import { channelIcon, channelLabel, initials } from './parts.jsx';
import { IntakeStep } from './Intake.jsx';
import { IdentifyStep } from './Identify.jsx';
import { InteractionsStep } from './Interactions.jsx';
import { WrapUpStep } from './WrapUp.jsx';
import { ContactPanel } from './ContactPanel.jsx';

const pad = (n) => String(n).padStart(2, '0');
function useElapsed(k) {
  const [now, setNow] = useState(() => Date.now());
  const live = k && k.status === 'open';
  useEffect(() => { if (!live) return undefined; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [live]);
  if (!k) return '';
  const end = k.endedAt ? new Date(k.endedAt).getTime() : now;
  const s = Math.max(0, Math.floor((end - new Date(k.startedAt).getTime()) / 1000));
  return Math.floor(s / 60) + ':' + pad(s % 60);
}

const stepHref = (id, step) => ({ page: 'contact', id, step });
export const contactStep = stepHref;

function LiveChip({ k }) {
  const elapsed = useElapsed(k);
  const open = k.status === 'open';
  const what = k.channel === 'person' ? (open ? 'In person' : 'Visit ended') : (open ? 'On call' : 'Call ended');
  return (
    <div className={'asc-live' + (open ? ' is-live' : '')}>
      <Icon name={channelIcon(k.channel)} size={18} />
      <div>
        <strong>{what}{open && <span className="asc-dot" aria-hidden="true" />}</strong>
        {/* The running clock is shown, not announced, so screen readers aren't interrupted every second. */}
        <span aria-hidden="true">{open ? elapsed : minutesBetween(k.startedAt, k.endedAt) + ' min'}{k.site ? ' · ' + k.site : ''}</span>
        <span className="sr-only">{open ? 'Started ' + clockTime(k.startedAt) : 'Lasted ' + minutesBetween(k.startedAt, k.endedAt) + ' minutes'}</span>
      </div>
    </div>
  );
}

// Shown all the time; only a failure is announced, so screen readers aren't told "Saving" on every keystroke.
function SaveState({ status, retry }) {
  const bad = status === 'error' || status === 'refused';
  const text = { saved: 'All changes saved', saving: 'Saving…', editing: 'Saving…', error: 'Not saved yet. Your changes are still here.', refused: 'That change wasn’t saved.' }[status];
  return (
    <>
      <span className={'asc-save' + (bad ? ' is-error' : '')} aria-hidden={!bad}><Icon name={bad ? 'alert' : 'check'} size={14} />{text}
        {status === 'error' && <button type="button" className="link-btn is-small" onClick={retry}>Try Again</button>}</span>
      <span className="sr-only" role="alert">{status === 'error' ? 'Your last change was not saved. It is still on screen; choose Try Again.' : ''}</span>
    </>
  );
}

function ContactHead({ k, status, retry }) {
  const { staffName } = useSession();
  const c = k.client;
  const title = c ? c.first + ' ' + c.last : k.identity === 'unverified' ? k.unverifiedName || 'Unverified client' : k.path === 'anon' ? 'Anonymous contact' + (k.anon.name ? ': ' + k.anon.name : '') : 'New contact';
  const idTag = c ? (k.identity === 'new' ? 'NEW IN MCI' : 'MATCHED IN MCI') : k.identity === 'unverified' ? 'UNVERIFIED' : 'ANONYMOUS';
  return (
    <section className="client-head" aria-label="Contact">
      <div className="client-id">
        <div className="avatar">{c ? <span className="asc-initials">{initials(c)}</span> : <Icon name={channelIcon(k.channel)} size={24} />}</div>
        <div>
          <div className="client-name"><h1>{title}</h1></div>
          <div className="tags">
            <span className="tag">ASC</span>
            <span className="tag is-quiet">{channelLabel(k.channel).toUpperCase()}</span>
            <span className={'tag' + (c ? ' is-good' : ' is-quiet')}>{idTag}</span>
            {k.onsite.idCheck && k.onsite.idCheck !== 'None shown' && <span className="tag is-good">ID CHECKED</span>}
          </div>
        </div>
      </div>
      <dl className="ids">
        <div><dt>Event ID</dt><dd>{k.ref}</dd></div>
        <div><dt>{k.channel === 'person' ? 'Visit ID' : 'Call Log ID'}</dt><dd>{k.logId}</dd></div>
        <div><dt>Started</dt><dd>{usDate(k.startedAt)}, {clockTime(k.startedAt)}</dd></div>
        <div><dt>Coordinator</dt><dd>{staffName(k.staff)}</dd></div>
        {c && <div><dt>MCI ID</dt><dd>{c.mci}</dd></div>}
        <div className="asc-save-cell"><SaveState status={status} retry={retry} /></div>
      </dl>
    </section>
  );
}

const VIEWS = { intake: IntakeStep, identify: IdentifyStep, interactions: InteractionsStep, 'wrap-up': WrapUpStep };

export function ContactPage({ route }) {
  const { query, contact } = useContact(route.id);
  const editor = useContactEditor(contact);
  const { openModal } = useModalControls();
  const { user } = useSession();
  const [panelOpen, setPanelOpen] = usePref('panel.asc', true);
  const k = editor.view;

  let body;
  if (!k) {
    const missing = query.status === 'error' && query.error && query.error.status === 404;
    body = missing
      ? <div className="empty-box" style={{ marginTop: 24 }}><h1 className="title" style={{ fontSize: 18 }}>Contact not found</h1><p>This contact isn't in the records you can see. The link may be wrong.</p><Link className="btn-outline" to="#asc"><Icon name="headset" />Back to ASC Contacts</Link></div>
      : query.status === 'error' ? <LoadError error={query.error} retry={query.retry} what="this contact" /> : <Loading label="Loading contact" block />;
  } else {
    const done = stepState(k);
    const View = VIEWS[route.step] || IntakeStep;
    const idx = STEPS.findIndex((s) => s[0] === route.step);
    body = (
      <>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link className="crumb-link crumb" to="#home"><Icon name="home" size={15} />Home</Link><Icon name="chevronRight" size={14} />
          <Link className="crumb-link crumb" to="#asc"><Icon name="headset" size={15} />ASC Contacts</Link><Icon name="chevronRight" size={14} />
          <span className="crumb" aria-current="page">{k.ref}</span>
        </nav>
        <ContactHead k={k} status={editor.status} retry={editor.flush} />
        <section className="card">
          <div className="tabs-wrap">
            <nav className="tabs asc-tabs" aria-label="Contact steps">
              {STEPS.map(([id, label], i) => (
                <Link key={id} className="tab asc-step" to={stepHref(k.id, id)} focus={false} aria-current={route.step === id ? 'step' : undefined}>
                  <span className={'asc-step-num' + (done[id] ? ' is-done' : '')} aria-hidden="true">{done[id] ? <Icon name="checkSmall" size={13} /> : i + 1}</span>
                  {label}{done[id] && <span className="sr-only"> (done)</span>}
                </Link>
              ))}
            </nav>
          </div>
          {k.status === 'closed' && route.step !== 'wrap-up' ? (
            <>
              <p className="notice asc-locked-note"><Icon name="lock" size={18} /><span><strong>This contact is closed</strong> ({usDate(k.endedAt)}), so its answers can't be changed. Case notes and action items can still be added. [Corrections process TBD]</span></p>
              <fieldset className="asc-locked" disabled><legend className="sr-only">Closed contact, read only</legend>
                <View k={k} edit={editor.edit} flush={editor.flush} openModal={openModal} next={null} />
              </fieldset>
            </>
          ) : <View k={k} edit={editor.edit} flush={editor.flush} openModal={openModal} next={idx < STEPS.length - 1 ? STEPS[idx + 1] : null} />}
        </section>
      </>
    );
  }

  const open = k && k.status === 'open';
  return (
    <div className="app"><div className="shell">
      <header className="topbar">
        <Link className="brand" to="#home"><BrandMark />CoLab</Link>
        {k && <LiveChip k={k} />}
        <nav className="top-actions" aria-label="Contact actions">
          {k && <button type="button" className="btn-ghost" onClick={() => openModal('ascHistory', { contactId: k.id })}><Icon name="history" />Previous Interactions</button>}
          {open && <button type="button" className="btn-ghost is-danger" onClick={() => openModal('ascUrgent', { contactId: k.id })}><Icon name="alert" />Urgent Routing</button>}
          <button type="button" className="btn-ghost" onClick={() => openModal('issue')}><Icon name="bug" />Report Issue</button>
          {k && k.client && <Link className="user-chip asc-chip-link" to={{ page: 'client', id: k.client.id, sub: 'tab', tab: 'asc' }}><Icon name="user" size={20} /><div><strong>{k.client.first} {k.client.last}</strong><span>MCI ID: {k.client.mci}</span></div></Link>}
        </nav>
      </header>
      <div className="body">
        <nav className="rail" aria-label="Main">
          <Link className="rail-btn" to="#home" aria-label="CoLab Home" data-tip="CoLab Home"><Icon name="home" size={20} /></Link>
          <Link className="rail-btn" to="#my-action-items" aria-label="My Action Items" data-tip="My Action Items"><Icon name="inbox" size={20} /></Link>
          <Link className="rail-btn" to="#starred-clients" aria-label="Starred Clients" data-tip="Starred Clients"><Icon name="star" size={20} /></Link>
          <div className="rail-divider" />
          <Link className="rail-btn" to="#asc" aria-label="ASC Contacts" aria-current="page" data-tip="ASC Contacts"><Icon name="headset" size={20} /></Link>
          <div className="rail-avatar" aria-label={'Signed in as ' + user.first + ' ' + user.last}>{user.initials}</div>
        </nav>
        <div className={'work' + (k && !panelOpen ? ' is-panel-closed' : '')}>
          <main className="main" id="main" tabIndex={-1}>{body}</main>
          {k && (k.clientId
            ? <Panel client={{ id: k.clientId }} open={panelOpen} setOpen={setPanelOpen} tag="ASC" />
            : <ContactPanel k={k} edit={editor.edit} open={panelOpen} setOpen={setPanelOpen} />)}
        </div>
      </div>
    </div></div>
  );
}
