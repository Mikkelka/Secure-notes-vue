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
import { useSettingsStore } from './settings'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = ref(false)
  const encryptionKey = ref(null)
  const passwordVerifier = ref(null)
  const loading = ref(true)
  const showTimeoutWarning = ref(false)

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
  const handleSessionTimeout = () => {
    console.log('Session timeout - locking user out')
    encryptionKey.value = null
    showTimeoutWarning.value = false
    clearSessionTimers()
  }

  // Warning handler
  const handleTimeoutWarning = () => {
    console.log('Showing session timeout warning')
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

  // Extend session
  const extendSession = () => {
    showTimeoutWarning.value = false
    resetSessionTimers()
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
    
    loading.value = true
    try {
      await setPersistence(auth, browserLocalPersistence)
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      const key = await deriveKeyFromPassword(password, result.user.uid)
      const verifier = await generatePasswordVerifier(password, result.user.uid)
      
      localStorage.setItem(`passwordVerifier_${result.user.uid}`, verifier)
      localStorage.setItem(`loginType_${result.user.uid}`, 'email')
      localStorage.setItem(`encryptedPassword_${result.user.uid}`, btoa(password))
      
      user.value = result.user
      isLoggedIn.value = true
      encryptionKey.value = key
      passwordVerifier.value = verifier
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      
      let errorMessage = 'Login fejlede'
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Ugyldig email adresse'
          break
        case 'auth/user-disabled':
          errorMessage = 'Denne konto er deaktiveret'
          break
        case 'auth/user-not-found':
          errorMessage = 'Ingen bruger med denne email'
          break
        case 'auth/wrong-password':
          errorMessage = 'Forkert password'
          break
        case 'auth/too-many-requests':
          errorMessage = 'For mange forsøg. Prøv igen senere'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Netværksfejl. Tjek din forbindelse'
          break
        case 'auth/invalid-credential':
          errorMessage = 'Forkert email eller password'
          break
      }
      
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
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
    
    loading.value = true
    try {
      await setPersistence(auth, browserLocalPersistence)
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      const key = await deriveKeyFromPassword(password, result.user.uid)
      const verifier = await generatePasswordVerifier(password, result.user.uid)
      
      localStorage.setItem(`passwordVerifier_${result.user.uid}`, verifier)
      localStorage.setItem(`loginType_${result.user.uid}`, 'email')
      localStorage.setItem(`encryptedPassword_${result.user.uid}`, btoa(password))
      
      user.value = result.user
      isLoggedIn.value = true
      encryptionKey.value = key
      passwordVerifier.value = verifier
      
      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      
      let errorMessage = 'Registrering fejlede'
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email er allerede i brug'
          break
        case 'auth/invalid-email':
          errorMessage = 'Ugyldig email adresse'
          break
        case 'auth/weak-password':
          errorMessage = 'Password er for svagt'
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password login er ikke aktiveret'
          break
      }
      
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const handleGoogleLogin = async () => {
    loading.value = true
    try {
      console.log('🔗 Starting Google login...')
      
      await setPersistence(auth, browserLocalPersistence)
      
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      console.log('🚀 Opening Google popup...')
      const result = await signInWithPopup(auth, provider)
      console.log('✅ Google login successful:', result.user.email)
      
      const googlePassword = result.user.uid
      const key = await deriveKeyFromPassword(googlePassword, result.user.uid)
      const verifier = await generatePasswordVerifier(googlePassword, result.user.uid)
      
      localStorage.setItem(`passwordVerifier_${result.user.uid}`, verifier)
      localStorage.setItem(`loginType_${result.user.uid}`, 'google')
      
      user.value = result.user
      isLoggedIn.value = true
      encryptionKey.value = key
      passwordVerifier.value = verifier
      
      console.log('🔐 Auto-generated encryption key from Google UID')
      
      return { success: true, needsPassword: false }
    } catch (error) {
      console.error('❌ Google login error details:', {
        code: error.code,
        message: error.message,
        details: error
      })
      
      let errorMessage = 'Google login fejlede'
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login blev annulleret'
          break
        case 'auth/popup-blocked':
          errorMessage = 'Popup blev blokeret af browseren'
          break
        case 'auth/cancelled-popup-request':
          errorMessage = 'Login blev annulleret'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Netværksfejl. Tjek din forbindelse'
          break
        case 'auth/too-many-requests':
          errorMessage = 'For mange forsøg. Prøv igen senere'
          break
        default:
          errorMessage = `Google login fejl: ${error.message}`
      }
      
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    
    try {
      clearSessionTimers()
      
      if (user.value?.uid) {
        localStorage.removeItem(`passwordVerifier_${user.value.uid}`)
        localStorage.removeItem(`loginType_${user.value.uid}`)
        localStorage.removeItem(`encryptedPassword_${user.value.uid}`)
      }
      
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      loading.value = false
    }
  }

  // Initialize auth state listener
  const initializeAuth = () => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔍 Auth state changed for user:', firebaseUser.email)
        
        user.value = firebaseUser
        isLoggedIn.value = true
        
        const storedVerifier = localStorage.getItem(`passwordVerifier_${firebaseUser.uid}`)
        const loginType = localStorage.getItem(`loginType_${firebaseUser.uid}`)
        
        if (storedVerifier) {
          passwordVerifier.value = storedVerifier
        }
        
        try {
          let key = null
          
          if (loginType === 'google') {
            console.log('🔍 Regenerating Google user encryption key')
            key = await deriveKeyFromPassword(firebaseUser.uid, firebaseUser.uid)
          } else if (loginType === 'email') {
            const encryptedPassword = localStorage.getItem(`encryptedPassword_${firebaseUser.uid}`)
            if (encryptedPassword) {
              const password = atob(encryptedPassword)
              console.log('🔍 Regenerating email user encryption key')
              key = await deriveKeyFromPassword(password, firebaseUser.uid)
            }
          }
          
          if (key) {
            encryptionKey.value = key
            console.log('🔐 Auto-regenerated encryption key for', loginType, 'user')
          } else {
            console.log('⚠️ Could not regenerate encryption key')
            encryptionKey.value = null
          }
        } catch (error) {
          console.error('❌ Error regenerating encryption key:', error)
          encryptionKey.value = null
        }
      } else {
        user.value = null
        isLoggedIn.value = false
        encryptionKey.value = null
        passwordVerifier.value = null
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
    initializeAuth
  }
})