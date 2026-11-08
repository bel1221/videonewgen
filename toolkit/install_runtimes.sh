#!/bin/bash
# Installs the command-line runtimes behind the project skills in .claude/skills.
# Idempotent; safe to run every session. Each repo is pinned to the commit that was reviewed.
# Usage: bash toolkit/install_runtimes.sh
set -u
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"
ok(){ echo "[ok]   $1"; }; bad(){ echo "[FAIL] $1"; }

pin_clone(){ # repo dir sha
  if [ ! -d "$2/.git" ]; then git clone -q https://github.com/$1 "$2" || return 1; fi
  git -C "$2" fetch -q --depth 1 origin "$3" 2>/dev/null; git -C "$2" checkout -q "$3"
}

# Python helpers used by the newgen-* tools (word timings)
python3 -c "import faster_whisper" 2>/dev/null || pip install -q faster-whisper
python3 -c "import faster_whisper" 2>/dev/null && ok faster-whisper || bad faster-whisper

# explainroo (explainer videos with local TTS)
if pin_clone vincentsch/explainroo "$HOME/.explainroo" e95232c8d535ed2aa390e7b1caee0d1326dd9e83; then
  (cd "$HOME/.explainroo" && npm install --no-audit --no-fund --silent && NODE_USE_ENV_PROXY=1 node bin/explainroo.js doctor --fetch >/dev/null 2>&1; true) && ok explainroo || bad "explainroo npm install"
else bad "explainroo clone"; fi

# huashu-motion CLI (the skill's bin/om falls back to the global 'huashu-motion' command)
if pin_clone alchaincyf/huashu-motion "$HOME/.huashu-motion" 52467f99c602b76ba86d511d37acdfe93fa1e16e; then
  npm install -g --silent "$HOME/.huashu-motion" && ok huashu-motion || bad "huashu-motion npm -g"
else bad "huashu-motion clone"; fi

# earshot (audio analysis + SFX bank), CPU torch
if pin_clone Leonxlnx/earshot "$HOME/.earshot" 4ac3d2ac2b151e1c23376f9ce7f3047a17050013; then
  python3 -c "import torch" 2>/dev/null || pip install -q torch --index-url https://download.pytorch.org/whl/cpu
  pip install -q -e "$HOME/.earshot[mcp]" && ok earshot || bad "earshot pip install"
else bad "earshot clone"; fi

# Bun (reanimate's scripts run with bun)
command -v bun >/dev/null || npm install -g --silent bun
command -v bun >/dev/null && ok "bun $(bun --version)" || bad bun

# take-one needs playwright-core next to its scripts
TO="$(cd "$(dirname "$0")/.." && pwd)/.claude/skills/take-one"
[ -d "$TO/node_modules/playwright-core" ] || (cd "$TO" && npm install --no-audit --no-fund --silent --no-save playwright-core)
[ -d "$TO/node_modules/playwright-core" ] && ok "take-one deps" || bad "take-one deps"

# opus-video-prompts: reference library of published code-video prompts and cases (no license file, so kept outside the repo)
pin_clone joeseesun/opus-video-prompts "$HOME/.opus-video-prompts" 7977c807781d4ba7c235247b8899a72575a30d00 && ok "opus-video-prompts (~/.opus-video-prompts)" || bad "opus-video-prompts clone"
