<template>
  <BaseDialog
    :is-open="isOpen"
    title="Indstillinger"
    size="md"
    @close="$emit('close')"
  >
    <div v-if="loading" class="text-center py-4">
      <div class="loading-spinner"></div>
      <p class="text-gray-400 text-sm">Indlæser indstillinger...</p>
    </div>
    
    <div v-else class="space-y-6">
      <!-- Security Section -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <Shield class="icon-sm text-red-400" />
          <h3 class="text-sm font-medium text-white">Sikkerhed</h3>
        </div>
        
        <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Session timeout
          </label>
          <select
            v-model="sessionTimeout"
            @change="handleSettingChange('sessionTimeout', parseInt(sessionTimeout))"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option v-for="option in timeoutOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <p class="text-xs text-gray-400 mt-2">
            Automatisk logout efter inaktivitet
          </p>
        </div>
      </div>

      <!-- General Section -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <Monitor class="icon-sm text-blue-400" />
          <h3 class="text-sm font-medium text-white">Generelt</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Performance Stats Toggle -->
          <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-300">
                  Vis performance statistik
                </label>
                <p class="text-xs text-gray-400 mt-1">
                  Vis performance blok på forsiden
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  :checked="showPerformanceStats"
                  @change="handleSettingChange('showPerformanceStats', !showPerformanceStats)"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <!-- Test Lab Toggle -->
          <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-300">
                  🧪 Test Lab
                </label>
                <p class="text-xs text-gray-400 mt-1">
                  Vis Test Lab knap i header (for udviklere)
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  :checked="showTestLab"
                  @change="handleSettingChange('showTestLab', !showTestLab)"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Settings Summary -->
      <div class="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-3">Aktuelle indstillinger</h4>
        <div class="space-y-2 text-xs text-gray-400">
          <div class="flex justify-between">
            <span>Session timeout:</span>
            <span class="text-white">{{ getTimeoutLabel(parseInt(sessionTimeout)) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Performance stats:</span>
            <span class="text-white">
              {{ showPerformanceStats ? 'Aktiveret' : 'Deaktiveret' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Test Lab:</span>
            <span class="text-white">
              {{ showTestLab ? 'Aktiveret' : 'Deaktiveret' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end">
        <BaseButton 
          variant="primary" 
          @click="$emit('close')"
        >
          Luk
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Shield, Monitor } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'
import { useSettingsStore } from '../../stores/settings'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const settingsStore = useSettingsStore()

const loading = ref(false)
const showPerformanceStats = ref(true)
const showTestLab = ref(false)
const sessionTimeout = ref('1800000')

const timeoutOptions = [
  { value: 180000, label: '3 minutter' },
  { value: 900000, label: '15 minutter' },
  { value: 1800000, label: '30 minutter' },
  { value: 3600000, label: '1 time' },
  { value: 7200000, label: '2 timer' }
]

const getTimeoutLabel = (value) => {
  const option = timeoutOptions.find(opt => opt.value === value)
  return option ? option.label : '30 minutter'
}

const handleSettingChange = async (key, value) => {
  // Update local state immediately
  if (key === 'showPerformanceStats') {
    showPerformanceStats.value = value
    settingsStore.updateSettings({ showPerformanceStats: value })
  } else if (key === 'showTestLab') {
    showTestLab.value = value
    settingsStore.updateSettings({ showTestLab: value })
  } else if (key === 'sessionTimeout') {
    sessionTimeout.value = value.toString()
    settingsStore.updateSettings({ sessionTimeout: value })
  }
  
}

// Initialize settings on mount
onMounted(() => {
  showPerformanceStats.value = settingsStore.settings.showPerformanceStats || true
  showTestLab.value = settingsStore.settings.showTestLab || false
  sessionTimeout.value = (settingsStore.settings.sessionTimeout || 1800000).toString()
})
</script>