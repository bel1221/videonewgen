"""Grip release (user, bolt30 review 2026-11-11: "hands are spasming ... if the hands are forced apart and the weapon is too far
away, stop trying to regrip it every time"; applies to every two-handed weapon and to the bow's string hand).
Run from anim-test/:  python tools/patch_grip.py
- rig2_w.js: the support hand's IK weight is P.lh * P.gripW (bow string hand: P.rh * P.gripW); the rig reports how far the grip
  point is from the shoulder (ch.gripReach, 1 = arm fully straight) and where it is in the chest frame (ch.gripLocal).
- fight.js: after the clash solve, scans the whole fight at 60 Hz and builds a per-fighter grip track with hysteresis:
  the hand lets go when the grip point is out of reach or would have to move faster than a hand can follow, and only takes
  the weapon again after the grip has been comfortably reachable for 0.3 s. C.setGrip() hands the track to the choreography.
- assemble_w.py: pose() carries p.gripW from that track."""
import sys
BS = chr(92)
def patch(path, edits):
    s = open(path, encoding='utf-8', newline='').read(); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for old, new in edits:
        if new in s: continue
        if s.count(old) != 1: sys.exit(f'{path}: expected 1x, found {s.count(old)}x: {old[:80]}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n') if crlf else s); print('patched', path)

RIG_DIAG = ("const gripInfo = (sd, tg) => { const sh = b[sd + 'Sh'].getWorldPosition(new THREE.Vector3()), el = b[sd + 'El'].getWorldPosition(new THREE.Vector3()), hd = b[sd + 'Hand'].getWorldPosition(new THREE.Vector3());\n"
            "    ch.gripReach = sh.distanceTo(tg) / (sh.distanceTo(el) + el.distanceTo(hd)); ch.gripLocal = b.chest2.worldToLocal(tg.clone()); };\n")
patch('fight_w/rig2_w.js', [
    ("  if (ch.weapon && ch.lh != null && ch.whand === 'r' && P.lh > 0) {\n"
     "    ch.root.updateMatrixWorld(true); armIK('l', ch.weapon.localToWorld(new THREE.Vector3(0, ch.lh, 0)), P.lh, [0.9, -0.55, 0.15]); }",
     "  ch.gripReach = null; ch.gripLocal = null;\n  " + RIG_DIAG +
     "  if (ch.weapon && ch.lh != null && ch.whand === 'r' && P.lh > 0) {\n"
     "    ch.root.updateMatrixWorld(true); const tg_ = ch.weapon.localToWorld(new THREE.Vector3(0, ch.lh, 0)); gripInfo('l', tg_); armIK('l', tg_, P.lh * (P.gripW ?? 1), [0.9, -0.55, 0.15]); }"),
    ("      armIK('r', tgt, P.rh, [-0.8, -0.3, -0.5]); ch.root.updateMatrixWorld(true);",
     "      gripInfo('r', tgt); armIK('r', tgt, P.rh * (P.gripW ?? 1), [-0.8, -0.3, -0.5]); ch.root.updateMatrixWorld(true);"),
    ("(P.draw || 0) > 0.03 && P.rh > 0.5 ? hand : nock", "(P.draw || 0) > 0.03 && P.rh * (P.gripW ?? 1) > 0.5 ? hand : nock"),
    ("(ch.lh != null && P.lh > 0.2 && Math.abs(a - ch.lh) < 2.5);\n        for (const sh of", "(ch.lh != null && P.lh * (P.gripW ?? 1) > 0.2 && Math.abs(a - ch.lh) < 2.5);\n        for (const sh of"),
])
patch('fight_w/fight.js', [
    ("// blade-vs-ground contacts: tip scraping the sand during a fast swing -> sand spray + sparks\n",
     """// ---- grip release: the support hand lets go when the weapon is out of reach or moving too fast for it, and re-grips only
// after the grip point has been comfortably reachable for REGRIP seconds (no per-frame re-grabbing = no spasming hands)
if (C.setGrip && params.get('grip2') !== '0') {
  const GHZ = 60, NG = Math.ceil(C.TOTAL * GHZ) + 2, REACH_OUT = +(params.get('gout') ?? 0.97), REACH_IN = +(params.get('gin') ?? 0.9), VMAX = +(params.get('gv') ?? 7.5), REGRIP = 0.3, tab = {}, dbg = {};
  for (const k of ['A', 'B']) { const w = new Float32Array(NG).fill(1); let held = true, good = 0, prev = null, nRel = 0; dbg[k] = [];
    for (let i = 0; i < NG; i++) { const t = i / GHZ; applyPose(cast[k], C.pose(k, t)); const r = cast[k].gripReach, q = cast[k].gripLocal;
      if (r == null) { held = true; good = 0; prev = null; w[i] = 1; continue; }             // one-handed pose: nothing to hold
      const v = prev ? q.distanceTo(prev) / 16 * GHZ : 0; prev = q.clone();                    // grip-point speed in the chest frame (blocks/s)
      const bad = r > REACH_OUT || v > VMAX, ok = r < REACH_IN && v < VMAX * 0.6;
      if (held && bad) { held = false; good = 0; nRel++; dbg[k].push(+t.toFixed(2)); } else if (!held) { good = ok ? good + 1 / GHZ : 0; if (good >= REGRIP) held = true; }
      w[i] = held ? 1 : 0; }
    const d = Math.round(0.07 * GHZ), e = w.slice(); for (let i = 0; i < NG; i++) { let m = 1; for (let j = -d; j <= d; j++) m = Math.min(m, w[Math.max(0, Math.min(NG - 1, i + j))]); e[i] = m; }   // let go a little early
    const sg = 0.06 * GHZ, s = new Float32Array(NG); for (let i = 0; i < NG; i++) { let a = 0, ws = 0; for (let j = -12; j <= 12; j++) { const g = Math.exp(-0.5 * (j / sg) ** 2); a += e[Math.max(0, Math.min(NG - 1, i + j))] * g; ws += g; } s[i] = a / ws; }
    tab[k] = { hz: GHZ, w: Array.from(s) }; }
  C.setGrip(tab); console.warn('GRIP releases', JSON.stringify(dbg));
}
// blade-vs-ground contacts: tip scraping the sand during a fast swing -> sand spray + sparks
"""),
])
patch('fight_w/parts/assemble_w.py', [
    ("s = rep(s, \"function rootXZ(c, t) {\", \"function oppArmPts(",
     "s = rep(s, \"  const fr = samp(S_.r, t), fl = samp(S_.l, t);\", \"  if (GRIPT && GRIPT[c]) { const g = GRIPT[c], x = Math.max(0, Math.min(g.w.length - 2, t * g.hz)), i = Math.floor(x); p.gripW = g.w[i] + (g.w[i + 1] - g.w[i]) * (x - i); }   // support-hand grip (fight.js setGrip)" + BS + "n  const fr = samp(S_.r, t), fl = samp(S_.l, t);\")\n"
     "s = rep(s, \"export const PARRY = [];" + BS + "nexport const ARROWS\", \"let GRIPT = null; export function setGrip(g) { GRIPT = g; }" + BS + "nexport const PARRY = [];" + BS + "nexport const ARROWS\")\n"
     "s = rep(s, \"function rootXZ(c, t) {\", \"function oppArmPts("),
])
