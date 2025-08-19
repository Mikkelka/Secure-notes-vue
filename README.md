# Sikre Noter - Secure Notes Vue

[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Lines of Code](https://img.shields.io/badge/lines%20of%20code-2227%20lines-blue?style=for-the-badge)](.)

A modern, secure note-taking application built with Vue.js 3 and Firebase, implementing client-side encryption for maximum data security. Features Danish UI with offline capabilities and AI integration.

## 🔐 Security First

**End-to-end encryption** implemented directly in the browser:
- **Client-side encryption**: Notes encrypted locally before Firebase storage
- **PBKDF2 key derivation**: 210,000 iterations with user-specific salts  
- **AES-GCM encryption**: 256-bit keys with random IVs
- **Session timeout**: Automatic logout after 30 minutes with recovery
- **Zero-knowledge**: Server never sees unencrypted data

## ✨ Core Features

### 📝 Note Management
- **Rich Text Editor**: TinyMCE v7.9.1 (self-hosted, offline capable)
- **Folder Organization**: Customizable colored folders with PIN-protected secure folder
- **Search & Favorites**: Full-text search with 300ms debounce and favorites system
- **Trash System**: 30-day soft delete with restore functionality

### 🤖 AI Integration  
- **Google Generative AI**: Gemini 2.5 Flash models with real-time streaming
- **Dual Models**: Flash-Lite (~1s) and Flash Standard (~4s with thinking)
- **Customizable Prompts**: User-defined AI instructions
- **Testing Lab**: Isolated AI testing environment

### 📱 Modern Experience
- **Progressive Web App**: Install as native app on any platform
- **Responsive Design**: Touch-optimized with 44-48px minimum targets
- **Danish UI**: Complete Danish language support
- **Theme Support**: Automatic dark/light mode switching

## 🛠️ Technology Stack

**Frontend:**
- Vue.js 3 with Composition API, Pinia state management
- TinyMCE 7.9.1, Tailwind CSS 4, Lucide icons

**Backend & Services:**  
- Firebase Authentication & Firestore
- Google Generative AI (Gemini models)
- Workbox PWA capabilities

**Development:**
- Vite 6, ESLint 9, Firebase CLI

## 🚀 Quick Start

### Prerequisites
- Node.js v18+, npm/yarn
- Firebase project with Firestore and Authentication
- Google AI API key (optional)

### 1. Setup Project
```bash
git clone https://github.com/[USERNAME]/secure-notes-vue.git
cd secure-notes-vue
npm install
```

### 2. Firebase Configuration

**Create Firebase Project:**
1. [Firebase Console](https://console.firebase.google.com/) → Add project
2. Authentication → Enable Email/Password and Google providers  
3. Firestore Database → Create in test mode
4. Apply security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    match /userSettings/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### 3. Environment Setup
```bash
cp .env.example .env
```

**Required configuration:**
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com  
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Optional
VITE_GOOGLE_AI_API_KEY=your_google_ai_key
VITE_PBKDF2_ITERATIONS=210000
VITE_SESSION_TIMEOUT=1800000
```

### 4. Start Development
```bash
npm run dev  # http://localhost:5173
```

## 🏗️ Architecture

```
src/
├── components/
│   ├── auth/              # Authentication
│   ├── notes/             # Note management  
│   ├── folders/           # Organization
│   ├── ai/               # AI integration
│   └── layout/           # App structure
├── stores/               # Pinia state
├── services/             # External APIs
├── utils/                # Encryption & utilities
└── ai-testing/          # Isolated AI lab
```

### Security Implementation
**SecureStorage System** manages encryption across the app:
- Single encryption key instance with automatic session timeout
- PBKDF2 key derivation with user-specific salts  
- AES-GCM with random IVs for each operation
- Graceful session recovery on timeout

**Database Schema:**
```javascript
// /notes/{noteId}
{
  userId: string,
  encryptedTitle: string,     // Base64 encrypted
  encryptedContent: string,   // Base64 encrypted HTML
  folderId: string | null,    // 'secure' for PIN-protected
  isFavorite: boolean,
  isDeleted: boolean,         // Soft delete for trash
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## ⚡ Performance Features

- **Debounced Search**: 300ms delay for efficient searching
- **Modular Components**: Split NoteViewer reduces re-renders
- **CSS Optimization**: Tailwind @apply system reduces bundle size
- **Client-Side Filtering**: No database queries for search/filter

## 📦 Build & Deploy

```bash
npm run build              # Production build
npm run lint              # Code quality check  
npm run preview           # Preview build locally

# Deploy to Firebase
firebase login
firebase init hosting
firebase deploy
```

## 🔧 Advanced Configuration

**Session & Security:**
```env
VITE_SESSION_TIMEOUT=1800000      # 30 min timeout
VITE_PBKDF2_ITERATIONS=210000     # Encryption strength
VITE_ENCRYPTION_VERSION=securenotes_v1_
```

**AI Features:**
```env  
VITE_GOOGLE_AI_API_KEY=your_key   # Enable AI integration
```

## 🐛 Common Issues

**Firebase Errors:**
- Verify environment variables and project ID
- Check Firestore database creation and security rules
- Ensure authentication providers are enabled

**Build Issues:**
- Delete `node_modules`, run `npm install`
- Check Node.js version (18+)
- Verify TinyMCE files in `public/tinymce/`

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Follow Vue 3 Composition API patterns
4. Use existing ESLint configuration
5. Test thoroughly before submitting PR

## 📄 License & Contact

**License:** MIT  
**Issues:** [GitHub Issues](https://github.com/[USERNAME]/secure-notes-vue/issues)  
**Security:** Report privately for security concerns

---

**⚡ Built with Vue.js 3, Firebase, and client-side encryption**