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
  orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { encryptText, decryptText } from '../utils/encryption'

// Helper function to extract plain text from TipTap/Lexical JSON
const extractTextFromContent = (content) => {
  if (!content || typeof content !== 'string') return ''
  
  try {
    const parsed = JSON.parse(content)
    if (!parsed || !parsed.root || !parsed.root.children) return content
    
    const extractFromChildren = (children) => {
      return children.map(child => {
        if (child.type === 'text') {
          return child.text || ''
        } else if (child.children) {
          return extractFromChildren(child.children)
        }
        return ''
      }).join('')
    }
    
    return extractFromChildren(parsed.root.children)
  } catch {
    return content
  }
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([])
  const allNotes = ref([])
  const performanceStats = ref(null)
  const searchTerm = ref('')
  const editingNote = ref(null)
  const loading = ref(false)

  const filteredNotes = computed(() => {
    let filtered = allNotes.value
    
    // Filter by search term
    if (searchTerm.value) {
      const searchLower = searchTerm.value.toLowerCase()
      filtered = filtered.filter(note => {
        const plainTextContent = extractTextFromContent(note.content)
        return note.title.toLowerCase().includes(searchLower) ||
               plainTextContent.toLowerCase().includes(searchLower)
      })
    }
    
    // Sort favorites to the top, then by creation date
    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return b.createdAt - a.createdAt
    })
    
    return filtered
  })

  const loadNotes = async (user, encryptionKey) => {
    const startTime = performance.now()
    loading.value = true
    
    try {
      const notesRef = collection(db, 'notes')
      const q = query(
        notesRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const decryptedNotes = []
      let totalChars = 0
      
      for (const docSnapshot of querySnapshot.docs) {
        const noteData = docSnapshot.data()
        try {
          const decryptedContent = await decryptText(noteData.encryptedContent, encryptionKey)
          
          let decryptedTitle = ''
          if (noteData.encryptedTitle) {
            decryptedTitle = await decryptText(noteData.encryptedTitle, encryptionKey)
          } else {
            decryptedTitle = decryptedContent.length > 50 
              ? decryptedContent.substring(0, 50) + '...'
              : decryptedContent
          }
          
          decryptedNotes.push({
            id: docSnapshot.id,
            title: decryptedTitle,
            content: decryptedContent,
            encryptedTitle: noteData.encryptedTitle,
            encryptedContent: noteData.encryptedContent,
            folderId: noteData.folderId || null,
            isFavorite: noteData.isFavorite || false,
            createdAt: noteData.createdAt.toDate(),
            updatedAt: noteData.updatedAt.toDate()
          })
          totalChars += decryptedContent.length + decryptedTitle.length
        } catch (error) {
          console.error('Failed to decrypt note:', docSnapshot.id, error)
        }
      }
      
      allNotes.value = decryptedNotes
      
      const loadTime = performance.now() - startTime
      performanceStats.value = {
        loadTime,
        totalChars,
        notesCount: decryptedNotes.length
      }
      
    } catch (error) {
      console.error('Load notes error:', error)
    } finally {
      loading.value = false
    }
  }

  const filterNotesByFolder = (selectedFolderId) => {
    let filtered = allNotes.value
    
    if (selectedFolderId === 'all') {
      filtered = allNotes.value.filter(note => note.folderId !== 'secure')
    } else if (selectedFolderId === 'uncategorized') {
      filtered = allNotes.value.filter(note => !note.folderId)
    } else if (selectedFolderId === 'secure') {
      filtered = allNotes.value.filter(note => note.folderId === 'secure')
    } else {
      filtered = allNotes.value.filter(note => note.folderId === selectedFolderId)
    }
    
    notes.value = filtered
    return filtered
  }

  const getNoteCounts = (folders) => {
    const counts = {
      all: allNotes.value.filter(note => note.folderId !== 'secure').length,
      uncategorized: allNotes.value.filter(note => !note.folderId).length,
      secure: allNotes.value.filter(note => note.folderId === 'secure').length
    }
    
    folders.forEach(folder => {
      counts[folder.id] = allNotes.value.filter(note => note.folderId === folder.id).length
    })
    
    return counts
  }

  const saveNote = async (title, content, folderId, user, encryptionKey) => {
    if (!title.trim() || !content.trim() || !encryptionKey || !user) return false
    
    const startTime = performance.now()
    
    try {
      const encryptedTitle = await encryptText(title, encryptionKey)
      const encryptedContent = await encryptText(content, encryptionKey)
      const encryptTime = performance.now()
      
      const noteData = {
        userId: user.uid,
        encryptedTitle,
        encryptedContent,
        folderId: folderId || null,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, 'notes'), noteData)
      
      const newNote = {
        id: docRef.id,
        title,
        content,
        encryptedTitle,
        encryptedContent,
        folderId: folderId || null,
        isFavorite: false,
        createdAt: noteData.createdAt,
        updatedAt: noteData.updatedAt
      }
      
      allNotes.value = [newNote, ...allNotes.value]
      
      const totalTime = performance.now()
      performanceStats.value = {
        encryptTime: encryptTime - startTime,
        totalTime: totalTime - startTime,
        textLength: content.length + title.length
      }
      
      return true
    } catch (error) {
      console.error('Save error:', error)
      return false
    }
  }

  const updateNote = async (noteId, newTitle, newContent, encryptionKey, user) => {
    if (!encryptionKey || !user) return false
    
    try {
      const encryptedTitle = await encryptText(newTitle, encryptionKey)
      const encryptedContent = await encryptText(newContent, encryptionKey)
      
      const noteRef = doc(db, 'notes', noteId)
      await updateDoc(noteRef, {
        encryptedTitle,
        encryptedContent,
        updatedAt: new Date()
      })
      
      allNotes.value = allNotes.value.map(note => 
        note.id === noteId 
          ? { 
              ...note, 
              title: newTitle,
              content: newContent, 
              encryptedTitle,
              encryptedContent, 
              updatedAt: new Date() 
            }
          : note
      )
      
      editingNote.value = null
      return true
    } catch (error) {
      console.error('Update error:', error)
      return false
    }
  }

  const deleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId))
      
      allNotes.value = allNotes.value.filter(note => note.id !== noteId)
      editingNote.value = null
      
      return true
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }

  const toggleFavorite = async (noteId) => {
    try {
      const note = allNotes.value.find(n => n.id === noteId)
      if (!note) return false
      
      const newFavoriteStatus = !note.isFavorite
      
      const noteRef = doc(db, 'notes', noteId)
      await updateDoc(noteRef, {
        isFavorite: newFavoriteStatus,
        updatedAt: new Date()
      })
      
      allNotes.value = allNotes.value.map(note => 
        note.id === noteId 
          ? { ...note, isFavorite: newFavoriteStatus, updatedAt: new Date() }
          : note
      )
      
      return true
    } catch (error) {
      console.error('Toggle favorite error:', error)
      return false
    }
  }

  const moveNoteToFolder = async (noteId, folderId) => {
    try {
      const noteRef = doc(db, 'notes', noteId)
      await updateDoc(noteRef, {
        folderId: folderId || null,
        updatedAt: new Date()
      })
      
      allNotes.value = allNotes.value.map(note => 
        note.id === noteId 
          ? { ...note, folderId: folderId || null, updatedAt: new Date() }
          : note
      )
      
      return true
    } catch (error) {
      console.error('Move note error:', error)
      return false
    }
  }

  const resetNotes = () => {
    allNotes.value = []
    notes.value = []
    performanceStats.value = null
    searchTerm.value = ''
    editingNote.value = null
    loading.value = false
  }

  // DEBUG: Clear all data (for development only)
  const clearAllUserData = async (user) => {
    if (!user?.uid) return false
    
    try {
      console.log('🗑️ Clearing all user data...')
      
      // Delete all notes
      const notesRef = collection(db, 'notes')
      const notesQuery = query(notesRef, where('userId', '==', user.uid))
      const notesSnapshot = await getDocs(notesQuery)
      
      const deletePromises = []
      notesSnapshot.docs.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      
      // Delete all folders  
      const foldersRef = collection(db, 'folders')
      const foldersQuery = query(foldersRef, where('userId', '==', user.uid))
      const foldersSnapshot = await getDocs(foldersQuery)
      
      foldersSnapshot.docs.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      
      // Delete user settings
      const userSettingsRef = doc(db, 'userSettings', user.uid)
      deletePromises.push(deleteDoc(userSettingsRef))
      
      await Promise.all(deletePromises)
      
      console.log('✅ All user data cleared')
      resetNotes()
      return true
    } catch (error) {
      console.error('❌ Error clearing data:', error)
      return false
    }
  }

  const setSearchTerm = (term) => {
    searchTerm.value = term
  }

  const setEditingNote = (note) => {
    editingNote.value = note
  }

  return {
    notes: filteredNotes,
    allNotes,
    performanceStats,
    searchTerm,
    editingNote,
    loading,
    loadNotes,
    filterNotesByFolder,
    getNoteCounts,
    saveNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    moveNoteToFolder,
    resetNotes,
    clearAllUserData,
    setSearchTerm,
    setEditingNote
  }
})