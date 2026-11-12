// fight4: 2 v 2. Two duels (choreo_duo1.js, choreo_duo2.js: the normal two-fighter engine, each with its own footwork, clash solve and
// blade physics) run side by side in one arena with ONE camera and one effects pass. duo_director.js owns what crosses the duels:
// the camera shot list, slow motion, pose hooks (an archer aiming at the other duel), cross-duel arrows, a weapon knocked out of a
// hand, and the logo outro. No corner HUD. Built from fight.js (same renderer, lights, post). window.renderAt(tv) draws video time tv.
//   QA tools: ?probe=1|2 picks which duel window.__probe exposes.
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadSkin, buildCharacter, buildWeapon, applyPose, setTwist } from './rig2_w.js';
const DIR = await import('./duo_director.js');
const C1 = await import('./choreo_duo1.js'), C2 = await import('./choreo_duo2.js');

const W = 1920, H = 1080, params = new URLSearchParams(location.search);
if (params.get('twist') !== null) setTwist(+params.get('twist'));
const SUB = +(params.get('sub') || 5);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const FOGC = new THREE.Color(0.93, 0.84, 0.7);
scene.fog = new THREE.FogExp2(FOGC, 0.006);
scene.background = FOGC.clone();

// ------------------------------------------------------------------ cold overcast light (Marlow): cool sky, pale low sun behind, warm only from sparks
// v7: high overhead sun (light from above, shadows pooled under the fighters), less sky fill for contrast
// v8: the user liked the BRIGHT overhead sun of the v7 QA stills (sand lit up); v7's final render had toned it down. Restore it.
const hemi = new THREE.HemisphereLight(0x9fc2ff, 0xd8b98a, +(params.get('hemi') ?? 1.05)); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, +(params.get('sunI') ?? 3.6)); sun.castShadow = true;
renderer.toneMappingExposure = +(params.get('exp') ?? 1.0);
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 1.5;
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 260 }); scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0xffd6a0, 0.8); scene.add(rim, rim.target);
const fillL = new THREE.DirectionalLight(0xfff0dc, 0.35); scene.add(fillL, fillL.target);
const sparkL = new THREE.PointLight(0xffa860, 0, 4.5, 2.0); scene.add(sparkL);

// ------------------------------------------------------------------ arena
const base = '/anim-test/fight/assets/';
const mtl = await new MTLLoader().setPath(base + 'colosseum/').loadAsync('B.mtl'); mtl.preload();
for (const k in mtl.materials) {
  const m = mtl.materials[k];
  if (m.map) { m.map.magFilter = THREE.NearestFilter; m.map.minFilter = THREE.NearestMipmapLinearFilter; m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = 8; }
  if (!/grass|leaves|vine|fern|lily|redstone/.test(k)) m.color.setRGB(1, 1, 1);
  m.alphaTest = 0.5; m.transparent = false; m.side = THREE.FrontSide;
}
const arenaObj = await new OBJLoader().setMaterials(mtl).setPath(base + 'colosseum/').loadAsync('B.obj');
const stdMats = new Map();
arenaObj.traverse(o => {
  if (!o.isMesh) return;
  const conv = m => { if (stdMats.has(m)) return stdMats.get(m);
    const s = new THREE.MeshStandardMaterial({ map: m.map, color: m.color, roughness: 0.92, metalness: 0, alphaTest: 0.5, side: THREE.FrontSide }); stdMats.set(m, s); return s; };
  o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  o.castShadow = true; o.receiveShadow = true;
});
scene.add(arenaObj);
// arena floor heightmap (raycast once on a grid)
const ray = new THREE.Raycaster(); const HM = new Map(); const meshes = []; arenaObj.traverse(o => o.isMesh && meshes.push(o));
arenaObj.updateMatrixWorld(true);
function floorAt(x, z) {
  const k = Math.round(x * 2) + ',' + Math.round(z * 2); if (HM.has(k)) return HM.get(k);
  ray.set(new THREE.Vector3(Math.round(x * 2) / 2, 60, Math.round(z * 2) / 2), new THREE.Vector3(0, -1, 0)); ray.far = 80;
  const h = ray.intersectObjects(meshes, false).find(i => i.face && i.face.normal.y > 0.5);
  const y = h ? h.point.y : 30; HM.set(k, y); return y;
}
const FLOOR = floorAt(0, 0);
console.log('FLOOR', FLOOR);


// ------------------------------------------------------------------ cast: duel 1 = Blinkblade (A) vs Boltspear (B); duel 2 = Jingu Bang (A) vs Seekerbow (B)
const WB_ = base + 'w2/';
const WCFG = {
  blinkblade: { seg: [4, 9, 14, 19, 24, 28], cseg: [8, 27], tip: 28, trail: [9, 27.5], edgeUp: 'x' },
  boltspear: { seg: [-16, -10, -4, 4, 10, 16, 21], cseg: [5, 21.5], tip: 21.5, trail: [9, 21.5], lh: 6, th: true, edgeUp: 'z' },   // th = true two-handed grip (rig2_w); lh +6 = second fist 6 px AHEAD of the main one
  'jingu bang': { seg: [-22, -16, -10, -4, 4, 10, 16], cseg: [-21, 16], tip: 16.3, trail: [5, 16.3], lh: 8, th: true },
  seekerbow: { seg: [-15, -8, 0, 8, 15], cseg: [-15, 15], tip: 15, trail: null, bow: { top: [0, 11.3, 4.85], bot: [0, -11.3, 4.85], nock: [0, 0, 4.85] }, hand: 'l', twist: +(params.get('btw') ?? 270) * Math.PI / 180 } };
