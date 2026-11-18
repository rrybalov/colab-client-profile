// A stand-in CoLab API for development and tests. It serves this folder as a static site and answers the
// endpoints in docs/API.md from the sample data, using the same server logic as the in-browser data source.
//
//   node tools/mock-api.mjs [--port 8787] [--latency 300] [--fail /clients/c7]
//
// Then open http://localhost:8787/?api=/api to run the app against it.
// --latency adds a delay to every API call; --fail makes any API path containing that text return a 500.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed } from '../src/data/seed.js';
import * as api from '../src/data/backend.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? acc.concat([[a.slice(2), all[i + 1]]]) : acc), []));
const PORT = Number(args.port || 8787);
const LATENCY = Number(args.latency || 0);
const FAIL = args.fail || '';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

let db = buildSeed();

const routes = [
  ['GET', /^\/session$/, () => api.session(db)],
  ['GET', /^\/clients$/, (m, q) => { if (q.get('starred') !== 'true') throw Object.assign(new Error('Only ?starred=true is supported'), { status: 400 }); return api.starredClients(db); }],
  ['GET', /^\/clients\/search$/, (m, q) => api.searchClients(db, Object.fromEntries(q))],
  ['GET', /^\/clients\/([^/]+)$/, (m) => api.getClient(db, m[1])],
  ['GET', /^\/clients\/([^/]+)\/ssn$/, (m) => api.revealSsn(db, m[1])],
  ['PUT', /^\/clients\/([^/]+)\/star$/, (m, q, body) => api.setStar(db, m[1], body)],
  ['GET', /^\/clients\/([^/]+)\/notes$/, (m) => api.clientNotes(db, m[1])],
  ['POST', /^\/clients\/([^/]+)\/notes$/, (m, q, body) => [201, api.createNote(db, m[1], body)]],
  ['GET', /^\/clients\/([^/]+)\/action-items$/, (m) => api.clientActions(db, m[1])],
  ['POST', /^\/clients\/([^/]+)\/action-items$/, (m, q, body) => [201, api.createAction(db, m[1], body)]],
  ['PATCH', /^\/notes\/([^/]+)$/, (m, q, body) => api.updateNote(db, m[1], body)],
  ['DELETE', /^\/notes\/([^/]+)$/, (m) => { api.deleteNote(db, m[1]); return [204]; }],
  ['PATCH', /^\/action-items\/([^/]+)$/, (m, q, body) => api.updateAction(db, m[1], body)],
  ['DELETE', /^\/action-items\/([^/]+)$/, (m) => { api.deleteAction(db, m[1]); return [204]; }],
  ['GET', /^\/me\/notes$/, () => api.myNotes(db)],
  ['GET', /^\/me\/action-items$/, () => api.myActions(db)],
  ['GET', /^\/providers\/([^/]+)$/, (m) => api.getProvider(db, m[1])],
  ['POST', /^\/reports$/, (m, q, body) => [201, api.createReport(db, body)]],
  ['GET', /^\/asc\/contacts$/, (m, q) => api.listContacts(db, Object.fromEntries(q))],
  ['POST', /^\/asc\/contacts$/, (m, q, body) => [201, api.createContact(db, body)]],
  ['GET', /^\/asc\/contacts\/lookup$/, (m, q) => api.lookupContact(db, q.get('ref'))],
  ['GET', /^\/asc\/contacts\/([^/]+)$/, (m) => api.getContact(db, m[1])],
  ['PATCH', /^\/asc\/contacts\/([^/]+)$/, (m, q, body) => api.updateContact(db, m[1], body)],
  ['POST', /^\/asc\/contacts\/([^/]+)\/link$/, (m, q, body) => api.linkContact(db, m[1], body)],
  ['POST', /^\/asc\/contacts\/([^/]+)\/close$/, (m, q, body) => api.closeContact(db, m[1], body)],
  ['POST', /^\/asc\/contacts\/([^/]+)\/correction$/, (m, q, body) => api.startCorrection(db, m[1], body)],
  ['POST', /^\/asc\/contacts\/([^/]+)\/correction\/finish$/, (m) => api.finishCorrection(db, m[1])],
  ['PUT', /^\/session$/, (m, q, body) => api.switchUser(db, body)],
  ['GET', /^\/asc\/history$/, (m, q) => api.contactHistory(db, Object.fromEntries(q))],
  ['GET', /^\/asc\/team$/, () => api.teamWork(db)],
  ['POST', /^\/asc\/reassign$/, (m, q, body) => api.reassign(db, body)],
  ['GET', /^\/asc\/closeouts$/, () => api.listCloseouts(db)],
  ['POST', /^\/clients\/([^/]+)\/asc\/closeout$/, (m, q, body) => [201, api.requestCloseout(db, m[1], body)]],
  ['POST', /^\/asc\/closeouts\/([^/]+)\/withdraw$/, (m) => api.cancelCloseout(db, m[1])],
  ['POST', /^\/asc\/closeouts\/([^/]+)\/decide$/, (m, q, body) => api.decideCloseout(db, m[1], body)],
  ['POST', /^\/clients\/([^/]+)\/asc\/discharge$/, (m, q, body) => api.dischargeClient(db, m[1], body)],
  ['GET', /^\/ipv\/referrals$/, () => api.listReferrals(db)],
  ['GET', /^\/ipv\/referrals\/([^/]+)$/, (m) => api.getReferral(db, m[1])],
  ['PUT', /^\/ipv\/referrals\/([^/]+)\/status$/, (m, q, body) => api.setReferralStatus(db, m[1], body)],
  ['POST', /^\/ipv\/referrals\/status$/, (m, q, body) => api.setReferralsStatus(db, body)],
  ['GET', /^\/asc\/reports\/(\d{4}-\d{2})$/, (m) => api.stateReport(db, m[1])],
  ['POST', /^\/asc\/reports\/(\d{4}-\d{2})\/submit$/, (m) => api.submitReport(db, m[1])],
  // Test helpers, not part of the API contract.
  ['POST', /^\/__reset$/, () => { db = buildSeed(); return [204]; }],
  ['GET', /^\/__db$/, () => db]
];

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(data === undefined ? '' : JSON.stringify(data));
}

