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
        api-key="xops5w4mc9duaby9p8f4vhe2n689r11fauo9m5xbmb3k2grb"
        v-model="localContent"
        :init="getTinymceConfig()"
        @input="handleContentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Editor from '@tinymce/tinymce-vue'

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
  return {
    // Fill 100% height of container
    height: '100%',
    resize: false,
    menubar: false,
    statusbar: false,
    branding: false,
    plugins: 'lists link autolink',
    toolbar: 'undo redo | h1 h2 h3 | bold italic underline strikethrough | bullist | link',
    formats: {
      h1: { block: 'h1' },
      h2: { block: 'h2' },
      h3: { block: 'h3' }
    },
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3',
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #d1d5db; background-color: #374151; padding: 0; height: 100%; box-sizing: border-box; } p { margin: 0.5em 0; }',
    skin: 'oxide-dark',
    content_css: 'dark',
    // Disable analytics and tracking
    analytics: false,
    usage_tracking: false,
    telemetry: false,
    // Reduce touch sensitivity warnings
    touch_ui: false,
    // Disable automatic updates
    auto_update: false
  }
}

// Handle content changes and emit to parent
const handleContentChange = () => {
  emit('contentChange', localContent.value)
}

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