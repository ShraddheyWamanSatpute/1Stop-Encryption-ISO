/**
 * Lightspeed Retail (X-Series) OAuth 2.0 Authentication Service
 * Handles OAuth 2.0 authentication flow for Lightspeed Retail API
 */

import { POSOAuthTokenResponse, POSOAuthErrorResponse } from '../types'
import { LightspeedSettings } from '../types'

export class LightspeedAuthService {
  private readonly baseUrl = 'https://secure.retail.lightspeed.app'
  
  /**
   * Generate OAuth authorization URL
   * @param clientId - Your Lightspeed application client ID
   * @param redirectUri - Callback URL (must match app registration)
   * @param scope - Space-delimited list of scopes
   * @param state - CSRF protection state token (min 8 characters)
   */
  getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    scope: string = 'products:read sales:read customers:read inventory:read',
    state?: string
  ): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      state: state || this.generateState()
    })

    return `${this.baseUrl}/connect?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from callback
   * @param clientId - Your Lightspeed application client ID
   * @param clientSecret - Your Lightspeed application client secret
   * @param redirectUri - Must match the redirect URI used in authorization
   * @param domainPrefix - Domain prefix from authorization callback
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    domainPrefix: string
  ): Promise<POSOAuthTokenResponse> {
    // Token endpoint is on the retailer's domain
    const tokenUrl = `https://${domainPrefix}.retail.lightspeed.app/api/1.0/token`

    try {
      const formData = new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData.toString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        let error: POSOAuthErrorResponse
        
        try {
          error = JSON.parse(errorText)
        } catch {
          error = {
            error: 'unknown_error',
            error_description: errorText || response.statusText
          }
        }
        
        throw new Error(
          `Lightspeed Auth Error: ${error.error_description || error.error || response.statusText}`
        )
      }

      const tokenData: POSOAuthTokenResponse = await response.json()
      return tokenData
    } catch (error) {
      console.error('Error exchanging code for token:', error)
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token from previous token response
   * @param clientId - Your Lightspeed application client ID
   * @param clientSecret - Your Lightspeed application client secret
   * @param domainPrefix - Domain prefix for the retailer
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    domainPrefix: string
  ): Promise<POSOAuthTokenResponse> {
    const tokenUrl = `https://${domainPrefix}.retail.lightspeed.app/api/1.0/token`

    try {
      const formData = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token'
      })

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData.toString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        let error: POSOAuthErrorResponse
        
        try {
          error = JSON.parse(errorText)
        } catch {
          error = {
            error: 'unknown_error',
            error_description: errorText || response.statusText
          }
        }
        
        throw new Error(
          `Lightspeed Refresh Error: ${error.error_description || error.error || response.statusText}`
        )
      }

      const tokenData: POSOAuthTokenResponse = await response.json()
      return tokenData
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  /**
   * Check if token is expired or about to expire
   * @param tokenExpiry - Unix timestamp in seconds when token expires
   * @param bufferSeconds - Buffer time in seconds before expiry (default: 300 = 5 minutes)
   */
  isTokenExpired(tokenExpiry?: number, bufferSeconds: number = 300): boolean {
    if (!tokenExpiry) return true
    const now = Math.floor(Date.now() / 1000)
    return tokenExpiry <= (now + bufferSeconds)
  }

  /**
   * Get valid access token (refresh if needed)
   * @param settings - Lightspeed settings containing tokens
   * @param refreshCallback - Optional callback to save new tokens after refresh
   */
  async getValidAccessToken(
    settings: LightspeedSettings,
    refreshCallback?: (newToken: POSOAuthTokenResponse) => Promise<void>
  ): Promise<string> {
    // Check if we have a valid token
    if (
      settings.accessToken &&
      settings.tokenExpiry &&
      !this.isTokenExpired(settings.tokenExpiry)
    ) {
      return settings.accessToken
    }

    // Need to refresh
    if (!settings.refreshToken || !settings.clientId || !settings.clientSecret || !settings.domainPrefix) {
      throw new Error('Lightspeed credentials not configured. Please complete OAuth setup.')
    }

    const newToken = await this.refreshAccessToken(
      settings.refreshToken,
      settings.clientId,
      settings.clientSecret,
      settings.domainPrefix
    )

    // Update settings if callback provided
    if (refreshCallback) {
      await refreshCallback(newToken)
    }

    return newToken.access_token
  }

  /**
   * Generate random state token for CSRF protection (min 8 characters)
   */
  generateState(): string {
    // Generate a secure random state token (16+ characters)
    const randomBytes = new Uint8Array(16)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes)
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < randomBytes.length; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256)
      }
    }
    
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Validate state token (check if it matches and hasn't expired)
   */
  validateState(
    receivedState: string,
    storedState?: string,
    stateExpiry?: number
  ): boolean {
    if (!storedState || receivedState !== storedState) {
      return false
    }

    if (stateExpiry && Date.now() > stateExpiry * 1000) {
      return false // State expired (expiry is in seconds, convert to ms)
    }

    return true
  }
}

