// AnimationGPT fight director (20 s). The skeletal motion of both fighters comes from AnimationGPT clips
// (motion/agpt_batch.py -> tools/motion2rig.py -> mocap/fight20/*.json); this module only places, times and joins them:
//   1. timeline   per fighter, a list of clip segments (in/out points, speed, blend). Attacks are placed by their strike
//                 frame, so a strike lands exactly when the defender's parry/dodge/hit reaction needs it.
//   2. root      each segment's root motion starts where the previous one is and is turned to face the opponent;
//                 spacing is corrected so blades can actually meet at every sync point.
//   3. feet      the clip's feet are put on the sand (vertical fit), crouches are partly lifted, and every planted foot is
//                 locked in place with leg IK (no foot sliding); knee direction is taken from the clip so IK = FK.
//   4. blade     the mocap has no wrist/sword: the blade follows the forearm (upright in guard, extending the arm line in a
//                 fast swing); at a parry the defender's blade is aimed through the attacker's blade (real contact).
//   5. hit-stop  a few frames of slowed time at each contact (no flash, no shake).
// Everything is baked at 60 Hz into pose arrays in init(); pose(c, t) just interpolates them.
import * as THREE from 'three';

export const TOTAL = 20.0;
const HZ = 60, D2R = Math.PI / 180;
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
const LIFT = QS.has('lift') ? +QS.get('lift') : 0.45;          // fraction of a crouch that is lifted (0 = raw clip)
const JK = ['waist', 'chest', 'head', 'rArm', 'rElbow', 'lArm', 'lElbow', 'rLeg', 'rKnee', 'lLeg', 'lKnee', 'tilt'];

let W = null, FL = 30, R = null;
const CLIP = {}, VET = {};
export const CLASHES = [], CORR = { A: [], B: [] }, STEPS = [];
let CONT = [], GHITS = [];
export const SLIDES = { A: [], B: [] };

// ------------------------------------------------------------------ the fight (action time; see WARP for hit-stops)
// seg: [clip, at, a, b, opts]  at = action time the segment starts (or, with opts.strike, the time its strike frame lands)
//      a/b = clip in/out (s); opts: speed, blend (s), lift, air:[t0,t1] (clip times airborne), scale (root motion)
// sync: contacts the director enforces (spacing + blade contact + hit-stop + effects + sound)
import { PLAN } from './plan.js';

// ------------------------------------------------------------------ clip sampling (Catmull-Rom on the native 20 fps)
const cr = (p0, p1, p2, p3, u) => 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
function sample(clip, ts) {
  const F = clip.frames, n = F.length, x = Math.max(0, Math.min(n - 1, ts * clip.fps)), i = Math.min(n - 2, Math.floor(x)), u = x - i;
  const f0 = F[Math.max(0, i - 1)], f1 = F[i], f2 = F[i + 1], f3 = F[Math.min(n - 1, i + 2)], p = {};
  for (const k of [...JK, 'pos']) p[k] = f1[k].map((v, m) => cr(f0[k][m], v, f2[k][m], f3[k][m], u));
  p.yaw = cr(f0.yaw, f1.yaw, f2.yaw, f3.yaw, u);
  return p;
}
const wrapNear = (v, ref) => v + 360 * Math.round((ref - v) / 360);
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const rotY = (x, z, th) => [x * Math.cos(th) + z * Math.sin(th), -x * Math.sin(th) + z * Math.cos(th)];

// ------------------------------------------------------------------ hit-stop time warp (scene t -> action time)
let WARP = null;
function buildWarp() {
  const N = Math.round(TOTAL * 600) + 1, w = new Float64Array(N); let tau = 0;
  const stops = PLAN.sync.filter(s => s.stop).map(s => s); const slow = PLAN.slow || [];
  // scene time of each stop is found iteratively (stops are given in action time)
  for (let i = 0; i < N; i++) {
    w[i] = tau; let rate = 1;
    for (const s of stops) { const d = tau - s.t; if (d > -0.005 && d < s.stop) rate = Math.min(rate, 0.22); }
    for (const [a, b, r] of slow) if (tau > a && tau < b) rate = Math.min(rate, lerp(1, r, smooth((tau - a) / 0.25) * smooth((b - tau) / 0.25)));
    tau += rate / 600;
  }
  WARP = w;
}
export function act(t) { const x = Math.max(0, Math.min(WARP.length - 1, t * 600)), i = Math.min(WARP.length - 2, Math.floor(x)); return lerp(WARP[i], WARP[i + 1], x - i); }
export function sceneT(tau) { let lo = 0, hi = WARP.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (WARP[m] < tau) lo = m; else hi = m; } return lo / 600; }

