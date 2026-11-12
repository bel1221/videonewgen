// Generates the v8 remake ("v8x", 40 s): parts/build_v8x.js (v8's choreography, time-warped, with the user's cuts and a new ending),
// parts/camera_v8x.js, index_x.html, and the small patches fight.js / assemble_w.py need. Run from anim-test/.
const fs = require('fs');
const E = (file, pairs) => { let s = fs.readFileSync(file, 'utf8'); const NL = String.fromCharCode(10), CR = String.fromCharCode(13), crlf = s.includes(CR + NL); for (let [a, b] of pairs) { if (crlf) { a = a.split(NL).join(CR + NL); b = b.split(NL).join(CR + NL); } if (!s.includes(a)) throw new Error(file + ': ' + a.slice(0, 80)); s = s.replace(a, b); } fs.writeFileSync(file, s); };
const LN = 3.55, TOTAL = 37.75;

// ---------------------------------------------------------------- build
let L8 = fs.readFileSync('fight_v8/parts/build_v8.js', 'utf8').split(/\r?\n/);
const iEnd = L8.findIndex(l => l.startsWith("  for (const c of ['A', 'B']) { T[c].sort")); if (iEnd < 0) throw new Error('v8 sort line');
let body = L8.slice(3, iEnd);   // from "const D = ..." to just before the final sort
const drop = pre => { const i = body.findIndex(l => l.startsWith(pre)); if (i < 0) throw new Error('v8 line not found: ' + pre); body.splice(i, 1); return i; };
const swap = (pre, txt) => { const i = body.findIndex(l => l.startsWith(pre)); if (i < 0) throw new Error('v8 line not found: ' + pre); body[i] = txt; };
// the body's own helpers that the outer wrappers replace
drop("  const tw = (c, t0, t1, turns)"); drop("  const sprint = (c, t0, t1, from, to)");
swap("  const ex = (att, def, t, s, big = false, wind = 0.16)", body.find(l => l.startsWith("  const ex = (att, def, t, s, big = false, wind = 0.16)")).replace("const [w, sl, pa] = STRIKE[s];", "const [w, sl, pa] = STRIKE[s]; wind = Math.max(wind, 0.22);   // medium swords: a real wind-up (weight class)"));
// user: "at 17 second ... a dupe scene of the player doing a jump attack so remove that" = S8's hop-and-cut right after S7's jump slash
drop("  K('B', 17.56, L.sweepW"); drop("  K('A', 17.6, L.crouch"); drop("  blk('B', 17.86, 17.98"); drop("  K('A', 18.12, L.land");
// user: "at 20 second the players are hugging eachother for some reason so remove that too" = S9's blade lock and the shove out of it
{ const a = body.findIndex(l => l.startsWith("  at('A', 20.45, 1.9, 1.2); at('A', 20.78")), b = body.findIndex(l => l.startsWith("  at('A', 21.6, 2.95, 1.6); at('A', 22.05")); if (a < 0 || b < a) throw new Error('bind block');
  body.splice(a, b - a + 1, "  at('A', 20.45, 1.9, 1.2); K('A', 20.5, G); K('B', 20.5, G); K('A', 22.25, G); K('B', 22.25, G);   // (blade lock removed) they step round to the next exchange"); }
