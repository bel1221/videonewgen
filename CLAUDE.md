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

- **Battle Royale video** (`newgen-br/`, 2026-11-13): **v1 rendered**, `out/newgen_battle_royale_v1.mp4`, 43.3 s, Ranked 2vs2
  typography style, Thắm VO (7 lines), recipes shown as items popping into the crafting grid (never spoken), kill feed with the
  user's 11 player names (Bunn9 wins), logo glint + "JOIN NOW" + "IP: newgenmc.net". Script, build commands and QA in
  `newgen-br/SCRIPT.md`. Local build works now: Pillow is in `Desktop\mcrefs\mcrefs	ools\python`. Waiting on feedback; not on Higgsfield.
- **Heart bar rule (user, 2026-11-13):** a killed player's bar must show 0 hearts. Fixed table in `rk_scenes.py`; Ranked v4 not re-rendered.
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
- **Bolt 30** (`fight_w`, `?vid=bolt30`): Boltspear vs Lancebolt, 30 s. Split-panel face intro, double lunge, kick into a
  spear-braked slide, pierce finisher. v1 = two-handed spear (hands spasmed); v2 = grip rules from the user (never force a
  grip; spear two-handed only on lunges). User on v2: "good", but the empty hand must not always be raised (open, next
  session). Build, render, QA numbers and local tool paths: notes §21-23. v1 is on Higgsfield; v2 is not uploaded yet.
- **Duo 40, the first 2 v 2** (`fight_w/fight4.js` + `index4.html`, 2026-11-12; user brief: 4th skin, 40 s, intro with teammates
  looking at each other, Jingu Bang / Boltspear / Blinkblade / Seekerbow, team work, dodges, weapons braking in the sand, slow-motion
  close calls with a slow-mo sound, NO corner texts, logo outro). Blue = Blinkblade (skin 1) + Seekerbow (skin 2); red = Boltspear
  (skin 3) + Jingu Bang (skin 4, `src/skins/4.png`); the bow's team wins. Jingu Bang is a wooden kung-fu staff, pinned to medium.
  - **How it works:** two normal duels run side by side (`choreo_duo1.js` Blinkblade vs Boltspear, `choreo_duo2.js` Jingu Bang vs
    Seekerbow; parts `build_duo1/2.js`, `duo_shared.js` = shared timeline + world coordinates + spear pose set). `duo_director.js`
    owns what crosses them: camera shot list, slow motion (14.86 and 28.02, 0.45 s at 1/4), the archer aiming at the other duel
    (pose hook), the cross-duel arrow (mode `'x'`), the spear knocked out of the hand (`DISARM`), the logo outro (`newgen-show/src/img3.png`).
  - **Gotcha:** `DRIFT` moves both fighters of a duel on top of their keys, so shared world points must go through `W_(p, t)`.
  - **Weapons:** `node tools/export_weapon.mjs <names>` exports at the SHEET size and grip to `fight/assets/w2/` (no Python/PIL);
    the weapon axis runs through the fist centre (+1.5 px) for every weapon here.
  - **Bow hold (user review):** "bow gripping looks wrong, not what it looked like in the grid". Rule: fist on the riser, bow
    UPRIGHT on a half-raised arm, string toward the archer, standing straight when idle; never let a sword blade direction reach
    the bow hand (`build_duo2.js` fixes every archer key).
  - **Run:** `python fight_w/parts/assemble_w.py duo1` and `duo2`, then `node tools/duo_run.mjs` (one page load, about 5 min to solve;
    env `EVALS`, `STILLS`, `TOPS`, `FRAMES="0 1200 out/x.mp4"`, `EVENTS`, `PROBE=1|2`, `QS="?sub=1&fast=1"` for layout passes).
    Sound: `python fight_w/duo_sfx.py` (no `desert_*` clips; slow motion = the user's pick, sample 5 "sub drop"; samples in
    `out/sfx_samples/`). QA: per-duel tools with `PROBE`, plus `tools/duo_qa.js` (cross-duel distance, speed spikes).
  - **USER REVIEW of v1: "its very bad, the physics are all messed up"** (full text and the new permanent grip rule in
    `notes/fight-animation-standard.md`). Do NOT re-render Duo 40 until these are fixed:
    - arrows glide along the floor after landing (not diagnosed yet; `arrowAt` in `fight4.js`);
    - the bow grip is still wrong: fist on the HANDLE, STRING FACING THE PLAYER, as on the grid sheet;
    - **two-handed grip (UNFINISHED, in the tree):** rig flag `ch.th` + a reach solver in `rig2_w.js` (before `clearArms`),
      `spearSetup()` puts `lh: 1` on every spear/staff guard, block and attack, `fight4.js` sets `th` and `lh` +6 / +8 (second fist
      AHEAD). Measured with `tools/freehand_qa.js` / `grip2_dbg.js`: two-handed only 37 % (spear) and 15 % (staff) of the time,
      8 forced releases each, second fist up to 13 px off the shaft, clash misses up from 0.01 to 0.09-0.10. Causes seen: the staff
      has 23 px of shaft BEHIND the main hand, so sweeps and wind-ups run it into the wielder and the collision pass turns the
      weapon up to 97 deg away from the pose; the head box pushes the second hand off when the grip sits above the shoulders; the
      clash solver loses the arm angles the IK now overrides. Next: main hand at the REAR quarter of the staff (export grip),
      poses designed around a shaft that crosses the chest, keep fists below the neck.
    - **free hand (DONE, measured):** `freeArm()` in `assemble_w.py` (duo and v8x builds) replaces the raised guard arm
      (`L.guard` lArm [-38, 0, 24] x 1.25) with a low arm that swings against the weapon arm and torso twist, a beat late.
      Blinkblade's free hand raised 87 % -> 18 % of the time, longest stretch 5.0 s -> 1.9 s (`?nofree=1` = old behaviour).
  - **QA at render time:** cross_qa 0 crossed on all four; clash miss mean about 0.01; duo_qa clean; weight_qa passes except the
    spear's run (10.2 vs 8.1 blocks/s); phase_qa leaves about 12 grazes of 2 px or less. Sound not ear-checked.
