# Voice test sheet (do this before your demo)

Set **Language = Auto (any language)** at the top and **Voice mode = Smart voice (AI listens)** on the Ask page.
Press the mic, speak one phrase at a normal speed, then stop. It stops by itself after about 2 seconds of silence.

For each phrase check three things:
1. The text of your bubble matches what you said (the "transcript").
2. The "Understood:" tags show the right crop and topic.
3. The answer is in the same language you spoke.

## Telugu
| Say | Expected tags |
|---|---|
| వరికి ఏ ఎరువు వేయాలి? | Paddy, Fertilizer |
| మిరపలో తామర పురుగు ఎలా అరికట్టాలి? | Chilli, Pest |
| పత్తిలో గులాబీ రంగు పురుగు నివారణ ఏమిటి? | Cotton, Pest |
| వేరుశనగకు ఎంత నీరు పెట్టాలి? | Groundnut, Irrigation |
| రేపు వర్షం పడుతుందా? | Weather |
| పంట బీమా ఎలా తీసుకోవాలి? | Scheme |
| ఈ వారం పిచికారీ చేయవచ్చా? | Spraying |

## Hindi
| Say | Expected tags |
|---|---|
| धान में कौन सी खाद डालें? | Paddy, Fertilizer |
| मिर्च में थ्रिप्स कैसे रोकें? | Chilli, Pest |
| कपास में गुलाबी सुंडी का इलाज क्या है? | Cotton, Pest |
| मूंगफली में कितनी सिंचाई करें? | Groundnut, Irrigation |
| कल बारिश होगी क्या? | Weather |
| फसल बीमा कैसे कराएं? | Scheme |
| क्या आज छिड़काव कर सकते हैं? | Spraying |

## English and mixed speech
| Say | Expected tags |
|---|---|
| What fertilizer should I use for paddy? | Paddy, Fertilizer |
| How do I control thrips in chilli? | Chilli, Pest |
| Paddy ki urea entha veyyali | Paddy, Fertilizer |
| Mirchi mein thrips ka dawai batao | Chilli, Pest, Spraying |

## Tips for good recognition
- Sit in a quiet place and hold the laptop mic 20-30 cm from your mouth.
- Say the whole sentence, not single words.
- Use the same Chrome tab; allow the microphone once and it stays allowed.
- If Smart voice is slow, check your internet. If it fails, switch to **Browser voice** and choose the language yourself.
- Write down any phrase that is misheard. Show the list in your report as "limitations and future work".

## How the keyword layer works (for viva)
1. Gemini hears the audio and returns a transcript in the original script.
2. `analyzeKeywords()` in `app.js` matches Telugu, Hindi and English words against a dictionary (crops, fertilizer, pests, diseases, spraying, irrigation, weather, schemes, market).
3. If exactly one crop is spoken, the crop selector updates automatically.
4. The same glossary is sent to the AI in the system prompt (`GLOSSARY` in `main.py`), so local words such as "తామర పురుగు" are understood as thrips.
5. Short weather questions are answered instantly from live weather data, without using AI quota.
