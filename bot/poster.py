"""Reads Jan's ✅ / 🧪 / ❌ taps in Telegram and schedules approved videos on Instagram + TikTok through Zernio.
Video files come from the `videos` branch (put there by hf/publish.py).

SAFETY: posts ONLY to the accounts named in IG_USERNAME / TIKTOK_USERNAME (see bot/config.py). If they are not set
or not found in Zernio, nothing is posted. No comment-to-DM automation on this channel."""
import base64
import json
import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

from . import config, telegram

ZERNIO = "https://zernio.com/api/v1"
PENDING = config.DATA / "pending.json"
POSTED = config.DATA / "posted.json"
TZ = ZoneInfo(os.getenv("POST_TIMEZONE", "Europe/Prague"))
SLOTS = [s.strip() for s in os.getenv("POST_SLOTS", "18:00").split(",")]  # 1 video a day to start


def _load(p, default):
    return json.loads(p.read_text()) if p.exists() else default


def _save(p, data):
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False))


def _z(method, path, **kw):
    r = requests.request(method, ZERNIO + path, timeout=120, headers={
        "Authorization": f"Bearer {os.environ['ZERNIO_API_KEY']}",
        "Content-Type": "application/json"}, **kw)
    if r.status_code >= 400:
        raise RuntimeError(f"Zernio {path} HTTP {r.status_code}: {r.text[:300]}")
    return r.json() if r.text else {}


def _names(a: dict) -> set:
    out = set()
    for k in ("username", "handle", "name", "displayName", "platformUsername", "accountName"):
        v = a.get(k)
        if isinstance(v, str) and v.strip():
            out.add(v.strip().lstrip("@").lower())
    return out


def account_ids() -> dict:
    """{"instagram": id, "tiktok": id}, but ONLY for the usernames pinned in config. Never 'the first account'."""
    want = {"instagram": config.IG_USERNAME, "tiktok": config.TIKTOK_USERNAME}
    if not all(want.values()):
        raise RuntimeError("IG_USERNAME / TIKTOK_USERNAME are not set (repo Variables). Refusing to post.")
    data = _z("GET", "/accounts")
    accounts = data.get("accounts") or data.get("data") or (data if isinstance(data, list) else [])
    out = {}
    for a in accounts:
        p = a.get("platform")
        if p in want and want[p] in _names(a):
            out[p] = a.get("_id") or a.get("id")
    missing = [f"{p} @{u}" for p, u in want.items() if p not in out]
    if missing:
        raise RuntimeError("Not connected in Zernio: " + ", ".join(missing) + ". Refusing to post.")
    return out


def upload(path: Path, ctype: str) -> str:
    pre = _z("POST", "/media/presign", json={"filename": path.name, "contentType": ctype,
                                            "size": path.stat().st_size})
    with open(path, "rb") as f:
        r = requests.put(pre["uploadUrl"], data=f, headers={"Content-Type": ctype}, timeout=300)
    r.raise_for_status()
    return pre["publicUrl"]


def next_slot(taken: set) -> datetime:
    if os.getenv("POST_NOW") == "true":
        return datetime.now(TZ) + timedelta(minutes=3)
    now = datetime.now(TZ) + timedelta(minutes=20)
    for day in range(0, 14):
        d = (now + timedelta(days=day)).date()
        for s in SLOTS:
            h, m = (int(x) for x in s.split(":"))
            t = datetime(d.year, d.month, d.day, h, m, tzinfo=TZ)
            if t > now and t.isoformat() not in taken:
                return t
    return now


def schedule(folder: Path, when: datetime, trial: bool = False) -> dict:
    ids = account_ids()  # first: refuse before uploading anything if the accounts are not pinned/found
    caption = (folder / "caption.txt").read_text(encoding="utf-8")[:2200]
    video_url = upload(folder / "video.mp4", "video/mp4")
    cover = upload(folder / "cover.jpg", "image/jpeg") if (folder / "cover.jpg").exists() else None
    psd = {"shareToFeed": True}
    if cover:
        psd["instagramThumbnail"] = cover
    if trial:
        psd["trialParams"] = {"graduationStrategy": "SS_PERFORMANCE"}
    body = {"content": caption, "mediaItems": [{"type": "video", "url": video_url}],
            "scheduledFor": when.isoformat(),
            "platforms": [{"platform": "instagram", "accountId": ids["instagram"], "platformSpecificData": psd},
                          {"platform": "tiktok", "accountId": ids["tiktok"]}],
            "tiktokSettings": {
                "privacy_level": "PUBLIC_TO_EVERYONE", "allow_comment": True, "allow_duet": True, "allow_stitch": True,
                "video_made_with_ai": True,          # honest AI disclosure (AI voice)
                "commercialContentType": "none",     # paid deals -> "brand_content"
                "content_preview_confirmed": True, "express_consent_given": True,
                **({"video_cover_image_url": cover} if cover else {})}}
    return _z("POST", "/posts", json=body)


