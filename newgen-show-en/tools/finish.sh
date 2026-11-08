set -e; cd /home/user/rr/newgen-show; TOT=71.5; OUT=newgen_showcase_v1.mp4
N=2145; Q=$((N/8))
for i in 0 1 2 3 4 5 6 7; do a=$((i*Q)); b=$(( i==7 ? N : (i+1)*Q )); python3 tools/show.py $a $b comp/part$i.mp4 > logs/part$i.log 2>&1 & done
wait
printf "file 'part%d.mp4'\n" 0 1 2 3 4 5 6 7 > comp/parts.txt
ffmpeg -v error -y -f concat -safe 0 -i comp/parts.txt -c copy comp/video.mp4
ffmpeg -v error -y -ss 129.2 -t $TOT -i audio/sa.mp3 -af "loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.6,afade=t=out:st=69.0:d=2.5" -ar 48000 -ac 2 comp/music_cut.wav
D=(0 600 6400 9200 17400 28800 36900 47900 60000)
IN=""; F=""; for i in 1 2 3 4 5 6 7 8; do IN="$IN -i audio/vo/vo$i.mp3"; F="$F[$((i+1)):a]aresample=48000,aformat=channel_layouts=stereo,adelay=${D[$i]}|${D[$i]}[v$i];"; done
ffmpeg -v error -y -i audio/sfx_bed.wav -i comp/music_cut.wav $IN -filter_complex "[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=$TOT[sfx];[1:a]aformat=channel_layouts=stereo,apad=whole_dur=$TOT[mus];$F[v1][v2][v3][v4][v5][v6][v7][v8]amix=inputs=8:normalize=0,apad=whole_dur=$TOT,volume=1.2[vo];[vo]asplit[vo1][vosc];[mus][vosc]sidechaincompress=threshold=0.04:ratio=3:attack=30:release=500[duck];[duck][sfx][vo1]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9,aresample=48000,atrim=0:$TOT[a]" -map "[a]" -c:a aac -b:a 256k comp/audio.m4a
ffmpeg -v error -y -i comp/video.mp4 -i comp/audio.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest out/master.mp4
python3 $HF_WORKFLOWS/katana/scripts/deliver.py out/master.mp4 out/$OUT | tail -c 80; echo
ffprobe -v error -show_entries format=duration,size:stream=nb_frames -of compact out/$OUT
ffmpeg -v error -y -i out/$OUT -vf "fps=1/2,scale=320:180,tile=6x6" -frames:v 1 qa/sheet.jpg
python3 - <<'PY'
import subprocess, numpy as np
def rms(f, a, b):
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-ss',str(a),'-t',str(b-a),'-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,np.float32)
    return 20*np.log10(np.sqrt((x**2).mean())+1e-9)
print('music-only window (0-0.5s) dB', round(rms('out/newgen_showcase_v1.mp4',65.9,66.5),1), ' voice window (20-24s) dB', round(rms('out/newgen_showcase_v1.mp4',20,24),1))
PY
curl -sf -o /dev/null -w 'PUT %{http_code}\n' -X PUT -H "Content-Type: video/mp4" --upload-file out/$OUT "$(cat up.txt)"
