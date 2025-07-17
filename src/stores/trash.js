import { defineStore } from 'pinia'
import { computed } from 'vue'
import { updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

export const useTrashStore = defineStore('trash', () => {
  // Get notes store reference (will be passed in from notes store)
  let notesStore = null

  // Initialize with notes store reference
  const initialize = (store) => {
    notesStore = store
  }

  // --- Trash Operations ---

  const moveToTrash = async (noteId) => {
    if (!notesStore) {
      console.error('Trash store not initialized with notes store')
      return false
    }

    const note = notesStore.allNotes.value.find(n => n.id === noteId)
    if (!note) return false
    
    try {
      const now = new Date()
      await updateDoc(doc(db, 'notes', noteId), {
        isDeleted: true,
        deletedAt: now,
        updatedAt: now
      })
      
      // Opdater lokalt
      note.isDeleted = true
      note.deletedAt = now
      note.updatedAt = now
      return true
    } catch (error) {
      console.error('Fejl ved flytning af note til papirkurv:', error)
      return false
    }
  }

  const restoreNote = async (noteId) => {
    if (!notesStore) {
      console.error('Trash store not initialized with notes store')
      return false
    }

    const note = notesStore.allNotes.value.find(n => n.id === noteId)
    if (!note) return false
    
    try {
      const now = new Date()
      await updateDoc(doc(db, 'notes', noteId), {
        isDeleted: false,
        deletedAt: null,
        updatedAt: now
      })
      
      // Opdater lokalt
      note.isDeleted = false
      note.deletedAt = null
      note.updatedAt = now
      return true
    } catch (error) {
      console.error('Fejl ved gendannelse af note:', error)
      return false
    }
  }

  const permanentDeleteNote = async (noteId) => {
    if (!notesStore) {
      console.error('Trash store not initialized with notes store')
      return false
    }

    try {
      await deleteDoc(doc(db, 'notes', noteId))
      notesStore.allNotes.value = notesStore.allNotes.value.filter(note => note.id !== noteId)
      return true
    } catch (error) {
      console.error('Fejl ved permanent sletning af note:', error)
      return false
    }
  }

  const emptyTrash = async () => {
    if (!notesStore) {
      console.error('Trash store not initialized with notes store')
      return false
    }

    const trashedNotes = notesStore.allNotes.value.filter(note => note.isDeleted)
    if (trashedNotes.length === 0) return true
    
    try {
      // Slet alle noter i papirkurv fra Firebase
      const deletePromises = trashedNotes.map(note => 
        deleteDoc(doc(db, 'notes', note.id))
      )
      await Promise.all(deletePromises)
      
      // Fjern fra lokal state
      notesStore.allNotes.value = notesStore.allNotes.value.filter(note => !note.isDeleted)
      return true
    } catch (error) {
      console.error('Fejl ved tømning af papirkurv:', error)
      return false
    }
  }

  const cleanupOldTrashedNotes = async () => {
    if (!notesStore) {
      console.error('Trash store not initialized with notes store')
      return false
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const oldTrashedNotes = notesStore.allNotes.value.filter(note => 
      note.isDeleted && 
      note.deletedAt && 
      new Date(note.deletedAt) < thirtyDaysAgo
    )
    
    if (oldTrashedNotes.length === 0) return true
    
    try {
      // Slet gamle noter permanent
      const deletePromises = oldTrashedNotes.map(note => 
        deleteDoc(doc(db, 'notes', note.id))
      )
      await Promise.all(deletePromises)
      
      // Fjern fra lokal state
      notesStore.allNotes.value = notesStore.allNotes.value.filter(note => 
        !oldTrashedNotes.find(oldNote => oldNote.id === note.id)
      )
      
      console.log(`Automatisk slettet ${oldTrashedNotes.length} gamle noter fra papirkurv`)
      return true
    } catch (error) {
      console.error('Fejl ved cleanup af gamle noter:', error)
      return false
    }
  }

  // --- Computed Properties ---

  const trashedNotes = computed(() => {
    if (!notesStore) return []
    
    return notesStore.allNotes.value
      .filter(note => note.isDeleted)
      .sort((a, b) => {
        // Sorter efter deletedAt (senest slettede først)
        if (a.deletedAt && b.deletedAt) {
          return b.deletedAt.getTime() - a.deletedAt.getTime()
        }
        // Fallback til updatedAt hvis deletedAt mangler
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      })
  })

  // Helper function to get trash count
  const getTrashCount = () => {
    if (!notesStore) return 0
    return notesStore.allNotes.value.filter(note => note.isDeleted).length
  }

  // Helper function to filter out deleted notes
  const filterActiveNotes = (notes) => {
    return notes.filter(note => !note.isDeleted)
  }

  return {
    // Initialization
    initialize,
    
    // Actions
    moveToTrash,
    restoreNote,
    permanentDeleteNote,
    emptyTrash,
    cleanupOldTrashedNotes,
    
    // Computed
    trashedNotes,
    
    // Helpers
    getTrashCount,
    filterActiveNotes
  }
})