# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production 
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build locally

## Application Architecture

This is a secure notes application built with Vue.js 3, Firebase, and client-side encryption. The app uses Danish language throughout the UI and includes AI-powered note enhancement features.

**Tech Stack:**
- **State Management:** Pinia stores 
- **UI Framework:** Vue 3 Composition API with `<script setup>` 
- **Rich Text:** TinyMCE v7.9.1 - **FULLY LOCAL** (no API limits, offline capable)
- **Styling:** Tailwind CSS v4 with extensive @apply component patterns
- **Icons:** Lucide Vue Next

### TinyMCE Local Implementation

**Fully Self-Hosted TinyMCE v7.9.1** - Migrated from Tiny Cloud to eliminate API restrictions:

**Local Assets Location:**
- **Core Script**: `public/tinymce/tinymce.min.js` (445KB)
- **Complete Package**: All plugins, skins, themes copied from npm package to `public/tinymce/`
- **Plugins Used**: `lists`, `link`, `autolink`, `autoresize` (for QuickNote)
- **Dark Theme**: `oxide-dark` skin with custom content styling

**Implementation Details:**
- **NoteEditor.vue**: Full-featured editor with `tinymce-script-src="/tinymce/tinymce.min.js"`
- **QuickNote.vue**: Toggle between simple textarea and advanced TinyMCE editor
- **No API Key**: Removed `api-key` prop entirely - no external dependencies
- **Offline Capable**: Editor works without internet connection
- **Zero Cost**: No recurring costs for TinyMCE usage

**Benefits Achieved:**
- 🚫 **No 1,000 loads/month limitation**
- ⚡ **Faster loading** (no CDN dependency) 
- 🔒 **Enhanced security** (no external API calls)
- 💰 **Zero ongoing costs**

### Core Security Model

The application implements **client-side encryption** where user data is encrypted before being sent to Firebase:

- **Password-based key derivation**: Uses PBKDF2 with 210,000 iterations
- **User-specific salts**: Each user has a unique salt (`securenotes_v1_${userId}`)
- **AES-GCM encryption**: 256-bit keys with random IVs for each encryption operation
- **Firebase stores only encrypted data**: The server never sees plaintext note content
- **Centralized encryption key management**: SecureStorage utility for consistent key handling

### SecureStorage Architecture

**Centralized Encryption Key Management** (`utils/secureStorage.js`):
- Static class managing single encryption key instance across entire application
- Automatic session timeout with configurable duration (default 30 minutes)
- Secure key storage with automatic cleanup on timeout or logout
- Vue reactivity integration with trigger system to prevent race conditions

**API Usage Pattern:**
```javascript
// Setting key (typically in auth.js)
SecureStorage.setEncryptionKey(derivedKey, () => logout())
encryptionKeyTrigger.value++ // Trigger Vue reactivity

// Getting key (in any store)
const encryptionKey = SecureStorage.getEncryptionKey()

// Activity-based extension
SecureStorage.extendSession()
```

**Session Timeout Recovery:**
- **Automatic Recovery**: When encryption key expires but Firebase auth persists, operations auto-retry with `authStore.recoverEncryptionKey()`
- **Graceful Degradation**: Failed recovery shows user-friendly Danish error messages
- **Implemented in**: `App.vue` for `handleSaveNote()` and `handleViewerUpdate()` functions
- **User Experience**: Seamless note saving even after 30-minute session timeout

### Pinia Store Architecture

**auth.js** - Authentication state and session management
**notes.js** - Notes data management with SecureStorage integration
**folders.js** - Folder organization with PIN-protected secure folder
**trash.js** - Trash/recycle bin functionality with soft delete system
**ui.js** - UI state coordination (mobile drawers, modals, note viewer)
**settings.js** - Application settings with local storage persistence

### Authentication Flow

**Google OAuth Login:** Firebase auth → UID as encryption password → SecureStorage
**Email/Password Login:** Firebase auth → login password as encryption password → SecureStorage

