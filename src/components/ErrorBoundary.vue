<template>
  <div v-if="hasError" class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
    <div class="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-full max-w-md text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-xl mb-4">
        <AlertTriangle class="w-6 h-6 text-red-400" />
      </div>
      <h2 class="text-xl font-bold text-white mb-2">Der opstod en fejl</h2>
      <p class="text-gray-400 mb-4">Noget gik galt. Prøv at genindlæse siden.</p>
      <BaseButton @click="reloadPage" variant="primary">
        <RotateCcw class="w-4 h-4" />
        Genindlæs side
      </BaseButton>
      <details v-if="errorInfo" class="mt-4 text-left">
        <summary class="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
          Fejldetaljer
        </summary>
        <pre class="mt-2 text-xs text-gray-500 bg-gray-900/50 p-2 rounded overflow-x-auto">{{ errorInfo }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { AlertTriangle, RotateCcw } from 'lucide-vue-next'
import BaseButton from './base/BaseButton.vue'

const hasError = ref(false)
const errorInfo = ref('')

onErrorCaptured((error, instance, info) => {
  console.error('ErrorBoundary caught an error:', error, info)
  hasError.value = true
  errorInfo.value = `${error.message}\n\nComponent: ${info}\n\nStack: ${error.stack}`
  return false
})

const reloadPage = () => {
  window.location.reload()
}
</script>