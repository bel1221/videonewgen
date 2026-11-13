// Choreography, cameras and effect timing for the fight_w "v8x" duel (sword vs a different legendary weapon). Pure functions of t.
// Modelled on Marlow's Downfall (study §2): fight shots 0.3-0.8 s, long anticipation -> short strike, 2-frame impact
// inserts with flare, knockback that travels, cold palette with warm sparks only, camera always moving.
import * as THREE from 'three';

export const TOTAL = 37.75;
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
function N() { const p = { wrist: 160, roll: 0, y: 0, yawOff: 0, lh: 0, rh: 0, draw: 0, aimK: 0, wide: 1, plant: 0, pierce: 0, lhAt: 0, tilt: [0, 0], yawAbs: null, bd: [0, 0.94, 0.34] }; for (const j of JK) p[j] = [0, 0, 0]; return p; }
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


// ---- fight_w weapon poses. lh = left hand on the shaft (two-handed IK), aimK = bow arm aims at the opponent (IK),
// rh = right hand on the bowstring (IK), draw = 0 (at the bow) .. 1 (at the jaw). bd = weapon axis in the torso frame.
// spear (Boltspear): side-on stance, two hands on the shaft; one-handed long jab; sweeps; shaft blocks
L.spGuard = S(G, { rLeg: [-30, 0, -8], rKnee: [36, 0, 0], lLeg: [22, 0, 8], lKnee: [24, 0, 0], waist: [12, -30, 0], chest: [4, -16, 0], head: [-8, 34, 0],
  rArm: [-46, 0, -14], rElbow: [-58, 0, 0], lh: 1, y: -0.2 });
L.spWind = S(L.spGuard, { rArm: [-24, 0, -18], rElbow: [-92, 0, 0], chest: [0, -34, 0], waist: [8, -34, 0], head: [-6, 50, 0], y: -0.24 });
L.spThrust = S(G, { rLeg: [-62, 0, -6], rKnee: [52, 0, 0], lLeg: [36, 0, 6], lKnee: [8, 0, 0], waist: [18, -10, 0], chest: [10, -6, 0], head: [-12, 16, 0],
  rArm: [-84, 0, -6], rElbow: [-8, 0, 0], lh: 1, y: -0.34 });
L.spJab = S(L.spThrust, { lh: 0, rArm: [-94, 0, -4], rElbow: [-2, 0, 0], lArm: [34, 0, 34], lElbow: [-20, 0, 0], waist: [16, -4, 0], chest: [8, -4, 0] });
L.spSweepW = S(G, { waist: [24, -50, 0], chest: [10, -40, 0], head: [-10, 60, 0], rArm: [-40, 0, -40], rElbow: [-40, 0, 0], lh: 1, rKnee: [60, 0, 0], lKnee: [50, 0, 0], y: -0.4 });
L.spSweep = S(G, { waist: [30, 30, 0], chest: [12, 30, 0], head: [-10, -40, 0], rArm: [-60, 0, 30], rElbow: [-20, 0, 0], lh: 1, rLeg: [-50, 0, -10], rKnee: [90, 0, 0], lLeg: [40, 0, 10], lKnee: [80, 0, 0], y: -0.55 });
L.spOverW = S(G, { rArm: [-170, 0, -20], rElbow: [-70, 0, 0], chest: [-12, -10, 0], waist: [-4, -10, 0], head: [-12, 10, 0], lh: 1, y: -0.12 });
L.spOver = S(G, { rArm: [-70, 0, -10], rElbow: [-14, 0, 0], chest: [24, -6, 0], waist: [22, -6, 0], head: [6, 6, 0], lh: 1, rLeg: [-44, 0, -6], rKnee: [60, 0, 0], lLeg: [22, 0, 6], lKnee: [40, 0, 0], y: -0.36 });
L.spBlock = S(G, { rArm: [-80, 0, -30], rElbow: [-50, 0, 0], chest: [0, -10, 0], waist: [6, -10, 0], lh: 1, y: -0.24 });
L.spBlockL = S(L.spBlock, { rArm: [-70, 0, 12], rElbow: [-62, 0, 0], chest: [0, 12, 0], waist: [6, 8, 0] });   // shaft angled across the other way
L.spBlockV = S(G, { rArm: [-66, 0, -24], rElbow: [-70, 0, 0], lh: 1, y: -0.22 });                                    // shaft upright in front
L.spBlockH = S(G, { rArm: [-160, 0, -24], rElbow: [-30, 0, 0], chest: [-6, 0, 0], head: [-16, 0, 0], lh: 1, y: -0.24 });
// sword low blocks (against sweeps at the legs)
L.parryLowR = S(G, { rArm: [-30, 0, -36], rElbow: [-24, 0, 0], chest: [8, -14, 0], waist: [12, -8, 0], rKnee: [56, 0, 0], lKnee: [46, 0, 0], y: -0.34 });
L.parryLowL = S(G, { rArm: [-40, 0, 26], rElbow: [-40, 0, 0], chest: [8, 18, 0], waist: [12, 8, 0], rKnee: [56, 0, 0], lKnee: [46, 0, 0], y: -0.34 });
// heavy two-handed hammer (golem_hammer): weight shows in long wind-ups, deep stances and follow-through
L.hmGuard = S(G, { rArm: [-40, 0, -22], rElbow: [-76, 0, 0], waist: [12, -20, 0], chest: [6, -12, 0], head: [-8, 28, 0], lh: 1, rLeg: [-26, 0, -10], rKnee: [40, 0, 0], lLeg: [22, 0, 12], lKnee: [30, 0, 0], y: -0.22 });
L.hmRest = S(L.relaxed, { rArm: [-14, 0, -16], rElbow: [-8, 0, 0], lh: 0, lArm: [6, 0, 10] });
L.hmWindO = S(G, { rArm: [-195, 0, -12], rElbow: [-56, 0, 0], chest: [-18, 0, 0], waist: [-10, 0, 0], head: [-16, 0, 0], lh: 1, rKnee: [30, 0, 0], lKnee: [24, 0, 0], y: -0.08 });
L.hmSlam = S(G, { rArm: [-72, 0, -6], rElbow: [-10, 0, 0], chest: [26, 0, 0], waist: [38, 0, 0], head: [-6, 0, 0], lh: 1, rLeg: [-56, 0, -8], rKnee: [80, 0, 0], lLeg: [30, 0, 8], lKnee: [60, 0, 0], y: -0.46 });   // hands stay above the sand: the head lands ON it
L.hmWindS = S(G, { rArm: [-60, 0, -60], rElbow: [-50, 0, 0], chest: [4, -60, 0], waist: [8, -34, 0], head: [-8, 60, 0], lh: 1, rKnee: [44, 0, 0], lKnee: [36, 0, 0], y: -0.26 });
L.hmSwing = S(G, { rArm: [-80, 0, 30], rElbow: [-14, 0, 0], chest: [10, 40, 0], waist: [12, 24, 0], head: [-8, -36, 0], lh: 1, rLeg: [-40, 0, -6], rKnee: [50, 0, 0], lLeg: [26, 0, 6], lKnee: [24, 0, 0], y: -0.3 });
L.hmUpperW = S(G, { waist: [30, -20, 0], chest: [16, -30, 0], rArm: [-20, 0, -30], rElbow: [-30, 0, 0], lh: 1, rKnee: [70, 0, 0], lKnee: [60, 0, 0], y: -0.5 });
L.hmUpper = S(G, { waist: [-10, 10, 0], chest: [-16, 10, 0], head: [-20, 0, 0], rArm: [-160, 0, -10], rElbow: [-20, 0, 0], lh: 1, y: 0.0 });
L.hmBlock = S(G, { rArm: [-120, 0, -36], rElbow: [-40, 0, 0], chest: [-4, -6, 0], lh: 1, y: -0.26 });
L.hmSweep = S(L.hmSwing, { y: -0.6, rKnee: [90, 0, 0], lKnee: [80, 0, 0], waist: [40, 24, 0], chest: [16, 40, 0] });   // low sweep at the legs
L.hmBlockL = S(L.hmBlock, { rArm: [-110, 0, 20], chest: [-4, 14, 0] });
L.hmBlockV = S(G, { rArm: [-60, 0, -26], rElbow: [-80, 0, 0], lh: 1, y: -0.24 });
L.hmSpin = S(G, { rArm: [-90, 0, -40], rElbow: [-10, 0, 0], chest: [0, -10, 0], lh: 1, y: -0.3 });
// bow (Voidbow, left hand): side-on archer stance; the bow arm aims by IK, the string hand draws to the jaw
L.bwIdle = S(G, { lArm: [-20, 0, 14], lElbow: [-24, 0, 0], rArm: [-10, 0, -12], rElbow: [-20, 0, 0], waist: [8, -10, 0], chest: [2, -6, 0], wrist: 160 });
L.bwNock = S(G, { yawOff: -62, aimK: 1, rh: 1, draw: 0.05, waist: [6, 0, 0], chest: [2, 0, 0], head: [-4, 58, 0], rLeg: [-20, 0, -14], rKnee: [24, 0, 0], lLeg: [16, 0, 14], lKnee: [20, 0, 0], y: -0.12 });
L.bwDraw = S(L.bwNock, { draw: 1, head: [-6, 60, 0] });
L.bwLoose = S(L.bwNock, { draw: 0, rh: 0, rArm: [-74, 0, -84], rElbow: [-12, 0, 0] });
L.bwBlock = S(G, { lArm: [-120, 0, 10], lElbow: [-40, 0, 0], rArm: [-110, 0, -20], rElbow: [-50, 0, 0], chest: [-6, 0, 0], y: -0.24 });
// ---- duel40: upright ready stance (standard: no forward-leaning stance), sprint start with a light lean, two-handed
// greatsword (Goldreaper) set built on the sword poses with the left hand on the handle, jump plunge, shoulder carry
L.ready = S(G, { waist: [6, -14, 0], chest: [2, -8, 0], head: [-6, 18, 0], rKnee: [24, 0, 0], lKnee: [18, 0, 0], y: -0.1 });
L.sprintGo = S(L.ready, { waist: [14, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0], rLeg: [-30, 0, -6], rKnee: [40, 0, 0], lLeg: [20, 0, 6], lKnee: [30, 0, 0], y: -0.18 });
L.spReady = S(L.spGuard, { waist: [6, -26, 0], chest: [2, -14, 0], y: -0.06, rKnee: [16, 0, 0], lKnee: [12, 0, 0], wide: 0.5 });   // alert but upright
L.gsGuard = S(G, { rArm: [-52, 0, -8], rElbow: [-62, 0, 0], lh: 1, waist: [8, -16, 0], chest: [2, -10, 0], head: [-6, 22, 0], y: -0.14 });
for (const n of ['windR', 'slashR', 'windL', 'slashL', 'windO', 'slashO', 'windT', 'thrust', 'parryH', 'parryR', 'parryL', 'parryLowR', 'parryLowL', 'bind'])
  if (L[n]) L['gs' + n[0].toUpperCase() + n.slice(1)] = S(L[n], { lh: 1 });
L.gsPlungeW = S(G, { rArm: [-176, 0, -8], rElbow: [-40, 0, 0], lh: 1, chest: [-10, 0, 0], waist: [-6, 0, 0], head: [8, 0, 0], y: 0.2 });
L.gsPlunge = S(G, { rArm: [-66, 0, -6], rElbow: [-12, 0, 0], lh: 1, waist: [34, 0, 0], chest: [20, 0, 0], head: [-4, 0, 0], rLeg: [-56, 0, -8], rKnee: [80, 0, 0], lLeg: [28, 0, 8], lKnee: [60, 0, 0], y: -0.44 });
L.gsRest = S(L.relaxed, { rArm: [-150, 0, -26], rElbow: [-112, 0, 0], lh: 0, head: [2, 0, 0] });
L.gsPoint = S(L.point, { lh: 0 });
L.slideLow = S(L.skid, { waist: [16, 0, 0], chest: [10, 0, 0], head: [-14, 0, 0], rLeg: [-60, 0, -6], rKnee: [70, 0, 0], lLeg: [40, 0, 10], lKnee: [80, 0, 0], y: -0.5 });
// knocked flat on the back (legs straight so nothing goes through the sand; back resting on it, arms flung out)
L.lieBack = S(N(), { tilt: [-86, 0], y: 0.14, rLeg: [-4, 0, -8], rKnee: [8, 0, 0], lLeg: [6, 0, 8], lKnee: [12, 0, 0], head: [12, 0, 0],
  rArm: [-150, 0, -34], rElbow: [-12, 0, 0], lArm: [-160, 0, 30], lElbow: [-10, 0, 0], wrist: 160 });
