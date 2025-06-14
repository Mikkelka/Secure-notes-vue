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

**folders.js** - Folder organization system:
- Encrypted folder management with color coding
- PIN-protected secure folder functionality
- Master password fallback for secure folder access
- User settings storage for AI configuration

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

1. Firebase Authentication (Google OAuth or email/password)
2. Separate encryption password prompt for client-side encryption
3. PBKDF2 key derivation with user-specific salt
4. Encrypted data access with session timeout protection
5. Activity-based session extension or automatic logout

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

**Key Mobile Components:**
- `MobileBottomMenu.vue` - Primary navigation interface
- `MobileDrawer.vue` - Generic drawer container
- `MobileSearchDrawer.vue` - Dedicated search interface

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

### AI Integration System

**Core AI Service** (`services/aiService.js`):
- Google Generative AI integration with configurable models
- Direct HTML processing - preserves and enhances existing formatting
- Instruction preset system for different note enhancement modes
- Safety settings configured for minimal content blocking
- Intelligent formatting addition (headings, bold text, lists) where appropriate

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
- PIN-protected secure folder with master password fallback
- Client-side encryption key never transmitted
- Automatic session cleanup on inactivity
- Password verification for sensitive operations

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

**Performance Optimization:**
- Debounced search with 300ms delay
- Efficient note filtering using computed properties
- Lazy loading for mobile drawers and modals
- Performance stats tracking for encryption operations