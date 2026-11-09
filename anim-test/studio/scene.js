// NewGen studio page: renders any beat script with the studio engine.
//   studio/index.html?script=/anim-test/studio/scripts/<name>.json [&sub=5] [&novfx=1] [&iso=1]
// window.renderAt(t) draws one frame (SUB sub-frames over a 180-degree shutter); window.qa() measures the motion on the
// real rig (contact miss, blade deg/frame, foot slide, gap, joint pops). Deterministic.
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
import { BLADE_SCALE, BLADE_LEN, SWEET, BODY_R } from './style.js';

const W = 1920, H = 1080, params = new URLSearchParams(location.search);
const SUB = +(params.get('sub') || 5), NOVFX = !!params.get('novfx');
const script = await fetch(params.get('script') || '/anim-test/studio/scripts/demo.json').then(r => r.json());

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// ------------------------------------------------------------------ world + light (one idea: low warm sun, cool fill, haze)
const scene = new THREE.Scene();
const FOGC = new THREE.Color(0.80, 0.70, 0.62); scene.fog = new THREE.FogExp2(FOGC, 0.018); scene.background = FOGC.clone();
const hemi = new THREE.HemisphereLight(0xa8c4ff, 0x8a6a48, 0.95); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd2a0, 3.4); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 200 }); scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0xffc890, 1.1); scene.add(rim, rim.target);
const fillL = new THREE.DirectionalLight(0xfff0dc, 0.3); scene.add(fillL, fillL.target);
const sparkL = new THREE.PointLight(0xffa860, 0, 5, 2.0); scene.add(sparkL);
// world: "voxel" (procedural meadow arena) or "colosseum" (the user's map, converted by tools/mca2obj.py; gitignored)
let floorAt;
if ((script.world || 'voxel') === 'colosseum') {
  const base = '/anim-test/fight/assets/colosseum/';
  const [gltf, HMAP] = await Promise.all([new GLTFLoader().loadAsync(base + 'B.glb'), fetch(base + 'B_height.json').then(r => r.json())]);
  gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; const m = o.material; if (m.map) { m.map.magFilter = THREE.NearestFilter; m.map.minFilter = THREE.NearestMipmapLinearFilter; m.map.anisotropy = 8; } } });
  scene.add(gltf.scene);
  floorAt = (x, z) => { const ix = Math.floor(x - HMAP.x0), iz = Math.floor(z - HMAP.z0); if (ix < 0 || iz < 0 || ix >= HMAP.nx || iz >= HMAP.nz) return 0; return HMAP.h[iz * HMAP.nx + ix]; };
  scene.fog.density = 0.006; FOGC.setRGB(0.86, 0.80, 0.72); scene.background = FOGC.clone();
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
window.__studio = { M, cast, applyPose, THREE, floorAt };
const put = (k, t) => { const P = M.pose(k, t); applyPose(cast[k], P); cast[k].root.updateMatrixWorld(true); return P; };
const bladePts = (k, t, along) => { put(k, t); return along.map(a => cast[k].weapon.localToWorld(new THREE.Vector3(0, a, 0))); };
const TIP = 27;

// ------------------------------------------------------------------ fx
function softTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (kind === 'star') { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,226,180,0.9)'); gr.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(255,238,210,0.85)'; g.fillRect(0, 62, 128, 4); g.fillRect(62, 20, 4, 88); }
  else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const FLARE = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('star'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); FLARE.visible = false; scene.add(FLARE);
const PUFF = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('soft'), transparent: true, depthWrite: false, color: 0xf0e6dc })); PUFF.visible = false; scene.add(PUFF);
function trailMesh(col) {
  const N = 14, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 2 * 3), 3)); g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(N * 2), 1));
  const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { col: { value: new THREE.Color(...col) } },
    vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 col; varying float vA; void main(){ gl_FragColor = vec4(col * vA, vA); }' });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh); return { g, N, mesh };
}
const TRAIL = {}; for (const k of ids) if (cast[k].weapon) TRAIL[k] = trailMesh([0.9, 0.86, 0.8]);
// Minecraft hurt tint (red flash on the hit body, 0.25 s)
const hurtMats = {}; for (const k of ids) { hurtMats[k] = []; cast[k].root.traverse(o => { if (o.isSkinnedMesh) hurtMats[k].push(o.material); }); }

