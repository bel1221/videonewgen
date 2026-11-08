// Procedural voxel world: original 16x16 block textures, heightmap terrain, path, trees, ruins, lantern posts.
// Meshed per block-face texture with hidden-face culling and Minecraft-style per-vertex ambient occlusion.
import * as THREE from 'three';

export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ------------------------------------------------------------------ textures
function tex16(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); const img = g.createImageData(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const [r, gg, b, a = 255] = draw(x, y); const i = (y * 16 + x) * 4;
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = a;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const vary = (c, k, x, y, s) => { const n = (hash(x, y, s) - 0.5) * k; return c.map(v => Math.max(0, Math.min(255, Math.round(v * (1 + n))))); };
const GRASS = [104, 162, 58], DIRT = [128, 90, 62], STONE = [122, 122, 124];
function grassTop(x, y) { const c = vary(GRASS, 0.32, x, y, 1); return hash(x, y, 9) > 0.9 ? c.map(v => v * 0.82) : c; }
function dirt(x, y) { const c = vary(DIRT, 0.3, x, y, 2); return hash(x, y, 7) > 0.88 ? c.map(v => v * 0.7) : c; }
function grassSide(x, y) { const edge = 3 + Math.floor(hash(x, 0, 3) * 2.2); return y < edge ? vary(GRASS, 0.3, x, y, 4).map(v => v * 0.92) : dirt(x, y); }
function stone(x, y) { const n = hash(x >> 1, y >> 1, 5) * 0.5 + hash(x, y, 6) * 0.5; return vary(STONE, 0.18, x, y, 8).map(v => v * (0.82 + 0.3 * n)); }
function cells(x, y, s) { // voronoi-ish cobble
  let best = 9, second = 9;
  for (let k = 0; k < 9; k++) { const cx = hash(k, 1, s) * 16, cy = hash(k, 2, s) * 16;
    for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) { const d = Math.hypot(x + 0.5 - cx - ox, y + 0.5 - cy - oy); if (d < best) { second = best; best = d; } else if (d < second) second = d; } }
  return second - best;
}
function cobble(x, y) { const e = cells(x, y, 11); const base = vary([128, 126, 124], 0.2, x, y, 12); return e < 1.2 ? base.map(v => v * 0.55) : base.map(v => v * (0.9 + 0.12 * hash(x, y, 13))); }
function mossy(x, y) { const c = cobble(x, y); return hash(x >> 1, y >> 1, 14) > 0.62 ? vary([84, 120, 58], 0.25, x, y, 15) : c; }
function logSide(x, y) { const stripe = (x % 4 === 0 || hash(x, y >> 2, 16) > 0.85) ? 0.72 : 1; return vary([104, 80, 50], 0.18, x, y, 17).map(v => v * stripe); }
function logTop(x, y) { const r = Math.hypot(x - 7.5, y - 7.5); return r > 6.5 ? logSide(x, y) : vary([176, 144, 96], 0.12, x, y, 18).map(v => v * (Math.floor(r) % 2 ? 0.86 : 1)); }
function planks(x, y) { const row = y >> 2, seam = ((row % 2) ? 4 : 12); const c = vary([170, 134, 82], 0.14, x, y, 19); return (y % 4 === 3 || x === seam) ? c.map(v => v * 0.68) : c; }
function leaves(x, y) { const h = hash(x, y, 20); const c = vary([62, 118, 42], 0.35, x, y, 21); return h > 0.78 ? c.map(v => v * 0.45) : c; }
function pathTop(x, y) { return vary([150, 124, 76], 0.22, x, y, 22).map((v, i) => hash(x, y, 23) > 0.92 ? v * 0.78 : v); }
function lantern(x, y) { const edge = x < 3 || x > 12 || y < 2 || y > 13; if (edge) return [46, 44, 52]; return vary([255, 196, 110], 0.15, x, y, 24); }

// ------------------------------------------------------------------ blocks
// block type -> [top, side, bottom] texture keys
const BLOCKS = {
  grass: ['grassTop', 'grassSide', 'dirt'], dirt: ['dirt', 'dirt', 'dirt'], stone: ['stone', 'stone', 'stone'],
  cobble: ['cobble', 'cobble', 'cobble'], mossy: ['mossy', 'mossy', 'mossy'], log: ['logTop', 'logSide', 'logTop'],
  planks: ['planks', 'planks', 'planks'], leaves: ['leaves', 'leaves', 'leaves'], path: ['pathTop', 'dirt', 'dirt'],
};
const TEXFN = { grassTop, grassSide, dirt, stone, cobble, mossy, logSide, logTop, planks, leaves, pathTop };

