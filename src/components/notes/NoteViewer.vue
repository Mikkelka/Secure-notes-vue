<template>
  <div v-if="note">
    <!-- Mobile Layout -->
    <MobileNoteLayout @close="$emit('close')">
      <!-- Mobile Header -->
      <template #header>
        <NoteHeader
          :note="note"
          :is-editing="isEditing"
          is-mobile
          @folder-label-click="handleFolderLabelClick"
        />
      </template>

      <!-- Mobile Content -->
      <template #content>
        <NoteEditor
          v-if="isEditing"
          ref="editorRef"
          :initial-title="editTitle"
          :initial-content="editContent"
          is-mobile
          @title-change="editTitle = $event"
          @content-change="handleContentChange"
        />
        <NoteContent
          v-else
          :content="note.content"
          :created-at="note.createdAt"
          is-mobile
        />
      </template>

      <!-- Mobile Actions -->
      <template #actions>
        <!-- Editing Actions -->
        <AiPanel
          v-if="isEditing"
          :content="editContent"
          :title="editTitle"
          :user-settings="userSettings"
          :is-valid="!!(editTitle.trim() && editContent.trim())"
          is-mobile
          @save="handleSave"
          @cancel="cancelEdit"
          @content-update="handleAiContentUpdate"
        />
        
        <!-- View Actions -->
        <div v-else class="note-actions-container">
          <div class="note-actions-mobile">
            <BaseButton
              @click="startEdit"
              variant="ghost"
              size="sm"
              class="note-action-btn-mobile note-action-edit-mobile"
            >
              <Edit3 class="w-5 h-5" />
            </BaseButton>
            <BaseButton
              @click="$emit('toggleFavorite', note.id)"
              variant="ghost"
              size="sm"
              class="note-action-btn-mobile"
              :class="note.isFavorite ? 'note-action-favorite-mobile-active' : 'note-action-favorite-mobile'"
            >
              <Star 
                :class="note.isFavorite ? 'fill-yellow-400' : 'fill-none'" 
                class="w-5 h-5" 
              />
            </BaseButton>
            <BaseButton
              @click="handleDelete"
              variant="ghost"
              size="sm"
              class="note-action-btn-mobile note-action-delete-mobile"
            >
              <Trash2 class="w-5 h-5" />
            </BaseButton>
            <BaseButton
              @click="$emit('close')"
              variant="ghost"
              size="sm"
              class="note-action-btn-mobile note-action-close-mobile"
            >
              <X class="w-5 h-5" />
            </BaseButton>
          </div>
        </div>
      </template>
    </MobileNoteLayout>

    <!-- Desktop Layout -->
    <DesktopNoteLayout @close="$emit('close')">
      <!-- Desktop Header -->
      <template #header>
        <NoteHeader
          :note="note"
          :is-editing="isEditing"
          :is-mobile="false"
          @folder-label-click="handleFolderLabelClick"
        />
      </template>

      <!-- Desktop Content -->
      <template #content>
        <NoteEditor
          v-if="isEditing"
          ref="editorRef"
          :initial-title="editTitle"
          :initial-content="editContent"
          :is-mobile="false"
          @title-change="editTitle = $event"
          @content-change="handleContentChange"
        />
        <NoteContent
          v-else
          :content="note.content"
          :created-at="note.createdAt"
          :is-mobile="false"
        />
      </template>

      <!-- Desktop Actions -->
      <template #actions>
        <!-- Editing Actions -->
        <AiPanel
          v-if="isEditing"
          :content="editContent"
          :title="editTitle"
          :user-settings="userSettings"
          :is-valid="!!(editTitle.trim() && editContent.trim())"
          :is-mobile="false"
          @save="handleSave"
          @cancel="cancelEdit"
          @content-update="handleAiContentUpdate"
        />
        
        <!-- View Actions -->
        <div v-else class="note-actions-container">
          <div class="note-actions-desktop">
            <BaseButton
              @click="startEdit"
              variant="ghost"
              size="sm"
              class="note-action-btn-desktop note-action-edit"
            >
              <Edit3 class="w-4 h-4" />
              Rediger
            </BaseButton>
            <BaseButton
              @click="$emit('toggleFavorite', note.id)"
              variant="ghost"
              size="sm"
              class="note-action-btn-desktop"
              :class="note.isFavorite ? 'note-action-favorite-active' : 'note-action-favorite'"
            >
              <Star 
                :class="note.isFavorite ? 'fill-yellow-400' : 'fill-none'" 
                class="w-4 h-4" 
              />
              {{ note.isFavorite ? 'Fjern favorit' : 'Favorit' }}
            </BaseButton>
            <BaseButton
              @click="handleDelete"
              variant="ghost"
              size="sm"
              class="note-action-btn-desktop note-action-delete"
            >
              <Trash2 class="w-4 h-4" />
              Slet
            </BaseButton>
            <BaseButton
              @click="$emit('close')"
              variant="ghost"
              size="sm"
              class="note-action-btn-desktop note-action-close"
            >
              <X class="w-4 h-4" />
              Luk
            </BaseButton>
          </div>
        </div>
      </template>
    </DesktopNoteLayout>
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
import { ref, watch } from 'vue'
import { Star, Trash2, X, Edit3 } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'
import BaseDialog from '../base/BaseDialog.vue'
import FolderDropdown from '../folders/FolderDropdown.vue'
import { useFoldersStore } from '../../stores/folders.js'

