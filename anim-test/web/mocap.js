// Mocap clips from tools/motion2rig.py (AnimationGPT text-to-motion, retargeted). Poses use the applyPose() format of
// rig.js / rig2.js, so a clip can be played as-is or blended with hand-keyed poses from anim.js / choreo.js.
//   const clip = await loadClip('/anim-test/mocap/test_overhead.json');
//   applyPose(ch, sampleClip(clip, t, { at: [x, z], yaw: 90, speed: 1 }));
const LIST_KEYS = ['waist', 'chest', 'head', 'rArm', 'rElbow', 'lArm', 'lElbow', 'rLeg', 'rKnee', 'lLeg', 'lKnee', 'tilt', 'pos', 'pelvis'];

export async function loadClip(url) { const r = await fetch(url); if (!r.ok) throw new Error(`mocap ${url}: ${r.status}`); return r.json(); }

// t in seconds from the clip start (clamped). opts: at [x,z] start offset, yaw (deg, turns the clip about its start),
// speed (time scale), wrist / roll (weapon grip, not in the mocap), loop.
export function sampleClip(clip, t, opts = {}) {
  const F = clip.frames, n = F.length, dur = (n - 1) / clip.fps;
  let tt = t * (opts.speed ?? 1);
  tt = opts.loop ? ((tt % dur) + dur) % dur : Math.max(0, Math.min(dur, tt));
  const u = tt * clip.fps, i = Math.min(n - 1, Math.floor(u)), j = Math.min(n - 1, i + 1), w = u - i;
  const a = F[i], b = F[j], p = {};
  for (const k of LIST_KEYS) if (a[k]) p[k] = a[k].map((v, m) => v + (b[k][m] - v) * w);
  p.yaw = a.yaw + (b.yaw - a.yaw) * w;
  if (opts.yaw) {
    const c = Math.cos(opts.yaw * Math.PI / 180), s = Math.sin(opts.yaw * Math.PI / 180), [x, y, z] = p.pos;
    p.pos = [c * x + s * z, y, -s * x + c * z]; p.yaw += opts.yaw;
  }
  if (opts.at) { p.pos[0] += opts.at[0]; p.pos[2] += opts.at[1]; }
  p.wrist = opts.wrist ?? 160; p.roll = opts.roll ?? 0;
  return p;
}

// blend two poses (e.g. ease from a hand-keyed pose into the clip): u = 0 -> a, 1 -> b
export function blendPose(a, b, u) {
  const o = { ...b };
  for (const k of LIST_KEYS) if (a[k] && b[k]) o[k] = a[k].map((v, m) => v + (b[k][m] - v) * u);
  for (const k of ['yaw', 'wrist', 'roll']) if (a[k] != null && b[k] != null) o[k] = a[k] + (b[k] - a[k]) * u;
  return o;
}
