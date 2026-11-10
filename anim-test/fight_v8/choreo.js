// Choreography, cameras and effect timing for the 30 s fight test v8 ("blade masters"). Pure functions of t.
// Modelled on Marlow's Downfall (study §2): fight shots 0.3-0.8 s, long anticipation -> short strike, 2-frame impact
// inserts with flare, knockback that travels, cold palette with warm sparks only, camera always moving.
import * as THREE from 'three';

export const TOTAL = 30.0;
const DT = 1 / 30;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const E = { lin: u => u, io: u => u * u * (3 - 2 * u), o: u => 1 - Math.pow(1 - u, 3), i: u => u * u * u, o2: u => 1 - (1 - u) * (1 - u),
  back: u => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); } };
const JK = ['waist', 'chest', 'head', 'rArm', 'rElbow', 'lArm', 'lElbow', 'rLeg', 'rKnee', 'lLeg', 'lKnee'];

let W = null, F = 30;
export function init(world) { W = world; F = world.FLOOR; buildAll(); simulate(); }
export function resim(track = true) { STEPS.length = 0; simulate(); for (const c of ['A', 'B']) BDT[c] = null; if (track) buildBladeTracks(); }
// v8 = v7 mechanics + NEW choreography (sword skill twirls, strafing/duck/aerial/flurry/bind/finale), sword moves with
// the arm (grip blend), standing skids with sand spray, 1.15x sword, bright overhead sun (fight.js).
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
// v8 poses
L.skid = S(G, { waist: [-4, -10, 0], chest: [-6, -6, 0], head: [-8, 14, 0], rLeg: [-30, 0, -8], rKnee: [40, 0, 0], lLeg: [22, 0, 10], lKnee: [18, 0, 0],
  rArm: [-40, 0, -52], rElbow: [-18, 0, 0], wrist: 150, lArm: [-24, 0, 60], lElbow: [-20, 0, 0], y: -0.3 });   // standing slide (feet drag), never sitting
L.twirlS = S(G, { rArm: [-38, 0, -72], rElbow: [-24, 0, 0], wrist: 90, chest: [2, -14, 0], waist: [6, -8, 0], head: [-6, 22, 0], lArm: [-30, 0, 34], lElbow: [-50, 0, 0],
  rKnee: [26, 0, 0], lKnee: [22, 0, 0], y: -0.1 });                                                              // sword spun at the side
L.twirlF = S(G, { rArm: [-78, 0, -22], rElbow: [-22, 0, 0], wrist: 90, chest: [4, 10, 0], waist: [6, 4, 0], head: [-8, -6, 0], lArm: [-26, 0, 30], lElbow: [-40, 0, 0], y: -0.12 });   // spun in front
L.point = S(G, { rArm: [-96, 0, -6], rElbow: [-4, 0, 0], wrist: 178, chest: [4, 16, 0], waist: [6, 8, 0], head: [-6, -12, 0], lArm: [-16, 0, 36], lElbow: [-20, 0, 0],
  rLeg: [-30, 0, -6], rKnee: [30, 0, 0], lLeg: [26, 0, 6], lKnee: [18, 0, 0], y: -0.12 });                         // blade levelled at the opponent
L.charge = S(G, { waist: [24, -34, 0], chest: [16, -36, 0], head: [-14, 30, 0], rArm: [-34, 0, -40], rElbow: [-60, 0, 0], wrist: 150, lArm: [-84, 0, 18], lElbow: [-96, 0, 0],
  rLeg: [-52, 0, -6], rKnee: [56, 0, 0], lLeg: [34, 0, 6], lKnee: [14, 0, 0], y: -0.3 });                         // shoulder check
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
  knees: [-50, -25], fallen: [-10, -90], skid: [10, -115], twirlS: [0, -90], twirlF: [0, -60], point: [2, 0], charge: [40, -60],
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
const STRIDE = 3.1;   // blocks per full run cycle (right + left step)
function runBody(phi, p) {
  const s = Math.sin(2 * Math.PI * phi);
  p.waist = [16, -20 * s, 0]; p.chest = [8, p.chest[1] + 15 * s, 0]; p.head = [p.head[0], p.head[1] - 6 * s, 0]; p.y = -0.06; return p;
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
const T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] }, TWIRL = { A: [], B: [] };   // TWIRL: [t0, t1, turns]
export const PARRY = [];   // v8: defence keys whose parry pose fight.js re-chooses from the real blade geometry
const k = (c, t, pose, e, d) => T[c].push([t, d ? S(pose, d) : pose, e]);
const at = (c, t, x, z, e) => P[c].push([t, x, z, e]);
export const CLASHES = [];
function SWINGS() { const out = []; for (const c of ['A', 'B']) for (const [t, p, e] of T[c]) if (e === 'i' && t > 2.5) out.push([+t.toFixed(3), c]); return out.sort((a, b) => a[0] - b[0]); }   // {t, big, kind}
const clash = (t, big = false, kind = 'blade', extra = {}) => CLASHES.push({ t, big, kind, ...extra });

