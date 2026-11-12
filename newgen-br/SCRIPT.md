# NewGen — Battle Royale (draft v3)

Idea from the user (2026-11-13): "script for the battle royale mode of newgen with legendary weapon crafts included,
first 10 minute is spent gearing up and mining, getting resources to craft legendaries, then coming into a battle and
fighting other players to take their gear (kill feed looks nice on this part), then killing the last standing player to
become the last survivor and winning the match, at the end show newgen logo and join now with newgenmc.net ip (newgen
logo with glint effect like the fight videos)".

**Format (user, v2):** "a video like the 2vs2 duels with typography style not animation so script in vietnamese and tham
voice from elevenlabs". So: Ranked 2vs2 house style (clean motion graphics / semi-typography, Python engine), Thắm VO at
1.2×, HUD on every frame. v1 (animated story, no VO) is dropped.
**Length: 43.3 s.** Status: **v1 rendered 2026-11-13** -> `out/newgen_battle_royale_v1.mp4` (1920x1080, 30 fps). Voice = take 2 of every line (ElevenLabs flow `WbzPLdMqUXsUWLgKr0W9`, 1,300 credits). Waiting on the user's feedback.

## Timing estimate
Thắm at 1.2× = 4.23 words/s (measured on Ranked 2vs2). v3 = **149 words** → ~35 s of voice + gaps (0.3 s each, 3.5 s
after line 3 for the crafting montage, 1.0 s after line 6 for the win beat) + 2.6 s outro ≈ **44 s**.

## Script

| # | Voice-over (Thắm) | On-screen idea | Chapter |
|---|---|---|---|
| 1 | Bạn nghĩ mình đủ sức trở thành người sống sót cuối cùng? Vậy thì hãy thử ngay chế độ Battle Royale của NewGen! | Small "Bạn có đủ sức trở thành" → big "NGƯỜI SỐNG SÓT " (white) + "CUỐI CÙNG?" (orange), word-revealed. A row of player heads drops out one by one until one is left, with a green outline. Then kicker "CHẾ ĐỘ" + "BATTLE ROYALE" (stagger, Montserrat 150, bounce + shake on "Royale"), castle map card (`newgen-show/src/map_castle.png`) drifting behind. | 01 — BATTLE ROYALE |
| 2 | Mười phút đầu tiên là lúc để bạn đào khoáng sản, thu thập tài nguyên và trang bị cho bản thân. | Big match clock "00:00" counting up fast toward "10:00" with kicker "10 PHÚT ĐẦU TIÊN" (green). Three item rows pop in on the words: pickaxe sprite + "ĐÀO KHOÁNG SẢN", diamond / coal / gold sprites flying into a hotbar + "THU THẬP TÀI NGUYÊN", armor pieces snapping onto an armor-slot column + "TRANG BỊ" (orange). | 02 — CHUẨN BỊ |
| 3 | Có đủ nguyên liệu rồi thì chế tạo ngay vũ khí huyền thoại, mỗi vũ khí có một công thức riêng. | Kicker "CÓ ĐỦ NGUYÊN LIỆU?" → headline "CHẾ TẠO " (white) + "VŨ KHÍ HUYỀN THOẠI" (orange). **The recipes are shown, not spoken** (user: "just put them up on the screen with items popping into the crafting menu"). An empty Minecraft crafting menu sits centre-left. For each weapon the items pop into their slots one by one (scale bounce + click), the arrow fills, the result pops into the output slot with a ring flash, and the 3D weapon spins up on the right with its name. Then the grid clears and the next recipe pops in. Order: **Blinkblade** (full speed, ~1.6 s) → **Bloodchain** → **Boltspear** → **Tidepiercer** → **Jingu Bang** (~1.0 s each, getting faster). The VO covers the first two; the rest play in a ~3.5 s gap over music. | 03 — CHẾ TẠO |
| 4 | Sau mười phút chuẩn bị là lúc bước vào trận chiến. Hạ gục người chơi khác và toàn bộ đồ của họ sẽ thuộc về bạn. | Clock lands on "10:00" (pulse, shake) → "TRẬN CHIẾN " (white) + "BẮT ĐẦU" (orange, slam). On "hạ gục": Blinkblade (green glow) and Boltspear (orange glow) clash once, Minecraft heart bar drains to 0, death-particle green screen. On "đồ của họ": loot burst (armor, golden apples, the Boltspear) flies into a hotbar; pill "LẤY HẾT ĐỒ" (green). First kill-feed line slides in top right. | 04 — GIAO TRANH |
| 5 | Người chơi cứ thế ngã xuống từng người một, cho đến khi chỉ còn lại hai người. | **The kill feed takes the screen.** A tall kill-feed panel, centre-right: lines `killer [weapon icon] victim` slide in one after another, speeding up, older ones fading. Left: "CÒN LẠI" (kicker) and a big counter ticking down with each line → "2" (orange, bounce) on "hai người". | 05 — KILL FEED |
| 6 | Hạ gục đối thủ cuối cùng, và bạn chính là người sống sót cuối cùng của trận đấu. | Two weapons face off: Blinkblade (left, green) vs Bloodchain (right, orange), heart bars above, name tags. One wind-up, one clash, kill: hurt flash, hearts to 0, death particles. Last feed line (green, larger). Counter "2 → 1". "NGƯỜI SỐNG SÓT CUỐI CÙNG" (white, stagger) → "CHIẾN THẮNG!" (green, bounce); Blinkblade moves to centre and spins up. 1 s hold. | 06 — CHIẾN THẮNG |
| 7 | Còn chờ gì nữa? Vào ngay newgenmc.net và giành lấy chiến thắng đầu tiên của bạn nhá! | "Còn chờ " (white) + "gì nữa?" (orange). From "vào ngay": the **NewGen logo** (`newgen-show/src/img3.png`) scales in and one **glint** sweeps across it left to right (same as the fight-video outros). "JOIN NOW" (green, tracked) → "IP: newgenmc.net" (white, Montserrat 64). Pills "BATTLE ROYALE" (green), "VŨ KHÍ HUYỀN THOẠI" (orange). Blinkblade and Bloodchain spin on either side. Fade to black over the last 0.7 s. | 07 — THAM GIA |