// six strikes in a row is over the medium class's combo of 3: the defender answers in the middle
{ const i = body.findIndex(l => l.includes("ex('A', 'B', t, FL[i], false, 0.15); }")); if (i < 0) throw new Error('flurry'); body[i] = body[i].replace("ex('A', 'B', t, FL[i], false, 0.15); }", "if (i === 3) ex('B', 'A', t, FL[i], false, 0.15); else ex('A', 'B', t, FL[i], false, 0.15); }"); }
// new ending (user): "the enemy gets stabbed in the chest and pulls sword out after"
swap("    at('B', FLASH, ...P_(0.8)); at('B', 26.85", "    at('B', FLASH, ...P_(0.95)); at('B', 27.14, ...P_(0.95)); at('B', 27.5, ...P_(1.4), 'o'); at('B', TEND, ...P_(1.4));");
swap("    at('A', 30, ...P_(-0.15));", "    at('A', 27.12, ...P_(-0.15)); at('A', 27.42, ...P_(-0.62), 'o'); at('A', TEND, ...P_(-0.62));");
swap("  K('A', 26.2, L.upperW, 'o'); K('A', FLASH, L.upper, 'i');", "  K('A', 26.2, L.windT, 'o'); K('A', FLASH, L.thrust, 'i', { pierce: 1 }); K('A', 27.12, L.thrust, 'lin', { pierce: 1, chest: [14, 4, 0] }); K('A', 27.36, L.windT, 'o'); K('A', 27.75, G, 'io');   // through the chest, held, then pulled out");
swap("  blk('B', 26.24, FLASH, 'parryR'", "  clash(FLASH, true, 'kick', { at: () => { const q = pose('B', FLASH + 0.02).pos; return [q[0], q[1] + 1.25, q[2]]; } });");
swap("  K('B', 26.5, L.hitBack, 'o', { y: 0.3 });", "  K('B', FLASH + 0.06, L.hitBack, 'o', { y: 0.04 }); K('B', 27.12, L.hitBack, 'lin', { y: 0.0, head: [14, 0, 0] }); K('B', 27.45, L.skid, 'o'); K('B', 27.95, L.knees, 'io');");
swap("  K('B', FALL_T, L.kneelG, 'o');", "  K('B', 28.6, L.fallen, 'o'); K('B', TEND, L.fallen);");
swap("  BR.A.push([26.6, 30]); BR.B.push([26.6, 30]);", "  BR.A.push([27.8, TEND]);");
swap("  K('A', 27.2, L.relaxed, 'io'); K('A', 27.55, L.twirlS", "  K('A', 28.3, L.flick, 'o'); K('A', 28.85, L.relaxed, 'io'); K('A', TEND, L.relaxed, 'io');   // flicks the blade clean, lowers it");
drop("  K('A', 28.55, L.flick, 'o');");
body = body.map(l => l.replace("const pa = evalPosT('A', 24.5), pb = evalPosT('B', 24.5)", "const pa = evalPosT('A', 24.62), pb = evalPosT('B', 24.62)"));
const build = `function buildAll() {
  // V8X = the v8 "blade masters" remake (user, 2026-11-12), 37.75 s of animation + 2 slow-motion moments = 40.0 s of video.
  // A = Aegisblade vs B = Veilblade, both at the reference sheet's size and grip (medium class). What changed against v8:
  //   + split-panel face intro like bolt30 (0-2.9 s), heads down, slowly looking up
  //   - the duplicate jump attack at 17 s (S8's hop-and-cut) and the blade lock at 20 s ("hugging") are gone
  //   + one new exchange (N1): run in, cut, riposte, a thrust that misses the face in slow motion, a kick into a slide
  //   + new ending: A ducks under the cut and runs B through the chest, holds, pulls the sword out; B drops; logo outro
  //   ~ every wind-up at least 0.22 s, no flurry over 3 hits (weight class), twirls only in the opening (user: once or twice a video),
  //     the free hand flows instead of sitting raised (assemble_w.py freeArm), no corner texts
  // v8's own scenes are kept as they were and moved in time by W8(); the body below is build_v8.js with the cuts above.
  weapons('aegisblade', 'veilblade');
  const LN = ${LN}, TEND = TOTAL - 0.8 - LN;                               // N1's length; the end of the animation in v8's own time
  const W8 = t => t < 17.9 ? t + 2.9 : t < 21.5 ? t + 2.1 : t < 24.58 ? t + 0.8 : t + 0.8 + LN;
  SLOWMO.push([27.0, 27.45, 0.25], [W8(26.38) - 0.12, W8(26.38) + 0.18, 0.25]);   // the close call, and the stab
  // ================= 0-2.9 face intro: both stand with their heads down and slowly look up =================
  k('A', 0, S(L.relaxed, { head: [30, 0, 0] })); k('A', 0.4, S(L.relaxed, { head: [30, 0, 0] }), 'lin'); k('A', 2.3, S(L.relaxed, { head: [-12, 0, 0] }), 'io'); k('A', 2.86, L.relaxed, 'io');
  k('B', 0, S(L.relaxed, { head: [32, 0, 0] })); k('B', 0.6, S(L.relaxed, { head: [32, 0, 0] }), 'lin'); k('B', 2.45, S(L.relaxed, { head: [-10, 0, 0] }), 'io'); k('B', 2.88, L.relaxed, 'io');
  BR.A.push([0, 2.9]); BR.B.push([0, 2.9]);
  // ================= v8, time-warped =================
  const wrap = o => ({ A: { push: (...ws) => ws.forEach(w => o.A.push([W8(w[0]), W8(w[1])].concat(w.slice(2)))) }, B: { push: (...ws) => ws.forEach(w => o.B.push([W8(w[0]), W8(w[1])].concat(w.slice(2)))) } });
  const noTw = p => (p === L.twirlS || p === L.twirlF);                    // twirls only in the opening (old time < 2.4)
  (function (k, at, clash, RUN, BR, PARRY, evalPosT, face, pose, FLASH, tw, sprint) {
${body.join('\n')}
  })((c, t, p, e, d) => k(c, W8(t), t > 2.4 && noTw(p) ? G : p, e, d), (c, t, x, z, e) => at(c, W8(t), x, z, e), (t, big, kind, extra) => clash(W8(t), big, kind, extra),
     wrap(RUN), wrap(BR), { push: r => PARRY.push({ ...r, t: W8(r.t) }) }, (c, t) => evalPosT(c, W8(t)), (c, t, ref) => face(c, W8(t), ref), (c, t) => pose(c, W8(t)), 26.38,
     (c, t0, t1, turns) => { if (t0 < 2.4) TWIRL[c].push([W8(t0), W8(t1), turns]); }, (c, t0, t1, from, to) => { RUN[c].push([W8(t0), W8(t1)]); at(c, W8(t0), from[0], from[1]); at(c, W8(t1), to[0], to[1], 'lin'); });
  // ================= N1 25.4-28.95 (new): run in, cut and riposte, the thrust at the face in SLOW MOTION, kick into a slide =================
  { const a = evalPosT('A', 25.38), b = evalPosT('B', 25.38), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const tA = wsprint('A', 25.42, a, [m[0] - ux * 0.78, m[1] - uz * 0.78]), tB = wsprint('B', 25.42, b, [m[0] + ux * 0.78, m[1] + uz * 0.78]);
    for (const [c, t1] of [['A', tA], ['B', tB]]) { K(c, 25.44, L.sprintGo, 'io', SW); K(c, t1 - 0.08, L.sprintGo, 'lin', SW); K(c, t1 + 0.06, G, 'io'); at(c, t1 + 0.04, ...evalPosT(c, t1)); }
    const t0 = Math.max(tA, tB);
    whit('B', 'A', t0 + 0.34, 'windR', 'slashR', 'parryL', { knock: false, rest: 'guard' });
    whit('A', 'B', t0 + 0.78, 'windO', 'slashO', 'parryH', { rest: 'guard', defRest: 'guard' });
    // the close call: B lunges at the face; A leans out of the line (slow motion 27.0-27.45), then kicks him away
    mv8('B', 'A', 26.72, 26.98, 1.7); K('B', 26.8, L.windT, 'o'); K('B', 27.3, L.thrust, 'i', { head: [-8, 4, 0] }); K('B', 27.48, L.thrust, 'lin'); K('B', 27.66, G, 'io');
    K('A', 27.0, G, 'io'); K('A', 27.24, L.dodge, 'o'); K('A', 27.46, L.dodge, 'lin'); lat8('A', 'B', 27.08, 27.34, 0.62);
    K('A', 27.5, L.kickW, 'o'); K('A', 27.68, L.kick, 'i'); K('A', 27.92, G, 'io'); clash(27.68, false, 'kick', { at: () => { const q = pose('B', 27.7).pos; return [q[0], q[1] + 1.2, q[2]]; } });
    K('B', 27.72, L.hitBack, 'o', { y: 0.08 }); K('B', 27.86, L.skid, 'o'); K('B', 28.3, L.skid, 'lin'); K('B', 28.5, G, 'io');
    at('A', 27.68, ...evalPosT('A', 27.68)); at('A', 28.9, ...evalPosT('A', 27.68)); { const q = evalPosT('B', 27.68), p = evalPosT('A', 27.68), ex_ = q[0] - p[0], ez = q[1] - p[1], e = Math.hypot(ex_, ez) || 1;
      at('B', 27.68, ...q); at('B', 28.34, q[0] + ex_ / e * 2.3, q[1] + ez / e * 2.3, 'o'); at('B', 28.9, q[0] + ex_ / e * 2.3, q[1] + ez / e * 2.3); slide('B', 27.82, 28.34); }
    K('A', 28.9, G); K('B', 28.9, G); }
  for (const c of ['A', 'B']) { T[c].sort((a, b) => a[0] - b[0]); P[c].sort((a, b) => a[0] - b[0]); }
}
// movement helpers for N1 (positions from the keys laid down so far)
const mv8 = (c, o, t0, t1, gap, e = 'io') => { const a = evalPosT(c, t0), b = evalPosT(o, t1), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, b[0] + dx / d * gap, b[1] + dz / d * gap, e); };
const lat8 = (c, o, t0, t1, side, e = 'o') => { const a = evalPosT(c, t0), b = evalPosT(o, t0), dx = a[0] - b[0], dz = a[1] - b[1], d = Math.hypot(dx, dz) || 1; at(c, t0, ...a); at(c, t1, a[0] - dz / d * side, a[1] + dx / d * side, e); };
`;
fs.writeFileSync('fight_w/parts/build_v8x.js', build);

