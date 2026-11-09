(() => {
  // sway QA: torso yaw (yaw + waist + chest) and root travel, sampled per frame. Counts direction reversals with a
  // swing of >= 6 deg (torso) or >= 0.04 block (root, sideways to the facing) - i.e. visible back-and-forth.
  const { C } = window.__probe, DT = 1 / 30, out = {};
  for (const k of ['A', 'B']) {
    const ty = [], rx = [];
    for (let t = 0.2; t <= C.TOTAL - 0.2; t += DT) { const p = C.pose(k, t); ty.push([t, p.yaw + p.waist[1] + p.chest[1]]); rx.push([t, p.pos[0], p.pos[2], p.yaw]); }
    const rev = (arr, thr) => { const ev = []; let ext = arr[0][1], dir = 0;
      for (const [t, v] of arr) { if (dir >= 0 && v > ext) ext = v; else if (dir <= 0 && v < ext) ext = v;
        if (dir >= 0 && ext - v > thr) { ev.push(t); dir = -1; ext = v; } else if (dir <= 0 && v - ext > thr) { ev.push(t); dir = 1; ext = v; } } return ev; };
    const tyRev = rev(ty, 6);
    const side = rx.map(([t, x, z, y]) => { const r = y * Math.PI / 180; return [t, x * Math.cos(r) - z * Math.sin(r)]; });
    const sRev = rev(side, 0.04);
    const bins = a => { const b = {}; for (const t of a) { const s = Math.floor(t); b[s] = (b[s] || 0) + 1; } return b; };
    out[k] = { torsoYawRev: tyRev.length, torsoBins: bins(tyRev), sideRev: sRev.length, sideBins: bins(sRev) };
  }
  return out;
})()
