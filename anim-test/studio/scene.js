// NewGen studio page: renders any beat script with the studio engine.
//   studio/index.html?script=/anim-test/studio/scripts/<name>.json [&sub=5] [&novfx=1] [&iso=1]
// Scene time vs action time: impact contacts get a hit-stop (action frozen for INS frames) shown as an insert
// (1 inked impact frame + colour frames from a camera at the contact), v4 style. Script times are ACTION times.
// window.renderAt(t) draws scene time t; window.qa() measures the motion on the real rig; window.events() gives
// scene-time swings/contacts/steps/jumps for the sound bed. Deterministic.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadSkin, buildCharacter, buildWeapon, applyPose } from '../web/rig2.js';
import { buildWorld } from '../web/world.js';
import { build } from './engine.js';
import { BLADE_SCALE, BODY_R } from './style.js';

const W = 1920, H = 1080, DT = 1 / 30, params = new URLSearchParams(location.search);
const SUB = +(params.get('sub') || 5), NOVFX = !!params.get('novfx');
const script = await fetch(params.get('script') || '/anim-test/studio/scripts/demo.json').then(r => r.json());
const FX = Object.assign({ inserts: true, ghosts: true, motes: true, shake: 1 }, script.fx || {});

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// ------------------------------------------------------------------ world + light
const scene = new THREE.Scene();
const FOGC = new THREE.Color(0.80, 0.70, 0.62); scene.fog = new THREE.FogExp2(FOGC, 0.018); scene.background = FOGC.clone();
const hemi = new THREE.HemisphereLight(0xa8c4ff, 0x8a6a48, 0.95); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd2a0, 3.4); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 200 }); scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0xffc890, 1.1); scene.add(rim, rim.target);
const fillL = new THREE.DirectionalLight(0xfff0dc, 0.3); scene.add(fillL, fillL.target);
const sparkL = new THREE.PointLight(0xffa860, 0, 5, 2.0); scene.add(sparkL);
const WORLD_KIND = script.world || 'voxel';
let floorAt, DUST = [0.6, 0.5, 0.4];
if (WORLD_KIND === 'colosseum') {
  const base = '/anim-test/fight/assets/colosseum/';
  const [gltf, HMAP] = await Promise.all([new GLTFLoader().loadAsync(base + 'B.glb'), fetch(base + 'B_height.json').then(r => r.json())]);
  gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; const m = o.material; if (m.map) { m.map.magFilter = THREE.NearestFilter; m.map.minFilter = THREE.NearestMipmapLinearFilter; m.map.anisotropy = 8; } } });
  scene.add(gltf.scene);
  floorAt = (x, z) => { const ix = Math.floor(x - HMAP.x0), iz = Math.floor(z - HMAP.z0); if (ix < 0 || iz < 0 || ix >= HMAP.nx || iz >= HMAP.nz) return 0; return HMAP.h[iz * HMAP.nx + ix]; };
  scene.fog.density = 0.006; FOGC.setRGB(0.86, 0.80, 0.72); scene.background = FOGC.clone(); DUST = [0.9, 0.8, 0.62];
} else {
  const WORLD = buildWorld(scene);
  floorAt = (x, z) => WORLD.heightAt(x, z);
  for (const l of WORLD.lights) l.intensity *= 0.5;
}

// ------------------------------------------------------------------ cast
const WB = '/anim-test/fight/assets/w/';
const cast = {}, ids = Object.keys(script.cast);
for (const k of ids) {
  const c = script.cast[k];
  const skin = await loadSkin(String(c.skin ?? '1').includes('/') ? c.skin : `/anim-test/src/skins/${c.skin ?? 1}.png`);
  const wj = c.weapon ? await fetch(WB + c.weapon + '.json').then(r => r.json()) : null;
  cast[k] = buildCharacter(skin, wj ? buildWeapon(wj, WB) : null, c.weaponScale || BLADE_SCALE);
  cast[k].floorAt = floorAt; scene.add(cast[k].root);
}
await new Promise(r => setTimeout(r, 300));
const M = build(script, { floorAt });
for (const w of M.warnings) console.warn('[studio]', w);
const armed = ids.filter(k => cast[k].weapon);
const FIGHT = M.fighters.length >= 2 ? M.fighters : ids;
window.__studio = { M, cast, applyPose, THREE, floorAt };
const put = (k, t) => { const P = M.pose(k, t); applyPose(cast[k], P); cast[k].root.updateMatrixWorld(true); return P; };
const bladePts = (k, t, along) => { put(k, t); return along.map(a => cast[k].weapon.localToWorld(new THREE.Vector3(0, a, 0))); };
const TIP = 27;

