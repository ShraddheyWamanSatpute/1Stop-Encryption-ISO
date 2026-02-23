/**
 * Encryption Initializer Component
 *
 * Initializes all encryption services at app startup.
 * This component should be placed near the root of the app.
 *
 * It reads encryption keys from environment variables and initializes:
 * - SensitiveDataService (for employee/payroll/company data)
 * - SecureTokenStorage (for OAuth tokens)
 * - HMRCTokenEncryption (for HMRC tokens)
 */

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { sensitiveDataService } from './SensitiveDataService'
import { secureTokenStorage } from '../oauth/SecureTokenStorage'

interface EncryptionContextType {
  isInitialized: boolean
  isInitializing: boolean
  error: string | null
  services: {
    sensitiveData: boolean
    tokenStorage: boolean
  }
}

const EncryptionContext = createContext<EncryptionContextType>({
  isInitialized: false,
  isInitializing: true,
  error: null,
  services: {
    sensitiveData: false,
    tokenStorage: false
  }
})

/**
 * Hook to check encryption initialization status
 */
export function useEncryption(): EncryptionContextType {
  return useContext(EncryptionContext)
}

/**
 * Get encryption key from environment
 *
 * Tries multiple environment variable names for flexibility
 */
function getEncryptionKey(): string | null {
  // For Vite applications
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env

  if (viteEnv) {
    // Try in order of specificity
    const keyNames = [
      'VITE_GENERAL_ENCRYPTION_KEY',
      'VITE_HMRC_ENCRYPTION_KEY',
      'VITE_EMPLOYEE_DATA_KEY',
      'VITE_EMPLOYEE_DATA_ENCRYPTION_KEY'
    ]

    for (const keyName of keyNames) {
      const key = viteEnv[keyName]
      if (key && key.length >= 32) {
        console.log(`[EncryptionInitializer] Using encryption key from ${keyName}`)
        return key
      }
    }
  }

  // For Node.js environments (server-side)
  if (typeof process !== 'undefined' && process.env) {
    const keyNames = [
      'GENERAL_ENCRYPTION_KEY',
      'HMRC_ENCRYPTION_KEY',
      'EMPLOYEE_DATA_KEY'
    ]

    for (const keyName of keyNames) {
      const key = process.env[keyName]
      if (key && key.length >= 32) {
        console.log(`[EncryptionInitializer] Using encryption key from ${keyName}`)
        return key
      }
    }
  }

  return null
}

interface EncryptionProviderProps {
  children: ReactNode
}

/**
 * Encryption Provider Component
 *
 * Wraps children and provides encryption context.
 * Initializes encryption services on mount.
 */
export function EncryptionProvider({ children }: EncryptionProviderProps) {
  const [state, setState] = useState<EncryptionContextType>({
    isInitialized: false,
    isInitializing: true,
    error: null,
    services: {
      sensitiveData: false,
      tokenStorage: false
    }
  })

  useEffect(() => {
    const initializeEncryption = async () => {
      const key = getEncryptionKey()

      if (!key) {
        console.warn(
          '[EncryptionInitializer] No encryption key found in environment. ' +
          'Encryption will be disabled. Set VITE_GENERAL_ENCRYPTION_KEY in .env file.'
        )
        setState({
          isInitialized: false,
          isInitializing: false,
          error: 'No encryption key configured',
          services: {
            sensitiveData: false,
            tokenStorage: false
          }
        })
        return
      }

      if (key.length < 32) {
        console.error(
          '[EncryptionInitializer] Encryption key is too short. ' +
          'Key must be at least 32 characters for AES-256 encryption.'
        )
        setState({
          isInitialized: false,
          isInitializing: false,
          error: 'Encryption key too short (minimum 32 characters)',
          services: {
            sensitiveData: false,
            tokenStorage: false
          }
        })
        return
      }

      const services = {
        sensitiveData: false,
        tokenStorage: false
      }

      // Initialize SensitiveDataService
      try {
        sensitiveDataService.initialize(key)
        services.sensitiveData = true
        console.log('[EncryptionInitializer] SensitiveDataService initialized')
      } catch (error) {
        console.error('[EncryptionInitializer] Failed to initialize SensitiveDataService:', error)
      }

      // Initialize SecureTokenStorage
      try {
        secureTokenStorage.initialize(key)
        services.tokenStorage = true
        console.log('[EncryptionInitializer] SecureTokenStorage initialized')
      } catch (error) {
        console.error('[EncryptionInitializer] Failed to initialize SecureTokenStorage:', error)
      }

      const isInitialized = services.sensitiveData || services.tokenStorage

      setState({
        isInitialized,
        isInitializing: false,
        error: isInitialized ? null : 'Failed to initialize encryption services',
        services
      })

      if (isInitialized) {
        console.log('[EncryptionInitializer] Encryption services initialized successfully')
        // Expose for debugging in development
        if (import.meta.env.DEV) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as unknown as Record<string, unknown>).__encryptionStatus = {
            initialized: true,
            services,
            sensitiveDataService: {
              isInitialized: sensitiveDataService.isInitialized()
            }
          }
        }
      }
    }

    initializeEncryption()
  }, [])

  return (
    <EncryptionContext.Provider value={state}>
      {children}
    </EncryptionContext.Provider>
  )
}

/**
 * Export for direct use without provider (e.g., in scripts)
 */
export function initializeEncryptionDirect(): boolean {
  const key = getEncryptionKey()

  if (!key || key.length < 32) {
    console.error('[EncryptionInitializer] Invalid or missing encryption key')
    return false
  }

  try {
    sensitiveDataService.initialize(key)
    secureTokenStorage.initialize(key)
    console.log('[EncryptionInitializer] Encryption initialized directly')
    return true
  } catch (error) {
    console.error('[EncryptionInitializer] Direct initialization failed:', error)
    return false
  }
}
