// Choreography, cameras and effect timing for the 20 s fight test. Pure functions of t.
// Modelled on Marlow's Downfall (study §2): fight shots 0.3-0.8 s, long anticipation -> short strike, 2-frame impact
// inserts with flare, knockback that travels, cold palette with warm sparks only, camera always moving.
import * as THREE from 'three';

export const TOTAL = 20.0;
const DT = 1 / 30;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const E = { lin: u => u, io: u => u * u * (3 - 2 * u), o: u => 1 - Math.pow(1 - u, 3), i: u => u * u * u, o2: u => 1 - (1 - u) * (1 - u),
  back: u => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); } };
const JK = ['waist', 'chest', 'head', 'rArm', 'rElbow', 'lArm', 'lElbow', 'rLeg', 'rKnee', 'lLeg', 'lKnee'];

let W = null, F = 30;
export function init(world) { W = world; F = world.FLOOR; buildAll(); simulate(); }
export function resim(track = true) { STEPS.length = 0; simulate(); for (const c of ['A', 'B']) BDT[c] = null; if (track) buildBladeTracks(); }
// v7 = v6 mechanics + new movement-led choreography, wider limbs, Minecraft grip, overhead light.
// v6: blade-direction track. v4's blade-intent keys are sometimes near-opposite vectors, so blending them flips the blade
// 100-134 deg in a frame. After the clash solve (resim), sample the raw intent sequentially at HZ and rate-limit it to
// BD_MAX deg/s (slerp toward the target), so the blade can never jump. Deterministic (built once, then sampled).
const BD_MAX = (QS_v6().has('bdmax') ? +QS_v6().get('bdmax') : 1800);   // 60 deg/frame: only real flips are slowed, strikes (<= ~40) pass
function QS_v6() { return typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams(''); }
const BDT = { A: null, B: null };
function buildBladeTracks() {
  if (!BD_MAX) return;
  for (const c of ['A', 'B']) {
    BDT[c] = null; const N = Math.ceil(TOTAL * HZ) + 2, out = []; let cur = null; const mx = BD_MAX / HZ * Math.PI / 180;
    for (let i = 0; i < N; i++) {
      const tg = poseRaw(c, i / HZ).bd, n = Math.hypot(...tg) || 1, g = tg.map(v => v / n);
      if (!cur) cur = g; else { const dt = Math.max(-1, Math.min(1, cur[0] * g[0] + cur[1] * g[1] + cur[2] * g[2])), ang = Math.acos(dt);
        if (ang > mx) { const s = Math.sin(ang), u = mx / ang, a = Math.sin((1 - u) * ang) / s, b = Math.sin(u * ang) / s; cur = cur.map((v, k) => v * a + g[k] * b); const m = Math.hypot(...cur); cur = cur.map(v => v / m); } else cur = g; }
      out.push(cur.slice());
    }
    BDT[c] = out;
  }
}

