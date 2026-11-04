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
      check('upgraded data gains the new fields', after.version === 4 && !!after.staff && !!after.clients[0].sources && !!after.clients[0].ssnFull);
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
    for (const h of ['#home', '#my-action-items', '#my-case-notes', '#starred-clients', '#client/c1/overview', '#client/c1/services', '#client/c1/program-info', '#client/c1/providers', '#client/c1/case-notes', '#client/c1/service/s1', '#client/c1/provider/Mercy']) {
      await go(h); await pg.waitForTimeout(150);
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
          const exempt = e.type === 'checkbox' || e.classList.contains('tag') || e.closest('.tip-box');
          if (!exempt && (r.width < 24 || r.height < 24)) out.push('small target ' + (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 30) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
        });
        return out;
      });
      r.forEach((x) => bad.push(h + ' ' + x));
    }
    check('contrast, names and target sizes', bad.length === 0, bad.slice(0, 6));
  });

  await part('Phone width', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    await m.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    const mp = await m.newPage();
    const wide = [];
    for (const h of ['#home', '#my-action-items', '#my-case-notes', '#starred-clients', '#client/c1/overview', '#client/c1/services', '#client/c1/case-notes', '#client/c12/program-info']) {
      await mp.goto(BASE + h); await mp.waitForSelector('#main'); await mp.waitForTimeout(150);
      const w = await mp.evaluate(() => document.documentElement.scrollWidth);
      if (w > 390) wide.push(h + ' ' + w);
    }
    check('no sideways scrolling at 390px', wide.length === 0, wide);
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
