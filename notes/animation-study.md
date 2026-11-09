# Minecraft animation reference study

Four reference videos the user downloaded to `Desktop\mcrefs` (not in git):

| Key | Video | Length | Kind |
|---|---|---|---|
| **MD** | Marlow's Downfall (Fallerfly) | 36 s | short combat animation, snow arena |
| **NV** | Memory, Nuvguard Heroes server trailer | 2:43 | cinematic server trailer, character intros and montage |
| **WY** | Wynncraft Fruma Expansion trailer | 3:53 | MMORPG trailer: cinematic open, then feature cards over gameplay |
| **DFY** | Die For You (Minecraft music video) | 4:08 | narrative music video, blue vs red colour script |

Method (2026-11-09): every video was decoded at 30 fps / 320x180. Per frame I measured histogram and pixel cut
detection, a global affine fit to Farneback optical flow (camera pan, zoom and rotation, plus the residual as object
motion), and luma and saturation. Audio was analysed with librosa: onsets, beats, RMS, sub-band and air-band energy.
Every shot was then checked by eye on labelled contact sheets: 56 sheets, plus dense 30 fps filmstrips of five key
moments and spectrogram sheets with cut markers.
Scripts: `toolkit/refstudy/` (`analyze.py` -> `shots.py` -> `overview.py` / `stats.py` / `specsheet.py`).
earshot was not installed on this machine, so the audio notes come from spectrograms and envelopes, not from earshot
tags.

## 1. Numbers

| | MD | NV | WY | DFY |
|---|---|---|---|---|
| shots | 36 | 110 | 110 | 180 |
| median shot | **0.79 s** | 1.23 s | 1.52 s | 0.97 s |
| p10 / p90 shot | 0.30 / 1.75 | 0.33 / 2.73 | 0.37 / 4.63 | 0.27 / 2.51 |
| calm shots (little in-frame motion), median | 1.32 s | 1.87 s | 2.23 s | 1.20 s |
| action shots, median | **0.52 s** | 0.80 s | 0.83 s | **0.47 s** |
| locked camera (no pan, no zoom) | 26 % | 9 % | 12 % | 9 % |
| shots with a push-in (zoom >= 2 %/s) | 32 % | 41 % | 25 % | 42 % |
| typical pan speed when moving | 5 %W/s | 6.5 %W/s | 8 %W/s | 4 %W/s |
| typical zoom speed when zooming | 7 %/s | 7 %/s | 6 %/s | 4.5 %/s |
| loudness vs cut rate (corr., 5 s windows) | +0.75 | +0.50 | +0.25 | +0.45 |

