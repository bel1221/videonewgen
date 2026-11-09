// Rig v2: one skinned mesh per character (Mine-imator-style bendy limbs, as in the Desert Arena reference).
// Skeleton: hips -> spine -> chest -> head / shoulders -> elbows -> hands(weapon); hips -> thighs -> shins.
// Every limb box is subdivided per texture row and skinned across its joint with a soft blend zone, so elbows, knees
// and the waist bend as one continuous shape instead of two hinged boxes. Legs are driven by 2-bone IK to world-space
// foot targets (feet stay planted, nothing sinks into the floor); arms/torso by FK angles.
// Units inside the rig: pixels (char = 32 px tall); the mesh is scaled 1/16 so 1 block = 1 unit.
import * as THREE from 'three';
const D2R = Math.PI / 180, PX = 1 / 16;
// blade twist in the fist (about the blade's own axis): 90 deg turns the flat of the blade to face sideways, edge leading
export let TWIST = Math.PI / 2; export function setTwist(deg) { TWIST = deg * D2R; }
export const LEG = 6 * PX;                         // thigh = shin = 6 px

// ---------------------------------------------------------------- geometry
// Box with Minecraft box-UV, subdivided along Y (one segment per texture row), each vertex skinned by weightFn(y).
function skinnedBox(G, u, v, w, h, d, x0, y0, z0, inf, weightFn, texW = 64) {
  const X0 = x0 - inf, X1 = x0 + w + inf, Y0 = y0 - inf, Y1 = y0 + h + inf, Z0 = z0 - inf, Z1 = z0 + d + inf;
  const rows = h, uvs = (a, b) => [a / texW, b / 64];
  const face = (corner, axU, axV, nu, nv, uv0, du, dv, nrm) => {   // grid face: corner + i*axU/nu + j*axV/nv
    const base = G.p.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const p = [0, 1, 2].map(k => corner[k] + axU[k] * i / nu + axV[k] * j / nv);
      G.p.push(...p); G.n.push(...nrm); G.uv.push(...uvs(uv0[0] + du * i / nu, uv0[1] + dv * j / nv));
      const [bi, wi] = weightFn(p[1]); G.si.push(...bi); G.sw.push(...wi);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, e = c + 1;
      G.idx.push(a, c, b, b, c, e);
    }
  };
  const ny = rows;
  // side faces run top (j=0) -> bottom (j=ny), texture rows top -> bottom
  face([X0, Y1, Z1], [X1 - X0, 0, 0], [0, -(Y1 - Y0), 0], 1, ny, [u + d, v + d], w, h, [0, 0, 1]);            // front +z
  face([X1, Y1, Z0], [-(X1 - X0), 0, 0], [0, -(Y1 - Y0), 0], 1, ny, [u + 2 * d + w, v + d], w, h, [0, 0, -1]); // back
  face([X0, Y1, Z0], [0, 0, Z1 - Z0], [0, -(Y1 - Y0), 0], 1, ny, [u, v + d], d, h, [-1, 0, 0]);               // right side (-x)
  face([X1, Y1, Z1], [0, 0, -(Z1 - Z0)], [0, -(Y1 - Y0), 0], 1, ny, [u + d + w, v + d], d, h, [1, 0, 0]);     // left side (+x)
  face([X0, Y1, Z0], [X1 - X0, 0, 0], [0, 0, Z1 - Z0], 1, 1, [u + d, v], w, d, [0, 1, 0]);                    // top
  face([X0, Y0, Z1], [X1 - X0, 0, 0], [0, 0, -(Z1 - Z0)], 1, 1, [u + d + w, v], w, d, [0, -1, 0]);            // bottom
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// two-bone weight: below jointY-blend -> lower bone, above jointY+blend -> upper bone
const two = (up, lo, jy, bl = 1.6) => y => { const wl = 1 - smooth(jy - bl, jy + bl, y); return [[up, lo, 0, 0], [1 - wl, wl, 0, 0]]; };
const one = b => () => [[b, 0, 0, 0], [1, 0, 0, 0]];

export function loadSkin(url) {
  return new Promise(res => new THREE.TextureLoader().load(url, t => {
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.drawImage(t.image, 0, 0);
    const a = g.getImageData(54, 20, 2, 12).data; let filled = 0; for (let i = 3; i < a.length; i += 4) filled += a[i] > 0;
    t.userData.slim = filled === 0; res(t);
  }));
}

