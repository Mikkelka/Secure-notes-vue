<template>
  <div class="fixed top-4 right-4 z-[9999] space-y-2">
    <div
      v-for="item in notifications.items"
      :key="item.id"
      :class="[
        'px-4 py-3 rounded-lg shadow-lg border text-sm text-white min-w-[220px] max-w-sm',
        typeClass(item.type)
      ]"
    >
      <div class="flex items-start justify-between gap-3">
        <span class="leading-snug">{{ item.message }}</span>
        <button
          class="text-white/70 hover:text-white"
          @click="notifications.remove(item.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../../stores/notifications'

const notifications = useNotificationsStore()

const typeClass = (type) => {
  switch (type) {
    case 'success':
      return 'bg-green-900/90 border-green-500'
    case 'error':
      return 'bg-red-900/90 border-red-500'
    case 'warning':
      return 'bg-yellow-900/90 border-yellow-500'
    default:
      return 'bg-gray-900/90 border-gray-700'
  }
}
</script>
