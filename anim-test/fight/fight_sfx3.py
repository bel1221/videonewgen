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
       'b': dict(total=14.0, mute=[], big=(1.5, 4.0, 7.6), fall=12.7, cross=11.3),
       'c': dict(total=12.0, mute=[], big=(), fall=10.5, cross=10.02),
       # v7 movement duel (fight_v7/choreo.js: FLASH 17.3, BIND 12.45-13.3, FALL_T 18.9); big swooshes lead the leap
       # overhead (slam 4.4), the leaping slash (10.1) and the mid-air cross (17.3)
       'v7': dict(total=20.0, mute=[], big=(4.15, 9.85, 16.95), fall=18.9, cross=17.3, bind=(12.53, 13.3),
                  events='fight_v7/comp/events.json', out='fight_v7/comp/fight_audio.m4a'),
       # v8 blade masters (fight_v8: FLASH 26.38, BIND 20.78-21.5, FALL_T 27.75). Big swooshes lead the spin combo, the aerial
       # spin, the jump slash and the finale uppercut. impact=True: every impact frame gets a fixed LAYERED hit (user: an impact
       # frame is never a lone sound) and the weak clash clip from v7 6.95 s is dropped.
       'v8': dict(total=30.0, mute=[], big=(5.98, 8.36, 17.02, 26.22), fall=27.75, cross=26.38, bind=(20.86, 21.5), impact=True,
                  drop=['clash/desert_01.wav'], events='fight_v8/comp/events.json', out='fight_v8/comp/fight_audio.m4a'),
       # fight_w weapon duels (20 s): wpn = B's weapon sound family; fall=None (no fall), bind only where there is one
       'spear': dict(total=20.0, mute=[], big=(5.12, 9.3, 11.25, 17.4), fall=None, cross=17.85, bind=(15.5, 16.15), impact=True, wpn='spear',
                     drop=['clash/desert_01.wav'], events='fight_w/comp/events_spear.json', out='fight_w/comp/audio_spear.m4a'),
       'hammer': dict(total=20.0, mute=[], big=(3.6, 6.4, 8.55, 16.55), fall=None, cross=16.95, bind=(0, 0), impact=True, wpn='hammer',
                      drop=['clash/desert_01.wav'], events='fight_w/comp/events_hammer.json', out='fight_w/comp/audio_hammer.m4a'),
       'bow': dict(total=20.0, mute=[], big=(5.8, 14.62), fall=None, cross=14.95, bind=(0, 0), impact=True, wpn='bow',
                   drop=['clash/desert_01.wav'], events='fight_w/comp/events_bow.json', out='fight_w/comp/audio_bow.m4a'),
       # duel40 (Boltspear vs Goldreaper, 40 s with slow motion): times below are ANIMATION seconds; all events are mapped to
       # video time through the slow-motion segments (EV['slowmo']) before placing sounds
       'duel40': dict(total=40.0, mute=[], big=(3.05, 15.25, 17.95, 21.6, 25.5), fall=26.8, cross=25.75, bind=(19.78, 20.4), impact=True, wpn='duel40',
                      drop=['clash/desert_01.wav'], events='fight_w/comp/events_duel40.json', out='fight_w/comp/audio_duel40.m4a'),
       # bolt30 (Boltspear vs Lancebolt, 29 s animation + 1 s of slow motion): spear vs spear
       'bolt30': dict(total=30.0, mute=[], big=(2.95, 13.3, 25.6), fall=28.4, cross=26.32, bind=(0, 0), impact=True, wpn='duel', kinds={'A': 'spear', 'B': 'spear'},
                      drop=['clash/desert_01.wav'], events='fight_w/comp/events_bolt30.json', out='fight_w/comp/audio_bolt30.m4a'),
       # 10 s mechanics tests: 'kinds' picks each fighter's swing sound by weapon
       't1': dict(total=10.0, mute=[], big=(4.75,), fall=None, cross=99.0, bind=(0, 0), impact=True, wpn='duel', kinds={'A': 'sword', 'B': 'sword'},
                  drop=['clash/desert_01.wav'], events='fight_w/comp/events_t1.json', out='fight_w/comp/audio_t1.m4a'),
       't2': dict(total=10.0, mute=[], big=(3.1,), fall=None, cross=99.0, bind=(0, 0), impact=True, wpn='duel', kinds={'A': 'greatsword', 'B': 'spear'},
                  drop=['clash/desert_01.wav'], events='fight_w/comp/events_t2.json', out='fight_w/comp/audio_t2.m4a'),
       't3': dict(total=10.0, mute=[], big=(2.4, 6.35), fall=None, cross=99.0, bind=(0, 0), impact=True, wpn='duel', kinds={'A': 'hammer', 'B': 'sword'},
                  drop=['clash/desert_01.wav'], events='fight_w/comp/events_t3.json', out='fight_w/comp/audio_t3.m4a')}[SCENE]
