<template>
  <BaseDialog
    is-open
    title="Importer data"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <p class="text-gray-300">
        Importer en backup fil for at gendanne dine noter og mapper.
      </p>
      
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <div class="flex items-center gap-2 text-red-300 text-sm">
          <AlertTriangle class="w-4 h-4" />
          <span>ADVARSEL: Dette vil overskrive alle eksisterende data!</span>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Vælg backup fil
        </label>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          @change="handleFileSelect"
          class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-600 file:text-white"
        />
      </div>
      
      <div v-if="importData" class="text-sm text-gray-400">
        <div>Version: {{ importData.version }}</div>
        <div>Dato: {{ formatDate(importData.timestamp) }}</div>
        <div>Noter: {{ importData.notes?.length || 0 }}</div>
        <div>Mapper: {{ importData.folders?.length || 0 }}</div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex gap-3 justify-end">
        <BaseButton variant="secondary" @click="$emit('close')">
          Annuller
        </BaseButton>
        <BaseButton 
          variant="danger" 
          :disabled="!importData"
          @click="handleImport"
        >
          <Upload class="w-4 h-4" />
          Importer data
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

defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'importComplete'])

const fileInput = ref(null)
const importData = ref(null)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        importData.value = JSON.parse(e.target.result)
      } catch {
        alert('Ugyldig backup fil')
        importData.value = null
      }
    }
    reader.readAsText(file)
  }
}

const handleImport = async () => {
  if (!importData.value) return
  
  if (confirm('Er du sikker? Dette vil slette alle eksisterende data!')) {
    // Import logic would go here - this is a placeholder
    alert('Import funktionalitet ikke implementeret endnu')
    emit('importComplete')
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('da-DK')
}
</script>