L.spCharge = S(L.spGuard, { waist: [14, -18, 0], chest: [6, -12, 0], head: [-10, 26, 0], y: -0.16 });   // running charge, spear levelled two-handed
// idle / calm states: standing straight, natural stance width (user: legs must not be bent when idling or walking)
L.spIdle = S(L.relaxed, { rArm: [-22, 0, -14], rElbow: [-34, 0, 0], lh: 0, wide: 0 });               // spear held upright at the side like a staff
L.gsIdle = S(L.relaxed, { rArm: [-34, 0, -10], rElbow: [-38, 0, 0], lh: 1, wide: 0, head: [4, 0, 0] });   // greatsword held low in front, two hands
L.gsRest.wide = 0; L.relaxed.wide = 0;
L.lieBack.rArm = [-24, 0, -52]; L.lieBack.rElbow = [-10, 0, 0]; L.lieBack.lArm = [-30, 0, 48];   // arms out to the sides: the spear lies beside him, not across his face
L.gsCrouch = S(L.gsGuard, { rLeg: [-36, 0, -6], rKnee: [74, 0, 0], lLeg: [22, 0, 6], lKnee: [64, 0, 0], waist: [18, -12, 0], y: -0.32 });
L.gsHop = S(L.gsGuard, { rLeg: [-44, 0, -4], rKnee: [80, 0, 0], lLeg: [-18, 0, 4], lKnee: [86, 0, 0], waist: [4, -10, 0], y: 0.6 });   // hop: sword stays in guard (no arms-up over the head)
L.gsLand = S(L.gsGuard, { rKnee: [60, 0, 0], lKnee: [52, 0, 0], waist: [16, -14, 0], y: -0.26 });
L.spOverW.rArm = [-160, 0, -36];   // arm beside the head, not over it
L.gsWindR.rArm = [-140, 0, -62]; L.gsWindR.rElbow = [-66, 0, 0];   // two-handed wind-up out to the side, not past the head
// Minecraft proportions: a raised hand reaches 31.5 px, the head top is 32 px -> a shaft can never pass ABOVE the head.
// High blocks are held forward-up, in front of the forehead; two-handed parries keep the hilt away from the face.
L.spBlockH.rArm = [-140, 0, -30]; L.spBlockH.rElbow = [-20, 0, 0];
for (const n of ['gsParryH', 'gsParryL', 'gsParryR']) { L[n].rElbow = L[n].rElbow.map(v => v * 0.55); }
L.gsParryH.rArm = [-136, 0, -30];
L.gsSlashR.rArm = [-60, 0, 18];   // two-handed follow-through stays in front, the right arm does not cross into the chest
// sword wind-ups/parries kept clear of the head (phase QA: the hand sat by the ear / above the head, so the blade's base started
// inside the head and no rotation about the hand could free it)
L.windO.rArm = [-168, 0, -38]; L.windO.rElbow = [-70, 0, 0];   // arm up and OUT; blade cocked behind the right shoulder (bd below)
L.windL.rArm = [-104, 0, 46]; L.windL.rElbow = [-88, 0, 0];    // hand lower and further from the face
L.parryH.rArm = [-136, 0, -30]; L.parryH.rElbow = [-30, 0, 0];   // high parry forward-up, in front of the forehead
L.windR.rArm = [-150, 0, -54];

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
const BDW = { windO: [42, -150], windL: [30, 130], gsCrouch: [60, 18], gsHop: [60, 18], gsLand: [60, 18], spIdle: [72, 8], gsIdle: [-32, 8], spCharge: [-4, 30], lieBack: [-8, -95], ready: [64, -6], sprintGo: [20, -150], spReady: [-6, 40], gsGuard: [60, 18], gsPlungeW: [-70, 4], gsPlunge: [-50, 0], gsRest: [-12, 175], slideLow: [10, -115],
  parryLowR: [-55, -35], parryLowL: [-55, 35], spGuard: [-6, 46], spWind: [-2, 68], spThrust: [0, 16], spJab: [0, 8], spSweepW: [-28, -60], spSweep: [-30, -60], spOverW: [40, 140], spOver: [-30, 12],
  spBlock: [12, -80], spBlockL: [12, 70], spBlockV: [72, 10], spBlockH: [6, -88], hmGuard: [55, 20], hmRest: [-70, -10], hmWindO: [30, 180], hmSlam: [-22, 0], hmWindS: [12, -110], hmSwing: [4, -44],
  hmUpperW: [-50, 30], hmUpper: [75, 0], hmBlock: [20, -84], hmBlockL: [20, 84], hmBlockV: [72, 0], hmSweep: [-30, -44], hmSpin: [0, -100], bwIdle: [-50, 20], bwNock: [84, 62], bwDraw: [84, 62], bwLoose: [84, 62], bwBlock: [5, 90] };
for (const k in BDW) if (L[k]) L[k].bd = bdv(...BDW[k]);
for (const n in L) if (n.startsWith('gs') && !BDW[n]) { const b = n[2].toLowerCase() + n.slice(3); if (L[b] && L[b].bd) { L[n].bd = L[b].bd.slice(); delete L[n]._flat; } }   // greatsword copies inherit the sword blade intents
if (L.gsWindR) L.gsWindR.bd = bdv(25, -135);   // greatsword wind-up held out to the side
function mix(a, b, u) {
  const o = { wrist: lerp(a.wrist, b.wrist, u), roll: lerp(a.roll, b.roll, u), y: lerp(a.y, b.y, u), yawOff: lerp(a.yawOff, b.yawOff, u),
    lh: lerp(a.lh || 0, b.lh || 0, u), rh: lerp(a.rh || 0, b.rh || 0, u), draw: lerp(a.draw || 0, b.draw || 0, u), aimK: lerp(a.aimK || 0, b.aimK || 0, u), wide: lerp(a.wide ?? 1, b.wide ?? 1, u), plant: lerp(a.plant || 0, b.plant || 0, u), pierce: lerp(a.pierce || 0, b.pierce || 0, u), lhAt: lerp(a.lhAt || 0, b.lhAt || 0, u), tilt: [lerp(a.tilt[0], b.tilt[0], u), lerp(a.tilt[1], b.tilt[1], u)],
    yawAbs: (a.yawAbs != null && b.yawAbs != null) ? lerp(a.yawAbs, b.yawAbs, u) : (u < 0.5 ? a.yawAbs : b.yawAbs) };
  o.fkR = u < 0.5 ? a.fkR : b.fkR; o.fkL = u < 0.5 ? a.fkL : b.fkL;
  { const ba = a.bd || [0, 1, 0], bb = b.bd || [0, 1, 0], v = ba.map((x, i) => lerp(x, bb[i], u)), n = Math.hypot(...v) || 1; o.bd = v.map(x => x / n); }
  for (const j of JK) o[j] = a[j].map((v, i) => lerp(v, b[j][i], u)); return o;
}
// pose <-> flat numeric vector (for spline interpolation)
const FLAT_KEYS = ['wrist', 'roll', 'y', 'yawOff', 'lh', 'rh', 'draw', 'aimK', 'wide', 'plant', 'pierce', 'lhAt'];
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
const WALK = { A: [], B: [] };
const T = { A: [], B: [] }, P = { A: [], B: [] }, RUN = { A: [], B: [] }, BR = { A: [], B: [] }, TWIRL = { A: [], B: [] };   // TWIRL: [t0, t1, turns]
let GRIPT = null; export function setGrip(g) { GRIPT = g; }
export const PARRY = [];
export const ARROWS = [];   // fight_w bow: { tn (nock), t0 (release), t1 (arrives), mode: 'deflect'|'dodge'|'ground', dx, dz }
const GKC = { A: null, B: null };   // per-fighter grip-blend override (bow: 0)   // v8: defence keys whose parry pose fight.js re-chooses from the real blade geometry
const k = (c, t, pose, e, d) => T[c].push([t, d ? S(pose, d) : pose, e]);
const at = (c, t, x, z, e) => P[c].push([t, x, z, e]);
export const CLASHES = [];
function SWINGS() { const out = []; for (const c of ['A', 'B']) for (const [t, p, e] of T[c]) if (e === 'i' && t > 0.3) out.push([+t.toFixed(3), c]); return out.sort((a, b) => a[0] - b[0]); }   // {t, big, kind}
const clash = (t, big = false, kind = 'blade', extra = {}) => CLASHES.push({ t, big, kind, ...extra });

