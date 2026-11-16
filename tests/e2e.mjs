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
    check('65 clients in the data (64 plus Jayden Ruiz for ASC)', db.clients.length === 65, db.clients.length);
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
    check('badges, dialogs, timelines and dates for all 65 clients', wrong.length === 0, wrong.slice(0, 6));
  });

  await part('Every client renders every view', async () => {
    const bad = [];
    for (let i = 1; i <= 65; i++) {
      for (const t of ['overview', 'services', 'program-info', 'providers', 'case-notes', 'action-items']) {
        await pg.goto(BASE + `#client/c${i}/${t}`);
        await pg.waitForSelector('.client-head', { timeout: 4000 }).catch(() => bad.push(`c${i}/${t}`));
      }
    }
    check('65 clients × 6 views', bad.length === 0, bad.slice(0, 5));
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
      check('names, IDs, contact, sources, counts for all 65 clients', wrong.length === 0, wrong.slice(0, 6));
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
      check('upgraded data gains the new fields', after.version === 6 && after.contacts.length > 0 && !!after.staff && !!after.clients[0].sources && !!after.clients[0].ssnFull && after.clients.every((c) => c.addresses && c.addresses.length >= 3));
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
      check('every client gains an address history', after.version === 6 && after.clients.every((c) => c.addresses && c.addresses.length >= 3));
      check('the same history as a fresh start', JSON.stringify(after.clients.find((c) => c.id === 'c9').addresses) === JSON.stringify(db.clients.find((c) => c.id === 'c9').addresses));
      await go('#client/c2/address-history'); await freshAddressPrefs(); await reload();
      check('and it shows', (await count('.addr-card')) === after.clients.find((c) => c.id === 'c2').addresses.length);
    });

    await part('Upgrade from v3.1 saved data', async () => {
      const db = await source();
      await pg.evaluate((old) => {
        old.version = 5;
        delete old.contacts; delete old.contactSeq;
        old.colabs = old.colabs.filter((c) => c.id !== 'ASC');
        old.clients = old.clients.filter((c) => c.id !== 'c65');
        old.clients.forEach((c) => { c.colabs = c.colabs.filter((x) => x !== 'ASC'); });
        old.actions.find((a) => a.clientId === 'c4').text = 'Changed in v3.1';
        localStorage.setItem('colab.db', JSON.stringify(old));
      }, db);
      await go('#home'); await reload();
      const after = await source();
      check('gains ASC: the CoLab, Jayden Ruiz and past contacts', after.version === 6 && after.colabs.some((c) => c.id === 'ASC') && after.clients.some((c) => c.id === 'c65') && after.contacts.length === db.contacts.length);
      check('earlier edits are kept', after.actions.some((a) => a.text === 'Changed in v3.1'));
      check('other records are untouched', JSON.stringify(after.clients.find((c) => c.id === 'c9').addresses) === JSON.stringify(db.clients.find((c) => c.id === 'c9').addresses));
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

  // ---------------------------------------------------------------- ASC (v4)
  const ASC = await import('../src/data/asc.js');
  await part('ASC: rules', async () => {
    check('7 business days skip the weekend', ASC.addBusinessDays('2026-11-13', 7) === '2026-11-24' && ASC.addBusinessDays('2026-11-04', 7) === '2026-11-13');
    check('90 days lands on a weekday', ASC.addDaysOnWeekday('2026-11-04', 90) === '2027-02-02' && ASC.addDaysOnWeekday('2026-11-04', 3) === '2026-11-09');
    check('units: 15 minutes each, at least 1', ASC.unitsFor(0) === 0 && ASC.unitsFor(7) === 1 && ASC.unitsFor(19) === 1 && ASC.unitsFor(23) === 2 && ASC.unitsFor(60) === 4);
    check('service codes', ASC.serviceCode('Benefit Assistance · T1016BA') === 'T1016BA' && ASC.serviceCode('Casefinding [code TBD]') === '[TBD]');
  });

  const contactId = () => (pg.url().match(/#asc\/contact\/([^/]+)/) || [])[1];
  const contactOf = async (id) => (await source()).contacts.find((k) => k.id === id);
  const opt = (group, name) => pg.locator(`[aria-labelledby="${group}"]`).getByRole('button', { name, exact: true });
  const fillIntake = async () => {
    await btn('Asked: no danger now', true).click(); await btn('Parent or guardian', true).click(); await btn('Child, 0–17', true).click();
    await pg.fill('#asc-story', 'Calling about her son, 6. Sent home from school twice this week.');
    await btn('Find services', true).click();
    for (const [q, a] of [['mh', 'Yes'], ['ph', 'Yes, OK'], ['house', 'Yes, stable'], ['food', 'Sometimes'], ['su', 'No']]) await opt('q-' + q, a).click();
    await btn('Medical Assistance or HealthChoices', true).click(); await btn('School', true).click();
  };

  await part('ASC: the CoLab', async () => {
    await go('#home');
    await pg.selectOption('#choose-colab', 'ASC');
    check('ASC is a CoLab under All CoLabs', (await pg.locator('#choose-colab option').allInnerTexts()).includes('ASC'));
    check('Home shows the ASC card', (await count('#asc-home-h')) === 1);
    check('the sidebar links to ASC Contacts', (await count('.sidebar a[href="#asc"]')) === 1);
    await pg.locator('.sidebar a[href="#asc"]').click();
    await pg.waitForSelector('#asc-list-h');
    check('ASC Contacts page and title', (await text('h1')).includes('ASC Contacts') && (await pg.title()) === 'ASC Contacts · CoLab');
    const db = await source();
    await btn(/All contacts/).click();
    check('lists every contact', (await count('.table[aria-label="ASC contacts"] .tr.is-row')) === Math.min(10, db.contacts.length));
    await pg.selectOption('#choose-colab', '');
  });

  let kid = '';
  await part('ASC: intake', async () => {
    await go('#asc');
    await btn('New Phone Contact', true).click();
    await pg.waitForSelector('.asc-safety');
    kid = contactId();
    check('a new contact opens on the Intake step', !!kid && pg.url().endsWith('/intake'));
    const k = await contactOf(kid);
    check('it has an event ID and call log ID', /^EV-26-\d{6}$/.test(k.ref) && (await text('.client-head')).includes(k.ref) && (await text('.client-head')).includes(k.logId));
    check('four steps', (await count('.asc-step')) === 4);
    check('runs a call timer', /On call/.test(await text('.asc-live')));
    await btn('Returning Caller', true).click();
    await pg.fill('#asc-ref', '999999'); await btn('Find', true).click();
    await pg.waitForSelector('#asc-ref-err');
    check('an unknown reference number says so', (await text('#asc-ref-err')).includes('No contact has that reference number'));
    await pg.fill('#asc-ref', '142'); await btn('Find', true).click();
    await pg.waitForSelector('.asc-found');
    await pg.getByRole('button', { name: /Add to This Contact/ }).click();
    await pg.waitForSelector('.modal .asc-history');
    check('previous interactions: open items first', (await text('.modal .asc-open')).includes('Mental health services for a child'));
    check('and both earlier contacts', (await count('.modal .asc-event')) === 2 && (await text('.modal')).includes('Dana Whitfield'));
    await btn('Done', true).click();
    await fillIntake();
    check('a concern offers to add the need', (await count('text=Add Need: Mental health services for a child')) === 1);
    await pg.getByRole('button', { name: 'Add Need: Mental health services for a child' }).click();
    await pg.getByRole('button', { name: 'Add Need: Food or other benefits' }).click();
    check('needs added from screening', (await count('.asc-needs li')) === 2);
    await pg.waitForTimeout(900);
    check('the intake is complete', (await text('.asc-gaps')).includes('Intake complete') && (await count('.asc-step-num.is-done')) === 1);
    await reload(); await pg.waitForSelector('.asc-safety');
    check('answers are saved', (await pg.inputValue('#asc-story')).startsWith('Calling about her son') && (await btn('School', true).getAttribute('aria-pressed')) === 'true');
    const saved = await contactOf(kid);
    check('in the data', saved.screening.food === 'Sometimes' && saved.needs.length === 2 && saved.priorRefs.length === 2);
  });

  await part('ASC: identify and enroll', async () => {
    await pg.getByRole('button', { name: 'Next: Identify' }).click();
    await pg.waitForSelector('#h-lookup');
    await btn('Search MCI', true).click();
    check('search needs a name or date of birth', (await count('text=Enter a name or date of birth to search.')) === 1);
    await pg.fill('#i-first', 'Jayden'); await pg.fill('#i-last', 'Ruiz'); await pg.fill('#i-dob', '2020-03-14');
    await btn('Search MCI', true).click();
    await btn('Select Jayden Ruiz', true).click();
    await pg.waitForSelector('#h-confirm');
    check('confirm shows the guardian and coverage on file', (await text('.asc-card')).includes('Maria Ruiz') && (await text('.asc-card')).includes('HealthChoices (CCBH)'));
    await btn('Enroll and Continue', true).click();
    await pg.waitForSelector('#h-ix');
    const db = await source();
    const k = db.contacts.find((x) => x.id === kid);
    const c = db.clients.find((x) => x.id === 'c65');
    check('the contact is on Jayden’s record', k.clientId === 'c65' && k.identity === 'matched');
    check('Jayden is enrolled in ASC', c.colabs.includes('ASC') && c.enrollments.some((e) => e.name.includes('ASC')));
    check('earlier contacts tied by reference number are his too', db.contacts.filter((x) => x.group === k.group).every((x) => x.clientId === 'c65'));
    check('their notes moved to his record', db.notes.filter((n) => n.clientId === 'c65' && n.tag === 'ASC').length >= 2);
    check('the header shows him', (await text('.client-head h1')) === 'Jayden Ruiz' && (await text('.topbar')).includes('Jayden Ruiz'));
    check('the client panel takes over', (await text('aside.panel')).includes('tagged ASC'));
  });

  await part('ASC: interactions, reminders and follow-ups', async () => {
    await pg.getByRole('button', { name: 'IBHS evaluation info' }).click();
    await pg.waitForTimeout(150);
    check('a new interaction focuses its minutes', await pg.evaluate(() => /-min$/.test(document.activeElement.id)));
    await pg.keyboard.type('19');
    await pg.getByRole('button', { name: '211' }).click(); await pg.waitForTimeout(150); await pg.keyboard.type('8');
    check('one interaction per resource', (await count('.asc-ix')) === 2);
    check('units are calculated', (await pg.locator('.asc-units').allInnerTexts()).join() === '1,1');
    check('place defaults to Telephone', (await pg.inputValue('.asc-ix >> nth=0 >> select[id$="-place"]')) === 'Telephone [code TBD]');
    const first = pg.locator('.asc-ix').first();
    await first.getByRole('button', { name: 'Add Reminder' }).click();
    await first.locator('input.is-block').fill('Call Maria to confirm the IBHS appointment');
    await btn('Save Reminder', true).click();
    check('a reminder needs a due date', (await first.locator('[role=alert]').count()) === 1);
    await first.locator('input[type=date]').fill('2026-12-01');
    await btn('Save Reminder', true).click();
    await pg.waitForTimeout(600);
    check('the reminder shows on the interaction', (await first.locator('.asc-rem-list').innerText()).includes('Call Maria to confirm'));
    check('and in Action Items', (await text('aside.panel')).includes('Call Maria to confirm'));
    await opt('h-fok', 'Yes').click(); await opt('h-fhow', 'Text').click();
    await pg.waitForTimeout(600);
    const db = await source();
    const k = db.contacts.find((x) => x.id === kid);
    const autos = k.links.filter((l) => l.auto).map((l) => db.actions.find((a) => a.id === l.actionId));
    const start = ASC.dayOf(k.startedAt);
    check('two automatic follow-ups', autos.length === 2 && autos.every((a) => a && a.tag === 'ASC' && a.clientId === 'c65'));
    check('7 business days and 90 days, on weekdays', autos[0].due === ASC.addBusinessDays(start, 7) && autos[1].due === ASC.addDaysOnWeekday(start, 90) && autos.every((a) => !['Sat', 'Sun'].includes(ASC.weekday(a.due))));
    check('the follow-up uses the way they asked for', autos[0].text.startsWith('7-day follow-up text'));
    check('the reminder is linked to its interaction', k.links.some((l) => l.ixId === k.interactions[0].id));
    await opt('h-fok', 'No').click(); await pg.waitForTimeout(500);
    const db2 = await source();
    check('saying No removes them', !db2.actions.some((a) => a.id === autos[0].id));
    await opt('h-fok', 'Yes').click(); await pg.waitForTimeout(500);
  });

  await part('ASC: wrap up and close', async () => {
    await pg.getByRole('button', { name: 'Next: Wrap Up' }).click();
    await pg.waitForSelector('#h-wneeds');
    check('Wrap Up: finish documenting today’s conversation', (await text('#h-wneeds')).includes('Finish documenting today'));
    check('the state table has a row per interaction', (await count('.table[aria-label="What goes to the state"] .tr.is-row')) === 2);
    await btn('Close Contact', true).click();
    check('closing needs an outcome for each need', (await text('.asc-foot')).includes('Choose an outcome') && (await pg.evaluate(() => document.activeElement.tagName)) === 'SELECT');
    const sels = pg.locator('.asc-outcomes select');
    await sels.nth(0).selectOption('Keep open with a follow-up'); await sels.nth(1).selectOption('Connected');
    await btn('Close Contact', true).click();
    await pg.waitForSelector('.asc-closed');
    const k = await contactOf(kid);
    check('the contact is closed', k.status === 'closed' && k.closedKind === 'client' && !!k.endedAt);
    check('the summary says it is ready to report', (await text('.asc-summary')).includes('Ready for state reporting'));
    const auto = (await source()).notes.find((n) => n.clientId === 'c65' && n.tag === 'ASC' && n.text.includes(k.ref));
    check('closing saves an automatic summary on the client’s record', !!auto && /^ASC phone call summary, /.test(auto.text) && auto.text.includes('Outcome: keep open with a follow-up') && auto.text.includes('Follow-up:'));
    check('the panel shows it straight away', (await text('aside.panel')).includes('ASC phone call summary') && (await text('.asc-summary')).includes('Summary saved as a case note'));
    await go('#client/c65/asc');
    await pg.waitForSelector('.asc-history');
    check('Jayden’s ASC tab shows his contacts', (await count('.asc-event')) === 3 && (await text('.info-card')).includes('Active'));
    check('and his latest screening', (await text('.asc-screen-grid')).includes('Sometimes'));
    await go('#client/c2/overview');
    check('the ASC tab only shows for enrolled clients', (await count('.tabs a[href$="/asc"]')) === ((await source()).clients.find((c) => c.id === 'c2').colabs.includes('ASC') ? 1 : 0));
  });

  await part('ASC: anonymous, in person', async () => {
    await go('#asc');
    await btn('New In-Person Contact', true).click();
    await pg.waitForSelector('#asc-site');
    const id = contactId();
    check('in person shows the site and Visit ID', (await text('.client-head')).includes('Visit ID') && /In person/.test(await text('.asc-live')));
    await opt('h-privacy', 'Shared space, like a lobby').click();
    check('a shared space warns before sensitive questions', (await count('.notice.is-warn')) === 1);
    await fillIntake();
    await pg.getByRole('button', { name: 'Add Need: Mental health services for a child' }).click();
    await pg.getByRole('link', { name: /Identify/ }).click();
    await btn('Continue Anonymously', true).click();
    await pg.fill('#a-name', 'Rae'); await pg.fill('#a-zip', '15212');
    await pg.getByRole('link', { name: /Interactions/ }).click();
    await pg.getByRole('button', { name: 'MATP' }).click(); await pg.waitForTimeout(150); await pg.keyboard.type('12');
    check('in person, place defaults to Office', (await pg.inputValue('select[id$="-place"]')) === 'Office [code TBD]' && (await pg.inputValue('select[id$="-how"]')) === 'Number given');
    check('on-site steps', (await count('#h-onsite')) === 1);
    await opt('h-idc', 'Photo ID').click();
    await btn('Sign on the Tablet', true).click(); await btn('Scan', true).click();
    await btn('Add New Case Note', true).click();
    await pg.fill('#k-note-draft', 'Met at the front desk. Will come back Tuesday.');
    await pg.locator('aside.panel').getByRole('button', { name: 'Save' }).click();
    await pg.waitForTimeout(500);
    const k = await contactOf(id);
    check('anonymous notes stay on the contact', k.notes.length === 1 && k.anon.name === 'Rae' && !k.clientId);
    check('on-site steps are saved', k.onsite.idCheck === 'Photo ID' && !!k.onsite.consentSigned && k.onsite.docs.length === 1);
    await pg.getByRole('link', { name: /Wrap Up/ }).click();
    await pg.locator('.asc-outcomes select').first().selectOption('Information given');
    await btn('Close Contact', true).click();
    await pg.waitForSelector('.asc-closed');
    const closed = await contactOf(id);
    check('closes as anonymous', closed.closedKind === 'anon' && (await text('.asc-summary')).includes('Anonymous'));
    check('the automatic summary stays on the anonymous contact', closed.notes.length === 2 && /^ASC in person summary, /.test(closed.notes[0].text) && closed.notes[0].text.includes('ID checked') && closed.notes[0].text.includes('Reference number'));
  });

  await part('ASC: urgent routing', async () => {
    await go('#asc');
    await btn('New Phone Contact', true).click();
    await pg.waitForSelector('.asc-safety');
    const id = contactId();
    await btn('Yes: start urgent routing', true).click();
    await pg.waitForSelector('.modal .asc-dest');
    await btn(/988 Lifeline/).click();
    await btn('Log Transfer and Close Contact', true).click();
    await pg.waitForSelector('.asc-closed');
    const k = await contactOf(id);
    check('logs the transfer and closes', k.closedKind === 'urgent' && k.urgent.dest === '988 Lifeline' && pg.url().endsWith('/wrap-up'));
  });

  await part('ASC: register a new client', async () => {
    await go('#asc');
    await btn('New Phone Contact', true).click();
    await pg.waitForSelector('.asc-safety');
    const id = contactId();
    await pg.getByRole('link', { name: /Identify/ }).click();
    await pg.fill('#i-first', 'Quinlan'); await pg.fill('#i-last', 'Abernathy'); await btn('Search MCI', true).click();
    await pg.waitForSelector('.asc-nomatch');
    check('no match offers looser searches', (await count('.asc-nomatch .opt')) >= 1);
    await btn('Create New Client', true).click();
    await btn('Register and Enroll', true).click();
    check('required fields are checked', (await text('#n-err')).includes('gender') && (await pg.evaluate(() => document.activeElement.id)) === 'n-gender');
    await pg.selectOption('#n-gender', 'Female'); await pg.fill('#n-dob', '1991-05-02'); await pg.fill('#n-street', '12 Federal St'); await pg.fill('#n-zip', '15212');
    await btn('Register and Enroll', true).click();
    await pg.waitForSelector('#h-ix');
    const db = await source();
    const k = db.contacts.find((x) => x.id === id);
    const c = db.clients.find((x) => x.id === k.clientId);
    check('registered in MCI and enrolled', k.identity === 'new' && c && c.first === 'Quinlan' && c.colabs.includes('ASC') && /^R\d{10}$/.test(c.mci));
    await go(`#client/${c.id}/overview`);
    await pg.waitForSelector('.client-head');
    check('their profile opens', (await text('.client-head h1')) === 'Quinlan Abernathy');
  });

  await part('ASC: QA pass 2 (v4.0.1)', async () => {
    const B = await import('../src/data/backend-asc.js');
    // Rules on a copy of the data, so nothing here changes what the app shows.
    const db = await source();
    let refused = '';
    try { B.updateContact(db, kid, { intake: { story: 'changed after close' } }); } catch (e) { refused = e.message; }
    check('a closed contact refuses changes to its answers', /closed/.test(refused));
    let notesOk = true;
    try { B.updateContact(db, kid, { notes: [] }); } catch (e) { notesOk = false; }
    check('but still takes notes and action items', notesOk);
    const fresh = B.createContact(db, { channel: 'phone' });
    const r = B.updateContact(db, fresh.id, { interactions: [{ id: 'x1', what: 'w'.repeat(900), min: '6000', place: 'Telephone [code TBD]', evil: 1 }] });
    const ix = r.contact.interactions[0];
    check('saved interactions are trimmed and capped', ix.what.length === 300 && ix.min === '600' && !('evil' in ix));
    const at = (iso, m) => new Date(new Date(iso).getTime() + m * 60000).toISOString();
    const t0 = '2026-11-13T15:00:00.000Z';
    check('minutes past the contact length are flagged', !!ASC.overtime({ startedAt: t0, endedAt: at(t0, 20), interactions: [{ min: '30' }] }) && !ASC.overtime({ startedAt: t0, endedAt: at(t0, 20), interactions: [{ min: '24' }] }));

    // Closed contacts show their answers read-only.
    await go(`#asc/contact/${kid}/intake`);
    await pg.waitForSelector('.asc-locked');
    check('a closed contact is read-only', (await pg.locator('fieldset.asc-locked[disabled]').count()) === 1 && (await pg.locator('#asc-story').isDisabled()) && (await text('.asc-locked-note')).includes('This contact is closed'));

    // Helpers take focus when opened and give it back when cancelled.
    await go('#asc');
    await btn('New Phone Contact', true).click();
    await pg.waitForSelector('.asc-safety');
    const id = contactId();
    await btn('Returning Caller', true).click(); await pg.waitForTimeout(100);
    check('Returning Caller focuses the reference number', (await pg.evaluate(() => document.activeElement.id)) === 'asc-ref');
    await pg.locator('.asc-inline').getByRole('button', { name: 'Cancel' }).click(); await pg.waitForTimeout(150);
    check('Cancel returns focus to its button', (await pg.evaluate(() => document.activeElement.id)) === 'asc-btn-return');
    await btn('They Gave Their Name', true).click(); await pg.waitForTimeout(100);
    check('They Gave Their Name focuses first name', (await pg.evaluate(() => document.activeElement.id)) === 'q-first');
    await pg.fill('#q-first', 'Jayden'); await pg.fill('#q-last', 'Ruiz'); await btn('Search MCI', true).click();
    await btn('Select Jayden Ruiz', true).click(); await pg.waitForTimeout(250);
    check('choosing a match moves focus to it', (await pg.evaluate(() => document.activeElement.id)) === 'h-match');
    check('focusing never scrolls the app shell', await pg.evaluate(() => document.scrollingElement.scrollTop === 0 && document.scrollingElement.scrollHeight <= innerHeight + 1));

    // A save that fails for connection reasons keeps the typing and can be retried.
    if (api) {
      await ctx.route(`**/api/asc/contacts/${id}`, (rt) => (rt.request().method() === 'PATCH' ? rt.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Service down"}' }) : rt.continue()));
      await pg.fill('#asc-story', 'Typed while the connection was down.');
      await pg.waitForSelector('.asc-save.is-error');
      check('a failed save keeps what was typed', (await pg.inputValue('#asc-story')) === 'Typed while the connection was down.' && (await text('.asc-save')).includes('still here'));
      await ctx.unroute(`**/api/asc/contacts/${id}`);
      await pg.locator('.asc-save').getByRole('button', { name: 'Try Again' }).click();
      await pg.waitForSelector('.asc-save:not(.is-error)');
      await pg.waitForTimeout(200);
      check('Try Again saves it', (await contactOf(id)).intake.story === 'Typed while the connection was down.');
    }

    // Laptop width: the contact list and the client tabs fit without scrolling sideways.
    await pg.setViewportSize({ width: 1066, height: 807 });
    await go('#asc');
    await pg.waitForSelector('.table[aria-label="ASC contacts"]');
    check('ASC Contacts fits a laptop screen', await pg.evaluate(() => { const w = document.querySelector('.table[aria-label="ASC contacts"]').parentElement; return w.scrollWidth <= w.clientWidth + 1; }));
    await go('#client/c65/asc');
    await pg.waitForSelector('.tabs');
    check('every client tab fits, ASC included', await pg.evaluate(() => { const w = document.querySelector('.tabs-wrap'); return w.scrollWidth <= w.clientWidth + 1; }));
    await pg.setViewportSize({ width: 1440, height: 1000 });
  });

  await part('Accessibility', async () => {
    const bad = [];
    // Extra states to audit: the address dialog with a row open, the history with a card open, and its table.
    const states = {
      '#client/c1/overview dialog': async () => { await go('#client/c1/overview'); await btn('View Address Details').click(); await pg.locator('.modal .addr-toggle').nth(1).click(); },
      '#client/c1/address-history': async () => { await go('#client/c1/address-history'); await btn('Timeline').click(); await pg.locator('.addr-card .addr-toggle').first().click(); await pg.locator('.select-btn').click(); },
      '#client/c1/address-history table': async () => { await go('#client/c1/address-history'); await pg.keyboard.press('Escape'); await btn('Table').click(); await pg.locator('.addr-row').first().click(); },
      'ASC intake': async () => { await go('#asc'); await btn('New Phone Contact', true).click(); await pg.waitForSelector('.asc-safety'); await btn('Returning Caller', true).click(); await btn('Find', true).click(); },
      'ASC identify': async () => { await pg.getByRole('link', { name: /Identify/ }).click(); await pg.fill('#i-last', 'Nobodyhere'); await btn('Search MCI', true).click(); await pg.waitForSelector('.asc-nomatch'); },
      'ASC new client': async () => { await btn('Create New Client', true).click(); await btn('Register and Enroll', true).click(); },
      'ASC anonymous': async () => { await btn('Back to Search', true).click(); await btn('Continue Anonymously', true).click(); },
      'ASC interactions': async () => { await pg.getByRole('link', { name: /Interactions/ }).click(); await pg.getByRole('button', { name: 'MATP', exact: true }).click(); await pg.locator('.asc-ix').first().getByRole('button', { name: 'Add Reminder' }).click(); },
      'ASC wrap up': async () => { await pg.getByRole('link', { name: /Wrap Up/ }).click(); await btn('Close Contact', true).click(); },
      'ASC urgent dialog': async () => { await btn('Urgent Routing', true).click(); await pg.waitForSelector('.asc-dest'); },
      'ASC history dialog': async () => { await pg.keyboard.press('Escape'); await btn('Previous Interactions', true).click(); await pg.waitForSelector('.modal'); },
      '#client/c65/asc': async () => { await pg.keyboard.press('Escape'); await go('#client/c3/asc'); await pg.waitForSelector('.asc-history'); }
    };
    for (const h of ['#home', '#my-action-items', '#my-case-notes', '#starred-clients', '#client/c1/overview', '#client/c1/services', '#client/c1/program-info', '#client/c1/providers', '#client/c1/case-notes', '#client/c1/service/s1', '#client/c1/provider/Mercy', '#asc', ...Object.keys(states)]) {
      if (process.env.DEBUG) console.log('  a11y state', h);
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
    await go('#client/c1/address-history');
    await btn('Timeline').click();
    await pg.locator('.addr-card .addr-toggle').first().focus();
    await pg.keyboard.press('Enter');
    check('keyboard opens an address card', (await pg.locator('.addr-card .addr-toggle').first().getAttribute('aria-expanded')) === 'true');
    await pg.keyboard.press('Enter');
    check('and closes it', (await count('.addr-body')) === 0);
    await pg.locator('.addr-card .src-tag').first().focus();
    check('tag tooltips open on keyboard focus', await pg.locator('.addr-card .src-tip').first().locator('.tip-box').isVisible());
    // ASC by keyboard alone
    await go('#asc');
    await btn('New Phone Contact', true).focus(); await pg.keyboard.press('Enter');
    await pg.waitForSelector('.asc-safety');
    await btn('Asked: no danger now', true).focus(); await pg.keyboard.press('Space');
    check('answers toggle with the keyboard', (await btn('Asked: no danger now', true).getAttribute('aria-pressed')) === 'true');
    await btn('Urgent Routing', true).focus(); await pg.keyboard.press('Enter');
    await pg.waitForSelector('.modal');
    check('the dialog takes focus', await pg.evaluate(() => !!document.activeElement.closest('.modal')));
    for (let i = 0; i < 12; i++) await pg.keyboard.press('Tab');
    check('and keeps it', await pg.evaluate(() => !!document.activeElement.closest('.modal')));
    await pg.keyboard.press('Escape');
    check('Escape closes it and focus goes back', (await count('.modal')) === 0 && (await pg.evaluate(() => document.activeElement.textContent)).includes('Urgent Routing'));
    await btn('Returning Caller', true).click(); await btn('Cancel', true).click(); await pg.waitForTimeout(80);
    check('closing a helper returns focus to its button', (await pg.evaluate(() => document.activeElement.id)) === 'asc-btn-return');
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
