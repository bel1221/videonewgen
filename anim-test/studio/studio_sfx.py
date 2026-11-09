"""Sound bed for a studio scene, from window.events() (scene time, hit-stops included). Run from anim-test/:

  python studio/studio_sfx.py studio/comp/NAME_events.json studio/comp/NAME_audio.m4a [--music-ss 101.39]

House rules (CLAUDE.md): no SFX file more than twice per video, never boom/ or riser/rs50, music sa.mp3 at I=-26 ducked
under the action, master I=-14. Sources are the shippable ones only: the user's sword pack (sfx_pack mani_*), Minecraft's
own sounds (Lunar Client asset index), the CC0 toolkit library; desert_* (cut from other creators' videos) are NOT used.
Sounds that repeat a lot (footsteps, rings, thumps, swells) are synthesized, so every instance is unique.
Buses: 1 action > 2 surroundings > 3 music/tails; each lower bus is side-chain ducked by the ones above (fight_sfx3 mix).
"""
import argparse, glob, json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
ap = argparse.ArgumentParser(); ap.add_argument('events'); ap.add_argument('out'); ap.add_argument('--music-ss', type=float, default=101.39)
ap.add_argument('--seed', type=int, default=7); a = ap.parse_args()
EV = json.load(open(a.events, encoding='utf-8-sig')); TOTAL = EV['T']; N = int((TOTAL + 2) * SR)
rng = np.random.default_rng(a.seed)
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
PK = os.path.join(ROOT, 'anim-test', 'sfx_pack'); LIB = os.path.join(ROOT, 'toolkit', 'sfx_lib')

# Minecraft sounds through the Lunar Client asset index
LUN = os.path.expanduser('~/.lunarclient/shared/assets'); IDX = sorted(glob.glob(os.path.join(LUN, 'indexes', '*.json')))
MCI = json.load(open(IDX[-1]))['objects'] if IDX else {}
def mc(name):
    o = MCI.get(f'minecraft/sounds/{name}.ogg'); return os.path.join(LUN, 'objects', o['hash'][:2], o['hash']) if o else None
POOLS = {
    'swing': [mc(f'entity/player/attack/sweep{i}') for i in range(1, 8)] + [f'{PK}/other/mani_03.wav', f'{PK}/unsheathe/mani_04.wav', f'{PK}/unsheathe/mani_08.wav',
              f'{PK}/other/mani_09.wav', f'{PK}/other/mani_11.wav', f'{PK}/unsheathe/mani_12.wav'] + sorted(glob.glob(f'{LIB}/whoosh/*.ogg')),
    'swing_big': sorted(glob.glob(f'{LIB}/longwhoosh/*.ogg')),
    'clash': [f'{PK}/clash/mani_06.wav', f'{PK}/other/mani_01.wav', f'{PK}/other/mani_02.wav'] + sorted(glob.glob(f'{LIB}/hit/*Metal*.ogg')) + sorted(glob.glob(f'{LIB}/hit/*Plate*.ogg')),
    'clash_layer': [mc(f'item/shield/block{i}') for i in range(1, 6)] + sorted(glob.glob(f'{LIB}/flash/*Metal*.ogg')),
    'hit': [mc(f'entity/player/attack/strong{i}') for i in range(1, 7)] + [mc(f'entity/player/attack/knockback{i}') for i in range(1, 5)],
    'hit_layer': [f'{PK}/impact/mani_05.wav', f'{PK}/impact/mani_10.wav', f'{PK}/impact/mani_07.wav'] + [mc(f'entity/player/attack/crit{i}') for i in range(1, 4)],
    'land': [mc(f'item/trident/ground_impact{i}') for i in range(1, 5)],
}
for k in POOLS: POOLS[k] = [p for p in POOLS[k] if p and os.path.exists(p) and 'boom' not in p.replace('\\', '/').split('/') and 'rs50' not in p]
USES = {}
def pick(pool):
    c = [p for p in POOLS[pool] if USES.get(p, 0) < 2]
    if not c: return None
    fresh = [p for p in c if USES.get(p, 0) == 0]; p = (fresh or c)[rng.integers(len(fresh or c))]; USES[p] = USES.get(p, 0) + 1; return p

_cache = {}
def load(path, rate=1.0):
    k = (path, round(rate, 3))
    if k not in _cache:
        af = ['-af', f'asetrate={int(SR * rate)},aresample={SR}'] if rate != 1.0 else []
        x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path] + af + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
        _cache[k] = x / (np.abs(x).max() + 1e-9)
    return _cache[k]
