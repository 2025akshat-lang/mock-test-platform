// ============================================================
// DATA LOADER — the only file that talks to /data/*.json
// ============================================================
// Nothing in here knows about DOM elements or UI state. Its only
// job is: "go fetch this JSON, and if it's missing/broken, say so
// instead of throwing" — so a missing file NEVER crashes the app,
// it just triggers the fail-safe "Content Not Available" screen.
//
// This is what makes new exams/levels/tests addable without
// touching any JS: app.js only ever calls the functions below,
// and they auto-discover whatever data files actually exist.
// ============================================================

const DataLoader = (() => {

  // Generic safe-fetch: never throws, always returns { ok, data, error }
  async function safeFetchJSON(path) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) {
        return { ok: false, data: null, error: `${path} → HTTP ${res.status}` };
      }
      const data = await res.json();
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: `${path} → ${err.message}` };
    }
  }

  // Top-level tree: categories + sub-categories. This is the ONLY
  // place that needs a new entry when you add a brand-new exam
  // (e.g. "SSC") or a new sub-level (e.g. "CGL") under it.
  async function getManifest() {
    return safeFetchJSON('data/manifest.json');
  }

  // Auto-discovery of tests inside a sub-category folder.
  // To add a new test: drop `<id>.json` in data/<subCatId>/ and add
  // one line to that folder's index.json. Nothing else changes.
  async function getTestIndex(subCatId) {
    return safeFetchJSON(`data/${subCatId}/index.json`);
  }

  // Full test (with questions) is only fetched when the user
  // actually opens/starts it — keeps the app fast even with many tests.
  async function getTest(subCatId, fileName) {
    return safeFetchJSON(`data/${subCatId}/${fileName}`);
  }

  return { getManifest, getTestIndex, getTest };
})();
