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
            <div class="relative w-full bg-gray-700/50 border border-gray-600/50 rounded text-white focus-within:ring-1 focus-within:ring-gray-500 transition-all text-sm min-h-96">
              <!-- Toolbar -->
              <div class="flex items-center gap-1 p-3 border-b border-gray-600/50 flex-wrap">
                <!-- Text formatting -->
                <button
                  @click="() => editor?.chain().focus().toggleBold().run()"
                  :class="editor?.isActive('bold') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Bold (Ctrl+B)"
                >
                  <Bold class="w-4 h-4" />
                </button>
                <button
                  @click="() => editor?.chain().focus().toggleItalic().run()"
                  :class="editor?.isActive('italic') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Italic (Ctrl+I)"
                >
                  <Italic class="w-4 h-4" />
                </button>
                <button
                  @click="() => editor?.chain().focus().toggleUnderline().run()"
                  :class="editor?.isActive('underline') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Underline (Ctrl+U)"
                >
                  <Underline class="w-4 h-4" />
                </button>
                <button
                  @click="() => editor?.chain().focus().toggleStrike().run()"
                  :class="editor?.isActive('strike') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Strikethrough"
                >
                  <Strikethrough class="w-4 h-4" />
                </button>
                
                <div class="w-px h-6 bg-gray-600/50 mx-1" />
                
                <!-- Headings -->
                <button
                  @click="() => editor?.chain().focus().toggleHeading({ level: 1 }).run()"
                  :class="editor?.isActive('heading', { level: 1 }) ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Heading 1"
                >
                  <Heading1 class="w-4 h-4" />
                </button>
                <button
                  @click="() => editor?.chain().focus().toggleHeading({ level: 2 }).run()"
                  :class="editor?.isActive('heading', { level: 2 }) ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Heading 2"
                >
                  <Heading2 class="w-4 h-4" />
                </button>
                
                <div class="w-px h-6 bg-gray-600/50 mx-1" />
                
                <!-- Lists -->
                <button
                  @click="() => editor?.chain().focus().toggleBulletList().run()"
                  :class="editor?.isActive('bulletList') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Bullet List"
                >
                  <List class="w-4 h-4" />
                </button>
                <button
                  @click="() => editor?.chain().focus().toggleOrderedList().run()"
                  :class="editor?.isActive('orderedList') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                  class="flex-shrink-0 p-2 rounded transition-colors"
                  title="Numbered List"
                >
                  <ListOrdered class="w-4 h-4" />
                </button>
                
                <div class="w-px h-6 bg-gray-600/50 mx-1" />
                
                <!-- Undo/Redo -->
                <button
                  @click="() => editor?.chain().focus().undo().run()"
                  :disabled="!editor?.can().undo()"
                  class="flex-shrink-0 p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-gray-600/50"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo class="w-4 h-4" />
                </button>
                <button
                  @click="() => editor?.chain().focus().redo().run()"
                  :disabled="!editor?.can().redo()"
                  class="flex-shrink-0 p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-gray-600/50"
                  title="Redo (Ctrl+Y)"
                >
                  <Undo class="w-4 h-4 rotate-180" />
                </button>
              </div>
              <!-- Editor -->
              <EditorContent 
                :editor="editor" 
                class="px-3 py-2 min-h-48 text-gray-300 text-sm"
                style="color: #d1d5db !important;"
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
              <!-- Direct HTML rendering instead of TipTap -->
              <div 
                class="text-gray-300 text-base leading-relaxed prose-content"
                v-html="convertLexicalToHtml(note.content)"
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
          <div class="relative w-full bg-gray-700/50 border border-gray-600/50 rounded text-white focus-within:ring-1 focus-within:ring-gray-500 transition-all text-sm min-h-96">
            <!-- Toolbar -->
            <div class="flex items-center gap-1 p-3 border-b border-gray-600/50 flex-wrap">
              <!-- Text formatting -->
              <button
                @click="() => editor?.chain().focus().toggleBold().run()"
                :class="editor?.isActive('bold') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Bold (Ctrl+B)"
              >
                <Bold class="w-4 h-4" />
              </button>
              <button
                @click="() => editor?.chain().focus().toggleItalic().run()"
                :class="editor?.isActive('italic') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Italic (Ctrl+I)"
              >
                <Italic class="w-4 h-4" />
              </button>
              <button
                @click="() => editor?.chain().focus().toggleUnderline().run()"
                :class="editor?.isActive('underline') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Underline (Ctrl+U)"
              >
                <Underline class="w-4 h-4" />
              </button>
              <button
                @click="() => editor?.chain().focus().toggleStrike().run()"
                :class="editor?.isActive('strike') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Strikethrough"
              >
                <Strikethrough class="w-4 h-4" />
              </button>
              
              <div class="w-px h-6 bg-gray-600/50 mx-1" />
              
              <!-- Headings -->
              <button
                @click="() => editor?.chain().focus().toggleHeading({ level: 1 }).run()"
                :class="editor?.isActive('heading', { level: 1 }) ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Heading 1"
              >
                <Heading1 class="w-4 h-4" />
              </button>
              <button
                @click="() => editor?.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="editor?.isActive('heading', { level: 2 }) ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Heading 2"
              >
                <Heading2 class="w-4 h-4" />
              </button>
              
              <div class="w-px h-6 bg-gray-600/50 mx-1" />
              
              <!-- Lists -->
              <button
                @click="() => editor?.chain().focus().toggleBulletList().run()"
                :class="editor?.isActive('bulletList') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Bullet List"
              >
                <List class="w-4 h-4" />
              </button>
              <button
                @click="() => editor?.chain().focus().toggleOrderedList().run()"
                :class="editor?.isActive('orderedList') ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'"
                class="flex-shrink-0 p-2 rounded transition-colors"
                title="Numbered List"
              >
                <ListOrdered class="w-4 h-4" />
              </button>
              
              <div class="w-px h-6 bg-gray-600/50 mx-1" />
              
              <!-- Undo/Redo -->
              <button
                @click="() => editor?.chain().focus().undo().run()"
                :disabled="!editor?.can().undo()"
                class="flex-shrink-0 p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-gray-600/50"
                title="Undo (Ctrl+Z)"
              >
                <Undo class="w-4 h-4" />
              </button>
              <button
                @click="() => editor?.chain().focus().redo().run()"
                :disabled="!editor?.can().redo()"
                class="flex-shrink-0 p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-gray-600/50"
                title="Redo (Ctrl+Y)"
              >
                <Undo class="w-4 h-4 rotate-180" />
              </button>
            </div>
            <!-- Editor -->
            <EditorContent 
              :editor="editor" 
              class="px-3 py-2 min-h-48 text-gray-300 text-sm"
              style="color: #d1d5db !important;"
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
            <!-- Direct HTML rendering instead of TipTap -->
            <div 
              class="text-gray-300 text-sm leading-relaxed prose-content"
              v-html="convertLexicalToHtml(note.content)"
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
import { Star, Trash2, X, Save, Edit3, Clock, Bold, Italic, List, Heading1, Heading2, Brain, Undo, Underline, Strikethrough, ListOrdered } from 'lucide-vue-next'
import { Editor } from '@tiptap/vue-3'
import { EditorContent } from '@tiptap/vue-3'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import BoldExtension from '@tiptap/extension-bold'
import ItalicExtension from '@tiptap/extension-italic'
import UnderlineExtension from '@tiptap/extension-underline'
import StrikeExtension from '@tiptap/extension-strike'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import History from '@tiptap/extension-history'
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

