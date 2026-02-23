/**
 * Lightspeed Retail (X-Series) API Client
 * Handles API calls to Lightspeed Retail API
 */

import { LightspeedAuthService } from './LightspeedAuthService'
import {
  LightspeedSettings,
  POSProduct,
  POSSale,
  POSCustomer,
  POSInventory,
  POSSyncResult
} from '../types'

interface LightspeedAPIResponse<T> {
  '@attributes'?: {
    count: string
    offset: string
    limit: string
  }
  [key: string]: T[] | unknown
}

interface LightspeedProduct {
  '@attributes': {
    id: string
  }
  description: string
  ItemShops?: {
    ItemShop?: Array<{
      shopID: string
      qoh: string // Quantity on hand
      price?: string
    }>
  }
  ItemECommerce?: {
    name?: string
    description?: string
  }
  ItemVendorNums?: {
    ItemVendorNum?: Array<{
      vendorID: string
      value: string // SKU
    }>
  }
  systemSku?: string
  ItemAttributeSets?: {
    ItemAttributeSet?: Array<{
      name: string
    }>
  }
  Prices?: {
    ItemPrice?: Array<{
      amount: string
      useType: string
    }>
  }
  CustomFieldValues?: Record<string, unknown>
}

interface LightspeedSale {
  '@attributes': {
    id: string
  }
  saleTime: string
  saleNumber: string
  total: string
  totalTax: string
  SaleLines?: {
    SaleLine?: Array<{
      '@attributes': {
        id: string
      }
      description: string
      quantity: string
      unitQuantity: string
      unitPrice: string
      unitDiscount?: string
      Item?: {
        '@attributes': {
          id: string
        }
        description: string
        systemSku?: string
      }
    }>
  }
  Customer?: {
    '@attributes': {
      id: string
    }
    firstName?: string
    lastName?: string
    Contact?: {
      Emails?: {
        ContactEmail?: Array<{
          address: string
        }>
      }
      Phones?: {
        ContactPhone?: Array<{
          number: string
        }>
      }
    }
  }
  Payments?: {
    SalePayment?: Array<{
      paymentTypeID: string
      amount: string
    }>
  }
}

interface LightspeedCustomer {
  '@attributes': {
    id: string
  }
  firstName?: string
  lastName?: string
  Contact?: {
    Emails?: {
      ContactEmail?: Array<{
        address: string
      }>
    }
    Phones?: {
      ContactPhone?: Array<{
        number: string
      }>
    }
    Addresses?: {
      ContactAddress?: Array<{
        address1?: string
        city?: string
        postalCode?: string
        country?: string
      }>
    }
  }
}

export class LightspeedAPIClient {
  private authService: LightspeedAuthService

  constructor() {
    this.authService = new LightspeedAuthService()
  }