export function buildWorld(scene) {
  const T = {}; for (const k in TEXFN) T[k] = tex16(TEXFN[k]);
  const V = new Map(); const key = (x, y, z) => x + ',' + y + ',' + z;
  const set = (x, y, z, t) => V.set(key(x, y, z), t); const get = (x, y, z) => V.get(key(x, y, z));
  const solid = (x, y, z) => { const b = get(x, y, z); return b !== undefined && b !== 'leaves'; };
  const R = rng(7);

  // terrain: flat arena around the origin, rolling hills further out, path along z
  const vn = (x, z, s) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi; const sm = t => t * t * (3 - 2 * t);
    const a = hash(xi, zi, s), b = hash(xi + 1, zi, s), c = hash(xi, zi + 1, s), d = hash(xi + 1, zi + 1, s);
    return a + (b - a) * sm(fx) + (c - a) * sm(fz) + (a - b - c + d) * sm(fx) * sm(fz); };
  const pathX = z => Math.round(1.5 * Math.sin(z * 0.09));
  const H = (x, z) => {
    const r = Math.hypot(x * 0.8, z * 0.7); const w = Math.min(1, Math.max(0, (r - 9) / 14));
    let h = (vn(x / 9, z / 9, 1) * 5 + vn(x / 4, z / 4, 2) * 1.6 - 3.2) * w;
    if (Math.abs(x - pathX(z)) < 2.5 && z < 0) h *= 0.25;      // the path cuts low through the hills
    return Math.round(h);
  };
  const X0 = -44, X1 = 44, Z0 = -70, Z1 = 40;
  const HM = {};
  for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
    const h = H(x, z); HM[x + ',' + z] = h;
    for (let y = h - 3; y <= h; y++) set(x, y, z, y === h ? 'grass' : (y > h - 3 ? 'dirt' : 'stone'));
    if (Math.abs(x - pathX(z)) <= 1 && z < 5 && hash(x, z, 30) > 0.12) set(x, h, z, 'path');
  }
  // arena: worn path ring
  for (let x = -6; x <= 6; x++) for (let z = -6; z <= 6; z++) { const r = Math.hypot(x, z); if (r < 5.5 && hash(x, z, 31) > 0.45) set(x, HM[x + ',' + z], z, 'path'); }

  // trees (avoid arena + path)
  const tree = (x, z) => { const h0 = HM[x + ',' + z]; const th = 4 + Math.floor(R() * 3);
    for (let y = 1; y <= th; y++) set(x, h0 + y, z, 'log');
    for (let dy = th - 2; dy <= th + 1; dy++) { const rad = dy > th ? 1 : 2;
      for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad && (R() > 0.4 || dy > th - 1)) continue;
        if (!get(x + dx, h0 + dy, z + dz)) set(x + dx, h0 + dy, z + dz, 'leaves'); } } };
  for (let k = 0; k < 90; k++) {
    const x = Math.round(X0 + 3 + R() * (X1 - X0 - 6)), z = Math.round(Z0 + 3 + R() * (Z1 - Z0 - 6));
    if (Math.hypot(x, z) < 13 || Math.abs(x - pathX(z)) < 5 && z < 6) continue;
    if (Math.abs(x) < 8 && z > 6 && z < 20) continue;            // keep the hero-shot background readable
    tree(x, z);
  }
  // ruins: broken mossy wall + arch west of the arena (C stands on it)
  const wall = [[-9, 3], [-9, 4], [-9, 5], [-9, 6], [-9, 7], [-8, 7], [-7, 7], [-6, 7], [-5, 7]];
  const wh = [2, 3, 4, 4, 3, 3, 3, 2, 1];
  wall.forEach(([x, z], i) => { const h0 = HM[x + ',' + z]; for (let y = 1; y <= wh[i]; y++) set(x, h0 + y, z, hash(x, y + z, 40) > 0.5 ? 'mossy' : 'cobble'); });
  for (let y = 1; y <= 5; y++) { set(8, y, -7, y === 5 ? 'mossy' : 'cobble'); set(8, y, -3, y === 5 ? 'mossy' : 'cobble'); }
  for (let z = -7; z <= -3; z++) if (z !== -5) set(8, 6, z, 'mossy');
  // stepping planks platform near the arena
  for (let x = 4; x <= 6; x++) for (let z = 5; z <= 7; z++) set(x, 1, z, 'planks');

  // ------------------------------------------------------------------ meshing with AO
  const FACES = [
    { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], k: 1 },
    { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], k: 1 },
    { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], k: 0 },
    { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], k: 2 },
    { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], k: 1 },
    { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], k: 1 },
  ];
  const AOL = [0.42, 0.62, 0.8, 1.0];
  const buf = {};
  for (const [kk, t] of V) {
    const [x, y, z] = kk.split(',').map(Number);
    for (const f of FACES) {
      const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2]; const nb = get(nx, ny, nz);
      if (nb !== undefined && !(nb === 'leaves' && t !== 'leaves')) continue;   // hidden face
      const texKey = BLOCKS[t][f.k]; const B = buf[texKey] || (buf[texKey] = { p: [], uv: [], c: [], n: [], idx: [] });
      const base = B.p.length / 3;
      for (const cc of f.c) {
        // AO: the two side cells and the corner cell in the plane just outside this face
        const d = [0, 1, 2].map(i => f.n[i] ? 0 : (cc[i] ? 1 : -1));
        const ax = [0, 1, 2].filter(i => !f.n[i]);
        const s1 = [nx, ny, nz]; s1[ax[0]] += d[ax[0]]; const s2 = [nx, ny, nz]; s2[ax[1]] += d[ax[1]];
        const co = [nx, ny, nz]; co[ax[0]] += d[ax[0]]; co[ax[1]] += d[ax[1]];
        const a = solid(...s1) ? 1 : 0, b = solid(...s2) ? 1 : 0, cr = solid(...co) ? 1 : 0;
        const ao = AOL[(a && b) ? 0 : 3 - (a + b + cr)];
        B.p.push(x + cc[0], y + cc[1], z + cc[2]); B.n.push(...f.n); B.c.push(ao, ao, ao);
        // uv: side faces use y as v (grass edge on top); top/bottom use x,z
        let u, v;
        if (f.n[1]) { u = cc[0]; v = cc[2]; } else if (f.n[0]) { u = cc[2]; v = cc[1]; } else { u = cc[0]; v = cc[1]; }
        B.uv.push(u, v);
      }
      B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const meshes = [];
  for (const k in buf) {
    const B = buf[k]; const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3)); g.setIndex(B.idx);
    // winding check: make the first triangle face its normal (all faces share the corner convention)
    const m = new THREE.MeshStandardMaterial({ map: T[k], vertexColors: true, roughness: 0.95, metalness: 0, alphaTest: k === 'leaves' ? 0.5 : 0, side: k === 'leaves' ? THREE.DoubleSide : THREE.FrontSide });
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); meshes.push(mesh);
  }
  // lantern posts (cobble post + glowing block) with warm point lights
  const lanterns = [[-6, 0, -4], [6, 0, 3], [-3, 0, 9]];
  const lmat = new THREE.MeshStandardMaterial({ map: tex16(lantern), emissive: new THREE.Color(1.0, 0.62, 0.3), emissiveIntensity: 2.2, emissiveMap: tex16(lantern) });
  const pmat = new THREE.MeshStandardMaterial({ map: T.cobble, roughness: 1 });
  const lights = [];
  for (const [x, , z] of lanterns) {
    const h0 = HM[x + ',' + z];
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.3), pmat); post.position.set(x + 0.5, h0 + 1 + 0.8, z + 0.5); post.castShadow = true; scene.add(post);
    const lb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), lmat); lb.position.set(x + 0.5, h0 + 1 + 1.85, z + 0.5); scene.add(lb);
    const L = new THREE.PointLight(0xffa860, 9, 9, 1.6); L.position.set(x + 0.5, h0 + 1 + 1.8, z + 0.5); scene.add(L); lights.push(L);
  }
  return { meshes, heightAt: (x, z) => HM[Math.round(x) + ',' + Math.round(z)] + 1, lights };
}
