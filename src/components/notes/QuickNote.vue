<template>
  <div class="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-white font-medium">Ny note</h3>
      <BaseButton
        @click="toggleAdvancedMode"
        variant="ghost"
        size="sm"
        class="text-gray-400 hover:text-white"
      >
        <component :is="isAdvancedMode ? 'Type' : 'Edit3'" class="w-4 h-4" />
        {{ isAdvancedMode ? 'Simple' : 'Advanced' }}
      </BaseButton>
    </div>
    
    <div class="space-y-3">
      <input
        v-model="title"
        type="text"
        placeholder="Titel..."
        class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
      />
      
      <!-- Simple Mode: Textarea -->
      <textarea
        v-if="!isAdvancedMode"
        v-model="content"
        :rows="isCompact ? 4 : 8"
        placeholder="Skriv din note her..."
        class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none"
      />
      
      <!-- Advanced Mode: TinyMCE -->
      <div v-if="isAdvancedMode" class="tinymce-wrapper">
        <editor
          api-key="xops5w4mc9duaby9p8f4vhe2n689r11fauo9m5xbmb3k2grb"
          v-model="htmlContent"
          :init="getTinymceConfig(isCompact ? 200 : 300)"
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
import { ref, watch } from 'vue'
import { Save, Edit3, Type } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'
import Editor from '@tinymce/tinymce-vue'
import { createLexicalState } from '../../services/aiService.js'

defineProps({
  isCompact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save'])

// State
const title = ref('')
const content = ref('')
const htmlContent = ref('')
const isAdvancedMode = ref(false)

// TinyMCE Configuration
const getTinymceConfig = (height = 300) => ({
  height,
  menubar: false,
  statusbar: false,
  branding: false,
  plugins: [
    'advlist autolink lists link charmap searchreplace',
    'visualblocks code fullscreen table wordcount help'
  ],
  toolbar: 'undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | removeformat | help',
  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #d1d5db; background-color: #374151; } p { margin: 0.5em 0; }',
  skin: 'oxide-dark',
  content_css: 'dark',
  analytics: false,
  usage_tracking: false,
  touch_ui: false,
  auto_update: false
})

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
}

// Save Logic
const handleSave = async () => {
  const currentContent = getCurrentContent()
  if (title.value.trim() && currentContent.trim()) {
    try {
      let contentToSave
      if (isAdvancedMode.value) {
        // Convert HTML to Lexical format for storage
        contentToSave = convertHtmlToLexical(htmlContent.value)
      } else {
        // Convert plain text to Lexical format
        contentToSave = createLexicalState(content.value.trim())
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

// HTML to Lexical conversion (copied from NoteViewer)
const convertHtmlToLexical = (html) => {
  if (!html) return ''
  
  try {
    // Clean up TinyMCE's automatic empty paragraphs first
    let cleanHtml = html
      .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '')
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      .replace(/(<\/(?:h[1-6]|ul|ol|li)>)\s*<br\s*\/?>\s*(<(?:h[1-6]|ul|ol|li|p))/gi, '$1\n$2')
    
    // Convert HTML to markdown to preserve formatting
    let markdownText = cleanHtml
      .replace(/<\/?strong>/gi, '**')
      .replace(/<\/?b>/gi, '**')
      .replace(/<\/?em>/gi, '*')
      .replace(/<\/?i>/gi, '*')
      .replace(/<u>/gi, '<u>').replace(/<\/u>/gi, '</u>')
      .replace(/<\/?s>/gi, '~~')
      .replace(/<\/?strike>/gi, '~~')
      .replace(/<h1[^>]*>/gi, '# ').replace(/<\/h1>/gi, '\n')
      .replace(/<h2[^>]*>/gi, '## ').replace(/<\/h2>/gi, '\n')
      .replace(/<h3[^>]*>/gi, '### ').replace(/<\/h3>/gi, '\n')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>/gi, (match, offset, string) => {
        const beforeLi = string.substring(0, offset)
        const lastOl = beforeLi.lastIndexOf('<ol')
        const lastUl = beforeLi.lastIndexOf('<ul')
        const lastOlClose = beforeLi.lastIndexOf('</ol>')
        const lastUlClose = beforeLi.lastIndexOf('</ul>')
        
        const isNumberedList = lastOl > lastUl && lastOl > lastOlClose
        return isNumberedList ? '1. ' : '- '
      })
      .replace(/<\/li>/gi, '\n')
      .replace(/<a[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/\n\s+/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
    
    if (!markdownText) {
      markdownText = ''
    }
    
    return createLexicalState(markdownText)
  } catch (error) {
    console.error('HTML to Lexical conversion error:', error)
    return createLexicalState('')
  }
}
</script>