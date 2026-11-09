// NewGen studio engine: beat script -> generated motion on rig2 (no mocap, no clips).
// Contact first: every attack is built backwards from WHERE and WHEN its blade must land (opponent's blade, body, or the
// spot the dodger just left). Timing/mechanics come from style.js (the studies). Everything is precomputed at HZ and
// sampled by pose(c, t); the page applies it with rig2.applyPose (hand IK in the root frame: hRw/bdR).
import { POWER, CHAIN, PLANT_BEFORE, DROP_LAG, MAX_DROP, IDLE_SINK, BLADE_LEN, SWEET, GAP, BODY_R, KNOCK, RECOIL,
  BLOCK_PUSH, BLOCK_LOCK, IDLE, STANCE, GAIT, DIRS } from './style.js';

const HZ = 120, D2R = Math.PI / 180, R2D = 180 / Math.PI;
const P0 = [-0.14, 1.30, 0.02];                  // swing pivot (root frame): upper chest, toward the sword side
const GUARD_H = [-0.20, 1.06, 0.36], GUARD_B = [0.22, 0.80, 0.56];   // guard: hand in front, blade up and forward (REF)
const GUARD_L = [0.16, 1.02, 0.26];
const LEG_L = 0.745;
const ARM = 0.555;                                // shoulder -> hand reach used for targets (rig chain 4 + 5.5 px = 0.59)
// right shoulder in the root frame for a given torso twist (deg, + = toward the character's left)
const shoulderR = tw => { const a = tw * D2R, x = -0.375, z = 0; return [x * Math.cos(a) + z * Math.sin(a), 1.375, -x * Math.sin(a) + z * Math.cos(a)]; };
// largest radius r so that P0 + u*r stays within arm reach of the shoulder
function reachR(u, tw) {
  const S = shoulderR(tw), w = [P0[0] - S[0], P0[1] - S[1], P0[2] - S[2]];
  const b = u[0] * w[0] + u[1] * w[1] + u[2] * w[2], c = w[0] * w[0] + w[1] * w[1] + w[2] * w[2] - ARM * ARM, disc = b * b - c;
  return disc > 0 ? Math.max(0.15, -b + Math.sqrt(disc)) : 0.15;
}

// ------------------------------------------------------------------ small math
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = a => Math.hypot(a[0], a[1], a[2]), nrm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, u) => a + (b - a) * u, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), sstep = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const ease = (u) => { u = clamp(u, 0, 1); return u * u * u * (u * (6 * u - 15) + 10); };   // smootherstep (C2)
function slerp3(a, b, u) {    // direction slerp
  a = nrm(a); b = nrm(b); const c = clamp(dot(a, b), -1, 1), w = Math.acos(c);
  if (w < 1e-4) return lerp3(a, b, u);
  const s = Math.sin(w); return add(mul(a, Math.sin((1 - u) * w) / s), mul(b, Math.sin(u * w) / s));
}
function arcPoint(c, A, B, u) {   // move a point around centre c from A to B (radius and direction interpolated)
  const da = sub(A, c), db = sub(B, c); const d = slerp3(da, db, u); return add(c, mul(d, lerp(len(da), len(db), u)));
}
const toLocal = (R, w) => { const c = Math.cos(R.yaw * D2R), s = Math.sin(R.yaw * D2R), dx = w[0] - R.x, dz = w[2] - R.z; return [c * dx - s * dz, w[1] - R.y, s * dx + c * dz]; };
const toWorld = (R, l) => { const c = Math.cos(R.yaw * D2R), s = Math.sin(R.yaw * D2R); return [R.x + c * l[0] + s * l[2], R.y + l[1], R.z - s * l[0] + c * l[2]]; };
const dirW = (R, l) => { const c = Math.cos(R.yaw * D2R), s = Math.sin(R.yaw * D2R); return [c * l[0] + s * l[2], l[1], -s * l[0] + c * l[2]]; };
const dirL = (R, w) => { const c = Math.cos(R.yaw * D2R), s = Math.sin(R.yaw * D2R); return [c * w[0] - s * w[2], w[1], s * w[0] + c * w[2]]; };
function gauss(arr, sigma, mask) {   // zero-phase Gaussian on a sampled channel (sigma in s); mask[i] = 0 keeps the raw value
  if (sigma <= 0) return arr; const r = Math.ceil(sigma * HZ * 3), k = []; let ks = 0;
  for (let i = -r; i <= r; i++) { const w = Math.exp(-0.5 * (i / (sigma * HZ)) ** 2); k.push(w); ks += w; }
  const out = arr.slice();
  for (let i = 0; i < arr.length; i++) { if (mask && !mask[i]) continue; let s = 0; for (let j = -r; j <= r; j++) s += arr[clamp(i + j, 0, arr.length - 1)] * k[j + r]; out[i] = s / ks; }
  return out;
}

