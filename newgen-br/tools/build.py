# Full build of the Battle Royale video. Run from newgen-br with ffmpeg on PATH:
#   python -X utf8 tools/build.py [audio|video|all] [version]
# audio: SFX bed + music cut + VO track + mix -> comp/audio.m4a.  video: 8 workers -> comp/mgvideo.mp4 -> out/newgen_battle_royale_<version>.mp4
import sys, subprocess, importlib.util
import numpy as np
what = sys.argv[1] if len(sys.argv) > 1 else 'all'; VER = sys.argv[2] if len(sys.argv) > 2 else 'v1'
PY = [sys.executable, '-X', 'utf8']
T = {}; exec(open('tools/timing.py').read(), T)
TOT = round(T['T_END'] + 2.6, 2); FPS = 30; N = int(round(TOT * FPS))
def ff(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y'] + list(a), check=True)
if what in ('audio', 'all'):
    subprocess.run(PY + ['tools/br_sfx.py'], check=True)
    # the music's drop (135.5 s into sa.mp3) lands on "TRẬN CHIẾN BẮT ĐẦU"
    ss = 135.5 - (T['T_TRAN'] - 0.25)
    ff('-ss', f'{ss:.2f}', '-t', str(TOT), '-i', 'audio/sa.mp3', '-af', f'loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.8,afade=t=out:st={TOT - 2.7:.2f}:d=2.7', '-ar', '48000', '-ac', '2', 'comp/music_cut.wav')
    SR = 48000; bed = np.zeros((int(TOT * SR), 2), np.float32)
    for k, d in T['EV'].items():
        x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f'audio/vo/vof{k}.mp3', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2)
        s = int(d * SR); e = min(len(bed), s + len(x)); bed[s:e] += x[:e - s]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'comp/vo_track.wav'], input=bed.tobytes(), check=True)
    fc = (f"[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur={TOT}[sfx];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur={TOT}[mus];"
          f"[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.2[vo];[vo]asplit[vo1][vosc];[mus][vosc]sidechaincompress=threshold=0.04:ratio=3:attack=30:release=500[duck];"
          f"[duck][sfx][vo1]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9,aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{TOT}[a]")
    ff('-i', 'audio/sfx_bed.wav', '-i', 'comp/music_cut.wav', '-i', 'comp/vo_track.wav', '-filter_complex', fc, '-map', '[a]', '-c:a', 'aac', '-b:a', '256k', 'comp/audio.m4a')
    print('audio ok', TOT)
if what in ('video', 'all'):
    W = 8; Q = N // W; ps = []
    for i in range(W):
        a = i * Q; b = N if i == W - 1 else (i + 1) * Q
        ps.append(subprocess.Popen(PY + ['tools/br_scenes.py', str(a), str(b), f'comp/mg{i}.mp4'], stdout=open(f'logs/mg{i}.log', 'w'), stderr=subprocess.STDOUT))
    assert all(p.wait() == 0 for p in ps), 'a render worker failed, see logs/'
    open('comp/mgparts.txt', 'w').write(''.join(f"file 'mg{i}.mp4'\n" for i in range(W)))
    ff('-f', 'concat', '-safe', '0', '-i', 'comp/mgparts.txt', '-c', 'copy', 'comp/mgvideo.mp4')
    out = f'out/newgen_battle_royale_{VER}.mp4'
    ff('-i', 'comp/mgvideo.mp4', '-i', 'comp/audio.m4a', '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', '-shortest', out)
    ff('-i', out, '-vf', 'fps=1/2,scale=320:180,tile=6x4', '-frames:v', '1', 'qa/sheet.jpg')
    print(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,nb_frames', '-of', 'compact', out], capture_output=True, text=True).stdout)
