"""Put a rendered video on the `videos` branch so the release workflow can send it to Telegram. Posts nothing.

python3 hf/publish.py <name>
  reads  hf/videos/<name>/post.json  {topic, caption, summary_cs, sources: [...], cover_at}
  needs  hf/work/<name>/renders/final.mp4
  writes videos:<YYYY-MM-DD_HHMM>_<name>/{video.mp4, cover.jpg, caption.txt, meta.json}
Then dispatch release.yml with folder=<that folder> (printed at the end).
"""
import json, shutil, subprocess, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

name = sys.argv[1]
H = Path(__file__).resolve().parent
repo = H.parent
post = json.loads((H / "videos" / name / "post.json").read_text())
assert post.get("sources"), "post.json needs the fact sources (BRAIN.md: no video without verified facts)"
mp4 = H / "work" / name / "renders" / "final.mp4"
folder = datetime.now(ZoneInfo("Europe/Prague")).strftime("%Y-%m-%d_%H%M") + "_" + name
wt = Path("/tmp/explainer-videos-branch")


def run(*a, cwd=repo):
    subprocess.run(list(a), cwd=cwd, check=True)


if wt.exists():
    subprocess.run(["git", "worktree", "remove", "--force", str(wt)], cwd=repo)
if subprocess.run(["git", "fetch", "-q", "origin", "+videos:refs/remotes/origin/videos"], cwd=repo).returncode == 0:
    run("git", "worktree", "add", "-q", "--detach", str(wt), "origin/videos")
else:  # first video ever: start the branch
    run("git", "worktree", "add", "-q", "--detach", str(wt))
    run("git", "checkout", "-q", "--orphan", "videos-new", cwd=wt)
    run("git", "rm", "-rfq", ".", cwd=wt)
d = wt / folder
d.mkdir()
shutil.copy(mp4, d / "video.mp4")
run("ffmpeg", "-v", "error", "-y", "-ss", str(post.get("cover_at", 1.0)), "-i", str(d / "video.mp4"),
    "-frames:v", "1", "-q:v", "3", str(d / "cover.jpg"))
(d / "caption.txt").write_text(post["caption"].strip() + "\n", encoding="utf-8")
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                            str(d / "video.mp4")], capture_output=True, text=True).stdout.strip())
meta = {"name": name, "topic": post["topic"], "summary_cs": post["summary_cs"], "sources": post["sources"],
        "duration": round(dur, 1), "created": folder[:15]}
(d / "meta.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False))
# keep only the 12 newest videos so the branch stays small
old = sorted(p for p in wt.iterdir() if p.is_dir() and p.name[:2] == "20")[:-12]
for p in old:
    shutil.rmtree(p)
run("git", "add", "-A", cwd=wt)
run("git", "-c", "user.name=explainer-bot", "-c", "user.email=bot@users.noreply.github.com",
    "commit", "-qm", f"video: {folder}", cwd=wt)
run("git", "push", "-q", "origin", "HEAD:videos", cwd=wt)
print("PUBLISHED", folder)
