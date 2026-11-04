// Breadcrumb and the client's identity block.
import React, { useEffect, useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useApi, usePref } from '../../state/store.jsx';
import { useMutations, useSession } from '../../state/data.js';
import { Link } from '../../router.jsx';
import { Tip } from '../../ui/controls.jsx';
import { StarButton, copyText } from '../../ui/records.jsx';
import { fullName } from '../../lib.js';
import { tabRoute } from './routes.js';

// The full SSN is fetched only when someone asks for it (so a real system can log each request), and it is
// deliberately not saved: it hides again on reload or when the client changes.
function Ssn({ client }) {
  const { revealSsn } = useMutations();
  const { toast } = useApi();
  const [full, setFull] = useState(null);
  const [shown, setShown] = useState(false);
  useEffect(() => { setFull(null); setShown(false); }, [client.id]);
  const fetchFull = () => (full ? Promise.resolve(full) : revealSsn(client.id).then((v) => { setFull(v); return v; }));
  const fail = (e) => toast((e && e.message) || "Couldn't load the SSN.", { error: true });
  const toggle = () => { if (shown) setShown(false); else fetchFull().then(() => setShown(true), fail); };
  const copy = () => fetchFull().then((v) => copyText(toast, v, 'SSN'), fail);
  return (
    <>
      <span>{shown && full ? full : '••• •• ' + client.ssn4}</span>
      <button type="button" className="icon-btn" aria-pressed={shown} aria-label={shown ? 'Hide SSN' : 'Show SSN'} onClick={toggle}><Icon name="eye" size={15} /></button>
      <button type="button" className="icon-btn is-action" onClick={copy} aria-label="Copy SSN"><Icon name="copy" size={15} /></button>
    </>
  );
}

export function Crumbs({ clientId, crumb, crumbIcon }) {
  const [lastTab] = usePref('client.lastTab.' + clientId, 'overview');
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link className="crumb-link crumb" to="#home"><Icon name="home" size={15} />Home</Link><Icon name="chevronRight" size={14} />
      {crumb ? (
        <><Link className="crumb-link crumb" to={tabRoute(clientId, lastTab)}><Icon name="users" size={15} />Client Details</Link><Icon name="chevronRight" size={14} />
          <span className="crumb" aria-current="page"><Icon name={crumbIcon} size={15} />{crumb}</span></>
      ) : <span className="crumb" aria-current="page"><Icon name="users" size={15} />Client Details</span>}
    </nav>
  );
}

export function ClientHeader({ client: c }) {
  const { colabTag } = useSession();
  return (
    <section className="client-head" aria-label="Client identity">
      <div className="client-id">
        <div className="avatar"><Icon name={c.household ? 'users' : 'userSolid'} size={26} /></div>
        <div>
          <div className="client-name"><h1>{fullName(c)}</h1><StarButton client={c} size={24} /></div>
          <div className="tags">{c.colabs.map((t) => <span className="tag" key={t}>{colabTag(t)}</span>)}</div>
        </div>
      </div>
      <dl className="ids">
        <div><dt>MCI ID<Tip label="About MCI ID">Unique value used for DHS identification purposes</Tip></dt><dd>{c.mci}</dd></div>
        <div><dt>SSN<Tip label="About SSN">Unique value across all benefits and services</Tip></dt><dd><Ssn client={c} /></dd></div>
        <div><dt>MA ID &amp; PA DHS ID<Tip label="About MA ID and PA DHS ID">This is the individual ID provided by PA DHS</Tip></dt><dd>{c.dhs}</dd></div>
        <div><dt>DPW Record #<Tip label="About DPW Record number">Record number from the state's legacy Department of Public Welfare system.</Tip></dt><dd>{c.dpw}</dd></div>
      </dl>
    </section>
  );
}