const SETUP = [{ C: C1, w: ['blinkblade', 'boltspear'], skin: ['1', '3'], trail: [[1.0, 0.75, 1.0], [0.75, 0.92, 1.0]] }, { C: C2, w: ['jingu bang', 'seekerbow'], skin: ['4', '2'], trail: [[1.0, 0.85, 0.55], [0.8, 0.95, 1.0]] }];
const SC = 0.69 * 1.15;
const skins = {}; for (const n of ['1', '2', '3', '4']) skins[n] = await loadSkin('/anim-test/src/skins/' + n + '.png');
const wjson = {}; for (const s of SETUP) for (const n of s.w) { wjson[n] = await fetch(WB_ + n + '.json').then(r => r.json()); }
wjson.seekerbow.quads = wjson.seekerbow.quads.filter(q => q.e !== 'artemis_bow_1' && q.e !== 'artemis_bow_19');   // the model's straight string: the animated string replaces it
await new Promise(r => setTimeout(r, 400));
const world = { floorAt, FLOOR };
function segClosest(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  const c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b; let s = den > 1e-6 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0;
  let tt = (b * s + f) / e; if (tt < 0) { tt = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1); } else if (tt > 1) { tt = 1; s = THREE.MathUtils.clamp((b - c) / a, 0, 1); }
  const c1 = p1.clone().addScaledVector(d1, s), c2 = p2.clone().addScaledVector(d2, tt); return { mid: c1.clone().lerp(c2, 0.5), dist: c1.distanceTo(c2) };
}
const GAP_MIN = 0.78, VARS = ['ax', 'az', 'el', 'wr', 'ba', 'ch', 'fw'], LIM0 = { ax: 60, az: 60, el: 50, wr: 50, ba: 70, ch: 45, fw: 1.2 }, LIM3 = { ax: 80, az: 80, el: 65, wr: 75, ba: 100, ch: 55, fw: 0 };
let READY = false; const DUELS = [], ctx = { DUELS, THREE, floorAt, FLOOR, applyPose };

