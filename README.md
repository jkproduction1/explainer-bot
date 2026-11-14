# explainer-bot (@oohgoodquestion)

Druhý, oddělený kanál: krátká vzdělávací vysvětlení světa (věda, vesmír, Země, tělo, „co by se stalo, kdyby…“)
v jednom stylu. Samostatné repo, s @theaitoolfinds nesdílí nic kromě stejného typu motoru.

Pravidla a postup: **BRAIN.md**. Stavebnice vzhledu: `hf/kit/kit.js` (jen kód, žádné obrázky).

## Co je potřeba nastavit (Settings → Secrets and variables → Actions)
**Secrets**
| Název | K čemu |
|---|---|
| `ELEVENLABS_API_KEY` | hlas |
| `TELEGRAM_BOT_TOKEN` | bot pro schvalování (NOVÝ bot z BotFather, ne ten z prvního kanálu) |
| `ZERNIO_API_KEY` | postování na IG + TikTok |

**Variables**
| Název | Hodnota |
|---|---|
| `IG_USERNAME` | `oohgoodquestion` |
| `TIKTOK_USERNAME` | `oohgoodquestion` |
| `POST_SLOTS` | volitelné, např. `18:00` nebo `09:00,18:00` (čas Praha) |

Dokud nejsou vyplněné oba účty, nic se nepostuje (pojistka: bot postuje jen na tyhle dva účty).

## Workflowy
- **Voice (ElevenLabs)**: namluví skripty z `data/voice_queue.json`.
- **Release video to Telegram**: pošle hotové video ke schválení. Nic nepostuje.
- **Post approved videos**: po ✅ v Telegramu naplánuje post přes Zernio.
- **Stats (read-only)**: jednou denně stáhne čísla do `data/stats.json`.

Fonty: Bricolage Grotesque, Inter (SIL Open Font License).
