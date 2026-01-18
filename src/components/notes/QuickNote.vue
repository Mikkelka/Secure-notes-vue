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
        <FileText v-if="isAdvancedMode" class="icon-sm" />
        <Edit v-else class="icon-sm" />
        {{ isAdvancedMode ? 'Simple' : 'Advanced' }}
      </BaseButton>
    </div>
    
    <div :class="isInDrawer ? 'space-y-2' : 'space-y-3'">
      <input
        v-model="title"
        type="text"
        placeholder="Titel..."
        :class="[
          'input-small',
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
          'input-small resize-none',
          isInDrawer ? 'px-3 py-1.5' : 'px-3 py-2'
        ]"
      />
      
      <!-- Advanced Mode: TinyMCE -->
      <div v-if="isAdvancedMode" class="tinymce-wrapper">
        <editor
          ref="editorRef"
          tinymce-script-src="/tinymce/tinymce.min.js"
          license-key="gpl"
          v-model="htmlContent"
          :init="getTinymceConfig(isCompact)"
          @input="handleContentChange"
          @node-change="handleContentChange"
          @exec-command="handleContentChange"
          @format-apply="handleContentChange"
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
          <Save class="icon-sm" />
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
import { debounceVue } from '../../utils/debounce.js'

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
const editorRef = ref(null)

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
  
  const config = {
    // License key now handled by component prop
    // Responsive height configuration
    min_height: minHeight,
    max_height: maxHeight,
    menubar: false,
    statusbar: false,
    branding: false,
    plugins: 'lists link autolink autoresize',
    toolbar: 'undo redo | formatselect | h1 h2 h3 | bold italic underline strikethrough | bullist | link',
    formats: {
      h1: { block: 'h1' },
      h2: { block: 'h2' },
      h3: { block: 'h3' }
    },
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3',
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #d1d5db; background-color: #374151; } p { margin: 0.5em 0; } h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem 0; line-height: 1.2; color: #ffffff; } h2 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem 0; line-height: 1.3; color: #ffffff; } h3 { font-size: 1.125rem; font-weight: 600; margin: 0.5rem 0 0.5rem 0; line-height: 1.4; color: #ffffff; }',
    skin: 'oxide-dark',
    content_css: 'dark',
    // Default paragraph wrapping for proper structure
    forced_root_block: 'p',
    keep_styles: false,
    verify_html: false,
    cleanup: false,
    valid_elements: 'p,h1,h2,h3,strong,em,u,strike,ul,ol,li,br,a[href|target|rel]',
    extended_valid_elements: 'h1,h2,h3',
    analytics: false,
    usage_tracking: false,
    telemetry: false,
    touch_ui: false,
    auto_update: false,
    // Auto resize options
    autoresize_bottom_margin: 12,
    autoresize_overflow_padding: 0,
    // Setup callback to ensure format changes trigger events
    setup: (editor) => {
      editor.on('NodeChange FormatApply ExecCommand', () => {
        // Force v-model update on format changes (TinyMCE 7.0 compatible)
        editor.dispatch('input')
      })

      // Add heading toggle functionality
      editor.ui.registry.addButton('h1', {
        text: 'H1',
        onAction: () => {
          const node = editor.selection.getNode()
          if (node.tagName === 'H1') {
            editor.execCommand('FormatBlock', false, 'p')
          } else {
            editor.execCommand('FormatBlock', false, 'h1')
          }
        }
      })

      editor.ui.registry.addButton('h2', {
        text: 'H2',
        onAction: () => {
          const node = editor.selection.getNode()
          if (node.tagName === 'H2') {
            editor.execCommand('FormatBlock', false, 'p')
          } else {
            editor.execCommand('FormatBlock', false, 'h2')
          }
        }
      })

      editor.ui.registry.addButton('h3', {
        text: 'H3',
        onAction: () => {
          const node = editor.selection.getNode()
          if (node.tagName === 'H3') {
            editor.execCommand('FormatBlock', false, 'p')
          } else {
            editor.execCommand('FormatBlock', false, 'h3')
          }
        }
      })
    }
  }
  return config
}

// Content change handler for TinyMCE events (debounced for performance)
const handleContentChange = debounceVue(() => {
  // Trigger reactivity (no-op to satisfy linter)
  const _currentValue = htmlContent.value
}, 300)

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
  // Sync content from TinyMCE editor if in advanced mode before saving
  if (isAdvancedMode.value && editorRef.value && editorRef.value.getContent) {
    const latestContent = editorRef.value.getContent()
    if (latestContent !== htmlContent.value) {
      htmlContent.value = latestContent
    }
  }
  
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
        
        // Reset to simple mode after successful save
        if (isAdvancedMode.value) {
          isAdvancedMode.value = false
          emit('mode-change', false)
        }
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
