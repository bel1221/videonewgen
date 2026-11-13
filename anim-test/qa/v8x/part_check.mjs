// One page load: phase + cross QA over a time window, the clash distances, and stills. Run from anim-test/:
//   node qa/v8x/part_check.mjs <outdir under anim-test> <t0> <t1> <still times, comma separated>      (PAGE / QS as for a render)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright-core';
const [outdir, t0, t1, stills] = process.argv.slice(2);
const ROOT = path.resolve('..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { console.error('404', req.url); res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const log = {};
page.on('console', m => { const s = m.text(); const k = /^(CLASHES|PARRY|GROUNDHITS|FLOOR|GRIP)/.exec(s); if (k) log[k[1]] = s.slice(k[1].length).trim(); else if (m.type() === 'error') console.error('[page]', s); });
page.on('pageerror', e => console.error('[pageerror]', e.message));
const T0 = Date.now();
await page.goto(`http://127.0.0.1:${server.address().port}/${process.env.PAGE}${process.env.QS || ''}`);
await page.waitForFunction('window.ready === true', null, { timeout: 900000 });
await page.evaluate(() => document.fonts.ready);
console.error('loaded in', Math.round((Date.now() - T0) / 1000), 's');
const src = n => fs.readFileSync(`tools/${n}.js`, 'utf8').trim().replace(/;\s*$/, '');
const qa = await page.evaluate(`(async () => { window.__qa_t0 = ${t0}; window.__qa_t1 = ${t1}; const out = {};
  for (const [k, f] of [['phase', () => ${src('phase_qa')}], ['cross', () => ${src('cross_qa')}]]) { try { out[k] = await f(); } catch (e) { out[k] = { error: String(e && e.stack || e) }; } }
  const C = window.__probe.C, ev = C.events(); out.swings = ev.swings.filter(s => s[0] >= ${t0} && s[0] <= ${t1}); out.total = C.TOTAL;
  out.gap = []; for (let t = ${t0}; t <= ${t1}; t += 0.25) { const a = C.pose('A', t).pos, b = C.pose('B', t).pos; out.gap.push([+t.toFixed(2), +Math.hypot(a[0] - b[0], a[2] - b[2]).toFixed(2)]); }
  return out; })()`);
if (process.env.EXTRA) qa.extra = await page.evaluate(fs.readFileSync(process.env.EXTRA, 'utf8'));
qa.steps = await page.evaluate(`(window.__st = [${Math.max(+t0, 2.9)}, ${t1}], ${fs.readFileSync('qa/v8x/steps_probe.js', 'utf8').trim()})`);
const clashes = JSON.parse(log.CLASHES || '[]').filter(c => c[0] >= +t0 && c[0] <= +t1).map(c => [c[0], c[2], c[1][1]]);   // [t, blade-to-blade distance, contact height]
fs.mkdirSync(outdir, { recursive: true });
fs.writeFileSync(path.join(outdir, 'check.json'), JSON.stringify({ clashes, parry: JSON.parse(log.PARRY || '[]').filter(c => c[0] >= +t0 && c[0] <= +t1), ...qa }));
for (const s of (stills || '').split(',').filter(Boolean)) { const t = parseFloat(s); const label = await page.evaluate(t => window.renderAt(t), t);
  await page.screenshot({ path: path.join(outdir, `still_${t.toFixed(2).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 }); console.error('still', t, label); }
if (process.env.FRAMES) {   // FRAMES="f0,f1,out.mp4": also render that frame range (30 fps, H.264, no sound) in the same page load
  const { spawn } = await import('node:child_process'); const [f0, f1, out] = process.env.FRAMES.split(',');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = +f0; f < +f1; f++) { await page.evaluate(t => window.renderAt(t), f / 30); const buf = await page.screenshot({ type: 'png' }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.error('rendered', out);
}
await browser.close(); server.close();
