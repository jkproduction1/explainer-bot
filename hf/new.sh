#!/usr/bin/env bash
# hf/new.sh <name>  -> scratch project hf/work/<name> with kit assets, voice (from the `videos` branch) and music
# OFFLINE=1 hf/new.sh <name>  -> no ElevenLabs: silent voice with estimated word timings from hf/videos/<name>/script.txt (layout tests)
set -euo pipefail
N=$1; H=$(cd "$(dirname "$0")" && pwd); W=$H/work/$N
mkdir -p $W/assets $W/renders
cp $H/template/* $W/ && cp $H/assets/* $W/assets/ && cp $H/kit/kit.js $W/assets/
if [ "${OFFLINE:-0}" = "1" ]; then
  (cd $H/.. && TTS_OFFLINE=1 python3 -c "
import json,sys;from pathlib import Path;from bot import tts
w=tts.synthesize(Path('hf/videos/$N/script.txt').read_text(),Path('$W/assets/voice.mp3'));Path('$W/assets/voice.json').write_text(json.dumps(w))")
else
  git -C $H/.. fetch -q origin +videos:refs/remotes/origin/videos
  git -C $H/.. show origin/videos:voice-samples/$N.mp3 > $W/assets/voice.mp3
  git -C $H/.. show origin/videos:voice-samples/$N.json > $W/assets/voice.json
fi
TR=${MUSIC:-t2}; START=$(python3 -c "import json;print(json.load(open('$H/../music/tracks.json'))['$TR']['hook_start'])")
ffmpeg -v error -y -ss $START -i $H/../music/$TR.mp3 -t 60 -af "afade=t=in:d=0.5" $W/assets/music.mp3
echo "ready: $W"
