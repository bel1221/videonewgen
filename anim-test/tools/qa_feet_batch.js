(async () => {
  // Runs cross_qa + stance_qa + phase_qa on the loaded fight page and stores a compact summary in localStorage
  // ('qa:<vid>:<label>'), so before/after runs on different code can be compared. window.__qa_label sets the label.
  const run = async f => eval(await (await fetch('/anim-test/tools/' + f, { cache: 'no-store' })).text());
  const vid = new URLSearchParams(location.search).get('vid') || location.pathname.split('/')[2], label = window.__qa_label || 'run';
  const cr = await run('cross_qa.js'), st = await run('stance_qa.js'), ph = await run('phase_qa.js'), out = {};
  for (const k of ['A', 'B']) out[k] = { cross: cr[k].cross, narrow: cr[k].narrow, minGap: cr[k].minGap, grounded: cr[k].samples,
    crossSpans: cr[k].crossSpans.map(s => s.join('/')).join(' '),
    bounce: st[k].bounce.n, lean: st[k].lean.n, belowFloor: st[k].belowFloor.n, footSlide: st[k].footSlide.n,
    phase: Object.fromEntries(Object.entries(ph[k] || {}).map(([c, x]) => [c, x.n + '@' + x.worst])) };
  localStorage.setItem(`qa:${vid}:${label}`, JSON.stringify(out)); window.__qa_done = out; return out;
})()
