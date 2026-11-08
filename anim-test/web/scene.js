// Scene setup + deterministic frame rendering: window.renderAt(t) draws the frame for time t (seconds).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { loadSkin, buildCharacter, buildWeapon, applyPose } from './rig.js';
import * as A from './anim.js';

const W = 1920, H = 1080;
const params = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.98;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const FOG = new THREE.Color(0.86, 0.62, 0.5);
scene.fog = new THREE.Fog(FOG, 30, 130);

// ------------------------------------------------------------------ sky (golden hour gradient + sun glow)
const SUN_DIR = new THREE.Vector3(-0.35, 0.22, -1).normalize();   // sun low, behind the action as seen from the main cameras
const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sunDir: { value: SUN_DIR } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec3 vD; uniform vec3 sunDir;
    void main(){ float h = clamp(vD.y, -0.2, 1.0); float s = max(dot(normalize(vD), sunDir), 0.0);
      vec3 zen = vec3(0.10, 0.18, 0.38), hor = vec3(0.98, 0.62, 0.42), warm = vec3(1.0, 0.72, 0.42);
      vec3 c = mix(hor, zen, pow(max(h, 0.0), 0.55));
      c = mix(c, warm, pow(s, 6.0) * 0.6 * (1.0 - h));
      c += vec3(1.0, 0.85, 0.6) * pow(s, 1400.0) * 7.0 + vec3(1.0, 0.7, 0.45) * pow(s, 60.0) * 0.35;   // disc + halo (bloom picks it up)
      if (vD.y < 0.0) c = mix(c, vec3(0.86, 0.62, 0.5), clamp(-vD.y * 6.0, 0.0, 1.0));
      gl_FragColor = vec4(c, 1.0); }`
}));
scene.add(sky);

// ------------------------------------------------------------------ lights
const hemi = new THREE.HemisphereLight(0x8fb2ff, 0x5a3f2c, 0.6); scene.add(hemi);                // cool sky fill / warm ground bounce
const sun = new THREE.DirectionalLight(0xffc28a, 4.0); sun.castShadow = true;                        // warm low key
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120;
scene.add(sun); scene.add(sun.target);
const rim = new THREE.DirectionalLight(0x9fc4ff, 1.1); scene.add(rim); scene.add(rim.target);         // cool back/rim from the opposite side
function placeLights(focus) {
  sun.position.copy(focus).addScaledVector(SUN_DIR, 60); sun.target.position.copy(focus);
  rim.position.copy(focus).add(new THREE.Vector3(14, 10, 20)); rim.target.position.copy(focus);
}

// ------------------------------------------------------------------ world + characters
const world = buildWorld(scene);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 500);

// impact light (sparks) and a soft hero light that follows the action
const spark = new THREE.PointLight(0xffb36b, 0, 6, 1.5); scene.add(spark);

// particles: one shader for sparks, dust and motes (per-point size/alpha/colour)
function particleLayer(n, additive) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC;
      void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = min(size * (900.0 / -mv.z), 48.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC, a * vA); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return { g, n };
}
const PART = { add: particleLayer(600, true), soft: particleLayer(700, false) };
function writeParticles(layer, list) {
  const P = layer.g.attributes.position.array, C = layer.g.attributes.color.array, S = layer.g.attributes.size.array, Al = layer.g.attributes.alpha.array;
  for (let i = 0; i < layer.n; i++) {
    const q = list[i];
    if (!q) { Al[i] = 0; S[i] = 0; continue; }
    P.set(q.p, i * 3); C.set(q.c, i * 3); S[i] = q.s; Al[i] = q.a;
  }
  for (const k of ['position', 'color', 'size', 'alpha']) layer.g.attributes[k].needsUpdate = true;
}

// weapon trails (ribbons)
function trailMesh() {
  const N = 14; const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 2 * 3), 3));
  g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(N * 2), 1));
  const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(vec3(1.0,0.93,0.82) * vA, vA); }' });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh); return { g, N, mesh };
}

// ------------------------------------------------------------------ post: bloom + grade/vignette/flash
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.4, 0.5, 0.92); composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, flash: { value: 0 }, black: { value: 0 }, ca: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float flash, black, ca; varying vec2 vUv;
    void main(){ vec2 d = vUv - 0.5; float r2 = dot(d, d);
      vec3 c; c.r = texture2D(tDiffuse, vUv + d * ca * 0.02).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv - d * ca * 0.02).b;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c += vec3(-0.004, 0.0, 0.012) * (1.0 - clamp(l, 0.0, 1.0)) + vec3(0.02, 0.006, -0.012) * clamp(l, 0.0, 1.0);   // cool shadows / warm highlights
      c *= 1.0 - 0.55 * r2;                                                                                        // vignette (~0.8 corners)
      c = mix(c, vec3(4.0, 3.5, 2.9), flash); c = mix(c, vec3(0.0), black);
      gl_FragColor = vec4(c, 1.0); }`
});
composer.addPass(grade); composer.addPass(new OutputPass());