function buildAll() {
  // V8X = the v8 "blade masters" remake (user, 2026-11-12), 37.75 s of animation + 2 slow-motion moments = 40.0 s of video.
  // A = Aegisblade vs B = Veilblade, both at the reference sheet's size and grip (medium class). What changed against v8:
  //   + split-panel face intro like bolt30 (0-2.9 s), heads down, slowly looking up
  //   - the duplicate jump attack at 17 s (S8's hop-and-cut) and the blade lock at 20 s ("hugging") are gone
  //   + one new exchange (N1): run in, cut, riposte, a thrust that misses the face in slow motion, a kick into a slide
  //   + new ending: A ducks under the cut and runs B through the chest, holds, pulls the sword out; B drops; logo outro
  //   ~ every wind-up at least 0.22 s, no flurry over 3 hits (weight class), twirls only in the opening (user: once or twice a video),
  //     the free hand flows instead of sitting raised (assemble_w.py freeArm), no corner texts
  // v8's own scenes are kept as they were and moved in time by W8(); the body below is build_v8.js with the cuts above.
  weapons('aegisblade', 'veilblade');
  const LN = 3.55, TEND = TOTAL - 0.8 - LN;                               // N1's length; the end of the animation in v8's own time
  const W8 = t => t < 17.9 ? t + 2.9 : t < 21.5 ? t + 2.1 : t < 24.58 ? t + 0.8 : t + 0.8 + LN;
  SLOWMO.push([27.0, 27.45, 0.25], [W8(26.38) - 0.12, W8(26.38) + 0.18, 0.25]);   // the close call, and the stab
  // ================= 0-2.9 face intro: both stand with their heads down and slowly look up =================
  k('A', 0, S(L.relaxed, { head: [30, 0, 0] })); k('A', 0.4, S(L.relaxed, { head: [30, 0, 0] }), 'lin'); k('A', 2.3, S(L.relaxed, { head: [-12, 0, 0] }), 'io'); k('A', 2.86, L.relaxed, 'io');
  k('B', 0, S(L.relaxed, { head: [32, 0, 0] })); k('B', 0.6, S(L.relaxed, { head: [32, 0, 0] }), 'lin'); k('B', 2.45, S(L.relaxed, { head: [-10, 0, 0] }), 'io'); k('B', 2.88, L.relaxed, 'io');
  BR.A.push([0, 2.9]); BR.B.push([0, 2.9]);
  // ================= v8, time-warped =================
  const wrap = o => ({ A: { push: (...ws) => ws.forEach(w => o.A.push([W8(w[0]), W8(w[1])].concat(w.slice(2)))) }, B: { push: (...ws) => ws.forEach(w => o.B.push([W8(w[0]), W8(w[1])].concat(w.slice(2)))) } });
  const noTw = p => (p === L.twirlS || p === L.twirlF);                    // twirls only in the opening (old time < 2.4)
  (function (k, at, clash, RUN, BR, PARRY, evalPosT, face, pose, FLASH, tw, sprint) {
  const D = { A: {}, B: {} };                                         // persistent per-character overrides (spin offsets)
  const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
  const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
  const STRIKE = { R: ['windR', 'slashR', 'parryL'], L: ['windL', 'slashL', 'parryR'], O: ['windO', 'slashO', 'parryH'], T: ['windT', 'thrust', 'parryR'] };
  // defence keys go through blk(): the parry pose is re-chosen in fight.js (parryL/R/H, whichever meets the real blade)
  const blk = (def, t0, t1, name, d1 = {}, d2 = {}, e0 = 'o') => { const b0 = { ...D[def] }; K(def, t0, L[name], e0, d1); K(def, t1, L[name], 'lin', d2);
    const k2 = T[def][T[def].length - 1], k1 = T[def][T[def].length - 2]; PARRY.push({ t: t1, def, apply: n => { k1[1] = S(L[n], { ...b0, ...d1 }); k2[1] = S(L[n], { ...b0, ...d2 }); } }); };
  const ex = (att, def, t, s, big = false, wind = 0.16) => { const [w, sl, pa] = STRIKE[s]; wind = Math.max(wind, 0.22); /* medium swords: a real wind-up (weight class) */ K(att, t - wind, L[w], 'o'); K(att, t, L[sl], 'i'); blk(def, t - wind + 0.02, t, pa, {}, s === 'T' ? { waist: [10, 0, -18] } : {}); clash(t, big); };
  // ================= SHARED sword work (user reviews 2026-11-13; every part built from here on uses these) =================
  // What part 1 taught, measured with qa/v8x/part_check.mjs + jitter_probe.js (rules in notes/fight-animation-standard.md):
  //   - hits about 2.1 blocks apart so the blades meet mid-blade, clashes at head / chest level (never above the heads);
  //   - the sword stays beside and in front of the body: the overhead wind-up, a forward-leaning guard and the low sprint carry all
  //     sat inside the blade-is-solid push-out and were thrown 60-128 deg in one frame (the jitter);
  //   - a cut is one even-speed 0.3 s sweep that stops ON the guard; the defender's sword travels to the guard over the whole gap;
  //   - hits 0.5 s or more apart; a knock-back is a real slide (1.4-3 blocks) that runs straight into the next move, never a wait.
  const far = (o = {}) => Object.assign(CLASHES[CLASHES.length - 1], { gap: 1.4, fwMax: 0.2, hmin: 0.95, hmax: 1.45, ...o });   // spacing + contact height for the clash just keyed
  const SWm = { rArm: [-10, 0, -20], rElbow: [-62, 0, 0], bd: bdv(28, -18) };                               // run carry: sword at the hip pointing forward-up
  const midWind = S(L.windR, { rArm: [-72, 0, -72], rElbow: [-58, 0, 0], bd: bdv(16, -128) });            // drawn back to the right side at chest height
  const midCut = S(L.slashR, { rArm: [-82, 0, 18], rElbow: [-16, 0, 0], bd: bdv(12, 38) });               // the cut stops in front of the chest, on the guard
  const loParry = S(L.parryL, { rArm: [-42, 0, 46], rElbow: [-76, 0, 0], bd: bdv(68, 34) });              // guard: hand at chest height close to the body, blade upright
  // hit(att, def, t, big, { wind, da, dd, meta }): a chest-level cut into a guard at time t. Key both roots about 2.1 blocks apart at t.
  // The blade intent (bd) is blended as a straight line between keys, so two keys pointing nearly opposite ways (wind-back -> cut is
  // 166 deg) do all their turning in the middle of the segment: 80-150 deg in 1/60 s (measured, part 2). So the cut gets a half-way key
  // (midSweep), and an attacker coming straight from his own cut passes through the guard first ({ rec: true }).
  const midSweep = S(L.slashR, { rArm: [-78, 0, -28], rElbow: [-36, 0, 0], chest: [6, 4, 0], waist: [8, 2, 0], bd: bdv(14, -46) });
  const hit = (att, def, t, big = false, o = {}) => { const wind = o.wind ?? 0.3; if (o.rec) K(att, t - wind - 0.14, loParry, 'io', o.da);
    K(att, t - wind, midWind, 'io', o.da); K(att, t - wind * 0.5, midSweep, 'lin', o.da); K(att, t, midCut, 'lin', o.da);
    K(def, t - 0.08, loParry, 'io', o.dd); K(def, t, loParry, 'lin', o.dd); clash(t, big); far(o.meta); };
  // knockTo(c, t, x, z, dur, rest): c is thrown back from a hit at t and slides to (x, z) over dur seconds with sand spray; rest = false
  // when the next move (a sprint) starts straight out of the slide.
  // step(c, t0, t1, stride): c travels on REAL steps between t0 and t1 (a stepping-gait window; stride = blocks per right + left step).
  // user, 2026-11-13: "LEGS not moving wide enough again theres a bunch of small steps that make the movement looks cursed ... we fixed
  // this before". The fix existed (assemble_w.py, DRIFT footwork) but only inside gait windows: any travel keyed with at() OUTSIDE a
  // RUN / WALK / step window is walked by the reactive planner, one tiny step each time a foot falls 0.17 blocks behind.
  // Since the "fix the not right part" round the stepping is AUTOMATIC (assemble_w.py, STEP PLANNER 2): all ground travel outside a
  // sprint (RUN), a slide (knockTo / slide) or a jump is walked on real steps, one foot at a time. Nothing to declare here; a move
  // faster than about 3.5 blocks/s still has to be a RUN window. Check with qa/v8x/steps_probe.js (part_check.mjs prints it).
  const knockTo = (c, t, x, z, dur = 0.55, rest = true) => { at(c, t + dur, x, z, 'o'); K(c, t + 0.1, L.hitBack, 'io'); K(c, t + 0.26, L.skid, 'io'); K(c, t + dur - 0.05, L.skid, 'lin');
    if (rest) K(c, t + dur + 0.12, G, 'io'); slide(c, W8(t + 0.12), W8(t + dur)); };
  // ================= S1 0-2.4  sword skill: both twirl their swords, B points the blade at A =================
  at('A', 0, -3.4, 0); at('A', 2.15, -3.4, 0); at('B', 0, 3.4, 0); at('B', 2.2, 3.4, 0);
  K('A', 0, L.relaxed); K('A', 0.28, L.twirlS, 'io'); K('A', 1.0, L.twirlS, 'lin'); K('A', 1.18, G, 'o'); K('A', 1.9, G, 'io');
  tw('A', 0.3, 1.02, 2);
  K('B', 0, L.relaxed); K('B', 0.8, L.relaxed, 'io'); K('B', 0.95, L.twirlF, 'io'); K('B', 1.62, L.twirlF, 'lin'); K('B', 1.8, L.point, 'o'); K('B', 2.05, L.point, 'lin'); K('B', 2.22, G, 'io');
  tw('B', 0.97, 1.63, 2);
  BR.A.push([0, 2.1]); BR.B.push([0, 2.1]);
  // ================= S2 2.15-5.0  sprint in, exchange while strafing sideways, big clash, both skid apart ==========
  // user, part-1 review 2026-11-13: "fighters on first exchanges are too close ... sword have no space", "skid apart also too short",
  // swords too quick to read -> a 1.6-block gap held at every hit (was 1.2 keyed, about 0.9 after the solver stepped them in; 2.0 was measured too far for the blades to meet), 3 cuts 0.42 s apart with 0.3 s wind-ups (was 4 at 0.35 s), a longer skid with sand spray
  sprint('A', 2.15, 2.72, [-3.4, 0], [-1.05, 0.2]); sprint('B', 2.2, 2.72, [3.4, 0], [1.05, -0.1]);
  K('A', 2.15, L.crouch, 'io', SWm); K('A', 2.55, L.guard, 'lin', SWm); K('B', 2.22, L.crouch, 'io', SWm); K('B', 2.5, L.guard, 'lin', SWm);
  // per-hit distances are the ones measured to let the blades meet (clash distance 0-0.13 blocks): 1.9 for a cut from range, 1.5 for the close reply
  // user, part-1 v2 review 2026-11-13: "the swords are like jittering when theyre raising their sword up for clashing" and "i want to see
  // more motions where swords are clashing below their head ... at head level or chest level".
  // Measured (qa/v8x/jitter_probe.js): the blade direction snapped 45-125 deg in 1/60 s - the cut ('i' ease) landed in 2 frames, and the
  // defender's sword whipped up to its parry in 2 frames ('o' ease, 0.14 s) right after its own cut; every clash was 1.9-2.3 blocks up
  // (head top = 1.6). So here: 3 hits 0.55 s apart, a smooth wind-back, an even-speed 0.3 s cut that stops ON the parry, the defender's
  // sword travelling to a LOW parry over the whole gap, and a ceiling on the contact height (hmax, the solver keeps the blades under it).
  // 2.1 blocks apart: the blades meet mid-blade. Closer (1.5-1.9) the attacker's forearm reached the defender's blade and the
  // blade-is-solid push-out threw that blade 127 deg in one frame (measured).
  const S2 = [[3.0, -1.05, 0.6, 1.05, 0.5], [3.55, -1.05, 1.5, 1.05, 1.4], [4.1, -1.05, 2.5, 1.05, 2.4]];
  for (const [t, ax, az, bx, bz] of S2) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); }
  hit('B', 'A', 3.0); hit('A', 'B', 3.55); hit('B', 'A', 4.1, true);   // the last one is the big one (impact insert): both thrown back
  at('A', 4.95, -3.2, 3.1, 'o'); at('B', 4.95, 3.1, 2.8, 'o');
  K('A', 4.42, L.skid, 'io'); K('A', 4.86, L.skid, 'lin'); K('A', 5.0, G, 'io'); K('B', 4.42, L.skid, 'io'); K('B', 4.86, L.skid, 'lin'); K('B', 5.0, G, 'io');   // eased into the skid pose: on a hard 'o' at 4.26 the blade whipped 74 deg in 1/60 s off the clash
  slide('A', W8(4.28), W8(4.9)); slide('B', W8(4.28), W8(4.9));
  // ================= S3 5.0-7.5  B rushes with a flat cut, A ducks and slips past, ONE spin cut, a big cut; B is thrown 3 blocks back =========
  // part 2 (user, 2026-11-13): "the fighter gets knocked back only a little and they takes too long to get back into the fight" ->
  // longer knock-backs that run straight into the next attack, no standing waits. Was: two spin cuts 0.33 s apart from 0.9 blocks
  // (both missed by 0.6), a rising cut, a 2-block knock-back and 0.6 s of both standing.
  RUN.B.push([5.05, 5.45]); at('B', 5.05, 3.1, 2.8); at('B', 5.5, 0.55, 2.6, 'lin'); at('B', 5.8, 0.15, 2.65, 'o');
  K('B', 5.05, L.crouch, 'io', SWm); K('B', 5.2, L.guard, 'lin', SWm); K('B', 5.26, midWind, 'io'); K('B', 5.38, midSweep, 'lin'); K('B', 5.5, midCut, 'lin'); K('B', 5.85, L.skid, 'io'); K('B', 6.0, G, 'io');   // the cut lands at 5.5, while A is still out of reach (at 5.62 it ran 2 px through the ducking A)
  // A slips past 1.6 blocks wide of B (0.9 before: B's cut and A's sword were pushed out of each other's bodies, 150 deg in a frame)
  at('A', 5.05, -3.2, 3.1); at('A', 5.62, -0.25, 4.2, 'lin'); at('A', 6.0, 2.0, 2.45, 'o');
  RUN.A.push([5.08, 5.9, 'charge']);   // 5.6 blocks in under a second is a run, not a shuffle (it had no gait window at all)
  K('A', 5.25, G); K('A', 5.45, L.duck, 'o'); K('A', 5.75, L.duck, 'lin'); K('A', 5.95, L.skid, 'o');
  K('A', 6.12, L.spin, 'lin', { yawOff: -190 }); K('A', 6.34, midCut, 'lin', { yawOff: -360 }); D.A = { yawOff: -360 };
  K('B', 6.26, loParry, 'io'); K('B', 6.34, loParry, 'lin'); clash(6.34); far();
  at('A', 6.34, 2.0, 2.5, 'io'); at('B', 6.34, -0.1, 2.7, 'io');
  at('A', 6.88, 1.75, 2.5, 'io'); at('B', 6.88, -0.35, 2.68, 'io'); hit('A', 'B', 6.88, true, { rec: true });
  knockTo('B', 6.88, -3.7, 2.8, 0.62, false);
  K('A', 7.12, G, 'io'); at('A', 7.2, 1.75, 2.5);
  // ================= S4 7.6-9.4  B sprints straight out of the slide and leaps into an aerial spinning overhead; A blocks and is driven back; B follows with a cut ==
  RUN.B.push([7.6, 8.02]); at('B', 7.6, -3.7, 2.8); at('B', 8.06, -0.65, 2.6, 'lin'); at('B', 8.5, 0.35, 2.55, 'lin'); at('B', 8.62, 0.45, 2.55, 'o');
  at('A', 8.3, 1.75, 2.5); at('A', 8.5, 1.8, 2.5); at('A', 9.0, 3.0, 2.4, 'o');
  K('B', 7.6, L.crouch, 'io', SWm); K('B', 7.95, L.crouch, 'o', { y: -0.4 }); K('B', 8.08, L.takeoff, 'o', { y: 0.9 });
  K('B', 8.3, L.spin, 'lin', { y: 1.6, yawOff: -180 }); K('B', 8.5, L.slashO, 'lin', { y: 0.6, yawOff: -360 }); D.B = { yawOff: -360 };
  K('B', 8.62, L.land, 'o'); K('B', 8.85, G, 'io');
  K('A', 8.2, G); blk('A', 8.35, 8.5, 'parryH', {}, { y: -0.3 }); clash(8.5, true);   // the jump attack plunges from above: the one high block of this part
  K('A', 8.6, G, 'io'); K('A', 8.74, L.skid, 'io'); K('A', 8.95, L.skid, 'lin'); K('A', 9.08, G, 'io'); slide('A', W8(8.6), W8(9.0));   // through the guard: high block -> skid pose directly is a near-opposite blade flip
  at('B', 9.4, 0.9, 2.45, 'io'); at('A', 9.4, 3.0, 2.38, 'io'); hit('B', 'A', 9.4);
  // ================= S5 9.6-12.0  B thrusts, A deflects and sidesteps, B overruns; A cuts, B is driven back, A follows and cuts again (big) =
  const yB5 = 90;   // B thrusts straight along +x at where A WAS: A is already stepping off the line (the thrust ran 2 px through A's torso and was pushed out, 174 deg in a frame)
  K('B', 9.6, L.windT, 'io', { yawAbs: yB5 }); K('B', 9.85, L.thrust, 'lin', { yawAbs: yB5 }); K('B', 10.05, L.thrust, 'lin', { yawAbs: yB5, chest: [16, 6, 0] });
  at('B', 9.6, 0.9, 2.45); at('B', 9.85, 2.0, 2.36, 'o'); at('B', 10.07, 2.7, 2.25, 'o');
  K('A', 9.66, G, 'io'); blk('A', 9.75, 9.85, 'parryR', { waist: [10, 0, -20] }, { waist: [10, 0, -20] }); clash(9.85); K('A', 10.0, L.dodge, 'o');
  at('A', 9.58, 3.0, 2.38); at('A', 9.82, 3.12, 3.2, 'io'); at('A', 10.2, 3.3, 4.1, 'o');
  const yB5b = face('B', 10.4, yB5);
  K('A', 10.12, midWind, 'io'); K('A', 10.4, midCut, 'lin'); K('B', 10.32, loParry, 'io', { yawAbs: yB5b }); K('B', 10.4, loParry, 'lin', { yawAbs: yB5b }); clash(10.4); far();
  at('A', 10.4, 3.3, 4.1); at('B', 10.4, 2.7, 2.25);
  knockTo('B', 10.4, 2.3, 0.92, 0.5);                                           // driven back 1.4 blocks...
  K('A', 10.6, G, 'io'); at('A', 10.55, 3.3, 4.1); at('A', 11.2, 3.0, 2.95, 'io');   // ...and A walks him down (was: A stood with the sword raised for 0.6 s)
  at('A', 11.5, 3.0, 2.95); at('B', 11.5, 2.3, 0.92); hit('A', 'B', 11.5, true);
  knockTo('B', 11.5, 1.95, -0.35, 0.5);
  K('A', 11.72, G, 'io');
  // ================= S6 12.1-15.2  A drives B back down a straight line: two cuts, B's riposte, A's next cut is ducked, B's big counter throws A back ====
  // part 3 (user, 2026-11-13: "apply fixes for part 3 as well"). Was: six strikes 0.28 s apart from 1.28 blocks, all above the heads,
  // filmed over A's shoulder. Now the part-1/2 rules: hits 0.55 s apart, 2.1 blocks, chest level, the line travels 1.3 blocks, the
  // knock-back is a 2.4-block slide that the next attack runs straight into.
  at('A', 12.2, 3.0, 2.95); at('B', 12.3, 1.95, -0.35);
  const S6 = [[12.65, 2.70, 2.0, 2.07, 0.0], [13.2, 2.47, 1.29, 1.85, -0.71], [13.75, 2.32, 0.82, 1.70, -1.18]];
  for (const [t, ax, az, bx, bz] of S6) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); }
  hit('A', 'B', 12.65); hit('A', 'B', 13.2, false, { rec: true }); hit('B', 'A', 13.75);
  K('A', 13.98, midWind, 'io'); K('A', 14.08, midSweep, 'lin'); K('A', 14.18, midCut, 'lin');   // A's cut finds air: he steps in, B drops under it
  at('A', 14.18, 2.23, 0.54, 'io'); at('B', 14.18, 1.70, -1.18);
  K('B', 13.97, L.duck, 'io'); K('B', 14.16, L.duck, 'lin');
  at('A', 14.6, 2.32, 0.82, 'io'); at('B', 14.6, 1.70, -1.18); hit('B', 'A', 14.6, true);       // B comes up out of the duck with the big one (impact insert)
  knockTo('A', 14.6, 3.05, 3.15, 0.6);
  K('B', 14.86, G, 'io');
  // ================= S7 15.2-17.1  B sprints in with a thrust, A deflects it and dashes off the line; A leaps onto the overrun B (the high block of this part) ===
  // Was: 0.9 s of stalking and a twirl first (twirls: opening only), and the leap filmed from behind B.
  const y7 = 17;                                                                // B's thrust line: at where A stood
  RUN.B.push([15.22, 15.6]); at('B', 15.2, 1.70, -1.18); at('B', 15.6, 2.4, 1.05, 'lin'); at('B', 15.8, 2.75, 2.2, 'o'); at('B', 16.05, 2.9, 3.2, 'o'); at('B', 16.22, 2.9, 3.6, 'o');
  K('B', 15.18, L.crouch, 'io', SWm); K('B', 15.4, L.guard, 'lin', SWm); K('B', 15.56, L.windT, 'io', { yawAbs: y7 }); K('B', 15.8, L.thrust, 'lin', { yawAbs: y7 }); K('B', 16.0, L.thrust, 'lin', { yawAbs: y7, chest: [16, 6, 0] });
  K('B', 16.14, L.skid, 'io', { yawAbs: y7 }); slide('B', W8(15.95), W8(16.22));
  at('A', 15.52, 3.05, 3.15); at('A', 15.8, 3.9, 2.9, 'io'); at('A', 16.12, 4.7, 1.9, 'o');
  K('A', 15.6, G, 'io'); blk('A', 15.7, 15.8, 'parryR', { waist: [10, 0, -20] }, { waist: [10, 0, -20] }); clash(15.8); K('A', 15.95, L.dodge, 'o');
  K('A', 16.2, L.crouch, 'o', { y: -0.35 }); K('A', 16.3, L.takeoff, 'o', { y: 0.7 }); K('A', 16.44, L.windO, 'o', { y: 1.2 }); K('A', 16.6, L.slashO, 'lin', { y: 0.4 });
  at('A', 16.2, 4.7, 1.9); at('A', 16.6, 3.95, 2.6, 'o');
  const y7b = face('B', 16.6, y7);
  blk('B', 16.44, 16.6, 'parryH', { yawAbs: y7b }, { yawAbs: y7b, y: -0.3 }); clash(16.6, true);
  K('A', 16.72, L.land, 'o'); K('A', 16.9, G, 'io'); at('A', 16.9, 3.95, 2.6);
  knockTo('B', 16.6, 1.81, 4.63, 0.5, false);                                   // driven 1.5 blocks back, and straight into S8
  // ================= S8 (v8 time 17.9-20.5 = 20.0-22.6 s)  B comes straight back with a cut, A answers, B shoulder-charges him 2.4 blocks back ===
  // Was: a third thrust-and-dodge, two cuts 0.25 s apart from 0.9 blocks (the "hugging" lean), a twirl and 0.7 s of standing.
  at('A', 18.45, 3.59, 2.94, 'io'); at('B', 18.45, 2.06, 4.39, 'io'); hit('B', 'A', 18.45);
  at('A', 19.0, 3.11, 2.43, 'io'); at('B', 19.0, 1.58, 3.88, 'io'); hit('A', 'B', 19.0);
  RUN.B.push([19.14, 19.38, 'charge']); at('B', 19.12, 1.58, 3.88); at('B', 19.4, 2.54, 2.97, 'lin');   /* stops 0.78 blocks short: at 0.5 the two bodies overlapped (the 'hugging' look) */
  K('B', 19.16, L.crouch, 'io', { y: -0.2 }); K('B', 19.4, L.charge, 'lin');
  K('A', 19.34, midWind, 'io');                                                  // A is winding the next cut when the shoulder arrives
  clash(19.4, false, 'kick', { at: () => { const q = pose('A', 19.42).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  at('A', 19.4, 3.11, 2.43); knockTo('A', 19.4, 4.85, 0.78, 0.6);
  K('B', 19.62, G, 'io'); at('B', 19.5, 2.54, 2.97); at('B', 20.4, 3.3, 2.2, 'io');
  // ================= S9 20.5-24.6  both spin-cut into a blade lock that drifts, shove, B's three, A's riposte =======
  at('A', 20.5, 4.85, 0.78); K('A', 20.5, G); K('B', 20.5, G); K('A', 22.25, G); K('B', 22.25, G);   // (blade lock removed) they step round to the next exchange
  const S9 = [[22.45, 'B', 'R', 3.05, 0.0, 2.95, 1.2], [22.7, 'B', 'L', 3.05, -0.3, 2.95, 0.9], [22.95, 'B', 'O', 3.0, -0.6, 2.9, 0.6],
              [23.25, 'A', 'T', 3.0, -0.55, 2.95, 0.68], [23.55, 'B', 'O', 3.0, -0.7, 2.95, 0.52], [23.85, 'A', 'L', 3.05, -0.55, 3.0, 0.68]];   // 23.85 is made big below: both blown apart
  for (const [t, att, s, ax, az, bx, bz] of S9) { at('A', t, ax, az, 'io'); at('B', t, bx, bz, 'io'); ex(att, att === 'A' ? 'B' : 'A', t, s, t === 23.85, 0.15); }
  at('A', 24.5, 3.3, -3.6, 'o'); at('B', 24.5, 2.75, 3.9, 'o');
  K('A', 24.08, L.skid, 'o'); K('A', 24.45, L.skid, 'lin'); K('A', 24.6, G, 'io'); K('B', 24.08, L.skid, 'o'); K('B', 24.45, L.skid, 'lin'); K('B', 24.6, G, 'io');
  // ================= S10 24.6-30  mirrored twirl standoff, sprint, A slides under B's cut and rips upward; B falls ===
  K('A', 24.72, L.twirlS, 'io'); K('A', 25.28, L.twirlS, 'lin'); tw('A', 24.75, 25.28, 2);
  K('B', 24.78, L.twirlF, 'io'); K('B', 25.3, L.twirlF, 'lin'); tw('B', 24.8, 25.3, 2);
  { const pa = evalPosT('A', 24.62), pb = evalPosT('B', 24.62), dx = pb[0] - pa[0], dz = pb[1] - pa[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    const m = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], P_ = (s) => [m[0] + ux * s, m[1] + uz * s];
    at('A', 25.4, pa[0], pa[1]); at('B', 25.45, pb[0], pb[1]);
    RUN.A.push([25.45, 25.92]); RUN.B.push([25.5, 25.9]);
    at('A', 25.95, ...P_(-1.25), 'lin'); at('A', 26.1, ...P_(-0.5), 'lin'); at('A', 26.4, ...P_(-0.15), 'o');
    at('B', 25.92, ...P_(0.9), 'lin'); at('B', 26.08, ...P_(0.7), 'o');
    at('B', FLASH, ...P_(0.95)); at('B', 27.14, ...P_(0.95)); at('B', 27.5, ...P_(1.4), 'o'); at('B', TEND, ...P_(1.4));
    at('A', 27.12, ...P_(-0.15)); at('A', 27.42, ...P_(-0.62), 'o'); at('A', TEND, ...P_(-0.62));
    export_cross.mid = m; export_cross.u = [ux, uz]; export_cross.p = [-uz, ux]; }
  K('A', 25.4, G); K('A', 25.48, L.crouch, 'io', SW); K('A', 25.8, L.guard, 'lin', SW); K('A', 25.95, L.duck, 'o'); K('A', 26.12, L.duck, 'lin');
  K('A', 26.2, L.windT, 'o'); K('A', FLASH, L.thrust, 'i', { pierce: 1 }); K('A', 27.12, L.thrust, 'lin', { pierce: 1, chest: [14, 4, 0] }); K('A', 27.36, L.windT, 'o'); K('A', 27.75, G, 'io');   // through the chest, held, then pulled out
  K('B', 25.45, G); K('B', 25.52, L.crouch, 'io', SW); K('B', 25.78, L.guard, 'lin', SW); K('B', 25.92, L.windL, 'o'); K('B', 26.08, L.slashL, 'i');
  clash(FLASH, true, 'kick', { at: () => { const q = pose('B', FLASH + 0.02).pos; return [q[0], q[1] + 1.25, q[2]]; } });
  K('B', FLASH + 0.06, L.hitBack, 'o', { y: 0.04 }); K('B', 27.12, L.hitBack, 'lin', { y: 0.0, head: [14, 0, 0] }); K('B', 27.45, L.skid, 'o'); K('B', 27.95, L.knees, 'io');
  K('B', 28.6, L.fallen, 'o'); K('B', TEND, L.fallen);
  BR.A.push([27.8, TEND]);
  K('A', 28.3, L.flick, 'o'); K('A', 28.85, L.relaxed, 'io'); K('A', TEND, L.relaxed, 'io');   // flicks the blade clean, lowers it
  })((c, t, p, e, d) => k(c, W8(t), t > 2.4 && noTw(p) ? G : p, e, d), (c, t, x, z, e) => at(c, W8(t), x, z, e), (t, big, kind, extra) => clash(W8(t), big, kind, extra),
     wrap(RUN), wrap(BR), { push: r => PARRY.push({ ...r, t: W8(r.t) }) }, (c, t) => evalPosT(c, W8(t)), (c, t, ref) => face(c, W8(t), ref), (c, t) => pose(c, W8(t)), 26.38,
     (c, t0, t1, turns) => { if (t0 < 2.4) TWIRL[c].push([W8(t0), W8(t1), turns]); }, (c, t0, t1, from, to) => { RUN[c].push([W8(t0), W8(t1)]); at(c, W8(t0), from[0], from[1]); at(c, W8(t1), to[0], to[1], 'lin'); });
  // ================= N1 25.4-28.95 (new): run in, cut and riposte, the thrust at the face in SLOW MOTION, kick into a slide =================
  { const a = evalPosT('A', 25.38), b = evalPosT('B', 25.38), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const tA = wsprint('A', 25.42, a, [m[0] - ux * 0.78, m[1] - uz * 0.78]), tB = wsprint('B', 25.42, b, [m[0] + ux * 0.78, m[1] + uz * 0.78]);
    for (const [c, t1] of [['A', tA], ['B', tB]]) { K(c, 25.44, L.sprintGo, 'io', SW); K(c, t1 - 0.08, L.sprintGo, 'lin', SW); K(c, t1 + 0.06, G, 'io'); at(c, t1 + 0.04, ...evalPosT(c, t1)); }
    const t0 = Math.max(tA, tB);
    whit('B', 'A', t0 + 0.34, 'windR', 'slashR', 'parryL', { knock: false, rest: 'guard' });
    whit('A', 'B', t0 + 0.78, 'windO', 'slashO', 'parryH', { rest: 'guard', defRest: 'guard' });
    // the close call: B lunges at the face; A leans out of the line (slow motion 27.0-27.45), then kicks him away
    mv8('B', 'A', 26.72, 26.98, 1.7); K('B', 26.8, L.windT, 'o'); K('B', 27.3, L.thrust, 'i', { head: [-8, 4, 0] }); K('B', 27.48, L.thrust, 'lin'); K('B', 27.66, G, 'io');
    K('A', 27.0, G, 'io'); K('A', 27.24, L.dodge, 'o'); K('A', 27.46, L.dodge, 'lin'); lat8('A', 'B', 27.08, 27.34, 0.62);
    K('A', 27.5, L.kickW, 'o'); K('A', 27.68, L.kick, 'i'); K('A', 27.92, G, 'io'); clash(27.68, false, 'kick', { at: () => { const q = pose('B', 27.7).pos; return [q[0], q[1] + 1.2, q[2]]; } });
    K('B', 27.72, L.hitBack, 'o', { y: 0.08 }); K('B', 27.86, L.skid, 'o'); K('B', 28.3, L.skid, 'lin'); K('B', 28.5, G, 'io');
    at('A', 27.68, ...evalPosT('A', 27.68)); at('A', 28.9, ...evalPosT('A', 27.68)); { const q = evalPosT('B', 27.68), p = evalPosT('A', 27.68), ex_ = q[0] - p[0], ez = q[1] - p[1], e = Math.hypot(ex_, ez) || 1;
      at('B', 27.68, ...q); at('B', 28.34, q[0] + ex_ / e * 2.3, q[1] + ez / e * 2.3, 'o'); at('B', 28.9, q[0] + ex_ / e * 2.3, q[1] + ez / e * 2.3); slide('B', 27.82, 28.34); }
    K('A', 28.9, G); K('B', 28.9, G); }
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
// movement helpers for N1 (positions from the keys laid down so far)
const mv8 = (c, o, t0, t1, gap, e = 'io') => { const a = evalPosT(c, t0), b = evalPosT(o, t1), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, b[0] + dx / d * gap, b[1] + dz / d * gap, e); };
const lat8 = (c, o, t0, t1, side, e = 'o') => { const a = evalPosT(c, t0), b = evalPosT(o, t0), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, a[0] - dz / d * side, a[1] + dx / d * side, e); };