// ------------------------------------------------------------------ bake
const BK = { A: [], B: [] };     // per fighter, 60 Hz pose list in ACTION time
let NB = 0;
function segList(c) {
  return PLAN[c].map(([clip, at, a, b, o = {}]) => {
    const C = CLIP[clip]; if (!C) throw new Error('missing clip ' + clip);
    const sp = o.speed || 1, strike = o.strike ? (o.strikeT ?? VET[clip].strike) : null;
    const t0 = strike != null ? (o.at ?? at) - (strike - a) / sp : at;
    return { clip, C, a, b: Math.min(b, C.duration), sp, t0, t1: t0 + (Math.min(b, C.duration) - a) / sp, blend: o.blend ?? 0.22, o };
  }).sort((x, y) => x.t0 - y.t0);
}
function baseTrack() {
  const S = { A: segList('A'), B: segList('B') };
  NB = Math.round(PLAN.end * HZ) + 1;
  const st = { A: { x: PLAN.start.A[0], z: PLAN.start.A[1], yaw: PLAN.start.A[2] }, B: { x: PLAN.start.B[0], z: PLAN.start.B[1], yaw: PLAN.start.B[2] } };
  const anc = { A: [], B: [] };
  for (let i = 0; i < NB; i++) {
    const t = i / HZ;
    for (const c of ['A', 'B']) {
      const o = c === 'A' ? 'B' : 'A', segs = S[c];
      // anchor every segment that starts now: where this fighter is, facing the opponent
      segs.forEach((s, j) => {
        if (anc[c][j] || t < s.t0 - 1e-9) return;
        const cur = st[c], opp = st[o];
        let face = Math.atan2(opp.x - cur.x, opp.z - cur.z) / D2R + (s.o.face || 0);
        if (s.o.keepYaw) face = cur.yaw;
        // heading: the clip faces the opponent at its key frame (strike / contact), not at its first frame
        const p0 = sample(s.C, s.a), pf = sample(s.C, Math.max(s.a, Math.min(s.b, s.o.faceAt ?? s.a)));
        // attacks / parries: turn the clip so the SWORD HAND points at the opponent at that frame (the hips of a big swing
        // are often turned far away from the target, so aligning the body would send the cut sideways)
        let ref = pf.yaw;
        if (s.o.strike) { const ch = fk(c, { ...pf, pos: [0, 0, 0] }), h = ch.bones.rHand.getWorldPosition(new THREE.Vector3()), o0 = ch.bones.chest2.getWorldPosition(new THREE.Vector3());
          ref = Math.atan2(h.x - o0.x, h.z - o0.z) / D2R + (s.o.handOff || 0); }
        anc[c][j] = { x: cur.x, z: cur.z, th: (face - ref) * D2R, y0: p0.pos, yaw0: p0.yaw, face };
      });
      // active segments and weights (later segment blends in over its blend time)
      let pose = null, last = -1;
      segs.forEach((s, j) => { if (anc[c][j] && (last < 0 || s.t0 >= segs[last].t0)) last = j; });
      segs.forEach((s, j) => {
        if (!anc[c][j] || (t > s.t1 + 0.6 && j !== last)) return;   // the newest segment holds its last frame until the next one
        const ts = Math.min(s.b, s.a + (t - s.t0) * s.sp), q = sample(s.C, ts), A = anc[c][j], sc = s.o.scale ?? 1;
        const [dx, dz] = rotY((q.pos[0] - A.y0[0]) * sc, (q.pos[2] - A.y0[2]) * sc, A.th);
        const P = { trk: s.o.strike ? 0 : 1, pos: [A.x + dx, q.pos[1], A.z + dz], yaw: q.yaw + A.th / D2R, air: s.o.air && ts >= s.o.air[0] && ts <= s.o.air[1], lift: s.o.lift ?? LIFT, seg: j, ts };
        for (const k of JK) P[k] = q[k];
        if (!pose) { pose = P; return; }
        const w = smooth((t - s.t0) / s.blend);
        for (const k of JK) pose[k] = pose[k].map((v, m) => lerp(v, wrapNear(P[k][m], v), w));
        pose.pos = pose.pos.map((v, m) => lerp(v, P.pos[m], w)); pose.yaw = lerp(pose.yaw, wrapNear(P.yaw, pose.yaw), w);
        pose.trk = lerp(pose.trk, P.trk, w); pose.air = w > 0.5 ? P.air : pose.air; pose.lift = lerp(pose.lift, P.lift, w); if (w > 0.5) { pose.seg = j; pose.ts = P.ts; }
      });
      BK[c][i] = pose; st[c] = { x: pose.pos[0], z: pose.pos[2], yaw: pose.yaw };
    }
  }
}
// spacing: at each sync point move the fighters along their line so the root distance = s.dist (ramped in, then held)
function spacing() {
  const off = { A: new Float64Array(NB * 2), B: new Float64Array(NB * 2) };
  const at = (c, i) => [BK[c][i].pos[0] + off[c][i * 2], BK[c][i].pos[2] + off[c][i * 2 + 1]];
  for (const s of PLAN.sync.filter(s => s.dist).sort((a, b) => a.t - b.t)) {
    const i = Math.round(s.t * HZ), a = at(s.att, i), d = at(s.def, i), dx = d[0] - a[0], dz = d[1] - a[1], L = Math.hypot(dx, dz) || 1, e = L - s.dist;
    const ux = dx / L, uz = dz / L, ramp = s.ramp ?? 0.55, share = s.share ?? 0.7;
    for (let k = 0; k < NB; k++) { const u = smooth((k / HZ - (s.t - ramp)) / ramp);
      off[s.att][k * 2] += ux * e * share * u; off[s.att][k * 2 + 1] += uz * e * share * u;
      off[s.def][k * 2] -= ux * e * (1 - share) * u; off[s.def][k * 2 + 1] -= uz * e * (1 - share) * u; }
  }
  for (const c of ['A', 'B']) for (let i = 0; i < NB; i++) { BK[c][i].pos[0] += off[c][i * 2]; BK[c][i].pos[2] += off[c][i * 2 + 1]; }
  // keep facing the opponent through the whole fight (gentle, low-passed heading correction toward the line)
  for (const c of ['A', 'B']) {
    const o = c === 'A' ? 'B' : 'A', corr = new Float64Array(NB);
    for (let i = 0; i < NB; i++) { const p = BK[c][i], q = BK[o][i], want = Math.atan2(q.pos[0] - p.pos[0], q.pos[2] - p.pos[2]) / D2R;
      const segFace = p.trk; corr[i] = segFace * (wrapNear(want, p.yaw + (PLAN.facing?.[c] || 0)) - p.yaw - (PLAN.facing?.[c] || 0)); }
    const sm = gauss(corr, 0.35 * HZ);
    for (let i = 0; i < NB; i++) { const s = BK[c][i]; const k = PLAN.track?.[c] ?? 0.6; const r = sm[i] * k * D2R; s.yaw += sm[i] * k;
      // the body turns about its own root: positions unaffected, joints unchanged
    }
  }
}
function gauss(arr, sig) {
  const n = arr.length, out = new Float64Array(n), r = Math.ceil(sig * 2.5);
  for (let i = 0; i < n; i++) { let s = 0, ws = 0; for (let k = -r; k <= r; k++) { const j = Math.max(0, Math.min(n - 1, i + k)), w = Math.exp(-0.5 * (k / sig) ** 2); s += arr[j] * w; ws += w; } out[i] = s / ws; }
  return out;
}
function smoothTrack(c, sig) {   // light zero-phase smoothing of every joint + root (removes generation jitter and joins)
  const B = BK[c];
  for (const k of [...JK, 'pos']) for (let m = 0; m < 3; m++) { if (!B[0][k] || B[0][k][m] === undefined) continue;
    const a = new Float64Array(NB); for (let i = 0; i < NB; i++) a[i] = B[i][k][m];
    const g = gauss(a, sig * HZ); for (let i = 0; i < NB; i++) B[i][k][m] = g[i]; }
  const y = new Float64Array(NB); for (let i = 0; i < NB; i++) y[i] = B[i].yaw; const g = gauss(y, sig * HZ); for (let i = 0; i < NB; i++) B[i].yaw = g[i];
}

