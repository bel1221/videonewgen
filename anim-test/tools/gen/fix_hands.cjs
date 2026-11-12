const fs = require('fs');
const E = (file, pairs) => { let s = fs.readFileSync(file, 'utf8'); for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(file + ': ' + a.slice(0, 80)); s = s.replace(a, b); } fs.writeFileSync(file, s); };

// ---------------------------------------------------------------- 1. rig: a TRUE two-handed grip (only for characters flagged ch.th)
E('fight_w/rig2_w.js', [["  clearArms(['r', 'l']);",
`  // TRUE TWO-HANDED GRIP (user, 2026-11-12: "2handed weapons attacks are fixed to using 2 hand grip"). For a character flagged ch.th, with the
  // pose's lh > 0: BOTH fists are put where the shaft can really be held. Minecraft arms reach 9.5 px, so for the wanted weapon direction (the
  // pose's bd) the main hand is moved to the nearest point from which the second hand's point on the shaft (ch.lh + lhAt px along the weapon) is
  // also within reach of its own shoulder, both in front of the chest. Then the main arm is solved by IK to that point; the left arm follows the
  // shaft below (the existing lh IK), now always reachable - no hand chasing a shaft it cannot reach, no forced grip.
  if (ch.th && ch.lh != null && ch.whand === 'r' && P.bd && ch.weapon && (P.lh || 0) * (P.gripW ?? 1) > 0.001) {
    ch.root.updateMatrixWorld(true);
    const wgt = Math.min(1, P.lh * (P.gripW ?? 1)), ty = ((P.yaw || 0) + (w[1] || 0) + (cst[1] || 0)) * D2R;
    const d = new THREE.Vector3(...P.bd).applyAxisAngle(new THREE.Vector3(0, 1, 0), ty).normalize();
    const g = (ch.lh + (P.lhAt || 0)) * ch.weapon.parent.scale.x / 16, RR = 0.545;                         // fist-to-fist along the shaft (blocks); arm reach with a little slack
    const Sr = b.rSh.getWorldPosition(new THREE.Vector3()), Sl = b.lSh.getWorldPosition(new THREE.Vector3()), R = b.rHand.getWorldPosition(new THREE.Vector3());
    const cm = b.chest2.matrixWorld.elements, fwd = new THREE.Vector3(cm[8], cm[9], cm[10]).normalize(), cp = b.chest2.getWorldPosition(new THREE.Vector3()), Lp = new THREE.Vector3();
    const front = X => { const dep = X.clone().sub(cp).dot(fwd); if (dep < 0.26) X.addScaledVector(fwd, 0.26 - dep); };   // fists stay in front of the chest
    for (let it = 0; it < 24; it++) {
      front(R); if (R.distanceTo(Sr) > RR) R.sub(Sr).setLength(RR).add(Sr);
      Lp.copy(R).addScaledVector(d, g); front(Lp); if (Lp.distanceTo(Sl) > RR) Lp.sub(Sl).setLength(RR).add(Sl);
      R.lerp(Lp.clone().addScaledVector(d, -g), 0.5); }
    armIK('r', R, wgt, [-0.9, -0.5, 0.15]);
  }
  clearArms(['r', 'l']);`]]);

