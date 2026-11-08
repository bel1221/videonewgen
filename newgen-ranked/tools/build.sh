set -e; cd /home/user/rr/newgen-ranked; OUT=newgen_ranked_2v2_v4.mp4
N=1553; Q=$((N/8))
for i in 0 1 2 3 4 5 6 7; do a=$((i*Q)); b=$(( i==7 ? N : (i+1)*Q )); python3 tools/rk_scenes.py $a $b comp/mg$i.mp4 > logs/mg$i.log 2>&1 & done
wait
printf "file 'mg%d.mp4'\n" 0 1 2 3 4 5 6 7 > comp/mgparts.txt
ffmpeg -v error -y -f concat -safe 0 -i comp/mgparts.txt -c copy comp/mgvideo.mp4
ffmpeg -v error -y -i comp/mgvideo.mp4 -i comp/audio.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest out/master.mp4
python3 $HF_WORKFLOWS/katana/scripts/deliver.py out/master.mp4 out/$OUT | tail -c 60; echo
ffprobe -v error -show_entries format=duration,size:stream=nb_frames -of compact out/$OUT
ffmpeg -v error -y -i out/$OUT -vf "fps=1/2,scale=320:180,tile=6x6" -frames:v 1 qa/sheet.jpg
curl -sf -o /dev/null -w 'PUT %{http_code}\n' -X PUT -H "Content-Type: video/mp4" --upload-file out/$OUT "$(cat up.txt)"
