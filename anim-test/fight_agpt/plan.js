// The 20 s fight, built only from vetted AnimationGPT clips (mocap/fight20, see notes in tools/agpt_vet.py).
// Times are ACTION time; hit-stops (sync.stop) stretch scene time a little, so the scene runs ~1 s longer than PLAN.end.
// seg: [clip, at, a, b, opts]   opts.strike: `at` is when the clip's strike frame lands (strikeT overrides the vetted time)
//                               opts.face: extra heading (deg), opts.air: [t0,t1] airborne clip span, opts.scale: root motion
const s = (t, att, def, kind, o = {}) => ({ t, att, def, kind, ...o });
const ST = { run_attack__s7: 1.62, slash_diag__s1234: 1.48, overhead__s1234: 1.43, slash_lr__s1234: 1.32, thrust__s1234: 1.18,
  slash_h__s42: 0.68, light_attack__s1234: 1.32, slash_combo__s7: 0.88, slash_h__s1234: 1.32, slash_up__s1234: 1.52,
  jump_attack__s2024: 2.52, heavy_finisher__s1234: 2.23, parry__s1234: 1.18 };
const atk = (clip, at, pre, post, o = {}) => [clip, at, Math.max(0, ST[clip] - pre), ST[clip] + post, { strike: true, strikeT: ST[clip], faceAt: ST[clip], ...o }];
const par = (clip, at, pre, post, o = {}) => [clip, at, Math.max(0, (ST[clip] ?? 1.0) - pre), (ST[clip] ?? 1.0) + post, { strike: true, strikeT: ST[clip] ?? 1.0, faceAt: ST[clip] ?? 1.0, ...o }];