function buildAll() {
  // v8 "blade masters" (30 s): new choreography on the v6/v7 mechanics. Sword skill first (twirls), then fast exchanges
  // that keep moving. Skids are standing slides (L.skid + sand spray), never a sitting crouch. x/z = sand, centre (0,0).
  const D = { A: {}, B: {} };                                         // persistent per-character overrides (spin offsets)
  const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
  const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
  const tw = (c, t0, t1, turns) => TWIRL[c].push([t0, t1, turns]);
  const STRIKE = { R: ['windR', 'slashR', 'parryL'], L: ['windL', 'slashL', 'parryR'], O: ['windO', 'slashO', 'parryH'], T: ['windT', 'thrust', 'parryR'] };
  // defence keys go through blk(): the parry pose is re-chosen in fight.js (parryL/R/H, whichever meets the real blade)
  const blk = (def, t0, t1, name, d1 = {}, d2 = {}, e0 = 'o') => { const b0 = { ...D[def] }; K(def, t0, L[name], e0, d1); K(def, t1, L[name], 'lin', d2);
    const k2 = T[def][T[def].length - 1], k1 = T[def][T[def].length - 2]; PARRY.push({ t: t1, def, apply: n => { k1[1] = S(L[n], { ...b0, ...d1 }); k2[1] = S(L[n], { ...b0, ...d2 }); } }); };
  const ex = (att, def, t, s, big = false, wind = 0.16) => { const [w, sl, pa] = STRIKE[s]; K(att, t - wind, L[w], 'o'); K(att, t, L[sl], 'i'); blk(def, t - wind + 0.02, t, pa, {}, s === 'T' ? { waist: [10, 0, -18] } : {}); clash(t, big); };
  const sprint = (c, t0, t1, from, to) => { RUN[c].push([t0, t1]); at(c, t0, from[0], from[1]); at(c, t1, to[0], to[1], 'lin'); };
  // ================= S1 0-2.4  sword skill: both twirl their swords, B points the blade at A =================
  at('A', 0, -3.4, 0); at('A', 2.15, -3.4, 0); at('B', 0, 3.4, 0); at('B', 2.2, 3.4, 0);
  K('A', 0, L.relaxed); K('A', 0.28, L.twirlS, 'io'); K('A', 1.0, L.twirlS, 'lin'); K('A', 1.18, G, 'o'); K('A', 1.9, G, 'io');
  tw('A', 0.3, 1.02, 2);
  K('B', 0, L.relaxed); K('B', 0.8, L.relaxed, 'io'); K('B', 0.95, L.twirlF, 'io'); K('B', 1.62, L.twirlF, 'lin'); K('B', 1.8, L.point, 'o'); K('B', 2.05, L.point, 'lin'); K('B', 2.22, G, 'io');
  tw('B', 0.97, 1.63, 2);
  BR.A.push([0, 2.1]); BR.B.push([0, 2.1]);
  // ================= S2 2.15-5.0  sprint in, exchange while strafing sideways, big clash, both skid apart ==========
  sprint('A', 2.15, 2.72, [-3.4, 0], [-0.62, 0.2]); sprint('B', 2.2, 2.72, [3.4, 0], [0.62, -0.1]);
  K('A', 2.15, L.crouch, 'io', SW); K('A', 2.55, L.guard, 'lin', SW); K('B', 2.22, L.crouch, 'io', SW); K('B', 2.5, L.guard, 'lin', SW);
  const S2 = [[2.95, -0.62, 0.6, 0.66, 0.42], [3.3, -0.7, 1.2, 0.58, 1.0], [3.65, -0.55, 1.8, 0.7, 1.62], [4.0, -0.48, 2.4, 0.8, 2.3], [4.35, -0.56, 2.9, 0.6, 2.85]];
  for (const [t, ax, az, bx, bz] of S2) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); }
  ex('B', 'A', 2.95, 'R', false, 0.3); ex('A', 'B', 3.3, 'R'); ex('B', 'A', 3.65, 'O', false, 0.2); ex('A', 'B', 4.0, 'T', false, 0.18);
  K('A', 4.15, L.windR, 'o'); K('A', 4.35, L.slashR, 'i'); K('B', 4.17, L.windL, 'o'); K('B', 4.35, L.slashL, 'i'); clash(4.35, true);
  at('A', 4.9, -2.6, 3.2, 'o'); at('B', 4.9, 2.5, 2.9, 'o');
  K('A', 4.5, L.skid, 'o'); K('A', 4.85, L.skid, 'lin'); K('A', 5.0, G, 'io'); K('B', 4.5, L.skid, 'o'); K('B', 4.85, L.skid, 'lin'); K('B', 5.0, G, 'io');
  // ================= S3 5.0-7.4  B rushes with a flat cut, A ducks and slips past, spins twice, rising cut =========
  RUN.B.push([5.05, 5.45]); at('B', 5.05, 2.5, 2.9); at('B', 5.5, 0.55, 2.6, 'lin'); at('B', 5.8, 0.15, 2.65, 'o');
  K('B', 5.05, L.crouch, 'io', SW); K('B', 5.35, L.guard, 'lin', SW); K('B', 5.45, L.windL, 'o'); K('B', 5.62, L.slashL, 'i'); K('B', 5.85, L.skid, 'o'); K('B', 6.0, G, 'io');
  at('A', 5.2, -2.6, 3.2); at('A', 5.62, -0.25, 3.62, 'lin'); at('A', 5.95, 1.6, 2.45, 'o');
  K('A', 5.25, G); K('A', 5.45, L.duck, 'o'); K('A', 5.75, L.duck, 'lin'); K('A', 5.92, L.skid, 'o');
  K('A', 6.03, L.spin, 'lin', { yawOff: -200 }); K('A', 6.15, L.slashR, 'i', { yawOff: -360 }); D.A = { yawOff: -360 };
  blk('B', 6.0, 6.15, 'parryL'); clash(6.15);
  K('A', 6.33, L.spin, 'lin', { yawOff: -560 }); K('A', 6.48, L.slashR, 'i', { yawOff: -720 }); D.A = { yawOff: -720 };
  blk('B', 6.32, 6.48, 'parryL', { y: -0.2 }); clash(6.48);
  K('A', 6.64, L.upperW, 'o'); K('A', 6.85, L.upper, 'i'); blk('B', 6.68, 6.85, 'parryR', {}, { y: -0.3 }); clash(6.85, true);
  at('A', 6.15, 1.02, 2.5, 'io'); at('A', 6.48, 1.0, 2.5, 'io'); at('A', 6.85, 0.6, 2.5, 'o'); at('A', 7.15, 1.0, 2.5, 'o');
  at('B', 6.15, 0.08, 2.7, 'io'); at('B', 6.48, -0.25, 2.7, 'io'); at('B', 6.85, -0.62, 2.65, 'o'); at('B', 7.35, -2.6, 2.8, 'o');
  K('A', 7.05, G, 'io'); K('B', 6.98, L.hitBack, 'o'); K('B', 7.08, L.skid, 'o'); K('B', 7.35, L.skid, 'lin'); K('B', 7.5, G, 'io');
  // ================= S4 7.5-9.6  B sprints and leaps into an aerial spinning overhead; A blocks and is driven back ==
  RUN.B.push([7.65, 8.0]); at('B', 7.65, -2.6, 2.8); at('B', 8.06, -0.95, 2.6, 'lin'); at('B', 8.5, 0.05, 2.55, 'lin'); at('B', 8.62, 0.15, 2.55, 'o');
  at('A', 8.3, 1.3, 2.5); at('A', 8.5, 1.35, 2.5); at('A', 9.0, 2.6, 2.4, 'o');
  K('B', 7.65, L.crouch, 'io', SW); K('B', 7.95, L.crouch, 'o', { y: -0.4 }); K('B', 8.08, L.takeoff, 'o', { y: 0.9 });
  K('B', 8.3, L.spin, 'lin', { y: 1.6, yawOff: -180 }); K('B', 8.5, L.slashO, 'i', { y: 0.6, yawOff: -360 }); D.B = { yawOff: -360 };
  K('B', 8.62, L.land, 'o'); K('B', 8.85, G, 'io');
  K('A', 8.2, G); blk('A', 8.35, 8.5, 'parryH', {}, { y: -0.3 }); clash(8.5, true);
  K('A', 8.6, L.skid, 'o'); K('A', 8.95, L.skid, 'lin'); K('A', 9.08, G, 'io');
  at('B', 9.2, 1.4, 2.45, 'io'); at('B', 9.45, 1.6, 2.4, 'io'); at('A', 9.2, 2.75, 2.35, 'io'); at('A', 9.45, 3.0, 2.3, 'io');
  ex('B', 'A', 9.2, 'R', false, 0.15); ex('B', 'A', 9.45, 'L', false, 0.13);
  // ================= S5 9.6-12.1  B thrusts, A deflects and sidesteps, B overruns; A strikes, flourishes, overhead =
  const yB5 = face('B', 9.8, 90);
  K('B', 9.62, L.windT, 'o', { yawAbs: yB5 }); K('B', 9.8, L.thrust, 'i', { yawAbs: yB5 }); K('B', 10.0, L.thrust, 'lin', { yawAbs: yB5, chest: [16, 6, 0] });
  at('B', 9.8, 2.05, 2.35, 'o'); at('B', 10.02, 2.72, 2.25, 'o');
  K('A', 9.62, G); blk('A', 9.7, 9.8, 'parryR', { waist: [10, 0, -20] }, { waist: [10, 0, -20] }); clash(9.8); K('A', 9.95, L.dodge, 'o');
  at('A', 9.8, 3.0, 2.3); at('A', 10.05, 3.2, 3.5, 'o'); at('A', 10.1, 3.15, 3.45, 'io');
  const yB5b = face('B', 10.25, yB5);
  blk('B', 10.13, 10.25, 'parryH', { yawAbs: yB5b }, { yawAbs: yB5b, y: -0.25 }); K('B', 10.45, G, 'io', { yawAbs: face('B', 10.45, yB5b) }); K('B', 10.55, G);
  K('A', 10.1, L.windO, 'o'); K('A', 10.25, L.slashO, 'i'); clash(10.25);
  at('A', 10.25, 3.15, 3.45); at('A', 10.7, 3.6, 4.55, 'o'); at('B', 10.55, 2.85, 2.3); at('B', 11.05, 3.0, 2.9, 'io'); at('B', 11.5, 2.9, 2.8, 'io');
  K('A', 10.42, L.twirlF, 'o'); K('A', 11.02, L.twirlF, 'lin'); tw('A', 10.45, 11.02, 1);
  K('A', 11.3, L.windO, 'o'); K('A', 11.5, L.slashO, 'i'); at('A', 11.2, 3.5, 4.35, 'io'); at('A', 11.5, 3.2, 3.92, 'o');
  blk('B', 11.32, 11.5, 'parryH', {}, { y: -0.32 }); clash(11.5, true);
  at('B', 11.95, 2.6, 1.3, 'o'); K('B', 11.62, L.skid, 'o'); K('B', 11.92, L.skid, 'lin'); K('B', 12.1, G, 'io');
  // ================= S6 12.1-15.1  A drives B back in a straight line: six strikes, B ducks the 7th and counters ==
  at('A', 12.15, 2.7, 2.65, 'io'); at('B', 12.1, 2.62, 1.3);
  const FL = ['R', 'L', 'O', 'R', 'L', 'T'];
  for (let i = 0; i < FL.length; i++) { const t = 12.4 + 0.28 * i, az = 2.5 - 0.33 * i, sx = 0.08 * (i % 2 ? 1 : -1);
    at('A', t, 2.68 + sx, az, 'io'); at('B', t, 2.62 - sx, az - 1.28, 'io'); ex('A', 'B', t, FL[i], false, 0.15); }
  K('A', 13.92, L.windR, 'o'); K('A', 14.08, L.slashR, 'i');                                      // whiff: B ducks under it
  K('B', 13.96, L.duck, 'o'); K('B', 14.12, L.duck, 'lin'); K('B', 14.18, L.upperW, 'o'); K('B', 14.3, L.upper, 'i');
  blk('A', 14.2, 14.3, 'parryR', {}, { y: -0.2 }); clash(14.3, true);
  at('A', 14.08, 2.66, 0.55, 'io'); at('B', 14.08, 2.62, -0.7, 'io'); at('A', 14.3, 2.66, 0.5); at('B', 14.3, 2.62, -0.58, 'o');
  at('A', 15.0, 2.6, 2.3, 'o'); K('A', 14.45, L.hitBack, 'o', { y: 0.2 }); K('A', 14.6, L.skid, 'o'); K('A', 14.95, L.skid, 'lin'); K('A', 15.1, G, 'io');
  K('B', 14.55, G, 'io');
  // ================= S7 15.1-17.5  stalking, B's twirl, running thrust, A deflects aside, jump slash at the skid ===
  at('A', 15.1, 2.6, 2.3); at('A', 15.95, 1.6, 2.6, 'io'); at('B', 14.6, 2.62, -0.58); at('B', 15.95, 3.4, -0.9, 'io');
  BR.A.push([15.1, 16.2]); BR.B.push([14.6, 16.0]);
  K('B', 15.05, L.twirlS, 'io'); K('B', 15.78, L.twirlS, 'lin'); K('B', 15.95, G, 'io'); tw('B', 15.12, 15.78, 2);
  K('A', 15.4, G); K('A', 16.1, G);
  RUN.B.push([16.0, 16.38]); at('B', 16.0, 3.4, -0.9); at('B', 16.5, 2.05, 1.6, 'lin'); at('B', 16.95, 0.7, 3.9, 'o');
  K('B', 16.0, L.crouch, 'io', SW); K('B', 16.3, L.windT, 'o'); K('B', 16.5, L.thrust, 'i'); K('B', 16.7, L.skid, 'o'); K('B', 16.95, L.skid, 'lin');
  at('A', 16.2, 1.6, 2.6); at('A', 16.55, 0.9, 1.7, 'o');
  K('A', 16.32, G); blk('A', 16.42, 16.5, 'parryR', { waist: [10, 0, -20] }, { waist: [10, 0, -20] }); clash(16.5); K('A', 16.62, L.dodge, 'o');
  K('A', 16.75, L.crouch, 'o', { y: -0.35 }); K('A', 16.86, L.takeoff, 'o', { y: 0.7 }); K('A', 17.0, L.windO, 'o', { y: 1.2 }); K('A', 17.18, L.slashO, 'i', { y: 0.4 });
  at('A', 16.75, 0.9, 1.7); at('A', 17.18, 0.85, 2.72, 'o');
  blk('B', 17.02, 17.18, 'parryH', {}, { y: -0.3 }); clash(17.18, true);
  K('A', 17.32, L.land, 'o'); K('A', 17.48, G, 'io'); K('B', 17.36, G, 'io');
  // ================= S8 17.5-20.5  low sweep -> A hops it and cuts in the air; thrust dodged; trade; shoulder check =
  K('B', 17.56, L.sweepW, 'o'); K('B', 17.75, L.sweep, 'i');
  K('A', 17.6, L.crouch, 'o', { y: -0.3 }); K('A', 17.7, L.takeoff, 'o', { y: 0.75 }); K('A', 17.82, L.windO, 'o', { y: 0.9 }); K('A', 17.98, L.slashO, 'i', { y: 0.3 });
  blk('B', 17.86, 17.98, 'parryH', { y: -0.35 }, { y: -0.4 }); clash(17.98);
  K('A', 18.12, L.land, 'o'); K('A', 18.3, G, 'io'); K('B', 18.15, G, 'io');
  K('B', 18.3, L.windT, 'o'); K('B', 18.45, L.thrust, 'i'); K('A', 18.3, G); K('A', 18.42, L.dodge, 'o'); at('A', 18.3, 0.85, 2.72); at('A', 18.5, 1.4, 2.8, 'o');
  ex('A', 'B', 18.7, 'R', false, 0.15); ex('B', 'A', 18.95, 'O', false, 0.15);
  K('A', 19.1, L.windO, 'o'); K('B', 19.12, L.crouch, 'o', { y: -0.2 }); K('B', 19.25, L.charge, 'i');
  at('B', 18.95, 0.98, 3.65, 'io'); at('B', 19.05, 0.98, 3.65); at('B', 19.25, 1.25, 3.25, 'o');
  clash(19.25, false, 'kick', { at: () => { const q = pose('A', 19.27).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  at('A', 19.25, 1.4, 2.8); at('A', 19.7, 1.9, 1.2, 'o');
  K('A', 19.27, L.hitBack, 'o'); K('A', 19.4, L.skid, 'o'); K('A', 19.7, L.skid, 'lin');
  K('A', 19.85, L.twirlF, 'o'); K('A', 20.3, L.twirlF, 'lin'); K('A', 20.45, G, 'io'); tw('A', 19.86, 20.3, 1);
  K('B', 19.5, G, 'io'); at('B', 20.4, 1.6, 2.5, 'io');
  // ================= S9 20.5-24.6  both spin-cut into a blade lock that drifts, shove, B's three, A's riposte =======
  at('A', 20.45, 1.9, 1.2); at('A', 20.78, 1.8, 1.55, 'o'); at('B', 20.78, 1.65, 2.6, 'o');
  K('A', 20.5, G); K('A', 20.64, L.spin, 'lin', { yawOff: -920 }); K('A', BIND_T, L.slashR, 'i', { yawOff: -1080 }); D.A = { yawOff: -1080 };
  K('B', 20.5, G); K('B', 20.64, L.spin, 'lin', { yawOff: -160 }); K('B', BIND_T, L.slashL, 'i', { yawOff: 0 }); D.B = { yawOff: 0 };
  clash(BIND_T, true);
  K('A', BIND_T + 0.06, L.bind, 'o'); K('B', BIND_T + 0.06, L.bind, 'o');
  for (let t = BIND_T + 0.18; t < BIND_END; t += 0.12) { const s = Math.sin(t * 40) * 0.5 + 0.5;
    K('A', t, L.bind, 'io', { chest: [22 + 8 * s, 10, 0], y: -0.3 - 0.06 * s, lArm: [-80 + 10 * s, 0, 30] }); K('B', t, L.bind, 'io', { chest: [22 + 8 * (1 - s), 10, 0], y: -0.3 - 0.06 * (1 - s) }); }
  at('A', BIND_END, 2.95, 1.6, 'io'); at('B', BIND_END, 2.8, 2.65, 'io');
  K('B', 21.6, L.thrust, 'o', { rArm: [-80, 0, 0], lArm: [-90, 0, 20], lElbow: [-10, 0, 0], y: -0.3 }); K('B', 21.85, G, 'io');
  clash(21.6, false, 'kick', { at: () => { const q = pose('A', 21.62).pos; return [q[0], q[1] + 1.2, q[2]]; } });
  K('A', 21.62, L.hitBack, 'o'); K('A', 21.75, L.skid, 'o'); K('A', 22.05, L.skid, 'lin'); K('A', 22.2, G, 'io');
  at('A', 21.6, 2.95, 1.6); at('A', 22.05, 3.1, -0.05, 'o'); at('B', 21.6, 2.8, 2.65, 'o');
  const S9 = [[22.45, 'B', 'R', 3.05, 0.0, 2.95, 1.2], [22.7, 'B', 'L', 3.05, -0.3, 2.95, 0.9], [22.95, 'B', 'O', 3.0, -0.6, 2.9, 0.6],
              [23.25, 'A', 'T', 3.0, -0.55, 2.95, 0.68], [23.55, 'B', 'O', 3.0, -0.7, 2.95, 0.52], [23.85, 'A', 'L', 3.05, -0.55, 3.0, 0.68]];   // 23.85 is made big below: both blown apart
  for (const [t, att, s, ax, az, bx, bz] of S9) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); ex(att, att === 'A' ? 'B' : 'A', t, s, t === 23.85, 0.15); }
  at('A', 24.5, 3.3, -3.6, 'o'); at('B', 24.5, 2.75, 3.9, 'o');
  K('A', 24.08, L.skid, 'o'); K('A', 24.45, L.skid, 'lin'); K('A', 24.6, G, 'io'); K('B', 24.08, L.skid, 'o'); K('B', 24.45, L.skid, 'lin'); K('B', 24.6, G, 'io');
  // ================= S10 24.6-30  mirrored twirl standoff, sprint, A slides under B's cut and rips upward; B falls ===
  K('A', 24.72, L.twirlS, 'io'); K('A', 25.28, L.twirlS, 'lin'); tw('A', 24.75, 25.28, 2);
  K('B', 24.78, L.twirlF, 'io'); K('B', 25.3, L.twirlF, 'lin'); tw('B', 24.8, 25.3, 2);
  { const pa = evalPosT('A', 24.5), pb = evalPosT('B', 24.5), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    const m = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], P_ = (s) => [m[0] + ux * s, m[1] + uz * s];
    at('A', 25.4, pa[0], pa[1]); at('B', 25.45, pb[0], pb[1]);
    RUN.A.push([25.45, 25.92]); RUN.B.push([25.5, 25.9]);
    at('A', 25.95, ...P_(-1.25), 'lin'); at('A', 26.1, ...P_(-0.5), 'lin'); at('A', 26.4, ...P_(-0.15), 'o');
    at('B', 25.92, ...P_(0.9), 'lin'); at('B', 26.08, ...P_(0.7), 'o');
    at('B', FLASH, ...P_(0.8)); at('B', 26.85, ...P_(3.2), 'o'); at('B', 27.3, ...P_(3.8), 'o'); at('B', 30, ...P_(3.8));
    at('A', 30, ...P_(-0.15));
    export_cross.mid = m; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  K('A', 25.4, G); K('A', 25.48, L.crouch, 'io', SW); K('A', 25.8, L.guard, 'lin', SW); K('A', 25.95, L.duck, 'o'); K('A', 26.12, L.duck, 'lin');
  K('A', 26.2, L.upperW, 'o'); K('A', FLASH, L.upper, 'i'); K('A', 26.65, G, 'io');
  K('B', 25.45, G); K('B', 25.52, L.crouch, 'io', SW); K('B', 25.78, L.guard, 'lin', SW); K('B', 25.92, L.windL, 'o'); K('B', 26.08, L.slashL, 'i');
  blk('B', 26.24, FLASH, 'parryR', {}, { y: -0.2 }); clash(FLASH, true, 'cross');
  K('B', 26.5, L.hitBack, 'o', { y: 0.3 }); K('B', 26.85, L.land, 'i'); K('B', 26.98, L.skid, 'o'); K('B', 27.28, L.skid, 'lin'); K('B', FALL_T - 0.3, L.knees, 'io');
  K('B', FALL_T, L.kneelG, 'o'); K('B', 30, L.kneelG, 'lin', { head: [20, 0, 0] });
  BR.A.push([26.6, 30]); BR.B.push([26.6, 30]);
  K('A', 27.2, L.relaxed, 'io'); K('A', 27.55, L.twirlS, 'io'); K('A', 28.3, L.twirlS, 'lin'); tw('A', 27.6, 28.3, 2);
  K('A', 28.55, L.flick, 'o'); K('A', 29.1, L.relaxed, 'io'); K('A', 30, L.relaxed, 'io');
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
// helpers for buildAll: angle wrap toward a reference, planned position lookup before sorting is final
function near(a, ref) { while (a - ref > 180) a -= 360; while (a - ref < -180) a += 360; return a; }
function evalPosT(c, t) { const K_ = P[c].slice().sort((a, b) => a[0] - b[0]); return evalPos(K_, t); }
function face(c, t, ref = 0) { const o = c === 'A' ? 'B' : 'A', a = evalPosT(c, t), b = evalPosT(o, t); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); }
let BIND_C = [0, 0], SH = null;

