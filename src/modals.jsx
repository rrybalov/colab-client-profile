// Dialogs: client search, report a missing client, report an issue.
// Form contents and the last search are saved, so a reload or an accidental close loses nothing.
import React from 'react';
import { Icon } from './icons.jsx';
import { useStore, usePref } from './store.jsx';
import { navigate } from './router.jsx';
import { STAFF, ME, displayName, dobText, plural } from './lib.js';
import { Modal, Field, Tip, Table, StarButton, usePaged, Pager } from './ui.jsx';

const me = STAFF.find((s) => s.id === ME);
const TOO_MANY = 15;
const EMPTY_SEARCH = { first: '', last: '', phone: '', email: '', mci: '', dhs: '', ssn: '' };
const EMPTY_MISSING = { first: '', last: '', dob: '', dhs: '', ssn: '', other: '', name: me.first + ' ' + me.last, email: me.email };
const EMPTY_ISSUE = { type: '', details: '', name: me.first + ' ' + me.last, email: me.email };
const digits = (s) => String(s || '').replace(/\D/g, '');

function runSearch(clients, q) {
  return clients.filter((c) => {
    if (q.first && c.first.toLowerCase().indexOf(q.first.trim().toLowerCase()) < 0 && !(c.members || []).join(' ').toLowerCase().includes(q.first.trim().toLowerCase())) return false;
    if (q.last && c.last.toLowerCase().indexOf(q.last.trim().toLowerCase()) < 0 && !(c.household && c.first.toLowerCase().includes(q.last.trim().toLowerCase()))) return false;
    if (q.phone && (!digits(c.phone) || digits(c.phone).indexOf(digits(q.phone)) < 0)) return false;
    if (q.email && c.email.toLowerCase().indexOf(q.email.trim().toLowerCase()) < 0) return false;
    if (q.mci && c.mci.toLowerCase().indexOf(q.mci.trim().toLowerCase()) < 0) return false;
    if (q.dhs && c.dhs.indexOf(digits(q.dhs)) < 0) return false;
    if (q.ssn && c.ssn4 !== digits(q.ssn).slice(-4)) return false;
    return true;
  }).sort((a, b) => displayName(a).localeCompare(displayName(b)));
}

const SEARCH_COLS = '58px minmax(150px,1.2fr) minmax(140px,1fr) minmax(220px,1.6fr) minmax(170px,1.2fr)';
const searchHead = ['Starred', 'Client Details', 'IDs', 'Contact Info', 'Address'].map((h) => <div className="th" role="columnheader" key={h}>{h}</div>);

