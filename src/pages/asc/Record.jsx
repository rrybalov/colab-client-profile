// The full record of one contact, read-only: every answer the coordinator filled in, and the step-by-step log of
// what happened, in order. Opened on request from a contact's history, so the history itself stays short.
import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useSession } from '../../state/data.js';
import { usDate, clockTime, minutesBetween, shown, CHANNELS } from '../../data/asc.js';
import { ScreeningSummary, Badge } from './parts.jsx';

const IDENTITY = { matched: 'Matched in MCI and enrolled in ASC', new: 'Registered in MCI and enrolled in ASC', unverified: 'Name only, not verified' };
const or = (v) => (v ? shown(v) : '—');

function Pairs({ rows }) {
  return <dl className="asc-record-pairs">{rows.filter(Boolean).map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>;
}

function Block({ id, title, icon, wide, children }) {
  return (
    <section className={'asc-record-block' + (wide ? ' is-wide' : '')} aria-labelledby={id}>
      <h5 className="asc-record-title" id={id}><Icon name={icon} size={15} />{title}</h5>
      {children}
    </section>
  );
}

export function ContactRecord({ r }) {
  const { staffName } = useSession();
  const i = r.intake;
  const end = r.endedAt;
  const p = (s) => 'rec-' + r.id + '-' + s;
  const caller = i.caller === 'Other' ? i.callerOther || 'Other' : i.caller;
  const who = r.clientId ? IDENTITY[r.identity] || IDENTITY.matched : r.identity === 'unverified' ? IDENTITY.unverified + (r.unverifiedName ? ': ' + r.unverifiedName : '')
    : r.path === 'anon' ? 'Anonymous' + [r.anon.name, r.anon.zip, r.anon.language !== 'English' ? r.anon.language : ''].filter(Boolean).map((x, n) => (n ? ', ' : ': ') + x).join('') : 'Not identified';
  return (
    <div className="asc-record">
      <Block id={p('contact')} title="Contact" icon="headset">
        <Pairs rows={[
          ['Type', CHANNELS[r.channel] + (r.site ? ' at ' + r.site : '')],
          ['When', usDate(r.startedAt) + ', ' + clockTime(r.startedAt) + (end ? '–' + clockTime(end) + ' (' + minutesBetween(r.startedAt, end) + ' min)' : ', still open')],
          ['Coordinator', staffName(r.staff)],
          ['Who', who]
        ]} />
      </Block>
      <Block id={p('intake')} title="Intake" icon="notes">
        <Pairs rows={[
          ['Safety', i.safety === 'Yes' ? 'Yes, routed to crisis' : or(i.safety)],
          r.channel === 'person' && ['Where they talked', or(i.privacy)],
          ['Caller', caller ? shown(caller) + (i.callerName ? ' (' + i.callerName + ')' : '') : '—'],
          ['Person who needs help', or(i.age)],
          i.reason && ['Reason for calling', i.reason === 'Something else' ? or(i.reasonText) : shown(i.reason)],
          ['Coverage', i.coverage ? shown(i.coverage) + (i.coverageDetail ? ': ' + i.coverageDetail : '') : '—'],
          ['How they found us', i.found === 'Other' ? or(i.foundOther) : or(i.found)]
        ]} />
        {i.story && <blockquote className="asc-record-quote"><span className="field-label">In their words</span>{i.story}</blockquote>}
      </Block>
      <Block id={p('screen')} title="Screening" icon="check" wide>
        <ScreeningSummary screening={r.screening} />
      </Block>
      <Block id={p('needs')} title="Needs and outcomes" icon="layers">
        {r.needs.length ? <ul className="asc-record-list">{r.needs.map((n) => <li key={n.id}><Badge urg={n.urg} /> {n.name}: <strong>{n.outcome || 'no outcome'}</strong></li>)}</ul> : <p className="asc-hint">None recorded.</p>}
      </Block>
      {r.clientId && (
        <Block id={p('follow')} title="Follow-up" icon="calendar">
          <Pairs rows={[['Permission', r.followUp.ok === 'Yes' ? 'OK to follow up' : r.followUp.ok === 'No' ? 'Declined' : 'Not asked'], r.followUp.ok === 'Yes' && ['Best way', r.followUp.how], r.followUp.ok === 'Yes' && r.followUp.time && ['Best time', r.followUp.time]]} />
        </Block>
      )}
      {r.channel === 'person' && (
        <Block id={p('onsite')} title="On-site steps" icon="door">
          <Pairs rows={[['ID check', or(r.onsite.idCheck)], ['Consent to share', r.onsite.consentSigned ? 'Signed ' + r.onsite.consentSigned : 'Not signed'], ['Documents', r.onsite.docs.length ? r.onsite.docs.join(', ') : 'None']]} />
        </Block>
      )}
      {r.urgent && (
        <Block id={p('urgent')} title="Urgent routing" icon="alert">
          <Pairs rows={[['Sent to', shown(r.urgent.dest)], ['How', or(r.urgent.how)], ['For', or(r.urgent.need)], r.urgent.note && ['What happened', r.urgent.note]]} />
        </Block>
      )}
      <Block id={p('log')} title="What happened, step by step" icon="history" wide>
        {r.log.length ? (
          <ol className="asc-log">
            {r.log.map((l, n) => (
              <li key={n} className={l.correction ? 'is-correction' : ''}>
                <time dateTime={l.at}>{usDate(l.at) !== usDate(r.startedAt) ? usDate(l.at) + ' ' : ''}{clockTime(l.at)}</time>
                <span>{l.text}{l.by && l.by !== r.staff ? ' · ' + staffName(l.by) : ''}{l.correction && <span className="asc-log-tag">Correction</span>}</span>
              </li>
            ))}
          </ol>
        ) : <p className="asc-hint">No log for this contact.</p>}
      </Block>
    </div>
  );
}