EVF = CFG.get('events', 'fight/comp/events.json'); OUTF = CFG.get('out', 'fight/comp/fight_audio.m4a')
SR = 48000; TOTAL = CFG['total']; PK = 'sfx_pack'; MUTE_CLASH = CFG['mute']
EV = json.load(open(EVF)); CUR = json.load(open(f'{PK}/curated.json'))
# slow motion: map animation time -> video time for every event (and the config times) so sounds land on the slowed frames
SLOW = sorted(EV.get('slowmo', []))
def vt(t):
    v, ta = 0.0, 0.0
    for a0, a1, r in SLOW:
        if t <= a0: break
        v += a0 - ta; ta = a0
        if t <= a1: return v + (t - a0) / r
        v += (a1 - a0) / r; ta = a1
    return v + (t - ta)
if SLOW:
    EV['swings'] = [[vt(t), c] for t, c in EV['swings']]; EV['clashes'] = [[vt(t), b, k] for t, b, k in EV['clashes']]
    EV['steps'] = [[vt(st[0])] + st[1:] for st in EV['steps']]; EV['ghits'] = [vt(t) for t in EV['ghits']]
    EV['slides'] = {c: [[vt(a), vt(b)] for a, b in w] for c, w in EV['slides'].items()}; EV['twirls'] = [[vt(t), c] for t, c in EV.get('twirls', [])]
    EV['ins'] = [vt(t) for t in EV.get('ins', [])]; EV['flash'] = vt(EV['flash'])
    CFG = dict(CFG, big=tuple(vt(t) for t in CFG['big']), fall=vt(CFG['fall']) if CFG['fall'] is not None else None, cross=vt(CFG['cross']), bind=tuple(vt(t) for t in CFG['bind']))
for _k in CUR:
    if isinstance(CUR[_k], list): CUR[_k] = [f for f in CUR[_k] if f not in CFG.get('drop', [])]
BIND = CFG.get('bind', (11.7, 12.5))
INS = set(round(x, 3) for x in EV.get('ins', [])) | ({round(EV['flash'], 3)} if CFG.get('impact') and 'flash' in EV else set()) if CFG.get('impact') else set()
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
WPN = CFG.get('wpn'); MC = f'{PK}/mc/'
for t, c in EV['swings']:
    if muted(t): continue
    pan = 0.25 if c == 'A' else -0.25
    if c == 'B' and WPN == 'hammer':      # heavy: a low mace whoosh instead of a blade swish
        place(1, load(MC + f'item_mace_smash_air{1 + int(rng.integers(3))}.ogg', rng.uniform(0.78, 0.86)), t - 0.05, -6, pan=pan); continue
    KD = CFG.get('kinds', {}).get(c)
    if KD == 'hammer':
        place(1, load(MC + f'item_mace_smash_air{1 + int(rng.integers(3))}.ogg', rng.uniform(0.78, 0.86)), t - 0.05, -6, pan=pan); continue
    if KD == 'spear':
        place(1, load(MC + f'item_trident_throw{1 + int(rng.integers(2))}.ogg', rng.uniform(1.0, 1.12)), t - 0.04, -10, pan=pan)
        place(1, hp(load(pick('slash'), rng.uniform(1.05, 1.2)), 900), t - 0.03, -15, pan=pan); continue
    if WPN == 'duel40' and c == 'B' or KD == 'greatsword':     # two-handed greatsword: a heavier, lower swish with a big-swoosh layer
        place(1, hp(load(pick('slash'), rng.uniform(0.78, 0.86)), 200), t - 0.04, -7, pan=pan); place(1, load(pick('swoosh_big'), 0.9), t - 0.02, -15, pan=pan); continue
    if (c == 'B' and WPN == 'spear') or (c == 'A' and WPN == 'duel40'):   # spear thrusts: trident throw whoosh + a thin swish
        place(1, load(MC + f'item_trident_throw{1 + int(rng.integers(2))}.ogg', rng.uniform(1.0, 1.12)), t - 0.04, -10, pan=pan)
        place(1, hp(load(pick('slash'), rng.uniform(1.05, 1.2)), 900), t - 0.03, -15, pan=pan); continue
    place(1, hp(load(pick('slash'), rng.uniform(0.92, 1.12)), 300), t - 0.03, -9 + rng.uniform(-2, 1), pan=pan)
for t in CFG['big']: place(1, load(pick('swoosh_big'), rng.uniform(0.95, 1.05)), t + 0.1, -11)
def impact_hit(t):
    # impact frame: whoosh peaking just before the hit + the strongest clash + a second clash layer + low thump + ring + click
    place(1, load(f'{PK}/unsheathe/desert_34.wav', 1.0), t - 0.07, -8)
    place(1, load(f'{PK}/clash/mani_06.wav', 0.97), t, -1)
    place(1, load(f'{PK}/other/mani_01.wav', 1.04), t + 0.006, -7)
    thump(1, t, -7, 85); ring(t + 0.004, -13, True); place(3, load(pick('click')), t + 0.012, -12)
for tn, t0, t1, mode in EV.get('arrows', []):                     # bow: the shot, and a pass-by whoosh for dodged arrows
    place(1, load(MC + 'random_bow.ogg', rng.uniform(0.95, 1.05)), t0, -5, align='onset', pan=-0.2)
    noise(3, tn + 0.05, -26, max(0.15, t0 - tn - 0.1), 300, 1200)                                # string creak while drawing
    if mode == 'dodge': place(1, hp(load(pick('slash'), 1.3), 1500), t1, -12)