BUS = {1: np.zeros((N, 2), np.float32), 2: np.zeros((N, 2), np.float32), 3: np.zeros((N, 2), np.float32)}
def peak(x): env = np.abs(x).max(1); w = int(0.004 * SR); return int(np.argmax(np.convolve(env, np.ones(w) / w, 'same')))
def onset(x): env = np.abs(x).max(1); return max(0, int(np.argmax(env > env.max() * 0.15)) - int(0.002 * SR))
def place(bus, x, t, g, pan=0.0, align='peak'):
    if x is None: return
    st = int(t * SR) - (peak(x) if align == 'peak' else onset(x) if align == 'onset' else 0)
    if st < 0: x = x[-st:]; st = 0
    x = x * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32); e = min(N, st + len(x)); BUS[bus][st:e] += x[:e - st] * 10 ** (g / 20)
def put(pool, bus, t, g, pan=0.0, align='peak', rate=None):
    p = pick(pool);
    if p: place(bus, load(p, rate or rng.uniform(0.94, 1.06)), t, g, pan, align)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def st2(x): return np.stack([x, x], 1).astype(np.float32)
def ring(t, g, big):                       # blade ring: inharmonic partials, unique per clash
    d = 1.6 if big else 0.8; tt = np.arange(int(d * SR)) / SR; f0 = rng.uniform(2000, 3000); x = np.zeros_like(tt)
    for r, amp, dec in ((1.0, 1.0, 3.5), (2.76, 0.55, 6.0), (5.40, 0.33, 9.0), (8.93, 0.18, 13.0)):
        x += amp * np.sin(2 * np.pi * f0 * r * tt + rng.uniform(0, 6.28)) * np.exp(-tt * dec * (1.0 if big else 1.7))
    x *= np.minimum(1, tt / 0.0015); place(3, st2(x / np.abs(x).max()), t, g, align='start')
def thump(bus, t, g, f=65, d=0.45):
    tt = np.arange(int(d * SR)) / SR; fr = f * np.exp(-tt * 4); x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 10) * np.minimum(1, tt / 0.002)
    place(bus, st2(x), t, g, align='start')
def noise(bus, t, g, dur, lo, hi, attack=0.004, rev=False):
    n = int(dur * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n) * np.exp(-tt * 4 / dur) * np.minimum(1, tt / attack)
    x = sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x); x /= np.abs(x).max() + 1e-9
    if rev: x = x[::-1].copy(); place(bus, st2(x), t - dur, g, align='start')
    else: place(bus, st2(x), t, g, align='start')
def sand_step(t, g, pan):                  # synthesized sand footstep: low thud + crunchy grains
    n = int(0.16 * SR); tt = np.arange(n) / SR
    thud = np.sin(2 * np.pi * rng.uniform(70, 110) * tt) * np.exp(-tt * 45)
    grains = np.zeros(n);
    for _ in range(rng.integers(14, 30)):
        i = int(rng.uniform(0, 0.09) * SR); L = int(rng.uniform(0.002, 0.008) * SR); grains[i:i + L] += rng.standard_normal(min(L, n - i)) * rng.uniform(0.3, 1)
    grains = sosfilt(butter(2, [rng.uniform(900, 1500), rng.uniform(4000, 7000)], 'band', fs=SR, output='sos'), grains) * np.exp(-tt * 20)
    x = 0.6 * thud + grains; x /= np.abs(x).max() + 1e-9; place(2, st2(x) * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32), t, g, align='start')

pan_of = lambda c: 0.25 if c == 'A' else -0.25 if c == 'B' else 0.0
holds = [h['s'] for h in EV['holds']]
# ---------------- BUS 1: action
for s in EV['swings']:
    big = s['power'] == 'heavy' or s['act'] == 'jump_attack'
    put('swing', 1, s['t'] + 0.04, -10 + (2 if big else 0) + rng.uniform(-1.5, 0.5), pan_of(s['c']), 'onset')
    if big: put('swing_big', 1, s['t'] - 0.05, -14, pan_of(s['c']), 'onset')
for c in EV['contacts']:
    t = c['t']; imp = c['impact']
    if imp: noise(1, t, -16, 0.35, 500, 7000, rev=True)                     # reverse swell into the impact frame
    if c['kind'] == 'clash':
        put('clash', 1, t, -3 if c['big'] else -6)
        if c['big'] or imp: put('clash_layer', 1, t + 0.003, -9); thump(1, t, -9 if imp else -12, 85)
        ring(t + 0.004, -14 if c['big'] else -19, c['big'])
        if c.get('bind'):                                                      # blades grinding: band-passed scrape + tiny rings
            b = c['bind']; n = int(b * SR); tt = np.arange(n) / SR
            x = rng.standard_normal(n) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)) * np.minimum(1, tt / 0.05) * np.minimum(1, (b - tt) / 0.08)
            x = sosfilt(butter(2, [1800, 7000], 'band', fs=SR, output='sos'), x); place(1, st2(x / (np.abs(x).max() + 1e-9)), t + 0.05, -15, align='start')
            for tb in np.arange(t + 0.1, t + b, 0.11): ring(tb, -27, False)
    elif c['kind'] == 'hit':
        put('hit', 1, t, -4 if c['big'] else -6); put('hit_layer', 1, t + 0.002, -9); thump(1, t, -7 if imp else -10, 70)
        noise(2, t + 0.01, -14, 0.3, 200, 2500)                                 # sand kicked up
    if imp: thump(1, t, -6, 48, 0.8); noise(3, t + 0.02, -18, 0.9, 3000, 12000, attack=0.002)   # sub drop + airy tail
