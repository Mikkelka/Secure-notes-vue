<template>
  <BaseDialog
    :is-open="isOpen"
    title="AI Indstillinger"
    size="2xl"
    @close="$emit('close')"
  >
    <div class="space-y-4 md:space-y-6">
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
            class="flex-1 input-variant-purple"
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

      <!-- Custom Instructions Manager -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Custom AI Instruktioner
        </label>
        <p class="text-xs text-gray-400 mb-3">
          Opret dine egne AI templates som kan bruges direkte i editoren
        </p>
        
        <!-- Create New Custom Instruction -->
        <div class="space-y-3 mb-4 md:mb-6">
          <input
            v-model="newInstructionName"
            type="text"
            placeholder="Navn på instruction (fx 'Email Writer')"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            v-model="newInstructionText"
            rows="4"
            placeholder="Beskriv hvad AI'en skal gøre... (fx 'Transform content into professional email format with greeting, clear structure, and appropriate tone')"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div class="flex gap-2">
            <BaseButton
              @click="saveCustomInstruction"
              :disabled="!newInstructionName.trim() || !newInstructionText.trim()"
              variant="primary"
              size="sm"
              class="bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
            >
              <Plus class="w-4 h-4" />
              Gem Custom Instruction
            </BaseButton>
            <BaseButton
              v-if="editingInstruction"
              @click="cancelEdit"
              variant="secondary"
              size="sm"
            >
              Annuller
            </BaseButton>
          </div>
        </div>
        
        <!-- List of Saved Custom Instructions -->
        <div v-if="nonStandardInstructions.length > 0">
          <h4 class="text-sm font-medium text-gray-300 mb-3">Gemte Custom Instructions</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            <div
              v-for="instruction in nonStandardInstructions"
              :key="instruction.id"
              class="bg-gray-700/30 rounded-lg p-2 md:p-3 border border-gray-600/50"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <h5 class="text-sm font-medium text-white truncate">{{ instruction.name }}</h5>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-3">{{ instruction.instruction }}</p>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <button
                    @click="editCustomInstruction(instruction)"
                    class="p-1 text-gray-400 hover:text-purple-300 transition-colors"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteCustomInstruction(instruction.id)"
                    class="p-1 text-gray-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Standard Instructions -->
        <div class="mt-4 md:mt-6">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-blue-300">Standard Instructions</h4>
            <BaseButton
              @click="restoreDefaultInstructions"
              variant="secondary"
              size="sm"
              class="text-xs bg-blue-600/20 border-blue-600/50 text-blue-300 hover:bg-blue-600/30"
            >
              <RotateCcw class="w-3 h-3" />
              Restore Defaults
            </BaseButton>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            <div
              v-for="instruction in standardInstructions"
              :key="instruction.id"
              class="bg-blue-900/20 rounded-lg p-2 md:p-3 border border-blue-600/30"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <h5 class="text-sm font-medium text-blue-100 truncate flex items-center gap-1">
                    {{ instruction.name }}
                    <span class="text-xs bg-blue-600 text-blue-100 px-1 rounded">Standard</span>
                  </h5>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-3">{{ instruction.instruction }}</p>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <button
                    @click="editStandardInstruction(instruction)"
                    class="p-1 text-gray-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteStandardInstruction(instruction.id)"
                    class="p-1 text-gray-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
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
import { ref, computed, watch, onMounted } from 'vue'
import { Save, Trash2, Plus, Edit2, RotateCcw } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'
import { DEFAULT_INSTRUCTIONS } from '../../services/aiService.js'

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
const apiStatus = ref({ message: '', type: '' })
const hasApiKey = ref(false)

// Custom Instructions Management
const newInstructionName = ref('')
const newInstructionText = ref('')
const editingInstruction = ref(null)
const customInstructionsList = ref([])


