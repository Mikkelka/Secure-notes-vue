# 🔍 Code Optimization & Improvement Guide

**Lavet:** 2025-11-12
**Status:** Comprehensive code review af hele Secure Notes applikationen

---

## 📊 Executive Summary

Denne fil indeholder en komplet gennemgang af kodebasen med fokus på optimeringer, best practices, og forbedringer. Appen er generelt godt arkitektureret, men der er identificeret flere områder hvor kode kvalitet, performance, og vedligeholdelse kan forbedres.

### Quick Stats
- **Total filer analyseret:** 50+
- **Kritiske issues:** 5
- **Performance problemer:** 6
- **Security concerns:** 5
- **Code duplication:** 15+ steder
- **Forventet forbedring:** ~30% bundle size, ~50% faster auth, bedre maintainability

---

## 🚨 KRITISKE ISSUES (Høj prioritet)

### 1. App.vue er for stor (816 linjer)

**Problem:**
```vue
<!-- App.vue indeholder ALT: -->
- Layout rendering (16-140)
- Note handlers (449-605)
- Folder handlers (607-691)
- Mobile handlers (724-753)
- Dialog management (240-261)
- Auth watchers (771-793)
```

**Impact:**
- Svært at teste
- Svært at genbruge logik
- Forvirrende at navigere
- Lang load tid i editor

**Løsning:**
```javascript
// Opret composables:
src/composables/
  ├── useNoteHandlers.js    // handleSaveNote, handleViewerUpdate, etc.
  ├── useFolderHandlers.js  // handleCreateFolder, handleSelectFolder, etc.
  ├── useDialogHandlers.js  // handleOpenSettings, handleCloseSettings, etc.
  └── useAuthWatchers.js    // watch for user/key changes

// App.vue bliver så:
<script setup>
import { useNoteHandlers } from '@/composables/useNoteHandlers'
import { useFolderHandlers } from '@/composables/useFolderHandlers'

const { handleSaveNote, handleViewerUpdate } = useNoteHandlers()
const { handleCreateFolder } = useFolderHandlers()
</script>
```

**Effort:** 8 timer
**Impact:** ⭐⭐⭐⭐⭐ (Maintainability ++++)

---

### 2. Duplicate Folder Colors Definition (4+ steder)

**Problem:**
```javascript
// Defineret i:
// 1. App.vue:619-626
// 2. FolderSidebar.vue:38-45
// 3. NotesList.vue (lignende)
// 4. Andre komponenter

const folderColors = [
  { name: "blue", class: "text-blue-400 bg-blue-500/20" },
  { name: "purple", class: "text-purple-400 bg-purple-500/20" },
  // ... 6 gange
]
```

**Impact:**
- Hvis en farve skal ændres → skal ændres 4 steder
- Inkonsistente farver mulige
- Unødvendig code duplication

**Løsning:**
```javascript
// src/constants/folderColors.js
export const FOLDER_COLORS = [
  { name: "blue", class: "text-blue-400 bg-blue-500/20" },
  { name: "purple", class: "text-purple-400 bg-purple-500/20" },
  { name: "green", class: "text-green-400 bg-green-500/20" },
  { name: "yellow", class: "text-yellow-400 bg-yellow-500/20" },
  { name: "red", class: "text-red-400 bg-red-500/20" },
  { name: "pink", class: "text-pink-400 bg-pink-500/20" }
]

// I komponenter:
import { FOLDER_COLORS } from '@/constants/folderColors'
const folderColors = FOLDER_COLORS
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐⭐ (DRY + Consistency)

---

### 3. Magic Strings for Folder IDs (50+ steder)

**Problem:**
```javascript
// Spredt rundt i kodebasen:
if (foldersStore.selectedFolderId === 'secure') { ... }
if (selectedFolderId === 'all') { ... }
if (selectedFolderId === 'uncategorized') { ... }
if (selectedFolderId === 'trash') { ... }
if (foldersStore.selectedFolderId === 'recent') { ... }

// Fragilt! Hvad hvis vi skriver 'All' i stedet for 'all'?
// Ingen TypeScript warnings
```

**Impact:**
- Typo-risiko (ingen compile-time checks)
- Svært at refaktorere
- Ingen single source of truth

**Løsning:**
```javascript
// src/constants/folderIds.js
export const FOLDER_IDS = {
  SECURE: 'secure',
  RECENT: 'recent',
  ALL: 'all',
  UNCATEGORIZED: 'uncategorized',
  TRASH: 'trash'
}

// Brug:
import { FOLDER_IDS } from '@/constants/folderIds'

if (selectedFolderId === FOLDER_IDS.SECURE) { ... }
if (selectedFolderId === FOLDER_IDS.ALL) { ... }

