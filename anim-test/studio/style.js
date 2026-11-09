// NewGen animation style: the numbers every generated move is designed to.
// Sources (notes/animation-study.md): REF = the 4 reference videos (§1, §2b, §11 frame reads + burst stats),
// DES = Desert Arena (§6, §7), AGPT = AnimationGPT used ONLY as an example of good combat motion (§11; no clip data).
// Units: seconds, blocks (1 block = 16 px; a character is 2 blocks tall), degrees.

export const FPS = 30;

// ---------------------------------------------------------------- swing timing per power (REF unless noted)
// antic  : guard -> cocked (wind-up)                       REF 0.17 (DFY flick) .. 0.6 s (NV coil); 3:1 anticipation:action
// hold   : parked at the cocked point (slow creep)         REF MD holds the raised weapon ~0.45 s with drift
// strike : cocked -> contact                              REF 3-5 frames (0.1-0.17 s); bursts FWHM 0.07-0.13 s
// follow : contact -> follow-through end                   AGPT 0.27 s; REF smear/settle 0.3-0.5 s
// settle : follow-through end -> back in guard
// wind/foll: arc degrees behind / past the contact; lunge: root travel toward the target; drop: pelvis sink (AGPT 0.25 cap)
export const POWER = {
  // quick: flurry strikes (REF MD fight: 2-4 frame inserts, action shots 0.3-0.5 s; DFY flick 0.17 s lift)
  quick:  { antic: 0.13, hold: 0.0,  strike: 3 / FPS, follow: 0.15, settle: 0.22, wind: 70,  foll: 55,  lunge: 0.06, drop: 0.05, twist: 0.4 },
  light:  { antic: 0.20, hold: 0.03, strike: 4 / FPS, follow: 0.22, settle: 0.32, wind: 95,  foll: 65,  lunge: 0.12, drop: 0.08, twist: 0.45 },
  medium: { antic: 0.34, hold: 0.07, strike: 5 / FPS, follow: 0.28, settle: 0.40, wind: 115, foll: 80,  lunge: 0.20, drop: 0.15, twist: 0.55 },
  heavy:  { antic: 0.52, hold: 0.14, strike: 5 / FPS, follow: 0.36, settle: 0.55, wind: 135, foll: 100, lunge: 0.32, drop: 0.24, twist: 0.65 },
};

// ---------------------------------------------------------------- body mechanics
export const CHAIN = { hips: 0.100, waist: 0.067, chest: 0.033 };   // successive breaking: lead (s) ahead of the hand. AGPT yaw lead ~100 ms
export const PLANT_BEFORE = 0.13;      // front foot lands this long before contact (AGPT ~133 ms)
export const DROP_LAG = 0.20;          // pelvis bottoms out this long after contact (AGPT +200 ms)
export const MAX_DROP = 0.26;          // never deeper (AGPT's deep crouches were the flaw)
export const IDLE_SINK = 0.02;         // soft knees in guard; NOT more (fight test B: legs bent in place)

// ---------------------------------------------------------------- blade
export const BLADE_DEG_PER_FRAME = [15, 35];   // REF 15-35 deg/frame over 4-6 frames; QA flags > 45
export const BLADE_SCALE = 0.86;               // §7: blade ~0.70x character height
export const BLADE_LEN = 27 * BLADE_SCALE / 16; // grip -> tip, blocks
export const SWEET = 0.62;                     // contact sits ~62 % along the blade

// ---------------------------------------------------------------- spacing (blocks between root centres)
export const GAP = { hit: 1.8, clash: 2.7, whiff: 1.9, guard: 3.0, close: 1.3 };   // clash: two 1.45-block blades crossing at ~60 %
export const BODY_R = 0.26;                    // torso capsule radius for hits

// ---------------------------------------------------------------- reactions
export const KNOCK = { quick: 0.2, light: 0.30, medium: 0.6, heavy: 1.1 };   // REF: knockback keeps travelling, not a flinch in place
export const RECOIL = { quick: 10, light: 14, medium: 22, heavy: 32 };      // torso recoil degrees
export const BLOCK_PUSH = { quick: 0.04, light: 0.06, medium: 0.12, heavy: 0.22 };
export const BLOCK_LOCK = { quick: 0.12, light: 0.16, medium: 0.24, heavy: 0.32 };   // how long a block holds the defender's root

// ---------------------------------------------------------------- life (REF: nothing is ever frozen)
export const IDLE = { breath: [1.4, 0.27], sway: [1.6, 0.19], shift: [0.016, 0.15], bob: [0.012, 0.31] };   // [amplitude, Hz]

// ---------------------------------------------------------------- footwork
export const STANCE = { lead: [0.15, 0.20], rear: [-0.13, -0.20] };   // root-frame sole offsets [x(left), z(fwd)] for a right-hander
export const GAIT = { walk: { dur: 0.30, lift: 0.10, every: 0.5 }, run: { dur: 0.19, lift: 0.18, every: 0.31 }, shuffle: { dur: 0.22, lift: 0.06, every: 0.4 } };

// ---------------------------------------------------------------- swing directions (clock in the plane facing the target)
// angle of the blade's travel at contact: 0 = toward the character's left (right-to-left forehand), 90 = down,
// 180 = toward the right (backhand), 270 = up. Thrust is its own path.
export const DIRS = {
  h: 0, horizontal: 0, rl: 0, forehand: 0,
  lr: 180, backhand: 180,
  diag: 40, diag_down: 40, diag_down_left: 40, diag_down_right: 140,
  overhead: 90, down: 90, chop: 90,
  rising: 270, up: 270, uppercut: 270, diag_up: 320, diag_up_left: 320, diag_up_right: 220,
};
