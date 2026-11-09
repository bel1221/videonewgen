// ---- fight_w build helpers (shared by build_spear/hammer/bow)
const D = { A: {}, B: {} };                                         // persistent per-fighter overrides (spin offsets)
const K = (c, t, pose, e, d) => k(c, t, pose, e, { ...D[c], ...(d || {}) });
const SW = { rArm: [20, 0, -12], rElbow: [-30, 0, 0], wrist: 210 };   // sword trailing low while sprinting
const tw = (c, t0, t1, turns) => TWIRL[c].push([t0, t1, turns]);
const slide = (c, t0, t1) => SLIDES[c].push([t0, t1]);
const sprint = (c, t0, t1, from, to) => { RUN[c].push([t0, t1]); at(c, t0, from[0], from[1]); at(c, t1, to[0], to[1], 'lin'); };
const CANDS = { A: ['parryL', 'parryR', 'parryH', 'parryLowR', 'parryLowL'], B: ['parryL', 'parryR', 'parryH'] };   // defence poses fight.js may pick from
// a defence held from t0 to t1; fight.js re-chooses the pose from CANDS[def] by the real weapon geometry
const blk = (def, t0, t1, name, d1 = {}, d2 = {}, e0 = 'o') => { const b0 = { ...D[def] }; K(def, t0, L[name], e0, d1); K(def, t1, L[name], 'lin', d2);
  const k2 = T[def][T[def].length - 1], k1 = T[def][T[def].length - 2]; PARRY.push({ t: t1, def, cands: CANDS[def], apply: n => { k1[1] = S(L[n], { ...b0, ...d1 }); k2[1] = S(L[n], { ...b0, ...d2 }); } }); };
// an attack (wind-up key, strike key) that the defender blocks: names are pose names
const hit = (att, def, t, wind, strike, defName, big = false, wt = 0.16, dA = {}, dD = {}) => { K(att, t - wt, L[wind], 'o', dA); K(att, t, L[strike], 'i', dA); blk(def, t - wt + 0.02, t, defName, {}, dD); clash(t, big); };
const arrow = (tn, t0, t1, mode, extra = {}) => ARROWS.push({ tn, t0, t1, mode, ...extra });
function near(a, ref) { while (a - ref > 180) a -= 360; while (a - ref < -180) a += 360; return a; }
function evalPosT(c, t) { const K_ = P[c].slice().sort((a, b) => a[0] - b[0]); return evalPos(K_, t); }
function face(c, t, ref = 0) { const o = c === 'A' ? 'B' : 'A', a = evalPosT(c, t), b = evalPosT(o, t); return near(Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI, ref); }
let BIND_C = [0, 0], SH = null;
