<template>
  <div class="h-full flex flex-col space-y-0 md:space-y-4 md:p-0 overflow-hidden">
    <!-- Search field - desktop only -->
    <div class="hidden md:block bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 flex-shrink-0">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-gray-400" />
        <input
          v-model="localSearchTerm"
          type="text"
          placeholder="Søg i noter..."
          class="input-search"
        />
        <button
          v-if="localSearchTerm"
          @click="localSearchTerm = ''"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          <X class="icon-sm" />
        </button>
      </div>
    </div>


    <!-- Notes list -->
    <div class="flex-1 overflow-y-auto space-y-2 min-h-0">
      <div v-if="notes.length === 0" class="bg-gray-800/60 border border-gray-700/50 rounded-lg p-6 text-center">
        <Lock class="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <h3 class="text-gray-300 text-base mb-1">
          {{ getEmptyStateTitle() }}
        </h3>
        <p class="text-gray-500 text-sm">
          {{ getEmptyStateDescription() }}
        </p>
      </div>
      
      <template v-else>

        <!-- Favorite Notes Section -->
        <div v-if="favoriteNotes.length > 0">
          <div class="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
            <Star class="icon-sm fill-current" />
            Favoritter
          </div>
          <div class="space-y-2">
            <div
              v-for="note in favoriteNotes"
              :key="note.id"
            :class="[
              'note-item',
              selectedNoteId === note.id
                ? 'note-item-selected'
                : 'note-item-default'
            ]"
            @click="$emit('noteClick', note)"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2 text-gray-400 text-sm">
                <Clock class="icon-sm" />
                {{ formatDate(note.createdAt, false) }}
                <Star v-if="note.isFavorite" class="icon-sm text-yellow-400 fill-current" />
              </div>
              <div class="flex items-center gap-1" @click.stop>
                <span 
                  :ref="el => setFolderLabelRef(note.id, el)"
                  @click="handleFolderLabelClick(note.id, $event)"
                  class="folder-label mr-1"
                  :style="{
                    backgroundColor: getFolderDisplay(note.folderId).color + '20',
                    borderColor: getFolderDisplay(note.folderId).color + '40',
                    color: getFolderDisplay(note.folderId).color
                  }"
                >
                  <Folder class="w-3 h-3" />
                  {{ getFolderDisplay(note.folderId).name }}
                </span>
                <!-- Note actions dropdown -->
                <div class="relative" @click.stop>
                  <button
                    :ref="el => setNoteMenuRef(note.id, el)"
                    @click="toggleNoteMenu(note.id, $event)"
                    class="p-2 hover:bg-gray-700 rounded transition-colors text-white hover:text-gray-300"
                    title="Mere..."
                  >
                    <EllipsisVertical class="icon-sm" />
                  </button>
                  
                  <!-- Dropdown menu -->
                  <div
                    v-if="activeNoteMenu === note.id"
                    class="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[140px] py-1"
                  >
                    <template v-if="isTrashMode">
                      <button
                        @click="handleRestoreNote(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-green-300 flex items-center gap-2 text-sm"
                      >
                        <RotateCcw class="w-4 h-4" />
                        Gendan
                      </button>
                      <button
                        @click="handlePermanentDelete(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-red-300 flex items-center gap-2 text-sm"
                      >
                        <Trash2 class="w-4 h-4" />
                        Slet permanent
                      </button>
                    </template>
                    <template v-else>
                      <button
                        @click="handleToggleFavorite(note.id)"
                        :class="[
                          'w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-sm',
                          note.isFavorite ? 'text-yellow-300' : 'text-gray-300'
                        ]"
                      >
                        <Star :class="note.isFavorite ? 'fill-current' : ''" class="w-4 h-4" />
                        {{ note.isFavorite ? 'Fjern favorit' : 'Tilføj favorit' }}
                      </button>
                      <button
                        @click="handleDuplicateNote(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-blue-300 flex items-center gap-2 text-sm"
                      >
                        <Copy class="w-4 h-4" />
                        Lav kopi
                      </button>
                      <button
                        @click="handleDeleteNote(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-red-300 flex items-center gap-2 text-sm"
                      >
                        <Trash2 class="w-4 h-4" />
                        Slet
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-white text-sm font-medium mb-1 line-clamp-1">
                {{ note.title }}
              </h3>
              <div class="text-gray-300 text-xs line-clamp-2">
                {{ getPreview(note.content) }}
              </div>
            </div>
          </div>
          </div>
          
          <!-- Separator if there are regular notes too -->
          <div v-if="regularNotes.length > 0" class="border-t border-gray-700/50 my-4"></div>
        </div>

        <!-- Regular Notes Section -->
        <div v-if="regularNotes.length > 0">
          <div v-if="!debouncedSearchTerm" class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 text-sm font-medium">
              <component :is="categoryDescription.icon" :class="[categoryDescription.color, 'icon-sm']" />
              <span :class="categoryDescription.color">{{ categoryDescription.text }}</span>
            </div>
            <button
              v-if="isTrashMode && notes.length > 0"
              @click="handleEmptyTrash"
              class="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 rounded border border-red-400/30 hover:border-red-300/50 transition-colors"
            >
              Tøm papirkurv
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="note in regularNotes"
              :key="note.id"
            :class="[
              'note-item',
              selectedNoteId === note.id
                ? 'note-item-selected'
                : 'note-item-default'
            ]"
            @click="$emit('noteClick', note)"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2 text-gray-400 text-sm">
                <Clock class="icon-sm" />
                {{ formatDate(note.createdAt, false) }}
                <Star v-if="note.isFavorite" class="icon-sm text-yellow-400 fill-current" />
              </div>
              <div class="flex items-center gap-1" @click.stop>
                <span 
                  :ref="el => setFolderLabelRef(note.id, el)"
                  @click="handleFolderLabelClick(note.id, $event)"
                  class="folder-label mr-1"
                  :style="{
                    backgroundColor: getFolderDisplay(note.folderId).color + '20',
                    borderColor: getFolderDisplay(note.folderId).color + '40',
                    color: getFolderDisplay(note.folderId).color
                  }"
                >
                  <Folder class="w-3 h-3" />
                  {{ getFolderDisplay(note.folderId).name }}
                </span>
                <!-- Note actions dropdown -->
                <div class="relative" @click.stop>
                  <button
                    :ref="el => setNoteMenuRef(note.id, el)"
                    @click="toggleNoteMenu(note.id, $event)"
                    class="p-2 hover:bg-gray-700 rounded transition-colors text-white hover:text-gray-300"
                    title="Mere..."
                  >
                    <EllipsisVertical class="icon-sm" />
                  </button>
                  
                  <!-- Dropdown menu -->
                  <div
                    v-if="activeNoteMenu === note.id"
                    class="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[140px] py-1"
                  >
                    <template v-if="isTrashMode">
                      <button
                        @click="handleRestoreNote(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-green-300 flex items-center gap-2 text-sm"
                      >
                        <RotateCcw class="w-4 h-4" />
                        Gendan
                      </button>
                      <button
                        @click="handlePermanentDelete(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-red-300 flex items-center gap-2 text-sm"
                      >
                        <Trash2 class="w-4 h-4" />
                        Slet permanent
                      </button>
                    </template>
                    <template v-else>
                      <button
                        @click="handleToggleFavorite(note.id)"
                        :class="[
                          'w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-sm',
                          note.isFavorite ? 'text-yellow-300' : 'text-gray-300'
                        ]"
                      >
                        <Star :class="note.isFavorite ? 'fill-current' : ''" class="w-4 h-4" />
                        {{ note.isFavorite ? 'Fjern favorit' : 'Tilføj favorit' }}
                      </button>
                      <button
                        @click="handleDuplicateNote(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-blue-300 flex items-center gap-2 text-sm"
                      >
                        <Copy class="w-4 h-4" />
                        Lav kopi
                      </button>
                      <button
                        @click="handleDeleteNote(note.id)"
                        class="w-full px-3 py-2 text-left hover:bg-gray-700 text-red-300 flex items-center gap-2 text-sm"
                      >
                        <Trash2 class="w-4 h-4" />
                        Slet
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-white text-sm font-medium mb-1 line-clamp-1">
                {{ note.title }}
              </h3>
              <div class="text-gray-300 text-xs line-clamp-2">
                {{ getPreview(note.content) }}
              </div>
            </div>
          </div>
          </div>
        </div>
      </template>
    </div>
  </div>
  
  <!-- Folder Dropdown -->
  <FolderDropdown
    v-if="getActiveNote"
    :current-folder-id="getActiveNote.folderId"
    :available-folders="foldersStore.folders"
    :locked-folders="foldersStore.lockedFolders"
    :is-open="activeDropdown !== null"
    :position="dropdownPosition"
    @select="(folderId) => handleFolderSelect(activeDropdown, folderId)"
    @close="closeDropdown"
  />
  
  <!-- Confirm Dialog -->
  <BaseDialog
    :is-open="confirmDialog.isOpen"
    :title="dialogTitle"
    show-default-actions
    :confirm-text="dialogConfirmText"
    cancel-text="Annuller"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
    @close="handleCancelDelete"
  >
    {{ dialogText }}
  </BaseDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Search, Lock, Star, Trash2, Clock, X, Folder, FolderOpen, Archive, Shield, RotateCcw, EllipsisVertical, Copy } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import FolderDropdown from '../folders/FolderDropdown.vue'
