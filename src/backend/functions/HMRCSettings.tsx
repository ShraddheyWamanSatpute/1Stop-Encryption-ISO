/**
 * HMRC Settings Database Functions
 * Functions to fetch and update HMRC settings per company/site/subsite
 * Supports hierarchy: subsite → site → company
 *
 * Security:
 * - OAuth tokens are encrypted at rest using AES-256-GCM
 * - Encryption key must be initialized before token operations
 * - See HMRCTokenEncryption.ts for encryption implementation
 */

import { ref, get, set, update } from 'firebase/database'
import { db } from '../services/Firebase'
import { HMRCSettings } from '../interfaces/Company'
import { hmrcTokenEncryption, EncryptedHMRCTokens } from '../services/hmrc/HMRCTokenEncryption'

/**
 * Get the path for HMRC settings at a specific level
 */
function getHMRCSettingsPath(
  companyId: string,
  siteId: string | null,
  subsiteId: string | null,
  level: "company" | "site" | "subsite"
): string {
  if (level === "subsite" && subsiteId && siteId) {
    return `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}/data/company/hmrcSettings`
  } else if (level === "site" && siteId) {
    return `companies/${companyId}/sites/${siteId}/data/company/hmrcSettings`
  } else {
    return `companies/${companyId}/data/company/hmrcSettings`
  }
}

/**
 * Fetch HMRC settings with hierarchy fallback (subsite → site → company)
 * Returns the first found settings and indicates where they were found
 */
export async function fetchHMRCSettings(
  companyId: string,
  siteId: string | null,
  subsiteId?: string | null
): Promise<{ settings: HMRCSettings | null; foundAt: "subsite" | "site" | "company" | null }> {
  try {
    // Check hierarchy: subsite → site → company
    const paths: Array<{ path: string; level: "subsite" | "site" | "company" }> = []
    
    // 1. Check subsite level (if subsiteId provided)
    if (subsiteId && siteId) {
      paths.push({
        path: getHMRCSettingsPath(companyId, siteId, subsiteId, "subsite"),
        level: "subsite"
      })
    }
    
    // 2. Check site level (if siteId provided)
    if (siteId) {
      paths.push({
        path: getHMRCSettingsPath(companyId, siteId, null, "site"),
        level: "site"
      })
    }
    
    // 3. Check company level
    paths.push({
      path: getHMRCSettingsPath(companyId, null, null, "company"),
      level: "company"
    })
    
    // Try each path in order
    for (const { path, level } of paths) {
      const settingsRef = ref(db, path)
      const snapshot = await get(settingsRef)
      
      if (snapshot.exists()) {
        const settings = snapshot.val() as HMRCSettings
        // Ensure the foundAt field is set
        if (!settings.configuredAt) {
          settings.configuredAt = level
        }
        return { settings, foundAt: level }
      }
    }
    
    return { settings: null, foundAt: null }
  } catch (error) {
    console.error('Error fetching HMRC settings:', error)
    throw error
  }
}

/**
 * Create or update HMRC settings at specified level
 */
export async function saveHMRCSettings(
  companyId: string,
  siteId: string | null,
  subsiteId: string | null,
  level: "company" | "site" | "subsite",
  settings: Partial<HMRCSettings>
): Promise<void> {
  try {
    const path = getHMRCSettingsPath(companyId, siteId, subsiteId, level)
    const settingsRef = ref(db, path)
    const existing = await get(settingsRef)
    
    const updatedSettings: Partial<HMRCSettings> = {
      ...settings,
      level,
      configuredAt: level,
      updatedAt: Date.now()
    }
    
    if (existing.exists()) {
      await update(settingsRef, updatedSettings)
    } else {
      await set(settingsRef, {
        ...updatedSettings,
        createdAt: Date.now()
      })
    }
  } catch (error) {
    console.error('Error saving HMRC settings:', error)
    throw error
  }
}