// FK probes (needs the real rig: cast + applyPose from fight.js)
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function fk(c, P) { const ch = R.cast[c]; R.applyPose(ch, { ...P, ik: null, bd: null }); ch.root.updateMatrixWorld(true); return ch; }
function soles(ch) { return ['rSn', 'lSn'].map(b => ch.bones[b].localToWorld(_v.set(0, -6, 0)).clone()); }

function feet(c) {
  const B = BK[c], ch = R.cast[c];
  // vertical fit: lowest sole on the sand (airborne parts keep the clip's own arc), crouch partly lifted
  const lowS = new Float64Array(NB), hipH = new Float64Array(NB), air = new Uint8Array(NB);
  const clipY = new Float64Array(NB);
  for (let i = 0; i < NB; i++) { const P = B[i]; clipY[i] = P.pos[1]; P.pos[1] = 0; const h = fk(c, P), [r, l] = soles(h);   // root at y = 0
    lowS[i] = Math.min(r.y, l.y); hipH[i] = h.bones.hips.getWorldPosition(_w).y - lowS[i]; air[i] = P.air ? 1 : 0; }
  const stand = [...hipH].sort((a, b) => a - b)[Math.floor(NB * 0.92)];
  const vo = new Float64Array(NB);
  for (let i = 0; i < NB; i++) vo[i] = -lowS[i];
  for (let i = 0; i < NB; i++) if (air[i]) {                    // airborne: keep the clip's own height arc between the take-off and landing fits
    let a = i; while (a > 0 && air[a]) a--; let b = i; while (b < NB - 1 && air[b]) b++; const u = (i - a) / Math.max(1, b - a);
    vo[i] = lerp(vo[a], vo[b], u) + Math.max(0, clipY[i] - lerp(clipY[a], clipY[b], u)); }
  const lift = new Float64Array(NB); for (let i = 0; i < NB; i++) lift[i] = air[i] ? 0 : B[i].lift * Math.max(0, stand * 0.97 - hipH[i]);
  const voS = gauss(vo, 0.03 * HZ), liftS = gauss(lift, 0.12 * HZ);
  for (let i = 0; i < NB; i++) B[i].pos[1] = W.floorAt(B[i].pos[0], B[i].pos[2]) + voS[i] + liftS[i] + (B[i].airY || 0);
  // contacts + locks
  const sol = { r: [], l: [] }, knee = { r: [], l: [] };
  for (let i = 0; i < NB; i++) { const h = fk(c, B[i]), [r, l] = soles(h); sol.r.push(r); sol.l.push(l);
    for (const [s, kb] of [['r', 'rSn'], ['l', 'lSn']]) { const kp = h.bones[kb].getWorldPosition(new THREE.Vector3());
      const hp = h.bones[s === 'r' ? 'rTh' : 'lTh'].getWorldPosition(new THREE.Vector3()), sp = s === 'r' ? r : l;
      const mid = hp.clone().lerp(sp, 0.5), kd = kp.clone().sub(mid); knee[s].push(Math.atan2(kd.x, kd.z) / D2R - B[i].yaw); } }
  for (const s of ['r', 'l']) {
    const S = sol[s], on = new Uint8Array(NB);
    for (let i = 1; i < NB; i++) { const h = S[i].y - W.floorAt(S[i].x, S[i].z), v = Math.hypot(S[i].x - S[i - 1].x, S[i].z - S[i - 1].z) * HZ;
      on[i] = (on[i - 1] ? (h < 0.11 && v < 1.6) : (h < 0.06 && v < 0.9)) && !air[i] ? 1 : 0; }
    for (let i = 1; i < NB - 1; i++) if (on[i - 1] && !on[i] && on[i + 1]) on[i] = 1;          // fill 1-frame gaps
    const kn = gauss(Float64Array.from(knee[s].map((v, i, a) => i ? v : v)), 0.04 * HZ);
    // intervals
    let i = 0;
    while (i < NB) {
      if (!on[i]) { i++; continue; } let j = i; while (j < NB && on[j]) j++;
      if ((j - i) / HZ >= 0.07) {
        const pin = [S[i].x, 0, S[i].z]; pin[1] = W.floorAt(pin[0], pin[2]) + 0.02;
        const prev = STEPS.filter(e => e.c === c).pop();
        STEPS.push({ t: sceneT(i / HZ), c, foot: s, kind: B[Math.max(0, i - 4)].air ? 'land' : 'step', p: pin, sp: Math.hypot(S[i].x - S[Math.max(0, i - 6)].x, S[i].z - S[Math.max(0, i - 6)].z) * HZ / 6, run: false });
        const fin = 0.05 * HZ, fout = 0.09 * HZ;
        for (let k = Math.max(0, i - fin); k < Math.min(NB, j + fout); k++) {
          const w = k < i ? smooth((k - (i - fin)) / fin) : k < j ? 1 : 1 - smooth((k - j) / fout);
          const P = B[k]; P.ik = P.ik || {}; const cur = P.ik[s];
          const tgt = [lerp(S[k].x, pin[0], w), lerp(S[k].y, pin[1], w), lerp(S[k].z, pin[2], w)];
          if (!cur || w > (P.ik['w' + s] || 0)) { P.ik[s] = tgt; P.ik['w' + s] = w; P.ik[s + 'Pole'] = kn[k]; }
        }
      }
      i = j;
    }
  }
  // keep FK leg angles available for the free leg (P.rLeg etc. are already the clip's)
}

