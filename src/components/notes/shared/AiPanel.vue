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
      
      <!-- Real-time AI Streaming Display -->
      <div v-if="isStreaming || streamingText.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <div v-if="isStreaming" class="flex items-center gap-2">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-green-400 text-sm">AI Streaming...</span>
          </div>
          <span class="text-gray-400 text-xs">{{ streamingText.length }} tegn</span>
        </div>
        
        <!-- Streaming Content Display -->
        <div class="p-3 bg-gray-800/50 border border-green-600/30 rounded-lg max-h-32 overflow-y-auto">
          <div v-if="streamingText.length === 0 && !isStreaming" class="text-gray-500 text-center py-4">
            AI streaming starter...
          </div>
          <div v-else class="text-gray-200 text-sm leading-relaxed">
            <span class="text-green-400 opacity-80">{{ streamingText }}</span>
            <span v-if="isStreaming" class="animate-pulse text-green-400">▍</span>
          </div>
        </div>
      </div>
      
      <!-- Thought Summaries Display -->
      <div v-if="thoughtStreamingText.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span class="text-blue-400 text-sm">🧠 AI Reasoning</span>
          <span class="text-gray-400 text-xs">{{ thoughtStreamingText.length }} tegn</span>
        </div>
        
        <div class="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg max-h-32 overflow-y-auto">
          <div class="text-blue-200 text-sm leading-relaxed">
            {{ thoughtStreamingText }}
          </div>
        </div>
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

// Real-time streaming state
const streamingText = ref('')
const thoughtStreamingText = ref('')
const isStreaming = ref(false)

// Streaming display methods
const clearStreamingDisplay = () => {
  streamingText.value = ''
  thoughtStreamingText.value = ''
  isStreaming.value = false
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