import { extractPlainText } from '../../services/aiService.js'
import { useFoldersStore } from '../../stores/folders.js'
import { useTrashStore } from '../../stores/trash.js'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  searchTerm: {
    type: String,
    default: ''
  },
  selectedNoteId: {
    type: String,
    default: null
  },
  selectedFolderId: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['searchChange', 'deleteNote', 'noteClick', 'toggleFavorite', 'moveNoteToFolder', 'restoreNote', 'permanentDeleteNote', 'emptyTrash', 'duplicateNote'])

const localSearchTerm = ref('')
const confirmDialog = ref({ isOpen: false, noteId: null, isPermanent: false, isEmptyTrash: false })
const debouncedSearchTerm = ref('')

// Folders store for folder information
const foldersStore = useFoldersStore()
const _trashStore = useTrashStore()

// Dropdown state
const activeDropdown = ref(null)
const dropdownPosition = ref({ top: 0, left: 0 })
const folderLabelRefs = ref(new Map())

// Note action dropdown state
const activeNoteMenu = ref(null)
const noteMenuRefs = ref(new Map())

// Debounce search term with 300ms delay
let debounceTimeout = null
watch(localSearchTerm, (newValue) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    debouncedSearchTerm.value = newValue
    emit('searchChange', newValue)
  }, 300)
})

