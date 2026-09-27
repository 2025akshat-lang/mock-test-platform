# Axat Study Zone — Modular Structure
https://2025akshat-lang.github.io/mock-test-platform/
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

## Maths formulas (LaTeX) aur diagrams (SVG) — Science/Maths/Engineering tests ke liye

Code kahin nahi likhna — bas apni `.json` file me text ke andar hi likh do,
rendering automatic hai (KaTeX `index.html` me already jud chuka hai):

- **LaTeX**: `question`, har `options` value, aur `explanation` — teeno me
  seedha LaTeX likh sakte ho. Inline formula ke liye `$...$` use karo, apni
  line pe bade/centered formula ke liye `$$...$$`:
  ```json
  {
    "id": 2, "section": "Physics",
    "question": "The kinetic energy of a body is given by $KE = \\frac{1}{2}mv^2$. If mass is doubled and velocity is halved, the new KE is:",
    "options": { "A": "Same as before", "B": "Half of before", "C": "$\\frac{1}{4}$ of before", "D": "Double of before" },
    "correct": "B",
    "explanation": "$$KE_{new} = \\frac{1}{2}(2m)\\left(\\frac{v}{2}\\right)^2 = \\frac{1}{2}mv^2 \\times \\frac{1}{2}$$ so it becomes half."
  }
  ```
  Backslash ko JSON me hamesha `\\` likhna (double backslash) — `\frac` ban
  jaata hai `\\frac` JSON string ke andar.

- **Diagrams (SVG)**: question object me ek naya optional field `diagram`
  add karo, uske andar raw `<svg>...</svg>` markup as a string. Yeh question
  ke text aur options ke beech me apne aap dikh jaata hai (practice screen
  aur solution detail screen dono me):
  ```json
  {
    "id": 3, "section": "Maths",
    "question": "In the triangle shown, find the value of $x$.",
    "diagram": "<svg viewBox='0 0 200 120' width='200' height='120'><polygon points='10,110 190,110 100,10' fill='none' stroke='#0f172a' stroke-width='2'/><text x='95' y='105' font-size='12'>x°</text></svg>",
    "options": { "A": "40", "B": "50", "C": "60", "D": "70" },
    "correct": "C"
  }
  ```
  Agar diagram nahi chahiye to field ko chhod do — bilkul optional hai.

**Koi JS/HTML edit nahi karni** — dono cheezein sirf `data/**/*.json` ke text
se chalti hain.

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





ab notes wale secton a code ayegaa 
# 📝 PrepZone Notes Engine — Complete Architecture & Data Guide

> **Ye file kis liye hai:** Ye poore Notes section (History/Polity/Chemistry/etc. wala part) ka
> complete kaccha-chittha hai. Isko padhkar koi bhi insaan (ya AI) turant samajh jayega ki:
> 1. Data kaise add/edit karna hai (bina code chhue)
> 2. Naya feature add karna ho to kaunsa function touch karna hai
> 3. Kya cheezein kabhi nahi todni chahiye (mock-test se isolation)
>
> Jab bhi is architecture mein koi bada badlaav karo, is file ko bhi update kar dena —
> ye "living document" hai, ek baar likh ke bhool jaane wali file nahi.

---

## 1. Golden Rule — Isolation

Ye poora Notes system **sirf 3 files** mein rehta hai:

```
js/notes-loader.js          <- saara logic (sirf isi file mein JS likhna)
css/notes.css                <- sirf isi file mein notes-panel ki styling
data/notes/**                <- saara content (JSON files)
```

Mock-test wale `js/app.js` aur `js/data-loader.js` ko **kabhi touch nahi karna** — sirf
inn 3 jagah pe kaam hota hai. Agar kabhi lage ki app.js mein kuch badalna zaroori hai, to
pehle 2 baar sochna, aur sirf woh 1-2 line badalna jo notes-panel switch hook mein hai
(`NotesEngine.subjectIndexData` / `renderChapterShells()` wala part) — baaki kuch nahi.

---

## 2. Folder Structure (poora naksha)

```
data/notes/
├── manifest.json                          <- ROOT: exam categories + subjects list
├── govt-exam/
│   └── gs/
│       ├── index.json                     <- LIGHT: is subject ke chapters ki list
│       ├── history.json                   <- ek chapter ka poora data
│       ├── polity.json
│       └── geography.json
└── psu-chemistry/
    ├── index.json
    ├── physical.json
    ├── organic.json
    └── instrumentation.json
```

