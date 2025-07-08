import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { encryptText, decryptText } from '../utils/encryption'
import { SecureStorage } from '../utils/secureStorage'
// ANBEFALING: Du skal bruge en password verifikationsfunktion her for master password unlock.
// import { verifyPassword } from '../utils/encryption' 

// --- Helper-funktioner til brugerindstillinger (holdes adskilt for klarhed) ---

// Helper til at hente krypterede mapper fra Firestore
const fetchEncryptedFolders = async (userId) => {
  const q = query(collection(db, 'folders'), where('userId', '==', userId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

// Helper til at dekryptere en enkelt mappe
const decryptSingleFolder = async (folderData, encryptionKey) => {
  // Håndterer både nye krypterede og gamle ukrypterede mapper
  const decryptedName = folderData.encryptedName
    ? await decryptText(folderData.encryptedName, encryptionKey)
    : folderData.name

  if (!decryptedName) return null // Spring over mapper uden navn

  return {
    id: folderData.id,
    name: decryptedName,
    color: folderData.color || '#6366f1',
    createdAt: folderData.createdAt?.toDate() || new Date(),
    updatedAt: folderData.updatedAt?.toDate() || new Date()
  }
}

// Helper til at processere og dekryptere alle mapper
const processEncryptedFolders = async (encryptedFolders, encryptionKey) => {
  const decryptionPromises = encryptedFolders.map(async (folderData) => {
    try {
      return await decryptSingleFolder(folderData, encryptionKey)
    } catch (error) {
      console.error(`Kunne ikke dekryptere mappe ${folderData.id}. Den springes over.`, error)
      return null
    }
  })
  
  const resolvedFolders = await Promise.all(decryptionPromises)
  return resolvedFolders.filter(folder => folder !== null)
}

const loadUserSettings = async (userId) => {
  if (!userId) return null
  
  try {
    const userSettingsRef = doc(db, 'userSettings', userId)
    const userSettingsSnap = await getDoc(userSettingsRef)
    
    if (userSettingsSnap.exists()) {
      const data = userSettingsSnap.data()
      if (data.encryptedSettings) {
        try {
          const encryptionKey = SecureStorage.getEncryptionKey()
          const decryptedSettings = await decryptText(data.encryptedSettings, encryptionKey)
          return JSON.parse(decryptedSettings)
        } catch {
          console.warn('Kunne ikke dekryptere eksisterende brugerindstillinger, sletter og bruger standard indstillinger')
          // Delete corrupted userSettings and use defaults
          try {
            await deleteDoc(userSettingsRef)
          } catch (deleteError) {
            console.error('Kunne ikke slette korrupte brugerindstillinger:', deleteError)
          }
          // Fall through to return default settings
        }
      }
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af brugerindstillinger:', error)
  }
  
  // Returner standardindstillinger, hvis ingen findes, eller hvis der opstod en fejl.
  return { 
    securePin: '1234', // Standard PIN
    // passwordVerifier: null, // Du bør gemme en verifier her
    aiSettings: {
      apiKey: '',
      selectedModel: 'gemini-1.5-flash-latest',
      customInstructions: 'note-organizer'
    }
  }
}

const saveUserSettings = async (userId, settings) => {
  if (!userId || !settings) return false
  
  try {
    const encryptionKey = SecureStorage.getEncryptionKey()
    const encryptedSettings = await encryptText(JSON.stringify(settings), encryptionKey)
    const userSettingsRef = doc(db, 'userSettings', userId)
    
    await setDoc(userSettingsRef, {
      userId,
      encryptedSettings,
      updatedAt: new Date()
    }, { merge: true })
    
    return true
  } catch (error) {
    console.error('Fejl ved lagring af brugerindstillinger:', error)
    return false
  }
}

// --- Pinia Store Definition ---

export const useFoldersStore = defineStore('folders', () => {
  // --- State ---
  const folders = ref([])
  const selectedFolderId = ref('all')
  const lockedFolders = ref(new Set(['secure'])) // 'secure' er altid låst fra start
  const userSettings = ref({})
  const securePin = ref('1234') // Lokal kopi af PIN for hurtig adgang

  // --- Actions ---

  const loadFolders = async (user) => {
    if (!user?.uid) return

    try {
      // Indlæs brugerindstillinger (inkl. PIN) først.
      // Dette kaldes separat for at sikre, at indstillinger er tilgængelige hurtigt.
      await loadSettings(user)
      
      const encryptionKey = SecureStorage.getEncryptionKey()
      const encryptedFolders = await fetchEncryptedFolders(user.uid)
      const decryptedFolders = await processEncryptedFolders(encryptedFolders, encryptionKey)
      
      folders.value = decryptedFolders

    } catch (error) {
      console.error('Fejl under indlæsning af mapper:', error)
    }
  }

  const loadSettings = async (user) => {
    if (!user?.uid) return

    const settings = await loadUserSettings(user.uid)
    userSettings.value = settings
    securePin.value = settings?.securePin || '1234'
  }

  const createFolder = async (name, color, user) => {
    if (!name.trim() || !user) return false
    
    try {
      const encryptionKey = SecureStorage.getEncryptionKey()
      const encryptedName = await encryptText(name, encryptionKey)
      const now = new Date()
      const folderData = {
        userId: user.uid,
        encryptedName,
        color: color || '#6366f1',
        createdAt: now,
        updatedAt: now
      }
      
      const docRef = await addDoc(collection(db, 'folders'), folderData)
      folders.value.push({ id: docRef.id, name, ...folderData })
      
      return true
    } catch (error) {
      console.error('Fejl ved oprettelse af mappe:', error)
      return false
    }
  }

  const updateFolder = async (folderId, name, color) => {
    if (!folderId || !name || !color) return false
    
    try {
      const encryptionKey = SecureStorage.getEncryptionKey()
      const encryptedName = await encryptText(name, encryptionKey)
      const now = new Date()
      
      await updateDoc(doc(db, 'folders', folderId), {
        encryptedName,
        color: color || '#6366f1',
        updatedAt: now
      })
      
      const folderIndex = folders.value.findIndex(f => f.id === folderId)
      if (folderIndex !== -1) {
        folders.value[folderIndex] = { 
          ...folders.value[folderIndex], 
          name, 
          color: color || '#6366f1',
          updatedAt: now 
        }
      }
      return true
    } catch (error) {
      console.error('Fejl ved opdatering af mappe:', error)
      return false
    }
  }

  const deleteFolder = async (folderId) => {
    try {
      await deleteDoc(doc(db, 'folders', folderId))
      folders.value = folders.value.filter(folder => folder.id !== folderId)
      
      if (selectedFolderId.value === folderId) {
        selectFolder('all')
      }
      return true
    } catch (error) {
      console.error('Fejl ved sletning af mappe:', error)
      return false
    }
  }

  const selectFolder = (folderId) => {
    selectedFolderId.value = folderId
  }

  const unlockFolder = (folderId, pin) => {
    if (folderId === 'secure' && pin === securePin.value) {
      lockedFolders.value.delete(folderId)
      selectFolder(folderId) // Vælg automatisk mappen efter oplåsning
      return true
    }
    return false
  }
  
  const verifyAndUnlockWithMasterPassword = async (folderId, masterPassword, user) => {
    if (!user?.uid || !masterPassword.trim()) {
      return false;
    }

    try {
      // Tjek hvordan brugeren er logget ind
      const loginType = localStorage.getItem(`loginType_${user.uid}`);
      
      if (loginType === 'google') {
        // For Google brugere: brug deres email som master password
        if (masterPassword === user.email) {
          lockedFolders.value.delete(folderId);
          selectFolder(folderId);
          return true;
        }
      } else if (loginType === 'email') {
        // For email/password brugere: sammenlign med deres gemte password
        const encryptedPassword = localStorage.getItem(`encryptedPassword_${user.uid}`);
        if (encryptedPassword) {
          const storedPassword = atob(encryptedPassword);
          if (masterPassword === storedPassword) {
            lockedFolders.value.delete(folderId);
            selectFolder(folderId);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Fejl ved master password verifikation:', error);
      return false;
    }
  }

  const changeSecurePin = async (newPin, user) => {
    if (!user?.uid || !/^\d{4}$/.test(newPin)) return false
    
    const updatedSettings = { ...userSettings.value, securePin: newPin }
    const success = await saveUserSettings(user.uid, updatedSettings)

    if (success) {
      // Opdater kun lokal state, hvis det lykkedes at gemme
      userSettings.value = updatedSettings
      securePin.value = newPin
      return true
    }
    return false
  }

  const lockSecureFolder = () => {
    lockedFolders.value.add('secure')
    if (selectedFolderId.value === 'secure') {
      selectFolder('all')
    }
  }

  const updateAiSettings = async (newAiSettings, user) => {
    if (!user?.uid || !newAiSettings) return false
    
    const updatedSettings = { 
      ...userSettings.value, 
      aiSettings: { ...userSettings.value.aiSettings, ...newAiSettings }
    }
    const success = await saveUserSettings(user.uid, updatedSettings)

    if (success) {
      // Opdater kun lokal state, hvis det lykkedes at gemme
      userSettings.value = updatedSettings
      return true
    }
    return false
  }

  const resetFolders = () => {
    folders.value = []
    selectedFolderId.value = 'all'
    lockedFolders.value = new Set(['secure'])
    userSettings.value = {}
    securePin.value = '1234'
  }

  return {
    // State
    folders,
    selectedFolderId,
    lockedFolders,
    userSettings,
    securePin,
    // Actions
    loadFolders,
    loadSettings,
    createFolder,
    updateFolder,
    deleteFolder,
    selectFolder,
    unlockFolder,
    verifyAndUnlockWithMasterPassword,
    unlockWithMasterPassword: verifyAndUnlockWithMasterPassword, // Alias for bagudkompatibilitet
    changeSecurePin,
    lockSecureFolder,
    updateAiSettings,
    resetFolders
  }
})