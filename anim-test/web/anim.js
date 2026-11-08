// Animation, cameras and effect timing for the test clip. Everything is a pure function of t (deterministic renders).
// Craft rules from notes/animation-study.md: long anticipation -> short strike, knockback that travels, overshoot settles,
// idle breathing, cut on action, 2-frame impact inserts, flash grammar, camera always moving.
import * as THREE from 'three';

export const TOTAL = 9.5;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const E = {
  lin: u => u, io: u => u * u * (3 - 2 * u), o: u => 1 - Math.pow(1 - u, 3), i: u => u * u * u,
  back: u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
};
const JK = ['waist', 'chest', 'head', 'rArm', 'rElbow', 'lArm', 'lElbow', 'rLeg', 'rKnee', 'lLeg', 'lKnee'];
const N = () => { const p = { pos: [0, 0, 0], yaw: 0 }; for (const j of JK) p[j] = [0, 0, 0]; return p; };
const cp = p => JSON.parse(JSON.stringify(p));
function mix(a, b, u) {
  const o = { pos: a.pos.map((v, i) => v + (b.pos[i] - v) * u), yaw: a.yaw + (b.yaw - a.yaw) * u, wrist: (a.wrist ?? 160) + ((b.wrist ?? 160) - (a.wrist ?? 160)) * u };
  for (const j of JK) o[j] = a[j].map((v, i) => v + (b[j][i] - v) * u); return o;
}
function add(p, d) { const o = cp(p); for (const k in d) { if (k === 'pos') o.pos = o.pos.map((v, i) => v + d.pos[i]); else if (k === 'yaw') o.yaw += d.yaw; else o[k] = o[k].map((v, i) => v + d[k][i]); } return o; }
function set(p, d) { const o = cp(p); for (const k in d) o[k] = Array.isArray(d[k]) ? d[k].slice() : d[k]; return o; }
// keyframes: [[t, pose, ease]] ; the ease belongs to the segment arriving at that key
function keys(K, t) {
  if (t <= K[0][0]) return cp(K[0][1]);
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, p0] = K[i - 1], [t1, p1, e] = K[i]; return mix(p0, p1, (E[e || 'io'])((t - t0) / (t1 - t0))); }
  return cp(K[K.length - 1][1]);
}
const breathe = (p, t, ph, amp = 1) => add(p, { chest: [1.6 * amp * Math.sin(t * 2.6 + ph), 0, 0], head: [-1.2 * amp * Math.sin(t * 2.6 + ph + 0.5), 2.5 * amp * Math.sin(t * 0.9 + ph), 0],
  rArm: [2 * amp * Math.sin(t * 2.6 + ph + 1), 0, 0], lArm: [-2 * amp * Math.sin(t * 2.6 + ph + 1.3), 0, 0], pos: [0, 0.008 * amp * Math.sin(t * 2.6 + ph), 0] });

// ------------------------------------------------------------------ run cycle (knees and elbows working)
const STRIDE = 3.4;                       // blocks per full cycle (two steps)
function run(phi, lean = 1) {
  const s = Math.sin(2 * Math.PI * phi), c = Math.cos(2 * Math.PI * phi);
  const p = N();
  p.rLeg = [-44 * s, 0, -2]; p.lLeg = [44 * s, 0, 2];
  p.rKnee = [12 + 92 * Math.pow(Math.max(0, c), 1.4), 0, 0]; p.lKnee = [12 + 92 * Math.pow(Math.max(0, -c), 1.4), 0, 0];
  // sword arm stays low and back with the blade trailing (references: runners never pump the weapon arm); free arm pumps
  p.rArm = [28 + 12 * s, 0, -10]; p.lArm = [-50 * s, 0, 8];
  p.rElbow = [-32 - 6 * s, 0, 0]; p.lElbow = [-80 - 18 * Math.max(0, s), 0, 0];
  p.waist = [13 * lean, -6 * s, 0]; p.chest = [5 * lean, 12 * s, 0]; p.head = [-15 * lean, -6 * s, 0];
  p.pos = [0, 0.11 * (1 - Math.abs(s)) - 0.04, 0]; p.wrist = 214 + 6 * s;
  return p;
}
const runContacts = (phi0, phi1) => { const out = []; for (let k = Math.ceil((phi0 - 0.25) * 2); 0.25 + k / 2 <= phi1; k++) out.push(0.25 + k / 2); return out; };