**Rule of thumb:** Naya EXAM CATEGORY (jaise "PSU" ke bagal mein "Banking Exams") →
`manifest.json` mein add karo + naya folder banao.
Naya SUBJECT (jaise GS ke bagal mein "Maths") → us exam-category ke `index.json` mein
naya chapter add karne jaisa hi hai — bas naya subject entry banega.
Naya CHAPTER (jaise Economics) → ek nayi `.json` file banao + subject ke `index.json` mein
ek line add karo.

---

## 3. Data ka 4-level hierarchy

```
manifest.json
  └── exam_category (e.g. "Govt Exams")
        └── subject (e.g. "GS Repository")   → apna index.json
              └── chapter (e.g. "History")    → apni chapter.json
                    └── [OPTIONAL] section/era (e.g. "Modern History")
                          └── topic (e.g. "1857 Revolt")
                                └── note (e.g. "Causes of 1857 Revolt")
```

`section` level **optional** hai — sirf tab use karo jab chapter ke andar ek aur
sub-division chahiye ho (jaise History → Ancient/Medieval/Modern). Agar chapter seedha
topics mein bant sakta hai (jaise Polity, Geography abhi hain), to section skip kar do.

---

## 4. manifest.json — kaise likhein

```json
{
  "exam_categories": [
    {
      "name": "Govt Exams (SSC / RRB / UPSC / TGT)",
      "subjects": [
        { "name": "GS Repository", "index": "data/notes/govt-exam/gs/index.json" }
      ]
    }
  ]
}
```
- Naya subject add karna ho → `subjects` array mein ek naya `{ "name": ..., "index": ... }` daalo.
- `index` field mein wahi path likho jahan us subject ka `index.json` rakha hai.

---

## 5. Subject index.json — kaise likhein

```json
{
  "chapters": [
    { "id": "history", "title": "History", "file": "data/notes/govt-exam/gs/history.json" }
  ]
}
```
- Naya chapter add karna ho → array mein ek naya `{ "id", "title", "file" }` daalo, aur
  wahi naam ki ek nayi `.json` file bana do us path pe.
- `id` **unique** hona chahiye is subject ke andar (isi se HTML element IDs banti hain).

---

## 6. Chapter JSON — do formats, dono support hain

### Format A — FLAT (jab chapter ko sub-division nahi chahiye)
```json
{
  "chapter_title": "Polity",
  "filters": [
    { "label": "🟣 Amendments", "tag": "amendment" }
  ],
  "topics": [ /* topics array — niche dekho */ ]
}
```

### Format B — NESTED (jab chapter ko era/section chahiye, jaise History)
```json
{
  "chapter_title": "History",
  "sections": [
    {
      "id": "ancient",
      "title": "Ancient History",
      "topics": []
    },
    {
      "id": "modern",
      "title": "Modern History",
      "filters": [ /* yahan filters daalo, sirf isi section pe lagenge */ ],
      "topics": [ /* topics array */ ]
    }
  ]
}
```

**Kaise decide karein kaunsa format use karein:**
- Agar chapter ke andar tumhe koi natural bada division dikh raha hai jismein har division
  ke apne alag "quick filter tags" honge → Format B (`sections`).
- Agar sab topics ek hi flow mein chalte hain, koi extra grouping nahi chahiye → Format A
  (`topics` seedhe chapter ke andar).
- `filters` **kabhi bhi optional** hai — jahan nahi chahiye, wahan bas ye key hi mat likho.

---

## 7. Topic object — kaise likhein

```json
{
  "topic_id": "modern-1857",
  "topic_title": "1857 Revolt",
  "notes_list": [ /* note objects — niche dekho */ ]
}
```
- `topic_id` unique hona chahiye us chapter/section ke andar.
- `notes_list` ek array hai — ek topic ke andar 1 ya usse zyada notes ho sakte hain.

---

## 8. Note object — poora field reference (SABSE IMPORTANT TABLE)

```json
{
  "id": "h001",
  "title": "Causes of 1857 Revolt",
  "tags": ["rebellion", "modern"],
  "basic_overview": "Ye normal scroll mein sabko dikhega...",
  "has_extra_info": true,
  "extra_info_btn_color": "#dc2626",
  "extra_info_content": "Ye sirf ||| button dabane par khulega..."
}
```

