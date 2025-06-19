<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-50" 
    @click="$emit('close')"
  >
    <div 
      :style="{ top: position.top + 'px', left: position.left + 'px' }"
      class="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-2 min-w-48 max-w-64"
      @click.stop
    >
      <!-- Uncategorized option -->
      <button
        @click="handleSelectFolder(null)"
        :class="[
          'w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm',
          currentFolderId === null ? 'bg-gray-700 text-gray-300' : 'text-gray-300'
        ]"
        :disabled="currentFolderId === null"
      >
        <Folder class="w-4 h-4" style="color: #6b7280" />
        <span>Ukategoriseret</span>
        <Check v-if="currentFolderId === null" class="w-4 h-4 ml-auto text-green-400" />
      </button>
      
      <!-- Separator -->
      <div class="border-t border-gray-700 my-1"></div>
      
      <!-- Available folders -->
      <button
        v-for="folder in availableFolders"
        :key="folder.id"
        @click="handleSelectFolder(folder.id)"
        :class="[
          'w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm',
          currentFolderId === folder.id ? 'bg-gray-700 text-gray-300' : 'text-gray-300'
        ]"
        :disabled="currentFolderId === folder.id"
      >
        <Folder class="w-4 h-4" :style="{ color: folder.color }" />
        <span class="truncate flex-1">{{ folder.name }}</span>
        <Check v-if="currentFolderId === folder.id" class="w-4 h-4 text-green-400" />
      </button>
      
      <!-- Secure folder (only if unlocked) -->
      <button
        v-if="showSecureFolder && currentFolderId !== 'secure'"
        @click="handleSelectFolder('secure')"
        class="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm text-gray-300"
      >
        <Folder class="w-4 h-4" style="color: #dc2626" />
        <span>Sikker</span>
      </button>
      
      <!-- Current secure folder indicator -->
      <div
        v-if="currentFolderId === 'secure'"
        class="w-full px-3 py-2 flex items-center gap-2 text-sm bg-gray-700 text-gray-300"
      >
        <Folder class="w-4 h-4" style="color: #dc2626" />
        <span>Sikker</span>
        <Check class="w-4 h-4 ml-auto text-green-400" />
      </div>
      
      <!-- No folders message -->
      <div
        v-if="availableFolders.length === 0 && !showSecureFolder"
        class="px-3 py-2 text-gray-500 text-sm text-center"
      >
        Ingen andre mapper tilgængelige
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { Folder, Check } from 'lucide-vue-next'

const props = defineProps({
  currentFolderId: {
    type: String,
    default: null
  },
  availableFolders: {
    type: Array,
    default: () => []
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  },
  lockedFolders: {
    type: Set,
    default: () => new Set()
  }
})

const emit = defineEmits(['select', 'close'])

// Show secure folder only if it's unlocked and not the current folder
const showSecureFolder = computed(() => {
  return !props.lockedFolders.has('secure')
})

// Filter available folders to exclude current folder
const availableFolders = computed(() => {
  return props.availableFolders.filter(folder => folder.id !== props.currentFolderId)
})

const handleSelectFolder = (folderId) => {
  emit('select', folderId)
  emit('close')
}

// Handle escape key to close dropdown
const handleEscape = (event) => {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
/* Custom scrollbar for long folder lists */
.max-h-64 {
  max-height: 16rem;
  overflow-y: auto;
}

/* Ensure dropdown is above other elements */
.z-50 {
  z-index: 50;
}

/* Smooth hover transitions */
button:disabled {
  cursor: default;
}

button:not(:disabled):hover {
  background-color: rgba(55, 65, 81, 0.8);
}
</style>