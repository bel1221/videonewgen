# NewGen — Hệ thống ban (draft v2)

Idea from the user: "Cách hệ thống ban của newgen hoạt động, anticheat tự động ban những người chơi bị nghi vấn hack,
nếu gặp hacker trong trận quay video lại và đăng bài report, tổng số hacker bị ban + statistic".
**Length target: under 50 s total** (user: "short and fits in a video range of 50 seconds so viewers engagement isn't lost").
Status: script draft v2, waiting for the user's notes, real numbers, ref images and assets.

## Timing estimate
Measured from the Ranked 2vs2 VO (Thắm, eleven_v4): 3.52 words/s at 1×, **4.23 words/s at 1.2×**.
v2 = 162 words → ~38.3 s of voice + gaps (0.3 s, 1.0 s after the stats line) + 2.6 s outro ≈ **43–44 s**.
That leaves ~6 s headroom for take-to-take variation and the length of the real numbers. If the real numbers read long,
cut "không cần chờ admin" (line 2) first.

## Script

| # | Voice-over | On-screen idea | Chapter |
|---|---|---|---|
| 1 | Gặp hacker trong trận và tự hỏi server có làm gì không? Ở NewGen, câu trả lời là có! | "GẶP HACKER?" (orange) → "SERVER CÓ LÀM GÌ KHÔNG?" → "CÓ!" (green, bounce, shake) | 01 — HACKER? |
| 2 | Hệ thống anticheat của NewGen theo dõi mọi trận đấu. Khi phát hiện dấu hiệu bất thường như đánh quá xa hay di chuyển quá nhanh, nó sẽ tự động ban người chơi bị nghi vấn hack, không cần chờ admin. | Scan line over a duel screenshot; flag cards "ĐÁNH QUÁ XA", "DI CHUYỂN QUÁ NHANH" → red "BANNED" stamp with Minecraft hurt-flash; chip "TỰ ĐỘNG" | 02 — ANTICHEAT |
| 3 | Nhưng không có hệ thống nào hoàn hảo cả. Nếu gặp hacker mà anticheat chưa bắt được, hãy quay video lại và đăng bài report trên [Discord của NewGen]. | "QUAY VIDEO" (rec dot pulsing) → "ĐĂNG REPORT" over a card of the real report channel/form | 03 — REPORT |
| 4 | Admin sẽ xem xét từng video, và nếu đúng là hack, người chơi đó sẽ bị ban. | Report card → "ĐANG XEM XÉT" → "XÁC NHẬN HACK" → "BANNED" | 03 — REPORT |
| 5 | Tính đến nay, NewGen đã ban tổng cộng [X] hacker, [Y]% bị anticheat bắt tự động, số còn lại là nhờ report của các bạn. | Big counter counting up to [X]; split bar ANTICHEAT [Y]% / REPORT; 1 s hold after the line | 04 — THỐNG KÊ |
| 6 | Ở NewGen, thắng thua chỉ được quyết định bằng kỹ năng thật. Hãy chơi thật fair, và thấy hacker thì report ngay nhá! | "CHỈ BẰNG KỸ NĂNG" → logo end card, "newgenmc.net", pill "REPORT HACKER" | 05 — CÔNG BẰNG |

Square brackets = facts needed from the user before recording.

## Changes from v1 (55–60 s → ~44 s)
- 8 lines → 6. Dropped the "hôm nay mình sẽ cho các bạn thấy…" intro line and the separate fairness line (folded into line 6).
- Hook shortened to one question + answer. Anticheat explanation merged into one line with two examples (aim example cut).
- Stats line keeps the total and the anticheat share; reports become "số còn lại" instead of a third number.

## Needed from the user
1. Real numbers for line 5: total hackers banned [X] and share caught automatically [Y]%, plus the time period.
2. Where players post reports (Discord channel name, forum, website form?) - line 3.
3. Do admins really review every report video (line 4)?
4. Are the line-2 examples right (reach, speed), or name the hacks the anticheat catches most?

## Voice notes (ElevenLabs Thắm, eleven_v4)
- Test takes for "anticheat" (should sound English: "an-ti-chít"); if it comes out letter-by-letter, respell it.
- "fair" may be mispronounced; fallback "chơi đẹp".
- "report", "hack", "hacker", "admin" are common in Vietnamese gaming speech; check them in the first take.
- Numbers: write them as words in the TTS prompt if the voice reads digits oddly.
