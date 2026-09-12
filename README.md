# Axat Study Zone — Modular Structure

Yeh wahi app hai (same look, same features — dashboard, CBT-style test runner,
timer, analytics, solutions), bas ab **6 folders/files me split** hai instead
of ek 8400-line HTML file.

```
axat-study-zone/
├── index.html              ← sirf structure (HTML), koi CSS/data/logic nahi
├── css/
│   └── style.css           ← saari styling yahin
├── js/
│   ├── data-loader.js       ← sirf fetch karta hai, kabhi crash nahi karta
│   └── app.js               ← central controller: navigation + exam engine
└── data/
    ├── manifest.json        ← saari exam categories + sub-levels (tree)
    ├── jmi/
    │   ├── index.json        ← is folder ke tests ki list (auto-discovery)
    │   ├── jmi-1.json
    │   ├── jmi-2.json
    │   └── jmi-3.json
    ├── drdo/
    │   ├── index.json
    │   ├── drdo-1.json
    │   └── drdo-2.json
    ├── class-6/
    │   ├── index.json
    │   └── school-6-1.json
    └── class-7/, class-11/, class-12/, entrance/du/, bhu/, iocl/, isro/
        └── index.json (khaali "[]" — abhi koi test nahi, "coming soon" dikhega)
```

## ⚠️ Zaroori: local server chahiye

Browser security ki wajah se `fetch()` seedhe `file://` se JSON nahi padh
paata. Isliye `index.html` ko **double-click karke mat kholna** — ek chhota
local server chalao us folder ke andar:

```bash
cd axat-study-zone
python3 -m http.server 8000
```

Phir browser me `http://localhost:8000` kholo. (Kisi bhi hosting — Netlify,
GitHub Pages, Vercel — par upload karoge to yeh automatically theek chalega,
sirf apne computer par plain double-click se nahi.)

## Naya test add karna (sabse common kaam)

1. `data/<subCatId>/` folder me ek nayi `.json` file banao (jaise `jmi-4.json`),
   isi format me:
   ```json
   {
     "id": "jmi-4",
     "title": "JMI Entrance B23 Test 4",
     "timeMins": 60,
     "badgeText": "NEW",
     "badgeClass": "badge-new",
     "questions": [
       { "id": 1, "section": "Reasoning", "question": "2+2=?",
         "options": { "A": "3", "B": "4", "C": "5", "D": "6" }, "correct": "B" }
     ]
   }
   ```
   Sirf `id`, `section`, `question`, `options`, `correct` zaroori hain har
   question me — `marks`, `timeAvg`, `rightPct`, `explanation` optional hain,
   automatically default ho jaate hain (jaise pehle the).
2. Us folder ke `index.json` me ek line add karo:
   ```json
   { "id": "jmi-4", "file": "jmi-4.json", "title": "JMI Entrance B23 Test 4",
     "timeMins": 60, "badgeText": "NEW", "badgeClass": "badge-new",
     "questionCount": 1, "maxMarks": 1.0 }
   ```
   (`questionCount` aur `maxMarks` sirf list-card par dikhane ke liye hain —
   inhe apni questions array ke hisab se bhar do.)

**Bas.** `app.js` ya `index.html` ko touch karne ki zaroorat nahi.

## Naya exam / naya sub-level add karna

Sirf `data/manifest.json` edit karo — ek naya category object (jaise `"ssc"`)
ya kisi existing category me ek naya `subCategories` entry (jaise `"cgl"`)
add karo, aur us naye `id` ke naam ka folder `data/<id>/` bana kar usme
`index.json` daal do (khaali `[]` bhi chalega, "coming soon" dikhega).
Koi bhi JS file edit nahi karni padti.

## Fail-safe kaise kaam karta hai

- Agar `manifest.json` hi missing/broken ho → poori app ek clean
  "Content Not Available" screen dikhati hai, red browser error nahi.
- Agar kisi sub-category ka `index.json` missing ho ya khaali ho →
  us section me "Upcoming Mock Tests will be added soon!" dikhta hai.
- Agar koi test file corrupt/missing ho jab user "Start Test" dabaye →
  fail-safe screen dikhta hai, poora app crash nahi hota.

Sab kuch `js/data-loader.js` ke `safeFetchJSON()` se guzarta hai, jo kabhi
`throw` nahi karta — hamesha `{ ok, data, error }` return karta hai.

## Instructions screen (naya) — "Start Test" ke baad, exam se pehle

Ab `startMock()` seedha exam shuru nahi karta — pehle ek Instructions +
Language screen dikhata hai. Do hisse hain:

1. **Summary block** (Questions / Total Marks / Duration) — yeh kabhi
   hand-typed nahi hota, `rawQuizData` se hi live calculate hota hai. Isme
   kabhi drift nahi ho sakta.
2. **Rules list** — `data/default-instructions.json` ke generic rules +
   (agar hai to) us test ki apni JSON me `"instructions": [...]` field ke
   extra lines, dono jode jaate hain. Matlab custom instructions default ko
   **replace nahi karte, uske upar add hote hain**.

Naya test ke liye extra instructions dene ke liye, us test ki `.json` me
bas ek field add karo:
```json
{
  "id": "jmi-4",
  "title": "...",
  "instructions": [
    "Is test me Section-B optional hai, sirf best 3 attempt count honge."
  ],
  "questions": [ ... ]
}
```
Field na ho to sirf default rules dikhenge — kuch aur karne ki zaroorat nahi.

## Language toggle (English / हिंदी)

Instructions screen par ek language toggle bhi hai. Abhi ke liye:
- Sirf UI level par kaam karta hai — agar kisi question me `question_hi`,
  `options_hi`, `explanation_hi` fields nahi hain, to Hindi select karne par
  bhi English hi dikhega (fail-safe fallback, blank kabhi nahi).
- Bilingual test banane ke liye, question object me yeh extra fields daal do:
  ```json
  {
    "id": 1,
    "question": "2+2=?",
    "question_hi": "2+2=?",
    "options": { "A": "3", "B": "4", "C": "5", "D": "6" },
    "options_hi": { "A": "३", "B": "४", "C": "५", "D": "६" },
    "correct": "B",
    "explanation": "...",
    "explanation_hi": "..."
  }
  ```
  Jitne questions me `_hi` fields hongi, utne hi bilingual honge — baaki
  automatically English pe fallback ho jaate hain. Test-by-test, question-by-
  question incrementally add kar sakte ho.

## Aage kya add ho sakta hai

- **Mode tier** (Mock Test vs Notes) — abhi sirf Mock Test flow hai.
- Actual Hindi translations un questions me jo abhi sirf English hain.
