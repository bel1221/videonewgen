// Choreography, cameras and effect timing for the 20 s fight test. Pure functions of t.
// Modelled on Marlow's Downfall (study §2): fight shots 0.3-0.8 s, long anticipation -> short strike, 2-frame impact
// inserts with flare, knockback that travels, cold palette with warm sparks only, camera always moving.
import * as THREE from 'three';

export const TOTAL = 14.0;
const DT = 1 / 30;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const E = { lin: u => u, io: u => u * u * (3 - 2 * u), o: u => 1 - Math.pow(1 - u, 3), i: u => u * u * u, o2: u => 1 - (1 - u) * (1 - u),
  back: u => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); } };
const JK = ['waist', 'chest', 'head', 'rArm', 'rElbow', 'lArm', 'lElbow', 'rLeg', 'rKnee', 'lLeg', 'lKnee'];

let W = null, F = 30;
export function init(world) { W = world; F = world.FLOOR; buildAll(); simulate(); }
export function resim() { STEPS.length = 0; simulate(); }

// ------------------------------------------------------------------ pose library (signs: see rig.js applyPose notes)
function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, tilt: [0, 0], yawAbs: null, bda: [70, 0] }; for (const j of JK) p[j] = [0, 0, 0]; return p; }
const cp = p => { const o = JSON.parse(JSON.stringify(p)); delete o._flat; return o; };
function S(base, d) { const o = cp(base); delete o._flat; for (const k in d) o[k] = Array.isArray(d[k]) ? d[k].slice() : d[k]; return o; }
const L = {};
L.relaxed = S(N(), { rArm: [-4, 0, -14], rElbow: [-10, 0, 0], wrist: 172, lArm: [4, 0, 8], lElbow: [-8, 0, 0], rKnee: [3, 0, 0], lKnee: [3, 0, 0], head: [4, 0, 0] });
L.guard = S(N(), { rLeg: [-22, 0, -6], rKnee: [34, 0, 0], lLeg: [18, 0, 6], lKnee: [26, 0, 0], waist: [10, -14, 0], chest: [4, -8, 0], head: [-10, 18, 0],
  rArm: [-62, 0, -10], rElbow: [-56, 0, 0], lArm: [-38, 0, 24], lElbow: [-64, 0, 0], y: -0.14, wrist: 136 });
const G = L.guard;
L.windR = S(G, { chest: [-4, -42, 0], waist: [4, -22, 0], head: [-8, 38, 0], rArm: [-158, 0, -46], rElbow: [-74, 0, 0], wrist: 168, lArm: [-50, 0, 30], lElbow: [-70, 0, 0], rKnee: [44, 0, 0], lKnee: [34, 0, 0], y: -0.22 });
L.slashR = S(G, { chest: [16, 48, 0], waist: [14, 26, 0], head: [-6, -20, 0], rArm: [-52, 0, 34], rElbow: [-8, 0, 0], wrist: 162, lArm: [10, 0, 40], lElbow: [-30, 0, 0],
  rLeg: [-40, 0, -6], rKnee: [50, 0, 0], lLeg: [26, 0, 6], lKnee: [20, 0, 0], y: -0.28 });
L.windL = S(G, { chest: [-2, 46, 0], waist: [4, 24, 0], head: [-8, -30, 0], rArm: [-128, 0, 52], rElbow: [-96, 0, 0], wrist: 172, lArm: [-30, 0, 20], lElbow: [-40, 0, 0] });
L.slashL = S(G, { chest: [12, -52, 0], waist: [10, -28, 0], head: [-6, 30, 0], rArm: [-84, 0, -64], rElbow: [-4, 0, 0], wrist: 176, lArm: [-20, 0, 46], lElbow: [-50, 0, 0],
  rLeg: [-30, 0, -8], rKnee: [44, 0, 0], lLeg: [24, 0, 8], lKnee: [30, 0, 0] });
L.windO = S(G, { rArm: [-196, 0, -12], rElbow: [-78, 0, 0], wrist: 170, chest: [-16, 0, 0], waist: [-8, 0, 0], head: [-14, 0, 0], lArm: [-170, 0, 16], lElbow: [-70, 0, 0], rKnee: [30, 0, 0], lKnee: [24, 0, 0] });
L.slashO = S(G, { rArm: [-56, 0, -6], rElbow: [-10, 0, 0], wrist: 150, lArm: [-60, 0, 14], lElbow: [-14, 0, 0], chest: [26, 0, 0], waist: [24, 0, 0], head: [8, 0, 0],
  rLeg: [-44, 0, -6], rKnee: [60, 0, 0], lLeg: [22, 0, 6], lKnee: [40, 0, 0], y: -0.34 });
L.windT = S(G, { wrist: 160, rArm: [-6, 0, -14], rElbow: [-120, 0, 0], chest: [2, -40, 0], waist: [6, -22, 0], head: [-10, 30, 0], rKnee: [44, 0, 0], lKnee: [38, 0, 0], y: -0.2 });
L.thrust = S(G, { wrist: 178, rArm: [-112, 0, 0], rElbow: [-2, 0, 0], chest: [12, 14, 0], waist: [16, 8, 0], head: [-10, -16, 0], rLeg: [-60, 0, -6], rKnee: [48, 0, 0], lLeg: [34, 0, 6], lKnee: [10, 0, 0], lArm: [24, 0, 40], y: -0.3 });
L.parryH = S(G, { rArm: [-150, 0, -30], rElbow: [-50, 0, 0], roll: 90, wrist: 92, lArm: [-150, 0, 30], lElbow: [-60, 0, 0], chest: [-6, 0, 0], head: [-14, 0, 0], rKnee: [40, 0, 0], lKnee: [34, 0, 0], y: -0.24 });
L.parryR = S(G, { rArm: [-58, 0, -28], rElbow: [-62, 0, 0], wrist: 112, chest: [2, -20, 0], lArm: [-44, 0, 26] });
L.parryL = S(G, { rArm: [-84, 0, 44], rElbow: [-78, 0, 0], wrist: 118, chest: [2, 24, 0], lArm: [-30, 0, 20] });
L.kickW = S(G, { fkR: true, rLeg: [-60, 0, -4], rKnee: [104, 0, 0], lKnee: [24, 0, 0], waist: [-6, 0, 0], rArm: [-50, 0, -30], rElbow: [-40, 0, 0], lArm: [-40, 0, 40], wrist: 140 });
L.kick = S(L.kickW, { rLeg: [-98, 0, -4], rKnee: [8, 0, 0], lLeg: [6, 0, 4], lKnee: [18, 0, 0], waist: [-20, 0, 0], chest: [-8, 0, 0] });
L.hitBack = S(G, { waist: [-30, 0, 0], chest: [-22, 0, 0], head: [-28, 0, 0], rArm: [-50, 0, -70], rElbow: [-24, 0, 0], lArm: [-40, 0, 70], lElbow: [-28, 0, 0],
  rLeg: [-40, 0, -6], rKnee: [24, 0, 0], lLeg: [16, 0, 6], lKnee: [12, 0, 0], wrist: 140, y: -0.05 });
L.slide = S(G, { waist: [30, 0, 0], chest: [10, 0, 0], head: [-30, 0, 0], rLeg: [-50, 0, -8], rKnee: [90, 0, 0], lLeg: [30, 0, 8], lKnee: [60, 0, 0],
  rArm: [-30, 0, -50], rElbow: [-20, 0, 0], wrist: 205, lArm: [-36, 0, 64], lElbow: [-10, 0, 0], y: -0.5 });
L.kneelG = S(G, { rLeg: [-88, 0, -6], rKnee: [92, 0, 0], lLeg: [6, 0, 4], lKnee: [96, 0, 0], waist: [16, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0], y: -0.42 });
L.kneelBlock = S(L.kneelG, { rArm: [-150, 0, -30], rElbow: [-50, 0, 0], roll: 90, wrist: 92, lArm: [-150, 0, 30], lElbow: [-60, 0, 0], chest: [-8, 0, 0], head: [-20, 0, 0] });
L.crouch = S(G, { rLeg: [-36, 0, -6], rKnee: [80, 0, 0], lLeg: [24, 0, 6], lKnee: [70, 0, 0], waist: [34, 0, 0], chest: [12, 0, 0], head: [-28, 0, 0],
  rArm: [-150, 0, -14], rElbow: [-62, 0, 0], wrist: 168, lArm: [20, 0, 30], y: -0.42 });
L.takeoff = S(L.crouch, { rLeg: [12, 0, -4], rKnee: [8, 0, 0], lLeg: [34, 0, 4], lKnee: [22, 0, 0], waist: [-10, 0, 0], chest: [-14, 0, 0], head: [-8, 0, 0], rArm: [-196, 0, -10], rElbow: [-84, 0, 0], lArm: [-64, 0, 34], y: 0.4 });
L.tuck = S(L.takeoff, { rLeg: [-64, 0, -4], rKnee: [96, 0, 0], lLeg: [-20, 0, 4], lKnee: [106, 0, 0], waist: [-4, 0, 0], chest: [-18, 0, 0], rArm: [-200, 0, -10], rElbow: [-88, 0, 0], wrist: 170, lArm: [-150, 0, 20] });
L.slam = S(L.slashO, { waist: [44, 0, 0], chest: [30, 0, 0], head: [-10, 0, 0], rArm: [-34, 0, -6], rElbow: [-6, 0, 0], wrist: 168, lArm: [-40, 0, 10], lElbow: [-10, 0, 0], rKnee: [92, 0, 0], lKnee: [76, 0, 0], rLeg: [-60, 0, -8], lLeg: [30, 0, 8], y: -0.62 });
L.dodge = S(G, { waist: [10, 0, 22], chest: [6, 0, 12], head: [-6, 0, -14], rLeg: [-10, 0, -26], rKnee: [34, 0, 0], lLeg: [12, 0, 10], lKnee: [52, 0, 0], y: -0.3 });
L.duck = S(G, { waist: [44, 0, 0], chest: [16, 0, 0], head: [-30, 0, 0], rLeg: [-58, 0, -8], rKnee: [100, 0, 0], lLeg: [12, 0, 8], lKnee: [100, 0, 0], rArm: [-30, 0, -20], rElbow: [-70, 0, 0], wrist: 150, y: -0.42 });
L.bind = S(G, { rArm: [-88, 0, -6], rElbow: [-62, 0, 0], wrist: 122, lArm: [-80, 0, 30], lElbow: [-70, 0, 0], chest: [22, 10, 0], waist: [18, 0, 0], head: [-14, 0, 0],
  rLeg: [-44, 0, -6], rKnee: [56, 0, 0], lLeg: [34, 0, 6], lKnee: [16, 0, 0], y: -0.3 });