function blades(c) {
  const B = BK[c], hand = [], el = [];
  for (let i = 0; i < NB; i++) { const h = fk(c, B[i]); hand.push(h.bones.rHand.getWorldPosition(new THREE.Vector3())); el.push(h.bones.rEl.getWorldPosition(new THREE.Vector3())); }
  const D = [];
  for (let i = 0; i < NB; i++) {
    const f = hand[i].clone().sub(el[i]).normalize(), up = new THREE.Vector3(0, 1, 0), yw = B[i].yaw * D2R, fwd = new THREE.Vector3(Math.sin(yw), 0, Math.cos(yw));
    const a = Math.max(0, i - 2), b = Math.min(NB - 1, i + 2), vel = hand[b].clone().sub(hand[a]).multiplyScalar(HZ / (b - a)), sp = vel.length();
    const guard = up.clone().multiplyScalar(1.0).addScaledVector(fwd, 0.55).addScaledVector(f, 0.35).normalize();
    const swing = f.clone().addScaledVector(vel.clone().normalize(), 0.3).addScaledVector(up, 0.12).normalize();
    const m = smooth((sp - 2.2) / 5.0) * (B[i].bladeSwing ?? 1);
    D.push(guard.multiplyScalar(1 - m).addScaledVector(swing, m).normalize());
  }
  // temporal smoothing of the aim
  const comp = [0, 1, 2].map(k => gauss(Float64Array.from(D.map(d => d.getComponent(k))), 0.035 * HZ));
  for (let i = 0; i < NB; i++) B[i].bdW = new THREE.Vector3(comp[0][i], comp[1][i], comp[2][i]).normalize();
}
function bdLocal(P, d) { const ty = ((P.yaw || 0) + (P.waist?.[1] || 0) + (P.chest?.[1] || 0)) * D2R; const v = d.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -ty); return [v.x, v.y, v.z]; }
function bladePts(c, i, along = [8, 26]) { const P = { ...BK[c][i], bd: bdLocal(BK[c][i], BK[c][i].bdW) }; const ch = R.cast[c]; R.applyPose(ch, P); ch.root.updateMatrixWorld(true);
  return along.map(a => ch.weapon.localToWorld(new THREE.Vector3(0, a, 0))); }