// ------------------------------------------------------------------ stances
function stance(sideTwist = 0) {
  const p = N();
  p.rLeg = [-20, 0, -6]; p.rKnee = [30, 0, 0]; p.lLeg = [18, 0, 6]; p.lKnee = [24, 0, 0];
  p.waist = [10, -12 + sideTwist, 0]; p.chest = [4, -10, 0]; p.head = [-10, 20, 0];
  p.rArm = [-58, 0, -12]; p.rElbow = [-58, 0, 0]; p.lArm = [-34, 0, 22]; p.lElbow = [-62, 0, 0];
  p.pos = [0, -0.12, 0]; p.wrist = 138; return p;
}
function idle() { const p = N(); p.rArm = [-10, 0, -6]; p.rElbow = [-14, 0, 0]; p.lArm = [4, 0, 5]; p.lElbow = [-8, 0, 0]; p.rKnee = [3, 0, 0]; p.lKnee = [3, 0, 0]; p.wrist = 160; return p; }

// ------------------------------------------------------------------ character A (slim skin 1, Aegisblade): runs in, leaps, ducks, thrusts, crosses
const AX = 0.5;
const runZ = t => -26 + 6.6 * t;                    // 0..3.0 s run along the path
const pathX = z => z < -7 ? AX + 1.5 * Math.sin(z * 0.09) * clamp((-7 - z) / 6) : AX;
let A_K = null;
function buildA() {
  const at = (p, x, y, z) => set(p, { pos: [x, y, z] });
  const S = stance();
  const crouch = set(S, { wrist: 168, rLeg: [-32, 0, -6], rKnee: [74, 0, 0], lLeg: [22, 0, 6], lKnee: [64, 0, 0], waist: [32, 0, 0], chest: [12, 0, 0], head: [-26, 0, 0],
    rArm: [-150, 0, -14], rElbow: [-62, 0, 0], lArm: [24, 0, 20], lElbow: [-30, 0, 0] });
  const take = set(crouch, { wrist: 165, rLeg: [12, 0, -4], rKnee: [8, 0, 0], lLeg: [34, 0, 4], lKnee: [22, 0, 0], waist: [-10, 0, 0], chest: [-14, 0, 0], head: [-6, 0, 0],
    rArm: [-188, 0, -10], rElbow: [-84, 0, 0], lArm: [-64, 0, 34], lElbow: [-20, 0, 0] });
  const apex = set(take, { wrist: 165, rLeg: [-62, 0, -4], rKnee: [92, 0, 0], lLeg: [-18, 0, 4], lKnee: [104, 0, 0], waist: [-4, 0, 0], chest: [-18, 0, 0] });
  const strike = set(apex, { wrist: 150, rArm: [-38, 0, -8], rElbow: [-6, 0, 0], lArm: [10, 0, 30], waist: [30, 0, 0], chest: [26, 0, 0], head: [8, 0, 0], rLeg: [-40, 0, -4], rKnee: [60, 0, 0], lLeg: [10, 0, 4], lKnee: [70, 0, 0] });
  const land = set(S, { wrist: 140, rLeg: [-38, 0, -6], rKnee: [80, 0, 0], lLeg: [26, 0, 6], lKnee: [74, 0, 0], waist: [28, 0, 0], chest: [10, 0, 0], head: [-18, 0, 0], rArm: [-62, 0, -10], rElbow: [-32, 0, 0] });
  const duck = set(S, { wrist: 160, waist: [44, 0, 0], chest: [16, 0, 0], head: [-30, 0, 0], rLeg: [-58, 0, -8], rKnee: [100, 0, 0], lLeg: [12, 0, 8], lKnee: [100, 0, 0], rArm: [-30, 0, -20], rElbow: [-70, 0, 0], lArm: [-20, 0, 30] });
  const draw1 = set(S, { wrist: 150, rArm: [-18, 0, -12], rElbow: [-112, 0, 0], chest: [2, -32, 0], waist: [6, -18, 0], head: [-8, 14, 0] });
  const draw2 = set(draw1, { wrist: 165, rArm: [2, 0, -18], rElbow: [-126, 0, 0], chest: [0, -44, 0], waist: [8, -24, 0], rKnee: [40, 0, 0], lKnee: [34, 0, 0] });
  const thrust = set(S, { wrist: 178, rArm: [-112, 0, 0], rElbow: [-2, 0, 0], chest: [12, 12, 0], waist: [16, 6, 0], head: [-10, -22, 0], rLeg: [-58, 0, -6], rKnee: [46, 0, 0], lLeg: [32, 0, 6], lKnee: [10, 0, 0], lArm: [20, 0, 40] });
  const follow = set(thrust, { wrist: 168, chest: [8, 6, 0], rArm: [-100, 0, -4], rElbow: [-12, 0, 0] });
  const prep = set(S, { wrist: 150, rArm: [-12, 0, -14], rElbow: [-108, 0, 0], waist: [26, 0, 0], chest: [10, -40, 0], rKnee: [52, 0, 0], lKnee: [48, 0, 0] });
  const slashA = set(S, { wrist: 172, chest: [10, 54, 0], waist: [14, 30, 0], rArm: [-92, 0, -4], rElbow: [-24, 0, 0] });
  const slashB = set(S, { wrist: 172, chest: [10, -72, 0], waist: [14, -38, 0], rArm: [-92, 0, 0], rElbow: [-4, 0, 0], lArm: [-40, 0, 60] });
  const slide = set(S, { wrist: 150, waist: [24, -40, 0], chest: [8, -50, 0], head: [-14, 40, 0], rArm: [-74, 0, -62], rElbow: [-4, 0, 0], lArm: [-20, 0, 50], rLeg: [-60, 0, -10], rKnee: [80, 0, 0], lLeg: [30, 0, 10], lKnee: [70, 0, 0] });
  const hero = set(idle(), { wrist: 172, rArm: [-4, 0, -16], rElbow: [-10, 0, 0], head: [6, -28, 0], chest: [-2, -10, 0], lArm: [6, 0, 8] });
  const r3 = run((runZ(3.0) + 26) / STRIDE); r3.pos = [AX, 0, runZ(3.0)];
  A_K = [
    [3.00, r3],
    [3.12, at(crouch, AX, -0.34, -5.3), 'o'],
    [3.24, at(crouch, AX, -0.42, -5.1), 'io'],
    [3.32, at(take, AX, 0.5, -4.1), 'o'],
    [3.48, at(apex, AX, 1.3, -2.0), 'o'],
    [3.58, at(strike, AX, 0.7, -0.6), 'i'],
    [3.64, at(strike, AX, 0.5, -0.5), 'lin'],
    [3.84, at(land, AX, -0.36, -0.4), 'o'],
    [4.00, at(S, AX, -0.12, -0.9), 'back'],
    [4.10, at(S, AX, -0.12, -0.9), 'io'],
    [4.18, at(duck, AX, -0.42, -0.9), 'o'],
    [4.40, at(duck, AX, -0.4, -0.95), 'io'],
    [4.56, at(draw1, AX, -0.16, -1.0), 'o'],
    [4.74, at(draw2, AX, -0.24, -1.05), 'io'],
    [4.82, at(thrust, AX, -0.3, -0.2), 'i'],
    [5.10, at(follow, AX, -0.24, -0.15), 'back'],
    [5.70, at(S, AX, -0.12, -0.3), 'io'],
    [6.85, at(S, AX, -0.12, -0.3), 'io'],
    [7.02, at(prep, AX, -0.3, -0.5), 'o'],
    [7.24, at(slashA, AX + 0.8, -0.12, 1.4), 'lin'],
    [7.33, at(slashB, AX + 0.9, -0.14, 2.4), 'i'],
    [7.55, at(slide, AX + 1.0, -0.3, 3.6), 'o'],
    [7.80, at(slide, AX + 1.0, -0.3, 3.7), 'io'],
    [8.40, at(hero, AX + 1.0, 0, 3.7), 'io'],
  ];
}
function poseA(t) {
  if (!A_K) buildA();
  if (t < 3.0) { const z = runZ(t); const p = run((z + 26) / STRIDE); p.pos = [pathX(z), p.pos[1], z]; return p; }
  let p = keys(A_K, t);
  if (t > 7.02 && t < 7.33) {                                   // charge: legs run under the slash
    const z = p.pos[2], r = run((z + 3) / 2.6, 0.6); for (const j of ['rLeg', 'lLeg', 'rKnee', 'lKnee']) p[j] = r[j];
  }
  if (t > 5.1 && t < 7.0 || t > 8.2) p = breathe(p, t, 0.0, t > 8.2 ? 1.6 : 1.2);
  if (t > 3.84 && t < 3.92) p = add(p, { pos: [0, -0.04 * Math.sin((t - 3.84) / 0.08 * Math.PI), 0] });
  return p;
}