// ------------------------------------------------------------------ pose library (signs: see rig.js applyPose notes)
function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, tilt: [0, 0], yawAbs: null, bd: [0, 0.94, 0.34] }; for (const j of JK) p[j] = [0, 0, 0]; return p; }
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
  relaxed: [-40, -32], guard: [68, -12], windR: [38, -150], slashR: [-8, 75], windL: [40, 150], slashL: [-6, -75],
  windO: [55, 180], slashO: [-38, 0], windT: [4, -8], thrust: [0, 0], parryH: [6, 90], parryR: [74, -28], parryL: [74, 28],
  kickW: [62, -20], kick: [55, -30], hitBack: [40, -70], slide: [-18, -150], kneelG: [70, -10], kneelBlock: [6, 90],
  crouch: [-28, -155], takeoff: [62, 180], tuck: [72, 180], slam: [-62, 0], dodge: [64, -15], duck: [48, -35], bind: [56, 14],
  spin: [2, -92], sweepW: [-18, -150], sweep: [-24, 65], upperW: [-42, -20], upper: [82, 0], land: [50, -15], flick: [-45, -45],
  knees: [-50, -25], fallen: [-10, -90],
};
for (const k in BD) if (L[k]) L[k].bd = bdv(...BD[k]);
function mix(a, b, u) {
  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u), tilt: [lerp(a.tilt[0], b.tilt[0], u), lerp(a.tilt[1], b.tilt[1], u)],
    yawAbs: (a.yawAbs != null && b.yawAbs != null) ? lerp(a.yawAbs, b.yawAbs, u) : (u < 0.5 ? a.yawAbs : b.yawAbs) };
  o.fkR = u < 0.5 ? a.fkR : b.fkR; o.fkL = u < 0.5 ? a.fkL : b.fkL;
  { const ba = a.bd || [0, 1, 0], bb = b.bd || [0, 1, 0], v = ba.map((x, i) => lerp(x, bb[i], u)), n = Math.hypot(...v) || 1; o.bd = v.map(x => x / n); }
  for (const j of JK) o[j] = a[j].map((v, i) => lerp(v, b[j][i], u)); return o;
}
// pose <-> flat numeric vector (for spline interpolation)
const FLAT_KEYS = ['wrist', 'roll', 'y', 'yawOff'];
function flat(p) { if (p._flat) return p._flat; const a = FLAT_KEYS.map(k => p[k]); a.push(p.tilt[0], p.tilt[1]); a.push(...(p.bd || [0, 1, 0])); for (const j of JK) a.push(...p[j]); p._flat = a; return a; }
function unflat(a, tmpl) {
  const o = { yawAbs: tmpl.yawAbs, fkR: tmpl.fkR, fkL: tmpl.fkL }; let i = 0; for (const k of FLAT_KEYS) o[k] = a[i++]; o.tilt = [a[i++], a[i++]];
  { const v = [a[i++], a[i++], a[i++]], n = Math.hypot(...v) || 1; o.bd = v.map(x => x / n); }
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
const STRIDE = 2.7;   // blocks per full run cycle (right + left step)
function runBody(phi, p) {
  const s = Math.sin(2 * Math.PI * phi);
  p.waist = [18, -15 * s, 0]; p.chest = [8, p.chest[1] + 10 * s, 0]; p.y = -0.08; return p;
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
  p.lArm = [-82 * s, 0, 14]; p.lElbow = [-78 - 28 * Math.max(0, s), 0, 0];
  if (swordToo) { p.rArm = [26 + 30 * s, 0, -16]; p.rElbow = [-30 - 14 * s, 0, 0]; p.wrist = 214 + 6 * s; p.bd = bdv(-22 + 6 * s, -160); p.chest = [6, 10 * s, 0]; p.head = [-16, -6 * s, 0]; }
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
  // v7 "moving duel": every exchange happens on the move. Positions first (at), then facing locks computed from them
  // (so turns never snap), then poses (k) and contacts (clash). x = arena long axis, centre (0,0).
  const D = { A: {}, B: {} };                                         // persistent per-character overrides (spin offsets)
  const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
  const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
  // ================= positions =================
  // S1 0-3.0  running cross: both sprint the length of the sand and clash in passing, skid, turn
  at('A', 0, -11, -1.2); at('A', 0.32, -11, -1.2); at('A', 2.1, -0.25, -0.45, 'lin'); at('A', 2.8, 3.6, -0.75, 'o');
  at('B', 0, 11, 1.2); at('B', 0.36, 11, 1.2); at('B', 2.1, 0.25, 0.45, 'lin'); at('B', 2.8, -3.6, 0.75, 'o');
  RUN.A.push([0.32, 2.0]); RUN.B.push([0.36, 2.0]);
  // S2 3.0-4.9  B sprints and leaps for an overhead; A slides UNDER the jump; B slams the sand where A was
  at('A', 3.0, 3.6, -0.75); at('A', 3.92, 3.5, -0.75); at('A', 4.42, -0.4, -1.05, 'o');
  at('B', 3.0, -3.6, 0.75); at('B', 3.85, -0.9, 0.2, 'lin'); at('B', 4.36, 2.6, -0.5, 'lin'); at('B', 4.5, 2.75, -0.55, 'o');
  RUN.B.push([3.05, 3.8]);
  // S3 5.0-7.0  A drives B back across the sand: advance-strike x3 (B parries backing off), thrust, B sidesteps + spin counter
  at('A', 4.9, -0.4, -1.05); at('A', 5.3, 0.55, -0.9, 'o'); at('A', 5.7, 1.35, -0.8, 'o'); at('A', 6.1, 2.15, -0.7, 'o'); at('A', 6.55, 3.1, -0.6, 'o');
  at('B', 4.9, 2.75, -0.55); at('B', 5.3, 2.55, -0.5, 'o'); at('B', 5.7, 3.35, -0.45, 'o'); at('B', 6.1, 4.1, -0.4, 'o'); at('B', 6.5, 4.5, 0.75, 'o');
  at('B', 6.95, 4.15, 0.6, 'io'); at('A', 6.95, 3.25, -0.5, 'io');
  // S4 7.0-9.0  B kicks, A rolls back and springs up; B charges, A sidesteps at the last moment, B skids past
  at('B', 7.25, 3.9, 0.5, 'o'); at('A', 7.3, 3.2, -0.5); at('A', 7.9, -0.6, -0.9, 'o');
  RUN.B.push([7.95, 8.55]); at('B', 7.95, 3.9, 0.5); at('B', 8.6, 0.2, -0.75, 'lin'); at('B', 9.05, -2.7, -0.9, 'o');
  at('A', 8.38, -0.6, -0.9); at('A', 8.6, -0.75, 0.55, 'o');
  // S5 9.0-10.5  A zig-zag dash (two cuts) into a leaping slash; B blocks low
  at('A', 9.05, -0.75, 0.55); at('A', 9.35, -0.45, -0.45, 'io'); at('A', 9.65, -0.95, 0.5, 'io'); at('A', 10.05, -1.35, -0.2, 'o');   // cut right (run-up), cut left, leap in
  at('B', 9.05, -2.7, -0.9); at('B', 10.05, -3.15, -0.45, 'io');
  // S6 10.5-12.4  fast wide circling flurry
  { const pa = evalPosT('A', 10.05), pb = evalPosT('B', 10.05), c0 = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], r = 1.05, th0 = Math.atan2(pb[1] - c0[1], pb[0] - c0[0]);
    for (let t = 10.45; t <= 12.25 + 1e-9; t += 0.1) { const th = th0 + (t - 10.45) / 1.8 * Math.PI * 1.05;
      at('B', t, c0[0] + Math.cos(th) * r, c0[1] + Math.sin(th) * r, 'lin'); at('A', t, c0[0] - Math.cos(th) * r, c0[1] - Math.sin(th) * r, 'lin'); }
    BIND_C = c0; }
  // S7 12.4-14.1  bind that drifts sideways across the sand, then B shoves A away (A slides)
  { const pa = evalPosT('A', 12.25), pb = evalPosT('B', 12.25), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    const ca = [pa[0] + ux * (d - 1.05) / 2, pa[1] + uz * (d - 1.05) / 2], cb = [pb[0] - ux * (d - 1.05) / 2, pb[1] - uz * (d - 1.05) / 2];
    at('A', 12.45, ca[0], ca[1], 'o'); at('B', 12.45, cb[0], cb[1], 'o');
    at('A', 13.3, ca[0] + px * 1.8, ca[1] + pz * 1.8, 'io'); at('B', 13.3, cb[0] + px * 1.8, cb[1] + pz * 1.8, 'io');
    at('A', 14.05, ca[0] + px * 1.8 - ux * 3.2, ca[1] + pz * 1.8 - uz * 3.2, 'o'); at('B', 13.6, cb[0] + px * 1.8 + ux * 0.3, cb[1] + pz * 1.8 + uz * 0.3, 'o');
    SH = { ux, uz, px, pz }; }
  // S8 14.1-15.6  B rushes in with a low sweep; A hops it and chops down; B blocks from the knee
  { const pa = evalPosT('A', 14.05), pb = evalPosT('B', 13.6), dx = pa[0] - pb[0], dz = pa[1] - pb[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('B', 14.15, pb[0], pb[1]); at('B', 14.6, pa[0] - ux * 1.5, pa[1] - uz * 1.5, 'o');
    at('A', 14.6, pa[0], pa[1]); at('A', 15.05, pa[0] - ux * 0.35, pa[1] - uz * 0.35, 'o'); }
  // S9 15.6-20  break apart, then A sprints and LEAPS from the run; B launches up to meet it: mid-air clash, both blown apart
  { const pa = evalPosT('A', 15.05), pb = evalPosT('B', 14.6), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('A', 15.5, pa[0], pa[1]); at('A', 16.2, pa[0] - ux * 2.8, pa[1] - uz * 2.8, 'o');
    at('B', 15.5, pb[0], pb[1]); at('B', 16.2, pb[0] + ux * 0.8, pb[1] + uz * 0.8, 'o');
    const a0 = [pa[0] - ux * 2.8, pa[1] - uz * 2.8], b0 = [pb[0] + ux * 0.8, pb[1] + uz * 0.8];
    RUN.A.push([16.35, 16.95]); at('A', 16.35, a0[0], a0[1]); at('A', 16.95, b0[0] - ux * 3.6, b0[1] - uz * 3.6, 'lin');
    at('A', FLASH, b0[0] - ux * 1.1, b0[1] - uz * 1.1, 'lin');
    at('A', 18.1, b0[0] - ux * 4.4, b0[1] - uz * 4.4, 'o');                       // blown back, slides on landing
    at('B', 17.0, b0[0], b0[1]); at('B', 18.1, b0[0] + ux * 2.6, b0[1] + uz * 2.6, 'o');
    at('A', 20, b0[0] - ux * 4.4, b0[1] - uz * 4.4); at('B', 20, b0[0] + ux * 2.6, b0[1] + uz * 2.6);
    export_cross.mid = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2]; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  for (const c of ['A', 'B']) P[c].sort((a, b) => a[0] - b[0]);
  // ================= facing locks (continuous: computed from the planned positions, wrapped to the previous value) ==
  const face = (c, t, ref) => { const o = c === 'A' ? 'B' : 'A', a = evalPos(P[c], t), b = evalPos(P[o], t); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); };
  const trav = (c, t0, t1, ref) => { const a = evalPos(P[c], t0), b = evalPos(P[c], t1); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); };
  // ================= poses =================
  // ---- S1: ready crouch, sprint, clash in passing, skid + turn round
  const yA1 = trav('A', 0.32, 2.1, 90), yB1 = trav('B', 0.36, 2.1, -90);
  K('A', 0, L.crouch, 'io', { ...SW, yawAbs: yA1 }); K('B', 0, L.crouch, 'io', { ...SW, yawAbs: yB1 });
  K('A', 0.32, L.crouch, 'lin', { ...SW, yawAbs: yA1 }); K('B', 0.36, L.crouch, 'lin', { ...SW, yawAbs: yB1 });
  K('A', 1.7, L.guard, 'lin', { ...SW, yawAbs: yA1 }); K('A', 1.96, L.windR, 'o', { yawAbs: yA1 }); K('A', 2.1, L.slashR, 'i', { yawAbs: yA1 });
  K('B', 1.7, L.guard, 'lin', { ...SW, yawAbs: yB1 }); K('B', 1.96, L.windL, 'o', { yawAbs: yB1 }); K('B', 2.1, L.slashL, 'i', { yawAbs: yB1 });
  clash(2.1, true);
  const yA1e = face('A', 2.95, yA1 + 180), yB1e = face('B', 2.95, yB1 - 180);
  K('A', 2.3, L.slide, 'o', { yawAbs: yA1 + 40, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160 }); K('A', 2.78, L.slide, 'lin', { yawAbs: yA1e - 20, y: -0.46 }); K('A', 2.98, G, 'io', { yawAbs: yA1e });
  K('B', 2.3, L.slide, 'o', { yawAbs: yB1 - 40, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160 }); K('B', 2.78, L.slide, 'lin', { yawAbs: yB1e + 20, y: -0.46 }); K('B', 2.98, G, 'io', { yawAbs: yB1e });
  K('A', 3.05, G);
  // ---- S2: B sprints + leaps (overhead), A slides under, B slams the sand
  const yB2 = trav('B', 3.0, 4.36, 90), yA2 = face('A', 3.9, 0);
  K('B', 3.05, L.crouch, 'o', { ...SW, yawAbs: yB2 }); K('B', 3.62, L.guard, 'lin', { ...SW, yawAbs: yB2 });
  K('B', 3.82, L.crouch, 'o', { yawAbs: yB2, y: -0.4 }); K('B', 3.92, L.takeoff, 'o', { yawAbs: yB2, y: 0.9 }); K('B', 4.12, L.tuck, 'o', { yawAbs: yB2, y: 2.3 });
  K('B', 4.24, L.windO, 'o', { yawAbs: yB2, y: 1.5 }); K('B', 4.38, L.slam, 'i', { yawAbs: yB2 }); K('B', 4.7, L.slam, 'lin', { yawAbs: yB2, y: -0.55 });
  const yB2e = face('B', 5.0, yB2 + 180); K('B', 4.95, G, 'io', { yawAbs: yB2e }); K('B', 5.05, G);
  K('A', 3.85, G, 'io', { yawAbs: yA2 }); K('A', 3.96, L.duck, 'o', { yawAbs: yA2 }); K('A', 4.05, L.slide, 'o', { yawAbs: yA2, head: [-40, 0, 0] });
  K('A', 4.42, L.slide, 'lin', { yawAbs: yA2, y: -0.5 }); const yA2e = face('A', 4.85, yA2 + 180);
  K('A', 4.62, L.crouch, 'o', { yawAbs: (yA2 + yA2e) / 2 }); K('A', 4.8, G, 'io', { yawAbs: yA2e }); K('A', 4.9, G);
  clash(4.4, true, 'slam', { at: (cast, blade) => { const tip = blade('B', 4.44, [26])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; } });
  // ---- S3: A advances striking, B backs off parrying; thrust; B sidesteps and spin-counters
  K('A', 5.12, L.windR, 'o'); K('A', 5.3, L.slashR, 'i'); K('B', 5.14, L.parryL, 'o'); clash(5.3);
  K('A', 5.5, L.windL, 'o'); K('A', 5.7, L.slashL, 'i'); K('B', 5.52, L.parryR, 'o'); clash(5.7);
  K('A', 5.88, L.windO, 'o'); K('A', 6.1, L.slashO, 'i'); K('B', 5.92, L.parryH, 'o'); clash(6.1);
  K('A', 6.32, L.windT, 'o'); K('A', 6.5, L.thrust, 'i'); K('A', 6.7, L.thrust, 'lin', { chest: [8, 10, 0] });
  K('B', 6.3, L.parryH); K('B', 6.44, L.dodge, 'o'); K('B', 6.58, L.windR, 'o', { y: -0.3 });
  K('B', 6.8, L.spin, 'lin', { yawOff: -300 }); K('B', 6.95, L.slashR, 'o', { yawOff: -360 }); D.B = { yawOff: -360 }; K('B', 7.08, G);
  K('A', 6.82, L.parryR, 'o'); K('A', 6.98, L.parryR, 'lin', { y: -0.34 }); clash(6.95, true);
  // ---- S4: kick, A rolls back and springs up; B charges, A sidesteps, B skids past
  K('B', 7.12, L.kickW, 'o'); K('B', 7.25, L.kick, 'i'); K('B', 7.42, L.kick, 'lin'); K('B', 7.65, G, 'io');
  K('A', 7.15, G); K('A', 7.3, L.hitBack, 'o'); K('A', 7.48, L.slide, 'o'); K('A', 7.85, L.crouch, 'o'); K('A', 8.0, L.takeoff, 'o', { y: 0.35 }); K('A', 8.18, G, 'io');
  clash(7.27, false, 'kick', { at: () => { const q = pose('A', 7.3).pos; return [q[0], q[1] + 1.3, q[2]]; } });
  const yB4 = trav('B', 7.95, 8.6, -90);
  K('B', 7.82, L.crouch, 'o', { ...SW }); K('B', 7.95, L.crouch, 'lin', { ...SW, yawAbs: yB4 }); K('B', 8.3, L.guard, 'lin', { ...SW, yawAbs: yB4 });
  K('B', 8.45, L.windR, 'o', { yawAbs: yB4 }); K('B', 8.6, L.slashR, 'i', { yawAbs: yB4 }); K('B', 8.75, L.slide, 'o', { yawAbs: yB4 - 30, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160 });
  const yB4e = face('B', 9.15, yB4 + 180); K('B', 9.0, L.slide, 'lin', { yawAbs: yB4e - 25, y: -0.45 }); K('B', 9.15, G, 'io', { yawAbs: yB4e }); K('B', 9.22, G);
  K('A', 8.35, G); K('A', 8.48, L.dodge, 'o', { waist: [10, 0, -22], chest: [6, 0, -12] }); K('A', 8.75, L.dodge, 'lin'); K('A', 9.0, G, 'io');
  // ---- S5: zig-zag dash, leaping slash, B blocks from the knee
  K('A', 9.1, G, 'io', { waist: [16, -14, 8] }); K('A', 9.38, G, 'io', { waist: [16, -14, -10], y: -0.24 }); K('A', 9.66, G, 'io', { waist: [16, -14, 10], y: -0.24 });
  K('A', 9.8, L.crouch, 'o', { y: -0.4 }); K('A', 9.9, L.takeoff, 'o', { y: 0.55 }); K('A', 9.98, L.windO, 'o', { y: 0.9 }); K('A', 10.1, L.slashO, 'i', { y: 0.2 }); K('A', 10.35, L.land, 'o'); K('A', 10.5, G, 'io');
  K('B', 9.4, G); K('B', 9.85, L.kneelG, 'o'); K('B', 10.0, L.kneelBlock, 'o'); K('B', 10.14, L.kneelBlock, 'lin', { y: -0.5 }); K('B', 10.45, G, 'io');
  clash(10.1, true);
  // ---- S6: fast circling flurry (5 clashes)
  K('A', 10.5, G); K('B', 10.5, G);
  K('B', 10.58, L.windR, 'o'); K('B', 10.68, L.slashR, 'i'); K('A', 10.6, L.parryL, 'o'); clash(10.68);
  K('A', 10.82, L.windL, 'o'); K('A', 10.98, L.slashL, 'i'); K('B', 10.85, L.parryR, 'o'); clash(10.98);
  K('B', 11.12, L.windO, 'o'); K('B', 11.28, L.slashO, 'i'); K('A', 11.15, L.parryH, 'o'); clash(11.28);
  K('A', 11.42, L.windR, 'o'); K('A', 11.58, L.slashR, 'i'); K('B', 11.45, L.parryL, 'o'); clash(11.58);
  K('B', 11.72, L.windL, 'o'); K('B', 11.88, L.slashL, 'i'); K('A', 11.75, L.parryR, 'o'); clash(11.88);
  K('A', 12.05, L.windO, 'o'); K('B', 12.08, L.windR, 'o');
  // ---- S7: bind drifting sideways, shove
  K('A', BIND_T, L.bind, 'i'); K('B', BIND_T, L.bind, 'i'); clash(BIND_T, true);
  for (let t = BIND_T + 0.12; t < BIND_END; t += 0.12) { const s = Math.sin(t * 40) * 0.5 + 0.5;
    K('A', t, L.bind, 'io', { chest: [22 + 8 * s, 10, 0], y: -0.3 - 0.06 * s, lArm: [-80 + 10 * s, 0, 30] }); K('B', t, L.bind, 'io', { chest: [22 + 8 * (1 - s), 10, 0], y: -0.3 - 0.06 * (1 - s) }); }
  K('B', 13.42, L.thrust, 'o', { rArm: [-80, 0, 0], lArm: [-90, 0, 20], lElbow: [-10, 0, 0], y: -0.3 }); K('B', 13.7, G, 'io');
  K('A', 13.45, L.hitBack, 'o'); K('A', 13.6, L.slide, 'o'); K('A', 14.0, L.slide, 'lin', { y: -0.48 }); K('A', 14.2, G, 'io');
  clash(13.42, false, 'kick', { at: () => { const q = pose('A', 13.45).pos; return [q[0], q[1] + 1.2, q[2]]; } });
  // ---- S8: low sweep, A hops it and chops down, B blocks from the knee
  K('B', 14.2, G); K('B', 14.42, L.sweepW, 'o'); K('B', 14.6, L.sweep, 'i'); K('B', 14.82, L.kneelG, 'o'); K('B', 14.95, L.kneelBlock, 'o'); K('B', 15.1, L.kneelBlock, 'lin', { y: -0.52 }); K('B', 15.45, G, 'io');
  K('A', 14.4, G); K('A', 14.52, L.crouch, 'o', { y: -0.35 }); K('A', 14.6, L.takeoff, 'o', { y: 0.8 }); K('A', 14.74, L.tuck, 'o', { y: 1.4 });
  K('A', 14.88, L.windO, 'o', { y: 0.8 }); K('A', 15.05, L.slashO, 'i'); K('A', 15.3, L.land, 'o'); K('A', 15.5, G, 'io');
  clash(15.05, true);
  // ---- S9: break apart; A sprints, LEAPS from the run; B springs up to meet it: mid-air clash; both blown apart
  K('A', 15.6, G); K('A', 16.2, G, 'io'); K('B', 15.6, G); K('B', 16.2, G, 'io'); BR.A.push([15.6, 16.3]); BR.B.push([15.6, 16.9]);
  const yA9 = trav('A', 16.35, 16.95, 0);
  K('A', 16.28, L.crouch, 'o', { ...SW, yawAbs: yA9 }); K('A', 16.35, L.crouch, 'lin', { ...SW, yawAbs: yA9 }); K('A', 16.8, L.guard, 'lin', { ...SW, yawAbs: yA9 });
  K('A', 16.92, L.crouch, 'o', { yawAbs: yA9, y: -0.35 }); K('A', 17.0, L.takeoff, 'o', { yawAbs: yA9, y: 1.0 }); K('A', 17.15, L.windO, 'o', { yawAbs: yA9, y: 1.9 });
  K('A', FLASH, L.slashO, 'i', { yawAbs: yA9, y: 1.35 }); K('A', 17.55, L.hitBack, 'o', { yawAbs: yA9, y: 1.1 }); K('A', 17.85, L.land, 'i', { yawAbs: yA9 });
  K('A', 18.1, L.slide, 'lin', { yawAbs: yA9, y: -0.45 }); K('A', 18.5, G, 'io', { yawAbs: yA9 }); K('A', 19.2, L.relaxed, 'io', { yawAbs: yA9 }); K('A', 19.45, L.flick, 'o', { yawAbs: yA9 }); K('A', 20, L.relaxed, 'io', { yawAbs: yA9 });
  const yB9 = near(yA9 + 180, 0);
  K('B', 16.6, G, 'io', { yawAbs: yB9 }); K('B', 17.05, L.crouch, 'o', { yawAbs: yB9, y: -0.45 }); K('B', 17.18, L.upperW, 'o', { yawAbs: yB9, y: -0.2 });
  K('B', FLASH, L.upper, 'i', { yawAbs: yB9, y: 1.1 }); K('B', 17.6, L.hitBack, 'o', { yawAbs: yB9, y: 0.5 }); K('B', 17.85, L.land, 'i', { yawAbs: yB9 });
  K('B', 18.1, L.slide, 'lin', { yawAbs: yB9, y: -0.45 }); K('B', FALL_T - 0.4, L.knees, 'io', { yawAbs: yB9 }); K('B', FALL_T, L.kneelG, 'o', { yawAbs: yB9 }); K('B', 20, L.kneelG, 'lin', { yawAbs: yB9, head: [20, 0, 0] });
  clash(FLASH, true, 'cross');
  BR.A.push([18.5, 20]);
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
// helpers for buildAll: angle wrap toward a reference, planned position lookup before sorting is final
function near(a, ref) { while (a - ref > 180) a -= 360; while (a - ref < -180) a += 360; return a; }
function evalPosT(c, t) { const K_ = P[c].slice().sort((a, b) => a[0] - b[0]); return evalPos(K_, t); }
let BIND_C = [0, 0], SH = null;

