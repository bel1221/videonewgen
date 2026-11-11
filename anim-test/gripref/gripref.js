// Weapon grip + scale reference. Reads the legendary-weapon .bbmodel directly, puts each weapon in the fight rig's hand
// (rig2_w.js, same scale and grip rules as the fight videos) and draws a side view and a front view over a block grid.
//   window.cell(i)  -> PNG data URL of one weapon card      window.info() -> measured numbers for every weapon
// Weapon numbers live in weapons.json. ?skin=1|2|3
import * as THREE from 'three';
import { loadSkin, buildCharacter, applyPose } from '../fight_w/rig2_w.js';

const params = new URLSearchParams(location.search);
const CFG = await fetch('./weapons.json').then(r => r.json());
const BB = await fetch('/assets/models/newgenmc_vu_khi_huyen_thoai.bbmodel').then(r => r.json());
const skin = await loadSkin('/anim-test/src/skins/' + (params.get('skin') || '1') + '.png');
const SC = CFG.scale, D2R = Math.PI / 180;

// ------------------------------------------------------------ .bbmodel -> quads (same maths as tools/export_weapon.py)
const EL = {}; BB.elements.forEach(e => EL[e.uuid] = e);
const collect = n => n.children.flatMap(c => typeof c === 'string' ? (EL[c] && EL[c].visibility !== false ? [EL[c]] : []) : collect(c));
function rmat(r) { const e = new THREE.Euler(r[0] * D2R, r[1] * D2R, r[2] * D2R, 'ZYX'); return new THREE.Matrix4().makeRotationFromEuler(e); }   // Rz*Ry*Rx
function faces(e) {
  const inf = e.inflate || 0, f = e.from.map(v => v - inf), t = e.to.map(v => v + inf), R = rmat(e.rotation || [0, 0, 0]), o = new THREE.Vector3(...(e.origin || [0, 0, 0]));
  const [fx, fy, fz] = f, [tx, ty, tz] = t;
  const C = { north: [[tx, ty, fz], [fx, ty, fz], [tx, fy, fz]], south: [[fx, ty, tz], [tx, ty, tz], [fx, fy, tz]], east: [[tx, ty, tz], [tx, ty, fz], [tx, fy, tz]],
    west: [[fx, ty, fz], [fx, ty, tz], [fx, fy, fz]], up: [[fx, ty, fz], [tx, ty, fz], [fx, ty, tz]], down: [[fx, fy, tz], [tx, fy, tz], [fx, fy, fz]] };
  const out = [];
  for (const k in e.faces) { const fc = e.faces[k]; if (fc.texture == null || !C[k]) continue;
    out.push({ P: C[k].map(p => new THREE.Vector3(...p).sub(o).applyMatrix4(R).add(o)), fc }); }
  return out;
}
const texCache = {};
async function texture(i) {
  if (texCache[i]) return texCache[i];
  const T = BB.textures[i], img = new Image(); img.src = T.source; await img.decode();
  const uw = T.uv_width || 16, uh = T.uv_height || 16, fh = Math.round(img.width * uh / uw);
  const frames = img.height > fh && img.height % fh === 0 ? img.height / fh : 1;
  const tex = new THREE.Texture(img); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false; tex.needsUpdate = true;
  return texCache[i] = { tex, uw, uh: uh * frames };   // animated textures: frame 0 only
}
async function buildWeapon(W) {
  const g = BB.outliner.find(o => o.name === W.name); if (!g) throw new Error('no weapon group ' + W.name);
  let fl = collect(g).flatMap(faces);
  const pre = new THREE.Matrix4().makeRotationY((W.ry || 0) * D2R); if (W.flip) pre.multiply(new THREE.Matrix4().makeRotationX(Math.PI));
  fl.forEach(f => f.P.forEach(p => p.applyMatrix4(pre)));
  const bb = new THREE.Box3(); fl.forEach(f => { f.P.forEach(p => bb.expandByPoint(p)); bb.expandByPoint(f.P[1].clone().add(f.P[2]).sub(f.P[0])); });
  const native = bb.max.y - bb.min.y, s = W.len / native;
  const gp = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y + W.grip * native, (bb.min.z + bb.max.z) / 2);
  if (W.shift) { gp.x += W.shift[0]; gp.z += W.shift[1]; }   // handle that is off the model's centre line (bow riser), native px
  const byTex = {}; fl.forEach(f => (byTex[f.fc.texture] = byTex[f.fc.texture] || []).push(f));
  const group = new THREE.Group();
  for (const ti in byTex) { const T = await texture(+ti), p = [], uv = [], idx = [];
    for (const { P, fc } of byTex[ti]) { const [A, B, C] = P.map(v => v.clone().sub(gp).multiplyScalar(s)), Dq = B.clone().add(C).sub(A);
      const [u1, v1, u2, v2] = fc.uv; let uvs = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]]; const r = ((fc.rotation || 0) / 90 | 0) % 4; uvs = uvs.slice(r).concat(uvs.slice(0, r));
      const [ua, ub, , uc] = uvs, ud = [ub[0] + uc[0] - ua[0], ub[1] + uc[1] - ua[1]], n = p.length / 3;
      for (const v of [A, B, C, Dq]) p.push(v.x, v.y, v.z); for (const x of [ua, ub, uc, ud]) uv.push(x[0] / T.uw, x[1] / T.uh); idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: T.tex, roughness: 0.6, metalness: 0.15, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color(0.3, 0.3, 0.3), emissiveMap: T.tex }))); }
  const ext = { x: (bb.max.x - bb.min.x) * s, z: (bb.max.z - bb.min.z) * s, y0: -W.grip * W.len, y1: (1 - W.grip) * W.len, native };
  return { group, ext };
}

