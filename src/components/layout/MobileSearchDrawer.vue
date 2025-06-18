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
        class="fixed inset-0 z-40 md:hidden pointer-events-none"
      >
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
            ref="drawerElement"
            class="absolute left-0 right-0 bg-gray-800/95 backdrop-blur rounded-t-2xl border-t border-gray-700/50 h-32 transition-all duration-200 pointer-events-auto"
            :style="{ bottom: keyboardOffset + 'px' }"
          >
            <div class="p-4">
              <div class="flex items-center gap-3 mb-3">
                <Search class="w-5 h-5 text-gray-400" />
                <input
                  ref="searchInput"
                  :value="searchTerm"
                  @input="emit('searchChange', $event.target.value)"
                  type="text"
                  placeholder="Søg i noter..."
                  class="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="emit('close')"
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
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
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

const emit = defineEmits(['close', 'searchChange'])

const searchInput = ref(null)
const drawerElement = ref(null)
const keyboardOffset = ref(0)

// Visual Viewport API til at håndtere keyboard
const handleViewportChange = () => {
  if (window.visualViewport) {
    const viewportHeight = window.visualViewport.height
    const windowHeight = window.innerHeight
    const keyboardHeight = windowHeight - viewportHeight
    keyboardOffset.value = keyboardHeight > 0 ? keyboardHeight : 0
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
      // Reset keyboard offset når drawer åbnes
      handleViewportChange()
    })
  } else {
    keyboardOffset.value = 0
    // Nulstil søgeterm når drawer lukkes så alle noter vises igen
    emit('searchChange', '')
  }
})

onMounted(() => {
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange)
  }
})

onUnmounted(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportChange)
  }
})
</script>