// bone indices
// skeleton modelled on a human: pelvis -> lumbar (spine) -> lower thoracic (spine2) -> thoracic (chest) -> upper thoracic
// (chest2) -> neck -> head; clavicles on the upper chest carry the shoulders; hips carry the legs.
const B = { root: 0, hips: 1, spine: 2, spine2: 3, chest: 4, chest2: 5, neck: 6, head: 7, rClav: 8, lClav: 9, rSh: 10, rEl: 11, lSh: 12, lEl: 13,
  rTh: 14, rSn: 15, lTh: 16, lSn: 17, rHand: 18 };
// torso skin: each vertex blends the two vertebrae it sits between (centres 13, 16, 19, 22 px) -> a continuous curved back
function spineW(y) {
  const cs = [[13, B.spine], [16, B.spine2], [19, B.chest], [22, B.chest2]];
  if (y <= cs[0][0]) return [[cs[0][1], 0, 0, 0], [1, 0, 0, 0]];
  if (y >= cs[3][0]) return [[cs[3][1], 0, 0, 0], [1, 0, 0, 0]];
  for (let i = 0; i < 3; i++) if (y <= cs[i + 1][0]) { const u = (y - cs[i][0]) / 3, s = u * u * (3 - 2 * u); return [[cs[i][1], cs[i + 1][1], 0, 0], [1 - s, s, 0, 0]]; }
}
export function buildCharacter(skin, weaponGroup, weaponScale = 1) {
  const aw = skin.userData.slim ? 3 : 4;
  // bind-pose bone positions (absolute px, character at origin, feet at y=0)
  const abs = {
    root: [0, 0, 0], hips: [0, 12, 0], spine: [0, 12, 0], spine2: [0, 15, 0], chest: [0, 18, 0], chest2: [0, 21, 0], neck: [0, 23.5, 0], head: [0, 24, 0],
    rClav: [-1.5, 22, 0], lClav: [1.5, 22, 0],
    rSh: [-(4 + aw / 2), 22, 0], rEl: [-(4 + aw / 2), 18, 0], lSh: [4 + aw / 2, 22, 0], lEl: [4 + aw / 2, 18, 0],
    rTh: [-2, 12, 0], rSn: [-2, 6, 0], lTh: [2, 12, 0], lSn: [2, 6, 0], rHand: [-(4 + aw / 2), 12.5, 0],
  };
  const parent = { hips: 'root', spine: 'hips', spine2: 'spine', chest: 'spine2', chest2: 'chest', neck: 'chest2', head: 'neck', rClav: 'chest2', lClav: 'chest2', rSh: 'rClav', rEl: 'rSh', lSh: 'lClav', lEl: 'lSh', rTh: 'hips', rSn: 'rTh', lTh: 'hips', lSn: 'lTh', rHand: 'rEl' };
  const names = Object.keys(B), bones = {};
  for (const n of names) { const b = new THREE.Bone(); b.name = n; bones[n] = b; }
  for (const n of names) {
    const p = abs[n], q = parent[n] ? abs[parent[n]] : [0, 0, 0];
    bones[n].position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    if (parent[n]) bones[parent[n]].add(bones[n]);
  }
  const G = { p: [], n: [], uv: [], si: [], sw: [], idx: [] }, GO = { p: [], n: [], uv: [], si: [], sw: [], idx: [] };
  const part = (uB, vB, uO, vO, w, h, d, x0, y0, z0, inf, wf) => { skinnedBox(G, uB, vB, w, h, d, x0, y0, z0, 0, wf); skinnedBox(GO, uO, vO, w, h, d, x0, y0, z0, inf, wf); };
  part(0, 0, 32, 0, 8, 8, 8, -4, 24, -4, 0.5, one(B.head));
  part(16, 16, 16, 32, 8, 12, 4, -4, 12, -2, 0.25, spineW);
  part(40, 16, 40, 32, aw, 12, 4, -(4 + aw), 12, -2, 0.25, two(B.rSh, B.rEl, 18));
  part(32, 48, 48, 48, aw, 12, 4, 4, 12, -2, 0.25, two(B.lSh, B.lEl, 18));
  part(0, 16, 0, 32, 4, 12, 4, -4, 0, -2, 0.25, two(B.rTh, B.rSn, 6));
  part(16, 48, 0, 48, 4, 12, 4, 0, 0, -2, 0.25, two(B.lTh, B.lSn, 6));
  const mk = (g, side) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2)); geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(g.si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(g.sw, 4)); geo.setIndex(g.idx); geo.computeVertexNormals();
    const m = new THREE.SkinnedMesh(geo, new THREE.MeshStandardMaterial({ map: skin, roughness: 0.85, metalness: 0, alphaTest: 0.5, side }));
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; return m;
  };
  const body = mk(G, THREE.FrontSide), over = mk(GO, THREE.DoubleSide);
  const root = new THREE.Group(); root.scale.setScalar(PX);
  root.add(bones.root); root.add(body); root.add(over);
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(names.map(n => bones[n]));
  body.bind(skel); over.bind(skel);
  if (weaponGroup) { const s = new THREE.Group(); s.scale.setScalar(weaponScale); s.add(weaponGroup); bones.rHand.add(s); weaponGroup.rotation.set(Math.PI / 2, 0, 0); }
  return { root, bones, weapon: weaponGroup, aw, rest: abs };
}

