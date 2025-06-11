// utils/encryption.js
const PBKDF2_ITERATIONS = Number(import.meta.env.VITE_PBKDF2_ITERATIONS) || 210000; // OWASP anbefaling 2023 for PBKDF2-SHA256
const SALT_PREFIX = import.meta.env.VITE_ENCRYPTION_VERSION || 'securenotes_v1_'; // Versionering for fremtidig migration

export const deriveKeyFromPassword = async (password, userId) => {
  try {
    const encoder = new TextEncoder();
    const salt = SALT_PREFIX + userId; // Unik salt per bruger
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw new Error('Kunne ikke generere krypteringsnøgle');
  }
};

export const encryptText = async (text, key) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generer tilfældig IV for hver kryptering
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    
    // Kombiner IV og krypteret data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // Base64 encode for nem lagring
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Kunne ikke kryptere data');
  }
};

export const decryptText = async (encryptedData, key) => {
  try {
    // Base64 decode
    const data = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    
    // Ekstraher IV og krypteret data
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Kunne ikke dekryptere data - forkert password?');
  }
};

// Hjælpefunktion til at verificere password
export const verifyPassword = async (password, userId, testData) => {
  try {
    const key = await deriveKeyFromPassword(password, userId);
    await decryptText(testData, key);
    return true;
  } catch {
    return false;
  }
};

// Generer en test-streng til password verifikation
export const generatePasswordVerifier = async (password, userId) => {
  const key = await deriveKeyFromPassword(password, userId);
  return encryptText('password_verifier', key);
};