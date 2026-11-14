"""House style of the explainer channel for HyperFrames: one full-frame canvas drawn by the video's scenes.js with the
kit (hf/kit/kit.js), plus DOM text on top: the hook headline, word-by-word captions and the end card.

Each video: hf/videos/<name>/{build.py, scenes.js, script.txt, post.json}. build.py:
    F = Film(W, script, A / "voice.json")
    F.headline("What happens to your body", "in space ", "without a suit", "?", until=F.S[9])
    F.captions()
    F.endcard(at=F.S[k])            # k = index of the word "Follow"
    F.write((HERE / "scenes.js").read_text())
scenes.js must define  function SCENE(g, t) { ... }  (pure function of time t in seconds; S = word start times, DUR = length).

Text rules (Jan, 2026-11-14): headline = Bricolage Grotesque 800, white, ONE key phrase in lime with a glow, only in the hook.
Captions = Inter 600, plain white, NO shadow / outline / box, word by word, at y ~1340-1410 (above the app UI).
Facts are shown by the picture, not by labels; a label only as a rare extra.
"""
import html, json, re, wave
from pathlib import Path

import numpy as np

HANDLE = ""   # e.g. "@why.explained" once Jan has created the accounts; empty = no handle on the end card


class Film:
    def __init__(self, workdir, script_text, voice_json, tail=1.6):
        self.dir = Path(workdir)
        self.tok = script_text.split()
        self.vw = json.loads(Path(voice_json).read_text())
        assert len(self.vw) == len(self.tok), f"voice has {len(self.vw)} words, script {len(self.tok)}"
        self.S = [round(w["start"], 3) for w in self.vw]
        self.E = [round(w["end"], 3) for w in self.vw]
        self.dur = round(self.E[-1] + tail, 2)
        self.sfx = []            # (time, kind): click / pop / whoosh / tick, all very quiet
        self.head = ""
        self.head_until = 0.0
        self.cap = []            # [{t0, t1, words: [(index, text)]}]
        self.end_at = None

    def headline(self, line1, pre, hot, post="", until=2.4):
        self.head = (f'<div id="hl"><div>{html.escape(line1)}</div><div>{html.escape(pre)}<b>{html.escape(hot)}</b>'
                     f'{html.escape(post)}</div></div>')
        self.head_until = until

    def captions(self, first=0, last=None, max_chars=24, max_words=5):
        """Group the spoken words into short lines; a line also ends at , . ? ! and stays until the next one starts."""
        last = len(self.tok) - 1 if last is None else last
        lines, cur, n = [], [], 0
        for i in range(first, last + 1):
            w = self.tok[i]
            if cur and (n + len(w) + 1 > max_chars or len(cur) >= max_words):
                lines.append(cur); cur, n = [], 0
            cur.append(i); n += len(w) + 1
            if re.search(r"[,.?!…:;]$", w):
                lines.append(cur); cur, n = [], 0
        if cur:
            lines.append(cur)
        for k, ln in enumerate(lines):
            t1 = self.S[lines[k + 1][0]] - 0.04 if k + 1 < len(lines) else self.E[ln[-1]] + 0.5
            self.cap.append({"t0": round(self.S[ln[0]] - 0.06, 3), "t1": round(t1, 3),
                             "words": [(i, self.tok[i].rstrip(",.…:;")) for i in ln]})

    def endcard(self, at, line="Follow for one every day"):
        self.end_at, self.end_line = round(at, 3), line

    def write(self, scenes_js, music="assets/music.mp3", music_vol=0.11):
        cap = "".join('<div class="cl" id="cl%d">%s</div>' % (k, " ".join(
            f'<span class="cw" id="cw{i}">{html.escape(t)}</span>' for i, t in c["words"])) for k, c in enumerate(self.cap))
        end = ""
        if self.end_at is not None:
            end = (f'<div id="end"><div id="e1">{html.escape(self.end_line)}</div>'
                   + (f'<div id="e2">{html.escape(HANDLE)}</div>' if HANDLE else "") + '</div>')
        fonts = ('<div style="position:absolute;opacity:0;pointer-events:none"><span style="font-family:Bri;font-weight:800">a</span>'
                 '<span style="font-family:Inter;font-weight:500">a</span><span style="font-family:Inter;font-weight:600">a</span>'
                 '<span style="font-family:Inter;font-weight:700">a</span></div>')
        body = (f'<div id="s0" class="clip layer" data-start="0" data-duration="{self.dur}" data-track-index="1">'
                f'<canvas id="cv" width="1080" height="1920"></canvas>{fonts}{self.head}<div id="cap">{cap}</div>{end}</div>'
                f'<audio id="vo" class="clip" src="assets/voice.mp3" data-start="0" data-duration="{round(self.E[-1] + 0.05, 2)}" data-track-index="20" data-volume="1"></audio>'
                f'<audio id="mus" class="clip" src="{music}" data-start="0" data-duration="{self.dur}" data-track-index="21" data-volume="{music_vol}"></audio>'
                f'<audio id="fx" class="clip" src="assets/sfx.wav" data-start="0" data-duration="{self.dur}" data-track-index="22" data-volume="1"></audio>')
        js = (JS.replace("__S__", json.dumps(self.S)).replace("__E__", json.dumps(self.E)).replace("__DUR__", str(self.dur))
              .replace("__CAP__", json.dumps([{"t0": c["t0"], "t1": c["t1"], "w": [i for i, _ in c["words"]]} for c in self.cap]))
              .replace("__HU__", str(self.head_until)).replace("__END__", "null" if self.end_at is None else str(self.end_at))
              .replace("__SCENES__", scenes_js))
        doc = (f'<!doctype html><html lang="en" data-resolution="portrait"><head><meta charset="UTF-8">'
               f'<meta name="viewport" content="width=1080, height=1920"><script src="assets/gsap.min.js"></script>'
               f'<script src="assets/kit.js"></script><style>{CSS}</style></head><body>\n'
               f'<div id="root" data-composition-id="main" data-start="0" data-duration="{self.dur}" data-width="1080" '
               f'data-height="1920" data-motion-blur="off">\n{body}\n</div><script>{js}</script></body></html>')
        (self.dir / "index.html").write_text(doc)
        write_sfx(self.sfx, self.dur, self.dir / "assets" / "sfx.wav")
        print("ok", self.dir.name, "dur", self.dur, "caption lines", len(self.cap), "sfx", len(self.sfx))


