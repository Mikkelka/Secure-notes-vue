<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-600/20 rounded-lg">
            <FileText class="w-5 h-5 text-green-400" />
          </div>
          <h2 class="text-xl font-bold text-white">Eksporter Backup</h2>
        </div>
        <button
          @click="emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div class="space-y-6">
        <!-- Description -->
        <div class="text-center">
          <p class="text-gray-300">
            Eksporter alle dine noter som en læsbar JSON fil
          </p>
          <p class="text-sm text-gray-400 mt-2">
            Gem filen sikkert og overvej at kryptere den med zip/password
          </p>
        </div>

        <!-- Password Input -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Bekræft dit password:
          </label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Indtast dit password"
              class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
              autofocus
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <!-- Warning -->
        <div class="p-4 rounded-lg border-l-4 bg-yellow-900/20 border-yellow-500">
          <div class="flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-yellow-400 mt-0.5" />
            <div class="text-sm">
              <div class="font-medium text-yellow-300 mb-1">Sikkerhedsadvarsel</div>
              <div class="text-yellow-200">
                Denne fil indeholder alle dine noter i læsbar form. Gem den sikkert og slet efter brug.
              </div>
            </div>
          </div>
        </div>

        <!-- Data Summary -->
        <div class="bg-gray-900/50 rounded-lg p-4">
          <h3 class="font-medium text-white mb-2">Data der eksporteres:</h3>
          <div class="text-sm text-gray-300 space-y-1">
            <div>📝 {{ notes.length }} noter</div>
            <div>📁 {{ folders.length }} mapper</div>
            <div>⭐ {{ notes.filter(n => n.isFavorite).length }} favoritter</div>
            <div>👤 User: {{ user.email }}</div>
          </div>
        </div>

        <!-- Result Message -->
        <div 
          v-if="result"
          :class="[
            'p-4 rounded-lg border-l-4',
            result.success 
              ? 'bg-green-900/20 border-green-500' 
              : 'bg-red-900/20 border-red-500'
          ]"
        >
          <div class="flex items-start gap-3">
            <CheckCircle v-if="result.success" class="w-5 h-5 text-green-400 mt-0.5" />
            <AlertTriangle v-else class="w-5 h-5 text-red-400 mt-0.5" />
            <div :class="['text-sm', result.success ? 'text-green-200' : 'text-red-200']">
              {{ result.message }}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4">
          <button
            @click="handleExport"
            :disabled="loading || !password.trim()"
            class="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <div v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <Download v-else class="w-4 h-4" />
            {{ loading ? 'Eksporterer...' : 'Eksporter Backup' }}
          </button>
          <button
            @click="emit('close')"
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-all"
          >
            Annuller
          </button>
        </div>

        <!-- Import Link -->
        <div class="mt-4 pt-4 border-t border-gray-700/50 text-center">
          <button
            @click="() => { emit('close'); emit('openImport'); }"
            class="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <Upload class="w-4 h-4" />
            Importer noter fra backup fil?
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { AlertTriangle, Download, FileText, CheckCircle, Upload } from 'lucide-vue-next'

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  notes: {
    type: Array,
    default: () => []
  },
  folders: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'openImport'])

const loading = ref(false)
const password = ref('')
const showPassword = ref(false)
const result = ref(null)

const handleExport = async () => {
  if (!password.value.trim()) {
    result.value = { success: false, message: 'Password er påkrævet' }
    return
  }

  loading.value = true
  result.value = null

  try {
    // Create export data matching the format expected by import validation
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: props.user.uid,
      notes: props.notes,
      folders: props.folders,
      metadata: {
        notesCount: props.notes.length,
        foldersCount: props.folders.length,
        favoriteCount: props.notes.filter(n => n.isFavorite).length
      }
    }
    
    const filename = `sikre-noter-backup-${new Date().toISOString().split('T')[0]}.json`
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    result.value = {
      success: true,
      message: 'Backup eksporteret! Gem filen sikkert og overvej at kryptere den (zip med password).'
    }

  } catch (error) {
    console.error('Export failed:', error)
    result.value = {
      success: false,
      message: 'Export fejlede: ' + error.message
    }
  } finally {
    loading.value = false
  }
}
</script>