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
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { encryptText, decryptText } from '../utils/encryption'

// User settings functions
const loadUserSettings = async (userId, encryptionKey) => {
  if (!userId || !encryptionKey) return null
  
  try {
    const userSettingsRef = doc(db, 'userSettings', userId)
    const userSettingsSnap = await getDoc(userSettingsRef)
    
    if (userSettingsSnap.exists()) {
      const data = userSettingsSnap.data()
      if (data.encryptedSettings) {
        const decryptedSettings = await decryptText(data.encryptedSettings, encryptionKey)
        return JSON.parse(decryptedSettings)
      }
    }
    
    // Return default settings if none exist
    return { 
      securePin: '1234',
      aiSettings: {
        apiKey: '',
        selectedModel: 'gemini-2.5-flash-preview-05-20',
        customInstructions: 'note-organizer'
      }
    }
  } catch (error) {
    console.error('Failed to load user settings:', error)
    return { 
      securePin: '1234',
      aiSettings: {
        apiKey: '',
        selectedModel: 'gemini-2.5-flash-preview-05-20',
        customInstructions: 'note-organizer'
      }
    }
  }
}

const saveUserSettings = async (userId, settings, encryptionKey) => {
  if (!userId || !settings || !encryptionKey) return false
  
  try {
    const encryptedSettings = await encryptText(JSON.stringify(settings), encryptionKey)
    const userSettingsRef = doc(db, 'userSettings', userId)
    
    await setDoc(userSettingsRef, {
      userId,
      encryptedSettings,
      updatedAt: new Date()
    }, { merge: true })
    
    return true
  } catch (error) {
    console.error('Failed to save user settings:', error)
    return false
  }
}

