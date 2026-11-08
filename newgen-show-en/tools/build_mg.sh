set -e; cd "$(dirname "$0")/.."; OUT=newgen_showcase_en_v2.mp4
N=2572; Q=$((N/8))
for i in 0 1 2 3 4 5 6 7; do a=$((i*Q)); b=$(( i==7 ? N : (i+1)*Q )); python3 tools/mg_scenes.py $a $b comp/mg$i.mp4 > logs/mg$i.log 2>&1 & done
wait
printf "file 'mg%d.mp4'\n" 0 1 2 3 4 5 6 7 > comp/mgparts.txt
ffmpeg -v error -y -f concat -safe 0 -i comp/mgparts.txt -c copy comp/mgvideo.mp4
ffmpeg -v error -y -i comp/mgvideo.mp4 -i comp/audio.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest out/master2.mp4
bash ../toolkit/deliver.sh out/master2.mp4 out/$OUT | tail -c 60; echo
ffprobe -v error -show_entries format=duration,size:stream=nb_frames -of compact out/$OUT
ffmpeg -v error -y -i out/$OUT -vf "fps=1/2,scale=320:180,tile=6x6" -frames:v 1 qa/sheet2.jpg
[ -f up.txt ] && curl -sf -o /dev/null -w 'PUT %{http_code}\n' -X PUT -H "Content-Type: video/mp4" --upload-file out/$OUT "$(cat up.txt)" || true
