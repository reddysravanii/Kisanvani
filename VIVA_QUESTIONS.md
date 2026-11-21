# Likely viva questions and answers

1. **What problem does it solve?** Many farmers are more comfortable speaking in Telugu/Hindi than typing.
   It gives quick advice by voice in their own language, with local weather.
2. **How does speech-to-text work here?** The browser's Web Speech API sends audio to the browser vendor's
   recognition service and returns text. We set `recognition.lang` to te-IN/hi-IN/en-IN.
3. **Why not run speech recognition on your server?** Free, no model hosting, no audio upload code. Trade-off: needs internet and Chrome/Edge.
4. **How does the AI know to answer in Telugu?** The system prompt says "Always reply in Telugu", and Gemini is multilingual.
5. **What is a system prompt?** Hidden instructions sent with every request that set the assistant's role, language, tone and rules.
6. **Why FastAPI?** Async support, automatic request validation (Pydantic), automatic docs at `/docs`, simple syntax.
7. **Where is the API key stored? Is it safe?** In `.env` on the server, loaded with python-dotenv, never sent to the browser, ignored by Git.
8. **How do you give the AI context of earlier questions?** The frontend sends the last 6 turns; the backend adds them to the `contents` array.
9. **How do you use weather?** Open-Meteo gives current conditions; a one-line summary is added to the prompt so advice (e.g. spraying) considers rain and wind.
10. **How is history stored?** SQLite table with id, time, language, crop, district, question, answer. Endpoints to list and delete.
11. **What if the AI gives wrong advice?** The prompt requires confirming doses with RBK; the footer repeats it. It is advisory only.
12. **What if the model name is wrong or quota ends?** Backend tries fallback models; returns clear errors (429 quota, key rejected).
13. **How do you prevent XSS?** Answers are inserted with `textContent`, never `innerHTML`.
14. **How would you scale it?** Move to PostgreSQL, add user login, caching, rate limiting, and deploy behind HTTPS on a cloud host.
15. **What would you add next?** Crop disease detection from photos, mandi prices, WhatsApp/SMS access, offline support.
16. **What is the difference between REST endpoints here?** POST `/api/ask` creates an answer; GET `/api/history` reads; DELETE removes.
17. **Why plain JavaScript and not React?** The UI is small; no build step makes it simpler to run and explain.

# Version 3 questions
18. **Why did you add "Smart voice" when browsers already have speech recognition?** Browser recognition works for one fixed language at a time and often mishears local farming words. Gemini hears the audio directly, handles Telugu, Hindi, English and mixed speech, and uses our glossary of farming terms.
19. **How does the mic know when to stop?** The browser measures the audio loudness every 100 ms. After speech has been heard, 1.8 seconds of silence stops the recording.
20. **Why convert audio to WAV?** The Gemini API accepts WAV, MP3, OGG, FLAC and AAC, but Chrome records WebM. We decode and resample to 16 kHz mono WAV in the browser.
21. **What does "Auto language" do?** The AI replies in the language the farmer spoke, and the app switches its labels and read-aloud voice to that language.
22. **How do you find keywords in a sentence?** A dictionary of Telugu, Hindi and English words per crop and topic. English words use word boundaries to avoid false matches; Telugu and Hindi use substring matching because words change with suffixes.
23. **Why answer weather questions without AI?** We already have live weather data. A template answer is instant, always accurate to that data and saves API quota.
24. **How does the ledger calculate profit?** Income minus expenses, stored in SQLite and grouped by crop and category with SQL and Python.
25. **How do you protect the API quota?** An in-memory rate limiter per IP, input size limits, and short answers.
26. **What are the limits of voice recognition?** Noise, strong dialects and a weak internet connection reduce accuracy. We show the transcript so the farmer can see what was understood, and offer typing as a backup.