// ---------------------------------------------------------------- posing
const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _e = new THREE.Euler();
function setRot(bone, r) { bone.rotation.set((r[0] || 0) * D2R, (r[1] || 0) * D2R, (r[2] || 0) * D2R, 'XYZ'); }

// 2-bone IK in the hips frame. hipLocal, target: px vectors in hips space. pole: unit vector (hips space) the knee points at.
function solveLeg(thigh, shin, hipLocal, target, pole) {
  const a = 6, b = 6; const d = target.clone().sub(hipLocal); let L = d.length();
  L = Math.min(Math.max(L, 0.6), a + b - 0.02); const dh = d.normalize();
  const cosA = (a * a + L * L - b * b) / (2 * a * L), alpha = Math.acos(Math.min(1, Math.max(-1, cosA)));
  let p = pole.clone().sub(dh.clone().multiplyScalar(pole.dot(dh))); if (p.lengthSq() < 1e-6) p.set(0, 0, 1); p.normalize();
  const u = dh.clone().multiplyScalar(Math.cos(alpha)).add(p.clone().multiplyScalar(Math.sin(alpha)));   // thigh direction
  const y = u.clone().negate(); let z = p.clone().sub(u.clone().multiplyScalar(p.dot(u))).normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize(); z = new THREE.Vector3().crossVectors(x, y);
  _m.makeBasis(x, y, z); thigh.quaternion.setFromRotationMatrix(_m);
  const cosB = (a * a + b * b - L * L) / (2 * a * b); const beta = Math.PI - Math.acos(Math.min(1, Math.max(-1, cosB)));
  shin.rotation.set(beta, 0, 0);
}

