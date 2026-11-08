#!/bin/bash
# Renders encounter v2 -> out/newgen_ban_encounter_v2.mp4 (preview: SFX + music with the low-pass suck-out, no voice-over yet)
# PY overrides the interpreter (Windows: PY=python).
set -e; cd "$(dirname "$0")/.."; OUT=${1:-newgen_ban_encounter_v2.mp4}; WORKERS=${WORKERS:-6}; PY=${PY:-python3}
mkdir -p comp logs qa out
TOT=$($PY -c "import sys; sys.path.insert(0,'tools'); import encounter_v2 as E; print(E.TOTAL)")
LAND=$($PY -c "import sys; sys.path.insert(0,'tools'); import encounter_v2 as E; print(E.T_LAND)")
N=$($PY -c "print(round($TOT*30))"); Q=$((N / WORKERS))
$PY tools/enc_sfx_v2.py
# music: the drop of sa.mp3 (~135.5 s) lands on the admin's landing; low-pass sweep closes into it
SS=$($PY -c "print(round(135.5-$LAND,2))")
ffmpeg -v error -y -ss $SS -t $TOT -i ../newgen-ranked/audio/sa.mp3 -af "loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.5,afade=t=out:st=$($PY -c "print($TOT-1.0)"):d=1.0" -ar 48000 -ac 2 comp/enc_music.wav
$PY tools/enc_music_v2.py comp/enc_music.wav comp/enc_music_v2.wav
ffmpeg -v error -y -i audio/enc_sfx_v2.wav -i comp/enc_music_v2.wav -filter_complex "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[s];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[m];[s][m]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.2:LRA=9,aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:$TOT[a]" -map "[a]" -c:a aac -b:a 256k comp/enc2_audio.m4a
for i in $(seq 0 $((WORKERS - 1))); do a=$((i * Q)); b=$(( i == WORKERS - 1 ? N : (i + 1) * Q )); $PY tools/encounter_v2.py $a $b comp/enc2_$i.mp4 > logs/enc2_$i.log 2>&1 & done
wait
for i in $(seq 0 $((WORKERS - 1))); do echo "file 'enc2_$i.mp4'"; done > comp/enc2parts.txt
ffmpeg -v error -y -f concat -safe 0 -i comp/enc2parts.txt -c copy comp/enc2_video.mp4
ffmpeg -v error -y -i comp/enc2_video.mp4 -i comp/enc2_audio.m4a -map 0:v -map 1:a -c copy -shortest comp/enc2_master.mp4
bash ../toolkit/deliver.sh comp/enc2_master.mp4 out/$OUT
ffmpeg -v error -y -i out/$OUT -vf "fps=3,scale=320:180,tile=6x6" -frames:v 1 qa/enc2_sheet.jpg