// Nu får vi autocomplete + compile errors hvis vi laver typos
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐⭐⭐ (Bug prevention)

---

### 4. Password Verification Dupliceret (3 steder)

**Problem:**
```javascript
// 1. auth.js:106 - Email login verification
const derived = await deriveKeyFromPassword(password, userId)

// 2. DataExport.vue - Password verification for export
const key = await deriveKeyFromPassword(password, authStore.user.uid)

// 3. ImportData.vue - Password verification for import
const key = await deriveKeyFromPassword(masterPassword, authStore.user.uid)

// Tre forskellige implementations af samme logik!
```

**Impact:**
- Code duplication
- Inconsistent error handling
- Svært at opdatere algoritmen

**Løsning:**
```javascript
// src/utils/passwordVerification.js
export async function verifyUserPassword(password, userId) {
  try {
    const derivedKey = await deriveKeyFromPassword(password, userId)
    const storedVerifier = localStorage.getItem(`passwordVerifier_${userId}`)

    if (!storedVerifier) {
      console.warn('No password verifier found')
      return { valid: true, key: derivedKey } // Fallback
    }

    const verifier = await generatePasswordVerifier(derivedKey)
    const isValid = verifier === storedVerifier

    return { valid: isValid, key: isValid ? derivedKey : null }
  } catch (error) {
    console.error('Password verification failed:', error)
    return { valid: false, key: null }
  }
}

// Brug:
import { verifyUserPassword } from '@/utils/passwordVerification'

const { valid, key } = await verifyUserPassword(password, userId)
if (valid) {
  // Success!
}
```

**Effort:** 4 timer
**Impact:** ⭐⭐⭐⭐ (Security + DRY)

---

### 5. Inconsistent Error Handling

**Problem:**
```javascript
// auth.js bruger mapped errors:
const errorMessages = {
  'auth/user-not-found': 'Bruger ikke fundet',
  'auth/wrong-password': 'Forkert adgangskode'
}

// notes.js bruger generic console errors:
catch (error) {
  console.error('Failed to save note:', error)
}

// Komponenter bruger alert():
catch (error) {
  alert('Der opstod en fejl')
}

// Tre forskellige patterns!
```

**Impact:**
- Inkonsistent brugeroplevelse
- Svært at debug
- Manglende error tracking

**Løsning:**
```javascript
// src/services/errorHandler.js
class ErrorHandler {
  static ERROR_MESSAGES = {
    // Auth errors
    'auth/user-not-found': 'Bruger ikke fundet',
    'auth/wrong-password': 'Forkert adgangskode',

    // Note errors
    'note/save-failed': 'Kunne ikke gemme note',
    'note/decrypt-failed': 'Kunne ikke dekryptere note',

    // Generic
    'generic': 'Der opstod en uventet fejl'
  }

  static handle(error, context = '') {
    const code = error.code || 'generic'
    const message = this.ERROR_MESSAGES[code] || this.ERROR_MESSAGES['generic']

    console.error(`[${context}]`, error)

    // Send to error tracking service (Sentry, etc.)
    // this.sendToSentry(error, context)

    return { message, code }
  }

  static notify(error, context = '') {
    const { message } = this.handle(error, context)
    // Use toast notification instead of alert
    alert(message) // TODO: Replace with toast
  }
}

export default ErrorHandler

// Brug:
import ErrorHandler from '@/services/errorHandler'

try {
  await saveNote()
} catch (error) {
  ErrorHandler.notify(error, 'saveNote')
}
```

**Effort:** 3 timer
**Impact:** ⭐⭐⭐⭐ (UX + Debugging)

---

## ⚡ PERFORMANCE ISSUES

### 1. PBKDF2 Køres 3 Gange per Auth Event

**Problem:**
```javascript
// 1. auth.js executeAuthFlow() - Første derivation
const key = await deriveKeyFromPassword(password, user.uid)

// 2. auth.js initializeAuth() - Anden derivation på page reload
const password = atob(encryptedPassword)
key = await deriveKeyFromPassword(password, user.uid)

// 3. auth.js recoverEncryptionKey() - Tredje derivation
const password = atob(encryptedPassword)
const key = await deriveKeyFromPassword(password, user.uid)

// PBKDF2 med 210,000 iterations tager ~2-3 sekunder PER derivation
// Total: 6-9 sekunder spildt!
```

**Impact:**
- 6-9 sekunder spildt per auth event
- Dårlig brugeroplevelse
- Unødvendigt CPU forbrug

