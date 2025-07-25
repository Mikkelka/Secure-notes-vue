# Secure Notes Vue

![Lines of Code](https://img.shields.io/badge/lines%20of%20code-2227%20lines-blue)

En sikker notesapplikation med end-to-end kryptering, bygget med Vue.js 3, Firebase og client-side kryptering. Alle noter krypteres lokalt før de gemmes i databasen.

## ✨ Funktioner

- 🔒 **Client-side kryptering** - Dine noter er krypteret før de forlader din browser
- 📱 **Mobile-first design** - Optimeret til både desktop og mobil
- 📁 **Folder organisation** - Organiser noter i farvekodede mapper
- 🔐 **PIN-beskyttet sikker mappe** - Ekstra sikkerhed for følsomme noter
- 🤖 **AI-powered note enhancement** - Real-time streaming med Google Generative AI (Flash-Lite & Flash Standard)
- ⭐ **Favorit noter** - Markér vigtige noter som favoritter
- 🔍 **Hurtig søgning** - Debounced search med 300ms delay
- 🌙 **Mørkt tema** - Øjenskånende mørkt tema
- 📝 **Rich text editor** - TinyMCE v7.9.1 fuldt lokalt hostet (offline capable, zero cost)
- 🔄 **Session timeout** - Automatisk recovery og seamless note saving
- 🗑️ **Trash/Recycle Bin** - Soft delete med 30-day auto-cleanup og restore funktion
- 🧪 **AI Testing Lab** - Isoleret testing miljø for AI funktioner
- ⚡ **Real-time AI Streaming** - Live tekst streaming med thinking process display
- 🎨 **Tailwind @apply System** - Optimeret styling med semantic class names
- 📊 **Performance Metrics** - Console logging af AI timing og token counts
- 🔧 **Modulær Architecture** - Component-baseret design for optimal performance

## 🏗️ Arkitektur

Dette er en **self-hosted** applikation, hvilket betyder:
- Du skal sætte din egen Firebase projekt op
- Du skal selv hoste applikationen
- Du har fuld kontrol over dine data
- Ingen tredjeparter har adgang til dine noter

### 🔧 Tech Stack

- **Frontend**: Vue.js 3 med Composition API (`<script setup>` syntax)
- **State Management**: Pinia stores (auth, notes, folders, trash, ui, settings)
- **Rich Text Editor**: TinyMCE v7.9.1 - **Fuldt lokalt hostet** (offline capable, zero cost)
- **Styling**: Tailwind CSS v4 med omfattende @apply komponent patterns
- **Icons**: Lucide Vue Next
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Encryption**: Client-side AES-GCM med PBKDF2 key derivation
- **AI Integration**: Google Generative AI (Flash-Lite & Flash Standard)

### 📝 TinyMCE Lokal Implementation

**Fuldt self-hosted TinyMCE v7.9.1** - Migreret fra Tiny Cloud for at eliminere API begrænsninger:

**Lokale Assets:**
- **Core Script**: `public/tinymce/tinymce.min.js` (445KB)
- **Komplet Pakke**: Alle plugins, skins, themes kopieret fra npm pakke til `public/tinymce/`
- **Plugins**: `lists`, `link`, `autolink`, `autoresize` (til QuickNote)
- **Mørkt Tema**: `oxide-dark` skin med custom content styling

**Fordele:**
- 🚫 **Ingen 1.000 loads/måned begrænsning**
- ⚡ **Hurtigere indlæsning** (ingen CDN afhængighed)
- 🔒 **Forbedret sikkerhed** (ingen eksterne API kald)
- 💰 **Nul løbende omkostninger**
- 🌐 **Offline capable** - Editor virker uden internetforbindelse

## 📋 Forudsætninger

- Node.js (version 18 eller senere)
- npm eller yarn
- Firebase projekt
- Google Generative AI API key (optional, for AI funktioner)

## 🚀 Installation

### 1. Klon repository

```bash
git clone https://github.com/[din-bruger]/secure-notes-vue.git
cd secure-notes-vue
```

### 2. Installer dependencies

```bash
npm install
```

### 3. Firebase Setup

#### 3.1 Opret Firebase Projekt
1. Gå til [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" og følg guiden
3. Aktivér Google Analytics (optional)

#### 3.2 Aktivér Authentication
1. I Firebase Console: Authentication → Get started
2. Gå til "Sign-in method" tab
3. Aktivér "Email/Password" og "Google" providers

#### 3.3 Opret Firestore Database
1. I Firebase Console: Firestore Database → Create database
2. Vælg "Start in test mode" (vi konfigurerer sikkerhed senere)
3. Vælg en region (fx europe-west1)

#### 3.4 Aktivér Hosting
1. I Firebase Console: Hosting → Get started
2. Følg guiden for at aktivere hosting

#### 3.5 Firestore Security Rules
Kopier følgende sikkerhedsregler til Firestore:

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

### 4. Environment Variables

Kopier `.env.example` til `.env` og udfyld dine Firebase credentials:

```bash
cp .env.example .env
```

**Krævede Firebase Konfiguration:**
```env
VITE_FIREBASE_API_KEY=din-api-key
VITE_FIREBASE_AUTH_DOMAIN=dit-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dit-projekt-id
VITE_FIREBASE_STORAGE_BUCKET=dit-projekt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**Valgfrie Sikkerhedsindstillinger:**
```env
# PBKDF2 iterationer (standard: 210000)
VITE_PBKDF2_ITERATIONS=210000

# Encryption version prefix (standard: 'securenotes_v1_')
VITE_ENCRYPTION_VERSION=securenotes_v1_

# Session timeout i millisekunder (standard: 1800000ms / 30 minutter)
VITE_SESSION_TIMEOUT=1800000
```

**Google AI Integration (Optional):**
```env
# Google Generative AI API key til AI funktioner
VITE_GOOGLE_AI_API_KEY=din-google-ai-api-key
```

Find dine Firebase credentials:
1. Firebase Console → Project Settings → General
2. Scroll ned til "Your apps" og vælg din web app
3. Kopier config værdierne til din `.env` fil

**Sikkerhedsnoter:**
- Gem aldrig production `.env` filer i version control
- Brug forskellige Firebase projekter til development og production
- Rotatér API keys regelmæssigt for optimal sikkerhed

## 🔧 Development

Start development server:
```bash
npm run dev
```

Applikationen vil være tilgængelig på `http://localhost:5173`

### 👩‍💻 Development Guidelines

**Vue 3 Composition API Patterns:**
- Brug `<script setup>` syntax til alle komponenter
- Pinia stores til cross-component state management
- Reactive refs og computed properties til local state
- Consistent naming conventions på tværs af komponenter

**SecureStorage Best Practices:**
- Brug altid `SecureStorage.getEncryptionKey()` til encryption operationer
- Send aldrig encryption keys som function parametre
- Lad SecureStorage håndtere session timeout og cleanup
- Husk at trigger Vue reactivity når keys sættes: `encryptionKeyTrigger.value++`

**Security Considerations:**
- Log aldrig encryption keys eller passwords
- Brug SecureStorage til al encryption key management
- Tjek altid login type før password verification: `localStorage.getItem('loginType_${userId}')`
- Implementér automatic recovery for encryption key expiration
- Wrap encryption operationer i try-catch med recovery logic

**Tailwind CSS @apply Guidelines:**
- Refactor lange, gentagende Tailwind-klasser til @apply direktiver i `src/style.css`
- Brug semantiske klassenavne som beskriver komponenten/funktionen
- Gruppér relaterede @apply klasser sammen med kommentarer
- Prioritér @apply refactoring når du ser gentagelser af 5+ utility classes

**TinyMCE Local Development:**
- Alle TinyMCE filer i `public/tinymce/` - modificér eller slet IKKE
- Brug `tinymce-script-src="/tinymce/tinymce.min.js"` i stedet for `api-key`
- Ved version opdateringer: re-copy fra `node_modules/tinymce` til `public/tinymce/`
- Editor virker offline - ingen cloud API kald

**AI Integration Guidelines:**
- Tjek altid sessionStorage for bruger-valgt model: `sessionStorage.getItem('ai-model')`
- Brug `onChunk` og `onThoughtChunk` callbacks for real-time UI opdateringer
- Implementér purple → blue → green → emerald button progression for AI processing
- Inkludér console.log for timing og performance metrics

## 📦 Build og Deploy

### Build til produktion:
```bash
npm run build
```

### Deploy til Firebase Hosting:
```bash
# Installer Firebase CLI hvis ikke allerede installeret
npm install -g firebase-tools

# Login til Firebase
firebase login

# Initialiser Firebase i dit projekt (første gang)
firebase init hosting

# Deploy
firebase deploy
```

## 🔒 Sikkerhedsmodel

Applikationen bruger **client-side kryptering**:

- **PBKDF2 key derivation**: Bruger 210.000 iterationer
- **Bruger-specifikke salts**: Hver bruger har et unikt salt (`securenotes_v1_${userId}`)
- **AES-GCM kryptering**: 256-bit nøgler med tilfældige IVs for hver kryptering
- **Firebase gemmer kun krypteret data**: Serveren ser aldrig plaintext indhold
- **Centraliseret encryption key management**: SecureStorage utility for konsistent key håndtering

### 🔐 SecureStorage Architecture

**Centraliseret Encryption Key Management** (`utils/secureStorage.js`):
- Static class der håndterer enkelt encryption key instans på tværs af hele applikationen
- Automatisk session timeout med konfigurerbar varighed (standard 30 minutter)
- Sikker key storage med automatisk cleanup ved timeout eller logout
- Vue reactivity integration med trigger system for at forhindre race conditions

**Session Timeout Recovery:**
- **Automatisk Recovery**: Når encryption key udløber men Firebase auth forbliver aktiv, gentager operationer automatisk med `authStore.recoverEncryptionKey()`
- **Graceful Degradation**: Fejlet recovery viser brugervenlige danske fejlbeskeder
- **Seamless UX**: Noter kan gemmes problemfrit selv efter 30-minutters session timeout
- **Implementation**: Automatisk recovery implementeret i `App.vue` for `handleSaveNote()` og `handleViewerUpdate()`

**API Usage Pattern:**
```javascript
// Setting key (typisk i auth.js)
SecureStorage.setEncryptionKey(derivedKey, () => logout())
encryptionKeyTrigger.value++ // Trigger Vue reactivity

// Getting key (i enhver store)
const encryptionKey = SecureStorage.getEncryptionKey()

// Activity-based extension
SecureStorage.extendSession()
```

### 🤖 AI Integration

**Google Generative AI Integration** med to modeller til forskellige use cases:

**Produktions Modeller:**
- **Flash-Lite (`gemini-2.5-flash-lite`)**: ~1 sekund responstid, optimeret til hurtige interaktioner
- **Flash Standard (`gemini-2.5-flash`)**: ~4 sekunder responstid med thinking capabilities

**Real-time Streaming:**
- **onChunk callbacks**: Tekst streaming med live character counts
- **onThoughtChunk callbacks**: Real-time thinking proces display  
- **Button State Management**: Purple → Blue (thinking) → Green (streaming) → Emerald (complete)
- **Performance Metrics**: Console logging af timing og token counts

**Model Selection:**
- Bruger-valgt via AI Indstillinger modal
- Model valg gemt i `sessionStorage.getItem('ai-model')`
- Universal `enableThinking` toggle for begge modeller
- Session integration med settings persistence

**AI Testing Environment:**
- **Isoleret Testing Lab**: `src/ai-testing/` komplet adskilt fra hovedapp
- **Standalone Service**: Dedicated `aiTestService.js` med zero dependencies
- **Adgang**: Test Lab knap i header åbner `/ai-test.html` i nyt vindue
- **Features**: Performance metrics, begge AI modeller, streaming test

### 🗂️ Database Schema & Collections

**Firestore Collections Struktur:**

**Notes Collection** (`/notes/{noteId}`):
```javascript
{
  userId: string,                // Bruger ID fra Firebase Auth
  encryptedTitle: string,        // Base64 krypteret titel
  encryptedContent: string,      // Base64 krypteret HTML indhold
  folderId: string | null,       // Reference til folder ('secure' for PIN-beskyttet)
  isFavorite: boolean,           // Favorit status
  isDeleted: boolean,            // Soft delete flag til trash system
  deletedAt: Timestamp | null,   // Tidspunkt note blev flyttet til trash
  createdAt: Timestamp,          // Oprettelsestidspunkt
  updatedAt: Timestamp           // Sidste opdateringstidspunkt
}
```

**Folders Collection** (`/folders/{folderId}`):
```javascript
{
  userId: string,                // Bruger ID fra Firebase Auth
  encryptedName: string,         // Base64 krypteret folder navn
  color: string,                 // Color identifier til UI display
  createdAt: Timestamp,          // Oprettelsestidspunkt
  updatedAt: Timestamp           // Sidste opdateringstidspunkt
}
```

**UserSettings Collection** (`/userSettings/{userId}`):
```javascript
{
  userId: string,                // Bruger ID (bruges som document ID)
  encryptedPinHash: string,      // Krypteret PIN til sikker folder adgang
  encryptedAiSettings: string,   // Krypteret AI konfiguration
  createdAt: Timestamp,          // Oprettelsestidspunkt
  updatedAt: Timestamp           // Sidste opdateringstidspunkt
}
```

**Sikkerhed:**
- Alle brugerdata krypteres client-side før gemning
- Firebase ser kun krypteret data - aldrig plaintext
- Firestore Security Rules sikrer at brugere kun kan tilgå deres egne data

### 🗑️ Trash/Recycle Bin System

**Soft Delete Implementation** - Noter slettes ikke permanent med det samme:

**Funktionalitet:**
- **Soft Delete**: Noter markeres som `isDeleted: true` i stedet for permanent sletning
- **30-Day Auto-Cleanup**: Noter ældre end 30 dage fjernes automatisk fra trash
- **Restore Function**: Slettede noter kan gendannes fra papirkurven
- **Client-Side Only**: Ingen Firebase Functions krævet - ren client-side implementation

**Trash Operations:**
```javascript
// Disponible operationer i trash store
moveToTrash(noteId)           // Flyt note til trash
restoreNote(noteId)           // Gendan note fra trash  
permanentDeleteNote(noteId)   // Slet note permanent
emptyTrash()                  // Tøm hele papirkurven
```

**Store Architecture:**
- **Separate Store**: `src/stores/trash.js` håndterer alle trash operationer
- **Clean Architecture**: Modulær opdeling med dedicated trash store
- **Integration**: Notes store delegerer alle trash operationer til trash store
- **Count Integration**: Trash count integreret i folder sidebar

**Filtrering:**
- Aktive noter filtreres automatisk fra hoved visninger
- Trash view viser kun slettede noter (`isDeleted: true`)
- Automatisk opdatering af note counts og folder displays

### 🏗️ Component Architecture

**Modulær NoteViewer Arkitektur** - Opdelt i shared komponenter for optimal performance:

**Core Components:**
- **`NoteHeader.vue`**: Titel, folder selector, actions (favorit, delete, export)
- **`NoteContent.vue`**: Pure content display med formattering og typography  
- **`NoteEditor.vue`**: TinyMCE editing interface isoleret fra andre komponenter
- **`AiPanel.vue`**: AI processing UI med real-time streaming og button states

**Layout Wrappers:**
- **Mobile Layout**: Touch-optimeret interface med gesture support
- **Desktop Layout**: Keyboard shortcuts og multi-pane interface
- **Responsive Design**: Automatisk tilpasning mellem layouts

**Pinia Store Integration:**
- **auth.js**: Authentication state og session management
- **notes.js**: Notes data management med SecureStorage integration
- **folders.js**: Folder organisation med PIN-protected secure folder
- **trash.js**: Trash/recycle bin functionality med soft delete system
- **ui.js**: UI state coordination (mobile drawers, modals, note viewer)
- **settings.js**: Application settings med local storage persistence

**Performance Benefits:**
- **Selective Re-rendering**: Kun relevante komponenter re-renderes ved AI responses
- **Component Isolation**: TinyMCE editor isolated fra andre components for stabilitet
- **Lazy Loading**: Komponenter indlæses kun når nødvendigt
- **State Optimization**: Effektiv note filtrering med computed properties

### ⚡ Performance & Optimization

**Search Optimization:**
- **Debounced Search**: 300ms delay for efficient søgning uden at overbelaste systemet
- **Client-Side Filtering**: Effektiv note filtrering med Vue computed properties
- **Real-time Updates**: Øjeblikkeligt resultater uden database queries

**CSS & Bundle Optimization:**
- **Tailwind @apply System**: Semantic class names erstatter lange utility class strings
- **Token Reduction**: `"bg-gray-800/60 border rounded-lg p-3..."` bliver til `"note-item"`
- **Reduced Bundle Size**: Centraliseret styling i `src/style.css` reducerer CSS bundle størrelse
- **Maintainability**: Konsistent styling på tværs af hele applikationen

**Mobile Touch Optimization:**
- **Touch Action**: `touch-action: manipulation` for responsive interactions
- **Touch Targets**: Minimum 44-48px touch targets for accessibility compliance
- **Gesture Support**: Native mobile gestures til navigation og actions
- **Viewport Optimization**: Optimal viewport konfiguration for mobile enheder

**Component Performance:**
- **Modulær Architecture**: NoteViewer opdelt i dedikerede komponenter (~311 linjer total)
- **Efficient Re-rendering**: Kun componenter der berøres af ændringer re-renderes
- **State Management**: Pinia stores optimeret til minimal re-computation
- **Memory Management**: Automatisk cleanup ved component unmount

**Encryption Performance:**
- **PBKDF2 Iterations**: 210.000 iterationer balanceret mellem sikkerhed og performance
- **Batch Operations**: Effektive batch updates til Firestore
- **Session Caching**: Encryption keys cached i session for hurtige operationer
- **Background Processing**: Ikke-kritiske operationer køres i background

## 🌍 Hosting Alternativer

Du kan hoste applikationen på:
- **Firebase Hosting** (anbefalet - letteste setup)
- **Vercel** - Importer GitHub repo og deploy
- **Netlify** - Træk og slip `dist` mappen
- **Traditionel webhosting** - Upload `dist` mappen

## 🔧 Configuration

### Session Timeout
Standard session timeout er 30 minutter. Juster i `.env`:
```
VITE_SESSION_TIMEOUT=1800000
```

### Encryption Iterations
Juster PBKDF2 iterationer (højere = mere sikker, men langsommere):
```
VITE_PBKDF2_ITERATIONS=210000
```

## 📱 Mobile Support

Applikationen er optimeret til mobile enheder med:
- Touch-optimeret interface
- Responsive design
- Mobile-first navigation
- Gesture support

## 🐛 Fejlfinding

### Almindelige problemer:

**Firebase connection fejl:**
- Tjek at alle environment variables er korrekt sat
- Verificer at Firebase projekt ID er korrekt
- Tjek at Firestore database er oprettet

**Authentication fejl:**
- Tjek at Email/Password og Google authentication er aktiveret
- Verificer at authorized domains er konfigureret korrekt

**Build fejl:**
- Slet `node_modules` og kør `npm install` igen
- Tjek at Node.js version er 18 eller nyere

## 🤝 Bidrag

Bidrag er velkomne! Opret gerne issues og pull requests.

## 📄 Licens

MIT License - se LICENSE fil for detaljer.

## 🏷️ Version

Nuværende version: 0.13.1

---

*Bygget med ❤️ og Vue.js 3*