#!/bin/bash
# Renders the encounter clip -> out/newgen_ban_encounter_vN.mp4 (preview: SFX + music, no voice-over yet)
set -e; cd "$(dirname "$0")/.."; OUT=${1:-newgen_ban_encounter_v1.mp4}; WORKERS=${WORKERS:-4}
mkdir -p comp logs qa out
TOT=$(python3 -c "import sys; sys.path.insert(0,'tools'); import encounter as E; print(E.TOTAL)")
LAND=$(python3 -c "import sys; sys.path.insert(0,'tools'); import encounter as E; print(E.T_LAND)")
N=$(python3 -c "print(round($TOT*30))"); Q=$((N / WORKERS))
python3 tools/enc_sfx.py
# music: the drop of sa.mp3 (~135.5 s) lands on the admin's landing
SS=$(python3 -c "print(round(135.5-$LAND,2))")
ffmpeg -v error -y -ss $SS -t $TOT -i ../newgen-ranked/audio/sa.mp3 -af "loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.5,afade=t=out:st=$(python3 -c "print($TOT-1.0)"):d=1.0" -ar 48000 -ac 2 comp/enc_music.wav
ffmpeg -v error -y -i audio/enc_sfx.wav -i comp/enc_music.wav -filter_complex "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[s];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[m];[s][m]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.2:LRA=9,aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:$TOT[a]" -map "[a]" -c:a aac -b:a 256k comp/enc_audio.m4a
for i in $(seq 0 $((WORKERS - 1))); do a=$((i * Q)); b=$(( i == WORKERS - 1 ? N : (i + 1) * Q )); python3 tools/encounter.py $a $b comp/enc$i.mp4 > logs/enc$i.log 2>&1 & done
wait
for i in $(seq 0 $((WORKERS - 1))); do echo "file 'enc$i.mp4'"; done > comp/encparts.txt
ffmpeg -v error -y -f concat -safe 0 -i comp/encparts.txt -c copy comp/enc_video.mp4
ffmpeg -v error -y -i comp/enc_video.mp4 -i comp/enc_audio.m4a -map 0:v -map 1:a -c copy -shortest comp/enc_master.mp4
bash ../toolkit/deliver.sh comp/enc_master.mp4 out/$OUT
ffmpeg -v error -y -i out/$OUT -vf "fps=2,scale=320:180,tile=5x4" -frames:v 1 qa/enc_sheet.jpg
