set -e; cd "$(dirname "$0")/.."
N=1845; Q=$((N/6))
for i in 0 1 2 3 4 5; do a=$((i*Q)); b=$(( i==5 ? N : (i+1)*Q )); python3 tools/ngp2.py $a $b comp/part$i.mp4 > logs/part$i.log 2>&1 & done
wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\nfile 'part4.mp4'\nfile 'part5.mp4'\n" > comp/parts.txt
ffmpeg -v error -y -f concat -safe 0 -i comp/parts.txt -c copy comp/video.mp4
echo DONE
