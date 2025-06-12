<template>
  <div class="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
    <h3 class="text-white font-medium mb-3">Ny note</h3>
    
    <div class="space-y-3">
      <input
        v-model="title"
        type="text"
        placeholder="Titel..."
        class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
      />
      
      <textarea
        v-model="content"
        :rows="isCompact ? 4 : 8"
        placeholder="Skriv din note her..."
        class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none"
      />
      
      <BaseButton
        :disabled="!title.trim() || !content.trim()"
        @click="handleSave"
        variant="primary"
        size="sm"
      >
        <Save class="w-4 h-4" />
        Gem note
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Save } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  isCompact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save'])

const title = ref('')
const content = ref('')

const handleSave = async () => {
  if (title.value.trim() && content.value.trim()) {
    const success = await emit('save', title.value.trim(), content.value.trim())
    if (success) {
      title.value = ''
      content.value = ''
    }
  }
}
</script>