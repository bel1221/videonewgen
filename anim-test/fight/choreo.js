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
export function init(world) { W = world; F = world.FLOOR; buildAll(); }

// ------------------------------------------------------------------ pose library (signs: see rig.js applyPose notes)
function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, tilt: [0, 0], yawAbs: null }; for (const j of JK) p[j] = [0, 0, 0]; return p; }
const cp = p => JSON.parse(JSON.stringify(p));
function S(base, d) { const o = cp(base); for (const k in d) o[k] = Array.isArray(d[k]) ? d[k].slice() : d[k]; return o; }
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
L.kickW = S(G, { rLeg: [-60, 0, -4], rKnee: [104, 0, 0], lKnee: [24, 0, 0], waist: [-6, 0, 0], rArm: [-50, 0, -30], rElbow: [-40, 0, 0], lArm: [-40, 0, 40], wrist: 140 });
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

function mix(a, b, u) {
  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u), tilt: [lerp(a.tilt[0], b.tilt[0], u), lerp(a.tilt[1], b.tilt[1], u)],
    yawAbs: (a.yawAbs != null && b.yawAbs != null) ? lerp(a.yawAbs, b.yawAbs, u) : (u < 0.5 ? a.yawAbs : b.yawAbs) };
  for (const j of JK) o[j] = a[j].map((v, i) => lerp(v, b[j][i], u)); return o;
}
function evalKeys(K, t) {
  if (t <= K[0][0]) return cp(K[0][1]);
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, p0] = K[i - 1], [t1, p1, e] = K[i]; return mix(p0, p1, E[e || 'io']((t - t0) / Math.max(1e-6, t1 - t0))); }
  return cp(K[K.length - 1][1]);
}
function evalPos(K, t) {
  if (t <= K[0][0]) return [K[0][1], K[0][2]];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, x0, z0] = K[i - 1], [t1, x1, z1, e] = K[i]; const u = E[e || 'io']((t - t0) / Math.max(1e-6, t1 - t0)); return [lerp(x0, x1, u), lerp(z0, z1, u)]; }
  const l = K[K.length - 1]; return [l[1], l[2]];
}

// ------------------------------------------------------------------ run cycle (sword arm low, blade trailing; free arm pumps)
const STRIDE = 3.6;
function runLegs(phi, p) {
  const s = Math.sin(2 * Math.PI * phi), c = Math.cos(2 * Math.PI * phi);
  p.rLeg = [-48 * s, 0, -2]; p.lLeg = [48 * s, 0, 2];
  p.rKnee = [12 + 96 * Math.pow(Math.max(0, c), 1.4), 0, 0]; p.lKnee = [12 + 96 * Math.pow(Math.max(0, -c), 1.4), 0, 0];
  p.waist = [p.waist[0] * 0.4 + 14, p.waist[1] * 0.5 - 6 * s, 0];
  p.y += 0.12 * (1 - Math.abs(s)) - 0.06; return p;
}
function runArms(phi, p, swordToo) {
  const s = Math.sin(2 * Math.PI * phi);
  p.lArm = [-52 * s, 0, 8]; p.lElbow = [-84 - 16 * Math.max(0, s), 0, 0];
  if (swordToo) { p.rArm = [28 + 12 * s, 0, -10]; p.rElbow = [-32 - 6 * s, 0, 0]; p.wrist = 214 + 6 * s; p.chest = [6, 10 * s, 0]; p.head = [-16, -6 * s, 0]; }
  return p;
}

// ------------------------------------------------------------------ timelines
const T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] };
const k = (c, t, pose, e, d) => T[c].push([t, d ? S(pose, d) : pose, e]);
const at = (c, t, x, z, e) => P[c].push([t, x, z, e]);
export const CLASHES = [];   // {t, big, kind}
const clash = (t, big = false, kind = 'blade', extra = {}) => CLASHES.push({ t, big, kind, ...extra });