CSS = r"""
@font-face{font-family:Bri;font-weight:800;src:url(assets/bricolage-grotesque-latin-800-normal.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:500;src:url(assets/inter-latin-500-normal.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:600;src:url(assets/inter-latin-600-normal.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:700;src:url(assets/inter-latin-700-normal.woff2) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#07031a}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#07031a;color:#fff8ff}
.layer{position:absolute;inset:0}
#cv{position:absolute;inset:0;width:1080px;height:1920px}
#hl{position:absolute;left:40px;right:40px;top:170px;text-align:center;font-family:Bri;font-weight:800;font-size:70px;line-height:88px;letter-spacing:-.01em;color:#fff8ff}
#hl b{color:#c6ff3a;text-shadow:0 0 30px rgba(198,255,58,.8)}
#cap{position:absolute;left:60px;right:60px;top:1336px;height:80px}
.cl{position:absolute;left:0;right:0;text-align:center;font-family:Inter;font-weight:600;font-size:58px;line-height:80px;color:#fff;opacity:0;white-space:nowrap}
.cw{display:inline-block;opacity:0}
#end{position:absolute;left:0;right:0;top:1500px;text-align:center;opacity:0}
#e1{display:inline-block;font-family:Bri;font-weight:800;font-size:54px;color:#14072e;background:#c6ff3a;padding:14px 40px 18px;border-radius:999px;box-shadow:0 0 50px rgba(198,255,58,.55)}
#e2{font-family:Inter;font-weight:500;font-size:34px;color:rgba(255,248,255,.75);margin-top:22px}
"""

