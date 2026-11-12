"""Sound for the 2 v 2 fight (fight4.js) -> fight_w/comp/audio_duo.m4a. Run from anim-test/:  python fight_w/duo_sfx.py
Events: fight_w/comp/events_duo.json = window.events() of fight4 (both duels' events, slow-motion windows, arrows, the disarm, extras).
Same method and priority mix as fight/fight_sfx3.py (1 action > 2 surroundings > 3 tails/music, each ducked by the buses above), with:
- per-fighter weapon voices: sword, spear, wooden staff, bow
- slow motion: the user's pick from the samples = "sub drop" (reversed air lead-in, bass falling 120 -> 36 Hz, a rising sweep on the way out),
  with the music low-passed and pulled down while time is slow
- the logo outro: a soft whoosh in, a light shine, the music fades out
- NO 'desert_*' clips (cut from other creators' videos): they are filtered out of the curated lists here."""
import json, os, subprocess, glob
import numpy as np
from scipy.signal import butter, sosfilt

EVF, OUTF = os.environ.get('EVF', 'fight_w/comp/events_duo.json'), os.environ.get('OUTF', 'fight_w/comp/audio_duo.m4a')
# a single duel (fight.js events) works too:  EVF=fight_w/comp/events_v8x.json OUTF=... KINDS=sword,sword EXTRA='[{"t":34,"kind":"outro"}]' python fight_w/duo_sfx.py
SR = 48000; PK = 'sfx_pack'; LIB = '../toolkit/sfx_lib'; MC = f'{PK}/mc/'
EV4 = json.load(open(EVF))
if 'duels' not in EV4: EV4 = dict(duels=[EV4], slowmo=EV4.get('slowmo', []), video_total=EV4.get('video_total', EV4.get('total')), arrows=[], disarm=[], extra=[])
EV4['extra'] = EV4.get('extra', []) + json.loads(os.environ.get('EXTRA', '[]'))
TOTAL = float(EV4['video_total']); SLOW = sorted(EV4.get('slowmo', []))
KIND = {(0, 'A'): 'sword', (0, 'B'): 'spear', (1, 'A'): 'staff', (1, 'B'): 'bow'}
if os.environ.get('KINDS'): KIND = {(i // 2, 'AB'[i % 2]): k for i, k in enumerate(os.environ['KINDS'].split(','))}
SINGLE = len(EV4['duels']) == 1
CUR = json.load(open(f'{PK}/curated.json'))
for k in CUR:
    if isinstance(CUR[k], list): CUR[k] = [f for f in CUR[k] if 'desert_' not in f]
BIGSW = [f'{LIB}/whoosh/qbd__qubodup-megaswosh1.ogg', f'{LIB}/whoosh/qbd__qubodup-megaswosh2.ogg', f'{LIB}/longwhoosh/swish__swosh-23.ogg']
def vt(t):
    v, ta = 0.0, 0.0
    for a0, a1, r in SLOW:
        if t <= a0: break
        v += a0 - ta; ta = a0
        if t <= a1: return v + (t - a0) / r
        v += (a1 - a0) / r; ta = a1
    return v + (t - ta)
def slow_at(t): return any(a0 <= t <= a1 for a0, a1, r in SLOW)
MC_SAND = sorted(glob.glob(f'{PK}/mc/step_sand*.ogg')); rng = np.random.default_rng(23)
N = int(TOTAL * SR) + SR
BUS = {1: np.zeros((N, 2), np.float32), 2: np.zeros((N, 2), np.float32), 3: np.zeros((N, 2), np.float32)}
use = {}; _cache = {}
def load(path, rate=1.0, rev=False):
    k = (path, round(rate, 3), rev)
    if k not in _cache:
        af = [f'asetrate={int(SR * rate)}', f'aresample={SR}'] if rate != 1.0 else []
        if rev: af.append('areverse')
        a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path] + (['-af', ','.join(af)] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
        _cache[k] = a / (np.abs(a).max() + 1e-9)
    return _cache[k]
def onset(x):
    env = np.abs(x).max(1); thr = env.max() * 0.15; i = int(np.argmax(env > thr)); return max(0, i - int(0.002 * SR))
def peak(x):
    env = np.abs(x).max(1); w = int(0.004 * SR); return int(np.argmax(np.convolve(env, np.ones(w) / w, 'same')))
def place(bus, x, t, g, pan=0.0, align='peak'):
    b = BUS[bus]; st = int(t * SR) - (peak(x) if align == 'peak' else onset(x) if align == 'onset' else 0)
    if st < 0: x = x[-st:]; st = 0
    if st >= N: return
    x = x * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32); e = min(N, st + len(x)); b[st:e] += x[:e - st] * 10 ** (g / 20)
def pick(cls):
    lst = CUR[cls]; k = use.get(cls, 0); use[cls] = k + 1; return f'{PK}/{lst[k % len(lst)]}'
def bigsw(): k = use.get('bigsw', 0); use['bigsw'] = k + 1; return BIGSW[k % len(BIGSW)]
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def st2(x): return np.stack([x, x], 1).astype(np.float32)
def ring(t, g, big):
    d = 1.7 if big else 0.9; tt = np.arange(int(d * SR)) / SR; f0 = rng.uniform(2100, 2900); x = np.zeros_like(tt)
    for r, a, dec in ((1.0, 1.0, 3.5), (2.76, 0.55, 6.0), (5.40, 0.33, 9.0), (8.93, 0.18, 13.0)):
        x += a * np.sin(2 * np.pi * f0 * r * tt + rng.uniform(0, 6.28)) * np.exp(-tt * dec * (1.0 if big else 1.6))
    x *= np.minimum(1, tt / 0.0015); x /= np.abs(x).max(); place(3, np.stack([x, x * 0.9], 1).astype(np.float32), t, g, align='start')
def thump(bus, t, g, f=65):
    tt = np.arange(int(0.45 * SR)) / SR; fr = f * np.exp(-tt * 4); x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 10) * np.minimum(1, tt / 0.002)
    place(bus, st2(x), t, g, align='start')
