
# Akshat Study Zone — Project Architecture & Maintenance Guide

**Project URL:** https://2025akshat-lang.github.io/mock-test-platform/

**Project Type:** Modular Mock Test, Educational Notes, and Daily Highlights Web Application

**Documentation Status:** Living Document — last updated 2026-10-01

**Primary Objective:** Maintain a stable, modular, and fail-safe educational platform where every feature can be independently maintained, debugged, updated, or detached without breaking other features.

---

## 1. Aim

To develop a modular educational platform that provides:

- Examination-oriented mock tests.
- Subject-wise educational notes and study materials.
- Daily historical events, national personalities, anniversaries, and quotations.
- A dedicated system for future government job updates.
- A clearly identifiable section for upcoming application features.

The project prioritizes **modularity, stability, performance, maintainability, and a clean user interface.**

---

## 2. Objectives

1. Keep every major feature independent wherever possible.
2. Separate application logic, styling, and content data.
3. Allow content updates through JSON files without modifying JavaScript.
4. Prevent failures in one module from affecting unrelated modules.
5. Keep `index.html` limited to the application shell and module integration.
6. Avoid unnecessary shared state, duplicate code, and global dependencies.
7. Maintain responsive layouts and smooth rendering on desktop and mobile devices.
8. Make the project structure understandable to future developers and AI assistants.

---

## 3. Core Architecture

The application is organized into independent functional modules.

| Module | Responsibility |
|---|---|
| Mock Test Engine | Test navigation, question rendering, timers, submission, and analysis |
| Notes Engine | Subject navigation, chapters, topics, filters, and educational content |
| Daily Highlights | Date-based events, notifications, and daily quotations |
| Ice Cream UI | Header icon and associated interactions |
| Ice Cream Background Animation | Background animation effects |
| Exam Updates | Future government job and examination notifications |
| Next Update | Future feature announcements |

### Golden Rule — Module Isolation

Each module should manage its own logic, data, styling, and state wherever possible.

The application shell must act as a **switchboard**, not as the controller of individual feature logic.

A module must not directly modify another module's internal state unless a clearly defined integration interface requires it.

---

## 4. Project Folder Structure

The following tree represents the major folders and files. It is not a complete listing of every JSON file in the repository.

```text
axat-study-zone/
│
├── index.html
│   └── Main application shell and module imports
│
├── css/
│   └── style.css
│       └── Global application styling
│
├── js/
│   ├── app.js
│   │   └── Mock Test Engine and navigation
│   │
│   ├── data-loader.js
│   │   └── Safe JSON loading for mock tests
│   │
│   ├── notes-loader.js
│   │   └── Notes Engine (v6.1): rendering, box UI, lazy topic files, search, quick-jump
│   │
│   ├── daily-highlight.js
│   │   └── Daily Highlights notification logic
│   │
│   ├── icecream-loader.js
│   │   └── Header ice cream icon and UI
│   │
│   └── icecream-bg-animation.js
│       └── Background animation effects
│
├── data/
│   │
│   ├── manifest.json
│   │   └── Mock Test categories and subcategories
│   │
│   ├── default-instructions.json
│   │   └── Default examination instructions
│   │
│   ├── exam-updates.json
│   │   └── Reserved data for future government job updates
│   │
│   ├── daily-highlights/
│   │   ├── calendar.json
│   │   │   └── Date-to-event mapping
│   │   │
│   │   ├── quotes.json
│   │   │   └── Daily quotation fallback
│   │   │
│   │   └── entries/
│   │       └── Individual event JSON files
│   │
│   ├── notes/
│   │   ├── manifest.json
│   │   │   └── Notes categories and subject references
│   │   │
│   │   ├── govt-exam/
│   │   │   ├── english/
│   │   │   ├── gs/
│   │   │   ├── hindi/
│   │   │   └── maths/
│   │   │
│   │   └── psu-chemistry/
│   │       ├── applied/
│   │       ├── inorganic/
│   │       ├── instrumental/
│   │       └── organic/
│   │           ├── oindex.json            (organic subject index = chapter list)
│   │           ├── steriochemistry.json   (chapter, still a single file)
│   │           └── name-reaction/         (folder name is SINGULAR)
│   │               ├── chapter.json       (sections + topic list, each topic has a "file")
│   │               └── topics/            (108 files, one JSON per topic)
│   │
│   ├── drdo/
│   ├── du/
│   ├── iocl/
│   ├── isro/
│   ├── jmi/
│   ├── class-6/
│   ├── class-7/
│   ├── class-11/
│   ├── class-12/
│   └── entrance/
│       └── Additional examination data folders
│
└── README.md
    └── Project documentation and maintenance guide
```