L.spin = S(G, { rArm: [-90, 0, -72], rElbow: [-4, 0, 0], wrist: 178, chest: [6, -30, 0], waist: [6, -10, 0], lArm: [-40, 0, 62], lElbow: [-20, 0, 0], rKnee: [40, 0, 0], lKnee: [36, 0, 0], y: -0.2 });
L.sweepW = S(G, { waist: [30, 30, 0], chest: [10, 50, 0], rArm: [-70, 0, 40], rElbow: [-80, 0, 0], wrist: 170, rKnee: [70, 0, 0], lKnee: [60, 0, 0], y: -0.5 });
L.sweep = S(G, { waist: [40, -30, 0], chest: [14, -40, 0], rArm: [-60, 0, -60], rElbow: [-4, 0, 0], wrist: 178, rLeg: [-60, 0, -10], rKnee: [100, 0, 0], lLeg: [40, 0, 10], lKnee: [90, 0, 0], y: -0.62 });
L.upperW = S(L.sweep, { rArm: [10, 0, -30], rElbow: [-20, 0, 0], wrist: 200, chest: [20, -30, 0], waist: [24, -10, 0] });
L.upper = S(G, { rArm: [-172, 0, -20], rElbow: [-10, 0, 0], wrist: 176, chest: [-14, 20, 0], waist: [-6, 10, 0], head: [-20, 0, 0], rLeg: [-30, 0, -6], rKnee: [30, 0, 0], lLeg: [30, 0, 6], lKnee: [20, 0, 0], y: 0 });
L.land = S(G, { rLeg: [-38, 0, -6], rKnee: [80, 0, 0], lLeg: [26, 0, 6], lKnee: [74, 0, 0], waist: [28, 0, 0], chest: [10, 0, 0], head: [-18, 0, 0], y: -0.36 });
L.flick = S(L.relaxed, { rArm: [-40, 0, -52], rElbow: [-20, 0, 0], wrist: 176, head: [6, -24, 0] });
L.knees = S(N(), { rLeg: [0, 0, -4], rKnee: [90, 0, 0], lLeg: [0, 0, 4], lKnee: [90, 0, 0], waist: [34, 0, 0], chest: [18, 0, 0], head: [30, 0, 0], rArm: [-6, 0, -10], rElbow: [-10, 0, 0], lArm: [4, 0, 10], wrist: 166, y: -0.38 });
L.fallen = S(L.knees, { tilt: [82, 0], waist: [10, 0, 0], chest: [6, 0, 0], head: [10, 0, 0], rArm: [-150, 0, -20], lArm: [-150, 0, 20], y: -0.1 });


// ------------------------------------------------------------------ blade intent (Desert Arena study): where the blade points, per action,
// relative to the torso. The rig solves wrist bend + roll each frame so the hand aims the blade there.
const bdv = (el, az) => { const e = el * Math.PI / 180, a = az * Math.PI / 180; return [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)]; };
const BD = {
  relaxed: [-40, -32], guard: [68, -12], windR: [40, -112], slashR: [-6, 58], windL: [42, 112], slashL: [-6, -58],
  windO: [108, 0], slashO: [-30, 0], windT: [4, -8], thrust: [0, 0], parryH: [6, 90], parryR: [74, -28], parryL: [74, 28],
  kickW: [62, -20], kick: [55, -30], hitBack: [40, -70], slide: [-18, -150], kneelG: [70, -10], kneelBlock: [6, 90],
  crouch: [-28, -155], takeoff: [118, 0], tuck: [108, 0], slam: [-62, 0], dodge: [64, -15], duck: [48, -35], bind: [56, 14],
  spin: [2, -92], sweepW: [-16, -115], sweep: [-22, 52], upperW: [-42, -20], upper: [82, 0], land: [50, -15], flick: [-45, -45],
  knees: [-50, -25], fallen: [-10, -90],
};
for (const k in BD) if (L[k]) L[k].bda = BD[k].slice();
function mix(a, b, u) {
  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u), tilt: [lerp(a.tilt[0], b.tilt[0], u), lerp(a.tilt[1], b.tilt[1], u)],
    yawAbs: (a.yawAbs != null && b.yawAbs != null) ? lerp(a.yawAbs, b.yawAbs, u) : (u < 0.5 ? a.yawAbs : b.yawAbs) };
  o.fkR = u < 0.5 ? a.fkR : b.fkR; o.fkL = u < 0.5 ? a.fkL : b.fkL;
  { const ba = a.bda || [70, 0], bb = b.bda || [70, 0]; o.bda = [lerp(ba[0], bb[0], u), lerp(ba[1], bb[1], u)]; }
  for (const j of JK) o[j] = a[j].map((v, i) => lerp(v, b[j][i], u)); return o;
}
// pose <-> flat numeric vector (for spline interpolation)
const FLAT_KEYS = ['wrist', 'roll', 'y', 'yawOff'];
function flat(p) { if (p._flat) return p._flat; const a = FLAT_KEYS.map(k => p[k]); a.push(p.tilt[0], p.tilt[1]); a.push(...(p.bda || [70, 0])); for (const j of JK) a.push(...p[j]); p._flat = a; return a; }
function unflat(a, tmpl) {
  const o = { yawAbs: tmpl.yawAbs, fkR: tmpl.fkR, fkL: tmpl.fkL }; let i = 0; for (const k of FLAT_KEYS) o[k] = a[i++]; o.tilt = [a[i++], a[i++]];
  o.bda = [a[i++], a[i++]];
  for (const j of JK) o[j] = [a[i++], a[i++], a[i++]]; return o;
}
// Cardinal spline through keyframes with non-uniform times; per-segment ease only warps time ('i' accelerates into an
// impact, 'o' decelerates out of one, 'back' overshoots); 'io' segments flow through keys instead of stopping.
const WARP = { io: u => u, lin: u => u, o: u => 1 - (1 - u) * (1 - u), o2: u => 1 - (1 - u) * (1 - u), i: u => u * u * u };
function evalKeys(K, t) {
  if (t <= K[0][0]) return cp(K[0][1]);
  const n = K.length; if (t >= K[n - 1][0]) return cp(K[n - 1][1]);
  let i = 1; while (K[i][0] < t) i++;
  const [t1, p1] = K[i - 1], [t2, p2, e] = K[i]; const u = (t - t1) / Math.max(1e-6, t2 - t1);
  const ey = (p1.yawAbs != null && p2.yawAbs != null) ? lerp(p1.yawAbs, p2.yawAbs, u) : (u < 0.5 ? p1.yawAbs : p2.yawAbs);
  if (e === 'back') { const o = mix(p1, p2, E.back(u)); o.yawAbs = ey; o.fkR = (u < 0.5 ? p1 : p2).fkR; return o; }
  const w = (WARP[e || 'io'] || WARP.io)(u);
  const a1 = flat(p1), a2 = flat(p2), a0 = i >= 2 ? flat(K[i - 2][1]) : a1, a3 = i + 1 < n ? flat(K[i + 1][1]) : a2;
  const t0 = i >= 2 ? K[i - 2][0] : t1 - (t2 - t1), t3 = i + 1 < n ? K[i + 1][0] : t2 + (t2 - t1), dt = t2 - t1;
  // tangents are zeroed at hard keys (impact 'i' arriving, 'o'/'lin' leaving) so strikes stay crisp
  const k1 = (e === 'o' || e === 'lin') ? 0 : 0.85, k2 = (e === 'i' || e === 'lin' || (K[i + 1] && K[i + 1][2] === 'o')) ? 0 : 0.85;
  const h00 = 2 * w ** 3 - 3 * w * w + 1, h10 = w ** 3 - 2 * w * w + w, h01 = -2 * w ** 3 + 3 * w * w, h11 = w ** 3 - w * w;
  const out = a1.map((v, j) => { const m1 = k1 * (a2[j] - a0[j]) / Math.max(1e-6, t2 - t0) * dt, m2 = k2 * (a3[j] - a1[j]) / Math.max(1e-6, t3 - t1) * dt;
    return h00 * v + h10 * m1 + h01 * a2[j] + h11 * m2; });
  const o = unflat(out, u < 0.5 ? p1 : p2); o.yawAbs = ey; return o;
}
function evalPos(K, t) {
  if (t <= K[0][0]) return [K[0][1], K[0][2]];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, x0, z0] = K[i - 1], [t1, x1, z1, e] = K[i]; const u = E[e || 'io']((t - t0) / Math.max(1e-6, t1 - t0)); return [lerp(x0, x1, u), lerp(z0, z1, u)]; }
  const l = K[K.length - 1]; return [l[1], l[2]];
}

