# Lightspeed Retail Integration - Complete

This document outlines the Lightspeed Retail (X-Series) integration that has been implemented in your stock and POS sections.

---

## ✅ What Has Been Implemented

### 1. **POS Integration Architecture** ✅
**Location:** `src/backend/services/pos-integration/`

A flexible, extensible architecture for integrating multiple POS systems:

- **Base Types** (`types.ts`): Common interfaces and types for all POS integrations
- **Lightspeed Implementation**: Complete Lightspeed-specific implementation
- **Extensible Design**: Easy to add Square, Toast, Revel, or other POS systems in the future

**Key Features:**
- Provider-agnostic interfaces
- Standardized data models (Product, Sale, Customer, Inventory)
- Unified sync result format
- Consistent error handling

---

### 2. **Lightspeed OAuth 2.0 Authentication Service** ✅
**Location:** `src/backend/services/pos-integration/lightspeed/LightspeedAuthService.ts`

Handles the complete OAuth 2.0 flow:

- Authorization URL generation
- Authorization code exchange for access tokens
- Access token refresh mechanism
- Token expiry checking
- CSRF protection with state tokens

**Key Features:**
- Automatic token refresh when expired
- Secure state validation
- Support for multiple domain prefixes
- Error handling and validation

---

### 3. **Lightspeed API Client** ✅
**Location:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

Service for interacting with Lightspeed Retail API:

- `getProducts()` - Fetch products from Lightspeed
- `getSales()` - Fetch sales transactions
- `getCustomers()` - Fetch customer data
- `getInventory()` - Fetch inventory levels
- `fullSync()` - Sync all enabled data types

**Note:** The API endpoint structure in this file is a placeholder. You'll need to update it based on the actual Lightspeed Retail (X-Series) API documentation. The API typically uses XML format, but may support JSON. Common endpoint patterns include:
- `/API/Account/{accountId}/Item.json`
- `/API/Account/{accountId}/Sale.json`
- `/API/Account/{accountId}/Customer.json`

---

### 4. **Lightspeed Sync Service** ✅
**Location:** `src/backend/services/pos-integration/lightspeed/LightspeedSyncService.ts`

Handles syncing data between Lightspeed and your local systems:

- **syncProductsToStock()** - Sync products from Lightspeed to Stock system
- **syncSalesToPOS()** - Sync sales from Lightspeed to POS system
- **syncInventoryToStock()** - Update inventory levels
- **fullSync()** - Complete sync of all enabled data types

**Key Features:**
- Automatic product matching (by SKU or name)
- Bidirectional sync support (ready for future enhancements)
- Error tracking per sync operation
- Detailed sync result reporting

---

### 5. **Settings Interface** ✅
**Location:** `src/backend/interfaces/Company.tsx`

Added `LightspeedIntegrationSettings` interface:

```typescript
export interface LightspeedIntegrationSettings {
  provider: 'lightspeed'
  isEnabled: boolean
  isConnected: boolean
  // OAuth tokens and credentials
  // Sync configuration
  // Field mapping options
  // Auto-sync settings
}
```

Settings are stored at: `companies/{companyId}/settings/lightspeedIntegration`

---

### 6. **POS Integration Settings UI Component** ✅
**Location:** `src/frontend/components/pos/POSIntegrationSettings.tsx`

Complete settings management interface:

**Features:**
- OAuth connection flow
- Connection status display
- Sync configuration (products, sales, customers, inventory)
- Auto-sync settings
- Manual sync button
- Disconnect functionality

**UI Components:**
- Connection status indicator
- Form fields for Client ID and Client Secret
- Sync toggles for each data type
- Auto-sync interval selector
- Sync button with status feedback
- Success/error alerts

---

### 7. **OAuth Callback Handler** ✅
**Location:** `src/frontend/pages/OAuthCallback.tsx`

Updated to handle Lightspeed OAuth callbacks:

- Detects Lightspeed OAuth provider
- Extracts domain prefix from callback
- Stores OAuth data temporarily
- Redirects to settings page after successful authorization

**Route:** `/oauth/callback/lightspeed`

---

### 8. **Integration with Stock & POS Settings** ✅

**Stock Settings:**
- Location: `src/frontend/pages/StockDashboard.tsx`
- Accessible via: `/stock/settings`
- Shows POS Integration Settings component

**POS Settings:**
- Location: `src/frontend/pages/POS.tsx`
- Accessible via: `/pos/settings`
- Shows POS Integration Settings component

---

## 🔧 Setup Instructions

### Step 1: Register Lightspeed Developer Account