// ------------------------------------------------------------------ camera: calm, one side of the fighting line (§7/§8)
const CAMS = script.camera || {};
const shots = (CAMS.shots || [{ t: 0, type: 'side' }]).slice().sort((a, b) => a.t - b.t);
const camSide = CAMS.side || 1;
function shotAt(t) { let s = shots[0]; for (const q of shots) if (t >= q.t - 1e-6) s = q; return s; }
function framing(t) {
  const F = M.fighters.length ? M.fighters : ids; let mx = 0, mz = 0, n = 0, spread = 0;
  for (let d = -0.45; d <= 0.451; d += 0.15) { const ps = F.map(k => M.root(k, t + d)); for (const p of ps) { mx += p.x; mz += p.z; n++; }
    if (ps.length > 1) spread = Math.max(spread, Math.hypot(ps[0].x - ps[1].x, ps[0].z - ps[1].z)); }
  mx /= n; mz /= n;
  const a = F.length > 1 ? M.root(F[0], 0) : { x: -1, z: 0 }, b = F.length > 1 ? M.root(F[1], 0) : { x: 1, z: 0 };
  const ax = Math.atan2(b.x - a.x, b.z - a.z);
  return { mx, mz, spread, ax };
}
function cameraAt(t) {
  const s = shotAt(t), f = framing(t), y0 = floorAt(f.mx, f.mz), ts = t - s.t;
  const type = s.type || 'side';
  let ang = f.ax + camSide * Math.PI / 2 + (s.angle || (type === 'three4' ? 35 : type === 'low' ? -15 : 0)) * Math.PI / 180 * camSide;
  let dist = s.dist || Math.max(5.2, f.spread * 1.35 + 3.4), h = s.height ?? (type === 'low' ? 0.45 : 1.35), fov = s.fov || 38, lookH = type === 'low' ? 1.25 : 1.0;
  if (type === 'close') { dist = s.dist || 3.4; fov = 34; }
  dist *= 1 - Math.min(0.25, (s.push ?? 0.04) * ts);                    // slow push-in, ~4 %/s (REF 4-7 %/s)
  ang += (s.drift ?? 0.02) * ts * camSide;                               // lateral drift
  let cx = f.mx, cz = f.mz;
  if (type === 'close' && s.on) { const p = M.root(s.on, t); cx = lerp(cx, p.x, 0.6); cz = lerp(cz, p.z, 0.6); }
  return { pos: new THREE.Vector3(cx + Math.sin(ang) * dist, y0 + h, cz + Math.cos(ang) * dist), look: new THREE.Vector3(cx, y0 + lookH, cz), fov };
}
function lerp(a, b, u) { return a + (b - a) * u; }

