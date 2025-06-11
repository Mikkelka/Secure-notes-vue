<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-sm mx-auto">
      <h3 class="text-white font-medium mb-4 text-center">{{ title }}</h3>
      
      <div v-if="!showMasterPassword">
        <div class="flex gap-2 justify-center mb-4">
          <input
            v-for="(digit, index) in pin"
            :key="index"
            :ref="el => inputRefs[index] = el"
            type="text"
            inputmode="numeric"
            maxlength="1"
            :value="digit"
            @input="handleChange($event.target, index)"
            @keydown="handleKeyDown($event, index)"
            @paste="index === 0 ? handlePaste($event) : $event.preventDefault()"
            class="w-12 h-12 text-center text-xl bg-gray-700/50 border border-gray-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center mb-4">{{ error }}</div>
        
        <div class="text-xs text-gray-400 text-center mb-4">
          PIN skal være {{ length }} cifre (kun tal)
        </div>

        <div class="flex gap-2 mb-3">
          <button
            @click="clearPin"
            class="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors text-sm"
          >
            Ryd
          </button>
          <button
            @click="handleCancel"
            class="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors text-sm"
          >
            Annuller
          </button>
        </div>

        <button
          @click="showMasterPassword = true"
          class="w-full px-3 py-2 bg-yellow-600/20 border border-yellow-600/30 text-yellow-300 rounded hover:bg-yellow-600/30 transition-colors text-xs"
        >
          Glemt PIN? Brug hovedadgangskode
        </button>
      </div>

      <form v-else @submit.prevent="handleMasterPasswordSubmit">
        <div class="mb-4">
          <label class="block text-sm text-gray-300 mb-2">Hovedadgangskode:</label>
          <input
            v-model="masterPassword"
            type="password"
            placeholder="Indtast din hovedadgangskode... (Hint: master)"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ref="masterPasswordInput"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center mb-4">{{ error }}</div>

        <div class="flex gap-2">
          <button
            type="button"
            @click="backToPin"
            class="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors text-sm"
          >
            Tilbage
          </button>
          <button
            type="submit"
            :disabled="!masterPassword.trim()"
            class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors text-sm disabled:opacity-50"
          >
            Lås op
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, watch } from 'vue'

const props = defineProps({
  length: {
    type: Number,
    default: 4
  },
  title: {
    type: String,
    default: 'Indtast PIN'
  },
  isVisible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['complete', 'cancel', 'masterPasswordUnlock'])

// PIN state
const pin = ref(new Array(props.length).fill(''))
const error = ref('')
const showMasterPassword = ref(false)
const masterPassword = ref('')
const inputRefs = reactive([])
const masterPasswordInput = ref(null)

// Auto-focus when visible
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      inputRefs[0]?.focus()
    })
  }
})

// Auto-focus master password input
watch(showMasterPassword, (newVal) => {
  if (newVal) {
    nextTick(() => {
      masterPasswordInput.value?.focus()
    })
  }
})

const handleChange = (element, index) => {
  const value = element.value
  
  // Only allow numbers
  if (!/^\d*$/.test(value)) return
  
  const newPin = [...pin.value]
  newPin[index] = value.slice(-1) // Only take last digit if multiple entered
  pin.value = newPin
  error.value = ''

  // Auto-focus next input
  if (value && index < props.length - 1) {
    inputRefs[index + 1]?.focus()
  }

  // Check if PIN is complete
  if (newPin.every(digit => digit !== '') && newPin.join('').length === props.length) {
    emit('complete', newPin.join(''))
  }
}

const handleKeyDown = (e, index) => {
  // Handle backspace
  if (e.key === 'Backspace') {
    if (!pin.value[index] && index > 0) {
      // Focus previous input if current is empty
      inputRefs[index - 1]?.focus()
    }
  }
  
  // Handle Enter
  if (e.key === 'Enter' && pin.value.every(digit => digit !== '')) {
    emit('complete', pin.value.join(''))
  }
  
  // Handle Escape
  if (e.key === 'Escape') {
    handleCancel()
  }
}

const handlePaste = (e) => {
  e.preventDefault()
  const pastedData = e.clipboardData.getData('text')
  
  // Only allow numbers and correct length
  if (!/^\d+$/.test(pastedData) || pastedData.length !== props.length) {
    error.value = `PIN skal være ${props.length} cifre`
    return
  }
  
  const newPin = pastedData.split('')
  pin.value = newPin
  error.value = ''
  
  // Focus last input
  inputRefs[props.length - 1]?.focus()
  
  // Complete the PIN
  emit('complete', pastedData)
}

const clearPin = () => {
  pin.value = new Array(props.length).fill('')
  error.value = ''
  inputRefs[0]?.focus()
}

const clearPinOnly = () => {
  pin.value = new Array(props.length).fill('')
  inputRefs[0]?.focus()
}

const handleCancel = () => {
  emit('cancel')
}

const handleMasterPasswordSubmit = async () => {
  if (masterPassword.value.trim()) {
    // Note: Vue emit doesn't return values like React props
    // Parent will handle the unlock result via the emit
    emit('masterPasswordUnlock', masterPassword.value.trim())
  }
}

const backToPin = () => {
  showMasterPassword.value = false
  masterPassword.value = ''
  error.value = ''
}

// Reset PIN when error occurs (called from parent)
const resetPin = () => {
  clearPinOnly() // Don't clear error, just PIN
}

// Set error from parent
const setError = (errorMessage) => {
  error.value = errorMessage
}

defineExpose({
  resetPin,
  setError
})
</script>