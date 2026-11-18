// The step-by-step log of a contact: what the coordinator filled in and changed, in order, with the time.
// Written by the server as changes are saved, so it can't be edited from a screen. Typing in one field is
// merged into one line (the last value within five minutes), so the log reads like what happened, not keystrokes.
import { SCREENING, CHANNELS, shown } from './asc.js';

const INTAKE = {
  safety: 'Safety', privacy: 'Where they’re talking', caller: 'Caller', callerOther: 'Caller', callerName: 'Caller’s name',
  callerConfirmed: 'Guardian on file', age: 'Person who needs help', story: 'In their words', coverage: 'Coverage',
  coverageDetail: 'Coverage plan', coverageConfirmed: 'Coverage on file', found: 'How they found us', foundOther: 'How they found us',
  reason: 'Reason for calling', reasonText: 'Reason for calling'
};
// Free text: the log says it changed, and the record shows what it says now.
const TEXT = ['story'];
const FOLLOW = { ok: 'Follow-up permission', how: 'Best way to reach them', time: 'Best time' };
const ANON = { name: 'First name or nickname', zip: 'ZIP', county: 'County', language: 'Language' };
const MERGE_MS = 5 * 60 * 1000;

const val = (v) => (v === null || v === undefined || v === '' ? 'cleared' : shown(v));

// Lines for one saved change, given the contact before it.
export function describePatch(k, patch) {
  const out = [];
  const add = (key, text) => out.push({ key, text });
  if (patch.intake) Object.keys(patch.intake).forEach((f) => {
    if (patch.intake[f] === k.intake[f] || !(f in INTAKE)) return;
    add('intake.' + f, TEXT.indexOf(f) >= 0 ? 'Updated “' + INTAKE[f] + '”' : INTAKE[f] + ': ' + val(patch.intake[f]));
  });
  if (patch.screening) SCREENING.forEach((q) => {
    if (q.key in patch.screening && patch.screening[q.key] !== k.screening[q.key]) add('screening.' + q.key, 'Screening, ' + q.label.toLowerCase() + ': ' + val(patch.screening[q.key]));
  });
  if (Array.isArray(patch.needs)) {
    const before = {}; k.needs.forEach((n) => { before[n.id] = n; });
    patch.needs.forEach((n) => {
      const b = before[n.id];
      if (!b) add('need.' + n.id, 'Need added: ' + n.name + (n.urg ? ' (' + n.urg.toLowerCase() + ')' : ''));
      else {
        if (n.outcome !== b.outcome) add('need.' + n.id + '.outcome', 'Outcome for ' + n.name + ': ' + val(n.outcome));
        if (n.urg !== b.urg) add('need.' + n.id + '.urg', 'Urgency for ' + n.name + ': ' + val(n.urg));
      }
      delete before[n.id];
    });
    Object.values(before).forEach((n) => add('need.' + n.id + '.removed', 'Need removed: ' + n.name));
  }
  if (Array.isArray(patch.interactions)) {
    const before = {}; k.interactions.forEach((x) => { before[x.id] = x; });
    patch.interactions.forEach((x) => {
      const b = before[x.id];
      const name = shown(x.what) || 'interaction';
      if (!b) { add('ix.' + x.id, 'Interaction added: ' + name); if (x.referral && x.referral.name) add('ix.' + x.id + '.referral', 'Referred to ' + x.referral.name + ' for ' + name); }
      else {
        if (x.min !== b.min) add('ix.' + x.id + '.min', 'Minutes for ' + name + ': ' + val(x.min));
        ['type', 'how', 'place', 'need'].forEach((f) => { if (x[f] !== b[f]) add('ix.' + x.id + '.' + f, ({ type: 'Type', how: 'How', place: 'Place', need: 'Need' })[f] + ' for ' + name + ': ' + val(x[f])); });
        if (x.what !== b.what) add('ix.' + x.id + '.what', 'Interaction renamed: ' + name);
        if (x.notes !== b.notes) add('ix.' + x.id + '.notes', 'Updated notes on ' + name);
        const was = b.referral ? b.referral.name + '|' + b.referral.site : '', now = x.referral ? x.referral.name + '|' + x.referral.site : '';
        if (was !== now) add('ix.' + x.id + '.referral', now ? 'Referred to ' + x.referral.name + (x.referral.site && x.referral.site !== x.referral.name ? ' (' + x.referral.site + ')' : '') + ' for ' + name : 'Referral cleared on ' + name);
      }
      delete before[x.id];
    });
    Object.values(before).forEach((x) => add('ix.' + x.id + '.removed', 'Interaction removed: ' + (shown(x.what) || 'untitled')));
  }
  if (patch.followUp) Object.keys(FOLLOW).forEach((f) => {
    if (f in patch.followUp && patch.followUp[f] !== k.followUp[f]) add('follow.' + f, f === 'ok' ? (patch.followUp.ok === 'Yes' ? 'Follow-up: OK to follow up' : patch.followUp.ok === 'No' ? 'Follow-up: declined' : 'Follow-up: cleared') : FOLLOW[f] + ': ' + val(patch.followUp[f]));
  });
  if (patch.onsite) {
    const o = patch.onsite;
    if ('idCheck' in o && o.idCheck !== k.onsite.idCheck) add('onsite.id', 'ID check: ' + val(o.idCheck));
    if (o.consentSigned && !k.onsite.consentSigned) add('onsite.consent', 'Consent to share signed');
    if (Array.isArray(o.docs)) o.docs.filter((d) => k.onsite.docs.indexOf(d) < 0).forEach((d) => add('onsite.doc.' + d, 'Document scanned: ' + d));
  }
  if (patch.anon) Object.keys(ANON).forEach((f) => { if (f in patch.anon && patch.anon[f] !== k.anon[f]) add('anon.' + f, 'Anonymous details, ' + ANON[f].toLowerCase() + ': ' + val(patch.anon[f])); });
  if ('channel' in patch && patch.channel !== k.channel) add('channel', 'Changed to ' + (CHANNELS[patch.channel] || '').toLowerCase());
  if ('site' in patch && patch.site !== k.site && patch.site) add('site', 'Site: ' + patch.site);
  if (patch.path === 'anon' && k.path !== 'anon') add('path', 'Chose to stay anonymous');
  if ('identity' in patch && patch.identity === 'unverified') add('identity', 'Saved name only: ' + (patch.unverifiedName || k.unverifiedName || 'no name'));
  if (patch.priorRef) add('prior.' + patch.priorRef, 'Attached earlier contact ' + patch.priorRef);
  if (patch.linkedPrior === 'linked') add('linkedPrior', 'Linked earlier anonymous contacts to their record');
  if (patch.linkedPrior === 'no') add('linkedPrior', 'Earlier anonymous contacts: not the same person');
  if (Array.isArray(patch.notes) && patch.notes.length > k.notes.length) add('note.' + patch.notes[0].id, 'Case note added');
  if (Array.isArray(patch.actions)) patch.actions.filter((a) => !k.actions.some((b) => b.id === a.id)).forEach((a) => add('action.' + a.id, 'Action item added: ' + a.text));
  return out;
}

