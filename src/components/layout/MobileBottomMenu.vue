<template>
  <div class="mobile-bottom-menu">
    <div class="flex items-center justify-around py-2">
      <BaseButton
        variant="ghost"
        size="sm"
        :class="activeButton === 'folders' ? 'text-blue-400' : ''"
        @click="$emit('foldersClick')"
      >
        <FolderOpen class="icon-md" />
      </BaseButton>
      
      <BaseButton
        variant="ghost"
        size="sm"
        :class="activeButton === 'add' ? 'text-blue-400' : ''"
        @click="$emit('addNoteClick')"
      >
        <Plus class="icon-md" />
      </BaseButton>
      
      <BaseButton
        variant="ghost"
        size="sm"
        :class="activeButton === 'search' ? 'text-blue-400' : ''"
        @click="$emit('searchClick')"
      >
        <Search class="icon-md" />
      </BaseButton>
      
      <BaseButton
        v-if="showSettings"
        variant="ghost"
        size="sm"
        :class="activeButton === 'settings' ? 'text-blue-400' : ''"
        @click="$emit('settingsClick')"
      >
        <Settings class="icon-md" />
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