// ------------------------------------------------------------------ run cycle (sword arm low, blade trailing; free arm pumps)
const STRIDE = 2.2;   // blocks per full run cycle (right + left step)
function runBody(phi, p) {
  const s = Math.sin(2 * Math.PI * phi);
  p.waist = [16, -9 * s, 0]; p.chest = [6, p.chest[1] + 6 * s, 0]; p.y = -0.08; return p;
}
function runLegsOld(phi, p) {
  const s = Math.sin(2 * Math.PI * phi), c = Math.cos(2 * Math.PI * phi);
  p.rLeg = [-48 * s, 0, -2]; p.lLeg = [48 * s, 0, 2];
  p.rKnee = [12 + 96 * Math.pow(Math.max(0, c), 1.4), 0, 0]; p.lKnee = [12 + 96 * Math.pow(Math.max(0, -c), 1.4), 0, 0];
  p.waist = [p.waist[0] * 0.4 + 14, p.waist[1] * 0.5 - 6 * s, 0];
  p.y += 0.12 * (1 - Math.abs(s)) - 0.06; return p;
}
function runArms(phi, p, swordToo) {
  const s = Math.sin(2 * Math.PI * phi);
  p.lArm = [-52 * s, 0, 8]; p.lElbow = [-84 - 16 * Math.max(0, s), 0, 0];
  if (swordToo) { p.rArm = [28 + 12 * s, 0, -10]; p.rElbow = [-32 - 6 * s, 0, 0]; p.wrist = 214 + 6 * s; p.bda = [-22 + 6 * s, -160]; p.chest = [6, 10 * s, 0]; p.head = [-16, -6 * s, 0]; }
  return p;
}

// ------------------------------------------------------------------ timelines
const T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] };
const k = (c, t, pose, e, d) => T[c].push([t, d ? S(pose, d) : pose, e]);
const at = (c, t, x, z, e) => P[c].push([t, x, z, e]);
export const CLASHES = [];
function SWINGS() { const out = []; for (const c of ['A', 'B']) for (const [t, p, e] of T[c]) if (e === 'i' && t > 2.5) out.push([+t.toFixed(3), c]); return out.sort((a, b) => a[0] - b[0]); }   // {t, big, kind}
const clash = (t, big = false, kind = 'blade', extra = {}) => CLASHES.push({ t, big, kind, ...extra });

function buildAll() {
  // A: Ocean Sword (fast, light)  vs  B: Thundermaul (heavy). Study rules: low committed stances, hold-then-explode
  // timing (heavy wind-ups held 3-8 frames), camera kept on one side of the fighting line, still shots for beats.
  const shoulder = S(L.relaxed, { rArm: [-150, 0, -24], rElbow: [-112, 0, 0], bda: [45, 170], lArm: [6, 0, 10], head: [4, -8, 0] });
  // ---------- 0-1.6 standoff: circling sidesteps
  at('A', 0, -3.6, 0.3); at('B', 0, 3.6, -0.3);
  k('A', 0, G); k('B', 0, shoulder);
  at('A', 0.7, -3.5, 0.75); at('A', 1.5, -3.3, 1.2); at('B', 0.9, 3.5, -0.8);
  // ---------- B raises the hammer, holds, charges, hops, smashes the ground; A sidesteps
  k('B', 1.15, shoulder); k('B', 1.45, L.windO, 'o'); k('B', 1.62, L.windO, 'lin');
  RUN.B.push([1.62, 2.28]); at('B', 1.62, 3.5, -0.8); at('B', 2.28, -1.3, 0.7, 'lin'); at('B', 2.55, -2.0, 0.9, 'o');
  k('B', 2.28, L.windO, 'lin'); k('B', 2.42, L.windO, 'o', { y: 0.22, waist: [-14, 0, 0] });
  k('B', 2.55, L.slam, 'i'); k('B', 2.82, L.slam, 'lin', { y: -0.62 });
  clash(2.55, true, 'slam', { at: (cast, blade) => { const tip = blade('B', 2.57, [24])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; } });
  k('A', 1.9, G); k('A', 2.3, L.dodge, 'o'); at('A', 1.95, -3.3, 1.2); at('A', 2.4, -2.9, 2.3, 'o');
  // ---------- A counters: double slash, B blocks on the haft
  k('A', 2.62, L.windR, 'o'); k('A', 2.75, L.windR, 'lin'); k('A', 3.05, L.slashR, 'i'); at('A', 3.05, -2.3, 1.5, 'o');
  k('B', 3.0, L.parryH, 'o'); clash(3.05);
  k('A', 3.16, L.windL, 'o'); k('A', 3.35, L.slashL, 'i'); at('A', 3.35, -2.1, 1.2, 'o');
  k('B', 3.3, L.parryL, 'o'); clash(3.35);
  // ---------- B horizontal sweep with body follow-through; A ducks under
  k('B', 3.55, L.windR, 'o'); k('B', 3.82, L.windR, 'lin', { y: -0.26 });
  k('B', 4.05, L.slashR, 'i'); k('B', 4.28, L.slashR, 'o', { yawOff: -55 }); k('B', 4.5, G, 'io', { yawOff: 0 });
  k('A', 3.5, G); k('A', 3.9, L.duck, 'o'); k('A', 4.15, L.duck, 'lin');
  // ---------- A rises into a thrust; B catches it on the hammer head (big clash)
  k('A', 4.35, L.windT, 'o'); k('A', 4.65, L.thrust, 'i'); at('A', 4.35, -2.1, 1.2); at('A', 4.65, -1.4, 0.95, 'o');
  k('B', 4.6, L.parryR, 'o'); clash(4.65, true);
  // ---------- B kicks A away; A slides to one knee
  k('B', 4.82, L.kickW, 'o'); k('B', 5.0, L.kick, 'i'); k('B', 5.2, L.kick, 'lin'); k('B', 5.45, G, 'io');
  clash(5.0, false, 'kick', { at: () => { const q = pose('A', 5.02).pos; return [q[0], q[1] + 1.3, q[2]]; } });
  k('A', 4.85, L.thrust, 'lin'); k('A', 5.05, L.hitBack, 'o'); k('A', 5.3, L.slide, 'o'); k('A', 5.65, L.slide, 'lin'); k('A', 5.9, L.kneelG, 'o');
  at('A', 5.0, -1.4, 0.95); at('A', 5.7, -5.4, 1.4, 'o');
  // ---------- breathing hold (still shot); B shoulders the hammer again
  BR.A.push([5.9, 6.75]); BR.B.push([5.45, 6.75]);
  k('B', 5.9, G); k('B', 6.2, shoulder, 'io'); k('B', 6.6, shoulder);
  k('A', 6.3, L.kneelG); k('A', 6.62, G, 'o');
  // ---------- A sprints in and leaps into an aerial overhead; B blocks from a kneel (big clash), bind, push apart
  RUN.A.push([6.7, 7.45]); at('A', 6.7, -5.4, 1.4); at('A', 7.45, -1.9, 0.6, 'lin');
  k('A', 7.45, L.crouch, 'o'); k('A', 7.55, L.takeoff, 'o', { y: 0.6 }); k('A', 7.78, L.tuck, 'o', { y: 2.1 });
  k('A', 8.1, L.slashO, 'i', { y: 0.35 }); k('A', 8.2, L.bind, 'o');
  at('A', 7.55, -1.7, 0.55); at('A', 8.1, -0.6, 0.15, 'lin');
  k('B', 7.4, shoulder); k('B', 7.7, G, 'o'); k('B', 7.95, L.kneelBlock, 'o'); k('B', 8.12, L.kneelBlock, 'lin', { y: -0.5 });
  clash(8.1, true);
  for (let t = 8.25; t < 8.7; t += 0.11) { const s_ = Math.sin(t * 40) * 0.5 + 0.5;
    k('A', t, L.bind, 'io', { chest: [22 + 8 * s_, 10, 0], y: -0.3 - 0.06 * s_ }); k('B', t, L.kneelBlock, 'io', { chest: [-8 + 6 * (1 - s_), 0, 0], y: -0.5 }); }
  k('A', 8.85, L.hitBack, 'o'); k('A', 9.1, G, 'io'); at('A', 8.7, -0.6, 0.15); at('A', 9.05, -1.9, 0.5, 'o');
  k('B', 8.85, L.upper, 'o'); k('B', 9.05, G, 'io');
  // ---------- B uppercut (held wind-up) meets A's late parry; A is knocked back
  k('B', 9.15, L.upperW, 'o'); k('B', 9.32, L.upperW, 'lin', { y: -0.6 }); k('B', 9.5, L.upper, 'i'); k('B', 9.8, G, 'io');
  k('A', 9.3, G); k('A', 9.45, L.parryL, 'o'); clash(9.5, true);
  k('A', 9.6, L.hitBack, 'o'); k('A', 9.95, G, 'io'); at('A', 9.5, -1.9, 0.5); at('A', 9.95, -3.4, 0.9, 'o');
  // ---------- hold beat, then the final cross on a flash
  const fa = [-3.4, 0.9], fb = evalPos(P.B, 9.9);
  at('A', 10.6, fa[0], fa[1]); at('B', 10.6, fb[0], fb[1]);
  k('A', 10.25, L.flick, 'io'); k('A', 10.55, G, 'io'); BR.A.push([10.0, 10.6]); BR.B.push([10.0, 10.6]);
  const mx = (fa[0] + fb[0]) / 2, mz = (fa[1] + fb[1]) / 2, dx = fb[0] - fa[0], dz = fb[1] - fa[1], dd = Math.hypot(dx, dz), ux = dx / dd, uz = dz / dd, px = -uz, pz = ux;
  export_cross.mid = [mx, mz]; export_cross.u = [ux, uz]; export_cross.p = [px, pz];
  const yA = Math.atan2(ux, uz) * 180 / Math.PI, yB = yA + 180, lockA = { yawAbs: yA, yawOff: 0 }, lockB = { yawAbs: yB, yawOff: 0 };
  k('A', 10.65, L.crouch, 'o', { rArm: [20, 0, -12], rElbow: [-30, 0, 0] }); k('B', 10.65, L.crouch, 'o');
  RUN.A.push([10.75, 11.15]); RUN.B.push([10.78, 11.15]);
  at('A', 10.75, fa[0], fa[1]); at('A', 11.3, mx - px * 0.45, mz - pz * 0.45, 'lin'); at('A', 11.7, mx + ux * 3.6 - px * 0.5, mz + uz * 3.6 - pz * 0.5, 'o');
  at('B', 10.78, fb[0], fb[1]); at('B', 11.3, mx + px * 0.45, mz + pz * 0.45, 'lin'); at('B', 11.65, mx - ux * 3.0 + px * 0.5, mz - uz * 3.0 + pz * 0.5, 'o');
  k('A', 11.0, L.guard, 'lin', lockA); k('A', 11.18, L.windR, 'o', lockA); k('A', 11.3, L.slashR, 'i', lockA);
  k('A', 11.7, L.slide, 'o', { ...lockA, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], waist: [24, -40, 0], chest: [8, -50, 0], head: [-14, 40, 0] });
  k('A', 12.3, L.slide, 'lin', { ...lockA, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], waist: [24, -40, 0], chest: [8, -50, 0], head: [-14, 40, 0] });
  k('A', 12.65, L.relaxed, 'io', lockA); k('A', 12.85, L.flick, 'o', lockA); k('A', 13.2, L.relaxed, 'io', { ...lockA, head: [6, -30, 0] });
  k('B', 11.0, L.guard, 'lin', lockB); k('B', 11.15, L.windO, 'o', lockB); k('B', 11.3, L.slashO, 'i', lockB);
  k('B', 11.65, L.slashO, 'o', { ...lockB, y: -0.4 }); k('B', 11.95, L.slashO, 'lin', { ...lockB, y: -0.42 });
  k('B', 12.15, L.knees, 'i', lockB); k('B', 12.35, L.knees, 'lin', lockB); k('B', 12.7, L.fallen, 'i', lockB);
  clash(11.3, true, 'cross');
  BR.A.push([12.9, 14.0]);
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
export const export_cross = {};
export function events() { return { steps: STEPS.map(s => [+s.t.toFixed(3), s.kind, +(s.sp || 0).toFixed(2), s.c, s.foot, s.run ? 1 : 0]), slides: SLIDES, ghits: GHITS.map(g => +g.t.toFixed(3)), clashes: CONT.map(c => [c.t, c.big, c.kind]), swings: SWINGS() }; }

