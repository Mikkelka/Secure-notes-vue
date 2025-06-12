<template>
  <!-- Mobile Overlay -->
  <div 
    v-if="note" 
    class="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-60" 
    @click="$emit('close')"
  >
    <div class="absolute inset-0 bg-gray-900" @click.stop>
      <div class="h-full flex flex-col">
        <!-- Mobile Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 class="text-lg font-semibold text-white truncate flex-1 mr-3">
            {{ isEditing ? 'Edit Note' : note.title }}
          </h2>
          <div class="flex items-center gap-2">
            <BaseButton
              v-if="!isEditing"
              variant="ghost"
              size="sm"
              @click="$emit('toggleFavorite', note.id)"
              :class="note.isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'"
            >
              <Star 
                :class="note.isFavorite ? 'fill-yellow-400' : 'fill-none'" 
                class="w-5 h-5" 
              />
            </BaseButton>
            <BaseButton
              v-if="!isEditing"
              variant="ghost"
              size="sm"
              @click="handleDelete"
              class="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 class="w-5 h-5" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="$emit('close')"
              class="text-gray-400 hover:text-white"
            >
              <X class="w-5 h-5" />
            </BaseButton>
          </div>
        </div>

        <!-- Mobile Content -->
        <div class="flex-1 overflow-auto p-4">
          <div v-if="isEditing" class="space-y-4">
            <input
              v-model="editTitle"
              type="text"
              class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
              placeholder="Title..."
            />
            <div class="tinymce-wrapper">
              <editor
                api-key="xops5w4mc9duaby9p8f4vhe2n689r11fauo9m5xbmb3k2grb"
                v-model="editorHtmlContent"
                :init="getTinymceConfig(400)"
              />
            </div>
            <div class="space-y-3">
              <!-- AI and Undo buttons -->
              <div class="flex gap-2">
                <BaseButton
                  @click="handleAiProcess"
                  :disabled="isAiProcessing || !editContent.trim()"
                  variant="primary"
                  class="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div v-if="isAiProcessing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <Brain v-else class="w-4 h-4" />
                  {{ isAiProcessing ? 'Processing...' : 'AI Process' }}
                </BaseButton>
                <BaseButton
                  v-if="canUndo"
                  @click="handleUndo"
                  variant="secondary"
                  class="bg-orange-600 hover:bg-orange-500"
                >
                  <Undo class="w-4 h-4" />
                  Undo
                </BaseButton>
              </div>
              
              <!-- Save and Cancel buttons -->
              <div class="flex gap-3">
                <BaseButton
                  @click="handleSave"
                  :disabled="!editTitle.trim() || !editContent.trim()"
                  variant="primary"
                  class="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save class="w-4 h-4" />
                  Save
                </BaseButton>
                <BaseButton
                  @click="cancelEdit"
                  variant="secondary"
                  class="flex-1 bg-gray-600 hover:bg-gray-500"
                >
                  Cancel
                </BaseButton>
              </div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="flex items-center gap-2 text-gray-400 text-sm">
              <Clock class="w-4 h-4" />
              {{ formatDate(note.createdAt, true) }}
            </div>
            <div class="max-w-none">
              <!-- Direct HTML rendering -->
              <div 
                class="text-gray-300 text-base leading-relaxed prose-content"
                v-html="convertContentToHtml(note.content)"
                style="color: #d1d5db !important;"
              ></div>
            </div>
          </div>
        </div>

        <!-- Mobile Actions -->
        <div v-if="!isEditing" class="p-4 border-t border-gray-700/50">
          <BaseButton
            @click="startEdit"
            variant="primary"
            class="w-full bg-blue-600 hover:bg-blue-500"
          >
            <Edit3 class="w-4 h-4" />
            Rediger Note
          </BaseButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Desktop Sidebar -->
  <div v-if="note" class="hidden lg:block fixed right-0 top-16 h-[calc(100vh-4rem)] w-2/5 max-w-2xl bg-gray-900/95 backdrop-blur border-l border-gray-700/50 z-40 overflow-hidden shadow-xl">
    <div class="h-full flex flex-col">
      <!-- Desktop Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h2 class="text-lg font-semibold text-white truncate flex-1 mr-3">
          {{ isEditing ? 'Edit Note' : note.title }}
        </h2>
        <div class="flex items-center gap-2">
          <BaseButton
            v-if="!isEditing"
            variant="ghost"
            size="sm"
            @click="$emit('toggleFavorite', note.id)"
            :class="note.isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'"
          >
            <Star 
              :class="note.isFavorite ? 'fill-yellow-400' : 'fill-none'" 
              class="w-4 h-4" 
            />
          </BaseButton>
          <BaseButton
            v-if="!isEditing"
            variant="ghost"
            size="sm"
            @click="handleDelete"
            class="text-red-400 hover:text-red-300 hover:bg-red-500/20"
          >
            <Trash2 class="w-4 h-4" />
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="$emit('close')"
            class="text-gray-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </BaseButton>
        </div>
      </div>

      <!-- Desktop Content -->
      <div class="flex-1 overflow-auto p-4">
        <div v-if="isEditing" class="space-y-4">
          <input
            v-model="editTitle"
            type="text"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
            placeholder="Title..."
          />
          <div class="tinymce-wrapper">
            <editor
              api-key="xops5w4mc9duaby9p8f4vhe2n689r11fauo9m5xbmb3k2grb"
              v-model="editorHtmlContent"
              :init="getTinymceConfig(350)"
            />
          </div>
          <div class="space-y-2">
            <!-- AI and Undo buttons -->
            <div class="flex gap-2">
              <BaseButton
                @click="handleAiProcess"
                :disabled="isAiProcessing || !editContent.trim()"
                variant="primary"
                size="sm"
                class="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div v-if="isAiProcessing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <Brain v-else class="w-4 h-4" />
                {{ isAiProcessing ? 'Processing...' : 'AI Process' }}
              </BaseButton>
              <BaseButton
                v-if="canUndo"
                @click="handleUndo"
                variant="secondary"
                size="sm"
                class="bg-orange-600 hover:bg-orange-500"
              >
                <Undo class="w-4 h-4" />
                Undo
              </BaseButton>
            </div>
            
            <!-- Save and Cancel buttons -->
            <div class="flex gap-2">
              <BaseButton
                @click="handleSave"
                :disabled="!editTitle.trim() || !editContent.trim()"
                variant="primary"
                size="sm"
                class="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save class="w-4 h-4" />
                Save
              </BaseButton>
              <BaseButton
                @click="cancelEdit"
                variant="secondary"
                size="sm"
                class="bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </BaseButton>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center gap-2 text-gray-400 text-sm">
            <Clock class="w-4 h-4" />
            {{ formatDate(note.createdAt, true) }}
          </div>
          <div class="max-w-none">
            <!-- Direct HTML rendering -->
            <div 
              class="text-gray-300 text-sm leading-relaxed prose-content"
              v-html="convertContentToHtml(note.content)"
              style="color: #d1d5db !important;"
            ></div>
          </div>
        </div>
      </div>

      <!-- Desktop Actions -->
      <div v-if="!isEditing" class="p-4 border-t border-gray-700/50">
        <BaseButton
          @click="startEdit"
          variant="primary"
          size="sm"
          class="w-full bg-blue-600 hover:bg-blue-500"
        >
          <Edit3 class="w-4 h-4" />
          Rediger Note
        </BaseButton>
      </div>
    </div>
  </div>
  
  <!-- Confirm Dialog -->
  <BaseDialog
    :is-open="confirmDialog.isOpen"
    title="Slet note"
    :show-default-actions="true"
    confirm-text="Slet"
    cancel-text="Annuller"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
    @close="handleCancelDelete"
  >
    Er du sikker på at du vil slette denne note? Denne handling kan ikke fortrydes.
  </BaseDialog>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Star, Trash2, X, Save, Edit3, Clock, Brain, Undo } from 'lucide-vue-next'
