import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  writeBatch // Importer writeBatch for effektiv sletning
} from 'firebase/firestore'
import { db } from '../firebase'
import { encryptText, decryptText } from '../utils/encryption'

// Helper til at udtrække ren tekst fra en TipTap/Lexical JSON-struktur.
const extractTextFromContent = (content) => {
  if (!content || typeof content !== 'string') return ''
  
  try {
    const parsed = JSON.parse(content)
    if (!parsed?.root?.children) return content // Returner original hvis ikke valid JSON
    
    const extractFromChildren = (children) => {
      return children.map(child => {
        if (child.type === 'text') {
          return child.text || ''
        }
        if (child.children) {
          return extractFromChildren(child.children)
        }
        return ''
      }).join('')
    }
    
    return extractFromChildren(parsed.root.children)
  } catch {
    // Hvis JSON.parse fejler, er det sandsynligvis allerede ren tekst.
    return content
  }
}

export const useNotesStore = defineStore('notes', () => {
  // --- State ---
  const allNotes = ref([]) // Eneste "source of truth" for noter
  const performanceStats = ref(null)
  const searchTerm = ref('')
  const editingNote = ref(null)
  const loading = ref(false)

  // --- Getters (Computed Properties) ---

  // Computed property der håndterer søgning og sortering.
  // Filtrering efter mappe skal ske i den komponent, der viser noterne.
  const searchedAndSortedNotes = computed(() => {
    let notesToProcess = allNotes.value

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
    const initialCounts = { all: 0, uncategorized: 0, secure: 0 }
    folders.forEach(folder => { initialCounts[folder.id] = 0 })

    return allNotes.value.reduce((counts, note) => {
      if (note.folderId === 'secure') {
        counts.secure++
      } else {
        counts.all++
        const folderKey = note.folderId || 'uncategorized'
        if (counts.hasOwnProperty(folderKey)) {
          counts[folderKey]++
        }
      }
      return counts
    }, initialCounts)
  }

  // --- Actions ---

  const loadNotes = async (user, encryptionKey) => {
    loading.value = true
    const startTime = performance.now()
    
    try {
      const q = query(
        collection(db, 'notes'), 
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc') // Sorter efter senest opdateret
      )
      
      const querySnapshot = await getDocs(q)
      const decryptedNotes = []
      
      const decryptionPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const noteData = docSnapshot.data()
        try {
          const [decryptedTitle, decryptedContent] = await Promise.all([
            noteData.encryptedTitle ? decryptText(noteData.encryptedTitle, encryptionKey) : Promise.resolve(''),
            decryptText(noteData.encryptedContent, encryptionKey)
          ])

          // Hvis titel er tom (f.eks. fra ældre noter), generer en fallback
          const title = decryptedTitle || (decryptedContent.substring(0, 50) + (decryptedContent.length > 50 ? '...' : ''))

          return {
            id: docSnapshot.id,
            title,
            content: decryptedContent,
            folderId: noteData.folderId || null,
            isFavorite: noteData.isFavorite || false,
            createdAt: noteData.createdAt.toDate(),
            updatedAt: noteData.updatedAt.toDate()
          }
        } catch (error) {
          console.error(`Kunne ikke dekryptere note ${docSnapshot.id}. Den vil blive sprunget over.`, error)
          return null // Returner null hvis en note fejler, så den kan filtreres fra
        }
      })
      
      const resolvedNotes = await Promise.all(decryptionPromises)
      allNotes.value = resolvedNotes.filter(note => note !== null) // Fjern noter der ikke kunne dekrypteres
      
      performanceStats.value = {
        loadTime: performance.now() - startTime,
        notesCount: allNotes.value.length,
        totalChars: allNotes.value.reduce((sum, note) => sum + note.content.length + note.title.length, 0)
      }
      
    } catch (error) {
      console.error('Fejl under indlæsning af noter:', error)
    } finally {
      loading.value = false
    }
  }

  const saveNote = async (title, content, folderId, user, encryptionKey) => {
    if (!title.trim() || !content.trim() || !user || !encryptionKey) return false
    
    try {
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

  const updateNote = async (noteId, newTitle, newContent, encryptionKey) => {
    if (!encryptionKey) return false
    
    try {
      const [encryptedTitle, encryptedContent] = await Promise.all([
        encryptText(newTitle, encryptionKey),
        encryptText(newContent, encryptionKey)
      ])
      
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

  const deleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId))
      allNotes.value = allNotes.value.filter(note => note.id !== noteId)
      return true
    } catch (error) {
      console.error('Fejl ved sletning af note:', error)
      return false
    }
  }

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

  // --- Development-Only Actions ---

  // Beskyttet funktion, der kun kan køres i udviklingstilstand.
  const clearAllUserData = async (user) => {
    if (!import.meta.env.DEV) {
      console.warn('clearAllUserData() kan kun kaldes i udviklingstilstand.')
      return false
    }
    if (!user?.uid) return false
    
    console.warn('🗑️ Sletter ALLE data for bruger:', user.uid)
    try {
      // Brug batch-writes for effektivitet
      const batch = writeBatch(db)

      // Find og slet noter
      const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.uid))
      const notesSnapshot = await getDocs(notesQuery)
      notesSnapshot.docs.forEach(doc => batch.delete(doc.ref))
      
      // Find og slet mapper (forudsætter en foldersStore eller lignende)
      const foldersQuery = query(collection(db, 'folders'), where('userId', '==', user.uid))
      const foldersSnapshot = await getDocs(foldersQuery)
      foldersSnapshot.docs.forEach(doc => batch.delete(doc.ref))
      
      // Slet brugerindstillinger
      batch.delete(doc(db, 'userSettings', user.uid))
      
      await batch.commit()
      
      console.log('✅ Alle brugerdata er slettet.')
      resetNotes()
      // Husk også at resette foldersStore osv.
      return true
    } catch (error) {
      console.error('❌ Fejl under sletning af brugerdata:', error)
      return false
    }
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
    
    // Actions
    loadNotes,
    saveNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    moveNoteToFolder,
    resetNotes,
    
    // Setters
    setSearchTerm,
    setEditingNote,

    // Dev tools
    clearAllUserData
  }
})