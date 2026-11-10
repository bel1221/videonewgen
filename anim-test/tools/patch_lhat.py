"""Pose channel 'lhAt': moves the support hand's grip point along the weapon (px, added to the weapon's own lh point).
Side-on two-handed spear thrusts hold the shaft AHEAD of the main hand; the weapon default (-7) is behind it.
Run from anim-test/:  python tools/patch_lhat.py"""
import sys
def patch(path, edits):
    s = open(path, encoding='utf-8', newline='').read(); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for old, new in edits:
        if new in s: continue
        if s.count(old) != 1: sys.exit(f'{path}: expected 1x, found {s.count(old)}x: {old[:80]}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n') if crlf else s); print('patched', path)
patch('fight_w/parts/assemble_w.py', [
    ("wide: 1, plant: 0, pierce: 0, tilt:", "wide: 1, plant: 0, pierce: 0, lhAt: 0, tilt:"),
    ("'wide', 'plant', 'pierce'];\")", "'wide', 'plant', 'pierce', 'lhAt'];\")"),
    ("pierce: lerp(a.pierce || 0, b.pierce || 0, u),\")", "pierce: lerp(a.pierce || 0, b.pierce || 0, u), lhAt: lerp(a.lhAt || 0, b.lhAt || 0, u),\")"),
])
patch('fight_w/rig2_w.js', [
    ("const tg_ = ch.weapon.localToWorld(new THREE.Vector3(0, ch.lh, 0)); gripInfo('l', tg_);", "const tg_ = ch.weapon.localToWorld(new THREE.Vector3(0, ch.lh + (P.lhAt || 0), 0)); gripInfo('l', tg_);"),
    ("(ch.lh != null && P.lh * (P.gripW ?? 1) > 0.2 && Math.abs(a - ch.lh) < 2.5);", "(ch.lh != null && P.lh * (P.gripW ?? 1) > 0.2 && Math.abs(a - ch.lh - (P.lhAt || 0)) < 2.5);"),
])
