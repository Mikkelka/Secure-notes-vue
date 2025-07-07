# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production 
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build locally

## Application Architecture

This is a secure notes application built with Vue.js 3, Firebase, and client-side encryption. The app uses Danish language throughout the UI and includes AI-powered note enhancement features.

### Migration Context

This project was successfully migrated from React to Vue.js 3 to reduce code complexity. The Vue version maintains feature parity while achieving more concise code through:

**State Management:** Pinia stores replace React hooks and context
**UI Framework:** Vue 3 Composition API with `<script setup>` 
**Rich Text:** TipTap editor with Lexical content compatibility
**Styling:** Tailwind CSS v4 with Vite plugin
**Icons:** Lucide Vue Next (replacing lucide-react)

### Core Security Model

The application implements **client-side encryption** where user data is encrypted before being sent to Firebase:

- **Password-based key derivation**: Uses PBKDF2 with 210,000 iterations
- **User-specific salts**: Each user has a unique salt (`securenotes_v1_${userId}`)
- **AES-GCM encryption**: 256-bit keys with random IVs for each encryption operation
- **Firebase stores only encrypted data**: The server never sees plaintext note content
- **Cross-version compatibility**: Notes encrypted in React version can be decrypted in Vue version

### Pinia Store Architecture

**auth.js** - Authentication state and session management:
- Firebase auth integration with Google and email providers
- Encryption key generation from passwords using PBKDF2
- Session timeout with activity tracking and warning system
- Automatic logout and unlock flow for security

**notes.js** - Notes data management:
- Encrypted note storage and retrieval from Firestore
- Search functionality with plain text extraction from rich content
- Favorite notes system with automatic sorting
- Performance monitoring for encryption/decryption operations
- Fallback decryption for cross-version compatibility
- `moveNoteToFolder()` method for changing note folder assignments

**folders.js** - Folder organization system:
- Encrypted folder management with color coding
- PIN-protected secure folder functionality
- Fully implemented master password fallback with login-type-aware verification
- User settings storage for AI configuration
- `verifyAndUnlockWithMasterPassword()` supports both Google (email) and email/password users

**ui.js** - UI state coordination:
- Mobile drawer state management (search, settings, note editor)
- Note viewer state and selection tracking
- Modal and dialog state (export, import, AI configuration)
- Mobile-first responsive state handling

**settings.js** - Application settings:
- Session timeout configuration
- Performance stats visibility toggle
- Local storage persistence for user preferences

### Authentication Flow

The application supports two distinct authentication patterns with different encryption key handling:

**Google OAuth Login:**
1. Firebase Google Authentication
2. User's Firebase UID used as encryption password (automatic)
3. PBKDF2 key derivation with user-specific salt
4. User's email serves as master password for secure folder access
5. Login type stored as `loginType_${userId}` = 'google'

**Email/Password Login:**
1. Firebase email/password authentication
2. User's login password used as encryption password
3. PBKDF2 key derivation with user-specific salt
4. Same login password serves as master password for secure folder access
5. Login type stored as `loginType_${userId}` = 'email'

**Shared Security Features:**
- Encrypted data access with session timeout protection
- Activity-based session extension or automatic logout
- PIN-protected secure folders with master password fallback
- Password verification for data export operations

### Data Structure