function buildAll() {
  // ---------- opening: both relaxed across the arena, B draws, A draws
  at('A', 0, -13, 0.4); at('B', 0, 13, -0.4);
  k('A', 0, L.relaxed); k('B', 0, L.relaxed);
  k('B', 1.62, L.relaxed); k('B', 1.78, L.crouch, 'o', { rArm: [-30, 0, -20], rElbow: [-90, 0, 0], wrist: 140, y: -0.2 }); k('B', 2.1, G, 'back');
  k('A', 2.2, L.relaxed); k('A', 2.38, G, 'back', { y: -0.2 }); k('A', 2.62, G);
  // ---------- charge (A 2.85-4.1, B 2.9-4.12)
  k('A', 2.72, L.crouch, 'o', { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 }); k('A', 2.86, L.crouch, 'lin', { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 });
  RUN.A.push([2.86, 3.86]); RUN.B.push([2.92, 3.88]);
  at('A', 2.86, -13, 0.4); at('A', 4.08, -2.0, 0.1, 'lin'); at('A', 4.2, -1.4, 0.05, 'o');
  at('B', 2.92, 13, -0.4); at('B', 4.1, 2.0, -0.1, 'lin'); at('B', 4.2, 1.45, -0.05, 'o');
  k('A', 3.86, L.guard, 'lin', { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 }); k('A', 4.08, L.windR, 'o'); k('A', 4.2, L.slashR, 'i');
  k('B', 3.86, L.guard, 'lin'); k('B', 4.08, L.windO, 'o'); k('B', 4.2, L.slashO, 'i');
  clash(4.2, true);
  // recoil
  at('A', 4.42, -2.3, 0.1, 'o'); at('B', 4.42, 2.3, -0.1, 'o');
  k('A', 4.3, L.hitBack, 'o', { rArm: [-90, 0, -30], wrist: 150 }); k('A', 4.5, G, 'back');
  k('B', 4.3, L.hitBack, 'o', { rArm: [-120, 0, -30], wrist: 150 }); k('B', 4.5, G, 'back');
  // ---------- exchange
  k('A', 4.6, G); k('A', 4.72, L.windL, 'o'); k('A', 4.82, L.slashL, 'i'); at('A', 4.6, -2.3, 0.1); at('A', 4.82, -1.5, 0.1, 'o');
  k('B', 4.62, G); k('B', 4.76, L.parryL, 'o'); clash(4.82);
  k('B', 4.9, L.parryL); k('B', 5.02, L.windR, 'o'); k('B', 5.12, L.slashR, 'i'); at('B', 4.9, 2.3, -0.1); at('B', 5.12, 1.55, -0.1, 'o');
  k('A', 4.92, L.slashL); k('A', 5.06, L.parryL, 'o'); clash(5.12);
  k('A', 5.2, L.parryL); k('A', 5.36, L.windO, 'o'); k('A', 5.46, L.slashO, 'i'); at('A', 5.46, -1.35, 0.1, 'o');
  k('B', 5.2, L.slashR); k('B', 5.36, L.parryH, 'o'); k('B', 5.5, L.parryH, 'lin', { y: -0.38, rKnee: [60, 0, 0], lKnee: [52, 0, 0] }); clash(5.46);
  // B thrust, A side-steps
  k('B', 5.62, L.windT, 'o'); k('B', 5.78, L.thrust, 'i'); at('B', 5.62, 1.6, -0.1); at('B', 5.78, 0.3, -0.1, 'o'); k('B', 6.05, L.thrust, 'lin', { chest: [8, 10, 0] });
  k('A', 5.6, L.slashO); k('A', 5.72, L.dodge, 'o'); at('A', 5.6, -1.35, 0.1); at('A', 5.78, -1.5, 1.25, 'o');
  // A spin slash (anticipation, 360 spin, connect on B's parry)
  k('A', 5.92, L.windR, 'io', { yawOff: 0 }); k('A', 6.04, L.windR, 'lin', { yawOff: 0, y: -0.3 });
  k('A', 6.36, L.spin, 'lin', { yawOff: -300 }); k('A', 6.46, L.slashR, 'o', { yawOff: -360 }); k('A', 6.6, G, 'io', { yawOff: -360 });
  at('A', 6.04, -1.5, 1.25); at('A', 6.46, -1.3, 0.4, 'io');
  k('B', 6.2, G); k('B', 6.38, L.parryR, 'o'); k('B', 6.52, L.parryR, 'lin', { y: -0.34 }); at('B', 6.2, 0.6, -0.1); at('B', 6.46, 1.1, -0.1, 'io');
  clash(6.46, true);
  at('B', 6.62, 1.6, -0.1, 'o');
  // ---------- B kicks A away; A slides, ends on one knee
  k('B', 6.74, L.kickW, 'o'); k('B', 6.86, L.kick, 'i'); k('B', 7.05, L.kick, 'lin'); k('B', 7.25, G, 'io'); at('B', 6.74, 1.6, -0.1); at('B', 6.86, 0.55, -0.1, 'o');
  k('A', 6.76, G, 'lin', { yawOff: -360 }); k('A', 6.92, L.hitBack, 'o', { yawOff: -360 }); k('A', 7.15, L.slide, 'o', { yawOff: -360 }); k('A', 7.55, L.slide, 'lin', { yawOff: -360 });
  k('A', 7.78, L.kneelG, 'o', { yawOff: -360 });
  at('A', 6.86, -1.2, 0.3); at('A', 7.6, -6.8, 0.6, 'o');
  clash(6.88, false, 'kick', { at: () => { const q = pose('A', 6.9).pos; return [q[0], q[1] + 1.3, q[2]]; } });
  // ---------- B charges the kneeling A, overhead; A blocks from the knee
  RUN.B.push([7.32, 8.32]); at('B', 7.32, 0.6, -0.1); at('B', 8.4, -4.6, 0.4, 'lin'); at('B', 8.52, -4.75, 0.45, 'o');
  k('B', 7.3, G); k('B', 8.2, G, 'lin'); k('B', 8.42, L.windO, 'o'); k('B', 8.54, L.slashO, 'i'); k('B', 8.62, L.slashO, 'lin', { y: -0.4 });
  k('A', 8.1, L.kneelG, 'lin', { yawOff: -360 }); k('A', 8.36, L.kneelBlock, 'o', { yawOff: -360 }); k('A', 8.6, L.kneelBlock, 'lin', { yawOff: -360, y: -0.5 });
  clash(8.54, true);
  // A shoves up, B staggers back
  k('A', 8.78, L.upper, 'o', { yawOff: -360 }); k('A', 9.0, G, 'io', { yawOff: -360 }); at('A', 8.6, -6.8, 0.6); at('A', 8.8, -6.3, 0.5, 'o');
  k('B', 8.76, L.hitBack, 'o'); k('B', 9.05, L.hitBack, 'lin', { waist: [0, 0, 0], chest: [-6, 0, 0] }); k('B', 9.3, G, 'io'); at('B', 8.62, -4.75, 0.45); at('B', 9.15, -2.1, 0.0, 'o');
  // ---------- A leaps; overhead slam into the sand; B rolls aside
  k('A', 9.18, L.crouch, 'o', { yawOff: -360 }); k('A', 9.3, L.crouch, 'lin', { yawOff: -360, y: -0.48 });
  k('A', 9.38, L.takeoff, 'o', { yawOff: -360, y: 0.7 }); k('A', 9.6, L.tuck, 'o', { yawOff: -360, y: 2.6 }); k('A', 9.74, L.tuck, 'io', { yawOff: -360, y: 2.2 });
  k('A', 9.86, L.slam, 'i', { yawOff: -360 }); k('A', 10.2, L.slam, 'lin', { yawOff: -360, y: -0.55 }); k('A', 10.45, G, 'io', { yawOff: -360 });
  at('A', 9.3, -6.3, 0.5); at('A', 9.86, -2.6, 0.1, 'lin');
  k('B', 9.4, G); k('B', 9.55, L.dodge, 'o'); k('B', 9.78, L.duck, 'o', { waist: [30, 0, -10] }); k('B', 10.1, L.duck); k('B', 10.4, G, 'io');
  at('B', 9.45, -2.1, 0.0); at('B', 9.82, -1.0, -2.6, 'o');
  clash(9.86, true, 'slam', { at: (cast, blade) => { const tip = blade('A', 9.9, [26])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; } });
  // ---------- flurry while circling (orbit positions sampled)
  const c0 = [-1.8, -1.2], r = 1.25, th0 = Math.atan2(-2.6 - c0[1], -1.0 - c0[0]);
  for (let t = 10.45; t <= 11.65 + 1e-9; t += 0.1) {
    const th = th0 + (t - 10.45) / 1.2 * (Math.PI * 0.75);
    at('B', t, c0[0] + Math.cos(th) * r, c0[1] + Math.sin(th) * r, 'lin'); at('A', t, c0[0] - Math.cos(th) * r, c0[1] - Math.sin(th) * r, 'lin');
  }
  k('A', 10.45, G, 'lin', { yawOff: -360 }); k('B', 10.45, G);
  const Y = { yawOff: -360 };
  k('B', 10.47, L.windR, 'o'); k('B', 10.55, L.slashR, 'i'); k('A', 10.48, L.parryL, 'o', Y); clash(10.55);
  k('A', 10.66, L.windR, 'o', Y); k('A', 10.82, L.slashR, 'i', Y); k('B', 10.7, L.parryL, 'o'); clash(10.82);
  k('B', 10.94, L.windL, 'o'); k('B', 11.08, L.slashL, 'i'); k('A', 10.96, L.parryL, 'o', Y); clash(11.08);
  k('A', 11.2, L.windL, 'o', Y); k('A', 11.35, L.slashL, 'i', Y); k('B', 11.22, L.parryL, 'o'); clash(11.35);
  k('B', 11.48, L.windO, 'o'); k('A', 11.5, L.windR, 'o', Y);
  k('B', 11.62, L.bind, 'i'); k('A', 11.62, L.bind, 'i', Y); clash(11.62, true);
  // ---------- blade bind: pushing, shaking, sparks
  for (let t = 11.75; t < 12.5; t += 0.125) { const s = Math.sin(t * 40) * 0.5 + 0.5;
    k('A', t, L.bind, 'io', { yawOff: -360, chest: [22 + 8 * s, 10, 0], y: -0.3 - 0.06 * s }); k('B', t, L.bind, 'io', { chest: [22 + 8 * (1 - s), 10, 0], y: -0.3 - 0.06 * (1 - s) }); }
  // ---------- push apart
  k('A', 12.62, L.hitBack, 'o', Y); k('A', 12.95, G, 'io', Y); k('B', 12.62, L.hitBack, 'o'); k('B', 12.95, G, 'io');
  { const pa = evalPos(P.A, 12.5), pb = evalPos(P.B, 12.5), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    at('A', 12.52, pa[0], pa[1]); at('A', 12.95, pa[0] - ux * 1.6, pa[1] - uz * 1.6, 'o'); at('B', 12.52, pb[0], pb[1]); at('B', 12.95, pb[0] + ux * 1.6, pb[1] + uz * 1.6, 'o');
    // ---------- B whirlwind: two spins advancing, A backs off blocking
    k('B', 13.05, L.windR, 'o'); k('B', 13.18, L.windR, 'lin', { y: -0.28 });
    for (let i = 1; i <= 6; i++) k('B', 13.18 + i * 0.2, L.spin, 'lin', { yawOff: -120 * i });
    k('B', 14.48, L.slashR, 'o', { yawOff: -720 }); k('B', 14.6, L.hitBack, 'o', { yawOff: -720, waist: [10, 0, 0], chest: [6, 0, 0] });
    at('B', 13.18, pb[0] + ux * 1.6, pb[1] + uz * 1.6); at('B', 14.4, pa[0] - ux * 0.2, pa[1] - uz * 0.2, 'io');
    at('A', 13.18, pa[0] - ux * 1.6, pa[1] - uz * 1.6); at('A', 14.45, pa[0] - ux * 3.4, pa[1] - uz * 3.4, 'io');
    k('A', 13.2, G, 'io', Y); k('A', 13.46, L.parryR, 'o', Y); k('A', 13.66, L.parryL, 'o', Y); k('A', 13.86, L.parryR, 'o', Y); k('A', 14.06, L.parryL, 'o', Y);
    k('A', 14.26, L.parryR, 'o', Y);
    clash(13.56); clash(13.96); clash(14.36);
    // ---------- A low sweep, B jumps it; A rising uppercut breaks B's guard
    k('A', 14.5, L.sweepW, 'o', Y); k('A', 14.66, L.sweep, 'i', Y); k('A', 14.9, L.sweep, 'lin', Y); k('A', 15.04, L.upperW, 'io', Y); k('A', 15.18, L.upper, 'i', Y); k('A', 15.5, G, 'io', Y);
    const pA = evalPos(P.A, 14.45), pB = evalPos(P.B, 14.4);
    at('A', 14.5, pA[0], pA[1]); at('A', 14.66, pA[0] + ux * 0.9, pA[1] + uz * 0.9, 'o'); at('A', 15.18, pA[0] + ux * 1.3, pA[1] + uz * 1.3, 'o');
    k('B', 14.62, L.crouch, 'o', { yawOff: -720, rArm: [-60, 0, -20], rElbow: [-60, 0, 0], wrist: 140 }); k('B', 14.7, L.takeoff, 'o', { yawOff: -720, y: 0.8, rArm: [-90, 0, -30] });
    k('B', 14.86, L.tuck, 'o', { yawOff: -720, y: 1.7, rArm: [-90, 0, -40], rElbow: [-60, 0, 0], wrist: 140 }); k('B', 15.04, L.land, 'i', { yawOff: -720 });
    k('B', 15.12, L.parryR, 'o', { yawOff: -720 }); k('B', 15.2, L.hitBack, 'o', { yawOff: -720, rArm: [-170, 0, -40], rElbow: [-10, 0, 0], wrist: 150 });
    k('B', 15.6, L.hitBack, 'lin', { yawOff: -720, waist: [6, 0, 0], chest: [4, 0, 0], rArm: [-100, 0, -40] }); k('B', 15.95, G, 'io', { yawOff: -720 });
    at('B', 14.62, pB[0], pB[1]); at('B', 15.04, pB[0] + ux * 0.6, pB[1] + uz * 0.6, 'lin'); at('B', 15.18, pB[0] + ux * 0.7, pB[1] + uz * 0.7); at('B', 15.75, pB[0] + ux * 4.0, pB[1] + uz * 4.0, 'o');
    clash(15.18, true);
  }
  // ---------- breathe, then the final charge across (yaw locked to travel direction)
  BR.A.push([15.5, 16.75]); BR.B.push([15.9, 16.75]);
  const fa = evalPos(P.A, 15.5), fb = evalPos(P.B, 15.75);
  at('A', 16.6, fa[0], fa[1]); at('B', 16.6, fb[0], fb[1]);
  const mx = (fa[0] + fb[0]) / 2, mz = (fa[1] + fb[1]) / 2, dx = fb[0] - fa[0], dz = fb[1] - fa[1], dd = Math.hypot(dx, dz), ux = dx / dd, uz = dz / dd, px = -uz, pz = ux;
  export_cross.mid = [mx, mz]; export_cross.u = [ux, uz]; export_cross.p = [px, pz];
  const yA = Math.atan2(ux, uz) * 180 / Math.PI, yB = yA + 180;
  k('A', 16.6, G, 'io', Y); k('B', 16.6, G, 'io', { yawOff: -720 });
  k('A', 16.7, L.crouch, 'o', { yawOff: -360, rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 }); k('B', 16.72, L.crouch, 'o', { yawOff: -720, rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 });
  RUN.A.push([16.78, 17.18]); RUN.B.push([16.8, 17.18]);
  at('A', 16.78, fa[0], fa[1]); at('A', 17.3, mx - px * 0.45, mz - pz * 0.45, 'lin'); at('A', 17.7, mx + ux * 4.4 - px * 0.5, mz + uz * 4.4 - pz * 0.5, 'o');
  at('B', 16.8, fb[0], fb[1]); at('B', 17.3, mx + px * 0.45, mz + pz * 0.45, 'lin'); at('B', 17.7, mx - ux * 4.4 + px * 0.5, mz - uz * 4.4 + pz * 0.5, 'o');
  const lockA = { yawAbs: yA, yawOff: -360 }, lockB = { yawAbs: yB, yawOff: -720 };
  k('A', 17.0, L.guard, 'lin', { ...lockA, rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 }); k('A', 17.2, L.windR, 'o', lockA); k('A', 17.3, L.slashR, 'i', lockA);
  k('A', 17.7, L.slide, 'o', { ...lockA, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160, waist: [24, -40, 0], chest: [8, -50, 0], head: [-14, 40, 0] });
  k('A', 18.6, L.slide, 'lin', { ...lockA, rArm: [-74, 0, -62], rElbow: [-4, 0, 0], wrist: 160, waist: [24, -40, 0], chest: [8, -50, 0], head: [-14, 40, 0] });
  k('A', 19.0, L.relaxed, 'io', lockA); k('A', 19.18, L.flick, 'o', lockA); k('A', 19.45, L.relaxed, 'io', { ...lockA, head: [6, -30, 0] });
  k('B', 17.0, L.guard, 'lin', { ...lockB, rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 }); k('B', 17.2, L.windO, 'o', lockB); k('B', 17.3, L.slashO, 'i', lockB);
  k('B', 17.7, L.slashO, 'o', { ...lockB, y: -0.4 }); k('B', 18.45, L.slashO, 'lin', { ...lockB, y: -0.42 });
  k('B', 18.7, L.knees, 'i', lockB); k('B', 19.05, L.knees, 'lin', lockB); k('B', 19.38, L.fallen, 'i', lockB);
  clash(17.3, true, 'cross');
  BR.A.push([19.4, 20.0]);
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
export const export_cross = {};

// clash corrections (IK-lite): solved in fight.js so the two blades physically cross at each clash time
export const CORR = { A: [], B: [] };
function corrW(d) { if (d < -0.16 || d > 0.22) return 0; return d < 0 ? E.io((d + 0.16) / 0.16) : 1 - E.io(d / 0.22); }
function rootXZ(c, t) { return evalPos(P[c], t); }
export function pose(c, t) {
  if (c === 'C') { const p = N(); p.pos = [0, -200, 0]; return p; }
  const p = evalKeys(T[c], t); const [x, z] = rootXZ(c, t);
  for (const e of CORR[c]) { const w = corrW(t - e.t); if (!w) continue;
    p.rArm[0] += e.ax * w; p.rArm[2] += e.az * w; p.rElbow[0] += e.el * w; p.wrist += e.wr * w; p.chest[1] += e.ch * w; p._fw = (p._fw || 0) + (e.fw || 0) * w; }
  for (const [t0, t1] of RUN[c]) if (t >= t0 && t <= t1) {
    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]); const phi = d / STRIDE;
    const blend = clamp(Math.min((t - t0) / 0.08, (t1 - t) / 0.1));
    const r = runArms(phi, runLegs(phi, cp(p)), t < t1 - 0.25);
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
  const g = W.floorAt(X, Z);
  p.pos = [X, g + p.y, Z]; p.yaw = yaw + p.yawOff;
  return p;
}