// ------------------------------------------------------------------ time: hit-stops with inserts (scene time <-> action time)
const INS_F = 3;
const HOLDS = FX.inserts ? M.contacts.filter(c => c.impact).map(c => ({ t: c.t, d: INS_F * DT, c })).sort((a, b) => a.t - b.t) : [];
let acc0 = 0; for (const h of HOLDS) { h.s = h.t + acc0; acc0 += h.d; }              // h.s = scene time the hold starts
const TOTAL = M.T + acc0;
function act(ts) { let a = ts; for (const h of HOLDS) { if (a <= h.t) break; if (a < h.t + h.d) return h.t; a -= h.d; } return a; }
function sceneOf(a) { let s = a; for (const h of HOLDS) if (a > h.t + 1e-9) s += h.d; return s; }
const insertAt = ts => HOLDS.find(h => ts >= h.s - 1e-6 && ts < h.s + h.d - 1e-6);

// ------------------------------------------------------------------ fx objects
function softTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (kind === 'star') { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,230,190,0.9)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,240,215,0.9)'; g.fillRect(0, 61, 128, 6); g.fillRect(61, 29, 6, 70); g.fillRect(19, 62.5, 90, 3); }
  else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX = { star: softTex('star'), soft: softTex('soft') };
const FLARES = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); s.visible = false; scene.add(s); FLARES.push(s); }
function particleLayer(n, additive) {
  const g = new THREE.BufferGeometry();
  for (const [k, d] of [['position', 3], ['color', 3], ['size', 1], ['alpha', 1]]) g.setAttribute(k, new THREE.Float32BufferAttribute(new Float32Array(n * d), d));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC;
      void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = min(size * (900.0 / -mv.z), 64.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC, smoothstep(0.5, 0.0, d) * vA); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return { g, n };
}
const PADD = particleLayer(1500, true), PSOFT = particleLayer(4000, false);
function writeP(L, list) {
  const a = L.g.attributes; for (let i = 0; i < L.n; i++) { const q = list[i];
    if (!q) { a.alpha.array[i] = 0; a.size.array[i] = 0; continue; } a.position.array.set(q.p, i * 3); a.color.array.set(q.c, i * 3); a.size.array[i] = q.s; a.alpha.array[i] = q.a; }
  for (const k in a) a[k].needsUpdate = true;
}
const DEB = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: new THREE.Color(...DUST).multiplyScalar(0.95), roughness: 1 }), 60); DEB.castShadow = true; scene.add(DEB);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
function trailMesh(col) {
  const N = 18, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 2 * 3), 3)); g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(N * 2), 1));
  const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { col: { value: new THREE.Color(...col) } },
    vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 col; varying float vA; void main(){ gl_FragColor = vec4(col * vA, vA); }' });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh); return { g, N, mesh };
}
const TRAIL = {}, GHOSTS = {};
armed.forEach((k, i) => {
  TRAIL[k] = trailMesh(i % 2 ? [0.85, 0.72, 1.0] : [1.0, 0.92, 0.75]);
  GHOSTS[k] = []; for (let j = 0; j < 3; j++) { const g = cast[k].weapon.clone(true); g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.depthWrite = false; o.castShadow = false; } }); g.matrixAutoUpdate = false; scene.add(g); GHOSTS[k].push(g); }
});
const hurtMats = {}; for (const k of ids) { hurtMats[k] = []; cast[k].root.traverse(o => { if (o.isSkinnedMesh) hurtMats[k].push(o.material); }); }

