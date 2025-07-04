<template>
  <div class="relative">
    <!-- Split Button -->
    <div ref="buttonContainerRef" class="flex">
      <!-- Main AI Process Button -->
      <BaseButton
        @click="$emit('process')"
        :disabled="disabled"
        variant="primary"
        class="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-none border-r border-purple-500"
      >
        <div v-if="isProcessing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <Brain v-else class="w-4 h-4" />
        AI Process ({{ getShortLabel(selectedInstruction) }})
      </BaseButton>
      
      <!-- Dropdown Toggle Button -->
      <BaseButton
        @click.stop="toggleDropdown"
        :disabled="disabled"
        variant="primary"
        class="px-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-none border-l border-purple-500"
      >
        <ChevronDown :class="['w-4 h-4 transition-transform', isOpen ? 'rotate-180' : '']" />
      </BaseButton>
    </div>
    
    <!-- Dropdown Menu -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        @click.stop
        :style="{
          position: 'fixed',
          left: dropdownPosition.left + 'px',
          top: dropdownPosition.top + 'px',
          width: dropdownPosition.width + 'px',
          transform: dropdownDirection === 'up' ? 'translateY(-100%)' : 'none'
        }"
        class="bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-[70] overflow-hidden"
      >
      <!-- Standard Instructions -->
      <div
        v-for="instruction in groupedInstructions.standard"
        :key="instruction.key"
        @click="selectInstruction(instruction.key)"
        class="px-3 py-2 hover:bg-gray-700 cursor-pointer transition-colors flex items-start gap-2 relative"
        :class="{ 
          'bg-purple-600/20': selectedInstruction === instruction.key,
          'bg-blue-600/10 border-l-2 border-blue-400': isSuggested(instruction.key)
        }"
      >
        <div class="flex-shrink-0 mt-1">
          <component :is="getIcon(instruction.key)" class="w-4 h-4 text-purple-400" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white flex items-center gap-1">
            {{ instruction.label }}
            <span v-if="isSuggested(instruction.key)" class="text-xs bg-blue-600 text-blue-100 px-1 rounded">Foreslået</span>
          </div>
          <div class="text-xs text-gray-400 leading-relaxed">{{ instruction.description }}</div>
        </div>
        <div v-if="selectedInstruction === instruction.key" class="flex-shrink-0 mt-1">
          <Check class="w-4 h-4 text-green-400" />
        </div>
      </div>
      
      <!-- Separator (only show if there are custom instructions) -->
      <div v-if="groupedInstructions.custom.length > 0" class="border-t border-gray-600/50 my-1">
        <div class="px-3 py-1 text-xs text-gray-500 bg-gray-700/30">
          Custom Instructions
        </div>
      </div>
      
      <!-- Custom Instructions -->
      <div
        v-for="instruction in groupedInstructions.custom"
        :key="instruction.key"
        @click="selectInstruction(instruction.key)"
        class="px-3 py-2 hover:bg-gray-700 cursor-pointer transition-colors flex items-start gap-2 relative"
        :class="{ 
          'bg-purple-600/20': selectedInstruction === instruction.key,
          'bg-orange-600/10 border-l-2 border-orange-400': true
        }"
      >
        <div class="flex-shrink-0 mt-1">
          <component :is="getIcon(instruction.key)" class="w-4 h-4 text-orange-400" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white flex items-center gap-1">
            {{ instruction.label }}
            <span class="text-xs bg-orange-600 text-orange-100 px-1 rounded">Custom</span>
          </div>
          <div class="text-xs text-gray-400 leading-relaxed line-clamp-2">{{ instruction.description }}</div>
        </div>
        <div v-if="selectedInstruction === instruction.key" class="flex-shrink-0 mt-1">
          <Check class="w-4 h-4 text-green-400" />
        </div>
      </div>
      </div>
    </Teleport>
    
    <!-- Backdrop to close dropdown -->
    <div
      v-if="isOpen"
      @click="closeDropdown"
      class="fixed inset-0 z-[65]"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Brain, ChevronDown, Check, FileText, Zap, Users, Edit, Settings } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