// parries: aim the defender's blade through the attacker's blade at the contact (ramped in/out)
function parries() {
  for (const s of PLAN.sync.filter(s => s.kind === 'clash')) {
    const i = Math.round(s.t * HZ), [a0, a1] = bladePts(s.att, i, [10, 24]), Q = a0.clone().lerp(a1, s.at ?? 0.55);
    const ch = R.cast[s.def]; fk(s.def, BK[s.def][i]); const hand = ch.bones.rHand.getWorldPosition(new THREE.Vector3());
    const tgt = Q.clone().sub(hand).normalize(), pre = Math.round((s.pre ?? 0.22) * HZ), post = Math.round((s.post ?? 0.2) * HZ);
    for (let k = Math.max(0, i - pre); k < Math.min(NB, i + post); k++) {
      const w = k <= i ? smooth((k - (i - pre)) / pre) : 1 - smooth((k - i) / post);
      const B = BK[s.def][k]; B.bdW = B.bdW.clone().lerp(tgt, w).normalize();
    }
    // attacker's blade is stopped by the parry: hold its aim for a moment after contact, then release
    const hold = BK[s.att][i].bdW.clone();
    for (let k = i; k < Math.min(NB, i + 0.16 * HZ); k++) { const w = 1 - smooth((k - i) / (0.16 * HZ)); const B = BK[s.att][k]; B.bdW = B.bdW.clone().lerp(hold, w * 0.8).normalize(); }
  }
}