def noise(bus, t, g, dur, lo, hi):
    n = int(dur * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n) * np.exp(-tt * 4 / dur) * np.minimum(1, tt / 0.004)
    x = sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x); x /= np.abs(x).max() + 1e-9; place(bus, st2(x), t, g, align='start')
_last_sand = [-1]
def mc_step(t, g, foot, rate=None):
    k = rng.integers(len(MC_SAND))
    while k == _last_sand[0]: k = rng.integers(len(MC_SAND))
    _last_sand[0] = k; x = load(MC_SAND[k], rate or rng.uniform(0.9, 1.15)); x = x[int(rng.uniform(0, 0.03) * SR):]
    place(2, x, t, g, pan=(0.12 if foot == 'r' else -0.12), align='onset')
def slide(t0, t1, g):
    src = MC_SAND[rng.integers(len(MC_SAND))]; x = load(src)[:, 0]; a = int(rng.uniform(0.02, 0.12) * SR); grain = x[a:a + int(0.14 * SR)]
    dur = max(0.25, t1 - t0 + 0.15); factor = 0.14 / dur; chain = []
    while factor < 0.5: chain.append('atempo=0.5'); factor /= 0.5
    chain.append(f'atempo={factor:.4f}')
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', ','.join(chain + ['lowpass=f=4500']), '-f', 'f32le', '-'],
                                     input=grain.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, np.float32).copy()
    n = len(y); env = np.minimum(1, np.arange(n) / (0.06 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.18 * SR)); y = y * env / (np.abs(y).max() + 1e-9)
    place(2, st2(y), t0, g, align='start')
def impact_layer(t, g=0):   # an impact is never a lone sound: lead-in swish + low thump + ring
    place(1, hp(load(bigsw(), 1.05), 300), t - 0.07, -11 + g); thump(1, t, -8 + g, 85); ring(t + 0.004, -14 + g, True)