// TipTap editor instances
const editor = ref(null)
const viewerEditor = ref(null)

// Convert Lexical content to HTML for TipTap
const convertLexicalToHtml = (content) => {
  console.log('Converting content:', content)
  
  if (!content) {
    console.log('No content provided')
    return '<p>No content available</p>'
  }
  
  if (isLexicalContent(content)) {
    try {
      const parsed = JSON.parse(content)
      console.log('Parsed Lexical:', parsed)
      
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
      
      const html = parsed.root?.children?.map(convertNode).join('') || '<p>Empty content</p>'
      console.log('Converted HTML:', html)
      return html
    } catch (error) {
      console.error('Lexical conversion error:', error)
      return `<p>${content}</p>`
    }
  }
  
  const html = content.replace(/\n/g, '<br>')
  console.log('Plain text converted:', html)
  return html ? `<p>${html}</p>` : '<p>No content</p>'
}

// Convert HTML back to Lexical format
const convertHtmlToLexical = (html) => {
  if (!html) return ''
  
  try {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    const root = {
      children: [],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
    
    // Parse DOM and convert to Lexical nodes with format context
    const convertNode = (node, formatContext = 0) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent
        if (text && text.trim()) {
          return {
            detail: 0,
            format: formatContext,
            mode: 'normal',
            style: '',
            text: text,
            type: 'text',
            version: 1
          }
        }
        return null
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase()
        
        // Calculate new format context for text formatting
        let newFormatContext = formatContext
        switch (tagName) {
          case 'strong':
          case 'b':
            newFormatContext |= 1 // Bold flag
            break
          case 'em':
          case 'i':
            newFormatContext |= 2 // Italic flag
            break
          case 's':
            newFormatContext |= 4 // Strikethrough flag
            break
          case 'u':
            newFormatContext |= 8 // Underline flag
            break
        }
        
        // Handle different HTML elements
        switch (tagName) {
          case 'p': {
            const pChildren = Array.from(node.childNodes)
              .map(child => convertNode(child, newFormatContext))
              .filter(Boolean)
              .flat()
            
            if (pChildren.length === 0) {
              pChildren.push({
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '',
                type: 'text',
                version: 1
              })
            }
            return {
              children: pChildren,
              direction: null,
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1
            }
          }
            
          case 'h1':
          case 'h2': {
            const hChildren = Array.from(node.childNodes)
              .map(child => convertNode(child, newFormatContext))
              .filter(Boolean)
              .flat()
            return {
              children: hChildren,
              direction: null,
              format: '',
              indent: 0,
              type: 'heading',
              version: 1,
              tag: tagName
            }
          }
            
          case 'ul': {
            const ulChildren = Array.from(node.childNodes)
              .map(child => convertNode(child, formatContext))
              .filter(Boolean)
              .flat()
            return {
              children: ulChildren,
              direction: null,
              format: '',
              indent: 0,
              type: 'list',
              version: 1,
              listType: 'bullet',
              start: 1
            }
          }
            
          case 'ol': {
            const olChildren = Array.from(node.childNodes)
              .map(child => convertNode(child, formatContext))
              .filter(Boolean)
              .flat()
            return {
              children: olChildren,
              direction: null,
              format: '',
              indent: 0,
              type: 'list',
              version: 1,
              listType: 'number',
              start: 1
            }
          }
            
          case 'li': {
            const liChildren = Array.from(node.childNodes)
              .map(child => convertNode(child, formatContext))
              .filter(Boolean)
              .flat()
            return {
              children: liChildren,
              direction: null,
              format: '',
              indent: 0,
              type: 'listitem',
              version: 1,
              value: 1
            }
          }
            
          case 'strong':
          case 'b':
          case 'em':
          case 'i':
          case 'u':
          case 's':
            // These are handled by format context, just process children
            return Array.from(node.childNodes)
              .map(child => convertNode(child, newFormatContext))
              .filter(Boolean)
              .flat()
            
          default:
            // For other tags, just process children
            return Array.from(node.childNodes)
              .map(child => convertNode(child, formatContext))
              .filter(Boolean)
              .flat()
        }
      }
      
      return null
    }
    
    // Process all child nodes
    Array.from(tempDiv.childNodes).forEach(node => {
      const converted = convertNode(node)
      if (converted) {
        if (Array.isArray(converted)) {
          root.children.push(...converted)
        } else {
          root.children.push(converted)
        }
      }
    })
    
    // If no content, add empty paragraph
    if (root.children.length === 0) {
      root.children.push({
        children: [{
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: '',
          type: 'text',
          version: 1
        }],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1
      })
    }
    
    return JSON.stringify({ root })
    
  } catch (error) {
    console.error('HTML to Lexical conversion error:', error)
    // Fallback to simple text
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    return createLexicalState(text)
  }
}

