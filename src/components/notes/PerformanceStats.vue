<template>
  <div v-if="stats" class="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
    <h3 class="text-white font-medium mb-3 flex items-center gap-2">
      <Zap class="w-4 h-4" />
      Performance
    </h3>
    
    <div class="space-y-2 text-sm">
      <div v-if="stats.loadTime" class="flex justify-between text-gray-300">
        <span>Load tid:</span>
        <span>{{ Math.round(stats.loadTime) }}ms</span>
      </div>
      <div v-if="stats.notesCount" class="flex justify-between text-gray-300">
        <span>Noter:</span>
        <span>{{ stats.notesCount }}</span>
      </div>
      <div v-if="stats.totalChars" class="flex justify-between text-gray-300">
        <span>Total tegn:</span>
        <span>{{ stats.totalChars.toLocaleString() }}</span>
      </div>
      <div v-if="stats.encryptTime" class="flex justify-between text-gray-300">
        <span>Kryptering:</span>
        <span>{{ Math.round(stats.encryptTime) }}ms</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Zap } from 'lucide-vue-next'

defineProps({
  stats: {
    type: Object,
    default: null
  }
})
</script>