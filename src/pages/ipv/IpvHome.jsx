// IPV High Risk Team Review: everyone referred after an intimate partner violence arrest, by status.
// Intake (new, from arrest data or entered by DHS) → For Review (on the next case conference's list) → Reviewed.
import React, { useEffect, useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { useReferrals, useIpvMutations, IPV_STATUS } from '../../state/ipv.js';
import { Link, IPV_VIEWS } from '../../router.jsx';
import { Loaded, Table, ViewBar, usePaged, Pager, SortHead, useSort, SearchBox } from '../../ui/controls.jsx';
import { ageFrom, sortRows, plural } from '../../lib.js';
import { isoToUSDate, StatusSelect, STATUS_ICON } from './parts.jsx';

const VIEWS = {
  all: { title: 'All Referrals', text: 'All clients referred for IPV review', dates: 'activity' },
  intake: { title: 'Intake', text: 'New clients added via arrest data or manual DHS entry', dates: 'filing' },
  review: { title: 'For Review', text: 'Clients scheduled for review at the upcoming IPV meeting', dates: 'filing' },
  reviewed: { title: 'Previously Reviewed Clients', text: 'Clients reviewed in prior IPV meetings', dates: 'activity' }
};
const AGENCY = [['all', 'All'], ['pittsburgh', 'Pittsburgh Police'], ['other', 'Other Police Departments']];
const COLS = {
  name: { key: 'sortName', label: 'Client Information', type: 'text' },
  filed: { key: 'filedKey', label: 'Filing Date', type: 'num' },
  effective: { key: 'effectiveKey', label: 'Effective Date', type: 'num' },
  activity: { key: 'lastKey', label: 'Last Activity', type: 'num' }
};
const SPEC = { grid: '28px minmax(130px,1.4fr) minmax(128px,1fr) minmax(124px,1.2fr) 86px 90px minmax(104px,1fr) 144px', min: 900 };
const usKey = (us) => { const p = String(us || '').split('/'); return p.length === 3 ? Number(p[2] + p[0] + p[1]) : 0; };
const csvCell = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

function download(rows, view) {
  const head = ['Last name', 'First name', 'Date of birth', 'MCI ID', 'OTN', 'SID', 'Arrest date', 'Arresting agency', 'Charge', 'Filing date', 'Effective date', 'Risk type', 'Status', 'Last activity'];
  const lines = [head.join(',')].concat(rows.map((r) => [r.client.last, r.client.first, r.client.dob, r.mci, r.arrest ? r.arrest.otn : '', r.sid, r.arrest ? r.arrest.date : '', r.arrest ? r.arrest.agency : '', r.arrest ? r.arrest.charge : '', r.arrest ? r.arrest.filed : '', r.arrest ? r.arrest.effective : '', r.risk.join('; '), IPV_STATUS[r.status], isoToUSDate(r.lastActivity)].map(csvCell).join(',')));
  const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'ipv-referrals-' + view + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function IpvHome({ route }) {
  const view = route.view || 'intake';
  const v = VIEWS[view];
  const { query, referrals } = useReferrals();
  const { move } = useIpvMutations();
  const [agency, setAgency] = usePref('ipv.agency', 'all');
  const [search, setSearch] = usePref('ipv.query', '');
  const [sort, onSort] = useSort('ipv.' + view, v.dates === 'filing' ? { key: 'effectiveKey', dir: 'desc' } : { key: 'lastKey', dir: 'desc' });
  const [picked, setPicked] = useState({});
  const [, setLastView] = usePref('ipv.lastView', 'intake');
  useEffect(() => { setLastView(view); setPicked({}); }, [view]);
  const [busy, setBusy] = useState(false);
  const rows = referrals.filter((r) => r.client).map((r) => ({
    ...r, sortName: r.client.last + ' ' + r.client.first, filedKey: usKey(r.arrest && r.arrest.filed), effectiveKey: usKey(r.arrest && r.arrest.effective), lastKey: new Date(r.lastActivity || 0).getTime()
  }));
  const q = search.trim().toLowerCase();
  const inView = rows.filter((r) => view === 'all' || r.status === view);
  const list = sortRows(inView.filter((r) => (agency === 'all' || r.agencyGroup === agency)
    && (!q || [r.client.first, r.client.last, r.client.first + ' ' + r.client.last, r.sid, r.mci, r.arrest ? r.arrest.otn : ''].join(' ').toLowerCase().indexOf(q) >= 0)), sort, Object.values(COLS));
  const p = usePaged('ipv.' + view, list, [25, 50, 100]);
  const chosen = list.filter((r) => picked[r.id]);
  const allOnPage = p.items.length > 0 && p.items.every((r) => picked[r.id]);
  const togglePage = () => { const next = { ...picked }; p.items.forEach((r) => { next[r.id] = !allOnPage; }); setPicked(next); };
  const bulk = (status) => { setBusy(true); move(chosen, status).then(() => { setPicked({}); setBusy(false); }, () => setBusy(false)); };
  const reset = (fn) => (x) => { fn(x); p.reset(); setPicked({}); };
  const second = v.dates === 'filing' ? COLS.filed : COLS.effective;
  const third = v.dates === 'filing' ? COLS.effective : COLS.activity;
  const counts = { all: rows.length }; Object.keys(IPV_STATUS).forEach((s) => { counts[s] = rows.filter((r) => r.status === s).length; });
  return (
    <>
      <div className="page-head"><h1 className="page-title">IPV High Risk Team Review</h1></div>
      <ViewBar label="Referral status" items={Object.keys(IPV_VIEWS).map((id) => ({ to: '#ipv/' + id, label: IPV_VIEWS[id], icon: STATUS_ICON[id], tone: id, count: query.ready ? counts[id] : null, current: id === view }))} />
      <section className="panel-card ipv-list" aria-labelledby="ipv-h">
        <div className="card-head is-stacked">
          <h2 className="card-title" id="ipv-h">{v.title} {query.ready && <span>({plural(list.length, 'client', 'clients')})</span>}</h2>
          <p className="card-sub">{v.text}</p>
        </div>
        <Loaded query={query} what="referrals">{() => (
          <>
            <div className="toolbar ipv-toolbar">
              <SearchBox id="ipv-search" label="Search referrals" placeholder="Search by name, OTN, SID or MCI ID" value={search} onChange={reset(setSearch)} />
              <div className="ipv-chips" role="group" aria-label="Arresting agency">
                {AGENCY.map(([id, label]) => <button key={id} type="button" className="ipv-chip" aria-pressed={agency === id} onClick={() => reset(setAgency)(id)}>{label}</button>)}
              </div>
              <button type="button" className="icon-btn ipv-download" disabled={!list.length} onClick={() => download(chosen.length ? chosen : list, view)}
                aria-label={'Download CSV of ' + plural(chosen.length || list.length, 'referral', 'referrals') + (chosen.length ? ' selected' : '')}><Icon name="download" size={20} /></button>
            </div>
            {chosen.length > 0 && (
              <div className="ipv-bulk" role="group" aria-label="Selected referrals">
                <strong>{plural(chosen.length, 'client', 'clients')} selected</strong>
                <span>Move to</span>
                {Object.keys(IPV_STATUS).map((s) => <button key={s} type="button" className="btn-outline is-small" disabled={busy || chosen.every((r) => r.status === s)} onClick={() => bulk(s)}><Icon name={STATUS_ICON[s]} size={14} />{IPV_STATUS[s]}</button>)}
                <button type="button" className="btn-text is-small" onClick={() => setPicked({})}>Clear</button>
              </div>
            )}
            <Table label={v.title} spec={SPEC} empty={q || agency !== 'all' ? 'No referrals match. Clear the search or choose All.' : view === 'review' ? 'No one is on the list for the next meeting. Move clients here from Intake.' : 'No referrals here.'}
              head={<>
                <div className="th" role="columnheader"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={togglePage} /></div>
                <SortHead defs={[COLS.name]} sort={sort} onSort={(d) => { onSort(d); p.reset(); }} />
                <div className="th" role="columnheader">ID</div>
                <div className="th" role="columnheader">Arrest Info</div>
                <SortHead defs={[second, third]} sort={sort} onSort={(d) => { onSort(d); p.reset(); }} />
                <div className="th" role="columnheader">Risk Type</div>
                <div className="th" role="columnheader">Status</div>
              </>}>
              {p.items.map((r) => {
                const name = r.client.first + ' ' + r.client.last;
                const a = r.arrest;
                return (
                  <div className={'tr is-row is-ruled' + (picked[r.id] ? ' is-picked' : '')} role="row" key={r.id}>
                    <div className="td" role="cell"><input type="checkbox" aria-label={'Select ' + name} checked={!!picked[r.id]} onChange={() => setPicked({ ...picked, [r.id]: !picked[r.id] })} /></div>
                    <div className="td" role="cell"><Link className="link-btn" to={{ page: 'referral', id: r.id }}>{r.client.last}, {r.client.first}</Link><small>{r.client.dob} ({ageFrom(r.client.dob)} yo)</small></div>
                    <div className="td ipv-ids" role="cell"><span>OTN: {a ? a.otn : '—'}</span><span>SID: {r.sid}</span></div>
                    <div className="td" role="cell">{a ? <>{a.date}<small>{a.agency}</small></> : <span className="ipv-none">Entered by DHS</span>}</div>
                    <div className="td" role="cell">{v.dates === 'filing' ? (a ? a.filed : '—') : (a ? a.effective : '—')}</div>
                    <div className="td" role="cell">{v.dates === 'filing' ? (a ? a.effective : '—') : isoToUSDate(r.lastActivity)}</div>
                    <div className="td" role="cell">{r.risk.length ? r.risk.map((x) => <span className="ipv-risk" key={x}>{x}</span>) : 'None'}</div>
                    <div className="td" role="cell"><StatusSelect r={r} name={name} onChange={(s) => move([r], s).catch(() => {})} /></div>
                  </div>
                );
              })}
            </Table>
            <Pager p={p} />
          </>
        )}</Loaded>
      </section>
    </>
  );
}
