# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production 
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build locally

## Application Architecture

This is a secure notes application built with Vue.js 3, Firebase, and client-side encryption. The app uses Danish language throughout the UI and includes AI-powered note enhancement features.

### Migration Status

This project has been successfully migrated from React to Vue.js 3 with the following architecture:

**State Management:** Pinia stores (auth, notes, folders, settings, ui)
**UI Framework:** Vue 3 with Composition API
**Styling:** Tailwind CSS v4
**Rich Text:** TipTap (replacing Lexical)
**Icons:** Lucide Vue Next

### Core Security Model

The application implements **client-side encryption** where user data is encrypted before being sent to Firebase:

- **Password-based key derivation**: Uses PBKDF2 with 210,000 iterations (OWASP 2023 recommendation)
- **User-specific salts**: Each user has a unique salt (`securenotes_v1_${userId}`)
- **AES-GCM encryption**: 256-bit keys with random IVs for each encryption operation
- **Firebase stores only encrypted data**: The server never sees plaintext note content

### Authentication Flow

1. User logs in with Firebase Authentication
2. App prompts for encryption password (separate from Firebase auth)
3. Password derives AES key using PBKDF2
4. Key unlocks encrypted notes stored in Firestore

### Data Structure

**Notes collection** (`/notes/{noteId}`):
```
{
  userId: string,
  encryptedTitle: string,    // Base64 encrypted title
  encryptedContent: string,  // Base64 encrypted content  
  folderId: string | null,   // Reference to folder
  isFavorite: boolean,       // Favorite status
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Folders collection** (`/folders/{folderId}`):
```
{
  userId: string,
  encryptedName: string,     // Base64 encrypted folder name
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Component Architecture

- **App.jsx**: Main application container, manages authentication state, note selection, session timeout, and mobile drawer coordination
- **TimeoutWarning.jsx**: Session timeout warning modal with countdown timer
- **DataExport.jsx**: Data export functionality for creating encrypted backup files
- **ImportData.jsx**: Data import functionality for restoring from backup files
- **FolderSidebar.jsx**: Color-coded folder navigation with note counts and inline editing
- **NoteViewer.jsx**: Mobile-responsive note viewer with favorite toggle
- **NotesList.jsx**: Note list with infinite scroll, favorites section, and search
- **NoteEditor.jsx**: Note editor with compact/expanded modes and auto-resize
- **Header.jsx**: App header with export functionality, AI modal trigger, and performance stats
- **AiModal.jsx**: AI configuration modal with Google Gemini API integration and instruction presets
- **UnlockScreen**: Password re-entry screen for session recovery (inline component)

### Mobile Components and Z-Index Management

The mobile interface uses a coordinated drawer system with proper z-index layering:

- **MobileBottomMenu.jsx**: Fixed bottom navigation menu (`z-50`)
- **MobileDrawer.jsx**: Generic drawer component for mobile interfaces (`z-40`)
- **MobileSearchDrawer.jsx**: Dedicated search drawer that sits above bottom menu
- **MobileSearchDrawer.jsx**: Mobile search interface with auto-focus and clear functionality

**Z-Index Hierarchy:**
- `z-50`: MobileBottomMenu (always on top)
- `z-40`: All drawer components (MobileDrawer, MobileSearchDrawer, folder sidebar overlay)

**Mobile Drawer Coordination:**
All mobile menu handlers ensure mutual exclusivity - opening one drawer automatically closes all others. This prevents overlapping interfaces and user confusion.

### AI Integration System

The app includes modular Google Gemini AI integration for note enhancement with a clean architecture:

**AI Service** (`services/aiService.js`):
- Core AI processing functionality with Google Generative AI
- Safety settings configured to `BLOCK_NONE` for all categories
- Text conversion utilities (Lexical JSON ↔ markdown-like text)
- Instruction prompts for different AI modes (note-organizer, summarizer, meeting-notes)
- `processTextWithAi()` main processing function
- `isLexicalContent()` and `createLexicalState()` helper functions

**AI Hook** (`hooks/useAi.js`):
- Reusable React hook for AI state management
- Provides `isAiProcessing`, `canUndo` state
- `processText()` function with success/error callbacks
- `undoLastProcessing()` for reverting AI changes
- `resetAiState()` for cleanup when switching contexts

**AI Configuration** (`components/AiModal.jsx`):
- API key management with session-based storage
- Model selection between Gemini variants (2.0-flash, 1.5-pro)
- Custom instruction presets for different note types
- Real-time status feedback and error handling

**Usage Pattern:**
```javascript
import { useAi } from '../hooks/useAi';

const { isAiProcessing, canUndo, processText, undoLastProcessing, resetAiState } = useAi();

// Process content
await processText(content, onSuccess, onError);

// Undo last processing
undoLastProcessing(onUndo);
```

### Key Hooks

- **useAuth**: Handles Firebase auth, password-based key derivation, session timeout management, and unlock flow
- **useNotes**: Manages notes with pagination, infinite scroll, search, favorites, and per-folder filtering
- **useFolders**: Manages encrypted folder operations with color support
- **useDebounce**: Debounced search functionality
- **useAi**: Modular AI text processing with state management, undo functionality, and error handling

### Favorite Notes System

Notes can be marked as favorites and are automatically sorted to the top of each folder view:
- Favorites section appears first with "Favoritter" header
- Regular notes follow under "Andre noter" header  
- Star icons indicate and toggle favorite status
- Works across both notes list and note viewer

### Session Management System

The app implements automatic session timeout for security:
- **Session Timeout**: Configurable automatic session timeout (default 30 minutes)
- **Warning System**: 2-minute warning before timeout with option to extend session
- **Activity Tracking**: Monitors user activity to reset timeout timers (throttled to every 5 seconds)
- **Unlock Flow**: Password re-entry required after timeout, maintains Firebase authentication
- **UnlockScreen**: Dedicated component for password re-entry without full re-authentication

### Backup and Recovery System

Complete data export/import functionality:
- **DataExport**: Export all notes and folders as readable JSON with password verification
- **ImportData**: Clean slate import that replaces all existing data with backup
- **Progress Tracking**: Visual progress indicators during import operations
- **File Validation**: Validates backup file format and structure before import
- **dataRecovery.js**: Utility functions for backup/restore operations

### Environment Variables Required

Firebase configuration (all required):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN` 
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Optional encryption settings:
- `VITE_PBKDF2_ITERATIONS` (default: 210000)
- `VITE_ENCRYPTION_VERSION` (default: 'securenotes_v1_')

Optional session management:
- `VITE_SESSION_TIMEOUT` (default: 1800000ms / 30 minutes)
- `VITE_WARNING_TIME` (default: 120000ms / 2 minutes)

### Styling

- Uses Tailwind CSS v4 with Vite plugin
- Dark theme with gray/blue color scheme
- Responsive design with mobile-first approach
- Custom scrollbar styling and transitions
- Consistent spacing and typography scales

### Performance Features

- **Infinite Scroll**: Notes loaded in batches of 20 with automatic loading as user scrolls
- **Pagination**: Firestore cursor-based pagination for efficient data loading
- **Debounced search**: 300ms delay to avoid excessive queries
- **Memoized filtering**: Efficient note filtering by folder and search term
- **Performance stats**: Built-in timing for encryption/decryption operations displayed in header
- **Activity throttling**: Activity tracking limited to every 5 seconds to reduce overhead

### Mobile-Specific Optimizations

- **Touch-friendly interfaces**: Larger touch targets for mobile interactions
- **Exclusive drawer system**: Only one mobile drawer can be open at a time
- **Reduced spacing**: Mobile-optimized padding and margins for better screen utilization
- **Auto-focus inputs**: Search inputs automatically focus when drawers open
- **Gesture-friendly design**: Swipe-to-close support via backdrop clicks