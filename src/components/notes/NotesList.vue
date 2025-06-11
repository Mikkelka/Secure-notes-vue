<template>
  <div class="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 h-full flex flex-col">
    <!-- Search -->
    <div class="mb-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          :value="searchTerm"
          @input="$emit('searchChange', $event.target.value)"
          type="text"
          placeholder="Søg i noter..."
          class="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
    </div>

    <!-- Notes list -->
    <div class="flex-1 overflow-y-auto space-y-2">
      <div v-if="notes.length === 0" class="text-center text-gray-400 py-8">
        <FileText class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Ingen noter fundet</p>
      </div>
      
      <div
        v-for="note in notes"
        :key="note.id"
        :class="[
          'p-3 rounded-lg border cursor-pointer transition-all group',
          selectedNoteId === note.id
            ? 'bg-gray-600 border-gray-500 text-white'
            : 'bg-gray-700/30 border-gray-600/30 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600/50'
        ]"
        @click="$emit('noteClick', note)"
      >
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-medium truncate flex-1">{{ note.title }}</h4>
          <div class="flex items-center gap-1 ml-2">
            <BaseButton
              v-if="note.isFavorite"
              variant="ghost"
              size="sm"
              @click.stop="$emit('toggleFavorite', note.id)"
              class="text-yellow-400"
            >
              <Star class="w-3 h-3 fill-current" />
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              @click.stop="$emit('toggleFavorite', note.id)"
              class="opacity-0 group-hover:opacity-100"
            >
              <Star class="w-3 h-3" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="$emit('deleteNote', note.id)"
              class="opacity-0 group-hover:opacity-100 text-red-400"
            >
              <Trash2 class="w-3 h-3" />
            </BaseButton>
          </div>
        </div>
        <p class="text-sm text-gray-400 line-clamp-2">{{ getPreview(note.content) }}</p>
        <div class="text-xs text-gray-500 mt-2">
          {{ formatDate(note.updatedAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Search, FileText, Star, Trash2 } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  searchTerm: {
    type: String,
    default: ''
  },
  selectedNoteId: {
    type: String,
    default: null
  }
})

defineEmits(['searchChange', 'deleteNote', 'noteClick', 'toggleFavorite'])

const getPreview = (content) => {
  if (!content) return ''
  // Simple text extraction - would be more complex for rich content
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>