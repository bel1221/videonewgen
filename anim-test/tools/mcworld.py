"""Minimal Minecraft Java world reader (1.18+ anvil): NBT, region files, block palettes. No dependencies beyond numpy.

  from mcworld import World
  w = World(path); w.block(x, y, z) -> 'minecraft:stone[...props]' name + props dict
"""
import gzip, io, math, os, struct, zlib
import numpy as np

# ------------------------------------------------------------------ NBT
def _nbt(f, t):
    if t == 1: return struct.unpack('>b', f.read(1))[0]
    if t == 2: return struct.unpack('>h', f.read(2))[0]
    if t == 3: return struct.unpack('>i', f.read(4))[0]
    if t == 4: return struct.unpack('>q', f.read(8))[0]
    if t == 5: return struct.unpack('>f', f.read(4))[0]
    if t == 6: return struct.unpack('>d', f.read(8))[0]
    if t == 7: n = struct.unpack('>i', f.read(4))[0]; return f.read(n)
    if t == 8: n = struct.unpack('>H', f.read(2))[0]; return f.read(n).decode('utf-8', 'replace')
    if t == 9:
        et = f.read(1)[0]; n = struct.unpack('>i', f.read(4))[0]
        return [_nbt(f, et) for _ in range(n)]
    if t == 10:
        d = {}
        while True:
            et = f.read(1)[0]
            if et == 0: return d
            nl = struct.unpack('>H', f.read(2))[0]; name = f.read(nl).decode('utf-8', 'replace')
            d[name] = _nbt(f, et)
    if t == 11: n = struct.unpack('>i', f.read(4))[0]; return np.frombuffer(f.read(4 * n), '>i4')
    if t == 12: n = struct.unpack('>i', f.read(4))[0]; return np.frombuffer(f.read(8 * n), '>i8')
    raise ValueError(f'bad NBT tag {t}')


def read_nbt(data):
    f = io.BytesIO(data); t = f.read(1)[0]; nl = struct.unpack('>H', f.read(2))[0]; f.read(nl)
    return _nbt(f, t)


def read_nbt_file(path):
    raw = open(path, 'rb').read()
    try: raw = gzip.decompress(raw)
    except OSError: pass
    return read_nbt(raw)


# ------------------------------------------------------------------ regions / chunks
def _unpack(longs, n_bits, count=4096):
    """Block-state indices from a packed long array (entries never span longs, 1.16+)."""
    per = 64 // n_bits; mask = (1 << n_bits) - 1
    u = longs.astype(np.int64).view(np.uint64)          # big-endian NBT longs -> native, then reinterpret as unsigned
    out = np.empty(len(u) * per, dtype=np.int64)
    for k in range(per):
        out[k::per] = ((u >> np.uint64(k * n_bits)) & np.uint64(mask)).astype(np.int64)
    return out[:count]


def state_name(p):
    props = p.get('Properties') or {}
    return p['Name'], {k: str(v) for k, v in props.items()}


class World:
    def __init__(self, path):
        self.path = path; self.regions = {}; self.chunks = {}

    def _region(self, rx, rz):
        k = (rx, rz)
        if k not in self.regions:
            p = os.path.join(self.path, 'region', f'r.{rx}.{rz}.mca')
            self.regions[k] = open(p, 'rb').read() if os.path.exists(p) else None
        return self.regions[k]

    def chunk(self, cx, cz):
        """dict section_y -> (palette list of (name, props), indices uint16[4096] in y,z,x order) or None."""
        k = (cx, cz)
        if k in self.chunks: return self.chunks[k]
        R = self._region(cx >> 5, cz >> 5); res = None
        if R:
            i = 4 * ((cx & 31) + (cz & 31) * 32); off = int.from_bytes(R[i:i + 3], 'big') * 4096; sec = R[i + 3]
            if off and sec:
                ln = int.from_bytes(R[off:off + 4], 'big'); comp = R[off + 4]; data = R[off + 5:off + 4 + ln]
                raw = zlib.decompress(data) if comp == 2 else gzip.decompress(data) if comp == 1 else data
                nbt = read_nbt(raw); res = {}
                for s in nbt.get('sections', []):
                    bs = s.get('block_states')
                    if not bs: continue
                    pal = [state_name(p) for p in bs['palette']]
                    if len(pal) == 1:
                        if pal[0][0] == 'minecraft:air': continue
                        idx = np.zeros(4096, dtype=np.uint16)
                    else:
                        bits = max(4, math.ceil(math.log2(len(pal))))
                        idx = _unpack(bs['data'], bits).astype(np.uint16)
                    res[s['Y']] = (pal, idx)
        self.chunks[k] = res; return res

    def region_coords(self):
        out = []
        for f in os.listdir(os.path.join(self.path, 'region')):
            if f.endswith('.mca'):
                _, a, b, _ = f.split('.'); out.append((int(a), int(b)))
        return out
