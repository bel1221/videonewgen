set -e; cd /home/user/rr/newgen-ranked; TOT=51.77
ffmpeg -v error -y -ss 101.39 -t $TOT -i audio/sa.mp3 -af "loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.8,afade=t=out:st=49.27:d=2.7" -ar 48000 -ac 2 comp/music_cut.wav
python3 - <<'PY'
import subprocess, numpy as np
SR=48000; TOT=51.77; D=[(1,0.35),(2,8.08),(3,13.67),(4,26.25),(5,31.96),(6,35.33),(8,43.34)]
bed=np.zeros((int(TOT*SR),2),np.float32)
for k,d in D:
    x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f'audio/vo/vof{k}.mp3','-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).reshape(-1,2)
    s=int(d*SR); e=min(len(bed),s+len(x)); bed[s:e]+=x[:e-s]
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','comp/vo_track.wav'],input=bed.tobytes(),check=True)
PY
ffmpeg -v error -y -i audio/sfx_bed.wav -i comp/music_cut.wav -i comp/vo_track.wav -filter_complex "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[sfx];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[mus];[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.2[vo];[vo]asplit[vo1][vosc];[mus][vosc]sidechaincompress=threshold=0.04:ratio=3:attack=30:release=500[duck];[duck][sfx][vo1]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9,aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:$TOT[a]" -map "[a]" -c:a aac -b:a 256k comp/audio.m4a