import Editor from '@tinymce/tinymce-vue'
import BaseButton from '../base/BaseButton.vue'
import BaseDialog from '../base/BaseDialog.vue'
import { processTextWithAi, isLexicalContent, createLexicalState } from '../../services/aiService.js'

const props = defineProps({
  note: {
    type: Object,
    required: true
  },
  userSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'update', 'delete', 'toggleFavorite'])

const isEditing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const confirmDialog = ref({ isOpen: false })
const isAiProcessing = ref(false)
const aiProcessCount = ref(0)
const originalContent = ref('')
const canUndo = ref(false)


// TinyMCE editor content for editing
const editorHtmlContent = ref('')

// TinyMCE configuration
const getTinymceConfig = (height = 400) => ({
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
  // Disable analytics and tracking
  analytics: false,
  usage_tracking: false,
  // Reduce touch sensitivity warnings
  touch_ui: false,
  // Disable automatic updates
  auto_update: false
})

// Convert content for display and editing
const convertContentToHtml = (content) => {
  if (!content) {
    return '<p>No content available</p>'
  }
  
  if (isLexicalContent(content)) {
    try {
      const parsed = JSON.parse(content)
      
      const convertNode = (node) => {
        if (node.type === 'text') {
          let text = node.text || ''
          if (node.format & 1) text = `<strong>${text}</strong>`
          if (node.format & 2) text = `<em>${text}</em>`
          if (node.format & 4) text = `<s>${text}</s>`
          if (node.format & 8) text = `<u>${text}</u>`
          return text
        }
        
        const children = node.children?.map(convertNode).join('') || ''
        
        switch (node.type) {
          case 'paragraph':
            return children ? `<p>${children}</p>` : '<p><br></p>'
          case 'heading': {
            const level = node.tag?.substring(1) || '1'
            return `<h${level}>${children}</h${level}>`
          }
          case 'list':
            return node.listType === 'bullet' ? `<ul>${children}</ul>` : `<ol>${children}</ol>`
          case 'listitem':
            return `<li>${children}</li>`
          case 'quote':
            return `<blockquote>${children}</blockquote>`
          default:
            return children
        }
      }
      
      return parsed.root?.children?.map(convertNode).join('') || '<p>Empty content</p>'
    } catch (error) {
      console.error('Lexical conversion error:', error)
      return `<p>${content}</p>`
    }
  }
  
  // Handle plain text
  const html = content.replace(/\n/g, '<br>')
  return html ? `<p>${html}</p>` : '<p>No content</p>'
}

