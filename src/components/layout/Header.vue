<template>
  <header class="bg-gray-900/80 backdrop-blur border-b border-gray-700/50 sticky top-0 z-50 h-16">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="icon-container-small">
          <Shield class="icon-md text-white" />
        </div>
        <div>
          <h1 class="text-lg font-semibold text-white">SecureNotes</h1>
          <p class="text-gray-400 text-xs">{{ user?.email?.split('@')[0] }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Desktop buttons -->
        <div class="hidden md:flex items-center gap-3">
          
          <button
            @click="$emit('export')"
            class="header-btn-base header-btn-blue"
            title="Eksporter data"
          >
            <Download class="icon-sm" />
            <span>Export</span>
          </button>
          
          <button
            @click="$emit('ai')"
            class="header-btn-base header-btn-purple"
            title="AI Indstillinger"
          >
            <Brain class="icon-sm" />
            <span>AI</span>
          </button>
          
          <button
            v-if="settings.showTestLab"
            @click="openTestLab"
            class="header-btn-base header-btn-orange"
            title="AI Testing Lab (Isolated)"
          >
            <Zap class="icon-sm" />
            <span>Test Lab</span>
          </button>
          
          <button
            @click="$emit('settings')"
            class="header-btn-base header-btn-gray"
            title="Indstillinger"
          >
            <Settings class="icon-sm" />
            <span>Indstillinger</span>
          </button>
          
          <button
            @click="$emit('logout')"
            class="header-btn-base header-btn-red"
          >
            <LogOut class="icon-sm" />
            <span>Logout</span>
          </button>
        </div>
        
        <!-- Mobile menu -->
        <div class="md:hidden relative">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="header-btn-base header-btn-gray"
          >
            <Menu class="icon-sm" />
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
              <Download class="icon-sm" />
              Export
            </button>
            <button
              @click="$emit('ai'); showMobileMenu = false"
              class="dropdown-btn-mobile text-purple-300"
            >
              <Brain class="icon-sm" />
              AI Indstillinger
            </button>
            <button
              v-if="settings.showTestLab"
              @click="openTestLab(); showMobileMenu = false"
              class="dropdown-btn-mobile text-orange-300"
            >
              <Zap class="icon-sm" />
              AI Test Lab
            </button>
            <button
              @click="$emit('settings'); showMobileMenu = false"
              class="dropdown-btn-mobile text-gray-300"
            >
              <Settings class="icon-sm" />
              Indstillinger
            </button>
            <button
              @click="$emit('logout'); showMobileMenu = false"
              class="dropdown-btn-mobile text-red-300 border-t border-gray-600"
            >
              <LogOut class="icon-sm" />
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
import { storeToRefs } from 'pinia'
import { Shield, Brain, Download, Settings, LogOut, Menu, Zap } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settings'

const showMobileMenu = ref(false)
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

defineProps({
  user: {
    type: Object,
    default: null
  }
})

defineEmits(['logout', 'export', 'ai', 'settings'])

// Open AI Testing Lab in new tab/window
const openTestLab = () => {
  window.open('/ai-test.html', '_blank', 'width=1400,height=900')
}
</script>