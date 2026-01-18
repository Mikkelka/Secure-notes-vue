<template>
  <BaseDialog
    :is-open="isOpen"
    title="Genbekræft adgang"
    show-default-actions
    confirm-text="Fortsæt"
    cancel-text="Annuller"
    @confirm="handleConfirm"
    @cancel="$emit('cancel')"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-400">
        Din session er udløbet. Indtast dit password for at låse dine noter op igen.
      </p>
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          {{ passwordLabel }}
        </label>
        <input
          v-model="password"
          type="password"
          :placeholder="passwordPlaceholder"
          class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleConfirm"
        />
      </div>
      <div v-if="error" class="text-sm text-red-400">
        {{ error }}
      </div>
    </div>
  </BaseDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseDialog from '../base/BaseDialog.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  loginType: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['confirm', 'cancel'])
const password = ref('')

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      password.value = ''
    }
  }
)

const passwordLabel = computed(() => {
  return props.loginType === 'email'
    ? 'Login password'
    : 'Password'
})

const passwordPlaceholder = computed(() => {
  return props.loginType === 'email'
    ? 'Indtast dit login password'
    : 'Indtast dit password'
})

const handleConfirm = () => {
  emit('confirm', password.value.trim())
}
</script>