export const export_cross = {};
export function events() { return { steps: STEPS.map(s => [+s.t.toFixed(3), s.kind, +(s.sp || 0).toFixed(2), s.c, s.foot, s.run ? 1 : 0]), slides: SLIDES, ghits: GHITS.map(g => +g.t.toFixed(3)), clashes: CONT.map(c => [c.t, c.big, c.kind]), swings: SWINGS() }; }

// clash corrections (IK-lite): solved in fight.js so the two blades physically cross at each clash time
export const CORR = { A: [], B: [] };
function corrW(d) { if (d < -0.16 || d > 0.22) return 0; return d < 0 ? E.io((d + 0.16) / 0.16) : 1 - E.io(d / 0.22); }
function rootXZ(c, t) { return evalPos(P[c], t); }
// ---- v5 smoothing: Gaussian-filtered key curve. v4 eases every key segment on its own, so velocity drops to zero (or jumps)
// at most keys -> angular-acceleration spikes ("pops") in shoulders/elbows/knees. Averaging the curve over a short,
// zero-phase window keeps the timing of strikes but makes velocity continuous across keys.
const QS_ = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
const SIG = (QS_.has('sig') ? +QS_.get('sig') : 50) / 1000;   // v5 default 50 ms; ?sig=0&psig=0 reproduces v4 exactly
// v6: smoothing tightens to ~35 % within +-0.12 s of a clash, so contacts stay sharp (v4 hits the clash pose for an instant;
// a full-width blur averaged that instant away -> 1-block misses). Elsewhere the full v5 smoothing.
// measured: sharper contacts at some clashes but 3x the joint pops (174/210 vs 53/105) -> off by default, ?sharp=1 to try
const SHARP = typeof location !== 'undefined' && new URLSearchParams(location.search).has('sharp');
function sharpK(t) { if (!SHARP) return 1; let m = 1; for (const cl of CLASHES) { const d = Math.abs(t - cl.t); if (d < 0.12) m = Math.min(m, 0.35 + 0.65 * E.io(d / 0.12)); } return m; }
function evalKeysS(K, t) {
  if (!SIG) return evalKeys(K, t);
  const sg = SIG * sharpK(t);
  const c = evalKeys(K, t), n = 4; let acc = null, ws = 0;
  for (let i = -n; i <= n; i++) { const d = i * sg * 0.5, w = Math.exp(-0.5 * (d / sg) ** 2), a = flat(evalKeys(K, t + d));
    if (!acc) acc = a.map(v => v * w); else for (let j = 0; j < a.length; j++) acc[j] += a[j] * w; ws += w; }
  const o = unflat(acc.map(v => v / ws), c); o.yawAbs = c.yawAbs; return o;
}
function basePose(c, t) {
  const p = evalKeysS(T[c], t); const [x, z] = rootXZ(c, t);
  for (const e of CORR[c]) { const w = corrW(t - e.t); if (!w) continue;
    p.rArm[0] += e.ax * w; p.rArm[2] += e.az * w; p.rElbow[0] += e.el * w; p.chest[1] += e.ch * w;
    if (e.wr || e.ba) { const b = p.bd, el = Math.asin(Math.max(-1, Math.min(1, b[1]))) * 180 / Math.PI + e.wr * w, az = Math.atan2(b[0], b[2]) * 180 / Math.PI + (e.ba || 0) * w; p.bd = bdv(el, az); } p._fw = (p._fw || 0) + (e.fw || 0) * w; }
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
  p.pos = [X, p.y, Z]; p.yaw = yaw + p.yawOff;
  return p;
}

