"""Minecraft Java world region -> textured OBJ/MTL for the three.js scenes (anim-test/fight/assets/colosseum layout).

  python tools/mca2obj.py WORLD_DIR OUT_DIR --jar path/to/client.jar [--pack resources.zip]
         --box X0 X1 Y0 Y1 Z0 Z1 --origin CX CY CZ [--name B]

Blocks are meshed from the game's own blockstate + model JSON (variants, multipart, element/face UVs, face rotation,
element rotation, x/y variant rotation), with faces culled against full opaque neighbours (numpy, per state template).
Textures: resource pack first, then the jar; animated strips are cropped to their first frame; tinted faces (grass,
leaves, water, redstone) get their own material with the tint as Kd. Output coords = world - origin (blocks).
Not drawn: block entities without models (chests, signs, banners, heads), entities.
"""
import argparse, io, json, math, os, sys, zipfile
from collections import defaultdict
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcworld import World

DIRS = {'down': (0, -1, 0), 'up': (0, 1, 0), 'north': (0, 0, -1), 'south': (0, 0, 1), 'west': (-1, 0, 0), 'east': (1, 0, 0)}
DNAME = {v: k for k, v in DIRS.items()}
AIR = {'minecraft:air', 'minecraft:cave_air', 'minecraft:void_air', 'minecraft:barrier', 'minecraft:light', 'minecraft:structure_void'}
TRANSP = ('glass', 'leaves', 'ice', 'slime_block', 'honey_block', 'spawner', 'beacon', 'pane', 'iron_bars', 'mangrove_roots', 'scaffolding')
TINT = {'grass': (0x91, 0xBD, 0x59), 'foliage': (0x77, 0xAB, 0x2F), 'birch': (0x80, 0xA7, 0x55), 'spruce': (0x61, 0x99, 0x61), 'water': (0x3F, 0x76, 0xE4), 'redstone': (0xB0, 0x10, 0x10)}


def tint_for(name):
    n = name.split(':')[-1]
    if 'birch_leaves' in n: return 'birch'
    if 'spruce_leaves' in n: return 'spruce'
    if 'leaves' in n or n in ('vine', 'cocoa'): return 'foliage'
    if 'redstone_wire' in n: return 'redstone'
    if n in ('water', 'bubble_column'): return 'water'
    return 'grass'


class Assets:
    def __init__(self, jar, pack=None):
        self.jar = zipfile.ZipFile(jar); self.pack = zipfile.ZipFile(pack) if pack else None
        self.models, self.states, self.tex = {}, {}, {}

    def read(self, path):
        for z in (self.pack, self.jar):
            if z is None: continue
            try: return z.read(path)
            except KeyError: pass
        return None

    def blockstate(self, name):
        if name not in self.states:
            raw = self.read(f'assets/minecraft/blockstates/{name.split(":")[-1]}.json')
            self.states[name] = json.loads(raw) if raw else None
        return self.states[name]

    def model(self, ref):
        ref = ref.split(':')[-1]
        if ref in self.models: return self.models[ref]
        raw = self.read(f'assets/minecraft/models/{ref}.json'); m = json.loads(raw) if raw else {}
        tex, elems = dict(m.get('textures', {})), m.get('elements')
        if 'parent' in m and not m['parent'].startswith('builtin'):
            p = self.model(m['parent']); t2 = dict(p['textures']); t2.update(tex); tex = t2
            if elems is None: elems = p['elements']
        out = {'textures': tex, 'elements': elems}; self.models[ref] = out; return out

    def texture(self, ref):
        """'block/stone' -> RGBA image (first frame) or None."""
        ref = ref.split(':')[-1]
        if ref not in self.tex:
            raw = self.read(f'assets/minecraft/textures/{ref}.png'); img = None
            if raw:
                img = Image.open(io.BytesIO(raw)).convert('RGBA')
                if img.height > img.width: img = img.crop((0, 0, img.width, img.width))
            self.tex[ref] = img
        return self.tex[ref]


