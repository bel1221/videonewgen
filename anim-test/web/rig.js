// Jointed Minecraft character from a 64x64 skin: head, chest/waist (bendable torso), arms with elbows, legs with knees.
// Every limb is split into an upper and a lower half (6 px each) like Mine-imator style bendable rigs; the cut faces use
// the 1-px texture row at the joint so a bend never shows a hole. Base + overlay (second) layer, slim (3 px) arms supported.
// Units: pixels (32 px tall), the root is scaled 1/16 so 1 block = 1 unit.
import * as THREE from 'three';

const D2R = Math.PI / 180;

// box faces as (A top-left, B top-right, C bottom-left) + skin uv, ported from newgen-ban/tools/mcchar.py box_quads
function boxQuads(u, v, w, h, d, x0, y0, z0, inf, r0, r1, hFull) {
  // rows r0..r1 of the side texture (0 = top of the limb), geometry covers that slice of a limb whose full height is hFull
  const y1g = y0 + (hFull - r0), y0g = y0 + (hFull - r1);
  const X0 = x0 - inf, X1 = x0 + w + inf, Y0 = y0g - (r1 === hFull ? inf : 0), Y1 = y1g + (r0 === 0 ? inf : 0), Z0 = z0 - inf, Z1 = z0 + d + inf;
  const q = (A, B, C, uu, vv, ww, hh) => ({ A, B, C, uvA: [uu, vv], uvB: [uu + ww, vv], uvC: [uu, vv + hh] });
  const sv = v + d + r0, sh = r1 - r0;
  const out = [
    q([X0, Y1, Z1], [X1, Y1, Z1], [X0, Y0, Z1], u + d, sv, w, sh),               // front (+z)
    q([X1, Y1, Z0], [X0, Y1, Z0], [X1, Y0, Z0], u + 2 * d + w, sv, w, sh),       // back
    q([X0, Y1, Z0], [X0, Y1, Z1], [X0, Y0, Z0], u, sv, d, sh),                   // right side (-x)
    q([X1, Y1, Z1], [X1, Y1, Z0], [X1, Y0, Z1], u + d + w, sv, d, sh),           // left side (+x)
  ];
  // top cap: real top texture at the limb top, else the 1-px row at the cut
  if (r0 === 0) out.push(q([X0, Y1, Z0], [X1, Y1, Z0], [X0, Y1, Z1], u + d, v, w, d));
  else out.push(q([X0, Y1, Z0], [X1, Y1, Z0], [X0, Y1, Z1], u + d, v + d + r0, w, 1));
  if (r1 === hFull) out.push(q([X0, Y0, Z1], [X1, Y0, Z1], [X0, Y0, Z0], u + d + w, v, w, d));
  else out.push(q([X0, Y0, Z1], [X1, Y0, Z1], [X0, Y0, Z0], u + d, v + d + r1 - 1, w, 1));
  return out;
}

function quadsGeo(quads, texW = 64, texH = 64) {
  const p = [], uv = [], idx = [];
  for (const Q of quads) {
    const A = Q.A, B = Q.B, C = Q.C, Dp = [B[0] + C[0] - A[0], B[1] + C[1] - A[1], B[2] + C[2] - A[2]];
    const uvD = [Q.uvB[0] + Q.uvC[0] - Q.uvA[0], Q.uvB[1] + Q.uvC[1] - Q.uvA[1]];
    const b = p.length / 3; p.push(...A, ...B, ...C, ...Dp);
    for (const t of [Q.uvA, Q.uvB, Q.uvC, uvD]) uv.push(t[0] / texW, t[1] / texH);
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);       // (A,C,B) (B,C,D): outward = cross(C-A, B-A)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals(); return g;
}

export function loadSkin(url) {
  return new Promise(res => new THREE.TextureLoader().load(url, t => {
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
    // slim detection: classic arms fill x=54..55 on rows 20..31
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.drawImage(t.image, 0, 0);
    const a = g.getImageData(54, 20, 2, 12).data; let filled = 0; for (let i = 3; i < a.length; i += 4) filled += a[i] > 0;
    t.userData.slim = filled === 0; res(t);
  }));
}