Detected cuts undercount the fastest combat: several "shots" of 0.3-0.8 s in MD hold two or three 2-4 frame inserts
(MD #11, #13), so real combat shots are often **0.1-0.4 s**.

Takeaways:
- **Action is cut at roughly half a second; calm beats get 1.2-2.2 s.** Pacing follows the action, and loud
  sections are cut faster (strongest in MD, +0.75).
- **The camera is almost never locked** (9-26 % of shots). It is either pushing in slowly (4-7 %/s) or drifting
  sideways (4-8 % of frame width per second). That is the house "no still frames" rule, quantified. Our v1 encounter
  drifts at 4.5 % over 10 s (0.45 %/s), about ten times slower than any reference.
- **Cuts are not locked to the beat.** Cut-to-beat and cut-to-onset hits within 50 ms are at chance level in all four
  videos (e.g. NV 14 % vs 19 % chance). Cuts follow action and music *sections*, not every beat. Only the big moments
  (drop, impact, title) land on a hit.

## 2. What each one teaches

### MD, Marlow's Downfall (closest match for the encounter)
- **Shape:** content warning (3.7 s) -> extreme close-up of an eye (1.3 s) -> two calm establishing wides of the
  arena (2.1 s, 1.5 s, near-locked) -> fight at 0.3-0.8 s per shot (8.6-22 s) -> death -> slow, dark aftermath
  (1.2-1.9 s shots) -> villain reveal with glowing eyes -> fire-and-blood smash -> 2.7 s black.
- **Hit = insert.** At 11.983 s the fight cuts to a **2-frame close-up of the blade contact** (orange lens flare and
  sparks, warm tint against the cold blue grade), then back to a wide where the victim slides back in a snow-dust
  plume. Every big hit gets a different, very short angle; the wide after it shows the result.
- **Shot sizes rotate:** extreme close-up (eye, hands, blade) -> medium -> wide -> top-down. No two consecutive
  shots share a size or angle.
- **Depth:** shallow depth of field, a blurred foreground silhouette framing the action, falling snow particles in
  front of the subject, motion blur on every fast limb.
- **Death beat (21.6-23.4 s, frame by frame):** the falling body hits the lens (fills the frame, acts as a wipe) ->
  **1 white frame** -> **2-3 black frames** -> a top-down crash-zoom *out* over 0.2 s -> a white flash with a
  chromatic-aberration rim -> **a hold of about 0.5 s on the crater** with a slight push and a lens-distortion
  vignette -> cut to the killer. Impact, blackout, then a held result: the hold is what makes it land.
- **Colour script:** cold desaturated blue for the fight. Warm orange appears only on contact sparks and fire,
  magenta only on magic. Accent colours mark the events.
- **Sound:** a single orchestral/hybrid music bed, heavily compressed (flat about -15 dB from 5 s to 32 s), with a
  constant sub drone at 40-80 Hz. **Right before the fight (9.2-10.2 s) the air band drops about 25 dB, a suck-out**,
  then three big drum transients at 10.2 / 10.6 / 11.0 s land on the first fight cuts. No separate SFX layer was
  visible at the hits: the music and the picture flashes carry them.

### DFY, Die For You
- **Colour as story:** blue world (allies, calm) vs red world (enemy, violence). The climax goes fully red-monochrome.
  Single colour per act.
- **Impact build (150.1-151.9 s):** anime **radial speed lines** in red behind the character, with a 0.8 s fast push-in
  to an extreme close-up of the eyes -> **2 white frames** -> 4 frames of a yellow/red glow burst -> a **whip-pan smear**
  that becomes the next shot. Audio: the music **drops out at 147.2 s** (highs vanish), runs thin for about 4 s, and
  the four-on-the-floor kicks come back at 151.0 s, right at the white flash.
- **Text in the world:** "INITIATION COMPLETE" / "REMEMBER WHO YOU ARE" appear on an in-world screen with glitch and
  scanlines rather than as overlays.
- Faces: frequent extreme close-ups of eyes and faces (blinks, glowing eyes) between action shots. They give the
  viewer a reaction to read.

### NV, Nuvguard Heroes trailer
- **Shape:** dark, slow open (2-4 s shots, -35 dB) -> world and character beats (about 1.5 s) -> **a black breath**
  -> colour explosion -> montage (0.3-1 s) -> logo 2 s -> end card "Out Now. / ip: mc.nuvguard.com" held 7 s.
- **Black breath before the drop (85.6-90.4 s):** a crash zoom into darkness with motion blur -> **about 1.5 s of
  near-black** -> a slow fade up on a new world -> a hard cut on the music hit to a bright sun. Holding back makes
  the reveal hit harder.
- Every shot moves (only 9 % locked). Pushes and pans run at the same 6-7 %/s throughout.
- Characters get a "hero intro" each: a close-up turn to camera, then a wide action pose.

### WY, Wynncraft Fruma trailer (closest match for our feature-promo style)
- **Shape:** "7 YEARS IN THE MAKING / NO MODS REQUIRED" on black -> cinematic cold open (hero in darkness lit by
  torches, crosscut with an army) -> a light-burst transition -> long, slow world flyovers (4-6 s, the calmest part)
  -> **feature cards over gameplay**.
- **Feature cards (171.9-174.3 s):** huge white ExtraBold caps ("5 NEW REGIONS", "NEW LEVEL CAP: 120", "ITEMS 2.0"),
  top-right, with a soft shadow. They **cut in hard** (no fade), hold about 1.4 s, and **stay on screen while the
  footage cuts underneath** (the cut at 172.9 s). The text drifts left about 2 %/s, and **the character's weapon
  passes in front of the text**: the headline sits *behind* the subject (a depth matte). It's the single most useful
  trick for our house style: same fonts and colours as ours, but layered into the scene instead of pasted on top.
- UI screenshots (dialogue boxes, item tooltips, ability bars) are shown as full-frame inserts for 1-2 s, not as small
  picture-in-picture.
- Graphic transitions: white brush-stroke wipes on black (0.27 s) between cold-open beats.

## 2b. How the animation is done (character craft)

Cadence measured at native frame rate on calm and action stretches (`toolkit/refstudy/cadence.py`):

| | MD | NV | DFY | WY |
|---|---|---|---|---|
| new pose every | 1 frame at **24 fps** (2:3 pattern in the 60 fps file) | 1 frame at **30 fps** | 1 frame at 30 fps (calm shots up to 55) | 1 frame at 30 fps |

All four animate **on ones**: a new pose on every rendered frame, with no held drawings and no stepped "stop-motion"
look. The smoothness comes from keyframes and easing. Our engine at 30 fps matches.

Read frame by frame from 30 fps strips:
- **Anticipation is long and the action is short.** NV axe swing (116.6-117.5 s): the body sinks and the arm draws back
  over about 0.55 s (slow in), then the swing takes **about 0.2 s** (7 frames) with motion blur on the axe. That's
  roughly 3:1 anticipation to action. The cut happens *mid-swing* (cut on action), and the impact lands in the next,
  wider shot.
- **The impact is 1 frame of brightness, then the result.** At 117.82 s: one frame of a white-yellow star burst, then
  a ring of white air trails (a shockwave) expanding for about 0.3 s, dust, and the victim knocked flat. The hit
  reaction is a full-body **knockback that keeps travelling**, not a flinch in place.
- **Weapon trails.** DFY 134.35-134.65 s: a grey smear arc follows the blade's path and fades over about 0.3 s. The
  arc *is* the motion read; the limb itself barely needs blur.
- **Charge-ins accelerate.** MD 10.2-10.95 s: the hero walks at an even pace, then the last 4 frames become a leap
  (body stretched, arms up, heavy motion blur) toward the lens. Ease-in into a jump, no constant speed.
- **Nothing is ever frozen.** In DFY's two-shot (133.9-135 s) the character who isn't acting still shifts weight and
  turns the head a little. In close-ups the head sways a few pixels over about 2 s, and the face changes expression by
  **swapping the eye/mouth texture** (blink, squint, glare): Minecraft faces act through texture, not through bones.
- **Secondary motion.** Hair, capes and wings lag behind body turns by 2-4 frames and settle with a small overshoot.
- **Weapon handling (rechecked 2026-11-09).** The handle runs *through* the closed fist, and the blade roughly
  continues the forearm line. It is never fixed at 90° to the arm like a vanilla held item. The angle changes with the
  action:
  - **Relaxed:** the arm hangs and the blade points down and a little forward (DFY 221 s).
  - **Running:** the weapon arm stays low and back with the blade trailing behind. Only the free arm pumps
    (WY 22.9 s).
  - **Raised or wind-up:** the blade carries on over the shoulder and behind the head (MD 13.75 s).
  - **Guard:** the blade angles up and forward. Blocks use two hands on the hilt.
  - **Swings and thrusts:** the blade extends the arm toward the target.

  `anim-test` models this as a per-pose `wrist` angle: 90 means perpendicular to the forearm, 180 means along it, and
  values above 180 trail the blade behind.
- **Weight on landings.** Falls and landings compress (crouch) on contact, then settle. Bodies after a death hit stay
  down and the camera holds on them.

## 2c. Sound effects (how they're layered)

Read from spectrograms plus onset and band envelopes (`specsheet.py`). earshot was unavailable, so these describe
spectral shapes, not named sounds.
- **MD and DFY are music-only.** The hits are carried by the score's drums and by picture flashes. Even so, they
  shape the music like sound design: **MD's suck-out is a low-pass sweep**, with the score's top end closing from about
  16 kHz down to about 2 kHz over 1.2 s (9.0-10.2 s). It reopens with a full-band drum hit on the first fight cut, and
  a second, shorter close-reopen follows 0.4 s later.
- **NV layers SFX under the score.** At the swing start (117.25 s) there's a broadband streak up to 16 kHz (the swing
  whoosh), the air band rises into the impact (117.8 s), and a sweep follows the shockwave. So the whoosh comes on the
  *anticipation-to-action* moment, the impact on contact, then a tail.