export async function init(world, rig) {
  W = world; FL = world.FLOOR; R = rig;
  const names = new Set([...PLAN.A, ...PLAN.B].map(s => s[0]));
  const vet = await fetch('/anim-test/mocap/fight20/vet.json').then(r => r.json()); Object.assign(VET, vet);
  await Promise.all([...names].map(async n => { CLIP[n] = await fetch(`/anim-test/mocap/fight20/${n}.json`).then(r => r.json()); }));
  buildWarp();
  baseTrack();
  for (const c of ['A', 'B']) smoothTrack(c, 0.03);
  spacing();
  for (const c of ['A', 'B']) feet(c);
  for (const c of ['A', 'B']) blades(c);
  parries();
  for (const c of ['A', 'B']) for (let i = 0; i < NB; i++) { const P = BK[c][i]; P.bd = bdLocal(P, P.bdW); P.wrist = 160; P.roll = 0; P.pelvis = null; }
  // contacts list for fight.js (sparks, sound): 'at' -> skip its clash solver
  for (const s of PLAN.sync) if (s.kind !== 'dodge') CLASHES.push({ t: sceneT(s.t), big: !!s.big, kind: s.kind === 'clash' ? 'blade' : 'hit', tau: s.t, s,
    at: (cast, blade) => { const t = sceneT(s.t); if (s.kind === 'clash') { const [a0, a1] = blade(s.att, t, [10, 24]), [b0, b1] = blade(s.def, t, [10, 24]); return a0.clone().lerp(a1, 0.55).lerp(b0.clone().lerp(b1, 0.5), 0.5).toArray(); }
      const [tip] = blade(s.att, t, [24]); return tip.toArray(); } });
  CLASHES.sort((a, b) => a.t - b.t);
  STEPS.sort((a, b) => a.t - b.t);
}
export function resim() {}