for a0, a1, r in SLOW: place(1, load(f'{PK}/unsheathe/desert_22.wav', 0.55), vt(a0) + 0.05, -9, align='onset'); thump(1, vt(a0), -14, 45)   # slow-mo: deep whoosh swell
for t, c in EV.get('twirls', []):                                   # sword twirl: a soft air swish per half turn
    place(1, hp(load(pick('slash'), rng.uniform(1.2, 1.35)), 1400), t, -21 + rng.uniform(-2, 1), pan=0.3 if c == 'A' else -0.3)
for t, big, kind in EV['clashes']:
    if muted(t): continue
    if round(t, 3) in INS and kind in ('blade', 'cross'): impact_hit(t); continue
    if kind == 'kick': place(1, load(pick('impact'), 0.85), t, -6); thump(1, t, -10, 80); continue
    if kind == 'hit': place(1, load(pick('impact'), 0.9), t, -5); thump(1, t, -9, 75); place(1, hp(load(pick('slash'), 1.1), 900), t - 0.01, -14); continue
    if kind == 'slam':
        thump(1, t, -2, 55); place(1, load(pick('impact'), 0.8), t, -4); noise(2, t + 0.01, -8, 0.5, 250, 1800)
        if WPN == 'hammer' or 'hammer' in CFG.get('kinds', {}).values(): place(1, load(MC + 'item_mace_smash_ground_heavy.ogg', 0.92), t, -3 if big else -6)
        if round(t, 3) in INS or big: place(1, load(f'{PK}/unsheathe/desert_34.wav', 0.9), t - 0.08, -10)   # impact frame: never a lone sound
        continue
    if kind == 'arrow':                    # an arrow cut out of the air: bright tick + light clash + arrow hit
        place(1, load(pick('clash'), rng.uniform(1.1, 1.25)), t, -6 if not big else -2); place(1, load(MC + f'random_bowhit{1 + int(rng.integers(4))}.ogg', 1.1), t + 0.01, -9)
        ring(t + 0.004, -19 if not big else -14, big)
        if round(t, 3) in INS or big: place(1, load(f'{PK}/unsheathe/desert_34.wav', 1.0), t - 0.07, -9); thump(1, t, -9, 85)
        continue
    if kind == 'drag': noise(2, t, -15, 0.16, 300, 3200); continue          # spear head dragged through the sand
    if kind == 'arrowg': place(1, load(MC + f'random_bowhit{1 + int(rng.integers(4))}.ogg', 0.95), t, -7); noise(2, t, -14, 0.18, 400, 4000); continue
    place(1, load(pick('clash'), rng.uniform(0.94, 1.08)), t, -3 if big else -7)
    if WPN == 'hammer' or 'hammer' in CFG.get('kinds', {}).values(): place(1, load(MC + f'mob_irongolem_hit{1 + int(rng.integers(4))}.ogg', 0.85), t, -9)   # steel on the stone/iron hammer
    if WPN in ('spear', 'duel40') or 'spear' in CFG.get('kinds', {}).values(): place(1, load(MC + f'item_shield_block{1 + int(rng.integers(5))}.ogg', 1.05), t, -14)   # wood/steel shaft knock
    if WPN == 'bow': place(1, load(MC + f'item_shield_block{1 + int(rng.integers(5))}.ogg', 1.2), t, -12)
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
if CFG['fall'] is not None: mc_step(CFG['fall'], -9, 'r', 0.8); thump(2, CFG['fall'], -12, 60)
# ---------------- BUS 3: random
for i, tb in enumerate(np.arange(BIND[0], BIND[1], 0.055)):
    noise(3, tb, -22, 0.04, 2000, 9000)
SS = round(135.5 - (CFG['cross'] + 0.1), 2); os.makedirs('fight/comp', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(SS), '-t', str(TOTAL), '-i', '../newgen-ranked/audio/sa.mp3', '-af',
                f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=1.5,afade=t=out:st={TOTAL - 1.4}:d=1.4', '-ar', str(SR), '-ac', '2', 'fight/comp/music.wav'], check=True)
m = load('fight/comp/music.wav') * 0.42; y = m.copy(); zi = np.zeros((2, 2, 2)); a0, a1 = int((CFG['cross'] - 1.0) * SR), int(CFG['cross'] * SR)
for s in range(a0, min(a1, len(m) - 256), 256):   # no sweep when the cross/flash lies past the end (10 s tests)
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
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11' + (',alimiter=limit=0.89:attack=1:release=60:level=disabled' if CFG.get('impact') else ''),   # v8: loudnorm overshot to +2 dBFS on impact hits
                '-c:a', 'aac', '-b:a', '256k', OUTF], input=mix.astype(np.float32).tobytes(), check=True)
nst = sum(1 for s in EV['steps'] if s[1] == 'step')
print('swings', len(EV['swings']), 'clashes', len(EV['clashes']) - len(MUTE_CLASH), 'mc steps', nst, 'muted', MUTE_CLASH)
