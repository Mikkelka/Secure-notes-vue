# Secure Notes Vue - Forbedringer og Nye Features

## 🔐 Kritiske Sikkerhedsproblemer

### Højeste Prioritet
- **folders.js:217-230** - Master password verification mangler implementation
- **auth.js:126-128** - Password gemmes i localStorage som base64 (let at reverse)
- **Encryption key logging** - Produktions-logging af følsomme data

### Anbefalede Fixes
```javascript
// Erstat password storage med secure hash
const storePasswordHash = async (password, userId) => {
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(password + userId))
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}
```

## 🎯 Arkitektur Forbedringer

### App.vue Refaktorering
- **Problem**: 562 linjer i én fil - for stort
- **Løsning**: Split til `MainAppLayout.vue` + composables
- **Duplikeret kode**: Mobile/desktop FolderSidebar (linjer 34-73)

### Store Optimering
- **notes.js**: Parallel decryption i stedet for sequential
- **ui.js**: Manglende reactive dependency mellem selectedNote og allNotes
- **Performance**: Complex fallback decryption bør ekstrahertes

## 📱 UI/UX Forbedringer

### Mobile Responsiveness
- **NoteViewer.vue**: 250+ linjer duplikeret kode mellem mobile/desktop
- **Inconsistent toolbar wrapping** på tværs af devices
- **Missing accessibility attributes** i MobileBottomMenu

### Design System
```css
/* Foreslået design token system */
:root {
  --color-primary: #3b82f6;
  --color-bg-primary: #1f2937;
  --color-text-primary: #f9fafb;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
}
```

### Accessibility Gaps
- BaseButton mangler focus states
- Ingen loading states for async operations
- Poor text contrast (gray-400 på gray-800)

## ⚡ Performance Optimering

### Noter Håndtering
- **Pagination** for store note samlinger
- **Parallel processing** af decryption
- **Efficient search** - undgå processing på hvert keystroke

### Memory Optimization
- **NoteViewer**: Dual editor instances bruger unødvendig memory
- **Complex content conversion** på hvert render

## 🆕 Manglende Core Features

### Note Management
- [ ] **Note versioning/history** - genskab slettet indhold
- [ ] **Note templates** for almindelige formater
- [ ] **Bulk operations** - slet/flyt flere noter
- [ ] **Note sharing** eller collaboration

### Søgning & Organisation
- [ ] **Full-text search** gennem note indhold
- [ ] **Tag system** udover folders
- [ ] **Saved searches** / smart folders
- [ ] **Note sorting** (dato, titel, størrelse)

### User Experience
- [ ] **Offline mode** - fungerer uden internet
- [ ] **Keyboard shortcuts** for power users
- [ ] **Note preview** i liste visning
- [ ] **Drag-and-drop** fil vedhæftninger

## 🔧 Moderne App Features

### Manglende Funktionalitet
- [ ] **Dark/light theme toggle**
- [ ] **Export formater** (PDF, Word, Markdown)
- [ ] **Backup/sync status indicators**
- [ ] **Push notifications** for delte noter

### Progressive Web App
- [ ] **Better offline support**
- [ ] **Background sync**
- [ ] **Install prompts**

## 🧹 Technical Debt

### Dependencies
- **TipTap versioner** inkonsistente (2.5.0 vs 2.14.0)
- **Mangler TypeScript** for type safety
- **Ingen testing framework** (Vitest/Jest)

### Error Handling
```javascript
// Nuværende (inkonsistent)
} catch (error) {
  console.error('Fejl:', error) // Nogle gange
}

// Bør være:
} catch (error) {
  this.handleError('NOTES_LOAD_FAILED', error)
  throw new AppError('Could not load notes', error)
}
```

### Code Quality
- **Error boundary** mangler implementation
- **Loading states** mangler standardisering
- **Retry mechanisms** for failed operations

## 📋 Implementation Prioritering

### Fase 1 - Kritiske Fixes (1-2 dage)
1. **Sikkerhed**: Fix master password verification
2. **Performance**: Add pagination til notes
3. **Arkitektur**: Split App.vue op

### Fase 2 - UX Forbedringer (3-5 dage)
1. Extract duplicate mobile/desktop kode
2. Implement design token system
3. Add accessibility attributes
4. Note versioning system

### Fase 3 - Nye Features (1-2 uger)
1. Full-text search
2. Note templates
3. Bulk operations
4. Keyboard shortcuts

### Fase 4 - Advanced Features (2-3 uger)
1. Offline mode
2. Advanced sharing
3. Export funktionalitet
4. Dark theme

## 🎨 Design Forbedringer

### Typography System
- Konsistent font skala
- Bedre text contrast ratios
- Responsive typography

### Spacing & Layout
- Standardiseret spacing scale
- Grid system implementation
- Container max-widths

### Interactive States
- Hover/focus/active states
- Loading animations
- Micro-interactions

## 📊 Metrics & Analytics

### Performance Tracking
- Note load times
- Search response times
- Encryption/decryption metrics

### User Experience
- Feature usage statistics
- Error tracking
- User flow analysis

---

*Dokumentet er baseret på codebase analyse fra december 2025*