function makeDuel(S, id) {
  const C = S.C, cast = {};
  ['A', 'B'].forEach((k, i) => { const w = WCFG[S.w[i]]; cast[k] = buildCharacter(skins[S.skin[i]], buildWeapon(wjson[S.w[i]], WB_), SC, w);
    Object.assign(cast[k], { cseg: w.cseg, tip: w.tip, trail: w.trail, floorAt, wname: S.w[i], th: !!w.th }); cast[k].weapon.parent.position.y += 1.5;   // sheet rule: the weapon axis runs through the centre of the fist
    scene.add(cast[k].root); });
  C.init(world);
  const _v = new THREE.Vector3();
  const P = (k, t) => { const p = C.pose(k, t); return READY && DIR.poseHook ? (DIR.poseHook(id, k, t, p, ctx) || p) : p; };
  const blade = (k, t, along) => { applyPose(cast[k], P(k, t)); cast[k].root.updateMatrixWorld(true); return along.map(a => cast[k].weapon.localToWorld(_v.set(0, a, 0).clone())); };
  const bladeDist = t => { const [a0, a1] = blade('A', t, cast.A.cseg), [b0, b1] = blade('B', t, cast.B.cseg); return segClosest(a0, a1, b0, b1).dist; };
  const bodyGap = t => { const a = C.pose('A', t).pos, b = C.pose('B', t).pos; return Math.hypot(a[0] - b[0], a[2] - b[2]); };
  const selfDepth = (k, t) => { const ch = cast[k]; applyPose(ch, C.pose(k, t)); ch.root.updateMatrixWorld(true); const b = ch.bones, hd = b.head.localToWorld(new THREE.Vector3(0, 4, 0));
    const hp = b.hips.getWorldPosition(new THREE.Vector3()), nk = b.neck.getWorldPosition(new THREE.Vector3()); let dmax = 0;
    for (const a of (ch.wspan || ch.seg)) { if (Math.abs(a) < 2.5 || (ch.lh != null && Math.abs(a - ch.lh) < 2.5)) continue; const p = ch.weapon.localToWorld(new THREE.Vector3(0, a, 0));
      dmax = Math.max(dmax, 0.45 - p.distanceTo(hd)); const ab = nk.clone().sub(hp), u = Math.max(0, Math.min(1, p.clone().sub(hp).dot(ab) / ab.lengthSq())); dmax = Math.max(dmax, 0.3 - p.distanceTo(hp.clone().addScaledVector(ab, u))); }
    return Math.max(0, dmax); };
  { const pick = []; for (const r of C.PARRY) { let best = null;
      for (const n of (r.cands || ['parryL', 'parryR', 'parryH'])) { r.apply(n); const d = bladeDist(r.t) + 3 * selfDepth(r.def, r.t); if (!best || d < best[1] - 0.02) best = [n, d]; }
      r.apply(best[0]); pick.push([r.t, best[0], +best[1].toFixed(2)]); }
    C.resim(false); console.warn('PARRY' + id, JSON.stringify(pick)); }
  const SOL = {};
  const FAST = !!params.get('fast');
  for (let passN = 0; passN < (FAST ? 1 : 3); passN++) {
    const LIM = passN === 2 ? LIM3 : LIM0, V = passN === 2 ? VARS.filter(v => v !== 'fw') : VARS;
    for (const cl of C.CLASHES) {
      if (cl.at || !(cl.kind === 'blade' || cl.kind === 'cross')) continue;
      if (!SOL[cl.t]) { const eA = { t: cl.t, ax: 0, az: 0, el: 0, wr: 0, ba: 0, ch: 0, fw: 0 }, eB = { ...eA }; C.CORR.A.push(eA); C.CORR.B.push(eB); SOL[cl.t] = [eA, eB]; }
      const [eA, eB] = SOL[cl.t];
      const f = () => bladeDist(cl.t) + 0.0003 * VARS.reduce((s, v) => s + (v === 'fw' ? 400 : 1) * (eA[v] * eA[v] + eB[v] * eB[v]), 0) + 6 * Math.max(0, GAP_MIN - bodyGap(cl.t));
      let best = f();
      if (passN === 2 && bladeDist(cl.t) < 0.12) continue;
      for (const step of passN ? [4, 2, 1, 0.5] : [16, 8, 4, 2, 1]) for (let pass = 0; pass < 8; pass++) { let imp = false;
        for (const e of [eA, eB]) for (const v of V) for (const sgn of [1, -1]) {
          const old = e[v], nv = THREE.MathUtils.clamp(old + sgn * (v === 'fw' ? step / 20 : step), v === 'fw' ? 0 : -LIM[v], LIM[v]); if (nv === old) continue; e[v] = nv; const fv = f();
          if (fv < best - 1e-4) { best = fv; imp = true; } else e[v] = old; }
        if (!imp) break; }
    }
    if (passN < 2) C.resim(false);
  }
  C.resim(true);
  if (C.setGrip && !FAST) {   // support-hand grip release (never force a grip): as fight.js
    const GHZ = 60, NG = Math.ceil(C.TOTAL * GHZ) + 2, REACH_OUT = 1.2, REACH_IN = 1.08, VMAX = 12, REGRIP = 0.3, tab = {}, dbg = {};
    for (const k of ['A', 'B']) { const w = new Float32Array(NG).fill(1); let held = false, fresh = true, good = 0, prev = null; dbg[k] = [];
      for (let i = 0; i < NG; i++) { const t = i / GHZ, pz = C.pose(k, t); applyPose(cast[k], pz); const r = cast[k].gripReach, q = cast[k].gripLocal;
        if (r == null || Math.max(pz.lh || 0, pz.rh || 0) < 0.5) { held = false; fresh = true; good = 0; prev = null; w[i] = 1; continue; }
        const v = prev ? q.distanceTo(prev) / 16 * GHZ : 0; prev = q.clone();
        const bad = r > REACH_OUT, ok = r < REACH_IN && v < VMAX;
        if (held && bad) { held = false; fresh = false; good = 0; dbg[k].push(+t.toFixed(2)); }
        else if (!held) { if (fresh) { if (ok) held = true; } else { good = ok ? good + 1 / GHZ : 0; if (good >= REGRIP) held = true; } }
        w[i] = held ? 1 : 0; }
      const d = Math.round(0.07 * GHZ), e = w.slice(); for (let i = 0; i < NG; i++) { let m = 1; for (let j = -d; j <= d; j++) m = Math.min(m, w[Math.max(0, Math.min(NG - 1, i + j))]); e[i] = m; }
      const sg = 0.06 * GHZ, s = new Float32Array(NG); for (let i = 0; i < NG; i++) { let a = 0, ws = 0; for (let j = -12; j <= 12; j++) { const g = Math.exp(-0.5 * (j / sg) ** 2); a += e[Math.max(0, Math.min(NG - 1, i + j))] * g; ws += g; } s[i] = a / ws; }
      tab[k] = { hz: GHZ, w: Array.from(s) }; }
    C.setGrip(tab); console.warn('GRIP releases' + id, JSON.stringify(dbg));
  }
  { const GH = []; let last = -9;
    for (let t = 0.1; t < C.TOTAL; t += 1 / 60) for (const k of ['A', 'B']) {
      const [tip] = blade(k, t, [cast[k].tip]), [tp] = blade(k, t - 1 / 60, [cast[k].tip]), sp = tip.distanceTo(tp) * 60, fl = floorAt(tip.x, tip.z);
      if (tip.y < fl + 0.1 && sp > 5 && t - last > 0.12) { GH.push({ t, p: [tip.x, fl, tip.z], k }); last = t; } }
    C.setGroundHits(GH); console.log('GROUNDHITS' + id, GH.length); }
  const contacts = C.CLASHES.map(cl => {
    if (cl.at) return { ...cl, p: cl.at(cast, blade) };
    const [a0, a1] = blade('A', cl.t, cast.A.cseg), [b0, b1] = blade('B', cl.t, cast.B.cseg); const r = segClosest(a0, a1, b0, b1);
    return { ...cl, p: r.mid.toArray(), dist: r.dist }; });
  console.log('CLASHES' + id, JSON.stringify(contacts.map(c => [c.t, c.p.map(v => +v.toFixed(2)), +(c.dist || 0).toFixed(2)])));
  C.setContacts(contacts);
  const duel = { id, C, cast, P, blade, S, contacts, ARR: [], ARROW_L: 0.85 };
  // arrows (the bow is always fighter B): built after BOTH duels exist, because a 'x' arrow flies at the other duel
  duel.buildArrows = () => { if (!(C.ARROWS || []).length) return;
    { const a = C.ARROWS[0]; applyPose(cast.B, P('B', a.t0 - 0.02)); cast.B.root.updateMatrixWorld(true);
      duel.ARROW_L = cast.B.bones.rHand.getWorldPosition(new THREE.Vector3()).distanceTo(cast.B.bones.lHand.getWorldPosition(new THREE.Vector3())) + 0.16; }
    duel.ARR = C.ARROWS.map((a, i) => {
      applyPose(cast.B, P('B', a.t0)); cast.B.root.updateMatrixWorld(true);
      const rh = cast.B.bones.rHand.getWorldPosition(new THREE.Vector3()), lh = cast.B.bones.lHand.getWorldPosition(new THREE.Vector3());
      const from = rh.clone().add(lh.clone().sub(rh).normalize().multiplyScalar(duel.ARROW_L));
      const pa = C.pose('A', a.t1).pos; let to;
      if (a.mode === 'x') to = DIR.arrowTarget(a, ctx);                                        // cross-duel shot: the director says what it hits
      else if (a.mode === 'deflect') to = blade('A', a.t1, [a.along ?? 8])[0].clone();
      else if (a.mode === 'ground') to = new THREE.Vector3(pa[0] + (a.dx || 0), floorAt(pa[0], pa[2]) + 0.02, pa[2] + (a.dz || 0));
      else if (a.mode === 'hit') to = new THREE.Vector3(pa[0], pa[1] + 1.25, pa[2]);                // into the body: the arrow stops there
      else to = new THREE.Vector3(pa[0] + (a.dx || 0.55), pa[1] + 1.35, pa[2] + (a.dz || 0));
      const dir = to.clone().sub(from).normalize(), h = (k) => { const x = Math.sin(i * 91.3 + k * 17.7 + id * 5.1) * 43758.5; return x - Math.floor(x); };
      const out = new THREE.Vector3(h(1) - 0.5, 0.9 + 0.6 * h(2), h(3) - 0.5).normalize().multiplyScalar(5 + 3 * h(4)).add(dir.clone().multiplyScalar(-2.5));
      return { ...a, from, to, dir, out, spin: 14 + 10 * h(5) }; });
    console.warn('ARROWS' + id, JSON.stringify(duel.ARR.map(a => [a.t0, a.t1, a.mode, +a.from.distanceTo(a.to).toFixed(2)]))); };
  return duel;
}
SETUP.forEach((S, i) => DUELS.push(makeDuel(S, i + 1)));
READY = true; if (DIR.init) DIR.init(ctx);
DUELS.forEach(d => d.buildArrows());
let ARROW_L = Math.max(...DUELS.map(d => d.ARROW_L));
function arrowAt(a, t) {   // -> { p, d } or null
  if (t < a.t0) return null;
  if (t <= a.t1) { const u = (t - a.t0) / Math.max(1e-3, a.t1 - a.t0); return { p: a.from.clone().lerp(a.to, u), d: a.dir }; }
  const d = t - a.t1; if (a.mode === 'hit') return null;
  if (a.mode === 'deflect' || a.mode === 'x') { const p = a.to.clone().addScaledVector(a.out, d); p.y -= 4.9 * d * d; const fl = floorAt(p.x, p.z);
    const ang = a.spin * d, dd = new THREE.Vector3(Math.cos(ang), Math.sin(ang) * 0.6, Math.sin(ang)).normalize();
    if (p.y < fl + 0.05) { let tl = d; for (let k = 0; k < 30; k++) { const q = a.to.y + a.out.y * tl - 4.9 * tl * tl - fl; tl += q > 0.05 ? 0.004 : -0.004; }
      const pl = a.to.clone().addScaledVector(a.out, tl); pl.y = fl + 0.05; return { p: pl, d: new THREE.Vector3(0.3, -1, 0.2).normalize(), stuck: true }; }
    return { p, d: dd, tumble: true }; }
  if (a.mode === 'ground') return { p: a.to.clone().addScaledVector(a.dir, 0.25), d: a.dir, stuck: true };
  const p = a.to.clone().addScaledVector(a.dir, 30 * d); p.y -= 2 * d * d; const fl = floorAt(p.x, p.z);
  if (p.y < fl + 0.1 || d > 0.6) return d > 0.6 ? null : { p, d: a.dir }; return { p, d: a.dir };
}