// ------------------------------------------------------------------ load assets, build cast
const base = '/anim-test/';
const [s1, s2, s3, aeg, veil] = await Promise.all([
  loadSkin(base + 'src/skins/1.png'), loadSkin(base + 'src/skins/2.png'), loadSkin(base + 'src/skins/3.png'),
  fetch(base + 'web/assets/aegisblade.json').then(r => r.json()), fetch(base + 'web/assets/veilblade.json').then(r => r.json()),
]);
const cast = {
  A: buildCharacter(s1, buildWeapon(aeg, base + 'web/assets/')),
  B: buildCharacter(s2, buildWeapon(veil, base + 'web/assets/')),
  C: buildCharacter(s3, null),
};
for (const k in cast) scene.add(cast[k].root);
const trails = { A: trailMesh(), B: trailMesh() };
const fillLight = new THREE.DirectionalLight(0xffe2c8, 0.55); scene.add(fillLight); scene.add(fillLight.target);   // soft reflector fill from the camera side
await new Promise(r => setTimeout(r, 300));          // let textures decode

// blade points in world space for the trail ribbons
const _v = new THREE.Vector3();
function bladeWorld(ch, along) { ch.root.updateMatrixWorld(true); return along.map(a => ch.J.weapon.localToWorld(_v.set(0, a, 0).clone())); }

function bladeAt(k, t, a) { applyPose(cast[k], A.pose(k, t, world)); return bladeWorld(cast[k], [a])[0]; }
A.setContacts({ clash: bladeAt('A', A.INS1, 15).lerp(bladeAt('B', A.INS1, 13), 0.5).toArray(), hit: bladeAt('A', A.INS2, 20).toArray(),
  cross: bladeAt('A', A.FLASH, 14).lerp(bladeAt('B', A.FLASH, 14), 0.5).toArray() });
console.log('contacts', JSON.stringify(A.CONTACT));
function poseAll(t) { for (const k in cast) applyPose(cast[k], A.pose(k, t, world)); }

// ------------------------------------------------------------------ frame
const fill = document.getElementById('fill'), chap = document.getElementById('bl');
window.renderAt = function (t) {
  if (t < 0) {   // debug lineup: all three in rest pose facing +z, camera in front
    let i = 0; for (const k in cast) { applyPose(cast[k], { pos: [-1.5 + i * 1.5, 1, 4], yaw: 0, rArm: [-45, 0, 0], rElbow: [-60, 0, 0], lArm: [0, 0, 30] }); i++; }
    for (const k in trails) trails[k].mesh.visible = false;
    camera.position.set(0, 2.2, 9); camera.fov = 35; camera.updateProjectionMatrix(); camera.lookAt(0, 2, 4); placeLights(new THREE.Vector3(0, 1, 0));
    writeParticles(PART.add, []); writeParticles(PART.soft, []); composer.render(); return 'debug';
  }
  const S = A.shotAt(t);
  // trails: sample the blade at past times (pure function of t)
  for (const k of ['A', 'B']) {
    const tr = trails[k]; const on = A.trailOn(k, t); tr.mesh.visible = on > 0;
    if (on > 0) {
      const P = tr.g.attributes.position.array, Al = tr.g.attributes.alpha.array;
      for (let i = 0; i < tr.N; i++) {
        const ti = t - i / 150; applyPose(cast[k], A.pose(k, ti, world)); const [b0, b1] = bladeWorld(cast[k], [7, 21]);
        P.set([b0.x, b0.y, b0.z, b1.x, b1.y, b1.z], i * 6); const a = on * Math.pow(1 - i / tr.N, 1.6) * 0.75; Al[i * 2] = a * 0.15; Al[i * 2 + 1] = a;
      }
      tr.g.attributes.position.needsUpdate = true; tr.g.attributes.alpha.needsUpdate = true;
    }
  }
  poseAll(t);
  // camera
  const C = A.cameraAt(t, cast, world);
  camera.position.copy(C.pos); camera.fov = C.fov; camera.updateProjectionMatrix(); camera.lookAt(C.look);
  if (C.roll) camera.rotateZ(C.roll);
  placeLights(new THREE.Vector3(0, 1, 0));
  fillLight.position.copy(C.pos).add(new THREE.Vector3(0, 1.5, 0)); fillLight.target.position.copy(C.look);
  // fx
  const fx = A.effects(t, cast, world);
  writeParticles(PART.add, fx.add); writeParticles(PART.soft, fx.soft);
  spark.intensity = fx.sparkLight.i; spark.position.set(...fx.sparkLight.p);
  grade.uniforms.flash.value = fx.flash; grade.uniforms.black.value = fx.black; grade.uniforms.ca.value = fx.ca;
  bloom.strength = 0.38 + fx.bloomBoost;
  // HUD
  fill.style.width = (300 * Math.min(1, t / A.TOTAL)) + 'px';
  composer.render();
  return S.label;
};
window.TOTAL = A.TOTAL;
window.ready = true;
if (params.get('t')) window.renderAt(parseFloat(params.get('t')));
