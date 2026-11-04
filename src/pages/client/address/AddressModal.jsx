// Address Details: the most recent verified address, and every other address open at the same time.
import React from 'react';
import { Icon } from '../../../ui/icons.jsx';
import { usePref } from '../../../state/store.jsx';
import { useClient } from '../../../state/data.js';
import { navigate } from '../../../router.jsx';
import { Modal, Loaded } from '../../../ui/controls.jsx';
import { currentAddresses, longDate, mostRecent, stateOf } from '../../../data/addresses.js';
import { AddressCard, SourceTags } from './parts.jsx';

export const historyRoute = (id) => ({ page: 'client', id, sub: 'addresses' });

function Body({ client, onClose }) {
  const [openId, setOpenId] = usePref('address.modalOpen.' + client.id, null);
  const top = mostRecent(client.addresses);
  const others = currentAddresses(client.addresses).filter((a) => a !== top);
  const a = client.address;
  const toHistory = () => { onClose(); navigate(historyRoute(client.id)); };
  if (!top) {
    return (
      <>
        <p className="addr-empty">No address on file for this client.</p>
        <div className="modal-foot"><button type="button" className="btn-text" onClick={onClose}>Close</button></div>
      </>
    );
  }
  return (
    <>
      <div className="addr-modal-body">
        <section aria-labelledby="mrv-h">
          <h3 className="addr-overline" id="mrv-h">Most Recent Verified</h3>
          <p className="addr-title">{top.street}, {top.city}, {stateOf(top.county)} {top.zip}</p>
          <p className="addr-sub">{longDate(top.start)} – {top.end ? longDate(top.end) : 'Present'}{top.effDate ? ' · Effective ' + longDate(top.effDate) : ''}</p>
          <ul className="kv-list addr-facts">
            {a.facility && <li><Icon name="pin" size={14} />{a.facility}</li>}
            {a.ward && <li><Icon name="landmark" size={14} />{a.ward}</li>}
            <li><Icon name="book" size={14} />{top.schoolDistrict || '—'}</li>
          </ul>
          <div className="addr-source-line">Source: <SourceTags addr={top} /><span>As of {longDate(top.effDate || top.start)}</span></div>
        </section>
        {others.length > 0 && (
          <section aria-labelledby="conc-h" className="addr-concurrent">
            <h3 className="addr-overline is-icon" id="conc-h"><Icon name="info" size={16} />Concurrent Addresses ({others.length})</h3>
            <p className="addr-help">Other addresses are open for this client during the same period. Sources may disagree; review before relying on a single address.</p>
            <div className="addr-stack">
              {others.map((x) => <AddressCard key={x.id} addr={x} open={openId === x.id} onToggle={() => setOpenId(openId === x.id ? null : x.id)} />)}
            </div>
          </section>
        )}
      </div>
      <div className="modal-foot is-end">
        <button type="button" className="btn-text" onClick={onClose}>Close</button>
        <button type="button" className="btn-primary is-icon" data-autofocus onClick={toHistory}>View Full Address History<Icon name="external" size={16} /></button>
      </div>
    </>
  );
}

export function AddressModal({ onClose, clientId }) {
  const { query, client } = useClient(clientId);
  return (
    <Modal id="address" title="Address Details" narrow onClose={onClose}>
      <Loaded query={client ? { ...query, ready: true } : query} what="address details">{() => <Body client={client} onClose={onClose} />}</Loaded>
    </Modal>
  );
}
