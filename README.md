# KisanVani - Multilingual Voice Assistant for Farmers

A web portal where a farmer speaks or types a question in Telugu, Hindi or English,
and gets a short answer in the same language, read aloud. It also shows live weather and
keeps a history of past questions.

## Setup (Windows, VS Code)

1. Unzip this folder, open it in VS Code (File > Open Folder > `kisanvani`).
2. Open the terminal in VS Code (Ctrl + `) and run, one line at a time:

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

3. Open the new `.env` file and paste your Gemini key after `GEMINI_API_KEY=`.
   Check the model name on the AI Studio page and put it after `GEMINI_MODEL=` if different.
4. Start the server:

```
uvicorn backend.main:app --reload
```

5. Open **http://127.0.0.1:8000** in Google Chrome. Allow the microphone when asked.

Check http://127.0.0.1:8000/api/health to confirm the key is detected (`api_key_set: true`).

## Folder structure

```
kisanvani/
  backend/main.py     FastAPI server: /api/ask, /api/weather, /api/history
  frontend/           index.html, style.css, app.js (no build step)
  docs/               HOW_IT_WORKS.md, VIVA_QUESTIONS.md
  .env                your secret key (never share or upload)
  kisanvani.db        SQLite history (created automatically)
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` not recognised | Reinstall Python and tick "Add Python to PATH" |
| Cannot run `activate` (PowerShell policy) | Run `Set-ExecutionPolicy -Scope Process Bypass`, then activate again |
| "GEMINI_API_KEY is missing" | `.env` must be in the project root; restart the server after editing |
| "No working model found" | Fix `GEMINI_MODEL` in `.env` to the exact name shown in AI Studio |
| "Free quota reached" | Wait a minute, free tier has per-minute limits |
| Mic does nothing | Use Chrome, allow the mic (lock icon in address bar), keep internet on |
| No Telugu voice reading aloud | Windows needs a Telugu voice pack: Settings > Time & language > Speech. Text still works |

## Make it yours
Change the name and colours in `style.css`, add crops in `index.html`, add districts in `app.js`,
and edit the rules in `build_system_prompt()` in `backend/main.py`.

## Version 3 features
Smart voice (AI listens in Telugu, Hindi, English or mixed), Auto language mode, keyword tags, crop calendar,
farm ledger, schemes and helpline page. After editing `.env`, stop the server (Ctrl+C) and start it again.
See `docs/VOICE_TEST.md` for a voice test sheet.