// ------------------------------------------------------------------ effects (all functions of action time a; ins = insert info)
const hsh = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
const HOT = [2.6, 1.6, 0.6];
function burst(list, a, a0, p, n, seed, power = 1) {
  const d = a - a0; if (d < 0 || d > 0.8) return;
  for (let i = 0; i < n; i++) { const life = 0.25 + 0.4 * hsh(i, seed); if (d > life) continue;
    const th = hsh(i, seed + 1) * Math.PI * 2, ph = (hsh(i, seed + 2) - 0.35) * Math.PI * 0.9, sp = (4 + 9 * hsh(i, seed + 3)) * power;
    const v = [Math.cos(th) * Math.cos(ph) * sp, Math.sin(ph) * sp + 1.5, Math.sin(th) * Math.cos(ph) * sp];
    const fl = floorAt(p[0], p[2]); let y = p[1] + v[1] * d - 6 * d * d; if (y < fl) y = fl + 0.02;
    list.push({ p: [p[0] + v[0] * d, y, p[2] + v[2] * d], c: HOT, s: 0.02 + 0.03 * hsh(i, seed + 4), a: (1 - d / life) * 1.2 }); }
}
function puff(list, a, a0, p, n, seed, spread = 0.7, rise = 0.6, col = DUST, life = 1.1) {
  const d = a - a0; if (d < 0 || d > life) return; const u = d / life, eo = x => 1 - Math.pow(1 - x, 3);
  for (let i = 0; i < n; i++) { const th = hsh(i, seed) * Math.PI * 2, r = (0.15 + spread * hsh(i, seed + 1)) * eo(Math.min(1, d / 0.5));
    list.push({ p: [p[0] + Math.cos(th) * r, p[1] + 0.05 + rise * d * (0.3 + hsh(i, seed + 2)), p[2] + Math.sin(th) * r], c: col, s: 0.28 + 0.6 * u, a: 0.5 * (1 - u) }); }
}
function effects(a, cam, ins) {
  const add = [], soft = [], flares = [], debris = []; let impact = 0, ca = 0, flash = 0, bloomBoost = 0; const spark = { i: 0, p: [0, 0, 0] };
  if (FX.motes && WORLD_KIND === 'colosseum') {
    const cx = cam.position.x, cz = cam.position.z, F0 = floorAt(cx, cz);
    for (let i = 0; i < 700; i++) {
      const x = ((hsh(i, 1) * 30 + 1.4 * a + 0.3 * Math.sin(a * 0.9 + i)) % 30 + 30) % 30 - 15 + cx, z = ((hsh(i, 2) * 30 + 0.4 * a) % 30 + 30) % 30 - 15 + cz;
      const y = F0 + 0.2 + ((hsh(i, 4) * 6 + 0.15 * a * (0.5 + hsh(i, 6)) + 0.2 * Math.sin(a * 1.3 + i)) % 6 + 6) % 6;
      soft.push({ p: [x, y, z], c: [1.0, 0.9, 0.72], s: 0.018 + 0.025 * hsh(i, 5), a: 0.5 }); }
  }
  for (const st of M.steps) {
    const d = a - st.t; if (d < 0 || d > 1.2) continue;
    const g = floorAt(st.p[0], st.p[2]), q = [st.p[0], g, st.p[2]], seed = Math.round(st.t * 977) + (st.foot === 'r' ? 3 : 7);
    if (st.kind === 'step') puff(soft, a, st.t, q, 4, seed, 0.25, 0.22, DUST, 0.7);
    else if (st.kind === 'takeoff') puff(soft, a, st.t, q, 10, seed, 0.5, 0.3, DUST, 0.9);
    else if (st.kind === 'land' && st.foot === 'r') {      // jump landing: dust ring, sparks off the sand, debris chunks
      puff(soft, a, st.t, q, 26, seed, 2.2, 0.8, DUST, 1.4); burst(add, a, st.t, [q[0], g + 0.1, q[2]], 30, seed + 5, 0.8);
      if (d < 1.4) for (let i = 0; i < 24; i++) { const th = hsh(i, seed + 9) * Math.PI * 2, sp = 1.5 + 4 * hsh(i, seed + 10), vy = 3 + 4 * hsh(i, seed + 11);
        let y = g + 0.15 + vy * d - 9.8 * d * d, dd = d; if (y < g + 0.06) { y = g + 0.06; dd = Math.min(d, (vy + Math.sqrt(vy * vy + 4 * 4.9 * 0.1)) / 9.8); }
        debris.push({ p: [q[0] + Math.cos(th) * sp * dd, y, q[2] + Math.sin(th) * sp * dd], r: [d * 9 * hsh(i, seed + 12), d * 7, d * 5], s: (0.08 + 0.12 * hsh(i, seed + 13)) * (1 - Math.max(0, d - 1.0) / 0.4) }); }
    }
  }
  for (const c of M.contacts) {
    const d = a - c.t, p = c.p; if (d < -0.05 || d > 1.2) continue;
    if (c.kind === 'clash') {
      burst(add, a, c.t, p, c.big ? 90 : 45, Math.round(c.t * 100), c.big ? 1.25 : 0.9);
      if (c.bind) for (let tb = c.t + 0.08; tb < c.t + c.bind; tb += 0.11) {        // blades grinding: small repeating bursts + flicker
        burst(add, a, tb, p, 14, Math.round(tb * 1000), 0.6);
        if (a >= tb && a < tb + 0.05) { spark.i = Math.max(spark.i, 3); spark.p = p; flares.push({ p, s: 0.35, a: 0.7, rot: tb * 5 }); } }
      if (d >= 0 && d < (c.big ? 0.22 : 0.12)) { const u = d / (c.big ? 0.22 : 0.12), k = ins ? 0.25 : 1; flares.push({ p, s: (c.big ? 1.5 : 0.8) * (1 - 0.5 * u) * k, a: (1 - u) * (ins ? 0.8 : 1), rot: c.t * 3 });
        spark.i = Math.max(spark.i, (c.big ? 9 : 4.5) * (1 - u)); spark.p = p; }
    } else if (c.kind === 'hit') {
      burst(add, a, c.t, p, c.big ? 40 : 20, Math.round(c.t * 131), c.big ? 0.9 : 0.6); puff(soft, a, c.t, p, 8, Math.round(c.t * 71), 0.35, 0.3, [0.95, 0.92, 0.88], 0.5);
      if (d >= 0 && d < 0.1) flares.push({ p, s: (c.big ? 1.0 : 0.55) * (1 - d / 0.1), a: 1 - d / 0.1, rot: c.t });
    }
  }
  if (ins) { const f = Math.round((ins.ts - ins.h.s) / DT); impact = f === 0 ? 1 : 0; ca = 0.8; bloomBoost = 0.08; }
  else for (const h of HOLDS) { const d = a - h.t; if (d > 0 && d < 0.35) { ca = Math.max(ca, 0.6 * (1 - d / 0.35)); if (d < DT) flash = Math.max(flash, 0.15); } }
  return { add, soft, flares, debris, impact, ca, flash, bloomBoost, spark };
}

