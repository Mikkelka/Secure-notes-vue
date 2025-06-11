import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const selectedNote = ref(null)
  const showDataExport = ref(false)
  const showImportData = ref(false)
  const showAiModal = ref(false)
  const showAppSettings = ref(false)
  const showMobileSidebar = ref(false)
  const activeMobileButton = ref(null)
  const showMobileNoteEditor = ref(false)
  const showMobileSettings = ref(false)
  const showMobileSearch = ref(false)
  const folderConfirmDialog = ref({ isOpen: false, folderId: null })

  const setSelectedNote = (note) => {
    selectedNote.value = note
  }

  const closeNoteViewer = () => {
    selectedNote.value = null
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

  const openAppSettings = () => {
    showAppSettings.value = true
  }

  const closeAppSettings = () => {
    showAppSettings.value = false
  }

  const toggleMobileSidebar = () => {
    closeMobileDrawers()
    showMobileSidebar.value = !showMobileSidebar.value
    activeMobileButton.value = showMobileSidebar.value ? 'folders' : null
  }

  const closeMobileSidebar = () => {
    showMobileSidebar.value = false
    if (activeMobileButton.value === 'folders') {
      activeMobileButton.value = null
    }
  }

  const toggleMobileNoteEditor = () => {
    closeMobileDrawers()
    showMobileNoteEditor.value = !showMobileNoteEditor.value
    activeMobileButton.value = showMobileNoteEditor.value ? 'add' : null
  }

  const closeMobileNoteEditor = () => {
    showMobileNoteEditor.value = false
    if (activeMobileButton.value === 'add') {
      activeMobileButton.value = null
    }
  }

  const toggleMobileSettings = () => {
    closeMobileDrawers()
    showMobileSettings.value = !showMobileSettings.value
    activeMobileButton.value = showMobileSettings.value ? 'settings' : null
  }

  const closeMobileSettings = () => {
    showMobileSettings.value = false
    if (activeMobileButton.value === 'settings') {
      activeMobileButton.value = null
    }
  }

  const toggleMobileSearch = () => {
    closeMobileDrawers()
    showMobileSearch.value = !showMobileSearch.value
    activeMobileButton.value = showMobileSearch.value ? 'search' : null
  }

  const closeMobileSearch = () => {
    showMobileSearch.value = false
    if (activeMobileButton.value === 'search') {
      activeMobileButton.value = null
    }
  }

  const closeMobileDrawers = () => {
    showMobileSidebar.value = false
    showMobileNoteEditor.value = false
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
    selectedNote.value = null
    showDataExport.value = false
    showImportData.value = false
    showAiModal.value = false
    showAppSettings.value = false
    showMobileSidebar.value = false
    activeMobileButton.value = null
    showMobileNoteEditor.value = false
    showMobileSettings.value = false
    showMobileSearch.value = false
    folderConfirmDialog.value = { isOpen: false, folderId: null }
  }

  return {
    selectedNote,
    showDataExport,
    showImportData,
    showAiModal,
    showAppSettings,
    showMobileSidebar,
    activeMobileButton,
    showMobileNoteEditor,
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
    openAppSettings,
    closeAppSettings,
    toggleMobileSidebar,
    closeMobileSidebar,
    toggleMobileNoteEditor,
    closeMobileNoteEditor,
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