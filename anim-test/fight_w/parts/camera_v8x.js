const INS = [7.25, 17.2];   // two impact inserts only (standard: fewer jumps)
const FLASH = 30.73, BIND_T = -9, BIND_END = -8, FALL_T = 32.95, FALL_C = 'B', INTRO_END = 2.9, T_OUTRO = 34.0;
// calmer than v8 (its shots averaged 0.5 s; the user: "fewer half-second camera changes", "scenes being skipped"): about 1 s per shot
const SHOTS = [
  [0.0, 'est'], [INTRO_END, 'three4'], [4.0, 'side', { d: 5.0, h: 1.3 }], [5.05, 'trackA', { d: 3.8 }], [5.75, 'side', { d: 4.6, h: 1.3 }], [7.25, 'ins'], [7.35, 'wide', { d: 7 }],
  [7.95, 'trackB'], [8.65, 'three4'], [9.85, 'wide', { d: 6.5 }], [10.5, 'trackB', { d: 4 }], [11.0, 'low', { d: 4.6, look: 2.2, roll: 0.05 }], [11.5, 'side', { d: 5.0, h: 1.4 }],
  [12.9, 'three4'], [14.5, 'wide', { d: 6.8 }], [15.1, 'otsA'], [16.0, 'orbit', { a0: 0.1, a1: 0.8 }], [16.85, 'low', { d: 3.8, look: 1.0, roll: -0.04 }], [17.2, 'ins'], [17.3, 'three4'],
  [18.0, 'wide', { d: 7.5 }], [18.9, 'trackB', { d: 4.2 }], [19.55, 'low', { d: 4.4, look: 2.0, roll: 0.05 }], [20.4, 'side', { d: 4.6, h: 1.3 }], [21.45, 'wide', { d: 6.5 }],
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
      const cp_ = v3(...c.p); pos = cp_.clone().add(side.clone().multiplyScalar(ii % 2 ? -2.3 : 2.3)).add(ab.clone().multiplyScalar(0.5)).add(up(0.15)); look = cp_.clone().add(up(-0.25)); fov = 36 + 30 * lt; roll = ii % 2 ? 0.12 : -0.1; break; }
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