**Important:** The tree is a representative outline. Existing folder names, nested directories, and file paths must be verified against the actual repository before modifying code. Paths inside JSON are case-sensitive and must match the real folder names exactly (e.g. `name-reaction`, not `name-reactions`).

---

## 5. Menu and Panel Organization

### 5.1 Mock Tests

**Purpose:** Provide examination-oriented practice and assessment.

Main responsibilities:

- Examination category and subcategory navigation.
- Test listing and instructions.
- Question navigation and answer selection.
- Timer management and test submission.
- Previous attempts, analytics, and solutions.

**Core files:**
- `js/app.js`
- `js/data-loader.js`
- `data/manifest.json`
- Examination-specific JSON files under `data/`

**Isolation Rule:** The Mock Test Engine must not depend on Notes Engine logic.

### 5.2 Notes

**Purpose:** Provide structured educational content organized by examination category, subject, chapter, section, topic, and individual note.

Main responsibilities:

- Subject and chapter navigation (plain bold "box button" cards, no folder icons).
- Lazy loading and caching of chapter data and of individual topic files.
- Search (across the whole open subject) and tag filters.
- Quick-jump dropdowns (Subject → Chapter → Section → Topic).
- Expandable topics, extra-info panel (the coloured `|||` button) and optional SVG diagrams.

**Core files:**
- `js/notes-loader.js` (styles for the box UI are injected by this file itself)
- `data/notes/`

**Isolation Rule:** Notes functionality must remain independent of the Mock Test Engine.

### 5.3 Daily Highlights

**Purpose:** Display date-specific historical events, national personalities, anniversaries, and educational quotations.

Main responsibilities:

- Identify the current date.
- Find matching events in `calendar.json`.
- Load one or multiple event JSON files.
- Display a quotation when no event is available.
- Render event illustrations and notification content.

**Core files:**
- `js/daily-highlight.js`
- `data/daily-highlights/calendar.json`
- `data/daily-highlights/quotes.json`
- `data/daily-highlights/entries/`

### 5.4 Ice Cream UI

**Purpose:** Provide the ice cream icon in the header and its associated background animation.

| File | Responsibility |
|---|---|
| `js/icecream-loader.js` | Icon initialization and UI interactions |
| `js/icecream-bg-animation.js` | Background animation effects |

Both modules should remain independent of the Mock Test and Notes engines.

### 5.5 Exam Updates

**Purpose:** Maintain a dedicated data source for future government job and examination notifications.

**Data file:** `data/exam-updates.json`

The planned content may include recruitment announcements, application dates, examination schedules, admit cards, results, and official notification links.

The complete interface and rendering logic will be defined in a future update.

### 5.6 Next Update

**Purpose:** Provide a fixed location in the application where visitors can identify upcoming features and improvements.

The planned section should:

1. Display the next update's title.
2. Show a short description of the planned feature.
3. Keep update content separate from existing panel logic.
4. Allow future announcements to be changed without modifying the Mock Test or Notes engines.

The exact data format and rendering logic will be finalized when the feature is implemented.

---

## 6. Daily Highlights — Data Architecture

The Daily Highlights system uses a date-based lookup structure.

### 6.1 Calendar Mapping

**File:** `data/daily-highlights/calendar.json`

The calendar maps a date in `MM-DD` format to one or more event JSON filenames.

Example:

```json
{
  "01-01": ["new-year.json"],
  "08-13": ["world-organ-donation-day.json"],
  "10-02": ["gandhi.json", "some-other-event.json"]
}
```

**Rules:**

- Use `MM-DD` as the date key.
- Store event filenames as an array.
- Multiple events on the same date must be supported.
- Event filenames must match the files inside `entries/`.

### 6.2 Event Entries

**Folder:** `data/daily-highlights/entries/`

Each event is stored in a separate JSON file.

Example:

```text
data/daily-highlights/entries/
├── gandhi.json
├── world-organ-donation-day.json
├── republic-day.json
├── independence-day.json
└── ...additional event files
```

The event JSON contains the event's title, description, date-related information, and any supported illustration or SVG content.

**Current Content:** Approximately 75 individual event JSON files are present. The collection will be expanded in future updates.

### 6.3 Daily Quotations

**File:** `data/daily-highlights/quotes.json`

When a date has no matching event in `calendar.json`, the system uses a quotation as a fallback.