export const useFoldersStore = defineStore('folders', () => {
  const folders = ref([])
  const selectedFolderId = ref('all')
  const lockedFolders = ref(new Set(['secure'])) // Initialize secure folder as locked
  const userSettings = ref({})
  const securePin = ref('1234') // Default PIN

  const loadFolders = async (user, encryptionKey) => {
    try {
      console.log('Loading folders for user:', user.uid)
      
      // Load user settings (including PIN) first
      await loadSettings(user, encryptionKey)
      
      const foldersRef = collection(db, 'folders')
      const q = query(
        foldersRef, 
        where('userId', '==', user.uid)
        // Note: orderBy removed to avoid need for composite index
      )
      
      const querySnapshot = await getDocs(q)
      console.log('Found', querySnapshot.docs.length, 'folders in Firestore')
      const decryptedFolders = []
      
      for (const docSnapshot of querySnapshot.docs) {
        const folderData = docSnapshot.data()
        try {
          let decryptedName
          
          // Handle both old (name) and new (encryptedName) folders like React version
          if (folderData.encryptedName) {
            // New encrypted folder
            decryptedName = await decryptText(folderData.encryptedName, encryptionKey)
          } else if (folderData.name) {
            // Old unencrypted folder - use name as is
            decryptedName = folderData.name
            console.log('Found legacy unencrypted folder:', folderData.name)
          } else {
            // No name - skip
            console.warn('Folder has no name or encryptedName:', docSnapshot.id)
            continue
          }
          
          decryptedFolders.push({
            id: docSnapshot.id,
            name: decryptedName,
            encryptedName: folderData.encryptedName,
            color: folderData.color || '#6366f1',
            createdAt: folderData.createdAt?.toDate() || new Date(),
            updatedAt: folderData.updatedAt?.toDate() || new Date()
          })
        } catch (error) {
          console.error('Failed to decrypt folder:', docSnapshot.id, error)
          // Skip folders that can't be decrypted
        }
      }
      
      folders.value = decryptedFolders
      console.log('Successfully loaded', decryptedFolders.length, 'folders:', decryptedFolders.map(f => f.name))
      console.log('Setting folders.value to:', decryptedFolders)
    } catch (error) {
      console.error('Load folders error:', error)
    }
  }

  const loadSettings = async (user, encryptionKey) => {
    if (!user?.uid || !encryptionKey) {
      userSettings.value = {}
      securePin.value = '1234'
      return
    }

    try {
      const settings = await loadUserSettings(user.uid, encryptionKey)
      userSettings.value = settings
      if (settings?.securePin) {
        securePin.value = settings.securePin
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const createFolder = async (name, color, user, encryptionKey) => {
    if (!name.trim() || !encryptionKey || !user) {
      console.error('Missing required data for folder creation:', { 
        hasName: !!name.trim(), 
        hasUser: !!user, 
        hasKey: !!encryptionKey 
      })
      return false
    }
    
    try {
      console.log('Creating folder:', name, 'with color:', color)
      const encryptedName = await encryptText(name, encryptionKey)
      
      const folderData = {
        userId: user.uid,
        encryptedName,
        color: color || '#6366f1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('Saving folder to Firestore with data:', { ...folderData, encryptedName: '[encrypted]' })
      const docRef = await addDoc(collection(db, 'folders'), folderData)
      
      const newFolder = {
        id: docRef.id,
        name,
        encryptedName,
        color: folderData.color,
        createdAt: folderData.createdAt,
        updatedAt: folderData.updatedAt
      }
      
      folders.value = [...folders.value, newFolder]
      console.log('Folder created successfully:', newFolder.name, 'Total folders:', folders.value.length)
      return true
    } catch (error) {
      console.error('Create folder error:', error)
      if (error.code === 'permission-denied') {
        console.error('Firebase permissions error - check security rules')
      }
      return false
    }
  }

  const updateFolder = async (folderId, name, color, encryptionKey, user) => {
    if (!encryptionKey || !user) return false
    
    try {
      const encryptedName = await encryptText(name, encryptionKey)
      
      const folderRef = doc(db, 'folders', folderId)
      await updateDoc(folderRef, {
        encryptedName,
        color: color || '#6366f1',
        updatedAt: new Date()
      })
      
      folders.value = folders.value.map(folder => 
        folder.id === folderId 
          ? { 
              ...folder, 
              name, 
              encryptedName,
              color: color || '#6366f1',
              updatedAt: new Date() 
            }
          : folder
      )
      
      return true
    } catch (error) {
      console.error('Update folder error:', error)
      return false
    }
  }

  const deleteFolder = async (folderId) => {
    try {
      await deleteDoc(doc(db, 'folders', folderId))
      
      folders.value = folders.value.filter(folder => folder.id !== folderId)
      
      // If deleted folder was selected, switch to 'all'
      if (selectedFolderId.value === folderId) {
        selectedFolderId.value = 'all'
      }
      
      return true
    } catch (error) {
      console.error('Delete folder error:', error)
      return false
    }
  }

  const selectFolder = (folderId) => {
    selectedFolderId.value = folderId
  }

  const unlockFolder = async (folderId, pin) => {
    // Check PIN against stored user settings
    if (folderId === 'secure') {
      if (pin === securePin.value) {
        lockedFolders.value.delete(folderId)
        selectedFolderId.value = folderId // Auto-select folder after unlock
        return true
      }
    }
    return false
  }

  const unlockWithMasterPassword = async (folderId, masterPassword) => {
    // Master password unlock logic - should be the user's encryption password
    // For demo purposes, we'll accept "master" as the master password
    if (masterPassword === 'master') {
      lockedFolders.value.delete(folderId)
      selectedFolderId.value = folderId // Auto-select folder after unlock
      return true
    }
    return false
  }

  const changeSecurePin = async (newPin, user, encryptionKey) => {
    if (!user?.uid || !encryptionKey) return false
    
    try {
      // Validate PIN format
      if (!newPin || !/^\d{4}$/.test(newPin)) {
        return false
      }
      
      // Update local state
      securePin.value = newPin
      
      // Save to Firebase
      const updatedSettings = { 
        ...userSettings.value, 
        securePin: newPin 
      }
      const success = await saveUserSettings(user.uid, updatedSettings, encryptionKey)
      
      if (success) {
        userSettings.value = updatedSettings
        return true
      }
      
      // Revert local state if save failed
      securePin.value = userSettings.value?.securePin || '1234'
      return false
    } catch (error) {
      console.error('Failed to change secure PIN:', error)
      // Revert local state if save failed
      securePin.value = userSettings.value?.securePin || '1234'
      return false
    }
  }

  const lockSecureFolder = async () => {
    lockedFolders.value.add('secure')
    if (selectedFolderId.value === 'secure') {
      selectedFolderId.value = 'all'
    }
    return true
  }

  const updateAiSettings = async (newAiSettings, user, encryptionKey) => {
    if (!user?.uid || !encryptionKey) return false
    
    try {
      const updatedSettings = { 
        ...userSettings.value, 
        aiSettings: { ...userSettings.value.aiSettings, ...newAiSettings }
      }
      const success = await saveUserSettings(user.uid, updatedSettings, encryptionKey)
      
      if (success) {
        userSettings.value = updatedSettings
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to update AI settings:', error)
      return false
    }
  }

  const resetFolders = () => {
    folders.value = []
    selectedFolderId.value = 'all'
    lockedFolders.value = new Set(['secure']) // Initialize secure folder as locked
    userSettings.value = {}
  }

  return {
    folders,
    selectedFolderId,
    lockedFolders,
    userSettings,
    securePin,
    loadFolders,
    loadSettings,
    createFolder,
    updateFolder,
    deleteFolder,
    selectFolder,
    unlockFolder,
    unlockWithMasterPassword,
    changeSecurePin,
    lockSecureFolder,
    updateAiSettings,
    resetFolders
  }
})