| Field                    | Zaroori? | Kya karta hai |
|--------------------------|----------|----------------|
| `id`                     | Haan     | Unique ID (button/toggle ke liye). Suggestion: prefix use karo — `h001` (history), `p001` (polity), `phy001` (physical chem) — taaki kabhi clash na ho |
| `title`                  | Haan     | Note ka heading, bold dikhta hai |
| `tags`                   | Nahi     | Array of strings. Agar chapter/section mein `filters` defined hai to unke `tag` se yahan match karna chahiye |
| `basic_overview`         | Haan     | Har user ko seedha dikhne wala plain text/paragraph |
| `has_extra_info`         | Nahi (default false) | `true` karo to ek colored `\|\|\|` button dikhega jo tap karne par extra box khole |
| `extra_info_btn_color`   | Nahi     | Hex color code, jaise `#7c3aed`. Agar na do to default `#2563eb` (blue) use hoga |
| `extra_info_content`     | `has_extra_info: true` ho to zaroori | Ye text hidden rehta hai jab tak button tap na ho |

**Important:** `basic_overview` aur `extra_info_content` mein agar tumhe safe HTML
(jaise `<b>`, `<i>`, ya `<img src="...">`) daalna ho to daal sakte ho — jab `DOMPurify`
CDN se load ho chuka hai (internet on ho), ye safely render hoga (script/onclick jaise
khatarnak cheezein hata dega, baaki normal tags allow karega). **Lekin** agar internet na
ho aur DOMPurify load na ho paye, to fallback mode sirf plain text dikhayega (HTML tags
bhi text ki tarah dikh jayenge) — is wajah se best practice: zaroori na ho to HTML tags
mat daalo, plain text hi safe hai.

---

## 9. Step-by-step recipes (copy-paste karke follow karo)

### 🅰️ Sirf ek naya NOTE add karna hai (kisi existing topic mein)
1. Us chapter ki `.json` file kholo (jaise `history.json`)
2. Jis topic ke `notes_list` array mein daalna hai, wahan ek naya `{ ... }` object daalo
   (upar wala Section 8 ka format copy karo)
3. Bas — koi JS change nahi chahiye. Save karo, refresh karo.

### 🅱️ Naya TOPIC add karna hai (naya sub-heading, jaise "Quit India Movement")
1. Chapter/section ke `topics` array mein ek naya object daalo:
```json
{
  "topic_id": "modern-quit-india",
  "topic_title": "Quit India Movement (1942)",
  "notes_list": [ /* ek ya zyada notes */ ]
}
```

### 🅲️ Naya CHAPTER add karna hai (jaise "Economics")
1. `data/notes/govt-exam/gs/economics.json` naam ki nayi file banao
2. Uske andar Format A (flat) ya B (nested) mein poora structure likho
3. Us subject ke `index.json` mein ek line add karo:
```json
{ "id": "economics", "title": "Economics", "file": "data/notes/govt-exam/gs/economics.json" }
```
4. Bas — koi JS change nahi. NotesEngine automatically naya accordion bana dega.

### 🅳️ Naya SUBJECT add karna hai (jaise "Maths for PSU")
1. Naya folder + `index.json` banao (Section 5 ka format)
2. Root `manifest.json` ke sahi `exam_category` ke `subjects` array mein ek entry add karo

### 🅴️ Naye FILTER TAGS add karne hain (jaise Polity mein "Amendments" filter)
1. Us chapter/section ke JSON mein `"filters": [ { "label": "...", "tag": "..." } ]` daalo
2. Jin notes pe ye tag lagana hai, unke `tags` array mein wahi `tag` value daal do
3. Bas — filter bar automatically ban jayega, koi JS change nahi

---

## 10. Function reference (jab code mein hi kuch badalna ho)

| Function | Kya karta hai | Kab touch karo |
|---|---|---|
| `init()` | App boot hone par sirf `manifest.json` fetch karta hai | Kabhi nahi (stable) |
| `renderExamCategories()` | Level 1 view — exam categories + subjects grid | Sirf agar level-1 card ka look badalna ho |
| `loadSubject(indexPath, name)` | Subject ka light `index.json` fetch karta hai | Kabhi nahi (stable) |
| `renderChapterShells()` | Chapter accordions ke sirf **khaali headers** banata hai (content baad mein aata hai) | Chapter-header ka look badalna ho to |
| `toggleChapter(chapterId, file)` | Chapter khulte hi uski `.json` file **pehli baar** fetch + cache karta hai | Kabhi nahi (stable) — ye hi lazy-loading ka core hai |
| `renderChapterBody(chapterId)` | Decide karta hai FLAT hai ya NESTED (sections), aur accordingly render karta hai | Agar koi teesra format (naya nesting level) chahiye ho |
| `_renderFilterAndTopics(key, topics, filters, query)` | Filter-bar + topics + notes ka **poora HTML** banata hai (reusable — chapter aur section dono ke liye same function) | Note-card ka look/style badalna ho, ya note field add/remove karna ho |
| `setChapterFilter(key, tag)` | Jab koi filter button tap ho, active tag set karta hai aur re-render karta hai | Kabhi nahi (stable) |
| `toggleTopic(key)` | Kisi bhi accordion (topic ya section) ko khol/band karta hai | Kabhi nahi — ye generic hai, sab jagah reuse hota hai |
| `toggleExtraInfo(event, noteKey)` | `\|\|\|` button dabane par extra-info box khol/band karta hai | Kabhi nahi (stable) |
| `_safe(html)` | DOMPurify available ho to sanitize, warna plain-escape fallback | Kabhi nahi (stable, safety-net hai) |
| `_bindSearchInput()` | Search box pe 200ms debounce laga ke listener bandhta hai (sirf ek baar) | Kabhi nahi |
| `_rerenderOpenChapters()` | Jab search type ho, sirf khule/cached chapters ko refresh karta hai | Kabhi nahi |