  /**
   * Make authenticated API request
   */
  private async makeAPIRequest<T>(
    settings: LightspeedSettings,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const accessToken = await this.authService.getValidAccessToken(settings)
    const baseUrl = `https://${settings.domainPrefix}.retail.lightspeed.app/api`

    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lightspeed API Error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get products from Lightspeed
   * Note: The Lightspeed API response structure below is a placeholder.
   * You'll need to adjust the endpoint and response parsing based on the actual
   * Lightspeed Retail (X-Series) API documentation. The API typically uses XML
   * but may support JSON format. Check the API docs for the correct endpoint
   * structure (e.g., /API/Account/{accountId}/Item.json)
   */
  async getProducts(settings: LightspeedSettings): Promise<POSProduct[]> {
    try {
      // TODO: Update endpoint based on actual Lightspeed API documentation
      // Example: `/API/Account/{accountId}/Item.json` or similar
      const response = await this.makeAPIRequest<LightspeedAPIResponse<LightspeedProduct>>(
        settings,
        '/API/Account/Item.json', // Update this endpoint
        'GET'
      )

      const products: POSProduct[] = []
      
      // Parse Lightspeed response structure
      // This is a simplified parser - adjust based on actual API response
      if (response.Item) {
        const items = Array.isArray(response.Item) ? response.Item : [response.Item]
        
        for (const item of items) {
          const product: POSProduct = {
            id: item['@attributes']?.id || '',
            name: item.ItemECommerce?.name || item.description || 'Unknown Product',
            description: item.description || '',
            sku: item.systemSku || item.ItemVendorNums?.ItemVendorNum?.[0]?.value || '',
            price: parseFloat(item.Prices?.ItemPrice?.[0]?.amount || '0'),
            quantity: parseInt(
              item.ItemShops?.ItemShop?.[0]?.qoh || '0',
              10
            ),
            category: item.ItemAttributeSets?.ItemAttributeSet?.[0]?.name || '',
            active: true,
            metadata: {
              lightspeedId: item['@attributes']?.id,
              lightspeedData: item
            }
          }
          
          products.push(product)
        }
      }

      return products
    } catch (error) {
      console.error('Error fetching products from Lightspeed:', error)
      throw error
    }
  }

  /**
   * Get sales from Lightspeed
   */
  async getSales(
    settings: LightspeedSettings,
    startDate?: string,
    endDate?: string
  ): Promise<POSSale[]> {
    try {
      let endpoint = '/Sales'
      const params = new URLSearchParams()
      
      if (startDate) {
        params.append('timeStamp', `>,${startDate}`)
      }
      if (endDate) {
        params.append('timeStamp', `<,${endDate}`)
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response = await this.makeAPIRequest<LightspeedAPIResponse<LightspeedSale>>(
        settings,
        endpoint,
        'GET'
      )

      const sales: POSSale[] = []
      
      if (response.Sale) {
        const saleItems = Array.isArray(response.Sale) ? response.Sale : [response.Sale]
        
        for (const sale of saleItems as Record<string, unknown>[]) {
          const saleLines = (sale.SaleLines as { SaleLine?: unknown[] } | undefined)?.SaleLine || []
          const items = saleLines.map((line: Record<string, unknown>) => {
            const attrs = line['@attributes'] as { id?: string } | undefined
            const item = line.Item as Record<string, unknown> | undefined
            const itemAttrs = item?.['@attributes'] as { id?: string } | undefined
            return {
              productId: itemAttrs?.id ?? attrs?.id ?? '',
              productName: (line.description as string) || (item?.description as string) || 'Unknown',
              quantity: parseFloat((line.quantity as string) || '0'),
              unitPrice: parseFloat((line.unitPrice as string) || '0'),
              totalPrice: parseFloat((line.unitPrice as string) || '0') * parseFloat((line.quantity as string) || '0'),
              discount: parseFloat((line.unitDiscount as string) || '0')
            }
          })

          const saleAttrs = sale['@attributes'] as { id?: string } | undefined
          const customer = sale.Customer as Record<string, unknown> | undefined
          const customerAttrs = customer?.['@attributes'] as { id?: string } | undefined
          const payments = sale.Payments as { SalePayment?: Array<{ paymentTypeID?: string }> } | undefined
          const saleData: POSSale = {
            id: saleAttrs?.id ?? '',
            saleNumber: (sale.saleNumber as string) ?? '',
            date: sale.saleTime ? new Date(sale.saleTime as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            time: sale.saleTime ? new Date(sale.saleTime as string).toTimeString().split(' ')[0] : undefined,
            items,
            subtotal: parseFloat((sale.total as string) || '0') - parseFloat((sale.totalTax as string) || '0'),
            tax: parseFloat((sale.totalTax as string) || '0'),
            total: parseFloat((sale.total as string) || '0'),
            paymentMethod: payments?.SalePayment?.[0]?.paymentTypeID || 'unknown',
            paymentStatus: 'completed',
            customerId: customerAttrs?.id,
            customerName: customer
              ? `${(customer.firstName as string) || ''} ${(customer.lastName as string) || ''}`.trim()
              : undefined,
            metadata: {
              lightspeedId: saleAttrs?.id,
              lightspeedData: sale
            }
          }
          
          sales.push(saleData)
        }
      }

      return sales
    } catch (error) {
      console.error('Error fetching sales from Lightspeed:', error)
      throw error
    }
  }

  /**
   * Get customers from Lightspeed
   */
  async getCustomers(settings: LightspeedSettings): Promise<POSCustomer[]> {
    try {
      const response = await this.makeAPIRequest<LightspeedAPIResponse<LightspeedCustomer>>(
        settings,
        '/Customer',
        'GET'
      )

      const customers: POSCustomer[] = []
      
      if (response.Customer) {
        const customerItems = Array.isArray(response.Customer) ? response.Customer : [response.Customer]
        
        for (const customer of customerItems) {
          const contact = customer.Contact
          const email = contact?.Emails?.ContactEmail?.[0]?.address
          const phone = contact?.Phones?.ContactPhone?.[0]?.number
          const address = contact?.Addresses?.ContactAddress?.[0]

          const customerData: POSCustomer = {
            id: customer['@attributes']?.id || '',
            firstName: customer.firstName,
            lastName: customer.lastName,
            email,
            phone,
            address: address?.address1,
            city: address?.city,
            postalCode: address?.postalCode,
            country: address?.country,
            metadata: {
              lightspeedId: customer['@attributes']?.id,
              lightspeedData: customer
            }
          }
          
          customers.push(customerData)
        }
      }

      return customers
    } catch (error) {
      console.error('Error fetching customers from Lightspeed:', error)
      throw error
    }
  }

  /**
   * Get inventory levels from Lightspeed
   */
  async getInventory(settings: LightspeedSettings): Promise<POSInventory[]> {
    try {
      // Get products with inventory information
      const products = await this.getProducts(settings)
      
      const inventory: POSInventory[] = products
        .filter(p => p.quantity !== undefined)
        .map(product => ({
          productId: product.id,
          quantity: product.quantity || 0,
          lastUpdated: new Date().toISOString(),
          metadata: {
            lightspeedProductId: product.id,
            productName: product.name
          }
        }))

      return inventory
    } catch (error) {
      console.error('Error fetching inventory from Lightspeed:', error)
      throw error
    }
  }

  /**
   * Full sync - fetch all enabled data types
   */
  async fullSync(settings: LightspeedSettings): Promise<POSSyncResult> {
    const result: POSSyncResult = {
      success: true,
      provider: 'lightspeed',
      syncedAt: Date.now(),
      products: { created: 0, updated: 0, errors: 0 },
      sales: { created: 0, updated: 0, errors: 0 },
      customers: { created: 0, updated: 0, errors: 0 },
      inventory: { updated: 0, errors: 0 },
      errors: []
    }

    try {
      // Sync products
      if (settings.syncProducts) {
        try {
          await this.getProducts(settings)
          // Counts would be handled by the sync service
          result.products!.created = 0 // Will be updated by sync service
        } catch (error: unknown) {
          result.success = false
          result.products!.errors++
          result.errors!.push({
            type: 'product',
            message: error instanceof Error ? error.message : 'Failed to sync products'
          })
        }
      }

      // Sync sales (last 30 days by default)
      if (settings.syncSales) {
        try {
          const endDate = new Date().toISOString()
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          await this.getSales(settings, startDate, endDate)
        } catch (error: unknown) {
          result.success = false
          result.sales!.errors++
          result.errors!.push({
            type: 'sale',
            message: error instanceof Error ? error.message : 'Failed to sync sales'
          })
        }
      }

      // Sync customers
      if (settings.syncCustomers) {
        try {
          await this.getCustomers(settings)
        } catch (error: unknown) {
          result.success = false
          result.customers!.errors++
          result.errors!.push({
            type: 'customer',
            message: error instanceof Error ? error.message : 'Failed to sync customers'
          })
        }
      }

      // Sync inventory
      if (settings.syncInventory) {
        try {
          await this.getInventory(settings)
        } catch (error: unknown) {
          result.success = false
          result.inventory!.errors++
          result.errors!.push({
            type: 'inventory',
            message: error instanceof Error ? error.message : 'Failed to sync inventory'
          })
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors!.push({
        type: 'product',
        message: error.message || 'Sync failed'
      })
    }

    return result
  }
}