// ---------------------------------------------------------------- camera (bolt30's: face panels, 'pierce', 'flash'), calmer shot list
let c = fs.readFileSync('fight_w/parts/camera_bolt30.js', 'utf8'); const ca = c.indexOf('const INS'), cb = c.indexOf('// ---- split-panel face intro'); if (ca < 0 || cb < 0) throw new Error('camera_bolt30 header');
const FL = (26.38 + 0.8 + LN).toFixed(2);
const head = `const INS = [7.25, 17.2];   // two impact inserts only (standard: fewer jumps)
const FLASH = ${FL}, BIND_T = -9, BIND_END = -8, FALL_T = ${(28.6 + 0.8 + LN).toFixed(2)}, FALL_C = 'B', INTRO_END = 2.9, T_OUTRO = 34.0;
// calmer than v8 (its shots averaged 0.5 s; the user: "fewer half-second camera changes", "scenes being skipped"): about 1 s per shot
const SHOTS = [
  [0.0, 'est'], [INTRO_END, 'three4'], [4.0, 'side', { d: 5.0, h: 1.3 }], [5.05, 'trackA', { d: 3.8 }], [5.75, 'side', { d: 4.6, h: 1.3 }], [7.25, 'ins'], [7.35, 'wide', { d: 7 }],
  [7.95, 'trackB'], [8.65, 'three4'], [9.85, 'wide', { d: 6.5 }], [10.5, 'trackB', { d: 4 }], [11.0, 'low', { d: 4.6, look: 2.2, roll: 0.05 }], [11.5, 'side', { d: 5.0, h: 1.4 }],
  [12.9, 'three4'], [14.5, 'wide', { d: 6.8 }], [15.1, 'otsA'], [16.0, 'orbit', { a0: 0.1, a1: 0.8 }], [16.85, 'low', { d: 3.8, look: 1.0, roll: -0.04 }], [17.2, 'ins'], [17.3, 'three4'],
  [18.0, 'wide', { d: 7.5 }], [18.9, 'trackB', { d: 4.2 }], [19.55, 'low', { d: 4.4, look: 2.0, roll: 0.05 }], [20.4, 'side', { d: 4.6, h: 1.3 }], [21.45, 'wide', { d: 6.5 }],
  [23.0, 'otsB'], [23.9, 'side', { d: 4.4, h: 1.3 }], [24.7, 'wide', { d: 8.5 }], [25.4, 'trackA', { d: 4.2 }], [25.85, 'side', { d: 4.8, h: 1.3 }],
  [26.8, 'low', { d: 3.3, look: 1.5, roll: 0.05 }], [27.5, 'three4'], [28.4, 'wide', { d: 8 }], [29.75, 'trackA', { d: 4.4 }], [30.25, 'low', { d: 5.0, look: 1.6, roll: -0.05 }],
  [FLASH, 'flash'], [FLASH + 3 * DT, 'pierce'], [31.6, 'side', { d: 4.6, h: 1.2 }], [32.5, 'wide', { d: 7 }], [33.6, 'orbit', { a0: 0.3, a1: 0.62, d: 6.5, h: 1.6 }],
];
// logo outro (DOM over the canvas, index_x.html): the scene dims, the logo fades and settles in, one soft shine, short fade to black
let VO_ = null;
export function overlay(tv, t, doc) {
  if (VO_ == null) VO_ = videoAt(T_OUTRO);
  const io_ = u => u * u * (3 - 2 * u), el = doc.getElementById('outro'), shine = doc.getElementById('shine'), glow = doc.getElementById('glow'), fade = doc.getElementById('fade'), dim = doc.getElementById('dim');
  const d = tv - VO_, END = videoAt(TOTAL); if (d <= 0) { el.style.opacity = 0; fade.style.opacity = 0; dim.style.opacity = 0; return; }
  const a = io_(clamp(d / 0.7)), s = 0.9 + 0.1 * (1 - Math.pow(1 - clamp(d / 0.9), 3));
  el.style.opacity = a; dim.style.opacity = (0.55 * io_(clamp(d / 1.1))).toFixed(3); doc.getElementById('ls').style.transform = 'scale(' + s.toFixed(4) + ')'; glow.style.opacity = (0.55 * a).toFixed(3);
  const k_ = clamp((d - 0.9) / 0.9); shine.style.opacity = (Math.sin(Math.PI * k_) * 0.85).toFixed(3); shine.style.left = (-30 + 130 * k_).toFixed(2) + '%';
  fade.style.opacity = io_(clamp((tv - (END - 0.4)) / 0.4)).toFixed(3);
}
`;
fs.writeFileSync('fight_w/parts/camera_v8x.js', c.slice(0, ca) + head + c.slice(cb));