// ------------------------------------------------------------ scene
const CW = 860, CH = 900, HEAD = 128, VH = CH - HEAD, SIDE_W = 530, FRONT_W = CW - SIDE_W, PPB = 228, GROUND = 46, SIDE_CZ = 0.52;
const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); gl.setSize(CW, VH); gl.setPixelRatio(2); gl.setClearColor(0, 0);
gl.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f9c, 1.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-3, 5, 4); scene.add(sun);
function cam(w, eye, cx) {   // orthographic, 1 block = PPB px, ground GROUND px above the bottom edge
  const c = new THREE.OrthographicCamera(-w / PPB / 2, w / PPB / 2, (VH - GROUND) / PPB, -GROUND / PPB, 0.1, 50);
  c.position.copy(eye); c.lookAt(eye.x ? new THREE.Vector3(0, 0, eye.z) : new THREE.Vector3(eye.x, 0, 0)); c.position.y = 0;
  c.up.set(0, 1, 0); return c;
}
// side view: camera on the fighter's right, looking along +x (the fighter faces screen right)
const camSide = new THREE.OrthographicCamera(-SIDE_W / PPB / 2, SIDE_W / PPB / 2, (VH - GROUND) / PPB, -GROUND / PPB, 0.1, 50);
camSide.position.set(-10, 0, SIDE_CZ); camSide.lookAt(0, 0, SIDE_CZ);
// front view: straight on, turned 20 deg toward the weapon hand so the grip is not hidden by the fist
const camFront = new THREE.OrthographicCamera(-FRONT_W / PPB / 2, FRONT_W / PPB / 2, (VH - GROUND) / PPB, -GROUND / PPB, 0.1, 50);
function aimFront(left, two) { const a = (left ? 22 : two ? -10 : -22) * D2R, cx = left ? 0.1 : -0.1; camFront.position.set(Math.sin(a) * 10 + cx, 0, Math.cos(a) * 10); camFront.lookAt(cx, 0, 0); camFront.updateMatrixWorld(true); }
camSide.updateMatrixWorld(true);

