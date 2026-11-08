"""Sound for the 20 s fight -> fight/comp/fight_audio.m4a. Run from anim-test/.
Layering per study §2c: whoosh on every swing (anticipation->strike), metal hit + synthesized blade ring on every clash,
heavier layered hit + shine on the big clashes; music bed (sa.mp3) with a low-pass suck-out into the final cross.
House rules: each library file at most twice, no boom/, no explosions, never riser/rs50__synth_misc_16.ogg."""
import json, os, subprocess, sys, re
from collections import Counter
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000; TOTAL = 20.0; LIB = '../toolkit/sfx_lib'; PACK = '../newgen-ranked/audio/userpack/pack.wav'
js = open('fight/choreo.js', encoding='utf-8').read()
CL = [(float(t), 'true' in (big or ''), (kind or "'blade'").strip("'")) for t, big, kind in re.findall(r"clash\(([\d.]+)(?:,\s*(true|false))?(?:,\s*('\w+'))?", js)]
SW = sorted({float(t) for t in re.findall(r"k\('[AB]', ([\d.]+), L\.(?:slash\w|thrust|spin|kick|slam|sweep|upper)\b", js)})

def load(path, ss=None, to=None, rate=1.0):
    af = ['-af', f'asetrate={int(SR * rate)},aresample={SR}'] if rate != 1.0 else []
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss), '-to', str(to)] if ss is not None else []) + ['-i', path] + af + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
    k = min(len(a), int(0.004 * SR)); a[:k] *= np.linspace(0, 1, k)[:, None]; a[-k:] *= np.linspace(1, 0, k)[:, None]
    return a / (np.abs(a).max() + 1e-9)
cat = json.load(open(LIB + '/catalog.json'))['sounds']; pick = {}
for s in cat:
    f = s['file']
    if f == 'riser/rs50__synth_misc_16.ogg' or 'explosion' in f.lower() or f.startswith('boom/'): continue
    pick.setdefault(s['cat'], []).append(s)
used = {}; bed = np.zeros((int(TOTAL * SR) + SR, 2), np.float32); log = []
def place(x, anchor, t, g, name, pan=0.0):
    st = int(t * SR) - anchor
    if st < 0: x = x[-st:]; st = 0
    x = x * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32)
    e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20); log.append(name)
def L(c, t, g, rate=1.0, pan=0.0):
    lst = pick[c]; k = used.get(c, 0); used[c] = k + 1; s = lst[k % len(lst)]
    place(load(f"{LIB}/{s['file']}", rate=rate), int(s['onset'] * SR / rate), t, g, s['file'], pan)
def user(name, t, g):
    a, b = {'shine': (3.85, 4.7), 'whoosh_a': (8.95, 10.7), 'whoosh_b': (20.75, 22.5)}[name]
    x = load(PACK, a, b); env = np.abs(x).max(1); w = int(0.01 * SR); pk = int(np.argmax(np.convolve(env, np.ones(w) / w, 'same')))
    place(x, pk, t, g, 'pack:' + name)
rng = np.random.default_rng(7)
def ring(t, g, big):
    """synthesized blade ring: inharmonic partials of a struck bar, fast attack, long shimmer."""
    d = 1.6 if big else 0.8; tt = np.arange(int(d * SR)) / SR; f0 = rng.uniform(1900, 2600); x = np.zeros_like(tt)
    for r, a, dec in ((1.0, 1.0, 4.0), (2.76, 0.55, 6.5), (5.40, 0.35, 9.0), (8.93, 0.2, 13.0)):
        x += a * np.sin(2 * np.pi * f0 * r * tt + rng.uniform(0, 6.28)) * np.exp(-tt * dec * (1.0 if big else 1.6))
    x *= np.minimum(1, tt / 0.002); x += 0.25 * rng.standard_normal(len(tt)) * np.exp(-tt * 60)   # scrape transient
    x /= np.abs(x).max(); place(np.stack([x, x * 0.92], 1).astype(np.float32), 0, t, g, 'synth:ring')
def thump(t, g):
    """low body thump for the slam (synth, not an explosion sample): 60 Hz sine with a pitch drop."""
    tt = np.arange(int(0.5 * SR)) / SR; f = 70 * np.exp(-tt * 3); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * np.minimum(1, tt / 0.003)
    place(np.stack([x, x], 1).astype(np.float32), 0, t, g, 'synth:thump')

