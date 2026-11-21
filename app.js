"use strict";
/* KisanVani v2 frontend: dashboard, voice chat, crop doctor, fertilizer calculator, history. */

/* ---------- Text in 3 languages ---------- */
const I18N = {
  te: {
    speech: "te-IN", greet: "నమస్కారం", heroTitle: "మీ పొలానికి AI సహాయకుడు", heroSub: "ప్రశ్న అడగండి, పంట ఫోటో చూపించండి, వాతావరణం తెలుసుకోండి.",
    nav: { dashboard: "హోమ్", ask: "ప్రశ్న అడగండి", diagnose: "పంట వైద్యుడు", fert: "ఎరువుల లెక్క", history: "చరిత్ర", cal: "పంట క్యాలెండర్", ledger: "ఖర్చుల పుస్తకం", schemes: "పథకాలు" },
    askTitle: "మీ ప్రశ్న అడగండి", askSub: "మైక్ నొక్కి మాట్లాడండి లేదా టైప్ చేయండి.", empty: "మైక్ నొక్కి మీ ప్రశ్న అడగండి.",
    placeholder: "మీ ప్రశ్న ఇక్కడ టైప్ చేయండి", send: "అడగండి", listening: "వింటున్నాను... మాట్లాడండి", thinking: "ఆలోచిస్తున్నాను",
    chips: ["వరికి ఏ ఎరువు వేయాలి?", "మిరపలో తామర పురుగు నివారణ ఎలా?", "ఈ వారం పిచికారీ చేయవచ్చా?", "పంట బీమా గురించి చెప్పండి"],
  },
  hi: {
    speech: "hi-IN", greet: "नमस्ते", heroTitle: "आपके खेत का AI सहायक", heroSub: "सवाल पूछें, फसल की फोटो दिखाएं, मौसम जानें।",
    nav: { dashboard: "होम", ask: "सवाल पूछें", diagnose: "फसल डॉक्टर", fert: "खाद कैलकुलेटर", history: "इतिहास", cal: "फसल कैलेंडर", ledger: "खाता बही", schemes: "योजनाएं" },
    askTitle: "अपना सवाल पूछें", askSub: "माइक दबाकर बोलें या लिखें।", empty: "माइक दबाएं और अपना सवाल पूछें।",
    placeholder: "अपना सवाल यहाँ लिखें", send: "पूछें", listening: "सुन रहा हूँ... बोलिए", thinking: "सोच रहा हूँ",
    chips: ["धान में कौन सी खाद डालें?", "मिर्च में थ्रिप्स कैसे रोकें?", "क्या इस हफ्ते छिड़काव करना ठीक है?", "फसल बीमा के बारे में बताइए"],
  },
  en: {
    speech: "en-IN", greet: "Welcome", heroTitle: "Your AI assistant for the farm", heroSub: "Ask questions, scan a crop photo, and check weather advice.",
    nav: { dashboard: "Home", ask: "Ask", diagnose: "Crop doctor", fert: "Fertilizer", history: "History", cal: "Crop calendar", ledger: "Farm ledger", schemes: "Schemes" },
    askTitle: "Ask your question", askSub: "Press the mic and speak, or type below.", empty: "Press the mic and ask your question.",
    placeholder: "Type your question here", send: "Ask", listening: "Listening... speak now", thinking: "Thinking",
    chips: ["What fertilizer should I use for paddy?", "How do I control thrips in chilli?", "Is it a good time to spray this week?", "Tell me about crop insurance"],
  },
};
const DISTRICTS = [
  ["Nellore", 14.4426, 79.9865], ["Guntur", 16.3067, 80.4365], ["Vijayawada", 16.5062, 80.648], ["Visakhapatnam", 17.6868, 83.2185],
  ["Kurnool", 15.8281, 78.0373], ["Tirupati", 13.6288, 79.4192], ["Kakinada", 16.9891, 82.2475], ["Rajahmundry", 17.0005, 81.804],
  ["Ongole", 15.5057, 80.0499], ["Anantapur", 14.6819, 77.6006], ["Kadapa", 14.4674, 78.8241], ["Eluru", 16.7107, 81.0952],
];
const CROPS = ["Paddy", "Chilli", "Cotton", "Groundnut", "Maize", "Sugarcane", "Tobacco", "Banana"];
const WCODE = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h1M12 12h1M16 12h0M8 16h1M12 16h1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-3v3M17 14h2"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3"/><path d="M20 4v14h-7"/>',
};
const icon = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ls = (k, d) => { try { const v = localStorage.getItem("kv_" + k); return v === null ? d : v; } catch (_) { return d; } };
const sv = (k, v) => { try { localStorage.setItem("kv_" + k, v); } catch (_) { /* ignore */ } };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const T = () => I18N[S.lang === "auto" ? (S.detected || "en") : S.lang];

