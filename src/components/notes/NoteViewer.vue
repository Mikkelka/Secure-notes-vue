<template>
  <div class="fixed right-0 top-16 bottom-0 w-[40%] bg-gray-800/90 backdrop-blur border-l border-gray-700/50 z-30 hidden md:block">
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h3 class="text-lg font-semibold text-white truncate">{{ note.title }}</h3>
        <div class="flex items-center gap-2">
          <BaseButton
            variant="ghost"
            size="sm"
            @click="$emit('toggleFavorite', note.id)"
            :class="note.isFavorite ? 'text-yellow-400' : ''"
          >
            <Star :class="note.isFavorite ? 'fill-current' : ''" class="w-4 h-4" />
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="handleDelete"
            class="text-red-400"
          >
            <Trash2 class="w-4 h-4" />
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="$emit('close')"
          >
            <X class="w-4 h-4" />
          </BaseButton>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 p-4 overflow-y-auto">
        <div v-if="isEditing" class="space-y-3">
          <input
            v-model="editTitle"
            type="text"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <textarea
            v-model="editContent"
            rows="20"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none"
          />
          <div class="flex gap-2">
            <BaseButton
              @click="handleSave"
              variant="primary"
              size="sm"
            >
              <Save class="w-4 h-4" />
              Gem
            </BaseButton>
            <BaseButton
              @click="cancelEdit"
              variant="secondary"
              size="sm"
            >
              Annuller
            </BaseButton>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="prose prose-invert max-w-none">
            <pre class="whitespace-pre-wrap text-gray-300">{{ note.content }}</pre>
          </div>
          <BaseButton
            @click="startEdit"
            variant="secondary"
            size="sm"
          >
            <Edit class="w-4 h-4" />
            Rediger
          </BaseButton>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-700/50 text-xs text-gray-500">
        <div>Oprettet: {{ formatDate(note.createdAt) }}</div>
        <div>Opdateret: {{ formatDate(note.updatedAt) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Star, Trash2, X, Save, Edit } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

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

watch(() => props.note, (newNote) => {
  if (newNote) {
    editTitle.value = newNote.title
    editContent.value = newNote.content
  }
}, { immediate: true })

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editTitle.value = props.note.title
  editContent.value = props.note.content
}

const handleSave = async () => {
  if (editTitle.value.trim() && editContent.value.trim()) {
    const success = await emit('update', props.note.id, editTitle.value.trim(), editContent.value.trim())
    if (success) {
      isEditing.value = false
    }
  }
}

const handleDelete = async () => {
  if (confirm('Er du sikker på at du vil slette denne note?')) {
    await emit('delete', props.note.id)
  }
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