// ------------------------------------------------------------------ camera (v4 shot vocabulary, script-driven, in action time)
const shots = (script.camera?.shots || [{ t: 0, type: 'side' }]).slice().sort((a, b) => a.t - b.t);
const camSide = script.camera?.side || 1;
function shotAt(a) { let i = 0; for (let j = 0; j < shots.length; j++) if (a >= shots[j].t - 1e-6) i = j; return { s: shots[i], t0: shots[i].t, t1: (shots[i + 1] || { t: M.T }).t }; }
const v3 = (x, y, z) => new THREE.Vector3(x, y, z), clamp01 = x => Math.min(1, Math.max(0, x)), io = u => u * u * (3 - 2 * u);
function smoothRoot(k, a, w = 0.25) { let x = 0, z = 0, n = 0; for (let d = -w; d <= w + 1e-6; d += w / 3) { const r = M.root(k, Math.min(M.T, Math.max(0, a + d))); x += r.x; z += r.z; n++; } return v3(x / n, floorAt(x / n, z / n), z / n); }
function facing(k, a) { const y = M.pose(k, a).yaw * Math.PI / 180; return v3(Math.sin(y), 0, Math.cos(y)); }
function shake(a) {
  let amp = 0; for (const c of M.contacts) { const d = a - c.t, A = (c.impact ? 0.1 : c.big ? 0.06 : c.kind === 'clash' ? 0.025 : 0.035) * FX.shake; if (d >= 0 && d < 0.32) amp = Math.max(amp, A * Math.pow(1 - d / 0.32, 2)); }
  for (const s of M.steps) if (s.kind === 'land' && s.foot === 'r') { const d = a - s.t; if (d >= 0 && d < 0.4) amp = Math.max(amp, 0.12 * FX.shake * Math.pow(1 - d / 0.4, 2)); }
  return v3(amp * Math.sin(a * 93), amp * Math.cos(a * 71), amp * Math.sin(a * 57));
}
function cameraAt(a, ins, lock) {
  // lock = the shot at the frame's centre time: motion-blur sub-frames never straddle a cut (no double exposures)
  const S = lock || shotAt(a), s = S.s, lt = a - S.t0, u = clamp01(lt / Math.max(0.01, S.t1 - S.t0));
  const kA = s.on || FIGHT[0], kB = s.vs || FIGHT.find(k => k !== kA) || kA;
  const A = smoothRoot(kA, a), B = smoothRoot(kB, a), mid = A.clone().lerp(B, 0.5);
  const ab = B.clone().sub(A).setY(0); if (ab.length() < 1e-3) ab.set(1, 0, 0); ab.normalize();
  const side = v3(-ab.z, 0, ab.x).multiplyScalar(camSide), fA = facing(kA, a), up = y => v3(0, y, 0);
  const gap = A.distanceTo(B);
  let pos, look, fov = s.fov || 40, roll = (s.roll || 0) * Math.PI / 180;
  if (ins) {   // insert: tight on the contact, alternating side, slow push, dutch roll
    const c = ins.h.c, cp = v3(...c.p), k = HOLDS.indexOf(ins.h), lt2 = ins.ts - ins.h.s;
    pos = cp.clone().add(side.clone().multiplyScalar(k % 2 ? -2.2 : 2.2)).add(ab.clone().multiplyScalar(0.5)).add(up(0.15)); look = cp.clone().add(up(-0.2)); fov = 36 + 30 * lt2; roll = k % 2 ? 0.12 : -0.1;
    return { pos, look, fov, roll, label: 'ins' };
  }
  switch (s.type) {
    case 'est': pos = mid.clone().add(side.clone().multiplyScalar(14 - 3 * io(u))).add(ab.clone().multiplyScalar(-6 + 3 * u)).add(up(9 - 3 * io(u))); look = mid.clone().add(up(1.0)); fov = (s.fov || 44) - 6 * u; break;
    case 'face': { const leftA = v3(fA.z, 0, -fA.x);   // from the character's free-hand side, so the guard blade doesn't block the face
      pos = A.clone().add(fA.clone().multiplyScalar(1.75 - 0.2 * u)).add(leftA.multiplyScalar(0.85)).add(up(1.78)); look = A.clone().add(up(1.62)); fov = s.fov || 32; break; }
    case 'ots': pos = A.clone().add(ab.clone().multiplyScalar(-1.9)).add(side.clone().multiplyScalar(0.95)).add(up(2.0)); look = B.clone().add(up(1.3)); fov = s.fov || 38; break;
    case 'run': pos = A.clone().add(side.clone().multiplyScalar(4.0)).add(fA.clone().multiplyScalar(0.9)).add(up(0.95)); look = A.clone().add(up(1.1)).add(fA.clone().multiplyScalar(0.8)); fov = s.fov || 44; roll ||= -0.04; break;
    case 'orbit': { const a0 = (s.from ?? 20) * Math.PI / 180, a1 = (s.to ?? 110) * Math.PI / 180, an = a0 + (a1 - a0) * io(u), r = s.dist || Math.max(3.6, gap * 1.2 + 1.6);
      pos = mid.clone().add(side.clone().multiplyScalar(Math.cos(an) * r)).add(ab.clone().multiplyScalar(Math.sin(an) * r)).add(up(s.height ?? 1.5)); look = mid.clone().add(up(1.35)); break; }
    case 'low': pos = mid.clone().add(side.clone().multiplyScalar(s.dist || Math.max(3.4, gap * 1.1 + 1.5))).add(ab.clone().multiplyScalar(s.slide || 0)).add(up(s.height ?? 0.3)); look = mid.clone().add(up(1.6)); fov = s.fov || 50; roll ||= -0.04; break;
    case 'high': pos = mid.clone().add(up(s.height || 7.5)).add(side.clone().multiplyScalar(3.0)).add(ab.clone().multiplyScalar(-2.2)); look = mid.clone().add(up(0.4)); fov = s.fov || 46; break;
    case 'close': pos = A.clone().add(side.clone().multiplyScalar(s.dist || 2.6)).add(fA.clone().multiplyScalar(0.8)).add(up(1.4)); look = A.clone().add(up(1.25)).add(ab.clone().multiplyScalar(0.5)); fov = s.fov || 36; break;
    case 'ecu': { const c = M.contacts.reduce((b, x) => Math.abs(x.t - a) < Math.abs(b.t - a) ? x : b, M.contacts[0]); const cp = v3(...c.p).add(up(-0.3));
      pos = cp.clone().add(side.clone().multiplyScalar(1.7 - 0.2 * u)).add(up(0.2)); look = cp; fov = s.fov || 34; roll ||= 0.04; break; }
    case 'wide': pos = mid.clone().add(side.clone().multiplyScalar(s.dist || 9 - 2 * u)).add(up(s.height ?? 3.5 - u)); look = mid.clone().add(up(1.0)); break;
    case 'three4': pos = mid.clone().add(side.clone().multiplyScalar(Math.max(4, gap + 3) * 0.82)).add(ab.clone().multiplyScalar(Math.max(4, gap + 3) * -0.55)).add(up(1.5)); look = mid.clone().add(up(1.25)); break;
    default: { const dist = (s.dist || Math.max(5.2, gap * 1.35 + 3.4)) * (1 - Math.min(0.25, (s.push ?? 0.04) * lt));   // 'side'
      pos = mid.clone().add(side.clone().multiplyScalar(dist)).add(up(s.height ?? 1.35)); look = mid.clone().add(up(1.0)); fov = s.fov || 38; }
  }
  // punch-in on impacts: fov tightens 12 % and eases back over 0.45 s
  for (const h of HOLDS) { const d = a - h.t; if (d >= 0 && d < 0.45) fov *= 1 - 0.12 * Math.pow(1 - d / 0.45, 2); }
  const hh = v3(0.035 * Math.sin(a * 1.7) + 0.02 * Math.sin(a * 4.3), 0.025 * Math.sin(a * 2.3 + 1), 0.03 * Math.cos(a * 1.9));
  const sh = shake(a).add(hh); pos.add(sh); look.add(sh.clone().multiplyScalar(0.6));
  const fl = floorAt(pos.x, pos.z); if (pos.y < fl + 0.15) pos.y = fl + 0.15;
  return { pos, look, fov, roll, label: s.type || 'side' };
}