const S = {
  lang: ls("lang", "te"), crop: ls("crop", ""), district: ls("district", "Nellore"),
  theme: ls("theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  font: Number(ls("font", "100")), speak: ls("speak", "1") === "1", view: "dashboard",
  turns: [], weatherSummary: "", imageB64: null, detected: null, wx: null,
};

async function api(path, opts) {
  const r = await fetch(path, opts);
  let d = null;
  try { d = await r.json(); } catch (_) { /* no body */ }
  if (!r.ok) throw new Error(typeof d?.detail === "string" ? d.detail : "Request failed (" + r.status + ")");
  return d;
}
let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
}
const strip = (s) => s.replace(/\*\*(.*?)\*\*/g, "$1").replace(/[*_`#]/g, "").trim();
function renderText(box, text) {
  let ul = null;
  strip(text).split("\n").forEach((line) => {
    const t = line.trim();
    if (!t) { ul = null; return; }
    const m = t.match(/^[-•]\s+(.*)$/);
    if (m) { if (!ul) { ul = el("ul"); box.appendChild(ul); } ul.appendChild(el("li", "", m[1])); }
    else { ul = null; box.appendChild(el("p", "", t)); }
  });
}

/* ---------- Setup: selects, icons, theme, font ---------- */
CROPS.forEach((c) => $("#cropSel").appendChild(new Option(c, c)));
$("#cropSel").insertBefore(new Option("Crop: any", ""), $("#cropSel").firstChild);
DISTRICTS.forEach(([n]) => $("#districtSel").appendChild(new Option(n, n)));
$$("[data-icon]").forEach((b) => { b.insertAdjacentHTML("afterbegin", icon(b.dataset.icon)); if (b.tagName === "BUTTON") b.appendChild(el("span", "lbl")); });
$("#micBtn").innerHTML = icon("mic");
$("#langSel").value = S.lang; $("#cropSel").value = S.crop; $("#districtSel").value = S.district; $("#speakToggle").checked = S.speak;

function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  $("#themeBtn").innerHTML = icon(S.theme === "dark" ? "sun" : "moon");
}
function applyFont() { document.documentElement.style.fontSize = S.font + "%"; }
applyTheme(); applyFont();
$("#themeBtn").onclick = () => { S.theme = S.theme === "dark" ? "light" : "dark"; sv("theme", S.theme); applyTheme(); };
$("#fontUp").onclick = () => { S.font = Math.min(S.font + 10, 140); sv("font", S.font); applyFont(); };
$("#fontDown").onclick = () => { S.font = Math.max(S.font - 10, 90); sv("font", S.font); applyFont(); };

function applyLanguage() {
  const t = T();
  $$("#nav button").forEach((b) => { $(".lbl", b).textContent = t.nav[b.dataset.view]; });
  $$("[data-go]").forEach((b) => { b.textContent = b.dataset.go === "ask" ? t.nav.ask : t.nav.diagnose; });
  $("#heroGreet").textContent = t.greet + " - " + S.district;
  $("#heroTitle").textContent = t.heroTitle; $("#heroSub").textContent = t.heroSub;
  $("#askTitle").textContent = t.askTitle; $("#askSub").textContent = t.askSub;
  $("#textInput").placeholder = t.placeholder; $("#sendBtn").textContent = t.send;
  $("#viewTitle").textContent = t.nav[S.view];
  const empty = $("#emptyMsg"); if (empty) empty.textContent = t.empty;
  const chips = $("#chips"); chips.innerHTML = "";
  t.chips.forEach((q) => { const c = el("button", "chip", q); c.onclick = () => ask(q); chips.appendChild(c); });
  if (recognition) recognition.lang = t.speech;
}
$("#langSel").onchange = (e) => { S.lang = e.target.value; sv("lang", S.lang); applyLanguage(); };
$("#cropSel").onchange = (e) => { S.crop = e.target.value; sv("crop", S.crop); };
$("#districtSel").onchange = (e) => { S.district = e.target.value; sv("district", S.district); applyLanguage(); loadWeather(); };
$("#speakToggle").onchange = (e) => { S.speak = e.target.checked; sv("speak", S.speak ? "1" : "0"); if (!S.speak) window.speechSynthesis?.cancel(); };

/* ---------- Navigation ---------- */
function show(view) {
  S.view = view;
  $$(".view").forEach((v) => v.classList.toggle("hidden", v.id !== "view-" + view));
  $$("#nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("#viewTitle").textContent = T().nav[view];
  if (view === "history") loadHistory();
  if (view === "dashboard") loadStats();
  if (view === "cal") renderCalendar();
  if (view === "ledger") loadLedger();
  if (view === "schemes") renderSchemes();
  window.scrollTo({ top: 0 });
}
$$("#nav button").forEach((b) => (b.onclick = () => show(b.dataset.view)));
$$("[data-go]").forEach((b) => (b.onclick = () => show(b.dataset.go)));

/* ---------- Voice output ---------- */
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const lang = I18N[S.lang === "auto" ? detectLang(text) : S.lang].speech;
  const u = new SpeechSynthesisUtterance(strip(text).replace(/^[-•]\s+/gm, ""));
  u.lang = lang;
  const v = speechSynthesis.getVoices().find((x) => x.lang.replace("_", "-").toLowerCase().startsWith(lang.slice(0, 2)));
  if (v) u.voice = v; else toast("No voice installed for this language. Showing text only.");
  speechSynthesis.speak(u);
}

/* ---------- Chat ---------- */
const chat = $("#chat"), statusEl = $("#status"), micBtn = $("#micBtn"), textInput = $("#textInput"), sendBtn = $("#sendBtn");
const setStatus = (t) => { statusEl.textContent = t || ""; };
function resetChatEmpty() {
  chat.innerHTML = "";
  const box = el("div", "empty"); box.id = "emptyState";
  box.append(el("p", "big", "KisanVani")); const p = el("p"); p.id = "emptyMsg"; box.append(p);
  chat.appendChild(box);
}
resetChatEmpty();

function addMessage(kind, text) {
  $("#emptyState")?.remove();
  const div = el("div", "msg " + kind);
  if (kind === "bot") {
    renderText(div, text);
    const row = el("div", "row");
    const l = el("button", "link-btn", "Listen"); l.onclick = () => speak(text);
    const c = el("button", "link-btn", "Copy"); c.onclick = () => navigator.clipboard?.writeText(strip(text)).then(() => toast("Copied"));
    row.append(l, c); div.appendChild(row);
  } else div.textContent = text;
  chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
  return div;
}

async function ask(question) {
  question = (question || "").trim();
  if (!question) return;
  show("ask");
  addMessage("user", question);
  applyKeywords(question);
  if (question.length <= 60 && WEATHER_WORDS.test(question) && S.wx) {
    const a = weatherAnswer(S.lang === "auto" ? detectLang(question) : S.lang);
    textInput.value = ""; addMessage("bot", a); if (S.speak) speak(a); return;
  }
  textInput.value = ""; sendBtn.disabled = true; setStatus(T().thinking + "...");
  const wait = el("div", "msg bot"); const dots = el("div", "dots"); dots.innerHTML = "<span></span><span></span><span></span>";
  wait.appendChild(dots); chat.appendChild(wait); chat.scrollTop = chat.scrollHeight;
  try {
    const data = await api("/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language: S.lang, crop: S.crop || null, district: S.district, weather_summary: S.weatherSummary || null, history: S.turns.slice(-6) }),
    });
    wait.remove();
    S.turns.push({ role: "user", text: question }, { role: "model", text: data.answer });
    addMessage("bot", data.answer);
    if (S.speak) speak(data.answer);
  } catch (err) { wait.remove(); addMessage("error", err.message); }
  finally { sendBtn.disabled = false; setStatus(""); }
}
sendBtn.onclick = () => ask(textInput.value);
textInput.onkeydown = (e) => { if (e.key === "Enter") ask(textInput.value); };

/* ---------- Voice input: Smart (AI hears the audio) or Browser speech ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null, listening = false;
const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
let voiceMode = canRecord ? ls("vmode", "smart") : "browser";
$("#voiceMode").value = voiceMode;
$("#voiceMode").onchange = (e) => { voiceMode = e.target.value; sv("vmode", voiceMode); };
if (!canRecord && !SR) { micBtn.disabled = true; setStatus("Voice input needs Google Chrome or Edge. You can still type."); }

function thinkingBubble() {
  const wait = el("div", "msg bot"); const dots = el("div", "dots"); dots.innerHTML = "<span></span><span></span><span></span>";
  wait.appendChild(dots); chat.appendChild(wait); chat.scrollTop = chat.scrollHeight;
  return wait;
}

/* --- Browser speech recognition (one language at a time) --- */
if (SR) {
  recognition = new SR(); recognition.interimResults = true; recognition.continuous = false;
  let finalText = "";
  recognition.onstart = () => { listening = true; micBtn.classList.add("listening"); setStatus(T().listening); };
  recognition.onresult = (e) => {
    let interim = ""; finalText = "";
    for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript; }
    textInput.value = (finalText + " " + interim).trim();
  };
  recognition.onerror = (e) => {
    const m = { "not-allowed": "Microphone is blocked. Click the lock icon in the address bar and allow it.", "no-speech": "I did not hear anything. Try again.", network: "Voice input needs internet." };
    setStatus(m[e.error] || "Voice error: " + e.error); finalText = "";
  };
  recognition.onend = () => {
    listening = false; micBtn.classList.remove("listening");
    if (finalText.trim()) { setStatus(""); ask(finalText); } finalText = "";
  };
}

/* --- Smart voice: record, stop automatically when you stop talking, send to the AI --- */
let mediaRec = null, mStream = null, mCtx = null, mTimer = null, mChunks = [], mHeard = false;
async function startSmart() {
  try { mStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } }); }
  catch (_) { setStatus("Microphone is blocked. Click the lock icon in the address bar and allow it."); return; }
  mChunks = []; mHeard = false;
  mediaRec = new MediaRecorder(mStream);
  mediaRec.ondataavailable = (e) => { if (e.data.size) mChunks.push(e.data); };
  mediaRec.onstop = onSmartStop;
  mediaRec.start();
  listening = true; micBtn.classList.add("listening"); setStatus(T().listening);

  mCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (mCtx.state === "suspended") await mCtx.resume();
  const an = mCtx.createAnalyser(); an.fftSize = 1024; mCtx.createMediaStreamSource(mStream).connect(an);
  const data = new Uint8Array(an.fftSize); const t0 = Date.now(); let last = t0;
  mTimer = setInterval(() => {
    an.getByteTimeDomainData(data);
    let sum = 0; for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
    const rms = Math.sqrt(sum / data.length), now = Date.now();
    micBtn.style.transform = `scale(${1 + Math.min(rms * 3, 0.25)})`;
    setStatus(T().listening + "   " + "|".repeat(Math.min(20, Math.round(rms * 150))));
    if (rms > 0.01) { mHeard = true; last = now; }
    if ((mHeard && now - last > 1800) || (!mHeard && now - t0 > 9000) || now - t0 > 30000) stopSmart();
  }, 100);
}
function stopSmart() {
  clearInterval(mTimer); micBtn.style.transform = "";
  if (mediaRec && mediaRec.state !== "inactive") mediaRec.stop();
  if (mStream) mStream.getTracks().forEach((t) => t.stop());
  if (mCtx) mCtx.close();
  listening = false; micBtn.classList.remove("listening");
}
async function blobToWav16k(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const audio = await ctx.decodeAudioData(await blob.arrayBuffer()); ctx.close();
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(audio.duration * 16000)), 16000);
  const src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start();
  const pcm = (await off.startRendering()).getChannelData(0);
  const buf = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + pcm.length * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 16000, true); v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) { const s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  const bytes = new Uint8Array(buf); let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function onSmartStop() {
  if (!mChunks.length) { setStatus("No audio was recorded. Check the microphone and try again."); return; }
  show("ask"); setStatus(T().thinking + "...");
  const wait = thinkingBubble();
  try {
    const wav = await blobToWav16k(new Blob(mChunks, { type: mediaRec.mimeType }));
    const r = await api("/api/voice", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_base64: wav, mime_type: "audio/wav", language: S.lang, crop: S.crop || null, district: S.district, weather_summary: S.weatherSummary || null, history: S.turns.slice(-6) }),
    });
    wait.remove();
    S.detected = r.language;
    if (r.transcript) {
      addMessage("user", r.transcript); applyKeywords(r.transcript);
      S.turns.push({ role: "user", text: r.transcript }, { role: "model", text: r.answer });
    }
    if (S.lang === "auto") applyLanguage();
    addMessage("bot", r.answer);
    if (S.speak) speak(r.answer);
  } catch (err) { wait.remove(); addMessage("error", err.message); }
  finally { setStatus(""); }
}

micBtn.onclick = () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (voiceMode === "smart" && canRecord) { if (listening) stopSmart(); else startSmart(); return; }
  if (!SR) { toast("Browser voice is not supported here. Use Chrome or Edge."); return; }
  if (listening) { recognition.stop(); return; }
  recognition.lang = T().speech;
  try { recognition.start(); } catch (_) { /* already running */ }
};

/* ---------- Weather + advisory ---------- */
function buildAlerts(w) {
  const c = w.current, d = w.daily, out = []; let spray = "good";
  const rain2 = (d.precipitation_sum[0] || 0) + (d.precipitation_sum[1] || 0);
  if (c.precipitation > 0 || rain2 >= 5) { spray = "bad"; out.push(["warn", "Rain is likely in the next 1-2 days. Avoid spraying pesticide and top-dressing fertilizer."]); }
  if (c.wind_speed_10m >= 20 || (d.wind_speed_10m_max[0] || 0) >= 30) { spray = "bad"; out.push(["warn", "Strong wind today. Spray drift can waste the chemical, so wait for a calm morning."]); }
  if (d.precipitation_sum.some((x) => x >= 40)) out.push(["bad", "Very heavy rain expected. Keep drainage channels open and protect harvested produce."]);
  if (d.temperature_2m_max[0] >= 38) out.push(["bad", "Heat stress risk. Irrigate in the evening and avoid spraying in the afternoon."]);
  if (d.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0) < 1 && c.relative_humidity_2m < 45) out.push(["warn", "Dry spell with low humidity. Check soil moisture and plan irrigation."]);
  if (!out.length) out.push(["ok", "Conditions look normal. Early morning or evening is best for field work and spraying."]);
  return { out, spray };
}
async function loadWeather() {
  const box = $("#dashWeather"); box.innerHTML = '<div class="skeleton">Loading weather...</div>';
  const d = DISTRICTS.find((x) => x[0] === S.district) || DISTRICTS[0];
  try {
    const w = await api(`/api/weather?lat=${d[1]}&lon=${d[2]}`);
    const c = w.current, desc = WCODE[c.weather_code] || "Weather";
    S.weatherSummary = `${desc}, ${Math.round(c.temperature_2m)}°C, humidity ${c.relative_humidity_2m}%, rain now ${c.precipitation} mm, wind ${Math.round(c.wind_speed_10m)} km/h`;
    const { out, spray } = buildAlerts(w);
    S.wx = { temp: Math.round(c.temperature_2m), hum: c.relative_humidity_2m, spray, rain2: Math.round(((w.daily.precipitation_sum[0] || 0) + (w.daily.precipitation_sum[1] || 0)) * 10) / 10 };

    box.innerHTML = "";
    const top = el("div", "w-top"); const left = el("div");
    left.append(el("div", "", S.district), el("div", "w-temp", Math.round(c.temperature_2m) + "°C"), el("div", "w-desc", desc));
    top.append(left, el("span", "spray " + spray, spray === "good" ? "Good to spray" : "Not good to spray"));
    const m = el("div", "w-metrics");
    [[c.relative_humidity_2m + "%", "Humidity"], [Math.round(c.wind_speed_10m) + " km/h", "Wind"], [c.precipitation + " mm", "Rain now"]].forEach(([v, l]) => {
      const x = el("div", "metric"); x.append(el("b", "", v), el("span", "", l)); m.appendChild(x);
    });
    box.append(top, m);

    const al = $("#dashAlerts"); al.innerHTML = "";
    out.forEach(([k, msg]) => al.appendChild(el("div", "alert " + k, msg)));

    const fc = $("#dashForecast"); fc.innerHTML = "";
    w.daily.time.forEach((t, i) => {
      const x = el("div", "fc");
      x.append(el("b", "", i === 0 ? "Today" : new Date(t).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })),
        el("div", "t", `${Math.round(w.daily.temperature_2m_min[i])}-${Math.round(w.daily.temperature_2m_max[i])}°C`),
        el("small", "", WCODE[w.daily.weather_code[i]] || ""), el("small", "", "Rain " + w.daily.precipitation_sum[i] + " mm"));
      fc.appendChild(x);
    });
  } catch (_) {
    S.weatherSummary = ""; S.wx = null; box.textContent = "Weather is not available. Check your internet connection.";
    $("#dashAlerts").textContent = "";
  }
}

/* ---------- Dashboard stats ---------- */
async function loadStats() {
  try {
    const s = await api("/api/stats");
    const cards = $("#statCards"); cards.innerHTML = "";
    [[s.total, "Total questions"], [s.today, "Asked today"], [s.photos, "Photos diagnosed"], [Object.keys(s.languages).length, "Languages used"]].forEach(([v, l]) => {
      const c = el("div", "card stat"); c.append(el("b", "", String(v)), el("span", "", l)); cards.appendChild(c);
    });
    const bars = $("#barChart"); bars.innerHTML = "";
    const max = Math.max(1, ...s.daily.map((d) => d.count));
    s.daily.forEach((d) => {
      const col = el("div", "bar-col"); const b = el("div", "bar"); b.style.height = Math.round((d.count / max) * 100) + "%";
      col.append(el("em", "", String(d.count)), b, el("small", "", d.date)); bars.appendChild(col);
    });
    const list = $("#cropList"); list.innerHTML = "";
    if (!s.crops.length) list.textContent = "Select a crop at the top and ask questions to see this chart.";
    const cm = Math.max(1, ...s.crops.map((c) => c.count));
    s.crops.forEach((c) => {
      const row = el("div", "crop-row"); const tr = el("div", "track"); const i = el("i"); i.style.width = (c.count / cm) * 100 + "%"; tr.appendChild(i);
      row.append(el("span", "", c.name), tr, el("b", "", String(c.count))); list.appendChild(row);
    });
  } catch (_) { /* stats are optional */ }
}

/* ---------- Crop doctor ---------- */
const fileInput = $("#fileInput"), drop = $("#drop"), analyzeBtn = $("#analyzeBtn");
function loadImageFile(file) {
  if (!file || !file.type.startsWith("image/")) { toast("Please choose an image file."); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1024, k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const url = cv.toDataURL("image/jpeg", 0.85);
      S.imageB64 = url.split(",")[1];
      const p = $("#preview"); p.src = url; p.classList.remove("hidden"); $("#dropHint").classList.add("hidden");
      analyzeBtn.disabled = false;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
fileInput.onchange = () => loadImageFile(fileInput.files[0]);
["dragover", "dragenter"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => loadImageFile(e.dataTransfer.files[0]));

analyzeBtn.onclick = async () => {
  if (!S.imageB64) return;
  analyzeBtn.disabled = true; $("#diagStatus").textContent = T().thinking + "...";
  try {
    const r = await api("/api/diagnose", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: S.imageB64, mime_type: "image/jpeg", language: S.lang === "auto" ? (S.detected || "en") : S.lang, crop: S.crop || null, district: S.district }),
    });
    renderDiagnosis(r);
  } catch (err) { const b = $("#diagResult"); b.innerHTML = ""; b.append(el("h3", "", "Result"), el("div", "alert bad", err.message)); }
  finally { analyzeBtn.disabled = false; $("#diagStatus").textContent = ""; }
};
function renderDiagnosis(r) {
  const b = $("#diagResult"); b.innerHTML = ""; b.classList.add("res");
  b.append(el("h3", "", "Result"));
  const head = el("div"); head.append(el("span", "badge " + (r.healthy ? "ok" : "bad"), r.healthy ? "Looks healthy" : "Problem found"), el("span", "badge conf", "Confidence: " + r.confidence));
  b.append(head, el("p", "prob", r.problem));
  if (r.cause) b.append(el("h4", "", "Cause"), el("p", "", r.cause));
  [["Treatment", r.treatment], ["Prevention", r.prevention]].forEach(([title, items]) => {
    if (!items.length) return; b.append(el("h4", "", title)); const ul = el("ul"); items.forEach((x) => ul.appendChild(el("li", "", x))); b.append(ul);
  });
  if (r.note) b.append(el("p", "muted small", r.note));
  const l = el("button", "btn", "Listen"); l.style.marginTop = "14px";
  l.onclick = () => speak([r.problem, r.cause, ...r.treatment].join(". "));
  b.append(l);
}

/* ---------- Fertilizer ---------- */
(async () => {
  try {
    const crops = await api("/api/fertilizer/crops");
    crops.forEach((c) => $("#fertCrop").appendChild(new Option(c, c)));
    if (crops.includes(S.crop)) $("#fertCrop").value = S.crop;
  } catch (_) { /* backend not ready */ }
})();
$("#fertBtn").onclick = async () => {
  const box = $("#fertResult");
  try {
    const r = await api(`/api/fertilizer?crop=${encodeURIComponent($("#fertCrop").value)}&acres=${encodeURIComponent($("#fertAcres").value || 1)}`);
    box.innerHTML = ""; box.append(el("h3", "", `${r.crop}: ${r.acres} acre${r.acres === 1 ? "" : "s"}`));
    const g = el("div", "prod-grid");
    Object.entries(r.products_kg).forEach(([k, v]) => { const p = el("div", "prod"); p.append(el("b", "", v + " kg"), el("span", "", k)); g.appendChild(p); });
    box.append(g, el("p", "muted small", `Nutrients needed: N ${r.nutrients_kg.N} kg, P2O5 ${r.nutrients_kg.P2O5} kg, K2O ${r.nutrients_kg.K2O} kg`));
    box.append(el("h4", "", "Schedule")); const ul = el("ul"); r.schedule.forEach((x) => ul.appendChild(el("li", "", x))); box.append(ul);
    box.append(el("p", "muted small", r.note)); box.classList.add("res");
  } catch (err) { toast(err.message); }
};

/* ---------- History ---------- */
let historyItems = [];
function renderHistory() {
  const q = $("#histSearch").value.trim().toLowerCase(); const list = $("#historyList"); list.innerHTML = "";
  const items = historyItems.filter((i) => !q || (i.question + " " + i.answer).toLowerCase().includes(q));
  if (!items.length) { list.textContent = historyItems.length ? "No matches." : "No questions yet. Ask something on the Ask page."; return; }
  items.forEach((it) => {
    const box = el("div", "h-item");
    box.append(el("div", "h-meta", [new Date(it.created_at).toLocaleString("en-IN"), it.crop, it.district, it.language.toUpperCase()].filter(Boolean).join("  |  ")),
      el("p", "h-q", it.question), el("p", "h-a", strip(it.answer)));
    const act = el("div", "h-act");
    const l = el("button", "link-btn", "Listen"); l.onclick = () => speak(it.answer);
    const d = el("button", "link-btn", "Delete"); d.onclick = async () => { await api("/api/history/" + it.id, { method: "DELETE" }); loadHistory(); };
    act.append(l, d); box.append(act); list.appendChild(box);
  });
}
async function loadHistory() { try { historyItems = await api("/api/history"); renderHistory(); } catch (_) { $("#historyList").textContent = "Could not load history."; } }
$("#histSearch").oninput = renderHistory;
$("#clearBtn").onclick = async () => { if (confirm("Delete all history?")) { await api("/api/history", { method: "DELETE" }); loadHistory(); } };

/* ---------- Keyword understanding (Telugu, Hindi and English words) ---------- */
const KW = {
  crop: {
    Paddy: ["వరి", "వడ్లు", "धान", "चावल", "paddy", "rice", "vari", "dhan"],
    Chilli: ["మిరప", "మిర్చి", "मिर्च", "chilli", "chili", "mirchi", "mirapa"],
    Cotton: ["పత్తి", "कपास", "cotton", "kapas"],
    Groundnut: ["వేరుశనగ", "వేరుశెనగ", "मूंगफली", "groundnut", "peanut"],
    Maize: ["మొక్కజొన్న", "मक्का", "मकई", "maize", "corn"],
    Sugarcane: ["చెరకు", "गन्ना", "sugarcane"],
    Tobacco: ["పొగాకు", "तंबाकू", "तम्बाकू", "tobacco"],
    Banana: ["అరటి", "केला", "banana"],
  },
  topic: {
    Fertilizer: ["ఎరువు", "యూరియా", "డీఏపీ", "డి.ఏ.పి", "खाद", "उर्वरक", "यूरिया", "डीएपी", "fertilizer", "fertiliser", "urea", "dap", "eruvu", "khad"],
    Pest: ["పురుగు", "తామర", "కీటక", "कीट", "कीड़े", "सुंडी", "थ्रिप्स", "pest", "insect", "thrips", "worm", "aphid", "bollworm", "purugu", "keeda"],
    Disease: ["తెగులు", "రోగం", "ఆకు మచ్చ", "रोग", "बीमारी", "धब्बा", "disease", "blight", "fungus", "wilt"],
    Spraying: ["పిచికారీ", "మందు", "छिड़काव", "दवा", "spray", "pesticide", "dawai", "davai", "mandu"],
    Irrigation: ["నీటి తడి", "సాగునీరు", "నీరు", "सिंचाई", "पानी", "irrigation", "water"],
    Weather: ["వాతావరణ", "వర్షం", "వాన", "मौसम", "बारिश", "weather", "rain", "temperature"],
    Scheme: ["పథకం", "బీమా", "రుణం", "योजना", "बीमा", "ऋण", "scheme", "insurance", "loan", "subsidy"],
    Seed: ["విత్తన", "बीज", "seed"],
    Market: ["ధర", "మార్కెట్", "भाव", "मंडी", "price", "market", "mandi"],
  },
};
const WEATHER_WORDS = /వాతావరణ|వర్ష|వాన|मौसम|बारिश|\bweather\b|\bforecast\b|\btemperature\b|\brain\b/i;

function detectLang(text) {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}
function hasTerm(text, term) {
  return /^[a-z. ]+$/i.test(term) ? new RegExp("\\b" + term.replace(/\./g, "\\.") + "\\b", "i").test(text) : text.includes(term);
}
function analyzeKeywords(text) {
  const find = (group) => Object.keys(group).filter((k) => group[k].some((t) => hasTerm(text, t)));
  return { crops: find(KW.crop), topics: find(KW.topic) };
}
function applyKeywords(text) {
  const { crops, topics } = analyzeKeywords(text);
  if (crops.length === 1 && crops[0] !== S.crop) {
    S.crop = crops[0]; sv("crop", S.crop); $("#cropSel").value = S.crop; toast("Crop set to " + S.crop);
  }
  const tags = [...crops, ...topics];
  if (!tags.length) return;
  const row = el("div", "kw"); row.append(el("span", "", "Understood:"));
  tags.forEach((t) => row.appendChild(el("b", "", t)));
  chat.appendChild(row); chat.scrollTop = chat.scrollHeight;
}
function weatherAnswer(lang) {
  const w = S.wx, d = S.district;
  const ok = { te: "పిచికారీకి వాతావరణం అనుకూలంగా ఉంది.", hi: "छिड़काव के लिए मौसम ठीक है।", en: "Weather is fine for spraying." };
  const no = { te: "ఇప్పుడు పిచికారీ చేయకండి.", hi: "अभी छिड़काव न करें।", en: "Avoid spraying right now." };
  const s = (w.spray === "good" ? ok : no)[lang];
  if (lang === "te") return `${d}లో ఇప్పుడు ${w.temp}°C, తేమ ${w.hum}%. రాబోయే 2 రోజుల్లో వర్షం ${w.rain2} మి.మీ. ${s}`;
  if (lang === "hi") return `${d} में अभी ${w.temp}°C, नमी ${w.hum}%. अगले 2 दिन में बारिश ${w.rain2} मिमी. ${s}`;
  return `In ${d} it is ${w.temp}°C now with ${w.hum}% humidity. Expected rain in the next 2 days: ${w.rain2} mm. ${s}`;
}

/* ---------- Crop calendar ---------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CAL_LABEL = { S: "Sowing", G: "Growing", H: "Harvest" };
async function renderCalendar() {
  try {
    const data = await api("/api/calendar"), now = new Date().getMonth();
    const grid = $("#calGrid"); grid.innerHTML = "";
    grid.appendChild(el("div", "cal-h"));
    MONTHS.forEach((m, i) => grid.appendChild(el("div", "cal-h" + (i === now ? " now" : ""), m)));
    data.crops.forEach((c) => {
      grid.appendChild(el("div", "cal-name", c.crop));
      [...c.months].forEach((code, i) => {
        const cell = el("div", "cal-c" + (code !== "-" ? " c-" + code : "") + (i === now ? " now" : ""));
        if (code !== "-") cell.title = c.crop + ": " + CAL_LABEL[code];
        grid.appendChild(cell);
      });
    });
    $("#calNote").textContent = data.note;
    const box = $("#calNow"); box.innerHTML = "";
    const sow = data.crops.filter((c) => c.months[now] === "S").map((c) => c.crop);
    const har = data.crops.filter((c) => c.months[now] === "H").map((c) => c.crop);
    box.appendChild(el("div", "alert warn", "Sowing time now: " + (sow.join(", ") || "none of the listed crops")));
    box.appendChild(el("div", "alert ok", "Harvest time now: " + (har.join(", ") || "none of the listed crops")));
  } catch (err) { toast(err.message); }
}

/* ---------- Farm ledger ---------- */
const EXPENSE_CATS = ["Seeds", "Fertilizer", "Pesticide", "Labour", "Irrigation", "Machinery", "Transport", "Other"];
const INCOME_CATS = ["Sale of produce", "Subsidy or support", "Other"];
const inr = (n) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
function fillCats() {
  const cats = $("#lgKind").value === "income" ? INCOME_CATS : EXPENSE_CATS; const s = $("#lgCat"); s.innerHTML = "";
  cats.forEach((c) => s.appendChild(new Option(c, c)));
}
$("#lgKind").onchange = fillCats; fillCats();
$("#lgCrop").appendChild(new Option("General", "")); CROPS.forEach((c) => $("#lgCrop").appendChild(new Option(c, c)));
$("#lgDate").value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
$("#lgAdd").onclick = async () => {
  const amount = parseFloat($("#lgAmt").value);
  if (!(amount > 0)) { toast("Enter an amount greater than 0."); return; }
  try {
    await api("/api/ledger", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_date: $("#lgDate").value, kind: $("#lgKind").value, category: $("#lgCat").value, crop: $("#lgCrop").value || null, amount, note: $("#lgNote").value.trim() || null }),
    });
    $("#lgAmt").value = ""; $("#lgNote").value = ""; toast("Saved"); loadLedger();
  } catch (e) { toast(e.message); }
};
async function loadLedger() {
  try {
    const d = await api("/api/ledger");
    const cards = $("#lgCards"); cards.innerHTML = "";
    [["Income", d.income, ""], ["Expenses", d.expense, ""], ["Profit", d.profit, d.profit < 0 ? "neg" : ""]].forEach(([l, v, cls]) => {
      const c = el("div", "card stat"); c.append(el("b", cls, inr(v)), el("span", "", l)); cards.appendChild(c);
    });
    const br = $("#lgBreak"); br.innerHTML = "";
    if (!d.by_category.length) br.textContent = "Add expenses to see the split.";
    const mx = Math.max(1, ...d.by_category.map((x) => x.amount));
    d.by_category.forEach((x) => {
      const row = el("div", "crop-row money"), tr = el("div", "track"), i = el("i"); i.style.width = (x.amount / mx) * 100 + "%"; tr.appendChild(i);
      row.append(el("span", "", x.name), tr, el("b", "", inr(x.amount))); br.appendChild(row);
    });
    const bc = $("#lgCrops"); bc.innerHTML = "";
    if (!d.by_crop.length) bc.textContent = "Nothing yet.";
    d.by_crop.forEach((x) => {
      const row = el("div", "pl"); row.append(el("span", "", x.crop), el("b", x.profit < 0 ? "neg" : "pos", inr(x.profit))); bc.appendChild(row);
    });
    const list = $("#lgList"); list.innerHTML = "";
    if (!d.entries.length) list.textContent = "No entries yet.";
    d.entries.forEach((x) => {
      const row = el("div", "entry");
      const mid = el("div"); mid.append(el("span", "", x.category + (x.crop ? " - " + x.crop : "")));
      if (x.note) mid.appendChild(el("small", "", x.note));
      const del = el("button", "link-btn", "Delete"); del.onclick = async () => { await api("/api/ledger/" + x.id, { method: "DELETE" }); loadLedger(); };
      row.append(el("small", "", x.entry_date), mid, el("span", "amt " + (x.kind === "income" ? "inc" : "exp"), (x.kind === "income" ? "+" : "-") + inr(x.amount)), del);
      list.appendChild(row);
    });
  } catch (e) { toast(e.message); }
}

/* ---------- Schemes and help ---------- */
const SCHEMES = [
  { name: "PM-KISAN", desc: "Income support for farmer families. Check eligibility and payment status on the official portal.", url: "https://pmkisan.gov.in", q: "Explain the PM-KISAN scheme and who is eligible." },
  { name: "PM Fasal Bima Yojana", desc: "Crop insurance against loss from drought, flood, pests and disease. Enrol through your bank or RBK before the cut-off date.", url: "https://pmfby.gov.in", q: "How does crop insurance under PM Fasal Bima Yojana work?" },
  { name: "Soil Health Card", desc: "Soil test report for your land with crop-wise fertilizer advice.", url: "https://soilhealth.dac.gov.in", q: "What is a Soil Health Card and how do I get one?" },
  { name: "e-NAM", desc: "Online national market to sell produce to buyers beyond your local mandi.", url: "https://enam.gov.in", q: "How can I sell my crop on e-NAM?" },
  { name: "Mandi prices (Agmarknet)", desc: "Daily market prices of crops from mandis across India. Check before you sell.", url: "https://agmarknet.gov.in", q: "How do I check mandi prices before selling my crop?" },
  { name: "Kisan Credit Card", desc: "Short-term farm loans at lower interest. Apply at your bank or cooperative society.", url: null, q: "What is a Kisan Credit Card and how do I apply?" },
  { name: "IMD weather warnings", desc: "Official rainfall and weather warnings from the India Meteorological Department.", url: "https://mausam.imd.gov.in", q: "How can I use weather warnings to plan farm work?" },
];
function renderSchemes() {
  const g = $("#schemeGrid"); if (g.childElementCount) return;
  SCHEMES.forEach((s) => {
    const c = el("div", "card scheme"); c.append(el("h3", "", s.name), el("p", "", s.desc));
    const acts = el("div", "acts");
    const ask1 = el("button", "link-btn", "Ask KisanVani"); ask1.onclick = () => ask(s.q); acts.appendChild(ask1);
    if (s.url) { const a = el("a", "", "Official site"); a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer"; acts.appendChild(a); }
    c.appendChild(acts); g.appendChild(c);
  });
}

/* ---------- Start ---------- */
applyLanguage(); show("dashboard"); loadWeather();