// ---------------------------------------------------------------- 2. engine (duo builds): the free hand flows instead of sitting raised
const FREE = String.raw`# ---- FREE HAND (user, 2026-11-12: "1 hand always raising up ... has no free motion and stays raised up for too long", "make hand have more
# free motion and flows smoothly with each attack"). BAD before: L.guard holds the left arm at [-38, 0, 24], elbow -64, and the engine multiplied
# it by 1.25, so every guard-derived pose kept the free hand up at the chest. Now the hand that holds nothing (OFFH: 'l', or 'r' for the archer)
# hangs low and is driven by the fight: it swings against the weapon arm and the torso twist, a beat late and with a little overshoot
# (follow-through). An arm a pose really authors (kick, hit reaction, jump, lying down) keeps 70 % of its key; a run or walk keeps its gait swing.
if vid.startswith('duo'):
    import re
    s, n_ = re.subn(r"  p\.lArm = p\.lArm\.map\(v => v \* 1\.25\); p\.lElbow = p\.lElbow\.map\(v => v \* 1\.1\);[^\n]*", "  freeArm(c, t, p);   // the free hand flows (was: left arm x 1.25)", s)
    if n_ != 1: sys.exit('free-arm line not found')
    s = rep(s, "function poseRaw(c, t) {", """const OFFH = { A: 'l', B: 'l' };   // which hand holds nothing ('r' for an archer; null = leave both arms to the keys)
const FREE_REF = { l: [-38, 24, -64], r: [-62, 10, -56] };   // the raised guard arm every G pose inherits: [arm x, |arm z|, elbow x]
function freeArm(c, t, p) {
  const s = OFFH[c]; if (!s) return; const arm = s + 'Arm', elb = s + 'Elbow', m = s === 'l' ? 'rArm' : 'lArm', sg = s === 'l' ? 1 : -1;
  const held = clamp(s === 'l' ? (p.lh || 0) : (p.rh || 0)); if (held > 0.98 || inWin(RUN[c], t) || inWin(WALK[c], t)) return;
  const f = tt => { const q = evalKeysS(T[c], tt), tw = (q.waist[1] || 0) + (q.chest[1] || 0), main = q[m][0] + 62;
    return [clamp(10 - 0.2 * main - 0.2 * sg * tw + 0.3 * (q.waist[0] || 0), -42, 46), 11 + 0.15 * Math.abs(tw) + 0.08 * Math.max(0, -main)]; };
  const a = f(t - 0.07), b = f(t - 0.17), px = a[0] + 0.6 * (a[0] - b[0]), pz = a[1] + 0.6 * (a[1] - b[1]);   // a beat late + overshoot = follow-through
  const el = -20 - 0.28 * Math.abs(px) - 0.9 * Math.abs(a[0] - b[0]), R = FREE_REF[s];
  const dist = Math.abs(p[arm][0] - R[0]) + Math.abs(sg * p[arm][2] - R[1]) + Math.abs(p[elb][0] - R[2]);
  const w = (0.3 + 0.7 * clamp(1 - dist / 40)) * (1 - held);
  p[arm] = [lerp(p[arm][0], px, w), p[arm][1] * (1 - w), lerp(p[arm][2], sg * pz, w)]; p[elb] = [lerp(p[elb][0], el, w), 0, 0];
}
function poseRaw(c, t) {""")
`;
E('fight_w/parts/assemble_w.py', [["cam = open(f'fight_w/parts/camera_{vid}.js', encoding='utf-8').read()", "cam = open(f'fight_w/parts/camera_{vid}.js', encoding='utf-8').read()\nFREE_HAND_PATCH = True"]]);
{ // the patch must run on s AFTER s is built; append near the end, before the file is written
  let s = fs.readFileSync('fight_w/parts/assemble_w.py', 'utf8'); const i = s.lastIndexOf("open(f'fight_w/choreo_{vid}.js'"); if (i < 0) throw new Error('assemble: write line not found');
  const ls = s.lastIndexOf('\n', i) + 1; s = s.slice(0, ls) + FREE + s.slice(ls); fs.writeFileSync('fight_w/parts/assemble_w.py', s); }

// ---------------------------------------------------------------- 3. fight4: the spear and the staff are two-handed weapons, left hand AHEAD on the shaft
E('fight_w/fight4.js', [
  ["  boltspear: { seg: [-16, -10, -4, 4, 10, 16, 21], cseg: [5, 21.5], tip: 21.5, trail: [9, 21.5], lh: -5.6, edgeUp: 'z' },", "  boltspear: { seg: [-16, -10, -4, 4, 10, 16, 21], cseg: [5, 21.5], tip: 21.5, trail: [9, 21.5], lh: 6, th: true, edgeUp: 'z' },   // th = true two-handed grip (rig2_w); lh +6 = second fist 6 px AHEAD of the main one"],
  ["  'jingu bang': { seg: [-22, -16, -10, -4, 4, 10, 16], cseg: [-21, 16], tip: 16.3, trail: [5, 16.3], lh: -7.5 },", "  'jingu bang': { seg: [-22, -16, -10, -4, 4, 10, 16], cseg: [-21, 16], tip: 16.3, trail: [5, 16.3], lh: 8, th: true },"],
  ["Object.assign(cast[k], { cseg: w.cseg, tip: w.tip, trail: w.trail, floorAt, wname: S.w[i] });", "Object.assign(cast[k], { cseg: w.cseg, tip: w.tip, trail: w.trail, floorAt, wname: S.w[i], th: !!w.th });"]]);

// ---------------------------------------------------------------- 4. poses: two hands on every spear / staff attack, guard and block
{ let s = fs.readFileSync('fight_w/parts/duo_shared.js', 'utf8'); const a = s.indexOf('// spear / staff pose set'), b = s.indexOf('function spearSetup()'); const e = s.indexOf('\n}\n', b) + 3;
  if (a < 0 || b < 0) throw new Error('duo_shared: spearSetup not found');
  s = s.slice(0, a) + `// spear / staff pose set. USER RULE (2026-11-12, replaces the bolt30 "two hands only for a lunge"): a two-handed weapon ATTACKS with two
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
` + s.slice(e); fs.writeFileSync('fight_w/parts/duo_shared.js', s); }
// build files: no more per-key one-hand overrides on attacks; the archer's free hand is the RIGHT one
E('fight_w/parts/build_duo2.js', [["  weapons('jingu bang', 'seekerbow'); spearSetup();", "  weapons('jingu bang', 'seekerbow'); spearSetup(); OFFH.B = 'r';   // the archer's bow is in the left hand: his free hand is the right one"]]);
console.log('patched');