---

## 11. Naya FEATURE add karna ho — kahan dekhna hai

- **Naya visual/animation/emoji-icon chahiye kisi card pe** → `_renderFilterAndTopics()`
  ke andar jahan HTML template-string bana hai, wahi jagah hai styling change karne ki.
  Style hamesha inline (`style="..."`) rakhna, taaki `notes.css` chota aur simple rahe.
- **SVG add karna hai kisi note ke andar** → `basic_overview` ya `extra_info_content`
  ke andar seedha `<svg>...</svg>` markup bhi daal sakte ho (Section 8 ka DOMPurify wala
  note padho) — ya ek naya optional field jaise `"diagram_svg": "<svg>...</svg>"` bana ke
  `_renderFilterAndTopics` mein ek naya `${note.diagram_svg || ''}` line add karo.
- **Naya interactive widget (jaise flashcard-flip, quiz)** → best practice: naya function
  banao (jaise `renderFlashcard(note)`), aur note object mein ek naya optional field jaise
  `"note_type": "flashcard"` daal ke `_renderFilterAndTopics` ke andar branch karo — taaki
  purane plain notes bilkul waise hi chalte rahein.
- **Naya nesting level chahiye ho (4-level deep)** → same pattern jo `sections` mein use
  hua hai wahi repeat karo (ek naya array + ek naya accordion wrapper + recursive-jaisi
  call to `_renderFilterAndTopics`).

---

## 12. Performance rules (mat bhoolna)

1. **Ek chapter = ek file, aur file zyada bada mat karo.** Agar ek chapter ka data bahut
   bada ho raha hai (jaise pura GS ka Static GK), usko aur chhote chapters mein tod do
   (jaise "Static GK — Awards", "Static GK — Books" alag files) — isse loading fast rahega.
2. **Chapter data sirf ek baar fetch hota hai** — pehli baar accordion khulne par. Uske
   baad `chapterCache` object mein store rehta hai, dobara fetch nahi hota. Isliye agar
   koi JSON file edit karo, to browser **hard refresh** (Ctrl+Shift+R) karna padega,
   warna purana cached data hi dikhta rahega.
3. Search sirf **already-opened chapters** ke andar kaam karta hai (jo cache mein aa chuke
   hain). Agar koi chapter kabhi khola hi nahi, uske notes search mein nahi aayenge jab
   tak user usko ek baar khole.

---

## 13. Troubleshooting checklist (jo abhi tak face kiya hai)

1. **"Notes data could not be loaded"** → path spelling mismatch check karo
   (`govt-exam` vs `govt-exams` jaisi galti). Folder naam aur JSON ke andar likha path
   character-by-character match hona chahiye.
2. **"Loading…" pe hamesha ke liye ruk gaya** → browser Console (F12) kholo, exact error
   dekho. Common cause: internet band hone se CDN (`DOMPurify`/`MathJax`) load nahi hua.
3. **JSON edit karne ke baad kuch nahi badla** → hard refresh karo (cache ki wajah se).
4. **Naya JSON likhne se pehle** kisi bhi online "JSON validator" mein paste karke check
   kar lo — ek missing comma/bracket poori file todh deta hai.

---

## 14. Isko kisi bhi AI ko dene ka tarika

Agar future mein kisi aur AI (ya mujhe hi naye conversation mein) se madad chahiye ho, to
bas ye 3 cheezein do:
1. Ye poori MD file
2. `js/notes-loader.js` ki current copy
3. Jis chapter/subject mein kaam karwana hai uski `.json` file (ya nayi banwani ho to
   sirf ye MD file kaafi hai)

Isse wo AI bina kuch dobara poochhe seedha samajh jayega ki architecture kya hai, format
kya hai, aur kya-kya touch karna safe hai.
