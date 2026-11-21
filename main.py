"""KisanVani v2 - multilingual AI farming assistant.

Backend: FastAPI + SQLite. Gemini API for answers and photo diagnosis, Open-Meteo for weather.
Run from the project folder:  uvicorn backend.main:app --reload
"""
import csv
import io
import json
import os
import sqlite3
import time
from collections import defaultdict, deque
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL = os.getenv("GEMINI_MODEL", "gemini-4-hydrogen").strip()
FALLBACKS = [m.strip() for m in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-2.5-flash").split(",") if m.strip()]
DB_PATH = ROOT / "kisanvani.db"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
LANGUAGES = {"te": "Telugu", "hi": "Hindi", "en": "English"}
IST = timezone(timedelta(hours=5, minutes=30))
VALID_LANGS = set(LANGUAGES) | {"auto"}

# Farming words in Telugu / Hindi / English. Sent with every prompt so the AI understands local terms.
GLOSSARY = (
    "Common farming words (Telugu / Hindi / English): "
    "వరి/धान/paddy; మిరప,మిర్చి/मिर्च/chilli; పత్తి/कपास/cotton; వేరుశనగ,వేరుశెనగ/मूंगफली/groundnut; "
    "మొక్కజొన్న/मक्का/maize; చెరకు/गन्ना/sugarcane; పొగాకు/तंबाकू/tobacco; అరటి/केला/banana; "
    "ఎరువు/खाद/fertilizer; యూరియా/यूरिया/urea; డీఏపీ/डीएपी/DAP; పురుగు/कीट/pest; తామర పురుగు/थ्रिप्स/thrips; "
    "గులాబీ రంగు పురుగు/गुलाबी सुंडी/pink bollworm; తెగులు/रोग/disease; పిచికారీ/छिड़काव/spraying; "
    "నీటి తడి/सिंचाई/irrigation; వర్షం/बारिश/rain; విత్తనం/बीज/seed; పంట బీమా/फसल बीमा/crop insurance; "
    "ఎకరా/एकड़/acre; కలుపు/खरपतवार/weeds; మందు/दवा/pesticide; ధర/भाव/price; మార్కెట్/मंडी/market."
)

app = FastAPI(title="KisanVani")


# ---------- Database ----------
@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


with db() as _c:
    _c.execute(
        """CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            language TEXT NOT NULL,
            crop TEXT,
            district TEXT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )"""
    )


def save_history(language, crop, district, question, answer) -> int:
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO history (created_at, language, crop, district, question, answer) VALUES (?,?,?,?,?,?)",
            (datetime.now(timezone.utc).isoformat(), language, crop, district, question, answer),
        )
        return cur.lastrowid


# ---------- Models ----------
class Turn(BaseModel):
    role: str
    text: str


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    language: str = "en"
    crop: Optional[str] = None
    district: Optional[str] = None
    weather_summary: Optional[str] = None
    history: List[Turn] = []


class DiagnoseRequest(BaseModel):
    image_base64: str = Field(min_length=100, max_length=8_000_000)
    mime_type: str = "image/jpeg"
    language: str = "en"
    crop: Optional[str] = None
    district: Optional[str] = None


# ---------- Gemini ----------
async def gemini_generate(system: str, contents: list, json_mode: bool = False, max_tokens: int = 2048) -> str:
    if not API_KEY or API_KEY == "paste_your_key_here":
        raise HTTPException(500, "GEMINI_API_KEY is missing. Add it to .env, then stop the server (Ctrl+C) and start it again.")

    config = {"temperature": 0.4, "maxOutputTokens": max_tokens}
    if json_mode:
        config["responseMimeType"] = "application/json"
    payload = {"system_instruction": {"parts": [{"text": system}]}, "contents": contents, "generationConfig": config}
    headers = {"x-goog-api-key": API_KEY, "Content-Type": "application/json"}

    last_error = "Unknown error"
    async with httpx.AsyncClient(timeout=90) as client:
        for model in [MODEL] + [m for m in FALLBACKS if m != MODEL]:
            try:
                r = await client.post(GEMINI_URL.format(model=model), json=payload, headers=headers)
            except httpx.HTTPError as e:
                raise HTTPException(503, f"Cannot reach Gemini. Check your internet. ({e.__class__.__name__})")
            if r.status_code == 200:
                data = r.json()
                cands = data.get("candidates") or []
                if not cands:
                    reason = (data.get("promptFeedback") or {}).get("blockReason", "no answer")
                    raise HTTPException(502, f"The AI gave no answer ({reason}). Try rephrasing.")
                parts = cands[0].get("content", {}).get("parts", [])
                text = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
                if not text:
                    raise HTTPException(502, "The AI returned an empty answer. Please try again.")
                return text
            if r.status_code == 429:
                raise HTTPException(429, "Free quota reached for now. Wait a minute and try again.")
            try:
                last_error = r.json().get("error", {}).get("message", r.text)
            except ValueError:
                last_error = r.text
            if r.status_code in (401, 403):
                raise HTTPException(500, "Gemini rejected the API key. Check GEMINI_API_KEY in .env.")
            if r.status_code in (400, 404):
                continue
            raise HTTPException(502, f"Gemini error {r.status_code}: {last_error[:200]}")
    raise HTTPException(502, f"No working model found. Check GEMINI_MODEL in .env. Last error: {last_error[:200]}")