// P: { pos:[x,y,z] (pelvis-relative root: feet origin), yaw, tilt:[pitch,roll], waist, chest, head, rArm, rElbow, lArm, lElbow,
//      rLeg, rKnee, lLeg, lKnee (FK legs, used when P.ik is false), wrist, roll, pelvis:[x,y,z] optional,
//      ik: { r:[x,y,z], l:[x,y,z] } world foot targets (sole centre), knee pole yaw offsets optional }
export function applyPose(ch, P) {
  const tl = P.tilt || [0, 0];
  ch.root.position.set(...P.pos); ch.root.rotation.set(tl[0] * D2R, (P.yaw || 0) * D2R, tl[1] * D2R, 'YXZ');
  const b = ch.bones, w = P.waist || [0, 0, 0];
  const pel = P.pelvis || [w[0] * 0.35, w[1] * 0.45, w[2] * 0.35];
  const cst = P.chest || [0, 0, 0], hd = P.head || [0, 0, 0], sc = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
  const rest = [w[0] - pel[0], w[1] - pel[1], w[2] - pel[2]];
  setRot(b.hips, pel); setRot(b.spine, sc(rest, 0.55)); setRot(b.spine2, sc(rest, 0.45));     // lumbar bends most
  setRot(b.chest, sc(cst, 0.55)); setRot(b.chest2, sc(cst, 0.45));                           // thoracic curve
  setRot(b.neck, sc(hd, 0.4)); setRot(b.head, sc(hd, 0.6));                                   // neck carries part of the head turn
  // clavicles: shoulders shrug up/forward as the arm rises past horizontal (scapula elevation)
  for (const [cl, arm, s] of [[b.rClav, P.rArm || [0, 0, 0], -1], [b.lClav, P.lArm || [0, 0, 0], 1]]) {
    const e = Math.min(1, Math.max(0, (-arm[0] - 70) / 110)) + Math.min(0.6, Math.abs(arm[2]) / 120);
    cl.rotation.set(-6 * e * D2R, 0, s * 14 * e * D2R, 'XYZ'); }
  setRot(b.rSh, P.rArm || [0, 0, 0]); setRot(b.rEl, P.rElbow || [0, 0, 0]); setRot(b.lSh, P.lArm || [0, 0, 0]); setRot(b.lEl, P.lElbow || [0, 0, 0]);
  b.rHand.rotation.set(0, (P.roll || 0) * D2R, 0);
  if (ch.weapon) ch.weapon.rotation.set((P.wrist ?? 160) * D2R, 0, 0);
  if (ch.weapon && P.bd) {
    // aim the blade: desired direction (torso frame) -> world -> forearm (rEl) frame; solve roll about the forearm and
    // wrist bend so Ry(roll)*Rx(wrist)*(0,1,0) == d  ->  wrist = acos(d.y), roll = atan2(d.x, d.z)
    ch.root.updateMatrixWorld(true);
    const ty = (P.yaw || 0) + (w[1] || 0) + ((P.chest || [0, 0, 0])[1] || 0);
    const d = new THREE.Vector3(...P.bd).applyAxisAngle(new THREE.Vector3(0, 1, 0), ty * D2R).normalize();
    const qEl = new THREE.Quaternion(); b.rEl.getWorldQuaternion(qEl); qEl.invert();
    const aim = dir => { const dL = dir.clone().applyQuaternion(qEl);
      b.rHand.rotation.set(0, Math.atan2(dL.x, dL.z), 0); ch.weapon.rotation.set(Math.acos(Math.max(-1, Math.min(1, dL.y))), TWIST, 0, 'XYZ'); };
    // v8: the sword moves WITH the arm. Blend the torso-frame intent with a rigid grip (the pose's own wrist/roll, fixed in
    // the forearm frame), so lifting/swinging the forearm carries the blade. P.gk = grip weight (0 = pure intent).
    // P.spinK/P.spin: sword twirl - the blade turns about the forearm axis (wrist 90, roll = spin), blended in by spinK.
    { const qElW = qEl.clone().invert(); let dL = d.clone().applyQuaternion(qEl);
      const slerpV = (a, b2, u) => { const c = Math.max(-1, Math.min(1, a.dot(b2))), ang = Math.acos(c); if (ang < 1e-4 || u <= 0) return a.clone(); if (u >= 1) return b2.clone();
        if (ang > Math.PI - 1e-3) return a.clone().lerp(b2, u).normalize(); const s_ = Math.sin(ang); return a.clone().multiplyScalar(Math.sin((1 - u) * ang) / s_).add(b2.clone().multiplyScalar(Math.sin(u * ang) / s_)); };
      const gk = P.gk ?? 0;
      if (gk > 0) { const wr = (P.wrist ?? 160) * D2R, rl = (P.roll || 0) * D2R, g = new THREE.Vector3(Math.sin(wr) * Math.sin(rl), Math.cos(wr), Math.sin(wr) * Math.cos(rl)); dL = slerpV(dL, g, gk); }
      if (P.spinK > 0) { const r0 = Math.atan2(dL.x, dL.z) + (P.spin || 0) * D2R, sv = new THREE.Vector3(Math.sin(r0), 0, Math.cos(r0)); dL = slerpV(dL, sv, P.spinK); }
      d.copy(dL.applyQuaternion(qElW)).normalize(); }
    aim(d);
    // physics: the blade is a solid. Points along it may not enter the floor, the wielder's legs/torso, or the opponent's
    // body; on contact the aim is pushed out of the obstacle and re-solved (the hand stays the pivot).
    const R = P.pos, caps = [
      { x: R[0], z: R[2], y0: R[1] - 0.1, y1: R[1] + 0.72, r: 0.2 },                        // own legs
      { x: R[0], z: R[2], y0: R[1] + 0.72, y1: R[1] + 1.5, r: 0.15 } ];                     // own torso
    if (P.opp) caps.push({ x: P.opp[0], z: P.opp[2], y0: P.opp[1] - 0.1, y1: P.opp[1] + 1.95, r: 0.25 });   // opponent
    const pt = new THREE.Vector3();
    // v6: the push is proportional to penetration only (v4 added a flat +0.04 per touch, up to 16 times, so the blade
    // JUMPED the moment it touched a body/the floor -> 60-130 deg single-frame flips). Continuous in d, converges in ~10 its.
    for (let it = 0; it < 28; it++) {
      ch.root.updateMatrixWorld(true); let hit = false;
      for (const a of [4, 9, 14, 19, 24, 28]) {
        ch.weapon.localToWorld(pt.set(0, a, 0));
        if (ch.floorAt) { const f = ch.floorAt(pt.x, pt.z) + 0.035; if (pt.y < f) { d.y += (f - pt.y) * 1.8; hit = true; } }
        for (const c of caps) { if (pt.y < c.y0 || pt.y > c.y1) continue; const dx = pt.x - c.x, dz = pt.z - c.z, r = Math.hypot(dx, dz);
          const vw = Math.min(1, (pt.y - c.y0) / 0.1, (c.y1 - pt.y) / 0.1);                    // fade in over 0.1 at the capsule ends (no edge)
          if (r < c.r) { const k = (c.r - r) * 1.8 * vw, ux = r > 1e-4 ? dx / r : 1, uz = r > 1e-4 ? dz / r : 0; d.x += ux * k; d.z += uz * k; hit = hit || k > 1e-4; } }
      }
      if (!hit) break; d.normalize(); aim(d);
    }
    ch.bladeContact = !!(ch.floorAt) && (() => { ch.weapon.localToWorld(pt.set(0, 28, 0)); return pt.y < ch.floorAt(pt.x, pt.z) + 0.08; })();
  }
  if (!P.ik) { setRot(b.rTh, P.rLeg || [0, 0, 0]); setRot(b.rSn, P.rKnee || [0, 0, 0]); setRot(b.lTh, P.lLeg || [0, 0, 0]); setRot(b.lSn, P.lKnee || [0, 0, 0]); return; }
  ch.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(b.hips.matrixWorld).invert();
  const fwdW = new THREE.Vector3(Math.sin((P.yaw || 0) * D2R), 0, Math.cos((P.yaw || 0) * D2R));
  for (const [side, th, sn, hx] of [['r', b.rTh, b.rSn, -2], ['l', b.lTh, b.lSn, 2]]) {
    if (!P.ik[side]) { setRot(th, P[side + 'Leg'] || [0, 0, 0]); setRot(sn, P[side + 'Knee'] || [0, 0, 0]); continue; }   // free (FK) leg
    const tw = new THREE.Vector3(...P.ik[side]);
    const poleYaw = ((P.ik[side + 'Pole'] || 0) + (P.yaw || 0)) * D2R;
    const poleW = new THREE.Vector3(Math.sin(poleYaw), 0, Math.cos(poleYaw)).add(fwdW.clone().multiplyScalar(0.0));
    // targets are the sole centre; the IK chain ends at the bottom of the shin (sole) -> same point
    const tLocal = tw.clone().applyMatrix4(inv);
    const pLocal = poleW.clone().transformDirection(inv).normalize();
    solveLeg(th, sn, new THREE.Vector3(hx, 0, 0), tLocal, pLocal);
  }
}
// world position of a bone-local point (px) after applyPose
export function bonePoint(ch, bone, p = [0, 0, 0]) { ch.root.updateMatrixWorld(true); return ch.bones[bone].localToWorld(new THREE.Vector3(...p)); }

export function buildWeapon(json, base) {
  const g = new THREE.Group(); const loader = new THREE.TextureLoader(); const byTex = {};
  json.quads.forEach(q => (byTex[q.t] = byTex[q.t] || []).push(q));
  for (const t in byTex) {
    const T = json.textures[t]; const tex = loader.load(base + T.file); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
    const p = [], uv = [], idx = [];
    for (const q of byTex[t]) { const [A, Bq, C] = q.p, Dq = [Bq[0] + C[0] - A[0], Bq[1] + C[1] - A[1], Bq[2] + C[2] - A[2]];
      const [ua, ub, uc] = q.uv, ud = [ub[0] + uc[0] - ua[0], ub[1] + uc[1] - ua[1]]; const s = p.length / 3;
      p.push(...A, ...Bq, ...C, ...Dq); for (const x of [ua, ub, uc, ud]) uv.push(x[0] / T.uw, x[1] / T.uh); idx.push(s, s + 2, s + 1, s + 1, s + 2, s + 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color(0.22, 0.2, 0.14), emissiveMap: tex }));
    m.castShadow = true; g.add(m);
  }
  return g;
}
