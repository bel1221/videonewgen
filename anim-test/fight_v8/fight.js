// 20 s sword-fight test in the user's colosseum. Deterministic: window.renderAt(t) draws the frame at t (seconds),
// averaging SUB sub-frames across a 180-degree shutter for real motion blur.
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadSkin, buildCharacter, buildWeapon, applyPose, setTwist } from './rig2_v8.js';
import * as C from './choreo.js';

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
const sun = new THREE.DirectionalLight(0xfff1dc, +(params.get('sunI') ?? 4.0)); sun.castShadow = true;
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

// ------------------------------------------------------------------ cast
const [s1, s2, s3, aeg, veil] = await Promise.all([
  loadSkin('/anim-test/src/skins/1.png'), loadSkin('/anim-test/src/skins/2.png'), loadSkin('/anim-test/src/skins/3.png'),
  fetch(base + 'w/aegisblade.json').then(r => r.json()), fetch(base + 'w/veilblade.json').then(r => r.json())]);
const cast = { A: buildCharacter(s1, buildWeapon(aeg, base + 'w/'), 0.69 * 1.15), B: buildCharacter(s2, buildWeapon(veil, base + 'w/'), 0.69 * 1.15), C: buildCharacter(s3, null) };
// v8: sword model 1.15x (user). v7: Minecraft default grip - slide the sword back along the forearm so the fist wraps the handle under the guard
for (const k of ['A', 'B']) cast[k].weapon.parent.position.y += +(params.get('grip') ?? 1.6);
for (const k in cast) scene.add(cast[k].root);
window.__probe = { cast, C, applyPose, THREE, floorAt };
for (const k in cast) cast[k].floorAt = floorAt;   // blade/ground physics in rig2
await new Promise(r => setTimeout(r, 400));
const world = { floorAt, FLOOR };
C.init(world);

// blade points (px along the blade, grip at 0) in world space
const _v = new THREE.Vector3();
function blade(k, t, along) { applyPose(cast[k], C.pose(k, t)); cast[k].root.updateMatrixWorld(true); return along.map(a => cast[k].weapon.localToWorld(_v.set(0, a, 0).clone())); }
// closest points between the two blades at each clash time -> spark positions
function segClosest(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  const c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b; let s = den > 1e-6 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0;
  let tt = (b * s + f) / e; if (tt < 0) { tt = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1); } else if (tt > 1) { tt = 1; s = THREE.MathUtils.clamp((b - c) / a, 0, 1); }
  const c1 = p1.clone().addScaledVector(d1, s), c2 = p2.clone().addScaledVector(d2, tt); return { mid: c1.clone().lerp(c2, 0.5), dist: c1.distanceTo(c2) };
}
// solve clash corrections: coordinate descent on both sword arms so the blades cross (distance -> 0)
function bladeDist(t) { const [a0, a1] = blade('A', t, [8, 26]), [b0, b1] = blade('B', t, [8, 26]); return segClosest(a0, a1, b0, b1).dist; }
// v6: two solve passes. Pass 1 as v4/v5; then resim (footsteps/collision move the roots) and solve again from the
// pass-1 values on the FINAL poses, with a little more reach (fw 1.6, arms 70) so the flurry clashes actually connect.
const VARS = ['ax', 'az', 'el', 'wr', 'ba', 'ch', 'fw'];
// v8: wider reach (v6 dropped fw 1.6 because bodies collided) + a body-gap penalty in the objective, so the solver can step
// in and reach further but never pushes the two bodies into each other. ?wide=0 restores the v4 limits.
const WIDE = +(params.get('wide') ?? 1), LIM0 = { ax: 60, az: 60, el: 50, wr: 50, ba: 70, ch: 45, fw: 1.2 }, LIM3 = { ax: 80, az: 80, el: 65, wr: 75, ba: 100, ch: 55, fw: 0 };
const GAP_MIN = 0.78;   // root-to-root; capsules are 0.32 each, + a little air
function bodyGap(t) { const a = C.pose('A', t).pos, b = C.pose('B', t).pos; return Math.hypot(a[0] - b[0], a[2] - b[2]); }
const SOL = {};
// v8: pick each defence's parry pose (L/R/H) from the real blade geometry before solving: the side an attack ENDS on
// decides which parry meets it (v7's slashL-vs-parryR pairs all missed by ~1 block).
{ const pick = []; for (const r of C.PARRY) { let best = null;
    for (const n of ['parryL', 'parryR', 'parryH']) { r.apply(n); const d = bladeDist(r.t); if (!best || d < best[1] - 0.02) best = [n, d]; }
    r.apply(best[0]); pick.push([r.t, best[0].slice(5), +best[1].toFixed(2)]); }
  C.resim(false); console.warn('PARRY', JSON.stringify(pick)); }
