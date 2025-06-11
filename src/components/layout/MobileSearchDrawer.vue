<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 md:hidden"
      >
        <div class="absolute inset-0 bg-black/50" @click="$emit('close')" />
        <Transition
          enter-active-class="duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div
            v-if="isOpen"
            class="absolute bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur rounded-t-2xl border-t border-gray-700/50 h-32"
          >
            <div class="p-4">
              <div class="flex items-center gap-3 mb-3">
                <Search class="w-5 h-5 text-gray-400" />
                <input
                  ref="searchInput"
                  :value="searchTerm"
                  @input="$emit('searchChange', $event.target.value)"
                  type="text"
                  placeholder="Søg i noter..."
                  class="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="$emit('close')"
                >
                  <X class="w-5 h-5" />
                </BaseButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Search, X } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  searchTerm: {
    type: String,
    default: ''
  }
})

defineEmits(['close', 'searchChange'])

const searchInput = ref(null)

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>