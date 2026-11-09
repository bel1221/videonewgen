"""Sound v3 for the fight test -> fight/comp/fight_audio.m4a. Run from anim-test/.
Events come from the animation (fight/comp/events.json = window.events()), so every sound sits on its frame:
each planted foot = one Minecraft sand step (right/left alternate, pitch/level vary), landings = heavier sand + fall,
skids, blade-ground scrapes, swings, clashes.
PRIORITY MIX (user rule): 1 action/fighting  >  2 surroundings (steps, landings, skids, scrapes)  >  3 random (tails,
grind, ambience, music). Each lower bus is side-chain ducked by the envelope of every bus above it.
Removed on request: all sound on the 6.46 s spin-clash impact frame."""
import json, os, subprocess, glob
import numpy as np
from scipy.signal import butter, sosfilt

SCENE = os.environ.get('SCENE', 'a')
CFG = {'a': dict(total=20.0, mute=[6.46], big=(13.2, 13.95, 9.4), fall=19.38, cross=17.3),
       'b': dict(total=14.0, mute=[], big=(1.5, 4.0, 7.6), fall=12.7, cross=11.3)}[SCENE]
SR = 48000; TOTAL = CFG['total']; PK = 'sfx_pack'; MUTE_CLASH = CFG['mute']
EV = json.load(open('fight/comp/events.json')); CUR = json.load(open(f'{PK}/curated.json'))
MC_SAND = sorted(glob.glob(f'{PK}/mc/step_sand*.ogg')); MC_FALL = f'{PK}/mc/damage_fallsmall.ogg'
rng = np.random.default_rng(11)
N = int(TOTAL * SR) + SR
BUS = {1: np.zeros((N, 2), np.float32), 2: np.zeros((N, 2), np.float32), 3: np.zeros((N, 2), np.float32)}
use = {}; _cache = {}

def load(path, rate=1.0):
    k = (path, round(rate, 3))
    if k not in _cache:
        af = ['-af', f'asetrate={int(SR * rate)},aresample={SR}'] if rate != 1.0 else []
        a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path] + af + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
        _cache[k] = a / (np.abs(a).max() + 1e-9)
    return _cache[k]
def onset(x):
    env = np.abs(x).max(1); thr = env.max() * 0.15; i = int(np.argmax(env > thr)); return max(0, i - int(0.002 * SR))
def peak(x):
    env = np.abs(x).max(1); w = int(0.004 * SR); return int(np.argmax(np.convolve(env, np.ones(w) / w, 'same')))
def place(bus, x, t, g, pan=0.0, align='peak'):
    b = BUS[bus]; st = int(t * SR) - (peak(x) if align == 'peak' else onset(x) if align == 'onset' else 0)
    if st < 0: x = x[-st:]; st = 0
    x = x * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32); e = min(N, st + len(x)); b[st:e] += x[:e - st] * 10 ** (g / 20)
def pick(cls):
    lst = CUR[cls]; k = use.get(cls, 0); use[cls] = k + 1; return f'{PK}/{lst[k % len(lst)]}'
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def ring(t, g, big):
    d = 1.7 if big else 0.9; tt = np.arange(int(d * SR)) / SR; f0 = rng.uniform(2100, 2900); x = np.zeros_like(tt)
    for r, a, dec in ((1.0, 1.0, 3.5), (2.76, 0.55, 6.0), (5.40, 0.33, 9.0), (8.93, 0.18, 13.0)):
        x += a * np.sin(2 * np.pi * f0 * r * tt + rng.uniform(0, 6.28)) * np.exp(-tt * dec * (1.0 if big else 1.6))
    x *= np.minimum(1, tt / 0.0015); x /= np.abs(x).max(); place(3, np.stack([x, x * 0.9], 1).astype(np.float32), t, g, align='start')
def thump(bus, t, g, f=65):
    tt = np.arange(int(0.45 * SR)) / SR; fr = f * np.exp(-tt * 4); x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 10) * np.minimum(1, tt / 0.002)
    place(bus, np.stack([x, x], 1).astype(np.float32), t, g, align='start')
def noise(bus, t, g, dur, lo, hi):
    n = int(dur * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n) * np.exp(-tt * 4 / dur) * np.minimum(1, tt / 0.004)
    x = sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x); x /= np.abs(x).max() + 1e-9
    place(bus, np.stack([x, x], 1).astype(np.float32), t, g, align='start')
_last_sand = [-1]
def mc_step(t, g, foot, rate=None):
    k = rng.integers(len(MC_SAND))
    while k == _last_sand[0]: k = rng.integers(len(MC_SAND))        # never the same file twice in a row
    _last_sand[0] = k; r = rate or rng.uniform(0.9, 1.15)
    x = load(MC_SAND[k], r); off = int(rng.uniform(0, 0.03) * SR); x = x[off:]   # random start -> fewer identical transients
    place(2, x, t, g, pan=(0.12 if foot == 'r' else -0.12), align='onset')
def slide(t0, t1, g):
    # sliding on sand: a random grain of a sand step, time-stretched to the slide length, low-passed, swelled in and out
    src = MC_SAND[rng.integers(len(MC_SAND))]; x = load(src)[:, 0]; a = int(rng.uniform(0.02, 0.12) * SR); grain = x[a:a + int(0.14 * SR)]
    dur = max(0.25, t1 - t0 + 0.15); factor = 0.14 / dur; chain = []
    while factor < 0.5: chain.append('atempo=0.5'); factor /= 0.5
    chain.append(f'atempo={factor:.4f}')
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', ','.join(chain + ['lowpass=f=4500']), '-f', 'f32le', '-'],
                                     input=grain.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, np.float32).copy()
    n = len(y); env = np.minimum(1, np.arange(n) / (0.06 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.18 * SR)); y = y * env / (np.abs(y).max() + 1e-9)
    place(2, np.stack([y, y], 1).astype(np.float32), t0, g, align='start')