// Import new component structure
import MobileNoteLayout from './layouts/MobileNoteLayout.vue'
import DesktopNoteLayout from './layouts/DesktopNoteLayout.vue'
import NoteHeader from './shared/NoteHeader.vue'
import NoteContent from './shared/NoteContent.vue'
import NoteEditor from './shared/NoteEditor.vue'
import AiPanel from './shared/AiPanel.vue'

const props = defineProps({
  note: {
    type: Object,
    default: null
  },
  userSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'update', 'delete', 'toggleFavorite', 'moveNoteToFolder'])

// Minimal state management (most logic moved to child components)
const isEditing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const confirmDialog = ref({ isOpen: false })

// Folder management
const foldersStore = useFoldersStore()
const showDropdown = ref(false)
const dropdownPosition = ref({ top: 0, left: 0 })

// Editor reference for accessing child component methods
const editorRef = ref(null)

// Watch for note changes
watch(() => props.note, (newNote) => {
  if (newNote) {
    editTitle.value = newNote.title
    editContent.value = newNote.content
  }
}, { immediate: true })

// Watch editing mode to reset when switching
watch(isEditing, (editing) => {
  if (editing && props.note) {
    editTitle.value = props.note.title
    editContent.value = props.note.content
  }
})

// Editing functionality
const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  if (props.note) {
    editTitle.value = props.note.title
    editContent.value = props.note.content
  }
  isEditing.value = false
}

const handleSave = async () => {
  console.log('💾 NoteViewer - Saving content:', editContent.value)
  emit('update', props.note.id, editTitle.value, editContent.value)
  isEditing.value = false
}

// Content change handler
const handleContentChange = (newContent) => {
  console.log('📝 NoteViewer - Content received:', newContent)
  editContent.value = newContent
}

// AI content update handler
const handleAiContentUpdate = (processedContent) => {
  editContent.value = processedContent
  // Update editor component if needed
  if (editorRef.value) {
    editorRef.value.setContent(processedContent)
  }
}

// Delete functionality
const handleDelete = () => {
  confirmDialog.value.isOpen = true
}

const handleConfirmDelete = async () => {
  emit('delete', props.note.id)
  confirmDialog.value.isOpen = false
}

const handleCancelDelete = () => {
  confirmDialog.value.isOpen = false
}

// Folder functionality
const handleFolderLabelClick = ({ event: _event, position }) => {
  if (showDropdown.value) {
    showDropdown.value = false
    return
  }
  
  dropdownPosition.value = position
  showDropdown.value = true
}

const handleFolderSelect = (newFolderId) => {
  emit('moveNoteToFolder', props.note.id, newFolderId)
  closeDropdown()
}

const closeDropdown = () => {
  showDropdown.value = false
}
</script>