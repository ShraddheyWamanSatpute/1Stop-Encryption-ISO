/**
 * POS Integration Types
 * Base types for POS system integrations (Lightspeed, Square, Toast, etc.)
 */

/**
 * POS Provider Type
 */
export type POSProvider = 'lightspeed' | 'square' | 'toast' | 'revel' | 'custom'

/**
 * Base POS Integration Settings
 */
export interface BasePOSIntegrationSettings {
  provider: POSProvider
  isEnabled: boolean
  isConnected: boolean
  connectedAt?: number
  lastSyncAt?: number
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  syncError?: string
  autoSyncEnabled: boolean
  autoSyncInterval: number // minutes
  createdAt: number
  updatedAt?: number
}

/**
 * Lightspeed Integration Settings
 */
export interface LightspeedSettings extends BasePOSIntegrationSettings {
  provider: 'lightspeed'
  
  // OAuth 2.0 Credentials
  clientId?: string
  clientSecret?: string // Should be encrypted in production
  redirectUri: string
  
  // Token Storage
  accessToken?: string // Should be encrypted
  refreshToken?: string // Should be encrypted
  tokenExpiry?: number // Unix timestamp (seconds)
  tokenType?: 'Bearer'
  
  // Store Information
  domainPrefix?: string // e.g., "example" from example.retail.lightspeed.app
  storeName?: string
  storeId?: string
  
  // Scope permissions granted
  scope?: string
  
  // OAuth State (for CSRF protection)
  oauthState?: string
  oauthStateExpiry?: number
  
  // Sync Configuration
  syncProducts: boolean
  syncSales: boolean
  syncCustomers: boolean
  syncInventory: boolean
  
  // Field Mapping
  productMapping?: {
    name: string
    sku: string
    price: string
    cost: string
    category: string
    quantity: string
  }
}

/**
 * OAuth Token Response
 */
export interface POSOAuthTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires: number // Absolute timestamp in seconds
  expires_in: number // Relative time in seconds
  refresh_token: string
  scope: string
  domain_prefix?: string // Lightspeed specific
}

/**
 * OAuth Error Response
 */
export interface POSOAuthErrorResponse {
  error: string
  error_description?: string
  error_uri?: string
}

/**
 * Product Sync Data
 */
export interface POSProduct {
  id: string
  name: string
  sku?: string
  description?: string
  price: number
  cost?: number
  quantity?: number
  category?: string
  categoryId?: string
  imageUrl?: string
  barcode?: string
  active: boolean
  metadata?: Record<string, unknown>
}

/**
 * Sale/Sales Transaction Sync Data
 */
export interface POSSale {
  id: string
  saleNumber?: string
  date: string // ISO date string
  time?: string
  items: POSSaleItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: 'pending' | 'completed' | 'refunded'
  customerId?: string
  customerName?: string
  metadata?: Record<string, unknown>
}

export interface POSSaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
  metadata?: Record<string, unknown>
}

/**
 * Customer Sync Data
 */
export interface POSCustomer {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  metadata?: Record<string, unknown>
}

/**
 * Inventory Sync Data
 */
export interface POSInventory {
  productId: string
  quantity: number
  locationId?: string
  locationName?: string
  lastUpdated: string // ISO date string
  metadata?: Record<string, unknown>
}

/**
 * Sync Result
 */
export interface POSSyncResult {
  success: boolean
  provider: POSProvider
  syncedAt: number
  products?: {
    created: number
    updated: number
    errors: number
  }
  sales?: {
    created: number
    updated: number
    errors: number
  }
  customers?: {
    created: number
    updated: number
    errors: number
  }
  inventory?: {
    updated: number
    errors: number
  }
  errors?: Array<{
    type: 'product' | 'sale' | 'customer' | 'inventory'
    id?: string
    message: string
  }>
}

/**
 * POS Integration Service Interface
 * All POS integration services should implement this
 */
export interface IPOSIntegrationService {
  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string
  
  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForToken(
    code: string,
    redirectUri: string,
    state?: string
  ): Promise<POSOAuthTokenResponse>
  
  /**
   * Refresh access token
   */
  refreshAccessToken(refreshToken: string): Promise<POSOAuthTokenResponse>
  
  /**
   * Check if token is expired
   */
  isTokenExpired(tokenExpiry?: number, bufferSeconds?: number): boolean
  
  /**
   * Get valid access token (refresh if needed)
   */
  getValidAccessToken(settings: BasePOSIntegrationSettings): Promise<string>
  
  /**
   * Sync products from POS system
   */
  syncProducts(settings: BasePOSIntegrationSettings): Promise<POSProduct[]>
  
  /**
   * Sync sales from POS system
   */
  syncSales(
    settings: BasePOSIntegrationSettings,
    startDate?: string,
    endDate?: string
  ): Promise<POSSale[]>
  
  /**
   * Sync customers from POS system
   */
  syncCustomers(settings: BasePOSIntegrationSettings): Promise<POSCustomer[]>
  
  /**
   * Sync inventory levels from POS system
   */
  syncInventory(settings: BasePOSIntegrationSettings): Promise<POSInventory[]>
  
  /**
   * Full sync (all enabled sync types)
   */
  fullSync(settings: BasePOSIntegrationSettings): Promise<POSSyncResult>
}

