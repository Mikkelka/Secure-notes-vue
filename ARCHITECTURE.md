# Secure Notes Vue - Arkitektur Dokumentation

Dette dokument giver et hurtigt overblik over applikationens struktur og alle filer for effektiv navigation.

## 📋 Projekt Overview

**Secure Notes Vue** er en sikker noter-applikation med client-side encryption, bygget med Vue 3 og Firebase. Appen bruger dansk sprog i UI'et og inkluderer AI-powered note enhancement features.

### Tech Stack
- **Frontend:** Vue.js 3 (Composition API, `<script setup>`)
- **State Management:** Pinia stores
- **Rich Text Editor:** TinyMCE v7.9.1 (fully local/self-hosted)  
- **Styling:** Tailwind CSS v4 med @apply component patterns
- **Icons:** Lucide Vue Next
- **Backend:** Firebase (Auth + Firestore)
- **Security:** Client-side encryption (AES-GCM, PBKDF2)
- **AI Integration:** Google Gemini (Flash-Lite + Flash Standard)

## 📁 Mappestruktur

```
C:\Users\mikke\Desktop\Secure-notes-vue\
├── docs/                          # Dokumentation og guides
│   ├── AI-PERFORMANCE-INVESTIGATION.md
│   ├── BACKUP-GUIDE.md
│   ├── firebase-rules.md
│   └── archive/                   # Arkiverede dokumenter
├── public/
│   ├── icon-*.png                 # PWA ikoner (48px til 512px)
│   └── tinymce/                   # Lokalt TinyMCE (445KB + plugins)
│       ├── tinymce.min.js         # Core TinyMCE script
│       ├── plugins/               # Lists, link, autolink, autoresize
│       ├── skins/                 # Oxide-dark + default themes
│       └── themes/silver/         # Silver theme
├── src/
│   ├── App.vue                    # Root component (683 linjer)
│   ├── main.js                    # Vue app initialisering
│   ├── style.css                  # Tailwind + @apply komponenter
│   ├── firebase.js                # Firebase konfiguration
│   ├── ai-testing/                # Isoleret AI test miljø
│   │   ├── AiTestPage.vue
│   │   ├── composables/useAiTesting.js
│   │   └── services/aiTestService.js
│   ├── components/                # Vue komponenter (kategoriseret)
│   ├── stores/                    # Pinia state management (7 stores)
│   ├── services/                  # Business logic services
│   └── utils/                     # Utility functions
├── ai-test.html                   # Standalone AI testing page
├── CLAUDE.md                      # Claude Code instruktioner  
├── CLAUDE.local.md                # Private udvikler-instruktioner
└── package.json                   # Dependencies (Vue 3, Firebase, TinyMCE)
```

## 🗄️ Pinia Stores

### `src/stores/auth.js`
**Ansvar:** Authentication state og session management
- Firebase auth integration (Google OAuth + email/password)
- Encryption key management via SecureStorage
- Session timeout handling (30 min default)
- Master password verification
- Key recovery efter timeout

### `src/stores/notes.js` 
**Ansvar:** Notes data management med encryption
- CRUD operationer for noter
- Client-side encryption/decryption
- Search og filtering
- Performance stats tracking
- Integration med SecureStorage

### `src/stores/folders.js`
**Ansvar:** Folder organisation og sikker mappe
- Folder CRUD operationer  
- PIN-protected 'secure' folder
- User settings (encrypted AI settings + PIN hash)
- Folder locking/unlocking logic

### `src/stores/trash.js`
**Ansvar:** Trash/recycle bin med soft delete
- Soft delete implementation (`isDeleted: true`)
- 30-day auto-cleanup
- Restore functionality
- Permanent delete operations

### `src/stores/ui.js`
**Ansvar:** UI state koordination
- Mobile drawer states
- Modal visibility
- Selected note tracking
- Dialog confirmations

### `src/stores/settings.js`
**Ansvar:** Application settings
- Local storage persistence
- Performance stats toggle
- User preferences

### `src/stores/index.js`
**Ansvar:** Store setup og initialization

## 🧱 Components Arkitektur

### `src/components/ai/`
- **AiModal.vue** - AI settings konfiguration
- **AiInstructionDropdown.vue** - AI instruction templates

### `src/components/auth/`
- **LoginForm.vue** - Login/register form med validation

### `src/components/base/`
**Reusable UI komponenter:**
- **BaseButton.vue** - Standard button component
- **BaseDialog.vue** - Modal dialog wrapper
- **BaseToggle.vue** - Toggle switch component  
- **CopyTextButton.vue** - Copy-to-clipboard button
- **PinInput.vue** - 4-digit PIN input

### `src/components/data/`
- **DataExport.vue** - Note export functionality (JSON)
- **ImportData.vue** - Data import med validation

### `src/components/folders/`
- **FolderDropdown.vue** - Folder selection dropdown

### `src/components/layout/`
**Layout og navigation:**
- **Header.vue** - Top navigation med user menu
- **FolderSidebar.vue** - Desktop folder navigation
- **MobileBottomMenu.vue** - Mobile bottom navigation (4 tabs)
- **MobileDrawer.vue** - Generic mobile drawer component
- **MobileSearchDrawer.vue** - Mobile search interface

