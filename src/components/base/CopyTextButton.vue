<template>
  <button
    @click="copyToClipboard"
    :disabled="loading"
    class="copy-text-btn"
    :title="copied ? 'Kopieret!' : 'Kopier tekst'"
  >
    <Check v-if="copied" class="w-4 h-4 text-green-500" />
    <Copy v-else class="w-4 h-4" />
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const props = defineProps({
  htmlContent: {
    type: String,
    required: true
  }
})

const copied = ref(false)
const loading = ref(false)

// Convert HTML to plain text
const htmlToPlainText = (html) => {
  // Create a temporary div element
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Return the text content (removes all HTML tags)
  return tempDiv.textContent || tempDiv.innerText || ''
}

// Copy content to clipboard
const copyToClipboard = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    // Convert HTML to plain text
    const plainText = htmlToPlainText(props.htmlContent)
    
    // Check if clipboard API is available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(plainText)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = plainText
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
      } finally {
        textArea.remove()
      }
    }
    
    // Show success feedback
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    
  } catch (error) {
    console.error('Failed to copy text:', error)
  } finally {
    loading.value = false
  }
}
</script>