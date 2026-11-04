// Search for Clients. The search runs on the data source; past 15 matches it reports the count only.
import React from 'react';
import { Icon } from '../ui/icons.jsx';
import { usePref } from '../state/store.jsx';
import { useSearch } from '../state/data.js';
import { navigate } from '../router.jsx';
import { Modal, Field, Tip, Table, usePaged, Pager } from '../ui/controls.jsx';
import { StarButton, clientRoute } from '../ui/records.jsx';
import { displayName, dobText, plural } from '../lib.js';
import { TABLES } from '../tables.js';

const EMPTY = { first: '', last: '', phone: '', email: '', mci: '', dhs: '', ssn: '' };
const HEAD = ['Starred', 'Client Details', 'IDs', 'Contact Info', 'Address'].map((h) => <div className="th" role="columnheader" key={h}>{h}</div>);
const State = ({ icon, title, text }) => <div className="empty-state"><Icon name={icon} size={44} /><strong>{title}</strong><span>{text}</span></div>;

export function SearchModal({ onClose, openModal }) {
  const [form, setForm] = usePref('search.form', EMPTY);
  const [run, setRun] = usePref('search.run', null);
  const [error, setError] = usePref('search.error', '');
  const { query, total, results } = useSearch(run);
  const p = usePaged('search', results, [10, 25]);
  const set = (k) => (v) => { setForm({ ...form, [k]: v }); if (error) setError(''); };
  const filled = Object.values(form).some((v) => String(v).trim());
  const submit = (e) => {
    e.preventDefault();
    if (!filled) { setError('Enter at least one field to search.'); setRun(null); return; }
    setError(''); setRun({ ...form }); p.reset();
  };
  const clear = () => { setForm(EMPTY); setRun(null); setError(''); };
  const open = (c) => { onClose(); navigate(clientRoute(c.id)); };
  const tooMany = query.ready && total > results.length;

  let results$;
  if (!run) results$ = <Table label="Search results" spec={TABLES.search} head={HEAD} empty="Search for Clients" />;
  else if (query.status === 'error') results$ = <Table label="Search results" spec={TABLES.search} head={HEAD} empty={<State icon="alert" title="The search didn't run." text={(query.error && query.error.message) || 'Try again in a moment.'} />} />;
  else if (!query.ready) results$ = <Table label="Search results" spec={TABLES.search} head={HEAD} empty={<p className="empty">Searching…</p>} />;
  else if (tooMany) results$ = <Table label="Search results" spec={TABLES.search} head={HEAD} empty={<State icon="database" title="Too many search results to load!" text="Please narrow your search criteria by including more data about your client." />} />;
  else if (!results.length) results$ = <Table label="Search results" spec={TABLES.search} head={HEAD} empty={<State icon="question" title="No clients match this search." text="Check the spelling, try fewer fields, or report the client as missing." />} />;
  else {
    results$ = (
      <>
        <Table label="Search results" spec={TABLES.search} head={HEAD}>
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
  const count = run && query.ready ? (tooMany ? total + ' client matches found' : plural(total, 'client match', 'client matches') + ' found') : '';
  return (
    <Modal id="search" title="Search for Clients" intro="Use one or more fields to search all DHS clients in the database." onClose={onClose}>
      <form className="view" style={{ gap: 16 }} noValidate onSubmit={submit}>
        <div className="notice"><span><Icon name="alert" size={18} /></span>
          <p>Sensitive cases have been intentionally excluded from Client View during this pilot. If you're unable to find a client you expect to see, please complete this form.</p>
          <button type="button" className="btn-outline" onClick={() => openModal('missing')}>Report Missing Client</button></div>
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
          {count ? <span className="result-count" role="status">{count}</span> : error ? <span className="field-error" role="alert">{error}</span> : <span />}
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {(run || filled) && <button type="button" className="btn-text" onClick={clear}>Clear</button>}
            <button type="submit" className="btn-primary" style={{ minWidth: 190 }}>Search</button>
          </span>
        </div>
      </form>
      {results$}
    </Modal>
  );
}
