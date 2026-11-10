#!/usr/bin/perl
# Opponent LEGS for the weapon collision (2026-11-11). The rig modelled the opponent's legs as one vertical capsule at the root
# (r 0.25); after the no-crossover fix the feet stand properly to the sides, outside it, so low cuts grazed the shins
# (t1 2.8-3.6 s, phase_qa weaponOpp). Now each choreo passes the opponent's planted/stepping foot positions (p.oppFeet) and
# rig2_w.js adds a pelvis->foot capsule per leg. assemble_w.py emits the same line. Idempotent.
# Usage (from anim-test/):  perl tools/patch_oppfeet.pl fight_w/choreo_t1.js ...
use strict; use warnings;
my $feet = "    p.oppFeet = ['r', 'l'].map(s => { const f = samp(SIM[o][s], t); return f ? [f[0], W.floorAt(f[0], f[2]) + f[1] + 0.05, f[2]] : null; });   // opponent legs for the weapon collision\n";
my @anchors = (
  [ "    p.oppArms = oppArmPts(ob, ro, p.oppLean); }", "    p.oppArms = oppArmPts(ob, ro, p.oppLean);\n" . $feet . "  }" ],
  [ "yEff(ob) + 0.035 - (1 - Math.cos(pitch)) * 0.9]; }   // opponent chest/head offset for the weapon collision",
    "yEff(ob) + 0.035 - (1 - Math.cos(pitch)) * 0.9];   // opponent chest/head offset for the weapon collision\n" . $feet . "  }" ],
);
for my $f (@ARGV) {
  local $/; open(my $h, '<:raw', $f) or die "$f: $!"; my $s = <$h>; close $h;
  if (index($s, 'p.oppFeet = ') >= 0) { print "$f: already patched\n"; next; }
  my $crlf = $s =~ /\r\n/; $s =~ s/\r\n/\n/g if $crlf; my $done = 0;
  for my $a (@anchors) { my ($x, $y) = @$a; my $n = () = $s =~ /\Q$x\E/g; if ($n == 1) { $s =~ s/\Q$x\E/$y/; $done = 1; last; } }
  die "$f: no anchor found\n" unless $done;
  $s =~ s/\n/\r\n/g if $crlf;
  open($h, '>:raw', $f) or die; print $h $s; close $h; print "$f: patched\n";
}