// ------------------------------------------------------------------ simulation: collision + footstep planner (240 Hz, precomputed)
const HZ = 240; const SIM = { A: null, B: null }; export const STEPS = [];   // {c, t, foot, p:[x,0,z], kind:'step'|'land'|'skid'|'lift', sp}
export const SLIDES = { A: [[2.2, 2.8], [4.0, 4.5], [7.45, 7.9], [13.6, 14.05], [17.88, 18.3]], B: [[2.2, 2.8], [8.7, 9.05], [17.88, 18.3]] };
const inWin = (L, t) => L.some(([a, b]) => t >= a && t <= b);
const _eu = new THREE.Euler(), _v1 = new THREE.Vector3();
function legFK(leg, knee, hipX) {   // desired sole offset in the body frame (px) from the authored FK leg angles
  _eu.set(leg[0] * Math.PI / 180, leg[1] * Math.PI / 180, leg[2] * Math.PI / 180, 'XYZ'); const R1 = new THREE.Quaternion().setFromEuler(_eu);
  _eu.set(knee[0] * Math.PI / 180, 0, 0, 'XYZ'); const R2 = new THREE.Quaternion().setFromEuler(_eu);
  _v1.set(0, -6, 0).applyQuaternion(R2).add(new THREE.Vector3(0, -6, 0)).applyQuaternion(R1);
  const sx = hipX + _v1.x * 1.45; return [Math.sign(hipX) * Math.max(1.9, Math.abs(sx)), _v1.z * 1.35];
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
        con.push({ i, f, p: [root[i][0] + fx * 0.28 + fz * 0.16 * side, root[i][1] + fz * 0.28 - fx * 0.16 * side] });
      }
    }
    for (const f of ['r', 'l']) {
      const cs = con.filter(q => q.f === f);
      for (let k = 0; k < cs.length; k++) {
        const cur = cs[k], nxt = cs[k + 1], prevAll = con.indexOf(cur), stepLen = nxt ? nxt.i - cur.i : 60, stance = Math.round(stepLen * 0.22);
        for (let i = cur.i; i < (nxt ? nxt.i : Math.min(i1 + 1, cur.i + stance + 1)); i++) {
          if (i - cur.i <= stance || !nxt) g[f][i] = [cur.p[0], 0, cur.p[1]];
          else { const u = (i - cur.i - stance) / (nxt.i - cur.i - stance), w = u * u * (3 - 2 * u);
            g[f][i] = [lerp(cur.p[0], nxt.p[0], w), 0.42 * Math.sin(Math.PI * u) * (1 - 0.3 * u), lerp(cur.p[1], nxt.p[1], w)]; }
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
        const off = legFK(leg, knee, hx), lx = off[0] / 16, lz = off[1] / 16;
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
          step[f] = { from: feet[f].slice(), to: [D[0] + vx * dur * 0.75, D[1] + vz * dur * 0.75], t0: t, dur, h: run ? 0.28 : Math.min(0.26, 0.07 + 0.24 * err) };
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
const LAG = { waist: 0.03, chest: 0.015, lArm: -0.04, rElbow: -0.025, lElbow: -0.05, head: -0.035 };
// ---- v5: second, light zero-phase pass on the FINAL pose (root path, pelvis drop, IK foot targets, every joint):
// removes the remaining leg/hip spikes from the step planner and the pelvis-drop clamp without moving contact timing much.
const PSIG = (QS_.has('psig') ? +QS_.get('psig') : 30) / 1000;   // v5 default 30 ms
export function pose(c, t) {
  const p = poseRaw(c, t); if (!PSIG || c === 'C') return p;
  const n = 3, pos = [0, 0, 0], J = {}, ik = { r: [0, 0, 0], l: [0, 0, 0] }; let ws = 0, yaw = 0, y = 0; const ps = PSIG * sharpK(t);
  for (const j of JK) J[j] = [0, 0, 0];
  for (let i = -n; i <= n; i++) { const d = i * ps * 0.6, w = Math.exp(-0.5 * (d / ps) ** 2), q = i ? poseRaw(c, t + d) : p; ws += w;
    for (let k = 0; k < 3; k++) pos[k] += q.pos[k] * w;
    let dy = q.yaw - p.yaw; dy -= 360 * Math.round(dy / 360); yaw += (p.yaw + dy) * w;
    for (const j of JK) for (let k = 0; k < 3; k++) J[j][k] += q[j][k] * w;
    if (p.ik) for (const sd of ['r', 'l']) if (p.ik[sd]) { const f = (q.ik && q.ik[sd]) || p.ik[sd]; for (let k = 0; k < 3; k++) ik[sd][k] += f[k] * w; } }
  p.pos = pos.map(v => v / ws); p.yaw = yaw / ws; for (const j of JK) p[j] = J[j].map(v => v / ws);
  if (p.ik) for (const sd of ['r', 'l']) if (p.ik[sd]) p.ik[sd] = ik[sd].map(v => v / ws);
  return p;
}
function poseRaw(c, t) {
  if (c === 'C') { const p = N(); p.pos = [0, -200, 0]; return p; }
  const p = basePose(c, t), k0 = evalKeysS(T[c], t);
  for (const j in LAG) { const q = evalKeysS(T[c], t + LAG[j]); p[j] = p[j].map((v, i) => v + (q[j][i] - k0[j][i])); }
  p.lArm = p.lArm.map(v => v * 1.25); p.lElbow = p.lElbow.map(v => v * 1.1);                   // v7: free arm swings out wider
  { const q = evalKeysS(T[c], t - 0.03), v = p.bd.map((x, i) => x + (q.bd[i] - k0.bd[i])), n = Math.hypot(...v) || 1; p.bd = v.map(x => x / n); }
  if (BDT[c]) { const v = samp(BDT[c], t), n = Math.hypot(...v) || 1; p.bd = v.map(x => x / n); }
  const S_ = SIM[c], rt = samp(S_.root, t), rw = samp(S_.raw, t), X = rt[0] + p.pos[0] - rw[0], Z = rt[1] + p.pos[2] - rw[1], g = W.floorAt(X, Z);
  p.pos = [X, g + (isAir(p) ? p.y : p.y * 0.8) + samp(S_.yoff, t)[0], Z];
  { const o = c === 'A' ? 'B' : 'A', ro = samp(SIM[o].root, t); p.opp = [ro[0], W.floorAt(ro[0], ro[1]), ro[1]]; }
  const fr = samp(S_.r, t), fl = samp(S_.l, t);
  { const sw = f => f && f[1] > 0.004 ? Math.min(1, f[1] / 0.08) : 0, rs = sw(fr), ls = sw(fl);
    // weight shift: swinging right foot -> hips over the left (stance) foot, spine bends back to keep the head centred
    const shift = ls - rs; p.waist[2] += 7 * shift; p.chest[2] -= 5 * shift; p.head[2] -= 2.5 * shift;
    // pelvis rotates with the swinging leg, shoulders counter-rotate (contralateral gait), head holds its aim
    const twist = 11 * (rs - ls); p.waist[1] += twist; p.chest[1] -= twist * 1.4; p.head[1] -= (p.waist[1] + p.chest[1]) * 0.35 * Math.max(rs, ls); }
  // breathing in the ribcage (not the hips): chest pitch + small shoulder rise
  { const ph = c === 'A' ? 0 : 1.7, amp = inWin(BR[c], t) ? 2.4 : 1; p.chest[0] -= 1.1 * amp * Math.sin(t * 3.1 + ph); }
  if (fr || fl) { p.ik = {}; for (const [k, f] of [['r', fr], ['l', fl]]) if (f) p.ik[k] = [f[0], W.floorAt(f[0], f[2]) + f[1] + 0.035, f[2]];
    // pelvis drop: lower the hips until every planted foot is within leg reach (wide stances sit low, nothing floats)
    const yaw = p.yaw * Math.PI / 180, hipY = p.pos[1] + 0.75; let drop = 0;
    for (const [k, hx] of [['r', -2 / 16], ['l', 2 / 16]]) { const tg = p.ik[k]; if (!tg) continue;
      const hxw = p.pos[0] + hx * Math.cos(yaw), hzw = p.pos[2] - hx * Math.sin(yaw), dh = Math.hypot(tg[0] - hxw, tg[2] - hzw), reach = 0.735;
      if (dh < reach) { const need = hipY - tg[1] - Math.sqrt(reach * reach - dh * dh); if (need > drop) drop = need; } else drop = Math.max(drop, hipY - tg[1]); }
    p.pos[1] -= Math.min(0.42, drop); }
  return p;
}

// ------------------------------------------------------------------ contacts (set by fight.js from the real blade geometry)
let CONT = [];
export function setContacts(c) { CONT = c; }
let GHITS = []; export function setGroundHits(g) { GHITS = g; }
const BIG = () => CONT.filter(c => c.big && c.kind === 'blade');

// ------------------------------------------------------------------ shots
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const INS = [2.1, 4.4, 6.95, 10.1, 12.45, 15.05];   // impact inserts: 1 impact frame + 2 colour frames
const FLASH = 17.3, BIND_T = 12.45, BIND_END = 13.3, FALL_T = 18.9, FALL_C = 'B';
// v7 shots: [time, label, opts]. Generic, movement-led framing (tracking the runner, low angles on leaps, top-down on
// the slam); the same 'ins' / 'flash' / 'hero' machinery as v4.
const SHOTS = [
  [0.0, 'est'], [0.9, 'trackA'], [1.45, 'trackB'], [1.85, 'side', { d: 5.2, h: 0.9 }], [2.1, 'ins'], [2.2, 'wide', { d: 7.5 }],
  [2.85, 'faceB'], [3.2, 'trackB'], [3.85, 'low', { d: 4.2, look: 2.0, roll: -0.05 }], [4.3, 'high'], [4.4, 'ins'], [4.5, 'low', { d: 4.6, look: 1.2 }],
  [5.0, 'otsA'], [5.6, 'side', { d: 4.6, h: 1.3 }], [6.25, 'three4'], [6.75, 'orbit', { a0: 0.2, a1: 0.9 }], [6.95, 'ins'], [7.05, 'side', { d: 5.6 }],
  [7.55, 'low', { d: 5.0, look: 1.2, roll: 0.05 }], [7.95, 'trackB'], [8.55, 'wide', { d: 6.5 }], [9.1, 'faceA'], [9.45, 'trackA', { d: 3.6 }],
  [9.85, 'low', { d: 3.8, look: 1.9, roll: -0.06 }], [10.1, 'ins'], [10.2, 'three4'], [10.5, 'orbit', { a0: 0.1, a1: 1.3 }], [11.4, 'otsB'],
  [12.0, 'otsA'], [12.45, 'ins'], [12.55, 'ecu', { at: BIND_T }], [12.95, 'side', { d: 3.6, h: 1.5 }], [13.4, 'wide', { d: 6.2 }],
  [14.1, 'low', { d: 4.0, look: 1.1 }], [14.65, 'low', { d: 4.4, look: 2.2, roll: 0.06 }], [15.05, 'ins'], [15.15, 'three4'],
  [15.6, 'faceA'], [16.0, 'faceB'], [16.3, 'trackA', { d: 4.4 }], [16.9, 'low', { d: 5.0, look: 2.4, roll: -0.05 }],
  [FLASH, 'flash'], [FLASH + 3 * DT, 'hero'], [18.4, 'wide', { d: 8 }], [18.85, 'faceB'], [19.3, 'orbit', { a0: 0.3, a1: 0.75, d: 6.5, h: 1.6 }],
];
export function shotAt(t) { let i = 0; for (let j = 0; j < SHOTS.length; j++) if (t >= SHOTS[j][0] - 1e-6) i = j; return { i, t0: SHOTS[i][0], t1: (SHOTS[i + 1] || [TOTAL])[0], label: SHOTS[i][1], o: SHOTS[i][2] || {} }; }
const insIndex = t => INS.findIndex(t0 => t >= t0 - 1e-6 && t < t0 + 3 * DT - 1e-6);
export function blurOK(t) { const l = shotAt(t).label; return l !== 'ins' && l !== 'flash'; }
export function trailGate(c, t) { return shotAt(t).label === 'ins' ? 0 : 1; }

function shake(t) {
  let a = 0; for (const c of CONT) { const d = t - c.t; const amp = c.kind === 'slam' ? 0.16 : c.big ? 0.1 : c.kind === 'kick' ? 0.07 : 0.035; if (d >= 0 && d < 0.32) a = Math.max(a, amp * Math.pow(1 - d / 0.32, 2)); }
  return v3(a * Math.sin(t * 93), a * Math.cos(t * 71), a * Math.sin(t * 57));
}
export function camera(t, cast) {
  const S = shotAt(t), o = S.o, lt = t - S.t0, u = clamp(lt / Math.max(0.01, S.t1 - S.t0));
  const pa = pose('A', t), pb = pose('B', t), A = v3(...pa.pos), B = v3(...pb.pos), mid = A.clone().lerp(B, 0.5);
  const ab = B.clone().sub(A).setY(0); if (ab.length() < 1e-3) ab.set(1, 0, 0); ab.normalize();
  const side = v3(-ab.z, 0, ab.x);
  const fA = v3(Math.sin(pa.yaw * Math.PI / 180), 0, Math.cos(pa.yaw * Math.PI / 180)), fB = v3(Math.sin(pb.yaw * Math.PI / 180), 0, Math.cos(pb.yaw * Math.PI / 180));
  const up = y => v3(0, y, 0), gap = A.distanceTo(B), gy = W.floorAt(mid.x, mid.z);
  const C_ = { A: [A, fA], B: [B, fB] };
  let pos, look, fov = o.fov || 40, roll = o.roll || 0;
  const L_ = S.label;
  switch (L_) {
    case 'est': pos = mid.clone().add(side.clone().multiplyScalar(-15 + 3 * E.io(u))).add(v3(0, gy + 9 - 3 * E.io(u), 0)).setY(gy + 9 - 3 * E.io(u)); look = mid.clone().setY(gy + 1.0); fov = 46 - 6 * u; break;
    case 'trackA': case 'trackB': { const [P_, f] = C_[L_.slice(-1)], s = f.clone().cross(v3(0, 1, 0)).normalize();   // alongside the runner, a little ahead
      pos = P_.clone().add(s.multiplyScalar(-(o.d || 4.0))).add(f.clone().multiplyScalar(1.2)).add(up(0.9)); look = P_.clone().add(up(1.1)).add(f.clone().multiplyScalar(0.9)); fov = 44; roll = roll || -0.03; break; }
    case 'otsA': case 'otsB': { const [P_, f] = C_[L_.slice(-1)], other = L_ === 'otsA' ? B : A;
      pos = P_.clone().add(f.clone().multiplyScalar(-1.9)).add(side.clone().multiplyScalar(L_ === 'otsA' ? 0.95 : -0.95)).add(up(2.0)); look = other.clone().add(up(1.25)); fov = 40; break; }
    case 'faceA': case 'faceB': { const [P_, f] = C_[L_.slice(-1)], s = f.clone().cross(v3(0, 1, 0)).normalize();
      pos = P_.clone().add(f.clone().multiplyScalar(1.8 - 0.2 * u)).add(s.multiplyScalar(0.7)).add(up(1.75)); look = P_.clone().add(up(1.6)); fov = 32; break; }
    case 'low': pos = mid.clone().add(side.clone().multiplyScalar(o.d || Math.max(3.6, gap * 1.1 + 1.6))).setY(gy + 0.3); look = mid.clone().setY(gy + (o.look || 1.4)); fov = 50; break;
    case 'high': pos = mid.clone().add(side.clone().multiplyScalar(2.6)).add(ab.clone().multiplyScalar(-1.6)).setY(gy + 5.8); look = mid.clone().setY(gy + 0.6); fov = 50; break;
    case 'orbit': { const a = Math.PI * ((o.a0 ?? 0.15) + ((o.a1 ?? 1.0) - (o.a0 ?? 0.15)) * u), r = o.d || Math.max(3.6, gap * 1.2 + 1.6);
      pos = mid.clone().add(side.clone().multiplyScalar(Math.cos(a) * r)).add(ab.clone().multiplyScalar(Math.sin(a) * r)).setY(gy + (o.h || 1.45)); look = mid.clone().setY(gy + 1.35); fov = 42; break; }
    case 'ecu': { const c = v3(...(CONT.find(x => Math.abs(x.t - (o.at ?? t)) < 0.02) || { p: mid.toArray() }).p), cc = c.clone().add(up(-0.4));
      pos = cc.clone().add(side.clone().multiplyScalar(1.7 - 0.2 * u)).add(up(0.2)); look = cc; fov = 34; roll = 0.04; break; }
    case 'three4': pos = mid.clone().add(side.clone().multiplyScalar(Math.max(3.4, gap + 2.2) * 0.85)).add(ab.clone().multiplyScalar(-Math.max(3.4, gap + 2.2) * 0.55)).setY(gy + 1.5); look = mid.clone().setY(gy + 1.2); fov = 40; break;
    case 'wide': pos = mid.clone().add(side.clone().multiplyScalar(o.d || 7)).setY(gy + 2.6 - 0.6 * u); look = mid.clone().setY(gy + 1.0); fov = 42; break;
    case 'side': pos = mid.clone().add(side.clone().multiplyScalar((o.d || 5.2) * (1 - 0.06 * u))).setY(gy + (o.h || 1.3)); look = mid.clone().setY(gy + 1.15); fov = 40; break;
    case 'flash': pos = mid.clone().add(side.clone().multiplyScalar(6.4)).setY(gy + 0.9); look = mid.clone().setY(gy + 1.6); break;
    case 'hero': { const m = v3(export_cross.mid[0], gy, export_cross.mid[1]), uu = v3(export_cross.u[0], 0, export_cross.u[1]), pp = v3(export_cross.p[0], 0, export_cross.p[1]);
      pos = m.clone().add(pp.clone().multiplyScalar(-6.8 + 0.6 * E.io(u))).add(uu.clone().multiplyScalar(-1.0)).setY(gy + 1.0); look = m.clone().add(uu.clone().multiplyScalar(0.6)).setY(gy + 1.7); fov = 38; break; }
    case 'ins': { const ii = INS.findIndex(t0 => Math.abs(S.t0 - t0) < 1e-6); const c = CONT.find(x => Math.abs(x.t - INS[ii]) < 0.02) || { p: mid.toArray() };
      const cp_ = v3(...c.p); pos = cp_.clone().add(side.clone().multiplyScalar(ii % 2 ? -2.3 : 2.3)).add(ab.clone().multiplyScalar(0.5)).add(up(0.15)); look = cp_.clone().add(up(-0.25)); fov = 36 + 30 * lt; roll = ii % 2 ? 0.12 : -0.1; break; }
    default: pos = mid.clone().add(side.clone().multiplyScalar(6)).add(up(2)); look = mid.clone().add(up(1.2));
  }
  const hh = v3(0.035 * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 4.3), 0.025 * Math.sin(t * 2.3 + 1), 0.03 * Math.cos(t * 1.9));   // handheld drift
  const sh = shake(t).add(hh); pos.add(sh); look = look.clone().add(sh.clone().multiplyScalar(0.6));
  const fl = W.floorAt(pos.x, pos.z); if (pos.y < fl + 0.15) pos.y = fl + 0.15;
  return { pos, look, fov, roll, label: L_ };
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
  { const pb = rootXZ(FALL_C, FALL_T); puff(soft, t, FALL_T, [pb[0], F, pb[1]], 20, 401, 1.3, 0.4, [0.9, 0.8, 0.62], 1.4); }
  for (const g of GHITS) { const d = t - g.t; if (d < 0 || d > 1) continue;
    puff(soft, t, g.t, g.p, 9, Math.round(g.t * 333), 0.5, 0.5, [0.92, 0.82, 0.62], 0.9); burst(add, t, g.t, [g.p[0], g.p[1] + 0.05, g.p[2]], 14, Math.round(g.t * 777), 0.5); }
  // bind sparks: small repeating bursts
  const bc = CONT.find(x => Math.abs(x.t - BIND_T) < 0.01);
  if (bc) for (let tb = BIND_T + 0.08; tb < BIND_END; tb += 0.11) burst(add, t, tb, bc.p, 14, Math.round(tb * 1000), 0.6);
  // inserts: impact frame then colour frames with chromatic aberration
  const ii = insIndex(t);
  if (ii >= 0) { const f = Math.round((t - INS[ii]) / DT); impact = f === 0 ? 1 : 0; ca = 0.8; bloomBoost = 0.08; }
  if (t >= FLASH && t < FLASH + DT - 1e-6) flash = 1; else if (t >= FLASH + DT - 1e-6 && t < FLASH + 3 * DT - 1e-6) black = 1;
  if (t > FLASH + 3 * DT && t < FLASH + 0.6) ca = 0.7 * (1 - (t - FLASH) / 0.6);
  return { add, soft, flares, rings, debris, flash, black, ca, impact, bloomBoost, sparkLight };
}
