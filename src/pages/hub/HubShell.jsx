// The hub's frame: sidebar navigation, CoLab picker, signed-in user, Report an Issue and Reset sample data.
import React, { useState } from 'react';
import { Icon, BrandMark } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useModalControls } from '../../state/modal.js';
import { useMutations, useSession } from '../../state/data.js';
import { Link } from '../../router.jsx';

// The CoLab chosen in the sidebar narrows every hub page.
export function useColabScope() {
  const { colabTag } = useSession();
  const [colab, setColab] = usePref('colab', '');
  const tag = colab ? colabTag(colab) : '';
  return {
    colab, setColab,
    item: (x) => !colab || x.tag === tag,
    client: (c) => !colab || c.colabs.indexOf(colab) >= 0
  };
}

export function ColabNotice() {
  const { colab } = useColabScope();
  const { colabName } = useSession();
  if (!colab) return null;
  return <p className="notice"><Icon name="funnel" size={14} /><span>Showing {colabName(colab)} only. Choose All CoLabs in the menu to see everything.</span></p>;
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

const LINKS = [['home', 'home', 'CoLab Home'], ['my-action-items', 'inbox', 'My Action Items'], ['my-case-notes', 'notes', 'My Case Notes'], ['starred-clients', 'star', 'Starred Clients']];

export function HubShell({ page, children }) {
  const { openModal } = useModalControls();
  const { user, colabs, canReset } = useSession();
  const { colab, setColab } = useColabScope();
  return (
    <div className="hub">
      <nav className="sidebar" aria-label="CoLab">
        <Link className="brand" to="#home"><BrandMark />CoLab</Link>
        {LINKS.map(([id, ic, label]) => (
          <Link key={id} className="side-link" to={'#' + id} aria-current={page === id ? 'page' : undefined}><Icon name={ic} size={18} />{label}</Link>
        ))}
        <div className="side-divider" role="separator" />
        <label className="sr-only" htmlFor="choose-colab">Choose CoLab</label>
        <select className="side-select" id="choose-colab" value={colab} onChange={(e) => setColab(e.target.value)}>
          <option value="">All CoLabs</option>
          {colabs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(colab === 'ASC' || page === 'asc') && (
          <Link className="side-link side-asc" to="#asc" aria-current={page === 'asc' ? 'page' : undefined}><Icon name="headset" size={18} />ASC Contacts</Link>
        )}
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
