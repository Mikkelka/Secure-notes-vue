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
            :class="[
              'absolute bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur rounded-t-2xl border-t border-gray-700/50',
              height
            ]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-700/50">
              <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="$emit('close')"
              >
                <X class="w-5 h-5" />
              </BaseButton>
            </div>
            
            <!-- Content -->
            <div class="p-4 overflow-y-auto" :style="{ height: 'calc(100% - 4rem)' }">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: 'h-[50vh]'
  }
})

defineEmits(['close'])
</script>