// clash corrections (IK-lite): solved in fight.js so the two blades physically cross at each clash time
export const CORR = { A: [], B: [] };
function corrW(d) { if (d < -0.26 || d > 0.3) return 0; return d < 0 ? E.io((d + 0.26) / 0.26) : 1 - E.io(d / 0.3); }
function rootXZ(c, t) { return evalPos(P[c], t); }
function basePose(c, t) {
  const p = evalKeys(T[c], t); const [x, z] = rootXZ(c, t);
  for (const e of CORR[c]) { const w = corrW(t - e.t); if (!w) continue;
    p.rArm[0] += e.ax * w; p.rArm[2] += e.az * w; p.rElbow[0] += e.el * w; p.chest[1] += e.ch * w;
    if (e.wr || e.ba) { p.bda = [p.bda[0] + e.wr * w, p.bda[1] + (e.ba || 0) * w]; } p._fw = (p._fw || 0) + (e.fw || 0) * w; }
  for (const [t0, t1] of RUN[c]) if (t >= t0 && t <= t1) {
    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]); const phi = d / STRIDE;
    const blend = clamp(Math.min((t - t0) / 0.08, (t1 - t) / 0.1));
    const r = runArms(phi, runBody(phi, cp(p)), t < t1 - 0.25);
    Object.assign(p, mix(p, r, blend));
  }
  // breathing (bigger after exertion)
  let amp = 1; for (const [t0, t1] of BR[c]) if (t >= t0 && t <= t1) amp = 2.6;
  const ph = c === 'A' ? 0 : 1.7;
  p.chest[0] += 1.4 * amp * Math.sin(t * 3.1 + ph); p.head[0] -= 1.2 * amp * Math.sin(t * 3.1 + ph + 0.4); p.y += 0.008 * amp * Math.sin(t * 3.1 + ph);
  const o = c === 'A' ? 'B' : 'A', [ox, oz] = rootXZ(o, t);
  const yaw = p.yawAbs != null ? p.yawAbs : Math.atan2(ox - x, oz - z) * 180 / Math.PI;
  let X = x, Z = z;
  if (p._fw) { const dd = Math.hypot(ox - x, oz - z) || 1; X += (ox - x) / dd * p._fw; Z += (oz - z) / dd * p._fw; }   // clash step-in
  p.pos = [X, p.y, Z]; p.yaw = yaw + p.yawOff; p.bd = bdv(...p.bda);
  return p;
}

