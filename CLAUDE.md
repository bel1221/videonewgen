# NewGenMC promo videos

# ⚠️ MOST IMPORTANT: the fight animation standard (permanent, from the user)

**Before ANY fight, duel or combat animation work, read `notes/fight-animation-standard.md` in full.** It holds the user's own
prompt, word for word, plus the QA checklist. Check every item and measure it before showing a render. It overrides
every other note, skill default and older decision. v8 (`anim-test/fight_v8`) is the reference for good combat scenes.

The core of it:
- **Fast but clear:** no frame jumps or snapping, fewer half-second camera changes, readable transitions between actions.
- **Movement-based combat:** sliding, dodging, blocking, parrying, jump plunges, stabbing, strafing, running, being
  pushed back. Exchanges travel; never fight on the spot.
- **Physics must make sense:** no phasing or collisions, no foot sliding, floating or gliding, no legs through the floor,
  no bouncing, shaking or bad stance repeating through the video.
- **Body:** shoulders, torso, hips and legs work together. Proper elbow and wrist articulation, weight and balance, momentum.
- **Weapon:** follows the arm with a correct grip, anticipation, controlled acceleration, a believable arc, follow-through
  and recovery.
- **Hit reactions:** direction, knockback and recovery. Secondary motion: head, torso and follow-through.
- **Polish:** close-ups and dramatic angles are good. Twirls and bow spins are a fine touch, once or twice per video.
- **Criticism only:** when the user is only criticising ("DO NOT MAKE A NEW VIDEO"), record and diagnose. Don't render.


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
- **Fight v5** (`anim-test/fight_v5/`, positive improvement, user-approved): v4 + zero-phase smoothing of the key curves and
  the final pose; joint pops 515 -> 53 in isolated A/B tests. B/C regressed (effects/ghosting, not skeleton). A/B harness:
  `anim-test/tools/ab_harness.py` (`?iso=1`, `?novfx=1`), `tools/ab_metrics.js`; report in `notes/animation-study.md` section 9.
  Rule from the user: no new full cinematic render until isolated tests show a measurable improvement. Next: re-tune the
  clash solver (4.2 s clash misses), add follow-through/weight.
- **Blender route (next):** user wants their real map in Blender and will test locally with their GPU. Plan: world
  `region/*.mca` -> mesh (amulet-core or Mineways/jmc2obj) -> Blender + MCprep rig/materials. Cloud CPU benchmark
  (bpy 5.2.3 via pip, 4 cores): Cycles 1080p 48 spp + denoise = 74 s/frame on a simple voxel scene; EEVEE did not run headless here.
- **FIGHT BASELINE = v6** (`anim-test/fight_v6/`, `out/newgen_fight_test_v6.mp4`; user, 2026-11-10): "not well done
  but smooth, and has the core fighting mechanics mapped out good."
  - **What v6 is:** v4's choreography and mechanics (fast, real blocks and clashes, clean movement) plus v5 smoothing,
    continuous blade collision, a blade-flip limiter and a 2-pass clash solver (notes §14).
  - **How to work on it:** every new fight version starts from v6 and keeps its mechanics, pacing, effects and v4 sound
    design (`fight/fight_sfx3.py`). Polish it; don't re-choreograph from scratch.
  - **Known gaps:** flurry clashes at 11.35, 13.56 and 13.96 s miss by 1.2-1.5 blocks and need those swings re-keyed;
    blades flip where a swing passes through a body (9.9, 14.6 s).
  - **Rejected:** the studio-engine fights (duel30 v1/v2) were slow and childish, with gliding legs.
  - **Before publishing:** `fight_sfx3.py` uses `desert_*` clips cut from other creators' videos; replace them.
- **Fight v7 "movement duel"** (`anim-test/fight_v7/`, built from v6 by `fight_v7/parts/assemble.py`; edit the parts, then
  re-run it from `anim-test/`): new movement-led choreography (running cross, slide under a leap, kick/roll, zig-zag
  dash, circling flurry, drifting bind, mid-air cross at 17.3 s), wider limb swings, Minecraft grip offset (`?grip=1.6`),
  near-noon overhead sun. **User likes the overhead sun lighting up the sand: keep it for v7** (final verdict pending).
  Render: `PAGE=anim-test/fight_v7/index.html QS="?sub=5" node render.mjs frames 0 600 out/newgen_fight_test_v7_video.mp4`;
  events: `node render.mjs eval "window.events()" > fight_v7/comp/events.json`; sound: `SCENE=v7 python fight/fight_sfx3.py`
  (-> `fight_v7/comp/fight_audio.m4a`). Metrics vs v6 and open issues: notes §15.