def context_lines(crop, district, weather=None) -> List[str]:
    out = []
    if crop:
        out.append(f"The farmer's main crop: {crop}.")
    if district:
        out.append(f"Location: {district}, Andhra Pradesh.")
    if weather:
        out.append(f"Current weather there: {weather}. Use it when relevant.")
    return out


def ask_prompt(req) -> str:
    if req.language == "auto":
        reply_rule = ("Reply in the same language the farmer used (Telugu, Hindi or English), "
                      "using simple everyday words a village farmer understands. If unsure, use Telugu.")
    else:
        reply_rule = (f"Always reply in {LANGUAGES.get(req.language, 'English')}, "
                      "using simple everyday words a village farmer understands.")
    return "\n".join(
        [
            "You are KisanVani, a friendly farming assistant for small farmers in Andhra Pradesh, India.",
            reply_rule,
            "Keep answers short (under 120 words). Give practical steps, not theory.",
            "Write plain text only. For lists use lines starting with '- '. No headings, no asterisks, no tables.",
            "For pesticide or fertilizer doses, give the usual range per acre and advise confirming with the "
            "local Rythu Bharosa Kendra (RBK) or agriculture officer before use.",
            "For government schemes, mention only what you are sure about and tell the farmer to verify "
            "details at the RBK or the official website. Never invent amounts or dates.",
            "If the question is not about farming, rural life or weather, politely say you help with farming only.",
            GLOSSARY,
        ]
        + context_lines(req.crop, req.district, req.weather_summary)
    )


@app.post("/api/ask")
async def ask(req: AskRequest):
    if req.language not in VALID_LANGS:
        raise HTTPException(400, "Unsupported language")
    contents = [
        {"role": "user" if t.role == "user" else "model", "parts": [{"text": t.text[:1500]}]} for t in req.history[-6:]
    ]
    contents.append({"role": "user", "parts": [{"text": req.question}]})
    answer = await gemini_generate(ask_prompt(req), contents)
    new_id = save_history(req.language, req.crop, req.district, req.question, answer)
    return {"id": new_id, "answer": answer}


# ---------- Crop disease diagnosis (Gemini vision) ----------
def parse_json(text: str) -> dict:
    t = text.strip()
    if t.startswith("```"):
        t = t.strip("`")
        if t.lower().startswith("json"):
            t = t[4:]
    try:
        return json.loads(t)
    except ValueError:
        s, e = t.find("{"), t.rfind("}")
        if s != -1 and e > s:
            try:
                return json.loads(t[s : e + 1])
            except ValueError:
                pass
    raise HTTPException(502, "Could not read the AI result. Please try another photo.")


def as_list(v) -> list:
    if isinstance(v, list):
        return [str(x) for x in v if str(x).strip()]
    return [str(v)] if v else []


