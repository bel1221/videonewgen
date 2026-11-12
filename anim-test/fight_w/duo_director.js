// DUO 40 director (2 v 2, fight4.js): everything that crosses the two duels. Times are ANIMATION seconds and must match
// parts/duo_shared.js (T_SHOVE, T_XNOCK/T_XLOOSE/T_XHIT, XHIT_ALONG). Duel 1 = Blinkblade (A) vs Boltspear (B); duel 2 = Jingu Bang (A)
// vs Seekerbow (B). Blue team = duel 1 A + duel 2 B; red team = duel 1 B + duel 2 A.
import * as THREE from 'three';
export const TOTAL = 37.3;
const T_SHOVE = 19.05, T_XNOCK = 27.5, T_XLOOSE = 28.19, T_XHIT = 28.3, XHIT_ALONG = 9, T_OUTRO = 33.9;
// slow motion on the two close calls: the spear at the sword's face, and the plunge the arrow stops. 2 x 0.45 s at 1/4 speed = +2.7 s -> 40.0 s
export const SLOWMO = [[14.86, 15.31, 0.25], [28.02, 28.47, 0.25]];
export const EVENTS = [{ t: 14.86, kind: 'slowmo_in' }, { t: 15.31, kind: 'slowmo_out' }, { t: 28.02, kind: 'slowmo_in' }, { t: 28.47, kind: 'slowmo_out' }, { t: T_SHOVE, kind: 'shove' }, { t: T_XHIT, kind: 'disarm' }, { t: T_OUTRO, kind: 'outro' }, { t: 27.2, kind: 'fall' }, { t: 30.45, kind: 'fall' }];
// the spear is knocked out of duel 1 B's hands by the archer's arrow: it spins away from the shot and lands on the sand
export const DISARM = [{ duel: 1, k: 'B', t: T_XHIT, v: [2.3, 3.6, -3.4], spin: 10, mid: 2, axis: [0.4, 0.2, 1] }];

const v3 = (x, y, z) => new THREE.Vector3(x, y, z), clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), io = u => u * u * (3 - 2 * u);
let XT = null;   // world point the cross-duel arrow hits (on the spear), fixed at init
export function init(ctx) { XT = ctx.DUELS[0].blade('B', T_XHIT, [XHIT_ALONG])[0].clone(); console.warn('XTARGET', JSON.stringify(XT.toArray().map(v => +v.toFixed(2)))); }
export function arrowTarget(a, ctx) { return XT.clone(); }
// the archer (duel 2 B) aims his bow arm at that point instead of at his own opponent while he takes the shot
export function poseHook(duel, k, t, p, ctx) {
  if (duel === 2 && k === 'B' && XT && t > T_XNOCK - 0.3 && t < T_XHIT + 0.45) { const w = io(clamp(Math.min((t - (T_XNOCK - 0.3)) / 0.3, (T_XHIT + 0.45 - t) / 0.3)));
    const tg = [XT.x, XT.y - 1.3, XT.z]; p.opp = p.opp.map((v, i) => v + (tg[i] - v) * w); }
  return p;
}

// ------------------------------------------------------------------ camera
// [t0, type, options]. Duel shots ('side', 'wide', 'low', 'three4') look at one duel from OUTSIDE (the side away from the other duel),
// fixed at the start of the shot so the camera does not swing when the fighters circle.
const SHOTS = [
  [0.0, 'team', { team: 0 }], [1.85, 'team', { team: 1 }], [3.35, 'wide4', {}],
  [4.15, 'side', { duel: 1, d: 6.0, h: 1.3 }], [5.2, 'side', { duel: 2, d: 6.2, h: 1.4 }], [6.9, 'three4', { duel: 1 }], [8.3, 'side', { duel: 2, d: 7.0, h: 1.5 }],
  [9.6, 'wide', { duel: 1, d: 7.4 }], [11.5, 'low', { duel: 2, d: 4.6, look: 1.3 }], [12.4, 'wide4', { far: 1 }], [13.5, 'side', { duel: 2, d: 6.2, h: 1.3 }],
  [14.6, 'low', { duel: 1, d: 3.3, look: 1.45, roll: 0.05, fov: 44 }], [15.4, 'side', { duel: 1, d: 6.0, h: 1.2 }], [16.75, 'three4', { duel: 2 }], [18.35, 'shove', {}],
  [20.2, 'side', { duel: 2, d: 6.6, h: 1.4 }], [22.9, 'side', { duel: 1, d: 6.2, h: 1.3 }], [25.05, 'low', { duel: 2, d: 5.0, look: 1.5 }],
  [27.3, 'low', { duel: 1, d: 3.5, look: 1.25, roll: -0.05, fov: 46 }], [28.0, 'archer', {}], [28.21, 'arrow', {}], [28.62, 'side', { duel: 1, d: 5.4, h: 1.2 }], [30.7, 'ending', {}],
];
export const shotAt = t => { let i = 0; for (let j = 0; j < SHOTS.length; j++) if (t >= SHOTS[j][0] - 1e-6) i = j; return { i, t0: SHOTS[i][0], t1: (SHOTS[i + 1] || [TOTAL])[0], type: SHOTS[i][1], o: SHOTS[i][2] }; };
export const shots = () => SHOTS.map(s => [s[0], s[1], s[2].duel || 0]);
const posOf = (ctx, d, k, t) => { const p = ctx.DUELS[d - 1].C.pose(k, t).pos; return v3(p[0], p[1], p[2]); };
const midOf = (ctx, d, t) => posOf(ctx, d, 'A', t).lerp(posOf(ctx, d, 'B', t), 0.5);
function shake(ctx, t, duel) { let a = 0;
  for (const D of ctx.DUELS) { if (duel && D.id !== duel) continue; for (const c of D.contacts) { const d = t - c.t; if (d < 0 || d >= 0.32) continue;
    const amp = c.kind === 'slam' ? 0.15 : c.big ? 0.09 : c.kind === 'kick' ? 0.06 : c.kind === 'drag' ? 0.012 : 0.03; a = Math.max(a, amp * Math.pow(1 - d / 0.32, 2)); } }
  return v3(a * Math.sin(t * 93), a * Math.cos(t * 71), a * Math.sin(t * 57)); }