function SearchModal({ onClose }) {
  const { state, openModal } = useStore();
  const [form, setForm] = usePref('search.form', EMPTY_SEARCH);
  const [run, setRun] = usePref('search.run', null);
  const [error, setError] = usePref('search.error', '');
  const set = (k) => (v) => { setForm({ ...form, [k]: v }); if (error) setError(''); };
  const list = run ? runSearch(state.db.clients, run) : [];
  const p = usePaged('search', list, [10, 25]);
  const submit = (e) => {
    e.preventDefault();
    if (!Object.keys(form).some((k) => String(form[k]).trim())) { setError('Enter at least one field to search.'); setRun(null); return; }
    setError(''); setRun({ ...form }); p.reset();
  };
  const clear = () => { setForm(EMPTY_SEARCH); setRun(null); setError(''); };
  const open = (c) => { onClose(); navigate({ page: 'client', id: c.id, sub: 'tab', tab: 'overview' }); };

  let results;
  if (!run) results = <Table label="Search results" cols={SEARCH_COLS} min={760} head={searchHead} empty="Search for Clients" />;
  else if (list.length > TOO_MANY) results = <Table label="Search results" cols={SEARCH_COLS} min={760} head={searchHead} empty={<div className="empty-state"><Icon name="database" size={44} /><strong>Too many search results to load!</strong><span>Please narrow your search criteria by including more data about your client.</span></div>} />;
  else if (!list.length) results = <Table label="Search results" cols={SEARCH_COLS} min={760} head={searchHead} empty={<div className="empty-state"><Icon name="question" size={44} /><strong>No clients match this search.</strong><span>Check the spelling, try fewer fields, or report the client as missing.</span></div>} />;
  else {
    results = (
      <>
        <Table label="Search results" cols={SEARCH_COLS} min={760} head={searchHead}>
          {p.items.map((c) => (
            <div className="tr is-row" role="row" key={c.id}>
              <div className="td is-tight" role="cell"><StarButton client={c} /></div>
              <div className="td" role="cell"><button type="button" className="link-btn" onClick={() => open(c)}>{displayName(c)}</button><small>{dobText(c)}</small></div>
              <div className="td" role="cell">MCI: {c.mci}<small>SSN: *{c.ssn4}</small></div>
              <div className="td" role="cell">Phone: {c.phone || '—'}<small style={{ overflowWrap: 'anywhere' }}>Email: {c.email || '—'}</small></div>
              <div className="td" role="cell">{c.address.street},<small>{c.address.city}, {c.address.state} {c.address.zip}</small></div>
            </div>
          ))}
        </Table>
        <Pager p={p} />
      </>
    );
  }
  const count = run ? (list.length > TOO_MANY ? list.length + ' client matches found' : plural(list.length, 'client match', 'client matches') + ' found') : '';
  return (
    <Modal id="search" title="Search for Clients" intro="Use one or more fields to search all DHS clients in the database." onClose={onClose}>
      <form className="view" style={{ gap: 16 }} noValidate onSubmit={submit}>
        <div className="notice"><span><Icon name="alert" size={18} /></span>
          <p>Sensitive cases have been intentionally excluded from Client View during this pilot. If you're unable to find a client you expect to see, please complete this form.</p>
          <button type="button" className="btn-outline" onClick={() => openModal({ id: 'missing' })}>Report Missing Client</button></div>
        <div className="form-grid">
          <Field id="s-first" label="First Name" value={form.first} onChange={set('first')} placeholder="Enter first name" autoComplete="off" />
          <Field id="s-last" label="Last Name" value={form.last} onChange={set('last')} placeholder="Enter last name" autoComplete="off" />
          <Field id="s-phone" label="Phone Number" value={form.phone} onChange={set('phone')} placeholder="(___) ___-____" type="tel" inputMode="tel" autoComplete="off" />
          <Field id="s-email" label="Email" value={form.email} onChange={set('email')} placeholder="email@domain.com" type="email" autoComplete="off" />
        </div>
        <div className="form-grid is-3">
          <Field id="s-mci" label="MCI ID" value={form.mci} onChange={set('mci')} placeholder="Enter MCI" autoComplete="off" tip={<Tip label="About MCI ID">Unique value used for DHS identification purposes</Tip>} />
          <Field id="s-dhs" label="MA ID or PA DHS ID" value={form.dhs} onChange={set('dhs')} placeholder="Enter PA DHS ID (10 digits)" inputMode="numeric" autoComplete="off" tip={<Tip label="About MA ID or PA DHS ID">This is the individual ID provided by PA DHS</Tip>} />
          <Field id="s-ssn" label="Social Security Number (SSN)" value={form.ssn} onChange={set('ssn')} placeholder="Enter last 4 digits of SSN" inputMode="numeric" maxLength={4} autoComplete="off" tip={<Tip label="About SSN">Unique value across all benefits and services</Tip>} />
        </div>
        <div className="modal-foot">
          {run ? <span className="result-count" role="status">{count}</span> : error ? <span className="field-error" role="alert">{error}</span> : <span />}
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {(run || Object.values(form).some((v) => String(v).trim())) && <button type="button" className="btn-text" onClick={clear}>Clear</button>}
            <button type="submit" className="btn-primary" style={{ minWidth: 190 }}>Search</button>
          </span>
        </div>
      </form>
      {results}
    </Modal>
  );
}

