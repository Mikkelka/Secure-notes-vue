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
        <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
          <h2 class="text-lg font-semibold text-white truncate flex-1 mr-2">
            {{ isEditing ? 'Edit Note' : note.title }}
          </h2>
          <div class="flex items-center gap-2">
            <span 
              ref="folderLabelRef"
              @click="handleFolderLabelClick"
              class="px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity touch-manipulation"
              :style="{
                backgroundColor: getFolderDisplay(note.folderId).color + '20',
                borderColor: getFolderDisplay(note.folderId).color + '40',
                color: getFolderDisplay(note.folderId).color
              }"
            >
              <Folder class="w-3 h-3" />
              {{ getFolderDisplay(note.folderId).name }}
            </span>
            
            <!-- Mobile Menu Button -->
            <div class="relative">
              <BaseButton
                @click="showMobileMenu = !showMobileMenu"
                variant="ghost"
                size="sm"
                class="text-gray-400 hover:text-white p-2"
              >
                <MoreVertical class="w-4 h-4" />
              </BaseButton>
              
              <!-- Mobile Menu Dropdown -->
              <div
                v-if="showMobileMenu"
                class="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden min-w-[160px]"
              >
                <button
                  v-if="!isEditing"
                  @click="$emit('toggleFavorite', note.id); showMobileMenu = false"
                  class="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
                  :class="note.isFavorite ? 'text-yellow-400' : 'text-gray-300'"
                >
                  <Star 
                    :class="note.isFavorite ? 'fill-yellow-400' : 'fill-none'" 
                    class="w-4 h-4" 
                  />
                  {{ note.isFavorite ? 'Fjern favorit' : 'Tilføj favorit' }}
                </button>
                <button
                  v-if="!isEditing"
                  @click="handleDelete; showMobileMenu = false"
                  class="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-400"
                >
                  <Trash2 class="w-4 h-4" />
                  Slet note
                </button>
                <button
                  @click="$emit('close'); showMobileMenu = false"
                  class="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-300"
                >
                  <X class="w-4 h-4" />
                  Luk
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mobile Menu Backdrop -->
        <div
          v-if="showMobileMenu"
          @click="showMobileMenu = false"
          class="fixed inset-0 z-40"
        ></div>

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
                :init="getTinymceConfig()"
              />
            </div>
            <div class="space-y-3">
              <!-- AI and Undo buttons -->
              <div class="flex gap-2">
                <div class="flex-1">
                  <AiInstructionDropdown
                    @process="handleAiProcess"
                    @instruction-changed="handleInstructionChanged"
                    :is-processing="isAiProcessing"
                    :disabled="!editContent.trim()"
                    :user-settings="props.userSettings"
                    :content="editContent"
                  />
                </div>
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
                v-html="note.content"
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
        <div class="flex items-center">
          <span 
            ref="folderLabelRef"
            @click="handleFolderLabelClick"
            class="px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
            :style="{
              backgroundColor: getFolderDisplay(note.folderId).color + '20',
              borderColor: getFolderDisplay(note.folderId).color + '40',
              color: getFolderDisplay(note.folderId).color
            }"
          >
            <Folder class="w-3 h-3" />
            {{ getFolderDisplay(note.folderId).name }}
          </span>
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
              :init="getTinymceConfig()"
            />
          </div>
          <div class="space-y-2">
            <!-- AI and Undo buttons -->
            <div class="flex gap-2">
              <div class="flex-1">
                <AiInstructionDropdown
                  @process="handleAiProcess"
                  @instruction-changed="handleInstructionChanged"
                  :is-processing="isAiProcessing"
                  :disabled="!editContent.trim()"
                  :user-settings="props.userSettings"
                  :content="editContent"
                />
              </div>
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
              v-html="note.content"
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
  
  <!-- Folder Dropdown -->
  <FolderDropdown
    v-if="note"
    :current-folder-id="note.folderId"
    :available-folders="foldersStore.folders"
    :locked-folders="foldersStore.lockedFolders"
    :is-open="showDropdown"
    :position="dropdownPosition"
    @select="handleFolderSelect"
    @close="closeDropdown"
  />
  
  <!-- Confirm Dialog -->
  <BaseDialog
    :is-open="confirmDialog.isOpen"
    title="Slet note"
    show-default-actions
    confirm-text="Slet"
    cancel-text="Annuller"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
    @close="handleCancelDelete"
  >
    Er du sikker på at du vil slette denne note? Denna handling kan ikke fortrydes.
  </BaseDialog>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { Star, Trash2, X, Save, Edit3, Clock, Undo, Folder, MoreVertical } from 'lucide-vue-next'