If the quotation file is missing or malformed, the notification panel must display a graceful empty state instead of crashing.

### 6.4 Event Rendering Workflow

```text
Current Date
     ↓
Read calendar.json
     ↓
Find matching MM-DD entry
     ↓
Load associated event JSON file(s)
     ↓
Render valid event notifications
     ↓
If no valid event is available, load a quotation
     ↓
If no quotation is available, display an empty state
```

### 6.5 Multiple Events on One Date

The system must support multiple event files for a single date.

Example:

```json
{
  "10-02": [
    "gandhi.json",
    "some-other-event.json"
  ]
}
```

Each event must be processed independently.

A missing or corrupt event file must not prevent other valid events from appearing.

### 6.6 Adding a New Event

1. Create a new event JSON file inside `data/daily-highlights/entries/`.
2. Add its filename to the appropriate date in `calendar.json`.
3. If the date already has an event, append the new filename to the array.
4. Validate the JSON syntax and filename.
5. Refresh the application and verify the notification.

No JavaScript changes should be required for a standard event addition.

---

## 7. Notes Engine — Data Architecture

The Notes Engine uses a hierarchical data structure. Each level is loaded only when needed.

```text
data/notes/manifest.json                      (exam categories -> subjects)
    └── <subject>/<index file>                (e.g. organic/oindex.json = chapter list)
          └── Chapter file                    (e.g. name-reaction/chapter.json)
                └── Section (optional)
                      └── Topic  ──"file"──►  topics/<topic>.json   (loaded when the topic is opened)
                            └── Note (with optional diagram)
```

### 7.1 Exam Categories

**File:** `data/notes/manifest.json`

Defines examination categories and their subjects. Each subject's `"index"` must point to the exact index file name that exists in the repository (organic uses `oindex.json`, not `index.json`).

### 7.2 Subjects

Each subject has its own directory and an index file listing its chapters:

```json
{ "chapters": [
  { "id": "namereaction", "title": "Name Reaction",
    "file": "data/notes/psu-chemistry/organic/name-reaction/chapter.json" }
] }
```

Subject directories:

- `data/notes/govt-exam/gs/`, `english/`, `hindi/`, `maths/`
- `data/notes/psu-chemistry/applied/`, `inorganic/`, `instrumental/`, `organic/`

### 7.3 Chapter Data

A chapter is either:

- **Flat format:** `topics` directly inside the chapter.
- **Nested format:** `sections`, each with its own `filters` and `topics`.

### 7.4 Topic Data — two supported forms

**A) Topic in its own file (preferred for large chapters).** In `chapter.json`:

```json
{ "topic_id": "nr-cc-01", "topic_title": "Aldol Condensation",
  "file": "data/notes/psu-chemistry/organic/name-reaction/topics/nr-cc-01-aldol-condensation.json" }
```

The topic file contains:

```json
{ "topic_id": "nr-cc-01", "topic_title": "Aldol Condensation", "notes_list": [ /* notes */ ] }
```

It is fetched the first time the topic is opened (or when a search needs it) and then cached.

**B) Inline topic (older style, still supported):** `notes_list` written directly inside the chapter file. A topic with no `notes_list` but with its own `basic_overview` is treated as a single note.

### 7.5 Note Fields

| Field | Purpose |
|---|---|
| `id`, `title`, `tags` | Identity, heading, filter/search tags |
| `basic_overview` | Always-visible summary text |
| `has_extra_info`, `extra_info_btn_color`, `extra_info_content` | The coloured `|||` panel text |
| `diagram` (optional) | `{ "caption": "...", "svg": "<svg ...>" }`, shown inside the extra-info panel only |

Missing optional fields are never treated as errors. A note with only a `diagram` still gets the `|||` button.

### 7.6 Adding a New Topic or Chapter

1. Create `topics/<topic_id>-<name>.json` with `topic_id`, `topic_title`, `notes_list`.
2. Add one line for it in the right section of `chapter.json` (`topic_id`, `topic_title`, `file`).
3. For a new chapter, create a new folder under the subject, add its `chapter.json`, then add one entry in the subject's index file.
4. No JavaScript change is needed.

### 7.7 Notes Isolation

All Notes-specific functionality must remain inside:

- `js/notes-loader.js`
- `data/notes/`

The Mock Test Engine must not be modified merely to add or update Notes content.

---

## 8. SVG Illustration Guidelines

SVG illustrations may be embedded in Daily Highlights event data and in Notes (`note.diagram.svg`).

