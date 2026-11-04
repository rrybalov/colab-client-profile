// End-to-end tests. Runs every feature in a real browser twice: once on the in-browser sample data and once
// against the mock API (tools/mock-api.mjs), so both data sources are held to the same behavior.
//
//   npm test                 build, then run everything
//   node tests/e2e.mjs       run against the current app.js
//   node tests/e2e.mjs local only the sample-data mode (or: api)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 8791;
const ORIGIN = `http://localhost:${PORT}`;
const only = process.argv[2];

const results = [];
let section = '';
function check(name, ok, detail) {
  results.push({ name: section + ' › ' + name, ok: !!ok, detail });
  if (!ok) console.log('  FAIL ' + section + ' › ' + name + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 300) : ''));
}
async function part(name, fn) {
  section = name;
  try { await fn(); } catch (e) { check('ran without throwing', false, String(e.message || e).split('\n')[0]); }
}
const int = (s) => Number((String(s).match(/\((\d+)\)/) || [])[1]);
const today = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

async function startServer() {
  const proc = spawn(process.execPath, ['tools/mock-api.mjs', '--port', String(PORT)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve, reject) => {
    proc.stdout.on('data', (d) => { if (String(d).includes('Mock CoLab API')) resolve(); });
    proc.on('exit', (c) => reject(new Error('mock server exited ' + c)));
  });
  return proc;
}