// Convert HTML back to Lexical format for storage
const convertHtmlToLexical = (html) => {
  if (!html) return ''
  
  try {
    // Clean up TinyMCE's automatic empty paragraphs first
    let cleanHtml = html
      // Remove empty paragraphs with just <br> tags that TinyMCE inserts
      .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '')
      // Remove empty paragraphs
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      // Remove standalone <br> tags between block elements
      .replace(/(<\/(?:h[1-6]|ul|ol|li)>)\s*<br\s*\/?>\s*(<(?:h[1-6]|ul|ol|li|p))/gi, '$1\n$2')
    
    // Convert HTML to markdown to preserve formatting
    let markdownText = cleanHtml
      // Convert HTML bold to markdown
      .replace(/<\/?strong>/gi, '**')
      .replace(/<\/?b>/gi, '**')
      // Convert HTML italic to markdown
      .replace(/<\/?em>/gi, '*')
      .replace(/<\/?i>/gi, '*')
      // Convert HTML underline to markdown
      .replace(/<u>/gi, '<u>').replace(/<\/u>/gi, '</u>')
      // Convert HTML strikethrough to markdown
      .replace(/<\/?s>/gi, '~~')
      .replace(/<\/?strike>/gi, '~~')
      // Convert HTML headings to markdown
      .replace(/<h1[^>]*>/gi, '# ').replace(/<\/h1>/gi, '\n')
      .replace(/<h2[^>]*>/gi, '## ').replace(/<\/h2>/gi, '\n')
      .replace(/<h3[^>]*>/gi, '### ').replace(/<\/h3>/gi, '\n')
      // Convert HTML lists to markdown
      .replace(/<ul[^>]*>/gi, '').replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '').replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ').replace(/<\/li>/gi, '\n')
      // Convert paragraphs and line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace more aggressively
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Max 2 consecutive newlines
      .replace(/\n\s+/g, '\n') // Remove spaces at beginning of lines
      .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
      .replace(/^\s+|\s+$/g, '') // Trim start and end
    
    if (!markdownText) {
      markdownText = ''
    }
    
    return createLexicalState(markdownText)
  } catch (error) {
    console.error('HTML to Lexical conversion error:', error)
    return createLexicalState('')
  }
}