// ------------------------------------------------------------------ character B (classic skin 2, Veilblade): guards, blocks, slashes, gets hit, kneels, charges, slumps
let B_K = null;
function buildB() {
  const at = (p, x, y, z) => set(p, { pos: [x, y, z] });
  const I = idle(), S = stance();
  const look = set(I, { wrist: 160, head: [0, 38, 0] });
  const block = set(S, { wrist: 176, rArm: [-128, 0, 22], rElbow: [-46, 0, 0], lArm: [-126, 0, -26], lElbow: [-48, 0, 0], waist: [-4, 0, 0], chest: [-6, 0, 0], head: [-14, 0, 0] });
  const absorb = set(block, { wrist: 176, rKnee: [62, 0, 0], lKnee: [56, 0, 0], rLeg: [-30, 0, -6], waist: [6, 0, 0] });
  const windH = set(S, { wrist: 172, chest: [6, 72, 0], waist: [6, 40, 0], rArm: [-96, 0, -6], rElbow: [-22, 0, 0], head: [-8, -30, 0], rKnee: [44, 0, 0], lKnee: [38, 0, 0] });
  const swingH = set(S, { wrist: 172, chest: [8, -76, 0], waist: [8, -36, 0], rArm: [-94, 0, 0], rElbow: [-4, 0, 0], head: [-8, 26, 0], lArm: [-30, 0, 56] });
  const over = set(swingH, { wrist: 172, chest: [8, -92, 0], waist: [8, -44, 0] });
  const hit = set(S, { wrist: 130, waist: [-32, 0, 0], chest: [-22, 0, 0], head: [-28, 0, 0], rArm: [-44, 0, -74], rElbow: [-20, 0, 0], lArm: [-34, 0, 76], lElbow: [-24, 0, 0], rLeg: [-36, 0, -6], rKnee: [20, 0, 0], lLeg: [16, 0, 6], lKnee: [10, 0, 0] });
  const stagger = set(hit, { wrist: 140, waist: [14, 0, 0], chest: [10, 0, 0], head: [10, 0, 0], rLeg: [-10, 0, -6], rKnee: [40, 0, 0], lLeg: [30, 0, 6], lKnee: [30, 0, 0] });
  const kneel = set(N(), { wrist: 104, rLeg: [-88, 0, -6], rKnee: [92, 0, 0], lLeg: [6, 0, 4], lKnee: [96, 0, 0], waist: [26, 0, 0], chest: [8, 0, 0], head: [22, 0, 0],
    rArm: [-48, 0, -8], rElbow: [-30, 0, 0], lArm: [-58, 0, 10], lElbow: [-42, 0, 0] });
  const prep = set(S, { wrist: 165, rArm: [-160, 0, -16], rElbow: [-70, 0, 0], waist: [24, 0, 0], chest: [8, 0, 0], rKnee: [54, 0, 0], lKnee: [48, 0, 0] });
  const diag = set(S, { wrist: 150, rArm: [-30, 0, 30], rElbow: [-6, 0, 0], chest: [20, -40, 0], waist: [20, -20, 0] });
  const done = set(diag, { wrist: 150, chest: [24, -50, 0], head: [16, 10, 0] });
  const knees = set(N(), { wrist: 166, rLeg: [0, 0, -4], rKnee: [90, 0, 0], lLeg: [0, 0, 4], lKnee: [90, 0, 0], waist: [34, 0, 0], chest: [18, 0, 0], head: [30, 0, 0],
    rArm: [-6, 0, -10], rElbow: [-10, 0, 0], lArm: [4, 0, 10], lElbow: [-8, 0, 0] });
  const slump = set(knees, { wrist: 166, waist: [52, 0, 0], chest: [26, 0, 0], head: [38, 0, 0] });
  const Y = 180, Z = 2.2;
  const k = (t, p, x, y, z, e) => [t, set(at(p, x, y, z), { yaw: Y }), e];
  B_K = [
    k(0.0, look, AX, 0, Z), k(2.45, look, AX, 0, Z, 'io'), k(2.62, I, AX, 0, Z, 'o'),
    k(2.95, S, AX, -0.12, Z, 'back'), k(3.42, S, AX, -0.12, Z, 'io'),
    k(3.56, block, AX, -0.1, Z, 'o'), k(3.62, block, AX, -0.12, Z + 0.05, 'lin'),
    k(3.76, absorb, AX, -0.36, Z + 0.35, 'o'), k(3.92, S, AX, -0.12, Z + 0.2, 'back'),
    k(4.06, windH, AX, -0.24, 1.7, 'io'), k(4.28, swingH, AX, -0.16, 1.4, 'i'), k(4.44, over, AX, -0.16, 1.4, 'o'),
    k(4.62, S, AX, -0.12, 1.5, 'io'), k(4.80, S, AX, -0.12, 1.5, 'lin'),
    k(4.88, hit, AX, -0.04, 2.1, 'o'), k(5.25, hit, AX, -0.04, 3.9, 'o'), k(5.42, stagger, AX, -0.1, 4.2, 'io'),
    k(5.62, kneel, AX, -0.4, 4.3, 'o'), k(6.30, kneel, AX, -0.4, 4.3, 'io'),
    k(6.80, S, AX, -0.12, 4.3, 'o'), k(6.88, S, AX, -0.12, 4.3, 'io'),
    k(7.04, prep, AX, -0.3, 4.1, 'o'), k(7.26, prep, AX - 0.8, -0.1, 2.0, 'lin'),
    k(7.33, diag, AX - 0.9, -0.14, 0.6, 'i'), k(7.55, done, AX - 1.0, -0.26, -0.4, 'o'), k(7.70, done, AX - 1.0, -0.26, -0.5, 'io'),
    k(7.95, knees, AX - 1.0, -0.38, -0.5, 'i'), k(8.10, knees, AX - 1.0, -0.4, -0.5, 'o'),
    k(8.70, slump, AX - 1.0, -0.42, -0.5, 'io'),
  ];
}
function poseB(t) {
  if (!B_K) buildB();
  let p = keys(B_K, t);
  if (t > 7.04 && t < 7.33) { const r = run((4.1 - p.pos[2]) / 2.6, 0.6); for (const j of ['rLeg', 'lLeg', 'rKnee', 'lKnee']) p[j] = r[j]; }
  if (t < 2.45) p = breathe(p, t, 1.3, 1.0);
  if (t > 5.62 && t < 6.3) p = breathe(p, t, 0.4, 2.6);          // heavy breathing on one knee
  if (t > 8.1) p = breathe(p, t, 2.0, 1.4);
  return p;
}