// passes 1-2: v6 (solve, resim, re-solve on the final roots). v8 pass 3 (after the last resim): ARMS ONLY with wider limits -
// arm/wrist/chest corrections don't move roots or feet, so the sim stays valid and the contacts keep what the solve found.
const NPASS = WIDE ? 3 : 2;
for (let passN = 0; passN < NPASS; passN++) {
  const LIM = passN === 2 ? LIM3 : LIM0, V = passN === 2 ? VARS.filter(v => v !== 'fw') : VARS;
  for (const cl of C.CLASHES) {
    if (cl.at || !(cl.kind === 'blade' || cl.kind === 'cross')) continue;
    if (!SOL[cl.t]) { const eA = { t: cl.t, ax: 0, az: 0, el: 0, wr: 0, ba: 0, ch: 0, fw: 0 }, eB = { ...eA }; C.CORR.A.push(eA); C.CORR.B.push(eB); SOL[cl.t] = [eA, eB]; }
    const [eA, eB] = SOL[cl.t];
    const f = () => bladeDist(cl.t) + 0.0003 * VARS.reduce((s, v) => s + (v === 'fw' ? 400 : 1) * (eA[v] * eA[v] + eB[v] * eB[v]), 0) + 6 * Math.max(0, GAP_MIN - bodyGap(cl.t));
    let best = f();
    if (passN === 2 && bladeDist(cl.t) < 0.12) continue;            // already touching
    for (const step of passN ? [4, 2, 1, 0.5] : [16, 8, 4, 2, 1]) for (let pass = 0; pass < 8; pass++) { let imp = false;
      for (const e of [eA, eB]) for (const v of V) for (const sgn of [1, -1]) {
        const old = e[v], nv = THREE.MathUtils.clamp(old + sgn * (v === 'fw' ? step / 20 : step), v === 'fw' ? 0 : -LIM[v], LIM[v]); if (nv === old) continue; e[v] = nv; const fv = f();
        if (fv < best - 1e-4) { best = fv; imp = true; } else e[v] = old; }
      if (!imp) break; }
  }
  if (passN < 2) C.resim(passN === NPASS - 1);   // passes 1-2 resim; pass 3 changes arms only
}
const _dbgS = params.get('dbgsolve'), _dl = () => C.CLASHES.filter(c => !c.at && (c.kind === 'blade' || c.kind === 'cross')).map(c => +bladeDist(c.t).toFixed(2));
if (_dbgS) console.warn('SOLVED-before', JSON.stringify(_dl()));
if (NPASS === 3) C.resim(true);                    // same roots/feet; rebuilds the blade-direction tracks after the final solve
if (_dbgS) console.warn('SOLVED-after', JSON.stringify(_dl()));
// blade-vs-ground contacts: tip scraping the sand during a fast swing -> sand spray + sparks
{ const GH = []; let last = -9;
  for (let t = 0.1; t < C.TOTAL; t += 1 / 60) for (const k of ['A', 'B']) {
    const [tip] = blade(k, t, [27]), [tp] = blade(k, t - 1 / 60, [27]), sp = tip.distanceTo(tp) * 60, fl = floorAt(tip.x, tip.z);
    if (tip.y < fl + 0.1 && sp > 5 && t - last > 0.12) { GH.push({ t, p: [tip.x, fl, tip.z], k }); last = t; } }
  C.setGroundHits(GH); console.log('GROUNDHITS', GH.length); }
