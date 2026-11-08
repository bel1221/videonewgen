#!/bin/bash
# Final encode (stand-in for Higgsfield's deliver.py): H.264 CRF 18, yuv420p, faststart, audio copied.
# Usage: bash ../toolkit/deliver.sh MASTER.mp4 OUT.mp4
set -e
ffmpeg -v error -y -i "$1" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a copy -movflags +faststart "$2"
ffprobe -v error -show_entries format=duration,size -of compact "$2"