// ---------------------------------------------------------------- page without corner texts + logo outro
let h = fs.readFileSync('fight_w/index4.html', 'utf8');
h = h.replace('<title>NewGenMC 2v2 fight</title>', '<title>NewGenMC fight (no corner texts, logo outro)</title>').replace('#fade { position: fixed;', '#dim { position: fixed; left: 0; top: 0; width: 1920px; height: 1080px; background: #000; opacity: 0; pointer-events: none; }\n  #fade { position: fixed;')
  .replace('<div id="outro">', '<div id="dim"></div>\n<div id="outro">').replace('src="./fight4.js"', 'src="./fight.js"');
if (!h.includes('id="dim"') || !h.includes('./fight.js')) throw new Error('index_x');
fs.writeFileSync('fight_w/index_x.html', h);

// ---------------------------------------------------------------- fight.js: sheet-size weapons (w2), no-HUD pages, overlay hook
E('fight_w/fight.js', [
  ["  t1: [WP.sword, WP.sword2], t2:", "  v8x: [{ file: 'aegisblade', cfg: 'swordx', dir: 'w2/' }, { file: 'veilblade', cfg: 'swordx2', dir: 'w2/' }],   // v8 remake: swords at the reference sheet's size and grip\n  t1: [WP.sword, WP.sword2], t2:"],
  ["  fetch(base + 'w/' + VPAIR[VID][0].file + '.json').then(r => r.json()),\n  fetch(base + 'w/' + VPAIR[VID][1].file + '.json').then(r => r.json())]);", "  fetch(base + (VPAIR[VID][0].dir || 'w/') + VPAIR[VID][0].file + '.json').then(r => r.json()),\n  fetch(base + (VPAIR[VID][1].dir || 'w/') + VPAIR[VID][1].file + '.json').then(r => r.json())]);"],
  ["const WA = WC[VPAIR[VID][0].cfg], WB = WC[VPAIR[VID][1].cfg];", "// sheet-size swords (33.8 px): Aegisblade grip 0.22 -> -7.4..26.4 px, Veilblade grip 0.17 -> -5.7..28.1 px\nWC.swordx = { seg: [4, 9, 14, 19, 23, 26], cseg: [8, 25], tip: 25.8, trail: [9, 25.5], edgeUp: 'x' }; WC.swordx2 = { seg: [4, 9, 14, 19, 24, 27.5], cseg: [8, 26.5], tip: 27.4, trail: [9, 27], edgeUp: 'x' };\nconst WA = WC[VPAIR[VID][0].cfg], WB = WC[VPAIR[VID][1].cfg];"],
  ["const cast = { A: buildCharacter(s1, buildWeapon(aeg, base + 'w/'), SC, WA), B: buildCharacter(s2, buildWeapon(veil, base + 'w/'), SC, WB),", "const cast = { A: buildCharacter(s1, buildWeapon(aeg, base + (VPAIR[VID][0].dir || 'w/')), SC, WA), B: buildCharacter(s2, buildWeapon(veil, base + (VPAIR[VID][1].dir || 'w/')), SC, WB),"],
  ["document.getElementById('bl').innerHTML = ", "if (document.getElementById('bl')) document.getElementById('bl').innerHTML = "],
  ["for (const k in cast) scene.add(cast[k].root);", "for (const k of ['A', 'B']) if (VPAIR[VID][k === 'A' ? 0 : 1].dir) cast[k].weapon.parent.position.y += 1.5;   // sheet exports: the weapon axis runs through the centre of the fist\nfor (const k in cast) scene.add(cast[k].root);"],
  ["const fill = document.getElementById('fill');", "const fill = document.getElementById('fill') || { style: {} };   // pages without the corner HUD"],
  ["  outMat.uniforms.map.value = acc.texture; renderer.setRenderTarget(null); renderer.render(outScene, quadCam);\n  fill.style.width = (300 * Math.min(1, tv / (C.videoAt ? C.videoAt(C.TOTAL) : C.TOTAL))) + 'px';\n  return label;", "  outMat.uniforms.map.value = acc.texture; renderer.setRenderTarget(null); renderer.render(outScene, quadCam);\n  fill.style.width = (300 * Math.min(1, tv / (C.videoAt ? C.videoAt(C.TOTAL) : C.TOTAL))) + 'px';\n  if (C.overlay) C.overlay(tv, t, document);   // logo outro\n  return label;"]]);