- **WY is the most sound-designed.** Sharp broadband ticks and whooshes sit on the cuts (cut-to-onset within 50 ms:
  41 % vs 35 % chance, the only video above chance). A sub-bass hit lands on each hero cut, about every 4.5 s. At the
  title card "7 YEARS IN THE MAKING" everything drops to near-silence with **a single ringing tone at about 4 kHz** for
  0.7 s, which makes the card feel heavy without any boom.
- **Mix:** dense, compressed beds around -10 to -15 dB with loud sections held flat. Dynamics come from *removing*
  content (suck-outs, silences), not from making hits louder.

Applied to our rules (no booms/explosions, no file more than twice): a whoosh on each *anticipation*, a hit on contact,
and a short sparkle or shine tail. The suck-out is done with a low-pass sweep on `sa.mp3` (a filter, not a file), and a
quiet ringing tone can replace a boom for the BANNED stamp.

## 2d. Lighting and environment

Grade stats from every shot's middle frame (`light.py`; CIELAB, L 0-100):

| | MD | NV | WY | DFY |
|---|---|---|---|---|
| black level (p2 L) | 5 | 4 | 2 | 5 |
| brightest non-source (p98 L) | 87 | 80 | 76 | 55 |
| highlight chroma / shadow chroma | 14.6 / 12.7 | 18.6 / 6.8 | 15.1 / 6.0 | 17.2 / 10.9 |
| vignette (corner / centre L) | 1.04 | 0.80 | 0.98 | 0.83 |

What the full-resolution frames show:
- **Every light is motivated.** Candles, torches, blue-fire braziers, light blocks and fire are visible in frame, and
  their colour spills onto nearby blocks and onto the characters. NV's warm light block lights the checkerboard floor
  around it; DFY's blue braziers turn the whole hall and the character blue. Characters never have lighting that
  doesn't belong to the set.
- **Two-colour lighting:** a cool top or ambient fill plus a warm practical from one side or below (MD 26 s: blue
  room, warm pink bounce from below). Complementary colours make the blocky forms read.
- **Backlight and silhouette for menace.** MD's villain (30.5 s) is a black silhouette against a blown-out volumetric
  sky with god-rays and drifting bokeh. Only the **emissive eyes** glow (white, then red). NV and DFY villains are lit
  the same way.
- **Emissives bloom:** eyes, fire, sparks and light blocks have a soft glow halo. Nothing else does.
- **Atmosphere in every shot:** haze that fades distant blocks toward the fog colour, floating particles (snow,
  embers, dust, bokeh discs), shallow depth of field, and a blurred foreground object (NV 60.5 s: green leaves in
  front of the fight).
- **Contact:** soft ambient-occlusion shadows under feet and in corners, so characters sit *in* the set.
- **Grade:** true blacks (p2 L 2-5), highlights below clipping except light sources, colour concentrated in the
  highlights (NV and WY have about 3x more chroma in highlights than in shadows), and a vignette in the cinematic ones.

v1 by contrast: the background is a blurred, darkened screenshot, characters have one fixed directional shade, and
their colour doesn't react to the scene. There's no rim light, haze, foreground layer or bloom, so the characters
read as pasted on.

## 3. Techniques ranked by value for us (all fit the house rules)

1. **Cut the action, not the clip.** Break any 3+ s action into 0.3-0.8 s shots from different sizes and angles;
   give calm or reading beats 1.2-2 s.
