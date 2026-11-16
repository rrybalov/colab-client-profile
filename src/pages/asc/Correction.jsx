// Correcting a closed contact. Its answers are locked once closed; an ASC supervisor can open a correction with a
// reason, edit any step (changes save as they go), then save, which records who changed what and why.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useSession } from '../../state/data.js';
import { useAscMutations } from '../../state/asc.js';
import { navigate } from '../../router.jsx';
import { SUPERVISOR } from '../../data/asc.js';

export function EditClosed({ k, compact }) {
  const { user } = useSession();
  const { startCorrection } = useAscMutations();
  const [reason, setReason] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  if (user.role !== SUPERVISOR) return compact ? null : <span>Only a supervisor can change it.</span>;
  if (reason === null) return <button type="button" className="btn-outline is-small" id={'edit-closed-' + (compact ? 'c' : 'n')} onClick={() => setReason('')}><Icon name="pen" size={14} />Edit Closed Contact</button>;
  const submit = (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError(true); document.getElementById('corr-reason').focus(); return; }
    setBusy(true);
    startCorrection(k, reason.trim()).then(() => setBusy(false), () => setBusy(false));
  };
  return (
    <form className="asc-correct-form" onSubmit={submit} noValidate>
      <label className="field-label" htmlFor="corr-reason">Reason for the correction</label>
      <input className="input is-block" id="corr-reason" autoFocus value={reason} aria-invalid={error} aria-describedby={error ? 'corr-err' : undefined} onChange={(e) => { setReason(e.target.value); setError(false); }} placeholder="For example: wrong minutes on interaction 2" />
      {error && <span className="field-error" id="corr-err" role="alert">Give a reason. It's saved with the correction.</span>}
      <div className="asc-inline-row is-end"><button type="button" className="btn-text" onClick={() => { setReason(null); setError(false); }}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>Start Editing</button></div>
    </form>
  );
}

export function CorrectionBar({ k, flush }) {
  const { staffName } = useSession();
  const { finishCorrection } = useAscMutations();
  const [busy, setBusy] = useState(false);
  const save = () => { setBusy(true); flush().then(() => finishCorrection(k)).then(() => { setBusy(false); navigate({ page: 'contact', id: k.id, step: 'wrap-up' }); }, () => setBusy(false)); };
  return (
    <div className="notice is-warn asc-correcting" role="region" aria-label="Correction in progress">
      <Icon name="pen" size={18} />
      <span><strong>Correcting a closed contact.</strong> {staffName(k.correction.by)}: “{k.correction.reason}”. Changes save as you go.</span>
      <button type="button" className="btn-primary is-small" onClick={save} disabled={busy}>Save Corrections</button>
    </div>
  );
}
