---
name: newgen-animate
description: Animate any NewGenMC character scene from a plain prompt (sword fights, duels, chases, dodges, hits, cheering crowds) with the project's own studio engine (anim-test/studio) in the house animation style, on the user's skins, legendary weapons and colosseum map, and render it to MP4. Use whenever the user asks to animate, choreograph, stage or render a fight or any character action for a NewGenMC video, or to change the motion of an existing studio scene. Never uses AnimationGPT/mocap clips.
---

# NewGen animate

You turn a prompt into a **beat script** (JSON); the studio engine generates every frame of motion from it. You never
key poses by hand and never import mocap. The engine is contact-first: each attack is solved backwards from where and
when its blade must land, so a parry really meets the blade, a hit really touches the body, and a dodge really makes the
swing miss.

**Hard rule from the user:** AnimationGPT is only an *example* of good combat animation. Never put its clips, poses or
joint data in a video. The style numbers it inspired live in `anim-test/studio/style.js`
(see `notes/animation-study.md` §11-§12).

## Files

| Path | What |
|---|---|
| `anim-test/studio/style.js` | The style: timing per power, body chain, spacing, reactions, idle life. Each number cites its study. |
| `anim-test/studio/engine.js` | Script -> motion: spacing/footwork planner, contacts, swings, blocks, dodges, hits, foot planting, pelvis drop. |
| `anim-test/studio/scene.js` + `index.html` | Render page (world, light, calm camera, motion blur, sparks/hurt tint/smear) and `qa()`. |
| `anim-test/studio/scripts/*.json` | Beat scripts. `demo.json` (voxel meadow) and `demo_colosseum.json` are worked references. |
| `anim-test/tools/mca2obj.py` | Converts a Minecraft world region to `fight/assets/colosseum/B.glb` + heightmap (already done; gitignored). |

## 1. Prompt -> beat script

```json
{
  "title": "...", "prompt": "<the user's words>", "chapter": "02 — RANKED", "world": "colosseum" | "voxel", "end": 7.0,
  "cast": {
    "A": { "skin": 1, "weapon": "aegisblade", "start": [-2.3, 0.2] },
    "B": { "skin": 2, "weapon": "veilblade",  "start": [ 2.3, -0.2] },
    "C": { "skin": 3, "role": "crowd", "start": [1, 4.2], "target": "A" }
  },
  "beats": [ { "t": 1.9, "who": "A", "do": "slash", "dir": "diag", "power": "medium", "vs": "parry" }, ... ],
  "camera": { "side": 1, "shots": [ { "t": 0, "type": "side" }, { "t": 3.4, "type": "low", "angle": -20 } ] }
}
```

- **Cast.** `skin`: 1-3 = `anim-test/src/skins/N.png`, or a path to any 64x64 skin. `weapon`: a file in
  `anim-test/fight/assets/w/` (aegisblade, veilblade, thundermaul, "ocean sword"); more come from the `.bbmodel` via
  `tools/export_weapon.py`. Positions are blocks; the colosseum arena centre is (0,0), sand is flat to about ±35 x ±20.
- **Attacks** (`t` = the moment of contact): `slash` with `dir` = `h` (forehand), `lr` (backhand), `diag`,
  `diag_down_right`, `rising`, `diag_up`, `diag_up_right`; `overhead`; `thrust`; `jump_attack` (leap + overhead, `leap`,
  `height`). `power`: `light` | `medium` | `heavy` (heavy = two-handed, longer wind-up, deeper sink, bigger knockback).
- **Defender response** `vs`: `hit` (`knock` multiplier), `block`, `parry` (active, meets the blade), `dodge_back`,
  `dodge_left`, `dodge_right`, `duck`, `none` (swing at air).
- **Footwork:** `approach` / `retreat` / `charge` (`gap`, `dur`), `circle` (`angle` deg, `dur`), `step` (`by`: [left, fwd]),
  `move` (`to`: [x, z]). Attackers also close distance by themselves before an attack.
- **Other actions:** `cheer`, `taunt`, `kneel`, `fall`, `guard`, `idle` (`dur`).
- **Camera:** shot `type` = `side` (default, one side of the fighting line), `three4`, `low`, `close` (`on`: a cast id);
  optional `dist`, `height`, `angle`, `fov`, `push` (default 4 %/s), `drift`. Keep cuts few: 2-3 s shots, never orbit.

**Timing a script** (the engine warns if you break these):
- One character's attacks need about `antic + hold + strike + follow` between contacts: light 0.5 s, medium 0.7 s,
  heavy 1.0 s. A combo is just consecutive beats at those spacings.
- A defender needs its reaction window: block/parry starts 0.26-0.30 s before contact, dodge 0.28 s, and a hit reaction
  runs 0.75-1.2 s afterwards.
- Leave about 1 s at the start for the approach, and end about 1.5 s after the last contact.
- House rules still apply: 50 s or less, no still frames (the engine keeps idle life on), effects never cover text.

## 2. Check, look, render

From `anim-test/` (Windows: Chrome at its default path; `npm ci` once):
```bash
PAGE=anim-test/studio/index.html QS="?script=/anim-test/studio/scripts/NAME.json&sub=1" node render.mjs eval "qa()"
PAGE=anim-test/studio/index.html QS="?script=/anim-test/studio/scripts/NAME.json&sub=1" QADIR=qa/studio node render.mjs still 1.0,2.5,4.0
PAGE=anim-test/studio/index.html QS="?script=/anim-test/studio/scripts/NAME.json&sub=5" node render.mjs frames 0 F out/NAME_v1.mp4
```
(PowerShell: `$env:PAGE='...'; $env:QS='...'` before `node render.mjs ...`.) `F` = end x 30. `&iso=1` gives a locked
side camera and `&novfx=1` turns effects off, for A/B tests.

**QA gate before any full render** (`qa()` returns these):
- `warnings` empty (timing overlaps, out-of-range contacts).
- `contacts[i][4]` (miss, blocks) < 0.1 for clash and hit; whiffs should pass where the dodger was.
- `blade` max deg/frame through each strike between 15 and 45 (reference 15-35).
- `feet` (slide per planted frame) < 0.01; `minGap` > 1.2 unless a grapple is intended; `pops` low and not rising
  against the previous version.
- Then look at stills of every contact and the frames in between. Numbers passing is not enough.

## 3. When a prompt needs a move the engine doesn't have

Add it to the engine, not to the script: a root-plan branch in pass 1 of `engine.js` (spacing, displacement, drops,
forced steps, a segment), and a segment branch in pass 3 (hand target + blade direction in the root frame, torso
twist/lean, head). Reuse the style numbers; if a new number is needed, put it in `style.js` with its source (a
reference video timestamp or a measured study). Then add a script that exercises it and pass the QA gate.

## 4. Sound and delivery

`node render.mjs eval "events()"` returns the engine's `contacts` (t, kind, act, power, big) and footstep `steps`.
Build the SFX bed from those times with the project's sound
rules (no SFX more than twice, no banned files; see CLAUDE.md), mix, then `toolkit/deliver.sh`. Remind the user to push.
