// Find a Provider: the behavioral health provider directory, searched during a contact so the coordinator refers
// people to a specific program instead of searching the web. Picking a site saves it on the interaction.
import React, { useMemo, useState } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { Modal, Loaded } from '../../ui/controls.jsx';
import { CopyButton } from '../../ui/records.jsx';
import { useProviderDirectory } from '../../state/asc.js';
import { searchProviders, filtersFor, referralFrom, NOT_COVERED, AGE_FILTERS } from '../../data/provider-search.js';

const PAGE = 15;
const CATEGORY_LABELS = { crisis: 'Crisis and emergency', 'mental-health': 'Mental health', 'substance-use': 'Drug and alcohol', 'recovery-support': 'Recovery support',
  'family-support': 'Family support', housing: 'Housing', specialty: 'Specialty', information: 'Information' };
const VERIFIED = { multiple: 'Checked with the provider and the county', 'provider-site': 'Checked with the provider', 'county-directory': 'From the county directory (Feb 2025)' };
const GROUP_LABELS = { children: 'children', adolescents: 'adolescents', 'transition-age-youth': 'transition-age youth', adults: 'adults', 'older-adults': 'older adults' };

const addr = (f) => (f.address ? [f.address.line1, f.address.line2].filter(Boolean).join(', ') + ', ' + f.address.city + ' ' + f.address.zip : '');
const ages = (s) => (s.minAge != null || s.maxAge != null ? (s.minAge != null ? s.minAge : 0) + (s.maxAge != null ? '–' + s.maxAge : '+') : s.ageGroups.map((g) => GROUP_LABELS[g]).join(', '));

function Result({ r, labels, pops, onPick, idx }) {
  const p = r.provider;
  const mainPhone = Object.values(p.phones)[0] || '';
  const notes = [].concat(p.limitations, r.sites.flatMap((s) => s.services.flatMap((x) => x.limitations)), r.unsited.flatMap((x) => x.limitations))
    .filter((t, i, a) => t && a.indexOf(t) === i);
  const h = 'pr-' + idx;
  return (
    <li className="asc-pr">
      <div className="asc-pr-head">
        <h3 className="asc-pr-name" id={h}>{p.name}</h3>
        <span className="asc-pr-verified"><Icon name={p.verification.level === 'county-directory' ? 'info' : 'checkSmall'} size={14} />{VERIFIED[p.verification.level]}</span>
      </div>
      <p className="asc-pr-serves">Serves {p.serves.ageGroups.map((g) => GROUP_LABELS[g]).join(', ') || 'all ages'}{p.serves.populations.length ? ' · ' + p.serves.populations.map((x) => pops[x]).join(', ') : ''}{p.referral ? ' · ' + p.referral : ''}</p>
      {notes.length > 0 && <ul className="asc-pr-limits" aria-label={'Limits for ' + p.name}>{notes.map((t) => <li key={t}><Icon name="alert" size={13} />{t}</li>)}</ul>}
      {p.flags.length > 0 && <p className="asc-pr-flag"><Icon name="info" size={13} />{p.flags[0]}</p>}
      <ul className="asc-pr-sites" aria-labelledby={h}>
        {r.sites.map(({ facility: f, services }) => (
          <li key={f.id} className="asc-pr-site">
            <div className="asc-pr-site-main">
              <strong>{f.name}</strong>
              {f.address ? <span>{addr(f)}{!f.inAlleghenyCounty && <em className="asc-pr-out"> · {f.county} County</em>}</span> : <span className="asc-hint">Address not confirmed</span>}
              {(f.phone || mainPhone) && <span className="asc-pr-phone"><Icon name="phone" size={13} />{f.phone || mainPhone}<CopyButton value={f.phone || mainPhone} label={'phone number for ' + f.name} size={13} /></span>}
              <span className="asc-pr-svcs">{services.map((s) => <span key={s.service + ages(s)} className="asc-pr-svc">{labels[s.service]}{ages(s) ? ' · ' + ages(s) : ''}</span>)}</span>
              {f.notes && <span className="asc-hint">{f.notes}</span>}
            </div>
            <button type="button" className="btn-outline is-small" onClick={() => onPick(referralFrom(p, f))} aria-label={'Refer to ' + p.name + ', ' + f.name}>Refer Here</button>
          </li>
        ))}
        {r.unsited.length > 0 && (
          <li className="asc-pr-site is-unsited">
            <div className="asc-pr-site-main">
              <strong>Site not confirmed</strong>
              <span className="asc-pr-svcs">{r.unsited.map((s, i) => <span key={i} className="asc-pr-svc">{labels[s.service]}{ages(s) ? ' · ' + ages(s) : ''}</span>)}</span>
              <span className="asc-hint">{r.unsited.map((s) => s.notes).filter(Boolean)[0] || 'Offered, but no source says where. Call to ask which site.'}</span>
              {mainPhone && <span className="asc-pr-phone"><Icon name="phone" size={13} />{mainPhone}<CopyButton value={mainPhone} label={'phone number for ' + p.name} size={13} /></span>}
            </div>
            <button type="button" className="btn-outline is-small" onClick={() => onPick(referralFrom(p, null))} aria-label={'Refer to ' + p.name + ', site to be confirmed'}>Refer Here</button>
          </li>
        )}
      </ul>
    </li>
  );
}

