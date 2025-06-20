<template>
  <BaseDialog
    :is-open="isOpen"
    title="AI Indstillinger"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <!-- API Key Section -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-300">
            Google AI API Nøgle
          </label>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Få API nøgle →
          </a>
        </div>
        <div class="flex gap-2">
          <input
            v-model="apiKey"
            type="password"
            placeholder="Indtast din API nøgle..."
            class="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            :disabled="hasApiKey"
            @keypress.enter="handleSaveApiKey"
          />
          <button
            v-if="hasApiKey"
            @click="handleClearApiKey"
            class="px-3 py-2 bg-red-600/20 border border-red-600 rounded-lg text-red-300 hover:bg-red-600/30 transition-colors flex items-center"
          >
            <Trash2 class="w-4 h-4" />
          </button>
          <button
            v-else
            @click="handleSaveApiKey"
            class="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors flex items-center"
          >
            <Save class="w-4 h-4" />
          </button>
        </div>
        <p 
          v-if="apiStatus.message"
          :class="[
            'text-xs mt-2',
            apiStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
          ]"
        >
          {{ apiStatus.message }}
        </p>
      </div>

      <!-- Model Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          AI Model
        </label>
        <select
          v-model="selectedModel"
          class="w-full px-3 py-2 pr-8 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-2.5-flash-lite-preview-06-17">Gemini 2.5 Flash Lite (Preview)</option>
        </select>
      </div>

      <!-- Custom Instructions -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          AI Instruktioner
        </label>
        <select
          v-model="customInstructions"
          class="w-full px-3 py-2 pr-8 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="note-organizer">Note Organizer</option>
          <option value="summarizer">Summarizer</option>
          <option value="meeting-notes">Meeting Noter</option>
          <option value="grammar-checker">Grammatik Rettelse</option>
        </select>
        <p class="text-xs text-gray-400 mt-1">
          {{ getCurrentInstructionPreview() }}
        </p>
      </div>

      <!-- Status -->
      <div class="bg-gray-900/50 rounded-lg p-3">
        <h3 class="font-medium text-white mb-2">Status:</h3>
        <div class="text-sm text-gray-300">
          <span v-if="hasApiKey" class="text-green-400">✓ Konfigureret og klar</span>
          <span v-else class="text-yellow-400">⚠️ Mangler API nøgle</span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end">
        <BaseButton 
          variant="secondary" 
          @click="$emit('close')"
        >
          Luk
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Save, Trash2 } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  userSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'updateAiSettings'])

const apiKey = ref('')
const selectedModel = ref('gemini-2.5-flash')
const customInstructions = ref('note-organizer')
const apiStatus = ref({ message: '', type: '' })
const hasApiKey = ref(false)

const instructionOptions = {
  'note-organizer': 'Skaber velstrukturerede noter med overskrifter, fed tekst og punktopstilling for bedre læsbarhed.',
  'summarizer': 'Laver korte sammendrag med fremhævede nøgleord og struktureret format.',
  'meeting-notes': 'Organiserer mødenoter med overskrifter, beslutninger og handlingspunkter.',
  'grammar-checker': 'Retter grammatik, stavefejl og formulering uden at ændre væsentligt på indholdet. Bevarer den oprindelige tone og stil.'
}

const getCurrentInstructionPreview = () => {
  const preview = instructionOptions[customInstructions.value] || ''
  return preview.length > 100 ? preview.substring(0, 100) + '...' : preview
}

const handleSaveApiKey = async () => {
  const trimmedKey = apiKey.value.trim()
  
  if (!trimmedKey) {
    apiStatus.value = { message: 'Indtast venligst en API nøgle', type: 'error' }
    return
  }

  try {
    emit('updateAiSettings', { apiKey: trimmedKey })
    hasApiKey.value = true
    apiKey.value = ''
    apiStatus.value = { message: 'API nøgle gemt succesfuldt!', type: 'success' }
  } catch (error) {
    console.error('Error saving API key:', error)
    apiStatus.value = { message: 'Fejl ved gemning af API nøgle', type: 'error' }
  }
}

const handleClearApiKey = async () => {
  try {
    emit('updateAiSettings', { apiKey: '' })
    hasApiKey.value = false
    apiKey.value = ''
    apiStatus.value = { message: 'API nøgle fjernet', type: 'error' }
  } catch (error) {
    console.error('Error clearing API key:', error)
    apiStatus.value = { message: 'Fejl ved fjernelse af API nøgle', type: 'error' }
  }
}

// Auto-save settings when they change
watch(selectedModel, (newValue) => {
  if (props.userSettings?.aiSettings) {
    emit('updateAiSettings', { selectedModel: newValue })
  }
})

watch(customInstructions, (newValue) => {
  if (props.userSettings?.aiSettings) {
    emit('updateAiSettings', { customInstructions: newValue })
  }
})

// Load settings when modal opens
onMounted(() => {
  if (props.userSettings?.aiSettings) {
    const aiSettings = props.userSettings.aiSettings
    
    if (aiSettings.apiKey) {
      hasApiKey.value = true
      apiStatus.value = { message: 'API nøgle er gemt', type: 'success' }
    }
    
    selectedModel.value = aiSettings.selectedModel || 'gemini-2.5-flash'
    customInstructions.value = aiSettings.customInstructions || 'note-organizer'
  }
})
</script>