const props = defineProps({
  isProcessing: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  userSettings: {
    type: Object,
    default: () => ({})
  },
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['process', 'instructionChanged'])

const isOpen = ref(false)
const selectedInstruction = ref('std-note-organizer')
const dropdownRef = ref(null)
const dropdownDirection = ref('down')
const dropdownPosition = ref({ left: 0, top: 0, width: 0 })
const buttonContainerRef = ref(null)

// All instruction options come from customInstructions array in userSettings
const instructionOptions = computed(() => {
  const options = {}
  
  // Get all instructions from userSettings customInstructions
  const customInstructions = props.userSettings?.aiSettings?.customInstructions
  if (customInstructions && Array.isArray(customInstructions)) {
    customInstructions.forEach(instruction => {
      if (instruction && instruction.id && instruction.name) {
        // Determine icon based on instruction type
        let icon = 'Settings' // Default for custom instructions
        
        if (instruction.isDefault) {
          // Standard instruction icons
          if (instruction.id === 'std-note-organizer') icon = 'FileText'
          else if (instruction.id === 'std-summarizer') icon = 'Zap'
          else if (instruction.id === 'std-meeting-notes') icon = 'Users'
          else if (instruction.id === 'std-grammar-checker') icon = 'Edit'
        }
        
        options[instruction.id] = {
          label: instruction.name,
          description: instruction.instruction || '',
          icon,
          isStandard: instruction.isDefault || false
        }
      }
    })
  }
  
  return options
})

// Get icon component for instruction
const getIcon = (instructionKey) => {
  const iconName = instructionOptions.value[instructionKey]?.icon || 'FileText'
  const iconMap = {
    FileText,
    Zap,
    Users,
    Edit,
    Settings
  }
  return iconMap[iconName] || FileText
}

// Get short label for button display
const getShortLabel = (instructionKey) => {
  const instruction = instructionOptions.value[instructionKey]
  if (!instruction) return 'Unknown'
  
  // For standard instructions, use predefined short labels
  const standardLabels = {
    'std-note-organizer': 'Organizer',
    'std-summarizer': 'Summary',
    'std-meeting-notes': 'Meeting',
    'std-grammar-checker': 'Grammar'
  }
  
  if (instruction.isStandard) {
    return standardLabels[instructionKey] || instruction.label
  }
  
  // For custom instructions, truncate name if too long
  const name = instruction.label
  return name.length > 12 ? name.substring(0, 12) + '...' : name
}

// Smart content analysis for instruction suggestions
const getSuggestedInstruction = (content) => {
  if (!content) return null
  
  const lowerContent = content.toLowerCase()
  
  // Check for meeting-related keywords
  const meetingKeywords = ['møde', 'meeting', 'deltagere', 'beslutning', 'action', 'handlingsplan', 'agenda']
  if (meetingKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'std-meeting-notes'
  }
  
  // Check for grammar/spelling issues (simple heuristic)
  const grammarIssues = ['fejl', 'retning', 'stavning', 'grammatik']
  if (grammarIssues.some(keyword => lowerContent.includes(keyword))) {
    return 'std-grammar-checker'
  }
  
  // Check for summary keywords
  const summaryKeywords = ['sammendrag', 'konklusion', 'opsummering', 'oversigt']
  if (summaryKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'std-summarizer'
  }
  
  // Default suggestion
  return 'std-note-organizer'
}

// Check if instruction is suggested based on content
const isSuggested = (instructionKey) => {
  const suggested = getSuggestedInstruction(props.content)
  return suggested === instructionKey && suggested !== selectedInstruction.value
}

// Group instructions for display
const groupedInstructions = computed(() => {
  const options = instructionOptions.value
  const standard = []
  const custom = []
  
  Object.entries(options).forEach(([key, instruction]) => {
    if (instruction.isStandard) {
      standard.push({ key, ...instruction })
    } else {
      custom.push({ key, ...instruction })
    }
  })
  
  return { standard, custom }
})

// Calculate dropdown direction and position based on button container
const calculateDropdownDirection = () => {
  if (!buttonContainerRef.value) return
  
  const rect = buttonContainerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const _spaceBelow = viewportHeight - rect.bottom
  const _spaceAbove = rect.top
  
  // Estimate dropdown height (approximate)
  const _estimatedDropdownHeight = Math.min(300, (groupedInstructions.value.standard.length + groupedInstructions.value.custom.length) * 60)
  
  // Always show dropdown above the button
  dropdownDirection.value = 'up'
  
  // Calculate fixed position (always above button)
  dropdownPosition.value = {
    left: rect.left,
    top: rect.top,
    width: rect.width
  }
}

// Dropdown controls
const toggleDropdown = () => {
  if (!isOpen.value) {
    isOpen.value = true
    // Calculate direction on next tick when dropdown is rendered
    nextTick(() => {
      calculateDropdownDirection()
    })
  } else {
    isOpen.value = false
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

// Instruction selection
const selectInstruction = (instructionKey) => {
  selectedInstruction.value = instructionKey
  closeDropdown()
  
  // Save to session storage (for all instructions)
  sessionStorage.setItem('ai-instruction-preference', instructionKey)
  
  // Emit change to parent
  emit('instructionChanged', instructionKey)
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (isOpen.value && !event.target.closest('.relative')) {
    closeDropdown()
  }
}

// Load saved preference on mount
onMounted(() => {
  // Fall back to session storage for initial selection
  const saved = sessionStorage.getItem('ai-instruction-preference')
  if (saved && instructionOptions.value[saved]) {
    selectedInstruction.value = saved
  }
  
  // Emit initial instruction to parent
  emit('instructionChanged', selectedInstruction.value)
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Ensure proper z-index stacking */
.relative {
  position: relative;
}

/* Smooth transitions for dropdown */
.transition-transform {
  transition: transform 0.2s ease;
}

/* Button group styling */
.flex > button:not(:last-child) {
  border-right: 1px solid rgba(139, 92, 246, 0.3);
}

.flex > button:not(:first-child) {
  border-left: 1px solid rgba(139, 92, 246, 0.3);
}

/* Line clamp utility for truncating text */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>