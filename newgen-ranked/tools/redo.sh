set -e; cd "$(dirname "$0")/.."
python3 tools/sfx.py | tail -2
bash tools/mix_audio.sh
bash tools/build_mg.sh
