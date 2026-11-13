# Fight animation standard (permanent; the user's own words, 2026-11-10)

**Read this before any fight, duel or combat animation work, and check every item before showing a render.**
It overrides older notes wherever they conflict. Reference for good combat scenes: v8 (`anim-test/fight_v8`, 30 s).

## The user's prompt (verbatim)

> fighting animation could be fast but it needs to also be clear, no frame jumps and less half second camera angle change,
> weapon has to have unique motion that follows the player's arm, the fight has to be fast paced with alot of movement based
> mechanics like sliding, dodging,blocking, parrying and attack techniques like jump attack with 2 handed sword plunging down
> on the enemy or stabbing at the enemy, the physics has to make sense, no phasing or collision issue, badly implemented
> stance or player bouncing or shaking issues that repeat throughout the video, close up fight scenes are good there can be
> multiple camera angle changes to make it look dramatic, zooming into player showing off like twirling sword or spinning the
> bow are a fine touch, character interactions feel less controlled. The attack sequences lack readable transitions, proper
> spacing, and convincing contact,
>
> fight scenes can have these
>
> 1. Idle to movement transitions.
> 2. Running and strafing.
> 3. Basic sword swings.
> 4. Heavy sword attacks.
> 5. Attack anticipation and follow-through.
> 6. Blocking and counterattacking.
> 7. Hit reactions and knockback.
> 8. Recovery and repositioning.
> 9. Complete attack combinations.
>
> the players are also poorly done they must have
>
> * Proper shoulder and torso rotation.
> * Natural elbow and wrist articulation.
> * Correct sword grip and orientation.
> * Distinct attack preparation.
> * Controlled acceleration through the swing.
> * A believable sword trajectory.
> * Proper follow-through.
> * Natural recovery and repositioning.
> * Consistent weapon alignment throughout the animation.
>
> and most importantly the movement
>
> * Body mechanics: Arms, shoulders, torso, hips, and legs must work together instead of moving independently.
> * Weight distribution: Characters must have believable balance, momentum, acceleration, and deceleration.
> * Sword swinging: Improve shoulder rotation, elbow articulation, wrist movement, swing arcs, and follow-through. Attacks
>   should have weight and purpose.
> * Footwork: Eliminate foot sliding, floating, awkward leg positioning, and unnatural transitions.
> * Combat movement: Dodges, strafing, lunges, jumping, blocking, and repositioning must feel responsive and coordinated.
> * Hit reactions: Characters must physically react to impacts with appropriate body movement, direction, and recovery.
> * Transitions: Eliminate robotic snapping, sudden pose changes, stiff movement, and unnatural animation blending.
> * Secondary movement: Add subtle head movement, torso reactions, and natural body follow-through.

## The review this came from (fight_w spear/hammer re-render and v8)

What the user named as wrong:
- **Spear video:** at the start, both fighters bounce in place, and both hold a weird forward-leaning pose (screenshot: A
  bent far forward with the sword raised behind the head).
- **Running in "sucks":** they look like they're gliding again, and the legs phase through the ground.
- **Hammer video at about 2 s:** they bounce into the fight, and it "looks disgusting".

What v8 got right: good combat scenes, lots of movement, fast sword clashing and blocking, good ideas like being pushed
back by the enemy.

What v8 still gets wrong:
- a little player bouncing
- skipped scenes: one action, then a sudden jump to a different action

Shaking is fixed (the gait overlay is marked BAD, notes §17.1).

**Status 2026-11-10 (notes §18):**
- **Fixed in the shared mechanics:**
  - bouncing (the planted-foot pelvis drop moved into the planner and smoothed)
  - legs through the ground (unreachable feet no longer sink the hips)
  - weapon flips at sprint start/end (arm cross-fade; spear 'charge' runs)
  - forward-leaning ready stance (`L.ready`/`L.spReady`; crouch is no longer the ready pose)
  - idle-to-run snap
- **Still to watch:** v8's scene skipping. Duel 40 uses fewer, longer shots (median 1.0 s) and only 3 impact inserts.

### First guesses at causes (NOT verified; check each one with measurements before changing anything)
- **Forward lean:** `L.crouch` (waist 34°, chest 12°, head -28°, y -0.42) is used as the "ready" pose and sprint start, and the
  run cycle adds waist 18° on top. Sprints may start from, and run inside, a deep forward crouch.
