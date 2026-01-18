// Encryption utilities for BMNL answers (GDPR encryption-at-rest)
// Uses AES-256-GCM for authenticated encryption

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32 // 256 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Get encryption key from environment variable
 * Key should be base64-encoded 32-byte value
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.ANSWER_ENCRYPTION_KEY
  if (!keyBase64) {
    throw new Error('ANSWER_ENCRYPTION_KEY environment variable is required')
  }
  
  try {
    const key = Buffer.from(keyBase64, 'base64')
    if (key.length !== KEY_LENGTH) {
      throw new Error(`ANSWER_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes when base64-decoded`)
    }
    return key
  } catch (error) {
    throw new Error(`Invalid ANSWER_ENCRYPTION_KEY: ${error instanceof Error ? error.message : 'Invalid format'}`)
  }
}

/**
 * Encrypt text using AES-256-GCM
 * Returns base64-encoded string with format: iv:tag:encrypted_data
 */
export function encryptText(plaintext: string): string {
  if (!plaintext || plaintext.trim().length === 0) {
    return plaintext // Don't encrypt empty strings
  }
  
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const tag = cipher.getAuthTag()
  
  // Return format: iv:tag:encrypted_data (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt text encrypted with encryptText
 * Handles both encrypted (iv:tag:data format) and plaintext (legacy) strings
 */
export function decryptText(stored: string | null | undefined): string {
  if (!stored || stored.trim().length === 0) {
    return stored || ''
  }
  
  // Check if this is encrypted format (contains two colons)
  const parts = stored.split(':')
  if (parts.length !== 3) {
    // Legacy plaintext - return as-is
    return stored
  }
  
  try {
    const key = getEncryptionKey()
    const iv = Buffer.from(parts[0], 'base64')
    const tag = Buffer.from(parts[1], 'base64')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    // If decryption fails, return original (might be plaintext with colons)
    console.error('Decryption error (treating as plaintext):', error)
    return stored
  }
}

/**
 * Check if a string is encrypted (has iv:tag:data format)
 */
export function isEncrypted(stored: string | null | undefined): boolean {
  if (!stored) return false
  const parts = stored.split(':')
  return parts.length === 3
}

/**
 * Deterministically detect sensitive content in answers
 * Returns true if answer contains sexuality, identity, phobia, or explicit slurs
 */
export function isSensitiveContent(answer: string, signalFlags?: { is_phobic?: boolean }): boolean {
  if (!answer || answer.trim().length === 0) return false
  
  // If signal flags indicate phobia, mark as sensitive
  if (signalFlags?.is_phobic) return true
  
  const lowerAnswer = answer.toLowerCase()
  
  // Check for sexuality/orientation references
  const sexualityKeywords = [
    'gay', 'lesbian', 'bisexual', 'trans', 'transgender', 'queer', 'lgbtq', 'lgbt',
    'sexual orientation', 'sexuality', 'sexual identity', 'gender identity',
    'cis', 'non-binary', 'nonbinary', 'pansexual', 'asexual'
  ]
  
  // Check for phobia language or slurs (explicit exclusionary content)
  const phobiaKeywords = [
    'hate', 'disgusting', 'wrong', 'unnatural', 'abnormal', 'freak', 'pervert',
    'fag', 'tranny', 'dyke', 'homo' // explicit slurs
  ]
  
  // Check for identity-related sensitive topics
  const identityKeywords = [
    'race', 'racist', 'ethnicity', 'religion', 'religious', 'cult',
    'mental health', 'mental illness', 'depression', 'suicide', 'self-harm'
  ]
  
  const allKeywords = [...sexualityKeywords, ...phobiaKeywords, ...identityKeywords]
  
  return allKeywords.some(keyword => lowerAnswer.includes(keyword))
}



