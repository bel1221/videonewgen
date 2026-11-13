// One page load, four QA tools. Run from anim-test/:  node qa/v8x/run_qa.mjs   (PAGE/QS as for a render)
import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
const src = n => fs.readFileSync(`tools/${n}.js`, 'utf8').trim().replace(/;\s*$/, '');
const expr = `(async () => { window.__qa_w = ['aegisblade', 'veilblade']; const out = {};
  for (const [k, f] of [['phase', () => ${src('phase_qa')}], ['cross', () => ${src('cross_qa')}], ['weight', () => ${src('weight_qa')}], ['freehand', () => ${src('freehand_qa')}]]) {
    try { out[k] = await f(); } catch (e) { out[k] = { error: String(e && e.stack || e) }; } }
  return out; })()`;
const r = spawnSync(process.execPath, ['render.mjs', 'eval', expr], { encoding: 'utf8', maxBuffer: 1 << 28 });
fs.writeFileSync('qa/v8x/qa_result.json', r.stdout);
process.stderr.write(r.stderr.split('\n').filter(l => !/^\[page\] (PARRY|CLASHES)/.test(l)).join('\n'));
console.log('status', r.status, 'bytes', r.stdout.length);
