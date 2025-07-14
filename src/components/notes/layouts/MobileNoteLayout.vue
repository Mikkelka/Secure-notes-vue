<template>
  <!-- Mobile Overlay -->
  <div 
    class="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-60" 
    @click="$emit('close')"
  >
    <div class="absolute inset-0 bg-gray-900" @click.stop>
      <div class="h-full flex flex-col">
        <!-- Mobile Header -->
        <div class="border-b border-gray-700/50">
          <slot name="header" />
        </div>

        <!-- Mobile Content -->
        <div class="flex-1 overflow-auto p-4 pb-0">
          <slot name="content" />
        </div>

        <!-- Mobile Actions -->
        <div v-if="showActions">
          <slot name="actions" />
        </div>
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

defineEmits(['close'])
</script>