// ------------------------------------------------------------------ simulation: collision + footstep planner (240 Hz, precomputed)
export const STYLE = { on: true, footW: 2.8, footWk: 1.2, stagger: 1.4, leanK: 0.7, leanBase: 7, twistBend: 0.2, elbow: 14, sink: 0.1 };
export function setStyle(o) { Object.assign(STYLE, o); }
const HZ = 240; const SIM = { A: null, B: null }; export const STEPS = [];   // {c, t, foot, p:[x,0,z], kind:'step'|'land'|'skid'|'lift', sp}
export const SLIDES = { A: [[5.1, 5.7], [11.32, 11.72]], B: [[11.32, 11.62]] };
const inWin = (L, t) => L.some(([a, b]) => t >= a && t <= b);
const _eu = new THREE.Euler(), _v1 = new THREE.Vector3();
function legFK(leg, knee, hipX, plain) {   // desired sole offset in the body frame (px) from the authored FK leg angles
  _eu.set(leg[0] * Math.PI / 180, leg[1] * Math.PI / 180, leg[2] * Math.PI / 180, 'XYZ'); const R1 = new THREE.Quaternion().setFromEuler(_eu);
  _eu.set(knee[0] * Math.PI / 180, 0, 0, 'XYZ'); const R2 = new THREE.Quaternion().setFromEuler(_eu);
  _v1.set(0, -6, 0).applyQuaternion(R2).add(new THREE.Vector3(0, -6, 0)).applyQuaternion(R1);
  const sx = hipX + _v1.x * 1.25; return plain ? [Math.sign(hipX) * Math.max(1.6, Math.abs(sx)), _v1.z * 1.2] : [Math.sign(hipX) * Math.max(STYLE.footW, Math.abs(sx) * STYLE.footWk), _v1.z * STYLE.stagger];
}
function isAir(p) { return p.y > 0.22 || Math.abs(p.tilt[0]) > 30; }
function runGait(c, root, rawXZ, N) {
  // returns per-index overrides { r:[x,y,z]|undefined, l:..., yoff } inside run windows, plus contact events
  const g = { r: new Array(N), l: new Array(N), yoff: new Float32Array(N), ev: [] };
  for (const [t0, t1] of RUN[c]) {
    const i0 = Math.round(t0 * HZ), i1 = Math.min(N - 1, Math.round(t1 * HZ)), a = rawXZ[i0];
    const phiAt = i => Math.hypot(rawXZ[i][0] - a[0], rawXZ[i][1] - a[1]) / STRIDE;
    const con = [];                                   // contacts in time order: {i, f, p}
    for (let i = i0 + 1; i <= i1; i++) {
      const p0 = phiAt(i - 1), p1 = phiAt(i);
      for (const [f, off] of [['r', 0.25], ['l', 0.75]]) if (Math.floor(p0 - off) < Math.floor(p1 - off)) {
        const vx = root[i][0] - root[Math.max(i0, i - 6)][0], vz = root[i][1] - root[Math.max(i0, i - 6)][1], vn = Math.hypot(vx, vz) || 1;
        const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1;            // right foot on the right of travel: right = (-fz, fx)
        con.push({ i, f, p: [root[i][0] + fx * 0.2 + fz * 0.13 * side, root[i][1] + fz * 0.2 - fx * 0.13 * side] });
      }
    }
    for (const f of ['r', 'l']) {
      const cs = con.filter(q => q.f === f);
      for (let k = 0; k < cs.length; k++) {
        const cur = cs[k], nxt = cs[k + 1], prevAll = con.indexOf(cur), stepLen = nxt ? nxt.i - cur.i : 60, stance = Math.round(stepLen * 0.22);
        for (let i = cur.i; i < (nxt ? nxt.i : Math.min(i1 + 1, cur.i + stance + 1)); i++) {
          if (i - cur.i <= stance || !nxt) g[f][i] = [cur.p[0], 0, cur.p[1]];
          else { const u = (i - cur.i - stance) / (nxt.i - cur.i - stance), w = u * u * (3 - 2 * u);
            g[f][i] = [lerp(cur.p[0], nxt.p[0], w), 0.3 * Math.sin(Math.PI * u) * (1 - 0.3 * u), lerp(cur.p[1], nxt.p[1], w)]; }
        }
        g.ev.push({ t: cur.i / HZ, f, p: cur.p });
      }
      // before this foot's first contact: it swings from wherever it was (filled in by the planner at window entry)
      if (cs.length) for (let i = i0; i < cs[0].i; i++) g[f][i] = { swingTo: cs[0].p, from: i0, to: cs[0].i };
    }
    // body bob: lowest at mid-stance, highest in flight, phase from the step sequence
    for (let k = 0; k < con.length; k++) { const a_ = con[k].i, b_ = k + 1 < con.length ? con[k + 1].i : Math.min(i1, a_ + 60);
      for (let i = a_; i < b_; i++) { const u = (i - a_) / Math.max(1, b_ - a_); g.yoff[i] = -0.05 * Math.cos(2 * Math.PI * (u - 0.25)) - 0.01; } }
  }
  return g;
}
function simulate() {
  const N = Math.ceil(TOTAL * HZ) + 2, raw = { A: [], B: [] }, push = { A: [], B: [] };
  for (let i = 0; i < N; i++) { const t = i / HZ; for (const c of ['A', 'B']) raw[c].push(basePose(c, t)); }
  // collision: bodies are 0.32-block capsules; posts and walls come from the arena heightmap
  for (let i = 0; i < N; i++) {
    const a = raw.A[i].pos, b = raw.B[i].pos, dx = a[0] - b[0], dz = a[2] - b[2], d = Math.hypot(dx, dz) || 1e-3, pen = 0.64 - d;
    const pa = [0, 0], pb = [0, 0];
    if (pen > 0) { pa[0] += dx / d * pen / 2; pa[1] += dz / d * pen / 2; pb[0] -= dx / d * pen / 2; pb[1] -= dz / d * pen / 2; }
    for (const [P_, pp] of [[a, pa], [b, pb]]) for (let k = 0; k < 12; k++) {
      const th = k / 12 * Math.PI * 2, x = P_[0] + Math.cos(th) * 0.34, z = P_[2] + Math.sin(th) * 0.34;
      if (W.floorAt(x, z) > F + 0.6) { pp[0] -= Math.cos(th) * 0.05; pp[1] -= Math.sin(th) * 0.05; }
    }
    push.A.push(pa); push.B.push(pb);
  }
  const R = Math.round(0.06 * HZ);
  for (const c of ['A', 'B']) {
    const sm = push[c].map((_, i) => { let x = 0, z = 0, w = 0; for (let j = -R; j <= R; j++) { const q = push[c][Math.min(N - 1, Math.max(0, i + j))], g = Math.exp(-(j * j) / (2 * (R / 2) ** 2)); x += q[0] * g; z += q[1] * g; w += g; } return [x / w * 1.15, z / w * 1.15]; });
    const root = raw[c].map((p, i) => [p.pos[0] + sm[i][0], p.pos[2] + sm[i][1]]);
    const feet = { r: null, l: null }, step = { r: null, l: null }, outs = { r: [], l: [] }, Dsm = { r: null, l: null }, lastStep = { r: -9, l: -9 };
    const rawXZ = raw[c].map(p => [p.pos[0], p.pos[2]]), G = runGait(c, root, rawXZ, N), entry = {};
    for (const e of G.ev) STEPS.push({ c, t: e.t, foot: e.f, p: [e.p[0], 0, e.p[1]], kind: 'step', sp: 5, run: true });
    for (let i = 0; i < N; i++) {
      const t = i / HZ, p = raw[c][i], air = isAir(p), yaw = p.yaw * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
      const vx = i > 0 ? (root[i][0] - root[i - 1][0]) * HZ : 0, vz = i > 0 ? (root[i][1] - root[i - 1][1]) * HZ : 0, sp = Math.hypot(vx, vz);
      const skid = inWin(SLIDES[c], t);
      for (const [f, leg, knee, hx] of [['r', p.rLeg, p.rKnee, -2], ['l', p.lLeg, p.lKnee, 2]]) {
        const out = outs[f], gv = G[f][i];
        if (gv !== undefined && !air) {
          if (Array.isArray(gv)) { out.push(gv); if (gv[1] === 0) feet[f] = [gv[0], gv[2]]; step[f] = null; continue; }
          if (!entry[f + gv.from]) entry[f + gv.from] = feet[f] ? feet[f].slice() : [root[i][0], root[i][1]];
          const fr = entry[f + gv.from], u = (i - gv.from) / Math.max(1, gv.to - gv.from), w = u * u * (3 - 2 * u);
          out.push([lerp(fr[0], gv.swingTo[0], w), 0.26 * Math.sin(Math.PI * u), lerp(fr[1], gv.swingTo[1], w)]); step[f] = null; continue;
        }
        const fk = air || (f === 'r' && p.fkR) || (f === 'l' && p.fkL);
        const off = legFK(leg, knee, hx, skid || t > 11.25), lx = off[0] / 16, lz = off[1] / 16;
        const Dr = [root[i][0] + lx * cy + lz * sy, root[i][1] - lx * sy + lz * cy];
        Dsm[f] = Dsm[f] ? [lerp(Dsm[f][0], Dr[0], 1), lerp(Dsm[f][1], Dr[1], 1)] : Dr.slice(); const D = Dsm[f];   // ~0.1 s low-pass
        if (fk) { if (feet[f]) STEPS.push({ c, t, foot: f, p: [feet[f][0], 0, feet[f][1]], kind: 'lift' }); feet[f] = null; step[f] = null; out.push(null); continue; }
        if (!feet[f]) { feet[f] = D.slice(); STEPS.push({ c, t, foot: f, p: [D[0], 0, D[1]], kind: 'land', sp }); }
        if (skid) { feet[f] = [lerp(feet[f][0], D[0], 0.25), lerp(feet[f][1], D[1], 0.25)]; step[f] = null; if (i % 60 === 0) STEPS.push({ c, t, foot: f, p: [feet[f][0], 0, feet[f][1]], kind: 'skid' }); out.push([feet[f][0], 0, feet[f][1]]); continue; }
        const o = f === 'r' ? 'l' : 'r';
        if (step[f]) {
          const s_ = step[f], u = Math.min(1, (t - s_.t0) / s_.dur), w = u * u * (3 - 2 * u);
          s_.to = [lerp(s_.to[0], D[0] + vx * (s_.dur * (1 - u)) * 0.6, 0.15), lerp(s_.to[1], D[1] + vz * (s_.dur * (1 - u)) * 0.6, 0.15)];
          const x = lerp(s_.from[0], s_.to[0], w), z = lerp(s_.from[1], s_.to[1], w), y = s_.h * Math.sin(Math.PI * u);
          if (u >= 1) { feet[f] = s_.to.slice(); step[f] = null; lastStep[f] = t; STEPS.push({ c, t, foot: f, p: [x, 0, z], kind: 'step', sp }); out.push([x, 0, z]); }
          else out.push([x, y, z]);
          continue;
        }
        const pred = [D[0] + vx * 0.07, D[1] + vz * 0.07], err = Math.hypot(feet[f][0] - pred[0], feet[f][1] - pred[1]);
        const reach = Math.hypot(feet[f][0] - root[i][0], feet[f][1] - root[i][1]);
        const otherBusy = step[o] && reach < 0.5 && (sp < 2.5 || (t - step[o].t0) / step[o].dur < 0.4);
        const errO = feet[o] ? Math.hypot(feet[o][0] - D[0], feet[o][1] - D[1]) : 0;
        const rested = t - lastStep[f] > 0.18 && t - lastStep[o] > 0.08;
        if ((err > 0.17 && rested && !otherBusy && !(step[o] == null && feet[o] && errO > err * 1.4 && reach < 0.5)) || (reach > 0.5 && !step[f] && t - lastStep[f] > 0.06)) {
          const run = sp > 2.5, dur = run ? Math.max(0.12, Math.min(0.18, 0.75 / sp)) : Math.min(0.26, Math.max(0.15, 0.1 + 0.12 * err));
          step[f] = { from: feet[f].slice(), to: [D[0] + vx * dur * 0.6, D[1] + vz * dur * 0.6], t0: t, dur, h: run ? 0.2 : Math.min(0.2, 0.05 + 0.2 * err) };
        }
        out.push([feet[f][0], 0, feet[f][1]]);
      }
    }
    const forced = i => inWin(RUN[c], i / HZ) || inWin(SLIDES[c], i / HZ) || isAir(raw[c][i]);
    const swing = i => (outs.r[i] && outs.r[i][1] > 0.004) || (outs.l[i] && outs.l[i][1] > 0.004);
    const wt = new Float32Array(N); for (let i = 0; i < N; i++) wt[i] = forced(i) || swing(i) ? 1 : 0.08;
    const bounds = [0];
    for (let i = 1; i < N; i++) if (forced(i) !== forced(i - 1) || (swing(i - 1) && !swing(i) && !forced(i))) bounds.push(i);
    bounds.push(N - 1);
    const root2 = root.map(q => q.slice());
    for (let k = 0; k + 1 < bounds.length; k++) {
      const a = bounds[k], b = bounds[k + 1]; if (b - a < 2 || forced(a)) continue;
      let tot = 0; for (let i = a; i < b; i++) tot += wt[i]; let acc = 0;
      for (let i = a; i <= b; i++) { const tau = a + (b - a) * (tot > 0 ? acc / tot : (i - a) / (b - a)), j = Math.floor(tau), u = tau - j, j1 = Math.min(N - 1, j + 1);
        root2[i] = [lerp(root[j][0], root[j1][0], u), lerp(root[j][1], root[j1][1], u)]; if (i < b) acc += wt[i]; }
    }
    SIM[c] = { root: root2, raw: rawXZ, r: outs.r, l: outs.l, yoff: Array.from(G.yoff, v => [v]) };
  }
}
function samp(arr, t) {
  const x = t * HZ, i = Math.max(0, Math.min(arr.length - 2, Math.floor(x))), u = x - i, a = arr[i], b = arr[i + 1];
  if (!a || !b) return a || b; return a.map((v, k) => v + (b[k] - v) * u);
}
// successive breaking: hips lead, the arm chain trails by 1-2 frames, the head drags
const LAG = { waist: 0.03, chest: 0.015, lArm: -0.012, rElbow: -0.02, lElbow: -0.03, head: -0.035 };
export function pose(c, t) {
  if (c === 'C') { const p = N(); p.pos = [0, -200, 0]; return p; }
  const p = basePose(c, t), k0 = evalKeys(T[c], t);
  for (const j in LAG) { const q = evalKeys(T[c], t + LAG[j]); p[j] = p[j].map((v, i) => v + (q[j][i] - k0[j][i])); }
  { let se = 0, sa = 0, sw = 0; for (const [dt, w] of [[-0.1, 0.06], [-0.083, 0.1], [-0.067, 0.14], [-0.05, 0.17], [-0.033, 0.18], [-0.017, 0.15], [0, 0.12], [0.017, 0.08]]) { const q = evalKeys(T[c], t + dt); se += q.bda[0] * w; sa += q.bda[1] * w; sw += w; }
    p.bda = [p.bda[0] + se / sw - k0.bda[0], p.bda[1] + sa / sw - k0.bda[1]]; }
  p.bd = bdv(...p.bda);
  const S_ = SIM[c], rt = samp(S_.root, t), rw = samp(S_.raw, t), X = rt[0] + p.pos[0] - rw[0], Z = rt[1] + p.pos[2] - rw[1], g = W.floorAt(X, Z);
  p.pos = [X, g + (isAir(p) ? p.y : p.y * 0.8) + samp(S_.yoff, t)[0], Z];
  { const o = c === 'A' ? 'B' : 'A', ro = samp(SIM[o].root, t); p.opp = [ro[0], W.floorAt(ro[0], ro[1]), ro[1]]; }
  if (STYLE.on) {
    const run = inWin(RUN[c], t) || inWin(SLIDES[c], t) || t > 11.25, air = isAir(p), k = run || air ? 0.35 : 1, cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const w0 = p.waist[0];
    p.waist[0] = cl(p.waist[0] * (1 + STYLE.leanK * k) + (run || air ? 0 : STYLE.leanBase), -70, 72);       // commit the torso into the action
    p.chest[0] = cl(p.chest[0] * (1 + 0.45 * k), -50, 60);
    p.waist[2] = p.waist[2] * (1 + 0.9 * k) + STYLE.twistBend * k * p.chest[1];                          // twist couples into side bend
    p.chest[2] = p.chest[2] * (1 + 0.6 * k) + 0.6 * STYLE.twistBend * k * p.chest[1];
    p.head[0] -= 0.55 * (p.waist[0] - w0);                                                              // eyes stay on the opponent
    p.rElbow[0] -= STYLE.elbow * k; p.lElbow[0] -= STYLE.elbow * 1.8 * k;                               // loaded, bent arms
    if (!run && p.lArm[0] > -35) { p.lArm[0] -= 28 * k; p.lArm[2] += 12 * k; }                            // off-hand up for balance
    if (!run && !air) p.pos[1] -= STYLE.sink;                                                           // lower centre of gravity -> knees bend (IK)
  }
  const fr = samp(S_.r, t), fl = samp(S_.l, t);
  { const sw = f => f && f[1] > 0.004 ? Math.min(1, f[1] / 0.08) : 0, rs = sw(fr), ls = sw(fl);
    // weight shift: swinging right foot -> hips over the left (stance) foot, spine bends back to keep the head centred
    const shift = ls - rs; p.waist[2] += 5 * shift; p.chest[2] -= 3.5 * shift; p.head[2] -= 2 * shift;
    // pelvis rotates with the swinging leg, shoulders counter-rotate (contralateral gait), head holds its aim
    const twist = 7 * (rs - ls); p.waist[1] += twist; p.chest[1] -= twist * 1.4; p.head[1] -= (p.waist[1] + p.chest[1]) * 0.35 * Math.max(rs, ls); }
  // breathing in the ribcage (not the hips): chest pitch + small shoulder rise
  { const ph = c === 'A' ? 0 : 1.7, amp = inWin(BR[c], t) ? 2.4 : 1; p.chest[0] -= 1.1 * amp * Math.sin(t * 3.1 + ph); }
  if (fr || fl) { p.ik = {}; for (const [k, f] of [['r', fr], ['l', fl]]) if (f) p.ik[k] = [f[0], W.floorAt(f[0], f[2]) + f[1] + 0.035, f[2]];
    // pelvis drop: lower the hips until every planted foot is within leg reach (wide stances sit low, nothing floats)
    const yaw = p.yaw * Math.PI / 180, hipY = p.pos[1] + 0.75; let drop = 0;
    for (const [k, hx] of [['r', -2 / 16], ['l', 2 / 16]]) { const tg = p.ik[k]; if (!tg) continue;
      const hxw = p.pos[0] + hx * Math.cos(yaw), hzw = p.pos[2] - hx * Math.sin(yaw), dh = Math.hypot(tg[0] - hxw, tg[2] - hzw), reach = 0.735;
      if (dh < reach) { const need = hipY - tg[1] - Math.sqrt(reach * reach - dh * dh); if (need > drop) drop = need; } else drop = Math.max(drop, hipY - tg[1]); }
    p.pos[1] -= Math.min(0.55, drop); }
  return p;
}