2. **Impact insert:** a 2-4 frame close-up at the moment of contact (spark, flare, accent colour), then a wide showing
   the result. Use it once per real event, not per hit.
3. **Camera always travelling:** push-in 4-7 %/s or drift 4-8 %W/s on every shot, alternating direction between cuts.
   Add a speed ramp (fast move that eases out) on the big entrance.
4. **Flash grammar for big moments:** 1-2 white frames -> 2-3 black or tinted frames -> the new shot. Only 2-3 times
   per video, and never over text (house rule: light never covers text, so text appears after the flash).
5. **Suck-out before the payoff:** cut the music highs (or the whole bed) 0.5-1.5 s before the reveal, then land the
   hit on the cut. It's the opposite of a riser and it needs no extra SFX file.
6. **Hold after the payoff:** about 0.5 s of near-still on the result (with a slow push) before moving on.
7. **Headline behind the subject:** feature text layered behind a character or weapon, holding across a cut.
8. **Colour script:** a cool base grade, with the accent colours (our GREEN / ORANGE / RED) appearing only on events.
9. **Reaction close-ups:** a face or eyes for 0.4-0.8 s after a big event (the player's "?!", the admin's stare).
10. **Foreground depth:** a blurred out-of-focus element crossing the frame, plus particles in front of the subject.

## 4. Applying it to encounter v2 (`newgen-ban/tools/encounter.py`)

v1 for comparison: one wide side-on shot for the full 10 s. Characters are about 15 % of frame height, the camera
pushes 4.5 % in total, a shake on each hit, and every event plays inside the same frame.

Proposed v2 shot list, keeping the v1 story beats and timing constants (about 11 s total):

| t (s) | Shot | Size / camera | Notes |
|---|---|---|---|
| 0.0-1.0 | player walks in | medium, tracking drift 6 %W/s | establishes the hero; slow push |
| 1.0-1.35 | hacker glitches in | close-up on the hacker, push-in 7 %/s | keep the RGB-split glitch; cold to red tint |
| 1.35-1.6 | player reaction | extreme close-up on the face | 0.25 s; the player sees him |
| 1.6-3.9 | kill aura (6 hits) | alternate: wide 0.6 s / over-the-shoulder 0.5 s / low angle 0.5 s / wide 0.7 s | cut every 1-2 hits, not on every hit |
| at 1.85 and 3.5 | impact inserts | 2-frame extreme close-up of the blade on the player, orange spark and flare | only 2 of the 6 hits get one |
| 3.9-4.45 | **suck-out** | wide, near-still, slight push | music highs out, hearts at 2; the "it's over" breath |
| 4.45-5.0 | admin beam | low angle up the beam, fast push | light beam behind characters, never over chat text |
| 5.0 | landing | 1 white frame -> 2 black frames -> wide | land the music hit on the cut; dust ring |
| 5.0-6.6 | admin vs hacker standoff | medium two-shot, slow drift; 0.5 s close-up on the admin | chat lines appear here (no flash over them) |
| 6.6-7.3 | /ban + fall | close-up of the hacker -> wide of the fall | Minecraft red tint and fall-over as in v1 |
| 7.32 | poof | 2-frame top-down insert, then wide | |
| 7.75-9.5 | BANNED stamp | wide, **0.5 s hold**, then slow push | stamp lands after the flash, not under it |
| 9.5-11 | player and admin | medium, drift | hand-off to the next scene of the ban video |

Engine work this needs: a `shot` table (start, camera yaw/pitch/scale/centre, push and drift rates) in place of the
single camera in `render()`. `MC.Scene` already takes `cam_yaw`, `cam_pitch`, `scale` and `center`, so each shot is
just a different `mk()`. Also needed: a white/black flash helper, and an impact-insert renderer (a close crop plus an
additive spark/flare sprite in ORANGE). Optional: radial speed lines for the admin landing.
Sound (`enc_sfx.py`): add a music suck-out at 3.9 s (low-pass/duck the bed, no new file) and keep each SFX file at two
uses or fewer. Hits with no insert can share one cue.

### v2 craft layer (from sections 2b-2d)
- **Animation:** anticipation before every hit (the hacker winds up 0.15-0.25 s, then a 2-3 frame strike) and
  knockback that travels and settles. Add a grey/white weapon-trail arc on the spin, idle breathing and sway on
  everyone (about 0.8 units at 0.4 Hz, heads offset), a landing crouch-and-settle for the admin, and an eye-texture
  swap for expressions (player blink and wide eyes, hacker red glow).
- **Lighting:** colour-aware shading in `MC.Scene` with a key colour, a fill colour sampled from the background, and
  a rim term on faces turned away from the camera. A warm admin beam lights the characters near it, and the hacker
  gets a red under-light and glowing eyes with bloom. Also: haze plus floating embers in front of and behind the
  characters, a blurred foreground layer, a vignette, crushed blacks and a warm/cool split tone.
- **Sound:** a whoosh on each anticipation (different files, two uses at most each), a hit on contact, and a low-pass
  sweep suck-out on the music before the admin lands, reopening on the landing.

Open questions for the user before building v2 are unchanged from CLAUDE.md (skins, admin name, staff review wording).
New ones: is about 11 s still fine for this scene, and should the flash and speed-line grammar stay subtle (house
"clean motion graphics" style) or go full anime as in DFY?