export const export_cross = {};
export function events() { return { steps: STEPS.map(s => [+s.t.toFixed(3), s.kind, +(s.sp || 0).toFixed(2), s.c, s.foot, s.run ? 1 : 0]), slides: SLIDES, ghits: GHITS.map(g => +g.t.toFixed(3)), clashes: CONT.map(c => [c.t, c.big, c.kind]), swings: SWINGS(), twirls: TWIRLS(), ins: INS.slice(), flash: FLASH }; }
function TWIRLS() { const out = []; for (const c of ['A', 'B']) for (const [t0, t1, n] of TWIRL[c]) { let k = 1;
  for (let t = t0; t <= t1 && k <= 2 * n; t += 1 / 480) if (n * 2 * E.io(clamp((t - t0) / (t1 - t0))) >= k - 0.5) { out.push([+t.toFixed(3), c]); k++; } }
  return out.sort((a, b) => a[0] - b[0]); }

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
    const sw = clamp((t1 - 0.12 - t) / 0.2), rb = runBody(phi, cp(p)), r = mix(runArms(phi, cp(rb), false), runArms(phi, cp(rb), true), sw);
    Object.assign(p, mix(p, r, blend));
  }
  // breathing (bigger after exertion)
  let amp = 1; for (const [t0, t1] of BR[c]) if (t >= t0 && t <= t1) amp = 2.6;
  const ph = c === 'A' ? 0 : 1.7;
  p.chest[0] += 1.4 * amp * Math.sin(t * 3.1 + ph); p.head[0] -= 1.2 * amp * Math.sin(t * 3.1 + ph + 0.4);   // BAD removed: p.y += 0.008*amp*sin (breath bobbed the legs)
  const o = c === 'A' ? 'B' : 'A', [ox, oz] = rootXZ(o, t);
  const yaw = p.yawAbs != null ? p.yawAbs : Math.atan2(ox - x, oz - z) * 180 / Math.PI;
  let X = x, Z = z;
  if (p._fw) { const dd = Math.hypot(ox - x, oz - z) || 1; X += (ox - x) / dd * p._fw; Z += (oz - z) / dd * p._fw; }   // clash step-in
  p.pos = [X, p.y, Z]; p.yaw = yaw + p.yawOff;
  return p;
}

