<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-[60]" 
    @click="$emit('close')"
  >
    <!-- Mobile backdrop -->
    <div 
      v-if="isMobile"
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
    ></div>
    
    <div 
      :style="dropdownStyle"
      :class="dropdownClasses"
      @click.stop
    >
      <!-- Uncategorized option -->
      <button
        @click="handleSelectFolder(null)"
        :class="[
          'dropdown-btn-base px-3',
          isMobile ? 'py-4' : 'py-3',
          currentFolderId === null ? 'bg-gray-700 text-gray-300' : 'text-gray-300'
        ]"
        :disabled="currentFolderId === null"
      >
        <Folder class="icon-sm" style="color: #6b7280" />
        <span>Ukategoriseret</span>
        <Check v-if="currentFolderId === null" class="icon-sm ml-auto text-green-400" />
      </button>
      
      <!-- Separator -->
      <div class="border-t border-gray-700 my-1"></div>
      
      <!-- Available folders -->
      <button
        v-for="folder in availableFolders"
        :key="folder.id"
        @click="handleSelectFolder(folder.id)"
        :class="[
          'dropdown-btn-base px-3',
          isMobile ? 'py-4' : 'py-3',
          currentFolderId === folder.id ? 'bg-gray-700 text-gray-300' : 'text-gray-300'
        ]"
        :disabled="currentFolderId === folder.id"
      >
        <Folder class="icon-sm" :style="{ color: folder.color }" />
        <span class="truncate flex-1">{{ folder.name }}</span>
        <Check v-if="currentFolderId === folder.id" class="icon-sm text-green-400" />
      </button>
      
      <!-- Secure folder (only if unlocked) -->
      <button
        v-if="showSecureFolder && currentFolderId !== FOLDER_IDS.SECURE"
        @click="handleSelectFolder(FOLDER_IDS.SECURE)"
        :class="[
          'dropdown-btn-base px-3 text-gray-300',
          isMobile ? 'py-4' : 'py-3'
        ]"
      >
        <Folder class="icon-sm" style="color: #dc2626" />
        <span>Sikker</span>
      </button>

      <!-- Current secure folder indicator -->
      <div
        v-if="currentFolderId === FOLDER_IDS.SECURE"
        :class="[
          'w-full px-3 flex items-center gap-2 text-sm bg-gray-700 text-gray-300',
          isMobile ? 'py-4' : 'py-3'
        ]"
      >
        <Folder class="icon-sm" style="color: #dc2626" />
        <span>Sikker</span>
        <Check class="icon-sm ml-auto text-green-400" />
      </div>
      
      <!-- No folders message -->
      <div
        v-if="availableFolders.length === 0 && !showSecureFolder"
        :class="[
          'px-3 text-gray-500 text-sm text-center',
          isMobile ? 'py-4' : 'py-3'
        ]"
      >
        Ingen andre mapper tilgængelige
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { Folder, Check } from 'lucide-vue-next'
import { FOLDER_IDS } from '../../constants/folderIds'

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

// Check if we're on mobile
const isMobile = computed(() => window.innerWidth < 1024)

// Dynamic styling based on device
const dropdownStyle = computed(() => {
  if (isMobile.value) {
    // Centered modal style for mobile
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  } else {
    // Positioned relative to trigger for desktop
    return {
      top: props.position.top + 'px',
      left: props.position.left + 'px'
    }
  }
})

const dropdownClasses = computed(() => {
  const baseClasses = 'absolute bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-2 touch-manipulation'
  
  if (isMobile.value) {
    return `${baseClasses} w-64 max-w-[90vw]`
  } else {
    return `${baseClasses} min-w-48 max-w-64`
  }
})

const emit = defineEmits(['select', 'close'])

// Show secure folder only if it's unlocked and not the current folder
const showSecureFolder = computed(() => {
  return !props.lockedFolders.has(FOLDER_IDS.SECURE)
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

/* Ensure dropdown is above other elements - higher z-index for mobile */
.z-\[60\] {
  z-index: 60;
}

/* Touch optimization */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Smooth hover transitions */
button:disabled {
  cursor: default;
}

button:not(:disabled):hover {
  background-color: rgba(55, 65, 81, 0.8);
}

/* Mobile-specific touch targets */
@media (max-width: 1024px) {
  button {
    min-height: 48px; /* Ensure minimum touch target size */
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  /* Mobile modal style */
  .mobile-dropdown {
    animation: fadeInScale 0.2s ease-out;
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>