**Løsning:**
```javascript
// Gem derived key med timestamp
const DERIVED_KEY_CACHE_DURATION = 5 * 60 * 1000 // 5 minutter

async function getCachedDerivedKey(password, userId) {
  const cacheKey = `derivedKey_${userId}`
  const cached = sessionStorage.getItem(cacheKey)

  if (cached) {
    const { key, timestamp, verifier } = JSON.parse(cached)
    const age = Date.now() - timestamp

    if (age < DERIVED_KEY_CACHE_DURATION) {
      // Verify it's still correct
      const storedVerifier = localStorage.getItem(`passwordVerifier_${userId}`)
      if (verifier === storedVerifier) {
        console.log('Using cached derived key')
        return key
      }
    }
  }

  // Derive fresh key
  const key = await deriveKeyFromPassword(password, userId)
  const verifier = await generatePasswordVerifier(key)

  sessionStorage.setItem(cacheKey, JSON.stringify({
    key,
    timestamp: Date.now(),
    verifier
  }))

  return key
}
```

**Effort:** 4 timer
**Impact:** ⭐⭐⭐⭐⭐ (Performance +++ 6-9s saved)

---

### 2. getNoteCounts() Recalculates på Every Render

**Problem:**
```javascript
// App.vue:408
const noteCounts = computed(() => {
  return notesStore.getNoteCounts(foldersStore.folders)
})

// notes.js:165
export function getNoteCounts(folders) {
  const counts = { all: 0, recent: 0, uncategorized: 0, ... }

  allNotes.value.forEach(note => {  // O(n) iteration
    if (!note.isDeleted) {
      counts.all++
      // ... more counting
    }
  })

  return counts
}

// Problemet: Runs på EVERY computed trigger, selvom notes ikke ændres
```

**Impact:**
- O(n) iteration for hver render
- Unødvendigt CPU forbrug
- Kan mærkes med 100+ notes

**Løsning:**
```javascript
// notes.js - Memoize counts
const cachedNoteCounts = ref(null)
const lastCountUpdate = ref(0)

export const noteCounts = computed(() => {
  const notesHash = allNotes.value.length +
                    allNotes.value.filter(n => !n.isDeleted).length

  if (cachedNoteCounts.value && lastCountUpdate.value === notesHash) {
    return cachedNoteCounts.value
  }

  const counts = calculateCounts()
  cachedNoteCounts.value = counts
  lastCountUpdate.value = notesHash

  return counts
})

function calculateCounts() {
  // Original logic here
}

// App.vue bliver bare:
const noteCounts = computed(() => notesStore.noteCounts)
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐⭐ (Performance ++)

---

### 3. Search Debounce Ikke Brugt Effektivt

**Problem:**
```javascript
// App.vue sender searchTerm direkte til NotesList
<input v-model="localSearchTerm" />

// NotesList filterer på every keystroke
// MEN notes.js computed property kører OGSÅ på every keystroke:

// notes.js:142
export const searchedAndSortedNotes = computed(() => {
  let filtered = allNotes.value

  if (searchTerm.value) {
    filtered = filtered.filter(note => {
      // Decryption + filtering på EVERY keystroke
      const title = note.decryptedTitle || ''
      const content = note.decryptedContent || ''
      return title.includes(searchTerm.value) || content.includes(searchTerm.value)
    })
  }

  return filtered
})
```

**Impact:**
- 50-100ms per keystroke ved store note collections
- Dårlig UX ved typing

**Løsning:**
```javascript
// notes.js - Debounce search term
import { debounce } from '@/utils/debounce'

const internalSearchTerm = ref('')
const debouncedSearchTerm = ref('')

const debouncedSetSearch = debounce((value) => {
  debouncedSearchTerm.value = value
}, 300)

export function setSearchTerm(term) {
  internalSearchTerm.value = term // For input value
  debouncedSetSearch(term) // For filtering
}

export const searchedAndSortedNotes = computed(() => {
  // Use debouncedSearchTerm instead
  if (debouncedSearchTerm.value) {
    // Filtering logic
  }
})
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐ (Performance + UX)

---

### 4. TinyMCE Initialiseres Flere Gange

**Problem:**
```vue
<!-- QuickNote.vue -->
<Editor
  :init="editorConfig"
  tinymce-script-src="/tinymce/tinymce.min.js"
/>

<!-- NoteEditor.vue -->
<Editor
  :init="editorConfig"
  tinymce-script-src="/tinymce/tinymce.min.js"
/>

<!-- Begge loader TinyMCE script selvom det kun skal loades én gang -->
```

**Impact:**
- 500ms+ overhead ved multiple editors
- Unødvendige script loads

