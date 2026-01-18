# 🔍 Optimization Backlog (Short)

**Lavet:** 2025-11-12  
**Opdateret:** 2026-01-18  
**Status:** Kort opsummering med “åben/løst”

---

## ✅ Løst siden første review

- **AI HTML sanitization** (XSS risk) — **LØST**
- **Base64 password storage** — **OBSOLET** (Google‑only auth)
- **Password verifier recovery issues** — **OBSOLET** (Google‑only auth)
- **Inconsistent error handling** — **DELVIST LØST** (toast‑notifier)

---

## 🔴 Høj prioritet (åbne)

1. **App.vue er for stor**  
   **Status:** ÅBEN  
   **Forslag:** split handlers til composables (`useNoteHandlers`, `useFolderHandlers`, `useAuthWatchers`).

2. **Duplicate folder colors**  
   **Status:** LØST (FOLDER_COLORS)  
   **Forslag:** brug `src/constants/folderColors.js` overalt.

3. **Magic strings for folder IDs**  
   **Status:** LØST (FOLDER_IDS)  
   **Forslag:** brug `FOLDER_IDS` konsekvent.

4. **Note counts perf**  
   **Status:** ÅBEN  
   **Forslag:** memoize `getNoteCounts()`.

---

## 🟡 Medium prioritet (åbne)

- **Search debounce** — brug debounced term i `notes.js`.
- **TinyMCE load only once** — fælles loader.
- **Pagination/virtual list** i notes (ved mange noter).
- **Cache migration key** ved fallback decrypt.

---

## 🟢 Lav prioritet / nice‑to‑have

- **Remove unused deps** (fx vue‑router hvis stadig ubrugt).
- **Sentry / error tracking**.
- **Unit + E2E tests** (Vitest + Playwright).
- **CSS containment + will-change** på tunge komponenter.

---

## 📝 Noter

Hvis du vil, kan jeg løbende opdatere status her efter hver ændring.
