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

## Legs crossing (user, test 1 review, 2026-11-10): FIXED 2026-11-11, notes §20
ANY crossing makes the movement look poorly done. **Measure it with `tools/cross_qa.js`** (a foot or knee past the other
leg's line in the pelvis frame, even without touching; `phase_qa.js` only catches legs passing through each other).
Target: 0 crossed samples. Fix: `tools/patch_nocross.pl` (shared planner, `XMIN = 0.22` minimum gap between the feet).

## Grip rules (user, bolt30 review, 2026-11-11; details in notes §23)
- **Never force a grip.** If the hands are pulled apart and the weapon is out of reach, the support hand lets go and does
  not re-grab every frame. Applies to every two-handed weapon and to the bow's string hand. Measure with `tools/hand_qa.js`.
- **Spear: two hands only for a lunge or stab,** never all the time.
- **Open (user on bolt30 v2: "good", but):** the EMPTY hand must not always be raised. A free hand held up all the time
  looks poorly done. Give the off hand a relaxed, lowered carry by default and raise it only for balance or reactions.