## Recipes (the user's pictures in `Desktop\mcrefs\mcrefs\recipes\`; names confirmed by the user 2026-11-13)

| Pic | Grid (top / middle / bottom row) | Result | In the video |
|---|---|---|---|
| `7.png` | – Ender Pearl – / Diamond, Diamond Sword, Diamond / – Coal – | **Blinkblade** | Line 3 montage, first |
| `image.png` | Powered Rail, Piglin Head, Powered Rail / Powered Rail, Diamond Sword, Powered Rail / Diamond, golden apple (?), Diamond | **Bloodchain** | Line 3 montage, line 6 duel |
| `3.png` | –, Gold Ingot, Ender Pearl / Gold Ingot, Trident, Diamond / Firework Star, Diamond, – | **Boltspear** | Line 3 montage, line 4 clash |
| `5.png` | Seagrass, Nautilus Shell, Seagrass / Diamond, Trident, Diamond / Seagrass, Raw Cod, Seagrass | **Tidepiercer** | Line 3 montage |
| `6.png` | Bamboo, mob head, Bamboo / Diamond, Diamond Sword, Diamond / Bamboo, Gold Block, Bamboo | **Jingu Bang** | Line 3 montage |
| `2.png` | Flint, Echo Shard, Flint / Diamond, Crossbow, Diamond / Flint, Firework Star, Flint | a legendary crossbow (name not given) | Not used |
| `4.png` | Lapis Block ×4, dark shard ×4, Diamond Block centre | a purple hood (name not given) | Not used |

Item sprites, the grid and the result icons are cropped from the user's own pictures (one sprite per slot). Never redrawn.