JS = r"""
const S=__S__, E=__E__, DUR=__DUR__, CAP=__CAP__, HU=__HU__, END=__END__;
const tl=gsap.timeline({paused:true}); const NI={immediateRender:false};
function F2(sel,f,to,at){ return tl.fromTo(sel,f,Object.assign({},to,NI),at); }
const cv=document.getElementById('cv'), g=cv.getContext('2d');
__SCENES__
function draw(t){ g.setTransform(1,0,0,1,0,0); g.globalAlpha=1; g.clearRect(0,0,1080,1920); SCENE(g,t); }
const clock={t:0}; tl.fromTo(clock,{t:0},{t:DUR,duration:DUR,ease:'none',onUpdate:()=>draw(clock.t)},0);
// hook headline: on screen from frame 0, leaves when the story starts
if(document.getElementById('hl')){ F2('#hl',{scale:1.06,opacity:1},{scale:1,opacity:1,duration:.5,ease:'expo.out'},0);
  F2('#hl',{opacity:1,y:0},{opacity:0,y:-30,duration:.3,ease:'power2.in'},HU); }
// captions: one line at a time, words appear as they are spoken (plain white, no effects)
tl.set('.cl',{opacity:0},0); tl.set('.cw',{opacity:0},0);
CAP.forEach((c,k)=>{ tl.set('#cl'+k,{opacity:1},c.t0); tl.set('#cl'+k,{opacity:0},c.t1);
  c.w.forEach(i=>F2('#cw'+i,{opacity:0,y:10},{opacity:1,y:0,duration:.16,ease:'power2.out'},Math.max(0,S[i]-0.04))); });
if(END!==null){ tl.set('#end',{opacity:0},0); F2('#end',{opacity:0,y:30,scale:.9},{opacity:1,y:0,scale:1,duration:.45,ease:'back.out(1.6)'},END); }
window.__timelines=window.__timelines||{}; window.__timelines['main']=tl; tl.seek(0); draw(0);
document.fonts.ready.then(()=>draw(clock.t));
"""


# ---------------------------------------------------------------- SFX: soft, felt more than heard
def write_sfx(events, dur, path, sr=44100):
    buf = np.zeros(int((dur + 1) * sr))
    rng = np.random.default_rng(3)

    def env(n, a, d):
        t = np.arange(n) / sr
        return np.minimum(1, t / a) * np.exp(-t / d)

    def click():
        n = int(.035 * sr); t = np.arange(n) / sr
        return np.sin(2 * np.pi * 1800 * t) * env(n, .0005, .004) * .6 + np.sin(2 * np.pi * 140 * t) * env(n, .001, .012)

    def pop():
        n = int(.09 * sr); t = np.arange(n) / sr
        f = 520 - 260 * t / t[-1]
        return np.sin(2 * np.pi * np.cumsum(f) / sr) * env(n, .002, .025)

    def whoosh():
        n = int(.42 * sr); t = np.arange(n) / sr
        x = rng.standard_normal(n)
        k = 0.08; y = np.empty(n); acc = 0.0
        for i in range(n):
            acc += k * (x[i] - acc); y[i] = acc
        return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * t / t[-1]) ** 2

    def tick():
        n = int(.02 * sr); t = np.arange(n) / sr
        return np.sin(2 * np.pi * 2600 * t) * env(n, .0003, .003)

    kinds = {"click": (click(), .16), "pop": (pop(), .12), "whoosh": (whoosh(), .07), "tick": (tick(), .10)}
    for t, k in events:
        x, g = kinds[k]
        i = int(max(0, t) * sr)
        buf[i:i + len(x)] += x[:len(buf) - i] * g
    pcm = (np.clip(buf, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
