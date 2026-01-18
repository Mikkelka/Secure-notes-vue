<template>
  <BaseDialog
    is-open
    title="Eksporter Backup"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Description -->
      <div class="text-center bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
        <p class="text-gray-300">
          Eksporter alle dine noter som en læsbar JSON fil
        </p>
        <p class="text-sm text-gray-400 mt-2">
          Gem filen sikkert og overvej at kryptere den med zip/password
        </p>
      </div>

      <!-- Warning -->
      <div class="p-4 rounded-lg border-l-4 bg-yellow-900/20 border-yellow-500">
        <div class="flex items-start gap-2">
          <AlertTriangle class="icon-sm text-yellow-400 mt-0.5 flex-shrink-0" />
          <div class="text-sm">
            <div class="font-medium text-yellow-300 mb-1">Sikkerhedsadvarsel</div>
            <div class="text-yellow-200">
              Denne fil indeholder alle dine noter i læsbar form. Gem den sikkert og slet efter brug.
            </div>
          </div>
        </div>
      </div>

      <!-- Data Summary -->
      <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
        <h3 class="font-medium text-white mb-3">Data der eksporteres:</h3>
        <div class="text-sm text-gray-300 space-y-2">
          <div>?? {{ notes.length }} noter</div>
          <div>?? {{ folders.length }} mapper</div>
          <div>? {{ notes.filter(n => n.isFavorite).length }} favoritter</div>
          <div>?? User: {{ username }}</div>
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
        <div class="flex items-start gap-2">
          <CheckCircle v-if="result.success" class="icon-sm text-green-400 mt-0.5 flex-shrink-0" />
          <AlertTriangle v-else class="icon-sm text-red-400 mt-0.5 flex-shrink-0" />
          <div :class="['text-sm', result.success ? 'text-green-200' : 'text-red-200']">
            {{ result.message }}
          </div>
        </div>
      </div>

      <!-- Import Link -->
      <div class="pt-4 border-t border-gray-700/50 text-center">
        <button
          @click="() => { $emit('close'); $emit('openImport'); }"
          class="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <Upload class="icon-sm" />
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
          :disabled="loading"
          @click="handleExport"
        >
          <div v-if="loading" class="icon-sm border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <Download v-else class="icon-sm" />
          {{ loading ? 'Eksporterer...' : 'Eksporter Backup' }}
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { AlertTriangle, Download, CheckCircle, Upload } from 'lucide-vue-next'
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

defineEmits(['close', 'openImport'])

// Computed property for username (part before @)
const username = computed(() => {
  if (!props.user?.email) {
    return 'Ukendt bruger'
  }
  
  return props.user.email.split('@')[0]
})

const loading = ref(false)
const result = ref(null)

const handleExport = async () => {
  loading.value = true
  result.value = null

  try {
    // Create export data - notes are already decrypted in the store
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: props.user.uid,
      notes: props.notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        folderId: note.folderId,
        isFavorite: note.isFavorite,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      })),
      folders: props.folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      })),
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
      message: 'Export fejlede: ' + (error.message || 'Ukendt fejl')
    }
  } finally {
    loading.value = false
  }
}
</script>

