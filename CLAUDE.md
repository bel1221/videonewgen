# NewGenMC promo videos

Marketing videos for **NewGenMC** (newgenmc.net), a Vietnamese Minecraft server (Battle Royale + Competitive Duels,
legendary weapons, ranked MR leaderboard with a top-10 "Champion" tier). Audience: Vietnamese Minecraft players.
Full history, scripts, prompts and every past decision: `HANDOFF.md`. Read the relevant section before changing a video.

## House rules (the user's feedback; these override any skill's defaults)

**Visual**
- Clean motion graphics / semi-typography. Pixel-cartoon only for the "money" video.
- Don't overuse any single effect (neon lines, laser sweeps). Light/ray effects never cover text.
- **No still frames**: every scene drifts (camera push + horizontal drift), backgrounds move, transitions overlap.
- **No grey text.** White text, key words in GREEN (112,222,132) or ORANGE (255,164,104), soft drop shadow.
- **Length: default to 50 s or less** (keeps viewers engaged). Go longer only when the user asks for a longer video.
  Budget the script before writing VO: Thắm at 1.2× speaks ~4.23 words/s (measured), so ~160–180 words of VO fits
  with gaps and a ~2.6 s outro.
- Fast pacing comes from faster animations, tighter gaps, VO at 1.2x (`atempo=1.2`), never from speeding up the file.
- Use the user's own Minecraft assets (sprites, `.bbmodel` renders, screenshots). Never hand-draw imitations.
- Weapon spins: 144 angles per turn with neighbour blending.
- HUD on every frame: "NEWGENMC" top-left, "newgenmc.net" top-right, chapter "NN — NAME" bottom-left, progress bar bottom-right.
- Blur competitor server names/logos; crop out any "kingmc.vn" scoreboard.
- Fonts: Montserrat ExtraBold (headlines), Inter variable (body/kickers) - both in `toolkit/fonts/`.

**Audio**
- Never `riser/rs50__synth_misc_16.ogg`, never explosions or anything in `boom/`.
- No SFX file more than twice per video.
- Music (`sa.mp3`) at loudnorm I=-26, sidechain-ducked under VO; master loudnorm I=-14.

**Voice (ElevenLabs)**
- Vietnamese: "Thắm - Giọng Nữ Miền Bắc", voice_id `0ggMuQ1r9f9jqBu50nJn`, model `eleven_v4`.
- English terms must sound English: write SMP as "ét em pi", MR as "em a", 2vs2 as "2 versus 2". "Pay To Win" stays as-is.
- Script voice: first person "mình", viewers "các bạn"/"bạn", rhetorical-question hook, English game terms kept in English, casual CTA ("...nhá!").
- Generating voice costs the user's ElevenLabs credits (~100-215 per line for 2 takes). Say so before generating.

**Content facts**
- Duels/Ranked have existed for a long time: never present them as new ("đã chính thức có mặt").
- Ranked 2vs2: "mỗi team sẽ nhận được một vũ khí huyền thoại ngẫu nhiên". Champion = top 10 on the ranked leaderboard;
  reward = an exclusive armor trim obtainable no other way.
- Placeholders still in Ranked v4: the MR numbers (1,350→1,450, +25) and the chestplate trim design. Ask before reusing.
- Part 3 "Hoàn thiện" is on hold until the user brings it up.

**Before every delivery check**: no SFX >2 uses, no banned sounds, no grey text, no still frames, no overused effect,
competitors blurred, no "kingmc.vn". Render QA stills and look at them.

## Saving work (the user asked for this - do it every time)

The cloud container is wiped when a session ends; only what is pushed to GitHub survives.
- After every finished project or delivered version (e.g. a new video version, a new asset, script changes), and before
  the user signs off, **remind the user to save and offer to push** in the reply's last line, e.g.
  "💾 Reminder: this isn't saved to GitHub yet. Say 'push' and I'll save it."
- When they say yes/push/save: commit and push to `origin main`, then confirm it landed (`git status -sb` shows no ahead count).
- If the work is already pushed, say so instead ("💾 Saved to GitHub.").
- Finished MP4s stay out of git (`renders/` is gitignored); make sure each delivered render is on Higgsfield and its media_id is
  written into HANDOFF.md or a notes file, so it can be re-downloaded.

## Current work (update this when it changes)

- **Ban-system video** (`newgen-ban/`): script v3 in `SCRIPT.md` (real numbers, ~45 s). Encounter animation v1 done
  (`tools/encounter.py`, `bash tools/build_encounter.sh`, output `out/newgen_ban_encounter_v1.mp4`): player vs kill-aura
  hacker, admin drops in, /ban, Minecraft death, BANNED stamp. Waiting on the user's feedback, real skins
  (64x64 PNGs -> `newgen-ban/src/skins/{player,hacker,admin}.png`), admin name, and whether staff review every report.
- **Reference study:** done 2026-11-09 on the user's Windows PC (videos in `Desktop\mcrefs`, not in git). Findings and a
  proposed encounter v2 shot list in `notes/animation-study.md`; scripts in `toolkit/refstudy/`. earshot was not
  installed locally (blocked), so the audio notes use librosa/spectrograms.
- **Encounter v2** built from the study: `tools/encounter_v2.py` (14 shots + 2 impact inserts + flash, anticipation/
  knockback/trails/idle/face swaps, coloured key/fill/rim/point lighting via `MC.Scene.light`, haze, embers, bloom,
  grade), `enc_sfx_v2.py`, `enc_music_v2.py` (low-pass suck-out into the landing), `bash tools/build_encounter_v2.sh`
  (Windows: `PY=python`) -> `out/newgen_ban_encounter_v2.mp4` (10.5 s). Waiting on the user's feedback; skins/admin name still open.
