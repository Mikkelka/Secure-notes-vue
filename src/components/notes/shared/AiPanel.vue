<template>
  <div :class="isMobile ? 'note-editing-container' : 'note-editing-container-desktop'">
    <!-- All buttons on single line -->
    <div class="note-editing-actions-row">
      <div class="flex-1">
        <AiInstructionDropdown
          @process="handleAiProcess"
          @instruction-changed="handleInstructionChanged"
          @dropdown-opened="handleDropdownOpened"
          :is-processing="isAiProcessing"
          :disabled="!content.trim()"
          :user-settings="userSettings"
          :content="content"
          :streaming-text="streamingText"
          :thought-text="thoughtStreamingText"
          :is-completed="isCompleted"
          :is-streaming-started="isStreamingStarted"
        />
      </div>
      <BaseButton
        v-if="canUndo"
        @click="handleUndo"
        variant="ghost"
        :size="isMobile ? 'md' : 'sm'"
        class="note-editing-btn-base note-editing-undo"
      >
        <Undo class="w-4 h-4" />
        Undo
      </BaseButton>
      <BaseButton
        @click="handleSave"
        :disabled="!isValid"
        variant="ghost"
        :size="isMobile ? 'md' : 'sm'"
        class="note-editing-btn-base note-editing-save"
      >
        <Save class="w-4 h-4" />
        Save
      </BaseButton>
      <BaseButton
        @click="handleCancel"
        variant="ghost"
        :size="isMobile ? 'md' : 'sm'"
        class="note-editing-btn-base note-editing-cancel"
      >
        Cancel
      </BaseButton>
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

// Real-time streaming state
const streamingText = ref('')
const thoughtStreamingText = ref('')
const isStreaming = ref(false)
const isCompleted = ref(false)
const isStreamingStarted = ref(false)

// Streaming display methods
const clearStreamingDisplay = () => {
  streamingText.value = ''
  thoughtStreamingText.value = ''
  isStreaming.value = false
  isCompleted.value = false
  isStreamingStarted.value = false
}

const addStreamingChunk = (chunk) => {
  streamingText.value += chunk
  // Emit streaming updates to parent for real-time display
  emit('contentUpdate', streamingText.value)
}

const addThoughtStreamingChunk = (chunk) => {
  thoughtStreamingText.value += chunk
}

const startStreaming = () => {
  clearStreamingDisplay()
  isStreaming.value = true
  isStreamingStarted.value = true
}

// AI Processing functionality
const handleAiProcess = async () => {
  if (!props.content.trim()) return
  
  isAiProcessing.value = true
  originalContent.value = props.content
  
  // Start streaming display
  startStreaming()
  
  try {
    // Create userSettings with current instruction override
    const settingsWithInstruction = {
      ...props.userSettings,
      aiSettings: {
        ...props.userSettings?.aiSettings,
        selectedInstruction: currentInstruction.value
      }
    }
    
    const { processedHtml, thoughtSummaries, performanceMetrics } = await processTextWithAi(
      props.content, 
      props.title, 
      settingsWithInstruction,
      false, // enableDebugTiming
      addStreamingChunk, // onChunk callback for real-time streaming
      addThoughtStreamingChunk // onThoughtChunk callback for thoughts
    )
    
    // Final emit with complete processed content
    emit('contentUpdate', processedHtml)
    
    canUndo.value = true
    
    // Show completed state until user interaction
    isCompleted.value = true
    
  } catch (error) {
    console.error('AI processing error:', error)
    alert(error.message || 'AI processing fejlede')
  } finally {
    isAiProcessing.value = false
    isStreaming.value = false
  }
}

// Handle instruction changes from dropdown
const handleInstructionChanged = (instruction) => {
  currentInstruction.value = instruction
  // Clear completed state when user changes instruction
  isCompleted.value = false
}

// Handle dropdown opened (clear completed state when user opens dropdown)
const handleDropdownOpened = () => {
  isCompleted.value = false
  // Also clear streaming state that might still be showing
  clearStreamingDisplay()
}

// Handle undo functionality
const handleUndo = () => {
  if (!canUndo.value || !originalContent.value) return
  
  // Emit original content to parent
  emit('contentUpdate', originalContent.value)
  
  canUndo.value = false
  // Clear streaming state when undoing
  clearStreamingDisplay()
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