### SVG Creation Rules

- Use a self-contained inline `<svg viewBox='0 0 300 150'>...</svg>`.
- Prefer basic shapes: `rect`, `circle`, `ellipse`, `line`, `path`, `polygon`, `text`, and `g`.
- Use a maximum of one simple `linearGradient`.
- Avoid SVG filters such as `feGaussianBlur`, `feDropShadow`, and `feTurbulence`.
- Do not use external images, external fonts, `xlink:href`, or scripts.
- Keep path data simple and hand-drawn rather than using complex traced vector paths.
- If animation is required, use CSS transform and opacity keyframes only.
- Do not animate SVG path data, width, or height.
- Limit animation to approximately 3–5 elements.
- Use single-quoted SVG attributes when embedding SVG inside JSON strings.
- Keep the complete SVG string approximately 3–4 KB or smaller.

### Notes-specific rules

- Notes SVGs are sanitized with DOMPurify (SVG profile) before display; scripts and event attributes are removed.
- Mechanism/structure SVGs should use `viewBox` and stay readable on a phone (about 300–360 units wide).
- A broken SVG shows a small red error box for that note only; a note without a diagram shows nothing extra.

### Performance Considerations

SVG illustrations must remain lightweight.

Animations should use compositing-friendly properties such as `transform` and `opacity` wherever possible.

---

## 9. Fail-Safe and Isolation Rules

The application must remain usable even when an individual module fails.

### Mock Test Engine

- Missing or invalid test data must display a controlled error screen.
- A failed test must not crash the Notes panel.
- JSON loading must use the existing safe-fetch mechanism.

### Notes Engine

- Missing or invalid Notes data must display a controlled error message that shows the file path and the reason (HTTP status or JSON error).
- A broken chapter must not prevent other chapters from loading.
- Every section, topic and note renders inside its own `try/catch`: one bad entry shows a small red box and the rest keeps rendering.
- A topic file that fails to load affects only that topic.
- Notes rendering must remain isolated from Mock Test logic.

### Daily Highlights

- Missing calendar data must not crash the application.
- Missing event files must be handled individually.
- If no valid event is available, attempt to display a quotation.
- If both event and quotation data are unavailable, show a graceful empty state.

### Ice Cream UI

- A failed icon or animation module must not block primary application panels.
- Background animation must not interfere with navigation or input interactions.

### General Rule

Every module should handle its own errors and expose a controlled integration point to the application shell.

---

## 10. Performance and 60 FPS Requirements

**Primary Target:** Smooth interaction and rendering at approximately 60 FPS on supported devices.

A 60 FPS frame budget is approximately 16.7 milliseconds.

### Performance Rules

1. Avoid unnecessary full-page re-rendering.
2. Load large JSON files only when required.
3. Cache data that is reused frequently.
4. Avoid excessive DOM creation and destruction during navigation.
5. Minimize expensive layout recalculations and repeated style changes.
6. Keep background animations lightweight.
7. Avoid running hidden-panel animations or timers unnecessarily.
8. Prevent duplicate event listener registrations.
9. Keep SVG illustrations and animation complexity within the defined limits.
10. Test performance on both desktop and mobile devices.

**Important:** A 60 FPS target is a performance objective, not a guarantee. Actual performance depends on the device, browser, rendering workload, and animation complexity.

Performance-sensitive changes should be measured before release.

---

## 11. Development and Maintenance Rules

All future changes must follow these rules:

1. Do not replace entire files unless explicitly requested. (For `notes-loader.js` the owner explicitly asked for complete ready-to-use files and generated data zips instead of manual patches; other modules still follow this rule.)
2. Identify the exact file, function, or code section requiring modification.
3. Explain the bug or architectural issue before providing the fix.
4. Make the smallest safe change that solves the problem.
5. Do not modify Mock Test files to implement Notes features.
6. Do not modify Notes files to implement Mock Test features.
7. Keep Daily Highlights logic inside its own module.
8. Preserve existing functionality while adding new features.
9. Verify that the modified module works independently.
10. Update this document whenever the architecture changes significantly.

### Debugging Workflow

```text
Identify the issue
      ↓
Create or update the bug list
      ↓
Inspect the relevant file
      ↓
Explain the cause
      ↓
Apply the smallest safe fix
      ↓
Test the affected module
      ↓
Verify that other panels still work
      ↓
Update the maintenance log
```

---

## 12. Current Debugging Status (open items only)

Completed and not-applicable items have been removed. Verify each remaining item against the current repository before making further changes.

