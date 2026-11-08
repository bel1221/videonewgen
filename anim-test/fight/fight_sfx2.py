"""Sound v2 for the fight test -> fight/comp/fight_audio.m4a. Run from anim-test/.
Events come from the page itself (fight/comp/events.json = window.events()): every planted step, skid, blade-ground
scrape, swing (strike key) and clash, so sound sits on the exact frame of the motion.
Sources: sfx_pack/curated.json (the user's sword pack + sounds cut from the study videos), synthesized sand steps.
Each clash = layered: transient hit + metallic ring + (big) low body + sparkle; each swing = slash whoosh, pitch-varied."""
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000; TOTAL = 20.0; PK = 'sfx_pack'
EV = json.load(open('fight/comp/events.json'))
CUR = json.load(open(f'{PK}/curated.json'))
rng = np.random.default_rng(11)
bed = np.zeros((int(TOTAL * SR) + SR, 2), np.float32); use = {}

def load(path, rate=1.0):
    af = ['-af', f'asetrate={int(SR * rate)},aresample={SR}'] if rate != 1.0 else []
    a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path] + af + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
    return a / (np.abs(a).max() + 1e-9)
def peak_index(x):
    env = np.abs(x).max(1); w = int(0.004 * SR); return int(np.argmax(np.convolve(env, np.ones(w) / w, 'same')))
def place(x, t, g, pan=0.0, align='peak'):
    st = int(t * SR) - (peak_index(x) if align == 'peak' else 0)
    if st < 0: x = x[-st:]; st = 0
    x = x * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32); e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20)
def pick(cls):
    lst = CUR[cls]; k = use.get(cls, 0); use[cls] = k + 1; return f'{PK}/{lst[k % len(lst)]}'
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x, axis=0).astype(np.float32)

def ring(t, g, big):
    d = 1.7 if big else 0.9; tt = np.arange(int(d * SR)) / SR; f0 = rng.uniform(2100, 2900); x = np.zeros_like(tt)
    for r, a, dec in ((1.0, 1.0, 3.5), (2.76, 0.55, 6.0), (5.40, 0.33, 9.0), (8.93, 0.18, 13.0)):
        x += a * np.sin(2 * np.pi * f0 * r * tt + rng.uniform(0, 6.28)) * np.exp(-tt * dec * (1.0 if big else 1.6))
    x *= np.minimum(1, tt / 0.0015); x /= np.abs(x).max(); place(np.stack([x, x * 0.9], 1).astype(np.float32), t, g, align='start')
def thump(t, g, f=65):
    tt = np.arange(int(0.45 * SR)) / SR; fr = f * np.exp(-tt * 4); x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 10) * np.minimum(1, tt / 0.002)
    place(np.stack([x, x], 1).astype(np.float32), t, g, align='start')
def sand(t, g, dur=0.07, bright=2600):
    n = int(dur * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n) * np.exp(-tt * (55 / dur * 0.07)) * np.minimum(1, tt / 0.004)
    x = sosfilt(butter(2, [250, bright], 'band', fs=SR, output='sos'), x); x /= np.abs(x).max() + 1e-9
    place(np.stack([x, x], 1).astype(np.float32), t, g, pan=rng.uniform(-0.2, 0.2), align='start')

# ---- swings: slash on every strike, starting ~70 ms before the strike key (the whoosh crests on the fast part)
for t, c in EV['swings']:
    x = load(pick('slash'), rate=rng.uniform(0.92, 1.12)); place(hp(x, 300), t - 0.03, -9 + rng.uniform(-2, 1), pan=0.25 if c == 'A' else -0.25)
for t in (6.04, 13.2, 13.95, 9.4): place(load(pick('swoosh_big'), rate=rng.uniform(0.95, 1.05)), t + 0.1, -11)   # spins + leap
# ---- clashes: layered
for t, big, kind in EV['clashes']:
    if kind == 'kick': place(load(pick('impact'), rate=0.85), t, -6); thump(t, -10, 80); continue
    if kind == 'slam': thump(t, -2, 55); place(load(pick('impact'), rate=0.8), t, -4); sand(t + 0.01, -6, 0.5, 1800); continue
    place(load(pick('clash'), rate=rng.uniform(0.94, 1.08)), t, -3 if big else -7)
    ring(t + 0.004, -15 if big else -20, big)
    if big: thump(t, -11, 90); place(load(pick('click')), t + 0.012, -14)
# bind grind: rapid tiny scrapes
for i, tb in enumerate(np.arange(11.7, 12.5, 0.055)): sand(tb, -24, 0.04, 9000); ring(tb, -32, False) if i % 3 == 0 else None
# ---- body: footsteps in sand, landings, skids, blade scraping the floor
for t, kind, sp, c in EV['steps']:
    if kind == 'step': sand(t, -20 + min(6, sp * 1.2) + rng.uniform(-2, 1), 0.06 + 0.02 * rng.random())
    elif kind == 'land': sand(t, -12, 0.16, 1900); thump(t, -18, 70)
    elif kind == 'skid': sand(t, -21, 0.12, 3200)
for t in EV['ghits']: sand(t, -13, 0.22, 5200)
# B hits the ground at the end
thump(19.38, -8, 60); sand(19.38, -10, 0.4, 2000)
bed = bed[:int(TOTAL * SR)]; bed *= min(1.0, 0.89 / np.abs(bed).max())

# ---- music: sa.mp3 quiet under the fight, suck-out into the cross, drop after the flash
SS = round(135.5 - 17.4, 2); os.makedirs('fight/comp', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(SS), '-t', str(TOTAL), '-i', '../newgen-ranked/audio/sa.mp3', '-af',
                f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=1.5,afade=t=out:st={TOTAL - 1.4}:d=1.4', '-ar', str(SR), '-ac', '2', 'fight/comp/music.wav'], check=True)
m = load('fight/comp/music.wav') * 0.42; y = m.copy(); zi = np.zeros((2, 2, 2)); a0, a1 = int(16.3 * SR), int(17.3 * SR)
for s in range(a0, a1, 256):
    u = (s - a0) / (a1 - a0); sos = butter(4, 16000 * (380 / 16000) ** (u ** 0.8), 'low', fs=SR, output='sos')
    for ch in range(2): y[s:s + 256, ch], zi[ch] = sosfilt(sos, m[s:s + 256, ch], zi=zi[ch])
    y[s:s + 256] *= 10 ** (-6 * u / 20)
mix = bed[:len(y)] + y[:len(bed)]
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11',
                '-c:a', 'aac', '-b:a', '256k', 'fight/comp/fight_audio.m4a'], input=mix.astype(np.float32).tobytes(), check=True)
print('swings', len(EV['swings']), 'clashes', len(EV['clashes']), 'steps', len(EV['steps']), 'ground', len(EV['ghits']), 'pack uses', use)
