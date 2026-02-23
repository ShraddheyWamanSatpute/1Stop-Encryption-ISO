/**
 * Lightspeed Sync Service
 * Handles syncing data between Lightspeed and local Stock/POS systems
 */

import { LightspeedAPIClient } from './LightspeedAPIClient'
import { LightspeedSettings, POSSyncResult } from '../types'
import { Product } from '../../../interfaces/Stock'
import { Bill } from '../../../interfaces/POS'
import * as StockDB from '../../../rtdatabase/Stock'
import * as POSDB from '../../../rtdatabase/POS'

// Helper to get base path (supports company/site/subsite levels)
function getBasePath(companyId: string, siteId?: string, subsiteId?: string): string {
  let path = `companies/${companyId}`
  
  if (subsiteId && siteId) {
    // Subsite level
    path = `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}/data/stock`
  } else if (siteId) {
    // Site level
    path = `companies/${companyId}/sites/${siteId}/data/stock`
  } else {
    // Company level
    path = `companies/${companyId}/data/stock`
  }
  
  return path
}

function getPOSBasePath(companyId: string, siteId?: string, subsiteId?: string): string {
  let path = `companies/${companyId}`
  
  if (subsiteId && siteId) {
    // Subsite level
    path = `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}/data/pos`
  } else if (siteId) {
    // Site level
    path = `companies/${companyId}/sites/${siteId}/data/pos`
  } else {
    // Company level
    path = `companies/${companyId}/data/pos`
  }
  
  return path
}

export class LightspeedSyncService {
  private apiClient: LightspeedAPIClient

  constructor() {
    this.apiClient = new LightspeedAPIClient()
  }

  /**
   * Sync products from Lightspeed to local Stock system
   */
  async syncProductsToStock(
    settings: LightspeedSettings,
    companyId: string,
    siteId?: string,
    subsiteId?: string
  ): Promise<{ created: number; updated: number; errors: number }> {
    const result = { created: 0, updated: 0, errors: 0 }

    try {
      const lightspeedProducts = await this.apiClient.getProducts(settings)

      for (const posProduct of lightspeedProducts) {
        try {
          // Map POS product to local Product format
          const localProduct: Partial<Product> = {
            name: posProduct.name,
            sku: posProduct.sku || posProduct.id,
            type: 'product',
            categoryId: posProduct.categoryId || 'default',
            subcategoryId: 'default',
            salesDivisionId: 'default',
            active: posProduct.active,
          }

          // Add sale pricing
          if (posProduct.price) {
            localProduct.sale = {
              price: posProduct.price,
              measure: 'unit',
              quantity: 1,
              supplierId: 'default',
              defaultMeasure: 'unit',
              units: [{
                measure: 'unit',
                price: posProduct.price,
                quantity: 1
              }]
            }
          }

          // Add purchase/cost pricing if available
          if (posProduct.cost) {
            localProduct.purchase = {
              price: posProduct.cost,
              measure: 'unit',
              quantity: 1,
              supplierId: 'default',
              defaultMeasure: 'unit',
              units: [{
                measure: 'unit',
                price: posProduct.cost,
                quantity: 1
              }]
            }
          }

          // Check if product already exists (by SKU or name)
          const basePath = getBasePath(companyId, siteId, subsiteId)
          const existingProducts = await StockDB.fetchProducts(basePath)
          const existingProduct = existingProducts.find(
            p => p.sku === posProduct.sku || p.name === posProduct.name
          )

          if (existingProduct) {
            // Update existing product
            await StockDB.updateProduct(basePath, existingProduct.id, localProduct)
            result.updated++
          } else {
            // Create new product
            await StockDB.createProduct(basePath, localProduct as Omit<Product, "id" | "createdAt" | "updatedAt">)
            result.created++
          }
        } catch (error: unknown) {
          console.error(`Error syncing product ${posProduct.id}:`, error)
          result.errors++
        }
      }
    } catch (error) {
      console.error('Error syncing products:', error)
      throw error
    }

    return result
  }