**Løsning:**
```javascript
// src/plugins/tinymce.js
let tinymceLoaded = false

export function loadTinyMCE() {
  return new Promise((resolve, reject) => {
    if (tinymceLoaded) {
      resolve(window.tinymce)
      return
    }

    const script = document.createElement('script')
    script.src = '/tinymce/tinymce.min.js'
    script.onload = () => {
      tinymceLoaded = true
      resolve(window.tinymce)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// I komponenter:
import { loadTinyMCE } from '@/plugins/tinymce'

onMounted(async () => {
  await loadTinyMCE()
  // Nu er TinyMCE klar
})
```

**Effort:** 1 time
**Impact:** ⭐⭐ (Performance +)

---

### 5. Decryption med Fallback på Every Note Load

**Problem:**
```javascript
// notes.js:45-64
async function tryDecryptWithFallback(encryptedText, isPinProtected = false) {
  let key = SecureStorage.getEncryptionKey()

  try {
    return await decryptText(encryptedText, key)
  } catch (error) {
    // Fallback: Generate new key from UID
    const authStore = useAuthStore()
    const fallbackKey = await deriveKeyFromPassword(
      authStore.user.uid,
      authStore.user.uid
    )

    try {
      return await decryptText(encryptedText, fallbackKey)
    } catch (fallbackError) {
      console.error('Both decryption attempts failed')
      return '[Dekryptering fejlede]'
    }
  }
}

// Problemet: Dette køres for HVER NOTE ved loadNotes()
// Hvis user har ændret password, ALLE notes prøver fallback key
```

**Impact:**
- O(n) PBKDF2 derivations ved password change
- Kan tage 10+ sekunder med 100 notes

**Løsning:**
```javascript
// Detect key migration behov én gang
let migrationKeyCache = null

async function getMigrationKey() {
  if (migrationKeyCache) return migrationKeyCache

  const authStore = useAuthStore()
  migrationKeyCache = await deriveKeyFromPassword(
    authStore.user.uid,
    authStore.user.uid
  )
  return migrationKeyCache
}

async function tryDecryptWithFallback(encryptedText) {
  let key = SecureStorage.getEncryptionKey()

  try {
    return await decryptText(encryptedText, key)
  } catch (error) {
    const fallbackKey = await getMigrationKey() // Cached!
    return await decryptText(encryptedText, fallbackKey)
  }
}
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐ (Performance ++)

---

### 6. Ingen Pagination på Note List

**Problem:**
```vue
<!-- NotesList.vue renderer ALLE notes -->
<div v-for="note in searchedAndSortedNotes" :key="note.id">
  <!-- Hvis user har 500 notes, alle renderes -->
</div>
```

**Impact:**
- DOM bliver stor
- Scrolling bliver langsom
- Memory forbrug stiger

**Løsning:**
```javascript
// notes.js - Add pagination
const NOTES_PER_PAGE = 50
const currentPage = ref(1)

export const paginatedNotes = computed(() => {
  const start = (currentPage.value - 1) * NOTES_PER_PAGE
  const end = start + NOTES_PER_PAGE
  return searchedAndSortedNotes.value.slice(start, end)
})

export const totalPages = computed(() => {
  return Math.ceil(searchedAndSortedNotes.value.length / NOTES_PER_PAGE)
})

export function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Eller brug virtual scrolling med vue-virtual-scroller
```

**Effort:** 4 timer
**Impact:** ⭐⭐⭐⭐ (Performance + Scalability)

---

## 🔒 SECURITY ISSUES

### 1. Base64 Encoding er IKKE Encryption

**KRITISK PROBLEM:**
```javascript
// auth.js:35
if (loginType === 'email') {
  localStorage.setItem(`encryptedPassword_${user.uid}`, btoa(password))
  //                                                      ^^^^^^^^^^^^
  // btoa() = Base64 encoding, IKKE encryption!
}

// Recovery:
const password = atob(encryptedPassword)
// atob() = Base64 decoding, trivielt at reverse!

// ENHVER kan decode dette:
// console.log(atob('cGFzc3dvcmQxMjM='))  // → 'password123'
```

**Impact:**
- Passwords stored i localStorage kan læses af enhver script
- XSS attack kan stjæle alle passwords
- KRITISK sikkerhedsbrist

**Løsning 1 - Slet ikke password:**
```javascript
// Brug kun password verifier i stedet
const passwordVerifier = await generatePasswordVerifier(key)
localStorage.setItem(`passwordVerifier_${userId}`, passwordVerifier)

// Ved recovery: Spørg user om password igen
```

**Løsning 2 - Encrypt med dedicated key:**
```javascript
// Derive en separat encryption key for password storage
const SYSTEM_SEED = 'secure-notes-password-encryption-v1'

async function storePasswordSecurely(password, userId) {
  const storageKey = await deriveKeyFromPassword(SYSTEM_SEED, userId)
  const encryptedPassword = await encryptText(password, storageKey)
  localStorage.setItem(`securePassword_${userId}`, encryptedPassword)
}

