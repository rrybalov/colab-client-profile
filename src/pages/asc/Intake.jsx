// Step 1, Intake. Asked on every contact, by phone or in person, whether or not the person is known.
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Segmented, Field } from '../../ui/controls.jsx';
import { useClient, useSearch } from '../../state/data.js';
import { useAscMutations } from '../../state/asc.js';
import { navigate } from '../../router.jsx';
import {
  SAFETY, CALLERS, AGES, REASONS, COVERAGE, FOUND, PRIVACY, URGENCY, NEED_OPTIONS, SCREENING,
  needForScreen, isConcern, intakeGaps, defaultPlace, PLACES, usDate
} from '../../data/asc.js';
import { Options, Section, initials, focusLater, removeWithUndo } from './parts.jsx';
import { useApi } from '../../state/store.jsx';
import { dobText } from '../../lib.js';

const SITES = ['Mercy Behavioral Health', 'Steel Valley Recovery Center', 'Northside Community Health Clinic'];
let needSeq = 0;
export const newNeed = (name, urg = 'Routine') => ({ id: 'n' + Date.now().toString(36) + (needSeq++), name, urg, outcome: '', outcomeNote: '' });

function ContactType({ k, edit }) {
  const setChannel = (v) => {
    // Interactions logged as Telephone become Office in person, and back.
    const swap = { [PLACES[0]]: defaultPlace(v), [PLACES[1]]: defaultPlace(v) };
    edit({ channel: v, site: v === 'person' ? k.site || SITES[0] : '', interactions: k.interactions.map((x) => ({ ...x, place: swap[x.place] || x.place })) }, { now: true });
  };
  return (
    <Section id="h-type" title="How they reached us" icon="headset" className="is-compact"
      aside={<Segmented label="Contact type" value={k.channel} onChange={setChannel} options={[{ id: 'phone', label: 'Phone Call', icon: 'phone' }, { id: 'person', label: 'In Person', icon: 'door' }]} />}>
      {k.channel === 'person' && (
        <div className="asc-sub">
          <div className="form-grid is-2">
            <div className="field">
              <label htmlFor="asc-site">Site</label>
              <select className="select" id="asc-site" value={k.site} onChange={(e) => edit({ site: e.target.value }, { now: true })}>
                {SITES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <p className="field-label" id="h-privacy">Where are you talking?</p>
          <Options labelId="h-privacy" value={k.intake.privacy} options={PRIVACY} onChange={(v) => edit({ intake: { privacy: v } }, { now: true })} concern={[PRIVACY[1]]} />
          {k.intake.privacy === PRIVACY[1] && <p className="notice is-warn" role="note"><Icon name="alert" size={18} /><span>Move somewhere private before the safety and screening questions, or skip them for now and ask before they leave.</span></p>}
        </div>
      )}
    </Section>
  );
}

function Safety({ k, edit, openModal }) {
  const urgent = () => { edit({ intake: { safety: 'Yes: routed to crisis' } }, { now: true }); openModal('ascUrgent', { contactId: k.id }); };
  return (
    <section className="asc-safety" aria-labelledby="h-safety">
      <div className="asc-safety-top">
        <div><h3 className="section-label" id="h-safety"><Icon name="shield" size={18} />Safety</h3><p>Is anyone in immediate danger, or thinking about hurting themselves?</p></div>
        <div className="asc-safety-opts">
          <Options label="Safety answer" value={k.intake.safety} options={SAFETY} onChange={(v) => edit({ intake: { safety: v } }, { now: true })} />
          <button type="button" className="opt is-danger" onClick={urgent}><Icon name="alert" size={14} />Yes: start urgent routing</button>
        </div>
      </div>
      <p className="asc-safety-lines">If anyone is in danger right now: <strong>911</strong> · <strong>988</strong> Suicide and Crisis Lifeline · <strong>resolve Crisis Services</strong> [confirm number]</p>
    </section>
  );
}

function ReturningCaller({ k, edit, openModal, close }) {
  const { lookupContact } = useAscMutations();
  const [ref, setRef] = useState('');
  const [state, setState] = useState({ busy: false, error: '', found: null });
  const find = (e) => {
    e.preventDefault();
    if (!ref.trim()) { setState({ busy: false, error: 'Enter the reference number from their last contact.', found: null }); return; }
    setState({ busy: true, error: '', found: null });
    lookupContact(ref.trim()).then((found) => setState({ busy: false, error: '', found }), () => setState({ busy: false, error: 'No contact has that reference number. Check it with the caller, or keep going: the intake works without it.', found: null }));
  };
  const attach = () => edit({ priorRef: state.found.ref }, { now: true }).then(() => { close(); openModal('ascHistory', { contactId: k.id }); });
  return (
    <form className="asc-inline" onSubmit={find} noValidate aria-labelledby="h-return">
      <h3 id="h-return">Find their earlier contacts</h3>
      <p className="asc-hint">Ask for the reference number from their last contact. It starts with EV.</p>
      <div className="asc-inline-row">
        <Field id="asc-ref" label="Reference number" value={ref} onChange={(v) => { setRef(v); if (state.error) setState({ ...state, error: '' }); }} placeholder="EV-26-000142" autoComplete="off" aria-invalid={!!state.error} aria-describedby={state.error ? 'asc-ref-err' : undefined} />
        <button type="submit" className="btn-primary" disabled={state.busy}>Find</button>
        <button type="button" className="btn-text" onClick={close}>Cancel</button>
      </div>
      {state.error && <p className="field-error" id="asc-ref-err" role="alert">{state.error}</p>}
      {state.found && (
        <div className="asc-found" role="status">
          <span><strong>{state.found.ref}</strong> · {usDate(state.found.startedAt)} · {state.found.clientName || 'Anonymous' + (state.found.anonName ? ': ' + state.found.anonName : '')} · {state.found.needs.map((n) => n.name).join(', ')}</span>
          <button type="button" className="btn-outline" onClick={attach}><Icon name="history" />Add to This Contact and View History</button>
        </div>
      )}
    </form>
  );
}

function QuickIdentify({ k, edit, close }) {
  const [form, setForm] = useState({ first: '', last: '', dob: '' });
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');
  const { query, results } = useSearch(run);
  const submit = (e) => {
    e.preventDefault();
    if (!form.first.trim() && !form.last.trim()) { setError('Enter at least a first or last name.'); return; }
    setError(''); setRun({ first: form.first, last: form.last, dob: form.dob });
  };
  const set = (key) => (v) => { setForm({ ...form, [key]: v }); if (error) setError(''); };
  const pick = (c) => { edit({ candidateId: c.id, path: 'client' }, { now: true }); close(); };
  return (
    <form className="asc-inline" onSubmit={submit} noValidate aria-labelledby="h-quick">
      <h3 id="h-quick">Look them up now</h3>
      <p className="asc-hint">The rest of the intake stays here. You'll confirm details and enroll on the Identify step.</p>
      <div className="form-grid is-3">
        <Field id="q-first" label="First name" value={form.first} onChange={set('first')} autoComplete="off" />
        <Field id="q-last" label="Last name" value={form.last} onChange={set('last')} autoComplete="off" />
        <Field id="q-dob" label="Date of birth" value={form.dob} onChange={set('dob')} type="date" />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="asc-inline-row is-end">
        <button type="button" className="btn-text" onClick={close}>Cancel</button>
        <button type="submit" className="btn-primary">Search MCI</button>
      </div>
      {run && (
        <div className="asc-results" aria-live="polite">
          {!query.ready ? <p className="asc-hint">Searching…</p>
            : results.length ? (
              <>
                <p className="field-label">{results.length === 1 ? '1 possible match' : results.length + ' possible matches'}</p>
                <ul className="asc-result-list">
                  {results.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <span><strong>{c.first} {c.last}</strong><small>{dobText(c)} · MCI {c.mci} · {c.address.city} {c.address.zip}</small></span>
                      <button type="button" className="btn-outline" onClick={() => pick(c)}>Select {c.first} {c.last}</button>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="asc-hint">No match. Keep going with the intake; you can search again on the Identify step.</p>}
        </div>
      )}
    </form>
  );
}

export function MatchCard({ k, edit }) {
  const { client: c } = useClient(k.candidateId || k.clientId);
  const s = k.candidate || k.client;
  if (!s) return null;
  const inAsc = s.colabs.indexOf('ASC') >= 0;
  return (
    <section className="asc-match" aria-labelledby="h-match">
      <div className="asc-match-top">
        <span className="asc-avatar" aria-hidden="true">{initials(s)}</span>
        <div className="asc-match-name">
          <h3 id="h-match">{s.first} {s.last}</h3>
          <span>{dobText(s)} · MCI {s.mci} · {s.address.city} {s.address.zip}</span>
        </div>
        {!k.clientId && <button type="button" className="btn-text" onClick={() => edit({ candidateId: null, path: null }, { now: true })}>Not the right person</button>}
      </div>
      <dl className="asc-facts">
        <div><dt>In ASC</dt><dd>{k.clientId ? 'Enrolled' : inAsc ? 'Enrolled' : 'Not enrolled yet'}</dd></div>
        <div><dt>Coverage on file</dt><dd>{c && c.coverage ? c.coverage.plan + ', ' + c.coverage.status.toLowerCase() : c ? 'None on file' : '…'}</dd></div>
        <div><dt>Guardian on file</dt><dd>{c && c.guardian ? c.guardian.name + ', ' + c.guardian.relationship.toLowerCase() : c ? 'None on file' : '…'}</dd></div>
        <div className={k.priorRefs.length || (k.possibleLinks && k.possibleLinks.length) ? 'is-warn' : ''}><dt>Earlier contacts</dt><dd>{k.priorRefs.length ? k.priorRefs.length + ' by reference number' : 'Checked on the Identify step'}</dd></div>
      </dl>
      <p className="asc-hint">Keep going with the intake. These questions apply on every contact; answers already on file show as a quick check.</p>
    </section>
  );
}

function Needs({ k, edit, openModal }) {
  const { toast } = useApi();
  const [custom, setCustom] = useState('');
  const names = k.needs.map((n) => n.name);
  const setUrg = (n, u) => {
    edit({ needs: k.needs.map((x) => (x.id === n.id ? { ...x, urg: u } : x)) }, { now: true });
    if (u === 'Crisis') openModal('ascUrgent', { contactId: k.id, need: n.name });
  };
  const add = (name) => { if (!name.trim() || names.indexOf(name.trim()) >= 0) return; edit({ needs: k.needs.concat([newNeed(name.trim())]) }, { now: true }); };
  return (
    <Section id="h-needs" title="What they need help with" icon="layers">
      {k.needs.length ? (
        <ul className="asc-needs">
          {k.needs.map((n) => (
            <li key={n.id}>
              <strong>{n.name}</strong>
              <Segmented small label={'Urgency for ' + n.name} value={n.urg} onChange={(u) => setUrg(n, u)} options={URGENCY.map((u) => ({ id: u, label: u }))} />
              <button type="button" className="icon-btn is-danger asc-icon-btn" aria-label={'Remove ' + n.name} onClick={() => { removeWithUndo(toast, edit, k, 'needs', n, n.name); focusLater('h-needs'); }}><Icon name="trash" size={16} /></button>
            </li>
          ))}
        </ul>
      ) : <p className="asc-empty">No needs yet. Add one below, or from a screening answer above.</p>}
      <div className="asc-add-row" role="group" aria-label="Add a need">
        {NEED_OPTIONS.filter((x) => names.indexOf(x) < 0).map((x) => <button key={x} type="button" className="opt is-add" onClick={() => add(x)}><Icon name="plus" size={14} />{x}</button>)}
      </div>
      <form className="asc-inline-row" onSubmit={(e) => { e.preventDefault(); add(custom); setCustom(''); }}>
        <Field id="asc-custom-need" label="Or describe another need" value={custom} onChange={setCustom} placeholder="For example: help with a utility shutoff notice" />
        <button type="submit" className="btn-outline">Add Need</button>
      </form>
    </Section>
  );
}

function Screening({ k, edit }) {
  const names = k.needs.map((n) => n.name);
  return (
    <Section id="h-screen" title="Screening" icon="check" hint="About the person who needs help. Asked on every contact; answers carry onto their ASC record.">
      <div className="asc-screen">
        {SCREENING.map((q) => {
          const need = needForScreen(q, k.intake.age);
          const a = k.screening[q.key];
          const concern = isConcern(q, a);
          return (
            <div className="asc-q" key={q.key}>
              <p className="asc-q-text" id={'q-' + q.key}>{q.question}</p>
              <div className="asc-q-row">
                <Options labelId={'q-' + q.key} value={a} options={q.options} concern={q.concern} onChange={(v) => edit({ screening: { [q.key]: v } }, { now: true })} />
                {/* One button that changes state, so focus stays put after adding the need. */}
                {concern && (names.indexOf(need) < 0
                  ? <button type="button" className="btn-outline is-small" onClick={() => edit({ needs: k.needs.concat([newNeed(need)]) }, { now: true })}><Icon name="plus" size={14} />Add Need: {need}</button>
                  : <button type="button" className="btn-outline is-small is-done" aria-disabled="true"><Icon name="checkSmall" size={14} />{need}: on the needs list</button>)}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function IntakeStep({ k, edit, openModal, next }) {
  const [panel, setPanelState] = useState(null);
  // Closing an inline helper puts focus back on the button that opened it.
  const setPanel = (v) => { if (!v && panel) focusLater(panel === 'return' ? 'asc-btn-return' : 'asc-btn-quick'); setPanelState(v); };
  const { client: c } = useClient(k.candidateId || null);
  const i = k.intake;
  const set = (key, now) => (v) => edit({ intake: { [key]: v } }, now ? { now: true } : undefined);
  const gaps = intakeGaps(k);
  const closed = k.status === 'closed';
  return (
    <div className="view asc-view">
      <div className="view-head">
        <h2 className="title"><Icon name="notes" size={24} />Intake</h2>
        {!k.clientId && !k.candidateId && !closed && (
          <div className="asc-head-actions">
            <button type="button" className="btn-outline" id="asc-btn-return" aria-expanded={panel === 'return'} onClick={() => setPanel(panel === 'return' ? null : 'return')}><Icon name="history" />Returning Caller</button>
            <button type="button" className="btn-outline" id="asc-btn-quick" aria-expanded={panel === 'quick'} onClick={() => setPanel(panel === 'quick' ? null : 'quick')}><Icon name="idCard" />They Gave Their Name</button>
          </div>
        )}
      </div>
      {panel === 'return' && <ReturningCaller k={k} edit={edit} openModal={openModal} close={() => setPanel(null)} />}
      {panel === 'quick' && <QuickIdentify k={k} edit={edit} close={() => setPanel(null)} />}
      {k.priorRefs.length > 0 && (
        <div className="notice is-info">
          <Icon name="history" size={18} />
          <p><strong>Returning caller.</strong> Earlier contacts {k.priorRefs.join(' and ')} are tied to this one.</p>
          <button type="button" className="btn-outline" onClick={() => openModal('ascHistory', { contactId: k.id })}>View Previous Interactions</button>
        </div>
      )}
      {(k.candidateId || k.clientId) && <MatchCard k={k} edit={edit} />}

      <ContactType k={k} edit={edit} />
      <Safety k={k} edit={edit} openModal={openModal} />

      <Section id="h-who" title="Who's calling" icon="users">
        {c && c.guardian && (
          <div className="asc-confirm">
            <p id="h-cconf"><strong>On file:</strong> {c.guardian.name}, {c.guardian.relationship.toLowerCase()} · {c.guardian.phone}. Is this who you're talking to?</p>
            <Options labelId="h-cconf" value={i.callerConfirmed} options={['Yes, ' + c.guardian.name, 'Someone else']}
              onChange={(v) => edit({ intake: v && v !== 'Someone else' ? { callerConfirmed: v, caller: 'Parent or guardian', callerName: c.guardian.name } : { callerConfirmed: v } }, { now: true })} />
          </div>
        )}
        <p className="field-label" id="h-caller">Caller</p>
        <Options labelId="h-caller" value={i.caller} options={CALLERS} onChange={set('caller', true)} />
        {i.caller === 'Other' && <div className="form-grid is-2"><Field id="asc-caller-other" label="Who is calling?" value={i.callerOther} onChange={set('callerOther')} placeholder="For example: neighbor, pastor, landlord" /></div>}
        <p className="field-label" id="h-age">The person who needs help</p>
        <Options labelId="h-age" value={i.age} options={AGES} onChange={set('age', true)} />
        <div className="form-grid is-2"><Field id="asc-caller-name" label="What should we call the caller? (optional)" value={i.callerName} onChange={set('callerName')} autoComplete="off" /></div>
      </Section>

      <Section id="h-story" title="What's going on" icon="notes">
        <label className="sr-only" htmlFor="asc-story">What's going on, in their words</label>
        <textarea className="input is-block" id="asc-story" rows={4} value={i.story} onChange={(e) => set('story')(e.target.value)} placeholder="In their words: what's happening, and what they're hoping for" />
        <p className="field-label" id="h-reason">Reason for {k.channel === 'person' ? 'the visit' : 'calling'}</p>
        <Options labelId="h-reason" value={i.reason} options={REASONS} onChange={set('reason', true)} />
        {i.reason === 'Following up on an earlier contact' && !k.priorRefs.length && !k.clientId && (
          <p className="notice is-info"><Icon name="history" size={18} /><span>Following up? Ask for their reference number to see what happened last time.</span><button type="button" className="btn-outline" onClick={() => setPanel('return')}>Find Earlier Contacts</button></p>
        )}
      </Section>

      <Screening k={k} edit={edit} />
      <Needs k={k} edit={edit} openModal={openModal} />

      <Section id="h-cov" title="Healthcare coverage" icon="landmark">
        {c && c.coverage && (
          <div className="asc-confirm">
            <p id="h-covconf"><strong>On file:</strong> {c.coverage.plan}, {c.coverage.status.toLowerCase()} as of {c.coverage.asOf}. Still right?</p>
            <Options labelId="h-covconf" value={i.coverageConfirmed} options={['Yes, still the same', 'It changed']}
              onChange={(v) => edit({ intake: v === 'Yes, still the same' ? { coverageConfirmed: v, coverage: COVERAGE[0], coverageDetail: c.coverage.plan } : { coverageConfirmed: v, coverage: v ? null : i.coverage } }, { now: true })} />
          </div>
        )}
        <Options label="Healthcare coverage" value={i.coverage} options={COVERAGE} onChange={set('coverage', true)} />
        {i.coverage && i.coverage !== 'None' && i.coverage !== 'Doesn’t know' && <div className="form-grid is-2"><Field id="asc-cov" label="Plan details, if they know them (optional)" value={i.coverageDetail} onChange={set('coverageDetail')} placeholder="For example: HealthChoices through CCBH" /></div>}
      </Section>

      <Section id="h-found" title="How they found us" icon="search">
        <Options label="How they found us" value={i.found} options={FOUND} onChange={set('found', true)} />
        {i.found === 'Other' && <div className="form-grid is-2"><Field id="asc-found-other" label="How did they find us?" value={i.foundOther} onChange={set('foundOther')} placeholder="For example: flyer at the library" /></div>}
      </Section>

      <div className="asc-foot">
        {gaps.length ? <p className="asc-gaps"><Icon name="info" size={16} />Still to ask: {gaps.join(', ')}. You can keep going and come back.</p> : <p className="asc-gaps is-done"><Icon name="check" size={16} />Intake complete.</p>}
        {next && <button type="button" className="btn-primary is-icon" onClick={() => navigate({ page: 'contact', id: k.id, step: next[0] })}>Next: {next[1]}<Icon name="arrowRight" /></button>}
      </div>
    </div>
  );
}