// ------------------------------------------------------------------ character C (classic skin 3): spectator on the ruin wall, cheers
function poseC(t) {
  let p = set(idle(), { rArm: [-62, 0, 46], rElbow: [-96, 0, 0], lArm: [-62, 0, -46], lElbow: [-96, 0, 0], head: [8, -10, 0] });   // arms crossed
  p.pos = [-6.5, 3, 7.5]; p.yaw = 140;
  if (t > 5.55) {
    const u = t - 5.55; const hop = Math.max(0, Math.sin(u * 2 * Math.PI * 1.7)) * 0.32 * clamp(u / 0.15) * clamp((1.35 - u) / 0.3);
    const wave = Math.sin(u * 16);
    const cheer = set(idle(), { rArm: [-168, 0, -(18 + 10 * wave)], rElbow: [-24 - 20 * wave, 0, 0], lArm: [-166, 0, 20 + 10 * wave], lElbow: [-26 + 18 * wave, 0, 0], head: [-18, 0, 0], waist: [-6, 0, 0],
      rKnee: [hop > 0.02 ? 40 : 14, 0, 0], lKnee: [hop > 0.02 ? 44 : 14, 0, 0], rLeg: [hop > 0.02 ? -20 : 0, 0, -4], lLeg: [hop > 0.02 ? -16 : 0, 0, 4] });
    cheer.pos = [-6.5, 3 + hop, 7.5]; cheer.yaw = 140;
    p = mix(p, cheer, E.o(clamp(u / 0.18)));
  }
  return breathe(p, t, 2.5, 0.8);
}