const contacts = C.CLASHES.map(cl => {
  if (cl.at) return { ...cl, p: cl.at(cast, blade) };
  const [a0, a1] = blade('A', cl.t, [4, 24]), [b0, b1] = blade('B', cl.t, [4, 24]); const r = segClosest(a0, a1, b0, b1);
  return { ...cl, p: r.mid.toArray(), dist: r.dist };
});
console.log('CLASHES', JSON.stringify(contacts.map(c => [c.t, c.p.map(v => +v.toFixed(2)), +(c.dist || 0).toFixed(2)])));
C.setContacts(contacts);

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
  for (const s of C.STEPS) { if (s.t > t || n >= 600 || (s.kind !== 'step' && s.kind !== 'land' && s.kind !== 'skid')) continue;
    const y = floorAt(s.p[0], s.p[2]) + 0.012; _q.setFromEuler(_e.set(0, Math.atan2(s.p[0], s.p[2]) * 0 + (s.c === 'A' ? 0.3 : -0.3), 0));
    _m.compose(new THREE.Vector3(s.p[0], y, s.p[2]), _q, new THREE.Vector3(s.kind === 'skid' ? 1.5 : 1, 1, s.kind === 'skid' ? 1.8 : 1)); FP.setMatrixAt(n++, _m); }
  FP.count = n; FP.instanceMatrix.needsUpdate = true;
}
const TRAIL = { A: trailMesh([1.0, 0.92, 0.75]), B: trailMesh([0.85, 0.7, 1.0]) };
const GHOSTS = {};
for (const k of ['A', 'B']) {
  GHOSTS[k] = [];
  for (let i = 0; i < 3; i++) {
    const g = cast[k].weapon.clone(true); g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.depthWrite = false; o.castShadow = false; } });
    g.matrixAutoUpdate = false; scene.add(g); GHOSTS[k].push(g);
  }
}
function updateGhosts(t) {
  for (const k of ['A', 'B']) {
    const now = blade(k, t, [22])[0], prev = blade(k, t - 1 / 60, [22])[0], sp = now.distanceTo(prev) * 60;
    const on = THREE.MathUtils.clamp((sp - 10) / 14, 0, 1) * C.trailGate(k, t);
    GHOSTS[k].forEach((g, i) => {
      g.visible = on > 0.02; if (!g.visible) return;
      applyPose(cast[k], C.pose(k, t - (i + 1) * 0.011)); cast[k].root.updateMatrixWorld(true);
      g.matrix.copy(cast[k].weapon.matrixWorld); g.matrixWorldNeedsUpdate = true;
      g.traverse(o => { if (o.isMesh) o.material.opacity = on * (0.42 - i * 0.12); });
    });
  }
}

