// Providers tab: one row per provider, summed across the client's service instances.
import React, { useMemo } from 'react';
import { Icon } from '../../ui/icons.jsx';
import { usePref } from '../../state/store.jsx';
import { Link } from '../../router.jsx';
import { Chip, SearchBox, SelectBox, Table, SortHead, useSort } from '../../ui/controls.jsx';
import { countText, money, sortRows, matches, serviceSummary, providerSummary, uniq } from '../../lib.js';
import { TABLES } from '../../tables.js';
import { providerRoute } from './routes.js';

export function Providers({ client: c }) {
  const [query, setQuery] = usePref('prov.' + c.id + '.query', '');
  const [program, setProgram] = usePref('prov.' + c.id + '.program', '');
  const [sort, onSort] = useSort('prov', TABLES.providers.sort);
  const all = useMemo(() => providerSummary(c), [c]);
  const sum = useMemo(() => serviceSummary(c), [c]);
  const rows = sortRows(all.filter((r) => (!program || r.programs.indexOf(program) >= 0) && matches(r, ['provider', 'program', 'dx', 'facility', 'status'], query)), sort, TABLES.providers.cols);
  return (
    <div className="view" style={{ gap: 18 }}>
      <h2 className="title"><Icon name="lifebuoy" size={22} />Providers</h2>
      <dl className="chips">
        <Chip label="Timeline">{sum.timeline}</Chip><Chip label="Service Instances">{sum.instances.toLocaleString()}</Chip>
        <Chip label="Total Cost">{money(sum.cost)}</Chip><Chip label="Programs">{sum.programs.join('; ')}</Chip><Chip label="Facilities Used">{sum.facilities}</Chip>
      </dl>
      <div className="toolbar">
        <SearchBox id="prov-search" label="Search providers" value={query} onChange={setQuery} />
        <SelectBox id="prov-program" label="Program filter" placeholder="Program Filter" value={program} onChange={setProgram} options={uniq(sum.programs)} />
      </div>
      <Table label="Providers" spec={TABLES.providers} empty="No providers match these filters. Clear the search or program filter to see all providers." head={<SortHead defs={TABLES.providers.cols} sort={sort} onSort={onSort} />}>
        {rows.map((r) => (
          <div className="tr is-row" role="row" key={r.provider}>
            <div className="td is-tight" role="cell"><Link className="link-btn" to={providerRoute(c.id, r.provider)}>{r.provider}</Link></div>
            {TABLES.providers.cols.slice(1).map(({ key }) => <div className="td is-tight" role="cell" key={key}>{r[key]}</div>)}
          </div>
        ))}
      </Table>
      <div className="pager is-start">{countText(rows.length, all.length, 'providers')}</div>
    </div>
  );
}
