<template>
  <BaseDialog
    :is-open="isOpen"
    title="Indstillinger"
    size="md"
    @close="$emit('close')"
  >
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
      <p class="text-gray-400 text-sm">Indlæser indstillinger...</p>
    </div>
    
    <div v-else class="space-y-4">
      <!-- Security Section -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <Shield class="w-4 h-4 text-red-400" />
          <h3 class="text-sm font-medium text-white">Sikkerhed</h3>
        </div>
        
        <div class="space-y-3 pl-6">
          <!-- Session Timeout -->
          <div>
            <label class="block text-sm text-gray-300 mb-2">
              Session timeout
            </label>
            <div class="relative">
              <select
                v-model="sessionTimeout"
                @change="handleSettingChange('sessionTimeout', parseInt(sessionTimeout))"
                class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option v-for="option in timeoutOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <Clock class="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Automatisk logout efter inaktivitet
            </p>
          </div>
        </div>
      </div>

      <!-- General Section -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <Monitor class="w-4 h-4 text-blue-400" />
          <h3 class="text-sm font-medium text-white">Generelt</h3>
        </div>
        
        <div class="space-y-3 pl-6">
          <!-- Performance Stats Toggle -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm text-gray-300">
                Vis performance statistik
              </label>
              <p class="text-xs text-gray-500">
                Vis performance blok på forsiden
              </p>
            </div>
            <button
              @click="handleSettingChange('showPerformanceStats', !showPerformanceStats)"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                showPerformanceStats ? 'bg-blue-600' : 'bg-gray-600'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  showPerformanceStats ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Current Settings Summary -->
      <div class="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
        <h4 class="text-sm font-medium text-gray-300 mb-2">Aktuelle indstillinger</h4>
        <div class="space-y-1 text-xs text-gray-400">
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
import { Clock, Shield, Monitor } from 'lucide-vue-next'
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
  } else if (key === 'sessionTimeout') {
    sessionTimeout.value = value.toString()
    settingsStore.updateSettings({ sessionTimeout: value })
  }
  
}

// Initialize settings on mount
onMounted(() => {
  showPerformanceStats.value = settingsStore.settings.showPerformanceStats || true
  sessionTimeout.value = (settingsStore.settings.sessionTimeout || 1800000).toString()
})
</script>