const POSE = {
  '1h': { rArm: [-42, 0, -10], rElbow: [-52, 0, 0], lArm: [6, 0, 8], lElbow: [-10, 0, 0], bd: [0, 0.80, 0.60] },
  two: { rArm: [-30, 0, 0], rElbow: [-30, 0, 0], lArm: [-30, 0, 0], lElbow: [-30, 0, 0] },   // arms are replaced by IK in twoHand()
  bow: { lArm: [-78, 0, 6], lElbow: [-8, 0, 0], rArm: [6, 0, -8], rElbow: [-10, 0, 0], bd: [0, 1, 0] },
};
const cards = [];
async function build(W) {
  const { group, ext } = await buildWeapon(W);
  const edgeUp = ext.x >= ext.z ? 'x' : 'z', bow = W.mode === 'bow';
  const two = W.mode === '2h';
  const ch = buildCharacter(skin, group, SC, { hand: bow ? 'l' : 'r', lh: null, edgeUp: bow || two ? null : edgeUp, twist: bow ? (W.twist ?? 270) * D2R : null });
  // the weapon axis runs through the CENTRE of the fist (the last 4 px cube of the arm), not the hand bone at the arm's end
  ch.weapon.parent.position.y += W.off ?? 1.5;
  const P = { pos: [0, 0, 0], yaw: 0, ...(two ? POSE.two : POSE[bow ? 'bow' : '1h']), ...(W.poseOver || {}) };
  applyPose(ch, P); ch.root.updateMatrixWorld(true);
  const c = { W, ch, ext, P, bow };
  if (two) twoHand(c, edgeUp);
  else if (W.face === -1) ch.weapon.rotateY(Math.PI);   // single-edged blade: turn it about its own axis so the cutting edge leads
  ch.root.updateMatrixWorld(true);
  return c;
}
// ---- two-handed hold: both fists on the handle in front of the chest. Minecraft arms are short (8 px shoulder -> fist centre), so both
// hands only meet on the centre line at chest height; the weapon crosses the chest on a diagonal, main (right) hand above, second hand
// below it at W.lh px along the weapon. Both arms are solved by 2-bone IK to the fist CENTRES, and the reach is checked.
const HOLD = { gs: { R: [-1.5, 21.5, 5.3], d: [-0.5, 0.8, 0.33] }, pole: { R: [-1.6, 21, 6], d: [-0.66, 0.70, 0.27] } };
function armIK(ch, side, targetW, poleBody) {   // shoulder -> elbow 4 px, elbow -> fist centre 4 px; returns how far the fist ends from the target (px)
  const b = ch.bones, clav = b[side + 'Clav'], sh = b[side + 'Sh'], el = b[side + 'El'], a = 4, bb = 4; ch.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(clav.matrixWorld).invert(), tgt = targetW.clone().applyMatrix4(inv), pole = new THREE.Vector3(...poleBody).transformDirection(inv).normalize();
  const dv = tgt.clone().sub(sh.position); let L = Math.min(Math.max(dv.length(), 0.6), a + bb - 0.02); const dh = dv.normalize();
  const alpha = Math.acos(Math.min(1, Math.max(-1, (a * a + L * L - bb * bb) / (2 * a * L))));
  let p = pole.clone().sub(dh.clone().multiplyScalar(pole.dot(dh))); if (p.lengthSq() < 1e-6) p.set(0, 0, 1); p.normalize();
  const u = dh.clone().multiplyScalar(Math.cos(alpha)).add(p.clone().multiplyScalar(Math.sin(alpha))), y = u.clone().negate();
  let z = p.clone().sub(u.clone().multiplyScalar(p.dot(u))).normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize(); z = new THREE.Vector3().crossVectors(x, y);
  sh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  el.rotation.set(Math.PI - Math.acos(Math.min(1, Math.max(-1, (a * a + bb * bb - L * L) / (2 * a * bb)))), 0, 0);
  ch.root.updateMatrixWorld(true); return el.localToWorld(new THREE.Vector3(0, -4, 0)).distanceTo(targetW) * 16;
}
function twoHand(c, edgeUp) {
  const { W, ch } = c, H = HOLD[W.hold || 'pole'], d = new THREE.Vector3(...(W.dir || H.d)).normalize(), gap = Math.abs(W.lh) * SC;   // gap between the fists, rig px
  let R = new THREE.Vector3(...(W.at || H.R)), best = null;
  for (let k = 0; k < 14; k++) {   // slide the pair sideways until BOTH fists reach their spot
    const Rw = R.clone().multiplyScalar(1 / 16), Lw = R.clone().addScaledVector(d, -gap).multiplyScalar(1 / 16);
    const er = armIK(ch, 'r', Rw, [-0.9, -0.5, 0.15]), el = armIK(ch, 'l', Lw, [0.9, -0.55, 0.15]);
    if (!best || er + el < best.e) best = { e: er + el, R: R.clone() }; if (er < 0.05 && el < 0.05) break; R.x += el > er ? 0.3 : -0.3; }
  R = best.R; const Rw = R.clone().multiplyScalar(1 / 16), Lw = R.clone().addScaledVector(d, -gap).multiplyScalar(1 / 16);
  c.reach = [armIK(ch, 'r', Rw, [-0.9, -0.5, 0.15]), armIK(ch, 'l', Lw, [0.9, -0.55, 0.15])];
  // weapon: long axis along d, wide side (blade edge, hammer head) in the forward plane
  const F = new THREE.Vector3(0, 0, W.face ?? 1), w = F.addScaledVector(d, -F.dot(d)).normalize(), m = new THREE.Matrix4();
  if (edgeUp === 'x') m.makeBasis(w, d, new THREE.Vector3().crossVectors(w, d)); else m.makeBasis(new THREE.Vector3().crossVectors(d, w), d, w);
  ch.bones.rHand.rotation.set(0, 0, 0); ch.root.updateMatrixWorld(true);
  const pq = new THREE.Quaternion(); ch.weapon.parent.getWorldQuaternion(pq); ch.weapon.quaternion.copy(pq.invert().multiply(new THREE.Quaternion().setFromRotationMatrix(m)));
}
for (const W of CFG.weapons) cards.push(await build(W));

