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
        class="mobile-drawer-backdrop"
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
              'mobile-drawer-container',
              height
            ]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3">
              <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="$emit('close')"
              >
                <X class="icon-md" />
              </BaseButton>
            </div>
            
            <!-- Content -->
            <div class="px-4 pb-4 overflow-y-auto" :style="{ height: 'calc(100% - 3.5rem)' }">
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