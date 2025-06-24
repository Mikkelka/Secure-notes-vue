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
        class="fixed inset-0 z-[80] flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm lg:items-center overflow-y-auto"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            :class="[
              'bg-gray-800/90 backdrop-blur border border-gray-700/50 rounded-2xl shadow-2xl',
              'max-w-md w-full max-h-[90vh] flex flex-col my-4 lg:my-0',
              sizeClasses
            ]"
            @click.stop
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="px-6 py-4 border-b border-gray-700/50">
              <slot name="header">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
                  <button
                    v-if="showCloseButton"
                    @click="$emit('close')"
                    class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </slot>
            </div>

            <!-- Content -->
            <div class="px-6 py-4 overflow-y-auto text-white flex-1 min-h-0">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer || showDefaultActions" class="px-6 py-4 border-t border-gray-700/50">
              <slot name="footer">
                <div v-if="showDefaultActions" class="flex gap-3 justify-end">
                  <BaseButton
                    variant="secondary"
                    @click="$emit('cancel')"
                  >
                    {{ cancelText }}
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    @click="$emit('confirm')"
                  >
                    {{ confirmText }}
                  </BaseButton>
                </div>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  showCloseButton: {
    type: Boolean,
    default: true
  },
  showDefaultActions: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: 'Bekræft'
  },
  cancelText: {
    type: String,
    default: 'Annuller'
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }
  return sizes[props.size]
})

const emit = defineEmits(['close', 'confirm', 'cancel'])

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}
</script>