async function run(mode) {
  const BASE = ORIGIN + '/index.html' + (mode === 'api' ? '?api=/api' : '');
  const api = mode === 'api';
  console.log(`\n== ${mode === 'api' ? 'Mock API' : 'Sample data in the browser'}`);
  await fetch(ORIGIN + '/api/__reset', { method: 'POST' });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await ctx.addInitScript(() => { window.__clip = []; navigator.clipboard.writeText = (t) => { window.__clip.push(t); return Promise.resolve(); }; });
  const pg = await ctx.newPage();
  pg.setDefaultTimeout(6000);
  const errors = [];
  pg.on('pageerror', (e) => errors.push(String(e)));
  pg.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|status of 50[03]|status of 404/.test(m.text())) errors.push(m.text()); });

  // The data the app is showing, read from its source for comparison.
  const source = async () => (api ? (await fetch(ORIGIN + '/api/__db')).json() : pg.evaluate(() => JSON.parse(localStorage.getItem('colab.db'))));
  const go = async (hash) => { await pg.goto(BASE + hash); await pg.waitForSelector('#main'); await pg.waitForTimeout(80); };
  const reload = async () => { await pg.reload(); await pg.waitForSelector('#main'); await pg.waitForTimeout(80); };
  const btn = (name, exact) => pg.getByRole('button', { name, exact });
  const count = (sel) => pg.locator(sel).count();
  const text = (sel) => pg.locator(sel).first().innerText();

  await part('Start', async () => {
    await pg.goto(BASE + '#home');
    await pg.evaluate(() => { localStorage.clear(); });
    await reload();
    check('Home renders', (await text('h1')).startsWith('Welcome, Logan'));
    check('address defaults to #home', pg.url().endsWith('#home'));
    check('page title', (await pg.title()) === 'CoLab Home · CoLab');
    const db = await source();
    check('64 clients in the data', db.clients.length === 64, db.clients.length);
    check('notes and action items in the data', db.notes.length > 100 && db.actions.length > 80);
    check('Reset sample data only on sample data', (await count('text=Reset sample data')) === (api ? 0 : 1));
  });

  await part('Home', async () => {
    const db = await source();
    const mine = db.actions.filter((a) => a.assignee === db.userId);
    const open = mine.filter((a) => !a.done).length, over = mine.filter((a) => !a.done && a.due && a.due < today()).length;
    check('Open count matches data', int(await btn(/^Open \(/).innerText()) === open, [open]);
    check('Overdue count matches data', int(await btn(/^Overdue \(/).innerText()) === over, [over]);
    const starred = db.clients.filter((c) => c.starred).length;
    check('starred count matches data', (await text('#starred-h')).includes(`of ${starred})`), [starred, await text('#starred-h')]);
    await btn(/^Overdue \(/).click();
    await reload();
    check('Overdue tab stays selected after reload', (await btn(/^Overdue \(/).getAttribute('aria-pressed')) === 'true');
    const first = await text('.star-card .link-btn');
    await btn('Next starred clients').click();
    check('carousel pages', (await text('.star-card .link-btn')) !== first);
    await pg.selectOption('#choose-colab', 'IPV');
    check('CoLab notice shows', (await count('.notice')) === 1);
    await reload();
    check('CoLab choice stays after reload', (await pg.inputValue('#choose-colab')) === 'IPV');
    check('CoLab choice narrows the list', (await pg.locator('.feed .chip-tag').allInnerTexts()).every((t) => t === 'IPV'));
    await pg.selectOption('#choose-colab', '');
    check('Show more only on cut-off notes', await pg.evaluate(() => [...document.querySelectorAll('.note-clamp')].every((c) => { const s = c.querySelector('span'); return !!c.querySelector('.more-btn') === (s.scrollWidth > s.clientWidth + 1); })));
  });

  await part('My Action Items', async () => {
    await pg.getByRole('link', { name: 'My Action Items' }).click();
    await pg.waitForSelector('h1:has-text("My Action Items")');
    const n0 = int(await btn(/^Open \(/).innerText());
    const label = await text('.feed-item label.feed-text');
    await pg.locator('.feed-item input[type=checkbox]').first().click();
    check('confirmation offers Undo', (await count('.toast button:has-text("Undo")')) === 1);
    await pg.waitForTimeout(150);
    let db = await source();
    check('completion saved to the data source', db.actions.some((a) => a.text === label && a.done));
    await reload();
    check('completed item stays completed after reload', int(await btn(/^Open \(/).innerText()) === n0 - 1);
    await btn(/^Completed/).click();
    check('completed item listed under Completed', (await pg.locator('.feed-item label.feed-text', { hasText: label.slice(0, 40) }).count()) >= 1);
    await pg.locator('.feed-item input[type=checkbox]').first().click();
    await pg.locator('.toast button:has-text("Undo")').click();
    await pg.waitForTimeout(150);
    check('Undo reverses the change', int(await btn(/^Open \(/).innerText()) === n0 - 1);
    await pg.selectOption('[id="size-myActions"]', '25');
    await reload();
    check('rows per page stays after reload', (await pg.inputValue('[id="size-myActions"]')) === '25');
    check('only Logan\'s items', (await pg.locator('.feed-item .meta > span:first-child').allInnerTexts()).every((t) => t.includes('Logan Bialik')));
    db = await source();
    check('every action item of Logan\'s is counted', int(await pg.locator('.filter-card').first().innerText().then((t) => '(' + t.split('\n')[0] + ')')) === db.actions.filter((a) => a.assignee === db.userId).length);
    await pg.locator('.filter-card', { hasText: 'Personal' }).click();
    check('Personal filter shows only PERSONAL', (await pg.locator('.feed .chip-tag').allInnerTexts()).every((t) => t === 'PERSONAL'));
    await pg.locator('.filter-card').first().click();
  });

  await part('My Case Notes', async () => {
    await pg.getByRole('link', { name: 'My Case Notes' }).click();
    await pg.waitForSelector('h1:has-text("My Case Notes")');
    const db = await source();
    check('count matches data', (await pg.locator('.filter-card').first().innerText()).startsWith(String(db.notes.filter((n) => n.author === db.userId).length)));
    await pg.locator('.filter-card', { hasText: 'Personal' }).click();
    await btn(/Reverse order/).click();
    await reload();
    check('filter stays after reload', (await pg.locator('.filter-card', { hasText: 'Personal' }).getAttribute('aria-pressed')) === 'true');
    check('sort stays after reload', (await text('.list-head')).includes('Oldest first'));
    check('Personal shows only PERSONAL', (await pg.locator('.feed .chip-tag').allInnerTexts()).every((t) => t === 'PERSONAL'));
    const dates = (await pg.locator('.feed-item .meta > span:first-child').allInnerTexts()).map((d) => d.slice(6) + d.slice(0, 2) + d.slice(3, 5));
    check('oldest first is in date order', dates.every((d, i) => i === 0 || dates[i - 1] <= d));
  });

  await part('Starred Clients', async () => {
    await pg.getByRole('link', { name: 'Starred Clients' }).click();
    await pg.waitForSelector('h1:has-text("My Starred Clients")');
    await btn('Client Name').click();
    const names = await pg.locator('.tr.is-row .link-btn').allInnerTexts();
    check('sorts by name', names.join('|') === [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join('|'));
    const victim = names[0];
    await pg.locator('.tr.is-row').first().locator('.fav').click();
    await pg.waitForTimeout(150);
    await reload();
    check('unstar is saved', !(await pg.locator('.tr.is-row .link-btn').allInnerTexts()).includes(victim));
    const q = names[1].split(',')[0];
    await pg.fill('#starred-search', q);
    check('search narrows the table', (await count('.tr.is-row')) >= 1 && (await pg.locator('.tr.is-row .link-btn').allInnerTexts()).every((n) => n.toLowerCase().includes(q.toLowerCase())));
    await reload();
    check('search stays after reload', (await pg.inputValue('#starred-search')) === q);
    await pg.fill('#starred-search', '');
    await pg.locator('.filter-card', { hasText: 'Privately starred' }).click();
    const db = await source();
    check('Privately starred count matches data', (await count('.tr.is-row')) === Math.min(10, db.clients.filter((c) => c.starred === 'private').length));
    await pg.locator('.filter-card').first().click();
  });

  await part('Search for Clients', async () => {
    await btn('Search for Client').click();
    await pg.waitForSelector('#search-title');
    check('focus starts in First Name', (await pg.evaluate(() => document.activeElement.id)) === 's-first');
    await btn('Search', true).click();
    check('empty search explains itself', (await text('.field-error')).includes('at least one field'));
    await pg.fill('#s-last', 'a'); await btn('Search', true).click();
    await pg.waitForSelector('text=Too many search results');
    check('too many results state', true);
    await pg.fill('#s-last', 'Jones'); await pg.fill('#s-first', 'Jim'); await btn('Search', true).click();
    await pg.waitForSelector('.modal .tr.is-row');
    check('finds Jimothy', (await count('.modal .tr.is-row')) === 1);
    await reload();
    await pg.waitForSelector('.modal .tr.is-row');
    check('dialog, form and results come back after reload', (await pg.inputValue('#s-first')) === 'Jim');
    const db = await source();
    const c = db.clients.find((x) => x.id === 'c12');
    await btn('Clear').click();
    await pg.fill('#s-ssn', c.ssn4); await pg.fill('#s-dhs', c.dhs); await btn('Search', true).click();
    await pg.waitForSelector('.modal .tr.is-row');
    check('finds a client by SSN last 4 and DHS ID', (await text('.modal .tr.is-row')).includes(c.mci));
    const house = db.clients.find((x) => x.household);
    await btn('Clear').click();
    await pg.fill('#s-first', house.members[0].split(' ')[0]); await pg.fill('#s-last', house.first); await btn('Search', true).click();
    await pg.waitForTimeout(200);
    check('finds a household by a member\'s name', (await pg.locator('.modal .link-btn').allInnerTexts()).includes(house.first + ' ' + house.last));
    await pg.keyboard.press('Tab');
    await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Shift+Tab');
    check('Tab stays inside the dialog', await pg.evaluate(() => !!document.activeElement.closest('.modal')));
    await pg.keyboard.press('Escape');
    check('Escape closes the dialog', (await count('.modal')) === 0);
  });

  await part('Report Missing Client', async () => {
    await btn('Search for Client').click();
    await btn('Report Missing Client').click();
    await pg.fill('#m-first', 'Test'); await pg.fill('#m-last', 'Person');
    await reload();
    check('draft stays after reload', (await pg.inputValue('#m-first')) === 'Test');
    check('Submit waits for required fields', await btn('Submit Issue').isDisabled());
    await pg.fill('#m-dob', '1990-01-02');
    await btn('Submit Issue').click();
    await pg.waitForSelector('text=Thanks. We got your request');
    const db = await source();
    check('report saved to the data source', db.reports.some((r) => r.kind === 'missing' && r.first === 'Test'));
    await btn('Done').click();
  });

  await part('Report an Issue', async () => {
    await btn('Report an Issue').click();
    await btn('Improvement').click();
    await pg.fill('#i-details', 'Please add a print view');
    await btn('Submit Issue').click();
    await pg.waitForSelector('text=Thanks for telling us');
    const db = await source();
    check('issue saved to the data source', db.reports.some((r) => r.kind === 'issue' && r.type === 'Improvement' && r.details === 'Please add a print view'));
    await btn('Done').click();
  });

  await part('Client profile', async () => {
    await btn('Search for Client').click();
    await pg.fill('#s-last', 'Jones'); await pg.fill('#s-first', 'Jim'); await btn('Search', true).click();
    await pg.locator('.modal .link-btn').first().click();
    await pg.waitForSelector('.client-head');
    check('opens Jimothy on Client Overview', pg.url().includes('#client/c1/overview') && (await text('.client-head h1')) === 'Jimothy Jones');
    check('page title names the client', (await pg.title()) === 'Jimothy Jones · Client Overview · CoLab');
    check('notes panel open on Overview', (await count('aside.panel')) === 1);
    check('contact source from the data', (await text('.kv-grid')).includes('As of 10/14/2026'));
    await btn('Demographic Information').click();
    check('demographics', (await text('.demo-grid')).includes('Never Married/Single'));
    await btn('Program Enrollment').click();
    check('six enrollments', (await count('.enroll')) === 6);
  });

  await part('SSN', async () => {
    check('hidden by default', (await text('.ids')).includes('••• •• 1234'));
    await btn('Show SSN').click();
    await pg.waitForTimeout(150);
    const db = await source();
    check('shows the full SSN from the data source', (await text('.ids')).includes(db.clients[0].ssnFull));
    await btn('Copy SSN').click();
    await pg.waitForTimeout(100);
    check('copies the full SSN', (await pg.evaluate(() => window.__clip)).includes(db.clients[0].ssnFull));
    await reload();
    check('hides again after reload', (await text('.ids')).includes('••• •• 1234'));
  });

  await part('Notes panel', async () => {
    await pg.locator('aside.panel').getByRole('button', { name: 'Add New Case Note' }).click();
    await pg.fill('#note-draft', 'Draft survives reload');
    await reload();
    check('half-written note stays after reload', (await pg.inputValue('#note-draft')) === 'Draft survives reload');
    check('Overview section stays after reload', (await btn('Program Enrollment').getAttribute('aria-pressed')) === 'true');
    await pg.locator('aside.panel').getByRole('button', { name: 'Save', exact: true }).click();
    await pg.waitForTimeout(150);
    check('note saved and shown open', (await pg.locator('aside.panel .note', { hasText: 'Draft survives reload' }).count()) === 1);
    let db = await source();
    check('note saved to the data source as Logan\'s', db.notes.some((n) => n.text === 'Draft survives reload' && n.author === 'u1' && n.clientId === 'c1'));
    await pg.locator('aside.panel').getByRole('button', { name: 'Add New Case Note' }).click();
    await pg.locator('aside.panel').getByRole('button', { name: 'Save', exact: true }).click();
    check('empty note is not saved', (await text('.error')).includes('Write the note'));
    await pg.locator('aside.panel').getByRole('button', { name: 'Cancel' }).click();
    await pg.locator('aside.panel').getByRole('button', { name: 'Add New Action Item' }).click();
    await pg.fill('#action-draft', 'Call the housing navigator');
    await pg.selectOption('#action-assignee', 'u4');
    await pg.fill('#action-due', '2026-12-01');
    await pg.locator('aside.panel').getByRole('button', { name: 'Save', exact: true }).click();
    await pg.waitForTimeout(150);
    await reload();
    const row = pg.locator('aside.panel .task', { hasText: 'Call the housing navigator' });
    check('action item saved and listed first', (await row.count()) === 1 && (await text('aside.panel .task')).includes('Call the housing navigator'));
    check('assignee shown by name', (await row.innerText()).includes('Priya Natarajan'));
    db = await source();
    check('action item saved to the data source', db.actions.some((a) => a.text === 'Call the housing navigator' && a.assignee === 'u4' && a.due === '2026-12-01'));
    await btn('Collapse case notes and action items').click();
    await reload();
    check('collapsed panel stays collapsed', (await count('aside.panel-rail')) === 1);
    await btn('Expand case notes and action items').click();
    await pg.waitForSelector('.panel .seg');
    check('panel filters fit on one line', await pg.evaluate(() => new Set([...document.querySelectorAll('.panel .seg')].map((e) => Math.round(e.getBoundingClientRect().top))).size === 1));
  });

  await part('Services tab', async () => {
    await pg.getByRole('link', { name: 'Services', exact: true }).click();
    await pg.waitForSelector('#svc-search');
    check('seven services', (await count('.table[aria-label=Services] .tr.is-row')) === 7);
    await pg.fill('#svc-search', 'crisis');
    check('search', (await count('.table[aria-label=Services] .tr.is-row')) === 2);
    await reload();
    check('search stays after reload', (await pg.inputValue('#svc-search')) === 'crisis');
    await pg.fill('#svc-search', '');
    await btn('Service', true).click();
    const svc = await pg.locator('.table[aria-label=Services] .tr.is-row .td:nth-child(5)').allInnerTexts();
    check('sorts by service', svc.join('|') === [...svc].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join('|'));
    await btn('Grouped Services').click();
    check('Grouped Services counts unique services', (await text('.chips')).includes('Unique Services'));
    await btn('All Services').click();
    await btn('More filters').click();
    await pg.selectOption('#svc-category', 'Housing');
    check('More filters narrows the table', (await count('.table[aria-label=Services] .tr.is-row')) === 1);
    await pg.keyboard.press('Escape');
    check('Escape closes the popover', (await count('.popover')) === 0);
    await btn('More filters').click(); await btn('Clear all filters').click(); await pg.keyboard.press('Escape');
    await btn(/^More actions for/).first().click();
    check('row menu opens', (await count('.menu')) === 1);
    await pg.mouse.click(5, 500);
    check('row menu closes on outside click', (await count('.menu')) === 0);
    await pg.locator('.table[aria-label=Services] .tr.is-row .td:nth-child(5) a').first().click();
    await pg.waitForSelector('h2:has-text("Service:")');
    check('service details address', pg.url().includes('/service/'));
    check('service instances listed', (await count('.table[aria-label="Service instances"] .tr.is-row')) >= 1);
    await pg.locator('.table[aria-label="Service instances"] .tr.is-row a').first().click();
    await pg.waitForSelector('h2:has-text("Provider:")');
    const db = await source();
    const prov = db.providers.find((p) => p.name === decodeURIComponent(pg.url().split('/provider/')[1]));
    await pg.waitForSelector('text=Main Phone Number');
    check('provider contact from the data source', (await text('.chips')).includes(prov.phone) && (await text('.chips')).includes(prov.email));
    await pg.goBack(); await pg.waitForSelector('h2:has-text("Service:")');
    check('Back returns to the service', true);
    await pg.getByRole('link', { name: 'Client Details' }).click();
    check('breadcrumb returns to the last tab', pg.url().endsWith('/services'));
  });

  await part('Program Info tab', async () => {
    await pg.getByRole('link', { name: 'Program Info' }).click();
    await pg.waitForSelector('#program-select');
    check('four cases', (await count('.table[aria-label="Case history"] .tr.is-row')) === 4);
    await btn(/Domestic Violence/).click();
    check('DV filter', (await count('.table[aria-label="Case history"] .tr.is-row')) === 3);
    await pg.locator('.event-toggle').first().click();
    await reload();
    check('filter and opened event stay after reload', (await count('.table[aria-label="Case history"] .tr.is-row')) === 3 && (await count('.event-details')) === 1);
    check('custody details from the data', (await text('.event-details')).includes('[Admission reason]'));
    await pg.selectOption('#program-select', 'housing');
    check('undesigned programs say so', (await text('.empty-box')).includes('not been designed'));
    await pg.selectOption('#program-select', 'justice');
  });

  await part('Providers and Benefits tabs', async () => {
    await pg.getByRole('link', { name: 'Providers', exact: true }).click();
    await pg.waitForSelector('#prov-search');
    check('four providers', (await count('.table[aria-label=Providers] .tr.is-row')) === 4);
    await pg.selectOption('#prov-program', 'Housing');
    check('program filter', (await count('.table[aria-label=Providers] .tr.is-row')) === 1);
    await pg.selectOption('#prov-program', '');
    await pg.getByRole('link', { name: 'Benefits' }).click();
    check('Benefits placeholder', (await text('.empty-box')).includes('not designed yet'));
  });

  await part('All Case Notes and All Action Items', async () => {
    await pg.getByRole('link', { name: 'Client Overview' }).click();
    await pg.getByRole('link', { name: 'View All Case Notes' }).click();
    await pg.waitForSelector('#all-notes-h');
    check('full page lists every note', pg.url().includes('#client/c1/case-notes') && (await count('.feed-item')) === 10 && (await text('#all-notes-h')).includes('13 notes'));
    check('new note first', (await text('.feed-item')).includes('Draft survives reload'));
    await pg.locator('.feed-item').first().getByRole('button', { name: /^Edit note/ }).click();
    await pg.fill('#note-draft', 'Edited note text');
    await pg.getByRole('checkbox', { name: 'Restricted note' }).check();
    await btn('Save', true).click();
    await pg.waitForTimeout(150);
    await reload();
    const first = await text('.feed-item');
    check('edit saved, marked Edited and Restricted', first.includes('Edited note text') && first.includes('Edited') && first.includes('Restricted'));
    await pg.locator('.feed-item').first().getByRole('button', { name: /^Delete note/ }).click();
    await pg.locator('.toast button:has-text("Undo")').click();
    await pg.waitForTimeout(200);
    check('Undo brings a deleted note back', (await text('.feed')).includes('Edited note text'));
    await pg.locator('.feed-item').first().getByRole('button', { name: /^Delete note/ }).click();
    await pg.waitForTimeout(150);
    await reload();
    check('delete is saved', !(await text('.feed')).includes('Edited note text'));
    await pg.getByRole('link', { name: 'Client Details' }).click();
    await pg.getByRole('link', { name: 'View All Action Items' }).click();
    await pg.waitForSelector('#all-actions-h');
    check('action items page lists the new item', (await text('.feed')).includes('Call the housing navigator'));
    await pg.locator('.feed-item', { hasText: 'Call the housing navigator' }).getByRole('button', { name: 'Edit action item' }).click();
    await pg.fill('#action-draft', 'Call the housing navigator today');
    await btn('Save', true).click();
    await pg.waitForTimeout(150);
    const db = await source();
    check('action item edit saved', db.actions.some((a) => a.text === 'Call the housing navigator today' && a.edited));
  });

  // Address History. Jimothy's 47 records are the prototype's own data, so his screens are checked against the
  // values the Replit prototype shows (with correct calendar dates: the prototype shifts date-only values back a day).
  const periodsChip = async () => ((await count('.addr-periods')) ? (await pg.locator('.addr-periods').textContent()).replace(/\s+/g, ' ').trim() : '');
  // Address screens remember their view, filter, sort and open row; each part starts from the defaults.
  const freshAddressPrefs = () => pg.evaluate(() => { const p = JSON.parse(localStorage.getItem('colab.prefs') || '{}'); Object.keys(p).filter((k) => k.startsWith('address.') || k === 'sort.addresses').forEach((k) => delete p[k]); localStorage.setItem('colab.prefs', JSON.stringify(p)); });
  await part('Address: overview', async () => {
    await go('#client/c1/overview');
    if ((await btn('Contact Information').getAttribute('aria-pressed')) !== 'true') await btn('Contact Information').click();
    const kv = await text('.kv-grid');
    check('most recent address shows', kv.includes('999 Murray Avenue, Apt 502') && kv.includes('Pittsburgh, PA 15217'), kv.slice(0, 120));
    check('"4 Concurrent" badge', (await text('.concurrent-pill')) === '4 Concurrent');
    check('badge tooltip text', (await pg.locator('#conc-tip-c1').textContent()) === '4 other addresses reported for the same period');
    await pg.locator('.concurrent-pill').hover();
    check('badge tooltip shows on hover', await pg.locator('#conc-tip-c1').isVisible());
    check('both links show', (await btn('View Address Details').count()) === 1 && (await pg.getByRole('link', { name: 'View Full Address History' }).count()) === 1);
    await pg.locator('.concurrent-pill').click();
    check('badge opens Address Details', await pg.getByRole('dialog', { name: 'Address Details' }).isVisible());
    await pg.keyboard.press('Escape');
    check('Escape closes it', (await count('.modal')) === 0);
  });

  await part('Address: details dialog', async () => {
    await btn('View Address Details').click();
    const dlg = pg.getByRole('dialog', { name: 'Address Details' });
    check('opens', await dlg.isVisible());
    check('focus starts on the main action', (await pg.evaluate(() => document.activeElement.textContent)) === 'View Full Address History');
    check('most recent verified heading', (await text('.modal #mrv-h')).toLowerCase() === 'most recent verified');
    check('most recent address', (await text('.modal .addr-title')) === '999 Murray Avenue, Apt 502, Pittsburgh, PA 15217');
    check('dates', (await text('.modal .addr-modal-body > section .addr-sub')).startsWith('Jun 1, 2025 – Present'));
    const src = await text('.modal .addr-source-line');
    check('source tags and as-of date', /SNAP/.test(src) && /DHS/.test(src) && src.includes('As of Jun 1, 2025'), src);
    check('school, ward and facility lines', (await text('.modal .addr-facts')).includes('Pittsburgh City School District'));
    check('concurrent heading with count', (await text('.modal #conc-h')).toLowerCase() === 'concurrent addresses (4)');
    check('helper text', (await text('.modal .addr-help')) === 'Other addresses are open for this client during the same period. Sources may disagree; review before relying on a single address.');
    const streets = await pg.locator('.modal .addr-street').allInnerTexts();
    check('concurrent rows in prototype order', JSON.stringify(streets) === JSON.stringify(['No Fixed Address — Downtown Outreach Zone', '999 Murray Ave, Unit 500', 'PO Box 8841', '88 Pleasant View Dr']), streets);
    const ranges = await pg.locator('.modal .addr-range').allInnerTexts();
    check('row date ranges', JSON.stringify(ranges) === JSON.stringify(['May 2025 – Present', 'Apr 2025 – Present', 'Feb 2025 – Present', 'Jan 2025 – Present']), ranges);
    check('every row is marked current', (await count('.modal .addr-current')) === 4);
    check('row cities', (await pg.locator('.modal .addr-city').allInnerTexts())[3] === 'Weirton, WV 26062');
    const tags = await pg.locator('.modal .addr-card').evaluateAll((cs) => cs.map((c) => [...c.querySelectorAll('.addr-tags .src-tag')].map((t) => t.textContent).join('/')));
    check('row program tags', JSON.stringify(tags) === JSON.stringify(['OBH/Shelter', 'OBH/Provider', 'DHS', 'Medicare']), tags);
    check('shelter row has the shelter icon', (await pg.locator('.modal .addr-card').first().locator('.addr-kind.is-shelter').count()) === 1);
    const toggles = pg.locator('.modal .addr-toggle');
    await toggles.nth(1).click();
    check('a row expands', (await toggles.nth(1).getAttribute('aria-expanded')) === 'true');
    const body = await text('.modal .addr-body');
    for (const want of ['Last reported May 15, 2025', 'Pittsburgh', 'Allegheny', 'Pittsburgh City School District', 'Apr 1, 2025', 'Present', 'dmwilliams84@gmail.com', '(412) 555-0183 (Mobile)', 'Valid since Apr 1, 2025', '(412) 555-0297 (Work)', 'Mercy Behavioral Health', 'PA-OBH-MBH-00017', 'Yes']) check('details show ' + want, body.includes(want));
    check('duration in days', /\d+ yr \d+ mo \(\d+ days\)|\d+ yr \(\d+ days\)/.test(body));
    await toggles.nth(0).click();
    check('only one row open at a time', (await count('.modal .addr-body')) === 1 && (await toggles.nth(1).getAttribute('aria-expanded')) === 'false');
    await pg.locator('.modal .addr-card').first().locator('.addr-head').click({ position: { x: 5, y: 20 } });
    check('clicking the row edge closes it too', (await count('.modal .addr-body')) === 0);
    const snap = await pg.locator('.modal .addr-source-line .src-tip').first().locator('.tip-box').textContent();
    check('tag tooltip names the program and its systems', snap.startsWith('SNAP — Food Assistance') && snap.includes('BNFREN'), snap);
    await pg.locator('.modal-foot .btn-text', { hasText: 'Close' }).click();
    check('Close closes', (await count('.modal')) === 0);
    await btn('View Address Details').click();
    await pg.locator('.modal .btn-primary').click();
    await pg.waitForSelector('.addr-history');
    check('"View Full Address History" goes to the history', pg.url().endsWith('#client/c1/address-history') && (await count('.modal')) === 0);
  });

  await part('Address: history page', async () => {
    await go('#client/c1/overview');
    await freshAddressPrefs();
    await reload();
    await pg.getByRole('link', { name: 'View Full Address History' }).click();
    await pg.waitForSelector('.addr-history');
    check('the link opens the history', pg.url().endsWith('#client/c1/address-history'));
    check('page title', (await pg.title()) === 'Jimothy Jones · Address History · CoLab', await pg.title());
    const crumbs = await text('nav[aria-label=Breadcrumb]');
    check('breadcrumb', crumbs.includes('Home') && crumbs.includes('Client Details') && crumbs.includes('Address History'), crumbs);
    check('heading', (await text('.addr-history h2')) === 'Address History');
    check('summary line', (await text('.addr-history .view-head .addr-sub')) === '47 addresses on record · 5 counties/states');
    check('concurrent periods chip', (await periodsChip()) === '⇉ 4 concurrent periods');
    check('Timeline is the default view', (await btn('Timeline').getAttribute('aria-pressed')) === 'true');
    check('47 address cards', (await count('.addr-card')) === 47);
    const years = await pg.locator('.addr-year').allInnerTexts();
    check('year headings', years.join(',') === '2023,2019,2018,2017,2015,2011,2010,2009,2008,2007,2006,2005,2004,2003,1998', years);
    const heads = await pg.locator('.addr-period-head').allInnerTexts();
    const wantHeads = ['Concurrent reports (6 addresses reported between Dec 2023 and Present)', 'Concurrent reports (10 addresses reported between Jun 2019 and Nov 2023)', 'Concurrent reports (6 addresses reported between Nov 2015 and Mar 2017)', 'Concurrent reports (12 addresses reported between Feb 2011 and Oct 2015)'];
    check('concurrent groups and their spans', JSON.stringify(heads) === JSON.stringify(wantHeads), heads);
    check('five current addresses', (await count('.addr-current')) === 5);
    check('current streets are bold', (await count('.addr-street.is-current')) === 5);
    check('first card is the most recent', (await text('.addr-card .addr-street')) === '999 Murray Avenue, Apt 502');
    check('Present is green', (await pg.locator('.addr-present').first().evaluate((e) => getComputedStyle(e).color)) === 'rgb(11, 107, 88)');
    check('at most three tags per card', await pg.locator('.addr-card').evaluateAll((cs) => cs.every((c) => c.querySelectorAll('.addr-tags .src-tag').length <= 3)));
    check('tag colors per program', (await pg.locator('.src-tag.is-Shelter').first().evaluate((e) => getComputedStyle(e).color)) === 'rgb(155, 44, 33)');
    const tips = await pg.locator('.addr-history .src-tip .tip-box').evaluateAll((ts) => ts.filter((t) => !(t.querySelector('.tip-title').textContent && (t.querySelector('.src-systems') || /^No specific system data available\.(• Reported \w{3} \d+, \d{4})*$/.test(t.textContent.replace(t.querySelector('.tip-title').textContent, ''))))).length);
    check('every tag tooltip has a program name and its systems or report dates', tips === 0, tips);
    const kinds = await pg.locator('.addr-kind').evaluateAll((ks) => [...new Set(ks.map((k) => k.className))].sort());
    check('residence, shelter, transitional and custody icons', kinds.length === 4, kinds);
    const first = pg.locator('.addr-card .addr-toggle').first();
    await first.click();
    check('a card expands', (await first.getAttribute('aria-expanded')) === 'true' && (await count('.addr-card .addr-body')) === 1);
    check('details have both sections', (await text('.addr-card .addr-body')).includes('ADDRESS INFORMATION') || (await text('.addr-card .addr-body')).toLowerCase().includes('address information'));
    await reload();
    check('open card stays open after reload', (await pg.locator('.addr-card .addr-toggle').first().getAttribute('aria-expanded')) === 'true');
    await pg.locator('.addr-card .addr-toggle').nth(2).click();
    check('opening another closes the first', (await count('.addr-card .addr-body')) === 1 && (await pg.locator('.addr-card .addr-toggle').first().getAttribute('aria-expanded')) === 'false');
    await pg.locator('.addr-card .addr-tags .src-tag').nth(2).click();
    check('clicking a tag toggles its card, as in the prototype', (await count('.addr-card .addr-body')) <= 1);
  });

  await part('Address: source filter', async () => {
    await go('#home'); await freshAddressPrefs(); await reload();
    await go('#client/c1/address-history');
    const pick = async (name) => { await pg.locator('.select-btn').click(); await pg.locator('.check-row', { hasText: new RegExp('^' + name + '$') }).locator('input').check(); await pg.keyboard.press('Escape'); };
    check('all sources by default', (await text('.select-btn')) === 'All sources');
    await pg.locator('.select-btn').click();
    const rows = await pg.locator('.check-row').allInnerTexts();
    check('nine programs to choose from', rows.join(',') === 'OBH,DHS,Medicare,SNAP,CYF,ACHD,Shelter,Provider,Self', rows);
    check('no Clear all until something is chosen', (await btn('Clear all').count()) === 0);
    await pg.keyboard.press('Escape');
    check('Escape closes the menu', (await count('.check-row')) === 0);
    await pick('Shelter');
    check('label names the one program', (await text('.select-btn')) === 'Shelter');
    check('Shelter: 7 addresses', (await count('.addr-card')) === 7);
    check('Shelter: 1 concurrent period', (await periodsChip()) === '⇉ 1 concurrent period');
    check('every card shown carries the program', await pg.locator('.addr-card').evaluateAll((cs) => cs.every((c) => !!c.querySelector('.src-tag.is-Shelter') || c.querySelectorAll('.addr-tags .src-tag').length === 3)));
    check('summary still counts everything', (await text('.addr-history .view-head .addr-sub')).startsWith('47 addresses'));
    await reload();
    check('filter stays after reload', (await text('.select-btn')) === 'Shelter' && (await count('.addr-card')) === 7);
    await pick('OBH');
    check('two programs', (await text('.select-btn')) === '2 sources');
    const db = await source();
    const c1 = db.clients.find((c) => c.id === 'c1');
    check('either program counts', (await count('.addr-card')) === c1.addresses.filter((a) => a.sources.includes('Shelter') || a.sources.includes('OBH')).length);
    await pg.locator('.select-btn').click();
    await btn('Clear all').click();
    check('Clear all', (await text('.select-btn')) === 'All sources' && (await count('.addr-card')) === 47);
    await pg.keyboard.press('Escape');
    await pick('CYF');
    const cyf = c1.addresses.filter((a) => a.sources.includes('CYF')).length;
    check('CYF count matches the data', (await count('.addr-card')) === cyf, cyf);
    if (cyf === 0) check('empty state', (await text('.addr-history .empty')) === 'No addresses match the current filters.');
    await pg.locator('.select-btn').click(); await btn('Clear all').click(); await pg.keyboard.press('Escape');
  });

  await part('Address: table', async () => {
    await go('#home'); await freshAddressPrefs(); await reload();
    await go('#client/c1/address-history');
    await btn('Table').click();
    check('47 rows', (await count('.addr-row')) === 47);
    check('"47 of 47 shown"', (await text('.addr-count')) === '47 of 47 shown');
    check('search placeholder', (await pg.getAttribute('#addr-search', 'placeholder')) === 'Search address or city…');
    const headers = await pg.locator('.table[aria-label="Address history"] .th').allInnerTexts();
    check('columns', headers.map((h) => h.trim()).join(',') === 'Details,Address,Date Range,Sources,Reports', headers);
    check('sorted newest first', (await text('.addr-row .addr-street')) === '999 Murray Avenue, Apt 502');
    check('Date Range shows it is sorted', (await pg.locator('.th', { hasText: 'Date Range' }).getAttribute('aria-sort')) === 'descending');
    const db = await source();
    const c1 = db.clients.find((c) => c.id === 'c1');
    const oldest = c1.addresses.slice().sort((a, b) => (a.start < b.start ? -1 : 1))[0];
    await btn('Date Range', true).click();
    check('second click sorts oldest first', (await text('.addr-row .addr-street')) === oldest.street, [await text('.addr-row .addr-street'), oldest.street]);
    await btn('Address', true).click();
    const byStreet = c1.addresses.map((a) => a.street).sort().reverse()[0];
    check('a new column starts descending', (await pg.locator('.th', { hasText: 'Address' }).getAttribute('aria-sort')) === 'descending' && (await text('.addr-row .addr-street')) === byStreet, [await text('.addr-row .addr-street'), byStreet]);
    await reload();
    check('view and sort stay after reload', (await count('.addr-row')) === 47 && (await pg.locator('.th', { hasText: 'Address' }).getAttribute('aria-sort')) === 'descending');
    await btn('Date Range', true).click();
    const concurrentRows = await count('.addr-row .addr-concurrent-chip');
    check('concurrent chip on records with a conflict note', concurrentRows === c1.addresses.filter((a) => a.conflict).length, concurrentRows);
    check('Active chip on open records', (await count('.addr-row .addr-current')) === 5 && (await text('.addr-row .addr-current')) === 'ACTIVE');
    const reports = await pg.locator('.addr-row .td:last-child').allInnerTexts();
    check('report counts', reports[0].replace(/\s+/g, ' ') === '2 reports' && reports.some((r) => /^1 report$/.test(r.replace(/\s+/g, ' '))), reports.slice(0, 4));
    await pg.fill('#addr-search', 'weirton');
    const weirton = c1.addresses.filter((a) => /weirton/i.test(a.street + ' ' + a.city)).length;
    check('search by city', (await count('.addr-row')) === weirton && (await text('.addr-count')) === `${weirton} of 47 shown`, weirton);
    await pg.fill('#addr-search', 'Murray');
    check('search by street', (await count('.addr-row')) === c1.addresses.filter((a) => /murray/i.test(a.street + a.city)).length);
    await pg.fill('#addr-search', 'zzzz');
    check('no-match message', (await text('.table[aria-label="Address history"]')).includes('No addresses match the current filters.') && (await text('.addr-count')) === '0 of 47 shown');
    await pg.fill('#addr-search', '');
    await pg.locator('.addr-row').first().click();
    check('a row expands', (await count('.addr-detail-row')) === 1 && (await text('.addr-detail-row')).includes('Last reported'));
    await pg.locator('.addr-row').nth(3).locator('.icon-btn').click();
    check('only one row open', (await count('.addr-detail-row')) === 1 && (await pg.locator('.addr-row').nth(3).locator('.icon-btn').getAttribute('aria-expanded')) === 'true');
    await btn('Timeline').click();
    check('switching view closes the open row', (await count('.addr-body')) === 0);
    await btn('Table').click();
    await pg.locator('.select-btn').click();
    await pg.locator('.check-row', { hasText: /^Shelter$/ }).locator('input').check();
    await pg.keyboard.press('Escape');
    check('the filter applies to the table', (await text('.addr-count')) === '7 of 47 shown');
    await pg.locator('.select-btn').click(); await btn('Clear all').click(); await pg.keyboard.press('Escape');
    await btn('Timeline').click();
  });

  await part('Address: navigation', async () => {
    await go('#client/c1/address-history');
    await pg.getByRole('link', { name: 'Back to Client Overview' }).click();
    check('back link returns to the overview', pg.url().endsWith('#client/c1/overview'));
    await pg.goBack();
    await pg.waitForSelector('.addr-history');
    check('browser Back returns to the history', pg.url().endsWith('#client/c1/address-history'));
    await pg.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Client Details' }).click();
    check('breadcrumb returns to the client', pg.url().includes('#client/c1/'));
    await go('#client/c1/address-history');
    await pg.getByRole('link', { name: 'Back to Client Overview' }).click();
    await btn('View Address Details').click();
    await pg.goBack();
    await pg.waitForSelector('.addr-history');
    check('Back with the dialog open dismisses it', (await count('.modal')) === 0);
    await go('#client/c1/overview');
    await btn('View Address Details').click();
    await reload();
    check('a reload keeps the dialog open', (await count('.modal .addr-title')) === 1);
    await pg.keyboard.press('Escape');
    await go('#client/c7/address-history');
    check('a direct link opens any client', (await count('.addr-history')) === 1);
  });

  // Every client's address screens, checked against its records.
  const A = await import('../src/data/addresses.js');
  await part('Address: every client', async () => {
    await go('#home'); await freshAddressPrefs(); await reload();
    const db = await source();
    const wrong = [];
    for (const c of db.clients) {
      const list = c.addresses;
      if (!list || list.length < 3) { wrong.push(c.id + ' has ' + (list ? list.length : 0) + ' records'); continue; }
      const cur = A.currentAddresses(list);
      if (cur[0].street !== c.address.street) wrong.push(c.id + ' most recent ≠ profile address');
      await go(`#client/${c.id}/overview`);
      await pg.waitForSelector('.client-head');
      if ((await btn('Contact Information').getAttribute('aria-pressed')) !== 'true') await btn('Contact Information').click();
      const pill = (await count('.concurrent-pill')) ? await text('.concurrent-pill') : '';
      if (pill !== (cur.length > 1 ? `${cur.length - 1} Concurrent` : '')) wrong.push(c.id + ' badge ' + pill);
      if (!(await text('.kv-grid')).includes(`${cur[0].city}, ${A.stateOf(cur[0].county)} ${cur[0].zip}`)) wrong.push(c.id + ' city line');
      await btn('View Address Details').click();
      await pg.waitForSelector('.modal .addr-title');
      if ((await count('.modal .addr-card')) !== cur.length - 1) wrong.push(c.id + ' dialog rows');
      if (!(await text('.modal .addr-title')).startsWith(cur[0].street)) wrong.push(c.id + ' dialog address');
      await pg.locator('.modal .btn-primary').click();
      await pg.waitForSelector('.addr-history');
      const n = list.length, k = A.countyCount(list);
      if ((await text('.addr-history .view-head .addr-sub')) !== `${n} address${n !== 1 ? 'es' : ''} on record · ${k} counties/states`) wrong.push(c.id + ' summary');
      if ((await count('.addr-card')) !== n) wrong.push(c.id + ' cards');
      const p = A.concurrentPeriods(list);
      const chip = await periodsChip();
      if (chip !== (p ? `⇉ ${p} concurrent period${p > 1 ? 's' : ''}` : '')) wrong.push(c.id + ' periods ' + chip);
      const years = (await pg.locator('.addr-year').allInnerTexts()).join(',');
      if (years !== A.timelineYears(list).map((y) => y.year).join(',')) wrong.push(c.id + ' years');
      if ((await count('.addr-period')) !== p) wrong.push(c.id + ' period groups');
      if ((await count('.addr-current')) !== cur.length) wrong.push(c.id + ' current chips');
      const ranges = await pg.locator('.addr-card .addr-range').allInnerTexts();
      const want = A.timelineYears(list).flatMap((y) => y.groups.flatMap((g) => (g.type === 'single' ? [g.addr] : g.addrs))).map((a) => `${A.monthYear(a.start)} – ${a.end ? A.monthYear(a.end) : 'Present'}`);
      if (ranges.join('|') !== want.join('|')) wrong.push(c.id + ' card dates');
      for (const a of list) {
        if (a.end && a.end < a.start) wrong.push(c.id + ' ' + a.id + ' ends before it starts');
        if (!a.sources.length || !a.reports.length) wrong.push(c.id + ' ' + a.id + ' has no source');
        if (a.sources.some((s) => !A.SOURCE_BUCKETS.includes(s))) wrong.push(c.id + ' ' + a.id + ' unknown source');
      }
    }
    check('badges, dialogs, timelines and dates for all 64 clients', wrong.length === 0, wrong.slice(0, 6));
  });

  await part('Every client renders every view', async () => {
    const bad = [];
    for (let i = 1; i <= 64; i++) {
      for (const t of ['overview', 'services', 'program-info', 'providers', 'case-notes', 'action-items']) {
        await pg.goto(BASE + `#client/c${i}/${t}`);
        await pg.waitForSelector('.client-head', { timeout: 4000 }).catch(() => bad.push(`c${i}/${t}`));
      }
    }
    check('64 clients × 6 views', bad.length === 0, bad.slice(0, 5));
    await go('#client/c999/overview');
    await pg.waitForSelector('text=Client not found');
    check('unknown client says so', true);
  });

  if (!api) {
    await part('Every data point matches the data', async () => {
      const db = await source();
      const wrong = [];
      for (const c of db.clients) {
        await go(`#client/${c.id}/overview`);
        await pg.waitForSelector('.client-head');
        if ((await btn('Contact Information').getAttribute('aria-pressed')) !== 'true') await btn('Contact Information').click();
        const head = await text('.client-head'), kv = await text('.kv-grid');
        const want = [c.first + ' ' + c.last, c.mci, c.dhs, c.dpw, '••• •• ' + c.ssn4].filter((x) => !head.includes(x));
        const kvWant = [c.address.street, c.address.zip, c.address.ward, c.address.school, c.phone || 'Not on file', c.email || 'Not on file', c.sources.address.source, 'As of ' + c.sources.address.asOf, 'As of ' + c.sources.phone.asOf].filter((x) => !kv.includes(x));
        const notes = db.notes.filter((n) => n.clientId === c.id).length, acts = db.actions.filter((a) => a.clientId === c.id).length;
        const panel = await text('aside.panel');
        if (!panel.includes(`of ${notes} note`)) wrong.push(c.id + ' notes ' + notes);
        if (!panel.includes(`of ${acts} item`)) wrong.push(c.id + ' actions ' + acts);
        if (want.length || kvWant.length) wrong.push(c.id + ' ' + want.concat(kvWant).join(', '));
        await btn('Program Enrollment').click();
        const enr = await count('.enroll');
        if (enr !== c.enrollments.length) wrong.push(c.id + ' enrollments ' + enr + '≠' + c.enrollments.length);
        await btn('Contact Information').click();
        await go(`#client/${c.id}/services`);
        const pager = await text('.pager');
        if (!pager.includes('of ' + c.services.length)) wrong.push(c.id + ' services ' + pager);
        await go(`#client/${c.id}/providers`);
        const provs = new Set(c.instances.map((i) => i.provider)).size;
        if ((await count('.table[aria-label=Providers] .tr.is-row')) !== provs) wrong.push(c.id + ' providers');
        await go(`#client/${c.id}/program-info`);
        if (c.justice) {
          await pg.locator('.filter-pill').first().click();
          if ((await count('.table[aria-label="Case history"] .tr.is-row')) !== c.justice.cases.length) wrong.push(c.id + ' cases');
        } else if (!(await text('.empty-box')).includes('No court')) wrong.push(c.id + ' justice empty state');
      }
      check('names, IDs, contact, sources, counts for all 64 clients', wrong.length === 0, wrong.slice(0, 6));
    });

    await part('Sync between tabs', async () => {
      const pg2 = await ctx.newPage();
      await pg2.goto(BASE + '#my-action-items'); await pg2.waitForSelector('h1:has-text("My Action Items")');
      await go('#my-action-items');
      await btn(/^Open \(/).click();
      const before = await pg2.getByRole('button', { name: /^Open \(/ }).innerText();
      await pg.locator('.feed-item input[type=checkbox]').first().click();
      await pg2.waitForTimeout(400);
      check('a change in one tab shows in the other', (await pg2.getByRole('button', { name: /^Open \(/ }).innerText()) !== before);
      await pg2.close();
    });

    await part('Upgrade from v2.x saved data', async () => {
      const db = await source();
      await pg.evaluate((old) => {
        old.version = 3;
        ['userId', 'staff', 'colabs', 'providers', 'canReset'].forEach((k) => delete old[k]);
        old.clients.forEach((c) => { delete c.sources; delete c.ssnFull; });
        const d = new Date(); const p = (n) => String(n).padStart(2, '0');
        old.notes.unshift({ id: 'kept', clientId: 'c1', date: p(d.getMonth() + 1) + '/' + p(d.getDate()) + '/' + d.getFullYear(), edited: false, restricted: false, tag: 'PERSONAL', author: 'u1', text: 'Written in v2.1' });
        localStorage.setItem('colab.db', JSON.stringify(old));
      }, db);
      await go('#client/c1/case-notes');
      await reload();
      await pg.waitForSelector('#all-notes-h');
      check('notes written in v2.1 are kept', (await count('text=Written in v2.1')) === 1);
      const after = await source();
      check('upgraded data gains the new fields', after.version === 5 && !!after.staff && !!after.clients[0].sources && !!after.clients[0].ssnFull && after.clients.every((c) => c.addresses && c.addresses.length >= 3));
    });

    await part('Upgrade from v3.0 saved data', async () => {
      const db = await source();
      await pg.evaluate((old) => {
        old.version = 4;
        old.clients.forEach((c) => { delete c.addresses; });
        const d = new Date(); const p = (n) => String(n).padStart(2, '0');
        old.notes.unshift({ id: 'kept3', clientId: 'c2', date: p(d.getMonth() + 1) + '/' + p(d.getDate()) + '/' + d.getFullYear(), edited: false, restricted: false, tag: 'PERSONAL', author: 'u1', text: 'Written in v3.0' });
        old.actions.find((a) => a.clientId === 'c2').text = 'Changed in v3.0';
        localStorage.setItem('colab.db', JSON.stringify(old));
      }, db);
      await go('#client/c2/case-notes');
      await reload();
      await pg.waitForSelector('#all-notes-h');
      check('notes written in v3.0 are kept', (await count('text=Written in v3.0')) === 1);
      const after = await source();
      check('action item edits are kept', after.actions.some((a) => a.text === 'Changed in v3.0'));
      check('every client gains an address history', after.version === 5 && after.clients.every((c) => c.addresses && c.addresses.length >= 3));
      check('the same history as a fresh start', JSON.stringify(after.clients.find((c) => c.id === 'c9').addresses) === JSON.stringify(db.clients.find((c) => c.id === 'c9').addresses));
      await go('#client/c2/address-history'); await freshAddressPrefs(); await reload();
      check('and it shows', (await count('.addr-card')) === after.clients.find((c) => c.id === 'c2').addresses.length);
    });

    await part('Reset sample data', async () => {
      await go('#home');
      await btn('Reset sample data').click();
      await pg.locator('.reset-confirm').getByRole('button', { name: 'Reset' }).click();
      await pg.waitForSelector('h1:has-text("Welcome")');
      const db = await source();
      check('restores the sample data', !db.notes.some((n) => n.text === 'Written in v2.1') && db.reports.length === 0);
      check('clears saved choices', (await pg.evaluate(() => localStorage.getItem('colab.prefs'))) === '{}');
    });
  }

  if (api) {
    await part('Loading and error states', async () => {
      await ctx.route('**/api/clients/c9', (r) => setTimeout(() => r.continue(), 900));
      await pg.goto(BASE + '#client/c9/overview');
      await pg.reload();
      await pg.waitForSelector('text=Loading client', { state: 'visible', timeout: 2000 });
      check('slow loads show a loading state', true);
      await pg.waitForSelector('.client-head');
      await ctx.unroute('**/api/clients/c9');
      let fail = true;
      await ctx.route('**/api/clients/c10', (r) => (fail ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Database unavailable"}' }) : r.continue()));
      await go('#client/c10/overview');
      await pg.reload();
      await pg.waitForSelector('.load-error');
      check('a failed load explains itself', (await text('.load-error')).includes('Database unavailable'));
      fail = false;
      await btn('Try again').click();
      await pg.waitForSelector('.client-head');
      check('Try again recovers', true);
      await ctx.route('**/api/action-items/*', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Write failed."}' }));
      const box = pg.locator('aside.panel .task input[type=checkbox]').first();
      if (await box.count()) {
        const was = await box.isChecked();
        await box.click();
        await pg.waitForSelector('.toast.is-error');
        check('a failed save is rolled back', (await box.isChecked()) === was);
        check('and says it was not saved', (await text('.toast')).includes('not saved'));
      }
      await ctx.unroute('**/api/action-items/*');
      await ctx.route('**/api/session', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Service down"}' }));
      await pg.goto(BASE + '#home');
      await pg.reload();
      await pg.waitForSelector('.load-error');
      check('app-level error when the session fails', (await text('.load-error')).includes('Service down'));
      await ctx.unroute('**/api/session');
      await btn('Try again').click();
      await pg.waitForSelector('h1:has-text("Welcome")');
      check('Try again recovers the whole app', true);
    });
  }

  await part('Accessibility', async () => {
    const bad = [];
    // Extra states to audit: the address dialog with a row open, the history with a card open, and its table.
    const states = {
      '#client/c1/overview dialog': async () => { await go('#client/c1/overview'); await btn('View Address Details').click(); await pg.locator('.modal .addr-toggle').nth(1).click(); },
      '#client/c1/address-history': async () => { await go('#client/c1/address-history'); await btn('Timeline').click(); await pg.locator('.addr-card .addr-toggle').first().click(); await pg.locator('.select-btn').click(); },
      '#client/c1/address-history table': async () => { await go('#client/c1/address-history'); await pg.keyboard.press('Escape'); await btn('Table').click(); await pg.locator('.addr-row').first().click(); }
    };
    for (const h of ['#home', '#my-action-items', '#my-case-notes', '#starred-clients', '#client/c1/overview', '#client/c1/services', '#client/c1/program-info', '#client/c1/providers', '#client/c1/case-notes', '#client/c1/service/s1', '#client/c1/provider/Mercy', ...Object.keys(states)]) {
      if (states[h]) await states[h](); else await go(h);
      await pg.waitForTimeout(150);
      const r = await pg.evaluate(() => {
        const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const bg = (el) => { while (el) { const c = getComputedStyle(el).backgroundColor; const a = c.match(/[\d.]+/g); if (a && (a.length < 4 || +a[3] > 0.5)) return c; el = el.parentElement; } return 'rgb(255,255,255)'; };
        const out = [];
        document.querySelectorAll('#app *').forEach((el) => {
          if (!el.offsetParent || el.closest('[disabled],.is-done,.edited')) return;
          const t = [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
          if (!t) return;
          const cs = getComputedStyle(el);
          const L1 = lum(cs.color), L2 = lum(bg(el)); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
          if (ratio < (big ? 3 : 4.5)) out.push('contrast ' + ratio.toFixed(2) + ' ' + el.textContent.trim().slice(0, 30));
        });
        document.querySelectorAll('button, a[href], input, select, textarea').forEach((e) => {
          if (!e.offsetParent) return;
          const named = e.getAttribute('aria-label') || e.textContent.trim() || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label');
          if (!named) out.push('unlabeled ' + e.outerHTML.slice(0, 60));
          const r = e.getBoundingClientRect();
          const exempt = e.type === 'checkbox' || e.classList.contains('tag') || e.classList.contains('src-tag') || e.closest('.tip-box');
          if (!exempt && (r.width < 24 || r.height < 24)) out.push('small target ' + (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 30) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
        });
        return out;
      });
      r.forEach((x) => bad.push(h + ' ' + x));
    }
    check('contrast, names and target sizes', bad.length === 0, bad.slice(0, 6));
    await btn('Timeline').click();
    await go('#client/c1/address-history');
    await pg.locator('.addr-card .addr-toggle').first().focus();
    await pg.keyboard.press('Enter');
    check('keyboard opens an address card', (await pg.locator('.addr-card .addr-toggle').first().getAttribute('aria-expanded')) === 'true');
    await pg.keyboard.press('Enter');
    check('and closes it', (await count('.addr-body')) === 0);
    await pg.locator('.addr-card .src-tag').first().focus();
    check('tag tooltips open on keyboard focus', await pg.locator('.addr-card .src-tip').first().locator('.tip-box').isVisible());
  });

  await part('Phone width', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    await m.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    const mp = await m.newPage();
    const wide = [];
    for (const h of ['#home', '#my-action-items', '#my-case-notes', '#starred-clients', '#client/c1/overview', '#client/c1/services', '#client/c1/case-notes', '#client/c12/program-info', '#client/c1/address-history']) {
      await mp.goto(BASE + h); await mp.waitForSelector('#main'); await mp.waitForTimeout(150);
      const w = await mp.evaluate(() => document.documentElement.scrollWidth);
      if (w > 390) wide.push(h + ' ' + w);
    }
    check('no sideways scrolling at 390px', wide.length === 0, wide);
    await mp.goto(BASE + '#client/c1/overview'); await mp.waitForSelector('#main');
    await mp.getByRole('button', { name: 'View Address Details' }).click();
    await mp.locator('.modal .addr-toggle').first().click();
    check('address dialog fits at 390px', await mp.evaluate(() => document.querySelector('.modal').scrollWidth <= document.querySelector('.modal').clientWidth + 1 && document.documentElement.scrollWidth <= 390));
    await mp.goto(BASE + '#client/c1/address-history'); await mp.waitForSelector('.addr-history');
    await mp.getByRole('button', { name: 'Table' }).click();
    check('address table scrolls inside its box at 390px', await mp.evaluate(() => document.documentElement.scrollWidth <= 390));
    await mp.getByRole('button', { name: 'Timeline' }).click();
    await m.close();
  });

  section = 'Console';
  check('no errors in the browser console', errors.length === 0, errors.slice(0, 4));
  await browser.close();
}

const server = await startServer();
try {
  for (const mode of ['local', 'api']) if (!only || only === mode) await run(mode);
} finally { server.kill(); }
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