// ---- fight_w build helpers (shared by build_spear/hammer/bow)
const D = { A: {}, B: {} };                                         // persistent per-fighter overrides (spin offsets)
const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
const tw = (c, t0, t1, turns) => TWIRL[c].push([t0, t1, turns]);
const slide = (c, t0, t1) => SLIDES[c].push([t0, t1]);
const sprint = (c, t0, t1, from, to) => { RUN[c].push([t0, t1]); at(c, t0, from[0], from[1]); at(c, t1, to[0], to[1], 'lin'); };
const CANDS = { A: ['parryL', 'parryR', 'parryH', 'parryLowR', 'parryLowL'], B: ['parryL', 'parryR', 'parryH'] };   // defence poses fight.js may pick from
// a defence held from t0 to t1; fight.js re-chooses the pose from CANDS[def] by the real weapon geometry
const blk = (def, t0, t1, name, d1 = {}, d2 = {}, e0 = 'o') => { const b0 = { ...D[def] }; K(def, t0, L[name], e0, d1); K(def, t1, L[name], 'lin', d2);
  const k2 = T[def][T[def].length - 1], k1 = T[def][T[def].length - 2]; PARRY.push({ t: t1, def, cands: CANDS[def], apply: n => { k1[1] = S(L[n], { ...b0, ...d1 }); k2[1] = S(L[n], { ...b0, ...d2 }); } }); };
