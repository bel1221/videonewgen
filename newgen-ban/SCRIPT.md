# NewGen — Hệ thống ban (draft v3)

Idea from the user: "Cách hệ thống ban của newgen hoạt động, anticheat tự động ban những người chơi bị nghi vấn hack,
nếu gặp hacker trong trận quay video lại và đăng bài report, tổng số hacker bị ban + statistic".
**Length target: under 50 s total** (user: "short and fits in a video range of 50 seconds so viewers engagement isn't lost").
Status: script draft v3 (real numbers in), ref images in `src/`; encounter animation in progress.

## Timing estimate
Measured from the Ranked 2vs2 VO (Thắm, eleven_v4): 3.52 words/s at 1×, **4.23 words/s at 1.2×**.
v3 = 169 words with the numbers spoken out → ~40 s of voice + gaps (0.3 s, 1.0 s after the stats line) + 2.6 s outro ≈ **45 s**.
That leaves ~5 s headroom for take-to-take variation. If it runs long, cut "không cần chờ admin" (line 2) first.

## Script

| # | Voice-over | On-screen idea | Chapter |
|---|---|---|---|
| 1 | Gặp hacker trong trận và tự hỏi server có làm gì không? Ở NewGen, câu trả lời là có! | "GẶP HACKER?" (orange) → "SERVER CÓ LÀM GÌ KHÔNG?" → "CÓ!" (green, bounce, shake) | 01 — HACKER? |
| 2 | Hệ thống anticheat của NewGen theo dõi mọi trận đấu. Khi phát hiện dấu hiệu bất thường như aim không giống người thật hay đánh quá xa, nó sẽ tự động ban người chơi bị nghi vấn hack, không cần chờ admin. | Scan line over a duel screenshot; flag cards "AIM BẤT THƯỜNG" (real ban reason: "[Aim-AI] MLSAC Detection"), "ĐÁNH QUÁ XA" → red "BANNED" stamp with Minecraft hurt-flash; chip "TỰ ĐỘNG" | 02 — ANTICHEAT |
| 3 | Nhưng không có hệ thống nào hoàn hảo cả. Nếu gặp hacker mà anticheat chưa bắt được, hãy quay video lại và đăng bài report trên Discord của NewGen. | "QUAY VIDEO" (rec dot pulsing) → "ĐĂNG REPORT" over the real Discord forum screenshot (`src/report_forum.png`, #report/feedback, tag cheats/exploits/sus) | 03 — REPORT |
| 4 | Staff sẽ xem xét từng video, và nếu đúng là hack, người chơi đó sẽ bị ban. | Report card → "ĐANG XEM XÉT" → "XÁC NHẬN HACK" → "BANNED" | 03 — REPORT |
| 5 | Tính đến nay, anticheat đã tự động ban 3.185 người chơi, staff ban thêm 2.142 người, và mỗi ngày có khoảng 60 hacker bị anticheat ban. | Counter "3.185" (green, label "ANTICHEAT TỰ ĐỘNG BAN"), counter "2.142" (orange, "STAFF BAN"), chip "~60 HACKER / NGÀY"; card of the ban list (`src/banlist_ai.png`); 1 s hold | 04 — THỐNG KÊ |
| 6 | Ở NewGen, thắng thua chỉ được quyết định bằng kỹ năng thật. Hãy chơi thật fair, và thấy hacker thì report ngay nhá! | "CHỈ BẰNG KỸ NĂNG" → logo end card, "newgenmc.net", pill "REPORT HACKER" | 05 — CÔNG BẰNG |

## Changes from v1 (55–60 s → ~44 s)
- 8 lines → 6. Dropped the "hôm nay mình sẽ cho các bạn thấy…" intro line and the separate fairness line (folded into line 6).
- Hook shortened to one question + answer. Anticheat explanation merged into one line with two examples (aim example cut).
- v3: real numbers (anticheat 3,185 / staff 2,142 / ~60 per day); aim example back in (matches the real Aim-AI ban reason).

## Facts (from the user, 2026-11-08)
- Banned by anticheat: **3,185** players. Banned by staff: **2,142**. Anticheat bans **~60 hackers per day**.
- Ban page shows 1,244 players currently banned, 491 permanently (screenshot `src/banlist_perm.png`).
- Automatic bans read "[Aim-AI] MLSAC Detection (VL:n)" and last 2 years (`src/banlist_ai.png`).
- Reports: Discord forum #report/feedback, tag "cheats/exploits/sus", players post videos (`src/report_forum.png`).
- Ban list shows real usernames; blur them unless the user says otherwise.

## Still open
1. Do staff really review every report video (line 4)?

## Voice notes (ElevenLabs Thắm, eleven_v4)
- Test takes for "anticheat" (should sound English: "an-ti-chít"); if it comes out letter-by-letter, respell it.
- "fair" may be mispronounced; fallback "chơi đẹp".
- "report", "hack", "hacker", "admin" are common in Vietnamese gaming speech; check them in the first take.
- Numbers: TTS prompt spells them out: "ba nghìn một trăm tám mươi lăm", "hai nghìn một trăm bốn mươi hai", "sáu mươi".
