"""Cut a sound pack out of long recordings: onset-segmented one-shots, classified by shape/spectrum.
python -I build_sfx_pack.py OUT_DIR NAME=FILE[@start-end] ...   -> OUT_DIR/<class>/<name>_NN.wav + catalog.json
Classes (heuristic, from envelope + spectrum): clash (metallic, sharp attack, long ringing tail), slash (noisy swoosh,
slower attack, 150-600 ms), impact (dull/low, short), unsheathe (long metallic scrape), other."""
import sys, os, json, subprocess
import numpy as np, librosa

SR = 48000
def load(path, ss=None, to=None):
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss), '-to', str(to)] if ss is not None else []) + ['-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

def classify(x):
    env = np.abs(librosa.util.frame(np.pad(x, (0, 512)), frame_length=512, hop_length=256)).max(0); pk = int(np.argmax(env))
    attack = pk * 256 / SR; dur = len(x) / SR
    S = np.abs(librosa.stft(x, n_fft=2048, hop_length=512)) + 1e-9; f = librosa.fft_frequencies(sr=SR, n_fft=2048)
    cent = float((S * f[:, None]).sum() / S.sum()); flat = float(np.mean(librosa.feature.spectral_flatness(S=S)))
    tail = x[int(min(len(x) - 1, (attack + 0.15) * SR)):]
    tail_db = 20 * np.log10(np.sqrt(np.mean(tail ** 2)) + 1e-9) - 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9) if len(tail) > 100 else -60
    peaks = S[:, :max(1, S.shape[1] // 2)].mean(1); tonal = float(np.sort(peaks)[-8:].mean() / (np.median(peaks) + 1e-9))
    if dur > 0.8 and flat < 0.08 and attack > 0.12: c = 'unsheathe'
    elif attack < 0.03 and tonal > 40 and tail_db > -14: c = 'clash'
    elif flat > 0.05 and attack > 0.025 and dur < 1.0: c = 'slash'
    elif cent < 2200 and dur < 0.6: c = 'impact'
    elif attack < 0.03 and tonal > 20: c = 'clash'
    else: c = 'other'
    return c, dict(attack=round(float(attack), 3), dur=round(float(dur), 3), centroid=int(round(cent)), flat=round(float(flat), 4), tonal=round(float(tonal), 1), tail_db=round(float(tail_db), 1))

def segments(x, min_gap=0.12, pre=0.012, max_len=1.6):
    on = librosa.onset.onset_detect(y=x, sr=SR, units='samples', backtrack=True, hop_length=256, delta=0.12, wait=int(min_gap * SR / 256))
    rms = librosa.feature.rms(y=x, hop_length=256)[0]; floor = np.percentile(rms, 20)
    out = []
    for i, s in enumerate(on):
        e = on[i + 1] if i + 1 < len(on) else len(x); e = min(e, s + int(max_len * SR))
        seg = x[max(0, s - int(pre * SR)):e]
        r = librosa.feature.rms(y=seg, hop_length=256)[0]
        if r.max() < floor * 4 or r.max() < 0.01: continue
        last = np.where(r > r.max() * 0.03)[0][-1]                      # trim the decayed tail
        seg = seg[:min(len(seg), (last + 2) * 256)]
        if len(seg) < 0.05 * SR: continue
        k = int(0.004 * SR); seg = seg.copy(); seg[:k] *= np.linspace(0, 1, k); seg[-k * 3:] *= np.linspace(1, 0, k * 3)
        out.append((s / SR, seg / (np.abs(seg).max() + 1e-9)))
    return out

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); cat = []
    for spec in sys.argv[2:]:
        name, src = spec.split('=', 1); ss = to = None
        if '@' in src: src, rng = src.rsplit('@', 1); ss, to = map(float, rng.split('-'))
        x = load(src, ss, to); n = 0
        for t0, seg in segments(x):
            c, feat = classify(seg); d = os.path.join(out, c); os.makedirs(d, exist_ok=True)
            fn = f'{c}/{name}_{n:02d}.wav'; n += 1
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', os.path.join(out, fn)], input=seg.astype(np.float32).tobytes(), check=True)
            cat.append(dict(file=fn, cls=c, source=name, src_time=round((ss or 0) + t0, 3), **feat))
    json.dump(cat, open(os.path.join(out, 'catalog.json'), 'w'), indent=1)
    from collections import Counter
    print(Counter((c['source'], c['cls']) for c in cat))
