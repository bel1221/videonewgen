// node gripref/models.mjs  -> out/gripref/models_1.png .. (each weapon alone with a % ruler; for finding handles)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright-core';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.bbmodel': 'application/json' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 950 } }); page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/anim-test/gripref/index.html`); await page.waitForFunction('window.ready === true', null, { timeout: 120000 }); await page.evaluate(() => document.fonts.ready);
const OUT = path.join(ROOT, 'anim-test/out/gripref'); const n = await page.evaluate(() => window.count), per = +(process.env.PER || 5);
for (let a = 0, k = 1; a < n; a += per, k++) { const url = await page.evaluate(([a, b]) => window.models(a, b), [a, Math.min(n, a + per)]); fs.writeFileSync(path.join(OUT, `models_${k}.png`), Buffer.from(url.split(',')[1], 'base64')); console.log('models_' + k); }
await browser.close(); server.close();