- **Fight v8 "blade masters"** (`anim-test/fight_v8/`, 30 s, NEW choreography; user rule: each fight video gets new scenes,
  never a remake). Build: `python fight_v8/parts/assemble.py` (v7 mechanics + `parts/build_v8.js` + `parts/camera_v8.js`).
  Render: `PAGE=anim-test/fight_v8/index.html QS="?sub=5" node render.mjs frames 0 900 out/newgen_fight_test_v8_video.mp4`;
  events -> `fight_v8/comp/events.json`; sound `SCENE=v8 python fight/fight_sfx3.py`. Collision QA: `tools/collide_qa.js`.
  Includes all v7-review fixes (bright sun 4.0, standing slides, layered impact-frame hits, sword twirls and grip blend, sword
  1.15x, parry auto-pick). Details and metrics: notes §16. Waiting on the user's feedback.
- **Duel 40** (`fight_w`, `?vid=duel40`): Boltspear vs Goldreaper, 40 s with slow motion, built to the permanent standard.
  Build `python fight_w/parts/assemble_w.py duel40`; render `QS="?sub=5&vid=duel40" ... frames 0 1200`; sound `SCENE=duel40`.
  Out: `out/newgen_duel40_boltspear_vs_goldreaper.mp4`. Mechanics fixes (bounce, legs through sand, run flips, walk gait, slow
  motion) and QA numbers: notes §18.
- **Weapon-style duels** (`anim-test/fight_w/`, 3 x 20 s): sword vs spear (Boltspear), vs heavy hammer (golem_hammer), vs bow
  (Voidbow). `?vid=spear|hammer|bow`; build `python fight_w/parts/assemble_w.py <vid>`; render
  `PAGE=anim-test/fight_w/index.html QS="?sub=5&vid=<vid>" node render.mjs frames 0 600 out/newgen_fight_w_<vid>_video.mp4`;
  events -> `fight_w/comp/events_<vid>.json`; sound `SCENE=<vid> python fight/fight_sfx3.py`. Two-hand IK, bow draw/arrows,
  per-weapon collision and sounds: notes §17. User rule: twirls only once or twice per video (show-off).
- **Legs crossing: fixed 2026-11-11** (notes §20). Since v8 a sign bug put the right foot on the body's left in every gait
  step. Fixed in the shared planner with `anim-test/tools/patch_nocross.pl`, plus real opponent legs for the blade
  collision (`patch_oppfeet.pl`); re-run both after any `assemble_w.py`. QA: `tools/cross_qa.js` must read 0 crossed;
  `tools/qa_feet_batch.js` runs cross + stance + phase. t1-t3 and duel40 are not re-rendered yet.
- **NewGen studio (our own animation system)**: `anim-test/studio/` + skill `.claude/skills/newgen-animate`. Prompt ->
  beat script JSON -> contact-first generated motion on rig2 -> render. Demos: `studio/scripts/demo.json` (voxel meadow),
  `demo_colosseum.json` (the user's colosseum, converted by `anim-test/tools/mca2obj.py`; `fight/assets/colosseum/` is
  gitignored, rebuild it from `Desktop\mcrefs\worlds\...` with the command in notes §12). Renders:
  `anim-test/out/studio_demo_v1.mp4`, `studio_demo_colosseum_v1.mp4`. Waiting on the user's feedback.
- **AnimationGPT integration study** (`notes/animation-study.md` §11, `anim-test/tools/agpt_laws.py`, `agpt_reach.py`,
  `toolkit/refstudy/bursts.py`). **User rule: AnimationGPT is only an example of good combat motion; never put its
  clips/poses/joints in our videos.** We generate every motion with our own system (§12, `anim-test/studio/`), designed to
  the studied numbers (yaw lead 100 ms, foot plant -130 ms, step-in 0.16, pelvis drop 0.25 at +200 ms, follow-through
  0.27 s; reference timing: anticipation 0.2-0.6 s, strike 3-5 frames, blade 15-35°/frame).
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
