// Ending someone's ASC enrollment. A coordinator asks for a close-out and it waits for a supervisor; a supervisor
// discharges, either from that request or directly from the client's ASC tab. One dialog does all three.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Modal, Field } from '../../ui/controls.jsx';
import { useClient, useSession } from '../../state/data.js';
import { useCloseouts, useContacts, useContactHistory, useSupervisorMutations } from '../../state/asc.js';
import { DISCHARGE_REASONS, usDate, plural } from '../../data/asc.js';

export const CLOSEOUT_STATUS = {
  pending: ['is-ending', 'Waiting for a supervisor'], discharged: ['is-inactive', 'Discharged'],
  declined: ['is-presumed', 'Declined'], withdrawn: ['is-presumed', 'Withdrawn']
};
export function CloseoutStatus({ status }) {
  const [cls, label] = CLOSEOUT_STATUS[status] || CLOSEOUT_STATUS.pending;
  return <span className={'status ' + cls}>{label}</span>;
}

// What's still open for this client, so nobody closes out someone with work left undone without seeing it.
function StillOpen({ clientId, first }) {
  const { contacts } = useContacts({ clientId });
  const { history } = useContactHistory({ clientId });
  const inProgress = contacts.filter((k) => k.status === 'open').length;
  const items = history.openItems || [];
  const lines = [];
  if (inProgress) lines.push(['alert', plural(inProgress, 'contact is', 'contacts are') + ' still in progress. Close ' + (inProgress === 1 ? 'it' : 'them') + ' first.', true]);
  items.slice(0, 4).forEach((x) => lines.push([x.kind === 'Open need' ? 'layers' : 'inbox', (x.kind === 'Open need' ? 'Need kept open: ' : 'Action item: ') + x.text]));
  if (items.length > 4) lines.push(['inbox', 'and ' + (items.length - 4) + ' more']);
  return (
    <div className="asc-closeout-open">
      <p className="section-label">Still open for {first}</p>
      {lines.length ? <ul className="asc-closeout-list">{lines.map(([icon, t, warn], n) => <li key={n} className={warn ? 'is-warn' : ''}><Icon name={icon} size={15} />{t}</li>)}</ul>
        : <p className="asc-hint">Nothing. Every need has an outcome and every action item is done.</p>}
      {items.length > 0 && !inProgress && <p className="asc-hint">Discharging removes scheduled 7-day and 90-day follow-ups. Other action items stay on {first}'s record.</p>}
    </div>
  );
}

// mode: 'request' (coordinator asks), 'discharge' (supervisor, directly), 'decide' (supervisor, from a request).
export function CloseoutModal({ clientId, mode = 'request', closeoutId, decision: initial, onClose }) {
  const { query, client: c } = useClient(clientId);
  const { closeouts } = useCloseouts();
  const { contacts } = useContacts({ clientId });
  const { requestCloseout, dischargeClient, decideCloseout } = useSupervisorMutations();
  const { staffName } = useSession();
  const req = closeoutId ? closeouts.find((r) => r.id === closeoutId) : null;
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState(initial || 'discharge');
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  if (!c || (mode === 'decide' && !req)) return query.status === 'error' ? null : <Modal id="asc-closeout" title="Close Out" icon="door" onClose={onClose}><p className="asc-hint">Loading…</p></Modal>;
  const blocked = mode !== 'request' && decision === 'discharge' && contacts.some((k) => k.status === 'open');
  const needReason = mode !== 'decide' && !reason;
  const needNote = mode === 'decide' && decision === 'decline' && !note.trim();
  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (needReason || needNote || blocked) return;
    setBusy(true);
    const done = mode === 'request' ? requestCloseout(c.id, { reason, note })
      : mode === 'discharge' ? dischargeClient(c.id, { reason, note })
        : decideCloseout(req.id, { decision, note });
    done.then(() => onClose(), () => setBusy(false));
  };
  const title = mode === 'request' ? 'Request a Close-Out' : mode === 'discharge' ? 'Discharge from ASC' : 'Review Close-Out';
  const intro = mode === 'request' ? 'A supervisor reviews it and discharges ' + c.first + ' from ASC. Nothing changes until then.'
    : mode === 'discharge' ? 'Ends ' + c.first + '’s ASC enrollment today. If they come back, a new contact re-enrolls them.'
      : 'Requested by ' + req.byName + ' on ' + usDate(req.at) + '.';
  const submitLabel = mode === 'request' ? 'Send to Supervisor' : decision === 'decline' ? 'Decline Request' : 'Discharge from ASC';
  return (
    <Modal id="asc-closeout" title={title} icon="door" intro={intro} onClose={onClose}>
      <form className="view" style={{ gap: 18 }} onSubmit={submit} noValidate>
        <p className="asc-closeout-who"><Icon name="user" size={16} /><strong>{c.first} {c.last}</strong><span>MCI {c.mci}</span></p>
        {mode === 'decide' && (
          <dl className="pairs is-small asc-closeout-req">
            <dt>Reason</dt><dd>{req.reason}</dd>
            <dt>Note</dt><dd>{req.note || '—'}</dd>
            <dt>Last contact</dt><dd>{req.lastContact ? usDate(req.lastContact) : '—'}</dd>
          </dl>
        )}
        <StillOpen clientId={c.id} first={c.first} />
        {mode === 'decide' && (
          <fieldset className="asc-fieldset">
            <legend className="section-label">Decision</legend>
            <div className="opts">
              <button type="button" className="opt" data-autofocus={decision === 'discharge' ? '' : undefined} aria-pressed={decision === 'discharge'} onClick={() => setDecision('discharge')}>Discharge</button>
              <button type="button" className="opt" data-autofocus={decision === 'decline' ? '' : undefined} aria-pressed={decision === 'decline'} onClick={() => setDecision('decline')}>Decline, keep enrolled</button>
            </div>
          </fieldset>
        )}
        {mode !== 'decide' && (
          <div className="field">
            <div className="field-top"><span className="field-name"><label htmlFor="co-reason">Reason</label></span><span className="req">Required</span></div>
            <select className="select" id="co-reason" data-autofocus="" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={tried && needReason ? 'true' : undefined} aria-describedby={tried && needReason ? 'co-reason-err' : undefined}>
              <option value="">Choose a reason</option>
              {DISCHARGE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            {tried && needReason && <p className="field-error" id="co-reason-err">Choose a reason.</p>}
          </div>
        )}
        <Field id="co-note" textarea required={mode === 'decide' && decision === 'decline'}
          label={mode === 'decide' ? (decision === 'decline' ? 'Why, so ' + staffName(req.by).split(' ')[0] + ' knows what to do next' : 'Note for the record (optional)') : 'Note (optional)'}
          value={note} onChange={setNote} aria-invalid={tried && needNote ? 'true' : undefined} />
        {tried && needNote && <p className="field-error">Say why you're declining.</p>}
        {blocked && <p className="notice is-warn"><Icon name="alert" size={18} /><span>Close the contact in progress before discharging.</span></p>}
        <div className="modal-foot">
          <button type="button" className="btn-text" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn-primary' + (submitLabel === 'Discharge from ASC' ? ' is-danger' : '')} disabled={busy}>{submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}