// ------------------------------------------------------------------ contacts (set by fight.js from the real blade geometry)
let CONT = [];
export function setContacts(c) { CONT = c; }
let GHITS = []; export function setGroundHits(g) { GHITS = g; }
const BIG = () => CONT.filter(c => c.big && c.kind === 'blade');

// ------------------------------------------------------------------ shots
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const INS = [4.65, 8.1, 9.5];
const FLASH = 11.3;
const SHOTS = [
  [0.0, 'estLock'], [1.4, 'raiseB'], [1.9, 'chargeSide'], [2.48, 'slamB'], [2.95, 'exchange'], [3.7, 'duckLow'], [4.35, 'twoShotLow'],
  [4.65, 'ins'], [4.75, 'wideKick'], [5.85, 'holdBeat'], [6.75, 'runA'], [7.5, 'leapLow2'], [8.1, 'ins'], [8.2, 'bindFaces'],
  [8.85, 'pushWide'], [9.5, 'ins'], [9.6, 'knockWide'], [10.0, 'holdBeat'], [10.7, 'chargeSide'], [FLASH, 'flash'],
  [FLASH + 3 * DT, 'hero'], [12.0, 'fallClose'], [12.9, 'endLock'],
];
export function shotAt(t) { let i = 0; for (let j = 0; j < SHOTS.length; j++) if (t >= SHOTS[j][0] - 1e-6) i = j; return { i, t0: SHOTS[i][0], t1: (SHOTS[i + 1] || [TOTAL])[0], label: SHOTS[i][1] }; }
const insIndex = t => INS.findIndex(t0 => t >= t0 - 1e-6 && t < t0 + 3 * DT - 1e-6);
export function blurOK(t) { const l = shotAt(t).label; return l !== 'ins' && l !== 'flash'; }
export function trailGate(c, t) { return shotAt(t).label === 'ins' ? 0 : 1; }

