# NewGenMC promo videos — handoff document

Written 2026-11-08 for a fresh Claude (Claude Code) picking this up with no other context.
Everything below is copied exactly from the working session where possible. Where a script exists only as a speech-to-text (Whisper) transcript of the generated voice-over, that is labelled; Whisper mis-hears some words, so the transcript is not the exact prompt text.

---

## 0. TL;DR — where things stand

| Project | Status | Latest deliverable |
|---|---|---|
| **Ranked 2vs2 legendary-duel video (Vietnamese)** | **Active. v4 delivered, awaiting feedback** | `newgen_ranked_2v2_v4.mp4`, 51.77 s, 1920×1080, 30 fps. Higgsfield media_id `84bca1b4-a570-4a97-9556-374ba7cbd10e`, URL https://d2ol7oe51mr4n9.cloudfront.net/user_3LhMjPy4UCr199g26ggXbTuJE9o/84bca1b4-a570-4a97-9556-374ba7cbd10e.mp4 |
| NewGen showcase video, Vietnamese | Done (v6) | media_id `d4f07a7c-de5d-4ca5-9737-7b2ad95d7901` |
| NewGen showcase video, English | Done (v2) | media_id `8426465b-ee81-4ab7-a395-b4f25b364b2d` |
| "Part 2 — Phát triển" (series video) | Done (v3) | in sandbox `katana-newgen-p2/out/newgen_part2_phat_trien_v3.mp4` |
| "Part 3 — Hoàn thiện" | **On hold.** The user said: "keep the 3rd part of this series to the side ill come back to it later" | — |
| "Money" test video (pixel-cartoon style) | Done (v3) | sandbox `newgen-money/out/newgen_money_test_v3.mp4` |
| Legendary-weapon renders from the .bbmodel | Done | 44 PNGs and a contact sheet (see §6) |

**All editable project files** (code, voice-overs, source images, the v4 master) are zipped at a permanent URL:
**https://d2ol7oe51mr4n9.cloudfront.net/user_3LhMjPy4UCr199g26ggXbTuJE9o/b842a65e-78b7-4f68-9743-ebc6668824c5.zip** (89.5 MB, Higgsfield media_id `b842a65e-78b7-4f68-9743-ebc6668824c5`).
It contains `newgen-ranked/` (tools, audio, src, out/v4), `newgen-show/` (tools, audio/vo, src), `newgen-show-en/` (tools, audio/vo) and `katana-newgen-p2/tools`. It **excludes** three regenerable `.npy` caches (`spin144.npy`, `hp_keyed.npy`, `death_keyed.npy`). §9.4 explains how to rebuild them.

---

## 1. Client, goal, audience

- **Client:** the owner of **NewGenMC** (newgenmc.net), a **Vietnamese Minecraft server**. Main gamemodes: **Battle Royale** and **Competitive Duels**. It also has a "legendary weapon" arsenal, a ranked MR (matchmaking rating) leaderboard with a "Champion" tier (top 10), and cosmetics. The owner says the server has had "hơn 163.000 người chơi".
- **Purpose:** marketing / promo videos for the server (YouTube / social). The user calls it "my marketting project for my mc server".
- **Audience:** Vietnamese Minecraft players, primarily. One English version of the showcase was also made.
- **Format:** 16:9, 1920×1080, 30 fps, H.264 MP4 with AAC audio. Voice-over driven. Typically 50–90 s.
- **Language:** Vietnamese voice-over and Vietnamese on-screen text, with English game terms kept in English (PvP, Ranked, Champion, Battle Royale, Duels, armor trim, MR, team, server, SMP).
- **The user's talking style** (for scripts): first person "mình", addresses viewers as "các bạn" / "bạn", sometimes says "tụi mình". It opens with a rhetorical-question hook, mixes in English gaming words, and ends with a casual call to action, e.g. "...nhá!", "Hãy vào ngay ...", "đăng nhập vào server".
- **Part 1** (the original reference video, made earlier with the `/katana/neon-laser-motion-graphics-edit` preset) is **reference and inspiration only — NOT a skeleton**. The user said: "dont take it as like a skeleton for future videos i just want you to understand what we're working on and maybe take some inspirations".

---

## 2. Standing preferences and brand rules (apply to ALL videos)

These came from the user's feedback over the whole session. Do not violate them.

### Visual
1. **Clean motion graphics / semi-typography** style for the showcase and ranked videos. The user rejected "pixel art cartoon" for the showcase: "hmm the pixel art cartoon style doesnt really fit with the video idea too much, change it into a motion graphic/semi typography with clean animations and do not overuse 1 aspect too much".
2. **Don't overuse any single effect.** Neon lasers / moving neon lines in particular: "reduce the amount of moving across the screen neon line youre over using it and its lowkey annoying". Ray / light effects must never cover text ("the chapter 2 text is covered by that stupid light shit").
3. **No still frames.** Every frame must move: a slow camera drift on every scene, a drifting background, and overlapping transitions. The user asked: "make both versions have better transitions and cleaner animations with no still frame".
4. **No grey / "bland" text.** The user said: "the texts in the scripts that are grey looks bland and it doesnt enhance the script". Use white text with key words in an accent colour (green / orange), plus a soft drop shadow.
5. **Fast pacing, without just speeding up the file.** The user rejected a plain 1.5× speed-up: "no not like actually sped up bro, speed up the pace of the orinigal video, faster animations, transition and less silence part maybe speed up the voice by 1.2x".
6. **Use Minecraft assets** so it feels like a Minecraft video ("use minecraft assets like diamond sword so it feels more like a minecraft video bro"). Use the **user's own sprites / models**, not hand-drawn imitations. My vector swords were rejected: "ugly ahh sword bro ill send u the images".
7. **Weapon spins must be smooth.** The user said: "the weapons animation spinning needs to be alot smoother bro". The fix was 144 angles per turn plus blending between neighbouring angles (§9).
8. **Backgrounds.** A plain checker pattern was "bland". The flat navy background "has no color theory". The showcase uses a teal/orange complementary palette. The ranked video uses the **user's cherry-blossom Minecraft screenshot, blurred** (§6), with a slow drift and pink petal specks.
9. **Blur competitor server names and logos.** **Crop out "kingmc.vn" scoreboards** in screenshots.
10. Palette constants used in code: `WHITE=(245,247,250) GREEN=(112,222,132) ORANGE=(255,164,104) RED=(255,92,96) INK=(5,18,22)`. `MUTED` is now `(232,238,240)`; it was grey `(150,182,176)` until the user called grey bland. Fonts: **Montserrat ExtraBold** for headlines, **Inter** (variable; SemiBold/Bold/Medium) for body text and kickers.
11. **HUD on every frame:** "NEWGENMC" top-left, "newgenmc.net" top-right, chapter number + name bottom-left (e.g. `04 — ĐỐI ĐẦU`), a thin progress bar bottom-right.

