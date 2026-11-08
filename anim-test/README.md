# anim-test: 3D Minecraft animation test (three.js)

Real-time 3D test clip using the user's skins (`src/skins/1-3.png`) and two legendary weapons exported from the
`.bbmodel`. A runs in, leaps into an overhead strike that B blocks, ducks B's horizontal slash, and thrusts. B is
knocked back to one knee while C cheers from the ruin. Both charge and cross, and B falls to his knees. 9.5 s.

- `web/world.js`: procedural voxel world with original 16x16 textures and per-vertex AO (Minecraft smooth lighting).
- `web/rig.js`: jointed skin rig. Limbs split at elbows and knees, the torso splits at the waist, plus a wrist for the
  weapon. Includes the overlay layer and slim-arm detection.
- `web/anim.js`: run cycle, keyframed combat, the 13-shot camera list, and effects timing. Everything is a pure
  function of t.
- `web/scene.js`: golden-hour sun with soft shadows, a cool sky fill, a rim light, a camera-side fill, lantern point
  lights, fog, bloom, grade/vignette/flash, weapon trails and particles.
- `render.mjs`: headless Chrome render (uses the GPU through ANGLE). `tools/anim_sfx.py` builds the sound.

```bash
npm install                                     # three + playwright-core (uses the installed Chrome)
node render.mjs still 3.6,4.83                  # QA stills -> qa/
python tools/anim_sfx.py                        # SFX + sa.mp3 with suck-out -> comp/anim_audio.m4a
node render.mjs frames 0 285 comp/anim_video.mp4
ffmpeg -y -i comp/anim_video.mp4 -i comp/anim_audio.m4a -map 0:v -map 1:a -c copy -shortest comp/anim_master.mp4
bash ../toolkit/deliver.sh comp/anim_master.mp4 out/newgen_anim_test_v1.mp4
```
Weapons: `python anim-test/tools/export_weapon.py Aegisblade 22` (from the repo root).