function shake(t) {
  let a = 0; for (const c of CONT) { const d = t - c.t; const amp = c.kind === 'slam' ? 0.16 : c.big ? 0.1 : c.kind === 'kick' ? 0.07 : 0.035; if (d >= 0 && d < 0.32) a = Math.max(a, amp * Math.pow(1 - d / 0.32, 2)); }
  return v3(a * Math.sin(t * 93), a * Math.cos(t * 71), a * Math.sin(t * 57));
}
export function camera(t, cast) {
  const S = shotAt(t), lt = t - S.t0, u = clamp(lt / Math.max(0.01, S.t1 - S.t0));
  const pa = pose('A', t), pb = pose('B', t), A = v3(...pa.pos), B = v3(...pb.pos), mid = A.clone().lerp(B, 0.5);
  const ab = B.clone().sub(A).setY(0); if (ab.length() < 1e-3) ab.set(1, 0, 0); ab.normalize();
  const side = v3(-ab.z, 0, ab.x);                          // perpendicular to the fighting line
  const fA = v3(Math.sin(pa.yaw * Math.PI / 180), 0, Math.cos(pa.yaw * Math.PI / 180)), fB = v3(Math.sin(pb.yaw * Math.PI / 180), 0, Math.cos(pb.yaw * Math.PI / 180));
  const up = y => v3(0, y, 0);
  let pos, look, fov = 40, roll = 0;
  const at0 = c_ => v3(...pose(c_, S.t0 + 0.01).pos);
  switch (S.label) {
    case 'estLock': { const a0 = at0('A'), b0 = at0('B'), m0 = a0.clone().lerp(b0, 0.5); pos = m0.clone().add(side.clone().multiplyScalar(9.5)).add(up(1.9)); look = m0.clone().add(up(1.0)); fov = 36; break; }
    case 'holdBeat': { const a0 = at0('A'), b0 = at0('B'), m0 = a0.clone().lerp(b0, 0.5); pos = m0.clone().add(side.clone().multiplyScalar(6.2)).add(ab.clone().multiplyScalar(-0.8)).add(up(1.3)); look = m0.clone().add(up(1.15)); fov = 38; break; }
    case 'endLock': { const a0 = at0('A'), b0 = at0('B'), m0 = a0.clone().lerp(b0, 0.5); pos = m0.clone().add(side.clone().multiplyScalar(8.5)).add(up(2.6)); look = m0.clone().add(up(0.8)); fov = 38; break; }
    case 'raiseB': pos = B.clone().add(fB.clone().multiplyScalar(3.2)).add(side.clone().multiplyScalar(1.4)).add(up(0.6)); look = B.clone().add(up(1.9)); fov = 40; break;
    case 'slamB': pos = B.clone().add(up(5.5)).add(side.clone().multiplyScalar(3.0)).add(ab.clone().multiplyScalar(1.6)); look = B.clone().add(up(0.3)).add(fB.clone().multiplyScalar(1.0)); fov = 46; break;
    case 'exchange': pos = mid.clone().add(side.clone().multiplyScalar(3.6)).add(ab.clone().multiplyScalar(-0.5)).add(up(1.45)); look = mid.clone().add(up(1.3)); fov = 42; break;
    case 'duckLow': pos = mid.clone().add(side.clone().multiplyScalar(3.4)).add(up(0.45)); look = mid.clone().add(up(1.25)); fov = 48; break;
    case 'twoShotLow': pos = mid.clone().add(side.clone().multiplyScalar(3.0)).add(ab.clone().multiplyScalar(-1.0)).add(up(0.9)); look = mid.clone().lerp(B, 0.3).add(up(1.4)); fov = 44; break;
    case 'leapLow2': { const a0 = at0('A'); pos = a0.clone().add(side.clone().multiplyScalar(3.2)).add(ab.clone().multiplyScalar(1.6)).add(up(0.35)); look = A.clone().add(up(1.4)); fov = 52; break; }
    case 'est': pos = v3(-3 + 2 * u, F + 13 - 2.5 * u, -19 + 3 * E.io(u)); look = v3(0, F + 1.2, 0); fov = 46 - 6 * u; break;
    case 'faceA': pos = A.clone().add(fA.clone().multiplyScalar(1.35 - 0.2 * u)).add(side.clone().multiplyScalar(0.3)).add(up(1.75)); look = A.clone().add(up(1.68)); fov = 30; break;
    case 'drawB': pos = B.clone().add(fB.clone().multiplyScalar(2.9)).add(side.clone().multiplyScalar(-1.2 + 0.3 * u)).add(up(1.45)); look = B.clone().add(up(1.25)); fov = 34; break;
    case 'otsA_far': pos = A.clone().add(fA.clone().multiplyScalar(-2.0)).add(side.clone().multiplyScalar(0.9)).add(up(1.95)); look = B.clone().add(up(1.2)); fov = 26 - 3 * u; break;
    case 'runA': pos = A.clone().add(side.clone().multiplyScalar(4.2)).add(fA.clone().multiplyScalar(0.9)).add(up(0.95)); look = A.clone().add(up(1.1)).add(fA.clone().multiplyScalar(0.8)); fov = 44; roll = -0.04; break;
    case 'runB': pos = B.clone().add(fB.clone().multiplyScalar(4.6 - 0.8 * u)).add(side.clone().multiplyScalar(-0.6)).add(up(0.7)); look = B.clone().add(up(1.25)); fov = 38; break;
    case 'converge': pos = mid.clone().add(side.clone().multiplyScalar(-6.0)).add(up(1.0)); look = mid.clone().add(up(1.5)); fov = 40 - 6 * u; break;
    case 'orbit1': { const a = (0.35 + 0.9 * u) * Math.PI / 2; pos = mid.clone().add(side.clone().multiplyScalar(Math.cos(a) * 3.7)).add(ab.clone().multiplyScalar(Math.sin(a) * 3.7)).add(up(1.6 - 0.4 * u)); look = mid.clone().add(up(1.45)); fov = 40; break; }
    case 'otsA': pos = A.clone().add(fA.clone().multiplyScalar(-1.9)).add(side.clone().multiplyScalar(0.95)).add(up(2.05)); look = B.clone().add(up(1.3)); fov = 42; break;
    case 'lowSpin': pos = A.clone().add(fA.clone().multiplyScalar(2.4)).add(side.clone().multiplyScalar(2.4)).add(up(0.45)); look = A.clone().add(up(1.4)); fov = 48; roll = 0.06; break;
    case 'wideKick': pos = mid.clone().add(side.clone().multiplyScalar(5.0)).add(up(1.3)); look = mid.clone().lerp(A, 0.45).add(up(1.1)); fov = 42; break;
    case 'kneelLow': pos = A.clone().add(fA.clone().multiplyScalar(-1.7)).add(side.clone().multiplyScalar(0.7)).add(up(0.85)); look = B.clone().add(up(1.7)); fov = 42; break;
    case 'shove': pos = mid.clone().add(side.clone().multiplyScalar(3.4)).add(up(1.5)); look = mid.clone().add(up(1.25)); fov = 46; break;
    case 'leapLow': { const a0 = v3(...pose('A', 9.2).pos); pos = a0.clone().add(side.clone().multiplyScalar(3.4)).add(ab.clone().multiplyScalar(2.6)).add(up(0.35)); look = A.clone().add(up(1.4)); fov = 52; roll = -0.05; break; }
    case 'slamHigh': pos = A.clone().add(up(7.6)).add(side.clone().multiplyScalar(3.2)).add(ab.clone().multiplyScalar(-2.4)); look = A.clone().add(up(0.4)).add(ab.clone().multiplyScalar(1.2)); fov = 46; break;
    case 'flurry': { const a = Math.PI * (0.15 + 1.0 * u); const c = mid; pos = c.clone().add(side.clone().multiplyScalar(Math.cos(a) * 3.5)).add(ab.clone().multiplyScalar(Math.sin(a) * 3.5)).add(up(1.45)); look = c.clone().add(up(1.4)); fov = 42; break; }
    case 'bindECU': { const c = v3(...(CONT.find(x => Math.abs(x.t - 11.62) < 0.01) || { p: mid.toArray() }).p); const cc = c.clone().add(up(-0.45)); pos = cc.clone().add(side.clone().multiplyScalar(1.7 - 0.2 * u)).add(up(0.2)); look = cc; fov = 34; roll = 0.04; break; }
    case 'bindFaces': pos = mid.clone().add(side.clone().multiplyScalar(3.2)).add(up(1.8)); look = mid.clone().add(up(1.55)); fov = 36 - 4 * u; break;
    case 'pushWide': pos = mid.clone().add(side.clone().multiplyScalar(5.4)).add(up(1.6)); look = mid.clone().add(up(1.2)); fov = 40; break;
    case 'whirlFront': pos = A.clone().add(fA.clone().multiplyScalar(-2.6)).add(side.clone().multiplyScalar(1.3)).add(up(1.05)); look = B.clone().add(up(1.3)); fov = 46; break;
    case 'whirlSide': pos = mid.clone().add(side.clone().multiplyScalar(3.9)).add(up(1.2)); look = mid.clone().add(up(1.3)); fov = 42; break;
    case 'jumpLow': pos = mid.clone().add(side.clone().multiplyScalar(3.3)).add(up(0.22)); look = mid.clone().add(up(1.7)); fov = 54; break;
    case 'knockWide': pos = mid.clone().add(side.clone().multiplyScalar(5.0)).add(up(1.4)); look = mid.clone().lerp(B, 0.55).add(up(1.2)); fov = 42; break;
    case 'breathA': pos = A.clone().add(fA.clone().multiplyScalar(2.8)).add(side.clone().multiplyScalar(1.3)).add(up(1.7)); look = A.clone().add(up(1.45)); fov = 34 - 3 * u; break;
    case 'breathB': pos = B.clone().add(fB.clone().multiplyScalar(2.8)).add(side.clone().multiplyScalar(-1.3)).add(up(1.7)); look = B.clone().add(up(1.45)); fov = 34 - 3 * u; break;
    case 'chargeSide': pos = mid.clone().add(side.clone().multiplyScalar(4.8)).add(up(0.8)); look = mid.clone().add(up(1.3)); fov = 40; break;
    case 'flash': pos = mid.clone().add(side.clone().multiplyScalar(6.4)).add(up(0.9)); look = mid.clone().add(up(1.3)); break;
    case 'hero': { const m = v3(export_cross.mid[0], F, export_cross.mid[1]), uu = v3(export_cross.u[0], 0, export_cross.u[1]), pp = v3(export_cross.p[0], 0, export_cross.p[1]);
      pos = m.clone().add(uu.clone().multiplyScalar(7.6 - 0.8 * E.io(u))).add(pp.clone().multiplyScalar(-2.6)).add(up(1.05)); look = m.clone().add(uu.clone().multiplyScalar(1.5)).add(up(1.55)); fov = 36; break; }
    case 'fallClose': pos = B.clone().add(fB.clone().multiplyScalar(3.8)).add(side.clone().multiplyScalar(1.2)).add(up(0.7)); look = B.clone().add(up(0.7)); fov = 36; break;
    case 'endWide': pos = mid.clone().add(side.clone().multiplyScalar(9 - 2 * u)).add(up(5.5 - 1.5 * u)); look = mid.clone().add(up(1.0)); fov = 40; break;
    case 'ins': { const ii = INS.findIndex(t0 => Math.abs(S.t0 - t0) < 1e-6); const c = CONT.find(x => Math.abs(x.t - INS[ii]) < 0.02) || { p: mid.toArray() };
      const cp_ = v3(...c.p); pos = cp_.clone().add(side.clone().multiplyScalar(ii % 2 ? -2.3 : 2.3)).add(ab.clone().multiplyScalar(0.5)).add(up(0.15)); look = cp_.clone().add(up(-0.25)); fov = 36 + 30 * lt; roll = ii % 2 ? 0.12 : -0.1; break; }
    default: pos = mid.clone().add(side.clone().multiplyScalar(6)).add(up(2)); look = mid.clone().add(up(1.2));
  }
  const hh = v3(0.035 * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 4.3), 0.025 * Math.sin(t * 2.3 + 1), 0.03 * Math.cos(t * 1.9));   // handheld drift
  const sh = shake(t).add(hh); pos.add(sh); look = look.clone().add(sh.clone().multiplyScalar(0.6));
  // never below the arena floor
  const fl = W.floorAt(pos.x, pos.z); if (pos.y < fl + 0.15) pos.y = fl + 0.15;
  return { pos, look, fov, roll, label: S.label };
}