// ------------------------------------------------------------------ post: bloom + grade (cold, vignette, CA, flash, impact frame)
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
  for (const k in cast) applyPose(cast[k], C.pose(k, t));
  // trails sampled from past poses
  for (const k of ['A', 'B']) {
    const tr = TRAIL[k], P = tr.g.attributes.position.array, Al = tr.g.attributes.alpha.array; let any = false;
    const tips = []; for (let i = 0; i < tr.N; i++) tips.push(blade(k, t - i / 160, [9, 26]));
    for (let i = 0; i < tr.N; i++) {
      const [b0, b1] = tips[i]; P.set([b0.x, b0.y, b0.z, b1.x, b1.y, b1.z], i * 6);
      const nxt = tips[Math.min(i + 1, tr.N - 1)][1]; const sp = b1.distanceTo(nxt) * 160;      // tip speed, blocks/s
      const a = THREE.MathUtils.clamp((sp - 9) / 18, 0, 1) * Math.pow(1 - i / tr.N, 1.4) * 0.85 * C.trailGate(k, t);
      Al[i * 2] = a * 0.05; Al[i * 2 + 1] = a; any = any || a > 0.01;
    }
    tr.mesh.visible = any; tr.g.attributes.position.needsUpdate = tr.g.attributes.alpha.needsUpdate = true;
  }
  updatePrints(t);
  updateGhosts(t);
  for (const k in cast) applyPose(cast[k], C.pose(k, t));
  let cam = C.camera(t, cast);
  if (params.get('iso')) { let mx = 0, mz = 0, n = 0; for (let d = -0.5; d <= 0.501; d += 0.125) { const a = C.pose('A', t + d).pos, b = C.pose('B', t + d).pos; mx += (a[0] + b[0]) / 2; mz += (a[2] + b[2]) / 2; n++; }
    mx /= n; mz /= n; cam = { pos: new THREE.Vector3(mx, FLOOR + 1.5, mz + 7.2), look: new THREE.Vector3(mx, FLOOR + 1.0, mz), fov: 40, roll: 0, label: 'iso' }; }
  const DBG = params.get('dbg');
  if (DBG) { const p = C.pose(DBG, t), yaw = p.yaw * Math.PI / 180, side = +(params.get('side') || 90) * Math.PI / 180;
    const c0 = new THREE.Vector3(p.pos[0], FLOOR + 0.9, p.pos[2]);
    if (params.get('fixed')) { const fx = +params.get('fixed'), q = C.pose(DBG, fx), y2 = q.yaw * Math.PI / 180; c0.set(q.pos[0] + Math.sin(y2) * 1.5, FLOOR + 0.9, q.pos[2] + Math.cos(y2) * 1.5);
      cam = { pos: c0.clone().add(new THREE.Vector3(Math.sin(y2 + side) * 7.5, 0.2, Math.cos(y2 + side) * 7.5)), look: c0, fov: 30, roll: 0, label: 'dbg' }; } else
    cam = { pos: c0.clone().add(new THREE.Vector3(Math.sin(yaw + side) * 5.2, 0.2, Math.cos(yaw + side) * 5.2)), look: c0, fov: 30, roll: 0, label: 'dbg' }; }
  camera.position.copy(cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(cam.look); if (cam.roll) camera.rotateZ(cam.roll);
  const focus = new THREE.Vector3(0, FLOOR, 0);
  const fc = new THREE.Vector3(cam.look.x, FLOOR, cam.look.z);   // shadow frustum follows the action (sharp shadows)
  sun.position.copy(fc).add(new THREE.Vector3(-6, 110, -9)); sun.target.position.copy(fc);   // v7: near-noon, almost straight down
  rim.position.copy(focus).add(new THREE.Vector3(70, 30, 60)); rim.target.position.copy(focus);
  fillL.position.copy(cam.pos).add(new THREE.Vector3(0, 3, 0)); fillL.target.position.copy(cam.look);
  const fx = C.effects(t, camera);
  if (params.get('novfx')) { fx.add = []; fx.soft = []; fx.flares = []; fx.rings = []; fx.debris = []; fx.flash = 0; fx.black = 0; fx.ca = 0; fx.impact = 0; fx.bloomBoost = 0; fx.sparkLight = { i: 0, p: [0, 0, 0] };
    for (const k of ['A', 'B']) { TRAIL[k].mesh.visible = false; if (typeof GHOSTS !== 'undefined') GHOSTS[k].forEach(g => g.visible = false); }
    if (typeof FP !== 'undefined') FP.count = 0; }
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

const fill = document.getElementById('fill');
window.renderAt = function (t) {
  const shutter = 0.5 / 30, n = C.blurOK(t) ? SUB : 1;
  renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 0); renderer.clear();
  let label = '';
  for (let i = 0; i < n; i++) {
    const ts = t + (n > 1 ? (i / (n - 1) - 0.5) * shutter : 0);
    label = drawState(ts).label;
    composer.render();
    accMat.uniforms.map.value = composer.readBuffer.texture; accMat.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(acc); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true;
  }
  outMat.uniforms.map.value = acc.texture; renderer.setRenderTarget(null); renderer.render(outScene, quadCam);
  fill.style.width = (300 * Math.min(1, t / C.TOTAL)) + 'px';
  return label;
};
window.dbgPose = function (k, t) { const p = C.pose(k, t); applyPose(cast[k], p); cast[k].root.updateMatrixWorld(true);
  const b = cast[k].bones, w = n => b[n].getWorldPosition(new THREE.Vector3()).toArray().map(v => +v.toFixed(3));
  const sole = n => b[n].localToWorld(new THREE.Vector3(0, -6, 0)).toArray().map(v => +v.toFixed(3));
  return { pos: p.pos.map(v => +v.toFixed(3)), y: +p.y.toFixed(3), floor: +floorAt(p.pos[0], p.pos[2]).toFixed(3), ik: p.ik, hips: w('hips'), rTh: w('rTh'), rSn: w('rSn'), rSole: sole('rSn'), lSole: sole('lSn'), rLegFK: p.rLeg, rKnee: p.rKnee }; };