// need/intakeAge seed the filters; needs (optional) lets the coordinator switch which need they're searching for.
export function ProviderSearchModal({ need, intakeAge, coverage, needs, onPick, onClose }) {
  const { query, directory: dir } = useProviderDirectory();
  const [forNeed, setForNeed] = useState(need || '');
  const [f, setF] = useState(() => filtersFor(need, intakeAge));
  const [shown, setShown] = useState(PAGE);
  const [other, setOther] = useState('');
  const set = (k) => (v) => { setF({ ...f, [k]: v }); setShown(PAGE); };
  const pickNeed = (n) => { setForNeed(n); setF(filtersFor(n, intakeAge)); setShown(PAGE); };
  const meta = useMemo(() => {
    if (!dir) return null;
    const labels = {}, cats = {}, pops = {};
    dir.vocabularies.services.forEach((s) => { labels[s.id] = s.label; (cats[s.category] = cats[s.category] || []).push(s); });
    dir.vocabularies.populations.forEach((x) => { pops[x.id] = x.label; });
    return { labels, cats, pops };
  }, [dir]);
  const results = useMemo(() => (dir ? searchProviders(dir, f) : []), [dir, f]);
  const sites = results.reduce((n, r) => n + r.sites.length, 0);
  const pick = (ref) => { onPick(ref, forNeed); onClose(); };
  const crisis = dir ? dir.hotlines.filter((h) => ['resolve-line', '988', 'pathway-line'].indexOf(h.id) >= 0) : [];
  return (
    <Modal id="asc-providers" title="Find a Provider" icon="search" intro="Behavioral health providers in and around Allegheny County. Confirm openings and eligibility with the provider before you refer." onClose={onClose}>
      <Loaded query={query} what="the provider directory">{() => (
        <div className="asc-pr-wrap">
          {crisis.length > 0 && <p className="asc-pr-crisis"><Icon name="alert" size={15} /><span><strong>In crisis?</strong> {crisis.map((h) => (h.id === '988' ? 'Call or text 988' : h.name + ' ' + h.phone)).join(' · ')}</span></p>}
          <form className="asc-pr-filters" role="search" aria-label="Filter providers" onSubmit={(e) => e.preventDefault()}>
            {needs && needs.length > 0 && (
              <div className="field"><label htmlFor="pr-need">For which need</label>
                <select className="select" id="pr-need" value={forNeed} onChange={(e) => pickNeed(e.target.value)}>
                  <option value="">Any need</option>{needs.map((n) => <option key={n}>{n}</option>)}
                </select></div>
            )}
            <div className="field"><label htmlFor="pr-service">Type of care</label>
              <select className="select" id="pr-service" value={f.service || (f.category ? 'cat:' + f.category : '')}
                onChange={(e) => { const v = e.target.value; setF({ ...f, service: v.indexOf('cat:') === 0 ? '' : v, category: v.indexOf('cat:') === 0 ? v.slice(4) : '' }); setShown(PAGE); }}>
                <option value="">Any type of care</option>
                {Object.keys(CATEGORY_LABELS).filter((c) => meta.cats[c]).map((c) => (
                  <optgroup key={c} label={CATEGORY_LABELS[c]}>
                    <option value={'cat:' + c}>All {CATEGORY_LABELS[c].toLowerCase()}</option>
                    {meta.cats[c].map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </optgroup>
                ))}
              </select></div>
            <div className="field"><label htmlFor="pr-ages">Age</label>
              <select className="select" id="pr-ages" value={f.ages} onChange={(e) => set('ages')(e.target.value)}>{AGE_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="field"><label htmlFor="pr-pop">Serves</label>
              <select className="select" id="pr-pop" value={f.population} onChange={(e) => set('population')(e.target.value)}>
                <option value="">Anyone</option>{dir.vocabularies.populations.filter((x) => x.id !== 'all-ages').map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select></div>
            <div className="field"><label htmlFor="pr-area">Town, neighborhood or ZIP</label>
              <input className="input" id="pr-area" value={f.area} onChange={(e) => set('area')(e.target.value)} placeholder="For example: McKeesport or 15132" /></div>
            <div className="field"><label htmlFor="pr-q">Name or keyword</label>
              <input className="input" id="pr-q" type="search" value={f.q} onChange={(e) => set('q')(e.target.value)} placeholder="For example: Mercy, methadone, LGBTQ" /></div>
            <label className="check-row asc-pr-county"><input type="checkbox" checked={f.inCounty} onChange={(e) => set('inCounty')(e.target.checked)} />Only sites in Allegheny County</label>
          </form>
          {NOT_COVERED[forNeed] && <p className="notice"><Icon name="info" size={16} /><span>{NOT_COVERED[forNeed]}</span></p>}
          {coverage === 'Medical Assistance or HealthChoices' && <p className="asc-hint is-icon"><Icon name="info" size={14} />They have Medical Assistance: check the provider is in Community Care’s network (Member Services 800-553-7499).</p>}
          <p className="asc-pr-count" role="status">{results.length ? results.length + (results.length === 1 ? ' provider' : ' providers') + ', ' + sites + (sites === 1 ? ' site' : ' sites') : 'No providers match. Try fewer filters, or turn off “Only sites in Allegheny County”.'}</p>
          {results.length > 0 && (
            <ul className="asc-pr-list" aria-label="Providers">
              {results.slice(0, shown).map((r, i) => <Result key={r.provider.id} r={r} idx={i} labels={meta.labels} pops={meta.pops} onPick={pick} />)}
            </ul>
          )}
          {results.length > shown && <button type="button" className="btn-outline asc-pr-more" onClick={() => setShown(shown + PAGE)}>Show {Math.min(PAGE, results.length - shown)} More</button>}
          <form className="asc-pr-other" onSubmit={(e) => { e.preventDefault(); if (other.trim()) pick({ providerId: '', facilityId: '', name: other.trim(), site: '', phone: '', address: '' }); }}>
            <label className="field-label" htmlFor="pr-other">Referring somewhere that isn’t listed?</label>
            <div className="asc-inline-row"><input className="input" id="pr-other" value={other} onChange={(e) => setOther(e.target.value)} placeholder="Provider name" /><button type="submit" className="btn-outline" disabled={!other.trim()}>Use This Name</button></div>
          </form>
          <p className="asc-hint">Directory compiled {dir.meta.compiledOn} from the county’s Where to Call booklet and provider websites.</p>
        </div>
      )}</Loaded>
    </Modal>
  );
}