// Sync with parent search term
watch(() => props.searchTerm, (newValue) => {
  if (newValue !== localSearchTerm.value) {
    localSearchTerm.value = newValue
    debouncedSearchTerm.value = newValue
  }
}, { immediate: true })

// Separate favorites and regular notes
const favoriteNotes = computed(() => props.notes.filter(note => note.isFavorite))
const regularNotes = computed(() => props.notes.filter(note => !note.isFavorite))

// Check if we're in trash mode
const isTrashMode = computed(() => props.selectedFolderId === 'trash')

// Empty state messages based on context
const getEmptyStateTitle = () => {
  if (debouncedSearchTerm.value) {
    return 'Ingen noter fundet'
  }
  
  if (isTrashMode.value) {
    return 'Papirkurven er tom'
  }
  
  return 'Ingen noter endnu'
}

const getEmptyStateDescription = () => {
  if (debouncedSearchTerm.value) {
    return 'Prøv en anden søgning'
  }
  
  if (isTrashMode.value) {
    return 'Slettede noter vil blive vist her'
  }
  
  return 'Opret din første krypterede note'
}

// Dialog text based on action type
const dialogTitle = computed(() => {
  if (confirmDialog.value.isEmptyTrash) return 'Tøm papirkurv'
  if (confirmDialog.value.isPermanent) return 'Slet note permanent'
  return 'Flyt note til papirkurv'
})

const dialogText = computed(() => {
  if (confirmDialog.value.isEmptyTrash) {
    return 'Er du sikker på at du vil slette alle noter i papirkurven permanent? Denne handling kan ikke fortrydes.'
  }
  if (confirmDialog.value.isPermanent) {
    return 'Er du sikker på at du vil slette denne note permanent? Denne handling kan ikke fortrydes.'
  }
  return 'Er du sikker på at du vil flytte denne note til papirkurven?'
})

const dialogConfirmText = computed(() => {
  if (confirmDialog.value.isEmptyTrash) return 'Tøm papirkurv'
  if (confirmDialog.value.isPermanent) return 'Slet permanent'
  return 'Flyt til papirkurv'
})

// Icon mapping
const iconMap = {
  FolderOpen,
  Clock,
  Archive,
  Shield,
  Folder,
  Trash2
}

// Category descriptions with icons and colors
const categoryDescription = computed(() => {
  switch (props.selectedFolderId) {
    case 'all':
      return {
        icon: iconMap.FolderOpen,
        color: 'text-blue-400',
        text: 'Alle dine noter sorteret efter seneste opdatering'
      }
    case 'recent':
      return {
        icon: iconMap.Clock,
        color: 'text-green-400',
        text: 'Dine 5 senest oprettede noter'
      }
    case 'uncategorized':
      return {
        icon: iconMap.Archive,
        color: 'text-gray-400',
        text: 'Noter uden mappe'
      }
    case 'secure':
      return {
        icon: iconMap.Shield,
        color: 'text-red-400',
        text: 'Sikrede noter beskyttet med PIN'
      }
    case 'trash':
      return {
        icon: iconMap.Trash2,
        color: 'text-red-400',
        text: 'Slettede noter (automatisk slettet efter 30 dage)'
      }
    default: {
      // For custom folders, get folder name
      const folder = foldersStore.folders.find(f => f.id === props.selectedFolderId)
      return {
        icon: iconMap.Folder,
        color: 'text-purple-400',
        text: folder ? `Noter i mappen "${folder.name}"` : 'Valgt mappe'
      }
    }
  }
})


