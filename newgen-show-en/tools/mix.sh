set -e; cd /home/user/rr/newgen-show; TOT=71.5; OUT=newgen_showcase_v1.mp4
ffmpeg -v error -y -ss 129.2 -t $TOT -i audio/sa.mp3 -af "loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.6,afade=t=out:st=69.0:d=2.5" -ar 48000 -ac 2 comp/music_cut.wav
python3 - <<'PY'
import subprocess, numpy as np
SR=48000; TOT=71.5; D=[0.6,6.4,9.2,17.4,28.8,36.9,47.9,60.0]
bed=np.zeros((int(TOT*SR),2),np.float32)
for i,d in enumerate(D):
    x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f'audio/vo/vo{i+1}.mp3','-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).reshape(-1,2)
    s=int(d*SR); e=min(len(bed),s+len(x)); bed[s:e]+=x[:e-s]
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','comp/vo_track.wav'],input=bed.tobytes(),check=True)
PY
ffmpeg -v error -y -i audio/sfx_bed.wav -i comp/music_cut.wav -i comp/vo_track.wav -filter_complex "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[sfx];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[mus];[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.2[vo];[vo]asplit[vo1][vosc];[mus][vosc]sidechaincompress=threshold=0.04:ratio=3:attack=30:release=500[duck];[duck][sfx][vo1]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9,aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:$TOT[a]" -map "[a]" -c:a aac -b:a 256k comp/audio.m4a
ffmpeg -v error -y -i comp/video.mp4 -i comp/audio.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest out/master.mp4
python3 $HF_WORKFLOWS/katana/scripts/deliver.py out/master.mp4 out/$OUT | tail -c 80; echo
ffprobe -v error -show_entries format=duration,size:stream=nb_frames -of compact out/$OUT
ffmpeg -v error -y -i out/$OUT -vf "fps=1/2,scale=320:180,tile=6x6" -frames:v 1 qa/sheet.jpg
python3 - <<'PY'
import subprocess, numpy as np
def rms(f, a, b):
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-ss',str(a),'-t',str(b-a),'-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,np.float32)
    return 20*np.log10(np.sqrt((x**2).mean())+1e-9)
print('music-only (66-67s) dB', round(rms('out/newgen_showcase_v1.mp4',66,67),1), '| voice+music (20-24s) dB', round(rms('out/newgen_showcase_v1.mp4',20,24),1), '| music stem under voice', round(rms('comp/music_cut.wav',20,24),1), 'vs vo stem', round(rms('comp/vo_track.wav',20,24),1))
PY
curl -sf -o /dev/null -w 'PUT %{http_code}\n' -X PUT -H "Content-Type: video/mp4" --upload-file out/$OUT "$(cat up.txt)"