- **v8 remake "v8x" (UNFINISHED, stopped by the user at the end of 2026-11-12; pick up here).** User brief: "remake v8 with the 2
  player faces up close like bolt30 intro 40 seconds (change up the fighting just a little bit but keep most of the scenes) fight
  with all the new fixes and changes, at 17 second of v8 theres a dupe scene of the player doing a jump attack so remove that and
  at 20 second the players are hugging eachother for some reason so remove that too, remake the ending of v8 into the enemy gets
  stabbed in the chest and pulls sword out after and rolls the ending with the newgen logo".
  - **Built, never seen:** `fight_w/parts/build_v8x.js` (v8's body, time-warped by `W8()`, generated by `tools/gen/gen_v8x.cjs`),
    `camera_v8x.js` (bolt30's face panels + a calmer shot list + the logo `overlay`), `fight_w/index_x.html` (no corner texts),
    `fight.js` entry `v8x` (Aegisblade vs Veilblade from `fight/assets/w2/`, sheet size and grip). 37.75 s of animation + two
    slow-motion moments (27.0 close call, the stab at 30.73) = 40.0 s. It assembles and passes a syntax check; the first page loads
    failed on my own slips (now fixed) and the last one was stopped before it finished, so NOT ONE FRAME has been looked at.
  - **Next:** `python fight_w/parts/assemble_w.py v8x`; stills with
    `QADIR=qa/v8x READY_MS=900000 PAGE=anim-test/fight_w/index_x.html QS="?sub=1&vid=v8x" node render.mjs still 1.5,3.6,7.3,17.3,27.4,29.9,31.6,32.4,34.5,38.5`;
    then phase/cross/weight/freehand QA (`window.__qa_w=['aegisblade','veilblade']`), render `frames 0 1200`, sound with
    `EVF=fight_w/comp/events_v8x.json OUTF=fight_w/comp/audio_v8x.m4a KINDS=sword,sword EXTRA='[{"t":30.73,"kind":"stab"},{"t":31.5,"kind":"pull"},{"t":32.95,"kind":"fall"},{"t":34.0,"kind":"outro"}]' python fight_w/duo_sfx.py`.
  - **STATUS 2026-11-13 (supersedes the two bullets above): built and reviewed PART BY PART** (user rule: 5 parts of 5-8 s, list
    problems, fix, render that part silent, wait for review; no re-render until asked). Parts (video s): P1 0-7.9, P2 7.9-15.0,
    P3 15.0-22.6, P4 22.6-30.3, P5 30.3-40.0. **Parts 1-3 are re-blocked and rendered** (`out/newgen_v8x_part1-3_v1_silent.mp4`,
    waiting on the user's review); **Parts 4-5 (S9 onward in `build_v8x.js`) are still the old choreography.** Sound not built.
    Shared fixes so far (details in `notes/fight-animation-standard.md`, "v8x part-by-part review"): shared `hit()` / `knockTo()` /
    `far()` helpers, chest-level clashes, wide cameras from one side, 2.4-block knock-backs, and automatic stepping (STEP PLANNER 2
    in `assemble_w.py`; no `step()` calls, moves faster than ~3.5 blocks/s must be RUN windows).
    Check a part: `PAGE=anim-test/fight_w/index_x.html QS="?sub=1&vid=v8x&solve=0,22.9" EXTRA=qa/v8x/jitter_probe3.js
    FRAMES="0,678,out/x.mp4" node qa/v8x/part_check.mjs qa/v8x/p3 2.9 22.8 "<still times>"` (about 9 min; `solve=0,0` = footwork
    only, 1.5 min). The scripts in `qa/v8x/` are force-added to git (the folder is ignored). Last numbers: leg crossing 0, small
    steps A 5 / B 1, 19 clashes within 0.17 blocks; open: blade snaps of 59 deg at 18.55 s and 51 deg at 13.2 s.
  - Local tools on this PC (not on PATH): `Desktop\mcrefs\tools\node`, `tools\python` (numpy + scipy, no PIL), `tools\ffmpeg\bin`.
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
- **Weapon grip + scale reference** (`anim-test/gripref/`, 2026-11-12): 20 weapons in the fight rig's hand (rig2_w, scale 0.79),
  side + front view over a block grid, read straight from the `.bbmodel`. Numbers per weapon (length, grip, second hand, sword
  offset, bow twist) in `gripref/weapons.json`; rebuild with `node gripref/render.mjs` from `anim-test/` ->
  `out/gripref/NN_name.png` + `weapon_grip_sheet.png`. 11 of the 20 are first guesses (marked NEW).
  **User review 1 (grip first, scale later):** two-handed weapons are held in the MIDDLE, in front of the chest, both fists on the
  handle; the fist must sit ON the handle (a grip off the handle looks loose and weak); no backwards/upside-down models. Fixed in the
  sheet: grips read off each model (`node gripref/models.mjs` -> `out/gripref/models_N.png`, % ruler), weapon axis through the fist
  centre (1.5 px up from the hand bone), own 2-bone arm IK to the fist centres with a reach check (`twoHand()` in `gripref.js`;
  arms reach only 8 px, so both hands meet at chest height on a diagonal), Seekerbow turned round. NOT yet carried into the fight
  code (`fight_w` still uses the old export grips and `lh` IK to the hand bone). Scale is the user's next pass.
  **Weight classes (user, 2026-11-12):** every weapon is light / medium / heavy from its size and width against the player
  model, and the class must change how the player moves. Measured as heft = voxelised volume in % of the body x (1 + centre-of-mass
  distance from the fist in blocks); thresholds and the per-class player numbers (wind-up, strike frames, recovery, run speed,
  combo length, knockback, which body parts drive the swing, twirls, carry pose) are in `weightClasses` in `gripref/weapons.json`.
  Classes change with scale, so re-run after rescaling.
  **Link to fight builds (2026-11-12, user: "link the weight + physics to animation making"). EVERY NEW FIGHT USES IT:**
  `node gripref/render.mjs` writes `fight_w/weapon_data.json`; `assemble_w.py` injects it as `WEAPON_DATA`. A build calls
  `weapons('<A file>', '<B file>')` first, then the w-helpers in `parts/common_w.js`: `wsprint` (run speed = runBase 9 x class
  move), `whit` (wind-up, follow-through, recovery; medium/heavy hits knock the defender back), `wknock` (distance x the
  defender's brace), `wtw` (twirl refused for heavy), plus a console warning when a combo is longer than the class allows.
  QA: `tools/weight_qa.js` (same eval pattern as the other QA tools; `window.__qa_w = [A, B]` for builds without `weapons()`).
  Class numbers are calibrated on the approved fights (swords: wind-up 0.16 s, run 9 blocks/s, blade up to 100 deg/frame).
  Proof build: `?vid=wt` (`parts/build_wt.js`, golem_hammer vs aegisblade, 8 s, mechanics only, not for publishing): weight QA
  0 fails (run 6.75 / 8.1 blocks/s exactly on class), phase_qa clean, cross_qa 0; stills in `qa/wt/`, no video rendered.
  NOT done: fights still load the old weapon exports (the sheet's sizes and grips are not in `fight/assets/w/`; the exporter
  needs PIL, which the local `tools/python` lacks). Old fights fail the weight QA in places; they predate it and were not changed.
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
