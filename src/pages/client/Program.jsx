// Program Info tab: court cases, jail, probation and custody history.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { Tip, Table, SortHead, useSort } from '../../ui/controls.jsx';
import { fullName, sortRows } from '../../lib.js';
import { TABLES } from '../../tables.js';

export function Program({ client: c }) {
  const [program, setProgram] = usePref('program.which', 'justice');
  const [caseFilter, setCaseFilter] = usePref('program.caseFilter', 'all');
  const [incOpen, setIncOpen] = usePref('program.incOpen', {});
  const [sort, onSort] = useSort('cases', TABLES.cases.sort);
  const titles = { justice: 'Justice Involvement', behavioral: 'Behavioral Health', housing: 'Housing' };
  const title = titles[program];
  const head = (
    <>
      <h2 className="title" style={{ fontSize: 22 }}><Icon name="lifebuoy" size={22} />Program Info</h2>
      <div className="view-head">
        <h3 className="title-lg">{title}<Tip label="About this section">Records from Allegheny County courts, the jail and adult probation, matched to this client by MCI ID.</Tip></h3>
        <label className="sr-only" htmlFor="program-select">Program</label>
        <select className="select is-program" id="program-select" value={program} onChange={(e) => setProgram(e.target.value)}>
          <option value="justice">Justice</option><option value="behavioral">Behavioral Health</option><option value="housing">Housing</option>
        </select>
      </div>
    </>
  );
  if (program !== 'justice') return <div className="view">{head}<div className="empty-box"><p>The {title} view has not been designed yet. Justice is the only program with records in this prototype.</p></div></div>;
  const j = c.justice;
  if (!j) return <div className="view">{head}<div className="empty-box"><p>No court, jail or probation records are matched to {fullName(c)}.</p></div></div>;

  const dvCount = j.cases.filter((x) => x.dv).length;
  const cases = sortRows(caseFilter === 'dv' ? j.cases.filter((x) => x.dv) : j.cases, sort, TABLES.cases.cols);
  const tags = { housing: 'Alternative housing', hold: 'Behavioral Health Hold', prison: 'State Prison' };
  return (
    <div className="view" style={{ gap: 22 }}>
      {head}
      <div className="card-grid">
        <div className="info-card"><h4>High Risk Flag<Tip label="How the high risk flag is set">Added when a client has met the following criteria:<ul><li>• Repeat Offender: [criteria]</li><li>• Serious Charge: [criteria]</li><li>• Recidivism Case: [criteria]</li></ul></Tip></h4>
          {j.highRisk.length ? <ul>{j.highRisk.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="req">No flags</p>}</div>
        <div className="info-card"><h4>Jail Information</h4>
          {j.jail ? <dl className="pairs"><dt>DOC Number</dt><dd>{j.jail.doc}</dd><dt>Docket Number</dt><dd>{j.jail.docket}</dd><dt>POD Number</dt><dd>{j.jail.pod}</dd><dt>POD Level</dt><dd>{j.jail.podLevel}</dd></dl> : <p className="req">Not in county jail</p>}</div>
        <div className="info-card"><h4>Justice Involvement</h4><ul>
          {j.involvement.activeDV && <li>Active DV Case</li>}
          <li>Adult Criminal Filings: <strong>{j.involvement.adult}</strong></li><li>DV Criminal Filings: <strong>{j.involvement.dvFilings}</strong></li><li>Convictions: <strong>{j.involvement.convictions}</strong></li>
        </ul></div>
        <div className="info-card"><h4>Batterers Intervention Program (BIP)</h4>
          <div className="kv-value" style={{ fontSize: 14, color: 'var(--slate)' }}>Status: <strong>{j.bip || 'Not referred'}</strong>{j.bip && <button type="button" className="icon-btn is-action" aria-label="Open BIP record"><Icon name="external" size={15} /></button>}</div></div>
      </div>
      <section className="view" style={{ gap: 14 }}>
        <h3 className="subtitle">Case History<Tip label="About case history">Criminal cases filed in Pennsylvania courts. OTN opens the case in the UJS Portal.</Tip></h3>
        <div className="filter-pills" role="group" aria-label="Case filter">
          <button type="button" className="filter-pill" aria-pressed={caseFilter === 'all'} onClick={() => setCaseFilter('all')}>All ({j.cases.length})</button>
          <button type="button" className="filter-pill" aria-pressed={caseFilter === 'dv'} onClick={() => setCaseFilter('dv')}>Domestic Violence Arrests ({dvCount})</button>
        </div>
        <Table label="Case history" spec={TABLES.cases} empty="No cases match this filter." head={<SortHead defs={TABLES.cases.cols} sort={sort} onSort={onSort} />}>
          {cases.map((x) => (
            <div className="tr is-row is-ruled" role="row" key={x.otn}>
              <div className="td" role="cell"><a className="link-btn is-inline" style={{ padding: 0, textDecoration: 'none' }} href="https://ujsportal.pacourts.us/" target="_blank" rel="noopener noreferrer">{x.otn}<Icon name="external" size={13} /><span className="sr-only">(opens UJS Portal)</span></a></div>
              <div className="td" role="cell">{x.date}<small>{x.agency}</small></div>
              <div className="td" role="cell">{x.filed}</div>
              <div className="td" role="cell">{x.charge}</div>
              <div className="td" role="cell">{x.disp}</div>
              <div className="td" role="cell">{x.next}<small>{x.nextDate}</small></div>
            </div>
          ))}
        </Table>
      </section>
      <section className="view" style={{ gap: 14 }}>
        <h3 className="subtitle">Probation Information<Tip label="About probation information">From Allegheny County Adult Probation. Updated nightly.</Tip></h3>
        {j.probation ? (
          <div className="card-grid">
            <dl className="info-card pairs is-small"><dt>Status</dt><dd>{j.probation.status}</dd><dt>Unit</dt><dd>{j.probation.unit}</dd><dt>Probation Officer</dt><dd>{j.probation.officer}</dd></dl>
            <dl className="info-card pairs is-small"><dt>Last Intake</dt><dd>{j.probation.lastIntake}</dd><dt>Last Active Date</dt><dd>{j.probation.lastActive}</dd></dl>
          </div>
        ) : <p className="req">No probation record.</p>}
      </section>
      <section className="view" style={{ gap: 16 }}>
        <h3 className="subtitle">Incarceration History<Tip label="About incarceration history">Custody events from the county jail and the PA Board of Probation and Parole, newest first.</Tip></h3>
        {j.incarceration.length ? (
          <>
            <dl className="stats"><div><dt>Total Time in Custody</dt><dd>{j.custody.total}</dd></div><div><dt>Custody Events</dt><dd>{j.custody.events}</dd></div><div><dt>Facilities</dt><dd>{j.custody.facilities}</dd></div></dl>
            {j.incarceration.map((g) => (
              <div className="timeline-group" key={g.label}><span className="year-pill">{g.label}</span>
                <ol className="timeline">
                  {g.items.map((e) => {
                    const open = !!incOpen[e.id];
                    return (
                      <li className={'event is-' + e.kind} key={e.id}><span className="event-dot" aria-hidden="true" />
                        <div className="event-card">
                          <button type="button" className="event-toggle" aria-expanded={open} onClick={() => setIncOpen({ ...incOpen, [e.id]: !open })}>
                            <span className="event-body"><span className="event-title">{e.title}</span>
                              {e.agency && <span className="event-meta"><span><Icon name="building" size={13} />{e.agency}</span></span>}
                              <span className="event-meta"><span className="event-tag">{tags[e.kind]}</span><span>{e.range}</span><span><Icon name="clock" size={13} />{e.dur}</span></span></span>
                            <Icon name="chevronDown" size={18} className={'chev' + (open ? ' is-open' : '')} />
                          </button>
                          {open && <dl className="event-details"><div><dt>Facility</dt><dd>{e.facility}</dd></div><div><dt>Admission reason</dt><dd>{e.admission || '—'}</dd></div><div><dt>Release type</dt><dd>{e.release || '—'}</dd></div></dl>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </>
        ) : <p className="req">No custody events on record.</p>}
      </section>
    </div>
  );
}