export function pose(k, t, world) {
  const p = k === 'A' ? poseA(t) : k === 'B' ? poseB(t) : poseC(t);
  const g = world.heightAt(p.pos[0], p.pos[2]);
  p.pos = [p.pos[0], p.pos[1] + (k === 'C' ? 1 : g), p.pos[2]];
  return p;
}

// ------------------------------------------------------------------ shots
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const INS1 = 3.60, INS2 = 4.82, FLASH = 7.33, DT = 1 / 30;
export const CONTACT = { clash: [AX, 3.05, 1.35], hit: [AX, 2.3, 1.85], cross: [AX, 2.0, 1.5] };
export function setContacts(c) { Object.assign(CONTACT, c); }
const SHOTS = [
  [0.00, 'wide run'], [1.45, 'track side'], [2.45, 'B close'], [3.05, 'ots B'], [INS1, 'insert clash'], [INS1 + 2 * DT, 'low side'],
  [4.50, 'ots A'], [INS2, 'insert hit'], [INS2 + 2 * DT, 'knockback'], [5.55, 'C cheer'], [6.30, 'charge'], [FLASH, 'flash'], [FLASH + 3 * DT, 'hero'],
];
export function shotAt(t) { let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k][0] - 1e-6) i = k; return { i, t0: SHOTS[i][0], label: SHOTS[i][1] }; }