// ---------------------------------------------------------------- assemble: TOTAL, the free-hand layer for v8x too, and a smoother free hand
E('fight_w/parts/assemble_w.py', [
  ["'37.3' if vid in ('duo1', 'duo2') else", "'37.3' if vid in ('duo1', 'duo2') else '" + TOTAL + "' if vid == 'v8x' else"],
  ["if vid.startswith('duo'):\n    import re", "if vid.startswith('duo') or vid == 'v8x':\n    import re"],
  // jerks: v1 of the layer took two single samples (the difference of two keys' eases = a kick at every key). Now each is an average
  // over a short window, with less overshoot.
  ["  const a = f(t - 0.07), b = f(t - 0.17), px = a[0] + 0.6 * (a[0] - b[0]), pz = a[1] + 0.6 * (a[1] - b[1]);   // a beat late + overshoot = follow-through",
   "  const av = t0 => { const s = [0, 0]; for (let i = 0; i < 5; i++) { const q = f(t0 - 0.03 * i); s[0] += q[0] / 5; s[1] += q[1] / 5; } return s; };   // averaged over 0.12 s: no kick at a key\n  const a = av(t - 0.04), b = av(t - 0.16), px = a[0] + 0.35 * (a[0] - b[0]), pz = a[1] + 0.35 * (a[1] - b[1]);   // a beat late + a little overshoot = follow-through"],
  ["  const el = -20 - 0.28 * Math.abs(px) - 0.9 * Math.abs(a[0] - b[0]), R = FREE_REF[s];", "  const el = -20 - 0.28 * Math.abs(px) - 0.5 * Math.abs(a[0] - b[0]), R = FREE_REF[s];"]]);
console.log('v8x generated: build', build.length, 'chars');
