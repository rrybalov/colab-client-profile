// Entry point. Bundled with esbuild into app.js (see package.json).
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider, useStore } from './store.jsx';
import { useRoute, HUB_PAGES, CLIENT_TABS } from './router.jsx';
import { HubShell, Home, MyActions, MyNotes, Starred } from './pages/hub.jsx';
import { ClientPage } from './pages/client.jsx';
import { Modals } from './modals.jsx';
import { Toast } from './ui.jsx';
import { fullName } from './lib.js';

const HUB = { home: Home, 'my-action-items': MyActions, 'my-case-notes': MyNotes, 'starred-clients': Starred };

function useTitle(route) {
  const { state } = useStore();
  let title = HUB_PAGES[route.page] || 'CoLab';
  if (route.page === 'client') {
    const c = state.db.clients.find((x) => x.id === route.id);
    const part = route.sub === 'notes' ? 'All Case Notes' : route.sub === 'actions' ? 'All Action Items'
      : route.sub === 'service' ? 'Service Details' : route.sub === 'provider' ? 'Provider Details'
        : (CLIENT_TABS.find((t) => t[0] === route.tab) || [0, 'Client'])[1];
    title = (c ? fullName(c) : 'Client not found') + ' · ' + part;
  }
  useEffect(() => { document.title = title + ' · CoLab'; }, [title]);
}

function App() {
  const route = useRoute();
  useTitle(route);
  let page;
  if (route.page === 'client') page = <ClientPage route={route} />;
  else { const P = HUB[route.page] || Home; page = <HubShell page={route.page}><P /></HubShell>; }
  // The skip link focuses the page content directly; a plain #main link would be read as a route.
  const skip = (e) => { e.preventDefault(); const m = document.getElementById('main'); if (m) m.focus(); };
  return <><a className="skip-link" href="#main" onClick={skip}>Skip to main content</a>{page}<Modals /><Toast /></>;
}

createRoot(document.getElementById('app')).render(<StoreProvider><App /></StoreProvider>);