- **Bounce in place / bouncing into the fight:** several vertical terms stack:
  - the pelvis-drop clamp (hips lowered until planted feet are in reach)
  - the run gait's body bob (`yoff`)
  - pose `y` keys alternating between -0.1 and -0.4
  - breathing (`BR` windows add y)

  These may beat against each other during walks and slow advances. Measure the root's vertical velocity reversals per
  second, the same way the shake was measured.
- **Legs through the ground while running:** run gait swing height plus the pelvis drop and crouch `y` may push the knee and
  shin below the floor. The IK targets the sole only, so check the knee and shin heights against the floor.
- **"Scenes being skipped" (v8):**
  - pose keys often end an action on an `'o'` ease and start the next at a new pose 0.1-0.2 s later, with no transition
  - shots average about 0.5 s, with impact inserts and flash frames
  - together these read as jumps

  The user wants fewer half-second camera changes, and readable transitions.

## Hard rules learned from the duel-40 review (2026-11-10)
- **Phasing is checked with `anim-test/tools/phase_qa.js`.** It tests every point along each weapon against the wielder's OWN head,
  torso and legs and against the opponent's body parts, arms against the own torso and head, the legs against each other, and the
  bodies against each other. `collide_qa.js` alone is NOT enough: it never tested a weapon against its own wielder or limbs against
  the body. The user caught a spear through its own wielder's head and an arm through its own chest.
- **Standing, idling and walking:** legs straight (knee about 10° idle), natural stance width (`pose.wide = 0`), no pelvis bob.
  Fighting stances may be wider, with a light bend.
- **Travelling during an exchange:** the feet must step (DRIFT gait). Never let the body slide over planted feet.
- **Minecraft proportions:** a raised hand reaches 31.5 px and the head top is at 32 px, so a shaft can never pass ABOVE the head.
  High blocks go forward-up, in front of the forehead.
- **Blades are held edge-up,** as in vanilla.

## Checklist before showing any fight render
Each item gets a measured check where possible (tools in `anim-test/tools/`):
- **No frame jumps or snapping:** joint angular acceleration, blade step, and pose-key gaps.
- **Camera:** few cuts under about 0.8 s; close-ups and drama are welcome.
- **No bouncing, shaking or wrong stance repeating** through the video. Measure root vertical reversals, hip sway and lean
  angle per second.
- **Footwork:** no foot sliding, floating or gliding. Feet stay planted while planted, and come back under the body after
  slides and at run starts. No legs through the floor.