@app.post("/api/diagnose")
async def diagnose(req: DiagnoseRequest):
    if req.language not in LANGUAGES:
        raise HTTPException(400, "Unsupported language")
    if req.mime_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Use a JPG, PNG or WEBP photo.")
    b64 = req.image_base64.split(",", 1)[-1]
    lang = LANGUAGES[req.language]
    system = "\n".join(
        [
            "You are a plant health expert helping small farmers in Andhra Pradesh, India.",
            "Look at the crop photo and identify the most likely disease, pest damage or nutrient problem.",
            f"Write all text values in {lang}, in simple words. Keep each item short.",
            "Return ONLY a JSON object with these keys: "
            '"healthy" (true/false), "problem" (short name), "confidence" ("low", "medium" or "high"), '
            '"cause" (one or two sentences), "treatment" (list of 2-5 short steps), '
            '"prevention" (list of 2-4 short tips), "note" (one safety line).',
            "If the photo is not a plant or is too unclear, set healthy=false, problem to say so, confidence=low.",
            "Never give exact chemical doses; say to confirm product and dose with the local RBK or agriculture officer.",
        ]
        + context_lines(req.crop, req.district)
    )
    contents = [
        {
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": req.mime_type, "data": b64}},
                {"text": "Diagnose this crop photo."},
            ],
        }
    ]
    raw = await gemini_generate(system, contents, json_mode=True, max_tokens=2048)
    d = parse_json(raw)
    result = {
        "healthy": bool(d.get("healthy", False)),
        "problem": str(d.get("problem", "Unknown")),
        "confidence": str(d.get("confidence", "low")).lower(),
        "cause": str(d.get("cause", "")),
        "treatment": as_list(d.get("treatment")),
        "prevention": as_list(d.get("prevention")),
        "note": str(d.get("note", "")),
    }
    summary = f"{result['problem']} ({result['confidence']})\n{result['cause']}\n" + "\n".join(
        "- " + x for x in result["treatment"]
    )
    result["id"] = save_history(req.language, req.crop, req.district, f"[Photo] {req.crop or 'Crop'} leaf diagnosis", summary)
    return result


# ---------- Fertilizer calculator (rule based) ----------
# General guideline nutrient needs in kg per hectare: (N, P2O5, K2O). Confirm with a soil test.
FERT_DATA = {
    "Paddy": (120, 60, 40),
    "Maize": (120, 60, 40),
    "Cotton": (120, 60, 60),
    "Chilli": (120, 60, 60),
    "Groundnut": (20, 40, 50),
    "Sugarcane": (250, 100, 120),
}
ACRE_IN_HA = 0.4047


@app.get("/api/fertilizer/crops")
def fert_crops():
    return list(FERT_DATA.keys())


@app.get("/api/fertilizer")
def fertilizer(crop: str, acres: float = Query(1, gt=0, le=1000)):
    if crop not in FERT_DATA:
        raise HTTPException(400, "Crop not supported by the calculator")
    ha = acres * ACRE_IN_HA
    n, p, k = (x * ha for x in FERT_DATA[crop])
    dap = p / 0.46                      # DAP = 18% N, 46% P2O5
    urea = max(n - dap * 0.18, 0) / 0.46  # Urea = 46% N
    mop = k / 0.60                      # MOP = 60% K2O
    r = lambda x: round(x, 1)
    return {
        "crop": crop,
        "acres": acres,
        "nutrients_kg": {"N": r(n), "P2O5": r(p), "K2O": r(k)},
        "products_kg": {"Urea": r(urea), "DAP": r(dap), "MOP": r(mop)},
        "schedule": [
            "Basal (at sowing or transplanting): all DAP, all MOP and one third of the Urea.",
            "Top dressing 1 (about 3 weeks later): one third of the Urea.",
            "Top dressing 2 (about 6 weeks later): the last third of the Urea.",
        ],
        "note": "General guideline only. Fertilizer need changes with soil, variety and season. "
        "Do a soil test and confirm with your local RBK or agriculture officer.",
    }