// ------------------------------------------------------------------ simulation: collision + footstep planner (240 Hz, precomputed)
const HZ = 240; const SIM = { A: null, B: null }; export const STEPS = [];   // {c, t, foot, p:[x,0,z], kind:'step'|'land'|'skid'|'lift', sp}
export const SLIDES = { A: [[4.42, 4.85], [5.85, 6.0], [8.55, 9.0], [14.5, 14.95], [19.3, 19.7], [21.7, 22.05], [24.08, 24.5], [25.95, 26.3]],
                        B: [[4.42, 4.85], [5.78, 6.0], [7.0, 7.35], [11.55, 11.95], [16.62, 16.95], [24.08, 24.5], [26.9, 27.3]] };
const inWin = (L, t) => L.some(([a, b]) => t >= a && t <= b);
const _eu = new THREE.Euler(), _v1 = new THREE.Vector3();
function legFK(leg, knee, hipX, wide = 1) {   // desired sole offset in the body frame (px) from the authored FK leg angles
  _eu.set(leg[0] * Math.PI / 180, leg[1] * Math.PI / 180, leg[2] * Math.PI / 180, 'XYZ'); const R1 = new THREE.Quaternion().setFromEuler(_eu);
  _eu.set(knee[0] * Math.PI / 180, 0, 0, 'XYZ'); const R2 = new THREE.Quaternion().setFromEuler(_eu);
  _v1.set(0, -6, 0).applyQuaternion(R2).add(new THREE.Vector3(0, -6, 0)).applyQuaternion(R1);
  const sx = hipX + _v1.x * (1.2 + 0.25 * wide); return [Math.sign(hipX) * Math.max(1.5 + 0.4 * wide, Math.abs(sx)), _v1.z * (1.15 + 0.2 * wide)];
}
function yEff(p) { if (isAir(p) || p.y >= 0) return isAir(p) ? p.y : p.y * 0.8; const a = -p.y; return -(0.25 * a + 0.75 * Math.max(0, a - 0.3)); }   // guard -0.14 -> -0.035 (light athletic bend), slam -0.62 -> -0.4
function isAir(p) { return p.y > 0.22 || Math.abs(p.tilt[0]) > 30; }
const XMIN = 0.22;   // min lateral gap between the feet (blocks, about 3.5 px): legs never cross over (cross_qa.js)
function runGait(c, root, rawXZ, N, rawP) {
  // returns per-index overrides { r:[x,y,z]|undefined, l:..., yoff } inside run windows, plus contact events
  const g = { r: new Array(N), l: new Array(N), yoff: new Float32Array(N), ev: [] };
  for (const [t0, t1] of RUN[c]) {
    const i0 = Math.round(t0 * HZ), i1 = Math.min(N - 1, Math.round(t1 * HZ)), a = rawXZ[i0];
    const phiAt = i => Math.hypot(rawXZ[i][0] - a[0], rawXZ[i][1] - a[1]) / STRIDE;
    const con = [];                                   // contacts in time order: {i, f, p}
    for (let i = i0 + 1; i <= i1; i++) {
      const p0 = phiAt(i - 1), p1 = phiAt(i);
      for (const [f, off] of [['r', 0.12], ['l', 0.62]]) if (Math.floor(p0 - off) < Math.floor(p1 - off)) {
        const vx = root[i][0] - root[Math.max(i0, i - 6)][0], vz = root[i][1] - root[Math.max(i0, i - 6)][1], vn = Math.hypot(vx, vz) || 1;
        const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1;            // right foot on the right of travel: right = (-fz, fx)
        const yl = rawP[i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl);   // body LEFT in world (not travel-relative)
        con.push({ i, f, p: [root[i][0] + fx * 0.28 + side * 0.15 * lx, root[i][1] + fz * 0.28 + side * 0.15 * lz] });
      }
    }
    { const mk = (i, f) => { const vx = root[i][0] - root[Math.max(i0, i - 6)][0], vz = root[i][1] - root[Math.max(i0, i - 6)][1], vn = Math.hypot(vx, vz) || 1;
        const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1, yl = rawP[i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl); return { i, f, p: [root[i][0] + fx * 0.28 + side * 0.15 * lx, root[i][1] + fz * 0.28 + side * 0.15 * lz] }; };
      for (const f of ['r', 'l']) { const fc = con.find(q => q.f === f), lim = fc ? fc.i : i1; if (fc && (fc.i - i0) / HZ <= 0.2) continue;
        let ie = i0 + 1; while (ie < lim && phiAt(ie) < 0.06) ie++; ie = Math.min(ie + Math.round(0.06 * HZ), lim - Math.round(0.12 * HZ)); if (ie > i0) con.push(mk(ie, f)); }
      con.sort((a, b) => a.i - b.i); }
    { const last = {}; for (const q of con) { const o = q.f === 'r' ? 'l' : 'r', sg = q.f === 'l' ? 1 : -1;   // no crossover: land on your own side of the other foot
        if (last[o]) { const yl = rawP[q.i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl), s = (q.p[0] - last[o][0]) * lx + (q.p[1] - last[o][1]) * lz;
          if (sg * s < XMIN) { const k = sg * XMIN - s; q.p = [q.p[0] + lx * k, q.p[1] + lz * k]; } }
        last[q.f] = q.p; } }
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
      for (let i = a_; i < b_; i++) { const u = (i - a_) / Math.max(1, b_ - a_); g.yoff[i] = -0.025 * Math.cos(2 * Math.PI * (u - 0.25)) - 0.01; } }
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
    const feet = { r: null, l: null }, step = { r: null, l: null }, outs = { r: [], l: [] }, Dsm = { r: null, l: null }, lastStep = { r: -9, l: -9 }, rec = { r: null, l: null };
    const rawXZ = raw[c].map(p => [p.pos[0], p.pos[2]]), G = runGait(c, root, rawXZ, N, raw[c]), entry = {};
    for (const e of G.ev) STEPS.push({ c, t: e.t, foot: e.f, p: [e.p[0], 0, e.p[1]], kind: 'step', sp: 5, run: true });
    for (let i = 0; i < N; i++) {
      const t = i / HZ, p = raw[c][i], air = isAir(p), yaw = p.yaw * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
      let dyF = raw[c][Math.min(N - 1, i + Math.round(0.15 * HZ))].yaw - p.yaw; dyF -= 360 * Math.round(dyF / 360);   // no-crossover lookahead (turn capped at
      const yawF = yaw + Math.max(-45, Math.min(45, dyF)) * Math.PI / 180, cyF = Math.cos(yawF), syF = Math.sin(yawF);   // 45 deg: in a spin both sides must stay compatible)
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
        const off = legFK(leg, knee, hx, p.wide ?? 1), lx = off[0] / 16, lz = off[1] / 16;
        const Dr = [root[i][0] + lx * cy + lz * sy, root[i][1] - lx * sy + lz * cy];
        Dsm[f] = Dsm[f] ? [lerp(Dsm[f][0], Dr[0], 1), lerp(Dsm[f][1], Dr[1], 1)] : Dr.slice(); const D = Dsm[f];
        { const sgn = f === 'l' ? 1 : -1, lx = Math.cos(yaw), lz = -Math.sin(yaw), s_ = (D[0] - root[i][0]) * lx + (D[1] - root[i][1]) * lz;   // keep each foot on its own side
          if (sgn * s_ < 0.07) { const kk = 0.07 * sgn - s_; D[0] += lx * kk; D[1] += lz * kk; }   // ~0.1 s low-pass
          const o_ = f === 'r' ? 'l' : 'r', ref = step[o_] ? step[o_].to : feet[o_]; if (ref) for (const [ax, az] of [[lx, lz], [cyF, -syF]]) {   // and of the other foot
            const s2 = (D[0] - ref[0]) * ax + (D[1] - ref[1]) * az; if (sgn * s2 < XMIN) { const kk = XMIN * sgn - s2; D[0] += ax * kk; D[1] += az * kk; } } }
        if (fk) { if (feet[f]) STEPS.push({ c, t, foot: f, p: [feet[f][0], 0, feet[f][1]], kind: 'lift' }); feet[f] = null; step[f] = null; out.push(null); continue; }
        if (!feet[f]) { feet[f] = D.slice(); STEPS.push({ c, t, foot: f, p: [D[0], 0, D[1]], kind: 'land', sp }); }
        if (skid) { feet[f] = [lerp(feet[f][0], D[0], 0.25), lerp(feet[f][1], D[1], 0.25)]; step[f] = null;
          if (f === 'l' && feet.r) for (const [ax, az] of [[cy, -sy], [cyF, -syF]]) { const s3 = (feet.l[0] - feet.r[0]) * ax + (feet.l[1] - feet.r[1]) * az;   // no crossover while sliding
            if (s3 < XMIN) { const kk = (XMIN - s3) / 2; feet.l = [feet.l[0] + ax * kk, feet.l[1] + az * kk]; feet.r = [feet.r[0] - ax * kk, feet.r[1] - az * kk]; } } if (i % 12 === 0) STEPS.push({ c, t, foot: f, p: [feet[f][0], 0, feet[f][1]], kind: 'skid' }); out.push([feet[f][0], 0, feet[f][1]]); continue; }
        if (i > 0 && inWin(SLIDES[c], (i - 1) / HZ) && feet[f] && rec[f] == null) rec[f] = t + (f === 'r' ? 0 : 0.07);   // slide just ended
        if (rec[f] != null && t >= rec[f] && !step[f]) { const sd = f === 'r' ? -1 : 1; step[f] = { from: feet[f].slice(), to: [root[i][0] + sd * 0.14 * cy + 0.05 * sy + vx * 0.12, root[i][1] - sd * 0.14 * sy + 0.05 * cy + vz * 0.12], t0: t, dur: 0.15, h: 0.16 }; rec[f] = null; }   // neutral stance under the hips
        const o = f === 'r' ? 'l' : 'r';
        if (step[f]) {
          const s_ = step[f], u = Math.min(1, (t - s_.t0) / s_.dur), uh = Math.min(1, u / 0.85), w = uh * uh * (3 - 2 * uh);
          if (u < 0.85) s_.to = [lerp(s_.to[0], D[0] + vx * (s_.dur * (1 - u)) * 0.6, 0.15), lerp(s_.to[1], D[1] + vz * (s_.dur * (1 - u)) * 0.6, 0.15)];
          { const o2 = f === 'r' ? 'l' : 'r', rf = feet[o2]; if (rf && !step[o2]) { const sg = f === 'l' ? 1 : -1, g = (s_.to[0] - rf[0]) * cy - (s_.to[1] - rf[1]) * sy;   // but never plant across
            if (sg * g < XMIN) { const k = sg * XMIN - g; s_.to = [s_.to[0] + cy * k, s_.to[1] - sy * k]; } } }
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
        const gapAt = (ax, az) => (f === 'l' ? 1 : -1) * ((feet[f][0] - feet[o][0]) * ax + (feet[f][1] - feet[o][1]) * az);
        const crossed = feet[o] && !step[o] && Math.min(gapAt(cy, -sy), gapAt(cyF, -syF)) < XMIN * 0.6 && t - lastStep[f] > 0.04;
        if (crossed || (err > 0.17 && rested && !otherBusy && !(step[o] == null && feet[o] && errO > err * 1.4 && reach < 0.5)) || (reach > Math.max(0.5, Math.hypot(D[0] - root[i][0], D[1] - root[i][1]) + 0.15) && Math.hypot(feet[f][0] - D[0], feet[f][1] - D[1]) > 0.08 && !step[f] && t - lastStep[f] > 0.06)) {
          const run = sp > 2.5, dur = run ? Math.max(0.12, Math.min(0.18, 0.75 / sp)) : crossed ? 0.12 : Math.min(0.26, Math.max(0.15, 0.1 + 0.12 * err));   // crossed: quick side step
          step[f] = { from: feet[f].slice(), to: [D[0] + vx * dur * 0.75, D[1] + vz * dur * 0.75], t0: t, dur, h: run ? 0.28 : crossed ? 0.14 : Math.min(0.26, 0.07 + 0.24 * err) };
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
    // pelvis drop from planted feet only, smoothed (was per-frame in poseRaw from lifted feet too -> bounce on every step)
    const dropRaw = new Float32Array(N);
    for (let i = 0; i < N; i++) { const p = raw[c][i], yawR = p.yaw * Math.PI / 180, rt = root2[i];
      const hipY = W.floorAt(rt[0], rt[1]) + yEff(p) + 0.035 + G.yoff[i] + 0.75; let drop = 0;
      for (const [f, hx] of [['r', -2 / 16], ['l', 2 / 16]]) { const q = outs[f][i]; if (!q) continue;
        const fy = W.floorAt(q[0], q[2]) + 0.035, hxw = rt[0] + hx * Math.cos(yawR), hzw = rt[1] - hx * Math.sin(yawR), dh = Math.hypot(q[0] - hxw, q[2] - hzw), reach = 0.748;   // real leg length (0.735 bent idle knees ~24 deg)
        if (dh < reach * 0.97) { const need = hipY - fy - Math.sqrt(reach * reach - dh * dh); if (need > drop) drop = need; } }   // out-of-reach (trailing) feet are about to step: never sink the hips for them (that folded knees through the sand)
      dropRaw[i] = Math.min(0.42, drop); }
    const SGd = Math.round(0.11 * HZ), dropS = []; for (let i = 0; i < N; i++) { let a = 0, w = 0; for (let j = -3 * SGd; j <= 3 * SGd; j += 4) { const q = dropRaw[Math.min(N - 1, Math.max(0, i + j))], g = Math.exp(-0.5 * (j / SGd) ** 2); a += q * g; w += g; } dropS.push([a / w]); }
    SIM[c] = { root: root2, raw: rawXZ, r: outs.r, l: outs.l, yoff: Array.from(G.yoff, v => [v]), drop: dropS };
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
const GK = QS_.has('gk') ? +QS_.get('gk') : 0.38;              // v8 grip blend weight
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
  // v8: the sword follows the forearm (rigid-grip blend in the rig), eased off around contacts so the clash solve stays exact
  { let m = 1; for (const cl of CLASHES) { const d = Math.abs(t - cl.t); if (d < 0.14) m = Math.min(m, 0.35 + 0.65 * E.io(d / 0.14)); }
    // and where the sword arm itself whips (> ~25 deg/frame), so a fast arm can't snap the blade more than a frame's worth
    const q0 = evalKeysS(T[c], t - 1 / 60), q1 = evalKeysS(T[c], t + 1 / 60), av = Math.max(...[0, 1, 2].map(i => Math.abs(q1.rArm[i] - q0.rArm[i]) + Math.abs(q1.rElbow[i] - q0.rElbow[i])));
    m *= clamp(1 - (av - 25) / 35); p.gk = GK * m; }
  // v8: sword twirls - the blade spins about the forearm; fades in/out over 0.14 s around each window
  p.spinK = 0; p.spin = 0;
  for (const [t0, t1, n] of TWIRL[c]) if (t > t0 - 0.12 && t < t1 + 0.12) { p.spin = 360 * n * E.io(clamp((t - t0) / (t1 - t0))); p.spinK = clamp(Math.min((t - t0 + 0.12) / 0.14, (t1 + 0.12 - t) / 0.14)); }
  const S_ = SIM[c], rt = samp(S_.root, t), rw = samp(S_.raw, t), X = rt[0] + p.pos[0] - rw[0], Z = rt[1] + p.pos[2] - rw[1], g = W.floorAt(X, Z);
  p.pos = [X, g + yEff(p) + 0.035 + samp(S_.yoff, t)[0], Z];
  { const o = c === 'A' ? 'B' : 'A', ro = samp(SIM[o].root, t); p.opp = [ro[0], W.floorAt(ro[0], ro[1]), ro[1]]; }
  const fr = samp(S_.r, t), fl = samp(S_.l, t);
  { const sw = f => f && f[1] > 0.004 ? Math.min(1, f[1] / 0.08) : 0, rs = sw(fr), ls = sw(fl);
    // weight shift: swinging right foot -> hips over the left (stance) foot, spine bends back to keep the head centred
    // BAD (do not restore): v7 applied this gait overlay on EVERY planner step at full strength (shift 7, twist 11, head
    // counter-turn 0.35 x torso yaw). Fighting on the spot the planner re-steps ~4.7x/s, so the hips tilted +-7 deg and the
    // pelvis twisted +-11 deg every 0.1-0.15 s and the head yaw toggled -> the whole body shook back and forth (user:
    // "characters are shaking back and forth so much"). Fixed: the overlay only applies in proportion to real travel speed.
    const r0 = samp(S_.root, Math.max(0, t - 0.04)), r1 = samp(S_.root, Math.min(TOTAL, t + 0.04)), gsp = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]) / 0.08;
    const gate = clamp((gsp - 0.8) / 1.6);                      // 0 standing / shuffling, 1 from ~2.4 blocks/s (walk-run)
    const shift = (ls - rs) * gate; p.waist[2] += 5 * shift; p.chest[2] -= 3.5 * shift; p.head[2] -= 2 * shift;
    // pelvis rotates with the swinging leg, shoulders counter-rotate (contralateral gait), head holds its aim
    const twist = 8 * (rs - ls) * gate; p.waist[1] += twist; p.chest[1] -= twist * 1.4; p.head[1] -= (p.waist[1] + p.chest[1]) * 0.35 * Math.max(rs, ls) * gate; }
  // breathing in the ribcage (not the hips): chest pitch + small shoulder rise
  { const ph = c === 'A' ? 0 : 1.7, amp = inWin(BR[c], t) ? 2.4 : 1; p.chest[0] -= 1.1 * amp * Math.sin(t * 3.1 + ph); }
  if (fr || fl) { p.ik = {}; for (const [k, f] of [['r', fr], ['l', fl]]) if (f) p.ik[k] = [f[0], W.floorAt(f[0], f[2]) + f[1] + 0.035, f[2]];
    // pelvis drop: lower the hips until every planted foot is within leg reach (wide stances sit low, nothing floats)
    p.pos[1] -= samp(S_.drop, t)[0]; }   // smoothed planted-foot pelvis drop from the planner (see simulate)
  return p;
}

// ------------------------------------------------------------------ contacts (set by fight.js from the real blade geometry)
let CONT = [];
export function setContacts(c) { CONT = c; }
let GHITS = []; export function setGroundHits(g) { GHITS = g; }
const BIG = () => CONT.filter(c => c.big && c.kind === 'blade');

// ------------------------------------------------------------------ shots
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const INS = [4.35, 6.85, 8.5, 11.5, 14.3, 17.18, 20.78];   // impact inserts: 1 impact frame + 2 colour frames
const FLASH = 26.38, BIND_T = 20.78, BIND_END = 21.5, FALL_T = 27.75, FALL_C = 'B';
// v8 shots: [time, label, opts]. Same shot machinery as v7, plus 'handA'/'handB' close-ups for the sword twirls.
const SHOTS = [
  [0.0, 'est'], [0.3, 'handA'], [0.95, 'handB'], [1.7, 'three4'], [2.15, 'trackA', { d: 3.8 }], [2.55, 'low', { d: 4.4, look: 1.4 }],
  [2.85, 'side', { d: 4.4, h: 1.3 }], [3.4, 'otsA'], [3.85, 'orbit', { a0: 0.2, a1: 0.7 }], [4.35, 'ins'], [4.45, 'wide', { d: 7 }],
  [4.95, 'trackB'], [5.4, 'low', { d: 3.6, look: 1.0, roll: -0.05 }], [5.85, 'three4'], [6.3, 'otsB'], [6.6, 'side', { d: 4.2 }], [6.85, 'ins'],
  [6.95, 'wide', { d: 6.5 }], [7.6, 'trackB', { d: 4 }], [8.05, 'low', { d: 4.6, look: 2.2, roll: 0.05 }], [8.5, 'ins'], [8.6, 'high'],
  [9.0, 'otsB'], [9.5, 'side', { d: 4.8 }], [10.0, 'three4'], [10.45, 'handA'], [11.05, 'low', { d: 4.0, look: 1.6 }], [11.5, 'ins'],
  [11.6, 'wide', { d: 6.8 }], [12.2, 'otsA'], [12.75, 'orbit', { a0: 0.1, a1: 0.8 }], [13.5, 'side', { d: 4.2, h: 1.4 }],
  [13.95, 'low', { d: 3.8, look: 1.0, roll: -0.04 }], [14.3, 'ins'], [14.4, 'three4'], [15.05, 'wide', { d: 7.5 }], [15.25, 'handB'],
  [15.9, 'trackB', { d: 4.2 }], [16.4, 'otsA'], [16.75, 'low', { d: 4.4, look: 2.0, roll: 0.05 }], [17.18, 'ins'], [17.28, 'three4'],
  [17.6, 'low', { d: 3.8, look: 1.2 }], [18.15, 'side', { d: 4.6 }], [18.6, 'otsB'], [19.1, 'three4'], [19.3, 'wide', { d: 6.5 }],
  [19.8, 'handA'], [20.4, 'orbit', { a0: 0.3, a1: 0.9 }], [20.78, 'ins'], [20.78 + 0.1, 'side', { d: 3.4, h: 1.4 }], [21.3, 'side', { d: 3.8, h: 1.5 }],
  [21.6, 'wide', { d: 6.2 }], [22.3, 'otsB'], [22.85, 'side', { d: 4.4 }], [23.3, 'orbit', { a0: -0.2, a1: 0.5 }], [24.0, 'wide', { d: 8.5 }],
  [24.65, 'handA'], [25.05, 'handB'], [25.4, 'trackA', { d: 4.4 }], [25.85, 'low', { d: 5.0, look: 1.6, roll: -0.05 }],
  [FLASH, 'flash'], [FLASH + 3 * DT, 'hero'], [27.1, 'wide', { d: 8 }], [27.55, 'handA'], [28.4, 'faceA'], [28.9, 'orbit', { a0: 0.3, a1: 0.75, d: 6.5, h: 1.6 }],
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
    case 'handA': case 'handB': {   // v8: sword-skill close-up - out on the sword side (the opponent never blocks it), slow push in on the hand
      const k_ = L_.slice(-1), [P_, f] = C_[k_], s = f.clone().cross(v3(0, 1, 0)).normalize();
      const hand = cast && cast[k_] ? cast[k_].bones.rHand.getWorldPosition(v3(0, 0, 0)) : P_.clone().add(up(1.1));
      pos = P_.clone().add(f.clone().multiplyScalar(1.25 - 0.2 * E.io(u))).add(s.multiplyScalar(-(2.1 - 0.3 * E.io(u)))).setY(hand.y + 0.25); look = hand.clone().lerp(P_.clone().add(up(1.15)), 0.35); fov = 38; roll = -0.03; break; }
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
  // v8: standing slides throw a continuous sand spray from the feet
  for (const c of ['A', 'B']) for (const [a, b] of SLIDES[c]) { if (t < a || t > b + 0.9) continue;
    for (let ts = a; ts <= Math.min(t, b); ts += 0.045) { const q = rootXZ(c, ts), g = W.floorAt(q[0], q[1]);
      puff(soft, t, ts, [q[0], g, q[1]], 3, Math.round(ts * 911) + (c === 'A' ? 1 : 2), 0.22, 0.5, [0.92, 0.82, 0.62], 0.8); } }
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
