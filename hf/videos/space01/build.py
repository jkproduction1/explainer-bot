"""space01 - What happens to your body in space without a suit? (channel video #1). Facts + sources: scenes.js / post.json."""
import sys
from pathlib import Path
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent.parent))
from house import Film

W = HERE.parent.parent / "work" / "space01"
F = Film(W, (HERE / "script.txt").read_text(), W / "assets" / "voice.json", tail=1.4)
F.headline("What happens to your body", "in space ", "without a suit", "?", until=F.S[10] - 0.3)
F.captions(first=10, last=54)
F.endcard(at=F.S[55] - 0.1)
F.sfx.append((F.S[55] - 0.1, "pop"))
for i in (7, 10, 14, 20, 24, 32, 36, 39, 42, 47, 52):   # a soft whoosh on every cut
    F.sfx.append((F.S[i] - 0.14, "whoosh"))
F.write((HERE / "scenes.js").read_text())
print("CUTS", [round(F.S[i] - 0.1, 2) if i else 0 for i in (0, 7, 10, 14, 20, 24, 32, 36, 39, 42, 47, 52)])