import Editor from '@tinymce/tinymce-vue'
import BaseButton from '../base/BaseButton.vue'
import BaseDialog from '../base/BaseDialog.vue'
import FolderDropdown from '../folders/FolderDropdown.vue'
import AiInstructionDropdown from '../ai/AiInstructionDropdown.vue'
import { processTextWithAi } from '../../services/aiService.js'
import { useFoldersStore } from '../../stores/folders.js'

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

const emit = defineEmits(['close', 'update', 'delete', 'toggleFavorite', 'moveNoteToFolder'])

const isEditing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const confirmDialog = ref({ isOpen: false })
const isAiProcessing = ref(false)
const aiProcessCount = ref(0)
const originalContent = ref('')
const canUndo = ref(false)
const currentInstruction = ref('note-organizer')

// Folders store for folder information
const foldersStore = useFoldersStore()

// Dropdown state
const showDropdown = ref(false)
const dropdownPosition = ref({ top: 0, left: 0 })
const folderLabelRef = ref(null)
const showMobileMenu = ref(false)


// TinyMCE editor content for editing
const editorHtmlContent = ref('')

// TinyMCE configuration
const getTinymceConfig = () => {
  const isMobileView = window.innerWidth < 1024
  const viewportHeight = window.innerHeight
  
  return {
    // Responsive height configuration
    min_height: isMobileView ? 150 : 200,
    max_height: Math.min(viewportHeight * (isMobileView ? 0.6 : 0.7), isMobileView ? 500 : 800),
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
    // Disable analytics and tracking
    analytics: false,
    usage_tracking: false,
    telemetry: false,
    // Reduce touch sensitivity warnings
    touch_ui: false,
    // Disable automatic updates
    auto_update: false,
    // Auto resize options
    autoresize_bottom_margin: 16,
    autoresize_overflow_padding: 0
  }
}




// AI Processing functionality
const handleAiProcess = async () => {
  if (!editContent.value.trim()) return
  
  isAiProcessing.value = true
  originalContent.value = editContent.value
  
  try {
    // Create userSettings with current instruction override
    const settingsWithInstruction = {
      ...props.userSettings,
      aiSettings: {
        ...props.userSettings?.aiSettings,
        selectedInstruction: currentInstruction.value
      }
    }
    
    const processedContent = await processTextWithAi(editContent.value, settingsWithInstruction)
    editContent.value = processedContent
    
    // Update HTML content for TinyMCE directly
    editorHtmlContent.value = processedContent
    
    canUndo.value = true
    aiProcessCount.value++
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

const handleUndo = () => {
  if (!canUndo.value || !originalContent.value) return
  
  editContent.value = originalContent.value
  
  // Update HTML content for TinyMCE directly
  editorHtmlContent.value = originalContent.value
  
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
    editorHtmlContent.value = newNote.content
    isEditing.value = false
    resetAiState()
    aiProcessCount.value = 0
  }
}, { immediate: true })

watch(isEditing, (editing) => {
  if (editing) {
    // Initialize HTML content for TinyMCE when starting edit
    editorHtmlContent.value = editContent.value
  } else {
    resetAiState()
  }
})

// Watch for changes in HTML content from TinyMCE
watch(editorHtmlContent, (newHtml) => {
  if (isEditing.value && newHtml) {
    editContent.value = newHtml
  }
})

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editTitle.value = props.note.title
  editContent.value = props.note.content
  editorHtmlContent.value = props.note.content
  
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

