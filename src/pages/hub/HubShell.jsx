// The hub's frame: sidebar navigation, CoLab picker, signed-in user, Report an Issue and Reset sample data.
import React, { useState } from 'react';
import { Icon, BrandMark } from '../../ui/icons.jsx';
import { useModalControls } from '../../state/modal.js';
import { useApi, usePref } from '../../state/store.jsx';
import { useCloseouts } from '../../state/asc.js';
import { SUPERVISOR } from '../../data/asc.js';
import { useMutations, useSession } from '../../state/data.js';
import { Link, navigate, colabHome, ASC_VIEWS, IPV_VIEWS } from '../../router.jsx';

// Narrowing a list to one CoLab. Pages offer this as their own filter; the sidebar menu only navigates.
export const ALL = { item: () => true, client: () => true };
export function colabScope(id, tag) {
  return { item: (x) => x.tag === tag, client: (c) => c.colabs.indexOf(id) >= 0 };
}

function ResetData() {
  const { reset } = useMutations();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) return <button type="button" className="side-link side-report" onClick={() => setConfirm(true)}><Icon name="refresh" size={16} />Reset sample data</button>;
  return (
    <div className="reset-confirm" role="group" aria-label="Reset sample data">
      <span>Erase your changes and restore the sample data?</span>
      <div>
        <button type="button" className="btn-text" onClick={() => setConfirm(false)}>Cancel</button>
        <button type="button" className="btn-solid is-danger" onClick={() => { setConfirm(false); reset(); }}>Reset</button>
      </div>
    </div>
  );
}

// Prototype only: try ASC as a coordinator or as a supervisor (who can edit closed contacts).
export function SwitchUser({ compact }) {
  const { user, staff, switchUsers } = useSession();
  const { switchUser } = useMutations();
  if (!switchUsers || switchUsers.length < 2) return null;
  const people = switchUsers.map((id) => staff.find((s) => s.id === id)).filter(Boolean);
  return (
    <div className={'switch-user' + (compact ? ' is-compact' : '')}>
      <label htmlFor={compact ? 'switch-user-c' : 'switch-user'}>Demo: sign in as</label>
      <select className="side-select" id={compact ? 'switch-user-c' : 'switch-user'} value={user.id} onChange={(e) => switchUser(e.target.value)}>
        {people.map((s) => <option key={s.id} value={s.id}>{s.first} {s.last}{s.role ? ', ' + s.role.replace('ASC ', '').toLowerCase() : ''}</option>)}
      </select>
    </div>
  );
}

const LINKS = [['home', 'home', 'CoLab Home'], ['my-action-items', 'inbox', 'Action Items'], ['my-case-notes', 'notes', 'Case Notes'], ['starred-clients', 'star', 'Starred Clients']];

// Which CoLab a page belongs to. Choosing a CoLab in the menu switches the sidebar to that CoLab's own pages
// (IPV and ASC have their own tools); All CoLabs shows the hub pages.
export const toolOf = (route) => (route.page === 'asc' || route.page === 'contact' ? 'ASC' : route.page === 'ipv' || route.page === 'referral' ? 'IPV' : route.page === 'colab' ? route.id : '');

function SubLinks({ label, items }) {
  return (
    <ul className="side-sub" aria-label={label}>
      {items.map(([to, text, current, extra]) => <li key={text}><Link className="side-sublink" to={to} aria-current={current ? 'page' : undefined}>{text}{extra}</Link></li>)}
    </ul>
  );
}

