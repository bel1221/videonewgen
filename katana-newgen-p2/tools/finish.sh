set -e; cd "$(dirname "$0")/.."; TOT=61.5
bash tools/build.sh
python3 tools/sfx2.py | tail -2
ffmpeg -v error -y -i audio/sfx_bed.wav -i audio/music.mp3 -i audio/vo/vo1.mp3 -i audio/vo/vo2.mp3 -i audio/vo/vo3.mp3 -i audio/vo/vo4.mp3 -i audio/vo/vo5.mp3 -filter_complex "[0:a]aresample=48000,apad=whole_dur=$TOT[sfx];[1:a]aresample=48000,atrim=0:$TOT,volume=0.55,afade=t=out:st=59.5:d=2[mus];[2:a]aresample=48000,adelay=1200|1200[v1];[3:a]aresample=48000,adelay=10300|10300[v2];[4:a]aresample=48000,adelay=27100|27100[v3];[5:a]aresample=48000,adelay=40400|40400[v4];[6:a]aresample=48000,adelay=48900|48900[v5];[v1][v2][v3][v4][v5]amix=inputs=5:normalize=0,apad=whole_dur=$TOT,volume=1.35[vo];[vo]asplit[vo1][vosc];[mus][vosc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];[duck][sfx][vo1]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9,aresample=48000,atrim=0:$TOT[a]" -map "[a]" -c:a aac -b:a 256k comp/audio.m4a
ffmpeg -v error -y -i comp/video.mp4 -i comp/audio.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest out/master.mp4
bash ../toolkit/deliver.sh out/master.mp4 out/newgen_part2_phat_trien_v3.mp4 | tail -c 120; echo
ffprobe -v error -show_entries format=duration,size:stream=nb_frames -of compact out/newgen_part2_phat_trien_v3.mp4
ffmpeg -v error -y -i out/newgen_part2_phat_trien_v3.mp4 -vf "fps=1/2,scale=320:180,tile=6x6" -frames:v 1 qa/sheet2.jpg
[ -f up.txt ] && curl -sf -o /dev/null -w 'PUT %{http_code}\n' -X PUT -H "Content-Type: video/mp4" --upload-file out/newgen_part2_phat_trien_v3.mp4 "$(cat /home/user/rr/katana-newgen-p2/plan/up_v3.txt)" || true
