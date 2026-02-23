# Lightspeed Integration - Developer TODO List

## ✅ What's Complete

- ✅ OAuth 2.0 authentication flow
- ✅ Token management and refresh
- ✅ Settings storage (company/site/subsite levels)
- ✅ UI components and connection guide
- ✅ Sync service architecture
- ✅ Data mapping structure
- ✅ Multi-level support (company/site/subsite)
- ✅ Error handling framework

---

## 🔧 What's Left to Do

### 1. Update API Endpoints ⚠️ **CRITICAL**

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

#### Current Status:
- Endpoints are placeholders
- Response parsing is based on assumed structure

#### Tasks:

##### A. Update Product Endpoint (Line ~197)
```typescript
// CURRENT (placeholder):
'/API/Account/Item.json'

// NEEDS TO BE UPDATED TO:
// Based on actual Lightspeed API documentation
// Example: '/API/Account/{accountId}/Item.json'
// Or: '/API/Account/Item.json' (if accountId is in headers)
```

**Action Items:**
- [ ] Review [Lightspeed API Documentation](https://developers.lightspeedhq.com/retail/endpoints/Item/)
- [ ] Determine correct endpoint structure
- [ ] Check if account ID is needed in URL or headers
- [ ] Update endpoint path
- [ ] Test endpoint with actual API

##### B. Update Sales Endpoint (Line ~247)
```typescript
// CURRENT (placeholder):
'/Sales'

// NEEDS TO BE UPDATED TO:
// Based on actual Lightspeed API documentation
// Example: '/API/Account/{accountId}/Sale.json'
```

**Action Items:**
- [ ] Review [Lightspeed Sales API Documentation](https://developers.lightspeedhq.com/retail/endpoints/Sale/)
- [ ] Determine correct endpoint structure
- [ ] Update endpoint path
- [ ] Test endpoint with actual API

##### C. Update Customer Endpoint (if implementing customer sync)
```typescript
// CURRENT: Not implemented
// NEEDS TO BE ADDED:
// Based on Lightspeed Customer API documentation
```

**Action Items:**
- [ ] Review [Lightspeed Customer API Documentation](https://developers.lightspeedhq.com/retail/endpoints/Customer/)
- [ ] Add customer endpoint
- [ ] Implement customer fetching logic
- [ ] Test endpoint with actual API

##### D. Update Inventory Endpoint
```typescript
// CURRENT: Uses products endpoint
// MAY NEED SEPARATE ENDPOINT:
// Check if Lightspeed has dedicated inventory endpoint
```

**Action Items:**
- [ ] Check if Lightspeed has separate inventory endpoint
- [ ] Update if needed, or confirm products endpoint includes inventory
- [ ] Test inventory data retrieval

---

### 2. Update Response Parsing ⚠️ **CRITICAL**

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

#### Current Status:
- Response parsing assumes XML-like structure with `@attributes`
- Field mappings are placeholders

#### Tasks:

##### A. Products Response Parsing (Lines ~200-230)
```typescript
// CURRENT: Assumes structure like:
if (response.Item) {
  const items = Array.isArray(response.Item) ? response.Item : [response.Item]
  // ...
}

// NEEDS TO BE UPDATED TO:
// Match actual Lightspeed API response structure
// Could be XML or JSON format
// Check actual response structure from API
```

**Action Items:**
- [ ] Make test API call to get actual response structure
- [ ] Determine if response is XML or JSON
- [ ] Update parsing logic to match actual structure
- [ ] Map all required fields correctly:
  - [ ] Product ID
  - [ ] Product Name
  - [ ] SKU
  - [ ] Price
  - [ ] Cost
  - [ ] Quantity
  - [ ] Category
  - [ ] Description
  - [ ] Active status
- [ ] Handle edge cases (missing fields, null values, etc.)

##### B. Sales Response Parsing (Lines ~267-310)
```typescript
// CURRENT: Assumes structure like:
if (response.Sale) {
  const saleItems = Array.isArray(response.Sale) ? response.Sale : [response.Sale]
  // ...
}

// NEEDS TO BE UPDATED TO:
// Match actual Lightspeed API response structure
```

**Action Items:**
- [ ] Make test API call to get actual sales response structure
- [ ] Update parsing logic to match actual structure
- [ ] Map all required fields correctly:
  - [ ] Sale ID
  - [ ] Sale Number
  - [ ] Date/Time
  - [ ] Line Items
  - [ ] Totals (subtotal, tax, total)
  - [ ] Payment Method
  - [ ] Customer Information
- [ ] Handle date format conversion
- [ ] Handle multiple line items correctly

##### C. Customer Response Parsing (if implementing)
```typescript
// CURRENT: Not implemented
// NEEDS TO BE ADDED:
// Based on actual Lightspeed Customer API response
```

**Action Items:**
- [ ] Make test API call to get actual customer response structure
- [ ] Implement parsing logic
- [ ] Map all required fields correctly

---

### 3. Handle API Authentication ⚠️ **IMPORTANT**

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

#### Current Status:
- Uses Bearer token authentication
- May need account ID or other headers

#### Tasks:

- [ ] Verify authentication method (Bearer token is correct)
- [ ] Check if account ID needs to be in headers
- [ ] Check if any other headers are required
- [ ] Test authentication with actual API
- [ ] Handle authentication errors properly

---

### 4. Handle API Rate Limiting ⚠️ **IMPORTANT**

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

#### Current Status:
- Basic error handling exists
- No specific rate limit handling

#### Tasks:

- [ ] Research Lightspeed API rate limits
- [ ] Implement rate limit detection (429 status code)
- [ ] Add retry logic with exponential backoff
- [ ] Add rate limit headers parsing (if provided)
- [ ] Add rate limit warnings in UI
- [ ] Test rate limit handling

---

### 5. Implement Pagination ⚠️ **IMPORTANT**

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

#### Current Status:
- No pagination handling
- May only fetch first page of results

#### Tasks:

- [ ] Check if Lightspeed API uses pagination
- [ ] If yes, implement pagination logic:
  - [ ] Detect pagination parameters
  - [ ] Fetch all pages
  - [ ] Combine results
- [ ] Handle large datasets efficiently
- [ ] Add progress indicators for large syncs

---

### 6. Error Handling Improvements

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedAPIClient.ts`

#### Tasks:

- [ ] Add specific error handling for common Lightspeed API errors
- [ ] Parse and display meaningful error messages
- [ ] Handle network timeouts
- [ ] Handle invalid token errors
- [ ] Handle permission errors
- [ ] Add error logging for debugging

---

### 7. Data Mapping Refinement

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedSyncService.ts`

#### Current Status:
- Basic mapping exists
- May need refinement based on actual data

#### Tasks:

- [ ] Test actual data mapping with real Lightspeed data
- [ ] Adjust field mappings if needed
- [ ] Handle data type conversions (dates, numbers, etc.)
- [ ] Handle missing or null values
- [ ] Add data validation
- [ ] Handle special characters and encoding

---

### 8. Customer Sync Implementation

**File:** `src/backend/services/pos-integration/lightspeed/LightspeedSyncService.ts`

#### Current Status:
- Structure exists but not implemented (Line ~302)

#### Tasks:

- [ ] Implement `syncCustomersToSystem()` method
- [ ] Add customer mapping logic
- [ ] Handle duplicate customers
- [ ] Test customer sync
- [ ] Add to fullSync method

---

### 9. Testing & Validation

#### Tasks:

- [ ] **Unit Tests:**
  - [ ] Test OAuth flow
  - [ ] Test token refresh
  - [ ] Test API client methods
  - [ ] Test sync service methods
  - [ ] Test error handling

- [ ] **Integration Tests:**
  - [ ] Test full OAuth connection flow
  - [ ] Test product sync with real data
  - [ ] Test sales sync with real data
  - [ ] Test inventory sync with real data
  - [ ] Test error scenarios

- [ ] **End-to-End Tests:**
  - [ ] Test complete connection and sync process
  - [ ] Test with multiple companies
  - [ ] Test with multiple sites/subsites
  - [ ] Test auto-sync functionality

---

### 10. Production Readiness

#### Tasks:

- [ ] **Security:**
  - [ ] Implement token encryption (currently plain text)
  - [ ] Secure credential storage
  - [ ] Add input validation
  - [ ] Add output sanitization

- [ ] **Performance:**
  - [ ] Optimize API calls (batch if possible)
  - [ ] Add caching where appropriate
  - [ ] Optimize large data syncs
  - [ ] Add progress tracking for long syncs

- [ ] **Monitoring:**
  - [ ] Add logging for sync operations
  - [ ] Add error tracking
  - [ ] Add sync metrics
  - [ ] Add alerts for failed syncs

- [ ] **Documentation:**
  - [ ] Document API endpoint structure
  - [ ] Document response formats
  - [ ] Document error codes
  - [ ] Document rate limits
  - [ ] Update setup guides with actual endpoints

---

## 📋 Priority Order

### High Priority (Must Do Before Production)
1. ✅ Update API endpoints (Task 1)
2. ✅ Update response parsing (Task 2)
3. ✅ Handle API authentication (Task 3)
4. ✅ Test with actual Lightspeed account (Task 9)

### Medium Priority (Should Do)
5. ✅ Handle rate limiting (Task 4)
6. ✅ Implement pagination (Task 5)
7. ✅ Improve error handling (Task 6)
8. ✅ Refine data mapping (Task 7)

### Low Priority (Nice to Have)
9. ✅ Implement customer sync (Task 8)
10. ✅ Production security enhancements (Task 10)

---

## 🔍 How to Get Started

### Step 1: Get Lightspeed API Documentation
1. Go to [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
2. Navigate to API Documentation
3. Find Retail (X-Series) API docs
4. Review endpoint structures

### Step 2: Set Up Test Environment
1. Create a test Lightspeed application
2. Connect it to a test Lightspeed Retail account
3. Get test credentials

### Step 3: Test API Calls
1. Use Postman or similar tool to test endpoints
2. Document actual response structures
3. Note any required headers or parameters

### Step 4: Update Code
1. Update endpoints in `LightspeedAPIClient.ts`
2. Update response parsing
3. Test each endpoint individually

### Step 5: Test Integration
1. Test OAuth flow end-to-end
2. Test each sync type (products, sales, inventory)
3. Test error scenarios
4. Test with real data

---

## 📚 Resources

- [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
- [Lightspeed Retail API Documentation](https://developers.lightspeedhq.com/retail/endpoints/)
- [Lightspeed API Reference](https://developers.lightspeedhq.com/retail/endpoints/Item/)

---

## ✅ Quick Checklist

Copy this checklist and check off items as you complete them:

```
API Endpoints:
[ ] Update products endpoint
[ ] Update sales endpoint  
[ ] Update customers endpoint (if needed)
[ ] Update inventory endpoint (if separate)

Response Parsing:
[ ] Update products response parsing
[ ] Update sales response parsing
[ ] Update customers response parsing (if needed)
[ ] Test with actual API responses

Authentication:
[ ] Verify authentication method
[ ] Test authentication
[ ] Handle auth errors

Rate Limiting:
[ ] Research rate limits
[ ] Implement rate limit handling
[ ] Test rate limit scenarios

Pagination:
[ ] Check if pagination needed
[ ] Implement pagination (if needed)
[ ] Test with large datasets

Error Handling:
[ ] Add specific error handling
[ ] Test error scenarios
[ ] Improve error messages

Data Mapping:
[ ] Test with real data
[ ] Refine mappings
[ ] Handle edge cases

Customer Sync:
[ ] Implement customer sync
[ ] Test customer sync

Testing:
[ ] Unit tests
[ ] Integration tests
[ ] End-to-end tests

Production:
[ ] Token encryption
[ ] Performance optimization
[ ] Monitoring/logging
[ ] Documentation
```

---

**Last Updated:** [Current Date]
**Status:** Architecture complete, API integration pending

