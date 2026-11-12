// ---- DUO 40 (2 v 2): shared by build_duo1.js and build_duo2.js. One timeline (animation seconds) and one set of world coordinates,
// so the two duels meet at the right place and time. Blue team = duel 1 A (Blinkblade) + duel 2 B (Seekerbow); red team = duel 1 B
// (Boltspear) + duel 2 A (Jingu Bang). duo_director.js repeats the times it needs (T_SHOVE, T_XHIT, slow motion) - keep them equal.
const T_GO = 3.7;                       // everyone moves
const T_SHOVE = 19.05;                  // the sword (duel 1 A) kicks the staff fighter (duel 2 A) off the downed archer
const SHOVE_S_W = [0.55, 2.0];            // where the staff fighter stands at that moment
const SHOVE_B_W = [-0.7, 2.0];            // where the archer lies
const SHOVE_A_W = [0.55, 1.02];           // where the sword arrives (kicks along +z)
const T_XNOCK = 27.5, T_XLOOSE = 28.19, T_XHIT = 28.3;   // the archer's shot across the arena that knocks the spear out of duel 1 B's hands
const XHIT_ALONG = 9;                   // where on the spear it lands (px along the weapon)
const XSPEAR = [0.3, -2.6];               // about where the spear fighter stands at T_XHIT (the archer turns toward it)
const X_ARCHER_W = [-3.0, -0.4];           // where the archer shoots from
const T_FALL1 = 30.45, T_FALL2 = 27.2;  // the spear fighter / the staff fighter hit the sand
const END_A_W = [-1.4, -2.7], END_B_W = [-1.4, -0.9];   // the winners end side by side, as in the intro
// DRIFT moves BOTH fighters of a duel on top of their keyed positions, so after a drift a keyed position is no longer a world position.
// driftOff(t) = how far this duel has drifted by time t (same maths as the engine's drift table); W_(p, t) = the key that lands on world point p.
function driftOff(t) { let x = 0, z = 0;
  for (const [t0, t1, mode, spd] of DRIFT) { if (t <= t0) continue; const te = Math.min(t, t1); let area = 0;
    for (let s = t0; s < te; s += 1 / 240) area += Math.max(0, Math.min(1, (s - t0) / 0.2, (t1 - s) / 0.2)) / 240;
    const a = evalPosT('A', t0), b = evalPosT('B', t0), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    const v = mode === 'strafeL' ? [-uz, ux] : mode === 'strafeR' ? [uz, -ux] : mode === 'pushA' ? [ux, uz] : [-ux, -uz]; x += v[0] * spd * area; z += v[1] * spd * area; }
  return [x, z]; }
const W_ = (p, t) => { const o = driftOff(t); return [p[0] - o[0], p[1] - o[1]]; };
const chest = (c, t) => () => { const q = pose(c, t).pos; return [q[0], q[1] + 1.2, q[2]]; };
const tipFloor = (c, tt, along = 20) => (cast, blade) => { const tip = blade(c, tt, [along])[0]; return [tip.x, W.floorAt(tip.x, tip.z) + 0.05, tip.z]; };
// movement helpers (positions are taken from the keys already laid down; DRIFT is added to both fighters on top)
const dist = (c, o, t) => { const a = evalPosT(c, t), b = evalPosT(o, t); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
const mv = (c, o, t0, t1, gap, e = 'io') => { const a = evalPosT(c, t0), b = evalPosT(o, t1), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, b[0] + dx / d * gap, b[1] + dz / d * gap, e); };
const mvd = (c, o, t0, t1, delta, e = 'o') => mv(c, o, t0, t1, dist(c, o, t0) + delta, e);
const lat = (c, o, t0, t1, side, e = 'o') => { const a = evalPosT(c, t0), b = evalPosT(o, t0), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, a[0] - dz / d * side, a[1] + dx / d * side, e); };
// spear / staff pose set. USER RULE (2026-11-12, replaces the bolt30 "two hands only for a lunge"): a two-handed weapon ATTACKS with two
// hands. The second hand lets go only for an enemy's hit (hitBack, skid, knees, fallen stay one-handed), when the weapon does something else,
// and while running (spCharge, sprintGo: one hand). The rig's true two-handed grip (ch.th) puts both fists where the shaft is reachable, so
// lh: 1 no longer means a hand chasing an unreachable shaft. Thrusts stay side-on (the only way a shaft can point at the enemy from two hands).
function spearSetup() {
  const TWO = ['spGuard', 'spReady', 'spBlock', 'spBlockL', 'spBlockV', 'spBlockH', 'spSweepW', 'spSweep', 'spOverW', 'spOver'];
  for (const n of TWO) { L[n].lh = 1; delete L[n]._flat; }
  for (const n of ['gsCrouch', 'gsHop', 'gsLand']) { L[n].lh = 0; delete L[n]._flat; }
  L.spBrake = S(L.slideLow, { waist: [30, -8, 0], chest: [16, -6, 0], head: [-24, 10, 0], rArm: [-58, 0, -10], rElbow: [-34, 0, 0], lh: 1, plant: 1, y: -0.52 }); L.spBrake.bd = bdv(-50, 8);   // both hands drive it into the sand
  const YS = -50, TS = -1, SIDE = { lh: 1, lhAt: 0, yawOff: YS };
  L.spWind = S(L.spGuard, { ...SIDE, rArm: [-26, 0, 50], rElbow: [-14, 0, 0], waist: [6, TS * 22, 0], chest: [0, TS * 18, 0], head: [-6, -(YS + TS * 40) * 0.9, 0],
    rLeg: [0, 0, -12], rKnee: [14, 0, 0], lLeg: [0, 0, 30], lKnee: [24, 0, 0], y: -0.2 }); L.spWind.bd = bdv(4, 88);
  L.spThrust = S(L.spGuard, { ...SIDE, rArm: [14, 0, 64], rElbow: [-58, 0, 0], waist: [10, TS * 24, 0], chest: [2, TS * 18, 0], head: [-8, -(YS + TS * 42) * 0.9, 0],
    rLeg: [0, 0, -22], rKnee: [6, 0, 0], lLeg: [0, 0, 44], lKnee: [40, 0, 0], y: -0.34 }); L.spThrust.bd = bdv(0, 88);
  // quick jabs: the same two-handed side-on thrust, shorter and higher in the stance
  L.spJabW = S(L.spWind, { y: -0.14, waist: [4, TS * 16, 0], chest: [0, TS * 14, 0] }); L.spJabW.bd = bdv(6, 84);
  L.spThrust1 = S(L.spThrust, { y: -0.22, lLeg: [0, 0, 32], lKnee: [28, 0, 0] }); L.spThrust1.bd = bdv(2, 86);
  L.spJab = S(L.spThrust, { y: -0.26, lLeg: [0, 0, 36], lKnee: [32, 0, 0] }); L.spJab.bd = bdv(8, 86);
  L.spCharge = S(L.spCharge, { lh: 0 });                                 // RUNNING is one-handed (user)
  L.gsPlungeW = S(L.gsPlungeW, { lh: 1 }); L.gsPlunge = S(L.gsPlunge, { lh: 1 });   // the finishing plunge: both hands on the shaft
}
