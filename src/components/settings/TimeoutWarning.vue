<template>
  <BaseDialog
    :is-open="show"
    title="Session timeout"
    size="sm"
    :close-on-backdrop="false"
    :show-close-button="false"
  >
    <div class="text-center space-y-4">
      <div class="text-yellow-400">
        <Clock class="w-12 h-12 mx-auto mb-3" />
      </div>
      <p class="text-gray-300">
        Din session udløber snart af sikkerhedsmæssige årsager.
      </p>
      <p class="text-sm text-gray-400">
        Klik "Forlæng session" for at fortsætte eller "Log ud" for at afslutte.
      </p>
    </div>
    
    <template #footer>
      <div class="flex gap-3 justify-end">
        <BaseButton
          variant="secondary"
          @click="$emit('logout')"
        >
          Log ud
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="$emit('extend')"
        >
          Forlæng session
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { Clock } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['extend', 'logout'])
</script>