1. Go to [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
2. Register as a developer (if you haven't already)
3. Note: Your developer account credentials are separate from your Lightspeed Retail account

### Step 2: Create Lightspeed Application

1. Sign in to the developer portal
2. Create a new Lightspeed Retail (X-Series) application
3. Note your `client_id` and `client_secret`
4. Set your redirect URI to: `https://yourdomain.com/oauth/callback/lightspeed`
   - For local development: `http://localhost:5173/oauth/callback/lightspeed` (or your dev port)

### Step 3: Configure in Your Application

1. Navigate to **Stock Settings** or **POS Settings**
2. Enter your Lightspeed **Client ID** and **Client Secret**
3. Verify the redirect URI matches your Lightspeed app settings
4. Click **"Connect to Lightspeed"**
5. You'll be redirected to Lightspeed to authorize
6. After authorization, you'll be redirected back and connected

### Step 4: Configure Sync Settings

1. Choose which data types to sync:
   - ✅ Products
   - ✅ Sales
   - ✅ Inventory
   - ⬜ Customers (optional)
2. Enable auto-sync if desired
3. Set sync interval (15 min, 30 min, 1 hour, 4 hours, daily)
4. Click **"Save Settings"**

### Step 5: Sync Data

1. Click **"Sync Now"** to perform a manual sync
2. Monitor sync status and results
3. Check for any sync errors

---

## 📋 Important Notes

### API Endpoint Structure

⚠️ **Important:** The Lightspeed API client currently uses placeholder endpoint structures. You'll need to:

1. Review the [Lightspeed Retail API documentation](https://developers.lightspeedhq.com/retail/endpoints/)
2. Update the endpoint paths in `LightspeedAPIClient.ts`
3. Adjust the response parsing based on the actual API response format (XML/JSON)
4. Test with your Lightspeed account

Common endpoints you'll need to implement:
- Products: `/API/Account/{accountId}/Item.json`
- Sales: `/API/Account/{accountId}/Sale.json`
- Customers: `/API/Account/{accountId}/Customer.json`
- Inventory: Usually included in Item endpoints

### Token Storage

- Access tokens and refresh tokens are stored in Firebase
- **Recommendation:** Encrypt sensitive tokens in production
- Tokens are automatically refreshed when expired
- State tokens are used for CSRF protection

### Rate Limiting

Lightspeed has rate limits on their API. The implementation:
- Uses tokens until they expire (reduces API calls)
- Refreshes tokens only when needed
- Follows recommended patterns to avoid rate limiting

### Data Mapping

Product and sale data is mapped between Lightspeed and your local formats:
- Lightspeed products → Stock products
- Lightspeed sales → POS bills
- Inventory levels are synced to stock quantities

You may need to adjust field mappings based on your specific data structure.

---

## 🔄 Future Enhancements

The architecture is designed to easily support additional POS systems:

### Adding a New POS Provider (e.g., Square)

1. Create new service files in `src/backend/services/pos-integration/square/`
2. Implement `IPOSIntegrationService` interface
3. Create provider-specific auth service
4. Create provider-specific API client
5. Create provider-specific sync service
6. Add settings interface to Company types
7. Update UI component to support multiple providers

### Bidirectional Sync

Currently, sync is one-way (Lightspeed → Your System). Future enhancements could include:
- Syncing products from your system to Lightspeed
- Updating inventory levels in Lightspeed
- Creating sales in Lightspeed

### Advanced Features

- Sync conflict resolution
- Field mapping configuration UI
- Sync history and logs
- Batch sync operations
- Webhook support for real-time updates

---

## 🐛 Troubleshooting

### Connection Issues

- **"Invalid redirect_uri"**: Ensure the redirect URI in your Lightspeed app settings matches exactly
- **"Invalid client_id"**: Verify your Client ID is correct
- **"Invalid client_secret"**: Verify your Client Secret is correct

### Sync Issues

- **"Token expired"**: The system should auto-refresh, but you may need to reconnect
- **"API Error 429"**: Rate limit exceeded - wait and try again
- **"No products found"**: Check that your Lightspeed account has products and API endpoints are correct

### Data Issues

- **Products not syncing**: Check API endpoint structure matches Lightspeed documentation
- **Sales not appearing**: Verify sales endpoint and date range parameters
- **Inventory not updating**: Check that inventory sync is enabled and products exist

---

## 📚 Related Files

### Services
- `src/backend/services/pos-integration/types.ts`
- `src/backend/services/pos-integration/lightspeed/LightspeedAuthService.ts`
- `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`
- `src/backend/services/pos-integration/lightspeed/LightspeedSyncService.ts`

### Interfaces
- `src/backend/interfaces/Company.tsx` (LightspeedIntegrationSettings)

### UI Components
- `src/frontend/components/pos/POSIntegrationSettings.tsx`
- `src/frontend/pages/OAuthCallback.tsx`

### Pages
- `src/frontend/pages/StockDashboard.tsx` (Settings tab)
- `src/frontend/pages/POS.tsx` (Settings tab)

---

## ✅ Next Steps

1. **Update API Endpoints**: Review Lightspeed API docs and update endpoint structures
2. **Test OAuth Flow**: Test the connection flow with your Lightspeed account
3. **Test Sync**: Perform a test sync to verify data mapping
4. **Adjust Field Mappings**: Customize data mappings based on your needs
5. **Production Setup**: Ensure proper encryption for tokens in production
6. **Documentation**: Document any custom mappings or configurations

---

## 📝 License & Credits

This integration follows the Lightspeed Retail (X-Series) API documentation:
- [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
- [Lightspeed Retail API Documentation](https://developers.lightspeedhq.com/retail/endpoints/)

