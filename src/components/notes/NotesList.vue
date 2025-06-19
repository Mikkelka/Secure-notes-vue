<template>
  <div class="h-full flex flex-col space-y-0 md:space-y-4 md:p-0 overflow-hidden">
    <!-- Search field - desktop only -->
    <div class="hidden md:block bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 flex-shrink-0">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="localSearchTerm"
          type="text"
          placeholder="Søg i noter..."
          class="w-full pl-9 pr-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all text-sm"
        />
        <button
          v-if="localSearchTerm"
          @click="localSearchTerm = ''"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Notes list -->
    <div class="flex-1 overflow-y-auto space-y-2 min-h-0">
      <div v-if="notes.length === 0" class="bg-gray-800/60 border border-gray-700/50 rounded-lg p-6 text-center">
        <Lock class="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <h3 class="text-gray-300 text-base mb-1">
          {{ debouncedSearchTerm ? 'Ingen noter fundet' : 'Ingen noter endnu' }}
        </h3>
        <p class="text-gray-500 text-sm">
          {{ debouncedSearchTerm ? 'Prøv en anden søgning' : 'Opret din første krypterede note' }}
        </p>
      </div>
      
      <template v-else>
        <!-- Favorite Notes Section -->
        <div v-if="favoriteNotes.length > 0">
          <div class="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
            <Star class="w-4 h-4 fill-current" />
            Favoritter
          </div>
          <div class="space-y-2">
            <div
              v-for="note in favoriteNotes"
              :key="note.id"
            :class="[
              'bg-gray-800/60 border rounded-lg p-3 transition-all cursor-pointer',
              selectedNoteId === note.id
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-gray-700/50 hover:bg-gray-800/80'
            ]"
            @click="$emit('noteClick', note)"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2 text-gray-400 text-sm">
                <Clock class="w-4 h-4" />
                {{ formatDate(note.createdAt, true) }}
                <Star v-if="note.isFavorite" class="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div class="flex items-center gap-1" @click.stop>
                <span 
                  class="px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 mr-1"
                  :style="{
                    backgroundColor: getFolderDisplay(note.folderId).color + '20',
                    borderColor: getFolderDisplay(note.folderId).color + '40',
                    color: getFolderDisplay(note.folderId).color
                  }"
                >
                  <Folder class="w-3 h-3" />
                  {{ getFolderDisplay(note.folderId).name }}
                </span>
                <button
                  @click="handleToggleFavorite(note.id)"
                  :class="[
                    'p-2 hover:bg-gray-700 rounded transition-colors',
                    note.isFavorite
                      ? 'text-yellow-400 hover:text-yellow-300'
                      : 'text-gray-400 hover:text-yellow-400'
                  ]"
                >
                  <Star :class="note.isFavorite ? 'fill-current' : ''" class="w-4 h-4" />
                </button>
                <button
                  @click="handleDeleteNote(note.id)"
                  class="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
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
          <div v-if="favoriteNotes.length > 0" class="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
            Andre noter
          </div>
          <div class="space-y-2">
            <div
              v-for="note in regularNotes"
              :key="note.id"
            :class="[
              'bg-gray-800/60 border rounded-lg p-3 transition-all cursor-pointer',
              selectedNoteId === note.id
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-gray-700/50 hover:bg-gray-800/80'
            ]"
            @click="$emit('noteClick', note)"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2 text-gray-400 text-sm">
                <Clock class="w-4 h-4" />
                {{ formatDate(note.createdAt, true) }}
                <Star v-if="note.isFavorite" class="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div class="flex items-center gap-1" @click.stop>
                <span 
                  class="px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 mr-1"
                  :style="{
                    backgroundColor: getFolderDisplay(note.folderId).color + '20',
                    borderColor: getFolderDisplay(note.folderId).color + '40',
                    color: getFolderDisplay(note.folderId).color
                  }"
                >
                  <Folder class="w-3 h-3" />
                  {{ getFolderDisplay(note.folderId).name }}
                </span>
                <button
                  @click="handleToggleFavorite(note.id)"
                  :class="[
                    'p-2 hover:bg-gray-700 rounded transition-colors',
                    note.isFavorite
                      ? 'text-yellow-400 hover:text-yellow-300'
                      : 'text-gray-400 hover:text-yellow-400'
                  ]"
                >
                  <Star :class="note.isFavorite ? 'fill-current' : ''" class="w-4 h-4" />
                </button>
                <button
                  @click="handleDeleteNote(note.id)"
                  class="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
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
  
  <!-- Confirm Dialog -->
  <BaseDialog
    :is-open="confirmDialog.isOpen"
    title="Slet note"
    show-default-actions
    confirm-text="Slet"
    cancel-text="Annuller"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
    @close="handleCancelDelete"
  >
    Er du sikker på at du vil slette denne note? Denne handling kan ikke fortrydes.
  </BaseDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Search, Lock, Star, Trash2, Clock, X, Folder } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import { extractPlainText } from '../../services/aiService.js'
import { useFoldersStore } from '../../stores/folders.js'

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
  }
})

const emit = defineEmits(['searchChange', 'deleteNote', 'noteClick', 'toggleFavorite'])

const localSearchTerm = ref('')
const confirmDialog = ref({ isOpen: false, noteId: null })
const debouncedSearchTerm = ref('')

// Folders store for folder information
const foldersStore = useFoldersStore()

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
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
  
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return new Date(date).toLocaleDateString('da-DK', options)
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
}

const handleDeleteNote = (noteId) => {
  confirmDialog.value = { isOpen: true, noteId }
}

const handleConfirmDelete = () => {
  if (confirmDialog.value.noteId) {
    emit('deleteNote', confirmDialog.value.noteId)
  }
  confirmDialog.value = { isOpen: false, noteId: null }
}

const handleCancelDelete = () => {
  confirmDialog.value = { isOpen: false, noteId: null }
}

onMounted(() => {
  debouncedSearchTerm.value = props.searchTerm
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