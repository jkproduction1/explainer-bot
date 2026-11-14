"""test00 - smoke test of the engine and the kit (never published)."""
import sys
from pathlib import Path
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent.parent))
from house import Film

W = HERE.parent.parent / "work" / "test00"
F = Film(W, (HERE / "script.txt").read_text(), W / "assets" / "voice.json", tail=1.2)
F.headline("What happens to your body", "in space ", "without a suit", "?", until=F.S[10] - 0.3)
F.captions(last=9)
F.endcard(at=F.S[10] - 0.1)
F.sfx.append((F.S[10] - 0.1, "pop"))
F.write((HERE / "scenes.js").read_text())