// an attack (wind-up key, strike key) that the defender blocks: names are pose names
const hit = (att, def, t, wind, strike, defName, big = false, wt = 0.16, dA = {}, dD = {}) => { K(att, t - wt, L[wind], 'o', dA); K(att, t, L[strike], 'i', dA); blk(def, t - wt + 0.02, t, defName, {}, dD); clash(t, big); };
const arrow = (tn, t0, t1, mode, extra = {}) => ARROWS.push({ tn, t0, t1, mode, ...extra });
function near(a, ref) { while (a - ref > 180) a -= 360; while (a - ref < -180) a += 360; return a; }
function evalPosT(c, t) { const K_ = P[c].slice().sort((a, b) => a[0] - b[0]); return evalPos(K_, t); }
function face(c, t, ref = 0) { const o = c === 'A' ? 'B' : 'A', a = evalPosT(c, t), b = evalPosT(o, t); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); }
let BIND_C = [0, 0], SH = null;
// ---- WEAPON WEIGHT (user, 2026-11-12: weapons are light / medium / heavy by size against the player model, and the class changes how
// the wielder moves). WEAPON_DATA is injected by assemble_w.py from fight_w/weapon_data.json (generated by gripref/render.mjs from
// gripref/weapons.json). A build calls weapons('<A file>', '<B file>') first, then uses the w-helpers; they take every timing from the
// class: wind-up, recovery, run speed, combo length, knockback, twirls. The old helpers (hit, sprint, tw) still work unchanged.
// Check a finished build with tools/weight_qa.js.
const WGT = { A: null, B: null }, WLOG = [];
const weapons = (a, b) => { [['A', a], ['B', b]].forEach(([c, n]) => { const w = WEAPON_DATA.weapons[n]; if (!w) throw new Error('weapons(): no weight data for "' + n + '" (run node gripref/render.mjs)');
  WGT[c] = { ...WEAPON_DATA.classes[w.class], ...w, file: n }; }); globalThis.__weight = { names: [a, b], WGT, WLOG }; };
const wwarn = m => { WLOG.push(m); console.warn('WEIGHT: ' + m); };
// run from -> to at the class's speed (runBase x move); returns the arrival time. mode 'charge' keeps the pose's arms.
const wsprint = (c, t0, from, to, mode) => { const t1 = t0 + Math.hypot(to[0] - from[0], to[1] - from[1]) / (WEAPON_DATA.runBase * WGT[c].move);
  RUN[c].push(mode ? [t0, t1, mode] : [t0, t1]); at(c, t0, from[0], from[1]); at(c, t1, to[0], to[1], 'lin'); return t1; };
// pushed back by a hit: stagger, standing slide, recover into `end`. far = blocks; the defender's own weapon braces him (class.brace).
const wknock = (c, o, t, far, end) => { far *= WGT[c] ? WGT[c].brace : 1; const dur = 0.3 + 0.13 * far;
  K(c, t + 0.05, L.hitBack, 'o'); K(c, t + 0.17, L.skid, 'o'); K(c, t + dur, L.skid, 'lin'); K(c, t + dur + 0.17, end || G, 'io');
  const a = evalPosT(c, t), b = evalPosT(o, t), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1;
  at(o, t, ...b); at(c, t, ...a); at(c, t + dur + 0.03, a[0] + dx / d * far, a[1] + dz / d * far, 'o'); slide(c, t + 0.13, t + dur + 0.03); return t + dur + 0.17; };
// an attack the defender blocks, timed by the ATTACKER's weapon: wind-up key at t - windup, hit at t, the strike pose carries through the
// follow-through, back in `rest` at t + recover. A medium or heavy hit knocks the defender back (o.knock = false to keep him in place).
// o: { rest, defRest, big, knock, knockK, windup, dA, dD }. Returns the time the attacker is free again.
const whit = (att, def, t, wind, strike, defName, o = {}) => { const w = WGT[att], wu = o.windup ?? w.windup;
  const mine = WLOG.hits = (WLOG.hits || []); mine.push([att, t]); let n = 1; for (let i = mine.length - 2; i >= 0 && mine[i][0] === att && mine[i + 1][1] - mine[i][1] < 0.9; i--) n++;
  if (n > w.combo) wwarn(att + ' (' + w.name + ', ' + w.class + ') strikes ' + n + ' times in a row at ' + t.toFixed(2) + ' s; the class allows ' + w.combo);
  K(att, t - wu, L[wind], 'o', o.dA); K(att, t, L[strike], 'i', o.dA); K(att, t + w.recover * 0.4, L[strike], 'lin', o.dA);
  if (o.rest) K(att, t + w.recover, L[o.rest], 'io');
  blk(def, t - Math.min(wu, 0.18) + 0.02, t, defName, {}, o.dD); clash(t, o.big ?? w.class === 'heavy');
  if (o.knock !== false && w.knockback >= 0.5) wknock(def, att, t, w.knockback * (o.knockK ?? 1), o.defRest && L[o.defRest]);
  return t + w.recover; };
// show-off twirl: refused for a heavy weapon
const wtw = (c, t0, t1, turns) => { if (!WGT[c].twirl) { wwarn(c + ' (' + WGT[c].name + ') cannot twirl a heavy weapon (' + t0 + ' s) - skipped'); return false; } tw(c, t0, t1, turns); return true; };

