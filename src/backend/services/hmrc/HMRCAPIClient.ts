/**
 * HMRC API Client
 * Main service for submitting RTI submissions to HMRC
 *
 * IMPORTANT COMPLIANCE NOTE:
 * All HMRC API calls MUST go through Firebase Functions (server-side proxy).
 * HMRC APIs do not support CORS, and credentials must never be exposed client-side.
 *
 * LOOSE COUPLING IMPLEMENTATION:
 * - Retry logic with exponential backoff for transient failures
 * - Circuit breaker pattern for graceful degradation
 * - Configurable timeouts and retry policies
 * - Error normalization for consistent handling
 *
 * Reference: HMRC Development Practices, ICO Encryption Guidance
 * See: HMRC_DEVELOPER_HUB_BEST_PRACTICES.md for architecture details
 */

import { functionsApp } from '../Firebase'
import { HMRCAuthService } from './HMRCAuthService'
import { FraudPreventionService } from './FraudPreventionService'
import { RTIXMLGenerator } from './RTIXMLGenerator'
import {
  FPSSubmissionData,
  EPSSubmissionData,
  EYUSubmissionData,
  FPSSubmissionResult,
  EPSSubmissionResult,
  EYUSubmissionResult,
} from './types'
import { HMRCSettings } from '../../interfaces/Company'

// Firebase Functions base URL
// In production, this should be configured via environment variables
const FUNCTIONS_BASE_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
  'https://us-central1-stop-test-8025f.cloudfunctions.net'

// ============================================================================
// LOOSE COUPLING: Retry and Circuit Breaker Configuration
// ============================================================================

/**
 * Retry configuration for HMRC API calls
 * Implements exponential backoff to handle transient failures gracefully
 */
interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  retryableStatusCodes: number[]
  retryableErrorCodes: string[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,      // Start with 1 second delay
  maxDelayMs: 30000,      // Max 30 seconds between retries
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],  // Timeout, Rate limit, Server errors
  retryableErrorCodes: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'NETWORK_ERROR']
}

/**
 * Circuit breaker state for graceful degradation
 * Prevents cascading failures when HMRC service is unavailable
 */
interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'closed' | 'open' | 'half-open'
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,      // Open circuit after 5 consecutive failures
  resetTimeoutMs: 60000,    // Try again after 60 seconds
  halfOpenMaxAttempts: 1    // Allow 1 request in half-open state
}

interface RTISubmissionResponse {
  success: boolean
  submissionId?: string
  correlationId?: string
  status: 'accepted' | 'rejected' | 'pending'
  errors?: Array<{ code: string; message: string }>
  warnings?: string[]
  submittedAt: number
  responseBody?: unknown
}

// ============================================================================
// Helper Functions for Retry and Circuit Breaker
// ============================================================================