function MissingModal({ onClose }) {
  const { openModal, mutate } = useStore();
  const [m, setM] = usePref('missing.form', EMPTY_MISSING);
  const [sent, setSent] = usePref('missing.sent', null);
  const set = (k) => (v) => setM({ ...m, [k]: v });
  const ready = m.first.trim() && m.last.trim() && m.dob && m.name.trim() && m.email.trim();
  const back = () => { setSent(null); openModal({ id: 'search' }); };
  if (sent) {
    return (
      <Modal id="missing" title="Report Missing Client" narrow focusKey="sent" onClose={() => { setSent(null); onClose(); }}>
        <div className="success"><Icon name="check" size={40} /><strong>Thanks. We got your request.</strong><span>We'll look for {sent.first} {sent.last} and email you at {sent.email}.</span></div>
        <div className="modal-foot"><button type="button" className="btn-text" onClick={back}>Back to search</button><button type="button" className="btn-primary" onClick={() => { setSent(null); onClose(); }}>Done</button></div>
      </Modal>
    );
  }
  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    mutate((db) => ({ ...db, reports: (db.reports || []).concat([{ id: 'r' + Date.now(), kind: 'missing', at: new Date().toISOString(), ...m }]) }));
    setSent({ first: m.first, last: m.last, email: m.email });
    setM(EMPTY_MISSING);
  };
  return (
    <Modal id="missing" title="Report Missing Client" intro="If you can't see a particular client during this Client View pilot, please complete this form." narrow onClose={onClose}>
      <form className="view" style={{ gap: 18 }} noValidate onSubmit={submit}>
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
        <div className="modal-foot"><button type="button" className="btn-text" onClick={back}>Go back</button><button type="submit" className="btn-primary" disabled={!ready}>Submit Issue</button></div>
        {!ready && <p className="req" style={{ textAlign: 'right' }}>Fill in the required fields to submit.</p>}
      </form>
    </Modal>
  );
}

function IssueModal({ onClose }) {
  const { mutate } = useStore();
  const [s, setS] = usePref('issue.form', EMPTY_ISSUE);
  const [sent, setSent] = usePref('issue.sent', null);
  const set = (k) => (v) => setS({ ...s, [k]: v });
  const ready = s.type && s.details.trim() && s.name.trim() && s.email.trim();
  const done = () => { setSent(null); onClose(); };
  if (sent) {
    return (
      <Modal id="issue" title="Report an Issue" icon="wrench" narrow focusKey="sent" onClose={done}>
        <div className="success"><Icon name="check" size={40} /><strong>Thanks for telling us.</strong><span>We'll follow up at {sent.email} if we need more detail.</span></div>
        <div className="modal-foot"><button type="button" className="btn-primary" onClick={done}>Done</button></div>
      </Modal>
    );
  }
  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    mutate((db) => ({ ...db, reports: (db.reports || []).concat([{ id: 'r' + Date.now(), kind: 'issue', at: new Date().toISOString(), page: location.hash, ...s }]) }));
    setSent({ email: s.email });
    setS({ ...EMPTY_ISSUE, name: s.name, email: s.email });
  };
  return (
    <Modal id="issue" title="Report an Issue" icon="wrench" narrow intro="Let us know what we need to update. Your feedback will help improve the experiences of all the users involved." onClose={onClose}>
      <form className="view" style={{ gap: 18 }} noValidate onSubmit={submit}>
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
        <div className="modal-foot"><span /><button type="submit" className="btn-primary" disabled={!ready}>Submit Issue</button></div>
      </form>
    </Modal>
  );
}

export function Modals() {
  const [modal] = usePref('modal', null);
  const { closeModal } = useStore();
  if (!modal) return null;
  if (modal.id === 'search') return <SearchModal key="search" onClose={closeModal} />;
  if (modal.id === 'missing') return <MissingModal key="missing" onClose={closeModal} />;
  if (modal.id === 'issue') return <IssueModal key="issue" onClose={closeModal} />;
  return null;
}