const WEAPON_DATA = {
 "_help": "GENERATED by node gripref/render.mjs from gripref/weapons.json - do not edit by hand",
 "runBase": 9,
 "classes": {
  "light": {
   "windup": 0.16,
   "strikeFrames": 3,
   "recover": 0.2,
   "move": 1,
   "combo": 5,
   "knockback": 0.3,
   "brace": 1,
   "bladeDegPerFrame": 100,
   "hands": "one",
   "drivenBy": "wrist and elbow, torso stays upright",
   "twirl": true,
   "carry": "held up in guard, tip high"
  },
  "medium": {
   "windup": 0.26,
   "strikeFrames": 4,
   "recover": 0.3,
   "move": 0.9,
   "combo": 3,
   "knockback": 0.6,
   "brace": 0.85,
   "bladeDegPerFrame": 85,
   "hands": "one, two for power hits",
   "drivenBy": "shoulder and torso turn, short step in",
   "twirl": true,
   "carry": "held at chest height, tip forward"
  },
  "heavy": {
   "windup": 0.42,
   "strikeFrames": 5,
   "recover": 0.48,
   "move": 0.75,
   "combo": 2,
   "knockback": 1.2,
   "brace": 0.7,
   "bladeDegPerFrame": 70,
   "hands": "two",
   "drivenBy": "hips and legs, pelvis drops, the follow-through pulls the player 0.25 block",
   "twirl": false,
   "carry": "resting on the shoulder or head down near the ground, drags behind in a run"
  }
 },
 "weapons": {
  "aegisblade": {
   "name": "Aegisblade",
   "class": "medium",
   "heft": 12.4,
   "pctOfBody": 9,
   "balanceBlocks": 0.38,
   "lengthBlocks": 1.676,
   "mode": "1h",
   "len": 33.8,
   "grip": 0.22,
   "lh": null
  },
  "veilblade": {
   "name": "Veilblade",
   "class": "medium",
   "heft": 11.6,
   "pctOfBody": 8.5,
   "balanceBlocks": 0.37,
   "lengthBlocks": 1.676,
   "mode": "1h",
   "len": 33.8,
   "grip": 0.17,
   "lh": null
  },
  "ocean sword": {
   "name": "Ocean Sword",
   "class": "light",
   "heft": 2.6,
   "pctOfBody": 1.9,
   "balanceBlocks": 0.36,
   "lengthBlocks": 1.289,
   "mode": "1h",
   "len": 26,
   "grip": 0.1,
   "lh": null
  },
  "blinkblade": {
   "name": "Blinkblade",
   "class": "medium",
   "heft": 10.4,
   "pctOfBody": 7.2,
   "balanceBlocks": 0.44,
   "lengthBlocks": 1.676,
   "mode": "1h",
   "len": 33.8,
   "grip": 0.15,
   "lh": null
  },
  "jade edge": {
   "name": "Jade Edge",
   "class": "medium",
   "heft": 6.7,
   "pctOfBody": 5.1,
   "balanceBlocks": 0.32,
   "lengthBlocks": 1.289,
   "mode": "1h",
   "len": 26,
   "grip": 0.21,
   "lh": null
  },
  "skystrider": {
   "name": "Skystrider",
   "class": "light",
   "heft": 4.8,
   "pctOfBody": 3.9,
   "balanceBlocks": 0.22,
   "lengthBlocks": 1.289,
   "mode": "1h",
   "len": 26,
   "grip": 0.2,
   "lh": null
  },
  "bloodchain": {
   "name": "Bloodchain",
   "class": "medium",
   "heft": 7.3,
   "pctOfBody": 5.4,
   "balanceBlocks": 0.36,
   "lengthBlocks": 1.488,
   "mode": "1h",
   "len": 30,
   "grip": 0.19,
   "lh": null
  },
  "goldreaper": {
   "name": "Goldreaper",
   "class": "heavy",
   "heft": 20,
   "pctOfBody": 15.6,
   "balanceBlocks": 0.28,
   "lengthBlocks": 1.785,
   "mode": "2h",
   "len": 36,
   "grip": 0.23,
   "lh": -4.9
  },
  "creaking scythe": {
   "name": "Creaking Scythe",
   "class": "heavy",
   "heft": 17.9,
   "pctOfBody": 11.3,
   "balanceBlocks": 0.58,
   "lengthBlocks": 1.885,
   "mode": "2h",
   "len": 38,
   "grip": 0.42,
   "lh": -9
  },
  "boltspear": {
   "name": "Boltspear",
   "class": "medium",
   "heft": 6.3,
   "pctOfBody": 5.3,
   "balanceBlocks": 0.19,
   "lengthBlocks": 1.984,
   "mode": "2h",
   "len": 40,
   "grip": 0.45,
   "lh": -5.6
  },
  "lancebolt": {
   "name": "Lancebolt",
   "class": "medium",
   "heft": 9.7,
   "pctOfBody": 8.9,
   "balanceBlocks": 0.09,
   "lengthBlocks": 1.984,
   "mode": "2h",
   "len": 40,
   "grip": 0.45,
   "lh": -9
  },
  "tidepiercer": {
   "name": "Tidepiercer",
   "class": "medium",
   "heft": 8.8,
   "pctOfBody": 7.6,
   "balanceBlocks": 0.16,
   "lengthBlocks": 1.984,
   "mode": "2h",
   "len": 40,
   "grip": 0.46,
   "lh": -5
  },
  "jingu bang": {
   "name": "Jingu Bang",
   "class": "medium",
   "heft": 19.7,
   "pctOfBody": 17,
   "balanceBlocks": -0.16,
   "lengthBlocks": 1.984,
   "mode": "2h",
   "len": 40,
   "grip": 0.58,
   "lh": -7.5
  },
  "golem_hammer": {
   "name": "Golem Hammer",
   "class": "heavy",
   "heft": 44.4,
   "pctOfBody": 35.2,
   "balanceBlocks": 0.26,
   "lengthBlocks": 1.18,
   "mode": "2h",
   "len": 23.8,
   "grip": 0.42,
   "lh": -4.9
  },
  "thundermaul": {
   "name": "Thundermaul",
   "class": "heavy",
   "heft": 42.1,
   "pctOfBody": 30.1,
   "balanceBlocks": 0.4,
   "lengthBlocks": 1.676,
   "mode": "2h",
   "len": 33.8,
   "grip": 0.48,
   "lh": -6.5
  },
  "magma club": {
   "name": "Magma Club",
   "class": "medium",
   "heft": 11.8,
   "pctOfBody": 7.5,
   "balanceBlocks": 0.57,
   "lengthBlocks": 1.389,
   "mode": "1h",
   "len": 28,
   "grip": 0.19,
   "lh": null
  },
  "rendpick": {
   "name": "Rendpick",
   "class": "heavy",
   "heft": 19.2,
   "pctOfBody": 13,
   "balanceBlocks": 0.48,
   "lengthBlocks": 1.587,
   "mode": "1h",
   "len": 32,
   "grip": 0.4,
   "lh": null
  },
  "froststaff": {
   "name": "Froststaff",
   "class": "heavy",
   "heft": 18.6,
   "pctOfBody": 13.6,
   "balanceBlocks": 0.37,
   "lengthBlocks": 1.686,
   "mode": "1h",
   "len": 34,
   "grip": 0.4,
   "lh": null
  },
  "voidbow": {
   "name": "Voidbow",
   "class": "medium",
   "heft": 10.6,
   "pctOfBody": 10.5,
   "balanceBlocks": 0.01,
   "lengthBlocks": 1.676,
   "mode": "bow",
   "len": 33.8,
   "grip": 0.5,
   "lh": null
  },
  "seekerbow": {
   "name": "Seekerbow",
   "class": "light",
   "heft": 5.8,
   "pctOfBody": 5.8,
   "balanceBlocks": 0,
   "lengthBlocks": 1.676,
   "mode": "bow",
   "len": 33.8,
   "grip": 0.5,
   "lh": null
  }
 }
};

export const export_cross = {};
export function events() { return { steps: STEPS.map(s => [+s.t.toFixed(3), s.kind, +(s.sp || 0).toFixed(2), s.c, s.foot, s.run ? 1 : 0]), slides: SLIDES, ghits: GHITS.map(g => +g.t.toFixed(3)), clashes: CONT.map(c => [c.t, c.big, c.kind]), swings: SWINGS(), twirls: TWIRLS(), ins: INS.slice(), flash: FLASH, arrows: ARROWS.map(a => [a.tn, a.t0, a.t1, a.mode]), slowmo: SLOWMO, video_total: videoAt(TOTAL), vid: 'v8x' }; }
function TWIRLS() { const out = []; for (const c of ['A', 'B']) for (const [t0, t1, n] of TWIRL[c]) { let k = 1;
  for (let t = t0; t <= t1 && k <= 2 * n; t += 1 / 480) if (n * 2 * E.io(clamp((t - t0) / (t1 - t0))) >= k - 0.5) { out.push([+t.toFixed(3), c]); k++; } }
  return out.sort((a, b) => a[0] - b[0]); }

// clash corrections (IK-lite): solved in fight.js so the two blades physically cross at each clash time
export const CORR = { A: [], B: [] };
function corrW(d) { if (d < -0.16 || d > 0.22) return 0; return d < 0 ? E.io((d + 0.16) / 0.16) : 1 - E.io(d / 0.22); }
export const SLOWMO = [];   // [ta0, ta1, rate] (animation seconds), e.g. [26.1, 26.9, 0.3]
export function animAt(v) { let ta = 0, tv = 0; const segs = SLOWMO.slice().sort((a, b) => a[0] - b[0]);
  for (const [a0, a1, r] of segs) { if (v <= tv + (a0 - ta)) return ta + (v - tv); tv += a0 - ta; ta = a0;
    const dv = (a1 - a0) / r; if (v <= tv + dv) return a0 + (v - tv) * r; tv += dv; ta = a1; } return ta + (v - tv); }
export function videoAt(t) { let ta = 0, tv = 0; for (const [a0, a1, r] of SLOWMO.slice().sort((a, b) => a[0] - b[0])) { if (t <= a0) break; tv += a0 - ta; ta = a0; if (t <= a1) return tv + (t - a0) / r; tv += (a1 - a0) / r; ta = a1; } return tv + (t - ta); }
export function rateAt(t) { for (const [a0, a1, r] of SLOWMO) if (t >= a0 && t <= a1) return r; return 1; }
export const DRIFT = []; let DTAB = null;
function driftTab() {
  const N = Math.ceil(TOTAL * 240) + 2, tab = new Float32Array(N * 2); let x = 0, z = 0;
  for (let i = 0; i < N; i++) { const t = i / 240;
    for (const [t0, t1, mode, spd] of DRIFT) { if (t < t0 || t > t1) continue;
      const w = Math.min(1, (t - t0) / 0.2, (t1 - t) / 0.2), a = evalPos(P.A, t0), b = evalPos(P.B, t0), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1;
      const ux = dx / d, uz = dz / d, v = mode === 'strafeL' ? [-uz, ux] : mode === 'strafeR' ? [uz, -ux] : mode === 'pushA' ? [ux, uz] : [-ux, -uz];
      x += v[0] * spd * w / 240; z += v[1] * spd * w / 240; }
    tab[i * 2] = x; tab[i * 2 + 1] = z; }
  return tab; }
function driftAt(t) { if (!DRIFT.length) return [0, 0]; if (!DTAB) DTAB = driftTab(); const i = Math.max(0, Math.min(DTAB.length / 2 - 1, Math.round(t * 240))); return [DTAB[i * 2], DTAB[i * 2 + 1]]; }
function oppArmPts(ob, ro, lean) {   // opponent arms (shoulder, elbow, hand) from his FK angles + torso turn - weapon collision keeps blades off them
  const ty = (ob.yaw + (ob.waist[1] || 0) + (ob.chest[1] || 0)) * Math.PI / 180, cy = Math.cos(ty), sy = Math.sin(ty), g = W.floorAt(ro[0], ro[1]), out = [];
  const toW = (x, y, z) => [ro[0] + x * cy + z * sy + lean[0] * 0.8, g + y + lean[3], ro[1] - x * sy + z * cy + lean[2] * 0.8];
  for (const sd of ['r', 'l']) { const sx = (sd === 'r' ? -6 : 6) / 16, q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(...ob[sd + 'Arm'].map(v => v * Math.PI / 180), 'XYZ'));
    const q2 = q1.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...ob[sd + 'Elbow'].map(v => v * Math.PI / 180), 'XYZ')));
    const d1 = new THREE.Vector3(0, -1, 0).applyQuaternion(q1), d2 = new THREE.Vector3(0, -1, 0).applyQuaternion(q2);
    const sh = [sx, 22 / 16, 0], el = [sh[0] + d1.x * 4 / 16, sh[1] + d1.y * 4 / 16, sh[2] + d1.z * 4 / 16], hd = [el[0] + d2.x * 5.5 / 16, el[1] + d2.y * 5.5 / 16, el[2] + d2.z * 5.5 / 16];
    out.push([toW(...sh), toW(...el), toW(...hd)]); }
  return out; }
