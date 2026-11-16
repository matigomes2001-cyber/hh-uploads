# Glow Steps: the style for the AI Shorts channel

Vertical 1080x1920, 30 fps, canvas-rendered, same engine as the faceless-shorts skill (index.html, src/main.js, tools/capture.mjs, tools/mix.py are the skill's scaffold, kept here with Glow Steps changes). Voice am_puck, music "bed", captions OFF ("captions": false in script.json). Facts appear as short sticker chips, not subtitles.

## Palette (dark; mint ONLY means "done")
Midnight Ink #15122E (bg) · Deep #0E0B22 · Dusk Plum #2A1F4D · Glow Violet #8B6CFF · Hot Coral #FF6B8B (accent, sparks) · Mint Check #3DDC97 (only for completed/unlocked) · Paper White #F5F3FF (text) · violetLight #B3A0FF · dim #A79FD0.
Fonts: Sora 800/700 for titles and numbers, Inter 600/700 for small text (woff2 in fonts/).

## The signature device
A row of "steps" (glass cards with a lock/blur) that UNLOCK one by one with a ring segment filling and a mint check. Each fact or step = one unlock. Mascot: Pip, an original blob character (K.pip). Text-only name tiles for tools (K.tile), never real logos.

## Motion rules
- Every shot has its OWN camera function cam(lt, d, t) => {x, y, z, r, dx, dy}. Never reuse one move across shots (no repeated zoom-in/zoom-out).
- Every reveal gets a different entrance (flip, drop with shockwave, write-on, rise with chevrons, spotlight with confetti...). See src/shots.example.js.
- Something visible must change at least every ~1.5 s. Keep key content between y=300 and y=1500 (Shorts UI covers the bottom ~350 px and top ~200 px). Nothing important at the right edge x>980.
- Cue sounds with cue(t, type): whoosh, pop, sparkle, slide, tock, thud, zip.
- Kit (src/core/kit.js): bg, motes, glass, tile, lane, windowFrame, row, ring, spark, burst, pip, phone, bubble, stamp, chip, magnifier, crown, confetti, chevrons, ripple, spot. Add new components in the same look (rounded glass cards, violet glow, coral sparks). Helpers in lib.js: clamp lerp seg eo eio eob rnd rr circle ell line fillAll.

## How to build a new episode from this folder
1. Run the skill's new_video.sh to make a project, then COPY this folder's index.html, fonts/, src/core/*, src/main.js over it (keep tools/ from the skill if it differs; this folder's tools/ also works). Save src/shots.example.js as reference and write a NEW src/shots.js for the episode (shots + cues), reusing the kit.
2. script.json: see example-script.json (voice am_puck, "captions": false, "lines" with text and gap, "sources").
3. Generate voice + timings with the skill's voice.py and words.py (Whisper fails offline; the fallback spreads words inside exact line times, then snap key words to pauses in narration.wav).
4. node tools/capture.mjs check (must say CHECK OK), sheet/frames QA, cues, mix, render.
