<template>
  <BaseDialog
    is-open
    title="Importer data"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
        <p class="text-gray-300">
          Importer en backup fil for at gendanne dine noter og mapper.
        </p>
      </div>
      
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div class="flex items-center gap-2 text-red-300 text-sm">
          <AlertTriangle class="icon-sm" />
          <span>ADVARSEL: Dette vil overskrive alle eksisterende data!</span>
        </div>
      </div>
      
      <!-- File Selection -->
      <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Vælg backup fil
        </label>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          @change="handleFileSelect"
          :disabled="loading"
          class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-600 file:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Google User Info -->
      <div v-if="importData" class="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
        <div class="flex items-center gap-2 text-green-300 text-sm">
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Google login - import bruger din konto til dekryptering</span>
        </div>
      </div>
      
      <!-- Backup Info -->
      <div v-if="importData" class="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
        <h3 class="font-medium text-white mb-3">Backup information:</h3>
        <div class="text-sm text-gray-300 space-y-2">
          <div>?? Dato: {{ formatDate(importData.exportDate) }}</div>
          <div>?? Noter: {{ importData.notesCount }}</div>
          <div>?? Mapper: {{ importData.foldersCount }}</div>
          <div>? Favoritter: {{ importData.favoriteCount }}</div>
          <div v-if="importData.originalUserId" class="text-xs text-gray-400">
            Original bruger: {{ importData.originalUserId }}
          </div>
        </div>
      </div>

      <!-- Progress Display -->
      <div v-if="progress" class="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
        <div class="flex items-center gap-2 text-blue-300 text-sm mb-2">
          <div class="icon-sm border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></div>
          <span>{{ progress.message }}</span>
        </div>
        <div v-if="progress.progress !== undefined" class="w-full bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            :style="{ width: progress.progress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div class="flex items-center gap-2 text-red-300 text-sm">
          <AlertTriangle class="icon-sm" />
          <span>{{ error }}</span>
        </div>
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
          variant="danger" 
          :disabled="!importData || loading"
          @click="handleImport"
        >
          <div v-if="loading" class="icon-sm border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <Upload v-else class="icon-sm" />
          {{ loading ? 'Importerer...' : 'Importer data' }}
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref } from 'vue'
import { AlertTriangle, Upload } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'
import { validateBackupFile, importBackupData } from '../../utils/dataRecovery'
import { useNotesStore } from '../../stores/notes'
import { useFoldersStore } from '../../stores/folders'
import { useAuthStore } from '../../stores/auth'

defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'importComplete'])

const notesStore = useNotesStore()
const foldersStore = useFoldersStore()
const authStore = useAuthStore()

const fileInput = ref(null)
const importData = ref(null)
const loading = ref(false)
const error = ref(null)
const progress = ref(null)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const validation = validateBackupFile(e.target.result)
        if (validation.valid) {
          importData.value = validation.data
          error.value = null
        } else {
          error.value = validation.error
          importData.value = null
        }
      } catch {
        error.value = 'Ugyldig backup fil'
        importData.value = null
      }
    }
    reader.readAsText(file)
  }
}

const handleImport = async () => {
  if (!importData.value) {
    error.value = 'Vælg en backup fil'
    return
  }
  
  const confirmMessage = `Er du sikker? Dette vil slette alle eksisterende data!\n\nDenne backup indeholder:\n- ${importData.value.notesCount} noter\n- ${importData.value.foldersCount} mapper\n- ${importData.value.favoriteCount} favoritter`
  
  if (!confirm(confirmMessage)) {
    return
  }

  loading.value = true
  error.value = null
  progress.value = null

  try {
    // Get the raw file content for import
    const file = fileInput.value.files[0]
    const fileContent = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsText(file)
    })

    // Perform the import with progress tracking
    const result = await importBackupData(
      fileContent,
      authStore.user.uid,
      authStore.user.uid,
      (progressInfo) => {
        progress.value = progressInfo
      }
    )

    // Refresh the stores with the imported data
    await Promise.all([
      notesStore.loadNotes(authStore.user),
      foldersStore.loadFolders(authStore.user)
    ])

    // Success - close dialog and notify parent
    emit('importComplete', result)
    
  } catch (err) {
    console.error('Import failed:', err)
    error.value = err.message || 'Import fejlede'
  } finally {
    loading.value = false
    progress.value = null
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('da-DK')
}
</script>