// ------------------------------------------------------------ drawing
const out = document.getElementById('out'); out.width = CW; out.height = CH; const g = out.getContext('2d');
const GREEN = 'rgb(112,222,132)', ORANGE = 'rgb(255,164,104)';
const STATUS = { fight: ['USED IN FIGHTS', GREEN], exported: ['EXPORTED, NOT USED YET', '#fff'], new: ['NEW: FIRST GUESS', ORANGE] };
function px(v, c, x0, w) { const q = v.clone().project(c); return [x0 + (q.x + 1) / 2 * w, HEAD + (1 - q.y) / 2 * VH]; }
function grid(x0, w, c) {
  g.save(); g.beginPath(); g.rect(x0, HEAD, w, VH); g.clip();
  g.fillStyle = '#414a5c'; g.fillRect(x0, HEAD, w, VH);
  const gy = HEAD + VH - GROUND, mid = x0 + w / 2 - ((c === camSide ? 0.42 : 0) * 0);   // vertical lines centred on the view centre
  for (let k = -8; k <= 8; k++) { const x = Math.round(x0 + w / 2 + k * PPB / 2) + 0.5; g.strokeStyle = k % 2 ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.24)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, HEAD); g.lineTo(x, gy); g.stroke(); }
  for (let k = 1; k <= 8; k++) { const y = Math.round(gy - k * PPB / 2) + 0.5; g.strokeStyle = k % 2 ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.24)'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
  g.fillStyle = '#2b313d'; g.fillRect(x0, gy, w, GROUND); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, gy); g.lineTo(x0 + w, gy); g.stroke();
  g.restore();
}
function dot(p, col, r = 7) { g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fillStyle = 'rgba(10,12,16,.9)'; g.fill(); g.lineWidth = 3; g.strokeStyle = col; g.stroke(); g.beginPath(); g.arc(p[0], p[1], 2, 0, 7); g.fillStyle = col; g.fill(); }
function text(s, x, y, font, col = '#fff', align = 'left') { g.font = font; g.textAlign = align; g.fillStyle = 'rgba(8,6,12,.7)'; g.fillText(s, x + 1, y + 2); g.fillStyle = col; g.fillText(s, x, y); }
function measure(c) {
  const { ch, ext, W } = c, wp = a => ch.weapon.localToWorld(new THREE.Vector3(0, a, 0));
  const tip = wp(ext.y1), butt = wp(ext.y0), hand = wp(0), lh = W.mode === '2h' ? wp(W.lh) : null;
  let top = -1e9, low = 1e9; const v = new THREE.Vector3();
  ch.weapon.children.forEach(m => { const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); ch.weapon.localToWorld(v); top = Math.max(top, v.y); low = Math.min(low, v.y); } });
  return { tip, butt, hand, lh, top, low, len: W.len * SC / 16, wide: Math.max(ext.x, ext.z) * SC / 16 };
}
function visibleTop(ch) {   // highest visible weapon pixel in the side view (transparent glow quads do not count), in blocks
  const body = ch.root.children.filter(o => o.isSkinnedMesh); body.forEach(o => o.visible = false);
  gl.setScissorTest(false); gl.clear(); gl.setViewport(0, 0, SIDE_W, VH); gl.render(scene, camSide); body.forEach(o => o.visible = true);
  const c = gl.getContext(), w = c.drawingBufferWidth, h = c.drawingBufferHeight, k = h / VH, buf = new Uint8Array(w * h * 4); c.readPixels(0, 0, w, h, c.RGBA, c.UNSIGNED_BYTE, buf);
  for (let y = h - 1; y >= 0; y--) for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > 40) return (y / k - GROUND) / PPB;
  return 0;
}
function draw(i) {
  const c = cards[i], { W, ch, bow } = c, M = measure(c);
  for (const k of cards) scene.remove(k.ch.root); scene.add(ch.root); aimFront(bow, W.mode === '2h');
  M.top = c.top ?? (c.top = visibleTop(ch));
  gl.setScissorTest(true); gl.clear();
  gl.setViewport(0, 0, SIDE_W, VH); gl.setScissor(0, 0, SIDE_W, VH); gl.render(scene, camSide);
  gl.setViewport(SIDE_W, 0, FRONT_W, VH); gl.setScissor(SIDE_W, 0, FRONT_W, VH); gl.render(scene, camFront);
  g.clearRect(0, 0, CW, CH); g.fillStyle = '#14161c'; g.fillRect(0, 0, CW, CH);
  grid(0, SIDE_W, camSide); grid(SIDE_W, FRONT_W, camFront);
  const gy = HEAD + VH - GROUND;
  // player height (2 blocks) and weapon top lines
  const yl = h => gy - h * PPB;
  g.setLineDash([8, 6]); g.lineWidth = 2;
  g.strokeStyle = GREEN; g.beginPath(); g.moveTo(0, yl(2)); g.lineTo(CW, yl(2)); g.stroke();
  g.strokeStyle = ORANGE; g.beginPath(); g.moveTo(0, yl(M.top)); g.lineTo(CW, yl(M.top)); g.stroke(); g.setLineDash([]);
  g.drawImage(gl.domElement, 0, HEAD, CW, VH);
  g.fillStyle = '#14161c'; g.fillRect(SIDE_W - 2, HEAD, 4, VH);
  for (let h = 1; h <= 3; h++) text(h + '', 8, yl(h) - 6, '600 15px InterV', '#fff');
  text('PLAYER 2.00', CW - 12, yl(2) - 7, '700 14px InterV', GREEN, 'right');
  text('TOP ' + M.top.toFixed(2), 34, yl(M.top) - 7, '700 14px InterV', ORANGE);
  // grip markers in both views
  for (const [cm, x0, w] of [[camSide, 0, SIDE_W], [camFront, SIDE_W, FRONT_W]]) {
    g.save(); g.beginPath(); g.rect(x0, HEAD, w, VH); g.clip();
    const a = px(M.butt, cm, x0, w), b = px(M.tip, cm, x0, w);
    g.strokeStyle = 'rgba(255,164,104,.75)'; g.lineWidth = 1.5; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.setLineDash([]);
    dot(px(M.hand, cm, x0, w), GREEN); if (M.lh) dot(px(M.lh, cm, x0, w), '#fff', 6);
    dot(b, ORANGE, 4); dot(a, ORANGE, 4);
    g.restore(); }
  text('SIDE', 12, CH - 14, '700 14px InterV'); text('FRONT', SIDE_W + 12, CH - 14, '700 14px InterV');
  // header
  const hands = bow ? 'left hand (bow arm)' : W.mode === '2h' ? 'two hands' : 'one hand';
  text(String(i + 1).padStart(2, '0'), 20, 50, '34px MontEB', GREEN); text((W.label || W.name).toUpperCase(), 76, 50, '34px MontEB');
  const [st, sc] = STATUS[W.status]; text(st, CW - 20, 46, '700 15px InterV', sc, 'right');
  const wt = weightOf(i); { let x2 = 20; const s2 = (t, col = '#fff', f = '600 19px InterV') => { text(t, x2, 80, f, col); g.font = f; x2 += g.measureText(t).width; };
    s2(W.kind + '  ·  ' + hands + '  ·  '); s2(wt.cls.toUpperCase(), WCOL[wt.cls], '800 19px InterV'); s2('  ' + wt.pctOfBody + '% of the body, heft ' + wt.heft); }
  g.font = '600 19px InterV'; let x = 20;
  const seg = (s, col = '#fff') => { text(s, x, 110, '600 19px InterV', col); x += g.measureText(s).width; };
  seg('Length '); seg(M.len.toFixed(2) + ' blocks', ORANGE); seg('  =  '); seg(Math.round(M.len / 2 * 100) + '% of player', ORANGE);
  seg('     Grip at '); seg(Math.round(W.grip * 100) + '%', GREEN); seg(' from the bottom');
  if (W.mode === '2h') { seg('     2nd hand '); seg(Math.abs(W.lh * SC / 16).toFixed(2) + (W.lh < 0 ? ' below' : ' above'), '#fff'); }
  return { name: W.name, lengthBlocks: +M.len.toFixed(3), pctOfPlayer: Math.round(M.len / 2 * 100), top: +M.top.toFixed(2), low: +M.low.toFixed(2), widthBlocks: +M.wide.toFixed(2), nativePx: +c.ext.native.toFixed(1), weight: wt.cls, pctOfBody: wt.pctOfBody, balanceBlocks: wt.balanceBlocks, heft: wt.heft, fistMissPx: c.reach ? c.reach.map(v => +v.toFixed(2)) : undefined };
}
window.cell = i => { draw(i); return out.toDataURL('image/png'); };
window.info = () => cards.map((_, i) => draw(i));
window.count = cards.length;
window.sheet = (cols = 5) => {   // every card on one canvas
  const rows = Math.ceil(cards.length / cols), S = document.createElement('canvas'), pad = 16, top = 120; S.width = cols * CW + (cols + 1) * pad; S.height = rows * CH + (rows + 1) * pad + top;
  const s = S.getContext('2d'); s.fillStyle = '#0c0d11'; s.fillRect(0, 0, S.width, S.height);
  s.font = '54px MontEB'; s.fillStyle = '#fff'; s.fillText('WEAPON GRIP + SCALE REFERENCE', pad + 8, 78);
  s.font = '600 24px InterV'; s.textAlign = 'right';
  s.fillText('grid: thin lines 0.5 block, bright lines 1 block   ·   player = 2 blocks (32 px)   ·   green dot = main hand, white dot = second hand, orange dots = weapon ends', S.width - pad - 8, 72);
  cards.forEach((_, i) => { draw(i); s.drawImage(out, pad + (i % cols) * (CW + pad), top + pad + (i / cols | 0) * (CH + pad)); });
  return S.toDataURL('image/png');
};

