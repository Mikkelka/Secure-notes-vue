import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const loading = ref(false)
  const STORAGE_KEY = 'app_settings'
  
  // Default settings
  const defaultSettings = {
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000, // 30 minutes
    warningTime: parseInt(import.meta.env.VITE_WARNING_TIME) || 120000, // 2 minutes  
    showPerformanceStats: true,
    theme: 'dark'
  }

  // Load settings from localStorage or use defaults
  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY)
      return savedSettings ? JSON.parse(savedSettings) : { ...defaultSettings }
    } catch (error) {
      console.error('Failed to load settings:', error)
      return { ...defaultSettings }
    }
  }

  const userSettings = ref(loadSettings())

  const settings = computed(() => ({
    ...defaultSettings,
    ...userSettings.value
  }))

  const updateSettings = (newSettings) => {
    userSettings.value = {
      ...userSettings.value,
      ...newSettings
    }
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userSettings.value))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const resetSettings = () => {
    userSettings.value = { ...defaultSettings }
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userSettings.value))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  return {
    settings,
    loading,
    updateSettings,
    resetSettings
  }
})