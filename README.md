# Secure Notes Vue

![Lines of Code](https://img.shields.io/badge/lines%20of%20code-2227%20lines-blue)

En sikker notesapplikation med end-to-end kryptering, bygget med Vue.js 3, Firebase og client-side kryptering. Alle noter krypteres lokalt før de gemmes i databasen.

## ✨ Funktioner

- 🔒 **Client-side kryptering** - Dine noter er krypteret før de forlader din browser
- 📱 **Mobile-first design** - Optimeret til både desktop og mobil
- 📁 **Folder organisation** - Organiser noter i farvekodede mapper
- 🔐 **PIN-beskyttet sikker mappe** - Ekstra sikkerhed for følsomme noter
- 🤖 **AI-powered note enhancement** - Forbedre noter med Google Generative AI
- ⭐ **Favorit noter** - Markér vigtige noter som favoritter
- 🔍 **Hurtig søgning** - Søg gennem alle dine noter
- 🌙 **Mørkt tema** - Øjenskånende mørkt tema
- 📝 **Rich text editor** - Formatér noter med TinyMCE editor
- 🔄 **Session timeout** - Automatisk logout for sikkerhed

## 🏗️ Arkitektur

Dette er en **self-hosted** applikation, hvilket betyder:
- Du skal sætte din egen Firebase projekt op
- Du skal selv hoste applikationen
- Du har fuld kontrol over dine data
- Ingen tredjeparter har adgang til dine noter

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

Find dine Firebase credentials:
1. Firebase Console → Project Settings → General
2. Scroll ned til "Your apps" og vælg din web app
3. Kopier config værdierne til din `.env` fil

## 🔧 Development

Start development server:
```bash
npm run dev
```

Applikationen vil være tilgængelig på `http://localhost:5173`

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
- **Bruger-specifikke salts**: Hver bruger har et unikt salt
- **AES-GCM kryptering**: 256-bit nøgler med tilfældige IVs
- **Firebase gemmer kun krypteret data**: Serveren ser aldrig plaintext indhold

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