const shake = (t, events) => { let a = 0; for (const [t0, amp] of events) { const d = t - t0; if (d >= 0 && d < 0.3) a = Math.max(a, amp * (1 - d / 0.3)); } return v3(a * Math.sin(t * 91), a * Math.cos(t * 77), 0); };
export function cameraAt(t, cast, world) {
  const S = shotAt(t), lt = t - S.t0; const pa = pose('A', t, world).pos, pb = pose('B', t, world).pos;
  const A = v3(...pa), B = v3(...pb);
  let pos, look, fov = 40, roll = 0;
  switch (S.label) {
    case 'wide run': pos = v3(5.4 - 0.3 * lt, 2.05, 5.2 - 0.4 * lt); look = A.clone().add(v3(0, 1.2, 0)); fov = 30 - 1.2 * lt; break;
    case 'track side': pos = A.clone().add(v3(4.6 - 0.4 * lt, 1.25, 1.4 - 0.3 * lt)); look = A.clone().add(v3(0, 1.05, 0.9)); fov = 42; break;
    case 'B close': pos = v3(AX + 1.9 + 0.15 * lt, 2.9 - 0.06 * lt, -0.6 + 0.3 * lt); look = B.clone().add(v3(0, 1.45, 0)); fov = 36 - 3 * lt; break;
    case 'ots B': pos = B.clone().add(v3(1.1 - 0.2 * lt, 1.95 + 0.1 * lt, 2.4 + 0.25 * lt)); look = A.clone().add(v3(0, 1.3, 0)); fov = 46; break;
    case 'insert clash': look = v3(...CONTACT.clash); pos = look.clone().add(v3(2.7, 0.35, -0.9)); fov = 40 - 60 * lt; roll = 0.06; break;
    case 'low side': pos = v3(AX + 6.2 - 0.5 * lt, 1.55, 0.6 + 0.2 * lt); look = v3(AX, 2.2, 0.6); fov = 44; roll = -0.03; break;
    case 'ots A': pos = A.clone().add(v3(-1.5 + 0.3 * lt, 2.15, -2.7)); look = B.clone().add(v3(0, 1.4, 0)); fov = 44 - 6 * lt; break;
    case 'insert hit': look = v3(...CONTACT.hit); pos = look.clone().add(v3(-1.3, 0.3, -0.7)); fov = 34; roll = -0.08; break;
    case 'knockback': pos = v3(AX - 5.6 + 0.4 * lt, 2.4, 7.6 - 0.6 * lt); look = B.clone().add(v3(0, 1.0, -1.2)); fov = 40; break;
    case 'C cheer': pos = v3(-3.9 + 0.2 * lt, 3.6, 4.4 - 0.3 * lt); look = v3(-6.5, 5.5, 7.5); fov = 40 - 4 * lt; break;
    case 'charge': pos = v3(AX + 7.2, 2.6, 1.6 - 0.9 * lt); look = A.clone().lerp(B, 0.5).add(v3(0, 1.1, 0)); fov = 44; break;
    case 'flash': pos = v3(AX + 7.2, 2.6, 0.6); look = v3(AX, 2.2, 1); fov = 44; break;
    default: { const u = clamp(lt / 2.1); pos = v3(AX + 2.4 - 0.5 * u, 1.75 + 0.1 * u, 9.6 - 1.4 * E.o(u)); look = v3(AX + 0.3, 2.4, 1.6); fov = 36 - 3 * u; }   // hero, backlit
  }
  pos.add(shake(t, [[INS1 + 2 * DT, 0.07], [INS2 + 2 * DT, 0.06], [3.84, 0.04], [FLASH + 3 * DT, 0.05]]));
  return { pos, look, fov, roll };
}