muted = lambda t: any(abs(t - m) < 0.03 for m in MUTE_CLASH)
# ---------------- BUS 1: action / fighting
for t, c in EV['swings']:
    if muted(t): continue
    place(1, hp(load(pick('slash'), rng.uniform(0.92, 1.12)), 300), t - 0.03, -9 + rng.uniform(-2, 1), pan=0.25 if c == 'A' else -0.25)
for t in CFG['big']: place(1, load(pick('swoosh_big'), rng.uniform(0.95, 1.05)), t + 0.1, -11)
for t, big, kind in EV['clashes']:
    if muted(t): continue
    if kind == 'kick': place(1, load(pick('impact'), 0.85), t, -6); thump(1, t, -10, 80); continue
    if kind == 'slam': thump(1, t, -2, 55); place(1, load(pick('impact'), 0.8), t, -4); noise(2, t + 0.01, -8, 0.5, 250, 1800); continue
    place(1, load(pick('clash'), rng.uniform(0.94, 1.08)), t, -3 if big else -7)
    if big: thump(1, t, -11, 90)
    ring(t + 0.004, -15 if big else -20, big)                       # tail = random bus
    if big: place(3, load(pick('click')), t + 0.012, -14)
# ---------------- BUS 2: surroundings (one Minecraft sand step per planted foot)
last = {'A': -9, 'B': -9}
for t, kind, sp, c, foot, run in sorted(EV['steps']):
    if kind not in ('step', 'land') or t - last[c] < (0.2 if run or kind == 'land' else 0.32): continue
    last[c] = t
    if kind == 'land': mc_step(t, -12, foot or 'r', 0.85)
    elif run: mc_step(t, -14 + rng.uniform(-1.5, 0.5), foot)               # running: clearly audible
    else: mc_step(t, -30 + rng.uniform(-2, 0), foot)                        # fighting footwork: barely there
for c, wins in EV['slides'].items():
    for t0, t1 in wins: slide(t0, t1, -13)
for t in EV['ghits']: noise(2, t, -12, 0.22, 400, 5200)
mc_step(CFG['fall'], -9, 'r', 0.8); thump(2, CFG['fall'], -12, 60)
# ---------------- BUS 3: random
for i, tb in enumerate(np.arange(11.7, 12.5, 0.055)):
    noise(3, tb, -22, 0.04, 2000, 9000)
SS = round(135.5 - (CFG['cross'] + 0.1), 2); os.makedirs('fight/comp', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(SS), '-t', str(TOTAL), '-i', '../newgen-ranked/audio/sa.mp3', '-af',
                f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=1.5,afade=t=out:st={TOTAL - 1.4}:d=1.4', '-ar', str(SR), '-ac', '2', 'fight/comp/music.wav'], check=True)
m = load('fight/comp/music.wav') * 0.42; y = m.copy(); zi = np.zeros((2, 2, 2)); a0, a1 = int((CFG['cross'] - 1.0) * SR), int(CFG['cross'] * SR)
for s in range(a0, a1, 256):
    u = (s - a0) / (a1 - a0); sos = butter(4, 16000 * (380 / 16000) ** (u ** 0.8), 'low', fs=SR, output='sos')
    for ch in range(2): y[s:s + 256, ch], zi[ch] = sosfilt(sos, m[s:s + 256, ch], zi=zi[ch])
    y[s:s + 256] *= 10 ** (-6 * u / 20)
BUS[3][:len(y)] += y[:N]

# ---------------- priority ducking: envelope follower (5 ms attack, 180 ms release) of the buses above
def env(x):
    a = np.abs(x).max(1); out = np.empty_like(a); g = 0.0; ka = np.exp(-1 / (0.005 * SR)); kr = np.exp(-1 / (0.18 * SR))
    for i in range(0, len(a), 64):                       # block-rate follower (fast enough, cheap)
        v = a[i:i + 64].max(); g = ka * g + (1 - ka) * v if v > g else kr ** 64 * g + (1 - kr ** 64) * v; out[i:i + 64] = g
    return out
def duck(x, key, depth_db, thr=0.05):
    k = np.clip(key / thr, 0, 1); gain = 10 ** (-depth_db * k / 20); return x * gain[:, None]
e1 = env(BUS[1]); e2 = env(BUS[2])
b2 = duck(BUS[2], e1, 10)                                 # surroundings dip 10 dB under fighting
b3 = duck(duck(BUS[3], e1, 12), env(b2), 5)               # random dips under both
mix = BUS[1] + b2 + b3; mix = mix[:int(TOTAL * SR)]; mix *= min(1.0, 0.95 / np.abs(mix).max())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11',
                '-c:a', 'aac', '-b:a', '256k', 'fight/comp/fight_audio.m4a'], input=mix.astype(np.float32).tobytes(), check=True)
nst = sum(1 for s in EV['steps'] if s[1] == 'step')
print('swings', len(EV['swings']), 'clashes', len(EV['clashes']) - len(MUTE_CLASH), 'mc steps', nst, 'muted', MUTE_CLASH)
