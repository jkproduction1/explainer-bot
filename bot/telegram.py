"""Telegram: send each new video to Jan for approval (✅ post / 🧪 trial / ❌ skip).
Every message starts with config.CHANNEL_LABEL so it is clear this is the second channel."""
import json
import os

import requests

from . import config

STATE = config.DATA / "telegram.json"


def _api(method, **kw):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    r = requests.post(f"https://api.telegram.org/bot{token}/{method}", timeout=120, **kw)
    data = r.json()
    if not data.get("ok"):
        raise RuntimeError(f"Telegram {method}: {data}")
    return data["result"]


def _state():
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def _save(st):
    STATE.write_text(json.dumps(st, indent=2))


def chat_id():
    """Jan's chat id: learned from the /start message he sent to the bot."""
    st = _state()
    if st.get("chat_id"):
        return st["chat_id"]
    for u in _api("getUpdates", data={"timeout": 0}):
        msg = u.get("message") or {}
        if msg.get("chat", {}).get("type") == "private":
            st["chat_id"] = msg["chat"]["id"]
            _save(st)
            return st["chat_id"]
    raise RuntimeError("No chat found - send /start to the bot in Telegram first")


def send_for_approval(folder, meta: dict, caption: str):
    cid = chat_id()
    name = folder.name
    src = "\n".join(f"• {s}" for s in meta.get("sources", [])[:4]) or "-"
    text = (f"{config.CHANNEL_LABEL}\n"
            f"🎬 {meta.get('topic', name)}  ({meta.get('duration', '?')} s)\n"
            f"📝 {meta.get('summary_cs') or '-'}\n"
            f"📚 Zdroje faktů:\n{src}\n\n"
            f"Popisek (jde na IG/TikTok):\n{caption[:500]}\n\n"
            f"✅ = naplánuju, 🧪 = IG trial reel, ❌ = zahodím")
    kb = {"inline_keyboard": [[
        {"text": "✅ Postnout", "callback_data": f"ok:{name}"[:64]},
        {"text": "🧪 Trial", "callback_data": f"tr:{name}"[:64]},
        {"text": "❌ Zahodit", "callback_data": f"no:{name}"[:64]},
    ]]}
    with open(folder / "video.mp4", "rb") as f:
        _api("sendVideo", data={"chat_id": cid, "caption": text[:1020],
                                "supports_streaming": "true", "reply_markup": json.dumps(kb)},
             files={"video": f})
    print(f"[telegram] sent {name} for approval")
    if len(text) > 1020:
        try:
            _api("sendMessage", data={"chat_id": cid, "text": text[:4000], "disable_web_page_preview": "true"})
        except Exception as e:
            print(f"[telegram] full text failed: {e}")


def notify(text: str):
    try:
        _api("sendMessage", data={"chat_id": chat_id(), "text": f"{config.CHANNEL_LABEL}\n{text}"[:4000]})
    except Exception as e:
        print(f"[telegram] notify failed: {e}")