**Notes collection** (`/notes/{noteId}`):
```
{
  userId: string,
  encryptedTitle: string,    // Base64 encrypted title
  encryptedContent: string,  // Base64 encrypted Lexical/TipTap content
  folderId: string | null,   // Reference to folder ('secure' for PIN-protected)
  isFavorite: boolean,       // Favorite status for prioritized display
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

### Mobile-First UI Architecture

**Responsive Component System:**
- Desktop: Sidebar navigation with three-column layout
- Mobile: Bottom navigation with exclusive drawer system
- Touch-optimized interactions with gesture support

**Mobile Drawer Coordination:**
- Only one drawer can be open at a time
- Bottom menu (`z-50`) always accessible
- Drawers (`z-40`) with backdrop dismiss functionality
- Automatic drawer closure when switching between functions

**Mobile NoteViewer Optimizations:**
- Compact action buttons in bottom area for thumb accessibility
- Icon-only design: [Slet] [Favorit] [Edit] [Luk]
- Removed header action buttons to prevent stretching for top screen areas
- Optimized z-index hierarchy: NoteViewer (`z-60`), Dropdown (`z-[60]`), Dialogs (`z-[80]`)
- Touch-optimized folder label interaction with mobile-centered dropdown

**Key Mobile Components:**
- `MobileBottomMenu.vue` - Primary navigation interface
- `MobileDrawer.vue` - Generic drawer container
- `MobileSearchDrawer.vue` - Dedicated search interface
- `NoteViewer.vue` - Mobile-optimized with bottom action buttons and centered modals
- `FolderDropdown.vue` - Responsive folder selection dropdown
- `PinInput.vue` - PIN entry with login-type-aware master password hints

### Rich Text Editor Integration

**TinyMCE Configuration:**
- Clean, simplified toolbar with essential formatting only
- Heading support (H1, H2, H3) with proper styling
- Bold, italic, underline, strikethrough text formatting
- Bullet lists with proper styling
- Link insertion support
- Removed: alignment, numbered lists, indent/outdent, help, removeformat
- Dark theme optimized for application UI

**Content Storage:**
- Pure HTML storage in database (no JSON conversion)
- Direct HTML rendering in viewer with v-html
- Simplified architecture eliminates conversion bugs
- Better performance with no format transformation

**Rich Content Styling:**
- Comprehensive CSS styling for all HTML elements in `NoteViewer.vue`
- Code block styling with `<pre><code>` support and monospace fonts
- Inline code styling with background highlighting
- Horizontal rule styling with proper spacing and dark theme integration
- All formatting optimized for dark theme and mobile responsiveness

### Folder Management System

**Interactive Folder Labels:**
- Clickable folder labels on all notes showing current folder assignment
- Color-coded labels matching folder theme colors
- Special handling for "Ukategoriseret" (uncategorized) and "Sikker" (secure) folders
- Positioned next to action buttons for easy access

**Folder Dropdown Interface:**
- `FolderDropdown.vue` component for selecting target folders
- Shows all available folders with names and colors
- Filters out locked folders (secure folder when locked)
- Excludes current folder from selection options
- Mobile-optimized with centered modal presentation

**Mobile Folder UX:**
- Desktop: Dropdown positioned below folder label
- Mobile: Centered modal with backdrop for better touch interaction
- Touch-optimized button sizes (minimum 48px height)
- Smooth animations and proper z-index layering

**Folder Movement Workflow:**
1. Click folder label on any note
2. Select target folder from dropdown
3. Note automatically moves with visual feedback
4. Security validation for protected folders
5. Real-time UI updates without page refresh

### AI Integration System

**Core AI Service** (`services/aiService.js`):
- Google Generative AI integration with configurable models using `@google/genai` SDK
- Direct HTML processing - preserves and enhances existing formatting
- Instruction preset system for different note enhancement modes
- Safety settings configured for minimal content blocking
- Intelligent formatting addition (headings, bold text, lists, code blocks, horizontal rules) where appropriate
- Dynamic thinking capabilities enabled (`thinkingBudget: -1`) for improved AI reasoning
- Note title context provided to AI for better content understanding
- Unified formatting instructions system covering both markdown and HTML formatting
- Explicit border-avoidance instructions to prevent visual clutter

**AI SDK Documentation:**
- Gemini API Thinking: https://ai.google.dev/gemini-api/docs/thinking
- Safety Settings: https://ai.google.dev/gemini-api/docs/safety-settings
- JavaScript Quickstart: https://ai.google.dev/gemini-api/docs/quickstart#javascript

**AI Features:**
- Note organization and enhancement
- Content summarization
- Meeting notes structuring
- Custom instruction support
- Undo functionality for AI-processed content

### Session Management and Security

**Automatic Session Timeout:**
- Configurable timeout period (default 30 minutes)
- Activity tracking with throttled updates (5-second intervals)
- Warning system (2 minutes before timeout)
- Graceful session extension or forced logout

**Security Features:**
- PIN-protected secure folder with master password fallback (fully implemented)
- Login-type-aware password verification for all sensitive operations
- Client-side encryption key never transmitted
- Automatic session cleanup on inactivity
- Privacy-focused UI that doesn't display full email addresses
- Secure data export with proper password verification

### Master Password & Data Export Security

**Master Password System:**
The master password provides backup access to PIN-protected secure folders:

- **Google Users**: Use their full email address as master password
- **Email Users**: Use their login password as master password
- **Verification**: Login type detection via `localStorage.getItem('loginType_${userId}')`
- **Security**: Master password prompts don't display the actual email for privacy
- **Implementation**: `verifyAndUnlockWithMasterPassword()` in `folders.js`

**Data Export Security:**
All data exports require password verification before decryption:

- **Google Users**: Must enter their full email address to export
- **Email Users**: Must enter their login password to export
- **UI Privacy**: Export dialog shows only username (before @) not full email
- **Verification**: Password verified against login type before export proceeds
- **Implementation**: Enhanced `DataExport.vue` with login-type-aware verification

**Code Example:**
```javascript
// Login type detection pattern used throughout
const loginType = localStorage.getItem(`loginType_${user.uid}`)

if (loginType === 'google') {
  // Verify against user.email
  if (enteredPassword === user.email) { /* proceed */ }
} else if (loginType === 'email') {
  // Verify against stored encrypted password
  const storedPassword = atob(localStorage.getItem(`encryptedPassword_${user.uid}`))
  if (enteredPassword === storedPassword) { /* proceed */ }
}
```

### Data Architecture Simplification

**HTML-First Approach:**
- Direct HTML storage eliminates format conversion complexity
- TinyMCE → HTML → Database → HTML → Display (no conversion layers)
- Backward compatibility maintained for existing encrypted notes
- Simplified debugging and maintenance with pure HTML content

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
- `VITE_WARNING_TIME` (default: 120000ms / 2 minutes)

### Development Guidelines

**Vue 3 Composition API Patterns:**
- Use `<script setup>` syntax for all components
- Pinia stores for cross-component state management
- Reactive refs and computed properties for local state
- Watch for reactive side effects and data synchronization

**Security Considerations:**
- Never log encryption keys or passwords
- Use environment variables for sensitive configuration
- Implement proper error boundaries for encryption failures
- Maintain separation between Firebase auth and encryption keys
- Always check login type before password verification: `localStorage.getItem('loginType_${userId}')`
- For UI privacy, avoid displaying full email addresses (use username portion only)
- Implement login-type-aware password prompts with appropriate hints

**Performance Optimization:**
- Debounced search with 300ms delay
- Efficient note filtering using computed properties
- Lazy loading for mobile drawers and modals
- Performance stats tracking for encryption operations

**Mobile Touch Optimization:**
- `touch-action: manipulation` for responsive interactions
- `-webkit-tap-highlight-color: transparent` to remove tap highlights
- Minimum 44-48px touch targets for accessibility compliance
- Proper event handling separation for touch vs click events
- iOS zoom prevention with 16px minimum font sizes