## 5. Fight test v1 vs the references (2026-11-09)

`anim-test/out/newgen_fight_test_v1.mp4` is 20 s, set in the user's colosseum and rendered with three.js in headless
Chrome:
- Rig: elbows, knees, waist, wrist pitch and wrist roll.
- Clash timing: an IK-lite solve makes the blades actually touch at 15 of the 18 clashes.
- Motion blur: 5 samples across a 180° shutter.
- Impact frames: an inked black-and-white frame, then 2 colour frames with a flare.
- Effects: weapon trails, sparks, debris and snow.
- Sound: a whoosh on every swing, plus a metal hit and a synthesized blade ring on every clash.

I ran the same measurements as in §1, plus a 30 fps strip compared with Marlow 11.6-12.4 s
(`anim-test/fight/qa/compare_strip.jpg`):

| | Marlow | Fight v1 | Verdict |
|---|---|---|---|
| median shot / action shot | 0.79 / 0.52 s | 0.57 / 0.45 s | on target |
| locked camera | 26 % | 0 % | fine; could use 1-2 deliberate holds |
| pan / zoom speed when moving | 5.3 %W/s / 7.1 %/s | 7.3 / 8.9 | slightly faster than the reference |
| loudness vs cut rate | +0.75 | +1.00 (only 4 windows) | ok |
| cuts within 17 ms of an onset | 3 of 17 | 13 of 27 | tighter than the reference |
| saturation / highlight chroma | 104 / 14.6 | 54 / 6.5 | **too grey**: the desaturation went too far |

What still has to be worked on, most important first:
1. **Atmosphere depth.** Marlow fills the frame with ground mist, big out-of-focus snow near the lens, shallow
   depth of field and backlit haze. Ours has small, sparse snow and uniform fog, with no depth of field, so it reads
   flat. Add a bokeh/DOF pass, foreground snow cards and ground mist planes.
2. **Characters too small in the fight.** Marlow keeps the camera inside the action, with bodies filling 50-100 % of
   the frame and passing the lens. Too many of our exchange shots are wide, for example 6.57-6.77 s. Use closer,
   handheld-style framing.
3. **Whole-body momentum.** In Marlow the whole body commits to every swing: hips and shoulders lead and the weight
   transfers. Ours still swings mostly from the arm. The feet also slide, because there is no foot planting. Next:
   foot IK and a hip-led swing chain (hips, then chest, then shoulder, then elbow, offset by 1-2 frames each).
4. **Impact style.** Marlow's impact is warm and photographic: 2 frames of orange glow with a horizontal anamorphic
   streak, then the wide. Our inked black-and-white frame is anime grammar, a stylistic choice to confirm with the
   user. The circular shock rings look cheap and should go or be replaced with air distortion.
5. **Colour.** Desaturate less (keep chroma around 12-15 in the highlights). Keep warm only on sparks, but stronger.
6. **Flurry clash misses.** The clashes at 11.08, 11.35 and 13.96 s still miss by 0.6-1.9 blocks. Those swing arcs
   need re-keying, not just correcting.
7. **Weapons.** The legendary-weapon render and grips read well and are a strength over the reference's plain iron
   swords. Wrist roll now allows sideways blocks.

## 6. Desert Arena SURVIVAL (Squared Media), first 20 s: weapon handling and body motion (2026-11-09)

Measured with the §1 pipeline: 11 shots, median 1.83 s (longer than Marlow), camera locked 20 %, push-ins at 8 %/s,
animated on ones at 30 fps. The pacing comes from motion inside the frame, not from cutting.
- **Weapons are big and read clearly.** Swords are about a character's height. They are flat pixel-extruded item
  models with dark edges, and characters dual-wield and flip to reverse grip.
- **The blade points with intent.** The handle sits deep in the fist and the blade direction follows the action:
  - Guard: upright and slightly forward.
  - Wind-up: cocked behind the shoulder or head.
  - Slash: sweeps across the body and finishes past the opposite hip.
  - Smash: driven down.
  - Thrust: level.
  - Relaxed: down and forward.
  The hand is always the pivot of the blade. This was the main error in fight test v1, where the blades were held at a
  fixed wrist angle and so lay horizontal.
- **Smears.** On fast swings the blade is drawn 2-4 times along its arc (multiples), on top of motion blur.
- **Bodies bend smoothly.** The limbs are Mine-imator-style bendy, with no hinge gap at elbows and knees. Feet stay
  planted on the ground, stances are wide and lunges very low. Bodies slide through the sand with dust plumes, and
  characters cartwheel and flip.
- **Light:** warm low sun, hard shadows, a sand bounce light and close depth of field.

What changed in fight test v2:
- **Rig:** a skinned bendy rig (`web/rig2.js`) with leg IK to planted feet, plus a pelvis drop so wide stances sit
  low instead of floating.
- **Footsteps:** a 240 Hz footstep planner with steps, skids, landings and a run flight phase.
- **Collision:** body-to-body and against the arena posts.
- **Motion:** spline motion through keys, with successive breaking from the hips down the arm chain.
- **Blade aiming:** blade intent per action. The rig solves wrist bend and roll so the hand aims the blade.
- **Weapons:** 1.15× size, 3 smear ghosts.
- **Environment:** footprints, sand dust on every step, blade-on-ground sand and sparks, desert light, closer
  handheld framing.
