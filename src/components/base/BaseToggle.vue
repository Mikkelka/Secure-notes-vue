<template>
  <div class="flex items-center gap-3">
    <label v-if="label && labelPosition === 'left'" :for="inputId" class="text-sm font-medium text-gray-300">
      {{ label }}
    </label>
    
    <button
      :id="inputId"
      type="button"
      :class="[
        'toggle-base toggle-focus toggle-disabled',
        modelValue ? 'bg-gray-600' : 'bg-gray-700'
      ]"
      :disabled="disabled"
      @click="toggle"
    >
      <span
        :class="[
          'toggle-thumb toggle-thumb-transition',
          modelValue ? 'translate-x-5' : 'translate-x-0'
        ]"
      />
    </button>
    
    <label v-if="label && labelPosition === 'right'" :for="inputId" class="text-sm font-medium text-gray-300">
      {{ label }}
    </label>
    
    <span v-if="description" class="text-xs text-gray-500">
      {{ description }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  labelPosition: {
    type: String,
    default: 'right',
    validator: (value) => ['left', 'right'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => `toggle-${Math.random().toString(36).substr(2, 9)}`)

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>