// ------------------------------------------------------------------ fx objects
function softTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  if (kind === 'star') {
    let gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,230,190,0.9)'); gr.addColorStop(1, 'rgba(255,160,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.globalCompositeOperation = 'lighter';
    for (const [w, h] of [[128, 5], [5, 70], [90, 3]]) { const lg = g.createLinearGradient(64 - w / 2, 0, 64 + w / 2, 0); g.fillStyle = 'rgba(255,240,215,0.9)'; g.fillRect(64 - w / 2, 64 - h / 2, w, h); }
  } else if (kind === 'ring') {
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 7; g.filter = 'blur(3px)'; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
  } else { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX = { star: softTex('star'), ring: softTex('ring'), soft: softTex('soft') };
function spritePool(n, tex, blending) {
  const arr = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending, transparent: true, depthWrite: false, fog: false })); s.visible = false; scene.add(s); arr.push(s); } return arr;
}
const FLARES = spritePool(6, TEX.star, THREE.AdditiveBlending), RINGS = spritePool(6, TEX.ring, THREE.AdditiveBlending);
function particleLayer(n, additive) {
  const g = new THREE.BufferGeometry();
  for (const [k, d] of [['position', 3], ['color', 3], ['size', 1], ['alpha', 1]]) g.setAttribute(k, new THREE.Float32BufferAttribute(new Float32Array(n * d), d));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC;
      void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = min(size * (900.0 / -mv.z), 64.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC, smoothstep(0.5, 0.0, d) * vA); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return { g, n };
}
const PADD = particleLayer(1500, true), PSOFT = particleLayer(5000, false);
function writeP(L, list) {
  const a = L.g.attributes; for (let i = 0; i < L.n; i++) { const q = list[i];
    if (!q) { a.alpha.array[i] = 0; a.size.array[i] = 0; continue; } a.position.array.set(q.p, i * 3); a.color.array.set(q.c, i * 3); a.size.array[i] = q.s; a.alpha.array[i] = q.a; }
  for (const k in a) a[k].needsUpdate = true;
}
// debris: block chunks (instanced cubes with the arena sand texture)
const sandTex = new THREE.TextureLoader().load(base + 'colosseum/tex/minecraft/block/sand.png'); sandTex.magFilter = THREE.NearestFilter; sandTex.colorSpace = THREE.SRGBColorSpace;
const DEB = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }), 80); DEB.castShadow = true; scene.add(DEB);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
// trails: ribbons from blade 30%..tip over the last ~0.1 s, opacity from blade-tip speed
function trailMesh(col) {
  const N = 18, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 2 * 3), 3)); g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(N * 2), 1));
  const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { col: { value: new THREE.Color(...col) } },
    vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 col; varying float vA; void main(){ gl_FragColor = vec4(col * vA, vA); }' });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh); return { g, N, mesh };
}
const FP = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.26).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6b5236, alphaMap: TEX.soft, transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), 600);
FP.frustumCulled = false; scene.add(FP);
function updatePrints(t) {
  let n = 0;
  for (const D of DUELS) for (const s of D.C.STEPS) { if (s.t > t || n >= 600 || (s.kind !== 'step' && s.kind !== 'land' && s.kind !== 'skid')) continue;
    const y = floorAt(s.p[0], s.p[2]) + 0.012; _q.setFromEuler(_e.set(0, s.c === 'A' ? 0.3 : -0.3, 0));
    _m.compose(new THREE.Vector3(s.p[0], y, s.p[2]), _q, new THREE.Vector3(s.kind === 'skid' ? 1.5 : 1, 1, s.kind === 'skid' ? 1.8 : 1)); FP.setMatrixAt(n++, _m); }
  FP.count = n; FP.instanceMatrix.needsUpdate = true;
}
function arrowMesh() {
  const g = new THREE.Group(), M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const Lx = ARROW_L, sh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, Lx - 0.12), M(0x8a6a44)); sh.position.z = (Lx - 0.12) / 2; g.add(sh);   // tail at z=0
  const hd = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4).rotateX(Math.PI / 2), M(0x9a9aa2)); hd.position.z = Lx - 0.08; g.add(hd);
  for (const r of [0, Math.PI / 2]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.2), M(0xf0f0ee)); f.position.z = 0.12; f.rotation.z = r; g.add(f); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.visible = false; scene.add(g); return g;
}
const ARROWM = Array.from({ length: 8 }, arrowMesh);
// bowstring: two thin cylinders top -> hand -> bottom
const STRM = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 5), new THREE.MeshStandardMaterial({ color: 0x2a1838, roughness: 0.6, emissive: 0x2a0a40 })); m.visible = false; scene.add(m); return m; });
function placeSeg(m, a, b) { const d = b.clone().sub(a), L = d.length(); if (L < 1e-4) { m.visible = false; return; } m.visible = true; m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
for (const D of DUELS) { D.TRAIL = { A: trailMesh(D.S.trail[0]), B: trailMesh(D.S.trail[1]) }; D.GHOSTS = {};
  D.STRM = [0, 1].map(() => { const m = STRM[0].clone(); m.material = STRM[0].material; m.visible = false; scene.add(m); return m; });
  for (const k of ['A', 'B']) { D.GHOSTS[k] = [];
    for (let i = 0; i < 3; i++) { const g = D.cast[k].weapon.clone(true); g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.depthWrite = false; o.castShadow = false; } });
      g.matrixAutoUpdate = false; g.visible = false; scene.add(g); D.GHOSTS[k].push(g); } } }