def fetch_video(name: str) -> Path:
    dest = Path("dl") / name
    dest.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "fetch", "-q", "origin", "+videos:refs/remotes/origin/videos"], check=True)
    for f in ("video.mp4", "cover.jpg", "caption.txt", "meta.json"):
        r = subprocess.run(["git", "show", f"origin/videos:{name}/{f}"], capture_output=True)
        if r.returncode == 0:
            (dest / f).write_bytes(r.stdout)
    if not (dest / "video.mp4").exists():
        raise RuntimeError(f"video {name} is not on the videos branch")
    return dest


def main():
    st = telegram._state()
    pending = _load(PENDING, {})
    posted = _load(POSTED, [])
    taken = {p["when"] for p in posted if p.get("when")}
    qdir = config.DATA / "tg_queue"
    queue = sorted(qdir.glob("*.b64")) if qdir.exists() else []
    if queue:  # pushed by the Cloudflare worker (webhook mode)
        updates = {}
        for f in queue:
            u = json.loads(base64.b64decode(f.read_text()).decode())
            updates[u.get("update_id")] = u
            f.unlink()
        updates = [updates[k] for k in sorted(updates, key=lambda x: x or 0)]
    else:
        try:
            updates = telegram._api("getUpdates", data={"offset": st.get("offset", 0), "timeout": 0,
                                                        "allowed_updates": json.dumps(["callback_query", "message"])})
        except RuntimeError as e:  # 409 = a webhook is set, updates come from the worker
            print(f"[poster] no polling: {str(e)[:80]}")
            updates = []
    for u in updates:
        st["offset"] = u["update_id"] + 1
        m = u.get("message") or {}
        if m.get("chat", {}).get("type") == "private" and not st.get("chat_id"):
            st["chat_id"] = m["chat"]["id"]
            telegram._save(st)
            telegram.notify("🤖 Bot je připojenej! Sem ti budou chodit videa druhého kanálu ke schválení.")
        cq = u.get("callback_query")
        if not cq:
            continue
        action, _, name = (cq.get("data") or "").partition(":")
        try:
            telegram._api("answerCallbackQuery", data={"callback_query_id": cq["id"]})
        except Exception:
            pass
        msg = cq.get("message") or {}

        def clear_buttons():
            try:
                telegram._api("editMessageReplyMarkup", data={
                    "chat_id": msg["chat"]["id"], "message_id": msg["message_id"],
                    "reply_markup": json.dumps({"inline_keyboard": []})})
            except Exception:
                pass

        info = pending.pop(name, None)
        if action == "no":
            clear_buttons()
            telegram.notify(f"❌ Zahozeno: {name}")
            continue
        if action not in ("ok", "tr"):
            continue
        if info is None:
            telegram.notify(f"⚠️ {name}: nenašel jsem video (možná už je postnuté).")
            continue
        try:
            folder = fetch_video(name)
            when = next_slot(taken)
            res = schedule(folder, when, trial=action == "tr")
            taken.add(when.isoformat())
            posted.append({"name": name, "when": when.isoformat(), "post_id": (res.get("post") or {}).get("_id")})
            clear_buttons()
            kind = "🧪 Trial reel" if action == "tr" else "✅ Naplánováno"
            telegram.notify(f"{kind} (Instagram @{config.IG_USERNAME} + TikTok @{config.TIKTOK_USERNAME}): "
                            f"{when:%d.%m. %H:%M}\n{name}")
        except Exception as e:
            pending[name] = info  # keep it, so a later tap can retry
            telegram.notify(f"⚠️ Postování selhalo ({name}): {str(e)[:300]}\nTlačítka nechávám, zkus ✅ znovu později.")
            print(f"[poster] {name} failed: {e}")
    telegram._save(st)
    _save(PENDING, pending)
    _save(POSTED, posted)


if __name__ == "__main__":
    main()