function IpvNav({ route }) {
  const { toast } = useApi();
  const [section, setSection] = usePref('ipv.section', 'overview');
  const [lastView] = usePref('ipv.lastView', 'intake');
  const go = (id) => { setSection(id); const el = document.getElementById('ipv-' + id); if (el) { el.scrollIntoView({ block: 'start' }); const h = el.querySelector('h2'); if (h) h.focus({ preventScroll: true }); } };
  return (
    <>
      <Link className={'side-link' + (route.page === 'ipv' ? ' is-open' : '')} to={'#ipv/' + lastView}><Icon name="inbox" size={18} />Referrals</Link>
      {route.page === 'ipv' && <SubLinks label="Referral views" items={Object.keys(IPV_VIEWS).map((v) => ['#ipv/' + v, IPV_VIEWS[v], route.view === v])} />}
      <button type="button" className="side-link" onClick={() => toast('IPV reports open in the county’s reporting site. They aren’t part of this prototype.')}><Icon name="chart" size={18} />Reports<Icon name="external" size={14} /></button>
      {route.page === 'referral' && (
        <>
          <div className="side-divider" role="separator" />
          <span className="side-link is-open"><Icon name="users" size={18} />Referral Profile</span>
          <ul className="side-sub" aria-label="Referral profile sections">
            {REFERRAL_SECTIONS.map(([id, text]) => <li key={id}><button type="button" className="side-sublink" aria-current={section === id ? 'location' : undefined} onClick={() => go(id)}>{text}</button></li>)}
          </ul>
        </>
      )}
    </>
  );
}
export const REFERRAL_SECTIONS = [['overview', 'Referral Overview'], ['actions', 'Action Items'], ['notes', 'Case Notes'], ['case', 'Case Information']];

function AscSideNav({ route }) {
  const { user, me } = useSession();
  const sup = user.role === SUPERVISOR;
  const { closeouts } = useCloseouts();
  const waiting = closeouts.filter((r) => r.status === 'pending' && (sup || r.by === me)).length;
  const [saved] = usePref('asc.view', 'in-progress');
  const onContacts = route.page === 'asc' && !route.sub;
  const view = route.view || saved;
  const items = [['closeouts', 'door', 'Close-Outs', waiting]].concat(sup ? [['team', 'users', 'Team'], ['reporting', 'chart', 'State Reporting']] : []);
  return (
    <>
      <Link className={'side-link' + (onContacts ? ' is-open' : '')} to="#asc"><Icon name="headset" size={18} />Contacts</Link>
      {onContacts && <SubLinks label="Contact views" items={Object.keys(ASC_VIEWS).map((v) => ['#asc/' + v, ASC_VIEWS[v], view === v])} />}
      {items.map(([id, ic, label, n]) => (
        <Link key={id} className="side-link" to={'#asc/' + id} aria-current={route.page === 'asc' && route.sub === id ? 'page' : undefined}>
          <Icon name={ic} size={18} />{label}{n > 0 && <span className="side-count" aria-label={n + ' waiting'}>{n}</span>}
        </Link>
      ))}
    </>
  );
}

export function HubShell({ route, children }) {
  const { openModal } = useModalControls();
  const { user, colabs, canReset } = useSession();
  const tool = toolOf(route);
  return (
    <div className="hub">
      <nav className="sidebar" aria-label="CoLab">
        <Link className="brand" to="#home"><BrandMark />CoLab</Link>
        <label className="sr-only" htmlFor="choose-colab">Go to a CoLab</label>
        <select className="side-select is-top" id="choose-colab" value={tool} onChange={(e) => navigate(colabHome(e.target.value))}>
          <option value="">All CoLabs</option>
          {colabs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="side-nav">
          {tool === 'IPV' ? <IpvNav route={route} /> : tool === 'ASC' ? <AscSideNav route={route} /> : LINKS.map(([id, ic, label]) => (
            <Link key={id} className="side-link" to={'#' + id} aria-current={route.page === id ? 'page' : undefined}><Icon name={ic} size={18} />{label}</Link>
          ))}
        </div>
        <div className="side-user"><span className="avatar-sm">{user.initials}</span><div><strong>{user.first} {user.last}</strong><span>{user.role || user.org}</span></div></div>
        <SwitchUser />
        <button type="button" className="side-link side-report" onClick={() => openModal('issue')}><Icon name="wrench" size={16} />Report an Issue</button>
        {canReset && <ResetData />}
      </nav>
      <main className="hub-main" id="main" tabIndex={-1}>{children}</main>
    </div>
  );
}

export function SearchLaunch() {
  const { openModal } = useModalControls();
  return <button type="button" className="search-launch" onClick={() => openModal('search')}><Icon name="search" size={18} />Search for Client</button>;
}