async function retrievePasswordSecurely(userId) {
  const encryptedPassword = localStorage.getItem(`securePassword_${userId}`)
  if (!encryptedPassword) return null

  const storageKey = await deriveKeyFromPassword(SYSTEM_SEED, userId)
  return await decryptText(encryptedPassword, storageKey)
}
```

**Effort:** 3 timer
**Impact:** ⭐⭐⭐⭐⭐ (CRITICAL Security Fix)

---

### 2. Password Verifier Ikke Valideret ved Recovery

**Problem:**
```javascript
// auth.js:103-107
if (loginType === 'email') {
  const encryptedPassword = localStorage.getItem(`encryptedPassword_${user.uid}`)
  const password = atob(encryptedPassword)
  key = await deriveKeyFromPassword(password, user.uid)
}

// Ingen validering af om password er korrekt!
// Hvis user har ændret password, bruges forkert key → data corruption
```

**Impact:**
- Forkert key bruges silent
- Notes bliver uläselige
- Ingen error til user

**Løsning:**
```javascript
if (loginType === 'email') {
  const encryptedPassword = localStorage.getItem(`encryptedPassword_${user.uid}`)
  const password = atob(encryptedPassword)
  const derivedKey = await deriveKeyFromPassword(password, user.uid)

  // VALIDATE KEY FIRST
  const verifier = await generatePasswordVerifier(derivedKey)
  const storedVerifier = localStorage.getItem(`passwordVerifier_${user.uid}`)

  if (verifier !== storedVerifier) {
    console.error('Password verifier mismatch - password may have changed')
    // Clear invalid cached password
    localStorage.removeItem(`encryptedPassword_${user.uid}`)
    // Prompt user for password
    throw new Error('Password verification failed')
  }

  key = derivedKey
}
```

**Effort:** 1 time
**Impact:** ⭐⭐⭐⭐ (Security + Data Integrity)

---

### 3. AI Output Kunne Injicere HTML (XSS Risk)

**Problem:**
```javascript
// aiService.js returnerer HTML direkte:
return processedHtml

// NoteContent.vue renderer uden sanitization:
<div v-html="note.decryptedContent"></div>

// Hvis AI returnerer malicious HTML:
// <script>stealData()</script>
// eller: <img src=x onerror="alert('XSS')">
// Det bliver executed!
```

**Impact:**
- XSS attack mulig via AI output
- Kunne stjæle encryption keys fra memory
- KRITISK sikkerhedsbrist

**Løsning:**
```javascript
// Installer DOMPurify
npm install dompurify

// src/utils/sanitizeHtml.js
import DOMPurify from 'dompurify'

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
      'ul', 'ol', 'li', 'a', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'class'],
    ALLOW_DATA_ATTR: false
  })
}

// aiService.js
import { sanitizeHtml } from '@/utils/sanitizeHtml'

return sanitizeHtml(processedHtml)
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐⭐⭐ (CRITICAL Security Fix)

---

### 4. Session Storage Kan Læses af XSS Scripts

**Problem:**
```javascript
// aiService.js:134-139
const instructionType = sessionStorage.getItem("ai-instruction-preference")
const selectedModel = sessionStorage.getItem("ai-model")

// Session storage er accessible fra ANY script på siden
// XSS attack kunne læse user preferences
```

**Impact:**
- Mindre kritisk end passwords
- Men stadig information leakage

**Løsning:**
```javascript
// Brug SecureStorage i stedet for sessionStorage for sensitive data
SecureStorage.setItem('ai-instruction-preference', value)
const value = SecureStorage.getItem('ai-instruction-preference')

// Eller encrypt sessionStorage values:
sessionStorage.setItem('ai-settings', await encryptText(JSON.stringify(settings), key))
```

**Effort:** 1 time
**Impact:** ⭐⭐ (Security +)

---

### 5. Timing Attack på PIN Verification

**Problem:**
```javascript
// folders.js eller hvor PIN verificeres:
if (enteredPin === storedPin) {
  // Success
}

// String comparison !== constant time
// Attacker kan brute force PIN ved at måle response time
```

**Impact:**
- PIN kan brute forces hurtigere
- Mindre kritisk (kun 10,000 muligheder)

**Løsning:**
```javascript
// Brug constant-time comparison
function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// Brug:
if (constantTimeCompare(enteredPin, storedPin)) {
  // Success
}
```

**Effort:** 30 min
**Impact:** ⭐⭐ (Security +)

---

## 🔄 CODE DUPLICATION & REFACTORING

### 1. Color Picker UI (4 steder)

**Duplikeret i:**
- App.vue:300-313
- FolderSidebar.vue:34-45
- Andre komponenter med folder creation