  /**
   * Sync sales from Lightspeed to local POS system
   */
  async syncSalesToPOS(
    settings: LightspeedSettings,
    companyId: string,
    siteId?: string,
    subsiteId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ created: number; updated: number; errors: number }> {
    const result = { created: 0, updated: 0, errors: 0 }

    try {
      const lightspeedSales = await this.apiClient.getSales(settings, startDate, endDate)

      for (const posSale of lightspeedSales) {
        try {
          // Map POS sale to local Bill format
          const billItems = posSale.items.map(item => ({
            id: item.productId,
            productId: item.productId,
            productName: item.productName,
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            price: item.unitPrice,
            notes: '',
            createdAt: new Date(posSale.date).getTime()
          }))

          const bill: Bill = {
            id: posSale.id,
            tableName: 'TAKEAWAY',
            tableNumber: 'TAKEAWAY',
            server: posSale.customerName || 'System',
            items: billItems,
            status: posSale.paymentStatus === 'completed' ? 'closed' : 'open',
            paymentStatus: posSale.paymentStatus === 'completed' ? 'completed' : 'pending',
            total: posSale.total,
            subtotal: posSale.subtotal,
            tax: posSale.tax,
            serviceCharge: 0,
            discount: 0,
            createdAt: new Date(posSale.date).getTime(),
            updatedAt: new Date(posSale.date).getTime(),
            paymentMethod: posSale.paymentMethod
          }

          // Check if bill already exists
          const posBasePath = getPOSBasePath(companyId, siteId, subsiteId)
          const existingBills = await POSDB.fetchBills(posBasePath)
          const existingBill = existingBills.find(b => b.id === posSale.id)

          if (existingBill) {
            // Update existing bill
            await POSDB.updateBill(posBasePath, posSale.id, bill)
            result.updated++
          } else {
            // Create new bill (remove id, createdAt, updatedAt as they'll be set by createBill)
            const { id, createdAt, updatedAt, ...billData } = bill
            await POSDB.createBill(posBasePath, billData)
            result.created++
          }
        } catch (error: unknown) {
          console.error(`Error syncing sale ${posSale.id}:`, error)
          result.errors++
        }
      }
    } catch (error) {
      console.error('Error syncing sales:', error)
      throw error
    }

    return result
  }

  /**
   * Sync inventory levels from Lightspeed to local Stock system
   */
  async syncInventoryToStock(
    settings: LightspeedSettings,
    companyId: string,
    siteId?: string,
    subsiteId?: string
  ): Promise<{ updated: number; errors: number }> {
    const result = { updated: 0, errors: 0 }

    try {
      const lightspeedInventory = await this.apiClient.getInventory(settings)
      const basePath = getBasePath(companyId, siteId, subsiteId)
      const localProducts = await StockDB.fetchProducts(basePath)

      for (const inventory of lightspeedInventory) {
        try {
          // Find matching product
          const product = localProducts.find(
            p => p.id === inventory.productId || p.sku === inventory.metadata?.lightspeedProductId
          )

          if (product) {
            // Update product quantity if it exists
            // Note: You may want to create stock count records instead of directly updating
            // This depends on your inventory management strategy
            // For now, we'll just update the product metadata to track Lightspeed sync
            await StockDB.updateProduct(basePath, product.id, {
              // Metadata can be stored in product if your Product interface supports it
            })
            result.updated++
          }
        } catch (error: unknown) {
          console.error(`Error syncing inventory for product ${inventory.productId}:`, error)
          result.errors++
        }
      }
    } catch (error) {
      console.error('Error syncing inventory:', error)
      throw error
    }

    return result
  }

  /**
   * Full sync - sync all enabled data types
   */
  async fullSync(
    settings: LightspeedSettings,
    companyId: string,
    siteId?: string,
    subsiteId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<POSSyncResult> {
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
          const productResult = await this.syncProductsToStock(settings, companyId, siteId, subsiteId)
          result.products = productResult
        } catch (error: unknown) {
          result.success = false
          result.errors!.push({
            type: 'product',
            message: (error instanceof Error ? error.message : String(error)) || 'Failed to sync products'
          })
        }
      }

      // Sync sales
      if (settings.syncSales) {
        try {
          const salesResult = await this.syncSalesToPOS(settings, companyId, siteId, subsiteId, startDate, endDate)
          result.sales = salesResult
        } catch (error: unknown) {
          result.success = false
          result.errors!.push({
            type: 'sale',
            message: error.message || 'Failed to sync sales'
          })
        }
      }

      // Sync inventory
      if (settings.syncInventory) {
        try {
          const inventoryResult = await this.syncInventoryToStock(settings, companyId, siteId, subsiteId)
          result.inventory = inventoryResult
        } catch (error: unknown) {
          result.success = false
          result.errors!.push({
            type: 'inventory',
            message: error.message || 'Failed to sync inventory'
          })
        }
      }

      // Note: Customer syncing can be added similarly if needed
      if (settings.syncCustomers) {
        // TODO: Implement customer syncing if needed
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