# ---------- History, stats, export ----------
@app.get("/api/history")
def get_history(limit: int = Query(200, ge=1, le=1000)):
    with db() as conn:
        rows = conn.execute("SELECT * FROM history ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


@app.delete("/api/history/{item_id}")
def delete_item(item_id: int):
    with db() as conn:
        conn.execute("DELETE FROM history WHERE id = ?", (item_id,))
    return {"ok": True}


@app.delete("/api/history")
def clear_history():
    with db() as conn:
        conn.execute("DELETE FROM history")
    return {"ok": True}


@app.get("/api/stats")
def stats():
    with db() as conn:
        rows = conn.execute("SELECT created_at, language, crop, question FROM history").fetchall()
    today = datetime.now(IST).date()
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    per_day = {d: 0 for d in days}
    langs, crops = {}, {}
    photos = 0
    for r in rows:
        try:
            d = datetime.fromisoformat(r["created_at"]).astimezone(IST).date()
        except ValueError:
            continue
        if d in per_day:
            per_day[d] += 1
        langs[r["language"]] = langs.get(r["language"], 0) + 1
        if r["crop"]:
            crops[r["crop"]] = crops.get(r["crop"], 0) + 1
        if r["question"].startswith("[Photo]"):
            photos += 1
    return {
        "total": len(rows),
        "today": per_day[today],
        "photos": photos,
        "languages": langs,
        "crops": [{"name": k, "count": v} for k, v in sorted(crops.items(), key=lambda x: -x[1])[:5]],
        "daily": [{"date": d.strftime("%a"), "count": c} for d, c in per_day.items()],
    }


@app.get("/api/export.csv")
def export_csv():
    with db() as conn:
        rows = conn.execute("SELECT * FROM history ORDER BY id").fetchall()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "time_utc", "language", "crop", "district", "question", "answer"])
    for r in rows:
        w.writerow([r["id"], r["created_at"], r["language"], r["crop"], r["district"], r["question"], r["answer"]])
    # utf-8-sig so Excel shows Telugu and Hindi correctly
    return Response(
        buf.getvalue().encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=kisanvani_history.csv"},
    )


# ---------- Weather (Open-Meteo, no key) ----------
@app.get("/api/weather")
async def weather(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180)):
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
        "timezone": "Asia/Kolkata",
        "forecast_days": 5,
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
            r.raise_for_status()
            return r.json()
    except httpx.HTTPError:
        raise HTTPException(503, "Weather service is not reachable right now.")


# ---------- Rate limiter (protects the free AI quota) ----------
AI_PATHS = {"/api/ask", "/api/diagnose", "/api/voice"}
_hits = defaultdict(deque)


@app.middleware("http")
async def limit_ai_calls(request, call_next):
    if request.method == "POST" and request.url.path in AI_PATHS:
        ip = request.client.host if request.client else "unknown"
        q, now = _hits[ip], time.time()
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= 20:
            return JSONResponse({"detail": "Too many requests. Please wait a minute and try again."}, status_code=429)
        q.append(now)
    return await call_next(request)


# ---------- Smart voice: Gemini listens to the audio, transcribes and answers ----------
class VoiceRequest(BaseModel):
    audio_base64: str = Field(min_length=100, max_length=8_000_000)
    mime_type: str = "audio/wav"
    language: str = "auto"
    crop: Optional[str] = None
    district: Optional[str] = None
    weather_summary: Optional[str] = None
    history: List[Turn] = []


AUDIO_TYPES = {"audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/flac", "audio/aac"}


@app.post("/api/voice")
async def voice(req: VoiceRequest):
    if req.language not in VALID_LANGS:
        raise HTTPException(400, "Unsupported language")
    if req.mime_type not in AUDIO_TYPES:
        raise HTTPException(400, "Unsupported audio format")
    system = ask_prompt(req) + "\n" + "\n".join(
        [
            "The farmer's question is given as AUDIO. They may speak Telugu, Hindi, English or a mix of them, "
            "using local farming words, crop names, pest names and fertilizer names.",
            "First write exactly what they said as 'transcript', in the original script "
            "(Telugu script for Telugu, Devanagari for Hindi, Latin letters for English).",
            "Then give your answer following all the rules above.",
            'Return ONLY a JSON object: {"transcript": "...", "language": "te" or "hi" or "en", "answer": "..."}. '
            "'language' is the language the farmer spoke.",
            "If the audio is silent or unclear, set transcript to an empty string and make the answer a short, "
            "polite request to repeat the question.",
        ]
    )
    contents = [
        {"role": "user" if t.role == "user" else "model", "parts": [{"text": t.text[:1500]}]} for t in req.history[-6:]
    ]
    contents.append(
        {
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": req.mime_type, "data": req.audio_base64.split(",", 1)[-1]}},
                {"text": "Listen to the question and answer it."},
            ],
        }
    )
    d = parse_json(await gemini_generate(system, contents, json_mode=True, max_tokens=2048))
    transcript = str(d.get("transcript", "")).strip()
    answer = str(d.get("answer", "")).strip()
    lang = d.get("language", "en")
    lang = lang if lang in LANGUAGES else "en"
    if not answer:
        raise HTTPException(502, "The AI returned an empty answer. Please try again.")
    new_id = None
    if transcript:
        new_id = save_history(lang if req.language == "auto" else req.language, req.crop, req.district, transcript, answer)
    return {"id": new_id, "transcript": transcript, "answer": answer, "language": lang}