def match_when(when, props):
    if 'OR' in when: return any(match_when(w, props) for w in when['OR'])
    if 'AND' in when: return all(match_when(w, props) for w in when['AND'])
    return all(str(props.get(k, '')) in str(v).split('|') for k, v in when.items())


def pick_models(A, name, props):
    bs = A.blockstate(name)
    if not bs: return []
    out = []
    if 'variants' in bs:
        for key, v in bs['variants'].items():
            cond = dict(kv.split('=') for kv in key.split(',')) if key else {}
            if all(props.get(k) == val for k, val in cond.items()):
                out.append(v[0] if isinstance(v, list) else v); break
    for part in bs.get('multipart', []):
        if 'when' not in part or match_when(part['when'], props):
            a = part['apply']; out.append(a[0] if isinstance(a, list) else a)
    return out


def rotm(axis, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    if axis == 'x': return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    if axis == 'y': return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def face_quad(f, t, d):
    """corners TL, TR, BR, BL (as seen from outside) of the face d of box f..t (pixels)."""
    fx, fy, fz = f; tx, ty, tz = t
    return {'south': [(fx, ty, tz), (tx, ty, tz), (tx, fy, tz), (fx, fy, tz)],
            'north': [(tx, ty, fz), (fx, ty, fz), (fx, fy, fz), (tx, fy, fz)],
            'east': [(tx, ty, tz), (tx, ty, fz), (tx, fy, fz), (tx, fy, tz)],
            'west': [(fx, ty, fz), (fx, ty, tz), (fx, fy, tz), (fx, fy, fz)],
            'up': [(fx, ty, fz), (tx, ty, fz), (tx, ty, tz), (fx, ty, tz)],
            'down': [(fx, fy, tz), (tx, fy, tz), (tx, fy, fz), (fx, fy, fz)]}[d]


def default_uv(f, t, d):
    fx, fy, fz = f; tx, ty, tz = t
    return {'down': [fx, 16 - tz, tx, 16 - fz], 'up': [fx, fz, tx, tz], 'north': [16 - tx, 16 - ty, 16 - fx, 16 - fy],
            'south': [fx, 16 - ty, tx, 16 - fy], 'west': [fz, 16 - ty, tz, 16 - fy], 'east': [16 - tz, 16 - ty, 16 - fz, 16 - fy]}[d]


def resolve_tex(textures, ref, depth=0):
    """'#side' -> 'minecraft:block/x'. Newer versions may store a texture as {"sprite": "...", ...}."""
    if isinstance(ref, dict): ref = ref.get('sprite', '')
    while isinstance(ref, str) and ref.startswith('#') and depth < 10:
        ref = textures.get(ref[1:], ''); depth += 1
        if isinstance(ref, dict): ref = ref.get('sprite', '')
    return ref.split(':')[-1] if ref else None


def state_template(A, name, props):
    """List of quads: (verts[4] in block units 0..1, uvs[4], texref, tinted, cull_dir or None, normal)."""
    quads = []
    for mv in pick_models(A, name, props):
        m = A.model(mv['model'])
        if not m['elements']: continue
        Rv = rotm('y', -mv.get('y', 0)) @ rotm('x', -mv.get('x', 0))
        for el in m['elements']:
            f, t = el['from'], el['to']; er = el.get('rotation')
            for d, fc in el.get('faces', {}).items():
                tex = resolve_tex(m['textures'], fc.get('texture', ''))
                if not tex: continue
                c = np.array(face_quad(f, t, d), float)
                if er:
                    o = np.array(er['origin'], float); R = rotm(er['axis'], er['angle'])
                    if er.get('rescale'):
                        k = 1 / math.cos(math.radians(abs(er['angle']))); sc = np.ones(3) * k; sc[{'x': 0, 'y': 1, 'z': 2}[er['axis']]] = 1
                        c = (c - o) * sc + o
                    c = (c - o) @ R.T + o
                c = (c - 8) @ Rv.T + 8
                uv = fc.get('uv') or default_uv(f, t, d); u1, v1, u2, v2 = uv
                uvc = [(u1, v1), (u2, v1), (u2, v2), (u1, v2)]; k = (fc.get('rotation', 0) // 90) % 4
                uvc = [uvc[(i + 4 - k) % 4] for i in range(4)]
                uvs = [(u / 16, 1 - v / 16) for u, v in uvc]
                n = np.array(DIRS[d], float); n = Rv @ (rotm(er['axis'], er['angle']) @ n if er else n)
                cd = None
                if 'cullface' in fc:
                    cv = np.rint(Rv @ np.array(DIRS[fc['cullface']], float)).astype(int); cd = DNAME.get(tuple(cv))
                quads.append((c / 16, uvs, tex, 'tintindex' in fc, cd, n))
    return quads


def fluid_template(name, props):
    lvl = int(props.get('level', 0)); h = 14 / 16 if lvl == 0 else max(2, 14 - 2 * lvl) / 16
    tex = 'block/water_still' if 'water' in name else 'block/lava_still'
    q = []
    for d in DIRS:
        c = np.array(face_quad((0, 0, 0), (16, h * 16, 16), d), float) / 16
        q.append((c, [(0, 1), (1, 1), (1, 0), (0, 0)], tex, 'water' in name, d if d != 'up' else 'up_fluid', np.array(DIRS[d], float)))
    return q


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('world'); ap.add_argument('out')
    ap.add_argument('--jar', required=True); ap.add_argument('--pack'); ap.add_argument('--box', nargs=6, type=int, required=True)
    ap.add_argument('--origin', nargs=3, type=float, required=True); ap.add_argument('--name', default='B')
    a = ap.parse_args()
    X0, X1, Y0, Y1, Z0, Z1 = a.box; A = Assets(a.jar, a.pack); W = World(a.world)
    nx, ny, nz = X1 - X0 + 1, Y1 - Y0 + 1, Z1 - Z0 + 1
    vol = np.zeros((nx + 2, ny + 2, nz + 2), np.int32)          # 1-cell border of air for neighbour lookups
    sid, states = {}, [('minecraft:air', {})]
    for cx in range(X0 >> 4, (X1 >> 4) + 1):
        for cz in range(Z0 >> 4, (Z1 >> 4) + 1):
            c = W.chunk(cx, cz)
            for sy, (pal, idx) in (c or {}).items():
                if sy * 16 + 15 < Y0 or sy * 16 > Y1: continue
                ids = []
                for n, p in pal:
                    if n in AIR: ids.append(0); continue
                    k = (n, tuple(sorted(p.items())))
                    if k not in sid: sid[k] = len(states); states.append((n, p))
                    ids.append(sid[k])
                ids = np.array(ids, np.int32)
                g = ids[idx].reshape(16, 16, 16)                       # y, z, x
                for ly in range(16):
                    y = sy * 16 + ly
                    if y < Y0 or y > Y1: continue
                    xs0, zs0 = cx * 16, cz * 16
                    x_lo, x_hi = max(X0, xs0), min(X1, xs0 + 15); z_lo, z_hi = max(Z0, zs0), min(Z1, zs0 + 15)
                    if x_lo > x_hi or z_lo > z_hi: continue
                    sl = g[ly, z_lo - zs0:z_hi - zs0 + 1, x_lo - xs0:x_hi - xs0 + 1].T     # x, z
                    vol[x_lo - X0 + 1:x_hi - X0 + 2, y - Y0 + 1, z_lo - Z0 + 1:z_hi - Z0 + 2] = sl
    print('states', len(states), 'non-air cells', int((vol > 0).sum()), flush=True)
    # templates + opacity
    T, opaque, fluid = [], np.zeros(len(states), bool), np.zeros(len(states), bool)
    for i, (n, p) in enumerate(states):
        if i == 0: T.append([]); continue
        short = n.split(':')[-1]
        if short in ('water', 'lava'): T.append(fluid_template(n, p)); fluid[i] = True; continue
        q = state_template(A, n, p); T.append(q)
        full = len(q) == 6 and all(np.allclose(np.sort(np.abs(qq[0] - 0.5).max(0)), [0.5, 0.5, 0.5]) for qq in q) and all(qq[4] for qq in q)
        opaque[i] = full and not any(s in short for s in TRANSP)
    op = opaque[vol]; fl = fluid[vol]
    # walkable heightmap (top of the highest full cube / slab / stairs per column), for floorAt() in the scenes
    stand = np.zeros(len(states));
    for i, (n, p) in enumerate(states):
        s = n.split(':')[-1]
        if opaque[i] or s.endswith('_stairs') or 'farmland' in s or 'path' in s: stand[i] = 1.0
        elif s.endswith('_slab'): stand[i] = 1.0 if p.get('type') in ('top', 'double') else 0.5
    sv = stand[vol]; ys = np.arange(vol.shape[1])[None, :, None]
    top = np.where(sv > 0, ys - 1 + Y0 + sv, -999).max(axis=1)[1:-1, 1:-1]          # (nx, nz) world y of the walkable surface
    json.dump({'x0': X0 - a.origin[0], 'z0': Z0 - a.origin[2], 'nx': int(top.shape[0]), 'nz': int(top.shape[1]),
               'h': np.round(top - a.origin[1], 2).T.ravel().tolist()}, open(os.path.join(a.out, a.name + '_height.json'), 'w'), separators=(',', ':'))
    nb = {d: np.roll(op, (-v[0], -v[1], -v[2]), axis=(0, 1, 2)) for d, v in DIRS.items()}
    nbf = {d: np.roll(fl, (-v[0], -v[1], -v[2]), axis=(0, 1, 2)) for d, v in DIRS.items()}
    # emit: full unit faces with default UVs go to a greedy merger (same material + plane -> big tiled rectangles,
    # UVs > 1 repeat); everything else is written per block.
    mats = {}; V, VT, VN, F = [], [], [], defaultdict(list)
    ox, oy, oz = a.origin; nverts = 0; nquads = 0; nraw = 0
    DEFUV = [(0, 1), (1, 1), (1, 0), (0, 0)]
    merge = defaultdict(list)       # (key, U, Vd, n) -> array of cell base positions (int, world - box origin)

    def push(vs, uv, nn, key):
        nonlocal nverts, nquads
        k = len(vs); V.append(vs.reshape(-1, 3)); VT.append(uv.reshape(-1, 2)); VN.append(np.repeat(nn.reshape(-1, 3), 4, axis=0) if nn.ndim == 2 else np.tile(nn, (4 * k, 1)))
        F[key].append(nverts + np.arange(k)[:, None] * 4 + np.array([0, 3, 2, 1])[None, :]); nverts += 4 * k; nquads += k

    present = np.unique(vol)
    for i in present:
        if i == 0 or not T[i]: continue
        cells = vol == i
        for (c, uvs, tex, tinted, cd, n) in T[i]:
            m = cells.copy()
            if cd == 'up_fluid': m &= ~nbf['up'] & ~nb['up']
            elif cd and fluid[i]: m &= ~nb[cd] & ~nbf[cd]
            elif cd: m &= ~nb[cd]
            pos = np.argwhere(m)
            if not len(pos): continue
            img = A.texture(tex)
            if img is None: continue
            tn = tint_for(states[i][0]) if tinted else None
            key = tex.split('/')[-1] + (f'_{tn}' if tn else '')
            if key not in mats: mats[key] = (tex, tn)
            nraw += len(pos)
            U, Vd = c[1] - c[0], c[3] - c[0]
            unit = (np.allclose(np.abs(U).sum(), 1) and np.allclose(np.abs(Vd).sum(), 1) and np.allclose(np.abs(U).max(), 1) and np.allclose(np.abs(Vd).max(), 1)
                    and [tuple(np.round(x, 4)) for x in uvs] == DEFUV and not fluid[i])
            if unit:
                ax = int(np.argmax(np.abs(n))); plane_ok = np.allclose(c[:, ax], np.round(c[0, ax])) and np.round(c[0, ax]) in (0, 1)
                if plane_ok:
                    merge[(key, tuple(np.rint(U).astype(int)), tuple(np.rint(Vd).astype(int)), tuple(np.rint(n).astype(int)), tuple(np.round(c[0], 4)))].append(pos); continue
            base = pos - 1 + np.array([X0, Y0, Z0]) - np.array([ox, oy, oz])
            push(base[:, None, :] + c[None, :, :], np.tile(np.array(uvs, float), (len(pos), 1, 1)), np.asarray(n, float), key)
    # greedy rectangles per (material, orientation, plane)
    for (key, U, Vd, n, c0), lst in merge.items():
        P = np.concatenate(lst); U = np.array(U); Vd = np.array(Vd); n = np.array(n); c0 = np.array(c0)
        iu, iv, ip = P @ U, P @ Vd, P @ n
        for p in np.unique(ip):
            sel = ip == p; a_, b_ = iu[sel], iv[sel]; amin, bmin = a_.min(), b_.min()
            G = np.zeros((a_.max() - amin + 1, b_.max() - bmin + 1), bool); G[a_ - amin, b_ - bmin] = True
            rects = []
            for x in range(G.shape[0]):
                y = 0
                while y < G.shape[1]:
                    if not G[x, y]: y += 1; continue
                    h = 1
                    while y + h < G.shape[1] and G[x, y + h]: h += 1
                    w = 1
                    while x + w < G.shape[0] and G[x + w, y:y + h].all(): w += 1
                    G[x:x + w, y:y + h] = False; rects.append((x + amin, y + bmin, w, h)); y += h
            if not rects: continue
            R = np.array(rects)
            # the cell at (u, v) has base position with P@U = u, P@Vd = v, P@n = p; reconstruct from axes (all axis-aligned, orthogonal)
            cellpos = R[:, 0:1] * U + R[:, 1:2] * Vd + p * n                       # (k, 3) in box-cell coords (U, Vd, n are +-unit axes)
            TL = cellpos - 1 + np.array([X0, Y0, Z0]) - np.array([ox, oy, oz]) + c0
            w = R[:, 2:3]; h = R[:, 3:4]
            vs = np.stack([TL, TL + U * w, TL + U * w + Vd * h, TL + Vd * h], axis=1).astype(float)
            uv = np.stack([np.hstack([0 * w, h]), np.hstack([w, h]), np.hstack([w, 0 * h]), np.hstack([0 * w, 0 * h])], axis=1).astype(float)
            push(vs, uv, n.astype(float), key)
    print('faces', nraw, '-> quads', nquads, 'materials', len(mats), flush=True)
    os.makedirs(os.path.join(a.out, 'tex'), exist_ok=True)
    with open(os.path.join(a.out, a.name + '.mtl'), 'w') as f:
        for key, (tex, tn) in sorted(mats.items()):
            p = f'tex/minecraft/{tex}.png'; full = os.path.join(a.out, p)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            if not os.path.exists(full): A.texture(tex).save(full)
            col = [v / 255 for v in TINT[tn]] if tn else [1, 1, 1]
            f.write(f'newmtl {key}\nKd {col[0]:.4f} {col[1]:.4f} {col[2]:.4f}\nmap_Kd {p}\n')
            if 'water' in key or 'glass' in key or 'ice' in key: f.write(f'd 0.75\n')
            f.write('\n')
    Vs, VTs, VNs = np.concatenate(V), np.concatenate(VT), np.concatenate(VN)
    with open(os.path.join(a.out, a.name + '.obj'), 'w') as f:
        f.write(f'mtllib {a.name}.mtl\n')
        f.write(''.join(f'v {x:.4g} {y:.4g} {z:.4g}\n' for x, y, z in Vs))
        f.write(''.join(f'vt {u:.4g} {v:.4g}\n' for u, v in VTs))
        f.write(''.join(f'vn {x:.3g} {y:.3g} {z:.3g}\n' for x, y, z in VNs))
        for key, lst in F.items():
            f.write(f'usemtl {key}\n'); ids = np.concatenate(lst) + 1
            f.write(''.join(f'f {a_}/{a_}/{a_} {b}/{b}/{b} {c_}/{c_}/{c_} {d}/{d}/{d}\n' for a_, b, c_, d in ids))
    print('wrote', os.path.join(a.out, a.name + '.obj'), f'{os.path.getsize(os.path.join(a.out, a.name + ".obj")) / 1e6:.1f} MB')
    write_glb(os.path.join(a.out, a.name + '.glb'), Vs, VTs, VNs, F, mats)


def write_glb(path, Vs, VTs, VNs, F, mats):
    """One mesh per material; textures referenced by relative uri (tex/...), nearest filtering, repeat wrap."""
    import struct
    bin_ = bytearray(); views, accs, meshes, nodes, materials, textures, images = [], [], [], [], [], [], []
    def add(arr, target, comp, typ, minmax=False):
        b = arr.tobytes(); off = len(bin_); bin_.extend(b); bin_.extend(b'\0' * ((4 - len(b) % 4) % 4))
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(b), 'target': target})
        acc = {'bufferView': len(views) - 1, 'componentType': comp, 'count': len(arr), 'type': typ}
        if minmax: acc['min'] = arr.min(0).tolist(); acc['max'] = arr.max(0).tolist()
        accs.append(acc); return len(accs) - 1
    for key, lst in F.items():
        tri = np.concatenate(lst)                                   # quads (k,4) global vertex ids
        used = np.unique(tri); remap = np.full(len(Vs), -1, np.int64); remap[used] = np.arange(len(used))
        q = remap[tri]; idx = np.concatenate([q[:, [0, 1, 2]], q[:, [0, 2, 3]]]).astype(np.uint32).reshape(-1)
        pa = add(Vs[used].astype(np.float32), 34962, 5126, 'VEC3', True)
        na = add(VNs[used].astype(np.float32), 34962, 5126, 'VEC3')
        ta = add(np.column_stack([VTs[used][:, 0], 1 - VTs[used][:, 1]]).astype(np.float32), 34962, 5126, 'VEC2')
        ia = add(idx, 34963, 5125, 'SCALAR')
        tex, tn = mats[key]
        images.append({'uri': f'tex/minecraft/{tex}.png'}); textures.append({'sampler': 0, 'source': len(images) - 1})
        col = [v / 255 for v in TINT[tn]] + [1] if tn else [1, 1, 1, 1]
        mat = {'name': key, 'pbrMetallicRoughness': {'baseColorTexture': {'index': len(textures) - 1}, 'baseColorFactor': col, 'metallicFactor': 0, 'roughnessFactor': 0.92},
               'alphaMode': 'BLEND' if 'water' in key else 'MASK', 'doubleSided': True}
        if mat['alphaMode'] == 'MASK': mat['alphaCutoff'] = 0.5
        if 'water' in key: mat['pbrMetallicRoughness']['baseColorFactor'][3] = 0.75
        materials.append(mat)
        meshes.append({'name': key, 'primitives': [{'attributes': {'POSITION': pa, 'NORMAL': na, 'TEXCOORD_0': ta}, 'indices': ia, 'material': len(materials) - 1}]})
        nodes.append({'mesh': len(meshes) - 1, 'name': key})
    js = {'asset': {'version': '2.0', 'generator': 'videonewgen mca2obj'}, 'scene': 0, 'scenes': [{'nodes': list(range(len(nodes)))}], 'nodes': nodes, 'meshes': meshes,
          'materials': materials, 'textures': textures, 'images': images, 'samplers': [{'magFilter': 9728, 'minFilter': 9728, 'wrapS': 10497, 'wrapT': 10497}],
          'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(bin_)}]}
    jb = json.dumps(js, separators=(',', ':')).encode(); jb += b' ' * ((4 - len(jb) % 4) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bin_)))
        f.write(struct.pack('<II', len(jb), 0x4E4F534A)); f.write(jb)
        f.write(struct.pack('<II', len(bin_), 0x004E4942)); f.write(bin_)
    print('wrote', path, f'{os.path.getsize(path) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
