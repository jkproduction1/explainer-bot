# BRAIN.md: how Claude makes the explainer channel's videos (v1, 2026-11-14). Read fully before every run.

Second, separate brand of Jan (first one: @theaitoolfinds, repo jkproduction1/theaitoolfinds-bot — never touch that repo from here).
Account: **@oohgoodquestion** (display name "Ooh, Good Question"; Jan chose it 2026-11-14) on Instagram + TikTok.
Repo Variables IG_USERNAME / TIKTOK_USERNAME = oohgoodquestion (Jan sets them once the accounts are connected in Zernio).

## 1. What we post
- Short educational explanations of the world: science, space, Earth, the human body, "what would happen if…".
- ONE topic per video, 20–30 s, English, simple words (grandma test: anyone understands it).
- NO AI framing: no chat UI, no "type this", no "Comment KEYWORD", no tool names.
- 1 video a day to start (2 later, once we see which topics pull). Backlog: `data/topics.md`.
- Why this channel exists: on the first account the hits were pulled by the TOPIC, not the AI tool (Earth "what if" 676k,
  space, "what's inside", Pisa / tattoo / Hindenburg 87k in a day).

## 2. Structure of every video
1. **Hook = a question in the first second**, on screen as the headline from frame 0 and spoken as the first words.
2. The story in 3–4 beats. Every beat is SHOWN by the picture (see §4), the voice only names it.
3. **The answer at the end** (the payoff the hook promised).
4. Last line, always: **"Follow for one every day."** (end card pill, lime).
- Voice (ElevenLabs) + word-by-word captions + music under the voice, always.
- Nothing ever stands still: slow camera push-in, floating, drifting particles, twinkling stars.
- **A cut every 2–3 s** (Jan, 2026-11-14: attention). A 25 s video = 10–12 shots, cut on the voice (`CUTS` = word indices in
  scenes.js). **Change the camera distance from shot to shot**: wide → close → detail → wide; go close whenever the emotion
  matters, because a face is read before anything else. Inside each shot keep a slow push-in or drift.
- **Show the whole character** (Jan, 2026-11-14). When a person is in the shot, the whole body is in frame (head to feet),
  not a cut-off bust or a floating head. Exceptions only where the fact needs a detail (a mouth, an eye, an x-ray of the
  lungs) or a short emotional close-up; even then prefer a tighter framing of the full figure over a cropped body.
- **The face acts.** The character's expression follows the situation and blends smoothly (`K.EX`: neutral, shock, scared,
  hold, gasp, faint, out, relief; `K.mixEx(a, b, t)`); add new expressions to the kit when a topic needs them.
- Stills of every shot go to Jan BEFORE the full render (he wants still references first for anything new).

## 3. Facts (hard rule)
- Every number and claim is checked against reliable sources (space agencies, universities, Britannica, peer-reviewed or
  well-sourced science journalism) BEFORE the script is written. No invented numbers. If sources disagree, say the range
  ("about 10 to 15 seconds") or leave the number out.
- Sources go into `post.json` → `sources` (publish.py refuses a video without them) and as a comment at the top of scenes.js.
  Jan sees them in the Telegram approval message.

## 4. Look: "lit flat-science" (hf/kit/kit.js) — approved by Jan 2026-11-14
- Flat vector shapes drawn in code, then **lit**: bevel highlight from a key light top-left, core shadow bottom-right,
  teal rim light, soft drop shadows between layers, light bloom, vignette, grain, out-of-focus dust. It should read as an
  After Effects animation, not as flat stickers. Use `K.lit()` for every solid shape.
- Palette (own identity, NOT Kurzgesagt's dark blue + orange): night violet #230a5e / #4c1796, lime #c6ff3a, hot pink #ff4fa3,
  teal #2fe6d2, lavender #b79bff, white #fff8ff. Vivid, saturated (K.post adds saturation).
- No mascot (Jan: it distracts). No characters, birds, logos or looks of other channels. Own designs only.
- **Show, don't label.** Jan: labels like "You black out in ~15 s" cannot be read in time and make chaos. Each fact gets a
  visual device instead (a timer ring running out, bubbles on the tongue, a dashed ghost of the original size, a crossed-out
  explosion). A big number as a graphic is fine ("15 s"). A text label only rarely, as an extra.
- **Headline**: Bricolage Grotesque 800, white, ONE key phrase in lime with a glow. Only during the hook.
- **Captions**: Inter 600, plain white, word by word. NO shadow, NO outline, NO box or dark band behind them (Jan rejected
  all three). They sit at y ≈ 1340–1410 (above the IG/TikTok UI), so every scene keeps that strip dark and free of bright shapes.
- The kit is code, not a fixed asset set: every video may draw any new shape; the kit only guarantees the same light and feel.

## 5. Pipeline (same engine as the first channel, trimmed)
1. Pick the topic (`data/topics.md`), verify facts, write `hf/videos/<name>/script.txt` (one line, last sentence
   "Follow for one every day.").
2. Voice: put `{"name": "<name>", "text": "<script>"}` into `data/voice_queue.json`, push, run workflow **Voice (ElevenLabs)**
   → `voice-samples/<name>.mp3` + `.json` (word timings) on the `videos` branch.
3. `hf/new.sh <name>` (scratch project in hf/work/<name>; `OFFLINE=1` = silent voice with estimated timings for layout tests).
4. Write `scenes.js` (`function SCENE(g, t)`), `build.py` (see hf/house.py docstring), `post.json`
   `{topic, caption, summary_cs, sources, cover_at}`; `python3 hf/videos/<name>/build.py`.
5. Check stills at several times (hook frame, every beat, end card) BEFORE the full render, then `hf/render.sh <name>`
   (about 25 s of render time per second of video on a CPU box).
6. `python3 hf/publish.py <name>` → folder on the `videos` branch; run workflow **Release video to Telegram** with that folder.
7. Jan taps ✅ / 🧪 / ❌ in Telegram; **Post approved videos** schedules it through Zernio.

## 6. Posting and safety
- Nothing is ever posted without Jan's ✅ in Telegram. Claude never posts, never touches API keys or secrets.
- Every Telegram message starts with **🔬 EXPLAINER** so it cannot be mixed up with the first channel.
- Instagram only for now (Jan, 2026-11-14); TikTok joins when the Variable TIKTOK_USERNAME is set. The poster posts ONLY to the pinned usernames and refuses otherwise
  (never "the first account in Zernio").
- Captions: 1–2 simple sentences + the question, max 4 hashtags. TikTok AI disclosure stays on (AI voice).
- Default slot 18:00 Prague (Variable POST_SLOTS, comma separated, to change or add a second one).

## 7. Brand collaborations (later, once the numbers are there)
Same look, the brand's thing becomes the topic: (a) "how it works" about their product, (b) the brand's story as a 25 s
animated explainer, (c) a normal science video "brought to you by X" (3 s end tag). The palette can take one brand colour
as an accent. Paid videos are labelled as such (TikTok commercialContentType = brand_content, IG paid partnership).
Occasional unpaid "how X works" videos about well-known products serve as samples to show brands.

## 8. Director checklist (PASS only if all true)
- Hook question readable and spoken in the first second; answer delivered at the end; ends with "Follow for one every day."
- Every fact has a source in post.json; no number that is not in a source.
- Every beat understandable with the sound off (picture + caption), and nothing bright under the captions.
- No AI framing, no mascot, nothing that looks like another channel. 20–30 s. Music audible but under the voice.

## 9. Learning loop
`data/stats.json` (workflow Stats, read-only) → write what worked into `data/learnings.md` (topic type, hook wording,
retention) and reorder `data/topics.md` accordingly.