// Generate unique ID for custom instructions
const generateId = () => {
  return 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

// Save new or update existing custom instruction
const saveCustomInstruction = () => {
  const name = newInstructionName.value.trim()
  const instruction = newInstructionText.value.trim()
  
  if (!name || !instruction) return
  
  if (editingInstruction.value) {
    // Update existing instruction
    const index = customInstructionsList.value.findIndex(item => item.id === editingInstruction.value.id)
    if (index !== -1) {
      customInstructionsList.value[index] = {
        ...editingInstruction.value,
        name,
        instruction
      }
    }
    editingInstruction.value = null
  } else {
    // Add new instruction
    const newInstruction = {
      id: generateId(),
      name,
      instruction
    }
    customInstructionsList.value.push(newInstruction)
  }
  
  // Clear form
  newInstructionName.value = ''
  newInstructionText.value = ''
  
  // Save to user settings
  emit('updateAiSettings', { customInstructions: customInstructionsList.value })
}

// Edit existing custom instruction
const editCustomInstruction = (instruction) => {
  editingInstruction.value = instruction
  newInstructionName.value = instruction.name
  newInstructionText.value = instruction.instruction
}

// Cancel editing
const cancelEdit = () => {
  editingInstruction.value = null
  newInstructionName.value = ''
  newInstructionText.value = ''
}

// Delete custom instruction
const deleteCustomInstruction = (id) => {
  customInstructionsList.value = customInstructionsList.value.filter(item => item.id !== id)
  emit('updateAiSettings', { customInstructions: customInstructionsList.value })
}

// Computed property for standard instructions (filters from customInstructionsList)
const standardInstructions = computed(() => {
  return customInstructionsList.value.filter(instruction => instruction.isDefault === true)
})

// Computed property for non-standard (custom) instructions
const nonStandardInstructions = computed(() => {
  return customInstructionsList.value.filter(instruction => instruction.isDefault !== true)
})

// Edit standard instruction
const editStandardInstruction = (instruction) => {
  editingInstruction.value = instruction
  newInstructionName.value = instruction.name
  newInstructionText.value = instruction.instruction
}

// Delete standard instruction
const deleteStandardInstruction = (id) => {
  customInstructionsList.value = customInstructionsList.value.filter(item => item.id !== id)
  emit('updateAiSettings', { customInstructions: customInstructionsList.value })
}

// Restore default instructions
const restoreDefaultInstructions = () => {
  // Remove existing default instructions
  const nonDefaultInstructions = customInstructionsList.value.filter(item => !item.isDefault)
  
  // Add back all default instructions
  customInstructionsList.value = [...nonDefaultInstructions, ...DEFAULT_INSTRUCTIONS]
  
  emit('updateAiSettings', { customInstructions: customInstructionsList.value })
}

// Initialize default instructions only if this is the very first time (empty array)
const initializeDefaultInstructions = () => {
  // Only auto-add defaults if there are NO instructions at all (first time setup)
  if (customInstructionsList.value.length === 0) {
    customInstructionsList.value = [...DEFAULT_INSTRUCTIONS]
    emit('updateAiSettings', { customInstructions: customInstructionsList.value })
  }
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

// Load settings when modal opens
onMounted(() => {
  if (props.userSettings?.aiSettings) {
    const aiSettings = props.userSettings.aiSettings
    
    if (aiSettings.apiKey) {
      hasApiKey.value = true
      apiStatus.value = { message: 'API nøgle er gemt', type: 'success' }
    }
    
    selectedModel.value = aiSettings.selectedModel || 'gemini-2.5-flash'
    
    // Load custom instructions list
    if (aiSettings.customInstructions) {
      if (Array.isArray(aiSettings.customInstructions)) {
        customInstructionsList.value = aiSettings.customInstructions
      } else {
        // Migration: Convert old string format to empty array
        console.warn('Migrating old customInstructions format to new array format')
        customInstructionsList.value = []
        emit('updateAiSettings', { customInstructions: [] })
      }
    }
  }
  
  // Initialize default instructions if not present
  initializeDefaultInstructions()
})
</script>

<style scoped>
/* Line clamp utility for truncating text */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Scrollbar styling for custom instructions list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(75, 85, 99, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>