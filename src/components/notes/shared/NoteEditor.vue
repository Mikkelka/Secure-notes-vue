<template>
  <div class="h-full flex flex-col space-y-4 pb-4">
    <!-- Title Input -->
    <input
      v-model="localTitle"
      type="text"
      :class="isMobile ? 'input-small' : 'input-small text-sm'"
      placeholder="Title..."
      @input="$emit('titleChange', localTitle)"
    />
    
    <!-- TinyMCE Editor -->
    <div class="tinymce-wrapper flex-1">
      <editor
        tinymce-script-src="/tinymce/tinymce.min.js"
        license-key="gpl"
        v-model="localContent"
        :init="getTinymceConfig()"
        @input="handleContentChange"
        @node-change="handleContentChange"
        @exec-command="handleContentChange"
        @format-apply="handleContentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import { debounceVue } from '../../../utils/debounce.js'


const props = defineProps({
  initialTitle: {
    type: String,
    default: ''
  },
  initialContent: {
    type: String,
    default: ''
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['titleChange', 'contentChange'])

// Local reactive data
const localTitle = ref(props.initialTitle)
const localContent = ref(props.initialContent)

// Watch for prop changes (when switching notes)
watch(() => props.initialTitle, (newTitle) => {
  localTitle.value = newTitle
})

watch(() => props.initialContent, (newContent) => {
  localContent.value = newContent
})

// TinyMCE Configuration (isolated from main component)
const getTinymceConfig = () => {
  const config = {
    // License key now handled by component prop
    // Fill 100% height of container
    height: '100%',
    resize: false,
    menubar: false,
    statusbar: false,
    branding: false,
    plugins: 'lists link autolink',
    toolbar: 'undo redo | formatselect | h1 h2 h3 | bold italic underline strikethrough | bullist | link',
    formats: {
      h1: { block: 'h1' },
      h2: { block: 'h2' },
      h3: { block: 'h3' }
    },
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3',
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #d1d5db; background-color: #374151; padding: 0; height: 100%; box-sizing: border-box; } p { margin: 0.5em 0; } h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem 0; line-height: 1.2; color: #ffffff; } h2 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem 0; line-height: 1.3; color: #ffffff; } h3 { font-size: 1.125rem; font-weight: 600; margin: 0.5rem 0 0.5rem 0; line-height: 1.4; color: #ffffff; }',
    skin: 'oxide-dark',
    content_css: 'dark',
    // Default paragraph wrapping for proper structure
    forced_root_block: 'p',
    keep_styles: false,
    remove_trailing_brs: false,
    convert_urls: false,
    element_format: 'html',
    valid_elements: 'p,h1,h2,h3,strong,em,u,strike,ul,ol,li,br,a[href]',
    extended_valid_elements: 'h1,h2,h3',
    verify_html: false,
    cleanup: false,
    // Disable analytics and tracking
    analytics: false,
    usage_tracking: false,
    telemetry: false,
    // Reduce touch sensitivity warnings
    touch_ui: false,
    // Disable automatic updates
    auto_update: false,
    // Setup callback to ensure format changes trigger events
    setup: (editor) => {
      editor.on('NodeChange FormatApply ExecCommand', () => {
        // Force v-model update on format changes (TinyMCE 7.0 compatible)
        editor.dispatch('input')
      })
    }
  }
  console.log('🔧 NoteEditor TinyMCE config:', config)
  return config
}

// Handle content changes and emit to parent (debounced for performance)
const handleContentChange = debounceVue(() => {
  emit('contentChange', localContent.value)
}, 300)

// Expose methods for parent component
defineExpose({
  getTitle: () => localTitle.value,
  getContent: () => localContent.value,
  setTitle: (title) => { localTitle.value = title },
  setContent: (content) => { localContent.value = content },
  isValid: () => localTitle.value.trim() && localContent.value.trim()
})
</script>

<style scoped>
.tinymce-wrapper {
  /* Ensure TinyMCE fills available space */
  min-height: 200px;
}
</style>