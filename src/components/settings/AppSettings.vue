<template>
  <BaseDialog
    :is-open="isOpen"
    title="App Indstillinger"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <div>
        <h4 class="text-white font-medium mb-3">Generelle indstillinger</h4>
        <div class="space-y-3">
          <BaseToggle
            v-model="showPerformanceStats"
            label="Vis performance statistik"
            description="Viser indlæsningstider og krypteringsstatistik"
          />
        </div>
      </div>
      
      <div>
        <h4 class="text-white font-medium mb-3">Session indstillinger</h4>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Session timeout (minutter)
            </label>
            <select
              v-model="sessionTimeout"
              class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              <option value="900000">15 minutter</option>
              <option value="1800000">30 minutter</option>
              <option value="3600000">1 time</option>
              <option value="7200000">2 timer</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex gap-3 justify-end">
        <BaseButton variant="secondary" @click="$emit('close')">
          Luk
        </BaseButton>
        <BaseButton variant="primary" @click="saveSettings">
          Gem indstillinger
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref } from 'vue'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'
import BaseToggle from '../base/BaseToggle.vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const showPerformanceStats = ref(true)
const sessionTimeout = ref('1800000')

const saveSettings = () => {
  // Save settings logic would go here
  console.log('Saving settings:', {
    showPerformanceStats: showPerformanceStats.value,
    sessionTimeout: parseInt(sessionTimeout.value)
  })
  emit('close')
}
</script>