// ------------------------------------------------------------------ build
export function build(script, world) {
  const floorAt = world.floorAt;
  const ids = Object.keys(script.cast);
  const fighters = ids.filter(k => script.cast[k].role !== 'crowd');
  const T = script.end || (Math.max(...script.beats.map(b => b.t)) + 1.6);
  const N = Math.ceil(T * HZ) + 1, tt = i => i / HZ;
  const warnings = [];
  const C = {}; for (const k of ids) C[k] = { opp: script.cast[k].target || fighters.find(o => o !== k), keys: [], bumps: [], segs: [], steps: [], drops: [], leans: [], air: [] };
  const pos = {}; for (const k of ids) { const s = script.cast[k].start || [0, 0]; pos[k] = [s[0], s[1]]; C[k].keys.push({ t: 0, p: [s[0], s[1]] }); }
  const lastT = {}; for (const k of ids) lastT[k] = 0;
  const beats = script.beats.slice().sort((a, b) => a.t - b.t);
  const contacts = [];

  // ---------------------------------------------------------------- pass 1: root plan (spacing, footwork, lunges, reactions)
  const d2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]), unit2 = (a, b) => { const d = d2(a, b) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
  const key = (k, t, p) => { if (t < lastT[k] - 1e-6) { warnings.push(`${k}: move at ${t.toFixed(2)} s overlaps the previous one (ends ${lastT[k].toFixed(2)})`); t = lastT[k]; }
    C[k].keys.push({ t, p: [p[0], p[1]] }); lastT[k] = t; pos[k] = [p[0], p[1]]; };
  const hold = (k, t) => key(k, Math.max(t, lastT[k]), pos[k]);
  const footwork = (k, t0, t1, to) => { hold(k, t0); key(k, Math.max(t1, t0 + 0.05), to); };
  for (const b of beats) {
    const who = b.who, act = b.do;
    if (['slash', 'overhead', 'rising', 'thrust', 'jump_attack', ...Object.keys(DIRS)].includes(act)) {
      const d = b.target || C[who].opp, pw = POWER[b.power || (act === 'jump_attack' ? 'heavy' : 'medium')];
      const vs = b.vs || 'hit', tc = b.t;
      const kind = vs === 'hit' ? 'hit' : (vs === 'block' || vs === 'parry' || vs === 'bind') ? 'clash' : vs === 'none' ? 'air' : 'whiff';
      const g = b.gap || (kind === 'hit' ? GAP.hit : kind === 'clash' ? GAP.clash : GAP.whiff);
      const lunge = act === 'jump_attack' ? (b.leap || 2.6) : pw.lunge * (act === 'thrust' ? 1.5 : 1);
      const tAnt = tc - pw.strike - pw.hold - pw.antic, tCk = tc - pw.strike - pw.hold;
      const dirAD = unit2(pos[who], pos[d]);
      const pd = pos[d];
      const paC = [pd[0] - dirAD[0] * g, pd[1] - dirAD[1] * g];                  // attacker root at contact
      const pre = [paC[0] - dirAD[0] * lunge, paC[1] - dirAD[1] * lunge];        // before the lunge / leap
      const far = d2(pos[who], pre);
      if (far > 0.08) {                                                          // close (or open) the distance first
        const speed = far > 2.6 ? 4.2 : far > 0.6 ? 2.4 : 1.7, dur = Math.max(far < 0.35 ? 0.18 : 0.3, far / speed);
        footwork(who, Math.max(lastT[who], tAnt - 0.05 - dur), tAnt - 0.05, pre);
        if (lastT[who] > tAnt + 0.15) warnings.push(`${who}: not enough time to get in range before ${tc.toFixed(2)} s (needs ${dur.toFixed(2)} s)`);
      } else hold(who, tAnt);
      if (act === 'jump_attack') { const ta = b.air || 0.7; hold(who, tc - ta); key(who, tc - 0.02, paC); C[who].air.push({ t0: tc - ta, t1: tc - 0.02, h: b.height || 1.35 }); }
      else { hold(who, tc - pw.strike - 0.06); key(who, tc + 0.05, [paC[0] + dirAD[0] * 0.03, paC[1] + dirAD[1] * 0.03]); }
      // lead foot steps in and plants just before contact (AGPT example: ~130 ms)
      if (act !== 'jump_attack' && lunge > 0.05) C[who].steps.push({ foot: 'lead', t1: tc - PLANT_BEFORE, dur: Math.max(0.16, pw.strike + 0.1) });
      C[who].drops.push({ tc, amt: act === 'jump_attack' ? MAX_DROP : pw.drop, w: pw.strike + 0.25, lag: DROP_LAG });
      C[who].segs.push({ type: act === 'thrust' ? 'thrust' : 'swing', t0: tAnt, tCk, tc, pw, dir: act === 'thrust' ? 0 : DIRS[b.dir] ?? DIRS[act] ?? (act === 'jump_attack' ? 90 : 0),
        tEnd: tc + pw.follow + pw.settle, kind, target: d, two: b.two ?? (b.power === 'heavy' || act === 'jump_attack'), act });
      lastT[who] = Math.max(lastT[who], tc + 0.05);
      // defender
      const dirDA = [-dirAD[0], -dirAD[1]];
      const ct = { t: tc, att: who, def: d, kind, vs, power: b.power || 'medium', big: b.power === 'heavy' || act === 'jump_attack', act };
      ct.impact = b.impact ?? (ct.big && kind !== 'whiff' && kind !== 'air');   // impact frame + hit-stop in the scene
      if (kind === 'hit') (C[who].passWin = C[who].passWin || []).push([tc - 0.12, tc + pw.follow]);   // a landed cut carries through
      contacts.push(ct);
      if (vs === 'hit') {
        hold(d, tc); const kb = (KNOCK[b.power || 'medium']) * (b.knock ?? 1);
        key(d, tc + 0.28 + kb * 0.35, [pd[0] + dirAD[0] * kb, pd[1] + dirAD[1] * kb]);
        C[d].segs.push({ type: 'hit', t0: tc, tc, tEnd: tc + 0.75 + kb * 0.4, power: b.power || 'medium', from: who });
        C[d].drops.push({ tc: tc + 0.12, amt: 0.05 + 0.1 * kb, w: 0.5, lag: 0 });
      } else if (vs === 'block' || vs === 'parry' || vs === 'bind') {
        // bind: blades lock and grind for b.bind seconds (both lean in, sparks), then both spring apart
        const pw2 = b.power || 'medium', bind = vs === 'bind' ? (b.bind || 0.7) : 0, pu = BLOCK_PUSH[pw2] * (bind ? 2.5 : 1);
        hold(d, tc + bind); key(d, tc + bind + BLOCK_LOCK[pw2], [pd[0] + dirAD[0] * pu, pd[1] + dirAD[1] * pu]);
        const quickDef = pw2 === 'quick' || pw2 === 'light';
        C[d].segs.push({ type: vs === 'parry' ? 'parry' : 'block', t0: tc - (vs === 'parry' ? 0.30 : quickDef ? 0.2 : 0.26), tc, tEnd: tc + bind + (quickDef ? 0.4 : 0.62), from: who, power: pw2, bind });
        C[d].drops.push({ tc: tc + 0.05, amt: bind ? 0.12 : 0.06, w: 0.35 + bind, lag: 0 });
        if (bind) { ct.bind = bind; ct.kind = 'clash';
          const sg = C[who].segs[C[who].segs.length - 1]; sg.bind = bind; sg.tEnd += bind;
          hold(who, tc + bind); key(who, tc + bind + 0.25, [paC[0] - dirAD[0] * pu, paC[1] - dirAD[1] * pu]);   // attacker springs back too
          C[who].drops.push({ tc: tc + 0.1, amt: 0.1, w: 0.3 + bind, lag: 0 }); }
      } else if (vs.startsWith('dodge') || vs === 'duck') {
        const side = vs === 'dodge_left' ? 1 : vs === 'dodge_right' ? -1 : 0;
        // defender's left (+x local) = rotate dirDA by +90 deg around y: forward (fx,fz) -> left (fz, -fx)
        const lft = [dirDA[1], -dirDA[0]];
        const mv = vs === 'duck' ? [0, 0] : side ? [lft[0] * side * 0.85, lft[1] * side * 0.85] : [-dirDA[0] * 0.8, -dirDA[1] * 0.8];
        hold(d, tc - 0.26); key(d, tc + 0.04, [pd[0] + mv[0], pd[1] + mv[1]]);
        C[d].segs.push({ type: 'dodge', t0: tc - 0.28, tc, tEnd: tc + 0.55, side, duck: vs === 'duck', back: !side && vs !== 'duck' });
        C[d].drops.push({ tc: tc - 0.02, amt: vs === 'duck' ? 0.36 : 0.1, w: 0.42, lag: 0 });
        ct.aim = [pd[0], pd[1]];                     // the attacker aims where the dodger was
      }
    } else if (act === 'approach' || act === 'retreat' || act === 'charge') {
      const d = b.target || C[who].opp, g = b.gap || (act === 'retreat' ? GAP.guard + 0.8 : GAP.guard);
      const dir = unit2(pos[d], pos[who]); const to = [pos[d][0] + dir[0] * g, pos[d][1] + dir[1] * g];
      const dist = d2(pos[who], to), dur = b.dur || Math.max(0.4, dist / (act === 'charge' ? 4.5 : act === 'retreat' ? 1.3 : 1.7));
      footwork(who, b.t, b.t + dur, to);
    } else if (act === 'circle') {
      const d = b.target || C[who].opp, ang = (b.angle ?? 45) * D2R, dur = b.dur || 1.2, n = 6;
      const c0 = pos[d], r0 = d2(c0, pos[who]), a0 = Math.atan2(pos[who][0] - c0[0], pos[who][1] - c0[1]);
      hold(who, b.t);
      for (let i = 1; i <= n; i++) { const a = a0 + ang * i / n; key(who, b.t + dur * i / n, [c0[0] + Math.sin(a) * r0, c0[1] + Math.cos(a) * r0]); }
    } else if (act === 'step') {
      const d = b.target || C[who].opp, f = unit2(pos[who], pos[d]), l = [f[1], -f[0]], s = b.by || [0, 0.5];   // [left, forward]
      footwork(who, b.t, b.t + (b.dur || 0.4), [pos[who][0] + l[0] * s[0] + f[0] * s[1], pos[who][1] + l[1] * s[0] + f[1] * s[1]]);
    } else if (act === 'move') {
      footwork(who, b.t, b.t + (b.dur || 1.0), b.to);
    } else if (act === 'cheer' || act === 'taunt' || act === 'guard' || act === 'idle' || act === 'kneel' || act === 'fall') {
      C[who].segs.push({ type: act, t0: b.t, tc: b.t, tEnd: b.t + (b.dur || 1.5) });
      if (act === 'kneel' || act === 'fall') C[who].drops.push({ tc: b.t + 0.3, amt: act === 'fall' ? 0.6 : 0.42, w: 0.6, lag: 0, holdTo: b.t + (b.dur || 1.5) });
    } else warnings.push(`unknown move "${act}" at ${b.t}`);
  }
  for (const k of ids) hold(k, T);

  // sample roots (smoothstep between keys = each move starts and stops softly; then a light zero-phase blur)
  const RX = {}, RZ = {};
  for (const k of ids) {
    const K = C[k].keys.slice().sort((a, b) => a.t - b.t), x = new Float64Array(N), z = new Float64Array(N);
    let j = 0;
    for (let i = 0; i < N; i++) { const t = tt(i); while (j < K.length - 2 && t > K[j + 1].t) j++;
      const a = K[j], c = K[Math.min(j + 1, K.length - 1)], u = c.t > a.t ? ease((t - a.t) / (c.t - a.t)) : 1;
      x[i] = lerp(a.p[0], c.p[0], u); z[i] = lerp(a.p[1], c.p[1], u); }
    RX[k] = gauss(Array.from(x), 0.03); RZ[k] = gauss(Array.from(z), 0.03);
  }
  // facing: toward the opponent, critically damped (turns lag ~80 ms)
  const YAW = {};
  for (const k of ids) {
    const o = C[k].opp, y = new Float64Array(N); let cur = null, vel = 0; const w = 1 / 0.08;
    for (let i = 0; i < N; i++) {
      let tgt = o ? Math.atan2(RX[o][i] - RX[k][i], RZ[o][i] - RZ[k][i]) * R2D : (script.cast[k].yaw || 0);
      if (cur === null) cur = tgt; while (tgt - cur > 180) tgt -= 360; while (tgt - cur < -180) tgt += 360;
      const acc = w * w * (tgt - cur) - 2 * w * vel; vel += acc / HZ; cur += vel / HZ; y[i] = cur;
    }
    YAW[k] = Array.from(y);
  }
  // ---------------------------------------------------------------- pass 1b: pelvis drop, jumps, footsteps (planted feet, IK)
  // done before the contacts, so contact geometry uses the real (sunk) root height
  const STEPS = [], LOW = {};
  for (const k of ids) {
    const drop = new Float64Array(N), jump = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const t = tt(i); let d = IDLE_SINK + Math.sin(2 * Math.PI * IDLE.shift[1] * t) * 0.006;
      for (const q of C[k].drops) { const c = q.tc + q.lag, x = (t - c) / q.w; let v = x < -1 || x > 1.6 ? 0 : x < 0 ? sstep(x + 1) : 1 - sstep(x / 1.6); if (q.holdTo && t > c && t < q.holdTo) v = 1; if (q.holdTo && t >= q.holdTo) v = 1 - sstep((t - q.holdTo) / 0.5); d += q.amt * v; }
      drop[i] = Math.min(d, MAX_DROP + 0.4);
      for (const a of C[k].air) if (t > a.t0 && t < a.t1) { const u = (t - a.t0) / (a.t1 - a.t0); jump[i] = a.h * 4 * u * (1 - u); }
    }
    // feet: lead = left for a right-hander
    const yawA = YAW[k], rx = RX[k], rz = RZ[k];
    const desired = (foot, i) => { const o = foot === 'l' ? STANCE.lead : STANCE.rear, R = { x: rx[i], z: rz[i], yaw: yawA[i], y: 0 }; const w = toWorld(R, [o[0], 0, o[1]]); return [w[0], w[2]]; };
    const F = { l: { p: desired('l', 0), sw: null, last: -1 }, r: { p: desired('r', 0), sw: null, last: -1 } };
    const forced = C[k].steps.map(s => ({ ...s, foot: s.foot === 'lead' ? 'l' : 'r', done: false }));
    const fl = { l: [], r: [] };
    for (let i = 0; i < N; i++) {
      const t = tt(i), air = jump[i] > 0.02;
      if (i > 0 && jump[i - 1] > 0.02 && !air) for (const f of ['l', 'r']) STEPS.push({ c: k, t, foot: f, p: [F[f].p[0], 0, F[f].p[1]], kind: 'land' });
      if (i > 0 && jump[i - 1] <= 0.02 && air) STEPS.push({ c: k, t, foot: 'r', p: [rx[i], 0, rz[i]], kind: 'takeoff' });
      for (const f of ['l', 'r']) {
        const st = F[f], o = f === 'l' ? 'r' : 'l';
        if (st.sw && t >= st.sw.t1) { st.p = st.sw.to; STEPS.push({ c: k, t, foot: f, p: [st.p[0], 0, st.p[1]], kind: st.sw.kind }); st.sw = null; st.last = t; }
        if (air) { const d = desired(f, i); st.p = d; st.sw = null; fl[f].push([d[0], jump[i] * 0.9, d[1], 0]); continue; }
        if (!st.sw) {
          const fs = forced.find(s => !s.done && s.foot === f && t >= s.t1 - s.dur);
          if (fs) { fs.done = true; const j = Math.min(N - 1, Math.round(fs.t1 * HZ)); st.sw = { t0: t, t1: fs.t1, from: st.p, to: desired(f, j), lift: 0.12, kind: 'step' }; }
          else {
            const sp = Math.hypot(rx[Math.min(N - 1, i + 6)] - rx[i], rz[Math.min(N - 1, i + 6)] - rz[i]) * HZ / 6;
            const os = F[o].sw, oProg = os ? (t - os.t0) / (os.t1 - os.t0) : 1;
            // walking keeps double support; at speed the next foot may leave before the other lands (flight phase)
            const free = (!os && t - F[o].last > 0.03) || (os && sp > 1.0 && oProg > 0.62);
            const look = Math.min(N - 1, i + Math.round(0.1 * HZ)), d = desired(f, look), e = Math.hypot(d[0] - st.p[0], d[1] - st.p[1]);
            if (free && e > (sp > 0.3 ? 0.07 : 0.12)) {
              const gt = sp > 2.8 ? GAIT.run : sp > 0.3 ? GAIT.walk : GAIT.shuffle;
              const dur = sp > 2.8 ? gt.dur : sp > 0.3 ? clamp(0.34 - sp * 0.06, 0.2, 0.3) : gt.dur, j = Math.min(N - 1, i + Math.round(dur * HZ));
              const dd = desired(f, j), lead = [(rx[j] - rx[i]) * 0.6, (rz[j] - rz[i]) * 0.6];      // land ahead of the body
              st.sw = { t0: t, t1: t + dur, from: st.p, to: [dd[0] + lead[0], dd[1] + lead[1]], lift: gt.lift, kind: 'step' };
            }
          }
        }
        let p = st.p, h = 0;
        if (st.sw) { const u = (t - st.sw.t0) / (st.sw.t1 - st.sw.t0); p = lerp3([st.sw.from[0], 0, st.sw.from[1]], [st.sw.to[0], 0, st.sw.to[1]], ease(u)); p = [p[0], p[2]]; h = st.sw.lift * Math.sin(Math.PI * clamp(u, 0, 1)); }
        fl[f].push([p[0], h, p[1], st.sw ? 0 : 1]);
      }
    }
    // root height: floor + jump - drop, lowered further if a planted foot would be out of leg reach
    const ry = [];
    for (let i = 0; i < N; i++) {
      const y0 = floorAt(rx[i], rz[i]) + jump[i] - Math.min(drop[i], MAX_DROP + 0.4); let y = y0;
      const R = { x: rx[i], z: rz[i], yaw: yawA[i], y: 0 };
      for (const f of ['l', 'r']) { const hip = toWorld(R, [f === 'l' ? 0.125 : -0.125, 0, 0]), q = fl[f][i], dx = hip[0] - q[0], dz = hip[2] - q[2], fy = floorAt(q[0], q[2]) + q[1];
        const hmax = Math.sqrt(Math.max(0.01, LEG_L * LEG_L - dx * dx - dz * dz)); if (y + 0.75 - fy > hmax) y = fy + hmax - 0.75; }
      ry.push(Math.max(y, y0 - 0.1));          // reach may sink the body a little, never into a kneel
    }
    LOW[k] = { ry: gauss(ry, 0.02), feet: fl, drop: Array.from(drop) };
  }
  const at = (arr, t) => { const f = clamp(t * HZ, 0, N - 1), i = Math.floor(f), u = f - i; return lerp(arr[i], arr[Math.min(i + 1, N - 1)], u); };
  const rootAt = (k, t) => ({ x: at(RX[k], t), z: at(RZ[k], t), y: at(LOW[k].ry, t), yaw: at(YAW[k], t) });

  // ---------------------------------------------------------------- pass 2: contacts (world points) and swing geometry
  const H_OF = { 0: 1.28, 40: 1.38, 140: 1.38, 90: 1.52, 180: 1.25, 270: 1.05, 320: 1.15, 220: 1.15 };
  for (const ct of contacts) {
    const seg = C[ct.att].segs.find(s => s.tc === ct.t && (s.type === 'swing' || s.type === 'thrust'));
    const RA = rootAt(ct.att, ct.t), RD = rootAt(ct.def, ct.t);
    const hgt = seg.type === 'thrust' ? 1.18 : (H_OF[seg.dir] ?? 1.3);
    const toA = nrm([RA.x - RD.x, 0, RA.z - RD.z]);
    let Cw;
    if (ct.kind === 'hit') Cw = [RD.x + toA[0] * BODY_R, RD.y + hgt, RD.z + toA[2] * BODY_R];
    else if (ct.kind === 'clash') {
      const gap = Math.hypot(RA.x - RD.x, RA.z - RD.z), side = dirW(RA, [-1, 0, 0]);   // incoming side = attacker's right for a forehand
      const sgn = seg.type === 'thrust' ? 0 : Math.cos(seg.dir * D2R) >= 0 ? 1 : -1;
      Cw = [RA.x - toA[0] * gap * 0.5 + side[0] * 0.16 * sgn, RD.y + hgt + 0.05, RA.z - toA[2] * gap * 0.5 + side[2] * 0.16 * sgn];
    } else if (ct.kind === 'whiff') { const p = ct.aim; Cw = [p[0] + toA[0] * BODY_R, RD.y + hgt, p[1] + toA[2] * BODY_R]; }
    else Cw = toWorld(RA, [0, hgt, 1.7]);
    ct.p = Cw;
    // attacker swing geometry (root frame at contact)
    const c = toLocal(RA, Cw), v = sub(c, P0), D = len(v), u = nrm(v);
    const twC = clamp(Math.atan2(u[0], Math.max(0.05, u[2])) * R2D * seg.pw.twist * (seg.type === 'thrust' ? 0.5 : 1), -55, 55);
    let r = Math.min(clamp(D - SWEET * BLADE_LEN, 0.3, 0.7), reachR(u, twC)), sb = D - r;
    if (sb > 0.97 * BLADE_LEN || sb < 0.25) warnings.push(`${ct.att} at ${ct.t.toFixed(2)} s: contact ${D.toFixed(2)} from the pivot is ${sb > 0.97 * BLADE_LEN ? 'out of' : 'inside'} blade reach`);
    // upward swings come up beside the sword-side leg, never straight through "blade pointing down" (heading undefined
    // there -> flips): keep at least ~35 deg of sideways travel
    if (seg.type === 'swing') { const dd = ((seg.dir % 360) + 360) % 360; if (dd > 235 && dd < 305) seg.dir = dd < 262 ? 235 : 305; }
    const left = nrm(sub([1, 0, 0], mul(u, u[0])));
    const down = nrm(sub(sub([0, -1, 0], mul(u, -u[1])), mul(left, dot([0, -1, 0], left))));
    const m = nrm(add(mul(left, Math.cos(seg.dir * D2R)), mul(down, Math.sin(seg.dir * D2R))));
    Object.assign(seg, { u, m, r, sb, D, Cw });
    ct.bladeDirW = dirW(RA, u); ct.travelW = dirW(RA, m);
  }

  // ---------------------------------------------------------------- pass 3: per-sample hand + body channels from segments
  const OUT = {};
  for (const k of ids) {
    const ch = { hx: [], hy: [], hz: [], bx: [], by: [], bz: [], lx: [], ly: [], lz: [], twW: [], twC: [], lean: [], side: [], hdY: [], hdP: [], two: [], yawOff: [], tiltP: [], tiltR: [] };
    const segs = C[k].segs.slice().sort((a, b) => a.t0 - b.t0);
    const ph = (k.charCodeAt(0) * 1.37) % 6.28;
    const guardAt = t => {
      const br = Math.sin(2 * Math.PI * IDLE.bob[1] * t + ph) * IDLE.bob[0];
      return { H: [GUARD_H[0], GUARD_H[1] + br, GUARD_H[2]], B: GUARD_B };
    };
    // a swing's arc parameter s(t) (deg; 0 = contact) and the hand/blade it gives
    const swingS = (s, t) => {
      const pw = s.pw, tS = s.tc - pw.strike, vC = 1.3 * (pw.wind + 6) / pw.strike, tau = pw.follow / 3;
      const foll = Math.min(150, vC * tau);
      const clash = s.kind === 'clash';
      if (t < s.tCk) return { ph: 'antic', u: ease((t - s.t0) / (s.tCk - s.t0)), s: -pw.wind };
      if (t < tS) return { ph: 'hold', s: -pw.wind - 6 * sstep((t - s.tCk) / Math.max(1e-3, tS - s.tCk)) };
      if (t < s.tc) { const u = (t - tS) / pw.strike; return { ph: 'strike', s: -(pw.wind + 6) + (pw.wind + 6) * Math.pow(u, 1.3) }; }
      const bnd = s.bind || 0, dt0 = t - s.tc;
      if (clash && dt0 < bnd) return { ph: 'follow', s: 3 * Math.sin(dt0 * 38) * Math.min(1, dt0 / 0.08) + 2 * sstep(dt0 / bnd) };   // blades grinding in the bind
      const dt = dt0 - bnd;
      if (clash) { const rb = 14 * Math.exp(-dt / 0.06) * Math.sin(dt / 0.05) - (bnd ? 22 : 10) * sstep(dt / 0.2); return { ph: dt < pw.follow ? 'follow' : 'settle', s: rb, u: sstep((dt - pw.follow * 0.6) / pw.settle) }; }
      const sF = foll * (1 - Math.exp(-dt / tau));
      if (dt < pw.follow) return { ph: 'follow', s: sF };
      return { ph: 'settle', s: foll * (1 - Math.exp(-pw.follow / tau)), u: ease((dt - pw.follow) / pw.settle) };
    };
    const arcHB = (sg, sdeg) => {
      const a = sdeg * D2R, dir = nrm(add(mul(sg.u, Math.cos(a)), mul(sg.m, Math.sin(a))));
      let rr = lerp(sg.r, 0.42, clamp(-sdeg / sg.pw.wind, 0, 1)) - 0.06 * clamp(sdeg / 90, 0, 1);
      const az = Math.atan2(dir[0], Math.max(0.05, dir[2])) * R2D;
      rr = Math.min(rr, reachR(dir, clamp(az * sg.pw.twist, -55, 55)));
      return { H: add(P0, mul(dir, rr)), B: dir };
    };
    const thrustHB = (sg, t) => {   // hand pulled back by the hip, then driven straight along u
      const pw = sg.pw, back = add(P0, add(mul(sg.u, 0.24), [-0.12, -0.18, -0.12])), hit = add(P0, mul(sg.u, sg.r)), tS = sg.tc - pw.strike;
      if (t < tS) return { H: back, B: nrm(add(sg.u, [0, 0.05, 0])), ph: t < sg.tCk ? 'antic' : 'hold', u: ease((t - sg.t0) / (sg.tCk - sg.t0)) };
      if (t < sg.tc) { const u = Math.pow((t - tS) / pw.strike, 1.4); return { H: lerp3(back, hit, u), B: sg.u, ph: 'strike' }; }
      const dt = t - sg.tc, ext = add(hit, mul(sg.u, 0.06 * (1 - Math.exp(-dt / 0.06)) * (sg.kind === 'clash' ? -1 : 1)));
      if (dt < pw.follow) return { H: ext, B: sg.u, ph: 'follow' };
      return { H: ext, B: sg.u, ph: 'settle', u: ease((dt - pw.follow) / pw.settle) };
    };
    // block/parry hand: blade crossing the attacker's at the contact point
    for (const s of segs) if (s.type === 'block' || s.type === 'parry') {
      const ct = contacts.find(c => c.def === k && c.t === s.tc); if (!ct) continue;
      // search reachable hand spots: the blade from the hand through C must reach (<= 90 % of the blade), cross the
      // attacker's blade as square as possible, and stay in front of the body with the tip up-ish (REF guard/block)
      const R = rootAt(k, s.tc), c = toLocal(R, ct.p), ba = dirL(R, ct.bladeDirW);
      let best = null;
      for (let az = -80; az <= 60; az += 5) for (let el = -35; el <= 55; el += 5) {
        const tw = clamp(az * 0.35, -30, 30), dir = [Math.sin(az * D2R) * Math.cos(el * D2R), Math.sin(el * D2R), Math.cos(az * D2R) * Math.cos(el * D2R)];
        const H = add(P0, mul(dir, Math.min(0.5, reachR(dir, tw)))); if (H[2] < 0.12 || H[1] < 0.75) continue;
        const v = sub(c, H), sl = len(v), bd = nrm(v); if (sl > 0.9 * BLADE_LEN || sl < 0.35) continue;
        const cr = len(cross(bd, ba)), sc = cr + 0.25 * bd[1] - 0.4 * Math.abs(sl / BLADE_LEN - 0.55);
        if (!best || sc > best.sc) best = { H, bd, sc, tw };
      }
      if (!best) { warnings.push(`${k} at ${s.tc.toFixed(2)} s: no reachable block for the contact`); best = { H: GUARD_H, bd: GUARD_B, tw: 0 }; }
      s.H = best.H; s.B = best.bd; s.tw = best.tw; s.push = dirL(R, ct.travelW);
    }
    let cur = { H: GUARD_H.slice(), B: GUARD_B.slice() }, active = null, startHB = null;
    for (let i = 0; i < N; i++) {
      const t = tt(i), g = guardAt(t);
      // newest action wins (a hit or a new attack interrupts whatever was still settling)
      const sg = segs.filter(s => t >= s.t0 && t < s.tEnd && ['swing', 'thrust', 'block', 'parry', 'hit', 'dodge', 'cheer', 'taunt', 'kneel', 'fall'].includes(s.type)).pop();
      if (sg !== active) { active = sg; startHB = { H: cur.H.slice(), B: cur.B.slice() }; }
      let H = g.H, B = g.B, tw = 0, lean = 4, side = 0, two = 0, yawOff = 0, tiltP = 0, tiltR = 0, hdP = 0, L = null;
      if (sg && (sg.type === 'swing' || sg.type === 'thrust')) {
        const ev = (tq) => sg.type === 'thrust' ? thrustHB(sg, tq) : (() => { const q = swingS(sg, tq); const hb = arcHB(sg, q.s); return { ...hb, ph: q.ph, u: q.u, s: q.s }; })();
        const q = ev(t);
        if (q.ph === 'antic') { const u = q.u; H = arcPoint(P0, startHB.H, q.H, u); B = slerp3(startHB.B, q.B, u); }
        else if (q.ph === 'settle') { H = arcPoint(P0, q.H, g.H, q.u); B = slerp3(q.B, g.B, q.u); }
        else { H = q.H; B = q.B; }
        // body chain: hips/waist lead, chest next, hand last (successive breaking)
        const azOf = tq => { const r = ev(clamp(tq, sg.t0, sg.tEnd - 1e-3)); let h = r.H; if (r.ph === 'antic') h = arcPoint(P0, startHB.H, r.H, r.u); else if (r.ph === 'settle') h = arcPoint(P0, r.H, g.H, r.u); return Math.atan2(h[0] - P0[0], Math.max(0.05, h[2] - P0[2])) * R2D; };
        const gain = sg.pw.twist * (sg.type === 'thrust' ? 0.5 : 1);
        tw = clamp(azOf(t + CHAIN.waist) * gain, -55, 55);
        const twc = clamp(azOf(t + CHAIN.chest) * gain, -55, 55);
        ch._twc = twc;
        const sl = sg.type === 'thrust' ? (q.ph === 'strike' || q.ph === 'follow' ? 1 : q.ph === 'settle' ? 1 - q.u : -0.3) : clamp((q.s ?? 0) >= 0 ? 1 - (q.s / 160) : 1 + (q.s / sg.pw.wind) * 1.35, -0.35, 1);
        const lw = q.ph === 'antic' ? q.u : q.ph === 'settle' ? 1 - q.u : 1;
        lean = 4 + lw * sl * (sg.pw === POWER.heavy ? 18 : sg.pw === POWER.medium ? 13 : 9) * (sg.dir === 90 ? 1.25 : 1);
        side = lw * Math.sin(sg.dir * D2R) * 0 + lw * (q.ph === 'strike' || q.ph === 'follow' ? -4 : 2) * Math.cos(sg.dir * D2R);
        two = sg.two ? lw : 0;
        if (C[k].air.length) for (const a of C[k].air) if (t > a.t0 - 0.1 && t < a.t1 + 0.1) {   // tuck back on the rise, pitch into the strike on the way down
          const u = clamp((t - a.t0) / (a.t1 - a.t0), 0, 1); tiltP = -10 * Math.sin(Math.min(1, u / 0.55) * Math.PI) + 16 * sstep((u - 0.55) / 0.45) * (1 - sstep((t - a.t1) / 0.1)); }
      } else if (sg && (sg.type === 'block' || sg.type === 'parry')) {
        const tIn = sg.tc - (sg.type === 'parry' ? 0.04 : 0.07), bnd = sg.bind || 0, dt0 = t - sg.tc, dt = Math.max(0, dt0 - bnd), pu = BLOCK_PUSH[sg.power] * (bnd ? 2.5 : 1.4);
        let Ht = sg.H, Bt = sg.B;
        if (sg.type === 'parry' && t < sg.tc) Ht = sub(sg.H, mul(sg.push, 0.1 * (1 - sstep((t - sg.t0) / (sg.tc - sg.t0)))));
        if (bnd && dt0 > 0 && dt0 < bnd) Ht = add(Ht, mul(sg.push, 0.012 * Math.sin(dt0 * 38)));            // grinding tremor in the bind
        const pushV = dt0 > bnd ? mul(sg.push, pu * (1 - Math.exp(-dt / 0.05)) * Math.exp(-dt / 0.35)) : [0, 0, 0];
        const hold2 = 0.22 + bnd, rel = Math.max(0.05, sg.tEnd - sg.tc - hold2);
        if (t < tIn) { const u = ease((t - sg.t0) / (tIn - sg.t0)); H = arcPoint(P0, startHB.H, Ht, u); B = slerp3(startHB.B, Bt, u); }
        else if (dt0 < hold2) { H = add(Ht, pushV); B = Bt; }
        else { const u = ease((dt0 - hold2) / rel); H = arcPoint(P0, add(Ht, pushV), g.H, u); B = slerp3(Bt, g.B, u); }
        const w = t < tIn ? ease((t - sg.t0) / (tIn - sg.t0)) : dt0 < hold2 ? 1 : 1 - ease((dt0 - hold2) / rel);
        tw = (sg.tw ?? -8) * w; lean = 4 - (dt > 0 ? 7 * Math.exp(-dt / 0.2) * (1 - Math.exp(-dt / 0.03)) : 0) + 3 * w; two = sg.power === 'heavy' ? w : 0.6 * w;
      } else if (sg && sg.type === 'hit') {
        const dt = t - sg.tc, rc = RECOIL[sg.power], env = (1 - Math.exp(-dt / 0.04)) * Math.exp(-dt / 0.38);
        const ct = contacts.find(c => c.def === k && c.t === sg.tc), R = rootAt(k, sg.tc);
        const tr = ct ? dirL(R, ct.travelW) : [1, 0, 0];
        lean = 4 - rc * env; tw = clamp(-tr[0] * rc * 1.2, -40, 40) * env; side = tr[0] * 10 * env; hdP = -rc * 0.6 * (1 - Math.exp(-Math.max(0, dt - 0.05) / 0.04)) * Math.exp(-Math.max(0, dt - 0.05) / 0.3);
        const fl = mul([-0.1 + tr[0] * 0.2, 0.22, -0.18], env); H = add(g.H, fl); B = slerp3(g.B, [0.3, 0.9, -0.2], env);
        if (startHB && dt < 0.06) { const u = dt / 0.06; H = lerp3(startHB.H, H, u); }
        L = add(GUARD_L, mul([0.12, 0.28, -0.2], env));
        yawOff = -tr[0] * 12 * env;
      } else if (sg && sg.type === 'dodge') {
        const w = Math.sin(clamp((t - sg.t0) / (sg.tEnd - sg.t0), 0, 1) * Math.PI);
        lean = sg.duck ? 4 + 24 * w : sg.back ? 4 - 10 * w : 4; side = sg.side * -16 * w; tiltR = sg.side * 6 * w;
        H = add(g.H, [0, 0.12 * w, -0.05 * w]);
      } else if (sg && (sg.type === 'cheer' || sg.type === 'taunt')) {
        const w = sstep((t - sg.t0) / 0.3) * (1 - sstep((t - sg.tEnd + 0.3) / 0.3)), bob = Math.sin((t - sg.t0) * 2 * Math.PI * 1.6);
        H = lerp3(g.H, [-0.3, 1.95 + 0.06 * bob, 0.15], w); B = slerp3(g.B, [0, 1, 0.1], w);
        if (sg.type === 'cheer') L = lerp3(GUARD_L, [0.3, 1.95 - 0.06 * bob, 0.15], w);
        lean = 4 - 6 * w;
      } else if (sg && (sg.type === 'kneel' || sg.type === 'fall')) {
        const w = sstep((t - sg.t0) / 0.4); lean = 4 + 20 * w; H = lerp3(g.H, [-0.25, 0.55, 0.35], w); B = slerp3(g.B, [0, -0.6, 0.8], w); hdP = 18 * w;
      }
      // two-handed grip: the left hand sits on the hilt below the right, if it can reach
      if (!L) { const grip = sub(H, mul(B, 0.13)); L = lerp3(lerp3(GUARD_L, add(GUARD_L, [-0.05 * tw / 30, 0, -0.08 * Math.abs(tw) / 30]), 1), grip, two); }
      // the blade tip never asks to go into the ground: lift the direction just enough (smooth, keeps its heading),
      // otherwise the rig's floor collision shoves it and the blade flips (rising swings' low wind-up)
      { const bn = nrm(B), tipY = H[1] + bn[1] * BLADE_LEN, minY = 0.22;
        if (tipY < minY) { const ny = clamp((minY - H[1]) / BLADE_LEN, -1, 1), hz = Math.hypot(bn[0], bn[2]) || 1e-6, sc = Math.sqrt(Math.max(0, 1 - ny * ny)) / hz; B = [bn[0] * sc, ny, bn[2] * sc]; } }
      // idle life layered on top (breath, sway)
      const br = Math.sin(2 * Math.PI * IDLE.breath[1] * t + ph) * IDLE.breath[0], sw = Math.sin(2 * Math.PI * IDLE.sway[1] * t + ph * 1.7) * IDLE.sway[0];
      cur = { H, B };
      ch.hx.push(H[0]); ch.hy.push(H[1]); ch.hz.push(H[2]); const Bn = nrm(B); ch.bx.push(Bn[0]); ch.by.push(Bn[1]); ch.bz.push(Bn[2]);
      ch.lx.push(L[0]); ch.ly.push(L[1]); ch.lz.push(L[2]);
      const twc = ch._twc ?? tw; ch._twc = undefined;
      ch.twW.push(tw * 0.55); ch.twC.push((twc - tw * 0.55) + 0); ch.lean.push(lean + br); ch.side.push(side); ch.hdY.push(-(tw + (twc - tw * 0.55)) * 0.7 + sw); ch.hdP.push(hdP - br * 0.6);
      ch.two.push(two); ch.yawOff.push(yawOff); ch.tiltP.push(tiltP); ch.tiltR.push(tiltR);
    }
    // soften blends between segments; keep strike windows raw so the swing speed survives
    const mask = new Uint8Array(N).fill(1);
    for (const s of segs) if (s.type === 'swing' || s.type === 'thrust') for (let i = Math.floor((s.tc - s.pw.strike - 0.02) * HZ); i <= Math.ceil((s.tc + 0.05) * HZ); i++) if (i >= 0 && i < N) mask[i] = 0;
    for (const key2 of ['hx', 'hy', 'hz', 'bx', 'by', 'bz']) ch[key2] = gauss(ch[key2], 0.018, mask);
    for (const key2 of ['lx', 'ly', 'lz', 'twW', 'twC', 'lean', 'side', 'hdY', 'hdP', 'two', 'yawOff', 'tiltP', 'tiltR']) ch[key2] = gauss(ch[key2], 0.025);
    OUT[k] = ch;
  }

  // ---------------------------------------------------------------- sampler
  const sample = (arr, f) => { const i = Math.floor(f), u = f - i; return lerp(arr[i], arr[Math.min(i + 1, N - 1)], u); };
  function pose(k, t) {
    const f = clamp(t * HZ, 0, N - 1), ch = OUT[k], s = a => sample(a, f);
    const o = C[k].opp, i0 = Math.floor(f), i1 = Math.min(i0 + 1, N - 1), u = f - i0;
    const ft = side => { const a = LOW[k].feet[side][i0], b = LOW[k].feet[side][i1]; const x = lerp(a[0], b[0], u), z = lerp(a[2], b[2], u), h = lerp(a[1], b[1], u); return [x, floorAt(x, z) + h, z]; };
    const yaw = s(YAW[k]) + s(ch.yawOff);
    const P = {
      pos: [s(RX[k]), s(LOW[k].ry), s(RZ[k])], yaw, tilt: [s(ch.tiltP), s(ch.tiltR)],
      waist: [s(ch.lean) * 0.45, s(ch.twW), s(ch.side) * 0.5], chest: [s(ch.lean) * 0.55, s(ch.twC), s(ch.side) * 0.5], head: [s(ch.hdP) - s(ch.lean) * 0.6, s(ch.hdY), 0],
      hRw: [s(ch.hx), s(ch.hy), s(ch.hz)], bdR: [s(ch.bx), s(ch.by), s(ch.bz)], hLw: [s(ch.lx), s(ch.ly), s(ch.lz)],
      ik: { r: ft('r'), l: ft('l'), rPole: -18, lPole: 12 },
    };
    if (o && !(C[k].passWin || []).some(([a, b]) => t > a && t < b)) P.opp = [s(RX[o]), s(LOW[o].ry), s(RZ[o])];
    return P;
  }
  // swing timing for sound/fx: strike start (whoosh) and contact per attack
  const swings = []; for (const k of ids) for (const s of C[k].segs) if (s.type === 'swing' || s.type === 'thrust') swings.push({ c: k, t0: s.tc - s.pw.strike, tc: s.tc, power: s.pw === POWER.heavy ? 'heavy' : s.pw === POWER.light ? 'light' : 'medium', act: s.act, kind: s.kind });
  const jumps = []; for (const k of ids) for (const a of C[k].air) jumps.push({ c: k, t0: a.t0, t1: a.t1, h: a.h });
  return { pose, T, contacts, warnings, steps: STEPS, swings: swings.sort((a, b) => a.t0 - b.t0), jumps, ids, fighters, root: (k, t) => ({ x: sample(RX[k], clamp(t * HZ, 0, N - 1)), z: sample(RZ[k], clamp(t * HZ, 0, N - 1)) }), segs: Object.fromEntries(ids.map(k => [k, C[k].segs])) };
}
