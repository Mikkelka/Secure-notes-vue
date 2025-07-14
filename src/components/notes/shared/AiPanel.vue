<template>
  <div class="border-t border-gray-700/50" :class="isMobile ? 'p-4' : 'p-4'">
    <div :class="isMobile ? 'space-y-3' : 'space-y-2'">
      <!-- AI and Undo buttons -->
      <div class="flex gap-2">
        <div class="flex-1">
          <AiInstructionDropdown
            @process="handleAiProcess"
            @instruction-changed="handleInstructionChanged"
            :is-processing="isAiProcessing"
            :disabled="!content.trim()"
            :user-settings="userSettings"
            :content="content"
          />
        </div>
        <BaseButton
          v-if="canUndo"
          @click="handleUndo"
          variant="secondary"
          :size="isMobile ? 'md' : 'sm'"
          class="bg-orange-600 hover:bg-orange-500"
        >
          <Undo class="w-4 h-4" />
          Undo
        </BaseButton>
      </div>
      
      <!-- Save and Cancel buttons -->
      <div :class="isMobile ? 'flex gap-3' : 'flex gap-2'">
        <BaseButton
          @click="handleSave"
          :disabled="!isValid"
          variant="primary"
          :size="isMobile ? 'md' : 'sm'"
          :class="[
            'bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed',
            isMobile ? 'flex-1' : ''
          ]"
        >
          <Save class="w-4 h-4" />
          Save
        </BaseButton>
        <BaseButton
          @click="handleCancel"
          variant="secondary"
          :size="isMobile ? 'md' : 'sm'"
          :class="[
            'bg-gray-600 hover:bg-gray-500',
            isMobile ? 'flex-1' : ''
          ]"
        >
          Cancel
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Save, Undo } from 'lucide-vue-next'
import BaseButton from '../../base/BaseButton.vue'
import AiInstructionDropdown from '../../ai/AiInstructionDropdown.vue'
import { processTextWithAi } from '../../../services/aiService.js'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  userSettings: {
    type: Object,
    default: () => ({})
  },
  isValid: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel', 'contentUpdate'])

// AI Processing state (isolated from main component)
const isAiProcessing = ref(false)
const canUndo = ref(false)
const originalContent = ref('')
const currentInstruction = ref('note-organizer')

// AI Processing functionality
const handleAiProcess = async () => {
  if (!props.content.trim()) return
  
  isAiProcessing.value = true
  originalContent.value = props.content
  
  try {
    // Create userSettings with current instruction override
    const settingsWithInstruction = {
      ...props.userSettings,
      aiSettings: {
        ...props.userSettings?.aiSettings,
        selectedInstruction: currentInstruction.value
      }
    }
    
    const processedContent = await processTextWithAi(props.content, props.title, settingsWithInstruction)
    
    // Emit processed content to parent
    emit('contentUpdate', processedContent)
    
    canUndo.value = true
  } catch (error) {
    console.error('AI processing error:', error)
    alert(error.message || 'AI processing fejlede')
  } finally {
    isAiProcessing.value = false
  }
}

// Handle instruction changes from dropdown
const handleInstructionChanged = (instruction) => {
  currentInstruction.value = instruction
}

// Handle undo functionality
const handleUndo = () => {
  if (!canUndo.value || !originalContent.value) return
  
  // Emit original content to parent
  emit('contentUpdate', originalContent.value)
  
  canUndo.value = false
}

// Handle save
const handleSave = () => {
  resetAiState()
  emit('save')
}

// Handle cancel
const handleCancel = () => {
  resetAiState()
  emit('cancel')
}

// Reset AI state when needed
const resetAiState = () => {
  canUndo.value = false
  originalContent.value = ''
  isAiProcessing.value = false
}

// Expose methods for parent component
defineExpose({
  resetAiState
})
</script>