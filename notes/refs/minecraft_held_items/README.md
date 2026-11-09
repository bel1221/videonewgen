# Vanilla Minecraft held-item references (user, 2026-11-10)

In-game screenshots of the user's player (Bunn9) showing how items sit in the hand. **Use these for every future
weapon video.** They supersede the side-on archer stance used in `fight_w` bow v1.

| file | shows |
|---|---|
| `bow_1`, `bow_2`, `bow_3` | **Drawing a bow:** the bow is in the RIGHT (main) hand. BOTH arms are raised straight forward at the target, and the player faces the target squarely. The bow is canted diagonally (about 45°) in front of the chest, at shoulder height. |
| `bow_4`, `bow_5`, `bow_6` | **Bow idle:** the bow hangs from the right hand at the side, diagonal, limbs pointing forward and down. The arm is relaxed. |
| `sword_1`, `sword_2` | **Sword idle:** held in the right hand at hip height. The blade points forward and slightly down/out in the standard item-in-hand angle, flat side facing out. |

**User, on top of these:** vanilla's bow animation is "a bit off since it's 2D". Keep the vanilla posture as the base and
add our 3D physics:
- the string pulls back to the drawing hand
- the full-length arrow rides back with the string and rests on the handle
- the drawing hand (left, since the bow is in the right hand) coordinates with the string, nocking, drawing and releasing

So: vanilla posture, with 3D string, arrow and hands.
