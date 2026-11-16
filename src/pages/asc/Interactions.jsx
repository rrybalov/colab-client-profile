// Step 3, Interactions: the main work during a contact. Each resource or hand-off is one service interaction,
// documented while the person is still on the phone or in the room. Also follow-up permission and, in person,
// the steps only a visit allows (checking ID, signing consent, scanning documents).
import React, { useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Field } from '../../ui/controls.jsx';
import { useData } from '../../state/store.jsx';
import { useMutations, useSession } from '../../state/data.js';
import { navigate } from '../../router.jsx';
import { isoToUS, todayISO } from '../../lib.js';
import {
  IX_TYPES, PLACES, HOWS, PRESETS, FOLLOW_HOWS, needForScreen, howFor, defaultPlace, unitsFor, missingFor, totals, totalsText,
  followUpPlan, weekday, usDate, minutesBetween, clockTime, shown, plural
} from '../../data/asc.js';
import { Options, Section, StepHeading, focusLater, removeWithUndo } from './parts.jsx';
import { useApi } from '../../state/store.jsx';

let seq = 0;
const uid = (p) => p + Date.now().toString(36) + (seq++).toString(36);
const DOC_TYPES = ['Last year’s evaluation', 'School behavior report', 'Insurance card', 'Photo ID', 'Benefits letter', 'Other document'];

function Reminders({ k, x, reminders }) {
  const { createAction } = useMutations();
  const { staff, me } = useSession();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ text: '', assignee: me, due: '' });
  const [error, setError] = useState(false);
  const save = (e) => {
    e.preventDefault();
    const text = d.text.trim() || 'Follow up on ' + x.what;
    if (!d.due) { setError(true); return; }
    setOpen(false); setError(false);
    if (k.clientId) {
      createAction(k.clientId, { text, assignee: d.assignee, due: d.due, tag: 'ASC' }, 'Reminder added to action items')
        .then((a) => x.edit({ addLinks: [{ actionId: a.id, ixId: x.id }] }, { now: true }), () => {});
    } else {
      const a = { id: uid('ka'), text, assignee: d.assignee, due: d.due, done: false, edited: false };
      x.edit({ actions: k.actions.concat([a]), addLinks: [{ actionId: a.id, ixId: x.id }] }, { now: true });
    }
    setD({ text: '', assignee: me, due: '' });
    focusLater(base + '-add');
  };
  const base = 'r-' + x.id;
  return (
    <div className="asc-reminders">
      {reminders.length > 0 && (
        <ul className="asc-rem-list" aria-label={'Reminders for interaction ' + x.num}>
          {reminders.map((a) => <li key={a.id} className={a.done ? 'is-done' : ''}><Icon name="bell" size={15} /><span><strong>{a.text}</strong> · Due {a.due ? weekday(a.due) + ' ' + isoToUS(a.due) : 'no date'}{a.done ? ' · Done' : ''}</span></li>)}
        </ul>
      )}
      {open ? (
        <form className="composer asc-rem-form" onSubmit={save} noValidate>
          <label className="field-label" htmlFor={base + '-text'}>New reminder from this interaction</label>
          <input className="input is-block" id={base + '-text'} autoFocus value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} placeholder={'For example: Call to confirm the appointment'} />
          <div className="composer-row">
            <label className="sr-only" htmlFor={base + '-who'}>Assignee</label>
            <select className="select" id={base + '-who'} value={d.assignee} onChange={(e) => setD({ ...d, assignee: e.target.value })} style={{ flex: '1 1 160px' }}>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.first} {s.last}{s.id === me ? ' (me)' : ''}</option>)}
            </select>
            <label className="sr-only" htmlFor={base + '-due'}>Due date</label>
            <input className="input" id={base + '-due'} type="date" min={todayISO()} value={d.due} aria-invalid={error} aria-describedby={error ? base + '-err' : undefined} onChange={(e) => { setD({ ...d, due: e.target.value }); setError(false); }} />
          </div>
          {error && <span className="error" id={base + '-err'} role="alert">Choose a due date for the reminder.</span>}
          <div className="composer-foot"><button type="button" className="btn-text" onClick={() => { setOpen(false); setError(false); focusLater(base + '-add'); }}>Cancel</button><button type="submit" className="btn-outline is-wide">Save Reminder</button></div>
        </form>
      ) : <button type="button" className="btn-text is-icon" id={base + '-add'} onClick={() => setOpen(true)}><Icon name="bell" size={15} />Add Reminder</button>}
    </div>
  );
}

