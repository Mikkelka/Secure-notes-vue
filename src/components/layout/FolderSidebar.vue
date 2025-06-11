<template>
  <div class="h-full bg-gray-800/40 backdrop-blur border-r border-gray-700/50 p-4">
    <h2 class="text-lg font-semibold text-white mb-4">Mapper</h2>
    
    <!-- Default folders -->
    <div class="space-y-1 mb-4">
      <button
        v-for="folder in defaultFolders"
        :key="folder.id"
        :class="[
          'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
          selectedFolderId === folder.id 
            ? 'bg-gray-600 text-white' 
            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
        ]"
        @click="$emit('folderSelect', folder.id)"
      >
        <div class="flex items-center gap-2">
          <component :is="folder.icon" class="w-4 h-4" />
          <span>{{ folder.name }}</span>
        </div>
        <span v-if="noteCounts[folder.id]" class="text-xs bg-gray-600 px-2 py-0.5 rounded">
          {{ noteCounts[folder.id] }}
        </span>
      </button>
    </div>

    <!-- Custom folders -->
    <div v-if="folders.length > 0" class="space-y-1 mb-4">
      <h3 class="text-sm font-medium text-gray-400 mb-2">Egne mapper</h3>
      <div
        v-for="folder in folders"
        :key="folder.id"
        :class="[
          'group px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
          selectedFolderId === folder.id 
            ? 'bg-gray-600 text-white' 
            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
        ]"
      >
        <button
          class="flex items-center gap-2 flex-1 text-left"
          @click="$emit('folderSelect', folder.id)"
        >
          <div 
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: folder.color }"
          />
          <span>{{ folder.name }}</span>
        </button>
        <div class="flex items-center gap-1">
          <span v-if="noteCounts[folder.id]" class="text-xs bg-gray-600 px-2 py-0.5 rounded">
            {{ noteCounts[folder.id] }}
          </span>
          <BaseButton
            variant="ghost"
            size="sm"
            class="opacity-0 group-hover:opacity-100"
            @click="$emit('folderDelete', folder.id)"
          >
            <Trash2 class="w-3 h-3" />
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Add folder button -->
    <BaseButton
      variant="ghost"
      size="sm"
      class="w-full justify-start"
      @click="handleCreateFolder"
    >
      <Plus class="w-4 h-4" />
      Tilføj mappe
    </BaseButton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FolderOpen, Archive, Shield, Plus, Trash2 } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  folders: {
    type: Array,
    default: () => []
  },
  selectedFolderId: {
    type: String,
    default: 'all'
  },
  noteCounts: {
    type: Object,
    default: () => ({})
  },
  lockedFolders: {
    type: Set,
    default: () => new Set()
  }
})

const emit = defineEmits(['folderSelect', 'folderCreate', 'folderUpdate', 'folderDelete', 'unlockFolder', 'masterPasswordUnlock'])

const defaultFolders = computed(() => [
  {
    id: 'all',
    name: 'Alle noter',
    icon: FolderOpen
  },
  {
    id: 'uncategorized', 
    name: 'Ukategoriseret',
    icon: Archive
  },
  {
    id: 'secure',
    name: 'Sikker mappe',
    icon: Shield
  }
])

const handleCreateFolder = () => {
  const name = window.prompt('Mappenavn:')
  if (name?.trim()) {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4']
    const color = colors[Math.floor(Math.random() * colors.length)]
    emit('folderCreate', name.trim(), color)
  }
}
</script>