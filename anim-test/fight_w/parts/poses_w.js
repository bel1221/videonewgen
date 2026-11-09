// ---- fight_w weapon poses. lh = left hand on the shaft (two-handed IK), aimK = bow arm aims at the opponent (IK),
// rh = right hand on the bowstring (IK), draw = 0 (at the bow) .. 1 (at the jaw). bd = weapon axis in the torso frame.
// spear (Boltspear): side-on stance, two hands on the shaft; one-handed long jab; sweeps; shaft blocks
L.spGuard = S(G, { rLeg: [-30, 0, -8], rKnee: [36, 0, 0], lLeg: [22, 0, 8], lKnee: [24, 0, 0], waist: [12, -30, 0], chest: [4, -16, 0], head: [-8, 34, 0],
  rArm: [-46, 0, -14], rElbow: [-58, 0, 0], lh: 1, y: -0.2 });
L.spWind = S(L.spGuard, { rArm: [-24, 0, -18], rElbow: [-92, 0, 0], chest: [0, -34, 0], waist: [8, -34, 0], head: [-6, 50, 0], y: -0.24 });
L.spThrust = S(G, { rLeg: [-62, 0, -6], rKnee: [52, 0, 0], lLeg: [36, 0, 6], lKnee: [8, 0, 0], waist: [18, -10, 0], chest: [10, -6, 0], head: [-12, 16, 0],
  rArm: [-84, 0, -6], rElbow: [-8, 0, 0], lh: 1, y: -0.34 });
