"""Send a finished video (already on the `videos` branch) to Telegram: python -m bot.release <folder> [<vb dir>]"""
import json
import sys
from pathlib import Path

from . import config, telegram

name = sys.argv[1]
vb = Path(sys.argv[2] if len(sys.argv) > 2 else "../vb")
folder = vb / name
meta = json.loads((folder / "meta.json").read_text())
caption = (folder / "caption.txt").read_text(encoding="utf-8")
telegram.send_for_approval(folder, meta, caption)
pend_path = config.DATA / "pending.json"
pend = json.loads(pend_path.read_text()) if pend_path.exists() else {}
pend[name] = {"topic": meta.get("topic")}
pend_path.write_text(json.dumps(pend, indent=2, ensure_ascii=False))
print("released", name)
