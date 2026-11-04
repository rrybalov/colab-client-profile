// Entry point. Bundled with esbuild into app.js (see package.json).
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { readConfig } from './config.js';
import { createDataSource } from './data/index.js';
import { StoreProvider, useData } from './state/store.jsx';
import { useSessionQuery } from './state/data.js';
import { useRoute, HUB_PAGES, CLIENT_TABS } from './router.jsx';
import { HubShell } from './pages/hub/HubShell.jsx';
import { Home } from './pages/hub/Home.jsx';
import { MyActions, MyNotes } from './pages/hub/MyWork.jsx';
import { Starred } from './pages/hub/Starred.jsx';
import { ClientPage } from './pages/client/ClientPage.jsx';
import { Modals } from './modals/index.jsx';
import { Toast, Loading, LoadError } from './ui/controls.jsx';
import { fullName } from './lib.js';

const HUB = { home: Home, 'my-action-items': MyActions, 'my-case-notes': MyNotes, 'starred-clients': Starred };
const SUBPAGES = { notes: 'All Case Notes', actions: 'All Action Items', service: 'Service Details', provider: 'Provider Details' };

function useTitle(route) {
  const { clients } = useData();
  let title = HUB_PAGES[route.page] || 'CoLab';
  if (route.page === 'client') {
    const c = clients[route.id];
    const part = SUBPAGES[route.sub] || (CLIENT_TABS.find((t) => t[0] === route.tab) || [0, 'Client'])[1];
    title = (c ? fullName(c) : 'Client') + ' · ' + part;
  }
  useEffect(() => { document.title = title + ' · CoLab'; }, [title]);
}

function App() {
  const route = useRoute();
  const session = useSessionQuery();
  useTitle(route);
  // The skip link focuses the page content directly; a plain #main link would be read as a route.
  const skip = (e) => { e.preventDefault(); const m = document.getElementById('main'); if (m) m.focus(); };
  if (!session.ready) {
    return <div className="app-gate">{session.status === 'error' ? <LoadError error={session.error} retry={session.retry} what="CoLab" /> : <Loading label="Loading CoLab" block />}</div>;
  }
  let page;
  if (route.page === 'client') page = <ClientPage route={route} />;
  else { const P = HUB[route.page] || Home; page = <HubShell page={route.page}><P /></HubShell>; }
  return <><a className="skip-link" href="#main" onClick={skip}>Skip to main content</a>{page}<Modals /><Toast /></>;
}

const source = createDataSource(readConfig());
createRoot(document.getElementById('app')).render(<StoreProvider source={source}><App /></StoreProvider>);