export function pose(c, t) {
  if (c === 'C') return { pos: [0, -200, 0], yaw: 0 };
  const x = Math.max(0, Math.min(NB - 1.001, act(t) * HZ)), i = Math.floor(x), u = x - i, a = BK[c][i], b = BK[c][i + 1] || a, p = {};
  for (const k of JK) p[k] = a[k].map((v, m) => lerp(v, wrapNear(b[k][m], v), u));
  p.pos = a.pos.map((v, m) => lerp(v, b.pos[m], u)); p.yaw = lerp(a.yaw, wrapNear(b.yaw, a.yaw), u);
  const d = a.bdW.clone().lerp(b.bdW, u).normalize(); p.bd = bdLocal(p, d); p.wrist = 160; p.roll = 0;
  if (a.ik || b.ik) { p.ik = {}; for (const s of ['r', 'l']) { const A = a.ik?.[s], Bk = b.ik?.[s];
      if (A && Bk) p.ik[s] = A.map((v, m) => lerp(v, Bk[m], u)); else if (A || Bk) p.ik[s] = (u < 0.5 ? A : Bk) || null;
      p.ik['w' + s] = Math.min(a.ik?.['w' + s] ?? 0, b.ik?.['w' + s] ?? 0);
      if (!p.ik[s]) delete p.ik[s]; else p.ik[s + 'Pole'] = lerp(a.ik?.[s + 'Pole'] ?? b.ik?.[s + 'Pole'] ?? 0, b.ik?.[s + 'Pole'] ?? a.ik?.[s + 'Pole'] ?? 0, u); } }
  const o = c === 'A' ? 'B' : 'A', q = BK[o][i]; p.opp = [q.pos[0], W.floorAt(q.pos[0], q.pos[2]), q.pos[2]];
  return p;
}
export function setContacts(c) { CONT = c; }
export function setGroundHits(g) { GHITS = g; }
export function events() {
  const swings = []; for (const s of PLAN.sync) if (s.kind !== 'dodge' || s.swing) swings.push([+sceneT(s.t - 0.06).toFixed(3), s.att]);
  for (const s of PLAN.whiffs || []) swings.push([+sceneT(s[0]).toFixed(3), s[1]]);
  return { steps: STEPS.map(s => [+s.t.toFixed(3), s.kind, +(s.sp || 0).toFixed(2), s.c, s.foot, s.sp > 2.5 ? 1 : 0]), slides: SLIDES, ghits: GHITS.map(g => +g.t.toFixed(3)),
    clashes: CONT.map(c => [+c.t.toFixed(3), c.big, c.kind]), swings: swings.sort((a, b) => a[0] - b[0]) };
}
export function blurOK() { return true; }
export function trailGate() { return 0.55; }

// ------------------------------------------------------------------ camera: calm tracking, a few cuts, never crosses the line
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
function mid(t, win = 0.6) { let x = 0, z = 0, n = 0; for (let d = -win; d <= win + 1e-6; d += win / 4) { const a = pose('A', Math.max(0, Math.min(TOTAL, t + d))).pos, b = pose('B', Math.max(0, Math.min(TOTAL, t + d))).pos; x += (a[0] + b[0]) / 2; z += (a[2] + b[2]) / 2; n++; } return v3(x / n, FL, z / n); }
let LINE = null;
function lineAt(t) {   // fight-line direction, heavily smoothed (no camera spinning)
  let x = 0, z = 0; for (let d = -1.2; d <= 1.2; d += 0.2) { const a = pose('A', Math.max(0, Math.min(TOTAL, t + d))).pos, b = pose('B', Math.max(0, Math.min(TOTAL, t + d))).pos; const L = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; x += (b[0] - a[0]) / L; z += (b[2] - a[2]) / L; }
  const L = Math.hypot(x, z) || 1; return v3(x / L, 0, z / L);
}
export function camera(t) {
  if (QS.get('qa')) { const m = mid(t, 0.3), L = lineAt(t), N = v3(-L.z, 0, L.x); return { pos: m.clone().addScaledVector(N, 6.2).add(v3(0, 1.3, 0)), look: m.clone().add(v3(0, 0.95, 0)), fov: 38, roll: 0, label: 'qa' }; }
  const shots = PLAN.shots; let s = shots[0]; for (const q of shots) if (t >= q[0]) s = q;
  const [t0, kind, o = {}] = s, t1 = (shots[shots.indexOf(s) + 1] || [TOTAL])[0], u = (t - t0) / Math.max(0.01, t1 - t0);
  const m = mid(t), L = lineAt(t), N = v3(-L.z, 0, L.x).multiplyScalar(PLAN.camSide || 1);
  const dist = lerp(o.d0 ?? 7, o.d1 ?? o.d0 ?? 7, smooth(u)), h = lerp(o.h0 ?? 1.4, o.h1 ?? o.h0 ?? 1.4, smooth(u)), ang = lerp(o.a0 ?? 0, o.a1 ?? o.a0 ?? 0, smooth(u)) * D2R;
  const dir = N.clone().multiplyScalar(Math.cos(ang)).addScaledVector(L, Math.sin(ang));
  const pos = m.clone().addScaledVector(dir, dist).add(v3(0, h, 0)), look = m.clone().add(v3(0, o.lookH ?? 1.0, 0)).addScaledVector(L, o.lookL ?? 0);
  return { pos, look, fov: lerp(o.f0 ?? 38, o.f1 ?? o.f0 ?? 38, smooth(u)), roll: 0, label: kind };
}

