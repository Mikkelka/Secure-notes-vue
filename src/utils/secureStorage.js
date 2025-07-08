// utils/secureStorage.js
// Centralized encryption key management with automatic session timeout

export class SecureStorage {
  static encryptionKey = null;
  static sessionTimeout = null;
  static logoutCallback = null;
  
  /**
   * Set the encryption key and start session timeout
   * @param {string} key - The encryption key
   * @param {Function} onTimeout - Callback function to call when session times out
   */
  static setEncryptionKey(key, onTimeout = null) {
    if (!key) {
      throw new Error('Encryption key cannot be null or empty');
    }
    
    this.encryptionKey = key;
    this.logoutCallback = onTimeout;
    this.resetSessionTimeout();
  }
  
  /**
   * Get the current encryption key
   * @returns {string} The encryption key
   * @throws {Error} If no encryption key is available
   */
  static getEncryptionKey() {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available - user may need to login again');
    }
    return this.encryptionKey;
  }
  
  /**
   * Check if encryption key is available
   * @returns {boolean} True if key is available
   */
  static hasEncryptionKey() {
    return this.encryptionKey !== null;
  }
  
  /**
   * Clear the encryption key and cancel timeout
   */
  static clearEncryptionKey() {
    this.encryptionKey = null;
    this.logoutCallback = null;
    
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }
  
  /**
   * Reset the session timeout (extends the session)
   */
  static resetSessionTimeout() {
    // Clear existing timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Set new timeout (30 minutes)
    this.sessionTimeout = setTimeout(() => {
      console.warn('Session timed out - clearing encryption key only (Firebase auth preserved)');
      
      // Only clear in-memory encryption key, preserve Firebase auth and localStorage
      this.encryptionKey = null;
      this.logoutCallback = null;
      
      // Clear the timeout reference
      this.sessionTimeout = null;
      
      // NOTE: We do NOT call logout callback to preserve Firebase persistence
      // User will need to re-authenticate encryption key on next activity
    }, 30 * 60 * 1000); // 30 minutes
  }
  
  /**
   * Extend the session by resetting the timeout
   * Should be called on user activity
   */
  static extendSession() {
    if (this.hasEncryptionKey()) {
      this.resetSessionTimeout();
    }
  }
  
  /**
   * Get remaining session time in milliseconds
   * @returns {number|null} Time remaining or null if no active session
   */
  static getRemainingSessionTime() {
    // This is a simplified implementation
    // In a real app, you might want to track the start time
    return this.hasEncryptionKey() ? 30 * 60 * 1000 : null;
  }
}

// Export a convenience function for checking if user is authenticated
export const isAuthenticated = () => SecureStorage.hasEncryptionKey();

// Export a convenience function for extending session on user activity
export const extendSession = () => SecureStorage.extendSession();