// ------------------------------------------------------------ model inspection (?dbg): each weapon alone, upright, wide side and narrow side,
// with a ruler in % of its length from the bottom. Used to find the real handle of every model. window.models(from, to) -> PNG data URL
window.models = async (from, to) => {
  const MW = 380, MH = 900, S = document.createElement('canvas'); S.width = MW * (to - from); S.height = MH; const s = S.getContext('2d');
  const r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r2.setSize(MW, MH); r2.setClearColor(0, 0);
  const sc2 = new THREE.Scene(); sc2.add(new THREE.HemisphereLight(0xffffff, 0x8a8f9c, 2.2));
  for (let i = from; i < to; i++) { const W = { ...CFG.weapons[i], len: 100, grip: 0 }, { group, ext } = await buildWeapon(W);
    const k = 7.6, cam2 = new THREE.OrthographicCamera(-MW / k / 2, MW / k / 2, (MH - 40) / k - 4, -4 - 40 / k, -500, 500); sc2.add(group);
    const wideX = ext.x >= ext.z; r2.setScissorTest(true); r2.clear();
    for (const [vx, vw, side] of [[0, 230, 0], [230, 150, 1]]) { const lookX = wideX ? side : 1 - side;   // view 0 = wide face, view 1 = narrow face
      cam2.left = -vw / k / 2; cam2.right = vw / k / 2; cam2.updateProjectionMatrix(); cam2.position.set(lookX ? -200 : 0, 0, lookX ? 0 : 200); cam2.lookAt(0, 0, 0); cam2.position.y = 0; cam2.updateMatrixWorld(true);
      r2.setViewport(vx, 0, vw, MH); r2.setScissor(vx, 0, vw, MH); r2.render(sc2, cam2); }
    sc2.remove(group); const x0 = (i - from) * MW; s.fillStyle = '#414a5c'; s.fillRect(x0, 0, MW, MH); s.fillStyle = '#14161c'; s.fillRect(x0 + MW - 2, 0, 2, MH);
    for (let p = 0; p <= 100; p += 5) { const y = MH - 40 - (p + 4) * k + 4 * k - 4 * k + 0; const yy = MH - (40 / k + 4 + p) * k + 0; s.strokeStyle = p % 10 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.32)'; s.beginPath(); s.moveTo(x0, yy + .5); s.lineTo(x0 + MW, yy + .5); s.stroke();
      if (p % 10 === 0) { s.fillStyle = '#fff'; s.font = '600 13px InterV'; s.fillText(p + '', x0 + 4, yy - 3); } }
    s.drawImage(r2.domElement, x0, 0, MW, MH); s.fillStyle = '#fff'; s.font = '700 17px InterV'; s.fillText((i + 1) + ' ' + (W.label || W.name) + '  native ' + ext.native.toFixed(0) + 'px  wide:' + (wideX ? 'x' : 'z'), x0 + 8, 20); }
  return S.toDataURL('image/png');
};