export const PLAN = {
  end: 19.3,
  start: { A: [-2.7, 0.2, 90], B: [2.7, -0.2, -90] },
  A: [
    ['walk4__s42', 0.0, 0.4, 2.6, { speed: 1.1 }],
    ['idle_guard__s1234', 1.95, 1.0, 3.0, { blend: 0.35 }],
    atk('run_attack__s7', 3.0, 0.75, 0.9, { scale: 0.75 }),                 // 2-5 s: first attack ...
    atk('slash_diag__s1234', 4.1, 0.6, 0.9),                                 //        ... second attack
    ['idle_guard__s1234', 4.85, 2.0, 3.0, { blend: 0.35 }],
    par('parry__s1234', 5.6, 0.55, 0.9),                                     // 5-8 s: blocks B's overhead
    ['parry__s2024', 6.25, 0.4, 1.4, { blend: 0.25, strike: true, strikeT: 0.8, at: 6.6 }],
    atk('thrust__s1234', 7.4, 0.55, 0.8),                                    //        counter thrust (B sidesteps)
    atk('slash_h__s42', 8.3, 0.45, 0.6, { speed: 1.15 }),                    // 8-12 s: exchanges
    par('parry__s1234', 8.95, 0.45, 0.45, { speed: 1.2 }),
    atk('slash_lr__s1234', 9.6, 0.5, 0.55, { speed: 1.15 }),
    ['dodge_back__s1234', 10.0, 0.0, 1.0, { blend: 0.15, speed: 1.2 }],
    atk('slash_combo__s7', 10.9, 0.55, 0.55, { speed: 1.1 }),
    ['parry__s2024', 11.25, 0.4, 1.2, { blend: 0.2 }],
    atk('slash_up__s1234', 12.0, 0.55, 0.8),                                 //        lands a cut: B staggers
    ['idle_guard__s1234', 12.75, 3.0, 4.2, { blend: 0.4 }],
    ['jump_attack__s2024', 13.25, 0.75, 3.4, { strike: true, strikeT: 2.52, faceAt: 1.0, at: 14.1, air: [1.0, 2.3], scale: 0.9 }],   // 12-16 s
    ['idle_guard__s1234', 15.6, 4.2, 6.0, { blend: 0.45 }],
    ['dodge_right__s2024', 16.95, 0.0, 1.1, { blend: 0.15, face: -10 }],      // 16-20 s: slips the finisher ...
    atk('slash_h__s1234', 17.75, 0.6, 1.1),                                  //        ... and lands the counter
    ['idle_guard__s1234', 18.55, 6.0, 7.5, { blend: 0.5 }],
  ],
  B: [
    ['walk4__s42', 0.0, 1.2, 3.4, { speed: 1.1 }],
    ['idle_guard__s1234', 1.9, 0.5, 2.6, { blend: 0.35 }],
    ['dodge_back__s7', 2.72, 0.0, 1.5, { blend: 0.15 }],
    ['dodge_left__s1234', 3.8, 0.35, 1.7, { blend: 0.15, air: [0.9, 1.05] }],
    atk('overhead__s1234', 5.6, 0.85, 0.75),                                 // 5-8 s: B attacks
    atk('slash_lr__s1234', 6.6, 0.6, 0.6),
    ['dodge_right__s2024', 7.15, 0.0, 1.0, { blend: 0.15 }],
    par('parry__s1234', 8.3, 0.45, 0.4, { speed: 1.15 }),                    // 8-12 s
    atk('light_attack__s1234', 8.95, 0.55, 0.45, { speed: 1.2 }),
    ['parry__s2024', 9.3, 0.4, 0.9, { blend: 0.2 }],
    atk('thrust__s1234', 10.25, 0.5, 0.45, { speed: 1.1 }),
    par('parry__s1234', 10.9, 0.45, 0.35, { speed: 1.1 }),
    atk('slash_h__s1234', 11.5, 0.6, 0.35, { speed: 1.1 }),
    ['hit_light__s1234', 12.0, 0.0, 1.6, { blend: 0.08 }],
    ['step_back__s7', 12.75, 0.4, 1.9, { blend: 0.3 }],
    ['parry__s42', 13.7, 0.2, 0.9, { blend: 0.25 }],
    ['hit_heavy__s3', 14.18, 0.0, 2.6, { blend: 0.08 }],                     //        knocked back by the jump attack
    ['idle_guard__s1234', 16.2, 1.0, 2.0, { blend: 0.45 }],
    atk('heavy_finisher__s1234', 17.2, 1.15, 0.45),
    ['hit_heavy__s3', 17.75, 0.0, 2.2, { blend: 0.08 }],                     //        final stagger
  ],
  sync: [
    s(3.0, 'A', 'B', 'dodge', { dist: 2.4, swing: true }),
    s(4.1, 'A', 'B', 'dodge', { dist: 2.2, swing: true }),
    s(5.6, 'B', 'A', 'clash', { dist: 2.05, stop: 0.017, big: true }),
    s(6.6, 'B', 'A', 'clash', { dist: 2.05, stop: 0.012 }),
    s(7.4, 'A', 'B', 'dodge', { dist: 2.3, swing: true }),
    s(8.3, 'A', 'B', 'clash', { dist: 2.0, stop: 0.011 }),
    s(8.95, 'B', 'A', 'clash', { dist: 2.0, stop: 0.011 }),
    s(9.6, 'A', 'B', 'clash', { dist: 2.0, stop: 0.011 }),
    s(10.25, 'B', 'A', 'dodge', { dist: 2.3, swing: true }),
    s(10.9, 'A', 'B', 'clash', { dist: 2.0, stop: 0.011 }),
    s(11.5, 'B', 'A', 'clash', { dist: 2.0, stop: 0.012 }),
    s(12.0, 'A', 'B', 'hit', { dist: 1.75, stop: 0.017 }),
    s(14.1, 'A', 'B', 'clash', { dist: 2.0, stop: 0.022, big: true, ramp: 0.9 }),
    s(17.2, 'B', 'A', 'dodge', { dist: 2.2, swing: true }),
    s(17.75, 'A', 'B', 'hit', { dist: 1.75, stop: 0.019, big: true }),
  ],
  slow: [[17.62, 18.3, 0.5]],
  track: { A: 0.6, B: 0.6 },
  camSide: 1,
  // [scene time, label, {d0,d1 distance, h0,h1 height, a0,a1 angle off the perpendicular (deg), f0,f1 fov, lookH, lookL}]
  shots: [
    [0.0, 'est', { d0: 11, d1: 8.6, h0: 2.4, h1: 1.8, a0: -28, a1: -16, f0: 36, lookH: 1.0 }],
    [2.45, 'side', { d0: 7.2, d1: 6.6, h0: 1.3, a0: -12, a1: -6, f0: 38 }],
    [5.35, 'three4', { d0: 6.2, d1: 5.8, h0: 1.5, a0: 30, a1: 24, f0: 38 }],
    [8.45, 'side2', { d0: 6.4, d1: 6.0, h0: 1.15, a0: -6, a1: 6, f0: 37 }],
    [12.75, 'low', { d0: 7.6, d1: 7.0, h0: 0.45, h1: 0.6, a0: -22, a1: -12, f0: 40, lookH: 1.3 }],
    [16.6, 'final', { d0: 6.6, d1: 4.8, h0: 1.4, h1: 1.25, a0: 14, a1: 30, f0: 36, f1: 32 }],
  ],
  whiffs: [],
};