### Audio
12. **Never** use the synth riser `riser/rs50__synth_misc_16.ogg`, and **never use any explosion sound** (the code also skips the whole `boom/` category).
13. **No sound-effect file may be used more than twice** in one video.
14. **Music** (the user's `sa.mp3`) should be "subtle so the voice is distinct from the background but not too quiet": loudnorm I=-26 on the music, sidechain-ducked under the voice, final master loudnorm I=-14.
15. User-supplied SFX pack (`audio/userpack/pack.wav`) segments in use: shine 3.85–4.7 s, whoosh_a 8.95–10.7 s, whoosh_b 20.75–22.5 s, whoosh_long 23.75–28.2 s. Early-video SFX were once criticised: "the sfx at the start of the video is kinda ass bro replace them".

### Voice (Vietnamese)
16. Voice: **ElevenLabs "Thắm - Giọng Nữ Miền Bắc"**, voice_id `0ggMuQ1r9f9jqBu50nJn`, model **`eleven_v4`**.
17. **English words must be pronounced in English, never Vietnamese-letter style.** Examples of the problem:
    - "SMP" was read "S mờ P". The user asked: "why is it still "S mờ P" why does it have a vietnamese letter but other videos are full english pronounciation?"
    - "MR" was read "em rờ".

    Fixes that worked: write `SMP` as **"ét em pi"**, write `MR` as **"em a"**, and write `2vs2` as **"2 versus 2"**.
18. "Pay To Win" stays as plain English text "Pay To Win". The user first suggested "pây tu guyn", then said: "nvm dont change anything js use take 3".
19. In the ranked video the voice-over is played at **1.2× speed** with pitch kept (ffmpeg `atempo=1.2`).

---

## 3. ACTIVE PROJECT — "Ranked 2vs2" legendary-weapon duel video

### 3.1 What it is
- A Vietnamese promo for NewGen's **Ranked 2vs2** mode, in which each team gets a random legendary weapon, plus the ranked rewards: reaching **Champion** means **top 10 on the ranked leaderboard**, and the reward is an **exclusive armor trim obtainable no other way**.
- Facts from the user:
  - "newgen's ranked 2vs2 legendary weapon duel and ranked rewards for reaching champion is an exclusive armor trim only obtainable through reaching top 10 on the ranked leaderboard".
  - "the duels mode has been opened for a long time". So never present Duels / Ranked as new; no "đã chính thức có mặt".
  - "it is a roulette royale mode so each team rolls a weapon from the legendary weapon pool". The user then asked for the wording to be simply "mỗi team sẽ nhận được một vũ khí huyền thoại ngẫu nhiên".

### 3.2 Final script (exact text; lines 1–6 and 8 are in the video; line 7 was REMOVED by the user)
Title: **NewGen — Ranked 2vs2**

1. Bạn muốn biết trình độ PvP của bạn đang ở mức nào? Vậy thì hãy rủ ngay đồng đội và tham gia chế độ Ranked 2vs2 của NewGen!
2. Ở chế độ này, bạn và đồng đội sẽ cầm trên tay những vũ khí huyền thoại để đối đầu với các team khác.
3. Trước mỗi trận, mỗi team sẽ nhận được một vũ khí huyền thoại ngẫu nhiên, nên bạn sẽ không bao giờ biết trước mình sẽ cầm gì. Lúc đó, kỹ năng và sự phối hợp với đồng đội mới là thứ quyết định ai là người chiến thắng.
4. Mỗi trận thắng sẽ giúp bạn tăng điểm MR và leo rank, đưa bạn tiến gần hơn đến đỉnh của bảng xếp hạng.
5. Và đỉnh cao nhất của Ranked chính là rank Champion.
6. Chỉ những người chơi lọt vào top 10 bảng xếp hạng Ranked mới đạt được Champion, và nhận về một armor trim độc quyền mà không có cách nào khác để sở hữu.
7. ~~Không mua được, không đổi được, chỉ có thể giành được bằng chính kỹ năng của bạn.~~ **REMOVED in v4** ("remove the Không mua được, không đổi được, chỉ có thể giành được bằng chính kỹ năng của bạn. part")
8. Vậy còn chờ gì nữa? Rủ ngay đồng đội, đăng nhập vào NewGen và chứng minh team của bạn là mạnh nhất server nhá!

How the script evolved (do not revert):
- Original hook line 1: "Bạn đã quá quen với việc solo trong Duels? Vậy thì rủ ngay đồng đội của bạn đi, vì chế độ Ranked 2vs2 của NewGen đã chính thức có mặt!" **Rejected**: "quá chán với việc solo seems a bit degrading the server, change it to "Bạn muốn biết trình độ PvP của bạn đang ở mức nào?" also the duels mode has been opened for a long time".
- Original line 2 began "Đây không phải là một trận Duels bình thường." **Removed**, because it implied a new mode.
- Line 3 went through two versions: first "quay Roulette để nhận ngẫu nhiên…", then "mỗi team sẽ nhận được một vũ khí huyền thoại ngẫu nhiên" (the user's wording, final).

### 3.3 Voice-over generation (exact prompts sent to ElevenLabs)
Tool: ElevenLabs `creative_generate_speech`, `model_id: eleven_v4`, `voice_id: 0ggMuQ1r9f9jqBu50nJn` (Thắm), `flow_id: FyoSWjfjEm9cZWytrXad`, 2 takes per call (default). Prompt texts:

| # | Prompt text sent | Take used | ElevenLabs generation id |
|---|---|---|---|
| 1 | `Bạn muốn biết trình độ PvP của bạn đang ở mức nào? Vậy thì hãy rủ ngay đồng đội và tham gia chế độ Ranked 2 versus 2 của NewGen!` | take 1 (8.88 s); the 2nd take said "High vs High" (bad) | fuqAVPp4leiT9F0BVxV8 |
| 2 | `Ở chế độ này, bạn và đồng đội sẽ cầm trên tay những vũ khí huyền thoại để đối đầu với các team khác.` | take 1 | PdsmqvAav2GOh5NIC4CV |
| 3 | `Trước mỗi trận, mỗi team sẽ nhận được một vũ khí huyền thoại ngẫu nhiên, nên bạn sẽ không bao giờ biết trước mình sẽ cầm gì. Lúc đó, kỹ năng và sự phối hợp với đồng đội mới là thứ quyết định ai là người chiến thắng.` | take 1 | tlh3Z525Tpdeu5nFbx8V |
| 4 | `Mỗi trận thắng sẽ giúp bạn tăng điểm em a và leo rank, đưa bạn tiến gần hơn đến đỉnh của bảng xếp hạng.` (MR spelled "em a") | take 2 (clearer "Mỗi") | 7GflzsZzWLs3GbyBZc4a |
| 4 (rejected) | same text with "MR"; it was read "em rờ" | — | 18Ns3M9W9unbfMG6PMrb |
| 5 | `Và đỉnh cao nhất của Ranked chính là rank Champion.` | take 1 | 3ZUakYfBghJrdNmpzat0 |
| 6 | `Chỉ những người chơi lọt vào top 10 bảng xếp hạng Ranked mới đạt được Champion, và nhận về một armor trim độc quyền mà không có cách nào khác để sở hữu.` | take 2 (take 1 hit a concurrency retry) | P46PJlDS1ntmRBacRZ9K |
| 7 (now unused) | `Không mua được, không đổi được, chỉ có thể giành được bằng chính kỹ năng của bạn.` | take 1 | 7pK2T3hUP2bOAbVcZXB8 |
| 8 | `Vậy còn chờ gì nữa? Rủ ngay đồng đội, đăng nhập vào NewGen và chứng minh team của bạn là mạnh nhất server nhá!` | take 1 | KRFK0W36IpHbB1aXhbdV |

Cost: ≈1,500 ElevenLabs credits in total (≈100–215 per line per 2 takes).
Files: `newgen-ranked/audio/vo/vo1..vo8.mp3` (originals; `vo4.mp3` = take 2 of the "em a" version) and `vof1..vof8.mp3` (the same at 1.2×: `ffmpeg -i voN.mp3 -af atempo=1.2 -ar 44100 -b:a 192k vofN.mp3`). Word timings: `audio/vo/words.json` (faster-whisper `small`, `language='vi'`, `word_timestamps=True`). These are 1× times; `timing.py` divides by 1.2.

### 3.4 Timeline (v4, voice at 1.2×)
Voice-line start times (seconds) in the final video: `EV = {1: 0.35, 2: 8.08, 3: 13.67, 4: 26.25, 5: 31.96, 6: 35.33, 8: 43.34}`. TOTAL = 51.77 s (1553 frames). Gaps after lines: `GAP = {1: 0.3, 2: 0.3, 3: 1.35, 4: 0.35, 5: 0.35, 6: 0.3}`. The extra 1.35 s after line 3 gives the kill / "CHIẾN THẮNG!" beat room.

### 3.5 Storyboard / shot list (v4, exact on-screen text)
The background is the blurred cherry-blossom screenshot throughout (slow drift, pink petal specks). Every scene also has a slow camera push (+3 % scale) and a ±14 px horizontal drift. Scenes overlap through transitions: out-window 0.2 s before the boundary, out-length 0.38 s, in-length 0.42 s. The transition types rotate as `KINDS = ['zoom','push','rise','focus','push','zoom','rise','focus','zoom']`:
- zoom = scale up + blur out, incoming scales up from 0.88;
- push = slide left with horizontal motion blur, incoming from the right;
- rise = up and out, incoming from below;
- focus = blur + slight shrink out, incoming de-blurs from 1.08×.

| # | Scene fn | Time span | Voice | On-screen content (exact text) |
|---|---|---|---|---|
| 1 | `s_q` | 0 → "Vậy" −0.15 | L1 first half | Small "Bạn muốn biết" (Inter SemiBold 60, white). Big "TRÌNH ĐỘ " (white) + "PVP" (orange), Montserrat 150, word-revealed on "PvP". "của bạn đang ở " (white) + "mức nào?" (green, bold). A **skill meter**: green→orange gradient bar, white needle oscillating left/right, with a white "?" bubble above the needle. |
| 2 | `s_title` | → L2 −0.1 | L1 second half | Kicker "RỦ NGAY ĐỒNG ĐỘI" (green). "RANKED" (stagger, white, Montserrat 150). "2" (green, 230) " VS " (white, 150) "2" (orange, 230) pops with a bounce + screen shake on "2 vs 2". 3D **Ocean Sword** (left, tilted −18°, green glow) and **Thundermaul** (right, +18°, orange glow) spin slowly (40°/s) and fly in from the sides. |
| 3 | `s_arms` | → L3 −0.1 | L2 | Kicker "Ở CHẾ ĐỘ NÀY". Headline "VŨ KHÍ HUYỀN THOẠI" (white, 96) on "vũ khí". Two rounded team panels: left "ĐỘI CỦA BẠN" (green outline) with spinning **Aegisblade + Ocean Sword**; right "ĐỐI THỦ" (orange outline) with **Veilblade + Thundermaul**. The left appears on "đồng đội", the right on "đối đầu", plus a "VS" circle badge that slams in with a shake. |
| 4 | `s_roll` | → "Lúc đó" −0.2 | L3 first half | Kicker "TRƯỚC MỖI TRẬN". Headline "VŨ KHÍ NGẪU NHIÊN" on "ngẫu nhiên". Two **slot-reel windows** (labels "ĐỘI CỦA BẠN" green, "ĐỐI THỦ" orange) scroll through all 44 legendaries with vertical motion blur, then decelerate. Left lands on **Aegisblade** ≈ "không bao giờ"+0.9 s; right lands on **Veilblade** on "gì". Before landing a pulsing "???" shows under each reel; on landing a ring flash plays and the name (e.g. "AEGISBLADE") appears in the team colour. Synthesized tick sounds follow the reel. |
| 5 | `s_clash` | → L4 −0.1 | L3 second half + 1.35 s | **The duel.** Aegisblade (left, green glow) vs Veilblade (right, orange glow) fly in. Above each: the user's **Minecraft heart health bar** (green-screen keyed) with name tags "AEGISBLADE" (green) / "VEILBLADE" (orange). Three clashes on "kỹ (năng)", "phối (hợp)", "quyết (định)": wind-up, blades cross at centre, spark burst, screen shake, metallic impact SFX. Hearts drain: Veilblade 10→7→4→2, Aegisblade 10→9→8. Headline text builds on the words: "KỸ NĂNG" (white) "+" (orange) "PHỐI HỢP" (green). **Kill** at "chiến thắng" −0.45 s: Aegisblade follow-through slash, Veilblade knocked back with a red Minecraft hurt-flash (tint ≤0.45 + flicker), its hearts go to 0, it pops and disappears into the user's **Minecraft death-particle green screen**. "CHIẾN THẮNG!" (green, 120, bounce) appears bottom-centre; Aegisblade moves to centre and spins up. Kill animation runs at 1.25× speed. |
| 6 | `s_mr` | → L5 −0.1 | L4 | Kicker "MỖI TRẬN THẮNG". "MR" label (green, bold) and a big counter (white, Montserrat 190) counting **1,350 → 1,375 → 1,400 → 1,425 → 1,450**, with floating "+25 MR" chips (green) at each step. Kicker "LEO RANK" (orange) + progress bar filling, end label "ĐỈNH BẢNG XẾP HẠNG" (orange). Right: card of the user's **MR leaderboard screenshot** (`lb_mr.png`), label "BẢNG XẾP HẠNG · MR"; on "đỉnh" its top area (podium) gets a pulsing orange outline. **Note: the 1,350–1,450 and +25 values are placeholders I invented.** |
| 7 | `s_champ` | → L6 −0.1 | L5 | Kicker "ĐỈNH CAO NHẤT CỦA RANKED" (orange). Pixel-art **crown** (gold) pops in. "CHAMPION" (orange, Montserrat 200, stagger) lands on "Champion"; faint rotating light rays behind (alpha 6, deliberately subtle); orange underline. |
| 8 | `s_top` | → L8 −0.1 | L6 | Left: card of the user's **Champion top-10 screenshot** (`lb_champ.png`), label "CHAMPION · TOP 10". Right column: kicker "CHỈ DÀNH CHO" (green), "TOP 10" (white, 170) on "top 10", pill "RANK CHAMPION" (orange) on "Champion". On "armor": a pixel-art **chestplate with a shimmering orange trim pattern** (placeholder design, NOT the real trim) with an orange glow. Labels "ARMOR TRIM" (white) and "ĐỘC QUYỀN" (orange, on "độc quyền"). A pixel **padlock** pops onto the chestplate on "không có cách nào khác". |
| 9 | `s_end` | → end | L8 + 2.6 s outro | Phase A: "Còn chờ " (white) + "gì nữa?" (orange, bold), then "RỦ NGAY ĐỒNG ĐỘI" (stagger, white, 130). Phase B, from "đăng (nhập)": the **NewGen logo** (`src/img3.png`), green underline, "newgenmc.net" (white, Montserrat 64), pills "RANKED 2VS2" (green) on "chứng minh" and "TEAM MẠNH NHẤT SERVER" (orange) on "mạnh", "ĐĂNG NHẬP NGAY HÔM NAY" (green, tracked), spinning Aegisblade (left) and Veilblade (right) flanking. Fade to black over the last 0.7 s. |

Chapter labels in the HUD: `01 RANKED 2VS2`, `02 VŨ KHÍ HUYỀN THOẠI`, `03 NGẪU NHIÊN`, `04 ĐỐI ĐẦU`, `05 LEO RANK`, `06 CHAMPION`, `07 PHẦN THƯỞNG`, `08 THAM GIA`.

The removed scene `s_only` (line 7) is still defined in code but unused: rows "KHÔNG MUA ĐƯỢC" ✕ / "KHÔNG ĐỔI ĐƯỢC" ✕ (struck through, red) and "CHỈ BẰNG KỸ NĂNG" ✓ (green) beside a spinning Aegisblade.

### 3.6 Sound design (ranked)
Built by `tools/rk_sfx.py` (code in §10). Sources:
- the Katana CC0 SFX library `$HF_WORKFLOWS/katana/scripts/sfx_lib/catalog.json` (categories: ui_blip, glitch, type, ui_error, scan, dataswish, whoosh, hit, crack, poweron, flash, …), excluding `boom/`, explosions and `riser/rs50__synth_misc_16.ogg`;
- the user pack.

Placements:
- scene boundaries: user whoosh_a / whoosh_b / whoosh_long, alternating with library whooshes;
- PvP: ui_blip; meter: scan;
- "RANKED": flash; "2 vs 2": hit;
- team panels: dataswish ×2; "VS" slam: hit;
- reel ticks: synthesized clicks (not files), one per weapon passing; a flash on each landing;
- each clash: dataswish + hit (`hit/kimp__impactMetal_heavy_*` style metallic) + quiet ui_error;
- kill: whoosh + hit (−4 dB) + crack + flash; "CHIẾN THẮNG": poweron;
- MR steps: 4× ui_blip + scan;
- CHAMPION: hit + user shine;
- TOP 10: hit; Champion pill: blip; trim: flash; lock: blip;
- CTA: blips, hit on the logo + user shine.

Max reuse is 2 per file (verified).

### 3.7 Music and mix
- Music: the user's `sa.mp3` (215.4 s). Cut `-ss 101.39 -t 51.77`. The track's drop (≈135.5 s in the file) is aligned to land on "Champion" (`ss = 135.5 − T_CH5`). Fade in 0.8 s; fade out from 49.27 s over 2.7 s. Music loudnorm I=-26:TP=-6:LRA=11.
- VO track built in numpy at the EV offsets from `vofN.mp3`.
- Final mix: sidechaincompress (threshold 0.04, ratio 3, attack 30, release 500) ducks the music under the VO; VO volume 1.2; amix normalize=0; loudnorm I=-14:TP=-1.2:LRA=9. Every chain needs `aformat=sample_rates=48000:channel_layouts=stereo`, which fixed a channel-layout error. AAC 256k.

### 3.8 Version history (ranked)
| Ver | media_id | What changed / feedback |
|---|---|---|
| v1 | 6f11440a-89bf-4591-abe5-9ba5f46fd202 | First cut, 70.04 s, teal/orange background, 30-angle spins. |
| v2 | 10b4c397-6fce-42e6-9534-d88e72302161 | After feedback: "the weapons animation spinning needs to be alot smoother bro, also blur this image and make it the background for this video and the texts in the scripts that are grey looks bland and it doesnt enhance the script". Changes: 144-angle spins with blending, blurred cherry-blossom background, white + accent text with shadows. |
| v2 1.5× | 22cb5efd-f1a9-4c59-b61e-18803544c60e | **Rejected.** The user asked "speed the video up 1.5x so viewers engagement is kept throughout the video", but then said "no not like actually sped up bro, speed up the pace of the orinigal video, faster animations, transition and less silence part maybe speed up the voice by 1.2x". |
| v3 | 5d0279be-0d5e-4cd2-a336-95346c7729c6 | Voice 1.2×, shorter gaps, animation primitives 1.35× faster (`SPD`), transitions 0.2/0.38/0.42. 56.36 s. |
| **v4 (current)** | **84bca1b4-a570-4a97-9556-374ba7cbd10e** | Line 7 and its scene removed. 51.77 s. |

### 3.9 Open questions / next steps (ranked)
1. **Wait for the user's feedback on v4.**
2. **Real MR numbers:** the "+25 MR" per win and the 1,350→1,450 counter are invented placeholders. Ask the user for real values, or remove the numbers.
3. **Real armor trim:** the chestplate is a generic placeholder pattern with a padlock. Ask for a screenshot or texture of the actual exclusive trim and swap it in (`CHEST` pattern / `chest()` in `rk_scenes.py`, or paste an image).
4. Accent colour: I offered to swap orange for a blossom-pink accent to match the new background; the user didn't respond.
5. An English version of the ranked video has not been made or requested.

---

## 4. NewGen SHOWCASE video (done) — Vietnamese v6 and English v2

### 4.1 Vietnamese showcase
- Folder: `newgen-show/`. Final **v6** media_id `d4f07a7c-de5d-4ca5-9737-7b2ad95d7901` (71.5 s). v5 had the teal/orange palette; v6 added the overlapping transitions and camera drift.
- Voice: Thắm, eleven_v4. Line 1 uses **take 3**, which reads SMP as "ét em pi" and "Pay To Win" in English.
- Music: `sa.mp3` `-ss 129.2 -t 71.5`. VO start times D=[0.6, 6.4, 9.2, 17.4, 28.8, 36.9, 47.9, 60.0].
- Script — **Whisper transcript of the generated VO** (the exact prompt text is not in the files; Whisper mis-spells some words, e.g. "Dools/Duals" = Duels, "Nugent NC" = NewGenMC, "nghe thở" = nghẹt thở):
  1. Bạn đã chán với các server SMP cũ kỷ hay các server Pay2Win?
  2. Hãy đến với New Gen MC
  3. New Gen MC khác biệt hẳn so với các server Minecraft truyền thống hiện tại với một chế độ chơi chưa từng có ở Việt Nam.
  4. New Gen MC hứa hẹn sẽ là một trải nghiệm hoàn toàn khác biệt cho người chưa từng biết tới server của tụi mình. Với hai chế độ chính là Battle Royale và Competitive Dools.
  5. một nơi là chiến trường Battle Royale toàn diện và một nơi là phô diễn kỹ năng PVP với đấu trường Duals.
  6. Với bảng xếp hạn các người chơi đứng top đầu server và kho vũ khí huyền thoại đa dạng, Newgen sẽ cho bạn một trải nghiệm mà không có server nào ở Việt Nam có thể đem lại cho bạn.
  7. Hãy vào ngay Nugent NC để so tài với những player top đầu, bởi vì Nugent không chỉ là một sân chơi vui vẻ, mà nơi đây còn hội tụ những người chơi có kỹ năng PvP cực cao.
  8. Hãy chuẩn bị thật kỹ vì sự khác biệt mà New Gen đem lại sẽ làm bạn cảm thấy nghe thở.
- On-screen text and scenes (Vietnamese):
  - Scene list in order: bored, come, diff, never, promise, modes, br, duels, lb, legend, noserver, challenge, skill, ready, end.
  - Key texts:
    - "VẤN ĐỀ" style opener with struck-through "SMP CŨ KĨ" and "PAY2WIN?" next to a blurred competitor-server graph card;
    - "Hãy đến với" + NewGen logo;
    - "KHÁC BIỆT HẲN" with "SERVER TRUYỀN THỐNG / Cũ · Lặp lại ✕" vs "NEWGENMC ✓";
    - "CHƯA TỪNG CÓ / Ở VIỆT NAM";
    - "HOÀN TOÀN / KHÁC BIỆT" with the lobby screenshot;
    - "2 CHẾ ĐỘ CHÍNH" with diamond + netherite sword swings "BATTLE ROYALE" / "COMPETITIVE DUELS";
    - "CHIẾN / TRƯỜNG" with castle map and pill "TOÀN DIỆN";
    - "PHÔ DIỄN KỸ NĂNG / ĐẤU TRƯỜNG DUELS / PVP" with crossed swords;
    - "BẢNG XẾP HẠNG" with 3 leaderboard cards;
    - "HUYỀN THOẠI" with 2 legendary-menu screenshots;
    - "KHÔNG CÓ SERVER NÀO / Ở VIỆT NAM / làm được như NewGen.";
    - "VÀO NGAY / SO TÀI" with the champion top-10 card;
    - "Không chỉ là / MỘT SÂN CHƠI VUI VẺ" → "NƠI HỘI TỤ / CAO THỦ PVP / kỹ năng cực cao.";
    - "Hãy chuẩn bị thật kỹ, / sự khác biệt sẽ làm bạn / NGHẸT THỞ.";
    - logo end card with pills "BATTLE ROYALE" / "DUELS" and "VÀO NGAY HÔM NAY".

### 4.2 English showcase
- Folder: `newgen-show-en/`. **v2** media_id `8426465b-ee81-4ab7-a395-b4f25b364b2d` (85.74 s); v1 was `fc504d53-bb40-4bcc-863d-9bc90532476d`.
- Voice: the same Thắm voice reading English; first takes; cost ≈2,200 credits. Music `-ss 126.65`, so the drop lands on "Welcome".
- **Exact English script (from the user):**
  1. Are you tired of the same old SMP servers and boring Pay-to-Win experiences?
  2. Then it's time for something new. Welcome to NewgenMC.
  3. NewgenMC stands out from traditional Minecraft servers, bringing you a gamemode experience unlike anything you've experienced before.
  4. We're here to deliver an entirely new experience, especially for those who haven't discovered what our server has to offer yet.
  5. Featuring two main gamemodes: Battle Royale and Competitive Duels.
  6. One throws you into an all-out Battle Royale battlefield, where only the strongest survive. The other puts your PvP skills to the ultimate test in our competitive Duels arena.
  7. With a competitive leaderboard showcasing the server's top players and a diverse arsenal of legendary weapons, NewgenMC delivers an experience unlike any other.
  8. Join NewgenMC now and prove yourself against some of the best players on the server.
  9. Because NewgenMC isn't just another place to have fun. It's also home to some of the most skilled PvP players you'll ever face.
  10. Prepare yourself, because the unique experience NewgenMC brings will leave you absolutely breathless.
- English on-screen text:
  - THE PROBLEM; "Tired of the same old"; SMP SERVERS; "and boring"; PAY-TO-WIN?; OTHER SERVERS;
  - "Then it's time for something new.";
  - STANDS OUT; TRADITIONAL SERVERS / Same old vs NEWGENMC / Brand new;
  - A GAMEMODE EXPERIENCE / UNLIKE ANYTHING / YOU'VE SEEN BEFORE;
  - WE DELIVER / AN ENTIRELY / NEW EXPERIENCE / "for those who haven't / discovered NewgenMC yet.";
  - TWO MAIN GAMEMODES; ALL-OUT / WARFARE + pill "ONLY THE STRONGEST SURVIVE"; THE ULTIMATE TEST / COMPETITIVE DUELS ARENA / PVP;
  - COMMUNITY / LEADERBOARD (cards KILLS / WINS / RANK · MR) / "The server's top players";
  - A DIVERSE ARSENAL / LEGENDARY WEAPONS;
  - AN EXPERIENCE / UNLIKE ANY OTHER / "Only on NewgenMC.";
  - THE CHALLENGE / JOIN NOW / PROVE IT / "against the best players on the server.";
  - "Not just another place" / TO HAVE FUN → HOME OF THE MOST / SKILLED PVP PLAYERS / "you'll ever face.";
  - "Prepare yourself," / "NewgenMC will leave you" / BREATHLESS.;
  - JOIN TODAY.
  - Chapters: THE PROBLEM, NEWGENMC, DIFFERENT, GAMEMODES, COMMUNITY, ARSENAL, CHALLENGE, GET READY.
- Open item: Whisper heard line 5 as "Competitive **Jewels**". The user was asked to check whether "Duels" sounds right; a second take exists. No answer yet.

---

## 5. Other videos in the series

### 5.1 Part 1 (reference only) — `katana-newgen-1106/`
Made with the Higgsfield preset `/katana/neon-laser-motion-graphics-edit`, versions v1–v6. Whisper transcript of its VO:
1. Cách tôi đã tạo ra một server Minecraft Với hơn 163 .000 người chơi khác nhau đã trải nghiệm server
2. Vì video này sẽ khá dài nên mình đã chia ra làm 3 video khác nhau, khởi đầu, phát triển và hoàn thiện.
3. Mình đã tạo ra New Gen MC với mục đích đem lại niềm vui cho các bạn người chơi Minecraft Việt Nam với một chế độ hoàn toàn mới lạ chưa từng có ở Việt Nam. Dự án được hoàn thiện trong vòng 2 năm với hàng nghìn giờ thử nghiệm. Và đương nhiên, nó không hề dễ dàng. Mình đã phải lặn lỗi qua các server Minecraft nước ngoài để học hỏi và bỏ ra số tiền lớn để làm được New Gen như ngày hôm nay. Nếu các bạn thấy thú vị thì hãy vào ngay newgenMC .net để trải nghiệm.
4. Video sau mình sẽ đi vào chi tiết về cách vận hành và những vấn đề mình đã phải trải qua.

### 5.2 Part 2 "Phát triển" — `katana-newgen-p2/` (done, v3)
- Made with `/katana/neon-laser-motion-graphics-edit` (Katana preset_id `d18efbb3-a4e6-4b99-8e48-c439a5949630`) using a custom renderer `tools/ngp2.py` + `tools/sfx2.py`. Same series identity, fresh scenes. The Part 1 test video is used as the intro.
- It used the user's 2 dev images at the "1 năm công sức và tiền vốn 300 triệu" part, SMP images, and world-gen images bundled for the Word Gen plugin part.
- Feedback that was applied:
  - the chapter-2 text had been covered by light effects;
  - neon lines were overused;
  - the opening SFX were replaced.
- Whisper transcript of the VO:
  1. Ở video trước, mình đã cho các bạn biết sự khởi đầu của New Gen. Ở video này, mình sẽ đi sâu hơn về quá trình phát triển.
  2. Có thể các bạn không biết nhưng New Gen bắt đầu bằng chế độ SMP mà nhiều người yêu thích và mình phải nói là nó khá thành công. Nhưng mình thấy nếu muốn phát triển hơn mình cần sự đột phá và ý tưởng Battle Royale đã hình thành trong đầu mình.
  3. Mình ngay lập tức bắt đầu làm việc và sau một năm công sức cùng tiền vốn 300 triệu, server đã chính thức mở cửa cho mọi người.
  4. Thứ mình tự hào nhất là plug -in Word Gen của Server. Mình đã tự may mò và tạo ra nó trong vòng 3 tháng thử nghiệm.
  5. Các bạn có thể thấy, map của Newgen hiện tại rất đẹp và đa dạng, đó là thành quả của sự cố gắng trong 3 tháng của mình.

### 5.3 Part 3 "Hoàn thiện" — ON HOLD
Do not start it unless the user asks. No script has been received.

### 5.4 "Money" test video — `newgen-money/` (done, v3)
- Pixel-cartoon style. The user wanted it to "look fairly similar but has to have a different vibe, like abit cartoony, pixel".
- Renderer: `tools/px.py` + `tools/sfx.py`.
- The checker-pattern background was rejected as "so bland" and replaced.
- The user's cosmetics images were used for the cosmetics part, and a "number image" for the "chơi game vui vẻ" part.
- Whisper transcript:
  1. Hôm nay, mình sẽ bật mí cho các bạn biết số tiền mà mình đã phải bỏ ra để hoàn thiện New Gen MC. Nhưng trước tiên, hãy để mình kể cho các bạn nghe về hành trình mà mình đã trải qua.
  2. Đầu tiên, Newgen là một dự án mà mình đã ấp ủ từ rất lâu trước khi mình lên ý định cho cộng Battle Royale nên mình muốn cho nó được hoàn thiện một cách chỉnh tru nhất, không giống như các server Minecraft khác, chỉ tạo ra server và member phải chịu khổ chơi với nhiều lỗi.
  3. 300 triệu là số tiền để xây dựng những thứ cốt lõi của New Gen như plug -in, marketing và cơ chế game cơ bản.
  4. Sau khi server mở được 3 tháng, mình đã chi thêm 200 triệu để thêm nhiều tính năng khác cũng như nâng cấp hạ tầng cho server.
  5. Các cosmetic trong game các bạn đang dùng cũng là tiền do mình bỏ ra để mua và thêm vào cho server để các bạn có thể chơi game một cách lộng lẫy nhất.
  6. Đến nay, số tiền mình đã chi cho việc tạo ra New Gen đã lên đến hơn 600 triệu, và nó ngày càng tăng.
  7. Dù đó là một số tiền lớn, nhưng để hoàn thiện dự án trong mơ, thì mình không ngại bỏ ra số tiền này. Để cho các bạn có thể có một thời gian chơi game vui vẻ, mình không ngại phải chịu chi.
  8. Vì vậy, nếu các bạn yêu quý thì hãy ủng hộ cho Newgen bằng cách đăng nhập vào server và trải nghiệm các chế độ mà chỉ có ở Newgen Mercy nhá!

---

## 6. Assets, references and where each came from

| Asset | Where from | Location / id |
|---|---|---|
| `newgenmc_vu_khi_huyen_thoai.bbmodel` | User attachment (Blockbench model, 1.5 MB, 49 weapon groups, 1916 cubes, 259 embedded textures) | Was at `/mnt/user-data/attachments/…/7c22defd-newgenmc_vu_khi_huyen_thoai.bbmodel` in the old session. **Ask the user to re-attach it.** |
| 44 legendary renders | Rendered by me from the bbmodel (3/4 view, yaw −35°, pitch 25°, Minecraft face shading) | `legendaries_sheet.png`, `legendaries_png.zip`, sent to the user in chat |
| Duplicate models excluded | User: "there are some duped ones in there dont use the dupe models use the main one" | Excluded: Bloodchain (red), Cursed Katar (cursed_katar_right), golem_hammer (resonant), Jingu Bang (jingubang_2), **Sakura Tessen (off)**. For Sakura Tessen I kept "(on)", the open fan, as the "main" one; the user didn't object. |
| `lib_all.png` | My render; all 44 weapons at 320 px tiles in a 7×7 grid; colour on top, alpha matte below (2240×4480) | Higgsfield `a23b97a8-0ef5-43d0-a999-fd89b01808e8`; sandbox `src/` |
| `spin_aegisblade/veilblade/oceansword/thundermaul.png` | My render; 144 angles (2.5° steps), yaw −35°+, pitch 18°, 360 px tiles, 16×9 grid, colour on top / alpha below (5760×6480) | Higgsfield `f8af3a50-4236-48bb-83ee-c05b84efd516` (Aegisblade), `2f8dc467-13b4-4c6c-b151-f2216d896a32` (Veilblade), `a0ff510c-4df4-4ab3-94ee-e8e01ea78a40` (Ocean Sword), `eb5399cc-83ea-45c0-be48-621d5e03cc08` (Thundermaul) |
| `lib_spin.png` (old, 30 angles) | Superseded | `1c19c44d-6ac5-4bfa-aec7-1f9d6dde37d1` |
| Green screens: Minecraft health bar (1920×1080, 12.93 s, hearts draining 10→0) and death particle effect (854×480, 5.04 s) | User attachments ("Minecraft_Health_Bar_Green_Screen_Overlay…" and "Minecraft_death_pixel_effect_green_screen_by_vw") | Concatenated as `green_screens_combined.mp4` (hp 0–12.93 s, death 12.93–17.87 s, scaled to 1080p). Higgsfield `8f87e92a-5cc4-49cc-a64d-fc9d5c8b0de9`; sandbox `src/gs.mp4` |
| Cherry-blossom background (1920×1080 Minecraft shaders screenshot: pink leaves, bells, flowers, pond) | User attachment ("blur this image and make it the background for this video") | Higgsfield `1109abde-9020-4bad-be7a-18193e376463`; sandbox `src/background.jpg` |
| NewGen logo (sprout + "NewGen" wordmark) | User | `src/img3.png` |
| Leaderboard screenshots `lb_mr.png` (RANK · MR podium + list), `lb_champ.png` (Champion hiện tại top 10), `lb_kills.png`, `lb_wins.png` | User (showcase image bundle) | `src/` |
| Maps `map_lobby.png`, `map_castle.png`, `map_canyon.png`; legendary menu screenshots `legend1.png`, `legend2.png`; blurred competitor graph `graph_blur.png` | User (showcase bundle); competitor names blurred by me | `newgen-show/src/` |
| Diamond / netherite sword sprites `sw_dia.png`, `sw_neth.png` | User (16×16 Minecraft item textures) | `src/` |
| Music `sa.mp3` (215.4 s) | User ("use this for background music make it subtle…") | `audio/sa.mp3` |
| SFX pack `pack.wav` | User | `audio/userpack/pack.wav` |
| Older VO pronunciation references | User sent 2 older videos showing how English words should sound | (audio was extracted in the old session) |

Leaderboard player names visible in the screenshots (real players, e.g. TieuNhanBronts, EllySilverArrow, M4Lang…) are the user's own server data and are fine to show.

---

## 7. Things that were REJECTED or failed (don't retry)

- Pixel-art cartoon style for the showcase (fine only for the money video).
- My hand-drawn vector / pixel swords: use the user's sprites or bbmodel renders instead.
- Checker-pattern background; flat navy background; the teal/orange orbs background for the ranked video (it now uses the blossom image).
- Overused neon lines / laser sweeps; light rays covering text.
- Grey (`(150,182,176)`) supporting text.
- 30-frame weapon spins (choppy).
- A plain 1.5× speed-up of the finished video.
- Script lines: "Bạn đã quá quen với việc solo trong Duels?", "…đã chính thức có mặt!", "Đây không phải là một trận Duels bình thường.", "quay Roulette…", and line 7 "Không mua được, không đổi được…".
- Vietnamese-letter readings of English terms ("S mờ P", "em rờ"). Also don't splice "pây tu guyn" into Pay To Win.
- The synth riser `rs50__synth_misc_16.ogg`, any explosion or `boom/` sound, and any SFX file used more than twice.
- Sending images over 8000 px through chat (rejected by the file sender); repack the grid instead.

---

## 8. Environment notes (how the work was actually done)

- **Rendering happened in the Higgsfield cloud sandbox** (`mcp__higgsfield__sandbox_exec`), working dir `/home/user/rr/<project>`. It provides ffmpeg, Pillow, numpy and faster-whisper; fonts Montserrat at `/usr/share/fonts/truetype/higgsfield/` and Inter at `$HF_WORKFLOWS/katana/scripts/fonts/`; the CC0 SFX library at `$HF_WORKFLOWS/katana/scripts/sfx_lib/`; and `deliver.py` (final encode) at `$HF_WORKFLOWS/katana/scripts/`. Long renders ran with `background:true, size:"xl"`, as 8 parallel frame-range workers. **Files there expire 24 h after last use**, so use the zip in §0.
- **Upload flow for results:**
  1. `media_upload` (filename) → presigned PUT URL, saved to `up.txt`;
  2. in the same sandbox command, `curl -X PUT -H "Content-Type: video/mp4" --upload-file out/X.mp4 "$(cat up.txt)"`;
  3. `media_confirm` (type video);
  4. `show_result` with `action:"custom_video"`.

  A PUT returning **412** means the object was already uploaded by an earlier attempt that seemed to fail; just confirm it.
- **The local Claude workspace could not reach** upload.higgsfield.ai or cloudfront (proxy allowlist). Local-only files (the bbmodel, green screens, background) therefore had to be sent to the user with SendUserFile and uploaded by them through `media_upload_widget`. Only one video per widget upload is accepted, which is why the two green screens were concatenated. The widget returns media_ids; the CDN URL pattern is `https://d2ol7oe51mr4n9.cloudfront.net/user_3LhMjPy4UCr199g26ggXbTuJE9o/<media_id>.<ext>`.
- Long `sleep` polls (≥100 s) in the sandbox often return "Bad Gateway" even though the job is fine; poll with ~50 s sleeps.
- `pkill` patterns matching their own command line kill the calling shell; run kills in a separate call.

---

## 9. Technical design (ranked video)

### 9.1 Pipeline
```
python3 tools/prep_gs.py              # key green screens -> src/hp_keyed.npy, src/death_keyed.npy
python3 (snippet §9.4)                # spin_*.png -> src/spin144.npy (4,144,360,360,4) uint8, mmap-shared by workers
python3 tools/rk_sfx.py               # -> audio/sfx_bed.wav
bash tools/mix.sh                     # -> comp/audio.m4a
bash tools/build.sh                   # 8 workers render frames -> concat -> mux -> deliver.py -> PUT to up.txt
python3 tools/rk_scenes.py still 6.0,21.4   # QA stills -> qa/m_XX.XX.jpg (960x540)
```
`rk_scenes.py` execs `tools/mg.py` (engine: background, typography primitives, cards, sword sprites, spark/slash, logo, screenshot cache `SS`) and then execs the tail of `tools/mg_scenes.py` from `OUT_PRE, OUT_LEN` onward (transition `_fx`, `hud`, `render`, CLI main). `mg.py` itself execs `tools/timing.py`, which derives every `T_*` token time from `audio/vo/words.json`.

### 9.2 Key mechanisms
- **Layered compositing:** each scene draws onto a transparent RGBA layer (`fr.take()`). `render()` transforms each active scene's layer (camera drift + transition in/out via `xform`: affine scale/translate, Gaussian blur, horizontal motion blur by downscale-upscale) and composites them over the background (`fr.compose`). The HUD is drawn last.
- **Animation speed-up:** in `rk_scenes.py`, `SPD = 1.35` wraps `reveal/stagger/kicker/pill/card` (local time × 1.35); `spark` runs at 1.2×; the kill sequence uses `dk = (t-KILL)*1.25`.
- **Smooth spins:** `spin_img(name, angle, size)` picks frames `f0=floor(angle/2.5)` and `f1=f0+1` from `spin144.npy` and blends them premultiplied by the fractional part, then LANCZOS-resizes.
- **Reels:** `_seq(final)` is 34 random tiles (seed 11) + the final weapon + 3. Position `pe*(1-(1-u)^3)`; vertical blur by speed; alpha mask fades the top and bottom.
- **HP bars:** `hp_ct()` maps the heart count to clip time via `_HT={10:0,9:1,8:2,7:3,6:4,5:5.4,4:7,3:8,2:9,1:10,0:11}` and animates over 0.4 s.
- **Death puff:** frames 16+ of the keyed clip, scaled ×1.7, anchored at the crop point (241, 296).
- **Text shadow:** `tl()` in `mg.py` bakes a blurred dark shadow under every text layer.
- **Background:** `BGP` = background.jpg resized to (W+192)×(H+108), Gaussian blur 16, darkened 0.7 with vignette, slight purple lift. Each frame crops with a slow Lissajous drift. 30 pink/white square petal specks fall over it.

### 9.3 3D renderer for the bbmodel (runs anywhere with numpy + Pillow)
A software rasterizer. Each cube face is treated as a parallelogram; per-pixel barycentric UV with nearest-neighbour texel sampling; alpha-test ≥128; z-buffer; Minecraft-style face shading. Element rotation uses Euler order Z·Y·X about `origin`. Face UV coordinates are in 0–16 space (`uv_width/uv_height`); face `rotation` shifts the UV corner order. Animated textures (height = n × frame height) use frame `int(TIME*20/frame_time)`. Groups in `outliner` = weapons. Code in §11.

### 9.4 Rebuilding the excluded caches
```python
# src/spin144.npy from the 4 spin sheets (16 cols x 9 rows of 360px tiles; colour top half, alpha bottom half)
import numpy as np; from PIL import Image; Image.MAX_IMAGE_PIXELS=None
T=360; out=np.zeros((4,144,T,T,4),np.uint8)
for h,n in enumerate(('aegisblade','veilblade','oceansword','thundermaul')):
    a=np.asarray(Image.open(f'src/spin_{n}.png').convert('RGB')); H=a.shape[0]//2
    for f in range(144):
        x,y=(f%16)*T,(f//16)*T
        out[h,f,...,:3]=a[y:y+T,x:x+T]; out[h,f,...,3]=a[H+y:H+y+T,x:x+T,0]
np.save('src/spin144.npy',out)
```
`hp_keyed.npy` / `death_keyed.npy`: run `python3 tools/prep_gs.py` (needs `src/gs.mp4`).
Note: `mg.py` hard-codes the Inter path via `$HF_WORKFLOWS`. Outside the Higgsfield sandbox, set `FI` to any Inter variable font and `FM` to Montserrat-ExtraBold. `rk_sfx.py` and `build.sh` also depend on `$HF_WORKFLOWS/katana/scripts` (the SFX library and `deliver.py`). Outside that sandbox you need another CC0 SFX set, and can replace `deliver.py` with `ffmpeg -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a copy -movflags +faststart`.

---

## 10. Source code (ranked project, exact copies from the sandbox)

### tools/timing.py
```python
import json, subprocess
WT = json.load(open('audio/vo/words.json'))
VSP = 1.2
WT = {k: [[a / VSP, b / VSP, c] for a, b, c in v] for k, v in WT.items()}
DUR = {k: round(v / 1.2, 2) for k, v in {1: 8.91, 2: 6.35, 3: 13.48, 4: 6.43, 5: 3.63, 6: 9.25, 7: 5.15, 8: 6.69}.items()}
GAP = {1: 0.3, 2: 0.3, 3: 1.35, 4: 0.35, 5: 0.35, 6: 0.3, 7: 0.3}
EV = {}; _t = 0.35
ORDER = [1, 2, 3, 4, 5, 6, 8]
for _i in ORDER:
    EV[_i] = round(_t, 2); _t += DUR[_i] + GAP.get(_i, 0)
def w(v, i): return EV[v] + WT[str(v)][i][0]
def wf(v, tok, n=0):
    h = [x for x in WT[str(v)] if tok.lower() in x[2].lower()]; return EV[v] + h[n][0]
T_PVP = wf(1, 'pvp'); T_NAO = wf(1, 'nào'); T_VAY = wf(1, 'vậy'); T_DD1 = wf(1, 'đồng'); T_RK = wf(1, 'ranked'); T_2V2 = wf(1, 'vs')
T_DD2 = wf(2, 'đồng'); T_VK = wf(2, 'vũ'); T_DOI = wf(2, 'đối')
T_MOI = wf(3, 'mỗi', 1); T_NN = wf(3, 'ngẫu'); T_KBG = wf(3, 'không'); T_GI = wf(3, 'gì'); T_LUC = wf(3, 'lúc'); T_KN = wf(3, 'kỹ'); T_PH = wf(3, 'phối'); T_QD = wf(3, 'quyết'); T_CT = wf(3, 'chiến')
T_MR = wf(4, 'ma'); T_LEO = wf(4, 'leo'); T_DINH = wf(4, 'đỉnh')
T_CH5 = wf(5, 'champion'); T_DC = wf(5, 'đỉnh')
T_TOP = wf(6, 'top'); T_CH6 = wf(6, 'champion'); T_TRIM = wf(6, 'armor'); T_DQ = wf(6, 'độc'); T_KCC = wf(6, 'không')
T_RU = wf(8, 'dù'); T_DN = wf(8, 'đăng'); T_CM = wf(8, 'chứng'); T_MANH = wf(8, 'mạnh')
T_END = EV[8] + DUR[8] + 0.25
VS = EV
```

### tools/mix.sh
```bash
set -e; cd /home/user/rr/newgen-ranked; TOT=51.77
ffmpeg -v error -y -ss 101.39 -t $TOT -i audio/sa.mp3 -af "loudnorm=I=-26:TP=-6:LRA=11,afade=t=in:d=0.8,afade=t=out:st=49.27:d=2.7" -ar 48000 -ac 2 comp/music_cut.wav
python3 - <<'PY'
import subprocess, numpy as np
SR=48000; TOT=51.77; D=[(1,0.35),(2,8.08),(3,13.67),(4,26.25),(5,31.96),(6,35.33),(8,43.34)]
bed=np.zeros((int(TOT*SR),2),np.float32)
for k,d in D:
    x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f'audio/vo/vof{k}.mp3','-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).reshape(-1,2)
    s=int(d*SR); e=min(len(bed),s+len(x)); bed[s:e]+=x[:e-s]
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','comp/vo_track.wav'],input=bed.tobytes(),check=True)
PY
ffmpeg -v error -y -i audio/sfx_bed.wav -i comp/music_cut.wav -i comp/vo_track.wav -filter_complex "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[sfx];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=$TOT[mus];[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.2[vo];[vo]asplit[vo1][vosc];[mus][vosc]sidechaincompress=threshold=0.04:ratio=3:attack=30:release=500[duck];[duck][sfx][vo1]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9,aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:$TOT[a]" -map "[a]" -c:a aac -b:a 256k comp/audio.m4a
```

### tools/build.sh
```bash
set -e; cd /home/user/rr/newgen-ranked; OUT=newgen_ranked_2v2_v4.mp4
N=1553; Q=$((N/8))
for i in 0 1 2 3 4 5 6 7; do a=$((i*Q)); b=$(( i==7 ? N : (i+1)*Q )); python3 tools/rk_scenes.py $a $b comp/mg$i.mp4 > logs/mg$i.log 2>&1 & done
wait
printf "file 'mg%d.mp4'\n" 0 1 2 3 4 5 6 7 > comp/mgparts.txt
ffmpeg -v error -y -f concat -safe 0 -i comp/mgparts.txt -c copy comp/mgvideo.mp4
ffmpeg -v error -y -i comp/mgvideo.mp4 -i comp/audio.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest out/master.mp4
python3 $HF_WORKFLOWS/katana/scripts/deliver.py out/master.mp4 out/$OUT | tail -c 60; echo
ffprobe -v error -show_entries format=duration,size:stream=nb_frames -of compact out/$OUT
ffmpeg -v error -y -i out/$OUT -vf "fps=1/2,scale=320:180,tile=6x6" -frames:v 1 qa/sheet.jpg
curl -sf -o /dev/null -w 'PUT %{http_code}\n' -X PUT -H "Content-Type: video/mp4" --upload-file out/$OUT "$(cat up.txt)"
```

### tools/prep_gs.py
```python
import subprocess, numpy as np
from PIL import Image
W, H = 1920, 1080
def frames(ss, to):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(ss), '-to', str(to), '-i', 'src/gs.mp4', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
def key(f):
    f = f.astype(np.int16); r, g, b = f[..., 0], f[..., 1], f[..., 2]; m = np.maximum(r, b)
    k = g - m; a = 1 - np.clip((k - 25) / 50, 0, 1)
    g2 = np.minimum(g, m + 10); out = np.stack([r, g2, b, (a * 255).astype(np.int16)], -1)
    return np.clip(out, 0, 255).astype(np.uint8)
for name, ss, to, tw in (('hp', 0, 12.9, 560), ('death', 12.95, 16.0, 440)):
    fr = frames(ss, to); ks = [key(f) for f in fr]
    al = np.max(np.stack([k[..., 3] for k in ks]), 0); ys, xs = np.nonzero(al > 20)
    x0, x1, y0, y1 = xs.min() - 6, xs.max() + 6, ys.min() - 6, ys.max() + 6
    if name == 'death': cx, cy = (x0 + x1) // 2, (y0 + y1) // 2; s = max(x1 - x0, y1 - y0) // 2 + 6; x0, x1, y0, y1 = cx - s, cx + s, cy - s, cy + s
    th = int(tw * (y1 - y0) / (x1 - x0))
    arr = np.stack([np.asarray(Image.fromarray(k[max(0, y0):y1, max(0, x0):x1]).resize((tw, th), Image.NEAREST if name == 'hp' else Image.BILINEAR)) for k in ks])
    np.save(f'src/{name}_keyed.npy', arr); print(name, arr.shape, (x0, y0, x1, y1))
    Image.fromarray(arr[len(arr) // 6]).save(f'qa/{name}_key.png')
```

### tools/rk_sfx.py
```python
import json, subprocess, importlib.util, os
import numpy as np
SR = 48000; RR = os.environ['HF_WORKFLOWS'] + '/katana/scripts'
spec = importlib.util.spec_from_file_location('sh', 'tools/rk_scenes.py'); n = importlib.util.module_from_spec(spec); spec.loader.exec_module(n)
TOT = n.TOTAL
def load(path, ss=None, to=None):
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss), '-to', str(to)] if ss is not None else []) + ['-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
    k = min(len(a), int(0.004 * SR)); a[:k] *= np.linspace(0, 1, k)[:, None]; a[-k:] *= np.linspace(1, 0, k)[:, None]
    return a / (np.abs(a).max() + 1e-9)
SEG = {'shine': (3.85, 4.7), 'whoosh_a': (8.95, 10.7), 'whoosh_b': (20.75, 22.5), 'whoosh_long': (23.75, 28.2)}
U = {}
for k, (a, b) in SEG.items():
    x = load('audio/userpack/pack.wav', a, b); env = np.abs(x).max(1); w = int(0.01 * SR)
    U[k] = (x, int(np.argmax(np.convolve(env, np.ones(w) / w, 'same'))))
cat = json.load(open(f'{RR}/sfx_lib/catalog.json'))['sounds']; pick = {}
for s in cat:
    f = s['file']
    if f == 'riser/rs50__synth_misc_16.ogg' or 'explosion' in f.lower() or f.startswith('boom/'): continue
    pick.setdefault(s['cat'], []).append(s)
used = {}
def lib(c):
    lst = pick[c]; i = used.get(c, 0); used[c] = i + 1; s = lst[i % len(lst)]
    return load(f"{RR}/sfx_lib/{s['file']}"), int(s['onset'] * SR), s['file']
bed = np.zeros((int(TOT * SR) + SR, 2), np.float32); log = []
def place(x, anchor, t, g, name):
    st = int(t * SR) - anchor
    if st < 0: x = x[-st:]; st = 0
    e = min(len(bed), st + len(x)); bed[st:e] += x[:e - st] * 10 ** (g / 20); log.append({'t': round(t, 3), 'sound': name})
def user(k, t, g): x, pk = U[k]; place(x, pk, t, g, 'pack:' + k)
def L(c, t, g): x, on, f = lib(c); place(x, on, t, g, f)
B = [a for a, b, f in n.SCENES[1:]]
for b, kind in zip(B, ['whoosh_a', 'L', 'whoosh_b', 'L', 'whoosh_long', 'L', 'whoosh_a', 'whoosh_b']):
    if kind == 'L': L('whoosh', b, -14)
    else: user(kind, b, -13)
def click(t, g):
    k = int(0.012 * SR); e = np.exp(-np.arange(k) / (0.0018 * SR)); x = np.random.RandomState(int(t * 1000)).randn(k) * e
    x = np.diff(np.concatenate([[0], x])); x = np.stack([x, x], 1) / (np.abs(x).max() + 1e-9); place(x.astype(np.float32), 0, t, g, 'synth:tick')
L('ui_blip', n.T_PVP, -17); L('scan', n.T_NAO - 0.3, -22)
L('flash', n.T_RK, -16); L('hit', n.T_2V2 - 0.2, -9)
L('dataswish', n.T_DD2 - 0.35, -18); L('ui_blip', n.T_VK, -16); L('dataswish', n.T_DOI - 0.45, -18); L('hit', n.T_DOI - 0.05, -10)
for cx, col, lab, seq, t0, t1 in n.REELS:
    pe = len(seq) - 4; last = 0; tt = t0
    while tt < t1:
        u = (tt - t0) / (t1 - t0); pos = pe * (1 - (1 - u) ** 3)
        if int(pos) != last: last = int(pos); click(tt, -21 if last < pe - 6 else -18)
        tt += 1 / 240
    L('flash', t1, -12)
L('ui_blip', n.T_NN, -17)
for h in n.HITS: L('dataswish', h - 0.22, -20); L('hit', h, -6); L('ui_error', h + 0.05, -24)
L('whoosh', n.KILL - 0.2, -14); L('hit', n.KILL, -4); L('crack', n.KILL + 0.02, -10); L('flash', n.KILL + 0.25, -14)
L('poweron', n.T_CT - 0.1, -15)
for e in [n.EV[4] + 0.3, n.T_MR - 0.05, n.T_LEO + 0.35, n.T_DINH - 0.35]: L('ui_blip', e, -17)
L('scan', n.T_DINH - 0.1, -21)
L('hit', n.T_CH5 - 0.3, -8); user('shine', n.T_CH5 - 0.1, -11)
L('hit', n.T_TOP - 0.15, -11); L('ui_blip', n.T_CH6 - 0.1, -16); L('flash', n.T_TRIM - 0.3, -14); L('ui_blip', n.T_KCC - 0.1, -14)
L('ui_blip', n.T_RU - 0.2, -17); L('hit', n.T_DN - 0.1, -10); user('shine', n.T_DN + 0.1, -12); L('ui_blip', n.T_CM - 0.1, -16); L('ui_blip', n.T_MANH - 0.1, -16)
from collections import Counter
print('reuse', [x for x in Counter(l['sound'] for l in log).most_common(6) if x[0] != 'synth:tick'])
bed = bed[:int(TOT * SR)]; pk = np.abs(bed).max()
if pk > 0.89: bed *= 0.89 / pk
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'audio/sfx_bed.wav'], input=bed.tobytes(), check=True)
print('placed', len(log))
```

### tools/rk_scenes.py and tools/mg.py
Both are in the zip (`newgen-ranked/tools/`); they are the authoritative copies. `rk_scenes.py` is ~23 KB and holds all scene functions described in §3.5; `mg.py` is ~15 KB (engine). The shared tail of `tools/mg_scenes.py` that `rk_scenes.py` executes (transitions, HUD, render loop, CLI) is copied here exactly:
```python
OUT_PRE, OUT_LEN, IN_LEN = 0.3, 0.55, 0.6   # rk_scenes.py overrides to 0.2, 0.38, 0.42 after exec
def _fx(kind, e, g):
    sc = 1.0; dx = dy = 0.0; a = 1.0; bl = mb = 0.0
    if e > 0:
        q = eio(e) * 0.6 + e * e * 0.4
        if kind == 'zoom': sc *= 1 + 0.32 * q; bl += 9 * e
        elif kind == 'push': dx -= 760 * q; mb += 6 * e
        elif kind == 'rise': dy -= 300 * q; bl += 3 * e
        elif kind == 'focus': sc *= 1 - 0.07 * eo(e); bl += 14 * e
        a *= 1 - eio(clamp((e - 0.2) / 0.8))
    if g < 1:
        r = 1 - eo(g)
        if kind == 'zoom': sc *= 1 - 0.12 * r
        elif kind == 'push': dx += 520 * r; mb += 5 * r
        elif kind == 'rise': dy += 240 * r
        elif kind == 'focus': sc *= 1 + 0.08 * r; bl += 10 * r
    return sc, dx, dy, a, bl, mb
def hud(fr, t):
    a = 1 - clamp((t - T_END) / 0.4)
    if a <= 0: return
    fr.paste(tl('NEWGENMC', FM, 22, WHITE, 6), 60, 44, 0.8 * a)
    l = tl('newgenmc.net', FI, 22, MUTED, 2, 'Medium'); fr.paste(l, W - 60 - l.width, 46, a)
    cur = [c for c in CHAP if c[0] <= t][-1]
    fr.paste(tl(cur[1], FI, 22, GREEN, 2, 'Bold'), 60, H - 76, a); fr.paste(tl('— ' + cur[2], FI, 22, MUTED, 4, 'SemiBold'), 104, H - 76, a)
    fr.o().rectangle((W - 360, H - 62, W - 60, H - 60), fill=(255, 255, 255, int(40 * a))); fr.o().rectangle((W - 360, H - 62, W - 360 + 300 * t / TOTAL, H - 60), fill=GREEN + (int(220 * a),))
def render(t):
    global CUR_T
    CUR_T = t; fr = Frame(t); layers = []; gray = 0.0; n = len(SCENES)
    for i, (a, b, fn) in enumerate(SCENES):
        end = b + (OUT_LEN - OUT_PRE if i < n - 1 else 0)
        if not (a <= t < end): continue
        e = clamp((t - (b - OUT_PRE)) / OUT_LEN) if i < n - 1 else 0.0
        g = clamp((t - a) / IN_LEN) if i > 0 else 1.0
        fr.gray = 0.0; fn(fr, t - a, b - a, t); L = fr.take()
        sc_, dx, dy, al, bl, mb = _fx(KINDS[i] if i < n - 1 else 'zoom', e, 1.0) if e > 0 else (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
        if g < 1:
            s2, dx2, dy2, _, bl2, mb2 = _fx(KINDS[i - 1], 0, g); sc_ *= s2; dx += dx2; dy += dy2; bl += bl2; mb += mb2
        u = (t - a) / max(0.1, b - a); dirn = 1 if i % 2 == 0 else -1
        sc_ *= 1 + 0.03 * u; dx += dirn * 14 * (u - 0.5)
        layers.append(xform(L, sc_, dx, dy, al, bl, mb)); gray += fr.gray * al
    fr.compose(layers); fr.gray = min(gray, 0.8)
    hud(fr, t)
    return fr.finish()
if __name__ == '__main__':
    if sys.argv[1] == 'still':
        for s in sys.argv[2].split(','):
            Image.fromarray(render(float(s))).resize((960, 540)).save(f'qa/m_{float(s):05.2f}.jpg', quality=84)
    else:
        f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for i in range(f0, f1): p.stdin.write(render(i / FPS).tobytes())
        p.stdin.close(); p.wait()
```

Key definitions inside `rk_scenes.py` (exact excerpts) that a reimplementation needs:
```python
TOTAL = round(T_END + 2.6, 2)
SPD = 1.35   # wraps reveal/stagger/kicker/pill/card with lt * SPD; spark uses lt * 1.2
NAMES = ['Boltspear', 'Shellblaster', 'Seekerbow', 'Axolotl Gun', 'Lancebolt', 'Hiveburst', 'Skystrider', 'Corrupted Crossbow', 'Creaking Scythe', 'Bloodchain', 'Cursed Katar', 'Blinkblade', 'Jade Edge', 'Voidbow', 'Fangcaller', 'Aegisblade', 'Golem Hammer', 'Grimoire of Debts', 'Gruntilda', 'Harpoon Launcher', 'Heaven Wand', 'Charmstaff', 'Arcane Scroll', 'Jingu Bang', 'Kim the Transmuter', 'Last Rose', 'Relic Sniffer', 'Froststaff', 'Magma Club', 'Goldreaper', 'Thundermaul', 'Ocean Sword', 'Tidepiercer', 'Toxicannon', 'Warcall', 'Sakura Tessen', 'Veilblade', 'Sizeshifter', 'Shuriken', 'Sonic Crossbow', 'Soul Gauntlet', 'Silkstrike', 'Tim the Enchanter', 'Rendpick']
HERO = ['Aegisblade', 'Veilblade', 'Ocean Sword', 'Thundermaul']; NF = 144
SPN = np.load('src/spin144.npy', mmap_mode='r')
def spin_img(name, ang, s):
    h = HERO.index(name); x = (ang % 360) / 2.5; f0 = int(x) % NF; f1 = (f0 + 1) % NF; w = x - int(x)
    a0 = SPN[h, f0].astype(np.float32); a1 = SPN[h, f1].astype(np.float32)
    al = a0[..., 3:] * (1 - w) + a1[..., 3:] * w; pm = a0[..., :3] * a0[..., 3:] * (1 - w) + a1[..., :3] * a1[..., 3:] * w
    rgb = pm / np.maximum(al, 1e-3); im = Image.fromarray(np.concatenate([rgb, al], -1).clip(0, 255).astype(np.uint8), 'RGBA')
    s = max(8, int(s)); return im.resize((s, s), Image.LANCZOS)
HITS = [T_KN - 0.08, T_PH - 0.08, T_QD - 0.08]; KILL = T_CT - 0.45; CS = T_LUC - 0.2
REELS = [(600, GREEN, 'ĐỘI CỦA BẠN', _seq(NAMES.index('Aegisblade')), T_MOI - 0.1, T_KBG + 0.9), (1320, ORANGE, 'ĐỐI THỦ', _seq(NAMES.index('Veilblade')), T_MOI + 0.1, T_GI + 0.05)]
CROWN = pixart(['a...a...a', 'aa.aba.aa', 'aaaaaaaaa', 'abaaaaaba', '.aaaaaaa.'], 14, {'a': (255, 196, 80), 'b': (255, 120, 90)})
CHEST = ['.ddd......ddd.', 'ddtdd....ddtdd', 'dddtddddddtddd', 'eeddtddddtddee', '.ddddtddtdddd.', '..ddddttdddd..', '..dddttttddd..', '..ddttddttdd..', '..dddttttddd..', '..ddddttdddd..', '..tttttttttt..', '..dddddddddd..']
LOCK = pixart(['.aaa.', 'a...a', 'a...a', 'bbbbb', 'bbcbb', 'bbcbb', 'bbbbb'], 9, {'a': (200, 205, 210), 'b': (255, 190, 80), 'c': (60, 40, 20)})
CHAP = [(0, '01', 'RANKED 2VS2'), (EV[2] - 0.1, '02', 'VŨ KHÍ HUYỀN THOẠI'), (EV[3] - 0.1, '03', 'NGẪU NHIÊN'), (CS, '04', 'ĐỐI ĐẦU'), (EV[4] - 0.1, '05', 'LEO RANK'),
        (EV[5] - 0.1, '06', 'CHAMPION'), (EV[6] - 0.1, '07', 'PHẦN THƯỞNG'), (EV[8] - 0.1, '08', 'THAM GIA')]
SCENES = [(0.0, T_VAY - 0.15, s_q), (T_VAY - 0.15, EV[2] - 0.1, s_title), (EV[2] - 0.1, EV[3] - 0.1, s_arms), (EV[3] - 0.1, CS, s_roll), (CS, EV[4] - 0.1, s_clash),
          (EV[4] - 0.1, EV[5] - 0.1, s_mr), (EV[5] - 0.1, EV[6] - 0.1, s_champ), (EV[6] - 0.1, EV[8] - 0.1, s_top), (EV[8] - 0.1, TOTAL, s_end)]
KINDS = ['zoom', 'push', 'rise', 'focus', 'push', 'zoom', 'rise', 'focus', 'zoom']
_src = open('tools/mg_scenes.py').read(); exec(_src[_src.index('OUT_PRE, OUT_LEN'):])
OUT_PRE, OUT_LEN, IN_LEN = 0.2, 0.38, 0.42
```

Engine background and text-shadow code in `mg.py` (exact):
```python
_bgsrc = Image.open('src/background.jpg').convert('RGB').resize((W + 192, H + 108), Image.LANCZOS).filter(ImageFilter.GaussianBlur(16))
_b = np.asarray(_bgsrc).astype(np.float32)
_yy, _xx = np.mgrid[0:H + 108, 0:W + 192].astype(np.float32)
_vg = np.sqrt(((_xx - (W + 192) / 2) / ((W + 192) / 2)) ** 2 + ((_yy - (H + 108) / 2) / ((H + 108) / 2)) ** 2)
_b = _b * (0.7 - 0.24 * np.clip(_vg - 0.35, 0, 1))[..., None]
_b = _b * 0.9 + np.array([10, 4, 14], np.float32)
BGP = Image.fromarray(np.clip(_b, 0, 255).astype(np.uint8))
# Frame.__init__:
#   ox = 96 + 70 * math.sin(t * 0.06); oy = 54 + 36 * math.cos(t * 0.045)
#   s.bg = BGP.crop((int(ox), int(oy), int(ox) + W, int(oy) + H)).convert('RGBA'); s.d = ImageDraw.Draw(s.bg, 'RGBA')
#   30 petals: sp = 22 + r*30; x = (r*W + sin(t*0.5+i)*40 + t*12) % W; y = (r*H + t*sp) % H; size 2-5.5 px squares, pink (255,170-220,200-240) or white, alpha 90-180
# tl() text shadow:
#   sh = alpha.filter(GaussianBlur(max(2, size*0.06))) * 0.7, colour (8,6,12), offset down max(1, size//30) px, composited under the text
```

---

## 11. Local tool: bbmodel renderer (`bbtool/render.py`) and spin-sheet builder (`bbtool/spin_hd.py`)
These ran in the local Claude workspace, which had numpy, Pillow and ffmpeg. Usage:
- `python3 -I render.py model.bbmodel outdir` renders every non-duplicate weapon (3/4 view) to `outdir/NN_Name.png`;
- `python3 -I spin_hd.py model.bbmodel` writes 144-angle spin sheets for 4 heroes (12-column layout; I then repacked them to 16 columns × 9 rows to stay under 8000 px, see the snippet after the code).

### bbtool/render.py
```python
import json, base64, io, math, sys, os, re
import numpy as np
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else '/tmp/x'
YAW, PITCH = float(os.environ.get('YAW', '-35')), float(os.environ.get('PITCH', '25'))
os.makedirs(OUT, exist_ok=True)
d = json.load(open(SRC))
TEX = []
for t in d['textures']:
    im = Image.open(io.BytesIO(base64.b64decode(t['source'].split(',', 1)[1]))).convert('RGBA')
    w = im.width; fh = int(w * t.get('uv_height', 16) / t.get('uv_width', 16))
    a = np.asarray(im); fr = [a[i:i + fh] for i in range(0, im.height - fh + 1, fh)] if im.height > fh and im.height % fh == 0 else [a]
    TEX.append((fr, t.get('uv_width', 16), t.get('uv_height', 16), t.get('frame_time', 1) or 1))
EL = {e['uuid']: e for e in d['elements']}
def rmat(r):
    x, y, z = [math.radians(a) for a in r]
    Rx = np.array([[1, 0, 0], [0, math.cos(x), -math.sin(x)], [0, math.sin(x), math.cos(x)]])
    Ry = np.array([[math.cos(y), 0, math.sin(y)], [0, 1, 0], [-math.sin(y), 0, math.cos(y)]])
    Rz = np.array([[math.cos(z), -math.sin(z), 0], [math.sin(z), math.cos(z), 0], [0, 0, 1]])
    return Rz @ Ry @ Rx
SHADE = {'up': 1.0, 'down': 0.55, 'north': 0.82, 'south': 0.82, 'east': 0.68, 'west': 0.68}
def faces(e, M=np.eye(3), O=np.zeros(3)):
    inf = e.get('inflate', 0); f = np.array(e['from'], float) - inf; t = np.array(e['to'], float) + inf
    R = rmat(e.get('rotation', [0, 0, 0])); o = np.array(e.get('origin', [0, 0, 0]), float)
    fx, fy, fz = f; tx, ty, tz = t
    C = {'north': ((tx, ty, fz), (fx, ty, fz), (tx, fy, fz)), 'south': ((fx, ty, tz), (tx, ty, tz), (fx, fy, tz)),
         'east': ((tx, ty, tz), (tx, ty, fz), (tx, fy, tz)), 'west': ((fx, ty, fz), (fx, ty, tz), (fx, fy, fz)),
         'up': ((fx, ty, fz), (tx, ty, fz), (fx, ty, tz)), 'down': ((fx, fy, tz), (tx, fy, tz), (fx, fy, fz))}
    for k, fc in e['faces'].items():
        if fc.get('texture') is None or k not in C: continue
        P = [(R @ (np.array(p) - o) + o) for p in C[k]]
        P = [M @ (p - O) + O for p in P]
        yield k, P, fc
TIME = 0.0
FIT = None
def render(els, S=1100, crop=True):
    fl = [x for e in els for x in faces(e)]
    if not fl: return None
    pts = np.array([p for _, P, _ in fl for p in P] + [P[1] + P[2] - P[0] for _, P, _ in fl])
    V = rmat([PITCH, 0, 0]) @ rmat([0, YAW, 0])
    sp = pts @ V.T; mn, mx = sp.min(0), sp.max(0); ext = max(mx[0] - mn[0], mx[1] - mn[1]) or 1
    sc = (S * 0.9) / ext; cx, cy = (mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2
    if FIT: sc, cx, cy = FIT
    def proj(p): q = V @ p; return np.array([S / 2 + (q[0] - cx) * sc, S / 2 - (q[1] - cy) * sc, q[2]])
    img = np.zeros((S, S, 4), np.float32); zb = np.full((S, S), -1e9, np.float32)
    for k, P, fc in fl:
        A, B, Cc = [proj(p) for p in P]
        e1, e2 = B - A, Cc - A; det = e1[0] * e2[1] - e1[1] * e2[0]
        if abs(det) < 1e-6: continue
        D = A + e1 + e2; xs = [A[0], B[0], Cc[0], D[0]]; ys = [A[1], B[1], Cc[1], D[1]]
        x0, x1 = max(0, int(min(xs))), min(S - 1, int(math.ceil(max(xs)))); y0, y1 = max(0, int(min(ys))), min(S - 1, int(math.ceil(max(ys))))
        if x1 < x0 or y1 < y0: continue
        X, Y = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        dx, dy = X - A[0], Y - A[1]
        s = (dx * e2[1] - dy * e2[0]) / det; t = (e1[0] * dy - e1[1] * dx) / det
        m = (s >= 0) & (s <= 1) & (t >= 0) & (t <= 1)
        if not m.any(): continue
        z = A[2] + s * e1[2] + t * e2[2]
        u1, v1, u2, v2 = fc['uv']; uvs = [(u1, v1), (u2, v1), (u2, v2), (u1, v2)]
        r = int(fc.get('rotation', 0)) // 90 % 4; uvs = uvs[r:] + uvs[:r]
        (ua, va), (ub, vb), _, (uc, vc) = uvs
        U = ua + s * (ub - ua) + t * (uc - ua); W_ = va + s * (vb - va) + t * (vc - va)
        frs, uw, uh, ft = TEX[fc['texture']]; tex = frs[int(TIME * 20 / ft) % len(frs)]; th, tw = tex.shape[:2]
        px = np.clip((U * tw / uw).astype(int), 0, tw - 1); py = np.clip((W_ * th / uh).astype(int), 0, th - 1)
        c = tex[py, px].astype(np.float32)
        m &= c[..., 3] >= 128
        sub = zb[y0:y1 + 1, x0:x1 + 1]; m &= z > sub
        if not m.any(): continue
        c[..., :3] *= SHADE[k]; c[..., 3] = 255
        sub[m] = z[m]; img[y0:y1 + 1, x0:x1 + 1][m] = c[m]
    im = Image.fromarray(img.clip(0, 255).astype(np.uint8), 'RGBA')
    bb = im.getbbox(); im = im.crop(bb) if (bb and crop) else im
    return im
def collect(node):
    out = []
    for c in node['children']:
        if isinstance(c, str):
            if c in EL and EL[c].get('visibility', True) is not False: out.append(EL[c])
        else: out += collect(c)
    return out
DUPES = {'Bloodchain (red)', 'Cursed Katar (cursed_katar_right)', 'golem_hammer (resonant)', 'Jingu Bang (jingubang_2)', 'Sakura Tessen (off)'}
if __name__ == '__main__':
  names = []
  only = os.environ.get('ONLY')
  for i, g in enumerate(d['outliner']):
      if only and str(i) not in only.split(','): continue
      if g['name'] in DUPES: continue
      im = render(collect(g))
      if im is None: continue
      fn = f"{len(names) + 1:02d}_{re.sub(r'[^A-Za-z0-9]+', '_', g['name']).strip('_')}.png"
      im.save(os.path.join(OUT, fn)); names.append((g['name'], fn)); print(fn, im.size, flush=True)
  json.dump(names, open(os.path.join(OUT, 'index.json'), 'w'))
```

### bbtool/spin_hd.py
```python
import sys, importlib.util
import numpy as np
sys.argv = ['x', sys.argv[1]]
spec = importlib.util.spec_from_file_location('R', '/tmp/claude-0/-home-claude/79d686c9-5d86-53b1-936f-1346f9a262ca/scratchpad/bbtool/render.py'); R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
from PIL import Image
OUT = '/tmp/claude-0/-home-claude/79d686c9-5d86-53b1-936f-1346f9a262ca/scratchpad/bb/'
D = {g['name']: R.collect(g) for g in R.d['outliner']}
T, NF, C = 360, 144, 12
for n, fn in (('Aegisblade', 'spin_aegisblade'), ('Veilblade', 'spin_veilblade'), ('Ocean Sword', 'spin_oceansword'), ('Thundermaul', 'spin_thundermaul')):
    els = D[n]; pts = np.array([p for e in els for _, P, _ in R.faces(e) for p in P]); c0 = (pts.min(0) + pts.max(0)) / 2; rad = np.linalg.norm(pts - c0, axis=1).max()
    sheet = Image.new('RGBA', (C * T, (NF // C) * T), (0, 0, 0, 0))
    for f in range(NF):
        R.YAW = -35 + 360 * f / NF; R.PITCH = 18
        V = R.rmat([R.PITCH, 0, 0]) @ R.rmat([0, R.YAW, 0]); q = V @ c0
        R.FIT = (1080 * 0.49 / rad, q[0], q[1])
        im = R.render(els, 1080, crop=False).resize((T, T), Image.LANCZOS)
        sheet.alpha_composite(im, ((f % C) * T, (f // C) * T))
    w, h = sheet.size; a = sheet.getchannel('A'); out = Image.new('RGB', (w, h * 2)); out.paste(sheet.convert('RGB'), (0, 0), a); out.paste(Image.merge('RGB', (a, a, a)), (0, h))
    out.save(OUT + fn + '.png', optimize=True); print(fn, out.size, flush=True)
```

### bbtool/lib.py (all-weapons sheet `lib_all.png`, 320px tiles, 7x7, colour top / alpha bottom; also the old 30-frame lib_spin)
```python
import sys, json, importlib.util
import numpy as np
sys.argv = ['x', sys.argv[1]]
spec = importlib.util.spec_from_file_location('R', '/tmp/claude-0/-home-claude/79d686c9-5d86-53b1-936f-1346f9a262ca/scratchpad/bbtool/render.py'); R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
from PIL import Image
G = [(g['name'], R.collect(g)) for g in R.d['outliner'] if g['name'] not in R.DUPES]
OUT = '/tmp/claude-0/-home-claude/79d686c9-5d86-53b1-936f-1346f9a262ca/scratchpad/bb/'
def pack(color, path):
    w, h = color.size; a = color.getchannel('A')
    out = Image.new('RGB', (w, h * 2), (0, 0, 0)); out.paste(color.convert('RGB'), (0, 0), a)
    out.paste(Image.merge('RGB', (a, a, a)), (0, h)); out.save(path, optimize=True); print(path, out.size)
T = 320
# all weapons, 3/4 view, centred in tiles
C = 7; sheet = Image.new('RGBA', (C * T, C * T), (0, 0, 0, 0)); names = []
R.YAW, R.PITCH = -35, 25
for i, (n, els) in enumerate(G):
    im = R.render(els, 900); im.thumbnail((T - 16, T - 16), Image.LANCZOS)
    r, c = divmod(i, C); sheet.alpha_composite(im, (c * T + (T - im.width) // 2, r * T + (T - im.height) // 2)); names.append(n)
pack(sheet, OUT + 'lib_all.png')
# turntables
HERO = ['Aegisblade', 'Veilblade', 'Ocean Sword', 'Thundermaul']; NF = 30
D = dict(G); sheet = Image.new('RGBA', (12 * T, 10 * T), (0, 0, 0, 0))
for h, n in enumerate(HERO):
    els = D[n]; pts = np.array([p for e in els for _, P, _ in R.faces(e) for p in P]); c0 = (pts.min(0) + pts.max(0)) / 2; rad = np.linalg.norm(pts - c0, axis=1).max()
    for f in range(NF):
        R.YAW = -35 + 360 * f / NF; R.PITCH = 18
        V = R.rmat([R.PITCH, 0, 0]) @ R.rmat([0, R.YAW, 0]); q = V @ c0
        R.FIT = (900 * 0.49 / rad, q[0], q[1])
        im = R.render(els, 900, crop=False).resize((T, T), Image.LANCZOS)
        k = h * NF + f; r, c = divmod(k, 12); sheet.alpha_composite(im, (c * T, r * T))
    R.FIT = None
pack(sheet, OUT + 'lib_spin.png')
json.dump({'all': names, 'tile': T, 'cols_all': 7, 'hero': HERO, 'nf': NF, 'cols_spin': 12}, open(OUT + 'lib_meta.json', 'w'))
print(names)
```

### Repack 12-col spin sheets to 16x9 (keeps images under 8000 px)
```python
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
T, NF = 360, 144
for n in ('aegisblade', 'veilblade', 'oceansword', 'thundermaul'):
    im = Image.open(f'spin_{n}.png'); h = im.height // 2
    out = Image.new('RGB', (16 * T, 9 * T * 2))
    for f in range(NF):
        sx, sy = (f % 12) * T, (f // 12) * T; dx, dy = (f % 16) * T, (f // 16) * T
        out.paste(im.crop((sx, sy, sx + T, sy + T)), (dx, dy)); out.paste(im.crop((sx, sy + h, sx + T, sy + h + T)), (dx, dy + 9 * T))
    out.save(f'spin_{n}.png', optimize=True)
```

### Green-screen merge (one video per upload widget)
```bash
ffmpeg -i health_bar.mp4 -i death_effect.mp4 -filter_complex "[0:v]fps=30,format=yuv420p,setsar=1[a];[1:v]scale=1920:1080:flags=neighbor,fps=30,format=yuv420p,setsar=1[b];[a][b]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v libx264 -crf 12 -preset slow green_screens_combined.mp4
```

---

## 12. Next steps checklist for the new session

1. Download the project zip (§0) and unzip it. Rebuild the `.npy` caches (§9.4). If you're not in the Higgsfield sandbox, point the fonts and SFX library at local equivalents (§9.4 note).
2. Ask the user for feedback on **Ranked 2vs2 v4**. Pending items:
   - real MR values, or remove the numbers;
   - a real armor-trim image;
   - optional pink accent.
3. To change on-screen text, edit `tools/rk_scenes.py`. To change timing or voice, edit `tools/timing.py` (EV/GAP/ORDER), `tools/mix.sh` (TOT, `-ss` = 135.5 − T_CH5, fade start = TOT − 2.5, the D list) and `tools/build.sh` (N = round(TOTAL×30), OUT name). Then run `rk_sfx.py`, `mix.sh`, `build.sh`, and check stills.
4. Any new voice line: ElevenLabs `eleven_v4`, voice `0ggMuQ1r9f9jqBu50nJn` (Thắm). Spell English acronyms phonetically ("ét em pi", "em a", "2 versus 2"). Re-run Whisper word timings and apply `atempo=1.2`.
5. Before every delivery, confirm:
   - no SFX file used more than twice, no explosion or banned riser;
   - no grey text;
   - no still frames;
   - no overused single effect;
   - competitor names blurred;
   - no "kingmc.vn".
6. Part 3 "Hoàn thiện" stays on hold until the user brings it up.
7. Open showcase item: confirm the English "Competitive Duels" pronunciation (Whisper heard "Jewels").
