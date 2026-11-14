"""Central settings for the explainer channel (second brand, separate from @theaitoolfinds)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# Shown in every Telegram message so it can never be mixed up with the other channel.
CHANNEL_LABEL = "🔬 EXPLAINER"

# SAFETY: the accounts this repo is allowed to post to. Posting is refused until BOTH are set and found in Zernio,
# so a video can never land on another account that happens to be connected to the same Zernio workspace.
# Set them in GitHub: Settings > Secrets and variables > Actions > Variables (IG_USERNAME, TIKTOK_USERNAME), without "@".
IG_USERNAME = os.getenv("IG_USERNAME", "").strip().lstrip("@").lower()
TIKTOK_USERNAME = os.getenv("TIKTOK_USERNAME", "").strip().lstrip("@").lower()

# ElevenLabs voice (same house voice as the first channel for now; change here for a different narrator)
EL_VOICE = "y0s2ExEMuum3muUnA6Zd"
EL_MODEL = "eleven_v4"
EL_STABILITY = 0.6
EL_SIMILARITY = 0.3
EL_SPEED = 1.0

# Free fallback voice (Microsoft Edge TTS) if ElevenLabs fails
VOICE = os.getenv("TTS_VOICE", "en-US-AndrewNeural")
VOICE_RATE = os.getenv("TTS_RATE", "+4%")