STRM.forEach(m => m.visible = false);
// a weapon knocked out of a hand (director: DISARM = [{ duel, k, t, v: [x, y, z] blocks/s, spin }]): the held weapon is hidden and a copy
// flies off on a ballistic arc, tumbling, until it lands on the sand
const DIS = (DIR.DISARM || []).map(d => { const D = DUELS[d.duel - 1], g = D.cast[d.k].weapon.clone(true); g.matrixAutoUpdate = false; g.visible = false; scene.add(g);
  D.blade(d.k, d.t, [0]); const M0 = D.cast[d.k].weapon.matrixWorld.clone(), p0 = new THREE.Vector3(), q0 = new THREE.Quaternion(), s0 = new THREE.Vector3(); M0.decompose(p0, q0, s0);
  const c0 = D.cast[d.k].weapon.localToWorld(new THREE.Vector3(0, d.mid ?? 0, 0)), v = new THREE.Vector3(...d.v), fl = floorAt(c0.x + v.x * 0.6, c0.z + v.z * 0.6) + 0.12;
  let tl = 0; while (tl < 3 && c0.y + v.y * tl - 4.9 * tl * tl > fl) tl += 1 / 240;
  const ax = new THREE.Vector3(...(d.axis || [0.3, 0.2, 1])).normalize(); return { ...d, D, g, p0, q0, s0, c0, v, tl, ax }; });