- **3D animation test** (`anim-test/`, see its README): three.js voxel world + jointed skin rig (elbows/knees/waist/wrist)
  with the user's 3 skins, run + sword fight, golden-hour lighting, rendered in headless Chrome ->
  `anim-test/out/newgen_anim_test_v2.mp4` (9.5 s; v2 = weapon grips reworked from the references, per-pose wrist). EXPERIMENTAL: user says "not quite there but getting better"; keep iterating on weapon handling/animation feel next session.
- **Fight test** (`anim-test/fight/`, experimental): 20 s sword fight in the user's colosseum (three.js + `web/rig2.js` bendy rig with
  6-bone spine, leg IK, footstep planner, run gait, blade intent/physics). Latest: `anim-test/out/newgen_fight_test_v4.mp4`
  (render: `PAGE=anim-test/fight/index.html QS="?sub=5" node render.mjs frames 0 600 ...`, sound: `python fight/fight_sfx3.py` after
  exporting `window.events()`). User says "getting better, still things to fix". Open: 4 flurry clashes miss (10.5-14 s), trailing
  leg straightens during clash lunges, sound not ear-checked. Minecraft sounds come from `~/.lunarclient/shared/assets` (index 29).
- Ranked 2vs2 v4 still awaiting feedback (MR numbers and armor trim are placeholders).

## Layout

| Path | What |
|---|---|
| `newgen-ranked/` | Ranked 2vs2 video (active). `tools/rk_scenes.py` = scenes, `tools/mg.py` = engine, `tools/timing.py` = VO timing |
| `newgen-show/`, `newgen-show-en/` | Showcase video, Vietnamese v6 / English v2 (same engine) |
| `katana-newgen-p2/tools/` | Part 2 "Phát triển" renderer (neon-laser style) |
| `assets/models/*.bbmodel` | The 49-group legendary weapon model (44 unique weapons; dupes listed in `bbtool/render.py`) |
| `assets/` | Original-quality background, green screens, weapon spin sheets, `lib_all.png` |
| `bbtool/` | Software renderer for the `.bbmodel`: stills (`render.py`), 144-angle spin sheets (`spin_hd.py`), all-weapon sheet (`lib.py`) |
| `toolkit/` | Fonts, CC0 SFX library (`sfx_lib/`, Kenney etc.), `deliver.sh` final encode, `install_runtimes.sh` |
| `renders/` (gitignored) | Finished MP4s; re-download from Higgsfield: `https://d2ol7oe51mr4n9.cloudfront.net/user_3LhMjPy4UCr199g26ggXbTuJE9o/<media_id>.mp4` (ids in HANDOFF.md) |

## Rendering the house-style videos (Python engine)

Run from the project folder (e.g. `cd newgen-ranked`). Caches are gitignored; rebuild once per session:
```bash
mkdir -p comp logs qa && python3 tools/prep_gs.py   # + spin144.npy snippet in HANDOFF.md §9.4
python3 tools/rk_sfx.py && bash tools/mix.sh          # SFX bed + audio mix
python3 tools/rk_scenes.py still 10.5,22,33.5         # QA stills -> qa/
bash tools/build.sh                                   # full render (8 workers; ~2 min for 52 s here)
```
Verified in this environment: rebuilt SFX bed and frames match the delivered v4 exactly.
Weapon renders: `cd bbtool && ONLY=17,34 python3 -I render.py ../assets/models/newgenmc_vu_khi_huyen_thoai.bbmodel OUTDIR`
(indices are outliner positions). Word timings for new VO: faster-whisper `small`, `language='vi'`, `word_timestamps=True`.

## Skills and helpers (`.claude/`)

Installed from the user's chosen repos, pinned to reviewed commits (see `.claude/SOURCES.md`). Use them as craft and QA
helpers; the house rules above still win, and the house style is built with the Python engine above.
- `video-director`: plan/QA discipline for code-made videos (`scripts/check_timeline.py`, `scripts/qa_video.py`).
- `earshot` / `real-sound`: listen to audio before judging it; SFX choice, sync and mix checks.
- `rossark-motion-skill`: keeping things alive (idle motion, no teleporting) for characters/mascots/scenes.
- `huashu-motion`, `take-one`, `explainroo`: whole-film pipelines (HTML/Chrome based) for new formats, e.g. explainers or
  a different look. explainroo's built-in TTS has no Vietnamese voice; use ElevenLabs for Vietnamese.
- `reanimate`: rebuild a motion from a reference video or website frame by frame.
- Subagents in `.claude/agents/`: short-video editing coach, video optimization, TikTok, social media, content creator,
  paid-media creative, visual storyteller, game audio engineer.
- Prompt/case library (reference only): `~/.opus-video-prompts`.

## Environment

Cloud environment `videonewgen` installs everything at session start (`toolkit/install_runtimes.sh`) and allows
Higgsfield's CDN and Hugging Face (earshot/explainroo models). Higgsfield and ElevenLabs are connected as MCP tools.
Node's built-in fetch ignores the proxy: run Node tools that download (explainroo, huashu-motion, take-one) with
`NODE_USE_ENV_PROXY=1`. Commit work and push to `origin main`; the container is temporary.
