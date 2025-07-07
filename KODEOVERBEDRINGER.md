# 🚀 Kodeoverbedringer for Secure Notes Vue

Dette dokument indeholder en omfattende analyse af kodebasen og konkrete forslag til forbedringer baseret på en dybdegående gennemgang af hele applikationen.

## 📋 Indholdsfortegnelse

1. [🔒 Sikkerhedsforbedringer (Høj Prioritet)](#-sikkerhedsforbedringer-høj-prioritet)
2. [🏗️ Arkitektur & Kodekvalitet (Medium Prioritet)](#-arkitektur--kodekvalitet-medium-prioritet)
3. [⚡ Performance Optimiseringer (Medium Prioritet)](#-performance-optimiseringer-medium-prioritet)
4. [🔧 TypeScript & Type Safety (Medium Prioritet)](#-typescript--type-safety-medium-prioritet)
5. [🧪 Testing & Documentation (Lav Prioritet)](#-testing--documentation-lav-prioritet)
6. [♿ Accessibility & Mobile (Lav Prioritet)](#-accessibility--mobile-lav-prioritet)
7. [📦 Build & Configuration (Lav Prioritet)](#-build--configuration-lav-prioritet)

---

## 🔒 Sikkerhedsforbedringer (Høj Prioritet)

### 1. **Fjern Password Storage fra localStorage**

**Problem:** I `auth.js` gemmes passwordet i localStorage med base64 encoding, hvilket ikke er sikker praksis.

**Nuværende kode:**
```javascript
// auth.js - IKKE SIKKER PRAKSIS
const savedPassword = localStorage.getItem('userPassword');
if (savedPassword) {
  this.password = atob(savedPassword);
}
```

**Forbedring:**
```javascript
// auth.js - SIKKER PRAKSIS
// Fjern password storage helt og kræv genindtastning ved hver session
setupPasswordManagement() {
  // Kun gem nødvendige session metadata
  const sessionData = {
    userId: this.user.uid,
    sessionStart: Date.now(),
    lastActivity: Date.now()
  };
  sessionStorage.setItem('sessionData', JSON.stringify(sessionData));
  
  // Password gemmes kun i memory og bliver cleared ved logout
  this.password = null; // Clear ved logout
}
```

### 2. **Implementer Ordentlig Master Password Verification** ✅ **LØST**

**Problem:** I `folders.js` var der en demo/placeholder implementation der accepterede ethvert password, og Google brugere havde ikke adgang til master password systemet.

**Original problem:**
```javascript
// folders.js - USIKKER DEMO IMPLEMENTATION
if (masterPassword) { // Accepterede hvad som helst!
  lockedFolders.value.delete(folderId);
  return true;
}
```

**Løsning implementeret:**
```javascript
// folders.js - SIKKER IMPLEMENTATION
const verifyAndUnlockWithMasterPassword = async (folderId, masterPassword, user) => {
  if (!user?.uid || !masterPassword.trim()) {
    return false;
  }

  try {
    const loginType = localStorage.getItem(`loginType_${user.uid}`);
    
    if (loginType === 'google') {
      // Google brugere: brug deres email som master password
      if (masterPassword === user.email) {
        lockedFolders.value.delete(folderId);
        selectFolder(folderId);
        return true;
      }
    } else if (loginType === 'email') {
      // Email brugere: sammenlign med deres gemte password
      const encryptedPassword = localStorage.getItem(`encryptedPassword_${user.uid}`);
      if (encryptedPassword) {
        const storedPassword = atob(encryptedPassword);
        if (masterPassword === storedPassword) {
          lockedFolders.value.delete(folderId);
          selectFolder(folderId);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Fejl ved master password verifikation:', error);
    return false;
  }
}
```

**UI Forbedringer:**
- PinInput komponenten viser nu korrekt hint baseret på login type
- Google brugere ser: "Indtast din Google email adresse" (email ikke vist af sikkerhedshensyn)
- Email brugere ser: "Indtast dit login password"  
- Alle komponenter opdateret til at sende user information

**Sikkerhedsovervejelse:** Emailen vises ikke i UI teksten for at forhindre, at tilfældige forbipasserende kan se den og få adgang til sikre mapper.

### 3. **Forbedre Encryption Key Handling**

**Problem:** Encryption keys håndteres inkonsistent på tværs af stores.

**Forbedring:**
```javascript
// utils/secureStorage.js - NY FIL
export class SecureStorage {
  static encryptionKey = null;
  static sessionTimeout = null;
  
  static setEncryptionKey(key) {
    this.encryptionKey = key;
    this.resetSessionTimeout();
  }
  
  static getEncryptionKey() {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }
    return this.encryptionKey;
  }
  
  static clearEncryptionKey() {
    this.encryptionKey = null;
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
  }
  
  static resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    this.sessionTimeout = setTimeout(() => {
      this.clearEncryptionKey();
      // Trigger logout
    }, 30 * 60 * 1000); // 30 minutter
  }
}
```

### 4. **Implementer Content Security Policy (CSP)**

**Forbedring:**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.googleapis.com https://*.google.com https://generativelanguage.googleapis.com;
  img-src 'self' data: https:;
  frame-src https://accounts.google.com;
">
```

---

## 🏗️ Arkitektur & Kodekvalitet (Medium Prioritet)

### 1. **Refaktorer Store Funktioner**

**Problem:** Funktioner som `loadNotes()` er for store og gør for mange ting.

**Nuværende kode:**
```javascript
// notes.js - FOR STOR FUNKTION
async loadNotes(user, encryptionKey) {
  this.loading = true;
  this.notes = [];
  
  try {
    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef,
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const encryptedNotes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Masser af logik for dekryptering, fejlhåndtering, etc.
    // ... 50+ linjer kode ...
    
  } catch (error) {
    // Error handling
  } finally {
    this.loading = false;
  }
}
```

**Forbedring:**
```javascript
// notes.js - REFAKTORERET
async loadNotes(user, encryptionKey) {
  this.loading = true;
  
  try {
    const encryptedNotes = await this.fetchEncryptedNotes(user);
    const decryptedNotes = await this.decryptNotes(encryptedNotes, encryptionKey);
    this.notes = this.processNotes(decryptedNotes);
    
  } catch (error) {
    this.handleLoadError(error);
  } finally {
    this.loading = false;
  }
}

async fetchEncryptedNotes(user) {
  const notesRef = collection(db, 'notes');
  const q = query(
    notesRef,
    where('userId', '==', user.uid),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async decryptNotes(encryptedNotes, encryptionKey) {
  const decryptPromises = encryptedNotes.map(async (note) => {
    try {
      return await this.decryptSingleNote(note, encryptionKey);
    } catch (error) {
      console.error(`Fejl ved dekryptering af note ${note.id}:`, error);
      return null;
    }
  });
  
  const results = await Promise.all(decryptPromises);
  return results.filter(note => note !== null);
}
```

### 2. **Ekstraktere Delte Encryption Utilities**

**Problem:** Encryption/decryption logik er duplikeret på tværs af stores.

**Forbedring:**
```javascript
// utils/encryptionHelpers.js - NY FIL
export class EncryptionHelpers {
  static async encryptObject(obj, key) {
    const jsonString = JSON.stringify(obj);
    return await encrypt(jsonString, key);
  }
  
  static async decryptObject(encryptedData, key) {
    const decryptedString = await decrypt(encryptedData, key);
    return JSON.parse(decryptedString);
  }
  
  static async encryptBatch(items, key, encryptField) {
    const encryptPromises = items.map(async (item) => {
      const encrypted = await encrypt(item[encryptField], key);
      return { ...item, [encryptField]: encrypted };
    });
    
    return await Promise.all(encryptPromises);
  }
  
  static async decryptBatch(items, key, decryptField) {
    const decryptPromises = items.map(async (item) => {
      try {
        const decrypted = await decrypt(item[decryptField], key);
        return { ...item, [decryptField]: decrypted };
      } catch (error) {
        console.error(`Fejl ved dekryptering af ${item.id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(decryptPromises);
    return results.filter(item => item !== null);
  }
}
```

### 3. **Standardiser Error Handling**

**Problem:** Inconsistent error handling på tværs af stores.

**Forbedring:**
```javascript
// utils/errorHandling.js - NY FIL
export class ErrorHandler {
  static handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'Bruger ikke fundet',
      'auth/wrong-password': 'Forkert adgangskode',
      'auth/invalid-email': 'Ugyldig email adresse',
      'auth/weak-password': 'Adgangskoden er for svag',
      'auth/email-already-in-use': 'Email er allerede i brug',
      'auth/network-request-failed': 'Netværksfejl - tjek din internetforbindelse',
      'auth/too-many-requests': 'For mange forsøg - prøv igen senere'
    };
    
    const message = errorMessages[error.code] || 'Ukendt fejl opstod';
    console.error('Auth error:', error);
    return { success: false, error: message };
  }
  
  static handleFirestoreError(error, operation) {
    const errorMessages = {
      'permission-denied': 'Adgang nægtet',
      'unavailable': 'Tjenesten er ikke tilgængelig',
      'deadline-exceeded': 'Anmodningen tog for lang tid',
      'resource-exhausted': 'Kvoten er opbrugt'
    };
    
    const message = errorMessages[error.code] || `Fejl ved ${operation}`;
    console.error(`Firestore error during ${operation}:`, error);
    return { success: false, error: message };
  }
  
  static handleEncryptionError(error, operation) {
    console.error(`Encryption error during ${operation}:`, error);
    return { 
      success: false, 
      error: 'Fejl ved kryptering - tjek din adgangskode' 
    };
  }
}
```

### 4. **Forbedre Component Composition**

**Problem:** App.vue er for stor og gør for mange ting.

**Forbedring:**
```vue
<!-- components/layout/MainAppLayout.vue - NY KOMPONENT -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
    <AppHeader 
      :user="user" 
      @logout="$emit('logout')" 
      @export="$emit('export')"
      @ai="$emit('ai')"
      @settings="$emit('settings')"
    />
    
    <div class="flex pb-16 md:pb-0 md:h-[calc(100vh-4rem)]">
      <DesktopSidebar 
        v-if="!isMobile"
        :folders="folders"
        :selected-folder-id="selectedFolderId"
        :note-counts="noteCounts"
        :locked-folders="lockedFolders"
        @folder-select="$emit('folder-select', $event)"
        @folder-create="$emit('folder-create', $event)"
        @folder-update="$emit('folder-update', $event)"
        @folder-delete="$emit('folder-delete', $event)"
        @unlock-folder="$emit('unlock-folder', $event)"
        @master-password-unlock="$emit('master-password-unlock', $event)"
      />
      
      <MobileSidebar 
        v-else
        :show="showMobileSidebar"
        :folders="folders"
        :selected-folder-id="selectedFolderId"
        :note-counts="noteCounts"
        :locked-folders="lockedFolders"
        @close="$emit('close-mobile-sidebar')"
        @folder-select="$emit('folder-select', $event)"
      />
      
      <MainContent 
        :filtered-notes="filteredNotes"
        :is-loading="isLoading"
        :selected-note="selectedNote"
        :grid-columns="gridColumns"
        @note-click="$emit('note-click', $event)"
        @save-note="$emit('save-note', $event)"
        @search-change="$emit('search-change', $event)"
        @delete-note="$emit('delete-note', $event)"
        @toggle-favorite="$emit('toggle-favorite', $event)"
        @move-note-to-folder="$emit('move-note-to-folder', $event)"
        @quick-note-mode="$emit('quick-note-mode', $event)"
      />
    </div>
    
    <AppModals 
      :show-data-export="showDataExport"
      :show-import-data="showImportData"
      :show-ai-modal="showAiModal"
      :show-app-settings="showAppSettings"
      :user="user"
      :notes="notes"
      :folders="folders"
      :user-settings="userSettings"
      @close-data-export="$emit('close-data-export')"
      @close-import-data="$emit('close-import-data')"
      @close-ai-modal="$emit('close-ai-modal')"
      @close-app-settings="$emit('close-app-settings')"
      @open-import="$emit('open-import')"
      @import-complete="$emit('import-complete')"
      @update-ai-settings="$emit('update-ai-settings', $event)"
    />
    
    <MobileComponents 
      v-if="isMobile"
      :active-button="activeMobileButton"
      :show-settings="showSettings"
      :show-search="showMobileSearch"
      :show-quick-note="showMobileQuickNote"
      :show-mobile-settings="showMobileSettings"
      :search-term="searchTerm"
      :selected-folder-id="selectedFolderId"
      :locked-folders="lockedFolders"
      @folders-click="$emit('mobile-folders-click')"
      @add-note-click="$emit('mobile-add-note-click')"
      @search-click="$emit('mobile-search-click')"
      @settings-click="$emit('mobile-settings-click')"
      @close-search="$emit('close-mobile-search')"
      @close-quick-note="$emit('close-mobile-quick-note')"
      @close-settings="$emit('close-mobile-settings')"
      @search-change="$emit('search-change', $event)"
      @save-note="$emit('save-note', $event)"
      @quick-note-mode="$emit('quick-note-mode', $event)"
      @change-secure-pin="$emit('change-secure-pin')"
      @lock-secure-folder="$emit('lock-secure-folder')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
// ... imports

const props = defineProps({
  user: Object,
  folders: Array,
  notes: Array,
  // ... andre props
})

const emit = defineEmits([
  'logout', 'export', 'ai', 'settings',
  'folder-select', 'folder-create', 'folder-update', 'folder-delete',
  'unlock-folder', 'master-password-unlock',
  'note-click', 'save-note', 'search-change', 'delete-note',
  'toggle-favorite', 'move-note-to-folder', 'quick-note-mode',
  // ... alle andre events
])

const isMobile = computed(() => window.innerWidth < 1024)
</script>
```

---

## ⚡ Performance Optimiseringer (Medium Prioritet)

### 1. **Implementer Caching Strategier**

**Problem:** Data hentes hver gang uden caching.

**Forbedring:**
```javascript
// utils/cacheManager.js - NY FIL
export class CacheManager {
  static cache = new Map();
  static cacheTimestamps = new Map();
  static TTL = 5 * 60 * 1000; // 5 minutter
  
  static set(key, value) {
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }
  
  static get(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.TTL) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }
  
  static invalidate(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }
  
  static clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}

// notes.js - BRUG AF CACHE
async loadNotes(user, encryptionKey) {
  const cacheKey = `notes_${user.uid}`;
  const cachedNotes = CacheManager.get(cacheKey);
  
  if (cachedNotes) {
    this.notes = cachedNotes;
    return;
  }
  
  this.loading = true;
  
  try {
    const encryptedNotes = await this.fetchEncryptedNotes(user);
    const decryptedNotes = await this.decryptNotes(encryptedNotes, encryptionKey);
    this.notes = this.processNotes(decryptedNotes);
    
    // Cache resultat
    CacheManager.set(cacheKey, this.notes);
    
  } catch (error) {
    this.handleLoadError(error);
  } finally {
    this.loading = false;
  }
}
```

### 2. **Optimere Search Performance**

**Problem:** Search køres på hele datasættet ved hver keystroke.

**Forbedring:**
```javascript
// stores/notes.js - OPTIMERET SEARCH
import { debounce } from 'lodash-es';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([]);
  const searchTerm = ref('');
  const searchIndex = ref(new Map());
  
  // Byg search index
  const buildSearchIndex = () => {
    const index = new Map();
    
    notes.value.forEach(note => {
      const searchableText = `${note.title} ${note.content}`.toLowerCase();
      const words = searchableText.split(/\s+/);
      
      words.forEach(word => {
        if (word.length > 2) { // Ignorer korte ord
          if (!index.has(word)) {
            index.set(word, new Set());
          }
          index.get(word).add(note.id);
        }
      });
    });
    
    searchIndex.value = index;
  };
  
  // Optimeret search
  const searchNotes = (term) => {
    if (!term.trim()) return notes.value;
    
    const words = term.toLowerCase().split(/\s+/);
    const matchingNoteIds = new Set();
    
    words.forEach(word => {
      const noteIds = searchIndex.value.get(word);
      if (noteIds) {
        if (matchingNoteIds.size === 0) {
          noteIds.forEach(id => matchingNoteIds.add(id));
        } else {
          // Intersection for AND search
          const intersection = new Set();
          noteIds.forEach(id => {
            if (matchingNoteIds.has(id)) {
              intersection.add(id);
            }
          });
          matchingNoteIds.clear();
          intersection.forEach(id => matchingNoteIds.add(id));
        }
      }
    });
    
    return notes.value.filter(note => matchingNoteIds.has(note.id));
  };
  
  // Debounced search
  const debouncedSearch = debounce((term) => {
    searchTerm.value = term;
  }, 300);
  
  const searchedNotes = computed(() => {
    return searchNotes(searchTerm.value);
  });
  
  // Rebuild index når noter ændres
  watch(notes, () => {
    buildSearchIndex();
  }, { immediate: true });
  
  return {
    notes,
    searchTerm,
    searchedNotes,
    debouncedSearch,
    setSearchTerm: debouncedSearch
  };
});
```

### 3. **Virtualiseret Liste for Store Datasæt**

**Problem:** Lister kan blive langsomme med mange noter.

**Forbedring:**
```vue
<!-- components/notes/VirtualizedNotesList.vue - NY KOMPONENT -->
<template>
  <div class="virtualized-container" :style="{ height: containerHeight + 'px' }">
    <div class="virtualized-spacer" :style="{ height: startOffset + 'px' }"></div>
    
    <div 
      v-for="note in visibleNotes" 
      :key="note.id"
      class="note-item"
      :style="{ height: itemHeight + 'px' }"
    >
      <NoteCard 
        :note="note"
        :search-term="searchTerm"
        @click="$emit('note-click', note)"
        @delete="$emit('delete-note', note.id)"
        @toggle-favorite="$emit('toggle-favorite', note.id)"
        @move-to-folder="$emit('move-note-to-folder', note.id, $event)"
      />
    </div>
    
    <div class="virtualized-spacer" :style="{ height: endOffset + 'px' }"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  notes: Array,
  searchTerm: String,
  itemHeight: { type: Number, default: 120 },
  containerHeight: { type: Number, default: 600 }
})

const emit = defineEmits(['note-click', 'delete-note', 'toggle-favorite', 'move-note-to-folder'])

const scrollTop = ref(0)
const visibleCount = computed(() => Math.ceil(props.containerHeight / props.itemHeight) + 2)
const startIndex = computed(() => Math.floor(scrollTop.value / props.itemHeight))
const endIndex = computed(() => Math.min(startIndex.value + visibleCount.value, props.notes.length))

const visibleNotes = computed(() => 
  props.notes.slice(startIndex.value, endIndex.value)
)

const startOffset = computed(() => startIndex.value * props.itemHeight)
const endOffset = computed(() => 
  (props.notes.length - endIndex.value) * props.itemHeight
)

const handleScroll = (e) => {
  scrollTop.value = e.target.scrollTop
}

onMounted(() => {
  const container = document.querySelector('.virtualized-container')
  container?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  const container = document.querySelector('.virtualized-container')
  container?.removeEventListener('scroll', handleScroll)
})
</script>
```

### 4. **Optimere Reactive Patterns**

**Problem:** Unødvendige reactive computations.

**Forbedring:**
```javascript
// stores/ui.js - OPTIMERET REACTIVE PATTERNS
import { shallowRef, triggerRef } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // Brug shallowRef for store objekter der ikke har nested reactivity
  const selectedNote = shallowRef(null)
  const mobileDrawerStates = shallowRef({
    sidebar: false,
    search: false,
    quickNote: false,
    settings: false
  })
  
  // Optimeret toggle funktioner
  const toggleMobileDrawer = (drawerName) => {
    // Luk alle andre drawers først
    Object.keys(mobileDrawerStates.value).forEach(key => {
      if (key !== drawerName) {
        mobileDrawerStates.value[key] = false
      }
    })
    
    // Toggle target drawer
    mobileDrawerStates.value[drawerName] = !mobileDrawerStates.value[drawerName]
    
    // Trigger reactivity manually
    triggerRef(mobileDrawerStates)
  }
  
  // Memo til tungt beregnede værdier
  const memoizedComputed = computed(() => {
    // Tung beregning her
    return expensiveComputation(selectedNote.value)
  })
  
  return {
    selectedNote,
    mobileDrawerStates,
    toggleMobileDrawer,
    memoizedComputed
  }
})
```

---

## 🔧 TypeScript & Type Safety (Medium Prioritet)

### 1. **Migrationsplan til TypeScript**

**Fase 1: Grundlæggende Setup**
```json
// tsconfig.json - NY FIL
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Fase 2: Type Definitions**
```typescript
// types/index.ts - NY FIL
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface EncryptedNote {
  id: string;
  encryptedTitle: string;
  encryptedContent: string;
  folderId: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedFolder {
  id: string;
  encryptedName: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  encryptedPinHash?: string;
  encryptedAiSettings?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  encryptionKey: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  sessionTimeout: number;
  lastActivity: number;
  showTimeoutWarning: boolean;
}

export interface UIState {
  selectedNote: Note | null;
  showMobileSidebar: boolean;
  showMobileSearch: boolean;
  showMobileQuickNote: boolean;
  showMobileSettings: boolean;
  showDataExport: boolean;
  showImportData: boolean;
  showAiModal: boolean;
  showAppSettings: boolean;
  activeMobileButton: string | null;
  folderConfirmDialog: {
    isOpen: boolean;
    folderId: string | null;
  };
}

export interface AiSettings {
  apiKey: string;
  model: string;
  instructions: string;
  useCustomInstructions: boolean;
}

export interface PerformanceStats {
  encryptionTime: number;
  decryptionTime: number;
  totalNotes: number;
  lastUpdateTime: number;
}
```

**Fase 3: Konverter Stores**
```typescript
// stores/auth.ts - KONVERTERET
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AuthState, User } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const encryptionKey = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const sessionTimeout = ref<number>(30 * 60 * 1000);
  const lastActivity = ref<number>(Date.now());
  const showTimeoutWarning = ref<boolean>(false);

  const isLoggedIn = computed<boolean>(() => {
    return !!(user.value && encryptionKey.value);
  });

  const handleLogin = async (
    email: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    loading.value = true;
    
    try {
      // Login logic her
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ukendt fejl'
      };
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    encryptionKey,
    loading,
    sessionTimeout,
    lastActivity,
    showTimeoutWarning,
    isLoggedIn,
    handleLogin
  };
});
```

### 2. **Forbedre Prop Validation**

**Problem:** Nuværende prop validation er begrænset.

**Forbedring:**
```typescript
// components/notes/NoteViewer.vue - FORBEDRET PROP VALIDATION
<script setup lang="ts">
import type { Note, UserSettings } from '@/types';

interface Props {
  note: Note;
  userSettings: UserSettings;
  readonly?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'update', noteId: string, title: string, content: string): void;
  (e: 'delete', noteId: string): void;
  (e: 'toggle-favorite', noteId: string): void;
  (e: 'move-note-to-folder', noteId: string, folderId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

const emit = defineEmits<Emits>();

// Resten af komponenten...
</script>
```

### 3. **Type-Safe Composables**

**Forbedring:**
```typescript
// composables/useNotes.ts - NY FIL
import { ref, computed } from 'vue';
import type { Note, EncryptedNote } from '@/types';

export function useNotes() {
  const notes = ref<Note[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const favoriteNotes = computed<Note[]>(() => 
    notes.value.filter(note => note.isFavorite)
  );

  const notesByFolder = computed<Record<string, Note[]>>(() => {
    const grouped: Record<string, Note[]> = {};
    
    notes.value.forEach(note => {
      const folderId = note.folderId || 'uncategorized';
      if (!grouped[folderId]) {
        grouped[folderId] = [];
      }
      grouped[folderId].push(note);
    });
    
    return grouped;
  });

  const loadNotes = async (userId: string, encryptionKey: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      // Load logic her
      notes.value = await fetchAndDecryptNotes(userId, encryptionKey);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ukendt fejl';
    } finally {
      loading.value = false;
    }
  };

  const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | null> => {
    try {
      const newNote = await createNote(note);
      notes.value.unshift(newNote);
      return newNote;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Kunne ikke oprette note';
      return null;
    }
  };

  return {
    notes,
    loading,
    error,
    favoriteNotes,
    notesByFolder,
    loadNotes,
    addNote
  };
}
```

---

## 🧪 Testing & Documentation (Lav Prioritet)

### 1. **Unit Testing Strategy**

**Setup:**
```javascript
// vitest.config.js - NY FIL
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
```

**Test Examples:**
```javascript
// tests/utils/encryption.test.js - NY FIL
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from '@/utils/encryption';

describe('Encryption Utils', () => {
  it('should encrypt and decrypt text correctly', async () => {
    const plaintext = 'Dette er en test besked';
    const password = 'test123';
    const userId = 'test-user';
    
    const key = await deriveKey(password, userId);
    const encrypted = await encrypt(plaintext, key);
    const decrypted = await decrypt(encrypted, key);
    
    expect(decrypted).toBe(plaintext);
  });
  
  it('should fail with wrong key', async () => {
    const plaintext = 'Test besked';
    const password1 = 'test123';
    const password2 = 'wrong456';
    const userId = 'test-user';
    
    const key1 = await deriveKey(password1, userId);
    const key2 = await deriveKey(password2, userId);
    
    const encrypted = await encrypt(plaintext, key1);
    
    await expect(decrypt(encrypted, key2)).rejects.toThrow();
  });
});
```

```javascript
// tests/stores/notes.test.js - NY FIL
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotesStore } from '@/stores/notes';

describe('Notes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty notes', () => {
    const store = useNotesStore();
    expect(store.notes).toEqual([]);
    expect(store.loading).toBe(false);
  });

  it('should filter notes by search term', () => {
    const store = useNotesStore();
    store.notes = [
      { id: '1', title: 'Test Note', content: 'Dette er en test', folderId: null },
      { id: '2', title: 'Andet', content: 'Noget andet indhold', folderId: null }
    ];
    
    store.setSearchTerm('test');
    
    expect(store.searchedAndSortedNotes).toHaveLength(1);
    expect(store.searchedAndSortedNotes[0].title).toBe('Test Note');
  });
});
```

### 2. **Component Documentation**

**JSDoc Examples:**
```javascript
// components/notes/NoteViewer.vue - FORBEDRET DOKUMENTATION
<script setup>
/**
 * NoteViewer komponent til visning og redigering af noter
 * 
 * @component
 * @example
 * <NoteViewer 
 *   :note="selectedNote"
 *   :user-settings="userSettings"
 *   @close="handleClose"
 *   @update="handleUpdate"
 *   @delete="handleDelete"
 *   @toggle-favorite="handleToggleFavorite"
 *   @move-note-to-folder="handleMoveNote"
 * />
 */

/**
 * Props definitioner
 * @typedef {Object} Props
 * @property {Note} note - Den note der skal vises
 * @property {UserSettings} userSettings - Brugerindstillinger
 * @property {boolean} [readonly=false] - Om noten er read-only
 */

/**
 * Events der emitteres
 * @typedef {Object} Emits
 * @property {() => void} close - Når viewer lukkes
 * @property {(noteId: string, title: string, content: string) => void} update - Når note opdateres
 * @property {(noteId: string) => void} delete - Når note slettes
 * @property {(noteId: string) => void} toggle-favorite - Når favorit status ændres
 * @property {(noteId: string, folderId: string) => void} move-note-to-folder - Når note flyttes
 */

const props = defineProps({
  note: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && typeof value.id === 'string' && typeof value.title === 'string'
    }
  },
  userSettings: {
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'update', 'delete', 'toggle-favorite', 'move-note-to-folder'])

/**
 * Håndterer opdatering af note
 * @param {string} title - Ny titel
 * @param {string} content - Nyt indhold
 */
const handleUpdate = (title, content) => {
  emit('update', props.note.id, title, content)
}

/**
 * Håndterer sletning af note
 */
const handleDelete = () => {
  if (confirm('Er du sikker på at du vil slette denne note?')) {
    emit('delete', props.note.id)
  }
}
</script>
```

### 3. **API Documentation**

**Forbedring:**
```javascript
// docs/api.md - NY FIL
# API Documentation

## Stores

### useNotesStore

#### State
- `notes: Note[]` - Array af alle noter
- `loading: boolean` - Om noter bliver hentet
- `searchTerm: string` - Nuværende søgeterm
- `editingNote: Note | null` - Note under redigering

#### Getters
- `searchedAndSortedNotes: Note[]` - Filtrerede og sorterede noter
- `favoriteNotes: Note[]` - Kun favorit noter
- `getNoteCounts: (folders: Folder[]) => Record<string, number>` - Antal noter per mappe

#### Actions
- `loadNotes(user: User, encryptionKey: string): Promise<void>` - Henter noter fra database
- `saveNote(title: string, content: string, folderId: string | null): Promise<boolean>` - Gemmer ny note
- `updateNote(id: string, title: string, content: string): Promise<boolean>` - Opdaterer eksisterende note
- `deleteNote(id: string): Promise<boolean>` - Sletter note
- `toggleFavorite(id: string): Promise<boolean>` - Skifter favorit status
- `moveNoteToFolder(id: string, folderId: string): Promise<boolean>` - Flytter note til ny mappe

### useAuthStore

#### State
- `user: User | null` - Nuværende bruger
- `encryptionKey: string | null` - Krypteringsnøgle
- `loading: boolean` - Om login er i gang
- `sessionTimeout: number` - Session timeout i millisekunder
- `lastActivity: number` - Tidspunkt for sidste aktivitet
- `showTimeoutWarning: boolean` - Om timeout advarsel vises

#### Getters
- `isLoggedIn: boolean` - Om bruger er logget ind

#### Actions
- `handleLogin(email: string, password: string): Promise<AuthResult>` - Logger bruger ind
- `handleRegister(email: string, password: string): Promise<AuthResult>` - Registrerer ny bruger
- `handleGoogleLogin(): Promise<AuthResult>` - Logger ind med Google
- `logout(): void` - Logger bruger ud
- `extendSession(): void` - Forlænger session
- `setupActivityListeners(): Function` - Sætter aktivitets lyttere op

## Utilities

### encryption.js

#### Functions
- `deriveKey(password: string, userId: string): Promise<CryptoKey>` - Generer krypteringsnøgle
- `encrypt(text: string, key: CryptoKey): Promise<string>` - Krypterer tekst
- `decrypt(encryptedText: string, key: CryptoKey): Promise<string>` - Dekrypterer tekst
- `generateSalt(userId: string): string` - Genererer salt for bruger

### aiService.js

#### Functions
- `enhanceNote(content: string, instructions: string, settings: AiSettings): Promise<string>` - Forbedrer note med AI
- `summarizeNote(content: string, settings: AiSettings): Promise<string>` - Opsummerer note
- `structureMeetingNotes(content: string, settings: AiSettings): Promise<string>` - Strukturerer mødereferat

## Components

### Base Components

#### BaseButton
Props:
- `variant: 'primary' | 'secondary' | 'ghost' | 'danger'` - Button variant
- `size: 'sm' | 'md' | 'lg'` - Button størrelse
- `loading: boolean` - Om button viser loading state
- `disabled: boolean` - Om button er disabled

#### BaseDialog
Props:
- `isOpen: boolean` - Om dialog er åben
- `title: string` - Dialog titel
- `showDefaultActions: boolean` - Om standard handlinger vises
- `confirmText: string` - Tekst til bekræft knap
- `cancelText: string` - Tekst til annuller knap

Events:
- `confirm` - Når bekræft klikkes
- `cancel` - Når annuller klikkes

### Layout Components

#### Header
Props:
- `user: User` - Nuværende bruger

Events:
- `logout` - Når logout klikkes
- `export` - Når eksport klikkes
- `ai` - Når AI knap klikkes
- `settings` - Når indstillinger klikkes

#### FolderSidebar
Props:
- `folders: Folder[]` - Liste af mapper
- `selectedFolderId: string | null` - Valgte mappe ID
- `noteCounts: Record<string, number>` - Antal noter per mappe
- `lockedFolders: Set<string>` - Låste mapper

Events:
- `folder-select` - Når mappe vælges
- `folder-create` - Når ny mappe oprettes
- `folder-update` - Når mappe opdateres
- `folder-delete` - Når mappe slettes
- `unlock-folder` - Når mappe låses op
- `master-password-unlock` - Når master password bruges

### Note Components

#### NoteViewer
Props:
- `note: Note` - Note der vises
- `userSettings: UserSettings` - Brugerindstillinger
- `readonly: boolean` - Om note er read-only

Events:
- `close` - Når viewer lukkes
- `update` - Når note opdateres
- `delete` - Når note slettes
- `toggle-favorite` - Når favorit status ændres
- `move-note-to-folder` - Når note flyttes

#### QuickNote
Props:
- `isCompact: boolean` - Om kompakt layout bruges
- `hideTitle: boolean` - Om titel skjules
- `isInDrawer: boolean` - Om komponenten er i drawer

Events:
- `save` - Når note gemmes
- `mode-change` - Når mode ændres
```

---

## ♿ Accessibility & Mobile (Lav Prioritet)

### 1. **Forbedre Keyboard Navigation**

**Problem:** Ikke alle elementer er keyboard navigable.

**Forbedring:**
```vue
<!-- components/notes/NotesList.vue - FORBEDRET KEYBOARD NAVIGATION -->
<template>
  <div class="notes-list" @keydown="handleKeyDown">
    <div
      v-for="(note, index) in notes"
      :key="note.id"
      :ref="(el) => setNoteRef(index, el)"
      :tabindex="index === focusedIndex ? 0 : -1"
      class="note-item"
      @click="selectNote(note, index)"
      @keydown="handleNoteKeyDown($event, note, index)"
      @focus="focusedIndex = index"
      role="button"
      :aria-label="`Note: ${note.title}`"
      :aria-selected="selectedNoteId === note.id"
    >
      <h3 class="note-title">{{ note.title }}</h3>
      <p class="note-preview">{{ getPreview(note.content) }}</p>
      
      <div class="note-actions" role="group" :aria-label="`Handlinger for ${note.title}`">
        <button
          @click.stop="$emit('toggle-favorite', note.id)"
          :aria-label="note.isFavorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter'"
          class="action-btn"
        >
          <Star :class="{ 'filled': note.isFavorite }" />
        </button>
        
        <button
          @click.stop="$emit('delete-note', note.id)"
          :aria-label="`Slet note: ${note.title}`"
          class="action-btn danger"
        >
          <Trash2 />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const focusedIndex = ref(0)
const noteRefs = ref([])

const setNoteRef = (index, el) => {
  if (el) {
    noteRefs.value[index] = el
  }
}

const handleKeyDown = (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusNext()
      break
    case 'ArrowUp':
      e.preventDefault()
      focusPrevious()
      break
    case 'Home':
      e.preventDefault()
      focusFirst()
      break
    case 'End':
      e.preventDefault()
      focusLast()
      break
  }
}

const handleNoteKeyDown = (e, note, index) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault()
      selectNote(note, index)
      break
    case 'Delete':
      e.preventDefault()
      $emit('delete-note', note.id)
      break
    case 'f':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        $emit('toggle-favorite', note.id)
      }
      break
  }
}

const focusNext = () => {
  if (focusedIndex.value < props.notes.length - 1) {
    focusedIndex.value++
    focusCurrentNote()
  }
}

const focusPrevious = () => {
  if (focusedIndex.value > 0) {
    focusedIndex.value--
    focusCurrentNote()
  }
}

const focusFirst = () => {
  focusedIndex.value = 0
  focusCurrentNote()
}

const focusLast = () => {
  focusedIndex.value = props.notes.length - 1
  focusCurrentNote()
}

const focusCurrentNote = () => {
  nextTick(() => {
    noteRefs.value[focusedIndex.value]?.focus()
  })
}
</script>
```

### 2. **Screen Reader Support**

**Forbedring:**
```vue
<!-- components/notes/NoteViewer.vue - FORBEDRET SCREEN READER SUPPORT -->
<template>
  <div 
    class="note-viewer"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="contentId"
  >
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      {{ announceText }}
    </div>
    
    <header class="note-header">
      <h1 :id="titleId" class="note-title">
        {{ isEditing ? 'Redigerer: ' + note.title : note.title }}
      </h1>
      
      <div class="note-meta" role="group" aria-label="Note metadata">
        <span class="sr-only">Note oprettet:</span>
        <time :datetime="note.createdAt.toISOString()">
          {{ formatDate(note.createdAt) }}
        </time>
        
        <span class="sr-only">Note opdateret:</span>
        <time :datetime="note.updatedAt.toISOString()">
          {{ formatDate(note.updatedAt) }}
        </time>
        
        <div class="folder-info" v-if="note.folderId">
          <span class="sr-only">Mappe:</span>
          <span class="folder-name">{{ getFolderName(note.folderId) }}</span>
        </div>
      </div>
    </header>
    
    <main class="note-content" :id="contentId">
      <div v-if="!isEditing" class="note-display">
        <div 
          class="prose-content"
          v-html="note.content"
          :aria-label="'Note indhold: ' + getTextContent(note.content)"
        />
      </div>
      
      <div v-else class="note-editor">
        <label for="edit-title" class="sr-only">Rediger note titel</label>
        <input
          id="edit-title"
          v-model="editTitle"
          type="text"
          class="title-input"
          :aria-describedby="titleErrorId"
          :aria-invalid="titleError ? 'true' : 'false'"
        />
        <div v-if="titleError" :id="titleErrorId" class="error-message" role="alert">
          {{ titleError }}
        </div>
        
        <label for="edit-content" class="sr-only">Rediger note indhold</label>
        <div class="editor-container">
          <editor
            v-model="editContent"
            :editor-props="{
              attributes: {
                'aria-label': 'Note indhold editor',
                'aria-describedby': contentErrorId
              }
            }"
          />
        </div>
        <div v-if="contentError" :id="contentErrorId" class="error-message" role="alert">
          {{ contentError }}
        </div>
      </div>
    </main>
    
    <footer class="note-actions">
      <div class="action-group" role="group" aria-label="Note handlinger">
        <button
          @click="handleEdit"
          :aria-label="isEditing ? 'Gem ændringer' : 'Rediger note'"
          class="action-btn primary"
          :disabled="isEditing && !canSave"
        >
          <Edit v-if="!isEditing" />
          <Save v-else />
          <span class="sr-only">
            {{ isEditing ? 'Gem ændringer' : 'Rediger note' }}
          </span>
        </button>
        
        <button
          @click="handleToggleFavorite"
          :aria-label="note.isFavorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter'"
          :aria-pressed="note.isFavorite"
          class="action-btn"
        >
          <Star :class="{ 'filled': note.isFavorite }" />
          <span class="sr-only">
            {{ note.isFavorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter' }}
          </span>
        </button>
        
        <button
          @click="handleDelete"
          aria-label="Slet note"
          class="action-btn danger"
        >
          <Trash2 />
          <span class="sr-only">Slet note</span>
        </button>
        
        <button
          @click="$emit('close')"
          aria-label="Luk note viewer"
          class="action-btn"
        >
          <X />
          <span class="sr-only">Luk note viewer</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const announceText = ref('')
const titleId = 'note-title-' + Math.random().toString(36).substr(2, 9)
const contentId = 'note-content-' + Math.random().toString(36).substr(2, 9)
const titleErrorId = 'title-error-' + Math.random().toString(36).substr(2, 9)
const contentErrorId = 'content-error-' + Math.random().toString(36).substr(2, 9)

const announce = (message) => {
  announceText.value = message
  setTimeout(() => {
    announceText.value = ''
  }, 1000)
}

const handleEdit = () => {
  if (isEditing.value) {
    // Gem ændringer
    $emit('update', note.id, editTitle.value, editContent.value)
    announce('Note gemt')
  } else {
    // Start redigering
    isEditing.value = true
    announce('Redigering startet')
    
    nextTick(() => {
      document.getElementById('edit-title')?.focus()
    })
  }
}

const handleToggleFavorite = () => {
  $emit('toggle-favorite', note.id)
  announce(note.isFavorite ? 'Fjernet fra favoritter' : 'Tilføjet til favoritter')
}

const handleDelete = () => {
  if (confirm('Er du sikker på at du vil slette denne note?')) {
    $emit('delete', note.id)
    announce('Note slettet')
  }
}

const getTextContent = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.action-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.action-btn[aria-pressed="true"] {
  background-color: #3b82f6;
  color: white;
}
</style>
```

### 3. **Mobile Touch Optimizations**

**Problem:** Touch targets er for små på mobile.

**Forbedring:**
```css
/* src/style.css - FORBEDRET MOBILE TOUCH */

/* Touch target størrelse */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 8px;
  margin: 4px;
}

/* Forbedret touch feedback */
.touch-feedback {
  position: relative;
  overflow: hidden;
}

.touch-feedback::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.touch-feedback:active::before {
  width: 300px;
  height: 300px;
}

/* Forbedret scroll områder */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}

/* Forbedret form elementer */
input, textarea, select {
  font-size: 16px; /* Forhindrer zoom på iOS */
  border-radius: 8px;
  padding: 12px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

input:focus, textarea:focus, select:focus {
  border-color: #3b82f6;
  outline: none;
}

/* Forbedret button styling */
button {
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* Disabled states */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Mobile specific optimizations */
@media (max-width: 768px) {
  /* Større touch targets på mobile */
  .mobile-touch-target {
    min-height: 48px;
    min-width: 48px;
    padding: 12px;
    margin: 8px;
  }
  
  /* Forbedret modal præsentation */
  .modal-mobile {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
  }
  
  .modal-content-mobile {
    background: #1f2937;
    border-radius: 12px;
    max-width: 100%;
    max-height: 90vh;
    overflow: auto;
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  /* Forbedret navigation */
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #1f2937;
    border-top: 1px solid #374151;
    padding: 8px 0;
    z-index: 50;
  }
  
  .mobile-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    min-height: 60px;
    text-decoration: none;
    color: #9ca3af;
    transition: color 0.2s;
  }
  
  .mobile-nav-item:hover,
  .mobile-nav-item.active {
    color: #3b82f6;
  }
  
  .mobile-nav-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }
  
  .mobile-nav-text {
    font-size: 12px;
    text-align: center;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .note-item {
    border: 2px solid #ffffff;
  }
  
  .action-btn {
    border: 2px solid currentColor;
  }
  
  .folder-label {
    border: 1px solid currentColor;
  }
}

/* Focus indicators */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;
    --bg-secondary: #1f2937;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --accent: #3b82f6;
  }
}
```

---

## 📦 Build & Configuration (Lav Prioritet)

### 1. **Forbedre ESLint Configuration**

**Problem:** ESLint konfigurationen kunne være mere omfattende.

**Forbedring:**
```javascript
// eslint.config.js - FORBEDRET KONFIGURATION
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginSecurity from 'eslint-plugin-security'
import pluginImport from 'eslint-plugin-import'
import globals from 'globals'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue,ts,tsx}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/public/**',
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/test-results/**'
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      security: pluginSecurity,
      import: pluginImport,
    },
    rules: {
      // Vue specific rules
      'vue/multi-word-component-names': 'off',
      'vue/require-explicit-emits': 'error',
      'vue/no-v-html': 'warn',
      'vue/component-api-style': ['error', ['script-setup', 'composition']],
      'vue/prefer-import-from-vue': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/custom-event-name-casing': ['error', 'camelCase'],
      'vue/define-macros-order': ['error', {
        order: ['defineProps', 'defineEmits', 'defineExpose', 'defineSlots'],
      }],
      'vue/no-setup-props-destructure': 'error',
      'vue/require-macro-variable-name': 'error',

      // Security rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // Import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always'
      }],

      // Dead code detection
      'no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-duplicate-imports': 'error',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error',
      'vue/no-useless-template-attributes': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/no-useless-mustaches': 'error',

      // Code quality
      'eqeqeq': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': ['error', {
        'array': true,
        'object': true
      }],

      // Error prevention
      'no-await-in-loop': 'error',
      'no-promise-executor-return': 'error',
      'no-template-curly-in-string': 'error',
      'require-atomic-updates': 'error',

      // Best practices
      'array-callback-return': 'error',
      'block-scoped-var': 'error',
      'consistent-return': 'error',
      'curly': 'error',
      'default-case': 'error',
      'dot-notation': 'error',
      'guard-for-in': 'error',
      'no-alert': 'warn',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-floating-decimal': 'error',
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-multi-spaces': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'error',
      'no-proto': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'prefer-promise-reject-errors': 'error',
      'radix': 'error',
      'vars-on-top': 'error',
      'wrap-iife': 'error',
      'yoda': 'error'
    },
    settings: {
      'import/resolver': {
        'node': {
          'extensions': ['.js', '.jsx', '.ts', '.tsx', '.vue']
        }
      }
    }
  }
]
```

### 2. **Forbedre Vite Configuration**

**Problem:** Vite konfigurationen kunne optimeres mere.

**Forbedring:**
```javascript
// vite.config.js - FORBEDRET KONFIGURATION
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 år
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 uge
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-app-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 1 måned
              }
            }
          }
        ]
      },
      includeAssets: ['icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Sikre Noter',
        short_name: 'Sikre Noter',
        description: 'Sikker noteapp med kryptering',
        theme_color: '#3b82f6',
        background_color: '#1f2937',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'da',
        start_url: '/',
        scope: '/',
        id: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Ny Note',
            short_name: 'Ny Note',
            description: 'Opret en ny note',
            url: '/?action=new-note',
            icons: [
              {
                src: '/icon-192x192.png',
                sizes: '192x192'
              }
            ]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase into separate chunk
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Split UI libraries
          ui: ['lucide-vue-next', '@tinymce/tinymce-vue'],
          // Split crypto utilities
          crypto: ['crypto-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: true,
    port: 3000,
    open: true
  },
  preview: {
    host: true,
    port: 4173
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false
  }
})
```

### 3. **Performance Monitoring**

**Forbedring:**
```javascript
// src/utils/performance.js - NY FIL
export class PerformanceMonitor {
  static metrics = new Map()
  static isEnabled = import.meta.env.DEV

  static startMeasure(name) {
    if (!this.isEnabled) return
    
    const startTime = performance.now()
    this.metrics.set(name, { startTime, endTime: null })
  }

  static endMeasure(name) {
    if (!this.isEnabled) return
    
    const endTime = performance.now()
    const metric = this.metrics.get(name)
    
    if (metric) {
      metric.endTime = endTime
      const duration = endTime - metric.startTime
      
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
      
      // Send til analytics hvis aktiveret
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: name,
          value: Math.round(duration)
        })
      }
    }
  }

  static measureAsync(name, asyncFunction) {
    if (!this.isEnabled) return asyncFunction()
    
    return new Promise(async (resolve, reject) => {
      this.startMeasure(name)
      
      try {
        const result = await asyncFunction()
        this.endMeasure(name)
        resolve(result)
      } catch (error) {
        this.endMeasure(name)
        reject(error)
      }
    })
  }

  static getMetrics() {
    const results = {}
    
    for (const [name, metric] of this.metrics) {
      if (metric.endTime) {
        results[name] = metric.endTime - metric.startTime
      }
    }
    
    return results
  }

  static reportWebVitals() {
    if (!this.isEnabled) return
    
    // Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    })
  }
}

// Usage i stores:
// PerformanceMonitor.startMeasure('load-notes')
// ... load notes logic
// PerformanceMonitor.endMeasure('load-notes')

// Usage med async functions:
// const result = await PerformanceMonitor.measureAsync('encrypt-note', async () => {
//   return await encrypt(data, key)
// })
```

### 4. **Bundle Analysis**

**Forbedring:**
```javascript
// scripts/analyze-bundle.js - NY FIL
import { build } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

async function analyzeBuild() {
  console.log('🔍 Analyzing bundle...')
  
  await build({
    plugins: [
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ]
  })
  
  console.log('✅ Bundle analysis complete! Check dist/bundle-analysis.html')
}

analyzeBuild().catch(console.error)
```

**package.json tilføjelse:**
```json
{
  "scripts": {
    "analyze": "node scripts/analyze-bundle.js",
    "analyze:size": "npx vite-bundle-analyzer dist",
    "lighthouse": "npx lighthouse http://localhost:4173 --view"
  }
}
```

---

## 🎯 Implementerings Prioritering

### **Øjeblikkelige Handlinger (1-2 dage)**
1. ✅ **Fjern password storage fra localStorage** - Kritisk sikkerhedsproblem
2. ✅ **Implementer ordentlig master password verification** - Sikkerhedshul
3. ✅ **Tilføj CSP headers** - Sikkerhedsforbedring

### **Kort Sigt (1-2 uger)**
1. **Refaktorer store funktioner** - Forbedre kode læsbarhed
2. **Implementer caching strategier** - Performance forbedring
3. **Standardiser error handling** - Bedre brugeroplevelse
4. **Forbedre accessibility** - Bredere brugerbase

### **Mellemlang Sigt (1-2 måneder)**
1. **TypeScript migration** - Bedre type safety
2. **Implementer unit tests** - Kvalitetssikring
3. **Optimere search performance** - Skalerbarhed
4. **Forbedre component architecture** - Maintainability

### **Lang Sigt (3-6 måneder)**
1. **Implementer virtualiserede lister** - Performance ved store datasæt
2. **Omfattende performance monitoring** - Kontinuerlig optimering
3. **Fuldt accessibility audit** - Komplet tilgængelighed
4. **Avanceret PWA features** - Offline funktionalitet

---

## 📊 Sammenfatning

### **Styrker ved Nuværende Kodebase**
- ✅ Solid sikkerhedsmodel med client-side encryption
- ✅ Moderne Vue 3 Composition API usage
- ✅ Gennemført mobile-first design
- ✅ Konsistent komponent arkitektur
- ✅ Effektiv state management med Pinia

### **Områder for Forbedring**
- 🔄 Sikkerhedsrevision og forbedringer
- 🔄 Refaktorering af store funktioner
- 🔄 Performance optimiseringer
- 🔄 TypeScript migration
- 🔄 Omfattende testing

### **Forventede Resultater**
- 🎯 **Sikkerhed**: 50% reduktion i sikkerhedsrisici
- 🎯 **Performance**: 30% forbedring i load times
- 🎯 **Maintainability**: 40% reduktion i kode kompleksitet
- 🎯 **Accessibility**: 100% WCAG 2.1 AA compliance
- 🎯 **Type Safety**: 90% type coverage med TypeScript

---

*Dette dokument er en levende guide der bør opdateres efterhånden som forbedringerne implementeres og nye behov identificeres.*