const disarmed = (D, k, t) => DIS.some(d => d.D === D && d.k === k && t >= d.t);
window.disarmInfo = () => DIS.map(d => ({ t: d.t, land: +(d.t + d.tl).toFixed(2), at: d.c0.clone().addScaledVector(d.v, d.tl).toArray().map(x => +x.toFixed(2)) }));
function updateDisarm(t) {
  for (const d of DIS) { const on = t >= d.t; d.D.cast[d.k].weapon.visible = !on; d.g.visible = on; if (!on) continue;
    const u = Math.min(t - d.t, d.tl), c = d.c0.clone().addScaledVector(d.v, u); c.y -= 4.9 * u * u;
    // spin about the weapon's centre; the last 20 % of the flight eases the weapon flat onto the sand
    const q = new THREE.Quaternion().setFromAxisAngle(d.ax, d.spin * u).multiply(d.q0), flat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d.v.x, 0, d.v.z).normalize());
    q.slerp(flat, THREE.MathUtils.smoothstep(u / d.tl, 0.8, 1));
    const off = d.p0.clone().sub(d.c0).applyQuaternion(q.clone().multiply(d.q0.clone().invert()));
    d.g.matrix.compose(c.add(off), q, d.s0); d.g.matrixWorldNeedsUpdate = true; }
}
function updateBows(t) {
  ARROWM.forEach(m => m.visible = false); let n = 0;
  const put = (tail, d) => { if (n >= ARROWM.length) return; const m = ARROWM[n++]; m.visible = true; m.position.copy(tail); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.clone().normalize()); };
  for (const D of DUELS) { const sp = D.cast.B.stringPts; D.STRM.forEach(m => m.visible = false);
    if (sp) { placeSeg(D.STRM[0], sp[0], sp[1]); placeSeg(D.STRM[1], sp[1], sp[2]); }
    for (const a of D.ARR) {
      if (t >= a.tn && t < a.t0 && sp) { const hand = sp[1], grip = D.cast.B.bones.lHand.getWorldPosition(new THREE.Vector3()), d = grip.sub(hand);
        put(hand, d.length() > 0.05 ? d.normalize() : a.to.clone().sub(hand).normalize()); }
      const q = arrowAt(a, t); if (q) put(q.p.clone().addScaledVector(q.d, -(q.stuck ? 0.55 : q.tumble ? 0.5 : 1) * ARROW_L), q.d); } }
}
function updateGhosts(t, gate) {
  for (const D of DUELS) for (const k of ['A', 'B']) {
    if (disarmed(D, k, t) || !D.cast[k].trail) { D.GHOSTS[k].forEach(g => g.visible = false); continue; }
    const now = D.blade(k, t, [D.cast[k].tip - 4])[0], prev = D.blade(k, t - 1 / 60, [D.cast[k].tip - 4])[0], sp = now.distanceTo(prev) * 60;
    const on = THREE.MathUtils.clamp((sp - 10) / 14, 0, 1) * gate;
    D.GHOSTS[k].forEach((g, i) => { g.visible = on > 0.02; if (!g.visible) return;
      applyPose(D.cast[k], D.P(k, t - (i + 1) * 0.011)); D.cast[k].root.updateMatrixWorld(true);
      g.matrix.copy(D.cast[k].weapon.matrixWorld); g.matrixWorldNeedsUpdate = true;
      g.traverse(o => { if (o.isMesh) o.material.opacity = on * (0.42 - i * 0.12); }); });
  }
}

