const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseOverall, parseElectorates } = require('./parse');

const BASE = process.env.SOURCE_BASE || 'https://electionresults.govt.nz/ge2026';
const TTL_MS = 30 * 1000;
const PORT = process.env.PORT || 3000;
let cache = { at: 0, data: null, inflight: null };

async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'nz-election-live/1.0 (unofficial viewer)' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.text();
}

async function refresh() {
  const [overallHtml, electHtml] = await Promise.all([get(`${BASE}/index.html`), get(`${BASE}/electorate-status.html`)]);
  const overall = parseOverall(overallHtml);
  const elect = parseElectorates(electHtml);
  if (!overall.parties.length) throw new Error('Parsed zero parties: source page layout may have changed');
  return { fetchedAt: new Date().toISOString(), source: BASE + '/', overall, ...elect };
}

async function getData() {
  if (cache.data && Date.now() - cache.at < TTL_MS) return cache.data;
  if (!cache.inflight) {
    cache.inflight = refresh()
      .then((d) => { cache.data = d; cache.at = Date.now(); return d; })
      .finally(() => { cache.inflight = null; });
  }
  try { return await cache.inflight; }
  catch (e) { if (cache.data) return { ...cache.data, stale: true, error: e.message }; throw e; }
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/results') {
    try {
      const d = await getData();
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'public, max-age=15' });
      res.end(JSON.stringify(d));
    } catch (e) {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  if (url.pathname === '/healthz') { res.writeHead(200); res.end('ok'); return; }
  const file = url.pathname === '/' ? '/index.html' : url.pathname;
  const full = path.join(__dirname, 'public', path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
  if (!full.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403); res.end(); return; }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(full)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log('listening on', PORT));
