// Report Missing Client and Report an Issue. Drafts are saved; a submitted report goes to the data source.
import React, { useState } from 'react';
import { Icon } from '../ui/icons.jsx';
import { usePref } from '../state/store.jsx';
import { useMutations, useSession } from '../state/data.js';
import { Modal, Field, Tip } from '../ui/controls.jsx';

function useSubmit(kind, body, onSent) {
  const { submitReport } = useMutations();
  const [state, setState] = useState({ busy: false, error: '' });
  const submit = (e) => {
    e.preventDefault();
    if (state.busy) return;
    setState({ busy: true, error: '' });
    submitReport({ kind, page: location.hash, ...body }).then(
      () => { setState({ busy: false, error: '' }); onSent(); },
      (err) => setState({ busy: false, error: ((err && err.message) || 'Something went wrong.') + ' Your report was not sent; try again.' })
    );
  };
  return [state, submit];
}

export function MissingModal({ onClose, openModal }) {
  const { user } = useSession();
  const blank = { first: '', last: '', dob: '', dhs: '', ssn: '', other: '', name: user.first + ' ' + user.last, email: user.email };
  const [m, setM] = usePref('missing.form', blank);
  const [sent, setSent] = usePref('missing.sent', null);
  const set = (k) => (v) => setM({ ...m, [k]: v });
  const ready = m.first.trim() && m.last.trim() && m.dob && m.name.trim() && m.email.trim();
  const [state, submit] = useSubmit('missing', m, () => { setSent({ first: m.first, last: m.last, email: m.email }); setM(blank); });
  const back = () => { setSent(null); openModal('search'); };
  const done = () => { setSent(null); onClose(); };
  if (sent) {
    return (
      <Modal id="missing" title="Report Missing Client" narrow focusKey="sent" onClose={done}>
        <div className="success"><Icon name="check" size={40} /><strong>Thanks. We got your request.</strong><span>We'll look for {sent.first} {sent.last} and email you at {sent.email}.</span></div>
        <div className="modal-foot"><button type="button" className="btn-text" onClick={back}>Back to search</button><button type="button" className="btn-primary" onClick={done}>Done</button></div>
      </Modal>
    );
  }
  return (
    <Modal id="missing" title="Report Missing Client" intro="If you can't see a particular client during this Client View pilot, please complete this form." narrow onClose={onClose}>
      <form className="view" style={{ gap: 18 }} noValidate onSubmit={(e) => { if (ready) submit(e); else e.preventDefault(); }}>
        <h3 className="section-label">Who is the client you are trying to access?</h3>
        <div className="form-grid is-2">
          <Field id="m-first" label="First Name" value={m.first} onChange={set('first')} placeholder="Enter first name" required />
          <Field id="m-last" label="Last Name" value={m.last} onChange={set('last')} placeholder="Enter last name" required />
        </div>
        <div className="form-grid is-3">
          <Field id="m-dob" label="Date of Birth" value={m.dob} onChange={set('dob')} type="date" required />
          <Field id="m-dhs" label="MA ID or PA DHS ID" value={m.dhs} onChange={set('dhs')} placeholder="Enter PA DHS ID (10 digits)" inputMode="numeric" tip={<Tip label="About MA ID or PA DHS ID">This is the individual ID provided by PA DHS</Tip>} />
          <Field id="m-ssn" label="Social Security Number (SSN)" value={m.ssn} onChange={set('ssn')} placeholder="Enter last 4 digits of SSN" inputMode="numeric" maxLength={4} tip={<Tip label="About SSN">Unique value across all benefits and services</Tip>} />
          <Field id="m-other" label="Other identifying info" value={m.other} onChange={set('other')} placeholder="Enter any other information that would be helpful for us" textarea wide />
        </div>
        <h3 className="section-label">Your information</h3>
        <div className="form-grid is-2">
          <Field id="m-name" label="Name" value={m.name} onChange={set('name')} required autoComplete="name" />
          <Field id="m-email" label="Email" value={m.email} onChange={set('email')} type="email" required autoComplete="email" />
        </div>
        {state.error && <p className="field-error" role="alert">{state.error}</p>}
        <div className="modal-foot"><button type="button" className="btn-text" onClick={back}>Go back</button><button type="submit" className="btn-primary" disabled={!ready || state.busy}>{state.busy ? 'Sending…' : 'Submit Issue'}</button></div>
        {!ready && <p className="req" style={{ textAlign: 'right' }}>Fill in the required fields to submit.</p>}
      </form>
    </Modal>
  );
}

export function IssueModal({ onClose }) {
  const { user } = useSession();
  const blank = { type: '', details: '', name: user.first + ' ' + user.last, email: user.email };
  const [s, setS] = usePref('issue.form', blank);
  const [sent, setSent] = usePref('issue.sent', null);
  const set = (k) => (v) => setS({ ...s, [k]: v });
  const ready = s.type && s.details.trim() && s.name.trim() && s.email.trim();
  const [state, submit] = useSubmit('issue', s, () => { setSent({ email: s.email }); setS({ ...blank, name: s.name, email: s.email }); });
  const done = () => { setSent(null); onClose(); };
  if (sent) {
    return (
      <Modal id="issue" title="Report an Issue" icon="wrench" narrow focusKey="sent" onClose={done}>
        <div className="success"><Icon name="check" size={40} /><strong>Thanks for telling us.</strong><span>We'll follow up at {sent.email} if we need more detail.</span></div>
        <div className="modal-foot"><button type="button" className="btn-primary" onClick={done}>Done</button></div>
      </Modal>
    );
  }
  return (
    <Modal id="issue" title="Report an Issue" icon="wrench" narrow intro="Let us know what we need to update. Your feedback will help improve the experiences of all the users involved." onClose={onClose}>
      <form className="view" style={{ gap: 18 }} noValidate onSubmit={(e) => { if (ready) submit(e); else e.preventDefault(); }}>
        <div className="view" style={{ gap: 10 }}>
          <h3 className="section-label" id="issue-type-label">What kind of issue do you want to tell us about? <span style={{ fontWeight: 400 }}>(select one)</span></h3>
          <div className="choice-row" role="group" aria-labelledby="issue-type-label">
            {['Bug', 'Improvement', 'Data Fix'].map((t) => <button type="button" key={t} className="choice" aria-pressed={s.type === t} onClick={() => set('type')(t)}>{t}</button>)}
          </div>
        </div>
        <Field id="i-details" label="Please give us more details about the issue" value={s.details} onChange={set('details')} textarea placeholder="Enter issue description" wide />
        <h3 className="section-label">What contact information can we use to get in touch?</h3>
        <div className="form-grid is-2">
          <Field id="i-name" label="Name" value={s.name} onChange={set('name')} autoComplete="name" />
          <Field id="i-email" label="Email" value={s.email} onChange={set('email')} type="email" autoComplete="email" />
        </div>
        {state.error && <p className="field-error" role="alert">{state.error}</p>}
        <div className="modal-foot"><span /><button type="submit" className="btn-primary" disabled={!ready || state.busy}>{state.busy ? 'Sending…' : 'Submit Issue'}</button></div>
      </form>
    </Modal>
  );
}
