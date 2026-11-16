// Step 2, Identify. Everything is anonymous until it isn't: stay anonymous, or find (or register) the client
// in MCI and enroll them in ASC. The contact's notes, action items and time move to their record.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Field } from '../../ui/controls.jsx';
import { useClient, useSearch } from '../../state/data.js';
import { useAscMutations } from '../../state/asc.js';
import { useApi } from '../../state/store.jsx';
import { Link, navigate } from '../../router.jsx';
import { dobText } from '../../lib.js';
import { usDate } from '../../data/asc.js';
import { useMountFocus, StepHeading } from './parts.jsx';
import { MatchCard } from './Intake.jsx';

const go = (k, step) => navigate({ page: 'contact', id: k.id, step });
const BLANK = { first: '', last: '', dob: '', zip: '', ssn: '' };

// One search: name and date of birth, with ZIP and the last 4 of their SSN when they'll share them.
function Search({ k, edit, onNew, onUnverified }) {
  const [form, setForm] = useState(BLANK);
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');
  const { query, results } = useSearch(run);
  const set = (key) => (v) => { setForm({ ...form, [key]: v }); if (error) setError(''); };
  const submit = (e) => {
    e.preventDefault();
    if (!form.first.trim() && !form.last.trim() && !form.dob) { setError('Enter a name or date of birth to search.'); return; }
    setError('');
    setRun({ first: form.first, last: form.last, dob: form.dob, zip: form.zip, ssn: form.ssn });
  };
  const lastOnly = () => { const f = { ...BLANK, last: form.last }; setForm(f); setRun({ last: f.last }); };
  return (
    <form className="asc-card is-primary" onSubmit={submit} noValidate aria-labelledby="h-lookup">
      <div className="asc-card-head">
        <h3 className="section-label" id="h-lookup"><Icon name="search" size={18} />Look them up</h3>
      </div>
      <div className="form-grid is-3">
        <Field id="i-first" label="First name" value={form.first} onChange={set('first')} autoComplete="off" />
        <Field id="i-last" label="Last name" value={form.last} onChange={set('last')} autoComplete="off" />
        <Field id="i-dob" label="Date of birth" value={form.dob} onChange={set('dob')} type="date" />
        <Field id="i-zip" label="ZIP (optional)" value={form.zip} onChange={set('zip')} inputMode="numeric" maxLength={5} autoComplete="off" />
        <Field id="i-ssn" label="SSN, last 4 (optional)" value={form.ssn} onChange={set('ssn')} inputMode="numeric" maxLength={4} autoComplete="off" />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="asc-inline-row is-end">
        <button type="submit" className="btn-primary">Search MCI</button>
      </div>
      {run && (
        <div className="asc-results" aria-live="polite">
          {!query.ready ? <p className="asc-hint">Searching…</p> : results.length ? (
            <>
              <p className="field-label">{results.length === 1 ? '1 possible match' : results.length + ' possible matches'}</p>
              <ul className="asc-result-list">
                {results.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <span><strong>{c.first} {c.last}</strong><small>{dobText(c)} · MCI {c.mci} · {c.address.street}, {c.address.city} {c.address.zip}</small></span>
                    <button type="button" className="btn-outline" onClick={() => edit({ candidateId: c.id, path: 'client' }, { now: true })}>Select {c.first} {c.last}</button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="asc-nomatch">
              <p><strong>No match in MCI.</strong></p>
              <div className="asc-inline-row is-end">
                {form.last && (form.first || form.dob || form.zip || form.ssn) && <button type="button" className="btn-text" onClick={lastOnly}>Search Last Name Only</button>}
                <button type="button" className="btn-outline" onClick={() => onUnverified([form.first, form.last].filter(Boolean).join(' '))}>Save Name Only</button>
                <button type="button" className="btn-primary" onClick={() => onNew(form)}>Register New Client</button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function NewClient({ k, start, cancel }) {
  const { linkContact } = useAscMutations();
  const { toast } = useApi();
  const iso = (us) => { const p = String(us || '').split('/'); return p.length === 3 ? p[2] + '-' + p[0] + '-' + p[1] : us; };
  const [f, setF] = useState({ first: start.first || '', last: start.last || '', dob: start.dob || '', gender: '', ssn: '', phone: '', street: '', city: 'Pittsburgh', zip: start.zip || k.anon.zip || '', county: 'Allegheny', living: '', language: 'English' });
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const head = useMountFocus();
  const set = (key) => (v) => setF({ ...f, [key]: v });
  const REQ = [['last', 'last name', 'n-last'], ['first', 'first name', 'n-first'], ['gender', 'gender', 'n-gender'], ['dob', 'date of birth', 'n-dob']];
  const bad = (key) => tried && !String(f[key]).trim();
  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    const missing = REQ.filter(([key]) => !String(f[key]).trim());
    if (missing.length) { setError('Add ' + missing.map((x) => x[1]).join(', ') + '.'); document.getElementById(missing[0][2]).focus(); return; }
    setBusy(true);
    const p = f.dob.split('-');
    linkContact(k, { newClient: { ...f, dob: p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : f.dob } }).then(
      (r) => { toast(r.client.first + ' ' + r.client.last + ' registered in MCI and enrolled in ASC'); go(k, 'interactions'); },
      () => setBusy(false)
    );
  };
  return (
    <form className="asc-card is-primary" onSubmit={submit} noValidate aria-labelledby="h-new">
      <div className="asc-card-head"><h3 className="section-label" id="h-new" tabIndex={-1} ref={head}><Icon name="plusCircle" size={18} />New client</h3><button type="button" className="btn-text" onClick={cancel}>Back to Search</button></div>
      <div className="form-grid">
        <Field id="n-last" label="Last name" value={f.last} onChange={set('last')} required autoComplete="off" aria-invalid={bad('last')} aria-describedby={bad('last') ? 'n-err' : undefined} />
        <Field id="n-first" label="First name" value={f.first} onChange={set('first')} required autoComplete="off" aria-invalid={bad('first')} aria-describedby={bad('first') ? 'n-err' : undefined} />
        <div className="field"><div className="field-top"><label htmlFor="n-gender">Gender</label><span className="req">Required</span></div>
          <select className="select" id="n-gender" aria-invalid={bad('gender')} aria-describedby={bad('gender') ? 'n-err' : undefined} value={f.gender} onChange={(e) => set('gender')(e.target.value)}><option value="">Choose one</option><option>Female</option><option>Male</option><option>Nonbinary</option></select></div>
        <Field id="n-dob" label="Date of birth" value={iso(f.dob)} onChange={set('dob')} type="date" required aria-invalid={bad('dob')} aria-describedby={bad('dob') ? 'n-err' : undefined} />
        <Field id="n-ssn" label="SSN" value={f.ssn} onChange={set('ssn')} inputMode="numeric" placeholder="Only if they're comfortable" autoComplete="off" />
        <Field id="n-phone" label="Phone" value={f.phone} onChange={set('phone')} type="tel" autoComplete="off" />
        <div className="field"><label htmlFor="n-living">Living situation</label>
          <select className="select" id="n-living" value={f.living} onChange={(e) => set('living')(e.target.value)}><option value="">Not asked yet</option><option>With family</option><option>Independent</option><option>Shelter</option><option>Unhoused</option><option>In jail</option></select></div>
        <div className="field"><label htmlFor="n-lang">Primary language</label>
          <select className="select" id="n-lang" value={f.language} onChange={(e) => set('language')(e.target.value)}><option>English</option><option>Spanish</option><option>Nepali</option><option>Arabic</option><option>Swahili</option><option>Other</option></select></div>
        <Field id="n-street" label="Street address" value={f.street} onChange={set('street')} autoComplete="off" wide />
        <Field id="n-city" label="City" value={f.city} onChange={set('city')} autoComplete="off" />
        <Field id="n-zip" label="ZIP" value={f.zip} onChange={set('zip')} inputMode="numeric" maxLength={5} autoComplete="off" />
        <div className="field"><label htmlFor="n-county">County of residence</label>
          <select className="select" id="n-county" value={f.county} onChange={(e) => set('county')(e.target.value)}><option>Allegheny</option><option>Another county</option></select></div>
      </div>
      <p className="asc-hint">Unhoused: the address is saved as HOMELESS with the provider's city, state, county and ZIP. In jail: keep the last known address.</p>
      {error && <p className="field-error" id="n-err" role="alert">{error}</p>}
      <div className="asc-inline-row is-end"><button type="submit" className="btn-primary" disabled={busy}>Register and Enroll</button></div>
    </form>
  );
}

function Confirm({ k, edit }) {
  const { client: c, query } = useClient(k.candidateId);
  const { linkContact } = useAscMutations();
  const { toast } = useApi();
  const [busy, setBusy] = useState(false);
  const head = useMountFocus();
  if (!c) return <MatchCard k={k} />;
  const enroll = () => {
    setBusy(true);
    linkContact(k, { clientId: c.id }).then((r) => { toast(r.client.first + ' ' + r.client.last + ' enrolled in ASC'); go(k, 'interactions'); }, () => setBusy(false));
  };
  const missing = [['Citizenship', ''], ['Living situation', c.living]].filter(([, v]) => !v);
  return (
    <section className="asc-card is-primary" aria-labelledby="h-confirm">
      <div className="asc-card-head">
        <h3 className="section-label" id="h-confirm" tabIndex={-1} ref={head}><Icon name="idCard" size={18} />Confirm details: {c.first} {c.last}</h3>
        <button type="button" className="btn-text" onClick={() => edit({ candidateId: null }, { now: true })}>Not the right person</button>
      </div>
      <dl className="asc-facts is-wide">
        <div><dt>Date of birth</dt><dd>{dobText(c)}</dd></div>
        <div><dt>MCI ID</dt><dd>{c.mci}</dd></div>
        <div><dt>SSN</dt><dd>••• •• {c.ssn4 || '—'}</dd></div>
        <div><dt>Address</dt><dd>{c.address.street}, {c.address.city} {c.address.zip}</dd></div>
        <div><dt>Gender</dt><dd>{c.gender || '—'}</dd></div>
        <div><dt>Primary language</dt><dd>{c.language || '—'}</dd></div>
        {c.guardian && <div><dt>Guardian</dt><dd>{c.guardian.name}, {c.guardian.relationship.toLowerCase()} · {c.guardian.phone}</dd></div>}
        {c.coverage && <div><dt>Coverage on file</dt><dd>{c.coverage.plan} · {c.coverage.status} as of {c.coverage.asOf}</dd></div>}
      </dl>
      {missing.length > 0 && <p className="notice is-warn"><Icon name="alert" size={18} /><span><strong>Missing for the state:</strong> {missing.map((m) => m[0].toLowerCase()).join(' and ')}. Ask only if they're comfortable.</span></p>}
      <div className="asc-enroll">
        <div><strong>{c.colabs.indexOf('ASC') >= 0 ? 'Already in ASC' : 'Enroll in ASC'}</strong><span>This contact moves to {c.first}'s record.</span></div>
        <button type="button" className="btn-primary" onClick={enroll} disabled={busy || query.status === 'loading'}>{c.colabs.indexOf('ASC') >= 0 ? 'Add to Record' : 'Enroll'}</button>
      </div>
    </section>
  );
}

function Identified({ k, edit, next }) {
  const c = k.client;
  const head = useMountFocus();
  return (
    <>
      <section className="asc-card is-done" aria-labelledby="h-identified">
        <div className="asc-card-head">
          <h3 className="section-label" id="h-identified" tabIndex={-1} ref={head}><Icon name="check" size={18} />{c.first} {c.last} is on this contact</h3>
          <Link className="link-btn is-inline" to={{ page: 'client', id: c.id, sub: 'tab', tab: 'asc' }}><Icon name="external" size={14} />Open Client Profile</Link>
        </div>
        <p>{k.identity === 'new' ? 'Registered in MCI and enrolled in ASC.' : 'Matched in MCI and enrolled in ASC.'}</p>
      </section>
      {k.possibleLinks.length > 0 && (
        <section className="asc-card is-warn" aria-labelledby="h-links">
          <h3 className="section-label" id="h-links"><Icon name="link" size={18} />{k.possibleLinks.length === 1 ? 'An earlier anonymous contact may be theirs' : k.possibleLinks.length + ' earlier anonymous contacts may be theirs'}</h3>
          <ul className="asc-link-list">
            {k.possibleLinks.map((x) => <li key={x.id}><span className="mono">{x.ref}</span> · {usDate(x.startedAt)} · {x.anonName ? '“' + x.anonName + '”' : 'no name'} · {x.needs.map((n) => n.name).join(', ')}</li>)}
          </ul>
          <div className="asc-inline-row">
            <button type="button" className="btn-outline" onClick={() => edit({ linkedPrior: 'linked' }, { now: true })}><Icon name="link" />Link to {c.first}'s Record</button>
            <button type="button" className="btn-text" onClick={() => edit({ linkedPrior: 'no' }, { now: true })}>Not the Same Person</button>
          </div>
        </section>
      )}
      {k.linkedPrior === 'linked' && <p className="notice is-good"><Icon name="check" size={18} /><span>Earlier contacts {k.priorRefs.length ? k.priorRefs.join(' and ') : ''} are on {c.first}'s record.</span></p>}
      {next && <div className="asc-foot"><span /><button type="button" className="btn-primary is-icon" onClick={() => go(k, next[0])}>Next: {next[1]}<Icon name="arrowRight" /></button></div>}
    </>
  );
}

function Anonymous({ k, edit, next }) {
  const head = useMountFocus();
  const set = (key) => (v) => edit({ anon: { [key]: v } });
  return (
    <>
      <section className="asc-card" aria-labelledby="h-anon">
        <div className="asc-card-head">
          <h3 className="section-label" id="h-anon" tabIndex={-1} ref={head}><Icon name="user" size={18} />Anonymous record</h3>
          <button type="button" className="btn-text" onClick={() => edit({ path: null }, { now: true })}>Look Them Up</button>
        </div>
        <p className="asc-hint">All optional. No last name, birth date, phone or address.</p>
        <div className="form-grid">
          <Field id="a-name" label="First name or nickname" value={k.anon.name} onChange={set('name')} autoComplete="off" />
          <Field id="a-zip" label="ZIP" value={k.anon.zip} onChange={set('zip')} inputMode="numeric" maxLength={5} autoComplete="off" />
          <div className="field"><label htmlFor="a-county">County</label><select className="select" id="a-county" value={k.anon.county} onChange={(e) => edit({ anon: { county: e.target.value } }, { now: true })}><option>Allegheny</option><option>Another county</option><option>Not sure</option></select></div>
          <div className="field"><label htmlFor="a-lang">Preferred language</label><select className="select" id="a-lang" value={k.anon.language} onChange={(e) => edit({ anon: { language: e.target.value } }, { now: true })}><option>English</option><option>Spanish</option><option>Nepali</option><option>Arabic</option><option>Swahili</option><option>Other</option></select></div>
        </div>
        <div className="asc-ref"><span>Their reference number</span><strong className="mono">{k.ref}</strong><span>“If you {k.channel === 'person' ? 'come back' : 'call back'}, give us this number.”</span></div>
      </section>
      {next && <div className="asc-foot"><span /><button type="button" className="btn-primary is-icon" onClick={() => go(k, next[0])}>Next: {next[1]}<Icon name="arrowRight" /></button></div>}
    </>
  );
}

export function IdentifyStep({ k, edit, next }) {
  const [newFrom, setNewFrom] = useState(null);
  return (
    <div className="view asc-view">
      <StepHeading>Identify</StepHeading>
      {k.clientId ? <Identified k={k} edit={edit} next={next} />
        : k.identity === 'unverified' ? (
          <section className="asc-card is-warn" aria-labelledby="h-unv">
            <h3 className="section-label" id="h-unv"><Icon name="alert" size={18} />Saved with name only: {k.unverifiedName || 'no name'}</h3>
            <p>Not sent to the state until verified.</p>
            <div className="asc-inline-row"><button type="button" className="btn-outline" onClick={() => edit({ identity: null, path: 'client' }, { now: true })}>Search Again</button>
              {next && <button type="button" className="btn-primary is-icon" onClick={() => go(k, next[0])}>Next: {next[1]}<Icon name="arrowRight" /></button>}</div>
          </section>
        ) : k.path === 'anon' ? <Anonymous k={k} edit={edit} next={next} />
          : newFrom ? <NewClient k={k} start={newFrom} cancel={() => setNewFrom(null)} />
            : k.candidateId ? <Confirm k={k} edit={edit} />
              : (
                <>
                  <div className="asc-choose">
                    <section className="asc-card" aria-labelledby="h-stay">
                      <h3 className="section-label" id="h-stay"><Icon name="user" size={18} />Stay anonymous</h3>
                      <p>Give information and resources. Nothing identifies them.</p>
                      <div className="asc-ref"><span>Their reference number</span><strong className="mono">{k.ref}</strong></div>
                      <button type="button" className="btn-outline" onClick={() => edit({ path: 'anon' }, { now: true })}>Stay Anonymous</button>
                    </section>
                    <Search k={k} edit={edit} onNew={setNewFrom} onUnverified={(name) => edit({ identity: 'unverified', unverifiedName: name }, { now: true })} />
                  </div>
                </>
              )}
    </div>
  );
}
