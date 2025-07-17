<template>
  <div class="flex items-center justify-between" :class="isMobile ? 'px-3 py-2' : 'p-4'">
    <!-- Title -->
    <h2 class="text-lg font-semibold text-white truncate flex-1" :class="isMobile ? 'mr-2' : 'mr-3'">
      {{ isEditing ? 'Edit Note' : note.title }}
    </h2>
    
    <!-- Actions Section -->
    <div class="flex items-center">
      <!-- Folder Label -->
      <span 
        ref="folderLabelRef"
        @click="handleFolderLabelClick"
        class="px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        :class="[
          isMobile ? '' : 'mr-2',
          'touch-manipulation'
        ]"
        :style="{
          backgroundColor: getFolderDisplay(note.folderId).color + '20',
          borderColor: getFolderDisplay(note.folderId).color + '40',
          color: getFolderDisplay(note.folderId).color
        }"
      >
        <Folder class="w-3 h-3" />
        {{ getFolderDisplay(note.folderId).name }}
      </span>
      
      <!-- Desktop Actions -->
      <template v-if="!isMobile && !isEditing">
        <BaseButton
          variant="ghost"
          size="sm"
          @click="$emit('toggleFavorite', note.id)"
          :class="note.isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'"
        >
          <Star 
            :class="note.isFavorite ? 'fill-yellow-400' : 'fill-none'" 
            class="w-4 h-4" 
          />
        </BaseButton>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="$emit('delete')"
          class="text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <Trash2 class="w-4 h-4" />
        </BaseButton>
      </template>
      
      <!-- Close Button -->
      <BaseButton
        variant="ghost"
        size="sm"
        @click="$emit('close')"
        class="text-gray-400 hover:text-white"
      >
        <X class="w-4 h-4" />
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed as _computed } from 'vue'
import { Star, Trash2, X, Folder } from 'lucide-vue-next'
import BaseButton from '../../base/BaseButton.vue'
import { useFoldersStore } from '../../../stores/folders.js'

const _props = defineProps({
  note: {
    type: Object,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'delete', 'toggleFavorite', 'folderLabelClick'])

const foldersStore = useFoldersStore()
const folderLabelRef = ref(null)

// Folder display logic (same as original)
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

// Handle folder label click
const handleFolderLabelClick = (event) => {
  event.stopPropagation()
  
  // Calculate position and emit to parent
  const rect = folderLabelRef.value.getBoundingClientRect()
  const position = {
    top: rect.bottom + window.scrollY + 8,
    left: Math.max(10, rect.left + window.scrollX - 200)
  }
  
  emit('folderLabelClick', { event, position })
}
</script>