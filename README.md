# Sikre Noter - Secure Notes Vue

[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Lines of Code](https://img.shields.io/badge/lines%20of%20code-2227%20lines-blue?style=for-the-badge)](.)

A modern, secure note-taking application built with Vue.js 3 and Firebase, implementing client-side encryption for maximum data security. All notes are encrypted locally before being stored in the database.

> **🌐 Language Note**: This application features a Danish user interface while maintaining English documentation for international developers.

## 🔐 Security & Privacy First

**Sikre Noter** prioritizes your privacy by implementing **end-to-end encryption** directly in the browser:

- 🛡️ **Client-side encryption**: Your notes are encrypted locally before being sent to Firebase
- 🔑 **PBKDF2 key derivation**: 210,000 iterations with user-specific salts
- 🎯 **AES-GCM encryption**: 256-bit keys with random IVs for each operation
- ⏰ **Session timeout**: Automatic security logout after 30 minutes with recovery
- 🚫 **Zero-knowledge**: The server never sees your unencrypted data
- 🔒 **Self-hosted**: Full control over your data and infrastructure

## ✨ Features

### 📝 Note Management
- **Rich Text Editor**: Complete TinyMCE v7.9.1 integration (locally hosted, offline capable)
- **Folder Organization**: Organize notes in customizable colored folders
- **Secure Folder**: PIN-protected folder for sensitive notes
- **Favorites**: Mark important notes as favorites
- **Full-text Search**: Fast search through all your notes with 300ms debounce
- **Trash/Recycle Bin**: Soft delete with 30-day auto-cleanup and restore functionality

### 🤖 AI Integration
- **Google Generative AI**: Powered by Gemini 2.5 Flash models
- **Real-time Streaming**: Live text streaming during AI processing
- **Dual Models**: Flash-Lite (fast ~1s) and Flash Standard (advanced ~4s with thinking)
- **Customizable Prompts**: User-defined AI instructions and behavior
- **Performance Metrics**: Detailed timing and token statistics
- **Isolated Testing**: Dedicated AI testing lab environment

### 📱 Modern User Experience
- **Progressive Web App**: Install as native app on any platform
- **Responsive Design**: Optimized for both desktop and mobile
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Touch Optimization**: Responsive touch targets and interactions (44-48px minimum)
- **Offline Capable**: Works without internet connection (PWA + local TinyMCE)
- **Danish UI**: Complete Danish language support

### 🔧 Advanced Features
- **Import/Export**: Full data backup and restoration capabilities
- **Session Recovery**: Intelligent session management with automatic key recovery
- **Performance Optimized**: Debounced search, lazy loading, modular architecture
- **Keyboard Shortcuts**: Quick keyboard shortcuts for power users
- **Mobile-First Design**: Touch-optimized interface with gesture support

## 🛠️ Technology Stack

### Frontend Architecture
- **Vue.js 3** - Modern reactive framework with Composition API (`<script setup>`)
- **Pinia** - Next-generation state management for Vue
- **TinyMCE 7.9.1** - Rich text editor (fully self-hosted, 0 API costs)
- **Tailwind CSS 4** - Utility-first CSS framework with @apply component system
- **Lucide Vue Next** - Modern icon library

### Backend & Services
- **Firebase Authentication** - User authentication (Google OAuth + email/password)
- **Firebase Firestore** - NoSQL database for encrypted data storage
- **Google Generative AI** - AI-powered note enhancement (Gemini models)
- **Workbox** - Service worker for PWA functionality

### Build Tools & Development
- **Vite 6** - Lightning-fast build tool and dev server
- **ESLint 9** - JavaScript/Vue linting with modern configuration
- **Vite PWA Plugin** - Progressive Web App capabilities
- **Firebase CLI** - Deployment and hosting tools

## 📋 Prerequisites

- **Node.js** v18 or later
- **npm** or **yarn** package manager
- **Firebase project** with Firestore and Authentication enabled
- **Google AI API key** (optional, for AI features)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/[USERNAME]/secure-notes-vue.git
cd secure-notes-vue
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup

#### 3.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (optional)

#### 3.2 Enable Authentication
1. In Firebase Console: Authentication → Get started
2. Go to "Sign-in method" tab
3. Enable "Email/Password" and "Google" providers

#### 3.3 Create Firestore Database
1. In Firebase Console: Firestore Database → Create database
2. Start in test mode (we'll configure security later)
3. Select a region (e.g., europe-west1)

#### 3.4 Configure Security Rules
Copy these security rules to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own notes
    match /notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own folders
    match /folders/{folderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own settings
    match /userSettings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

**Required Firebase Configuration:**
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**Optional Security Settings:**
```env
# PBKDF2 iterations (default: 210000)
VITE_PBKDF2_ITERATIONS=210000

# Session timeout in milliseconds (default: 30 minutes)
VITE_SESSION_TIMEOUT=1800000

# Encryption version prefix (default: 'securenotes_v1_')
VITE_ENCRYPTION_VERSION=securenotes_v1_
```

Find your Firebase credentials:
1. Firebase Console → Project Settings → General
2. Scroll to "Your apps" and select your web app
3. Copy config values to your `.env` file

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/              # Vue components
│   ├── auth/               # Login and authentication
│   ├── notes/              # Note management components
│   │   ├── shared/         # Shared note components
│   │   └── layouts/        # Desktop/mobile layouts
│   ├── folders/            # Folder organization
│   ├── ai/                 # AI integration components
│   ├── layout/             # App layout and navigation
│   ├── base/               # Reusable base components
│   ├── data/               # Import/export functionality
│   └── settings/           # Application settings
├── stores/                 # Pinia state management
│   ├── auth.js            # Authentication state
│   ├── notes.js           # Notes data management
│   ├── folders.js         # Folder organization
│   ├── trash.js           # Trash/recycle bin
│   ├── ui.js              # UI state coordination
│   └── settings.js        # Application settings
├── services/              # External services
│   └── aiService.js       # Google AI integration
├── utils/                 # Utility functions
│   ├── encryption.js      # Client-side encryption
│   ├── secureStorage.js   # Encryption key management
│   └── debounce.js        # Performance utilities
├── ai-testing/            # Isolated AI testing environment
└── assets/                # Static assets
```

## 🔒 Security Architecture

### Client-Side Encryption
The application implements a robust zero-knowledge encryption model:

- **Password-based key derivation**: PBKDF2 with 210,000 iterations
- **User-specific salts**: Each user has a unique salt (`securenotes_v1_${userId}`)
- **AES-GCM encryption**: 256-bit keys with random IVs for each encryption operation
- **Firebase stores only encrypted data**: The server never sees plaintext content
- **Centralized key management**: SecureStorage utility for consistent key handling

### SecureStorage System
**Centralized Encryption Key Management** (`utils/secureStorage.js`):
- Static class managing single encryption key instance across entire application
- Automatic session timeout with configurable duration (default 30 minutes)
- Secure key storage with automatic cleanup on timeout or logout
- Vue reactivity integration with trigger system to prevent race conditions

### Session Timeout Recovery
- **Automatic Recovery**: When encryption key expires but Firebase auth persists, operations auto-retry with `authStore.recoverEncryptionKey()`
- **Graceful Degradation**: Failed recovery shows user-friendly error messages
- **Seamless UX**: Note saving continues working even after session timeout

### Database Schema

**Notes Collection** (`/notes/{noteId}`):
```javascript
{
  userId: string,                // Firebase Auth user ID
  encryptedTitle: string,        // Base64 encrypted title
  encryptedContent: string,      // Base64 encrypted HTML content
  folderId: string | null,       // Folder reference ('secure' for PIN-protected)
  isFavorite: boolean,
  isDeleted: boolean,            // Soft delete flag for trash system
  deletedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🤖 AI Integration

### Google Generative AI Models
- **Flash-Lite (`gemini-2.5-flash-lite`)**: ~1 second response time, optimized for quick interactions
- **Flash Standard (`gemini-2.5-flash`)**: ~4 seconds response time with thinking capabilities

### Real-time Streaming
- **onChunk callbacks**: Text streaming with live character counts
- **onThoughtChunk callbacks**: Real-time thinking process display
- **Button State Management**: Purple → Blue (thinking) → Green (streaming) → Emerald (complete)
- **Performance Metrics**: Console logging of timing and token counts

### AI Testing Environment
- **Isolated Testing Lab**: `src/ai-testing/` completely separate from main app
- **Access**: Test Lab button in header opens `/ai-test.html` in new window
- **Independence**: Zero dependencies on main app, dedicated testing service

## 🗑️ Trash/Recycle Bin System

**Soft Delete Implementation** with client-side management:
- **Soft Delete**: Notes marked as `isDeleted: true` instead of permanent deletion
- **30-Day Auto-Cleanup**: Automatically removes notes older than 30 days from trash
- **Restore Function**: Deleted notes can be recovered from trash
- **No Backend Required**: Pure client-side implementation using Firestore queries

## ⚡ Performance Optimizations

### Component Architecture
- **Modular NoteViewer**: Split into shared components (~311 lines total)
- **Selective Re-rendering**: Only relevant components re-render on changes
- **Component Isolation**: TinyMCE editor isolated for stability

### CSS & Bundle Optimization
- **Tailwind @apply System**: Semantic class names replace long utility strings
- **Token Reduction**: `"bg-gray-800/60 border rounded-lg p-3..."` becomes `"note-item"`
- **Reduced Bundle Size**: Centralized styling reduces CSS bundle size

### Search & Filtering
- **Debounced Search**: 300ms delay for efficient searching
- **Client-Side Filtering**: Efficient note filtering with Vue computed properties
- **Real-time Updates**: Instant results without database queries

## 📦 Build & Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (first time)
firebase init hosting

# Deploy
firebase deploy
```

### Alternative Hosting
- **Vercel**: Import GitHub repo and auto-deploy
- **Netlify**: Drag and drop `dist` folder
- **Traditional web hosting**: Upload `dist` folder contents

## 🧪 Development & Testing

### Development Commands
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint on codebase
npm run preview  # Preview production build locally
```

### AI Testing
The application includes an isolated AI testing environment accessible via the header "AI Test Lab" button.

### Code Quality
- **ESLint 9** with Vue-specific rules
- **Vue 3 Composition API** patterns throughout
- **Consistent naming conventions** across components
- **Security-first development** practices

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to branch**: `git push origin feature/AmazingFeature`
5. **Open Pull Request**

### Development Standards
- Follow Vue 3 Composition API patterns with `<script setup>`
- Use Pinia stores for state management
- Follow the existing ESLint configuration
- Write descriptive commit messages
- Test functionality thoroughly before submitting
- Maintain security standards (no hardcoded secrets)

## 🔧 Configuration

### Session Timeout
Default session timeout is 30 minutes. Adjust in `.env`:
```env
VITE_SESSION_TIMEOUT=1800000  # 30 minutes in milliseconds
```

### Encryption Strength
Adjust PBKDF2 iterations (higher = more secure but slower):
```env
VITE_PBKDF2_ITERATIONS=210000  # Default: 210,000 iterations
```

### AI Integration
Add Google AI API key for AI features:
```env
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Errors:**
- Verify all environment variables are correctly set
- Check Firebase project ID is correct
- Ensure Firestore database is created and configured

**Authentication Errors:**
- Verify Email/Password and Google authentication are enabled
- Check authorized domains are configured correctly in Firebase
- Ensure `.env` file contains correct Firebase config

**Build Errors:**
- Delete `node_modules` and run `npm install` again
- Check Node.js version is 18 or later
- Verify all required environment variables are set

**TinyMCE Issues:**
- Ensure `public/tinymce/` directory exists and is populated
- Check that `tinymce-script-src="/tinymce/tinymce.min.js"` is used (no API key)
- Verify TinyMCE files were copied from `node_modules/tinymce/` to `public/tinymce/`

## 🏷️ Version & License

**Current Version**: 1.0.0  
**License**: MIT License (see LICENSE file for details)

## 📞 Contact & Support

- **Issues & Bug Reports**: [GitHub Issues](https://github.com/[USERNAME]/secure-notes-vue/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/[USERNAME]/secure-notes-vue/discussions)
- **Security Concerns**: Please report security issues privately

## 🌟 Acknowledgments

- **Vue.js** team for the excellent framework
- **Firebase** for reliable backend infrastructure
- **TinyMCE** for powerful rich text editing
- **Google AI** for advanced language model capabilities
- **Tailwind CSS** for utility-first styling

---

**⚡ Built with ❤️ using Vue.js 3, Firebase, and client-side encryption**

*For detailed developer instructions, see `CLAUDE.md` and `ARCHITECTURE.md` files.*