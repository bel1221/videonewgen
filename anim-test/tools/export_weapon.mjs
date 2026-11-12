// Export weapons from the .bbmodel to the fight format (JSON quads + PNG textures), at the SIZE and GRIP of the reference sheet
// (gripref/weapons.json: len, grip, shift, face). No Python/PIL needed. Same output format as tools/export_weapon.py.
//   node tools/export_weapon.mjs Blinkblade "Jingu Bang (jingubang)" Seekerbow Boltspear      (run from anim-test/)
// -> fight/assets/w2/<file>.json (+ textures), file = lower-case name without the "(...)" part. Prints each weapon's extents (px).
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('..'), OUT = 'fight/assets/w2'; fs.mkdirSync(OUT, { recursive: true });
const BB = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/models/newgenmc_vu_khi_huyen_thoai.bbmodel'), 'utf8'));
const CFG = JSON.parse(fs.readFileSync('gripref/weapons.json', 'utf8'));
const EL = {}; BB.elements.forEach(e => EL[e.uuid] = e);
const collect = n => n.children.flatMap(c => typeof c === 'string' ? (EL[c] && EL[c].visibility !== false ? [EL[c]] : []) : collect(c));
const D = Math.PI / 180;
function rot(r) {   // Rz * Ry * Rx
  const [x, y, z] = r.map(a => a * D), cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
  const Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]], Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
  const mul = (A, B) => A.map(r_ => [0, 1, 2].map(j => r_[0] * B[0][j] + r_[1] * B[1][j] + r_[2] * B[2][j]));
  return mul(mul(Rz, Ry), Rx);
}
const app = (M, v) => M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
function faces(e) {
  const inf = e.inflate || 0, f = e.from.map(v => v - inf), t = e.to.map(v => v + inf), R = rot(e.rotation || [0, 0, 0]), o = e.origin || [0, 0, 0];
  const [fx, fy, fz] = f, [tx, ty, tz] = t;
  const C = { north: [[tx, ty, fz], [fx, ty, fz], [tx, fy, fz]], south: [[fx, ty, tz], [tx, ty, tz], [fx, fy, tz]], east: [[tx, ty, tz], [tx, ty, fz], [tx, fy, tz]],
    west: [[fx, ty, fz], [fx, ty, tz], [fx, fy, fz]], up: [[fx, ty, fz], [tx, ty, fz], [fx, ty, tz]], down: [[fx, fy, tz], [tx, fy, tz], [fx, fy, fz]] };
  const out = [];
  for (const k in e.faces) { const fc = e.faces[k]; if (fc.texture == null || !C[k]) continue;
    out.push({ P: C[k].map(p => app(R, p.map((v, i) => v - o[i])).map((v, i) => v + o[i])), fc, el: e }); }
  return out;
}
for (const arg of process.argv.slice(2)) {
  const W = CFG.weapons.find(w => w.name === arg || (w.label || '') === arg); if (!W) { console.error('not in gripref/weapons.json:', arg); continue; }
  const g = BB.outliner.find(o => o.name === W.name), fl = collect(g).flatMap(faces), file = W.name.split(' (')[0].toLowerCase();
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], ex = p => p.forEach((v, i) => { mn[i] = Math.min(mn[i], v); mx[i] = Math.max(mx[i], v); });
  fl.forEach(f => { f.P.forEach(ex); ex(f.P[1].map((v, i) => v + f.P[2][i] - f.P[0][i])); });
  const native = mx[1] - mn[1], s = W.len / native, sh = W.shift || [0, 0], fz = W.face === -1 ? -1 : 1;
  const gp = [(mn[0] + mx[0]) / 2 + sh[0], mn[1] + W.grip * native, (mn[2] + mx[2]) / 2 + sh[1]];
  const tr0 = p => [(p[0] - gp[0]) * s * fz, (p[1] - gp[1]) * s, (p[2] - gp[2]) * s * fz];
  const tr = p => { let q = tr0(p); for (let i = 0; i < (W.fightTurn || 0); i++) q = [-q[2], q[1], q[0]]; return q; };   // fightTurn: quarter turns about the long axis   // face -1: half a turn about the long axis (single-edged blades)
  const out = { name: W.label || W.name, len: W.len, grip: W.grip, textures: [], quads: [] }, used = {};
  for (const { P, fc, el } of fl) { const ti = fc.texture;
    if (!(ti in used)) { const T = BB.textures[ti], buf = Buffer.from(T.source.split(',')[1], 'base64'), w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
      const uw = T.uv_width || 16, uh = T.uv_height || 16, fh = Math.round(w * uh / uw), frames = h > fh && h % fh === 0 ? h / fh : 1, fn = `${file.replace(/ /g, '_')}_${ti}.png`;
      fs.writeFileSync(path.join(OUT, fn), buf); used[ti] = out.textures.length; out.textures.push({ file: fn, w, h, uw, uh: uh * frames }); }   // animated textures: frame 0 (uh covers the whole strip)
    const [u1, v1, u2, v2] = fc.uv; let uvs = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]]; const r = ((fc.rotation || 0) / 90 | 0) % 4; uvs = uvs.slice(r).concat(uvs.slice(0, r));
    out.quads.push({ t: used[ti], p: P.map(p => tr(p).map(v => +v.toFixed(4))), uv: [uvs[0], uvs[1], uvs[3]], e: el.name }); }
  fs.writeFileSync(path.join(OUT, file + '.json'), JSON.stringify(out));
  const a = tr(mn), b = tr(mx), lo = a.map((v, i) => Math.min(v, b[i]).toFixed(1)), hi = a.map((v, i) => Math.max(v, b[i]).toFixed(1));
  console.log(file.padEnd(14), out.quads.length, 'quads', out.textures.length, 'tex | x', lo[0], hi[0], '| y', lo[1], hi[1], '| z', lo[2], hi[2]);
}