**Løsning:**
```vue
<!-- src/components/base/ColorPicker.vue -->
<template>
  <div class="color-picker-grid">
    <button
      v-for="color in colors"
      :key="color.name"
      type="button"
      @click="$emit('update:modelValue', color.name)"
      :class="[
        'color-picker-btn',
        color.class,
        { 'color-picker-selected': modelValue === color.name }
      ]"
    >
      <Check v-if="modelValue === color.name" :size="16" />
    </button>
  </div>
</template>

<script setup>
import { Check } from 'lucide-vue-next'

defineProps({
  modelValue: String,
  colors: Array
})

defineEmits(['update:modelValue'])
</script>

<!-- Brug: -->
<ColorPicker v-model="selectedColor" :colors="FOLDER_COLORS" />
```

**Effort:** 3 timer
**Impact:** ⭐⭐⭐⭐ (DRY + Consistency)

---

### 2. Empty State Component (3 steder)

**Duplikeret i:**
- NotesList.vue
- FolderSidebar.vue
- Andre lister

**Løsning:**
```vue
<!-- src/components/base/EmptyState.vue -->
<template>
  <div class="empty-state">
    <component :is="icon" :size="48" class="empty-state-icon" />
    <h3 class="empty-state-title">{{ title }}</h3>
    <p class="empty-state-description">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<script setup>
defineProps({
  icon: Object,
  title: String,
  description: String
})
</script>

<!-- Brug: -->
<EmptyState
  :icon="FileText"
  title="Ingen noter fundet"
  description="Opret din første note med '+' knappen"
>
  <template #action>
    <button @click="createNote">Opret note</button>
  </template>
</EmptyState>
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐ (DRY + UX Consistency)

---

### 3. Async Button Component (5+ steder)

**Duplikeret i:**
- AiPanel.vue
- DataExport.vue
- AppSettings.vue
- ImportData.vue
- Andre steder med async operations

**Løsning:**
```vue
<!-- src/components/base/AsyncButton.vue -->
<template>
  <button
    :disabled="loading || disabled"
    :class="buttonClass"
    @click="handleClick"
  >
    <Loader v-if="loading" :size="16" class="animate-spin" />
    <component v-else-if="icon" :is="icon" :size="16" />

    <slot v-if="!loading" />
    <span v-else>{{ loadingText }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { Loader } from 'lucide-vue-next'

const props = defineProps({
  onClick: Function,
  disabled: Boolean,
  icon: Object,
  loadingText: { type: String, default: 'Arbejder...' },
  variant: { type: String, default: 'primary' } // primary, secondary, danger
})

const loading = ref(false)

const buttonClass = computed(() => {
  const base = 'async-btn'
  const stateClass = loading.value ? 'loading' : ''
  const variantClass = `async-btn-${props.variant}`
  return [base, stateClass, variantClass]
})

async function handleClick() {
  if (loading.value || !props.onClick) return

  loading.value = true
  try {
    await props.onClick()
  } finally {
    loading.value = false
  }
}
</script>

<!-- Brug: -->
<AsyncButton
  :on-click="handleExport"
  :icon="Download"
  loading-text="Eksporterer..."
  variant="primary"
>
  Eksporter data
</AsyncButton>
```

**Effort:** 3 timer
**Impact:** ⭐⭐⭐⭐ (DRY + UX Consistency)

---

### 4. Mobile/Desktop Conditional Rendering (15+ steder)

**Duplikeret pattern:**
```vue
<div class="hidden md:block">Desktop content</div>
<div class="md:hidden">Mobile content</div>

<!-- Eller -->
<div v-if="isMobile">Mobile</div>
<div v-else>Desktop</div>
```

**Løsning:**
```vue
<!-- src/components/base/ResponsiveView.vue -->
<template>
  <div v-if="shouldShow">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

const props = defineProps({
  mobileOnly: Boolean,
  desktopOnly: Boolean
})

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const shouldShow = computed(() => {
  if (props.mobileOnly) return isMobile.value
  if (props.desktopOnly) return !isMobile.value
  return true
})
</script>

<!-- Brug: -->
<ResponsiveView mobile-only>
  <MobileLayout />
</ResponsiveView>

<ResponsiveView desktop-only>
  <DesktopLayout />
</ResponsiveView>
```

**Effort:** 2 timer
**Impact:** ⭐⭐⭐ (DRY + Cleaner templates)

---

## 🎨 CSS & STYLING IMPROVEMENTS

### 1. Duplicate @apply Patterns

**Problem:**
```css
/* style.css:315 */
.btn-google {
  @apply w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 ...;
}

/* Meget lig .btn-base men ikke composed */
.btn-base {
  @apply inline-flex items-center justify-center gap-2 px-4 py-2 ...;
}
```

**Løsning:**
```css
/* Compose i stedet */
.btn-google {
  @apply btn-base w-full gap-3 py-3 bg-white text-gray-900;
}

/* Reducer duplication */
```

**Effort:** 1 time
**Impact:** ⭐⭐ (Smaller CSS bundle)

---

### 2. Missing Scrollbar Hide Class

**Problem:**
```html
<!-- Brugt i komponenter: -->
<div class="scrollbar-hide">...</div>

<!-- Men ikke defineret i style.css! -->
```

**Løsning:**
```css
/* style.css */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
```

**Effort:** 5 min
**Impact:** ⭐ (Bug fix)

---

### 3. Add CSS Containment for Performance

**Problem:**
Ingen CSS containment → browser repainter hele siden ved ændringer

**Løsning:**
```css
/* style.css - Add containment for major components */
.note-item {
  contain: layout style paint;
}

.folder-item {
  contain: layout style paint;
}

.note-viewer {
  contain: layout;
}

/* Fortæller browser at disse elementer er isolerede */
```

**Effort:** 30 min
**Impact:** ⭐⭐⭐ (Rendering performance)

---

### 4. Add will-change for Animated Elements

**Problem:**
Ingen will-change hints → browser kan ikke optimize animations

**Løsning:**
```css
/* For ofte-animerede elementer */
.modal-overlay {
  will-change: opacity;
}

.drawer {
  will-change: transform;
}

.note-item:hover {
  will-change: background-color;
}

/* Browser kan nu pre-optimize disse animations */
```

**Effort:** 15 min
**Impact:** ⭐⭐ (Animation performance)

---

## 📦 DEPENDENCIES & BUILD

### 1. vue-router Installeret Men Ikke Brugt

**Problem:**
```json
// package.json
"vue-router": "^4.5.1"

// Men INGEN routes defineret
// INGEN router brug i App.vue
// Unødvendig 60KB i bundle
```

**Løsning:**
```bash
npm uninstall vue-router
```

**Effort:** 5 min
**Impact:** ⭐⭐ (Bundle size -60KB)

---

### 2. Manglende Error Logging Service

**Problem:**
Ingen error tracking i production → bugs opdages ikke

**Løsning:**
```bash
npm install @sentry/vue

# src/main.js
import * as Sentry from "@sentry/vue"

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: "YOUR_SENTRY_DSN",
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}
```

**Effort:** 1 time
**Impact:** ⭐⭐⭐⭐ (Production debugging)

---

## 🧪 TESTING GAPS

### 1. Ingen Unit Tests

**Mangler:**
- Utils tests (encryption.js, secureStorage.js)
- Store tests (alle Pinia stores)
- Service tests (aiService.js)

**Løsning:**
```bash
npm install -D vitest @vue/test-utils happy-dom

# vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom'
  }
})

# tests/utils/encryption.test.js
import { describe, it, expect } from 'vitest'
import { encryptText, decryptText, deriveKeyFromPassword } from '@/utils/encryption'

describe('Encryption Utils', () => {
  it('should encrypt and decrypt text correctly', async () => {
    const key = await deriveKeyFromPassword('test123', 'user-id')
    const encrypted = await encryptText('Hello World', key)
    const decrypted = await decryptText(encrypted, key)

    expect(decrypted).toBe('Hello World')
  })

  it('should fail with wrong key', async () => {
    const key1 = await deriveKeyFromPassword('test123', 'user-id')
    const key2 = await deriveKeyFromPassword('wrong', 'user-id')
    const encrypted = await encryptText('Hello', key1)

    await expect(decryptText(encrypted, key2)).rejects.toThrow()
  })
})
```

**Effort:** 16 timer (comprehensive test suite)
**Impact:** ⭐⭐⭐⭐⭐ (Code quality + Confidence)

---

### 2. Ingen E2E Tests

**Løsning:**
```bash
npm install -D @playwright/test

# e2e/login.spec.js
import { test, expect } from '@playwright/test'

test('user can login and create note', async ({ page }) => {
  await page.goto('http://localhost:5173')

  // Login
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'Test123!')
  await page.click('button[type="submit"]')

  // Wait for notes to load
  await expect(page.locator('h1')).toContainText('Alle noter')

  // Create note
  await page.click('button:has-text("Hurtig note")')
  await page.fill('textarea', 'Test note content')
  await page.click('button:has-text("Gem")')

  // Verify note exists
  await expect(page.locator('.note-item')).toContainText('Test note')
})
```

**Effort:** 8 timer
**Impact:** ⭐⭐⭐⭐ (E2E confidence)

---

## 📊 PRIORITERET IMPLEMENTATION PLAN

### 🔴 KRITISK (Næste sprint)

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Fix Base64 password storage | 3h | ⭐⭐⭐⭐⭐ | auth.js |
| Create folderIds constants | 2h | ⭐⭐⭐⭐⭐ | 10+ filer |
| Add AI output sanitization | 2h | ⭐⭐⭐⭐⭐ | aiService.js |
| Create folderColors constants | 2h | ⭐⭐⭐⭐ | 4 filer |
| Validate password on recovery | 1h | ⭐⭐⭐⭐ | auth.js |
| **Total** | **10h** | | |

### 🟡 HØJ PRIORITET (Denne måned)

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Extract App.vue composables | 8h | ⭐⭐⭐⭐⭐ | App.vue + nye composables |
| Cache PBKDF2 derivations | 4h | ⭐⭐⭐⭐⭐ | auth.js |
| Centralize password verification | 4h | ⭐⭐⭐⭐ | auth.js, DataExport, Import |
| Create ColorPicker component | 3h | ⭐⭐⭐⭐ | 4 komponenter |
| Memoize getNoteCounts | 2h | ⭐⭐⭐⭐ | notes.js |
| Create ErrorHandler service | 3h | ⭐⭐⭐⭐ | Alle stores + komponenter |
| **Total** | **24h** | | |

### 🟢 MEDIUM PRIORITET (Q2 2025)

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Add pagination to notes | 4h | ⭐⭐⭐⭐ | notes.js, NotesList |
| Create AsyncButton component | 3h | ⭐⭐⭐⭐ | 5+ komponenter |
| Debounce search properly | 2h | ⭐⭐⭐ | notes.js |
| Create EmptyState component | 2h | ⭐⭐⭐ | 3 komponenter |
| Optimize TinyMCE loading | 1h | ⭐⭐ | QuickNote, NoteEditor |
| Cache migration key | 2h | ⭐⭐⭐ | notes.js |
| **Total** | **14h** | | |

### 🔵 LAV PRIORITET (Q3 2025)

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Add unit tests | 16h | ⭐⭐⭐⭐⭐ | Alle utils + stores |
| Add E2E tests | 8h | ⭐⭐⭐⭐ | E2E tests |
| Remove vue-router | 0.5h | ⭐⭐ | package.json |
| Add Sentry error tracking | 1h | ⭐⭐⭐⭐ | main.js |
| CSS containment | 0.5h | ⭐⭐⭐ | style.css |
| ResponsiveView component | 2h | ⭐⭐⭐ | 15+ komponenter |
| Constant-time PIN compare | 0.5h | ⭐⭐ | folders.js |
| **Total** | **28.5h** | | |

---

## 🎯 FORVENTET FORBEDRINGER

### Performance Gains
- **Auth flow:** 6-9 sekunder hurtigere (PBKDF2 caching)
- **Search:** 50-100ms hurtigere per keystroke (debouncing)
- **Note counts:** O(1) i stedet for O(n) ved hver render
- **Bundle size:** -60KB (fjern vue-router)

### Code Quality
- **App.vue:** 816 → ~300 linjer (composables)
- **Duplication:** -500+ linjer duplikeret kode
- **Maintainability:** ++++ (constants, components, services)

### Security
- **Critical fixes:** 2 (Base64 password, XSS sanitization)
- **Medium fixes:** 3 (password validation, timing attack, session storage)

### Developer Experience
- **Test coverage:** 0% → 80%+ (med unit + E2E tests)
- **Error tracking:** Production visibility
- **Component library:** Reusable components

---

## 📝 NOTES TIL MIKKEL

### Hvad er allerede godt?
- ✅ Solid encryption implementation (AES-GCM + PBKDF2)
- ✅ God Pinia store arkitektur
- ✅ Excellent Tailwind @apply organization
- ✅ Modulær NoteViewer struktur
- ✅ Local TinyMCE (ingen API limits)
- ✅ Session timeout med recovery
- ✅ AI integration med streaming

### Hvad skal fixes ASAP?
1. 🔴 Base64 password storage (KRITISK)
2. 🔴 AI XSS sanitization (KRITISK)
3. 🔴 Magic strings → constants
4. 🟡 App.vue refactoring

### Tools til installation
```bash
# Hvis du vil implementere alle forslag:
npm install dompurify                  # HTML sanitization
npm install -D vitest @vue/test-utils  # Testing
npm install -D @playwright/test        # E2E testing
npm install @sentry/vue                # Error tracking (optional)
npm install @vueuse/core               # Vue utilities (optional)
```

### Test før production
Efter hver optimization:
1. Test login flow
2. Test note creation/editing
3. Test encryption/decryption
4. Test AI features
5. Test export/import

---

**Lavet af:** Claude Code
**Dato:** 2025-11-12
**Version:** 1.0