// AI Processing functionality
const handleAiProcess = async () => {
  if (!editContent.value.trim()) return
  
  isAiProcessing.value = true
  originalContent.value = editContent.value
  
  try {
    const processedContent = await processTextWithAi(editContent.value, props.userSettings)
    editContent.value = processedContent
    
    // Update HTML content for TinyMCE (this will trigger v-model update)
    const htmlContent = convertContentToHtml(processedContent)
    editorHtmlContent.value = htmlContent
    
    canUndo.value = true
    aiProcessCount.value++
  } catch (error) {
    console.error('AI processing error:', error)
    alert(error.message || 'AI processing fejlede')
  } finally {
    isAiProcessing.value = false
  }
}

const handleUndo = () => {
  if (!canUndo.value || !originalContent.value) return
  
  editContent.value = originalContent.value
  
  // Update HTML content for TinyMCE (this will trigger v-model update)
  const htmlContent = convertContentToHtml(originalContent.value)
  editorHtmlContent.value = htmlContent
  
  canUndo.value = false
  aiProcessCount.value++
}

const resetAiState = () => {
  canUndo.value = false
  originalContent.value = ''
  isAiProcessing.value = false
}

watch(() => props.note, (newNote) => {
  if (newNote) {
    editTitle.value = newNote.title
    editContent.value = newNote.content
    editorHtmlContent.value = convertContentToHtml(newNote.content)
    isEditing.value = false
    resetAiState()
    aiProcessCount.value = 0
  }
}, { immediate: true })

watch(isEditing, (editing) => {
  if (editing) {
    // Initialize HTML content for TinyMCE when starting edit
    const htmlContent = convertContentToHtml(editContent.value)
    editorHtmlContent.value = htmlContent
  } else {
    resetAiState()
  }
})

// Watch for changes in HTML content from TinyMCE and convert to Lexical
watch(editorHtmlContent, (newHtml) => {
  if (isEditing.value && newHtml) {
    editContent.value = convertHtmlToLexical(newHtml)
  }
})

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editTitle.value = props.note.title
  editContent.value = props.note.content
  const htmlContent = convertContentToHtml(props.note.content)
  editorHtmlContent.value = htmlContent
  
  resetAiState()
}

const handleSave = async () => {
  if (editTitle.value.trim() && editContent.value.trim()) {
    const success = await emit('update', props.note.id, editTitle.value.trim(), editContent.value.trim())
    if (success) {
      isEditing.value = false
      resetAiState()
    }
  }
}

const handleDelete = () => {
  confirmDialog.value = { isOpen: true }
}

const handleConfirmDelete = async () => {
  const success = await emit('delete', props.note.id)
  if (success) {
    emit('close')
  }
  confirmDialog.value = { isOpen: false }
}

const handleCancelDelete = () => {
  confirmDialog.value = { isOpen: false }
}

const formatDate = (date, includeTime = false) => {
  if (!date) return ''
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
  
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return new Date(date).toLocaleDateString('da-DK', options)
}

onBeforeUnmount(() => {
  // TinyMCE automatically handles cleanup
})
</script>