# ---------------- BUS 2: surroundings
last = {}
for st in EV['steps']:
    t, c, k = st['t'], st['c'], st['kind']
    if k == 'step':
        if t - last.get(c, -9) < 0.12: continue
        last[c] = t; sand_step(t, -24 + rng.uniform(-3, 1), pan_of(c) * 0.6)
    elif k == 'takeoff': sand_step(t, -16, pan_of(c)); noise(2, t, -20, 0.25, 300, 3000)
    elif k == 'land' and st['foot'] == 'r':
        put('land', 1, t, -7, pan_of(c), 'onset'); thump(1, t, -8, 55, 0.6); noise(2, t + 0.01, -12, 0.6, 200, 2200)
for j in EV['jumps']: put('swing_big', 2, j['t0'] + 0.05, -16, pan_of(j['c']), 'onset')
# ---------------- BUS 3: music (sa.mp3), suck-out into the first impact frame
mus = os.path.join(ROOT, 'newgen-ranked', 'audio', 'sa.mp3'); tmp = a.out + '.music.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a.music_ss), '-t', str(TOTAL + 1), '-i', mus, '-af',
                f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=1.2,afade=t=out:st={TOTAL - 1.6}:d=1.6', '-ar', str(SR), '-ac', '2', tmp], check=True)
m = load(tmp) * 0.38; os.remove(tmp)
if holds:
    h0 = holds[0]; y = m.copy(); zi = np.zeros((2, 2, 2)); a0, a1 = int((h0 - 0.9) * SR), int(h0 * SR)
    for s0 in range(a0, a1, 256):
        u = (s0 - a0) / (a1 - a0); sos = butter(4, 16000 * (380 / 16000) ** (u ** 0.8), 'low', fs=SR, output='sos')
        for ch in range(2): y[s0:s0 + 256, ch], zi[ch] = sosfilt(sos, m[s0:s0 + 256, ch], zi=zi[ch])
        y[s0:s0 + 256] *= 10 ** (-6 * u / 20)
    m = y
BUS[3][:min(N, len(m))] += m[:N]
# ---------------- priority ducking + master
def env(x):
    amp = np.abs(x).max(1); out = np.empty_like(amp); g = 0.0; ka = np.exp(-1 / (0.005 * SR)); kr = np.exp(-1 / (0.18 * SR))
    for i in range(0, len(amp), 64):
        v = amp[i:i + 64].max(); g = ka * g + (1 - ka) * v if v > g else kr ** 64 * g + (1 - kr ** 64) * v; out[i:i + 64] = g
    return out
def duck(x, key, db, thr=0.05): k = np.clip(key / thr, 0, 1); return x * (10 ** (-db * k / 20))[:, None]
e1 = env(BUS[1]); b2 = duck(BUS[2], e1, 8); b3 = duck(duck(BUS[3], e1, 9), env(b2), 3)
mix = (BUS[1] + b2 + b3)[:int(TOTAL * SR)]; mix *= min(1.0, 0.95 / np.abs(mix).max())
# master: measure integrated loudness, gain to -14 LUFS, then a look-ahead peak limiter at -1.4 dBFS (numpy, no overshoot)
meas = subprocess.run(['ffmpeg', '-v', 'info', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                      input=mix.astype(np.float32).tobytes(), capture_output=True).stderr.decode('utf-8', 'replace')
li = float(json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])['input_i']); mix *= 10 ** ((-14 - li) / 20)
LIM, LA, REL = 0.85, int(0.005 * SR), np.exp(-1 / (0.06 * SR))
pk = np.abs(mix).max(1); want = np.minimum(1, LIM / np.maximum(pk, 1e-9))
from scipy.ndimage import minimum_filter1d
want = minimum_filter1d(want, size=2 * LA + 1)                                         # look-ahead window
g = np.empty_like(want); cur = 1.0
for i in range(len(want)):                                                              # instant attack, smooth release
    cur = want[i] if want[i] < cur else min(want[i], 1 - (1 - cur) * REL); g[i] = cur
mix = (mix * g[:, None]).clip(-LIM, LIM)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'aac', '-b:a', '256k', a.out],
               input=mix.astype(np.float32).tobytes(), check=True)
print(f'loudness in {li:.1f} LUFS -> gain {-14 - li:+.1f} dB, limiter min gain {20 * np.log10(g.min()):.1f} dB')
over = {os.path.basename(k): v for k, v in USES.items() if v > 2}
print('wrote', a.out, f'{TOTAL:.2f}s', '| files used', len(USES), '| max uses per file', max(USES.values()) if USES else 0, '| over limit', over or 'none')
print('pools left empty:', [k for k in POOLS if not POOLS[k]])
