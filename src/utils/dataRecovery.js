// utils/dataRecovery.js
import { deriveKeyFromPassword, decryptText, encryptText } from './encryption.js';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

/**
 * SIMPLE DATA EXPORT/IMPORT FOR BACKUP
 * Eksporterer og importerer dekrypterede noter til/fra læsbar JSON format
 */

// Export decrypted data to JSON for external backup
export const exportDecryptedData = async (notes, folders, password, userId) => {
  try {
    const key = await deriveKeyFromPassword(password, userId);
    const decryptedNotes = [];
    const decryptedFolders = [];

    // Decrypt all notes
    for (const note of notes) {
      const title = await decryptText(note.encryptedTitle, key);
      const content = await decryptText(note.encryptedContent, key);
      decryptedNotes.push({
        id: note.id,
        title,
        content,
        folderId: note.folderId,
        isFavorite: note.isFavorite,
        createdAt: note.createdAt?.toDate?.() || note.createdAt,
        updatedAt: note.updatedAt?.toDate?.() || note.updatedAt
      });
    }

    // Decrypt all folders
    for (const folder of folders) {
      const name = await decryptText(folder.encryptedName, key);
      decryptedFolders.push({
        id: folder.id,
        name,
        color: folder.color,
        createdAt: folder.createdAt?.toDate?.() || folder.createdAt,
        updatedAt: folder.updatedAt?.toDate?.() || folder.updatedAt
      });
    }

    return {
      exportDate: new Date().toISOString(),
      userId,
      notes: decryptedNotes,
      folders: decryptedFolders,
      metadata: {
        notesCount: decryptedNotes.length,
        foldersCount: decryptedFolders.length,
        favoriteCount: decryptedNotes.filter(n => n.isFavorite).length
      }
    };
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
};

// Import decrypted data from JSON backup (CLEAN SLATE - deletes all existing data)
export const importBackupData = async (backupJsonString, password, currentUserId, onProgress = null) => {
  try {
    // Parse and validate backup
    const backupData = JSON.parse(backupJsonString);
    
    if (!backupData.notes || !backupData.folders || !backupData.metadata) {
      throw new Error('Invalid backup format - missing required fields');
    }

    if (onProgress) onProgress({ step: 'validating', message: 'Validerer backup fil...' });

    const { notes: importNotes, folders: importFolders } = backupData;
    
    // Generate encryption key for current user
    const currentKey = await deriveKeyFromPassword(password, currentUserId);
    
    if (onProgress) onProgress({ step: 'clearing', message: 'Sletter eksisterende data...' });

    // CLEAN SLATE: Delete all existing notes and folders for current user
    await clearAllUserData(currentUserId);

    if (onProgress) onProgress({ step: 'importing', message: 'Importerer mapper...', progress: 0 });

    // Import folders first (since notes reference them)
    const folderIdMapping = {}; // Old ID -> New ID mapping
    
    for (let i = 0; i < importFolders.length; i++) {
      const folder = importFolders[i];
      
      // Encrypt folder name with current user's key
      const encryptedName = await encryptText(folder.name, currentKey);
      
      // Create new folder in Firestore
      const folderData = {
        userId: currentUserId,
        encryptedName,
        color: folder.color || '#3B82F6',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'folders'), folderData);
      folderIdMapping[folder.id] = docRef.id;
      
      if (onProgress) {
        onProgress({ 
          step: 'importing', 
          message: `Importerer mappe: ${folder.name}`,
          progress: Math.round(((i + 1) / importFolders.length) * 30) // 30% for folders
        });
      }
    }

    if (onProgress) onProgress({ step: 'importing', message: 'Importerer noter...', progress: 30 });

    // Import notes
    for (let i = 0; i < importNotes.length; i++) {
      const note = importNotes[i];
      
      // Encrypt note content with current user's key
      const encryptedTitle = await encryptText(note.title, currentKey);
      const encryptedContent = await encryptText(note.content, currentKey);
      
      // Map old folder ID to new folder ID (if folder exists)
      const mappedFolderId = note.folderId ? folderIdMapping[note.folderId] || null : null;
      
      // Create new note in Firestore
      const noteData = {
        userId: currentUserId,
        encryptedTitle,
        encryptedContent,
        folderId: mappedFolderId,
        isFavorite: note.isFavorite || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(collection(db, 'notes'), noteData);
      
      if (onProgress) {
        onProgress({ 
          step: 'importing', 
          message: `Importerer note: ${note.title.substring(0, 30)}...`,
          progress: 30 + Math.round(((i + 1) / importNotes.length) * 70) // 70% for notes
        });
      }
    }

    if (onProgress) onProgress({ step: 'complete', message: 'Import fuldført!', progress: 100 });

    return {
      success: true,
      imported: {
        notesCount: importNotes.length,
        foldersCount: importFolders.length,
        favoriteCount: importNotes.filter(n => n.isFavorite).length
      },
      originalUser: backupData.userId,
      exportDate: backupData.exportDate
    };

  } catch (error) {
    console.error('Import failed:', error);
    throw new Error(`Import fejlede: ${error.message}`);
  }
};

// Helper function to clear all user data (DESTRUCTIVE!)
const clearAllUserData = async (userId) => {
  try {
    // Delete all notes
    const notesQuery = query(collection(db, 'notes'), where('userId', '==', userId));
    const notesSnapshot = await getDocs(notesQuery);
    
    const noteDeletes = notesSnapshot.docs.map(docSnap => 
      deleteDoc(doc(db, 'notes', docSnap.id))
    );
    await Promise.all(noteDeletes);
    
    // Delete all folders
    const foldersQuery = query(collection(db, 'folders'), where('userId', '==', userId));
    const foldersSnapshot = await getDocs(foldersQuery);
    
    const folderDeletes = foldersSnapshot.docs.map(docSnap => 
      deleteDoc(doc(db, 'folders', docSnap.id))
    );
    await Promise.all(folderDeletes);
    
  } catch (error) {
    throw new Error(`Failed to clear existing data: ${error.message}`);
  }
};

// Validate backup file format
export const validateBackupFile = (backupJsonString) => {
  try {
    const backupData = JSON.parse(backupJsonString);
    
    const required = ['exportDate', 'userId', 'notes', 'folders', 'metadata'];
    const missing = required.filter(field => !(field in backupData));
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Manglende felter: ${missing.join(', ')}`
      };
    }
    
    if (!Array.isArray(backupData.notes) || !Array.isArray(backupData.folders)) {
      return {
        valid: false,
        error: 'Noter og mapper skal være arrays'
      };
    }
    
    return {
      valid: true,
      data: {
        exportDate: backupData.exportDate,
        originalUserId: backupData.userId,
        notesCount: backupData.notes.length,
        foldersCount: backupData.folders.length,
        favoriteCount: backupData.notes.filter(n => n.isFavorite).length
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      error: `Ugyldig JSON format: ${error.message}`
    };
  }
};