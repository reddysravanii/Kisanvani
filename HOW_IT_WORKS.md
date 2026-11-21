# How KisanVani works

## Flow of one question
1. Farmer taps the mic. The browser's **Web Speech API** (SpeechRecognition) converts speech to text
   using the chosen language code (te-IN, hi-IN, en-IN).
2. `app.js` sends the text, language, crop, district, current weather summary and the last few turns
   to `POST /api/ask`.
3. The **FastAPI** backend builds a *system prompt* (role, language, short answers, safety rules,
   crop/location/weather context) and calls the **Gemini API** over HTTPS.
4. The answer is saved in **SQLite** (`history` table) and returned as JSON.
5. The browser shows the answer and reads it aloud with **SpeechSynthesis**.

## Components
| Part | Technology | Why |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | No build step, easy to explain |
| Backend | Python FastAPI | Fast, automatic validation with Pydantic |
| AI | Gemini API | Strong Telugu/Hindi support, free tier |
| Speech in/out | Browser Web Speech API | No extra cost or server load |
| Weather | Open-Meteo | Free, no API key |
| Database | SQLite | Single file, zero setup |

## Why the API key is on the backend
The browser never sees the key. The frontend calls our `/api/ask`, and only the server calls Gemini.
The key lives in `.env`, which is excluded from Git by `.gitignore`.

## Safety design
- System prompt tells the model to keep answers short, avoid inventing scheme amounts, and send the
  farmer to the RBK/agriculture officer to confirm doses.
- Frontend renders text with `textContent` (no HTML injection).
- Inputs are validated (length limits, allowed languages, lat/lon ranges).
- Model fallback: if the main model name is not found, the next model in `GEMINI_FALLBACK_MODELS` is tried.

## Limitations (say these before they ask)
- Voice recognition needs internet and works best in Chrome/Edge.
- Telugu speech output depends on a voice installed on the device.
- AI can be wrong; this is advisory, not a replacement for an agriculture officer.

## Future work
Crop-disease photo diagnosis, market prices (Agmarknet), SMS/WhatsApp access, offline mode, user login.

---
# Version 3 additions

## Smart voice pipeline
1. The browser records the mic with `MediaRecorder`. A small voice-activity detector stops recording after about 2 seconds of silence.
2. The recording is decoded and converted to a 16 kHz mono WAV in the browser (`blobToWav16k`).
3. `POST /api/voice` sends the WAV to Gemini, which hears Telugu, Hindi, English or a mix, returns a transcript, the detected language and the answer in JSON.
4. In **Auto** language mode the reply follows the language you spoke, and the screen text and read-aloud voice switch to it.

## New pages
| Page | Backend | Notes |
|---|---|---|
| Crop calendar | `GET /api/calendar` | Sowing, growing and harvest months, current month highlighted |
| Farm ledger | `POST/GET/DELETE /api/ledger` | Income and expenses in SQLite, profit by crop, spending breakdown |
| Schemes and help | none (static) | Official links, helpline number, "Ask KisanVani" buttons |

## Reliability and safety
- Rate limiter: at most 20 AI requests per minute per user, to protect the free quota.
- Input validation on every endpoint (lengths, dates, amounts, audio and image types).
- Model fallback if the chosen Gemini model name fails.
- Every answer carries a reminder to confirm doses and scheme details with the RBK or agriculture officer.

## Future work
Mandi price API integration, SMS and WhatsApp access, user login, offline mode, deployment on a cloud server with HTTPS.