- **Sound pack:** built in `anim-test/sfx_pack/`, from the user's pack plus cuts from the study videos.

## 7. Meshing, skeletons, anatomy, lighting and weapon scale (2026-11-09)

Tools: `anim-test/tools/mesh_study.py`, `anatomy_study.py`, `motion_study.py` and `light_study.py`. The images are in
`anim-test/study_mesh/` (numbered 01-05, plus a per-clip `*_sheet.jpg` and `*_anat_sheet.jpg`).

**Meshing and skeletons.** Every frame of a 2.2 s fight window per video, plus our v1 and v4 over the same seconds,
went through YOLOv8 segmentation (silhouette, polygon outline, triangulated mesh) and YOLOv8 pose (17-joint skeleton).
These models are trained on humans. They catch Minecraft characters in:
- 52 % of Marlow frames, 57 % of Desert (duel), 45-56 % of our v4, and 7-14 % of Nuvguard, DFY and Wynncraft.

The misses are motion blur, extreme close-ups and silhouettes, which is how those trailers are shot. The skeletons are
good enough to read pose and facing on single frames. They are **not** stable enough to measure smoothness: tracks
break after 5-7 frames. So the motion smoothness of our renders was measured exactly from the rig instead.

**Anatomy (front/back, facing, movement).** Front/back comes from face visibility plus shoulder order (the character's
left shoulder on the image right means it faces the camera). Facing yaw comes from shoulder width against torso height.
Movement is hip travel relative to the facing direction.
- Marlow is mostly FRONT (32 of 54 detections), with only 1 front/back switch in 2.2 s. Characters are framed facing
  the lens or 3/4, and the camera holds a side of the body for a whole shot.
- Desert duel: FRONT 7, BACK 7, SIDE 2, with 2 switches. Profile and 3/4 views across the fighting line.
- Our v4 is mostly BACK (23 of 48) and SIDE (14), with **14 front/back switches** in the same 2.2 s (v1: 7). Our
  cameras orbit and cut around the fighters, so the audience keeps seeing backs and flipping sides. The references keep
  the faces.

**Lighting and shadows** (`02_lighting_*.jpg`):

| scene | key/fill | shadow edge | shadow tint | highlight tint |
|---|---|---|---|---|
| Marlow fight | 11.6 (very high contrast) | 78 px (fog-soft) | cool blue | neutral |
| Nuvguard combat | 3.3 | 14 px | slightly cool | neutral |
| Die For You fight | 10.0 | 9 px | neutral | warm |
| Wynncraft cinematic | 67 (silhouette) | 56 px | neutral | strongly warm (b +64) |
| Desert Arena | **1.5 (flat, bright)** | **5 px (hard sun)** | **warm (b +22)** | warm |
| OURS v1 snow | 1.6 | 7 px | cool | cool |
| OURS v4 desert | 1.8-4.3 | 7-9 px | **cool (b -7 to -16)** | warm |

What it shows:
- The references commit to one light idea per scene: very high contrast (Marlow, DFY, Wynncraft) or bright and hard
  (Desert). Ours sits in between.
- Desert's shadows are warm (sand bounce light). Ours are cool, because the blue sky fill wins. To match Desert,
  raise the warm ground bounce and lower the blue hemisphere light.
