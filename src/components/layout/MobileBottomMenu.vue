<template>
  <div class="mobile-bottom-menu">
    <div class="flex items-center justify-around py-2">
      <BaseButton
        variant="ghost"
        size="sm"
        :class="activeButton === 'folders' ? 'text-blue-400' : ''"
        @click="$emit('foldersClick')"
      >
        <FolderOpen class="w-5 h-5" />
      </BaseButton>
      
      <BaseButton
        variant="ghost"
        size="sm"
        :class="activeButton === 'add' ? 'text-blue-400' : ''"
        @click="$emit('addNoteClick')"
      >
        <Plus class="w-5 h-5" />
      </BaseButton>
      
      <BaseButton
        variant="ghost"
        size="sm"
        :class="activeButton === 'search' ? 'text-blue-400' : ''"
        @click="$emit('searchClick')"
      >
        <Search class="w-5 h-5" />
      </BaseButton>
      
      <BaseButton
        v-if="showSettings"
        variant="ghost"
        size="sm"
        :class="activeButton === 'settings' ? 'text-blue-400' : ''"
        @click="$emit('settingsClick')"
      >
        <Settings class="w-5 h-5" />
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { FolderOpen, Plus, Search, Settings } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  activeButton: {
    type: String,
    default: null
  },
  showSettings: {
    type: Boolean,
    default: false
  }
})

defineEmits(['foldersClick', 'addNoteClick', 'searchClick', 'settingsClick'])
</script>