function rootXZ(c, t) { const p = evalPos(P[c], t), d = driftAt(t); return [p[0] + d[0], p[1] + d[1]]; }
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
  for (const [t0, t1] of WALK[c]) if (t >= t0 && t <= t1) {   // walk: upright, free arm swings, weapon arm keeps its carry pose
    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]), sw = Math.sin(2 * Math.PI * d / 0.95), bl = clamp(Math.min((t - t0) / 0.25, (t1 - t) / 0.25));
    p.waist = p.waist.map((v, i) => lerp(v, [4, -5 * sw, 0][i], bl)); p.chest[1] += 4 * sw * bl; p.head[1] -= 2 * sw * bl;
    p.lArm = p.lArm.map((v, i) => lerp(v, [-22 * sw, 0, 8][i], bl)); p.lElbow = p.lElbow.map((v, i) => lerp(v, [-14 - 8 * Math.max(0, sw), 0, 0][i], bl)); p.y = lerp(p.y, 0, bl); p.wide = lerp(p.wide ?? 1, 0, bl);
    for (const j of ['rLeg', 'lLeg', 'rKnee', 'lKnee']) p[j] = p[j].map(v => v * (1 - bl)); }   // upright walk: legs straight, gait drives the feet
  for (const [t0, t1, mode] of RUN[c]) if (t >= t0 && t <= t1) {
    const a = rootXZ(c, t0), d = Math.hypot(x - a[0], z - a[1]); const phi = d / STRIDE;
    const blend = clamp(Math.min((t - t0) / 0.18, (t1 - t) / 0.16));   // standard: idle -> run eases in (was a 0.08 s snap)
    const sw = clamp((t1 - 0.12 - t) / 0.2), rb = runBody(phi, cp(p)), r = mode === 'charge' ? rb : mix(runArms(phi, cp(rb), false), runArms(phi, cp(rb), true), sw);
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
export const SLIDES = { A: [], B: [] };
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
const STEP2 = !QS_.has('oldstep'), HOLD = { hold: true };
function runGait(c, root, rawXZ, N, rawP) {
  // returns per-index overrides { r:[x,y,z]|undefined, l:..., yoff } inside run windows, plus contact events
  const g = { r: new Array(N), l: new Array(N), yoff: new Float32Array(N), ev: [] };
  for (const [t0, t1, kind, strd] of [...RUN[c].map(w => [w[0], w[1], 'run']), ...WALK[c].map(w => [w[0], w[1], 'walk']), ...DRIFT.filter(w => !w[5] || w[5] === c).map(w => [w[0], w[1], 'strafe', w[4]])]) {
    const WK = kind === 'walk', SF = kind === 'strafe', STR = SF ? (strd || 1.15) : WK ? 0.95 : STRIDE, SWH = SF ? 0.2 : WK ? 0.12 : 0.5, STF = SF ? 0.4 : WK ? 0.55 : 0.22,
      BOB = SF ? 0.012 : WK ? 0.008 : 0.025, LAT = SF ? 0.21 : 0.15, FWD = SF ? 0.12 : 0.28;
    const i0 = Math.round(t0 * HZ), i1 = Math.min(N - 1, Math.round(t1 * HZ)), a = rawXZ[i0];
    const phiAt = i => Math.hypot(rawXZ[i][0] - a[0], rawXZ[i][1] - a[1]) / STR;
    const con = [];                                   // contacts in time order: {i, f, p}
    for (let i = i0 + 1; i <= i1; i++) {
      const p0 = phiAt(i - 1), p1 = phiAt(i);
      for (const [f, off] of [['r', 0.12], ['l', 0.62]]) if (Math.floor(p0 - off) < Math.floor(p1 - off)) {
        const vx = root[i][0] - root[Math.max(i0, i - 6)][0], vz = root[i][1] - root[Math.max(i0, i - 6)][1], vn = Math.hypot(vx, vz) || 1;
        const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1;            // right foot on the right of travel: right = (-fz, fx)
        const yl = rawP[i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl);   // body LEFT in world (not travel-relative)
        con.push({ i, f, p: [root[i][0] + fx * FWD + side * LAT * lx, root[i][1] + fz * FWD + side * LAT * lz] });
      }
    }
    if (!STEP2) { const mk = (i, f) => { const vx = root[i][0] - root[Math.max(i0, i - 6)][0], vz = root[i][1] - root[Math.max(i0, i - 6)][1], vn = Math.hypot(vx, vz) || 1;
        const fx = vx / vn, fz = vz / vn, side = f === 'r' ? -1 : 1, yl = rawP[i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl); return { i, f, p: [root[i][0] + fx * FWD + side * LAT * lx, root[i][1] + fz * FWD + side * LAT * lz] }; };
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
        const cur = cs[k], nxt = cs[k + 1], prevAll = con.indexOf(cur), stepLen = nxt ? nxt.i - cur.i : 60, stance = Math.round(stepLen * STF);
        for (let i = cur.i; i < (nxt ? nxt.i : Math.min(i1 + 1, cur.i + stance + 1)); i++) {
          if (i - cur.i <= stance || !nxt) g[f][i] = [cur.p[0], 0, cur.p[1]];
          else { const u = (i - cur.i - stance) / (nxt.i - cur.i - stance), w = u * u * (3 - 2 * u);
            g[f][i] = [lerp(cur.p[0], nxt.p[0], w), SWH * Math.sin(Math.PI * u) * (1 - 0.3 * u), lerp(cur.p[1], nxt.p[1], w)]; }
        }
        g.ev.push({ t: cur.i / HZ, f, p: cur.p });
      }
      // before this foot's first contact: it swings from wherever it was (filled in by the planner at window entry)
      if (cs.length) { let is0 = i0; if (STEP2) { is0 = Math.max(i0, cs[0].i - Math.round(0.2 * HZ)); for (let i = i0; i < is0; i++) if (Math.hypot(root[i][0] - root[i0][0], root[i][1] - root[i0][1]) > 0.4) { is0 = i; break; } }
        for (let i = i0; i < cs[0].i; i++) g[f][i] = i < is0 ? HOLD : { swingTo: cs[0].p, from: is0, to: cs[0].i }; }
    }
    // body bob: lowest at mid-stance, highest in flight, phase from the step sequence
    for (let k = 0; k < con.length; k++) { const a_ = con[k].i, b_ = k + 1 < con.length ? con[k + 1].i : Math.min(i1, a_ + 60);
      for (let i = a_; i < b_; i++) { const u = (i - a_) / Math.max(1, b_ - a_); g.yoff[i] = -BOB * Math.cos(2 * Math.PI * (u - 0.25)) - BOB * 0.4; } }
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
    const Dat = (j, f) => { j = Math.max(0, Math.min(N - 1, j)); const q = raw[c][j], ya = q.yaw * Math.PI / 180, cy = Math.cos(ya), sy = Math.sin(ya),
        off = legFK(f === 'r' ? q.rLeg : q.lLeg, f === 'r' ? q.rKnee : q.lKnee, f === 'r' ? -2 : 2, q.wide ?? 1), lx = off[0] / 16, lz = off[1] / 16;
      return [root[j][0] + lx * cy + lz * sy, root[j][1] - lx * sy + lz * cy]; };   // where the pose wants this foot at index j
    const yawAt = j => raw[c][Math.max(0, Math.min(N - 1, j))].yaw * Math.PI / 180;
    const step2 = (i, f, o) => { const t = i / HZ, A = Math.round(0.1 * HZ), a = Dat(i + A, f), e = Math.hypot(feet[f][0] - a[0], feet[f][1] - a[1]), sg = f === 'l' ? 1 : -1;
      if (t - lastStep[f] < 0.1 || (G[o][i] !== undefined && !G[o][i].hold)) return null;   // not while the other foot is still on its sprint contacts
      const ref = step[o] ? step[o].to : feet[o]; let gmin = 9;                               // lateral gap to the other foot in the body frame, now and over the next 0.25 s of turning
      if (ref) for (const k of [0, 0.12, 0.25]) { const y = yawAt(i + Math.round(k * HZ)); gmin = Math.min(gmin, sg * ((feet[f][0] - ref[0]) * Math.cos(y) - (feet[f][1] - ref[1]) * Math.sin(y))); }
      const need = gmin < 0.1;                                                                // about to stand in line or crossed: this foot has to move even if it is close to its place
      if (step[o]) { if ((t - step[o].t0) / step[o].dur < 0.6 || (e < 0.55 && !need)) return null; } else if (t - lastStep[o] < 0.06 && e < 0.55 && !need) return null;   // one foot at a time unless it is far behind
      const ao = feet[o] && !step[o] ? Dat(i + A, o) : null, eo = ao ? Math.hypot(feet[o][0] - ao[0], feet[o][1] - ao[1]) : 0;
      const j4 = Math.min(N - 1, i + Math.round(0.4 * HZ)), rest = Math.hypot(root[j4][0] - root[i][0], root[j4][1] - root[i][1]) < 0.12;
      if ((!need && e < (rest ? 0.24 : 0.34)) || eo > e + 0.02) return null;                    // the foot that is further off goes first
      const dur = need ? 0.16 : Math.max(0.18, Math.min(0.3, 0.16 + 0.16 * e)), jd = Math.min(N - 1, i + Math.round(dur * HZ)), jl = i + Math.round((dur + 0.16) * HZ); let to = Dat(jl, f);
      const dx = to[0] - root[jd][0], dz = to[1] - root[jd][1], dd = Math.hypot(dx, dz); if (dd > 0.6) to = [root[jd][0] + dx / dd * 0.6, root[jd][1] + dz / dd * 0.6];
      if (ref) for (const j of [jd, jl]) { const y = yawAt(j), lx = Math.cos(y), lz = -Math.sin(y), s2 = (to[0] - ref[0]) * lx + (to[1] - ref[1]) * lz; if (sg * s2 < XMIN + 0.03) { const k = sg * (XMIN + 0.03) - s2; to = [to[0] + lx * k, to[1] + lz * k]; } }   // land on its own side
      return { from: feet[f].slice(), to, t0: t, dur, h: Math.min(0.3, 0.1 + 0.22 * Math.hypot(to[0] - feet[f][0], to[1] - feet[f][1])), fix: true, to0: to.slice() }; };
    for (const e of G.ev) STEPS.push({ c, t: e.t, foot: e.f, p: [e.p[0], 0, e.p[1]], kind: 'step', sp: 5, run: true });
    for (let i = 0; i < N; i++) {
      const t = i / HZ, p = raw[c][i], air = isAir(p), yaw = p.yaw * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
      let dyF = raw[c][Math.min(N - 1, i + Math.round(0.15 * HZ))].yaw - p.yaw; dyF -= 360 * Math.round(dyF / 360);   // no-crossover lookahead (turn capped at
      const yawF = yaw + Math.max(-45, Math.min(45, dyF)) * Math.PI / 180, cyF = Math.cos(yawF), syF = Math.sin(yawF);   // 45 deg: in a spin both sides must stay compatible)
      const vx = i > 0 ? (root[i][0] - root[i - 1][0]) * HZ : 0, vz = i > 0 ? (root[i][1] - root[i - 1][1]) * HZ : 0, sp = Math.hypot(vx, vz);
      const skid = inWin(SLIDES[c], t);
      for (const [f, leg, knee, hx] of [['r', p.rLeg, p.rKnee, -2], ['l', p.lLeg, p.lKnee, 2]]) {
        const out = outs[f], gv = G[f][i];
        if (gv !== undefined && !air && !(gv.hold && step[f])) {
          if (gv.hold) { if (!feet[f]) feet[f] = [root[i][0], root[i][1]]; out.push([feet[f][0], 0, feet[f][1]]); continue; }
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
        if (!STEP2 && i > 0 && inWin(SLIDES[c], (i - 1) / HZ) && feet[f] && rec[f] == null) rec[f] = t + (f === 'r' ? 0 : 0.07);   // slide just ended
        if (rec[f] != null && t >= rec[f] && !step[f]) { const sd = f === 'r' ? -1 : 1; step[f] = { from: feet[f].slice(), to: [root[i][0] + sd * 0.14 * cy + 0.05 * sy + vx * 0.12, root[i][1] - sd * 0.14 * sy + 0.05 * cy + vz * 0.12], t0: t, dur: 0.15, h: 0.16 }; rec[f] = null; }   // neutral stance under the hips
        const o = f === 'r' ? 'l' : 'r';
        if (step[f]) {
          const s_ = step[f], u = Math.min(1, (t - s_.t0) / s_.dur), uh = Math.min(1, u / 0.85), w = uh * uh * (3 - 2 * uh);
          if (s_.fix) s_.to = s_.to0.slice(); else if (u < 0.85) s_.to = [lerp(s_.to[0], D[0] + vx * (s_.dur * (1 - u)) * 0.6, 0.15), lerp(s_.to[1], D[1] + vz * (s_.dur * (1 - u)) * 0.6, 0.15)];
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
        const st2 = STEP2 ? step2(i, f, o) : null; if (st2) step[f] = st2; else if (STEP2 ? crossed : crossed || (err > 0.17 && rested && !otherBusy && !(step[o] == null && feet[o] && errO > err * 1.4 && reach < 0.5)) || (reach > Math.max(0.5, Math.hypot(D[0] - root[i][0], D[1] - root[i][1]) + 0.15) && Math.hypot(feet[f][0] - D[0], feet[f][1] - D[1]) > 0.08 && !step[f] && t - lastStep[f] > 0.06)) {
          const run = sp > 2.5, dur = run ? Math.max(0.12, Math.min(0.18, 0.75 / sp)) : crossed ? 0.12 : Math.min(0.26, Math.max(0.15, 0.1 + 0.12 * err));   // crossed: quick side step
          step[f] = { from: feet[f].slice(), to: [D[0] + vx * dur * 0.75, D[1] + vz * dur * 0.75], t0: t, dur, h: run ? 0.28 : crossed ? 0.14 : Math.min(0.26, 0.07 + 0.24 * err) };
        }
        out.push([feet[f][0], 0, feet[f][1]]);
      }
    }
    const forced = i => STEP2 || inWin(RUN[c], i / HZ) || inWin(WALK[c], i / HZ) || inWin(DRIFT.filter(w => !w[5] || w[5] === c), i / HZ) || inWin(SLIDES[c], i / HZ) || isAir(raw[c][i]);
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
const NOFREE = !!new URLSearchParams(globalThis.location ? location.search : '').get('nofree');
const OFFH = { A: 'l', B: 'l' };   // which hand holds nothing ('r' for an archer; null = leave both arms to the keys)
const FREE_REF = { l: [-38, 24, -64], r: [-62, 10, -56] };   // the raised guard arm every G pose inherits: [arm x, |arm z|, elbow x]
function freeArm(c, t, p) {
  if (NOFREE) { p.lArm = p.lArm.map(v => v * 1.25); p.lElbow = p.lElbow.map(v => v * 1.1); return; }   // ?nofree=1: the old behaviour, for before/after measurements
  const s = OFFH[c]; if (!s) return; const arm = s + 'Arm', elb = s + 'Elbow', m = s === 'l' ? 'rArm' : 'lArm', sg = s === 'l' ? 1 : -1;
  const held = clamp(s === 'l' ? (p.lh || 0) : (p.rh || 0)); if (held > 0.98 || inWin(RUN[c], t) || inWin(WALK[c], t)) return;
  const f = tt => { const q = evalKeysS(T[c], tt), tw = (q.waist[1] || 0) + (q.chest[1] || 0), main = q[m][0] + 62;
    return [clamp(10 - 0.2 * main - 0.2 * sg * tw + 0.3 * (q.waist[0] || 0), -42, 46), 11 + 0.15 * Math.abs(tw) + 0.08 * Math.max(0, -main)]; };
  const av = t0 => { const s = [0, 0]; for (let i = 0; i < 5; i++) { const q = f(t0 - 0.03 * i); s[0] += q[0] / 5; s[1] += q[1] / 5; } return s; };   // averaged over 0.12 s: no kick at a key
  const a = av(t - 0.04), b = av(t - 0.16), px = a[0] + 0.35 * (a[0] - b[0]), pz = a[1] + 0.35 * (a[1] - b[1]);   // a beat late + a little overshoot = follow-through
  const el = -20 - 0.28 * Math.abs(px) - 0.5 * Math.abs(a[0] - b[0]), R = FREE_REF[s];
  const dist = Math.abs(p[arm][0] - R[0]) + Math.abs(sg * p[arm][2] - R[1]) + Math.abs(p[elb][0] - R[2]);
  const w = (0.3 + 0.7 * clamp(1 - dist / 40)) * (1 - held);
  p[arm] = [lerp(p[arm][0], px, w), p[arm][1] * (1 - w), lerp(p[arm][2], sg * pz, w)]; p[elb] = [lerp(p[elb][0], el, w), 0, 0];
}
function poseRaw(c, t) {
  if (c === 'C') { const p = N(); p.pos = [0, -200, 0]; return p; }
  const p = basePose(c, t), k0 = evalKeysS(T[c], t);
  for (const j in LAG) { const q = evalKeysS(T[c], t + LAG[j]); p[j] = p[j].map((v, i) => v + (q[j][i] - k0[j][i])); }
  freeArm(c, t, p);   // the free hand flows (was: left arm x 1.25)
  { const q = evalKeysS(T[c], t - 0.03), v = p.bd.map((x, i) => x + (q.bd[i] - k0.bd[i])), n = Math.hypot(...v) || 1; p.bd = v.map(x => x / n); }
  if (BDT[c]) { const v = samp(BDT[c], t), n = Math.hypot(...v) || 1; p.bd = v.map(x => x / n); }
  // v8: the sword follows the forearm (rigid-grip blend in the rig), eased off around contacts so the clash solve stays exact
  { let m = 1; for (const cl of CLASHES) { const d = Math.abs(t - cl.t); if (d < 0.14) m = Math.min(m, 0.35 + 0.65 * E.io(d / 0.14)); }
    // and where the sword arm itself whips (> ~25 deg/frame), so a fast arm can't snap the blade more than a frame's worth
    const q0 = evalKeysS(T[c], t - 1 / 60), q1 = evalKeysS(T[c], t + 1 / 60), av = Math.max(...[0, 1, 2].map(i => Math.abs(q1.rArm[i] - q0.rArm[i]) + Math.abs(q1.rElbow[i] - q0.rElbow[i])));
    m *= clamp(1 - (av - 25) / 35); p.gk = (GKC[c] ?? GK) * m * (1 - clamp(p.lh || 0)); }
  // v8: sword twirls - the blade spins about the forearm; fades in/out over 0.14 s around each window
  p.spinK = 0; p.spin = 0;
  for (const [t0, t1, n] of TWIRL[c]) if (t > t0 - 0.12 && t < t1 + 0.12) { p.spin = 360 * n * E.io(clamp((t - t0) / (t1 - t0))); p.spinK = clamp(Math.min((t - t0 + 0.12) / 0.14, (t1 + 0.12 - t) / 0.14)); }
  const S_ = SIM[c], rt = samp(S_.root, t), rw = samp(S_.raw, t), X = rt[0] + p.pos[0] - rw[0], Z = rt[1] + p.pos[2] - rw[1], g = W.floorAt(X, Z);
  p.pos = [X, g + yEff(p) + 0.035 + samp(S_.yoff, t)[0], Z];
  { const o = c === 'A' ? 'B' : 'A', ro = samp(SIM[o].root, t); p.opp = [ro[0], W.floorAt(ro[0], ro[1]), ro[1]];
    const ob = basePose(o, t), pitch = ((ob.waist[0] || 0) + (ob.chest[0] || 0) * 0.6) * Math.PI / 180, oy = ob.yaw * Math.PI / 180, lean = Math.sin(pitch) * 0.95;
    p.oppLean = [Math.sin(oy) * lean, 0, Math.cos(oy) * lean, yEff(ob) + 0.035 - (1 - Math.cos(pitch)) * 0.9];   // opponent chest/head offset for the weapon collision
    p.oppArms = oppArmPts(ob, ro, p.oppLean);
    if (CLASHES.some(cl => cl.gap && t > cl.t - 0.42 && t < cl.t + 0.26)) p.oppArms = null;   // spaced clashes (v8x part 1, 2026-11-13): the attacker's sword arm sweeps past the guard blade and this un-smoothed push-out threw the blade 100+ deg per frame = jitter
    p.oppFeet = ['r', 'l'].map(s => { const f = samp(SIM[o][s], t); return f ? [f[0], W.floorAt(f[0], f[2]) + f[1] + 0.05, f[2]] : null; });   // opponent legs for the weapon collision
    { let k = 1; for (const cl of CLASHES) k = Math.min(k, clamp((Math.abs(t - cl.t) - 0.08) / 0.14)); p.oppFeetK = k; }   // eased off around clashes so the clash solve stays exact
  }
  if (GRIPT && GRIPT[c]) { const g = GRIPT[c], x = Math.max(0, Math.min(g.w.length - 2, t * g.hz)), i = Math.floor(x); p.gripW = g.w[i] + (g.w[i + 1] - g.w[i]) * (x - i); }   // support-hand grip (fight.js setGrip)
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
const INS = [7.0, 17.5];   // two impact inserts only (standard: fewer jumps). 7.0 = the big clash that ends the first exchange
const FLASH = 30.73, BIND_T = -9, BIND_END = -8, FALL_T = 32.95, FALL_C = 'B', INTRO_END = 2.9, T_OUTRO = 34.0;
// calmer than v8 (its shots averaged 0.5 s; the user: "fewer half-second camera changes", "scenes being skipped"): about 1 s per shot
const SHOTS = [
  // part 1 (user, 2026-11-13): the twirl shot pulled back so both players are in frame; the insert sits on the real contact; the skid gets a side shot wide enough for both
  [0.0, 'est'], [INTRO_END, 'three4'], [4.0, 'side', { d: 7.8, h: 1.3 }], [5.05, 'trackA', { d: 3.8 }], [5.75, 'side', { d: 5.0, h: 1.3 }], [7.0, 'ins'], [7.1, 'side', { d: 7.6, h: 1.4 }],
  // part 2 (user, 2026-11-13): no camera behind a fighter's back ('three4' put A's back over both spin cuts and the overhead), no run
  // of 0.5 s shots (9.85-11.5 had four), wide enough for the long knock-backs. Side-on shots show both swords.
  [7.95, 'trackB', { d: 4.4 }], [8.7, 'side', { d: 5.8, h: 1.3 }], [9.9, 'side', { d: 7.8, h: 1.4 }], [10.5, 'trackB', { d: 4.4 }], [11.0, 'low', { d: 4.8, look: 2.2, roll: 0.05 }], [11.6, 'side', { d: 6.0, h: 1.4 }],
  [13.35, 'side', { d: 7.0, h: 1.4 }],
  // part 3 (2026-11-13): no over-the-shoulder shot (it sat inside A's back), no orbit behind B; six shots in 7.6 s, all from the same
  // side of the fighters' line, wide enough for the 2.4-block knock-backs
  [15.1, 'side', { d: 6.2, h: 1.4 }], [16.4, 'low', { d: 5.2, look: 2.0, roll: 0.04 }], [17.5, 'ins'], [17.6, 'side', { d: 7.4, h: 1.4 }],
  [19.05, 'low', { d: 5.4, look: 2.4, roll: 0.05 }], [20.1, 'side', { d: 6.6, h: 1.4 }],
  [23.0, 'otsB'], [23.9, 'side', { d: 4.4, h: 1.3 }], [24.7, 'wide', { d: 8.5 }], [25.4, 'trackA', { d: 4.2 }], [25.85, 'side', { d: 4.8, h: 1.3 }],
  [26.8, 'low', { d: 3.3, look: 1.5, roll: 0.05 }], [27.5, 'three4'], [28.4, 'wide', { d: 8 }], [29.75, 'trackA', { d: 4.4 }], [30.25, 'low', { d: 5.0, look: 1.6, roll: -0.05 }],
  [FLASH, 'flash'], [FLASH + 3 * DT, 'pierce'], [31.6, 'side', { d: 4.6, h: 1.2 }], [32.5, 'wide', { d: 7 }], [33.6, 'orbit', { a0: 0.3, a1: 0.62, d: 6.5, h: 1.6 }],
];
// logo outro (DOM over the canvas, index_x.html): the scene dims, the logo fades and settles in, one soft shine, short fade to black
let VO_ = null;
export function overlay(tv, t, doc) {
  if (VO_ == null) VO_ = videoAt(T_OUTRO);
  const io_ = u => u * u * (3 - 2 * u), el = doc.getElementById('outro'), shine = doc.getElementById('shine'), glow = doc.getElementById('glow'), fade = doc.getElementById('fade'), dim = doc.getElementById('dim');
  const d = tv - VO_, END = videoAt(TOTAL); if (d <= 0) { el.style.opacity = 0; fade.style.opacity = 0; dim.style.opacity = 0; return; }
  const a = io_(clamp(d / 0.7)), s = 0.9 + 0.1 * (1 - Math.pow(1 - clamp(d / 0.9), 3));
  el.style.opacity = a; dim.style.opacity = (0.55 * io_(clamp(d / 1.1))).toFixed(3); doc.getElementById('ls').style.transform = 'scale(' + s.toFixed(4) + ')'; glow.style.opacity = (0.55 * a).toFixed(3);
  const k_ = clamp((d - 0.9) / 0.9); shine.style.opacity = (Math.sin(Math.PI * k_) * 0.85).toFixed(3); shine.style.left = (-30 + 130 * k_).toFixed(2) + '%';
  fade.style.opacity = io_(clamp((tv - (END - 0.4)) / 0.4)).toFixed(3);
}
// ---- split-panel face intro (fight.js renders one camera per panel while panelAt(t))
export const PANELS = { t1: INTRO_END, slant: 0.14, panels: [
  { x0: 0.0, x1: 0.489, t0: 0.0, dark: [0.05, 0.1, 0.3], light: [0.75, 1.0, 1.3] },      // A: storm blue
  { x0: 0.511, x1: 1.0, t0: 0.12, dark: [0.16, 0.03, 0.03], light: [1.3, 0.78, 0.5] } ] };  // B: ember red
export function panelAt(t) { return t < INTRO_END - 1e-6; }
export function panelCams(t) {   // close on each face, a little below eye level, slow push in
  const u = clamp(t / INTRO_END);
  return ['A', 'B'].map(k => cast_ => { const hd = cast_[k].bones.head.getWorldPosition(v3(0, 0, 0)), p = pose(k, t), f = v3(Math.sin(p.yaw * Math.PI / 180), 0, Math.cos(p.yaw * Math.PI / 180)), s = f.clone().cross(v3(0, 1, 0)).normalize();
    const c = hd.clone().add(v3(0, 0.27, 0));
    return { pos: c.clone().add(f.clone().multiplyScalar(2.7 - 0.45 * E.io(u))).add(s.multiplyScalar(k === 'A' ? 0.2 : -0.2)).add(v3(0, -0.3, 0)), look: c, fov: 26, roll: k === 'A' ? -0.035 : 0.035, label: 'panel' }; });
}
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
      const cp_ = v3(...c.p); pos = cp_.clone().add(side.clone().multiplyScalar(ii % 2 ? -3.4 : 3.4)).add(up(-0.2)); /* square on to the contact, far enough to see both blades and both fighters' arms (user: the impact frame must show the hit) */ look = cp_.clone().add(up(-0.5)); fov = 36 + 30 * lt; roll = ii % 2 ? 0.12 : -0.1; break; }
    case 'slideA': { const g_ = v3(0, 0, 0).copy(A).setY(gy);   // low, ahead of the sliding fighter: the spear head ploughs the sand toward the lens
      pos = g_.clone().add(side.clone().multiplyScalar(2.5)).add(ab.clone().multiplyScalar(-1.5 + 0.5 * u)).setY(gy + 0.4); look = g_.clone().add(ab.clone().multiplyScalar(0.5)).setY(gy + 0.75); fov = 44; roll = 0.05; break; }
    case 'pierce': pos = mid.clone().add(side.clone().multiplyScalar(-(4.3 - 0.5 * E.io(u)))).add(ab.clone().multiplyScalar(0.9)).setY(gy + 1.15); look = mid.clone().add(ab.clone().multiplyScalar(0.2)).setY(gy + 1.1); fov = 38; roll = -0.03; break;
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
    if (c.kind === 'arrow') { burst(add, t, c.t, p, 34, Math.round(c.t * 131), 0.75); if (d >= 0 && d < 0.1) { flares.push({ p, s: 0.7 * (1 - d / 0.1), a: 1 - d / 0.1, rot: c.t * 5 }); sparkLight.i = Math.max(sparkLight.i, 4 * (1 - d / 0.1)); sparkLight.p = p; } }
    if (c.kind === 'drag') { const g_ = W.floorAt(p[0], p[2]); puff(soft, t, c.t, [p[0], g_, p[2]], 9, Math.round(c.t * 613), 0.4, 0.7, [0.92, 0.82, 0.62], 0.9); burst(add, t, c.t, [p[0], g_ + 0.05, p[2]], 8, Math.round(c.t * 419), 0.45); }
    if (c.kind === 'arrowg') puff(soft, t, c.t, [p[0], W.floorAt(p[0], p[2]), p[2]], 8, Math.round(c.t * 71), 0.35, 0.4, [0.92, 0.82, 0.62], 0.8);
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
