"""Music suck-out for encounter v2: a low-pass sweep that closes the bed from 16 kHz to ~350 Hz between T_SUCK and
T_LAND (with a -5 dB dip), then snaps fully open on the landing, where sa.mp3's drop lands (notes §2c, MD 9.0-10.2 s).
    python tools/enc_music_v2.py comp/enc_music.wav comp/enc_music_v2.wav"""
import sys, subprocess, numpy as np
from scipy.signal import butter, sosfilt
sys.path.insert(0, 'tools')
import encounter_v2 as E
src, out = sys.argv[1:3]; SR = 48000
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
y = x.copy(); blk = 256; zi = np.zeros((2, 2, 2))  # 4th-order (2 sections) state per channel
a0, a1 = int(E.T_SUCK * SR), int(E.T_LAND * SR)
for s in range(a0, min(a1, len(x)), blk):
    u = (s - a0) / max(1, a1 - a0)
    fc = 16000 * (350 / 16000) ** (u ** 0.8)
    sos = butter(4, fc, 'low', fs=SR, output='sos')
    for ch in range(2):
        y[s:s + blk, ch], zi[ch] = sosfilt(sos, x[s:s + blk, ch], zi=zi[ch])
    y[s:s + blk] *= 10 ** (-5 * u / 20)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', out], input=y.astype(np.float32).tobytes(), check=True)
print('sweep', E.T_SUCK, '->', E.T_LAND)