| Bug | Status |
|---|---|
| #2 — Storage key namespacing | Fix reported in `app.js`; verify in current code |
| #3 — Shared CSS/JS between panels | Pending architectural review |
| #5 — Sidebar active-button UX | Pending |
| #6 — Unsafe localStorage access | Fix reported using `Store.get/set`; verify in current code |
| #7 — Shared `.notes-card` styling in Mock Analysis | Fix reported; verify in current code |
| #8 — Duplicate solution-detail functions | Fix reported; verify in current code |
| #9 — Test timer behavior during panel switching | Pause/resume fix reported; verify in current code |
| #13 — Bootstrap failure isolation | Fix reported in `app.js`; verify in current code |

### Open Notes data issues

- Two notes share the id `nr031` (Swern oxidation and Pinnick oxidation). Rename the Pinnick note id.
- Some topic ids are irregular (`nr-nr088a`, `nr-nr109` to `nr-nr112`). They work, so they were left unchanged; tidy them up when convenient.
- Existing name-reaction SVG diagrams are about 10–33 KB each, above the 3–4 KB guideline. Slim them gradually; each now lives in its own small topic file.
- `showFailSafe()` behavior still requires verification against the current HTML structure.

---

## 13. Maintenance Log

### 2026-10-01 — Notes Engine and name-reaction data

- **notes-loader.js v5:** optional `diagram` field rendered inside the extra-info panel; per-section/topic/note `try/catch`; topics without `notes_list` no longer disappear.
- **notes-loader.js v6:** plain padded "box button" look for chapter/section/topic (no folder icons; styles injected by the file itself, so `index.html` and `css/notes.css` are not needed); topics can load from their own `file` (lazy, cached); search preloads topic files; quick-jump waits for topic load.
- **notes-loader.js v6.1:** chapter/topic load errors now show the path and exact reason.
- **Name Reaction chapter split** into `chapter.json` plus 108 topic files in `organic/name-reaction/topics/` (114 notes; checked to match the original exactly).
- Chapter failed to open earlier because an old `notes-loader.js` was running; after replacing it with the new version the chapter opened.
- Folder name mismatch (`name-reactions` vs real `name-reaction`) corrected in `chapter.json` and `oindex.json`.

### Still to verify on the live site

- Opening a topic (first load shows "Loading…" then notes).
- Search across the subject (loads all topic files the first time).
- Quick-jump dropdown to a topic.
- `|||` panel with a diagram.

---

## 14. About the Project

Akshat Study Zone is a modular educational platform designed to combine mock examinations, structured study notes, daily educational highlights, and future examination-related updates.

The architecture emphasizes independent modules, reusable data structures, controlled error handling, and maintainable code.

The long-term objective is to expand the platform without compromising existing functionality, responsiveness, or reliability.

---

## 15. Future Development Roadmap

### Planned Improvements

- Split the other large Notes chapters (e.g. `steriochemistry.json`) into one file per topic, like name-reaction.
- Add structure/mechanism SVG diagrams to more notes and slim the existing large ones.
- Fix the duplicate/irregular Notes ids listed above.
- Expand the Daily Highlights database beyond the current 75 event entries.
- Complete and refine the Daily Highlights notification system.
- Introduce a dedicated Next Update announcement section.
- Implement the Government Job Updates interface using `data/exam-updates.json`.
- Improve panel navigation and active-button feedback.
- Review shared CSS and JavaScript dependencies.
- Add systematic performance checks for mobile and desktop.
- Optional: a small validation script that checks every topic file and path before upload.
- Continue modularizing future features so they can be independently tested and maintained.

---

## 16. Instructions for Future AI Assistance

When working on this project, follow these instructions:

1. Read this document before proposing architectural changes.
2. Inspect the actual files before assuming that a fix has been applied.
3. Use English for code comments and technical documentation.
4. Explain technical changes in clear, concise Hinglish when communicating with the project owner.
5. Provide the exact file path and specific function or code section to modify, or a ready-to-use complete file when the owner has asked for that (see rule 1 in section 11).
6. Preserve the separation between Mock Test, Notes, Daily Highlights, and other feature modules.
7. Check for performance regressions and unintended side effects.
8. Verify that changes do not break unrelated panels.
9. Check JSON paths against the real folder names (case-sensitive) before delivering data files.
10. Update this document whenever a significant architectural decision or feature is introduced.

### Final Principle

**Build a stable, modular, and maintainable educational platform. Every new feature must improve the application without compromising the reliability of existing features.**
