"""One-off engine additions for the bolt30 duel (2026-11-11). Run from anim-test/:  python tools/patch_bolt30_engine.py
- assemble_w.py: TOTAL for bolt30; pose channels 'plant' (weapon may enter the sand: spear brake) and 'pierce' (weapon ignores
  the opponent's body: finisher); 'drag' contact kind (sand furrow puffs).
- rig2_w.js: honours P.plant / P.pierce in the weapon collision.
- fight.js: Lancebolt, bolt30 pair/label, split-panel face intro (C.panelAt / C.panelCams).
- fight_sfx3.py: SCENE=bolt30, 'drag' scrape sound."""
import sys
def patch(path, edits):
    s = open(path, encoding='utf-8', newline='').read(); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for old, new in edits:
        if new in s: continue
        if s.count(old) != 1: sys.exit(f'{path}: expected 1x, found {s.count(old)}x: {old[:80]}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n') if crlf else s); print('patched', path)

patch('fight_w/parts/assemble_w.py', [
    ("('37.55' if vid == 'duel40' else", "('29.0' if vid == 'bolt30' else '37.55' if vid == 'duel40' else"),
    ("lh: 0, rh: 0, draw: 0, aimK: 0, wide: 1, tilt:", "lh: 0, rh: 0, draw: 0, aimK: 0, wide: 1, plant: 0, pierce: 0, tilt:"),
    ("'lh', 'rh', 'draw', 'aimK', 'wide'];\")", "'lh', 'rh', 'draw', 'aimK', 'wide', 'plant', 'pierce'];\")"),
    ("wide: lerp(a.wide ?? 1, b.wide ?? 1, u),\")", "wide: lerp(a.wide ?? 1, b.wide ?? 1, u), plant: lerp(a.plant || 0, b.plant || 0, u), pierce: lerp(a.pierce || 0, b.pierce || 0, u),\")"),
    ("        \"    if (c.kind === 'arrowg') puff(",
     "        \"    if (c.kind === 'drag') { const g_ = W.floorAt(p[0], p[2]); puff(soft, t, c.t, [p[0], g_, p[2]], 9, Math.round(c.t * 613), 0.4, 0.7, [0.92, 0.82, 0.62], 0.9); burst(add, t, c.t, [p[0], g_ + 0.05, p[2]], 8, Math.round(c.t * 419), 0.45); }\\n\"\n"
     "        \"    if (c.kind === 'arrowg') puff("),
])
patch('fight_w/rig2_w.js', [
    ("if (ch.floorAt) { const f = ch.floorAt(pt.x, pt.z) + 0.035;", "if (ch.floorAt && !(P.plant > 0.5)) { const f = ch.floorAt(pt.x, pt.z) + 0.035;"),
    ("for (const sh of (nearHand ? opp : own.concat(opp))) {", "for (const sh of (P.pierce > 0.5 ? (nearHand ? [] : own) : nearHand ? opp : own.concat(opp))) {"),
])
patch('fight_w/fight.js', [
    ("reaper: { file: 'goldreaper', cfg: 'reaper' },", "reaper: { file: 'goldreaper', cfg: 'reaper' }, lance: { file: 'lancebolt', cfg: 'spear' },"),
    ("duel40: [WP.spear, WP.reaper],", "duel40: [WP.spear, WP.reaper], bolt30: [WP.spear, WP.lance],"),
    ("(['duel40', 't1', 't2', 't3'].includes(VID) ? 3.6 : 4.0)", "(['duel40', 't1', 't2', 't3', 'bolt30'].includes(VID) ? 3.6 : 4.0)"),
    ("{ spear: 1, hammer: 2, bow: 3, duel40: 1, t1: 1, t2: 2, t3: 3 }[VID]", "{ spear: 1, hammer: 2, bow: 3, duel40: 1, t1: 1, t2: 2, t3: 3, bolt30: 1 }[VID]"),
    ("duel40: 'BOLTSPEAR VS GOLDREAPER',", "duel40: 'BOLTSPEAR VS GOLDREAPER', bolt30: 'BOLTSPEAR VS LANCEBOLT',"),
    # drawState: optional camera override (intro panels)
    ("function drawState(t) {\n", "function drawState(t, camOv) {\n"),
    ("  let cam = C.camera(t, cast);\n", "  let cam = camOv ? camOv(cast) : C.camera(t, cast);\n"),
    # split-panel intro: each fighter's face in its own slanted, tinted panel (reference: three-panel anime close-ups)
    ("const fill = document.getElementById('fill');\n",
     """const fill = document.getElementById('fill');
const panelMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  uniforms: { map: { value: null }, x0: { value: 0 }, x1: { value: 1 }, slant: { value: 0.1 }, tintD: { value: new THREE.Color() }, tintL: { value: new THREE.Color() }, time: { value: 0 }, open: { value: 1 }, dir: { value: 1 }, white: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D map; uniform float x0, x1, slant, time, open, dir, white; uniform vec3 tintD, tintL; varying vec2 vUv;
    float hs(float n){ return fract(sin(n * 127.1) * 43758.5453); }
    void main(){ float xs = vUv.x + slant * (vUv.y - 0.5); if (xs < x0 || xs > x1) discard;
      float yy = dir > 0.0 ? vUv.y : 1.0 - vUv.y; if (yy > open) discard;                     // panels wipe in from opposite ends
      vec2 uv = vec2(vUv.x - (x0 + x1) * 0.5 + 0.5, vUv.y); vec3 c = texture2D(map, clamp(uv, 0.0, 1.0)).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); l = smoothstep(0.04, 0.92, l);
      vec3 duo = mix(tintD, tintL, l); c = mix(c, duo, 0.72);                                  // duotone wash per fighter
      float col = floor(vUv.x * 520.0), ph = fract(vUv.y * (0.7 + hs(col)) + time * (0.9 + hs(col + 7.0)) + hs(col + 3.0));
      float streak = step(0.93, hs(col + 11.0)) * smoothstep(0.0, 0.08, ph) * smoothstep(0.42, 0.08, ph);   // falling streaks (rain / ink lines)
      c += tintL * streak * 0.22;
      float edge = min(xs - x0, x1 - xs); c *= 0.55 + 0.45 * smoothstep(0.0, 0.07, edge);     // dark panel borders
      c = mix(c, vec3(1.0), white);
      gl_FragColor = vec4(c, 1.0); }` });
const panelScene = new THREE.Scene(); panelScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), panelMat));
function renderPanels(t, tv) {
  const cams = C.panelCams(t), P = C.PANELS;
  renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 0); renderer.clear();
  cams.forEach((cf, i) => {
    drawState(t, cf); for (const k of ['A', 'B']) { TRAIL[k].mesh.visible = false; GHOSTS[k].forEach(g => g.visible = false); }
    grade.uniforms.flash.value = 0; grade.uniforms.black.value = 0; grade.uniforms.impact.value = 0; grade.uniforms.ca.value = 0.25;
    composer.render();
    const u = panelMat.uniforms, pd = P.panels[i]; u.map.value = composer.readBuffer.texture; u.x0.value = pd.x0; u.x1.value = pd.x1; u.slant.value = P.slant; u.tintD.value.setRGB(...pd.dark); u.tintL.value.setRGB(...pd.light);
    u.time.value = t; u.dir.value = i % 2 ? -1 : 1; u.open.value = Math.min(1, Math.max(0, (t - pd.t0) / 0.3)); u.open.value = 1 - Math.pow(1 - u.open.value, 3); u.white.value = Math.max(0, 1 - (P.t1 - t) / 0.07);
    renderer.setRenderTarget(acc); renderer.autoClear = false; renderer.render(panelScene, quadCam); renderer.autoClear = true;
  });
  outMat.uniforms.map.value = acc.texture; renderer.setRenderTarget(null); renderer.render(outScene, quadCam);
  fill.style.width = (300 * Math.min(1, tv / (C.videoAt ? C.videoAt(C.TOTAL) : C.TOTAL))) + 'px';
  return 'panel';
}
"""),
    ("  const t = C.animAt ? C.animAt(tv) : tv, rate = C.rateAt ? C.rateAt(t) : 1;\n",
     "  const t = C.animAt ? C.animAt(tv) : tv, rate = C.rateAt ? C.rateAt(t) : 1;\n  if (C.panelAt && C.panelAt(t)) return renderPanels(t, tv);\n"),
])
patch('fight/fight_sfx3.py', [
    ("       # 10 s mechanics tests: 'kinds' picks each fighter's swing sound by weapon\n",
     "       # bolt30 (Boltspear vs Lancebolt, 29 s animation + 1 s of slow motion): spear vs spear\n"
     "       'bolt30': dict(total=30.0, mute=[], big=(2.95, 13.3, 25.6), fall=28.4, cross=26.32, bind=(0, 0), impact=True, wpn='duel', kinds={'A': 'spear', 'B': 'spear'},\n"
     "                      drop=['clash/desert_01.wav'], events='fight_w/comp/events_bolt30.json', out='fight_w/comp/audio_bolt30.m4a'),\n"
     "       # 10 s mechanics tests: 'kinds' picks each fighter's swing sound by weapon\n"),
    ("    if kind == 'arrowg':", "    if kind == 'drag': noise(2, t, -15, 0.16, 300, 3200); continue          # spear head dragged through the sand\n    if kind == 'arrowg':"),
])
