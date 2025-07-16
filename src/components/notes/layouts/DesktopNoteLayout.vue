<template>
  <!-- Desktop Sidebar -->
  <div class="hidden lg:block fixed right-0 top-16 h-[calc(100vh-4rem)] w-2/5 max-w-2xl bg-gray-900/95 backdrop-blur border-l border-gray-700/50 z-40 overflow-hidden shadow-xl">
    <div class="h-full flex flex-col">
      <!-- Desktop Header -->
      <div class="border-b border-gray-700/50">
        <slot name="header" />
      </div>

      <!-- Desktop Content -->
      <div class="flex-1 overflow-auto p-4 pb-0">
        <slot name="content" />
      </div>

      <!-- Desktop Actions -->
      <div v-if="showActions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showActions: {
    type: Boolean,
    default: true
  }
})
</script>