/**
 * Update OAuth tokens after authorization
 * Uses hierarchy to find where settings are stored
 *
 * SECURITY: Tokens are encrypted at rest using AES-256-GCM
 * The encryption key must be initialized via initializeTokenEncryption() before calling this function.
 */
export async function updateHMRCTokens(
  companyId: string,
  siteId: string | null,
  subsiteId: string | null,
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
): Promise<void> {
  try {
    // Find where settings are stored
    const { settings, foundAt } = await fetchHMRCSettings(companyId, siteId, subsiteId)

    if (!settings || !foundAt) {
      throw new Error('HMRC settings not found. Please configure HMRC settings first.')
    }

    // Update tokens at the same level where settings are stored
    const path = getHMRCSettingsPath(companyId, siteId, subsiteId, foundAt)
    const settingsRef = ref(db, path)

    // Check if encryption is initialized
    if (hmrcTokenEncryption.isInitialized()) {
      // Encrypt tokens before storage
      const encryptedTokens = await hmrcTokenEncryption.encryptTokens(tokens)

      await update(settingsRef, {
        hmrcAccessToken: encryptedTokens.hmrcAccessToken,
        hmrcRefreshToken: encryptedTokens.hmrcRefreshToken,
        hmrcTokenExpiry: encryptedTokens.hmrcTokenExpiry,
        lastHMRCAuthDate: encryptedTokens.lastHMRCAuthDate,
        isEncrypted: true,
        encryptionVersion: 'v1',
        updatedAt: Date.now()
      })

      console.log('[HMRC Settings] Tokens stored with encryption')
    } else {
      // Fallback: Store without encryption (with warning)
      console.warn('[HMRC Settings] WARNING: Storing tokens without encryption. Initialize encryption for compliance.')

      const expiryTime = Date.now() + (tokens.expiresIn * 1000)

      await update(settingsRef, {
        hmrcAccessToken: tokens.accessToken,
        hmrcRefreshToken: tokens.refreshToken,
        hmrcTokenExpiry: expiryTime,
        lastHMRCAuthDate: Date.now(),
        isEncrypted: false,
        updatedAt: Date.now()
      })
    }
  } catch (error) {
    console.error('Error updating HMRC tokens:', error)
    throw error
  }
}

/**
 * Initialize token encryption service
 *
 * IMPORTANT: Must be called before any token operations.
 * The encryption key should come from a secure source:
 * - Server-side: Firebase Secrets
 * - Client-side: Received from authenticated server endpoint
 *
 * @param encryptionKey - AES-256 encryption key (min 32 characters)
 */
export function initializeTokenEncryption(encryptionKey: string): void {
  hmrcTokenEncryption.initialize(encryptionKey)
}

/**
 * Get decrypted access token for API calls
 *
 * @returns Decrypted access token or null if not available
 */
export async function getDecryptedAccessToken(
  companyId: string,
  siteId: string | null,
  subsiteId?: string | null
): Promise<{ accessToken: string; expiresAt: number } | null> {
  const { settings } = await fetchHMRCSettings(companyId, siteId, subsiteId)

  if (!settings?.hmrcAccessToken) {
    return null
  }

  // Check if tokens are encrypted
  if ((settings as HMRCSettings & { isEncrypted?: boolean }).isEncrypted) {
    if (!hmrcTokenEncryption.isInitialized()) {
      throw new Error('Token encryption service not initialized. Cannot decrypt tokens.')
    }

    const decrypted = await hmrcTokenEncryption.decryptTokens({
      hmrcAccessToken: settings.hmrcAccessToken,
      hmrcRefreshToken: settings.hmrcRefreshToken || '',
      hmrcTokenExpiry: settings.hmrcTokenExpiry || 0,
      isEncrypted: true
    })

    return {
      accessToken: decrypted.accessToken,
      expiresAt: decrypted.expiresAt
    }
  }

  // Unencrypted tokens (legacy)
  return {
    accessToken: settings.hmrcAccessToken,
    expiresAt: settings.hmrcTokenExpiry || 0
  }
}

