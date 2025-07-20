// debounce.js
// Utility for debouncing function calls to improve performance

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds 
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - If true, trigger the function on the leading edge
 * @returns {Function} The debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout

  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(this, args)
  }
}

/**
 * Creates a debounced function using Vue's reactivity system
 * Useful for debouncing reactive updates in Vue components
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export const debounceVue = (func, wait = 300) => {
  return debounce(func, wait, false)
}