// ------------------------------------------------------------ weight: solid volume of each model at its in-hand size, against the player's
// body (1664 px^3: head 512, torso 384, arms 2 x 192, legs 2 x 192). The model is voxelised (0.5 native px grid; overlapping cubes
// count once, flat glow planes count nothing). balance = how far the centre of mass sits from the main fist, in blocks.
window.weights = () => CFG.weapons.map(W => {
  const g = BB.outliner.find(o => o.name === W.name), els = collect(g), bb = new THREE.Box3();
  els.flatMap(faces).forEach(f => { f.P.forEach(p => bb.expandByPoint(p)); bb.expandByPoint(f.P[1].clone().add(f.P[2]).sub(f.P[0])); });
  const native = bb.max.y - bb.min.y, k = W.len / native * SC, gy = bb.min.y + W.grip * native, st = 0.5;
  const E = els.map(e => { const inf = e.inflate || 0; return { f: e.from.map(v => v - inf), t: e.to.map(v => v + inf), Ri: rmat(e.rotation || [0, 0, 0]).invert(), o: new THREE.Vector3(...(e.origin || [0, 0, 0])) }; })
    .filter(e => e.t[0] - e.f[0] > 0.05 && e.t[1] - e.f[1] > 0.05 && e.t[2] - e.f[2] > 0.05);
  let n = 0, sy = 0; const q = new THREE.Vector3(), xs = new Set(), zs = new Set();
  for (let x = bb.min.x + st / 2; x < bb.max.x; x += st) for (let y = bb.min.y + st / 2; y < bb.max.y; y += st) for (let z = bb.min.z + st / 2; z < bb.max.z; z += st)
    for (const e of E) { q.set(x, y, z).sub(e.o).applyMatrix4(e.Ri).add(e.o);
      if (q.x >= e.f[0] && q.x <= e.t[0] && q.y >= e.f[1] && q.y <= e.t[1] && q.z >= e.f[2] && q.z <= e.t[2]) { n++; sy += y; break; } }
  const vol = n * st ** 3 * k ** 3;   // rig px^3
  return { name: W.label || W.name, mode: W.mode, volPx3: Math.round(vol), pctOfBody: +(vol / 1664 * 100).toFixed(1), lengthBlocks: +(W.len * SC / 16).toFixed(2),
    widthBlocks: +(Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * k / 16).toFixed(2), thickBlocks: +(Math.min(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * k / 16).toFixed(2),
    balanceBlocks: +((sy / Math.max(1, n) - gy) * k / 16).toFixed(2) };
});

// heft = volume (% of the player's body) x (1 + distance of the centre of mass from the fist, blocks): a top-heavy weapon swings heavier
// than its volume says. Classes and thresholds come from weapons.json (weightClasses); "weight" on a weapon overrides the class.
const WCOL = { light: GREEN, medium: '#fff', heavy: ORANGE }; let WTS = null;
function weightOf(i) { WTS ??= window.weights().map((w, k) => { const heft = +(w.pctOfBody * (1 + Math.abs(w.balanceBlocks))).toFixed(1), T = CFG.weightClasses;
  return { ...w, heft, cls: CFG.weapons[k].weight || (heft < T.light.maxHeft ? 'light' : heft < T.medium.maxHeft ? 'medium' : 'heavy') }; }); return WTS[i]; }
window.weightTable = () => cards.map((_, i) => weightOf(i));
draw(0); window.ready = true;
