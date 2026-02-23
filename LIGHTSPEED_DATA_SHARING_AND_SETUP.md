# Lightspeed Integration - Data Sharing & Setup Guide

## 📊 Data Sharing Capabilities

### Currently Implemented (One-Way: Lightspeed → Your System) ✅

Currently, the integration supports **one-way synchronization** from Lightspeed to your system:

#### 1. **Products** → Stock System
**Direction:** Lightspeed → Your Stock System

**Data Synced:**
- ✅ Product Name
- ✅ SKU/Product ID
- ✅ Description
- ✅ Price (Sale Price)
- ✅ Cost (Purchase Price) - if available
- ✅ Quantity/Inventory Level
- ✅ Category
- ✅ Active/Inactive Status

**How It Works:**
- Products from Lightspeed are imported into your Stock system
- Matching is done by SKU or Product Name
- If product exists → Updates existing product
- If product doesn't exist → Creates new product
- Products are mapped to your local Product structure

**Sync Location:** `Stock Settings` or `POS Settings` → Sync Now

---

#### 2. **Sales/Transactions** → POS System
**Direction:** Lightspeed → Your POS System

**Data Synced:**
- ✅ Sale ID
- ✅ Sale Number
- ✅ Sale Date & Time
- ✅ Line Items (Products in sale)
- ✅ Quantities
- ✅ Unit Prices
- ✅ Discounts
- ✅ Subtotal, Tax, Total
- ✅ Payment Method
- ✅ Payment Status
- ✅ Customer Information (if available)

**How It Works:**
- Sales from Lightspeed are imported as Bills in your POS system
- Supports date range filtering (default: last 30 days)
- Sales are mapped to your local Bill structure
- Items are converted to BillItems

**Sync Location:** `POS Settings` → Sync Now

---

#### 3. **Inventory Levels** → Stock System
**Direction:** Lightspeed → Your Stock System

**Data Synced:**
- ✅ Product Quantity on Hand (QOH)
- ✅ Location-specific inventory (if multi-location)
- ✅ Last Updated timestamp

**How It Works:**
- Inventory levels from Lightspeed update your product quantities
- Matches products by Product ID or SKU
- Can update multiple locations if configured

**Note:** Currently implemented but may need refinement based on your inventory management strategy (direct quantity updates vs. stock count records)

---

#### 4. **Customers** (Placeholder)
**Direction:** Lightspeed → Your System (Not Yet Implemented)

**Could Sync:**
- ⬜ Customer ID
- ⬜ First Name, Last Name
- ⬜ Email Address
- ⬜ Phone Number
- ⬜ Address Information
- ⬜ Purchase History
- ⬜ Customer Tags/Segments

**Status:** Structure is ready, implementation needed in `LightspeedSyncService.ts`

---

### Bidirectional Sync Potential (Future Enhancement) 🔄

The architecture supports bidirectional sync, but it's **not currently implemented**. Here's what could be shared both ways:

#### 1. **Products** (Bidirectional Potential)

**Current:** Lightspeed → Your System ✅

**Could Add:** Your System → Lightspeed

**What Could Be Pushed to Lightspeed:**
- ✅ Product Name
- ✅ SKU/Barcode
- ✅ Description
- ✅ Sale Price
- ✅ Cost Price
- ✅ Category Assignment
- ✅ Images
- ✅ Variants/Options
- ✅ Active/Inactive Status

**Use Cases:**
- Create new products in Lightspeed from your Stock system
- Update prices in Lightspeed when changed in your system
- Sync product status changes
- Push product images

---

#### 2. **Inventory Levels** (Bidirectional Potential)

**Current:** Lightspeed → Your System ✅

**Could Add:** Your System → Lightspeed

**What Could Be Pushed to Lightspeed:**
- ✅ Quantity on Hand (QOH)
- ✅ Location-specific inventory
- ✅ Stock adjustments
- ✅ Stock count results

**Use Cases:**
- Update Lightspeed inventory after stock counts
- Push inventory adjustments
- Sync inventory across locations

---

#### 3. **Sales/Orders** (Bidirectional Potential)

**Current:** Lightspeed → Your System ✅

**Could Add:** Your System → Lightspeed

**What Could Be Pushed to Lightspeed:**
- ✅ New Sales/Orders
- ✅ Sale Line Items
- ✅ Customer Assignment
- ✅ Payment Information
- ✅ Discounts/Promotions Applied

**Use Cases:**
- Create sales in Lightspeed from your POS system
- Sync online orders to Lightspeed
- Update sale status/completion

**Note:** This would require careful handling to avoid duplicate sales and ensure data integrity.

---

#### 4. **Customers** (Bidirectional Potential)

**Could Add:** Both Directions

**What Could Be Synced:**
- ✅ Customer Profiles
- ✅ Contact Information
- ✅ Purchase History
- ✅ Customer Tags/Segments
- ✅ Loyalty Points/Balance
- ✅ Preferences