function InteractionCard({ k, x, num, edit, needs, reminders, isNew }) {
  const { toast } = useApi();
  const set = (key, now) => (v) => edit({ interactions: k.interactions.map((y) => (y.id === x.id ? { ...y, [key]: v } : y)) }, now ? { now: true } : undefined);
  const miss = missingFor(x);
  const units = unitsFor(x.min);
  const id = (s) => 'ix-' + x.id + '-' + s;
  const needOpts = ['General'].concat(needs); if (needOpts.indexOf(x.need) < 0) needOpts.push(x.need);
  const ready = !miss.length;
  return (
    <li className={'asc-ix' + (ready ? '' : ' is-incomplete')}>
      <div className="asc-ix-head">
        <span className="asc-ix-num" aria-hidden="true">{num}</span>
        <div className="field asc-ix-what">
          <label htmlFor={id('what')}>Resource or hand-off <span className="sr-only">for interaction {num}</span></label>
          <input className="input" id={id('what')} value={x.what} onChange={(e) => set('what')(e.target.value)} />
        </div>
        <button type="button" className="icon-btn is-danger asc-icon-btn" aria-label={'Remove interaction ' + num + ': ' + x.what} onClick={() => { removeWithUndo(toast, edit, k, 'interactions', x, 'Interaction ' + num); focusLater('h-ix'); }}><Icon name="trash" size={16} /></button>
      </div>
      <div className="asc-ix-grid">
        <div className="field"><label htmlFor={id('need')}>For which need</label>
          <select className="select" id={id('need')} value={x.need} onChange={(e) => set('need', true)(e.target.value)}>{needOpts.map((v) => <option key={v}>{v}</option>)}</select></div>
        <div className="field"><div className="field-top"><label htmlFor={id('type')}>Type</label><span className="req">Required</span></div>
          <select className="select" id={id('type')} value={x.type} onChange={(e) => set('type', true)(e.target.value)}>{IX_TYPES.map((v) => <option key={v} value={v}>{shown(v)}</option>)}</select></div>
        <div className="field"><label htmlFor={id('how')}>How</label>
          <select className="select" id={id('how')} value={x.how} onChange={(e) => set('how', true)(e.target.value)}>{HOWS.map((v) => <option key={v} value={v}>{shown(v)}</option>)}</select></div>
        <div className="field"><div className="field-top"><label htmlFor={id('min')}>Minutes</label><span className="req">Required</span></div>
          <div className="asc-min-row">
            <input className="input" id={id('min')} type="number" min="1" inputMode="numeric" autoFocus={isNew} value={x.min} aria-invalid={!(Number(x.min) > 0) && k.status === 'closed'} aria-describedby={id('units')} onChange={(e) => set('min')(e.target.value)} />
            <span className="asc-units" id={id('units')}>{units ? plural(units, 'unit', 'units') : '15 min = 1 unit'}</span>
          </div></div>
        <div className="field"><div className="field-top"><label htmlFor={id('place')}>Place of service</label><span className="req">Required</span></div>
          <select className="select" id={id('place')} value={x.place} onChange={(e) => set('place', true)(e.target.value)}><option value="">Choose one</option>{PLACES.map((v) => <option key={v} value={v}>{shown(v)}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor={id('notes')}>Notes</label>
        <textarea className="input is-block" id={id('notes')} rows={2} value={x.notes} placeholder="What you told them and what happens next" onChange={(e) => set('notes')(e.target.value)} /></div>
      <div className="asc-ix-foot">
        <Reminders k={k} x={{ ...x, num, edit }} reminders={reminders} />
        {!ready && <span className="asc-ix-status"><Icon name="alert" size={15} />Missing: {miss.join(', ')}</span>}
      </div>
    </li>
  );
}

function FollowUp({ k, edit }) {
  const plan = k.clientId && k.followUp.ok === 'Yes' ? followUpPlan(k, '') : null;
  return (
    <Section id="h-follow" title="Follow-up" icon="calendar" className={k.followUp.ok ? '' : 'is-warn'}>
      <p className="field-label" id="h-fok">Is it OK if we follow up to see how things are going?</p>
      <Options labelId="h-fok" value={k.followUp.ok} options={['Yes', 'No']} onChange={(v) => edit({ followUp: { ok: v } }, { now: true })} />
      {k.followUp.ok === 'Yes' && (
        <>
          <p className="field-label" id="h-fhow">Best way to reach them</p>
          <Options labelId="h-fhow" value={k.followUp.how} options={FOLLOW_HOWS} required onChange={(v) => edit({ followUp: { how: v } }, { now: true })} />
          <div className="form-grid is-2"><Field id="asc-ftime" label="Best time (optional)" value={k.followUp.time} onChange={(v) => edit({ followUp: { time: v } })} placeholder="For example: after 3 PM" /></div>
          {plan && <p className="notice is-good"><Icon name="calendar" size={18} /><span>In Action Items: 7-day on <strong>{weekday(plan[0].due)} {usDate(plan[0].due)}</strong>, 90-day on <strong>{weekday(plan[1].due)} {usDate(plan[1].due)}</strong>.</span></p>}
        </>
      )}
      {k.followUp.ok === 'No' && <p className="asc-hint">No follow-ups scheduled.</p>}
    </Section>
  );
}

function OnSite({ k, edit }) {
  const [doc, setDoc] = useState(DOC_TYPES[0]);
  const stamp = () => usDate(todayISO()) + ' ' + clockTime(new Date().toISOString());
  return (
    <Section id="h-onsite" title="On-site steps" icon="door">
      <p className="field-label" id="h-idc">Check ID</p>
      <Options labelId="h-idc" value={k.onsite.idCheck} options={['Photo ID', 'Insurance card', 'Both', 'None shown']} onChange={(v) => edit({ onsite: { idCheck: v } }, { now: true })} />
      <div className="asc-onsite-row">
        <div><strong>Consent to share with providers</strong>{k.onsite.consentSigned && <p className="asc-hint">Signed {k.onsite.consentSigned}.</p>}</div>
        {!k.onsite.consentSigned ? <button type="button" className="btn-outline" onClick={() => edit({ onsite: { consentSigned: stamp() } }, { now: true })}><Icon name="pen" />Get Signature</button> : <button type="button" className="btn-outline is-done" aria-disabled="true"><Icon name="checkSmall" />Signed</button>}
      </div>
      <div className="asc-onsite-row">
        <div><strong>Documents they brought</strong>
          {k.onsite.docs.length > 0 && <ul className="asc-docs">{k.onsite.docs.map((d) => <li key={d}><Icon name="notes" size={14} />{d}</li>)}</ul>}
        </div>
        <div className="asc-inline-row">
          <label className="sr-only" htmlFor="asc-doc">Document type</label>
          <select className="select" id="asc-doc" value={doc} onChange={(e) => setDoc(e.target.value)}>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <button type="button" className="btn-outline" onClick={() => edit({ onsite: { docs: k.onsite.docs.concat([doc + ', scanned ' + stamp()]) } }, { now: true })}><Icon name="scan" />Scan</button>
        </div>
      </div>
    </Section>
  );
}

export function InteractionsStep({ k, edit, next }) {
  const { actions } = useData();
  const [custom, setCustom] = useState('');
  const [justAdded, setJustAdded] = useState(null);
  const needs = k.needs.map((n) => n.name);
  const add = (p) => {
    const need = p.need === 'MH' ? needForScreen({ need: 'MH' }, k.intake.age) : p.need;
    const x = { id: uid('i'), what: p.what, need: needs.indexOf(need) >= 0 ? need : needs[0] || 'General', type: p.type, how: howFor(k.channel, p.how), min: '', place: defaultPlace(k.channel), notes: '' };
    setJustAdded(x.id); // its minutes field takes focus as soon as it appears
    edit({ interactions: k.interactions.concat([x]) }, { now: true });
  };
  // One box: pick a common resource from the list, or type any other.
  const submit = (e) => {
    e.preventDefault();
    const text = custom.trim();
    if (!text) return;
    const preset = PRESETS.find((p) => p.label.toLowerCase() === text.toLowerCase() || p.what.toLowerCase() === text.toLowerCase());
    add(preset || { what: text, need: needs[0] || 'General', type: IX_TYPES[0], how: 'Number given' });
    setCustom('');
  };
  const t = totals(k.interactions);
  const lookup = (id) => (k.clientId ? actions[id] : k.actions.find((a) => a.id === id));
  const elapsed = minutesBetween(k.startedAt, k.endedAt || new Date().toISOString());
  const have = k.interactions.map((x) => x.what);
  return (
    <div className="view asc-view">
      <StepHeading>Interactions</StepHeading>
      <div className="asc-step-actions"><span className="asc-total" role="status">{totalsText(t)} · {k.status === 'open' ? 'contact so far ' : 'contact '}{elapsed} min</span></div>

      {k.clientId ? <FollowUp k={k} edit={edit} /> : (
        <p className="notice"><Icon name="calendar" size={18} /><span>Follow-ups can be scheduled once the person is identified.</span></p>
      )}
      {k.channel === 'person' && <OnSite k={k} edit={edit} />}

      <Section id="h-ix" title="Service interactions" icon="layers">
        {k.interactions.length ? (
          <ol className="asc-ix-list">
            {k.interactions.map((x, i) => (
              <InteractionCard key={x.id} k={k} x={x} num={i + 1} edit={edit} needs={needs} isNew={x.id === justAdded}
                reminders={k.links.filter((l) => l.ixId === x.id).map((l) => lookup(l.actionId)).filter(Boolean)} />
            ))}
          </ol>
        ) : <p className="asc-empty">No interactions yet.</p>}
        <form className="asc-inline-row" onSubmit={submit}>
          <Field id="asc-custom-ix" label="Add an interaction" value={custom} onChange={setCustom} placeholder="Choose a resource or type one" list="asc-presets" autoComplete="off" />
          <datalist id="asc-presets">{PRESETS.filter((p) => have.indexOf(p.what) < 0).map((p) => <option key={p.label} value={p.label} />)}</datalist>
          <button type="submit" className="btn-outline">Add</button>
        </form>
      </Section>

      {(next || t.incomplete > 0) && <div className="asc-foot">
        {t.incomplete ? <p className="asc-gaps"><Icon name="info" size={16} />{t.incomplete === 1 ? '1 interaction is' : t.incomplete + ' interactions are'} missing minutes or place of service.</p> : <span />}
        {next && <button type="button" className="btn-primary is-icon" onClick={() => navigate({ page: 'contact', id: k.id, step: next[0] })}>Next: {next[1]}<Icon name="arrowRight" /></button>}
      </div>}
    </div>
  );
}
