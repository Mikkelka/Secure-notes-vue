import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNotesStore } from './notes'

export const useUIStore = defineStore('ui', () => {
  const selectedNoteId = ref(null)
  const notesStore = useNotesStore()
  
  const selectedNote = computed(() => {
    if (!selectedNoteId.value) return null
    return notesStore.allNotes.find(note => note.id === selectedNoteId.value) || null
  })
  const showDataExport = ref(false)
  const showImportData = ref(false)
  const showAiModal = ref(false)
  const showAiDebug = ref(false)
  const showAppSettings = ref(false)
  const showMobileSidebar = ref(false)
  const activeMobileButton = ref(null)
  const showMobileQuickNote = ref(false)
  const showMobileSettings = ref(false)
  const showMobileSearch = ref(false)
  const folderConfirmDialog = ref({ isOpen: false, folderId: null })

  const setSelectedNote = (note) => {
    selectedNoteId.value = note ? note.id : null
  }

  const closeNoteViewer = () => {
    selectedNoteId.value = null
  }

  const openDataExport = () => {
    showDataExport.value = true
  }

  const closeDataExport = () => {
    showDataExport.value = false
  }

  const openImportData = () => {
    showImportData.value = true
  }

  const closeImportData = () => {
    showImportData.value = false
  }

  const openAiModal = () => {
    showAiModal.value = true
  }

  const closeAiModal = () => {
    showAiModal.value = false
  }

  const openAiDebug = () => {
    showAiDebug.value = true
  }

  const closeAiDebug = () => {
    showAiDebug.value = false
  }

  const openAppSettings = () => {
    showAppSettings.value = true
  }

  const closeAppSettings = () => {
    showAppSettings.value = false
  }

  const toggleMobileSidebar = () => {
    if (showMobileSidebar.value) {
      closeMobileSidebar()
    } else {
      closeMobileDrawers()
      showMobileSidebar.value = true
      activeMobileButton.value = 'folders'
    }
  }

  const closeMobileSidebar = () => {
    showMobileSidebar.value = false
    if (activeMobileButton.value === 'folders') {
      activeMobileButton.value = null
    }
  }

  const toggleMobileQuickNote = () => {
    if (showMobileQuickNote.value) {
      closeMobileQuickNote()
    } else {
      closeMobileDrawers()
      showMobileQuickNote.value = true
      activeMobileButton.value = 'add'
    }
  }

  const closeMobileQuickNote = () => {
    showMobileQuickNote.value = false
    if (activeMobileButton.value === 'add') {
      activeMobileButton.value = null
    }
  }

  const toggleMobileSettings = () => {
    if (showMobileSettings.value) {
      closeMobileSettings()
    } else {
      closeMobileDrawers()
      showMobileSettings.value = true
      activeMobileButton.value = 'settings'
    }
  }

  const closeMobileSettings = () => {
    showMobileSettings.value = false
    if (activeMobileButton.value === 'settings') {
      activeMobileButton.value = null
    }
  }

  const toggleMobileSearch = () => {
    if (showMobileSearch.value) {
      closeMobileSearch()
    } else {
      closeMobileDrawers()
      showMobileSearch.value = true
      activeMobileButton.value = 'search'
    }
  }

  const closeMobileSearch = () => {
    showMobileSearch.value = false
    if (activeMobileButton.value === 'search') {
      activeMobileButton.value = null
    }
  }

  const closeMobileDrawers = () => {
    showMobileSidebar.value = false
    showMobileQuickNote.value = false
    showMobileSettings.value = false
    showMobileSearch.value = false
  }

  const openFolderConfirmDialog = (folderId) => {
    folderConfirmDialog.value = { isOpen: true, folderId }
  }

  const closeFolderConfirmDialog = () => {
    folderConfirmDialog.value = { isOpen: false, folderId: null }
  }

  const resetUI = () => {
    selectedNoteId.value = null
    showDataExport.value = false
    showImportData.value = false
    showAiModal.value = false
    showAiDebug.value = false
    showAppSettings.value = false
    showMobileSidebar.value = false
    activeMobileButton.value = null
    showMobileQuickNote.value = false
    showMobileSettings.value = false
    showMobileSearch.value = false
    folderConfirmDialog.value = { isOpen: false, folderId: null }
  }

  return {
    selectedNote,
    selectedNoteId,
    showDataExport,
    showImportData,
    showAiModal,
    showAiDebug,
    showAppSettings,
    showMobileSidebar,
    activeMobileButton,
    showMobileQuickNote,
    showMobileSettings,
    showMobileSearch,
    folderConfirmDialog,
    setSelectedNote,
    closeNoteViewer,
    openDataExport,
    closeDataExport,
    openImportData,
    closeImportData,
    openAiModal,
    closeAiModal,
    openAiDebug,
    closeAiDebug,
    openAppSettings,
    closeAppSettings,
    toggleMobileSidebar,
    closeMobileSidebar,
    toggleMobileQuickNote,
    closeMobileQuickNote,
    toggleMobileSettings,
    closeMobileSettings,
    toggleMobileSearch,
    closeMobileSearch,
    closeMobileDrawers,
    openFolderConfirmDialog,
    closeFolderConfirmDialog,
    resetUI
  }
})