L.spJab = S(L.spThrust, { lh: 0, rArm: [-94, 0, -4], rElbow: [-2, 0, 0], lArm: [34, 0, 34], lElbow: [-20, 0, 0], waist: [16, -4, 0], chest: [8, -4, 0] });
L.spSweepW = S(G, { waist: [24, -50, 0], chest: [10, -40, 0], head: [-10, 60, 0], rArm: [-40, 0, -40], rElbow: [-40, 0, 0], lh: 1, rKnee: [60, 0, 0], lKnee: [50, 0, 0], y: -0.4 });
L.spSweep = S(G, { waist: [30, 30, 0], chest: [12, 30, 0], head: [-10, -40, 0], rArm: [-60, 0, 30], rElbow: [-20, 0, 0], lh: 1, rLeg: [-50, 0, -10], rKnee: [90, 0, 0], lLeg: [40, 0, 10], lKnee: [80, 0, 0], y: -0.55 });
L.spOverW = S(G, { rArm: [-170, 0, -20], rElbow: [-70, 0, 0], chest: [-12, -10, 0], waist: [-4, -10, 0], head: [-12, 10, 0], lh: 1, y: -0.12 });
L.spOver = S(G, { rArm: [-70, 0, -10], rElbow: [-14, 0, 0], chest: [24, -6, 0], waist: [22, -6, 0], head: [6, 6, 0], lh: 1, rLeg: [-44, 0, -6], rKnee: [60, 0, 0], lLeg: [22, 0, 6], lKnee: [40, 0, 0], y: -0.36 });
L.spBlock = S(G, { rArm: [-80, 0, -30], rElbow: [-50, 0, 0], chest: [0, -10, 0], waist: [6, -10, 0], lh: 1, y: -0.24 });
L.spBlockL = S(L.spBlock, { rArm: [-70, 0, 12], rElbow: [-62, 0, 0], chest: [0, 12, 0], waist: [6, 8, 0] });   // shaft angled across the other way
L.spBlockV = S(G, { rArm: [-66, 0, -24], rElbow: [-70, 0, 0], lh: 1, y: -0.22 });                                    // shaft upright in front
L.spBlockH = S(G, { rArm: [-160, 0, -24], rElbow: [-30, 0, 0], chest: [-6, 0, 0], head: [-16, 0, 0], lh: 1, y: -0.24 });
// sword low blocks (against sweeps at the legs)
L.parryLowR = S(G, { rArm: [-30, 0, -36], rElbow: [-24, 0, 0], chest: [8, -14, 0], waist: [12, -8, 0], rKnee: [56, 0, 0], lKnee: [46, 0, 0], y: -0.34 });
L.parryLowL = S(G, { rArm: [-40, 0, 26], rElbow: [-40, 0, 0], chest: [8, 18, 0], waist: [12, 8, 0], rKnee: [56, 0, 0], lKnee: [46, 0, 0], y: -0.34 });
// heavy two-handed hammer (golem_hammer): weight shows in long wind-ups, deep stances and follow-through
L.hmGuard = S(G, { rArm: [-40, 0, -22], rElbow: [-76, 0, 0], waist: [12, -20, 0], chest: [6, -12, 0], head: [-8, 28, 0], lh: 1, rLeg: [-26, 0, -10], rKnee: [40, 0, 0], lLeg: [22, 0, 12], lKnee: [30, 0, 0], y: -0.22 });
L.hmRest = S(L.relaxed, { rArm: [-14, 0, -16], rElbow: [-8, 0, 0], lh: 0, lArm: [6, 0, 10] });
L.hmWindO = S(G, { rArm: [-195, 0, -12], rElbow: [-56, 0, 0], chest: [-18, 0, 0], waist: [-10, 0, 0], head: [-16, 0, 0], lh: 1, rKnee: [30, 0, 0], lKnee: [24, 0, 0], y: -0.08 });
L.hmSlam = S(G, { rArm: [-72, 0, -6], rElbow: [-10, 0, 0], chest: [26, 0, 0], waist: [38, 0, 0], head: [-6, 0, 0], lh: 1, rLeg: [-56, 0, -8], rKnee: [80, 0, 0], lLeg: [30, 0, 8], lKnee: [60, 0, 0], y: -0.46 });   // hands stay above the sand: the head lands ON it
L.hmWindS = S(G, { rArm: [-60, 0, -60], rElbow: [-50, 0, 0], chest: [4, -60, 0], waist: [8, -34, 0], head: [-8, 60, 0], lh: 1, rKnee: [44, 0, 0], lKnee: [36, 0, 0], y: -0.26 });
L.hmSwing = S(G, { rArm: [-80, 0, 30], rElbow: [-14, 0, 0], chest: [10, 40, 0], waist: [12, 24, 0], head: [-8, -36, 0], lh: 1, rLeg: [-40, 0, -6], rKnee: [50, 0, 0], lLeg: [26, 0, 6], lKnee: [24, 0, 0], y: -0.3 });
L.hmUpperW = S(G, { waist: [30, -20, 0], chest: [16, -30, 0], rArm: [-20, 0, -30], rElbow: [-30, 0, 0], lh: 1, rKnee: [70, 0, 0], lKnee: [60, 0, 0], y: -0.5 });
L.hmUpper = S(G, { waist: [-10, 10, 0], chest: [-16, 10, 0], head: [-20, 0, 0], rArm: [-160, 0, -10], rElbow: [-20, 0, 0], lh: 1, y: 0.0 });
L.hmBlock = S(G, { rArm: [-120, 0, -36], rElbow: [-40, 0, 0], chest: [-4, -6, 0], lh: 1, y: -0.26 });
L.hmSweep = S(L.hmSwing, { y: -0.6, rKnee: [90, 0, 0], lKnee: [80, 0, 0], waist: [40, 24, 0], chest: [16, 40, 0] });   // low sweep at the legs
L.hmBlockL = S(L.hmBlock, { rArm: [-110, 0, 20], chest: [-4, 14, 0] });
L.hmBlockV = S(G, { rArm: [-60, 0, -26], rElbow: [-80, 0, 0], lh: 1, y: -0.24 });
L.hmSpin = S(G, { rArm: [-90, 0, -40], rElbow: [-10, 0, 0], chest: [0, -10, 0], lh: 1, y: -0.3 });
// bow (Voidbow, left hand): side-on archer stance; the bow arm aims by IK, the string hand draws to the jaw
L.bwIdle = S(G, { lArm: [-20, 0, 14], lElbow: [-24, 0, 0], rArm: [-10, 0, -12], rElbow: [-20, 0, 0], waist: [8, -10, 0], chest: [2, -6, 0], wrist: 160 });
L.bwNock = S(G, { yawOff: -62, aimK: 1, rh: 1, draw: 0.05, waist: [6, 0, 0], chest: [2, 0, 0], head: [-4, 58, 0], rLeg: [-20, 0, -14], rKnee: [24, 0, 0], lLeg: [16, 0, 14], lKnee: [20, 0, 0], y: -0.12 });
L.bwDraw = S(L.bwNock, { draw: 1, head: [-6, 60, 0] });
L.bwLoose = S(L.bwNock, { draw: 0, rh: 0, rArm: [-74, 0, -84], rElbow: [-12, 0, 0] });
L.bwBlock = S(G, { lArm: [-120, 0, 10], lElbow: [-40, 0, 0], rArm: [-110, 0, -20], rElbow: [-50, 0, 0], chest: [-6, 0, 0], y: -0.24 });
