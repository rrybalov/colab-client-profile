// Previous interactions: what a coordinator sees when someone comes back and a different person picks up.
// Open items first, then every past contact with who handled it, what was given and what happened.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Modal, Loaded, Table, Field } from '../../ui/controls.jsx';
import { usePref, useData } from '../../state/store.jsx';
import { useMutations } from '../../state/data.js';
import { useModalControls } from '../../state/modal.js';
import { useContactHistory, useContact, useAscMutations } from '../../state/asc.js';
import { navigate } from '../../router.jsx';
import { newNeed } from './Intake.jsx';
import { URGENT_DESTINATIONS, URGENT_HOWS, CRISIS, OPEN, usDate, clockTime, shown } from '../../data/asc.js';
import { channelIcon, channelLabel, Badge } from './parts.jsx';
import { ContactRecord } from './Record.jsx';

const IX_SPEC = { grid: 'minmax(160px,2fr) minmax(120px,1.4fr) minmax(110px,1fr) 64px minmax(90px,1fr)', min: 620 };
const KIND = { 'Open need': 'is-need', 'Action item': 'is-action' };

function ContactEvent({ c, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [full, setFull] = useState(false);
  const panel = 'hist-' + c.id;
  return (
    <li className="event asc-event">
      <span className="event-dot" aria-hidden="true" />
      <div className="event-card">
        <button type="button" className="event-toggle" aria-expanded={open} aria-controls={open ? panel : undefined} onClick={() => setOpen(!open)}>
          <span className="event-body">
            <span className="event-title">{usDate(c.startedAt)} · <span className="mono">{c.ref}</span></span>
            <span className="event-meta">
              <span><Icon name={channelIcon(c.channel)} size={14} />{channelLabel(c.channel)}{c.minutes ? ', ' + c.minutes + ' min' : ''}</span>
              <span><Icon name="user" size={14} />{c.staffName}</span>
              <span className="event-tag">{c.clientName ? 'On ' + c.clientName + '’s record' : 'Anonymous' + (c.anonName ? ': “' + c.anonName + '”' : '')}{c.possible ? ' · possible match' : ''}</span>
            </span>
            <span className="asc-event-needs">{c.needs.map((n) => <span key={n.name}><Badge urg={n.urg} /> {n.name}: <strong>{n.outcome || 'no outcome'}</strong></span>)}</span>
          </span>
          <Icon name="chevronDown" size={18} className={'chev' + (open ? ' is-open' : '')} />
        </button>
        {open && (
          <div className="event-details asc-event-details" id={panel}>
            <div className="asc-span">
              <h4 className="field-label">Service interactions</h4>
              <Table label={'Service interactions on ' + c.ref} spec={IX_SPEC} empty="None documented."
                head={['Resource or hand-off', 'Type', 'How', 'Time', 'Place'].map((h) => <div className="th" role="columnheader" key={h}>{h}</div>)}>
                {c.interactions.map((x) => (
                  <div className="tr is-row is-ruled" role="row" key={x.id}>
                    <div className="td" role="cell">{shown(x.what)}</div><div className="td" role="cell">{shown(x.type)}</div>
                    <div className="td" role="cell">{shown(x.how)}</div><div className="td" role="cell">{x.min} min</div><div className="td" role="cell">{shown(x.place)}</div>
                  </div>
                ))}
              </Table>
            </div>
            {c.notes.length > 0 && <div className="asc-span"><h4 className="field-label">Case note · {c.staffName}</h4>{c.notes.map((n) => <p key={n}>{n}</p>)}</div>}
            {c.record && (
              <div className="asc-span">
                <button type="button" className="btn-text is-icon asc-record-toggle" aria-expanded={full} aria-controls={full ? 'rec-' + c.id : undefined} onClick={() => setFull(!full)}>
                  <Icon name="chevronDown" size={16} className={'chev' + (full ? ' is-open' : '')} />{full ? 'Hide Full Record' : 'Show Full Record'}
                </button>
                {full && <div id={'rec-' + c.id}><ContactRecord r={c.record} /></div>}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

// One open item, with what can be done about it right here.
function OpenItem({ o, current, onAddNeed }) {
  const { actions } = useData();
  const { toggleAction } = useMutations();
  const { closeModal } = useModalControls();
  const [done, setDone] = useState(false);
  const go = (to) => { closeModal(); navigate(to); };
  const fromContact = o.contactId && current && o.contactId === current.id;
  let act = null;
  if (o.kind === 'Open need') {
    const here = current && current.needs.some((n) => n.name === o.need);
    act = current && current.status === 'open'
      ? (here ? <span className="asc-open-done"><Icon name="checkSmall" size={14} />On this contact</span>
        : <button type="button" className="btn-outline is-small" onClick={() => onAddNeed(o)}><Icon name="plus" size={14} />Add to This Contact</button>)
      : <button type="button" className="btn-text is-small" onClick={() => go({ page: 'contact', id: o.contactId, step: 'wrap-up' })}>View {o.ref}</button>;
  } else if (o.clientId) {
    const a = actions[o.actionId];
    act = (
      <span className="asc-open-acts">
        {a && <button type="button" className="btn-outline is-small" disabled={done || a.done} onClick={() => toggleAction({ ...a, done: false }).then(() => setDone(true), () => {})}><Icon name="checkSmall" size={14} />{done || a.done ? 'Done' : 'Mark Done'}</button>}
        <button type="button" className="btn-text is-small" onClick={() => go({ page: 'client', id: o.clientId, sub: 'actions' })}>View All</button>
      </span>
    );
  } else if (o.contactId && !fromContact) {
    act = <button type="button" className="btn-text is-small" onClick={() => go({ page: 'contact', id: o.contactId, step: 'wrap-up' })}>View {o.ref}</button>;
  }
  return (
    <li className={done ? 'is-done' : ''}>
      <span className={'asc-kind ' + (KIND[o.kind] || '')}>{o.kind}</span>
      <div><strong>{o.text}</strong><span>{o.meta}</span></div>
      {act && <div className="asc-open-act">{act}</div>}
    </li>
  );
}

export function HistoryList({ q, empty, current, onAddNeed }) {
  const { query, history } = useContactHistory(q);
  return (
    <Loaded query={query} what="previous interactions">{() => (
      <div className="asc-history">
        <section className="asc-open" aria-labelledby="h-still-open">
          <h3 className="section-label" id="h-still-open"><Icon name="alert" size={18} />Still open from earlier contacts</h3>
          {history.openItems.length ? (
            <ul>{history.openItems.map((o, i) => <OpenItem key={(o.actionId || o.need) + i} o={o} current={current} onAddNeed={onAddNeed} />)}</ul>
          ) : <p className="asc-hint">Nothing open.</p>}
        </section>
        <section aria-labelledby="h-past">
          <h3 className="section-label" id="h-past"><Icon name="history" size={18} />Contact history {history.contacts.length > 0 && <span className="asc-count">({history.contacts.length})</span>}</h3>
          {history.contacts.length ? (
            <ol className="timeline asc-timeline">{history.contacts.map((c, i) => <ContactEvent key={c.id} c={c} defaultOpen={i === 0} />)}</ol>
          ) : <p className="asc-empty">{empty || 'No earlier contacts.'}</p>}
        </section>
      </div>
    )}</Loaded>
  );
}

export function HistoryModal({ contactId, clientId, onClose }) {
  const { contact: k } = useContact(contactId || null);
  const { updateContact } = useAscMutations();
  // An open need from an earlier contact, carried onto this one.
  const addNeed = (o) => updateContact(k, { needs: k.needs.concat([newNeed(o.need, o.urg || 'Routine')]) }).catch(() => {});
  const who = k ? (k.client ? k.client.first + ' ' + k.client.last : k.priorRefs.length ? 'Tied by reference number: ' + k.priorRefs.join(', ') : 'Anonymous') : '';
  return (
    <Modal id="asc-history" title="History" icon="history" intro={who} onClose={onClose}>
      <HistoryList q={contactId ? { contactId } : { clientId }} current={k} onAddNeed={addNeed} empty={k && !k.clientId && !k.priorRefs.length ? 'No earlier contacts tied to this one yet.' : undefined} />
      <div className="modal-foot is-end"><button type="button" className="btn-primary" onClick={onClose}>Done</button></div>
    </Modal>
  );
}

export function UrgentModal({ contactId, need, onClose }) {
  const { contact: k } = useContact(contactId);
  const { closeContact } = useAscMutations();
  const [dest, setDest] = usePref('urgent.dest.' + contactId, 'resolve');
  const [how, setHow] = useState(URGENT_HOWS[0]);
  const [which, setWhich] = useState(need || (k && k.needs.length ? k.needs[0].name : ''));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!k) return null;
  const d = URGENT_DESTINATIONS.find((x) => x.id === dest) || URGENT_DESTINATIONS[2];
  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    closeContact(k, { urgent: { dest: d.label, how, need: which || 'Safety', note } }).then(() => { onClose(); navigate({ page: 'contact', id: k.id, step: 'wrap-up' }); }, () => setBusy(false));
  };
  const others = k.needs.filter((n) => n.name !== which).map((n) => n.name);
  return (
    <Modal id="asc-urgent" title="Urgent Routing" icon="alert" intro="Transfer first. Log it after." onClose={onClose}>
      <form className="view" style={{ gap: 18 }} onSubmit={submit} noValidate>
        <fieldset className="asc-fieldset">
          <legend className="section-label">Where are they going?</legend>
          <div className="asc-dest">
            {URGENT_DESTINATIONS.map((x) => (
              <button key={x.id} type="button" className="asc-dest-card" aria-pressed={dest === x.id} onClick={() => setDest(x.id)} data-autofocus={dest === x.id ? '' : undefined}>
                <strong>{dest === x.id && <Icon name="check" size={18} />}{x.label}</strong><span>{shown(x.text)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="form-grid is-2">
          <div className="field"><label htmlFor="u-how">How</label><select className="select" id="u-how" value={how} onChange={(e) => setHow(e.target.value)}>{URGENT_HOWS.map((h) => <option key={h}>{h}</option>)}</select></div>
          <div className="field"><label htmlFor="u-need">Which need</label><select className="select" id="u-need" value={which} onChange={(e) => setWhich(e.target.value)}>{k.needs.length ? k.needs.map((n) => <option key={n.id}>{n.name}</option>) : <option value="">Safety (no need recorded yet)</option>}</select></div>
          <Field id="u-note" label="What happened (optional)" value={note} onChange={setNote} textarea wide />
        </div>
        <dl className="pairs is-small asc-urgent-record">
          <dt>This need</dt><dd>Closes as <strong>{CRISIS}</strong>: {d.label}, {clockTime(new Date().toISOString())}</dd>
          <dt>Other needs</dt><dd>{others.length ? others.join(', ') + ': ' + OPEN.toLowerCase() : 'None'}</dd>
          <dt>The contact</dt><dd>{k.clientId ? 'Saved on ' + k.client.first + '’s record.' : 'Saved, still anonymous. It can be linked if they identify later.'}</dd>
        </dl>
        <div className="modal-foot">
          <button type="button" className="btn-text" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary is-danger" disabled={busy}>Close as Transfer</button>
        </div>
      </form>
    </Modal>
  );
}