// ------------------------------------------------------------------ post: bloom + grade (impact frame, CA, flash)
const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 600);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.renderToScreen = false;
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.4, 0.5, 0.88); composer.addPass(bloom);
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, flash: { value: 0 }, ca: { value: 0 }, impact: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float flash, ca, impact; varying vec2 vUv;
    void main(){ vec2 d = vUv - 0.5; float r2 = dot(d, d);
      vec3 c; c.r = texture2D(tDiffuse, vUv + d * ca * 0.025).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv - d * ca * 0.025).b;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.08); c += vec3(-0.008, 0.0, 0.018) * (1.0 - clamp(l, 0.0, 1.0)) + vec3(0.02, 0.01, -0.012) * clamp(l, 0.0, 1.0);
      c *= 1.0 - 0.6 * r2;
      if (impact > 0.5) {   // impact frame: hot core stays white, the rest goes to black ink with edges from local contrast
        float m = smoothstep(1.15, 1.3, l); vec2 px = vec2(1.0 / 1920.0, 1.0 / 1080.0) * 2.0; float e = 0.0;
        for (int i = 0; i < 4; i++) { vec2 o = vec2(i == 0 ? 1.0 : i == 1 ? -1.0 : 0.0, i == 2 ? 1.0 : i == 3 ? -1.0 : 0.0) * px;
          e += abs(dot(texture2D(tDiffuse, vUv + o).rgb, vec3(0.333)) - dot(texture2D(tDiffuse, vUv).rgb, vec3(0.333))); }
        float ink = smoothstep(0.06, 0.16, e);
        c = mix(vec3(0.94, 0.9, 0.84), vec3(0.02, 0.015, 0.03), max(ink, 1.0 - smoothstep(0.08, 0.5, l))); c = mix(c, vec3(1.0, 0.97, 0.9), m); }
      c = mix(c, vec3(3.0, 2.7, 2.4), flash); gl_FragColor = vec4(c, 1.0); }` });
composer.addPass(grade); composer.addPass(new OutputPass());
const accRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const accMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  uniforms: { map: { value: null }, w: { value: 1 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D map; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb * w, w); }' });
const accScene = new THREE.Scene(); accScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat));
const outMat = new THREE.ShaderMaterial({ depthTest: false, uniforms: { map: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0); }' });
const outScene = new THREE.Scene(); outScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), outMat));

// ------------------------------------------------------------------ one sub-frame at scene time ts
function drawState(ts, lock) {
  const ins = insertAt(ts) ? { h: insertAt(ts), ts } : null, a = act(ts);
  for (const k in TRAIL) {     // trails: blade ribbon over the last ~0.1 s, opacity from tip speed (off in inserts)
    const tr = TRAIL[k], P = tr.g.attributes.position.array, A = tr.g.attributes.alpha.array; let any = false; const pts = [];
    for (let i = 0; i < tr.N; i++) pts.push(bladePts(k, a - i / 160, [9, TIP]));
    for (let i = 0; i < tr.N; i++) { const [b0, b1] = pts[i], nx = pts[Math.min(i + 1, tr.N - 1)][1], sp = b1.distanceTo(nx) * 160;
      const al = NOVFX || ins ? 0 : Math.min(1, Math.max(0, (sp - 9) / 18)) * Math.pow(1 - i / tr.N, 1.4) * 0.85;
      P.set([b0.x, b0.y, b0.z, b1.x, b1.y, b1.z], i * 6); A[i * 2] = al * 0.05; A[i * 2 + 1] = al; any = any || al > 0.01; }
    tr.mesh.visible = any; tr.g.attributes.position.needsUpdate = tr.g.attributes.alpha.needsUpdate = true;
  }
  for (const k in GHOSTS) {    // ghost blades (smear multiples) on fast swings
    const now = bladePts(k, a, [22])[0], prev = bladePts(k, a - 1 / 60, [22])[0], sp = now.distanceTo(prev) * 60;
    const on = NOVFX || ins || !FX.ghosts ? 0 : Math.min(1, Math.max(0, (sp - 10) / 14));
    GHOSTS[k].forEach((g, i) => { g.visible = on > 0.02; if (!g.visible) return; put(k, a - (i + 1) * 0.011); g.matrix.copy(cast[k].weapon.matrixWorld); g.matrixWorldNeedsUpdate = true;
      g.traverse(o => { if (o.isMesh) o.material.opacity = on * (0.42 - i * 0.12); }); });
  }
  for (const k of ids) put(k, a);
  for (const k of ids) for (const m of hurtMats[k]) m.emissive.setRGB(0, 0, 0);
  for (const c of M.contacts) if (c.kind === 'hit') { const d = a - c.t; if (d >= 0 && d < 0.25 && !NOVFX) for (const m of hurtMats[c.def]) m.emissive.setRGB(0.45 * (1 - d / 0.25), 0, 0); }
  let cam = cameraAt(a, ins, lock);
  if (params.get('iso')) { const A = smoothRoot(FIGHT[0], a), B = smoothRoot(FIGHT[1] || FIGHT[0], a), mid = A.clone().lerp(B, 0.5), ab = B.clone().sub(A).setY(0).normalize();
    cam = { pos: mid.clone().add(v3(-ab.z, 0, ab.x).multiplyScalar(7)).add(v3(0, 1.4, 0)), look: mid.clone().add(v3(0, 1.0, 0)), fov: 38, roll: 0, label: 'iso' }; }
  camera.position.copy(cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(cam.look); if (cam.roll) camera.rotateZ(cam.roll);
  const fc = v3(cam.look.x, 0, cam.look.z);
  sun.position.copy(fc).add(v3(-30, 26, -40)); sun.target.position.copy(fc); rim.position.copy(fc).add(v3(40, 18, 30)); rim.target.position.copy(fc);
  fillL.position.copy(cam.pos).add(v3(0, 3, 0)); fillL.target.position.copy(cam.look);
  const fx = NOVFX ? { add: [], soft: [], flares: [], debris: [], impact: 0, ca: 0, flash: 0, bloomBoost: 0, spark: { i: 0, p: [0, 0, 0] } } : effects(a, camera, ins);
  writeP(PADD, fx.add); writeP(PSOFT, fx.soft);
  FLARES.forEach((s, i) => { const f = fx.flares[i]; s.visible = !!f; if (f) { s.position.set(...f.p); s.scale.setScalar(f.s); s.material.opacity = f.a; s.material.color.setRGB(3, 2.4, 1.6); s.material.rotation = f.rot || 0; } });
  for (let i = 0; i < 60; i++) { const d = fx.debris[i]; if (!d) _m.makeScale(0, 0, 0); else { _q.setFromEuler(_e.set(...d.r)); _m.compose(v3(...d.p), _q, v3(d.s, d.s, d.s)); } DEB.setMatrixAt(i, _m); }
  DEB.instanceMatrix.needsUpdate = true;
  sparkL.intensity = fx.spark.i; sparkL.position.set(...fx.spark.p);
  grade.uniforms.flash.value = fx.flash; grade.uniforms.ca.value = fx.ca; grade.uniforms.impact.value = fx.impact; bloom.strength = 0.4 + fx.bloomBoost;
  return cam.label;
}
const fill = document.getElementById('fill');
if (script.chapter) document.getElementById('chap').textContent = script.chapter;
window.renderAt = function (ts) {
  const shutter = 0.5 / 30, n = insertAt(ts) ? 1 : SUB; let label = '';
  const lock = shotAt(act(ts));
  renderer.setRenderTarget(accRT); renderer.setClearColor(0x000000, 0); renderer.clear();
  for (let i = 0; i < n; i++) {
    let tsub = ts + (n > 1 ? (i / (n - 1) - 0.5) * shutter : 0);
    if (n > 1 && insertAt(tsub)) tsub = ts;                    // never blend an insert frame into a normal one
    label = drawState(tsub, lock); composer.render();
    accMat.uniforms.map.value = composer.readBuffer.texture; accMat.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(accRT); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true;
  }
  outMat.uniforms.map.value = accRT.texture; renderer.setRenderTarget(null); renderer.render(outScene, quadCam);
  fill.style.width = (300 * Math.min(1, ts / TOTAL)) + 'px';
  return label;
};

// ------------------------------------------------------------------ QA on the real rig (action time)
function segD(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
  let s = den > 1e-6 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0, u = (b * s + f) / e;
  if (u < 0) { u = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1); } else if (u > 1) { u = 1; s = THREE.MathUtils.clamp((b - c) / a, 0, 1); }
  return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, u));
}
window.qa = function () {
  const out = { warnings: M.warnings, T: +M.T.toFixed(2), sceneT: +TOTAL.toFixed(2), contacts: [], blade: [], feet: {}, minGap: 9, pops: {} };
  for (const c of M.contacts) {
    let miss;
    if (c.kind === 'clash') { let best = 9; for (let d = -0.034; d <= 0.034; d += 0.0085) { const [a0, a1] = bladePts(c.att, c.t + d, [4, TIP]), [b0, b1] = bladePts(c.def, c.t + d, [4, TIP]); best = Math.min(best, segD(a0, a1, b0, b1)); } miss = best; }
    else if (c.kind === 'hit') { let best = 9; for (let d = -0.034; d <= 0.034; d += 0.0085) { const pts = bladePts(c.att, c.t + d, [8, 13, 18, 23, TIP]), q = M.pose(c.def, c.t + d).pos;
        for (const p of pts) { if (p.y < q[1] + 0.2 || p.y > q[1] + 1.95) continue; best = Math.min(best, Math.max(0, Math.hypot(p.x - q[0], p.z - q[2]) - BODY_R - 0.04)); } } miss = best; }
    else { const [a0, a1] = bladePts(c.att, c.t, [4, TIP]); miss = segD(a0, a1, new THREE.Vector3(...c.p), new THREE.Vector3(...c.p).add(new THREE.Vector3(0, 0.001, 0))); }
    out.contacts.push([+c.t.toFixed(2), c.act, c.kind, `${c.att}>${c.def}`, +miss.toFixed(2)]);
    const dirs = []; for (let f = -6; f <= 2; f++) { const [p, q] = bladePts(c.att, c.t + f / 30, [0, TIP]); dirs.push(q.clone().sub(p).normalize()); }
    const turns = []; for (let i = 1; i < dirs.length; i++) turns.push(Math.acos(Math.min(1, dirs[i].dot(dirs[i - 1]))) * 180 / Math.PI);
    out.blade.push([+c.t.toFixed(2), +Math.max(...turns).toFixed(0)]);
  }
  for (const k of ids) {
    let slide = 0, n = 0, pops = 0, a1 = null, a2 = null; const prev = {};
    for (let t = 0; t < M.T; t += 1 / 30) {
      const P = put(k, t);
      for (const s of ['r', 'l']) { const sole = cast[k].bones[s + 'Sn'].localToWorld(new THREE.Vector3(0, -6, 0)), pl = P.ik[s][1] - floorAt(P.ik[s][0], P.ik[s][2]) < 0.005;
        if (prev[s] && pl && prev[s].planted) { slide += Math.hypot(sole.x - prev[s].p.x, sole.z - prev[s].p.z); n++; } prev[s] = { p: sole, planted: pl }; }
      const q = ['rSh', 'rEl', 'chest2', 'spine', 'rTh', 'lTh'].map(b => cast[k].bones[b].quaternion.clone());
      if (a1 && a2) for (let j = 0; j < q.length; j++) { const w1 = a1[j].angleTo(q[j]), w0 = a2[j].angleTo(a1[j]); if (Math.abs(w1 - w0) * 180 / Math.PI > 25) pops++; }
      a2 = a1; a1 = q;
    }
    out.feet[k] = +(slide / Math.max(1, n)).toFixed(4); out.pops[k] = pops;
  }
  if (FIGHT.length > 1) for (let t = 0; t < M.T; t += 1 / 30) { const a = M.root(FIGHT[0], t), b = M.root(FIGHT[1], t); out.minGap = Math.min(out.minGap, Math.hypot(a.x - b.x, a.z - b.z)); }
  out.minGap = +out.minGap.toFixed(2);
  return out;
};
// timing for the sound bed, in SCENE time (hit-stops included)
window.events = () => ({ T: +TOTAL.toFixed(3),
  holds: HOLDS.map(h => ({ s: +h.s.toFixed(3), d: +h.d.toFixed(3) })),
  swings: M.swings.map(s => ({ t: +sceneOf(s.t0).toFixed(3), tc: +sceneOf(s.tc).toFixed(3), c: s.c, power: s.power, act: s.act, kind: s.kind })),
  contacts: M.contacts.map(c => ({ t: +sceneOf(c.t).toFixed(3), kind: c.kind, act: c.act, power: c.power, big: !!c.big, impact: !!c.impact, att: c.att, def: c.def, bind: c.bind || 0 })),
  steps: M.steps.map(s => ({ t: +sceneOf(s.t).toFixed(3), c: s.c, foot: s.foot, kind: s.kind })),
  jumps: M.jumps.map(j => ({ t0: +sceneOf(j.t0).toFixed(3), t1: +sceneOf(j.t1).toFixed(3), c: j.c })) });
window.TOTAL = TOTAL; window.ready = true;