## Kill feed (player names from the user, 2026-11-13)
Names: Bunn9, M4Lang, Aiufuon, Miyozi, EllySilverArrow, oKhangz, Drak, HaChi, mjioha, Bikoji, Zeroly.
11 players, 10 kills, every name dies exactly once except the winner. **Hero / winner = Bunn9 (user, 2026-11-13); last enemy = Aiufuon (my pick).**
The hero's lines are green, the others white. "CÒN LẠI" starts at 11 unless the user gives the real match size.

| # | Scene | Feed line | CÒN LẠI |
|---|---|---|---|
| 1 | Line 4 (first kill, the Boltspear clash) | **Bunn9** [Blinkblade] Zeroly | 10 |
| 2 | Line 5 | M4Lang [Tidepiercer] Bikoji | 9 |
| 3 | Line 5 | EllySilverArrow [Jingu Bang] mjioha | 8 |
| 4 | Line 5 | Aiufuon [Bloodchain] HaChi | 7 |
| 5 | Line 5 | **Bunn9** [Blinkblade] Drak | 6 |
| 6 | Line 5 | Miyozi [Diamond Sword] oKhangz | 5 |
| 7 | Line 5 | Aiufuon [Bloodchain] Miyozi | 4 |
| 8 | Line 5 | M4Lang [Tidepiercer] EllySilverArrow | 3 |
| 9 | Line 5, lands on "hai người" | **Bunn9** [Blinkblade] M4Lang | **2** |
| 10 | Line 6 (final duel, larger) | **Bunn9** [Blinkblade] Aiufuon | **1** |

Name tags in the line 6 duel: "BUNN9" over the Blinkblade, "AIUFUON" over the Bloodchain.

## Voice notes (ElevenLabs Thắm, voice_id `0ggMuQ1r9f9jqBu50nJn`, `eleven_v4`, played at 1.2×)
- **Cost: 7 lines × 2 takes ≈ 900–1,500 credits.** Ask the user before generating.
- Numbers are written out: "Mười phút", "mười phút", "hai người".
- Check in the first take, respell only if it comes out Vietnamese-letter style: "Battle Royale", "newgenmc.net".
- "newgenmc.net": check how it reads; fallback spelling "NewGen em xi chấm nét".

## Build (run from `newgen-br`, with `toolsfmpegin` and `tools\python` on PATH; Pillow 13 was added to `tools\python` on 2026-11-13)
```
python tools/prep_mc.py                       # Minecraft item textures from the installed game -> src/mc (not in git)
python -X utf8 tools/make_engine.py          # tools/mg.py from the ranked engine (castle-map background)
python tools/prep_gs.py && python tools/hp_table.py   # keyed heart bar + death clip, measured heart table
python tools/spin_br.py ../assets/models/newgenmc_vu_khi_huyen_thoai.bbmodel "<group>" <key>   # 5 spins -> src/spin_<key>.npy
python -X utf8 tools/build.py all v1         # SFX + mix + 8 render workers -> out/
python -X utf8 tools/sheet.py qa/x.jpg 5.6,14.5   # QA stills
```
- Scenes: `tools/br_scenes.py`; timing from `audio/vo/words.json` (ElevenLabs Scribe, free) in `tools/timing.py`.
- Item icons are Minecraft's own textures from the user's installed 1.21.11 jar (`src/mc`); recipe sprites are cut from the user's pictures.
- **Heart bar fix:** the ranked table put 0 hearts on a clip frame that still shows 1. `hp_table.py` measures the frames; the same
  fix is in `newgen-ranked/tools/rk_scenes.py` (`_HT`), but Ranked v4 has NOT been re-rendered.
- QA on v1: both losers' bars reach 0 hearts, no SFX file used more than twice, no banned sounds, 0 frozen stretches, -13.9 LUFS.
  Sound not ear-checked. Not uploaded to Higgsfield.

## Still open
1. **Kill feed:** a screenshot of the server's real kill feed would let
   me match its look.
2. **Player count:** the counter runs 11 → 1 from the 11 names. Give the real match size if it should start higher.
3. **Line 4** says the fight comes after the ten minutes. Is PvP actually off before 10:00?
4. **Background:** blurred castle map, or the cherry-blossom background from Ranked 2vs2?
5. **Music:** `sa.mp3` again?
