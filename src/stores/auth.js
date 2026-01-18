import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../firebase'
import { deriveKeyFromPassword, generatePasswordVerifier } from '../utils/encryption'
import { SecureStorage } from '../utils/secureStorage'
import { useSettingsStore } from './settings'

// --- Helper funktioner til authentication ---

// Helper til at sætte Firebase persistence op
const setupAuthPersistence = async () => {
  await setPersistence(auth, browserLocalPersistence)
}

// Helper til at derive og gemme krypteringsnøgler
const deriveAndStoreKeys = async (user, password, loginType) => {
  const key = await deriveKeyFromPassword(password, user.uid)
  const verifier = await generatePasswordVerifier(password, user.uid)
  const allowDevPasswordCache = import.meta.env.VITE_ALLOW_DEV_PASSWORD_CACHE === 'true'
  
  localStorage.setItem(`passwordVerifier_${user.uid}`, verifier)
  localStorage.setItem(`loginType_${user.uid}`, loginType)
  
  // Gem encrypted password kun for email login
  if (loginType === 'email' && allowDevPasswordCache) {
    localStorage.setItem(`encryptedPassword_${user.uid}`, btoa(password))
  }
  
  return { key, verifier }
}

// Helper til at mappe Firebase auth fejl til brugervenlige beskeder
const mapAuthError = (error, operation) => {
  const commonErrors = {
    'auth/network-request-failed': 'Netværksfejl. Tjek din forbindelse',
    'auth/too-many-requests': 'For mange forsøg. Prøv igen senere',
    'auth/invalid-email': 'Ugyldig email adresse'
  }
  
  const operationErrors = {
    login: {
      'auth/user-disabled': 'Denne konto er deaktiveret',
      'auth/user-not-found': 'Ingen bruger med denne email',
      'auth/wrong-password': 'Forkert password',
      'auth/invalid-credential': 'Forkert email eller password'
    },
    register: {
      'auth/email-already-in-use': 'Email er allerede i brug',
      'auth/weak-password': 'Password er for svagt',
      'auth/operation-not-allowed': 'Email/password login er ikke aktiveret'
    },
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
  const passwordVerifier = ref(null)
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
    const loginType = localStorage.getItem(`loginType_${user.value.uid}`)
    if (!loginType) {
      return false
    }
    const allowDevPasswordCache = import.meta.env.VITE_ALLOW_DEV_PASSWORD_CACHE === 'true'
    
    try {
      let key = null
      
      if (loginType === 'google') {
        key = await deriveKeyFromPassword(user.value.uid, user.value.uid)
      } else if (loginType === 'email' && allowDevPasswordCache) {
        const encryptedPassword = localStorage.getItem(`encryptedPassword_${user.value.uid}`)
        if (encryptedPassword) {
          const password = atob(encryptedPassword)
          key = await deriveKeyFromPassword(password, user.value.uid)
        }
      }
      
      if (key) {
        SecureStorage.setEncryptionKey(key, () => {
          SecureStorage.clearEncryptionKey()
        })
        encryptionKeyTrigger.value++
        return true
      } else {
        return false
      }
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

  // Helper til at sætte user session op efter successful authentication
  const setupUserSession = (authUser, verifier, key) => {
    user.value = authUser
    passwordVerifier.value = verifier
    
    // Set encryption key in SecureStorage with logout callback
    SecureStorage.setEncryptionKey(key, () => {
      logout()
    })
    
    // Trigger reactivity for encryptionKey computed property
    encryptionKeyTrigger.value++
  }

  // Hovedfunktion til at eksekvere authentication flow
  const executeAuthFlow = async (authOperation, loginType, password = null) => {
    loading.value = true
    
    try {
      await setupAuthPersistence()
      const result = await authOperation()
      
      // For Google login, brug UID som password
      const authPassword = loginType === 'google' ? result.user.uid : password
      const { key, verifier } = await deriveAndStoreKeys(result.user, authPassword, loginType)
      
      setupUserSession(result.user, verifier, key)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: mapAuthError(error, loginType) }
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

  const handleLogin = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email og password er påkrævet')
    }
    
    return executeAuthFlow(
      () => signInWithEmailAndPassword(auth, email, password),
      'login',
      password
    )
  }

  const handleRegister = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email og password er påkrævet')
    }
    
    if (password.length < 8) {
      return { 
        success: false, 
        error: 'Password skal være mindst 8 tegn langt' 
      }
    }
    
    return executeAuthFlow(
      () => createUserWithEmailAndPassword(auth, email, password),
      'register',
      password
    )
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    
    const result = await executeAuthFlow(
      () => signInWithPopup(auth, provider),
      'google'
    )
    
    // Tilføj needsPassword: false til Google login response
    return { ...result, needsPassword: false }
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
        
        const storedVerifier = localStorage.getItem(`passwordVerifier_${firebaseUser.uid}`)
        const loginType = localStorage.getItem(`loginType_${firebaseUser.uid}`)
        
        if (storedVerifier) {
          passwordVerifier.value = storedVerifier
        }
        
        try {
          let key = null
          const allowDevPasswordCache = import.meta.env.VITE_ALLOW_DEV_PASSWORD_CACHE === 'true'
          
          if (loginType === 'google') {
            key = await deriveKeyFromPassword(firebaseUser.uid, firebaseUser.uid)
          } else if (loginType === 'email' && allowDevPasswordCache) {
            const encryptedPassword = localStorage.getItem(`encryptedPassword_${firebaseUser.uid}`)
            if (encryptedPassword) {
              const password = atob(encryptedPassword)
              key = await deriveKeyFromPassword(password, firebaseUser.uid)
            }
          }
          
          if (key) {
            // Set encryption key in SecureStorage with logout callback
            SecureStorage.setEncryptionKey(key, () => {
              logout()
            })
            
            // Trigger reactivity for encryptionKey computed property
            encryptionKeyTrigger.value++
          } else {
            SecureStorage.clearEncryptionKey()
          }
        } catch {
          SecureStorage.clearEncryptionKey()
        }
      } else {
        user.value = null
        passwordVerifier.value = null
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
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    logout,
    extendSession,
    setupActivityListeners,
    initializeAuth,
    recoverEncryptionKey
  }
})
