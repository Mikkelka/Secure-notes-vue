<template>
  <div class="space-y-4">
    <!-- Header with date and copy button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-gray-400 text-sm">
        <Clock class="icon-sm" />
        {{ formatDate(createdAt, true) }}
      </div>
      <CopyTextButton :html-content="sanitizedContent" />
    </div>
    
    <!-- Content display -->
    <div class="max-w-none">
      <div 
        class="text-gray-300 leading-relaxed prose-content"
        :class="isMobile ? 'text-base' : 'text-sm'"
        v-html="sanitizedContent"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Clock } from 'lucide-vue-next'
import CopyTextButton from '../../base/CopyTextButton.vue'
import { sanitizeNoteContent } from '../../../utils/sanitizeHtml.js'

const _props = defineProps({
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: [Date, Object], // Firebase Timestamp
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const sanitizedContent = computed(() => sanitizeNoteContent(_props.content))

// Date formatting utility
const formatDate = (date, includeTime = false) => {
  if (!date) return 'Unknown'
  
  // Handle Firebase Timestamp
  const jsDate = date.toDate ? date.toDate() : new Date(date)
  
  const now = new Date()
  const diffMs = now - jsDate
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    // Today
    if (includeTime) {
      return jsDate.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    return 'I dag'
  } else if (diffDays === 1) {
    // Yesterday
    if (includeTime) {
      return `I går ${jsDate.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    }
    return 'I går'
  } else if (diffDays < 7) {
    // Within a week
    const weekday = jsDate.toLocaleDateString('da-DK', { weekday: 'long' })
    if (includeTime) {
      return `${weekday} ${jsDate.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    }
    return weekday
  } else {
    // Older than a week
    if (includeTime) {
      return jsDate.toLocaleDateString('da-DK', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }) + ' ' + jsDate.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    return jsDate.toLocaleDateString('da-DK', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }
}
</script>
