<template>
  <div class="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
    <h3 class="text-white font-medium mb-3 flex items-center gap-2">
      <Settings class="w-4 h-4" />
      Hurtige indstillinger
    </h3>
    
    <div class="space-y-3">
      <div class="space-y-2">
        <BaseButton
          @click="$emit('changeSecurePin')"
          variant="secondary"
          size="sm"
          class="w-full justify-start"
        >
          <Key class="w-4 h-4" />
          Skift PIN
        </BaseButton>
        
        <BaseButton
          @click="$emit('lockSecureFolder')"
          variant="secondary"
          size="sm"
          class="w-full justify-start"
        >
          <Lock class="w-4 h-4" />
          Lås sikker mappe
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Settings, Key, Lock } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  lockedFolders: {
    type: Set,
    default: () => new Set()
  }
})

defineEmits(['changeSecurePin', 'lockSecureFolder'])
</script>