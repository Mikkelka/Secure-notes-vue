<template>
  <header class="bg-gray-900/80 backdrop-blur border-b border-gray-700/50 sticky top-0 z-50 h-16">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="icon-container-small">
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
            class="header-btn-base header-btn-blue"
            title="Eksporter data"
          >
            <Download class="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            @click="$emit('ai')"
            class="header-btn-base header-btn-purple"
            title="AI Indstillinger"
          >
            <Brain class="w-4 h-4" />
            <span>AI</span>
          </button>
          
          <button
            @click="$emit('settings')"
            class="header-btn-base header-btn-gray"
            title="Indstillinger"
          >
            <Settings class="w-4 h-4" />
            <span>Indstillinger</span>
          </button>
          
          <button
            @click="$emit('logout')"
            class="header-btn-base header-btn-red"
          >
            <LogOut class="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
        
        <!-- Mobile menu -->
        <div class="lg:hidden relative">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="header-btn-base header-btn-gray"
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
              class="dropdown-btn-mobile text-blue-300"
            >
              <Download class="w-4 h-4" />
              Export
            </button>
            <button
              @click="$emit('ai'); showMobileMenu = false"
              class="dropdown-btn-mobile text-purple-300"
            >
              <Brain class="w-4 h-4" />
              AI Indstillinger
            </button>
            <button
              @click="$emit('settings'); showMobileMenu = false"
              class="dropdown-btn-mobile text-gray-300"
            >
              <Settings class="w-4 h-4" />
              Indstillinger
            </button>
            <button
              @click="$emit('logout'); showMobileMenu = false"
              class="dropdown-btn-mobile text-red-300 border-t border-gray-600"
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