async function handleApi(req, res, path, query) {
  let body = null;
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const chunks = []; for await (const c of req) chunks.push(c);
    try { body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}; } catch (e) { return send(res, 400, { error: 'Body must be JSON.' }); }
  }
  if (LATENCY) await new Promise((r) => setTimeout(r, LATENCY));
  if (FAIL && path.includes(FAIL)) return send(res, 500, { error: 'Mock failure for ' + path });
  // The provider directory is a published file; the API serves it as is.
  if (req.method === 'GET' && path === '/asc/provider-directory') {
    try { return send(res, 200, JSON.parse(readFileSync(join(ROOT, 'data', 'bh-providers.json'), 'utf8'))); } catch (e) { return send(res, 500, { error: 'Provider directory unavailable.' }); }
  }
  for (const [method, re, fn] of routes) {
    const m = path.match(re);
    if (!m || method !== req.method) continue;
    try {
      const decoded = m.map((x) => (typeof x === 'string' ? decodeURIComponent(x) : x));
      const out = fn(decoded, query, body);
      return Array.isArray(out) && typeof out[0] === 'number' ? send(res, out[0], out[1]) : send(res, 200, out);
    } catch (e) { return send(res, e.status || 500, { error: e.message }); }
  }
  return send(res, 404, { error: 'No such endpoint: ' + req.method + ' ' + path });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url.pathname.slice(4), url.searchParams);
  const file = normalize(join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('Not found'); }
}).listen(PORT, () => console.log(`Mock CoLab API on http://localhost:${PORT} (app: http://localhost:${PORT}/?api=/api)`));
