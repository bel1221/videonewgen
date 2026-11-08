import sys, json, numpy as np
an = sys.argv[1]
for name in ["marlow", "nuvguard", "wynncraft", "dieforyou"]:
    d = json.load(open(f"{an}/{name}.json")); sh = json.load(open(f"{an}/{name}_shots.json"))
    sh = [s for s in sh if s["luma"] > 10]  # skip black cards
    dur = np.array([s["dur"] for s in sh]); pan = np.array([np.hypot(s["pan_x"], s["pan_y"]) for s in sh])
    zm = np.array([s["zoom"] for s in sh]); ob = np.array([s["obj"] for s in sh])
    still = (pan < 1) & (np.abs(zm) < 1)
    print(f"\n== {name}: {len(sh)} lit shots")
    print(f" camera: locked/near-still {still.mean():.0%} | pan>=3%/s {(pan >= 3).mean():.0%} | zoom in {(zm >= 2).mean():.0%} out {(zm <= -2).mean():.0%}")
    print(f" pan speed when moving (median) {np.median(pan[pan>=1]) if (pan>=1).any() else 0:.1f} %w/s; zoom when zooming median {np.median(np.abs(zm[np.abs(zm)>=1])):.1f} %/s")
    print(f" shot dur by obj motion: calm(obj<2) {np.median(dur[ob<2]):.2f}s n={int((ob<2).sum())} | action(obj>=5) {np.median(dur[ob>=5]) if (ob>=5).any() else 0:.2f}s n={int((ob>=5).sum())}")
    # loudness vs cut rate in 10 s windows
    t = np.array(d["audio"]["rms_t"]); db = np.array(d["audio"]["rms_db"]); cuts = np.array(d["cuts"]) / d["fps"]
    T = t[-1]; wins = np.arange(0, T - 5, 5)
    L = [db[(t >= w) & (t < w + 5)].mean() for w in wins]; C = [((cuts >= w) & (cuts < w + 5)).sum() / 5 for w in wins]
    print(f" corr(loudness, cuts/s) per 5s window: {np.corrcoef(L, C)[0,1]:+.2f}")
    print(" timeline (5s): " + " ".join(f"{w:.0f}:{l:.0f}dB/{c:.1f}" for w, l, c in zip(wins[::2], L[::2], C[::2])))
    # cut offsets to nearest onset (strong onsets only)
    on = np.array(d["audio"]["onsets"]); bt = np.array(d["audio"]["beats"])
    off = np.array([on[np.argmin(np.abs(on - c))] - c for c in cuts]) if len(on) else np.array([])
    h, e = np.histogram(off, bins=[-.2, -.1, -.05, -.017, .017, .05, .1, .2])
    print(" cut->nearest onset offset hist (s):", dict(zip([f"{a:+.3f}" for a in e[:-1]], h.tolist())))
    print(f" tempo {d['audio']['tempo']:.0f} bpm; median shot in beats {np.median(dur) / (60 / d['audio']['tempo']):.2f}")
    print(f" flashes: white frames {len(d['white'])}, black frames {len(d['black'])}; mean luma {np.mean([f['luma'] for f in d['frames']]):.0f}, sat {np.mean([f['sat'] for f in d['frames']]):.0f}")
