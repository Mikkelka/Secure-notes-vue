<template>
  <BaseDialog
    is-open
    title="Eksporter Backup"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Description -->
      <div class="text-center bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
        <p class="text-gray-300">
          Eksporter alle dine noter som en læsbar JSON fil
        </p>
        <p class="text-sm text-gray-400 mt-2">
          Gem filen sikkert og overvej at kryptere den med zip/password
        </p>
      </div>

      <!-- Password Input -->
      <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Bekræft dit password:
        </label>
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="passwordPlaceholder"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
            autofocus
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <Eye v-if="showPassword" class="icon-sm" />
            <EyeOff v-else class="icon-sm" />
          </button>
        </div>
      </div>

      <!-- Warning -->
      <div class="p-4 rounded-lg border-l-4 bg-yellow-900/20 border-yellow-500">
        <div class="flex items-start gap-2">
          <AlertTriangle class="icon-sm text-yellow-400 mt-0.5 flex-shrink-0" />
          <div class="text-sm">
            <div class="font-medium text-yellow-300 mb-1">Sikkerhedsadvarsel</div>
            <div class="text-yellow-200">
              Denne fil indeholder alle dine noter i læsbar form. Gem den sikkert og slet efter brug.
            </div>
          </div>
        </div>
      </div>

      <!-- Data Summary -->
      <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
        <h3 class="font-medium text-white mb-3">Data der eksporteres:</h3>
        <div class="text-sm text-gray-300 space-y-2">
          <div>📝 {{ notes.length }} noter</div>
          <div>📁 {{ folders.length }} mapper</div>
          <div>⭐ {{ notes.filter(n => n.isFavorite).length }} favoritter</div>
          <div>👤 User: {{ username }}</div>
        </div>
      </div>

      <!-- Result Message -->
      <div 
        v-if="result"
        :class="[
          'p-4 rounded-lg border-l-4',
          result.success 
            ? 'bg-green-900/20 border-green-500' 
            : 'bg-red-900/20 border-red-500'
        ]"
      >
        <div class="flex items-start gap-2">
          <CheckCircle v-if="result.success" class="icon-sm text-green-400 mt-0.5 flex-shrink-0" />
          <AlertTriangle v-else class="icon-sm text-red-400 mt-0.5 flex-shrink-0" />
          <div :class="['text-sm', result.success ? 'text-green-200' : 'text-red-200']">
            {{ result.message }}
          </div>
        </div>
      </div>

      <!-- Import Link -->
      <div class="pt-4 border-t border-gray-700/50 text-center">
        <button
          @click="() => { $emit('close'); $emit('openImport'); }"
          class="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <Upload class="icon-sm" />
          Importer noter fra backup fil?
        </button>
      </div>
    </div>
    
    <template #footer>
      <div class="flex gap-3 justify-end">
        <BaseButton 
          variant="secondary" 
          :disabled="loading"
          @click="$emit('close')"
        >
          Annuller
        </BaseButton>
        <BaseButton 
          variant="primary" 
          :disabled="loading || !password.trim()"
          @click="handleExport"
        >
          <div v-if="loading" class="icon-sm border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <Download v-else class="icon-sm" />
          {{ loading ? 'Eksporterer...' : 'Eksporter Backup' }}
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { AlertTriangle, Download, CheckCircle, Upload, Eye, EyeOff } from 'lucide-vue-next'
import BaseDialog from '../base/BaseDialog.vue'
import BaseButton from '../base/BaseButton.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  notes: {
    type: Array,
    default: () => []
  },
  folders: {
    type: Array,
    default: () => []
  }
})

defineEmits(['close', 'openImport'])

// Computed property for password placeholder based on login type
const passwordPlaceholder = computed(() => {
  if (!props.user?.uid) {
    return 'Indtast dit password'
  }
  
  const loginType = localStorage.getItem(`loginType_${props.user.uid}`)
  
  if (loginType === 'google') {
    return 'Indtast din Google email adresse'
  } else if (loginType === 'email') {
    return 'Indtast dit login password'
  }
  
  return 'Indtast dit password'
})

// Computed property for username (part before @)
const username = computed(() => {
  if (!props.user?.email) {
    return 'Ukendt bruger'
  }
  
  return props.user.email.split('@')[0]
})

const loading = ref(false)
const password = ref('')
const showPassword = ref(false)
const result = ref(null)

const handleExport = async () => {
  if (!password.value.trim()) {
    result.value = { success: false, message: 'Password er påkrævet' }
    return
  }

  loading.value = true
  result.value = null

  try {
    // Verify password based on login type (same logic as master password)
    const loginType = localStorage.getItem(`loginType_${props.user.uid}`)
    let actualPassword = password.value.trim()
    
    if (loginType === 'google') {
      // For Google users: check if entered password matches their email
      if (actualPassword !== props.user.email) {
        result.value = { 
          success: false, 
          message: 'Forkert email adresse. Indtast din Google email.' 
        }
        return
      }
      // Use UID as the actual encryption password for Google users
      actualPassword = props.user.uid
        } else if (loginType === 'email') {
          // For email users: verify against stored password verifier
          const passwordVerifier = localStorage.getItem(`passwordVerifier_${props.user.uid}`)
          if (passwordVerifier) {
            const { verifyPassword } = await import('../../utils/encryption')
            const isValid = await verifyPassword(actualPassword, props.user.uid, passwordVerifier)
            if (!isValid) {
              result.value = { 
                success: false, 
                message: 'Forkert password. Indtast dit login password.' 
              }
              return
            }
          } else {
            result.value = { 
              success: false, 
              message: 'Kunne ikke verificere password.' 
            }
            return
          }
        }

    // Create export data - notes are already decrypted in the store
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: props.user.uid,
      notes: props.notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        folderId: note.folderId,
        isFavorite: note.isFavorite,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      })),
      folders: props.folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      })),
      metadata: {
        notesCount: props.notes.length,
        foldersCount: props.folders.length,
        favoriteCount: props.notes.filter(n => n.isFavorite).length
      }
    }
    
    const filename = `sikre-noter-backup-${new Date().toISOString().split('T')[0]}.json`
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    result.value = {
      success: true,
      message: 'Backup eksporteret! Gem filen sikkert og overvej at kryptere den (zip med password).'
    }

  } catch (error) {
    console.error('Export failed:', error)
    result.value = {
      success: false,
      message: 'Export fejlede: ' + (error.message || 'Muligvis forkert password')
    }
  } finally {
    loading.value = false
  }
}
</script>