/**
 * Delay helper for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt)
  const jitter = Math.random() * 1000  // Add up to 1 second of jitter
  return Math.min(exponentialDelay + jitter, config.maxDelayMs)
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown, httpStatus?: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  // Check HTTP status codes
  if (httpStatus && config.retryableStatusCodes.includes(httpStatus)) {
    return true
  }

  // Check error codes
  if (error instanceof Error) {
    const errorCode = (error as Error & { code?: string }).code
    if (errorCode && config.retryableErrorCodes.includes(errorCode)) {
      return true
    }
    // Network errors
    if (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('fetch')) {
      return true
    }
  }

  return false
}

export class HMRCAPIClient {
  private authService: HMRCAuthService
  private fraudPreventionService: FraudPreventionService
  private xmlGenerator: RTIXMLGenerator
  private retryConfig: RetryConfig
  private circuitBreaker: CircuitBreakerState

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.authService = new HMRCAuthService()
    this.fraudPreventionService = new FraudPreventionService()
    this.xmlGenerator = new RTIXMLGenerator()
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed'
    }
  }

  // ============================================================================
  // Circuit Breaker Methods
  // ============================================================================

  /**
   * Check if circuit breaker allows request
   * Returns true if request should proceed, false if circuit is open
   */
  private canMakeRequest(): boolean {
    const now = Date.now()

    switch (this.circuitBreaker.state) {
      case 'closed':
        return true

      case 'open':
        // Check if enough time has passed to try again
        if (now - this.circuitBreaker.lastFailureTime >= CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
          this.circuitBreaker.state = 'half-open'
          console.log('[HMRC Circuit Breaker] Transitioning to half-open state')
          return true
        }
        return false

      case 'half-open':
        return true

      default:
        return true
    }
  }

  /**
   * Record a successful request
   */
  private recordSuccess(): void {
    this.circuitBreaker.failures = 0
    this.circuitBreaker.state = 'closed'
  }

  /**
   * Record a failed request
   */
  private recordFailure(): void {
    this.circuitBreaker.failures++
    this.circuitBreaker.lastFailureTime = Date.now()

    if (this.circuitBreaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      this.circuitBreaker.state = 'open'
      console.log(`[HMRC Circuit Breaker] Circuit OPEN after ${this.circuitBreaker.failures} failures. Will retry in ${CIRCUIT_BREAKER_CONFIG.resetTimeoutMs / 1000}s`)
    }
  }

  /**
   * Get current circuit breaker status (for monitoring/debugging)
   */
  getCircuitBreakerStatus(): { state: string; failures: number; isAvailable: boolean } {
    return {
      state: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      isAvailable: this.canMakeRequest()
    }
  }

  /**
   * Manually reset the circuit breaker (for admin/testing purposes)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed'
    }
    console.log('[HMRC Circuit Breaker] Manually reset to closed state')
  }

  /**
   * Submit FPS (Full Payment Submission) via Firebase Functions proxy
   * @param firebaseIdToken - Required for server-side auth verification
   */
  async submitFPS(
    data: FPSSubmissionData,
    hmrcSettings: HMRCSettings,
    companyId: string,
    firebaseIdToken: string,
    userId?: string,
    siteId?: string,
    subsiteId?: string
  ): Promise<FPSSubmissionResult> {
    try {
      // 1. Validate we have required settings
      if (!hmrcSettings.hmrcAccessToken) {
        return {
          success: false,
          status: 'rejected',
          errors: [{
            code: 'AUTH_REQUIRED',
            message: 'HMRC OAuth authorization required. Please complete the OAuth flow first.'
          }],
          submittedAt: Date.now()
        }
      }

      // 2. Generate FPS XML
      const xml = this.xmlGenerator.generateFPS(data)

      // 3. Validate XML locally before sending
      const validation = this.xmlGenerator.validateXML(xml)
      if (!validation.valid) {
        return {
          success: false,
          status: 'rejected',
          errors: validation.errors.map(msg => ({
            code: 'VALIDATION_ERROR',
            message: msg
          })),
          submittedAt: Date.now()
        }
      }

      // 4. Get fraud prevention headers (collected client-side)
      const fraudHeaders = this.fraudPreventionService.generateHeaders(userId)

      // 5. Submit via Firebase Functions proxy
      const result = await this.submitViaProxy({
        type: 'FPS',
        companyId,
        siteId,
        subsiteId,
        employerPAYEReference: hmrcSettings.employerPAYEReference,
        accountsOfficeReference: hmrcSettings.accountsOfficeReference,
        environment: hmrcSettings.hmrcEnvironment || 'sandbox',
        xmlPayload: xml,
        accessToken: hmrcSettings.hmrcAccessToken,
        fraudPreventionHeaders: fraudHeaders,
        firebaseIdToken,
      })

      return result as FPSSubmissionResult
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error submitting FPS:', errorMessage)
      return {
        success: false,
        status: 'rejected',
        errors: [{
          code: 'EXCEPTION',
          message: errorMessage || 'Unknown error during FPS submission'
        }],
        submittedAt: Date.now()
      }
    }
  }

  /**
   * Submit EPS (Employer Payment Summary) via Firebase Functions proxy
   * @param firebaseIdToken - Required for server-side auth verification
   */
  async submitEPS(
    data: EPSSubmissionData,
    hmrcSettings: HMRCSettings,
    companyId: string,
    firebaseIdToken: string,
    userId?: string,
    siteId?: string,
    subsiteId?: string
  ): Promise<EPSSubmissionResult> {
    try {
      // 1. Validate we have required settings
      if (!hmrcSettings.hmrcAccessToken) {
        return {
          success: false,
          status: 'rejected',
          errors: [{
            code: 'AUTH_REQUIRED',
            message: 'HMRC OAuth authorization required. Please complete the OAuth flow first.'
          }],
          submittedAt: Date.now()
        }
      }

      // 2. Generate EPS XML
      const xml = this.xmlGenerator.generateEPS(data)

      // 3. Validate XML locally before sending
      const validation = this.xmlGenerator.validateXML(xml)
      if (!validation.valid) {
        return {
          success: false,
          status: 'rejected',
          errors: validation.errors.map(msg => ({
            code: 'VALIDATION_ERROR',
            message: msg
          })),
          submittedAt: Date.now()
        }
      }

      // 4. Get fraud prevention headers (collected client-side)
      const fraudHeaders = this.fraudPreventionService.generateHeaders(userId)

      // 5. Submit via Firebase Functions proxy
      const result = await this.submitViaProxy({
        type: 'EPS',
        companyId,
        siteId,
        subsiteId,
        employerPAYEReference: hmrcSettings.employerPAYEReference,
        accountsOfficeReference: hmrcSettings.accountsOfficeReference,
        environment: hmrcSettings.hmrcEnvironment || 'sandbox',
        xmlPayload: xml,
        accessToken: hmrcSettings.hmrcAccessToken,
        fraudPreventionHeaders: fraudHeaders,
        firebaseIdToken,
      })

      return result as EPSSubmissionResult
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error submitting EPS:', errorMessage)
      return {
        success: false,
        status: 'rejected',
        errors: [{
          code: 'EXCEPTION',
          message: errorMessage || 'Unknown error during EPS submission'
        }],
        submittedAt: Date.now()
      }
    }
  }

  /**
   * Submit EYU (Earlier Year Update) via Firebase Functions proxy
   * @param firebaseIdToken - Required for server-side auth verification
   */
  async submitEYU(
    data: EYUSubmissionData,
    hmrcSettings: HMRCSettings,
    companyId: string,
    firebaseIdToken: string,
    userId?: string,
    siteId?: string,
    subsiteId?: string
  ): Promise<EYUSubmissionResult> {
    try {
      // 1. Validate we have required settings
      if (!hmrcSettings.hmrcAccessToken) {
        return {
          success: false,
          status: 'rejected',
          errors: [{
            code: 'AUTH_REQUIRED',
            message: 'HMRC OAuth authorization required. Please complete the OAuth flow first.'
          }],
          submittedAt: Date.now()
        }
      }

      // 2. Generate EYU XML
      const xml = this.xmlGenerator.generateEYU(data)

      // 3. Validate XML locally before sending
      const validation = this.xmlGenerator.validateXML(xml)
      if (!validation.valid) {
        return {
          success: false,
          status: 'rejected',
          errors: validation.errors.map(msg => ({
            code: 'VALIDATION_ERROR',
            message: msg
          })),
          submittedAt: Date.now()
        }
      }

      // 4. Get fraud prevention headers (collected client-side)
      const fraudHeaders = this.fraudPreventionService.generateHeaders(userId)

      // 5. Submit via Firebase Functions proxy
      const result = await this.submitViaProxy({
        type: 'EYU',
        companyId,
        siteId,
        subsiteId,
        employerPAYEReference: hmrcSettings.employerPAYEReference,
        accountsOfficeReference: hmrcSettings.accountsOfficeReference,
        environment: hmrcSettings.hmrcEnvironment || 'sandbox',
        xmlPayload: xml,
        accessToken: hmrcSettings.hmrcAccessToken,
        fraudPreventionHeaders: fraudHeaders,
        firebaseIdToken,
      })

      return result as EYUSubmissionResult
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error submitting EYU:', errorMessage)
      return {
        success: false,
        status: 'rejected',
        errors: [{
          code: 'EXCEPTION',
          message: errorMessage || 'Unknown error during EYU submission'
        }],
        submittedAt: Date.now()
      }
    }
  }

  /**
   * Check submission status via Firebase Functions proxy
   * @param firebaseIdToken - Required for server-side auth verification
   */
  async checkSubmissionStatus(
    submissionId: string,
    hmrcSettings: HMRCSettings,
    companyId: string,
    firebaseIdToken: string,
    userId?: string
  ): Promise<unknown> {
    try {
      if (!hmrcSettings.hmrcAccessToken) {
        throw new Error('HMRC OAuth authorization required')
      }

      const response = await fetch(`${FUNCTIONS_BASE_URL}/checkRTIStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({
          submissionId,
          employerPAYEReference: hmrcSettings.employerPAYEReference,
          environment: hmrcSettings.hmrcEnvironment || 'sandbox',
          accessToken: hmrcSettings.hmrcAccessToken,
          companyId,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return result.status
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error checking submission status:', errorMessage)
      throw error
    }
  }

  /**
   * Get HMRC OAuth authorization URL
   * Uses Firebase Functions to keep client ID server-side
   * @param firebaseIdToken - Required for server-side auth verification
   */
  async getAuthorizationUrl(
    redirectUri: string,
    firebaseIdToken: string,
    environment: 'sandbox' | 'production' = 'sandbox',
    scope: string = 'write:paye-employer-paye-employer'
  ): Promise<{ authUrl: string; state: string }> {
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/getHMRCAuthUrl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({
          redirectUri,
          environment,
          scope,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return {
        authUrl: result.authUrl,
        state: result.state,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error getting HMRC auth URL:', errorMessage)
      throw error
    }
  }

  /**
   * Exchange authorization code for tokens via Firebase Functions
   * @param firebaseIdToken - Required for server-side auth verification
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    firebaseIdToken: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
    scope: string
  }> {
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/exchangeHMRCToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({
          code,
          redirectUri,
          environment,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return result.tokens
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error exchanging HMRC code for tokens:', errorMessage)
      throw error
    }
  }

  /**
   * Refresh access token via Firebase Functions
   * @param firebaseIdToken - Required for server-side auth verification
   */
  async refreshAccessToken(
    refreshToken: string,
    firebaseIdToken: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
    scope: string
  }> {
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/refreshHMRCToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({
          refreshToken,
          environment,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return result.tokens
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error refreshing HMRC token:', errorMessage)
      throw error
    }
  }

  /**
   * Submit RTI via Firebase Functions proxy with retry logic and circuit breaker
   *
   * LOOSE COUPLING: This method implements resilience patterns:
   * - Circuit breaker: Prevents cascading failures when HMRC is unavailable
   * - Retry with exponential backoff: Handles transient failures gracefully
   * - Error normalization: Consistent error handling regardless of failure type
   *
   * This is the main method that routes all HMRC submissions through server-side
   */
  private async submitViaProxy(request: {
    type: 'FPS' | 'EPS' | 'EYU'
    companyId: string
    siteId?: string
    subsiteId?: string
    employerPAYEReference: string
    accountsOfficeReference: string
    environment: 'sandbox' | 'production'
    xmlPayload: string
    accessToken: string
    fraudPreventionHeaders: Record<string, string>
    /** Firebase ID token for server-side auth verification (required) */
    firebaseIdToken: string
  }): Promise<RTISubmissionResponse> {
    // Check circuit breaker first
    if (!this.canMakeRequest()) {
      console.log(`[HMRC API] Circuit breaker OPEN - rejecting ${request.type} submission`)
      return {
        success: false,
        status: 'rejected',
        errors: [{
          code: 'SERVICE_UNAVAILABLE',
          message: 'HMRC service is temporarily unavailable. Please try again in a few minutes.'
        }],
        submittedAt: Date.now()
      }
    }

    let lastError: Error | null = null
    let lastHttpStatus: number | undefined

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delayMs = calculateBackoffDelay(attempt - 1, this.retryConfig)
          console.log(`[HMRC API] Retry attempt ${attempt}/${this.retryConfig.maxRetries} for ${request.type} after ${delayMs}ms delay`)
          await delay(delayMs)
        }

        const { firebaseIdToken, ...body } = request
        const response = await fetch(`${FUNCTIONS_BASE_URL}/submitRTI`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firebaseIdToken}`,
          },
          body: JSON.stringify(body)
        })

        lastHttpStatus = response.status
        const result = await response.json()

        // Check if response indicates a retryable error
        if (!response.ok && !result.success) {
          // Determine if we should retry this error
          if (isRetryableError(null, response.status, this.retryConfig) && attempt < this.retryConfig.maxRetries) {
            console.log(`[HMRC API] Retryable error (HTTP ${response.status}) for ${request.type}`)
            lastError = new Error(`HTTP ${response.status}: ${result.error || 'Server error'}`)
            continue  // Retry
          }

          // Non-retryable error or max retries reached
          this.recordFailure()
          return {
            success: false,
            status: 'rejected',
            errors: result.errors || [{
              code: 'PROXY_ERROR',
              message: result.error || `HTTP ${response.status}`
            }],
            submittedAt: Date.now()
          }
        }

        // Success!
        this.recordSuccess()
        if (attempt > 0) {
          console.log(`[HMRC API] ${request.type} submission succeeded on retry attempt ${attempt}`)
        }
        return result as RTISubmissionResponse

      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Check if this is a retryable network error
        if (isRetryableError(error, lastHttpStatus, this.retryConfig) && attempt < this.retryConfig.maxRetries) {
          console.log(`[HMRC API] Retryable network error for ${request.type}: ${lastError.message}`)
          continue  // Retry
        }

        // Non-retryable error or max retries reached
        console.error(`[HMRC API] Non-retryable error for ${request.type}:`, lastError.message)
        break
      }
    }

    // All retries exhausted
    this.recordFailure()
    console.error(`[HMRC API] All ${this.retryConfig.maxRetries} retries exhausted for ${request.type}`)

    return {
      success: false,
      status: 'rejected',
      errors: [{
        code: 'MAX_RETRIES_EXCEEDED',
        message: lastError?.message || 'Maximum retry attempts exceeded. Please try again later.'
      }],
      submittedAt: Date.now()
    }
  }

  /**
   * Check if HMRC OAuth is configured and valid
   */
  async isOAuthConfigured(hmrcSettings: HMRCSettings): Promise<boolean> {
    if (!hmrcSettings.hmrcAccessToken) {
      return false
    }

    // Check if token is expired
    if (hmrcSettings.hmrcTokenExpiry) {
      const now = Math.floor(Date.now() / 1000)
      const bufferSeconds = 300 // 5 minutes buffer
      if (hmrcSettings.hmrcTokenExpiry <= now + bufferSeconds) {
        // Token expired or about to expire
        if (hmrcSettings.hmrcRefreshToken) {
          // Can refresh
          return true
        }
        return false
      }
    }

    return true
  }

  /**
   * Get valid access token, refreshing if needed
   * @param firebaseIdToken - Required when refresh is needed (for server-side auth verification)
   */
  async getValidAccessToken(
    hmrcSettings: HMRCSettings,
    onTokenRefresh?: (newTokens: {
      access_token: string
      refresh_token: string
      expires_in: number
    }) => Promise<void>,
    firebaseIdToken?: string
  ): Promise<string> {
    if (!hmrcSettings.hmrcAccessToken) {
      throw new Error('HMRC OAuth not configured')
    }

    // Check if token is expired or about to expire
    if (hmrcSettings.hmrcTokenExpiry) {
      const now = Math.floor(Date.now() / 1000)
      const bufferSeconds = 300 // 5 minutes buffer

      if (hmrcSettings.hmrcTokenExpiry <= now + bufferSeconds) {
        // Need to refresh
        if (!hmrcSettings.hmrcRefreshToken) {
          throw new Error('Token expired and no refresh token available')
        }
        if (!firebaseIdToken) {
          throw new Error('Firebase ID token required to refresh HMRC token')
        }

        const newTokens = await this.refreshAccessToken(
          hmrcSettings.hmrcRefreshToken,
          firebaseIdToken,
          hmrcSettings.hmrcEnvironment || 'sandbox'
        )

        // Notify caller of new tokens so they can save them
        if (onTokenRefresh) {
          await onTokenRefresh(newTokens)
        }

        return newTokens.access_token
      }
    }

    return hmrcSettings.hmrcAccessToken
  }
}
