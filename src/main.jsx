// Entry point. Bundled with esbuild into app.js (see package.json).
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { readConfig } from './config.js';
import { createDataSource } from './data/index.js';
import { StoreProvider, useData } from './state/store.jsx';
import { useSessionQuery } from './state/data.js';
import { useRoute, HUB_PAGES, CLIENT_TABS, ASC_PAGES, ASC_VIEWS, IPV_VIEWS } from './router.jsx';
import { HubShell } from './pages/hub/HubShell.jsx';
import { Home, ColabHome } from './pages/hub/Home.jsx';
import { MyActions, MyNotes } from './pages/hub/MyWork.jsx';
import { Starred } from './pages/hub/Starred.jsx';
import { ClientPage } from './pages/client/ClientPage.jsx';
import { AscHome } from './pages/asc/AscHome.jsx';
import { ContactPage } from './pages/asc/ContactPage.jsx';
import { IpvHome } from './pages/ipv/IpvHome.jsx';
import { ReferralPage } from './pages/ipv/Referral.jsx';
import { Modals } from './modals/index.jsx';
import { Toast, Loading, LoadError } from './ui/controls.jsx';
import { fullName } from './lib.js';

const HUB = { home: Home, 'my-action-items': MyActions, 'my-case-notes': MyNotes, 'starred-clients': Starred, asc: AscHome };
const STEP_TITLES = { intake: 'Intake', identify: 'Identify', interactions: 'Interactions', 'wrap-up': 'Wrap Up' };
const SUBPAGES = { notes: 'All Case Notes', actions: 'All Action Items', addresses: 'Address History', service: 'Service Details', provider: 'Provider Details' };

function useTitle(route) {
  const { clients, contacts, queries } = useData();
  const session = queries.session && queries.session.data;
  const colab = route.page === 'colab' && session ? session.colabs.find((x) => x.id === route.id) : null;
  let title = route.page === 'colab' ? (colab ? colab.name : 'CoLab') : HUB_PAGES[route.page] || 'CoLab';
  if (route.page === 'asc' && route.sub) title = 'ASC ' + ASC_PAGES[route.sub];
  if (route.page === 'asc' && route.view) title = 'ASC Contacts · ' + ASC_VIEWS[route.view];
  if (route.page === 'ipv') title = 'IPV · ' + IPV_VIEWS[route.view];
  if (route.page === 'referral') { const r = queries['ipv-referral:' + route.id]; const rc = r && r.data && r.data.client; title = (rc ? rc.first + ' ' + rc.last : 'Referral') + ' · IPV'; }
  if (route.page === 'client') {
    const c = clients[route.id];
    const part = SUBPAGES[route.sub] || (CLIENT_TABS.find((t) => t[0] === route.tab) || [0, 'Client'])[1];
    title = (c ? fullName(c) : 'Client') + ' · ' + part;
  } else if (route.page === 'contact') {
    const k = contacts[route.id];
    title = (k ? k.ref : 'Contact') + ' · ' + STEP_TITLES[route.step] + ' · ASC';
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
  else if (route.page === 'contact') page = <ContactPage route={route} />;
  else if (route.page === 'colab') page = <HubShell route={route}><ColabHome id={route.id} /></HubShell>;
  else if (route.page === 'ipv') page = <HubShell route={route}><IpvHome route={route} /></HubShell>;
  else if (route.page === 'referral') page = <HubShell route={route}><ReferralPage route={route} /></HubShell>;
  else { const P = HUB[route.page] || Home; page = <HubShell route={route}><P route={route} /></HubShell>; }
  return <><a className="skip-link" href="#main" onClick={skip}>Skip to main content</a>{page}<Modals /><Toast /></>;
}

const source = createDataSource(readConfig());
createRoot(document.getElementById('app')).render(<StoreProvider source={source}><App /></StoreProvider>);
