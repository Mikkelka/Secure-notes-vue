<template>
  <BaseDialog
    is-open
    title="Eksporter Backup"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-4">
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
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
            autofocus
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <Eye v-if="showPassword" class="w-4 h-4" />
            <EyeOff v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Warning -->
      <div class="p-3 rounded-lg border-l-4 bg-yellow-900/20 border-yellow-500">
        <div class="flex items-start gap-2">
          <AlertTriangle class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div class="text-sm">
            <div class="font-medium text-yellow-300 mb-1">Sikkerhedsadvarsel</div>
            <div class="text-yellow-200">
              Denne fil indeholder alle dine noter i læsbar form. Gem den sikkert og slet efter brug.
            </div>
          </div>
        </div>
      </div>

      <!-- Data Summary -->
      <div class="bg-gray-900/50 rounded-lg p-3">
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
          'p-3 rounded-lg border-l-4',
          result.success 
            ? 'bg-green-900/20 border-green-500' 
            : 'bg-red-900/20 border-red-500'
        ]"
      >
        <div class="flex items-start gap-2">
          <CheckCircle v-if="result.success" class="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <AlertTriangle v-else class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div :class="['text-sm', result.success ? 'text-green-200' : 'text-red-200']">
            {{ result.message }}
          </div>
        </div>
      </div>

      <!-- Import Link -->
      <div class="pt-3 border-t border-gray-700/50 text-center">
        <button
          @click="() => { $emit('close'); $emit('openImport'); }"
          class="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <Upload class="w-4 h-4" />
          Importer noter fra backup fil?
        </button>
      </div>
    </div>
    
    <template #footer>
      <div class="flex gap-3 justify-end">
        <BaseButton 
          variant="secondary" 
          :disabled="loading"
          @click="$emit('close')"
        >
          Annuller
        </BaseButton>
        <BaseButton 
          variant="primary" 
          :disabled="loading || !password.trim()"
          @click="handleExport"
        >
          <div v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <Download v-else class="w-4 h-4" />
          {{ loading ? 'Eksporterer...' : 'Eksporter Backup' }}
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref } from 'vue'
import { AlertTriangle, Download, CheckCircle, Upload, Eye, EyeOff } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'

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