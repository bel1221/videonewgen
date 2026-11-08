// Headless-Chrome renderer for the three.js test clip.
//   node render.mjs still 1.0,3.6,8.5          -> qa/still_XX.XX.jpg
//   node render.mjs frames F0 F1 out.mp4       -> frames F0..F1-1 at 30 fps (H.264)
// Serves the repo root on a local port so the page can load skins, weapons, fonts and three.js.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning' || /^(contacts|FLOOR|CLASHES)/.test(m.text())) console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[pageerror]', e.message));
const PAGE = '/' + (process.env.PAGE || 'anim-test/web/index.html').replace(/^\/+/, '');
await page.goto(`http://127.0.0.1:${port}${PAGE}${process.env.QS || ''}`);
await page.waitForFunction('window.ready === true', null, { timeout: 300000 });
await page.evaluate(() => document.fonts.ready);
const info = await page.evaluate(() => { const gl = document.querySelector('canvas').getContext('webgl2'); const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
console.error('renderer:', info);

const [mode, a, b, out] = process.argv.slice(2);
if (mode === 'still') {
  fs.mkdirSync(path.join(ROOT, 'anim-test/' + (process.env.QADIR || 'qa')), { recursive: true });
  for (const s of a.split(',')) {
    const t = parseFloat(s); const t0 = Date.now(); const label = await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: path.join(ROOT, `anim-test/${process.env.QADIR || 'qa'}/still_${t.toFixed(2).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
    console.error(`t=${t} ${label} ${Date.now() - t0} ms`);
  }
} else {
  const f0 = +a, f1 = +b;
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.renderAt(t), f / 30);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 15 === 0) console.error(`frame ${f} (${((Date.now() - t0) / (f - f0 + 1)).toFixed(0)} ms/frame)`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close(); server.close();