- **No phasing or collisions:** `tools/phase_qa.js` (own body, limbs, opponent) + `tools/collide_qa.js`, and convincing contact (clash miss mean).
- **No crossed legs:** `tools/cross_qa.js` = 0 crossed samples (one foot past the other's line).
- **Weapon follows the arm,** with grip and orientation consistent throughout.
- **Every attack has** anticipation, controlled acceleration, a believable arc, follow-through and recovery.
- **Hit reactions:** a direction, knockback and recovery.
- **Movement-based combat throughout:** sliding, dodging, blocking, parrying, jump plunges, stabs, strafing and running.
  Exchanges travel; never fight on the spot.
- **Readable transitions** between actions: idle to movement, attack to recovery, recovery to repositioning.
- **Secondary motion:** head, torso reactions, follow-through.
- **Held items as in vanilla Minecraft** (`notes/refs/minecraft_held_items/`), with our 3D physics on top.

## Weapon weight (user, 2026-11-12)
The user: weapons are grouped light / medium / heavy by their size and width against the player model, "and it will affects the
player"; then "link the weight + physics to animation making".
- The class of every weapon and what it does to the wielder (wind-up, recovery, run speed, combo length, knockback given and
  taken, twirls) live in `anim-test/gripref/weapons.json` (`weightClasses`) and reach the builds as `fight_w/weapon_data.json`.
- **Every new fight build declares its weapons (`weapons(a, b)`) and takes its timings from the w-helpers** (`whit`, `wsprint`,
  `wknock`, `wtw` in `fight_w/parts/common_w.js`). Hand-keyed moves must stay inside the same class numbers.
- **Measure it with `tools/weight_qa.js`:** 0 fails before showing a render. A heavy weapon never twirls and never runs or chains
  hits like a sword.

## Legs crossing (user, test 1 review, 2026-11-10): FIXED 2026-11-11, notes §20
ANY crossing makes the movement look poorly done. **Measure it with `tools/cross_qa.js`** (a foot or knee past the other
leg's line in the pelvis frame, even without touching; `phase_qa.js` only catches legs passing through each other).
Target: 0 crossed samples. Fix: `tools/patch_nocross.pl` (shared planner, `XMIN = 0.22` minimum gap between the feet).

## Duo 40 v1 review (user, 2026-11-12): "its very bad, the physics are all messed up"
The user's words, in full: "its very bad, the physics are all messed up i saw arrow gliding on the floor even though it already
hit the floor, from now on 2handed weapons attacks are fixed to using 2 hand grip only letting go due to an enemy's attack or have
to use the weapon for something else like throwing it or running motion ( running should be 1 hand so it doesnt look awkward )
also the problem about 1 hand always raising up when using a 2 handed weapon is still there it has no free motion and stays raised
up for too long, the bow's grip is still wrong it's supposed to be holding the handle with the string facing the player like in
the grid image, make hand have more free motion and flows smoothly with each attack DO NOT RE RENDER THE VIDEO OR MAKE CHANGES
RIGHT NOW only fix the hand with 2 handed weapons and flowness".
- **PERMANENT RULE, replaces "spear: two hands only for a lunge or stab" below: a two-handed weapon ATTACKS with a two-handed
  grip.** The second hand lets go only (a) because of an enemy's attack (hit reactions, being knocked back), (b) when the weapon is
  used for something else (throwing it), (c) while RUNNING, which is one-handed so it does not look awkward.
- **The free hand must never sit raised.** It needs free motion that flows with each attack (counter-swing, follow-through), and
  it must not stay up for long.
- **Open, NOT fixed yet (the user asked for the hands only):**
  - an arrow glides along the floor after it has already hit the floor;
  - the bow grip is still wrong: the fist must hold the HANDLE with the STRING FACING THE PLAYER, as on the grid sheet;
  - "physics are all messed up" in general: ask what else, or go through the video shot by shot, before the next render.
- **Measured causes** (see CLAUDE.md, Duo 40): the spear and staff were two-handed 0-3 % of the time; `L.guard` holds the left arm
  at [-38, 0, 24] / elbow -64 and the engine multiplied it by 1.25, so every guard-derived pose kept the free hand up at the chest.

## v8x part-by-part review (user, 2026-11-13)
The user's words on the first full v8x render: "the swords are moving too quickly making it hard for viewer to actually see whats going
on in the fight, it looks like theyre just swinging their sword around and not clashing with eachother". Then, building it in parts of
5-8 s: "the fighters on first exchanges are too close to eachother, it makes the sword have no space to actually attack them and sword
can overlap with player easily", "skid apart also too short", "impact frame should show the actual frame of the sword hitting", and on
part 1 v2: "the swords are like jittering when theyre raising their sword up for clashing ... i want to see more motions where swords
are clashing below their head, most of the videos so far all of the fighting are done when the sword is above the players head, re
position the sword and the player for fightings when the swords are at head level or chest level".
- **Clashes belong at head or chest level, not above the heads.** Measure the contact height (third number of each `CLASHES` entry;
  head top = 1.6 blocks, chest about 0.8-1.2). `clash(t, big, kind, { hmin, hmax })` makes the solver keep it in that band.
- **Space at the hit:** about 2.1 blocks root to root, so the blades meet mid-blade (`{ gap, fwMax }` on the clash). Closer than about
  1.9 the attacker's forearm reaches the defender's blade.
- **Measured causes of the jitter** (`anim-test/qa/v8x/jitter_probe.js`, blade direction change per 1/60 s):
  - the blade-is-solid push-out in `rig2_w.js` is not smoothed in time: a blade near the wielder's own head (the overhead `windR`), the
    floor or legs (the low sprint carry `SW`), or in the path of the opponent's sword arm gets thrown 60-128 degrees in one frame;
  - a cut keyed with the `'i'` ease lands in 2 frames, and a parry keyed `'o'` 0.14 s after the defender's own cut whips up in 2 frames.
- **What worked in part 1:** chest-level poses (wind-back out to the side, a cut that stops in front of the chest, a guard hand at chest
  height), an even-speed 0.3 s cut, the defender's sword travelling to the guard over the whole gap, hits 0.55 s apart.
- **Part 2 (same day):** "the fighter gets knocked back only a little and they takes too long to get back into the fight", and "apply
  fixes in part 1 so u dont have to fix things like that again for future parts apply all the fix each time we finish one".
  - The part-1 fixes are shared helpers at the top of `fight_w/parts/build_v8x.js`: `hit()` (chest-level cut into a guard, with a
    half-way key so the blade does not flip mid-swing), `knockTo()` (a 1.4-3 block slide that runs into the next move), `far()`, `SWm`,
    `midWind` / `midSweep` / `midCut` / `loParry`. Build every later part from these, and fold each part's fixes back into them.
  - **Root cause of every blade snap over 40 degrees: the push-out has no memory.** Proven with `?nopush=1` (no snaps at all). It is now
    limited to `PUSHCAP` degrees from the keyed direction (`rig2_w.js`, 14 for `vid=v8x`, 0 = unlimited for older videos); deeper overlaps
    are blocking errors and still show in `phase_qa.js`.
  - Blade intent `bd` is blended in a straight line between keys: never key two blade directions more than about 100 degrees apart
    back to back (wind-back -> cut, cut -> wind-back, high block -> skid); put a key in between.
  - `qa/v8x/part_check.mjs` does QA + clash distance/height + jitter probe + stills + the part render in one page load.
- **Footwork (user on part 2 v1): "LEGS not moving wide enough again theres a bunch of small steps that make the movement looks cursed
  god damn it we fixed this before".** The earlier fix (DRIFT footwork, `assemble_w.py`) only works inside a gait window. Any `at()`
  travel outside a RUN / WALK / DRIFT window is walked by the reactive planner: one tiny step each time a foot falls 0.17 blocks
  behind. v8x's choreography (v8's body) never declared any, and parts 1-2 were first rebuilt without them.
  - First attempt (superseded): per-fighter `step()` gait windows. They hid the problem from the probe more than they fixed it: every
    window re-planted BOTH feet at once when it began (a hop), took a 0.05-0.25 block first step, and re-planted both again at its end;
    the first `steps_probe.js` skipped gait-window contacts, so it reported 2 small strides where there were about 10 per fighter.
  - **Fix that stands (user: "fix the not right part"): STEP PLANNER 2 in `assemble_w.py` (v8x; use it for every new fight).** All
    ground time outside a sprint, a slide or a jump is stepped automatically, nothing to declare in the build: one foot at a time; a
    foot steps when it is 0.34 blocks from where the pose wants it (0.24 when coming to rest) or when the feet are about to stand in
    line / cross in the body frame over the next 0.25 s of turning; it lands where the body WILL be 0.16 s after landing, on its own
    side of the other foot. Sprints: no entry hop (feet hold until 0.2 s before their first running contact); no double re-plant
    after a slide. `?oldstep=1` = the old footwork for a before / after.
  - A move faster than about 3.5 blocks/s still has to be a `RUN` window (`'charge'` keeps the pose's arms).
  - **Measure with `qa/v8x/steps_probe.js`** (inside `part_check.mjs`): strides under 0.35 blocks (sprint contacts included), contacts
    under 0.14 s apart (a sprint's cadence and two-footed landings not counted), median stride; and `cross_qa` must read 0.
  - Planner bugs met on the way, worth knowing: a per-tick "don't plant across" nudge accumulates during a spin unless it is applied
    to a copy of the planned target (feet flew 2.3 blocks); stepping while the other foot is still on sprint contacts crossed the legs.
- Work one part at a time and render only that part (`&solve=t0,t1` solves only that window's clashes; the page loads in about 2.5 min
  instead of 9). Do not re-render before the user asks.

## Grip rules (user, bolt30 review, 2026-11-11; details in notes §23)
- **Never force a grip.** If the hands are pulled apart and the weapon is out of reach, the support hand lets go and does
  not re-grab every frame. Applies to every two-handed weapon and to the bow's string hand. Measure with `tools/hand_qa.js`.
- **Spear: two hands only for a lunge or stab,** never all the time.
- **Open (user on bolt30 v2: "good", but):** the EMPTY hand must not always be raised. A free hand held up all the time
  looks poorly done. Give the off hand a relaxed, lowered carry by default and raise it only for balance or reactions.
