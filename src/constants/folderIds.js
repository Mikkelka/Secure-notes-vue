/**
 * Folder ID Constants
 *
 * Centralized folder IDs used throughout the application.
 * This prevents typos and provides autocomplete support.
 */

export const FOLDER_IDS = {
  // System folders
  ALL: 'all',
  RECENT: 'recent',
  FAVORITES: 'favorites',
  UNCATEGORIZED: 'uncategorized',
  TRASH: 'trash',

  // Special folders
  SECURE: 'secure'
}

/**
 * Check if a folder ID is a system folder (not custom)
 */
export function isSystemFolder(folderId) {
  return Object.values(FOLDER_IDS).includes(folderId)
}

/**
 * Get display name for system folders (Danish)
 */
export function getFolderDisplayName(folderId) {
  const names = {
    [FOLDER_IDS.ALL]: 'Alle noter',
    [FOLDER_IDS.RECENT]: 'Seneste',
    [FOLDER_IDS.FAVORITES]: 'Favoritter',
    [FOLDER_IDS.UNCATEGORIZED]: 'Ukategoriseret',
    [FOLDER_IDS.TRASH]: 'Papirkurv',
    [FOLDER_IDS.SECURE]: 'Sikker mappe'
  }

  return names[folderId] || folderId
}