**Use Cases:**
- Sync customer data for unified customer view
- Update customer information in both systems
- Merge duplicate customer records

---

#### 5. **Categories** (Bidirectional Potential)

**Could Add:** Both Directions

**What Could Be Synced:**
- ✅ Category Names
- ✅ Category Hierarchy
- ✅ Category Descriptions
- ✅ Category Images

---

#### 6. **Price Lists** (Bidirectional Potential)

**Could Add:** Both Directions

**What Could Be Synced:**
- ✅ Regular Prices
- ✅ Sale Prices
- ✅ Volume Pricing
- ✅ Customer-Specific Pricing
- ✅ Promotional Pricing

---

## ⚙️ Setup Checklist

### Step 1: Lightspeed Developer Account Setup ✅ REQUIRED

- [ ] Register at [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
- [ ] Create a Lightspeed Retail (X-Series) application
- [ ] Note your **Client ID** and **Client Secret**
- [ ] Set redirect URI to: `https://yourdomain.com/oauth/callback/lightspeed`
  - For local dev: `http://localhost:5173/oauth/callback/lightspeed` (adjust port if needed)
- [ ] Review API scopes needed:
  - `products:read` - Required for product sync
  - `sales:read` - Required for sales sync
  - `customers:read` - Required for customer sync (optional)
  - `inventory:read` - Required for inventory sync
  - `products:write` - Needed for bidirectional product sync (future)
  - `sales:write` - Needed for bidirectional sales sync (future)
  - `inventory:write` - Needed for bidirectional inventory sync (future)

---

### Step 2: Update API Endpoints ⚠️ CRITICAL

**Location:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

The current implementation uses placeholder endpoints. You **MUST** update these based on actual Lightspeed API documentation:

#### Required Updates:

1. **Product Endpoint** (Line ~197)
   ```typescript
   // Current (placeholder):
   '/API/Account/Item.json'
   
   // Update to actual endpoint, e.g.:
   '/API/Account/{accountId}/Item.json'
   // or based on Lightspeed docs
   ```

2. **Sales Endpoint** (Line ~247)
   ```typescript
   // Current (placeholder):
   '/Sales'
   
   // Update to actual endpoint
   ```

3. **Customer Endpoint** (if implementing)
   ```typescript
   // Add endpoint based on Lightspeed docs
   ```

4. **Response Parsing** (Lines ~200-230)
   - Update response structure parsing based on actual API response format
   - Lightspeed API may return XML or JSON
   - Adjust field mapping to match actual response structure

**Resources:**
- [Lightspeed Retail API Documentation](https://developers.lightspeedhq.com/retail/endpoints/)
- [Lightspeed API Reference](https://developers.lightspeedhq.com/retail/endpoints/Item/)

---

### Step 3: Test OAuth Connection ✅ REQUIRED

- [ ] Navigate to `Stock Settings` or `POS Settings`
- [ ] Enter your Lightspeed Client ID
- [ ] Enter your Lightspeed Client Secret
- [ ] Verify redirect URI matches Lightspeed app settings
- [ ] Click "Connect to Lightspeed"
- [ ] Complete OAuth authorization in Lightspeed
- [ ] Verify successful connection (should show "Connected" status)
- [ ] Verify domain prefix is saved correctly

---

### Step 4: Configure Sync Settings ✅ REQUIRED

- [ ] Choose which data types to sync:
  - [ ] Products (recommended)
  - [ ] Sales (recommended)
  - [ ] Inventory (recommended)
  - [ ] Customers (optional)
- [ ] Configure auto-sync (if desired):
  - [ ] Enable auto-sync
  - [ ] Set sync interval (15 min, 30 min, 1 hour, 4 hours, daily)
- [ ] Click "Save Settings"

---

### Step 5: Test Data Sync ✅ REQUIRED

- [ ] Perform manual sync: Click "Sync Now"
- [ ] Check sync status and results
- [ ] Verify products appear in Stock system
- [ ] Verify sales appear in POS system
- [ ] Verify inventory levels update correctly
- [ ] Check for any sync errors
- [ ] Review data mapping (names, prices, categories, etc.)

---

### Step 6: Data Mapping Customization ⚠️ RECOMMENDED

**Location:** `src/backend/services/pos-integration/lightspeed/LightspeedSyncService.ts`

You may need to adjust field mappings based on your data structure:

#### Product Mapping (Lines ~44-84)
- [ ] Verify category mapping (may need to create categories first)
- [ ] Adjust default category/subcategory/salesDivision IDs
- [ ] Map additional fields if needed (barcode, images, etc.)
- [ ] Handle product variants/options if applicable

#### Sale Mapping (Lines ~132-162)
- [ ] Verify payment method mapping
- [ ] Adjust table/server assignments
- [ ] Handle discounts/promotions correctly
- [ ] Map customer information if needed

#### Inventory Mapping (Lines ~207-228)
- [ ] Determine inventory update strategy:
  - Direct quantity updates
  - Create stock count records
  - Update specific locations
- [ ] Handle multi-location inventory if applicable

---

### Step 7: Production Setup ⚠️ IMPORTANT

- [ ] **Encrypt Tokens** (Highly Recommended)
  - Currently tokens are stored in plain text in Firebase
  - Implement encryption for `accessToken` and `refreshToken`
  - Consider using Firebase App Check for additional security

- [ ] **Update Redirect URI** for production
  - Change from localhost to production domain
  - Update in both Lightspeed app settings and code

- [ ] **Set Up Error Monitoring**
  - Monitor sync errors
  - Set up alerts for failed syncs
  - Log sync activity for auditing

- [ ] **Test Rate Limits**
  - Understand Lightspeed API rate limits
  - Implement backoff/retry logic if needed
  - Monitor API usage

- [ ] **Backup Strategy**
  - Ensure sync doesn't overwrite critical data
  - Consider backup before first sync
  - Test restore procedures

---

### Step 8: Optional Enhancements

#### Customer Sync Implementation
- [ ] Implement customer syncing in `LightspeedSyncService.ts`
- [ ] Create customer mapping logic
- [ ] Handle duplicate customers
- [ ] Sync customer purchase history

#### Bidirectional Sync (Future)
- [ ] Implement push products to Lightspeed
- [ ] Implement push inventory to Lightspeed
- [ ] Implement push sales to Lightspeed
- [ ] Add conflict resolution logic
- [ ] Add sync direction settings (one-way, bidirectional)

#### Advanced Features
- [ ] Add sync history/logs UI
- [ ] Implement field mapping configuration UI
- [ ] Add webhook support for real-time updates
- [ ] Implement sync conflict resolution
- [ ] Add batch sync operations
- [ ] Create sync reports

---

## 🔍 Testing Checklist

### OAuth Flow Testing
- [ ] Test successful OAuth connection
- [ ] Test OAuth error handling (invalid credentials)
- [ ] Test token refresh
- [ ] Test expired token handling
- [ ] Test disconnect/reconnect flow

### Product Sync Testing
- [ ] Test product import (new products)
- [ ] Test product update (existing products)
- [ ] Test product matching (SKU vs Name)
- [ ] Test products with categories
- [ ] Test products with variants
- [ ] Test large product catalogs (pagination)
- [ ] Test error handling (missing fields, invalid data)

### Sales Sync Testing
- [ ] Test sales import (new sales)
- [ ] Test sales update (existing sales)
- [ ] Test date range filtering
- [ ] Test sales with multiple items
- [ ] Test sales with discounts
- [ ] Test sales with customers
- [ ] Test sales with different payment methods

### Inventory Sync Testing
- [ ] Test inventory quantity updates
- [ ] Test multi-location inventory
- [ ] Test inventory for products with variants
- [ ] Test inventory sync frequency

### Error Handling Testing
- [ ] Test network failures
- [ ] Test API errors (401, 403, 404, 429, 500)
- [ ] Test invalid data handling
- [ ] Test partial sync failures
- [ ] Test token expiry during sync

---

## 📋 Current Limitations

1. **One-Way Sync Only**: Currently only syncs FROM Lightspeed TO your system
2. **API Endpoints**: Need to be updated with actual Lightspeed API endpoints
3. **Response Parsing**: Needs adjustment based on actual API response format
4. **Customer Sync**: Not yet implemented
5. **Conflict Resolution**: No conflict resolution for data conflicts
6. **Token Encryption**: Tokens stored in plain text (should encrypt for production)
7. **Error Recovery**: Limited retry logic for failed syncs
8. **Webhooks**: No real-time sync (only manual/scheduled syncs)

---

## 🎯 Quick Start Summary

1. **Get Lightspeed Credentials**
   - Register at Lightspeed Developer Portal
   - Create application
   - Get Client ID and Client Secret

2. **Update API Endpoints**
   - Review Lightspeed API docs
   - Update endpoints in `LightspeedAPIClient.ts`
   - Update response parsing

3. **Connect**
   - Go to Stock/POS Settings
   - Enter credentials
   - Click "Connect to Lightspeed"

4. **Configure**
   - Choose what to sync
   - Set auto-sync (optional)

5. **Test**
   - Click "Sync Now"
   - Verify data appears correctly

6. **Production**
   - Encrypt tokens
   - Update redirect URI
   - Monitor and test

---

## 📞 Support & Resources

- **Lightspeed Developer Portal**: https://developers.lightspeedhq.com
- **Lightspeed API Docs**: https://developers.lightspeedhq.com/retail/endpoints/
- **Lightspeed Support**: Contact through developer portal

---

**Last Updated:** [Current Date]
**Status:** One-way sync implemented, bidirectional sync ready for future implementation

