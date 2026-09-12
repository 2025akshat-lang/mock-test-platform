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

## Aage kya add ho sakta hai (abhi is split me nahi hai)

Aapke message me kuch cheezein mention hui thi jo abhi original file me bhi
nahi thi (naya feature hoga, sirf split nahi):
- **Mode tier** (Mock Test vs Notes) — abhi sirf Mock Test flow hai.
- **Instructions page** aur **Hindi/English language choice** test start
  karne se pehle.

Agar yeh chahiye to bata dena — manifest/data structure already isko
accommodate karne layak bana hai (`mode` field add karke), bas UI screen aur
routing add karni hogi.