- Shadow edges are about right for hard sun (7-9 px against Desert's 5 px).

**Weapon scale** (`03_weapon_scale.jpg`), as blade length / character height:
- Marlow about 0.68, Desert one-handed about 0.72, Desert dual blades about 1.1.
- Ours: v1 0.93, v4 0.56 (after the 40 % cut).
- Suggested: **about 0.70** (weapon scale 0.69 → about 0.86).

**Weapon smoothness** (`04_swing_smoothness.png`). Exact per-frame blade rotation in v4 swings:
- Peaks of **112-131° in a single frame**, with large-small-large alternation (128 → 40 → 113).
- References: about 15-35° per frame spread over 4-6 frames, never far over 45° in one frame.

Causes:
1. The wrist aim solve (roll = atan2) flips 180° when the blade lines up with the forearm (gimbal singularity).
2. 'i' easing packs most of the arc into the final 1-2 frames.
3. Blade intents are interpolated as vectors through the arm-swing keys, so the direction can swing the long way round.

Fixes:
- Slerp the blade direction with a continuity-preserving roll (pick the roll nearest the previous frame).
- Cap the per-frame blade turn at about 40° and spread strikes over 4-6 frames.
- Keep 3 smear ghosts for anything above 25°/frame.

**Desert Arena, full 21 minutes.** 670 shots, median 1.67 s. Action shots run 0.93 s and calm shots 2.0 s. The camera
is locked in 18 % of shots, pans at 5.7 %W/s and zooms at 5.5 %/s. Ranked by in-frame motion, cut rate and loudness, the
top fight stretches are 15:00, 16:10, 18:20, 8:55 and 11:10 (`desert_fight_*.jpg`, `06_desert_fights_meshed.jpg`).

In those fights:
- **Weapons and silhouettes:** many weapon types (dual swords, sword and shield, flails on chains, axes, hammers),
  always gripped at the end of the handle. Silhouettes stay readable against the sand.
- **Camera:** very low, with bodies filling or crossing the frame, so the segmentation finds a clean full silhouette
  in only 3-8 % of frames.
- **Bodies:** they tilt 30-45° into lunges and go into rolls and falls.
- **Impacts:** small yellow 2D star sprites at contact, not full-frame flashes.
- **Holds:** short holds on key poses (about 0.3-0.5 s), then a burst of fast action.
- **Light:** warm sunset grade with a low rim sun and a haze layer. Later scenes are night (blue sky, torches).

### Old vs new: our fight test v1 → v4, measured against the references

| | v1 | v4 | references | verdict |
|---|---|---|---|---|
| limbs | rigid hinged boxes | one bendy skinned mesh, 6-bone spine, clavicles | Mine-imator-style bendy | ✔ fixed |
| feet / ground | sliding, sinking | IK planted, 99 % within 3 cm, R/L gait, 4-7 steps/s, no jitter | planted, stepping | ✔ fixed |
| body physics | none | body collision, blade/floor/body contact pushes | n/a | ✔ new |
| weapon grip | fixed 90° (horizontal) | aimed per action, edge leading | blade continues the forearm | ✔ fixed |
| weapon scale | 0.93× body | **0.56× (too small)** | 0.68-0.72× (dual up to 1.1×) | ✖ go to about 0.70× |
| weapon smoothness | jumpy | **112-131° single-frame flips** | 15-35°/frame | ✖ aim-solve singularity, needs fixing |
| camera shot length | 0.57 s | about the same | Marlow 0.52 s (action), Desert 0.93 s | Desert holds longer; add holds |
| camera stillness | never locked (0 %) | same | 18-26 % locked | ✖ add deliberate holds |
| facing the audience | 7 front/back flips in 2.2 s | **14 flips** | 1-2 | ✖ keep the camera on one side of the line; favour faces |
| shadow tint | cool | cool (b -7..-16) | Desert warm (b +22) | ✖ raise the warm ground bounce |
| impacts | inked B/W frame | same | warm glow/flare (Marlow), small 2D stars (Desert) | ✖ swap to the reference styles |

## 8. Root-cause analysis of test B (user review: "worse than v4"), before the rebuild

Measured on `newgen_fight_test_b1`:
1. **Spacing / clipping.**
   - Bodies are under 0.75 blocks apart (overlapping) in **26 %** of frames, and the minimum gap is 0.34.
   - A sword fight at 0.70× blade scale needs a gap of about 1.8-2.2 blocks (blade 1.4 plus arm 0.5).
   - The choreography placed attacker and defender on top of each other, and the clash "step-in" pulled them closer.
     Root collision (0.64 blocks) only stops the hips, while leaning torsos and arms pass through each other.
2. **The weapon is not driven by the hand.**
   - The arms were posed with free FK angles, and the blade was aimed separately by a wrist solve, so the hand and
     the weapon move independently. That is the "weapon not following hand movement" problem.
   - The style pass then bent the arms further after the blade aim was set.
3. **No fight logic.** Attacks were hand-placed keys with no rule tying a defender's block or dodge to the attacker's
   strike timing and line. There were no recovery windows, no reaction direction tied to the hit, and no reset of
   distance between exchanges.
4. **Legs bent in place at the start.** The style "sink" lowers the pelvis on every grounded frame, so the IK bends the
   knees even when the character is standing still.
5. **Camera.**
   - Cuts every 0.45-0.6 s and orbiting moves.
   - Shake on every contact plus a handheld drift layer.
   - 5-sample motion blur on all frames, which smears limbs during fast moves.
6. **Effects hide the motion.** Trails, 3 ghost copies, flares, shock rings, dust on every step, sparks on every
   ground scrape and a full-screen flash. Most of the readable motion is covered.

### Rebuild plan (fix at the source)
- **Arm IK with a rigid grip:**
  - Each pose gives the hand position (spherical, around the shoulder, in the chest frame) and a blade direction.
  - A 2-bone IK places the elbow, then the wrist bends and rolls within human limits (35-145°, ±100°) toward the
    blade direction. The blade therefore always follows the hand and forearm, and swings are hand arcs.
- **Fight director:** a beat list (attacker, move, defender response) expands into keys.
  - Each move has fixed phases: anticipation, then strike, then follow-through, then recovery.
  - The defender's block, parry or dodge is timed to the strike and placed on its line.
  - Hits push the target along the attack direction with matching torso and head reactions.
  - Spacing is held at an engagement gap of 2.0 blocks, with step-ins of 0.3-0.5 and resets between exchanges.
- **Calm camera:** a tracking shot from one fixed side of the fighting line, a few deliberate cuts (2-3 s), no shake,
  no orbit, and a light 3-sample blur.
- **Subtle effects:** a small spark at blade contact, small dust on hard landings and slides, no trails, ghosts,
  flashes or rings.

## 9. A/B investigation: why B regressed, and the v5 smoothing fix (2026-11-09)

Setup: v4 is kept untouched in the worktree `../v4base` (commit 2e723bd). Both versions get the same harness
(`anim-test/tools/ab_harness.py`: `?iso=1` locked side camera, `?novfx=1` every effect off, `window.__probe`), the same
choreography (scene a), the same rigs, sub=1 (no motion blur), and the same window (frames 114-270 = 3.8-9.0 s).
Clips are in `anim-test/out/ab/`; metrics come from `anim-test/tools/ab_metrics.js` (fighter A / fighter B, 0.2-19.8 s at 30 fps).

| metric | v4 | B-era code | v5 (sig=50, psig=30) |
|---|---|---|---|
| joint pops (>25 deg/frame^2), A/B | 515 / 519 | 517 / 545 | **53 / 87** |
| joint ang. accel p95, A/B | 32.9 / 33.8 | 33.4 / 35.9 | **12.5 / 13.6** |
| blade direction step p95 (deg/frame) | 48.2 / 50.7 | 39.7 / 33.7 | 33.7 / 33.4 |
| blade steps > 45 deg | 32 / 35 | 17 / 14 | 20 / 18 |
| root accel p95 | 8.18 / 7.44 | 3.6 / 3.6 | 4.35 / 4.56 |
| min gap between bodies | 0.57 | (B: 0.34, 26% overlap) | 0.46 |
| mean clash miss | 0.57 | - | 0.55 |

Findings for each suspect:
- **Retargeting:** none exists. No mocap is retargeted; every pose is hand-keyed FK angles plus leg IK. Retargeting can't be the cause.
- **Hierarchy/rest pose/pivots, local space:** unchanged between v4 and later versions (same rig2.js bones). The later
  arm IK (`P.hR`) works in the chest2 frame and was used only in scene C.
- **Blending conflicts:** yes, mild. After v4, the STYLE pass (lean/twist/elbows) was added *after* the LAG/aim
  stage, and the blade got its own 8-sample smoothing kernel while the arm stayed raw. The blade and the hand then disagree by
  a few frames, and the wrist absorbs it. That made the blade smoother but left the joints as jerky as before (pops 517/545).
- **Double root motion:** none. The root comes once from `evalPos` and is remapped by the 240 Hz sim; root accel actually fell.
- **Weapon-hand alignment:** grip offset is 0 in every version. The weapon is parented to the hand.
- **Motion blur / ghosting:** B's smearing comes from post effects, not the skeleton: sub=5 accumulation plus GHOSTS
  copies plus large slash arcs. With VFX on, effects cover 4% of the screen on average, 24% at p95 and up to 55% on
  impact frames (same in v4 and new). With VFX off, the B-era skeleton looks like v4.
- **Interpolation artifacts (the real root cause of the stiffness in v4 itself):** `evalKeys` eases each key segment
  on its own and zeroes tangents at 'i'/'o'/'lin' keys. Velocity therefore stops or jumps at almost every key, and those
  jumps are the pops (worst: rSh/rEl during slashes 4-6 s and 9-10 s, then the thighs and shins).

v5 fix (`anim-test/fight_v5/`: v4 choreography + v4 rig (`rig2_v4.js`), v4 code itself untouched; defaults sig=50, psig=30;
render: `PAGE=anim-test/fight_v5/index.html QS="?sub=1&iso=1&novfx=1" node render.mjs frames 114 270 out.mp4`): `choreo.js` gets two zero-phase Gaussian passes.
`evalKeysS` filters the key curve (sigma `?sig=` ms), and `pose()` filters the final pose: root, pelvis drop, IK foot
targets and joints (sigma `?psig=` ms). sig=0 reproduces v4 exactly. Sweep results (pops A/B): sig25 350/384, sig40
248/284, sig60 253/195, sig40+psig25 98/145, sig40+psig40 41/74 (rejected: bodies touch, gap 0.06), **sig50+psig30 53/87**.
Open: the first clash (4.2 s) misses by 0.41 vs 0.03 in v4, so the clash solver should be re-tuned for v5. Overlapping
action and weight still need work: smoothing removes the pops but doesn't add follow-through.

## 10. AnimationGPT preview verdict and the next system (2026-11-09)

User verdict on `anim-test/out/newgen_fight_agpt_preview_small.mp4`: the motion is smooth, but the implementation is bad:
the fighters swing at the air. Measured in QA (`tools/agpt_qa.js`): blade-to-blade miss at clashes is 0.35-1.0 blocks,
and the final hit misses by 1.2.

Why the fighters swing at the air: each generated clip is a solo performance. Its swing arc, reach and strike frame were
never aimed at an opponent. Turning and spacing a clip afterwards (`fight_agpt/choreo_agpt.js`) can line up one point at
best, never the arc. Better prompts would not fix this.

Decision: AnimationGPT stays a REFERENCE for how good combat motion is built, not a runtime source. We build our own moves
on our rig, contact first:
1. **Measure the references** (the 30 vetted clips in `mocap/fight20`, raw joints in `raw/*.npy`): phase timings
   (anticipation / strike / follow-through / recovery as % of the move), the hip -> chest -> shoulder -> elbow -> wrist delay
   (successive breaking, ms), weight shift and step timing against the strike, pelvis drop, and the hand speed profile.
   Output: a small table of motion "laws" per move type (horizontal, diagonal, overhead, thrust, parry, dodge, hit
   reaction).
2. **Parametric move generator on our rig:** each move = contact point + contact time + move type. The blade path is solved
   backwards from the contact (arm IK through wind-up -> contact -> follow-through points). The torso, legs and timing come
   from the measured laws, so the motion feels like the references but every swing is aimed at the opponent.
3. **Exchange solver:** the attacker's contact point comes from the defender's actual pose: the blade for a parry, the body for
   a hit, empty space for a dodge. Defender moves are built from the same contact.
4. **Isolated A/B gate** (same harness as section 9): blade miss at clashes < 0.1 block, foot slide ~0, joint pops at or
   below v5. Only then a full cinematic render.
