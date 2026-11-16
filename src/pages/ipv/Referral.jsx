// One IPV referral: who they are, what's happened, IPV action items and case notes, and the arrest behind it.
// The sidebar lists the sections and follows along as the page scrolls.
import React, { useEffect } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useClient, useClientNotes, useClientActions, useMutations } from '../../state/data.js';
import { useReferral, useIpvMutations } from '../../state/ipv.js';
import { Link } from '../../router.jsx';
import { Loaded, Segmented, Tip } from '../../ui/controls.jsx';
import { NoteRow, ActionRow } from '../../ui/records.jsx';
import { ageFrom, isOverdue, plural } from '../../lib.js';
import { useNoteDraft, useActionDraft, NoteComposer, ActionComposer } from '../client/Notes.jsx';
import { REFERRAL_SECTIONS } from '../hub/HubShell.jsx';
import { StatusSelect, isoToUSDate } from './parts.jsx';

const ACTION_FILTERS = { all: () => true, open: (a) => !a.done, overdue: isOverdue, completed: (a) => a.done };

function Section({ id, title, icon, tools, children }) {
  const [closed, setClosed] = usePref('ipv.closed.' + id, false);
  return (
    <section className="panel-card ipv-section" id={'ipv-' + id} aria-labelledby={'ipv-' + id + '-h'}>
      <div className="ipv-section-head">
        <h2 className="ipv-section-title" id={'ipv-' + id + '-h'} tabIndex={-1}><Icon name={icon} size={24} />{title}</h2>
        {!closed && tools}
        <button type="button" className="icon-btn" aria-expanded={!closed} aria-label={(closed ? 'Show ' : 'Hide ') + title} onClick={() => setClosed(!closed)}><Icon name="chevronDown" size={20} className={closed ? '' : 'flip'} /></button>
      </div>
      {!closed && children}
    </section>
  );
}

function Pairs({ rows }) {
  return <dl className="ipv-pairs">{rows.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v || '—'}</dd></React.Fragment>)}</dl>;
}

function Overview({ r, c }) {
  const [tab, setTab] = usePref('ipv.overviewTab', 'personal');
  const a = c.address || {};
  return (
    <Section id="overview" title="Referral Overview" icon="userCircle"
      tools={<Segmented label="Referral overview" value={tab} onChange={setTab} options={[{ id: 'personal', label: 'Personal Information', icon: 'userCircle' }, { id: 'activity', label: 'Client Activity', icon: 'history' }]} />}>
      {tab === 'personal' ? (
        <div className="ipv-cards">
          <div className="info-card"><h3 className="asc-card-title">Demographic Information</h3>
            <Pairs rows={[['Date of Birth', c.dob ? c.dob + ' (' + ageFrom(c.dob) + ' yo)' : ''], ['Race', c.race], ['Ethnicity', c.ethnicity], ['Gender', c.gender], ['Marital Status', c.marital], ['Primary Language', c.language]]} /></div>
          <div className="info-card"><h3 className="asc-card-title">Contact Information</h3>
            <Pairs rows={[['Email', c.email], ['Phone #', c.phone], ['Address', a.street ? <>{a.street}<br />{a.city}, {a.state} {a.zip}</> : '']]} /></div>
        </div>
      ) : (
        <ol className="ipv-activity">
          {r.activity.map((x, n) => <li key={n}><time dateTime={x.at}>{isoToUSDate(x.at)}</time><span>{x.text}{x.byName && <small>{x.byName}</small>}</span></li>)}
        </ol>
      )}
    </Section>
  );
}

function Actions({ c }) {
  const { query, actions } = useClientActions(c.id);
  const draft = useActionDraft(c.id, 'IPV');
  const { deleteAction } = useMutations();
  const [filter, setFilter] = usePref('ipv.actionFilter', 'open');
  const mine = actions.filter((x) => x.tag === 'IPV');
  const counts = {}; Object.keys(ACTION_FILTERS).forEach((k) => { counts[k] = mine.filter(ACTION_FILTERS[k]).length; });
  const list = mine.filter(ACTION_FILTERS[filter]);
  return (
    <Section id="actions" title="Action Items" icon="inbox">
      <Loaded query={query} what="action items">{() => (
        <>
          <Segmented small fill label="Show action items" value={filter} onChange={setFilter}
            options={[{ id: 'all', label: `All Action Items (${counts.all})` }, { id: 'open', label: `Open (${counts.open})` }, { id: 'overdue', label: `Overdue (${counts.overdue})`, icon: 'alert' }, { id: 'completed', label: `Completed (${counts.completed})` }]} />
          <ul className="feed">
            {list.length ? list.map((x) => <ActionRow key={x.id} action={x} showAssignee idPrefix="ipva" onEdit={() => draft.edit(x)} onDelete={() => deleteAction(x).catch(() => {})} />) : <li className="empty">No results.</li>}
          </ul>
          {draft.d ? <ActionComposer draft={draft} onSaved={() => { if (filter === 'completed') setFilter('open'); }} />
            : <div className="align-end"><button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Action Item</button></div>}
        </>
      )}</Loaded>
    </Section>
  );
}

