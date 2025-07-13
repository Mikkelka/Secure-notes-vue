<template>
  <button
    :class="[
      'btn-base btn-disabled btn-focus',
      variantClasses,
      sizeClasses
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <div v-if="loading" :class="spinnerClasses" />
    <component v-else-if="icon" :is="icon" :class="iconClasses" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [String, Object],
    default: null
  }
})

defineEmits(['click'])

const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500',
    secondary: 'bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    ghost: 'text-gray-300 hover:bg-gray-700/50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }
  return sizes[props.size]
})

const iconClasses = computed(() => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  return sizes[props.size]
})

const spinnerClasses = computed(() => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  return `${sizes[props.size]} border-2 border-gray-400 border-t-white rounded-full animate-spin`
})
</script>