export function buildCharacter(skin, weaponGroup) {
  const slim = skin.userData.slim, aw = slim ? 3 : 4;
  const mat = new THREE.MeshStandardMaterial({ map: skin, roughness: 0.85, metalness: 0, alphaTest: 0.5, side: THREE.FrontSide });
  const matO = new THREE.MeshStandardMaterial({ map: skin, roughness: 0.85, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide });
  const mesh = (q, m) => { const o = new THREE.Mesh(quadsGeo(q), m); o.castShadow = true; o.receiveShadow = true; return o; };
  // part: base uv, overlay uv, size, min corner (in the part's own pivot space), rows
  const part = (uB, vB, uO, vO, w, h, d, x0, y0, z0, r0, r1, infO) => {
    const g = new THREE.Group();
    g.add(mesh(boxQuads(uB, vB, w, h, d, x0, y0, z0, 0, r0, r1, h), mat));
    g.add(mesh(boxQuads(uO, vO, w, h, d, x0, y0, z0, infO, r0, r1, h), matO));
    return g;
  };
  const root = new THREE.Group(); root.scale.setScalar(1 / 16);
  const J = {};
  // legs: hip pivot at y=12, knee at y=6 (local coords: hip at 0)
  for (const [k, uB, vB, uO, vO, xc] of [['rLeg', 0, 16, 0, 32, -2], ['lLeg', 16, 48, 0, 48, 2]]) {
    const hip = new THREE.Group(); hip.position.set(xc, 12, 0); root.add(hip);
    hip.add(part(uB, vB, uO, vO, 4, 12, 4, -2, -12, -2, 0, 6, 0.25));
    const knee = new THREE.Group(); knee.position.set(0, -6, 0); hip.add(knee);
    knee.add(part(uB, vB, uO, vO, 4, 12, 4, -2, -6, -2, 6, 12, 0.25));
    J[k] = hip; J[k.replace('Leg', 'Knee')] = knee;
  }
  // torso: waist pivot y=12 (lower body), chest pivot y=18 (upper body)
  const waist = new THREE.Group(); waist.position.set(0, 12, 0); root.add(waist); J.waist = waist;
  waist.add(part(16, 16, 16, 32, 8, 12, 4, -4, 0, -2, 6, 12, 0.25));        // rows 6..12 -> y 0..6 above the waist
  const chest = new THREE.Group(); chest.position.set(0, 6, 0); waist.add(chest); J.chest = chest;
  chest.add(part(16, 16, 16, 32, 8, 12, 4, -4, -6, -2, 0, 6, 0.25));        // rows 0..6 -> y 0..6 above the chest pivot
  // head pivot at y=24 (chest local +6)
  const head = new THREE.Group(); head.position.set(0, 6, 0); chest.add(head); J.head = head;
  head.add(part(0, 0, 32, 0, 8, 8, 8, -4, 0, -4, 0, 8, 0.5));
  // arms: shoulder pivot at y=22 (chest local +4), elbow 6 px lower
  for (const [k, uB, vB, uO, vO, side] of [['rArm', 40, 16, 40, 32, -1], ['lArm', 32, 48, 48, 48, 1]]) {
    const sh = new THREE.Group(); sh.position.set(side * (4 + aw / 2), 4, 0); chest.add(sh);
    sh.add(part(uB, vB, uO, vO, aw, 12, 4, -aw / 2, -10, -2, 0, 6, 0.25));    // upper arm y -4..+2 around the shoulder
    const el = new THREE.Group(); el.position.set(0, -4, 0); sh.add(el);
    el.add(part(uB, vB, uO, vO, aw, 12, 4, -aw / 2, -6, -2, 6, 12, 0.25));    // forearm y -6..0 below the elbow
    J[k] = sh; J[k.replace('Arm', 'Elbow')] = el;
    if (k === 'rArm' && weaponGroup) {
      const sock = new THREE.Group(); sock.position.set(0, -5.5, 0); el.add(sock);   // hand
      weaponGroup.rotation.set(90 * D2R, 0, 0);                                     // blade forward when the arm hangs
      sock.add(weaponGroup); J.socket = sock; J.weapon = weaponGroup;
    }
  }
  return { root, J, slim };
}

// pose: {pos:[x,y,z] blocks, yaw deg, and joints as [x,y,z] deg in three.js rotation sense}
// sign guide: arm/leg raise forward = -x; elbow bend = -x; knee bend = +x; waist/chest lean forward = +x; head nod down = +x
export const JOINTS = ['waist', 'chest', 'head', 'rArm', 'rElbow', 'lArm', 'lElbow', 'rLeg', 'rKnee', 'lLeg', 'lKnee'];
export function applyPose(ch, P) {
  const tl = P.tilt || [0, 0];
  ch.root.position.set(...P.pos); ch.root.rotation.set(tl[0] * D2R, (P.yaw || 0) * D2R, tl[1] * D2R, 'YXZ');   // tilt: whole-body pitch/roll (rolls, falls)
  for (const j of JOINTS) { const r = P[j] || [0, 0, 0]; ch.J[j].rotation.set(r[0] * D2R, r[1] * D2R, r[2] * D2R, 'XYZ'); }
  if (ch.J.weapon) ch.J.weapon.rotation.set((P.wrist ?? 160) * D2R, 0, 0);
  if (ch.J.socket) ch.J.socket.rotation.set(0, (P.roll || 0) * D2R, 0);   // wrist roll about the forearm axis (sideways blocks)   // 90 = blade perpendicular to the forearm (fist grip); ~180 = along it (thrust)
}

export function buildWeapon(json, base) {
  const g = new THREE.Group(); const loader = new THREE.TextureLoader();
  const byTex = {};
  json.quads.forEach(q => (byTex[q.t] = byTex[q.t] || []).push(q));
  for (const t in byTex) {
    const T = json.textures[t]; const tex = loader.load(base + T.file); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
    const quads = byTex[t].map(q => ({ A: q.p[0], B: q.p[1], C: q.p[2], uvA: q.uv[0], uvB: q.uv[1], uvC: q.uv[2] }));
    const m = new THREE.Mesh(quadsGeo(quads, T.uw, T.uh), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.35, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color(0.25, 0.22, 0.15), emissiveMap: tex }));
    m.castShadow = true; g.add(m);
  }
  return g;
}