### `src/components/notes/`
**Note management system:**
- **NotesList.vue** - Note list med search og filtering
- **QuickNote.vue** - Quick note creation (textarea ↔ TinyMCE toggle)
- **NoteViewer.vue** - Note viewer overlay (mobile/desktop layouts)
- **PerformanceStats.vue** - Database performance metrics

#### `src/components/notes/layouts/`
- **DesktopNoteLayout.vue** - Desktop note viewer layout
- **MobileNoteLayout.vue** - Mobile note viewer layout

#### `src/components/notes/shared/`
**Modulære note komponenter:**
- **NoteHeader.vue** - Title, folder, actions (favorite, delete, move)
- **NoteContent.vue** - Pure content display
- **NoteEditor.vue** - TinyMCE editing interface
- **AiPanel.vue** - AI processing UI med real-time streaming

### `src/components/settings/`
- **AppSettings.vue** - Main app settings modal
- **SettingsMenu.vue** - Secure folder settings
- **TimeoutWarning.vue** - Session timeout warning

### `src/components/ErrorBoundary.vue`
**Error boundary for Vue error handling**

## ⚙️ Services & Utils

### `src/services/aiService.js`
**AI Integration Service:**
- Google Gemini API integration
- Model selection (Flash-Lite vs Flash Standard)
- Real-time streaming med `onChunk` callbacks
- Performance logging og error handling

### `src/utils/`

#### `secureStorage.js`
**Centralized Encryption Key Management:**
- Static class managing single encryption key
- Session timeout (30 min default)
- Vue reactivity integration
- Automatic cleanup på logout

#### `encryption.js`
**Client-side Encryption:**
- AES-GCM encryption med 256-bit keys
- PBKDF2 key derivation (210,000 iterations)
- User-specific salts (`securenotes_v1_${userId}`)
- Random IV per encryption operation

#### `debounce.js`
**Utility function for search debouncing (300ms)**

#### `dataRecovery.js`
**Data recovery utilities for encryption errors**

## 🔧 Specielle Features

### TinyMCE Local Implementation
- **Fully Self-Hosted:** Migreret fra Tiny Cloud til eliminere API restrictions
- **Location:** `public/tinymce/` (445KB core + plugins)
- **No API Key:** Bruger `tinymce-script-src="/tinymce/tinymce.min.js"`
- **Offline Capable:** Virker uden internet forbindelse
- **Zero Cost:** Ingen løbende omkostninger

### Client-Side Encryption Model
- **Password-based key derivation:** PBKDF2 med 210,000 iterations
- **User-specific salts:** `securenotes_v1_${userId}`
- **AES-GCM encryption:** 256-bit keys med random IVs
- **Firebase stores kun encrypted data:** Server ser aldrig plaintext

### AI Performance Architecture
- **Production Models:** Flash-Lite (~1s) og Flash Standard (~4s)
- **Model Selection:** User-valgt via AI settings, gemt i sessionStorage
- **Real-time Streaming:** `onChunk` callbacks med live text display
- **Button State Management:** Purple → Blue → Green → Emerald progression

### Trash System
- **Soft Delete:** Noter markeret som `isDeleted: true`
- **30-Day Auto-Cleanup:** Automatisk fjernelse af gamle noter
- **Separate Store:** Dedikeret `trash.js` store for clean architecture

### Session Timeout Recovery
- **Automatic Recovery:** Når encryption key udløber men Firebase auth persists
- **Graceful Degradation:** User-friendly danske fejlbeskeder
- **Implemented in:** `App.vue` for `handleSaveNote()` og `handleViewerUpdate()`

## 📋 Key Files Reference

### Core Application Files
- **`src/App.vue:683`** - Root component med all layout logic
- **`src/main.js:11`** - Vue app initialization
- **`src/style.css`** - Tailwind @apply component system
- **`CLAUDE.md`** - Claude Code development instructions

### Critical Store Files  
- **`src/stores/auth.js`** - Authentication og session management
- **`src/stores/notes.js`** - Core note management med encryption
- **`src/stores/ui.js`** - UI state coordination

### Essential Components
- **`src/components/notes/NoteViewer.vue`** - Main note editing interface
- **`src/components/notes/shared/AiPanel.vue`** - AI processing interface
- **`src/components/layout/Header.vue`** - Main navigation

### Security & Utilities
- **`src/utils/secureStorage.js`** - Encryption key management
- **`src/utils/encryption.js`** - Crypto operations
- **`src/services/aiService.js`** - AI integration

### Configuration
- **`package.json:34`** - Dependencies og scripts
- **`firebase.json`** - Firebase hosting konfiguration
- **`vite.config.js`** - Vite build konfiguration

## 🎯 Arkitektur Principper

1. **Modularity:** Komponenter opdelt i logiske kategorier
2. **Security First:** Client-side encryption med zero-knowledge server
3. **Performance:** Local TinyMCE, debounced search, efficient state management
4. **Mobile-First:** Responsive design med dedikerede mobile komponenter
5. **Developer Experience:** Extensive @apply system, comprehensive documentation
6. **AI Integration:** Seamless AI features med real-time feedback

---

*Dette dokument maintaines løbende når arkitekturen ændrer sig.*