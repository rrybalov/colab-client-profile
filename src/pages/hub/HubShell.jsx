// The hub's frame: sidebar navigation, CoLab picker, signed-in user, Report an Issue and Reset sample data.
import React, { useState } from 'react';
import { Icon, BrandMark } from '../../ui/icons.jsx';
import { useModalControls } from '../../state/modal.js';
import { useMutations, useSession } from '../../state/data.js';
import { Link, navigate, colabHome } from '../../router.jsx';

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

// The menu goes to a CoLab's own home page: ASC opens ASC Contacts; All CoLabs opens CoLab Home.
export function HubShell({ page, colab: current, children }) {
  const { openModal } = useModalControls();
  const { user, colabs, canReset } = useSession();
  const colab = page === 'asc' ? 'ASC' : page === 'colab' ? current : '';
  return (
    <div className="hub">
      <nav className="sidebar" aria-label="CoLab">
        <Link className="brand" to="#home"><BrandMark />CoLab</Link>
        {LINKS.map(([id, ic, label]) => (
          <Link key={id} className="side-link" to={'#' + id} aria-current={page === id ? 'page' : undefined}><Icon name={ic} size={18} />{label}</Link>
        ))}
        <div className="side-divider" role="separator" />
        <label className="sr-only" htmlFor="choose-colab">Go to a CoLab</label>
        <select className="side-select" id="choose-colab" value={colab} onChange={(e) => navigate(colabHome(e.target.value))}>
          <option value="">All CoLabs</option>
          {colabs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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
