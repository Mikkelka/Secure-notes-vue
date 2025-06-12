<template>
  <div class="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 overflow-hidden">
    <div class="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-2xl p-6 w-full max-w-md">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl mb-3">
          <Shield class="w-6 h-6 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white mb-1">SecureNotes</h1>
        <p class="text-gray-400 text-sm">End-to-end krypterede noter</p>
      </div>

      <!-- Google Login - Primary option -->
      <div class="mb-6">
        <BaseButton
          @click="handleGoogleSubmit"
          :loading="loading"
          variant="secondary"
          class="w-full bg-white text-gray-900 hover:bg-gray-100"
        >
          <Chrome v-if="!loading" class="w-4 h-4" />
          Login med Google (anbefalet)
        </BaseButton>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3 mb-6">
        <div class="flex-1 h-px bg-gray-600"></div>
        <span class="text-gray-400 text-sm">eller brug email</span>
        <div class="flex-1 h-px bg-gray-600"></div>
      </div>

      <div class="space-y-3">
        <div class="relative">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all"
          />
        </div>
        
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password (bruges til kryptering)"
            class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all pr-11"
            @keypress.enter="handleSubmit('login')"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <EyeOff v-if="showPassword" class="w-4 h-4" />
            <Eye v-else class="w-4 h-4" />
          </button>
        </div>

        <!-- Error message -->
        <div v-if="error" class="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ error }}</span>
        </div>

        <div class="flex gap-2 pt-2">
          <BaseButton
            @click="handleSubmit('login')"
            :disabled="!email || !password"
            :loading="loading"
            variant="primary"
            class="flex-1"
          >
            <Unlock v-if="!loading" class="w-4 h-4" />
            Login
          </BaseButton>
          <BaseButton
            @click="handleSubmit('register')"
            :disabled="!email || !password"
            :loading="loading"
            variant="secondary"
            class="flex-1"
          >
            <Plus v-if="!loading" class="w-4 h-4" />
            Registrer
          </BaseButton>
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div class="flex items-center gap-2 text-blue-300 text-sm">
            <Lock class="w-4 h-4" />
            <span>Dine data krypteres med dit password før lagring</span>
          </div>
        </div>
        
        <div class="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div class="flex items-center gap-2 text-green-300 text-sm">
            <Shield class="w-4 h-4" />
            <span>End-to-end kryptering med AES-256-GCM</span>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-4">
        <p class="text-gray-500 text-xs">v0.9.2</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Shield, Unlock, Plus, Eye, EyeOff, Lock, AlertCircle, Chrome } from 'lucide-vue-next'
import BaseButton from '../base/BaseButton.vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['login', 'register', 'googleLogin'])

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

const handleSubmit = async (action) => {
  error.value = ''
  
  if (action === 'login') {
    emit('login', email.value, password.value)
  } else {
    emit('register', email.value, password.value)
  }
}

const handleGoogleSubmit = async () => {
  error.value = ''
  emit('googleLogin')
}

// Expose method to set error from parent
const setError = (errorMessage) => {
  error.value = errorMessage
}

const clearForm = () => {
  email.value = ''
  password.value = ''
  error.value = ''
}

defineExpose({
  setError,
  clearForm
})
</script>