Both store login type for master password verification: `localStorage.getItem('loginType_${userId}')`

### Data Structure

**Notes collection** (`/notes/{noteId}`):
```
{
  userId: string,
  encryptedTitle: string,    // Base64 encrypted title
  encryptedContent: string,  // Base64 encrypted HTML content
  folderId: string | null,   // Reference to folder ('secure' for PIN-protected)
  isFavorite: boolean,
  isDeleted: boolean,        // Soft delete flag for trash system
  deletedAt: Timestamp | null, // When note was moved to trash
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Folders collection** (`/folders/{folderId}`):
```
{
  userId: string,
  encryptedName: string,     // Base64 encrypted folder name
  color: string,             // Color identifier for UI display
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**UserSettings collection** (`/userSettings/{userId}`):
```
{
  userId: string,
  encryptedPinHash: string,  // Encrypted PIN for secure folder access
  encryptedAiSettings: string, // Encrypted AI configuration
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Tailwind CSS @apply Component System

**Centralized Styling Architecture** (`src/style.css`):
- Extensive use of @apply directives to create reusable component classes
- Semantic class names replace long utility class strings
- Organized patterns: buttons, inputs, modals, mobile UI, toggles, etc.
- Massive token reduction: `"bg-gray-800/60 border rounded-lg p-3..."` becomes `"note-item"`

**Benefits**: Consistency, maintainability, readability, reduced CSS bundle size

### Environment Variables

**Required Firebase Configuration:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN` 
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Optional Security Settings:**
- `VITE_PBKDF2_ITERATIONS` (default: 210000)
- `VITE_ENCRYPTION_VERSION` (default: 'securenotes_v1_')
- `VITE_SESSION_TIMEOUT` (default: 1800000ms / 30 minutes)

### Development Guidelines

**VIGTIGT - Test og Backup:**
- Mikkel bruger denne app aktivt i production
- Lav altid backup før store arkitektur-ændringer
- Test grundigt før migration af encryption/database kode
- Brug export funktionen til backup før refactoring
- Verificer at data kan læses korrekt efter ændringer

**AI Integration Guidelines:**
- **Model Selection**: Altid tjek sessionStorage for bruger-valgt model: `sessionStorage.getItem('ai-model')`
- **Streaming Callbacks**: Brug `onChunk` og `onThoughtChunk` for real-time UI opdateringer
- **Performance Logging**: Inkluder console.log for timing og performance metrics
- **Button States**: Implement purple → blue → green → emerald progression for AI processing
- **Character Counting**: Vis live character counts under streaming og thinking

**TinyMCE Local Development:**
- **Assets Location**: All TinyMCE files in `public/tinymce/` - do NOT modify or delete
- **Component Implementation**: Use `tinymce-script-src="/tinymce/tinymce.min.js"` instead of `api-key`
- **Version Updates**: When updating TinyMCE package, re-copy from `node_modules/tinymce` to `public/tinymce/`
- **No External Dependencies**: Editor works offline - no cloud API calls

**Vue 3 Composition API Patterns:**
- Use `<script setup>` syntax for all components
- Pinia stores for cross-component state management
- Reactive refs and computed properties for local state

**SecureStorage Best Practices:**
- Always use `SecureStorage.getEncryptionKey()` for encryption operations
- Never pass encryption keys as function parameters
- Let SecureStorage handle session timeout and cleanup
- Remember to trigger Vue reactivity when setting keys: `encryptionKeyTrigger.value++`

**Security Considerations:**
- Never log encryption keys or passwords
- Use SecureStorage for all encryption key management
- Always check login type before password verification: `localStorage.getItem('loginType_${userId}')`
- For UI privacy, avoid displaying full email addresses
- **Session Timeout Handling**: Implement automatic recovery for encryption key expiration to prevent data loss
- **Error Resilience**: Wrap encryption operations in try-catch with recovery logic for seamless UX

**Performance Optimization:**
- Debounced search with 300ms delay
- Efficient note filtering using computed properties
- @apply directive system reduces CSS bundle size and improves maintainability
- **Modulær NoteViewer arkitektur** - Opdelt i shared komponenter for bedre maintainability
- **Isoleret AI testing miljø** - `src/ai-testing/` komplet adskilt fra hovedapp
- **Modular Trash System** - Separate trash store for clean architecture

**Trash/Recycle Bin System:**
- **Soft Delete Implementation**: Notes marked as `isDeleted: true` instead of permanent deletion
- **30-Day Auto-Cleanup**: Automatically removes notes older than 30 days from trash
- **Separate Store Architecture**: `src/stores/trash.js` handles all trash operations
- **Client-Side Only**: No Firebase Functions required - pure client-side implementation
- **Trash Operations**: `moveToTrash()`, `restoreNote()`, `permanentDeleteNote()`, `emptyTrash()`
- **Filtering Integration**: Active notes automatically filtered from main views
- **Count Integration**: Trash count integrated into folder sidebar

**AI Performance Architecture:**
- **Production Models**: Flash-Lite (`gemini-2.5-flash-lite-preview-06-17`) og Flash Standard (`gemini-2.5-flash`)
- **Model Selection**: User-valgt via AI Indstillinger modal, gemt i sessionStorage
- **Response Time**: Flash-Lite ~1s, Flash Standard ~4s med thinking
- **Real-time Streaming**: onChunk callbacks med tekst streaming og character counts
- **Testing Environment**: Isoleret AI testing lab via `/ai-test.html`
- **Thinking Toggle**: Universal enableThinking control for begge modeller

**Component Architecture:**
- **Modulær NoteViewer**: Opdelt i shared komponenter for performance (~311 linjer total)
  - `NoteHeader.vue` - titel, folder, actions 
  - `NoteContent.vue` - pure content display
  - `NoteEditor.vue` - TinyMCE editing isoleret
  - `AiPanel.vue` - AI processing UI med real-time streaming
  - Layout wrappers for mobile/desktop
- **Performance Benefit**: Kun relevante komponenter re-renderes ved AI responses

**Real-time AI Streaming Architecture:**
- **Streaming Implementation**: `onChunk` og `onThoughtChunk` callbacks for real-time text display
- **Button State Management**: Purple → Blue (thinking) → Green (streaming) → Emerald (complete)
- **Character Counting**: Live character counts during streaming og thinking
- **UI Responsiveness**: Tekst vises i real-time som AI genererer content
- **Performance Metrics**: Console logging af timing og token counts
- **Session Integration**: Model valg og settings gemt i sessionStorage

**AI Testing Environment:**
- **Location**: `src/ai-testing/` - helt isoleret fra hovedapp
- **Access**: Test Lab knap i header åbner `/ai-test.html` i nyt vindue
- **Features**: Standalone aiTestService.js, begge AI modeller, performance metrics
- **Independence**: Zero dependencies på hovedapp, dedicated Google AI imports

**Mobile Touch Optimization:**
- `touch-action: manipulation` for responsive interactions
- Minimum 44-48px touch targets for accessibility compliance

**Important Implementation Notes:**
- **Note Saving**: Uses correct parameter passing - `emit('update', noteId, title, content)` (3 separate parameters)
- **AI Model Persistence**: Model selection persisted via `sessionStorage.getItem('ai-model')`
- **Error Handling**: Comprehensive error handling for AI processing failures
- **Performance**: Real-time streaming with immediate visual feedback
- **Trash Store Integration**: Notes store delegates all trash operations to dedicated trash store
- **Store Initialization**: Trash store initialized with notes store reference for shared state access
- **TinyMCE Local**: Fully self-hosted TinyMCE v7.9.1 with `tinymce-script-src="/tinymce/tinymce.min.js"` - no API key or external dependencies
- **Session Recovery**: Automatic encryption key recovery in `App.vue` prevents note saving failures after session timeout