# ---------- Crop calendar (typical Andhra Pradesh seasons) ----------
# 12 letters Jan..Dec: S = sowing/planting, G = growing, H = harvest, - = nothing
CALENDAR = [
    ("Paddy (Kharif)", "-----SSGGHH-"),
    ("Paddy (Rabi)", "GGHH------SS"),
    ("Cotton", "H----SSGGGHH"),
    ("Chilli", "HHH----SSGGH"),
    ("Groundnut (Kharif)", "-----SSGGH--"),
    ("Groundnut (Rabi)", "GGGH------SS"),
    ("Maize (Kharif)", "-----SSGGH--"),
    ("Maize (Rabi)", "GGH------SSG"),
    ("Sugarcane", "SSSGGGGGGGGH"),
]


@app.get("/api/calendar")
def calendar():
    return {
        "crops": [{"crop": c, "months": m} for c, m in CALENDAR],
        "note": "Typical seasons only. Exact dates change with variety, district and rainfall. "
        "Confirm with your local RBK or agriculture officer.",
    }


# ---------- Farm ledger (income and expenses) ----------
with db() as _c:
    _c.execute(
        """CREATE TABLE IF NOT EXISTS ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_date TEXT NOT NULL,
            kind TEXT NOT NULL,
            category TEXT NOT NULL,
            crop TEXT,
            amount REAL NOT NULL,
            note TEXT
        )"""
    )


class LedgerEntry(BaseModel):
    entry_date: str
    kind: str
    category: str = Field(min_length=1, max_length=40)
    crop: Optional[str] = Field(default=None, max_length=40)
    amount: float = Field(gt=0, lt=1_000_000_000)
    note: Optional[str] = Field(default=None, max_length=200)


@app.post("/api/ledger")
def add_ledger(e: LedgerEntry):
    if e.kind not in ("income", "expense"):
        raise HTTPException(400, "Type must be income or expense")
    try:
        datetime.strptime(e.entry_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Date must be in YYYY-MM-DD format")
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO ledger (entry_date, kind, category, crop, amount, note) VALUES (?,?,?,?,?,?)",
            (e.entry_date, e.kind, e.category, e.crop, e.amount, e.note),
        )
        return {"id": cur.lastrowid}


@app.get("/api/ledger")
def get_ledger():
    with db() as conn:
        rows = [dict(r) for r in conn.execute("SELECT * FROM ledger ORDER BY entry_date DESC, id DESC").fetchall()]
    income = sum(r["amount"] for r in rows if r["kind"] == "income")
    expense = sum(r["amount"] for r in rows if r["kind"] == "expense")
    by_cat, by_crop = {}, {}
    for r in rows:
        if r["kind"] == "expense":
            by_cat[r["category"]] = by_cat.get(r["category"], 0) + r["amount"]
        c = by_crop.setdefault(r["crop"] or "General", {"income": 0, "expense": 0})
        c[r["kind"]] += r["amount"]
    return {
        "entries": rows,
        "income": round(income, 2),
        "expense": round(expense, 2),
        "profit": round(income - expense, 2),
        "by_category": [{"name": k, "amount": round(v, 2)} for k, v in sorted(by_cat.items(), key=lambda x: -x[1])],
        "by_crop": [
            {"crop": k, "income": round(v["income"], 2), "expense": round(v["expense"], 2), "profit": round(v["income"] - v["expense"], 2)}
            for k, v in by_crop.items()
        ],
    }


@app.delete("/api/ledger/{entry_id}")
def delete_ledger(entry_id: int):
    with db() as conn:
        conn.execute("DELETE FROM ledger WHERE id = ?", (entry_id,))
    return {"ok": True}


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL, "api_key_set": bool(API_KEY and API_KEY != "paste_your_key_here")}


app.mount("/", StaticFiles(directory=ROOT / "frontend", html=True), name="frontend")