// ------------------------------------------------------------------ restrained effects (deterministic from the events)
function rnd(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
export function effects(t, cam) {
  const fx = { add: [], soft: [], flares: [], rings: [], debris: [], flash: 0, black: 0, ca: 0, impact: 0, bloomBoost: 0, sparkLight: { i: 0, p: [0, 0, 0] } };
  for (const [ci, c] of CONT.entries()) {
    const d = t - c.t; if (d < -0.01 || d > 0.7 || !c.p) continue;
    const big = c.big, r = rnd(ci + 3);
    if (c.kind === 'blade') {
      if (d < 0.12) fx.flares.push({ p: c.p, s: (big ? 0.75 : 0.5) * (1 - d / 0.12) + 0.08, a: 0.85 * (1 - d / 0.12), rot: r() * 3 });
      fx.sparkLight = { i: Math.max(fx.sparkLight.i, (big ? 3 : 2) * Math.exp(-d * 18)), p: c.p };
      fx.bloomBoost = Math.max(fx.bloomBoost, 0.12 * Math.exp(-d * 14));
      const n = big ? 26 : 16;
      for (let k = 0; k < n; k++) { const sp = 2.5 + r() * 4, th = r() * 6.283, ph = (r() - 0.3) * 1.4, life = 0.18 + r() * 0.25; if (d > life) { r(); continue; }
        const vx = Math.cos(th) * Math.cos(ph) * sp, vy = Math.sin(ph) * sp + 1, vz = Math.sin(th) * Math.cos(ph) * sp;
        fx.add.push({ p: [c.p[0] + vx * d, c.p[1] + vy * d - 4.9 * d * d, c.p[2] + vz * d], c: [1.0, 0.75, 0.42], s: 0.045 * (1 - d / life) + 0.01, a: 1 - d / life }); }
    } else {   // body hit: a small puff of sand-coloured dust at the impact, no blood, no flash
      for (let k = 0; k < 14; k++) { const life = 0.35 + r() * 0.3; if (d > life) { r(); r(); continue; } const th = r() * 6.283, sp = 0.6 + r() * 1.2;
        fx.soft.push({ p: [c.p[0] + Math.cos(th) * sp * d, c.p[1] + 0.3 * d, c.p[2] + Math.sin(th) * sp * d], c: [0.92, 0.86, 0.74], s: 0.18 + d * 0.5, a: 0.35 * (1 - d / life) }); }
    }
  }
  for (const [si, s] of STEPS.entries()) {   // dust at landings and hard plants only
    const d = t - s.t; if (d < 0 || d > 0.8 || (s.kind !== 'land' && s.sp < 3.2)) continue; const r = rnd(si + 101), n = s.kind === 'land' ? 26 : 8;
    for (let k = 0; k < n; k++) { const life = 0.5 + r() * 0.3, th = r() * 6.283, sp = (s.kind === 'land' ? 1.6 : 0.8) * (0.5 + r()); if (d > life) continue;
      fx.soft.push({ p: [s.p[0] + Math.cos(th) * sp * d, s.p[1] + 0.05 + 0.25 * d, s.p[2] + Math.sin(th) * sp * d], c: [0.86, 0.78, 0.62], s: 0.16 + d * 0.45, a: 0.3 * (1 - d / life) }); }
  }
  return fx;
}
