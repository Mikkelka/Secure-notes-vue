import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../firebase'
import { deriveKeyFromPassword } from '../utils/encryption'
import { SecureStorage } from '../utils/secureStorage'
import { useSettingsStore } from './settings'

// --- Helper funktioner til authentication ---

// Helper til at sÃ¦tte Firebase persistence op
const setupAuthPersistence = async () => {
  await setPersistence(auth, browserLocalPersistence)
}

// Helper til at derive og gemme krypteringsnÃ¸gler (Google-only)
const deriveAndStoreKeys = async (user) => {
  const key = await deriveKeyFromPassword(user.uid, user.uid)
  localStorage.setItem(`loginType_${user.uid}`, 'google')
  localStorage.removeItem(`passwordVerifier_${user.uid}`)
  localStorage.removeItem(`encryptedPassword_${user.uid}`)
  return { key }
}

// Helper til at mappe Firebase auth fejl til brugervenlige beskeder
const mapAuthError = (error, operation) => {
  const commonErrors = {
    'auth/network-request-failed': 'NetvÃ¦rksfejl. Tjek din forbindelse',
    'auth/too-many-requests': 'For mange forsÃ¸g. PrÃ¸v igen senere',
    'auth/invalid-email': 'Ugyldig email adresse'
  }
  
  const operationErrors = {
    google: {
      'auth/popup-closed-by-user': 'Login blev annulleret',
      'auth/popup-blocked': 'Popup blev blokeret af browseren',
      'auth/cancelled-popup-request': 'Login blev annulleret'
    }
  }
  
  return commonErrors[error.code] || 
         operationErrors[operation]?.[error.code] || 
         `${operation} fejlede: ${error.message}`
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const showTimeoutWarning = ref(false)
  
  // Reactive trigger for encryption key changes
  const encryptionKeyTrigger = ref(0)
  
  // Computed property that checks both user and encryption key (reactive to trigger)
  const isLoggedIn = computed(() => {
    // Access trigger to make this reactive
    encryptionKeyTrigger.value
    return !!(user.value && SecureStorage.hasEncryptionKey())
  })

  // Helper function to recover encryption key if missing but user is logged in
  const recoverEncryptionKey = async () => {
    if (!user.value || SecureStorage.hasEncryptionKey()) return false
    try {
      const key = await deriveKeyFromPassword(user.value.uid, user.value.uid)
      SecureStorage.setEncryptionKey(key, () => {
        SecureStorage.clearEncryptionKey()
      })
      encryptionKeyTrigger.value++
      return true
    } catch {
      return false
    }
  }

  // Computed property for accessing encryption key (reactive to trigger)
  const encryptionKey = computed(() => {
    // Access trigger to make this reactive
    encryptionKeyTrigger.value
    
    try {
      return SecureStorage.getEncryptionKey()
    } catch {
      return null
    }
  })

  // Timers
  let timeoutRef = null
  let warningRef = null
  let lastActivity = Date.now()

  const settings = computed(() => {
    const settingsStore = useSettingsStore()
    return settingsStore.settings
  })

  const SESSION_TIMEOUT = computed(() => settings.value.sessionTimeout)
  const WARNING_TIME = computed(() => settings.value.warningTime)

  // Clear all timers
  const clearSessionTimers = () => {
    if (timeoutRef) {
      clearTimeout(timeoutRef)
      timeoutRef = null
    }
    if (warningRef) {
      clearTimeout(warningRef)
      warningRef = null
    }
    showTimeoutWarning.value = false
  }

  // Session timeout handler
  const handleSessionTimeout = async () => {
    showTimeoutWarning.value = false
    clearSessionTimers()
    await logout()
  }

  // Warning handler
  const handleTimeoutWarning = () => {
    showTimeoutWarning.value = true
  }

  // Start session timers
  const startSessionTimers = () => {
    clearSessionTimers()
    
    warningRef = setTimeout(handleTimeoutWarning, SESSION_TIMEOUT.value - WARNING_TIME.value)
    timeoutRef = setTimeout(handleSessionTimeout, SESSION_TIMEOUT.value)
    
    lastActivity = Date.now()
  }

  // Reset timers on activity
  const resetSessionTimers = () => {
    if (encryptionKey.value) {
      startSessionTimers()
    }
  }

  // Extend session - now uses SecureStorage
  const extendSession = () => {
    showTimeoutWarning.value = false
    
    // Extend session in SecureStorage (which handles the actual timeout)
    SecureStorage.extendSession()
    
    // Also reset our UI timers for warning display
    resetSessionTimers()
  }

  // Helper til at sÃ¦tte user session op efter successful authentication
  const setupUserSession = (authUser, key) => {
    user.value = authUser
    
    // Set encryption key in SecureStorage with logout callback
    SecureStorage.setEncryptionKey(key, () => {
      logout()
    })
    
    // Trigger reactivity for encryptionKey computed property
    encryptionKeyTrigger.value++
  }

  // Hovedfunktion til at eksekvere authentication flow
  const executeAuthFlow = async (authOperation) => {
    loading.value = true
    
    try {
      await setupAuthPersistence()
      const result = await authOperation()
      
      const { key } = await deriveAndStoreKeys(result.user)
      
      setupUserSession(result.user, key)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: mapAuthError(error, 'google') }
    } finally {
      loading.value = false
    }
  }

  // Activity tracking
  const handleActivity = () => {
    const now = Date.now()
    if (now - lastActivity > 5000) {
      resetSessionTimers()
    }
  }

  // Setup activity listeners
  const setupActivityListeners = () => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    startSessionTimers()

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearSessionTimers()
    }
  }

  /**
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    
    const result = await executeAuthFlow(
      () => signInWithPopup(auth, provider)
    )
    return result
  }

  const logout = async () => {
    loading.value = true
    
    try {
      clearSessionTimers()
      
      // Clear encryption key from SecureStorage
      SecureStorage.clearEncryptionKey()
      
      if (user.value?.uid) {
        localStorage.removeItem(`passwordVerifier_${user.value.uid}`)
        localStorage.removeItem(`loginType_${user.value.uid}`)
        localStorage.removeItem(`encryptedPassword_${user.value.uid}`)
      }
      
      await signOut(auth)
    } catch {
      // Error is caught, but not logged to console
    } finally {
      loading.value = false
    }
  }

  // Initialize auth state listener
  const initializeAuth = async () => {
    // Set Firebase persistence before auth state listener
    try {
      await setPersistence(auth, browserLocalPersistence)
   
    } catch {
      return false
    }
    
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = firebaseUser
        
        try {
          const key = await deriveKeyFromPassword(firebaseUser.uid, firebaseUser.uid)
          SecureStorage.setEncryptionKey(key, () => {
            logout()
          })
          encryptionKeyTrigger.value++
        } catch {
          SecureStorage.clearEncryptionKey()
        }
      } else {
        user.value = null
        SecureStorage.clearEncryptionKey()
      }
      loading.value = false
    })
  }

  return {
    user,
    isLoggedIn,
    encryptionKey,
    loading,
    showTimeoutWarning,
    settings,
    handleGoogleLogin,
    logout,
    extendSession,
    setupActivityListeners,
    initializeAuth,
    recoverEncryptionKey
  }
})



