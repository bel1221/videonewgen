(() => {
  // Footwork: how long is each step? (user 2026-11-13: "a bunch of small steps that make the movement looks cursed")
  // Per fighter over window.__st = [t0, t1]: every foot contact (C.STEPS, kind 'step' / 'land'), the distance from that foot's previous
  // contact (stride of that foot, blocks) and the time since the fighter's previous contact.
  //   small = strides under 0.35 blocks, sprint contacts included (the first version of this probe skipped every gait-window contact
  //           and so under-counted: it reported 2 where there were 10);
  //   quick = contacts less than 0.14 s after the previous one, not counting a sprint's own cadence or a two-footed landing from a jump;
  //   median = median stride of the walking steps. perSec = contacts per second in each 1 s bin.
  const { C } = window.__probe, [t0, t1] = window.__st || [5.4, 15.0], out = {};
  for (const k of ['A', 'B']) { const st = C.STEPS.filter(s => s.c === k && s.t >= t0 && s.t <= t1 && (s.kind === 'step' || s.kind === 'land')).sort((a, b) => a.t - b.t);
    const last = {}, rows = []; let prevT = null, prevK = null;
    for (const s of st) { const p = last[s.foot], d = p ? Math.hypot(s.p[0] - p[0], s.p[2] - p[2]) : null, kind = s.run ? 'run' : s.kind;
      rows.push([+s.t.toFixed(2), s.foot, d == null ? null : +d.toFixed(2), prevT == null ? null : +(s.t - prevT).toFixed(2), kind, prevK]); last[s.foot] = s.p; prevT = s.t; prevK = kind; }
    const ds = rows.filter(r => r[2] != null && r[4] !== 'run').map(r => r[2]).sort((a, b) => a - b), bins = {};
    for (const r of rows) bins[Math.floor(r[0])] = (bins[Math.floor(r[0])] || 0) + 1;
    const small = rows.filter(r => r[2] != null && r[2] < 0.35), quick = rows.filter(r => r[3] != null && r[3] < 0.14 && !(r[4] === 'run' && r[5] === 'run') && !(r[4] === 'land' && r[5] === 'land'));
    out[k] = { rows: rows.map(r => r.slice(0, 5).join(' ')).join(' | '), n: rows.length, small: small.length, quick: quick.length,
      medianStride: ds.length ? ds[Math.floor(ds.length / 2)] : null, perSec: bins, smallAt: small.map(r => r[0] + ':' + r[2]).join(' '), quickAt: quick.map(r => r[0] + ':' + r[3]).join(' ') }; }
  return out;
})()
