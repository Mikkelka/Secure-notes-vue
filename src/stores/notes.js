import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc as _deleteDoc, 
  doc, 
  orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { encryptText, decryptText } from '../utils/encryption'
import { SecureStorage } from '../utils/secureStorage'
import { useTrashStore } from './trash'

// Helper til at udtrække ren tekst fra HTML indhold.
const extractTextFromContent = (content) => {
  if (!content || typeof content !== 'string') return ''
  
  // Fjern HTML tags og returner ren tekst
  return content
    .replace(/<[^>]*>/g, ' ') // Fjern HTML tags
    .replace(/\s+/g, ' ') // Sammenfold whitespace
    .trim()
}

// Helper til at hente krypterede noter fra Firestore
const fetchEncryptedNotes = async (userId) => {
  const q = query(
    collection(db, 'notes'), 
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

// Helper til at dekryptere med fallback til Google-baseret key
const tryDecryptWithFallback = async (encryptedData, primaryKey, userId, noteId = null) => {
  try {
    // 1. Prøv med primary key først
    return await decryptText(encryptedData, primaryKey)
  } catch {
    // 2. Hvis primary fejler, prøv med Google-baseret key som fallback
    try {
      const { deriveKeyFromPassword } = await import('../utils/encryption')
      const googleKey = await deriveKeyFromPassword(userId, userId)
      const decryptedData = await decryptText(encryptedData, googleKey)
      if (noteId) {
        console.warn(`Note ${noteId} decrypted with Google fallback key`)
      }
      return decryptedData
    } catch {
      // Begge metoder fejlede
      throw new Error('Kunne ikke dekryptere med nogen kendte keys')
    }
  }
}

// Helper til at dekryptere en enkelt note
const decryptSingleNote = async (noteData, encryptionKey, userId) => {
  const [decryptedTitle, decryptedContent] = await Promise.all([
    noteData.encryptedTitle 
      ? tryDecryptWithFallback(noteData.encryptedTitle, encryptionKey, userId, noteData.id)
      : Promise.resolve(''),
    tryDecryptWithFallback(noteData.encryptedContent, encryptionKey, userId, noteData.id)
  ])

  console.log('🔓 Notes Store - DECRYPTED content for note', noteData.id, ':', decryptedContent)
  console.log('🔓 Notes Store - DECRYPTED Contains H1:', decryptedContent?.includes('<h1>'))
  console.log('🔓 Notes Store - DECRYPTED Contains H2:', decryptedContent?.includes('<h2>'))
  console.log('🔓 Notes Store - DECRYPTED Contains H3:', decryptedContent?.includes('<h3>'))

  // Hvis titel er tom (f.eks. fra ældre noter), generer en fallback
  const title = decryptedTitle || (decryptedContent.substring(0, 50) + (decryptedContent.length > 50 ? '...' : ''))

  return {
    id: noteData.id,
    title,
    content: decryptedContent,
    folderId: noteData.folderId || null,
    isFavorite: noteData.isFavorite || false,
    isDeleted: noteData.isDeleted || false,
    deletedAt: noteData.deletedAt ? noteData.deletedAt.toDate() : null,
    createdAt: noteData.createdAt.toDate(),
    updatedAt: noteData.updatedAt.toDate()
  }
}

// Helper til at processere og dekryptere alle noter
const processEncryptedNotes = async (encryptedNotes, encryptionKey, userId) => {
  const decryptionPromises = encryptedNotes.map(async (noteData) => {
    try {
      return await decryptSingleNote(noteData, encryptionKey, userId)
    } catch (error) {
      // Debug info for problematiske noter
      console.error(`Kunne ikke dekryptere note ${noteData.id}. Den vil blive sprunget over.`, error)
      console.error('Note data:', {
        id: noteData.id,
        userId: noteData.userId,
        currentUserId: userId,
        hasEncryptedTitle: !!noteData.encryptedTitle,
        hasEncryptedContent: !!noteData.encryptedContent,
        folderId: noteData.folderId,
        createdAt: noteData.createdAt,
        updatedAt: noteData.updatedAt
      })
      return null // Returner null hvis en note fejler, så den kan filtreres fra
    }
  })
  
  const resolvedNotes = await Promise.all(decryptionPromises)
  return resolvedNotes.filter(note => note !== null) // Fjern noter der ikke kunne dekrypteres
}

// Helper til at opdatere performance statistikker
const updatePerformanceStats = (startTime, decryptedNotes) => {
  return {
    loadTime: performance.now() - startTime,
    notesCount: decryptedNotes.length,
    totalChars: decryptedNotes.reduce((sum, note) => sum + note.content.length + note.title.length, 0)
  }
}

export const useNotesStore = defineStore('notes', () => {
  // --- State ---
  const allNotes = ref([]) // Eneste "source of truth" for noter
  const performanceStats = ref(null)
  const searchTerm = ref('')
  const editingNote = ref(null)
  const loading = ref(false)
  
  // --- Trash Store Integration ---
  const trashStore = useTrashStore()
  trashStore.initialize({ allNotes })
  
  // --- Getters (Computed Properties) ---

  // Computed property der håndterer søgning og sortering.
  // Filtrering efter mappe skal ske i den komponent, der viser noterne.
  const searchedAndSortedNotes = computed(() => {
    let notesToProcess = trashStore.filterActiveNotes(allNotes.value) // Ekskluder slettede noter

    // 1. Filtrer baseret på søgeterm
    if (searchTerm.value) {
      const searchLower = searchTerm.value.toLowerCase()
      notesToProcess = notesToProcess.filter(note => {
        const plainTextContent = extractTextFromContent(note.content)
        return note.title.toLowerCase().includes(searchLower) ||
               plainTextContent.toLowerCase().includes(searchLower)
      })
    }
    
    // 2. Sorter (favoritter øverst, derefter efter opdateringsdato)
    return notesToProcess.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      // Sorter efter senest opdateret, så nyligt redigerede noter kommer øverst
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
  })

  // Optimeret funktion til at tælle noter i mapper med én gennemgang.
  const getNoteCounts = (folders) => {
    const initialCounts = { all: 0, uncategorized: 0, secure: 0, recent: 0, trash: 0 }
    folders.forEach(folder => { initialCounts[folder.id] = 0 })

    const activeNotes = trashStore.filterActiveNotes(allNotes.value)
    const counts = activeNotes.reduce((counts, note) => {
      if (note.folderId === 'secure') {
        counts.secure++
      } else {
        counts.all++
        const folderKey = note.folderId || 'uncategorized'
        if (Object.prototype.hasOwnProperty.call(counts, folderKey)) {
          counts[folderKey]++
        }
      }
      return counts
    }, initialCounts)
    
    // Tilføj count for recent notes (altid 5 eller mindre)
    counts.recent = Math.min(5, activeNotes.filter(note => note.folderId !== 'secure').length)
    
    // Tilføj count for trash notes
    counts.trash = trashStore.getTrashCount()
    
    return counts
  }

  // --- Recent Notes Functionality ---
  
  // Computed property til at få recent notes baseret på createdAt
  const recentNotes = computed(() => {
    return trashStore.filterActiveNotes(allNotes.value)
      .filter(note => note.folderId !== 'secure') // Ekskluder secure noter
      .sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
        return bDate.getTime() - aDate.getTime() // Nyeste først
      })
      .slice(0, 5) // Vis kun top 5 i UI
  })

  // --- Actions ---

  const loadNotes = async (user) => {
    loading.value = true
    const startTime = performance.now()
    
    try {
      // Tjek om encryption key er tilgængelig før vi fortsætter
      if (!SecureStorage.hasEncryptionKey()) {
        console.warn('Encryption key not available, skipping notes loading')
        return
      }
      
      const encryptionKey = SecureStorage.getEncryptionKey()
      const encryptedNotes = await fetchEncryptedNotes(user.uid)
      const decryptedNotes = await processEncryptedNotes(encryptedNotes, encryptionKey, user.uid)
      
      allNotes.value = decryptedNotes
      performanceStats.value = updatePerformanceStats(startTime, decryptedNotes)
      
      // Kør automatisk cleanup af gamle slettede noter
      await trashStore.cleanupOldTrashedNotes()
      
    } catch (error) {
      console.error('Fejl under indlæsning af noter:', error)
    } finally {
      loading.value = false
    }
  }

  const saveNote = async (title, content, folderId, user) => {
    if (!title.trim() || !content.trim() || !user) return false
    
    try {
      const encryptionKey = SecureStorage.getEncryptionKey()
      const [encryptedTitle, encryptedContent] = await Promise.all([
        encryptText(title, encryptionKey),
        encryptText(content, encryptionKey)
      ])
      
      const now = new Date()
      const noteData = {
        userId: user.uid,
        encryptedTitle,
        encryptedContent,
        folderId: folderId || null,
        isFavorite: false,
        isDeleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now
      }
      
      const docRef = await addDoc(collection(db, 'notes'), noteData)
      
      const newNote = {
        id: docRef.id,
        title,
        content,
        folderId: folderId || null,
        isFavorite: false,
        isDeleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now
      }
      
      allNotes.value.unshift(newNote) // Tilføj til toppen af listen
      return true
    } catch (error) {
      console.error('Fejl ved gemning af note:', error)
      return false
    }
  }

  const updateNote = async (noteId, newTitle, newContent) => {
    if (!noteId || !newTitle || !newContent) return false
    
    try {
      console.log('📦 Notes Store - updateNote RECEIVED content:', newContent)
      console.log('📦 Notes Store - updateNote content TYPE:', typeof newContent)
      console.log('📦 Notes Store - updateNote Contains H1:', newContent?.includes('<h1>'))
      console.log('📦 Notes Store - updateNote Contains H2:', newContent?.includes('<h2>'))
      console.log('📦 Notes Store - updateNote Contains H3:', newContent?.includes('<h3>'))
      
      const encryptionKey = SecureStorage.getEncryptionKey()
      const [encryptedTitle, encryptedContent] = await Promise.all([
        encryptText(newTitle, encryptionKey),
        encryptText(newContent, encryptionKey)
      ])
      
      console.log('🔐 Notes Store - BEFORE encryption content:', newContent)
      console.log('🔐 Notes Store - AFTER encryption content (base64):', encryptedContent)
      
      const now = new Date()
      await updateDoc(doc(db, 'notes', noteId), {
        encryptedTitle,
        encryptedContent,
        updatedAt: now
      })
      
      const noteIndex = allNotes.value.findIndex(n => n.id === noteId)
      if (noteIndex !== -1) {
        allNotes.value[noteIndex] = { 
          ...allNotes.value[noteIndex], 
          title: newTitle,
          content: newContent, 
          updatedAt: now 
        }
      }
      return true
    } catch (error) {
      console.error('Fejl ved opdatering af note:', error)
      return false
    }
  }

  // Trash operations now handled by trash store
  const moveToTrash = (noteId) => trashStore.moveToTrash(noteId)
  const restoreNote = (noteId) => trashStore.restoreNote(noteId)
  const permanentDeleteNote = (noteId) => trashStore.permanentDeleteNote(noteId)
  const emptyTrash = () => trashStore.emptyTrash()
  const cleanupOldTrashedNotes = () => trashStore.cleanupOldTrashedNotes()

  const toggleFavorite = async (noteId) => {
    const note = allNotes.value.find(n => n.id === noteId)
    if (!note) return false
    
    try {
      const newFavoriteStatus = !note.isFavorite
      await updateDoc(doc(db, 'notes', noteId), {
        isFavorite: newFavoriteStatus,
        updatedAt: new Date()
      })
      note.isFavorite = newFavoriteStatus // Opdater lokalt
      return true
    } catch (error) {
      console.error('Fejl ved skift af favoritstatus:', error)
      return false
    }
  }

  const moveNoteToFolder = async (noteId, folderId) => {
    const note = allNotes.value.find(n => n.id === noteId)
    if (!note) return false
    
    try {
      const targetFolderId = folderId || null
      await updateDoc(doc(db, 'notes', noteId), {
        folderId: targetFolderId,
        updatedAt: new Date()
      })
      note.folderId = targetFolderId // Opdater lokalt
      return true
    } catch (error) {
      console.error('Fejl ved flytning af note:', error)
      return false
    }
  }

  const resetNotes = () => {
    allNotes.value = []
    performanceStats.value = null
    searchTerm.value = ''
    editingNote.value = null
    loading.value = false
  }


  // --- Setters ---

  const setSearchTerm = (term) => {
    searchTerm.value = term
  }

  const setEditingNote = (note) => {
    editingNote.value = note
  }

  return {
    // State & Getters
    allNotes,
    searchedAndSortedNotes, // Omdøbt for klarhed
    performanceStats,
    searchTerm,
    editingNote,
    loading,
    getNoteCounts,
    recentNotes,
    
    // Actions
    loadNotes,
    saveNote,
    updateNote,
    moveToTrash,
    restoreNote,
    permanentDeleteNote,
    emptyTrash,
    cleanupOldTrashedNotes,
    toggleFavorite,
    moveNoteToFolder,
    resetNotes,
    
    // Setters
    setSearchTerm,
    setEditingNote,
    
    // Trash Store
    trashStore
  }
})