// Adds lines to the log. A change to the same field by the same person within five minutes replaces the last line.
export function appendLog(k, lines, by, extra = {}) {
  if (!k.log) k.log = [];
  const now = new Date();
  lines.forEach((l) => {
    const last = k.log[k.log.length - 1];
    const entry = { at: now.toISOString(), by, key: l.key, text: l.text, correction: !!extra.correction };
    if (last && last.key === l.key && last.by === by && last.correction === entry.correction && now - new Date(last.at) < MERGE_MS) k.log[k.log.length - 1] = entry;
    else k.log.push(entry);
  });
  if (k.log.length > 400) k.log = k.log.slice(-400);
}

// Contacts saved before the log existed get one built from their answers, spaced across the contact's length.
export function backfillLog(k) {
  if (k.log && k.log.length) return;
  const lines = [{ key: 'start', text: k.channel === 'person' ? 'Started an in-person visit' + (k.site ? ' at ' + k.site : '') : 'Started a phone call' }];
  const i = k.intake || {};
  ['safety', 'privacy', 'caller', 'callerName', 'age'].forEach((f) => { if (i[f]) lines.push({ key: 'intake.' + f, text: INTAKE[f] + ': ' + shown(i[f]) }); });
  if (i.story) lines.push({ key: 'intake.story', text: 'Updated “In their words”' });
  SCREENING.forEach((q) => { if (k.screening && k.screening[q.key]) lines.push({ key: 'screening.' + q.key, text: 'Screening, ' + q.label.toLowerCase() + ': ' + shown(k.screening[q.key]) }); });
  k.needs.forEach((n) => lines.push({ key: 'need.' + n.id, text: 'Need added: ' + n.name + (n.urg ? ' (' + n.urg.toLowerCase() + ')' : '') }));
  ['coverage', 'found'].forEach((f) => { if (i[f]) lines.push({ key: 'intake.' + f, text: INTAKE[f] + ': ' + shown(i[f]) }); });
  if (k.clientId) lines.push({ key: 'identity', text: k.identity === 'new' ? 'Registered in MCI and enrolled in ASC' : 'Matched in MCI and enrolled in ASC' });
  else if (k.identity === 'unverified') lines.push({ key: 'identity', text: 'Saved name only: ' + (k.unverifiedName || 'no name') });
  else if (k.path === 'anon') lines.push({ key: 'path', text: 'Chose to stay anonymous' });
  if (k.followUp && k.followUp.ok) lines.push({ key: 'follow.ok', text: k.followUp.ok === 'Yes' ? 'Follow-up: OK to follow up' : 'Follow-up: declined' });
  k.interactions.forEach((x) => lines.push({ key: 'ix.' + x.id, text: 'Interaction added: ' + shown(x.what) + (x.min ? ', ' + x.min + ' min' : '') }));
  k.needs.filter((n) => n.outcome).forEach((n) => lines.push({ key: 'need.' + n.id + '.outcome', text: 'Outcome for ' + n.name + ': ' + n.outcome }));
  if (k.status === 'closed') lines.push({ key: 'close', text: k.closedKind === 'urgent' && k.urgent ? 'Closed as a transfer to ' + shown(k.urgent.dest) : 'Closed the contact' });
  const start = new Date(k.startedAt).getTime();
  const end = k.endedAt ? new Date(k.endedAt).getTime() : start + lines.length * 60000;
  const step = lines.length > 1 ? (end - start) / (lines.length - 1) : 0;
  k.log = lines.map((l, n) => ({ at: new Date(start + Math.round(step * n)).toISOString(), by: k.staff, key: l.key, text: l.text, correction: false }));
}