// ------------------------------------------------------------------ post
const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 400);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.renderToScreen = false;
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.5, 0.9); composer.addPass(bloom);
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, flash: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float flash; varying vec2 vUv;
    void main(){ vec2 d = vUv - 0.5; vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.06); c += vec3(-0.01, 0.0, 0.02) * (1.0 - clamp(l, 0.0, 1.0)) + vec3(0.02, 0.01, -0.012) * clamp(l, 0.0, 1.0);
      c *= 1.0 - 0.55 * dot(d, d); c = mix(c, vec3(2.6, 2.3, 2.0), flash); gl_FragColor = vec4(c, 1.0); }` });
composer.addPass(grade); composer.addPass(new OutputPass());
const acc = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const accMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  uniforms: { map: { value: null }, w: { value: 1 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D map; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb * w, w); }' });
const accScene = new THREE.Scene(); accScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat));
const outMat = new THREE.ShaderMaterial({ depthTest: false, uniforms: { map: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0); }' });
const outScene = new THREE.Scene(); outScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), outMat));

// ------------------------------------------------------------------ one sub-frame
function drawState(t) {
  // smear: a faint ribbon behind fast blades only (REF DFY/Desert: the arc is the motion read)
  for (const k in TRAIL) {
    const tr = TRAIL[k], P = tr.g.attributes.position.array, A = tr.g.attributes.alpha.array; let any = false; const pts = [];
    for (let i = 0; i < tr.N; i++) pts.push(bladePts(k, t - i / 240, [10, TIP]));
    for (let i = 0; i < tr.N; i++) { const [b0, b1] = pts[i], nx = pts[Math.min(i + 1, tr.N - 1)][1], sp = b1.distanceTo(nx) * 240;
      const a = NOVFX ? 0 : Math.min(1, Math.max(0, (sp - 8) / 16)) * Math.pow(1 - i / tr.N, 1.5) * 0.55;
      P.set([b0.x, b0.y, b0.z, b1.x, b1.y, b1.z], i * 6); A[i * 2] = a * 0.05; A[i * 2 + 1] = a; any = any || a > 0.01; }
    tr.mesh.visible = any; tr.g.attributes.position.needsUpdate = tr.g.attributes.alpha.needsUpdate = true;
  }
  for (const k of ids) put(k, t);
  // contacts: clash = warm spark + light (2-3 frames), hit = hurt tint + small puff
  let flare = null, puff = null, flash = 0, sl = 0, slp = [0, 0, 0];
  for (const k of ids) for (const m of hurtMats[k]) m.emissive.setRGB(0, 0, 0);
  for (const c of M.contacts) {
    const dt = t - c.t; if (dt < -0.01 || dt > 0.45) continue;
    if (c.kind === 'clash' && dt < 0.12) { flare = { p: c.p, s: (c.big ? 1.3 : 0.8) * (1 - dt / 0.12), a: 1 - dt / 0.12 }; sl = (c.big ? 9 : 5) * Math.exp(-dt / 0.05); slp = c.p; if (c.big && dt < 1 / 30) flash = 0.04; }
    if (c.kind === 'hit' && dt >= 0) { if (dt < 0.25) for (const m of hurtMats[c.def]) m.emissive.setRGB(0.45 * (1 - dt / 0.25), 0, 0);
      if (dt < 0.3) puff = { p: c.p, s: 0.2 + dt * 1.2, a: 0.35 * (1 - dt / 0.3) }; }
  }
  if (NOVFX) { flare = puff = null; flash = 0; sl = 0; }
  FLARE.visible = !!flare; if (flare) { FLARE.position.set(...flare.p); FLARE.scale.setScalar(flare.s); FLARE.material.opacity = flare.a; FLARE.material.color.setRGB(2.4, 1.9, 1.3); }
  PUFF.visible = !!puff; if (puff) { PUFF.position.set(...puff.p); PUFF.scale.setScalar(puff.s); PUFF.material.opacity = puff.a; }
  sparkL.intensity = sl; sparkL.position.set(...slp);
  grade.uniforms.flash.value = flash;
  let cam = cameraAt(t);
  if (params.get('iso')) { const f = framing(t), y0 = floorAt(f.mx, f.mz); cam = { pos: new THREE.Vector3(f.mx + Math.sin(f.ax + Math.PI / 2) * 7, y0 + 1.4, f.mz + Math.cos(f.ax + Math.PI / 2) * 7), look: new THREE.Vector3(f.mx, y0 + 1.0, f.mz), fov: 38 }; }
  camera.position.copy(cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(cam.look);
  const fc = new THREE.Vector3(cam.look.x, 0, cam.look.z);
  sun.position.copy(fc).add(new THREE.Vector3(-30, 26, -40)); sun.target.position.copy(fc);
  rim.position.copy(fc).add(new THREE.Vector3(40, 18, 30)); rim.target.position.copy(fc);
  fillL.position.copy(cam.pos).add(new THREE.Vector3(0, 3, 0)); fillL.target.position.copy(cam.look);
}
const fill = document.getElementById('fill');
if (script.chapter) document.getElementById('chap').textContent = script.chapter;
window.renderAt = function (t) {
  const shutter = 0.5 / 30, n = SUB;
  renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 0); renderer.clear();
  for (let i = 0; i < n; i++) {
    drawState(t + (n > 1 ? (i / (n - 1) - 0.5) * shutter : 0)); composer.render();
    accMat.uniforms.map.value = composer.readBuffer.texture; accMat.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(acc); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true;
  }
  outMat.uniforms.map.value = acc.texture; renderer.setRenderTarget(null); renderer.render(outScene, quadCam);
  fill.style.width = (300 * Math.min(1, t / M.T)) + 'px';
  return shotAt(t).type || 'side';
};

// ------------------------------------------------------------------ QA on the real rig
function segD(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
  let s = den > 1e-6 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0, u = (b * s + f) / e;
  if (u < 0) { u = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1); } else if (u > 1) { u = 1; s = THREE.MathUtils.clamp((b - c) / a, 0, 1); }
  return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, u));
}
window.qa = function () {
  const out = { warnings: M.warnings, contacts: [], blade: [], feet: {}, minGap: 9, pops: {} };
  for (const c of M.contacts) {
    let miss;
    if (c.kind === 'clash') { let best = 9; for (let d = -0.034; d <= 0.034; d += 0.0085) { const [a0, a1] = bladePts(c.att, c.t + d, [4, TIP]), [b0, b1] = bladePts(c.def, c.t + d, [4, TIP]); best = Math.min(best, segD(a0, a1, b0, b1)); } miss = best; }
    else if (c.kind === 'hit') { let best = 9; for (let d = -0.034; d <= 0.034; d += 0.0085) { const pts = bladePts(c.att, c.t + d, [8, 13, 18, 23, TIP]), q = M.pose(c.def, c.t + d).pos;
        for (const p of pts) { if (p.y < q[1] + 0.2 || p.y > q[1] + 1.95) continue; best = Math.min(best, Math.max(0, Math.hypot(p.x - q[0], p.z - q[2]) - BODY_R - 0.04)); } } miss = best; }
    else { const [a0, a1] = bladePts(c.att, c.t, [4, TIP]); miss = segD(a0, a1, new THREE.Vector3(...c.p), new THREE.Vector3(...c.p).add(new THREE.Vector3(0, 0.001, 0))); }
    out.contacts.push([+c.t.toFixed(2), c.act, c.kind, `${c.att}>${c.def}`, +miss.toFixed(2)]);
    // blade turn per frame through the strike (cocked -> contact + 2 frames)
    const dirs = []; for (let f = -6; f <= 2; f++) { const [a, b] = bladePts(c.att, c.t + f / 30, [0, TIP]); dirs.push(b.clone().sub(a).normalize()); }
    const turns = []; for (let i = 1; i < dirs.length; i++) turns.push(Math.acos(Math.min(1, dirs[i].dot(dirs[i - 1]))) * 180 / Math.PI);
    out.blade.push([+c.t.toFixed(2), +Math.max(...turns).toFixed(0), +(turns.slice(-5).reduce((s, v) => s + v, 0) / 5).toFixed(0)]);
  }
  const F = M.fighters;
  for (const k of ids) {
    let slide = 0, n = 0; const prev = {};
    let pops = 0; let a1 = null, a2 = null;
    for (let t = 0; t < M.T; t += 1 / 30) {
      const P = put(k, t);
      for (const s of ['r', 'l']) { const sole = cast[k].bones[s + 'Sn'].localToWorld(new THREE.Vector3(0, -6, 0));
        if (prev[s] && P.ik[s][1] - floorAt(P.ik[s][0], P.ik[s][2]) < 0.005 && prev[s].planted) { slide += Math.hypot(sole.x - prev[s].p.x, sole.z - prev[s].p.z); n++; }
        prev[s] = { p: sole, planted: P.ik[s][1] - floorAt(P.ik[s][0], P.ik[s][2]) < 0.005 }; }
      const q = ['rSh', 'rEl', 'chest2', 'spine', 'rTh', 'lTh'].map(b => cast[k].bones[b].quaternion.clone());
      if (a1 && a2) for (let j = 0; j < q.length; j++) { const w1 = a1[j].angleTo(q[j]), w0 = a2[j].angleTo(a1[j]); if (Math.abs(w1 - w0) * 180 / Math.PI > 25) pops++; }
      a2 = a1; a1 = q;
    }
    out.feet[k] = +(slide / Math.max(1, n)).toFixed(4); out.pops[k] = pops;
  }
  if (F.length > 1) for (let t = 0; t < M.T; t += 1 / 30) { const a = M.root(F[0], t), b = M.root(F[1], t); out.minGap = Math.min(out.minGap, Math.hypot(a.x - b.x, a.z - b.z)); }
  out.minGap = +out.minGap.toFixed(2);
  return out;
};
// timing for the sound bed: contacts (clash/hit/whiff with power) and footsteps
window.events = () => ({ T: M.T, contacts: M.contacts.map(c => ({ t: +c.t.toFixed(3), kind: c.kind, act: c.act, power: c.power, big: !!c.big, att: c.att, def: c.def, p: c.p.map(v => +v.toFixed(2)) })),
  steps: M.steps.map(s => ({ t: +s.t.toFixed(3), c: s.c, foot: s.foot })) });
window.TOTAL = M.T; window.ready = true;
