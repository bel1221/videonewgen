#!/usr/bin/perl
# No-crossover footwork patch (user, test-1 review 2026-11-10: "ANY crossing makes the movement look poorly done").
# Applies the same edits to the shared planner in fight_v8/choreo.js (the base assemble_w.py copies) and to the already
# assembled fight_w/choreo_*.js, so they match what a re-assemble produces. Idempotent: skips files already patched.
# Measure with tools/cross_qa.js. Usage (from anim-test/):  perl tools/patch_nocross.pl fight_v8/choreo.js fight_w/choreo_t1.js ...
use strict; use warnings;
my @edits = (
  # 0. THE MAIN BUG: gait contacts (run / walk / DRIFT strafe) put the right foot on the body's LEFT. v8 switched the lateral
  #    axis from travel-right (-fz, fx) to body-left (cos yaw, -sin yaw) but kept the old sign, so every gait step crossed.
  #    (assemble_w.py's DRIFT patch carries the same fix for its LAT variant.)
  [ 'all', "- side * 0.15 * lx", "+ side * 0.15 * lx" ],
  [ 'all', "- side * 0.15 * lz", "+ side * 0.15 * lz" ],
  [ 'all', "- side * LAT * lx", "+ side * LAT * lx" ],
  [ 'all', "- side * LAT * lz", "+ side * LAT * lz" ],
  # 1. gait contacts: a foot never lands past the other foot's line. Strafing sideways the trailing foot's step (half a 1.15
  #    stride) is longer than the stance width, so it landed across the lead foot: now it closes up (side-step shuffle).
  [ 1, "      con.sort((a, b) => a.i - b.i); }\n",
    "      con.sort((a, b) => a.i - b.i); }\n" .
    "    { const last = {}; for (const q of con) { const o = q.f === 'r' ? 'l' : 'r', sg = q.f === 'l' ? 1 : -1;   // no crossover: land on your own side of the other foot\n" .
    "        if (last[o]) { const yl = rawP[q.i].yaw * Math.PI / 180, lx = Math.cos(yl), lz = -Math.sin(yl), s = (q.p[0] - last[o][0]) * lx + (q.p[1] - last[o][1]) * lz;\n" .
    "          if (sg * s < XMIN) { const k = sg * XMIN - s; q.p = [q.p[0] + lx * k, q.p[1] + lz * k]; } }\n" .
    "        last[q.f] = q.p; } }\n" ],
  # 2. planner: the body yaw 0.1 s ahead (turns: tracking an opponent who runs past, spins) so feet step before they cross
  [ 1, "      const t = i / HZ, p = raw[c][i], air = isAir(p), yaw = p.yaw * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);\n",
    "      const t = i / HZ, p = raw[c][i], air = isAir(p), yaw = p.yaw * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);\n" .
    "      let dyF = raw[c][Math.min(N - 1, i + Math.round(0.15 * HZ))].yaw - p.yaw; dyF -= 360 * Math.round(dyF / 360);   // no-crossover lookahead (turn capped at\n" .
    "      const yawF = yaw + Math.max(-45, Math.min(45, dyF)) * Math.PI / 180, cyF = Math.cos(yawF), syF = Math.sin(yawF);   // 45 deg: in a spin both sides must stay compatible)\n" ],
  # 3. planner targets: besides staying on its own side of the hips, a foot's target stays on its own side of the planted other
  #    foot (or of where it is landing, when both are in the air), now and 0.15 s ahead
  [ 1, "          if (sgn * s_ < 0.07) { const kk = 0.07 * sgn - s_; D[0] += lx * kk; D[1] += lz * kk; } }   // ~0.1 s low-pass\n",
    "          if (sgn * s_ < 0.07) { const kk = 0.07 * sgn - s_; D[0] += lx * kk; D[1] += lz * kk; }   // ~0.1 s low-pass\n" .
    "          const o_ = f === 'r' ? 'l' : 'r', ref = step[o_] ? step[o_].to : feet[o_]; if (ref) for (const [ax, az] of [[lx, lz], [cyF, -syF]]) {   // and of the other foot\n" .
    "            const s2 = (D[0] - ref[0]) * ax + (D[1] - ref[1]) * az; if (sgn * s2 < XMIN) { const kk = XMIN * sgn - s2; D[0] += ax * kk; D[1] += az * kk; } } }\n" ],
  # 4. planner trigger: turning over planted feet rotates the hips until the feet cross; the old triggers only looked at
  #    distance, so the feet stayed crossed. A foot that is (or within 0.1 s will be) on the wrong side steps to its side.
  [ 1, "        const rested = t - lastStep[f] > 0.18 && t - lastStep[o] > 0.08;\n",
    "        const rested = t - lastStep[f] > 0.18 && t - lastStep[o] > 0.08;\n" .
    "        const gapAt = (ax, az) => (f === 'l' ? 1 : -1) * ((feet[f][0] - feet[o][0]) * ax + (feet[f][1] - feet[o][1]) * az);\n" .
    "        const crossed = feet[o] && !step[o] && Math.min(gapAt(cy, -sy), gapAt(cyF, -syF)) < XMIN * 0.6 && t - lastStep[f] > 0.04;\n" ],
  [ 1, "        if ((err > 0.17 && rested && !otherBusy",
    "        if (crossed || (err > 0.17 && rested && !otherBusy" ],
  [ 1, "          const run = sp > 2.5, dur = run ? Math.max(0.12, Math.min(0.18, 0.75 / sp)) : Math.min(0.26, Math.max(0.15, 0.1 + 0.12 * err));",
    "          const run = sp > 2.5, dur = run ? Math.max(0.12, Math.min(0.18, 0.75 / sp)) : crossed ? 0.12 : Math.min(0.26, Math.max(0.15, 0.1 + 0.12 * err));   // crossed: quick side step" ],
  # touchdown: the foot finishes travelling at 85% of the step and the last 15% is a straight-down plant (it used to skim the
  #    sand sideways for its last frame; stance_qa counted the quick no-crossover steps as planted-foot slides)
  [ 1, "          const s_ = step[f], u = Math.min(1, (t - s_.t0) / s_.dur), w = u * u * (3 - 2 * u);",
    "          const s_ = step[f], u = Math.min(1, (t - s_.t0) / s_.dur), uh = Math.min(1, u / 0.85), w = uh * uh * (3 - 2 * uh);" ],
  [ 1, "          s_.to = [lerp(s_.to[0], D[0] + vx * (s_.dur * (1 - u)) * 0.6, 0.15), lerp(s_.to[1], D[1] + vz * (s_.dur * (1 - u)) * 0.6, 0.15)];",
    "          if (u < 0.85) s_.to = [lerp(s_.to[0], D[0] + vx * (s_.dur * (1 - u)) * 0.6, 0.15), lerp(s_.to[1], D[1] + vz * (s_.dur * (1 - u)) * 0.6, 0.15)];\n" .
    "          { const o2 = f === 'r' ? 'l' : 'r', rf = feet[o2]; if (rf && !step[o2]) { const sg = f === 'l' ? 1 : -1, g = (s_.to[0] - rf[0]) * cy - (s_.to[1] - rf[1]) * sy;   // but never plant across\n" .
    "            if (sg * g < XMIN) { const k = sg * XMIN - g; s_.to = [s_.to[0] + cy * k, s_.to[1] - sy * k]; } } }" ],
  # a quick side step is a real step: lift the foot clear (a 0.07 lift over 0.12 s read as a planted foot sliding, stance_qa)
  [ 1, "t0: t, dur, h: run ? 0.28 : Math.min(0.26, 0.07 + 0.24 * err) };",
    "t0: t, dur, h: run ? 0.28 : crossed ? 0.14 : Math.min(0.26, 0.07 + 0.24 * err) };" ],
  # 5. slides (skid): both feet are dragged toward their targets while the body turns; keep them apart on their own sides
  [ 1, "        if (skid) { feet[f] = [lerp(feet[f][0], D[0], 0.25), lerp(feet[f][1], D[1], 0.25)]; step[f] = null;",
    "        if (skid) { feet[f] = [lerp(feet[f][0], D[0], 0.25), lerp(feet[f][1], D[1], 0.25)]; step[f] = null;\n" .
    "          if (f === 'l' && feet.r) for (const [ax, az] of [[cy, -sy], [cyF, -syF]]) { const s3 = (feet.l[0] - feet.r[0]) * ax + (feet.l[1] - feet.r[1]) * az;   // no crossover while sliding\n" .
    "            if (s3 < XMIN) { const kk = (XMIN - s3) / 2; feet.l = [feet.l[0] + ax * kk, feet.l[1] + az * kk]; feet.r = [feet.r[0] - ax * kk, feet.r[1] - az * kk]; } }" ],
);
my $decl = "function runGait(c, root, rawXZ, N, rawP) {";
for my $f (@ARGV) {
  local $/; open(my $h, '<:raw', $f) or die "$f: $!"; my $s = <$h>; close $h;
  if (index($s, 'const XMIN = ') >= 0) { print "$f: already patched\n"; next; }
  my $crlf = $s =~ /\r\n/; $s =~ s/\r\n/\n/g if $crlf;
  for my $e (@edits) { my ($cnt, $a, $b) = @$e; my $n = () = $s =~ /\Q$a\E/g;
    die "$f: expected ${cnt}x, found ${n}x: " . substr($a, 0, 70) . "\n" if ($cnt eq 'all' ? 0 : $n != $cnt);
    $s =~ s/\Q$a\E/$b/g; }
  my $n = () = $s =~ /\Q$decl\E/g; die "$f: runGait not found once\n" if $n != 1;
  $s =~ s/\Q$decl\E/const XMIN = 0.22;   \/\/ min lateral gap between the feet (blocks, about 3.5 px): legs never cross over (cross_qa.js)\n$decl/;
  $s =~ s/\n/\r\n/g if $crlf;
  open($h, '>:raw', $f) or die; print $h $s; close $h; print "$f: patched\n";
}