# swings: whoosh peaks ~40 ms before the strike key
for i, t in enumerate(SW):
    if t < 3.0: continue
    L('whoosh', t - 0.06, -15 + rng.uniform(-2, 1), rate=rng.uniform(0.9, 1.15), pan=rng.uniform(-0.3, 0.3))
# spins and the whirlwind get a long whoosh
for t in (6.04, 13.2, 13.9): L('longwhoosh', t, -18)
# runs: snow footsteps (soft crunch = filtered static bursts)
def steps(t0, t1, g):
    for t in np.arange(t0, t1, 0.11):
        n = rng.standard_normal(int(0.06 * SR)) * np.exp(-np.arange(int(0.06 * SR)) / SR * 70)
        n = sosfilt(butter(2, [400, 3000], 'band', fs=SR, output='sos'), n); place(np.stack([n, n], 1).astype(np.float32) / (np.abs(n).max() + 1e-9), 0, t, g + rng.uniform(-3, 0), 'synth:step')
steps(2.86, 3.86, -24); steps(7.32, 8.32, -24); steps(16.78, 17.18, -22)
# clashes
for t, big, kind in CL:
    if kind == 'kick': L('hit', t, -10, rate=0.75); continue
    if kind == 'slam': thump(t, -4); L('crack', t, -14); L('hit', t, -8, rate=0.7); continue
    L('hit', t, -6 if big else -10, rate=rng.uniform(0.95, 1.1)); ring(t, -14 if big else -19, big)
    if big: L('flash', t + 0.01, -14)
user('shine', 4.25, -14); user('shine', 17.35, -12); user('whoosh_a', 17.22, -12)
# bind: grinding (filtered static with tremolo)
x = load(f"{LIB}/{[s for s in pick['static'] if 'static1_excerpt_10s' in s['file']][0]['file']}")[: int(0.9 * SR)]
x = sosfilt(butter(2, [1500, 6000], 'band', fs=SR, output='sos'), x, axis=0) * (0.6 + 0.4 * np.sin(np.arange(len(x)) / SR * 2 * np.pi * 14))[:, None]
place((x / np.abs(x).max()).astype(np.float32), 0, 11.7, -20, 'static-grind')
L('crack', 19.38, -18)                                       # B hits the ground
c = Counter(l for l in log if not l.startswith('synth:')); over = [k for k, v in c.items() if v > 2]
assert not over, f'SFX used more than twice: {over}'
bed = bed[:int(TOTAL * SR)]; bed *= min(1.0, 0.89 / np.abs(bed).max())

# music: sa.mp3, quiet intro, suck-out 16.3 -> 17.3 (cross), drop right after the flash
os.makedirs('fight/comp', exist_ok=True)
SS = round(135.5 - 17.4, 2)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(SS), '-t', str(TOTAL), '-i', '../newgen-ranked/audio/sa.mp3', '-af',
                f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=1.5,afade=t=out:st={TOTAL - 1.4}:d=1.4', '-ar', str(SR), '-ac', '2', 'fight/comp/music.wav'], check=True)
m = load('fight/comp/music.wav') * 0.55; y = m.copy(); zi = np.zeros((2, 2, 2)); a0, a1 = int(16.3 * SR), int(17.3 * SR)
for s in range(a0, a1, 256):
    u = (s - a0) / (a1 - a0); sos = butter(4, 16000 * (380 / 16000) ** (u ** 0.8), 'low', fs=SR, output='sos')
    for ch in range(2): y[s:s + 256, ch], zi[ch] = sosfilt(sos, m[s:s + 256, ch], zi=zi[ch])
    y[s:s + 256] *= 10 ** (-6 * u / 20)
mix = bed[:len(y)] + y[:len(bed)]
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-15:TP=-1.0:LRA=10',
                '-c:a', 'aac', '-b:a', '256k', 'fight/comp/fight_audio.m4a'], input=mix.astype(np.float32).tobytes(), check=True)
print('clashes', len(CL), 'swings', len(SW), 'placed', len(log), 'max library reuse', max(c.values()))