export function trailOn(k, t) {
  const lab = shotAt(t).label; if (lab.startsWith('insert')) return 0;
  const W = k === 'A' ? [[3.5, 3.66], [4.76, 4.92], [7.18, 7.42]] : [[4.12, 4.46], [7.2, 7.42]];
  for (const [a, b] of W) if (t >= a && t <= b) return clamp(Math.min((t - a) / 0.03, (b - t) / 0.08));
  return 0;
}

// ------------------------------------------------------------------ effects
const h = (i, s) => { let x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
function burst(list, t, t0, at, n, seed, hot) {
  const d = t - t0; if (d < 0 || d > 0.7) return;
  for (let i = 0; i < n; i++) {
    const life = 0.3 + 0.35 * h(i, seed); if (d > life) continue;
    const th = h(i, seed + 1) * Math.PI * 2, ph = (h(i, seed + 2) - 0.3) * Math.PI * 0.8, sp = 3 + 6 * h(i, seed + 3);
    const v = [Math.cos(th) * Math.cos(ph) * sp, Math.sin(ph) * sp + 2, Math.sin(th) * Math.cos(ph) * sp];
    list.push({ p: [at[0] + v[0] * d, at[1] + v[1] * d - 4.9 * d * d, at[2] + v[2] * d], c: hot, s: 0.025 + 0.025 * h(i, seed + 4), a: 1 - d / life });
  }
}
function puff(list, t, t0, at, n, seed, spread = 0.6, rise = 0.6) {
  const d = t - t0; if (d < 0 || d > 1.0) return;
  for (let i = 0; i < n; i++) {
    const th = h(i, seed) * Math.PI * 2, r = (0.2 + spread * h(i, seed + 1)) * (1 - Math.pow(1 - Math.min(1, d / 0.6), 3));
    list.push({ p: [at[0] + Math.cos(th) * r, at[1] + 0.05 + rise * d * (0.4 + h(i, seed + 2)), at[2] + Math.sin(th) * r], c: [0.78, 0.66, 0.52], s: 0.22 + 0.4 * d, a: 0.42 * (1 - d) });
  }
}
export function effects(t, cast, world) {
  const add = [], soft = []; let flash = 0, black = 0, ca = 0, bloomBoost = 0; const sl = { i: 0, p: [0, 0, 0] };
  const HOT = [2.0, 1.3, 0.6];
  // footfall dust while A runs (contacts of the run cycle)
  const phiNow = (runZ(Math.min(t, 3.0)) + 26) / STRIDE;
  for (const c of runContacts(Math.max(0, phiNow - 0.6), Math.min(phiNow, (runZ(3.0) + 26) / STRIDE))) {
    const z = c * STRIDE - 26, tc = (z + 26) / 6.6; puff(soft, t, tc, [pathX(z), world.heightAt(pathX(z), z), z], 5, Math.round(c * 10), 0.35, 0.35);
  }
  const g = world.heightAt(AX, 0);
  puff(soft, t, 3.12, [AX, g, -5.2], 8, 3);             // plant
  puff(soft, t, 3.84, [AX, g, -0.4], 12, 5, 0.9);        // landing
  for (let k = 0; k < 5; k++) puff(soft, t, 4.88 + k * 0.08, [AX, g, 2.2 + k * 0.4], 4, 20 + k, 0.4, 0.5);   // B's slide
  puff(soft, t, 5.62, [AX, g, 4.3], 8, 31, 0.6);         // B kneels
  puff(soft, t, 7.5, [AX + 1, g, 3.5], 10, 41, 0.8);     // A slide stop
  puff(soft, t, 7.95, [AX - 1, g, -0.5], 8, 51, 0.6);    // B drops
  // sparks: clash, thrust hit, crossing
  burst(add, t, INS1, CONTACT.clash, 70, 7, HOT);
  burst(add, t, INS2, CONTACT.hit, 55, 9, HOT);
  burst(add, t, FLASH, CONTACT.cross, 60, 11, HOT);
  for (const [t0, p] of [[INS1, CONTACT.clash], [INS2, CONTACT.hit], [FLASH, CONTACT.cross]]) { const d = t - t0; if (d >= 0 && d < 0.25) { sl.i = Math.max(sl.i, 1.2 * (1 - d / 0.25)); sl.p = p; } }
  // air motes (warm, drifting)
  for (let i = 0; i < 160; i++) {
    const x = -10 + 20 * h(i, 61) + 0.3 * Math.sin(t * 0.4 + i), y = 0.6 + 5 * h(i, 62) + 0.12 * t * (0.5 + h(i, 63)), z = -14 + 26 * h(i, 64) + 0.2 * Math.cos(t * 0.3 + i);
    add.push({ p: [x, y % 6 + 0.6, z], c: [1.0, 0.8, 0.55], s: 0.02 + 0.025 * h(i, 65), a: 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + i)) });
  }
  // inserts + flash grammar
  const inIns = (t0) => t >= t0 && t < t0 + 2 * DT - 1e-6;
  if (inIns(INS1) || inIns(INS2)) { ca = 0.7; bloomBoost = 0.05; }
  if (t >= FLASH && t < FLASH + DT - 1e-6) flash = 1;
  else if (t >= FLASH + DT - 1e-6 && t < FLASH + 3 * DT - 1e-6) black = 1;
  if (t > FLASH + 3 * DT && t < FLASH + 0.5) { ca = 0.6 * (1 - (t - FLASH) / 0.5); }
  return { add, soft, flash, black, ca, bloomBoost, sparkLight: sl };
}