export function camera(t, ctx) {
  const S = shotAt(t), o = S.o, u = clamp((t - S.t0) / Math.max(0.01, S.t1 - S.t0)), F = ctx.FLOOR, up = y => v3(0, y, 0);
  let pos, look, fov = o.fov || 40, roll = o.roll || 0, src = o.duel || 0;
  if (o.duel) { const other = o.duel === 1 ? 2 : 1, m0 = midOf(ctx, o.duel, S.t0), mo = midOf(ctx, other, S.t0);
    let out = m0.clone().sub(mo).setY(0); if (out.length() < 0.8) out = v3(0, 0, o.duel === 1 ? -1 : 1); out.normalize();
    const A = posOf(ctx, o.duel, 'A', t), B = posOf(ctx, o.duel, 'B', t), mid = A.clone().lerp(B, 0.5), gap = A.distanceTo(B), gy = ctx.floorAt(mid.x, mid.z);
    const ab0 = posOf(ctx, o.duel, 'B', S.t0).sub(posOf(ctx, o.duel, 'A', S.t0)).setY(0).normalize();
    // keep the camera square to the fighters' line (at the shot start), on the outside
    let sd = v3(-ab0.z, 0, ab0.x); if (sd.dot(out) < 0) sd.negate(); sd.lerp(out, 0.35).normalize();
    if (S.type === 'side') { pos = mid.clone().add(sd.clone().multiplyScalar((o.d || 5.6) * (1 - 0.06 * u) + Math.max(0, gap - 3) * 0.5)).setY(gy + (o.h || 1.3)); look = mid.clone().setY(gy + 1.15); }
    else if (S.type === 'wide') { pos = mid.clone().add(sd.clone().multiplyScalar((o.d || 7) + Math.max(0, gap - 3.5) * 0.5)).setY(gy + 2.5 - 0.5 * u); look = mid.clone().setY(gy + 1.0); fov = o.fov || 42; }
    else if (S.type === 'low') { pos = mid.clone().add(sd.clone().multiplyScalar((o.d || 4) + Math.max(0, gap - 2.5) * 0.6)).setY(gy + 0.32); look = mid.clone().setY(gy + (o.look || 1.4)); fov = o.fov || 50; }
    else { const r = Math.max(3.6, gap + 2.4); pos = mid.clone().add(sd.clone().multiplyScalar(r * 0.85)).add(ab0.clone().multiplyScalar(-r * 0.5)).setY(gy + 1.5); look = mid.clone().setY(gy + 1.2); }
  } else if (S.type === 'team') {   // two teammates side by side, seen from the front: they turn their heads to each other
    const a = o.team === 0 ? posOf(ctx, 1, 'A', t) : posOf(ctx, 1, 'B', t), b = o.team === 0 ? posOf(ctx, 2, 'B', t) : posOf(ctx, 2, 'A', t), mid = a.clone().lerp(b, 0.5), f = o.team === 0 ? 1 : -1;
    pos = mid.clone().add(v3(f * (6.4 - 0.6 * io(u)), 1.55, f * (0.45 - 0.9 * u))); look = mid.clone().add(up(1.35)); fov = 34;
  } else if (S.type === 'wide4') {   // both duels at once, from the end of the lanes
    const m = midOf(ctx, 1, t).lerp(midOf(ctx, 2, t), 0.5);
    if (o.far) { pos = v3(m.x - 9.5 + 1.0 * u, F + 3.4, m.z - 6.5); look = v3(m.x, F + 1.0, m.z); fov = 44; }
    else { pos = v3(0.6 - 1.2 * u, F + 2.3, -12.4 + 0.8 * u); look = v3(0, F + 1.1, 0.4); fov = 42; }
  } else if (S.type === 'shove') {   // the staff raised over the downed archer; the sword runs in from behind and kicks him off; he slides past the camera
    const st = posOf(ctx, 2, 'A', t), sw = posOf(ctx, 1, 'A', t), ar = posOf(ctx, 2, 'B', t), w = io(clamp((t - (T_SHOVE - 0.5)) / 0.5));
    const foc = st.clone().lerp(ar, 0.35).lerp(st.clone().lerp(sw, 0.3), w * 0.5);
    pos = v3(-3.3 + 0.5 * u, F + 0.75 + 0.5 * u, 5.4 + 0.6 * u); look = foc.setY(F + 1.2); fov = 44; src = 2;
  } else if (S.type === 'archer') {   // the archer at full draw, seen from where he is aiming
    const ar = posOf(ctx, 2, 'B', t), d = XT.clone().sub(ar).setY(0).normalize(), s = v3(-d.z, 0, d.x);
    pos = ar.clone().add(d.clone().multiplyScalar(3.3 - 0.3 * u)).add(s.multiplyScalar(1.15)).add(up(1.6)); look = ar.clone().add(up(1.3)); fov = 36;   // v1 was 2.0 away: the face filled the frame
  } else if (S.type === 'arrow') {   // the arrow crosses the arena into the raised spear
    const sp = posOf(ctx, 1, 'B', t), ar = posOf(ctx, 2, 'B', t), d = sp.clone().sub(ar).setY(0).normalize(), s = v3(-d.z, 0, d.x);
    pos = sp.clone().add(d.clone().multiplyScalar(3.4)).add(s.multiplyScalar(-2.3 + 0.4 * u)).add(up(0.85)); look = sp.clone().add(up(1.55)).add(d.clone().multiplyScalar(-0.6)); fov = 42; src = 1;
  } else {   // ending: the winners, a slow pull back and rise; the logo comes in over it
    const a = posOf(ctx, 1, 'A', t), b = posOf(ctx, 2, 'B', t), mid = a.clone().lerp(b, 0.5), e = io(u);
    pos = v3(mid.x + 5.4 + 2.4 * e, F + 1.5 + 1.7 * e, mid.z + 1.4 - 1.6 * e); look = mid.clone().setY(F + 1.25 + 1.55 * e); fov = 38;   // the look rises: the winners settle into the lower third, under the logo
  }
  const hh = v3(0.03 * Math.sin(t * 1.7) + 0.018 * Math.sin(t * 4.3), 0.022 * Math.sin(t * 2.3 + 1), 0.028 * Math.cos(t * 1.9)), sh = shake(ctx, t, src).add(hh);
  pos.add(sh); look = look.clone().add(sh.clone().multiplyScalar(0.6)); const fl = ctx.floorAt(pos.x, pos.z); if (pos.y < fl + 0.15) pos.y = fl + 0.15;
  return { pos, look, fov, roll, label: S.type + (o.duel || ''), src, noImpact: true };
}
export const blurOK = () => true;
export const trailGate = () => 1;
// outro: the scene dims a little under the logo
export function effects(t, fx) { if (t > T_OUTRO) fx.black = Math.max(fx.black, 0.6 * io(clamp((t - T_OUTRO) / 1.1))); }
// logo outro (DOM over the canvas): fades and settles in, one soft shine passes across it, clean hold, short fade to black
let VO = null;
export function overlay(tv, t, doc) {
  if (VO == null) VO = window.videoAt(T_OUTRO);
  const el = doc.getElementById('outro'), logo = doc.getElementById('logo'), shine = doc.getElementById('shine'), glow = doc.getElementById('glow'), fade = doc.getElementById('fade');
  const d = tv - VO, END = window.videoAt(TOTAL); if (d <= 0) { el.style.opacity = 0; fade.style.opacity = 0; return; }
  const a = io(clamp(d / 0.7)), s = 0.9 + 0.1 * (1 - Math.pow(1 - clamp(d / 0.9), 3));
  el.style.opacity = a; doc.getElementById('ls').style.transform = `scale(${s.toFixed(4)})`; glow.style.opacity = (0.55 * a).toFixed(3); glow.style.transform = `scale(${(0.9 + 0.25 * clamp(d / 3)).toFixed(4)})`;
  const k = clamp((d - 0.9) / 0.9); shine.style.opacity = (Math.sin(Math.PI * k) * 0.85).toFixed(3); shine.style.left = (-30 + 130 * k).toFixed(2) + '%';
  fade.style.opacity = io(clamp((tv - (END - 0.4)) / 0.4)).toFixed(3);
}