n_ev = dict(swings=0, clashes=0, steps=0)
for di, EV in enumerate(EV4['duels']):
    side = 0.0 if SINGLE else -0.18 if di == 0 else 0.18                                  # duel 1 a little left, duel 2 a little right
    # ---------------- BUS 1: action
    for t, c in EV['swings']:
        kd = KIND[(di, c)]; tv = vt(t); pan = side + (0.12 if c == 'A' else -0.12); q = -4 if slow_at(t) else 0; n_ev['swings'] += 1
        if kd == 'bow': continue                                       # the bow's 'swings' are kicks/blocks: no blade swish
        if kd == 'spear':
            place(1, load(MC + f'item_trident_throw{1 + int(rng.integers(2))}.ogg', rng.uniform(1.0, 1.12)), tv - 0.04, -11 + q, pan=pan)
            place(1, hp(load(pick('slash'), rng.uniform(1.05, 1.2)), 900), tv - 0.03, -16 + q, pan=pan)
        elif kd == 'staff':                                            # wood: a lower, rounder whoosh, no steel swish
            place(1, lp(load(MC + f'item_trident_throw{1 + int(rng.integers(2))}.ogg', rng.uniform(0.78, 0.88)), 3200), tv - 0.04, -9 + q, pan=pan)
        else: place(1, hp(load(pick('slash'), rng.uniform(0.92, 1.12)), 300), tv - 0.03, -10 + rng.uniform(-2, 1) + q, pan=pan)
    for t, c in EV.get('twirls', []):                                  # the staff spinning: a soft air beat per half turn
        place(1, lp(hp(load(pick('slash'), rng.uniform(0.8, 0.9)), 500), 5000), vt(t), -17 + rng.uniform(-2, 1), pan=side)
    for t, big, kind in EV['clashes']:
        tv = vt(t); n_ev['clashes'] += 1; wood = KIND.get((di, 'A')) in ('staff', 'bow') or KIND.get((di, 'B')) in ('staff', 'bow')                # duel 2: a wooden staff and a bow -> knocks, not steel
        if kind == 'kick': place(1, load(pick('impact'), 0.85), tv, -6, pan=side); thump(1, tv, -9 if big else -11, 80); continue
        if kind == 'slam':
            thump(1, tv, -3, 55); place(1, load(pick('impact'), 0.8), tv, -5, pan=side); noise(2, tv + 0.01, -8, 0.5, 250, 1800)
            if big: place(1, hp(load(bigsw(), 0.95), 250), tv - 0.08, -11)
            continue
        if kind == 'arrow':
            place(1, load(MC + f'random_bowhit{1 + int(rng.integers(4))}.ogg', 1.1), tv + 0.005, -6, pan=side)
            if wood: place(1, load(MC + f'item_shield_block{1 + int(rng.integers(5))}.ogg', 1.15), tv, -8 if not big else -5, pan=side)
            else: place(1, load(pick('clash'), rng.uniform(1.1, 1.25)), tv, -3, pan=side); ring(tv + 0.004, -14, True)
            if big: impact_layer(tv, -2)
            continue
        if kind == 'drag': noise(2, tv, -15, 0.16, 300, 3200); continue
        if kind == 'arrowg': place(1, load(MC + f'random_bowhit{1 + int(rng.integers(4))}.ogg', 0.95), tv, -7, pan=side); noise(2, tv, -14, 0.18, 400, 4000); continue
        if wood:
            place(1, load(MC + f'item_shield_block{1 + int(rng.integers(5))}.ogg', rng.uniform(0.95, 1.1)), tv, -4 if big else -7, pan=side)
            place(1, load(pick('impact'), 1.15), tv, -13, pan=side)
        else:
            place(1, load(pick('clash'), rng.uniform(0.94, 1.08)), tv, -3 if big else -7, pan=side)
            place(1, load(MC + f'item_shield_block{1 + int(rng.integers(5))}.ogg', 1.05), tv, -14, pan=side); ring(tv + 0.004, -15 if big else -21, big)
        if big: impact_layer(tv, -3)
    # ---------------- BUS 2: surroundings
    last = {'A': -9, 'B': -9}
    for t, kind, sp, c, foot, run in sorted(EV['steps']):
        tv = vt(t)
        if kind not in ('step', 'land') or tv - last[c] < (0.2 if run or kind == 'land' else 0.32): continue
        last[c] = tv; n_ev['steps'] += 1
        if kind == 'land': mc_step(tv, -13, foot or 'r', 0.85)
        elif run: mc_step(tv, -16 + rng.uniform(-1.5, 0.5), foot)
        else: mc_step(tv, -31 + rng.uniform(-2, 0), foot)
    for c, wins in EV['slides'].items():
        for t0, t1 in wins: slide(vt(t0), vt(t1), -14)
    for t in EV['ghits']: noise(2, vt(t), -13, 0.22, 400, 5200)
    for k in ('fall',):
        pass