// ------------------------------------------------------------------ post: bloom + grade
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 600);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.renderToScreen = false;
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 0.88); composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, flash: { value: 0 }, black: { value: 0 }, ca: { value: 0 }, impact: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float flash, black, ca, impact; varying vec2 vUv;
    void main(){ vec2 d = vUv - 0.5; float r2 = dot(d, d);
      vec3 c; c.r = texture2D(tDiffuse, vUv + d * ca * 0.025).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv - d * ca * 0.025).b;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.08);                                                         // warm desert grade (Desert Arena), slight saturation lift
      c += vec3(-0.008, 0.0, 0.018) * (1.0 - clamp(l, 0.0, 1.0)) + vec3(0.02, 0.01, -0.012) * clamp(l, 0.0, 1.0);
      c *= 1.0 - 0.6 * r2;
      if (impact > 0.5) {   // anime impact frame: hot core stays white, everything else inverted to black ink, rim from local contrast
        float m = smoothstep(1.15, 1.3, l);
        vec2 px = vec2(1.0 / 1920.0, 1.0 / 1080.0) * 2.0; float e = 0.0;
        for (int i = 0; i < 4; i++) { vec2 o = vec2(i == 0 ? 1.0 : i == 1 ? -1.0 : 0.0, i == 2 ? 1.0 : i == 3 ? -1.0 : 0.0) * px;
          e += abs(dot(texture2D(tDiffuse, vUv + o).rgb, vec3(0.333)) - dot(texture2D(tDiffuse, vUv).rgb, vec3(0.333))); }
        float ink = smoothstep(0.06, 0.16, e);
        c = mix(vec3(0.94, 0.9, 0.84), vec3(0.02, 0.015, 0.03), max(ink, 1.0 - smoothstep(0.08, 0.5, l)));
        c = mix(c, vec3(1.0, 0.97, 0.9), m); }  // anime impact frame
      c = mix(c, vec3(3.5, 3.2, 2.9), flash); c = mix(c, vec3(0.0), black);
      gl_FragColor = vec4(c, 1.0); }` });
composer.addPass(grade); composer.addPass(new OutputPass());
// accumulation for motion blur
const acc = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const accMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, transparent: true,       // explicit weighted add, alpha ignored
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  uniforms: { map: { value: null }, w: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D map; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb * w, w); }' });
const accScene = new THREE.Scene(); accScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat));
const outMat = new THREE.ShaderMaterial({ depthTest: false, uniforms: { map: { value: null } },   // raw pass-through (OutputPass already did sRGB)
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0); }' }); const outScene = new THREE.Scene(); outScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), outMat));

// ------------------------------------------------------------------ one sub-frame
function drawState(t) {
  const poseAll = () => { for (const D of DUELS) for (const k of ['A', 'B']) applyPose(D.cast[k], D.P(k, t)); };
  poseAll();
  const gate = DIR.trailGate ? DIR.trailGate(t, ctx) : 1;
  for (const D of DUELS) for (const k of ['A', 'B']) {
    const tr = D.TRAIL[k], Pa = tr.g.attributes.position.array, Al = tr.g.attributes.alpha.array; let any = false;
    if (!D.cast[k].trail || disarmed(D, k, t)) { tr.mesh.visible = false; continue; }
    const tips = []; for (let i = 0; i < tr.N; i++) tips.push(D.blade(k, t - i / 160, D.cast[k].trail));
    for (let i = 0; i < tr.N; i++) { const [b0, b1] = tips[i]; Pa.set([b0.x, b0.y, b0.z, b1.x, b1.y, b1.z], i * 6);
      const nxt = tips[Math.min(i + 1, tr.N - 1)][1]; const sp = b1.distanceTo(nxt) * 160;
      const a = THREE.MathUtils.clamp((sp - 9) / 18, 0, 1) * Math.pow(1 - i / tr.N, 1.4) * 0.85 * gate;
      Al[i * 2] = a * 0.05; Al[i * 2 + 1] = a; any = any || a > 0.01; }
    tr.mesh.visible = any; tr.g.attributes.position.needsUpdate = tr.g.attributes.alpha.needsUpdate = true;
  }
  updatePrints(t); updateGhosts(t, gate); poseAll();
  for (const D of DUELS) for (const k of ['A', 'B']) D.cast[k].root.updateMatrixWorld(true);
  let cam = DIR.camera(t, ctx);
  if (params.get('top') || window.__top) { cam = { pos: new THREE.Vector3(0, FLOOR + 20, -1.99), look: new THREE.Vector3(0, FLOOR, -2), fov: 50, roll: 0, label: 'top', src: 0 }; }
  if (params.get('iso')) { const D = DUELS[+params.get('iso') - 1], a = D.C.pose('A', t).pos, b = D.C.pose('B', t).pos, mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2;
    cam = { pos: new THREE.Vector3(mx, FLOOR + 1.5, mz + 7.2), look: new THREE.Vector3(mx, FLOOR + 1.0, mz), fov: 40, roll: 0, label: 'iso', src: 0 }; }
  updateBows(t); updateDisarm(t);
  camera.position.copy(cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(cam.look); if (cam.roll) camera.rotateZ(cam.roll);
  const focus = new THREE.Vector3(0, FLOOR, 0), fc = new THREE.Vector3(cam.look.x, FLOOR, cam.look.z);
  sun.position.copy(fc).add(new THREE.Vector3(-6, 110, -9)); sun.target.position.copy(fc);
  rim.position.copy(focus).add(new THREE.Vector3(70, 30, 60)); rim.target.position.copy(focus);
  fillL.position.copy(cam.pos).add(new THREE.Vector3(0, 3, 0)); fillL.target.position.copy(cam.look);
  // effects of both duels: particles from both; flash / impact frame only from the duel the camera is on (cam.src), or the director
  const F = DUELS.map(D => D.C.effects(t, camera)), fx = { add: [], soft: [], flares: [], rings: [], debris: [], flash: 0, black: 0, ca: 0, impact: 0, bloomBoost: 0, sparkLight: { i: 0, p: [0, 0, 0] } };
  F.forEach((f, i) => { for (const k of ['add', 'soft', 'flares', 'rings', 'debris']) fx[k].push(...f[k]); fx.bloomBoost = Math.max(fx.bloomBoost, f.bloomBoost); if (f.sparkLight.i > fx.sparkLight.i) fx.sparkLight = f.sparkLight;
    if (cam.src === i + 1) { fx.flash = f.flash; fx.ca = f.ca; fx.impact = cam.noImpact ? 0 : f.impact; } });
  if (DIR.effects) DIR.effects(t, fx, ctx);
  if (params.get('novfx')) { fx.add = []; fx.soft = []; fx.flares = []; fx.rings = []; fx.debris = []; fx.flash = 0; fx.black = 0; fx.ca = 0; fx.impact = 0; fx.bloomBoost = 0; fx.sparkLight = { i: 0, p: [0, 0, 0] }; }
  writeP(PADD, fx.add); writeP(PSOFT, fx.soft);
  FLARES.forEach((s, i) => { const f = fx.flares[i]; s.visible = !!f; if (f) { s.position.set(...f.p); s.scale.setScalar(f.s); s.material.opacity = f.a; s.material.color.setRGB(...(f.c || [3, 2.4, 1.6])); s.material.rotation = f.rot || 0; } });
  RINGS.forEach((s, i) => { const f = fx.rings[i]; s.visible = !!f; if (f) { s.position.set(...f.p); s.scale.setScalar(f.s); s.material.opacity = f.a; s.material.color.setRGB(1.6, 1.6, 1.8); } });
  for (let i = 0; i < 80; i++) { const d = fx.debris[i];
    if (!d) { _m.makeScale(0, 0, 0); } else { _q.setFromEuler(_e.set(...d.r)); _m.compose(new THREE.Vector3(...d.p), _q, new THREE.Vector3(d.s, d.s, d.s)); }
    DEB.setMatrixAt(i, _m); }
  DEB.instanceMatrix.needsUpdate = true;
  sparkL.intensity = fx.sparkLight.i; sparkL.position.set(...fx.sparkLight.p);
  grade.uniforms.flash.value = fx.flash; grade.uniforms.black.value = fx.black; grade.uniforms.ca.value = fx.ca; grade.uniforms.impact.value = fx.impact;
  bloom.strength = 0.42 + fx.bloomBoost;
  return cam;
}
// slow motion (director SLOWMO = [[ta0, ta1, rate]] in animation seconds): video time <-> animation time
const SLOW = (DIR.SLOWMO || []).slice().sort((a, b) => a[0] - b[0]);
function animAt(v) { let ta = 0, tv = 0; for (const [a0, a1, r] of SLOW) { if (v <= tv + (a0 - ta)) return ta + (v - tv); tv += a0 - ta; ta = a0; const dv = (a1 - a0) / r; if (v <= tv + dv) return a0 + (v - tv) * r; tv += dv; ta = a1; } return ta + (v - tv); }
function videoAt(t) { let ta = 0, tv = 0; for (const [a0, a1, r] of SLOW) { if (t <= a0) break; tv += a0 - ta; ta = a0; if (t <= a1) return tv + (t - a0) / r; tv += (a1 - a0) / r; ta = a1; } return tv + (t - ta); }
function rateAt(t) { for (const [a0, a1, r] of SLOW) if (t >= a0 && t <= a1) return r; return 1; }
window.renderAt = function (tv) {
  const t = Math.min(animAt(tv), DIR.TOTAL - 1e-3), rate = rateAt(t);
  const shutter = 0.5 / 30 * rate, n = (DIR.blurOK ? DIR.blurOK(t, ctx) : true) ? SUB : 1;
  renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 0); renderer.clear();
  let label = '';
  for (let i = 0; i < n; i++) { const ts = t + (n > 1 ? (i / (n - 1) - 0.5) * shutter : 0);
    label = drawState(ts).label; composer.render();
    accMat.uniforms.map.value = composer.readBuffer.texture; accMat.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(acc); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true; }
  outMat.uniforms.map.value = acc.texture; renderer.setRenderTarget(null); renderer.render(outScene, quadCam);
  if (DIR.overlay) DIR.overlay(tv, t, document);
  return label;
};
window.events = () => ({ duels: DUELS.map(D => D.C.events()), weapons: SETUP.map(s => s.w), slowmo: SLOW, video_total: DIR.VIDEO_TOTAL ?? videoAt(DIR.TOTAL), extra: DIR.EVENTS || [],
  arrows: DUELS.flatMap(D => D.ARR.map(a => [a.tn, a.t0, a.t1, a.mode, D.id])), disarm: window.disarmInfo() });
window.videoAt = videoAt; window.animAt = animAt;
{ const D = DUELS[+(params.get('probe') || 1) - 1]; window.__probe = { cast: D.cast, C: D.C, applyPose, THREE, floorAt }; window.__duels = DUELS; }
window.TOTAL = DIR.TOTAL; window.ready = true;