function Notes({ c }) {
  const { query, notes } = useClientNotes(c.id, 'desc');
  const draft = useNoteDraft(c.id, 'IPV');
  const { deleteNote } = useMutations();
  const mine = notes.filter((n) => n.tag === 'IPV');
  return (
    <Section id="notes" title="Case Notes" icon="notes">
      <Loaded query={query} what="case notes">{() => (
        <>
          <ul className="feed">
            {mine.length ? mine.map((n) => <NoteRow key={n.id} note={n} lock clampKey="ipv" onEdit={() => draft.edit(n)} onDelete={() => deleteNote(n).catch(() => {})} />) : <li className="empty">No IPV case notes yet.</li>}
          </ul>
          {draft.d ? <NoteComposer draft={draft} isPage />
            : <div className="align-end"><button type="button" className="btn-outline" onClick={draft.start}><Icon name="plusCircle" />Add New Case Note</button></div>}
        </>
      )}</Loaded>
    </Section>
  );
}

function CaseInfo({ r, c }) {
  const a = r.arrest;
  const others = (c.justice ? c.justice.cases : []).filter((x) => !a || 'OTN-' + x.otn.slice(3) !== a.otn);
  return (
    <Section id="case" title="Case Information" icon="landmark">
      <div className="ipv-cards">
        <div className="info-card"><h3 className="asc-card-title">This Referral</h3>
          <Pairs rows={[['Referred by', r.source === 'arrest' ? 'Arrest data' : 'Entered by DHS'], ['OTN', a && a.otn], ['Arrest date', a && a.date], ['Arresting agency', a && a.agency], ['Charge', a && a.charge], ['Filing date', a && a.filed], ['Effective date', a && a.effective], ['Risk type', r.risk.join(', ') || 'None']]} /></div>
        <div className="info-card"><h3 className="asc-card-title">Other Cases ({others.length})</h3>
          {others.length ? (
            <ul className="ipv-cases">{others.map((x) => <li key={x.otn}><strong>{x.charge}</strong>{x.dv && <span className="ipv-risk">DV</span>}<small>{x.date} · {x.agency} · {x.disp}</small></li>)}</ul>
          ) : <p className="asc-hint">No other cases on record.</p>}
          <Link className="link-btn is-small is-inline" to={{ page: 'client', id: c.id, sub: 'tab', tab: 'program-info' }}><Icon name="external" size={14} />Full justice history on the client profile</Link>
        </div>
      </div>
    </Section>
  );
}

export function ReferralPage({ route }) {
  const { query, referral: r } = useReferral(route.id);
  const { client: c, query: cq } = useClient(r ? r.clientId : null);
  const { move } = useIpvMutations();
  const [, setSection] = usePref('ipv.section', 'overview');
  const [lastView] = usePref('ipv.lastView', 'intake');
  // The sidebar follows the section at the top of the screen.
  useEffect(() => {
    if (!c || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setSection(top.target.id.replace('ipv-', ''));
    }, { rootMargin: '0px 0px -60% 0px' });
    REFERRAL_SECTIONS.forEach(([id]) => { const el = document.getElementById('ipv-' + id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [c && c.id]);
  useEffect(() => { setSection('overview'); }, [route.id]);
  if (query.status === 'error') return <Loaded query={query} what="this referral" block>{() => null}</Loaded>;
  if (!r || !c) return <Loaded query={r ? cq : query} what="this referral" block>{() => null}</Loaded>;
  const name = c.first + ' ' + c.last;
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link className="crumb-link crumb" to={'#ipv/' + lastView}><Icon name="inbox" size={15} />Referrals</Link><Icon name="chevronRight" size={14} />
        <span className="crumb" aria-current="page"><Icon name="users" size={15} />Referral Details</span>
      </nav>
      <section className="client-head ipv-head" aria-label="Referral identity">
        <div className="client-id">
          <div className="avatar"><Icon name="userSolid" size={26} /></div>
          <div className="client-name"><h1>{name}</h1><StatusSelect r={r} name={name} id="ipv-status" onChange={(s) => move([r], s).catch(() => {})} /></div>
        </div>
        <dl className="ids">
          <div><dt>MCI ID<Tip label="About MCI ID">Unique value used for DHS identification purposes</Tip></dt><dd>{c.mci}</dd></div>
          <div><dt>SID<Tip label="About SID">State identification number from the arrest record</Tip></dt><dd>{r.sid}</dd></div>
          <div><dt>DOC #<Tip label="About DOC number">Department of Corrections number, when they've been in custody</Tip></dt><dd>{r.doc || '—'}</dd></div>
        </dl>
      </section>
      <Overview r={r} c={c} />
      <Actions c={c} />
      <Notes c={c} />
      <CaseInfo r={r} c={c} />
      <p className="asc-hint ipv-foot">{plural(r.activity.length, 'event', 'events')} on this referral. <Link className="link-btn is-inline" to={{ page: 'client', id: c.id, sub: 'tab', tab: 'overview' }}>Open {c.first}'s full client profile</Link></p>
    </>
  );
}
