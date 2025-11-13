/**
 * Folder Color Constants
 *
 * Centralized folder colors used throughout the application.
 * Provides consistent styling for folder icons and badges.
 */

export const FOLDER_COLORS = [
  {
    name: 'blue',
    class: 'text-blue-400 bg-blue-500/20',
    iconClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20'
  },
  {
    name: 'purple',
    class: 'text-purple-400 bg-purple-500/20',
    iconClass: 'text-purple-400',
    bgClass: 'bg-purple-500/20'
  },
  {
    name: 'green',
    class: 'text-green-400 bg-green-500/20',
    iconClass: 'text-green-400',
    bgClass: 'bg-green-500/20'
  },
  {
    name: 'yellow',
    class: 'text-yellow-400 bg-yellow-500/20',
    iconClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/20'
  },
  {
    name: 'red',
    class: 'text-red-400 bg-red-500/20',
    iconClass: 'text-red-400',
    bgClass: 'bg-red-500/20'
  },
  {
    name: 'pink',
    class: 'text-pink-400 bg-pink-500/20',
    iconClass: 'text-pink-400',
    bgClass: 'bg-pink-500/20'
  }
]

/**
 * Get color configuration by name
 */
export function getFolderColor(colorName) {
  return FOLDER_COLORS.find(c => c.name === colorName) || FOLDER_COLORS[0]
}

/**
 * Get CSS class for a folder color
 */
export function getFolderColorClass(colorName) {
  const color = getFolderColor(colorName)
  return color.class
}

/**
 * Default folder color
 */
export const DEFAULT_FOLDER_COLOR = FOLDER_COLORS[0].name
