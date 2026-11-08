"""spectrogram + loudness + onset strength with cut markers. specsheet.py an name out [t0 t1]"""
import sys, json, numpy as np, soundfile as sf, librosa, librosa.display, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt
an, name, out = sys.argv[1:4]
d = json.load(open(f"{an}/{name}.json")); y, sr = sf.read(f"{an}/{name}.wav"); y = y.mean(1)
t0, t1 = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (0, len(y) / sr)
y = y[int(t0 * sr):int(t1 * sr)]
S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=2048, hop_length=256)), ref=np.max)
oe = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256); ot = librosa.times_like(oe, sr=sr, hop_length=256) + t0
rms = librosa.feature.rms(y=y, hop_length=256)[0]; db = 20 * np.log10(rms + 1e-9)
# band energies: sub (<120), low-mid, high (>4k) to separate booms, body, whooshes/sparkle
P = np.abs(librosa.stft(y, n_fft=2048, hop_length=256)) ** 2; f = librosa.fft_frequencies(sr=sr, n_fft=2048)
band = lambda a, b: 10 * np.log10(P[(f >= a) & (f < b)].sum(0) + 1e-12)
fig, ax = plt.subplots(3, 1, figsize=(22, 11), sharex=True, gridspec_kw=dict(height_ratios=[3, 1.3, 1.3]))
librosa.display.specshow(S, sr=sr, hop_length=256, x_axis="time", y_axis="log", ax=ax[0], cmap="magma")
ax[0].set_xticks(np.arange(0, t1 - t0, 1 if t1 - t0 < 60 else 5))
tt = ot - t0
ax[1].plot(tt, db, lw=.7, label="RMS dB"); ax[1].plot(tt, band(20, 120) - 40, lw=.7, label="sub<120"); ax[1].plot(tt, band(4000, 20000) - 40, lw=.7, label="air>4k")
ax[1].legend(loc="upper left"); ax[2].plot(tt, oe, lw=.7, c="k"); ax[2].set_ylabel("onset")
for c in d["cuts"]:
    ct = c / d["fps"] - t0
    if 0 <= ct <= t1 - t0:
        for a in ax: a.axvline(ct, c="cyan", lw=.8, alpha=.8)
ax[2].set_xlabel(f"seconds from {t0}")
plt.tight_layout(); plt.savefig(out, dpi=70)
