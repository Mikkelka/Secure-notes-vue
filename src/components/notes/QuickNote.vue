<template>
  <div 
    :class="[
      isInDrawer ? '' : 'bg-gray-800/60 border border-gray-700/50 rounded-lg p-4',
      isInDrawer ? 'p-0' : '',
      'transition-all duration-300',
      isAdvancedMode ? 'quicknote-advanced' : ''
    ]"
  >
    <div :class="hideTitle ? 'flex justify-end mb-2 pr-2' : 'flex items-center justify-between mb-2'">
      <h3 v-if="!hideTitle" class="text-white font-medium">Ny note</h3>
      <BaseButton
        @click="toggleAdvancedMode"
        variant="ghost"
        size="sm"
        class="text-gray-400 hover:text-white !outline-0 !ring-0 !ring-offset-0"
        style="outline: none !important; box-shadow: none !important; background: transparent !important;"
      >
        <FileText v-if="isAdvancedMode" class="w-4 h-4" />
        <Edit v-else class="w-4 h-4" />
        {{ isAdvancedMode ? 'Simple' : 'Advanced' }}
      </BaseButton>
    </div>
    
    <div :class="isInDrawer ? 'space-y-2' : 'space-y-3'">
      <input
        v-model="title"
        type="text"
        placeholder="Titel..."
        :class="[
          'w-full bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500',
          isInDrawer ? 'px-3 py-1.5' : 'px-3 py-2'
        ]"
      />
      
      <!-- Simple Mode: Textarea -->
      <textarea
        v-if="!isAdvancedMode"
        v-model="content"
        :rows="isInDrawer ? (isCompact ? 6 : 10) : (isCompact ? 4 : 8)"
        placeholder="Skriv din note her..."
        :class="[
          'w-full bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none',
          isInDrawer ? 'px-3 py-1.5' : 'px-3 py-2'
        ]"
      />
      
      <!-- Advanced Mode: TinyMCE -->
      <div v-if="isAdvancedMode" class="tinymce-wrapper">
        <editor
          api-key="xops5w4mc9duaby9p8f4vhe2n689r11fauo9m5xbmb3k2grb"
          v-model="htmlContent"
          :init="getTinymceConfig(isCompact)"
        />
      </div>
      
      <div class="flex gap-2">
        <BaseButton
          :disabled="!title.trim() || !getCurrentContent().trim()"
          @click="handleSave"
          variant="primary"
          size="sm"
          class="flex-1"
        >
          <Save class="w-4 h-4" />
          Gem note
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Save, FileText, Edit } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'
import Editor from '@tinymce/tinymce-vue'

defineProps({
  isCompact: {
    type: Boolean,
    default: false
  },
  hideTitle: {
    type: Boolean,
    default: false
  },
  isInDrawer: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'mode-change'])

// State
const title = ref('')
const content = ref('')
const htmlContent = ref('')
const isAdvancedMode = ref(false)

// TinyMCE Configuration
const getTinymceConfig = (isCompact = false) => {
  const isMobileView = window.innerWidth < 1024
  const viewportHeight = window.innerHeight
  
  // Smaller heights for QuickNote component
  const minHeight = isCompact ? 80 : (isMobileView ? 120 : 150)
  const maxHeight = Math.min(
    viewportHeight * (isMobileView ? 0.4 : 0.5), 
    isCompact ? 200 : (isMobileView ? 300 : 400)
  )
  
  return {
    // Responsive height configuration
    min_height: minHeight,
    max_height: maxHeight,
    menubar: false,
    statusbar: false,
    branding: false,
    plugins: 'lists link autolink autoresize',
    toolbar: 'undo redo | h1 h2 h3 | bold italic underline strikethrough | bullist | link',
    formats: {
      h1: { block: 'h1' },
      h2: { block: 'h2' },
      h3: { block: 'h3' }
    },
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3',
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #d1d5db; background-color: #374151; } p { margin: 0.5em 0; }',
    skin: 'oxide-dark',
    content_css: 'dark',
    analytics: false,
    usage_tracking: false,
    telemetry: false,
    touch_ui: false,
    auto_update: false,
    // Auto resize options
    autoresize_bottom_margin: 12,
    autoresize_overflow_padding: 0
  }
}

// Content Management
const getCurrentContent = () => {
  if (isAdvancedMode.value) {
    // Convert HTML to plain text for validation
    return htmlContent.value ? htmlContent.value.replace(/<[^>]*>/g, '').trim() : ''
  }
  return content.value
}

const convertTextToHtml = (text) => {
  if (!text) return '<p><br></p>'
  const html = text.replace(/\n/g, '<br>')
  return `<p>${html}</p>`
}

const convertHtmlToText = (html) => {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

// Mode Toggle
const toggleAdvancedMode = () => {
  if (!isAdvancedMode.value) {
    // Switching to advanced mode: convert text to HTML
    htmlContent.value = convertTextToHtml(content.value)
  } else {
    // Switching to simple mode: convert HTML to text
    content.value = convertHtmlToText(htmlContent.value)
  }
  isAdvancedMode.value = !isAdvancedMode.value
  
  // Emit mode change to parent
  emit('mode-change', isAdvancedMode.value)
}

// Save Logic
const handleSave = async () => {
  const currentContent = getCurrentContent()
  if (title.value.trim() && currentContent.trim()) {
    try {
      let contentToSave
      if (isAdvancedMode.value) {
        // Save HTML directly
        contentToSave = htmlContent.value
      } else {
        // Convert plain text to simple HTML
        contentToSave = `<p>${content.value.trim().replace(/\n/g, '<br>')}</p>`
      }
      
      const success = await emit('save', title.value.trim(), contentToSave)
      if (success !== false) {
        // Clear fields on successful save
        title.value = ''
        content.value = ''
        htmlContent.value = ''
      }
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }
}

</script>

<style scoped>
/* No special width styling needed - controlled by parent grid layout */

/* Ensure TinyMCE editor has proper styling */
.tinymce-wrapper {
  border-radius: 0.5rem;
  overflow: hidden;
}
</style>