// ------------------------------------------------------------------ contacts (set by fight.js from the real blade geometry)
let CONT = [];
export function setContacts(c) { CONT = c; }
const BIG = () => CONT.filter(c => c.big && c.kind === 'blade');

// ------------------------------------------------------------------ shots
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const INS = [4.2, 6.46, 8.54, 11.62, 15.18];       // impact inserts: 1 impact frame + 2 colour frames
const FLASH = 17.3;
const SHOTS = [
  [0.0, 'est'], [1.3, 'faceA'], [1.75, 'drawB'], [2.45, 'otsA_far'], [2.86, 'runA'], [3.42, 'runB'], [3.9, 'converge'],
  [4.2, 'ins'], [4.3, 'orbit1'], [5.55, 'otsA'], [5.92, 'lowSpin'], [6.46, 'ins'], [6.56, 'wideKick'], [7.7, 'kneelLow'], [8.54, 'ins'], [8.64, 'shove'],
  [9.2, 'leapLow'], [9.8, 'slamHigh'], [10.35, 'flurry'], [11.62, 'ins'], [11.72, 'bindECU'], [12.15, 'bindFaces'], [12.55, 'pushWide'],
  [13.1, 'whirlFront'], [14.0, 'whirlSide'], [14.55, 'jumpLow'], [15.18, 'ins'], [15.28, 'knockWide'], [15.95, 'breathA'], [16.4, 'breathB'],
  [16.75, 'chargeSide'], [FLASH, 'flash'], [FLASH + 3 * DT, 'hero'], [18.85, 'fallClose'], [19.45, 'endWide'],
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
  switch (S.label) {
    case 'est': pos = v3(-3 + 2 * u, F + 13 - 2.5 * u, -19 + 3 * E.io(u)); look = v3(0, F + 1.2, 0); fov = 46 - 6 * u; break;
    case 'faceA': pos = A.clone().add(fA.clone().multiplyScalar(1.35 - 0.2 * u)).add(side.clone().multiplyScalar(0.3)).add(up(1.75)); look = A.clone().add(up(1.68)); fov = 30; break;
    case 'drawB': pos = B.clone().add(fB.clone().multiplyScalar(2.9)).add(side.clone().multiplyScalar(-1.2 + 0.3 * u)).add(up(1.45)); look = B.clone().add(up(1.25)); fov = 34; break;
    case 'otsA_far': pos = A.clone().add(fA.clone().multiplyScalar(-2.0)).add(side.clone().multiplyScalar(0.9)).add(up(1.95)); look = B.clone().add(up(1.2)); fov = 26 - 3 * u; break;
    case 'runA': pos = A.clone().add(side.clone().multiplyScalar(4.2)).add(fA.clone().multiplyScalar(0.9)).add(up(0.95)); look = A.clone().add(up(1.1)).add(fA.clone().multiplyScalar(0.8)); fov = 44; roll = -0.04; break;
    case 'runB': pos = B.clone().add(fB.clone().multiplyScalar(4.6 - 0.8 * u)).add(side.clone().multiplyScalar(-0.6)).add(up(0.7)); look = B.clone().add(up(1.25)); fov = 38; break;
    case 'converge': pos = mid.clone().add(side.clone().multiplyScalar(-7.5)).add(up(1.1)); look = mid.clone().add(up(1.5)); fov = 40 - 6 * u; break;
    case 'orbit1': { const a = (0.35 + 0.9 * u) * Math.PI / 2; pos = mid.clone().add(side.clone().multiplyScalar(Math.cos(a) * 5.4)).add(ab.clone().multiplyScalar(Math.sin(a) * 5.4)).add(up(2.0 - 0.5 * u)); look = mid.clone().add(up(1.45)); fov = 40; break; }
    case 'otsA': pos = A.clone().add(fA.clone().multiplyScalar(-1.9)).add(side.clone().multiplyScalar(0.95)).add(up(2.05)); look = B.clone().add(up(1.3)); fov = 42; break;
    case 'lowSpin': pos = A.clone().add(fA.clone().multiplyScalar(2.4)).add(side.clone().multiplyScalar(2.4)).add(up(0.45)); look = A.clone().add(up(1.4)); fov = 48; roll = 0.06; break;
    case 'wideKick': pos = mid.clone().add(side.clone().multiplyScalar(7.6)).add(up(1.7)); look = mid.clone().lerp(A, 0.45).add(up(1.1)); fov = 42; break;
    case 'kneelLow': pos = A.clone().add(fA.clone().multiplyScalar(-1.7)).add(side.clone().multiplyScalar(0.7)).add(up(0.85)); look = B.clone().add(up(1.7)); fov = 42; break;
    case 'shove': pos = mid.clone().add(side.clone().multiplyScalar(3.4)).add(up(1.5)); look = mid.clone().add(up(1.25)); fov = 46; break;
    case 'leapLow': { const a0 = v3(...pose('A', 9.2).pos); pos = a0.clone().add(side.clone().multiplyScalar(3.4)).add(ab.clone().multiplyScalar(2.6)).add(up(0.35)); look = A.clone().add(up(1.4)); fov = 52; roll = -0.05; break; }
    case 'slamHigh': pos = A.clone().add(up(7.6)).add(side.clone().multiplyScalar(3.2)).add(ab.clone().multiplyScalar(-2.4)); look = A.clone().add(up(0.4)).add(ab.clone().multiplyScalar(1.2)); fov = 46; break;
    case 'flurry': { const a = Math.PI * (0.15 + 1.0 * u); const c = mid; pos = c.clone().add(side.clone().multiplyScalar(Math.cos(a) * 4.6)).add(ab.clone().multiplyScalar(Math.sin(a) * 4.6)).add(up(1.75)); look = c.clone().add(up(1.4)); fov = 42; break; }
    case 'bindECU': { const c = v3(...(CONT.find(x => Math.abs(x.t - 11.62) < 0.01) || { p: mid.toArray() }).p); const cc = c.clone().add(up(-0.45)); pos = cc.clone().add(side.clone().multiplyScalar(1.7 - 0.2 * u)).add(up(0.2)); look = cc; fov = 34; roll = 0.04; break; }
    case 'bindFaces': pos = mid.clone().add(side.clone().multiplyScalar(3.2)).add(up(1.8)); look = mid.clone().add(up(1.55)); fov = 36 - 4 * u; break;
    case 'pushWide': pos = mid.clone().add(side.clone().multiplyScalar(8.2)).add(up(2.6)); look = mid.clone().add(up(1.2)); fov = 40; break;
    case 'whirlFront': pos = A.clone().add(fA.clone().multiplyScalar(-2.6)).add(side.clone().multiplyScalar(1.3)).add(up(1.05)); look = B.clone().add(up(1.3)); fov = 46; break;
    case 'whirlSide': pos = mid.clone().add(side.clone().multiplyScalar(5.2)).add(up(1.4)); look = mid.clone().add(up(1.3)); fov = 42; break;
    case 'jumpLow': pos = mid.clone().add(side.clone().multiplyScalar(3.3)).add(up(0.22)); look = mid.clone().add(up(1.7)); fov = 54; break;
    case 'knockWide': pos = mid.clone().add(side.clone().multiplyScalar(7.2)).add(up(2.0)); look = mid.clone().lerp(B, 0.55).add(up(1.2)); fov = 42; break;
    case 'breathA': pos = A.clone().add(fA.clone().multiplyScalar(2.8)).add(side.clone().multiplyScalar(1.3)).add(up(1.7)); look = A.clone().add(up(1.45)); fov = 34 - 3 * u; break;
    case 'breathB': pos = B.clone().add(fB.clone().multiplyScalar(2.8)).add(side.clone().multiplyScalar(-1.3)).add(up(1.7)); look = B.clone().add(up(1.45)); fov = 34 - 3 * u; break;
    case 'chargeSide': pos = mid.clone().add(side.clone().multiplyScalar(6.4)).add(up(0.9)); look = mid.clone().add(up(1.3)); fov = 40; break;
    case 'flash': pos = mid.clone().add(side.clone().multiplyScalar(6.4)).add(up(0.9)); look = mid.clone().add(up(1.3)); break;
    case 'hero': { const m = v3(export_cross.mid[0], F, export_cross.mid[1]), uu = v3(export_cross.u[0], 0, export_cross.u[1]), pp = v3(export_cross.p[0], 0, export_cross.p[1]);
      pos = m.clone().add(uu.clone().multiplyScalar(7.6 - 0.8 * E.io(u))).add(pp.clone().multiplyScalar(-2.6)).add(up(1.05)); look = m.clone().add(uu.clone().multiplyScalar(1.5)).add(up(1.55)); fov = 36; break; }
    case 'fallClose': pos = B.clone().add(fB.clone().multiplyScalar(3.8)).add(side.clone().multiplyScalar(1.2)).add(up(0.7)); look = B.clone().add(up(0.7)); fov = 36; break;
    case 'endWide': pos = mid.clone().add(side.clone().multiplyScalar(9 - 2 * u)).add(up(5.5 - 1.5 * u)); look = mid.clone().add(up(1.0)); fov = 40; break;
    case 'ins': { const ii = INS.findIndex(t0 => Math.abs(S.t0 - t0) < 1e-6); const c = CONT.find(x => Math.abs(x.t - INS[ii]) < 0.02) || { p: mid.toArray() };
      const cp_ = v3(...c.p); pos = cp_.clone().add(side.clone().multiplyScalar(ii % 2 ? -2.3 : 2.3)).add(ab.clone().multiplyScalar(0.5)).add(up(0.15)); look = cp_.clone().add(up(-0.25)); fov = 36 + 30 * lt; roll = ii % 2 ? 0.12 : -0.1; break; }
    default: pos = mid.clone().add(side.clone().multiplyScalar(6)).add(up(2)); look = mid.clone().add(up(1.2));
  }
  const sh = shake(t); pos.add(sh); look = look.clone().add(sh.clone().multiplyScalar(0.6));
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
function puff(list, t, t0, p, n, seed, spread = 0.7, rise = 0.6, col = [0.86, 0.88, 0.92], life = 1.1) {
  const d = t - t0; if (d < 0 || d > life) return; const u = d / life;
  for (let i = 0; i < n; i++) { const th = h(i, seed) * Math.PI * 2, r = (0.15 + spread * h(i, seed + 1)) * E.o(Math.min(1, d / 0.5));
    list.push({ p: [p[0] + Math.cos(th) * r, p[1] + 0.05 + rise * d * (0.3 + h(i, seed + 2)), p[2] + Math.sin(th) * r], c: col, s: 0.28 + 0.6 * u, a: 0.5 * (1 - u) }); }
}
export function effects(t, cam) {
  const add = [], soft = [], flares = [], rings = [], debris = []; let flash = 0, black = 0, ca = 0, impact = 0, bloomBoost = 0; const sparkLight = { i: 0, p: [0, 0, 0] };
  // snow (Marlow): falling + wind, wrapped in a box around the camera target
  const cx = cam.position.x, cz = cam.position.z;
  for (let i = 0; i < 2600; i++) {
    const sp = 1.2 + 1.0 * h(i, 3), wind = 2.6;
    const x = ((h(i, 1) * 50 + wind * t + 0.4 * Math.sin(t * 1.3 + i)) % 50 + 50) % 50 - 25 + cx, z = ((h(i, 2) * 50 + 0.6 * t) % 50 + 50) % 50 - 25 + cz;
    const y = F + ((h(i, 4) * 22 - sp * t) % 22 + 22) % 22;
    soft.push({ p: [x, y, z], c: [0.93, 0.95, 1.0], s: 0.035 + 0.05 * h(i, 5), a: 0.75 });
  }
  // footfall puffs during runs
  for (const c of ['A', 'B']) for (const [t0, t1] of RUN[c]) {
    if (t < t0 - 0.01 || t > t1 + 1.2) continue;
    const a = rootXZ(c, t0);
    for (let st = 0; st < 12; st++) { const tc = t0 + st * 0.11; if (tc > t1) break; const pp = rootXZ(c, tc); puff(soft, t, tc, [pp[0], W.floorAt(pp[0], pp[1]), pp[1]], 4, st * 7 + (c === 'A' ? 1 : 2), 0.35, 0.3, undefined, 0.7); }
  }
  // per-contact effects
  for (const c of CONT) {
    const d = t - c.t, p = c.p; if (d < -0.05 || d > 1.6) continue;
    if (c.kind === 'blade' || c.kind === 'cross') {
      burst(add, t, c.t, p, c.big ? 90 : 45, Math.round(c.t * 100), c.big ? 1.25 : 0.9);
      if (d >= 0 && d < (c.big ? 0.22 : 0.12)) { const u = d / (c.big ? 0.22 : 0.12), ins = shotAt(t).label === 'ins' ? 0.22 : 1; flares.push({ p, s: (c.big ? 1.5 : 0.75) * (1 - 0.5 * u) * ins, a: (1 - u) * (ins < 1 ? 0.8 : 1), rot: c.t * 3 }); sparkLight.i = Math.max(sparkLight.i, (c.big ? 9 : 4) * (1 - u)); sparkLight.p = p; }
      if (c.big && d >= 0 && d < 0.3 && shotAt(t).label !== 'ins') rings.push({ p, s: 0.3 + 2.6 * E.o(d / 0.3), a: 0.32 * (1 - d / 0.3) });
    }
    if (c.kind === 'kick') { puff(soft, t, c.t, p, 10, 77, 0.5, 0.2); if (d >= 0 && d < 0.22) rings.push({ p, s: 0.3 + 1.6 * E.o(d / 0.22), a: 0.25 * (1 - d / 0.22) }); }
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
    if (c.kind === 'cross' && d >= 0 && d < 1.2) puff(soft, t, c.t + 0.3, [p[0], F, p[2]], 16, 51, 1.4, 0.5, [0.86, 0.88, 0.92], 1.2);
  }
  // slides kick up snow
  for (const [c, t0, t1] of [['A', 7.0, 7.6], ['A', 17.35, 17.75], ['B', 17.35, 17.75], ['B', 15.25, 15.7], ['B', 8.7, 9.1]])
    for (let s = 0; s < 6; s++) { const tc = t0 + (t1 - t0) * s / 6; const pp = rootXZ(c, tc); puff(soft, t, tc, [pp[0], W.floorAt(pp[0], pp[1]), pp[1]], 5, 300 + s * 13 + (c === 'A' ? 0 : 5), 0.5, 0.45); }
  { const pb = rootXZ('B', 19.38); puff(soft, t, 19.38, [pb[0], F, pb[1]], 20, 401, 1.3, 0.4, [0.9, 0.92, 0.96], 1.4); }
  // bind sparks: small repeating bursts
  const bc = CONT.find(x => Math.abs(x.t - 11.62) < 0.01);
  if (bc) for (let tb = 11.7; tb < 12.5; tb += 0.11) burst(add, t, tb, bc.p, 14, Math.round(tb * 1000), 0.6);
  // inserts: impact frame then colour frames with chromatic aberration
  const ii = insIndex(t);
  if (ii >= 0) { const f = Math.round((t - INS[ii]) / DT); impact = f === 0 ? 1 : 0; ca = 0.8; bloomBoost = 0.08; }
  if (t >= FLASH && t < FLASH + DT - 1e-6) flash = 1; else if (t >= FLASH + DT - 1e-6 && t < FLASH + 3 * DT - 1e-6) black = 1;
  if (t > FLASH + 3 * DT && t < FLASH + 0.6) ca = 0.7 * (1 - (t - FLASH) / 0.6);
  return { add, soft, flares, rings, debris, flash, black, ca, impact, bloomBoost, sparkLight };
}