for tn, t0, t1, mode, did in EV4.get('arrows', []):                    # the bow: string creak while drawing, the shot, a pass-by for misses
    place(1, load(MC + 'random_bow.ogg', rng.uniform(0.95, 1.05) * (0.7 if slow_at(t0) else 1.0)), vt(t0), -5, align='onset', pan=0.15)
    noise(3, vt(tn) + 0.05, -26, max(0.15, vt(t0) - vt(tn) - 0.1), 300, 1200)
    if mode == 'dodge': place(1, hp(load(pick('slash'), 1.3), 1500), vt(t1), -12)
    if mode == 'hit': place(1, load(MC + f'random_bowhit{1 + int(rng.integers(4))}.ogg', 0.9), vt(t1), -4); thump(1, vt(t1), -10, 75)
# falls (the two losers hit the sand): taken from the director's extras if present, else skipped
for e in EV4.get('extra', []):
    tv = vt(e['t'])
    if e['kind'] == 'fall': mc_step(tv, -9, 'r', 0.8); thump(2, tv, -12, 60)
    if e['kind'] == 'disarm':                                          # the spear knocked out of the hands: a sharp steel ring on top of the arrow hit
        place(1, load(pick('clash'), 1.2), tv, -2); ring(tv + 0.004, -11, True)
    if e['kind'] == 'shove': place(1, hp(load(bigsw(), 1.1), 300), tv - 0.09, -9)
    if e['kind'] == 'stab':                                            # a blade through the body: thrust swish, a dull hit, low thump
        place(1, hp(load(pick('slash'), 1.1), 900), tv - 0.03, -8); place(1, load(pick('impact'), 0.8), tv, -3); thump(1, tv, -6, 70)
    if e['kind'] == 'pull': place(1, hp(load(pick('slash'), 0.85), 500), tv, -11); noise(2, tv, -18, 0.2, 500, 4000)   # the blade drawn back out
for d in EV4.get('disarm', []): tl = vt(d['land']); place(1, load(MC + f'item_trident_ground_impact{1 + int(rng.integers(4))}.ogg', 1.0), tl, -8); noise(2, tl, -12, 0.3, 300, 3000)
# ---------------- slow motion = sample 5 "sub drop" (the user's pick): reversed air lead-in -> bass falling 120 -> 36 Hz; a rising sweep on the way out
for a0, a1, r in SLOW:
    v0, v1 = vt(a0), vt(a1)
    lead = hp(load(f'{LIB}/longwhoosh/swish__swosh-28.ogg', 1.0, rev=True)[-int(0.5 * SR):], 500); place(1, lead, v0 - 0.5, -9, align='start')
    tt = np.arange(int(1.2 * SR)) / SR; drop = 0.85 * np.sin(2 * np.pi * (120 * tt - 35 * tt * tt)) * np.exp(-1.3 * tt) * np.minimum(1, tt / 0.004); place(1, st2(drop), v0, -3, align='start')
    tt = np.arange(int(0.45 * SR)) / SR; up = 0.5 * np.sin(2 * np.pi * (60 * tt + 260 * tt * tt)) * np.minimum(1, tt * 8) * np.exp(-3 * (0.45 - tt)); place(1, st2(up), v1 - 0.45, -6, align='start')