// Extract plain text from HTML content
const extractTextFromHtml = (content) => {
  if (!content || typeof content !== 'string') return ''
  
  // Use extractPlainText from aiService to remove HTML tags
  return extractPlainText(content)
}

const getPreview = (content) => {
  if (!content) return ''
  const plainText = extractTextFromHtml(content)
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

const formatDate = (date, includeTime = false) => {
  if (!date) return ''
  
  // Handle Firebase Timestamp
  const jsDate = date.toDate ? date.toDate() : new Date(date)
  
  if (includeTime) {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return jsDate.toLocaleDateString('da-DK', options)
  } else {
    // Only return date without time
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
    return jsDate.toLocaleDateString('da-DK', options)
  }
}

// Get folder display info (name and color)
const getFolderDisplay = (folderId) => {
  if (!folderId) {
    return { name: 'Ukategoriseret', color: '#6b7280' }
  }
  
  if (folderId === 'secure') {
    return { name: 'Sikker', color: '#dc2626' }
  }
  
  const folder = foldersStore.folders.find(f => f.id === folderId)
  if (folder) {
    return { name: folder.name, color: folder.color }
  }
  
  return { name: 'Ukategoriseret', color: '#6b7280' }
}

const handleToggleFavorite = (noteId) => {
  emit('toggleFavorite', noteId)
  closeNoteMenu()
}

const handleDuplicateNote = (noteId) => {
  emit('duplicateNote', noteId)
  closeNoteMenu()
}

const handleDeleteNote = (noteId) => {
  confirmDialog.value = { isOpen: true, noteId }
  closeNoteMenu()
}

const handleRestoreNote = (noteId) => {
  emit('restoreNote', noteId)
  closeNoteMenu()
}

const handlePermanentDelete = (noteId) => {
  confirmDialog.value = { isOpen: true, noteId, isPermanent: true }
  closeNoteMenu()
}

const handleEmptyTrash = () => {
  confirmDialog.value = { isOpen: true, noteId: null, isEmptyTrash: true }
}

const handleConfirmDelete = () => {
  if (confirmDialog.value.isEmptyTrash) {
    emit('emptyTrash')
  } else if (confirmDialog.value.noteId) {
    if (confirmDialog.value.isPermanent) {
      emit('permanentDeleteNote', confirmDialog.value.noteId)
    } else {
      emit('deleteNote', confirmDialog.value.noteId)
    }
  }
  confirmDialog.value = { isOpen: false, noteId: null, isPermanent: false, isEmptyTrash: false }
}

const handleCancelDelete = () => {
  confirmDialog.value = { isOpen: false, noteId: null, isPermanent: false, isEmptyTrash: false }
}

// Store refs to folder label elements for positioning
const setFolderLabelRef = (noteId, el) => {
  if (el) {
    folderLabelRefs.value.set(noteId, el)
  } else {
    folderLabelRefs.value.delete(noteId)
  }
}

// Handle folder label click to open dropdown
const handleFolderLabelClick = async (noteId, event) => {
  event.stopPropagation()
  
  if (activeDropdown.value === noteId) {
    // Close if already open
    activeDropdown.value = null
    return
  }
  
  // Calculate dropdown position
  const labelElement = folderLabelRefs.value.get(noteId)
  if (labelElement) {
    const rect = labelElement.getBoundingClientRect()
    dropdownPosition.value = {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX
    }
  }
  
  activeDropdown.value = noteId
}

// Handle folder selection from dropdown
const handleFolderSelect = (noteId, newFolderId) => {
  activeDropdown.value = null
  emit('moveNoteToFolder', noteId, newFolderId)
}

// Close dropdown
const closeDropdown = () => {
  activeDropdown.value = null
}

// Get note by ID for dropdown
const getActiveNote = computed(() => {
  if (!activeDropdown.value) return null
  return props.notes.find(note => note.id === activeDropdown.value)
})

// Note menu functions
const setNoteMenuRef = (noteId, el) => {
  if (el) {
    noteMenuRefs.value.set(noteId, el)
  } else {
    noteMenuRefs.value.delete(noteId)
  }
}

const toggleNoteMenu = (noteId, event) => {
  event.stopPropagation()
  
  if (activeNoteMenu.value === noteId) {
    activeNoteMenu.value = null
  } else {
    activeNoteMenu.value = noteId
  }
}

const closeNoteMenu = () => {
  activeNoteMenu.value = null
}

// Close menu when clicking outside
const handleDocumentClick = (event) => {
  if (activeNoteMenu.value) {
    const menuElement = noteMenuRefs.value.get(activeNoteMenu.value)
    if (menuElement && !menuElement.closest('.relative').contains(event.target)) {
      closeNoteMenu()
    }
  }
}

onMounted(() => {
  debouncedSearchTerm.value = props.searchTerm
  document.addEventListener('click', handleDocumentClick)
})

// Clean up event listener
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>