window.events = () => C.events();
window.shake = function (k, a, b) { const P = []; for (let t = a; t <= b + 1e-6; t += 1 / 30) { applyPose(cast[k], C.pose(k, t)); cast[k].root.updateMatrixWorld(true); P.push([t, cast[k].bones.head.getWorldPosition(new THREE.Vector3())]); }
  const rev = {}; for (let i = 2; i < P.length; i++) { const v1 = P[i - 1][1].clone().sub(P[i - 2][1]), v2 = P[i][1].clone().sub(P[i - 1][1]);
    if (v1.length() > 0.012 && v2.length() > 0.012 && v1.dot(v2) / (v1.length() * v2.length()) < -0.5) { const s = Math.floor(P[i][0] * 2) / 2; rev[s] = (rev[s] || 0) + 1; } }
  return rev; };
window.jitter = function (k, a, b) { const P = []; for (let t = a; t <= b + 1e-6; t += 1 / 30) { const p = C.pose(k, t); applyPose(cast[k], p); cast[k].root.updateMatrixWorld(true);
    const h = cast[k].bones.head.getWorldPosition(new THREE.Vector3()), c = cast[k].bones.chest.getWorldPosition(new THREE.Vector3()); P.push([t, h, c]); }
  const out = []; for (let i = 2; i < P.length; i++) { const jh = P[i][1].clone().sub(P[i - 1][1].clone().multiplyScalar(2)).add(P[i - 2][1]).length(), jc = P[i][2].clone().sub(P[i - 1][2].clone().multiplyScalar(2)).add(P[i - 2][2]).length();
    out.push([+P[i][0].toFixed(2), +jh.toFixed(3), +jc.toFixed(3)]); } return out; };
window.dbgBlade = function (k, t) { const p = C.pose(k, t); applyPose(cast[k], p); cast[k].root.updateMatrixWorld(true);
  const o = k === 'A' ? 'B' : 'A', q = C.pose(o, t); let fp = 0, bp = 0; const v = new THREE.Vector3();
  for (let a = 4; a <= 28; a += 2) { cast[k].weapon.localToWorld(v.set(0, a, 0)); fp = Math.max(fp, floorAt(v.x, v.z) - v.y);
    const r = Math.hypot(v.x - q.pos[0], v.z - q.pos[2]); if (v.y > q.pos[1] && v.y < q.pos[1] + 1.85 && r < 0.2) bp = Math.max(bp, 0.2 - r); }
  return { floorPen: fp, bodyPen: bp }; };
window.TOTAL = C.TOTAL; window.ready = true;