// Get folder display info (name and color)
const getFolderDisplay = (folderId) => {
  if (!folderId) {
    return { name: 'Ukategoriseret', color: '#6b7280' }
  }
  
  if (folderId === 'secure') {
    return { name: 'Sikker', color: '#dc2626' }
  }
  
  const folder = foldersStore.folders.find(f => f.id === folderId)
  if (folder) {
    return { name: folder.name, color: folder.color }
  }
  
  return { name: 'Ukategoriseret', color: '#6b7280' }
}

// Check if we're on mobile
const isMobile = computed(() => window.innerWidth < 1024)

// Handle folder label click to open dropdown
const handleFolderLabelClick = (event) => {
  event.stopPropagation()
  
  if (showDropdown.value) {
    showDropdown.value = false
    return
  }
  
  // Calculate dropdown position
  if (folderLabelRef.value) {
    const rect = folderLabelRef.value.getBoundingClientRect()
    
    if (isMobile.value) {
      // Center dropdown on mobile screen for better UX
      dropdownPosition.value = {
        top: window.innerHeight / 2 - 150, // Center vertically
        left: window.innerWidth / 2 - 120  // Center horizontally
      }
    } else {
      // Standard positioning for desktop
      dropdownPosition.value = {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      }
    }
  }
  
  showDropdown.value = true
}

// Handle folder selection from dropdown
const handleFolderSelect = (newFolderId) => {
  showDropdown.value = false
  emit('moveNoteToFolder', props.note.id, newFolderId)
}

// Close dropdown
const closeDropdown = () => {
  showDropdown.value = false
}

onBeforeUnmount(() => {
  // TinyMCE automatically handles cleanup
})
</script>

<style scoped>
/* Links */
.prose-content :deep(a) {
  color: #60a5fa;
  text-decoration: underline;
  text-decoration-color: rgba(96, 165, 250, 0.5);
  transition: color 0.2s ease;
}

.prose-content :deep(a:hover) {
  color: #93c5fd;
  text-decoration-color: rgba(147, 197, 253, 0.75);
}

.prose-content :deep(a:visited) {
  color: #c084fc;
  text-decoration-color: rgba(192, 132, 252, 0.5);
}

.prose-content :deep(a:visited:hover) {
  color: #d8b4fe;
  text-decoration-color: rgba(216, 180, 254, 0.75);
}

/* Headings */
.prose-content :deep(h1) {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1.5rem 0 1rem 0;
  color: #f9fafb;
}

.prose-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 1.25rem 0 0.75rem 0;
  color: #f3f4f6;
}

.prose-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 1rem 0 0.5rem 0;
  color: #e5e7eb;
}

/* Text formatting */
.prose-content :deep(strong),
.prose-content :deep(b) {
  font-weight: 700;
  color: #f9fafb;
}

.prose-content :deep(em),
.prose-content :deep(i) {
  font-style: italic;
}

.prose-content :deep(u),
.prose-content :deep(span[style*="text-decoration: underline"]),
.prose-content :deep([style*="text-decoration-line: underline"]) {
  text-decoration: underline !important;
  text-decoration-color: #d1d5db !important;
  text-decoration-thickness: 1px !important;
}

.prose-content :deep(s),
.prose-content :deep(strike),
.prose-content :deep(span[style*="text-decoration: line-through"]),
.prose-content :deep([style*="text-decoration-line: line-through"]) {
  text-decoration: line-through !important;
  text-decoration-color: #d1d5db !important;
  text-decoration-thickness: 1px !important;
}

/* Lists */
.prose-content :deep(ul) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.prose-content :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.prose-content :deep(ul li) {
  list-style-type: disc;
}

/* Paragraphs */
.prose-content :deep(p) {
  margin: 0.75rem 0;
  line-height: 1.6;
}

.prose-content :deep(p:first-child) {
  margin-top: 0;
}

.prose-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* Mobile touch optimization */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Mobile action buttons optimization */
@media (max-width: 1024px) {
  .mobile-action-button {
    min-height: 44px; /* Adequate touch targets for mobile */
    min-width: 44px;
  }
}
</style>