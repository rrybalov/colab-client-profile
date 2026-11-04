// The client profile's frame: top bar, left rail, main column and the notes panel.
import React from 'react';
import { Icon, BrandMark } from '../../ui/icons.jsx';
import { useApi, usePref } from '../../state/store.jsx';
import { useSession } from '../../state/data.js';
import { Link } from '../../router.jsx';
import { copyText } from '../../ui/records.jsx';
import { useModalControls } from '../../state/modal.js';
import { fullName } from '../../lib.js';
import { tabRoute } from './routes.js';
import { Panel } from './Panel.jsx';

// panelKey: which saved open/closed state the notes panel uses. Detail pages and the Services and Benefits
// tabs start with it closed, because their tables need the width.
export function Shell({ client, clientId, panelKey, children }) {
  const { toast } = useApi();
  const { openModal } = useModalControls();
  const { user } = useSession();
  const defaultOpen = !!panelKey && panelKey !== 'services' && panelKey !== 'benefits' && panelKey !== 'detail';
  const [panelOpen, setPanelOpen] = usePref('panel.' + (panelKey || 'none'), defaultOpen);
  const hasPanel = !!(client && panelKey);
  return (
    <div className="app"><div className="shell">
      <header className="topbar">
        <Link className="brand" to="#home"><BrandMark />CoLab</Link>
        <nav className="top-actions" aria-label="Profile actions">
          <button type="button" className="btn-ghost" onClick={() => openModal('issue')}><Icon name="bug" />Report Issue</button>
          {client && <button type="button" className="btn-ghost" onClick={() => copyText(toast, location.href, 'Profile link')}><Icon name="mail" />Share Profile</button>}
          {client && <div className="user-chip"><Icon name={client.household ? 'users' : 'user'} size={20} /><div><strong>{fullName(client)}</strong><span>MCI ID: {client.mci}</span></div></div>}
        </nav>
      </header>
      <div className="body">
        <nav className="rail" aria-label="Main">
          <Link className="rail-btn" to="#home" aria-label="CoLab Home" data-tip="CoLab Home"><Icon name="home" size={20} /></Link>
          <Link className="rail-btn" to="#my-action-items" aria-label="My Action Items" data-tip="My Action Items"><Icon name="inbox" size={20} /></Link>
          <Link className="rail-btn" to="#starred-clients" aria-label="Starred Clients" data-tip="Starred Clients"><Icon name="star" size={20} /></Link>
          <div className="rail-divider" />
          {clientId && <Link className="rail-btn" to={tabRoute(clientId, 'overview')} aria-label="Client profile" aria-current="page" data-tip="Client profile"><Icon name="user" size={20} /></Link>}
          <div className="rail-avatar" aria-label={'Signed in as ' + user.first + ' ' + user.last}>{user.initials}</div>
        </nav>
        <div className={'work' + (hasPanel && !panelOpen ? ' is-panel-closed' : '')}>
          <main className="main" id="main" tabIndex={-1}>{children}</main>
          {hasPanel && <Panel client={client} open={panelOpen} setOpen={setPanelOpen} />}
        </div>
      </div>
    </div></div>
  );
}