// Initialize editors
const initializeEditor = () => {
  if (editor.value) {
    editor.value.destroy()
  }
  
  const htmlContent = convertLexicalToHtml(editContent.value)
  console.log('Setting editor content:', htmlContent)
  
  editor.value = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      BoldExtension,
      ItalicExtension,
      UnderlineExtension,
      StrikeExtension,
      Heading.configure({
        levels: [1, 2]
      }),
      BulletList,
      OrderedList,
      ListItem,
      Link,
      History
    ],
    content: htmlContent || '<p></p>',
    onUpdate: ({ editor }) => {
      editContent.value = convertHtmlToLexical(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'text-gray-300 leading-relaxed'
      }
    }
  })
}

const initializeViewerEditor = () => {
  if (viewerEditor.value) {
    viewerEditor.value.destroy()
  }
  
  const htmlContent = convertLexicalToHtml(props.note?.content || '')
  console.log('Setting viewer content:', htmlContent)
  
  viewerEditor.value = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      BoldExtension,
      ItalicExtension,
      UnderlineExtension,
      StrikeExtension,
      Heading.configure({
        levels: [1, 2]
      }),
      BulletList,
      OrderedList,
      ListItem,
      Link,
      History
    ],
    content: htmlContent || '<p>No content</p>',
    editable: false,
    editorProps: {
      attributes: {
        class: 'text-gray-300 leading-relaxed'
      }
    }
  })
  
  // Force content update after editor is ready
  setTimeout(() => {
    if (viewerEditor.value && htmlContent) {
      viewerEditor.value.commands.setContent(htmlContent)
      console.log('Force updated viewer content')
    }
  }, 100)
}

// AI Processing functionality
const handleAiProcess = async () => {
  if (!editContent.value.trim()) return
  
  isAiProcessing.value = true
  originalContent.value = editContent.value
  
  try {
    const processedContent = await processTextWithAi(editContent.value, props.userSettings)
    editContent.value = processedContent
    
    // Update editor content
    if (editor.value) {
      editor.value.commands.setContent(convertLexicalToHtml(processedContent))
    }
    
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
  
  // Update editor content
  if (editor.value) {
    editor.value.commands.setContent(convertLexicalToHtml(originalContent.value))
  }
  
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
    isEditing.value = false
    resetAiState()
    aiProcessCount.value = 0
    
    // Reinitialize viewer editor with new content
    initializeViewerEditor()
  }
}, { immediate: true })

watch(isEditing, (editing) => {
  if (editing) {
    // Initialize editor when starting edit
    setTimeout(() => {
      initializeEditor()
    }, 50)
  } else {
    resetAiState()
  }
})

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editTitle.value = props.note.title
  editContent.value = props.note.content
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

onMounted(() => {
  // Small delay to ensure component is fully mounted
  setTimeout(() => {
    initializeViewerEditor()
  }, 50)
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
  if (viewerEditor.value) {
    viewerEditor.value.destroy()
  }
})
</script>