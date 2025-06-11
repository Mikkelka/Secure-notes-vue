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
  orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { encryptText, decryptText } from '../utils/encryption'

export const useFoldersStore = defineStore('folders', () => {
  const folders = ref([])
  const selectedFolderId = ref('all')
  const lockedFolders = ref(new Set())
  const userSettings = ref({})

  const loadFolders = async (user, encryptionKey) => {
    try {
      const foldersRef = collection(db, 'folders')
      const q = query(
        foldersRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc')
      )
      
      const querySnapshot = await getDocs(q)
      const decryptedFolders = []
      
      for (const docSnapshot of querySnapshot.docs) {
        const folderData = docSnapshot.data()
        try {
          const decryptedName = await decryptText(folderData.encryptedName, encryptionKey)
          
          decryptedFolders.push({
            id: docSnapshot.id,
            name: decryptedName,
            encryptedName: folderData.encryptedName,
            color: folderData.color || '#6366f1',
            createdAt: folderData.createdAt.toDate(),
            updatedAt: folderData.updatedAt.toDate()
          })
        } catch (error) {
          console.error('Failed to decrypt folder:', docSnapshot.id, error)
        }
      }
      
      folders.value = decryptedFolders
    } catch (error) {
      console.error('Load folders error:', error)
    }
  }

  const createFolder = async (name, color, user, encryptionKey) => {
    if (!name.trim() || !encryptionKey || !user) return false
    
    try {
      const encryptedName = await encryptText(name, encryptionKey)
      
      const folderData = {
        userId: user.uid,
        encryptedName,
        color: color || '#6366f1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
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
      return true
    } catch (error) {
      console.error('Create folder error:', error)
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
    // Simple PIN check for secure folder
    if (folderId === 'secure') {
      // In a real app, you'd verify the PIN against stored hash
      if (pin && pin.length === 4) {
        lockedFolders.value.delete(folderId)
        return true
      }
    }
    return false
  }

  const unlockWithMasterPassword = async (folderId, masterPassword) => {
    // Master password unlock logic
    if (masterPassword && masterPassword.length > 0) {
      lockedFolders.value.delete(folderId)
      return true
    }
    return false
  }

  const changeSecurePin = async (newPin) => {
    // Change PIN logic - in real app would hash and store
    if (newPin && /^\d{4}$/.test(newPin)) {
      return true
    }
    return false
  }

  const lockSecureFolder = async () => {
    lockedFolders.value.add('secure')
    if (selectedFolderId.value === 'secure') {
      selectedFolderId.value = 'all'
    }
    return true
  }

  const updateAiSettings = (settings) => {
    userSettings.value = {
      ...userSettings.value,
      ...settings
    }
  }

  const resetFolders = () => {
    folders.value = []
    selectedFolderId.value = 'all'
    lockedFolders.value = new Set()
    userSettings.value = {}
  }

  return {
    folders,
    selectedFolderId,
    lockedFolders,
    userSettings,
    loadFolders,
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