# ---------------- logo outro: a soft whoosh as the logo comes in, a light shine as the highlight passes
VO = next((vt(e['t']) for e in EV4.get('extra', []) if e['kind'] == 'outro'), TOTAL - 3.4)
place(3, lp(load(f'{LIB}/longwhoosh/swish__swosh-32.ogg', 0.8), 6000), VO + 0.1, -12, align='start')
place(3, load(f'{LIB}/flash/kint__glass_004.ogg', 1.0), VO + 1.35, -16, align='onset'); thump(3, VO + 0.35, -16, 70)
# ---------------- music (sa.mp3), low-passed and pulled down while time is slow, faded out under the logo
os.makedirs('fight_w/comp', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '96', '-t', str(TOTAL), '-i', '../newgen-ranked/audio/sa.mp3', '-af',
                f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=1.2,afade=t=out:st={TOTAL - 2.2}:d=2.2', '-ar', str(SR), '-ac', '2', 'fight_w/comp/music_duo.wav'], check=True)
m = load('fight_w/comp/music_duo.wav') * 0.42; y = m.copy(); zi = np.zeros((2, 2, 2)); k = np.zeros(len(m), np.float32)
for a0, a1, r in SLOW:   # 0..1 "slowness" envelope: in over 0.15 s, out over 0.25 s
    i0, i1 = int((vt(a0) - 0.15) * SR), int((vt(a1) + 0.25) * SR); n0 = int(0.15 * SR); n1 = int(0.25 * SR)
    k[i0:i0 + n0] = np.maximum(k[i0:i0 + n0], np.linspace(0, 1, n0)); k[i0 + n0:i1 - n1] = 1; k[i1 - n1:i1] = np.maximum(k[i1 - n1:i1], np.linspace(1, 0, n1))
for s in range(0, len(m) - 256, 256):
    u = float(k[s]);
    if u <= 0.001: zi[:] = 0; continue
    sos = butter(4, 16000 * (420 / 16000) ** (u ** 0.8), 'low', fs=SR, output='sos')
    for ch in range(2): y[s:s + 256, ch], zi[ch] = sosfilt(sos, m[s:s + 256, ch], zi=zi[ch])
    y[s:s + 256] *= 10 ** (-7 * u / 20)
BUS[3][:min(N, len(y))] += y[:N]
# ---------------- priority ducking
def env(x):
    a = np.abs(x).max(1); out = np.empty_like(a); g = 0.0; ka = np.exp(-1 / (0.005 * SR)); kr = np.exp(-1 / (0.18 * SR))
    for i in range(0, len(a), 64):
        v = a[i:i + 64].max(); g = ka * g + (1 - ka) * v if v > g else kr ** 64 * g + (1 - kr ** 64) * v; out[i:i + 64] = g
    return out
def duck(x, key, depth_db, thr=0.05): kk = np.clip(key / thr, 0, 1); return x * (10 ** (-depth_db * kk / 20))[:, None]
e1 = env(BUS[1]); b2 = duck(BUS[2], e1, 10); b3 = duck(duck(BUS[3], e1, 12), env(b2), 5)
mix = BUS[1] + b2 + b3; mix = mix[:int(TOTAL * SR)]; mix *= min(1.0, 0.95 / np.abs(mix).max())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11,alimiter=limit=0.89:attack=1:release=60:level=disabled',
                '-c:a', 'aac', '-b:a', '256k', OUTF], input=mix.astype(np.float32).tobytes(), check=True)
print('video', TOTAL, 's | swings', n_ev['swings'], 'clashes', n_ev['clashes'], 'steps', n_ev['steps'], 'arrows', len(EV4.get('arrows', [])), 'slowmo', len(SLOW))
