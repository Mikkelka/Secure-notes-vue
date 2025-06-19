<template>
  <header class="bg-gray-900/80 backdrop-blur border-b border-gray-700/50 sticky top-0 z-50 h-16">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-500 rounded-lg flex items-center justify-center">
          <Shield class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-lg font-semibold text-white">SecureNotes</h1>
          <p class="text-gray-400 text-xs">{{ user?.email?.split('@')[0] }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="$emit('export')"
          class="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 hover:bg-blue-500/20 transition-colors text-sm"
          title="Eksporter data"
        >
          <Download class="w-4 h-4" />
          <span class="hidden sm:inline">Export</span>
        </button>
        
        <button
          @click="$emit('ai')"
          class="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300 hover:bg-purple-500/20 transition-colors text-sm"
          title="AI Indstillinger"
        >
          <Brain class="w-4 h-4" />
          <span class="hidden sm:inline">AI</span>
        </button>
        
        <button
          @click="$emit('settings')"
          class="flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 border border-gray-500/20 rounded text-gray-300 hover:bg-gray-500/20 transition-colors text-sm"
          title="Indstillinger"
        >
          <Settings class="w-4 h-4" />
          <span class="hidden sm:inline">Indstillinger</span>
        </button>
        
        <button
          @click="$emit('logout')"
          class="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-300 hover:bg-red-500/20 transition-colors text-sm"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Shield, Brain, Download, Settings, LogOut } from 'lucide-vue-next'

defineProps({
  user: {
    type: Object,
    default: null
  }
})

defineEmits(['logout', 'export', 'ai', 'settings'])
</script>