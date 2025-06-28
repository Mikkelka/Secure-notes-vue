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
        <!-- Desktop buttons -->
        <div class="hidden lg:flex items-center gap-3">
          <button
            @click="$emit('export')"
            class="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 hover:bg-blue-500/20 transition-colors text-sm"
            title="Eksporter data"
          >
            <Download class="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            @click="$emit('ai')"
            class="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300 hover:bg-purple-500/20 transition-colors text-sm"
            title="AI Indstillinger"
          >
            <Brain class="w-4 h-4" />
            <span>AI</span>
          </button>
          
          <button
            @click="$emit('settings')"
            class="flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 border border-gray-500/20 rounded text-gray-300 hover:bg-gray-500/20 transition-colors text-sm"
            title="Indstillinger"
          >
            <Settings class="w-4 h-4" />
            <span>Indstillinger</span>
          </button>
          
          <button
            @click="$emit('logout')"
            class="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-300 hover:bg-red-500/20 transition-colors text-sm"
          >
            <LogOut class="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
        
        <!-- Mobile menu -->
        <div class="lg:hidden relative">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 border border-gray-500/20 rounded text-gray-300 hover:bg-gray-500/20 transition-colors text-sm"
          >
            <Menu class="w-4 h-4" />
          </button>
          
          <!-- Mobile dropdown menu -->
          <div
            v-if="showMobileMenu"
            class="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-[55] overflow-hidden min-w-[180px]"
          >
            <button
              @click="$emit('export'); showMobileMenu = false"
              class="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-blue-300"
            >
              <Download class="w-4 h-4" />
              Export
            </button>
            <button
              @click="$emit('ai'); showMobileMenu = false"
              class="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-purple-300"
            >
              <Brain class="w-4 h-4" />
              AI Indstillinger
            </button>
            <button
              @click="$emit('settings'); showMobileMenu = false"
              class="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-300"
            >
              <Settings class="w-4 h-4" />
              Indstillinger
            </button>
            <button
              @click="$emit('logout'); showMobileMenu = false"
              class="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-red-300 border-t border-gray-600"
            >
              <LogOut class="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
  
  <!-- Mobile menu backdrop -->
  <div
    v-if="showMobileMenu"
    @click="showMobileMenu = false"
    class="fixed inset-0 z-[45]"
  ></div>
</template>

<script setup>
import { ref } from 'vue'
import { Shield, Brain, Download, Settings, LogOut, Menu } from 'lucide-vue-next'

const showMobileMenu = ref(false)

defineProps({
  user: {
    type: Object,
    default: null
  }
})

defineEmits(['logout', 'export', 'ai', 'settings'])
</script>