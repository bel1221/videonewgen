// One page load, many jobs, for the 2 v 2 scene (fight_w/index4.html; a load takes minutes because both duels are solved).
//   node tools/duo_run.mjs            (from anim-test/)   env:
//   QS="?sub=1&fast=1"                query string (fast=1 = layout pass)
//   EVALS="duo_qa.js,weight_qa.js"    tools/*.js to evaluate; results -> qa/duo/<name>.json   (PROBE=1|2 is passed as ?probe= for per-duel tools)
//   STILLS="4.4,19.05"                VIDEO times to render with the director's camera -> qa/duo/still_<t>.jpg
//   TOPS="19.05,28.3"                 VIDEO times to render from straight above       -> qa/duo/top_<t>.jpg
//   FRAMES="0 1200 out/x.mp4"         render a frame range at 30 fps (needs ffmpeg on PATH)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
const ROOT = path.resolve('..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const log = []; page.on('console', m => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning' || /^(CLASHES|GROUNDHITS)/.test(t)) { log.push(t); if (!/^(CLASHES|PARRY|GROUNDHITS|GRIP)/.test(t)) console.error('[page]', t.slice(0, 300)); } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
const t0 = Date.now(), QS = (process.env.QS || '?sub=1') + (process.env.PROBE ? '&probe=' + process.env.PROBE : '');
await page.goto(`http://127.0.0.1:${server.address().port}/anim-test/fight_w/index4.html${QS}`);
await page.waitForFunction('window.ready === true', null, { timeout: 1200000 }); await page.evaluate(() => document.fonts.ready);
console.error('ready in', ((Date.now() - t0) / 1000).toFixed(0), 's');
const OUT = process.env.OUTDIR || 'qa/duo'; fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'pagelog' + (process.env.TAG || '') + '.txt'), log.join('\n'));
if (process.env.PRE) await page.evaluate(process.env.PRE);
for (const f of (process.env.EVALS || '').split(',').filter(Boolean)) { const r = await page.evaluate(fs.readFileSync(path.join('tools', f), 'utf8'));
  fs.writeFileSync(path.join(OUT, f.replace('.js', '') + (process.env.PROBE || '') + '.json'), JSON.stringify(r, null, 1)); console.error('eval', f, 'done'); }
const shot = async (tv, top, name) => { await page.evaluate(([tv, top]) => { window.__top = top; return window.renderAt(tv); }, [tv, top]);
  await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 88 }); };
for (const s of (process.env.STILLS || '').split(',').filter(Boolean)) await shot(+s, false, `still_${(+s).toFixed(2).padStart(5, '0')}.jpg`);
for (const s of (process.env.TOPS || '').split(',').filter(Boolean)) await shot(+s, true, `top_${(+s).toFixed(2).padStart(5, '0')}.jpg`);
if (process.env.FRAMES) { const [f0, f1, out] = process.env.FRAMES.split(' '); await page.evaluate(() => { window.__top = false; });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', process.env.CRF || '15', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const tf = Date.now();
  for (let f = +f0; f < +f1; f++) { await page.evaluate(t => window.renderAt(t), f / 30); const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) console.error(`frame ${f} (${((Date.now() - tf) / (f - f0 + 1)).toFixed(0)} ms/frame)`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
if (process.env.EVENTS) fs.writeFileSync(process.env.EVENTS, JSON.stringify(await page.evaluate(() => window.events())));
await browser.close(); server.close();
