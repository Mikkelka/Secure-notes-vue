import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const loading = ref(false)
  
  // Default settings
  const defaultSettings = {
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000, // 30 minutes
    warningTime: parseInt(import.meta.env.VITE_WARNING_TIME) || 120000, // 2 minutes  
    showPerformanceStats: true,
    theme: 'dark'
  }

  const userSettings = ref({ ...defaultSettings })

  const settings = computed(() => ({
    ...defaultSettings,
    ...userSettings.value
  }))

  const updateSettings = (newSettings) => {
    userSettings.value = {
      ...userSettings.value,
      ...newSettings
    }
  }

  const resetSettings = () => {
    userSettings.value = { ...defaultSettings }
  }

  return {
    settings,
    loading,
    updateSettings,
    resetSettings
  }
})