// ------------------------------------------------------------------ effects
const h = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
const HOT = [2.6, 1.6, 0.6];
function burst(list, t, t0, p, n, seed, power = 1) {
  const d = t - t0; if (d < 0 || d > 0.8) return;
  for (let i = 0; i < n; i++) { const life = 0.25 + 0.4 * h(i, seed); if (d > life) continue;
    const th = h(i, seed + 1) * Math.PI * 2, ph = (h(i, seed + 2) - 0.35) * Math.PI * 0.9, sp = (4 + 9 * h(i, seed + 3)) * power;
    const v = [Math.cos(th) * Math.cos(ph) * sp, Math.sin(ph) * sp + 1.5, Math.sin(th) * Math.cos(ph) * sp];
    const fl = W.floorAt(p[0], p[2]); let y = p[1] + v[1] * d - 6 * d * d; if (y < fl) y = fl + 0.02;
    list.push({ p: [p[0] + v[0] * d, y, p[2] + v[2] * d], c: HOT, s: 0.02 + 0.03 * h(i, seed + 4), a: (1 - d / life) * 1.2 }); }
}
function puff(list, t, t0, p, n, seed, spread = 0.7, rise = 0.6, col = [0.9, 0.8, 0.62], life = 1.1) {
  const d = t - t0; if (d < 0 || d > life) return; const u = d / life;
  for (let i = 0; i < n; i++) { const th = h(i, seed) * Math.PI * 2, r = (0.15 + spread * h(i, seed + 1)) * E.o(Math.min(1, d / 0.5));
    list.push({ p: [p[0] + Math.cos(th) * r, p[1] + 0.05 + rise * d * (0.3 + h(i, seed + 2)), p[2] + Math.sin(th) * r], c: col, s: 0.28 + 0.6 * u, a: 0.5 * (1 - u) }); }
}
export function effects(t, cam) {
  const add = [], soft = [], flares = [], rings = [], debris = []; let flash = 0, black = 0, ca = 0, impact = 0, bloomBoost = 0; const sparkLight = { i: 0, p: [0, 0, 0] };
  // desert air: drifting sand motes + low wind-blown dust near the floor (Desert Arena)
  const cx = cam.position.x, cz = cam.position.z;
  for (let i = 0; i < 900; i++) {
    const x = ((h(i, 1) * 30 + 1.4 * t + 0.3 * Math.sin(t * 0.9 + i)) % 30 + 30) % 30 - 15 + cx, z = ((h(i, 2) * 30 + 0.4 * t) % 30 + 30) % 30 - 15 + cz;
    const y = F + 0.2 + ((h(i, 4) * 6 + 0.15 * t * (0.5 + h(i, 6)) + 0.2 * Math.sin(t * 1.3 + i)) % 6 + 6) % 6;
    soft.push({ p: [x, y, z], c: [1.0, 0.9, 0.72], s: 0.018 + 0.025 * h(i, 5), a: 0.55 });
  }
  // ground contact: every planted step puffs sand (size from speed), landings and skids throw more
  for (const st of STEPS) {
    const d = t - st.t; if (d < 0 || d > 1.0) continue;
    const g = W.floorAt(st.p[0], st.p[2]), q = [st.p[0], g, st.p[2]], seed = Math.round(st.t * 977) + (st.foot === 'r' ? 3 : 7);
    if (st.kind === 'step') puff(soft, t, st.t, q, (st.sp || 0) > 2.5 ? 7 : 4, seed, (st.sp || 0) > 2.5 ? 0.4 : 0.25, 0.25, [0.9, 0.8, 0.62], 0.75);
    else if (st.kind === 'land') puff(soft, t, st.t, q, 12, seed, 0.6, 0.35, [0.9, 0.8, 0.62], 1.0);
    else if (st.kind === 'skid') puff(soft, t, st.t, q, 6, seed, 0.45, 0.45, [0.9, 0.8, 0.62], 0.9);
  }
  // per-contact effects
  for (const c of CONT) {
    const d = t - c.t, p = c.p; if (d < -0.05 || d > 1.6) continue;
    if (c.kind === 'blade' || c.kind === 'cross') {
      burst(add, t, c.t, p, c.big ? 90 : 45, Math.round(c.t * 100), c.big ? 1.25 : 0.9);
      if (d >= 0 && d < (c.big ? 0.22 : 0.12)) { const u = d / (c.big ? 0.22 : 0.12), ins = shotAt(t).label === 'ins' ? 0.22 : 1; flares.push({ p, s: (c.big ? 1.5 : 0.75) * (1 - 0.5 * u) * ins, a: (1 - u) * (ins < 1 ? 0.8 : 1), rot: c.t * 3 }); sparkLight.i = Math.max(sparkLight.i, (c.big ? 9 : 4) * (1 - u)); sparkLight.p = p; }
      
    }
    if (c.kind === 'kick') { puff(soft, t, c.t, p, 10, 77, 0.5, 0.2); }
    if (c.kind === 'slam') {
      const g = W.floorAt(p[0], p[2]), q = [p[0], g, p[2]];
      burst(add, t, c.t, [p[0], g + 0.1, p[2]], 60, 91, 1.1); puff(soft, t, c.t, q, 28, 93, 2.6, 0.9, [0.85, 0.8, 0.7], 1.5);
      
      if (d >= 0 && d < 0.18) { flares.push({ p: [p[0], g + 0.2, p[2]], s: 1.8 * (1 - d / 0.18), a: 1 - d / 0.18 }); sparkLight.i = 10 * (1 - d / 0.18); sparkLight.p = q; }
      if (d >= 0) for (let i = 0; i < 60; i++) {   // block debris, ballistic with a floor bounce
        const th = h(i, 95) * Math.PI * 2, sp = 2 + 6 * h(i, 96), vy = 4 + 6 * h(i, 97), life = 1.4;
        if (d > life) continue; let y = g + 0.2 + vy * d - 9.8 * d * d, dd = d; if (y < g + 0.1) { y = g + 0.1 + Math.abs(Math.sin(d * 8)) * 0.05; dd = Math.min(d, (vy + Math.sqrt(vy * vy + 4 * 4.9 * 0.1)) / 9.8); }
        debris.push({ p: [p[0] + Math.cos(th) * sp * dd, y, p[2] + Math.sin(th) * sp * dd], r: [d * 9 * h(i, 98), d * 7, d * 5 * h(i, 99)], s: 0.14 + 0.2 * h(i, 94) * (1 - Math.max(0, d - 1.1) / 0.3) });
      }
    }
    if (c.kind === 'cross' && d >= 0 && d < 1.2) puff(soft, t, c.t + 0.3, [p[0], F, p[2]], 16, 51, 1.4, 0.5, [0.9, 0.8, 0.62], 1.2);
  }
  { const pb = rootXZ('B', 12.7); puff(soft, t, 12.7, [pb[0], F, pb[1]], 20, 401, 1.3, 0.4, [0.9, 0.8, 0.62], 1.4); }
  for (const g of GHITS) { const d = t - g.t; if (d < 0 || d > 1) continue;
    puff(soft, t, g.t, g.p, 9, Math.round(g.t * 333), 0.5, 0.5, [0.92, 0.82, 0.62], 0.9); burst(add, t, g.t, [g.p[0], g.p[1] + 0.05, g.p[2]], 14, Math.round(g.t * 777), 0.5); }
  // bind sparks: small repeating bursts
  const bc = CONT.find(x => Math.abs(x.t - 8.1) < 0.01);
  if (bc) for (let tb = 8.25; tb < 8.7; tb += 0.11) burst(add, t, tb, bc.p, 14, Math.round(tb * 1000), 0.6);
  // inserts: impact frame then colour frames with chromatic aberration
  const ii = insIndex(t);
  if (ii >= 0) { const f = Math.round((t - INS[ii]) / DT), c0 = CONT.find(x => Math.abs(x.t - INS[ii]) < 0.02); impact = 0; ca = 0.35; bloomBoost = 0.06;
    if (c0) { flares.push({ p: c0.p, s: 0.42 - 0.08 * f, a: 1, c: [2.6, 1.9, 0.5], rot: 0.35 }); flares.push({ p: c0.p, s: 0.26, a: 0.9, c: [2.4, 2.2, 0.8], rot: 1.1 }); } }
  if (t >= FLASH && t < FLASH + DT - 1e-6) flash = 1; else if (t >= FLASH + DT - 1e-6 && t < FLASH + 3 * DT - 1e-6) black = 1;
  if (t > FLASH + 3 * DT && t < FLASH + 0.6) ca = 0.7 * (1 - (t - FLASH) / 0.6);
  return { add, soft, flares, rings, debris, flash, black, ca, impact, bloomBoost, sparkLight };
}
