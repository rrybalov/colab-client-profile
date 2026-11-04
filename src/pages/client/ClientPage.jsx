// Picks the client view for a route: a profile tab, service or provider details, or a full-page list.
import React, { useEffect } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useClient } from '../../state/data.js';
import { Link, CLIENT_TABS } from '../../router.jsx';
import { Loading, LoadError } from '../../ui/controls.jsx';
import { fullName } from '../../lib.js';
import { tabRoute } from './routes.js';
import { Shell } from './Shell.jsx';
import { Crumbs, ClientHeader } from './Header.jsx';
import { Services } from './Services.jsx';
import { Overview } from './Overview.jsx';
import { Program } from './Program.jsx';
import { Providers } from './Providers.jsx';
import { ServiceDetail, ProviderDetail } from './Details.jsx';
import { ClientNotesPage, ClientActionsPage } from './Notes.jsx';
import { AddressHistory } from './address/AddressHistory.jsx';

function Benefits() {
  return <div className="empty-box"><h2 className="title" style={{ fontSize: 18, fontWeight: 600 }}>Benefits</h2><p>This tab is not designed yet. Benefit enrollments currently show under Client Overview › Program Enrollment.</p></div>;
}
const TAB_VIEWS = { services: Services, overview: Overview, 'program-info': Program, providers: Providers, benefits: Benefits };

function Missing({ what, client }) {
  return <div className="empty-box"><p>This {what} isn't in {fullName(client)}'s record.</p><Link className="link-btn is-inline" to={tabRoute(client.id, 'services')}>Back to Services</Link></div>;
}

function NotFound() {
  return (
    <div className="empty-box" style={{ marginTop: 24 }}>
      <h1 className="title" style={{ fontSize: 18 }}>Client not found</h1>
      <p>This client isn't in the records you can see. They may have been removed, or the link may be wrong.</p>
      <Link className="btn-outline" to="#home"><Icon name="home" />Back to CoLab Home</Link>
    </div>
  );
}

const CRUMBS = { notes: ['All Case Notes', 'notes'], actions: ['All Action Items', 'inbox'], addresses: ['Address History', 'pin'], service: ['Service Details', 'layers'], provider: ['Provider Details', 'lifebuoy'] };

export function ClientPage({ route }) {
  const { query, client } = useClient(route.id);
  const [, setLastTab] = usePref('client.lastTab.' + route.id, 'overview');
  useEffect(() => { if (route.sub === 'tab') setLastTab(route.tab); }, [route.sub, route.tab, route.id]);
  const crumb = CRUMBS[route.sub];
  const panelKey = route.sub === 'tab' ? route.tab : ['service', 'provider', 'addresses'].includes(route.sub) ? 'detail' : null;

  if (!client) {
    const notFound = query.status === 'error' && query.error && query.error.status === 404;
    return (
      <Shell client={null} clientId={notFound ? null : route.id}>
        {notFound ? <NotFound />
          : query.status === 'error' ? <LoadError error={query.error} retry={query.retry} what="this client" />
            : <Loading label="Loading client" block />}
      </Shell>
    );
  }

  let body;
  if (route.sub === 'notes') body = <ClientNotesPage client={client} />;
  else if (route.sub === 'actions') body = <ClientActionsPage client={client} />;
  else if (route.sub === 'addresses') body = <section className="card"><AddressHistory client={client} /></section>;
  else if (route.sub === 'service') {
    const svc = client.services.find((s) => s.id === route.key);
    body = <section className="card">{svc ? <ServiceDetail client={client} svc={svc} /> : <Missing what="service" client={client} />}</section>;
  } else if (route.sub === 'provider') {
    const has = client.instances.some((i) => i.provider === route.key);
    body = <section className="card">{has ? <ProviderDetail client={client} name={route.key} /> : <Missing what="provider" client={client} />}</section>;
  } else {
    const View = TAB_VIEWS[route.tab] || Overview;
    body = (
      <section className="card">
        <div className="tabs-wrap">
          <nav className="tabs" aria-label="Client sections">
            {CLIENT_TABS.map(([id, label]) => <Link key={id} className="tab" to={tabRoute(client.id, id)} focus={false} aria-current={route.tab === id ? 'page' : undefined}>{label}</Link>)}
          </nav>
        </div>
        <View client={client} />
      </section>
    );
  }
  return (
    <Shell client={client} clientId={client.id} panelKey={panelKey}>
      <Crumbs clientId={client.id} crumb={crumb && crumb[0]} crumbIcon={crumb && crumb[1]} />
      <ClientHeader client={client} />
      {body}
    </Shell>
  );
}
