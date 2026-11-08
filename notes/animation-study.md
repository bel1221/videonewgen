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
